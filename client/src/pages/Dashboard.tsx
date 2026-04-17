import { ActivitySquare, ShieldAlert, Users, BrainCircuit, Zap, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import KPI from '../components/Dashboard/KPI';
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
  const [recentEvents, setRecentEvents] = useState<{ decisionId: string; finalOutcome: string; timestamp: string }[]>([]);
  const { domainConfig } = useDomain();

  useEffect(() => {
    socket.on('new_decision_intercepted', (data) => {
      setInterceptCount((prev) => prev + 1);
      setRecentEvents((prev) => [data, ...prev].slice(0, 5));
    });

    api.getDecisions().then((data) => {
      if (Array.isArray(data)) {
        setRecentEvents(data.slice(-5).reverse());
      }
    }).catch(() => {});

    return () => { socket.off('new_decision_intercepted'); };
  }, []);

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.header className="mb-2" variants={item}>
        <h1 className="text-3xl font-bold text-white">Global Oversight {domainConfig ? `- ${domainConfig.name}` : ''}</h1>
        <p className="text-neutral-400 mt-1">Real-time AI bias monitoring, agent activity, and compliance metrics.</p>
      </motion.header>

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
        <motion.div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6" variants={item}>
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Bias vs Compliance — 24h</h2>
              <p className="text-sm text-neutral-500">Real-time hourly fluctuation</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Bias Incidents</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Compliance</span>
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

        <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col" variants={item}>
          <h2 className="text-lg font-semibold text-white mb-1">Agent Activity</h2>
          <p className="text-sm text-neutral-500 mb-4">Invocations today</p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={agentActivity} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {agentActivity.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: 8, color: '#f5f5f5' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {agentActivity.map((a, i) => (
              <div key={a.name} className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }}></span>
                {a.name}: <span className="text-white font-medium">{a.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6" variants={item}>
          <h2 className="text-lg font-semibold text-white mb-1">Bias by Demographic Category</h2>
          <p className="text-sm text-neutral-500 mb-4">Bias score distribution across protected classes</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBias} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="category" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: 8, color: '#f5f5f5' }} />
                <Bar dataKey="score" name="Bias Score" radius={[6, 6, 0, 0]}>
                  {categoryBias.map((entry) => (
                    <Cell key={entry.category} fill={entry.score > 25 ? '#ef4444' : entry.score > 15 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col" variants={item}>
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2"><Zap className="text-amber-500" size={18} /> Recent Events</h2>
          <p className="text-sm text-neutral-500 mb-4">Latest intercepted decisions</p>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-56">
            {recentEvents.length === 0 ? (
              <p className="text-neutral-600 text-sm text-center py-8">No events yet. Send a decision to /api/decisions/intercept.</p>
            ) : (
              recentEvents.map((ev, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${ev.finalOutcome === 'INTERCEPTED' ? 'border-rose-500/20 bg-rose-500/5' : 'border-neutral-800 bg-neutral-950'}`}>
                  <div className="flex justify-between">
                    <span className="font-mono text-white">{ev.decisionId}</span>
                    <span className={`font-semibold ${ev.finalOutcome === 'INTERCEPTED' ? 'text-rose-400' : 'text-emerald-400'}`}>{ev.finalOutcome}</span>
                  </div>
                  <span className="text-neutral-500 text-xs">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center gap-2 text-xs text-neutral-500">
            <TrendingDown size={14} className="text-emerald-500" /> Bias incidents down 2.4% over trailing 7 days
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
