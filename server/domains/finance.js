export default {
  name: "Finance / Banking",
  metrics: {
    biasMetricTitle: "Approval Rate Parity",
    biasMetricSubtitle: "Credit access fairness",
    targetMetric: "Delta: <5%"
  },
  complianceFrameworks: [
    { title: 'ECOA', description: 'Equal Credit Opportunity Act. Prohibits credit discrimination.', risk: 'High' },
    { title: 'Fair Housing Act', description: 'Prohibits discrimination in housing-related lending.', risk: 'Critical' },
    { title: 'SR 11-7', description: 'Federal Reserve guidance on Model Risk Management.', risk: 'Medium' }
  ],
  rules: [
    { targetFeatures: ['zip_code', 'area_code', 'neighborhood'], framework: 'ECOA & FHA', rule: 'Geographical Redlining', severity: 'Critical' },
    { targetFeatures: ['marital_status', 'spousal_income'], framework: 'ECOA', rule: 'Familial Status Discrimination', severity: 'High' }
  ],
  contextPrompt: "You are analyzing a Finance/Banking decision (e.g., loan approval, credit limits). Pay special attention to geographical data (redlining proxies), marital status, or alternate income markers that might proxy for gender or race under the Equal Credit Opportunity Act.",
  scenarios: [
    { id: "LOAN-001", action: "DENIED", description: "Mortgage Application" },
    { id: "CREDIT-005", action: "APPROVED", description: "Credit Limit Increase" }
  ]
};
