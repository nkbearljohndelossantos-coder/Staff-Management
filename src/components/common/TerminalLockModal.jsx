import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, LogOut, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TerminalLockModal({ isOpen, onUnlock }) {
  const { currentUser, logout } = useApp();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleUnlockSubmit = (e) => {
    e?.preventDefault();
    // Accept demo PIN '1234' or any 4+ digit numeric PIN, or password
    if (!pin.trim() || pin.length < 4) {
      setErrorMsg('Please enter your 4-digit PIN (Default demo: 1234)');
      return;
    }
    setErrorMsg('');
    setPin('');
    onUnlock();
  };

  const handleQuickUnlock = () => {
    setErrorMsg('');
    setPin('');
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Emblem */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-inner">
          <Lock className="h-8 w-8 text-cyan-400 animate-pulse" />
        </div>

        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-extrabold uppercase tracking-wider">
            Terminal Inactivity Security Lock
          </span>
          <h2 className="text-xl font-black text-white pt-1">Session Suspended</h2>
          <p className="text-xs text-slate-400">
            For plant &amp; payroll compliance, this workstation has been locked.
          </p>
        </div>

        {/* User Card */}
        <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-3 text-left">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-xl object-cover border border-slate-600 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-700 text-white font-black text-sm flex items-center justify-center shrink-0">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'US'}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{currentUser?.name || 'Authorized Staff'}</h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Role: {currentUser?.role?.toUpperCase() || 'STAFF'}
            </p>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlockSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              autoFocus
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Enter PIN (Demo: 1234)"
              className="w-full h-12 px-4 text-center rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg tracking-widest placeholder:text-slate-600 placeholder:text-xs placeholder:tracking-normal focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold">{errorMsg}</p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
            >
              <Unlock className="h-4 w-4" />
              <span>Unlock Terminal</span>
            </button>

            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              <span>Quick Unlock (Demo Bypass)</span>
            </button>
          </div>
        </form>

        {/* Sign Out Option */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-center">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-slate-400 hover:text-rose-400 font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Switch User / Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
