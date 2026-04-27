import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, BookOpen, AlertCircle, FileText, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muteVoice, setMuteVoice] = useState(false);
  const isProcessingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        if (isProcessingRef.current) return;
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send if it's a confident transcript
        handleSend(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const speak = async (text: string) => {
    if (muteVoice) return;

    try {
      // 1. Try Backend Neural Voice First (Highest Quality)
      const data = await api.voiceTTS(text);
      if (data?.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
        return;
      }
    } catch (err) {
      console.warn('Backend TTS failed, using browser fallback:', err);
    }
    
    // 2. Browser Fallback
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Find a premium voice if possible
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium'));
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const userMessage = textToSend.trim();
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

      // Trigger Voice Response
      speak(data.content.replace(/[*#]/g, ''));
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Failed to communicate with the AI Auditor. Please verify your connection and Gemini API key.'
      }]);
    } finally {
      setIsLoading(false);
      isProcessingRef.current = false;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  return (
    <motion.div className="flex flex-col h-full space-y-4 font-['Plus_Jakarta_Sans']" variants={container} initial="hidden" animate="show">
      <motion.header variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Bot className="text-white" size={32} /> AI Auditor
          {isSpeaking && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
            />
          )}
        </h1>
        <div className="flex justify-between items-center mt-2">
          <p className="text-neutral-400 tracking-tight leading-relaxed">RAG-powered conversational assistant for compliance and bias explanation.</p>
          <button 
            onClick={() => {
              setMuteVoice(!muteVoice);
              if (!muteVoice) window.speechSynthesis.cancel();
            }}
            className="p-2 text-neutral-500 hover:text-white transition-colors"
          >
            {muteVoice ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
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
              
              <div className={`max-w-[75%] rounded-2xl px-5 py-4 ${msg.role === 'user' ? 'bg-white text-black rounded-tr-sm' : 'bg-neutral-800 text-neutral-200 rounded-tl-sm border border-neutral-700'}`}>
                {msg.role === 'user' ? (
                  <p style={{ lineHeight: '1.75', letterSpacing: '0.01em', fontSize: '0.9375rem' }} className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div
                    style={{ lineHeight: '1.8', letterSpacing: '0.01em', fontSize: '0.9375rem', wordSpacing: '0.05em' }}
                    className="prose prose-invert max-w-none"
                  >
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
            <div className="flex items-center gap-1">
              <button
                onClick={toggleListening}
                className={`p-2 rounded-lg transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="mt-2 text-center flex items-center justify-center gap-1 text-[11px] text-neutral-500">
            <AlertCircle size={12} /> AI Auditor uses Gemini 2.5 and RAG. Always verify legal claims.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
