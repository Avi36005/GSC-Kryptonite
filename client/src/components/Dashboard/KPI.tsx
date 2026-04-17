import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface KPIProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: ReactNode;
  subtitle?: string;
}

export default function KPI({ title, value, trend, trendUp, icon, subtitle }: KPIProps) {
  return (
    <motion.div
      className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col gap-3 hover:border-neutral-700 transition-colors"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-between">
        <span className="text-neutral-400 text-sm font-medium">{title}</span>
        <div className="text-blue-500 bg-blue-500/10 p-2 rounded-lg">{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
          {subtitle && <span className="text-xs text-neutral-500">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  );
}
