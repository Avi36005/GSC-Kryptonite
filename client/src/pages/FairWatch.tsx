import { TrendingUp, AlertTriangle, RefreshCw, Activity, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useDomain } from '../context/DomainContext';

const driftTimeline = [
  { day: 'Day 1', accuracy: 94.2, fairness: 0.92, drift: 0.01 },
  { day: 'Day 5', accuracy: 93.8, fairness: 0.91, drift: 0.02 },
  { day: 'Day 10', accuracy: 93.1, fairness: 0.89, drift: 0.03 },
  { day: 'Day 15', accuracy: 92.4, fairness: 0.88, drift: 0.04 },
  { day: 'Day 20', accuracy: 91.0, fairness: 0.85, drift: 0.06 },
  { day: 'Day 25', accuracy: 89.2, fairness: 0.82, drift: 0.09 },
  { day: 'Day 30', accuracy: 87.5, fairness: 0.79, drift: 0.12 },
  { day: 'Day 35', accuracy: 86.1, fairness: 0.76, drift: 0.15 },
  { day: 'Day 40', accuracy: 88.3, fairness: 0.83, drift: 0.08 },
];

const featureShifts = [
  { feature: 'Age Distribution', shift: '+14%', severity: 'Warning', detail: 'Mean shifted from 38.2 to 43.6' },
  { feature: 'Income Bracket', shift: '+6%', severity: 'Normal', detail: 'Minor drift within tolerance' },
  { feature: 'Geographic Region', shift: '+22%', severity: 'Critical', detail: 'New region codes not present in training data' },
  { feature: 'Education Level', shift: '+3%', severity: 'Normal', detail: 'Stable distribution' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function FairWatch() {
  const [driftScore, setDriftScore] = useState<number | null>(null);
  const { activeDomain, domainConfig } = useDomain();
  const [driftData, setDriftData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDrift = () => {
      // Only show full-page spinner on first load
      if (!driftData) setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(`http://localhost:5001/api/drift?domain=${encodeURIComponent(activeDomain)}`, { signal: controller.signal })
        .then(r => r.json())
        .then((data) => {
          clearTimeout(timeoutId);
          if (cancelled) return;
          setDriftData(data);
          if (data?.historicalDrift?.length) {
            setDriftScore(data.historicalDrift[data.historicalDrift.length - 1]?.score);
          }
          setError(null);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          if (cancelled) return;
          if (err.name !== 'AbortError') console.error('FairWatch fetch error:', err);
          setError('Backend unavailable — showing demo data. Start the server to see live metrics.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    };

    fetchDrift();
    const interval = setInterval(fetchDrift, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeDomain]);

  // Safely get the last historical drift entry
  const lastDrift = useMemo(() => {
    const arr = driftData?.historicalDrift;
    if (Array.isArray(arr) && arr.length > 0) return arr[arr.length - 1];
    return null;
  }, [driftData]);

  // Transform historical drift for the chart if available
  const chartData = useMemo(() => {
    const arr = driftData?.historicalDrift;
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.map((d: any) => ({
        day: d.date ?? 'N/A',
        drift: d.score ?? 0,
        accuracy: typeof d.accuracy === 'number' ? d.accuracy : 90,
        fairness: typeof d.fairness === 'number' ? d.fairness * 100 : 85,
      }));
    }
    return driftTimeline;
  }, [driftData]);

  // Use real feature shifts if available
  const displayShifts = useMemo(() => {
    if (driftData?.driftContributors?.length) {
      return driftData.driftContributors.map((c: any) => {
        const drift = typeof c.drift === 'number' ? c.drift : 0;
        return {
          feature: c.feature ?? 'Unknown',
          shift: `+${drift.toFixed(1)}%`,
          severity: drift > 15 ? 'Critical' : drift > 10 ? 'Warning' : 'Stable',
          detail: `Feature importance shifted by ${drift.toFixed(1)}%`
        };
      });
    }
    return featureShifts;
  }, [driftData]);

  const syncMetrics = () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    fetch(`http://localhost:5001/api/drift?domain=${encodeURIComponent(activeDomain)}`, { signal: controller.signal })
      .then(r => r.json())
      .then((data) => {
        setDriftData(data);
        if (data?.driftScore != null) setDriftScore(data.driftScore);
        else if (data?.historicalDrift?.length) setDriftScore(data.historicalDrift[data.historicalDrift.length - 1]?.score);
        alert('Metrics synchronized successfully');
      }).catch(() => alert('Failed to sync — backend may be offline.'));
  };

  const forceRetrain = () => {
    alert('Model retraining initiated. This process may take a while.');
  };

  if (fatalError) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-8">
        <AlertTriangle size={40} className="text-rose-400" />
        <p className="text-white font-bold text-lg">FairWatch encountered an error</p>
        <p className="text-neutral-400 text-sm max-w-md">{fatalError}</p>
        <button onClick={() => { setFatalError(null); setDriftData(null); setIsLoading(true); }} className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold">
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && !driftData) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-white font-medium animate-pulse">Analyzing Model Fairness & Drift...</p>
      </div>
    );
  }

  return (
    <motion.div className="space-y-8 pb-10 font-sans" variants={container} initial="hidden" animate="show">
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-400 text-sm">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
      
      <motion.header className="relative mb-10 overflow-hidden rounded-3xl bg-neutral-900/40 p-8 border border-neutral-800/50 backdrop-blur-xl" variants={item}>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                FairWatch Monitor {domainConfig ? <span className="text-white">/ {domainConfig.name}</span> : ''}
              </h1>
              <p className="text-neutral-400 text-lg font-medium max-w-2xl">
                Real-time performance surveillance and long-term fairness assurance for production models.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={syncMetrics} className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-all border border-neutral-700/50 flex items-center gap-2">
              <RefreshCw size={16} /> Sync Metrics
            </button>
            <button onClick={forceRetrain} className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2">
              <Zap size={16} /> Force Retrain
            </button>
          </div>
        </div>
      </motion.header>

      {/* Primary Metrics Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={item}>
        <MetricCard 
          label="Operational Drift" 
          value={driftScore != null ? `${driftScore.toFixed(1)}%` : '4.2%'} 
          sub={driftScore != null && driftScore > 15 ? "Action Required" : "Within safe limits"}
          color={driftScore != null && driftScore > 15 ? "rose" : "amber"}
          icon={<Activity size={20} />}
        />
        <MetricCard 
          label="Model Accuracy" 
          value={lastDrift && typeof lastDrift.accuracy === 'number' ? `${lastDrift.accuracy.toFixed(1)}%` : '88.3%'} 
          sub="+0.4% since last week"
          color="emerald"
          icon={<ShieldCheck size={20} />}
        />
        <MetricCard 
          label="Fairness Index" 
          value={lastDrift && typeof lastDrift.fairness === 'number' ? lastDrift.fairness.toFixed(2) : '0.83'} 
          sub="Target: > 0.80"
          color="neutral"
          icon={<TrendingUp size={20} />}
        />
        <MetricCard 
          label="Retrain Cycle" 
          value="14d" 
          sub="Next: 16 days"
          color="neutral"
          icon={<RefreshCw size={20} />}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Section */}
        <motion.div className="lg:col-span-2 space-y-8" variants={item}>
          <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-1">Performance Trajectory</h2>
                <p className="text-neutral-500 font-medium">Historical accuracy decay and drift monitoring</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">40 Days View</span>
              </div>
            </div>
            
            <div className="h-80 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFair" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="day" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tick={{dy: 10}} />
                  <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tick={{dx: -10}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: 12, color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)' }} 
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="6 6" label={{ value: 'Critical Accuracy', position: 'insideRight', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" name="Accuracy %" />
                  <Area type="monotone" dataKey="fairness" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFair)" name="Fairness Score %" />
                  <Area type="monotone" dataKey="drift" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDrift)" name="Operational Drift %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-8 pt-6 border-t border-neutral-800/50 flex flex-wrap gap-8">
              <LegendItem color="bg-white" label="Model Accuracy" sub="System-wide precision" />
              <LegendItem color="bg-emerald-500" label="Fairness Score" sub="Disparate impact ratio" />
              <LegendItem color="bg-amber-500" label="Alert Threshold" sub="Min acceptable perf" />
            </div>
          </div>

          {/* Feature Shifts Table */}
          <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-neutral-800/50">
              <h2 className="text-2xl font-black text-white mb-1">Feature Shifts</h2>
              <p className="text-neutral-500 font-medium">Distributional drift across input dimensions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950/30 text-[11px] uppercase tracking-[0.2em] text-neutral-500 border-b border-neutral-800/50">
                    <th className="px-8 py-5 font-black">Feature</th>
                    <th className="px-8 py-5 font-black text-center">Drift %</th>
                    <th className="px-8 py-5 font-black">Severity</th>
                    <th className="px-8 py-5 font-black">Analysis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/30">
                  {displayShifts.map((f: { feature: string; shift: string; severity: string; detail: string }) => (
                    <tr key={f.feature} className="hover:bg-neutral-800/30 transition-all duration-200 group">
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{f.feature}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="font-mono text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                          {f.shift}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                          f.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-rose-500/10' :
                          f.severity === 'Warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-amber-500/10' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                        }`}>{f.severity}</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs text-neutral-400 font-medium leading-relaxed max-w-xs">{f.detail}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Intelligence Sidebar */}
        <div className="space-y-8">
          <motion.div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden" variants={item}>
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/50"></div>
            <h3 className="text-xl font-black text-white flex items-center gap-3 mb-6">
              <AlertTriangle size={24} className="text-amber-500" /> Active Surveillance
            </h3>
            <div className="space-y-6">
              <AlertItem 
                type="Critical" 
                title="Demographic Drift" 
                desc="Model v2.4 error rate exceeds 8% on Asian demographic class. Immediate retraining recommended."
                time="2h ago"
              />
              <AlertItem 
                type="Warning" 
                title="Feature Shift" 
                desc="Geographic Region input data distribution shifted 22%. Model may produce unreliable predictions."
                time="5h ago"
              />
              <AlertItem 
                type="Info" 
                title="Auto-Retrain Scheduled" 
                desc="Scheduled retrain triggered for Day 38. Recovery observed in metrics."
                time="12h ago"
              />
            </div>
          </motion.div>

          <motion.div className="bg-gradient-to-br from-neutral-900/60 to-neutral-950 border border-neutral-800/50 rounded-3xl p-8 shadow-2xl" variants={item}>
            <h3 className="text-xl font-black text-white mb-6">Pipeline Health</h3>
            <div className="space-y-4 mb-8">
              <HealthMetric label="Data Ingestion" status="Optimal" color="emerald" />
              <HealthMetric label="Inference API" status="Optimal" color="emerald" />
              <HealthMetric label="Monitoring Sink" status="Warning" color="amber" />
              <HealthMetric label="Retraining Engine" status="Standby" color="blue" />
            </div>
            <button onClick={forceRetrain} className="w-full bg-white hover:bg-neutral-200 text-neutral-950 py-4 rounded-2xl text-sm font-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-[0.98]">
              Emergency Retrain
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, sub, color, icon }: any) {
  const colors: any = {
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5',
    neutral: 'text-white bg-neutral-500/10 border-neutral-500/20 shadow-neutral-500/5'
  };

  return (
    <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl p-6 shadow-xl hover:border-neutral-700/50 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
        <div className={`${colors[color]} p-2 rounded-xl border`}>{icon}</div>
      </div>
      <p className={`text-4xl font-black mb-1 group-hover:scale-105 transition-transform origin-left ${color === 'neutral' ? 'text-white' : colors[color].split(' ')[0]}`}>{value}</p>
      <p className="text-xs text-neutral-500 font-bold tracking-tight">{sub}</p>
    </div>
  );
}

function LegendItem({ color, label, sub }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${color} shadow-lg`}></div>
      <div>
        <p className="text-xs font-black text-white leading-none mb-0.5">{label}</p>
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{sub}</p>
      </div>
    </div>
  );
}

function AlertItem({ type, title, desc, time }: any) {
  const styles: any = {
    Critical: 'border-rose-500/50 bg-rose-500/5 text-rose-400',
    Warning: 'border-amber-500/50 bg-amber-500/5 text-amber-400',
    Info: 'border-blue-500/50 bg-blue-500/5 text-blue-400'
  };

  return (
    <div className={`border-l-4 ${styles[type].split(' ')[0]} ${styles[type].split(' ').slice(1).join(' ')} pl-5 py-3 rounded-r-2xl transition-all hover:bg-opacity-10 cursor-pointer group`}>
      <div className="flex justify-between items-start mb-1">
        <p className={`text-sm font-black ${styles[type].split(' ')[2]}`}>{type}: {title}</p>
        <span className="text-[10px] text-neutral-500 font-bold">{time}</span>
      </div>
      <p className="text-xs text-neutral-400 font-medium leading-relaxed group-hover:text-neutral-300 transition-colors">{desc}</p>
    </div>
  );
}

function HealthMetric({ label, status, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-500 shadow-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500 shadow-amber-500/20 text-amber-400',
    blue: 'bg-blue-500 shadow-blue-500/20 text-blue-400'
  };

  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm text-neutral-400 font-bold group-hover:text-neutral-200 transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${colors[color].split(' ')[2]}`}>{status}</span>
        <div className={`w-2 h-2 rounded-full ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]}`}></div>
      </div>
    </div>
  );
}
