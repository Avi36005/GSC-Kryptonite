import { PubSub } from '@google-cloud/pubsub';

class PubSubService {
  constructor() {
    this.isSimulated = !process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!this.isSimulated) {
      try {
        this.pubsub = new PubSub();
        this.topicName = 'governance-events';
      } catch (e) {
        this.isSimulated = true;
      }
    }
  }

  async publishDecisionEvent(data) {
    if (this.isSimulated) {
      console.log('[PubSub Simulated] Event published:', data.decisionId);
      return;
    }

    try {
      const dataBuffer = Buffer.from(JSON.stringify(data));
      await this.pubsub.topic(this.topicName).publishMessage({ data: dataBuffer });
    } catch (error) {
      console.error('PubSub Publish Error:', error);
    }
  }
}

export const pubsubService = new PubSubService();
