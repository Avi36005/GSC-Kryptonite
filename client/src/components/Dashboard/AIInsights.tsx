import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardInsights();
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError('Could not load AI insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 mb-8 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Gemini AI Insights
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full uppercase tracking-widest font-semibold border border-indigo-500/30">
                Flash 2.5
              </span>
            </h3>
            <p className="text-sm text-slate-400 font-medium">Real-time governance analysis and system intelligence</p>
          </div>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors group cursor-pointer"
          title="Refresh Insights"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-white transition-all ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence mode="wait">
          {loading ? (
            [0, 1, 2].map((i) => (
              <motion.div
                key={`skeleton-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-24 bg-slate-800/50 animate-pulse rounded-xl border border-slate-700/50"
              />
            ))
          ) : error ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-8 text-slate-500">
               <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
               <p>{error}</p>
            </div>
          ) : (
            insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group h-full"
              >
                <div className="h-full p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 group-hover:border-indigo-500/30 transition-all duration-300">
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {index === 0 && <Zap className="w-4 h-4 text-amber-400" />}
                      {index === 1 && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                      {index === 2 && <Sparkles className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed font-medium">
                      {insight}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIInsights;
