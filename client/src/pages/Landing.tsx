import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Brain, Activity, ArrowRight, Bot, Lock, Eye, Globe } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-8 max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center rounded-sm">
            <Shield className="text-black" size={24} />
          </div>
          <span className="text-lg font-black tracking-[0.3em] uppercase">FairAI</span>
        </div>
        <div className="hidden md:flex items-center gap-12 text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Frameworks</a>
          <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
        </div>
        <Link 
          to="/audit" 
          className="px-6 py-3 border border-white text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
        >
          Access Console
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-8 text-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">V4.2.0 Deploying Gemini Flash</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9]">
            COMPLIANCE <br />
            <span className="text-neutral-500">BY DESIGN.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            The world's first AI-powered auditor with deep system awareness. 
            Automate fairness, explainability, and regulatory adherence in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              to="/audit" 
              className="group relative px-10 py-5 bg-white text-black font-black text-sm tracking-widest uppercase flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10">Start Audit Mission</span>
              <ArrowRight className="relative z-10 group-hover:translate-x-2 transition-transform" size={18} />
              <div className="absolute inset-0 bg-neutral-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>
            <button className="px-10 py-5 border border-neutral-800 text-neutral-400 font-black text-sm tracking-widest uppercase hover:border-white hover:text-white transition-all">
              Watch Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 px-8 py-32 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="md:col-span-2 p-12 bg-neutral-950 border border-neutral-900 group hover:border-white transition-all duration-500">
            <Brain className="mb-8 text-neutral-500 group-hover:text-white transition-colors" size={48} />
            <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase">System Awareness</h3>
            <p className="text-neutral-400 text-lg max-w-md leading-relaxed">
              Every decision, trace, and log is indexed. Our auditor understands the "why" behind model behavior, not just the "what".
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="p-12 bg-neutral-950 border border-neutral-900 group hover:border-white transition-all duration-500">
            <Shield className="mb-8 text-neutral-500 group-hover:text-white transition-colors" size={48} />
            <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase">Guardrails</h3>
            <p className="text-neutral-400 text-lg leading-relaxed">
              Real-time intervention for biased outputs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-12 bg-neutral-950 border border-neutral-900 group hover:border-white transition-all duration-500">
            <Globe className="mb-8 text-neutral-500 group-hover:text-white transition-colors" size={48} />
            <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase">Global Law</h3>
            <p className="text-neutral-400 text-lg leading-relaxed">
              GDPR, EU AI Act, and NIST RMF built into the core.
            </p>
          </div>

          {/* Card 4 */}
          <div className="md:col-span-2 p-12 bg-neutral-950 border border-neutral-900 group hover:border-white transition-all duration-500 relative overflow-hidden">
            <Activity className="mb-8 text-neutral-500 group-hover:text-white transition-colors" size={48} />
            <div className="relative z-10">
              <h3 className="text-3xl font-black tracking-tighter mb-4 uppercase">Live Monitoring</h3>
              <p className="text-neutral-400 text-lg max-w-md leading-relaxed">
                Visualizing data drifts and performance metrics as they happen. Zero-latency audit trails.
              </p>
            </div>
            {/* Abstract UI Element */}
            <div className="absolute right-[-5%] bottom-[-10%] w-[300px] h-[200px] bg-neutral-900/50 border border-neutral-800 rotate-[-12deg] p-4 hidden lg:block">
              <div className="w-full h-2 bg-neutral-800 rounded-full mb-3" />
              <div className="w-[60%] h-2 bg-neutral-800 rounded-full mb-3" />
              <div className="w-[80%] h-2 bg-neutral-800 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="bg-white text-black py-32 px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="flex-1">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] uppercase">
              MILITARY GRADE <br /> SECURITY.
            </h2>
            <p className="text-neutral-600 text-xl font-medium leading-relaxed mb-12 max-w-xl">
              Data privacy is our priority. With local execution and encrypted traces, your proprietary models stay yours.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <Lock className="mb-4" size={32} />
                <h4 className="font-black text-xs tracking-widest uppercase mb-2">End-to-End</h4>
                <p className="text-neutral-500 text-sm">Every audit trail is cryptographically signed.</p>
              </div>
              <div>
                <Eye className="mb-4" size={32} />
                <h4 className="font-black text-xs tracking-widest uppercase mb-2">No PII Leak</h4>
                <p className="text-neutral-500 text-sm">Automated masking of sensitive user data.</p>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full bg-neutral-100 aspect-square flex items-center justify-center border-4 border-black">
            <Bot size={200} strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-20 border-t border-neutral-900">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Shield size={24} />
              <span className="text-lg font-black tracking-[0.3em] uppercase">FairAI</span>
            </div>
            <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase max-w-xs">
              Defining the future of responsible artificial intelligence.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black tracking-[0.2em] uppercase text-white">Platform</h5>
              <ul className="space-y-2 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
                <li><a href="#" className="hover:text-white transition-colors">Overview</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-black tracking-[0.2em] uppercase text-white">Company</h5>
              <ul className="space-y-2 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-neutral-900 flex justify-between items-center text-[9px] font-bold text-neutral-600 tracking-[0.3em] uppercase">
          <span>© 2024 FairAI Guardian</span>
          <span>Made for the Future</span>
        </div>
      </footer>
    </div>
  );
}
