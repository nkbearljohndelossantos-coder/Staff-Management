import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useApp } from './context/AppContext';
import LoginShell from './components/auth/LoginShell';
import StaffLoginForm from './components/auth/StaffLoginForm';
import EmployeeBarcodeLogin from './components/auth/EmployeeBarcodeLogin';
import AppHeader from './components/layout/AppHeader';
import SideNavigation from './components/layout/SideNavigation';
const StaffDirectory = React.lazy(() => import('./components/staff/StaffDirectory'));
const PositionDeptManager = React.lazy(() => import('./components/staff/PositionDeptManager'));
const BarcodeClockInKiosk = React.lazy(() => import('./components/attendance/BarcodeClockInKiosk'));
const PayRunList = React.lazy(() => import('./components/payroll/PayRunList'));
const EmployeePortalView = React.lazy(() => import('./components/payslip/EmployeePortalView'));
const CoopLoansManager = React.lazy(() => import('./components/coop/CoopLoansManager'));
const CanteenHub = React.lazy(() => import('./components/canteen/CanteenHub'));
const ITAdminHub = React.lazy(() => import('./components/it/ITAdminHub'));
const ExecutiveDashboardView = React.lazy(() => import('./components/dashboard/ExecutiveDashboardView'));
const CanteenCustomerDisplay = React.lazy(() => import('./components/canteen/CanteenCustomerDisplay'));

function TabLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 py-16">
      <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
      <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading Workspace Module...</span>
    </div>
  );
}
import MobileBottomNav from './components/layout/MobileBottomNav';
import DigitalIdModal from './components/id/DigitalIdModal';
import CommandPalette from './components/common/CommandPalette';
import { isTabAuthorized, getDefaultTabForRole, TAB_PERMISSIONS } from './utils/rolePermissions';

export default function App() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    notification,
    departments,
    positions,
    digitalIdStaff,
    isDigitalIdOpen,
    openDigitalId,
    closeDigitalId
  } = useApp();
  const [loginMode, setLoginMode] = useState('staff'); // 'staff' or 'barcode'
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global keyboard listener for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if opened as 2nd Monitor Customer Display
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  if (urlParams?.get('view') === 'customer-display') {
    return (
      <React.Suspense fallback={<TabLoadingFallback />}>
        <CanteenCustomerDisplay />
      </React.Suspense>
    );
  }

  // Automatically ensure the active tab is authorized for the current user
  useEffect(() => {
    if (currentUser && !isTabAuthorized(activeTab, currentUser.role)) {
      setActiveTab(getDefaultTabForRole(currentUser.role));
    }
  }, [currentUser, activeTab, setActiveTab]);

  // If unauthenticated, show the Canteen-styled Login Shell
  if (!currentUser) {
    return (
      <LoginShell>
        {loginMode === 'staff' ? (
          <StaffLoginForm onSwitchToBarcode={() => setLoginMode('barcode')} />
        ) : (
          <EmployeeBarcodeLogin onBackToStaffLogin={() => setLoginMode('staff')} />
        )}
      </LoginShell>
    );
  }

  const isEmployee = currentUser?.role === 'employee';
  const authorized = isTabAuthorized(activeTab, currentUser?.role);

  // Authenticated Portal: Dark Header + Dark Side Tabs + Crisp Light Body
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-slate-300 selection:text-slate-900">
      <AppHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <div className="flex-1 flex min-h-[calc(100vh-57px)]">
        {/* Left Side Navigation Tabs (Dark) */}
        <SideNavigation
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Right Main Content Area (High-Contrast Light Body, Mobile-optimized with bottom padding) */}
        <main className="flex-1 bg-slate-100 text-slate-800 min-w-0 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {!authorized ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-8 w-8 text-slate-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900">Access Restricted</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You do not have administrative authorization to manage the <strong>{TAB_PERMISSIONS[activeTab]?.title || activeTab}</strong> module.
                  This section is strictly restricted to <strong>{TAB_PERMISSIONS[activeTab]?.requiredRoleLabel}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab(getDefaultTabForRole(currentUser?.role))}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Return to Authorized Workspace
                </button>
              </div>
            ) : (
              <React.Suspense fallback={<TabLoadingFallback />}>
                {activeTab === 'executiveDashboard' && <ExecutiveDashboardView />}
                {activeTab === 'staff' && <StaffDirectory />}
                {activeTab === 'positions' && <PositionDeptManager />}
                {activeTab === 'attendance' && <BarcodeClockInKiosk />}
                {activeTab === 'payroll' && <PayRunList />}
                {activeTab === 'coopLoans' && <CoopLoansManager />}
                {activeTab === 'canteenHub' && <CanteenHub />}
                {activeTab === 'itAdminHub' && <ITAdminHub />}
                {activeTab === 'employeePortal' && <EmployeePortalView />}
              </React.Suspense>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Thumb Navigation Bar (Hidden on desktop) */}
      <MobileBottomNav
        onOpenMenu={() => setSidebarOpen(true)}
        onOpenDigitalId={() => openDigitalId()}
      />

      {/* Global Digital Employee ID (Barcode & QR) Modal */}
      {isDigitalIdOpen && digitalIdStaff && (
        <DigitalIdModal
          staff={digitalIdStaff}
          department={departments.find(d => d.id === digitalIdStaff.departmentId)}
          position={positions.find(p => p.id === digitalIdStaff.positionId)}
          onClose={closeDigitalId}
        />
      )}

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Toast Notification (Monochrome/Neutral high-contrast) */}
      {notification && (
        <div className="fixed bottom-20 lg:bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}
