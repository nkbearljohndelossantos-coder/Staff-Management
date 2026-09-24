import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Download,
  Trash2,
  Activity,
  User,
  Clock,
  FileText,
  CheckCircle,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { clearAuditLogs } from '../../utils/auditLogger';

export default function ITSystemAuditLogView() {
  const { auditLogs = [], logSystemEvent, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
      if (dateFilter && !log.timestamp.startsWith(dateFilter)) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.operatorName && log.operatorName.toLowerCase().includes(q)) ||
        (log.operatorId && log.operatorId.toLowerCase().includes(q)) ||
        (log.targetId && log.targetId.toLowerCase().includes(q))
      );
    });
  }, [auditLogs, categoryFilter, dateFilter, searchQuery]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Category', 'Action', 'Operator', 'Operator Role', 'Details', 'Target ID'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.category,
      l.action,
      `"${l.operatorName || ''}"`,
      l.operatorRole || '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.targetId || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `NKB_Security_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = ['ALL', 'AUTH', 'CANTEEN', 'STAFF', 'PAYROLL', 'ATTENDANCE', 'SECURITY'];

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Immutable Security Ledger
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              Continuous Event Logging
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            System Security &amp; Operations Audit Trail
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Tamper-evident chronological log of user logins, role privilege escalations, master record amendments, loan disbursements, supervisor voids, and anomaly reviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, details, operator, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Recorded Ledger Events ({filteredLogs.length} entries)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Chronological Event Sequence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Event Details</th>
                <th className="p-3.5">Target Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.category === 'SECURITY'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.category === 'AUTH'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : log.category === 'PAYROLL'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.category === 'CANTEEN'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold font-mono text-slate-900">
                      {log.action}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{log.operatorName || 'System'}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{log.operatorRole}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 max-w-md">
                      {log.details}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {log.targetId || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
