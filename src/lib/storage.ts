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
  mockCurrentUser as initialStudent,
  mockScholarshipPrograms as initialPrograms,
  mockApplications as initialApps,
  mockPayoutBatches as initialBatches,
  mockAnnouncements as initialAnnouncements,
  mockDisbursements as initialDisbursements,
  mockSmsMessages as initialSmsMessages,
  mockAuditLogs as initialAuditLogs,
} from './mockData';

const STORAGE_KEYS = {
  APPLICATIONS: 'sac_ispso_applications_v2',
  ANNOUNCEMENTS: 'sac_ispso_announcements_v2',
  BATCHES: 'sac_ispso_batches_v2',
  DISBURSEMENTS: 'sac_ispso_disbursements_v2',
  SMS: 'sac_ispso_sms_v2',
  LOGS: 'sac_ispso_logs_v2',
  STUDENT_SESSION: 'sac_ispso_student_session_v2',
  ADMIN_AUTH: 'sac_ispso_admin_auth_v2',
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

export const getStoredApplications = (): Application[] => safeLoad(STORAGE_KEYS.APPLICATIONS, initialApps);
export const saveStoredApplications = (apps: Application[]) => safeSave(STORAGE_KEYS.APPLICATIONS, apps);

export const getStoredAnnouncements = (): Announcement[] => safeLoad(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
export const saveStoredAnnouncements = (anns: Announcement[]) => safeSave(STORAGE_KEYS.ANNOUNCEMENTS, anns);

export const getStoredBatches = (): PayoutBatch[] => safeLoad(STORAGE_KEYS.BATCHES, initialBatches);
export const saveStoredBatches = (batches: PayoutBatch[]) => safeSave(STORAGE_KEYS.BATCHES, batches);

export const getStoredDisbursements = (): DisbursementRecord[] => safeLoad(STORAGE_KEYS.DISBURSEMENTS, initialDisbursements);
export const saveStoredDisbursements = (disb: DisbursementRecord[]) => safeSave(STORAGE_KEYS.DISBURSEMENTS, disb);

export const getStoredSms = (): SmsMessage[] => safeLoad(STORAGE_KEYS.SMS, initialSmsMessages);
export const saveStoredSms = (sms: SmsMessage[]) => safeSave(STORAGE_KEYS.SMS, sms);

export const getStoredLogs = (): AuditLog[] => safeLoad(STORAGE_KEYS.LOGS, initialAuditLogs);
export const saveStoredLogs = (logs: AuditLog[]) => safeSave(STORAGE_KEYS.LOGS, logs);

export const getStoredStudentSession = (): StudentProfile | null => safeLoad<StudentProfile | null>(STORAGE_KEYS.STUDENT_SESSION, null);
export const saveStoredStudentSession = (student: StudentProfile | null) => safeSave(STORAGE_KEYS.STUDENT_SESSION, student);

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
