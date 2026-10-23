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
  const [gwa, setGwa] = useState('1.65');
  const [income, setIncome] = useState('180000');
  const [uploadedIdName, setUploadedIdName] = useState('Juan Miguel Dela Cruz');
  const [uploadedLrn, setUploadedLrn] = useState('115201140091');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [preVerifyResult, setPreVerifyResult] = useState<any>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Active student application
  const myApp = applications.find((a) => a.studentId === student.id) || applications[0];

  // Matching payout batch for this student's approved grant
  const myPayoutBatch = payoutBatches.find((b) => b.programCode === myApp?.program.code);

  const handleSimulateUpload = (fileName: string) => {
    setUploadFileName(fileName);
    setIsVerifying(true);
    setPreVerifyResult(null);

    setTimeout(() => {
      const res = performDocumentVerification({
        registeredName: student.fullName,
        registeredLrn: student.lrn,
        extractedText: `ST. ANTHONY COLLEGE SAN JOSE ANTIQUE\nNAME: ${uploadedIdName}\nLRN: ${uploadedLrn}\nID: ${student.studentIdNumber}`,
        extractedName: uploadedIdName,
        extractedLrn: uploadedLrn,
        fileHash: `hash-${Date.now()}`,
      });
      setIsVerifying(false);
      setPreVerifyResult(res);
    }, 800);
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
          fileName: uploadFileName || 'ID_Photo.jpg',
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
      {/* Top Header & Institutional Profile */}
      <div className="rounded-2xl bg-gradient-to-br from-anthonian-900 via-anthonian-800 to-anthonian-950 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="rounded-full bg-gold-400/20 px-2.5 py-0.5 text-[11px] font-bold text-gold-300 border border-gold-400/30">
                Registered Anthonian
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> LRN Verified
              </span>
            </div>
            <h1 className="mt-2 text-xl font-black tracking-tight">{student.fullName}</h1>
            <p className="text-xs text-slate-300">
              {student.course} • Year {student.yearLevel}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-gold-400 border border-white/20 shadow-inner">
            <GraduationCap className="h-7 w-7" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Student ID No.
            </span>
            <span className="font-bold text-white">{student.studentIdNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              DepEd LRN (12-Digit)
            </span>
            <span className="font-bold text-gold-400">{student.lrn}</span>
          </div>
        </div>
      </div>

      {/* QUICK SUBNAV TABS */}
      <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-bold">
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
            className={`flex-1 rounded-lg py-2 transition text-center ${
              activeTab === tab.id
                ? 'bg-white text-anthonian-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: MY ACTIVE SCHOLARSHIP & PAYOUT TRACKER */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          {/* Schola AI Companion Interactive Banner */}
          <div className="rounded-2xl border border-anthonian-200 bg-gradient-to-r from-anthonian-50 via-white to-gold-50/40 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-anthonian-800 to-anthonian-950 text-gold-400 shadow-md">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-sm text-anthonian-950">Ask Schola AI</h3>
                    <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-gold-800 border border-gold-400/40">
                      Scholar Companion
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-snug">
                    I know your academic profile (GWA: 1.45, BS IT Year 3) and all scholarships available at St. Anthony’s College!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScholaOpen(true)}
                className="shrink-0 rounded-xl bg-anthonian-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-anthonian-900 transition flex items-center space-x-1"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold-400" />
                <span>Chat</span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsScholaOpen(true)}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-anthonian-400 transition"
              >
                What scholarships are available in SAC? &rarr;
              </button>
              <button
                onClick={() => setIsScholaOpen(true)}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 hover:border-anthonian-400 transition"
              >
                When is my TDP-TES releasing? &rarr;
              </button>
            </div>
          </div>

          {/* Active Grant Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-anthonian-100 px-2 py-0.5 text-[11px] font-black text-anthonian-800">
                  {myApp.program.code}
                </span>
                <h2 className="mt-1.5 text-base font-bold text-slate-900 leading-snug">
                  {myApp.program.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">AY 2026-2027 • 1st Semester</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Grant Amount</span>
                <span className="text-lg font-black text-emerald-600">
                  ₱{myApp.program.grantAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Releasing Schedule Alert Pill */}
            {myPayoutBatch && (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 p-3.5 border border-amber-200">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <Calendar className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Scheduled Campus Releasing Date</span>
                </div>
                <p className="mt-1 text-xs text-amber-800 font-medium">
                  {myPayoutBatch.scheduledDate} ({myPayoutBatch.startTime} - {myPayoutBatch.endTime})
                </p>
                <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-amber-700">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{myPayoutBatch.venue}</span>
                </div>
                <div className="mt-2 text-[11px] text-amber-900 bg-amber-200/60 px-2 py-1 rounded font-semibold">
                  Bring your Validated SAC ID & present the Digital Scholar QR Pass below.
                </div>
              </div>
            )}

            {/* Visual Releasing Tracker Timeline */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Live Disbursement Tracker
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: 'Application & Documents Submitted',
                    desc: 'COR & SAC Student ID submitted via portal',
                    done: true,
                  },
                  {
                    title: 'DepEd LRN & Identity Verified',
                    desc: 'Automated 12-digit LRN & Jaro-Winkler check passed (98%)',
                    done: true,
                  },
                  {
                    title: 'ISPSO & CHED Endorsement',
                    desc: 'Included in Masterlist for 1st Sem Subsidy Payroll',
                    done: true,
                  },
                  {
                    title: 'Scheduled for Campus Payout',
                    desc: 'Nov 14, 2026 at SAC Gymnasium',
                    done: true,
                    active: true,
                  },
                  {
                    title: 'Disbursed & Signed',
                    desc: 'Present QR Pass at releasing window to claim',
                    done: false,
                  },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.done
                          ? 'bg-emerald-600 text-white'
                          : step.active
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {step.done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${
                          step.active ? 'text-amber-800' : step.done ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DIGITAL SCHOLAR PASS (QR CODE) */}
      {activeTab === 'pass' && (
        <div className="rounded-2xl border-2 border-anthonian-800 bg-white p-6 shadow-md text-center">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-anthonian-800">
              ST. ANTHONY’S COLLEGE ISPSO
            </span>
            <h2 className="text-base font-black text-slate-900">Digital Scholar Pass</h2>
            <p className="text-xs text-slate-500">Official Campus Releasing Voucher</p>
          </div>

          {/* Dynamic QR Code representation */}
          <div className="my-5 flex flex-col items-center justify-center">
            <div className="relative rounded-2xl border-4 border-anthonian-900 bg-white p-4 shadow-xl">
              {/* Stylized QR Box */}
              <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl bg-slate-900 text-white p-3 font-mono text-[9px] relative overflow-hidden">
                <QrCode className="h-36 w-36 text-white" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                  <GraduationCap className="h-40 w-40 text-gold-400" />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-700 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Cryptographically Signed Pass</span>
            </div>
          </div>

          {/* Student Pass Details */}
          <div className="rounded-xl bg-slate-50 p-3.5 text-left text-xs font-mono space-y-1.5 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">SCHOLAR:</span>
              <span className="font-bold text-slate-900">{student.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">STUDENT ID:</span>
              <span className="font-bold text-slate-900">{student.studentIdNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DEPED LRN:</span>
              <span className="font-bold text-gold-600">{student.lrn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PROGRAM:</span>
              <span className="font-bold text-slate-900">{myApp.program.code} (₱7,500)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">VALIDITY:</span>
              <span className="font-bold text-emerald-600">1ST SEMESTER 2026-2027</span>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400">
            Show this screen to the ISPSO or SAC Finance officer at the gymnasium release counter.
          </p>
        </div>
      )}

      {/* SUBTAB 3: APPLY FOR SCHOLARSHIP */}
      {activeTab === 'apply' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
            <h3 className="text-xs font-bold text-anthonian-900">Available Scholarships & Grants</h3>
            <p className="text-[11px] text-anthonian-700 mt-0.5">
              Select an open program below to submit your application and upload requirements.
            </p>
          </div>

          {programs.map((prog) => (
            <div
              key={prog.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded bg-anthonian-100 px-2 py-0.5 text-[11px] font-black text-anthonian-800">
                    {prog.code}
                  </span>
                  <h4 className="mt-1 font-bold text-sm text-slate-900">{prog.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{prog.provider}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-600">
                    ₱{prog.grantAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{prog.frequency}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                <span className="text-slate-500 text-[11px]">Deadline: {prog.deadline}</span>
                <button
                  onClick={() => setSelectedProgram(prog)}
                  className="rounded-lg bg-anthonian-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-anthonian-900 transition flex items-center space-x-1"
                >
                  <span>Apply Now</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 4: DIRECT MOBILE SMS TEXTS */}
      {activeTab === 'sms' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900">SAC-ISPSO Official Mobile SMS</h3>
                  <p className="text-[11px] text-slate-500">Connected to your phone: {student.contactNumber}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                SMS Active
              </span>
            </div>

            {/* SMS Thread */}
            <div className="my-4 space-y-3 max-h-80 overflow-y-auto p-1">
              {smsMessages
                .filter((s) => s.studentId === student.id || s.mobileNumber === student.contactNumber)
                .map((sms) => (
                  <div
                    key={sms.id}
                    className={`flex flex-col ${
                      sms.direction === 'OUTBOUND' ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                        sms.direction === 'OUTBOUND'
                          ? 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200'
                          : 'bg-emerald-600 text-white rounded-br-sm'
                      }`}
                    >
                      <p className="font-semibold text-[10px] opacity-75 mb-0.5">
                        {sms.direction === 'OUTBOUND' ? 'ISPSO Staff: ' + sms.sender : 'You'}
                      </p>
                      <p>{sms.message}</p>
                      <span className="mt-1 block text-[9px] opacity-70 text-right">
                        {sms.timestamp.slice(11, 16)} • {sms.status}
                      </span>
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
              className="flex items-center gap-2 pt-2 border-t border-slate-100"
            >
              <input
                type="text"
                value={replySmsText}
                onChange={(e) => setReplySmsText(e.target.value)}
                placeholder="Reply via SMS to ISPSO (e.g. Confirmed, thank you)..."
                className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                disabled={!replySmsText.trim()}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold text-white transition shadow-sm ${
                  replySmsText.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 5: ANNOUNCEMENTS & OFFICIAL NOTICES */}
      {activeTab === 'notices' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ISPSO Direct Broadcasts
            </h3>
            <span className="text-[11px] text-slate-400">{announcements.length} Total</span>
          </div>

          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                    ann.priority === 'URGENT'
                      ? 'bg-rose-100 text-rose-700'
                      : ann.priority === 'HIGH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-anthonian-800'
                  }`}
                >
                  {ann.priority}
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

      {/* APPLICATION WIZARD MODAL */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-black text-slate-900">
              Apply for {selectedProgram.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload your validated SAC ID. The Verification API will inspect your DepEd LRN and name in real-time.
            </p>

            {submittedSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Application Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Your identity and LRN have been verified. Redirecting to dashboard...
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
                      placeholder="e.g. 1.75"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:ring-anthonian-800 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Annual Family Income (₱)</label>
                    <input
                      type="text"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="e.g. 150000"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 focus:ring-anthonian-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Simulated Document Upload Area */}
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                  <Upload className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-1 font-bold text-slate-700">Upload Validated SAC Student ID</p>
                  <p className="text-[11px] text-slate-400">
                    JPG or PNG. Ensure the 1st Sem sticker and LRN are visible.
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedIdName(student.fullName);
                        setUploadedLrn(student.lrn);
                        handleSimulateUpload('My_Validated_SAC_ID.jpg');
                      }}
                      className="rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100"
                    >
                      Use Correct My ID (Match)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedIdName('Eduardo Ramos');
                        setUploadedLrn('115201189912');
                        handleSimulateUpload('Other_Student_ID.jpg');
                      }}
                      className="rounded-md bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200 shadow-sm hover:bg-rose-100"
                    >
                      Simulate Fake / Mismatched ID
                    </button>
                  </div>
                </div>

                {/* Real-time Verification Feedback */}
                {isVerifying && (
                  <div className="flex items-center justify-center space-x-2 py-3 text-xs text-anthonian-700 font-medium">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>AI Engine inspecting ID text & LRN checksum...</span>
                  </div>
                )}

                {preVerifyResult && (
                  <div
                    className={`rounded-xl p-3.5 border ${
                      preVerifyResult.status === 'VERIFIED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {preVerifyResult.status === 'VERIFIED' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                        )}
                        <span>{preVerifyResult.status.replace(/_/g, ' ')}</span>
                      </span>
                      <span>{preVerifyResult.nameSimilarityScore}% Name Match</span>
                    </div>

                    <div className="mt-2 text-[11px] space-y-0.5">
                      <div>
                        <span className="text-slate-500">Detected Name:</span>{' '}
                        <span className="font-bold">{preVerifyResult.extractedName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Detected LRN:</span>{' '}
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
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!preVerifyResult || preVerifyResult.status === 'NAME_MISMATCH'}
                    className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition ${
                      !preVerifyResult || preVerifyResult.status === 'NAME_MISMATCH'
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-anthonian-800 hover:bg-anthonian-900'
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
          <Smartphone className="h-4 w-4 text-anthonian-700" />
          <span className="text-xs font-bold text-slate-700">
            Student PWA Experience (@sac.edu.ph)
          </span>
        </div>
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          {isMobileFrame ? 'Expand Full Screen' : 'View Mobile Phone Mockup'}
        </button>
      </div>

      {isMobileFrame ? (
        <div className="mx-auto max-w-sm rounded-[40px] border-8 border-slate-800 bg-slate-100 p-4 shadow-2xl overflow-hidden min-h-[720px] relative">
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
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-anthonian-900 to-anthonian-800 px-4 py-3 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-gold-400/40 group"
        title="Ask Schola AI"
      >
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gold-400 text-anthonian-950 font-bold shadow-sm">
          <Bot className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-left">
          <div className="flex items-center space-x-1">
            <span className="text-xs font-black tracking-tight text-white">Ask Schola</span>
            <Sparkles className="h-3 w-3 text-gold-400" />
          </div>
          <span className="text-[10px] text-slate-300 font-medium block">
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
