/**
 * Role Authorization & Management Permissions for NKB System
 * 
 * Strict Authority Rules:
 * - Super Admins (CEO & IT Admin): Universal access to manage all accounts, tabs, and actions.
 * - HR Management (Genevieve Anne A. JURADO / hr, admin):
 *     Authorized: Staff & IDs, Positions & Depts, Barcode Clock-In, Coop Share Deposits, 
 *                 Requesting Share Withdrawals to Accounting, Stage 1 Loan Endorsement,
 *                 Canteen Cash Advance & Cash Drawer under HR Authority, Personal ESS.
 *     Unauthorized: Payroll Engine, Stage 2 Loan Disbursement, Authorizing Share Capital Release.
 * - Accounting / Finance (Dorina NABONG / accounting, finance):
 *     Authorized: Payroll Engine (Create, Calculate, Approve, Disburse), 
 *                 Stage 2 Loan Disbursement (Debits Coop Shares), 
 *                 Authorizing & Disbursing Coop Share Withdrawals,
 *                 Coop Share Capital Ledger & Balances Audit, Personal ESS.
 *     Unauthorized: Staff & IDs, Positions & Depts, Barcode Clock-In, Stage 1 Loan Endorsement,
 *                   Coop Share Deposits, Requesting Withdrawals, Canteen Cash Drawer.
 * - Employee (employee):
 *     Authorized: My Payslips & Personal ESS (request personal loan, request cash advance, view balance).
 *     Unauthorized: All administrative modules.
 */

export const TAB_PERMISSIONS = {
  staff: {
    id: 'staff',
    title: 'Staff & IDs',
    authorizedRoles: ['ceo', 'it_admin', 'admin', 'hr'],
    requiredRoleLabel: 'HR Management or Super Admin'
  },
  positions: {
    id: 'positions',
    title: 'Positions & Departments',
    authorizedRoles: ['ceo', 'it_admin', 'admin', 'hr'],
    requiredRoleLabel: 'HR Management or Super Admin'
  },
  attendance: {
    id: 'attendance',
    title: 'Barcode Clock-In',
    authorizedRoles: ['ceo', 'it_admin', 'admin', 'hr'],
    requiredRoleLabel: 'HR Management or Super Admin'
  },
  payroll: {
    id: 'payroll',
    title: 'Payroll Engine',
    authorizedRoles: ['ceo', 'it_admin', 'finance', 'accounting'],
    requiredRoleLabel: 'Accounting & Finance or Super Admin'
  },
  coopLoans: {
    id: 'coopLoans',
    title: 'Coop, Loans & Canteen',
    authorizedRoles: ['ceo', 'it_admin', 'admin', 'hr', 'finance', 'accounting'],
    requiredRoleLabel: 'HR Management, Accounting, or Super Admin'
  },
  canteenHub: {
    id: 'canteenHub',
    title: 'Canteen & Inventory',
    authorizedRoles: ['ceo', 'it_admin', 'canteen'],
    requiredRoleLabel: 'Canteen Management or Super Admin'
  },
  employeePortal: {
    id: 'employeePortal',
    title: 'My Payslips (ESS)',
    authorizedRoles: ['ceo', 'it_admin', 'admin', 'hr', 'finance', 'accounting', 'canteen', 'employee'],
    requiredRoleLabel: 'All Personnel'
  },
  conceptMap: {
    id: 'conceptMap',
    title: 'System Concept Map',
    authorizedRoles: ['ceo', 'it_admin', 'admin', 'hr', 'finance', 'accounting', 'canteen', 'employee'],
    requiredRoleLabel: 'All Roles (Customized View)'
  }
};

/**
 * Checks if a given role is authorized to access and view a specific navigation tab
 */
export const isTabAuthorized = (tabId, role) => {
  if (!role) return false;
  if (role === 'ceo' || role === 'it_admin') return true;
  const config = TAB_PERMISSIONS[tabId];
  return config ? config.authorizedRoles.includes(role) : false;
};

/**
 * Returns default home tab for each role upon login
 */
export const getDefaultTabForRole = (role) => {
  if (role === 'employee') return 'employeePortal';
  if (role === 'canteen') return 'canteenHub';
  if (role === 'finance' || role === 'accounting') return 'payroll';
  if (role === 'admin' || role === 'hr') return 'staff';
  return 'staff'; // Default for CEO / IT Admin
};

/**
 * Granular action permission checkers
 */
export const canManageStaff = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canManagePositions = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canManagePayroll = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'finance' || role === 'accounting';
};

export const canManageCoopDeposits = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canRequestCoopWithdrawal = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canAuthorizeCoopWithdrawal = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'finance' || role === 'accounting';
};

export const canEncodeCashLoan = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canEndorseLoanStage1 = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canAuthorizeLoanStage2 = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'finance' || role === 'accounting';
};

export const canManageCanteen = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'admin' || role === 'hr';
};

export const canManageCanteenHub = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'canteen';
};

export const canManageCanteenInventory = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'canteen';
};

export const canPerformCardVoid = (role) => {
  return role === 'ceo' || role === 'it_admin' || role === 'canteen';
};
