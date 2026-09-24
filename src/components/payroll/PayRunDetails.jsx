import React, { useState } from 'react';
import { ArrowLeft, Calculator, CheckCircle2, FileSpreadsheet, Eye, Lock, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import PayslipDocument from '../payslip/PayslipDocument';

export default function PayRunDetails({ payRunId, onBack }) {
  const { payRuns, staffList, calculatePayRun, approvePayRun, disbursePayRun, isAccounting } = useApp();
  const [selectedPayslipItem, setSelectedPayslipItem] = useState(null);

  const payRun = payRuns.find(r => r.id === payRunId);
  if (!payRun) return <div>Pay run not found.</div>;

  // Export Bank CSV
  const handleExportBankCsv = () => {
    if (!payRun.items || payRun.items.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Full Name,Bank Name,Account Number,Net Pay Amount\n";

    payRun.items.forEach(item => {
      const staff = staffList.find(s => s.id === item.staffId);
      if (staff) {
        const line = `"${staff.employeeId}","${staff.firstName} ${staff.lastName}","${staff.bankName}","${staff.bankAccount}","${item.netPay}"`;
        csvContent += line + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NKB_Bank_Disbursement_${payRun.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (selectedPayslipItem) {
    const staff = staffList.find(s => s.id === selectedPayslipItem.staffId);
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedPayslipItem(null)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition border border-slate-300 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
          Back to Pay Run Batch
        </button>
        <PayslipDocument
          payRun={payRun}
          payItem={selectedPayslipItem}
          staff={staff}
          onClose={() => setSelectedPayslipItem(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition border border-slate-300 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
          Back to Pay Runs
        </button>

        {/* Action Buttons (Monochrome Icons) */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAccounting && (
            <button
              type="button"
              onClick={() => calculatePayRun(payRun.id)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Calculator className="h-4 w-4 text-white" />
              Recalculate Batch
            </button>
          )}

          {isAccounting ? (
            <>
              {payRun.status !== 'Approved' && payRun.status !== 'Disbursed' && (
                <button
                  type="button"
                  onClick={() => approvePayRun(payRun.id)}
                  disabled={payRun.items.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm transition"
                >
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  Approve Pay Run
                </button>
              )}

              {payRun.status === 'Approved' && (
                <button
                  type="button"
                  onClick={() => disbursePayRun(payRun.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <Lock className="h-4 w-4 text-white" />
                  Disburse &amp; Lock
                </button>
              )}
            </>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-500" />
              <span>Approval Authority: Finance &amp; Accounting or Super Admin</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportBankCsv}
            disabled={payRun.items.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
            Bank CSV File
          </button>
        </div>
      </div>

      {/* Pay Run Summary Banner (White Card, High Contrast) */}
      <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-base font-black text-slate-900">{payRun.code}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {payRun.status}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">{payRun.title}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Cut-off: <strong className="text-slate-700">{payRun.periodStart}</strong> to <strong className="text-slate-700">{payRun.periodEnd}</strong> · Payout: {payRun.payDate}
          </p>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 text-right">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Gross</span>
            <span className="text-sm sm:text-base font-black font-mono text-slate-900">{formatCurrency(payRun.totalGross)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Deductions</span>
            <span className="text-sm sm:text-base font-black font-mono text-slate-700">-{formatCurrency(payRun.totalDeductions)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Net Payout</span>
            <span className="text-sm sm:text-base font-black font-mono text-slate-900">{formatCurrency(payRun.totalNet)}</span>
          </div>
        </div>
      </div>

      {/* Staff Payroll Items Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            Staff Earnings &amp; Net Take-Home
          </h3>
          <span className="text-xs text-slate-500">{payRun.items?.length || 0} Staff Included</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Basic Pay (Cut-off)</th>
                <th className="py-3 px-4">Overtime (OT)</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Total Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4 text-center">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {!payRun.items || payRun.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No payroll calculation items generated yet. Click <strong className="text-slate-900">"Recalculate Batch"</strong> above to run formulas!
                  </td>
                </tr>
              ) : (
                payRun.items.map((item) => {
                  const staff = staffList.find(s => s.id === item.staffId);
                  if (!staff) return null;

                  return (
                    <tr key={item.staffId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{staff.firstName} {staff.lastName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{staff.employeeId}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>{formatCurrency(item.cutoffBasePay)}</div>
                        {item.absentDeduction > 0 && (
                          <div className="text-[10px] text-rose-600 font-sans font-medium">
                            ↳ Net: {formatCurrency(item.netBasePayAfterAbsence || (item.cutoffBasePay - item.absentDeduction))} (-{item.unpaidDays}d)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {item.otHours > 0 ? (
                          <div>
                            <span className="text-slate-900 font-semibold block">
                              +{formatCurrency(item.overtimePay)} ({item.otHours}h)
                            </span>
                            <span 
                              className="text-[10px] text-emerald-700 font-sans font-medium flex items-center gap-0.5 cursor-help"
                              title={item.otReasons && item.otReasons.length > 0 ? `HR Verified Reason: ${item.otReasons.join(', ')}` : 'HR Authorized Overtime with verified reason'}
                            >
                              ✓ HR Authorized
                            </span>
                          </div>
                        ) : '₱ 0.00'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 font-bold">
                        {formatCurrency(item.grossPay)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        <div>-{formatCurrency(item.totalDeductions)}</div>
                        {(item.absentDeduction > 0 || item.tardinessDeduction > 0) && (
                          <div className="text-[10px] text-slate-500 font-sans">
                            Abs/Late: -{formatCurrency((item.absentDeduction || 0) + (item.tardinessDeduction || 0))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900 font-black text-sm">
                        {formatCurrency(item.netPay)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslipItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        >
                          <Eye className="h-3 w-3 text-slate-600" />
                          View
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

      {/* Payslip Modal */}
      {selectedPayslipItem && (
        <PayslipDocument
          staff={staffList.find(s => s.id === selectedPayslipItem.staffId)}
          payRun={payRun}
          item={selectedPayslipItem}
          onClose={() => setSelectedPayslipItem(null)}
        />
      )}

    </div>
  );
}
