import {
  Database, CheckCircle2, AlertTriangle, Loader2, ArrowLeft,
  Table2, ChevronRight, Search, BarChart3, Brain, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

/* ────────── Types ────────── */
interface DatasetInfo {
  id: string;
  location: string;
}

interface TableInfo {
  id: string;
  type: string;
  rowCount: string;
  sizeBytes: string;
}

interface TableData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

type Step = 'connect' | 'datasets' | 'tables' | 'preview';

/* ────────── Main Component ────────── */
export default function BigQuery() {
  const navigate = useNavigate();
  const { activeDomain } = useDomain();

  // Connection
  const [projectId, setProjectId] = useState('fairai-494213-f8');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation
  const [step, setStep] = useState<Step>('connect');
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);

  // Loading states
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  /* ── Connect ── */
  const handleConnect = async () => {
    if (!projectId.trim()) {
      setError('Please enter a GCP Project ID.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const result = await api.bigqueryTestConnection(projectId.trim());
      setDatasets(result.datasets || []);
      setConnected(true);
      setStep('datasets');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  /* ── Select Dataset ── */
  const handleSelectDataset = async (datasetId: string) => {
    setSelectedDataset(datasetId);
    setLoadingTables(true);
    setError(null);
    try {
      const result = await api.bigqueryListTables(projectId, datasetId);
      setTables(result.tables || []);
      setStep('tables');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to list tables');
    } finally {
      setLoadingTables(false);
    }
  };

  /* ── Select Table ── */
  const handleSelectTable = async (tableId: string) => {
    setSelectedTable(tableId);
    setLoadingPreview(true);
    setError(null);
    try {
      const result = await api.bigqueryFetchTable(projectId, selectedDataset!, tableId);
      setTableData(result);
      setStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setLoadingPreview(false);
    }
  };

  /* ── Run Bias Analysis ── */
  const handleAnalyze = async () => {
    if (!tableData || !tableData.headers.length) return;
    setAnalyzing(true);
    setError(null);
    try {
      const sourceName = `${projectId}.${selectedDataset}.${selectedTable}`;
      await api.analyzeData(tableData.headers, tableData.rows, activeDomain, sourceName);
      // Navigate to analyzer which will show results
      navigate('/analyzer');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Navigation helpers ── */
  const goBack = () => {
    if (step === 'preview') { setStep('tables'); setTableData(null); setSelectedTable(null); }
    else if (step === 'tables') { setStep('datasets'); setTables([]); setSelectedDataset(null); }
    else if (step === 'datasets') { setStep('connect'); setConnected(false); setDatasets([]); }
    else navigate('/analyzer');
  };

  const formatBytes = (bytes: string) => {
    const b = parseInt(bytes, 10);
    if (isNaN(b) || b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const filteredDatasets = datasets.filter(d => d.id.toLowerCase().includes(searchFilter.toLowerCase()));
  const filteredTables = tables.filter(t => t.id.toLowerCase().includes(searchFilter.toLowerCase()));

  /* ── Breadcrumb ── */
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
      <button onClick={() => navigate('/analyzer')} className="hover:text-blue-400 transition-colors">Analyzer</button>
      <ChevronRight size={14} />
      <span className={step === 'connect' ? 'text-white' : 'hover:text-blue-400 cursor-pointer transition-colors'} onClick={() => step !== 'connect' && goBack()}>BigQuery</span>
      {step !== 'connect' && (
        <>
          <ChevronRight size={14} />
          <span className={step === 'datasets' ? 'text-white' : 'hover:text-blue-400 cursor-pointer transition-colors'}>{projectId}</span>
        </>
      )}
      {(step === 'tables' || step === 'preview') && selectedDataset && (
        <>
          <ChevronRight size={14} />
          <span className={step === 'tables' ? 'text-white' : 'hover:text-blue-400 cursor-pointer transition-colors'}>{selectedDataset}</span>
        </>
      )}
      {step === 'preview' && selectedTable && (
        <>
          <ChevronRight size={14} />
          <span className="text-white">{selectedTable}</span>
        </>
      )}
    </div>
  );

  /* ── Render ── */
  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={goBack}
              className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Database className="text-[#4285F4]" size={28} />
              BigQuery Explorer
            </h1>
          </div>
          <p className="text-neutral-400 ml-11">
            Connect to Google BigQuery, browse datasets, and run bias analysis on your tables.
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Connected</span>
          </div>
        )}
      </header>

      <Breadcrumb />

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertTriangle className="text-red-400 shrink-0" size={20} />
            <p className="text-red-400 text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-sm">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step: Connect ── */}
      {step === 'connect' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="p-4 bg-[#4285F4]/10 rounded-full mb-4">
                <Database className="text-[#4285F4] w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Connect to BigQuery</h2>
              <p className="text-neutral-400 text-sm text-center">
                Enter your GCP Project ID to browse datasets and tables for bias analysis.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-2">
                  GCP Project ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  placeholder="my-gcp-project-id"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 outline-none focus:border-[#4285F4] transition-colors"
                  id="bigquery-project-input"
                />
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting || !projectId.trim()}
                className="w-full bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:from-[#3b78de] hover:to-[#2d9648] disabled:from-neutral-700 disabled:to-neutral-700 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                id="bigquery-connect-btn"
              >
                {connecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    Connect to BigQuery
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-blue-300">
              <strong>Note:</strong> Requires <code className="bg-neutral-800 px-1.5 py-0.5 rounded">gcloud auth application-default login</code> to be configured on the server.
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Step: Datasets ── */}
      {step === 'datasets' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Layers size={18} className="text-[#4285F4]" />
                Datasets in {projectId}
                <span className="text-neutral-500 text-sm font-normal">({datasets.length})</span>
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input
                  type="text"
                  placeholder="Filter datasets..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#4285F4] transition-colors w-56"
                  id="bigquery-dataset-search"
                />
              </div>
            </div>

            {loadingTables ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 size={24} className="text-[#4285F4] animate-spin mb-2" />
                <p className="text-neutral-500 text-sm">Loading tables...</p>
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="p-12 text-center text-neutral-500">
                {datasets.length === 0 ? 'No datasets found in this project.' : 'No datasets match your filter.'}
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/50 max-h-[500px] overflow-y-auto">
                {filteredDatasets.map((ds, i) => (
                  <motion.button
                    key={ds.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setSearchFilter(''); handleSelectDataset(ds.id); }}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors group text-left"
                    id={`bigquery-dataset-${ds.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#4285F4]/10 rounded-lg group-hover:bg-[#4285F4]/20 transition-colors">
                        <Database size={16} className="text-[#4285F4]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{ds.id}</p>
                        <p className="text-neutral-500 text-xs">Location: {ds.location}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-neutral-600 group-hover:text-[#4285F4] transition-colors" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Step: Tables ── */}
      {step === 'tables' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Table2 size={18} className="text-[#FBBC04]" />
                Tables in {selectedDataset}
                <span className="text-neutral-500 text-sm font-normal">({tables.length})</span>
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
                <input
                  type="text"
                  placeholder="Filter tables..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#FBBC04] transition-colors w-56"
                  id="bigquery-table-search"
                />
              </div>
            </div>

            {loadingPreview ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 size={24} className="text-[#FBBC04] animate-spin mb-2" />
                <p className="text-neutral-500 text-sm">Fetching table data...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="p-12 text-center text-neutral-500">
                {tables.length === 0 ? 'No tables found in this dataset.' : 'No tables match your filter.'}
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/50 max-h-[500px] overflow-y-auto">
                {filteredTables.map((t, i) => (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => { setSearchFilter(''); handleSelectTable(t.id); }}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-800/50 transition-colors group text-left"
                    id={`bigquery-table-${t.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FBBC04]/10 rounded-lg group-hover:bg-[#FBBC04]/20 transition-colors">
                        <Table2 size={16} className="text-[#FBBC04]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{t.id}</p>
                        <p className="text-neutral-500 text-xs">
                          {parseInt(t.rowCount).toLocaleString()} rows • {formatBytes(t.sizeBytes)} • {t.type}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-neutral-600 group-hover:text-[#FBBC04] transition-colors" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Step: Preview & Analyze ── */}
      {step === 'preview' && tableData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Info bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {projectId}.{selectedDataset}.{selectedTable}
                </p>
                <p className="text-neutral-500 text-xs">
                  {tableData.totalRows.toLocaleString()} rows • {tableData.headers.length} columns
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectTable(selectedTable!)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || tableData.rows.length === 0}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-neutral-700 disabled:to-neutral-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                id="bigquery-analyze-btn"
              >
                {analyzing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain size={14} />
                    Run Bias Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-cyan-400" />
                Data Preview
              </h3>
              <span className="text-neutral-600 text-xs">
                Showing {Math.min(tableData.rows.length, 100)} of {tableData.totalRows.toLocaleString()} rows
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-neutral-800">
                    <th className="px-3 py-2.5 text-left text-neutral-500 font-medium w-12">#</th>
                    {tableData.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2.5 text-left text-neutral-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.slice(0, 100).map((row, ri) => (
                    <tr key={ri} className="border-t border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                      <td className="px-3 py-1.5 text-neutral-600">{ri + 1}</td>
                      {tableData.headers.map((h, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-neutral-300 whitespace-nowrap max-w-[200px] truncate">
                          {row[h] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-3 py-2 text-[10px] text-neutral-600 bg-neutral-800/30 text-center border-t border-neutral-800">
              {tableData.rows.length > 100
                ? `Showing first 100 rows of ${tableData.totalRows.toLocaleString()} (all rows will be used for analysis)`
                : `${tableData.totalRows.toLocaleString()} total rows`}
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading overlays for intermediate steps */}
      <AnimatePresence>
        {(loadingTables || loadingPreview) && step !== 'tables' && step !== 'datasets' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center">
              <Loader2 size={32} className="text-[#4285F4] animate-spin mb-3" />
              <p className="text-white font-medium">Loading...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
