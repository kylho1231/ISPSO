'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { StudentPortal } from '@/components/student/StudentPortal';
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
  mockCurrentUser as initialStudent,
  mockScholarshipPrograms as initialPrograms,
  mockApplications as initialApps,
  mockPayoutBatches as initialBatches,
  mockAnnouncements as initialAnnouncements,
  mockDisbursements as initialDisbursements,
  mockSmsMessages as initialSmsMessages,
  mockAuditLogs as initialAuditLogs,
} from '@/lib/mockData';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<'admin' | 'student'>('admin');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>(initialApps);
  const [programs, setPrograms] = useState<ScholarshipProgram[]>(initialPrograms);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>(initialBatches);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>(initialDisbursements);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [unreadCount, setUnreadCount] = useState(2);

  // Admin updates application status (Approve, Deficient, Reject)
  const handleUpdateApplicationStatus = (
    appId: string,
    status: Application['status'],
    remarks?: string
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              status,
              deficiencyRemarks: remarks,
            }
          : app
      )
    );
  };

  // Admin broadcasts new announcement
  const handleAddAnnouncement = (newAnn: Omit<Announcement, 'id' | 'publishedAt'>) => {
    const ann: Announcement = {
      ...newAnn,
      id: `ann-${Date.now()}`,
      publishedAt: new Date().toISOString(),
    };
    setAnnouncements((prev) => [ann, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  // Admin schedules new payout batch
  const handleAddPayoutBatch = (batchData: Omit<PayoutBatch, 'id' | 'claimedCount'>) => {
    const batch: PayoutBatch = {
      ...batchData,
      id: `payout-${Date.now()}`,
      claimedCount: 0,
    };
    setPayoutBatches((prev) => [...prev, batch]);
  };

  // Admin / Releasing Desk scans and claims student stipend at counter
  const handleDisbursePayout = (
    studentIdNumber: string,
    batchId: string
  ): { success: boolean; message: string; record?: DisbursementRecord } => {
    // Find matching application or student
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

    setDisbursements((prev) => [newRecord, ...prev]);

    // Increment batch claimed count
    setPayoutBatches((prev) =>
      prev.map((b) =>
        b.id === batchId ? { ...b, claimedCount: b.claimedCount + 1 } : b
      )
    );

    return {
      success: true,
      message: `Successfully released ₱${newRecord.amount.toLocaleString()} to ${app.student.fullName}! Signed & verified.`,
      record: newRecord,
    };
  };

  // Student submits new application
  const handleSubmitApplication = (newApp: Partial<Application>) => {
    const app: Application = {
      ...(newApp as Application),
      id: `app-${Date.now()}`,
    };
    setApplications((prev) => [app, ...prev]);

    // Log to Audit Trail
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'APPLICATION_SUBMITTED',
      performedBy: app.student.fullName,
      target: app.program.name,
      details: `Application submitted with GWA ${app.gwa}. Pre-verification: ${app.verification.status} (${app.verification.nameSimilarityScore}% match)`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '192.168.1.105 (Student PWA)',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // ISPSO sends direct mobile SMS to a student
  const handleSendAdminSms = (studentId: string, mobile: string, message: string) => {
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
    setSmsMessages((prev) => [...prev, newSms]);

    // Log to Audit Trail
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
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Student replies via SMS from PWA
  const handleSendStudentSms = (text: string) => {
    const newSms: SmsMessage = {
      id: `sms-${Date.now()}`,
      studentId: initialStudent.id,
      studentName: initialStudent.fullName,
      studentNumber: initialStudent.studentIdNumber,
      mobileNumber: initialStudent.contactNumber,
      message: text,
      sender: initialStudent.fullName,
      direction: 'INBOUND',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
    };
    setSmsMessages((prev) => [...prev, newSms]);

    // Log to Audit Trail
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'SMS_RECEIVED',
      performedBy: initialStudent.fullName,
      target: 'ISPSO Office',
      details: `Inbound student text: "${text}"`,
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: 'Mobile Carrier Gateway (0917)',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar with Mode Switcher */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        unreadCount={unreadCount}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={() => setIsAdminAuthenticated(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'admin' ? (
          isAdminAuthenticated ? (
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
            />
          ) : (
            <AdminLogin
              onSuccess={(user) => {
                setIsAdminAuthenticated(true);
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
                setAuditLogs((prev) => [loginLog, ...prev]);
              }}
              onSwitchToStudent={() => setCurrentView('student')}
            />
          )
        ) : (
          <StudentPortal
            student={initialStudent}
            applications={applications}
            programs={programs}
            announcements={announcements}
            payoutBatches={payoutBatches}
            smsMessages={smsMessages}
            onSubmitApplication={handleSubmitApplication}
            onSendStudentSms={handleSendStudentSms}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} St. Anthony’s College • Institutional Scholarship Program and Services Office (ISPSO)
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          San Jose de Buenavista, 5700 Antique, Philippines • ispeso@sac.edu.ph • 0906-451-6128
        </p>
      </footer>
    </div>
  );
}
