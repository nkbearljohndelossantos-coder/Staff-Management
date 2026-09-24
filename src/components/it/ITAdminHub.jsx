import React, { useState, useMemo, useRef } from 'react';
import {
  Database,
  Search,
  Filter,
  Calendar,
  Edit3,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Package,
  ShoppingBag,
  DoorClosed,
  RotateCcw,
  Clock,
  Landmark,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Save,
  X,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ITAdminHub() {
  const {
    currentUser,
    isITAdmin,
    isSuperAdmin,
    staffList,
    departments,
    positions,
    // Collections
    canteenReceipts,
    updateCanteenReceipt,
    deleteCanteenReceipt,
    canteenInventory,
    canteenCategories,
    updateSupplyItem,
    deleteSupplyItem,
    personalPurchaseOrders,
    updatePersonalPurchaseOrder,
    deletePersonalPurchaseOrder,
    canteenGatePasses,
    updateGatePass,
    deleteGatePass,
    canteenVoidLogs,
    updateVoidLog,
    deleteVoidLog,
    attendanceLogs,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    cashLoans,
    updateCashLoan,
    deleteCashLoan,
    coopLedger,
    updateCoopLedgerEntry,
    deleteCoopLedgerEntry,
    exportFullSystemBackup,
    importFullSystemBackup,
    resetTestTransactions
  } = useApp();

  // Active collection sub-tab
  const [activeCategory, setActiveCategory] = useState('receipts');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Modals state
  const [editingRecord, setEditingRecord] = useState(null); // { type, data }
  const [deletingRecord, setDeletingRecord] = useState(null); // { type, id, title }
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeOptions, setPurgeOptions] = useState({
    receipts: true,
    gatePasses: true,
    voidLogs: true,
    purchaseOrders: true
  });
  
  const fileInputRef = useRef(null);

  // Quick Date Range Presets
  const setPresetRange = (preset) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setDateRange({ from: '', to: '' });
    } else if (preset === 'TODAY') {
      setDateRange({ from: todayStr, to: todayStr });
    } else if (preset === 'LAST_7') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setDateRange({ from: past7.toISOString().split('T')[0], to: todayStr });
    } else if (preset === 'THIS_MONTH') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRange({ from: startOfMonth.toISOString().split('T')[0], to: todayStr });
    }
  };

  // Helper date checker
  const isDateWithinRange = (dateStr) => {
    if (!dateStr) return true;
    if (!dateRange.from && !dateRange.to) return true;
    try {
      const itemDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      if (dateRange.from && itemDateStr < dateRange.from) return false;
      if (dateRange.to && itemDateStr > dateRange.to) return false;
      return true;
    } catch {
      return true;
    }
  };

  // --- FILTERED COLLECTIONS ---
  const filteredReceipts = useMemo(() => {
    return canteenReceipts.filter(r => {
      const effectiveDate = (r.isLateEncoded && r.claimedDate) ? r.claimedDate : r.date;
      if (!isDateWithinRange(effectiveDate)) return false;
      if (statusFilter !== 'ALL' && (r.status || 'COMPLETED') !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.receiptNo && r.receiptNo.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q)) ||
        (r.orderType && r.orderType.toLowerCase().includes(q)) ||
        (r.gatePassNo && r.gatePassNo.toLowerCase().includes(q)) ||
        (r.items && r.items.some(i => i.name && i.name.toLowerCase().includes(q)))
      );
    });
  }, [canteenReceipts, dateRange, statusFilter, searchQuery]);

  const filteredInventory = useMemo(() => {
    return canteenInventory.filter(item => {
      if (!isDateWithinRange(item.encodedAt)) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'OUT_OF_STOCK' && (item.quantity || 0) > 0) return false;
        if (statusFilter === 'LOW_STOCK' && ((item.quantity || 0) <= 0 || (item.quantity || 0) > (item.reorderLevel || 10))) return false;
        if (statusFilter === 'IN_STOCK' && (item.quantity || 0) <= (item.reorderLevel || 10)) return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.company && item.company.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    });
  }, [canteenInventory, dateRange, statusFilter, searchQuery]);

  const filteredPOs = useMemo(() => {
    return personalPurchaseOrders.filter(po => {
      const poDate = po.orderDate || po.date;
      if (!isDateWithinRange(poDate)) return false;
      if (statusFilter !== 'ALL' && (po.status || 'Pending') !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (po.poNumber && po.poNumber.toLowerCase().includes(q)) ||
        (po.staffName && po.staffName.toLowerCase().includes(q)) ||
        (po.paymentMethod && po.paymentMethod.toLowerCase().includes(q)) ||
        (po.items && po.items.some(i => i.name && i.name.toLowerCase().includes(q)))
      );
    });
  }, [personalPurchaseOrders, dateRange, statusFilter, searchQuery]);

  const filteredGatePasses = useMemo(() => {
    return canteenGatePasses.filter(gp => {
      const gpDate = (gp.isLateEncoded && gp.claimedDate) ? gp.claimedDate : gp.date;
      if (!isDateWithinRange(gpDate)) return false;
      if (statusFilter !== 'ALL' && (gp.gateStatus || 'Issued') !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (gp.gatePassNo && gp.gatePassNo.toLowerCase().includes(q)) ||
        (gp.receiptNo && gp.receiptNo.toLowerCase().includes(q)) ||
        (gp.staffName && gp.staffName.toLowerCase().includes(q)) ||
        (gp.employeeId && gp.employeeId.toLowerCase().includes(q)) ||
        (gp.securityGuard && gp.securityGuard.toLowerCase().includes(q))
      );
    });
  }, [canteenGatePasses, dateRange, statusFilter, searchQuery]);

  const filteredVoidLogs = useMemo(() => {
    return canteenVoidLogs.filter(vl => {
      const logDate = vl.timestamp || vl.voidedAt;
      if (!isDateWithinRange(logDate)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (vl.receiptNo && vl.receiptNo.toLowerCase().includes(q)) ||
        (vl.voidedBy && vl.voidedBy.toLowerCase().includes(q)) ||
        (vl.reason && vl.reason.toLowerCase().includes(q)) ||
        (vl.itemName && vl.itemName.toLowerCase().includes(q)) ||
        (vl.type && vl.type.toLowerCase().includes(q))
      );
    });
  }, [canteenVoidLogs, dateRange, searchQuery]);

  const filteredAttendance = useMemo(() => {
    return attendanceLogs.filter(att => {
      if (!isDateWithinRange(att.date)) return false;
      if (statusFilter !== 'ALL' && (att.status || 'Present') !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (att.staffName && att.staffName.toLowerCase().includes(q)) ||
        (att.staffId && att.staffId.toLowerCase().includes(q)) ||
        (att.status && att.status.toLowerCase().includes(q))
      );
    });
  }, [attendanceLogs, dateRange, statusFilter, searchQuery]);

  const filteredLoans = useMemo(() => {
    return cashLoans.filter(l => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (l.loanCode && l.loanCode.toLowerCase().includes(q)) ||
        (l.staffName && l.staffName.toLowerCase().includes(q)) ||
        (l.category && l.category.toLowerCase().includes(q)) ||
        (l.status && l.status.toLowerCase().includes(q))
      );
    });
  }, [cashLoans, searchQuery]);

  const filteredCoopLedger = useMemo(() => {
    return coopLedger.filter(entry => {
      if (!isDateWithinRange(entry.date)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (entry.type && entry.type.toLowerCase().includes(q)) ||
        (entry.note && entry.note.toLowerCase().includes(q)) ||
        (entry.staffId && entry.staffId.toLowerCase().includes(q))
      );
    });
  }, [coopLedger, dateRange, searchQuery]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalReceiptsAmount = canteenReceipts
      .filter(r => r.status !== 'VOIDED')
      .reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalInventoryValue = canteenInventory
      .reduce((sum, item) => sum + ((Number(item.sellingPrice) || 0) * (Number(item.quantity) || 0)), 0);
    const totalGatePassesIssued = canteenGatePasses.length;
    const totalAttendanceShifts = attendanceLogs.length;

    return {
      receiptsCount: canteenReceipts.length,
      receiptsAmount: totalReceiptsAmount,
      inventoryCount: canteenInventory.length,
      inventoryValue: totalInventoryValue,
      poCount: personalPurchaseOrders.length,
      gatePassCount: totalGatePassesIssued,
      voidCount: canteenVoidLogs.length,
      attendanceCount: totalAttendanceShifts,
      loansCount: cashLoans.length,
      coopLedgerCount: coopLedger.length
    };
  }, [canteenReceipts, canteenInventory, personalPurchaseOrders, canteenGatePasses, canteenVoidLogs, attendanceLogs, cashLoans, coopLedger]);

  // Handle Edit Action
  const handleOpenEdit = (type, data) => {
    setEditingRecord({
      type,
      data: JSON.parse(JSON.stringify(data)) // deep clone for safe editing
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    const { type, data } = editingRecord;

    if (type === 'receipt') {
      updateCanteenReceipt(data.receiptNo, data);
    } else if (type === 'inventory') {
      updateSupplyItem(data.id, data);
    } else if (type === 'purchaseOrder') {
      updatePersonalPurchaseOrder(data.id || data.poNumber, data);
    } else if (type === 'gatePass') {
      updateGatePass(data.gatePassNo || data.id, data);
    } else if (type === 'voidLog') {
      updateVoidLog(data.id, data);
    } else if (type === 'attendance') {
      updateAttendanceRecord(data.id, data);
    } else if (type === 'loan') {
      updateCashLoan(data.id || data.loanCode, data);
    } else if (type === 'coopLedger') {
      updateCoopLedgerEntry(data.id, data);
    }

    setEditingRecord(null);
  };

  // Handle Delete Action
  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    const { type, id } = deletingRecord;

    if (type === 'receipt') {
      deleteCanteenReceipt(id);
    } else if (type === 'inventory') {
      deleteSupplyItem(id);
    } else if (type === 'purchaseOrder') {
      deletePersonalPurchaseOrder(id);
    } else if (type === 'gatePass') {
      deleteGatePass(id);
    } else if (type === 'voidLog') {
      deleteVoidLog(id);
    } else if (type === 'attendance') {
      deleteAttendanceRecord(id);
    } else if (type === 'loan') {
      deleteCashLoan(id);
    } else if (type === 'coopLedger') {
      deleteCoopLedgerEntry(id);
    }

    setDeletingRecord(null);
  };

  // Handle JSON Import
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (window.confirm(`Are you sure you want to restore the database backup created at ${parsed.exportedAt || 'Unknown Date'}? This will update system transaction tables.`)) {
          importFullSystemBackup(parsed);
        }
      } catch (err) {
        alert('Invalid JSON backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> IT Administrative Master Controls
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Universal Edit & Audit Access
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Enterprise Transactions & Master Records
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
              Assigned to IT Admin <strong>Carl Laurence B. PATAGNAN</strong> (NKB092026-0048) & Super Admin. Full administrative authority to inspect, correct clerical errors, update line items/totals, void, or delete records across all operational subsystems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={exportFullSystemBackup}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 hover:border-slate-600 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>Export Database (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 hover:border-slate-600 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Upload className="h-4 w-4 text-emerald-400" />
              <span>Restore JSON Backup</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setIsPurgeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Purge Test Records</span>
            </button>
          </div>
        </div>

        {/* Live Counters Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">POS Receipts</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.receiptsCount}</div>
            <div className="text-[10px] text-slate-500 truncate">₱{stats.receiptsAmount.toLocaleString()} volume</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Items</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.inventoryCount}</div>
            <div className="text-[10px] text-slate-500 truncate">₱{stats.inventoryValue.toLocaleString()} asset value</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Personal POs</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.poCount}</div>
            <div className="text-[10px] text-slate-500">Mfg product orders</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gate Passes</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.gatePassCount}</div>
            <div className="text-[10px] text-slate-500">Plant exit permits</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supervisor Voids</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.voidCount}</div>
            <div className="text-[10px] text-slate-500">Card audit logs</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clock-in Shifts</div>
            <div className="text-lg font-black text-white mt-0.5">{stats.attendanceCount}</div>
            <div className="text-[10px] text-slate-500">Attendance records</div>
          </div>
        </div>
      </div>

      {/* Workspace Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'receipts', label: 'POS Receipts', count: canteenReceipts.length, icon: Receipt },
          { id: 'inventory', label: 'Canteen Supplies', count: canteenInventory.length, icon: Package },
          { id: 'purchaseOrders', label: 'Personal POs', count: personalPurchaseOrders.length, icon: ShoppingBag },
          { id: 'gatePasses', label: 'Grocery Gate Passes', count: canteenGatePasses.length, icon: DoorClosed },
          { id: 'voidLogs', label: 'Void Audits', count: canteenVoidLogs.length, icon: RotateCcw },
          { id: 'attendance', label: 'Attendance Shifts', count: attendanceLogs.length, icon: Clock },
          { id: 'coop', label: 'Coop Loans & Ledger', count: cashLoans.length + coopLedger.length, icon: Landmark },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCategory(tab.id);
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Universal Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search in ${activeCategory}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets & Date Range */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Range:
            </span>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPresetRange('ALL')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                  !dateRange.from && !dateRange.to ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('TODAY')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('LAST_7')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Last 7D
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('THIS_MONTH')}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN RECORDS CONTENT TABLES */}

      {/* 1. POS RECEIPTS */}
      {activeCategory === 'receipts' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900">Canteen Sales Receipts Audit</h2>
              <p className="text-xs text-slate-500">Edit transaction dates, claimed dates, payment methods, customer names, line items, and totals.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Showing {filteredReceipts.length} of {canteenReceipts.length} receipts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Transaction Date / Claimed</th>
                  <th className="p-3.5">Customer / Staff</th>
                  <th className="p-3.5">Type & Payment</th>
                  <th className="p-3.5">Purchased Items</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">IT Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No receipts found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map(r => (
                    <tr key={r.receiptNo} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-bold font-mono text-slate-900">
                        {r.receiptNo}
                        {r.gatePassNo && (
                          <div className="text-[10px] text-cyan-600 font-normal">GP: {r.gatePassNo}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(r.actualEncodedAt || r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {r.isLateEncoded && (
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            Claimed: {r.claimedDate}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{r.customerName}</div>
                        <div className="text-[10px] text-slate-400">{r.customerType} {r.staffId ? `(${r.staffId})` : ''}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-700">{r.orderType}</span>
                        <div className="text-[10px] font-bold text-slate-500">{r.paymentMethod}</div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="truncate text-slate-600">
                          {r.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'No items'}
                        </div>
                        <div className="text-[10px] text-slate-400">{r.items?.length || 0} item line(s)</div>
                      </td>
                      <td className="p-3.5 font-mono font-black text-slate-900">
                        ₱{Number(r.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.status === 'VOIDED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {r.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('receipt', r)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                          title="Edit Receipt Fields"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord({ type: 'receipt', id: r.receiptNo, title: `Receipt #${r.receiptNo} (${r.customerName})` })}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Receipt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CANTEEN SUPPLIES INVENTORY */}
      {activeCategory === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900">Supply Inventory Catalog</h2>
              <p className="text-xs text-slate-500">Correct barcodes, stock quantities, cost/selling prices, categories, and expiry dates.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Showing {filteredInventory.length} of {canteenInventory.length} items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5">Item Name & Brand</th>
                  <th className="p-3.5">Barcode</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Cost Price</th>
                  <th className="p-3.5">Selling Price</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Reorder Level</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5 text-right">IT Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-400">
                      No inventory items found. Add items in the Canteen Hub or adjust search filters.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.brand || 'General'} • {item.company || 'Direct'}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{item.barcode || '—'}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category || 'General Supplies'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-600">
                        ₱{Number(item.costPrice || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        ₱{Number(item.sellingPrice || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5">
                        <span className={`font-mono font-black ${
                          Number(item.quantity || 0) <= 0
                            ? 'text-rose-600'
                            : Number(item.quantity || 0) <= Number(item.reorderLevel || 10)
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}>
                          {item.quantity || 0} {item.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">{item.reorderLevel || 10}</td>
                      <td className="p-3.5 text-slate-600">{item.expirationDate || '—'}</td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('inventory', item)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                          title="Edit Inventory Item"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord({ type: 'inventory', id: item.id, title: `${item.name} (${item.barcode})` })}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Inventory Item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PERSONAL PURCHASE ORDERS */}
      {activeCategory === 'purchaseOrders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900">Manufacturing Goods Personal POs</h2>
              <p className="text-xs text-slate-500">Edit employee purchase orders, payment deduction methods, total amounts, and fulfillment statuses.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Showing {filteredPOs.length} of {personalPurchaseOrders.length} orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5">PO #</th>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Ordered Goods</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Payment Terms</th>
                  <th className="p-3.5">Fulfillment Status</th>
                  <th className="p-3.5 text-right">IT Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No purchase orders recorded in the system.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map(po => (
                    <tr key={po.id || po.poNumber} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{po.poNumber}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{po.staffName}</div>
                        <div className="text-[10px] text-slate-400">{po.staffId}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">{po.orderDate || po.date}</td>
                      <td className="p-3.5 max-w-xs">
                        <div className="truncate text-slate-700">
                          {po.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-black text-slate-900">
                        ₱{Number(po.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-700 capitalize">{po.paymentMethod}</span>
                        <div className="text-[10px] text-slate-400">{po.paymentStatus}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          po.status?.includes('Fulfilled')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {po.status || 'Pending'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('purchaseOrder', po)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                          title="Edit Purchase Order"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord({ type: 'purchaseOrder', id: po.id || po.poNumber, title: `PO #${po.poNumber} (${po.staffName})` })}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Purchase Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. GROCERY GATE PASSES */}
      {activeCategory === 'gatePasses' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900">Plant Grocery Gate Passes</h2>
              <p className="text-xs text-slate-500">Security checkout permits for grocery takeout from facility. Edit bearer, security status, and clearance records.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Showing {filteredGatePasses.length} of {canteenGatePasses.length} passes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5">Gate Pass #</th>
                  <th className="p-3.5">Receipt Ref</th>
                  <th className="p-3.5">Bearer / Employee</th>
                  <th className="p-3.5">Date Issued</th>
                  <th className="p-3.5">Items Summary</th>
                  <th className="p-3.5">Gate Clearance Status</th>
                  <th className="p-3.5">Security Officer</th>
                  <th className="p-3.5 text-right">IT Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredGatePasses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No grocery gate passes recorded in the system.
                    </td>
                  </tr>
                ) : (
                  filteredGatePasses.map(gp => (
                    <tr key={gp.gatePassNo} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{gp.gatePassNo}</td>
                      <td className="p-3.5 font-mono text-slate-600">{gp.receiptNo}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{gp.staffName}</div>
                        <div className="text-[10px] text-slate-400">{gp.employeeId} • {gp.departmentName}</div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {new Date(gp.date).toLocaleDateString()}
                        {gp.isLateEncoded && (
                          <div className="text-[10px] text-amber-700 font-bold">Claimed: {gp.claimedDate}</div>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-slate-600">
                        {gp.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          gp.gateStatus?.includes('Cleared')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}>
                          {gp.gateStatus || 'Issued'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {gp.securityGuard || 'Awaiting Gate Post 1 Check'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('gatePass', gp)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                          title="Edit Gate Pass"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord({ type: 'gatePass', id: gp.gatePassNo, title: `Gate Pass #${gp.gatePassNo} (${gp.staffName})` })}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Gate Pass"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SUPERVISOR VOID AUDITS */}
      {activeCategory === 'voidLogs' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900">Supervisor Void Audit Ledger</h2>
              <p className="text-xs text-slate-500">Security audit records of all supervisor barcode/card authorized line voids, order cancellations, and stock returns.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Showing {filteredVoidLogs.length} of {canteenVoidLogs.length} logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Void Type</th>
                  <th className="p-3.5">Reference / Item</th>
                  <th className="p-3.5">Authorized By</th>
                  <th className="p-3.5">Supervisor Badge</th>
                  <th className="p-3.5">Audit Reason</th>
                  <th className="p-3.5">Amount / Value</th>
                  <th className="p-3.5 text-right">IT Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredVoidLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No void logs recorded in the system.
                    </td>
                  </tr>
                ) : (
                  filteredVoidLogs.map(vl => (
                    <tr key={vl.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {new Date(vl.timestamp || vl.voidedAt).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {vl.type || 'VOID'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{vl.receiptNo || vl.itemName || 'Transaction'}</div>
                        {vl.itemBarcode && <div className="text-[10px] text-slate-400 font-mono">{vl.itemBarcode}</div>}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{vl.voidedBy}</td>
                      <td className="p-3.5 font-mono text-slate-500">{vl.supervisorBadgeId || vl.cardBadgeId || '—'}</td>
                      <td className="p-3.5 text-slate-700 max-w-xs">{vl.reason}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {vl.amount ? `₱${Number(vl.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('voidLog', vl)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                          title="Edit Void Audit Record"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord({ type: 'voidLog', id: vl.id, title: `Void Record (${vl.voidedBy})` })}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Void Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ATTENDANCE SHIFTS */}
      {activeCategory === 'attendance' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900">Barcode Clock-In Attendance Logs</h2>
              <p className="text-xs text-slate-500">Correct clerical clock-in and clock-out errors, overtime hours, late minutes, and attendance statuses.</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Showing {filteredAttendance.length} of {attendanceLogs.length} shifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5">Staff Name & ID</th>
                  <th className="p-3.5">Shift Date</th>
                  <th className="p-3.5">Clock In</th>
                  <th className="p-3.5">Clock Out</th>
                  <th className="p-3.5">Late (Mins)</th>
                  <th className="p-3.5">OT (Hours)</th>
                  <th className="p-3.5">Shift Status</th>
                  <th className="p-3.5 text-right">IT Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400">
                      No attendance shift logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{att.staffName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{att.staffId}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{att.date}</td>
                      <td className="p-3.5 font-mono text-emerald-700 font-bold">{att.timeIn || '—'}</td>
                      <td className="p-3.5 font-mono text-slate-700 font-bold">{att.timeOut || '—'}</td>
                      <td className="p-3.5 font-mono text-amber-700 font-semibold">{att.lateMinutes || 0}m</td>
                      <td className="p-3.5 font-mono text-cyan-700 font-semibold">{att.overtimeHours || 0}h</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          att.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : att.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {att.status || 'Present'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit('attendance', att)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                          title="Edit Attendance Record"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord({ type: 'attendance', id: att.id, title: `Attendance: ${att.staffName} (${att.date})` })}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Attendance Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. COOP LOANS & LEDGER */}
      {activeCategory === 'coop' && (
        <div className="space-y-6">
          {/* Active Loans */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-black text-slate-900">Cooperative Cash Loans Directory</h2>
                <p className="text-xs text-slate-500">Edit loan principal amounts, interest rates, approval stages, balances, and cutoff deductions.</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{filteredLoans.length} loans</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-3.5">Loan Code</th>
                    <th className="p-3.5">Staff Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Principal</th>
                    <th className="p-3.5">Monthly Interest</th>
                    <th className="p-3.5">Outstanding Balance</th>
                    <th className="p-3.5">Stage & Status</th>
                    <th className="p-3.5 text-right">IT Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-400">
                        No loans recorded in the cooperative ledger.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map(loan => (
                      <tr key={loan.id || loan.loanCode} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{loan.loanCode}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{loan.staffName}</td>
                        <td className="p-3.5 text-slate-600 capitalize">{loan.category}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          ₱{Number(loan.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">{loan.monthlyRate || 2}%</td>
                        <td className="p-3.5 font-mono font-black text-rose-700">
                          ₱{Number(loan.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {loan.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('loan', loan)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                            title="Edit Loan Record"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRecord({ type: 'loan', id: loan.id || loan.loanCode, title: `Loan ${loan.loanCode} (${loan.staffName})` })}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Loan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coop Share Capital Ledger Entries */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-black text-slate-900">Cooperative Share Capital Ledger Audit</h2>
                <p className="text-xs text-slate-500">Edit share deposits, loan disburse debits, and canteen PO balance deductions.</p>
              </div>
              <span className="text-xs font-bold text-slate-500">{filteredCoopLedger.length} ledger transactions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Staff ID</th>
                    <th className="p-3.5">Transaction Type</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Audit Note / Reference</th>
                    <th className="p-3.5 text-right">IT Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCoopLedger.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        No ledger transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredCoopLedger.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-slate-600 whitespace-nowrap">{entry.date}</td>
                        <td className="p-3.5 font-mono font-bold text-slate-800">{entry.staffId}</td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            entry.type?.includes('deposit')
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          ₱{Number(entry.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 text-slate-700 max-w-sm">{entry.note}</td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit('coopLedger', entry)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition mr-1 cursor-pointer"
                            title="Edit Ledger Entry"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingRecord({ type: 'coopLedger', id: entry.id, title: `Coop Ledger Entry (${entry.type})` })}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Ledger Entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT RECORD MODAL --- */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black capitalize">Edit {editingRecord.type} Master Record</h3>
                  <p className="text-[11px] text-slate-400">IT Administrator override mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* 1. RECEIPT EDIT FIELDS */}
              {editingRecord.type === 'receipt' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Receipt Number</label>
                      <input
                        type="text"
                        value={editingRecord.data.receiptNo || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                      <select
                        value={editingRecord.data.status || 'COMPLETED'}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, status: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                      >
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="VOIDED">VOIDED</option>
                        <option value="PENDING">PENDING</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Effective Transaction Date</label>
                      <input
                        type="datetime-local"
                        value={editingRecord.data.date ? new Date(editingRecord.data.date).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, date: new Date(e.target.value).toISOString() }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method</label>
                      <select
                        value={editingRecord.data.paymentMethod || 'Cash'}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, paymentMethod: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Salary Deduction">Salary Deduction</option>
                      </select>
                    </div>
                  </div>

                  {/* Late Encoded Switch & Claimed Date */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Late Encoded Record</span>
                      <input
                        type="checkbox"
                        checked={!!editingRecord.data.isLateEncoded}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, isLateEncoded: e.target.checked }
                        }))}
                        className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                      />
                    </div>
                    {editingRecord.data.isLateEncoded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-1">Customer Claimed Date</label>
                          <input
                            type="date"
                            value={editingRecord.data.claimedDate || ''}
                            onChange={(e) => setEditingRecord(prev => ({
                              ...prev,
                              data: { ...prev.data, claimedDate: e.target.value }
                            }))}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-1">Late Reason</label>
                          <input
                            type="text"
                            value={editingRecord.data.lateReason || ''}
                            onChange={(e) => setEditingRecord(prev => ({
                              ...prev,
                              data: { ...prev.data, lateReason: e.target.value }
                            }))}
                            placeholder="e.g. Delayed register encoding"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={editingRecord.data.customerName || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, customerName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Transaction Amount (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingRecord.data.total ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, total: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Line Items Editor */}
                  <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">Line Items in Transaction</span>
                      <button
                        type="button"
                        onClick={() => {
                          const items = editingRecord.data.items || [];
                          const newItem = { name: 'Item', quantity: 1, unitPrice: 10, total: 10 };
                          const updated = [...items, newItem];
                          const newTotal = updated.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
                          setEditingRecord(prev => ({
                            ...prev,
                            data: { ...prev.data, items: updated, total: newTotal, subtotal: newTotal }
                          }));
                        }}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-slate-900 text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editingRecord.data.items?.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                          <input
                            type="text"
                            value={it.name}
                            onChange={(e) => {
                              const copy = [...editingRecord.data.items];
                              copy[idx].name = e.target.value;
                              setEditingRecord(prev => ({ ...prev, data: { ...prev.data, items: copy } }));
                            }}
                            className="flex-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs"
                            placeholder="Item name"
                          />
                          <div className="flex items-center gap-1 w-20">
                            <span className="text-[10px] text-slate-400">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => {
                                const copy = [...editingRecord.data.items];
                                copy[idx].quantity = Number(e.target.value);
                                copy[idx].total = copy[idx].quantity * copy[idx].unitPrice;
                                const newTotal = copy.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
                                setEditingRecord(prev => ({ ...prev, data: { ...prev.data, items: copy, total: newTotal, subtotal: newTotal } }));
                              }}
                              className="w-12 px-1.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono"
                            />
                          </div>
                          <div className="flex items-center gap-1 w-24">
                            <span className="text-[10px] text-slate-400">₱:</span>
                            <input
                              type="number"
                              step="0.01"
                              value={it.unitPrice}
                              onChange={(e) => {
                                const copy = [...editingRecord.data.items];
                                copy[idx].unitPrice = Number(e.target.value);
                                copy[idx].total = copy[idx].quantity * copy[idx].unitPrice;
                                const newTotal = copy.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
                                setEditingRecord(prev => ({ ...prev, data: { ...prev.data, items: copy, total: newTotal, subtotal: newTotal } }));
                              }}
                              className="w-16 px-1.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editingRecord.data.items.filter((_, i) => i !== idx);
                              const newTotal = copy.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
                              setEditingRecord(prev => ({ ...prev, data: { ...prev.data, items: copy, total: newTotal, subtotal: newTotal } }));
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 2. INVENTORY ITEM EDIT FIELDS */}
              {editingRecord.type === 'inventory' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Item Name</label>
                      <input
                        type="text"
                        required
                        value={editingRecord.data.name || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Barcode Value</label>
                      <input
                        type="text"
                        value={editingRecord.data.barcode || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, barcode: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
                      <select
                        value={editingRecord.data.category || 'General Supplies'}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, category: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      >
                        {canteenCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Brand</label>
                      <input
                        type="text"
                        value={editingRecord.data.brand || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, brand: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Company / Supplier</label>
                      <input
                        type="text"
                        value={editingRecord.data.company || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, company: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        value={editingRecord.data.quantity ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, quantity: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Cost Price (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingRecord.data.costPrice ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, costPrice: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Selling Price (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingRecord.data.sellingPrice ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, sellingPrice: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiration Date</label>
                      <input
                        type="date"
                        value={editingRecord.data.expirationDate || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, expirationDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Reorder Level Warning</label>
                      <input
                        type="number"
                        value={editingRecord.data.reorderLevel ?? 10}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, reorderLevel: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 3. PERSONAL PO EDIT FIELDS */}
              {editingRecord.type === 'purchaseOrder' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">PO Number</label>
                      <input
                        type="text"
                        value={editingRecord.data.poNumber || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Staff Member</label>
                      <input
                        type="text"
                        value={editingRecord.data.staffName || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, staffName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Fulfillment Status</label>
                      <select
                        value={editingRecord.data.status || 'Pending Dispatch / Fulfillment'}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, status: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                      >
                        <option value="Pending Dispatch / Fulfillment">Pending Dispatch / Fulfillment</option>
                        <option value="Fulfilled / Dispatched">Fulfilled / Dispatched</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Total Amount (₱)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingRecord.data.totalAmount ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, totalAmount: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 4. GATE PASS EDIT FIELDS */}
              {editingRecord.type === 'gatePass' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Gate Pass Number</label>
                      <input
                        type="text"
                        value={editingRecord.data.gatePassNo || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Gate Clearance Status</label>
                      <select
                        value={editingRecord.data.gateStatus || 'Issued - Awaiting Gate Exit'}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, gateStatus: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                      >
                        <option value="Issued - Awaiting Gate Exit">Issued - Awaiting Gate Exit</option>
                        <option value="Cleared at Gate">Cleared at Gate</option>
                        <option value="Voided">Voided</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Bearer Name</label>
                      <input
                        type="text"
                        value={editingRecord.data.staffName || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, staffName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Security Officer</label>
                      <input
                        type="text"
                        value={editingRecord.data.securityGuard || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, securityGuard: e.target.value }
                        }))}
                        placeholder="Security Officer Name"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 5. VOID LOG EDIT FIELDS */}
              {editingRecord.type === 'voidLog' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Voided By</label>
                      <input
                        type="text"
                        value={editingRecord.data.voidedBy || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, voidedBy: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge ID</label>
                      <input
                        type="text"
                        value={editingRecord.data.supervisorBadgeId || editingRecord.data.cardBadgeId || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, supervisorBadgeId: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Void Reason</label>
                    <textarea
                      rows="2"
                      value={editingRecord.data.reason || ''}
                      onChange={(e) => setEditingRecord(prev => ({
                        ...prev,
                        data: { ...prev.data, reason: e.target.value }
                      }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    />
                  </div>
                </>
              )}

              {/* 6. ATTENDANCE EDIT FIELDS */}
              {editingRecord.type === 'attendance' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Staff Name</label>
                      <input
                        type="text"
                        value={editingRecord.data.staffName || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={editingRecord.data.date || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, date: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Clock In Time</label>
                      <input
                        type="text"
                        value={editingRecord.data.timeIn || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, timeIn: e.target.value }
                        }))}
                        placeholder="e.g. 08:00 AM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Clock Out Time</label>
                      <input
                        type="text"
                        value={editingRecord.data.timeOut || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, timeOut: e.target.value }
                        }))}
                        placeholder="e.g. 05:00 PM"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Late (Minutes)</label>
                      <input
                        type="number"
                        value={editingRecord.data.lateMinutes ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, lateMinutes: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Overtime (Hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editingRecord.data.overtimeHours ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, overtimeHours: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
                      <select
                        value={editingRecord.data.status || 'Present'}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, status: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                      >
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Overtime">Overtime</option>
                        <option value="Half-day">Half-day</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 7. COOP LOAN & LEDGER EDIT */}
              {editingRecord.type === 'loan' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Loan Code</label>
                      <input
                        type="text"
                        value={editingRecord.data.loanCode || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Borrower Staff</label>
                      <input
                        type="text"
                        value={editingRecord.data.staffName || ''}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, staffName: e.target.value }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Principal Amount (₱)</label>
                      <input
                        type="number"
                        value={editingRecord.data.amount ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, amount: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Monthly Interest (%)</label>
                      <input
                        type="number"
                        value={editingRecord.data.monthlyRate ?? 2}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, monthlyRate: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Outstanding Balance (₱)</label>
                      <input
                        type="number"
                        value={editingRecord.data.balance ?? 0}
                        onChange={(e) => setEditingRecord(prev => ({
                          ...prev,
                          data: { ...prev.data, balance: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="h-4 w-4 text-cyan-400" />
                  <span>Save Record Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Confirm Record Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                You are about to permanently delete this operational record:
              </p>
              <div className="mt-2.5 p-3 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-800 truncate">
                {deletingRecord.title || deletingRecord.id}
              </div>
              <p className="text-[11px] text-rose-600 font-semibold mt-2">
                This will remove the transaction from live queries and reports. This administrative action is logged to IT security audits.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PURGE TEST RECORDS MODAL --- */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RefreshCw className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Purge Operational Test Transactions</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select which operational transaction tables you would like to reset. Masterlist staff accounts and department structures will <strong>NOT</strong> be affected.
              </p>
            </div>

            <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">Canteen POS Receipts</span>
                <input
                  type="checkbox"
                  checked={purgeOptions.receipts}
                  onChange={(e) => setPurgeOptions(prev => ({ ...prev, receipts: e.target.checked }))}
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">Grocery Gate Passes</span>
                <input
                  type="checkbox"
                  checked={purgeOptions.gatePasses}
                  onChange={(e) => setPurgeOptions(prev => ({ ...prev, gatePasses: e.target.checked }))}
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">Supervisor Void Audit Logs</span>
                <input
                  type="checkbox"
                  checked={purgeOptions.voidLogs}
                  onChange={(e) => setPurgeOptions(prev => ({ ...prev, voidLogs: e.target.checked }))}
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">Personal Purchase Orders</span>
                <input
                  type="checkbox"
                  checked={purgeOptions.purchaseOrders}
                  onChange={(e) => setPurgeOptions(prev => ({ ...prev, purchaseOrders: e.target.checked }))}
                  className="w-4 h-4 rounded text-slate-900"
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetTestTransactions(purgeOptions);
                  setIsPurgeModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
