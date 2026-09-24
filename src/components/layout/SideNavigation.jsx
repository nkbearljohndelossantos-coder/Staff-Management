import React from 'react';
import { Users, Briefcase, ScanLine, Calculator, Landmark, Utensils, FileText, X, Shield, Network, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isTabAuthorized } from '../../utils/rolePermissions';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function SideNavigation({ isOpen, onClose }) {
  const { activeTab, setActiveTab, currentUser } = useApp();

  // Progressive Escape dismissal: Closes mobile flyout drawer at Priority 20 (FLYOUT)
  useEscapeKey('sidebar-drawer', ESCAPE_PRIORITY.FLYOUT, isOpen, onClose);

  const allTabs = [
    { id: 'staff', label: 'Staff & IDs', icon: Users, roleBadge: 'HR' },
    { id: 'positions', label: 'Positions & Depts', icon: Briefcase, roleBadge: 'HR' },
    { id: 'attendance', label: 'Barcode Clock-In', icon: ScanLine, roleBadge: 'HR' },
    { id: 'payroll', label: 'Payroll Engine', icon: Calculator, roleBadge: 'Accounting' },
    { id: 'coopLoans', label: 'Coop, Loans & Canteen', icon: Landmark, roleBadge: currentUser?.role === 'accounting' || currentUser?.role === 'finance' ? 'Accounting' : 'HR & Acct' },
    { id: 'canteenHub', label: 'Canteen & Inventory', icon: Utensils, roleBadge: 'Canteen' },
    { 
      id: 'itAdminHub', 
      label: 'IT Master Records', 
      icon: Database, 
      roleBadge: 'IT Admin' 
    },
    { id: 'employeePortal', label: 'My Payslips (ESS)', icon: FileText, roleBadge: null },
    { 
      id: 'conceptMap', 
      label: 'Concept Map', 
      icon: Network, 
      roleBadge: currentUser?.role === 'ceo' || currentUser?.role === 'it_admin' ? 'CEO Master' : 'Role Map' 
    },
  ];

  // Strictly remove access to any tabs the user is not authorized to manage
  const tabs = allTabs.filter(tab => isTabAuthorized(tab.id, currentUser?.role));

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (onClose) {
      onClose();
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300 select-none">
      {/* Sidebar Header (Mobile close button) */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
        <span className="text-xs font-black tracking-wider uppercase text-white">Menu Navigation</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Navigation Group Title */}
      <div className="px-5 pt-5 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
        Workspace Navigation
      </div>

      {/* Side Tabs List */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                isActive
                  ? 'bg-white/10 text-white font-bold border-l-2 border-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{tab.label}</span>
              </div>

              {tab.roleBadge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:border-slate-700'
                  }`}
                >
                  {tab.roleBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-slate-800/80 m-3 rounded-2xl bg-slate-900/60 border">
        <div className="flex items-center gap-2 mb-1.5">
          <Shield className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-300">System Security</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Active session protected by multi-role access controls &amp; barcode timekeeping.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800 bg-slate-950 z-20">
        <div className="sticky top-[57px] h-[calc(100vh-57px)]">
          {navContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[80vw] h-full bg-slate-950 shadow-2xl border-r border-slate-800 z-10 flex flex-col">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
