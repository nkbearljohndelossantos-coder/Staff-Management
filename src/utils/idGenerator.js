/**
 * Resolves prefix based on employment classification:
 * - Regular employee: starts with 'NKB' (e.g. NKB-2026-0001)
 * - Part-time / Contractual / Project: starts with 'PRJ' (e.g. PRJ-2026-0001)
 */
export function getPrefixForEmploymentType(type = 'regular') {
  const t = (type || '').toString().toUpperCase();
  if (t === 'VYU') return 'VYU';
  if (t === 'PRJ' || t.includes('PROJECT') || t.includes('CONTRACT') || t.includes('PART-TIME')) {
    return 'PRJ';
  }
  return 'NKB';
}

/**
 * Generates an automated, conflict-free Employee ID number.
 * Supports NKB, PRJ, VYU or custom prefixes.
 * Format: PREFIX-YYYY-XXXX (e.g. NKB-2026-0001, PRJ-2026-0001, VYU-2026-0001)
 */
export function generateNextEmployeeId(staffList = [], prefixOrType = 'NKB', year = new Date().getFullYear()) {
  let prefix = 'NKB';
  const clean = (prefixOrType || '').toString().trim().toUpperCase();
  if (clean === 'VYU' || clean === 'PRJ' || clean === 'NKB') {
    prefix = clean;
  } else {
    prefix = getPrefixForEmploymentType(clean);
  }

  const patternPrefix = `${prefix}-${year}-`;
  
  let maxSeq = 0;
  staffList.forEach(staff => {
    if (staff.employeeId && staff.employeeId.startsWith(patternPrefix)) {
      const seqPart = staff.employeeId.replace(patternPrefix, '');
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${patternPrefix}${nextSeq}`;
}

/**
 * Standardizes barcode string value for Code 128 scanner
 */
export function formatBarcodeValue(employeeId) {
  if (!employeeId) return '';
  return employeeId.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
}
