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
  QrCode,
  MessageSquare,
  FileText,
  Users,
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

  // Data initialized with defaults and synchronized from storage
  const [applications, setApplications] = useState<Application[]>(initialApps);
  const [programs] = useState<ScholarshipProgram[]>(initialPrograms);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>(initialBatches);
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);

  useEffect(() => {
    // Load student session and data
    const savedStudent = getStoredStudentSession();
    setStudent(savedStudent);

    setApplications(getStoredApplications());
    setPayoutBatches(getStoredBatches());
    setAnnouncements(getStoredAnnouncements());
    setSmsMessages(getStoredSms());

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

  const handleLoginSuccess = (user: StudentProfile) => {
    setStudent(user);
    saveStoredStudentSession(user);
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    setStudent(null);
    saveStoredStudentSession(null);
  };

  const handleSubmitApplication = (newApp: Partial<Application>) => {
    const app: Application = {
      ...(newApp as Application),
      id: `app-${Date.now()}`,
    };
    const updated = [app, ...applications];
    setApplications(updated);
    saveStoredApplications(updated);
  };

  const handleSendStudentSms = (text: string) => {
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
          /* Public Student Homepage */
          <div className="space-y-12 pb-16">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-b from-white via-sac-maroon-50/30 to-slate-50 border-b border-sac-maroon-100 py-12 sm:py-16">
              <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                <div className="mx-auto flex justify-center mb-5">
                  <SacSeal className="h-24 w-24 drop-shadow-md" size={96} />
                </div>

                <div className="inline-flex items-center space-x-2 rounded-full bg-sac-maroon-100 px-3.5 py-1 text-xs font-bold text-sac-maroon-900 border border-sac-maroon-200 mb-4">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>St. Anthony’s College • ISPSO Official Student Portal</span>
                </div>

                <h1 className="font-serif text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                  Anthonian <span className="text-sac-maroon-800">ScholarLink</span>
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
                  The centralized digital scholarship portal of St. Anthony’s College, San Jose de Buenavista, Antique. Real-time payout releasing schedules, online applications, instant mobile SMS updates, and AI scholarship matching.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-xl bg-sac-maroon-800 px-6 py-3.5 text-sm font-bold text-sac-gold-400 shadow-md hover:bg-sac-maroon-900 transition"
                  >
                    <span>Sign In (@sac.edu.ph)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center space-x-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                  >
                    <span>Create Account</span>
                  </button>

                  <button
                    onClick={handleInstallPwa}
                    className="inline-flex items-center space-x-2 rounded-xl bg-sac-gold-100 border border-sac-gold-300 px-4 py-3.5 text-sm font-bold text-sac-gold-950 shadow-sm hover:bg-sac-gold-200 transition"
                  >
                    <Download className="h-4 w-4 text-sac-maroon-800" />
                    <span>Install App on Phone</span>
                  </button>
                </div>

                {/* Quick 1-Click Demo Login */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="inline-flex items-center space-x-2 rounded-xl bg-sac-maroon-50 px-4 py-2 text-xs border border-sac-maroon-200">
                    <span className="font-bold text-sac-maroon-950">Demo Account:</span>
                    <span className="text-slate-600">Jhon Kylho Estrabo (BSIT 3)</span>
                    <button
                      onClick={() => handleLoginSuccess(mockCurrentUser)}
                      className="ml-2 font-bold text-sac-maroon-800 underline hover:text-sac-maroon-950"
                    >
                      Instant Sign In &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* KEY FEATURES GRID */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl font-bold text-slate-900">
                  Built for Every Anthonian Scholar
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Connecting students directly with the Institutional Scholarship Program and Services Office.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sac-maroon-100 text-sac-maroon-800 mb-3">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Digital QR Payout Pass</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Fast stipend claiming at the SAC Gymnasium releasing counters without printing bulky vouchers.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-3">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">2-Way ISPSO SMS Alerts</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Direct mobile text notifications for approval status, deficiencies, and releasing dates to your phone.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">DepEd 12-Digit LRN Check</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Automated document pre-verification matching uploaded ID with institutional records to prevent fraud.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sac-gold-200 text-sac-gold-950 mb-3">
                    <Bot className="h-5 w-5 text-sac-maroon-800" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Schola AI Advisor</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Interactive AI scholarship counselor that knows your GWA and guides you to all eligible grants.
                  </p>
                </div>
              </div>
            </section>

            {/* OPEN SCHOLARSHIPS CATALOG */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-slate-900">
                    Available Scholarships (AY 2026–2027)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore 8 institutional, CHED, and alumni financial assistance programs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="rounded-xl border border-sac-maroon-800 px-3.5 py-1.5 text-xs font-bold text-sac-maroon-800 hover:bg-sac-maroon-50"
                >
                  Apply Online &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {programs.slice(0, 6).map((prog) => (
                  <div
                    key={prog.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-sac-maroon-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded-md bg-sac-maroon-50 px-2 py-0.5 text-[10px] font-bold text-sac-maroon-800 border border-sac-maroon-100">
                          {prog.code}
                        </span>
                        <span className="text-xs font-black text-emerald-700">
                          ₱{prog.grantAmount.toLocaleString()}/sem
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{prog.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prog.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px]">
                        Slots: <strong className="text-slate-800 font-bold">{prog.slots}</strong> available
                      </span>
                      <button
                        onClick={() => {
                          setAuthMode('login');
                          setAuthModalOpen(true);
                        }}
                        className="font-bold text-sac-maroon-800 hover:underline"
                      >
                        Apply &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* OFFICIAL ANNOUNCEMENTS BULLETIN (Replaces Facebook Delays) */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sac-maroon-800 text-sac-gold-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        Official ISPSO Campus Announcements
                      </h3>
                      <p className="text-xs text-slate-500">
                        Direct releases from the ISPSO desk — never miss a releasing date.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {announcements.slice(0, 3).map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className="rounded-md bg-sac-maroon-100 px-2 py-0.5 text-[10px] font-bold text-sac-maroon-800">
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
                      <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">{ann.content}</p>
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
          className="group flex items-center space-x-2 rounded-full bg-sac-maroon-800 py-3 px-5 text-xs font-bold text-sac-gold-400 shadow-xl hover:bg-sac-maroon-900 hover:shadow-2xl transition ring-4 ring-sac-gold-400/30"
          title="Ask Schola AI Assistant"
        >
          <div className="relative">
            <Bot className="h-5 w-5 text-sac-gold-400" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sac-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sac-gold-500"></span>
            </span>
          </div>
          <span className="text-white font-black">Ask Schola AI</span>
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
