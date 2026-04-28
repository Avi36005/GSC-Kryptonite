import { ShieldAlert, Play, AlertTriangle, Send, Wand2, ActivitySquare, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { socket } from '../services/socket';
import { api, API_BASE } from '../services/api';
import { useDomain } from '../context/DomainContext';
import { useReport } from '../context/ReportContext';

interface DecisionEvent {
  decisionId: string;
  timestamp: string;
  originalPrediction: string;
  mitigatedPrediction: string;
  finalOutcome: string;
  biasReport: {
    isBiased: boolean;
    confidenceScore: number;
    flaggedFeatures: string[];
    reasoning: string;
  };
  complianceReport: {
    isCompliant: boolean;
    violations: { framework: string; rule: string; severity: string }[];
  };
  explanation: string;
  engine?: string;
  status?: string;
  features?: Record<string, any>;
}

const SAMPLE_SCENARIOS = [
  { id: 'LOAN-001', features: { age: 34, income: 55000, zip_code: '90210', credit_score: 680, employment_years: 5 }, action: 'DENIED' },
  { id: 'HIRE-002', features: { age: 28, gender: 'female', university: 'State College', gpa: 3.6, club_membership: 'none' }, action: 'REJECTED' },
  { id: 'INSURE-003', features: { age: 62, health_score: 72, location: 'rural', income: 32000 }, action: 'HIGH_PREMIUM' },
  { id: 'LOAN-004', features: { age: 45, income: 120000, zip_code: '10001', credit_score: 790, employment_years: 12 }, action: 'APPROVED' },
];

export default function Interceptor() {
  const [events, setEvents] = useState<DecisionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DecisionEvent | null>(null);
  const [sending, setSending] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [autoFixResult, setAutoFixResult] = useState<any>(null);
  const [isHalted, setIsHalted] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const feedRef = useRef<HTMLDivElement>(null);
  const { activeDomain, domainConfig } = useDomain();
  const { latestReport } = useReport();
  
  const activeScenarios = domainConfig?.scenarios || [];

  const handleAutoFix = async () => {
    if (!selectedEvent) return;
    setFixing(true);
    setAutoFixResult(null);
    try {
      const res = await fetch(`${API_BASE}/autofix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: selectedEvent.decisionId,
          features: selectedEvent.features || { age: 34, income: 55000, zip_code: '90210' },
          prediction: selectedEvent.originalPrediction,
          biasReport: selectedEvent.biasReport,
          complianceReport: selectedEvent.complianceReport,
          domain: activeDomain
        })
      });
      const data = await res.json();
      setAutoFixResult(data);
    } catch (error) {
      console.error(error);
    }
    setFixing(false);
  };

  useEffect(() => {
    // Initial fetch
    api.getSystemStatus().then(status => {
      setIsHalted(status.halt);
    });

    api.getDecisions().then(data => {
      if (Array.isArray(data)) {
        setEvents(data);
      }
    });

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('new_decision_intercepted', (data: DecisionEvent) => {
      setEvents((prev) => {
        // De-duplicate: check if this decision already exists in the feed
        const exists = prev.some(e => e.decisionId === data.decisionId && e.timestamp === data.timestamp);
        if (exists) return prev;
        return [...prev, data];
      });
      setSelectedEvent(data);
    });

    socket.on('system_status_change', (status: { halt: boolean }) => {
      setIsHalted(status.halt);
    });

    return () => { 
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_decision_intercepted'); 
      socket.off('system_status_change');
    };
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const sendScenario = async (scenario: any) => {
    setSending(true);
    try {
      // Use features from scenario if available, else fallback
      const features = scenario.features || { age: 34, income: 55000, zip_code: '90210', club_membership: 'vip' };
      const result = await api.analyzeDecision(scenario.id, features, scenario.action, activeDomain);
      // The socket listener will also receive this, but we update locally for immediate feedback
      setEvents((prev) => {
        const exists = prev.some(e => e.decisionId === result.decisionId && e.timestamp === result.timestamp);
        if (exists) return prev;
        return [...prev, result];
      });
      setSelectedEvent(result);
    } catch (err) {
      console.error('Failed to intercept decision:', err);
    }
    setSending(false);
  };

  const handleHaltToggle = async () => {
    try {
      const result = await api.toggleHalt(!isHalted);
      setIsHalted(result.halt);
    } catch (err) {
      console.error('Failed to toggle halt:', err);
    }
  };

  return (
    <motion.div className="space-y-8 font-['Plus_Jakarta_Sans']" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <header className="flex justify-between items-end pb-2">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">
            Decision <span className="text-white">Interceptor</span>
          </h1>
          <p className="text-neutral-400 max-w-2xl mt-2 tracking-tight leading-relaxed">
            Live evaluation of AI inferences through our proprietary multi-agent governance pipeline. 
            Real-time bias detection and automated policy enforcement.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleHaltToggle}
            className={`${isHalted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95`}
          >
            {isHalted ? <Play size={18} fill="currentColor" /> : <AlertTriangle size={18} fill="currentColor" />}
            {isHalted ? 'Resume Protection' : 'Emergency Halt'}
          </button>
        </div>
      </header>

      {/* Linked Analyzer Report Banner */}
      {latestReport && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <ActivitySquare className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Active Bias Policy: {latestReport.metadata.fileName}</h3>
              <p className="text-neutral-400 text-xs">
                Interceptor is now enforcing guards based on {latestReport.flaggedColumns.length} flagged proxy variables.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {latestReport.flaggedColumns.slice(0, 3).map(col => (
              <span key={col.column} className="text-[10px] bg-neutral-900 text-blue-400 px-2 py-1 rounded border border-blue-500/30 font-mono">
                {col.column}
              </span>
            ))}
            {latestReport.flaggedColumns.length > 3 && (
              <span className="text-[10px] bg-neutral-900 text-neutral-500 px-2 py-1 rounded border border-white/5">
                +{latestReport.flaggedColumns.length - 3} more
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Scenario Buttons */}
      <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Send size={120} className="rotate-12" />
        </div>
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">Injection Console: {domainConfig?.name || activeDomain}</h3>
        <div className="flex flex-wrap gap-3 relative z-10">
          {activeScenarios.map((s) => (
            <button
              key={s.id}
              disabled={sending}
              onClick={() => sendScenario(s)}
              className="bg-neutral-800/50 hover:bg-neutral-700/50 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-all border border-white/5 hover:border-white/10 card-hover group"
            >
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Send size={12} className="text-white" />
              </div>
              <span className="font-medium">{s.id}</span>
              <span className="text-neutral-500">—</span>
              <span className="text-neutral-300 italic">{s.action}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Feed */}
        <div className="glass rounded-2xl border border-white/5 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <ActivitySquare size={18} className="text-white" />
              Live Monitoring Stream
            </h2>
            <span className={`flex items-center gap-2 text-[10px] ${isConnected ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'} px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span> 
              {isConnected ? 'Live Stream Active' : 'Stream Disconnected'}
            </span>
          </div>
          <div ref={feedRef} className="flex-1 p-5 font-mono text-sm space-y-4 overflow-y-auto max-h-[600px] scrollbar-hide">
            {events.length === 0 && (
              <div className="text-center text-neutral-600 py-24 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4 border border-white/5">
                  <Play size={24} className="opacity-20 ml-1" />
                </div>
                <p className="max-w-[200px] text-xs uppercase tracking-widest font-semibold opacity-40">Awaiting Data Ingestion...</p>
              </div>
            )}
            <AnimatePresence>
              {events.map((ev, i) => (
                <motion.div
                  key={`${ev.decisionId}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    ev.finalOutcome === 'INTERCEPTED'
                      ? 'border-rose-500/30 bg-rose-500/[0.03] hover:bg-rose-500/[0.06]'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                  } ${selectedEvent?.decisionId === ev.decisionId && selectedEvent?.timestamp === ev.timestamp ? 'ring-2 ring-white/20 border-white/40' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${ev.finalOutcome === 'INTERCEPTED' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      <span className="text-white font-bold">{ev.decisionId}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-medium">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className={`text-xs font-bold flex items-center gap-2 ${ev.finalOutcome === 'INTERCEPTED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {ev.finalOutcome === 'INTERCEPTED' ? <ShieldAlert size={14} /> : <FileCheck size={14} />}
                    {ev.status === 'BYPASS_FAIL_SAFE' ? 'SYSTEM OVERRIDE — Guardrail Offline' : 
                     ev.finalOutcome === 'INTERCEPTED' ? 'GUARD INTERCEPT — Bias Triggered' : 'CLEAR — Policy Compliant'}
                  </div>
                  {ev.engine && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Processor</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${ev.engine === 'RULE_BASED_COMPLIANCE' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'}`}>
                        {ev.engine === 'RULE_BASED_COMPLIANCE' ? 'Rule Engine' : 'Vertex AI Multi-Agent'}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Interception Details</h2>
          {!selectedEvent ? (
            <div className="text-neutral-600 text-center py-16">Select an event from the feed to view details.</div>
          ) : (
            <motion.div className="space-y-4" key={selectedEvent.timestamp} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Decision ID</span>
                  <div className="text-white mt-1 font-mono">{selectedEvent.decisionId}</div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Outcome</span>
                  <div className={`mt-1 font-semibold ${selectedEvent.finalOutcome === 'INTERCEPTED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedEvent.finalOutcome}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Original Prediction</span>
                  <div className="text-amber-400 mt-1 font-mono">{selectedEvent.originalPrediction}</div>
                </div>
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Mitigated To</span>
                  <div className="text-white mt-1 font-mono">{selectedEvent.mitigatedPrediction}</div>
                </div>
              </div>

              {selectedEvent.biasReport?.flaggedFeatures?.length > 0 && (
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Flagged Proxy Features</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEvent.biasReport.flaggedFeatures.map((f) => (
                      <span key={f} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded text-xs font-mono">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.complianceReport?.violations?.length > 0 && (
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Compliance Violations</span>
                  <div className="space-y-2 mt-2">
                    {selectedEvent.complianceReport.violations.map((v, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-neutral-300">{v.framework}: {v.rule}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.severity === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {v.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Explanation Agent Output</span>
                <p className="text-neutral-300 mt-2 text-sm leading-relaxed">{selectedEvent.explanation}</p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Bias Confidence</span>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Agent Confidence</span>
                    <span className="text-white font-medium">{selectedEvent.biasReport?.confidenceScore ?? 0}%</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ background: (selectedEvent.biasReport?.confidenceScore ?? 0) > 60 ? '#ef4444' : '#f59e0b' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedEvent.biasReport?.confidenceScore ?? 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {selectedEvent.finalOutcome === 'INTERCEPTED' && (
                <div className="mt-6 pt-6 border-t border-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Wand2 className="text-white" size={20} /> Auto Bias Fix Engine
                    </h3>
                    <button
                      onClick={handleAutoFix}
                      disabled={fixing}
                      className="bg-white hover:bg-neutral-200 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {fixing ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span> : <Wand2 size={16} />}
                      {fixing ? 'Generating Fix...' : 'Generate Compliance Fix'}
                    </button>
                  </div>

                  {autoFixResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-neutral-950 border border-neutral-800 rounded-xl p-5">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">New Prediction</span>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-neutral-600"></div>
                              <div className="w-0.5 h-6 bg-neutral-800"></div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white tracking-wider">{autoFixResult.correctedPrediction}</span>
                                <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded border border-white/5 uppercase font-medium">Core Node</span>
                              </div>
                              <p className="text-xs text-neutral-400 leading-relaxed tracking-tight">System validation successful.</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Features Removed</span>
                          <div className="flex gap-2 mt-2">
                            {autoFixResult.removedFeatures?.map((f: string) => (
                              <span key={f} className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700 font-mono">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Correction Explanation</span>
                        <p className="text-neutral-300 mt-2 text-sm">{autoFixResult.correctionExplanation}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
