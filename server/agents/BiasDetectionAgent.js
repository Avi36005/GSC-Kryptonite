import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash' });
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export class BiasDetectionAgent {
  /**
   * Scans an AI's input features against its predicted outcome to identify potential bias/disparate impact.
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

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      const responseText = response.text || '';
      // Parse the JSON out of the response string (handling potential markdown blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      }
      
      return { isBiased: false, confidenceScore: 0, flaggedFeatures: [], reasoning: "Failed to parse API logic correctly." };

    } catch (error) {
      console.error("BiasDetectionAgent Error:", error);
      return { isBiased: false, confidenceScore: 0, flaggedFeatures: [], reasoning: "Error connecting to AI inference." };
    }
  }
}
