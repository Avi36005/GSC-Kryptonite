import { Download, Search, Calendar, FileJson, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const auditLogs = [
  { id: 'AUD-9921', action: 'RAG Explanation Generated', target: 'Prediction Service', user: 'System (ExplanationAgent)', date: 'Today, 10:42 AM', hash: '0x8a3f...e21c' },
  { id: 'AUD-9920', action: 'Decision Intercepted (DENIED → REVIEW)', target: 'Interceptor Module', user: 'DecisionGuardAgent', date: 'Today, 10:42 AM', hash: '0x7b22...a913' },
  { id: 'AUD-9919', action: 'Bias Proxy Flagged: zip_code', target: 'BiasDetectionAgent', user: 'System', date: 'Today, 10:41 AM', hash: '0x91c4...d082' },
  { id: 'AUD-9918', action: 'Compliance Violation: GDPR Art. 22', target: 'ComplianceAgent', user: 'System', date: 'Today, 10:41 AM', hash: '0x55f1...b7e3' },
  { id: 'AUD-9917', action: 'Threshold adjusted: Disparate Impact → 0.8', target: 'Global Config', user: 'admin@fairai.dev', date: 'Yesterday, 14:22 PM', hash: '0xa3d9...c441' },
  { id: 'AUD-9916', action: 'Batch Dataset Upload (240k rows)', target: 'Analyzer Interface', user: 'k.davis@corp.io', date: 'Yesterday, 11:05 AM', hash: '0x6e81...f923' },
  { id: 'AUD-9915', action: 'Compliance Map Updated', target: 'EU AI Act Ruleset v2.1', user: 'Auto-Sync', date: 'Oct 14, 02:00 AM', hash: '0xb4c7...1a56' },
  { id: 'AUD-9914', action: 'Model v2.4 deployed to production', target: 'Deployment Pipeline', user: 'CI/CD System', date: 'Oct 13, 22:00 PM', hash: '0xd29e...8723' },
  { id: 'AUD-9913', action: 'Emergency Halt invoked', target: 'All Models', user: 'admin@fairai.dev', date: 'Oct 12, 16:45 PM', hash: '0xf193...6d47' },
  { id: 'AUD-9912', action: 'Retrain scheduled: drift threshold exceeded', target: 'FairWatch Monitor', user: 'System', date: 'Oct 12, 08:30 AM', hash: '0x2a5b...e198' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Audit() {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const filteredLogs = auditLogs.filter((log) =>
    log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase())
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
    pdf.save('fairai-guardian-audit-trail.pdf');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fairai-guardian-audit-trail.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const verifyHash = (hash: string) => {
    setVerifiedHash(hash);
    setTimeout(() => setVerifiedHash(null), 3000);
  };

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.header className="flex justify-between items-center" variants={item}>
        <div>
          <h1 className="text-3xl font-bold text-white">Immutable Audit Trail</h1>
          <p className="text-neutral-400">Cryptographically secured logs of all governance events and system overrides.</p>
        </div>
        <div className="flex gap-3">
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
          <p className="text-2xl font-bold text-white mt-1">{auditLogs.length.toLocaleString()}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">System Actions</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{auditLogs.filter((l) => l.user.includes('System') || l.user.includes('Agent')).length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Human Actions</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{auditLogs.filter((l) => l.user.includes('@')).length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Integrity Status</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">Verified ✓</p>
        </div>
      </motion.div>

      <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" variants={item} ref={tableRef}>
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by ID, action, or actor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 w-72 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg">
              <Calendar size={16} /> Last 30 Days
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs uppercase bg-neutral-950 border-b border-neutral-800 text-neutral-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Event ID</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Target System</th>
                <th className="px-6 py-4 font-semibold">Actor</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Integrity Hash</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredLogs.map((log) => (
                <motion.tr key={log.id} className="hover:bg-neutral-800/30 transition-colors" variants={item}>
                  <td className="px-6 py-4 font-mono text-white whitespace-nowrap">{log.id}</td>
                  <td className="px-6 py-4 text-neutral-300">{log.action}</td>
                  <td className="px-6 py-4">{log.target}</td>
                  <td className="px-6 py-4 text-emerald-400">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.date}</td>
                  <td className="px-6 py-4 font-mono text-xs flex items-center gap-1.5">
                    <Hash size={12} className="text-neutral-600" /> {log.hash}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => verifyHash(log.hash)}
                      className={`font-medium text-sm transition-all ${verifiedHash === log.hash ? 'text-emerald-400' : 'text-blue-500 hover:text-blue-400'}`}
                    >
                      {verifiedHash === log.hash ? '✓ Valid' : 'Verify'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-neutral-800 flex justify-between items-center text-sm text-neutral-500">
          <span>Showing {filteredLogs.length} of {auditLogs.length} events</span>
          <div className="flex gap-2">
            <button className="p-1.5 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"><ChevronLeft size={16} /></button>
            <button className="p-1.5 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
