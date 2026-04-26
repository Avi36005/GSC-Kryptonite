import express from 'express';
import { DecisionGuardAgent } from '../agents/DecisionGuardAgent.js';
import { getDomainConfig } from '../domains/index.js';

import { bigqueryService } from '../services/bigqueryService.js';

import { systemState } from '../services/systemState.js';

const router = express.Router();
const guardAgent = new DecisionGuardAgent();

/**
 * GET /api/system/status
 */
router.get('/system/status', (req, res) => {
  res.json(systemState.getStatus());
});

/**
 * GET /api/system/summary
 */
router.get('/system/summary', async (req, res) => {
  const summary = await systemState.getSummary();
  res.json(summary);
});


/**
 * POST /api/system/halt
 */
router.post('/system/halt', (req, res) => {
  const { halt } = req.body;
  systemState.updateStatus({ halt: !!halt });
  const status = systemState.getStatus();
  
  // Notify all clients via socket
  const io = req.app.get('io');
  if (io) {
    io.emit('system_status_change', status);
  }
  
  res.json(status);
});

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

    // EMERGENCY HALT CHECK
    const status = systemState.getStatus();
    if (status.halt) {
      const bypassResult = {
        decisionId: id,
        timestamp: new Date().toISOString(),
        originalPrediction: prediction,
        mitigatedPrediction: prediction,
        finalOutcome: 'PASSED',
        status: 'BYPASS_FAIL_SAFE',
        biasReport: { isBiased: false, confidenceScore: 0, flaggedFeatures: [], reasoning: "System in Emergency Halt mode. Guardrails bypassed." },
        complianceReport: { isCompliant: true, violations: [] },
        explanation: "Decision allowed to pass without evaluation due to active Emergency Halt.",
        engine: 'NONE'
      };
      systemState.addDecision(bypassResult);
      const io = req.app.get('io');
      if (io) io.emit('new_decision_intercepted', bypassResult);
      return res.json(bypassResult);
    }

    const evaluation = await guardAgent.evaluate(id, features, prediction, domain);
    systemState.addDecision(evaluation);

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
  res.json(systemState.getRecentDecisions(50));
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
 * GET /api/drift
 * Returns bias and drift analysis from BigQuery
 */
router.get('/drift', async (req, res) => {
  try {
    const { domain } = req.query;
    const rawDrift = await bigqueryService.getDriftAnalysis(domain || 'FINANCE');
    
    // Format historical drift
    const historicalDrift = rawDrift.map(row => ({
      date: row.date,
      score: row.driftScore ? row.driftScore * 100 : (row.biasedDecisions / (row.totalDecisions || 1)) * 100
    }));

    // Generate/Fetch current bias (Mocked for now as per design requirements)
    const currentBias = [
      { category: 'Gender', parity: 0.88 },
      { category: 'Age', parity: 0.72 },
      { category: 'Zip Code', parity: 0.94 },
      { category: 'Income', parity: 0.81 }
    ];

    // Generate/Fetch drift contributors
    const driftContributors = [
      { feature: 'avg_transaction_val', drift: 18.4 },
      { feature: 'user_tenure', drift: 12.1 },
      { feature: 'risk_score_v4', drift: 9.5 }
    ];

    res.json({
      historicalDrift,
      currentBias,
      driftContributors
    });
  } catch (err) {
    console.error("Drift API Error:", err);
    res.status(500).json({ error: "Failed to fetch drift analysis" });
  }
});

export default router;
