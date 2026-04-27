/**
 * bigqueryService.js
 * ─────────────────────────────────────────────────────────
 * Real BigQuery integration for FairAI Guardian.
 * Uses Application Default Credentials (ADC).
 *
 * Stores decision logs and provides drift analysis.
 * Auto-creates the dataset and table on first use.
 * ─────────────────────────────────────────────────────────
 */

import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = process.env.BIGQUERY_PROJECT_ID || 'fairai-494213-f8';
const DATASET_ID = 'fairai_guardian';
const TABLE_ID = 'decision_logs';

class BigQueryService {
  constructor() {
    this.projectId = PROJECT_ID;
    this.datasetId = DATASET_ID;
    this.tableId = TABLE_ID;
    this.bigquery = null;
    this.isReady = false;
    this.rawLogs = []; // In-memory buffer for immediate access

    this._initialize();
  }

  /**
   * Initialize BigQuery client and ensure dataset/table exist.
   */
  async _initialize() {
    try {
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (clientEmail && privateKey && clientEmail !== 'your_service_account_email') {
        this.bigquery = new BigQuery({
          projectId: this.projectId,
          credentials: {
            client_email: clientEmail,
            private_key: privateKey,
          },
        });
        console.log(`✅ BigQuery connected with Service Account (project: ${this.projectId})`);
      } else {
        this.bigquery = new BigQuery({ projectId: this.projectId });
        console.log(`✅ BigQuery connected with ADC (project: ${this.projectId})`);
      }

      // Test connection by listing datasets
      await this.bigquery.getDatasets({ maxResults: 1 });

      // Ensure dataset exists
      await this._ensureDataset();

      // Ensure table exists
      await this._ensureTable();

      this.isReady = true;
      console.log(`✅ BigQuery ready: ${this.projectId}.${this.datasetId}.${this.tableId}`);
    } catch (error) {
      console.error('❌ BigQuery initialization failed:', error.message);
      console.warn('⚠️  BigQuery will use in-memory fallback. Run: gcloud auth application-default login or provide credentials in .env');
      this.isReady = false;
    }
  }

  async _ensureDataset() {
    try {
      const [datasets] = await this.bigquery.getDatasets();
      const exists = datasets.some(ds => ds.id === this.datasetId);
      if (!exists) {
        await this.bigquery.createDataset(this.datasetId, {
          location: 'US',
        });
        console.log(`✅ BigQuery dataset created: ${this.datasetId}`);
      }
    } catch (error) {
      if (error.code !== 409) { // 409 = already exists
        console.warn('BigQuery dataset check/create warning:', error.message);
      }
    }
  }

  async _ensureTable() {
    const schema = [
      { name: 'decisionId', type: 'STRING', mode: 'REQUIRED' },
      { name: 'domain', type: 'STRING' },
      { name: 'timestamp', type: 'TIMESTAMP' },
      { name: 'originalPrediction', type: 'STRING' },
      { name: 'mitigatedPrediction', type: 'STRING' },
      { name: 'finalOutcome', type: 'STRING' },
      { name: 'isBiased', type: 'BOOLEAN' },
      { name: 'confidenceScore', type: 'FLOAT64' },
      { name: 'flaggedFeatures', type: 'STRING' }, // JSON array as string
      { name: 'biasReasoning', type: 'STRING' },
      { name: 'isCompliant', type: 'BOOLEAN' },
      { name: 'riskLevel', type: 'STRING' },
      { name: 'explanation', type: 'STRING' },
      { name: 'engine', type: 'STRING' },
      { name: 'status', type: 'STRING' },
    ];

    try {
      const dataset = this.bigquery.dataset(this.datasetId);
      const [tables] = await dataset.getTables();
      const exists = tables.some(t => t.id === this.tableId);

      if (!exists) {
        await dataset.createTable(this.tableId, { schema });
        console.log(`✅ BigQuery table created: ${this.tableId}`);
      }
    } catch (error) {
      if (error.code !== 409) {
        console.warn('BigQuery table check/create warning:', error.message);
      }
    }
  }

  /**
   * Logs an intercepted decision evaluation to BigQuery.
   */
  async logDecision(evaluation) {
    // Always store in-memory for immediate access
    this.rawLogs.push({
      date: new Date().toISOString().split('T')[0],
      isBiased: evaluation.biasReport?.isBiased || false,
      confidence: evaluation.biasReport?.confidenceScore || 0,
      ...evaluation,
    });

    if (!this.isReady || !this.bigquery) {
      console.log('[BigQuery Fallback] Decision logged in-memory:', evaluation.decisionId);
      return { success: true, fallback: true };
    }

    try {
      const row = {
        decisionId: evaluation.decisionId || `dec-${Date.now()}`,
        domain: evaluation.domain || 'unknown',
        timestamp: evaluation.timestamp || new Date().toISOString(),
        originalPrediction: String(evaluation.originalPrediction || ''),
        mitigatedPrediction: String(evaluation.mitigatedPrediction || ''),
        finalOutcome: evaluation.finalOutcome || 'UNKNOWN',
        isBiased: evaluation.biasReport?.isBiased || false,
        confidenceScore: evaluation.biasReport?.confidenceScore || 0,
        flaggedFeatures: JSON.stringify(evaluation.biasReport?.flaggedFeatures || []),
        biasReasoning: String(evaluation.biasReport?.reasoning || ''),
        isCompliant: evaluation.complianceReport?.isCompliant ?? true,
        riskLevel: evaluation.riskReport?.riskLevel || 'UNKNOWN',
        explanation: String(evaluation.explanation || '').substring(0, 5000),
        engine: evaluation.engine || 'UNKNOWN',
        status: evaluation.status || 'UNKNOWN',
      };

      await this.bigquery
        .dataset(this.datasetId)
        .table(this.tableId)
        .insert([row]);

      console.log(`[BigQuery] ✅ Decision logged: ${evaluation.decisionId}`);
      return { success: true };
    } catch (error) {
      // Handle streaming insert errors (they have a specific format)
      if (error.name === 'PartialFailureError') {
        console.error('[BigQuery] Partial insert failure:', JSON.stringify(error.errors?.[0]?.errors));
      } else {
        console.error('[BigQuery] Error logging decision:', error.message);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetches drift analysis over time from BigQuery.
   */
  async getDriftAnalysis(domain = 'FINANCE') {
    if (!this.isReady || !this.bigquery) {
      // Fallback: aggregate in-memory raw logs
      return this._getInMemoryDrift();
    }

    try {
      const query = `
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as totalDecisions,
          COUNTIF(finalOutcome = 'INTERCEPTED') as biasedDecisions,
          AVG(confidenceScore) as avgConfidence
        FROM \`${this.projectId}.${this.datasetId}.${this.tableId}\`
        ${domain !== 'ALL' ? 'WHERE domain = @domain' : ''}
        GROUP BY date
        ORDER BY date ASC
        LIMIT 90
      `;

      const options = {
        query,
        params: domain !== 'ALL' ? { domain } : {},
      };

      const [rows] = await this.bigquery.query(options);

      // Calculate drift score for each row
      const result = rows.map(row => ({
        date: row.date?.value || row.date,
        totalDecisions: row.totalDecisions,
        biasedDecisions: row.biasedDecisions,
        avgConfidence: row.avgConfidence || 0.85,
        driftScore: row.biasedDecisions / (row.totalDecisions || 1),
      }));

      // If no historical data yet, merge with in-memory
      if (result.length === 0) {
        return this._getInMemoryDrift();
      }

      return result;
    } catch (error) {
      console.error('[BigQuery] Error fetching drift analysis:', error.message);
      return this._getInMemoryDrift();
    }
  }

  /**
   * Fallback: aggregate in-memory raw logs by date.
   */
  _getInMemoryDrift() {
    const aggregated = this.rawLogs.reduce((acc, log) => {
      const date = log.date || new Date().toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, totalDecisions: 0, biasedDecisions: 0, sumConfidence: 0 };
      }
      acc[date].totalDecisions++;
      if (log.isBiased) acc[date].biasedDecisions++;
      acc[date].sumConfidence += (log.confidence || 0);
      return acc;
    }, {});

    return Object.values(aggregated)
      .map(d => ({
        ...d,
        avgConfidence: d.sumConfidence / (d.totalDecisions || 1),
        driftScore: d.biasedDecisions / (d.totalDecisions || 1),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Check if BigQuery is connected (for health checks).
   */
  isConnected() {
    return this.isReady;
  }
}

export const bigqueryService = new BigQueryService();
