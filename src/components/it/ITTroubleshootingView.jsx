import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wrench,
  HardDrive,
  Cpu,
  Volume2,
  ScanBarcode,
  Tv,
  RefreshCw,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Terminal,
  Activity,
  Zap,
  HelpCircle,
  ArrowRight,
  Filter,
  Play
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playScanBeep, playSuccessChime, playErrorBuzz, playVoidTone } from '../../utils/audioFeedback';
import { cleanScanInput, resolveStaffFromScan } from '../../utils/scanResolver';

export default function ITTroubleshootingView() {
  const {
    staffList,
    canteenReceipts,
    canteenInventory,
    canteenDrawer,
    canteenVoidLogs,
    attendanceLogs,
    cashLoans,
    itDiagnosticEvents = [],
    logDiagnosticEvent,
    showToast = () => {}
  } = useApp();

  // --- 1. LOCAL STORAGE TELEMETRY ---
  const storageTelemetry = useMemo(() => {
    let totalBytes = 0;
    const items = [];

    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key) || '';
        // 2 bytes per char for UTF-16
        const bytes = (key.length + value.length) * 2;
        totalBytes += bytes;
        items.push({
          key,
          bytes,
          kb: (bytes / 1024).toFixed(1),
          preview: value.length > 50 ? `${value.slice(0, 50)}...` : value
        });
      }
    }

    items.sort((a, b) => b.bytes - a.bytes);

    const totalKB = (totalBytes / 1024).toFixed(1);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    // Typical browser localStorage quota is ~5MB (5120 KB)
    const quotaPct = Math.min(100, (totalBytes / (5 * 1024 * 1024)) * 100).toFixed(1);

    return {
      totalBytes,
      totalKB,
      totalMB,
      quotaPct,
      items
    };
  }, [canteenReceipts, canteenInventory, canteenDrawer, canteenVoidLogs, attendanceLogs, cashLoans]);

  // --- 2. HARDWARE BARCODE SCANNER TEST SANDBOX ---
  const [scannerInput, setScannerInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState(null);
  const scanTimingsRef = useRef([]);
  const scanInputRef = useRef(null);

  const handleScannerKeyDown = (e) => {
    const now = performance.now();
    scanTimingsRef.current.push(now);

    if (e.key === 'Enter') {
      e.preventDefault();
      const raw = scannerInput.trim();
      const cleaned = cleanScanInput(raw);
      const timings = scanTimingsRef.current;
      const durationMs = timings.length > 1 ? (timings[timings.length - 1] - timings[0]).toFixed(1) : 0;
      const avgInterval = timings.length > 1 ? (durationMs / (timings.length - 1)).toFixed(1) : 0;
      // Hardware barcode scanners send keystrokes extremely rapidly (< 25ms per char)
      const isHardwareScanner = avgInterval < 30 && timings.length > 3;

      // Look up staff or inventory item
      const matchedStaff = resolveStaffFromScan(staffList, cleaned);
      const matchedItem = canteenInventory.find(i => 
        (i.barcode && cleanScanInput(i.barcode) === cleaned) || 
        (i.pieceBarcode && cleanScanInput(i.pieceBarcode) === cleaned)
      );

      setLastScanResult({
        raw,
        cleaned,
        charCount: raw.length,
        durationMs,
        avgInterval,
        isHardwareScanner,
        matchedType: matchedStaff ? 'Staff Member' : matchedItem ? 'Canteen Product' : 'Unregistered Barcode',
        matchedTitle: matchedStaff ? `${matchedStaff.firstName} ${matchedStaff.lastName} (${matchedStaff.employeeId})` : matchedItem ? `${matchedItem.name} (₱${matchedItem.sellingPrice})` : 'No exact record match',
        timestamp: new Date().toLocaleTimeString()
      });

      logDiagnosticEvent?.(
        'INFO',
        `Barcode Gun Sandbox Scan: ${cleaned} (${isHardwareScanner ? 'Hardware Gun' : 'Manual Keyboard'})`,
        { raw, cleaned, durationMs, avgInterval }
      );

      setScannerInput('');
      scanTimingsRef.current = [];
    }
  };

  // --- 3. DUAL DISPLAY BROADCAST CHANNEL TEST ---
  const [broadcastPingStatus, setBroadcastPingStatus] = useState('IDLE'); // 'IDLE' | 'SENDING' | 'SUCCESS' | 'NO_RESPONSE'
  const [broadcastListeners, setBroadcastListeners] = useState(0);

  const handlePingDualDisplay = () => {
    setBroadcastPingStatus('SENDING');
    try {
      const channel = new BroadcastChannel('canteen_dual_display_channel');
      const pingPayload = {
        type: 'PING_REQUEST',
        timestamp: Date.now(),
        sender: 'IT_DIAGNOSTICS'
      };

      let responded = false;
      const onMessage = (evt) => {
        if (evt.data && evt.data.type === 'PONG_RESPONSE') {
          responded = true;
          setBroadcastPingStatus('SUCCESS');
          setBroadcastListeners(prev => prev + 1);
          logDiagnosticEvent?.('INFO', 'Dual Display Broadcast Ping succeeded: Secondary monitor responded.');
          channel.close();
        }
      };

      channel.onmessage = onMessage;
      channel.postMessage(pingPayload);

      setTimeout(() => {
        if (!responded) {
          setBroadcastPingStatus('NO_RESPONSE');
          logDiagnosticEvent?.('WARN', 'Dual Display Broadcast Ping: No secondary monitor window answered.');
          channel.close();
        }
      }, 1500);
    } catch (e) {
      setBroadcastPingStatus('ERROR');
      logDiagnosticEvent?.('ERROR', `BroadcastChannel failed: ${e.message}`);
    }
  };

  // --- 4. REPAIR & SELF-HEALING TOOLS ---
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairReport, setRepairReport] = useState(null);

  const handleScanAndRepairOrphans = () => {
    setIsRepairing(true);
    setTimeout(() => {
      let brokenReceipts = 0;
      let missingStaffReceipts = 0;
      let unlinkedDrawerEntries = 0;

      // 1. Check receipts
      canteenReceipts.forEach(r => {
        if (r.staffId && !staffList.some(s => s.id === r.staffId || s.employeeId === r.staffId)) {
          missingStaffReceipts++;
        }
      });

      // 2. Check drawer transactions
      (canteenDrawer?.transactions || []).forEach(tx => {
        if (tx.receiptNo && !canteenReceipts.some(r => r.receiptNo === tx.receiptNo)) {
          unlinkedDrawerEntries++;
        }
      });

      const report = {
        scannedAt: new Date().toLocaleTimeString(),
        totalReceipts: canteenReceipts.length,
        totalDrawerTx: canteenDrawer?.transactions?.length || 0,
        missingStaffReceipts,
        unlinkedDrawerEntries,
        isHealthy: missingStaffReceipts === 0 && unlinkedDrawerEntries === 0
      };

      setRepairReport(report);
      setIsRepairing(false);
      logDiagnosticEvent?.(
        report.isHealthy ? 'INFO' : 'WARN',
        `Orphan Record Diagnostic: ${report.isHealthy ? 'All records healthy' : `${missingStaffReceipts} missing staff refs, ${unlinkedDrawerEntries} unlinked drawer txs`}`,
        report
      );
    }, 600);
  };

  const handleResetTerminalLocks = () => {
    try {
      localStorage.removeItem('nkb_canteen_terminal_locked');
      localStorage.removeItem('nkb_terminal_supervisor_prompt');
      sessionStorage.clear();
      showToast('POS Terminal & supervisor locks successfully cleared!');
      logDiagnosticEvent?.('INFO', 'IT Admin manually cleared terminal locks and session storage.');
    } catch (e) {
      showToast('Error resetting terminal locks', 'error');
    }
  };

  const handleExportDiagnosticReport = () => {
    const report = {
      system: 'NKB Manufacturing Plant Operations Suite',
      generatedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      windowInner: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio,
      storageTelemetry: {
        totalBytes: storageTelemetry.totalBytes,
        totalKB: storageTelemetry.totalKB,
        quotaPct: `${storageTelemetry.quotaPct}%`,
        itemCount: storageTelemetry.items.length
      },
      counts: {
        staff: staffList.length,
        canteenReceipts: canteenReceipts.length,
        canteenInventory: canteenInventory.length,
        drawerTransactions: canteenDrawer?.transactions?.length || 0,
        attendanceLogs: attendanceLogs.length,
        cashLoans: cashLoans.length,
        voidLogs: canteenVoidLogs.length
      },
      diagnosticLogs: itDiagnosticEvents
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NKB-IT-Diagnostics-Report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logDiagnosticEvent?.('INFO', 'IT System Diagnostic & Health Report exported to JSON.');
  };

  // --- 5. LOG CONSOLE FILTERING ---
  const [logFilter, setLogFilter] = useState('ALL');
  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return itDiagnosticEvents;
    return itDiagnosticEvents.filter(e => e.level === logFilter);
  }, [itDiagnosticEvents, logFilter]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight">IT Troubleshooting &amp; Diagnostics Center</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                Live Subsystems Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time browser storage metrics, barcode gun hardware tester, peripheral audio calibration &amp; state recovery.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportDiagnosticReport}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export System Health Report (JSON)</span>
        </button>
      </div>

      {/* Grid: Storage Telemetry + Hardware Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Storage Telemetry & Quota Meter */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-cyan-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Browser LocalStorage Usage &amp; Quota
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
              {storageTelemetry.totalKB} KB / ~5,120 KB ({storageTelemetry.quotaPct}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  Number(storageTelemetry.quotaPct) > 80
                    ? 'bg-rose-500'
                    : Number(storageTelemetry.quotaPct) > 50
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.max(2, storageTelemetry.quotaPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0% Safe</span>
              <span>50% Moderate</span>
              <span>100% Critical Limit</span>
            </div>
          </div>

          {/* Key Breakdown Table */}
          <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100 text-xs">
            {storageTelemetry.items.map(it => (
              <div key={it.key} className="p-2 flex items-center justify-between hover:bg-slate-50 transition font-mono text-[11px]">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-800 truncate">{it.key}</div>
                  <div className="text-[9px] text-slate-400 truncate">{it.preview}</div>
                </div>
                <span className="font-bold text-slate-600 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                  {it.kb} KB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Barcode Gun Input Sandbox & Keycode Analyzer */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanBarcode className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Barcode Gun Input Sandbox &amp; Decoder
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Hardware HID Wedge Test
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Click into the input box below and scan any physical employee badge or product barcode. 
            The system measures entry burst speed to verify optical gun recognition vs manual typing.
          </p>

          <div className="space-y-2">
            <div className="relative">
              <input
                ref={scanInputRef}
                type="text"
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                onKeyDown={handleScannerKeyDown}
                placeholder="Scan barcode here with USB/Bluetooth scanner and press Enter..."
                className="w-full h-11 px-3.5 pr-20 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 transition"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 uppercase font-bold">
                {scannerInput.length} chars
              </span>
            </div>
          </div>

          {/* Last Scan Decoded Result */}
          {lastScanResult ? (
            <div className="p-3.5 rounded-2xl bg-slate-950 text-white font-mono text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyan-400 font-bold uppercase">Decoded Barcode:</span>
                <span className="text-[9px] text-slate-400">{lastScanResult.timestamp}</span>
              </div>
              <div className="text-base font-black text-amber-300 tracking-wider">
                {lastScanResult.cleaned}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
                <div>
                  <span className="text-slate-500">Scan Duration: </span>
                  <strong>{lastScanResult.durationMs} ms</strong>
                </div>
                <div>
                  <span className="text-slate-500">Avg Char Interval: </span>
                  <strong>{lastScanResult.avgInterval} ms</strong>
                </div>
                <div>
                  <span className="text-slate-500">Hardware Wedge: </span>
                  <span className={`font-bold ${lastScanResult.isHardwareScanner ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {lastScanResult.isHardwareScanner ? '✓ High-Speed Gun' : '⌨️ Manual Entry'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Database Match: </span>
                  <span className="font-bold text-cyan-300 truncate">{lastScanResult.matchedType}</span>
                </div>
              </div>
              <div className="text-[10px] text-emerald-300 bg-emerald-950/60 p-1.5 rounded border border-emerald-800/60 truncate">
                Result: {lastScanResult.matchedTitle}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
              Waiting for barcode scanner input...
            </div>
          )}
        </div>

      </div>

      {/* Grid: Audio Diagnostics + Secondary Monitor + Recovery Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 3: Audio Feedback Calibration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Web Audio Diagnostic
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Verify terminal acoustic chimes used by cashiers and staff clock-in kiosk.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => playScanBeep()}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3 text-cyan-600" />
              <span>Scan (880Hz)</span>
            </button>
            <button
              type="button"
              onClick={() => playSuccessChime()}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3 text-emerald-600" />
              <span>Success Chime</span>
            </button>
            <button
              type="button"
              onClick={() => playErrorBuzz()}
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3 text-rose-600" />
              <span>Error Buzz</span>
            </button>
            <button
              type="button"
              onClick={() => playVoidTone()}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="h-3 w-3 text-amber-600" />
              <span>Void Tone</span>
            </button>
          </div>
        </div>

        {/* Card 4: Secondary Monitor BroadcastChannel Heartbeat */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                Customer Display Sync
              </h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              broadcastPingStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : broadcastPingStatus === 'NO_RESPONSE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {broadcastPingStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tests WebSocket / BroadcastChannel transmission to the secondary customer-facing pole monitor.
          </p>
          <button
            type="button"
            onClick={handlePingDualDisplay}
            disabled={broadcastPingStatus === 'SENDING'}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${broadcastPingStatus === 'SENDING' ? 'animate-spin' : ''}`} />
            <span>Ping Customer Monitor</span>
          </button>
          <div className="text-[10px] text-slate-400 font-mono text-center">
            Active listeners acknowledged: {broadcastListeners}
          </div>
        </div>

        {/* Card 5: Self-Healing & Lock Recovery */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Terminal State Recovery
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Clear hung supervisor prompts, drawer modal freezes, and scan for orphaned database records.
          </p>
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleResetTerminalLocks}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Reset Stuck POS Locks</span>
            </button>
            <button
              type="button"
              onClick={handleScanAndRepairOrphans}
              disabled={isRepairing}
              className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Activity className={`h-3.5 w-3.5 text-purple-600 ${isRepairing ? 'animate-spin' : ''}`} />
              <span>{isRepairing ? 'Scanning Subsystems...' : 'Scan Orphaned Records'}</span>
            </button>
          </div>
          {repairReport && (
            <div className="text-[10px] p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-700">
              {repairReport.isHealthy ? '✓ 0 broken references detected' : `⚠ ${repairReport.missingStaffReceipts} missing staff refs`}
            </div>
          )}
        </div>

      </div>

      {/* Live System Diagnostics Console & Event Tracing Log */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-xl text-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Live IT System Diagnostic Event Trace Console
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
              {filteredLogs.length} events
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {['ALL', 'ERROR', 'WARN', 'INFO'].map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLogFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
                  logFilter === lvl
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Console Log Screen */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-xs">
              No diagnostic events match current filter.
            </div>
          ) : (
            filteredLogs.map(log => {
              const color = log.level === 'ERROR' ? 'text-rose-400 bg-rose-950/20 border-rose-900/30' : log.level === 'WARN' ? 'text-amber-400 bg-amber-950/20 border-amber-900/30' : 'text-slate-300 bg-slate-900/40 border-slate-800/40';
              return (
                <div key={log.id} className={`p-2 rounded-xl border flex items-start gap-2.5 transition ${color}`}>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-300' : log.level === 'WARN' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    [{log.level}]
                  </span>
                  <div className="min-w-0 flex-1 break-words">
                    <span>{log.message}</span>
                    {log.metadata && (
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
