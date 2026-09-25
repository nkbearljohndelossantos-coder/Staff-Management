import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  Calendar,
  Check,
  X,
  AlertCircle,
  Sun,
  ShieldCheck,
  Filter,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getOfflineQueue, queueOfflineAction, clearOfflineQueue } from '../../utils/offlineSync';

export default function BarcodeClockInKiosk() {
  const {
    staffList,
    attendanceLogs,
    clockInOrOut,
    leaveRequests = [],
    approveLeaveRequest,
    rejectLeaveRequest,
    overtimeRequests = [],
    fileOvertimeRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    batchApproveOvertimeRequests
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('kiosk'); // 'kiosk' | 'approvals'
  const [approvalCategory, setApprovalCategory] = useState('all'); // 'all' | 'leaves' | 'overtime'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Approved' | 'Rejected'
  const [selectedOtIds, setSelectedOtIds] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePunchesCount, setOfflinePunchesCount] = useState(() => getOfflineQueue().length);
  
  // HR Manual OT Declaration Modal State
  const [showHRFileOTModal, setShowHRFileOTModal] = useState(false);
  const [hrOTForm, setHrOTForm] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 2,
    reasonCategory: 'Urgent Client Delivery / Rush Order',
    reason: '',
    autoApprove: true
  });
  
  // Reject remark modal state
  const [rejectItem, setRejectItem] = useState(null); // { type: 'leave' | 'ot', id: string, staffName: string }
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Kiosk Input States
  const [inputVal, setInputVal] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const syncOfflinePunches = () => {
    const queue = getOfflineQueue();
    if (!queue || queue.length === 0) return;
    let synced = 0;
    queue.forEach(item => {
      if (item.barcode) {
        clockInOrOut(item.barcode, item.pin);
        synced++;
      }
    });
    clearOfflineQueue();
    setOfflinePunchesCount(0);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflinePunches();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueOfflineAction({
        action: 'CLOCK_PUNCH',
        barcode: inputVal.trim(),
        timestamp: new Date().toISOString()
      });
      setOfflinePunchesCount(prev => prev + 1);
      const matched = staffList.find(s => s.barcodeValue === inputVal.trim() || s.employeeId === inputVal.trim());
      setScanResult({
        staff: matched,
        action: 'Offline Queued',
        time: new Date().toLocaleTimeString(),
        message: `Offline Mode: Punch for ${matched ? `${matched.firstName} ${matched.lastName}` : inputVal.trim()} queued locally. Will sync when reconnected.`,
        success: true
      });
      setInputVal('');
      setTimeout(() => setScanResult(null), 5000);
      return;
    }

    const res = clockInOrOut(inputVal.trim());
    if (res.success) {
      setScanResult({
        staff: res.staff,
        action: res.action,
        time: res.time,
        success: true
      });
      setInputVal('');
    } else {
      setScanResult({
        message: res.message,
        success: false
      });
    }

    setTimeout(() => {
      setScanResult(null);
    }, 5000);
  };

  // Approvals counts
  const pendingLeavesCount = leaveRequests.filter(l => l.status === 'Pending').length;
  const pendingOTCount = overtimeRequests.filter(o => o.status === 'Pending').length;
  const totalPending = pendingLeavesCount + pendingOTCount;

  // Filtered lists
  const filteredLeaves = leaveRequests.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    return true;
  });

  const filteredOT = overtimeRequests.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const handleHRSubmitOT = (e) => {
    e.preventDefault();
    const targetStaff = staffList.find(s => s.id === hrOTForm.staffId) || staffList[0];
    if (!targetStaff) return;
    if (!hrOTForm.reason || hrOTForm.reason.trim().length < 5) {
      alert('HR Policy: An official reason/justification is required before declaring overtime.');
      return;
    }
    const newReq = fileOvertimeRequest({
      staffId: targetStaff.id,
      staffName: `${targetStaff.firstName} ${targetStaff.lastName}`,
      employeeId: targetStaff.employeeId,
      date: hrOTForm.date,
      hours: Number(hrOTForm.hours) || 2,
      reasonCategory: hrOTForm.reasonCategory,
      reason: hrOTForm.reason.trim(),
      shift: 'Day Shift Extension (No Night Shift)',
      status: hrOTForm.autoApprove ? 'Approved' : 'Pending',
      reviewedBy: hrOTForm.autoApprove ? 'Genevieve Anne A. JURADO (HR)' : null,
      reviewedAt: hrOTForm.autoApprove ? new Date().toISOString() : null,
      remarks: hrOTForm.autoApprove ? 'Directly authorized by HR desk with verified operational reason' : ''
    });
    if (newReq) {
      setShowHRFileOTModal(false);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectItem) return;
    if (rejectItem.type === 'leave') {
      rejectLeaveRequest(rejectItem.id, rejectRemarks || 'Disapproved by HR');
    } else {
      rejectOvertimeRequest(rejectItem.id, rejectRemarks || 'Disapproved by HR Management');
    }
    setRejectItem(null);
    setRejectRemarks('');
  };

  return (
    <div className="space-y-6">
      
      {/* Subtab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('kiosk')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              activeSubTab === 'kiosk'
                ? 'bg-slate-900 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <ScanLine className="h-4 w-4" />
            <span>Barcode Timekeeping Kiosk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm relative ${
              activeSubTab === 'approvals'
                ? 'bg-slate-900 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Leave &amp; OT Approvals (HR)</span>
            {totalPending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {totalPending}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Network Sync Status Indicator */}
          {isOnline ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <Wifi className="h-3.5 w-3.5 text-emerald-600" />
              <span>Online (Live Sync)</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
              <WifiOff className="h-3.5 w-3.5 text-amber-600" />
              <span>Offline ({offlinePunchesCount} Queued)</span>
            </span>
          )}

          {offlinePunchesCount > 0 && (
            <button
              type="button"
              onClick={syncOfflinePunches}
              className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              title="Flush locally queued clock-ins to attendance ledger"
            >
              <RefreshCw className="h-3 w-3 text-cyan-400" />
              <span>Sync Queue ({offlinePunchesCount})</span>
            </button>
          )}

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Shift Policy: <strong>Day Shift Only (8 AM - 5 PM)</strong> · No Night Shift</span>
          </div>
        </div>
      </div>

      {activeSubTab === 'kiosk' ? (
        <>
          {/* Kiosk Hero Card (Light Theme, Monochrome Icons) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600 animate-ping" />
                  Live Biometric &amp; Barcode Terminal
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Staff Attendance Clock-In Kiosk</h2>
                <p className="text-xs text-slate-500 mt-1">Scan badge barcode or enter Employee ID to register daily shifts and overtime</p>
              </div>

              {/* Big Digital Clock */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">System Standard Time</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-wider">
                  {currentTime}
                </span>
              </div>
            </div>

            {/* Scan Input Section */}
            <div className="pt-6 max-w-2xl mx-auto">
              <form onSubmit={handleScanSubmit} className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ScanLine className="h-6 w-6 text-slate-500 animate-pulse" />
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                    placeholder="Point barcode scanner here or type ID (e.g. NKB-2026-0003 or PRJ-2026-0001)..."
                    className="w-full h-14 pl-14 pr-32 rounded-2xl bg-slate-50 border-2 border-slate-300 text-base sm:text-lg font-mono tracking-wider text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 shadow-inner uppercase"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    Scan <ArrowRight className="h-4 w-4 text-white" />
                  </button>
                </div>

                <p className="text-center text-[11px] text-slate-500">
                  Compatible with USB handheld barcode scanners, wedge scanners, and manual numeric keypad entry.
                </p>
              </form>

              {/* Live Scan Notification Toast */}
              {scanResult && (
                <div className="mt-5 animate-in fade-in slide-in-from-bottom duration-300">
                  {scanResult.success ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 flex items-center gap-4 text-left shadow-sm">
                      <div className="h-12 w-12 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-7 w-7 text-slate-700" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white">
                          CLOCK-{scanResult.action.toUpperCase()} CONFIRMED
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {scanResult.staff.firstName} {scanResult.staff.lastName} ({scanResult.staff.employeeId})
                        </h4>
                        <p className="text-xs text-slate-600">
                          Timestamp: <strong className="text-slate-900 font-mono">{scanResult.time}</strong> · Logged into payroll timesheet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold">
                      {scanResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                Recent Clock-In Records
              </h3>
              <span className="text-xs text-slate-500">{attendanceLogs.length} total recorded entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Clock-In</th>
                    <th className="py-3 px-4">Clock-Out</th>
                    <th className="py-3 px-4">Shift Status</th>
                    <th className="py-3 px-4">Overtime (OT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {attendanceLogs.map((log) => {
                    const staff = staffList.find(s => s.id === log.staffId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {staff ? `${staff.firstName} ${staff.lastName}` : 'Employee'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{staff?.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">{log.date}</td>
                        <td className="py-3 px-4 font-mono text-slate-900 font-bold">{log.timeIn || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-700 font-bold">{log.timeOut || 'In Progress'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {log.otHours > 0 ? `${log.otHours} hrs` : '0 hrs'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Leave & Overtime Approvals Tab (HR / Supervisor Command) */
        <div className="space-y-5">
          
          {/* Stats & Shift Policy Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Leaves</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-amber-600">{pendingLeavesCount}</span>
                <Calendar className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting HR manager endorsement</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Overtime</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-amber-600">{pendingOTCount}</span>
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Day shift extensions (+30% rate)</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Approved Requests</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-emerald-600">
                  {leaveRequests.filter(l => l.status === 'Approved').length + overtimeRequests.filter(o => o.status === 'Approved').length}
                </span>
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Factored into semi-monthly payroll</p>
            </div>
          </div>

          {/* Policy Compliance Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>
                <strong className="font-bold">Mandatory HR Overtime Policy:</strong> Before declaring or rendering overtime, an official request must be submitted to HR stating an operational reason. Only HR-authorized overtime hours are creditable for payroll compensation (+30% per hour).
              </div>
              <div className="text-[11px] text-amber-800">
                Plant Operational Constraint: NKB operates strictly on daytime plant shifts (8:00 AM – 5:00 PM). Authorized overtime extends daytime shift hours; night shift differentials (NSD) are not applicable.
              </div>
            </div>
          </div>

          {/* Sub-Filters and View Toggle */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> View:
              </span>
              <button
                type="button"
                onClick={() => setApprovalCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  approvalCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Applications
              </button>
              <button
                type="button"
                onClick={() => setApprovalCategory('leaves')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  approvalCategory === 'leaves'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Leaves</span>
                {pendingLeavesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                    {pendingLeavesCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setApprovalCategory('overtime')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  approvalCategory === 'overtime'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>Overtime</span>
                {pendingOTCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                    {pendingOTCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
                {['all', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      statusFilter === status
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setHrOTForm({
                    staffId: staffList[0]?.id || '',
                    date: new Date().toISOString().split('T')[0],
                    hours: 2,
                    reasonCategory: 'Urgent Client Delivery / Rush Order',
                    reason: '',
                    autoApprove: true
                  });
                  setShowHRFileOTModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
                <span>+ Declare OT to HR</span>
              </button>
            </div>
          </div>

          {/* Leave Applications Table */}
          {(approvalCategory === 'all' || approvalCategory === 'leaves') && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-3">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  Employee Leave Requests
                </h3>
                <span className="text-xs text-slate-500">{filteredLeaves.length} records</span>
              </div>

              {filteredLeaves.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No leave applications found matching filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Dates &amp; Duration</th>
                        <th className="py-3 px-4">Reason / Notes</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">HR Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredLeaves.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{req.staffName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{req.employeeId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {req.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-900 font-bold">
                              {req.startDate} {req.endDate && req.endDate !== req.startDate ? `to ${req.endDate}` : ''}
                            </div>
                            <span className="text-[11px] text-slate-500">{req.days} Day(s)</span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={req.reason}>
                            {req.reason || 'No remarks stated'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : req.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {req.status}
                            </span>
                            {req.reviewedBy && (
                              <div className="text-[9px] text-slate-400 mt-0.5">
                                by {req.reviewedBy}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => approveLeaveRequest(req.id, 'Approved for payroll entry')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                  title="Approve Leave"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectItem({ type: 'leave', id: req.id, staffName: req.staffName })}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Disapprove Leave"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Evaluation Final</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Overtime Applications Table */}
          {(approvalCategory === 'all' || approvalCategory === 'overtime') && (() => {
            const pendingOT = filteredOT.filter(o => o.status === 'Pending');
            const todayStr = new Date().toISOString().split('T')[0];

            return (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-3">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-600" />
                      Employee Overtime Applications &amp; HR Authorizations
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mandatory: Overtime must be pre-requested to HR with reason before declaration and payroll credit
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOtIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          batchApproveOvertimeRequests(selectedOtIds, 'HR Batch Approved with verified operational reason');
                          setSelectedOtIds([]);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Batch Approve Selected ({selectedOtIds.length})</span>
                      </button>
                    )}
                    <span className="text-xs text-slate-500">{filteredOT.length} records</span>
                  </div>
                </div>

                {filteredOT.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No overtime applications found matching filter.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3 w-8">
                            <input
                              type="checkbox"
                              checked={pendingOT.length > 0 && selectedOtIds.length === pendingOT.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOtIds(pendingOT.map(req => req.id));
                                } else {
                                  setSelectedOtIds([]);
                                }
                              }}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                              title="Select all pending for batch approval"
                            />
                          </th>
                          <th className="py-3 px-3">Employee</th>
                          <th className="py-3 px-3">Shift &amp; Date</th>
                          <th className="py-3 px-3">OT Hours (@ +30%)</th>
                          <th className="py-3 px-3">Reason / Operational Justification (Required)</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">HR Clearance Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredOT.map((req) => {
                          const isRetro = req.isRetroactive || (req.date && req.date < todayStr);
                          const isFatigueAlert = Number(req.hours) > 4;

                          return (
                            <tr key={req.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-3">
                                {req.status === 'Pending' ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedOtIds.includes(req.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedOtIds(prev => [...prev, req.id]);
                                      } else {
                                        setSelectedOtIds(prev => prev.filter(id => id !== req.id));
                                      }
                                    }}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                                  />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900">{req.staffName}</div>
                                <div className="text-[10px] font-mono text-slate-500">{req.employeeId}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono text-slate-900 font-bold">{req.date}</div>
                                <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                                  <Sun className="h-3 w-3" /> Day Extension (No NSD)
                                </span>
                                {isRetro && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 block mt-1 w-fit">
                                    ⚠️ Retroactive Request
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-900 font-bold">
                                <div>{req.hours} Hours</div>
                                {isFatigueAlert && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 block mt-1 w-fit">
                                    ⚠️ &gt;4h DOLE Alert
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 max-w-sm">
                                {req.reasonCategory && (
                                  <span className="text-[10px] font-bold text-slate-800 block uppercase tracking-wider mb-0.5">
                                    {req.reasonCategory}
                                  </span>
                                )}
                                <p className="text-slate-600 text-xs leading-snug" title={req.reason || req.task}>
                                  {req.reason || req.task || 'Operational plant shift completion'}
                                </p>
                                {req.remarks && (
                                  <p className="text-[10px] text-slate-400 mt-1 italic">
                                    Note: {req.remarks}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  req.status === 'Approved'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : req.status === 'Rejected'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {req.status === 'Approved' ? 'HR Authorized' : req.status === 'Rejected' ? 'HR Disapproved' : 'Pending HR'}
                                </span>
                                {req.reviewedBy && (
                                  <div className="text-[9px] text-slate-400 mt-0.5">
                                    by {req.reviewedBy}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {req.status === 'Pending' ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => approveOvertimeRequest(req.id, 'HR Approved with verified operational reason')}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                      title="Authorize Overtime as HR"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Approve (HR)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRejectItem({ type: 'ot', id: req.id, staffName: req.staffName })}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                      title="Disapprove Overtime"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-medium">HR Evaluation Final</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      )}

      {/* Reject Remarks Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                Reject {rejectItem.type === 'leave' ? 'Leave' : 'Overtime'} Application
              </h3>
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              State the official HR or supervisor remarks for disapproving this request by <strong>{rejectItem.staffName}</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Remarks / Disapproval Reason</label>
              <textarea
                rows={3}
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="e.g. Inadequate plant staffing on this date, prior leave schedule clash, task postponed"
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Confirm Disapproval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declare / File Overtime to HR Modal */}
      {showHRFileOTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-700" />
                  Declare / File Overtime Authorization (to HR)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Record official pre-approved overtime shift with required operational reason
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHRFileOTModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Mandatory HR Policy Enforcement</span>
              </div>
              <p className="text-[11px] text-amber-900">
                Before declaring an overtime shift, it <strong>must be formally requested to HR with a justifiable reason</strong>. Unapproved overtime is strictly not creditable in attendance or payroll.
              </p>
            </div>

            <form onSubmit={handleHRSubmitOT} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Employee</label>
                <select
                  value={hrOTForm.staffId}
                  onChange={(e) => setHrOTForm({ ...hrOTForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  {staffList.filter(s => s.status === 'active').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.employeeId}) · {s.salaryRateType === 'daily' ? 'Daily Rate' : 'Monthly Rate'}
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
                    value={hrOTForm.date}
                    onChange={(e) => setHrOTForm({ ...hrOTForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">OT Hours (@ +30%)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max="8"
                    required
                    value={hrOTForm.hours}
                    onChange={(e) => setHrOTForm({ ...hrOTForm, hours: e.target.value })}
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
                  value={hrOTForm.reasonCategory}
                  onChange={(e) => setHrOTForm({ ...hrOTForm, reasonCategory: e.target.value })}
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
                  placeholder="State the clear, concrete reason why this overtime is necessary..."
                  value={hrOTForm.reason}
                  onChange={(e) => setHrOTForm({ ...hrOTForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Immediate HR Endorsement</span>
                  <span className="text-[10px] text-slate-500">Approve immediately and credit directly for payroll computation</span>
                </div>
                <input
                  type="checkbox"
                  checked={hrOTForm.autoApprove}
                  onChange={(e) => setHrOTForm({ ...hrOTForm, autoApprove: e.target.checked })}
                  className="h-4 w-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowHRFileOTModal(false)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5 text-white" />
                  <span>{hrOTForm.autoApprove ? 'Authorize & Credit Overtime' : 'Submit Overtime Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
