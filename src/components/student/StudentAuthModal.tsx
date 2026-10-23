'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Smartphone,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { SacSeal } from '@/components/SacSeal';
import { StudentProfile } from '@/lib/types';
import { mockCurrentUser } from '@/lib/mockData';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess: (student: StudentProfile) => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('jestrabo@sac.edu.ph');
  const [loginPassword, setLoginPassword] = useState('student123');

  // Register Form State
  const [regFullName, setRegFullName] = useState('Jhon Kylho Estrabo');
  const [regStudentId, setRegStudentId] = useState('STUDENT-JH-2026');
  const [regLrn, setRegLrn] = useState('115201140091');
  const [regEmail, setRegEmail] = useState('jestrabo@sac.edu.ph');
  const [regCourse, setRegCourse] = useState('BS Information Technology (BSIT 3)');
  const [regYear, setRegYear] = useState('3');
  const [regPhone, setRegPhone] = useState('0917-882-9102');
  const [regPassword, setRegPassword] = useState('student123');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Domain validation check for @sac.edu.ph
      if (!loginEmail.toLowerCase().endsWith('@sac.edu.ph')) {
        setError('Only official @sac.edu.ph institutional email addresses are permitted.');
        return;
      }

      // Successful student login
      onLoginSuccess({
        ...mockCurrentUser,
        email: loginEmail,
      });
      onClose();
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (!regEmail.toLowerCase().endsWith('@sac.edu.ph')) {
        setError('Registration is restricted to @sac.edu.ph institutional accounts.');
        return;
      }

      if (regLrn.replace(/\D/g, '').length !== 12) {
        setError('Please enter a valid 12-digit DepEd Learner Reference Number (LRN).');
        return;
      }

      const newStudent: StudentProfile = {
        id: `stud-${Date.now()}`,
        email: regEmail.trim(),
        fullName: regFullName.trim(),
        studentIdNumber: regStudentId.trim(),
        lrn: regLrn.replace(/\D/g, ''),
        course: regCourse,
        yearLevel: parseInt(regYear) || 1,
        contactNumber: regPhone.trim(),
        municipality: 'San Jose de Buenavista, Antique',
        isProfileComplete: true,
        gwa: 1.38,
      };

      onLoginSuccess(newStudent);
      onClose();
    }, 500);
  };

  const handleQuickDemo = () => {
    setLoginEmail('jestrabo@sac.edu.ph');
    setLoginPassword('student123');
    onLoginSuccess(mockCurrentUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-sac-maroon-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SacSeal className="h-10 w-10 shrink-0 drop-shadow" size={40} />
            <div>
              <h3 className="font-black text-sm text-white">St. Anthony’s College</h3>
              <p className="text-[11px] text-sac-gold-300 font-medium">
                ISPSO Student Scholarship Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sac-maroon-200 hover:bg-sac-maroon-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition ${
              mode === 'login'
                ? 'border-b-2 border-sac-maroon-800 text-sac-maroon-900 bg-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In (@sac.edu.ph)
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-center transition ${
              mode === 'register'
                ? 'border-b-2 border-sac-maroon-800 text-sac-maroon-900 bg-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Institutional Email (@sac.edu.ph)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. jestrabo@sac.edu.ph"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sac-maroon-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your student password"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sac-maroon-800"
                  />
                </div>
              </div>

              {/* Demo One-Click Fill */}
              <div className="rounded-xl bg-sac-maroon-50 p-3 border border-sac-maroon-200 flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-bold text-sac-maroon-900">Demo Scholar:</span>{' '}
                  <span className="text-slate-600">Jhon Kylho Estrabo</span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="font-bold text-sac-maroon-800 hover:underline"
                >
                  Quick Sign In &rarr;
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-sac-maroon-800 py-3 text-xs font-black text-sac-gold-400 shadow hover:bg-sac-maroon-900 transition flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In to Student Portal'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Full Name (as in SAC ID):</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Jhon Kylho Estrabo"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Student ID No.:</label>
                  <input
                    type="text"
                    required
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    placeholder="e.g. STUDENT-JH-2026"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">12-Digit DepEd LRN:</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={regLrn}
                    onChange={(e) => setRegLrn(e.target.value)}
                    placeholder="e.g. 115201140091"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Institutional Email (@sac.edu.ph):</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. jestrabo@sac.edu.ph"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Course / Degree:</label>
                  <input
                    type="text"
                    required
                    value={regCourse}
                    onChange={(e) => setRegCourse(e.target.value)}
                    placeholder="e.g. BSIT 3"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">Mobile Contact:</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 0917-882-9102"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">Create Password:</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-sac-maroon-800 py-3 text-xs font-black text-sac-gold-400 shadow hover:bg-sac-maroon-900 transition flex items-center justify-center space-x-2 mt-2"
              >
                <span>{isLoading ? 'Creating Account...' : 'Register Student Account'}</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </form>
          )}

          <p className="text-center text-[10px] text-slate-400">
            Compliant with RA 10173 Philippine Data Privacy Act
          </p>
        </div>
      </div>
    </div>
  );
};
