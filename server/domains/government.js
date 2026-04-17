export default {
  name: "Government Services",
  metrics: {
    biasMetricTitle: "Resource Allocation Fairness",
    biasMetricSubtitle: "Public Policy Equality",
    targetMetric: "Target: 1.0 (Parity)"
  },
  complianceFrameworks: [
    { title: 'Equal Protection Clause', description: '14th Amendment ensuring equal protection under the law.', risk: 'Critical' },
    { title: 'Administrative Procedure Act', description: 'Governs how federal agencies develop and issue regulations.', risk: 'Medium' },
    { title: 'Civil Rights Act (Title VI)', description: 'Prohibits discrimination in federally funded programs.', risk: 'High' }
  ],
  rules: [
    { targetFeatures: ['zip_code', 'neighborhood_risk_score', 'police_precinct'], framework: 'Equal Protection / Title VI', rule: 'Systemic Disenfranchisement Proxy', severity: 'Critical' },
    { targetFeatures: ['welfare_status', 'prior_incarceration'], framework: 'Public Policy Fairness', rule: 'Poverty/Systemic Bias Proxy', severity: 'High' }
  ],
  contextPrompt: "You are analyzing a Government Services decision (e.g., welfare qualification, predictive policing, public housing allocation). Scrutinize geographic markers (zip codes, precincts) or socio-economic indicators (welfare status) that often act as proxies for race or systemic disenfranchisement, violating Equal Protection standards.",
  scenarios: [
    { id: "HOUSING-88", action: "WAITLISTED", description: "Public Housing Allocation" },
    { id: "BENEFIT-44", action: "DENIED", description: "Welfare Qualification" }
  ]
};
