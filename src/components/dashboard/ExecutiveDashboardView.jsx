import React, { useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Utensils,
  Landmark,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Printer,
  CheckCircle2,
  DollarSign,
  Building2,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Gift,
  Award,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { detectSystemAnomalies, computeExecutiveRiskSummary } from '../../utils/anomalyDetector';

export default function ExecutiveDashboardView() {
  const {
    staffList = [],
    attendanceLogs = [],
    canteenReceipts = [],
    canteenInventory = [],
    canteenVoidLogs = [],
    cashLoans = [],
    coopBalances = {},
    coopLedger = [],
    payRuns = [],
    anomalyEvaluations = {},
    setActiveTab,
    currentUser
  } = useApp();

  // 1. Detect raw anomalies
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

  // 2. Compute Executive Risk Summary from IT evaluations
  const riskSummary = useMemo(() => {
    return computeExecutiveRiskSummary(rawAnomalies, anomalyEvaluations);
  }, [rawAnomalies, anomalyEvaluations]);

  // 3. Workforce & Attendance metrics (Constraint: No night shift)
  const workforceMetrics = useMemo(() => {
    const totalStaff = staffList.length;
    const activeStaff = staffList.filter(s => s.status === 'Active').length;
    
    // Today's attendance
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = attendanceLogs.filter(a => a.date === todayStr);
    const presentToday = todayLogs.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const lateToday = todayLogs.filter(a => a.status === 'Late').length;
    const onTimeToday = presentToday - lateToday;
    const attendanceRate = totalStaff > 0 ? Math.round((presentToday / totalStaff) * 100) : 0;

    return {
      totalStaff,
      activeStaff,
      presentToday,
      lateToday,
      onTimeToday,
      attendanceRate
    };
  }, [staffList, attendanceLogs]);

  // 4. Canteen Operations metrics
  const canteenMetrics = useMemo(() => {
    const validReceipts = canteenReceipts.filter(r => r.status !== 'VOIDED');
    const totalSales = validReceipts.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const cashSales = validReceipts.filter(r => r.paymentMethod === 'Cash').reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const salaryDeductions = validReceipts.filter(r => r.paymentMethod === 'Salary Deduction').reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const totalInventoryValue = canteenInventory.reduce((sum, i) => sum + ((Number(i.sellingPrice) || 0) * (Number(i.quantity) || 0)), 0);
    const totalInventoryCost = canteenInventory.reduce((sum, i) => sum + ((Number(i.costPrice) || 0) * (Number(i.quantity) || 0)), 0);
    const grossMargin = totalInventoryValue > 0 ? Math.round(((totalInventoryValue - totalInventoryCost) / totalInventoryValue) * 100) : 25;

    return {
      totalReceiptsCount: validReceipts.length,
      totalSales,
      cashSales,
      salaryDeductions,
      totalInventoryValue,
      grossMargin
    };
  }, [canteenReceipts, canteenInventory]);

  // 5. Cooperative Capital & Loan Portfolio exposure
  const coopMetrics = useMemo(() => {
    const totalShareCapital = Object.values(coopBalances).reduce((sum, bal) => sum + (Number(bal) || 0), 0);
    const activeLoans = cashLoans.filter(l => l.status === 'Disbursed' || l.status === 'Approved' || l.status === 'Active');
    const totalOutstandingLoans = activeLoans.reduce((sum, l) => sum + (Number(l.balance || l.amount) || 0), 0);
    const monthlyInterestYield = activeLoans.reduce((sum, l) => sum + ((Number(l.balance || l.amount) || 0) * ((Number(l.monthlyRate) || 2) / 100)), 0);

    return {
      totalShareCapital,
      activeLoanCount: activeLoans.length,
      totalOutstandingLoans,
      monthlyInterestYield
    };
  }, [coopBalances, cashLoans]);

  // 6. Payroll Forecast
  const payrollMetrics = useMemo(() => {
    const latestRun = payRuns[0];
    const totalGross = latestRun?.totalGross || 0;
    const totalNet = latestRun?.totalNet || 0;
    const totalDeductions = latestRun?.totalDeductions || 0;

    return {
      latestRunPeriod: latestRun?.period || 'Current Pay Period',
      totalGross,
      totalNet,
      totalDeductions,
      status: latestRun?.status || 'Draft'
    };
  }, [payRuns]);

  // 7. Accrued 13th Month Pay Liability Reserve (YTD as of Sept 2026)
  const total13thMonthReserve = useMemo(() => {
    return staffList.reduce((sum, s) => {
      const basic = Number(s.salaryRate || s.baseSalary || 25000);
      return sum + Math.round((basic * 9) / 12);
    }, 0);
  }, [staffList]);

  // 8. Upcoming Celebrations & Milestones (Birthdays and Work Anniversaries)
  const celebrations = useMemo(() => {
    const today = new Date();
    const currentYear = 2026;

    const upcomingBirthdays = [];
    const upcomingAnniversaries = [];

    staffList.forEach(s => {
      if (s.birthday) {
        try {
          const parts = s.birthday.split('-');
          if (parts.length === 3) {
            const bMonth = parseInt(parts[1], 10) - 1;
            const bDay = parseInt(parts[2], 10);
            const thisYearBday = new Date(currentYear, bMonth, bDay);
            const diffDays = Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
            if (diffDays >= -1 && diffDays <= 30) {
              upcomingBirthdays.push({
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                department: s.department || 'Plant Operations',
                dateStr: thisYearBday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                daysRemaining: diffDays,
                age: currentYear - parseInt(parts[0], 10)
              });
            }
          }
        } catch {}
      }

      const hireDateStr = s.dateHired || s.hireDate;
      if (hireDateStr) {
        try {
          const parts = hireDateStr.split('-');
          if (parts.length === 3) {
            const hYear = parseInt(parts[0], 10);
            const hMonth = parseInt(parts[1], 10) - 1;
            const hDay = parseInt(parts[2], 10);
            const thisYearAnniv = new Date(currentYear, hMonth, hDay);
            const diffDays = Math.ceil((thisYearAnniv - today) / (1000 * 60 * 60 * 24));
            const years = currentYear - hYear;
            if (diffDays >= -1 && diffDays <= 30 && years > 0) {
              upcomingAnniversaries.push({
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                department: s.department || 'Plant Operations',
                dateStr: thisYearAnniv.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                daysRemaining: diffDays,
                years
              });
            }
          }
        } catch {}
      }
    });

    upcomingBirthdays.sort((a, b) => a.daysRemaining - b.daysRemaining);
    upcomingAnniversaries.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      upcomingBirthdays,
      upcomingAnniversaries
    };
  }, [staffList]);

  // Print executive summary
  const handlePrintExecutiveSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Command Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Executive KPI Command Center
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Live Plant Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              NKB Manufacturing Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1.5 leading-relaxed">
              Consolidated operational overview for Chief Executive Officer Katherine A. BELLA, COO Norvin L. BELLA, Finance, and Plant Leadership. Real-time factory attendance, canteen revenue velocity, cooperative capital health, and IT-evaluated security posture.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handlePrintExecutiveSummary}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-extrabold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-900" />
              <span>Print Executive Briefing</span>
            </button>
          </div>
        </div>

        {/* Executive Subsystem Quick Jump Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Jump to Operations:
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>Staff Masterlist</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-400" />
            <span>Payroll Engine</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coopLoans')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Landmark className="h-3.5 w-3.5 text-amber-400" />
            <span>Coop Capital &amp; Loans</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('canteenHub')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Utensils className="h-3.5 w-3.5 text-rose-400" />
            <span>Canteen POS Hub</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('itAdminHub')}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>IT Master Records &amp; Security</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Operational Pillars KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pillar 1: Workforce & Factory Attendance */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-cyan-600" /> Plant Attendance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
              Day Shift (No Night Shift)
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              {workforceMetrics.attendanceRate}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {workforceMetrics.presentToday} of {workforceMetrics.totalStaff} staff clocked in today
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]>">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">On-Time</div>
              <div className="font-bold text-emerald-700">{workforceMetrics.onTimeToday}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Late Arrived</div>
              <div className="font-bold text-amber-700">{workforceMetrics.lateToday}</div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Canteen Revenue & Grocery Velocity */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-emerald-600" /> Canteen Velocity
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {canteenMetrics.grossMargin}% Gross Margin
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              ₱{canteenMetrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {canteenMetrics.totalReceiptsCount} completed transactions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Cash Sales</div>
              <div className="font-bold text-slate-900 font-mono">₱{canteenMetrics.cashSales.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Salary Deductions</div>
              <div className="font-bold text-indigo-700 font-mono">₱{canteenMetrics.salaryDeductions.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Cooperative Capital & Loan Exposure */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-amber-600" /> Coop Capital
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
              {coopMetrics.activeLoanCount} Active Loans
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              ₱{coopMetrics.totalShareCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Total member equity &amp; share deposits
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Loan Portfolio</div>
              <div className="font-bold text-rose-700 font-mono">₱{coopMetrics.totalOutstandingLoans.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Monthly Yield</div>
              <div className="font-bold text-emerald-700 font-mono">₱{coopMetrics.monthlyInterestYield.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Pillar 4: Payroll & Statutory Liability */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-indigo-600" /> Payroll Commitment
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {payrollMetrics.status}
            </span>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">
              ₱{payrollMetrics.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Net take-home pay liability ({payrollMetrics.latestRunPeriod})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Gross Payroll</div>
              <div className="font-bold text-slate-900 font-mono">₱{payrollMetrics.totalGross.toLocaleString()}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-slate-400">Total Deductions</div>
              <div className="font-bold text-slate-700 font-mono">₱{payrollMetrics.totalDeductions.toLocaleString()}</div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: CORPORATE ACCRUALS & WORKFORCE CELEBRATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 13th Month Pay Accrual Reserve Card */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-3xl border border-indigo-900/50 p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" /> Statutory 13th Month Accrual Reserve
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                YTD Accrued
              </span>
            </div>
            <div className="text-3xl font-black text-white font-mono mt-1">
              ₱{total13thMonthReserve.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-indigo-200/70 mt-1">
              Cumulative DOLE statutory reserve ({staffList.length} active staff · 9/12 months completed as of Sept 2026).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-800/40">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-indigo-300 font-medium">Annual Funding Progress</span>
              <span className="font-mono font-bold text-white">75.0% (9 of 12 Mos)</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-indigo-900/50">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
            </div>
            <div className="text-[11px] text-indigo-300/60 mt-2 flex items-center justify-between">
              <span>Matures Dec 24, 2026</span>
              <span>Projected: ₱{(total13thMonthReserve * 12 / 9).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Celebrations & Milestones: Birthdays & Work Anniversaries */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                <h3 className="text-base font-black text-slate-900">Workforce Celebrations &amp; Milestones</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Upcoming birthdays &amp; service anniversaries within next 30 days</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
              {celebrations.upcomingBirthdays.length + celebrations.upcomingAnniversaries.length} Upcoming
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Birthdays */}
            <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-100">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-800 uppercase tracking-wide mb-3">
                <Gift className="h-4 w-4 text-pink-600" /> Upcoming Birthdays ({celebrations.upcomingBirthdays.length})
              </div>
              {celebrations.upcomingBirthdays.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No birthdays in the next 30 days</div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {celebrations.upcomingBirthdays.slice(0, 4).map((b) => (
                    <div key={b.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-pink-100 text-xs shadow-2xs">
                      <div>
                        <div className="font-bold text-slate-800">{b.name}</div>
                        <div className="text-[10px] text-slate-400">{b.department}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px]">
                          {b.daysRemaining === 0 ? 'Today! 🎉' : b.daysRemaining === 1 ? 'Tomorrow' : b.dateStr}
                        </span>
                        {b.age && <div className="text-[10px] text-slate-400 mt-0.5">Turns {b.age}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Anniversaries */}
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">
                <Award className="h-4 w-4 text-amber-600" /> Work Anniversaries ({celebrations.upcomingAnniversaries.length})
              </div>
              {celebrations.upcomingAnniversaries.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">No work anniversaries in next 30 days</div>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {celebrations.upcomingAnniversaries.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-100 text-xs shadow-2xs">
                      <div>
                        <div className="font-bold text-slate-800">{a.name}</div>
                        <div className="text-[10px] text-slate-400">{a.department}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {a.years} Year{a.years > 1 ? 's' : ''} ({a.dateStr})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: IT-EVALUATED SECURITY & ANOMALY EXECUTIVE BRIEFING */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-200 bg-slate-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Executive Security Briefing &amp; IT-Evaluated Anomalies
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase">
                  IT Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated by IT Admin <strong>Carl Laurence B. PATAGNAN</strong>. Only verified risks escalated from IT Admin Master Records are surfaced here.
              </p>
            </div>
          </div>

          {/* System Risk Score Pill */}
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Overall Plant Risk Index</div>
              <div className="text-xl font-black font-mono text-cyan-400">
                {riskSummary.systemRiskScore}/100 · {riskSummary.riskLevel}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <button
              type="button"
              onClick={() => setActiveTab('itAdminHub')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage in IT Hub</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Unreviewed raw anomalies disclaimer banner */}
        {riskSummary.pendingReviewCount > 0 && (
          <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Under IT Investigation:</strong> {riskSummary.pendingReviewCount} potential anomaly signal(s) are currently undergoing investigation by IT Administration and will only reflect in this executive index upon formal IT confirmation.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('itAdminHub')}
              className="px-3 py-1 rounded-xl bg-amber-900 text-white text-[11px] font-bold shrink-0 cursor-pointer hover:bg-amber-800"
            >
              Open IT Review
            </button>
          </div>
        )}

        {/* List of IT Evaluated and Confirmed Anomaly Alerts */}
        <div className="p-6 divide-y divide-slate-100">
          {riskSummary.executiveAlerts.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-black text-slate-900">Zero Unresolved Security Infractions</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No confirmed anomalies have been escalated by IT Administration. All previous signals have either been verified legitimate or resolved.
              </p>
            </div>
          ) : (
            riskSummary.executiveAlerts.map(alert => (
              <div key={alert.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                      {alert.severity} RISK
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {alert.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Detected: {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {alert.description}
                  </p>

                  {/* IT Admin Verified Finding Commentary */}
                  {alert.evaluation && (
                    <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-bold uppercase text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          IT Admin Finding: {alert.evaluation.reviewedBy}
                        </span>
                        <span>{new Date(alert.evaluation.reviewedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 font-medium">
                        {alert.evaluation.notes || 'Investigated and confirmed by IT Administration.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col md:items-end">
                  <span className="px-3 py-1 rounded-full text-xs font-black border bg-slate-100 text-slate-800 border-slate-300">
                    {alert.evaluation?.status?.replace(/_/g, ' ') || 'UNDER IT REVIEW'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
