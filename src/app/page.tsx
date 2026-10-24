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
          /* Public Student Homepage with GetLayers Design Architecture */
          <div className="space-y-16 pb-20">
            {/* ATMOSPHERIC HERO SECTION */}
            <section className="relative overflow-hidden sac-hero-mesh border-b border-sac-maroon-100/60 py-16 sm:py-24">
              <div className="absolute inset-0 sac-grid-overlay pointer-events-none opacity-60" />

              <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                {/* Glowing Institution Seal */}
                <div className="relative mx-auto flex justify-center mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sac-maroon-800 to-sac-gold-500 blur-2xl opacity-25 scale-125 animate-pulse-glow" />
                  <div className="relative rounded-full p-2.5 bg-white/90 backdrop-blur-md shadow-2xl border border-white/80 ring-4 ring-sac-gold-400/20">
                    <SacSeal className="h-24 w-24 sm:h-28 sm:w-28 drop-shadow-md" size={112} />
                  </div>
                </div>

                {/* Institutional Pill Badge */}
                <div className="inline-flex items-center space-x-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-sac-maroon-900 border border-sac-maroon-200 shadow-sm mb-5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>St. Anthony’s College • ISPSO Centralized Scholar Portal</span>
                </div>

                <h1 className="font-serif text-4xl font-black tracking-tight text-slate-900 sm:text-6xl max-w-4xl mx-auto leading-tight">
                  Anthonian <span className="bg-gradient-to-r from-sac-maroon-900 via-sac-maroon-800 to-amber-700 bg-clip-text text-transparent">ScholarLink</span>
                </h1>

                <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed font-medium">
                  The centralized digital scholarship ecosystem of St. Anthony’s College, San Jose de Buenavista, Antique. Real-time payout releasing schedules, online applications, instant mobile SMS updates, and AI scholarship matching.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-2xl bg-sac-maroon-800 px-6 py-3.5 text-sm font-bold text-sac-gold-400 shadow-lg shadow-sac-maroon-950/20 hover:bg-sac-maroon-900 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span>Sign In (@sac.edu.ph)</span>
                    <ArrowRight className="h-4 w-4 text-sac-gold-400" />
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-2xl border border-slate-300 bg-white/90 backdrop-blur px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span>Create Account</span>
                  </button>

                  <button
                    onClick={handleInstallPwa}
                    className="inline-flex items-center space-x-2 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/80 border border-amber-300 px-4 py-3.5 text-sm font-bold text-amber-950 shadow-sm hover:from-amber-100 hover:to-amber-200 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Download className="h-4 w-4 text-sac-maroon-800" />
                    <span>Install App on Phone</span>
                  </button>
                </div>

                {/* Demo Quick Bar */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="inline-flex items-center space-x-2 rounded-full bg-white/90 backdrop-blur px-4 py-1.5 text-xs border border-sac-maroon-200 shadow-sm">
                    <span className="font-bold text-sac-maroon-950">Demo Account:</span>
                    <span className="text-slate-600 font-medium">Jhon Kylho Estrabo (BSIT 3)</span>
                    <button
                      onClick={() => handleLoginSuccess(mockCurrentUser)}
                      className="ml-2 font-bold text-sac-maroon-800 underline hover:text-sac-maroon-950"
                    >
                      Instant Sign In &rarr;
                    </button>
                  </div>
                </div>

                {/* FLOATING STAT METRICS GRID (GetLayers Cinematic Pattern) */}
                <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
                  <div className="glass-card rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/50">
                    <div className="text-2xl sm:text-3xl font-black text-sac-maroon-900 tracking-tight">₱6.8M+</div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Subsidies Managed</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/50">
                    <div className="text-2xl sm:text-3xl font-black text-sac-maroon-900 tracking-tight">8 Schemes</div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">TES, TDP &amp; Grants</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/50">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">100% Verified</div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">DepEd LRN Checking</p>
                  </div>
                  <div className="glass-card rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/50">
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">SAC Gym</div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">Counter QR Releasing</p>
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

      {/* Floating Schola AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsScholaOpen(true)}
          className="group flex items-center space-x-2.5 rounded-full bg-sac-maroon-800 py-3.5 px-5 text-xs font-bold text-sac-gold-400 shadow-2xl hover:bg-sac-maroon-900 hover:scale-105 transition-all duration-200 ring-4 ring-sac-gold-400/40"
          title="Ask Schola AI Assistant"
        >
          <div className="relative">
            <Bot className="h-5 w-5 text-sac-gold-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sac-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sac-gold-500"></span>
            </span>
          </div>
          <span className="text-white font-black tracking-wide">Ask Schola AI</span>
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
