'use client';

import React from 'react';
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  Bell,
  LogOut,
} from 'lucide-react';
import { SacSeal } from '@/components/SacSeal';

interface NavbarProps {
  currentView: 'admin' | 'student';
  onViewChange: (view: 'admin' | 'student') => void;
  unreadCount?: number;
  isAdminAuthenticated?: boolean;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  unreadCount = 2,
  isAdminAuthenticated = false,
  onAdminLogout,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-sac-maroon-100 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Crest */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center">
            <SacSeal className="h-11 w-11 drop-shadow-sm" size={44} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-sac-maroon-900">
                SAC ISPSO <span className="text-sac-maroon-700 font-semibold">ScholarLink</span>
              </span>
              <span className="hidden rounded-full bg-sac-maroon-50 px-2 py-0.5 text-[11px] font-semibold text-sac-maroon-800 sm:inline-flex items-center gap-1 border border-sac-maroon-200">
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
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                currentView === 'admin'
                  ? 'bg-sac-maroon-800 text-sac-gold-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ISPSO Staff Console</span>
              <span className="sm:hidden">Staff</span>
            </button>
            <button
              onClick={() => onViewChange('student')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                currentView === 'student'
                  ? 'bg-sac-maroon-800 text-sac-gold-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5 text-sac-gold-400" />
              <span className="hidden sm:inline">Student PWA Portal</span>
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
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sac-maroon-600 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sac-maroon-100 text-sac-maroon-800 font-bold text-xs ring-2 ring-sac-gold-400">
                {currentView === 'admin' ? 'AD' : 'JE'}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {currentView === 'admin' ? 'ISPSO Admin Desk' : 'Jhon Kylho Estrabo'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">
                  {currentView === 'admin' ? 'ispso@sac.edu.ph' : 'jestrabo@sac.edu.ph'}
                </p>
              </div>

              {currentView === 'admin' && isAdminAuthenticated && onAdminLogout && (
                <button
                  onClick={onAdminLogout}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-1"
                  title="Sign Out of Admin Console"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
