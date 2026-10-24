'use client';

import React, { useState, useEffect } from 'react';
import { StudentNavbar } from '@/components/student/StudentNavbar';
import { StudentPortal } from '@/components/student/StudentPortal';
import { StudentAuthModal } from '@/components/student/StudentAuthModal';
import { ScholaChatModal } from '@/components/student/ScholaChatModal';
import { SacSeal } from '@/components/SacSeal';
import {
  Application,
  PayoutBatch,
  Announcement,
  ScholarshipProgram,
  SmsMessage,
  StudentProfile,
} from '@/lib/types';
import {
  mockCurrentUser,
  mockScholarshipPrograms as initialPrograms,
  mockApplications as initialApps,
  mockPayoutBatches as initialBatches,
  mockAnnouncements as initialAnnouncements,
  mockSmsMessages as initialSmsMessages,
} from '@/lib/mockData';
import {
  getStoredApplications,
  saveStoredApplications,
  getStoredAnnouncements,
  getStoredBatches,
  getStoredSms,
  saveStoredSms,
  getStoredStudentSession,
  saveStoredStudentSession,
} from '@/lib/storage';
import {
  getApplications,
  submitApplication,
  getScholarshipPrograms,
  getPayoutBatches,
  getAnnouncements,
  getSmsMessages,
  sendSmsMessage,
  upsertStudent,
} from '@/lib/supabaseService';
import {
  Download,
  GraduationCap,
  ShieldCheck,
  Smartphone,
  Calendar,
  Sparkles,
  Bot,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  MessageSquare,
  FileText,
  Users,
  ChevronRight,
} from 'lucide-react';

export default function StudentHomePage() {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isScholaOpen, setIsScholaOpen] = useState(false);

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [pwaInstalledAlert, setPwaInstalledAlert] = useState(false);

  // Data initialized with defaults and synchronized from storage & Supabase
  const [applications, setApplications] = useState<Application[]>(initialApps);
  const [programs, setPrograms] = useState<ScholarshipProgram[]>(initialPrograms);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>(initialBatches);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);

  useEffect(() => {
    // Load student session and data immediately from local cache
    const savedStudent = getStoredStudentSession();
    setStudent(savedStudent);

    setApplications(getStoredApplications());
    setPayoutBatches(getStoredBatches());
    setAnnouncements(getStoredAnnouncements());
    setSmsMessages(getStoredSms());

    // Asynchronously fetch from Supabase cloud database
    async function loadCloudData() {
      try {
        const [apps, progs, batches, anns, sms] = await Promise.all([
          getApplications(),
          getScholarshipPrograms(),
          getPayoutBatches(),
          getAnnouncements(),
          getSmsMessages(),
        ]);
        if (apps && apps.length > 0) setApplications(apps);
        if (progs && progs.length > 0) setPrograms(progs);
        if (batches && batches.length > 0) setPayoutBatches(batches);
        if (anns && anns.length > 0) setAnnouncements(anns);
        if (sms && sms.length > 0) setSmsMessages(sms);
      } catch (err) {
        console.warn('Supabase initial fetch fallback:', err);
      }
    }
    loadCloudData();

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration skipped:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setPwaInstalledAlert(true);
        setCanInstallPwa(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction for browsers without direct prompt
      alert('To install SAC ISPSO ScholarLink on your device:\n\n• On iOS / Safari: Tap "Share" and select "Add to Home Screen".\n• On Android / Chrome: Tap the 3 dots menu and tap "Install app" or "Add to Home screen".');
    }
  };

  const handleLoginSuccess = async (user: StudentProfile) => {
    setStudent(user);
    saveStoredStudentSession(user);
    setAuthModalOpen(false);
    await upsertStudent(user);
  };

  const handleLogout = () => {
    setStudent(null);
    saveStoredStudentSession(null);
  };

  const handleSubmitApplication = async (newApp: Partial<Application>) => {
    const app: Application = {
      ...(newApp as Application),
      id: `app-${Date.now()}`,
    };
    const updated = [app, ...applications];
    setApplications(updated);
    saveStoredApplications(updated);
    await submitApplication(app);
  };

  const handleSendStudentSms = async (text: string) => {
    if (!student) return;
    const newSms: SmsMessage = {
      id: `sms-${Date.now()}`,
      studentId: student.id,
      studentName: student.fullName,
      studentNumber: student.studentIdNumber,
      mobileNumber: student.contactNumber,
      message: text,
      sender: student.fullName,
      direction: 'INBOUND',
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
    };
    const updated = [...smsMessages, newSms];
    setSmsMessages(updated);
    saveStoredSms(updated);
    await sendSmsMessage(newSms);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* PWA Install Alert Banner */}
      {pwaInstalledAlert && (
        <div className="bg-emerald-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm flex items-center justify-center space-x-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>ScholarLink PWA installed successfully! You can now launch it directly from your home screen.</span>
          <button
            onClick={() => setPwaInstalledAlert(false)}
            className="ml-3 underline text-[11px] opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Student Portal Navigation Bar (No Admin links or buttons) */}
      <StudentNavbar
        student={student}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onInstallPwa={handleInstallPwa}
        canInstallPwa={true}
        unreadCount={2}
      />

      {/* Main Content: If Student is Signed In -> Full Student Portal Dashboard */}
      {/* If Student is Guest -> Institutional Student Homepage with Sign In / Register / Catalog */}
      <main id="main-content" tabIndex={-1} className="flex-1">
        {student ? (
          <StudentPortal
            student={student}
            applications={applications}
            programs={programs}
            announcements={announcements}
            payoutBatches={payoutBatches}
            smsMessages={smsMessages}
            onSubmitApplication={handleSubmitApplication}
            onSendStudentSms={handleSendStudentSms}
          />
        ) : (
          /* Official St. Anthony's College Academic Student Masthead & Catalog */
          <div className="space-y-14 pb-20">
            {/* INSTITUTIONAL MASTHEAD HERO SECTION */}
            <section className="relative overflow-hidden sac-academic-hero border-b border-slate-200 py-12 sm:py-16">
              <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                {/* Official College Seal */}
                <div className="relative mx-auto flex justify-center mb-5">
                  <div className="relative rounded-full p-2 bg-white shadow-md border-2 border-sac-gold-400 ring-4 ring-sac-maroon-800/10">
                    <SacSeal className="h-20 w-20 sm:h-24 sm:w-24 drop-shadow-sm" size={96} />
                  </div>
                </div>

                {/* Institutional Identity Tag */}
                <div className="inline-flex items-center space-x-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-sac-maroon-900 border border-sac-maroon-200 shadow-sm mb-4">
                  <span className="font-serif italic text-sac-gold-600 font-semibold">Religio Artibus</span>
                  <span className="text-slate-300">•</span>
                  <span>St. Anthony’s College • San Jose, Antique</span>
                </div>

                <h1 className="font-serif text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl max-w-4xl mx-auto leading-tight">
                  Institutional Scholarship Program <br className="hidden sm:inline" />
                  <span className="text-sac-maroon-800">&amp; Services Office (ISPSO)</span>
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  Official student scholarship and financial grant portal of St. Anthony&apos;s College. Access verified institutional aids, TES &amp; TDP-TES schedules, biometric DepEd LRN validation, and rapid gymnasium releasing notices.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-xl bg-sac-maroon-800 px-5 py-3 text-xs font-bold text-sac-gold-300 shadow-sm hover:bg-sac-maroon-900 hover:text-white transition duration-150"
                  >
                    <span>Student Sign In (@sac.edu.ph)</span>
                    <ArrowRight className="h-3.5 w-3.5 text-sac-gold-400" />
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition duration-150"
                  >
                    <span>Create Student Account</span>
                  </button>

                  <button
                    onClick={handleInstallPwa}
                    className="inline-flex items-center space-x-2 rounded-xl bg-sac-gold-50 border border-sac-gold-300 px-4 py-3 text-xs font-bold text-sac-gold-900 shadow-sm hover:bg-sac-gold-100 transition duration-150"
                  >
                    <Download className="h-3.5 w-3.5 text-sac-maroon-800" />
                    <span>Install PWA on Phone</span>
                  </button>
                </div>

                {/* Demo Quick Access Badge */}
                <div className="mt-5 flex items-center justify-center">
                  <div className="inline-flex items-center space-x-2 rounded-lg bg-white px-3.5 py-1.5 text-xs border border-slate-200 shadow-sm">
                    <span className="font-bold text-sac-maroon-900">Official Evaluation Account:</span>
                    <span className="text-slate-600">Jhon Kylho Estrabo (BSIT 3)</span>
                    <button
                      onClick={() => handleLoginSuccess(mockCurrentUser)}
                      className="ml-2 font-bold text-sac-maroon-800 hover:underline"
                    >
                      Instant Portal Access &rarr;
                    </button>
                  </div>
                </div>

                {/* ACADEMIC METRICS OVERVIEW */}
                <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl mx-auto text-left">
                  <div className="rounded-xl border border-slate-200 border-t-4 border-t-sac-maroon-800 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-black text-sac-maroon-900 font-serif">₱6.8M+</div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Grants Disbursed</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 border-t-4 border-t-sac-gold-500 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-black text-slate-900 font-serif">8 Programs</div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Active Scholarships</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 border-t-4 border-t-emerald-600 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-black text-emerald-700 font-serif">100%</div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">DepEd LRN Verified</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 border-t-4 border-t-sac-maroon-700 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-black text-slate-900 font-serif">SAC Gym</div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">Scheduled Releasing</p>
                  </div>
                </div>
              </div>
            </section>

            {/* KEY FEATURES GRID */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <span className="text-xs font-bold text-sac-maroon-800 tracking-widest uppercase">Intelligent Workflow</span>
                <h2 className="font-serif text-3xl font-bold text-slate-900 mt-1">
                  Built for Every Anthonian Scholar
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 max-w-xl mx-auto">
                  Connecting students directly with the Institutional Scholarship Program and Services Office with modern digital tools.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sac-maroon-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sac-maroon-100 text-sac-maroon-800 mb-4 shadow-sm">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Centralized Grant Tracking</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
                    Monitor your scholarship applications, verification milestones, and campus release notices in one unified portal.
                  </p>
                </div>

                <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 shadow-sm">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">2-Way ISPSO SMS Alerts</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
                    Direct mobile text notifications for approval status, deficiencies, and releasing dates to your phone.
                  </p>
                </div>

                <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-amber-300">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-4 shadow-sm">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">DepEd 12-Digit LRN Check</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
                    Automated document pre-verification matching uploaded ID with institutional records to prevent fraud.
                  </p>
                </div>

                <div className="glass-card rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sac-gold-400">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sac-gold-100 text-sac-gold-950 mb-4 shadow-sm">
                    <Bot className="h-6 w-6 text-sac-maroon-800" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Schola AI Advisor</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
                    Interactive AI scholarship counselor that knows your GWA and guides you to all eligible grants.
                  </p>
                </div>
              </div>
            </section>

            {/* OPEN SCHOLARSHIPS CATALOG */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs font-bold text-sac-maroon-800 tracking-widest uppercase">Grants Catalog</span>
                  <h2 className="font-serif text-3xl font-bold text-slate-900 mt-1">
                    Available Scholarships (AY 2026–2027)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Explore 8 institutional, CHED, and alumni financial assistance programs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 self-start sm:self-auto rounded-xl border border-sac-maroon-800 bg-white px-4 py-2 text-xs font-bold text-sac-maroon-800 hover:bg-sac-maroon-50 transition shadow-sm"
                >
                  <span>Apply Online</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {programs.slice(0, 6).map((prog) => (
                  <div
                    key={prog.id}
                    className="glass-card flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sac-maroon-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="rounded-full bg-sac-maroon-50 px-2.5 py-1 text-[10px] font-bold text-sac-maroon-800 border border-sac-maroon-200">
                          {prog.code}
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          ₱{prog.grantAmount.toLocaleString()}/sem
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{prog.name}</h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{prog.description}</p>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px] font-medium">
                        Slots: <strong className="text-slate-800 font-bold">{prog.slots}</strong> available
                      </span>
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setAuthModalOpen(true);
                        }}
                        className="font-bold text-sac-maroon-800 hover:text-sac-maroon-950 flex items-center space-x-1"
                      >
                        <span>Apply</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* OFFICIAL ANNOUNCEMENTS BULLETIN (Replaces Facebook Delays) */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="glass-card rounded-3xl p-6 sm:p-8">
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sac-maroon-800 text-sac-gold-400 shadow-sm">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">
                        Official ISPSO Campus Announcements
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Direct releases from the ISPSO desk — never miss a releasing date.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {announcements.slice(0, 3).map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-5 hover:bg-slate-50 transition"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="rounded-full bg-sac-maroon-100 px-3 py-0.5 text-[10px] font-bold text-sac-maroon-800 border border-sac-maroon-200">
                          {ann.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(ann.publishedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{ann.title}</h4>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-medium">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ISPSO Scholar Guidance Desk Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsScholaOpen(true)}
          className="group flex items-center space-x-2 rounded-full bg-sac-maroon-800 py-3 px-4.5 text-xs font-bold text-sac-gold-300 shadow-lg hover:bg-sac-maroon-900 border-2 border-sac-gold-400 transition"
          title="Open ISPSO Scholar Guidance Desk"
        >
          <Bot className="h-4 w-4 text-sac-gold-400" />
          <span className="text-white font-bold tracking-wide">Scholar Helpdesk</span>
        </button>
      </div>

      {/* Student Auth Modal (Login / Register) */}
      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Schola AI Modal */}
      <ScholaChatModal
        isOpen={isScholaOpen}
        onClose={() => setIsScholaOpen(false)}
        student={student || mockCurrentUser}
        applications={applications}
        programs={programs}
        payoutBatches={payoutBatches}
      />

      {/* Institutional Student Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            <SacSeal className="h-6 w-6" size={24} />
            <span className="font-bold text-slate-700">St. Anthony’s College</span>
            <span>•</span>
            <span>San Jose de Buenavista, 5700 Antique, Philippines</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Institutional Scholarship Program and Services Office (ISPSO) • ispeso@sac.edu.ph • 0906-451-6128
          </p>
          <p className="text-[10px] text-slate-400 pt-1">
            Compliant with RA 10173 Philippine Data Privacy Act • Progressive Web App Ready
          </p>
        </div>
      </footer>
    </div>
  );
}
