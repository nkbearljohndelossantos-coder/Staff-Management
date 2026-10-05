import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Video,
  Camera,
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Check,
  ExternalLink,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SEVERITY_LEVELS, REPORT_STATUSES } from '../../utils/misconductUtils';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function MisconductReportsManagerModal({ isOpen, onClose, onOpenNewReport }) {
  const { misconductReports = [], resolveMisconductReport, isHR } = useApp();

  useEscapeKey('misconduct-manager-modal', ESCAPE_PRIORITY.MODAL, isOpen, onClose);

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Form
  const [resolutionSanction, setResolutionSanction] = useState('Written Warning');
  const [resolutionStatus, setResolutionStatus] = useState('RESOLVED_WARNED');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const filteredReports = misconductReports.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (r.staffName || '').toLowerCase().includes(q) ||
      (r.staffEmployeeId || '').toLowerCase().includes(q) ||
      (r.categoryLabel || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'OPEN' && (r.status === 'PENDING_EXPLANATION' || r.status === 'ACKNOWLEDGED' || r.status === 'EXPLANATION_SUBMITTED' || r.status === 'UNDER_HR_INVESTIGATION')) ||
      r.status === statusFilter;

    const matchesSeverity = severityFilter === 'ALL' || r.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const activeReport = misconductReports.find(r => r.id === selectedReportId) || filteredReports[0] || null;

  const handleResolve = (e) => {
    e.preventDefault();
    if (!activeReport) return;
    resolveMisconductReport(activeReport.id, {
      sanction: resolutionSanction,
      notes: resolutionNotes,
      status: resolutionStatus
    });
    setResolutionNotes('');
  };

  const getSeverityBadge = (sevId) => {
    const sev = SEVERITY_LEVELS.find(s => s.id === sevId);
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${sev?.badgeClass || 'bg-slate-100 text-slate-800'}`}>
        {sev?.label || sevId}
      </span>
    );
  };

  const getStatusBadge = (statusId) => {
    switch (statusId) {
      case 'PENDING_EXPLANATION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            HR Call-Out Active
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
            Notice Acknowledged
          </span>
        );
      case 'EXPLANATION_SUBMITTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-400 border border-sky-300 dark:border-sky-800">
            Explanation Received
          </span>
        );
      case 'RESOLVED_WARNED':
      case 'RESOLVED_SUSPENDED':
      case 'RESOLVED_DISMISSED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            Resolved
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            {statusId}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/80">
                  Security &amp; CCTV Incident Masterlist
                </span>
                <span className="text-[10px] text-slate-400">
                  {misconductReports.length} Total Cases Filed
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Staff Misconduct Reports &amp; CCTV Review Center
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenNewReport) onOpenNewReport();
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>+ File New Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by worker name, ID, or category..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open / Active Call-Outs</option>
              <option value="PENDING_EXPLANATION">Pending Explanation</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="EXPLANATION_SUBMITTED">Explanation Submitted</option>
              <option value="RESOLVED_WARNED">Resolved</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="MINOR">Minor</option>
              <option value="MODERATE">Moderate</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Content Body: Split Layout (Left Master List, Right Detailed Dossier) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          
          {/* Left Master List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[50vh] lg:max-h-none">
            {filteredReports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Shield className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No incident reports found</p>
                <p className="text-[11px] text-slate-400">
                  {misconductReports.length === 0 ? 'No employee misconduct reports have been filed yet.' : 'Try changing your search query or filter.'}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = activeReport?.id === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-3.5 transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-l-4 border-rose-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {report.id}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {report.incidentDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {report.staffName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          ({report.staffEmployeeId})
                        </span>
                      </div>

                      <p className="text-xs text-rose-700 dark:text-rose-400 font-bold truncate mb-1.5">
                        {report.categoryLabel}
                      </p>

                      <div className="flex items-center gap-2">
                        {getSeverityBadge(report.severity)}
                        {getStatusBadge(report.status)}
                        {report.attachment && (
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-0.5">
                            <Video className="h-3 w-3" />
                            CCTV
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className={`h-4 w-4 shrink-0 transition-colors mt-2 ${
                      isSelected ? 'text-rose-600' : 'text-slate-300 dark:text-slate-600'
                    }`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Right Detailed Dossier View */}
          {activeReport ? (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              
              {/* Report Header Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center font-black text-base shrink-0">
                    {activeReport.staffName?.slice(0, 2).toUpperCase() || 'EM'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {activeReport.staffName}
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        ({activeReport.staffEmployeeId})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeReport.staffPosition} · {activeReport.staffDepartment}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(activeReport.severity)}
                  {getStatusBadge(activeReport.status)}
                </div>
              </div>

              {/* Incident Specifications Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Misconduct Category</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{activeReport.categoryLabel}</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date &amp; Time</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{activeReport.incidentDate} at {activeReport.incidentTime}</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Zone</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{activeReport.location}</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filing Officer</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{activeReport.reporterName} ({activeReport.reporterRole?.toUpperCase()})</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CCTV Camera Reference</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {activeReport.cctvCameraId || 'No specific camera tagged'} {activeReport.cctvTimecode ? `[${activeReport.cctvTimecode}]` : ''}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notice Acknowledged</span>
                  <span className={`text-xs font-bold ${activeReport.acknowledgedAt ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {activeReport.acknowledgedAt ? new Date(activeReport.acknowledgedAt).toLocaleString() : 'Pending Receipt by Staff'}
                  </span>
                </div>
              </div>

              {/* Narrative Statement */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Factual Narrative &amp; Findings
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeReport.narrative}
                </p>
              </div>

              {/* CCTV Footage / Attachment Player */}
              {activeReport.attachment && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-sky-400" />
                      <span className="text-xs font-bold">CCTV Attached Evidence: {activeReport.attachment.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {(activeReport.attachment.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-96">
                    {activeReport.attachment.isVideo ? (
                      <video
                        controls
                        src={activeReport.attachment.dataUrl}
                        className="max-h-96 w-full object-contain"
                      />
                    ) : (
                      <img
                        src={activeReport.attachment.dataUrl}
                        alt="CCTV Evidence"
                        className="max-h-96 object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* External DVR Stream Link */}
              {activeReport.cctvExternalLink && (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-sky-900 dark:text-sky-300 font-bold">
                    <ExternalLink className="h-4 w-4 text-sky-500" />
                    <span>External NVR / DVR Video Stream URL</span>
                  </div>
                  <a
                    href={activeReport.cctvExternalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-sky-600 dark:text-sky-400 underline hover:text-sky-800"
                  >
                    Open Live Footage Stream
                  </a>
                </div>
              )}

              {/* Formal Notice Message Sent to Employee */}
              {activeReport.notificationMessage && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-300">
                      Notice to Explain (NTE) Issued to Staff Account
                    </h4>
                    {activeReport.acknowledgedAt && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Acknowledged by Employee
                      </span>
                    )}
                  </div>
                  <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
                    {activeReport.notificationMessage}
                  </pre>
                </div>
              )}

              {/* Employee's Written Explanation (If submitted) */}
              {activeReport.explanationText && (
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 dark:text-sky-300 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-sky-600" />
                      Employee Written Explanation Statement
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Submitted: {new Date(activeReport.explanationSubmittedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-sky-100 dark:border-sky-900/40">
                    {activeReport.explanationText}
                  </p>
                </div>
              )}

              {/* HR Case Resolution Section */}
              {isHR && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    HR Final Determination &amp; Disciplinary Sanction
                  </h4>

                  {activeReport.resolvedAt ? (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Determination: {activeReport.resolutionSanction}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Resolved on {new Date(activeReport.resolvedAt).toLocaleDateString()} by {activeReport.resolvedBy}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {activeReport.resolutionNotes || 'No additional closing remarks.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleResolve} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Disciplinary Sanction
                          </label>
                          <select
                            value={resolutionSanction}
                            onChange={(e) => {
                              setResolutionSanction(e.target.value);
                              if (e.target.value.includes('Dismissed')) {
                                setResolutionStatus('RESOLVED_DISMISSED');
                              } else if (e.target.value.includes('Suspension')) {
                                setResolutionStatus('RESOLVED_SUSPENDED');
                              } else {
                                setResolutionStatus('RESOLVED_WARNED');
                              }
                            }}
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="Verbal Warning (First Offense)">Verbal Warning (First Offense)</option>
                            <option value="Formal Written Warning & Reprimand">Formal Written Warning &amp; Reprimand</option>
                            <option value="3-Day Disciplinary Suspension">3-Day Disciplinary Suspension</option>
                            <option value="7-Day Disciplinary Suspension">7-Day Disciplinary Suspension</option>
                            <option value="Preventive Suspension Pending Termination">Preventive Suspension Pending Termination</option>
                            <option value="Case Dismissed / Exonerated (No Violation)">Case Dismissed / Exonerated (No Violation)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Case Final Status
                          </label>
                          <select
                            value={resolutionStatus}
                            onChange={(e) => setResolutionStatus(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="RESOLVED_WARNED">Resolved (Warning Issued)</option>
                            <option value="RESOLVED_SUSPENDED">Resolved (Suspension Imposed)</option>
                            <option value="RESOLVED_DISMISSED">Resolved (Dismissed / Exonerated)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          HR Formal Findings &amp; Closing Remarks
                        </label>
                        <textarea
                          rows={2}
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Record findings after conference, agreed corrective actions, or terms..."
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold cursor-pointer transition shadow-sm"
                        >
                          Record Case Resolution
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Eye className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select an incident to view full dossier</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
