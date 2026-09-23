import React, { useState } from 'react';
import {
  Landmark,
  Banknote,
  Coins,
  Utensils,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Activity,
  Bike,
  GraduationCap,
  Smartphone,
  Tv,
  Wallet,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import { LOAN_CATEGORIES } from '../../data/mockData';

export default function CoopLoansManager() {
  const {
    currentUser,
    isSuperAdmin,
    isHR,
    isAccounting,
    isCanteen,
    staffList,
    departments,
    coopBalances,
    coopLedger,
    coopWithdrawals,
    depositCoopShare,
    requestCoopWithdrawal,
    accountingApproveWithdrawal,
    accountingRejectWithdrawal,
    cashLoans,
    requestCashLoan,
    approveCashLoan,
    rejectCashLoan,
    accountingApproveLoan,
    accountingRejectLoan,
    canteenDrawer,
    cashAdvances,
    requestCashAdvance,
    hrAcceptCashAdvance,
    hrDeclineCashAdvance,
    claimCashAdvance,
    replenishCanteenCash,
    canteenReceipts,
    confirmCanteenSalaryDeduction
  } = useApp();

  const [subTab, setSubTab] = useState('coop'); // 'coop', 'loans', 'canteen'

  // Modal States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [showNewAdvanceModal, setShowNewAdvanceModal] = useState(false);

  // Form States
  const [depositForm, setDepositForm] = useState({ staffId: staffList[0]?.id || '', amount: '', note: '' });
  const [withdrawForm, setWithdrawForm] = useState({ staffId: staffList[0]?.id || '', amount: '', reason: '' });
  const [loanForm, setLoanForm] = useState({
    staffId: staffList[0]?.id || '',
    category: 'cash',
    principal: '',
    termMonths: 3,
    purpose: ''
  });
  const [replenishAmount, setReplenishAmount] = useState('');
  const [replenishNote, setReplenishNote] = useState('');
  const [advanceForm, setAdvanceForm] = useState({
    staffId: staffList[0]?.id || '',
    principal: '',
    termMonths: 1,
    reason: ''
  });

  // Filter States
  const [loanCatFilter, setLoanCatFilter] = useState('all');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');

  // Summary Metrics
  const totalCoopCapital = Object.values(coopBalances).reduce((sum, b) => sum + (Number(b) || 0), 0);
  const totalActiveLoans = cashLoans
    .filter(l => l.status === 'Approved' && l.balanceRemaining > 0)
    .reduce((sum, l) => sum + l.balanceRemaining, 0);
  const pendingAccountingWithdrawals = coopWithdrawals.filter(w => w.status === 'Pending Accounting Approval');
  const pendingHRLoans = cashLoans.filter(l => l.status === 'Pending HR');
  const pendingAccountingLoans = cashLoans.filter(l => l.status === 'Pending Accounting Approval');
  const pendingCanteenClaims = cashAdvances.filter(ca => ca.status === 'Pending Canteen Claim');
  const canteenSalaryDeductions = (canteenReceipts || []).filter(r => r.paymentMethod === 'Salary Deduction');
  const pendingCanteenSalaryDeductions = canteenSalaryDeductions.filter(
    r => r.salaryDeductionStatus !== 'Confirmed by HR - Deducted to Bank & COOP'
  );

  // Helper for category icon (all monochrome)
  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'medical': return Activity;
      case 'motor': return Bike;
      case 'education': return GraduationCap;
      case 'gadget': return Smartphone;
      case 'appliance': return Tv;
      default: return Banknote;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats (Light Theme, Monochrome Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Coop Fund */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Coop Share Capital Pool</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Landmark className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(totalCoopCapital)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total member equity across {Object.keys(coopBalances).length} enrolled staff
          </p>
        </div>

        {/* Metric 2: Active Loans */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Cash Loans</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Coins className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(totalActiveLoans)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Funded via Coop Share · Tiered (2%, 3%, 5%)
          </p>
        </div>

        {/* Metric 3: Canteen Cash Drawer */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Canteen Cash Drawer</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatCurrency(canteenDrawer.balance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Canteen authority fund · 1.5% fee on advances
          </p>
        </div>

        {/* Metric 4: Pending Actions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {pendingAccountingWithdrawals.length + pendingHRLoans.length + pendingCanteenClaims.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {pendingHRLoans.length} HR Loans · {pendingAccountingWithdrawals.length} Acct Withdr. · {pendingCanteenClaims.length} CA Claims
          </p>
        </div>
      </div>

      {/* Main Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/90 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSubTab('coop')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'coop'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Landmark className={`h-4 w-4 ${subTab === 'coop' ? 'text-white' : 'text-slate-600'}`} />
            <span>Coop Share Capital</span>
            {pendingAccountingWithdrawals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black">
                {pendingAccountingWithdrawals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('loans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'loans'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Coins className={`h-4 w-4 ${subTab === 'loans' ? 'text-white' : 'text-slate-600'}`} />
            <span>Cash Loans (HR)</span>
            {pendingHRLoans.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black">
                {pendingHRLoans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('canteen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              subTab === 'canteen'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Utensils className={`h-4 w-4 ${subTab === 'canteen' ? 'text-white' : 'text-slate-600'}`} />
            <span>Canteen Cash Advance</span>
            {pendingCanteenClaims.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black">
                {pendingCanteenClaims.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('canteen_deductions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              subTab === 'canteen_deductions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className={`h-4 w-4 ${subTab === 'canteen_deductions' ? 'text-white' : 'text-slate-600'}`} />
            <span>Canteen Deductions</span>
            {pendingCanteenSalaryDeductions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black">
                {pendingCanteenSalaryDeductions.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {subTab === 'coop' && isHR && (
            <>
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
                Deposit Share
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-300 shadow-sm cursor-pointer transition"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
                Request Withdrawal to Accounting
              </button>
            </>
          )}

          {subTab === 'loans' && isHR && (
            <button
              onClick={() => setShowNewLoanModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Encode New Cash Loan
            </button>
          )}

          {subTab === 'canteen' && (
            isHR ? (
              <>
                <button
                  onClick={() => setShowReplenishModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <Plus className="h-3.5 w-3.5 text-slate-600" />
                  Replenish Drawer
                </button>
                <button
                  onClick={() => setShowNewAdvanceModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  Encode Advance Request
                </button>
              </>
            ) : (
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                Canteen Drawer: Managed under HR Authority
              </span>
            )
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: COOP SHARE CAPITAL */}
      {/* ========================================================================= */}
      {subTab === 'coop' && (
        <div className="space-y-6">
          
          {/* Accounting Approvals Queue Banner (if any pending) */}
          {(pendingAccountingWithdrawals.length > 0 || pendingAccountingLoans.length > 0) && (
            <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                    <ShieldCheck className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900">
                        Accounting Authorization Queue ({pendingAccountingWithdrawals.length + pendingAccountingLoans.length})
                      </h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                        {isSuperAdmin
                          ? `Super Admin: ${currentUser?.name} (${currentUser?.role?.toUpperCase()})`
                          : isAccounting
                          ? 'Authorized: David Chen (Accounting)'
                          : 'View-Only for HR (Elena Vance)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isSuperAdmin
                        ? 'Super Admin clearance: Universal authority to endorse loans, disburse funds, and approve share withdrawals.'
                        : isAccounting
                        ? 'You have sole authority to release Coop Share Capital and approve withdrawal disbursements.'
                        : 'Elena Vance (HR) requested these disbursements. Sign in with an Accounting or Super Admin account to authorize release.'}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-slate-500 sm:text-right">
                  Role: <strong className="text-slate-900">{currentUser?.name || 'Staff'}</strong> ({currentUser?.role?.toUpperCase()})
                </div>
              </div>

              {/* Share Withdrawals Section */}
              {pendingAccountingWithdrawals.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    • Share Capital Withdrawal Requests ({pendingAccountingWithdrawals.length})
                  </div>
                  {pendingAccountingWithdrawals.map(req => {
                    const staff = staffList.find(s => s.id === req.staffId);
                    const currBal = coopBalances[req.staffId] || 0;
                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {staff?.firstName} {staff?.lastName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {staff?.employeeId}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 font-bold uppercase">
                              Share Withdrawal
                            </span>
                          </div>
                          <p className="text-xs text-slate-700">
                            Requested Amount: <strong className="font-mono text-slate-900">{formatCurrency(req.amount)}</strong> · Current Share Balance: <span className="font-mono text-slate-500">{formatCurrency(currBal)}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 italic">
                            Reason: &ldquo;{req.reason}&rdquo; · Submitted by {req.requestedBy}
                          </p>
                        </div>

                        {isAccounting ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => accountingApproveWithdrawal(req.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              Approve &amp; Disburse
                            </button>
                            <button
                              onClick={() => accountingRejectWithdrawal(req.id, 'Declined by Accounting')}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-300 cursor-pointer transition"
                            >
                              <XCircle className="h-3.5 w-3.5 text-slate-600" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5 shrink-0">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>Awaiting Accounting Sign-off (David Chen)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cash Loans Awaiting Accounting Withdrawal Section */}
              {pendingAccountingLoans.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                    • Cash Loans Endorsed by HR (Awaiting Accounting Withdrawal &amp; Disbursement) ({pendingAccountingLoans.length})
                  </div>
                  {pendingAccountingLoans.map(loan => {
                    const staff = staffList.find(s => s.id === loan.staffId);
                    return (
                      <div
                        key={loan.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {staff?.firstName} {staff?.lastName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {staff?.employeeId}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 font-bold uppercase">
                              {loan.categoryLabel} ({loan.interestRate}%/mo)
                            </span>
                          </div>
                          <p className="text-xs text-slate-700">
                            Principal: <strong className="font-mono text-slate-900">{formatCurrency(loan.principal)}</strong> · Term: <span className="font-mono text-slate-600">{loan.termMonths} mos</span> · Semi-Monthly Cutoff: <strong className="font-mono text-slate-900">{formatCurrency(loan.cutoffDeduction)}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500 italic">
                            Purpose: &ldquo;{loan.purpose}&rdquo; · Endorsed by {loan.hrApprovedBy || 'HR'}
                          </p>
                        </div>

                        {isAccounting ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => accountingApproveLoan(loan.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              Approve &amp; Disburse (Withdraw from Coop)
                            </button>
                            <button
                              onClick={() => accountingRejectLoan(loan.id, 'Declined by Accounting')}
                              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-300 cursor-pointer transition"
                            >
                              <XCircle className="h-3.5 w-3.5 text-slate-600" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5 shrink-0">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>Awaiting Accounting Sign-off (David Chen)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* Member Coop Share Balances Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-slate-600" />
                  Employee Cooperative Share Capital Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Individual equity accounts maintained under HR supervision
                </p>
              </div>
              <span className="text-xs font-mono text-slate-900 font-bold">
                Total Fund: {formatCurrency(totalCoopCapital)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Share Capital Balance</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                  {staffList.map((staff) => {
                    const balance = coopBalances[staff.id] || 0;
                    const dept = departments.find(d => d.id === staff.departmentId);
                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                              alt="Avatar"
                              className="w-8 h-8 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0 shadow-sm"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {staff.firstName} {staff.lastName}
                              </div>
                              <div className="text-[11px] text-slate-500">{staff.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {staff.employeeId}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {dept?.name || 'Department'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {formatCurrency(balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isHR ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setDepositForm({ staffId: staff.id, amount: '', note: '' });
                                  setShowDepositModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-bold cursor-pointer transition shadow-sm"
                              >
                                Deposit
                              </button>
                              <button
                                onClick={() => {
                                  setWithdrawForm({ staffId: staff.id, amount: '', reason: '' });
                                  setShowWithdrawModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[11px] font-bold cursor-pointer transition shadow-sm"
                              >
                                Withdraw Req.
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold inline-block">
                              Audit View
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Coop Ledger Activities */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-600" />
              Cooperative Fund Transaction Ledger
            </h4>
            <div className="space-y-2">
              {coopLedger.slice(0, 8).map(entry => {
                const staff = staffList.find(s => s.id === entry.staffId);
                const isDeposit = entry.type === 'deposit';
                return (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm">
                        {isDeposit ? <ArrowDownLeft className="h-4 w-4 text-slate-600" /> : <ArrowUpRight className="h-4 w-4 text-slate-600" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {staff?.firstName} {staff?.lastName} ({staff?.employeeId})
                        </div>
                        <div className="text-[11px] text-slate-500">{entry.note}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">
                        {isDeposit ? '+' : '-'}{formatCurrency(entry.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{entry.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: CASH LOANS (HR MANAGED) */}
      {/* ========================================================================= */}
      {subTab === 'loans' && (
        <div className="space-y-6">

          {/* Business Logic Explainer Banner */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2-Stage Cash Loan Approval &amp; Coop Share Withdrawal Policy
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Stage 1: <strong>HR Approval</strong> reviews and endorses the employee&apos;s loan request.
                  Stage 2: <strong>Accounting Approval (Withdrawal)</strong> authorizes the release. Only once approved by Accounting are the funds withdrawn/debited from the <strong>Coop Share Capital pool</strong> and scheduled for semi-monthly payroll deductions.
                  Monthly interest rates: <strong>Cash / Medical / Motor = 2%</strong>, <strong>Gadget / Education = 3%</strong>, <strong>Appliance = 5%</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Loan Category & Status Filters */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
              <button
                onClick={() => setLoanStatusFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loanStatusFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                All Statuses ({cashLoans.length})
              </button>
              <button
                onClick={() => setLoanStatusFilter('Pending HR')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loanStatusFilter === 'Pending HR'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                1. Pending HR ({pendingHRLoans.length})
              </button>
              <button
                onClick={() => setLoanStatusFilter('Pending Accounting Approval')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loanStatusFilter === 'Pending Accounting Approval'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                2. Pending Accounting ({pendingAccountingLoans.length})
              </button>
              <button
                onClick={() => setLoanStatusFilter('Approved')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loanStatusFilter === 'Approved'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                Active / Disbursed ({cashLoans.filter(l => l.status === 'Approved').length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Category:</span>
              <button
                onClick={() => setLoanCatFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                  loanCatFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                All Categories
              </button>
              {LOAN_CATEGORIES.map(cat => {
                const Icon = getCategoryIcon(cat.id);
                const count = cashLoans.filter(l => l.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setLoanCatFilter(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                      loanCatFilter === cat.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-600" />
                    <span>{cat.label} ({cat.monthlyRate}%)</span>
                    <span className="text-[10px] opacity-75">[{count}]</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loans List */}
          <div className="space-y-3">
            {cashLoans
              .filter(l => (loanCatFilter === 'all' || l.category === loanCatFilter) &&
                           (loanStatusFilter === 'all' || l.status === loanStatusFilter))
              .map(loan => {
                const staff = staffList.find(s => s.id === loan.staffId);
                const Icon = getCategoryIcon(loan.category);
                const isPendingHR = loan.status === 'Pending HR';
                const isPendingAccounting = loan.status === 'Pending Accounting Approval';
                const isApproved = loan.status === 'Approved';

                return (
                  <div
                    key={loan.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition shadow-sm space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {loan.categoryLabel}
                            </h4>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                              {loan.interestRate}% monthly rate
                            </span>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                              {isApproved ? 'Active / Disbursed' : loan.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Borrower: <strong className="text-slate-800">{staff?.firstName} {staff?.lastName}</strong> ({staff?.employeeId}) · {loan.purpose}
                            {loan.hrApprovedBy && <span className="ml-2 text-slate-700 font-medium">· Endorsed by: {loan.hrApprovedBy}</span>}
                          </p>
                        </div>
                      </div>

                      {/* Stage 1: HR Approval Button */}
                      {isPendingHR && isHR && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveCashLoan(loan.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            HR Endorse to Accounting
                          </button>
                          <button
                            onClick={() => rejectCashLoan(loan.id, 'Declined by HR')}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer transition"
                          >
                            <XCircle className="h-3.5 w-3.5 text-slate-600" />
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Stage 2: Accounting Approval Button */}
                      {isPendingAccounting && isAccounting && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => accountingApproveLoan(loan.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            Authorize &amp; Disburse from Coop
                          </button>
                          <button
                            onClick={() => accountingRejectLoan(loan.id, 'Declined by Accounting')}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer transition"
                          >
                            <XCircle className="h-3.5 w-3.5 text-slate-600" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Loan Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Principal Amount</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(loan.principal)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Interest ({loan.interestRate}%/mo)</span>
                        <span className="font-mono font-bold text-slate-700 text-sm">
                          +{formatCurrency(loan.totalInterest)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Repayable</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(loan.totalRepayable)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Cut-off Deduction ({loan.termMonths} mos)</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(loan.cutoffDeduction)} / cutoff
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Status note: {loan.status}</span>
                      <div>
                        <span className="mr-2">Remaining Balance:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(loan.balanceRemaining)}
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: CANTEEN CASH ADVANCE */}
      {/* ========================================================================= */}
      {subTab === 'canteen' && (
        <div className="space-y-6">

          {/* Canteen Policy Notice */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Utensils className="h-6 w-6 text-slate-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Canteen Management Authority &amp; Physical Cash Workflow
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cash advances are managed by the <strong>Canteen under HR authority</strong>.
                  Upon disbursement, the cash is <strong>deducted first from the Canteen&apos;s physical cash drawer</strong> before entering coop share records.
                  A <strong>1.5% fee</strong> is charged and deducted directly from the employee&apos;s salary across the repayment term.
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">On-Hand Cash in Drawer</span>
              <span className="text-xl font-black font-mono text-slate-900">
                {formatCurrency(canteenDrawer.balance)}
              </span>
            </div>
          </div>

          {/* Canteen Drawer Activity Log Snippet */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-slate-600" />
                Canteen Cash Drawer Audit Trail
              </h4>
              {isHR && (
                <button
                  onClick={() => setShowReplenishModal(true)}
                  className="text-xs text-slate-700 hover:text-slate-900 font-bold cursor-pointer"
                >
                  + Replenish Cash
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {canteenDrawer.transactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{tx.type === 'replenish' ? '💵 Replenishment' : '📤 Advance Disbursed'}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {tx.type === 'replenish' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{tx.note}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{tx.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Advance Requests & Active Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-slate-600" />
                Employee Cash Advance Queue &amp; Repayment Schedule
              </h3>
              <span className="text-xs text-slate-500">
                {cashAdvances.length} Total Advances Registered
              </span>
            </div>

            <div className="space-y-3">
              {cashAdvances.map(advance => {
                const staff = staffList.find(s => s.id === advance.staffId);
                const isClaimPending = advance.status === 'Pending Canteen Claim';
                const isActive = advance.status === 'Active';

                return (
                  <div
                    key={advance.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {staff?.firstName} {staff?.lastName}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-bold">
                          {staff?.employeeId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          1.5% Fee ({formatCurrency(advance.feeAmount)})
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {advance.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>Principal: <strong className="font-mono text-slate-900">{formatCurrency(advance.principal)}</strong></span>
                        <span>·</span>
                        <span>Total with 1.5% Fee: <strong className="font-mono text-slate-900">{formatCurrency(advance.totalRepayable)}</strong></span>
                        <span>·</span>
                        <span>Cutoff Deduction: <strong className="font-mono text-slate-900">{formatCurrency(advance.cutoffDeduction)}</strong></span>
                        <span>·</span>
                        <span>Balance Left: <strong className="font-mono text-slate-900">{formatCurrency(advance.balanceRemaining)}</strong></span>
                      </div>

                      {advance.reason && (
                        <p className="text-[11px] text-slate-500 italic">
                          Reason: &ldquo;{advance.reason}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* HR Accept / Decline Action or Canteen Claim Action */}
                    <div className="shrink-0 flex items-center gap-2">
                      {advance.status === 'Pending HR Approval' && (
                        isHR ? (
                          <>
                            <button
                              onClick={() => hrAcceptCashAdvance(advance.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              Accept Advance
                            </button>
                            <button
                              onClick={() => hrDeclineCashAdvance(advance.id, 'Declined by HR')}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer transition"
                            >
                              <XCircle className="h-3.5 w-3.5 text-slate-600" />
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Pending HR Approval</span>
                          </div>
                        )
                      )}

                      {isClaimPending && (
                        (isCanteen || isHR) ? (
                          <button
                            onClick={() => claimCashAdvance(advance.id)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                          >
                            <CheckCircle2 className="h-4 w-4 text-white" />
                            Disburse Cash (Canteen Drawer)
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>Awaiting Canteen Claim (HR Authority)</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: CANTEEN SALARY DEDUCTIONS & COOP BUDGET RECONCILIATION */}
      {/* ========================================================================= */}
      {subTab === 'canteen_deductions' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-600" />
                  Canteen Salary Deductions &amp; COOP Budget Reconciliation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm that canteen meal &amp; grocery charges were deducted to the bank payroll disbursement before debiting to the employee's COOP budget.
                </p>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {pendingCanteenSalaryDeductions.length} Pending Bank Confirmation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Receipt No</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Order Nature</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">COOP Reconciliation Status</th>
                    <th className="px-4 py-3 text-center">HR Confirmation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {canteenSalaryDeductions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400 text-xs">
                        No transactions recorded on Salary Deduction.
                      </td>
                    </tr>
                  ) : (
                    canteenSalaryDeductions.map(r => {
                      const isConfirmed = r.salaryDeductionStatus === 'Confirmed by HR - Deducted to Bank & COOP';
                      const st = staffList.find(s => s.id === r.staffId);
                      const d = departments.find(dept => dept.id === st?.departmentId);
                      return (
                        <tr key={r.receiptNo} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {r.receiptNo}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {new Date(r.date).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{r.customerName}</div>
                            <div className="font-mono text-[10px] text-slate-400">{st?.employeeId}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d?.name || 'General Operations'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {r.orderType || 'Dine In'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            ₱{r.total?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isConfirmed ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {r.salaryDeductionStatus || 'Pending HR Bank Confirmation'}
                            </span>
                            {isConfirmed && r.hrConfirmedAt && (
                              <span className="block text-[10px] text-slate-500 mt-0.5">
                                Confirmed: {new Date(r.hrConfirmedAt).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {!isConfirmed ? (
                              isHR || isSuperAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => confirmCanteenSalaryDeduction(r.receiptNo)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-white text-[11px] font-bold transition cursor-pointer shadow-sm"
                                >
                                  Confirm Bank Deduction &amp; Deduct to COOP
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Requires HR Verification
                                </span>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />
                                Debited to COOP Budget
                              </span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DEPOSIT COOP SHARE */}
      {/* ========================================================================= */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-600" />
                Deposit Cooperative Share Capital
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Staff Member</label>
                <select
                  value={depositForm.staffId}
                  onChange={(e) => setDepositForm({ ...depositForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.employeeId}) - Curr: {formatCurrency(coopBalances[s.id] || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Deposit Amount (PHP)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Deposit Note / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly voluntary capital contribution"
                  value={depositForm.note}
                  onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowDepositModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!depositForm.amount) return;
                  depositCoopShare(depositForm.staffId, depositForm.amount, depositForm.note);
                  setShowDepositModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REQUEST WITHDRAWAL TO ACCOUNTING */}
      {/* ========================================================================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-slate-600" />
                Request Share Withdrawal to Accounting
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-relaxed">
              ⚠️ <strong>Workflow Notice:</strong> As specified, Coop Share Withdrawals are submitted by HR and routed to the <strong>Accounting Department</strong> for approval prior to fund release.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Select Staff Member</label>
                <select
                  value={withdrawForm.staffId}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.employeeId}) - Available: {formatCurrency(coopBalances[s.id] || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Withdrawal Amount (Max: {formatCurrency(coopBalances[withdrawForm.staffId] || 0)})
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
                <label className="text-slate-700 font-bold block mb-1">Official Reason for Accounting Review</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tuition fee payment assistance / Emergency hospital expense"
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
                  const res = requestCoopWithdrawal(withdrawForm.staffId, withdrawForm.amount, withdrawForm.reason);
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

      {/* ========================================================================= */}
      {/* MODAL 3: ENCODE NEW CASH LOAN */}
      {/* ========================================================================= */}
      {showNewLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-slate-600" />
                Encode Cash Loan Application
              </h3>
              <button onClick={() => setShowNewLoanModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Borrower</label>
                <select
                  value={loanForm.staffId}
                  onChange={(e) => setLoanForm({ ...loanForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Loan Category &amp; Mandatory Rate</label>
                <div className="grid grid-cols-2 gap-2">
                  {LOAN_CATEGORIES.map(cat => {
                    const isSel = loanForm.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLoanForm({ ...loanForm, category: cat.id })}
                        className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                          isSel
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">{cat.label}</div>
                        <div className={`text-[10px] font-bold ${isSel ? 'text-slate-300' : 'text-slate-500'}`}>
                          {cat.monthlyRate}% per month
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Principal Amount (PHP)</label>
                  <input
                    type="number"
                    placeholder="e.g. 20000"
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

              {/* Live Calculation Preview */}
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
                      <span>Rate Applied:</span>
                      <span className="font-bold text-slate-900">{r}% per month</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Interest ({t} mos):</span>
                      <span className="font-bold text-slate-900">{formatCurrency(int)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Repayable:</span>
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
                <label className="text-slate-700 font-bold block mb-1">Purpose / Specifications</label>
                <input
                  type="text"
                  placeholder="e.g. Purchase of refrigerator / Tuition semester fees"
                  value={loanForm.purpose}
                  onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowNewLoanModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!loanForm.principal) return;
                  requestCashLoan(loanForm);
                  setShowNewLoanModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit Loan Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REPLENISH CANTEEN CASH DRAWER */}
      {/* ========================================================================= */}
      {showReplenishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-slate-600" />
                Replenish Canteen Physical Cash Drawer
              </h3>
              <button onClick={() => setShowReplenishModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Current Cash on Hand in Drawer: <strong className="font-mono text-slate-900">{formatCurrency(canteenDrawer.balance)}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Replenishment Amount (PHP)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Source / Memo Note</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Petty Cash Replenishment from Main Vault"
                  value={replenishNote}
                  onChange={(e) => setReplenishNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowReplenishModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!replenishAmount) return;
                  replenishCanteenCash(replenishAmount, replenishNote);
                  setShowReplenishModal(false);
                  setReplenishAmount('');
                  setReplenishNote('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Confirm Replenish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ENCODE CASH ADVANCE (CANTEEN) */}
      {/* ========================================================================= */}
      {showNewAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-slate-600" />
                Encode Canteen Cash Advance Request
              </h3>
              <button onClick={() => setShowNewAdvanceModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Employee</label>
                <select
                  value={advanceForm.staffId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

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
                      <span>Canteen Fee (1.5%):</span>
                      <span className="font-bold text-slate-900">{formatCurrency(fee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Salary Deduction:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(tot)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                      <span>Cutoff Salary Deduction:</span>
                      <span>{formatCurrency(cut)} / cutoff</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Canteen meals / emergency transport"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowNewAdvanceModal(false)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!advanceForm.principal) return;
                  requestCashAdvance(advanceForm);
                  setShowNewAdvanceModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Submit Advance Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
