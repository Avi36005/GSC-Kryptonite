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
      className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 p-6 rounded-2xl flex flex-col gap-4 hover:border-neutral-700/80 hover:bg-neutral-800/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 shadow-xl group"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="flex items-center justify-between">
        <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">{title}</span>
        <div className="text-blue-400 bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
          {icon}
        </div>
      </div>
      
      <div>
        <h3 className="text-4xl font-black text-white mb-2 tracking-tight group-hover:text-blue-50 group-transition-colors">
          {value}
        </h3>
        
        <div className="flex items-center gap-3">
          {trend && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 shadow-lg ${
              trendUp 
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50 shadow-emerald-900/20' 
                : 'bg-rose-950/50 text-rose-400 border-rose-800/50 shadow-rose-900/20'
            }`}>
              <span className="text-[10px]">{trendUp ? '▲' : '▼'}</span>
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-neutral-500 font-medium tracking-tight">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
