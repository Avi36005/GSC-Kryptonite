import { BiasDetectionAgent } from './BiasDetectionAgent.js';
import { ExplanationAgent } from './ExplanationAgent.js';
import { ComplianceAgent } from './ComplianceAgent.js';
import { RiskAssessmentAgent } from './RiskAssessmentAgent.js';
import { getDomainConfig } from '../domains/index.js';
import { firestoreService } from '../services/firestoreService.js';
import { pubsubService } from '../services/pubsubService.js';
import { bigqueryService } from '../services/bigqueryService.js';

export class DecisionGuardAgent {
  constructor() {
    this.biasAgent = new BiasDetectionAgent();
    this.complianceAgent = new ComplianceAgent();
    this.explanationAgent = new ExplanationAgent();
    this.riskAgent = new RiskAssessmentAgent();
  }

  /**
   * The interceptor gateway. Takes the raw decision, passes it through agents, and returns the mitigated result.
   */
  async evaluate(decisionId, features, prediction, domainContext = 'hiring') {
    console.log(`[DecisionGuard] Intercepting Decision ${decisionId} under domain: ${domainContext}...`);

    const domainConfig = getDomainConfig(domainContext);
    const SLA_TIMEOUT = 30000; // 30 seconds SLA

    try {
      // 1. Run Bias and Risk Assessment in parallel (independent)
      // We wrap them in a timeout race to ensure SLA compliance
      const evaluationPromise = (async () => {
        const [biasReport, riskReport] = await Promise.all([
          this.biasAgent.analyzeDecision(features, prediction, domainConfig),
          this.riskAgent.assessRisk(features, prediction, domainConfig)
        ]);

        // 2. Check Compliance (depends on biasReport)
        const complianceReport = await this.complianceAgent.verify(features, prediction, biasReport, domainConfig);

        return { biasReport, riskReport, complianceReport };
      })();

      // SLA Timeout mechanism
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SLA_TIMEOUT')), SLA_TIMEOUT)
      );

      let reports;
      try {
        reports = await Promise.race([evaluationPromise, timeoutPromise]);
      } catch (err) {
        if (err.message === 'SLA_TIMEOUT') {
          console.warn(`[DecisionGuard] SLA Timeout exceeded (>${SLA_TIMEOUT}ms) for decision ${decisionId}. Triggering Fail-Open.`);
          return this.createFallbackEvaluation(decisionId, prediction, domainConfig, 'SLA Timeout exceeded during multi-agent analysis.', features);
        }
        throw err;
      }

      const { biasReport, riskReport, complianceReport } = reports;

      // 3. Assemble Final Outcome
      let finalOutcome = 'APPROVED';
      let mitigatedPrediction = prediction;
      let explanationText = 'Decision aligns with fairness thresholds.';

      if (biasReport.isBiased || !complianceReport.isCompliant || riskReport.riskLevel === 'CRITICAL') {
        finalOutcome = 'INTERCEPTED';
        mitigatedPrediction = 'MANUAL_REVIEW_REQUIRED';
        explanationText = await this.explanationAgent.generateExplanation(features, prediction, biasReport, complianceReport, domainConfig);
      }

      const evaluation = {
        decisionId,
        domain: domainConfig.name,
        timestamp: new Date().toISOString(),
        originalPrediction: prediction,
        mitigatedPrediction,
        finalOutcome,
        biasReport,
        complianceReport,
        riskReport,
        explanation: explanationText,
        engine: 'GEN_AI_PIPELINE',
        status: 'ACTIVE_INTERCEPTION',
        features // Persist features for autofix
      };

      // 4. Send to Google Cloud services (non-blocking)
      firestoreService.saveAuditLog(evaluation).catch(console.error);
      
      // Broadcast via Pub/Sub
      pubsubService.publishDecisionEvent(evaluation).catch(console.error);

      // Log to BigQuery for long-term drift analysis
      bigqueryService.logDecision(evaluation).catch(console.error);

      return evaluation;
    } catch (outerError) {
      console.error(`[DecisionGuard] Unhandled error in evaluation loop:`, outerError);
      return this.createFallbackEvaluation(decisionId, prediction, domainConfig, `System Error: ${outerError.message}`, features);
    }
  }

  /**
   * Creates a safe "FAIL OPEN" evaluation when the system is under duress or times out.
   */
  createFallbackEvaluation(decisionId, prediction, domainConfig, reason, features = {}) {
    const fallback = {
      decisionId,
      domain: domainConfig.name,
      timestamp: new Date().toISOString(),
      originalPrediction: prediction,
      mitigatedPrediction: prediction, // Fail open
      finalOutcome: 'BYPASSED',
      status: 'BYPASS_FAIL_SAFE',
      engine: 'RULE_BASED_COMPLIANCE',
      biasReport: { isBiased: false, reasoning: reason, engine: 'FALLBACK' },
      complianceReport: { isCompliant: true, reasoning: reason },
      riskReport: { riskLevel: 'UNKNOWN', reasoning: reason },
      explanation: `Guardian was unable to complete analysis in time. ${reason} The decision was allowed to bypass for availability.`,
      features
    };

    // Still log it
    firestoreService.saveAuditLog(fallback).catch(console.error);
    pubsubService.publishDecisionEvent(fallback).catch(console.error);
    bigqueryService.logDecision(fallback).catch(console.error);

    return fallback;
  }
}
