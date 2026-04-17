export default {
  name: "Healthcare",
  metrics: {
    biasMetricTitle: "Outcome Equality",
    biasMetricSubtitle: "Treatment Consistency Ratio",
    targetMetric: "Target: >95%"
  },
  complianceFrameworks: [
    { title: 'HIPAA', description: 'Health Insurance Portability and Accountability Act. Protects patient data.', risk: 'Critical' },
    { title: 'ACA Section 1557', description: 'Prohibits discrimination in health programs and activities.', risk: 'High' },
    { title: 'Medical Ethics Guidelines', description: 'Ensures beneficence and non-maleficence in algorithmic triage.', risk: 'Medium' }
  ],
  rules: [
    { targetFeatures: ['insurance_type', 'medicaid_status', 'income'], framework: 'Medical Ethics Guidelines', rule: 'Socioeconomic Triage Bias', severity: 'High' },
    { targetFeatures: ['zip_code', 'language'], framework: 'ACA Section 1557', rule: 'National Origin/Race Proxy in Treatment', severity: 'Critical' }
  ],
  contextPrompt: "You are analyzing a Healthcare decision (e.g., patient triage, treatment plans, resource allocation). Pay special attention to features like insurance status, zip codes, or language, which might act as proxies for socioeconomic status, race, or national origin, resulting in disparities in care.",
  scenarios: [
    { id: "TRIAGE-099", action: "DE-PRIORITIZED", description: "ER Waitlist Assignment" },
    { id: "CLAIM-402", action: "DENIED", description: "Insurance Claim Pre-Auth" }
  ]
};
