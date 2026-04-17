import { BiasDetectionAgent } from './BiasDetectionAgent.js';
import { ExplanationAgent } from './ExplanationAgent.js';
import { ComplianceAgent } from './ComplianceAgent.js';
import { getDomainConfig } from '../domains/index.js';

export class DecisionGuardAgent {
  constructor() {
    this.biasAgent = new BiasDetectionAgent();
    this.complianceAgent = new ComplianceAgent();
    this.explanationAgent = new ExplanationAgent();
  }

  /**
   * The interceptor gateway. Takes the raw decision, passes it through agents, and returns the mitgated result.
   */
  async evaluate(decisionId, features, prediction, domainContext = 'hiring') {
    console.log(`[DecisionGuard] Intercepting Decision ${decisionId} under domain: ${domainContext}...`);

    const domainConfig = getDomainConfig(domainContext);

    // 1. Check for Bias
    const biasReport = await this.biasAgent.analyzeDecision(features, prediction, domainConfig);
    
    // 2. Check Compliance
    const complianceReport = await this.complianceAgent.verify(features, prediction, biasReport, domainConfig);

    // 3. Assemble Final Outcome
    let finalOutcome = 'APPROVED';
    let mitigatedPrediction = prediction;
    let explanationText = 'Decision aligns with fairness thresholds.';

    if (biasReport.isBiased || !complianceReport.isCompliant) {
       finalOutcome = 'INTERCEPTED';
       // We can dynamically assign a review state based on domain
       mitigatedPrediction = 'MANUAL_REVIEW_REQUIRED';
       explanationText = await this.explanationAgent.generateExplanation(features, prediction, biasReport, complianceReport, domainConfig);
    }

    return {
      decisionId,
      domain: domainConfig.name,
      timestamp: new Date().toISOString(),
      originalPrediction: prediction,
      mitigatedPrediction,
      finalOutcome,
      biasReport,
      complianceReport,
      explanation: explanationText
    };
  }
}
