import { Eye, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '../services/api';
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
  const { domainConfig } = useDomain();

  useEffect(() => {
    api.getDriftData().then((data) => {
      if (data?.drift_score != null) setDriftScore(data.drift_score);
    }).catch(() => {});
  }, []);

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.header className="mb-2" variants={item}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Eye className="text-blue-500" size={32} /> {domainConfig ? `${domainConfig.name} - ` : ''}FairWatch Monitor
        </h1>
        <p className="text-neutral-400">Post-deployment model drift and long-term fairness assurance.</p>
      </motion.header>


      {/* KPIs Row */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-4" variants={item}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Current Drift</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{driftScore != null ? `${(driftScore * 100).toFixed(1)}%` : '...'}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Model Accuracy</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">88.3%</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Fairness Score</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">0.83</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Days Since Retrain</p>
          <p className="text-2xl font-bold text-white mt-1">14</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drift Chart */}
        <motion.div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6" variants={item}>
          <h2 className="text-lg font-semibold text-white mb-1">Drift & Fairness Over Time</h2>
          <p className="text-sm text-neutral-500 mb-4">40-day monitoring window showing accuracy decay and recovery after retraining</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={driftTimeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: 8, color: '#f5f5f5' }} />
                <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Min Accuracy', position: 'right', fill: '#f59e0b', fontSize: 10 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} name="Accuracy %" />
                <Line type="monotone" dataKey="fairness" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Fairness Score" yAxisId={0} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-6 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Accuracy</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Fairness Score</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Min Accuracy Threshold</span>
          </div>
        </motion.div>

        {/* Side Panels */}
        <div className="space-y-6">
          <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6" variants={item}>
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-500" /> Active Alerts
            </h3>
            <div className="space-y-3">
              <div className="border-l-2 border-rose-500 pl-4 py-1">
                <p className="text-sm font-medium text-white mb-1">Critical: Demographic Drift</p>
                <p className="text-xs text-neutral-400">Model v2.4 error rate exceeds 8% on Asian demographic class. Immediate retraining recommended.</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-4 py-1">
                <p className="text-sm font-medium text-white mb-1">Warning: Feature Shift</p>
                <p className="text-xs text-neutral-400">Geographic Region input data distribution shifted 22%. Model may produce unreliable predictions.</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-4 py-1">
                <p className="text-sm font-medium text-white mb-1">Info: Auto-Retrain Scheduled</p>
                <p className="text-xs text-neutral-400">Scheduled retrain triggered for Day 38. Recovery observed in metrics.</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6" variants={item}>
            <h3 className="font-semibold text-white mb-4">Retraining Controls</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-neutral-400">Last Retrained</span><span className="text-white">14 Days Ago</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Trigger Threshold</span><span className="text-white">&gt; 15% Drift</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Auto-Retrain</span><span className="text-emerald-500 font-medium">Enabled</span></div>
            </div>
            <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <RefreshCw size={16} /> Force Retrain Now
            </button>
          </motion.div>
        </div>
      </div>

      {/* Feature Shift Table */}
      <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" variants={item}>
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Feature Distribution Shifts</h2>
          <p className="text-sm text-neutral-400 mt-1">Comparing incoming data distribution against training data baseline</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase bg-neutral-950 border-b border-neutral-800 text-neutral-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Feature</th>
              <th className="px-6 py-4 font-semibold">Distribution Shift</th>
              <th className="px-6 py-4 font-semibold">Severity</th>
              <th className="px-6 py-4 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {featureShifts.map((f) => (
              <tr key={f.feature} className="hover:bg-neutral-800/30 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{f.feature}</td>
                <td className="px-6 py-4 font-mono text-neutral-300">{f.shift}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    f.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400' :
                    f.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>{f.severity}</span>
                </td>
                <td className="px-6 py-4 text-neutral-400">{f.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
