'use client';

import {
  Application,
  PayoutBatch,
  Announcement,
  DisbursementRecord,
  ScholarshipProgram,
  SmsMessage,
  AuditLog,
  StudentProfile,
} from './types';
import {
  mockScholarshipPrograms as initialPrograms,
  mockPayoutBatches as initialBatches,
  mockAnnouncements as initialAnnouncements,
  mockApplications as demoApps,
  mockDisbursements as demoDisbursements,
  mockSmsMessages as demoSmsMessages,
  mockAuditLogs as demoAuditLogs,
} from './mockData';

const STORAGE_KEYS = {
  APPLICATIONS: 'sac_ispso_applications_v4',
  ANNOUNCEMENTS: 'sac_ispso_announcements_v4',
  BATCHES: 'sac_ispso_batches_v4',
  DISBURSEMENTS: 'sac_ispso_disbursements_v4',
  SMS: 'sac_ispso_sms_v4',
  LOGS: 'sac_ispso_logs_v4',
  STUDENT_SESSION: 'sac_ispso_student_session_v4',
  REGISTERED_STUDENTS: 'sac_ispso_registered_students_v4',
  ADMIN_AUTH: 'sac_ispso_admin_auth_v4',
};

// Safe JSON parse with fallback
function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    if (!val) return fallback;
    return JSON.parse(val) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function safeSave<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error saving ${key} to storage:`, err);
  }
}

// Production storage functions: start clean without dummy submissions
export const getStoredApplications = (): Application[] => safeLoad(STORAGE_KEYS.APPLICATIONS, []);
export const saveStoredApplications = (apps: Application[]) => safeSave(STORAGE_KEYS.APPLICATIONS, apps);

export const getStoredAnnouncements = (): Announcement[] => safeLoad(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
export const saveStoredAnnouncements = (anns: Announcement[]) => safeSave(STORAGE_KEYS.ANNOUNCEMENTS, anns);

export const getStoredBatches = (): PayoutBatch[] => safeLoad(STORAGE_KEYS.BATCHES, initialBatches);
export const saveStoredBatches = (batches: PayoutBatch[]) => safeSave(STORAGE_KEYS.BATCHES, batches);

export const getStoredDisbursements = (): DisbursementRecord[] => safeLoad(STORAGE_KEYS.DISBURSEMENTS, []);
export const saveStoredDisbursements = (disb: DisbursementRecord[]) => safeSave(STORAGE_KEYS.DISBURSEMENTS, disb);

export const getStoredSms = (): SmsMessage[] => safeLoad(STORAGE_KEYS.SMS, []);
export const saveStoredSms = (sms: SmsMessage[]) => safeSave(STORAGE_KEYS.SMS, sms);

export const getStoredLogs = (): AuditLog[] =>
  safeLoad(STORAGE_KEYS.LOGS, [
    {
      id: 'log-boot',
      action: 'SYSTEM_ONLINE',
      performedBy: 'ISPSO Security Core',
      target: 'ScholarLink Server',
      details: 'ISPSO Centralized ScholarLink online and ready for student registrations.',
      timestamp: new Date().toISOString(),
      severity: 'INFO',
      ipAddress: '127.0.0.1 (Campus LAN)',
    },
  ]);
export const saveStoredLogs = (logs: AuditLog[]) => safeSave(STORAGE_KEYS.LOGS, logs);

export const getStoredRegisteredStudents = (): StudentProfile[] =>
  safeLoad<StudentProfile[]>(STORAGE_KEYS.REGISTERED_STUDENTS, []);
export const saveStoredRegisteredStudents = (students: StudentProfile[]) =>
  safeSave(STORAGE_KEYS.REGISTERED_STUDENTS, students);

export const getStoredStudentSession = (): StudentProfile | null =>
  safeLoad<StudentProfile | null>(STORAGE_KEYS.STUDENT_SESSION, null);
export const saveStoredStudentSession = (student: StudentProfile | null) =>
  safeSave(STORAGE_KEYS.STUDENT_SESSION, student);

export const getStoredAdminAuth = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
};

export const saveStoredAdminAuth = (isAuth: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    if (isAuth) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  } catch {
    // Ignore
  }
};

// Utilities for admin data maintenance
export const resetToCleanProductionSlate = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DISBURSEMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SMS, JSON.stringify([]));
  localStorage.setItem(
    STORAGE_KEYS.LOGS,
    JSON.stringify([
      {
        id: `log-${Date.now()}`,
        action: 'DATABASE_PURGED',
        performedBy: 'ISPSO Administrator',
        target: 'System Database',
        details: 'System database cleared to pristine state by ISPSO Administrator.',
        timestamp: new Date().toISOString(),
        severity: 'WARNING',
        ipAddress: '127.0.0.1 (Terminal)',
      },
    ])
  );
  localStorage.removeItem(STORAGE_KEYS.STUDENT_SESSION);
};

export const loadDemoDataset = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(demoApps));
  localStorage.setItem(STORAGE_KEYS.DISBURSEMENTS, JSON.stringify(demoDisbursements));
  localStorage.setItem(STORAGE_KEYS.SMS, JSON.stringify(demoSmsMessages));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(demoAuditLogs));
};
