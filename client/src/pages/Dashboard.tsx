import { ActivitySquare, ShieldAlert, Users, BrainCircuit, Zap, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import KPI from '../components/Dashboard/KPI';
import AIInsights from '../components/Dashboard/AIInsights';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

const biasPerHour = [
  { name: '00:00', biasScore: 12, compliance: 98 },
  { name: '02:00', biasScore: 8, compliance: 99 },
  { name: '04:00', biasScore: 19, compliance: 96 },
  { name: '06:00', biasScore: 11, compliance: 98 },
  { name: '08:00', biasScore: 15, compliance: 97 },
  { name: '10:00', biasScore: 42, compliance: 89 },
  { name: '12:00', biasScore: 45, compliance: 88 },
  { name: '14:00', biasScore: 32, compliance: 91 },
  { name: '16:00', biasScore: 22, compliance: 95 },
  { name: '18:00', biasScore: 18, compliance: 97 },
  { name: '20:00', biasScore: 14, compliance: 98 },
  { name: '22:00', biasScore: 10, compliance: 99 },
];

const agentActivity = [
  { name: 'BiasDetect', value: 342 },
  { name: 'Compliance', value: 218 },
  { name: 'Explanation', value: 189 },
  { name: 'DecisionGuard', value: 415 },
];

const categoryBias = [
  { category: 'Gender', score: 18 },
  { category: 'Race', score: 31 },
  { category: 'Age', score: 12 },
  { category: 'Disability', score: 8 },
  { category: 'Religion', score: 5 },
  { category: 'Location', score: 24 },
];

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

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
  const { domainConfig } = useDomain();

  useEffect(() => {
    socket.on('new_decision_intercepted', (data) => {
      setInterceptCount((prev) => prev + 1);
      setRecentEvents((prev) => [data, ...prev].slice(0, 5));
      
      if (data.engine) {
        setEngineStats(prev => {
          const newStats = [...prev];
          const idx = data.engine === 'GEN_AI_PIPELINE' ? 0 : 1;
          newStats[idx].value += 1;
          return newStats;
        });
      }
    });

    api.getDecisions().then((data) => {
      if (Array.isArray(data)) {
        setRecentEvents(data.slice(-5).reverse());
        
        // Calculate engine distribution from history
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

    return () => { socket.off('new_decision_intercepted'); };
  }, []);

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.header className="mb-6 border-b border-neutral-800 pb-6" variants={item}>
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/20">
            <Zap className="text-blue-400" size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Global Oversight {domainConfig ? <span className="text-blue-500">— {domainConfig.name}</span> : ''}
            </h1>
            <p className="text-neutral-400 text-lg">Real-time AI bias monitoring, agent activity, and compliance metrics.</p>
          </div>
        </div>
      </motion.header>

      {/* AI Insights */}
      <motion.div variants={item}>
        <AIInsights />
      </motion.div>

      {/* KPIs */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={item}>
        <KPI title="System Bias Score" value="14.2%" trend="2.4% vs last week" trendUp={false} icon={<BrainCircuit size={24} />} subtitle="Overall model fairness" />
        <KPI title="Interventions" value={interceptCount.toLocaleString()} trend="12% vs last week" trendUp={true} icon={<ShieldAlert size={24} />} subtitle="Biased decisions blocked" />
        <KPI title="Compliance Health" value="98.5%" trend="Stable" trendUp={true} icon={<ActivitySquare size={24} />} subtitle="Legal & regulatory alignment" />
        <KPI 
          title={domainConfig?.metrics?.biasMetricTitle || "Demographic Disparity"} 
          value="0.84" 
          trend={domainConfig?.metrics?.targetMetric || "Target: >0.8"} 
          trendUp={true} 
          icon={<Users size={24} />} 
          subtitle={domainConfig?.metrics?.biasMetricSubtitle || "Disparate impact ratio"} 
        />
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-6 shadow-xl" variants={item}>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Bias vs Compliance</h2>
              <p className="text-sm text-neutral-500">Real-time 24h hourly fluctuation</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Bias Incidents
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Compliance
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biasPerHour} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBias" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', color: '#f5f5f5', borderRadius: 8 }} />
                <Area type="monotone" dataKey="biasScore" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBias)" name="Bias Incidents" />
                <Area type="monotone" dataKey="compliance" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorComp)" name="Compliance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-6 flex flex-col shadow-xl" variants={item}>
          <h2 className="text-xl font-bold text-white mb-1">Analysis Engine</h2>
          <p className="text-sm text-neutral-500 mb-6">Pipeline Distribution</p>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl"></div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={engineStats} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value" cornerRadius={6}>
                  {engineStats.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px', padding: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-6">
            {engineStats.map((a, i) => (
              <div key={a.name} className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-xl border border-neutral-800/50 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ background: i === 0 ? '#3b82f6' : '#f59e0b' }}></span>
                  <span className="text-neutral-300 font-medium">{a.name}</span>
                </div>
                <span className="text-white font-bold">{a.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-6 shadow-xl" variants={item}>
          <h2 className="text-xl font-bold text-white mb-1">Bias by Demographic Category</h2>
          <p className="text-sm text-neutral-500 mb-6">Bias score distribution across protected classes</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBias} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="category" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: 8, color: '#f5f5f5' }} cursor={{fill: '#262626', opacity: 0.4}} />
                <Bar dataKey="score" name="Bias Score" radius={[6, 6, 0, 0]}>
                  {categoryBias.map((entry) => (
                    <Cell key={entry.category} fill={entry.score > 25 ? '#ef4444' : entry.score > 15 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-6 flex flex-col shadow-xl" variants={item}>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Zap className="text-amber-500" size={20} /> Recent Events</h2>
          <p className="text-sm text-neutral-500 mb-6">Latest intercepted decisions</p>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-56 pr-2 custom-scrollbar">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-neutral-950/50 rounded-xl border border-neutral-800/50 border-dashed">
                <p className="text-neutral-500 text-sm">No events yet.</p>
                <p className="text-neutral-600 text-xs mt-1">Send a decision to /api/decisions/intercept.</p>
              </div>
            ) : (
              recentEvents.map((ev, i) => (
                <div key={i} className={`p-3 rounded-xl border text-sm transition-all duration-300 hover:scale-[1.02] ${ev.finalOutcome === 'INTERCEPTED' ? 'border-rose-500/20 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.05)]' : 'border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-white/90 text-xs">{ev.decisionId}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ev.finalOutcome === 'INTERCEPTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>{ev.finalOutcome}</span>
                  </div>
                  <span className="text-neutral-500 text-xs flex items-center gap-1.5"><ActivitySquare size={12} className={ev.finalOutcome === 'INTERCEPTED' ? 'text-rose-500/50' : 'text-emerald-500/50'} /> {new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-800/50 flex items-center gap-2 text-xs text-neutral-400 bg-neutral-950/30 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <TrendingDown size={16} className="text-emerald-500 bg-emerald-500/10 p-1 rounded-full" /> 
            <span className="font-medium text-emerald-400">2.4% decrease</span> in bias incidents over 7 days
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
