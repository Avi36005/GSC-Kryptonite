export default {
  name: "Hiring / Recruitment",
  metrics: {
    biasMetricTitle: "Demographic Disparity",
    biasMetricSubtitle: "Disparate impact ratio",
    targetMetric: "Target: >0.8"
  },
  complianceFrameworks: [
    { title: 'Civil Rights Act (Title VII)', description: 'Prohibits employment discrimination based on race, color, religion, sex and national origin.', risk: 'High' },
    { title: 'ADEA', description: 'Age Discrimination in Employment Act compliance.', risk: 'Medium' },
    { title: 'NYC Local Law 144', description: 'Automated employment decision tools audited annually. Bias audit published.', risk: 'Low' }
  ],
  rules: [
    { targetFeatures: ['zip_code', 'neighborhood', 'commute_distance'], framework: 'Title VII', rule: 'Geographical Redlining Proxy for Race/Origin', severity: 'Critical' },
    { targetFeatures: ['graduation_year', 'years_experience_cap'], framework: 'ADEA', rule: 'Age Proxy', severity: 'High' }
  ],
  contextPrompt: "You are analyzing a Hiring/Recruitment decision. Pay special attention to features like education dates (age proxy), zip codes (race/origin proxy), or organization affiliations that might proxy for gender or religion.",
  scenarios: [
    { id: "HIRE-101", action: "REJECTED", description: "Candidate Filtered" },
    { id: "HIRE-102", action: "ADVANCED", description: "Interview Scheduled" }
  ]
};
