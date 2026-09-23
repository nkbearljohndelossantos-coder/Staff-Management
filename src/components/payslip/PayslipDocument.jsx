import React from 'react';
import { X, Printer } from 'lucide-react';
import { formatCurrency } from '../../utils/payrollCalculations';
import BarcodeView from '../common/BarcodeView';

export default function PayslipDocument({ staff, payRun, item, onClose }) {
  if (!staff || !payRun || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200 text-xs">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Official Employee Payslip
            </h3>
            <p className="text-xs text-slate-500">Pay Period: {payRun.periodStart} to {payRun.periodEnd}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Printer className="h-4 w-4 text-white" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div id="printable-content" className="bg-white text-slate-950 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 font-sans text-xs">
          
          {/* Company Header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center gap-3">
              <img src="/LogoC.png" alt="NKB Logo" className="h-12 w-12 object-contain" />
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">NKB MANUFACTURING CORP.</h2>
                <p className="text-[10px] text-slate-600 font-medium">Subic Bay Gateway Park, Phase 1, SBFZ, Philippines</p>
                <p className="text-[10px] text-slate-500 font-mono">TIN: 004-921-883-000 · HR &amp; Payroll Department</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono">
                CONFIDENTIAL PAYSLIP
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1.5">Batch: {payRun.code}</p>
            </div>
          </div>

          {/* Employee & Pay Period Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-200 bg-slate-50 p-3 rounded-xl my-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Employee Name</span>
              <span className="font-bold text-slate-900 text-xs">{staff.firstName} {staff.lastName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Employee ID</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{staff.employeeId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pay Period</span>
              <span className="font-mono text-slate-800 text-[11px]">{payRun.periodStart} ~ {payRun.periodEnd}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Payout Date</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{payRun.payDate}</span>
            </div>
          </div>

          {/* Itemized Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-4">
            
            {/* Left: Earnings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-300">
                <span className="font-black text-slate-900 uppercase text-[11px]">Gross Earnings</span>
                <span className="text-[10px] text-slate-500 font-mono">Amount (PHP)</span>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Basic Salary (Cut-off)</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.cutoffBasePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Pay ({item.otHours || 0} hrs)</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.overtimePay || 0)}</span>
                </div>
                {item.cutoffAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>Allowances &amp; De Minimis</span>
                    <span className="font-mono font-semibold">{formatCurrency(item.cutoffAllowance)}</span>
                  </div>
                )}
                {item.bonus > 0 && (
                  <div className="flex justify-between text-slate-900 font-medium">
                    <span>Performance Incentive</span>
                    <span className="font-mono font-semibold">{formatCurrency(item.bonus)}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 mt-2 border-t-2 border-slate-300 flex justify-between font-black text-slate-950">
                <span>TOTAL GROSS PAY</span>
                <span className="font-mono text-slate-900">{formatCurrency(item.grossPay)}</span>
              </div>
            </div>

            {/* Right: Deductions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-300">
                <span className="font-black text-slate-900 uppercase text-[11px]">Deductions &amp; Taxes</span>
                <span className="text-[10px] text-slate-500 font-mono">Amount (PHP)</span>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Withholding Income Tax</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.withholdingTax || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SSS Contribution</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.sssDeduction || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PhilHealth Contribution</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.philhealthDeduction || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pag-IBIG / HDMF</span>
                  <span className="font-mono font-semibold">{formatCurrency(item.pagibigDeduction || 0)}</span>
                </div>
                {item.tardinessDeduction > 0 && (
                  <div className="flex justify-between text-slate-800 font-medium">
                    <span>Tardiness ({item.lateMinutes} mins)</span>
                    <span className="font-mono font-semibold">-{formatCurrency(item.tardinessDeduction)}</span>
                  </div>
                )}
                {item.loanDeduction > 0 && (
                  <div className="flex justify-between text-slate-800 font-medium">
                    <span>Coop Cash Loan Deduction</span>
                    <span className="font-mono font-semibold">-{formatCurrency(item.loanDeduction)}</span>
                  </div>
                )}
                {item.cashAdvanceDeduction > 0 && (
                  <div className="flex justify-between text-slate-800 font-medium">
                    <span>Canteen Cash Advance (1.5% fee)</span>
                    <span className="font-mono font-semibold">-{formatCurrency(item.cashAdvanceDeduction)}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 mt-2 border-t-2 border-slate-300 flex justify-between font-black text-slate-950">
                <span>TOTAL DEDUCTIONS</span>
                <span className="font-mono text-slate-900">-{formatCurrency(item.totalDeductions)}</span>
              </div>
            </div>

          </div>

          {/* Big Net Take-Home Pay Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Net Take-Home Pay</span>
              <p className="text-[11px] text-slate-300">
                Disbursement: {staff.bankName === 'Cash' ? 'Cash (Over-the-Counter Payout)' : `${staff.bankName} (${staff.bankAccount || 'Direct Deposit'})`}
              </p>
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {formatCurrency(item.netPay)}
            </div>
          </div>

          {/* Barcode & Verification Footer */}
          <div className="pt-5 mt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarcodeView value={staff.employeeId} width={1.2} height={26} displayValue={false} />
              <span className="font-mono text-[10px] text-slate-500 font-bold">{staff.employeeId}</span>
            </div>
            <div className="text-[10px] text-slate-500 text-center sm:text-right">
              <div>Digitally generated by NKB Enterprise HRIS &amp; Payroll Portal</div>
              <div>System Hash Verification: SHA256-AUTHENTICATED</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
