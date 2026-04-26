import { Activity, ShieldCheck, AlertTriangle, Users, BrainCircuit, Zap, TrendingDown, LayoutDashboard, ShieldAlert, ActivitySquare } from 'lucide-react';
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
        setInterceptCount(prev => Math.max(prev, data.length));
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

    api.getSystemStatus().then((status) => {
      if (status) {
        setStats({
          compliance: status.complianceRate ?? 97.4,
          policies: status.activePolicies ?? 12,
          alerts: status.alertCount ?? 3,
        });
      }
    }).catch(() => {});

    return () => { socket.off('new_decision_intercepted'); };
  }, []);

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
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
            <p className="text-neutral-500 font-medium tracking-tight">System overview and compliance monitoring</p>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <KPI 
          title="Security Compliance" 
          value={`${stats?.compliance || 0}%`} 
          trend="+2.4%" 
          trendUp={true} 
          icon={<ShieldCheck size={20} />} 
          subtitle="All checks passed"
        />
        <KPI 
          title="Active Policies" 
          value={stats?.policies || 0} 
          trend="+1" 
          trendUp={true} 
          icon={<Activity size={20} />} 
          subtitle="Monitoring active"
        />
        <KPI 
          title="System Alerts" 
          value={stats?.alerts || 0} 
          trend="-12%" 
          trendUp={false} 
          icon={<AlertTriangle size={20} />} 
          subtitle="Requires attention"
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compliance Trend */}
        <motion.div 
          className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Compliance Trend</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Compliance %</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biasPerHour}>
                <defs>
                  <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="hour" 
                  stroke="#404040" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#404040" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#171717', 
                    border: '1px solid #262626', 
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    padding: '12px'
                  }} 
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCompliance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Engine Distribution */}
        <motion.div 
          className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">System Distribution</h3>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest bg-neutral-800/50 px-3 py-1.5 rounded-lg border border-neutral-700/50">Live Stats</div>
          </div>
          <div className="h-[350px] w-full flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engineStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {engineStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#171717', 
                      border: '1px solid #262626', 
                      borderRadius: '16px',
                      padding: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4 px-6">
              {engineStats.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                    <span className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors">{entry.name}</span>
                  </div>
                  <span className="text-sm font-black text-white">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          className="lg:col-span-2 bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Bias by Demographic Category</h3>
            <div className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Global metrics</div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBias} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="category" 
                  stroke="#404040" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#404040" 
                  fontSize={10} 
                  fontWeight={700}
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '16px', padding: '12px' }} 
                  cursor={{fill: '#ffffff', opacity: 0.05}} 
                />
                <Bar dataKey="score" name="Bias Score" radius={[4, 4, 0, 0]}>
                  {categoryBias.map((entry, index) => (
                    <Cell key={index} fill={entry.score > 25 ? '#ef4444' : entry.score > 15 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-8 rounded-3xl shadow-2xl flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Recent Events</h3>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Live Feed</p>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {recentEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black/20 rounded-2xl border border-neutral-800/50 border-dashed">
                <p className="text-neutral-500 font-medium text-sm">No recent signals detected.</p>
              </div>
            ) : (
              recentEvents.map((ev, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all duration-300 hover:bg-white/5 ${ev.finalOutcome === 'INTERCEPTED' ? 'border-white/20 bg-white/5' : 'border-neutral-800/50 bg-black/20'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-white/40 text-[10px] tracking-tighter">{ev.decisionId}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ev.finalOutcome === 'INTERCEPTED' ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>{ev.finalOutcome}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
