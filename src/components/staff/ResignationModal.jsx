import React, { useState } from 'react';
import {
  X,
  UserMinus,
  FolderArchive,
  Calendar,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Landmark,
  Coins,
  Utensils,
  Paperclip,
  Save
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import { formatStaffName, getStaffUsername } from '../../utils/staffUtils';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export const SEPARATION_TYPES = [
  'Voluntary Resignation',
  'Immediate Resignation',
  'End of Contract',
  'AWOL / Abandonment',
  'Termination for Cause',
  'Retirement',
  'Redundancy / Retrenchment'
];

export const CLEARANCE_STATUSES = [
  'Pending Clearance',
  'Department Cleared',
  'Accounting Cleared',
  'Fully Cleared'
];

export const FINAL_PAY_STATUSES = [
  'Pending Computation',
  'For Release',
  'Released / Settled',
  'On Hold'
];

export const REHIRE_STATUSES = [
  'Eligible for Rehire',
  'Conditional',
  'Not Eligible (Blacklisted)'
];

export function ResignationFilingModal({ isOpen, preselectedStaff, onClose, onSuccess }) {
  const {
    staffList,
    departments,
    positions,
    coopBalances,
    cashLoans,
    canteenLedgerBalances,
    fileStaffResignation
  } = useApp();

  useEscapeKey('resignation-filing-modal', ESCAPE_PRIORITY.MODAL, isOpen, onClose);

  const activeStaffList = staffList.filter(s => s.status !== 'resigned' && !s.isResigned);
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedStaffId, setSelectedStaffId] = useState(preselectedStaff?.id || activeStaffList[0]?.id || '');
  const [separationType, setSeparationType] = useState('Voluntary Resignation');
  const [resignationDate, setResignationDate] = useState(todayStr);
  const [effectiveLastDay, setEffectiveLastDay] = useState(todayStr);
  const [clearanceStatus, setClearanceStatus] = useState('Pending Clearance');
  const [finalPayStatus, setFinalPayStatus] = useState('Pending Computation');
  const [rehireEligibility, setRehireEligibility] = useState('Eligible for Rehire');
  const [reason, setReason] = useState('');
  const [exitInterviewNotes, setExitInterviewNotes] = useState('');
  const [attachment, setAttachment] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedStaffId(preselectedStaff?.id || activeStaffList[0]?.id || '');
      setSeparationType('Voluntary Resignation');
      setResignationDate(todayStr);
      setEffectiveLastDay(todayStr);
      setClearanceStatus('Pending Clearance');
      setFinalPayStatus('Pending Computation');
      setRehireEligibility('Eligible for Rehire');
      setReason('');
      setExitInterviewNotes('');
      setAttachment(null);
    }
  }, [isOpen, preselectedStaff]);

  if (!isOpen) return null;

  const targetStaff = staffList.find(s => s.id === selectedStaffId) || preselectedStaff;
  const dept = departments.find(d => d.id === targetStaff?.departmentId);
  const pos = positions.find(p => p.id === targetStaff?.positionId);
  const coopSavings = targetStaff ? (Number(coopBalances[targetStaff.id]) || 0) : 0;
  const activeLoanBal = targetStaff
    ? cashLoans
        .filter(l => l.staffId === targetStaff.id && l.status === 'Approved')
        .reduce((sum, l) => sum + (Number(l.balanceRemaining) || 0), 0)
    : 0;
  const canteenBal = targetStaff ? (Number(canteenLedgerBalances[targetStaff.id]) || 0) : 0;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({
        name: file.name,
        type: file.type || 'application/pdf',
        size: Math.round(file.size / 1024),
        dataUrl: ev.target?.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetStaff) return;

    const res = fileStaffResignation(targetStaff.id, {
      separationType,
      resignationDate,
      effectiveLastDay,
      clearanceStatus,
      finalPayStatus,
      rehireEligibility,
      reason: reason.trim() || 'Voluntary separation filed with HR',
      exitInterviewNotes: exitInterviewNotes.trim(),
      attachment
    });

    if (res?.success) {
      if (onSuccess) onSuccess(res.record);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <UserMinus className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                File Worker Resignation &amp; Exit Record
              </h3>
              <p className="text-[11px] text-slate-500">
                Archives the employee&apos;s complete employment, financial &amp; 201 records into the Resigned Workers tab
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200 cursor-pointer transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Staff Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Select Employee to File in Resigned Workers Tab
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={Boolean(preselectedStaff)}
              className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-slate-100"
            >
              {activeStaffList.map(s => (
                <option key={s.id} value={s.id}>
                  {formatStaffName(s)} ({s.employeeId}) — @{getStaffUsername(s)}
                </option>
              ))}
            </select>
          </div>

          {/* Live Financial & Employment Snapshot */}
          {targetStaff && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-slate-900 text-xs">{formatStaffName(targetStaff)}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-500">@{getStaffUsername(targetStaff)} &bull; {targetStaff.employeeId}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {pos?.title || 'Staff'} &bull; {dept?.name || 'General'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">COOP Savings</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(coopSavings)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Loan Balance</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(activeLoanBal)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Canteen Ledger</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(canteenBal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Separation Type & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Separation Type</label>
              <select
                value={separationType}
                onChange={(e) => setSeparationType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {SEPARATION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Notice / Filing Date</label>
              <input
                type="date"
                required
                value={resignationDate}
                onChange={(e) => setResignationDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Effective Last Working Day</label>
              <input
                type="date"
                required
                value={effectiveLastDay}
                onChange={(e) => setEffectiveLastDay(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none font-mono"
              />
            </div>
          </div>

          {/* Clearance, Final Pay & Rehire Eligibility */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clearance Status</label>
              <select
                value={clearanceStatus}
                onChange={(e) => setClearanceStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {CLEARANCE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Final Pay / Backpay Status</label>
              <select
                value={finalPayStatus}
                onChange={(e) => setFinalPayStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {FINAL_PAY_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rehire Eligibility</label>
              <select
                value={rehireEligibility}
                onChange={(e) => setRehireEligibility(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {REHIRE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason & Exit Interview Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Resignation / Separation</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Career advancement, relocation, personal/family matters, contract completion..."
              className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Exit Interview &amp; Property Turnover Notes (Optional)</label>
            <textarea
              rows={3}
              value={exitInterviewNotes}
              onChange={(e) => setExitInterviewNotes(e.target.value)}
              placeholder="Record ID badge surrender, uniform/equipment turnover, pending accountabilities, or HR exit interview remarks..."
              className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none resize-none"
            />
          </div>

          {/* Resignation Letter / Clearance Attachment */}
          <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="h-5 w-5 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 block">
                  {attachment ? attachment.name : 'Attach Signed Resignation Letter / Exit Clearance'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {attachment ? `${attachment.size} KB — Automatically filed into 201 Attachments` : 'PDF, JPG, or PNG document (auto-saved to employee 201 files)'}
                </span>
              </div>
            </div>
            <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition">
              <Upload className="h-3.5 w-3.5 text-slate-600" />
              <span>{attachment ? 'Change File' : 'Upload File'}</span>
              <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              <FolderArchive className="h-4 w-4 text-white" />
              File Resignation &amp; Move to Archive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ResignedDossierModal({ staff, onClose, onOpen201Files, onReinstate }) {
  const { updateResignationRecord, coopBalances, cashLoans, canteenLedgerBalances } = useApp();

  useEscapeKey('resigned-dossier-modal', ESCAPE_PRIORITY.MODAL, Boolean(staff), onClose);

  const rec = staff?.resignationRecord || {};
  const [clearanceStatus, setClearanceStatus] = useState(rec.clearanceStatus || 'Pending Clearance');
  const [finalPayStatus, setFinalPayStatus] = useState(rec.finalPayStatus || 'Pending Computation');
  const [rehireEligibility, setRehireEligibility] = useState(rec.rehireEligibility || 'Eligible for Rehire');
  const [exitInterviewNotes, setExitInterviewNotes] = useState(rec.exitInterviewNotes || '');

  if (!staff) return null;

  const snap = rec.financialSnapshot || {};
  const coopBal = snap.coopSavingsBalance !== undefined ? snap.coopSavingsBalance : (Number(coopBalances[staff.id]) || 0);
  const loanBal = snap.outstandingLoanBalance !== undefined
    ? snap.outstandingLoanBalance
    : cashLoans.filter(l => l.staffId === staff.id && l.status === 'Approved').reduce((s, l) => s + (Number(l.balanceRemaining) || 0), 0);
  const canteenBal = snap.canteenDeductionBalance !== undefined ? snap.canteenDeductionBalance : (Number(canteenLedgerBalances[staff.id]) || 0);

  const handleSaveUpdates = () => {
    updateResignationRecord(staff.id, {
      clearanceStatus,
      finalPayStatus,
      rehireEligibility,
      exitInterviewNotes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
              alt={staff.firstName}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-300 bg-white"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">{formatStaffName(staff)}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                  {rec.separationType || 'Resigned'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                @{getStaffUsername(staff)} &bull; {staff.employeeId} &bull; Record #{rec.id || 'ARCHIVED'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200 cursor-pointer transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Employment & Separation Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Date Hired</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{staff.dateHired || staff.hireDate || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Notice Filed</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{rec.resignationDate || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Effective Last Day</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{rec.effectiveLastDay || staff.resignedAt || '—'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">201 Attachments</span>
              <button
                type="button"
                onClick={() => onOpen201Files && onOpen201Files(staff)}
                className="font-bold text-slate-900 underline mt-0.5 inline-flex items-center gap-1 cursor-pointer"
              >
                <Paperclip className="h-3 w-3" />
                {staff.documents?.length || 0} Filed Docs
              </button>
            </div>
          </div>

          {/* Financial Snapshot at Separation */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                Financial &amp; Account Snapshot (Filed Record)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Filed by {rec.filedBy || 'HR Management'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Last Salary Rate</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(snap.salaryRate || staff.salaryRate || staff.baseSalary || 0)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">COOP Share Capital</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(coopBal)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Outstanding Loan</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(loanBal)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold block">Canteen Ledger</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(canteenBal)}</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Recorded Reason for Separation</span>
            <p className="text-slate-900 font-semibold">{rec.reason || 'Voluntary resignation'}</p>
          </div>

          {/* Editable Clearance, Final Pay & Exit Interview Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Clearance Status</label>
              <select
                value={clearanceStatus}
                onChange={(e) => setClearanceStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {CLEARANCE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Final Pay / Backpay Status</label>
              <select
                value={finalPayStatus}
                onChange={(e) => setFinalPayStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {FINAL_PAY_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rehire Eligibility</label>
              <select
                value={rehireEligibility}
                onChange={(e) => setRehireEligibility(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              >
                {REHIRE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Exit Interview &amp; Clearance Remarks</label>
            <textarea
              rows={3}
              value={exitInterviewNotes}
              onChange={(e) => setExitInterviewNotes(e.target.value)}
              placeholder="Update clearance sign-offs, backpay release reference, or exit interview notes..."
              className="w-full p-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onReinstate && onReinstate(staff)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold flex items-center gap-1.5 cursor-pointer transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
            Reinstate to Active Workforce
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold cursor-pointer transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveUpdates}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Save className="h-3.5 w-3.5 text-white" />
              Save Record Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
