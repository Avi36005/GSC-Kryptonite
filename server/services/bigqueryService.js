import { BigQuery } from '@google-cloud/bigquery';

class BigQueryService {
  constructor() {
    this.isSimulated = true; // For this demo, we simulate BigQuery
    this.mockData = this.generateMockHistory();
    this.rawLogs = []; // Stores real-time intercepted decisions for aggregation
  }

  generateMockHistory() {
    const history = [];
    const now = new Date();
    for (let i = 40; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Gradually increasing drift
      const baseDrift = 2 + (40 - i) * 0.3; 
      const total = 1000 + Math.floor(Math.random() * 200);
      const biased = Math.floor(total * (baseDrift / 100));
      
      history.push({
        date: dateStr,
        totalDecisions: total,
        biasedDecisions: biased,
        avgConfidence: 0.95 - (baseDrift / 200),
        driftScore: baseDrift / 100
      });
    }
    return history;
  }

  /**
   * Logs an intercepted decision evaluation to "BigQuery"
   */
  async logDecision(evaluation) {
    if (this.isSimulated) {
      // In simulation, we store the raw decision for aggregation in getDriftAnalysis
      this.rawLogs.push({
        date: new Date().toISOString().split('T')[0],
        isBiased: evaluation.biasReport?.isBiased || false,
        confidence: evaluation.biasReport?.confidenceScore || 0,
        ...evaluation
      });
      return { success: true, simulated: true };
    }
    
    // Real BigQuery implementation would go here
    console.log("BigQuery Logging Enabled: (Not implemented in demo)");
    return { success: true };
  }

  /**
   * Fetches drift analysis over time
   */
  async getDriftAnalysis(domain = 'FINANCE') {
    if (this.isSimulated) {
      // Aggregate raw logs by date to merge with historical mock data
      const aggregatedLogs = this.rawLogs.reduce((acc, log) => {
        if (!acc[log.date]) {
          acc[log.date] = { date: log.date, totalDecisions: 0, biasedDecisions: 0, sumConfidence: 0 };
        }
        acc[log.date].totalDecisions++;
        if (log.isBiased) acc[log.date].biasedDecisions++;
        acc[log.date].sumConfidence += log.confidence;
        return acc;
      }, {});

      // Convert to array and calculate scores
      const liveData = Object.values(aggregatedLogs).map(d => ({
        ...d,
        avgConfidence: d.sumConfidence / d.totalDecisions,
        driftScore: d.biasedDecisions / d.totalDecisions
      }));

      // Merge mock data with live data (overwriting mock dates with real data if they overlap)
      const dateMap = new Map();
      this.mockData.forEach(d => dateMap.set(d.date, d));
      liveData.forEach(d => {
        const existing = dateMap.get(d.date) || { totalDecisions: 0, biasedDecisions: 0, sumConfidence: 0 };
        const total = (existing.totalDecisions || 0) + d.totalDecisions;
        const biased = (existing.biasedDecisions || 0) + d.biasedDecisions;
        const avgConf = existing.avgConfidence ? (existing.avgConfidence + d.avgConfidence) / 2 : d.avgConfidence;
        
        dateMap.set(d.date, {
          date: d.date,
          totalDecisions: total,
          biasedDecisions: biased,
          avgConfidence: avgConf,
          driftScore: biased / (total || 1)
        });
      });

      return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }

    const query = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as totalDecisions,
        SUM(CASE WHEN finalOutcome = 'INTERCEPTED' THEN 1 ELSE 0 END) as biasedDecisions,
        AVG(biasReport.confidenceScore) as avgConfidence
      FROM \`${this.datasetId}.${this.tableId}\`
      WHERE domain = @domain
      GROUP BY date
      ORDER BY date ASC
    `;

    const options = {
      query: query,
      params: { domain }
    };

    const [rows] = await this.bigquery.query(options);
    return rows;
  }
}

export const bigqueryService = new BigQueryService();
