import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  FileText,
  UserCheck,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { detectSystemAnomalies, computeExecutiveRiskSummary } from '../../utils/anomalyDetector';

export default function ITAnomalyEvaluationView() {
  const {
    attendanceLogs = [],
    canteenReceipts = [],
    canteenInventory = [],
    canteenVoidLogs = [],
    cashLoans = [],
    staffList = [],
    currentUser,
    anomalyEvaluations = {},
    recordAnomalyEvaluation,
    logSystemEvent
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Local edit state for review forms per anomaly ID
  const [draftEvaluations, setDraftEvaluations] = useState({});

  // 1. Detect anomalies across collections
  const rawAnomalies = useMemo(() => {
    return detectSystemAnomalies({
      attendanceLogs,
      canteenReceipts,
      canteenInventory,
      canteenVoidLogs,
      cashLoans,
      staffList
    });
  }, [attendanceLogs, canteenReceipts, canteenInventory, canteenVoidLogs, cashLoans, staffList]);

  // 2. Compute Executive Risk Summary
  const riskSummary = useMemo(() => {
    return computeExecutiveRiskSummary(rawAnomalies, anomalyEvaluations);
  }, [rawAnomalies, anomalyEvaluations]);

  // Handle draft field changes
  const handleDraftChange = (id, field, value) => {
    setDraftEvaluations(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || anomalyEvaluations[id] || { status: 'UNDER_REVIEW', notes: '' }),
        [field]: value
      }
    }));
  };

  // Submit IT Evaluation
  const handleSaveEvaluation = (anomalyId) => {
    const draft = draftEvaluations[anomalyId] || anomalyEvaluations[anomalyId] || {
      status: 'UNDER_REVIEW',
      notes: 'Investigated by IT Admin'
    };

    recordAnomalyEvaluation(anomalyId, {
      status: draft.status || 'UNDER_REVIEW',
      notes: draft.notes || '',
      reviewedBy: currentUser?.name || 'IT Admin Carl Laurence B. PATAGNAN',
      reviewedAt: new Date().toISOString()
    });

    logSystemEvent({
      category: 'SECURITY',
      action: 'EVALUATE_ANOMALY',
      details: `IT Admin updated evaluation for ${anomalyId} -> ${draft.status}`,
      targetId: anomalyId
    });
  };

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return rawAnomalies.filter(item => {
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
      const evaluation = anomalyEvaluations[item.id];
      const evalStatus = evaluation?.status || 'PENDING_REVIEW';
      if (statusFilter !== 'ALL' && evalStatus !== statusFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.metadata?.staffName && item.metadata.staffName.toLowerCase().includes(q)) ||
        (item.metadata?.staffId && item.metadata.staffId.toLowerCase().includes(q))
      );
    });
  }, [rawAnomalies, severityFilter, statusFilter, searchQuery, anomalyEvaluations]);

  return (
    <div className="space-y-6">
      
      {/* Risk Metrics Executive Alignment Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Security &amp; Anomaly Evaluation Stage
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                IT Gatekeeper Workflow
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              IT Admin Anomaly Evaluation &amp; Executive Risk Dispatch
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Anomalies detected across barcode timekeeping, rapid POS void clusters, inventory shrinkage, and loan velocity are reviewed here by IT Admin <strong>Carl Laurence B. PATAGNAN</strong> before evaluated risk scores flow to the Executive Dashboard.
            </p>
          </div>

          {/* Risk Gauge Metric Card */}
          <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl shrink-0">
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Risk Index</div>
              <div className="text-3xl font-black font-mono mt-0.5 text-cyan-400">
                {riskSummary.systemRiskScore}/100
              </div>
              <div className="text-[10px] font-semibold text-slate-500">Evaluated Score</div>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div className="text-xs space-y-1">
              <div className="flex items-center justify-between gap-3 text-slate-300">
                <span>Total Detected:</span>
                <span className="font-bold font-mono text-white">{riskSummary.totalDetected}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-amber-300">
                <span>Pending IT Review:</span>
                <span className="font-bold font-mono">{riskSummary.pendingReviewCount}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-400">
                <span>IT Cleared Legitimate:</span>
                <span className="font-bold font-mono">{riskSummary.clearedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Evaluation</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{riskSummary.pendingReviewCount}</div>
            <div className="text-[10px] text-slate-500">Requires IT investigation</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirmed Infractions</div>
            <div className="text-lg font-black text-rose-400 mt-0.5">{riskSummary.confirmedRisks}</div>
            <div className="text-[10px] text-slate-500">Escalated to Executive View</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cleared as Normal</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{riskSummary.clearedCount}</div>
            <div className="text-[10px] text-slate-500">Verified legitimate explanation</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Executive Sync</div>
            <div className="text-lg font-black text-cyan-400 mt-0.5">ACTIVE</div>
            <div className="text-[10px] text-slate-500">Only evaluated data exposed</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search anomalies by keyword, employee, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* IT Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">IT Review Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CONFIRMED_ANOMALY">Confirmed Anomaly</option>
              <option value="CLEARED_LEGITIMATE">Cleared Legitimate</option>
              <option value="ACTION_TAKEN">Action Taken</option>
            </select>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filteredAnomalies.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-black text-slate-900">No Security Anomalies Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All transactions, attendance timestamps, POS registers, and inventory records are operating within normal operational parameters.
            </p>
          </div>
        ) : (
          filteredAnomalies.map((anomaly) => {
            const evaluation = anomalyEvaluations[anomaly.id];
            const draft = draftEvaluations[anomaly.id] || evaluation || {
              status: 'UNDER_REVIEW',
              notes: ''
            };
            const isEvaluated = Boolean(evaluation);

            return (
              <div
                key={anomaly.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* Header row */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      anomaly.severity === 'CRITICAL' || anomaly.severity === 'HIGH'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          anomaly.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : anomaly.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {anomaly.severity} SEVERITY
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                          {anomaly.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Detected: {new Date(anomaly.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900 mt-1">
                        {anomaly.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {anomaly.description}
                      </p>
                    </div>
                  </div>

                  {/* Current Evaluation Status Badge */}
                  <div className="shrink-0 flex flex-col md:items-end">
                    <span className="text-[10px] font-bold uppercase text-slate-400 mb-1">Executive Alignment</span>
                    {isEvaluated ? (
                      <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 ${
                        evaluation.status === 'CONFIRMED_ANOMALY'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : evaluation.status === 'CLEARED_LEGITIMATE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : evaluation.status === 'ACTION_TAKEN'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <CheckCircle className="h-3.5 w-3.5" />
                        {evaluation.status.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        PENDING IT EVALUATION
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Breakdown */}
                {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                  <div className="px-5 py-3 bg-slate-50/30 border-b border-slate-100 flex flex-wrap gap-4 text-xs font-mono text-slate-600">
                    {anomaly.metadata.staffName && (
                      <div><strong className="text-slate-400 uppercase text-[10px]">Staff:</strong> {anomaly.metadata.staffName} ({anomaly.metadata.staffId})</div>
                    )}
                    {anomaly.metadata.deltaSeconds !== undefined && (
                      <div><strong className="text-slate-400 uppercase text-[10px]>">Time Gap:</strong> {anomaly.metadata.deltaSeconds}s</div>
                    )}
                    {anomaly.metadata.voidCount !== undefined && (
                      <div><strong className="text-slate-400 uppercase text-[10px]">Void Count:</strong> {anomaly.metadata.voidCount} in 2 hours</div>
                    )}
                    {anomaly.metadata.barcode && (
                      <div><strong className="text-slate-400 uppercase text-[10px]">Barcode:</strong> {anomaly.metadata.barcode}</div>
                    )}
                    {anomaly.metadata.quantity !== undefined && (
                      <div><strong className="text-slate-400 uppercase text-[10px]">Stock Level:</strong> {anomaly.metadata.quantity}</div>
                    )}
                    {anomaly.metadata.recentLoanCount !== undefined && (
                      <div><strong className="text-slate-400 uppercase text-[10px]">Loans in 30D:</strong> {anomaly.metadata.recentLoanCount}</div>
                    )}
                  </div>
                )}

                {/* IT Evaluation Controls Form */}
                <div className="p-5 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-cyan-600" />
                      IT Administrator Evaluation &amp; Verdict
                    </span>
                    {evaluation && (
                      <span className="text-[10px] text-slate-400">
                        Last reviewed by {evaluation.reviewedBy} on {new Date(evaluation.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Status selector */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Evaluation Verdict
                      </label>
                      <select
                        value={draft.status || 'UNDER_REVIEW'}
                        onChange={(e) => handleDraftChange(anomaly.id, 'status', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="UNDER_REVIEW">🔍 Under Review (Investigating)</option>
                        <option value="CLEARED_LEGITIMATE">✅ Cleared Legitimate (Normal / Excused)</option>
                        <option value="CONFIRMED_ANOMALY">⚠️ Confirmed Anomaly (Escalate to CEO)</option>
                        <option value="ACTION_TAKEN">🛡️ Action Taken (Clerical / Disciplinary)</option>
                      </select>
                    </div>

                    {/* Investigation Notes input */}
                    <div className="md:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        IT Findings &amp; Investigation Notes
                      </label>
                      <input
                        type="text"
                        value={draft.notes || ''}
                        onChange={(e) => handleDraftChange(anomaly.id, 'notes', e.target.value)}
                        placeholder="e.g. Cross-checked with CCTV / barcode terminal clock sync verified..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>

                    {/* Save button */}
                    <div className="md:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => handleSaveEvaluation(anomaly.id)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Sync Exec</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
