import { BigQuery } from '@google-cloud/bigquery';

class BigQueryService {
  constructor() {
    this.bigquery = new BigQuery();
    this.datasetId = 'fairai_governance';
    this.tableId = 'decisions';
  }

  async logDecision(decision) {
    try {
      await this.bigquery.dataset(this.datasetId).table(this.tableId).insert([decision]);
      console.log('[BigQuery] Real Decision logged successfully');
    } catch (error) {
      console.error('BigQuery Logging Error:', error);
      throw error;
    }
  }

  async getDriftAnalysis(domain) {

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
