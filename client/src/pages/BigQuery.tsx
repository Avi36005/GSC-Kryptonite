import {
  Database, ChevronRight, ChevronDown, Table2, Loader2,
  CheckCircle2, AlertTriangle, X, Play, RefreshCw, Download,
  Shield, Scale, Brain, BarChart3, FileWarning, Search, Eye,
  ChevronUp, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

/* ────────── Types ────────── */
interface Dataset {
  id: string;
  location: string;
}

interface TableMeta {
  id: string;
  type: string;
  rowCount: string | number;
  sizeBytes: number;
}

interface FlaggedColumn {
  column: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  biasType: string;
  affectedProtectedClasses: string[];
  correlationStrength: number;
  reasoning: string;
  recommendation: string;
}

interface StatisticalDisparity {
  metric: string;
  value: number;
  threshold: number;
  status: 'violation' | 'warning' | 'pass';
  details: string;
}

interface ComplianceViolation {
  framework: string;
  violation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedColumns: string[];
}

interface DebiasingSuggestion {
  action: string;
  targetColumns: string[];
  description: string;
  priority: 'immediate' | 'recommended' | 'optional';
}

interface BiasReport {
  overallBiasScore: number;
  legalRiskScore: number;
  ethicalRiskScore: number;
  totalRowsScanned: number;
  summary: string;
  flaggedColumns: FlaggedColumn[];
  statisticalDisparities: StatisticalDisparity[];
  complianceViolations: ComplianceViolation[];
  debiasingSuggestions: DebiasingSuggestion[];
  cacheKey: string;
  metadata: {
    fileName: string;
    totalRows: number;
    totalColumns: number;
    headers: string[];
    domain: string;
    analyzedAt: string;
    source?: string;
  };
}

interface DebiasResult {
  csv: string;
  fileName: string;
  appliedChanges: string[];
  summary: string;
  removedColumns: string[];
  modifiedColumns: string[];
  originalColumnCount: number;
  newColumnCount: number;
  rowCount: number;
}

/* ────────── Helpers ────────── */
const severityColor: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500' },
  low: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500' },
};

const statusColor: Record<string, string> = {
  violation: 'text-red-400',
  warning: 'text-amber-400',
  pass: 'text-emerald-400',
};

function scoreColor(s: number) {
  if (s >= 70) return 'text-red-400';
  if (s >= 40) return 'text-amber-400';
  return 'text-emerald-400';
}
function scoreRingColor(s: number) {
  if (s >= 70) return '#ef4444';
  if (s >= 40) return '#f59e0b';
  return '#10b981';
}

/* ────────── Score Ring ────────── */
function ScoreRing({ score, label, icon: Icon }: { score: number; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreRingColor(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#262626" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Icon size={12} />
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ────────── Pipeline stages ────────── */
const pipelineStages = [
  { label: 'Fetching BigQuery Table', icon: Database },
  { label: 'Detecting Proxy Variables', icon: Eye },
  { label: 'Computing Fairness Metrics', icon: BarChart3 },
  { label: 'Compliance Validation', icon: Shield },
  { label: 'Generating Report', icon: Brain },
];

/* ────────── Main Component ────────── */
export default function BigQueryPage() {
  const { activeDomain, domainConfig } = useDomain();

  /* Connection */
  const [projectId, setProjectId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  /* Browser */
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [tables, setTables] = useState<TableMeta[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  /* Preview */
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [maxRows, setMaxRows] = useState(10000);

  /* Analysis */
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [biasReport, setBiasReport] = useState<BiasReport | null>(null);

  /* Debias */
  const [debiasing, setDebiasing] = useState(false);
  const [debiasResult, setDebiasResult] = useState<DebiasResult | null>(null);

  /* Expanded columns */
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());

  /* Error */
  const [error, setError] = useState<string | null>(null);

  /* ── Connect ── */
  const handleConnect = async () => {
    if (!projectId.trim()) return;
    setConnecting(true);
    setError(null);
    setConnected(false);
    setDatasets([]);
    setSelectedDataset(null);
    setTables([]);
    setSelectedTable(null);
    setPreview(null);
    setBiasReport(null);
    try {
      const res = await api.bigqueryTestConnection(projectId.trim());
      setConnected(true);
      setDatasets(res.datasets || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  /* ── Select dataset → load tables ── */
  const selectDataset = useCallback(async (dsId: string) => {
    if (selectedDataset === dsId) { setSelectedDataset(null); setTables([]); setSelectedTable(null); setPreview(null); return; }
    setSelectedDataset(dsId);
    setTables([]);
    setSelectedTable(null);
    setPreview(null);
    setLoadingTables(true);
    setError(null);
    try {
      const res = await api.bigqueryListTables(projectId.trim(), dsId);
      setTables(res.tables || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to list tables');
    } finally {
      setLoadingTables(false);
    }
  }, [selectedDataset, projectId]);

  /* ── Select table → preview ── */
  const selectTable = useCallback(async (tableId: string) => {
    setSelectedTable(tableId);
    setPreview(null);
    setLoadingPreview(true);
    setBiasReport(null);
    setDebiasResult(null);
    setError(null);
    try {
      const res = await api.bigqueryFetchTable(projectId.trim(), selectedDataset!, tableId, 100);
      setPreview({ headers: res.headers, rows: res.rows.slice(0, 5) });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to preview table');
    } finally {
      setLoadingPreview(false);
    }
  }, [projectId, selectedDataset]);

  /* ── Run bias analysis on BigQuery table ── */
  const runAnalysis = async () => {
    if (!selectedDataset || !selectedTable) return;
    setAnalyzing(true);
    setError(null);
    setCurrentStage(0);
    setBiasReport(null);
    setDebiasResult(null);

    const interval = setInterval(() => {
      setCurrentStage(prev => prev < pipelineStages.length - 1 ? prev + 1 : prev);
    }, 2000);

    try {
      // Fetch full table data then analyze
      const tableData = await api.bigqueryFetchTable(projectId.trim(), selectedDataset, selectedTable, maxRows);
      const report = await api.analyzeData(
        tableData.headers,
        tableData.rows,
        activeDomain,
        `${projectId}.${selectedDataset}.${selectedTable}`
      );
      clearInterval(interval);
      setCurrentStage(pipelineStages.length - 1);
      setBiasReport(report);
    } catch (e: unknown) {
      clearInterval(interval);
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Debias ── */
  const generateUnbiased = async () => {
    if (!biasReport?.cacheKey) return;
    setDebiasing(true);
    setError(null);
    try {
      const result = await api.generateUnbiasedCSV(biasReport.cacheKey);
      setDebiasResult(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Debiasing failed');
    } finally {
      setDebiasing(false);
    }
  };

  const downloadCSV = () => {
    if (!debiasResult) return;
    const blob = new Blob([debiasResult.csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = debiasResult.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (col: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };

  const resetAnalysis = () => {
    setBiasReport(null);
    setDebiasResult(null);
    setExpandedColumns(new Set());
    setError(null);
  };

  /* ── Render ── */
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-[#4285F4]/10 rounded-xl">
            <Database className="text-[#4285F4]" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Google BigQuery</h1>
            <p className="text-neutral-400 text-sm">
              Connect your GCP project, browse tables, and run AI bias analysis directly on your data warehouse.
            </p>
          </div>
        </div>
      </header>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Connection Panel ─── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
          GCP Connection
          {connected && <span className="text-xs text-emerald-400 font-normal ml-1">Connected to {projectId}</span>}
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              id="bq-project-id"
              type="text"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="Enter GCP Project ID (e.g. my-project-123)"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#4285F4] transition-colors text-sm"
            />
          </div>
          <button
            id="bq-connect-btn"
            onClick={handleConnect}
            disabled={connecting || !projectId.trim()}
            className="flex items-center gap-2 bg-[#4285F4] hover:bg-[#3b78e7] disabled:bg-neutral-700 disabled:text-neutral-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
          >
            {connecting ? <Loader2 size={16} className="animate-spin" /> : connected ? <RefreshCw size={16} /> : <Database size={16} />}
            {connecting ? 'Connecting...' : connected ? 'Reconnect' : 'Connect'}
          </button>
        </div>

        {/* Credentials hint */}
        {!connected && (
          <p className="text-neutral-600 text-xs mt-3">
            Requires <code className="text-neutral-500">FIREBASE_CLIENT_EMAIL</code> + <code className="text-neutral-500">FIREBASE_PRIVATE_KEY</code> in <code className="text-neutral-500">.env</code>, or Application Default Credentials via <code className="text-neutral-500">gcloud auth application-default login</code>.
          </p>
        )}
      </div>

      {/* ─── Browser + Preview (shown when connected) ─── */}
      {connected && !biasReport && !analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dataset / Table Tree */}
          <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Layers size={16} className="text-[#4285F4]" />
                Datasets ({datasets.length})
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[480px]">
              {datasets.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-8">No datasets found.</p>
              ) : (
                datasets.map(ds => (
                  <div key={ds.id}>
                    <button
                      id={`bq-dataset-${ds.id}`}
                      onClick={() => selectDataset(ds.id)}
                      className={`w-full flex items-center gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-neutral-800 ${selectedDataset === ds.id ? 'bg-[#4285F4]/10 text-[#4285F4]' : 'text-neutral-300'}`}
                    >
                      {selectedDataset === ds.id
                        ? <ChevronDown size={16} className="shrink-0" />
                        : <ChevronRight size={16} className="shrink-0 text-neutral-600" />}
                      <Database size={14} className="shrink-0" />
                      <span className="font-medium truncate">{ds.id}</span>
                      <span className="ml-auto text-[10px] text-neutral-600 shrink-0">{ds.location}</span>
                    </button>

                    {/* Tables nested under dataset */}
                    {selectedDataset === ds.id && (
                      <div className="ml-4 border-l border-neutral-800 pl-2">
                        {loadingTables ? (
                          <div className="flex items-center gap-2 py-3 px-3 text-neutral-500 text-xs">
                            <Loader2 size={12} className="animate-spin" /> Loading tables...
                          </div>
                        ) : tables.length === 0 ? (
                          <p className="text-neutral-600 text-xs py-3 px-3">No tables found.</p>
                        ) : (
                          tables.map(t => (
                            <button
                              key={t.id}
                              id={`bq-table-${t.id}`}
                              onClick={() => selectTable(t.id)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-neutral-800 rounded-lg mb-0.5 ${selectedTable === t.id ? 'bg-[#4285F4]/5 text-[#4285F4]' : 'text-neutral-400'}`}
                            >
                              <Table2 size={13} className="shrink-0" />
                              <span className="truncate">{t.id}</span>
                              {t.rowCount !== 'unknown' && (
                                <span className="ml-auto text-neutral-600 shrink-0">{Number(t.rowCount).toLocaleString()} rows</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Preview + Analysis Panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedTable ? (
              <div className="bg-neutral-900 border border-neutral-800 border-dashed rounded-xl h-full flex flex-col items-center justify-center py-20 text-center">
                <Table2 className="text-neutral-700 mb-3" size={40} />
                <p className="text-neutral-500 font-medium">Select a table to preview and analyze</p>
                <p className="text-neutral-700 text-sm mt-1">Pick a dataset on the left, then choose a table</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Table info bar */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#4285F4]/10 rounded-lg">
                      <Table2 className="text-[#4285F4]" size={18} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{selectedDataset}.{selectedTable}</p>
                      <p className="text-neutral-500 text-xs">{projectId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <label htmlFor="bq-max-rows">Max rows:</label>
                      <select
                        id="bq-max-rows"
                        value={maxRows}
                        onChange={e => setMaxRows(Number(e.target.value))}
                        className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
                      >
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                        <option value={25000}>25,000</option>
                        <option value={50000}>50,000</option>
                      </select>
                    </div>
                    <button
                      id="bq-analyze-btn"
                      onClick={runAnalysis}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Brain size={15} />
                      Analyze for Bias
                    </button>
                  </div>
                </div>

                {/* Preview table */}
                {loadingPreview ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 flex items-center justify-center gap-3 text-neutral-400">
                    <Loader2 className="animate-spin" size={20} /><span className="text-sm">Loading preview...</span>
                  </div>
                ) : preview ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-neutral-800 text-xs text-neutral-500 flex items-center gap-2">
                      <Eye size={13} /> Preview — first 5 rows · {preview.headers.length} columns
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-neutral-800/50">
                            {preview.headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 text-left text-neutral-400 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row, ri) => (
                            <tr key={ri} className="border-t border-neutral-800/50 hover:bg-neutral-800/30">
                              {preview.headers.map((h, ci) => (
                                <td key={ci} className="px-3 py-1.5 text-neutral-300 whitespace-nowrap max-w-[200px] truncate">
                                  {row[h] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ─── Analysis In Progress ─── */}
      {analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-10"
        >
          <div className="flex flex-col items-center mb-10">
            <Loader2 className="text-[#4285F4] w-12 h-12 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-1">
              Analyzing {projectId}.{selectedDataset}.{selectedTable}
            </h2>
            <p className="text-neutral-500 text-sm">Running multi-agent bias detection pipeline via Gemini AI...</p>
          </div>
          <div className="max-w-lg mx-auto space-y-3">
            {pipelineStages.map((stage, i) => {
              const StageIcon = stage.icon;
              const isActive = i === currentStage;
              const isDone = i < currentStage;
              return (
                <motion.div
                  key={i}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-500 ${
                    isActive ? 'bg-blue-500/10 border border-blue-500/20'
                    : isDone ? 'bg-emerald-500/5 border border-emerald-500/10'
                    : 'bg-neutral-800/30 border border-transparent'
                  }`}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-500/20' : isDone ? 'bg-emerald-500/20' : 'bg-neutral-700/50'}`}>
                    {isDone ? <CheckCircle2 size={16} className="text-emerald-400" />
                      : isActive ? <Loader2 size={16} className="text-blue-400 animate-spin" />
                      : <StageIcon size={16} className="text-neutral-600" />}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-blue-400' : isDone ? 'text-emerald-400' : 'text-neutral-600'}`}>
                    {stage.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-8 max-w-lg mx-auto">
            <div className="bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-[#4285F4] to-cyan-400 h-full rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStage + 1) / pipelineStages.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Bias Report ─── */}
      {biasReport && !analyzing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">Analysis Complete — {biasReport.metadata.fileName}</p>
                <p className="text-neutral-500 text-xs">
                  {biasReport.metadata.totalRows.toLocaleString()} rows · {biasReport.metadata.totalColumns} columns ·{' '}
                  {biasReport.metadata.domain} · {new Date(biasReport.metadata.analyzedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={resetAnalysis}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> New Analysis
            </button>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { score: biasReport.overallBiasScore, label: 'Bias Score', icon: AlertTriangle },
              { score: biasReport.legalRiskScore, label: 'Legal Risk', icon: Scale },
              { score: biasReport.ethicalRiskScore, label: 'Ethical Risk', icon: Shield },
            ].map(({ score, label, icon }) => (
              <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center">
                <ScoreRing score={score} label={label} icon={icon} />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-2">Executive Summary</h3>
            <p className="text-neutral-200 leading-relaxed">{biasReport.summary}</p>
          </div>

          {/* Flagged Columns + Right Side */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <h3 className="font-semibold text-white">Flagged Columns ({biasReport.flaggedColumns.length})</h3>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {biasReport.flaggedColumns.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No biased columns detected.</p>
                ) : (
                  biasReport.flaggedColumns.map((col, i) => {
                    const colors = severityColor[col.severity] || severityColor.low;
                    const isExpanded = expandedColumns.has(col.column);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden`}
                      >
                        <button onClick={() => toggleColumn(col.column)} className="w-full p-4 flex items-center justify-between text-left">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${colors.badge}`}>
                              {col.severity}
                            </span>
                            <span className={`font-semibold ${colors.text}`}>{col.column}</span>
                            <span className="text-neutral-500 text-xs">({col.biasType})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">r={col.correlationStrength?.toFixed(2)}</span>
                            {isExpanded ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-2 text-sm">
                                <p className="text-neutral-300">{col.reasoning}</p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {col.affectedProtectedClasses.map((cls, j) => (
                                    <span key={j} className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-400">{cls}</span>
                                  ))}
                                </div>
                                <div className="mt-2 p-2.5 bg-neutral-800/50 rounded-lg">
                                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1 font-semibold">Recommendation</p>
                                  <p className="text-neutral-300 text-xs">{col.recommendation}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-6">
              {/* Fairness Metrics */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
                <div className="p-4 border-b border-neutral-800">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <BarChart3 size={16} className="text-cyan-400" /> Fairness Metrics
                  </h3>
                </div>
                <div className="p-4 space-y-3 max-h-[220px] overflow-y-auto">
                  {(biasReport.statisticalDisparities || []).length === 0 ? (
                    <p className="text-neutral-500 text-center text-sm py-4">No metrics computed.</p>
                  ) : (
                    biasReport.statisticalDisparities.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-neutral-300 font-medium text-xs">{d.metric}</p>
                          <p className="text-neutral-600 text-[10px]">{d.details}</p>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-xs ${statusColor[d.status]}`}>
                            {typeof d.value === 'number' ? d.value.toFixed(2) : d.value}
                          </span>
                          <p className="text-neutral-600 text-[10px]">threshold: {d.threshold}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Compliance */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
                <div className="p-4 border-b border-neutral-800">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <Shield size={16} className="text-red-400" /> Compliance Violations
                  </h3>
                </div>
                <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto">
                  {(biasReport.complianceViolations || []).length === 0 ? (
                    <p className="text-neutral-500 text-center text-sm py-4">No violations found.</p>
                  ) : (
                    biasReport.complianceViolations.map((v, i) => {
                      const colors = severityColor[v.severity] || severityColor.low;
                      return (
                        <div key={i} className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-white ${colors.badge}`}>{v.severity}</span>
                            <span className={`text-xs font-semibold ${colors.text}`}>{v.framework}</span>
                          </div>
                          <p className="text-neutral-400 text-xs">{v.violation}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Debiasing Action */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
                  <Download size={18} className="text-emerald-400" />
                  Export Unbiased CSV
                </h3>
                <p className="text-neutral-500 text-sm">
                  Apply AI-recommended transformations to remove bias and download the corrected dataset as a CSV.
                </p>
              </div>
              {!debiasResult ? (
                <button
                  id="bq-debias-btn"
                  onClick={generateUnbiased}
                  disabled={debiasing}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-neutral-700 disabled:to-neutral-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  {debiasing
                    ? <><Loader2 size={16} className="animate-spin" /> Debiasing...</>
                    : <><Brain size={16} /> Generate & Download</>}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="text-sm text-neutral-400 space-y-0.5">
                    <p className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 size={14} /> Debiasing complete</p>
                    <p>{debiasResult.removedColumns.length} columns removed · {debiasResult.modifiedColumns.length} modified · {debiasResult.rowCount.toLocaleString()} rows</p>
                  </div>
                  <button
                    id="bq-download-csv-btn"
                    onClick={downloadCSV}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                  >
                    <Download size={16} /> Download CSV
                  </button>
                </div>
              )}
            </div>

            {debiasResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-2">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Applied Transformations</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {debiasResult.appliedChanges.map((change, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{change}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Debiasing Suggestions */}
          {(biasReport.debiasingSuggestions || []).length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="p-4 border-b border-neutral-800">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <FileWarning size={16} className="text-amber-500" /> AI Debiasing Recommendations
                </h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {biasReport.debiasingSuggestions.map((s, i) => {
                  const priorityColors: Record<string, string> = {
                    immediate: 'text-red-400 bg-red-500/10 border-red-500/20',
                    recommended: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                    optional: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                  };
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${priorityColors[s.priority] || priorityColors.optional}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase">{s.priority}</span>
                        <span className="text-xs font-semibold opacity-80">{s.action.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs opacity-70">{s.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {s.targetColumns.map((col, j) => (
                          <code key={j} className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">{col}</code>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
