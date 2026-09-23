import React from 'react';
import { Users, Briefcase, ScanLine, Calculator, FileText, UserCircle, Landmark } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function NavigationTabs() {
  const { activeTab, setActiveTab, currentUser } = useApp();

  // Employees have no navigation tabs (strictly locked to Employee Portal)
  if (currentUser?.role === 'employee') {
    return null;
  }

  const tabs = [
    { id: 'staff', label: 'Staff & IDs', icon: Users, roleBadge: 'HR', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'positions', label: 'Positions & Depts', icon: Briefcase, roleBadge: 'HR', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'attendance', label: 'Barcode Clock-In', icon: ScanLine, roleBadge: null },
    { id: 'payroll', label: 'Payroll Engine', icon: Calculator, roleBadge: 'Accounting', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'coopLoans', label: 'Coop, Loans & Canteen', icon: Landmark, roleBadge: 'HR & Acct', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { id: 'employeePortal', label: 'My Payslips (ESS)', icon: FileText, roleBadge: null },
  ];

  const visibleTabs = tabs;

  return (
    <nav className="bg-slate-950/40 border-b border-white/10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-brand-500 text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.roleBadge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor
                }`}>
                  {tab.roleBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
