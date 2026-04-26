export class ComplianceAgent {
  async verify(features, prediction, biasReport, domainConfig) {
    let isCompliant = true;
    let violations = [];

    // Defensive check for reports
    const safeBiasReport = biasReport || { isBiased: false, flaggedFeatures: [] };
    const flaggedFeatures = safeBiasReport.flaggedFeatures || [];

    // Loop through dynamic domain rules
    if (domainConfig && domainConfig.rules) {
      for (const rule of domainConfig.rules) {
        // If a feature explicitly matches a rule's target feature
        const matchesFeature = rule.targetFeatures.some(feat => Object.keys(features || {}).includes(feat));
        
        // Or if Gemini dynamically flagged a feature that matches the target features
        const flaggedByAI = rule.targetFeatures.some(feat => flaggedFeatures.includes(feat));

        if (matchesFeature || flaggedByAI) {
           violations.push({
             framework: rule.framework,
             rule: rule.rule,
             severity: rule.severity
           });
           
           // If the AI already thinks it's biased and it matches a severe rule, it's non-compliant.
           // Or if the outcome is negative and a critical proxy rule is triggered.
           if (safeBiasReport.isBiased || prediction === 'DENIED' || prediction === 'REJECTED') {
              isCompliant = false;
           }
        }
      }
    }

    return {
      isCompliant,
      violations,
      engine: safeBiasReport.engine === 'RULE_BASED_FALLBACK' ? 'RULE_BASED_COMPLIANCE' : 'AI_POWERED_COMPLIANCE'
    };
  }
}
