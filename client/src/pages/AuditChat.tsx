import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, FileText, Settings, ShieldCheck, Activity, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { API_BASE } from '../services/api';
import SystemStatusPanel from '../components/Audit/SystemStatusPanel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
}

export default function AuditChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'System initialized. I am the **FairAI Auditor**. I monitor all live decision logs and regulatory frameworks. How can I assist with your compliance audit today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.content,
        citations: data.citations
      }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Failed to connect to Audit Engine.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!chatContainerRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      // Temporarily expand the container to capture all messages
      const element = chatContainerRef.current;
      const originalHeight = element.style.height;
      const originalOverflow = element.style.overflow;
      
      element.style.height = 'auto';
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      
      // Restore styles
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FairAI-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Premium Header */}
      <header className="h-16 border-b border-neutral-900 px-6 flex items-center justify-between shrink-0 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded">
            <Bot size={18} className="text-black" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black tracking-[0.2em] uppercase">Compliance Auditor</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-neutral-500 tracking-widest uppercase">Live System Access Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> SOC2 Compliant</span>
            <span className="flex items-center gap-1.5"><Activity size={12} /> 12ms Latency</span>
          </div>
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <Activity size={12} className="animate-spin" /> Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download size={12} /> Export Report
              </span>
            )}
          </button>
          <button className="p-2 hover:bg-neutral-900 rounded-lg transition-colors">
            <Settings size={18} className="text-neutral-400" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Audit Console */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Audit Logs / Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] group ${m.role === 'user' ? 'w-full flex flex-col items-end' : ''}`}>
                  <div className={`
                    p-5 rounded-sm transition-all duration-300
                    ${m.role === 'user' 
                      ? 'bg-white text-black font-medium border border-white' 
                      : 'bg-neutral-950 border border-neutral-900 text-neutral-200'
                    }
                  `}>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    
                    {m.citations && m.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-neutral-900">
                        <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <BookOpen size={10} /> Reference Sources
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((c, j) => (
                            <span key={j} className="flex items-center gap-1.5 px-2 py-1 bg-black border border-neutral-800 text-[10px] text-neutral-400">
                              <FileText size={10} /> {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 px-1 flex items-center gap-2">
                    <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">
                      {m.role === 'user' ? 'Auditor Request' : 'System Response'}
                    </span>
                    <span className="text-[8px] text-neutral-800">•</span>
                    <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-950 border border-neutral-900 p-5 rounded-sm flex items-center gap-4">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white animate-bounce" style={{ animationDelay: '200ms' }} />
                    <div className="w-1.5 h-1.5 bg-white animate-bounce" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Analyzing Records...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Console */}
          <div className="p-6 border-t border-neutral-900 bg-black">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative max-w-5xl mx-auto w-full"
            >
              <div className="relative group">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Query system logs or specific regulations..."
                  className="w-full bg-neutral-950 border border-neutral-900 rounded-none py-5 pl-6 pr-20 text-sm text-white focus:outline-none focus:border-white transition-all placeholder:text-neutral-700"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-white text-black p-2.5 rounded-none hover:bg-neutral-200 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.1em]">Shift + Enter for new line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-[0.1em]">Quantum Guard v4.2</span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Audit Sidebar */}
        <div className="w-[400px] border-l border-neutral-900 hidden 2xl:block overflow-y-auto custom-scrollbar bg-[#020202]">
          <div className="p-8 space-y-10">
            <SystemStatusPanel />
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Compliance Presets</h3>
                <div className="h-[1px] flex-1 bg-neutral-900 ml-4" />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: 'Check Bias in Hiring Flow', sub: 'GDPR / Fair Housing' },
                  { label: 'Explain Recent Flagged Decision', sub: 'Internal Trace' },
                  { label: 'Audit US Lending Compliance', sub: 'ECOA / Fair Lending' },
                  { label: 'Verify NIST AI RMF Adherence', sub: 'Safety Framework' }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setInput(item.label)}
                    className="text-left group p-4 border border-neutral-900 hover:border-white transition-all duration-300 bg-black"
                  >
                    <div className="text-[11px] font-bold text-neutral-400 group-hover:text-white transition-colors">{item.label}</div>
                    <div className="text-[9px] font-medium text-neutral-600 mt-1 uppercase tracking-tighter">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
