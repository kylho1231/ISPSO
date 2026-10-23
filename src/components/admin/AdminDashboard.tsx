'use client';

import React, { useState } from 'react';
import {
  Users,
  Banknote,
  FileCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  PlusCircle,
  Search,
  Filter,
  Megaphone,
  QrCode,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  Application,
  PayoutBatch,
  ScholarshipProgram,
  Announcement,
  DisbursementRecord,
} from '@/lib/types';
import { performDocumentVerification } from '@/lib/verification';

interface AdminDashboardProps {
  applications: Application[];
  payoutBatches: PayoutBatch[];
  programs: ScholarshipProgram[];
  announcements: Announcement[];
  disbursements: DisbursementRecord[];
  onUpdateApplicationStatus: (
    appId: string,
    status: Application['status'],
    remarks?: string
  ) => void;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => void;
  onAddPayoutBatch: (batch: Omit<PayoutBatch, 'id' | 'claimedCount'>) => void;
  onDisbursePayout: (studentIdNumber: string, batchId: string) => { success: boolean; message: string; record?: DisbursementRecord };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  applications,
  payoutBatches,
  programs,
  announcements,
  disbursements,
  onUpdateApplicationStatus,
  onAddAnnouncement,
  onAddPayoutBatch,
  onDisbursePayout,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'verifications' | 'payouts' | 'schemes' | 'announcements' | 'sandbox'
  >('overview');

  // Selected application for side-by-side verification modal
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [deficiencyNote, setDeficiencyNote] = useState('');

  // Counter Scanning Mode State
  const [scanStudentId, setScanStudentId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(payoutBatches[0]?.id || '');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string; record?: DisbursementRecord } | null>(null);

  // New Announcement Modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState<Announcement['category']>('PAYOUT');
  const [newAnnPriority, setNewAnnPriority] = useState<Announcement['priority']>('HIGH');
  const [newAnnProgram, setNewAnnProgram] = useState('ALL');
  const [newAnnContent, setNewAnnContent] = useState('');

  // New Payout Batch Modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProgId, setBatchProgId] = useState(programs[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchDate, setBatchDate] = useState('2026-11-25');
  const [batchStartTime, setBatchStartTime] = useState('09:00 AM');
  const [batchEndTime, setBatchEndTime] = useState('12:00 PM');
  const [batchVenue, setBatchVenue] = useState('SAC Gymnasium - Counters 1-3');
  const [batchBeneficiaries, setBatchBeneficiaries] = useState(40);
  const [batchAmount, setBatchAmount] = useState(7500);

  // Sandbox Tester State
  const [sandboxName, setSandboxName] = useState('Juan Carlos Dela Cruz');
  const [sandboxLrn, setSandboxLrn] = useState('115201140091');
  const [sandboxOcrName, setSandboxOcrName] = useState('Juan Dela Cruz');
  const [sandboxOcrLrn, setSandboxOcrLrn] = useState('115201140091');
  const [sandboxRawOcr, setSandboxRawOcr] = useState(
    'ST. ANTHONY COLLEGE\nSAN JOSE ANTIQUE\nSTUDENT ID: 2023-01452\nNAME: Juan Dela Cruz\nDEPED LRN: 115201140091\nVALIDATED 1ST SEM'
  );
  const [sandboxResult, setSandboxResult] = useState<ReturnType<typeof performDocumentVerification> | null>(null);

  // Metrics
  const totalScholars = programs.reduce((sum, p) => sum + p.enrolledCount, 0);
  const pendingVerifications = applications.filter(
    (a) => a.status === 'NEEDS_MANUAL_REVIEW' || a.status === 'VERIFYING'
  ).length;
  const flaggedDiscrepancies = applications.filter(
    (a) =>
      a.verification.status === 'NAME_MISMATCH' ||
      a.verification.status === 'INVALID_LRN' ||
      a.verification.status === 'DUPLICATE_FLAGGED'
  ).length;

  const handleRunSandbox = () => {
    const res = performDocumentVerification({
      registeredName: sandboxName,
      registeredLrn: sandboxLrn,
      extractedText: sandboxRawOcr,
      extractedName: sandboxOcrName,
      extractedLrn: sandboxOcrLrn,
      fileHash: 'test-hash-sandbox',
    });
    setSandboxResult(res);
  };

  const handleScanClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanStudentId.trim()) return;

    const res = onDisbursePayout(scanStudentId.trim(), selectedBatchId);
    if (res.success) {
      setScanFeedback({ type: 'success', message: res.message, record: res.record });
      setScanStudentId('');
    } else {
      setScanFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner & Quick Subnav */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded-md bg-anthonian-100 px-2.5 py-1 text-xs font-bold text-anthonian-800 uppercase tracking-wider">
              ISPSO Administrative Console
            </span>
            <span className="text-xs text-slate-500 font-medium">AY 2026-2027 • 1st Semester</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Scholarship Operations & Payout Center
          </h1>
          <p className="text-sm text-slate-600">
            Real-time grantee verification, automated LRN fraud checks, and coordinated campus releasing.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-anthonian-800 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-anthonian-900 transition"
          >
            <Megaphone className="h-4 w-4 text-gold-400" />
            <span>Broadcast Notice</span>
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <PlusCircle className="h-4 w-4 text-anthonian-600" />
            <span>New Payout Batch</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto text-sm font-semibold">
          {[
            { id: 'overview', label: 'Overview & KPIs', count: undefined },
            {
              id: 'verifications',
              label: 'Verification & Anti-Fraud Queue',
              count: pendingVerifications + flaggedDiscrepancies,
              urgent: flaggedDiscrepancies > 0,
            },
            { id: 'payouts', label: 'Payouts & Releasing Counter', count: payoutBatches.length },
            { id: 'schemes', label: 'Scholarship Schemes', count: programs.length },
            { id: 'announcements', label: 'Announcements Hub', count: announcements.length },
            { id: 'sandbox', label: 'AI Verification Sandbox', count: undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 border-b-2 py-3 px-1 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-anthonian-800 text-anthonian-900'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    tab.urgent
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : activeTab === tab.id
                      ? 'bg-anthonian-100 text-anthonian-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Active Scholars
                </span>
                <span className="rounded-lg bg-blue-50 p-2 text-anthonian-600">
                  <Users className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">{totalScholars}</div>
                <div className="mt-1 flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                  <span>Enrolled across 6 programs</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Disbursed (Term)
                </span>
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <Banknote className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">₱4,250,000</div>
                <div className="mt-1 text-xs text-slate-500 font-medium">
                  Out of ₱6.8M allocated UniFAST/LGU funds
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fraud / Mismatch Alerts
                </span>
                <span className="rounded-lg bg-rose-50 p-2 text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-rose-600">{flaggedDiscrepancies}</div>
                <div className="mt-1 text-xs font-medium text-rose-700">
                  Flagged by LRN / OCR name matcher
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Scheduled Payout Batches
                </span>
                <span className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <Calendar className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900">{payoutBatches.length}</div>
                <div className="mt-1 text-xs font-medium text-amber-700">
                  Next: Nov 14 (SAC Gymnasium)
                </div>
              </div>
            </div>
          </div>

          {/* Quick Split: Discrepancy Alert Box & Payout Schedule */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Urgent Review Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    High-Priority Document Discrepancies
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('verifications')}
                  className="text-xs font-bold text-anthonian-600 hover:text-anthonian-800"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {applications
                  .filter((a) => a.verification.issues.length > 0)
                  .map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        setActiveTab('verifications');
                      }}
                      className="cursor-pointer rounded-lg border border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{app.student.fullName}</p>
                          <p className="text-xs text-slate-500">
                            {app.student.course} • ID: {app.student.studentIdNumber} • LRN: {app.student.lrn}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            app.verification.status === 'DUPLICATE_FLAGGED' ||
                            app.verification.status === 'NAME_MISMATCH'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.verification.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-rose-600 font-medium">
                        {app.verification.issues[0]}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Upcoming Payout Batches summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-anthonian-700" />
                  <h2 className="text-base font-bold text-slate-900">Active Payout Releases</h2>
                </div>
                <button
                  onClick={() => setActiveTab('payouts')}
                  className="text-xs font-bold text-anthonian-600 hover:text-anthonian-800"
                >
                  Manage Payouts &rarr;
                </button>
              </div>

              <div className="space-y-3">
                {payoutBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="rounded-lg border border-slate-200 p-3.5 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{batch.programCode}</span>
                          <span className="text-xs font-semibold text-slate-600">• {batch.batchNumber}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {batch.scheduledDate} ({batch.startTime} - {batch.endTime}) • {batch.venue}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          batch.status === 'ONGOING'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-anthonian-800'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Disbursement Progress: {batch.claimedCount} / {batch.totalBeneficiaries} students
                      </span>
                      <span className="font-bold text-slate-900">
                        ₱{batch.amountPerStudent.toLocaleString()} / student
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.round((batch.claimedCount / batch.totalBeneficiaries) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION & ANTI-FRAUD QUEUE */}
      {activeTab === 'verifications' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Automated Verification & Fraud Detection Queue
              </h2>
              <p className="text-xs text-slate-600">
                The AI engine cross-references uploaded IDs and CORs against student registered names and DepEd LRNs.
              </p>
            </div>
          </div>

          {/* Verification Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3.5">Student / ID</th>
                    <th className="px-4 py-3.5">Program</th>
                    <th className="px-4 py-3.5">Registered vs ID Name</th>
                    <th className="px-4 py-3.5">LRN Status</th>
                    <th className="px-4 py-3.5">Similarity</th>
                    <th className="px-4 py-3.5">Verification Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => setSelectedApp(app)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{app.student.fullName}</div>
                        <div className="text-xs text-slate-500">
                          {app.student.studentIdNumber} • {app.student.course}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {app.program.code}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="text-slate-900 font-medium">{app.student.fullName}</div>
                        <div className="text-slate-500 font-mono">
                          OCR: {app.verification.extractedName}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono">
                        <div className="text-slate-900">{app.student.lrn}</div>
                        {app.verification.extractedLrn !== 'N/A' && (
                          <div
                            className={
                              app.student.lrn === app.verification.extractedLrn
                                ? 'text-emerald-600'
                                : 'text-rose-600 font-bold'
                            }
                          >
                            OCR: {app.verification.extractedLrn}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono text-xs font-bold ${
                              app.verification.nameSimilarityScore >= 90
                                ? 'text-emerald-700'
                                : app.verification.nameSimilarityScore >= 70
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {app.verification.nameSimilarityScore}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            app.verification.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.verification.status === 'NEEDS_MANUAL_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {app.verification.status === 'VERIFIED' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {app.verification.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="inline-flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYOUTS & RELEASING COUNTER */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          {/* Quick Counter Scanner Mode */}
          <div className="rounded-xl border-2 border-anthonian-800 bg-gradient-to-r from-anthonian-900 to-anthonian-950 p-6 text-white shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <QrCode className="h-6 w-6 text-gold-400" />
                  <h2 className="text-xl font-black tracking-tight text-white">
                    Campus Payout & Releasing Counter
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Scan the student’s Digital Scholar Pass (QR Code) or enter their Student ID Number to verify and log release in real time.
                </p>
              </div>

              {/* Scan / Input Form */}
              <form onSubmit={handleScanClaim} className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="rounded-lg bg-anthonian-800 px-3 py-2 text-xs font-semibold text-white border border-anthonian-700 focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {payoutBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.programCode} - {b.batchNumber}
                    </option>
                  ))}
                </select>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={scanStudentId}
                    onChange={(e) => setScanStudentId(e.target.value)}
                    placeholder="e.g. 2023-01452 or Scan QR"
                    className="w-full rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-lg bg-gold-400 px-4 py-2 text-xs font-bold text-anthonian-950 hover:bg-gold-500 transition shadow-sm"
                >
                  Disburse & Sign
                </button>
              </form>
            </div>

            {/* Scan Feedback Alert */}
            {scanFeedback && (
              <div
                className={`mt-4 rounded-lg p-3 text-xs font-semibold flex items-center justify-between ${
                  scanFeedback.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {scanFeedback.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span>{scanFeedback.message}</span>
                </div>
                {scanFeedback.record && (
                  <span className="font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded">
                    Ref: {scanFeedback.record.referenceNumber}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* List of Payout Batches */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {payoutBatches.map((batch) => (
              <div
                key={batch.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-anthonian-100 px-2.5 py-0.5 text-xs font-extrabold text-anthonian-800">
                      {batch.programCode}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        batch.status === 'ONGOING'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900">{batch.batchNumber}</h3>
                  <p className="text-xs text-slate-500">{batch.programName}</p>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{batch.scheduledDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {batch.startTime} - {batch.endTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-medium text-slate-500">Venue:</span>
                      <span className="font-semibold text-slate-700">{batch.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Claimed:</span>
                    <span className="text-slate-900">
                      {batch.claimedCount} of {batch.totalBeneficiaries} Grantees
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.round((batch.claimedCount / batch.totalBeneficiaries) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-xs text-slate-400">Total Release: </span>
                    <span className="text-sm font-black text-slate-900">
                      ₱{(batch.claimedCount * batch.amountPerStudent).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Claims / Disbursement History */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Recent On-Campus Payroll Disbursements
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {disbursements.map((d) => (
                <div key={d.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{d.studentName}</span>
                    <span className="text-slate-400 ml-2">ID: {d.studentIdNumber}</span>
                    <span className="text-slate-400 ml-2">• Ref: {d.referenceNumber}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-600">₱{d.amount.toLocaleString()}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOLARSHIP SCHEMES */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((prog) => (
              <div
                key={prog.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-anthonian-100 px-2.5 py-0.5 text-xs font-black text-anthonian-800">
                      {prog.code}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{prog.category}</span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">{prog.name}</h3>
                  <p className="text-xs text-anthonian-600 font-medium">{prog.provider}</p>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {prog.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subsidy Amount:</span>
                      <span className="font-bold text-slate-900">
                        ₱{prog.grantAmount.toLocaleString()} ({prog.frequency})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Slots / Grantees:</span>
                      <span className="font-bold text-slate-900">
                        {prog.enrolledCount} / {prog.slots} Filled
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deadline:</span>
                      <span className="font-bold text-rose-600">{prog.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex justify-end">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle className="h-3.5 w-3.5" /> Active Application Window
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS HUB */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Official ISPSO Broadcast Center</h2>
              <p className="text-xs text-slate-500">
                Directly feeds into student PWA inboxes and triggers push notifications.
              </p>
            </div>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="rounded-lg bg-anthonian-800 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-anthonian-900 transition flex items-center space-x-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Announcement</span>
            </button>
          </div>

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                        ann.priority === 'URGENT'
                          ? 'bg-rose-100 text-rose-700'
                          : ann.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-anthonian-800'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {ann.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      Audience: {ann.targetPrograms.join(', ')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{ann.publishedAt.slice(0, 10)}</span>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{ann.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                <div className="mt-3 text-[11px] text-slate-400 font-medium">
                  Published by: {ann.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AI VERIFICATION SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-5 w-5 text-anthonian-600" />
              <h2 className="text-base font-bold text-slate-900">
                Interactive Anti-Fraud & OCR Engine Sandbox
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Test how the backend algorithm evaluates student identity, handles middle initials, detects mismatched names, and enforces 12-digit DepEd LRN validation.
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Inputs */}
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                  <h3 className="text-xs font-bold uppercase text-slate-600 mb-3">
                    1. Student Registered Profile (@sac.edu.ph)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Enrolled Full Name</label>
                      <input
                        type="text"
                        value={sandboxName}
                        onChange={(e) => setSandboxName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:ring-anthonian-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">
                        Registered 12-Digit DepEd LRN
                      </label>
                      <input
                        type="text"
                        value={sandboxLrn}
                        onChange={(e) => setSandboxLrn(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-mono focus:ring-anthonian-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                  <h3 className="text-xs font-bold uppercase text-slate-600 mb-3">
                    2. Uploaded ID / Document OCR Extracted Data
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-700">OCR Detected Name</label>
                      <input
                        type="text"
                        value={sandboxOcrName}
                        onChange={(e) => setSandboxOcrName(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:ring-anthonian-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">OCR Detected LRN</label>
                      <input
                        type="text"
                        value={sandboxOcrLrn}
                        onChange={(e) => setSandboxOcrLrn(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-mono focus:ring-anthonian-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-700">Raw Document Text</label>
                      <textarea
                        rows={3}
                        value={sandboxRawOcr}
                        onChange={(e) => setSandboxRawOcr(e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-300 p-2 text-xs font-mono focus:ring-anthonian-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRunSandbox}
                  className="w-full rounded-lg bg-anthonian-800 py-2.5 text-xs font-bold text-white shadow hover:bg-anthonian-900 transition"
                >
                  Run AI Verification Analysis
                </button>
              </div>

              {/* Output Results */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-white font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-emerald-400">ENGINE_AUDIT_REPORT.JSON</span>
                  <span className="text-[11px] text-slate-400">Jaro-Winkler + LRN Evaluator</span>
                </div>

                {sandboxResult ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Status Verdict:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          sandboxResult.status === 'VERIFIED'
                            ? 'bg-emerald-950 text-emerald-300'
                            : sandboxResult.status === 'NEEDS_MANUAL_REVIEW'
                            ? 'bg-amber-950 text-amber-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {sandboxResult.status}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Confidence Score:</span>
                      <span className="font-bold text-gold-400">{sandboxResult.confidenceScore} / 100</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Name Match Similarity:</span>
                      <span className="font-bold text-slate-200">
                        {sandboxResult.nameSimilarityScore}%
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">12-Digit LRN Valid:</span>
                      <span
                        className={
                          sandboxResult.lrnValid ? 'text-emerald-400' : 'text-rose-400 font-bold'
                        }
                      >
                        {sandboxResult.lrnValid ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-400">Heuristic Issues Detected:</span>
                      {sandboxResult.issues.length === 0 ? (
                        <p className="mt-1 text-emerald-400 font-sans">
                          No discrepancies found. Identity verified successfully.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-rose-300 font-sans text-xs">
                          {sandboxResult.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start space-x-1.5">
                              <span className="text-rose-400">&bull;</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 text-center text-slate-500 font-sans">
                    Click &quot;Run AI Verification Analysis&quot; to test.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE APPLICATION AUDIT MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Document Audit: {selectedApp.student.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Application ID: {selectedApp.id} • Program: {selectedApp.program.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-6 gap-6">
              {/* Left Column: Uploaded Document Visual Preview */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Uploaded Document (Student ID / COR)
                </h4>
                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <div className="w-full max-w-xs rounded-lg border border-slate-300 bg-white p-4 shadow-sm text-left font-mono text-[11px] leading-tight space-y-2">
                    <div className="text-center border-b border-slate-200 pb-2">
                      <p className="font-bold text-xs text-anthonian-900">ST. ANTHONY’S COLLEGE</p>
                      <p className="text-[10px] text-slate-500">San Jose de Buenavista, Antique</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Student Name:</p>
                      <p className="font-bold text-slate-900">{selectedApp.verification.extractedName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Learner Ref No. (LRN):</p>
                      <p className="font-bold text-slate-900">{selectedApp.verification.extractedLrn}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase">Student Number:</p>
                      <p className="font-bold text-slate-900">{selectedApp.student.studentIdNumber}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
                      <span className="text-emerald-600 font-bold">1ST SEMESTER 2026-2027</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">VALIDATED</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    File: {selectedApp.documents[0]?.fileName || 'ID_Front.jpg'} (SHA256 Verified)
                  </p>
                </div>

                {/* Raw OCR Snippet */}
                {selectedApp.verification.ocrSnippet && (
                  <div className="rounded-lg bg-slate-100 p-3 font-mono text-[11px] text-slate-700">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">OCR Raw Text:</p>
                    <pre className="whitespace-pre-wrap">{selectedApp.verification.ocrSnippet}</pre>
                  </div>
                )}
              </div>

              {/* Right Column: AI Analysis & Verification Checkpoints */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Discrepancy & Anti-Fraud Inspection
                </h4>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Verification Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-xs ${
                        selectedApp.verification.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedApp.verification.status === 'NEEDS_MANUAL_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedApp.verification.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Name Match Score:</span>
                    <span className="font-bold text-slate-900">
                      {selectedApp.verification.nameSimilarityScore}% (Jaro-Winkler)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Registered DepEd LRN:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedApp.student.lrn}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Document LRN:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedApp.verification.extractedLrn}
                    </span>
                  </div>

                  {selectedApp.verification.issues.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs font-bold text-rose-700 mb-1">Detected Issues:</p>
                      <ul className="space-y-1 text-xs text-rose-600">
                        {selectedApp.verification.issues.map((err, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{err}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Coordinator Deficiency Note Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Coordinator Feedback / Deficiency Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={deficiencyNote}
                    onChange={(e) => setDeficiencyNote(e.target.value)}
                    placeholder="e.g. Please re-upload a clearer image of your ID showing the 1st Sem sticker."
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:ring-anthonian-800 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      onUpdateApplicationStatus(selectedApp.id, 'APPROVED');
                      setSelectedApp(null);
                    }}
                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Approve Grant
                  </button>
                  <button
                    onClick={() => {
                      onUpdateApplicationStatus(
                        selectedApp.id,
                        'DEFICIENT',
                        deficiencyNote || 'Document requires re-upload.'
                      );
                      setSelectedApp(null);
                    }}
                    className="flex-1 rounded-lg bg-amber-600 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition"
                  >
                    Mark Deficient
                  </button>
                  <button
                    onClick={() => {
                      onUpdateApplicationStatus(
                        selectedApp.id,
                        'REJECTED',
                        deficiencyNote || 'Identity mismatch detected.'
                      );
                      setSelectedApp(null);
                    }}
                    className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition"
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Broadcast Official Announcement</h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly sends Web Push notifications and updates student inboxes.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Notice Title</label>
                <input
                  type="text"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  placeholder="e.g. Schedule of TDP-TES Payout at SAC Gym"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newAnnCategory}
                    onChange={(e) => setNewAnnCategory(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  >
                    <option value="PAYOUT">Payout / Releasing</option>
                    <option value="APPLICATION">Application Window</option>
                    <option value="DEADLINE">Urgent Deadline</option>
                    <option value="GENERAL">General Notice</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Priority Level</label>
                  <select
                    value={newAnnPriority}
                    onChange={(e) => setNewAnnPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Push Alert)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Target Beneficiaries</label>
                <select
                  value={newAnnProgram}
                  onChange={(e) => setNewAnnProgram(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                >
                  <option value="ALL">All SAC Students</option>
                  <option value="TES">UniFAST TES Grantees Only</option>
                  <option value="TDP-TES">TDP-TES Grantees Only</option>
                  <option value="CAS">CAS Working Scholars</option>
                  <option value="APESP">APESP Provincial Scholars</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Announcement Details</label>
                <textarea
                  rows={4}
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  placeholder="Detail the instructions, required IDs, timeslots, and venue at St. Anthony’s College..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newAnnTitle || !newAnnContent) return;
                  onAddAnnouncement({
                    title: newAnnTitle,
                    category: newAnnCategory,
                    priority: newAnnPriority,
                    targetPrograms: newAnnProgram === 'ALL' ? ['ALL'] : [newAnnProgram],
                    content: newAnnContent,
                    author: 'ISPSO Admin Desk',
                  });
                  setNewAnnTitle('');
                  setNewAnnContent('');
                  setShowAnnouncementModal(false);
                }}
                className="rounded-lg bg-anthonian-800 px-4 py-2 text-xs font-bold text-white hover:bg-anthonian-900"
              >
                Publish Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PAYOUT BATCH MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Schedule New Payout Batch</h3>
            <p className="text-xs text-slate-500 mb-4">
              Establishes organized releases to prevent campus queues and crowd congestion.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Scholarship Program</label>
                <select
                  value={batchProgId}
                  onChange={(e) => {
                    setBatchProgId(e.target.value);
                    const prog = programs.find((p) => p.id === e.target.value);
                    if (prog) setBatchAmount(prog.grantAmount);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Batch Name / Student Range</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. Batch 3: Surnames N - Z"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Start Time</label>
                  <input
                    type="text"
                    value={batchStartTime}
                    onChange={(e) => setBatchStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">End Time</label>
                  <input
                    type="text"
                    value={batchEndTime}
                    onChange={(e) => setBatchEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Venue</label>
                <input
                  type="text"
                  value={batchVenue}
                  onChange={(e) => setBatchVenue(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Number of Beneficiaries</label>
                  <input
                    type="number"
                    value={batchBeneficiaries}
                    onChange={(e) => setBatchBeneficiaries(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Stipend Amount (₱)</label>
                  <input
                    type="number"
                    value={batchAmount}
                    onChange={(e) => setBatchAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 focus:ring-anthonian-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!batchNumber) return;
                  const prog = programs.find((p) => p.id === batchProgId) || programs[0];
                  onAddPayoutBatch({
                    programId: prog.id,
                    programCode: prog.code,
                    programName: prog.name,
                    batchNumber,
                    academicYear: '2026-2027',
                    semester: '1st Semester',
                    scheduledDate: batchDate,
                    startTime: batchStartTime,
                    endTime: batchEndTime,
                    venue: batchVenue,
                    totalBeneficiaries: batchBeneficiaries,
                    amountPerStudent: batchAmount,
                    status: 'UPCOMING',
                  });
                  setBatchNumber('');
                  setShowBatchModal(false);
                }}
                className="rounded-lg bg-anthonian-800 px-4 py-2 text-xs font-bold text-white hover:bg-anthonian-900"
              >
                Schedule Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
