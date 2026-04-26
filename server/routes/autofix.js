import express from 'express';
import { AutoBiasFixAgent } from '../agents/AutoBiasFixAgent.js';
import { getDomainConfig } from '../domains/index.js';

const router = express.Router();
const autoFixAgent = new AutoBiasFixAgent();

/**
 * POST /api/autofix
 * Automatically corrects a biased decision
 */
router.post('/autofix', async (req, res) => {
  try {
    const { decisionId, features, prediction, biasReport, complianceReport, domain } = req.body;

    if (!features || !prediction) {
      return res.status(400).json({ error: 'Features and prediction are required' });
    }

    const domainConfig = getDomainConfig(domain || 'hiring');
    const fixResult = await autoFixAgent.rewriteDecision(features, prediction, biasReport, complianceReport, domainConfig);

    res.json(fixResult);
  } catch (error) {
    console.error('AutoFix API Error:', error);
    res.status(500).json({ error: 'Failed to process auto bias fix' });
  }
});

export default router;
