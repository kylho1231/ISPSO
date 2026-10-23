'use client';
import React from 'react';
import { LogOut } from 'lucide-react';
import { SacSeal } from '@/components/SacSeal';
interface NavbarProps {
  currentView: 'admin' | 'student';
  onViewChange: (view: 'admin' | 'student') => void;
  isAdminAuthenticated?: boolean;
  onAdminLogout?: () => void;
}
export const Navbar: React.FC<NavbarProps> = ({ currentView, onViewChange, isAdminAuthenticated, onAdminLogout }) => (
  <header className="border-t-4 border-t-sac-maroon-800 border-b border-slate-200 bg-white">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <SacSeal className="h-12 w-12 shrink-0" size={48} />
        <div>
          <p className="font-serif text-xl font-bold text-sac-maroon-900">St. Anthony’s College</p>
          <p className="text-sm text-slate-600">ISPSO · Scholarship Services</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
        <nav aria-label="Choose portal" className="flex gap-1">
          {(['student', 'admin'] as const).map((view) => (
            <button key={view} onClick={() => onViewChange(view)} aria-pressed={currentView === view}
              className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${currentView === view ? 'border-sac-maroon-800 text-sac-maroon-800' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
              {view === 'student' ? 'Student portal' : 'Administration'}
            </button>
          ))}
        </nav>
        {currentView === 'admin' && isAdminAuthenticated && onAdminLogout && (
          <button onClick={onAdminLogout} className="flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        )}
      </div>
    </div>
  </header>
);
