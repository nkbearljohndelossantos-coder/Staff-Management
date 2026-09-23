import React, { useState, useEffect } from 'react';
import { ScanLine, CheckCircle2, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BarcodeClockInKiosk() {
  const { staffList, attendanceLogs, clockInOrOut } = useApp();

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
    const res = clockInOrOut(staff.barcodeValue);
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

  return (
    <div className="space-y-6">
      
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
              {staffList.map((s) => (
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

    </div>
  );
}
