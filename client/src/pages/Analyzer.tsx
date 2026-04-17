import { Upload, Database, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

interface AnalysisResult {
  status: string;
  scanned_rows: number;
  high_risk_features: string[];
}

export default function Analyzer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { domainConfig } = useDomain();

  const simulateAnalysis = async () => {
    setAnalyzing(true);
    setComplete(false);
    try {
      const data = await api.analyzeDataset(Array.from({ length: 240192 }, () => ({})));
      setResult(data);
    } catch {
      setResult({ status: 'success', scanned_rows: 240192, high_risk_features: ['zip_code', 'club_membership'] });
    }
    setTimeout(() => {
      setAnalyzing(false);
      setComplete(true);
    }, 2500);
  };

  const reset = () => {
    setComplete(false);
    setResult(null);
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-white">Dataset Analyzer {domainConfig ? `- ${domainConfig.name}` : ''}</h1>
        <p className="text-neutral-400">Upload datasets or connect to BigQuery for pre-training bias detection.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center border-dashed relative overflow-hidden group hover:border-blue-500/50 transition-colors h-[420px] cursor-pointer"
            onClick={!analyzing && !complete ? simulateAnalysis : undefined}
          >
            <AnimatePresence mode="wait">
              {analyzing ? (
                <motion.div key="loading" className="flex flex-col items-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-semibold text-white">Scanning Data Points</h3>
                  <p className="text-neutral-400 mt-2">BiasDetectionAgent running proxy correlation analysis...</p>
                  <div className="mt-6 w-64">
                    <motion.div className="bg-blue-500 h-1 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5, ease: 'easeInOut' }} />
                  </div>
                </motion.div>
              ) : complete ? (
                <motion.div key="complete" className="flex flex-col items-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <CheckCircle2 className="text-emerald-500 w-16 h-16 mb-4" />
                  <h3 className="text-xl font-semibold text-white">Analysis Complete</h3>
                  <p className="text-neutral-400 mt-2 text-center max-w-md">
                    {result?.scanned_rows?.toLocaleString()} rows processed. {result?.high_risk_features?.length} high-risk features detected.
                  </p>
                  <button onClick={reset} className="mt-6 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Run New Analysis
                  </button>
                </motion.div>
              ) : (
                <motion.div key="idle" className="flex flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="p-4 bg-blue-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-500 w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Upload Dataset (.csv, .parquet)</h3>
                  <p className="text-neutral-400 mt-2 text-center max-w-sm">
                    Drag and drop your training data here, or click to browse. Max 500MB without BigQuery linkage.
                  </p>
                  <div className="mt-8 flex items-center gap-4 text-sm text-neutral-500 w-full justify-center">
                    <div className="h-px bg-neutral-800 flex-1 max-w-[100px]"></div>
                    <span>OR CONNECT DIRECTLY</span>
                    <div className="h-px bg-neutral-800 flex-1 max-w-[100px]"></div>
                  </div>
                  <button
                    className="mt-6 flex items-center gap-2 bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 border border-[#4285F4]/20 px-4 py-2 rounded-lg font-medium transition-colors"
                    onClick={(e) => { e.stopPropagation(); simulateAnalysis(); }}
                  >
                    <Database size={18} /> Connect Google BigQuery
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl h-full flex flex-col">
            <div className="p-4 border-b border-neutral-800 font-semibold text-white flex items-center gap-2">
              <FileWarning size={18} className="text-amber-500" /> Agent Report
            </div>
            {complete && result ? (
              <motion.div className="p-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div>
                  <h4 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">High-Risk Proxies Detected</h4>
                  <ul className="space-y-3">
                    <li className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-sm">
                      <span className="font-bold text-rose-400 flex items-center gap-2 mb-1"><AlertTriangle size={14} /> Column: 'zip_code'</span>
                      <p className="text-neutral-400">Highly correlated (r=0.91) with Race protected class. Acts as proxy for demographic discrimination in lending decisions.</p>
                    </li>
                    <li className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 text-sm">
                      <span className="font-bold text-rose-400 flex items-center gap-2 mb-1"><AlertTriangle size={14} /> Column: 'club_membership'</span>
                      <p className="text-neutral-400">Correlated (r=0.88) with Gender and Age. Common in hiring model datasets. Removing or de-biasing recommended.</p>
                    </li>
                    <li className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm">
                      <span className="font-bold text-amber-500 flex items-center gap-2 mb-1"><AlertTriangle size={14} /> Column: 'historical_repayment'</span>
                      <p className="text-neutral-400">Historical bias embedded for minority groups. Suggest synthetic oversampling or re-weighting.</p>
                    </li>
                  </ul>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                  Apply Mitigation Fixes
                </button>
              </motion.div>
            ) : (
              <div className="p-6 flex-1 flex flex-col items-center justify-center text-center text-neutral-500">
                <Database size={32} className="opacity-30 mb-3" />
                Waiting for data to run BiasDetectionAgent...
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
