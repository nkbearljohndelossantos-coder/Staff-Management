/**
 * scanResolver.js
 * Universal, high-tolerance barcode & QR code resolver for staff ID badges,
 * barcode guns (USB/Wireless), mobile cameras, and POS terminals.
 */

/**
 * Normalizes barcode scanner inputs by stripping:
 * 1. ASCII control characters (STX, ETX, NUL, GS, ESC, etc.)
 * 2. AIM Symbology Identifiers transmitted by hardware barcode guns (e.g. ]C0, ]C1, ]Q1, ]e0, ]A0)
 * 3. Surrounding Code 39 start/stop asterisks (*...*)
 * 4. Surrounding quotation marks
 * 5. Leading/trailing whitespace
 */
export function cleanScanInput(raw) {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  // Strip non-printable ASCII control chars
  str = str.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  // Strip AIM standard prefix (] followed by symbology letter and optional modifier digit)
  str = str.replace(/^\][A-Za-z][0-9]?/, '');
  // Strip surrounding Code 39 asterisks
  str = str.replace(/^\*+|\*+$/g, '');
  // Strip surrounding quotes
  str = str.replace(/^["']|["']$/g, '');
  return str.trim();
}

/**
 * Determines whether a scanned string resembles an employee ID badge or staff pass
 * rather than a retail inventory product (EAN/UPC).
 */
export function isStaffBarcodePattern(inputStr) {
  if (!inputStr) return false;
  const clean = cleanScanInput(inputStr);
  if (!clean) return false;
  const up = clean.toUpperCase();

  // QR / NFC structured badge payloads
  if (up.includes('NKB-STAFF') || up.includes('STAFF:') || up.includes('AUTH-2026')) return true;

  // Standard corporate prefixes
  if (up.startsWith('NKB') || up.startsWith('PRJ') || up.startsWith('EMP') || up.startsWith('STAFF')) return true;
  if (/^ID[-_:]/i.test(clean)) return true;

  // Short badge sequence numbers e.g. 0001, 0042
  if (/^\d{3,5}$/.test(clean)) return true;

  return false;
}

/**
 * Resolves a staff record from any barcode gun scan, QR payload, badge number, or employee ID.
 * 100% safe against undefined/null fields in staffList.
 */
export function resolveStaffFromScan(staffList = [], inputStr) {
  if (!Array.isArray(staffList) || staffList.length === 0 || !inputStr) return null;
  const clean = cleanScanInput(inputStr);
  if (!clean) return null;

  // 0. Handle structured composite formats first
  // 0a. Digital ID QR Code Payload: NKB-STAFF:<employeeId>:<name>:<auth>
  if (clean.toUpperCase().startsWith('NKB-STAFF:')) {
    const parts = clean.split(':');
    const empId = parts[1]?.trim();
    if (empId) {
      const match = resolveStaffFromScan(staffList, empId);
      if (match) return match;
    }
    const namePart = parts[2]?.trim()?.replace(/_/g, ' ');
    if (namePart) {
      const match = resolveStaffFromScan(staffList, namePart);
      if (match) return match;
    }
  }

  // 0b. Colon-delimited formats e.g. "ID:NKB052026-0001" or "NKB052026-0001:Katherine Bella"
  if (clean.includes(':')) {
    const parts = clean.split(':').map(p => p.trim());
    for (const p of parts) {
      if (!p || p.toUpperCase() === 'NKB-STAFF' || p.toUpperCase().startsWith('AUTH-')) continue;
      const match = resolveStaffFromScan(staffList, p);
      if (match) return match;
    }
  }

  // 0c. JSON scan e.g. {"employeeId":"NKB052026-0001"}
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      const target = parsed.employeeId || parsed.barcode || parsed.id || parsed.barcodeValue;
      if (target) {
        const match = resolveStaffFromScan(staffList, target);
        if (match) return match;
      }
    } catch {}
  }

  const up = clean.toUpperCase();
  const alnum = clean.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  // 1. Direct exact matches on barcodeValue, employeeId, id
  let staff = staffList.find(s => {
    const sBar = (s?.barcodeValue || '').trim().toUpperCase();
    const sEmp = (s?.employeeId || '').trim().toUpperCase();
    const sId = (s?.id || '').trim().toUpperCase();
    const sIdClean = sId.replace(/^EMP-/i, '');

    return (
      (sBar && sBar === up) ||
      (sEmp && sEmp === up) ||
      (sId && sId === up) ||
      (sIdClean && sIdClean === up) ||
      (sEmp && up === `EMP-${sEmp}`)
    );
  });
  if (staff) return staff;

  // 2. Alphanumeric match (ignoring hyphens/spaces, e.g. NKB0520260001 -> NKB052026-0001)
  if (alnum.length >= 6) {
    staff = staffList.find(s => {
      const sBarAlnum = (s?.barcodeValue || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const sEmpAlnum = (s?.employeeId || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const sIdAlnum = (s?.id || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      return (
        (sBarAlnum && sBarAlnum === alnum) ||
        (sEmpAlnum && sEmpAlnum === alnum) ||
        (sIdAlnum && sIdAlnum === alnum)
      );
    });
    if (staff) return staff;
  }

  // 3. Numeric Sequence / Suffix Matching
  // Case 3a: Pure numbers like "0001", "1", "0042", "42"
  if (/^\d{1,5}$/.test(up)) {
    const numVal = parseInt(up, 10);
    if (!isNaN(numVal) && numVal > 0) {
      staff = staffList.find(s => {
        const emp = (s?.employeeId || '').toUpperCase();
        const seqMatch = emp.match(/-(\d+)$/) || emp.match(/(\d+)$/);
        if (seqMatch) {
          const sNum = parseInt(seqMatch[1], 10);
          return sNum === numVal;
        }
        return false;
      });
      if (staff) return staff;
    }
  }

  // Case 3b: Prefixed sequence like "NKB-2026-0001", "NKB-0001", "EMP-0001", "ID-0042"
  const prefSeqMatch = up.match(/^(?:NKB|PRJ|EMP|STAFF|ID)[-_:\s]*(?:\d{4}[-_:\s]*)?(\d{1,5})$/i);
  if (prefSeqMatch && prefSeqMatch[1]) {
    const numVal = parseInt(prefSeqMatch[1], 10);
    if (!isNaN(numVal) && numVal > 0) {
      staff = staffList.find(s => {
        const emp = (s?.employeeId || '').toUpperCase();
        const seqMatch = emp.match(/-(\d+)$/) || emp.match(/(\d+)$/);
        if (seqMatch) {
          const sNum = parseInt(seqMatch[1], 10);
          return sNum === numVal;
        }
        return false;
      });
      if (staff) return staff;
    }
  }

  // 4. Name match (case-insensitive, normalized punctuation & spaces)
  const normClean = clean.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (normClean.length >= 3) {
    staff = staffList.find(s => {
      const fullName = `${s?.firstName || ''} ${s?.lastName || ''}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const invName = `${s?.lastName || ''} ${s?.firstName || ''}`.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      const raw = (s?.rawName || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

      return (
        (fullName && (fullName === normClean || fullName.includes(normClean) || normClean.includes(fullName))) ||
        (invName && (invName === normClean || invName.includes(normClean) || normClean.includes(invName))) ||
        (raw && (raw === normClean || raw.includes(normClean) || normClean.includes(raw)))
      );
    });
  }

  return staff || null;
}
