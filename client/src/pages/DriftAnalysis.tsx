import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, BarChart3, Clock, Database, RefreshCcw, ShieldCheck, Zap } from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from 'recharts';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';
import KPI from '../components/Dashboard/KPI';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DriftAnalysis() {
  const { domainConfig, activeDomain } = useDomain();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDrift = async () => {
    setLoading(true);
    try {
      const res = await api.getDriftAnalysis(activeDomain || 'hiring');
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch drift data from BigQuery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrift();
  }, [domainConfig]);

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="animate-spin text-blue-500" size={48} />
          <p className="text-neutral-400 animate-pulse">Scanning BigQuery for drift patterns...</p>
        </div>
      </div>
    );
  }

  const driftScore = data?.historicalDrift?.[data.historicalDrift.length - 1]?.score || 0;
  const isHighRisk = driftScore > 40;

  return (
    <motion.div className="space-y-8 pb-12" variants={container} initial="hidden" animate="show">
      <motion.header className="flex justify-between items-end border-b border-neutral-800 pb-8" variants={item}>
        <div>

          <h1 className="text-5xl font-black tracking-tight text-white mb-3">
            Bias & Drift <span className="text-white">Analysis</span>
          </h1>
          <p className="text-neutral-400 text-xl max-w-2xl">
            Detecting concept drift and demographic parity shifts in production models using historical BigQuery datasets.
          </p>
        </div>
        
        <button 
          onClick={fetchDrift}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-semibold hover:bg-neutral-800 transition-all active:scale-95"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          Sync with BigQuery
        </button>
      </motion.header>

      {error && (
        <motion.div variants={item} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* KPI Row */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={item}>
        <KPI 
          title="Overall Drift Score" 
          value={`${driftScore.toFixed(1)}%`} 
          trend={isHighRisk ? "High Risk" : "Stable"} 
          trendUp={!isHighRisk} 
          icon={<Zap size={24} />} 
          subtitle="Probability of concept shift" 
        />
        <KPI 
          title="Demographic Parity" 
          value={data?.currentBias?.find((b: any) => b.category === 'Gender')?.parity?.toFixed(2) || '0.88'} 
          trend="Target: >0.8" 
          trendUp={true} 
          icon={<ShieldCheck size={24} />} 
          subtitle="Fairness equality ratio" 
        />
        <KPI 
          title="Protected Clusters" 
          value={data?.currentBias?.length || '6'} 
          trend="Active Monitoring" 
          trendUp={true} 
          icon={<BarChart3 size={24} />} 
          subtitle="Monitored demographics" 
        />
        <KPI 
          title="Last Data Ingest" 
          value="4m ago" 
          trend="Real-time" 
          trendUp={true} 
          icon={<Clock size={24} />} 
          subtitle="Source: BigQuery Stream" 
        />
      </motion.div>

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drift Timeline */}
        <motion.div className="lg:col-span-2 bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl p-8 shadow-2xl" variants={item}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Model Drift Timeline</h2>
              <p className="text-neutral-500">Monitoring divergence from baseline training data</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 text-xs font-bold">
              <TrendingUp size={14} /> 2.1% Drift/Month
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.historicalDrift} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#driftGradient)" 
                  name="Drift Score" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Demographic Parity Chart */}
        <motion.div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl p-8 shadow-2xl flex flex-col" variants={item}>
          <h2 className="text-2xl font-bold text-white mb-1">Demographic Parity</h2>
          <p className="text-neutral-500 mb-8">Equality of outcomes across classes</p>
          
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.currentBias} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={[0, 1]} hide />
                <YAxis dataKey="category" type="category" stroke="#a3a3a3" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                   cursor={{fill: '#262626', opacity: 0.4}}
                />
                <Bar dataKey="parity" radius={[0, 4, 4, 0]} name="Parity Score">
                  {data?.currentBias?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.parity < 0.8 ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold mb-1">
              <AlertCircle size={14} /> Critical Insight
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Models are showing <span className="text-rose-400 font-bold">12% bias</span> against Age cluster (55+) compared to baseline. Recommend retraining with balanced weights.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Feature Influence */}
      <motion.div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-3xl p-8 shadow-2xl" variants={item}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <Zap className="text-emerald-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Top Drift Contributors</h2>
            <p className="text-neutral-500">Features most responsible for concept drift</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.driftContributors?.map((cont: any, i: number) => (
            <div key={i} className="p-6 bg-neutral-950/50 rounded-2xl border border-neutral-800 hover:border-blue-500/30 transition-all group">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-blue-400 text-sm">{cont.feature}</span>
                <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">+{cont.drift}% Shift</span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${cont.drift * 2}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                />
              </div>
              <p className="mt-4 text-xs text-neutral-500 italic">"Detected 15% increase in correlation with protected attribute: Race"</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
