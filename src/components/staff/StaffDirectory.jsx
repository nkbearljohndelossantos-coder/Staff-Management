import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  UserMinus,
  FolderArchive,
  RotateCcw,
  Filter,
  Edit3,
  Trash2,
  DollarSign,
  Users,
  Building,
  ScanLine,
  QrCode,
  Eye,
  Calendar,
  Shield,
  Paperclip,
  Crown,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import { formatStaffName, getStaffUsername, scanStaffMilestones } from '../../utils/staffUtils';
import { getStaffEmploymentLabel, isProjectBasedStaff, getStaffCoopLoanMultiplier } from '../../utils/coopBusinessRules';
import { canCreateMisconductReport } from '../../utils/rolePermissions';
import StaffBadgeModal from './StaffBadgeModal';
import StaffFormModal from './StaffFormModal';
import StaffDetailModal from './StaffDetailModal';
import MisconductReportModal from './MisconductReportModal';
import MisconductReportsManagerModal from './MisconductReportsManagerModal';
import {
  ResignationFilingModal,
  ResignedDossierModal,
  SEPARATION_TYPES,
  CLEARANCE_STATUSES,
  FINAL_PAY_STATUSES
} from './ResignationModal';
import BarcodeView from '../common/BarcodeView';
import TableActionDropdown from '../common/TableActionDropdown';

export default function StaffDirectory() {
  const { 
    staffList, 
    departments, 
    positions, 
    deleteStaff, 
    isHR, 
    openDigitalId, 
    toggleTeamLeader,
    currentUser,
    misconductReports = [],
    coopBalances = {},
    cashLoans = [],
    canteenLedgerBalances = {},
    updateResignationRecord,
    reinstateResignedStaff
  } = useApp();

  const canReportMisconduct = canCreateMisconductReport(currentUser);

  // HR Directory Sub-Tabs: 'active' (Active Workforce) | 'resigned' (Resigned Workers Archive)
  const [directoryTab, setDirectoryTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [resignedFilterType, setResignedFilterType] = useState('ALL');
  const [resignedFilterClearance, setResignedFilterClearance] = useState('ALL');

  const [badgeModalStaff, setBadgeModalStaff] = useState(null);
  const [formModalStaff, setFormModalStaff] = useState(null);
  const [detailModalStaff, setDetailModalStaff] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isMisconductModalOpen, setIsMisconductModalOpen] = useState(false);
  const [misconductTargetStaff, setMisconductTargetStaff] = useState(null);
  const [isMisconductManagerOpen, setIsMisconductManagerOpen] = useState(false);

  // Resignation Filing & Dossier Modals
  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);
  const [resignationTargetStaff, setResignationTargetStaff] = useState(null);
  const [dossierStaff, setDossierStaff] = useState(null);

  const activeWorkforce = staffList.filter(s => s.status !== 'resigned' && !s.isResigned);
  const resignedWorkforce = staffList.filter(s => s.status === 'resigned' || Boolean(s.isResigned));

  const milestones = scanStaffMilestones ? scanStaffMilestones(activeWorkforce, 14) : { birthdays: [], anniversaries: [] };

  // Filter active staff
  const filteredStaff = activeWorkforce.filter(s => {
    const q = searchQuery.toLowerCase();
    const uname = getStaffUsername(s);
    const matchesSearch =
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      uname.includes(q) ||
      s.employeeId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.sssNo?.toLowerCase().includes(q) ||
      s.philHealthNo?.toLowerCase().includes(q) ||
      s.hdmfNo?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || s.departmentId === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Filter resigned workers
  const filteredResignedStaff = resignedWorkforce.filter(s => {
    const q = searchQuery.toLowerCase();
    const uname = getStaffUsername(s);
    const rec = s.resignationRecord || {};
    const matchesSearch =
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      uname.includes(q) ||
      s.employeeId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      (rec.id || '').toLowerCase().includes(q) ||
      (rec.reason || '').toLowerCase().includes(q) ||
      (rec.separationType || '').toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || s.departmentId === selectedDept;
    const matchesType = resignedFilterType === 'ALL' || (rec.separationType || 'Voluntary Resignation') === resignedFilterType;
    const matchesClearance = resignedFilterClearance === 'ALL' || (rec.clearanceStatus || 'Pending Clearance') === resignedFilterClearance;

    return matchesSearch && matchesDept && matchesType && matchesClearance;
  });

  const totalPayrollBudget = activeWorkforce.reduce((acc, s) => {
    const rate = Number(s.salaryRate) || Number(s.baseSalary) || 0;
    const monthly = s.salaryRateType === 'daily' ? rate * 22 : rate;
    return acc + monthly;
  }, 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">

      {/* HR Section Sub-Tabs: Active Workforce vs Resigned Workers Archive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/90 p-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setDirectoryTab('active')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              directoryTab === 'active'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <Users className={`h-4 w-4 ${directoryTab === 'active' ? 'text-white' : 'text-slate-500'}`} />
            <span>Active Workforce</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              directoryTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {activeWorkforce.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDirectoryTab('resigned')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              directoryTab === 'resigned'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <FolderArchive className={`h-4 w-4 ${directoryTab === 'resigned' ? 'text-white' : 'text-slate-500'}`} />
            <span>Resigned Workers</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
              directoryTab === 'resigned' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {resignedWorkforce.length}
            </span>
          </button>
        </div>

        {isHR && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setResignationTargetStaff(null);
                setIsResignationModalOpen(true);
              }}
              className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0"
              title="File a worker's resignation and move their record to the Resigned Workers tab"
            >
              <UserMinus className="h-3.5 w-3.5 text-slate-700" />
              <span>File Resignation</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Stats Overview */}
      {directoryTab === 'active' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Workforce</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <Users className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{activeWorkforce.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active automated employee IDs</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Departments</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <Building className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{departments.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Corporate cost centers</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Monthly Base Payroll</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(totalPayrollBudget)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Standard monthly commitment</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Filed Resigned Records</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <FolderArchive className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{resignedWorkforce.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Archived in Resigned Workers tab</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Resigned Filed</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <FolderArchive className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{resignedWorkforce.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Permanent 201 &amp; exit records on file</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Clearance</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {resignedWorkforce.filter(s => (s.resignationRecord?.clearanceStatus || 'Pending Clearance') !== 'Fully Cleared').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting department / accounting sign-off</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Final Pay</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {resignedWorkforce.filter(s => (s.resignationRecord?.finalPayStatus || 'Pending Computation') !== 'Released / Settled').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Backpay &amp; final settlement processing</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Fully Cleared &amp; Settled</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {resignedWorkforce.filter(s => s.resignationRecord?.clearanceStatus === 'Fully Cleared' && s.resignationRecord?.finalPayStatus === 'Released / Settled').length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Completed exit &amp; settlement archive</p>
          </div>
        </div>
      )}

      {/* Early Milestone Alerts Banner for HR: Birthdays & Work Anniversaries */}
      {milestones && (milestones.birthdays.length > 0 || milestones.anniversaries.length > 0) && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 border border-amber-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                🎉
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  Upcoming Staff Milestones &amp; Celebrations (Early HR Notice)
                </h4>
                <p className="text-[11px] text-slate-600">
                  Birthdays and work anniversaries within the next 14 days. Notify teams and prepare recognitions early.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Birthdays */}
            {milestones.birthdays.length > 0 && (
              <div className="p-3 rounded-xl bg-white/90 border border-rose-200/80 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
                  <span className="text-sm">🎂</span>
                  <span>Upcoming Birthday Celebrants ({milestones.birthdays.length})</span>
                </div>
                <div className="space-y-1.5">
                  {milestones.birthdays.map(({ staff, daysUntil, isToday, isTomorrow, formattedDate }) => (
                    <div key={staff.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-rose-50/50 hover:bg-rose-50 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                          alt=""
                          className="w-6 h-6 rounded-full border border-rose-200 shrink-0 object-cover"
                        />
                        <span className="font-bold text-slate-900 truncate">{formatStaffName(staff)}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({staff.employeeId})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isToday ? 'bg-rose-600 text-white animate-pulse' : isTomorrow ? 'bg-amber-500 text-white' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isToday ? 'TODAY!' : isTomorrow ? 'TOMORROW!' : `${formattedDate} (${daysUntil}d)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Anniversaries */}
            {milestones.anniversaries.length > 0 && (
              <div className="p-3 rounded-xl bg-white/90 border border-indigo-200/80 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  <span className="text-sm">🎖️</span>
                  <span>Work Anniversaries ({milestones.anniversaries.length})</span>
                </div>
                <div className="space-y-1.5">
                  {milestones.anniversaries.map(({ staff, daysUntil, isToday, isTomorrow, formattedDate, yearsCompleted }) => (
                    <div key={staff.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 transition">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                          alt=""
                          className="w-6 h-6 rounded-full border border-indigo-200 shrink-0 object-cover"
                        />
                        <span className="font-bold text-slate-900 truncate">{formatStaffName(staff)}</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {yearsCompleted} {yearsCompleted === 1 ? 'Year' : 'Years'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isToday ? 'bg-indigo-600 text-white animate-pulse' : isTomorrow ? 'bg-amber-500 text-white' : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}>
                        {isToday ? 'TODAY!' : isTomorrow ? 'TOMORROW!' : `${formattedDate} (${daysUntil}d)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={directoryTab === 'resigned' ? 'Search resigned worker, ID, or reason...' : 'Search by name, username, ID, or barcode...'}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Resigned Filters */}
          {directoryTab === 'resigned' && (
            <>
              <select
                value={resignedFilterType}
                onChange={(e) => setResignedFilterType(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="ALL">All Separation Types</option>
                {SEPARATION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={resignedFilterClearance}
                onChange={(e) => setResignedFilterClearance(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="ALL">All Clearance Statuses</option>
                {CLEARANCE_STATUSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Misconduct & CCTV Reporting (HR & CCTV Admin) */}
          {canReportMisconduct && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMisconductTargetStaff(null);
                  setIsMisconductModalOpen(true);
                }}
                className="w-full sm:w-auto h-10 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition shrink-0"
                title="File Employee Misconduct Report with CCTV Footage"
              >
                <AlertTriangle className="h-4 w-4 text-white" />
                <span>Report Misconduct (CCTV)</span>
              </button>

              {misconductReports.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsMisconductManagerOpen(true)}
                  className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0"
                  title="Browse all misconduct reports & CCTV evidence"
                >
                  <Shield className="h-4 w-4 text-slate-600" />
                  <span>Cases</span>
                  <span className="min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {misconductReports.filter(r => r.status === 'PENDING_EXPLANATION' || r.status === 'ACKNOWLEDGED').length || misconductReports.length}
                  </span>
                </button>
              )}
            </>
          )}

          {/* Onboard Staff or File Resignation Button (HR Only) */}
          {isHR && (
            directoryTab === 'resigned' ? (
              <button
                type="button"
                onClick={() => {
                  setResignationTargetStaff(null);
                  setIsResignationModalOpen(true);
                }}
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition shrink-0"
              >
                <FolderArchive className="h-4 w-4 text-white" />
                File Worker Resignation
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition shrink-0"
              >
                <UserPlus className="h-4 w-4 text-white" />
                Onboard Staff (Auto-Generate ID)
              </button>
            )
          )}
        </div>
      </div>

      {/* Directory Content: Active Workforce Table vs Resigned Workers Archive Table */}
      {directoryTab === 'active' ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Generated ID &amp; Barcode</th>
                  <th className="py-3 px-4">Position &amp; Department</th>
                  <th className="py-3 px-4">Date Hired</th>
                  <th className="py-3 px-4">Salary Rate &amp; Filed Basis</th>
                  <th className="py-3 px-4 text-center">201 Files &amp; Pass</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No active staff records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const pos = positions.find(p => p.id === staff.positionId);
                    const dept = departments.find(d => d.id === staff.departmentId);
                    const salaryRate = Number(staff.salaryRate) || Number(staff.baseSalary) || 0;
                    const rateType = staff.salaryRateType || 'monthly';
                    const filedSalary = Number(staff.filedSalary) || 0;

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Name & Photo */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => setDetailModalStaff(staff)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <img
                              src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                              alt={staff.firstName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-sm"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">
                                {formatStaffName(staff)}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  @{getStaffUsername(staff)}
                                </span>
                                <span>{staff.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* ID & Barcode */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-slate-900 text-[11px]">
                                {staff.employeeId}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                                isProjectBasedStaff(staff)
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {getStaffEmploymentLabel(staff, true)}
                              </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 w-fit">
                              <BarcodeView value={staff.barcodeValue} width={1.0} height={18} displayValue={false} />
                            </div>
                          </div>
                        </td>

                        {/* Position & Department */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">{pos?.title || 'Staff Specialist'}</span>
                            {staff.isTeamLeader && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-0.5" title="Designated Team Leader (Authorized to file OT)">
                                <Crown className="h-2.5 w-2.5 text-amber-600" />
                                TL
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium inline-block mt-0.5">
                            {dept?.name || 'General'}
                          </span>
                        </td>

                        {/* Date Hired */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {formatDate(staff.dateHired || staff.hireDate)}
                        </td>

                        {/* Salary Rate & Filed Salary Basis */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{formatCurrency(salaryRate)}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              / {rateType === 'daily' ? 'day' : 'mo'}
                            </span>
                            {rateType === 'daily' ? (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-sans font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200"
                                title="Daily Rate: Strictly 6 Days / Week (13 days/cut-off · 26 days/mo)"
                              >
                                6D · 26d/mo
                              </span>
                            ) : (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded font-sans font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200"
                                title={staff.workScheduleType === '5_days' ? '5 Days Work: 261 days/year factor without weekend' : '6 Days Work: 313 days/year factor without Sunday'}
                              >
                                {staff.workScheduleType === '5_days' ? '5D · 261' : '6D · 313'}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5">
                            {filedSalary > 0 ? (
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold" title="Basis for SSS, PhilHealth, HDMF & Tax">
                                Filed: {formatCurrency(filedSalary)}/mo
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                No filed salary
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 201 Files & Digital ID Pass Button */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailModalStaff(staff)}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-xs ${
                                (staff.documents && staff.documents.length > 0)
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                              title="Upload or view 201 Requirements & Attachments"
                            >
                              <Paperclip className="h-3 w-3 text-emerald-600" />
                              <span>{staff.documents?.length ? `${staff.documents.length} Files` : 'Attach'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDigitalId(staff)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-xs"
                              title="View Digital ID with Barcode & QR"
                            >
                              <QrCode className="h-3 w-3 text-cyan-600" />
                              <span>Pass</span>
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailModalStaff(staff)}
                              title="View Full Staff Profile"
                              className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer border border-slate-200"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                            </button>

                            {isHR && (
                              <button
                                type="button"
                                onClick={() => setFormModalStaff(staff)}
                                title="Quick Edit Profile"
                                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer border border-slate-200"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                              </button>
                            )}

                            <TableActionDropdown
                              id={`staff-${staff.id}`}
                              actions={[
                                {
                                  label: `201 Attachments (${staff.documents?.length || 0})`,
                                  icon: Paperclip,
                                  onClick: () => setDetailModalStaff(staff)
                                },
                                {
                                  label: 'View Profile & Deductions',
                                  icon: Eye,
                                  onClick: () => setDetailModalStaff(staff)
                                },
                                {
                                  label: 'Digital ID (Barcode & QR)',
                                  icon: QrCode,
                                  onClick: () => openDigitalId(staff)
                                },
                                {
                                  label: 'Print Badge Card',
                                  icon: ScanLine,
                                  onClick: () => setBadgeModalStaff(staff)
                                },
                                ...(canReportMisconduct
                                  ? [
                                      {
                                        label: 'Report Misconduct (CCTV)',
                                        icon: AlertTriangle,
                                        onClick: () => {
                                          setMisconductTargetStaff(staff);
                                          setIsMisconductModalOpen(true);
                                        }
                                      }
                                    ]
                                  : []),
                                ...(isHR
                                  ? [
                                      {
                                        label: staff.isTeamLeader ? 'Relieve Team Leader Role' : 'Designate as Team Leader',
                                        icon: Crown,
                                        onClick: () => toggleTeamLeader(staff.id)
                                      },
                                      {
                                        label: 'Edit Profile & Salary',
                                        icon: Edit3,
                                        onClick: () => setFormModalStaff(staff)
                                      },
                                      {
                                        label: 'File Resignation (Move to Archive)',
                                        icon: UserMinus,
                                        onClick: () => {
                                          setResignationTargetStaff(staff);
                                          setIsResignationModalOpen(true);
                                        }
                                      },
                                      {
                                        label: 'Delete Staff Member',
                                        icon: Trash2,
                                        danger: true,
                                        onClick: () => deleteStaff(staff.id)
                                      }
                                    ]
                                  : [])
                              ]}
                            />
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Resigned Workers Archive Table */
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FolderArchive className="h-4 w-4 text-slate-700" />
                Resigned Workers Master Archive &amp; Exit Dossiers
              </h3>
              <p className="text-[11px] text-slate-500">
                Permanent repository of separated employees, clearance statuses, final pay settlements, and 201 files
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              Showing {filteredResignedStaff.length} of {resignedWorkforce.length} filed record(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Resigned Worker</th>
                  <th className="py-3 px-4">Separation &amp; Dates</th>
                  <th className="py-3 px-4">Reason &amp; Rehire Status</th>
                  <th className="py-3 px-4">Clearance &amp; Final Pay</th>
                  <th className="py-3 px-4">Account &amp; 201 Snapshot</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredResignedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-2">
                        <FolderArchive className="h-8 w-8 text-slate-400 mx-auto" />
                        <div className="font-bold text-slate-800 text-xs">No Resigned Worker Records Filed Yet</div>
                        <p className="text-[11px] text-slate-500">
                          When an employee resigns or separates from the company, click <strong>File Resignation</strong> to archive their complete employment, financial, and 201 records here.
                        </p>
                        {isHR && (
                          <button
                            type="button"
                            onClick={() => {
                              setResignationTargetStaff(null);
                              setIsResignationModalOpen(true);
                            }}
                            className="mt-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                          >
                            <UserMinus className="h-3.5 w-3.5 text-white" />
                            File Worker Resignation Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredResignedStaff.map((staff) => {
                    const pos = positions.find(p => p.id === staff.positionId);
                    const dept = departments.find(d => d.id === staff.departmentId);
                    const rec = staff.resignationRecord || {};
                    const snap = rec.financialSnapshot || {};
                    const coopBal = snap.coopSavingsBalance !== undefined ? snap.coopSavingsBalance : (Number(coopBalances[staff.id]) || 0);
                    const loanBal = snap.outstandingLoanBalance !== undefined
                      ? snap.outstandingLoanBalance
                      : cashLoans.filter(l => l.staffId === staff.id && l.status === 'Approved').reduce((s, l) => s + (Number(l.balanceRemaining) || 0), 0);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                        {/* Resigned Worker Info */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => setDossierStaff(staff)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <img
                              src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                              alt={staff.firstName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-300 bg-slate-100 grayscale"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:underline">
                                {formatStaffName(staff)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                @{getStaffUsername(staff)} &bull; {staff.employeeId}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {pos?.title || rec.positionTitle || 'Staff'} &bull; {dept?.name || rec.departmentName || 'General'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Separation Type & Dates */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold inline-block">
                            {rec.separationType || 'Voluntary Resignation'}
                          </span>
                          <div className="text-[11px] font-mono text-slate-700 mt-1">
                            Last Day: <strong>{formatDate(rec.effectiveLastDay || staff.resignedAt)}</strong>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            Hired: {formatDate(staff.dateHired || staff.hireDate)} &bull; #{rec.id || 'FILED'}
                          </div>
                        </td>

                        {/* Reason & Rehire Eligibility */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-xs text-slate-800 font-semibold line-clamp-2">
                            {rec.reason || 'Voluntary resignation filed with HR'}
                          </div>
                          <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {rec.rehireEligibility || 'Eligible for Rehire'}
                          </span>
                        </td>

                        {/* Clearance & Final Pay Status */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 w-16 shrink-0">Clearance:</span>
                              <select
                                value={rec.clearanceStatus || 'Pending Clearance'}
                                disabled={!isHR}
                                onChange={(e) => updateResignationRecord(staff.id, { clearanceStatus: e.target.value })}
                                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                              >
                                {CLEARANCE_STATUSES.map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 w-16 shrink-0">Final Pay:</span>
                              <select
                                value={rec.finalPayStatus || 'Pending Computation'}
                                disabled={!isHR}
                                onChange={(e) => updateResignationRecord(staff.id, { finalPayStatus: e.target.value })}
                                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-800 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                              >
                                {FINAL_PAY_STATUSES.map(fp => (
                                  <option key={fp} value={fp}>{fp}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* Financial & 201 Snapshot */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-slate-700 space-y-0.5">
                            <div>COOP: <strong className="text-slate-900">{formatCurrency(coopBal)}</strong></div>
                            <div>Loans: <strong className="text-slate-900">{formatCurrency(loanBal)}</strong></div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailModalStaff(staff)}
                            className="mt-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                          >
                            <Paperclip className="h-2.5 w-2.5 text-slate-600" />
                            <span>{staff.documents?.length || 0} Filed 201 Docs</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDossierStaff(staff)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-xs"
                              title="Open Filed Exit Dossier"
                            >
                              <FileText className="h-3 w-3 text-white" />
                              <span>Filed Record</span>
                            </button>

                            {isHR && (
                              <button
                                type="button"
                                onClick={() => reinstateResignedStaff(staff.id, 'Reinstated by HR from Resigned Workers tab')}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                title="Reinstate / Rehire Worker to Active Workforce"
                              >
                                <RotateCcw className="h-3 w-3 text-slate-600" />
                                <span>Reinstate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {detailModalStaff && (
        <StaffDetailModal
          staff={detailModalStaff}
          department={departments.find(d => d.id === detailModalStaff.departmentId)}
          position={positions.find(p => p.id === detailModalStaff.positionId)}
          onClose={() => setDetailModalStaff(null)}
          onEdit={(s) => setFormModalStaff(s)}
          onOpenDigitalId={(s) => openDigitalId(s)}
        />
      )}

      {badgeModalStaff && (
        <StaffBadgeModal
          staff={badgeModalStaff}
          department={departments.find(d => d.id === badgeModalStaff.departmentId)}
          position={positions.find(p => p.id === badgeModalStaff.positionId)}
          onClose={() => setBadgeModalStaff(null)}
        />
      )}

      {(isAddingNew || formModalStaff) && (
        <StaffFormModal
          staff={formModalStaff}
          onClose={() => {
            setIsAddingNew(false);
            setFormModalStaff(null);
          }}
        />
      )}

      {/* Resignation Filing Modal */}
      <ResignationFilingModal
        isOpen={isResignationModalOpen}
        preselectedStaff={resignationTargetStaff}
        onClose={() => {
          setIsResignationModalOpen(false);
          setResignationTargetStaff(null);
        }}
        onSuccess={() => {
          setDirectoryTab('resigned');
        }}
      />

      {/* Resigned Worker Filed Dossier Modal */}
      {dossierStaff && (
        <ResignedDossierModal
          staff={staffList.find(s => s.id === dossierStaff.id) || dossierStaff}
          onClose={() => setDossierStaff(null)}
          onOpen201Files={(s) => {
            setDossierStaff(null);
            setDetailModalStaff(s);
          }}
          onReinstate={(s) => {
            reinstateResignedStaff(s.id, 'Reinstated via Exit Dossier Modal');
            setDossierStaff(null);
            setDirectoryTab('active');
          }}
        />
      )}

      {/* Misconduct Report Filing Modal */}
      <MisconductReportModal
        isOpen={isMisconductModalOpen}
        preselectedStaff={misconductTargetStaff}
        onClose={() => {
          setIsMisconductModalOpen(false);
          setMisconductTargetStaff(null);
        }}
      />

      {/* Misconduct Reports Manager Modal */}
      <MisconductReportsManagerModal
        isOpen={isMisconductManagerOpen}
        onClose={() => setIsMisconductManagerOpen(false)}
        onOpenNewReport={() => {
          setMisconductTargetStaff(null);
          setIsMisconductModalOpen(true);
        }}
      />

    </div>
  );
}
