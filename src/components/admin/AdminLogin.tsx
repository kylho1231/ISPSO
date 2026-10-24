'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { SacSeal } from '@/components/SacSeal';

interface AdminLoginProps {
  onSuccess: (username: string) => void;
  onSwitchToStudent?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onSwitchToStudent,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials per user requirements: username = "admin", password = "admin123"
      if (username.trim() === 'admin' && password === 'admin123') {
        setIsLoading(false);
        onSuccess(username.trim());
      } else {
        setIsLoading(false);
        setError('The username or password is incorrect. Check your details and try again.');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-slate-50 relative overflow-hidden">
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="relative mb-3">
            <div className="rounded-full p-2 bg-white shadow-md border-2 border-sac-gold-400">
              <SacSeal className="h-16 w-16 drop-shadow-sm" size={64} />
            </div>
          </div>
          <span className="rounded-full bg-white px-3.5 py-1 text-xs font-bold tracking-wider uppercase text-sac-maroon-900 border border-sac-maroon-200 shadow-sm">
            St. Anthony’s College • ISPSO Workstation
          </span>
          <h1 className="mt-2.5 font-serif text-2xl sm:text-3xl font-extrabold text-slate-900">
            Administrative Console
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 max-w-sm font-normal">
            Desktop workstation for scholarship management, document verification, and stipend releasing • San Jose de Buenavista, Antique.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200">
          <div className="mb-5 flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Staff Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Restricted to authorized ISPSO coordinators &amp; cashiers
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-mono font-bold text-slate-600">
              PC Only
            </span>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-sm font-bold text-slate-700  mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="admin-username"
                  autoComplete="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full rounded-md border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sac-maroon-800 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-bold text-slate-700  mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  id="admin-password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-md border border-slate-300 pl-10 pr-10 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sac-maroon-800 bg-slate-50/50"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-500 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Authorized Workstation Access Note */}
            <div className="rounded-xl bg-sac-maroon-50/70 border border-sac-maroon-200/80 p-3.5 text-xs text-sac-maroon-950 flex items-center justify-between">
              <div>
                <span className="font-bold">ISPSO Terminal:</span>{' '}
                <span className="text-slate-600 font-mono">admin</span> / <span className="text-slate-600 font-mono">admin123</span>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-xs font-bold text-sac-maroon-800 hover:underline px-2 py-1 rounded-md bg-white border border-sac-maroon-200"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-sac-maroon-800 py-3 text-sm font-semibold text-white  hover:bg-sac-maroon-900 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Return to Student Portal Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-1.5">Are you an Anthonian student?</p>
            {onSwitchToStudent ? (
              <button
                type="button"
                onClick={onSwitchToStudent}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-sac-maroon-800 hover:underline"
              >
                <Smartphone className="h-3.5 w-3.5 text-sac-gold-600" />
                <span>Open Student PWA Portal &rarr;</span>
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-sac-maroon-800 hover:underline"
              >
                <Smartphone className="h-3.5 w-3.5 text-sac-gold-600" />
                <span>Open Student PWA Portal &rarr;</span>
              </a>
            )}
          </div>
        </div>

        {/* Security / RA 10173 footer */}
        <p className="mt-4 text-center text-xs text-slate-500 font-mono">
          For account assistance, contact the ISPSO office.
        </p>
      </div>
    </div>
  );
};
