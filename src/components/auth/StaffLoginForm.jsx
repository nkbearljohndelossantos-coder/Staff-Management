import React, { useState } from 'react';
import { LogIn, UserCircle, ScanLine, ShieldCheck, KeyRound, Mail, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function StaffLoginForm({ onSwitchToBarcode }) {
  const { loginStaff } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = loginStaff(email, password);
      if (!res.success) {
        setError(res.message);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-slate-900/85 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5 p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-stretch">
          
          {/* Left: Administrative & HR Staff Login */}
          <section className="min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                <h3 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-slate-400" />
                  Staff Terminal Login
                </h3>
                <span className="text-[10px] uppercase font-bold text-slate-400">HR / Finance / Admin</span>
              </div>

              {error && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Work Email or Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. katherinea.bella@nkb.com or NKB052026-0001"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    Password / 8-Digit PIN
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password or 8-digit PIN"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-sm transition"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 text-slate-950" />
                      Sign In to Terminal
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">
                <p className="text-[11px] font-medium leading-relaxed">
                  Sign in using your registered Employee ID or company work email and assigned 8-digit security PIN.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2 text-center text-[10px] text-slate-500 font-medium flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              NKB Security Active
            </div>
          </section>

          {/* Right: Employee Self-Service / Barcode Portal Card */}
          <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 flex flex-col justify-between gap-5 relative overflow-hidden group">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center mb-3.5 shadow-sm">
                <UserCircle className="h-6 w-6 text-slate-200" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Self-Service Portal</p>
              <h3 className="text-base font-black text-white mt-1">Staff &amp; Payslip Portal</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Scan your physical employee barcode badge or enter your ID to check attendance, view pay records, and download PDF payslips.
              </p>
            </div>
            
            <button
              type="button"
              onClick={onSwitchToBarcode}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <ScanLine className="h-4 w-4 text-slate-950" />
              Open Employee Portal
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
