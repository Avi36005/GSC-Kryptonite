/**
 * RiskAssessmentAgent.js
 * Uses Gemini 3.1 Pro (Vertex AI) — deep reasoning for assessing risk levels.
 */

import { geminiPro } from '../services/geminiClient.js';

export class RiskAssessmentAgent {
  /**
   * Assesses the risk level of a decision based on features and prediction.
   */
  async assessRisk(features, prediction, domainConfig) {
    try {
      const prompt = `You are a Risk Assessment Agent for the ${domainConfig.name} sector.
${domainConfig.contextPrompt}

Analyze the following decision for potential systemic, legal, or reputational risk.
Inputs/Features: ${JSON.stringify(features)}
Prediction/Outcome: ${prediction}

Respond strictly in JSON format:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "impactScore": number (0-100),
  "riskFactors": string[],
  "mitigationSuggestions": string[],
  "reasoning": string
}`;

      const responseText = await geminiFlash(prompt);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.runRuleBasedCheck(features, domainConfig, 'Failed to parse API logic correctly.');
    } catch (error) {
      console.error('RiskAssessmentAgent Error:', error);
      return this.runRuleBasedCheck(features, domainConfig, 'Error connecting to Vertex AI inference.');
    }
  }

  /**
   * Deterministic fallback: Heuristic risk evaluation based on flagged features.
   */
  runRuleBasedCheck(features, domainConfig, originalReason) {
    console.warn(`[RiskAssessmentAgent] Falling back to rule-based engine. Reason: ${originalReason}`);
    
    let riskLevel = 'LOW';
    let impactScore = 15;
    const riskFactors = [];

    const featureKeys = Object.keys(features);
    
    if (domainConfig.rules) {
      const triggeredRules = domainConfig.rules.filter(rule => 
        rule.targetFeatures.some(target => featureKeys.includes(target))
      );
      
      if (triggeredRules.some(r => r.severity === 'Critical' || r.severity === 'High')) {
        riskLevel = 'HIGH';
        impactScore = 75;
      } else if (triggeredRules.length > 0) {
        riskLevel = 'MEDIUM';
        impactScore = 50;
      }
      
      triggeredRules.forEach(r => riskFactors.push(`${r.rule} (${r.severity})`));
    }

    return {
      riskLevel,
      impactScore,
      riskFactors,
      mitigationSuggestions: riskLevel !== 'LOW' ? ['Flag for manual review', 'Validate data collection source'] : [],
      reasoning: riskFactors.length > 0 
        ? `Deterministic scan identified potential ${riskLevel} risk factors: ${riskFactors.join(', ')}. (${originalReason})`
        : `Heuristic scan found no high-risk feature markers. (${originalReason})`,
      engine: 'RULE_BASED_FALLBACK'
    };
  }
}
