# St. Anthony’s College (SAC) - ISPSO ScholarLink
### Institutional Scholarship Program and Services Office • San Jose de Buenavista, Antique, Philippines

[![Live Production](https://img.shields.io/badge/Live%20Portal-sac--ispso.vercel.app-780000?style=for-the-badge&logo=vercel)](https://sac-ispso.vercel.app)
[![Admin Portal](https://img.shields.io/badge/Admin%20Console-Workstation-f59e0b?style=for-the-badge&logo=shield)](https://sac-ispso.vercel.app/admin)
[![GitHub](https://img.shields.io/badge/GitHub-kylho1231%2FISPSO-181717?style=for-the-badge&logo=github)](https://github.com/kylho1231/ISPSO)

A centralized, production-ready scholarship management and student communication portal for **St. Anthony’s College (SAC)**. Designed to replace uncoordinated Facebook announcements with direct, real-time updates, automated anti-fraud identity verification, digital QR stipend claiming at the SAC Gymnasium, and an intelligent student AI advisor (**Schola**).

---

## 🏛️ Context & Operational Background

At **St. Anthony’s College (SAC)** in San Jose de Buenavista, Antique, the **Institutional Scholarship Program and Services Office (ISPSO)** administers:
1. **Government Subsidies:** UniFAST Tertiary Education Subsidy (TES / RA 10931), Tulong Dunong Program (TDP-TES), CHED Merit & CSP, Coco-Levy (CoScho), and Antique Provincial (APESP) / LGU Grants.
2. **Institutional Grants:** College-Assisted Students (CAS / Working Scholars), Dean's List / Academic Excellence, Student Leaders / Publication, Choir / Dance Troupe, Varsity.
3. **Private Benefactors:** Youth Servant Leadership Education Program (YSLEP - Caritas Manila), Alumni Endowments, and Diocesan funds.

### 🚫 The Problem Solved
Previously, ISPSO relied on its public Facebook page (`facebook.com/profile.php?id=100090700302348`) to announce releasing schedules, calls for applications, and masterlists. This resulted in:
* **Missed Deadlines:** Critical 48-hour submission windows were lost in Facebook's algorithm.
* **Privacy Violations (RA 10173):** Photos of paper masterlists showing student full names and financial aid amounts violated the Philippine Data Privacy Act.
* **Overcrowded Campus Lines:** Students crowded the SAC Gym and Finance Office due to unbatched releasing schedules.
* **Document & Identity Fraud:** Manual inspection of paper IDs risked accepting mismatched names or fraudulent DepEd 12-digit LRNs.

---

## 🚀 Architectural Separation of Portals

The system provides **two strictly separated, dedicated portals**:

### 1. 📱 Student Portal & PWA (`/`)
* **URL:** `http://localhost:3000/` (or your production domain `https://scholarlink.sac.edu.ph/`)
* **Device Target:** Mobile phones (PWA installable on iOS & Android) + Desktop responsive.
* **Security & Invisibility:** **Zero admin buttons or links**. Students have no entry point or ability to tamper with administrative controls.
* **Features:**
  * **Institutional Domain Restriction:** Authenticated strictly via `@sac.edu.ph` institutional accounts.
  * **12-Digit DepEd LRN Check:** Mandatory format and numerical validation for student onboarding.
  * **PWA Install Banner:** Native 1-click installation to mobile home screens with offline caching (`public/manifest.json`, `public/sw.js`).
  * **🤖 Schola AI Scholar Advisor:** Built-in AI companion synchronized with the student's personal academic record (Student: `Jhon Kylho Estrabo`, LRN: `115201140091`, GWA: `1.38`, TDP-TES status). Schola answers questions about all available SAC scholarships, evaluates GWA qualifications, explains application requirements, and provides payout schedules at the SAC Gym.
  * **🎟️ Digital QR Payout Pass:** Cryptographically validated pass with reference number for rapid stipend claiming at SAC Gymnasium counters.
  * **📱 2-Way ISPSO SMS Hotline:** Direct mobile text messaging with ISPSO staff with real-time bidirectional reply support.
  * **📢 Official Campus Bulletins:** Direct announcements replacing Facebook delays.

### 2. 🖥️ ISPSO Admin Management Console (`/admin`)
* **URL:** `http://localhost:3000/admin`
* **Device Target:** Desktop PC workstation for authorized ISPSO staff, registrars, and releasing cashiers.
* **Login Gateway:**
  * **Username:** `admin`
  * **Password:** `admin123`
* **Features:**
  * **🔔 Header Notification Center:** Interactive bell dropdown with unread badge counter showing new applications, discrepancy flags, upcoming payout dates, and inbound student SMS messages.
  * **✨ Admin AI Copilot:** Plain-English staff assistant answering who applied, who has document discrepancies (e.g., duplicate image hash, name variance), top Dean's List candidates, and SAC Gym payout logistics.
  * **Side-by-Side Document Audit Modal:** Real-time preview of uploaded student IDs and Registration Forms (RF) with AI verification verdicts replacing confusing error screens.
  * **Counter Releasing Scanner:** Rapid QR Pass or Student ID scanner at campus releasing desks to claim stipends and issue digital reference receipts.
  * **SMS Center:** 5 automated institutional SMS templates + live 2-way text communication directly to student phones.
  * **Security & RA 10173 Audit Trail:** Immutable event log tracking every verification, grant approval, disbursement, and SMS dispatch with timestamps, actor IDs, and IP addresses.

---

## 🛡️ Anti-Fraud & Document Verification Engine

* **12-Digit DepEd LRN Validator:** Validates length, numerical integrity, non-zero school ID prefix, and uniqueness.
* **Jaro-Winkler Fuzzy Name Matcher:** Computes string similarity between the student's claimed name and OCR-detected text:
  * $\ge 92\%$ similarity $\rightarrow$ `VERIFIED`
  * $65\% - 91\%$ similarity (e.g., middle initials, suffix `Jr.`) $\rightarrow$ `NEEDS_MANUAL_REVIEW`
  * $< 65\%$ similarity $\rightarrow$ `NAME_MISMATCH` (Auto-flagged)
* **Perceptual Image Hash (pHash):** Flags duplicate uploads across different accounts to prevent sharing/re-uploading another student's ID.

---

## 🛠️ Tech Stack & Branding

* **Framework:** Next.js 14 (App Router & Route Handlers)
* **Language:** TypeScript 5 (Strict Mode)
* **Styling:** Tailwind CSS with St. Anthony's College Official Colors:
  * **Deep Maroon:** `#780000` (`sac-maroon-800`)
  * **Warm Gold:** `#f59e0b` (`sac-gold-500`)
* **Logo:** Official St. Anthony's College Seal (`public/sac-logo.png`)
* **PWA:** Web App Manifest + Service Worker (`public/sw.js`)
* **Testing:** Node.js native test runner (`node --experimental-strip-types --test`)

---

## 🏁 Deployment & Production Run

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suite (24 Test Cases Passing)
```bash
npm test
```

### 3. Build Production Bundle
```bash
npm run build
```

### 4. Start Production Server
```bash
npm run start
```
The server will bind to `http://localhost:3000` (or `PORT` environment variable).

### 5. Deploying to Production (Vercel, Cloud, or Linux Server)
- **Vercel / Netlify:** Connect Git repository, set framework to **Next.js**, and trigger deploy.
- **Docker / Linux VPS:**
  ```bash
  # Run under PM2 for persistent daemon process
  npm install -g pm2
  pm2 start npm --name "sac-scholarlink" -- start
  ```

---

## 👥 Access & Credentials

| Role | Live Production URL | Credentials |
| :--- | :--- | :--- |
| **Student (PWA Portal)** | [https://sac-ispso.vercel.app](https://sac-ispso.vercel.app) | Email: `jestrabo@sac.edu.ph`<br>Password: `student123`<br>*(Or click "Instant Sign In" on Homepage)* |
| **ISPSO Staff (Admin Console)** | [https://sac-ispso.vercel.app/admin](https://sac-ispso.vercel.app/admin) | Username: `admin`<br>Password: `admin123` |

---

## 📍 Contact & Support
* **Office:** Institutional Scholarship Program and Services Office (ISPSO)
* **Institution:** St. Anthony’s College, San Jose de Buenavista, 5700 Antique, Philippines
* **Email:** ispeso@sac.edu.ph
* **Hotline:** 0906-451-6128
