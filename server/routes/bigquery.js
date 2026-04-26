/**
 * bigquery.js — BigQuery Explorer Routes
 * ─────────────────────────────────────────────────────────
 * Provides endpoints for the BigQuery Explorer UI:
 *  - POST /api/bigquery/test-connection
 *  - POST /api/bigquery/list-tables
 *  - POST /api/bigquery/fetch-table
 * ─────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { BigQuery } from '@google-cloud/bigquery';

const router = Router();

/**
 * POST /api/bigquery/test-connection
 * Tests connectivity to a GCP project and returns available datasets.
 */
router.post('/bigquery/test-connection', async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const bq = new BigQuery({ projectId });
    const [datasets] = await bq.getDatasets();

    res.json({
      success: true,
      projectId,
      datasets: datasets.map(ds => ({
        id: ds.id,
        location: ds.metadata?.location || 'US',
      })),
    });
  } catch (error) {
    console.error('[BigQuery Explorer] Connection test failed:', error.message);
    res.status(500).json({
      error: `Connection failed: ${error.message}`,
    });
  }
});

/**
 * POST /api/bigquery/list-tables
 * Lists all tables in a given dataset.
 */
router.post('/bigquery/list-tables', async (req, res) => {
  try {
    const { projectId, datasetId } = req.body;
    if (!projectId || !datasetId) {
      return res.status(400).json({ error: 'projectId and datasetId are required' });
    }

    const bq = new BigQuery({ projectId });
    const dataset = bq.dataset(datasetId);
    const [tables] = await dataset.getTables();

    res.json({
      success: true,
      tables: tables.map(t => ({
        id: t.id,
        type: t.metadata?.type || 'TABLE',
        rowCount: t.metadata?.numRows || '0',
        sizeBytes: t.metadata?.numBytes || '0',
      })),
    });
  } catch (error) {
    console.error('[BigQuery Explorer] List tables failed:', error.message);
    res.status(500).json({
      error: `Failed to list tables: ${error.message}`,
    });
  }
});

/**
 * POST /api/bigquery/fetch-table
 * Fetches rows from a table for preview and bias analysis.
 */
router.post('/bigquery/fetch-table', async (req, res) => {
  try {
    const { projectId, datasetId, tableId, maxRows = 10000 } = req.body;
    if (!projectId || !datasetId || !tableId) {
      return res.status(400).json({ error: 'projectId, datasetId, and tableId are required' });
    }

    const bq = new BigQuery({ projectId });
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${Math.min(maxRows, 50000)}`;
    const [rows] = await bq.query({ query });

    if (!rows || rows.length === 0) {
      return res.json({ success: true, headers: [], rows: [], totalRows: 0 });
    }

    const headers = Object.keys(rows[0]);
    const formattedRows = rows.map(row => {
      const obj = {};
      for (const key of headers) {
        const val = row[key];
        obj[key] = val !== null && val !== undefined ? String(val) : '';
      }
      return obj;
    });

    res.json({
      success: true,
      headers,
      rows: formattedRows,
      totalRows: formattedRows.length,
    });
  } catch (error) {
    console.error('[BigQuery Explorer] Fetch table failed:', error.message);
    res.status(500).json({
      error: `Failed to fetch table: ${error.message}`,
    });
  }
});

export default router;
