'use client';

import React, { useState, useEffect } from 'react';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { SacSeal } from '@/components/SacSeal';
import {
  Application,
  PayoutBatch,
  Announcement,
  DisbursementRecord,
  ScholarshipProgram,
  SmsMessage,
  AuditLog,
} from '@/lib/types';
import {
  mockScholarshipPrograms as initialPrograms,
  mockApplications as initialApps,
  mockPayoutBatches as initialBatches,
  mockAnnouncements as initialAnnouncements,
  mockDisbursements as initialDisbursements,
  mockSmsMessages as initialSmsMessages,
  mockAuditLogs as initialAuditLogs,
} from '@/lib/mockData';
import {
  getStoredApplications,
  saveStoredApplications,
  getStoredAnnouncements,
  saveStoredAnnouncements,
  getStoredBatches,
  saveStoredBatches,
  getStoredDisbursements,
  saveStoredDisbursements,
  getStoredSms,
  saveStoredSms,
  getStoredLogs,
  saveStoredLogs,
  getStoredAdminAuth,
  saveStoredAdminAuth,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  getApplications,
  getScholarshipPrograms,
  updateApplicationStatus,
  getPayoutBatches,
  createPayoutBatch,
  getAnnouncements,
  createAnnouncement,
  getDisbursements,
  recordDisbursement,
  getSmsMessages,
  sendSmsMessage,
  getAuditLogs,
  recordAuditLog,
} from '@/lib/supabaseService';
import { Monitor, ShieldCheck, ArrowLeft, Database } from 'lucide-react';

export default function AdminPage() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // Core Data States with localStorage persistence and safe defaults
  const [applications, setApplications] = useState<Application[]>(initialApps);
  const [programs, setPrograms] = useState<ScholarshipProgram[]>(initialPrograms);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>(initialBatches);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>(initialDisbursements);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  // Load persisted state on mount and sync with Supabase
  useEffect(() => {
    setIsAdminAuthenticated(getStoredAdminAuth());
    setApplications(getStoredApplications());
    setPayoutBatches(getStoredBatches());
    setAnnouncements(getStoredAnnouncements());
    setDisbursements(getStoredDisbursements());
    setSmsMessages(getStoredSms());
    setAuditLogs(getStoredLogs());

    async function loadCloudData() {
      try {
        const [apps, progs, batches, anns, disb, sms, logs] = await Promise.all([
          getApplications(),
          getScholarshipPrograms(),
          getPayoutBatches(),
          getAnnouncements(),
          getDisbursements(),
          getSmsMessages(),
          getAuditLogs(),
        ]);
        if (apps && apps.length > 0) setApplications(apps);
        if (progs && progs.length > 0) setPrograms(progs);
        if (batches && batches.length > 0) setPayoutBatches(batches);
        if (anns && anns.length > 0) setAnnouncements(anns);
        if (disb && disb.length > 0) setDisbursements(disb);
        if (sms && sms.length > 0) setSmsMessages(sms);
        if (logs && logs.length > 0) setAuditLogs(logs);
      } catch (err) {
        console.warn('Supabase admin cloud sync fallback:', err);
      }
    }
    loadCloudData();
  }, []);

  // Sync state to localStorage when changes occur
  const updateApplications = (apps: Application[]) => {
    setApplications(apps);
    saveStoredApplications(apps);
  };

  const updateAnnouncements = (anns: Announcement[]) => {
    setAnnouncements(anns);
    saveStoredAnnouncements(anns);
  };

  const updateBatches = (batches: PayoutBatch[]) => {
    setPayoutBatches(batches);
    saveStoredBatches(batches);
  };

  const updateDisbursements = (disb: DisbursementRecord[]) => {
    setDisbursements(disb);
    saveStoredDisbursements(disb);
  };

  const updateSms = (sms: SmsMessage[]) => {
    setSmsMessages(sms);
    saveStoredSms(sms);
  };

  const updateLogs = (logs: AuditLog[]) => {
    setAuditLogs(logs);
    saveStoredLogs(logs);
  };

  // Admin updates application status (Approve, Deficient, Reject)
  const handleUpdateApplicationStatus = async (
    appId: string,
    status: Application['status'],
    remarks?: string
  ) => {
    const updated = applications.map((app) =>
      app.id === appId
        ? {
            ...app,
            status,
            deficiencyRemarks: remarks,
          }
        : app
    );
    updateApplications(updated);
    await updateApplicationStatus(appId, status, remarks);

    const targetApp = updated.find((a) => a.id === appId);
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: status === 'APPROVED' ? 'STATUS_APPROVED' : status === 'REJECTED' ? 'STATUS_REJECTED' : 'DEFICIENCY_FLAGGED',
      performedBy: 'ISPSO Admin Desk',
      target: targetApp?.student.fullName || 'Student Application',
      details: `Status set to ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`,
      timestamp: new Date().toISOString(),
      severity: status === 'REJECTED' ? 'WARNING' : 'INFO',
      ipAddress: '192.168.10.15 (Admin VLAN)',
    };
    updateLogs([newLog, ...auditLogs]);
    await recordAuditLog(newLog);
  };

  // Admin broadcasts new announcement
  const handleAddAnnouncement = async (newAnn: Omit<Announcement, 'id' | 'publishedAt'>) => {
    const ann: Announcement = {
      ...newAnn,
      id: `ann-${Date.now()}`,
      publishedAt: new Date().toISOString(),
    };
    updateAnnouncements([ann, ...announcements]);
    await createAnnouncement(ann);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ANNOUNCEMENT_POSTED',
      performedBy: 'ISPSO Admin Desk',
      target: ann.title,
      details: `Official bulletin broadcasted under category [${ann.category}]`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '192.168.10.15 (Admin VLAN)',
    };
    updateLogs([newLog, ...auditLogs]);
    await recordAuditLog(newLog);
  };

  // Admin schedules new payout batch
  const handleAddPayoutBatch = async (batchData: Omit<PayoutBatch, 'id' | 'claimedCount'>) => {
    const batch: PayoutBatch = {
      ...batchData,
      id: `payout-${Date.now()}`,
      claimedCount: 0,
    };
    updateBatches([...payoutBatches, batch]);
    await createPayoutBatch(batch);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'PAYOUT_BATCH_CREATED',
      performedBy: 'ISPSO Admin Desk',
      target: batch.programCode,
      details: `Batch ${batch.batchNumber} created for ${batch.scheduledDate} at ${batch.venue}`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '192.168.10.15 (Admin VLAN)',
    };
    updateLogs([newLog, ...auditLogs]);
    await recordAuditLog(newLog);
  };

  // Admin / Releasing Desk scans and claims student stipend at counter
  const handleDisbursePayout = (
    studentIdNumber: string,
    batchId: string
  ): { success: boolean; message: string; record?: DisbursementRecord } => {
    const app = applications.find(
      (a) => a.student.studentIdNumber.toLowerCase() === studentIdNumber.toLowerCase()
    );

    const batch = payoutBatches.find((b) => b.id === batchId);

    if (!app) {
      return {
        success: false,
        message: `Student ID "${studentIdNumber}" not found in current enrollment or application list.`,
      };
    }

    if (app.status !== 'APPROVED') {
      return {
        success: false,
        message: `Student "${app.student.fullName}" application is currently ${app.status}. Not eligible for disbursement until approved.`,
      };
    }

    // Check if already claimed
    const existing = disbursements.find(
      (d) => d.studentIdNumber.toLowerCase() === studentIdNumber.toLowerCase() && d.status === 'CLAIMED'
    );

    if (existing) {
      return {
        success: false,
        message: `Stipend already claimed by ${app.student.fullName} on ${existing.claimedAt?.slice(0, 10)} (Ref: ${existing.referenceNumber}).`,
      };
    }

    const refNum = `SAC-PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: DisbursementRecord = {
      id: `disb-${Date.now()}`,
      batchId: batch?.id || 'batch-001',
      studentId: app.student.id,
      studentName: app.student.fullName,
      studentIdNumber: app.student.studentIdNumber,
      programCode: app.program.code,
      amount: batch?.amountPerStudent || app.program.grantAmount,
      status: 'CLAIMED',
      claimedAt: new Date().toISOString(),
      verifiedByStaff: 'ISPSO Finance & Release Desk',
      referenceNumber: refNum,
      claimMethod: 'QR_PASS',
    };

    updateDisbursements([newRecord, ...disbursements]);
    recordDisbursement(newRecord);

    // Increment batch claimed count
    const updatedBatches = payoutBatches.map((b) =>
      b.id === batchId ? { ...b, claimedCount: b.claimedCount + 1 } : b
    );
    updateBatches(updatedBatches);

    // Audit log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'PAYOUT_DISBURSED',
      performedBy: 'ISPSO Finance Counter',
      target: `${app.student.fullName} (${app.student.studentIdNumber})`,
      details: `Disbursed ₱${newRecord.amount.toLocaleString()} via Rapid QR Scanner. Ref: ${refNum}`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '192.168.10.15 (Admin VLAN)',
    };
    updateLogs([newLog, ...auditLogs]);
    recordAuditLog(newLog);

    return {
      success: true,
      message: `Successfully released ₱${newRecord.amount.toLocaleString()} to ${app.student.fullName}! Signed & verified.`,
      record: newRecord,
    };
  };

  // ISPSO sends direct mobile SMS to a student
  const handleSendAdminSms = async (studentId: string, mobile: string, message: string) => {
    const targetStudent = applications.find((a) => a.student.id === studentId)?.student;
    const newSms: SmsMessage = {
      id: `sms-${Date.now()}`,
      studentId,
      studentName: targetStudent?.fullName || 'Student',
      studentNumber: targetStudent?.studentIdNumber || 'N/A',
      mobileNumber: mobile,
      message,
      sender: 'ISPSO Staff Desk',
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
    };
    updateSms([...smsMessages, newSms]);
    await sendSmsMessage(newSms);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SMS_DISPATCHED',
      performedBy: 'ISPSO Staff Desk',
      target: `${targetStudent?.fullName || 'Student'} (${mobile})`,
      details: `Outbound text sent: "${message.slice(0, 45)}..."`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '192.168.10.15 (Admin VLAN)',
    };
    updateLogs([newLog, ...auditLogs]);
    await recordAuditLog(newLog);
  };

  const handleAdminLoginSuccess = async (user: string) => {
    setIsAdminAuthenticated(true);
    saveStoredAdminAuth(true);

    const loginLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'ADMIN_LOGIN',
      performedBy: `ISPSO Admin (${user})`,
      target: 'ISPSO Admin Console',
      details: 'Successful administrator credential verification',
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '192.168.10.15 (Admin VLAN)',
    };
    updateLogs([loginLog, ...auditLogs]);
    await recordAuditLog(loginLog);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    saveStoredAdminAuth(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Dedicated Admin Top Bar */}
      <header className="border-t-4 border-t-sac-maroon-800 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <SacSeal className="h-10 w-10 shrink-0 drop-shadow-sm" size={40} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-lg font-bold text-sac-maroon-900">
                  St. Anthony’s College
                </span>
                <span className="rounded bg-sac-maroon-50 px-2 py-0.5 text-[10px] font-bold text-sac-maroon-800 border border-sac-maroon-200">
                  ISPSO Workstation
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Institutional Scholarship Management &amp; Releasing Console
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Supabase PostgreSQL Backend Status */}
            {isSupabaseConfigured() ? (
              <span
                className="hidden md:inline-flex items-center space-x-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-sm"
                title="Connected to Supabase Cloud PostgreSQL database"
              >
                <Database className="h-3.5 w-3.5 text-emerald-600" />
                <span>Supabase: PostgreSQL</span>
              </span>
            ) : (
              <span
                className="hidden md:inline-flex items-center space-x-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200 shadow-sm"
                title="Running in resilient local cache mode. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to link live PostgreSQL."
              >
                <Database className="h-3.5 w-3.5 text-amber-600" />
                <span>Supabase: Offline Cache</span>
              </span>
            )}

            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 font-medium bg-slate-100 rounded-lg px-2.5 py-1">
              <Monitor className="h-3.5 w-3.5 text-slate-600" />
              <span>Desktop PC Station</span>
            </div>

            {isAdminAuthenticated && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Staff Authenticated
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Admin Login Gate vs Full Admin Dashboard */}
      <main className="flex-1">
        {isAdminAuthenticated ? (
          <AdminDashboard
            applications={applications}
            payoutBatches={payoutBatches}
            programs={programs}
            announcements={announcements}
            disbursements={disbursements}
            smsMessages={smsMessages}
            auditLogs={auditLogs}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onAddAnnouncement={handleAddAnnouncement}
            onAddPayoutBatch={handleAddPayoutBatch}
            onDisbursePayout={handleDisbursePayout}
            onSendAdminSms={handleSendAdminSms}
            onLogout={handleAdminLogout}
          />
        ) : (
          <AdminLogin
            onSuccess={handleAdminLoginSuccess}
          />
        )}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} St. Anthony’s College • Institutional Scholarship Program and Services Office (ISPSO)
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          San Jose de Buenavista, 5700 Antique, Philippines • Dedicated Staff Terminal • Confidential
        </p>
      </footer>
    </div>
  );
}
