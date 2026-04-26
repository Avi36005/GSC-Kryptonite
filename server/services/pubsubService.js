/**
 * pubsubService.js
 * ─────────────────────────────────────────────────────────
 * Real Pub/Sub integration for FairAI Guardian.
 * Uses Application Default Credentials (ADC) — no
 * GOOGLE_APPLICATION_CREDENTIALS env var needed.
 *
 * Auto-creates the topic on first use.
 * ─────────────────────────────────────────────────────────
 */

import { PubSub } from '@google-cloud/pubsub';

const PROJECT_ID = process.env.PUBSUB_PROJECT_ID || 'fairai-494213-f8';

class PubSubService {
  constructor() {
    this.topicName = 'governance-events';
    this.pubsub = null;
    this.isReady = false;

    this._initialize();
  }

  async _initialize() {
    try {
      this.pubsub = new PubSub({ projectId: PROJECT_ID });

      // Ensure topic exists
      await this._ensureTopic();

      this.isReady = true;
      console.log(`✅ Pub/Sub connected (project: ${PROJECT_ID}, topic: ${this.topicName})`);
    } catch (error) {
      console.error('❌ Pub/Sub initialization failed:', error.message);
      console.warn('⚠️  Pub/Sub will use console-log fallback. Run: gcloud auth application-default login');
      this.isReady = false;
    }
  }

  async _ensureTopic() {
    try {
      const [topics] = await this.pubsub.getTopics();
      const topicFullName = `projects/${PROJECT_ID}/topics/${this.topicName}`;
      const exists = topics.some(t => t.name === topicFullName);
      if (!exists) {
        await this.pubsub.createTopic(this.topicName);
        console.log(`✅ Pub/Sub topic created: ${this.topicName}`);
      }
    } catch (error) {
      if (error.code !== 6) { // 6 = ALREADY_EXISTS
        console.warn('Pub/Sub topic check/create warning:', error.message);
      }
    }
  }

  /**
   * Publish a decision event to the governance-events topic.
   */
  async publishDecisionEvent(data) {
    if (!this.isReady || !this.pubsub) {
      console.log('[Pub/Sub Fallback] Event would be published:', data.decisionId);
      return { success: true, fallback: true };
    }

    try {
      const dataBuffer = Buffer.from(JSON.stringify({
        eventType: 'DECISION_EVALUATED',
        decisionId: data.decisionId,
        domain: data.domain,
        finalOutcome: data.finalOutcome,
        isBiased: data.biasReport?.isBiased || false,
        timestamp: data.timestamp || new Date().toISOString(),
      }));

      const messageId = await this.pubsub
        .topic(this.topicName)
        .publishMessage({ data: dataBuffer });

      console.log(`[Pub/Sub] ✅ Event published: ${data.decisionId} (msgId: ${messageId})`);
      return { success: true, messageId };
    } catch (error) {
      console.error('[Pub/Sub] Error publishing event:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if Pub/Sub is connected (for health checks).
   */
  isConnected() {
    return this.isReady;
  }
}

export const pubsubService = new PubSubService();
