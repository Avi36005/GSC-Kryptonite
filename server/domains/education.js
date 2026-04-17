export default {
  name: "Education",
  metrics: {
    biasMetricTitle: "Access Equality",
    biasMetricSubtitle: "Admission Fairness Ratio",
    targetMetric: "Target: >0.8"
  },
  complianceFrameworks: [
    { title: 'Title IX', description: 'Prohibits sex-based discrimination in education programs.', risk: 'Critical' },
    { title: 'Title VI', description: 'Prohibits discrimination on the basis of race, color, and national origin.', risk: 'High' },
    { title: 'FERPA', description: 'Family Educational Rights and Privacy Act.', risk: 'Medium' }
  ],
  rules: [
    { targetFeatures: ['legacy_status', 'donor_affiliation'], framework: 'Title VI / Equal Opportunity', rule: 'Socioeconomic/Racial Privilege Proxy', severity: 'High' },
    { targetFeatures: ['zip_code', 'high_school_name'], framework: 'Title VI', rule: 'Geographical/Racial Proxy', severity: 'Critical' }
  ],
  contextPrompt: "You are analyzing an Education decision (e.g., university admissions, scholarship allocation, academic tracking). Look for features like legacy status, high school district, or zip code that might act as proxies for racial or socioeconomic backgrounds, potentially violating Title VI or Equal Opportunity laws.",
  scenarios: [
    { id: "ADMIT-202", action: "REJECTED", description: "University Admission" },
    { id: "SCHOLAR-01", action: "APPROVED", description: "Merit Scholarship" }
  ]
};
