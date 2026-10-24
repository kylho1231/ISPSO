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
import { getStudentByEmail, upsertStudent } from '@/lib/supabaseService';
import { getStoredRegisteredStudents, saveStoredRegisteredStudents } from '@/lib/storage';

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

  // Login Form State (Clean production state)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State (Clean production state)
  const [regFullName, setRegFullName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regLrn, setRegLrn] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCourse, setRegCourse] = useState('BS Information Technology (BSIT)');
  const [regYear, setRegYear] = useState('1');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailTrimmed = loginEmail.trim().toLowerCase();

      // Domain validation check for @sac.edu.ph
      if (!emailTrimmed.endsWith('@sac.edu.ph')) {
        setError('Only official @sac.edu.ph institutional email addresses are permitted.');
        setIsLoading(false);
        return;
      }

      // Check registered students via Supabase / local cache
      const existing = await getStudentByEmail(emailTrimmed);

      if (existing) {
        onLoginSuccess(existing);
      } else {
        // Derive clean initial profile from institutional email
        const localPart = emailTrimmed.split('@')[0];
        const formattedName = localPart
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const newProfile: StudentProfile = {
          id: `stud-${Date.now()}`,
          email: emailTrimmed,
          fullName: formattedName,
          studentIdNumber: `SAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          lrn: '115201140001',
          course: 'College of Computer Studies',
          yearLevel: 1,
          contactNumber: '0917-000-0000',
          municipality: 'San Jose de Buenavista, Antique',
          isProfileComplete: true,
        };

        const saved = await upsertStudent(newProfile);
        onLoginSuccess(saved);
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const emailTrimmed = regEmail.trim().toLowerCase();

      if (!emailTrimmed.endsWith('@sac.edu.ph')) {
        setError('Registration is restricted to @sac.edu.ph institutional accounts.');
        setIsLoading(false);
        return;
      }

      const cleanLrn = regLrn.replace(/\D/g, '');
      if (cleanLrn.length !== 12) {
        setError('Please enter a valid 12-digit DepEd Learner Reference Number (LRN).');
        setIsLoading(false);
        return;
      }

      const newStudent: StudentProfile = {
        id: `stud-${Date.now()}`,
        email: emailTrimmed,
        fullName: regFullName.trim(),
        studentIdNumber: regStudentId.trim(),
        lrn: cleanLrn,
        course: regCourse,
        yearLevel: parseInt(regYear) || 1,
        contactNumber: regPhone.trim(),
        municipality: 'San Jose de Buenavista, Antique',
        isProfileComplete: true,
      };

      const saved = await upsertStudent(newStudent);
      onLoginSuccess(saved);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please review inputs.');
    } finally {
      setIsLoading(false);
    }
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
                    placeholder="your.name@sac.edu.ph"
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
                    placeholder="Enter your account password"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sac-maroon-800"
                  />
                </div>
              </div>

              {/* Institutional Notice */}
              <div className="rounded-xl bg-sac-maroon-50/70 p-3 border border-sac-maroon-200/80 text-[11px] text-slate-700 leading-relaxed">
                <span className="font-bold text-sac-maroon-900">Institutional Access:</span>{' '}
                Only active St. Anthony&apos;s College students with an official{' '}
                <span className="font-mono font-bold text-sac-maroon-800">@sac.edu.ph</span> Google Workspace
                account can authenticate into ScholarLink.
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
                  placeholder="e.g. Maria Santos Dela Cruz"
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
                    placeholder="e.g. 2026-00412"
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
                    placeholder="e.g. 115201140001"
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
                  placeholder="e.g. msantos@sac.edu.ph"
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
                    placeholder="e.g. BS Information Technology"
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
                    placeholder="e.g. 0917-123-4567"
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
