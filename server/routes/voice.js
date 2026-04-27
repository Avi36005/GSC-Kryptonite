import express from 'express';
import { voiceService } from '../services/voiceService.js';

const router = express.Router();

/**
 * POST /api/voice/tts
 * Converts text to base64 audio
 */
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const audioBase64 = await voiceService.textToSpeech(text);
    res.json({ audio: audioBase64 });
  } catch (err) {
    console.error('TTS Error:', err);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

/**
 * POST /api/voice/stt
 * Converts audio buffer to text
 */
router.post('/stt', async (req, res) => {
  try {
    const { audio } = req.body; // Expecting base64 string
    if (!audio) return res.status(400).json({ error: 'Audio is required' });

    const buffer = Buffer.from(audio, 'base64');
    const text = await voiceService.speechToText(buffer);
    res.json({ text });
  } catch (err) {
    console.error('STT Error:', err);
    res.status(500).json({ error: 'Failed to transcribe speech' });
  }
});

export default router;
