import React from 'react';

const GLASS_PANEL =
  'rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] ring-1 ring-white/10';

/**
 * Shared login / portal backdrop using NKB Manufacturing building photo with modern dark theme.
 * Replicated from Canteen login system.
 */
export default function LoginShell({
  children,
  subtitle = 'Staff Onboarding, Barcode Badges, Payroll & Payslip Portal',
  title = 'NKB HR & PAYROLL'
}) {
  return (
    <div className="min-h-screen h-screen max-h-screen relative overflow-hidden font-sans text-slate-100 bg-[#070b13]">
      {/* Background Building Image with Darkened Mesh */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
        style={{ backgroundImage: "url('/login-building.jpg')" }}
        aria-hidden
      />
      {/* Multi-layer Dark Gradient Overlays */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#070b13]/90 via-[#0b111c]/85 to-[#101726]/90"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,141,242,0.18),rgba(255,255,255,0))]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#070b13] via-transparent to-[#070b13]/40"
        aria-hidden
      />

      <div className="relative z-10 h-full min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Brand Showcase (Desktop) */}
        <div className="hidden lg:flex lg:w-[40%] xl:w-[42%] flex-col justify-end p-8 xl:p-12 shrink-0">
          <div className="max-w-md space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-400/30 text-brand-300 text-[11px] font-bold tracking-widest uppercase backdrop-blur-md shadow-glow-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              NKB Manufacturing Corp.
            </div>
            <h2 className="text-3xl xl:text-4xl font-black leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-tight">
              Enterprise Human Resources &amp; Total Rewards
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm drop-shadow-md font-medium">
              Automated employee ID sequencing, Code 128 barcode badge generation, live attendance clock-in, and statutory payroll disbursement.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Payroll Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>HRIS Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Container */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-4xl my-auto">
            <div className="mb-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="relative group mb-3">
                <div className="absolute -inset-2 bg-gradient-to-r from-brand-500/30 to-indigo-500/30 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500" />
                <img
                  src="/LogoC.png"
                  alt="NKB Manufacturing"
                  className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md flex items-center gap-2.5">
                {title}
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/30 tracking-wider">
                  v2.0
                </span>
              </h1>
              {subtitle && (
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-md drop-shadow-sm font-medium">{subtitle}</p>
              )}
            </div>

            <div className={`${GLASS_PANEL} p-5 sm:p-6`}>
              {children}
            </div>

            <p className="mt-4 text-center text-[11px] font-medium text-slate-400/80 drop-shadow-sm">
              © {new Date().getFullYear()} NKB Manufacturing Corp. · Enterprise Operations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
