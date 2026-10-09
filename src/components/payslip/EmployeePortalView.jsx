import React, { useState } from 'react';
import {
  ScanLine,
  FileText,
  Clock,
  Eye,
  ShieldCheck,
  Camera,
  Trash2,
  Landmark,
  Coins,
  Utensils,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Package,
  ShoppingBag,
  Check,
  Printer,
  QrCode,
  Copy,
  Maximize2,
  Calendar,
  CalendarCheck,
  Sun,
  Crown,
  PhoneCall,
  Phone,
  Shield,
  AlertTriangle,
  X,
  Send,
  Upload,
  Paperclip,
  Briefcase,
  RefreshCw,
  LogOut,
  Stethoscope,
  TimerOff
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import { LOAN_CATEGORIES } from '../../data/mockData';
import BarcodeView from '../common/BarcodeView';
import QRCodeView from '../common/QRCodeView';
import PayslipDocument from './PayslipDocument';
import GatePassModal from '../canteen/GatePassModal';
import DocumentPreviewModal from '../staff/DocumentPreviewModal';
import { compressDocument } from '../../utils/documentCompressor';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import { formatStaffName } from '../../utils/staffUtils';
import {
  LOAN_TERM_OPTIONS,
  calculateMaxLoanableAmount,
  getStaffCoopLoanMultiplier,
  isProjectBasedStaff,
  getStaffEmploymentLabel
} from '../../utils/coopBusinessRules';

export default function EmployeePortalView() {
  const {
    currentUser,
    staffList,
    departments,
    positions,
    payRuns,
    attendanceLogs,
    updateStaff,
    coopBalances,
    coopLoanMultiplier = 3,
    coopWithdrawals,
    cashLoans,
    cashAdvances,
    requestCashLoan,
    requestCashAdvance,
    requestCoopWithdrawal,
    manufacturingProducts,
    personalPurchaseOrders,
    createPersonalPurchaseOrder,
    canteenGatePasses,
    openDigitalId,
    leaveRequests = [],
    fileLeaveRequest,
    updateLeaveRequest,
    overtimeRequests = [],
    fileOvertimeRequest,
    updateOvertimeRequest,
    offsetRequests = [],
    fileOffsetRequest,
    updateOffsetRequest,
    officialBusinessRequests = [],
    fileOfficialBusinessRequest,
    updateOfficialBusinessRequest,
    undertimeRequests = [],
    fileUndertimeRequest,
    updateUndertimeRequest,
    lastLiveSyncAt,
    misconductReports = [],
    acknowledgeMisconductNotice,
    submitStaffExplanation
  } = useApp();

  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const [selectedPayslipData, setSelectedPayslipData] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadingMedCert, setUploadingMedCert] = useState(false);

  const handleCopySnippet = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippet(type);
      setTimeout(() => setCopiedSnippet(null), 2500);
    }).catch(err => console.warn('Copy error:', err));
  };

  // Financial & ESS Modals State
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedGatePass, setSelectedGatePass] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showOTModal, setShowOTModal] = useState(false);
  const [showOffsetModal, setShowOffsetModal] = useState(false);
  const [showOBModal, setShowOBModal] = useState(false);
  const [showUndertimeModal, setShowUndertimeModal] = useState(false);
  const [editingFormId, setEditingFormId] = useState(null);

  // Progressive Escape dismissal (Priority 40 - MODAL)
  useEscapeKey('ess-loan-modal', ESCAPE_PRIORITY.MODAL, showLoanModal, () => setShowLoanModal(false));
  useEscapeKey('ess-advance-modal', ESCAPE_PRIORITY.MODAL, showAdvanceModal, () => setShowAdvanceModal(false));
  useEscapeKey('ess-withdraw-modal', ESCAPE_PRIORITY.MODAL, showWithdrawModal, () => setShowWithdrawModal(false));
  useEscapeKey('ess-po-modal', ESCAPE_PRIORITY.MODAL, showPOModal, () => setShowPOModal(false));
  useEscapeKey('ess-gate-pass-modal', ESCAPE_PRIORITY.MODAL, Boolean(selectedGatePass), () => setSelectedGatePass(null));
  useEscapeKey('ess-payslip-modal', ESCAPE_PRIORITY.MODAL, Boolean(selectedPayslipData), () => setSelectedPayslipData(null));
  useEscapeKey('ess-leave-modal', ESCAPE_PRIORITY.MODAL, showLeaveModal, () => { setShowLeaveModal(false); setEditingFormId(null); });
  useEscapeKey('ess-ot-modal', ESCAPE_PRIORITY.MODAL, showOTModal, () => { setShowOTModal(false); setEditingFormId(null); });
  useEscapeKey('ess-offset-modal', ESCAPE_PRIORITY.MODAL, showOffsetModal, () => { setShowOffsetModal(false); setEditingFormId(null); });
  useEscapeKey('ess-ob-modal', ESCAPE_PRIORITY.MODAL, showOBModal, () => { setShowOBModal(false); setEditingFormId(null); });
  useEscapeKey('ess-undertime-modal', ESCAPE_PRIORITY.MODAL, showUndertimeModal, () => { setShowUndertimeModal(false); setEditingFormId(null); });

  // Misconduct & HR Call-Out Notice Modal State
  const [activeNoticeReport, setActiveNoticeReport] = useState(null);
  const [staffExplanationText, setStaffExplanationText] = useState('');
  const [acknowledgingNotice, setAcknowledgingNotice] = useState(false);
  const [submittingExplanation, setSubmittingExplanation] = useState(false);

  useEscapeKey('ess-misconduct-notice-modal', ESCAPE_PRIORITY.MODAL, Boolean(activeNoticeReport), () => setActiveNoticeReport(null));

  // Form States
  const [loanForm, setLoanForm] = useState({ category: 'cash', principal: '', termMonths: 3, purpose: '' });
  const [advanceForm, setAdvanceForm] = useState({ principal: '', termMonths: 1, reason: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', reason: '' });
  const [leaveForm, setLeaveForm] = useState({
    type: 'Vacation Leave',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
    medicalCertificate: null
  });
  const [otForm, setOtForm] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 2,
    reasonCategory: 'Urgent Client Delivery / Rush Order',
    reason: ''
  });
  const [offsetForm, setOffsetForm] = useState({
    requestType: 'Schedule Offset (Extra Hours to Offset Late/Undertime)',
    sourceDate: new Date().toISOString().split('T')[0],
    targetOffsetDate: new Date().toISOString().split('T')[0],
    hours: 2,
    timeIn: '08:00 AM',
    lunchOut: '12:00 PM',
    lunchIn: '01:00 PM',
    breakOut: '03:00 PM',
    breakIn: '03:15 PM',
    timeOut: '05:00 PM',
    reason: ''
  });
  const [obForm, setObForm] = useState({
    date: new Date().toISOString().split('T')[0],
    departureTime: '08:00 AM',
    returnTime: '05:00 PM',
    transactionType: 'Client Meeting / Delivery / Field Transaction',
    clientOrDestination: '',
    purpose: '',
    noClockInRequired: true
  });
  const [undertimeForm, setUndertimeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    scheduledTimeOut: '05:00 PM',
    requestedTimeOut: '03:00 PM',
    undertimeHours: 2,
    reasonCategory: 'Medical / Clinic Appointment',
    reason: ''
  });
  const [activeRequestTab, setActiveRequestTab] = useState('all'); // 'all' | 'leaves' | 'offset' | 'ob' | 'undertime' | 'ot'
  const [showIdPassCodes, setShowIdPassCodes] = useState(true);
  
  // Personal PO Form State
  const [poCart, setPoCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [poQuantity, setPoQuantity] = useState(1);
  const [poPaymentMethod, setPoPaymentMethod] = useState('coop'); // 'cash' | 'coop'
  const [poPurpose, setPoPurpose] = useState('');

  // Find the staff record for the current user
  const currentStaff = staffList.find(s => s.id === currentUser?.staffId) || staffList[0] || null;
  const dept = departments.find(d => d.id === currentStaff?.departmentId);
  const pos = positions.find(p => p.id === currentStaff?.positionId);
  const isTeamLeader = Boolean(currentStaff?.isTeamLeader);
  const isTeamLeaderOrAdmin = isTeamLeader || currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'it_admin';

  // Financial & Timekeeping calculations for this employee
  const myCoopBalance = coopBalances[currentStaff?.id] || 0;
  const myCoopMultiplier = getStaffCoopLoanMultiplier(currentStaff, coopLoanMultiplier);
  const myLoans = cashLoans.filter(l => l.staffId === currentStaff?.id);
  const myAdvances = cashAdvances.filter(ca => ca.staffId === currentStaff?.id);
  const myPurchaseOrders = (personalPurchaseOrders || []).filter(po => po.staffId === currentStaff?.id);
  const myGatePasses = (canteenGatePasses || []).filter(gp => gp.bearerStaffId === currentStaff?.id);
  const myLeaves = (leaveRequests || []).filter(l => l.staffId === currentStaff?.id);
  const myOvertime = (overtimeRequests || []).filter(o => o.staffId === currentStaff?.id);
  const myOffsetRequests = (offsetRequests || []).filter(r => r.staffId === currentStaff?.id);
  const myOBRequests = (officialBusinessRequests || []).filter(r => r.staffId === currentStaff?.id);
  const myUndertimeRequests = (undertimeRequests || []).filter(r => r.staffId === currentStaff?.id);
  const myPendingWithdrawals = coopWithdrawals.filter(
    w => w.staffId === currentStaff?.id && w.status === 'Pending Accounting Approval'
  );

  const handleMedicalCertificateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Medical certificate file exceeds 15MB limit.');
      return;
    }
    try {
      setUploadingMedCert(true);
      const compressed = await compressDocument(file, {
        category: 'medical',
        categoryLabel: 'Medical Certificate (Sick Leave)',
        uploadedBy: currentStaff ? formatStaffName(currentStaff) : 'Employee',
        notes: `Sick Leave Medical Certificate (${leaveForm.startDate})`
      });
      setLeaveForm(prev => ({ ...prev, medicalCertificate: compressed }));
    } catch (err) {
      console.error('Medical cert upload error:', err);
    } finally {
      setUploadingMedCert(false);
    }
  };

  const handleEmployeePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (currentStaff) {
          updateStaff(currentStaff.id, { avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter attendance logs for this staff
  const myAttendance = attendanceLogs.filter(l => l.staffId === currentStaff?.id);

  // Find all payslips belonging to this staff across all pay runs
  const myPayslips = [];
  payRuns.forEach(run => {
    const item = run.items?.find(i => i.staffId === currentStaff?.id);
    if (item) {
      myPayslips.push({
        payRun: run,
        item
      });
    }
  });

  // Filter active misconduct callouts for this staff
  const myMisconductNotices = (misconductReports || []).filter(r => 
    (r.staffId === currentStaff?.id || r.staffEmployeeId === currentStaff?.employeeId) &&
    r.notifyStaff &&
    r.status !== 'RESOLVED_WARNED' &&
    r.status !== 'RESOLVED_SUSPENDED' &&
    r.status !== 'RESOLVED_DISMISSED'
  );

  return (
    <div className="space-y-6">
      
      {/* URGENT HR CALL-OUT & NOTICE TO EXPLAIN ALERT BANNER */}
      {myMisconductNotices.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-500 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 p-5 text-white shadow-2xl space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-rose-600 border border-rose-400 text-white flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider">
                    URGENT HR DIRECTIVE
                  </span>
                  <span className="text-xs text-rose-200 font-bold">
                    Immediate HR Office Call-Out Required
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-0.5">
                  Notice to Explain: {myMisconductNotices[0].categoryLabel}
                </h3>
                <p className="text-xs text-rose-200/90 leading-relaxed mt-0.5">
                  You are required to report immediately to the HR Office regarding incident #{myMisconductNotices[0].id}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveNoticeReport(myMisconductNotices[0]);
                  setStaffExplanationText(myMisconductNotices[0].explanationText || '');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-950 text-xs font-black flex items-center justify-center gap-2 shadow-xl transition cursor-pointer"
              >
                <FileText className="h-4 w-4 text-rose-600" />
                <span>Review Notice &amp; Instructions</span>
                {!myMisconductNotices[0].acknowledgedAt && (
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-rose-800/80 text-[11px] text-rose-300">
            <span>Incident Date: {myMisconductNotices[0].incidentDate} at {myMisconductNotices[0].incidentTime}</span>
            <span>
              Status:{' '}
              <strong className={myMisconductNotices[0].acknowledgedAt ? 'text-emerald-300' : 'text-amber-300 underline'}>
                {myMisconductNotices[0].acknowledgedAt ? 'Receipt Acknowledged by You' : 'Unacknowledged - Immediate Action Required'}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Minimal Responsive Employee Profile & Digital Identity Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Avatar & Core Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative group shrink-0">
              <img
                src={currentStaff?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStaff?.firstName}`}
                alt="Avatar"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-slate-200 bg-slate-100"
              />
              <label
                htmlFor="employee-portal-photo-input"
                title="Upload / Change Profile Picture"
                className="absolute inset-0 bg-slate-900/80 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer transition"
              >
                <Camera className="h-4 w-4 mb-0.5 text-slate-300" />
                Photo
              </label>
              <input
                id="employee-portal-photo-input"
                type="file"
                accept="image/*"
                onChange={handleEmployeePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  ESS Portal
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  {currentStaff?.employeeId}
                </span>
                {currentStaff?.isTeamLeader && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase">
                    <Crown className="h-3 w-3 text-amber-600" />
                    Team Leader
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                {currentStaff ? formatStaffName(currentStaff) : 'EMPLOYEE'}
              </h2>

              <p className="text-xs text-slate-500 truncate">
                {pos?.title || 'Staff'} · <strong className="text-slate-700 font-semibold">{dept?.name || 'Department'}</strong>
              </p>
            </div>
          </div>

          {/* Right: Compact Emergency Contact + Digital ID Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 lg:justify-end">
            {/* Compact ICE Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs">
              <PhoneCall className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              <div className="leading-tight">
                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 block">Emergency (ICE)</span>
                <span className="font-bold text-slate-900 text-[11px]">
                  {currentStaff?.emergencyContactName || 'Unregistered'}
                </span>
                {currentStaff?.emergencyContactPhone && (
                  <a href={`tel:${currentStaff.emergencyContactPhone}`} className="ml-1.5 font-mono text-[11px] font-bold text-rose-700 hover:underline">
                    ({currentStaff.emergencyContactPhone})
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIdPassCodes(prev => !prev)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <ScanLine className="h-3.5 w-3.5 text-slate-600" />
              <span>{showIdPassCodes ? 'Hide Pass Codes' : 'Barcode & QR'}</span>
            </button>

            <button
              type="button"
              onClick={() => openDigitalId(currentStaff)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <QrCode className="h-3.5 w-3.5 text-cyan-400" />
              <span>Digital ID</span>
            </button>
          </div>
        </div>

        {/* Collapsible Barcode & QR Code Drawer */}
        {showIdPassCodes && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
            {/* 1D Barcode */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <ScanLine className="h-3.5 w-3.5 text-slate-500" /> 1D Barcode (Code 128)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopySnippet(currentStaff?.barcodeValue || currentStaff?.employeeId, 'barcode')}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedSnippet === 'barcode' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
                  <span>{copiedSnippet === 'barcode' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col items-center justify-center overflow-x-auto">
                <BarcodeView
                  value={currentStaff?.barcodeValue || currentStaff?.employeeId}
                  width={1.4}
                  height={40}
                  displayValue={false}
                />
                <span className="font-mono text-[11px] font-bold tracking-widest text-slate-800 mt-1">
                  {currentStaff?.barcodeValue || currentStaff?.employeeId}
                </span>
              </div>
            </div>

            {/* 2D QR Code */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <QrCode className="h-3.5 w-3.5 text-slate-500" /> 2D Turnstile QR Pass
                </span>
                <button
                  type="button"
                  onClick={() => handleCopySnippet(`NKB-STAFF:${currentStaff?.employeeId}:${currentStaff?.firstName}_${currentStaff?.lastName}:AUTH-2026`, 'qr')}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedSnippet === 'qr' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
                  <span>{copiedSnippet === 'qr' ? 'Copied' : 'Copy QR'}</span>
                </button>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-center gap-3.5">
                <QRCodeView
                  value={`NKB-STAFF:${currentStaff?.employeeId}:${currentStaff?.firstName}_${currentStaff?.lastName}:AUTH-2026`}
                  size={72}
                />
                <div className="space-y-0.5 text-xs min-w-0">
                  <div className="font-bold text-slate-900 truncate">{currentStaff?.firstName} {currentStaff?.lastName}</div>
                  <div className="font-mono text-[11px] font-bold text-slate-600">{currentStaff?.employeeId}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Turnstile Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Financial Services: Coop Share, Loans, Canteen Advance & Personal PO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Coop Share Capital */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-slate-600" />
              My Coop Share Capital
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              currentStaff.status === 'Retired' || currentStaff.coopStatus === 'Retired'
                ? 'bg-slate-200 text-slate-600 border-slate-300'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {currentStaff.status === 'Retired' || currentStaff.coopStatus === 'Retired' ? 'Retired / Settled' : 'Active Equity'}
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(myCoopBalance)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Max Loanable ({myCoopMultiplier}&times; &bull; {getStaffEmploymentLabel(currentStaff, false)}): <strong className="text-slate-800 font-mono">{formatCurrency(calculateMaxLoanableAmount(myCoopBalance, myCoopMultiplier, currentStaff))}</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setWithdrawForm({ amount: '', reason: '' });
                setShowWithdrawModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
              Request Withdrawal (via Accounting)
            </button>
          </div>
          {myPendingWithdrawals.length > 0 && (
            <div className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Pending Accounting: {formatCurrency(myPendingWithdrawals[0].amount)}</span>
            </div>
          )}
        </div>

        {/* Card 2: Cash Loans (2%, 3%, 5%) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-slate-600" />
              Cash Loans (HR Managed)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {myCoopMultiplier}&times; Basis &bull; Up to 36 Mos
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(myLoans.reduce((sum, l) => sum + (l.status === 'Approved' ? l.balanceRemaining : 0), 0))}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Does not reduce COOP Savings &bull; Limit ({myCoopMultiplier}&times;): {formatCurrency(calculateMaxLoanableAmount(myCoopBalance, myCoopMultiplier, currentStaff))}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={currentStaff.status === 'Retired' || currentStaff.coopStatus === 'Retired'}
              onClick={() => {
                setLoanForm({ category: 'cash', principal: '', termMonths: 3, purpose: '' });
                setShowLoanModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer disabled:cursor-not-allowed transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              {currentStaff.status === 'Retired' || currentStaff.coopStatus === 'Retired' ? 'Loans Disabled (Retired)' : 'Apply for Cash Loan'}
            </button>
          </div>
        </div>

        {/* Card 3: Canteen Cash Advance (1.5% fee) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-slate-600" />
              Canteen Cash Advance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              1.5% Salary Fee
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(myAdvances.reduce((sum, ca) => sum + (ca.status === 'Active' ? ca.balanceRemaining : 0), 0))}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Claimed from Canteen drawer under HR authority
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAdvanceForm({ principal: '', termMonths: 1, reason: '' });
                setShowAdvanceModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Request Cash Advance
            </button>
          </div>
        </div>

        {/* Card 4: Request Order (Personal Purchase Order) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-600" />
              Request Orders (PO)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Manufactured Goods
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {myPurchaseOrders.length} {myPurchaseOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              NKB Manufactured Goods · Cash or COOP
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPoCart([]);
                setPoPaymentMethod('coop');
                setPoPurpose('');
                setShowPOModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Request Order
            </button>
          </div>
        </div>
      </div>

      {/* Active Loans & Cash Advances Schedule */}
      {(myLoans.length > 0 || myAdvances.length > 0) && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
              My Credit Obligations &amp; Payroll Deduction Schedule
            </h4>
            <span className="text-[11px] text-slate-500">Semi-monthly payroll deductions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myLoans.map(l => (
              <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{l.categoryLabel}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {l.interestRate}%/mo
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {l.status === 'Approved' ? 'Active / Disbursed' : l.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Repayable</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(l.totalRepayable)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Per-Cutoff</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(l.cutoffDeduction)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Remaining</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(l.balanceRemaining)}</span>
                  </div>
                </div>
              </div>
            ))}

            {myAdvances.map(ca => (
              <div key={ca.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Canteen Cash Advance</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                      1.5% Fee
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {ca.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Principal + Fee</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(ca.totalRepayable)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Per-Cutoff</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(ca.cutoffDeduction)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Remaining</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(ca.balanceRemaining)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Request Orders (Personal Use - Manufactured Goods) Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-600" />
              My Personal Request Orders (NKB Manufactured Goods)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Payment via Cash (Receivable by Accounting) or COOP Share Capital
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPoCart([]);
              setPoPaymentMethod('coop');
              setPoPurpose('');
              setShowPOModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 text-white" />
            Request Order
          </button>
        </div>

        {myPurchaseOrders.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <Package className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No personal purchase orders requested yet.</p>
            <p className="text-[11px] text-slate-500">
              Need factory-manufactured goods at discounted employee prices? Click &ldquo;Request Order&rdquo; to place a personal order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">PO Number</th>
                  <th className="px-4 py-2.5">Date Requested</th>
                  <th className="px-4 py-2.5">Manufactured Products</th>
                  <th className="px-4 py-2.5 text-right">Total Amount</th>
                  <th className="px-4 py-2.5">Payment Method</th>
                  <th className="px-4 py-2.5">Accounting / COOP Status</th>
                  <th className="px-4 py-2.5 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myPurchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(po.requestedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {po.items?.map((i, idx) => (
                          <div key={idx}>
                            <span className="font-bold text-slate-800">{i.quantity}x {i.name}</span>
                            {i.sku && <span className="block font-mono text-[10px] text-slate-500">{i.sku}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">₱{po.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {po.paymentMethod === 'cash' ? (
                        <div>
                          <span className="font-bold text-slate-900 block">Cash</span>
                          <span className="text-[10px] text-slate-500">Receivable by Accounting</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900 block">COOP Share</span>
                          <span className="text-[10px] text-slate-500">Deducted from Capital</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      {po.accountingReceivableStatus || po.coopDeductionStatus || po.paymentStatus}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        po.status === 'Fulfilled' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Canteen Grocery Gate Passes (Half-A4 Printable) */}
      {myGatePasses.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-600" />
                My Canteen Grocery Gate Passes (Half-A4 Size)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official plant security exit passes for personal grocery purchases
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {myGatePasses.length} {myGatePasses.length === 1 ? 'Gate Pass' : 'Gate Passes'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Pass Number</th>
                  <th className="px-4 py-2.5">Issued Date &amp; Time</th>
                  <th className="px-4 py-2.5">Grocery Items Cleared</th>
                  <th className="px-4 py-2.5 text-right">Total Amount</th>
                  <th className="px-4 py-2.5">Security Gate Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myGatePasses.map(gp => (
                  <tr key={gp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{gp.gatePassNo}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(gp.issuedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 max-w-xs">
                        {gp.items?.map((it, idx) => (
                          <span key={idx} className="block text-[11px] font-medium text-slate-800">
                            {it.quantity}x {it.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(gp.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const isCleared = gp.gateStatus?.toLowerCase().includes('cleared') || gp.status?.toLowerCase().includes('cleared') || Boolean(gp.clearedAt);
                        return (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCleared ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {isCleared ? 'Cleared at Gate' : (gp.gateStatus || 'Issued')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedGatePass(gp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                      >
                        <Printer className="h-3.5 w-3.5 text-white" />
                        Print Gate Pass (Half A4)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave, Timekeeping & Official Business Self-Service Request Center (All Forms Preserved & Updated Live) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-slate-600" />
                Timekeeping, Leave &amp; Official Business Center
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                SL: {currentStaff?.sickLeaveRemaining ?? 5}/{currentStaff?.sickLeaveTotal ?? 5}d
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                VL: {currentStaff?.vacationLeaveRemaining ?? 5}/{currentStaff?.vacationLeaveTotal ?? 5}d
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Updated {lastLiveSyncAt ? `· ${new Date(lastLiveSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              All encoded forms are permanently preserved and synchronized live across HR Timekeeping &amp; Payroll
            </p>
          </div>

          {/* All 5 Form Encoding Buttons — Always Accessible */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingFormId(null);
                setLeaveForm({
                  type: 'Sick Leave',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  days: 1,
                  reason: '',
                  medicalCertificate: null
                });
                setShowLeaveModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Leave / Med Cert</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingFormId(null);
                setOffsetForm({
                  requestType: 'Schedule Offset (Extra Hours to Offset Late/Undertime)',
                  sourceDate: new Date().toISOString().split('T')[0],
                  targetOffsetDate: new Date().toISOString().split('T')[0],
                  hours: 2,
                  timeIn: '08:00 AM',
                  lunchOut: '12:00 PM',
                  lunchIn: '01:00 PM',
                  breakOut: '03:00 PM',
                  breakIn: '03:15 PM',
                  timeOut: '05:00 PM',
                  reason: ''
                });
                setShowOffsetModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
              <span>Offset Timekeeper</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingFormId(null);
                setObForm({
                  date: new Date().toISOString().split('T')[0],
                  departureTime: '08:00 AM',
                  returnTime: '05:00 PM',
                  clientOrDestination: '',
                  transactionType: 'Client Meeting / Delivery / Field Transaction',
                  purpose: '',
                  noClockInRequired: true
                });
                setShowOBModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Briefcase className="h-3.5 w-3.5 text-sky-600" />
              <span>Official Business</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingFormId(null);
                setUndertimeForm({
                  date: new Date().toISOString().split('T')[0],
                  scheduledTimeOut: '05:00 PM',
                  requestedTimeOut: '03:00 PM',
                  undertimeHours: 2,
                  reasonCategory: 'Medical / Clinic Appointment',
                  reason: ''
                });
                setShowUndertimeModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <TimerOff className="h-3.5 w-3.5 text-rose-600" />
              <span>Undertime Form</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingFormId(null);
                setOtForm({
                  staffId: currentStaff?.id || '',
                  date: new Date().toISOString().split('T')[0],
                  hours: 2,
                  reasonCategory: 'Urgent Client Delivery / Rush Order',
                  reason: ''
                });
                setShowOTModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Overtime Form</span>
            </button>
          </div>
        </div>

        {/* Minimal Segmented Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Encoded Forms (${myLeaves.length + myOffsetRequests.length + myOBRequests.length + myUndertimeRequests.length + myOvertime.length})` },
            { id: 'leaves', label: `Leaves (${myLeaves.length})` },
            { id: 'offset', label: `Offset (${myOffsetRequests.length})` },
            { id: 'ob', label: `Official Business (${myOBRequests.length})` },
            { id: 'undertime', label: `Undertime (${myUndertimeRequests.length})` },
            { id: 'ot', label: `Overtime (${myOvertime.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveRequestTab(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                activeRequestTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Responsive Cards Grid — All Encoded Forms Visible & Editable Live */}
        <div className={`grid grid-cols-1 ${
          activeRequestTab === 'all' ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-1'
        } gap-3.5`}>
          
          {/* 1. Leaves Card */}
          {(activeRequestTab === 'all' || activeRequestTab === 'leaves') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Leave Applications ({myLeaves.length})
                </span>
                <span className="text-[10px] text-slate-400">Med Cert supported</span>
              </div>

              {myLeaves.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No leave applications filed.</p>
              ) : (
                <div className="space-y-2">
                  {myLeaves.map(leave => (
                    <div key={leave.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {leave.type}
                          {leave.medicalCertificate && (
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(leave.medicalCertificate)}
                              className="px-1.5 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition shrink-0"
                            >
                              <Stethoscope className="h-2.5 w-2.5" />
                              Med Cert
                            </button>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFormId(leave.id);
                              setLeaveForm({
                                type: leave.type || 'Sick Leave',
                                startDate: leave.startDate || new Date().toISOString().split('T')[0],
                                endDate: leave.endDate || leave.startDate || new Date().toISOString().split('T')[0],
                                days: leave.days || 1,
                                reason: leave.reason || '',
                                medicalCertificate: leave.medicalCertificate || null
                              });
                              setShowLeaveModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition"
                            title="Update this encoded leave form live"
                          >
                            Edit Live
                          </button>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : leave.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {leave.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        {leave.startDate} {leave.endDate && leave.endDate !== leave.startDate ? `~ ${leave.endDate}` : ''} · {leave.days}d
                      </div>
                      {leave.reason && (
                        <p className="text-[11px] text-slate-600">{leave.reason}</p>
                      )}
                      {leave.remarks && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          HR Note: {leave.remarks} {leave.reviewedBy ? `(${leave.reviewedBy})` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Offset Timekeeper Card */}
          {(activeRequestTab === 'all' || activeRequestTab === 'offset') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                  Offset Timekeeper ({myOffsetRequests.length})
                </span>
                <span className="text-[10px] text-slate-400">6-Punch / Schedule</span>
              </div>

              {myOffsetRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No offset timekeeper requests.</p>
              ) : (
                <div className="space-y-2">
                  {myOffsetRequests.map(req => (
                    <div key={req.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate">{req.requestType}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFormId(req.id);
                              setOffsetForm({
                                requestType: req.requestType || 'Schedule Offset (Extra Hours to Offset Late/Undertime)',
                                sourceDate: req.sourceDate || req.earnedDate || new Date().toISOString().split('T')[0],
                                targetOffsetDate: req.targetOffsetDate || req.offsetDate || new Date().toISOString().split('T')[0],
                                hours: req.hours || 2,
                                timeIn: req.timeIn || '08:00 AM',
                                lunchOut: req.lunchOut || '12:00 PM',
                                lunchIn: req.lunchIn || '01:00 PM',
                                breakOut: req.breakOut || '03:00 PM',
                                breakIn: req.breakIn || '03:15 PM',
                                timeOut: req.timeOut || '05:00 PM',
                                reason: req.reason || ''
                              });
                              setShowOffsetModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition"
                            title="Update this encoded offset form live"
                          >
                            Edit Live
                          </button>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        {req.sourceDate || req.earnedDate} {(req.targetOffsetDate || req.offsetDate) && (req.targetOffsetDate || req.offsetDate) !== (req.sourceDate || req.earnedDate) ? `→ ${req.targetOffsetDate || req.offsetDate}` : ''} · {req.hours}h
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        In {req.timeIn} | LO {req.lunchOut} | LI {req.lunchIn} | BO {req.breakOut} | BI {req.breakIn} | Out {req.timeOut}
                      </div>
                      {req.reason && (
                        <p className="text-[11px] text-slate-600">{req.reason}</p>
                      )}
                      {req.remarks && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          HR Note: {req.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Official Business (OB) Card */}
          {(activeRequestTab === 'all' || activeRequestTab === 'ob') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-sky-600" />
                  Official Business ({myOBRequests.length})
                </span>
                <span className="text-[10px] text-sky-700 font-semibold">No Clock-In</span>
              </div>

              {myOBRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No official business filings.</p>
              ) : (
                <div className="space-y-2">
                  {myOBRequests.map(ob => (
                    <div key={ob.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 truncate">{ob.clientOrDestination || ob.destination}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFormId(ob.id);
                              setObForm({
                                date: ob.date || new Date().toISOString().split('T')[0],
                                departureTime: ob.departureTime || ob.startTime || '08:00 AM',
                                returnTime: ob.returnTime || ob.endTime || '05:00 PM',
                                transactionType: ob.transactionType || 'Client Meeting / Delivery / Field Transaction',
                                clientOrDestination: ob.clientOrDestination || ob.destination || '',
                                purpose: ob.purpose || '',
                                noClockInRequired: true
                              });
                              setShowOBModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition"
                            title="Update this encoded Official Business form live"
                          >
                            Edit Live
                          </button>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            ob.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ob.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ob.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-sky-700 font-semibold">{ob.transactionType}</div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        {ob.date} · {ob.departureTime || ob.startTime} – {ob.returnTime || ob.endTime}
                      </div>
                      {ob.purpose && (
                        <p className="text-[11px] text-slate-600">{ob.purpose}</p>
                      )}
                      {ob.remarks && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          HR Note: {ob.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Undertime Forms Card */}
          {(activeRequestTab === 'all' || activeRequestTab === 'undertime') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TimerOff className="h-3.5 w-3.5 text-rose-600" />
                  Undertime Forms ({myUndertimeRequests.length})
                </span>
                <span className="text-[10px] text-slate-400">Early Out</span>
              </div>

              {myUndertimeRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No undertime requests filed.</p>
              ) : (
                <div className="space-y-2">
                  {myUndertimeRequests.map(ut => (
                    <div key={ut.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900">{ut.undertimeHours}h Undertime</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFormId(ut.id);
                              setUndertimeForm({
                                date: ut.date || new Date().toISOString().split('T')[0],
                                scheduledTimeOut: ut.scheduledTimeOut || ut.scheduledOut || '05:00 PM',
                                requestedTimeOut: ut.requestedTimeOut || ut.departureTime || '03:00 PM',
                                undertimeHours: ut.undertimeHours || 2,
                                reasonCategory: ut.reasonCategory || 'Medical / Clinic Appointment',
                                reason: ut.reason || ''
                              });
                              setShowUndertimeModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition"
                            title="Update this encoded Undertime form live"
                          >
                            Edit Live
                          </button>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            ut.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ut.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ut.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">
                        {ut.date} · Out {ut.requestedTimeOut || ut.departureTime} (Sched {ut.scheduledTimeOut || ut.scheduledOut})
                      </div>
                      {ut.reasonCategory && (
                        <div className="text-[10px] text-rose-700 font-semibold">{ut.reasonCategory}</div>
                      )}
                      {ut.reason && (
                        <p className="text-[11px] text-slate-600">{ut.reason}</p>
                      )}
                      {ut.remarks && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          HR Note: {ut.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Overtime Requests Card */}
          {(activeRequestTab === 'all' || activeRequestTab === 'ot') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Overtime Requests ({myOvertime.length})
                </span>
                <span className="text-[10px] text-slate-400">HR Cleared</span>
              </div>

              {myOvertime.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No overtime requests filed.</p>
              ) : (
                <div className="space-y-2">
                  {myOvertime.map(ot => (
                    <div key={ot.id} className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ot.hours}h OT (@ +30%)</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFormId(ot.id);
                              setOtForm({
                                staffId: ot.staffId || currentStaff?.id || '',
                                date: ot.date || new Date().toISOString().split('T')[0],
                                hours: ot.hours || 2,
                                reasonCategory: ot.reasonCategory || 'Urgent Client Delivery / Rush Order',
                                reason: ot.reason || ot.task || ''
                              });
                              setShowOTModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold cursor-pointer transition"
                            title="Update this encoded Overtime form live"
                          >
                            Edit Live
                          </button>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            ot.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ot.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ot.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono">{ot.date}</div>
                      {ot.reasonCategory && (
                        <div className="text-[10px] text-amber-700 font-semibold">{ot.reasonCategory}</div>
                      )}
                      {(ot.reason || ot.task) && (
                        <p className="text-[11px] text-slate-600">{ot.reason || ot.task}</p>
                      )}
                      {ot.remarks && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          HR Note: {ot.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Main Grid: Payslips History + Attendance Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Payslips (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              My Official Payslips ({myPayslips.length})
            </h3>
            <span className="text-xs text-slate-500">View and print confidential salary slips</span>
          </div>

          <div className="space-y-3">
            {myPayslips.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center text-slate-400 text-xs shadow-sm">
                No payslips calculated for your account yet.
              </div>
            ) : (
              myPayslips.map(({ payRun, item }) => (
                <div
                  key={payRun.id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{payRun.code}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {payRun.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{payRun.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      Period: {payRun.periodStart} ~ {payRun.periodEnd} · Payout: {payRun.payDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-medium">Take-Home Pay</span>
                      <span className="text-sm font-black font-mono text-slate-900">
                        {formatCurrency(item.netPay)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPayslipData({ payRun, item })}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-white" />
                      View Payslip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Attendance Records (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600" />
              Recent Timeclock Activity
            </h3>
            <span className="text-xs text-slate-500">Barcode Punches &amp; OB</span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
            {myAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No timeclock records logged today.</p>
            ) : (
              myAttendance.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-700 font-bold block">{log.date}</span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {log.status}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-slate-900 font-bold">In: {log.timeIn}</div>
                    <div className="text-slate-500 text-[11px]">Out: {log.timeOut || 'Active'}</div>
                  </div>
                </div>
              ))
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              💡 <strong>Tip:</strong> Scan your physical badge at the entrance kiosk, or file an <strong>Official Business (OB)</strong> request if transacting outside during business hours.
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}

      {/* Modal: File or Live Update Overtime Request */}
      {showOTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  {editingFormId ? 'Update Overtime Form (Live Sync)' : 'Request Overtime Clearance to HR'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Filed by: <strong className="text-slate-800">{formatStaffName(currentStaff)}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowOTModal(false); setEditingFormId(null); }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Mandatory HR Policy: Overtime Request &amp; Reason</span>
              </div>
              <p className="text-[11px] text-amber-900">
                Before declaring or rendering any overtime, an official request must be submitted to <strong>HR Management</strong> stating a valid operational reason. Only HR-approved overtime is credited to attendance and payroll (+30% per hour).
              </p>
            </div>

            {/* DOLE Fatigue Warning if hours > 4 */}
            {Number(otForm.hours) > 4 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  DOLE Fatigue &amp; Health Advisory Warning
                </div>
                <p className="text-[11px] text-rose-700 leading-snug">
                  Overtime exceeding <strong>4 hours</strong> in a single shift poses safety risks. Please verify emergency operational necessity and ensure adequate rest intervals.
                </p>
              </div>
            )}

            {/* Retroactive Request Warning if date is before today */}
            {otForm.date < new Date().toISOString().split('T')[0] && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs">
                ⚠️ <strong>Retroactive Post-Shift Filing:</strong> The selected shift date has already passed. This voucher will be labeled as a Retroactive Request and subject to strict HR scrutiny.
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!otForm.date) return;
                const targetStaff = staffList.find(s => s.id === (otForm.staffId || currentStaff?.id)) || currentStaff;
                const isRetro = otForm.date < new Date().toISOString().split('T')[0];
                if (editingFormId) {
                  updateOvertimeRequest(editingFormId, {
                    staffId: targetStaff.id,
                    staffName: formatStaffName(targetStaff),
                    employeeId: targetStaff.employeeId,
                    date: otForm.date,
                    hours: Number(otForm.hours) || 2,
                    reasonCategory: otForm.reasonCategory,
                    reason: otForm.reason,
                    task: otForm.reason,
                    isRetroactive: isRetro
                  });
                  setShowOTModal(false);
                  setEditingFormId(null);
                  return;
                }
                const res = fileOvertimeRequest({
                  staffId: targetStaff.id,
                  staffName: formatStaffName(targetStaff),
                  employeeId: targetStaff.employeeId,
                  date: otForm.date,
                  hours: Number(otForm.hours) || 2,
                  reasonCategory: otForm.reasonCategory,
                  reason: otForm.reason,
                  task: otForm.reason,
                  shift: 'Day Shift Extension (No Night Shift)',
                  requestedByTeamLeader: isTeamLeaderOrAdmin,
                  teamLeaderStaffId: currentStaff?.id,
                  teamLeaderName: formatStaffName(currentStaff),
                  isRetroactive: isRetro
                });
                if (res) {
                  setShowOTModal(false);
                  setEditingFormId(null);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Employee for Overtime
                </label>
                <select
                  value={otForm.staffId || currentStaff?.id}
                  onChange={(e) => setOtForm({ ...otForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none font-medium"
                >
                  {staffList.filter(s => s.status !== 'inactive').map(s => (
                    <option key={s.id} value={s.id}>
                      {formatStaffName(s)} ({s.employeeId}) · {s.departmentName || 'General Staff'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Shift Extension Date</label>
                  <input
                    type="date"
                    required
                    value={otForm.date}
                    onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Estimated Hours (@ +30%)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max="8"
                    required
                    value={otForm.hours}
                    onChange={(e) => setOtForm({ ...otForm, hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    e.g. 2 hrs (5:00 PM – 7:00 PM)
                  </span>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason Category (HR Classification)</label>
                <select
                  value={otForm.reasonCategory}
                  onChange={(e) => setOtForm({ ...otForm, reasonCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <option value="Urgent Client Delivery / Rush Order">Urgent Client Delivery / Rush Order</option>
                  <option value="Machine Maintenance &amp; IT Repairs">Machine Maintenance &amp; IT Repairs</option>
                  <option value="Physical Inventory Audit / Stock Receiving">Physical Inventory Audit / Stock Receiving</option>
                  <option value="Shift Cover / Unplanned Absence Replacement">Shift Cover / Unplanned Absence Replacement</option>
                  <option value="Facility Sanitation &amp; Safety Compliance">Facility Sanitation &amp; Safety Compliance</option>
                  <option value="Special Plant Engineering Project">Special Plant Engineering Project</option>
                  <option value="Other Operational Task">Other Operational Task</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1 flex items-center justify-between">
                  <span>Detailed Reason / Operational Justification (Required)</span>
                  <span className="text-[10px] text-slate-500 font-normal">Min 5 characters</span>
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="Explain specifically why overtime is required for HR review and clearance..."
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setShowOTModal(false); setEditingFormId(null); }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5 text-white" />
                  {editingFormId ? 'Save Live Overtime Update' : 'Submit Overtime Request to HR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPayslipData && (
        <PayslipDocument
          staff={currentStaff}
          payRun={selectedPayslipData.payRun}
          item={selectedPayslipData.item}
          onClose={() => setSelectedPayslipData(null)}
        />
      )}

      {/* Modal: Apply for Cash Loan */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-slate-600" />
                Apply for Cash Loan
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              💡 <strong>Loan Eligibility &amp; 2-Stage Approval ({getStaffEmploymentLabel(currentStaff, true)}):</strong> As a <strong>{isProjectBasedStaff(currentStaff) ? 'Project-Based (2× Basis)' : 'Regular (3× Basis)'}</strong> employee, you can borrow up to <strong>{myCoopMultiplier}&times; your COOP Savings</strong> ({formatCurrency(myCoopBalance)} &times; {myCoopMultiplier} = <strong className="font-mono text-slate-900">{formatCurrency(calculateMaxLoanableAmount(myCoopBalance, myCoopMultiplier, currentStaff))}</strong>). Taking a loan <strong>does not decrease</strong> your COOP Savings.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Loan Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOAN_CATEGORIES.map(cat => {
                    const isSel = loanForm.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLoanForm({ ...loanForm, category: cat.id })}
                        className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">{cat.label}</div>
                        <div className={`text-[10px] font-bold ${isSel ? 'text-slate-300' : 'text-slate-500'}`}>
                          {cat.monthlyRate}% monthly interest
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Requested Amount (PHP)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={loanForm.principal}
                    onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Repayment Term (Max 36 Months)</label>
                  <select
                    value={loanForm.termMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, termMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {LOAN_TERM_OPTIONS.map(opt => (
                      <option key={opt.months || opt.value} value={opt.months || opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Repayment Calculation Preview */}
              {Number(loanForm.principal) > 0 && (() => {
                const p = Number(loanForm.principal);
                const t = Number(loanForm.termMonths);
                const maxAllowed = calculateMaxLoanableAmount(myCoopBalance, myCoopMultiplier, currentStaff);
                const exceedsMax = p > maxAllowed;
                const catObj = LOAN_CATEGORIES.find(c => c.id === loanForm.category) || { monthlyRate: 2 };
                const r = catObj.monthlyRate;
                const int = Math.round(p * (r / 100) * t);
                const tot = p + int;
                const monthly = Math.round(tot / t);
                const cut = Math.round(tot / (t * 2));
                return (
                  <div className={`p-3 rounded-xl border text-[11px] space-y-1 font-mono ${exceedsMax ? 'bg-slate-100 border-slate-400' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between text-slate-600">
                      <span>COOP Savings &bull; Max Loanable ({myCoopMultiplier}&times;):</span>
                      <span className="font-bold text-slate-900">{formatCurrency(myCoopBalance)} &bull; {formatCurrency(maxAllowed)}</span>
                    </div>
                    {exceedsMax && (
                      <div className="text-slate-900 font-bold bg-white px-2 py-1 rounded border border-slate-300">
                        ⚠️ Requested amount ({formatCurrency(p)}) exceeds your {myCoopMultiplier}&times; maximum loanable amount ({formatCurrency(maxAllowed)}).
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Interest Rate:</span>
                      <span className="font-bold text-slate-900">{r}% / month</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Interest over {t} mos:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(int)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Payable:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(tot)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Amortization:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(monthly)} / month</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                      <span>Semi-Monthly Cutoff Deduction:</span>
                      <span>{formatCurrency(cut)} / paycheck</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason / Purpose of Loan</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase of laptop / Home improvement"
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowLoanModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!loanForm.principal) return;
                  const res = requestCashLoan({ ...loanForm, staffId: currentStaff.id });
                  if (res?.success) {
                    setShowLoanModal(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit Loan Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Cash Advance */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-slate-600" />
                Request Canteen Cash Advance
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              🍽️ <strong>Canteen Authority Notice:</strong> Cash Advances are disbursed directly from the <strong>Canteen&apos;s physical cash drawer</strong>.
              A flat <strong>1.5% fee</strong> applies and will be deducted from your salary across the chosen terms.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Advance Amount (PHP)</label>
                <input
                  type="number"
                  placeholder="e.g. 3000"
                  value={advanceForm.principal}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, principal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Repayment Term</label>
                <select
                  value={advanceForm.termMonths}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, termMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value={1}>1 Month (2 semi-monthly cutoffs)</option>
                  <option value={2}>2 Months (4 semi-monthly cutoffs)</option>
                </select>
              </div>

              {Number(advanceForm.principal) > 0 && (() => {
                const p = Number(advanceForm.principal);
                const fee = Math.round(p * 0.015);
                const tot = p + fee;
                const cut = Math.round(tot / (advanceForm.termMonths * 2));
                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Canteen Processing Fee (1.5%):</span>
                      <span className="font-bold text-slate-900">{formatCurrency(fee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Salary Deduction:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(tot)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                      <span>Per-Paycheck Deduction:</span>
                      <span>{formatCurrency(cut)} / cutoff</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Daily meals, fare, emergency cash"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!advanceForm.principal) return;
                  requestCashAdvance({ ...advanceForm, staffId: currentStaff.id });
                  setShowAdvanceModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit Request to Canteen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Coop Withdrawal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-slate-600" />
                Request Share Capital Withdrawal
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              ⚠️ <strong>Accounting Approval Workflow:</strong> Your withdrawal request is submitted by HR directly to the <strong>Accounting Department</strong> for review and fund release.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Available Share Capital: <span className="font-mono text-slate-900 font-bold">{formatCurrency(myCoopBalance)}</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason for Withdrawal</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Emergency family expense, medical needs"
                  value={withdrawForm.reason}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!withdrawForm.amount) return;
                  const res = requestCoopWithdrawal(currentStaff.id, withdrawForm.amount, withdrawForm.reason);
                  if (res?.success) setShowWithdrawModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit to Accounting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Personal Purchase Order (Personal Use) */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-600" />
                Request Order (Personal Purchase Order - NKB Manufactured Goods)
              </h3>
              <button 
                type="button"
                onClick={() => setShowPOModal(false)} 
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              ⚙️ Order <strong>NKB Manufacturing Corp. factory-produced products &amp; machinery</strong> for personal use at discounted employee factory prices. Choose payment via <strong>Cash (receivable by accounting)</strong> or <strong>COOP Share Capital deduction</strong>.
            </div>

            {/* Product Selector to add into order */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Manufactured Product</label>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs"
                  >
                    <option value="">Choose a manufactured product...</option>
                    {(manufacturingProducts || []).map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.name} ({p.sku}) · ₱{p.employeePrice.toLocaleString()} [Save ₱{(p.regularPrice - p.employeePrice).toLocaleString()}] ({p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-center font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProductId) return;
                      const prod = (manufacturingProducts || []).find(p => p.id === selectedProductId);
                      if (!prod) return;
                      setPoCart(prev => {
                        const exist = prev.find(i => i.id === prod.id);
                        if (exist) {
                          return prev.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + poQuantity } : i);
                        }
                        return [...prev, {
                          id: prod.id,
                          name: prod.name,
                          sku: prod.sku,
                          modelNumber: prod.modelNumber,
                          plantLocation: prod.plantLocation,
                          price: prod.employeePrice,
                          regularPrice: prod.regularPrice,
                          quantity: poQuantity,
                          barcode: prod.barcode
                        }];
                      });
                      setSelectedProductId('');
                      setPoQuantity(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Product Specifications Preview */}
              {(() => {
                const sel = (manufacturingProducts || []).find(p => p.id === selectedProductId);
                if (!sel) return null;
                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{sel.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{sel.sku}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{sel.specs}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <span><strong>Plant:</strong> {sel.plantLocation}</span>
                      <span><strong>Warranty:</strong> {sel.warranty}</span>
                      <span><strong>SRP:</strong> ₱{sel.regularPrice.toLocaleString()}</span>
                      <span className="text-slate-900 font-bold"><strong>Employee Price:</strong> ₱{sel.employeePrice.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Order Cart List */}
              <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/70 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Manufactured Products in Order ({poCart.length})
                </span>
                {poCart.length === 0 ? (
                  <p className="text-slate-400 text-[11px] py-2 text-center">No manufacturing products added yet.</p>
                ) : (
                  poCart.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-none text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.quantity}x {item.name}</span>
                        {item.sku && <span className="text-slate-500 block text-[10px] font-mono">{item.sku} · ₱{item.price.toFixed(2)} each</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">₱{(item.price * item.quantity).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setPoCart(prev => prev.filter(i => i.id !== item.id))}
                          className="text-slate-400 hover:text-slate-700 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Order Amount & Payment Selection */}
              {(() => {
                const totalOrderAmt = poCart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
                const isInsufficientCoop = poPaymentMethod === 'coop' && totalOrderAmt > myCoopBalance;

                return (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                      <span className="font-bold text-slate-700">Total Purchase Order:</span>
                      <span className="text-base font-black text-slate-900 font-mono">₱{totalOrderAmt.toFixed(2)}</span>
                    </div>

                    {/* Payment Options: Cash (receivable by accounting) or COOP */}
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">
                        Select Payment Option <span className="text-slate-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        
                        {/* Option 1: Cash (Receivable by Accounting) */}
                        <button
                          type="button"
                          onClick={() => setPoPaymentMethod('cash')}
                          className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                            poPaymentMethod === 'cash'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>Cash</span>
                            {poPaymentMethod === 'cash' && <Check className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${poPaymentMethod === 'cash' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Receivable by Accounting
                          </div>
                          <p className={`text-[9px] mt-1 leading-relaxed ${poPaymentMethod === 'cash' ? 'text-slate-400' : 'text-slate-400'}`}>
                            Payable at Accounting Office Cashier upon receipt issuance.
                          </p>
                        </button>

                        {/* Option 2: COOP Share Capital */}
                        <button
                          type="button"
                          onClick={() => setPoPaymentMethod('coop')}
                          className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                            poPaymentMethod === 'coop'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>COOP Share Capital</span>
                            {poPaymentMethod === 'coop' && <Check className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${poPaymentMethod === 'coop' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Balance: ₱{myCoopBalance.toLocaleString()}
                          </div>
                          <p className={`text-[9px] mt-1 leading-relaxed ${poPaymentMethod === 'coop' ? 'text-slate-400' : 'text-slate-400'}`}>
                            Directly deducted from your available Coop Share balance.
                          </p>
                        </button>

                      </div>
                    </div>

                    {isInsufficientCoop && (
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-slate-600 shrink-0" />
                        <span>
                          Insufficient Coop Share Capital! You need ₱{totalOrderAmt.toLocaleString()}, but have ₱{myCoopBalance.toLocaleString()}. Choose <strong>Cash (Receivable by Accounting)</strong> instead.
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Purpose / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Home workshop fabrication, garage utility repairs, residential use"
                        value={poPurpose}
                        onChange={(e) => setPoPurpose(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowPOModal(false)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={poCart.length === 0 || isInsufficientCoop}
                        onClick={() => {
                          if (poCart.length === 0 || isInsufficientCoop) return;
                          const res = createPersonalPurchaseOrder({
                            staffId: currentStaff.id,
                            items: poCart,
                            paymentMethod: poPaymentMethod,
                            purpose: poPurpose
                          });
                          if (res?.success) {
                            setShowPOModal(false);
                            setPoCart([]);
                            setPoPurpose('');
                          }
                        }}
                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 text-white" />
                        Submit Request Order
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* Modal: View & Print Gate Pass (Half A4 / A5) */}
      {selectedGatePass && (
        <GatePassModal
          gatePass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

      {/* Modal: File or Live-Update Leave Application (with Medical Certificate Attachment) */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                {editingFormId ? 'Update Encoded Leave Application (Live)' : 'File Leave Application'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingFormId(null);
                  setShowLeaveModal(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Leave Type</label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                >
                  <option value="Sick Leave">Sick Leave (SL) — Attach Medical Certificate</option>
                  <option value="Vacation Leave">Vacation Leave (Leave With Pay / SIL)</option>
                  <option value="Emergency Leave">Emergency Leave (EL)</option>
                  <option value="Bereavement Leave">Bereavement Leave</option>
                  <option value="Solo Parent Leave">Solo Parent Leave</option>
                  <option value="Maternity / Paternity Leave">Maternity / Paternity Leave</option>
                </select>
              </div>

              {/* Real-time Leave Balance Check */}
              {(() => {
                const isSick = (leaveForm.type || '').toLowerCase().includes('sick');
                const rem = isSick
                  ? (currentStaff?.sickLeaveRemaining !== undefined ? currentStaff.sickLeaveRemaining : 5)
                  : (currentStaff?.vacationLeaveRemaining !== undefined ? currentStaff.vacationLeaveRemaining : 5);
                const total = isSick
                  ? (currentStaff?.sickLeaveTotal !== undefined ? currentStaff.sickLeaveTotal : 5)
                  : (currentStaff?.vacationLeaveTotal !== undefined ? currentStaff.vacationLeaveTotal : 5);
                const daysNum = Number(leaveForm.days) || 1;
                const isExhausted = rem <= 0;
                const hasExcess = daysNum > rem;

                return (
                  <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    isExhausted
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : hasExcess
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span>Available Balance ({isSick ? 'Sick Leave' : 'Leave With Pay'}):</span>
                      <span className="font-mono text-sm">{rem} of {total} Days</span>
                    </div>
                    {isExhausted ? (
                      <p className="text-[11px] leading-snug">
                        ⚠️ <strong>Leave Without Pay (LWOP):</strong> You have 0 paid days remaining. This application will be submitted as an unpaid absence for HR evaluation.
                      </p>
                    ) : hasExcess ? (
                      <p className="text-[11px] leading-snug">
                        ⚠️ <strong>Partial Unpaid:</strong> You requested {daysNum} days, but have {rem} paid days remaining. {daysNum - rem} day(s) will be treated as Leave Without Pay (LWOP).
                      </p>
                    ) : (
                      <p className="text-[11px] leading-snug">
                        ✓ <strong>Paid Leave:</strong> {daysNum} day(s) will be deducted from your remaining balance upon HR approval ({rem - daysNum} day(s) left after approval).
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      let nextDays = leaveForm.days;
                      if (nextStart && leaveForm.endDate) {
                        const diff = Math.round((new Date(leaveForm.endDate) - new Date(nextStart)) / (1000 * 60 * 60 * 24)) + 1;
                        if (diff >= 1) nextDays = diff;
                      }
                      setLeaveForm({ ...leaveForm, startDate: nextStart, days: nextDays });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => {
                      const nextEnd = e.target.value;
                      let nextDays = leaveForm.days;
                      if (leaveForm.startDate && nextEnd) {
                        const diff = Math.round((new Date(nextEnd) - new Date(leaveForm.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                        if (diff >= 1) nextDays = diff;
                      }
                      setLeaveForm({ ...leaveForm, endDate: nextEnd, days: nextDays });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Duration (Working Days)</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  required
                  value={leaveForm.days}
                  onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-center font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                />
              </div>

              {/* Sick Leave Medical Certificate Attachment */}
              <div className={`p-3.5 rounded-2xl border space-y-2 ${
                (leaveForm.type || '').toLowerCase().includes('sick')
                  ? 'bg-teal-50/70 border-teal-300'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <Stethoscope className="h-4 w-4 text-teal-600" />
                    Medical Certificate Attachment
                    {(leaveForm.type || '').toLowerCase().includes('sick') && (
                      <span className="px-2 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider">
                        Sick Leave Supporting Doc
                      </span>
                    )}
                  </label>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Attach your attending physician&apos;s <strong>Medical Certificate</strong> or clinic clearance (Image/PDF). Automatically compressed and archived in your 201 Medical Folder.
                </p>

                {!leaveForm.medicalCertificate ? (
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-teal-400 bg-white hover:bg-teal-50/50 text-teal-800 font-bold text-xs cursor-pointer transition">
                    <Upload className="h-4 w-4 text-teal-600" />
                    <span>{uploadingMedCert ? 'Compressing Medical Certificate...' : 'Upload Medical Certificate (JPG, PNG, PDF)'}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleMedicalCertificateUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white border border-teal-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-4 w-4 text-teal-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-slate-900 truncate">{leaveForm.medicalCertificate.name}</div>
                        <div className="text-[10px] text-teal-700 font-mono">
                          Compressed ({leaveForm.medicalCertificate.Savings || 'Optimized'}) · Ready for HR &amp; 201 File
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(leaveForm.medicalCertificate)}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeaveForm(prev => ({ ...prev, medicalCertificate: null }))}
                        className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason / Medical Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Fever / clinic consultation with attached medical certificate, annual vacation, family emergency"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setEditingFormId(null);
                  setShowLeaveModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!leaveForm.reason.trim()) {
                    alert('Please enter a reason for the leave application.');
                    return;
                  }
                  if (editingFormId) {
                    updateLeaveRequest(editingFormId, {
                      type: leaveForm.type,
                      startDate: leaveForm.startDate,
                      endDate: leaveForm.endDate,
                      days: Number(leaveForm.days) || 1,
                      reason: leaveForm.reason,
                      medicalCertificate: leaveForm.medicalCertificate || null
                    });
                  } else {
                    fileLeaveRequest({
                      staffId: currentStaff.id,
                      staffName: formatStaffName(currentStaff),
                      employeeId: currentStaff.employeeId,
                      type: leaveForm.type,
                      startDate: leaveForm.startDate,
                      endDate: leaveForm.endDate,
                      days: Number(leaveForm.days) || 1,
                      reason: leaveForm.reason,
                      medicalCertificate: leaveForm.medicalCertificate || null
                    });
                  }
                  setEditingFormId(null);
                  setShowLeaveModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                {editingFormId ? 'Save Live Form Update' : 'Submit Application to HR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Offset Timekeeper Request Form */}
      {showOffsetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-indigo-600" />
                  {editingFormId ? 'Update Offset Timekeeper Form (Live)' : 'Offset Timekeeper Request Form'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Request schedule hour offsetting or 6-punch timekeeper log adjustment
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingFormId(null);
                  setShowOffsetModal(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs leading-relaxed">
              💡 <strong>Offset Timekeeper Policy:</strong> Staff may file an offset request to apply extra rendered hours toward tardiness/undertime or correct missing biometric punches (Time-In, Lunch Out/In, Break Out/In, Time-Out) subject to HR verification.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!offsetForm.reason.trim()) return;
                if (editingFormId) {
                  updateOffsetRequest(editingFormId, {
                    ...offsetForm,
                    hours: Number(offsetForm.hours) || 1
                  });
                } else {
                  fileOffsetRequest({
                    staffId: currentStaff?.id,
                    staffName: formatStaffName(currentStaff),
                    employeeId: currentStaff?.employeeId,
                    ...offsetForm,
                    hours: Number(offsetForm.hours) || 1
                  });
                }
                setEditingFormId(null);
                setShowOffsetModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="text-slate-700 font-bold block mb-1">Offset / Timekeeper Request Type</label>
                <select
                  value={offsetForm.requestType}
                  onChange={(e) => setOffsetForm({ ...offsetForm, requestType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="Schedule Offset (Extra Hours to Offset Late/Undertime)">Schedule Offset (Extra Hours to Offset Late/Undertime)</option>
                  <option value="Timekeeper 6-Punch Log Adjustment / Missed Punch">Timekeeper 6-Punch Log Adjustment / Missed Punch</option>
                  <option value="Rest Day / Weekend Duty Offset">Rest Day / Weekend Duty Offset</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Rendered / Log Date</label>
                  <input
                    type="date"
                    required
                    value={offsetForm.sourceDate}
                    onChange={(e) => setOffsetForm({ ...offsetForm, sourceDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Target Offset Date</label>
                  <input
                    type="date"
                    required
                    value={offsetForm.targetOffsetDate}
                    onChange={(e) => setOffsetForm({ ...offsetForm, targetOffsetDate: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Offset Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.5"
                    required
                    value={offsetForm.hours}
                    onChange={(e) => setOffsetForm({ ...offsetForm, hours: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono font-bold text-center text-xs"
                  />
                </div>
              </div>

              {/* 6-Punch Timekeeper Verification Fields */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Timekeeper 6-Point Punch Record (For Log Verification)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">1. Time-In</label>
                    <input
                      type="text"
                      value={offsetForm.timeIn}
                      onChange={(e) => setOffsetForm({ ...offsetForm, timeIn: e.target.value })}
                      placeholder="08:00 AM"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">2. Lunch Out</label>
                    <input
                      type="text"
                      value={offsetForm.lunchOut}
                      onChange={(e) => setOffsetForm({ ...offsetForm, lunchOut: e.target.value })}
                      placeholder="12:00 PM"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">3. Lunch In</label>
                    <input
                      type="text"
                      value={offsetForm.lunchIn}
                      onChange={(e) => setOffsetForm({ ...offsetForm, lunchIn: e.target.value })}
                      placeholder="01:00 PM"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">4. Break Out</label>
                    <input
                      type="text"
                      value={offsetForm.breakOut}
                      onChange={(e) => setOffsetForm({ ...offsetForm, breakOut: e.target.value })}
                      placeholder="03:00 PM"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">5. Break In</label>
                    <input
                      type="text"
                      value={offsetForm.breakIn}
                      onChange={(e) => setOffsetForm({ ...offsetForm, breakIn: e.target.value })}
                      placeholder="03:15 PM"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">6. Time-Out</label>
                    <input
                      type="text"
                      value={offsetForm.timeOut}
                      onChange={(e) => setOffsetForm({ ...offsetForm, timeOut: e.target.value })}
                      placeholder="05:00 PM"
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Timekeeper Justification / Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain the extra hours rendered or reason for timekeeper offset..."
                  value={offsetForm.reason}
                  onChange={(e) => setOffsetForm({ ...offsetForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFormId(null);
                    setShowOffsetModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  {editingFormId ? 'Save Live Offset Update' : 'Submit Offset Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Business (OB) Request Form — Without Clocking In */}
      {showOBModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-sky-600" />
                  {editingFormId ? 'Update Official Business Form (Live)' : 'Official Business (OB) Request Form'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  For external business transactions within business hours without physical kiosk clock-in
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingFormId(null);
                  setShowOBModal(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs leading-relaxed">
              ✓ <strong>No Physical Clock-In Required Upon Approval:</strong> Approved Official Business filings automatically credit your daily attendance log for field work, bank/government errands, supplier visits, or client meetings during business hours.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!obForm.clientOrDestination.trim() || !obForm.purpose.trim()) return;
                if (editingFormId) {
                  updateOfficialBusinessRequest(editingFormId, {
                    ...obForm,
                    noClockInRequired: true
                  });
                } else {
                  fileOfficialBusinessRequest({
                    staffId: currentStaff?.id,
                    staffName: formatStaffName(currentStaff),
                    employeeId: currentStaff?.employeeId,
                    ...obForm,
                    noClockInRequired: true
                  });
                }
                setEditingFormId(null);
                setShowOBModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={obForm.date}
                    onChange={(e) => setObForm({ ...obForm, date: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Start / Departure</label>
                  <input
                    type="text"
                    required
                    value={obForm.departureTime}
                    onChange={(e) => setObForm({ ...obForm, departureTime: e.target.value })}
                    placeholder="08:00 AM"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">End / Return</label>
                  <input
                    type="text"
                    required
                    value={obForm.returnTime}
                    onChange={(e) => setObForm({ ...obForm, returnTime: e.target.value })}
                    placeholder="05:00 PM"
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Business Transaction Category</label>
                <select
                  value={obForm.transactionType}
                  onChange={(e) => setObForm({ ...obForm, transactionType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                >
                  <option value="Client Meeting / Delivery / Field Transaction">Client Meeting / Delivery / Field Transaction</option>
                  <option value="Supplier / Raw Material Procurement">Supplier / Raw Material Procurement</option>
                  <option value="Banking / Government Agency Compliance (BIR, SSS, DOLE, LGU)">Banking / Government Agency Compliance (BIR, SSS, DOLE, LGU)</option>
                  <option value="Direct-to-Site / Branch Inspection">Direct-to-Site / Branch Inspection</option>
                  <option value="Company Seminar / External Training">Company Seminar / External Training</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Client / Agency / Destination Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BDO Corporate Center / Client Warehouse in Quezon City"
                  value={obForm.clientOrDestination}
                  onChange={(e) => setObForm({ ...obForm, clientOrDestination: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Detailed Business Transaction Purpose</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Specify the official business transaction to be completed during business hours..."
                  value={obForm.purpose}
                  onChange={(e) => setObForm({ ...obForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFormId(null);
                    setShowOBModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  {editingFormId ? 'Save Live OB Update' : 'Submit Official Business (OB)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Undertime Request Form */}
      {showUndertimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TimerOff className="h-4 w-4 text-rose-600" />
                  {editingFormId ? 'Update Undertime Request Form (Live)' : 'Undertime Request Form'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Request authorization for early shift departure before scheduled Time-Out
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingFormId(null);
                  setShowUndertimeModal(false);
                }}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs leading-relaxed">
              ⚠️ <strong>Undertime Clearance:</strong> Leaving work prior to the end of your shift requires an approved Undertime Request Form. Unexcused early departure is subject to disciplinary action.
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!undertimeForm.reason.trim()) return;
                if (editingFormId) {
                  updateUndertimeRequest(editingFormId, {
                    ...undertimeForm,
                    undertimeHours: Number(undertimeForm.undertimeHours) || 1
                  });
                } else {
                  fileUndertimeRequest({
                    staffId: currentStaff?.id,
                    staffName: formatStaffName(currentStaff),
                    employeeId: currentStaff?.employeeId,
                    ...undertimeForm,
                    undertimeHours: Number(undertimeForm.undertimeHours) || 1
                  });
                }
                setEditingFormId(null);
                setShowUndertimeModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={undertimeForm.date}
                    onChange={(e) => setUndertimeForm({ ...undertimeForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Undertime Duration (Hours)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="7.5"
                    step="0.5"
                    required
                    value={undertimeForm.undertimeHours}
                    onChange={(e) => setUndertimeForm({ ...undertimeForm, undertimeHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono font-bold text-center text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Scheduled Time-Out</label>
                  <input
                    type="text"
                    required
                    value={undertimeForm.scheduledTimeOut}
                    onChange={(e) => setUndertimeForm({ ...undertimeForm, scheduledTimeOut: e.target.value })}
                    placeholder="05:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Requested Departure Time</label>
                  <input
                    type="text"
                    required
                    value={undertimeForm.requestedTimeOut}
                    onChange={(e) => setUndertimeForm({ ...undertimeForm, requestedTimeOut: e.target.value })}
                    placeholder="03:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Undertime Reason Category</label>
                <select
                  value={undertimeForm.reasonCategory}
                  onChange={(e) => setUndertimeForm({ ...undertimeForm, reasonCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                >
                  <option value="Medical / Clinic Appointment">Medical / Clinic Appointment</option>
                  <option value="Family / Household Emergency">Family / Household Emergency</option>
                  <option value="Personal / Government Errand">Personal / Government Errand</option>
                  <option value="Feeling Unwell / Clinic Advice">Feeling Unwell / Clinic Advice</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Detailed Explanation &amp; Handover</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Provide specific reason for early departure and who will cover your station..."
                  value={undertimeForm.reason}
                  onChange={(e) => setUndertimeForm({ ...undertimeForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFormId(null);
                    setShowUndertimeModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  {editingFormId ? 'Save Live Undertime Update' : 'Submit Undertime Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal for Medical Certificates */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Formal Notice to Explain & HR Call-Out Modal */}
      {activeNoticeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 text-white flex items-center justify-between border-b border-rose-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-600 border border-rose-400 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                    Official Disciplinary Directive · Ref #{activeNoticeReport.id}
                  </span>
                  <h3 className="text-base font-black text-white">
                    Formal Notice to Explain (NTE)
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNoticeReport(null)}
                className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[calc(85vh-120px)] overflow-y-auto">
              
              {/* Directive Call-Out Alert */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-xs uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span>Immediate HR Office Call-Out Required</span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-semibold">
                  You are instructed to report immediately to the HR Office (Admin Bldg, 2nd Floor) to explain and confer regarding an alleged workplace incident.
                </p>
              </div>

              {/* Incident Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Misconduct</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeNoticeReport.categoryLabel}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Incident Date</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeNoticeReport.incidentDate}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Location</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">{activeNoticeReport.location}</span>
                </div>
              </div>

              {/* Official Memo Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  HR Directive &amp; Formal Notification Text
                </label>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {activeNoticeReport.notificationMessage}
                </div>
              </div>

              {/* Acknowledgement Status / Action */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Step 1: Notice Acknowledgement
                  </span>
                  {activeNoticeReport.acknowledgedAt && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Acknowledged on {new Date(activeNoticeReport.acknowledgedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {!activeNoticeReport.acknowledgedAt ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      By clicking below, you confirm receipt of this formal Notice to Explain and acknowledge that you must report to the HR Office.
                    </p>
                    <button
                      type="button"
                      disabled={acknowledgingNotice}
                      onClick={() => {
                        setAcknowledgingNotice(true);
                        acknowledgeMisconductNotice(activeNoticeReport.id, 'Confirmed receipt via employee portal.');
                        setActiveNoticeReport(prev => ({
                          ...prev,
                          acknowledgedAt: new Date().toISOString(),
                          status: 'ACKNOWLEDGED'
                        }));
                        setAcknowledgingNotice(false);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirm &amp; Acknowledge Receipt of Notice</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ You have acknowledged this notice. Please proceed directly to the HR Office.
                  </p>
                )}
              </div>

              {/* Step 2: Written Explanation Submission */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Step 2: Submit Written Explanation (Optional)
                  </span>
                  {activeNoticeReport.explanationSubmittedAt && (
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950 px-2 py-0.5 rounded-full">
                      Submitted on {new Date(activeNoticeReport.explanationSubmittedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {activeNoticeReport.explanationSubmittedAt ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {activeNoticeReport.explanationText}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      You may encode your written statement below before appearing in the HR office:
                    </p>
                    <textarea
                      rows={3}
                      value={staffExplanationText}
                      onChange={(e) => setStaffExplanationText(e.target.value)}
                      placeholder="Write your explanation or statement regarding the alleged incident here..."
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={submittingExplanation || !staffExplanationText.trim()}
                        onClick={() => {
                          if (!staffExplanationText.trim()) return;
                          setSubmittingExplanation(true);
                          submitStaffExplanation(activeNoticeReport.id, staffExplanationText.trim());
                          setActiveNoticeReport(prev => ({
                            ...prev,
                            explanationText: staffExplanationText.trim(),
                            explanationSubmittedAt: new Date().toISOString(),
                            status: 'EXPLANATION_SUBMITTED'
                          }));
                          setSubmittingExplanation(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Written Explanation</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveNoticeReport(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Close Notice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
