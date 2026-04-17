import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash' });
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export class ExplanationAgent {
  async generateExplanation(features, originalPrediction, biasReport, complianceReport, domainConfig) {
    try {
      const prompt = `You are an AI Explanation Agent for the ${domainConfig.name} sector. A decision was intercepted by the governance platform.
Original Prediction: ${originalPrediction}
Bias Analysis: ${JSON.stringify(biasReport)}
Compliance Violations: ${JSON.stringify(complianceReport.violations)}

Draft a concise, professional 2-sentence summary explaining exactly why this algorithm's prediction was suspended. Focus on the relevant domain regulations/heuristics (e.g., Fair Lending, Patient Triage ethics, Equal Opportunity) referenced in the compliance report.`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });

      return response.text?.trim() || "Explanation could not be generated.";
    } catch (error) {
      console.error("ExplanationAgent Error:", error);
      return "System error while drafting explanation.";
    }
  }
}
