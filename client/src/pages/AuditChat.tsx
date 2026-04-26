import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, BookOpen, AlertCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api, API_BASE } from '../services/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function AuditChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am the FairAI Guardian AI Auditor. I am equipped with regulatory knowledge on the EU AI Act, GDPR, NIST RMF, and Fair Lending laws. How can I assist you with analyzing an AI decision or understanding compliance requirements today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Create a simplified history array to send to the backend
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
        content: 'Error: Failed to communicate with the AI Auditor. Please verify your connection and Gemini API key.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div className="flex flex-col h-full space-y-4 font-['Plus_Jakarta_Sans']" variants={container} initial="hidden" animate="show">
      <motion.header variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Bot className="text-white" size={32} /> AI Auditor
        </h1>
        <p className="text-neutral-400 mt-2 tracking-tight leading-relaxed">RAG-powered conversational assistant for compliance and bias explanation.</p>
      </motion.header>

      <motion.div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col" variants={item}>
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={18} />
                </div>
              )}
              
              <div className={`max-w-[75%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-white text-black rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 rounded-tl-sm border border-neutral-700'}`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed tracking-tight">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-base leading-relaxed tracking-tight max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-neutral-700">
                        <p className="text-xs text-neutral-400 font-semibold mb-2 flex items-center gap-1">
                          <BookOpen size={12} /> Retrieved Regulatory Context
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.citations.map((cite, i) => (
                            <span key={i} className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-[10px] text-neutral-300 flex items-center gap-1">
                              <FileText size={10} className="text-neutral-400" /> {cite}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-700 text-neutral-300 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={18} />
                </div>
              )}
              
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={18} />
              </div>
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about regulations, bias in hiring, disparate impact..."
              className="flex-1 bg-transparent border-none text-neutral-200 focus:outline-none py-2"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-2 text-center flex items-center justify-center gap-1 text-[11px] text-neutral-500">
            <AlertCircle size={12} /> AI Auditor uses Gemini 2.5 and RAG. Always verify legal claims.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
