import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Calendar,
  Filter,
  Download,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';
import { useReport } from '../context/ReportContext';

interface DriftDataPoint {
  date: string;
  score: number;
  totalDecisions: number;
  avgConfidence: number;
  biasedDecisions?: number;
}

interface DriftContributor {
  feature: string;
  drift: number;
}

export default function DriftAnalysis() {
  const { activeDomain } = useDomain();
  const { latestReport } = useReport();
  const [loading, setLoading] = useState(true);
  const [driftData, setDriftData] = useState<DriftDataPoint[]>([]);
  const [contributors, setContributors] = useState<DriftContributor[]>([]);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchDriftData();
  }, [activeDomain, timeRange]);

  const fetchDriftData = async () => {
    setLoading(true);
    try {
      const data = await api.getDriftAnalysis(activeDomain);
      setDriftData(data.historicalDrift || []);
      setContributors(data.driftContributors || []);
    } catch (error) {
      console.error('Error fetching drift data:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateDrift = () => {
    const lastPoint = driftData[driftData.length - 1];
    const newDate = new Date(lastPoint?.date || new Date());
    newDate.setDate(newDate.getDate() + 1);
    
    const driftedPoint: DriftDataPoint = {
      date: newDate.toISOString(),
      score: (lastPoint?.score || 0) + 15 + Math.random() * 10, // Significant jump
      totalDecisions: (lastPoint?.totalDecisions || 100) + Math.floor(Math.random() * 50),
      avgConfidence: (lastPoint?.avgConfidence || 0.8) - 0.1 // Confidence drop
    };
    
    setDriftData([...driftData, driftedPoint]);
    
    // Add a high-drift contributor
    setContributors([
      { feature: 'unseen_demographic_proxy', drift: 24.5 },
      ...contributors.slice(0, 2)
    ]);
  };

  const handleExport = async () => {
    const element = document.getElementById('drift-dashboard');
    if (!element) return;
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0a0a',
      scale: 2,
    });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`FairAI-Drift-Report-${activeDomain}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const currentDrift = driftData.length > 0 ? driftData[driftData.length - 1].score : 0;
  const driftTrend = driftData.length > 1 
    ? (driftData[driftData.length - 1].score - driftData[driftData.length - 2].score).toFixed(1)
    : "0.0";
  
  const currentConfidence = driftData.length > 0 
    ? (driftData[driftData.length - 1].avgConfidence * 100).toFixed(1) 
    : "95.0";
    
  const totalObs = driftData.reduce((acc, curr) => acc + (curr.totalDecisions || 0), 0);
  const totalBias = driftData.reduce((acc, curr) => acc + (curr.biasedDecisions || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="text-blue-500" />
            Model & Bias Drift Analysis
          </h1>
          <p className="text-neutral-400 mt-1">Monitor real-time shifts in AI decision patterns and fairness metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
          <button 
            onClick={simulateDrift}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-semibold rounded-lg border border-rose-500/20 transition-all"
          >
            <AlertTriangle size={16} />
            Test Drift
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/20"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Analyzer Link Status */}
      {latestReport && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Activity className="text-blue-400" size={20} />
            <p className="text-sm text-neutral-300">
              <span className="text-white font-bold">Baseline Synced:</span> Using results from <span className="text-blue-400 font-mono">{latestReport.metadata.fileName}</span> as the current fairness baseline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">Report Score:</span>
            <span className="text-xs font-bold text-white bg-neutral-800 px-2 py-1 rounded border border-white/5">{latestReport.overallBiasScore}%</span>
          </div>
        </motion.div>
      )}

      <div id="drift-dashboard" className="space-y-8">
        {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Current Drift Score', 
            value: currentDrift != null ? `${currentDrift.toFixed(1)}%` : '0.0%', 
            trend: driftTrend ? `${driftTrend}%` : '0%', 
            icon: TrendingUp, 
            color: Number(driftTrend) > 0 ? 'text-rose-500' : 'text-emerald-500',
            bg: 'from-blue-600/20 to-transparent'
          },
          { 
            label: 'Detected Bias Events', 
            value: totalBias.toString(), 
            trend: '+12%', 
            icon: AlertTriangle, 
            color: 'text-amber-500',
            bg: 'from-amber-600/10 to-transparent'
          },
          { 
            label: 'Model Confidence', 
            value: `${currentConfidence}%`, 
            trend: '-0.4%', 
            icon: ShieldCheck, 
            color: 'text-blue-400',
            bg: 'from-emerald-600/10 to-transparent'
          },
          { 
            label: 'Total Observations', 
            value: totalObs > 0 ? (totalObs / 1000).toFixed(1) + 'k' : '0', 
            trend: '+5.2k', 
            icon: Calendar, 
            color: 'text-neutral-400',
            bg: 'from-neutral-600/10 to-transparent'
          }
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl relative overflow-hidden group hover:border-neutral-700 transition-colors bg-gradient-to-br ${kpi.bg}`}
          >
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-white mt-2">{kpi.value}</h3>
                <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${kpi.color}`}>
                  {Number(kpi.trend) > 0 ? '+' : ''}{kpi.trend} 
                  <span className="text-neutral-500 font-normal">from last period</span>
                </div>
              </div>
              <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400 group-hover:text-white transition-colors">
                <kpi.icon size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Drift Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Fairness Drift Timeline</h3>
              <p className="text-sm text-neutral-500">Historical variance in demographic parity over time.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-neutral-400">Bias Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neutral-700"></div>
                <span className="text-neutral-400">Control Group</span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={driftData}>
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#525252" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#171717', 
                    border: '1px solid #262626', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#driftGradient)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Drift Contributors */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col"
        >
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Drift Contributors
              <Info size={14} className="text-neutral-500" />
            </h3>
            <p className="text-sm text-neutral-500">Features driving model output shifts.</p>
          </div>

          <div className="flex-1 space-y-5">
            {contributors.map((c, i) => (
              <div key={c.feature} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-mono text-neutral-400">{c.feature}</span>
                  <span className="font-bold text-white">+{c.drift}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.drift / 25) * 100}%` }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                    className={`h-full rounded-full ${
                      c.drift > 15 ? 'bg-rose-500' : c.drift > 10 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-neutral-800/40 rounded-xl border border-neutral-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              <p className="text-xs text-neutral-400 leading-relaxed">
                <span className="text-white font-bold">Insight:</span> The feature <code className="text-amber-400">avg_transaction_val</code> is showing significant drift. Consider re-training the model or updating the bias mitigation policy.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Confidence vs. Drift Correlation</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={driftData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                />
                <Bar dataKey="avgConfidence" name="Avg Confidence">
                  {driftData.slice(-10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avgConfidence > 0.8 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6">Decision Frequency</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                />
                <Line type="stepAfter" dataKey="totalDecisions" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
