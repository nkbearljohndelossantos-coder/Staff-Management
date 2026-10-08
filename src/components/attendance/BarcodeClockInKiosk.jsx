import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Download,
  Bot,
  ArrowDownAZ,
  Stethoscope,
  Briefcase,
  TimerOff,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getOfflineQueue, queueOfflineAction, clearOfflineQueue } from '../../utils/offlineSync';
import { playPunchChime, playErrorBuzz } from '../../utils/audioFeedback';
import { resolveStaffFromScan } from '../../utils/scanResolver';
import { formatStaffName } from '../../utils/staffUtils';
import DocumentPreviewModal from '../staff/DocumentPreviewModal';
import {
  analyzeClockInExcelBuffer,
  evaluateAttendanceRowMetrics,
  exportAnalyzedClockInToExcel,
  generateSampleBiometricExcelBuffer
} from '../../utils/attendanceExcelAgent';

export default function BarcodeClockInKiosk() {
  const {
    staffList,
    departments,
    attendanceLogs,
    clockInOrOut,
    importAnalyzedAttendanceRows,
    leaveRequests = [],
    approveLeaveRequest,
    rejectLeaveRequest,
    overtimeRequests = [],
    fileOvertimeRequest,
    approveOvertimeRequest,
    rejectOvertimeRequest,
    batchApproveOvertimeRequests,
    offsetRequests = [],
    approveOffsetRequest,
    rejectOffsetRequest,
    officialBusinessRequests = [],
    approveOfficialBusinessRequest,
    rejectOfficialBusinessRequest,
    undertimeRequests = [],
    approveUndertimeRequest,
    rejectUndertimeRequest
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('kiosk'); // 'kiosk' | 'excel-agent' | 'approvals'
  const [approvalCategory, setApprovalCategory] = useState('all'); // 'all' | 'leaves' | 'overtime' | 'offset' | 'ob' | 'undertime'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Approved' | 'Rejected'
  const [selectedOtIds, setSelectedOtIds] = useState([]);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlinePunchesCount, setOfflinePunchesCount] = useState(() => getOfflineQueue().length);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Excel Clock-In Upload & Timekeeping Analyzer Agent State
  const excelInputRef = useRef(null);
  const [analyzingExcel, setAnalyzingExcel] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [analyzedRows, setAnalyzedRows] = useState([]);
  const [agentSummary, setAgentSummary] = useState(null);
  const [excelSearchQuery, setExcelSearchQuery] = useState('');
  const [syncSuccessBanner, setSyncSuccessBanner] = useState('');

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
  const [rejectItem, setRejectItem] = useState(null); // { type: 'leave' | 'ot' | 'offset' | 'ob' | 'undertime', id: string, staffName: string }
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
    queue.forEach(item => {
      if (item.barcode) {
        clockInOrOut(item.barcode, item.pin);
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

  // Handle Excel File Upload for Clock-In Analyzer Agent
  const handleExcelClockInUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingExcel(true);
    setUploadedFileName(file.name);
    setSyncSuccessBanner('');
    setActiveSubTab('excel-agent');

    try {
      const buffer = await file.arrayBuffer();
      const result = analyzeClockInExcelBuffer(buffer, staffList, departments);
      setAnalyzedRows(result.rows || []);
      setAgentSummary(result.summary || null);
    } catch (err) {
      console.error('Excel Clock-In Analyzer Agent error:', err);
      alert('Could not parse Excel file. Please upload a valid .xlsx, .xls, or .csv file.');
    } finally {
      setAnalyzingExcel(false);
      e.target.value = '';
    }
  };

  // Load Sample Biometric Clock-In Data into the Agent
  const handleRunSampleBiometricAnalysis = () => {
    setAnalyzingExcel(true);
    setUploadedFileName('NKB_Biometric_ClockIn_Raw_Export.xlsx');
    setSyncSuccessBanner('');
    setActiveSubTab('excel-agent');

    setTimeout(() => {
      const sampleBuf = generateSampleBiometricExcelBuffer(staffList, departments);
      const result = analyzeClockInExcelBuffer(sampleBuf, staffList, departments);
      setAnalyzedRows(result.rows || []);
      setAgentSummary(result.summary || null);
      setAnalyzingExcel(false);
    }, 250);
  };

  // Update a cell in the Analyzed Excel Layout & re-evaluate agent metrics + keep alphabetical A-Z
  const handleUpdateAnalyzedCell = (rowId, field, value) => {
    setAnalyzedRows(prev => {
      const updated = prev.map(row => {
        if (row.id !== rowId) return row;
        const nextRow = { ...row, [field]: value };
        if (['timeIn', 'lunchOut', 'lunchIn', 'breakOut', 'breakIn', 'timeOut'].includes(field)) {
          const metrics = evaluateAttendanceRowMetrics(nextRow);
          return { ...nextRow, ...metrics };
        }
        return nextRow;
      });
      // Re-sort alphabetically A-Z if staffName changed
      updated.sort((a, b) =>
        (a.staffName || '').localeCompare(b.staffName || '', undefined, { sensitivity: 'base' })
      );
      return updated.map((r, idx) => ({ ...r, rowNumber: idx + 1 }));
    });
  };

  const handleSyncAnalyzedToAttendance = () => {
    if (!analyzedRows.length) return;
    const res = importAnalyzedAttendanceRows(analyzedRows);
    if (res?.success) {
      playPunchChime();
      setSyncSuccessBanner(
        `Synced ${res.importedCount} alphabetical 6-punch clock-in records (Time-In, Lunch Out, Lunch In, Break Out, Break In, Time-Out) into Attendance Logs.`
      );
    }
  };

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
      const matched = resolveStaffFromScan(staffList, inputVal);
      playPunchChime();
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
      playPunchChime();
      setScanResult({
        staff: res.staff,
        action: res.action,
        time: res.time,
        success: true
      });
      setInputVal('');
    } else {
      playErrorBuzz();
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
  const pendingOffsetCount = offsetRequests.filter(r => r.status === 'Pending').length;
  const pendingOBCount = officialBusinessRequests.filter(r => r.status === 'Pending').length;
  const pendingUndertimeCount = undertimeRequests.filter(r => r.status === 'Pending').length;
  const totalPending =
    pendingLeavesCount +
    pendingOTCount +
    pendingOffsetCount +
    pendingOBCount +
    pendingUndertimeCount;

  // Filtered lists
  const filteredLeaves = leaveRequests.filter(l => statusFilter === 'all' || l.status === statusFilter);
  const filteredOT = overtimeRequests.filter(o => statusFilter === 'all' || o.status === statusFilter);
  const filteredOffsets = offsetRequests.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const filteredOB = officialBusinessRequests.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const filteredUndertime = undertimeRequests.filter(r => statusFilter === 'all' || r.status === statusFilter);

  const filteredAnalyzedRows = analyzedRows.filter(row => {
    if (!excelSearchQuery.trim()) return true;
    const q = excelSearchQuery.toLowerCase();
    return (
      (row.staffName || '').toLowerCase().includes(q) ||
      (row.employeeId || '').toLowerCase().includes(q) ||
      (row.department || '').toLowerCase().includes(q) ||
      (row.status || '').toLowerCase().includes(q)
    );
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
      staffName: formatStaffName(targetStaff),
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
    const reasonText = rejectRemarks || 'Disapproved by HR Management';
    if (rejectItem.type === 'leave') {
      rejectLeaveRequest(rejectItem.id, reasonText);
    } else if (rejectItem.type === 'ot') {
      rejectOvertimeRequest(rejectItem.id, reasonText);
    } else if (rejectItem.type === 'offset') {
      rejectOffsetRequest(rejectItem.id, reasonText);
    } else if (rejectItem.type === 'ob') {
      rejectOfficialBusinessRequest(rejectItem.id, reasonText);
    } else if (rejectItem.type === 'undertime') {
      rejectUndertimeRequest(rejectItem.id, reasonText);
    }
    setRejectItem(null);
    setRejectRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Clock-In Excel Upload */}
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleExcelClockInUpload}
        className="hidden"
      />
      
      {/* Subtab Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => setActiveSubTab('excel-agent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
              activeSubTab === 'excel-agent'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Clock-In Excel Analyzer Agent (A–Z)</span>
            {analyzedRows.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-black">
                {analyzedRows.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            title="Upload Excel/CSV Clock-In file for the AI Timekeeping Agent to analyze (Time-In, Lunch Out, Lunch In, Break Out, Break In, Time-Out) and sort alphabetically"
          >
            <Upload className="h-3.5 w-3.5 text-emerald-400" />
            <span>Upload Clock-In Excel</span>
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
            <span>HR Request Approvals (Leave / Offset / OB / UT / OT)</span>
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
          {/* Kiosk Hero Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600 animate-ping" />
                  Live Biometric &amp; Barcode Terminal
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Staff Attendance Clock-In Kiosk</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scan badge barcode, enter Employee ID, or upload a Biometric Clock-In Excel file for 6-punch AI analysis
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition"
                >
                  <FileSpreadsheet className="h-4 w-4 text-white" />
                  <div className="text-left">
                    <div className="leading-none">Upload Clock-In Excel</div>
                    <div className="text-[10px] font-normal text-emerald-100 mt-0.5">6-Punch Agent + Alphabetical</div>
                  </div>
                </button>

                {/* Big Digital Clock */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center sm:text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">System Standard Time</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-wider">
                    {currentTime}
                  </span>
                </div>
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
                          {formatStaffName(scanResult.staff)} ({scanResult.staff.employeeId})
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

          {/* Attendance Log Table (with 6-Punch Columns) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                Recent Clock-In Records (6-Punch Timekeeping &amp; Official Business)
              </h3>
              <span className="text-xs text-slate-500">{attendanceLogs.length} total recorded entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Time-In</th>
                    <th className="py-3 px-3">Lunch Out</th>
                    <th className="py-3 px-3">Lunch In</th>
                    <th className="py-3 px-3">Break Out</th>
                    <th className="py-3 px-3">Break In</th>
                    <th className="py-3 px-3">Time-Out</th>
                    <th className="py-3 px-3">Shift Status</th>
                    <th className="py-3 px-3">OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {attendanceLogs.map((log) => {
                    const staff = staffList.find(s => s.id === log.staffId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {staff ? formatStaffName(staff) : (log.staffName || 'Employee')}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{staff?.employeeId || log.employeeId}</div>
                        </td>
                        <td className="py-3 px-3 font-mono">{log.date}</td>
                        <td className="py-3 px-3 font-mono text-slate-900 font-bold">{log.timeIn || '—'}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{log.lunchOut || '12:00 PM'}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{log.lunchIn || '01:00 PM'}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{log.breakOut || '03:00 PM'}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{log.breakIn || '03:15 PM'}</td>
                        <td className="py-3 px-3 font-mono text-slate-800 font-bold">{log.timeOut || 'In Progress'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            (log.status || '').includes('Official Business')
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : (log.status || '').includes('Offset')
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : (log.status || '').includes('Undertime')
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
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
      ) : activeSubTab === 'excel-agent' ? (
        /* Clock-In Excel Upload & AI Timekeeping Analyzer Agent Tab */
        <div className="space-y-5">
          {/* Top Agent Control Header */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-6 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                  <Bot className="h-3.5 w-3.5" />
                  <span>AI Timekeeping Analyzer Agent · 6-Punch Classifier &amp; A–Z Excel Formatter</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Clock-In Excel Upload &amp; Alphabetical Spreadsheet Converter
                </h2>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Upload any raw biometric or attendance Excel/CSV file. The Timekeeping Agent automatically extracts and analyzes{' '}
                  <strong className="text-emerald-300">Time-In, Lunch Out, Lunch In, Break Out, Break In, and Time-Out</strong>, computes net hours/tardiness/undertime, and converts the sheet into an <strong className="text-emerald-300">Alphabetical (A–Z) Excel Layout</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg transition"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Clock-In Excel (.xlsx / .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunSampleBiometricAnalysis}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Analyze Sample Biometric Sheet</span>
                </button>
              </div>
            </div>
          </div>

          {syncSuccessBanner && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{syncSuccessBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncSuccessBanner('')}
                className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {analyzingExcel ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
              <Bot className="h-10 w-10 text-emerald-600 mx-auto animate-bounce" />
              <div className="text-sm font-black text-slate-900">
                Timekeeping Agent Analyzing 6-Punch Clock-In File...
              </div>
              <p className="text-xs text-slate-500">
                Classifying Time-In, Lunch Out, Lunch In, Break Out, Break In, Time-Out and sorting records alphabetically (A–Z)...
              </p>
            </div>
          ) : analyzedRows.length === 0 ? (
            <div className="p-10 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900">
                  Upload a Clock-In Excel File to Start Agent Analysis
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Supports both structured 6-column spreadsheets and raw biometric punch logs. After analysis, records are automatically converted into an alphabetical Excel layout (`LASTNAME, FIRSTNAME`).
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm transition"
                >
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Select Excel / CSV File</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunSampleBiometricAnalysis}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Bot className="h-4 w-4 text-emerald-700" />
                  <span>Demo Agent with Active Staff Roster</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Agent Analysis Diagnostics Summary */}
              {agentSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Analyzed Records
                    </span>
                    <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                      {analyzedRows.length}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                      <ArrowDownAZ className="h-3 w-3" /> Sorted A–Z Alphabetical
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Complete 6-Punch / On-Time
                    </span>
                    <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                      {analyzedRows.filter(r => r.status === 'Present (Complete)').length}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Verified full shift</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      Late / Extended Lunch-Break
                    </span>
                    <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">
                      {analyzedRows.filter(r => r.lateMinutes > 0 || r.lunchMinutes > 65 || r.breakMinutes > 20).length}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Flagged by Timekeeper Agent</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Undertime / Missing Punch
                    </span>
                    <div className="text-2xl font-black text-rose-600 font-mono mt-0.5">
                      {analyzedRows.filter(r => r.undertimeHours > 0 || (r.status || '').includes('Missing')).length}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Requires UT / Offset check</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                      Overtime Candidates
                    </span>
                    <div className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                      {analyzedRows.filter(r => r.otHours > 0).length}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Post-5:00 PM punches</span>
                  </div>
                </div>
              )}

              {/* Excel Layout Toolbar */}
              <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-sm">
                {/* Excel Ribbon Header */}
                <div className="p-4 bg-emerald-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black tracking-wide">
                          EXCEL SPREADSHEET LAYOUT — ALPHABETICAL (A–Z)
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-700 text-emerald-100 text-[10px] font-mono font-bold">
                          {uploadedFileName || 'Analyzed_Sheet.xlsx'}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200">
                        Columns: Time-In · Lunch Out · Lunch In · Break Out · Break In · Time-Out (Click any time cell to edit)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={excelSearchQuery}
                        onChange={(e) => setExcelSearchQuery(e.target.value)}
                        placeholder="Filter alphabetical sheet..."
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs text-white placeholder-emerald-400 outline-none focus:border-emerald-300"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => exportAnalyzedClockInToExcel(analyzedRows)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Download Alphabetical Excel (.xlsx)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncAnalyzedToAttendance}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                      <span>Sync to Attendance Logs</span>
                    </button>
                  </div>
                </div>

                {/* Authentic Excel Grid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      {/* Excel Column Letters Row (A - M) */}
                      <tr className="bg-slate-200 text-slate-600 font-mono text-[10px] font-bold text-center select-none border-b border-slate-300">
                        <th className="py-1 px-2 border-r border-slate-300 w-10 bg-slate-300/80">#</th>
                        <th className="py-1 px-3 border-r border-slate-300">A</th>
                        <th className="py-1 px-3 border-r border-slate-300">B</th>
                        <th className="py-1 px-3 border-r border-slate-300">C</th>
                        <th className="py-1 px-3 border-r border-slate-300">D</th>
                        <th className="py-1 px-3 border-r border-slate-300">E</th>
                        <th className="py-1 px-3 border-r border-slate-300">F</th>
                        <th className="py-1 px-3 border-r border-slate-300">G</th>
                        <th className="py-1 px-3 border-r border-slate-300">H</th>
                        <th className="py-1 px-3 border-r border-slate-300">I</th>
                        <th className="py-1 px-3 border-r border-slate-300">J</th>
                        <th className="py-1 px-3 border-r border-slate-300">K</th>
                        <th className="py-1 px-3">L</th>
                      </tr>
                      {/* Field Header Row */}
                      <tr className="bg-emerald-50/90 text-emerald-950 font-black text-[10px] uppercase tracking-wider border-b-2 border-emerald-600">
                        <th className="py-2.5 px-2 border-r border-slate-300 text-center bg-slate-100 text-slate-500">Row</th>
                        <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">
                          <div className="flex items-center gap-1">
                            <span>Employee Name (A–Z)</span>
                            <ArrowDownAZ className="h-3.5 w-3.5 text-emerald-700" />
                          </div>
                        </th>
                        <th className="py-2.5 px-2.5 border-r border-slate-300">Employee ID</th>
                        <th className="py-2.5 px-2.5 border-r border-slate-300">Department</th>
                        <th className="py-2.5 px-2.5 border-r border-slate-300">Date</th>
                        <th className="py-2.5 px-2 border-r border-slate-300 bg-emerald-100/70">1. Time-In</th>
                        <th className="py-2.5 px-2 border-r border-slate-300 bg-amber-50/80">2. Lunch Out</th>
                        <th className="py-2.5 px-2 border-r border-slate-300 bg-amber-50/80">3. Lunch In</th>
                        <th className="py-2.5 px-2 border-r border-slate-300 bg-sky-50/80">4. Break Out</th>
                        <th className="py-2.5 px-2 border-r border-slate-300 bg-sky-50/80">5. Break In</th>
                        <th className="py-2.5 px-2 border-r border-slate-300 bg-emerald-100/70">6. Time-Out</th>
                        <th className="py-2.5 px-2.5 border-r border-slate-300 text-center">Net Hrs</th>
                        <th className="py-2.5 px-3 min-w-[210px]">Agent Analysis &amp; Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {filteredAnalyzedRows.map((row, index) => (
                        <tr key={row.id} className="hover:bg-emerald-50/30 transition">
                          <td className="py-1.5 px-2 border-r border-slate-300 bg-slate-100 text-slate-500 font-bold text-center select-none">
                            {index + 1}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-200 font-sans font-bold text-slate-900">
                            {row.staffName}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-600">
                            {row.employeeId}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 font-sans text-slate-600">
                            {row.department}
                          </td>
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-slate-700">
                            {row.date}
                          </td>
                          {/* 6 Editable Punch Cells */}
                          {['timeIn', 'lunchOut', 'lunchIn', 'breakOut', 'breakIn', 'timeOut'].map((slot) => (
                            <td key={slot} className="p-0 border-r border-slate-200">
                              <input
                                type="text"
                                value={row[slot] || ''}
                                onChange={(e) => handleUpdateAnalyzedCell(row.id, slot, e.target.value)}
                                placeholder="—"
                                className={`w-24 px-2 py-1.5 bg-transparent focus:bg-yellow-50 focus:ring-2 focus:ring-emerald-600 outline-none font-mono text-[11px] font-bold ${
                                  !row[slot] ? 'text-rose-500 bg-rose-50/40' : 'text-slate-900'
                                }`}
                              />
                            </td>
                          ))}
                          <td className="py-1.5 px-2.5 border-r border-slate-200 text-center font-bold text-slate-900">
                            {row.totalHours}h
                          </td>
                          <td className="py-1.5 px-3 font-sans">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                row.status === 'Present (Complete)'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (row.status || '').includes('Late') || (row.status || '').includes('Extended')
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {row.status}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate max-w-[180px]" title={row.agentRemarks}>
                                {row.agentRemarks}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* HR Approvals Center: Leave (with Med Cert), Offset Timekeeper, Official Business (OB), Undertime, & Overtime */
        <div className="space-y-5">
          
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pending Leaves</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-black text-amber-600">{pendingLeavesCount}</span>
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Incl. Sick Leave Med Certs</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-indigo-200 shadow-2xs">
              <span className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider">Pending Offset</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-black text-indigo-600">{pendingOffsetCount}</span>
                <RefreshCw className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Timekeeper adjustments</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-sky-200 shadow-2xs">
              <span className="text-[10px] text-sky-700 uppercase font-bold tracking-wider">Official Business</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-black text-sky-600">{pendingOBCount}</span>
                <Briefcase className="h-5 w-5 text-sky-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">No physical clock-in</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-700 uppercase font-bold tracking-wider">Undertime Forms</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-black text-rose-600">{pendingUndertimeCount}</span>
                <TimerOff className="h-5 w-5 text-rose-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Early departure filings</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider">Pending Overtime</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-black text-amber-600">{pendingOTCount}</span>
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Day shift extensions (+30%)</p>
            </div>
          </div>

          {/* Sub-Filters and View Toggle */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Category:
              </span>
              {[
                { id: 'all', label: 'All Requests', count: totalPending },
                { id: 'leaves', label: 'Leaves & Med Certs', count: pendingLeavesCount },
                { id: 'offset', label: 'Offset Timekeeper', count: pendingOffsetCount },
                { id: 'ob', label: 'Official Business (OB)', count: pendingOBCount },
                { id: 'undertime', label: 'Undertime Forms', count: pendingUndertimeCount },
                { id: 'overtime', label: 'Overtime', count: pendingOTCount }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setApprovalCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    approvalCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
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

          {/* 1. Leave Applications Table (with Medical Certificate Preview) */}
          {(approvalCategory === 'all' || approvalCategory === 'leaves') && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-3">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-600" />
                  Employee Leave Requests &amp; Medical Certificates
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
                        <th className="py-3 px-4">Leave Type &amp; Attachment</th>
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
                          <td className="py-3 px-4 space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {req.type}
                            </span>
                            {req.medicalCertificate && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(req.medicalCertificate)}
                                  className="px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                                >
                                  <Stethoscope className="h-3 w-3 text-teal-600" />
                                  <span>View Medical Cert</span>
                                </button>
                              </div>
                            )}
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
                            <div className="flex items-center justify-end gap-1.5">
                              {req.status !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => approveLeaveRequest(req.id, 'Approved for payroll entry')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {req.status !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => setRejectItem({ type: 'leave', id: req.id, staffName: req.staffName })}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. Offset Timekeeper Requests Table */}
          {(approvalCategory === 'all' || approvalCategory === 'offset') && (
            <div className="rounded-2xl border border-indigo-200 bg-white overflow-hidden shadow-sm space-y-3">
              <div className="p-4 border-b border-indigo-100 bg-indigo-50/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-indigo-600" />
                    Offset Timekeeper Requests (Schedule Offset &amp; 6-Punch Adjustments)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Approving automatically updates the staff member&apos;s 6-punch attendance record live
                  </p>
                </div>
                <span className="text-xs text-indigo-700 font-bold">{filteredOffsets.length} records</span>
              </div>

              {filteredOffsets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No offset timekeeper requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-3">Request Type</th>
                        <th className="py-3 px-3">Dates &amp; Offset Hrs</th>
                        <th className="py-3 px-3">6-Punch Verification</th>
                        <th className="py-3 px-3">Justification</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">HR Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredOffsets.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{req.staffName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{req.employeeId}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {req.requestType}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-slate-900">
                              {req.sourceDate || req.earnedDate} → {req.targetOffsetDate || req.offsetDate}
                            </div>
                            <span className="text-[11px] text-indigo-700 font-bold">{req.hours} Hour(s) Offset</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[10px] text-slate-600">
                            <div>In: {req.timeIn || '08:00 AM'} | Out: {req.timeOut || '05:00 PM'}</div>
                            <div>Lunch: {req.lunchOut || '12:00 PM'}–{req.lunchIn || '01:00 PM'} | Brk: {req.breakOut || '03:00 PM'}–{req.breakIn || '03:15 PM'}</div>
                          </td>
                          <td className="py-3 px-3 max-w-xs truncate text-slate-600" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : req.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {req.status !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => approveOffsetRequest(req.id, 'Approved & synced to timekeeper logs')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {req.status !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => setRejectItem({ type: 'offset', id: req.id, staffName: req.staffName })}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. Official Business (OB) Requests Table — Without Clocking In */}
          {(approvalCategory === 'all' || approvalCategory === 'ob') && (
            <div className="rounded-2xl border border-sky-200 bg-white overflow-hidden shadow-sm space-y-3">
              <div className="p-4 border-b border-sky-100 bg-sky-50/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-sky-950 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-sky-600" />
                    Official Business (OB) Requests — Business Transactions Without Kiosk Clock-In
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Approving credits the employee&apos;s daily shift attendance for external business transactions during business hours
                  </p>
                </div>
                <span className="text-xs text-sky-700 font-bold">{filteredOB.length} records</span>
              </div>

              {filteredOB.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No Official Business (OB) requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-3">Date &amp; Business Hours</th>
                        <th className="py-3 px-3">Client / Destination</th>
                        <th className="py-3 px-3">Transaction Type &amp; Purpose</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">HR Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredOB.map((ob) => (
                        <tr key={ob.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ob.staffName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{ob.employeeId}</div>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-slate-900">{ob.date}</div>
                            <span className="text-[11px] text-sky-700">{ob.departureTime || ob.startTime} – {ob.returnTime || ob.endTime}</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {ob.clientOrDestination || ob.destination}
                            <span className="block text-[10px] text-emerald-700 font-normal">✓ Exempt from Physical Clock-In</span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="text-[10px] font-bold text-sky-800 uppercase">{ob.transactionType}</div>
                            <p className="text-slate-600 truncate" title={ob.purpose}>{ob.purpose}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ob.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : ob.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {ob.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ob.status !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => approveOfficialBusinessRequest(ob.id, 'Approved Official Business — Attendance Credited')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve OB</span>
                                </button>
                              )}
                              {ob.status !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => setRejectItem({ type: 'ob', id: ob.id, staffName: ob.staffName })}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. Undertime Request Forms Table */}
          {(approvalCategory === 'all' || approvalCategory === 'undertime') && (
            <div className="rounded-2xl border border-rose-200 bg-white overflow-hidden shadow-sm space-y-3">
              <div className="p-4 border-b border-rose-100 bg-rose-50/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
                    <TimerOff className="h-4 w-4 text-rose-600" />
                    Employee Undertime Request Forms
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Early shift departure authorizations and undertime hour logs
                  </p>
                </div>
                <span className="text-xs text-rose-700 font-bold">{filteredUndertime.length} records</span>
              </div>

              {filteredUndertime.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No undertime requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-3">Shift Date</th>
                        <th className="py-3 px-3">Departure &amp; Undertime Hrs</th>
                        <th className="py-3 px-3">Reason &amp; Category</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-4 text-right">HR Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredUndertime.map((ut) => (
                        <tr key={ut.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ut.staffName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{ut.employeeId}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {ut.date}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-rose-700">{ut.undertimeHours} hr(s) Undertime</div>
                            <span className="text-[10px] text-slate-500">Out: {ut.requestedTimeOut || ut.departureTime} (Sched: {ut.scheduledTimeOut || ut.scheduledOut})</span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="text-[10px] font-bold text-rose-800 uppercase">{ut.reasonCategory}</div>
                            <p className="text-slate-600 truncate" title={ut.reason}>{ut.reason}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ut.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : ut.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {ut.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ut.status !== 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => approveUndertimeRequest(ut.id, 'Approved Undertime Departure')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve UT</span>
                                </button>
                              )}
                              {ut.status !== 'Rejected' && (
                                <button
                                  type="button"
                                  onClick={() => setRejectItem({ type: 'undertime', id: ut.id, staffName: ut.staffName })}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 5. Overtime Applications Table */}
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
                                <div className="flex items-center justify-end gap-1.5">
                                  {req.status !== 'Approved' && (
                                    <button
                                      type="button"
                                      onClick={() => approveOvertimeRequest(req.id, 'HR Approved with verified operational reason')}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      <span>Approve (HR)</span>
                                    </button>
                                  )}
                                  {req.status !== 'Rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => setRejectItem({ type: 'ot', id: req.id, staffName: req.staffName })}
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  )}
                                </div>
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
                Disapprove Request ({rejectItem.staffName})
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
                placeholder="e.g. Inadequate plant staffing on this date, unverified timekeeper punch, schedule conflict"
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
                <label className="text-slate-700 font-bold block mb-1">Detailed Reason / Operational Justification</label>
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

      {/* Document Preview Modal for Medical Certificates */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

    </div>
  );
}
