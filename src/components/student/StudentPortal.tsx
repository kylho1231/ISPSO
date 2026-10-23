'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ChevronRight,
  Sparkles,
  Smartphone,
  ExternalLink,
  Info,
  Check,
  AlertTriangle,
  RotateCw,
  MessageSquare,
  Bot,
  Send,
  Phone,
  Award,
} from 'lucide-react';
import {
  StudentProfile,
  Application,
  ScholarshipProgram,
  Announcement,
  PayoutBatch,
  SmsMessage,
} from '@/lib/types';
import { performDocumentVerification } from '@/lib/verification';
import { ScholaChatModal } from './ScholaChatModal';
import { SacSeal } from '@/components/SacSeal';

interface StudentPortalProps {
  student: StudentProfile;
  applications: Application[];
  programs: ScholarshipProgram[];
  announcements: Announcement[];
  payoutBatches: PayoutBatch[];
  smsMessages?: SmsMessage[];
  onSubmitApplication: (newApp: Partial<Application>) => void;
  onSendStudentSms?: (text: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  applications,
  programs,
  announcements,
  payoutBatches,
  smsMessages = [],
  onSubmitApplication,
  onSendStudentSms,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'apply' | 'pass' | 'notices' | 'sms'>('home');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isScholaOpen, setIsScholaOpen] = useState(false);
  const [replySmsText, setReplySmsText] = useState('');

  // Apply Modal state
  const [selectedProgram, setSelectedProgram] = useState<ScholarshipProgram | null>(null);
  const [gwa, setGwa] = useState('1.38');
  const [income, setIncome] = useState('180000');
  const [uploadedIdName, setUploadedIdName] = useState(student.fullName || 'Jhon Kylho Estrabo');
  const [uploadedLrn, setUploadedLrn] = useState(student.lrn || '115201140091');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [preVerifyResult, setPreVerifyResult] = useState<any>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Active student application
  const myApp = applications.find((a) => a.studentId === student.id) || applications[0];

  // Matching payout batch for this student's approved grant
  const myPayoutBatch = payoutBatches.find((b) => b.programCode === myApp?.program.code) || payoutBatches[0];

  const handleSimulateUpload = (fileName: string) => {
    setUploadFileName(fileName);
    setIsVerifying(true);
    setPreVerifyResult(null);

    setTimeout(() => {
      const res = performDocumentVerification({
        registeredName: student.fullName,
        registeredLrn: student.lrn,
        extractedText: `ST. ANTHONY COLLEGE SAN JOSE ANTIQUE\nNAME: ${uploadedIdName}\nLRN: ${uploadedLrn}\nID: ${student.studentIdNumber}\nCOURSE: ${student.course}`,
        extractedName: uploadedIdName,
        extractedLrn: uploadedLrn,
        fileHash: `hash-${Date.now()}`,
      });
      setIsVerifying(false);
      setPreVerifyResult(res);
    }, 700);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram || !preVerifyResult) return;

    onSubmitApplication({
      studentId: student.id,
      student,
      programId: selectedProgram.id,
      program: selectedProgram,
      status: preVerifyResult.status === 'VERIFIED' ? 'APPROVED' : 'NEEDS_MANUAL_REVIEW',
      gwa: parseFloat(gwa),
      annualFamilyIncome: parseFloat(income),
      submittedAt: new Date().toISOString(),
      documents: [
        {
          id: `doc-${Date.now()}`,
          type: 'STUDENT_ID',
          fileName: uploadFileName || 'JhonEstrabo_ID_Validated.jpg',
          fileUrl: '/uploads/sample_id.jpg',
          fileHash: `hash-${Date.now()}`,
          uploadedAt: new Date().toISOString(),
        },
      ],
      verification: preVerifyResult,
    });

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setSelectedProgram(null);
      setPreVerifyResult(null);
      setUploadFileName('');
      setActiveTab('home');
    }, 1500);
  };

  const content = (
    <div className="space-y-5 pb-20">
      {/* ============================================================== */}
      {/* 1. STUDENT IDENTITY CARD (Deep Maroon & Official SAC Seal)     */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-sac-maroon-800 p-5 text-white shadow-xl border border-sac-maroon-700 relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-sac-gold-500/10 rounded-full blur-2xl" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-start space-x-3.5">
            <SacSeal className="h-12 w-12 drop-shadow shrink-0" size={48} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded-full bg-sac-gold-500/20 px-2.5 py-0.5 text-[10px] font-bold text-sac-gold-300 border border-sac-gold-400/30">
                  Registered Anthonian
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> @sac.edu.ph Verified
                </span>
              </div>
              <h1 className="mt-1 text-xl font-black tracking-tight text-white">{student.fullName}</h1>
              <p className="text-xs text-sac-maroon-200 font-medium">
                {student.course} • Year {student.yearLevel}
              </p>
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sac-gold-500 font-black text-sac-maroon-950 text-sm shadow">
            JE
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-sac-maroon-700/80 pt-3 font-mono text-xs relative z-10">
          <div>
            <span className="text-[9px] text-sac-maroon-300 uppercase tracking-wider block">
              Student ID No.
            </span>
            <span className="font-bold text-white">{student.studentIdNumber}</span>
          </div>
          <div>
            <span className="text-[9px] text-sac-maroon-300 uppercase tracking-wider block">
              DepEd LRN (12-Digit)
            </span>
            <span className="font-bold text-sac-gold-400">{student.lrn}</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. WELCOME HERO BANNER (From User's UI Screenshot 222357.png)  */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-sac-maroon-900 via-sac-maroon-800 to-sac-maroon-900 p-6 text-white shadow-lg border border-sac-maroon-700 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-sac-gold-400 bg-sac-maroon-950/70 px-2.5 py-1 rounded-full border border-sac-gold-400/30 mb-2">
              St. Anthony’s College ISPSO Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Welcome to your Scholarship Portal!
            </h2>
            <p className="mt-1.5 text-xs text-sac-maroon-100 max-w-lg leading-relaxed">
              Discover financial aid opportunities, apply seamlessly with automated document verification, and check your releasing schedule at the SAC Gymnasium.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('apply')}
                className="rounded-xl bg-sac-gold-500 px-4 py-2 text-xs font-black text-sac-maroon-950 shadow hover:bg-sac-gold-400 transition"
              >
                Browse Grants &rarr;
              </button>
              <button
                onClick={() => setActiveTab('pass')}
                className="rounded-xl bg-sac-maroon-950/80 px-4 py-2 text-xs font-bold text-white border border-sac-maroon-600 hover:bg-sac-maroon-950 transition"
              >
                View My Status &amp; QR Pass
              </button>
              <button
                onClick={() => setIsScholaOpen(true)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-sac-gold-300 border border-white/20 hover:bg-white/20 transition flex items-center space-x-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-sac-gold-400" />
                <span>Ask Schola AI</span>
              </button>
            </div>
          </div>
          <SacSeal className="hidden sm:block h-24 w-24 shrink-0 drop-shadow-xl opacity-95" size={96} />
        </div>
      </div>

      {/* QUICK SUBNAV TABS */}
      <div className="flex rounded-2xl bg-slate-200/80 p-1 text-xs font-bold shadow-inner">
        {[
          { id: 'home', label: 'My Grant' },
          { id: 'pass', label: 'QR Pass' },
          { id: 'apply', label: 'Apply' },
          { id: 'sms', label: 'ISPSO SMS' },
          { id: 'notices', label: 'Notices' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 rounded-xl py-2.5 transition text-center ${
              activeTab === tab.id
                ? 'bg-sac-maroon-800 text-sac-gold-400 font-black shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* SUBTAB 1: MY ACTIVE SCHOLARSHIP & PAYOUT TRACKER               */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          {/* Ask Schola AI Companion Card */}
          <div className="rounded-2xl border border-sac-maroon-200 bg-gradient-to-r from-sac-maroon-50 via-white to-sac-gold-50/50 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sac-maroon-800 text-sac-gold-400 shadow-md">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-sm text-sac-maroon-950">Ask Schola AI</h3>
                    <span className="rounded-full bg-sac-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-sac-gold-800 border border-sac-gold-400/40">
                      Scholar Companion
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-snug">
                    I know your academic profile (GWA: 1.38, BSIT 3) and all 8 available scholarships at St. Anthony’s College!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScholaOpen(true)}
                className="shrink-0 rounded-xl bg-sac-maroon-800 px-3.5 py-2 text-xs font-bold text-sac-gold-400 shadow hover:bg-sac-maroon-900 transition flex items-center space-x-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Chat</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsScholaOpen(true)}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-sac-maroon-400 transition"
              >
                What scholarships are available in SAC? &rarr;
              </button>
              <button
                onClick={() => setIsScholaOpen(true)}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-sac-maroon-400 transition"
              >
                When is my scholarship payout? &rarr;
              </button>
            </div>
          </div>

          {/* Active Grant Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-md bg-sac-maroon-100 px-2 py-0.5 text-[11px] font-bold text-sac-maroon-800">
                  {myApp?.program.code || 'TDP-TES'}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900">
                  {myApp?.program.name || 'Tulong Dunong Program (TDP-TES)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Provider: {myApp?.program.provider || 'CHED / UniFAST'} • AY 2026-2027 1st Sem
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                ● {myApp?.status || 'APPROVED'}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Stipend Subsidy:</span>
                <span className="text-sm font-black text-slate-900">
                  ₱{(myApp?.program.grantAmount || 7500).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between items-center">
                <span className="text-slate-500">Validation Status:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> 12-Digit LRN &amp; ID Verified
                </span>
              </div>
            </div>

            {/* Next Payout Alert Box (Replaces Facebook Posts) */}
            <div className="mt-4 rounded-2xl bg-sac-gold-50/80 p-4 border border-sac-gold-300">
              <div className="flex items-start space-x-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sac-gold-500 text-sac-maroon-950 font-bold">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-sac-maroon-950">
                      Confirmed Campus Payout Release
                    </h4>
                    <span className="rounded-full bg-sac-gold-200 px-2 py-0.5 text-[10px] font-bold text-sac-gold-900">
                      Batch 1
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    November 25, 2026 (Friday) • 09:00 AM – 12:00 PM
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Venue: <span className="font-bold text-slate-800">SAC Gymnasium (Releasing Counters 1-3)</span>
                  </p>
                  <div className="mt-2 text-[11px] text-slate-600">
                    Requirements: Validated SAC Student ID &amp; Digital QR Pass.
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-sac-gold-200 flex justify-end">
                <button
                  onClick={() => setActiveTab('pass')}
                  className="rounded-xl bg-sac-maroon-800 px-3.5 py-1.5 text-xs font-bold text-sac-gold-400 hover:bg-sac-maroon-900 transition flex items-center space-x-1.5 shadow"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Show QR Claim Pass &rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Scholarships Explorer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Explore St. Anthony’s College Scholarships (8 Available)
              </h3>
              <button
                onClick={() => setActiveTab('apply')}
                className="text-xs font-bold text-sac-maroon-800 hover:underline"
              >
                View Catalog &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {programs.slice(0, 4).map((prog) => (
                <div
                  key={prog.id}
                  onClick={() => {
                    setSelectedProgram(prog);
                    setActiveTab('apply');
                  }}
                  className="rounded-xl border border-slate-200 p-3 hover:border-sac-maroon-400 hover:bg-sac-maroon-50/20 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-sac-maroon-800 bg-sac-maroon-100 px-1.5 py-0.5 rounded">
                      {prog.code}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      ₱{prog.grantAmount.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="mt-1.5 font-bold text-xs text-slate-900 line-clamp-1">{prog.name}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{prog.provider}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: DIGITAL QR CLAIM PASS                                */}
      {/* ============================================================== */}
      {activeTab === 'pass' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> OFFICIAL RELEASING PASS ACTIVE
              </span>
              <h3 className="mt-2 text-lg font-black text-slate-900">
                St. Anthony’s College ISPSO
              </h3>
              <p className="text-xs text-slate-500">
                Present this QR code to the cashier at SAC Gymnasium to claim your stipend.
              </p>
            </div>

            {/* Dynamic QR Code Mockup */}
            <div className="mx-auto flex h-52 w-52 flex-col items-center justify-center rounded-2xl bg-white p-3 border-4 border-sac-maroon-800 shadow-md relative">
              <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2 bg-slate-950 rounded-xl">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      (i * 7) % 3 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-white p-1 shadow flex items-center justify-center">
                  <SacSeal className="h-8 w-8" size={32} />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-700 space-y-1 text-left border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">STUDENT:</span>
                <span className="font-bold text-slate-900">{student.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID NUMBER:</span>
                <span className="font-bold text-slate-900">{student.studentIdNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DEPED LRN:</span>
                <span className="font-bold text-sac-maroon-800">{student.lrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PROGRAM:</span>
                <span className="font-bold">{myApp?.program.code || 'TDP-TES'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STIPEND:</span>
                <span className="font-bold text-emerald-600">₱{(myApp?.program.grantAmount || 7500).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Anti-Screenshot Security Hash: <code className="font-mono">SAC-SEC-2026-482910</code> • Verified Real-time
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 3: APPLY FOR SCHOLARSHIP                                */}
      {/* ============================================================== */}
      {activeTab === 'apply' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Available Scholarships (8)</h3>
              <p className="text-xs text-slate-500">
                Select a program to apply with real-time AI document verification.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {programs.map((prog) => (
              <div
                key={prog.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-sac-maroon-400 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md bg-sac-maroon-100 px-2 py-0.5 text-xs font-bold text-sac-maroon-800">
                      {prog.code}
                    </span>
                    <h4 className="mt-1.5 text-base font-bold text-slate-900">{prog.name}</h4>
                    <p className="text-xs text-sac-maroon-700 font-medium">{prog.provider}</p>
                  </div>
                  <span className="text-base font-black text-slate-900">
                    ₱{prog.grantAmount.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{prog.description}</p>

                <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-700">Eligibility Criteria:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    {prog.eligibilityCriteria.slice(0, 2).map((crit, idx) => (
                      <li key={idx}>{crit}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Deadline: <strong className="text-rose-600">{prog.deadline}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedProgram(prog)}
                    className="rounded-xl bg-sac-maroon-800 px-4 py-2 text-xs font-bold text-sac-gold-400 hover:bg-sac-maroon-900 shadow transition"
                  >
                    Apply Now &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 4: ISPSO DIRECT MOBILE SMS TEXT THREAD                  */}
      {/* ============================================================== */}
      {activeTab === 'sms' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sac-maroon-800 text-sac-gold-400">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">ISPSO Staff Mobile SMS Desk</h3>
                  <p className="text-[10px] text-slate-500">Hotline: 0906-451-6128 • St. Anthony’s College</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Connected
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-1">
              {smsMessages
                .filter(
                  (s) => s.studentId === student.id || s.mobileNumber === student.contactNumber
                )
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.direction === 'INBOUND' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-2xl p-3 text-xs shadow-sm ${
                        msg.direction === 'INBOUND'
                          ? 'bg-sac-maroon-800 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {msg.sender} • {msg.timestamp.slice(11, 16)}
                    </div>
                  </div>
                ))}

              {smsMessages.filter(
                (s) => s.studentId === student.id || s.mobileNumber === student.contactNumber
              ).length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No SMS text messages yet. Direct updates from ISPSO staff will appear here.
                </div>
              )}
            </div>

            {/* Direct Reply Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!replySmsText.trim()) return;
                if (onSendStudentSms) {
                  onSendStudentSms(replySmsText);
                }
                setReplySmsText('');
              }}
              className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-3"
            >
              <input
                type="text"
                value={replySmsText}
                onChange={(e) => setReplySmsText(e.target.value)}
                placeholder="Reply via SMS to ISPSO (e.g. Confirmed, I will be at the Gym at 9am)..."
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sac-maroon-800"
              />
              <button
                type="submit"
                disabled={!replySmsText.trim()}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-sm ${
                  replySmsText.trim()
                    ? 'bg-sac-maroon-800 text-sac-gold-400 hover:bg-sac-maroon-900'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 5: ANNOUNCEMENTS & OFFICIAL NOTICES                     */}
      {/* ============================================================== */}
      {activeTab === 'notices' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ISPSO Official Notices (Replaces Facebook Feed)
            </h3>
            <span className="text-[11px] text-slate-400">{announcements.length} Total</span>
          </div>

          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                    ann.priority === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-700'
                      : ann.priority === 'HIGH'
                      ? 'bg-sac-gold-100 text-sac-gold-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ann.priority} PRIORITY
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {ann.publishedAt.slice(0, 10)}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 leading-snug">{ann.title}</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">{ann.content}</p>
              <p className="text-[10px] text-slate-400 font-medium">By: {ann.author}</p>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* APPLICATION WIZARD MODAL (Fixing "Scan Failed" Error)          */}
      {/* ============================================================== */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Apply for {selectedProgram.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Grant Amount: <strong className="text-sac-maroon-800">₱{selectedProgram.grantAmount.toLocaleString()}</strong> ({selectedProgram.frequency})
                </p>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            {submittedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Application Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Your identity and 12-digit LRN have been verified. Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">General Weighted Average (GWA)</label>
                    <input
                      type="text"
                      value={gwa}
                      onChange={(e) => setGwa(e.target.value)}
                      placeholder="e.g. 1.38"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 focus:ring-sac-maroon-800 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Annual Family Income (₱)</label>
                    <input
                      type="text"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="e.g. 180000"
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 focus:ring-sac-maroon-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Simulated Document Upload Area */}
                <div className="rounded-2xl border-2 border-dashed border-sac-maroon-300 bg-sac-maroon-50/30 p-4 text-center">
                  <Upload className="mx-auto h-7 w-7 text-sac-maroon-800" />
                  <p className="mt-1 font-bold text-slate-900">Upload Validated SAC Student ID &amp; COR</p>
                  <p className="text-[11px] text-slate-500">
                    The AI Verification Engine will inspect your 12-digit DepEd LRN and name similarity.
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedIdName(student.fullName);
                        setUploadedLrn(student.lrn);
                        handleSimulateUpload('JhonEstrabo_SAC_ID.jpg');
                      }}
                      className="rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-slate-800 border border-slate-300 shadow-sm hover:bg-slate-50"
                    >
                      Upload Valid My ID (100% Match)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedIdName('Eduardo Ramos');
                        setUploadedLrn('115201189912');
                        handleSimulateUpload('Other_Student_ID.jpg');
                      }}
                      className="rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 border border-rose-200 shadow-sm hover:bg-rose-100"
                    >
                      Simulate Mismatched ID (Fraud Test)
                    </button>
                  </div>
                </div>

                {/* Real-time Verification Feedback (Fixed "Scan Failed") */}
                {isVerifying && (
                  <div className="flex items-center justify-center space-x-2 py-3 text-xs text-sac-maroon-800 font-bold">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>AI Engine inspecting OCR text &amp; DepEd 12-digit LRN checksum...</span>
                  </div>
                )}

                {preVerifyResult && (
                  <div
                    className={`rounded-2xl p-4 border ${
                      preVerifyResult.status === 'VERIFIED'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {preVerifyResult.status === 'VERIFIED' ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-rose-600" />
                        )}
                        <span>{preVerifyResult.status === 'VERIFIED' ? 'AI VERDICT: VERIFIED (Match ✓)' : preVerifyResult.status.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="font-mono">{preVerifyResult.nameSimilarityScore}% Name Match</span>
                    </div>

                    <div className="mt-2 text-[11px] space-y-0.5">
                      <div>
                        <span className="text-slate-500">Detected Name on ID:</span>{' '}
                        <span className="font-bold">{preVerifyResult.extractedName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Detected 12-Digit LRN:</span>{' '}
                        <span className="font-mono font-bold">{preVerifyResult.extractedLrn}</span>
                      </div>
                    </div>

                    {preVerifyResult.issues.length > 0 && (
                      <p className="mt-2 text-[11px] text-rose-700 font-semibold border-t border-rose-200 pt-1.5">
                        {preVerifyResult.issues[0]}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProgram(null);
                      setPreVerifyResult(null);
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!preVerifyResult || preVerifyResult.status === 'NAME_MISMATCH'}
                    className={`rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow ${
                      !preVerifyResult || preVerifyResult.status === 'NAME_MISMATCH'
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-sac-maroon-800 text-sac-gold-400 hover:bg-sac-maroon-900'
                    }`}
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Device Viewport Toggle (Phone Mockup vs Full Screen) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-4 w-4 text-sac-maroon-800" />
          <span className="text-xs font-bold text-slate-700">
            Student PWA Experience (@sac.edu.ph)
          </span>
        </div>
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          {isMobileFrame ? 'Expand Full Screen' : 'View Mobile Phone Mockup'}
        </button>
      </div>

      {isMobileFrame ? (
        <div className="mx-auto max-w-sm rounded-[44px] border-[10px] border-slate-800 bg-slate-100 p-4 shadow-2xl overflow-hidden min-h-[720px] relative">
          {/* Phone Notch */}
          <div className="mx-auto h-4 w-32 rounded-full bg-slate-800 mb-4" />
          {content}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">{content}</div>
      )}

      {/* FLOATING ACTION BUTTON: ASK SCHOLA */}
      <button
        onClick={() => setIsScholaOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 rounded-2xl bg-sac-maroon-800 px-4 py-3 text-white shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-sac-gold-400 group"
        title="Ask Schola AI"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-sac-gold-500 text-sac-maroon-950 font-bold shadow-sm">
          <Bot className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-left">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-black tracking-tight text-white">Ask Schola</span>
            <Sparkles className="h-3.5 w-3.5 text-sac-gold-400" />
          </div>
          <span className="text-[10px] text-sac-gold-300 font-medium block">
            SAC AI Scholar Companion
          </span>
        </div>
      </button>

      {/* SCHOLA CHAT MODAL */}
      <ScholaChatModal
        isOpen={isScholaOpen}
        onClose={() => setIsScholaOpen(false)}
        student={student}
        applications={applications}
        programs={programs}
        payoutBatches={payoutBatches}
        onOpenApplyTab={() => setActiveTab('apply')}
        onOpenPassTab={() => setActiveTab('pass')}
      />
    </div>
  );
};
