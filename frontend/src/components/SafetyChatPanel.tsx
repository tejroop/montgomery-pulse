import { useState, useRef, useEffect } from 'react';
import type { NeighborhoodCollection, NeighborhoodFeature } from '../types';
import { answerSafetyQuestion, getSuggestedQuestions, type ChatMessage, type SafetyChatContext } from '../safetyAI';

interface Props {
  data: NeighborhoodCollection | null;
  selectedNeighborhood: NeighborhoodFeature | null;
}

export default function SafetyChatPanel({ data, selectedNeighborhood }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: "Hi! I'm the MontgomeryPulse Safety Assistant. I can explain any neighborhood's safety rating, identify Safety Deserts, and help you understand community safety data. Click a neighborhood on the map and ask me about it, or try a suggested question below.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx: SafetyChatContext = { data, selectedNeighborhood };
  const suggestions = getSuggestedQuestions(ctx);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // When selected neighborhood changes, add context
  useEffect(() => {
    if (selectedNeighborhood && isOpen) {
      const p = selectedNeighborhood.properties;
      const contextMsg: ChatMessage = {
        role: 'assistant',
        text: `You've selected "${p.name}" (${p.composite_score.toFixed(0)}/100, ${p.trend} trend${p.is_safety_desert ? ', SAFETY DESERT' : ''}). Ask me anything — why it's rated this way, what actions are recommended, or about emergency access.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, contextMsg]);
    }
  }, [selectedNeighborhood?.properties.id]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = answerSafetyQuestion(text, ctx);
      setMessages(prev => [...prev, { role: 'assistant', text: answer, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 400 + Math.random() * 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Collapsed — floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        style={{ zIndex: 1001 }}
        aria-label="Open Safety Assistant"
      >
        <span className="text-white text-2xl">🧠</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full text-[8px] font-bold text-slate-900 flex items-center justify-center">AI</span>
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-6 right-6 w-[380px] h-[520px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden slide-in-right"
      style={{ zIndex: 1001 }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <div>
            <h3 className="text-sm font-bold text-white">Safety Assistant</h3>
            <p className="text-[10px] text-emerald-100/80">Explainable AI · MontgomeryPulse</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl rounded-bl-sm border border-slate-700 text-sm flex items-center gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 hover:bg-emerald-500/20 transition-colors truncate max-w-full"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-700 flex gap-2 flex-shrink-0 bg-slate-800/50">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any neighborhood..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isTyping}
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
