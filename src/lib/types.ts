export type Role = 'ADMIN' | 'COORDINATOR' | 'FINANCE' | 'STUDENT';

export interface StudentProfile {
  id: string;
  email: string; // strictly @sac.edu.ph
  fullName: string;
  studentIdNumber: string; // e.g. 2023-01824
  lrn: string; // 12-digit DepEd LRN
  course: string;
  yearLevel: number;
  contactNumber: string;
  municipality: string;
  isProfileComplete: boolean;
  avatarUrl?: string;
}

export type ProgramCategory = 'GOVERNMENT' | 'INSTITUTIONAL' | 'PRIVATE';

export interface ScholarshipProgram {
  id: string;
  code: string; // TES, TDP, CAS, DEANS_LIST, APESP, YSLEP
  name: string;
  provider: string;
  category: ProgramCategory;
  grantAmount: number;
  frequency: string;
  description: string;
  eligibilityCriteria: string[];
  requiredDocuments: string[];
  academicYear: string;
  semester: string;
  deadline: string;
  slots: number;
  enrolledCount: number;
  isActive: boolean;
}

export type ApplicationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'VERIFYING' 
  | 'VERIFIED' 
  | 'NEEDS_MANUAL_REVIEW' 
  | 'DEFICIENT' 
  | 'APPROVED' 
  | 'REJECTED';

export type DocType = 'STUDENT_ID' | 'COR' | 'LRN_CERT' | 'GRADE_SLIP' | 'INDIGENCY';

export interface SubmittedDocument {
  id: string;
  type: DocType;
  fileName: string;
  fileUrl: string;
  fileHash: string;
  uploadedAt: string;
}

export type VerificationStatus = 
  | 'VERIFIED' 
  | 'NEEDS_MANUAL_REVIEW' 
  | 'NAME_MISMATCH' 
  | 'INVALID_LRN' 
  | 'DUPLICATE_FLAGGED'
  | 'UNPROCESSED';

export interface VerificationResult {
  status: VerificationStatus;
  confidenceScore: number; // 0 - 100
  extractedName: string;
  extractedLrn: string;
  nameSimilarityScore: number; // 0 - 100%
  lrnValid: boolean;
  isDuplicateImage: boolean;
  issues: string[];
  verifiedAt: string;
  ocrSnippet?: string;
}

export interface Application {
  id: string;
  studentId: string;
  student: StudentProfile;
  programId: string;
  program: ScholarshipProgram;
  status: ApplicationStatus;
  gwa: number;
  annualFamilyIncome: number;
  submittedAt: string;
  deficiencyRemarks?: string;
  documents: SubmittedDocument[];
  verification: VerificationResult;
}

export type PayoutStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface PayoutBatch {
  id: string;
  programId: string;
  programCode: string;
  programName: string;
  batchNumber: string; // e.g. "Batch 1: Surnames A - D"
  academicYear: string;
  semester: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  totalBeneficiaries: number;
  claimedCount: number;
  amountPerStudent: number;
  status: PayoutStatus;
}

export interface DisbursementRecord {
  id: string;
  batchId: string;
  studentId: string;
  studentName: string;
  studentIdNumber: string;
  programCode: string;
  amount: number;
  status: 'UNCLAIMED' | 'CLAIMED' | 'FORFEITED';
  claimedAt?: string;
  verifiedByStaff?: string;
  referenceNumber: string;
  claimMethod: 'QR_PASS' | 'MANUAL_ID';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'PAYOUT' | 'APPLICATION' | 'DEADLINE' | 'GENERAL';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  targetPrograms: string[]; // ['ALL'] or specific codes ['TES', 'TDP']
  publishedAt: string;
  author: string;
  isPinned?: boolean;
}

export interface SmsMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  mobileNumber: string;
  message: string;
  sender: string; // e.g. "ISPSO Desk" or "Student"
  direction: 'OUTBOUND' | 'INBOUND';
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'QUEUED';
  timestamp: string;
}

export interface ScholaChatMessage {
  id: string;
  sender: 'user' | 'schola';
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
  cards?: {
    title: string;
    description: string;
    badge?: string;
    amount?: string;
    actionLabel?: string;
  }[];
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  target: string;
  details: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress?: string;
}

