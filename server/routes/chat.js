import express from 'express';
import { AuditChatAgent } from '../agents/AuditChatAgent.js';
import { bigqueryService } from '../services/bigqueryService.js';
import { firestoreService } from '../services/firestoreService.js';

const router = express.Router();
const chatAgent = new AuditChatAgent();

/**
 * Gathers a comprehensive snapshot of the live system state to give
 * the AI Auditor full situational awareness of everything happening.
 */
async function buildLiveSystemContext(app) {
  const context = {};

  // 1. System halt status (from api.js in-memory state via app locals)
  try {
    const apiRouter = app.get('systemStatus');
    context.systemStatus = apiRouter || { halt: false };
  } catch (_) {
    context.systemStatus = { halt: false };
  }

  // 2. Recent intercepted decisions (from app-level store)
  try {
    const recentDecisions = app.get('decisionLogs') || [];
    context.recentDecisions = recentDecisions.slice(-10);
    context.totalDecisions = recentDecisions.length;

    const intercepted = recentDecisions.filter(d => d.finalOutcome === 'INTERCEPTED');
    const bypassed = recentDecisions.filter(d => d.finalOutcome === 'BYPASSED');
    context.interceptedCount = intercepted.length;
    context.bypassedCount = bypassed.length;
    context.lastInterceptedDecision = intercepted[intercepted.length - 1] || null;
  } catch (_) {
    context.recentDecisions = [];
  }

  // 3. Bias drift data from BigQuery
  try {
    const driftRows = await bigqueryService.getDriftAnalysis('ALL');
    context.driftData = driftRows.slice(-5); // last 5 data points
    if (driftRows.length > 0) {
      const latest = driftRows[driftRows.length - 1];
      context.currentDriftScore = latest.driftScore || (latest.biasedDecisions / (latest.totalDecisions || 1));
    }
  } catch (err) {
    context.driftData = [];
    context.driftError = err.message;
  }

  // 4. Recent Firestore audit logs
  try {
    const auditLogs = await firestoreService.getRecentAuditLogs(5);
    context.recentAuditLogs = auditLogs;
    
    const recentAnalyses = await firestoreService.getRecentAnalyses(5);
    context.recentAnalyses = recentAnalyses;
  } catch (_) {
    context.recentAuditLogs = [];
    context.recentAnalyses = [];
  }

  return context;
}

/**
 * POST /api/chat
 * Handles multi-turn RAG conversation with the AI Auditor.
 * Automatically injects live system context into every request.
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history, context: userContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Gather live platform context
    const liveContext = await buildLiveSystemContext(req.app);

    // Merge user-supplied context (e.g., a specific decision) with live context
    const fullContext = { ...liveContext, ...userContext };

    const response = await chatAgent.chat(message, history || [], fullContext);
    
    res.json({
      role: 'assistant',
      content: response.reply,
      citations: response.citations || []
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
