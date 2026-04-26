import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { API_BASE } from '../../services/api';

interface SystemStats {
  totalProcessed: number;
  biasedDetected: number;
  interceptions: number;
  biasRate: number;
}

interface Summary {
  systemHalt: boolean;
  lastHaltAt: string | null;
  activeDomain: string;
  stats: SystemStats;
  recentAlerts: string[];
}

export default function SystemStatusPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/system/summary`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !summary) {
    return (
      <div className="h-full flex items-center justify-center p-8 border border-neutral-900 bg-black">
        <Activity className="animate-spin text-white" size={24} />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 bg-transparent">
      {/* System Status Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">System Pulse</h3>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${summary.systemHalt ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{summary.systemHalt ? 'System Halted' : 'Live Sync'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-neutral-900 border border-neutral-900">
          <div className="bg-black p-5">
            <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Total Audits</p>
            <p className="text-2xl font-black text-white tabular-nums">{summary.stats.totalProcessed.toLocaleString()}</p>
          </div>
          <div className="bg-black p-5">
            <p className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mb-1">Bias Flags</p>
            <p className="text-2xl font-black text-white tabular-nums">{summary.stats.biasedDetected.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Real-time Alerts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Recent Interventions</h3>
          <Shield size={12} className="text-neutral-600" />
        </div>
        
        <div className="space-y-2 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {summary.recentAlerts.length > 0 ? (
              summary.recentAlerts.slice(0, 3).map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="p-4 border border-neutral-900 bg-[#050505] group hover:border-white transition-colors cursor-default"
                >
                  <div className="flex gap-3">
                    <AlertTriangle size={12} className="text-white shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-neutral-400 leading-relaxed uppercase tracking-tighter line-clamp-2">
                      {alert}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-[120px] border border-dashed border-neutral-900 flex flex-col items-center justify-center space-y-3 grayscale opacity-30">
                <CheckCircle size={24} className="text-white" />
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase">No Bias Detected</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="p-6 border border-neutral-900 bg-black">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded">
            <Zap size={16} className="text-black" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-tighter">AI Auditor Core</h4>
            <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Gemini Flash v2.5</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Context Window</span>
            <span className="text-[10px] font-black text-white">1.04M TOKENS</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Latency</span>
            <span className="text-[10px] font-black text-white">12MS</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">Security</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase">ENCRYPTED</span>
          </div>
        </div>
      </section>
    </div>
  );
}
