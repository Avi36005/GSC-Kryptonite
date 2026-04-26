/**
 * geminiClient.js
 * ─────────────────────────────────────────────────────────
 * Hybrid Gemini Architecture via Vertex AI (Application Default Credentials)
 *
 *  • Gemini 2.5 Pro  → deep reasoning: bias detection, compliance,
 *                       dataset analysis, PDF/image extraction
 *  • Gemini 2.5 Flash → fast responses: chatbot, summaries, UI insights,
 *                        system status messages
 *
 * Auth: Application Default Credentials (ADC) — no API keys required.
 * Run `gcloud auth application-default login` locally, or attach a service
 * account in Cloud Run.
 * ─────────────────────────────────────────────────────────
 */

import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'fairai-494213-f8';
const LOCATION   = process.env.VERTEX_LOCATION   || 'us-central1';

// ── Model identifiers ──────────────────────────────────────
/**
 * MODEL USAGE MAPPING:
 * - Bias Detection -> gemini-2.0-pro-exp-02-05
 * - Compliance -> gemini-2.0-pro-exp-02-05
 * - Dataset Analysis -> gemini-2.0-pro-exp-02-05
 * - Autofix -> gemini-2.0-pro-exp-02-05
 * - Dashboard insights -> gemini-2.0-flash-exp
 * - System status messages -> gemini-2.0-flash-exp
 * - Quick summaries -> gemini-2.0-flash-exp
 * - Lightweight responses -> gemini-2.0-flash-exp
 * - Chatbot -> gemini-2.0-flash-exp
 */
const MODELS = {
  PRO_3_1: 'gemini-2.5-pro',       // Best available for deep analysis
  PRO_2_5: 'gemini-2.5-pro',
  FLASH:   'gemini-2.5-flash',
};

// ── Singleton Vertex AI client ─────────────────────────────
const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });

/**
 * Get a Vertex AI generative model instance.
 * @param {'pro' | 'pro25' | 'flash'} tier
 */
function getModel(tier = 'flash') {
  let modelName;
  switch (tier) {
    case 'pro':   modelName = MODELS.PRO_3_1; break;
    case 'pro25': modelName = MODELS.PRO_2_5; break;
    case 'flash': 
    default:      modelName = MODELS.FLASH;   break;
  }
  
  return vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature:   tier.startsWith('pro') ? 0.2 : 0.4,
      maxOutputTokens: tier.startsWith('pro') ? 8192 : 4096,
    },
  });
}

/**
 * Generate text content using the specified tier.
 *
 * @param {string} prompt       - The full prompt string
 * @param {'pro' | 'pro25' | 'flash'} tier - Which model to use
 * @returns {Promise<string>}   - The model's text response
 */
export async function generateContent(prompt, tier = 'flash') {
  const model = getModel(tier);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Generate content with a fallback to PRO_2_5 if FLASH fails.
 */
export async function generateWithFallback(prompt) {
  try {
    return await geminiFlash(prompt);
  } catch (error) {
    console.warn('Gemini 2.5 Flash failed, falling back to Gemini 2.5 Pro:', error.message);
    return await generateContent(prompt, 'pro25');
  }
}

/**
 * Convenience wrappers
 */
export const geminiPro   = (prompt) => generateContent(prompt, 'pro');
export const geminiFlash = (prompt) => generateContent(prompt, 'flash');
export const geminiPro25 = (prompt) => generateContent(prompt, 'pro25');

export { MODELS, PROJECT_ID, LOCATION };
