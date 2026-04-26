import express from 'express';
import { geminiFlash } from '../services/geminiClient.js';

const router = express.Router();

/**
 * GET /api/dashboard-insights
 * Uses Gemini 2.0 Flash to generate quick, punchy AI insights for the dashboard.
 */
router.get('/dashboard-insights', async (req, res) => {
  try {
    const prompt = `You are the FairAI Guardian Dashboard Assistant. 
    Analyze the current system state (hypothetically, based on typical AI monitoring stats) and provide 3 very short, punchy insights or "Flash alerts" for an executive dashboard.
    
    Current System Context:
    - Overall Bias Score: 14.2% (Down 2.4% this week)
    - Compliance Health: 98.5%
    - Observed Trend: Slight spike in race-based demographic disparity in the last 24 hours.
    - Blocking Activity: DecisionGuard is the most active agent, preventing 415 biased outcomes.
    
    Output format: STRICTLY return a JSON array of exactly 3 strings. 
    Each string must be under 15 words.
    Do not include any other text, markdown, or explanation.
    
    Example: ["Race bias incidents spiked by 12% in the last 4 hours.", "Compliance health remains stable at 98.5%.", "DecisionGuard intercepted 415 potentially biased decisions."]`;

    const response = await geminiFlash(prompt);
    
    // Parse the JSON from the response. Gemini might wrap it in code blocks.
    const cleanJson = response.replace(/```json|```/g, '').trim();
    let insights;
    try {
      insights = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('Failed to parse Gemini response as JSON, using regex extraction:', e);
      // Fallback regex to find array
      const match = cleanJson.match(/\[.*\]/s);
      if (match) {
        insights = JSON.parse(match[0]);
      } else {
        throw new Error('Invalid response format');
      }
    }
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching dashboard insights:', error);
    // Fallback static insights if model fails
    res.json([
      "System bias score decreased by 2.4% this week.",
      "Compliance health is currently at 98.5%.",
      "DecisionGuard blocked 415 biased decisions today."
    ]);
  }
});

export default router;
