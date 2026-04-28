import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testLargeCSV() {
  console.log('--- Starting 24MB CSV Analysis Test ---');
  const filePath = '/Users/avinashgehi3/projects/GSC-Kryptonite/scratch/test_20mb.csv';
  
  const form = new FormData();
  form.append('csvFile', fs.createReadStream(filePath));
  form.append('domain', 'FINANCE');

  console.log('Uploading and analyzing... (this may take up to 60s)');
  const start = Date.now();
  
  try {
    const res = await fetch('http://localhost:5001/api/analyze-csv', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 180000 // 3 minutes
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Analysis Failed (${res.status}):`, errText);
      return;
    }

    const report = await res.json();
    const duration = (Date.now() - start) / 1000;
    
    console.log(`✅ Analysis Successful in ${duration.toFixed(1)}s!`);
    console.log('--- Report Summary ---');
    console.log('File:', report.metadata.fileName);
    console.log('Rows Scanned:', report.metadata.totalRows);
    console.log('Bias Score:', report.overallBiasScore);
    console.log('Flagged Columns:', report.flaggedColumns.length);
    console.log('Compliance Violations:', report.complianceViolations.length);
    
    if (report.cacheKey) {
      console.log('\n--- Testing Debiased CSV Generation ---');
      const debiasRes = await fetch('http://localhost:5001/api/generate-unbiased-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cacheKey: report.cacheKey })
      });
      
      if (debiasRes.ok) {
        const debiasResult = await debiasRes.json();
        console.log('✅ Debiased CSV Generated Successfully!');
        console.log('Changes Applied:', debiasResult.appliedChanges.length);
      } else {
        console.log('❌ Debiased CSV Generation Failed');
      }
    }

  } catch (err) {
    console.error('❌ Error during test:', err.message);
  }
}

testLargeCSV();
