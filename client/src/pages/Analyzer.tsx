import {
  Upload, Database, CheckCircle2, AlertTriangle, FileWarning,
  Download, X, FileSpreadsheet, Shield, Scale, Brain,
  ChevronDown, ChevronUp, Loader2, BarChart3, Trash2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

/* ────────── Types ────────── */
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
    fileSize: number;
    totalRows: number;
    totalColumns: number;
    headers: string[];
    domain: string;
    analyzedAt: string;
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

function scoreColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-emerald-400';
}

function scoreRingColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  return '#10b981';
}

function parseCSVPreview(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const rows = lines.slice(1, 6).map(line => {
          // Handle quoted CSV values
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (const char of line) {
            if (char === '"') { inQuotes = !inQuotes; continue; }
            if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
            current += char;
          }
          values.push(current.trim());
          return values;
        });
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/* ────────── Score Ring Component ────────── */
function ScoreRing({ score, label, icon: Icon }: { score: number; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#262626" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
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

/* ────────── Pipeline Stage ────────── */
const pipelineStages = [
  { label: 'Parsing CSV', icon: FileSpreadsheet },
  { label: 'Detecting Proxy Variables', icon: Eye },
  { label: 'Computing Fairness Metrics', icon: BarChart3 },
  { label: 'Compliance Validation', icon: Shield },
  { label: 'Generating Report', icon: Brain },
];

/* ────────── Main Component ────────── */
export default function Analyzer() {
  const { activeDomain, domainConfig } = useDomain();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // State
  const [file, setFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [biasReport, setBiasReport] = useState<BiasReport | null>(null);
  const [debiasing, setDebiasing] = useState(false);
  const [debiasResult, setDebiasResult] = useState<DebiasResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  /* ── File handling ── */
  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit.');
      return;
    }
    setError(null);
    setFile(f);
    setBiasReport(null);
    setDebiasResult(null);
    try {
      const preview = await parseCSVPreview(f);
      setCsvPreview(preview);
    } catch {
      setCsvPreview(null);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  }, [handleFile]);

  /* ── Analysis ── */
  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setCurrentStage(0);
    setBiasReport(null);
    setDebiasResult(null);

    // Animate through pipeline stages
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < pipelineStages.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    try {
      const report = await api.analyzeCSV(file, activeDomain);
      clearInterval(stageInterval);
      setCurrentStage(pipelineStages.length - 1);
      setBiasReport(report);
    } catch (err: unknown) {
      clearInterval(stageInterval);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Debiasing ── */
  const generateUnbiased = async () => {
    if (!biasReport?.cacheKey) return;
    setDebiasing(true);
    setError(null);
    try {
      const result = await api.generateUnbiasedCSV(biasReport.cacheKey);
      setDebiasResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Debiasing failed. Please try again.');
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

  /* ── Reset ── */
  const reset = () => {
    setFile(null);
    setCsvPreview(null);
    setAnalyzing(false);
    setCurrentStage(0);
    setBiasReport(null);
    setDebiasResult(null);
    setError(null);
    setExpandedColumns(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleColumn = (col: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  /* ── Render ── */
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-white">
          Dataset Analyzer {domainConfig ? `— ${domainConfig.name}` : ''}
        </h1>
        <p className="text-neutral-400">
          Upload CSV datasets for real-time bias detection, compliance validation, and automated debiasing.
        </p>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onFileInputChange}
        id="csv-file-input"
      />

      {/* ─── Upload Zone + Preview ─── */}
      {!biasReport && !analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="col-span-2">
            <div
              className={`bg-neutral-900 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300 cursor-pointer ${
                dragOver
                  ? 'border-blue-400 bg-blue-500/5 scale-[1.01]'
                  : file
                  ? 'border-emerald-500/40 hover:border-emerald-400/60'
                  : 'border-neutral-700 hover:border-blue-500/50'
              } ${file ? 'h-auto min-h-[200px]' : 'h-[420px]'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file-loaded"
                    className="w-full"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                          <FileSpreadsheet className="text-emerald-400" size={22} />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{file.name}</p>
                          <p className="text-neutral-500 text-sm">
                            {(file.size / 1024).toFixed(1)} KB
                            {csvPreview && ` • ${csvPreview.headers.length} columns`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); reset(); }}
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* CSV Preview Table */}
                    {csvPreview && (
                      <div className="overflow-x-auto rounded-lg border border-neutral-800 mb-4">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-neutral-800/50">
                              {csvPreview.headers.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-left text-neutral-400 font-medium whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.rows.map((row, ri) => (
                              <tr key={ri} className="border-t border-neutral-800/50 hover:bg-neutral-800/30">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="px-3 py-1.5 text-neutral-300 whitespace-nowrap max-w-[200px] truncate">
                                    {cell || '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-3 py-1.5 text-[10px] text-neutral-600 bg-neutral-800/30 text-center">
                          Showing first {csvPreview.rows.length} rows (preview)
                        </div>
                      </div>
                    )}

                    {/* Run Analysis Button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                    >
                      <Brain size={18} />
                      Run Bias Analysis
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    className="flex flex-col items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className={`p-5 rounded-full mb-5 transition-all duration-300 ${
                      dragOver ? 'bg-blue-500/20 scale-110' : 'bg-blue-500/10 group-hover:scale-110'
                    }`}>
                      <Upload className="text-blue-400 w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Upload CSV Dataset
                    </h3>
                    <p className="text-neutral-400 text-center max-w-sm mb-1">
                      Drag and drop your CSV file here, or click to browse.
                    </p>
                    <p className="text-neutral-600 text-sm">Max 50MB • CSV format only</p>
                    <div className="mt-8 flex items-center gap-4 text-sm text-neutral-500 w-full justify-center">
                      <div className="h-px bg-neutral-800 flex-1 max-w-[100px]"></div>
                      <span className="text-xs">OR CONNECT DIRECTLY</span>
                      <div className="h-px bg-neutral-800 flex-1 max-w-[100px]"></div>
                    </div>
                    <button
                      className="mt-5 flex items-center gap-2 bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 border border-[#4285F4]/20 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      onClick={(e) => { e.stopPropagation(); navigate('/bigquery'); }}
                    >
                      <Database size={16} /> Connect Google BigQuery
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Side Panel — Instructions */}
          <div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl h-full flex flex-col">
              <div className="p-4 border-b border-neutral-800 font-semibold text-white flex items-center gap-2">
                <FileWarning size={18} className="text-amber-500" /> How It Works
              </div>
              <div className="p-5 space-y-4 text-sm text-neutral-400">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div><p className="text-white font-medium mb-0.5">Upload CSV</p><p>Upload your dataset file containing the data you want to audit for bias.</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div><p className="text-white font-medium mb-0.5">AI Analysis</p><p>Gemini AI scans every column for proxy variables, statistical disparities, and compliance violations.</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div><p className="text-white font-medium mb-0.5">Bias Report</p><p>View detailed findings with severity scores, affected groups, and specific recommendations.</p></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div><p className="text-white font-medium mb-0.5">Download Unbiased CSV</p><p>Generate and download a corrected CSV with biased columns removed or anonymized.</p></div>
                </div>
                <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-blue-300">
                  <strong>Domain:</strong> {domainConfig?.name || activeDomain} — Analysis is tailored to domain-specific bias rules and compliance frameworks.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Analysis In Progress ─── */}
      {analyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-xl p-10"
        >
          <div className="flex flex-col items-center mb-10">
            <Loader2 className="text-blue-400 w-12 h-12 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white mb-1">Analyzing {file?.name}</h2>
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
                    isActive
                      ? 'bg-blue-500/10 border border-blue-500/20'
                      : isDone
                      ? 'bg-emerald-500/5 border border-emerald-500/10'
                      : 'bg-neutral-800/30 border border-transparent'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-blue-500/20' : isDone ? 'bg-emerald-500/20' : 'bg-neutral-700/50'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 size={16} className="text-blue-400 animate-spin" />
                    ) : (
                      <StageIcon size={16} className="text-neutral-600" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-blue-400' : isDone ? 'text-emerald-400' : 'text-neutral-600'
                  }`}>
                    {stage.label}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-lg mx-auto">
            <div className="bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top bar with file info + actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">Analysis Complete — {biasReport.metadata.fileName}</p>
                <p className="text-neutral-500 text-xs">
                  {biasReport.metadata.totalRows.toLocaleString()} rows • {biasReport.metadata.totalColumns} columns • {biasReport.metadata.domain}
                  {' • '}Analyzed at {new Date(biasReport.metadata.analyzedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Upload size={14} /> New Analysis
              </button>
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center">
              <ScoreRing score={biasReport.overallBiasScore} label="Bias Score" icon={AlertTriangle} />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center">
              <ScoreRing score={biasReport.legalRiskScore} label="Legal Risk" icon={Scale} />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center">
              <ScoreRing score={biasReport.ethicalRiskScore} label="Ethical Risk" icon={Shield} />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-2">Executive Summary</h3>
            <p className="text-neutral-200 leading-relaxed">{biasReport.summary}</p>
          </div>

          {/* Two-column layout: Flagged Columns + Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Flagged Columns */}
            <div className="xl:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Flagged Columns ({biasReport.flaggedColumns.length})
                </h3>
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden`}
                      >
                        <button
                          onClick={() => toggleColumn(col.column)}
                          className="w-full p-4 flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${colors.badge}`}>
                              {col.severity}
                            </span>
                            <span className={`font-semibold ${colors.text}`}>
                              {col.column}
                            </span>
                            <span className="text-neutral-500 text-xs">
                              ({col.biasType})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              r={col.correlationStrength?.toFixed(2)}
                            </span>
                            {isExpanded ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-2 text-sm">
                                <p className="text-neutral-300">{col.reasoning}</p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {col.affectedProtectedClasses.map((cls, j) => (
                                    <span key={j} className="px-2 py-0.5 bg-neutral-800 rounded text-xs text-neutral-400">
                                      {cls}
                                    </span>
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

            {/* Right side: Statistical Disparities + Compliance Violations */}
            <div className="space-y-6">
              {/* Statistical Disparities */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
                <div className="p-4 border-b border-neutral-800">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <BarChart3 size={16} className="text-cyan-400" />
                    Fairness Metrics
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

              {/* Compliance Violations */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
                <div className="p-4 border-b border-neutral-800">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <Shield size={16} className="text-red-400" />
                    Compliance Violations
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
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-white ${colors.badge}`}>
                              {v.severity}
                            </span>
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
                  Generate Unbiased CSV
                </h3>
                <p className="text-neutral-500 text-sm">
                  Apply AI-recommended transformations to remove bias and download the corrected dataset.
                </p>
              </div>
              {!debiasResult ? (
                <button
                  onClick={generateUnbiased}
                  disabled={debiasing}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-neutral-700 disabled:to-neutral-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                >
                  {debiasing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Debiasing...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      Generate & Download
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={downloadCSV}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
                >
                  <Download size={16} />
                  Download CSV
                </button>
              )}
            </div>

            {/* Debias Result Details */}
            <AnimatePresence>
              {debiasResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 space-y-4"
                >
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-lg">
                    <p className="text-emerald-300 text-sm font-medium mb-2">✓ Debiasing Complete</p>
                    <p className="text-neutral-400 text-sm">{debiasResult.summary}</p>
                    <div className="flex gap-6 mt-3 text-xs text-neutral-500">
                      <span>Rows: {debiasResult.rowCount.toLocaleString()}</span>
                      <span>Columns: {debiasResult.originalColumnCount} → {debiasResult.newColumnCount}</span>
                      {debiasResult.removedColumns.length > 0 && (
                        <span className="text-red-400">Removed: {debiasResult.removedColumns.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  {debiasResult.appliedChanges.length > 0 && (
                    <div>
                      <h4 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-2">Applied Changes</h4>
                      <ul className="space-y-1.5">
                        {debiasResult.appliedChanges.map((change, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
