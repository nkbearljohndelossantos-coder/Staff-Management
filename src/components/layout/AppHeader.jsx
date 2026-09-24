import React from 'react';
import { LogOut, Sparkles, Menu, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AppHeader({ sidebarOpen, setSidebarOpen }) {
  const { currentUser, logout, switchDemoRole, isSuperAdmin, openDigitalId } = useApp();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ceo':
        return { label: `CEO · ${currentUser?.name || 'Katherine A. BELLA'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      case 'it_admin':
        return { label: `IT Admin · ${currentUser?.name || 'Carl Laurence B. PATAGNAN'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      case 'admin':
        return { label: `COO · ${currentUser?.name || 'Norvin L. BELLA'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      case 'hr':
        return { label: `HR Admin · ${currentUser?.name || 'Genevieve Anne A. JURADO'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      case 'finance':
      case 'accounting':
        return { label: `Accounting · ${currentUser?.name || 'Dorina NABONG'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      case 'canteen':
        return { label: `Canteen Admin · ${currentUser?.name || 'Nannette MANUEL'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      case 'security':
        return { label: `Security · ${currentUser?.name || 'Marvin G. ATAYDE'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
      default:
        return { label: `Staff · ${currentUser?.name || 'Employee ESS'}`, color: 'bg-slate-900 text-slate-200 border-slate-700' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);
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

        {/* User Profile & Super Admin Role Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* Universal Role Switcher - EXCLUSIVELY AVAILABLE TO SUPER ADMINS (CEO and IT Admin) */}
          {isSuperAdmin && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs shadow-md">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-slate-400" />
                Super Admin:
              </span>
              <button
                type="button"
                onClick={() => switchDemoRole('ceo')}
                title="Assume CEO Account (Katherine A. BELLA)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'ceo'
                    ? 'bg-white text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                CEO
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('it_admin')}
                title="Assume IT Admin Account (Carl Laurence B. PATAGNAN)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'it_admin'
                    ? 'bg-white text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                IT Admin
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('admin')}
                title="Assume COO Account (Norvin L. BELLA)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'admin'
                    ? 'bg-white text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                COO
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('hr')}
                title="Assume HR Manager Account (Genevieve Anne A. JURADO)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'hr'
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                HR
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('accounting')}
                title="Assume Accounting Officer Account (Dorina NABONG)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'accounting' || currentUser?.role === 'finance'
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Accounting
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('canteen')}
                title="Assume Canteen Admin Account (Nannette MANUEL)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'canteen'
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Canteen
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('employee')}
                title="Assume Employee ESS Account (Merry Jean I. ALONZO)"
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  currentUser?.role === 'employee'
                    ? 'bg-white text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Employee
              </button>
            </div>
          )}

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
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover border border-slate-700 shadow-sm bg-slate-900"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {currentUser?.name || 'Staff User'}
              </div>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge.color} mt-0.5`}>
                {badge.label}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="h-8 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 text-slate-400 flex items-center gap-1.5 transition cursor-pointer text-xs font-bold"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
