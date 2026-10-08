import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_STAFF,
  INITIAL_ATTENDANCE,
  INITIAL_PAY_RUNS,
  INITIAL_COOP_BALANCES,
  INITIAL_COOP_LEDGER,
  INITIAL_COOP_WITHDRAWALS,
  INITIAL_LOANS,
  INITIAL_CANTEEN_DRAWER,
  INITIAL_CASH_ADVANCES,
  LOAN_CATEGORIES,
  INITIAL_CANTEEN_INVENTORY,
  DEFAULT_CANTEEN_CATEGORIES,
  INITIAL_MANUFACTURING_PRODUCTS,
  INITIAL_PERSONAL_PURCHASE_ORDERS,
  INITIAL_CANTEEN_RECEIPTS,
  INITIAL_CANTEEN_GATE_PASSES,
  INITIAL_CANTEEN_VOID_LOGS,
  INITIAL_CANTEEN_SALES_INVOICES,
  INITIAL_PRODUCT_JOURNEYS,
  PRODUCT_JOURNEY_STAGES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_OVERTIME_REQUESTS
} from '../data/mockData';
import { generateNextEmployeeId, formatBarcodeValue } from '../utils/idGenerator';
import { resolveStaffFromScan, cleanScanInput } from '../utils/scanResolver';
import { computeEmployeePayroll } from '../utils/payrollCalculations';
import { logAuditEvent, getAuditLogs } from '../utils/auditLogger';
import { getOfflineQueue, clearOfflineQueue, initOfflineSyncListener } from '../utils/offlineSync';
import { scanForAnomalies, saveAnomalyEvaluation, computeExecutiveRiskSummary, getStoredEvaluations } from '../utils/anomalyDetector';
import { formatStaffName, scanStaffMilestones } from '../utils/staffUtils';
import { isBoxOrPackItem, extractPiecesFromItem, getEffectiveRetailPiecePrice } from '../utils/canteenPricing';
import { 
  DEFAULT_ROLE_PERMISSIONS, 
  getEffectiveSectionPermission, 
  isSectionViewable, 
  isSectionManageable, 
  PERMISSION_LEVELS,
  SYSTEM_SECTIONS,
  SYSTEM_ROLES
} from '../utils/sectionAuthorization';
import { generateDefaultMisconductMemo } from '../utils/misconductUtils.js';
import {
  getCoopLoanMultiplier,
  setCoopLoanMultiplier,
  validateLoanApplication,
  computeLoanFinancials,
  buildRetirementSettlement,
  processCanteenSalaryDeduction,
  getPettyCashApiConfig,
  savePettyCashApiConfig,
  createReplenishmentRequestModel,
  sendPettyCashReplenishmentApi,
  createFinancialAuditEntry,
  REPLENISHMENT_STATUSES,
  VALID_LOAN_TERMS,
  MAX_LOAN_TERM_MONTHS
} from '../utils/coopBusinessRules';


const AppContext = createContext(null);


// DATA PRESERVATION POLICY:
// NEVER wipe, truncate, reset, or delete user-uploaded data or local transactions upon updates.
// All user modifications, staff edits, inventory updates, and transaction records remain permanently preserved.
if (typeof window !== 'undefined') {
  if (!localStorage.getItem('nkb_system_initialized')) {
    localStorage.setItem('nkb_system_initialized', 'true');
  }
}

export function AppProvider({ children }) {
  // Load from localStorage, strictly preserving all user records and edits
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_staff');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(s => s.employeeId || s.id));
          const merged = [...parsed];
          INITIAL_STAFF.forEach(initStaff => {
            if (!existingIds.has(initStaff.employeeId) && !existingIds.has(initStaff.id)) {
              merged.push(initStaff);
            }
          });
          return merged.map(s => {
            const isTargetITAdmin = s.employeeId === 'NKB052026-0014' || s.id === 'emp-nkb052026-0014';
            const upperLast = (s.lastName || '').trim().toUpperCase();
            const upperFirst = (s.firstName || '').trim().toUpperCase();
            const raw = upperLast && upperFirst && upperLast !== upperFirst 
              ? `${upperLast}, ${upperFirst}` 
              : (s.rawName ? s.rawName.trim().toUpperCase() : (upperLast || upperFirst || 'STAFF MEMBER'));
            return {
              ...s,
              firstName: upperFirst,
              lastName: upperLast,
              rawName: raw,
              role: isTargetITAdmin ? 'it_admin' : (s.role || 'employee'),
              positionId: isTargetITAdmin ? 'pos-it' : s.positionId,
              positionTitle: isTargetITAdmin ? 'IT Systems Administrator' : s.positionTitle,
              departmentId: isTargetITAdmin ? 'dept-it' : s.departmentId,
              departmentName: isTargetITAdmin ? 'Information Technology (IT)' : s.departmentName,
              dateHired: s.dateHired || s.hireDate || '2026-05-01',
              hireDate: s.hireDate || s.dateHired || '2026-05-01',
              birthday: s.birthday || '1995-06-15',
              address: s.address || 'Subic Bay Gateway Park, Olongapo City, Zambales',
              sssNo: s.sssNo || '',
              philHealthNo: s.philHealthNo || '12-094820192-1',
              hdmfNo: s.hdmfNo || '1210-9482-0192',
              salaryRateType: s.salaryRateType || 'monthly',
              workScheduleType: s.workScheduleType || '6_days',
              salaryRate: s.salaryRate !== undefined ? s.salaryRate : (s.baseSalary || 0),
              filedSalary: s.filedSalary !== undefined ? s.filedSalary : 0,
              sickLeaveTotal: s.sickLeaveTotal !== undefined ? s.sickLeaveTotal : 5,
              sickLeaveRemaining: s.sickLeaveRemaining !== undefined ? s.sickLeaveRemaining : 5,
              vacationLeaveTotal: s.vacationLeaveTotal !== undefined ? s.vacationLeaveTotal : 5,
              vacationLeaveRemaining: s.vacationLeaveRemaining !== undefined ? s.vacationLeaveRemaining : 5,
              emergencyContactName: s.emergencyContactName || '',
              emergencyContactPhone: s.emergencyContactPhone || '',
              isTeamLeader: Boolean(s.isTeamLeader),
              documents: s.documents || []
            };
          });
        }
      } catch (e) {}
    }
    return [...INITIAL_STAFF];
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_departments');
    let parsed = saved ? JSON.parse(saved) : [...INITIAL_DEPARTMENTS];
    INITIAL_DEPARTMENTS.forEach(init => {
      if (!parsed.some(d => d.id === init.id)) {
        parsed.push(init);
      }
    });
    return parsed;
  });

  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_positions');
    let parsed = saved ? JSON.parse(saved) : [...INITIAL_POSITIONS];
    INITIAL_POSITIONS.forEach(init => {
      if (!parsed.some(p => p.id === init.id)) {
        parsed.push(init);
      }
    });
    return parsed;
  });

  const [attendanceLogs, setAttendanceLogs] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  // Coop Share Capital Balances & Ledger
  const [coopBalances, setCoopBalances] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_coop_balances');
    return saved ? JSON.parse(saved) : INITIAL_COOP_BALANCES;
  });

  const [coopLedger, setCoopLedger] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_coop_ledger');
    return saved ? JSON.parse(saved) : INITIAL_COOP_LEDGER;
  });

  const [coopWithdrawals, setCoopWithdrawals] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_coop_withdrawals');
    return saved ? JSON.parse(saved) : INITIAL_COOP_WITHDRAWALS;
  });

  // Cash Loans
  const [cashLoans, setCashLoans] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_cash_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  // Canteen Cash Drawer & Cash Advances
  const [canteenDrawer, setCanteenDrawer] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_canteen_drawer');
    return saved ? JSON.parse(saved) : INITIAL_CANTEEN_DRAWER;
  });

  const [cashAdvances, setCashAdvances] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_cash_advances');
    return saved ? JSON.parse(saved) : INITIAL_CASH_ADVANCES;
  });

  // COOP Loan Configurable Multiplier (Default 3x)
  const [coopLoanMultiplier, setCoopLoanMultiplierState] = useState(() => {
    return getCoopLoanMultiplier();
  });

  // Dedicated Canteen Deductions Ledger & Member Balances
  const [canteenDeductionsLedger, setCanteenDeductionsLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_deductions_ledger');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [canteenLedgerBalances, setCanteenLedgerBalances] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_ledger_balances');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Petty Cash -> Drawer Replenishment State Machine Requests
  const [replenishmentRequests, setReplenishmentRequests] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_replenishment_requests');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [pettyCashConfig, setPettyCashConfigState] = useState(() => {
    return getPettyCashApiConfig();
  });

  // Unified Financial Transaction Audit Trail
  const [coopAuditTrail, setCoopAuditTrail] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_coop_audit_trail');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });


  // Canteen Inventory Supplies (Official 355 products from Canteen_Inventory.xlsx with zero initial quantity)
  const [canteenInventory, setCanteenInventory] = useState(() => {
    try {
      const zeroedMigration = localStorage.getItem('nkb_canteen_inventory_zeroed_v1');
      if (!zeroedMigration) {
        localStorage.setItem('nkb_canteen_inventory_zeroed_v1', 'true');
        localStorage.setItem('nkb_canteen_inventory', JSON.stringify(INITIAL_CANTEEN_INVENTORY));
        return [...INITIAL_CANTEEN_INVENTORY];
      }
      const saved = localStorage.getItem('nkb_canteen_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(item => {
            if (isBoxOrPackItem(item)) {
              const effPiece = getEffectiveRetailPiecePrice(item);
              const pieces = extractPiecesFromItem(item);
              return {
                ...item,
                hasRetailPiece: true,
                retailPiecePrice: Number(item.retailPiecePrice) > 0 ? Number(item.retailPiecePrice) : effPiece,
                piecesPerPack: Number(item.piecesPerPack) > 0 ? Number(item.piecesPerPack) : pieces
              };
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.error('Failed to initialize canteen inventory:', e);
    }
    return [...INITIAL_CANTEEN_INVENTORY];
  });

  // Canteen Supply Categories (Customizable, Add/Delete categories)
  const [canteenCategories, setCanteenCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_CANTEEN_CATEGORIES;
  });

  // Canteen Supplier Sales Invoices (Official Inbound Delivery Receipts)
  const [canteenSalesInvoices, setCanteenSalesInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_canteen_sales_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [...INITIAL_CANTEEN_SALES_INVOICES];
  });

  // POS Dual Monitor Synchronization State
  const [posDualDisplayState, setPosDualDisplayState] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_pos_display_sync');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      cart: [],
      lastScannedItem: null,
      orderType: 'Dine In',
      paymentMethod: 'Cash',
      customer: null,
      grandTotal: 0,
      timestamp: Date.now(),
      status: 'IDLE' // 'IDLE' | 'SCANNING' | 'CHECKOUT' | 'COMPLETED' | 'VOIDED'
    };
  });

  const broadcastPOSDisplayState = (partialState) => {
    setPosDualDisplayState(prev => {
      const updated = {
        ...prev,
        ...partialState,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem('nkb_canteen_pos_display_sync', JSON.stringify(updated));
        if (typeof window !== 'undefined' && window.BroadcastChannel) {
          const bc = new BroadcastChannel('nkb_canteen_pos_channel');
          bc.postMessage(updated);
          bc.close();
        }
      } catch (e) {
        console.warn('POS BroadcastChannel sync error:', e);
      }
      return updated;
    });
  };

  // NKB Manufacturing Products (Factory manufactured goods for employee personal purchase orders)
  const [manufacturingProducts, setManufacturingProducts] = useState(() => {
    const saved = localStorage.getItem('nkb_mfg_products');
    return saved ? JSON.parse(saved) : INITIAL_MANUFACTURING_PRODUCTS;
  });

  // Personal Purchase Orders (Personal use: Manufacturing products, cash vs coop)
  const [personalPurchaseOrders, setPersonalPurchaseOrders] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_pos');
    return saved ? JSON.parse(saved) : INITIAL_PERSONAL_PURCHASE_ORDERS;
  });

  // Immutable Canteen Receipts
  const [canteenReceipts, setCanteenReceipts] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_receipts');
    let list = saved ? JSON.parse(saved) : INITIAL_CANTEEN_RECEIPTS;
    // Purge test record GP-2026-47210
    return list.filter(r => r.gatePassNo !== 'GP-2026-47210' && r.receiptNo !== 'REC-20260928-47210');
  });

  // Canteen Gate Passes (Half-A4 PDF security clearance for taking goods out of plant)
  const [canteenGatePasses, setCanteenGatePasses] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_gate_passes');
    let list = saved ? JSON.parse(saved) : [...INITIAL_CANTEEN_GATE_PASSES];
    
    // Purge test record GP-2026-47210
    list = list.filter(gp => gp.gatePassNo !== 'GP-2026-47210' && gp.id !== 'GP-2026-47210' && gp.receiptNo !== 'REC-20260928-47210');

    return list.map(gp => {
      const isCleared = 
        gp.gateStatus?.toLowerCase().includes('cleared') || 
        gp.status?.toLowerCase().includes('cleared') || 
        Boolean(gp.clearedAt);
      if (isCleared) {
        return {
          ...gp,
          gateStatus: 'Cleared at Gate',
          status: 'Cleared at Gate',
          clearedAt: gp.clearedAt || new Date().toISOString(),
          securityGuard: gp.securityGuard || 'Officer R. Mendoza (Main Gate Post 1)'
        };
      }
      return gp;
    });
  });

  // Canteen Void Logs (Card-based Barcode/QR/RFID audits)
  const [canteenVoidLogs, setCanteenVoidLogs] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_void_logs');
    return saved ? JSON.parse(saved) : INITIAL_CANTEEN_VOID_LOGS;
  });

  // Historical Canteen End-of-Day Shift Closeout Z-Readings
  const [canteenZReadings, setCanteenZReadings] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_z_readings');
    return saved ? JSON.parse(saved) : [];
  });

  // Systematic Live Product Journeys (5 Stages: Ordered, Receiving Dock, Inventory, Employee Claimed, Voided Back)
  const [productJourneys, setProductJourneys] = useState(() => {
    const saved = localStorage.getItem('nkb_product_journeys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If old 6-stage schema, migrate to 5-stage journeys
        const isOldSchema = parsed.some(j => 
          j.milestones?.some(m => m.stageId === 'supplier_hub' || m.stageId === 'cold_transit' || m.stageId === 'pos_checkout' || m.stageId === 'employee_handover')
        );
        if (isOldSchema || parsed.length < INITIAL_PRODUCT_JOURNEYS.length) {
          localStorage.setItem('nkb_product_journeys', JSON.stringify(INITIAL_PRODUCT_JOURNEYS));
          return INITIAL_PRODUCT_JOURNEYS;
        }
        return parsed;
      } catch (e) {
        return INITIAL_PRODUCT_JOURNEYS;
      }
    }
    return INITIAL_PRODUCT_JOURNEYS;
  });

  const [payRuns, setPayRuns] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_payruns');
    if (saved) return JSON.parse(saved);
    return INITIAL_PAY_RUNS;
  });

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.employeeId === 'NKB052026-0014' || parsed.staffId === 'emp-nkb052026-0014' || parsed.email === 'earljohn.delossantos@nkb.com') {
            parsed.role = 'it_admin';
          }
          if (parsed.name) {
            parsed.name = formatStaffName(parsed);
          }
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('staff');
  const [notification, setNotification] = useState(null);

  // Global Digital ID (Barcode & QR) Modal State
  const [digitalIdStaff, setDigitalIdStaff] = useState(null);
  const [isDigitalIdOpen, setIsDigitalIdOpen] = useState(false);

  const openDigitalId = (staffMember = null) => {
    let target = staffMember;
    if (!target && currentUser) {
      target = staffList.find(s => s.id === currentUser.staffId || s.employeeId === currentUser.employeeId) || staffList[0];
    }
    if (!target) target = staffList[0];
    setDigitalIdStaff(target);
    setIsDigitalIdOpen(true);
  };

  const closeDigitalId = () => {
    setIsDigitalIdOpen(false);
  };

  // Leave & Overtime Requests State
  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_leave_requests');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [overtimeRequests, setOvertimeRequests] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_overtime_requests');
    return saved ? JSON.parse(saved) : INITIAL_OVERTIME_REQUESTS;
  });

  // In-App Notification Center State
  const [inAppNotifications, setInAppNotifications] = useState(() => {
    const saved = localStorage.getItem('nkb_notifications');
    return saved ? JSON.parse(saved) : [
      {
        id: 'notif-1',
        title: 'Digital Employee ID Ready',
        message: 'Your official 1D Barcode and 2D QR turnstile pass is available in your portal.',
        time: 'Today',
        type: 'info',
        read: false
      },
      {
        id: 'notif-2',
        title: 'PWA Offline Mode Activated',
        message: 'Portal is ready for home-screen installation and offline factory floor operation.',
        time: 'Today',
        type: 'success',
        read: false
      }
    ];
  });

  // Dark / Light Mode Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nkb_theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('nkb_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // HR Statutory Deductions Timing Schedule ('per_cutoff' = 50% split per cut-off, 'monthly' = 100% full monthly deduction)
  const [statutoryDeductionsSchedule, setStatutoryDeductionsSchedule] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nkb_statutory_deductions_schedule') || 'per_cutoff';
    }
    return 'per_cutoff';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nkb_statutory_deductions_schedule', statutoryDeductionsSchedule);
    }
  }, [statutoryDeductionsSchedule]);

  // Early Milestone Alerts for HR: Birthday Celebrants & Work Anniversaries (within 7 to 14 days)
  useEffect(() => {
    if (!staffList || staffList.length === 0) return;
    const { birthdays, anniversaries } = scanStaffMilestones(staffList, 14);

    const alertedKey = 'nkb_alerted_milestones';
    let alerted = {};
    try {
      alerted = JSON.parse(localStorage.getItem(alertedKey) || '{}');
    } catch (e) {}

    const newAlerts = [];
    const today = new Date().toISOString().split('T')[0];

    birthdays.forEach(({ staff, daysUntil, isToday, isTomorrow, formattedDate, milestoneYear }) => {
      const alertId = `bday-${staff.id}-${milestoneYear}`;
      if (!alerted[alertId]) {
        alerted[alertId] = today;
        const relativeTimeStr = isToday ? 'TODAY!' : isTomorrow ? 'TOMORROW!' : `in ${daysUntil} days (${formattedDate})`;
        newAlerts.push({
          id: `milestone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `🎂 Birthday Alert: ${formatStaffName(staff)}`,
          message: `${formatStaffName(staff)} is celebrating a birthday ${relativeTimeStr}. Early greeting & HR milestone notice.`,
          time: 'Upcoming',
          type: 'info',
          read: false
        });
      }
    });

    anniversaries.forEach(({ staff, daysUntil, isToday, isTomorrow, formattedDate, yearsCompleted, milestoneYear }) => {
      const alertId = `anniv-${staff.id}-${milestoneYear}`;
      if (!alerted[alertId]) {
        alerted[alertId] = today;
        const relativeTimeStr = isToday ? 'TODAY!' : isTomorrow ? 'TOMORROW!' : `in ${daysUntil} days (${formattedDate})`;
        newAlerts.push({
          id: `milestone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `🎖️ Work Anniversary: ${formatStaffName(staff)} (${yearsCompleted} ${yearsCompleted === 1 ? 'Year' : 'Years'})`,
          message: `${formatStaffName(staff)} will reach ${yearsCompleted} ${yearsCompleted === 1 ? 'year' : 'years'} company milestone ${relativeTimeStr}. Hired: ${staff.dateHired || staff.hireDate}.`,
          time: 'Upcoming',
          type: 'success',
          read: false
        });
      }
    });

    if (newAlerts.length > 0) {
      setInAppNotifications(prev => [...newAlerts, ...prev].slice(0, 50));
      try {
        localStorage.setItem(alertedKey, JSON.stringify(alerted));
      } catch (e) {}
    }
  }, [staffList]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState(() => getAuditLogs());

  const logSystemEvent = (eventData) => {
    const entry = logAuditEvent({
      ...eventData,
      operatorId: currentUser?.employeeId || currentUser?.id || 'SYSTEM',
      operatorName: currentUser?.name || 'System Operator',
      operatorRole: currentUser?.role || 'system'
    });
    setAuditLogs(getAuditLogs());
    return entry;
  };

  // Anomaly Evaluations State
  const [anomalyEvaluations, setAnomalyEvaluations] = useState(() => getStoredEvaluations());

  const recordAnomalyEvaluation = (anomalyId, evalData) => {
    const updated = saveAnomalyEvaluation(anomalyId, {
      ...evalData,
      reviewedBy: currentUser?.name || 'Authorized IT Officer',
      reviewedAt: new Date().toISOString()
    });
    setAnomalyEvaluations(getStoredEvaluations());
    logSystemEvent({
      category: 'SECURITY',
      action: 'EVALUATE_ANOMALY',
      details: `IT Admin evaluated anomaly ${anomalyId} with status ${evalData.status || 'REVIEWED'}`,
      targetId: anomalyId
    });
    return updated;
  };

  // --- IT SECTION AUTHORIZATIONS & ACCESS CONTROL MATRIX ---
  const [sectionAuthorizations, setSectionAuthorizations] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_hr_role_authorizations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [userAuthorizationOverrides, setUserAuthorizationOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_hr_user_authorization_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // --- IT TRANSACTION OVERDRIVE LOGS ---
  const [overdriveAuditLogs, setOverdriveAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_hr_overdrive_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // --- IT DIAGNOSTIC TRACE EVENTS ---
  const [itDiagnosticEvents, setItDiagnosticEvents] = useState(() => [
    {
      id: `diag-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'INFO',
      subsystem: 'BOOT',
      message: 'IT Diagnostic Event tracing initialized in memory.'
    }
  ]);

  const logDiagnosticEvent = (level, message, metadata = null) => {
    const newEvent = {
      id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level: (level || 'INFO').toUpperCase(),
      message,
      metadata
    };
    setItDiagnosticEvents(prev => [newEvent, ...prev].slice(0, 200));
    return newEvent;
  };

  // --- EMPLOYEE MISCONDUCT & CCTV INCIDENT REPORTS ---
  const [misconductReports, setMisconductReports] = useState(() => {
    try {
      const saved = localStorage.getItem('nkb_misconduct_reports');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const fileMisconductReport = (reportData) => {
    const reporterName = currentUser?.name || 'Authorized Security/HR Officer';
    const reporterRole = currentUser?.role || 'hr';
    const reporterId = currentUser?.employeeId || currentUser?.id || 'OFFICER';

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const reportId = `MISC-${dateStr}-${randSuffix}`;

    const newReport = {
      id: reportId,
      createdAt: now.toISOString(),
      reporterId,
      reporterName,
      reporterRole,
      staffId: reportData.staffId,
      staffName: reportData.staffName,
      staffEmployeeId: reportData.staffEmployeeId,
      staffDepartment: reportData.staffDepartment,
      staffPosition: reportData.staffPosition,
      involvedStaffIds: reportData.involvedStaffIds || [],
      category: reportData.category || 'OTHER_MISCONDUCT',
      categoryLabel: reportData.categoryLabel || 'Workplace Misconduct',
      severity: reportData.severity || 'MODERATE',
      incidentDate: reportData.incidentDate || now.toISOString().split('T')[0],
      incidentTime: reportData.incidentTime || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: reportData.location || 'Company Premises',
      narrative: reportData.narrative || '',
      cctvCameraId: reportData.cctvCameraId || '',
      cctvTimecode: reportData.cctvTimecode || '',
      cctvExternalLink: reportData.cctvExternalLink || '',
      attachment: reportData.attachment || null, // { name, type, size, dataUrl, isVideo }
      notifyStaff: Boolean(reportData.notifyStaff),
      calloutRequired: Boolean(reportData.calloutRequired),
      urgency: reportData.urgency || 'IMMEDIATE',
      scheduledTime: reportData.scheduledTime || '',
      notificationMessage: reportData.notificationMessage || '',
      status: reportData.calloutRequired ? 'PENDING_EXPLANATION' : 'UNDER_HR_INVESTIGATION',
      acknowledgedAt: null,
      acknowledgementNotes: null,
      explanationText: null,
      explanationSubmittedAt: null,
      resolutionSanction: null,
      resolutionNotes: null,
      resolvedAt: null,
      resolvedBy: null
    };

    setMisconductReports(prev => {
      const next = [newReport, ...prev];
      try {
        localStorage.setItem('nkb_misconduct_reports', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (newReport.notifyStaff) {
      addInAppNotification({
        title: `🚨 URGENT HR DIRECTIVE: Immediate HR Call-Out (Notice to Explain)`,
        message: newReport.notificationMessage || `You are instructed to report immediately to the HR office regarding incident #${reportId}.`,
        type: 'danger',
        targetStaffId: newReport.staffId,
        misconductReportId: reportId,
        actionType: 'HR_CALLOUT'
      });
    }

    logSystemEvent({
      category: 'DISCIPLINE',
      action: 'FILE_MISCONDUCT_REPORT',
      details: `Filed misconduct report #${reportId} against ${newReport.staffName} (${newReport.staffEmployeeId}) for ${newReport.categoryLabel}. Callout: ${newReport.calloutRequired ? 'YES' : 'NO'}.`,
      targetId: newReport.staffId
    });

    showToast(`Misconduct report #${reportId} filed successfully.`);
    return newReport;
  };

  const acknowledgeMisconductNotice = (reportId, notes = '') => {
    const now = new Date().toISOString();
    setMisconductReports(prev => {
      const next = prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            acknowledgedAt: now,
            acknowledgementNotes: notes,
            status: r.status === 'PENDING_EXPLANATION' ? 'ACKNOWLEDGED' : r.status
          };
        }
        return r;
      });
      try {
        localStorage.setItem('nkb_misconduct_reports', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    logSystemEvent({
      category: 'DISCIPLINE',
      action: 'ACKNOWLEDGE_CALLOUT',
      details: `Staff acknowledged Notice to Explain for incident #${reportId}`,
      targetId: reportId
    });

    showToast('Notice to Explain confirmed and receipt acknowledged.');
  };

  const submitStaffExplanation = (reportId, explanationText) => {
    const now = new Date().toISOString();
    setMisconductReports(prev => {
      const next = prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            explanationText,
            explanationSubmittedAt: now,
            status: 'EXPLANATION_SUBMITTED'
          };
        }
        return r;
      });
      try {
        localStorage.setItem('nkb_misconduct_reports', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    logSystemEvent({
      category: 'DISCIPLINE',
      action: 'SUBMIT_STAFF_EXPLANATION',
      details: `Staff submitted formal written explanation for incident #${reportId}`,
      targetId: reportId
    });

    showToast('Written explanation submitted to HR successfully.');
  };

  const resolveMisconductReport = (reportId, { sanction, notes, status }) => {
    const adminName = currentUser?.name || 'HR Management';
    const now = new Date().toISOString();

    setMisconductReports(prev => {
      const next = prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            resolutionSanction: sanction,
            resolutionNotes: notes,
            status: status || 'RESOLVED_WARNED',
            resolvedAt: now,
            resolvedBy: adminName
          };
        }
        return r;
      });
      try {
        localStorage.setItem('nkb_misconduct_reports', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    logSystemEvent({
      category: 'DISCIPLINE',
      action: 'RESOLVE_MISCONDUCT_REPORT',
      details: `HR resolved incident #${reportId}: ${sanction}. Status: ${status}`,
      targetId: reportId
    });

    showToast(`Misconduct report #${reportId} updated to ${status}.`);
  };

  const getSectionPermission = (sectionId, targetUser = currentUser) => {
    return getEffectiveSectionPermission(sectionId, targetUser, sectionAuthorizations, userAuthorizationOverrides);
  };

  const updateRoleSectionPermission = (role, sectionId, permission) => {
    setSectionAuthorizations(prev => {
      const updated = {
        ...prev,
        [role]: {
          ...(prev[role] || DEFAULT_ROLE_PERMISSIONS[role] || {}),
          [sectionId]: permission
        }
      };
      try {
        localStorage.setItem('nkb_hr_role_authorizations', JSON.stringify(updated));
      } catch (e) {}
      logSystemEvent({
        category: 'SECURITY',
        action: 'UPDATE_ROLE_PERMISSION',
        details: `Updated ${role} access for section ${sectionId} to ${permission}`,
        targetId: `${role}:${sectionId}`
      });
      logDiagnosticEvent('INFO', `Role authorization updated: ${role} -> ${sectionId}: ${permission}`);
      return updated;
    });
  };

  const updateUserSectionPermission = (userId, sectionId, permission) => {
    setUserAuthorizationOverrides(prev => {
      const userSettings = prev[userId] || {};
      const updated = {
        ...prev,
        [userId]: {
          ...userSettings,
          [sectionId]: permission
        }
      };
      try {
        localStorage.setItem('nkb_hr_user_authorization_overrides', JSON.stringify(updated));
      } catch (e) {}
      logSystemEvent({
        category: 'SECURITY',
        action: 'UPDATE_USER_OVERRIDE',
        details: `Updated user override for ${userId} on ${sectionId} to ${permission}`,
        targetId: `${userId}:${sectionId}`
      });
      logDiagnosticEvent('INFO', `Custom user override updated: User ${userId} -> ${sectionId}: ${permission}`);
      return updated;
    });
  };

  const clearUserSectionOverrides = (userId) => {
    setUserAuthorizationOverrides(prev => {
      const copy = { ...prev };
      delete copy[userId];
      try {
        localStorage.setItem('nkb_hr_user_authorization_overrides', JSON.stringify(copy));
      } catch (e) {}
      logSystemEvent({
        category: 'SECURITY',
        action: 'CLEAR_USER_OVERRIDE',
        details: `Cleared all custom permission overrides for staff ${userId}`,
        targetId: userId
      });
      logDiagnosticEvent('INFO', `Cleared custom overrides for User ${userId}`);
      return copy;
    });
  };

  const resetSectionAuthorizationsToDefault = () => {
    setSectionAuthorizations(DEFAULT_ROLE_PERMISSIONS);
    setUserAuthorizationOverrides({});
    try {
      localStorage.setItem('nkb_hr_role_authorizations', JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      localStorage.removeItem('nkb_hr_user_authorization_overrides');
    } catch (e) {}
    logSystemEvent({
      category: 'SECURITY',
      action: 'RESET_SECTION_AUTHORIZATIONS',
      details: 'IT Administrator reset all section authorizations to recommended factory defaults.'
    });
    logDiagnosticEvent('WARN', 'All section authorizations reset to recommended factory defaults.');
    showToast('Section authorizations successfully reset to factory defaults.');
  };

  const recordTransactionOverdrive = (overdriveData) => {
    const entry = {
      id: `OD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      adminId: currentUser?.employeeId || currentUser?.id || 'IT-ADMIN',
      adminName: currentUser?.name || 'Authorized IT Administrator',
      adminRole: currentUser?.role || 'it_admin',
      ...overdriveData
    };
    setOverdriveAuditLogs(prev => {
      const next = [entry, ...prev].slice(0, 500);
      try {
        localStorage.setItem('nkb_hr_overdrive_logs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    logSystemEvent({
      category: 'OVERDRIVE',
      action: overdriveData.action || 'TRANSACTION_OVERDRIVE',
      details: `[OVERDRIVE] ${overdriveData.summary || overdriveData.reason || 'Transaction modified by IT admin'}`,
      targetId: overdriveData.targetId || 'UNKNOWN'
    });
    logDiagnosticEvent('WARN', `Transaction overdrive executed: ${overdriveData.summary || overdriveData.action}`, entry);
    return entry;
  };

  const executeTransactionOverdrive = ({
    targetType,
    targetId,
    action,
    newStatus,
    newPaymentMethod,
    newStaffId,
    newStaffName,
    restoreStock = true,
    adjustCashDrawer = true,
    calibrationAmount = 0,
    calibrationType = 'CALIBRATION_ADJUST',
    reason = '',
    itNotes = ''
  }) => {
    const adminName = currentUser?.name || 'IT Administrator';

    let previousData = null;
    let summary = '';

    if (targetType === 'receipt') {
      const receipt = canteenReceipts.find(r => r.receiptNo === targetId || r.id === targetId);
      if (!receipt) throw new Error(`Receipt #${targetId} not found`);
      previousData = { ...receipt };

      if (action === 'FORCE_VOID') {
        adminVoidCanteenReceipt(receipt.receiptNo, {
          reason: reason || 'IT Emergency Force-Void Overdrive',
          restoreStock,
          adjustCashDrawer,
          voidedBy: adminName
        });
        summary = `Force-voided POS receipt #${receipt.receiptNo} (₱${Number(receipt.total || 0).toFixed(2)})`;
      } else if (action === 'FORCE_UNVOID') {
        adminUnvoidCanteenReceipt(receipt.receiptNo, {
          reason: reason || 'IT Force Un-Void Overdrive',
          deductStock: restoreStock,
          restoreCashDrawer: adjustCashDrawer,
          unvoidedBy: adminName
        });
        summary = `Reactivated / Unvoided POS receipt #${receipt.receiptNo}`;
      } else if (action === 'STATUS_OVERRIDE') {
        setCanteenReceipts(prev => prev.map(r => {
          if (r.receiptNo === targetId || r.id === targetId) {
            return { ...r, status: newStatus, itOverriddenAt: new Date().toISOString(), itOverriddenBy: adminName };
          }
          return r;
        }));
        summary = `Overrode status on receipt #${receipt.receiptNo} from ${receipt.status || 'COMPLETED'} to ${newStatus}`;
      } else if (action === 'PAYMENT_OVERRIDE') {
        setCanteenReceipts(prev => prev.map(r => {
          if (r.receiptNo === targetId || r.id === targetId) {
            return { ...r, paymentMethod: newPaymentMethod, itOverriddenAt: new Date().toISOString(), itOverriddenBy: adminName };
          }
          return r;
        }));
        summary = `Overrode payment method on receipt #${receipt.receiptNo} from ${receipt.paymentMethod || 'Cash'} to ${newPaymentMethod}`;
      } else if (action === 'REASSIGN_CUSTOMER') {
        setCanteenReceipts(prev => prev.map(r => {
          if (r.receiptNo === targetId || r.id === targetId) {
            return { ...r, staffId: newStaffId, customerName: newStaffName, itOverriddenAt: new Date().toISOString(), itOverriddenBy: adminName };
          }
          return r;
        }));
        summary = `Reassigned receipt #${receipt.receiptNo} to staff ${newStaffName} (${newStaffId})`;
      }
    } else if (targetType === 'drawer') {
      if (action === 'CALIBRATE_DRAWER') {
        const calTx = {
          id: `cal-${Date.now()}`,
          type: calibrationType,
          amount: Number(calibrationAmount) || 0,
          description: `IT Admin Drawer Calibration: ${reason || 'Manual Balance Realignment'}`,
          operator: adminName,
          timestamp: new Date().toISOString(),
          isOverdrive: true
        };
        setCanteenDrawer(prev => ({
          ...prev,
          currentBalance: Math.max(0, (prev?.currentBalance || 0) + (Number(calibrationAmount) || 0)),
          transactions: [calTx, ...(prev?.transactions || [])]
        }));
        summary = `Calibrated cash register drawer balance by ₱${Number(calibrationAmount).toFixed(2)}`;
      } else if (action === 'STATUS_OVERRIDE') {
        setCanteenDrawer(prev => ({
          ...prev,
          transactions: (prev?.transactions || []).map(t => t.id === targetId ? { ...t, status: newStatus, itOverridden: true } : t)
        }));
        summary = `Overrode status of drawer transaction #${targetId} to ${newStatus}`;
      }
    } else if (targetType === 'loan') {
      const loan = cashLoans.find(l => l.id === targetId);
      if (loan) {
        previousData = { ...loan };
        if (action === 'STATUS_OVERRIDE') {
          updateCashLoan(targetId, { status: newStatus, itOverriddenBy: adminName, itOverriddenAt: new Date().toISOString() });
          summary = `Overrode loan #${targetId} status to ${newStatus}`;
        }
      }
    } else if (targetType === 'gatePass') {
      const gp = canteenGatePasses.find(g => g.id === targetId || g.gatePassNo === targetId);
      if (gp) {
        previousData = { ...gp };
        if (action === 'STATUS_OVERRIDE') {
          updateGatePass(gp.id, { status: newStatus, itOverriddenBy: adminName, itOverriddenAt: new Date().toISOString() });
          summary = `Overrode grocery gate pass #${gp.gatePassNo} status to ${newStatus}`;
        }
      }
    } else if (targetType === 'po') {
      const po = personalPurchaseOrders.find(p => p.id === targetId || p.poNumber === targetId);
      if (po) {
        previousData = { ...po };
        if (action === 'STATUS_OVERRIDE') {
          updatePersonalPurchaseOrder(po.id, { status: newStatus, itOverriddenBy: adminName, itOverriddenAt: new Date().toISOString() });
          summary = `Overrode purchase order #${po.poNumber || po.id} status to ${newStatus}`;
        }
      }
    } else if (targetType === 'attendance') {
      const att = attendanceLogs.find(a => a.id === targetId);
      if (att) {
        previousData = { ...att };
        if (action === 'STATUS_OVERRIDE') {
          updateAttendanceRecord(targetId, { status: newStatus, itOverriddenBy: adminName, itOverriddenAt: new Date().toISOString() });
          summary = `Overrode attendance record #${targetId} status to ${newStatus}`;
        }
      }
    }

    const overdriveLog = recordTransactionOverdrive({
      action,
      targetType,
      targetId,
      summary: summary || `${action} on ${targetType} #${targetId}`,
      reason: reason || 'IT Administrative Override',
      itNotes,
      previousData,
      newStatus,
      newPaymentMethod,
      newStaffId,
      newStaffName
    });

    showToast(`Transaction overdrive executed: ${summary || action}`);
    return { success: true, overdriveLog };
  };

  // Offline Sync Listener
  useEffect(() => {
    const cleanup = initOfflineSyncListener((queue) => {
      setNotification({ message: `Reconnected to network! Syncing ${queue.length} offline record(s)...` });
      setTimeout(() => {
        clearOfflineQueue();
        setNotification({ message: `Offline factory records successfully synchronized!` });
        setTimeout(() => setNotification(null), 4000);
      }, 1200);
    });
    return cleanup;
  }, []);

  // Notifications Helpers
  const addInAppNotification = (notif) => {
    const entry = {
      id: `notif-${Date.now()}`,
      time: 'Just now',
      read: false,
      ...notif
    };
    setInAppNotifications(prev => [entry, ...prev].slice(0, 50));
  };

  const markNotificationAsRead = (id) => {
    setInAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setInAppNotifications([]);
  };

  // Leave & Overtime Handlers
  const fileLeaveRequest = (data) => {
    const staff = staffList.find(s => s.id === data.staffId);
    const isSick = (data.type || '').toLowerCase().includes('sick');
    const currentRemaining = isSick
      ? (staff?.sickLeaveRemaining !== undefined ? staff.sickLeaveRemaining : 5)
      : (staff?.vacationLeaveRemaining !== undefined ? staff.vacationLeaveRemaining : 5);
    const requestedDays = Number(data.days) || 1;
    const isExhausted = currentRemaining <= 0;
    const hasExcess = requestedDays > currentRemaining;

    const newReq = {
      id: `leave-${Date.now()}`,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      remarks: isExhausted
        ? 'Balance exhausted: Filed as Leave Without Pay (LWOP)'
        : hasExcess
        ? `Excess ${requestedDays - currentRemaining} day(s) filed as LWOP`
        : '',
      isUnpaid: isExhausted,
      hasExcessUnpaid: hasExcess,
      balanceAtFiling: currentRemaining,
      ...data
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    addInAppNotification({
      title: 'Leave Request Submitted',
      message: `Your ${data.type} request for ${data.days} day(s) was sent to HR for approval.${isExhausted ? ' (Notice: 0 balance, filed as LWOP)' : ''}`,
      type: isExhausted ? 'warning' : 'info'
    });
    logSystemEvent({
      category: 'STAFF',
      action: 'FILE_LEAVE',
      details: `Leave filed by ${data.staffName} (${data.type}, ${data.days} days, remaining balance: ${currentRemaining})`
    });
    return newReq;
  };

  const approveLeaveRequest = (id, remarks = '') => {
    let approvedReq = null;
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        approvedReq = req;
        const hrName = currentUser?.name ? `${currentUser.name} (HR)` : 'Genevieve Anne A. JURADO (HR)';
        const updated = {
          ...req,
          status: 'Approved',
          reviewedBy: hrName,
          reviewedAt: new Date().toISOString(),
          remarks: remarks || 'Approved by HR'
        };
        addInAppNotification({
          title: 'Leave Request Approved',
          message: `Your ${req.type} starting ${req.startDate} has been approved by HR.`,
          type: 'success'
        });
        logSystemEvent({
          category: 'STAFF',
          action: 'APPROVE_LEAVE',
          details: `Leave #${id} for ${req.staffName} approved by ${hrName}`
        });
        return updated;
      }
      return req;
    }));

    // Deduct days from employee remaining leave balances if not unpaid
    if (approvedReq && !approvedReq.isUnpaid) {
      const isSick = (approvedReq.type || '').toLowerCase().includes('sick');
      const daysToDeduct = Number(approvedReq.days) || 1;
      setStaffList(prev => prev.map(s => {
        if (s.id === approvedReq.staffId) {
          if (isSick) {
            const current = s.sickLeaveRemaining !== undefined ? s.sickLeaveRemaining : 5;
            const updated = Math.max(0, current - daysToDeduct);
            return { ...s, sickLeaveRemaining: updated };
          } else {
            const current = s.vacationLeaveRemaining !== undefined ? s.vacationLeaveRemaining : 5;
            const updated = Math.max(0, current - daysToDeduct);
            return { ...s, vacationLeaveRemaining: updated };
          }
        }
        return s;
      }));
    }
    showToast(`Leave request approved and employee leave balance updated.`);
  };

  const rejectLeaveRequest = (id, remarks = '') => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        const updated = {
          ...req,
          status: 'Rejected',
          reviewedBy: `${currentUser?.name || 'HR Manager'} (HR)`,
          reviewedAt: new Date().toISOString(),
          remarks: remarks || 'Request disapproved'
        };
        addInAppNotification({
          title: 'Leave Request Disapproved',
          message: `Your ${req.type} request was not approved. Remarks: ${remarks || 'Disapproved'}`,
          type: 'warning'
        });
        logSystemEvent({
          category: 'STAFF',
          action: 'REJECT_LEAVE',
          details: `Leave #${id} for ${req.staffName} rejected by ${currentUser?.name || 'HR'}`
        });
        return updated;
      }
      return req;
    }));
  };

  const fileOvertimeRequest = (data) => {
    const reasonText = (data.reason || data.task || '').trim();
    if (!reasonText || reasonText.length < 5) {
      showToast('HR Policy: An official reason/justification is required before requesting overtime.', 'error');
      return null;
    }
    const newReq = {
      id: `ot-${Date.now()}`,
      status: data.status || 'Pending',
      submittedAt: new Date().toISOString(),
      submittedTo: 'HR Management',
      reasonCategory: data.reasonCategory || 'Operational Task',
      reviewedBy: data.reviewedBy || null,
      reviewedAt: data.reviewedAt || null,
      remarks: data.remarks || '',
      ...data,
      reason: reasonText,
      task: reasonText
    };
    setOvertimeRequests(prev => [newReq, ...prev]);
    addInAppNotification({
      title: 'Overtime Request Submitted to HR',
      message: `${data.staffName} requested ${data.hours}h OT on ${data.date}. Reason: ${reasonText.substring(0, 50)}${reasonText.length > 50 ? '...' : ''}`,
      type: 'info'
    });
    logSystemEvent({
      category: 'ATTENDANCE',
      action: 'FILE_OVERTIME',
      details: `Overtime filed by ${data.staffName} (${data.hours} hrs on ${data.date}) for HR clearance. Reason: ${reasonText}`
    });
    showToast(`Overtime request for ${data.staffName} (${data.hours} hrs) submitted to HR.`);
    return newReq;
  };

  const approveOvertimeRequest = (id, remarks = '') => {
    setOvertimeRequests(prev => prev.map(req => {
      if (req.id === id) {
        const hrName = currentUser?.name ? `${currentUser.name} (HR)` : 'Genevieve Anne A. JURADO (HR)';
        const updated = {
          ...req,
          status: 'Approved',
          reviewedBy: hrName,
          reviewedAt: new Date().toISOString(),
          remarks: remarks || 'HR Approved with verified operational reason'
        };
        addInAppNotification({
          title: 'Overtime Approved by HR',
          message: `Your ${req.hours}h overtime on ${req.date} has been officially approved by HR and credited for payroll.`,
          type: 'success'
        });
        logSystemEvent({
          category: 'ATTENDANCE',
          action: 'APPROVE_OVERTIME',
          details: `Overtime #${id} for ${req.staffName} (${req.hours} hrs) approved by ${hrName}. Verified Reason: ${req.reason || req.task}`
        });
        showToast(`Overtime for ${req.staffName} approved by HR and authorized for payroll.`);
        return updated;
      }
      return req;
    }));
  };

  const rejectOvertimeRequest = (id, remarks = '') => {
    setOvertimeRequests(prev => prev.map(req => {
      if (req.id === id) {
        const hrName = currentUser?.name ? `${currentUser.name} (HR)` : 'HR Management';
        const updated = {
          ...req,
          status: 'Rejected',
          reviewedBy: hrName,
          reviewedAt: new Date().toISOString(),
          remarks: remarks || 'Overtime not authorized by HR'
        };
        addInAppNotification({
          title: 'Overtime Disapproved by HR',
          message: `Your ${req.hours}h overtime on ${req.date} was not approved by HR: ${updated.remarks}`,
          type: 'warning'
        });
        logSystemEvent({
          category: 'ATTENDANCE',
          action: 'REJECT_OVERTIME',
          details: `Overtime #${id} for ${req.staffName} rejected by ${hrName}. Remarks: ${updated.remarks}`
        });
        showToast(`Overtime request for ${req.staffName} disapproved.`, 'warning');
        return updated;
      }
      return req;
    }));
  };

  const batchApproveOvertimeRequests = (requestIds = [], batchRemarks = '') => {
    if (!Array.isArray(requestIds) || requestIds.length === 0) return;
    const hrName = currentUser?.name ? `${currentUser.name} (HR)` : 'Genevieve Anne A. JURADO (HR)';
    setOvertimeRequests(prev => prev.map(req => {
      if (requestIds.includes(req.id) && req.status === 'Pending') {
        return {
          ...req,
          status: 'Approved',
          reviewedBy: hrName,
          reviewedAt: new Date().toISOString(),
          remarks: batchRemarks || 'HR Batch Authorized with verified operational reason'
        };
      }
      return req;
    }));
    logSystemEvent({
      category: 'ATTENDANCE',
      action: 'BATCH_APPROVE_OVERTIME',
      details: `${requestIds.length} overtime request(s) batch authorized by ${hrName}`
    });
    showToast(`Batch approved ${requestIds.length} overtime request(s).`, 'success');
  };

  // Staff Digital Document Management
  const uploadStaffDocument = (staffId, doc) => {
    const newDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: doc.name || 'Document',
      size: doc.size || 0,
      type: doc.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      dataUrl: doc.dataUrl || ''
    };
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        const existingDocs = s.documents || [];
        return { ...s, documents: [newDoc, ...existingDocs] };
      }
      return s;
    }));
    showToast(`Document "${newDoc.name}" uploaded successfully.`, 'success');
    return newDoc;
  };

  const deleteStaffDocument = (staffId, docId) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        return { ...s, documents: (s.documents || []).filter(d => d.id !== docId) };
      }
      return s;
    }));
    showToast('Document removed.');
  };

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('nkb_hr_leave_requests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_overtime_requests', JSON.stringify(overtimeRequests));
  }, [overtimeRequests]);

  useEffect(() => {
    localStorage.setItem('nkb_notifications', JSON.stringify(inAppNotifications));
  }, [inAppNotifications]);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('nkb_hr_staff', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_attendance', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_coop_balances', JSON.stringify(coopBalances));
  }, [coopBalances]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_coop_ledger', JSON.stringify(coopLedger));
  }, [coopLedger]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_coop_withdrawals', JSON.stringify(coopWithdrawals));
  }, [coopWithdrawals]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_cash_loans', JSON.stringify(cashLoans));
  }, [cashLoans]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_canteen_drawer', JSON.stringify(canteenDrawer));
  }, [canteenDrawer]);

  useEffect(() => {
    localStorage.setItem('nkb_hr_cash_advances', JSON.stringify(cashAdvances));
  }, [cashAdvances]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_deductions_ledger', JSON.stringify(canteenDeductionsLedger));
  }, [canteenDeductionsLedger]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_ledger_balances', JSON.stringify(canteenLedgerBalances));
  }, [canteenLedgerBalances]);

  useEffect(() => {
    localStorage.setItem('nkb_replenishment_requests', JSON.stringify(replenishmentRequests));
  }, [replenishmentRequests]);

  useEffect(() => {
    localStorage.setItem('nkb_coop_audit_trail', JSON.stringify(coopAuditTrail));
  }, [coopAuditTrail]);


  useEffect(() => {
    localStorage.setItem('nkb_hr_payruns', JSON.stringify(payRuns));
  }, [payRuns]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_inventory', JSON.stringify(canteenInventory));
  }, [canteenInventory]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_categories', JSON.stringify(canteenCategories));
  }, [canteenCategories]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_sales_invoices', JSON.stringify(canteenSalesInvoices));
  }, [canteenSalesInvoices]);

  useEffect(() => {
    localStorage.setItem('nkb_mfg_products', JSON.stringify(manufacturingProducts));
  }, [manufacturingProducts]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_pos', JSON.stringify(personalPurchaseOrders));
  }, [personalPurchaseOrders]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_receipts', JSON.stringify(canteenReceipts));
  }, [canteenReceipts]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_gate_passes', JSON.stringify(canteenGatePasses));
  }, [canteenGatePasses]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_void_logs', JSON.stringify(canteenVoidLogs));
  }, [canteenVoidLogs]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_z_readings', JSON.stringify(canteenZReadings));
  }, [canteenZReadings]);

  useEffect(() => {
    localStorage.setItem('nkb_product_journeys', JSON.stringify(productJourneys));
  }, [productJourneys]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nkb_hr_current_user', JSON.stringify(currentUser));
      if (currentUser.role === 'employee' && activeTab !== 'employeePortal') {
        setActiveTab('employeePortal');
      } else if (currentUser.role === 'canteen' && activeTab !== 'canteenHub' && activeTab !== 'employeePortal') {
        setActiveTab('canteenHub');
      }
    } else {
      localStorage.removeItem('nkb_hr_current_user');
    }
  }, [currentUser, activeTab]);

  // Flash toast notification helper
  const showToast = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // Role helpers
  const isCEO = currentUser?.role === 'ceo';
  const isITAdmin = currentUser?.role === 'it_admin';
  const isSuperAdmin = isCEO || isITAdmin;
  const isHR = currentUser?.role === 'admin' || currentUser?.role === 'hr' || isSuperAdmin;
  const isCCTVAdmin = currentUser?.role === 'cctv_admin' || currentUser?.role === 'cctv' || currentUser?.role === 'security' || isSuperAdmin;
  const isAccounting = currentUser?.role === 'finance' || currentUser?.role === 'accounting' || isSuperAdmin;
  const isCanteen = currentUser?.role === 'canteen' || isSuperAdmin;
  const isEmployee = currentUser?.role === 'employee';
  const canManageMisconduct = isHR || isCCTVAdmin;

  // Auth Methods
  const loginStaff = (emailOrId, password) => {
    const clean = (emailOrId || '').trim().toLowerCase();
    const found = staffList.find(s => 
      (s.email && s.email.toLowerCase() === clean) ||
      (s.employeeId && s.employeeId.toLowerCase() === clean) ||
      (s.rawName && s.rawName.toLowerCase() === clean)
    );
    if (found) {
      if (password && found.pin && found.pin !== password) {
        return { success: false, message: 'Invalid security PIN or password.' };
      }
      const userObj = {
        staffId: found.id,
        name: formatStaffName(found),
        email: found.email,
        role: found.role || 'employee',
        employeeId: found.employeeId,
        avatar: found.avatar
      };
      setCurrentUser(userObj);
      if (found.role === 'employee') {
        setActiveTab('employeePortal');
      } else if (found.role === 'canteen') {
        setActiveTab('canteenHub');
      } else if (found.role === 'finance' || found.role === 'accounting') {
        setActiveTab('payroll');
      } else if (found.role === 'it_admin') {
        setActiveTab('itAdminHub');
      } else {
        setActiveTab('staff');
      }
      showToast(`Welcome, ${userObj.name}! Logged in as ${found.positionTitle || found.role}`);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Enter your registered work email or Employee ID (e.g. NKB052026-0001) and 8-digit PIN.' };
  };

  const loginBarcode = (barcodeOrId, pin) => {
    const found = resolveStaffFromScan(staffList, barcodeOrId);

    if (!found) {
      return { success: false, message: 'Barcode / Employee ID not recognized in Staff Masterlist.' };
    }

    if (pin && found.pin && found.pin !== pin) {
      return { success: false, message: 'Invalid security PIN.' };
    }

    const userRole = found.role || 'employee';
    const userObj = {
      staffId: found.id,
      name: formatStaffName(found),
      email: found.email,
      role: userRole,
      employeeId: found.employeeId,
      barcodeValue: found.barcodeValue,
      avatar: found.avatar
    };
    setCurrentUser(userObj);
    if (userRole === 'employee') {
      setActiveTab('employeePortal');
    } else if (userRole === 'canteen') {
      setActiveTab('canteenHub');
    } else if (userRole === 'finance' || userRole === 'accounting') {
      setActiveTab('payroll');
    } else if (userRole === 'it_admin') {
      setActiveTab('itAdminHub');
    } else {
      setActiveTab('staff');
    }
    showToast(`Authenticated badge for ${userObj.name}`);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Logged out successfully.');
  };

  // Staff CRUD
  const addStaff = (data) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can onboard staff and generate IDs.', 'error');
      return null;
    }
    const employmentType = data.employmentType || 'regular';
    const generatedId = data.employeeId || generateNextEmployeeId(staffList, employmentType, 2026);
    const barcodeVal = formatBarcodeValue(generatedId);
    const upperFirst = (data.firstName || '').trim().toUpperCase();
    const upperLast = (data.lastName || '').trim().toUpperCase();
    const raw = upperLast && upperFirst ? `${upperLast}, ${upperFirst}` : (data.rawName || upperLast || upperFirst).toUpperCase();
    
    const newStaff = {
      id: `staff-${Date.now()}`,
      employeeId: generatedId,
      barcodeValue: barcodeVal,
      status: 'active',
      employmentType,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${upperFirst}_${upperLast}`,
      pin: data.pin || '12345678',
      ...data,
      firstName: upperFirst,
      lastName: upperLast,
      rawName: raw
    };

    setStaffList(prev => [newStaff, ...prev]);
    showToast(`Added staff ${formatStaffName(newStaff)} with ID ${generatedId}`);
    return newStaff;
  };

  const updateStaff = (id, data) => {
    if (currentUser && !isHR && currentUser.staffId !== id) {
      showToast('Access Denied: Only HR Management can modify staff profiles.', 'error');
      return;
    }
    const cleanData = { ...data };
    if (cleanData.firstName !== undefined) cleanData.firstName = cleanData.firstName.trim().toUpperCase();
    if (cleanData.lastName !== undefined) cleanData.lastName = cleanData.lastName.trim().toUpperCase();
    if (cleanData.firstName && cleanData.lastName) {
      cleanData.rawName = `${cleanData.lastName}, ${cleanData.firstName}`;
    }
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        const merged = { ...s, ...cleanData };
        if (!cleanData.rawName) {
          merged.rawName = formatStaffName(merged);
        }
        return merged;
      }
      return s;
    }));
    setCurrentUser(prev => {
      if (prev && prev.staffId === id) {
        return {
          ...prev,
          ...cleanData,
          name: formatStaffName({ ...prev, ...cleanData }),
          avatar: cleanData.avatar !== undefined ? cleanData.avatar : prev.avatar
        };
      }
      return prev;
    });
    showToast('Staff profile updated successfully.');
  };

  const deleteStaff = (id) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can remove staff records.', 'error');
      return;
    }
    setStaffList(prev => prev.filter(s => s.id !== id));
    showToast('Staff record deleted.', 'info');
  };

  const toggleTeamLeader = (staffId) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can assign or revoke Team Leader roles.', 'error');
      return;
    }
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        const nextStatus = !s.isTeamLeader;
        showToast(`${formatStaffName(s)} is now ${nextStatus ? 'designated as Team Leader' : 'relieved of Team Leader role'}.`, 'success');
        logSystemEvent({
          category: 'HR_MANAGEMENT',
          action: 'TOGGLE_TEAM_LEADER',
          details: `${formatStaffName(s)} (${s.employeeId}) team leader status updated to ${nextStatus}`
        });
        return { ...s, isTeamLeader: nextStatus };
      }
      return s;
    }));
  };

  // Positions & Departments CRUD
  const addPosition = (posData) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can create job positions.', 'error');
      return null;
    }
    const newPos = { id: `pos-${Date.now()}`, ...posData };
    setPositions(prev => [...prev, newPos]);
    showToast(`Created position "${newPos.title}"`);
    return newPos;
  };

  const updatePosition = (id, posData) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can edit job positions.', 'error');
      return;
    }
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...posData } : p));
    showToast('Position updated successfully.');
  };

  const deletePosition = (id) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can delete job positions.', 'error');
      return;
    }
    setPositions(prev => prev.filter(p => p.id !== id));
    showToast('Position deleted.', 'info');
  };

  const addDepartment = (deptData) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can create departments.', 'error');
      return null;
    }
    const newDept = { id: `dept-${Date.now()}`, ...deptData };
    setDepartments(prev => [...prev, newDept]);
    showToast(`Created department "${newDept.name}"`);
    return newDept;
  };

  const updateDepartment = (id, deptData) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can edit departments.', 'error');
      return;
    }
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...deptData } : d));
    showToast('Department updated successfully.');
  };

  const deleteDepartment = (id) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can delete departments.', 'error');
      return;
    }
    setDepartments(prev => prev.filter(d => d.id !== id));
    showToast('Department deleted.', 'info');
  };

  // Attendance Clock In / Out
  const clockInOrOut = (barcodeOrId) => {
    const staff = resolveStaffFromScan(staffList, barcodeOrId);

    if (!staff) {
      return { success: false, message: 'Invalid barcode or ID. Staff record not found in Masterlist.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const existingLog = attendanceLogs.find(
      l => l.staffId === staff.id && l.date === todayStr
    );

    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (existingLog && !existingLog.timeOut) {
      // Clock Out
      const approvedOT = overtimeRequests.find(
        o => o.staffId === staff.id && o.date === todayStr && o.status === 'Approved'
      );
      const creditedOtHours = approvedOT ? (Number(approvedOT.hours) || 0) : 0;
      setAttendanceLogs(prev => prev.map(l => l.id === existingLog.id ? { 
        ...l, 
        timeOut: nowTimeStr,
        otHours: creditedOtHours,
        otApproved: Boolean(approvedOT),
        otReason: approvedOT ? (approvedOT.reason || approvedOT.task) : null
      } : l));
      const otMsg = approvedOT 
        ? ` (${approvedOT.hours}h OT credited · HR authorized)` 
        : ` (Reminder: Overtime requires prior HR request with reason)`;
      showToast(`Clock-Out registered for ${formatStaffName(staff)} at ${nowTimeStr}${otMsg}`);
      return { success: true, action: 'out', staff, time: nowTimeStr, otCredited: creditedOtHours };
    } else {
      // Clock In
      const newLog = {
        id: `att-${Date.now()}`,
        staffId: staff.id,
        date: todayStr,
        timeIn: nowTimeStr,
        timeOut: null,
        status: 'On-time',
        otHours: 0,
        lateMinutes: 0
      };
      setAttendanceLogs(prev => [newLog, ...prev]);
      showToast(`Clock-In registered for ${formatStaffName(staff)} at ${nowTimeStr}`);
      return { success: true, action: 'in', staff, time: nowTimeStr };
    }
  };

  // Coop Share Capital Operations
  const depositCoopShare = (staffId, amount, note = '') => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR Management can deposit cooperative share capital.', 'error');
      return { success: false };
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid deposit amount.', 'error');
      return { success: false };
    }

    setCoopBalances(prev => ({
      ...prev,
      [staffId]: (Number(prev[staffId]) || 0) + numAmount
    }));

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: `csl-${Date.now()}`,
      staffId,
      type: 'deposit',
      amount: numAmount,
      date: todayStr,
      note: note || 'Cooperative Share Capital Deposit'
    };
    setCoopLedger(prev => [newEntry, ...prev]);

    const member = staffList.find(s => s.id === staffId);
    showToast(`Deposited ₱${numAmount.toLocaleString()} to ${member?.firstName || 'staff'}'s Coop Share.`);
    return { success: true };
  };

  const requestCoopWithdrawal = (staffId, amount, reason) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Coop share withdrawals must be submitted by HR to Accounting.', 'error');
      return { success: false, message: 'Unauthorized' };
    }
    const numAmount = Number(amount);
    const currentBal = Number(coopBalances[staffId]) || 0;

    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid withdrawal amount.', 'error');
      return { success: false, message: 'Invalid amount.' };
    }

    if (numAmount > currentBal) {
      showToast(`Cannot withdraw ₱${numAmount.toLocaleString()}. Member balance is ₱${currentBal.toLocaleString()}.`, 'error');
      return { success: false, message: 'Amount exceeds available coop share capital.' };
    }

    const member = staffList.find(s => s.id === staffId);
    const newReq = {
      id: `cw-${Date.now()}`,
      staffId,
      amount: numAmount,
      reason: reason || 'Personal emergency',
      status: 'Pending Accounting Approval',
      requestedBy: currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'HR Management',
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null
    };

    setCoopWithdrawals(prev => [newReq, ...prev]);
    showToast(`Withdrawal request of ₱${numAmount.toLocaleString()} submitted to Accounting for approval.`);
    return { success: true };
  };

  const accountingApproveWithdrawal = (withdrawalId) => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can authorize share capital withdrawals.', 'error');
      return;
    }
    const req = coopWithdrawals.find(w => w.id === withdrawalId);
    if (!req) return;

    const currentBal = Number(coopBalances[req.staffId]) || 0;
    if (req.amount > currentBal) {
      showToast(`Cannot disburse: Insufficient member share capital (Balance: ₱${currentBal.toLocaleString()}).`, 'error');
      return;
    }

    // Deduct from coop balance
    setCoopBalances(prev => ({
      ...prev,
      [req.staffId]: Math.max(0, (Number(prev[req.staffId]) || 0) - req.amount)
    }));

    // Record in ledger
    const todayStr = new Date().toISOString().split('T')[0];
    setCoopLedger(prev => [
      {
        id: `csl-${Date.now()}`,
        staffId: req.staffId,
        type: 'withdrawal',
        amount: req.amount,
        date: todayStr,
        note: `Withdrawal Disbursed (Approved by Accounting: ${req.reason})`
      },
      ...prev
    ]);

    // Update withdrawal request
    setCoopWithdrawals(prev => prev.map(w => w.id === withdrawalId ? {
      ...w,
      status: 'Approved',
      approvedBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting',
      approvedAt: new Date().toISOString()
    } : w));

    showToast(`Accounting approved & disbursed ₱${req.amount.toLocaleString()} withdrawal.`);
  };

  const accountingRejectWithdrawal = (withdrawalId, reason = '') => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can reject share capital withdrawals.', 'error');
      return;
    }
    setCoopWithdrawals(prev => prev.map(w => w.id === withdrawalId ? {
      ...w,
      status: 'Rejected',
      rejectReason: reason || 'Disapproved by Accounting',
      approvedBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting',
      approvedAt: new Date().toISOString()
    } : w));

    showToast('Withdrawal request rejected by Accounting.', 'info');
  };

  // Configurable COOP Multiplier (Defaults to 3x)
  const updateCoopLoanMultiplier = (multiplier) => {
    const success = setCoopLoanMultiplier(multiplier);
    if (success) {
      setCoopLoanMultiplierState(Number(multiplier));
      showToast(`COOP Loan multiplier updated to ${multiplier}x.`, 'success');
    }
    return success;
  };

  // Retirement Rule & COOP Savings Settlement Workflow
  const retireCoopMember = ({ staffId, remarks = '' }) => {
    if (currentUser && !isHR && !isSuperAdmin) {
      showToast('Access Denied: Only HR or Super Admin can process member retirement.', 'error');
      return { success: false, message: 'Unauthorized' };
    }
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) {
      showToast('Staff member not found.', 'error');
      return { success: false, message: 'Staff not found' };
    }
    if (staff.isRetired || staff.status === 'retired') {
      showToast('This member is already marked as retired.', 'info');
      return { success: false, message: 'Already retired' };
    }

    const currentSavings = coopBalances[staffId] || 0;
    const retiredBy = currentUser ? `${currentUser.name} (${currentUser.role?.toUpperCase() || 'HR'})` : 'HR Management';

    const settlement = buildRetirementSettlement({
      member: staff,
      coopSavings: currentSavings,
      retiredBy,
      remarks
    });

    // 1. Mark staff member as retired (prevents new loans)
    setStaffList(prev => prev.map(s => s.id === staffId ? {
      ...s,
      status: 'retired',
      isRetired: true,
      retiredAt: new Date().toISOString(),
      retiredRemarks: remarks || 'Member retired from the company'
    } : s));

    // 2. Settle and withdraw accumulated COOP Savings
    setCoopBalances(prev => ({
      ...prev,
      [staffId]: 0
    }));

    // 3. Record official retirement withdrawal and ledger entry (preserves historical auditing)
    setCoopWithdrawals(prev => [settlement.withdrawalRecord, ...prev]);
    setCoopLedger(prev => [settlement.coopLedgerEntry, ...prev]);

    // 4. Record financial audit entry
    setCoopAuditTrail(prev => [settlement.auditLog, ...prev]);

    showToast(`Member ${staff.firstName} ${staff.lastName} marked as retired. COOP Savings of ₱${currentSavings.toLocaleString()} processed for retirement settlement.`, 'success');
    return { success: true, settlement };
  };

  // Cash Loan Operations (Max 36 Months, Maximum Loan = Savings * Multiplier)
  const requestCashLoan = ({ staffId, category, principal, termMonths, purpose }) => {
    const p = Number(principal);
    const t = Number(termMonths);
    const staff = staffList.find(s => s.id === staffId);
    const savings = coopBalances[staffId] || 0;

    // Strict Backend Business Rules Validation
    const validation = validateLoanApplication({
      member: staff,
      principal: p,
      termMonths: t,
      coopSavings: savings,
      multiplier: coopLoanMultiplier
    });

    if (!validation.valid) {
      showToast(validation.error, 'error');
      return { success: false, error: validation.error };
    }

    const catObj = LOAN_CATEGORIES.find(c => c.id === category) || { label: category, monthlyRate: 2 };
    const loanCalcs = computeLoanFinancials({
      principal: p,
      termMonths: t,
      category,
      interestRate: catObj.monthlyRate
    });

    const newLoan = {
      id: `loan-${Date.now()}`,
      loanId: `loan-${Date.now()}`,
      staffId,
      memberId: staffId,
      category,
      categoryLabel: catObj.label,
      principal: p,
      principalAmount: p,
      interestRate: loanCalcs.interestRate,
      interestAmount: loanCalcs.totalInterest,
      totalInterest: loanCalcs.totalInterest,
      totalPayable: loanCalcs.totalPayable,
      totalRepayable: loanCalcs.totalPayable,
      repaymentTerm: t,
      termMonths: t,
      monthlyAmortization: loanCalcs.monthlyAmortization,
      monthlyDeduction: loanCalcs.monthlyAmortization,
      cutoffAmortization: loanCalcs.cutoffAmortization,
      cutoffDeduction: loanCalcs.cutoffAmortization,
      loanDate: new Date().toISOString().split('T')[0],
      firstPaymentDate: loanCalcs.firstPaymentDate,
      maturityDate: loanCalcs.maturityDate,
      repaymentSchedule: loanCalcs.schedule,
      loanStatus: 'Pending HR',
      status: 'Pending HR',
      balanceRemaining: loanCalcs.totalPayable,
      outstandingBalance: loanCalcs.totalPayable,
      requestedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      purpose: purpose || `${catObj.label} Application`
    };

    setCashLoans(prev => [newLoan, ...prev]);

    // Financial audit trail log (Savings is NOT changed or deducted!)
    const auditLog = createFinancialAuditEntry({
      transactionId: `tx-${newLoan.id}`,
      memberId: staffId,
      transactionType: 'LOAN_APPLICATION_CREATED',
      amount: p,
      previousBalance: savings,
      newBalance: savings,
      referenceId: newLoan.id,
      createdBy: currentUser ? currentUser.name : (staff ? `${staff.firstName} ${staff.lastName}` : 'Member'),
      status: 'PENDING_APPROVAL',
      remarks: `Loan application encoded for ₱${p.toLocaleString()} (${t} mos term, max eligibility: ₱${validation.maxLoanable.toLocaleString()}).`
    });
    setCoopAuditTrail(prev => [auditLog, ...prev]);

    showToast(`Loan application for ₱${p.toLocaleString()} submitted for HR approval.`);
    return { success: true, loan: newLoan };
  };

  const approveCashLoan = (loanId) => {
    if (currentUser && !isHR) {
      showToast('Only HR or Super Admin can review and endorse loan applications.', 'error');
      return;
    }
    const loan = cashLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Step 1: HR approves and forwards to Accounting for disbursement
    setCashLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Pending Accounting Approval',
      loanStatus: 'Pending Accounting Approval',
      hrApprovedAt: new Date().toISOString(),
      hrApprovedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : l));

    showToast(`HR endorsed ₱${loan.principal.toLocaleString()} loan. Forwarded to Accounting for fund disbursement.`);
  };

  // Step 2: Accounting approves and disburses loan without decreasing member COOP Savings
  const accountingApproveLoan = (loanId) => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can authorize fund disbursements.', 'error');
      return;
    }
    const loan = cashLoans.find(l => l.id === loanId);
    if (!loan) return;

    const todayStr = new Date().toISOString().split('T')[0];
    setCoopLedger(prev => [
      {
        id: `csl-${Date.now()}`,
        staffId: loan.staffId,
        type: 'loan_funding',
        amount: loan.principal,
        date: todayStr,
        note: `Loan Principal Disbursed (${loan.categoryLabel || loan.category}) - Approved by Accounting. Total Payable: ₱${loan.totalPayable?.toLocaleString()}. Member COOP Savings remains intact.`
      },
      ...prev
    ]);

    setCashLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Approved',
      loanStatus: 'Approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting'
    } : l));

    // Notice: Member's COOP Savings (coopBalances) is NOT decreased!
    const staffSavings = coopBalances[loan.staffId] || 0;
    const auditLog = createFinancialAuditEntry({
      transactionId: `tx-approve-${loan.id}`,
      memberId: loan.staffId,
      transactionType: 'LOAN_DISBURSED',
      amount: loan.principal,
      previousBalance: staffSavings,
      newBalance: staffSavings,
      referenceId: loan.id,
      createdBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting',
      status: 'DISBURSED',
      remarks: `Loan #${loan.id} approved and disbursed. Outstanding balance: ₱${loan.balanceRemaining?.toLocaleString()}. Member COOP Savings remains ₱${staffSavings.toLocaleString()}.`
    });
    setCoopAuditTrail(prev => [auditLog, ...prev]);

    showToast(`Accounting approved & disbursed ₱${loan.principal.toLocaleString()} loan. Member COOP savings remains intact.`);
  };

  const accountingRejectLoan = (loanId, reason = '') => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can decline loan disbursements.', 'error');
      return;
    }
    setCashLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Rejected by Accounting',
      rejectReason: reason || 'Declined by Accounting',
      accountingRejectedAt: new Date().toISOString(),
      accountingRejectedBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting'
    } : l));

    showToast('Loan disbursement declined by Accounting.', 'info');
  };

  const rejectCashLoan = (loanId, reason = '') => {
    if (currentUser && !isHR) {
      showToast('Only HR or Super Admin can decline loan applications.', 'error');
      return;
    }
    setCashLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Rejected by HR',
      rejectReason: reason || 'Declined by HR',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : l));

    showToast('Loan application declined by HR.', 'info');
  };

  // Canteen Cash Advance Operations (Managed by Canteen under HR authority, 1.5% fee)
  const requestCashAdvance = ({ staffId, principal, termMonths = 1, reason = '' }) => {
    const p = Number(principal);
    const t = Number(termMonths) || 1;

    if (!p || p <= 0) {
      showToast('Please enter a valid cash advance amount.', 'error');
      return { success: false };
    }

    const feeRate = 1.5; // 1.5% fee
    const feeAmount = Math.round(p * 0.015);
    const totalRepayable = p + feeAmount;
    const cutoffDeduction = Math.round(totalRepayable / (t * 2));

    const newAdvance = {
      id: `ca-${Date.now()}`,
      staffId,
      principal: p,
      feeRate,
      feeAmount,
      totalRepayable,
      termMonths: t,
      cutoffDeduction,
      balanceRemaining: totalRepayable,
      status: 'Pending HR Approval',
      requestedAt: new Date().toISOString(),
      claimedAt: null,
      disbursedFrom: null,
      reason: reason || 'Cash advance request'
    };

    setCashAdvances(prev => [newAdvance, ...prev]);
    showToast(`Cash advance for ₱${p.toLocaleString()} requested! Submitted for HR approval.`);
    return { success: true };
  };

  const hrAcceptCashAdvance = (advanceId) => {
    if (currentUser && !isHR) {
      showToast('Only HR or Super Admin can review and accept cash advance requests.', 'error');
      return;
    }
    setCashAdvances(prev => prev.map(ca => ca.id === advanceId ? {
      ...ca,
      status: 'Pending Canteen Claim',
      hrApprovedAt: new Date().toISOString(),
      hrApprovedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : ca));
    showToast('Cash advance approved by HR! Ready for payout claim at Canteen under HR authority.');
  };

  const hrDeclineCashAdvance = (advanceId, reason = '') => {
    if (currentUser && !isHR) {
      showToast('Only HR or Super Admin can decline cash advance requests.', 'error');
      return;
    }
    setCashAdvances(prev => prev.map(ca => ca.id === advanceId ? {
      ...ca,
      status: 'Declined by HR',
      declineReason: reason || 'Declined by HR',
      declinedAt: new Date().toISOString(),
      declinedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : ca));
    showToast('Cash advance declined by HR.', 'info');
  };

  const claimCashAdvance = (advanceId) => {
    if (currentUser && !isHR && !isCanteen) {
      showToast('Access Denied: Canteen Cash Advances are disbursed at Canteen under HR authority.', 'error');
      return { success: false };
    }
    const advance = cashAdvances.find(ca => ca.id === advanceId);
    if (!advance) return;

    // Check Canteen Cash drawer
    if (canteenDrawer.balance < advance.principal) {
      showToast(`Canteen cash drawer insufficient! Balance is ₱${canteenDrawer.balance.toLocaleString()}. Replenish drawer first.`, 'error');
      return { success: false };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const staff = staffList.find(s => s.id === advance.staffId);

    // Deducted first from Canteen's Cash
    setCanteenDrawer(prev => ({
      balance: prev.balance - advance.principal,
      transactions: [
        {
          id: `cd-${Date.now()}`,
          type: 'disburse_advance',
          amount: advance.principal,
          date: todayStr,
          staffId: advance.staffId,
          note: `Cash Advance Payout: ₱${advance.principal.toLocaleString()} disbursed to ${staff?.firstName} ${staff?.lastName}`
        },
        ...prev.transactions
      ]
    }));

    // Log entering Coop Shares / HR records
    setCoopLedger(prev => [
      {
        id: `csl-${Date.now()}`,
        staffId: advance.staffId,
        type: 'canteen_advance_cleared',
        amount: advance.principal,
        date: todayStr,
        note: `Canteen Cash Advance claimed (1.5% fee ₱${advance.feeAmount} scheduled for salary deduction)`
      },
      ...prev
    ]);

    // Activate Cash Advance
    setCashAdvances(prev => prev.map(ca => ca.id === advanceId ? {
      ...ca,
      status: 'Active',
      claimedAt: new Date().toISOString(),
      disbursedFrom: 'Canteen Cash Drawer'
    } : ca));

    showToast(`Disbursed ₱${advance.principal.toLocaleString()} from Canteen Cash Drawer. 1.5% fee applied to salary.`);
    return { success: true };
  };

  // Petty Cash -> Drawer Replenishment API State Machine
  const updatePettyCashConfig = (newConfig) => {
    savePettyCashApiConfig(newConfig);
    setPettyCashConfigState(newConfig);
    showToast('Petty Cash API configuration saved.', 'success');
  };

  const requestDrawerReplenishment = async ({ drawerId = 'DRAWER-001', amount, reason = '' }) => {
    if (currentUser && !isHR && !isCanteen && !isSuperAdmin) {
      showToast('Access Denied: Only HR, Canteen, or Super Admin can submit replenishment requests.', 'error');
      return { success: false, message: 'Unauthorized' };
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid replenishment amount.', 'error');
      return { success: false, message: 'Invalid amount' };
    }

    const requestedBy = currentUser ? `${currentUser.name} (${currentUser.role?.toUpperCase() || 'STAFF'})` : 'Canteen Cashier';
    const reqModel = createReplenishmentRequestModel({
      drawerId,
      amount: numAmount,
      requestedBy,
      reason: reason || 'Canteen Cash Advance Drawer replenishment'
    });

    // Save request as PENDING. Drawer balance MUST NOT increase yet!
    setReplenishmentRequests(prev => [reqModel, ...prev]);

    // Dispatch to external Petty Cash API
    const apiResult = await sendPettyCashReplenishmentApi(reqModel);

    // Record financial audit trail
    const auditLog = createFinancialAuditEntry({
      transactionId: `tx-${reqModel.request_id}`,
      memberId: null,
      transactionType: 'DRAWER_REPLENISHMENT_REQUESTED',
      amount: numAmount,
      previousBalance: canteenDrawer.balance,
      newBalance: canteenDrawer.balance, // Balance remains unchanged until RELEASED!
      referenceId: reqModel.request_id,
      createdBy: requestedBy,
      status: 'PENDING',
      remarks: `Replenishment request #${reqModel.request_id} for ₱${numAmount.toLocaleString()} sent to Petty Cash API. Status: PENDING.`
    });
    setCoopAuditTrail(prev => [auditLog, ...prev]);

    showToast(`Replenishment Request #${reqModel.request_id} (₱${numAmount.toLocaleString()}) sent to Petty Cash API. Status: PENDING.`, 'info');
    return { success: true, request: reqModel, apiResult };
  };

  const approveDrawerReplenishment = (requestId, reviewerName = '') => {
    const actor = reviewerName || (currentUser ? `${currentUser.name} (Petty Cash)` : 'Petty Cash Officer');
    const nowIso = new Date().toISOString();

    setReplenishmentRequests(prev => prev.map(req => {
      if (req.request_id === requestId || req.id === requestId) {
        return {
          ...req,
          status: REPLENISHMENT_STATUSES.APPROVED,
          approvedAt: nowIso,
          approvedBy: actor,
          logs: [
            ...(req.logs || []),
            {
              status: REPLENISHMENT_STATUSES.APPROVED,
              timestamp: nowIso,
              actor,
              remarks: 'Replenishment request reviewed and approved in Petty Cash system. Ready for fund release.'
            }
          ]
        };
      }
      return req;
    }));

    showToast(`Replenishment Request #${requestId} approved in Petty Cash. Awaiting fund release confirmation.`);
    return { success: true };
  };

  const releaseDrawerReplenishment = (requestId, remarks = '') => {
    const target = replenishmentRequests.find(r => r.request_id === requestId || r.id === requestId);
    if (!target) {
      showToast('Replenishment request not found.', 'error');
      return { success: false, message: 'Request not found' };
    }

    // Idempotency protection: prevent duplicate replenishment
    if (target.status === REPLENISHMENT_STATUSES.RELEASED) {
      showToast('Idempotency Guard: Funds for this request have already been released and credited to the drawer.', 'info');
      return { success: false, message: 'Already released' };
    }

    const releasedBy = currentUser ? `${currentUser.name} (Petty Cash)` : 'Petty Cash Custodian';
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const amount = Number(target.amount) || 0;

    // 1. Update status to RELEASED
    setReplenishmentRequests(prev => prev.map(req => {
      if (req.request_id === requestId || req.id === requestId) {
        return {
          ...req,
          status: REPLENISHMENT_STATUSES.RELEASED,
          releasedAt: nowIso,
          releasedBy,
          logs: [
            ...(req.logs || []),
            {
              status: REPLENISHMENT_STATUSES.RELEASED,
              timestamp: nowIso,
              actor: releasedBy,
              remarks: remarks || 'Petty Cash confirmed fund release. COOP Canteen Drawer balance increased.'
            }
          ]
        };
      }
      return req;
    }));

    // 2. Increase COOP Drawer Balance ONLY upon Petty Cash release confirmation
    const prevDrawerBal = canteenDrawer.balance;
    const newDrawerBal = prevDrawerBal + amount;
    setCanteenDrawer(prev => ({
      balance: prev.balance + amount,
      transactions: [
        {
          id: `cd-${Date.now()}`,
          type: 'petty_cash_replenish',
          amount,
          date: todayStr,
          requestId: target.request_id,
          note: `Petty Cash Confirmed Release: ₱${amount.toLocaleString()} (Req #${target.request_id}) — ${remarks || 'Authorized Drawer Replenishment'}`
        },
        ...prev.transactions
      ]
    }));

    // 3. Record financial audit log
    const auditLog = createFinancialAuditEntry({
      transactionId: `tx-rel-${target.request_id}`,
      memberId: null,
      transactionType: 'DRAWER_REPLENISHED_FROM_PETTY_CASH',
      amount,
      previousBalance: prevDrawerBal,
      newBalance: newDrawerBal,
      referenceId: target.request_id,
      createdBy: releasedBy,
      status: 'RELEASED',
      remarks: `Petty Cash confirmed release for Req #${target.request_id}. Drawer balance updated from ₱${prevDrawerBal.toLocaleString()} to ₱${newDrawerBal.toLocaleString()}.`
    });
    setCoopAuditTrail(prev => [auditLog, ...prev]);

    showToast(`Petty Cash funds released! Canteen Cash Drawer increased by ₱${amount.toLocaleString()}.`, 'success');
    return { success: true, newBalance: newDrawerBal };
  };

  const rejectDrawerReplenishment = (requestId, reason = '') => {
    const actor = currentUser ? currentUser.name : 'Petty Cash Officer';
    const nowIso = new Date().toISOString();

    setReplenishmentRequests(prev => prev.map(req => {
      if (req.request_id === requestId || req.id === requestId) {
        return {
          ...req,
          status: REPLENISHMENT_STATUSES.REJECTED,
          rejectedAt: nowIso,
          rejectedBy: actor,
          rejectReason: reason || 'Declined by Petty Cash',
          logs: [
            ...(req.logs || []),
            {
              status: REPLENISHMENT_STATUSES.REJECTED,
              timestamp: nowIso,
              actor,
              remarks: reason || 'Replenishment request rejected.'
            }
          ]
        };
      }
      return req;
    }));

    showToast(`Replenishment Request #${requestId} rejected.`);
    return { success: true };
  };

  const cancelDrawerReplenishment = (requestId, reason = '') => {
    const actor = currentUser ? currentUser.name : 'Requester';
    const nowIso = new Date().toISOString();

    setReplenishmentRequests(prev => prev.map(req => {
      if (req.request_id === requestId || req.id === requestId) {
        return {
          ...req,
          status: REPLENISHMENT_STATUSES.CANCELLED,
          cancelledAt: nowIso,
          cancelledBy: actor,
          cancelReason: reason || 'Cancelled by user',
          logs: [
            ...(req.logs || []),
            {
              status: REPLENISHMENT_STATUSES.CANCELLED,
              timestamp: nowIso,
              actor,
              remarks: reason || 'Replenishment request cancelled.'
            }
          ]
        };
      }
      return req;
    }));

    showToast(`Replenishment Request #${requestId} cancelled.`);
    return { success: true };
  };

  // Legacy wrapper routed through Petty Cash API Request workflow (never directly creates money)
  const replenishCanteenCash = (amount, note = '') => {
    return requestDrawerReplenishment({
      drawerId: 'DRAWER-001',
      amount,
      reason: note || 'Canteen Cash Drawer Replenishment'
    });
  };


  // Payroll Calculation & Pay Runs with Loan & Cash Advance integration
  const createPayRun = (payRunData) => {
    if (currentUser && !isAccounting) {
      showToast('Access Denied: Only Accounting & Finance can create pay run batches.', 'error');
      return null;
    }
    const nextCode = `PR-2026-${(payRuns.length + 1).toString().padStart(2, '0')}`;
    const newRun = {
      id: `payrun-${Date.now()}`,
      code: nextCode,
      status: 'Draft',
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      items: [],
      ...payRunData
    };
    setPayRuns(prev => [newRun, ...prev]);
    showToast(`Created pay run batch ${newRun.code}`);
    return newRun;
  };

  const calculatePayRun = (payRunId) => {
    if (currentUser && !isAccounting) {
      showToast('Access Denied: Only Accounting & Finance can calculate pay run batches.', 'error');
      return;
    }
    const run = payRuns.find(r => r.id === payRunId);
    if (!run) return;

    let grossSum = 0;
    let dedSum = 0;
    let netSum = 0;

    const calculatedItems = staffList.filter(s => s.status === 'active').map(staff => {
      // HR Policy: Only HR-Approved overtime requests with valid reasons are credited to payroll
      const staffApprovedOT = overtimeRequests.filter(req => {
        if (req.staffId !== staff.id || req.status !== 'Approved') return false;
        if (run.periodStart && run.periodEnd && req.date) {
          return req.date >= run.periodStart && req.date <= run.periodEnd;
        }
        return true;
      });
      const approvedOtHours = staffApprovedOT.reduce((sum, req) => sum + (Number(req.hours) || 0), 0);
      const otReasons = staffApprovedOT.map(req => req.reason || req.task || 'Operational Task').filter(Boolean);

      // Attendance inputs
      const att = { 
        otHours: approvedOtHours, 
        lateMinutes: 0, 
        unpaidDays: 0,
        otReasons
      };

      // Active Loans for this staff
      const staffActiveLoans = cashLoans.filter(
        l => l.staffId === staff.id && l.status === 'Approved' && l.balanceRemaining > 0
      );
      const loanDeduction = staffActiveLoans.reduce(
        (sum, l) => sum + Math.min(l.cutoffDeduction, l.balanceRemaining),
        0
      );

      // Active Cash Advances for this staff
      const staffActiveCAs = cashAdvances.filter(
        ca => ca.staffId === staff.id && ca.status === 'Active' && ca.balanceRemaining > 0
      );
      const cashAdvanceDeduction = staffActiveCAs.reduce(
        (sum, ca) => sum + Math.min(ca.cutoffDeduction, ca.balanceRemaining),
        0
      );

      const comp = computeEmployeePayroll(staff, att, {
        loanDeduction,
        cashAdvanceDeduction
      }, {
        statutorySchedule: run.statutorySchedule || statutoryDeductionsSchedule || 'per_cutoff'
      });

      grossSum += comp.grossPay;
      dedSum += comp.totalDeductions;
      netSum += comp.netPay;

      return {
        staffId: staff.id,
        ...comp,
        approvedOtRequests: staffApprovedOT,
        otReasons
      };
    });

    setPayRuns(prev => prev.map(r => r.id === payRunId ? {
      ...r,
      status: 'Calculated',
      totalGross: grossSum,
      totalDeductions: dedSum,
      totalNet: netSum,
      items: calculatedItems,
      calculatedAt: new Date().toISOString()
    } : r));

    showToast(`Payroll calculated for ${calculatedItems.length} active staff members.`);
  };

  const approvePayRun = (payRunId) => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can sign off and approve pay runs.', 'error');
      return;
    }
    setPayRuns(prev => prev.map(r => r.id === payRunId ? {
      ...r,
      status: 'Approved',
      approvedBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting',
      approvedAt: new Date().toISOString()
    } : r));
    showToast('Pay run batch signed off and approved by Accounting!', 'success');
  };

  const disbursePayRun = (payRunId) => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can disburse pay runs and lock records.', 'error');
      return;
    }
    const run = payRuns.find(r => r.id === payRunId);

    // Reduce loan and cash advance balances if pay run items had deductions
    if (run && run.items && run.items.length > 0) {
      setCashLoans(prev => prev.map(l => {
        const item = run.items.find(i => i.staffId === l.staffId);
        if (item && item.loanDeduction > 0 && l.status === 'Approved' && l.balanceRemaining > 0) {
          const deduction = Math.min(l.cutoffDeduction, l.balanceRemaining);
          const newBal = Math.max(0, l.balanceRemaining - deduction);
          return {
            ...l,
            balanceRemaining: newBal,
            status: newBal === 0 ? 'Completed' : 'Approved'
          };
        }
        return l;
      }));

      setCashAdvances(prev => prev.map(ca => {
        const item = run.items.find(i => i.staffId === ca.staffId);
        if (item && item.cashAdvanceDeduction > 0 && ca.status === 'Active' && ca.balanceRemaining > 0) {
          const deduction = Math.min(ca.cutoffDeduction, ca.balanceRemaining);
          const newBal = Math.max(0, ca.balanceRemaining - deduction);
          return {
            ...ca,
            balanceRemaining: newBal,
            status: newBal === 0 ? 'Completed' : 'Active'
          };
        }
        return ca;
      }));
    }

    setPayRuns(prev => prev.map(r => r.id === payRunId ? {
      ...r,
      status: 'Disbursed',
      disbursedAt: new Date().toISOString()
    } : r));

    showToast('Funds disbursed! Bank payment file generated and payslips published.', 'success');
  };

  // Canteen Hub & Inventory Operations
  const addSupplyItem = (data) => {
    if (currentUser && !isCanteen && !isHR) {
      showToast('Access Denied: Only Canteen Management, HR, or Super Admin can encode supplies.', 'error');
      return { success: false };
    }
    const cleanName = (data.name || '').trim();
    if (!cleanName) {
      showToast('Product name is required.', 'error');
      return { success: false };
    }
    const qty = Math.max(0, Number(data.quantity) || 0);
    const reorder = Math.max(1, Number(data.reorderLevel) || 10);
    const finalBarcode = (data.barcode && data.barcode.trim()) 
      ? data.barcode.trim() 
      : `NKB-CAN-${Math.floor(100000 + Math.random() * 900000)}`;

    const newItem = {
      id: data.id || `prod-${Date.now()}`,
      barcode: finalBarcode,
      name: cleanName,
      company: (data.company || '').trim() || 'Direct Supplier',
      brand: (data.brand || '').trim() || 'General',
      category: data.category || 'General Supplies',
      costPrice: Number(data.costPrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      quantity: qty,
      size: (data.size || '').trim() || 'Standard',
      reorderLevel: reorder,
      stockStatus: qty > reorder ? 'In Stock' : (qty > 0 ? 'Low Stock' : 'Out of Stock'),
      unit: data.unit || 'Piece',
      pieceBarcode: (data.pieceBarcode || '').trim(),
      hasRetailPiece: Boolean(data.hasRetailPiece || (Number(data.retailPiecePrice) > 0) || Boolean(data.pieceBarcode)),
      retailPiecePrice: Number(data.retailPiecePrice) || 0,
      piecesPerPack: Math.max(0, parseInt(data.piecesPerPack, 10) || 0),
      hasMultiBuy: Boolean(data.hasMultiBuy || (Number(data.multiBuyQty) > 1 && Number(data.multiBuyPrice) > 0)),
      multiBuyQty: Math.max(0, parseInt(data.multiBuyQty, 10) || 0),
      multiBuyPrice: Math.max(0, parseFloat(data.multiBuyPrice) || 0),
      expirationDate: data.expirationDate || '',
      isLateEncoded: !!data.isLateEncoded,
      lateReason: data.isLateEncoded ? (data.lateReason || 'Delayed vendor delivery invoice encoding') : null,
      encodedAt: data.isLateEncoded && data.customDate ? new Date(data.customDate).toISOString() : new Date().toISOString(),
      notes: data.notes || (data.isLateEncoded ? '[Late Encoded Inbound Stock]' : 'Standard catalog entry')
    };

    setCanteenInventory(prev => [newItem, ...prev]);
    showToast(`Added "${newItem.name}" (${newItem.size}) with ${newItem.quantity} units to inventory.`);
    return { success: true, item: newItem };
  };

  const updateSupplyItem = (id, data) => {
    if (currentUser && !isCanteen && !isHR) {
      showToast('Access Denied: Only Canteen Management, HR, or Super Admin can update supplies.', 'error');
      return { success: false };
    }
    setCanteenInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nextQty = data.quantity !== undefined ? Math.max(0, Number(data.quantity)) : item.quantity;
      const nextReorder = data.reorderLevel !== undefined ? Number(data.reorderLevel) : (item.reorderLevel || 10);
      return {
        ...item,
        ...data,
        size: data.size !== undefined ? data.size : item.size,
        costPrice: data.costPrice !== undefined ? Number(data.costPrice) : item.costPrice,
        sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : item.sellingPrice,
        pieceBarcode: data.pieceBarcode !== undefined ? (data.pieceBarcode || '').trim() : (item.pieceBarcode || ''),
        hasRetailPiece: data.hasRetailPiece !== undefined ? Boolean(data.hasRetailPiece || (data.pieceBarcode && data.pieceBarcode.trim())) : item.hasRetailPiece,
        retailPiecePrice: data.retailPiecePrice !== undefined ? Number(data.retailPiecePrice) : item.retailPiecePrice,
        piecesPerPack: data.piecesPerPack !== undefined ? Math.max(0, parseInt(data.piecesPerPack, 10) || 0) : item.piecesPerPack,
        hasMultiBuy: data.hasMultiBuy !== undefined 
          ? Boolean(data.hasMultiBuy || (Number(data.multiBuyQty) > 1 && Number(data.multiBuyPrice) > 0)) 
          : (item.hasMultiBuy || (Number(item.multiBuyQty) > 1 && Number(item.multiBuyPrice) > 0)),
        multiBuyQty: data.multiBuyQty !== undefined ? Math.max(0, parseInt(data.multiBuyQty, 10) || 0) : (item.multiBuyQty || 0),
        multiBuyPrice: data.multiBuyPrice !== undefined ? Math.max(0, parseFloat(data.multiBuyPrice) || 0) : (item.multiBuyPrice || 0),
        quantity: nextQty,
        reorderLevel: nextReorder,
        stockStatus: nextQty > nextReorder ? 'In Stock' : (nextQty > 0 ? 'Low Stock' : 'Out of Stock')
      };
    }));
    showToast('Supply item inventory record updated.');
    return { success: true };
  };

  const deleteSupplyItem = (id) => {
    if (currentUser && !isCanteen && !isHR) {
      showToast('Access Denied: Only Canteen Management, HR, or Super Admin can remove supplies.', 'error');
      return { success: false };
    }
    setCanteenInventory(prev => prev.filter(item => item.id !== id));
    showToast('Supply item removed from canteen inventory.');
    return { success: true };
  };

  const clearAllCanteenInventory = () => {
    if (currentUser && !isCanteen && !isHR) {
      showToast('Access Denied: Only Canteen Management, HR, or Super Admin can clear inventory.', 'error');
      return { success: false };
    }
    setCanteenInventory([]);
    localStorage.removeItem('nkb_canteen_inventory');
    showToast('All supply items cleared from canteen inventory.');
    return { success: true };
  };

  const addCanteenCategory = (categoryName) => {
    if (!categoryName || !categoryName.trim()) {
      showToast('Category name cannot be blank.', 'error');
      return { success: false, message: 'Category name cannot be blank.' };
    }
    const clean = categoryName.trim();
    if (canteenCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      showToast(`Category "${clean}" already exists.`, 'info');
      return { success: true, category: clean };
    }
    const updated = [...canteenCategories, clean];
    setCanteenCategories(updated);
    showToast(`Added category "${clean}" to canteen supplies.`, 'success');
    return { success: true, category: clean };
  };

  const deleteCanteenCategory = (categoryName) => {
    if (!categoryName) return { success: false };
    const inUse = canteenInventory.some(it => (it.category || '').toLowerCase() === categoryName.toLowerCase());
    if (inUse) {
      showToast(`Cannot delete "${categoryName}" because existing supplies are assigned to it.`, 'error');
      return { success: false, message: 'Category in use by supplies' };
    }
    setCanteenCategories(prev => prev.filter(c => c.toLowerCase() !== categoryName.toLowerCase()));
    showToast(`Category "${categoryName}" removed from supply categories.`);
    return { success: true };
  };

  // Canteen Sales Invoice: Official Supplier Purchase & Delivery Inbound Processing
  // Path: sales invoice -> items -> details of item -> inventory
  const recordCanteenSalesInvoice = (invoiceData) => {
    if (currentUser && !isCanteen && !isITAdmin && !isSuperAdmin) {
      showToast('Access Denied: Only Canteen Management or Administrators can post Sales Invoices.', 'error');
      return { success: false, message: 'Access Denied' };
    }

    if (!invoiceData || !invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
      showToast('Cannot post sales invoice: No items entered.', 'error');
      return { success: false, message: 'No items in invoice' };
    }

    const normalizedInvoiceNo = (invoiceData.invoiceNumber || '').trim() || `SI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceId = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const processedItems = invoiceData.items.map((it, idx) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const cost = Number(it.costPrice) || 0;
      const selling = Number(it.sellingPrice) || 0;
      return {
        id: it.id || `item-${Date.now()}-${idx}`,
        name: (it.name || '').trim(),
        category: (it.category || 'General').trim(),
        brand: (it.brand || '').trim(),
        company: (it.company || invoiceData.supplier || '').trim(),
        size: (it.size || 'Standard').trim(),
        unit: (it.unit || 'Piece').trim(),
        quantity: qty,
        costPrice: cost,
        sellingPrice: selling,
        totalCost: Number((qty * cost).toFixed(2)),
        expirationDate: it.expirationDate || '',
        barcode: (it.barcode || '').trim()
      };
    });

    const totalAmount = processedItems.reduce((acc, it) => acc + it.totalCost, 0);
    const totalUnits = processedItems.reduce((acc, it) => acc + it.quantity, 0);

    const newInvoice = {
      id: invoiceId,
      invoiceNumber: normalizedInvoiceNo,
      supplier: (invoiceData.supplier || 'General Supplier').trim(),
      purchaseDate: invoiceData.purchaseDate || new Date().toISOString().split('T')[0],
      receivedDate: invoiceData.receivedDate || new Date().toISOString().split('T')[0],
      paymentMethod: invoiceData.paymentMethod || 'Company Fund',
      paymentStatus: invoiceData.paymentStatus || 'Paid',
      encodedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : (invoiceData.encodedBy || 'Glen Nobleza (Canteen Staff)'),
      notes: invoiceData.notes || '',
      totalAmount: Number(totalAmount.toFixed(2)),
      itemsCount: processedItems.length,
      totalUnits,
      status: 'POSTED_TO_INVENTORY',
      createdAt: new Date().toISOString(),
      items: processedItems
    };

    // Flow: sales invoice -> items -> details of item -> inventory
    setCanteenInventory(prev => {
      const updated = [...prev];
      processedItems.forEach(lineItem => {
        // Match existing inventory product by barcode (if non-empty) or by normalized name
        const matchIdx = updated.findIndex(inv => {
          if (lineItem.barcode && inv.barcode && inv.barcode.trim() === lineItem.barcode.trim()) {
            return true;
          }
          return inv.name && inv.name.toLowerCase().trim() === lineItem.name.toLowerCase().trim();
        });

        if (matchIdx >= 0) {
          const existing = updated[matchIdx];
          const newQty = Number(existing.quantity || 0) + Number(lineItem.quantity);
          updated[matchIdx] = {
            ...existing,
            quantity: newQty,
            costPrice: lineItem.costPrice > 0 ? lineItem.costPrice : existing.costPrice,
            sellingPrice: lineItem.sellingPrice > 0 ? lineItem.sellingPrice : existing.sellingPrice,
            expirationDate: lineItem.expirationDate || existing.expirationDate,
            size: lineItem.size || existing.size,
            unit: lineItem.unit || existing.unit,
            brand: lineItem.brand || existing.brand,
            company: lineItem.company || existing.company,
            category: lineItem.category || existing.category,
            barcode: lineItem.barcode || existing.barcode,
            lastInvoiceNo: normalizedInvoiceNo,
            lastReceivedAt: new Date().toISOString(),
            stockStatus: newQty > (existing.reorderLevel || 10) ? 'In Stock' : 'Low Stock'
          };
        } else {
          // New product entering inventory from Sales Invoice
          const newProductId = `PRD-SI-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          updated.unshift({
            id: newProductId,
            barcode: lineItem.barcode || '',
            name: lineItem.name,
            brand: lineItem.brand || '',
            company: lineItem.company || invoiceData.supplier || '',
            supplier: invoiceData.supplier || lineItem.company || '',
            category: lineItem.category || 'General',
            unit: lineItem.unit || 'Piece',
            size: lineItem.size || 'Standard',
            costPrice: lineItem.costPrice,
            sellingPrice: lineItem.sellingPrice,
            quantity: lineItem.quantity,
            reorderLevel: 10,
            stockStatus: lineItem.quantity > 10 ? 'In Stock' : 'Low Stock',
            expirationDate: lineItem.expirationDate || '',
            sourceInvoiceNo: normalizedInvoiceNo,
            lastInvoiceNo: normalizedInvoiceNo,
            isLateEncoded: false,
            encodedAt: new Date().toISOString(),
            notes: `Inbound from Sales Invoice ${normalizedInvoiceNo} (${invoiceData.supplier || 'Direct Supplier'})`
          });
        }
      });
      return updated;
    });

    // Auto-register new categories if any
    processedItems.forEach(it => {
      if (it.category && !canteenCategories.some(c => c.toLowerCase() === it.category.toLowerCase())) {
        setCanteenCategories(prev => [...prev, it.category]);
      }
    });

    // Prepend to sales invoices
    setCanteenSalesInvoices(prev => [newInvoice, ...prev]);

    showToast(`Sales Invoice ${normalizedInvoiceNo} posted successfully! ${totalUnits} units across ${processedItems.length} items added to Canteen Inventory.`, 'success');
    return { success: true, invoice: newInvoice };
  };

  const deleteCanteenSalesInvoice = (id, revertStock = false) => {
    if (currentUser && !isCanteen && !isITAdmin && !isSuperAdmin) {
      showToast('Access Denied: Only Canteen Management or Super Admin can delete sales invoices.', 'error');
      return { success: false };
    }

    const targetInvoice = canteenSalesInvoices.find(inv => inv.id === id);
    if (!targetInvoice) {
      showToast('Sales Invoice not found.', 'error');
      return { success: false };
    }

    if (revertStock && targetInvoice.items) {
      // Revert the added quantities from inventory
      setCanteenInventory(prev => {
        const updated = [...prev];
        targetInvoice.items.forEach(lineItem => {
          const matchIdx = updated.findIndex(inv => 
            (lineItem.barcode && inv.barcode && inv.barcode === lineItem.barcode) ||
            (inv.name && inv.name.toLowerCase().trim() === lineItem.name.toLowerCase().trim())
          );
          if (matchIdx >= 0) {
            const currentQty = Number(updated[matchIdx].quantity || 0);
            const revertedQty = Math.max(0, currentQty - Number(lineItem.quantity));
            updated[matchIdx] = {
              ...updated[matchIdx],
              quantity: revertedQty,
              stockStatus: revertedQty > (updated[matchIdx].reorderLevel || 10) ? 'In Stock' : 'Low Stock'
            };
          }
        });
        return updated;
      });
    }

    setCanteenSalesInvoices(prev => prev.filter(inv => inv.id !== id));
    showToast(`Sales Invoice ${targetInvoice.invoiceNumber} removed${revertStock ? ' and inbound quantities reverted' : ''}.`);
    return { success: true };
  };

  const verifySupervisorBarcode = (barcodeOrId) => {
    if (!barcodeOrId) return { valid: false, message: 'Barcode or Employee ID is required.' };
    const clean = cleanScanInput(barcodeOrId).toUpperCase();
    const supervisor = resolveStaffFromScan(staffList, clean);

    // 1. Canteen Administrator (Nannette MANUEL / NKB052026-0024)
    if (clean === 'NKB052026-0024' || clean === 'NKBCANTEEN' || clean.includes('MANUEL')) {
      const sup = supervisor || staffList.find(s => s.employeeId === 'NKB052026-0024') || {
        firstName: 'Nannette',
        lastName: 'MANUEL',
        employeeId: 'NKB052026-0024',
        positionTitle: 'Canteen Administrator & Manager'
      };
      return {
        valid: true,
        type: 'canteen_admin',
        supervisorName: `${sup.firstName} ${sup.lastName}`,
        badgeId: sup.employeeId,
        title: sup.positionTitle || 'Canteen Administrator'
      };
    }

    // 2. IT Admin (Carl Laurence B. PATAGNAN / NKB092026-0048 & Earl John DELOS SANTOS / NKB052026-0014)
    if (clean === 'NKB092026-0048' || clean.includes('PATAGNAN')) {
      const sup = supervisor || staffList.find(s => s.employeeId === 'NKB092026-0048') || {
        firstName: 'Carl Laurence B.',
        lastName: 'PATAGNAN',
        employeeId: 'NKB092026-0048',
        positionTitle: 'IT Systems Administrator'
      };
      return {
        valid: true,
        type: 'it_admin',
        supervisorName: `${sup.firstName} ${sup.lastName}`,
        badgeId: sup.employeeId,
        title: 'IT Systems Administrator (Super Admin)'
      };
    }

    if (clean === 'NKB052026-0014' || clean.includes('DELOS SANTOS')) {
      const sup = supervisor || staffList.find(s => s.employeeId === 'NKB052026-0014') || {
        firstName: 'Earl John',
        lastName: 'DELOS SANTOS',
        employeeId: 'NKB052026-0014',
        positionTitle: 'IT Systems Administrator'
      };
      return {
        valid: true,
        type: 'it_admin',
        supervisorName: `${sup.firstName} ${sup.lastName}`,
        badgeId: sup.employeeId,
        title: 'IT Systems Administrator (Super Admin)'
      };
    }

    // 3. CEO (Katherine A. BELLA / NKB052026-0001)
    if (clean === 'NKB052026-0001' || clean.includes('BELLA')) {
      const sup = supervisor || staffList.find(s => s.employeeId === 'NKB052026-0001') || {
        firstName: 'Katherine A.',
        lastName: 'BELLA',
        employeeId: 'NKB052026-0001',
        positionTitle: 'Chief Executive Officer (CEO)'
      };
      return {
        valid: true,
        type: 'ceo',
        supervisorName: `${sup.firstName} ${sup.lastName}`,
        badgeId: sup.employeeId,
        title: 'Chief Executive Officer (CEO)'
      };
    }

    // 4. Any staff with canteen or admin role matching barcode/ID
    if (supervisor && (supervisor.role === 'canteen' || supervisor.role === 'it_admin' || supervisor.role === 'ceo' || supervisor.role === 'admin')) {
      return {
        valid: true,
        type: supervisor.role,
        supervisorName: `${supervisor.firstName} ${supervisor.lastName}`,
        badgeId: supervisor.employeeId,
        title: supervisor.positionTitle || 'Authorized Administrator'
      };
    }

    return {
      valid: false,
      message: 'Access Denied: Scanned barcode does not belong to Canteen Admin (NKB052026-0024) or System Admin.'
    };
  };

  const voidActiveCartItemWithBarcode = ({ item, supervisorBarcode, pin, reason = 'Item voided at register' }) => {
    let supervisorInfo = null;
    if (supervisorBarcode) {
      const verification = verifySupervisorBarcode(supervisorBarcode);
      if (!verification.valid) {
        showToast(verification.message, 'error');
        return verification;
      }
      supervisorInfo = verification;
    } else if (pin === '12345678' && isCanteen) {
      supervisorInfo = {
        valid: true,
        supervisorName: currentUser?.name || 'Nannette MANUEL',
        badgeId: currentUser?.employeeId || 'NKB052026-0024',
        title: 'Canteen Administrator'
      };
    } else {
      showToast('Canteen Admin or IT Admin barcode scan required to authorize void.', 'error');
      return { valid: false, message: 'Barcode authorization required' };
    }

    // Log to void audit ledger
    const logEntry = {
      id: `void-item-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'LINE_ITEM_VOID',
      itemName: item.name,
      itemBarcode: item.barcode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.unitPrice * item.quantity,
      voidedBy: supervisorInfo.supervisorName,
      supervisorBadgeId: supervisorInfo.badgeId,
      reason: reason || 'Item voided at register'
    };

    setCanteenVoidLogs(prev => [logEntry, ...prev]);
    showToast(`Void Authorized: ${item.name} removed by ${supervisorInfo.supervisorName}`);
    return { success: true, supervisor: supervisorInfo, log: logEntry };
  };

  const voidActiveCartWithBarcode = ({ items, supervisorBarcode, pin, reason = 'Order cancelled at register' }) => {
    let supervisorInfo = null;
    if (supervisorBarcode) {
      const verification = verifySupervisorBarcode(supervisorBarcode);
      if (!verification.valid) {
        showToast(verification.message, 'error');
        return verification;
      }
      supervisorInfo = verification;
    } else if (pin === '12345678' && isCanteen) {
      supervisorInfo = {
        valid: true,
        supervisorName: currentUser?.name || 'Nannette MANUEL',
        badgeId: currentUser?.employeeId || 'NKB052026-0024',
        title: 'Canteen Administrator'
      };
    } else {
      showToast('Canteen Admin or IT Admin barcode scan required to authorize void.', 'error');
      return { valid: false, message: 'Barcode authorization required' };
    }

    const totalAmount = (items || []).reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const logEntry = {
      id: `void-cart-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'FULL_TRANSACTION_VOID',
      itemCount: items?.length || 0,
      items: items || [],
      amount: totalAmount,
      voidedBy: supervisorInfo.supervisorName,
      supervisorBadgeId: supervisorInfo.badgeId,
      reason: reason || 'Full transaction voided by supervisor'
    };

    setCanteenVoidLogs(prev => [logEntry, ...prev]);
    showToast(`Transaction Void Authorized by ${supervisorInfo.supervisorName}`);
    return { success: true, supervisor: supervisorInfo, log: logEntry };
  };

  const recordCanteenSale = ({
    customerName,
    customerType,
    staffId,
    items,
    orderType = 'Dine In', // 'Dine In' | 'Grocery'
    paymentMethod = 'Cash', // 'Cash' | 'Salary Deduction'
    isLateEncoded = false,
    claimedDate = null,
    lateReason = null
  }) => {
    if (currentUser && !isCanteen) {
      showToast('Access Denied: Only Canteen Staff or Super Admin can process POS sales.', 'error');
      return { success: false };
    }
    if (!items || items.length === 0) {
      showToast('Cart is empty. Scan barcodes or select items to checkout.', 'error');
      return { success: false };
    }

    if (paymentMethod === 'Salary Deduction' && !staffId) {
      showToast('Salary Deduction requires selecting an employee member.', 'error');
      return { success: false, message: 'Staff selection required' };
    }

    const staffObj = staffId ? staffList.find(s => s.id === staffId) : null;
    const receiptNo = `RCT-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const subtotal = items.reduce((acc, it) => {
      const lineTotal = it.subtotal !== undefined ? Number(it.subtotal) : (it.unitPrice * it.quantity);
      return acc + lineTotal;
    }, 0);
    const tax = 0;
    const total = subtotal;
    const totalSavings = items.reduce((acc, it) => acc + Number(it.promoSavings || 0), 0);

    // Actual system recording time
    const actualEncodedAt = new Date().toISOString();
    // If late encoded, effective transaction date is the customer claimed date
    const effectiveDate = (isLateEncoded && claimedDate)
      ? new Date(`${claimedDate}T12:00:00`).toISOString()
      : actualEncodedAt;

    // Deduct stock from inventory
    setCanteenInventory(prev => prev.map(inv => {
      const soldItem = items.find(it => 
        (it.barcode && it.barcode === inv.barcode) || 
        (it.pieceBarcode && inv.pieceBarcode && it.pieceBarcode === inv.pieceBarcode) ||
        (it.barcode && inv.pieceBarcode && it.barcode === inv.pieceBarcode) ||
        it.id === inv.id || 
        it.rawId === inv.id
      );
      if (soldItem) {
        const packDeduction = (soldItem.isRetailPiece && soldItem.piecesPerPack > 1)
          ? (soldItem.quantity / soldItem.piecesPerPack)
          : soldItem.quantity;
        return {
          ...inv,
          quantity: Math.max(0, parseFloat((inv.quantity - packDeduction).toFixed(2)))
        };
      }
      return inv;
    }));

    // If orderType is Grocery, generate an official Gate Pass (Half A4 printable)
    let gatePassRecord = null;
    if (orderType === 'Grocery') {
      const gatePassNo = `GP-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;
      gatePassRecord = {
        id: `gp-${Date.now()}`,
        gatePassNo,
        receiptNo,
        date: effectiveDate,
        actualEncodedAt,
        isLateEncoded: !!isLateEncoded,
        claimedDate: isLateEncoded && claimedDate ? claimedDate : null,
        lateReason: isLateEncoded ? (lateReason || 'Delayed POS encoding of claimed groceries') : null,
        staffId: staffId || null,
        staffName: staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : (customerName || 'Walk-in Guest'),
        employeeId: staffObj?.employeeId || 'WALK-IN',
        departmentName: departments.find(d => d.id === staffObj?.departmentId)?.name || 'General Operations',
        plantLocation: 'Main Plant Facility',
        items: items.map(it => ({
          barcode: it.barcode,
          pieceBarcode: it.pieceBarcode || '',
          name: it.name,
          quantity: it.quantity,
          unit: it.unit || 'pcs',
          unitPrice: it.unitPrice,
          total: it.subtotal !== undefined ? Number(it.subtotal) : (it.unitPrice * it.quantity),
          promoSavings: Number(it.promoSavings || 0),
          promoDescription: it.promoDescription || ''
        })),
        totalAmount: total,
        paymentMethod,
        orderType: 'Grocery',
        purpose: 'Canteen Grocery Pantry - Authorized Factory Gate Pass for Personal Household Supplies',
        issuedBy: currentUser ? currentUser.name : 'Canteen Cashier',
        gateStatus: 'Issued - Awaiting Gate Exit',
        clearedAt: null,
        securityGuard: null
      };
      setCanteenGatePasses(prev => [gatePassRecord, ...prev]);
    }

    const newReceipt = {
      receiptNo,
      date: effectiveDate,
      actualEncodedAt,
      isLateEncoded: !!isLateEncoded,
      claimedDate: isLateEncoded && claimedDate ? claimedDate : null,
      lateReason: isLateEncoded ? (lateReason || 'Delayed POS encoding of customer claim') : null,
      cashierName: currentUser ? currentUser.name : 'Canteen Cashier',
      customerType: customerType || 'Staff Member',
      customerName: staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : (customerName || 'Walk-in Customer'),
      staffId: staffId || null,
      orderType,
      paymentMethod,
      gatePassNo: gatePassRecord ? gatePassRecord.gatePassNo : null,
      salaryDeductionStatus: paymentMethod === 'Salary Deduction' ? 'Pending HR Bank Confirmation' : null,
      isDeductedToCoop: false,
      items: items.map(it => ({
        barcode: it.barcode,
        pieceBarcode: it.pieceBarcode || '',
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.subtotal !== undefined ? Number(it.subtotal) : (it.unitPrice * it.quantity),
        promoSavings: Number(it.promoSavings || 0),
        promoDescription: it.promoDescription || '',
        isRetailPiece: Boolean(it.isRetailPiece)
      })),
      subtotal,
      totalSavings,
      tax,
      total,
      status: 'COMPLETED' // Immutable records - receipts cannot be modified, only card-voided
    };

    setCanteenReceipts(prev => [newReceipt, ...prev]);

    // If Cash payment, record cash drawer transaction
    if (paymentMethod === 'Cash') {
      setCanteenDrawer(prev => ({
        balance: (prev?.balance || 0) + total,
        transactions: [
          {
            id: `ctx-${Date.now()}`,
            type: 'CASH_SALE',
            amount: total,
            receiptNo,
            description: `POS Cash Sale - Receipt #${receiptNo}`,
            timestamp: actualEncodedAt
          },
          ...(prev?.transactions || [])
        ]
      }));
    }

    // If Salary Deduction, automatically connect and record in Canteen Deduction Ledger
    if (paymentMethod === 'Salary Deduction' && staffId) {
      recordCanteenSalaryDeduction({
        salaryDeductionRef: receiptNo,
        staffId,
        employeeName: staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : (customerName || 'Staff Member'),
        amount: total,
        orderType,
        date: effectiveDate,
        createdBy: currentUser ? currentUser.name : 'POS System',
        remarks: `Auto-connected from Canteen Salary Deduction Receipt #${receiptNo} (${orderType})`
      });
    }

    showToast(
      gatePassRecord
        ? `Receipt #${receiptNo} & Gate Pass #${gatePassRecord.gatePassNo} generated! ₱${total.toLocaleString()} recorded.`
        : `Receipt #${receiptNo} generated! ₱${total.toLocaleString()} recorded.`
    );
    return { success: true, receipt: newReceipt, gatePass: gatePassRecord };
  };

  const voidTransactionWithCard = ({ receiptNo, cardId, authMethod, supervisorName, reason }) => {
    if (currentUser && !isCanteen) {
      showToast('Access Denied: Card-based voids require Canteen Supervisor or Super Admin credentials.', 'error');
      return { success: false, message: 'Unauthorized' };
    }

    const receipt = canteenReceipts.find(r => r.receiptNo === receiptNo);
    if (!receipt) {
      showToast('Receipt not found.', 'error');
      return { success: false, message: 'Receipt not found' };
    }

    if (receipt.status === 'VOIDED') {
      showToast('Receipt is already voided.', 'error');
      return { success: false, message: 'Already voided' };
    }

    if (!cardId || !reason) {
      showToast('Card badge scan/tap and reason required for supervisor void.', 'error');
      return { success: false, message: 'Missing card or reason' };
    }

    // 1. Mark receipt as VOIDED (records are immutable, no edits/deletions allowed)
    setCanteenReceipts(prev => prev.map(r => r.receiptNo === receiptNo ? {
      ...r,
      status: 'VOIDED',
      voidedAt: new Date().toISOString(),
      voidedBy: supervisorName || currentUser?.name || 'Supervisor'
    } : r));

    // 2. Return all items back into canteenInventory stock
    setCanteenInventory(prev => prev.map(inv => {
      const match = receipt.items.find(it => it.barcode === inv.barcode || it.name === inv.name);
      if (match) {
        return {
          ...inv,
          quantity: inv.quantity + match.quantity
        };
      }
      return inv;
    }));

    // If Cash payment, reverse cash from drawer
    if (receipt.paymentMethod === 'Cash') {
      setCanteenDrawer(prev => ({
        balance: Math.max(0, (prev?.balance || 0) - (receipt.total || 0)),
        transactions: [
          {
            id: `ctx-${Date.now()}`,
            type: 'VOID_REFUND',
            amount: -(receipt.total || 0),
            receiptNo,
            description: `POS Void Refund - Receipt #${receiptNo}`,
            timestamp: new Date().toISOString()
          },
          ...(prev?.transactions || [])
        ]
      }));
    }

    // If Salary Deduction, automatically reverse the Canteen Deduction Ledger record
    if (receipt.paymentMethod === 'Salary Deduction') {
      reverseCanteenSalaryDeduction(receiptNo, {
        reason: `POS Void Reversal: Receipt #${receiptNo} voided (${reason})`,
        reversedBy: supervisorName || (currentUser ? currentUser.name : 'Supervisor')
      });
    }

    // 3. Log into Canteen Void Audit Trail
    const voidLog = {
      id: `void-${Date.now()}`,
      receiptNo,
      voidedAt: new Date().toISOString(),
      voidedBy: supervisorName || (currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Authorized Supervisor'),
      authRole: currentUser?.role || 'canteen',
      authMethod: authMethod || 'RFID Badge Tap',
      cardBadgeId: cardId,
      reason,
      stockRestored: true,
      returnedItems: receipt.items.map(it => ({
        barcode: it.barcode,
        name: it.name,
        quantity: it.quantity
      }))
    };

    setCanteenVoidLogs(prev => [voidLog, ...prev]);
    showToast(`Receipt #${receiptNo} VOIDED via ${authMethod}. ${receipt.items.length} items returned to stock!`, 'success');
    return { success: true, voidLog };
  };

  // Finalize and archive daily POS Shift Z-Reading
  const saveZReading = (zReadingData) => {
    const nextCounterNumber = canteenZReadings.length + 1;
    const zCounter = zReadingData.zCounter || `Z-${new Date().getFullYear()}-${String(nextCounterNumber).padStart(4, '0')}`;
    const newEntry = {
      id: zReadingData.id || `z-${Date.now()}`,
      zCounter,
      createdAt: new Date().toISOString(),
      closedBy: currentUser?.name || 'Canteen Cashier',
      ...zReadingData
    };
    setCanteenZReadings(prev => [newEntry, ...prev]);
    showToast(`Z-Reading #${zCounter} shift closeout successfully finalized & archived!`);
    return newEntry;
  };

  // Canteen Deduction Automatic Connection Operations (Idempotent, Editable, Reversible)
  const recordCanteenSalaryDeduction = (deductionData) => {
    const ref = deductionData.salaryDeductionRef || deductionData.referenceId || deductionData.receiptNo || `SD-${Date.now()}`;
    const staffId = deductionData.staffId;
    const staffObj = staffList.find(s => s.id === staffId);
    const employeeName = deductionData.employeeName || (staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : 'Staff Member');

    const res = processCanteenSalaryDeduction({
      currentLedger: canteenDeductionsLedger,
      currentBalances: canteenLedgerBalances,
      deductionRecord: {
        ...deductionData,
        salaryDeductionRef: ref,
        employeeName
      },
      action: 'apply'
    });

    if (res.success) {
      setCanteenDeductionsLedger(res.ledger);
      setCanteenLedgerBalances(res.balances);

      const auditLog = createFinancialAuditEntry({
        transactionId: `tx-${res.entry.id}`,
        memberId: staffId,
        transactionType: 'CANTEEN_SALARY_DEDUCTION',
        amount: deductionData.amount,
        previousBalance: res.entry.previousBalance,
        newBalance: res.entry.newBalance,
        referenceId: ref,
        createdBy: deductionData.createdBy || (currentUser ? currentUser.name : 'Automatic System Sync'),
        status: 'APPLIED',
        remarks: `Canteen Deduction auto-recorded from Salary Deduction #${ref}: +₱${Number(deductionData.amount).toLocaleString()} for ${employeeName}.`
      });
      setCoopAuditTrail(prev => [auditLog, ...prev]);
    }
    return res;
  };

  const updateCanteenSalaryDeduction = (salaryDeductionRef, updateData) => {
    const res = processCanteenSalaryDeduction({
      currentLedger: canteenDeductionsLedger,
      currentBalances: canteenLedgerBalances,
      deductionRecord: {
        salaryDeductionRef,
        ...updateData,
        updatedBy: updateData.updatedBy || (currentUser ? currentUser.name : 'HR Admin')
      },
      action: 'update'
    });

    if (res.success) {
      setCanteenDeductionsLedger(res.ledger);
      setCanteenLedgerBalances(res.balances);

      const auditLog = createFinancialAuditEntry({
        transactionId: `tx-upd-${Date.now()}`,
        memberId: res.entry.staffId,
        transactionType: 'CANTEEN_SALARY_DEDUCTION_UPDATED',
        amount: res.entry.amount,
        previousBalance: res.entry.previousBalance,
        newBalance: res.entry.newBalance,
        referenceId: salaryDeductionRef,
        createdBy: updateData.updatedBy || (currentUser ? currentUser.name : 'HR Admin'),
        status: 'UPDATED',
        remarks: res.entry.remarks
      });
      setCoopAuditTrail(prev => [auditLog, ...prev]);
      showToast(`Canteen salary deduction #${salaryDeductionRef} updated to ₱${Number(res.entry.amount).toLocaleString()}.`, 'success');
    }
    return res;
  };

  const reverseCanteenSalaryDeduction = (salaryDeductionRef, reversalData = {}) => {
    const res = processCanteenSalaryDeduction({
      currentLedger: canteenDeductionsLedger,
      currentBalances: canteenLedgerBalances,
      deductionRecord: {
        salaryDeductionRef,
        reason: reversalData.reason || 'Salary deduction cancelled/reversed',
        reversedBy: reversalData.reversedBy || (currentUser ? currentUser.name : 'HR Admin')
      },
      action: 'reverse'
    });

    if (res.success) {
      setCanteenDeductionsLedger(res.ledger);
      setCanteenLedgerBalances(res.balances);

      const auditLog = createFinancialAuditEntry({
        transactionId: `tx-rev-${Date.now()}`,
        memberId: res.entry.staffId,
        transactionType: 'CANTEEN_SALARY_DEDUCTION_REVERSED',
        amount: res.entry.amount,
        previousBalance: res.entry.previousBalance,
        newBalance: res.entry.newBalance,
        referenceId: salaryDeductionRef,
        createdBy: reversalData.reversedBy || (currentUser ? currentUser.name : 'HR Admin'),
        status: 'REVERSED',
        remarks: res.entry.remarks
      });
      setCoopAuditTrail(prev => [auditLog, ...prev]);
      showToast(`Canteen salary deduction #${salaryDeductionRef} reversed.`, 'info');
    }
    return res;
  };

  // Confirm Canteen Salary Deduction by HR (connected to Canteen Deduction Ledger; NEVER reduces COOP Savings)
  const confirmCanteenSalaryDeduction = (receiptNo) => {
    if (currentUser && !isHR && !isSuperAdmin) {
      showToast('Access Denied: Only HR or Super Admin can confirm bank payroll deductions.', 'error');
      return { success: false, message: 'Unauthorized' };
    }

    const rct = canteenReceipts.find(r => r.receiptNo === receiptNo);
    if (!rct) {
      showToast('Receipt not found.', 'error');
      return { success: false, message: 'Receipt not found' };
    }

    if (rct.salaryDeductionStatus === 'Confirmed by HR - Applied to Canteen Deduction' || rct.salaryDeductionStatus === 'Confirmed by HR - Deducted to Bank & COOP') {
      showToast('This salary deduction is already confirmed.', 'info');
      return { success: false };
    }

    const staffId = rct.staffId;
    const staffMember = staffList.find(s => s.id === staffId);

    // 1. Mark receipt as Confirmed
    setCanteenReceipts(prev => prev.map(r => r.receiptNo === receiptNo ? {
      ...r,
      salaryDeductionStatus: 'Confirmed by HR - Applied to Canteen Deduction',
      isDeductedToCoop: true,
      hrConfirmedAt: new Date().toISOString(),
      hrConfirmedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : r));

    // 2. Ensure recorded in Canteen Deduction Ledger (idempotent if already auto-applied at POS)
    // Note: Does NOT deduct from coopBalances (COOP Savings remains separate!)
    if (staffId) {
      recordCanteenSalaryDeduction({
        salaryDeductionRef: rct.receiptNo,
        staffId,
        employeeName: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : rct.customerName,
        amount: rct.total,
        orderType: rct.orderType,
        createdBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management',
        remarks: `Canteen ${rct.orderType || 'Grocery/Meal'} Salary Deduction (Receipt #${rct.receiptNo}) confirmed by HR.`
      });
    }

    showToast(`Canteen salary deduction for ${staffMember?.firstName || 'Staff'} (₱${rct.total.toLocaleString()}) confirmed and recorded in Canteen Deduction ledger!`, 'success');
    return { success: true };
  };

  // Plant Gate Security Checkpoint: Clear Outbound Gate Pass
  const clearGatePass = (gatePassNo, securityGuardName = 'Gate Guard Officer (Post 1)') => {
    setCanteenGatePasses(prev => prev.map(gp => (gp.gatePassNo === gatePassNo || gp.id === gatePassNo) ? {
      ...gp,
      gateStatus: 'Cleared at Gate',
      status: 'Cleared at Gate',
      clearedAt: new Date().toISOString(),
      securityGuard: securityGuardName
    } : gp));
    showToast(`Gate Pass #${gatePassNo} cleared through security turnstile!`);
    return { success: true };
  };

  const createPersonalPurchaseOrder = ({ staffId, items, paymentMethod = 'coop', purpose = '' }) => {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) {
      showToast('Staff member not found.', 'error');
      return { success: false };
    }

    if (!items || items.length === 0) {
      showToast('Please select at least one item for your purchase order.', 'error');
      return { success: false };
    }

    const totalAmount = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const poNumber = `PO-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    // If payment method is COOP, check coop share capital balance and deduct
    if (paymentMethod === 'coop') {
      const currentCoopBal = coopBalances[staffId] || 0;
      if (currentCoopBal < totalAmount) {
        showToast(`Insufficient COOP Share Capital! Your balance is ₱${currentCoopBal.toLocaleString()}, but order is ₱${totalAmount.toLocaleString()}. Please choose Cash option.`, 'error');
        return { success: false, message: 'Insufficient COOP Share Capital' };
      }

      // Deduct from Coop balance
      setCoopBalances(prev => ({
        ...prev,
        [staffId]: (prev[staffId] || 0) - totalAmount
      }));

      // Add to Coop ledger
      const todayStr = new Date().toISOString().split('T')[0];
      setCoopLedger(prev => [
        {
          id: `csl-po-${Date.now()}`,
          staffId,
          type: 'canteen_po_deduction',
          amount: totalAmount,
          date: todayStr,
          note: `Personal PO #${poNumber} - Charged to Coop Share Capital (${items.map(i => `${i.quantity}x ${i.name}`).join(', ')})`
        },
        ...prev
      ]);
    }

    // Deduct quantity from manufacturing products stock
    setManufacturingProducts(prev => prev.map(mfg => {
      const ordered = items.find(it => it.id === mfg.id || it.sku === mfg.sku || it.barcode === mfg.barcode);
      if (ordered) {
        return {
          ...mfg,
          quantity: Math.max(0, mfg.quantity - ordered.quantity)
        };
      }
      return mfg;
    }));

    const newPO = {
      id: `po-${Date.now()}`,
      poNumber,
      staffId,
      staffName: formatStaffName(staff),
      departmentName: staff.departmentId,
      items: items.map(it => ({
        id: it.id,
        name: it.name,
        sku: it.sku || null,
        modelNumber: it.modelNumber || null,
        plantLocation: it.plantLocation || null,
        quantity: it.quantity,
        price: it.price,
        total: it.price * it.quantity
      })),
      totalAmount,
      paymentMethod, // 'cash' | 'coop'
      paymentStatus: paymentMethod === 'cash' ? 'Pending Accounting Collection' : 'Charged to COOP Share Capital',
      accountingReceivableStatus: paymentMethod === 'cash' ? 'Open - Receivable by Accounting' : null,
      coopDeductionStatus: paymentMethod === 'coop' ? 'Deducted from Share Capital' : null,
      status: 'Pending Dispatch / Fulfillment',
      purpose: purpose || 'Personal manufacturing equipment/goods purchase',
      requestedAt: new Date().toISOString(),
      fulfilledAt: null,
      fulfilledBy: null
    };

    setPersonalPurchaseOrders(prev => [newPO, ...prev]);
    showToast(`Purchase Order #${poNumber} (₱${totalAmount.toLocaleString()}) created via ${paymentMethod === 'cash' ? 'Cash (Accounting Receivable)' : 'COOP Share Capital'}!`);
    return { success: true, po: newPO };
  };

  const fulfillPurchaseOrder = (poId) => {
    if (currentUser && !isCanteen) {
      showToast('Only Canteen Staff or Super Admin can fulfill purchase orders.', 'error');
      return;
    }
    setPersonalPurchaseOrders(prev => prev.map(po => po.id === poId ? {
      ...po,
      status: 'Fulfilled',
      fulfilledAt: new Date().toISOString(),
      fulfilledBy: currentUser ? `${currentUser.name} (Canteen)` : 'Canteen Staff'
    } : po));
    showToast('Purchase Order marked as Fulfilled and handed over to employee!');
  };

  const advanceProductJourneyStage = (journeyId, extraInfo = null) => {
    const journey = productJourneys.find(j => j.id === journeyId);
    if (!journey) return;
    const nextIdx = Math.min(journey.currentStageIndex + 1, PRODUCT_JOURNEY_STAGES.length - 1);
    const nextStage = PRODUCT_JOURNEY_STAGES[nextIdx];

    const isClaimedStage = nextStage.id === 'employee_claimed';
    const isVoidStage = nextStage.id === 'voided_back';

    const claimantName = extraInfo?.name || journey.claimedBy || 'Merry Jean I. ALONZO';
    const claimantId = extraInfo?.employeeId || journey.claimedByEmployeeId || 'NKB052026-0003';
    const claimantDept = extraInfo?.department || journey.claimedByDepartment || 'Production';

    let procedureName = 'Ordered';
    let statusText = `At ${nextStage.name}: ${nextStage.description}`;
    let milestoneNote = `System agent advanced product journey to ${nextStage.name}`;

    if (nextStage.id === 'receiving_dock') {
      procedureName = 'Receiving Dock';
      statusText = `At Receiving Dock: Inbound dock scanning & quarantine inspection verified`;
      milestoneNote = `Dock inspection passed. Serial barcode and temperature verified`;
    } else if (nextStage.id === 'inventory') {
      procedureName = 'Inventory';
      statusText = `Stocked in Canteen Active Inventory Shelves`;
      milestoneNote = `Item transferred to Canteen Inventory Shelves and ready for POS issuance`;
    } else if (isClaimedStage) {
      procedureName = 'Claimed by Employee';
      statusText = `Claimed & Handed Over to ${claimantName} (${claimantId})`;
      milestoneNote = `Handover complete. Officially claimed and received by ${claimantName} (${claimantId}, ${claimantDept}). Digital ledger signed.`;
    } else if (isVoidStage) {
      procedureName = 'Voided Back to Inventory';
      const voidReason = extraInfo?.reason || journey.voidReason || 'Order voided/cancelled; product returned intact to active inventory';
      const voidedBy = extraInfo?.voidedBy || 'Authorized Supervisor';
      const voidBadge = extraInfo?.badgeId || 'MGR-CARD-001';
      statusText = `Voided Back to Inventory - Handled by ${voidedBy}`;
      milestoneNote = `Supervisor ${voidedBy} [${voidBadge}] approved void. Reason: ${voidReason}. Stock (+1) restored to active inventory.`;
    }

    const nowIso = new Date().toISOString();

    setProductJourneys(prev => prev.map(j => {
      if (j.id === journeyId) {
        return {
          ...j,
          currentStageIndex: nextIdx,
          currentProcedure: procedureName,
          lastProcedureDate: nowIso,
          claimedBy: isClaimedStage ? claimantName : j.claimedBy,
          claimedByEmployeeId: isClaimedStage ? claimantId : j.claimedByEmployeeId,
          claimedByDepartment: isClaimedStage ? claimantDept : j.claimedByDepartment,
          claimedAt: isClaimedStage ? nowIso : j.claimedAt,
          voidedBy: isVoidStage ? (extraInfo?.voidedBy || 'Authorized Supervisor') : j.voidedBy,
          voidCardBadgeId: isVoidStage ? (extraInfo?.badgeId || 'MGR-CARD-001') : j.voidCardBadgeId,
          voidReason: isVoidStage ? (extraInfo?.reason || 'Order voided and product returned') : j.voidReason,
          voidedAt: isVoidStage ? nowIso : j.voidedAt,
          stockRestored: isVoidStage ? true : j.stockRestored,
          status: statusText,
          updatedAt: nowIso,
          milestones: [
            ...j.milestones,
            {
              stageId: nextStage.id,
              stageName: nextStage.name,
              timestamp: nowIso,
              note: milestoneNote
            }
          ]
        };
      }
      return j;
    }));

    if (isVoidStage) {
      setCanteenInventory(prev => prev.map(inv => inv.barcode === journey.barcode ? { ...inv, quantity: inv.quantity + 1 } : inv));
      showToast(`Product ${journey.productName} voided back to inventory! Active stock restored.`);
    } else if (isClaimedStage) {
      showToast(`Product ${journey.productName} officially claimed by ${claimantName}!`);
    } else {
      showToast(`Product ${journey.productName} advanced to Stage ${nextIdx + 1}: ${nextStage.name}!`);
    }
  };

  const voidProductJourneyToInventory = (journeyId, voidDetails = null) => {
    const journey = productJourneys.find(j => j.id === journeyId);
    if (!journey) return;
    const voidIdx = PRODUCT_JOURNEY_STAGES.findIndex(s => s.id === 'voided_back');
    const nowIso = new Date().toISOString();
    const voidReason = voidDetails?.reason || 'Employee shift reassigned / cancelled order; returned to stock';
    const voidedBy = voidDetails?.voidedBy || (currentUser ? currentUser.name : 'Authorized Supervisor');
    const voidBadge = voidDetails?.badgeId || 'MGR-CARD-001';

    setProductJourneys(prev => prev.map(j => {
      if (j.id === journeyId) {
        return {
          ...j,
          currentStageIndex: voidIdx >= 0 ? voidIdx : 4,
          currentProcedure: 'Voided Back to Inventory',
          lastProcedureDate: nowIso,
          voidedBy,
          voidCardBadgeId: voidBadge,
          voidReason,
          voidedAt: nowIso,
          stockRestored: true,
          status: `Voided Back to Inventory - Approved by ${voidedBy}`,
          updatedAt: nowIso,
          milestones: [
            ...j.milestones,
            {
              stageId: 'voided_back',
              stageName: 'Voided Back to Inventory',
              timestamp: nowIso,
              note: `Supervisor ${voidedBy} [${voidBadge}] approved void. Reason: ${voidReason}. Stock (+1) restored to active inventory.`
            }
          ]
        };
      }
      return j;
    }));

    setCanteenInventory(prev => prev.map(inv => inv.barcode === journey.barcode ? { ...inv, quantity: inv.quantity + 1 } : inv));
    showToast(`Product ${journey.productName} voided back to inventory! Active stock restored.`);
  };

  const updateProductJourneyClaimant = (journeyId, claimantInfo) => {
    if (!claimantInfo) return;
    setProductJourneys(prev => prev.map(j => {
      if (j.id === journeyId) {
        const isClaimed = j.currentStageIndex === 3;
        return {
          ...j,
          claimedBy: claimantInfo.name,
          claimedByStaffId: claimantInfo.staffId || j.claimedByStaffId,
          claimedByEmployeeId: claimantInfo.employeeId || j.claimedByEmployeeId,
          claimedByDepartment: claimantInfo.department || j.claimedByDepartment,
          status: isClaimed 
            ? `Claimed & Handed Over to ${claimantInfo.name} (${claimantInfo.employeeId})`
            : j.status,
          updatedAt: new Date().toISOString()
        };
      }
      return j;
    }));
    showToast(`Claimant updated to ${claimantInfo.name} (${claimantInfo.employeeId})!`);
  };

  const resetProductJourney = (journeyId) => {
    const defaultData = INITIAL_PRODUCT_JOURNEYS.find(ij => ij.id === journeyId);
    const nowIso = new Date().toISOString();
    setProductJourneys(prev => prev.map(j => {
      if (j.id === journeyId) {
        if (defaultData) {
          return {
            ...defaultData,
            currentStageIndex: 0,
            currentProcedure: 'Ordered',
            lastProcedureDate: nowIso,
            status: `At Ordered: Purchase order placed with supplier`,
            updatedAt: nowIso,
            milestones: [
              { stageId: 'ordered', stageName: 'Ordered', timestamp: nowIso, note: 'Reset journey: Purchase order placed with supplier' }
            ]
          };
        }
        return {
          ...j,
          currentStageIndex: 0,
          currentProcedure: 'Ordered',
          lastProcedureDate: nowIso,
          status: 'At Ordered: Purchase order placed with supplier',
          updatedAt: nowIso,
          milestones: [
            { stageId: 'ordered', stageName: 'Ordered', timestamp: nowIso, note: 'Reset journey: Purchase order placed with supplier' }
          ]
        };
      }
      return j;
    }));
    showToast('Product Journey reset to Stage 1: Ordered!');
  };

  // ==========================================
  // IT ADMIN MASTER RECORD CONTROLS
  // Universal administrative edit/delete/restore overrides
  // ==========================================

  // 1. Canteen Receipts
  const updateCanteenReceipt = (receiptNo, updatedFields) => {
    setCanteenReceipts(prev => prev.map(r => {
      if (r.receiptNo === receiptNo || r.id === receiptNo) {
        return { ...r, ...updatedFields };
      }
      return r;
    }));
    showToast(`Receipt #${receiptNo} updated by IT Administrator.`);
    return { success: true };
  };

  const deleteCanteenReceipt = (receiptNo) => {
    setCanteenReceipts(prev => prev.filter(r => r.receiptNo !== receiptNo && r.id !== receiptNo));
    showToast(`Receipt #${receiptNo} permanently deleted.`);
    return { success: true };
  };

  const adminVoidCanteenReceipt = (receiptNo, { reason, restoreStock = true, adjustCashDrawer = true, voidedBy } = {}) => {
    const receipt = canteenReceipts.find(r => r.receiptNo === receiptNo || r.id === receiptNo);
    if (!receipt) {
      showToast('Receipt not found.', 'error');
      return { success: false, message: 'Receipt not found' };
    }

    if (receipt.status === 'VOIDED') {
      showToast('Receipt is already voided.', 'warning');
      return { success: false, message: 'Already voided' };
    }

    const operatorName = voidedBy || currentUser?.name || 'IT Administrator';
    const voidReason = reason || 'IT Admin Master Record Override';

    // 1. Mark receipt as VOIDED
    setCanteenReceipts(prev => prev.map(r => {
      if (r.receiptNo === receiptNo || r.id === receiptNo) {
        return {
          ...r,
          status: 'VOIDED',
          voidedAt: new Date().toISOString(),
          voidedBy: operatorName,
          voidReason
        };
      }
      return r;
    }));

    // 2. Restore stock into canteenInventory if restoreStock is true
    if (restoreStock && Array.isArray(receipt.items) && receipt.items.length > 0) {
      setCanteenInventory(prev => prev.map(inv => {
        const match = receipt.items.find(it => it.barcode === inv.barcode || it.id === inv.id || it.name === inv.name);
        if (match) {
          return {
            ...inv,
            quantity: (inv.quantity || 0) + (match.quantity || 1)
          };
        }
        return inv;
      }));
    }

    // 3. Deduct cash from drawer if Cash payment and adjustCashDrawer is true
    if (adjustCashDrawer && receipt.paymentMethod === 'Cash') {
      setCanteenDrawer(prev => ({
        balance: Math.max(0, (prev?.balance || 0) - (receipt.total || 0)),
        transactions: [
          {
            id: `ctx-${Date.now()}`,
            type: 'VOID_REFUND',
            amount: -(receipt.total || 0),
            receiptNo: receipt.receiptNo,
            description: `IT Master Void Refund - Receipt #${receipt.receiptNo} (${voidReason})`,
            timestamp: new Date().toISOString(),
            operator: operatorName
          },
          ...(prev?.transactions || [])
        ]
      }));
    }

    // 4. Log to Canteen Void Audit Trail
    const voidLog = {
      id: `void-${Date.now()}`,
      receiptNo: receipt.receiptNo,
      voidedAt: new Date().toISOString(),
      voidedBy: operatorName,
      authRole: currentUser?.role || 'it_admin',
      authMethod: 'IT Admin Master Override',
      reason: voidReason,
      stockRestored: !!restoreStock,
      cashAdjusted: adjustCashDrawer && receipt.paymentMethod === 'Cash',
      returnedItems: (receipt.items || []).map(it => ({
        barcode: it.barcode,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice
      })),
      totalAmount: receipt.total || 0,
      timestamp: new Date().toISOString()
    };

    setCanteenVoidLogs(prev => [voidLog, ...(prev || [])]);

    // 5. System Event Log
    if (logSystemEvent) {
      logSystemEvent('CANTEEN_RECEIPT_VOIDED', {
        receiptNo: receipt.receiptNo,
        customerName: receipt.customerName,
        total: receipt.total,
        reason: voidReason,
        voidedBy: operatorName
      });
    }

    showToast(`Receipt #${receipt.receiptNo} successfully VOIDED by IT Master Record.`);
    return { success: true, voidLog };
  };

  const adminUnvoidCanteenReceipt = (receiptNo, { reason, deductStock = true, restoreCashDrawer = true, unvoidedBy } = {}) => {
    const receipt = canteenReceipts.find(r => r.receiptNo === receiptNo || r.id === receiptNo);
    if (!receipt) {
      showToast('Receipt not found.', 'error');
      return { success: false, message: 'Receipt not found' };
    }

    if (receipt.status !== 'VOIDED') {
      showToast('Receipt is not voided.', 'warning');
      return { success: false, message: 'Not voided' };
    }

    const operatorName = unvoidedBy || currentUser?.name || 'IT Administrator';
    const unvoidReason = reason || 'IT Admin Master Record Reversal / Un-void';

    // 1. Restore receipt to COMPLETED
    setCanteenReceipts(prev => prev.map(r => {
      if (r.receiptNo === receiptNo || r.id === receiptNo) {
        const { voidedAt, voidedBy, voidReason, ...rest } = r;
        return {
          ...rest,
          status: 'COMPLETED',
          unvoidedAt: new Date().toISOString(),
          unvoidedBy: operatorName,
          unvoidReason
        };
      }
      return r;
    }));

    // 2. Deduct stock back from inventory
    if (deductStock && Array.isArray(receipt.items) && receipt.items.length > 0) {
      setCanteenInventory(prev => prev.map(inv => {
        const match = receipt.items.find(it => it.barcode === inv.barcode || it.id === inv.id || it.name === inv.name);
        if (match) {
          return {
            ...inv,
            quantity: Math.max(0, (inv.quantity || 0) - (match.quantity || 1))
          };
        }
        return inv;
      }));
    }

    // 3. Re-add cash to drawer if Cash
    if (restoreCashDrawer && receipt.paymentMethod === 'Cash') {
      setCanteenDrawer(prev => ({
        balance: (prev?.balance || 0) + (receipt.total || 0),
        transactions: [
          {
            id: `ctx-${Date.now()}`,
            type: 'VOID_REVERSAL',
            amount: receipt.total || 0,
            receiptNo: receipt.receiptNo,
            description: `IT Master Void Reversal (Un-void) - Receipt #${receipt.receiptNo}`,
            timestamp: new Date().toISOString(),
            operator: operatorName
          },
          ...(prev?.transactions || [])
        ]
      }));
    }

    // 4. System Event Log
    if (logSystemEvent) {
      logSystemEvent('CANTEEN_RECEIPT_UNVOIDED', {
        receiptNo: receipt.receiptNo,
        customerName: receipt.customerName,
        total: receipt.total,
        reason: unvoidReason,
        unvoidedBy: operatorName
      });
    }

    showToast(`Receipt #${receipt.receiptNo} re-activated (Un-voided) by IT Master Record.`);
    return { success: true };
  };

  // Canteen Cash Drawer Master Operations
  const addCanteenDrawerTransaction = (txData) => {
    const amount = Number(txData.amount) || 0;
    const newTx = {
      id: txData.id || `ctx-${Date.now()}`,
      type: txData.type || 'ADJUSTMENT',
      amount,
      receiptNo: txData.receiptNo || null,
      description: txData.description || 'Manual Drawer Transaction',
      timestamp: txData.timestamp || new Date().toISOString(),
      operator: txData.operator || currentUser?.name || 'IT Administrator'
    };

    setCanteenDrawer(prev => ({
      balance: Math.max(0, (prev?.balance || 0) + amount),
      transactions: [newTx, ...(prev?.transactions || [])]
    }));

    showToast(`Drawer transaction recorded (₱${amount.toLocaleString()}).`);
    return { success: true, transaction: newTx };
  };

  const updateCanteenDrawerTransaction = (txId, updatedFields) => {
    setCanteenDrawer(prev => {
      const oldTx = (prev?.transactions || []).find(t => t.id === txId);
      if (!oldTx) return prev;

      const oldAmount = Number(oldTx.amount) || 0;
      const newAmount = updatedFields.amount !== undefined ? Number(updatedFields.amount) : oldAmount;
      const diff = newAmount - oldAmount;

      const updatedTxs = (prev?.transactions || []).map(t => {
        if (t.id === txId) {
          return { ...t, ...updatedFields, amount: newAmount };
        }
        return t;
      });

      return {
        balance: Math.max(0, (prev?.balance || 0) + diff),
        transactions: updatedTxs
      };
    });

    showToast('Canteen drawer transaction updated.');
    return { success: true };
  };

  const deleteCanteenDrawerTransaction = (txId) => {
    setCanteenDrawer(prev => {
      const oldTx = (prev?.transactions || []).find(t => t.id === txId);
      const amount = oldTx ? (Number(oldTx.amount) || 0) : 0;
      return {
        balance: Math.max(0, (prev?.balance || 0) - amount),
        transactions: (prev?.transactions || []).filter(t => t.id !== txId)
      };
    });

    showToast('Canteen drawer transaction deleted.');
    return { success: true };
  };

  // 2. Personal Purchase Orders
  const updatePersonalPurchaseOrder = (orderId, updatedFields) => {
    setPersonalPurchaseOrders(prev => prev.map(po => {
      if (po.id === orderId || po.poNumber === orderId) {
        return { ...po, ...updatedFields };
      }
      return po;
    }));
    showToast(`Purchase Order record updated.`);
    return { success: true };
  };

  const deletePersonalPurchaseOrder = (orderId) => {
    setPersonalPurchaseOrders(prev => prev.filter(po => po.id !== orderId && po.poNumber !== orderId));
    showToast(`Purchase Order deleted.`);
    return { success: true };
  };

  // 3. Gate Passes
  const updateGatePass = (gatePassNo, updatedFields) => {
    setCanteenGatePasses(prev => prev.map(gp => {
      if (gp.gatePassNo === gatePassNo || gp.id === gatePassNo) {
        const updated = { ...gp, ...updatedFields };
        if (updated.gateStatus?.toLowerCase().includes('cleared') || updated.status?.toLowerCase().includes('cleared')) {
          updated.gateStatus = 'Cleared at Gate';
          updated.status = 'Cleared at Gate';
          if (!updated.clearedAt) updated.clearedAt = new Date().toISOString();
          if (!updated.securityGuard || updated.securityGuard === 'Awaiting Gate Post 1 Check') {
            updated.securityGuard = 'Officer R. Mendoza (Main Gate Post 1)';
          }
        }
        return updated;
      }
      return gp;
    }));
    showToast(`Gate Pass #${gatePassNo} updated.`);
    return { success: true };
  };

  const deleteGatePass = (gatePassNo) => {
    setCanteenGatePasses(prev => prev.filter(gp => gp.gatePassNo !== gatePassNo && gp.id !== gatePassNo));
    showToast(`Gate Pass #${gatePassNo} deleted.`);
    return { success: true };
  };

  // 4. Void Logs
  const updateVoidLog = (logId, updatedFields) => {
    setCanteenVoidLogs(prev => prev.map(vl => {
      if (vl.id === logId) {
        return { ...vl, ...updatedFields };
      }
      return vl;
    }));
    showToast(`Void audit record updated.`);
    return { success: true };
  };

  const deleteVoidLog = (logId) => {
    setCanteenVoidLogs(prev => prev.filter(vl => vl.id !== logId));
    showToast(`Void audit record deleted.`);
    return { success: true };
  };

  // 5. Attendance Records
  const updateAttendanceRecord = (recordId, updatedFields) => {
    setAttendanceLogs(prev => prev.map(att => {
      if (att.id === recordId) {
        return { ...att, ...updatedFields };
      }
      return att;
    }));
    showToast(`Attendance shift log updated.`);
    return { success: true };
  };

  const deleteAttendanceRecord = (recordId) => {
    setAttendanceLogs(prev => prev.filter(att => att.id !== recordId));
    showToast(`Attendance shift log deleted.`);
    return { success: true };
  };

  // 6. Cash Loans & Coop Ledger
  const updateCashLoan = (loanId, updatedFields) => {
    setCashLoans(prev => prev.map(cl => {
      if (cl.id === loanId || cl.loanCode === loanId) {
        return { ...cl, ...updatedFields };
      }
      return cl;
    }));
    showToast(`Loan record updated.`);
    return { success: true };
  };

  const deleteCashLoan = (loanId) => {
    setCashLoans(prev => prev.filter(cl => cl.id !== loanId && cl.loanCode !== loanId));
    showToast(`Loan record deleted.`);
    return { success: true };
  };

  const updateCoopLedgerEntry = (entryId, updatedFields) => {
    setCoopLedger(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, ...updatedFields };
      }
      return entry;
    }));
    showToast(`Coop ledger transaction updated.`);
    return { success: true };
  };

  const deleteCoopLedgerEntry = (entryId) => {
    setCoopLedger(prev => prev.filter(entry => entry.id !== entryId));
    showToast(`Coop ledger transaction deleted.`);
    return { success: true };
  };

  // 7. Full Database Backup & Restore
  const exportFullSystemBackup = () => {
    const backupData = {
      version: 'NKB_MASTER_V1',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'IT Admin',
      canteenReceipts,
      canteenZReadings,
      canteenInventory,
      canteenCategories,
      canteenSalesInvoices,
      personalPurchaseOrders,
      canteenGatePasses,
      canteenVoidLogs,
      attendanceLogs,
      cashLoans,
      coopBalances,
      coopLedger,
      coopWithdrawals,
      canteenDrawer,
      cashAdvances,
      canteenDeductionsLedger,
      canteenLedgerBalances,
      replenishmentRequests,
      coopAuditTrail,
      productJourneys,
      payRuns,
      manufacturingProducts,
      staffList,
      departments,
      positions
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NKB_System_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Full Enterprise Database Backup exported as JSON!', 'success');
  };

  const importFullSystemBackup = (backupJson) => {
    try {
      if (!backupJson || typeof backupJson !== 'object') {
        showToast('Invalid backup file format.', 'error');
        return { success: false, message: 'Invalid backup file' };
      }
      if (Array.isArray(backupJson.canteenReceipts)) setCanteenReceipts(backupJson.canteenReceipts);
      if (Array.isArray(backupJson.canteenZReadings)) setCanteenZReadings(backupJson.canteenZReadings);
      if (Array.isArray(backupJson.canteenInventory)) setCanteenInventory(backupJson.canteenInventory);
      if (Array.isArray(backupJson.canteenCategories)) setCanteenCategories(backupJson.canteenCategories);
      if (Array.isArray(backupJson.canteenSalesInvoices)) setCanteenSalesInvoices(backupJson.canteenSalesInvoices);
      if (Array.isArray(backupJson.personalPurchaseOrders)) setPersonalPurchaseOrders(backupJson.personalPurchaseOrders);
      if (Array.isArray(backupJson.canteenGatePasses)) setCanteenGatePasses(backupJson.canteenGatePasses);
      if (Array.isArray(backupJson.canteenVoidLogs)) setCanteenVoidLogs(backupJson.canteenVoidLogs);
      if (Array.isArray(backupJson.attendanceLogs)) setAttendanceLogs(backupJson.attendanceLogs);
      if (Array.isArray(backupJson.cashLoans)) setCashLoans(backupJson.cashLoans);
      if (backupJson.coopBalances && typeof backupJson.coopBalances === 'object') setCoopBalances(backupJson.coopBalances);
      if (Array.isArray(backupJson.coopLedger)) setCoopLedger(backupJson.coopLedger);
      if (Array.isArray(backupJson.coopWithdrawals)) setCoopWithdrawals(backupJson.coopWithdrawals);
      if (backupJson.canteenDrawer) setCanteenDrawer(backupJson.canteenDrawer);
      if (Array.isArray(backupJson.cashAdvances)) setCashAdvances(backupJson.cashAdvances);
      if (Array.isArray(backupJson.canteenDeductionsLedger)) setCanteenDeductionsLedger(backupJson.canteenDeductionsLedger);
      if (backupJson.canteenLedgerBalances && typeof backupJson.canteenLedgerBalances === 'object') setCanteenLedgerBalances(backupJson.canteenLedgerBalances);
      if (Array.isArray(backupJson.replenishmentRequests)) setReplenishmentRequests(backupJson.replenishmentRequests);
      if (Array.isArray(backupJson.coopAuditTrail)) setCoopAuditTrail(backupJson.coopAuditTrail);
      if (Array.isArray(backupJson.productJourneys)) setProductJourneys(backupJson.productJourneys);
      if (Array.isArray(backupJson.payRuns)) setPayRuns(backupJson.payRuns);
      if (Array.isArray(backupJson.manufacturingProducts)) setManufacturingProducts(backupJson.manufacturingProducts);
      showToast('Enterprise Database restored successfully from backup!', 'success');
      return { success: true };
    } catch (err) {
      showToast(`Database restore error: ${err.message}`, 'error');
      return { success: false, message: err.message };
    }
  };

  const resetTestTransactions = (options = { receipts: true, gatePasses: true, voidLogs: true, purchaseOrders: true }) => {
    if (options.receipts) setCanteenReceipts([]);
    if (options.gatePasses) setCanteenGatePasses([]);
    if (options.voidLogs) setCanteenVoidLogs([]);
    if (options.purchaseOrders) setPersonalPurchaseOrders([]);
    showToast('Selected transaction tables purged successfully.');
    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isCEO,
        isITAdmin,
        isSuperAdmin,
        isHR,
        isAccounting,
        isCanteen,
        isEmployee,
        loginStaff,
        loginBarcode,
        logout,
        staffList,
        addStaff,
        updateStaff,
        deleteStaff,
        departments,
        positions,
        addPosition,
        updatePosition,
        deletePosition,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        attendanceLogs,
        clockInOrOut,
        payRuns,
        createPayRun,
        calculatePayRun,
        approvePayRun,
        disbursePayRun,
        // Coop Share Capital & Business Rules
        coopBalances,
        coopLedger,
        coopWithdrawals,
        coopLoanMultiplier,
        updateCoopLoanMultiplier,
        retireCoopMember,
        depositCoopShare,
        requestCoopWithdrawal,
        accountingApproveWithdrawal,
        accountingRejectWithdrawal,
        // Cash Loans
        cashLoans,
        requestCashLoan,
        approveCashLoan,
        rejectCashLoan,
        accountingApproveLoan,
        accountingRejectLoan,
        hrAcceptCashLoan: approveCashLoan,
        hrDeclineCashLoan: rejectCashLoan,
        // Canteen Cash Advance & Cash Drawer + Petty Cash API
        canteenDrawer,
        cashAdvances,
        requestCashAdvance,
        hrAcceptCashAdvance,
        hrDeclineCashAdvance,
        claimCashAdvance,
        replenishCanteenCash,
        replenishmentRequests,
        pettyCashConfig,
        updatePettyCashConfig,
        requestDrawerReplenishment,
        approveDrawerReplenishment,
        releaseDrawerReplenishment,
        rejectDrawerReplenishment,
        cancelDrawerReplenishment,
        // Canteen Hub & Inventory
        canteenInventory,
        canteenCategories,
        canteenSalesInvoices,
        recordCanteenSalesInvoice,
        deleteCanteenSalesInvoice,
        addSupplyItem,
        updateSupplyItem,
        deleteSupplyItem,
        clearAllCanteenInventory,
        addCanteenCategory,
        deleteCanteenCategory,
        // Dual Monitor POS & Barcode Void Verification
        posDualDisplayState,
        broadcastPOSDisplayState,
        verifySupervisorBarcode,
        voidActiveCartItemWithBarcode,
        voidActiveCartWithBarcode,
        // NKB Manufacturing Products & Personal Purchase Orders
        manufacturingProducts,
        setManufacturingProducts,
        personalPurchaseOrders,
        createPersonalPurchaseOrder,
        fulfillPurchaseOrder,
        canteenReceipts,
        canteenZReadings,
        saveZReading,
        recordCanteenSale,
        voidTransactionWithCard,
        canteenVoidLogs,
        // Canteen Gate Passes & Salary Deductions
        canteenGatePasses,
        confirmCanteenSalaryDeduction,
        canteenDeductionsLedger,
        canteenLedgerBalances,
        recordCanteenSalaryDeduction,
        updateCanteenSalaryDeduction,
        reverseCanteenSalaryDeduction,
        // Financial Audit Trail
        coopAuditTrail,
        clearGatePass,
        productJourneys,
        advanceProductJourneyStage,
        voidProductJourneyToInventory,
        updateProductJourneyClaimant,
        resetProductJourney,
        // IT Admin Master Record Operations
        updateCanteenReceipt,
        deleteCanteenReceipt,
        adminVoidCanteenReceipt,
        adminUnvoidCanteenReceipt,
        addCanteenDrawerTransaction,
        updateCanteenDrawerTransaction,
        deleteCanteenDrawerTransaction,
        updatePersonalPurchaseOrder,
        deletePersonalPurchaseOrder,
        updateGatePass,
        deleteGatePass,
        updateVoidLog,
        deleteVoidLog,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        updateCashLoan,
        deleteCashLoan,
        updateCoopLedgerEntry,
        deleteCoopLedgerEntry,
        exportFullSystemBackup,
        importFullSystemBackup,
        resetTestTransactions,
        // Leave & Overtime Workflows
        leaveRequests,
        fileLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        overtimeRequests,
        fileOvertimeRequest,
        approveOvertimeRequest,
        rejectOvertimeRequest,
        batchApproveOvertimeRequests,
        uploadStaffDocument,
        deleteStaffDocument,
        // Team Leader & HR Staff Policy
        toggleTeamLeader,
        // Statutory Deductions Timing Schedule
        statutoryDeductionsSchedule,
        setStatutoryDeductionsSchedule,
        // Early Milestone Scanner
        scanStaffMilestones,
        // Notifications Center
        inAppNotifications,
        addInAppNotification,
        markNotificationAsRead,
        clearAllNotifications,
        // Theme Management
        theme,
        toggleTheme,
        // Security Audit Trail
        auditLogs,
        logSystemEvent,
        // IT Anomaly Detection & Evaluations
        anomalyEvaluations,
        recordAnomalyEvaluation,
        // IT Section Authorizations & Access Matrix
        sectionAuthorizations,
        userAuthorizationOverrides,
        getSectionPermission,
        updateRoleSectionPermission,
        updateUserSectionPermission,
        clearUserSectionOverrides,
        resetSectionAuthorizationsToDefault,
        // IT Transaction Overdrives
        overdriveAuditLogs,
        recordTransactionOverdrive,
        executeTransactionOverdrive,
        // IT Diagnostics & Telemetry
        itDiagnosticEvents,
        logDiagnosticEvent,
        // Global Digital ID Modal
        digitalIdStaff,
        isDigitalIdOpen,
        openDigitalId,
        closeDigitalId,
        // CCTV & Misconduct Incident Reporting
        isCCTVAdmin,
        canManageMisconduct,
        misconductReports,
        fileMisconductReport,
        acknowledgeMisconductNotice,
        submitStaffExplanation,
        resolveMisconductReport,
        // UI
        activeTab,
        setActiveTab,
        notification
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

