import { Download, Search, Calendar, FileJson, ChevronLeft, ChevronRight, History, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { api } from '../services/api';
import { socket } from '../services/socket';

interface GovernanceEvent {
  id: string;
  action: string;
  target: string;
  user: string;
  date: string;
  context: string;
  severity?: string;
  timestamp?: string;
}

function mapToEvent(d: any, idx: number): GovernanceEvent {
  const isAnalysis = d.type === 'dataset_analysis';
  
  if (isAnalysis) {
    return {
      id: `ANL-${String(idx + 1).padStart(4, '0')}`,
      action: `Dataset Audit: ${d.fileName}`,
      target: d.domain ?? 'General',
      user: 'System (BiasDetectionAgent)',
      date: d.timestamp ? new Date(d.timestamp).toLocaleString() : 'Just now',
      context: 'Vertex AI Gemini Pro',
      severity: 'normal',
      timestamp: d.timestamp || new Date().toISOString()
    };
  }

  const outcome = d.finalOutcome ?? 'UNKNOWN';
  const isBypass = d.status === 'BYPASS_FAIL_SAFE';
  const isIntercepted = outcome === 'INTERCEPTED';
  
  return {
    id: `EVT-${String(idx + 1).padStart(4, '0')}`,
    action: isBypass
      ? `Fail-Open Bypass: ${d.originalPrediction}`
      : isIntercepted
      ? `Decision Intercepted: ${d.originalPrediction} → REVIEW`
      : `Decision Passed: ${d.originalPrediction}`,
    target: d.domain ?? 'Unknown Domain',
    user: isBypass ? 'System (Fail-Open)' : 'DecisionGuardAgent',
    date: d.timestamp ? new Date(d.timestamp).toLocaleString() : 'Unknown',
    context: d.engine === 'GEN_AI_PIPELINE' ? 'Vertex AI Multi-Agent' : 'Rule Engine',
    severity: isIntercepted ? 'high' : isBypass ? 'warning' : 'normal',
    timestamp: d.timestamp
  };
}

const FALLBACK_EVENTS: GovernanceEvent[] = []; // Only show live data from Firestore

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Audit() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<GovernanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchLogs = () => {
    setLoading(true);
    api.getGovernanceEvents()
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d, i) => mapToEvent(d, data.length - 1 - i));
          setEvents(mapped);
        } else {
          setEvents([]); // Clean state if no data
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    fetchLogs(); 

    // Real-time updates
    const handleNewEvent = () => {
        fetchLogs();
    };

    socket.on('new_decision_intercepted', handleNewEvent);
    socket.on('new_governance_event', handleNewEvent);

    return () => {
        socket.off('new_decision_intercepted', handleNewEvent);
        socket.off('new_governance_event', handleNewEvent);
    };
  }, []);

  const filteredEvents = events.filter((e) =>
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { backgroundColor: '#0a0a0a', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save('fairai-guardian-governance-log.pdf');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fairai-guardian-governance-log.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const systemActions = events.filter((e) => e.user.includes('System') || e.user.includes('Agent')).length;
  const intercepted = events.filter((e) => e.action.toLowerCase().includes('intercepted')).length;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.header className="flex justify-between items-center" variants={item}>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <History className="text-blue-500" /> Governance History
          </h1>
          <p className="text-neutral-400">Live event log of all intercepted decisions, dataset audits, and system overrides.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={exportJSON} className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <FileJson size={16} /> JSON
          </button>
          <button onClick={exportPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            <Download size={16} /> Export PDF
          </button>
        </div>
      </motion.header>

      {/* Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-4" variants={item}>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Total Events</p>
          <p className="text-2xl font-bold text-white mt-1">{loading ? '—' : events.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Agent Actions</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{loading ? '—' : systemActions}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Intercepted</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{loading ? '—' : intercepted}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">GCP Sync Status</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <ShieldCheck size={18} className="text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-500">Active</p>
          </div>
        </div>
      </motion.div>

      <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" variants={item} ref={tableRef}>
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search governance history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 w-72 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <Activity size={14} /> Backed by Google Cloud Logging &amp; Firestore
            </p>
            <button className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg">
              <Calendar size={16} /> Last 30 Days
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-neutral-600 text-sm gap-3">
              <RefreshCw size={16} className="animate-spin" /> Loading governance events...
            </div>
          ) : (
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="text-xs uppercase bg-neutral-950 border-b border-neutral-800 text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Event ID</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Domain</th>
                  <th className="px-6 py-4 font-semibold">Actor</th>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 text-right font-semibold">Processor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredEvents.map((log) => (
                  <motion.tr key={log.id} className="hover:bg-neutral-800/30 transition-colors" variants={item}>
                    <td className="px-6 py-4 font-mono text-white whitespace-nowrap">{log.id}</td>
                    <td className={`px-6 py-4 font-medium ${
                        log.severity === 'high' ? 'text-rose-400' : 
                        log.severity === 'warning' ? 'text-amber-400' : 
                        log.id.startsWith('ANL') ? 'text-blue-400' : 'text-neutral-300'
                    }`}>{log.action}</td>
                    <td className="px-6 py-4 text-neutral-400">{log.target}</td>
                    <td className="px-6 py-4 text-blue-400/80">{log.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-500">{log.date}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-neutral-800 text-neutral-400 px-2 py-1 rounded text-[10px] font-mono border border-white/5">
                        {log.context}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-between items-center text-sm text-neutral-500">
          <span>Showing {filteredEvents.length} of {events.length} live events from Firestore</span>
          <div className="flex gap-2">
            <button className="p-1.5 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"><ChevronLeft size={16} /></button>
            <button className="p-1.5 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
