/**
 * Resolves prefix based on employment classification:
 * - Regular employee: starts with 'NKB' (e.g. NKB-2026-0001)
 * - Part-time / Contractual / Project: starts with 'PRJ' (e.g. PRJ-2026-0001)
 */
export function getPrefixForEmploymentType(type = 'regular') {
  const t = (type || '').toString().toLowerCase();
  if (t === 'prj' || t === 'part-time' || t === 'contractual' || t === 'contract' || t === 'project') {
    return 'PRJ';
  }
  return 'NKB';
}

/**
 * Generates an automated, conflict-free Employee ID number.
 * - Regular: NKB-YYYY-XXXX (e.g. NKB-2026-0001)
 * - Part-time / Contractual: PRJ-YYYY-XXXX (e.g. PRJ-2026-0001)
 */
export function generateNextEmployeeId(staffList = [], employmentType = 'regular', year = new Date().getFullYear()) {
  const prefix = getPrefixForEmploymentType(employmentType);
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
