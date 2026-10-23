'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldAlert,
  CheckCircle,
  Clock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Application, PayoutBatch, ScholarshipProgram } from '@/lib/types';
import { SacSeal } from '@/components/SacSeal';

interface AdminCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: Application[];
  programs: ScholarshipProgram[];
  payoutBatches: PayoutBatch[];
  onSelectApplication?: (app: Application) => void;
}

interface CopilotMessage {
  id: string;
  sender: 'admin' | 'copilot';
  text: string;
  timestamp: string;
  quickPrompts?: string[];
  actionCard?: {
    title: string;
    details: string;
    appId?: string;
  };
}

export const AdminCopilotModal: React.FC<AdminCopilotModalProps> = ({
  isOpen,
  onClose,
  applications,
  programs,
  payoutBatches,
  onSelectApplication,
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: `Hello, ISPSO Administrator! I am your **Admin Assistant Copilot**.\n\nI monitor student applications, verify LRN records, identify high-achieving scholars, and track upcoming payout releases at the SAC Gymnasium.\n\nHow can I assist your workflow today?`,
      timestamp: 'Just now',
      quickPrompts: [
        'Who applied today and what are their qualifications?',
        'Which students need review or have discrepancies?',
        'Who are the top Dean’s List candidates?',
        'Summarize the next SAC Gym payout schedule',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || input).toLowerCase().trim();
    if (!q) return;

    const userMsg: CopilotMessage = {
      id: `admin-${Date.now()}`,
      sender: 'admin',
      text: textToSend || input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      let actionCard: CopilotMessage['actionCard'] = undefined;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (q.includes('who applied') || q.includes('applying') || q.includes('applicants')) {
        reply = `Here is a clear summary of recent applicant submissions:\n\n• **Jhon Kylho Estrabo** (BSIT 3) — Applying for **TDP-TES** with **GWA 1.38** (Pre-verified 100% ✓).\n• **Ana Marie Francisco** (BS Nursing 2) — Applying for **UniFAST TES** with **GWA 1.62** (Needs review: name spelling variant).\n• **Kristoff Tolentino** (BSBA 4) — Applying for **UniFAST TES** with **GWA 2.10** (Deficient: blurry semester sticker).\n• **Mark Villanueva** (Educ 3) — **Flagged**: Uploaded duplicate ID matching Jhon Kylho Estrabo.`;
      } else if (q.includes('review') || q.includes('discrepanc') || q.includes('fraud') || q.includes('flag')) {
        reply = `⚠️ **2 Applications require your attention:**\n\n1. **Mark Villanueva (Critical Flag):**\n   Uploaded an ID that shares the digital hash of another student (Jhon Kylho Estrabo). Name similarity is only 18%.\n   *Recommendation:* Deny application and keep on Denied List.\n\n2. **Ana Marie Francisco (Minor Variance):**\n   ID reads "ANA M. FRANCISCO" while email registration is "ANA MARIE FRANCISCO" (82% similarity). LRN is valid.\n   *Recommendation:* Safe to approve after quick visual glance.`;
      } else if (q.includes('dean') || q.includes('top') || q.includes('honor') || q.includes('academic')) {
        reply = `🏅 **Top Academic Achievers Eligible for Honor Grants:**\n\n1. **Angelica Soriano** (BSEd 2) — **GWA 1.20** (Rank 1 - Dean's List)\n2. **Maria Elena Santos** (BS Accountancy 3) — **GWA 1.25** (Rank 2)\n3. **Jhon Kylho Estrabo** (BSIT 3) — **GWA 1.38** (Rank 3 - Outstanding Standing)\n\nAll three satisfy the criteria for the **Anthonian Academic Excellence Scholarship** (₱7,500 / 100% tuition discount).`;
      } else if (q.includes('payout') || q.includes('gym') || q.includes('release') || q.includes('schedule')) {
        const nextBatch = payoutBatches[0];
        reply = `📢 **Upcoming Campus Payout Summary:**\n\n• **Program:** ${nextBatch?.programCode || 'TDP-TES'} (${nextBatch?.batchNumber || 'Batch 1'})\n• **Date & Time:** November 25, 2026 • 09:00 AM – 12:00 PM\n• **Location:** SAC Gymnasium (Counters 1 to 3)\n• **Beneficiaries:** ${nextBatch?.totalBeneficiaries || 40} students scheduled\n• **Cashier Preparation:** Cashiers will use the Rapid Counter QR Scanner. Verified students with a green QR pass can be disbursed immediately.`;
      } else {
        reply = `I can help you audit applicants, check grade eligibility, or prepare releasing schedules. You can ask me:\n• *"Who applied today?"*\n• *"Which applications have document issues?"*\n• *"Who is on the Dean's List?"*\n• *"When is the next payout at SAC Gym?"*`;
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `copilot-${Date.now()}`,
          sender: 'copilot',
          text: reply,
          timestamp: time,
          quickPrompts: [
            'Who applied today and what are their qualifications?',
            'Which students need review or have discrepancies?',
            'Who are the top Dean’s List candidates?',
            'Summarize the next SAC Gym payout schedule',
          ],
          actionCard,
        },
      ]);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex h-[82vh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-sac-maroon-800 p-4 text-white flex items-center justify-between shadow">
          <div className="flex items-center space-x-3">
            <SacSeal className="h-9 w-9 shrink-0 drop-shadow" size={36} />
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-black text-sm text-white">ISPSO Admin Copilot</h3>
                <span className="rounded-full bg-sac-gold-500/20 px-2 py-0.5 text-[9px] font-bold text-sac-gold-400 border border-sac-gold-400/30">
                  Staff AI Guide
                </span>
              </div>
              <p className="text-[10px] text-sac-maroon-200">
                Live applicant insights &amp; eligibility auditing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sac-maroon-200 hover:bg-sac-maroon-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2 max-w-[90%]">
                {msg.sender === 'copilot' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-sac-maroon-800 text-sac-gold-400 mt-1 shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    msg.sender === 'admin'
                      ? 'bg-sac-maroon-800 text-white rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-1">
                    {msg.text.split('\n\n').map((para, i) => (
                      <p key={i}>
                        {para.split('**').map((chunk, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-bold text-sac-maroon-950">
                              {chunk}
                            </strong>
                          ) : (
                            chunk
                          )
                        )}
                      </p>
                    ))}
                  </div>

                  <span className="block mt-1 text-[9px] opacity-60 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Quick Prompts */}
              {msg.quickPrompts && msg.sender === 'copilot' && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                  {msg.quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(p)}
                      className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 border border-slate-200 hover:border-sac-maroon-400 hover:text-sac-maroon-900 transition shadow-sm"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 pl-9 text-xs text-slate-500">
              <Bot className="h-3.5 w-3.5 text-sac-maroon-800 animate-pulse" />
              <span className="animate-pulse">Analyzing applicant database...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-3 bg-white">
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
              placeholder="Ask about applicants, LRN issues, GWA ranking..."
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:ring-1 focus:ring-sac-maroon-800 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sac-maroon-800 text-sac-gold-400 shadow hover:bg-sac-maroon-900 transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
