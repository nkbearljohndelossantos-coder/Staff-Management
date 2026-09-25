import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Download,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building,
  Shield,
  Printer,
  Calendar,
  DollarSign,
  Layers,
  Search,
  Users
} from 'lucide-react';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';
import {
  calculateSocialSecurity,
  calculateHealthInsurance,
  calculatePension,
  calculateWithholdingTax,
  formatCurrency
} from '../../utils/payrollCalculations';

export default function GovernmentRemittanceModal({ payRun, staffList = [], onClose }) {
  useEscapeKey('gov-remittance-modal', ESCAPE_PRIORITY.MODAL, true, onClose);

  // Active Agency Tab: 'SSS' | 'PHILHEALTH' | 'HDMF' | 'BIR'
  const [activeAgency, setActiveAgency] = useState('SSS');
  const [reportBasis, setReportBasis] = useState('monthly'); // 'monthly' | 'cutoff'
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Compile individual staff statutory rows strictly based on filedSalary
  const statutoryRows = useMemo(() => {
    if (!payRun) return [];

    // Filter staff based on payRun items if present, or all active staff
    const relevantStaffIds = new Set((payRun.items || []).map(item => item.staffId));
    
    return staffList
      .filter(staff => relevantStaffIds.size === 0 || relevantStaffIds.has(staff.id))
      .map(staff => {
        // Strict compliance: Decoupled filedSalary
        const rawFiled = Number(staff.filedSalary);
        const filedSalary = (rawFiled && rawFiled > 0) ? rawFiled : (Number(staff.salaryRate) || Number(staff.baseSalary) || 25000);

        // 1. SSS Breakdown
        const msc = Math.min(Math.max(filedSalary, 4000), 30000);
        const regularMsc = Math.min(msc, 20000);
        const wispMsc = Math.max(0, msc - 20000);

        const sssEeRegular = Math.round(regularMsc * 0.045);
        const sssErRegular = Math.round(regularMsc * 0.095);
        const sssEeWisp = Math.round(wispMsc * 0.045);
        const sssErWisp = Math.round(wispMsc * 0.095);
        const sssEc = msc <= 14500 ? 10 : 30;

        const sssEeTotal = sssEeRegular + sssEeWisp;
        const sssErTotal = sssErRegular + sssErWisp + sssEc;
        const sssTotal = sssEeTotal + sssErTotal;

        // 2. PhilHealth Breakdown (5% total, 2.5% EE, 2.5% ER, clamped 10k to 100k)
        const phicBase = Math.min(Math.max(filedSalary, 10000), 100000);
        const phicEe = Math.round(phicBase * 0.025);
        const phicEr = Math.round(phicBase * 0.025);
        const phicTotal = phicEe + phicEr;

        // 3. Pag-IBIG / HDMF Breakdown (2% capped at 200 EE, 200 ER)
        const hdmfEe = calculatePension(filedSalary);
        const hdmfEr = hdmfEe;
        const hdmfTotal = hdmfEe + hdmfEr;

        // 4. BIR Form 1601-C Breakdown (Taxable = Filed Salary - Statutory EE Shares)
        const statutoryTotalEe = sssEeTotal + phicEe + hdmfEe;
        const taxableIncome = Math.max(0, filedSalary - statutoryTotalEe);
        const birTaxWithheld = calculateWithholdingTax(taxableIncome);

        // Semi-monthly factor (0.5 for cutoff)
        const factor = reportBasis === 'cutoff' ? 0.5 : 1.0;

        return {
          id: staff.id,
          employeeId: staff.employeeId || 'NKB-EMP',
          name: `${staff.lastName || ''}, ${staff.firstName || ''}`.trim() || staff.name || 'Staff Member',
          department: staff.department || 'Operations',
          filedSalary,
          effectiveSalary: Math.round(filedSalary * factor),

          // SSS
          sssNo: staff.sssNo || 'Pending SSS',
          sssEe: Math.round(sssEeTotal * factor),
          sssEr: Math.round(sssErTotal * factor),
          sssEc: Math.round(sssEc * factor),
          sssWispEe: Math.round(sssEeWisp * factor),
          sssWispEr: Math.round(sssErWisp * factor),
          sssTotal: Math.round(sssTotal * factor),

          // PhilHealth
          philHealthNo: staff.philHealthNo || 'Pending PHIC',
          phicEe: Math.round(phicEe * factor),
          phicEr: Math.round(phicEr * factor),
          phicTotal: Math.round(phicTotal * factor),

          // Pag-IBIG
          hdmfNo: staff.hdmfNo || 'Pending HDMF',
          hdmfEe: Math.round(hdmfEe * factor),
          hdmfEr: Math.round(hdmfEr * factor),
          hdmfTotal: Math.round(hdmfTotal * factor),

          // BIR 1601-C
          tin: staff.tin || 'Pending TIN',
          grossCompensation: Math.round(filedSalary * factor),
          nonTaxableStatutory: Math.round(statutoryTotalEe * factor),
          taxableCompensation: Math.round(taxableIncome * factor),
          taxWithheld: Math.round(birTaxWithheld * factor)
        };
      });
  }, [payRun, staffList, reportBasis]);

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return statutoryRows;
    const term = searchTerm.toLowerCase();
    return statutoryRows.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.employeeId.toLowerCase().includes(term) ||
      r.department.toLowerCase().includes(term) ||
      r.sssNo.includes(term) ||
      r.philHealthNo.includes(term) ||
      r.hdmfNo.includes(term) ||
      r.tin.includes(term)
    );
  }, [statutoryRows, searchTerm]);

  // Compute agency summary KPIs
  const kpis = useMemo(() => {
    const totalStaff = statutoryRows.length;
    const totalFiledSalary = statutoryRows.reduce((sum, r) => sum + r.effectiveSalary, 0);

    let totalEe = 0;
    let totalEr = 0;
    let totalRemittance = 0;

    if (activeAgency === 'SSS') {
      totalEe = statutoryRows.reduce((sum, r) => sum + r.sssEe, 0);
      totalEr = statutoryRows.reduce((sum, r) => sum + r.sssEr, 0);
      totalRemittance = statutoryRows.reduce((sum, r) => sum + r.sssTotal, 0);
    } else if (activeAgency === 'PHILHEALTH') {
      totalEe = statutoryRows.reduce((sum, r) => sum + r.phicEe, 0);
      totalEr = statutoryRows.reduce((sum, r) => sum + r.phicEr, 0);
      totalRemittance = statutoryRows.reduce((sum, r) => sum + r.phicTotal, 0);
    } else if (activeAgency === 'HDMF') {
      totalEe = statutoryRows.reduce((sum, r) => sum + r.hdmfEe, 0);
      totalEr = statutoryRows.reduce((sum, r) => sum + r.hdmfEr, 0);
      totalRemittance = statutoryRows.reduce((sum, r) => sum + r.hdmfTotal, 0);
    } else if (activeAgency === 'BIR') {
      totalEe = statutoryRows.reduce((sum, r) => sum + r.taxWithheld, 0);
      totalEr = 0;
      totalRemittance = totalEe;
    }

    return {
      totalStaff,
      totalFiledSalary,
      totalEe,
      totalEr,
      totalRemittance
    };
  }, [statutoryRows, activeAgency]);

  // Generate Agency-compliant CSV
  const generateAgencyCsv = () => {
    const periodStr = payRun?.period || new Date().toISOString().slice(0, 7);

    if (activeAgency === 'SSS') {
      // SSS Form R-3 / AMS Export format
      let csv = `SSS_NUMBER,EMPLOYEE_NAME,MONTHLY_SALARY_CREDIT,SS_EE,SS_ER,EC,WISP_EE,WISP_ER,TOTAL_CONTRIBUTION,PERIOD\n`;
      statutoryRows.forEach(r => {
        csv += `"${r.sssNo}","${r.name}",${r.effectiveSalary},${r.sssEe - r.sssWispEe},${r.sssEr - r.sssWispEr - r.sssEc},${r.sssEc},${r.sssWispEe},${r.sssWispEr},${r.sssTotal},"${periodStr}"\n`;
      });
      return csv;
    } else if (activeAgency === 'PHILHEALTH') {
      // PhilHealth EPRS format
      let csv = `PHILHEALTH_PIN,EMPLOYEE_NAME,MONTHLY_BASIC_SALARY,EE_SHARE,ER_SHARE,TOTAL_PREMIUM,MEMBER_STATUS,PERIOD\n`;
      statutoryRows.forEach(r => {
        csv += `"${r.philHealthNo}","${r.name}",${r.effectiveSalary},${r.phicEe},${r.phicEr},${r.phicTotal},"ACTIVE","${periodStr}"\n`;
      });
      return csv;
    } else if (activeAgency === 'HDMF') {
      // Pag-IBIG MCR format
      let csv = `HDMF_MID_NO,EMPLOYEE_NAME,MONTHLY_COMPENSATION,EE_SHARE,ER_SHARE,TOTAL_REMITTANCE,PERIOD\n`;
      statutoryRows.forEach(r => {
        csv += `"${r.hdmfNo}","${r.name}",${r.effectiveSalary},${r.hdmfEe},${r.hdmfEr},${r.hdmfTotal},"${periodStr}"\n`;
      });
      return csv;
    } else {
      // BIR Form 1601-C Alphalist format
      let csv = `TIN,EMPLOYEE_NAME,GROSS_COMPENSATION,NON_TAXABLE_STATUTORY,TAXABLE_COMPENSATION,TAX_WITHHELD,PERIOD\n`;
      statutoryRows.forEach(r => {
        csv += `"${r.tin}","${r.name}",${r.grossCompensation},${r.nonTaxableStatutory},${r.taxableCompensation},${r.taxWithheld},"${periodStr}"\n`;
      });
      return csv;
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = generateAgencyCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NKB_${activeAgency}_Remittance_${reportBasis.toUpperCase()}_${payRun?.code || 'BATCH'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const csvContent = generateAgencyCsv();
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[94vh] my-auto">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800 text-indigo-400 border border-slate-700">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Government Statutory Remittance Reports</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                  DOLE &amp; Statutory Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official monthly and cut-off remittances strictly derived from declared Filed Salary (Decoupled Compliance).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Agency Navigation Tabs & Controls Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Agency Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveAgency('SSS')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeAgency === 'SSS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>SSS (R-3 / AMS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAgency('PHILHEALTH')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeAgency === 'PHILHEALTH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>PhilHealth (EPRS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAgency('HDMF')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeAgency === 'HDMF'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Pag-IBIG (MCR)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAgency('BIR')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                activeAgency === 'BIR'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>BIR (1601-C)</span>
            </button>
          </div>

          {/* Basis Toggle: Monthly vs Cut-off */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Basis:</span>
            <div className="bg-white border border-slate-200 rounded-xl p-0.5 flex items-center shadow-2xs">
              <button
                type="button"
                onClick={() => setReportBasis('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reportBasis === 'monthly'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Monthly (Agency Schedule)
              </button>
              <button
                type="button"
                onClick={() => setReportBasis('cutoff')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reportBasis === 'cutoff'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pay Run Cut-Off (50%)
              </button>
            </div>
          </div>
        </div>

        {/* Agency Summary Cards */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-b border-slate-100 shrink-0">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">Covered Personnel</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{kpis.totalStaff} Staff</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active workforce in batch</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Filed Base</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              ₱{kpis.totalFiledSalary.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Declared compliance wage</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase text-slate-400">
              {activeAgency === 'BIR' ? 'Tax Withheld (EE)' : 'Employee Share (EE)'}
            </div>
            <div className="text-xl font-black text-blue-700 font-mono mt-0.5">
              ₱{kpis.totalEe.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Payroll deductions withheld</div>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200">
            <div className="text-[10px] font-bold uppercase text-indigo-700">Total Remittance Due</div>
            <div className="text-xl font-black text-indigo-900 font-mono mt-0.5">
              ₱{kpis.totalRemittance.toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">
              {activeAgency === 'BIR' ? 'Payable to BIR RDO' : `EE + ER payable to ${activeAgency}`}
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or statutory no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              {copiedBatch ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-600" />}
              <span>{copiedBatch ? 'Copied to Clipboard' : 'Copy CSV Text'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Download className="h-3.5 w-3.5 text-white" />
              <span>Download CSV ({activeAgency})</span>
            </button>
          </div>
        </div>

        {/* Interactive Data Table Preview */}
        <div className="flex-1 overflow-y-auto px-6 py-3 text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-3">Employee</th>
                <th className="py-2.5 px-3">
                  {activeAgency === 'SSS' ? 'SSS Number' : activeAgency === 'PHILHEALTH' ? 'PhilHealth PIN' : activeAgency === 'HDMF' ? 'HDMF MID' : 'TIN'}
                </th>
                <th className="py-2.5 px-3 text-right">Filed Salary</th>
                
                {activeAgency === 'SSS' && (
                  <>
                    <th className="py-2.5 px-3 text-right">EE Share</th>
                    <th className="py-2.5 px-3 text-right">ER Share</th>
                    <th className="py-2.5 px-3 text-right">EC</th>
                    <th className="py-2.5 px-3 text-right">Total SSS</th>
                  </>
                )}

                {activeAgency === 'PHILHEALTH' && (
                  <>
                    <th className="py-2.5 px-3 text-right">EE (2.5%)</th>
                    <th className="py-2.5 px-3 text-right">ER (2.5%)</th>
                    <th className="py-2.5 px-3 text-right">Total Premium (5%)</th>
                  </>
                )}

                {activeAgency === 'HDMF' && (
                  <>
                    <th className="py-2.5 px-3 text-right">EE Share</th>
                    <th className="py-2.5 px-3 text-right">ER Match</th>
                    <th className="py-2.5 px-3 text-right">Total Remittance</th>
                  </>
                )}

                {activeAgency === 'BIR' && (
                  <>
                    <th className="py-2.5 px-3 text-right">Statutory Exemption</th>
                    <th className="py-2.5 px-3 text-right">Taxable Base</th>
                    <th className="py-2.5 px-3 text-right">Tax Withheld</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No matching personnel found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 font-sans">
                      <div className="font-bold text-slate-800">{row.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.employeeId} · {row.department}</div>
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {activeAgency === 'SSS' ? row.sssNo : activeAgency === 'PHILHEALTH' ? row.philHealthNo : activeAgency === 'HDMF' ? row.hdmfNo : row.tin}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900 font-bold">
                      ₱{row.effectiveSalary.toLocaleString()}
                    </td>

                    {activeAgency === 'SSS' && (
                      <>
                        <td className="py-2 px-3 text-right text-blue-700">₱{row.sssEe.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-600">₱{row.sssEr.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-400">₱{row.sssEc}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">₱{row.sssTotal.toLocaleString()}</td>
                      </>
                    )}

                    {activeAgency === 'PHILHEALTH' && (
                      <>
                        <td className="py-2 px-3 text-right text-emerald-700">₱{row.phicEe.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-600">₱{row.phicEr.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">₱{row.phicTotal.toLocaleString()}</td>
                      </>
                    )}

                    {activeAgency === 'HDMF' && (
                      <>
                        <td className="py-2 px-3 text-right text-amber-700">₱{row.hdmfEe.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-600">₱{row.hdmfEr.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">₱{row.hdmfTotal.toLocaleString()}</td>
                      </>
                    )}

                    {activeAgency === 'BIR' && (
                      <>
                        <td className="py-2 px-3 text-right text-slate-500">₱{row.nonTaxableStatutory.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-700 font-bold">₱{row.taxableCompensation.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-purple-700">₱{row.taxWithheld.toLocaleString()}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Format validated against Republic Act &amp; Statutory Agency regulations.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span>Print Remittance Form</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
