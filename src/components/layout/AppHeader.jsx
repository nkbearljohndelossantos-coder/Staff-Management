import React, { useState, useEffect } from 'react';
import { LogOut, Menu, QrCode, Search, Command, Sun, Moon, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import NotificationBell from '../common/NotificationBell';
import TerminalLockModal from '../common/TerminalLockModal';

export default function AppHeader({ sidebarOpen, setSidebarOpen, onOpenCommandPalette }) {
  const { currentUser, logout, openDigitalId, theme, toggleTheme } = useApp();
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);

  // Inactivity auto-lock (20 minutes)
  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsTerminalLocked(true);
      }, 20 * 60 * 1000);
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ceo':
        return { label: 'CEO', color: 'bg-slate-900 text-amber-300 border-slate-700' };
      case 'it_admin':
        return { label: 'IT Admin', color: 'bg-slate-900 text-cyan-300 border-slate-700' };
      case 'admin':
        return { label: 'COO', color: 'bg-slate-900 text-blue-300 border-slate-700' };
      case 'hr':
        return { label: 'HR Admin', color: 'bg-slate-900 text-emerald-300 border-slate-700' };
      case 'finance':
      case 'accounting':
        return { label: 'Accounting', color: 'bg-slate-900 text-indigo-300 border-slate-700' };
      case 'canteen':
        return { label: 'Canteen', color: 'bg-slate-900 text-rose-300 border-slate-700' };
      case 'security':
        return { label: 'Security', color: 'bg-slate-900 text-slate-200 border-slate-700' };
      default:
        return { label: 'Employee', color: 'bg-slate-900 text-slate-200 border-slate-700' };
    }
  };

  const formatShortName = (name) => {
    if (!name) return 'Staff User';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const toTitle = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    
    // Convert e.g. "Carl Laurence B. PATAGNAN" -> "Carl Patagnan"
    const first = toTitle(parts[0]);
    const last = toTitle(parts[parts.length - 1]);
    return `${first} ${last}`;
  };

  const badge = getRoleBadge(currentUser?.role);
  const shortName = formatShortName(currentUser?.name);
  const isEmployee = currentUser?.role === 'employee';

  return (
    <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-2.5">
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Brand & Left Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            {/* Mobile Hamburger Toggle for Side Navigation */}
            <button
              type="button"
              onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Toggle Sidebar Navigation"
            >
              <Menu className="h-5 w-5 text-slate-400" />
            </button>

            <img
              src="/LogoC.png"
              alt="NKB Logo"
              className="h-9 w-9 object-contain drop-shadow"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">NKB MANUFACTURING</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                  {isEmployee ? 'Employee Portal' : 'Enterprise Portal'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {isEmployee ? 'Personal Self-Service & Payslips' : 'Multi-Role Staff, Coop, Loans & Payroll Management'}
              </p>
            </div>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* User Profile & Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end shrink-0">

          {/* Command Palette Trigger Button (Ctrl+K) */}
          <button
            type="button"
            onClick={() => onOpenCommandPalette && onOpenCommandPalette()}
            className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition cursor-pointer text-xs font-semibold shrink-0 shadow-sm"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden md:inline text-[11px] text-slate-300">Commands</span>
            <kbd className="hidden sm:inline px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-400 font-bold">
              ⌘K
            </kbd>
          </button>

          {/* In-App Notifications Bell */}
          <NotificationBell />

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-300" />
            )}
          </button>

          {/* Manual Terminal Security Lock */}
          <button
            type="button"
            onClick={() => setIsTerminalLocked(true)}
            className="h-8 w-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 flex items-center justify-center transition cursor-pointer shrink-0 shadow-sm"
            title="Lock Terminal Workstation"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>

          {/* Quick Digital ID Button (Available everywhere on Mobile & Desktop) */}
          <button
            type="button"
            onClick={() => openDigitalId()}
            className="h-8 px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition cursor-pointer text-xs font-bold shrink-0 shadow-sm"
            title="Open My Digital ID (Barcode & QR Pass)"
          >
            <QrCode className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px] font-extrabold">Digital ID</span>
          </button>

          {/* Current User Card */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800 shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 shadow-sm bg-slate-900 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight shrink-0 whitespace-nowrap" title={currentUser?.name || 'Staff User'}>
              <div className="text-xs font-bold text-white whitespace-nowrap">
                {shortName}
              </div>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge.color} mt-0.5 whitespace-nowrap`}>
                {badge.label}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 text-slate-400 flex items-center gap-1.5 transition cursor-pointer text-xs font-bold shrink-0"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>

      </div>

      {/* Terminal Lock Security Modal */}
      <TerminalLockModal
        isOpen={isTerminalLocked}
        onUnlock={() => setIsTerminalLocked(false)}
      />
    </header>
  );
}
