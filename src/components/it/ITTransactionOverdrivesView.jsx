import React, { useState, useMemo } from 'react';
import {
  Zap,
  Search,
  Filter,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  AlertTriangle,
  Receipt,
  Wallet,
  Landmark,
  DoorClosed,
  ShoppingBag,
  UserCheck,
  Edit3,
  Calendar,
  Layers,
  X,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function ITTransactionOverdrivesView() {
  const {
    canteenReceipts = [],
    canteenDrawer,
    cashLoans = [],
    canteenGatePasses = [],
    personalPurchaseOrders = [],
    attendanceLogs = [],
    staffList = [],
    overdriveAuditLogs = [],
    executeTransactionOverdrive,
    currentUser,
    showToast = () => {}
  } = useApp();

  // Subsystem category filter
  const [subsystemFilter, setSubsystemFilter] = useState('ALL'); // 'ALL' | 'receipt' | 'drawer' | 'loan' | 'gatePass' | 'po' | 'attendance'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Active Transaction for Overdrive Action
  const [selectedTx, setSelectedTx] = useState(null); // { type, data }
  const [overdriveAction, setOverdriveAction] = useState('FORCE_VOID'); // 'FORCE_VOID' | 'STATUS_OVERRIDE' | 'PAYMENT_OVERRIDE' | 'REASSIGN_CUSTOMER'
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState('VOIDED');
  const [targetPaymentMethod, setTargetPaymentMethod] = useState('Cash');
  const [targetStaffId, setTargetStaffId] = useState('');
  const [restoreStock, setRestoreStock] = useState(true);
  const [adjustCashDrawer, setAdjustCashDrawer] = useState(true);

  // Drawer Balance Calibration Modal State
  const [isDrawerCalibrateOpen, setIsDrawerCalibrateOpen] = useState(false);
  const [calibrationAmount, setCalibrationAmount] = useState('');
  const [calibrationReason, setCalibrationReason] = useState('Physical count discrepancy calibration');

  // Progressive Escape dismissal
  useEscapeKey('it-overdrive-modal', ESCAPE_PRIORITY.MODAL, Boolean(selectedTx), () => setSelectedTx(null));
  useEscapeKey('it-calibrate-drawer-modal', ESCAPE_PRIORITY.MODAL, isDrawerCalibrateOpen, () => setIsDrawerCalibrateOpen(false));

  // --- UNIFIED TRANSACTIONS FEED ---
  const allTransactions = useMemo(() => {
    const list = [];

    // 1. Receipts
    canteenReceipts.forEach(r => {
      list.push({
        id: r.receiptNo || r.id,
        type: 'receipt',
        typeLabel: 'POS Receipt',
        icon: Receipt,
        date: r.date || r.claimedDate || new Date().toISOString(),
        customer: r.customerName || 'Staff Member',
        staffId: r.staffId,
        amount: Number(r.total || 0),
        status: r.status || 'COMPLETED',
        paymentMethod: r.paymentMethod || 'Cash',
        operator: r.cashierName || 'Cashier',
        raw: r
      });
    });

    // 2. Drawer Transactions
    (canteenDrawer?.transactions || []).forEach(tx => {
      list.push({
        id: tx.id,
        type: 'drawer',
        typeLabel: 'Drawer Float/Drop',
        icon: Wallet,
        date: tx.timestamp || new Date().toISOString(),
        customer: tx.description || 'Register Drawer',
        staffId: null,
        amount: Number(tx.amount || 0),
        status: tx.status || 'COMPLETED',
        paymentMethod: 'Cash',
        operator: tx.operator || 'Canteen Head',
        raw: tx
      });
    });

    // 3. Coop Loans
    cashLoans.forEach(l => {
      list.push({
        id: l.id,
        type: 'loan',
        typeLabel: 'Cash Loan',
        icon: Landmark,
        date: l.encodedAt || l.date || new Date().toISOString(),
        customer: l.staffName || 'Staff Borrower',
        staffId: l.staffId,
        amount: Number(l.amount || 0),
        status: l.status || 'PENDING',
        paymentMethod: 'Payroll Amortization',
        operator: l.encodedBy || 'HR Staff',
        raw: l
      });
    });

    // 4. Gate Passes
    canteenGatePasses.forEach(g => {
      list.push({
        id: g.gatePassNo || g.id,
        type: 'gatePass',
        typeLabel: 'Grocery Gate Pass',
        icon: DoorClosed,
        date: g.issuedAt || g.date || new Date().toISOString(),
        customer: g.staffName || 'Staff Member',
        staffId: g.staffId,
        amount: Number(g.totalAmount || 0),
        status: g.status || 'ISSUED',
        paymentMethod: 'Pre-Approved',
        operator: g.issuedBy || 'Canteen Cashier',
        raw: g
      });
    });

    // 5. Personal Purchase Orders
    personalPurchaseOrders.forEach(po => {
      list.push({
        id: po.poNumber || po.id,
        type: 'po',
        typeLabel: 'Personal PO',
        icon: ShoppingBag,
        date: po.date || po.encodedAt || new Date().toISOString(),
        customer: po.staffName || 'Staff Requester',
        staffId: po.staffId,
        amount: Number(po.totalAmount || 0),
        status: po.status || 'PENDING',
        paymentMethod: 'Salary Deduction',
        operator: po.encodedBy || 'HR Staff',
        raw: po
      });
    });

    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [canteenReceipts, canteenDrawer, cashLoans, canteenGatePasses, personalPurchaseOrders]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(item => {
      if (subsystemFilter !== 'ALL' && item.type !== subsystemFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.customer.toLowerCase().includes(q) ||
        (item.staffId && item.staffId.toLowerCase().includes(q)) ||
        (item.operator && item.operator.toLowerCase().includes(q)) ||
        item.typeLabel.toLowerCase().includes(q)
      );
    });
  }, [allTransactions, subsystemFilter, statusFilter, searchQuery]);

  // Execute Overdrive
  const handleConfirmOverdrive = () => {
    if (!selectedTx) return;
    if (!overrideReason.trim()) {
      alert('Please specify an administrative justification reason for this overdrive.');
      return;
    }

    const selectedStaffObj = staffList.find(s => s.id === targetStaffId || s.employeeId === targetStaffId);

    executeTransactionOverdrive({
      targetType: selectedTx.type,
      targetId: selectedTx.id,
      action: overdriveAction,
      newStatus: targetStatus,
      newPaymentMethod: targetPaymentMethod,
      newStaffId: selectedStaffObj ? selectedStaffObj.id : targetStaffId,
      newStaffName: selectedStaffObj ? `${selectedStaffObj.firstName} ${selectedStaffObj.lastName}` : '',
      restoreStock,
      adjustCashDrawer,
      reason: overrideReason.trim(),
      itNotes: overrideNotes.trim()
    });

    setSelectedTx(null);
    setOverrideReason('');
    setOverrideNotes('');
  };

  const handleConfirmDrawerCalibration = () => {
    const amt = parseFloat(calibrationAmount);
    if (isNaN(amt) || amt === 0) {
      alert('Please enter a non-zero adjustment amount (positive to add, negative to deduct).');
      return;
    }

    executeTransactionOverdrive({
      targetType: 'drawer',
      targetId: 'CURRENT_DRAWER',
      action: 'CALIBRATE_DRAWER',
      calibrationAmount: amt,
      calibrationType: amt > 0 ? 'CALIBRATION_FLOAT' : 'CALIBRATION_DROP',
      reason: calibrationReason.trim() || 'Physical register calibration'
    });

    setIsDrawerCalibrateOpen(false);
    setCalibrationAmount('');
  };

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight">Transaction Overdrives &amp; Emergency Override Console</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                IT Authority Level 1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Execute emergency administrative status overrides, force-voids, payment method shifts, and register calibrations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerCalibrateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md shrink-0"
        >
          <Wallet className="h-4 w-4" />
          <span>Calibrate Cash Register Drawer</span>
        </button>
      </div>

      {/* Subsystem Tabs & Search Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Subsystem Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Subsystems' },
              { id: 'receipt', label: 'POS Receipts' },
              { id: 'drawer', label: 'Cash Drawer' },
              { id: 'loan', label: 'Coop Loans' },
              { id: 'gatePass', label: 'Gate Passes' },
              { id: 'po', label: 'Personal POs' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubsystemFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  subsystemFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PENDING">PENDING</option>
            <option value="VOIDED">VOIDED</option>
            <option value="ISSUED">ISSUED</option>
            <option value="APPROVED">APPROVED</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by transaction ID, staff name, employee ID, or cashier..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400 transition"
          />
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Reference / ID</th>
                <th className="p-3">Subsystem</th>
                <th className="p-3">Customer / Context</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Payment / Nature</th>
                <th className="p-3">Status</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-center">Overdrive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No transactions match current search criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 100).map(tx => {
                  const Icon = tx.icon;
                  const isVoid = tx.status === 'VOIDED' || tx.status === 'CANCELLED';
                  return (
                    <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50 transition font-mono">
                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        {tx.id}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          <Icon className="h-3 w-3 text-slate-500" />
                          <span>{tx.typeLabel}</span>
                        </span>
                      </td>
                      <td className="p-3 font-sans font-medium text-slate-800 max-w-[180px] truncate">
                        {tx.customer}
                        {tx.staffId && <span className="text-[10px] text-slate-400 font-mono ml-1">({tx.staffId})</span>}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap">
                        ₱{tx.amount.toFixed(2)}
                      </td>
                      <td className="p-3 font-sans text-slate-600 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isVoid ? 'bg-rose-100 text-rose-800' : tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[10px] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTx(tx);
                            setTargetStatus(tx.status === 'VOIDED' ? 'COMPLETED' : 'VOIDED');
                            setTargetPaymentMethod(tx.paymentMethod);
                            setTargetStaffId(tx.staffId || '');
                            setOverdriveAction(tx.status === 'VOIDED' ? 'FORCE_UNVOID' : 'FORCE_VOID');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-sans text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer shadow-xs"
                        >
                          <Zap className="h-3 w-3" />
                          <span>Overdrive</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdrive Audit Trail History */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 p-5 shadow-xl text-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Immutable IT Overdrive Audit Trail
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
              {overdriveAuditLogs.length} logged
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-72">
          {overdriveAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-600 text-xs font-mono">
              No administrative transaction overdrives recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 font-mono text-xs">
              {overdriveAuditLogs.map(log => (
                <div key={log.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-900/40 p-2 rounded-xl transition">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{log.id}</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-500">Target: {log.targetType?.toUpperCase()} #{log.targetId}</span>
                    </div>
                    <div className="text-xs text-white font-sans">{log.summary}</div>
                    <div className="text-[11px] text-slate-400 italic font-sans">
                      Reason: "{log.reason}"
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-[10px] text-slate-400">
                    <div>Executed by: <strong className="text-slate-200">{log.adminName}</strong></div>
                    <div>{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OVERDRIVE EXECUTION MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden space-y-0 my-auto">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Execute IT Transaction Overdrive</h3>
                  <p className="text-[10px] text-slate-400">{selectedTx.typeLabel} #{selectedTx.id} · ₱{selectedTx.amount.toFixed(2)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* Select Action */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Select Administrative Overdrive Action:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FORCE_VOID', label: 'Force Void' },
                    { id: 'FORCE_UNVOID', label: 'Reactivate' },
                    { id: 'STATUS_OVERRIDE', label: 'Override Status' },
                    { id: 'PAYMENT_OVERRIDE', label: 'Override Payment' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setOverdriveAction(act.id)}
                      className={`p-2 rounded-xl text-center font-bold text-xs transition cursor-pointer border ${
                        overdriveAction === act.id
                          ? 'bg-amber-500 border-amber-600 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Options */}
              {overdriveAction === 'FORCE_VOID' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Emergency Force Void Bypasses Cashier Locks</span>
                  </div>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restoreStock}
                        onChange={(e) => setRestoreStock(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Automatically restore inventory stock counts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={adjustCashDrawer}
                        onChange={(e) => setAdjustCashDrawer(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>Reconcile/adjust cash register drawer balance</span>
                    </label>
                  </div>
                </div>
              )}

              {overdriveAction === 'STATUS_OVERRIDE' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Set New Status:</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:outline-none"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="VOIDED">VOIDED</option>
                    <option value="REFUNDED">REFUNDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="SETTLED">SETTLED</option>
                  </select>
                </div>
              )}

              {overdriveAction === 'PAYMENT_OVERRIDE' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700">Set Payment Method:</label>
                  <select
                    value={targetPaymentMethod}
                    onChange={(e) => setTargetPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Salary Deduction">Salary Deduction</option>
                    <option value="Coop Share">Coop Share</option>
                    <option value="Complimentary">Complimentary / Plant Subsidy</option>
                  </select>
                </div>
              )}

              {/* Justification Reason (Required) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  Administrative Justification Reason <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Approved by Plant Operations / Disputed scan clerical error..."
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700">
                  Internal IT Notes / Ticket # (Optional):
                </label>
                <input
                  type="text"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="e.g. IT-Ticket #8841"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverdrive}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Zap className="h-4 w-4" />
                <span>Confirm &amp; Execute Overdrive</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DRAWER CALIBRATION MODAL */}
      {isDrawerCalibrateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden space-y-0 my-auto">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider">Calibrate Cash Drawer Balance</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerCalibrateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Current System Drawer:</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  ₱{Number(canteenDrawer?.currentBalance || 0).toFixed(2)}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Adjustment Amount (PHP):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold font-mono text-slate-500">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    value={calibrationAmount}
                    onChange={(e) => setCalibrationAmount(e.target.value)}
                    placeholder="e.g. +50.00 to add, -50.00 to reduce"
                    className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-50 border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Enter positive number to increase cash float; enter negative to reduce count.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Calibration Reason:
                </label>
                <input
                  type="text"
                  value={calibrationReason}
                  onChange={(e) => setCalibrationReason(e.target.value)}
                  placeholder="e.g. Physical count discrepancy calibration"
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerCalibrateOpen(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDrawerCalibration}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Apply Calibration</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
