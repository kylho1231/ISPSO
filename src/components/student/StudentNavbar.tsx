'use client';

import React from 'react';
import {
  ShieldCheck,
  Download,
  Bell,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { SacSeal } from '@/components/SacSeal';
import { StudentProfile } from '@/lib/types';

interface StudentNavbarProps {
  student: StudentProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onInstallPwa: () => void;
  canInstallPwa: boolean;
  unreadCount?: number;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({
  student,
  onOpenAuth,
  onLogout,
  onInstallPwa,
  canInstallPwa,
  unreadCount = 2,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-sac-maroon-100 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & SAC Seal */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center">
            <SacSeal className="h-11 w-11 drop-shadow-sm" size={44} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-sac-maroon-900">
                SAC ISPSO <span className="text-sac-maroon-700 font-semibold">ScholarLink</span>
              </span>
              <span className="hidden rounded-full bg-sac-maroon-50 px-2 py-0.5 text-[10px] font-bold text-sac-maroon-800 sm:inline-flex items-center gap-1 border border-sac-maroon-200">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> @sac.edu.ph
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              St. Anthony’s College • San Jose de Buenavista, Antique
            </p>
          </div>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* PWA Install Button */}
          {canInstallPwa && (
            <button
              onClick={onInstallPwa}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-sac-gold-100 border border-sac-gold-300 px-3 py-1.5 text-xs font-bold text-sac-gold-900 shadow-sm hover:bg-sac-gold-200 transition"
              title="Install ScholarLink App on your device"
            >
              <Download className="h-3.5 w-3.5 text-sac-maroon-800" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {student ? (
            /* Logged in student info & controls */
            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
              <button
                className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                title="Scholarship Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sac-maroon-700 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sac-maroon-800 text-sac-gold-400 font-bold text-xs ring-2 ring-sac-gold-400 shadow-sm">
                  JE
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {student.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                    {student.email}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="rounded-xl p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-1"
                title="Sign Out of Student Account"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Public / Guest action buttons */
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="rounded-xl bg-sac-maroon-800 px-3.5 py-1.5 text-xs font-bold text-sac-gold-400 hover:bg-sac-maroon-900 transition shadow-sm"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
