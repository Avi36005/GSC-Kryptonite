import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { GoogleGenAI } from '@google/genai';
import { getDomainConfig } from '../domains/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Configure multer for CSV uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * Helper: Parse CSV file and return { headers, rows }
 */
function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { headers, rows: records, rawContent: content };
}

/**
 * Helper: Build a representative sample for Gemini (first + last + random middle rows)
 */
function buildSample(rows, maxSample = 30) {
  if (rows.length <= maxSample) return rows;

  const sample = [];
  // First 10 rows
  sample.push(...rows.slice(0, 10));
  // Last 5 rows
  sample.push(...rows.slice(-5));
  // Random middle rows
  const remaining = maxSample - sample.length;
  const middleIndices = new Set();
  while (middleIndices.size < remaining) {
    const idx = Math.floor(Math.random() * (rows.length - 15)) + 10;
    middleIndices.add(idx);
  }
  for (const idx of middleIndices) {
    sample.push(rows[idx]);
  }
  return sample;
}

/**
 * Helper: Compute basic statistical summaries for numeric/categorical columns
 */
function computeColumnStats(headers, rows) {
  const stats = {};
  for (const col of headers) {
    const values = rows.map(r => r[col]).filter(v => v !== undefined && v !== null && v !== '');
    const numericValues = values.map(Number).filter(v => !isNaN(v));

    if (numericValues.length > values.length * 0.6) {
      // Numeric column
      const sorted = numericValues.sort((a, b) => a - b);
      stats[col] = {
        type: 'numeric',
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: +(numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2),
        uniqueCount: new Set(values).size,
      };
    } else {
      // Categorical column
      const freq = {};
      for (const v of values) {
        freq[v] = (freq[v] || 0) + 1;
      }
      const topEntries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
      stats[col] = {
        type: 'categorical',
        count: values.length,
        uniqueCount: new Set(values).size,
        topValues: Object.fromEntries(topEntries),
      };
    }
  }
  return stats;
}

/**
 * POST /api/analyze-csv
 * Accepts a CSV file upload + domain, returns a real Gemini-powered bias analysis report.
 */
router.post('/analyze-csv', upload.single('csvFile'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    filePath = req.file.path;
    const domain = req.body.domain || 'hiring';
    const domainConfig = getDomainConfig(domain);

    // Parse the CSV
    const { headers, rows } = parseCSVFile(filePath);

    if (headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or has no valid data' });
    }

    // Compute statistics for Gemini context
    const columnStats = computeColumnStats(headers, rows);
    const sampleRows = buildSample(rows);

    // Build the Gemini prompt
    const prompt = `You are the BiasDetectionAgent for FairAI Guardian, analyzing a dataset in the "${domainConfig.name}" domain.
${domainConfig.contextPrompt}

DATASET OVERVIEW:
- Total rows: ${rows.length}
- Total columns: ${headers.length}
- Column names: ${JSON.stringify(headers)}

COLUMN STATISTICS:
${JSON.stringify(columnStats, null, 2)}

SAMPLE ROWS (${sampleRows.length} of ${rows.length}):
${JSON.stringify(sampleRows, null, 2)}

DOMAIN COMPLIANCE FRAMEWORKS:
${JSON.stringify(domainConfig.complianceFrameworks, null, 2)}

DOMAIN BIAS RULES:
${JSON.stringify(domainConfig.rules, null, 2)}

YOUR TASK:
Perform a comprehensive bias audit of this dataset. Analyze every column for potential bias, proxy discrimination, and compliance violations.

Respond ONLY with valid JSON in this exact structure (no markdown, no extra text):
{
  "overallBiasScore": <number 0-100, where 100 is extremely biased>,
  "legalRiskScore": <number 0-100>,
  "ethicalRiskScore": <number 0-100>,
  "totalRowsScanned": ${rows.length},
  "summary": "<2-3 sentence executive summary of the bias findings>",
  "flaggedColumns": [
    {
      "column": "<column name>",
      "severity": "critical" | "high" | "medium" | "low",
      "biasType": "<type of bias: proxy, direct, statistical, historical>",
      "affectedProtectedClasses": ["<list of affected groups: race, gender, age, etc.>"],
      "correlationStrength": <number 0.0-1.0>,
      "reasoning": "<detailed explanation of why this column is biased>",
      "recommendation": "<specific action to fix this>"
    }
  ],
  "statisticalDisparities": [
    {
      "metric": "<e.g., Disparate Impact Ratio, Demographic Parity Difference>",
      "value": <number>,
      "threshold": <number>,
      "status": "violation" | "warning" | "pass",
      "details": "<explanation>"
    }
  ],
  "complianceViolations": [
    {
      "framework": "<legal framework name>",
      "violation": "<description of the violation>",
      "severity": "critical" | "high" | "medium" | "low",
      "affectedColumns": ["<columns involved>"]
    }
  ],
  "debiasingSuggestions": [
    {
      "action": "remove" | "anonymize" | "reweight" | "transform" | "synthetic_oversample",
      "targetColumns": ["<columns to apply action to>"],
      "description": "<what to do and why>",
      "priority": "immediate" | "recommended" | "optional"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const responseText = response.text || '';

    // Parse the JSON from Gemini's response
    let biasReport;
    try {
      // Try to extract JSON from the response (handles markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        biasReport = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', responseText);
      return res.status(500).json({
        error: 'Failed to parse AI analysis response',
        rawResponse: responseText.substring(0, 500),
      });
    }

    // Enrich the report with metadata
    biasReport.metadata = {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      totalRows: rows.length,
      totalColumns: headers.length,
      headers: headers,
      domain: domainConfig.name,
      analyzedAt: new Date().toISOString(),
    };

    // Store the parsed data temporarily for debiasing
    // Use a simple in-memory cache keyed by filename + timestamp
    const cacheKey = `${Date.now()}-${req.file.originalname}`;
    csvDataCache.set(cacheKey, { headers, rows, filePath, biasReport });

    // Auto-cleanup after 30 minutes
    setTimeout(() => {
      csvDataCache.delete(cacheKey);
      // Clean up the uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }, 30 * 60 * 1000);

    biasReport.cacheKey = cacheKey;

    res.json(biasReport);
  } catch (error) {
    console.error('CSV Analysis Error:', error);
    // Clean up file on error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: 'Internal server error during CSV analysis', details: error.message });
  }
});

// In-memory cache for CSV data (for debiasing step)
const csvDataCache = new Map();

/**
 * POST /api/generate-unbiased-csv
 * Takes a cacheKey referencing the previously analyzed CSV + bias report,
 * uses Gemini to determine transformations, applies them, and returns a corrected CSV.
 */
router.post('/generate-unbiased-csv', express.json(), async (req, res) => {
  try {
    const { cacheKey } = req.body;

    if (!cacheKey || !csvDataCache.has(cacheKey)) {
      return res.status(400).json({ error: 'Analysis session expired or not found. Please re-upload and analyze the CSV.' });
    }

    const { headers, rows, biasReport } = csvDataCache.get(cacheKey);
    const sampleRows = buildSample(rows, 15);

    // Ask Gemini for specific transformation instructions
    const prompt = `You are the DebiasAgent for FairAI Guardian. You must produce a corrected, unbiased version of a dataset.

ORIGINAL DATASET:
- Columns: ${JSON.stringify(headers)}
- Total rows: ${rows.length}
- Sample rows: ${JSON.stringify(sampleRows, null, 2)}

BIAS REPORT FINDINGS:
${JSON.stringify(biasReport.flaggedColumns, null, 2)}

DEBIASING SUGGESTIONS FROM ANALYSIS:
${JSON.stringify(biasReport.debiasingSuggestions, null, 2)}

YOUR TASK:
Provide specific, programmatic transformation instructions to debias this dataset. For each transformation, specify exactly what to do.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "transformations": [
    {
      "type": "remove_column",
      "column": "<column to remove>",
      "reason": "<why>"
    },
    {
      "type": "anonymize",
      "column": "<column to anonymize>",
      "method": "hash" | "generalize" | "suppress" | "replace_with_category",
      "reason": "<why>",
      "mapping": { "<original_value>": "<replacement>" } 
    },
    {
      "type": "rename_column",
      "oldName": "<old>",
      "newName": "<new>",
      "reason": "<why>"
    },
    {
      "type": "add_column",
      "column": "<new column name>",
      "defaultValue": "<default>",
      "reason": "<why>"
    }
  ],
  "removedColumns": ["<list of columns that were fully removed>"],
  "modifiedColumns": ["<list of columns that were modified>"],
  "summary": "<description of all changes made>"
}

IMPORTANT:
- Only provide transformations that are necessary to remove bias.
- Do NOT fabricate data or change outcome/decision columns arbitrarily.
- Focus on removing proxy variables, anonymizing PII, and generalizing sensitive categories.
- Each transformation must reference actual column names from the dataset.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const responseText = response.text || '';
    let instructions;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        instructions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Failed to parse debiasing instructions:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI debiasing instructions' });
    }

    // Apply transformations to the dataset
    let debiasedRows = rows.map(row => ({ ...row }));
    let debiasedHeaders = [...headers];
    const appliedChanges = [];

    for (const transform of (instructions.transformations || [])) {
      try {
        switch (transform.type) {
          case 'remove_column': {
            if (debiasedHeaders.includes(transform.column)) {
              debiasedHeaders = debiasedHeaders.filter(h => h !== transform.column);
              debiasedRows = debiasedRows.map(row => {
                const newRow = { ...row };
                delete newRow[transform.column];
                return newRow;
              });
              appliedChanges.push(`Removed column "${transform.column}": ${transform.reason}`);
            }
            break;
          }
          case 'anonymize': {
            if (debiasedHeaders.includes(transform.column)) {
              if (transform.mapping && Object.keys(transform.mapping).length > 0) {
                // Apply mapping
                debiasedRows = debiasedRows.map(row => {
                  const val = row[transform.column];
                  if (val in transform.mapping) {
                    row[transform.column] = transform.mapping[val];
                  }
                  return row;
                });
              } else if (transform.method === 'hash') {
                // Simple hash anonymization
                let counter = 0;
                const seen = {};
                debiasedRows = debiasedRows.map(row => {
                  const val = row[transform.column];
                  if (!(val in seen)) {
                    counter++;
                    seen[val] = `ANON_${counter}`;
                  }
                  row[transform.column] = seen[val];
                  return row;
                });
              } else if (transform.method === 'suppress') {
                debiasedRows = debiasedRows.map(row => {
                  row[transform.column] = '[REDACTED]';
                  return row;
                });
              } else if (transform.method === 'generalize' || transform.method === 'replace_with_category') {
                // Generalize: replace specific values with broader categories
                const uniqueVals = [...new Set(debiasedRows.map(r => r[transform.column]))];
                const categoryMap = {};
                uniqueVals.forEach((v, i) => {
                  categoryMap[v] = `Category_${String.fromCharCode(65 + (i % 26))}`;
                });
                debiasedRows = debiasedRows.map(row => {
                  const val = row[transform.column];
                  if (val in categoryMap) row[transform.column] = categoryMap[val];
                  return row;
                });
              }
              appliedChanges.push(`Anonymized column "${transform.column}" using ${transform.method}: ${transform.reason}`);
            }
            break;
          }
          case 'rename_column': {
            if (debiasedHeaders.includes(transform.oldName)) {
              const idx = debiasedHeaders.indexOf(transform.oldName);
              debiasedHeaders[idx] = transform.newName;
              debiasedRows = debiasedRows.map(row => {
                row[transform.newName] = row[transform.oldName];
                delete row[transform.oldName];
                return row;
              });
              appliedChanges.push(`Renamed column "${transform.oldName}" → "${transform.newName}": ${transform.reason}`);
            }
            break;
          }
          case 'add_column': {
            if (!debiasedHeaders.includes(transform.column)) {
              debiasedHeaders.push(transform.column);
              debiasedRows = debiasedRows.map(row => {
                row[transform.column] = transform.defaultValue || '';
                return row;
              });
              appliedChanges.push(`Added column "${transform.column}": ${transform.reason}`);
            }
            break;
          }
        }
      } catch (transformError) {
        console.error(`Error applying transformation:`, transform, transformError);
      }
    }

    // Generate the corrected CSV
    const csvOutput = stringify(debiasedRows, {
      header: true,
      columns: debiasedHeaders,
    });

    res.json({
      csv: csvOutput,
      fileName: `unbiased_${Date.now()}.csv`,
      appliedChanges,
      summary: instructions.summary || 'Debiasing transformations applied.',
      removedColumns: instructions.removedColumns || [],
      modifiedColumns: instructions.modifiedColumns || [],
      originalColumnCount: headers.length,
      newColumnCount: debiasedHeaders.length,
      rowCount: debiasedRows.length,
    });
  } catch (error) {
    console.error('Debiasing Error:', error);
    res.status(500).json({ error: 'Internal server error during debiasing', details: error.message });
  }
});

/**
 * POST /api/analyze-data
 * Accepts raw JSON data (headers + rows) from BigQuery or other sources,
 * runs the same Gemini bias analysis pipeline as analyze-csv.
 */
router.post('/analyze-data', express.json(), async (req, res) => {
  try {
    const { headers, rows, domain = 'hiring', sourceName = 'BigQuery Table' } = req.body;

    if (!headers || !rows || headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ error: 'No valid data provided. Requires headers and rows arrays.' });
    }

    const domainConfig = getDomainConfig(domain);
    const columnStats = computeColumnStats(headers, rows);
    const sampleRows = buildSample(rows);

    // Same prompt as analyze-csv
    const prompt = `You are the BiasDetectionAgent for FairAI Guardian, analyzing a dataset in the "${domainConfig.name}" domain.
${domainConfig.contextPrompt}

DATASET OVERVIEW:
- Total rows: ${rows.length}
- Total columns: ${headers.length}
- Column names: ${JSON.stringify(headers)}

COLUMN STATISTICS:
${JSON.stringify(columnStats, null, 2)}

SAMPLE ROWS (${sampleRows.length} of ${rows.length}):
${JSON.stringify(sampleRows, null, 2)}

DOMAIN COMPLIANCE FRAMEWORKS:
${JSON.stringify(domainConfig.complianceFrameworks, null, 2)}

DOMAIN BIAS RULES:
${JSON.stringify(domainConfig.rules, null, 2)}

YOUR TASK:
Perform a comprehensive bias audit of this dataset. Analyze every column for potential bias, proxy discrimination, and compliance violations.

Respond ONLY with valid JSON in this exact structure (no markdown, no extra text):
{
  "overallBiasScore": <number 0-100, where 100 is extremely biased>,
  "legalRiskScore": <number 0-100>,
  "ethicalRiskScore": <number 0-100>,
  "totalRowsScanned": ${rows.length},
  "summary": "<2-3 sentence executive summary of the bias findings>",
  "flaggedColumns": [
    {
      "column": "<column name>",
      "severity": "critical" | "high" | "medium" | "low",
      "biasType": "<type of bias: proxy, direct, statistical, historical>",
      "affectedProtectedClasses": ["<list of affected groups: race, gender, age, etc.>"],
      "correlationStrength": <number 0.0-1.0>,
      "reasoning": "<detailed explanation of why this column is biased>",
      "recommendation": "<specific action to fix this>"
    }
  ],
  "statisticalDisparities": [
    {
      "metric": "<e.g., Disparate Impact Ratio, Demographic Parity Difference>",
      "value": <number>,
      "threshold": <number>,
      "status": "violation" | "warning" | "pass",
      "details": "<explanation>"
    }
  ],
  "complianceViolations": [
    {
      "framework": "<legal framework name>",
      "violation": "<description of the violation>",
      "severity": "critical" | "high" | "medium" | "low",
      "affectedColumns": ["<columns involved>"]
    }
  ],
  "debiasingSuggestions": [
    {
      "action": "remove" | "anonymize" | "reweight" | "transform" | "synthetic_oversample",
      "targetColumns": ["<columns to apply action to>"],
      "description": "<what to do and why>",
      "priority": "immediate" | "recommended" | "optional"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const responseText = response.text || '';
    let biasReport;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        biasReport = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      return res.status(500).json({
        error: 'Failed to parse AI analysis response',
        rawResponse: responseText.substring(0, 500),
      });
    }

    biasReport.metadata = {
      fileName: sourceName,
      fileSize: 0,
      totalRows: rows.length,
      totalColumns: headers.length,
      headers: headers,
      domain: domainConfig.name,
      analyzedAt: new Date().toISOString(),
      source: 'bigquery',
    };

    // Cache for debiasing
    const cacheKey = `bq-${Date.now()}-${sourceName}`;
    csvDataCache.set(cacheKey, { headers, rows, biasReport });

    setTimeout(() => {
      csvDataCache.delete(cacheKey);
    }, 30 * 60 * 1000);

    biasReport.cacheKey = cacheKey;

    res.json(biasReport);
  } catch (error) {
    console.error('Data Analysis Error:', error);
    res.status(500).json({ error: 'Internal server error during data analysis', details: error.message });
  }
});

export default router;

