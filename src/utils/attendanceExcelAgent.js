import * as XLSX from 'xlsx';
import { formatStaffName } from './staffUtils';

/**
 * attendanceExcelAgent.js
 * Smart Timekeeping & Biometric Clock-In Excel Analyzer Agent
 *
 * Analyzes uploaded Excel/CSV files for the 6 daily punch points:
 *   1. Time-In
 *   2. Lunch Out
 *   3. Lunch In
 *   4. Break Out
 *   5. Break In
 *   6. Time-Out
 * Then normalizes employee records against the HR Staff Masterlist, computes
 * worked hours / late / lunch duration / break duration / undertime / overtime,
 * and converts the output into an Alphabetical (A-Z) Excel Spreadsheet Layout.
 */

// Convert various Excel cell time representations into minutes from midnight (0 - 1439)
export function parseTimeToMinutes(rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '') return null;

  // Excel serial fraction of a day (e.g., 0.33333 = 08:00 AM)
  if (typeof rawVal === 'number') {
    const fraction = rawVal % 1;
    const totalMins = Math.round(fraction * 24 * 60);
    if (totalMins >= 0 && totalMins < 1440) return totalMins;
  }

  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    return rawVal.getHours() * 60 + rawVal.getMinutes();
  }

  const str = String(rawVal).trim();
  if (!str || str === '-' || str === '—' || str.toLowerCase() === 'null') return null;

  // Check if numeric string representing Excel time fraction
  if (/^0\.\d+$/.test(str)) {
    const num = parseFloat(str);
    return Math.round(num * 24 * 60);
  }

  // Match HH:MM(:SS)? (AM|PM)?
  const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|A\.M\.|P\.M\.|am|pm)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridiem = match[4] ? match[4].toUpperCase().replace(/\./g, '') : null;

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
      return hours * 60 + mins;
    }
  }

  return null;
}

// Format minutes from midnight (e.g. 480) to "08:00 AM"
export function formatMinutesToDisplayTime(mins) {
  if (mins === null || mins === undefined || isNaN(mins)) return '';
  const clamped = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h24 = Math.floor(clamped / 60);
  const m = clamped % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

// Parse date cell into YYYY-MM-DD
export function normalizeExcelDate(rawDate) {
  const fallback = new Date().toISOString().split('T')[0];
  if (!rawDate) return fallback;

  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const d = String(rawDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof rawDate === 'number' && rawDate > 20000) {
    // Excel serial date
    const utcDays = Math.floor(rawDate - 25569);
    const dateObj = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
  }

  const str = String(rawDate).trim();
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2, '0')}-${String(isoMatch[3]).padStart(2, '0')}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return fallback;
}

/**
 * Smart 6-Slot Punch Classifier
 * Classifies a list of chronological punch minutes into:
 *   { timeIn, lunchOut, lunchIn, breakOut, breakIn, timeOut }
 */
export function classifyPunchesIntoSixSlots(rawPunchMins = []) {
  // Filter valid & sort ascending
  const sorted = rawPunchMins
    .filter(m => m !== null && m !== undefined && !isNaN(m))
    .sort((a, b) => a - b);

  // Debounce accidental double badge scans within 2 minutes
  const punches = [];
  for (const m of sorted) {
    if (punches.length === 0 || m - punches[punches.length - 1] > 2) {
      punches.push(m);
    }
  }

  const slots = {
    timeIn: null,
    lunchOut: null,
    lunchIn: null,
    breakOut: null,
    breakIn: null,
    timeOut: null
  };

  if (punches.length === 0) return slots;

  // If 6 or more punches, assign the 6 canonical sequence points
  if (punches.length >= 6) {
    slots.timeIn = punches[0];
    slots.lunchOut = punches[1];
    slots.lunchIn = punches[2];
    slots.breakOut = punches[3];
    slots.breakIn = punches[4];
    slots.timeOut = punches[punches.length - 1];
    return slots;
  }

  // If 5 punches: determine whether missing afternoon break-in or lunch-in based on time windows
  if (punches.length === 5) {
    slots.timeIn = punches[0];
    slots.lunchOut = punches[1];
    slots.lunchIn = punches[2];
    slots.breakOut = punches[3];
    // Check if 5th punch is right after breakOut (<= 45 mins) or end of shift (>= 16:30 / 990 mins)
    if (punches[4] - punches[3] <= 45 && punches[4] < 980) {
      slots.breakIn = punches[4];
    } else {
      slots.timeOut = punches[4];
    }
    return slots;
  }

  // If 4 punches: typically Time-In, Lunch Out, Lunch In, Time-Out (or afternoon break if no lunch)
  if (punches.length === 4) {
    slots.timeIn = punches[0];
    slots.timeOut = punches[3];
    // Check if middle 2 punches fall in midday window (11:00 AM [660] to 2:15 PM [855])
    if (punches[1] >= 660 && punches[1] <= 840) {
      slots.lunchOut = punches[1];
      slots.lunchIn = punches[2];
    } else if (punches[1] >= 841 && punches[2] <= 990) {
      slots.breakOut = punches[1];
      slots.breakIn = punches[2];
    } else {
      slots.lunchOut = punches[1];
      slots.lunchIn = punches[2];
    }
    return slots;
  }

  // If 1, 2, or 3 punches: use smart time-window heuristics
  const remaining = [...punches];

  // 1. Morning arrival (< 11:30 AM / 690 mins)
  if (remaining.length > 0 && remaining[0] <= 690) {
    slots.timeIn = remaining.shift();
  }

  // 2. End of day departure (>= 4:15 PM / 975 mins)
  if (remaining.length > 0 && remaining[remaining.length - 1] >= 975) {
    slots.timeOut = remaining.pop();
  }

  // 3. Classify any remaining middle punches by window
  for (const p of remaining) {
    if (p >= 690 && p <= 830) {
      if (slots.lunchOut === null) slots.lunchOut = p;
      else if (slots.lunchIn === null) slots.lunchIn = p;
    } else if (p > 830 && p < 975) {
      if (slots.breakOut === null) slots.breakOut = p;
      else if (slots.breakIn === null) slots.breakIn = p;
    } else if (slots.timeIn === null) {
      slots.timeIn = p;
    } else if (slots.timeOut === null) {
      slots.timeOut = p;
    }
  }

  return slots;
}

// Match an Excel row to a staff member in staffList
function matchStaffMember(staffList = [], rawId = '', rawName = '') {
  const cleanId = String(rawId || '').trim().toUpperCase();
  const cleanName = String(rawName || '').trim().toUpperCase().replace(/\s+/g, ' ');

  if (cleanId) {
    const byId = staffList.find(
      s =>
        (s.employeeId && s.employeeId.toUpperCase() === cleanId) ||
        (s.barcodeValue && s.barcodeValue.toUpperCase() === cleanId) ||
        (s.id && s.id.toUpperCase() === cleanId)
    );
    if (byId) return byId;
  }

  if (cleanName) {
    const byName = staffList.find(s => {
      const formatted = formatStaffName(s).toUpperCase();
      const firstLast = `${s.firstName || ''} ${s.lastName || ''}`.trim().toUpperCase();
      const lastFirst = `${s.lastName || ''}, ${s.firstName || ''}`.trim().toUpperCase();
      const lastOnly = (s.lastName || '').trim().toUpperCase();
      return (
        formatted === cleanName ||
        firstLast === cleanName ||
        lastFirst === cleanName ||
        (lastOnly.length > 2 && cleanName.includes(lastOnly) && cleanName.includes((s.firstName || '').split(' ')[0]?.toUpperCase()))
      );
    });
    if (byName) return byName;
  }

  return null;
}

// Format any raw name into Alphabetical "LASTNAME, FIRSTNAME" format
function normalizeAlphabeticalName(rawName, matchedStaff) {
  if (matchedStaff) {
    return formatStaffName(matchedStaff);
  }
  const clean = String(rawName || '').trim();
  if (!clean) return 'UNKNOWN STAFF';
  if (clean.includes(',')) {
    const [last, ...rest] = clean.split(',');
    return `${last.trim().toUpperCase()}, ${rest.join(' ').trim().toUpperCase()}`;
  }
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const last = parts[parts.length - 1].toUpperCase();
  const first = parts.slice(0, -1).join(' ').toUpperCase();
  return `${last}, ${first}`;
}

/**
 * Compute metrics and Agent status for a single 6-punch row
 */
export function evaluateAttendanceRowMetrics(row) {
  const tIn = parseTimeToMinutes(row.timeIn);
  const lOut = parseTimeToMinutes(row.lunchOut);
  const lIn = parseTimeToMinutes(row.lunchIn);
  const bOut = parseTimeToMinutes(row.breakOut);
  const bIn = parseTimeToMinutes(row.breakIn);
  const tOut = parseTimeToMinutes(row.timeOut);

  // Standard Shift: 8:00 AM (480) to 5:00 PM (1020)
  const shiftStart = 8 * 60; // 480
  const shiftEnd = 17 * 60; // 1020

  const lateMinutes = tIn !== null && tIn > shiftStart ? tIn - shiftStart : 0;
  const lunchMinutes = lOut !== null && lIn !== null && lIn >= lOut ? lIn - lOut : (tIn !== null && tOut !== null ? 60 : 0);
  const breakMinutes = bOut !== null && bIn !== null && bIn >= bOut ? bIn - bOut : 0;

  let undertimeHours = 0;
  let otHours = 0;
  if (tOut !== null) {
    if (tOut < shiftEnd) {
      undertimeHours = Number(((shiftEnd - tOut) / 60).toFixed(2));
    } else if (tOut >= shiftEnd + 30) {
      otHours = Number(((tOut - shiftEnd) / 60).toFixed(2));
    }
  }

  let totalHours = 0;
  if (tIn !== null && tOut !== null && tOut > tIn) {
    const grossMins = tOut - tIn;
    const deductedLunch = lOut !== null && lIn !== null ? Math.max(0, lIn - lOut) : 60;
    const excessBreak = breakMinutes > 15 ? breakMinutes - 15 : 0;
    const netMins = Math.max(0, grossMins - deductedLunch - excessBreak);
    totalHours = Number((netMins / 60).toFixed(2));
  }

  const punchCount = [tIn, lOut, lIn, bOut, bIn, tOut].filter(v => v !== null).length;
  const notes = [];

  if (punchCount === 6) notes.push('Complete 6-point biometric cycle');
  else if (tIn !== null && tOut !== null && lOut !== null && lIn !== null) notes.push('4-punch cycle (No afternoon break log)');
  else if (tIn === null || tOut === null) notes.push('Missing Time-In or Time-Out punch');

  if (lateMinutes > 0) notes.push(`Late by ${lateMinutes}m`);
  if (lunchMinutes > 65) notes.push(`Extended Lunch (${lunchMinutes}m)`);
  if (breakMinutes > 20) notes.push(`Extended Break (${breakMinutes}m)`);
  if (undertimeHours > 0) notes.push(`Undertime (${undertimeHours}h)`);
  if (otHours > 0) notes.push(`Overtime (+${otHours}h)`);

  let status = 'On-time';
  if (tIn === null || tOut === null) status = 'Incomplete Punch';
  else if (lateMinutes > 0 && undertimeHours > 0) status = 'Late & Undertime';
  else if (lateMinutes > 0) status = `Late (${lateMinutes}m)`;
  else if (undertimeHours > 0) status = `Undertime (${undertimeHours}h)`;
  else if (otHours > 0) status = `On-time + OT (${otHours}h)`;

  return {
    ...row,
    timeIn: tIn !== null ? formatMinutesToDisplayTime(tIn) : '',
    lunchOut: lOut !== null ? formatMinutesToDisplayTime(lOut) : '',
    lunchIn: lIn !== null ? formatMinutesToDisplayTime(lIn) : '',
    breakOut: bOut !== null ? formatMinutesToDisplayTime(bOut) : '',
    breakIn: bIn !== null ? formatMinutesToDisplayTime(bIn) : '',
    timeOut: tOut !== null ? formatMinutesToDisplayTime(tOut) : '',
    punchCount,
    lateMinutes,
    lunchMinutes,
    breakMinutes,
    undertimeHours,
    otHours,
    totalHours,
    status,
    agentRemarks: notes.join(' · ') || 'Verified Standard Shift'
  };
}

/**
 * Main Agent Entry Point: Parse & Analyze Uploaded Excel ArrayBuffer
 */
export function analyzeClockInExcelBuffer(arrayBuffer, staffList = [], departments = []) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawJson || rawJson.length === 0) {
    return {
      success: false,
      message: 'The uploaded Excel file appears to be empty.',
      rows: [],
      summary: null
    };
  }

  // Group records by EmployeeKey + Date so both multi-column and single-punch-per-row biometric exports work
  const groupedMap = new Map();

  rawJson.forEach((rawRow, idx) => {
    const keys = Object.keys(rawRow);
    const getCol = (patterns) => {
      const foundKey = keys.find(k => {
        const cleanK = k.toLowerCase().trim().replace(/[_-]/g, ' ');
        return patterns.some(p => cleanK === p || cleanK.includes(p));
      });
      return foundKey ? rawRow[foundKey] : '';
    };

    const rawId = getCol(['employee id', 'emp id', 'emp no', 'id', 'barcode', 'badge', 'ac no', 'person id']);
    const rawName = getCol(['employee name', 'staff name', 'full name', 'name', 'worker', 'employee']);
    const rawDept = getCol(['department', 'dept', 'section', 'division']);
    const rawDate = getCol(['date', 'shift date', 'work date', 'log date', 'attendance date']);

    // Check explicit 6 columns
    const colTimeIn = getCol(['time in', 'timein', 'am in', 'clock in', 'check in', 'in time', 'punch 1', 'morning in']);
    const colLunchOut = getCol(['lunch out', 'lunchout', 'noon out', 'am out', 'meal out', 'punch 2', 'break 1 out']);
    const colLunchIn = getCol(['lunch in', 'lunchin', 'noon in', 'pm in', 'meal in', 'punch 3', 'break 1 in']);
    const colBreakOut = getCol(['break out', 'breakout', 'coffee out', 'snack out', 'recess out', 'punch 4', 'break 2 out']);
    const colBreakIn = getCol(['break in', 'breakin', 'coffee in', 'snack in', 'recess in', 'punch 5', 'break 2 in']);
    const colTimeOut = getCol(['time out', 'timeout', 'pm out', 'clock out', 'check out', 'out time', 'punch 6', 'evening out']);

    // Also check if there's a generic single punch column or comma-separated punches column
    const colSinglePunch = getCol(['punch time', 'timestamp', 'time', 'log time', 'punches', 'biometric log']);

    const matchedStaff = matchStaffMember(staffList, rawId, rawName);
    const alphabeticalName = normalizeAlphabeticalName(rawName, matchedStaff);
    const employeeId = matchedStaff?.employeeId || (rawId ? String(rawId).trim().toUpperCase() : `EXT-${String(idx + 1).padStart(3, '0')}`);
    const deptObj = matchedStaff ? departments.find(d => d.id === matchedStaff.departmentId) : null;
    const departmentName = deptObj?.name || matchedStaff?.departmentName || (rawDept ? String(rawDept).trim() : 'General Operations');
    const dateStr = normalizeExcelDate(rawDate);

    // Skip completely blank rows
    if (!rawId && !rawName && !colTimeIn && !colTimeOut && !colSinglePunch) {
      return;
    }

    const groupKey = `${alphabeticalName}||${employeeId}||${dateStr}`;
    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        staffId: matchedStaff?.id || null,
        employeeId,
        employeeName: alphabeticalName,
        department: departmentName,
        date: dateStr,
        explicitSlots: {
          timeIn: null,
          lunchOut: null,
          lunchIn: null,
          breakOut: null,
          breakIn: null,
          timeOut: null
        },
        rawPunches: []
      });
    }

    const entry = groupedMap.get(groupKey);

    const mTimeIn = parseTimeToMinutes(colTimeIn);
    const mLunchOut = parseTimeToMinutes(colLunchOut);
    const mLunchIn = parseTimeToMinutes(colLunchIn);
    const mBreakOut = parseTimeToMinutes(colBreakOut);
    const mBreakIn = parseTimeToMinutes(colBreakIn);
    const mTimeOut = parseTimeToMinutes(colTimeOut);

    if (mTimeIn !== null) entry.explicitSlots.timeIn = mTimeIn;
    if (mLunchOut !== null) entry.explicitSlots.lunchOut = mLunchOut;
    if (mLunchIn !== null) entry.explicitSlots.lunchIn = mLunchIn;
    if (mBreakOut !== null) entry.explicitSlots.breakOut = mBreakOut;
    if (mBreakIn !== null) entry.explicitSlots.breakIn = mBreakIn;
    if (mTimeOut !== null) entry.explicitSlots.timeOut = mTimeOut;

    if (colSinglePunch) {
      const punchStr = String(colSinglePunch);
      if (punchStr.includes(',') || punchStr.includes(';')) {
        punchStr.split(/[,;]+/).forEach(part => {
          const pm = parseTimeToMinutes(part.trim());
          if (pm !== null) entry.rawPunches.push(pm);
        });
      } else {
        const pm = parseTimeToMinutes(colSinglePunch);
        if (pm !== null) entry.rawPunches.push(pm);
      }
    }
  });

  // Finalize each grouped employee-date record and sort strictly Alphabetically (A-Z)
  const analyzedRows = [];
  groupedMap.forEach((entry) => {
    const hasExplicit = Object.values(entry.explicitSlots).some(v => v !== null);
    let finalSlots = { ...entry.explicitSlots };

    if (!hasExplicit && entry.rawPunches.length > 0) {
      finalSlots = classifyPunchesIntoSixSlots(entry.rawPunches);
    } else if (hasExplicit && entry.rawPunches.length > 0) {
      const classified = classifyPunchesIntoSixSlots([
        ...Object.values(entry.explicitSlots).filter(v => v !== null),
        ...entry.rawPunches
      ]);
      finalSlots = {
        timeIn: entry.explicitSlots.timeIn ?? classified.timeIn,
        lunchOut: entry.explicitSlots.lunchOut ?? classified.lunchOut,
        lunchIn: entry.explicitSlots.lunchIn ?? classified.lunchIn,
        breakOut: entry.explicitSlots.breakOut ?? classified.breakOut,
        breakIn: entry.explicitSlots.breakIn ?? classified.breakIn,
        timeOut: entry.explicitSlots.timeOut ?? classified.timeOut
      };
    }

    const evaluated = evaluateAttendanceRowMetrics({
      id: `xl-att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      staffId: entry.staffId,
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      department: entry.department,
      date: entry.date,
      timeIn: finalSlots.timeIn,
      lunchOut: finalSlots.lunchOut,
      lunchIn: finalSlots.lunchIn,
      breakOut: finalSlots.breakOut,
      breakIn: finalSlots.breakIn,
      timeOut: finalSlots.timeOut
    });

    analyzedRows.push(evaluated);
  });

  // Sort strictly Alphabetically (A -> Z) by Employee Name, then by Date
  analyzedRows.sort((a, b) => {
    const nameCmp = a.employeeName.localeCompare(b.employeeName, 'en', { sensitivity: 'base' });
    if (nameCmp !== 0) return nameCmp;
    return (a.date || '').localeCompare(b.date || '');
  });

  // Number rows 1..N after alphabetical sort
  const numberedRows = analyzedRows.map((r, i) => ({
    ...r,
    rowNo: i + 1
  }));

  const summary = {
    totalRecords: numberedRows.length,
    completeSixPunchCount: numberedRows.filter(r => r.punchCount === 6).length,
    lateCount: numberedRows.filter(r => r.lateMinutes > 0).length,
    undertimeCount: numberedRows.filter(r => r.undertimeHours > 0).length,
    overtimeCount: numberedRows.filter(r => r.otHours > 0).length,
    incompleteCount: numberedRows.filter(r => !r.timeIn || !r.timeOut).length,
    matchedStaffCount: numberedRows.filter(r => Boolean(r.staffId)).length,
    alphabeticalRange: numberedRows.length > 0
      ? `${numberedRows[0].employeeName.charAt(0)} – ${numberedRows[numberedRows.length - 1].employeeName.charAt(0)}`
      : 'A – Z'
  };

  return {
    success: true,
    rows: numberedRows,
    summary
  };
}

/**
 * Export Analyzed Alphabetical Clock-In Rows to Formatted Excel (.xlsx)
 */
export function exportAnalyzedClockInToExcel(rows = [], customFilename = null) {
  const sortedRows = [...rows].sort((a, b) =>
    (a.employeeName || '').localeCompare(b.employeeName || '', 'en', { sensitivity: 'base' })
  );

  const excelData = sortedRows.map((r, index) => ({
    'No.': index + 1,
    'Employee ID': r.employeeId || '',
    'Employee Name (A-Z)': r.employeeName || '',
    'Department': r.department || '',
    'Date': r.date || '',
    'Time-In': r.timeIn || '—',
    'Lunch Out': r.lunchOut || '—',
    'Lunch In': r.lunchIn || '—',
    'Break Out': r.breakOut || '—',
    'Break In': r.breakIn || '—',
    'Time-Out': r.timeOut || '—',
    'Worked Hours': r.totalHours ?? 0,
    'Late (Mins)': r.lateMinutes ?? 0,
    'Lunch (Mins)': r.lunchMinutes ?? 0,
    'Break (Mins)': r.breakMinutes ?? 0,
    'Undertime (Hrs)': r.undertimeHours ?? 0,
    'Overtime (Hrs)': r.otHours ?? 0,
    'Shift Status': r.status || 'On-time',
    'Agent Analysis Remarks': r.agentRemarks || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [
    { wch: 5 },  // No.
    { wch: 16 }, // Employee ID
    { wch: 28 }, // Employee Name (A-Z)
    { wch: 22 }, // Department
    { wch: 12 }, // Date
    { wch: 12 }, // Time-In
    { wch: 12 }, // Lunch Out
    { wch: 12 }, // Lunch In
    { wch: 12 }, // Break Out
    { wch: 12 }, // Break In
    { wch: 12 }, // Time-Out
    { wch: 13 }, // Worked Hours
    { wch: 11 }, // Late (Mins)
    { wch: 12 }, // Lunch (Mins)
    { wch: 12 }, // Break (Mins)
    { wch: 14 }, // Undertime (Hrs)
    { wch: 14 }, // Overtime (Hrs)
    { wch: 18 }, // Shift Status
    { wch: 38 }  // Agent Analysis Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alphabetical Clock-In (A-Z)');

  const dateTag = new Date().toISOString().split('T')[0];
  const fileName = customFilename || `NKB_Analyzed_ClockIn_Alphabetical_${dateTag}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Generate a Sample Biometric Clock-In Workbook (intentionally unsorted so the Agent can demonstrate sorting A-Z + 6-punch analysis)
 */
export function generateSampleBiometricExcelBuffer(staffList = [], departments = []) {
  const today = new Date().toISOString().split('T')[0];
  const activeStaff = staffList.filter(s => s.status !== 'resigned' && !s.isResigned).slice(0, 12);

  // Shuffle order intentionally so Agent demonstrates converting to Alphabetical (A-Z)
  const shuffled = [...activeStaff].reverse();

  const samplePatterns = [
    { timeIn: '07:54 AM', lunchOut: '12:01 PM', lunchIn: '12:55 PM', breakOut: '03:00 PM', breakIn: '03:14 PM', timeOut: '05:03 PM' },
    { timeIn: '08:12 AM', lunchOut: '12:03 PM', lunchIn: '12:58 PM', breakOut: '03:05 PM', breakIn: '03:19 PM', timeOut: '05:01 PM' },
    { timeIn: '07:49 AM', lunchOut: '12:00 PM', lunchIn: '12:50 PM', breakOut: '02:58 PM', breakIn: '03:12 PM', timeOut: '07:02 PM' },
    { timeIn: '07:58 AM', lunchOut: '12:05 PM', lunchIn: '01:02 PM', breakOut: '03:02 PM', breakIn: '03:16 PM', timeOut: '04:00 PM' },
    { timeIn: '07:51 AM', lunchOut: '12:00 PM', lunchIn: '12:54 PM', breakOut: '03:01 PM', breakIn: '03:15 PM', timeOut: '05:05 PM' },
    { timeIn: '08:25 AM', lunchOut: '12:02 PM', lunchIn: '12:59 PM', breakOut: '03:10 PM', breakIn: '03:24 PM', timeOut: '05:02 PM' }
  ];

  const rows = shuffled.map((s, idx) => {
    const p = samplePatterns[idx % samplePatterns.length];
    const dept = departments.find(d => d.id === s.departmentId)?.name || s.departmentName || 'Production';
    return {
      'Employee ID': s.employeeId,
      'Employee Name': `${s.firstName} ${s.lastName}`,
      'Department': dept,
      'Date': today,
      'Time-In': p.timeIn,
      'Lunch Out': p.lunchOut,
      'Lunch In': p.lunchIn,
      'Break Out': p.breakOut,
      'Break In': p.breakIn,
      'Time-Out': p.timeOut
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Raw_Biometric_Log');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
