const API_BASE = 'http://localhost:5000/api';

export const api = {
  async analyzeDecision(id: string, features: Record<string, unknown>, prediction: string, domain: string) {
    const res = await fetch(`${API_BASE}/decisions/intercept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, features, prediction, domain }),
    });
    return res.json();
  },

  async getDecisions() {
    const res = await fetch(`${API_BASE}/decisions`);
    return res.json();
  },

  async getComplianceStatus(domain: string) {
    const res = await fetch(`${API_BASE}/compliance-status?domain=${encodeURIComponent(domain)}`);
    return res.json();
  },

  async getDriftData() {
    const res = await fetch(`${API_BASE}/drift-data`);
    return res.json();
  },

  async analyzeDataset(dataset: unknown[]) {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset }),
    });
    return res.json();
  },

  async getDomainConfig(domain: string) {
    const res = await fetch(`${API_BASE}/domain-config?domain=${encodeURIComponent(domain)}`);
    return res.json();
  }
};
