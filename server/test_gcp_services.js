import { bigqueryService } from './server/services/bigqueryService.js';
import { pubsubService } from './server/services/pubsubService.js';
import { geminiClient } from './server/services/geminiClient.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function testServices() {
  console.log('Testing PubSub...');
  try {
    await pubsubService.publishDecisionEvent({ decisionId: 'test-123', timestamp: new Date().toISOString() });
    console.log('PubSub test passed.');
  } catch (err) {
    console.error('PubSub test failed:', err);
  }

  console.log('Testing BigQuery...');
  try {
    await bigqueryService.logDecision({
      decisionId: 'test-123',
      timestamp: new Date().toISOString(),
      domain: 'Testing',
      finalOutcome: 'APPROVED',
      originalDecision: 'APPROVED',
      reasons: ['Testing valid log'],
      biasReport: {
        hasBias: false,
        biasType: 'None',
        confidenceScore: 0.95,
        affectedGroups: [],
        recommendedAction: 'Proceed'
      }
    });
    console.log('BigQuery logDecision passed.');
  } catch (err) {
    console.error('BigQuery test failed:', err);
  }

  console.log('Testing Gemini...');
  try {
    const res = await geminiClient.generateContent('gemini-2.5-flash', 'Hello, this is a test. Please reply with "Test successful".');
    console.log('Gemini test passed. Reply:', res);
  } catch (err) {
    console.error('Gemini test failed:', err);
  }
}

testServices();
