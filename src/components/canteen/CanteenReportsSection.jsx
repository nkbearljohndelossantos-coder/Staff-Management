import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  TrendingUp, 
  Banknote, 
  CreditCard, 
  ShieldAlert, 
  Boxes, 
  Package, 
  FileSpreadsheet, 
  Calendar, 
  CalendarRange,
  Clock, 
  CheckCircle2, 
  X, 
  Eye, 
  UserCheck, 
  Receipt,
  Store,
  Tag,
  ArrowUpDown,
  RotateCcw,
  Info,
  Calculator
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CanteenZReadingModal from './CanteenZReadingModal';

export default function CanteenReportsSection({ onShowReceipt, onShowGatePass, onShowCanteenPass }) {
  const { 
    canteenReceipts = [], 
    personalPurchaseOrders = [], 
    canteenVoidLogs = [], 
    canteenGatePasses = [], 
    canteenZReadings = [],
    canteenDrawer = { balance: 0, transactions: [] },
    canteenInventory = [],
    staffList = []
  } = useApp();

  // Filters & State
  const [activeTabFilter, setActiveTabFilter] = useState('ALL'); // 'ALL' | 'SALES' | 'SALARY_DEDUCTION' | 'POS' | 'VOIDS' | 'GATE_PASSES' | 'Z_READINGS'
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState(null);
  const [selectedZReadingDate, setSelectedZReadingDate] = useState(null);
  const [showZReadingModal, setShowZReadingModal] = useState(false);

  // Compute unified transactions array with Effective Claimed Date support
  const unifiedTransactions = useMemo(() => {
    const list = [];

    // 1. POS Receipts
    canteenReceipts.forEach(r => {
      const isSalaryDed = r.paymentMethod === 'Salary Deduction';
      const isLate = !!r.isLateEncoded;
      // Core requirement: When it is late encoded, use the date when it was claimed by customer, not actual encoding time
      const claimed = r.claimedDate || r.claimedAt || (isLate ? r.date : null);
      const effectiveDate = isLate && claimed 
        ? claimed 
        : (r.date || r.actualEncodedAt || new Date().toISOString());

      list.push({
        id: r.receiptNo,
        timestamp: r.date || r.actualEncodedAt || new Date().toISOString(),
        effectiveDate,
        isLateEncoded: isLate,
        claimedDate: claimed,
        actualEncodedAt: r.actualEncodedAt || r.date,
        lateReason: r.lateReason || null,
        type: isSalaryDed ? 'Salary Deduction (Coop Auto)' : 'POS Cash Sale',
        category: 'SALE',
        reference: r.receiptNo,
        customerName: r.customerName || 'Walk-in Customer',
        staffId: r.staffId,
        paymentMethod: r.paymentMethod,
        orderType: r.orderType || 'Dine In',
        amount: r.total || 0,
        itemsSummary: r.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'N/A',
        itemsCount: r.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0,
        cashier: r.cashierName || 'Canteen Cashier',
        status: r.status || 'COMPLETED',
        rawRecord: r,
        gatePassNo: r.gatePassNo
      });
    });

    // 2. Personal Purchase Orders (Manufactured Goods)
    personalPurchaseOrders.forEach(po => {
      const isLate = !!po.isLateEncoded;
      const claimed = po.claimedDate || po.claimedAt;
      const effectiveDate = (isLate && claimed) ? claimed : (po.orderDate || new Date().toISOString());

      list.push({
        id: po.id,
        timestamp: po.orderDate || new Date().toISOString(),
        effectiveDate,
        isLateEncoded: isLate,
        claimedDate: claimed || null,
        actualEncodedAt: po.orderDate,
        lateReason: po.lateReason || null,
        type: 'Personal Purchase Order (Mfg)',
        category: 'PO',
        reference: po.poNumber,
        customerName: po.staffName,
        staffId: po.staffId,
        paymentMethod: po.paymentMethod === 'cash' ? 'Cash' : 'Salary Deduction (Coop Auto)',
        orderType: 'Mfg Goods PO',
        amount: po.totalAmount || 0,
        itemsSummary: po.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'N/A',
        itemsCount: po.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0,
        cashier: po.fulfilledBy || 'Canteen Hub',
        status: po.status || 'Fulfilled',
        rawRecord: po
      });
    });

    // 3. Supervisor Voids
    canteenVoidLogs.forEach(v => {
      list.push({
        id: v.id,
        timestamp: v.timestamp,
        effectiveDate: v.timestamp,
        isLateEncoded: false,
        claimedDate: null,
        actualEncodedAt: v.timestamp,
        lateReason: null,
        type: v.type === 'FULL_TRANSACTION_VOID' ? 'Full Order Void' : 'Line Item Void',
        category: 'VOID',
        reference: v.id.slice(-10),
        customerName: 'System Void Audit',
        paymentMethod: 'Reversed',
        orderType: 'Void Record',
        amount: -(v.amount || 0),
        itemsSummary: v.itemName || v.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Voided item',
        itemsCount: v.quantity || v.itemCount || 1,
        cashier: v.voidedBy || 'Supervisor',
        status: 'VOIDED',
        reason: v.reason,
        rawRecord: v
      });
    });

    // 4. Gate Passes
    canteenGatePasses.forEach(gp => {
      const isLate = !!gp.isLateEncoded;
      const claimed = gp.claimedDate;
      const effectiveDate = (isLate && claimed) ? claimed : gp.date;

      list.push({
        id: gp.id,
        timestamp: gp.date,
        effectiveDate,
        isLateEncoded: isLate,
        claimedDate: claimed || null,
        actualEncodedAt: gp.actualEncodedAt || gp.date,
        lateReason: gp.lateReason || null,
        type: 'Grocery Gate Pass',
        category: 'GATE_PASS',
        reference: gp.gatePassNo,
        customerName: gp.staffName,
        staffId: gp.staffId,
        paymentMethod: gp.paymentMethod || 'Cash',
        orderType: 'Grocery Takeout',
        amount: gp.totalAmount || 0,
        itemsSummary: gp.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Grocery Goods',
        itemsCount: gp.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0,
        cashier: gp.issuedBy || 'Gate Issuer',
        status: gp.gateStatus || 'Issued',
        rawRecord: gp
      });
    });

    // Sort by effective claimed date descending
    return list.sort((a, b) => new Date(b.effectiveDate || b.timestamp) - new Date(a.effectiveDate || a.timestamp));
  }, [canteenReceipts, personalPurchaseOrders, canteenVoidLogs, canteenGatePasses]);

  // Date range preset handlers
  const handleApplyPreset = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = now.toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yestStr = yest.toISOString().slice(0, 10);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'WEEK') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(sevenDaysAgo.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === 'MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  const handleCustomStartDateChange = (val) => {
    setStartDate(val);
    setDatePreset('CUSTOM');
  };

  const handleCustomEndDateChange = (val) => {
    setEndDate(val);
    setDatePreset('CUSTOM');
  };

  const handleClearDateRange = () => {
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Filtered List based on Tabs, Date Range (Effective Claim Date), and Search Query
  const filteredList = useMemo(() => {
    return unifiedTransactions.filter(item => {
      // 1. Tab filter
      if (activeTabFilter === 'SALES' && item.category !== 'SALE') return false;
      if (activeTabFilter === 'SALARY_DEDUCTION' && (item.category !== 'SALE' || item.paymentMethod !== 'Salary Deduction')) return false;
      if (activeTabFilter === 'POS' && item.category !== 'PO') return false;
      if (activeTabFilter === 'VOIDS' && item.category !== 'VOID') return false;
      if (activeTabFilter === 'GATE_PASSES' && item.category !== 'GATE_PASS') return false;

      // 2. Date Range Filter:
      // Uses the customer claimed date when late encoded, otherwise standard transaction date
      const effectiveTime = new Date(item.effectiveDate || item.timestamp);
      
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (!isNaN(start.getTime()) && effectiveTime < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999`);
        if (!isNaN(end.getTime()) && effectiveTime > end) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.reference?.toLowerCase().includes(q);
        const matchesCust = item.customerName?.toLowerCase().includes(q);
        const matchesCashier = item.cashier?.toLowerCase().includes(q);
        const matchesItems = item.itemsSummary?.toLowerCase().includes(q);
        const matchesType = item.type?.toLowerCase().includes(q);
        const matchesReason = item.lateReason?.toLowerCase().includes(q);
        return matchesRef || matchesCust || matchesCashier || matchesItems || matchesType || matchesReason;
      }

      return true;
    });
  }, [unifiedTransactions, activeTabFilter, startDate, endDate, searchQuery]);

  // Aggregate Metrics based on the active filtered transactions (responsive to Date Range)
  const metrics = useMemo(() => {
    const validSales = filteredList.filter(r => r.category === 'SALE' && r.status !== 'VOIDED');
    const totalSales = validSales.reduce((acc, r) => acc + (r.amount || 0), 0);
    const cashSales = validSales.filter(r => r.paymentMethod === 'Cash').reduce((acc, r) => acc + (r.amount || 0), 0);
    const salaryDeductions = validSales.filter(r => r.paymentMethod === 'Salary Deduction').reduce((acc, r) => acc + (r.amount || 0), 0);
    const totalItems = validSales.reduce((acc, r) => acc + (r.itemsCount || 0), 0);
    const totalVoids = filteredList.filter(r => r.category === 'VOID').reduce((acc, v) => acc + Math.abs(v.amount || 0), 0);
    const voidsCount = filteredList.filter(r => r.category === 'VOID').length;
    const gatePassesCount = filteredList.filter(r => r.category === 'GATE_PASS').length;

    return {
      totalSales,
      cashSales,
      salaryDeductions,
      totalTransactions: validSales.length,
      totalItems,
      totalVoids,
      voidsCount,
      gatePassesCount
    };
  }, [filteredList]);

  // Export to CSV with full Effective Claim Date and Late Encoding metadata
  const handleExportCSV = () => {
    const headers = [
      'Effective Claim Date',
      'Late Encoded?',
      'Actual Encoding Time',
      'Late Encoding Reason',
      'Reference / No.',
      'Record Type',
      'Customer / Staff Name',
      'Items Summary',
      'Payment Method',
      'Order Nature',
      'Total Amount (PHP)',
      'Cashier / Supervisor',
      'Status'
    ];

    const rows = filteredList.map(item => [
      `"${new Date(item.effectiveDate || item.timestamp).toLocaleDateString()}"`,
      `"${item.isLateEncoded ? 'YES' : 'NO'}"`,
      `"${new Date(item.actualEncodedAt || item.timestamp).toLocaleString()}"`,
      `"${(item.lateReason || '').replace(/"/g, '""')}"`,
      `"${item.reference || ''}"`,
      `"${item.type || ''}"`,
      `"${item.customerName || ''}"`,
      `"${(item.itemsSummary || '').replace(/"/g, '""')}"`,
      `"${item.paymentMethod || ''}"`,
      `"${item.orderType || ''}"`,
      item.amount?.toFixed(2) || '0.00',
      `"${item.cashier || ''}"`,
      `"${item.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateTag = startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `canteen_transaction_report_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Report Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white shadow-inner">
            <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Canteen System Reports &amp; Transaction Ledger
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                Official Audit Log
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Unified financial audit trail: POS sales, Coop auto-settled salary deductions, POs, gate passes, and supervisor voids.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onShowCanteenPass && (
            <button
              type="button"
              onClick={onShowCanteenPass}
              className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
              title="View and print official Canteen Barcode Pass"
            >
              <Store className="h-4 w-4 text-emerald-400" />
              <span>🪪 Canteen Barcode Pass</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setSelectedZReadingDate(null);
              setShowZReadingModal(true);
            }}
            className="h-10 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-2 transition cursor-pointer shadow-md"
            title="Launch Daily Cashier Shift Closeout &amp; Z-Reading"
          >
            <Calculator className="h-4 w-4 text-slate-950" />
            <span>Shift Z-Reading</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            title="Export filtered records to CSV / Excel spreadsheet"
          >
            <Download className="h-4 w-4 text-slate-300" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-md"
            title="Print printable summary ledger"
          >
            <Printer className="h-4 w-4 text-slate-950" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Financial & Audit Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Canteen Sales</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-950">
            ₱{metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {metrics.totalTransactions} completed transactions · {metrics.totalItems} items sold
          </p>
        </div>

        {/* Cash Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Cash Tendered</span>
            <Banknote className="h-4 w-4 text-slate-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-950">
            ₱{metrics.cashSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Cash intake registered at physical counter
          </p>
        </div>

        {/* Salary Deductions (Coop Auto-Paid) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Salary Deductions</span>
            <CreditCard className="h-4 w-4 text-slate-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-950">
            ₱{metrics.salaryDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Auto-Paid via Coop Payroll
          </p>
        </div>

        {/* Supervisor Voids & Gate Passes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Supervisor Voids</span>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-950">
            ₱{metrics.totalVoids.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {metrics.voidsCount} void audits · {metrics.activeGatePassesCount} gate passes issued
          </p>
        </div>
      </div>

      {/* Filter Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Subtab Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTabFilter('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'ALL'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Records ({unifiedTransactions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('SALES')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'SALES'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              POS Sales Receipts ({canteenReceipts.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('SALARY_DEDUCTION')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'SALARY_DEDUCTION'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Salary Deductions (Coop Auto)
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('POS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'POS'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Personal POs ({personalPurchaseOrders.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('VOIDS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'VOIDS'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Supervisor Voids ({canteenVoidLogs.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('GATE_PASSES')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'GATE_PASSES'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Gate Passes ({canteenGatePasses.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTabFilter('Z_READINGS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                activeTabFilter === 'Z_READINGS'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📊 Z-Readings Archive ({canteenZReadings.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ref, customer, item, cashier..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>

        {/* Row 2: Comprehensive Date Range Filter Bar (Effective Claim Date for Late-Encoded Items) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
              <span>Claim Date:</span>
            </span>

            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'TODAY', label: 'Today' },
              { id: 'YESTERDAY', label: 'Yesterday' },
              { id: 'WEEK', label: 'Last 7 Days' },
              { id: 'MONTH', label: 'This Month' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers: From & To */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomStartDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomEndDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearDateRange}
                className="h-8 px-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="Reset Date Range Filter"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* Rule Explanation Banner */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px]">
          <Info className="h-3.5 w-3.5 text-amber-700 shrink-0" />
          <span>
            <strong>Date Range Rule:</strong> Transactions are identified and filtered by the <strong>Customer Claimed Date</strong>. When transactions are late-encoded, the date the customer claimed the goods is used rather than the actual system encoding timestamp.
          </span>
        </div>

      </div>

      {/* Main Ledger Table or Z-Readings Archive */}
      {activeTabFilter === 'Z_READINGS' ? (
        <div id="printable-report-table" className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-cyan-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cashier Shift Z-Readings Closeout Archive ({canteenZReadings.length} Reports)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedZReadingDate(null);
                setShowZReadingModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>Perform New Z-Reading</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3.5">Z-Counter No.</th>
                  <th className="px-4 py-3.5">Shift Date</th>
                  <th className="px-4 py-3.5">Shift Period</th>
                  <th className="px-4 py-3.5">Cashier</th>
                  <th className="px-4 py-3.5 text-right">Gross Sales (₱)</th>
                  <th className="px-4 py-3.5 text-right">Cash Collected (₱)</th>
                  <th className="px-4 py-3.5 text-right">Actual Counted (₱)</th>
                  <th className="px-4 py-3.5 text-center">Variance (Over/Short)</th>
                  <th className="px-4 py-3.5">Archived Time</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {canteenZReadings.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-slate-400">
                      <Calculator className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600 text-sm">No archived Z-readings recorded yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click "Perform New Z-Reading" or "Shift Z-Reading" above to reconcile today's cash drawer and generate your official closeout report.
                      </p>
                    </td>
                  </tr>
                ) : (
                  canteenZReadings.map((z, idx) => (
                    <tr key={z.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{z.zCounter}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{z.date}</td>
                      <td className="px-4 py-3 text-slate-600">{z.shiftPeriod || 'Full Day'}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{z.cashierName}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₱{z.grossSales?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        ₱{z.cashSales?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        ₱{z.actualCountedCash?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          (z.cashVariance || 0) === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : (z.cashVariance || 0) > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {(z.cashVariance || 0) === 0
                            ? 'Balanced'
                            : (z.cashVariance || 0) > 0
                            ? `+₱${z.cashVariance.toFixed(2)} Over`
                            : `-₱${Math.abs(z.cashVariance).toFixed(2)} Short`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(z.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedZReadingDate(z.date);
                            setShowZReadingModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                          title="View & Reprint Thermal Z-Reading Slip"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>View Z-Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Ledger Table */
        <div id="printable-report-table" className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Transaction Records Ledger ({filteredList.length} Entries)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Immutable Audit Trail · Grouped by Customer Claim Date
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5">Date (Claimed / Effective)</th>
                <th className="px-4 py-3.5">Reference / No.</th>
                <th className="px-4 py-3.5">Record Type</th>
                <th className="px-4 py-3.5">Customer / Staff</th>
                <th className="px-4 py-3.5">Items &amp; Details</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-4 py-3.5 text-right">Amount (₱)</th>
                <th className="px-4 py-3.5">Cashier / Supervisor</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 text-sm">No transaction records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery || startDate || endDate ? 'Try adjusting your date range or clearing your search query.' : 'Transactions recorded in the Canteen POS register will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isVoid = item.category === 'VOID';
                  const isSalaryDed = item.paymentMethod === 'Salary Deduction';

                  return (
                    <tr key={`${item.id}-${idx}`} className={`transition ${isVoid ? 'bg-rose-50/30' : 'hover:bg-slate-50/80'}`}>
                      
                      {/* Date & Time (Claimed Date vs System Timestamp) */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{new Date(item.effectiveDate || item.timestamp).toLocaleDateString()}</span>
                        </div>
                        {item.isLateEncoded ? (
                          <div className="mt-1 space-y-0.5">
                            <span 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold" 
                              title={item.lateReason ? `Late Reason: ${item.lateReason}` : 'Claimed earlier by customer'}
                            >
                              <Clock className="h-3 w-3 text-amber-700" />
                              Late Encoded (Claimed)
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Actual entry: {new Date(item.actualEncodedAt || item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                            {item.lateReason && (
                              <div className="text-[10px] text-amber-800 italic truncate max-w-[180px]" title={item.lateReason}>
                                "{item.lateReason}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.reference}
                      </td>

                      {/* Record Type */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.category === 'SALE'
                            ? (isSalaryDed ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : item.category === 'PO'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.category === 'VOID'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 font-black'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.type}
                        </span>
                        {item.orderType && item.orderType !== 'Void Record' && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {item.orderType}
                          </div>
                        )}
                      </td>

                      {/* Customer / Staff */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.customerName}</div>
                        {item.staffId && (
                          <div className="text-[10px] text-slate-400 font-mono">ID: {item.staffId}</div>
                        )}
                      </td>

                      {/* Items Summary */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-slate-800 line-clamp-2" title={item.itemsSummary}>
                          {item.itemsSummary}
                        </div>
                        {item.itemsCount > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {item.itemsCount} total {item.itemsCount === 1 ? 'item' : 'items'}
                          </span>
                        )}
                        {item.reason && (
                          <div className="text-[10px] text-rose-600 font-medium italic mt-0.5">
                            Reason: {item.reason}
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {item.paymentMethod === 'Cash' ? (
                            <Banknote className="h-3.5 w-3.5 text-slate-500" />
                          ) : item.paymentMethod === 'Salary Deduction' ? (
                            <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                          ) : null}
                          <span>{item.paymentMethod}</span>
                        </div>
                        {isSalaryDed && (
                          <div className="text-[9px] text-emerald-600 font-bold">
                            Auto-Paid via Coop
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                        isVoid ? 'text-rose-600' : 'text-slate-900 text-sm'
                      }`}>
                        {isVoid ? '-' : ''}₱{Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Cashier / Supervisor */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                        {item.cashier}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'COMPLETED' || item.status === 'Fulfilled' || item.status === 'Cleared'
                            ? 'bg-slate-900 text-white'
                            : item.status === 'VOIDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {item.category === 'SALE' && onShowReceipt && (
                          <button
                            type="button"
                            onClick={() => onShowReceipt(item.rawRecord)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                            title="View / Print Receipt"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                        {item.category === 'GATE_PASS' && onShowGatePass && (
                          <button
                            type="button"
                            onClick={() => onShowGatePass(item.rawRecord)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 mx-auto"
                            title="View Gate Pass"
                          >
                            <Eye className="h-3 w-3" />
                            <span>Gate Pass</span>
                          </button>
                        )}
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

      {/* Daily Shift Closeout & Cashier Z-Reading Modal */}
      {showZReadingModal && (
        <CanteenZReadingModal
          defaultDate={selectedZReadingDate}
          onClose={() => {
            setShowZReadingModal(false);
            setSelectedZReadingDate(null);
          }}
        />
      )}

    </div>
  );
}
