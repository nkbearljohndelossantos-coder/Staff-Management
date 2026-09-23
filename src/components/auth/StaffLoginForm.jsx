import React, { useState } from 'react';
import { LogIn, UserCircle, ScanLine, ShieldCheck, KeyRound, Mail, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function StaffLoginForm({ onSwitchToBarcode }) {
  const { loginStaff } = useApp();
  const [email, setEmail] = useState('elena.vance@nkb.com');
  const [password, setPassword] = useState('••••••••');
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

  const handleQuickFill = (presetEmail) => {
    setEmail(presetEmail);
    setError('');
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
                    Work Email / Account
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@nkb.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950/70 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                      Sign In to HR Terminal
                    </>
                  )}
                </button>
              </form>

              {/* Quick Preset Selector for Easy Testing */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    Demo Accounts by Authority Level:
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Click to fill</span>
                </div>

                {/* Super Admins: Can access all accounts & roles */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-300 mb-1 flex items-center gap-1">
                    <span>👑 Super Admins (Can access all accounts &amp; roles)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('ceo@nkb.com')}
                      className="text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Roberto Sterling (CEO)
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Executive Super Admin · Universal Override
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('it.admin@nkb.com')}
                      className="text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Victor Stone (IT Admin)
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        System Admin · Universal Role Switcher
                      </div>
                    </button>
                  </div>
                </div>

                {/* Isolated Department Accounts: Account-locked once opened */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <span>🔒 Department Roles (Locked to single account)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('elena.vance@nkb.com')}
                      className="text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Elena Vance (HR)
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Staff, Loans &amp; Cash Advances
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('david.chen@nkb.com')}
                      className="text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        David Chen (Accounting)
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        Disbursements &amp; Payroll
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('canteen@nkb.com')}
                      className="text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 transition cursor-pointer"
                    >
                      <div className="text-[11px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Maria Santos (Canteen)
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        POS, POs, Stock &amp; Voids
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 text-center text-[10px] text-slate-500 font-medium flex items-center justify-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              NKB Hierarchical Security Active
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
