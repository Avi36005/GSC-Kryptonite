// Note: To use this in production, you would install the firebase-admin package.
// npm install firebase-admin
// This file sets up the Firestore integration for the FairAI Guardian platform.

import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config({ path: '../.env' });

let db = null;

export const initFirebase = () => {
  try {
    console.log('Firebase initializing with Application Default Credentials...');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'fairai-494213-f8'
    });
    db = admin.firestore();
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
};

export const firestoreService = {
  async saveAuditLog(logData) {
    if (!db) {
      console.log('[Firestore Simulator] Saving audit log:', logData.decisionId);
      return { success: true, simulated: true };
    }
    
    try {
      await db.collection('audit_logs').doc(logData.decisionId).set({
        ...logData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      return { success: false, error };
    }
  },

  async saveChatHistory(sessionId, messages) {
    if (!db) {
      console.log('[Firestore Simulator] Saving chat history for session:', sessionId);
      return { success: true, simulated: true };
    }

    try {
      await db.collection('chat_sessions').doc(sessionId).set({
        messages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving chat to Firestore:', error);
      return { success: false, error };
    }
  },

  async getRecentLogs(limitCount = 10) {
    if (!db) return [];
    try {
      const snapshot = await db.collection('audit_logs')
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching logs from Firestore:', error);
      return [];
    }
  }
};
