export const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://fairai-guardian-server-842068417000.us-central1.run.app/api';

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

  async getDriftAnalysis(domain: string) {
    const res = await fetch(`${API_BASE}/drift?domain=${encodeURIComponent(domain)}`);
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
  },

  /* ── CSV Analysis ── */

  async analyzeCSV(file: File, domain: string) {
    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('domain', domain);

    const res = await fetch(`${API_BASE}/analyze-csv`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }

    return res.json();
  },

  async generateUnbiasedCSV(cacheKey: string) {
    const res = await fetch(`${API_BASE}/generate-unbiased-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cacheKey }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }

    return res.json();
  },

  /**
   * Analyze raw data (e.g. from BigQuery) without file upload
   */
  async analyzeData(headers: string[], rows: Record<string, string>[], domain: string, sourceName: string) {
    const res = await fetch(`${API_BASE}/analyze-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, rows, domain, sourceName }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }

    return res.json();
  },

  /* ── BigQuery ── */

  async bigqueryTestConnection(projectId: string) {
    const res = await fetch(`${API_BASE}/bigquery/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Connection failed' }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }

    return res.json();
  },

  async bigqueryListTables(projectId: string, datasetId: string) {
    const res = await fetch(`${API_BASE}/bigquery/list-tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, datasetId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to list tables' }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }

    return res.json();
  },

  async bigqueryFetchTable(projectId: string, datasetId: string, tableId: string, maxRows = 10000) {
    const res = await fetch(`${API_BASE}/bigquery/fetch-table`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, datasetId, tableId, maxRows }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to fetch table' }));
      throw new Error(errorData.error || `Server error: ${res.status}`);
    }

    return res.json();
  },

  async getDashboardInsights() {
    const res = await fetch(`${API_BASE}/dashboard-insights`);
    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard insights: ${res.status}`);
    }
    return res.json();
  },

  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/system/status`);
    return res.json();
  },

  async toggleHalt(halt: boolean) {
    const res = await fetch(`${API_BASE}/system/halt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ halt }),
    });
    return res.json();
  },

  /* ── Voice ── */
  async voiceTTS(text: string) {
    const res = await fetch(`${API_BASE}/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async voiceSTT(audioBase64: string) {
    const res = await fetch(`${API_BASE}/voice/stt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64 }),
    });
    return res.json();
  },
};
