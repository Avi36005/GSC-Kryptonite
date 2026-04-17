import { ShieldAlert, Play, AlertTriangle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { socket } from '../services/socket';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';

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
}

const SAMPLE_SCENARIOS = [
  { id: 'LOAN-001', features: { age: 34, income: 55000, zip_code: '90210', credit_score: 680, employment_years: 5 }, prediction: 'DENIED' },
  { id: 'HIRE-002', features: { age: 28, gender: 'female', university: 'State College', gpa: 3.6, club_membership: 'none' }, prediction: 'REJECTED' },
  { id: 'INSURE-003', features: { age: 62, health_score: 72, location: 'rural', income: 32000 }, prediction: 'HIGH_PREMIUM' },
  { id: 'LOAN-004', features: { age: 45, income: 120000, zip_code: '10001', credit_score: 790, employment_years: 12 }, prediction: 'APPROVED' },
];

export default function Interceptor() {
  const [events, setEvents] = useState<DecisionEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<DecisionEvent | null>(null);
  const [sending, setSending] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const { activeDomain, domainConfig } = useDomain();
  
  const activeScenarios = domainConfig?.scenarios || [];

  useEffect(() => {
    socket.on('new_decision_intercepted', (data: DecisionEvent) => {
      setEvents((prev) => [...prev, data]);
      setSelectedEvent(data);
    });
    return () => { socket.off('new_decision_intercepted'); };
  }, []);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const sendScenario = async (scenario: any) => {
    setSending(true);
    try {
      // Mock features based on domain for demonstration
      const mockFeatures = { age: 34, income: 55000, zip_code: '90210', club_membership: 'vip' };
      const result = await api.analyzeDecision(scenario.id, mockFeatures, scenario.action, activeDomain);
      setEvents((prev) => [...prev, result]);
      setSelectedEvent(result);
    } catch (err) {
      console.error('Failed to intercept decision:', err);
    }
    setSending(false);
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Decision Interceptor</h1>
          <p className="text-neutral-400">Live feed of AI inferences evaluated by the multi-agent pipeline.</p>
        </div>
        <button className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
          <AlertTriangle size={18} /> Emergency Halt
        </button>
      </header>

      {/* Scenario Buttons */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Send Test Scenario ({domainConfig?.name || activeDomain})</h3>
        <div className="flex flex-wrap gap-3">
          {activeScenarios.map((s) => (
            <button
              key={s.id}
              disabled={sending}
              onClick={() => sendScenario(s)}
              className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors border border-neutral-700"
            >
              <Send size={14} /> {s.id} — {s.action}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Feed */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col">
          <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="font-semibold text-white">Live Stream</h2>
            <span className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Listening
            </span>
          </div>
          <div ref={feedRef} className="flex-1 p-4 font-mono text-sm text-neutral-400 space-y-3 overflow-y-auto max-h-[500px]">
            {events.length === 0 && (
              <div className="text-center text-neutral-600 py-12">
                <Play size={32} className="mx-auto mb-3 opacity-40" />
                <p>No events yet. Click a scenario above to begin interception.</p>
              </div>
            )}
            <AnimatePresence>
              {events.map((ev, i) => (
                <motion.div
                  key={`${ev.decisionId}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    ev.finalOutcome === 'INTERCEPTED'
                      ? 'border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/30'
                      : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900'
                  } ${selectedEvent?.decisionId === ev.decisionId && selectedEvent?.timestamp === ev.timestamp ? 'ring-1 ring-blue-500' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-white">[{ev.finalOutcome === 'INTERCEPTED' ? 'WARN' : 'INFO'}] {ev.decisionId}</span>
                    <span className="text-neutral-600">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className={`font-bold flex items-center gap-1.5 ${ev.finalOutcome === 'INTERCEPTED' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {ev.finalOutcome === 'INTERCEPTED' && <ShieldAlert size={13} />}
                    {ev.finalOutcome === 'INTERCEPTED' ? 'INTERCEPTED — Bias Detected' : 'PASS — Decision approved'}
                  </div>
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
                  <div className="text-blue-400 mt-1 font-mono">{selectedEvent.mitigatedPrediction}</div>
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
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
