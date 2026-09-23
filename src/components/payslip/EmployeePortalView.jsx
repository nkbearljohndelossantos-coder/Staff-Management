import React, { useState } from 'react';
import {
  ScanLine,
  FileText,
  Clock,
  Eye,
  ShieldCheck,
  Camera,
  Trash2,
  Landmark,
  Coins,
  Utensils,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Package,
  ShoppingBag,
  Check,
  Printer
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import { LOAN_CATEGORIES } from '../../data/mockData';
import BarcodeView from '../common/BarcodeView';
import StaffBadgeModal from '../staff/StaffBadgeModal';
import PayslipDocument from './PayslipDocument';
import GatePassModal from '../canteen/GatePassModal';

export default function EmployeePortalView() {
  const {
    currentUser,
    staffList,
    departments,
    positions,
    payRuns,
    attendanceLogs,
    updateStaff,
    coopBalances,
    coopWithdrawals,
    cashLoans,
    cashAdvances,
    requestCashLoan,
    requestCashAdvance,
    requestCoopWithdrawal,
    manufacturingProducts,
    personalPurchaseOrders,
    createPersonalPurchaseOrder,
    canteenGatePasses
  } = useApp();

  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedPayslipData, setSelectedPayslipData] = useState(null);

  // Financial Modals State
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedGatePass, setSelectedGatePass] = useState(null);

  // Form States
  const [loanForm, setLoanForm] = useState({ category: 'cash', principal: '', termMonths: 3, purpose: '' });
  const [advanceForm, setAdvanceForm] = useState({ principal: '', termMonths: 1, reason: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', reason: '' });
  
  // Personal PO Form State
  const [poCart, setPoCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [poQuantity, setPoQuantity] = useState(1);
  const [poPaymentMethod, setPoPaymentMethod] = useState('coop'); // 'cash' | 'coop'
  const [poPurpose, setPoPurpose] = useState('');

  // Find the staff record for the current user
  const currentStaff = staffList.find(s => s.id === currentUser?.staffId) || staffList[2]; // fallback to Alex Rivera
  const dept = departments.find(d => d.id === currentStaff?.departmentId);
  const pos = positions.find(p => p.id === currentStaff?.positionId);

  // Financial calculations for this employee
  const myCoopBalance = coopBalances[currentStaff?.id] || 0;
  const myLoans = cashLoans.filter(l => l.staffId === currentStaff?.id);
  const myAdvances = cashAdvances.filter(ca => ca.staffId === currentStaff?.id);
  const myPurchaseOrders = (personalPurchaseOrders || []).filter(po => po.staffId === currentStaff?.id);
  const myGatePasses = (canteenGatePasses || []).filter(gp => gp.bearerStaffId === currentStaff?.id);
  const myPendingWithdrawals = coopWithdrawals.filter(
    w => w.staffId === currentStaff?.id && w.status === 'Pending Accounting Approval'
  );

  const handleEmployeePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (currentStaff) {
          updateStaff(currentStaff.id, { avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter attendance logs for this staff
  const myAttendance = attendanceLogs.filter(l => l.staffId === currentStaff?.id);

  // Find all payslips belonging to this staff across all pay runs
  const myPayslips = [];
  payRuns.forEach(run => {
    const item = run.items?.find(i => i.staffId === currentStaff?.id);
    if (item) {
      myPayslips.push({
        payRun: run,
        item
      });
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner (White Card, High Contrast) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="relative group shrink-0">
            <img
              src={currentStaff?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStaff?.firstName}`}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-sm bg-slate-100"
            />
            <label
              htmlFor="employee-portal-photo-input"
              title="Upload / Change Profile Picture"
              className="absolute inset-0 bg-slate-900/80 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition"
            >
              <Camera className="h-5 w-5 mb-0.5 text-slate-300" />
              Upload
            </label>
            <input
              id="employee-portal-photo-input"
              type="file"
              accept="image/*"
              onChange={handleEmployeePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Employee Self-Service (ESS)
              </div>
              <label
                htmlFor="employee-portal-photo-input"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-bold cursor-pointer transition"
              >
                <Camera className="h-3 w-3 text-slate-600" />
                Change Picture
              </label>
              {currentStaff?.avatar && (
                <button
                  type="button"
                  onClick={() => updateStaff(currentStaff.id, { avatar: '' })}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-[10px] font-medium cursor-pointer transition"
                >
                  <Trash2 className="h-2.5 w-2.5 text-slate-600" />
                  Reset
                </button>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {currentStaff?.firstName} {currentStaff?.lastName}
            </h2>
            <p className="text-xs text-slate-600">
              {pos?.title || 'Staff'} · <span className="text-slate-800 font-semibold">{dept?.name || 'Department'}</span>
            </p>
            <p className="font-mono text-xs text-slate-900 font-bold">
              Employee ID: {currentStaff?.employeeId}
            </p>
          </div>
        </div>

        {/* Digital Badge Snippet */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 shrink-0">
          <div className="bg-white rounded-lg p-2 shadow-inner border border-slate-200">
            <BarcodeView
              value={currentStaff?.barcodeValue || currentStaff?.employeeId}
              width={1.2}
              height={28}
              displayValue={false}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowBadgeModal(true)}
            className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <ScanLine className="h-3.5 w-3.5 text-white" />
            Print Digital ID Badge
          </button>
        </div>
      </div>

      {/* Employee Financial Services: Coop Share, Loans, Canteen Advance & Personal PO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Coop Share Capital */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-slate-600" />
              My Coop Share Capital
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Active Equity
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(myCoopBalance)}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cooperative capital ownership &amp; savings equity
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setWithdrawForm({ amount: '', reason: '' });
                setShowWithdrawModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition shadow-sm"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
              Request Withdrawal (via Accounting)
            </button>
          </div>
          {myPendingWithdrawals.length > 0 && (
            <div className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Pending Accounting: {formatCurrency(myPendingWithdrawals[0].amount)}</span>
            </div>
          )}
        </div>

        {/* Card 2: Cash Loans (2%, 3%, 5%) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-slate-600" />
              Cash Loans (HR Managed)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Rates: 2%, 3%, 5%
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(myLoans.reduce((sum, l) => sum + (l.status === 'Approved' ? l.balanceRemaining : 0), 0))}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Deducted semi-monthly from salary &amp; funded via Coop
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setLoanForm({ category: 'cash', principal: '', termMonths: 3, purpose: '' });
                setShowLoanModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Apply for Cash Loan
            </button>
          </div>
        </div>

        {/* Card 3: Canteen Cash Advance (1.5% fee) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-slate-600" />
              Canteen Cash Advance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              1.5% Salary Fee
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatCurrency(myAdvances.reduce((sum, ca) => sum + (ca.status === 'Active' ? ca.balanceRemaining : 0), 0))}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Claimed from Canteen drawer under HR authority
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAdvanceForm({ principal: '', termMonths: 1, reason: '' });
                setShowAdvanceModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Request Cash Advance
            </button>
          </div>
        </div>

        {/* Card 4: Request Order (Personal Purchase Order) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-slate-600" />
              Request Orders (PO)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Manufactured Goods
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-slate-900">
              {myPurchaseOrders.length} {myPurchaseOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              NKB Manufactured Goods · Cash or COOP
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setPoCart([]);
                setPoPaymentMethod('coop');
                setPoPurpose('');
                setShowPOModal(true);
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Request Order
            </button>
          </div>
        </div>
      </div>

      {/* Active Loans & Cash Advances Schedule */}
      {(myLoans.length > 0 || myAdvances.length > 0) && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
              My Credit Obligations &amp; Payroll Deduction Schedule
            </h4>
            <span className="text-[11px] text-slate-500">Semi-monthly payroll deductions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myLoans.map(l => (
              <div key={l.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{l.categoryLabel}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {l.interestRate}%/mo
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {l.status === 'Approved' ? 'Active / Disbursed' : l.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Repayable</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(l.totalRepayable)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Per-Cutoff</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(l.cutoffDeduction)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Remaining</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(l.balanceRemaining)}</span>
                  </div>
                </div>
              </div>
            ))}

            {myAdvances.map(ca => (
              <div key={ca.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Canteen Cash Advance</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                      1.5% Fee
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {ca.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Principal + Fee</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(ca.totalRepayable)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Per-Cutoff</span>
                    <span className="font-mono font-bold text-slate-900">{formatCurrency(ca.cutoffDeduction)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Remaining</span>
                    <span className="font-mono font-bold text-slate-700">{formatCurrency(ca.balanceRemaining)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Request Orders (Personal Use - Manufactured Goods) Section */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-600" />
              My Personal Request Orders (NKB Manufactured Goods)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Payment via Cash (Receivable by Accounting) or COOP Share Capital
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPoCart([]);
              setPoPaymentMethod('coop');
              setPoPurpose('');
              setShowPOModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 text-white" />
            Request Order
          </button>
        </div>

        {myPurchaseOrders.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <Package className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No personal purchase orders requested yet.</p>
            <p className="text-[11px] text-slate-500">
              Need factory-manufactured goods at discounted employee prices? Click &ldquo;Request Order&rdquo; to place a personal order.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">PO Number</th>
                  <th className="px-4 py-2.5">Date Requested</th>
                  <th className="px-4 py-2.5">Manufactured Products</th>
                  <th className="px-4 py-2.5 text-right">Total Amount</th>
                  <th className="px-4 py-2.5">Payment Method</th>
                  <th className="px-4 py-2.5">Accounting / COOP Status</th>
                  <th className="px-4 py-2.5 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myPurchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{po.poNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(po.requestedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {po.items?.map((i, idx) => (
                          <div key={idx}>
                            <span className="font-bold text-slate-800">{i.quantity}x {i.name}</span>
                            {i.sku && <span className="block font-mono text-[10px] text-slate-500">{i.sku}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">₱{po.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {po.paymentMethod === 'cash' ? (
                        <div>
                          <span className="font-bold text-slate-900 block">Cash</span>
                          <span className="text-[10px] text-slate-500">Receivable by Accounting</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900 block">COOP Share</span>
                          <span className="text-[10px] text-slate-500">Deducted from Capital</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      {po.accountingReceivableStatus || po.coopDeductionStatus || po.paymentStatus}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        po.status === 'Fulfilled' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Canteen Grocery Gate Passes (Half-A4 Printable) */}
      {myGatePasses.length > 0 && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-600" />
                My Canteen Grocery Gate Passes (Half-A4 Size)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official plant security exit passes for personal grocery purchases
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {myGatePasses.length} {myGatePasses.length === 1 ? 'Gate Pass' : 'Gate Passes'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Pass Number</th>
                  <th className="px-4 py-2.5">Issued Date &amp; Time</th>
                  <th className="px-4 py-2.5">Grocery Items Cleared</th>
                  <th className="px-4 py-2.5 text-right">Total Amount</th>
                  <th className="px-4 py-2.5">Security Gate Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myGatePasses.map(gp => (
                  <tr key={gp.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{gp.gatePassNo}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(gp.issuedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 max-w-xs">
                        {gp.items?.map((it, idx) => (
                          <span key={idx} className="block text-[11px] font-medium text-slate-800">
                            {it.quantity}x {it.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(gp.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        gp.gateStatus === 'Cleared at Gate' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {gp.gateStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedGatePass(gp)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                      >
                        <Printer className="h-3.5 w-3.5 text-white" />
                        Print Gate Pass (Half A4)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Grid: Payslips History + Attendance Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Payslips (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              My Official Payslips ({myPayslips.length})
            </h3>
            <span className="text-xs text-slate-500">View and print confidential salary slips</span>
          </div>

          <div className="space-y-3">
            {myPayslips.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center text-slate-400 text-xs shadow-sm">
                No payslips calculated for your account yet.
              </div>
            ) : (
              myPayslips.map(({ payRun, item }) => (
                <div
                  key={payRun.id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{payRun.code}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {payRun.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{payRun.title}</h4>
                    <p className="text-[11px] text-slate-500">
                      Period: {payRun.periodStart} ~ {payRun.periodEnd} · Payout: {payRun.payDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block font-medium">Take-Home Pay</span>
                      <span className="text-sm font-black font-mono text-slate-900">
                        {formatCurrency(item.netPay)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPayslipData({ payRun, item })}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-white" />
                      View Payslip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Attendance Records (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600" />
              Recent Timeclock Activity
            </h3>
            <span className="text-xs text-slate-500">Barcode Punches</span>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
            {myAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No timeclock records logged today.</p>
            ) : (
              myAttendance.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-700 font-bold block">{log.date}</span>
                    <span className="text-[10px] font-bold text-slate-600">
                      {log.status}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-slate-900 font-bold">In: {log.timeIn}</div>
                    <div className="text-slate-500 text-[11px]">Out: {log.timeOut || 'Active'}</div>
                  </div>
                </div>
              ))
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              💡 <strong>Tip:</strong> Scan your physical badge or barcode at the entrance terminal kiosk to log your shift punches.
            </div>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showBadgeModal && (
        <StaffBadgeModal
          staff={currentStaff}
          department={dept}
          position={pos}
          onClose={() => setShowBadgeModal(false)}
        />
      )}

      {selectedPayslipData && (
        <PayslipDocument
          staff={currentStaff}
          payRun={selectedPayslipData.payRun}
          item={selectedPayslipData.item}
          onClose={() => setSelectedPayslipData(null)}
        />
      )}

      {/* Modal: Apply for Cash Loan */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-slate-600" />
                Apply for Cash Loan
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              💡 <strong>2-Stage Approval Process:</strong> Once endorsed by HR, your loan is forwarded to the <strong>Accounting Department</strong> for approval and withdrawal from the <strong>Coop Share Capital pool</strong> before salary deductions take effect.
              Interest rates: <strong>Cash / Medical / Motor = 2%/mo</strong>, <strong>Gadget / Education = 3%/mo</strong>, <strong>Appliance = 5%/mo</strong>.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Loan Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOAN_CATEGORIES.map(cat => {
                    const isSel = loanForm.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLoanForm({ ...loanForm, category: cat.id })}
                        className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">{cat.label}</div>
                        <div className={`text-[10px] font-bold ${isSel ? 'text-slate-300' : 'text-slate-500'}`}>
                          {cat.monthlyRate}% monthly interest
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Requested Amount (PHP)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={loanForm.principal}
                    onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Repayment Term</label>
                  <select
                    value={loanForm.termMonths}
                    onChange={(e) => setLoanForm({ ...loanForm, termMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value={1}>1 Month (2 cutoffs)</option>
                    <option value={2}>2 Months (4 cutoffs)</option>
                    <option value={3}>3 Months (6 cutoffs)</option>
                    <option value={4}>4 Months (8 cutoffs)</option>
                    <option value={6}>6 Months (12 cutoffs)</option>
                    <option value={12}>12 Months (24 cutoffs)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Repayment Calculation Preview */}
              {Number(loanForm.principal) > 0 && (() => {
                const p = Number(loanForm.principal);
                const t = Number(loanForm.termMonths);
                const r = loanForm.category === 'appliance' ? 5 : (loanForm.category === 'gadget' || loanForm.category === 'education' ? 3 : 2);
                const int = Math.round(p * (r / 100) * t);
                const tot = p + int;
                const cut = Math.round(tot / (t * 2));
                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Interest Rate:</span>
                      <span className="font-bold text-slate-900">{r}% / month</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Interest over {t} mos:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(int)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total to Repay:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(tot)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                      <span>Semi-Monthly Cutoff Deduction:</span>
                      <span>{formatCurrency(cut)} / paycheck</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason / Purpose of Loan</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase of laptop / Home improvement"
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowLoanModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!loanForm.principal) return;
                  requestCashLoan({ ...loanForm, staffId: currentStaff.id });
                  setShowLoanModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit Loan Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Cash Advance */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-slate-600" />
                Request Canteen Cash Advance
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              🍽️ <strong>Canteen Authority Notice:</strong> Cash Advances are disbursed directly from the <strong>Canteen&apos;s physical cash drawer</strong>.
              A flat <strong>1.5% fee</strong> applies and will be deducted from your salary across the chosen terms.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Advance Amount (PHP)</label>
                <input
                  type="number"
                  placeholder="e.g. 3000"
                  value={advanceForm.principal}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, principal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Repayment Term</label>
                <select
                  value={advanceForm.termMonths}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, termMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value={1}>1 Month (2 semi-monthly cutoffs)</option>
                  <option value={2}>2 Months (4 semi-monthly cutoffs)</option>
                </select>
              </div>

              {Number(advanceForm.principal) > 0 && (() => {
                const p = Number(advanceForm.principal);
                const fee = Math.round(p * 0.015);
                const tot = p + fee;
                const cut = Math.round(tot / (advanceForm.termMonths * 2));
                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between text-slate-600">
                      <span>Canteen Processing Fee (1.5%):</span>
                      <span className="font-bold text-slate-900">{formatCurrency(fee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Salary Deduction:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(tot)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                      <span>Per-Paycheck Deduction:</span>
                      <span>{formatCurrency(cut)} / cutoff</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Daily meals, fare, emergency cash"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!advanceForm.principal) return;
                  requestCashAdvance({ ...advanceForm, staffId: currentStaff.id });
                  setShowAdvanceModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit Request to Canteen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Coop Withdrawal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-slate-600" />
                Request Share Capital Withdrawal
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              ⚠️ <strong>Accounting Approval Workflow:</strong> Your withdrawal request is submitted by HR directly to the <strong>Accounting Department</strong> for review and fund release.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Available Share Capital: <span className="font-mono text-slate-900 font-bold">{formatCurrency(myCoopBalance)}</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason for Withdrawal</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Emergency family expense, medical needs"
                  value={withdrawForm.reason}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!withdrawForm.amount) return;
                  const res = requestCoopWithdrawal(currentStaff.id, withdrawForm.amount, withdrawForm.reason);
                  if (res?.success) setShowWithdrawModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit to Accounting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Personal Purchase Order (Personal Use) */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-600" />
                Request Order (Personal Purchase Order - NKB Manufactured Goods)
              </h3>
              <button 
                type="button"
                onClick={() => setShowPOModal(false)} 
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed">
              ⚙️ Order <strong>NKB Manufacturing Corp. factory-produced products &amp; machinery</strong> for personal use at discounted employee factory prices. Choose payment via <strong>Cash (receivable by accounting)</strong> or <strong>COOP Share Capital deduction</strong>.
            </div>

            {/* Product Selector to add into order */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Manufactured Product</label>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer text-xs"
                  >
                    <option value="">Choose a manufactured product...</option>
                    {(manufacturingProducts || []).map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.name} ({p.sku}) · ₱{p.employeePrice.toLocaleString()} [Save ₱{(p.regularPrice - p.employeePrice).toLocaleString()}] ({p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-center font-bold text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProductId) return;
                      const prod = (manufacturingProducts || []).find(p => p.id === selectedProductId);
                      if (!prod) return;
                      setPoCart(prev => {
                        const exist = prev.find(i => i.id === prod.id);
                        if (exist) {
                          return prev.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + poQuantity } : i);
                        }
                        return [...prev, {
                          id: prod.id,
                          name: prod.name,
                          sku: prod.sku,
                          modelNumber: prod.modelNumber,
                          plantLocation: prod.plantLocation,
                          price: prod.employeePrice,
                          regularPrice: prod.regularPrice,
                          quantity: poQuantity,
                          barcode: prod.barcode
                        }];
                      });
                      setSelectedProductId('');
                      setPoQuantity(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer text-xs"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Product Specifications Preview */}
              {(() => {
                const sel = (manufacturingProducts || []).find(p => p.id === selectedProductId);
                if (!sel) return null;
                return (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{sel.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{sel.sku}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">{sel.specs}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <span><strong>Plant:</strong> {sel.plantLocation}</span>
                      <span><strong>Warranty:</strong> {sel.warranty}</span>
                      <span><strong>SRP:</strong> ₱{sel.regularPrice.toLocaleString()}</span>
                      <span className="text-slate-900 font-bold"><strong>Employee Price:</strong> ₱{sel.employeePrice.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Order Cart List */}
              <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/70 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Manufactured Products in Order ({poCart.length})
                </span>
                {poCart.length === 0 ? (
                  <p className="text-slate-400 text-[11px] py-2 text-center">No manufacturing products added yet.</p>
                ) : (
                  poCart.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-none text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{item.quantity}x {item.name}</span>
                        {item.sku && <span className="text-slate-500 block text-[10px] font-mono">{item.sku} · ₱{item.price.toFixed(2)} each</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">₱{(item.price * item.quantity).toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setPoCart(prev => prev.filter(i => i.id !== item.id))}
                          className="text-slate-400 hover:text-slate-700 text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Order Amount & Payment Selection */}
              {(() => {
                const totalOrderAmt = poCart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
                const isInsufficientCoop = poPaymentMethod === 'coop' && totalOrderAmt > myCoopBalance;

                return (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200">
                      <span className="font-bold text-slate-700">Total Purchase Order:</span>
                      <span className="text-base font-black text-slate-900 font-mono">₱{totalOrderAmt.toFixed(2)}</span>
                    </div>

                    {/* Payment Options: Cash (receivable by accounting) or COOP */}
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">
                        Select Payment Option <span className="text-slate-400">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        
                        {/* Option 1: Cash (Receivable by Accounting) */}
                        <button
                          type="button"
                          onClick={() => setPoPaymentMethod('cash')}
                          className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                            poPaymentMethod === 'cash'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>Cash</span>
                            {poPaymentMethod === 'cash' && <Check className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${poPaymentMethod === 'cash' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Receivable by Accounting
                          </div>
                          <p className={`text-[9px] mt-1 leading-relaxed ${poPaymentMethod === 'cash' ? 'text-slate-400' : 'text-slate-400'}`}>
                            Payable at Accounting Office Cashier upon receipt issuance.
                          </p>
                        </button>

                        {/* Option 2: COOP Share Capital */}
                        <button
                          type="button"
                          onClick={() => setPoPaymentMethod('coop')}
                          className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                            poPaymentMethod === 'coop'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>COOP Share Capital</span>
                            {poPaymentMethod === 'coop' && <Check className="h-3.5 w-3.5 text-white" />}
                          </div>
                          <div className={`text-[10px] mt-0.5 ${poPaymentMethod === 'coop' ? 'text-slate-300' : 'text-slate-500'}`}>
                            Balance: ₱{myCoopBalance.toLocaleString()}
                          </div>
                          <p className={`text-[9px] mt-1 leading-relaxed ${poPaymentMethod === 'coop' ? 'text-slate-400' : 'text-slate-400'}`}>
                            Directly deducted from your available Coop Share balance.
                          </p>
                        </button>

                      </div>
                    </div>

                    {isInsufficientCoop && (
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-slate-600 shrink-0" />
                        <span>
                          Insufficient Coop Share Capital! You need ₱{totalOrderAmt.toLocaleString()}, but have ₱{myCoopBalance.toLocaleString()}. Choose <strong>Cash (Receivable by Accounting)</strong> instead.
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Purpose / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Home workshop fabrication, garage utility repairs, residential use"
                        value={poPurpose}
                        onChange={(e) => setPoPurpose(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowPOModal(false)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={poCart.length === 0 || isInsufficientCoop}
                        onClick={() => {
                          if (poCart.length === 0 || isInsufficientCoop) return;
                          const res = createPersonalPurchaseOrder({
                            staffId: currentStaff.id,
                            items: poCart,
                            paymentMethod: poPaymentMethod,
                            purpose: poPurpose
                          });
                          if (res?.success) {
                            setShowPOModal(false);
                            setPoCart([]);
                            setPoPurpose('');
                          }
                        }}
                        className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 text-white" />
                        Submit Request Order
                      </button>
                    </div>
                  </>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* Modal: View & Print Gate Pass (Half A4 / A5) */}
      {selectedGatePass && (
        <GatePassModal
          gatePass={selectedGatePass}
          onClose={() => setSelectedGatePass(null)}
        />
      )}

    </div>
  );
}
