import type { StudentProfile, ScholarshipProgram, Application, PayoutBatch, ScholaChatMessage } from './types.ts';

export interface ScholaContext {
  student: StudentProfile;
  applications: Application[];
  programs: ScholarshipProgram[];
  payoutBatches: PayoutBatch[];
}

/**
 * Knowledge retrieval and natural reasoning engine for Schola AI
 */
export function generateScholaResponse(userQuery: string, context: ScholaContext): ScholaChatMessage {
  const q = userQuery.toLowerCase().trim();
  const student = context.student;
  const myApp = context.applications.find((a) => a.studentId === student.id) || context.applications[0];
  const myBatch = context.payoutBatches.find((b) => b.programCode === myApp?.program.code);

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Inquiries about student's own information / profile / LRN
  if (
    q.includes('my info') ||
    q.includes('my profile') ||
    q.includes('who am i') ||
    q.includes('my lrn') ||
    q.includes('my student id') ||
    q.includes('about me')
  ) {
    return {
      id: `schola-${Date.now()}`,
      sender: 'schola',
      text: `Hello, **${student.fullName}**! Here is your official student profile registered with St. Anthony's College ISPSO:

• **Student ID Number:** \`${student.studentIdNumber}\`
• **DepEd 12-Digit LRN:** \`${student.lrn}\` *(Status: Verified ✓)*
• **Institutional Email:** \`${student.email}\`
• **Degree Program:** ${student.course} (Year ${student.yearLevel})
• **Mobile Contact:** ${student.contactNumber}
• **Residence:** ${student.municipality}
• **Active Grant:** ${myApp ? `${myApp.program.name} (Status: **${myApp.status}**)` : 'None currently'}

Your profile is officially linked to your \`@sac.edu.ph\` account and compliant with RA 10173 Data Privacy regulations. Is there anything specific you would like me to check on your records?`,
      timestamp,
      suggestedPrompts: [
        'When is my scholarship payout?',
        'What scholarships am I eligible for?',
        'How do I view my Digital QR Pass?',
      ],
    };
  }

  // 2. Inquiries about AVAILABLE SCHOLARSHIPS in St. Anthony's College
  if (
    q.includes('available scholarship') ||
    q.includes('scholarships available') ||
    q.includes('what scholarships') ||
    q.includes('list of scholarship') ||
    q.includes('what scholar') ||
    q.includes('scholarship program') ||
    q.includes('anong scholarship')
  ) {
    const cards = context.programs.map((p) => ({
      title: p.name,
      description: `${p.provider} • Deadline: ${p.deadline}`,
      badge: p.category,
      amount: `₱${p.grantAmount.toLocaleString()} (${p.frequency})`,
      actionLabel: 'View Criteria',
    }));

    return {
      id: `schola-${Date.now()}`,
      sender: 'schola',
      text: `Here are the official **Scholarship & Financial Aid Programs** currently available at **St. Anthony’s College (SAC)** for Academic Year 2026-2027:

1. 🏛️ **UniFAST Tertiary Education Subsidy (TES / RA 10931)**
   • Grant: **₱20,000 / semester**
   • For: Underprivileged students, Listahanan 2.0 / 4Ps beneficiaries enrolled at SAC.

2. 📘 **Tulong Dunong Program (TDP-TES)**
   • Grant: **₱7,500 / semester**
   • For: Deserving Anthonians with GWA of 2.25 or better and low family income.

3. 💼 **College-Assisted Students (CAS / Working Scholars)**
   • Grant: **100% Full Tuition & Miscellaneous Coverage**
   • For: Students rendering 4 hours daily of campus office service (Registrar, Library, Labs, Guidance, ISPSO).

4. 🏅 **Dean's List Academic Honor Scholarship**
   • Grant: **₱6,000 (100% or 50% tuition discount)**
   • For: Top academic achievers with GWA between 1.00 and 1.75.

5. 🌾 **Antique Provincial Educational Assistance Program (APESP)**
   • Grant: **₱5,000 / semester**
   • For: Bonafide Antiqueno residents across all 18 municipalities of Antique.

6. 🕊️ **Youth Servant Leadership (YSLEP - Caritas Manila)**
   • Grant: **₱12,000 / semester + Monthly Allowance**
   • For: Active Catholic parish youth within the Diocese of San Jose de Antique.

Would you like to know which ones you are specifically qualified for based on your academic standing?`,
      timestamp,
      suggestedPrompts: [
        'Which scholarships qualify for my GWA?',
        'How do I apply for CAS working scholar?',
        'What are the requirements for UniFAST TES?',
      ],
      cards,
    };
  }

  // 3. Inquiries about ELIGIBILITY & RECOMMENDATIONS based on Student's GWA / Background
  if (
    q.includes('eligible') ||
    q.includes('qualified') ||
    q.includes('qualify') ||
    q.includes('pwede ba ako') ||
    q.includes('recommend') ||
    q.includes('gwa')
  ) {
    const studentGwa = myApp?.gwa || 1.45;

    return {
      id: `schola-${Date.now()}`,
      sender: 'schola',
      text: `Based on your academic records, **${student.fullName}**:

• **Your Recorded GWA:** **${studentGwa}** (Outstanding Academic Standing)
• **Current Year & Course:** ${student.course}, Year ${student.yearLevel}

Here are the scholarships you are qualified to apply for:

✅ **1. Dean's List Honor Scholarship (100% Tuition Discount)**
   • *Why:* Your GWA of ${studentGwa} places you in the top tier (1.00 - 1.45), entitling you to a full 100% tuition discount!
   
✅ **2. Tulong Dunong Program (TDP-TES - ₱7,500)**
   • *Status:* You are **already enrolled and approved** for this program this semester! Payout is scheduled for release.

✅ **3. College-Assisted Students (CAS / Working Scholar)**
   • *Why:* CAS requires a GWA of 2.0 or better. With your ${studentGwa}, you comfortably meet academic requirements for campus placement.

✅ **4. APESP (Antique Provincial Educational Assistance - ₱5,000)**
   • *Why:* You reside in ${student.municipality}, qualifying you for provincial educational assistance as a bonafide Antiqueno.

Would you like me to guide you on how to apply for the Dean's List discount or check your TDP-TES payout schedule?`,
      timestamp,
      suggestedPrompts: [
        'When is my TDP-TES payout schedule?',
        'How do I apply for Dean\'s List discount?',
        'What documents are needed for APESP?',
      ],
    };
  }

  // 4. Inquiries about PAYOUT / RELEASING / STIPEND SCHEDULE
  if (
    q.includes('payout') ||
    q.includes('releasing') ||
    q.includes('release') ||
    q.includes('stipend') ||
    q.includes('when is my money') ||
    q.includes('kailan releasing') ||
    q.includes('schedule') ||
    q.includes('gym')
  ) {
    if (myBatch) {
      return {
        id: `schola-${Date.now()}`,
        sender: 'schola',
        text: `📢 **Good news, ${student.fullName}! Your payout schedule is officially confirmed:**

• **Program:** ${myApp?.program.name} (${myApp?.program.code})
• **Amount to Receive:** **₱${myBatch.amountPerStudent.toLocaleString()}**
• **Scheduled Date:** **${myBatch.scheduledDate}** (Friday)
• **Your Assigned Timeslot:** **${myBatch.startTime} – ${myBatch.endTime}** (${myBatch.batchNumber})
• **Venue:** **${myBatch.venue}** at St. Anthony’s College Campus

⚠️ **Important Releasing Reminders:**
1. Present your **Digital Scholar Pass (Dynamic QR Code)** located in the PWA tab.
2. Bring your **Validated SAC Student ID** (showing 1st Sem 2026-2027 validation sticker).
3. Strictly **No Authorization Letters** allowed unless accompanied by an official medical certificate.

You can open your **Digital QR Pass** in the app now so you're ready on Friday!`,
        timestamp,
        suggestedPrompts: [
          'Show me my Digital QR Pass',
          'What if I don\'t have my validated ID?',
          'What are the office hours of ISPSO?',
        ],
      };
    } else {
      return {
        id: `schola-${Date.now()}`,
        sender: 'schola',
        text: `Your application for **${myApp?.program.name || 'Scholarship'}** is currently in status: **${myApp?.status}**. 

The ISPSO is preparing the next batch releasing calendar. You will receive an instant Web Push notification and an SMS text message on your registered number (\`${student.contactNumber}\`) the moment your batch schedule is finalized!`,
        timestamp,
        suggestedPrompts: ['What scholarships are available?', 'How do I contact ISPSO?'],
      };
    }
  }

  // 5. Inquiries about HOW TO APPLY & REQUIREMENTS
  if (
    q.includes('how to apply') ||
    q.includes('requirements') ||
    q.includes('paano mag-apply') ||
    q.includes('process') ||
    q.includes('steps') ||
    q.includes('documents')
  ) {
    return {
      id: `schola-${Date.now()}`,
      sender: 'schola',
      text: `Applying for scholarships at St. Anthony’s College through the **ScholarLink Portal** is simple and paperless:

### 📋 4 Easy Application Steps:
1. **Choose a Scholarship:** Tap the **"Apply"** tab in your ScholarLink PWA to view open programs.
2. **Fill Academic Info:** Enter your General Weighted Average (GWA) and annual family gross income.
3. **Upload Requirements:**
   • Validated SAC Student ID (front and back)
   • Certificate of Registration (COR - Officially validated by Registrar)
   • 12-Digit DepEd LRN Certificate / Form 137
   • Barangay Certificate of Indigency (for financial aid grants)
4. **Automated Verification:** Our AI Verification API will immediately inspect your uploaded document to confirm your name and 12-digit LRN match your \`@sac.edu.ph\` account.

Once approved, you'll be assigned a timeslot for campus releasing at the SAC Gym!`,
      timestamp,
      suggestedPrompts: [
        'Take me to the Apply tab',
        'What scholarships are available right now?',
        'Can I apply if I have a grade of 2.5?',
      ],
    };
  }

  // 6. Inquiries about ISPSO Office Contact / Hours / San Jose Antique
  if (
    q.includes('contact') ||
    q.includes('office') ||
    q.includes('where is ispso') ||
    q.includes('phone') ||
    q.includes('number') ||
    q.includes('email') ||
    q.includes('hours')
  ) {
    return {
      id: `schola-${Date.now()}`,
      sender: 'schola',
      text: `Here are the official contact details for the **Institutional Scholarship Program and Services Office (ISPSO)** at St. Anthony’s College:

• 🏢 **Office Location:** Ground Floor, Administration Building, St. Anthony’s College, San Jose de Buenavista, 5700 Antique
• 📞 **Direct Mobile Hotline:** \`0906-451-6128\`
• 📧 **Official Email:** \`ispeso@sac.edu.ph\` / \`ispso@sac.edu.ph\`
• ⏰ **Office Service Hours:** Monday to Friday, 8:00 AM – 12:00 PM & 1:00 PM – 5:00 PM
• 👤 **Head of Office:** Mrs. Ma. Theresa Alingalan

ISPSO staff can also send direct SMS text notifications to your mobile phone (\`${student.contactNumber}\`) for any urgent notices!`,
      timestamp,
      suggestedPrompts: ['When is my payout schedule?', 'What scholarships are available in SAC?'],
    };
  }

  // Default Fallback
  return {
    id: `schola-${Date.now()}`,
    sender: 'schola',
    text: `Hello ${student.fullName}! I'm **Schola**, your AI Scholar Companion for St. Anthony’s College ISPSO.

I have full access to your student profile (\`${student.studentIdNumber}\` • LRN \`${student.lrn}\`) and all scholarship programs at SAC. 

You can ask me:
• *"What scholarships are available in SAC?"*
• *"Am I qualified with my 1.45 GWA?"*
• *"When is my TDP-TES stipend payout?"*
• *"What requirements do I need to prepare?"*
• *"How do I view my Digital QR Pass?"*

How may I assist you today?`,
    timestamp,
    suggestedPrompts: [
      'What scholarships are available in SAC?',
      'When is my scholarship payout?',
      'Which scholarships match my GWA?',
      'Show my student profile and LRN',
    ],
  };
}
