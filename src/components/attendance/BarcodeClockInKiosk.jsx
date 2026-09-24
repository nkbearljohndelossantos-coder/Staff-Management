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
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BarcodeClockInKiosk() {
  const {
    staffList,
    attendanceLogs,
    clockInOrOut,
    leaveRequests = [],
    approveLeaveRequest,
    rejectLeaveRequest,
    overtimeRequests = [],
    approveOvertimeRequest,
    rejectOvertimeRequest
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('kiosk'); // 'kiosk' | 'approvals'
  const [approvalCategory, setApprovalCategory] = useState('all'); // 'all' | 'leaves' | 'overtime'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Approved' | 'Rejected'
  
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

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

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

  const handleSimulateScan = (staff) => {
    const res = clockInOrOut(staff.barcodeValue || staff.employeeId);
    if (res.success) {
      setScanResult({
        staff: res.staff,
        action: res.action,
        time: res.time,
        success: true
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

  const handleConfirmReject = () => {
    if (!rejectItem) return;
    if (rejectItem.type === 'leave') {
      rejectLeaveRequest(rejectItem.id, rejectRemarks || 'Disapproved by HR');
    } else {
      rejectOvertimeRequest(rejectItem.id, rejectRemarks || 'Disapproved by Supervisor');
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

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Shift Policy: <strong>Day Shift Only (8 AM - 5 PM)</strong> · No Night Shift</span>
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

              {/* Quick 1-Click Scan Simulator for Demo */}
              <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                  Quick Simulate Badge Scan:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {staffList.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSimulateScan(s)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      {s.firstName} ({s.employeeId})
                    </button>
                  ))}
                </div>
              </div>

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
              <p className="text-[11px] text-slate-400 mt-1">Day shift extensions (125% rate)</p>
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
            <Sun className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Plant Operational Shift Constraint:</strong> All operations at NKB Manufacturing operate strictly on daytime regular shifts (8:00 AM – 5:00 PM). Overtime approvals extend the regular day work shift. <strong>Night shift differential (NSD) calculations are disabled by plant policy.</strong>
            </div>
          </div>

          {/* Sub-Filters and View Toggle */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
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
          {(approvalCategory === 'all' || approvalCategory === 'overtime') && (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm space-y-3">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  Employee Overtime Applications (Day Shift)
                </h3>
                <span className="text-xs text-slate-500">{filteredOT.length} records</span>
              </div>

              {filteredOT.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No overtime applications found matching filter.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Shift &amp; Date</th>
                        <th className="py-3 px-4">OT Hours</th>
                        <th className="py-3 px-4">Reason / Plant Task</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Supervisor Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredOT.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{req.staffName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{req.employeeId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-900 font-bold">{req.date}</div>
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <Sun className="h-3 w-3" /> Day Extension (No NSD)
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                            {req.hours} Hours
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={req.reason}>
                            {req.reason || 'Plant operations completion'}
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
                                  onClick={() => approveOvertimeRequest(req.id, 'Approved for daytime payroll')}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                                  title="Approve Overtime"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
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

    </div>
  );
}
