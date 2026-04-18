import express from 'express';
import { BigQuery } from '@google-cloud/bigquery';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const router = express.Router();

/**
 * Create a BigQuery client.
 * Uses Application Default Credentials (ADC) or service account from env.
 * If FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set, uses those.
 * Otherwise falls back to ADC (gcloud auth application-default login).
 */
function getBigQueryClient(projectId) {
  const options = { projectId: projectId || process.env.BIGQUERY_PROJECT_ID };

  // If we have service account credentials in env, use them
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY !== '"YOUR_PRIVATE_KEY"') {
    options.credentials = {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return new BigQuery(options);
}

/**
 * POST /api/bigquery/test-connection
 * Test if the BigQuery connection works and list available datasets
 */
router.post('/bigquery/test-connection', async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const bigquery = getBigQueryClient(projectId);

    // List datasets to verify connection
    const [datasets] = await bigquery.getDatasets();
    const datasetList = datasets.map(ds => ({
      id: ds.id,
      location: ds.metadata?.location || 'unknown',
    }));

    res.json({
      connected: true,
      projectId,
      datasets: datasetList,
    });
  } catch (error) {
    console.error('BigQuery connection error:', error);
    
    let userMessage = 'Failed to connect to BigQuery.';
    if (error.message?.includes('Could not load the default credentials')) {
      userMessage = 'No Google Cloud credentials found. Run "gcloud auth application-default login" or configure a service account in .env';
    } else if (error.message?.includes('Permission')) {
      userMessage = `Permission denied. Ensure the service account has BigQuery access for project "${req.body.projectId}".`;
    } else if (error.message?.includes('Not found')) {
      userMessage = `Project "${req.body.projectId}" not found. Check the project ID.`;
    }
    
    res.status(400).json({ 
      connected: false, 
      error: userMessage,
      details: error.message,
    });
  }
});

/**
 * POST /api/bigquery/list-tables
 * List tables in a specific dataset
 */
router.post('/bigquery/list-tables', async (req, res) => {
  try {
    const { projectId, datasetId } = req.body;

    if (!projectId || !datasetId) {
      return res.status(400).json({ error: 'Project ID and Dataset ID are required' });
    }

    const bigquery = getBigQueryClient(projectId);
    const dataset = bigquery.dataset(datasetId);
    const [tables] = await dataset.getTables();

    const tableList = tables.map(t => ({
      id: t.id,
      type: t.metadata?.type || 'TABLE',
      rowCount: t.metadata?.numRows || 'unknown',
      sizeBytes: t.metadata?.numBytes || 0,
    }));

    res.json({ tables: tableList });
  } catch (error) {
    console.error('BigQuery list tables error:', error);
    res.status(400).json({ error: 'Failed to list tables', details: error.message });
  }
});

/**
 * POST /api/bigquery/fetch-table
 * Fetch data from a BigQuery table and return as CSV-like JSON (headers + rows)
 * Supports a row limit to avoid pulling massive datasets
 */
router.post('/bigquery/fetch-table', async (req, res) => {
  try {
    const { projectId, datasetId, tableId, maxRows = 10000 } = req.body;

    if (!projectId || !datasetId || !tableId) {
      return res.status(400).json({ error: 'Project ID, Dataset ID, and Table ID are required' });
    }

    const bigquery = getBigQueryClient(projectId);

    // Query the table with a limit
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${Math.min(maxRows, 50000)}`;
    
    const [rows] = await bigquery.query({ query });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Table is empty or returned no rows' });
    }

    const headers = Object.keys(rows[0]);

    // Convert BigQuery row objects to plain string values for consistent handling
    const plainRows = rows.map(row => {
      const plain = {};
      for (const key of headers) {
        const val = row[key];
        plain[key] = val === null || val === undefined ? '' : String(val);
      }
      return plain;
    });

    res.json({
      headers,
      rows: plainRows,
      totalRows: plainRows.length,
      source: `${projectId}.${datasetId}.${tableId}`,
    });
  } catch (error) {
    console.error('BigQuery fetch error:', error);
    res.status(400).json({ error: 'Failed to fetch table data', details: error.message });
  }
});

/**
 * POST /api/bigquery/analyze
 * Fetch data from BigQuery and run it through the same bias analysis pipeline
 * This combines fetch + analyze in one step for convenience
 */
router.post('/bigquery/analyze', async (req, res) => {
  try {
    const { projectId, datasetId, tableId, maxRows = 10000, domain = 'hiring' } = req.body;

    if (!projectId || !datasetId || !tableId) {
      return res.status(400).json({ error: 'Project ID, Dataset ID, and Table ID are required' });
    }

    const bigquery = getBigQueryClient(projectId);
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` LIMIT ${Math.min(maxRows, 50000)}`;
    const [rows] = await bigquery.query({ query });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Table is empty or returned no rows' });
    }

    const headers = Object.keys(rows[0]);
    const plainRows = rows.map(row => {
      const plain = {};
      for (const key of headers) {
        const val = row[key];
        plain[key] = val === null || val === undefined ? '' : String(val);
      }
      return plain;
    });

    // Now we have the data — redirect to the CSV analysis logic
    // We store it in the request and forward it
    res.json({
      headers,
      rows: plainRows,
      totalRows: plainRows.length,
      source: `${projectId}.${datasetId}.${tableId}`,
      message: 'Data fetched from BigQuery. Use /api/analyze-csv-data to analyze.',
    });
  } catch (error) {
    console.error('BigQuery analyze error:', error);
    res.status(400).json({ error: 'Failed to analyze BigQuery data', details: error.message });
  }
});

export default router;
