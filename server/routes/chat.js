import express from 'express';
import { AuditChatAgent } from '../agents/AuditChatAgent.js';

const router = express.Router();
const chatAgent = new AuditChatAgent();

/**
 * POST /api/chat
 * Handles multi-turn RAG conversation with the AI Auditor
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatAgent.chat(message, history || [], context);
    
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
