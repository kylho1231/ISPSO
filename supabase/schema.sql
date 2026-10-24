-- ==============================================================================
-- ST. ANTHONY'S COLLEGE (SAC) - SAN JOSE DE BUENAVISTA, ANTIQUE
-- INSTITUTIONAL SCHOLARSHIP PROGRAM AND SERVICES OFFICE (ISPSO)
-- "Anthonian ScholarLink" Production Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. STUDENTS TABLE (Anthonian Scholars registered with @sac.edu.ph)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT ('stud-' || uuid_generate_v4()::text),
    email TEXT UNIQUE NOT NULL CHECK (email ILIKE '%@sac.edu.ph'),
    full_name TEXT NOT NULL,
    student_id_number TEXT NOT NULL,
    lrn TEXT NOT NULL CHECK (length(regexp_replace(lrn, '\D', '', 'g')) = 12),
    course TEXT NOT NULL,
    year_level INTEGER NOT NULL DEFAULT 1 CHECK (year_level BETWEEN 1 AND 5),
    contact_number TEXT NOT NULL,
    municipality TEXT NOT NULL DEFAULT 'San Jose de Buenavista, Antique',
    gwa NUMERIC(4,2) CHECK (gwa BETWEEN 1.00 AND 5.00),
    is_profile_complete BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. SCHOLARSHIP PROGRAMS TABLE (Official SAC Schemes)
CREATE TABLE IF NOT EXISTS public.scholarship_programs (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('GOVERNMENT', 'INSTITUTIONAL', 'PRIVATE')),
    grant_amount NUMERIC(10,2) NOT NULL,
    frequency TEXT NOT NULL,
    description TEXT NOT NULL,
    eligibility_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    semester TEXT NOT NULL DEFAULT '1st Semester',
    deadline DATE NOT NULL,
    slots INTEGER NOT NULL DEFAULT 50,
    enrolled_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY DEFAULT ('app-' || uuid_generate_v4()::text),
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    program_id TEXT NOT NULL REFERENCES public.scholarship_programs(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'NEEDS_MANUAL_REVIEW' 
        CHECK (status IN ('APPROVED', 'NEEDS_MANUAL_REVIEW', 'DEFICIENT', 'REJECTED')),
    gwa NUMERIC(4,2) NOT NULL,
    annual_family_income NUMERIC(12,2) NOT NULL DEFAULT 0,
    deficiency_remarks TEXT,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PAYOUT BATCHES TABLE (SAC Gym Stipend Releasing)
CREATE TABLE IF NOT EXISTS public.payout_batches (
    id TEXT PRIMARY KEY DEFAULT ('batch-' || uuid_generate_v4()::text),
    program_id TEXT REFERENCES public.scholarship_programs(id) ON DELETE SET NULL,
    program_code TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT NOT NULL DEFAULT 'SAC Gymnasium (Counters 1 to 3)',
    total_beneficiaries INTEGER NOT NULL DEFAULT 0,
    claimed_count INTEGER NOT NULL DEFAULT 0,
    amount_per_student NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. DISBURSEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.disbursements (
    id TEXT PRIMARY KEY DEFAULT ('disb-' || uuid_generate_v4()::text),
    batch_id TEXT REFERENCES public.payout_batches(id) ON DELETE SET NULL,
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    student_id_number TEXT NOT NULL,
    student_name TEXT NOT NULL,
    program_code TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'CLAIMED' CHECK (status IN ('UNCLAIMED', 'CLAIMED', 'FORFEITED')),
    reference_number TEXT UNIQUE NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    verified_by_staff TEXT NOT NULL DEFAULT 'ISPSO Cashier Desk',
    claim_method TEXT NOT NULL DEFAULT 'QR_PASS'
);

-- 7. SMS MESSAGES TABLE (2-Way ISPSO Hotline)
CREATE TABLE IF NOT EXISTS public.sms_messages (
    id TEXT PRIMARY KEY DEFAULT ('sms-' || uuid_generate_v4()::text),
    student_id TEXT REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    student_number TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    message TEXT NOT NULL,
    sender TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    status TEXT NOT NULL DEFAULT 'DELIVERED',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ANNOUNCEMENTS TABLE (Campus Bulletins)
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT ('ann-' || uuid_generate_v4()::text),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'HIGH', 'CRITICAL')),
    author TEXT NOT NULL DEFAULT 'ISPSO Coordinator',
    target_programs JSONB NOT NULL DEFAULT '["ALL"]'::jsonb,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. AUDIT LOGS TABLE (RA 10173 Philippine Data Privacy Act Compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || uuid_generate_v4()::text),
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    severity TEXT NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    ip_address TEXT
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated read on public catalog
CREATE POLICY "Public read active programs" ON public.scholarship_programs FOR SELECT USING (is_active = true);
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public read payout batches" ON public.payout_batches FOR SELECT USING (true);

-- Student & Admin Read/Write Policies
CREATE POLICY "Allow student select own profile" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow student insert registration" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow student update profile" ON public.students FOR UPDATE USING (true);

CREATE POLICY "Allow applications insert" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow applications select" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Allow applications update" ON public.applications FOR UPDATE USING (true);

CREATE POLICY "Allow disbursements select and insert" ON public.disbursements FOR ALL USING (true);
CREATE POLICY "Allow sms select and insert" ON public.sms_messages FOR ALL USING (true);
CREATE POLICY "Allow audit_logs insert and select" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow payout_batches manage" ON public.payout_batches FOR ALL USING (true);
CREATE POLICY "Allow scholarship_programs manage" ON public.scholarship_programs FOR ALL USING (true);
CREATE POLICY "Allow announcements manage" ON public.announcements FOR ALL USING (true);

-- ==============================================================================
-- OFFICIAL SEED DATA: ST. ANTHONY'S COLLEGE SCHOLARSHIP PROGRAMS
-- ==============================================================================
INSERT INTO public.scholarship_programs (id, code, name, provider, category, grant_amount, frequency, description, eligibility_criteria, required_documents, deadline, slots, enrolled_count)
VALUES
  (
    'prog-caritas',
    'CARITAS',
    'Caritas Manila Youth Servant Leadership (YSLEP)',
    'Caritas Manila / Diocese of San Jose de Antique',
    'PRIVATE',
    11500,
    'Per Semester',
    'Values-centered servant leadership grant providing tuition subsidy and monthly living allowance coupled with spiritual formation.',
    '["Active parish youth member in Diocese of San Jose de Antique", "GWA of 2.25 or better", "Annual household income below ₱200,000"]'::jsonb,
    '["Validated Certificate of Registration (COR)", "Parish Priest Recommendation Letter", "Barangay Indigency"]'::jsonb,
    '2026-11-20',
    50,
    0
  ),
  (
    'prog-azurin',
    'AZURIN',
    'AZURIN Foundation Educational Grant',
    'Azurin Educational Foundation',
    'PRIVATE',
    10000,
    'Per Semester',
    'Endowed scholarship foundation providing financial assistance to deserving collegiate students pursuing priority STEM, Education, and Business courses.',
    '["Regular full-time student enrolled in at least 18 units", "GWA of 2.0 or better", "Passed Azurin screening"]'::jsonb,
    '["Validated SAC Student ID Card", "Current Semester COR", "Certified Copy of Grades"]'::jsonb,
    '2026-11-22',
    35,
    0
  ),
  (
    'prog-private',
    'PRIVATE_AID',
    'Private Benefactor Scholarship Grant',
    'Alumni & Private Donors of St. Anthony’s College',
    'PRIVATE',
    5000,
    'Per Semester',
    'Direct stipend funded by generous Anthonian alumni worldwide to support students who have financial emergencies.',
    '["Bonafide enrolled Anthonian student", "Passing marks in all subjects", "Endorsement from college dean"]'::jsonb,
    '["Validated COR", "Statement of Account", "Dean Recommendation Letter"]'::jsonb,
    '2026-12-01',
    80,
    0
  ),
  (
    'prog-academic',
    'ANTH_ACAD',
    'Anthonian Academic Excellence Scholarship (Dean''s List)',
    'St. Anthony''s College Academic Affairs',
    'INSTITUTIONAL',
    7500,
    'Tuition Discount per Semester',
    'Institutional merit scholarship granting substantial tuition discounts to the top academic performers in every collegiate department.',
    '["Regular curriculum load", "GWA of 1.00 to 1.45 (100% discount) or 1.46 to 1.75 (50% discount)", "No grade lower than 2.0"]'::jsonb,
    '["Dean’s List Certificate", "Certified Transcript of Grades", "Validated COR"]'::jsonb,
    '2026-11-30',
    100,
    0
  ),
  (
    'prog-entrance',
    'ENTRANCE',
    'Anthonian Entrance Honor Scholarship',
    'St. Anthony''s College Institutional Fund',
    'INSTITUTIONAL',
    6600,
    'Per Semester (1st Year)',
    'Awarded to Senior High School valedictorians, salutatorians, and honors graduates choosing St. Anthony’s College.',
    '["High School Valedictorian or Salutatorian", "SHS with High or Highest Honors", "Enrolled freshman at SAC"]'::jsonb,
    '["Certificate of Honor Ranking", "DepEd Form 137 / 138 with 12-digit LRN", "SAC Enrollment Form"]'::jsonb,
    '2026-11-15',
    40,
    0
  ),
  (
    'prog-tdp',
    'TDP-TES',
    'Tulong Dunong Program (CHED TDP-TES)',
    'CHED / UniFAST',
    'GOVERNMENT',
    7500,
    'Per Semester',
    'Student financial assistance intended for deserving students needing subsidy for school fees and living allowances.',
    '["Minimum 15 units load at SAC", "GWA of 2.25 or better", "Annual parental income not exceeding ₱400,000", "Verified 12-digit DepEd LRN"]'::jsonb,
    '["Officially signed COR", "Front and Back SAC ID Card", "Official DepEd LRN Form 137", "Parental ITR or BIR Exemption"]'::jsonb,
    '2026-11-20',
    180,
    0
  ),
  (
    'prog-tes',
    'TES',
    'UniFAST Tertiary Education Subsidy (RA 10931)',
    'CHED / UniFAST (Republic Act 10931)',
    'GOVERNMENT',
    20000,
    'Per Semester',
    'Flagship national subsidy providing financial assistance to qualified Filipino tertiary students enrolled in Antique.',
    '["Officially enrolled in St. Anthony’s College", "Filipino citizen with verified 12-digit DepEd LRN", "Belongs to Listahanan 2.0 / 4Ps or low-income decile"]'::jsonb,
    '["Validated COR", "SAC Student ID with latest semester sticker", "Barangay Indigency", "Certified Grade Slip"]'::jsonb,
    '2026-11-15',
    250,
    0
  ),
  (
    'prog-apesp',
    'APESP',
    'Antique Provincial Educational Assistance Program',
    'Provincial Government of Antique',
    'GOVERNMENT',
    5000,
    'Per Semester',
    'Provincial scholarship grant funded by the Provincial Government of Antique for bonafide Antiqueno college students across 18 municipalities.',
    '["Registered voter or child of voter in Antique", "Bonafide resident of Antique", "Enrolled at St. Anthony’s College"]'::jsonb,
    '["Certificate of Residency / Voter’s Certification", "Validated SAC ID card", "COR"]'::jsonb,
    '2026-12-05',
    400,
    0
  ),
  (
    'prog-cas',
    'CAS',
    'College-Assisted Students (CAS / Working Scholars)',
    'St. Anthony''s College ISPSO',
    'INSTITUTIONAL',
    18500,
    'Full Tuition & Misc Coverage',
    'SAC institutional work-study grant giving deserving Anthonian youth the opportunity to complete higher education through campus office placement.',
    '["GWA of 2.0 or better", "Passed ISPSO office aptitude evaluation", "Renders 4 hours daily of campus office service"]'::jsonb,
    '["ISPSO Work-Study Application Form", "Endorsement Letter", "Validated COR", "Indigency Certificate"]'::jsonb,
    '2026-11-10',
    60,
    0
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  grant_amount = EXCLUDED.grant_amount,
  slots = EXCLUDED.slots;

-- SEED ANNOUNCEMENTS
INSERT INTO public.announcements (id, title, content, category, priority, author)
VALUES
  (
    'ann-001',
    'Schedule of TDP-TES & UniFAST Stipend Releasing at SAC Gymnasium',
    'The Institutional Scholarship Program and Services Office (ISPSO) announces that releasing of stipends for verified TDP-TES and TES beneficiaries will take place at the SAC Gymnasium. Please bring your Validated SAC ID and Certificate of Registration (COR). Strict verification of 12-digit DepEd LRN will be conducted.',
    'PAYOUT',
    'CRITICAL',
    'ISPSO Head Office'
  ),
  (
    'ann-002',
    '1st Semester AY 2026-2027 Document Validation Deadline',
    'All scholarship applicants must ensure their uploaded documents have legible validation stickers for 1st Semester AY 2026-2027. Deficient applications may be re-uploaded through the ScholarLink portal until November 20, 2026.',
    'GENERAL',
    'HIGH',
    'ISPSO Verification Desk'
  )
ON CONFLICT (id) DO NOTHING;

-- SEED INITIAL PAYOUT BATCH
INSERT INTO public.payout_batches (id, program_code, batch_number, scheduled_date, start_time, end_time, venue, total_beneficiaries, claimed_count, amount_per_student, status)
VALUES
  (
    'batch-tdp-01',
    'TDP-TES',
    'Batch 1',
    '2026-11-25',
    '09:00 AM',
    '12:00 PM',
    'SAC Gymnasium (Counters 1 to 3)',
    40,
    0,
    7500,
    'SCHEDULED'
  )
ON CONFLICT (id) DO NOTHING;
