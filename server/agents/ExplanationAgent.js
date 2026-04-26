/**
 * ExplanationAgent.js
 * Uses Gemini 2.5 Pro (Vertex AI) — deep compliance reasoning for explanations.
 */

import { geminiPro } from '../services/geminiClient.js';

export class ExplanationAgent {
  async generateExplanation(features, originalPrediction, biasReport, complianceReport, domainConfig) {
    try {
      const safeBias = biasReport || { isBiased: false, reasoning: 'Bias analysis was unavailable.' };
      const safeCompliance = complianceReport || { isCompliant: true, violations: [], reasoning: 'Compliance verification was bypassed.' };
      
      const violationsList = (safeCompliance.violations || [])
        .map(v => `${v.rule} (${v.severity})`)
        .join(', ') || 'None specifically identified';

      const prompt = `You are an AI Explanation Agent for the ${domainConfig.name} sector. A decision was intercepted.
Original Prediction: ${originalPrediction}
Bias Analysis: ${JSON.stringify(safeBias)}
Compliance Violations: ${violationsList}

Draft a concise, professional 2-sentence summary explaining exactly why this algorithm's prediction was suspended. 
If the bias or compliance analysis is flagged as "unavailable" or "bypassed", mention that "System safety limits triggered a precautionary suspension for manual review."
If the analysis came from a rule-based engine, mention that "Automated policy triggers" identified the risk.`;

      const text = await geminiPro(prompt);
      return text.trim() || 'Explanation could not be generated. Decision suspended for manual auditing.';
    } catch (error) {
      console.error('ExplanationAgent Error:', error);
      return 'Guardian intercepted the decision due to potential policy violations. Technical reasoning is available in the audit log.';
    }
  }
}
