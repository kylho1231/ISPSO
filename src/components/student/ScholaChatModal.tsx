'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { StudentProfile, ScholarshipProgram, Application, PayoutBatch, ScholaChatMessage } from '@/lib/types';
import { generateScholaResponse } from '@/lib/scholaBrain';

interface ScholaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  applications: Application[];
  programs: ScholarshipProgram[];
  payoutBatches: PayoutBatch[];
  onOpenApplyTab?: () => void;
  onOpenPassTab?: () => void;
}

export const ScholaChatModal: React.FC<ScholaChatModalProps> = ({
  isOpen,
  onClose,
  student,
  applications,
  programs,
  payoutBatches,
  onOpenApplyTab,
  onOpenPassTab,
}) => {
  const [messages, setMessages] = useState<ScholaChatMessage[]>([
    {
      id: 'welcome',
      sender: 'schola',
      text: `Kumusta, **${student.fullName}**! I am **Schola**, your official AI Scholar Companion for St. Anthony’s College ISPSO.

I am connected to your student profile (Student ID: \`${student.studentIdNumber}\` • LRN: \`${student.lrn}\`) and have complete real-time information on all SAC scholarships and your **TDP-TES** payout.

How can I help you today? You can choose a quick topic below or type your question:`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'What scholarships are available in SAC?',
        'When is my scholarship payout?',
        'Am I eligible with my 1.45 GWA?',
        'Show my student profile and LRN',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ScholaChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateScholaResponse(query, {
        student,
        applications,
        programs,
        payoutBatches,
      });
      setIsTyping(false);
      setMessages((prev) => [...prev, response]);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-anthonian-900 via-anthonian-800 to-anthonian-950 px-5 py-4 text-white shadow">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-400 text-anthonian-950 shadow-md">
              <Bot className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-base tracking-tight">Schola AI</h3>
                <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-gold-300 border border-gold-400/30">
                  SAC Scholar Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Synchronized with {student.fullName} ({student.studentIdNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'reset',
                    sender: 'schola',
                    text: `Conversation restarted. Hello **${student.fullName}**, what would you like to know about SAC scholarships or your payout?`,
                    timestamp: 'Just now',
                    suggestedPrompts: [
                      'What scholarships are available in SAC?',
                      'When is my scholarship payout?',
                      'Which scholarships match my GWA?',
                    ],
                  },
                ]);
              }}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
              title="Reset Conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[85%]">
                {msg.sender === 'schola' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-anthonian-800 text-gold-400 shadow-sm mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-anthonian-800 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  {/* Markdown format renderer simulation */}
                  <div className="whitespace-pre-wrap space-y-1 font-sans">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? (
                            <strong key={cIdx} className="font-bold text-anthonian-900">
                              {chunk}
                            </strong>
                          ) : (
                            chunk
                          )
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Optional Scholarship Cards in Message */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                      {msg.cards.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 hover:bg-white transition flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-anthonian-700 bg-anthonian-100 px-1.5 py-0.5 rounded mr-1.5">
                              {card.badge}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">{card.title}</span>
                            <p className="text-[10px] text-slate-500 mt-0.5">{card.description}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-bold text-emerald-600 text-xs block">
                              {card.amount}
                            </span>
                            <button
                              onClick={() => {
                                onClose();
                                if (onOpenApplyTab) onOpenApplyTab();
                              }}
                              className="text-[10px] font-bold text-anthonian-700 hover:underline flex items-center gap-0.5 justify-end"
                            >
                              <span>Apply</span>
                              <ChevronRight className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <span
                    className={`mt-1.5 block text-[10px] font-medium text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Suggested Prompts Pills */}
              {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-9">
                  {msg.suggestedPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSend(prompt)}
                      className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-anthonian-800 border border-slate-200 shadow-sm hover:border-anthonian-400 hover:bg-anthonian-50 transition"
                    >
                      {prompt} &rarr;
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 pl-9">
              <div className="flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-anthonian-600 animate-bounce"></div>
                <div
                  className="h-2 w-2 rounded-full bg-anthonian-600 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="h-2 w-2 rounded-full bg-anthonian-600 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
              <span className="text-[11px]">Schola is checking SAC scholarship records...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Schola about available scholarships, payout schedules, or your eligibility..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-anthonian-800 focus:border-transparent placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition shadow-sm ${
                input.trim()
                  ? 'bg-anthonian-800 text-white hover:bg-anthonian-900'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            Schola AI is tailored for St. Anthony’s College Anthonian Scholars. Always verify physical documents with ISPSO.
          </div>
        </div>
      </div>
    </div>
  );
};
