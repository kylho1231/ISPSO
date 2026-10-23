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
  onSwitchToStudent: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onSwitchToStudent,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
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
        setError('Invalid username or password. Please use username: admin and password: admin123');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-slate-100 via-sac-maroon-50/20 to-slate-100">
      <div className="w-full max-w-md">
        {/* Top Seal & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 rounded-3xl bg-white shadow-md border border-sac-maroon-100 mb-3">
            <SacSeal size={72} className="h-16 w-16" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-sac-maroon-900 uppercase">
            St. Anthony’s College
          </h1>
          <p className="text-xs font-semibold text-slate-500">San Jose de Buenavista, Antique</p>
          <div className="mt-2 inline-flex items-center space-x-1.5 rounded-full bg-sac-maroon-800 text-sac-gold-400 px-3 py-1 text-xs font-bold shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ISPSO Administrative Console</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          {/* Subtle Maroon Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sac-maroon-800 via-sac-gold-500 to-sac-maroon-800" />

          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">Sign In to Admin Console</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized ISPSO coordinators, staff, and cashiers only.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sac-maroon-800 bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sac-maroon-800 bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Helper */}
            <div className="rounded-xl bg-sac-maroon-50/60 border border-sac-maroon-200/60 p-3 text-[11px] text-sac-maroon-900 flex items-center justify-between">
              <div>
                <span className="font-bold">Required Login:</span>{' '}
                <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-sac-maroon-800 border border-sac-maroon-200">
                  admin
                </code>{' '}
                /{' '}
                <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-sac-maroon-800 border border-sac-maroon-200">
                  admin123
                </code>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[10px] font-bold text-sac-maroon-800 hover:underline"
              >
                Auto-fill
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-sac-maroon-800 py-3 text-xs font-black text-sac-gold-400 shadow-md hover:bg-sac-maroon-900 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Student Portal */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-2">Are you a student of St. Anthony’s College?</p>
            <button
              onClick={onSwitchToStudent}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-sac-maroon-800 hover:underline"
            >
              <Smartphone className="h-3.5 w-3.5 text-sac-gold-600" />
              <span>Go to Student PWA Portal (Jhon Kylho Estrabo) &rarr;</span>
            </button>
          </div>
        </div>

        {/* Security / RA 10173 footer */}
        <p className="mt-4 text-center text-[10px] text-slate-400 font-mono">
          St. Anthony’s College ISPSO • Protected by RA 10173 Data Privacy Act
        </p>
      </div>
    </div>
  );
};
