import { 
  Activity, ShieldCheck, AlertTriangle, Users, BrainCircuit, Zap, 
  TrendingUp, LayoutDashboard, ShieldAlert, ActivitySquare, RefreshCw,
  TrendingDown, Bot
} from 'lucide-react';
import { motion } from 'framer-motion';
import KPI from '../components/Dashboard/KPI';
import AIInsights from '../components/Dashboard/AIInsights';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, 
  ReferenceLine 
} from 'recharts';
import { useEffect, useState, useMemo } from 'react';
import { socket } from '../services/socket';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

const driftTimeline = [
  { day: 'Day 1', accuracy: 94.2, fairness: 92, drift: 1 },
  { day: 'Day 5', accuracy: 93.8, fairness: 91, drift: 2 },
  { day: 'Day 10', accuracy: 93.1, fairness: 89, drift: 3 },
  { day: 'Day 15', accuracy: 92.4, fairness: 88, drift: 4 },
  { day: 'Day 20', accuracy: 91.0, fairness: 85, drift: 6 },
  { day: 'Day 25', accuracy: 89.2, fairness: 82, drift: 9 },
  { day: 'Day 30', accuracy: 87.5, fairness: 79, drift: 12 },
  { day: 'Day 35', accuracy: 86.1, fairness: 76, drift: 15 },
  { day: 'Day 40', accuracy: 88.3, fairness: 83, drift: 8 },
];

const featureShifts = [
  { feature: 'Age Distribution', shift: '+14%', severity: 'Warning', detail: 'Mean shifted from 38.2 to 43.6' },
  { feature: 'Income Bracket', shift: '+6%', severity: 'Normal', detail: 'Minor drift within tolerance' },
  { feature: 'Geographic Region', shift: '+22%', severity: 'Critical', detail: 'New region codes not present in training data' },
  { feature: 'Education Level', shift: '+3%', severity: 'Normal', detail: 'Stable distribution' },
];

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const [interceptCount, setInterceptCount] = useState(1284);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [engineStats, setEngineStats] = useState([
    { name: 'Gen-AI Pipeline', value: 85 },
    { name: 'Rule-Based/Fallback', value: 15 }
  ]);
  const [stats, setStats] = useState({ compliance: 97.4, policies: 12, alerts: 3 });
  const [driftData, setDriftData] = useState<any>(null);
  const [driftScore, setDriftScore] = useState<number | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { domainConfig, activeDomain } = useDomain();

  useEffect(() => {
    // WebSocket listeners
    socket.on('new_decision_intercepted', (data) => {
      setInterceptCount((prev) => prev + 1);
      setRecentEvents((prev) => [data, ...prev].slice(0, 5));
      
      if (data.engine) {
        setEngineStats(prev => {
          const newStats = [...prev];
          const idx = data.engine === 'GEN_AI_PIPELINE' ? 0 : 1;
          newStats[idx] = { ...newStats[idx], value: Number(newStats[idx].value) + 1 };
          return newStats;
        });
      }
    });

    // Fetch initial data
    api.getDecisions().then((data) => {
      if (Array.isArray(data)) {
        setRecentEvents(data.slice(-5).reverse());
        setInterceptCount(prev => Math.max(prev, data.length));
        const aiCount = data.filter((d: any) => d.engine === 'GEN_AI_PIPELINE').length;
        const ruleCount = data.filter((d: any) => d.engine !== 'GEN_AI_PIPELINE').length;
        if (aiCount > 0 || ruleCount > 0) {
          setEngineStats([
            { name: 'Gen-AI Pipeline', value: aiCount || 85 },
            { name: 'Rule-Based/Fallback', value: ruleCount || 15 }
          ]);
        }
      }
    }).catch(() => {});

    api.getSystemStatus().then((status) => {
      if (status) {
        setStats({
          compliance: status.complianceRate ?? 97.4,
          policies: status.activePolicies ?? 12,
          alerts: status.alertCount ?? 3,
        });
      }
    });

    // Fetch initial data
    api.getDecisions().then(data => {
      if (Array.isArray(data)) {
        setRecentEvents(data.slice(-5).reverse());
        setInterceptCount(data.length);
        
        // Calculate engine stats from history
        const genAiCount = data.filter(d => d.engine === 'GEN_AI_PIPELINE').length;
        const ruleCount = data.length - genAiCount;
        setEngineStats([
          { name: 'Gen-AI Pipeline', value: genAiCount || 85 },
          { name: 'Rule-Based/Fallback', value: ruleCount || 15 }
        ]);
      }
    }).catch(err => console.error("Failed to fetch initial decisions:", err));

    // Drift fetching logic
    const fetchDrift = () => {
      api.getDriftAnalysis(activeDomain)
        .then((data) => {
          setDriftData(data);
          if (data?.historicalDrift?.length) {
            setDriftScore(data.historicalDrift[data.historicalDrift.length - 1]?.score);
          }
          setError(null);
        })
        .catch(err => {
          console.error('Drift fetch error:', err);
          setError('Backend unavailable — showing demo data.');
        });
    };

    fetchDrift();
    const driftInterval = setInterval(fetchDrift, 30000);

    return () => { 
      socket.off('new_decision_intercepted'); 
      clearInterval(driftInterval);
    };
  }, [activeDomain]);

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

  const displayShifts = useMemo(() => {
    if (driftData?.driftContributors?.length) {
      return driftData.driftContributors.map((c: any) => {
        const drift = typeof c.drift === 'number' ? c.drift : 0;
        return {
          feature: c.feature ?? 'Unknown',
          shift: `+${drift.toFixed(1)}%`,
          severity: drift > 15 ? 'Critical' : drift > 10 ? 'Warning' : 'Normal',
          detail: `Feature importance shifted by ${drift.toFixed(1)}%`
        };
      });
    }
    return featureShifts;
  }, [driftData]);

  const lastDrift = useMemo(() => {
    const arr = driftData?.historicalDrift;
    if (Array.isArray(arr) && arr.length > 0) return arr[arr.length - 1];
    return null;
  }, [driftData]);

  return (
    <motion.div className="space-y-8 pb-10" variants={container} initial="hidden" animate="show">
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-400 text-sm mb-4">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10 border border-white/20">
            <LayoutDashboard size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Dashboard
              <span className="text-neutral-500 font-medium">/</span>
              <span className="text-neutral-300">{domainConfig?.name || 'Domain'}</span>
            </h1>
            <p className="text-neutral-500 font-medium tracking-tight">Real-time surveillance & long-term drift monitoring</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button
             onClick={() => { setSyncing(true); setTimeout(() => setSyncing(false), 1500); }}
             className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-bold transition-all border border-neutral-700/50 flex items-center gap-2"
           >
             <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync'}
           </button>
           <button
             onClick={() => { setRetraining(true); setTimeout(() => setRetraining(false), 3000); }}
             className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black rounded-xl text-sm font-bold transition-all flex items-center gap-2"
           >
             <Zap size={16} /> {retraining ? 'Scheduling...' : 'Force Retrain'}
           </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPI 
          title="Security Compliance" 
          value={`${stats?.compliance || 0}%`} 
          trend="+2.4%" 
          trendUp={true} 
          icon={<ShieldCheck size={20} />} 
          subtitle="All checks passed"
        />
        <KPI 
          title="Model Drift" 
          value={driftScore != null ? `${driftScore.toFixed(1)}%` : '4.2%'} 
          trend={driftScore != null && driftScore > 10 ? "+1.2%" : "-0.3%"} 
          trendUp={driftScore != null && driftScore > 10} 
          icon={<Activity size={20} />} 
          subtitle={driftScore != null && driftScore > 15 ? "Action Required" : "Within safe limits"}
        />
        <KPI 
          title="Fairness Index" 
          value={lastDrift && typeof lastDrift.fairness === 'number' ? lastDrift.fairness.toFixed(2) : '0.83'} 
          trend="+0.02" 
          trendUp={true} 
          icon={<TrendingUp size={20} />} 
          subtitle="Target: > 0.80"
        />
        <KPI 
          title="AI Governance" 
          value="98.2%" 
          trend="+0.8%" 
          trendUp={true} 
          icon={<BrainCircuit size={20} />} 
          subtitle="Model alignment"
        />
      </div>

      <AIInsights />

      {/* Main Monitoring Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trajectory Chart — Live BigQuery Feed */}
        <motion.div 
          className="lg:col-span-2 bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
          variants={item}
        >
          <div className="absolute top-0 right-0 p-6 z-20">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live BQ Feed</span>
            </div>
          </div>

          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Performance Trajectory</h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Historical Accuracy, Fairness & Drift</p>
            </div>
            <div className="flex gap-4">
              <LegendItem color="bg-white" label="Accuracy" />
              <LegendItem color="bg-emerald-500" label="Fairness" />
              <LegendItem color="bg-amber-500" label="Drift" />
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : driftTimeline}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFair" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#404040" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#404040" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '12px' }} 
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="6 6" />
                <Area type="monotone" dataKey="accuracy" stroke="#ffffff" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
                <Area type="monotone" dataKey="fairness" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorFair)" />
                <Area type="monotone" dataKey="drift" stroke="#f59e0b" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* System Distribution (Pie) */}
        <motion.div 
          className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl"
          variants={item}
        >
          <h3 className="text-xl font-bold text-white tracking-tight mb-8">System Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engineStats}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={8} dataKey="value" stroke="none"
                >
                  {engineStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {engineStats.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                  <span className="text-xs font-bold text-neutral-400">{entry.name}</span>
                </div>
                <span className="text-xs font-black text-white">{entry.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Secondary Data Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feature Shifts Table */}
        <motion.div 
          className="lg:col-span-2 bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl overflow-hidden shadow-2xl"
          variants={item}
        >
          <div className="p-8 border-b border-neutral-800/50">
            <h3 className="text-xl font-bold text-white tracking-tight">Feature Distribution Shifts</h3>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Drift across input dimensions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-950/30 text-[10px] uppercase tracking-widest text-neutral-500 border-b border-neutral-800/50">
                  <th className="px-8 py-4 font-black">Feature</th>
                  <th className="px-8 py-4 font-black text-center">Shift</th>
                  <th className="px-8 py-4 font-black">Severity</th>
                  <th className="px-8 py-4 font-black">Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/30">
                {displayShifts.map((f: any) => (
                  <tr key={f.feature} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-white">{f.feature}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                        {f.shift}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        f.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                        f.severity === 'Warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>{f.severity}</span>
                    </td>
                    <td className="px-8 py-5 text-xs text-neutral-500">{f.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Active Risk Hotspots Feed */}
        <motion.div 
          className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl flex flex-col"
          variants={item}
        >
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20">
               <ShieldAlert className="text-rose-500" size={20} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white tracking-tight">Active Risk Hotspots</h3>
               <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Priority Bias Vectors</p>
             </div>
          </div>
          <div className="flex-1 space-y-6">
            {[
              { name: 'Age Proxies', risk: 'Critical', score: 88, color: 'bg-rose-500' },
              { name: 'Geographical Bias', risk: 'Warning', score: 64, color: 'bg-amber-500' },
              { name: 'Gender Identity', risk: 'Safe', score: 12, color: 'bg-emerald-500' },
              { name: 'Socioeconomic Proxy', risk: 'Warning', score: 45, color: 'bg-amber-500' },
            ].map((hotspot) => (
              <div key={hotspot.name} className="relative">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">{hotspot.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                    hotspot.risk === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    hotspot.risk === 'Warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {hotspot.risk}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className={`h-full ${hotspot.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${hotspot.score}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-8 p-4 bg-black/40 rounded-2xl border border-neutral-800/50">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                  <Bot className="text-indigo-400" size={14} />
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed italic">
                  "Guardian Analysis: The 'experience_years' feature shows high collinearity with age-protected groups. Recommend bias mitigation in the hiring model."
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
