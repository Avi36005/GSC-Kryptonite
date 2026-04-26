/**
 * AutoBiasFixAgent.js
 * Uses Gemini 2.5 Pro (Vertex AI) — deep reasoning for bias correction.
 */

import { geminiPro } from '../services/geminiClient.js';

export class AutoBiasFixAgent {
  /**
   * Rewrites biased decisions to be fair and compliant.
   */
  async rewriteDecision(features, originalPrediction, biasReport, complianceReport, domainConfig) {
    try {
      const prompt = `You are the Auto Bias Fix Engine for the ${domainConfig.name} sector. 
A decision was flagged for bias and compliance violations. Your task is to adjust the decision to be fair and legally compliant, while preserving as much of the original intent as possible if legally permissible.

Original Features: ${JSON.stringify(features)}
Original Prediction: ${originalPrediction}
Bias Analysis: ${JSON.stringify(biasReport)}
Compliance Violations: ${JSON.stringify(complianceReport?.violations || [])}

Instructions:
1. Identify the problematic features (proxies) that led to the bias.
2. Formulate a corrected prediction that ignores the biased features.
3. Provide a brief explanation of the correction.

Respond strictly in JSON format:
{
  "correctedPrediction": "string (e.g., APPROVED, DENIED, ADJUSTED_OFFER)",
  "removedFeatures": ["string"],
  "correctionExplanation": "string"
}`;

      const responseText = await geminiPro(prompt);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        correctedPrediction: 'MANUAL_REVIEW',
        removedFeatures: [],
        correctionExplanation: 'Failed to generate automated fix.',
      };
    } catch (error) {
      console.error('AutoBiasFixAgent Error:', error);
      return {
        correctedPrediction: 'MANUAL_REVIEW',
        removedFeatures: [],
        correctionExplanation: 'System error during bias correction.',
      };
    }
  }
}
