/**
 * BiasDetectionAgent.js
 * Uses Gemini 2.5 Pro (Vertex AI) — deep reasoning for bias detection.
 */

import { geminiPro } from '../services/geminiClient.js';

export class BiasDetectionAgent {
  /**
   * Scans an AI's input features against its predicted outcome to identify
   * potential bias / disparate impact.
   */
  async analyzeDecision(features, prediction, domainConfig) {
    try {
      const prompt = `You are a Bias Detection Agent for the ${domainConfig.name} sector in a risk-management system.
${domainConfig.contextPrompt}

Given the following user feature set/document payload and the AI's prediction, analyze if the decision relies heavily on proxies for protected demographic classes.
Inputs/Features: ${JSON.stringify(features)}
Prediction/Outcome: ${prediction}

Respond strictly in JSON format:
{
  "isBiased": boolean,
  "confidenceScore": number (0-100),
  "flaggedFeatures": string[] (list of keys/fields from features that are problematic proxies),
  "reasoning": string
}`;

      const responseText = await geminiPro(prompt);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.runRuleBasedCheck(features, domainConfig, 'Failed to parse API logic correctly.');
    } catch (error) {
      console.error('BiasDetectionAgent Error:', error);
      return this.runRuleBasedCheck(features, domainConfig, 'Error connecting to Vertex AI inference.');
    }
  }

  /**
   * Deterministic fallback: Checks features against domain-specific forbidden rules.
   */
  runRuleBasedCheck(features, domainConfig, originalReason) {
    console.warn(`[BiasDetectionAgent] Falling back to rule-based engine for ${domainConfig.name}. Reason: ${originalReason}`);
    
    const flaggedFeatures = [];
    const featureKeys = Object.keys(features);

    if (domainConfig.rules) {
      domainConfig.rules.forEach(rule => {
        rule.targetFeatures.forEach(target => {
          if (featureKeys.includes(target)) {
            flaggedFeatures.push(target);
          }
        });
      });
    }

    const uniqueFlagged = [...new Set(flaggedFeatures)];

    return {
      isBiased: uniqueFlagged.length > 0,
      confidenceScore: uniqueFlagged.length > 0 ? 100 : 0, // Deterministic
      flaggedFeatures: uniqueFlagged,
      reasoning: uniqueFlagged.length > 0 
        ? `Rule-based engine detected prohibited proxies: ${uniqueFlagged.join(', ')}. (${originalReason})`
        : `Deterministic scan found no prohibited proxies. (${originalReason})`,
      engine: 'RULE_BASED_FALLBACK'
    };
  }
}
