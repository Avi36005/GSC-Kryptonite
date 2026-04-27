/**
 * seed_data.js
 * ─────────────────────────────────────────────────────────
 * Generates and stores synthetic data in BigQuery and Firestore
 * to verify connections and populate the Drift Analysis page.
 * ─────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import { bigqueryService } from './services/bigqueryService.js';
import { firestoreService } from './services/firestoreService.js';

const generateSyntheticData = () => {
  const domains = ['hiring', 'finance', 'healthcare', 'education'];
  const data = [];
  const now = new Date();

  // Generate data for the last 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Create multiple decisions per day
    const numDecisions = 5 + Math.floor(Math.random() * 10);
    
    for (let j = 0; j < numDecisions; j++) {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const isBiased = Math.random() < (0.1 + (i / 100)); // Slight drift trend
      
      data.push({
        decisionId: `seed-${date.getTime()}-${j}`,
        domain: domain.toUpperCase(),
        timestamp: date.toISOString(),
        originalPrediction: 'APPROVED',
        mitigatedPrediction: isBiased ? 'REJECTED' : 'APPROVED',
        finalOutcome: isBiased ? 'INTERCEPTED' : 'PROCEEDED',
        biasReport: {
          isBiased,
          confidenceScore: 0.7 + (Math.random() * 0.25),
          flaggedFeatures: isBiased ? ['age', 'zipcode'] : [],
          reasoning: isBiased ? 'Detected potential age bias in credit assessment.' : 'No significant bias detected.'
        },
        complianceReport: {
          isCompliant: !isBiased,
          missingPolicies: isBiased ? ['fair_lending_act_2024'] : []
        },
        riskReport: {
          riskLevel: isBiased ? 'HIGH' : 'LOW'
        },
        explanation: 'Automated evaluation for seeding purposes.',
        engine: 'Gemini-2.5-Pro',
        status: 'COMPLETED'
      });
    }
  }
  return data;
};

const seed = async () => {
  console.log('🚀 Starting synthetic data seeding...');
  
  const syntheticData = generateSyntheticData();
  console.log(`📊 Generated ${syntheticData.length} records.`);

  let bqCount = 0;
  let fsCount = 0;

  // We'll insert in small batches to avoid hitting rate limits or overhead
  for (let i = 0; i < syntheticData.length; i++) {
    const record = syntheticData[i];
    
    // Log to BigQuery
    const bqRes = await bigqueryService.logDecision(record);
    if (bqRes.success) bqCount++;

    // Save to Firestore (only every 5th record to save space/time)
    if (i % 5 === 0) {
      const fsRes = await firestoreService.saveAuditLog(record);
      if (fsRes.success) fsCount++;
    }

    if (i % 50 === 0 && i > 0) {
      console.log(`Processed ${i} records...`);
    }
  }

  console.log('\n✅ Seeding completed!');
  console.log(`BigQuery records: ${bqCount} / ${syntheticData.length}`);
  console.log(`Firestore records: ${fsCount} / ${Math.ceil(syntheticData.length / 5)}`);
  
  if (bqCount === 0 && fsCount === 0) {
    console.warn('\n⚠️  Both BigQuery and Firestore failed or used fallbacks.');
    console.warn('Check if you have run: gcloud auth application-default login');
  } else {
    console.log('\n🚀 Connections verified! You can now view the data on the Drift Analysis page.');
  }

  process.exit(0);
};

seed().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
