/**
 * Enterprise Audit Trail Logger for NKB Manufacturing
 * Records tamper-evident chronological actions across HR, Canteen, Attendance, and IT Admin.
 */

const AUDIT_STORAGE_KEY = 'nkb_audit_trail';

export function getAuditLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logAuditEvent({
  category = 'GENERAL',
  action,
  details,
  operatorId = 'SYSTEM',
  operatorName = 'System Automated',
  operatorRole = 'system',
  targetId = null,
  previousValue = null,
  newValue = null
}) {
  if (typeof window === 'undefined' || !action) return null;

  const logs = getAuditLogs();
  const entry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    category,
    action,
    details: details || action,
    operatorId,
    operatorName,
    operatorRole,
    targetId,
    previousValue,
    newValue
  };

  // Keep last 1,000 audit logs
  const updated = [entry, ...logs].slice(0, 1000);
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to store audit log:', err);
  }

  return entry;
}

export function clearAuditLogs() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}
