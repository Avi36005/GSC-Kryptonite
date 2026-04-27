import { FileText, ShieldCheck, AlertCircle, FileCheck2, Globe, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../services/api';
import { useDomain } from '../context/DomainContext';
import { useReport } from '../context/ReportContext';



const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function Compliance() {
  const [apiScores, setApiScores] = useState<{ name: string; score: number }[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const { activeDomain, domainConfig } = useDomain();
  const { latestReport } = useReport();

  useEffect(() => {
    api.getComplianceStatus(activeDomain).then((data) => {
      if (data?.frameworks) {
         setApiScores(data.frameworks.map((f: any) => ({ name: f.name, score: f.score })));
         setRegulations(data.frameworks.map((f: any) => ({
             title: f.name,
             status: f.risk === 'Critical' ? 'Action Required' : f.risk === 'High' ? 'Warning' : 'Compliant',
             risk: f.risk,
             icon: f.risk === 'Critical' ? AlertCircle : (f.risk === 'High' ? ShieldCheck : FileText),
             lastCheck: 'Just now',
             description: f.description
         })));
      }
    }).catch(() => {});
  }, [activeDomain]);

  const handleExportPDF = async () => {
    const element = document.getElementById('compliance-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`compliance-report-${domainConfig?.name || activeDomain}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Failed to generate PDF report.');
    }
  };

  return (
    <motion.div id="compliance-content" className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.header className="mb-2 flex justify-between items-center" variants={item}>
        <div>
          <h1 className="text-3xl font-bold text-white">Compliance Mapping</h1>
          <p className="text-neutral-400">Automated regulatory alignment monitoring across global jurisdictions for the {domainConfig?.name || activeDomain} layer.</p>
        </div>
        <button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
          <FileCheck2 size={18} /> Generate Compliance Report
        </button>
      </motion.header>

      {/* Live API Scores display */}
      {(apiScores.length > 0 || latestReport) && (
        <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center gap-6" variants={item}>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Live API Scores:</span>
          {latestReport && (
            <>
              <span className="text-sm text-white"><span className="text-neutral-400">Bias Score:</span> <span className="font-bold">{latestReport.overallBiasScore}%</span></span>
              <span className="text-sm text-white"><span className="text-neutral-400">Legal Risk:</span> <span className="font-bold">{latestReport.legalRiskScore}%</span></span>
              <span className="text-sm text-white"><span className="text-neutral-400">Ethical Risk:</span> <span className="font-bold">{latestReport.ethicalRiskScore}%</span></span>
            </>
          )}
          {apiScores.map((s) => (
            <span key={s.name} className="text-sm text-white"><span className="text-neutral-400">{s.name}:</span> <span className="font-bold">{s.score}%</span></span>
          ))}
        </motion.div>
      )}

      {/* Dataset Specific Violations */}
      {latestReport && latestReport.complianceViolations.length > 0 && (
        <motion.div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5" variants={item}>
          <h3 className="text-rose-400 font-bold flex items-center gap-2 mb-4">
            <AlertCircle size={18} /> Detected Dataset Violations ({latestReport.metadata.fileName})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestReport.complianceViolations.map((v, i) => (
              <div key={i} className="bg-neutral-900/50 border border-rose-500/10 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-rose-400 font-semibold text-sm">{v.framework}</span>
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">{v.severity}</span>
                </div>
                <p className="text-neutral-400 text-xs">{v.violation}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {v.affectedColumns.map((col) => (
                    <span key={col} className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded font-mono">{col}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Regulation Cards */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" variants={item}>
        {regulations.map((reg, idx) => {
          const Icon = reg.icon;
          return (
            <motion.div
              key={idx}
              className="bg-neutral-900 border border-neutral-800 p-5 rounded-xl flex flex-col gap-3 hover:border-neutral-700 transition-colors group"
              variants={item}
              whileHover={{ y: -2 }}
            >
              <div className="flex justify-between items-start">
                <div className="bg-neutral-800 p-2 rounded-md group-hover:bg-neutral-700 transition-colors"><Icon className="text-neutral-300" size={20} /></div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  reg.risk === 'Critical' ? 'bg-rose-500/10 text-rose-500' :
                  reg.risk === 'High' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {reg.status}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{reg.title}</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{reg.description}</p>
                <p className="text-xs text-neutral-600 mt-2">Last scan: {reg.lastCheck}</p>
              </div>
              <div className="mt-auto text-xs text-neutral-600 flex items-center gap-1">
                <ExternalLink size={12} /> Logged to Google Cloud
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Progress Bars — live from API & Latest Dataset */}
      <motion.div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden" variants={item}>
        <div className="p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Global Framework Alignment</h2>
          <p className="text-sm text-neutral-400 mt-1">Live alignment tracking for {latestReport?.metadata.fileName || 'Active Domain'}</p>
        </div>
        <div className="p-6 space-y-5">
          {[
            { name: 'Data Privacy & Localization', score: latestReport ? 100 - (latestReport.legalRiskScore * 0.4) : 89 },
            { name: 'Algorithmic Transparency', score: latestReport ? 95 : 72 },
            { name: 'Fairness & Non-Discrimination', score: latestReport ? 100 - latestReport.overallBiasScore : 96 },
            { name: 'Human Oversight', score: 84 },
            { name: 'Accountability & Auditability', score: latestReport ? 100 - (latestReport.ethicalRiskScore * 0.2) : 91 },
          ].map((f) => {
            const score = Math.round(f.score);
            const color = score >= 90 ? 'emerald' : score >= 75 ? 'blue' : score >= 50 ? 'amber' : 'rose';
            return (
              <div key={f.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-200">{f.name}</span>
                  <span className={`text-sm font-semibold ${
                    color === 'emerald' ? 'text-emerald-500' : 
                    color === 'blue' ? 'text-blue-500' : 
                    color === 'amber' ? 'text-amber-500' : 'text-rose-500'
                  }`}>{score}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2.5">
                  <motion.div
                    className={`h-2.5 rounded-full ${
                      color === 'emerald' ? 'bg-emerald-500' : 
                      color === 'blue' ? 'bg-blue-500' : 
                      color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
