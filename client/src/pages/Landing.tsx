import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ActivitySquare, Scale, ArrowRight, ShieldAlert, Bot } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const pipelineSteps = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, desc: 'Overview of all active AI models and domain compliance metrics' },
    { name: 'Analyzer', path: '/analyzer', icon: ActivitySquare, desc: 'Scan datasets for historical bias and compute fairness scores' },
    { name: 'Interceptor', path: '/interceptor', icon: ShieldAlert, desc: 'Real-time monitoring and prevention of biased model outputs' },
    { name: 'Compliance Hub', path: '/compliance', icon: Scale, desc: 'Enforce domain-specific regulations and standards' },
    { name: 'AI Auditor', path: '/audit-chat', icon: Bot, desc: 'Interactive chat agent for generating deep compliance reports' },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-[700px] flex flex-col items-center py-12">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-[#A1A1AA] text-sm font-semibold tracking-widest uppercase mb-6"
        >
          <ShieldAlert size={18} className="text-white" />
          Fair AI Guardian
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-center tracking-tight mb-6"
        >
          Build Trust in AI Decisions
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[#A1A1AA] text-lg md:text-xl text-center leading-relaxed max-w-[550px] mb-12"
        >
          Audit, detect, and monitor bias across your AI systems with a structured governance pipeline.
        </motion.p>

        {/* Primary Button */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/dashboard')}
          className="bg-white text-black font-semibold rounded-lg px-8 py-3 hover:bg-neutral-200 transition-colors duration-200 mb-20 flex items-center gap-2"
        >
          Get Started
          <ArrowRight size={18} />
        </motion.button>

        {/* Pipeline / Links section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <h3 className="text-neutral-500 text-sm font-medium uppercase tracking-wider mb-6 px-2">Platform Pipeline</h3>
          <div className="flex flex-col gap-4 relative">
            {/* Vertical pipeline line */}
            <div className="absolute left-9 top-8 bottom-8 w-[2px] bg-neutral-900 z-0 hidden sm:block"></div>

            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <button
                  key={step.name}
                  onClick={() => navigate(step.path)}
                  className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-neutral-900 hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-300 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-black border border-neutral-800 flex items-center justify-center shrink-0 group-hover:border-neutral-600 transition-colors">
                    <Icon size={18} className="text-neutral-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                      {step.name}
                    </h4>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                      {step.desc}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-neutral-700 group-hover:text-neutral-400 transition-colors hidden sm:block" />
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
