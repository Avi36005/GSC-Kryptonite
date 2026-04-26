/**
 * AuditChatAgent.js
 * Uses Gemini 2.5 Flash (Vertex AI) — fast responses for the AI Auditor chatbot.
 * Auth: Application Default Credentials (ADC) — no API key required.
 */

import { geminiFlash, generateWithFallback } from '../services/geminiClient.js';

// ── Regulatory Knowledge Base (RAG source) ────────────────
const REGULATORY_KB = [
  {
    id: 'gdpr-art22',
    title: 'GDPR Article 22 - Automated Decision-Making',
    content:
      'GDPR Article 22 prohibits solely automated decisions that significantly affect individuals without human oversight. Key rights: Right to explanation, right to human review, right to contest. Applies to: profiling, credit scoring, hiring algorithms, insurance underwriting. Penalty: Up to 4% of global annual turnover or 20 million EUR. Exceptions: Explicit consent, contract necessity, or EU law authorization.',
    tags: ['gdpr', 'automated-decisions', 'human-oversight', 'right-to-explanation', 'profiling'],
  },
  {
    id: 'eu-ai-act',
    title: 'EU AI Act - High Risk AI Systems (Annex III)',
    content:
      'The EU AI Act classifies AI systems in hiring, credit scoring, law enforcement, education, and healthcare as High-Risk. Requirements: Conformity assessment, CE marking, technical documentation, human oversight. Prohibited: Social scoring by public authorities, real-time biometric surveillance. Article 10: Training data must be representative and free from bias. Article 14: Mandatory human oversight. Article 15: Accuracy and robustness requirements.',
    tags: ['eu-ai-act', 'high-risk', 'conformity', 'human-oversight', 'hiring', 'credit'],
  },
  {
    id: 'nist-rmf',
    title: 'NIST AI Risk Management Framework (AI RMF 1.0)',
    content:
      'NIST AI RMF provides four functions: GOVERN (policies, accountability), MAP (identify risks), MEASURE (analyze risks quantitatively), MANAGE (respond to risks). Key Trustworthy AI Properties: Accountable, Explainable, Interpretable, Privacy-Enhanced, Fair/Bias-Managed, Secure, Safe, Transparent. Bias metrics: Demographic parity, equalized odds, individual fairness, counterfactual fairness.',
    tags: ['nist', 'risk-management', 'bias', 'fairness', 'accountability', 'explainability'],
  },
  {
    id: 'disparate-impact',
    title: 'Disparate Impact Doctrine - Title VII and EEOC 4/5ths Rule',
    content:
      "Disparate Impact occurs when a facially neutral employment practice disproportionately affects a protected class. Legal threshold: The 4/5ths (80%) rule means selection rate for minority group should be at least 80% of majority group rate. Protected classes: Race, color, religion, sex, national origin, age (40+), disability. Proxy discrimination: zip codes, school districts, credit scores can be illegal proxies for race. Business necessity defense applies.",
    tags: ['disparate-impact', 'eeoc', 'hiring', 'protected-class', 'proxy', 'four-fifths-rule'],
  },
  {
    id: 'fair-lending',
    title: 'Fair Lending - ECOA and Fair Housing Act',
    content:
      'Equal Credit Opportunity Act (ECOA) prohibits discrimination in credit on basis of race, color, religion, national origin, sex, marital status, age. Fair Housing Act (FHA) prohibits discriminatory practices in residential real estate. Redlining is illegal. Algorithmic lending must comply with disparate impact standards. CFPB regulates algorithmic credit models and requires explainability.',
    tags: ['fair-lending', 'ecoa', 'fha', 'credit', 'redlining', 'cfpb'],
  },
  {
    id: 'hipaa-ai',
    title: 'HIPAA and AI in Healthcare',
    content:
      'HIPAA Privacy and Security Rules apply to AI systems processing Protected Health Information (PHI). AI in clinical settings must protect patient data, avoid discriminatory outcomes, ensure informed consent. FDA regulates AI/ML Software as a Medical Device (SaMD). Clinical Decision Support faces scrutiny for bias. Fairness requirements: Equal predictive accuracy across demographic groups.',
    tags: ['hipaa', 'healthcare', 'phi', 'fda', 'clinical-bias', 'medical-device'],
  },
  {
    id: 'bias-mitigation',
    title: 'Bias Mitigation Techniques',
    content:
      'Pre-processing: Reweighing, disparate impact remover, learning fair representations. In-processing: Adversarial debiasing, prejudice remover. Post-processing: Equalized odds, calibrated equalized odds, reject option classification. Fairness metrics: Demographic parity, equalized odds, equal opportunity, predictive parity, individual fairness. Tools: IBM AI Fairness 360, Google What-If Tool, Microsoft Fairlearn.',
    tags: ['bias-mitigation', 'fairness-metrics', 'pre-processing', 'post-processing', 'reweighing'],
  },
  {
    id: 'explainability',
    title: 'AI Explainability - SHAP, LIME, Counterfactuals',
    content:
      'LIME (Local Interpretable Model-agnostic Explanations) and SHAP (SHapley Additive exPlanations) are the leading explainability methods. Counterfactual explanations show what would need to change for a different outcome. GDPR Article 22 grants right to meaningful explanation of automated decisions. Feature importance identifies which inputs most influenced a prediction. Model cards document performance and limitations.',
    tags: ['explainability', 'shap', 'lime', 'interpretability', 'right-to-explanation', 'feature-importance'],
  },
];

// ── Simple keyword-based RAG retrieval ────────────────────
function retrieveRelevantDocs(query, topK = 3) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 3);
  const scored = REGULATORY_KB.map((doc) => {
    let score = 0;
    words.forEach((w) => {
      if (doc.title.toLowerCase().includes(w)) score += 3;
      if (doc.content.toLowerCase().includes(w)) score += 1;
      doc.tags.forEach((t) => {
        if (t.includes(w) || w.includes(t)) score += 2;
      });
    });
    return { ...doc, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((d) => d.score > 0);
}

// ── Agent ─────────────────────────────────────────────────
export class AuditChatAgent {
  async chat(userMessage, chatHistory = [], systemContext = null) {
    try {
      const relevantDocs = retrieveRelevantDocs(userMessage, 3);

      const ragContext =
        relevantDocs.length > 0
          ? relevantDocs.map((d) => `### ${d.title}\n${d.content}`).join('\n\n')
          : 'No specific regulatory context retrieved for this query.';

      const sourceCitations = relevantDocs.map((d) => d.title);

      const historyText = chatHistory
        .slice(-6)
        .map((h) => `${h.role === 'user' ? 'Human' : 'Assistant'}: ${h.content}`)
        .join('\n');

      // ── Build Live System Context ──────────────────────
      let liveSystemBlock = '';
      if (systemContext) {
        const {
          systemStatus,
          totalDecisions,
          interceptedCount,
          bypassedCount,
          recentDecisions,
          lastInterceptedDecision,
          currentDriftScore,
          driftData,
          recentAuditLogs
        } = systemContext;

        const haltStatus = systemStatus?.halt ? '🚨 EMERGENCY HALT IS ACTIVE — all decisions are bypassing guardrails.' : '✅ SYSTEM OPERATIONAL — guardrails are active.';
        const driftLevel = currentDriftScore != null
          ? `Current Drift Score: ${(currentDriftScore * 100).toFixed(1)}%`
          : 'Drift Score: Not available';

        // Format recent intercepted decisions
        const recentInterceptedSummary = (recentDecisions || [])
          .filter(d => d.finalOutcome === 'INTERCEPTED')
          .slice(-3)
          .map(d => `- Decision ${d.decisionId}: Flagged features: [${(d.biasReport?.flaggedFeatures || []).join(', ')}]. Bias score: ${(d.biasReport?.confidenceScore || 0).toFixed(2)}. Domain: ${d.domain || 'N/A'}.`)
          .join('\n') || 'No recent intercepted decisions.';

        // Format last intercepted decision detail
        const lastDecisionDetail = lastInterceptedDecision
          ? `Most Recent Intercept:\n  ID: ${lastInterceptedDecision.decisionId}\n  Outcome: ${lastInterceptedDecision.finalOutcome}\n  Bias Reasoning: ${lastInterceptedDecision.biasReport?.reasoning || 'N/A'}\n  Explanation: ${lastInterceptedDecision.explanation || 'N/A'}`
          : 'No intercepted decisions yet this session.';

        liveSystemBlock = `
== LIVE PLATFORM STATUS (Real-Time) ==
${haltStatus}
Total Decisions Processed: ${totalDecisions || 0}
Intercepted (Biased): ${interceptedCount || 0} | Passed: ${bypassedCount || 0}
${driftLevel}

Recent Intercepted Decisions:
${recentInterceptedSummary}

${lastDecisionDetail}

== END LIVE STATUS ==`;
      }

      // ── Build Specific Decision Context ───────────────
      const decisionCtx = systemContext?.decisionId
        ? `\n\nSPECIFIC DECISION UNDER AUDIT:\n${JSON.stringify(systemContext, null, 2)}`
        : '';

      const fullPrompt = `You are the FairAI Guardian AI Auditor — an expert AI governance assistant powered by Gemini 2.5 Flash on Google Cloud (Project: fairai-494213-f8).

Your expertise: AI bias detection, GDPR/EU AI Act/NIST AI RMF compliance, Fair lending (ECOA/FHA), HIPAA healthcare AI, disparate impact doctrine, model explainability (SHAP, LIME).

You have FULL ACCESS to the live state of the FairAI Guardian platform below. Use this to answer questions like:
- "Why was the last decision intercepted?"
- "Is the system in halt mode?"
- "What is the current bias drift score?"
- "How many decisions have been flagged today?"
- "What went wrong?"

STRICT RULES:
1. Use the LIVE PLATFORM STATUS to answer system state questions accurately.
2. Use the REGULATORY CONTEXT to answer compliance/legal questions.
3. Do NOT hallucinate. If data is unavailable, say so.
4. Be concise, professional, and actionable.
5. Cite specific regulations (e.g., "GDPR Article 22", "EU AI Act Article 14") when relevant.
6. Use bullet points for lists.
7. Always suggest actionable next steps.
${liveSystemBlock}

RETRIEVED REGULATORY CONTEXT:
${ragContext}
${decisionCtx}

CONVERSATION HISTORY:
${historyText}
Human: ${userMessage}
Assistant:`;

      const reply = await generateWithFallback(fullPrompt);

      return {
        reply: reply || 'I apologize, but I could not generate a response.',
        citations: sourceCitations,
      };
    } catch (err) {
      console.error('AuditChatAgent Error:', err);
      return {
        reply: 'System Error: The AI Auditor is currently offline. Please check Vertex AI configuration.',
        citations: [],
      };
    }
  }
}
