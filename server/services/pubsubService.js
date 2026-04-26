import { PubSub } from '@google-cloud/pubsub';

class PubSubService {
  constructor() {
    this.pubsub = new PubSub();
    this.topicName = 'bias-alerts';
  }

  async publishAlert(alert) {
    try {
      const dataBuffer = Buffer.from(JSON.stringify(alert));
      await this.pubsub.topic(this.topicName).publishMessage({ data: dataBuffer });
      console.log('[PubSub] Alert published:', alert.id);
    } catch (error) {
      console.error('PubSub Publish Error:', error);
      throw error;
    }
  }

  async publishDecisionEvent(data) {
    try {
      const dataBuffer = Buffer.from(JSON.stringify(data));
      await this.pubsub.topic(this.topicName).publishMessage({ data: dataBuffer });
      console.log('[PubSub] Real Event published:', data.decisionId);
    } catch (error) {
      console.error('PubSub Publish Error:', error);
      throw error;
    }
  }
}

export const pubsubService = new PubSubService();
