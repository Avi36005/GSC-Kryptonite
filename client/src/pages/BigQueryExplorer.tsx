import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Search, 
  Table, 
  Activity, 
  ChevronRight, 
  Loader2, 
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  FileSearch
} from 'lucide-react';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';
import { useNavigate } from 'react-router-dom';

interface Dataset {
  id: string;
  location: string;
}

interface BQTable {
  id: string;
  type: string;
  rowCount: string;
  sizeBytes: string;
}

export default function BigQueryExplorer() {
  const { activeDomain } = useDomain();
  const navigate = useNavigate();
  
  const [projectId, setProjectId] = useState('bigquery-public-data');
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [tables, setTables] = useState<BQTable[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.bigqueryTestConnection(projectId);
      setDatasets(res.datasets || []);
      setTables([]);
      setSelectedDataset('');
      setSelectedTable('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to BigQuery');
    } finally {
      setLoading(false);
    }
  };

  const listTables = async (datasetId: string) => {
    setSelectedDataset(datasetId);
    setLoading(true);
    setError(null);
    try {
      const res = await api.bigqueryListTables(projectId, datasetId);
      setTables(res.tables || []);
    } catch (err: any) {
      setError(err.message || 'Failed to list tables');
    } finally {
      setLoading(false);
    }
  };

  const analyzeTable = async (tableId: string) => {
    setSelectedTable(tableId);
    setLoading(true);
    setError(null);
    try {
      const data = await api.bigqueryFetchTable(projectId, selectedDataset, tableId, 1000);
      
      // Store in session storage to pass to analyzer or just navigate with state
      // Actually, we can use the analyzeData API directly from here
      const result = await api.analyzeData(data.headers, data.rows, activeDomain, `bq://${projectId}/${selectedDataset}/${tableId}`);
      
      // Navigate to Analyzer with the report already loaded
      // This requires the Analyzer to handle state
      navigate('/analyzer', { state: { report: result } });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch and analyze table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Database className="text-blue-400" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white">BigQuery Data Explorer</h1>
        </div>
        <p className="text-neutral-400">Connect to Google BigQuery datasets to audit tables for bias and compliance.</p>
      </header>

      {/* Connection Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">GCP Project ID</label>
            <div className="relative">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input 
                type="text" 
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. bigquery-public-data"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <button 
            onClick={testConnection}
            disabled={loading || !projectId}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Connect
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm"
          >
            <AlertTriangle size={18} />
            {error}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Datasets List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-neutral-800 bg-neutral-800/30 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileSearch size={18} className="text-blue-400" />
              Available Datasets
            </h3>
            <span className="text-xs text-neutral-500">{datasets.length} found</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {datasets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                <Database size={40} className="opacity-20" />
                <p className="text-sm italic">Enter project ID to list datasets</p>
              </div>
            ) : (
              datasets.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => listTables(ds.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                    selectedDataset === ds.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${selectedDataset === ds.id ? 'bg-white/20' : 'bg-neutral-800 group-hover:bg-neutral-700'}`}>
                      <Database size={14} />
                    </div>
                    <span className="font-medium truncate">{ds.id}</span>
                  </div>
                  <ChevronRight size={14} className={selectedDataset === ds.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tables List */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-neutral-800 bg-neutral-800/30 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Table size={18} className="text-emerald-400" />
              Tables in {selectedDataset || '...'}
            </h3>
            <span className="text-xs text-neutral-500">{tables.length} found</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedDataset ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                <Table size={40} className="opacity-20" />
                <p className="text-sm italic">Select a dataset to view tables</p>
              </div>
            ) : tables.length === 0 && !loading ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                <AlertTriangle size={40} className="opacity-20" />
                <p className="text-sm italic">No tables found in this dataset</p>
              </div>
            ) : (
              tables.map((t) => (
                <div
                  key={t.id}
                  className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-4 flex items-center justify-between group hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400">
                      <Table size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{t.id}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">
                        {parseInt(t.rowCount).toLocaleString()} rows • {(parseInt(t.sizeBytes) / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => analyzeTable(t.id)}
                    disabled={loading}
                    className="p-2.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                    title="Audit for Bias"
                  >
                    {selectedTable === t.id && loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Activity size={18} />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions Footer */}
      <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400 shrink-0">
          <ExternalLink size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-white">How BigQuery Analysis Works</h4>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Selecting a table will fetch its schema and a representative sample of rows. Our multi-agent system then performs statistical parity tests, detects proxy variables, and evaluates compliance with {activeDomain.toUpperCase()} regulations.
          </p>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <CheckCircle2 size={14} /> Zero data movement (SSL encrypted)
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
              <CheckCircle2 size={14} /> HIPAA/GDPR Compliance Checks
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
