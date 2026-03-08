import { useState, useRef, useEffect } from 'react';
import type { NeighborhoodCollection, NeighborhoodFeature } from '../types';
import {
  answerSafetyQuestion,
  getSuggestedQuestions,
  type ChatMessage,
  type SafetyChatContext,
} from '../safetyAI';
import { getScoreColor, getRiskLabel, getTrendIcon, getTrendColor } from '../utils';

interface Props {
  data: NeighborhoodCollection | null;
  onNavigateToMap: (feature?: NeighborhoodFeature) => void;
}

export default function SafetyAssistantPage({ data, onNavigateToMap }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodFeature | null>(null);
  const [mobileTab, setMobileTab] = useState<'chat' | 'browse'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx: SafetyChatContext = { data, selectedNeighborhood };
  const suggestions = getSuggestedQuestions(ctx);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim(), timestamp: Date.now() }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = answerSafetyQuestion(text, ctx);
      setMessages(prev => [...prev, { role: 'assistant', text: answer, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 500 + Math.random() * 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Sidebar data
  const deserts = data?.features
    .filter(f => f.properties.is_safety_desert)
    .sort((a, b) => b.properties.composite_score - a.properties.composite_score)
    .slice(0, 10) ?? [];

  const stats = data ? {
    total: data.features.length,
    deserts: data.features.filter(f => f.properties.is_safety_desert).length,
    critical: data.features.filter(f => f.properties.composite_score >= 65).length,
    avg: (data.features.reduce((s, f) => s + f.properties.composite_score, 0) / data.features.length).toFixed(1),
  } : null;

  return (
    <div className="w-full flex flex-col bg-slate-900" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <span className="text-base md:text-xl">🧠</span>
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold text-white">
              Safety <span className="text-emerald-400">Assistant</span>
            </h1>
            <p className="text-[10px] md:text-[11px] text-slate-400 hidden md:block">Explainable AI for Community Safety</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToMap()}
          className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-xs md:text-sm text-slate-200 font-medium"
        >
          <span>🗺️</span> <span className="hidden md:inline">Back to</span> Map
        </button>
      </div>

      {/* Mobile tab switcher */}
      <div className="flex md:hidden bg-slate-800/80 border-b border-slate-700 flex-shrink-0">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${mobileTab === 'chat' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
        >
          🧠 Chat
        </button>
        <button
          onClick={() => setMobileTab('browse')}
          className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${mobileTab === 'browse' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}
        >
          ⚠️ Safety Deserts
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {/* Sidebar — Neighborhood browser (desktop always, mobile when browsing) */}
        <div className={`${mobileTab === 'browse' ? 'flex' : 'hidden'} md:flex w-full md:w-[300px] border-r border-slate-700 bg-slate-800/50 flex-col flex-shrink-0`}>
          {/* Stats */}
          {stats && (
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City Overview</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-white">{stats.total}</div>
                  <div className="text-[10px] text-slate-500">Neighborhoods</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
                  <div className="text-lg font-bold text-red-400">{stats.deserts}</div>
                  <div className="text-[10px] text-red-400/70">Safety Deserts</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-amber-400">{stats.avg}</div>
                  <div className="text-[10px] text-slate-500">Avg Score</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-red-400">{stats.critical}</div>
                  <div className="text-[10px] text-slate-500">Critical</div>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 py-2 border-b border-slate-700">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Safety Deserts — Click to Explore
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {deserts.map(feature => {
              const p = feature.properties;
              const isActive = selectedNeighborhood?.properties.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedNeighborhood(isActive ? null : feature);
                    if (!isActive) {
                      handleSend(`Why is ${p.name} rated this way?`);
                      setMobileTab('chat');
                    }
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800 transition-colors hover:bg-slate-800 ${
                    isActive ? 'bg-slate-800 border-l-2 border-l-emerald-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200 truncate">{p.name}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded ml-2 flex-shrink-0"
                      style={{ color: getScoreColor(p.composite_score), backgroundColor: getScoreColor(p.composite_score) + '15' }}
                    >
                      {p.composite_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>{getRiskLabel(p.composite_score)}</span>
                    <span style={{ color: getTrendColor(p.trend) }}>{getTrendIcon(p.trend)} {p.trend}</span>
                    {p.is_safety_desert && (
                      <span className="text-red-400 font-semibold">DESERT</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* View on map */}
          {selectedNeighborhood && (
            <div className="p-3 border-t border-slate-700">
              <button
                onClick={() => onNavigateToMap(selectedNeighborhood)}
                className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
              >
                🗺️ View on Map
              </button>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} md:flex flex-1 flex-col`} style={{ minHeight: 0 }}>
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8 pt-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🧠</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    What would you like to know about Montgomery's safety?
                  </h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    I analyze 19 open datasets covering 311 requests, emergency coverage, code violations, and community resources. Every answer traces to real data.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="text-left p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                          <span className="text-emerald-400 text-sm">{['🏙️', '⚠️', '✅', '🚨', '⚙️', '👥'][i] ?? '💡'}</span>
                        </div>
                        <span className="text-sm text-slate-300 leading-snug">{q}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg flex-shrink-0">🔍</span>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-400 mb-1">Explainable by Design</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Every score, rating, and recommendation traces back to specific data points from Montgomery's open datasets.
                        No black boxes — ask "why?" about any neighborhood and get a transparent breakdown.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      }`}>
                        {msg.role === 'user' ? (
                          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <span className="text-sm">🧠</span>
                        )}
                      </div>
                      <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-sm'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="text-sm">🧠</span>
                      </div>
                      <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-slate-800 border border-slate-700 text-slate-400">
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>·</span>
                          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>·</span>
                          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>·</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 md:px-8 py-3 md:py-4 border-t border-slate-700 bg-slate-800/50 flex-shrink-0">
            <div className="max-w-2xl mx-auto flex gap-2 md:gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about safety..."
                className="flex-1 px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-slate-800 border border-slate-600 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="px-4 md:px-5 py-2.5 md:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 transition-all flex items-center gap-1.5 md:gap-2"
              >
                <span className="hidden md:inline">Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="max-w-2xl mx-auto mt-1.5 md:mt-2 text-center hidden md:block">
              <span className="text-[10px] text-slate-500">
                Explainable AI · Every answer traces to Montgomery open data · No black boxes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
