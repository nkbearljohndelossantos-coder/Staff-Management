import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Banknote, 
  CreditCard, 
  ShieldCheck, 
  Store, 
  Calculator, 
  Calendar, 
  UserCheck, 
  X, 
  Coins, 
  Layers, 
  RefreshCw, 
  ArrowRight,
  Receipt,
  Clock,
  Sparkles,
  Award,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import { playSuccessChime, playErrorBuzz } from '../../utils/audioFeedback';

const DENOMINATIONS = [
  { label: '₱1,000 Bill', value: 1000, type: 'bill' },
  { label: '₱500 Bill', value: 500, type: 'bill' },
  { label: '₱200 Bill', value: 200, type: 'bill' },
  { label: '₱100 Bill', value: 100, type: 'bill' },
  { label: '₱50 Bill', value: 50, type: 'bill' },
  { label: '₱20 Bill / Coin', value: 20, type: 'bill' },
  { label: '₱10 Coin', value: 10, type: 'coin' },
  { label: '₱5 Coin', value: 5, type: 'coin' },
  { label: '₱1 Coin', value: 1, type: 'coin' },
  { label: '25¢ Centavos', value: 0.25, type: 'coin' }
];

export default function CanteenZReadingModal({ onClose, defaultDate }) {
  useEscapeKey('canteen-z-reading-modal', ESCAPE_PRIORITY.MODAL, true, onClose);

  const { 
    canteenReceipts = [], 
    canteenVoidLogs = [], 
    canteenZReadings = [], 
    saveZReading, 
    currentUser,
    staffList = []
  } = useApp();

  // Selected Shift Date (defaults to today or defaultDate)
  const [selectedDate, setSelectedDate] = useState(() => {
    return defaultDate || new Date().toISOString().split('T')[0];
  });

  const [shiftPeriod, setShiftPeriod] = useState('Full Day (All Hours)');
  const [cashierName, setCashierName] = useState(() => currentUser?.name || 'Glen Nobleza');
  const [registerId] = useState('REG-01 (Main Kiosk)');
  const [notes, setNotes] = useState('');

  // Cash Float & Interactive Denominations
  const [startingFloat, setStartingFloat] = useState(2000);
  const [cashCounts, setCashCounts] = useState({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
    0.25: 0
  });

  // Print Mode State
  const [showThermalPreview, setShowThermalPreview] = useState(false);
  const [thermalPaperWidth, setThermalPaperWidth] = useState('80mm');
  const [isSaved, setIsSaved] = useState(false);

  // Filter receipts for the selected shift date
  const shiftReceipts = useMemo(() => {
    return canteenReceipts.filter(r => {
      const isLate = !!r.isLateEncoded;
      const claimed = r.claimedDate || (isLate ? r.date : null);
      const effectiveDateStr = isLate && claimed 
        ? claimed.split('T')[0] 
        : (r.date || r.actualEncodedAt || '').split('T')[0];
      return effectiveDateStr === selectedDate;
    });
  }, [canteenReceipts, selectedDate]);

  // Receipts Breakdown
  const completedReceipts = useMemo(() => shiftReceipts.filter(r => r.status !== 'VOIDED'), [shiftReceipts]);
  const voidedReceipts = useMemo(() => shiftReceipts.filter(r => r.status === 'VOIDED'), [shiftReceipts]);

  // Financial Computations
  const grossSales = useMemo(() => {
    return completedReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [completedReceipts]);

  const totalVoidAmount = useMemo(() => {
    return voidedReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [voidedReceipts]);

  const netSales = grossSales; // Voids are already excluded from completed

  // Tender Breakdown
  const cashSalesReceipts = useMemo(() => completedReceipts.filter(r => r.paymentMethod === 'Cash'), [completedReceipts]);
  const salaryDedReceipts = useMemo(() => completedReceipts.filter(r => r.paymentMethod === 'Salary Deduction'), [completedReceipts]);

  const totalCashSales = useMemo(() => {
    return cashSalesReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [cashSalesReceipts]);

  const totalSalaryDeductions = useMemo(() => {
    return salaryDedReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  }, [salaryDedReceipts]);

  const transactionCount = completedReceipts.length;
  const avgTicket = transactionCount > 0 ? (netSales / transactionCount) : 0;

  // Expected Cash in Drawer = Starting Float + Cash Sales
  const expectedCashInDrawer = startingFloat + totalCashSales;

  // Actual Counted Cash from Denominations
  const actualCountedCash = useMemo(() => {
    return Object.entries(cashCounts).reduce((sum, [denom, count]) => {
      return sum + (parseFloat(denom) * (parseInt(count, 10) || 0));
    }, 0);
  }, [cashCounts]);

  // Cash Drawer Variance: Actual - Expected
  const cashVariance = actualCountedCash - expectedCashInDrawer;

  // Top 10 Selling Products & Categories for this shift
  const { topProducts, categorySales } = useMemo(() => {
    const itemMap = {};
    const catMap = {};

    completedReceipts.forEach(r => {
      (r.items || []).forEach(it => {
        const key = it.barcode || it.name;
        if (!itemMap[key]) {
          itemMap[key] = {
            name: it.name,
            barcode: it.barcode,
            quantity: 0,
            revenue: 0,
            unitPrice: it.unitPrice
          };
        }
        itemMap[key].quantity += (it.quantity || 1);
        itemMap[key].revenue += ((it.unitPrice || 0) * (it.quantity || 1));

        const cat = it.category || 'General Supplies';
        catMap[cat] = (catMap[cat] || 0) + ((it.unitPrice || 0) * (it.quantity || 1));
      });
    });

    const sortedProducts = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    return { topProducts: sortedProducts, categorySales: catMap };
  }, [completedReceipts]);

  // Audit Range: First and Last receipt
  const sortedReceiptNumbers = useMemo(() => {
    return completedReceipts.map(r => r.receiptNo).sort();
  }, [completedReceipts]);

  const firstReceiptNo = sortedReceiptNumbers[0] || 'N/A';
  const lastReceiptNo = sortedReceiptNumbers[sortedReceiptNumbers.length - 1] || 'N/A';

  // Handle Denomination change
  const handleCountChange = (denom, val) => {
    const clean = Math.max(0, parseInt(val, 10) || 0);
    setCashCounts(prev => ({
      ...prev,
      [denom]: clean
    }));
  };

  // Quick helper: Autofill cash counts to match expected cash exactly
  const handleAutoFillExactCash = () => {
    let remainder = expectedCashInDrawer;
    const newCounts = { 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0, 0.25: 0 };
    
    [1000, 500, 200, 100, 50, 20, 10, 5, 1].forEach(d => {
      if (remainder >= d) {
        const count = Math.floor(remainder / d);
        newCounts[d] = count;
        remainder = Math.round((remainder - (count * d)) * 100) / 100;
      }
    });
    if (remainder >= 0.25) {
      newCounts[0.25] = Math.round(remainder / 0.25);
    }
    setCashCounts(newCounts);
  };

  // Save / Archive Z-Reading
  const handleFinalizeZReading = () => {
    const reportData = {
      date: selectedDate,
      shiftPeriod,
      cashierName,
      registerId,
      startingFloat,
      grossSales,
      voidAmount: totalVoidAmount,
      voidCount: voidedReceipts.length,
      netSales,
      cashSales: totalCashSales,
      salaryDeductions: totalSalaryDeductions,
      transactionCount,
      expectedCashInDrawer,
      actualCountedCash,
      cashVariance,
      cashCounts,
      firstReceiptNo,
      lastReceiptNo,
      notes,
      topProducts: topProducts.slice(0, 5)
    };

    saveZReading(reportData);
    setIsSaved(true);
    playSuccessChime();
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['NKB MANUFACTURING & INDUSTRIAL CORP.'],
      ['CANTEEN & PANTRY DIVISION - DAILY SHIFT Z-READING REPORT'],
      ['Report Date', selectedDate],
      ['Shift Period', shiftPeriod],
      ['Cashier on Duty', cashierName],
      ['Register ID', registerId],
      ['Generated At', new Date().toLocaleString()],
      [''],
      ['FINANCIAL SUMMARY', 'AMOUNT (PHP)'],
      ['Beginning Cash Float', startingFloat.toFixed(2)],
      ['Gross Completed Sales', grossSales.toFixed(2)],
      ['Voided Transactions', totalVoidAmount.toFixed(2)],
      ['Net POS Sales', netSales.toFixed(2)],
      [''],
      ['PAYMENT TENDER BREAKDOWN', 'AMOUNT (PHP)', 'TRANSACTIONS'],
      ['Cash Collected', totalCashSales.toFixed(2), cashSalesReceipts.length],
      ['Salary Deductions (Coop Auto)', totalSalaryDeductions.toFixed(2), salaryDedReceipts.length],
      ['Total Collections', netSales.toFixed(2), transactionCount],
      ['Average Ticket Size', avgTicket.toFixed(2)],
      [''],
      ['CASH DRAWER RECONCILIATION', 'AMOUNT (PHP)'],
      ['Beginning Float', startingFloat.toFixed(2)],
      ['Cash Sales Added', totalCashSales.toFixed(2)],
      ['Expected Cash in Drawer', expectedCashInDrawer.toFixed(2)],
      ['Actual Counted Cash', actualCountedCash.toFixed(2)],
      ['Variance (Over/Short)', cashVariance.toFixed(2)],
      [''],
      ['AUDIT SEQUENCE', 'DETAILS'],
      ['First Receipt No.', firstReceiptNo],
      ['Last Receipt No.', lastReceiptNo],
      ['Total Completed Tickets', transactionCount],
      ['Total Voids', voidedReceipts.length],
      [''],
      ['TOP SELLING MERCHANDISE', 'QTY SOLD', 'REVENUE (PHP)'],
      ...topProducts.map(p => [p.name, p.quantity, p.revenue.toFixed(2)]),
      [''],
      ['CASHIER SIGN-OFF', cashierName],
      ['SUPERVISOR REMARKS', notes || 'None']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(item => `"${item}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NKB_Canteen_ZReading_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden my-auto max-h-[94vh]">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Cashier Shift Closeout · Z-Reading Report
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  {registerId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                NKB Manufacturing &amp; Industrial Corp. · Plant Canteen Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowThermalPreview(!showThermalPreview)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showThermalPreview 
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>{showThermalPreview ? 'View Form' : 'POS Thermal Slip'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Download CSV Spreadsheet for Bookkeeper / Accounting"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Print Official Z-Reading Report"
            >
              <Printer className="h-3.5 w-3.5 text-slate-950" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/60">

          {/* Shift Controls Header Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Reconciliation Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Shift Schedule
              </label>
              <select
                value={shiftPeriod}
                onChange={(e) => setShiftPeriod(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
              >
                <option value="Full Day (All Hours)">Full Day (06:00 - 22:00)</option>
                <option value="Morning Shift">Morning Shift (06:00 - 14:00)</option>
                <option value="Afternoon Shift">Afternoon Shift (14:00 - 22:00)</option>
                <option value="Night Graveyard">Night Graveyard (22:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cashier on Duty
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Starting Cash Float (₱)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={startingFloat}
                onChange={(e) => setStartingFloat(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono text-emerald-700"
              />
            </div>
          </div>

          {/* If Thermal Preview is Toggled On */}
          {showThermalPreview ? (
            <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col items-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase">Thermal Paper Width:</span>
                <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setThermalPaperWidth('80mm')}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                      thermalPaperWidth === '80mm' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400'
                    }`}
                  >
                    80mm (Standard POS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setThermalPaperWidth('58mm')}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                      thermalPaperWidth === '58mm' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400'
                    }`}
                  >
                    58mm (Mobile POS)
                  </button>
                </div>
              </div>

              {/* Thermal Tape Simulation */}
              <div 
                className={`bg-white text-slate-900 p-6 rounded-2xl font-mono text-[11px] shadow-2xl leading-relaxed border border-slate-200 ${
                  thermalPaperWidth === '80mm' ? 'max-w-md w-full' : 'max-w-xs w-full text-[10px]'
                }`}
                style={{ fontFamily: "'Courier New', Courier, monospace" }}
              >
                <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
                  <h4 className="font-black text-sm tracking-tight uppercase">NKB MANUFACTURING</h4>
                  <p className="text-[10px] text-slate-600">CANTEEN &amp; PANTRY SERVICES</p>
                  <p className="text-[10px] text-slate-500">FACILITY 2 CAFETERIA TERMINAL</p>
                  <div className="mt-2 text-xs font-black bg-slate-100 py-1 rounded">
                    *** DAILY Z-READING SLIP ***
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>DATE: {selectedDate}</span>
                    <span>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CASHIER: {cashierName}</span>
                    <span>REG: {registerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PERIOD: {shiftPeriod}</span>
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>GROSS SALES:</span>
                    <span>P{grossSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>LESS VOIDS ({voidedReceipts.length}):</span>
                    <span>-P{totalVoidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs text-slate-950 pt-0.5 border-t border-slate-200">
                    <span>NET SALES:</span>
                    <span>P{netSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                  <div className="font-bold text-[10px] uppercase text-slate-500">TENDER BREAKDOWN:</div>
                  <div className="flex justify-between">
                    <span>CASH ({cashSalesReceipts.length} txns):</span>
                    <span>P{totalCashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SALARY DED ({salaryDedReceipts.length} txns):</span>
                    <span>P{totalSalaryDeductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-0.5 border-t border-slate-200">
                    <span>TOTAL COLLECTIONS:</span>
                    <span>P{netSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
                  <div className="font-bold text-[10px] uppercase text-slate-500">DRAWER RECONCILIATION:</div>
                  <div className="flex justify-between">
                    <span>BEGINNING FLOAT:</span>
                    <span>P{startingFloat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ CASH SALES:</span>
                    <span>P{totalCashSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-0.5 border-t border-slate-200">
                    <span>EXPECTED DRAWER:</span>
                    <span>P{expectedCashInDrawer.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>ACTUAL COUNTED:</span>
                    <span>P{actualCountedCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-slate-300">
                    <span>OVER / (SHORT):</span>
                    <span className={cashVariance === 0 ? 'text-emerald-700' : cashVariance > 0 ? 'text-amber-700' : 'text-red-700'}>
                      {cashVariance >= 0 ? `+P${cashVariance.toFixed(2)}` : `-P${Math.abs(cashVariance).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>START RECEIPT:</span>
                    <span>{firstReceiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>END RECEIPT:</span>
                    <span>{lastReceiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TOTAL COMPLETED TXNS:</span>
                    <span>{transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AVERAGE TICKET:</span>
                    <span>P{avgTicket.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 text-center text-[9px] text-slate-500 space-y-3">
                  <p>*** END OF DAY SHIFT REPORT ***</p>
                  <div className="pt-6 border-t border-slate-300 text-center">
                    <p className="font-bold">{cashierName}</p>
                    <p>Cashier Signature over Printed Name</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Financial KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Gross Sales</span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    ₱{grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    {completedReceipts.length} completed transactions
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Cash Collected</span>
                    <Banknote className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    ₱{totalCashSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    {cashSalesReceipts.length} cash orders in drawer
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Salary Deductions</span>
                    <CreditCard className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-700">
                    ₱{totalSalaryDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    {salaryDedReceipts.length} staff coop payroll deductions
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Voids / Refunds</span>
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600">
                    ₱{totalVoidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    {voidedReceipts.length} supervisor authorized voids
                  </div>
                </div>
              </div>

              {/* Cash Drawer Balancing & Interactive Denomination Counter */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10 text-cyan-400">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base">Physical Cash Drawer Balancing &amp; Denomination Count</h4>
                      <p className="text-xs text-slate-300">
                        Count cash bills and coins in drawer to compute variance against expected collections.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFillExactCash}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Autofill Expected Match</span>
                  </button>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left: Denominations Grid (8 Cols) */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {DENOMINATIONS.map(({ label, value, type }) => {
                        const count = cashCounts[value] || 0;
                        const subtotal = value * count;
                        return (
                          <div 
                            key={value}
                            className={`p-3 rounded-2xl border transition ${
                              count > 0 
                                ? 'bg-cyan-50/50 border-cyan-300 shadow-sm ring-1 ring-cyan-200' 
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-black text-slate-800">{label}</span>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-white text-slate-600 border border-slate-200">
                                {type}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={count === 0 ? '' : count}
                                onChange={(e) => handleCountChange(value, e.target.value)}
                                placeholder="0"
                                className="w-full h-8 px-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center"
                              />
                            </div>
                            <div className="mt-1.5 text-right font-mono text-[11px] font-bold text-slate-600">
                              ₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: value < 1 ? 2 : 0 })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Remarks / Supervisor Notes */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Shift Discrepancy &amp; Handover Notes
                      </label>
                      <textarea
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="State reason for any overage, shortage, change fund replacements, or cashier remarks..."
                        className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                      />
                    </div>
                  </div>

                  {/* Right: Drawer Reconciliation Status Card (4 Cols) */}
                  <div className="lg:col-span-4 bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between border border-slate-800 space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Drawer Balance Summary
                      </h5>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Beginning Float:</span>
                          <span className="font-mono font-bold">₱{startingFloat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>+ Cash Sales Collected:</span>
                          <span className="font-mono font-bold text-emerald-400">₱{totalCashSales.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-sm text-slate-100">
                          <span>Expected Cash in Drawer:</span>
                          <span className="font-mono text-cyan-400">₱{expectedCashInDrawer.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-sm text-white">
                          <span>Actual Counted Cash:</span>
                          <span className="font-mono text-white text-base">₱{actualCountedCash.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Variance Status Pill */}
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                      cashVariance === 0
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : cashVariance > 0
                        ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                        : 'bg-red-950/60 border-red-500/60 text-red-300'
                    }`}>
                      <div className="p-2 rounded-lg bg-white/10 shrink-0">
                        {cashVariance === 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider">
                          {cashVariance === 0
                            ? '✓ BALANCED (Exact Match)'
                            : cashVariance > 0
                            ? `+₱${cashVariance.toFixed(2)} OVERAGE`
                            : `-₱${Math.abs(cashVariance).toFixed(2)} SHORTAGE`}
                        </div>
                        <p className="text-[10px] opacity-80 mt-0.5">
                          {cashVariance === 0
                            ? 'Drawer cash perfectly reconciles with sales records.'
                            : cashVariance > 0
                            ? 'Drawer contains more cash than recorded sales.'
                            : 'Drawer cash is below expected sales amount.'}
                        </p>
                      </div>
                    </div>

                    {/* Finalize Button */}
                    <button
                      type="button"
                      onClick={handleFinalizeZReading}
                      disabled={isSaved}
                      className={`w-full py-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                        isSaved
                          ? 'bg-emerald-500 text-slate-950 cursor-default'
                          : 'bg-white hover:bg-slate-100 text-slate-950'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-slate-950" />
                          <span>Shift Closeout Archived &amp; Saved!</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-slate-950" />
                          <span>Finalize &amp; Archive Shift Z-Reading</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Merchandise Movement & Top 10 Selling Products */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      Merchandise Movement &amp; Top 10 Selling Items
                    </h4>
                    <p className="text-xs text-slate-400">
                      Products sold during {selectedDate} ({shiftPeriod})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                      {topProducts.length} Distinct Products Sold
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                      {transactionCount} Completed Transactions
                    </span>
                  </div>
                </div>

                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No items sold on this date yet. Ring up sales on the POS scanner terminal to populate movement.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3">Barcode</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Qty Sold</th>
                          <th className="py-2.5 px-3 text-right">Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {topProducts.map((p, idx) => (
                          <tr key={p.barcode || idx} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{p.barcode || 'N/A'}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">₱{p.unitPrice?.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono">
                                {p.quantity} pcs
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-600">
                              ₱{p.revenue?.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Audit Trail: First Receipt <strong>{firstReceiptNo}</strong> · Last Receipt <strong>{lastReceiptNo}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer border border-slate-300"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
