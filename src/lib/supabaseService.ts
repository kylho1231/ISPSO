import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Application,
  ScholarshipProgram,
  PayoutBatch,
  Announcement,
  DisbursementRecord,
  SmsMessage,
  AuditLog,
  StudentProfile,
} from './types';
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
  getStoredRegisteredStudents,
  saveStoredRegisteredStudents,
} from './storage';
import { mockScholarshipPrograms } from './mockData';

// ==============================================================================
// 1. STUDENTS SERVICE
// ==============================================================================
export async function getStudentByEmail(email: string): Promise<StudentProfile | null> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', normalized)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          studentIdNumber: data.student_id_number,
          lrn: data.lrn,
          course: data.course,
          yearLevel: data.year_level,
          contactNumber: data.contact_number,
          municipality: data.municipality,
          gwa: data.gwa ? parseFloat(data.gwa) : undefined,
          isProfileComplete: data.is_profile_complete,
          avatarUrl: data.avatar_url,
        };
      }
    } catch (err) {
      console.warn('Supabase getStudentByEmail fallback:', err);
    }
  }

  // Local fallback
  const registered = getStoredRegisteredStudents();
  return registered.find((s) => s.email.toLowerCase() === normalized) || null;
}

export async function upsertStudent(student: StudentProfile): Promise<StudentProfile> {
  if (isSupabaseConfigured()) {
    try {
      const payload = {
        id: student.id,
        email: student.email.toLowerCase(),
        full_name: student.fullName,
        student_id_number: student.studentIdNumber,
        lrn: student.lrn,
        course: student.course,
        year_level: student.yearLevel,
        contact_number: student.contactNumber,
        municipality: student.municipality || 'San Jose de Buenavista, Antique',
        gwa: student.gwa,
        is_profile_complete: student.isProfileComplete,
        avatar_url: student.avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('students')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      if (!error && data) {
        const result: StudentProfile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          studentIdNumber: data.student_id_number,
          lrn: data.lrn,
          course: data.course,
          yearLevel: data.year_level,
          contactNumber: data.contact_number,
          municipality: data.municipality,
          gwa: data.gwa ? parseFloat(data.gwa) : undefined,
          isProfileComplete: data.is_profile_complete,
          avatarUrl: data.avatar_url,
        };
        // Also sync local cache
        const local = getStoredRegisteredStudents();
        saveStoredRegisteredStudents([...local.filter((s) => s.email !== result.email), result]);
        return result;
      }
    } catch (err) {
      console.warn('Supabase upsertStudent fallback:', err);
    }
  }

  // Local fallback
  const local = getStoredRegisteredStudents();
  saveStoredRegisteredStudents([...local.filter((s) => s.email !== student.email), student]);
  return student;
}

// ==============================================================================
// 2. SCHOLARSHIP PROGRAMS SERVICE
// ==============================================================================
export async function getScholarshipPrograms(): Promise<ScholarshipProgram[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('scholarship_programs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        return data.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          provider: p.provider,
          category: p.category,
          grantAmount: parseFloat(p.grant_amount),
          frequency: p.frequency,
          description: p.description,
          eligibilityCriteria: p.eligibility_criteria || [],
          requiredDocuments: p.required_documents || [],
          academicYear: p.academic_year,
          semester: p.semester,
          deadline: p.deadline,
          slots: p.slots,
          enrolledCount: p.enrolled_count,
          isActive: p.is_active,
        }));
      }
    } catch (err) {
      console.warn('Supabase getScholarshipPrograms fallback:', err);
    }
  }

  return mockScholarshipPrograms;
}

// ==============================================================================
// 3. APPLICATIONS SERVICE
// ==============================================================================
export async function getApplications(): Promise<Application[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          students (*),
          scholarship_programs (*)
        `)
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        const apps: Application[] = data.map((row) => ({
          id: row.id,
          studentId: row.student_id,
          student: {
            id: row.students.id,
            email: row.students.email,
            fullName: row.students.full_name,
            studentIdNumber: row.students.student_id_number,
            lrn: row.students.lrn,
            course: row.students.course,
            yearLevel: row.students.year_level,
            contactNumber: row.students.contact_number,
            municipality: row.students.municipality,
            gwa: row.students.gwa ? parseFloat(row.students.gwa) : undefined,
            isProfileComplete: row.students.is_profile_complete,
          },
          programId: row.program_id,
          program: {
            id: row.scholarship_programs.id,
            code: row.scholarship_programs.code,
            name: row.scholarship_programs.name,
            provider: row.scholarship_programs.provider,
            category: row.scholarship_programs.category,
            grantAmount: parseFloat(row.scholarship_programs.grant_amount),
            frequency: row.scholarship_programs.frequency,
            description: row.scholarship_programs.description,
            eligibilityCriteria: row.scholarship_programs.eligibility_criteria || [],
            requiredDocuments: row.scholarship_programs.required_documents || [],
            academicYear: row.scholarship_programs.academic_year,
            semester: row.scholarship_programs.semester,
            deadline: row.scholarship_programs.deadline,
            slots: row.scholarship_programs.slots,
            enrolledCount: row.scholarship_programs.enrolled_count,
            isActive: row.scholarship_programs.is_active,
          },
          status: row.status,
          gwa: parseFloat(row.gwa),
          annualFamilyIncome: parseFloat(row.annual_family_income || 0),
          deficiencyRemarks: row.deficiency_remarks,
          documents: row.documents || [],
          verification: row.verification || {},
          submittedAt: row.submitted_at,
        }));

        saveStoredApplications(apps);
        return apps;
      }
    } catch (err) {
      console.warn('Supabase getApplications fallback:', err);
    }
  }

  return getStoredApplications();
}

export async function submitApplication(app: Application): Promise<Application> {
  if (isSupabaseConfigured()) {
    try {
      // Ensure student exists in Supabase first
      await upsertStudent(app.student);

      const payload = {
        id: app.id,
        student_id: app.student.id,
        program_id: app.program.id,
        status: app.status,
        gwa: app.gwa,
        annual_family_income: app.annualFamilyIncome,
        deficiency_remarks: app.deficiencyRemarks,
        documents: app.documents,
        verification: app.verification,
        submitted_at: app.submittedAt,
      };

      const { error } = await supabase.from('applications').insert(payload);
      if (error) {
        console.warn('Supabase insert application error:', error);
      }
    } catch (err) {
      console.warn('Supabase submitApplication error:', err);
    }
  }

  // Always sync local cache
  const existing = getStoredApplications();
  const updated = [app, ...existing.filter((a) => a.id !== app.id)];
  saveStoredApplications(updated);
  return app;
}

export async function updateApplicationStatus(
  appId: string,
  status: Application['status'],
  remarks?: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('applications')
        .update({
          status,
          deficiency_remarks: remarks || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId);
    } catch (err) {
      console.warn('Supabase update status error:', err);
    }
  }

  // Sync local cache
  const existing = getStoredApplications();
  const updated = existing.map((a) => (a.id === appId ? { ...a, status, deficiencyRemarks: remarks } : a));
  saveStoredApplications(updated);
}

// ==============================================================================
// 4. PAYOUT BATCHES SERVICE
// ==============================================================================
export async function getPayoutBatches(): Promise<PayoutBatch[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('payout_batches')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const batches: PayoutBatch[] = data.map((b) => ({
          id: b.id,
          programId: b.program_id || 'prog-001',
          programCode: b.program_code,
          batchNumber: b.batch_number,
          scheduledDate: b.scheduled_date,
          startTime: b.start_time,
          endTime: b.end_time,
          venue: b.venue,
          totalBeneficiaries: b.total_beneficiaries,
          claimedCount: b.claimed_count,
          amountPerStudent: parseFloat(b.amount_per_student),
          status: b.status as PayoutBatch['status'],
        }));
        saveStoredBatches(batches);
        return batches;
      }
    } catch (err) {
      console.warn('Supabase getPayoutBatches fallback:', err);
    }
  }

  return getStoredBatches();
}

export async function createPayoutBatch(batch: PayoutBatch): Promise<PayoutBatch> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('payout_batches').insert({
        id: batch.id,
        program_id: batch.programId || null,
        program_code: batch.programCode,
        batch_number: batch.batchNumber,
        scheduled_date: batch.scheduledDate,
        start_time: batch.startTime,
        end_time: batch.endTime,
        venue: batch.venue,
        total_beneficiaries: batch.totalBeneficiaries,
        claimed_count: batch.claimedCount,
        amount_per_student: batch.amountPerStudent,
        status: batch.status,
      });
    } catch (err) {
      console.warn('Supabase createPayoutBatch error:', err);
    }
  }

  const existing = getStoredBatches();
  const updated = [...existing, batch];
  saveStoredBatches(updated);
  return batch;
}

// ==============================================================================
// 5. DISBURSEMENTS SERVICE
// ==============================================================================
export async function getDisbursements(): Promise<DisbursementRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('disbursements')
        .select('*')
        .order('claimed_at', { ascending: false });

      if (!error && data) {
        const records: DisbursementRecord[] = data.map((d) => ({
          id: d.id,
          batchId: d.batch_id || 'batch-001',
          studentId: d.student_id || 'stud-001',
          studentIdNumber: d.student_id_number,
          studentName: d.student_name,
          programCode: d.program_code,
          amount: parseFloat(d.amount),
          status: d.status as DisbursementRecord['status'],
          referenceNumber: d.reference_number,
          claimedAt: d.claimed_at,
          verifiedByStaff: d.verified_by_staff,
          claimMethod: (d.claim_method as DisbursementRecord['claimMethod']) || 'QR_PASS',
        }));
        saveStoredDisbursements(records);
        return records;
      }
    } catch (err) {
      console.warn('Supabase getDisbursements fallback:', err);
    }
  }

  return getStoredDisbursements();
}

export async function recordDisbursement(disb: DisbursementRecord): Promise<DisbursementRecord> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('disbursements').insert({
        id: disb.id,
        batch_id: disb.batchId,
        student_id: disb.studentId,
        student_id_number: disb.studentIdNumber,
        student_name: disb.studentName,
        program_code: disb.programCode,
        amount: disb.amount,
        status: disb.status,
        reference_number: disb.referenceNumber,
        claimed_at: disb.claimedAt,
        verified_by_staff: disb.verifiedByStaff,
        claim_method: disb.claimMethod,
      });
    } catch (err) {
      console.warn('Supabase recordDisbursement error:', err);
    }
  }

  const existing = getStoredDisbursements();
  const updated = [disb, ...existing];
  saveStoredDisbursements(updated);
  return disb;
}

// ==============================================================================
// 6. SMS MESSAGES SERVICE (Real-time Hotline)
// ==============================================================================
export async function getSmsMessages(): Promise<SmsMessage[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .order('timestamp', { ascending: true });

      if (!error && data) {
        const msgs: SmsMessage[] = data.map((m) => ({
          id: m.id,
          studentId: m.student_id,
          studentName: m.student_name,
          studentNumber: m.student_number,
          mobileNumber: m.mobile_number,
          message: m.message,
          sender: m.sender,
          direction: m.direction,
          status: m.status,
          timestamp: m.timestamp,
        }));
        saveStoredSms(msgs);
        return msgs;
      }
    } catch (err) {
      console.warn('Supabase getSmsMessages fallback:', err);
    }
  }

  return getStoredSms();
}

export async function sendSmsMessage(sms: SmsMessage): Promise<SmsMessage> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('sms_messages').insert({
        id: sms.id,
        student_id: sms.studentId,
        student_name: sms.studentName,
        student_number: sms.studentNumber,
        mobile_number: sms.mobileNumber,
        message: sms.message,
        sender: sms.sender,
        direction: sms.direction,
        status: sms.status,
        timestamp: sms.timestamp,
      });
    } catch (err) {
      console.warn('Supabase sendSmsMessage error:', err);
    }
  }

  const existing = getStoredSms();
  const updated = [...existing, sms];
  saveStoredSms(updated);
  return sms;
}

// ==============================================================================
// 7. ANNOUNCEMENTS SERVICE
// ==============================================================================
export async function getAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const anns: Announcement[] = data.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          category: a.category,
          priority: a.priority,
          author: a.author,
          targetPrograms: a.target_programs || ['ALL'],
          publishedAt: a.published_at,
        }));
        saveStoredAnnouncements(anns);
        return anns;
      }
    } catch (err) {
      console.warn('Supabase getAnnouncements fallback:', err);
    }
  }

  return getStoredAnnouncements();
}

export async function createAnnouncement(ann: Announcement): Promise<Announcement> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('announcements').insert({
        id: ann.id,
        title: ann.title,
        content: ann.content,
        category: ann.category,
        priority: ann.priority,
        author: ann.author,
        target_programs: ann.targetPrograms || ['ALL'],
        published_at: ann.publishedAt,
      });
    } catch (err) {
      console.warn('Supabase createAnnouncement error:', err);
    }
  }

  const existing = getStoredAnnouncements();
  const updated = [ann, ...existing];
  saveStoredAnnouncements(updated);
  return ann;
}

// ==============================================================================
// 8. AUDIT LOGS SERVICE (RA 10173 Philippine Data Privacy Act Compliance)
// ==============================================================================
export async function getAuditLogs(): Promise<AuditLog[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        const logs: AuditLog[] = data.map((l) => ({
          id: l.id,
          action: l.action,
          performedBy: l.performed_by,
          target: l.target,
          details: l.details,
          timestamp: l.timestamp,
          severity: l.severity,
          ipAddress: l.ip_address,
        }));
        saveStoredLogs(logs);
        return logs;
      }
    } catch (err) {
      console.warn('Supabase getAuditLogs fallback:', err);
    }
  }

  return getStoredLogs();
}

export async function recordAuditLog(log: AuditLog): Promise<AuditLog> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('audit_logs').insert({
        id: log.id,
        action: log.action,
        performed_by: log.performedBy,
        target: log.target,
        details: log.details,
        timestamp: log.timestamp,
        severity: log.severity,
        ip_address: log.ipAddress,
      });
    } catch (err) {
      console.warn('Supabase recordAuditLog error:', err);
    }
  }

  const existing = getStoredLogs();
  const updated = [log, ...existing];
  saveStoredLogs(updated);
  return log;
}
