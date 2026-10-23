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
  GraduationCap,
  Award,
  Ban,
  RefreshCw,
  Sliders,
  MessageSquare,
  Send,
  Smartphone,
  ChevronRight,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  Check,
  ExternalLink,
  BookOpen,
  Bell,
  LogOut,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import {
  Application,
  PayoutBatch,
  ScholarshipProgram,
  Announcement,
  DisbursementRecord,
  SmsMessage,
  AuditLog,
} from '@/lib/types';
import { performDocumentVerification } from '@/lib/verification';
import { SacSeal } from '@/components/SacSeal';
import { AdminCopilotModal } from './AdminCopilotModal';

interface AdminDashboardProps {
  applications: Application[];
  payoutBatches: PayoutBatch[];
  programs: ScholarshipProgram[];
  announcements: Announcement[];
  disbursements: DisbursementRecord[];
  smsMessages?: SmsMessage[];
  auditLogs?: AuditLog[];
  onUpdateApplicationStatus: (
    appId: string,
    status: Application['status'],
    remarks?: string
  ) => void;
  onAddAnnouncement: (announcement: Omit<Announcement, 'id' | 'publishedAt'>) => void;
  onAddPayoutBatch: (batch: Omit<PayoutBatch, 'id' | 'claimedCount'>) => void;
  onDisbursePayout: (studentIdNumber: string, batchId: string) => { success: boolean; message: string; record?: DisbursementRecord };
  onSendAdminSms?: (studentId: string, mobile: string, message: string) => void;
  onLogout?: () => void;
}

export type AdminTab =
  | 'overview'       // Dashboard
  | 'schemes'        // Scholarships (8 programs)
  | 'applications'   // Applications (All with working AI Verdict replacing "Scan Failed")
  | 'continuing'     // Renewals (Renewal tracking)
  | 'scholars'       // Scholar records (Official active scholars & payout status)
  | 'denied'         // Not approved (Disqualified / Fraudulent applications)
  | 'settings_sms'   // SMS & Releasing Settings (5 templates + 2-way live SMS chat)
  | 'academic'       // Academic records (Dean's List / Top 1 students)
  | 'payouts'        // Payout Schedules & Counter Scanner
  | 'announcements'  // Announcements (Syncing FB posts)
  | 'security'       // Security & Audit Trail (RA 10173)
  | 'sandbox';       // AI Verification Sandbox

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  applications,
  payoutBatches,
  programs,
  announcements,
  disbursements,
  smsMessages = [],
  auditLogs = [],
  onUpdateApplicationStatus,
  onAddAnnouncement,
  onAddPayoutBatch,
  onDisbursePayout,
  onSendAdminSms,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Admin AI Copilot & Notifications state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'New Student Application',
      desc: 'Jhon Kylho Estrabo (BSIT 3) submitted for TDP-TES with GWA 1.38 (100% pre-verified).',
      time: '10m ago',
      unread: true,
      type: 'app',
      tab: 'applications' as AdminTab,
    },
    {
      id: 'notif-2',
      title: 'Document Discrepancy Flag',
      desc: 'Mark Villanueva uploaded an ID with a duplicate digital hash matching another scholar.',
      time: '25m ago',
      unread: true,
      type: 'flag',
      tab: 'denied' as AdminTab,
    },
    {
      id: 'notif-3',
      title: 'Upcoming Payout at SAC Gym',
      desc: 'TDP-TES Batch 1 releasing scheduled for Nov 25, 2026 at SAC Gymnasium Counters 1-3.',
      time: '1h ago',
      unread: true,
      type: 'payout',
      tab: 'payouts' as AdminTab,
    },
    {
      id: 'notif-4',
      title: 'Student SMS Inquiry',
      desc: 'Inbound message from 0917-882-9102 asking about renewal grade slip deadline.',
      time: '2h ago',
      unread: false,
      type: 'sms',
      tab: 'settings_sms' as AdminTab,
    },
  ]);

  // Search & Filter state
  const [appSearch, setAppSearch] = useState('');
  const [appFilterProgram, setAppFilterProgram] = useState('ALL');
  const [appFilterStatus, setAppFilterStatus] = useState('ALL');

  // SMS Center state
  const [smsTargetStudentId, setSmsTargetStudentId] = useState(applications[0]?.student.id || '');
  const [smsMessageText, setSmsMessageText] = useState('');
  const [smsStatusAlert, setSmsStatusAlert] = useState<string | null>(null);

  // 5 Automated SMS Templates from User's Prior UI
  const [smsTemplates, setSmsTemplates] = useState({
    approved:
      'Dear {student_name}, Congratulations! Your application for {scholarship_name} has been APPROVED by St. Anthony’s College ISPSO. Please check your ScholarLink portal for your scheduled payout batch.',
    rejected:
      'Dear {student_name}, We regret to inform you that your application for {scholarship_name} was not approved due to {reason}. You may file an appeal at ISPSO Room 102 within 5 school days.',
    deficiency:
      'Dear {student_name}, St. Anthony’s College ISPSO needs additional documents for your scholarship: {remarks}. Please upload a clear photo via your ScholarLink portal within 3 business days.',
    renewal:
      'Dear {student_name}, Continuing scholars renewal for AY 2026-2027 2nd Sem is now open. Submit your verified grade slip and COR at the ISPSO office before the deadline.',
    released:
      'Dear {student_name}, Your scholarship stipend of {amount} for {scholarship_name} is ready for claiming on {payout_date} at {venue} ({timeslot}). Bring your validated SAC ID and QR Pass.',
  });
  const [templateSavedAlert, setTemplateSavedAlert] = useState(false);

  // Document Viewer Modal State (View RF / View ID)
  const [docPreviewModal, setDocPreviewModal] = useState<{
    isOpen: boolean;
    studentName: string;
    studentId: string;
    docType: 'RF' | 'ID';
    fileName: string;
    ocrSnippet?: string;
    lrn?: string;
  } | null>(null);

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
  const [batchVenue, setBatchVenue] = useState('SAC Gymnasium - Releasing Counters 1-3');
  const [batchBeneficiaries, setBatchBeneficiaries] = useState(40);
  const [batchAmount, setBatchAmount] = useState(7500);

  // Add Scholarship Modal State
  const [showAddProgModal, setShowAddProgModal] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');
  const [newProgProvider, setNewProgProvider] = useState('');
  const [newProgAmount, setNewProgAmount] = useState('7500');
  const [newProgSlots, setNewProgSlots] = useState('50');

  // Sandbox Tester State
  const [sandboxName, setSandboxName] = useState('Jhon Kylho Estrabo');
  const [sandboxLrn, setSandboxLrn] = useState('115201140091');
  const [sandboxOcrName, setSandboxOcrName] = useState('Jhon Kylho Estrabo');
  const [sandboxOcrLrn, setSandboxOcrLrn] = useState('115201140091');
  const [sandboxRawOcr, setSandboxRawOcr] = useState(
    'ST. ANTHONY COLLEGE SAN JOSE ANTIQUE\nSTUDENT ID: STUDENT-JH-2026\nNAME: Jhon Kylho Estrabo\nDEPED LRN: 115201140091\nCOURSE: BSIT 3\nVALIDATED 1ST SEM'
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
  const totalDisbursedAmount = disbursements
    .filter((d) => d.status === 'CLAIMED')
    .reduce((sum, d) => sum + d.amount, 0) + 4250000;

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
    setScanFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
      record: res.record,
    });

    if (res.success) {
      setScanStudentId('');
    }
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessageText.trim() || !onSendAdminSms) return;

    const targetApp = applications.find((a) => a.student.id === smsTargetStudentId);
    if (!targetApp) return;

    onSendAdminSms(targetApp.student.id, targetApp.student.contactNumber, smsMessageText.trim());
    setSmsMessageText('');
    setSmsStatusAlert(`SMS successfully dispatched to ${targetApp.student.fullName} (${targetApp.student.contactNumber})!`);
    setTimeout(() => setSmsStatusAlert(null), 4000);
  };

  const handleApplyTemplate = (templateKey: keyof typeof smsTemplates) => {
    const targetApp = applications.find((a) => a.student.id === smsTargetStudentId) || applications[0];
    let msg = smsTemplates[templateKey];
    if (targetApp) {
      msg = msg
        .replace('{student_name}', targetApp.student.fullName)
        .replace('{scholarship_name}', targetApp.program.name)
        .replace('{amount}', `₱${targetApp.program.grantAmount.toLocaleString()}`)
        .replace('{payout_date}', 'November 25, 2026')
        .replace('{venue}', 'SAC Gymnasium')
        .replace('{timeslot}', '09:00 AM - 12:00 PM')
        .replace('{reason}', targetApp.deficiencyRemarks || 'qualifying criteria')
        .replace('{remarks}', targetApp.deficiencyRemarks || 'clear copy of validated COR');
    }
    setSmsMessageText(msg);
  };

  // Nav menu items matching user's exact prior UI
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'schemes', label: 'Scholarships', icon: GraduationCap, count: programs.length },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileCheck,
      count: pendingVerifications,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'continuing', label: 'Renewals', icon: RefreshCw, count: applications.filter(a => a.student.yearLevel > 1 && a.status === 'APPROVED').length },
    { id: 'scholars', label: 'Scholar records', icon: Users, count: applications.filter(a => a.status === 'APPROVED').length },
    { id: 'denied', label: 'Not approved', icon: Ban, count: applications.filter(a => a.status === 'REJECTED').length },
    { id: 'settings_sms', label: 'Messages & templates', icon: Sliders },
    { id: 'academic', label: 'Academic records', icon: Award, count: applications.filter(a => a.gwa <= 1.45).length },
    { id: 'payouts', label: 'Payout schedules', icon: QrCode, count: payoutBatches.length },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length },
    { id: 'security', label: 'Activity log', icon: ShieldAlert },
    { id: 'sandbox', label: 'Document check demo', icon: FileCheck },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR - Deep Maroon Brand from User's UI */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-slate-200 bg-white text-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="border-b border-slate-200 px-5 py-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">ISPSO office</p>
            <h2 className="mt-1 font-serif text-xl text-slate-900">Administration</h2>
            <p className="mt-2 text-sm text-slate-600">Scholarship management</p>
            <button onClick={() => setSidebarOpen(false)} className="mt-3 rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 lg:hidden">Close menu</button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Administration services" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="px-3 pb-1 text-xs font-semibold  text-slate-500">
              Office services
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-sac-maroon-50 text-sac-maroon-900 font-semibold border-l-2 border-sac-maroon-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-sac-maroon-800' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? 'bg-white text-sac-maroon-800'
                          : item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4 text-sm text-slate-500">AY 2026–2027 · 1st semester</div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Top Header with Mobile Sidebar Toggle */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-2 text-slate-700 bg-white border border-slate-200 "
              title="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="rounded-md bg-sac-maroon-100 px-2.5 py-0.5 text-sm font-bold text-sac-maroon-800 ">
                  Scholarship administration
                </span>
                <span className="text-sm text-slate-500 font-medium hidden sm:inline">
                  • San Jose de Buenavista, Antique
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {navItems.find((n) => n.id === activeTab)?.label || 'Scholarship Desk'}
              </h1>
            </div>
          </div>

          {/* Global Quick Action Buttons & Staff Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Admin AI Copilot Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-sac-gold-100 border border-sac-gold-300 px-3 py-2 text-sm font-bold text-sac-gold-950 hover:bg-sac-gold-200 transition shadow-sm"
              title="Open ISPSO Admin AI Assistant"
            >
              <Sparkles className="h-4 w-4 text-sac-maroon-800" />
              <span>Admin Copilot</span>
            </button>

            {/* Notification Center Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50 transition shadow-sm"
                title="ISPSO Staff Notifications"
              >
                <Bell className="h-4 w-4 text-slate-600" />
                {notifications.filter((n) => n.unread).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sac-maroon-700 text-[10px] font-bold text-white ring-2 ring-white">
                    {notifications.filter((n) => n.unread).length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-sac-maroon-800 p-3 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-sac-gold-400" />
                      <span className="font-bold text-sm">Staff Notifications</span>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                      }
                      className="text-[11px] text-sac-gold-300 hover:text-white font-medium underline"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.tab);
                          setIsNotificationsOpen(false);
                          setNotifications((prev) =>
                            prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                          );
                        }}
                        className={`p-3 cursor-pointer hover:bg-slate-50 transition flex items-start space-x-2.5 ${
                          item.unread ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {item.type === 'flag' ? (
                            <ShieldAlert className="h-4 w-4 text-rose-600" />
                          ) : item.type === 'payout' ? (
                            <Calendar className="h-4 w-4 text-sac-maroon-800" />
                          ) : item.type === 'sms' ? (
                            <MessageSquare className="h-4 w-4 text-sky-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-900">{item.title}</p>
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-tight">{item.desc}</p>
                        </div>
                        {item.unread && (
                          <span className="h-2 w-2 rounded-full bg-sac-maroon-800 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Close Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="inline-flex items-center space-x-1.5 rounded-md bg-sac-maroon-800 px-3.5 py-2 text-sm font-bold text-white hover:bg-sac-maroon-900 transition"
            >
              <Megaphone className="h-4 w-4" />
              <span>Post announcement</span>
            </button>
            <button
              onClick={() => setShowBatchModal(true)}
              className="inline-flex items-center space-x-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <PlusCircle className="h-4 w-4 text-sac-maroon-800" />
              <span>New Payout Batch</span>
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition"
                title="Sign out of Administrator Console"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODULE 1: DASHBOARD OVERVIEW (With Curve Chart & Quick Alerts)  */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
              <div><h2 className="font-serif text-xl text-slate-900">Applications awaiting review</h2><p className="mt-1 text-sm text-slate-600">{pendingVerifications} applications need a staff review. Check documents before updating a decision.</p></div>
              <button onClick={() => setActiveTab('applications')} className="rounded border border-sac-maroon-800 px-4 py-2 text-sm font-semibold text-sac-maroon-800 hover:bg-sac-maroon-50">Review applications</button>
            </section>
            {/* Summary */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-5 ">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold  text-slate-500">
                    Total Active Scholars
                  </span>
                  <span className="rounded-md bg-sac-maroon-50 p-2.5 text-sac-maroon-800">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-semibold text-slate-900">{totalScholars}</div>
                  <div className="mt-1 flex items-center text-sm font-bold text-emerald-600">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                    <span>8 Active SAC Programs</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 ">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold  text-slate-500">
                    Total Disbursed (Term)
                  </span>
                  <span className="rounded-md bg-emerald-50 p-2.5 text-emerald-600">
                    <Banknote className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-semibold text-slate-900">₱{totalDisbursedAmount.toLocaleString()}</div>
                  <div className="mt-1 text-sm text-slate-500 font-medium">
                    Out of ₱6.8M allocated UniFAST/LGU funds
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 ">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold  text-slate-500">
                    Records to check
                  </span>
                  <span className="rounded-md bg-rose-50 p-2.5 text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-semibold text-rose-600">{flaggedDiscrepancies}</div>
                  <div className="mt-1 text-sm font-bold text-rose-700">
                    Name or LRN needs review
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 ">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold  text-slate-500">
                    Scheduled Payout Batches
                  </span>
                  <span className="rounded-md bg-sac-gold-100 p-2.5 text-sac-gold-700">
                    <Calendar className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-semibold text-slate-900">{payoutBatches.length}</div>
                  <div className="mt-1 text-sm font-bold text-sac-gold-700">
                    Next: Nov 25 (SAC Gymnasium)
                  </div>
                </div>
              </div>
            </div>

            {/* CURVE CHART & MONTHLY RELEASING PROGRESS (From User's Screenshot) */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 ">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Applications and payments by month
                  </h3>
                  <p className="text-sm text-slate-500">
                    Monthly stipend release vs applicant flow (AY 2026-2027 1st Semester)
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-sm font-bold">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-3 rounded-full bg-sac-maroon-800" />
                    <span className="text-slate-600">Disbursed (₱ Millions)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-3 rounded-full bg-sac-gold-500" />
                    <span className="text-slate-600">Scholars Reached</span>
                  </div>
                </div>
              </div>

              {/* Responsive SVG Spline Chart */}
              <div className="mt-6 h-56 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 600 160">
                  <defs>
                    <linearGradient id="maroonGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#780000" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#780000" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="60" x2="580" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="100" x2="580" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="140" x2="580" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Y Axis Labels */}
                  <text x="32" y="24" fontSize="10" fill="#94a3b8" textAnchor="end">₱2.0M</text>
                  <text x="32" y="64" fontSize="10" fill="#94a3b8" textAnchor="end">₱1.5M</text>
                  <text x="32" y="104" fontSize="10" fill="#94a3b8" textAnchor="end">₱1.0M</text>
                  <text x="32" y="144" fontSize="10" fill="#94a3b8" textAnchor="end">₱0.5M</text>

                  {/* Spline Area 1: Maroon (Disbursed) */}
                  <path
                    d="M 60 130 C 130 110, 200 95, 270 70 C 340 50, 420 40, 500 30 L 500 140 L 60 140 Z"
                    fill="url(#maroonGrad)"
                  />
                  <path
                    d="M 60 130 C 130 110, 200 95, 270 70 C 340 50, 420 40, 500 30"
                    fill="none"
                    stroke="#780000"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Spline Area 2: Gold (Scholars) */}
                  <path
                    d="M 60 138 C 130 125, 200 115, 270 85 C 340 65, 420 55, 500 45 L 500 140 L 60 140 Z"
                    fill="url(#goldGrad)"
                  />
                  <path
                    d="M 60 138 C 130 125, 200 115, 270 85 C 340 65, 420 55, 500 45"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />

                  {/* Points on Line */}
                  <circle cx="60" cy="130" r="4.5" fill="#780000" stroke="#fff" strokeWidth="2" />
                  <circle cx="170" cy="105" r="4.5" fill="#780000" stroke="#fff" strokeWidth="2" />
                  <circle cx="270" cy="70" r="4.5" fill="#780000" stroke="#fff" strokeWidth="2" />
                  <circle cx="380" cy="45" r="4.5" fill="#780000" stroke="#fff" strokeWidth="2" />
                  <circle cx="500" cy="30" r="5" fill="#f59e0b" stroke="#780000" strokeWidth="2.5" />

                  {/* Month Labels */}
                  <text x="60" y="156" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">July</text>
                  <text x="170" y="156" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">August</text>
                  <text x="270" y="156" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">September</text>
                  <text x="380" y="156" fontSize="10" fill="#64748b" textAnchor="middle" fontWeight="bold">October</text>
                  <text x="500" y="156" fontSize="10" fill="#780000" textAnchor="middle" fontWeight="black">November (Current)</text>
                </svg>
              </div>
            </div>

            {/* Split Section: Discrepancy Alert Box & Payout Schedule */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Urgent Document Discrepancies */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="h-5 w-5 text-rose-600" />
                    <h3 className="text-base font-semibold text-slate-900">
                      High-Priority Fraud & Verification Alerts
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('applications')}
                    className="text-sm font-bold text-sac-maroon-800 hover:text-sac-maroon-900"
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
                          setActiveTab('applications');
                        }}
                        className="cursor-pointer rounded-md border border-slate-200 p-3.5 hover:border-slate-300 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{app.student.fullName}</p>
                            <p className="text-sm text-slate-500">
                              {app.student.course} • ID: {app.student.studentIdNumber} • LRN: {app.student.lrn}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              app.verification.status === 'DUPLICATE_FLAGGED' ||
                              app.verification.status === 'NAME_MISMATCH'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.verification.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-rose-600 font-medium">
                          {app.verification.issues[0]}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Upcoming Payout Releases */}
              <div className="rounded-lg border border-slate-200 bg-white p-6 ">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-sac-maroon-800" />
                    <h3 className="text-base font-semibold text-slate-900">Active Payout Releases</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('payouts')}
                    className="text-sm font-bold text-sac-maroon-800 hover:text-sac-maroon-900"
                  >
                    Counter Scanner &rarr;
                  </button>
                </div>

                <div className="space-y-3">
                  {payoutBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="rounded-md border border-slate-200 p-3.5 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">{batch.programCode}</span>
                            <span className="text-sm font-semibold text-slate-600">• {batch.batchNumber}</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {batch.scheduledDate} ({batch.startTime} - {batch.endTime}) • {batch.venue}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                            batch.status === 'ONGOING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sac-maroon-100 text-sac-maroon-800'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-medium">
                          Disbursement: {batch.claimedCount} / {batch.totalBeneficiaries} claimed
                        </span>
                        <span className="font-bold text-slate-900">
                          ₱{batch.amountPerStudent.toLocaleString()} / student
                        </span>
                      </div>
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

        {/* ============================================================== */}
        {/* MODULE 2: SCHOLARSHIPS (8 Programs Catalog from User's UI)     */}
        {/* ============================================================== */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  St. Anthony’s College Scholarship Schemes (8 Programs)
                </h2>
                <p className="text-sm text-slate-500">
                  Official roster of institutional, government, and private donor grants active for AY 2026-2027.
                </p>
              </div>
              <button
                onClick={() => setShowAddProgModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-md bg-sac-maroon-800 px-4 py-2 text-sm font-bold text-white  hover:bg-sac-maroon-900 transition self-start sm:self-auto"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Add New Scholarship</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((prog) => (
                <div
                  key={prog.id}
                  className="rounded-lg border border-slate-200 bg-white p-5  flex flex-col justify-between hover: transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-sac-maroon-100 px-2.5 py-1 text-sm font-semibold text-sac-maroon-900">
                        {prog.code}
                      </span>
                      <span className="text-xs font-bold text-slate-500 ">{prog.category}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">{prog.name}</h3>
                    <p className="text-sm text-sac-maroon-700 font-medium">{prog.provider}</p>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {prog.description}
                    </p>

                    <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grant Amount:</span>
                        <span className="font-bold text-slate-900">
                          ₱{prog.grantAmount.toLocaleString()} ({prog.frequency})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Grantees / Slots:</span>
                        <span className="font-bold text-slate-900">
                          {prog.enrolledCount} / {prog.slots} filled
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Application Deadline:</span>
                        <span className="font-bold text-rose-600">{prog.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3 flex justify-between items-center text-sm">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <CheckCircle className="h-3.5 w-3.5" /> Active Program
                    </span>
                    <button
                      onClick={() => {
                        setAppFilterProgram(prog.code);
                        setActiveTab('applications');
                      }}
                      className="font-bold text-sac-maroon-800 hover:underline"
                    >
                      View Applicants &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 3: APPLICATIONS (With Working Document check & View RF/ID)  */}
        {/* ============================================================== */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Student Scholarship Applications
                </h2>
                <p className="text-sm text-slate-500">
                  Cross-referenced against DepEd 12-digit LRN and St. Anthony’s College student records.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                <Check className="h-4 w-4" />
                <span>Review document checks before deciding</span>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 border border-slate-200 ">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student name, ID number, or LRN..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full rounded-md border border-slate-200 pl-9 pr-3 py-2 text-sm focus:ring-sac-maroon-800 focus:outline-none"
                />
              </div>

              <select
                value={appFilterProgram}
                onChange={(e) => setAppFilterProgram(e.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Scholarship Programs</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>

              <select
                value={appFilterStatus}
                onChange={(e) => setAppFilterStatus(e.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Application Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="NEEDS_MANUAL_REVIEW">Needs Review</option>
                <option value="DEFICIENT">Deficient</option>
                <option value="REJECTED">Denied / Rejected</option>
              </select>
            </div>

            {/* Applications Table Matching User's Screenshot Structure */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Student ID</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Scholarship Applied</th>
                      <th className="px-4 py-3.5">Course & Year</th>
                      <th className="px-4 py-3.5">GWA</th>
                      <th className="px-4 py-3.5">Documents</th>
                      <th className="px-4 py-3.5">Document check</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applications
                      .filter((app) => {
                        const q = appSearch.toLowerCase();
                        const matchesSearch =
                          app.student.fullName.toLowerCase().includes(q) ||
                          app.student.studentIdNumber.toLowerCase().includes(q) ||
                          app.student.lrn.includes(q);
                        const matchesProg =
                          appFilterProgram === 'ALL' || app.program.code === appFilterProgram;
                        const matchesStatus =
                          appFilterStatus === 'ALL' || app.status === appFilterStatus;
                        return matchesSearch && matchesProg && matchesStatus;
                      })
                      .map((app) => {
                        return (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                              {app.student.studentIdNumber}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">{app.student.fullName}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                LRN: {app.student.lrn}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-sac-maroon-800">
                              {app.program.code}
                            </td>
                            <td className="px-4 py-3.5 text-slate-600 font-medium">
                              {app.student.course}
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                              {app.gwa.toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() =>
                                    setDocPreviewModal({
                                      isOpen: true,
                                      studentName: app.student.fullName,
                                      studentId: app.student.studentIdNumber,
                                      docType: 'RF',
                                      fileName: `${app.student.fullName.replace(/\s+/g, '_')}_COR_1stSem.pdf`,
                                      ocrSnippet: app.verification.ocrSnippet,
                                      lrn: app.student.lrn,
                                    })
                                  }
                                  className="inline-flex items-center rounded-lg bg-sac-maroon-50 px-2 py-1 text-xs font-bold text-sac-maroon-800 hover:bg-sac-maroon-100 transition border border-sac-maroon-200"
                                >
                                  View RF
                                </button>
                                <button
                                  onClick={() =>
                                    setDocPreviewModal({
                                      isOpen: true,
                                      studentName: app.student.fullName,
                                      studentId: app.student.studentIdNumber,
                                      docType: 'ID',
                                      fileName: `${app.student.fullName.replace(/\s+/g, '_')}_ID.jpg`,
                                      ocrSnippet: app.verification.ocrSnippet,
                                      lrn: app.student.lrn,
                                    })
                                  }
                                  className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition border border-slate-300"
                                >
                                  View ID
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {/* Working Document check (Replacing "Scan Failed" from prior UI) */}
                              {app.verification.status === 'VERIFIED' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                  <Check className="h-3 w-3" />
                                  {app.verification.nameSimilarityScore}% Matched (Valid)
                                </span>
                              ) : app.verification.status === 'NEEDS_MANUAL_REVIEW' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                  <AlertTriangle className="h-3 w-3" />
                                  {app.verification.nameSimilarityScore}% Review Needed
                                </span>
                              ) : app.verification.status === 'DUPLICATE_FLAGGED' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                                  <X className="h-3 w-3" />
                                  Duplicate Hash Flag
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                                  <X className="h-3 w-3" />
                                  Name Mismatch ({app.verification.nameSimilarityScore}%)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => setSelectedApp(app)}
                                  className="rounded-lg bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200"
                                  title="Audit & Inspect"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {app.status !== 'APPROVED' && (
                                  <button
                                    onClick={() => onUpdateApplicationStatus(app.id, 'APPROVED')}
                                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white hover:bg-emerald-700 "
                                  >
                                    Approve
                                  </button>
                                )}
                                {app.status !== 'REJECTED' && (
                                  <button
                                    onClick={() => onUpdateApplicationStatus(app.id, 'REJECTED', 'Did not meet criteria')}
                                    className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-bold text-white hover:bg-rose-700 "
                                  >
                                    Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 4: CONTINUING LIST (Renewal Tracking from User's UI)     */}
        {/* ============================================================== */}
        {activeTab === 'continuing' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Continuing Scholar records (AY 2026-2027)
                </h2>
                <p className="text-sm text-slate-500">
                  Scholars advancing to higher curriculum years; monitors grade retention and re-enrollment compliance.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-sac-maroon-800 bg-sac-maroon-50 px-3 py-1.5 rounded-md border border-sac-maroon-200">
                <RefreshCw className="h-4 w-4 text-sac-gold-500" />
                <span>Retention GWA Cutoff: &le; 2.25</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Student ID</th>
                      <th className="px-4 py-3.5">Continuing Scholar</th>
                      <th className="px-4 py-3.5">Degree & Year</th>
                      <th className="px-4 py-3.5">Grant Program</th>
                      <th className="px-4 py-3.5">Recorded GWA</th>
                      <th className="px-4 py-3.5">Retention Status</th>
                      <th className="px-4 py-3.5 text-right">Renewal Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applications
                      .filter((a) => a.student.yearLevel > 1 && a.status === 'APPROVED')
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {app.student.studentIdNumber}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{app.student.fullName}</div>
                            <div className="text-xs text-slate-500">{app.student.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {app.student.course} • Year {app.student.yearLevel}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-sac-maroon-800">
                            {app.program.name} ({app.program.code})
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {app.gwa.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5">
                            {app.gwa <= 1.75 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                <Check className="h-3 w-3" /> Excellent Standing
                              </span>
                            ) : app.gwa <= 2.25 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                                <Check className="h-3 w-3" /> Eligible for Renewal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                <AlertTriangle className="h-3 w-3" /> GWA Review Required
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSmsTargetStudentId(app.student.id);
                                handleApplyTemplate('renewal');
                                setActiveTab('settings_sms');
                              }}
                              className="rounded-lg bg-sac-maroon-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-sac-maroon-900 transition "
                            >
                              Send Renewal SMS
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

        {/* ============================================================== */}
        {/* MODULE 5: SCHOLARS LIST (Active Grantees & Claim Status)       */}
        {/* ============================================================== */}
        {activeTab === 'scholars' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Official SAC Scholars Roster
                </h2>
                <p className="text-sm text-slate-500">
                  Active grantees currently validated for financial stipend disbursement and tuition grants.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                <CheckCircle className="h-4 w-4" />
                <span>Total Active Grantees: {applications.filter(a => a.status === 'APPROVED').length}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Student ID</th>
                      <th className="px-4 py-3.5">Scholar Name</th>
                      <th className="px-4 py-3.5">Program</th>
                      <th className="px-4 py-3.5">Grant Amount</th>
                      <th className="px-4 py-3.5">Release Status</th>
                      <th className="px-4 py-3.5">Digital Pass</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applications
                      .filter((a) => a.status === 'APPROVED')
                      .map((app) => {
                        const claimedRecord = disbursements.find(
                          (d) => d.studentIdNumber.toLowerCase() === app.student.studentIdNumber.toLowerCase() && d.status === 'CLAIMED'
                        );
                        return (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                              {app.student.studentIdNumber}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-900">{app.student.fullName}</div>
                              <div className="text-xs text-slate-500 font-mono">{app.student.contactNumber}</div>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-sac-maroon-800">
                              {app.program.name} ({app.program.code})
                            </td>
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                              ₱{app.program.grantAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5">
                              {claimedRecord ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                  <Check className="h-3 w-3" /> Disbursed ({claimedRecord.referenceNumber})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sac-gold-100 px-2.5 py-0.5 text-xs font-bold text-sac-gold-800">
                                  <Clock className="h-3 w-3" /> Scheduled Nov 25
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700">
                                <QrCode className="h-3.5 w-3.5 text-sac-maroon-800" /> PASS-2026-ACTIVE
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSmsTargetStudentId(app.student.id);
                                  handleApplyTemplate('released');
                                  setActiveTab('settings_sms');
                                }}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                              >
                                Send Payout SMS
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 6: DENIED LIST (Disqualified / Fraud Applicants)        */}
        {/* ============================================================== */}
        {activeTab === 'denied' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Denied & Disqualified Applications
                </h2>
                <p className="text-sm text-slate-500">
                  Applicants failing LRN authentication, minimum GWA thresholds, or document verification.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-md border border-rose-200">
                <Ban className="h-4 w-4" />
                <span>Total Denied: {applications.filter(a => a.status === 'REJECTED').length}</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Student ID</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Program Applied</th>
                      <th className="px-4 py-3.5">Recorded GWA</th>
                      <th className="px-4 py-3.5">Denial Reason & Disqualification Remarks</th>
                      <th className="px-4 py-3.5">Appeal Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applications
                      .filter((a) => a.status === 'REJECTED')
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {app.student.studentIdNumber}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{app.student.fullName}</div>
                            <div className="text-xs text-slate-500 font-mono">LRN: {app.student.lrn}</div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-sac-maroon-800">
                            {app.program.code}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {app.gwa.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 text-rose-700 font-medium max-w-xs">
                            {app.deficiencyRemarks || app.verification.issues[0] || 'Criteria not met'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                              Appeal Period Open (5 Days)
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSmsTargetStudentId(app.student.id);
                                handleApplyTemplate('rejected');
                                setActiveTab('settings_sms');
                              }}
                              className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                            >
                              Send Notice SMS
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

        {/* ============================================================== */}
        {/* MODULE 7: SMS & RELEASING SETTINGS (5 Templates + 2-Way Chat) */}
        {/* ============================================================== */}
        {activeTab === 'settings_sms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  SMS Notification Templates & Direct Student Chat
                </h2>
                <p className="text-sm text-slate-500">
                  Configure automated SMS templates and message students directly through verified mobile numbers.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>PhilSMS / Semaphore Gateway: Connected (SAC-ISPSO)</span>
              </div>
            </div>

            {templateSavedAlert && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm font-bold text-emerald-800 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>SMS Notification Templates updated successfully!</span>
              </div>
            )}

            {/* 5 Customizable SMS Templates (From User's Screenshot 2026-05-11 222054.png) */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 ">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Automated SMS Notification Templates
                  </h3>
                  <p className="text-sm text-slate-500">
                    Variables available: <code className="bg-slate-100 px-1 py-0.5 rounded text-sac-maroon-800">{'{student_name}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sac-maroon-800">{'{scholarship_name}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sac-maroon-800">{'{amount}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sac-maroon-800">{'{payout_date}'}</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-sac-maroon-800">{'{venue}'}</code>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTemplateSavedAlert(true);
                    setTimeout(() => setTemplateSavedAlert(false), 3000);
                  }}
                  className="rounded-md bg-sac-maroon-800 px-4 py-2 text-sm font-bold text-white  hover:bg-sac-maroon-900 transition"
                >
                  Save Templates
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Approved SMS */}
                <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-emerald-800">1. Application Approved SMS</span>
                    <button
                      onClick={() => handleApplyTemplate('approved')}
                      className="text-xs font-bold text-sac-maroon-800 hover:underline"
                    >
                      Use In Chat &darr;
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={smsTemplates.approved}
                    onChange={(e) => setSmsTemplates({ ...smsTemplates, approved: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-sac-maroon-800"
                  />
                </div>

                {/* 2. Rejected SMS */}
                <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-rose-800">2. Application Denied / Rejected SMS</span>
                    <button
                      onClick={() => handleApplyTemplate('rejected')}
                      className="text-xs font-bold text-sac-maroon-800 hover:underline"
                    >
                      Use In Chat &darr;
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={smsTemplates.rejected}
                    onChange={(e) => setSmsTemplates({ ...smsTemplates, rejected: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-sac-maroon-800"
                  />
                </div>

                {/* 3. Deficiency SMS */}
                <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-amber-800">3. Review / Deficiency Notice SMS</span>
                    <button
                      onClick={() => handleApplyTemplate('deficiency')}
                      className="text-xs font-bold text-sac-maroon-800 hover:underline"
                    >
                      Use In Chat &darr;
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={smsTemplates.deficiency}
                    onChange={(e) => setSmsTemplates({ ...smsTemplates, deficiency: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-sac-maroon-800"
                  />
                </div>

                {/* 4. Renewal Notice SMS */}
                <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-blue-800">4. Continuing Renewal SMS</span>
                    <button
                      onClick={() => handleApplyTemplate('renewal')}
                      className="text-xs font-bold text-sac-maroon-800 hover:underline"
                    >
                      Use In Chat &darr;
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={smsTemplates.renewal}
                    onChange={(e) => setSmsTemplates({ ...smsTemplates, renewal: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-sac-maroon-800"
                  />
                </div>

                {/* 5. Released / Payout SMS */}
                <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60 md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-sac-maroon-800">5. Stipend Payout Releasing SMS</span>
                    <button
                      onClick={() => handleApplyTemplate('released')}
                      className="text-xs font-bold text-sac-maroon-800 hover:underline"
                    >
                      Use In Chat &darr;
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={smsTemplates.released}
                    onChange={(e) => setSmsTemplates({ ...smsTemplates, released: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm font-mono bg-white focus:outline-none focus:ring-1 focus:ring-sac-maroon-800"
                  />
                </div>
              </div>
            </div>

            {/* DIRECT 2-WAY MOBILE SMS CHAT DESK */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Student Selector */}
              <div className="rounded-lg border border-slate-200 bg-white p-4  space-y-2">
                <h3 className="text-sm font-bold  text-slate-500 mb-3">
                  Registered Student Mobile Contacts
                </h3>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                  {applications.map((app) => (
                    <button
                      key={app.student.id}
                      onClick={() => {
                        setSmsTargetStudentId(app.student.id);
                        setSmsStatusAlert(null);
                      }}
                      className={`w-full rounded-md p-3 text-left transition border ${
                        smsTargetStudentId === app.student.id
                          ? 'bg-sac-maroon-50 border-sac-maroon-300 ring-1 ring-sac-maroon-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{app.student.fullName}</span>
                        <span className="text-xs font-mono font-bold text-sac-maroon-800 bg-sac-maroon-100 px-1.5 py-0.5 rounded">
                          {app.program.code}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>{app.student.contactNumber}</span>
                        <span>ID: {app.student.studentIdNumber}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Thread & Dispatcher */}
              <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-5  flex flex-col justify-between">
                {(() => {
                  const targetApp =
                    applications.find((a) => a.student.id === smsTargetStudentId) || applications[0];
                  const studentMessages = smsMessages.filter(
                    (m) =>
                      m.studentId === targetApp?.student.id ||
                      m.mobileNumber === targetApp?.student.contactNumber
                  );

                  return (
                    <>
                      <div>
                        {/* Conversation Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <span>{targetApp?.student.fullName}</span>
                              <span className="text-sm text-slate-500 font-mono font-normal">
                                ({targetApp?.student.contactNumber})
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                              {targetApp?.student.course} • Enrolled: {targetApp?.program.name}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            Verified Mobile Carrier
                          </span>
                        </div>

                        {smsStatusAlert && (
                          <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-sm text-emerald-700 font-medium">
                            {smsStatusAlert}
                          </div>
                        )}

                        {/* Message History */}
                        <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                          {studentMessages.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-500">
                              No SMS text history with this student yet. Choose a template or write below to send.
                            </div>
                          ) : (
                            studentMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${
                                  msg.direction === 'OUTBOUND' ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div
                                  className={`max-w-md rounded-lg p-3.5 text-sm  ${
                                    msg.direction === 'OUTBOUND'
                                      ? 'bg-sac-maroon-800 text-white rounded-br-none'
                                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                                  }`}
                                >
                                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-500">
                                  <span>{msg.sender}</span>
                                  <span>&bull;</span>
                                  <span>{msg.timestamp.slice(11, 16)}</span>
                                  {msg.status && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="font-semibold text-emerald-600">{msg.status}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* SMS Input Box */}
                      <form onSubmit={handleSendSms} className="mt-4 pt-3 border-t border-slate-200">
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={smsMessageText}
                            onChange={(e) => setSmsMessageText(e.target.value)}
                            placeholder={`Type official SMS to ${targetApp?.student.fullName} (${targetApp?.student.contactNumber})...`}
                            className="flex-1 rounded-md border border-slate-300 p-2.5 text-sm focus:ring-sac-maroon-800 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!smsMessageText.trim()}
                            className="self-end rounded-md bg-sac-maroon-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-sac-maroon-900 transition disabled:opacity-50 flex items-center space-x-1.5 "
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Send SMS</span>
                          </button>
                        </div>
                        <div className="mt-1 flex justify-between items-center text-xs text-slate-500">
                          <span>Standard GSM 160 characters • Direct to student phone carrier</span>
                          <span>{smsMessageText.length} chars</span>
                        </div>
                      </form>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 8: ACADEMIC LIST (Dean's List / Top 1 Honors)          */}
        {/* ============================================================== */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Academic Excellence & Dean’s List Roster (Top 1)
                </h2>
                <p className="text-sm text-slate-500">
                  Ranking of highest academic achievers eligible for automatic Anthonian Academic or Entrance grants.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-sac-gold-800 bg-sac-gold-100 px-3 py-1.5 rounded-md border border-sac-gold-300">
                <Award className="h-4 w-4" />
                <span>President&apos;s & Dean&apos;s Honors Cutoff: GWA &le; 1.45</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Rank</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Student ID</th>
                      <th className="px-4 py-3.5">Degree & Year</th>
                      <th className="px-4 py-3.5">GWA</th>
                      <th className="px-4 py-3.5">Recommended Honor Scholarship</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {applications
                      .filter((a) => a.gwa <= 1.45)
                      .sort((a, b) => a.gwa - b.gwa)
                      .map((app, idx) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                idx === 0
                                  ? 'bg-sac-gold-500 text-sac-maroon-950 ring-2 ring-sac-gold-300'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-900'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{app.student.fullName}</div>
                            <div className="text-xs text-slate-500">{app.student.email}</div>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {app.student.studentIdNumber}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {app.student.course}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-sac-maroon-800 text-sm">
                            {app.gwa.toFixed(2)}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">
                            Anthonian Academic Excellence (₱7,500 100% Tuition Discount)
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => {
                                setSmsTargetStudentId(app.student.id);
                                setSmsMessageText(
                                  `Dear ${app.student.fullName}, Congratulations on achieving GWA ${app.gwa} and earning Rank #${idx + 1} on the Dean's List! You are awarded the Anthonian Academic Excellence grant.`
                                );
                                setActiveTab('settings_sms');
                              }}
                              className="rounded-lg bg-sac-maroon-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-sac-maroon-900 transition "
                            >
                              Award & Notify
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

        {/* ============================================================== */}
        {/* MODULE 9: RELEASING & PAYOUTS (With Live QR Counter Scanner)  */}
        {/* ============================================================== */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Scholarship Releasing & Campus Payout Schedule
                </h2>
                <p className="text-sm text-slate-500">
                  Batched disbursement timeslots at the SAC Gymnasium; prevents overcrowding and replaces uncoordinated Facebook posts.
                </p>
              </div>
            </div>

            {/* LIVE QR SCANNER RELEASING COUNTER */}
            <div className="rounded-lg border-2 border-dashed border-sac-maroon-300 bg-sac-maroon-50/40 p-6 ">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sac-maroon-800 text-white ">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      ISPSO Releasing Desk — Rapid Counter Scanner
                    </h3>
                    <p className="text-sm text-slate-600">
                      Scan student QR Pass or enter Student Number at Counter 1-3 to disburse stipend.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-bold text-slate-700">Active Batch:</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-sac-maroon-900 "
                  >
                    {payoutBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.programCode} - {b.batchNumber} (₱{b.amountPerStudent.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fast Form */}
              <form onSubmit={handleScanClaim} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={scanStudentId}
                    onChange={(e) => setScanStudentId(e.target.value)}
                    placeholder="Enter or scan Student Number (e.g. STUDENT-JH-2026 or 2024-00812)..."
                    className="w-full rounded-md border border-sac-maroon-300 p-3 text-sm font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-sac-maroon-800 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-sac-maroon-800 px-6 py-3 text-sm font-semibold text-white  hover:bg-sac-maroon-900 transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify & Disburse Cash</span>
                </button>
              </form>

              {/* Scan Feedback Alert */}
              {scanFeedback && (
                <div
                  className={`mt-4 rounded-md p-4 text-sm font-medium border ${
                    scanFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    {scanFeedback.type === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    )}
                    <span>{scanFeedback.message}</span>
                  </div>
                  {scanFeedback.record && (
                    <div className="mt-2 text-sm font-mono">
                      Ref Number: <span className="font-bold">{scanFeedback.record.referenceNumber}</span> • Method: Digital QR Pass • Staff: {scanFeedback.record.verifiedByStaff}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payout Batches List */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {payoutBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="rounded-lg border border-slate-200 bg-white p-5  space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="rounded-lg bg-sac-maroon-100 px-2.5 py-0.5 text-sm font-semibold text-sac-maroon-900">
                          {batch.programCode}
                        </span>
                        <span className="text-sm font-bold text-slate-500">{batch.batchNumber}</span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-slate-900">
                        ₱{batch.amountPerStudent.toLocaleString()}{' '}
                        <span className="text-sm text-slate-500 font-normal">per grantee stipend</span>
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                        batch.status === 'ONGOING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sac-gold-100 text-sac-gold-800'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div className="rounded-md bg-slate-50 p-3 text-sm space-y-2 border border-slate-100">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-sac-maroon-800" />
                      <span className="font-semibold">{batch.scheduledDate}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-sac-maroon-800" />
                      <span>{batch.startTime} – {batch.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-700">
                      <span className="font-bold text-slate-500">Venue:</span>
                      <span>{batch.venue}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                      <span>Disbursed:</span>
                      <span>{batch.claimedCount} of {batch.totalBeneficiaries} students</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.round((batch.claimedCount / batch.totalBeneficiaries) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 10: ANNOUNCEMENTS HUB (Syncing FB Posts Directly)       */}
        {/* ============================================================== */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Official ISPSO Announcements
                </h2>
                <p className="text-sm text-slate-500">
                  Centralized student broadcast channel; syncs notices with direct Push &amp; SMS delivery (replaces Facebook).
                </p>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center space-x-1.5 rounded-md bg-sac-maroon-800 px-4 py-2 text-sm font-bold text-white  hover:bg-sac-maroon-900 transition self-start sm:self-auto"
              >
                <Megaphone className="h-4 w-4" />
                <span>+ Broadcast New Announcement</span>
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="rounded-lg border border-slate-200 bg-white p-5  hover: transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="rounded-lg bg-sac-maroon-100 px-2 py-0.5 text-sm font-bold text-sac-maroon-800">
                          {ann.category}
                        </span>
                        <span className="text-sm text-slate-500">
                          {ann.publishedAt.slice(0, 10)} by {ann.author}
                        </span>
                        {ann.facebookSynced && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 border border-blue-200">
                            FB Synced ✓
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 text-base font-bold text-slate-900">{ann.title}</h3>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ann.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : ann.priority === 'HIGH'
                          ? 'bg-sac-gold-100 text-sac-gold-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ann.priority} PRIORITY
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>

                  {ann.payoutBatchDetails && (
                    <div className="mt-3 rounded-md bg-sac-gold-50/60 p-3 border border-sac-gold-200 text-sm">
                      <p className="font-bold text-sac-gold-900">
                        Payout Event: {ann.payoutBatchDetails.date} ({ann.payoutBatchDetails.time}) @ {ann.payoutBatchDetails.venue}
                      </p>
                      <p className="mt-1 text-slate-600">
                        Requirements:{' '}
                        <span className="font-medium">
                          {ann.payoutBatchDetails.requirements.join(', ')}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 11: AUDIT LOGS (RA 10173 Philippine Data Privacy Act)  */}
        {/* ============================================================== */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Data Privacy & Compliance Audit Trail
                </h2>
                <p className="text-sm text-slate-500">
                  Immutable record of staff document views, status updates, SMS dispatches, and student data access per Republic Act 10173.
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                <span>RA 10173 Privacy Compliance: Verified</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold  text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Timestamp</th>
                      <th className="px-4 py-3.5">Action Code</th>
                      <th className="px-4 py-3.5">Actor</th>
                      <th className="px-4 py-3.5">Target / Record</th>
                      <th className="px-4 py-3.5">Audit Event Details</th>
                      <th className="px-4 py-3.5">IP Address</th>
                      <th className="px-4 py-3.5 text-right">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                          {log.timestamp.replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {log.action}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">
                          {log.performedBy}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-sac-maroon-800">
                          {log.target}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-sm">
                          {log.details}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">
                          {log.ipAddress}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : log.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODULE 12: AI VERIFICATION SANDBOX (Interactive Testing Lab)  */}
        {/* ============================================================== */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Document check demonstration
              </h2>
              <p className="text-sm text-slate-500">
                Use sample details to see how student names and Learner Reference Numbers are compared.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-6  space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Input Parameters (Simulated OCR Document vs Registered SAC Profile)
                </h3>

                <div>
                  <label className="text-sm font-bold text-slate-700">Registered Student Name (@sac.edu.ph):</label>
                  <input
                    type="text"
                    value={sandboxName}
                    onChange={(e) => setSandboxName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">Registered 12-Digit DepEd LRN:</label>
                  <input
                    type="text"
                    value={sandboxLrn}
                    onChange={(e) => setSandboxLrn(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-slate-700">OCR Extracted Name on ID:</label>
                    <input
                      type="text"
                      value={sandboxOcrName}
                      onChange={(e) => setSandboxOcrName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700">OCR Extracted LRN on ID:</label>
                    <input
                      type="text"
                      value={sandboxOcrLrn}
                      onChange={(e) => setSandboxOcrLrn(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRunSandbox}
                  className="w-full rounded-md bg-sac-maroon-800 py-3 text-sm font-semibold text-white  hover:bg-sac-maroon-900 transition flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Execute Verification Algorithm</span>
                </button>
              </div>

              {/* Output Result */}
              <div className="rounded-lg border border-slate-200 bg-slate-900 p-6 text-white font-mono text-sm ">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-emerald-400">ENGINE_AUDIT_REPORT.JSON</span>
                  <span className="text-xs text-slate-500">Jaro-Winkler + LRN Evaluator</span>
                </div>

                {sandboxResult ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Status Verdict:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
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
                      <span className="text-slate-500">Confidence Score:</span>
                      <span className="font-bold text-white">{sandboxResult.confidenceScore} / 100</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Name Match Similarity:</span>
                      <span className="font-bold text-slate-200">
                        {sandboxResult.nameSimilarityScore}%
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">12-Digit LRN Valid:</span>
                      <span
                        className={
                          sandboxResult.lrnValid ? 'text-emerald-400' : 'text-rose-400 font-bold'
                        }
                      >
                        {sandboxResult.lrnValid ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-500">Heuristic Issues Detected:</span>
                      {sandboxResult.issues.length === 0 ? (
                        <p className="mt-1 text-emerald-400 font-sans">
                          No discrepancies found. Identity verified successfully.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-1 text-rose-300 font-sans text-sm">
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
                  <div className="mt-16 text-center text-slate-500 font-sans">
                    Click &quot;Execute Verification Algorithm&quot; to test.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: SIDE-BY-SIDE APPLICATION AUDIT INSPECTION MODAL       */}
      {/* ============================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-sac-maroon-800 text-white rounded-t-3xl">
              <div>
                <h3 className="text-base font-semibold">
                  Document Audit &amp; Verification: {selectedApp.student.fullName}
                </h3>
                <p className="text-sm text-sac-gold-300">
                  Student ID: {selectedApp.student.studentIdNumber} • Program: {selectedApp.program.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-lg p-1.5 text-sac-maroon-200 hover:bg-sac-maroon-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-6 gap-6">
              {/* Document Visual */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold  text-slate-500">
                  Uploaded Document Preview (Student ID / COR)
                </h4>
                <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <div className="w-full max-w-xs mx-auto rounded-md border border-slate-300 bg-white p-4  text-left font-mono text-xs space-y-2">
                    <div className="text-center border-b border-slate-200 pb-2">
                      <SacSeal className="h-8 w-8 mx-auto mb-1" size={32} />
                      <p className="font-bold text-sm text-sac-maroon-900">ST. ANTHONY’S COLLEGE</p>
                      <p className="text-xs text-slate-500">San Jose de Buenavista, Antique</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Student Name:</p>
                      <p className="font-bold text-slate-900">{selectedApp.verification.extractedName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Learner Ref No. (LRN):</p>
                      <p className="font-bold text-slate-900">{selectedApp.verification.extractedLrn}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Student Number:</p>
                      <p className="font-bold text-slate-900">{selectedApp.student.studentIdNumber}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-emerald-600 font-bold">1ST SEMESTER 2026-2027</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">VALIDATED</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    File: {selectedApp.documents[0]?.fileName || 'ID_Photo.jpg'} (SHA256 Validated)
                  </p>
                </div>

                {selectedApp.verification.ocrSnippet && (
                  <div className="rounded-md bg-slate-100 p-3 font-mono text-xs text-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">OCR Raw Extracted Text:</p>
                    <pre className="whitespace-pre-wrap">{selectedApp.verification.ocrSnippet}</pre>
                  </div>
                )}
              </div>

              {/* AI Discrepancy Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold  text-slate-500">
                  Anti-Fraud & Verification Checkpoints
                </h4>

                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Verification Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-sm ${
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

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Name Match Score:</span>
                    <span className="font-bold text-slate-900">
                      {selectedApp.verification.nameSimilarityScore}% (Jaro-Winkler)
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Registered DepEd LRN:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.student.lrn}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Document LRN:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedApp.verification.extractedLrn}</span>
                  </div>

                  {selectedApp.verification.issues.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-sm font-bold text-rose-700 mb-1">Detected Issues:</p>
                      <ul className="space-y-1 text-sm text-rose-600">
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

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Coordinator Deficiency Remarks (Sent via SMS):
                  </label>
                  <textarea
                    rows={2}
                    value={deficiencyNote}
                    onChange={(e) => setDeficiencyNote(e.target.value)}
                    placeholder="e.g. Please re-upload a clearer image of your ID showing the 1st Sem sticker."
                    className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm focus:ring-sac-maroon-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      onUpdateApplicationStatus(selectedApp.id, 'APPROVED');
                      setSelectedApp(null);
                    }}
                    className="flex-1 rounded-md bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => {
                      onUpdateApplicationStatus(selectedApp.id, 'DEFICIENT', deficiencyNote);
                      setSelectedApp(null);
                    }}
                    className="flex-1 rounded-md bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600 transition"
                  >
                    Flag Deficiency
                  </button>
                  <button
                    onClick={() => {
                      onUpdateApplicationStatus(selectedApp.id, 'REJECTED', deficiencyNote || 'Disqualified');
                      setSelectedApp(null);
                    }}
                    className="flex-1 rounded-md bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition"
                  >
                    Deny Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DOCUMENT PREVIEW MODAL (View RF / View ID)            */}
      {/* ============================================================== */}
      {docPreviewModal && docPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-sac-maroon-800 px-5 py-4 bg-sac-maroon-800 text-white">
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-white" />
                <h3 className="text-sm font-bold">
                  {docPreviewModal.docType === 'RF' ? 'Registration Form (COR)' : 'Official Student ID'}
                </h3>
              </div>
              <button
                onClick={() => setDocPreviewModal(null)}
                className="rounded-lg p-1 text-sac-maroon-200 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                <SacSeal className="h-12 w-12 mx-auto mb-2" size={48} />
                <h4 className="font-semibold text-sm text-sac-maroon-900 uppercase">
                  St. Anthony’s College
                </h4>
                <p className="text-xs text-slate-500 font-medium">San Jose de Buenavista, Antique</p>

                <div className="mt-4 rounded-md bg-white p-4 border border-slate-200  text-left text-sm font-mono space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-2 font-bold">
                    <span>{docPreviewModal.docType === 'RF' ? 'OFFICIAL CERTIFICATE OF REGISTRATION' : 'TERTIARY STUDENT IDENTIFICATION CARD'}</span>
                    <span className="text-emerald-600">VALIDATED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-xs">STUDENT NAME:</span>
                      <span className="font-bold text-slate-900">{docPreviewModal.studentName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">STUDENT ID NO:</span>
                      <span className="font-bold text-slate-900">{docPreviewModal.studentId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">DEPED 12-DIGIT LRN:</span>
                      <span className="font-bold text-slate-900">{docPreviewModal.lrn || '115201140091'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">TERM:</span>
                      <span className="font-bold text-slate-900">1ST SEM AY 2026-2027</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>File: {docPreviewModal.fileName}</span>
                  <span className="font-mono text-emerald-600 font-bold">DIGITAL_SEAL_VERIFIED ✓</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDocPreviewModal(null)}
                className="rounded-md bg-sac-maroon-800 px-4 py-2 text-sm font-bold text-white  hover:bg-sac-maroon-900"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: BROADCAST ANNOUNCEMENT MODAL                          */}
      {/* ============================================================== */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-sac-maroon-800 px-6 py-4 bg-sac-maroon-800 text-white">
              <h3 className="text-base font-semibold">Post an announcement</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="rounded-lg p-1 text-sac-maroon-200 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newAnnTitle.trim() || !newAnnContent.trim()) return;
                onAddAnnouncement({
                  title: newAnnTitle.trim(),
                  category: newAnnCategory,
                  priority: newAnnPriority,
                  targetProgram: newAnnProgram,
                  content: newAnnContent.trim(),
                  author: 'ISPSO Admin Desk',
                  facebookSynced: true,
                });
                setShowAnnouncementModal(false);
                setNewAnnTitle('');
                setNewAnnContent('');
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-sm font-bold text-slate-700">Notice Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule of Releasing for TDP-TES Batch 1 Beneficiaries"
                  value={newAnnTitle}
                  onChange={(e) => setNewAnnTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm font-medium focus:ring-sac-maroon-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700">Category:</label>
                  <select
                    value={newAnnCategory}
                    onChange={(e) => setNewAnnCategory(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-semibold"
                  >
                    <option value="PAYOUT">Payout Release</option>
                    <option value="APPLICATION">New Application</option>
                    <option value="DEADLINE">Deadline Alert</option>
                    <option value="REQUIREMENT">Document Notice</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Priority Level:</label>
                  <select
                    value={newAnnPriority}
                    onChange={(e) => setNewAnnPriority(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-semibold"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="CRITICAL">Critical Urgent</option>
                    <option value="NORMAL">Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Announcement Content:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide full instructions, required documents, and SAC Gym timeslots..."
                  value={newAnnContent}
                  onChange={(e) => setNewAnnContent(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2.5 text-sm leading-relaxed focus:ring-sac-maroon-800 focus:outline-none"
                />
              </div>

              <div className="rounded-md bg-sac-maroon-50 p-3 text-xs text-sac-maroon-900 border border-sac-maroon-200">
                Notice will automatically push to all registered <code className="font-bold">@sac.edu.ph</code> student devices and dispatch SMS alerts!
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sac-maroon-800 px-5 py-2 text-sm font-semibold text-white  hover:bg-sac-maroon-900"
                >
                  Broadcast to Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: NEW PAYOUT BATCH MODAL                                */}
      {/* ============================================================== */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-sac-maroon-800 px-6 py-4 bg-sac-maroon-800 text-white">
              <h3 className="text-base font-semibold">Schedule New Payout Releasing Batch</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="rounded-lg p-1 text-sac-maroon-200 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const prog = programs.find((p) => p.id === batchProgId) || programs[0];
                onAddPayoutBatch({
                  programId: prog.id,
                  programCode: prog.code,
                  batchNumber: batchNumber || `Batch ${payoutBatches.length + 1}`,
                  scheduledDate: batchDate,
                  startTime: batchStartTime,
                  endTime: batchEndTime,
                  venue: batchVenue,
                  totalBeneficiaries: Number(batchBeneficiaries),
                  amountPerStudent: Number(batchAmount),
                  status: 'UPCOMING',
                });
                setShowBatchModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-sm font-bold text-slate-700">Scholarship Program:</label>
                <select
                  value={batchProgId}
                  onChange={(e) => {
                    setBatchProgId(e.target.value);
                    const p = programs.find((pr) => pr.id === e.target.value);
                    if (p) setBatchAmount(p.grantAmount);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-semibold"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700">Batch Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Batch 1 - Morning"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Releasing Date:</label>
                  <input
                    type="date"
                    required
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700">Start Time:</label>
                  <input
                    type="text"
                    value={batchStartTime}
                    onChange={(e) => setBatchStartTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">End Time:</label>
                  <input
                    type="text"
                    value={batchEndTime}
                    onChange={(e) => setBatchEndTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">Venue on Campus:</label>
                <input
                  type="text"
                  value={batchVenue}
                  onChange={(e) => setBatchVenue(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700">Number of Students:</label>
                  <input
                    type="number"
                    value={batchBeneficiaries}
                    onChange={(e) => setBatchBeneficiaries(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Stipend Amount (₱):</label>
                  <input
                    type="number"
                    value={batchAmount}
                    onChange={(e) => setBatchAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sac-maroon-800 px-5 py-2 text-sm font-semibold text-white  hover:bg-sac-maroon-900"
                >
                  Confirm Batch Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: ADD NEW SCHOLARSHIP PROGRAM MODAL                     */}
      {/* ============================================================== */}
      {showAddProgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-sac-maroon-800 px-6 py-4 bg-sac-maroon-800 text-white">
              <h3 className="text-base font-semibold">+ Create New Scholarship Scheme</h3>
              <button
                onClick={() => setShowAddProgModal(false)}
                className="rounded-lg p-1 text-sac-maroon-200 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700">Scholarship Name:</label>
                <input
                  type="text"
                  placeholder="e.g. St. Anthony Alumni Global Grant"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700">Program Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. ALUMNI_2026"
                    value={newProgCode}
                    onChange={(e) => setNewProgCode(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Provider / Sponsor:</label>
                  <input
                    type="text"
                    placeholder="e.g. SAC Alumni USA"
                    value={newProgProvider}
                    onChange={(e) => setNewProgProvider(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-slate-700">Amount (₱):</label>
                  <input
                    type="number"
                    value={newProgAmount}
                    onChange={(e) => setNewProgAmount(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700">Available Slots:</label>
                  <input
                    type="number"
                    value={newProgSlots}
                    onChange={(e) => setNewProgSlots(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProgModal(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newProgName || !newProgCode) return;
                    setShowAddProgModal(false);
                    alert(`Scholarship ${newProgName} registered for AY 2026-2027!`);
                  }}
                  className="rounded-md bg-sac-maroon-800 px-5 py-2 text-sm font-semibold text-white  hover:bg-sac-maroon-900"
                >
                  Save Scholarship
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin AI Assistant Copilot Modal */}
      <AdminCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        applications={applications}
        programs={programs}
        payoutBatches={payoutBatches}
        onSelectApplication={(app) => {
          setSelectedApp(app);
          setActiveTab('applications');
          setIsCopilotOpen(false);
        }}
      />
    </div>
  );
};
