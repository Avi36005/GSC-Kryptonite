import textToSpeech from '@google-cloud/text-to-speech';
import speech from '@google-cloud/speech';

const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'fairai-494213-f8';

const ttsClient = new textToSpeech.TextToSpeechClient({
  projectId: PROJECT_ID,
});

const sttClient = new speech.SpeechClient({
  projectId: PROJECT_ID,
});

/**
 * voiceService.js
 * ─────────────────────────────────────────────────────────
 * Native Google Cloud Voice Services for FairAI Guardian.
 * ─────────────────────────────────────────────────────────
 */
export const voiceService = {
  /**
   * Converts text to speech audio (base64)
   * @param {string} text 
   * @returns {Promise<string>} base64 audio
   */
  async textToSpeech(text) {
    const request = {
      input: { text },
      voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL', name: 'en-US-Neural2-F' },
      audioConfig: { audioEncoding: 'MP3', pitch: 0, speakingRate: 1.05 },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    return response.audioContent.toString('base64');
  },

  /**
   * Converts speech audio to text
   * @param {Buffer} audioBuffer 
   * @returns {Promise<string>}
   */
  async speechToText(audioBuffer) {
    const request = {
      audio: { content: audioBuffer.toString('base64') },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      },
    };

    const [response] = await sttClient.recognize(request);
    return response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
  }
};
