import React, { useState } from 'react';
import { ArrowLeft, ScanLine, ShieldCheck, UserRound, Fingerprint, BadgeCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EmployeeBarcodeLogin({ onBackToStaffLogin }) {
  const { loginBarcode, staffList } = useApp();
  const [barcodeInput, setBarcodeInput] = useState('NKB-2026-0003');
  const [pin, setPin] = useState('12345678');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = loginBarcode(barcodeInput, pin);
      if (!res.success) {
        setError(res.message);
      }
      setLoading(false);
    }, 400);
  };

  const handleQuickSelect = (staff) => {
    setBarcodeInput(staff.barcodeValue);
    setPin(staff.pin || '12345678');
    setError('');
  };

  return (
    <div className="relative min-h-[480px]">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <button
          type="button"
          onClick={onBackToStaffLogin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-slate-400" />
          Back to HR Terminal
        </button>
        <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Barcode / ESS Mode
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Info Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/15 shadow-sm">
              <ScanLine className="h-6 w-6 text-slate-200" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Self-Service</p>
              <h2 className="text-lg font-black text-white">Scan or Enter Staff Barcode</h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Use your physical company badge barcode or enter your assigned Employee ID number (e.g. <span className="font-mono text-white font-bold">NKB-2026-0003</span> or <span className="font-mono text-white font-bold">PRJ-2026-0001</span>) and 8-digit security PIN.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
              <UserRound className="h-4 w-4 mx-auto text-slate-400 mb-1" />
              <p className="text-[9px] uppercase font-bold text-slate-400">Badge</p>
              <p className="text-[11px] font-bold text-white">Digital ID</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
              <Fingerprint className="h-4 w-4 mx-auto text-slate-400 mb-1" />
              <p className="text-[9px] uppercase font-bold text-slate-400">Attendance</p>
              <p className="text-[11px] font-bold text-white">Live Logs</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
              <BadgeCheck className="h-4 w-4 mx-auto text-slate-400 mb-1" />
              <p className="text-[9px] uppercase font-bold text-slate-400">Payslips</p>
              <p className="text-[11px] font-bold text-white">PDF Copies</p>
            </div>
          </div>

          {/* Quick Select Employee Badges */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-slate-400" />
              Sample Employee Badges:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {staffList.slice(2, 5).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleQuickSelect(s)}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition cursor-pointer"
                >
                  {s.firstName} ({s.employeeId})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl">
          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ScanLine className="h-3.5 w-3.5 text-slate-400" />
                  Staff Barcode / Employee ID
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Code 128</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                  placeholder="NKB-2026-0003"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950/80 border border-white/20 font-mono text-sm tracking-wider text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5 text-slate-400" />
                  8-Digit Portal Security PIN
                </span>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  {showPin ? <EyeOff className="h-3.5 w-3.5 text-slate-400" /> : <Eye className="h-3.5 w-3.5 text-slate-400" />}
                  <span>{showPin ? 'Hide' : 'Show PIN'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={8}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="12345678"
                  className="w-full h-11 pl-3.5 pr-11 rounded-xl bg-slate-950/80 border border-white/15 text-sm tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  <ScanLine className="h-4 w-4 text-slate-950" />
                  Authenticate &amp; View Portal
                </>
              )}
            </button>
          </form>

          <div className="mt-4 p-2.5 rounded-xl border border-white/15 bg-white/5 text-slate-300 text-[11px] flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span>Default demo PIN for all sample staff badges is <strong className="text-white font-mono">12345678</strong> (Enhanced 8-digit enterprise security).</span>
          </div>
        </div>
      </div>
    </div>
  );
}
