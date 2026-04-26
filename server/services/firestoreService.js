/**
 * firestoreService.js
 * ─────────────────────────────────────────────────────────
 * Real Firestore integration for FairAI Guardian.
 * Uses Firebase Admin SDK with Application Default Credentials (ADC).
 *
 * Auth: `gcloud auth application-default login` locally,
 *       or a service account in Cloud Run.
 * ─────────────────────────────────────────────────────────
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'fairai-494213-f8';

let db = null;

export const initFirebase = () => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: PROJECT_ID,
      });
      console.log(`✅ Firebase Admin initialized (project: ${PROJECT_ID})`);
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    console.log('✅ Firestore connected successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.warn('⚠️  Firestore will operate in fallback mode. Run: gcloud auth application-default login');
    db = null;
  }
};

// Initialize on import
initFirebase();

export const firestoreService = {
  /**
   * Save an audit log for a decision evaluation.
   */
  async saveAuditLog(logData) {
    if (!db) {
      console.log('[Firestore Fallback] Would save audit log:', logData.decisionId);
      return { success: true, fallback: true };
    }

    try {
      await db.collection('audit_logs').doc(logData.decisionId).set({
        ...logData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[Firestore] ✅ Audit log saved: ${logData.decisionId}`);
      return { success: true };
    } catch (error) {
      console.error('[Firestore] Error saving audit log:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save chat session history.
   */
  async saveChatHistory(sessionId, messages) {
    if (!db) {
      console.log('[Firestore Fallback] Would save chat history for session:', sessionId);
      return { success: true, fallback: true };
    }

    try {
      await db.collection('chat_sessions').doc(sessionId).set({
        messages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`[Firestore] ✅ Chat history saved: ${sessionId}`);
      return { success: true };
    } catch (error) {
      console.error('[Firestore] Error saving chat history:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save CSV analysis results to Firestore.
   */
  async saveAnalysisResult(analysisData) {
    if (!db) {
      console.log('[Firestore Fallback] Would save analysis result');
      return { success: true, fallback: true };
    }

    try {
      const docRef = await db.collection('analysis_results').add({
        ...analysisData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[Firestore] ✅ Analysis result saved: ${docRef.id}`);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('[Firestore] Error saving analysis result:', error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Retrieve recent audit logs.
   */
  async getRecentAuditLogs(limit = 5) {
    if (!db) {
      return [];
    }
    try {
      const snapshot = await db.collection('audit_logs')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('[Firestore] Error reading audit logs:', error.message);
      return [];
    }
  },

  /**
   * Retrieve recent analysis results.
   */
  async getRecentAnalyses(limit = 10) {
    if (!db) {
      return [];
    }
    try {
      const snapshot = await db.collection('analysis_results')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('[Firestore] Error reading analyses:', error.message);
      return [];
    }
  },

  /**
   * Check if Firestore is connected (for health checks).
   */
  isConnected() {
    return db !== null;
  },
};
