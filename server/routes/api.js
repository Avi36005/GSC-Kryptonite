import express from 'express';
import { DecisionGuardAgent } from '../agents/DecisionGuardAgent.js';
import { getDomainConfig } from '../domains/index.js';

const router = express.Router();
const guardAgent = new DecisionGuardAgent();

// Simulated database for audit logs
const decisionLogs = [];

/**
 * POST /api/analyze
 * Used by the Analyzer page or external AI services to evaluate an offline dataset
 */
router.post('/analyze', async (req, res) => {
  const { dataset } = req.body;
  // Stub for dataset analysis processing
  res.json({
    status: 'success',
    scanned_rows: dataset?.length || 0,
    high_risk_features: ['zip_code', 'club_membership']
  });
});

/**
 * POST /api/decisions/intercept
 * Main entry point for real-time AI decision interception
 */
router.post('/decisions/intercept', async (req, res) => {
  try {
    const { id, features, prediction, domain } = req.body;
    
    if (!id || !features || !prediction) {
       return res.status(400).json({ error: "Missing required fields: id, features, prediction" });
    }

    const evaluation = await guardAgent.evaluate(id, features, prediction, domain);
    decisionLogs.push(evaluation);

    // Emit real-time event to connected frontend clients
    const io = req.app.get('io');
    if (io) {
       io.emit('new_decision_intercepted', evaluation);
    }

    res.json(evaluation);
  } catch (err) {
    console.error("Interceptor API Error:", err);
    res.status(500).json({ error: "Internal server error during evaluation" });
  }
});

/**
 * GET /api/decisions
 * Returns historical decisions
 */
router.get('/decisions', (req, res) => {
  res.json(decisionLogs);
});

/**
 * GET /api/compliance-status
 */
router.get('/compliance-status', (req, res) => {
  const { domain } = req.query;
  const config = getDomainConfig(domain);

  // Return dynamic frameworks with mock scores
  const frameworks = (config.complianceFrameworks || []).map(f => ({
    name: f.title,
    description: f.description,
    risk: f.risk,
    score: Math.floor(Math.random() * (100 - 80) + 80) // 80-100 random score
  }));

  res.json({
    domain: config.name,
    frameworks
  });
});

/**
 * GET /api/domain-config
 * Returns domain specific config for frontend usage
 */
router.get('/domain-config', (req, res) => {
  const { domain } = req.query;
  const config = getDomainConfig(domain);
  res.json(config);
});

/**
 * GET /api/drift-data
 */
router.get('/drift-data', (req, res) => {
  res.json({
     warning: false,
     drift_score: 0.04
  });
});

export default router;
