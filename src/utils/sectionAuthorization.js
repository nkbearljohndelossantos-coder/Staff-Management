/**
 * Section Authorization & Granular Access Control Utility
 * 
 * Defines the 3 standard permission tiers per section:
 * - 'none'   : 🚫 No Access (Hidden from navigation, access blocked)
 * - 'view'   : 👁️ Viewing Only (Read-only browsing, all edits/voids/actions disabled)
 * - 'manage' : ✏️ Editing / Managing (Full operational create, edit, delete, and manage authority)
 */

export const PERMISSION_LEVELS = {
  NONE: 'none',
  VIEW: 'view',
  MANAGE: 'manage'
};

export const SYSTEM_SECTIONS = [
  {
    id: 'executiveDashboard',
    name: 'Executive Analytics',
    description: 'Executive briefing, overall company telemetry, and anomaly summaries',
    category: 'Management'
  },
  {
    id: 'staff',
    name: 'Staff Directory & IDs',
    description: 'Staff member directory, personal details, contact info, and digital ID cards',
    category: 'Human Resources'
  },
  {
    id: 'positions',
    name: 'Positions & Departments',
    description: 'Job titles, departmental structures, and organizational hierarchy',
    category: 'Human Resources'
  },
  {
    id: 'attendance',
    name: 'Barcode Clock-In & Shifts',
    description: 'Timekeeping kiosk, shifts, time logs, and overtime records',
    category: 'Operations'
  },
  {
    id: 'payroll',
    name: 'Payroll Engine',
    description: 'Pay runs, salary computations, deductions, payslips, and disbursements',
    category: 'Finance'
  },
  {
    id: 'coopLoans',
    name: 'Coop Loans & Ledger',
    description: 'Share capital ledger, cash loan applications, endorsements, and disbursements',
    category: 'Finance'
  },
  {
    id: 'canteenHub',
    name: 'Canteen POS & Inventory',
    description: 'Point-of-sale scanner terminal, stock inventory, retail/wholesale pricing, and daily register',
    category: 'Canteen'
  },
  {
    id: 'gatePasses',
    name: 'Grocery Gate Passes',
    description: 'Gate pass issuance, security barcode verification, and grocery releases',
    category: 'Security & Logistics'
  },
  {
    id: 'purchaseOrders',
    name: 'Personal Purchase Orders',
    description: 'Staff personal purchase request encoding, approvals, and order tracking',
    category: 'Procurement'
  },
  {
    id: 'itAdminHub',
    name: 'IT Admin Master Records',
    description: 'System-wide troubleshooting, transaction overdrives, audit trail, and security controls',
    category: 'IT Administration'
  }
];

export const SYSTEM_ROLES = [
  { id: 'ceo', name: 'CEO & Executive Leadership', badge: 'Super Admin' },
  { id: 'it_admin', name: 'IT Administrator', badge: 'IT Admin' },
  { id: 'hr', name: 'HR Management & Officers', badge: 'HR' },
  { id: 'finance', name: 'Finance & Accounting Officers', badge: 'Accounting' },
  { id: 'canteen', name: 'Canteen Supervisor & Cashiers', badge: 'Canteen' },
  { id: 'employee', name: 'General Staff & Employees', badge: 'Staff' }
];

/**
 * Standard factory default role permission matrix
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  ceo: {
    executiveDashboard: 'manage',
    staff: 'manage',
    positions: 'manage',
    attendance: 'manage',
    payroll: 'manage',
    coopLoans: 'manage',
    canteenHub: 'manage',
    gatePasses: 'manage',
    purchaseOrders: 'manage',
    itAdminHub: 'manage'
  },
  it_admin: {
    executiveDashboard: 'manage',
    staff: 'manage',
    positions: 'manage',
    attendance: 'manage',
    payroll: 'manage',
    coopLoans: 'manage',
    canteenHub: 'manage',
    gatePasses: 'manage',
    purchaseOrders: 'manage',
    itAdminHub: 'manage'
  },
  hr: {
    executiveDashboard: 'view',
    staff: 'manage',
    positions: 'manage',
    attendance: 'manage',
    payroll: 'view',
    coopLoans: 'manage',
    canteenHub: 'view',
    gatePasses: 'manage',
    purchaseOrders: 'view',
    itAdminHub: 'none'
  },
  finance: {
    executiveDashboard: 'view',
    staff: 'view',
    positions: 'view',
    attendance: 'view',
    payroll: 'manage',
    coopLoans: 'manage',
    canteenHub: 'view',
    gatePasses: 'view',
    purchaseOrders: 'view',
    itAdminHub: 'none'
  },
  canteen: {
    executiveDashboard: 'none',
    staff: 'view',
    positions: 'none',
    attendance: 'none',
    payroll: 'none',
    coopLoans: 'view',
    canteenHub: 'manage',
    gatePasses: 'manage',
    purchaseOrders: 'manage',
    itAdminHub: 'none'
  },
  employee: {
    executiveDashboard: 'none',
    staff: 'none',
    positions: 'none',
    attendance: 'none',
    payroll: 'none',
    coopLoans: 'none',
    canteenHub: 'none',
    gatePasses: 'none',
    purchaseOrders: 'none',
    itAdminHub: 'none'
  }
};

/**
 * Resolves the effective permission ('none' | 'view' | 'manage') for a user on a given section.
 * Priority order:
 * 1. Super Admin / IT Admin emergency override (always 'manage')
 * 2. Individual User Override (if configured)
 * 3. Role-Based Permission from the configured matrix
 * 4. Factory default fallback
 */
export function getEffectiveSectionPermission(sectionId, user, roleMatrix = null, userOverrides = null) {
  if (!user) return PERMISSION_LEVELS.NONE;

  // Super Admins & IT Admins have full access to everything
  const role = (user.role || '').toLowerCase();
  if (role === 'ceo' || role === 'it_admin' || role === 'super_admin') {
    return PERMISSION_LEVELS.MANAGE;
  }

  // Check individual user override first
  const userId = user.staffId || user.id || user.employeeId;
  if (userOverrides && userId && userOverrides[userId] && userOverrides[userId][sectionId] !== undefined) {
    return userOverrides[userId][sectionId];
  }

  // Check role-based matrix
  const normalizedRole = (role === 'admin') ? 'hr' : (role === 'accounting') ? 'finance' : role;
  const activeMatrix = roleMatrix || DEFAULT_ROLE_PERMISSIONS;

  if (activeMatrix[normalizedRole] && activeMatrix[normalizedRole][sectionId] !== undefined) {
    return activeMatrix[normalizedRole][sectionId];
  }

  // Fallback to factory defaults
  if (DEFAULT_ROLE_PERMISSIONS[normalizedRole] && DEFAULT_ROLE_PERMISSIONS[normalizedRole][sectionId] !== undefined) {
    return DEFAULT_ROLE_PERMISSIONS[normalizedRole][sectionId];
  }

  return PERMISSION_LEVELS.NONE;
}

export function isSectionViewable(sectionId, user, roleMatrix, userOverrides) {
  const perm = getEffectiveSectionPermission(sectionId, user, roleMatrix, userOverrides);
  return perm === PERMISSION_LEVELS.VIEW || perm === PERMISSION_LEVELS.MANAGE;
}

export function isSectionManageable(sectionId, user, roleMatrix, userOverrides) {
  const perm = getEffectiveSectionPermission(sectionId, user, roleMatrix, userOverrides);
  return perm === PERMISSION_LEVELS.MANAGE;
}
