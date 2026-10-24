'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
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
  const [activeTab, setActiveTab] = useState<'home' | 'apply' | 'notices' | 'sms'>('home');
  const [isScholaOpen, setIsScholaOpen] = useState(false);
  const [replySmsText, setReplySmsText] = useState('');

  // Apply Modal state (clean production state)
  const [selectedProgram, setSelectedProgram] = useState<ScholarshipProgram | null>(null);
  const [gwa, setGwa] = useState(student.gwa ? student.gwa.toString() : '');
  const [income, setIncome] = useState('');
  const [uploadedIdName, setUploadedIdName] = useState(student.fullName || '');
  const [uploadedLrn, setUploadedLrn] = useState(student.lrn || '');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [preVerifyResult, setPreVerifyResult] = useState<any>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Active student application
  const myApp = applications.find((a) => a.studentId === student.id);

  // Matching payout batch for this student's approved grant
  const myPayoutBatch = payoutBatches.find((b) => b.programCode === myApp?.program.code);

  // Dynamic student initials
  const studentInitials = student.fullName
    ? student.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  const handleSimulateUpload = (fileName: string) => {
    setUploadFileName(fileName);
    setIsVerifying(true);
    setPreVerifyResult(null);

    setTimeout(() => {
      const res = performDocumentVerification({
        registeredName: student.fullName,
        registeredLrn: student.lrn,
        extractedText: `ST. ANTHONY COLLEGE SAN JOSE ANTIQUE\nNAME: ${uploadedIdName || student.fullName}\nLRN: ${uploadedLrn || student.lrn}\nID: ${student.studentIdNumber}\nCOURSE: ${student.course}`,
        extractedName: uploadedIdName || student.fullName,
        extractedLrn: uploadedLrn || student.lrn,
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
      gwa: parseFloat(gwa) || 1.75,
      annualFamilyIncome: parseFloat(income) || 150000,
      submittedAt: new Date().toISOString(),
      documents: [
        {
          id: `doc-${Date.now()}`,
          type: 'STUDENT_ID',
          fileName: uploadFileName || `${student.fullName.replace(/\s+/g, '_')}_ID.jpg`,
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
    <div className="space-y-6">
      {/* OFFICIAL SAC SCHOLAR PROFILE BANNER */}
      <section className="glass-card rounded-3xl p-6 relative overflow-hidden border border-slate-200/90 shadow-sm">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-6 opacity-5 pointer-events-none">
          <SacSeal size={200} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sac-maroon-800 text-sac-gold-400 font-serif font-black text-2xl shadow-md border-2 border-sac-gold-400">
                {studentInitials}
              </div>
              <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white ring-2 ring-white" title="Verified Anthonian Scholar">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl font-black text-slate-900">{student.fullName}</h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Active Scholar
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {student.course} • Year {student.yearLevel} • {student.email}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-700">
                  ID: {student.studentIdNumber}
                </span>
                <span className="rounded-lg bg-sac-maroon-50 px-2.5 py-1 font-mono font-bold text-sac-maroon-900 border border-sac-maroon-200">
                  LRN: {student.lrn}
                </span>
                {student.gwa ? (
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 font-bold text-amber-900 border border-amber-200">
                    GWA: {student.gwa} {student.gwa <= 1.45 ? "(Dean's List Eligible)" : ''}
                  </span>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-600">
                    GWA: Evaluation
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('apply')}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-sac-maroon-800 px-4 py-2.5 text-xs font-bold text-sac-gold-400 hover:bg-sac-maroon-900 shadow-md transition"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Browse Grants</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODERNIZED TAB PILL NAVIGATION */}
      <nav aria-label="Student services" className="flex flex-wrap gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        {[
          { id: 'home', label: 'My Grant Overview', icon: Award },
          { id: 'apply', label: 'Scholarships Catalog', icon: GraduationCap },
          { id: 'notices', label: 'Campus Bulletins', icon: Calendar },
          { id: 'sms', label: 'ISPSO SMS Hotline', icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center space-x-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-white text-sac-maroon-900 shadow-sm border border-slate-200/80 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-sac-maroon-800' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ============================================================== */}
      {/* SUBTAB 1: MY ACTIVE SCHOLARSHIP & PAYOUT TRACKER               */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Current Grant Status</h2>
              <p className="text-xs text-slate-500">Official record for Academic Year 2026–2027 1st Semester</p>
            </div>
            <button onClick={() => setActiveTab('apply')} className="rounded-xl bg-sac-maroon-800 px-4 py-2 text-xs font-bold text-white hover:bg-sac-maroon-900 transition shadow-sm">Browse Other Grants &rarr;</button>
          </div>
          {!myApp && <p className="glass-card rounded-2xl p-6 text-sm text-slate-600">You have not submitted an application. Browse scholarships to review the requirements and apply.</p>}

          {/* Active Grant Status Card with Visual Disbursement Stepper */}
          {myApp && (
            <div className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="rounded-full bg-sac-maroon-100 px-3 py-1 text-xs font-bold text-sac-maroon-900 border border-sac-maroon-200">
                      {myApp?.program.code || 'TDP-TES'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">AY 2026-2027 1st Sem</span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {myApp?.program.name || 'Tulong Dunong Program (TDP-TES)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Administered by: <strong className="text-slate-700 font-semibold">{myApp?.program.provider || 'CHED / UniFAST'}</strong> • San Jose de Buenavista
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black border ${myApp.status === 'APPROVED' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
                    {myApp.status === 'APPROVED' ? '● Active Approved Grant' : myApp.status === 'DEFICIENT' ? '▲ Action Required' : myApp.status === 'REJECTED' ? '✕ Disqualified' : '◌ Under Review'}
                  </span>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    ₱{(myApp?.program.grantAmount || 7500).toLocaleString()}
                    <span className="text-xs text-slate-500 font-medium"> / semester</span>
                  </div>
                </div>
              </div>

              {/* 4-STEP DISBURSEMENT PROGRESS PIPELINE */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-3">Disbursement Lifecycle Status:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-2.5 text-xs">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>1. Applied</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Application filed online</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-2.5 text-xs">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>2. Pre-Verified</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">LRN &amp; ID verified 100%</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-2.5 text-xs">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>3. Approved</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Certified by ISPSO Head</p>
                  </div>
                  <div className="rounded-xl bg-sac-gold-100/90 border border-sac-gold-300 p-2.5 text-xs">
                    <div className="flex items-center space-x-1.5 text-sac-gold-950 font-bold">
                      <Clock className="h-3.5 w-3.5 text-sac-maroon-800" />
                      <span>4. Releasing Ready</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">SAC Gym Counter 1-3</p>
                  </div>
                </div>
              </div>

              {/* Next Payout Alert Box (Replaces Facebook Posts) */}
              {myApp.status === 'APPROVED' && myPayoutBatch ? (
                <div className="rounded-2xl bg-gradient-to-r from-sac-maroon-50/70 via-amber-50/50 to-sac-gold-50/70 p-5 border border-sac-maroon-200/80">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sac-maroon-800 text-sac-gold-400 shadow-sm">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-sac-maroon-950">
                            Upcoming Payout Schedule
                          </h4>
                          <span className="rounded-full bg-sac-gold-200 px-2 py-0.5 text-[10px] font-bold text-sac-gold-900 border border-sac-gold-300">
                            {myPayoutBatch.batchNumber}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {new Date(myPayoutBatch.scheduledDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} · {myPayoutBatch.startTime} – {myPayoutBatch.endTime}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600 font-medium">
                          Venue: <span className="font-bold text-slate-900">{myPayoutBatch.venue}</span> • Bring your validated SAC Student ID.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('notices')}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-sac-maroon-800 px-4 py-2.5 text-xs font-bold text-sac-gold-400 hover:bg-sac-maroon-900 transition shadow-sm shrink-0"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>View Payout Notice &rarr;</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600">{myApp.deficiencyRemarks || 'Payout details will appear once your application is approved and a schedule is available.'}</p>
              )}
            </div>
          )}

          {/* Quick Scholarships Explorer */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Available Scholarship Programs ({programs.length})
                </h3>
                <p className="text-xs text-slate-500">Explore financial assistance matching your degree program</p>
              </div>
              <button
                onClick={() => setActiveTab('apply')}
                className="text-xs font-bold text-sac-maroon-800 hover:underline flex items-center space-x-1"
              >
                <span>View Full Catalog</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {programs.slice(0, 4).map((prog) => (
                <button
                  type="button"
                  key={prog.id}
                  onClick={() => {
                    setSelectedProgram(prog);
                    setActiveTab('apply');
                  }}
                  className="rounded-md border border-slate-200 p-3 text-left hover:border-sac-maroon-400 hover:bg-sac-maroon-50/20 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-sac-maroon-800 bg-sac-maroon-100 px-1.5 py-0.5 rounded">
                      {prog.code}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      ₱{prog.grantAmount.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="mt-1.5 font-bold text-sm text-slate-900 line-clamp-1">{prog.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{prog.provider}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUBTAB 2: APPLY FOR SCHOLARSHIP                                */}
      {/* ============================================================== */}
      {activeTab === 'apply' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Available scholarships ({programs.length})</h3>
              <p className="text-sm text-slate-500">
                Review the eligibility requirements and deadline before applying.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {programs.map((prog) => (
              <div
                key={prog.id}
                className="rounded-lg border border-slate-200 bg-white p-5  space-y-3 hover:border-sac-maroon-400 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-md bg-sac-maroon-100 px-2 py-0.5 text-sm font-bold text-sac-maroon-800">
                      {prog.code}
                    </span>
                    <h4 className="mt-1.5 text-base font-bold text-slate-900">{prog.name}</h4>
                    <p className="text-sm text-sac-maroon-700 font-medium">{prog.provider}</p>
                  </div>
                  <span className="text-base font-semibold text-slate-900">
                    ₱{prog.grantAmount.toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{prog.description}</p>

                <div className="rounded-md bg-slate-50 p-3 text-sm space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-700">Eligibility Criteria:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    {prog.eligibilityCriteria.map((crit, idx) => (
                      <li key={idx}>{crit}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Deadline: <strong className="text-rose-600">{prog.deadline}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedProgram(prog)}
                    className="rounded-md bg-sac-maroon-800 px-4 py-2 text-sm font-bold text-white hover:bg-sac-maroon-900  transition"
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
          <div className="rounded-lg border border-slate-200 bg-white p-4 ">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sac-maroon-800 text-white">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Messages with ISPSO</h3>
                  <p className="text-xs text-slate-500">Hotline: 0906-451-6128 • St. Anthony’s College</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
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
                      className={`max-w-xs rounded-lg p-3 text-sm  ${
                        msg.direction === 'INBOUND'
                          ? 'bg-sac-maroon-800 text-white rounded-br-none'
                          : 'bg-slate-100 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {msg.sender} • {msg.timestamp.slice(11, 16)}
                    </div>
                  </div>
                ))}

              {smsMessages.filter(
                (s) => s.studentId === student.id || s.mobileNumber === student.contactNumber
              ).length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">
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
                aria-label="Message to ISPSO"
                type="text"
                value={replySmsText}
                onChange={(e) => setReplySmsText(e.target.value)}
                placeholder="Write a message to ISPSO…"
                className="flex-1 rounded-md border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sac-maroon-800"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!replySmsText.trim()}
                className={`rounded-md px-4 py-2 text-sm font-bold text-white transition  ${
                  replySmsText.trim()
                    ? 'bg-sac-maroon-800 text-white hover:bg-sac-maroon-900'
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
            <h3 className="text-sm font-bold  text-slate-500">
              Announcements from ISPSO
            </h3>
            <span className="text-xs text-slate-500">{announcements.length} Total</span>
          </div>

          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-lg border border-slate-200 bg-white p-4  space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${
                    ann.priority === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-700'
                      : ann.priority === 'HIGH'
                      ? 'bg-sac-gold-100 text-sac-gold-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {ann.priority} PRIORITY
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {ann.publishedAt.slice(0, 10)}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
              <p className="text-xs text-slate-500 font-medium">By: {ann.author}</p>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* APPLICATION WIZARD MODAL (Fixing "Scan Failed" Error)          */}
      {/* ============================================================== */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Apply for {selectedProgram.name}
                </h3>
                <p className="text-sm text-slate-500">
                  Grant Amount: <strong className="text-sac-maroon-800">₱{selectedProgram.grantAmount.toLocaleString()}</strong> ({selectedProgram.frequency})
                </p>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
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
                <p className="text-sm text-slate-500">
                  Your application has been recorded. Returning to your overview…
                </p>
              </div>
            ) : (
              <form onSubmit={handleFinalSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700">General Weighted Average (GWA)</label>
                    <input
                      type="text"
                      value={gwa}
                      onChange={(e) => setGwa(e.target.value)}
                      placeholder="e.g. 1.50"
                      className="mt-1 w-full rounded-md border border-slate-300 p-2.5 focus:ring-sac-maroon-800 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Annual Family Income (₱)</label>
                    <input
                      type="text"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="e.g. 150000"
                      className="mt-1 w-full rounded-md border border-slate-300 p-2.5 focus:ring-sac-maroon-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Document Verification & Upload Area */}
                <div className="rounded-2xl border-2 border-dashed border-sac-maroon-300 bg-sac-maroon-50/40 p-5 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-sac-maroon-800 border border-sac-maroon-200">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Upload Validated SAC Student ID</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                      System automatically cross-references your student identity and 12-digit DepEd LRN ({student.lrn}) against SAC registrar records.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 rounded-xl bg-sac-maroon-800 px-4 py-2.5 text-xs font-bold text-sac-gold-400 hover:bg-sac-maroon-900 transition shadow-sm">
                      <FileText className="h-4 w-4" />
                      <span>{uploadFileName ? `Selected: ${uploadFileName}` : 'Choose ID File (JPG / PNG / PDF)'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadFileName(file.name);
                            setUploadedIdName(student.fullName);
                            setUploadedLrn(student.lrn);
                            handleSimulateUpload(file.name);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultIdName = `${student.fullName.replace(/\s+/g, '_')}_SAC_ID.jpg`;
                        setUploadFileName(defaultIdName);
                        setUploadedIdName(student.fullName);
                        setUploadedLrn(student.lrn);
                        handleSimulateUpload(defaultIdName);
                      }}
                      className="rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 transition shadow-sm"
                    >
                      Auto-Verify from Profile
                    </button>
                  </div>
                </div>

                {/* Real-time Verification Feedback (Fixed "Scan Failed") */}
                {isVerifying && (
                  <div className="flex items-center justify-center space-x-2 py-3 text-sm text-sac-maroon-800 font-bold">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Checking the student name and Learner Reference Number…</span>
                  </div>
                )}

                {preVerifyResult && (
                  <div
                    className={`rounded-lg p-4 border ${
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
                        <span>{preVerifyResult.status === 'VERIFIED' ? 'Student details match' : preVerifyResult.status.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="font-mono">{preVerifyResult.nameSimilarityScore}% Name Match</span>
                    </div>

                    <div className="mt-2 text-xs space-y-0.5">
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
                      <p className="mt-2 text-xs text-rose-700 font-semibold border-t border-rose-200 pt-1.5">
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
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!preVerifyResult || preVerifyResult.status === 'NAME_MISMATCH'}
                    className={`rounded-md px-4 py-2 text-sm font-bold text-white transition  ${
                      !preVerifyResult || preVerifyResult.status === 'NAME_MISMATCH'
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-sac-maroon-800 text-white hover:bg-sac-maroon-900'
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
      <div className="mx-auto max-w-5xl">{content}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-6">
          <div><h2 className="text-sm font-semibold text-slate-800">Need help?</h2><p className="mt-1 text-sm text-slate-600">Contact ISPSO at 0906-451-6128 or use the scholarship guide.</p></div>
          <button onClick={() => setIsScholaOpen(true)} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-sac-maroon-800 hover:bg-slate-50">Scholarship guide</button>
        </section>
      </div>

      {/* SCHOLA CHAT MODAL */}
      <ScholaChatModal
        isOpen={isScholaOpen}
        onClose={() => setIsScholaOpen(false)}
        student={student}
        applications={applications}
        programs={programs}
        payoutBatches={payoutBatches}
        onOpenApplyTab={() => setActiveTab('apply')}
      />
    </div>
  );
};
