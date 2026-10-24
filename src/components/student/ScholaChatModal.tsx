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
import { SacSeal } from '@/components/SacSeal';

interface ScholaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  applications: Application[];
  programs: ScholarshipProgram[];
  payoutBatches: PayoutBatch[];
  onOpenApplyTab?: () => void;
}

export const ScholaChatModal: React.FC<ScholaChatModalProps> = ({
  isOpen,
  onClose,
  student,
  applications,
  programs,
  payoutBatches,
  onOpenApplyTab,
}) => {
  const [messages, setMessages] = useState<ScholaChatMessage[]>([
    {
      id: 'welcome',
      sender: 'schola',
      text: `Hello, **${student.fullName}**. This automated guide can help you find scholarship requirements, application information, and payout schedules. Choose a topic below or type a question. For confirmation or account concerns, contact ISPSO.`,
      timestamp: 'Just now',
      suggestedPrompts: [
        'What scholarships are available in SAC?',
        'When is my scholarship payout?',
        `Am I eligible with my ${student.gwa || '1.38'} GWA?`,
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
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header with SAC Seal & Maroon/Gold Theme */}
        <div className="flex items-center justify-between bg-sac-maroon-800 px-5 py-4 text-white ">
          <div className="flex items-center space-x-3">
            <SacSeal className="h-10 w-10 shrink-0 drop-" size={40} />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base tracking-tight text-white">Scholarship guide</h3>
                <span className="rounded-full bg-sac-gold-500/20 px-2 py-0.5 text-xs font-bold text-white border border-sac-gold-400/30">
                  Automated help
                </span>
              </div>
              <p className="text-xs text-sac-maroon-200 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Student: {student.fullName} ({student.studentIdNumber})
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
              className="rounded-lg p-1.5 text-sac-maroon-200 hover:bg-sac-maroon-700 hover:text-white transition"
              title="Reset Conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              aria-label="Close scholarship guide"
              onClick={onClose}
              className="rounded-lg p-1.5 text-sac-maroon-200 hover:bg-sac-maroon-700 hover:text-white transition"
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sac-maroon-800 text-white  mt-1">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-3 text-sm leading-relaxed  ${
                    msg.sender === 'user'
                      ? 'bg-sac-maroon-800 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-1 font-sans">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? (
                            <strong key={cIdx} className="font-bold text-sac-maroon-950">
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
                          className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-sm hover:border-sac-maroon-300 transition"
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-slate-900">{card.title}</span>
                            <span className="text-sac-maroon-800 font-bold">{card.amount}</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{card.description}</p>
                          {onOpenApplyTab && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenApplyTab();
                              }}
                              className="mt-2 text-xs font-bold text-sac-maroon-800 hover:underline flex items-center gap-1"
                            >
                              <span>Apply for this grant</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-xs ${
                      msg.sender === 'user' ? 'text-sac-maroon-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>

              {/* Suggested Prompt Chips */}
              {msg.suggestedPrompts && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                  {msg.suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200  hover:border-sac-maroon-500 hover:text-sac-maroon-900 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 pl-9 text-sm text-slate-500">
              <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-sac-maroon-800 text-white">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <span className="animate-pulse font-medium">Finding scholarship information…</span>
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
              aria-label="Scholarship question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about requirements, applications, or payouts…"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-sac-maroon-800 focus:outline-none focus:ring-1 focus:ring-sac-maroon-800 font-medium"
            />
            <button
              type="submit"
              aria-label="Send question"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sac-maroon-800 text-white  hover:bg-sac-maroon-900 transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-xs text-slate-500">
            Automated guidance. Contact ISPSO to confirm requirements and schedules.
          </p>
        </div>
      </div>
    </div>
  );
};
