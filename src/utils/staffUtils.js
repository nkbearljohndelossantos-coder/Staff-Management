/**
 * staffUtils.js
 * Standard employee name formatting and helper utilities.
 * 
 * Enforces company standard:
 * ALL CAPITAL LETTERS · LAST NAME FIRST
 * Example: "DELOS SANTOS, EARL JOHN"
 */

export function formatStaffName(staff) {
  if (!staff) return 'STAFF MEMBER';
  if (typeof staff === 'string') return staff.trim().toUpperCase();
  const last = (staff.lastName || '').trim().toUpperCase();
  const first = (staff.firstName || '').trim().toUpperCase();
  if (last && first && last !== first) {
    return `${last}, ${first}`;
  }
  if (staff.rawName) return staff.rawName.trim().toUpperCase();
  if (staff.name) return staff.name.trim().toUpperCase();
  return (last || first || 'STAFF MEMBER').trim().toUpperCase();
}
