import React, { useState } from 'react';
import {
  Landmark,
  Download,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building
} from 'lucide-react';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function BankPayrollExportModal({ payRun, staffList = [], onClose }) {
  useEscapeKey('bank-payroll-export-modal', ESCAPE_PRIORITY.MODAL, true, onClose);

  const [bankFormat, setBankFormat] = useState('BDO'); // 'BDO' | 'BPI' | 'METROBANK' | 'LANDBANK' | 'PESONET'
  const [copiedBatch, setCopiedBatch] = useState(false);

  if (!payRun) return null;

  // Build bank lines from payRun items or staff
  const records = (payRun.items || []).map((item, idx) => {
    const staff = staffList.find(s => s.id === item.staffId) || {};
    const accountNo = staff.bankAccountNo || `00${(staff.id || idx + 1000).replace(/\D/g, '').padEnd(10, '8')}`;
    const name = staff.firstName && staff.lastName ? `${staff.lastName}, ${staff.firstName}` : item.name || 'Staff Member';
    const amount = Number(item.netPay || 0);

    return {
      id: staff.id || `emp-${idx}`,
      employeeId: staff.employeeId || `NKB-${idx}`,
      name,
      accountNo,
      amount,
      email: staff.email || `${staff.firstName?.toLowerCase() || 'staff'}@nkbmanufacturing.com`
    };
  });

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  // Generate Bank File Content
  const generateBankFileContent = () => {
    const batchId = `NKB-PAY-${payRun.id || Date.now()}`;
    const dateStr = payRun.payDate || new Date().toISOString().slice(0, 10);

    if (bankFormat === 'BDO') {
      let content = `H,NKB MANUFACTURING INC,${batchId},${dateStr},${records.length},${totalAmount.toFixed(2)}\n`;
      records.forEach(r => {
        content += `D,${r.accountNo},${r.amount.toFixed(2)},SALARY ${dateStr},${r.name}\n`;
      });
      return content;
    } else if (bankFormat === 'BPI') {
      let content = `ACCT_NO,AMOUNT,EMPLOYEE_NAME,PAY_DATE,REF\n`;
      records.forEach(r => {
        content += `${r.accountNo},${r.amount.toFixed(2)},"${r.name}",${dateStr},${batchId}\n`;
      });
      return content;
    } else if (bankFormat === 'LANDBANK') {
      let content = `01|${batchId}|${dateStr}|${totalAmount.toFixed(2)}\n`;
      records.forEach(r => {
        content += `02|${r.accountNo}|${r.amount.toFixed(2)}|${r.name}|SALARY\n`;
      });
      return content;
    } else {
      let content = `Recipient Account,Recipient Name,Amount,Currency,Bank Code,Remarks\n`;
      records.forEach(r => {
        content += `"${r.accountNo}","${r.name}",${r.amount.toFixed(2)},PHP,BNK01,"Payroll ${dateStr}"\n`;
      });
      return content;
    }
  };

  const handleDownload = () => {
    const content = generateBankFileContent();
    const ext = bankFormat === 'LANDBANK' ? 'txt' : 'csv';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NKB_Payroll_${bankFormat}_${payRun.payDate || 'Batch'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const content = generateBankFileContent();
    navigator.clipboard.writeText(content).then(() => {
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] my-auto">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                Bank PESONet &amp; Bulk Payroll Export
              </h3>
              <p className="text-[11px] text-slate-400">
                Generate bank-ready automated disbursement files for Philippine commercial banks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bank Selection Tabs */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Corporate Bank Processing Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'BDO', label: 'BDO Unibank', sub: 'PESONet Bulk' },
                { id: 'BPI', label: 'BPI BizLink', sub: 'ExpressLink CSV' },
                { id: 'METROBANK', label: 'Metrobank', sub: 'Direct Corporate' },
                { id: 'LANDBANK', label: 'Landbank', sub: 'weAccess Pipe' },
                { id: 'PESONET', label: 'Generic PESONet', sub: 'Standard Clearing' },
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBankFormat(b.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    bankFormat === b.id
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-black">{b.label}</div>
                  <div className={`text-[10px] ${bankFormat === b.id ? 'text-slate-400' : 'text-slate-500'}`}>
                    {b.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Batch Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Staff Payees</span>
              <span className="text-base font-black text-slate-900 font-mono">{records.length}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Net Disbursement</span>
              <span className="text-base font-black text-emerald-700 font-mono">₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Pay Date</span>
              <span className="text-base font-black text-slate-900 font-mono">{payRun.payDate || 'Immediate'}</span>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3 font-mono">Bank Account #</th>
                  <th className="p-3 text-right">Net Amount (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{r.name}</td>
                    <td className="p-3 font-mono text-slate-500">{r.employeeId}</td>
                    <td className="p-3 font-mono text-slate-700">{r.accountNo}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      ₱{r.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleCopyClipboard}
            className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {copiedBatch ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
            <span>{copiedBatch ? 'Copied Batch Content!' : 'Copy Batch Raw Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>Download {bankFormat} File</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
