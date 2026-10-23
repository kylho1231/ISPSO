'use client';

import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Smartphone,
  Monitor,
  Bell,
  User,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'admin' | 'student';
  onViewChange: (view: 'admin' | 'student') => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  unreadCount = 2,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Crest */}
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-anthonian-800 to-anthonian-950 text-white shadow-md">
            <GraduationCap className="h-6 w-6 text-gold-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-anthonian-900">
                SAC ISPSO <span className="text-anthonian-600 font-semibold">ScholarLink</span>
              </span>
              <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-anthonian-700 sm:inline-flex items-center gap-1 border border-blue-200">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> @sac.edu.ph
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              St. Anthony’s College • San Jose de Buenavista, Antique
            </p>
          </div>
        </div>

        {/* View Switcher: Admin PC vs Student PWA */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => onViewChange('admin')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-anthonian-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ISPSO Staff</span>
              <span className="sm:hidden">Staff</span>
            </button>
            <button
              onClick={() => onViewChange('student')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                currentView === 'student'
                  ? 'bg-anthonian-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-gold-400" />
              <span className="hidden sm:inline">Student PWA</span>
              <span className="sm:hidden">Student</span>
            </button>
          </div>

          {/* User & Notification status */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="relative">
              <button
                className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                title="Official Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-anthonian-100 text-anthonian-800 font-bold text-xs ring-2 ring-anthonian-800/20">
                {currentView === 'admin' ? 'AD' : 'JD'}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {currentView === 'admin' ? 'ISPSO Admin Desk' : 'Juan Miguel Dela Cruz'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  {currentView === 'admin' ? 'ispso@sac.edu.ph' : 'jdelacruz@sac.edu.ph'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
