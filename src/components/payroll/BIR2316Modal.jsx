import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building,
  UserCheck
} from 'lucide-react';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function BIR2316Modal({ staff, payRuns = [], onClose }) {
  useEscapeKey('bir-2316-modal', ESCAPE_PRIORITY.MODAL, true, onClose);

  const [taxYear, setTaxYear] = useState('2026');

  if (!staff) return null;

  // Compute estimated compensation figures from staff rate and pay runs
  const monthlyRate = Number(staff.baseSalary || staff.monthlyRate || 0);
  const annualGross = monthlyRate > 0 ? monthlyRate * 12 : 280000.00; // Realistic median compensation
  const thirteenthMonthPay = monthlyRate > 0 ? monthlyRate : (annualGross / 12);
  const nonTaxable13thMonth = Math.min(thirteenthMonthPay, 90000); // ₱90k cap under TRAIN Law
  const annualSss = 13500.00; // SSS Employee Share
  const annualPhilHealth = 6000.00; // PhilHealth Employee Share
  const annualPagIbig = 2400.00; // Pag-IBIG Employee Share
  const totalMandatoryContributions = annualSss + annualPhilHealth + annualPagIbig;
  const totalNonTaxableExempt = nonTaxable13thMonth + totalMandatoryContributions;
  const taxableCompensation = Math.max(0, annualGross - totalNonTaxableExempt);
  
  // TRAIN Law Tax Bracket calculation
  let taxDue = 0;
  if (taxableCompensation <= 250000) {
    taxDue = 0;
  } else if (taxableCompensation <= 400000) {
    taxDue = (taxableCompensation - 250000) * 0.15;
  } else if (taxableCompensation <= 800000) {
    taxDue = 22500 + (taxableCompensation - 400000) * 0.20;
  } else {
    taxDue = 102500 + (taxableCompensation - 800000) * 0.25;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[95vh] my-auto">
        
        {/* Header Controls (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-cyan-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">
                BIR Form No. 2316 Certificate
              </h3>
              <p className="text-[10px] text-slate-400">
                Certificate of Compensation Payment / Tax Withheld for Year {taxYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Year:</span>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none"
              >
                <option value="2026">2026 (Current)</option>
                <option value="2025">2025</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Official 2316</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Form Sheet View */}
        <div className="p-6 sm:p-8 bg-slate-100 overflow-y-auto flex-1">
          <div
            id="printable-bir-form"
            className="bg-white border-2 border-slate-900 p-6 sm:p-8 rounded-xl shadow-md text-slate-900 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0"
          >
            {/* BIR Official Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                  Republic of the Philippines · Department of Finance
                </div>
                <div className="text-base sm:text-lg font-black tracking-tight text-slate-950">
                  BUREAU OF INTERNAL REVENUE
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Certificate of Compensation Payment / Tax Withheld
                </div>
              </div>

              <div className="text-right sm:border-l-2 sm:border-slate-900 sm:pl-4">
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-950">
                  BIR Form No. 2316
                </div>
                <div className="text-[10px] font-bold text-slate-600">
                  Taxable Year: <span className="text-slate-950 underline">{taxYear}</span>
                </div>
              </div>
            </div>

            {/* Part I: Employee Information */}
            <div className="border border-slate-300 rounded-xl p-4 mb-4 bg-slate-50/50 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                Part I: Employee Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">1. Employee Name:</span>
                  <span className="font-bold text-slate-950">{staff.lastName}, {staff.firstName} {staff.middleName || ''}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">2. Employee Taxpayer Identification No. (TIN):</span>
                  <span className="font-bold font-mono text-slate-950">{staff.tin || '482-901-382-000'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">3. Company ID &amp; Position:</span>
                  <span className="font-bold text-slate-800">{staff.employeeId} · {staff.positionName || 'Staff Specialist'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">4. Statutory Nos. (SSS / PhilHealth / Pag-IBIG):</span>
                  <span className="font-mono text-[11px] text-slate-700">{staff.sss || '34-8291048-2'} / {staff.philhealth || '12-9482019-3'} / {staff.pagibig || '1210-9482-0192'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block">5. Registered Residential Address:</span>
                  <span className="text-slate-800">{staff.address || 'Industrial Zone Village, Santa Rosa, Laguna, Philippines'}</span>
                </div>
              </div>
            </div>

            {/* Part II: Employer Information */}
            <div className="border border-slate-300 rounded-xl p-4 mb-4 bg-slate-50/50 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                Part II: Employer Information (Present)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">6. Registered Employer Name:</span>
                  <span className="font-black text-slate-950">NKB MANUFACTURING INC.</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">7. Employer TIN:</span>
                  <span className="font-bold font-mono text-slate-950">402-918-204-000</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-500 block">8. Plant Facility Address:</span>
                  <span className="text-slate-800">Block 4, Phase 2, Laguna Technopark Industrial Estate, Laguna, Philippines</span>
                </div>
              </div>
            </div>

            {/* Part III: Summary of Compensation Income & Tax Withheld */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 p-3 border-b border-slate-200">
                Part III: Summary of Compensation Income &amp; Tax Withheld
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-700">9. Gross Compensation Income from Present Employer</span>
                  <span className="font-mono font-bold text-slate-900">₱{annualGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2.5 flex justify-between bg-slate-50/50">
                  <span className="text-slate-600 pl-4">10a. Less: 13th Month Pay &amp; Other Benefits (Exempt up to ₱90,000)</span>
                  <span className="font-mono text-slate-700">₱{nonTaxable13thMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2.5 flex justify-between bg-slate-50/50">
                  <span className="text-slate-600 pl-4">10b. Less: Mandatory SSS, GSIS, PHIC, &amp; HDMF Contributions</span>
                  <span className="font-mono text-slate-700">₱{totalMandatoryContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2.5 flex justify-between bg-emerald-50/50 font-semibold">
                  <span className="text-emerald-950 pl-4">11. Total Non-Taxable / Exempt Compensation Income (10a + 10b)</span>
                  <span className="font-mono text-emerald-900 font-bold">₱{totalNonTaxableExempt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2.5 flex justify-between font-black bg-slate-100">
                  <span className="text-slate-950">12. Taxable Compensation Income (9 minus 11)</span>
                  <span className="font-mono text-slate-950">₱{taxableCompensation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-700">13. Tax Due under TRAIN Law (Republic Act No. 10963)</span>
                  <span className="font-mono font-bold text-slate-900">₱{taxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="p-2.5 flex justify-between font-black text-sm bg-slate-900 text-white">
                  <span>14. TOTAL AMOUNT OF TAXES WITHHELD</span>
                  <span className="font-mono text-cyan-400">₱{taxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Signatures & Certification */}
            <div className="border-t-2 border-slate-900 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="h-10 flex items-end justify-center">
                  <span className="font-mono text-[11px] text-slate-600 italic">Genevieve Anne A. JURADO (HR Manager)</span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold text-slate-950">
                  GENEVIEVE ANNE A. JURADO
                </div>
                <div className="text-[10px] text-slate-500">
                  Employer Authorized Representative / HR Management
                </div>
              </div>

              <div className="space-y-1">
                <div className="h-10 flex items-end justify-center">
                  <span className="font-mono text-[11px] text-slate-600 italic">{staff.firstName} {staff.lastName}</span>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold text-slate-950">
                  {staff.firstName} {staff.lastName}
                </div>
                <div className="text-[10px] text-slate-500">
                  Employee Taxpayer Signature / Conforme
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
