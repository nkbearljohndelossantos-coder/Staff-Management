import React from 'react';
import {
  FileText,
  ScanLine,
  QrCode,
  Utensils,
  Menu,
  Users,
  Calculator,
  Database,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MobileBottomNav({ onOpenMenu, onOpenDigitalId }) {
  const { activeTab, setActiveTab, currentUser } = useApp();

  const role = currentUser?.role;

  const handleTab = (id) => {
    setActiveTab(id);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Tab 1: Primary Home / Core module */}
        {role === 'employee' ? (
          <button
            type="button"
            onClick={() => handleTab('employeePortal')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'employeePortal' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className={`h-5 w-5 ${activeTab === 'employeePortal' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Payslips</span>
          </button>
        ) : role === 'canteen' ? (
          <button
            type="button"
            onClick={() => handleTab('canteenHub')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'canteenHub' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className={`h-5 w-5 ${activeTab === 'canteenHub' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Register</span>
          </button>
        ) : role === 'it_admin' ? (
          <button
            type="button"
            onClick={() => handleTab('itAdminHub')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'itAdminHub' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className={`h-5 w-5 ${activeTab === 'itAdminHub' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Master</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleTab('staff')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'staff' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className={`h-5 w-5 ${activeTab === 'staff' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Staff</span>
          </button>
        )}

        {/* Tab 2: Clock-in Attendance */}
        <button
          type="button"
          onClick={() => handleTab('attendance')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
            activeTab === 'attendance' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ScanLine className={`h-5 w-5 ${activeTab === 'attendance' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Clock-In</span>
        </button>

        {/* CENTER SPECIAL ACTION: DIGITAL ID (Barcode & QR) PASS */}
        <button
          type="button"
          onClick={onOpenDigitalId}
          className="flex flex-col items-center justify-center -mt-4 py-1.5 px-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/30 active:scale-95 transition cursor-pointer min-w-[64px]"
          title="Open My Digital ID (Barcode & QR)"
        >
          <QrCode className="h-6 w-6 text-slate-950" />
          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">My ID</span>
        </button>

        {/* Tab 4: Canteen or Secondary Module */}
        {role === 'employee' ? (
          <button
            type="button"
            onClick={() => handleTab('canteenHub')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'canteenHub' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className={`h-5 w-5 ${activeTab === 'canteenHub' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Canteen</span>
          </button>
        ) : role === 'accounting' || role === 'finance' ? (
          <button
            type="button"
            onClick={() => handleTab('payroll')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'payroll' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className={`h-5 w-5 ${activeTab === 'payroll' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Payroll</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleTab('coopLoans')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer min-w-[56px] ${
              activeTab === 'coopLoans' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className={`h-5 w-5 ${activeTab === 'coopLoans' ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Coop</span>
          </button>
        )}

        {/* Tab 5: Menu / All Tabs Drawer */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer min-w-[56px]"
          title="Open Menu Navigation"
        >
          <Menu className="h-5 w-5 text-slate-400" />
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>

      </div>
    </nav>
  );
}
