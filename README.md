# St. Anthony’s College (SAC) - ISPSO ScholarLink
### Institutional Scholarship Program and Services Office (San Jose de Buenavista, Antique)

A centralized, secure scholarship management and student communication portal designed to replace uncoordinated Facebook announcements with direct, real-time updates, automated anti-fraud identity verification, and organized campus stipend releasing.

---

## 🏛️ Context & Operational Background

At **St. Anthony’s College (SAC)** in San Jose, Antique, the **Institutional Scholarship Program and Services Office (ISPSO)** manages:
1. **Government Subsidies:** UniFAST Tertiary Education Subsidy (TES / RA 10931), Tulong Dunong Program (TDP-TES), CHED Merit & CSP, Coco-Levy (CoScho), and Antique Provincial (APESP) / LGU Grants.
2. **Institutional Grants:** College-Assisted Students (CAS / Working Scholars), Dean's List / Academic Excellence, Student Leaders / Publication, Choir / Dance Troupe, Varsity.
3. **Private Benefactors:** Youth Servant Leadership Education Program (YSLEP - Caritas Manila), Alumni Endowments, and Diocesan funds.

### 🚫 The Problem Solved
Previously, ISPSO relied on its public Facebook page (`facebook.com/profile.php?id=100090700302348`) to announce releasing schedules, calls for applications, and masterlists. This resulted in:
* **Missed Deadlines:** Critical 48-hour submission windows were lost in Facebook's algorithm.
* **Privacy Violations (RA 10173):** Photos of paper masterlists showing student full names and financial aid amounts violated the Data Privacy Act.
* **Overcrowded Campus Lines:** Students crowded the SAC Gym and Finance Office due to unbatched releasing schedules.
* **Document & Identity Fraud:** Manual inspection of paper IDs risked accepting mismatched names or fraudulent DepEd 12-digit LRNs.

---

## 🚀 Key Features

### 1. 🖥️ ISPSO Admin Management Console (Desktop-First)
* **Real-Time KPIs:** Tracks active scholars per scheme (839+ students), budget disbursement progress (₱4.25M / ₱6.8M), and pending reviews.
* **Anti-Fraud & Verification Queue:** Side-by-side audit modal comparing uploaded student IDs/CORs against registered profiles with color-coded mismatch alerts.
* **Releasing & Payout Scheduler:** Automatically splits grantees into alphabetical timeslot batches (e.g., *Batch 1: Surnames A-D on Nov 14, 8:30 AM at SAC Gym*).
* **Direct Student Mobile SMS Chat:** Send direct SMS text messages to students’ verified mobile phone numbers (`0917-882-9102`) for urgent deficiency alerts and payout releases.
* **Security & RA 10173 Audit Trail:** Immutable event log tracking every verification, grant approval, disbursement, and SMS dispatch with timestamps, actor IDs, and IP addresses.
* **Campus Counter Scanning Mode:** Rapidly scans student QR Passes or Student IDs at releasing desks to mark stipends as `CLAIMED` and issue digital reference receipts.
* **Targeted Broadcast Center:** Replaces Facebook posts with targeted push notifications and in-app alerts segmented by scholarship program.

### 2. 📱 Student Progressive Web App (PWA)
* **Institutional Domain Lock:** Authenticated strictly via `@sac.edu.ph` institutional Google Workspace accounts.
* **🤖 Schola AI Scholar Assistant:** Built-in AI companion synchronized with the student's personal academic record (Student ID: `2023-01452`, DepEd LRN: `115201140091`, GWA: `1.45`, TDP-TES status). Schola answers questions about all available SAC scholarships, evaluates GWA qualifications, explains application requirements, and provides payout schedules at the SAC Gym.
* **Direct Mobile SMS Drawer:** Real-time SMS text thread connecting the student directly to ISPSO staff with two-way reply support.
* **Visual Disbursement Tracker:** Live step-by-step progress tracking:  
  `Applied` → `Documents Verified` → `Endorsed to CHED/Donor` → `Ready for Payout` → `Claimed`.
* **Digital Scholar Pass:** Cryptographically signed dynamic QR code containing Student ID and 12-digit LRN for rapid presentation at the releasing window.
* **Online Application Wizard:** Step-by-step submission with instant pre-validation feedback on uploaded ID and COR documents.

### 3. 🛡️ Verification & Anti-Fraud Engine
* **12-Digit DepEd LRN Validator:** Validates length, numerical integrity, non-zero school ID prefix, and uniqueness.
* **Jaro-Winkler Fuzzy Name Matcher:** Computes string similarity between the student's claimed name and OCR-detected text:
  * $\ge 92\%$ similarity $\rightarrow$ `VERIFIED`
  * $65\% - 91\%$ similarity (e.g., middle initials, suffix `Jr.`) $\rightarrow$ `NEEDS_MANUAL_REVIEW`
  * $< 65\%$ similarity $\rightarrow$ `NAME_MISMATCH` (Auto-flagged)
* **Perceptual Image Hash (pHash):** Flags duplicate uploads across different accounts to prevent sharing/re-uploading another student's ID.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
* **Language:** TypeScript 5 (Strict Mode)
* **Styling:** Tailwind CSS + Shadcn UI patterns + Anthonian Navy (`#1b365d`) & Gold (`#f59e0b`) Branding
* **Icons:** Lucide React
* **Testing:** Node.js native test runner (`node --test --experimental-strip-types`)

---

## 🏁 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Unit Tests (18 Test Cases)
```bash
npm test
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

Use the mode switcher in the top navigation bar to seamlessly toggle between:
* **ISPSO Staff View (PC Console)**
* **Student PWA View (Mobile Mockup or Full Screen)**
* **AI Verification Sandbox** (Test custom names, LRNs, and OCR text in real time)

---

## 🔒 Security & Privacy (RA 10173 Compliance)

* **No Public Masterlists:** Only authorized staff and the authenticated student can view their respective financial assistance records.
* **Temporary Pre-Signed URLs:** Student document uploads (ITR, COR, Certificate of Indigency) are stored encrypted with short-lived access links.
* **Audit Trail:** Every status update, coordinator remark, and counter disbursement is timestamped with staff identification.

---

## 📍 Contact & Support
* **Office:** Institutional Scholarship Program and Services Office (ISPSO)
* **Institution:** St. Anthony’s College, San Jose de Buenavista, 5700 Antique, Philippines
* **Email:** ispeso@sac.edu.ph
* **Hotline:** 0906-451-6128
