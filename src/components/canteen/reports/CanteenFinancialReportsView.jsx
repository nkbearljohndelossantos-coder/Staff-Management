import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Search, 
  Download, 
  Printer, 
  Edit3, 
  RotateCcw, 
  Layers, 
  Info,
  CalendarRange,
  X,
  Filter,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  BENCHMARK_SUMMARY_RECORDS, 
  BENCHMARK_DATES, 
  BENCHMARK_DAILY_ENTRIES 
} from './financialBenchmarkData';

export default function CanteenFinancialReportsView({
  canteenReceipts = [],
  canteenGatePasses = [],
  cashLoans = [],
  cashAdvances = [],
  personalPurchaseOrders = [],
  staffList = []
}) {
  // Sub-tabs: 'cash_sale' (Screenshot 1) vs 'summary' (Screenshot 2)
  const [activeReportTab, setActiveReportTab] = useState('cash_sale');

  // Filter only employees who actually have transactions ("meron lang nakuha")
  const [onlyWithTransactions, setOnlyWithTransactions] = useState(true);
  
  // Filter only dates with actual transactions in Daily Matrix
  const [onlyActiveDates, setOnlyActiveDates] = useState(true);
  
  // Cut-off period selection
  const [cutoffPreset, setCutoffPreset] = useState('BENCHMARK');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // 5 = May, 10 = Oct, 11 = Nov

  // Self-contained date range state
  const [startDate, setStartDate] = useState('2026-05-11');
  const [endDate, setEndDate] = useState('2026-05-25');
  
  // Self-contained search query
  const [searchQuery, setSearchQuery] = useState('');

  // Data source: 'BENCHMARK' (exact match to screenshots) or 'LIVE' (aggregated from system DB)
  const [dataSource, setDataSource] = useState('BENCHMARK');
  
  // Inline edit mode & persistent adjustments stored in localStorage
  const [isEditMode, setIsEditMode] = useState(false);
  const [manualAdjustments, setManualAdjustments] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_financial_adjustments_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveAdjustments = (newAdj) => {
    setManualAdjustments(newAdj);
    try {
      localStorage.setItem('nkb_canteen_financial_adjustments_v1', JSON.stringify(newAdj));
    } catch (e) {
      console.error('Failed to save financial adjustments to localStorage', e);
    }
  };

  const handleCellChange = (reportKey, staffName, fieldOrDate, value) => {
    const num = parseFloat(value) || 0;
    const updated = {
      ...manualAdjustments,
      [reportKey]: {
        ...(manualAdjustments[reportKey] || {}),
        [staffName]: {
          ...((manualAdjustments[reportKey] || {})[staffName] || {}),
          [fieldOrDate]: num
        }
      }
    };
    saveAdjustments(updated);
  };

  const handleResetAdjustments = () => {
    if (window.confirm('Reset all manual overrides to default values?')) {
      setManualAdjustments({});
      localStorage.removeItem('nkb_canteen_financial_adjustments_v1');
    }
  };

  // Helper to apply cut-off range safely without external callback cascades
  const applyCutoff = (presetKey, yr = selectedYear, mo = selectedMonth) => {
    setCutoffPreset(presetKey);
    const pad = (n) => String(n).padStart(2, '0');

    if (presetKey === 'BENCHMARK') {
      setStartDate('2026-05-11');
      setEndDate('2026-05-25');
      setSelectedYear(2026);
      setSelectedMonth(5);
      setDataSource('BENCHMARK');
      return;
    }

    if (presetKey === 'OCT_LIVE') {
      setStartDate('2026-10-11');
      setEndDate('2026-10-25');
      setSelectedYear(2026);
      setSelectedMonth(10);
      setDataSource('LIVE');
      return;
    }

    if (presetKey === 'OCT_FULL') {
      setStartDate('2026-10-01');
      setEndDate('2026-10-31');
      setSelectedYear(2026);
      setSelectedMonth(10);
      setDataSource('LIVE');
      return;
    }

    if (presetKey === '11_25') {
      setStartDate(`${yr}-${pad(mo)}-11`);
      setEndDate(`${yr}-${pad(mo)}-25`);
      setDataSource('LIVE');
      return;
    }

    if (presetKey === '26_10') {
      const nextMo = mo === 12 ? 1 : mo + 1;
      const nextYr = mo === 12 ? yr + 1 : yr;
      setStartDate(`${yr}-${pad(mo)}-26`);
      setEndDate(`${nextYr}-${pad(nextMo)}-10`);
      setDataSource('LIVE');
      return;
    }

    if (presetKey === 'FIRST_HALF') {
      setStartDate(`${yr}-${pad(mo)}-01`);
      setEndDate(`${yr}-${pad(mo)}-15`);
      setDataSource('LIVE');
      return;
    }

    if (presetKey === 'SECOND_HALF') {
      const lastDay = new Date(yr, mo, 0).getDate();
      setStartDate(`${yr}-${pad(mo)}-16`);
      setEndDate(`${yr}-${pad(mo)}-${pad(lastDay)}`);
      setDataSource('LIVE');
      return;
    }

    if (presetKey === 'ALL') {
      setStartDate('');
      setEndDate('');
      setDataSource('LIVE');
      return;
    }
  };

  // Generate all date objects in the selected range without timezone shift
  const allDateObjects = useMemo(() => {
    if (cutoffPreset === 'BENCHMARK' && dataSource === 'BENCHMARK') {
      return BENCHMARK_DATES.map((label, idx) => ({
        label,
        isoDate: `2026-05-${String(11 + idx).padStart(2, '0')}`,
        dateKey: label
      }));
    }

    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (!startDate || !endDate) {
      // Default to 15 days of selected month
      const pad = (n) => String(n).padStart(2, '0');
      const dates = [];
      for (let d = 1; d <= 15; d++) {
        const iso = `${selectedYear}-${pad(selectedMonth)}-${pad(d)}`;
        const label = `${MONTH_NAMES[selectedMonth - 1]} ${d}`;
        dates.push({ label, isoDate: iso, dateKey: label });
      }
      return dates;
    }

    // Safe string parsing
    const sParts = startDate.split('-').map(Number);
    const eParts = endDate.split('-').map(Number);
    if (sParts.length !== 3 || eParts.length !== 3 || sParts.some(isNaN) || eParts.some(isNaN)) {
      return BENCHMARK_DATES.map((label, idx) => ({
        label,
        isoDate: `2026-05-${String(11 + idx).padStart(2, '0')}`,
        dateKey: label
      }));
    }

    const [sY, sM, sD] = sParts;
    const [eY, eM, eD] = eParts;
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return BENCHMARK_DATES.map((label, idx) => ({
        label,
        isoDate: `2026-05-${String(11 + idx).padStart(2, '0')}`,
        dateKey: label
      }));
    }

    const dates = [];
    const curr = new Date(start);
    
    // Safety cap: maximum 31 days
    while (curr <= end && dates.length < 32) {
      const y = curr.getFullYear();
      const m = curr.getMonth() + 1;
      const d = curr.getDate();
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[m - 1]} ${d}`;
      dates.push({
        label,
        isoDate: iso,
        dateKey: label
      });
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [cutoffPreset, dataSource, startDate, endDate, selectedYear, selectedMonth]);

  // Master sorted list of employees: O(S log S) with 100% strict case-insensitive deduplication
  const sortedStaffNames = useMemo(() => {
    // Normalizer: strips case, non-letters, and trailing numbers (e.g. '(2)')
    const norm = (str) => (str || '').toLowerCase().replace(/[^a-z]/g, '');

    const nameToCanonical = new Map();
    const benchmarkOrder = [];

    // 1. First register benchmark names so benchmark ordering and display casing matches screenshots
    BENCHMARK_SUMMARY_RECORDS.forEach(r => {
      const k = norm(r.name);
      if (!nameToCanonical.has(k)) {
        nameToCanonical.set(k, r.name);
        benchmarkOrder.push(r.name);
      }
    });

    // 2. Then add staff from staffList only if not already represented in benchmark records
    staffList.forEach(s => {
      // Exclude system service accounts from financial deduction matrix
      if (s.employeeId === 'NKBCANTEEN' || s.employeeId === 'NKBPETTYCASH' || s.id === 'emp-nkbcanteen' || s.id === 'emp-nkbpettycash') return;

      const formatted = `${s.lastName || ''}, ${s.firstName || ''}`.trim();
      if (!formatted || formatted === ',') return;

      const k = norm(formatted);
      if (!nameToCanonical.has(k)) {
        nameToCanonical.set(k, formatted);
      }
    });

    const allNames = Array.from(nameToCanonical.values());
    const benchmarkIndexMap = new Map();
    benchmarkOrder.forEach((name, idx) => benchmarkIndexMap.set(name, idx));

    return allNames.sort((a, b) => {
      const idxA = benchmarkIndexMap.has(a) ? benchmarkIndexMap.get(a) : 9999;
      const idxB = benchmarkIndexMap.has(b) ? benchmarkIndexMap.get(b) : 9999;
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [staffList]);

  // 1. FAST PRE-INDEX: Build staff lookup maps: O(S)
  const { staffByIdMap } = useMemo(() => {
    const byId = new Map();
    staffList.forEach(s => {
      const formatted = `${s.lastName || ''}, ${s.firstName || ''}`.trim();
      byId.set(s.id, {
        formattedName: formatted,
        normName: formatted.toLowerCase()
      });
    });
    return { staffByIdMap: byId };
  }, [staffList]);

  // 2. FAST PRE-INDEX: Pre-index all live receipts into O(1) hash tables: O(R)
  const { liveDineInLookup, liveGroceryLookup, liveSummaryReceiptsMap } = useMemo(() => {
    const dineMap = {};
    const grocMap = {};
    const summaryReceipts = {};

    canteenReceipts.forEach(r => {
      const rDate = (r.claimedDate || r.claimedAt || r.date || r.actualEncodedAt || '').slice(0, 10);
      if (!rDate) return;

      // Filter by active date range for the summary report
      const isInDateRange = (!startDate || rDate >= startDate) && (!endDate || rDate <= endDate);

      let normName = (r.customerName || '').toLowerCase().trim();
      if (!normName && r.staffId && staffByIdMap.has(r.staffId)) {
        normName = staffByIdMap.get(r.staffId).normName;
      }
      if (!normName) return;

      const amt = Number(r.total) || 0;
      const isGrocery = r.orderType === 'Grocery' || Boolean(r.gatePassNo);
      const isPackedLunch = (r.items || []).some(i => (i.name || '').toLowerCase().includes('packed lunch') || (i.name || '').toLowerCase().includes('lunch meal'));

      // Daily Matrix key: normName|YYYY-MM-DD
      const dayKey = `${normName}|${rDate}`;

      if (isGrocery) {
        grocMap[dayKey] = (grocMap[dayKey] || 0) + amt;
      } else {
        dineMap[dayKey] = (dineMap[dayKey] || 0) + amt;
      }

      // Summary totals (within active date range)
      if (isInDateRange) {
        if (!summaryReceipts[normName]) {
          summaryReceipts[normName] = { groceryGatePass: 0, groceryDineIn: 0, packedLunch: 0 };
        }
        if (isGrocery) {
          summaryReceipts[normName].groceryGatePass += amt;
        } else if (isPackedLunch) {
          summaryReceipts[normName].packedLunch += amt;
        } else {
          summaryReceipts[normName].groceryDineIn += amt;
        }
      }
    });

    return { 
      liveDineInLookup: dineMap, 
      liveGroceryLookup: grocMap, 
      liveSummaryReceiptsMap: summaryReceipts 
    };
  }, [canteenReceipts, staffByIdMap, startDate, endDate]);

  // Live Aggregated Summary Data computed in O(S) with O(1) lookups
  const liveSummaryData = useMemo(() => {
    const summaryMap = {};

    sortedStaffNames.forEach(name => {
      const normName = name.toLowerCase().trim();
      const rTotals = liveSummaryReceiptsMap[normName] || { groceryGatePass: 0, groceryDineIn: 0, packedLunch: 0 };

      summaryMap[name] = {
        name,
        groceryGatePass: rTotals.groceryGatePass,
        groceryDineIn: rTotals.groceryDineIn,
        packedLunch: rTotals.packedLunch,
        cashAdvance: 0,
        coopLoan: 0,
        applianceLoan: 0,
        medicalLoan: 0,
        nkbProducts: 0,
        total: 0
      };
    });

    // Process Cash Advances
    cashAdvances.forEach(ca => {
      if (ca.status === 'Active' || ca.status === 'Pending Canteen Claim') {
        const staff = staffByIdMap.get(ca.staffId);
        const normName = (staff?.normName || ca.employeeName || '').toLowerCase().trim();
        const foundName = sortedStaffNames.find(n => n.toLowerCase().trim() === normName);
        if (foundName && summaryMap[foundName]) {
          summaryMap[foundName].cashAdvance += Number(ca.amount || ca.principal || 0);
        }
      }
    });

    // Process Cash Loans
    cashLoans.forEach(loan => {
      if (loan.status === 'Approved') {
        const staff = staffByIdMap.get(loan.staffId);
        const normName = (staff?.normName || loan.borrowerName || '').toLowerCase().trim();
        const foundName = sortedStaffNames.find(n => n.toLowerCase().trim() === normName);
        if (!foundName || !summaryMap[foundName]) return;

        const deduction = Number(loan.cutoffDeduction || loan.monthlyAmortization || 0);
        const cat = (loan.category || '').toLowerCase();
        if (cat.includes('appliance')) {
          summaryMap[foundName].applianceLoan += deduction;
        } else if (cat.includes('medical')) {
          summaryMap[foundName].medicalLoan += deduction;
        } else {
          summaryMap[foundName].coopLoan += deduction;
        }
      }
    });

    // Process Personal Purchase Orders
    personalPurchaseOrders.forEach(po => {
      const staff = staffByIdMap.get(po.staffId);
      const normName = (staff?.normName || po.staffName || '').toLowerCase().trim();
      const foundName = sortedStaffNames.find(n => n.toLowerCase().trim() === normName);
      if (foundName && summaryMap[foundName]) {
        summaryMap[foundName].nkbProducts += Number(po.totalAmount || 0);
      }
    });

    // Compute totals in O(S)
    Object.values(summaryMap).forEach(row => {
      row.total = row.groceryGatePass + row.groceryDineIn + row.packedLunch + 
                  row.cashAdvance + row.coopLoan + row.applianceLoan + 
                  row.medicalLoan + row.nkbProducts;
    });

    return summaryMap;
  }, [sortedStaffNames, liveSummaryReceiptsMap, cashAdvances, cashLoans, personalPurchaseOrders, staffByIdMap]);

  // Merge Data (Benchmark / Live / Manual Overrides) & Apply Search Filter
  const finalSummaryRows = useMemo(() => {
    const benchmarkMap = new Map();
    BENCHMARK_SUMMARY_RECORDS.forEach(r => benchmarkMap.set(r.name, r));
    const q = searchQuery.trim().toLowerCase();

    return sortedStaffNames.map(name => {
      let baseRow;
      if (dataSource === 'BENCHMARK' && benchmarkMap.has(name)) {
        baseRow = { ...benchmarkMap.get(name) };
      } else {
        baseRow = liveSummaryData[name] || {
          name,
          groceryGatePass: 0,
          groceryDineIn: 0,
          packedLunch: 0,
          cashAdvance: 0,
          coopLoan: 0,
          applianceLoan: 0,
          medicalLoan: 0,
          nkbProducts: 0,
          total: 0
        };
      }

      // Apply any manual adjustments
      const userAdj = (manualAdjustments.summary || {})[name] || {};
      const merged = {
        name,
        groceryGatePass: userAdj.groceryGatePass !== undefined ? userAdj.groceryGatePass : baseRow.groceryGatePass,
        groceryDineIn: userAdj.groceryDineIn !== undefined ? userAdj.groceryDineIn : baseRow.groceryDineIn,
        packedLunch: userAdj.packedLunch !== undefined ? userAdj.packedLunch : baseRow.packedLunch,
        cashAdvance: userAdj.cashAdvance !== undefined ? userAdj.cashAdvance : baseRow.cashAdvance,
        coopLoan: userAdj.coopLoan !== undefined ? userAdj.coopLoan : baseRow.coopLoan,
        applianceLoan: userAdj.applianceLoan !== undefined ? userAdj.applianceLoan : baseRow.applianceLoan,
        medicalLoan: userAdj.medicalLoan !== undefined ? userAdj.medicalLoan : baseRow.medicalLoan,
        nkbProducts: userAdj.nkbProducts !== undefined ? userAdj.nkbProducts : baseRow.nkbProducts
      };

      merged.total = merged.groceryGatePass + merged.groceryDineIn + merged.packedLunch + 
                     merged.cashAdvance + merged.coopLoan + merged.applianceLoan + 
                     merged.medicalLoan + merged.nkbProducts;

      return merged;
    }).filter(row => {
      if (onlyWithTransactions && (row.total || 0) <= 0) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q);
    });
  }, [sortedStaffNames, dataSource, liveSummaryData, manualAdjustments, searchQuery, onlyWithTransactions]);

  // Compute Grand Totals for Summary Report: O(S)
  const summaryGrandTotals = useMemo(() => {
    const totals = {
      groceryGatePass: 0,
      groceryDineIn: 0,
      packedLunch: 0,
      cashAdvance: 0,
      coopLoan: 0,
      applianceLoan: 0,
      medicalLoan: 0,
      nkbProducts: 0,
      total: 0
    };

    finalSummaryRows.forEach(r => {
      totals.groceryGatePass += r.groceryGatePass;
      totals.groceryDineIn += r.groceryDineIn;
      totals.packedLunch += r.packedLunch;
      totals.cashAdvance += r.cashAdvance;
      totals.coopLoan += r.coopLoan;
      totals.applianceLoan += r.applianceLoan;
      totals.medicalLoan += r.medicalLoan;
      totals.nkbProducts += r.nkbProducts;
      totals.total += r.total;
    });

    return totals;
  }, [finalSummaryRows]);

  // Raw Daily Matrix computations for all staff across all date objects
  const rawDailyRows = useMemo(() => {
    return sortedStaffNames.map(name => {
      const normName = name.toLowerCase().trim();
      const benchmarkStaffDaily = BENCHMARK_DAILY_ENTRIES[name] || { dineIn: {}, grocery: {} };
      const userAdjDine = ((manualAdjustments.cashSaleDineIn || {})[name]) || {};
      const userAdjGroc = ((manualAdjustments.cashSaleGrocery || {})[name]) || {};

      const dineInDaily = {};
      const groceryDaily = {};
      let rowDineTotal = 0;
      let rowGrocTotal = 0;

      allDateObjects.forEach(dObj => {
        const { label, isoDate } = dObj;

        let dVal = 0;
        let gVal = 0;

        if (userAdjDine[label] !== undefined) {
          dVal = userAdjDine[label];
        } else if (userAdjDine[isoDate] !== undefined) {
          dVal = userAdjDine[isoDate];
        } else if (dataSource === 'BENCHMARK') {
          dVal = benchmarkStaffDaily.dineIn[label] || 0;
        } else {
          // O(1) lookup
          dVal = liveDineInLookup[`${normName}|${isoDate}`] || 0;
        }

        if (userAdjGroc[label] !== undefined) {
          gVal = userAdjGroc[label];
        } else if (userAdjGroc[isoDate] !== undefined) {
          gVal = userAdjGroc[isoDate];
        } else if (dataSource === 'BENCHMARK') {
          gVal = benchmarkStaffDaily.grocery[label] || 0;
        } else {
          // O(1) lookup
          gVal = liveGroceryLookup[`${normName}|${isoDate}`] || 0;
        }

        dineInDaily[label] = dVal;
        groceryDaily[label] = gVal;
        rowDineTotal += dVal;
        rowGrocTotal += gVal;
      });

      return {
        name,
        dineInDaily,
        groceryDaily,
        rowDineTotal,
        rowGrocTotal,
        rowTotal: rowDineTotal + rowGrocTotal
      };
    });
  }, [sortedStaffNames, allDateObjects, dataSource, manualAdjustments, liveDineInLookup, liveGroceryLookup]);

  // Active date columns: only dates that have at least one transaction > 0 (if onlyActiveDates is on)
  const activeDateObjects = useMemo(() => {
    if (!onlyActiveDates) return allDateObjects;
    const datesWithSales = allDateObjects.filter(d => {
      return rawDailyRows.some(r => (r.dineInDaily[d.label] || 0) > 0 || (r.groceryDaily[d.label] || 0) > 0);
    });
    return datesWithSales.length > 0 ? datesWithSales : allDateObjects;
  }, [allDateObjects, rawDailyRows, onlyActiveDates]);

  // Final daily rows: filtered by onlyWithTransactions (meron lang nakuha) & searchQuery
  const finalDailyRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rawDailyRows.filter(row => {
      if (onlyWithTransactions && (row.rowTotal || 0) <= 0) return false;
      if (!q) return true;
      return row.name.toLowerCase().includes(q);
    });
  }, [rawDailyRows, onlyWithTransactions, searchQuery]);

  // Compute Grand Totals for Daily Cash Sale Report: O(S × D)
  const dailyGrandTotals = useMemo(() => {
    const dineTotals = {};
    const grocTotals = {};
    let grandDine = 0;
    let grandGroc = 0;

    activeDateObjects.forEach(d => {
      dineTotals[d.label] = 0;
      grocTotals[d.label] = 0;
    });

    finalDailyRows.forEach(r => {
      activeDateObjects.forEach(d => {
        dineTotals[d.label] += r.dineInDaily[d.label] || 0;
        grocTotals[d.label] += r.groceryDaily[d.label] || 0;
      });
      grandDine += r.rowDineTotal;
      grandGroc += r.rowGrocTotal;
    });

    return {
      dineTotals,
      grocTotals,
      grandDine,
      grandGroc,
      overallGrand: grandDine + grandGroc
    };
  }, [finalDailyRows, activeDateObjects]);

  // Export to Excel Workbook (.xlsx) with SheetJS
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary Report
    const summaryData = [
      ['NKB MANUFACTURING SUPPORT CORP. - FINANCIAL SUMMARY REPORT'],
      [`Date Range: ${startDate || 'All'} to ${endDate || 'All'} | Data Source: ${dataSource}`],
      [],
      ['NAME', 'GROCERY LOAN (GATE PASS)', 'GROCERY (DINE IN)', 'PACKED LUNCH', 'CASH ADVANCE', 'COOP LOAN', 'APPLIANCE LOAN', 'MEDICAL LOAN w/ 2.5% INTEREST', 'NKB PRODUCTS', 'TOTAL']
    ];

    finalSummaryRows.forEach(r => {
      summaryData.push([
        r.name,
        r.groceryGatePass || 0,
        r.groceryDineIn || 0,
        r.packedLunch || 0,
        r.cashAdvance || 0,
        r.coopLoan || 0,
        r.applianceLoan || 0,
        r.medicalLoan || 0,
        r.nkbProducts || 0,
        r.total || 0
      ]);
    });

    summaryData.push([
      'TOTAL',
      summaryGrandTotals.groceryGatePass,
      summaryGrandTotals.groceryDineIn,
      summaryGrandTotals.packedLunch,
      summaryGrandTotals.cashAdvance,
      summaryGrandTotals.coopLoan,
      summaryGrandTotals.applianceLoan,
      summaryGrandTotals.medicalLoan,
      summaryGrandTotals.nkbProducts,
      summaryGrandTotals.total
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Report');

    // Sheet 2: Daily Cash Sale Report
    const dailyHeader1 = ['NAME', ...activeDateObjects.map(() => 'DINE IN'), ...activeDateObjects.map(() => 'GROCERY GATE PASS'), 'TOTAL'];
    const dailyHeader2 = ['NAME', ...activeDateObjects.map(d => d.label), ...activeDateObjects.map(d => d.label), 'TOTAL'];
    const dailyData = [
      ['NKB MANUFACTURING SUPPORT CORP. - CASH SALE & DAILY MATRIX REPORT'],
      [`Date Range: ${startDate || 'All'} to ${endDate || 'All'}`],
      [],
      dailyHeader1,
      dailyHeader2
    ];

    finalDailyRows.forEach(r => {
      const rowArr = [r.name];
      activeDateObjects.forEach(d => rowArr.push(r.dineInDaily[d.label] || 0));
      activeDateObjects.forEach(d => rowArr.push(r.groceryDaily[d.label] || 0));
      rowArr.push(r.rowTotal);
      dailyData.push(rowArr);
    });

    const dailyTotalRow = ['TOTAL'];
    activeDateObjects.forEach(d => dailyTotalRow.push(dailyGrandTotals.dineTotals[d.label] || 0));
    activeDateObjects.forEach(d => dailyTotalRow.push(dailyGrandTotals.grocTotals[d.label] || 0));
    dailyTotalRow.push(dailyGrandTotals.overallGrand);
    dailyData.push(dailyTotalRow);

    const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Cash Sale Report');

    const fileName = `NKB_Financial_Reports_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const fmt = (val) => {
    if (!val || val === 0) return '-';
    return Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header & Report Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 shadow-inner">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Canteen &amp; Employee Financial Reports
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                Optimized 60 FPS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-tab financial audit matrix: Daily Cash Sale Breakdown (Screenshot 1) &amp; Summary Deductions (Screenshot 2).
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              isEditMode 
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title="Enable direct cell editing to adjust or input figures"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Cells'}</span>
          </button>

          {Object.keys(manualAdjustments).length > 0 && (
            <button
              type="button"
              onClick={handleResetAdjustments}
              className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Revert all manual edits to default"
            >
              <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
              <span>Reset Edits</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer"
            title="Download formatted Excel workbook (.xlsx)"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black flex items-center gap-2 shadow-md transition cursor-pointer"
            title="Print printable summary ledger"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Subtab Switcher & Interactive Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveReportTab('cash_sale')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              activeReportTab === 'cash_sale'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Calendar className="h-4 w-4 text-emerald-600" />
            <span>1. Cash Sale Report (Daily Matrix)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              Screenshot 1
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
              activeReportTab === 'summary'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>2. Summary Report (Deductions Table)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              Screenshot 2
            </span>
          </button>
        </div>

        {/* Filter Toggles & Employee Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Button: Meron Lang Nakuha (Only with transactions) */}
          <button
            type="button"
            onClick={() => setOnlyWithTransactions(!onlyWithTransactions)}
            className={`h-9 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              onlyWithTransactions
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500 hover:bg-emerald-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
            title={onlyWithTransactions ? "Showing only staff with transactions/deductions. Click to show all staff." : "Showing all staff. Click to filter only staff with transactions."}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{onlyWithTransactions ? 'Meron Lang Nakuha' : 'Lahat ng Empleyado'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              onlyWithTransactions ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'
            }`}>
              {activeReportTab === 'cash_sale' ? finalDailyRows.length : finalSummaryRows.length}
            </span>
          </button>

          {/* Toggle Button: Active Dates Only (Only for Cash Sale Report) */}
          {activeReportTab === 'cash_sale' && (
            <button
              type="button"
              onClick={() => setOnlyActiveDates(!onlyActiveDates)}
              className={`h-9 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                onlyActiveDates
                  ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500 hover:bg-indigo-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title={onlyActiveDates ? "Showing only dates with transactions. Click to show all dates in cut-off." : "Showing all dates. Click to filter only dates with transactions."}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{onlyActiveDates ? 'Active Dates Only' : 'Lahat ng Petsa'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                onlyActiveDates ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {activeDateObjects.length} d
              </span>
            </button>
          )}

          {/* Search Input for Employees */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee (e.g. Alonzo)..."
              className="w-full h-9 pl-8 pr-7 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER CONTROL BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
        
        {/* Row 1: Cut-off Presets & Data Source Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
              <span>Presets:</span>
            </span>

            <button
              type="button"
              onClick={() => applyCutoff('BENCHMARK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === 'BENCHMARK'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Screenshot Benchmark Data (May 11 - May 25)"
            >
              Benchmark (May 11 - 25)
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('OCT_LIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === 'OCT_LIVE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="October 11 - 25 Live Database Cut-off"
            >
              Oct 11 - 25 (Live DB)
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('OCT_FULL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === 'OCT_FULL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Full October Month (1,165 receipts)"
            >
              Oct Full Month
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('11_25')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === '11_25'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              11th - 25th
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('26_10')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === '26_10'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              26th - 10th
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('FIRST_HALF')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === 'FIRST_HALF'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              1st - 15th
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('SECOND_HALF')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === 'SECOND_HALF'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              16th - End
            </button>

            <button
              type="button"
              onClick={() => applyCutoff('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                cutoffPreset === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Dates
            </button>
          </div>

          {/* Data Source Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 px-2">Data Source:</span>
            <button
              type="button"
              onClick={() => setDataSource('BENCHMARK')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                dataSource === 'BENCHMARK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Official spreadsheet benchmark numbers"
            >
              Benchmark Sheet
            </button>
            <button
              type="button"
              onClick={() => setDataSource('LIVE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                dataSource === 'LIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Live calculation from system receipts and employee loans"
            >
              Live Transactions ({canteenReceipts.length})
            </button>
          </div>

        </div>

        {/* Row 2: Custom Date Pickers & Month/Year selector */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
              Date Filter:
            </span>

            {/* From Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  setCutoffPreset('CUSTOM');
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEndDate(val);
                  setCutoffPreset('CUSTOM');
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Month & Year Quick Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-500">Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10);
                  setSelectedMonth(m);
                  applyCutoff(cutoffPreset === 'BENCHMARK' ? '11_25' : cutoffPreset, selectedYear, m);
                }}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May (Screenshots)</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October (DB Records)</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => applyCutoff('ALL')}
                className="h-8 px-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                title="Clear date filter"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Active summary counts */}
          <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px] font-medium">
            <span>Staff in View: <strong>{activeReportTab === 'cash_sale' ? finalDailyRows.length : finalSummaryRows.length}</strong> {onlyWithTransactions && <span className="text-emerald-700 font-bold">(Meron Lang Nakuha)</span>}</span>
            <span>·</span>
            <span>Dates in View: <strong>{activeDateObjects.length}</strong> {onlyActiveDates && activeReportTab === 'cash_sale' && <span className="text-indigo-700 font-bold">(Active Sales Only)</span>}</span>
          </div>

        </div>

        {/* Helpful Info banner */}
        <div className="flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>
              {activeReportTab === 'cash_sale' ? (
                <>
                  Showing <strong>Daily Date-by-Date Matrix</strong> (Left: Dine In / Canteen, Right: Grocery Gate Pass). Period: <strong>{activeDateObjects[0]?.label || startDate}</strong> to <strong>{activeDateObjects[activeDateObjects.length - 1]?.label || endDate}</strong>.
                </>
              ) : (
                <>
                  Showing <strong>Summary Report</strong> with official columns: Grocery Gate Pass, Dine In, Packed Lunch, Cash Advance, <strong>COOP LOAN (Red Header)</strong>, Appliance, Medical, and NKB Products.
                </>
              )}
            </span>
          </div>
          {isEditMode && (
            <span className="text-amber-700 font-bold flex items-center gap-1">
              <Edit3 className="h-3 w-3" /> Edit mode active — click any cell to adjust values
            </span>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CASH SALE REPORT (DAILY DATE-BY-DATE MATRIX - SCREENSHOT 1) */}
      {/* ========================================================================= */}
      {activeReportTab === 'cash_sale' && (
        <div id="financial-report-print" className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] text-slate-900 select-text">
              <thead>
                {/* Top Super Headers */}
                <tr className="bg-slate-50 text-slate-900 border-b border-slate-300 font-bold">
                  <th rowSpan={2} className="border-r border-slate-300 px-3 py-2 text-left min-w-[200px] sticky left-0 bg-slate-100 z-10">
                    NAME
                  </th>
                  {/* Super Header 1: Dine In / #N/A (in red text like spreadsheet) */}
                  <th 
                    colSpan={activeDateObjects.length} 
                    className="border-r-2 border-slate-500 px-2 py-1.5 text-center text-rose-600 font-extrabold uppercase italic bg-slate-50"
                  >
                    #N/A
                  </th>
                  {/* Super Header 2: grocery gate pass (in red text like spreadsheet) */}
                  <th 
                    colSpan={activeDateObjects.length} 
                    className="border-r border-slate-300 px-2 py-1.5 text-center text-rose-600 font-extrabold uppercase italic bg-slate-50"
                  >
                    grocery gate pass
                  </th>
                  <th rowSpan={2} className="px-3 py-2 text-right bg-slate-100 font-black min-w-[90px]">
                    TOTAL
                  </th>
                </tr>

                {/* Sub Header: Dates for Dine In & Dates for Grocery Gate Pass */}
                <tr className="bg-slate-100 border-b-2 border-slate-400 text-[10px] text-slate-700">
                  {/* Dates for Dine In */}
                  {activeDateObjects.map((dObj, idx) => (
                    <th 
                      key={`d-${dObj.label}-${idx}`} 
                      className={`px-2 py-1.5 text-center font-bold min-w-[52px] border-r border-slate-200 ${
                        idx === activeDateObjects.length - 1 ? 'border-r-2 border-slate-500' : ''
                      }`}
                    >
                      {dObj.label}
                    </th>
                  ))}
                  {/* Dates for Grocery Gate Pass */}
                  {activeDateObjects.map((dObj, idx) => (
                    <th 
                      key={`g-${dObj.label}-${idx}`} 
                      className="px-2 py-1.5 text-center font-bold min-w-[52px] border-r border-slate-200"
                    >
                      {dObj.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {finalDailyRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeDateObjects.length * 2 + 2} className="px-4 py-12 text-center text-slate-400">
                      No matching employee records found for "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  finalDailyRows.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50/80 transition group">
                      {/* Name Column (Sticky left) */}
                      <td className="border-r border-slate-300 px-3 py-1.5 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                        {row.name}
                      </td>

                      {/* Dine In Date Columns */}
                      {activeDateObjects.map((dObj, idx) => {
                        const val = row.dineInDaily[dObj.label] || 0;
                        return (
                          <td 
                            key={`d-val-${dObj.label}-${idx}`}
                            className={`border-r border-slate-200 px-2 py-1 text-right font-mono text-slate-800 ${
                              idx === activeDateObjects.length - 1 ? 'border-r-2 border-slate-500' : ''
                            } ${isEditMode ? 'bg-amber-50/40 cursor-pointer' : ''}`}
                          >
                            {isEditMode ? (
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={val || ''}
                                placeholder="-"
                                onBlur={(e) => handleCellChange('cashSaleDineIn', row.name, dObj.label, e.target.value)}
                                className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                              />
                            ) : (
                              fmt(val)
                            )}
                          </td>
                        );
                      })}

                      {/* Grocery Gate Pass Date Columns */}
                      {activeDateObjects.map((dObj, idx) => {
                        const val = row.groceryDaily[dObj.label] || 0;
                        return (
                          <td 
                            key={`g-val-${dObj.label}-${idx}`}
                            className={`border-r border-slate-200 px-2 py-1 text-right font-mono text-slate-800 ${
                              isEditMode ? 'bg-amber-50/40 cursor-pointer' : ''
                            }`}
                          >
                            {isEditMode ? (
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={val || ''}
                                placeholder="-"
                                onBlur={(e) => handleCellChange('cashSaleGrocery', row.name, dObj.label, e.target.value)}
                                className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                              />
                            ) : (
                              fmt(val)
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="px-3 py-1 text-right font-mono font-bold text-slate-950 bg-slate-50 whitespace-nowrap">
                        {fmt(row.rowTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Bottom Grand Totals Row */}
              <tfoot>
                <tr className="bg-slate-200 border-t-2 border-slate-500 text-slate-950 font-black">
                  <td className="border-r border-slate-300 px-3 py-2 text-left sticky left-0 bg-slate-200 z-10">
                    TOTAL
                  </td>
                  {/* Dine In Totals */}
                  {activeDateObjects.map((dObj, idx) => (
                    <td 
                      key={`total-d-${dObj.label}-${idx}`}
                      className={`border-r border-slate-300 px-2 py-2 text-right font-mono ${
                        idx === activeDateObjects.length - 1 ? 'border-r-2 border-slate-500' : ''
                      }`}
                    >
                      {fmt(dailyGrandTotals.dineTotals[dObj.label])}
                    </td>
                  ))}
                  {/* Grocery Totals */}
                  {activeDateObjects.map((dObj, idx) => (
                    <td 
                      key={`total-g-${dObj.label}-${idx}`}
                      className="border-r border-slate-300 px-2 py-2 text-right font-mono"
                    >
                      {fmt(dailyGrandTotals.grocTotals[dObj.label])}
                    </td>
                  ))}
                  {/* Overall Grand Total */}
                  <td className="px-3 py-2 text-right font-mono font-black text-slate-950 bg-slate-300 whitespace-nowrap">
                    ₱{dailyGrandTotals.overallGrand.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUMMARY REPORT (DEDUCTIONS TABLE - SCREENSHOT 2) */}
      {/* ========================================================================= */}
      {activeReportTab === 'summary' && (
        <div id="financial-report-print" className="bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] text-slate-900 select-text">
              <thead>
                {/* Super Header Row */}
                <tr className="bg-slate-50 text-slate-900 border-b border-slate-300 font-bold">
                  <th rowSpan={2} className="border-r border-slate-300 px-4 py-2.5 text-left min-w-[200px] sticky left-0 bg-slate-100 z-10">
                    NAME
                  </th>
                  {/* Super Header Left */}
                  <th colSpan={4} className="border-r border-slate-300 px-2 py-1.5 text-center text-rose-600 font-extrabold uppercase italic bg-slate-50">
                    #N/A
                  </th>
                  {/* COOP LOAN Super / Spacer */}
                  <th className="bg-red-600 text-white border-r border-red-700"></th>
                  {/* Super Header Right */}
                  <th colSpan={3} className="border-r border-slate-300 px-2 py-1.5 text-center text-rose-600 font-extrabold uppercase italic bg-slate-50">
                    #N/A
                  </th>
                  <th rowSpan={2} className="px-4 py-2.5 text-right bg-slate-100 font-black min-w-[100px]">
                    TOTAL
                  </th>
                </tr>

                {/* Sub Header Row: The Exact Columns from Screenshot 2 */}
                <tr className="border-b-2 border-slate-400 text-[10px] font-extrabold uppercase tracking-tight text-slate-800">
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[130px]">
                    GROCERY LOAN<br /><span className="text-[9px] font-normal">(GATE PASS)</span>
                  </th>
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[120px]">
                    GROCERY<br /><span className="text-[9px] font-normal">(DINE IN)</span>
                  </th>
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[110px]">
                    PACKED LUNCH
                  </th>
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[110px]">
                    CASH ADVANCE
                  </th>
                  {/* COOP LOAN: Exact Red Header with White Text */}
                  <th className="border-r border-red-700 px-3 py-2 text-center bg-red-600 text-white font-black min-w-[120px]">
                    COOP LOAN
                  </th>
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[120px]">
                    APPLIANCE LOAN
                  </th>
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[140px]">
                    MEDICAL LOAN w/ 2.5%<br /><span className="text-[9px] font-normal">INTEREST</span>
                  </th>
                  <th className="border-r border-slate-300 px-3 py-2 text-center bg-blue-50/70 min-w-[120px]">
                    NKB PRODUCTS
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {finalSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      No matching employee records found for "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  finalSummaryRows.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50/80 transition group">
                      {/* Name Column */}
                      <td className="border-r border-slate-300 px-4 py-2 font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                        {row.name}
                      </td>

                      {/* Grocery Loan (Gate Pass) */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.groceryGatePass || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'groceryGatePass', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.groceryGatePass)
                        )}
                      </td>

                      {/* Grocery (Dine In) */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.groceryDineIn || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'groceryDineIn', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.groceryDineIn)
                        )}
                      </td>

                      {/* Packed Lunch */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.packedLunch || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'packedLunch', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.packedLunch)
                        )}
                      </td>

                      {/* Cash Advance */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.cashAdvance || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'cashAdvance', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.cashAdvance)
                        )}
                      </td>

                      {/* COOP LOAN */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono font-bold text-slate-900 bg-red-50/30 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.coopLoan || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'coopLoan', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.coopLoan)
                        )}
                      </td>

                      {/* Appliance Loan */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.applianceLoan || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'applianceLoan', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.applianceLoan)
                        )}
                      </td>

                      {/* Medical Loan w/ 2.5% Interest */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.medicalLoan || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'medicalLoan', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.medicalLoan)
                        )}
                      </td>

                      {/* NKB Products */}
                      <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-mono text-slate-800 ${isEditMode ? 'bg-amber-50/40' : ''}`}>
                        {isEditMode ? (
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={row.nkbProducts || ''}
                            placeholder="-"
                            onBlur={(e) => handleCellChange('summary', row.name, 'nkbProducts', e.target.value)}
                            className="w-full text-right bg-transparent border-none text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        ) : (
                          fmt(row.nkbProducts)
                        )}
                      </td>

                      {/* Total Column */}
                      <td className="px-4 py-1.5 text-right font-mono font-bold text-slate-950 bg-slate-50 whitespace-nowrap">
                        {fmt(row.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Bottom Grand Totals Row */}
              <tfoot>
                <tr className="bg-slate-200 border-t-2 border-slate-500 text-slate-950 font-black">
                  <td className="border-r border-slate-300 px-4 py-2.5 text-left sticky left-0 bg-slate-200 z-10">
                    TOTAL
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.groceryGatePass)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.groceryDineIn)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.packedLunch)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.cashAdvance)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono bg-red-100 text-red-950 font-black">
                    {fmt(summaryGrandTotals.coopLoan)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.applianceLoan)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.medicalLoan)}
                  </td>
                  <td className="border-r border-slate-300 px-3 py-2 text-right font-mono">
                    {fmt(summaryGrandTotals.nkbProducts)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-black text-slate-950 bg-slate-300 whitespace-nowrap">
                    ₱{summaryGrandTotals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Print View Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #financial-report-print, #financial-report-print * {
            visibility: visible;
          }
          #financial-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 1px solid #000 !important;
            box-shadow: none !important;
          }
          table {
            border: 1px solid #000 !important;
          }
          th, td {
            border: 1px solid #999 !important;
            padding: 4px 6px !important;
            font-size: 9px !important;
          }
        }
      `}</style>

    </div>
  );
}
