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
  const myApp = applications.find((a) => a.studentId === student.id);

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
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold text-sac-maroon-800">Student portal</p>
        <h1 className="mt-2 font-serif text-3xl text-slate-900">My scholarship</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Check your application, find scholarship opportunities, and view updates from ISPSO.</p>
        <dl className="mt-5 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <div><dt className="text-sm text-slate-500">Student name</dt><dd className="mt-1 text-sm font-semibold">{student.fullName}</dd></div>
          <div><dt className="text-sm text-slate-500">Student number</dt><dd className="mt-1 text-sm font-semibold">{student.studentIdNumber}</dd></div>
          <div><dt className="text-sm text-slate-500">Course and year</dt><dd className="mt-1 text-sm font-semibold">{student.course} · Year {student.yearLevel}</dd></div>
        </dl>
      </section>

      <nav aria-label="Student services" className="flex flex-wrap gap-1 border-b border-slate-300">
        {[
          { id: 'home', label: 'Overview' },
          { id: 'apply', label: 'Scholarships' },
          { id: 'pass', label: 'Payout pass' },
          { id: 'notices', label: 'Announcements' },
          { id: 'sms', label: 'Messages' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`border-b-2 px-3 py-3 text-sm font-semibold ${activeTab === tab.id ? 'border-sac-maroon-800 text-sac-maroon-800' : 'border-transparent text-slate-600 hover:bg-white'}`}>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ============================================================== */}
      {/* SUBTAB 1: MY ACTIVE SCHOLARSHIP & PAYOUT TRACKER               */}
      {/* ============================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-slate-900">Application status</h2>
            <button onClick={() => setActiveTab('apply')} className="rounded bg-sac-maroon-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sac-maroon-900">Browse scholarships</button>
          </div>
          {!myApp && <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">You have not submitted an application. Browse scholarships to review the requirements and apply.</p>}

          {/* Active Grant Status Card */}
          {myApp && <div className="rounded-lg border border-slate-200 bg-white p-5 ">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-md bg-sac-maroon-100 px-2 py-0.5 text-xs font-bold text-sac-maroon-800">
                  {myApp?.program.code || 'TDP-TES'}
                </span>
                <h3 className="mt-2 text-base font-bold text-slate-900">
                  {myApp?.program.name || 'Tulong Dunong Program (TDP-TES)'}
                </h3>
                <p className="text-sm text-slate-500">
                  Provider: {myApp?.program.provider || 'CHED / UniFAST'} • AY 2026-2027 1st Sem
                </p>
              </div>
              <span className={`rounded border px-3 py-1 text-sm font-semibold ${myApp.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                {myApp.status === 'APPROVED' ? 'Approved' : myApp.status === 'DEFICIENT' ? 'Documents needed' : myApp.status === 'REJECTED' ? 'Not approved' : 'Under review'}
              </span>
            </div>

            <div className="mt-4 rounded-md bg-slate-50 p-3.5 text-sm border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Stipend Subsidy:</span>
                <span className="text-sm font-semibold text-slate-900">
                  ₱{(myApp?.program.grantAmount || 7500).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between items-center">
                <span className="text-slate-500">Document check:</span>
                <span className="font-semibold text-slate-700">
                  {myApp.verification.status === 'VERIFIED' ? 'Details match' : 'Staff review needed'}
                </span>
              </div>
            </div>

            {/* Next Payout Alert Box (Replaces Facebook Posts) */}
            {myApp.status === 'APPROVED' && myPayoutBatch ? <div className="mt-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="flex items-start space-x-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center text-sac-maroon-800">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold  text-sac-maroon-950">
                      Payout schedule
                    </h4>
                    <span className="rounded-full bg-sac-gold-200 px-2 py-0.5 text-xs font-bold text-sac-gold-900">
                      {myPayoutBatch.batchNumber}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {new Date(myPayoutBatch.scheduledDate + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} · {myPayoutBatch.startTime} – {myPayoutBatch.endTime}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Venue: <span className="font-bold text-slate-800">{myPayoutBatch.venue}</span>
                  </p>
                  <div className="mt-2 text-xs text-slate-600">
                    Requirements: Validated SAC Student ID &amp; Digital QR Pass.
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-sac-gold-200 flex justify-end">
                <button
                  onClick={() => setActiveTab('pass')}
                  className="rounded-md bg-sac-maroon-800 px-3.5 py-1.5 text-sm font-bold text-white hover:bg-sac-maroon-900 transition flex items-center space-x-1.5 "
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>View payout pass &rarr;</span>
                </button>
              </div>
            </div> : <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">{myApp.deficiencyRemarks || 'Payout details will appear once your application is approved and a schedule is available.'}</p>}
          </div>}

          {/* Quick Scholarships Explorer */}
          <div className="rounded-lg border border-slate-200 bg-white p-5  space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold  text-slate-500">
                Scholarship opportunities ({programs.length})
              </h3>
              <button
                onClick={() => setActiveTab('apply')}
                className="text-sm font-bold text-sac-maroon-800 hover:underline"
              >
                View Catalog &rarr;
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
      {/* SUBTAB 2: DIGITAL QR CLAIM PASS                                */}
      {/* ============================================================== */}
      {activeTab === 'pass' && myApp?.status !== 'APPROVED' && <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">Your payout pass will be available after your application is approved.</p>}
      {activeTab === 'pass' && myApp?.status === 'APPROVED' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6  text-center space-y-4">
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800 inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved scholarship
              </span>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                St. Anthony’s College ISPSO
              </h3>
              <p className="text-sm text-slate-500">
                Sample payout pass. Contact ISPSO for the official claiming requirements.
              </p>
            </div>

            {/* Dynamic QR Code Mockup */}
            <div className="mx-auto flex h-52 w-52 flex-col items-center justify-center rounded-lg bg-white p-3 border-4 border-sac-maroon-800  relative">
              <div className="grid grid-cols-6 gap-1.5 w-full h-full p-2 bg-slate-950 rounded-md">
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
                <div className="h-10 w-10 rounded-md bg-white p-1  flex items-center justify-center">
                  <SacSeal className="h-8 w-8" size={32} />
                </div>
              </div>
            </div>

            <div className="rounded-md bg-slate-50 p-3 font-mono text-sm text-slate-700 space-y-1 text-left border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">STUDENT:</span>
                <span className="font-bold text-slate-900">{student.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ID NUMBER:</span>
                <span className="font-bold text-slate-900">{student.studentIdNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DEPED LRN:</span>
                <span className="font-bold text-sac-maroon-800">{student.lrn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PROGRAM:</span>
                <span className="font-bold">{myApp?.program.code || 'TDP-TES'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">STIPEND:</span>
                <span className="font-bold text-emerald-600">₱{(myApp?.program.grantAmount || 7500).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Pass reference: <code className="font-mono">SAC-SEC-2026-482910</code>
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
                      placeholder="e.g. 1.38"
                      className="mt-1 w-full rounded-md border border-slate-300 p-2.5 focus:ring-sac-maroon-800 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700">Annual Family Income (₱)</label>
                    <input
                      type="text"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="e.g. 180000"
                      className="mt-1 w-full rounded-md border border-slate-300 p-2.5 focus:ring-sac-maroon-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Simulated Document Upload Area */}
                <div className="rounded-lg border-2 border-dashed border-sac-maroon-300 bg-sac-maroon-50/30 p-4 text-center">
                  <Upload className="mx-auto h-7 w-7 text-sac-maroon-800" />
                  <p className="mt-1 font-bold text-slate-900">Check student ID (demonstration)</p>
                  <p className="text-xs text-slate-500">
                    Demo document check: compare the name and Learner Reference Number (LRN) with your student record.
                  </p>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedIdName(student.fullName);
                        setUploadedLrn(student.lrn);
                        handleSimulateUpload('JhonEstrabo_SAC_ID.jpg');
                      }}
                      className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300  hover:bg-slate-50"
                    >
                      Try matching sample ID
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedIdName('Eduardo Ramos');
                        setUploadedLrn('115201189912');
                        handleSimulateUpload('Other_Student_ID.jpg');
                      }}
                      className="rounded-md bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200  hover:bg-rose-100"
                    >
                      Try a different sample ID
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
        onOpenPassTab={() => setActiveTab('pass')}
      />
    </div>
  );
};
