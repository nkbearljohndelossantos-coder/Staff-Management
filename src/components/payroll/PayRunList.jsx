import React, { useState } from 'react';
import { Calculator, Plus, CheckCircle2, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import PayRunDetails from './PayRunDetails';

export default function PayRunList() {
  const { payRuns, createPayRun, isAccounting } = useApp();
  const [selectedPayRunId, setSelectedPayRunId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [newTitle, setNewTitle] = useState('1st Half June 2026 Regular Payroll');
  const [newStart, setNewStart] = useState('2026-06-01');
  const [newEnd, setNewEnd] = useState('2026-06-15');
  const [newPayDate, setNewPayDate] = useState('2026-06-15');

  const handleCreateRun = (e) => {
    e.preventDefault();
    const run = createPayRun({
      title: newTitle,
      periodStart: newStart,
      periodEnd: newEnd,
      payDate: newPayDate
    });
    setIsCreating(false);
    setSelectedPayRunId(run.id);
  };

  if (selectedPayRunId) {
    return (
      <PayRunDetails
        payRunId={selectedPayRunId}
        onBack={() => setSelectedPayRunId(null)}
      />
    );
  }

  const totalDisbursedYtd = payRuns
    .filter(r => r.status === 'Approved' || r.status === 'Disbursed')
    .reduce((acc, r) => acc + (r.totalNet || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-600" />
            Payroll Processing &amp; Pay Runs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated gross earnings calculation, statutory tax deductions &amp; bank files</p>
        </div>

        {isAccounting && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shrink-0 shadow-sm transition"
          >
            <Plus className="h-4 w-4 text-white" />
            Create New Pay Run Batch
          </button>
        )}
      </div>

      {/* Stats Cards (Light theme, monochrome icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Net Disbursed YTD</span>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalDisbursedYtd)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved and locked batches</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Pay Run Batches</span>
          <div className="mt-2 text-2xl font-black text-slate-900">{payRuns.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Historical &amp; active cycles</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Payroll Engine Status</span>
          <div className="mt-2 text-2xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-slate-600" />
            <span>Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Statutory 2026 formulas synced</p>
        </div>
      </div>

      {/* Pay Runs Batches List */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900">Payroll Batches &amp; Periods</h3>

        <div className="grid grid-cols-1 gap-3">
          {payRuns.map((run) => (
            <div
              key={run.id}
              onClick={() => setSelectedPayRunId(run.id)}
              className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer shadow-sm group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-slate-700">{run.code}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {run.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-slate-700 transition">
                  {run.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Cut-off Period: <strong className="text-slate-700">{run.periodStart}</strong> to <strong className="text-slate-700">{run.periodEnd}</strong> · Payout: {run.payDate}
                </p>
              </div>

              <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Net Batch Total</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    {formatCurrency(run.totalNet || 0)}
                  </span>
                </div>

                <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 text-slate-500 group-hover:text-white flex items-center justify-center transition">
                  <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Pay Run Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Create New Pay Run Batch</h3>
            <p className="text-slate-500 mb-4">Set up a new semi-monthly or monthly cut-off cycle</p>

            <form onSubmit={handleCreateRun} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Batch Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cut-Off Start Date</label>
                  <input
                    type="date"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none font-mono focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cut-Off End Date</label>
                  <input
                    type="date"
                    required
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none font-mono focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Disbursement / Payout Date</label>
                <input
                  type="date"
                  required
                  value={newPayDate}
                  onChange={(e) => setNewPayDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none font-mono focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold cursor-pointer shadow-sm transition"
                >
                  Initialize Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
