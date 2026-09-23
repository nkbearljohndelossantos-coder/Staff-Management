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
  INITIAL_MANUFACTURING_PRODUCTS,
  INITIAL_PERSONAL_PURCHASE_ORDERS,
  INITIAL_CANTEEN_RECEIPTS,
  INITIAL_CANTEEN_GATE_PASSES,
  INITIAL_CANTEEN_VOID_LOGS,
  INITIAL_PRODUCT_JOURNEYS,
  PRODUCT_JOURNEY_STAGES
} from '../data/mockData';
import { generateNextEmployeeId, formatBarcodeValue } from '../utils/idGenerator';
import { computeEmployeePayroll } from '../utils/payrollCalculations';

const AppContext = createContext(null);


const SCHEMA_VERSION = 'v6_nannette_canteen_admin';
if (typeof window !== 'undefined') {
  if (localStorage.getItem('nkb_schema_version') !== SCHEMA_VERSION) {
    [
      'nkb_hr_staff',
      'nkb_hr_departments',
      'nkb_hr_positions',
      'nkb_hr_attendance',
      'nkb_hr_coop_balances',
      'nkb_hr_coop_ledger',
      'nkb_hr_coop_withdrawals',
      'nkb_hr_cash_loans',
      'nkb_hr_canteen_drawer',
      'nkb_hr_cash_advances',
      'nkb_canteen_receipts',
      'nkb_canteen_gate_passes',
      'nkb_canteen_void_logs',
      'nkb_product_journeys',
      'nkb_hr_payruns',
      'nkb_hr_current_user',
      'nkb_canteen_pos'
    ].forEach(key => localStorage.removeItem(key));
    localStorage.setItem('nkb_schema_version', SCHEMA_VERSION);
  }
}

export function AppProvider({ children }) {
  // Load from localStorage or fallback to initial mock data, ensuring all 92 Masterlist staff exist
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_staff');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length === INITIAL_STAFF.length && parsed.every(s => s.baseSalary === 0)) {
          return parsed;
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

  // Canteen Inventory Supplies (With Size, Expiration, Company, Brand, Prices)
  const [canteenInventory, setCanteenInventory] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_inventory');
    let parsed = saved ? JSON.parse(saved) : [...INITIAL_CANTEEN_INVENTORY];
    INITIAL_CANTEEN_INVENTORY.forEach(init => {
      const idx = parsed.findIndex(i => i.id === init.id || i.barcode === init.barcode);
      if (idx === -1) {
        parsed.push(init);
      } else {
        parsed[idx] = { ...init, ...parsed[idx], size: parsed[idx].size || init.size };
      }
    });
    return parsed;
  });

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
    return saved ? JSON.parse(saved) : INITIAL_CANTEEN_RECEIPTS;
  });

  // Canteen Grocery Gate Passes (Half-A4 PDF security clearance for taking groceries out of plant)
  const [canteenGatePasses, setCanteenGatePasses] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_gate_passes');
    return saved ? JSON.parse(saved) : INITIAL_CANTEEN_GATE_PASSES;
  });

  // Canteen Void Logs (Card-based Barcode/QR/RFID audits)
  const [canteenVoidLogs, setCanteenVoidLogs] = useState(() => {
    const saved = localStorage.getItem('nkb_canteen_void_logs');
    return saved ? JSON.parse(saved) : INITIAL_CANTEEN_VOID_LOGS;
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
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('staff');
  const [notification, setNotification] = useState(null);

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
    localStorage.setItem('nkb_hr_payruns', JSON.stringify(payRuns));
  }, [payRuns]);

  useEffect(() => {
    localStorage.setItem('nkb_canteen_inventory', JSON.stringify(canteenInventory));
  }, [canteenInventory]);

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
  const isAccounting = currentUser?.role === 'finance' || currentUser?.role === 'accounting' || isSuperAdmin;
  const isCanteen = currentUser?.role === 'canteen' || isSuperAdmin;
  const isEmployee = currentUser?.role === 'employee';

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
        name: `${found.firstName} ${found.lastName}`,
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
      } else {
        setActiveTab('staff');
      }
      showToast(`Welcome, ${userObj.name}! Logged in as ${found.positionTitle || found.role}`);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Enter your registered work email or Employee ID (e.g. NKB052026-0001) and 8-digit PIN.' };
  };

  const loginBarcode = (barcodeOrId, pin) => {
    const cleanVal = barcodeOrId.trim().toUpperCase();
    const found = staffList.find(
      s => s.barcodeValue.toUpperCase() === cleanVal || s.employeeId.toUpperCase() === cleanVal
    );

    if (!found) {
      return { success: false, message: 'Barcode / Employee ID not recognized.' };
    }

    if (pin && found.pin && found.pin !== pin) {
      return { success: false, message: 'Invalid security PIN.' };
    }

    const userObj = {
      staffId: found.id,
      name: `${found.firstName} ${found.lastName}`,
      email: found.email,
      role: 'employee',
      employeeId: found.employeeId,
      barcodeValue: found.barcodeValue,
      avatar: found.avatar
    };
    setCurrentUser(userObj);
    setActiveTab('employeePortal');
    showToast(`Authenticated employee badge for ${userObj.name}`);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Logged out successfully.');
  };

  // Quick switch role - STRICTLY RESTRICTED TO SUPER ADMINS (CEO and IT Admin)
  const switchDemoRole = (role) => {
    // Non-superadmins cannot switch accounts or assume other roles!
    if (currentUser && !isSuperAdmin) {
      showToast('Access Denied: Only IT Admin or CEO can switch accounts or assume another role.', 'error');
      return { success: false, message: 'Access Denied' };
    }

    let sample;
    if (role === 'ceo') {
      sample = staffList.find(s => s.role === 'ceo') || staffList[0];
    } else if (role === 'it_admin') {
      sample = staffList.find(s => s.role === 'it_admin' || s.employeeId === 'NKB092026-0048');
    } else if (role === 'admin') {
      sample = staffList.find(s => s.role === 'admin' && s.role !== 'it_admin') || staffList[1];
    } else if (role === 'hr') {
      sample = staffList.find(s => s.role === 'hr') || staffList.find(s => s.departmentName && s.departmentName.includes('HR'));
    } else if (role === 'finance' || role === 'accounting') {
      sample = staffList.find(s => s.role === 'accounting') || staffList.find(s => s.departmentName && s.departmentName.includes('Accounting'));
    } else if (role === 'canteen') {
      sample = staffList.find(s => s.employeeId === 'NKB052026-0024') || staffList.find(s => s.role === 'canteen');
    } else {
      sample = staffList.find(s => s.role === 'employee') || staffList[2];
    }

    const resolvedRole = 
      role === 'ceo' ? 'ceo' :
      role === 'it_admin' ? 'it_admin' :
      role === 'admin' ? 'admin' :
      role === 'hr' ? 'hr' :
      (role === 'finance' || role === 'accounting') ? 'accounting' :
      role === 'canteen' ? 'canteen' : 'employee';

    const userObj = {
      staffId: sample?.id || 'emp-nkb052026-0001',
      name: sample ? `${sample.firstName} ${sample.lastName}` : 'Katherine A. BELLA',
      email: sample?.email || 'katherinea.bella@nkb.com',
      role: resolvedRole,
      employeeId: sample?.employeeId || 'NKB052026-0001',
      avatar: sample?.avatar
    };
    setCurrentUser(userObj);
    if (resolvedRole === 'employee') {
      setActiveTab('employeePortal');
    } else if (resolvedRole === 'canteen') {
      setActiveTab('canteenHub');
    } else if (resolvedRole === 'accounting') {
      setActiveTab('payroll');
    } else if (resolvedRole === 'hr' || resolvedRole === 'it_admin' || resolvedRole === 'admin' || resolvedRole === 'ceo') {
      setActiveTab('staff');
    }
    const roleLabel = 
      resolvedRole === 'ceo' ? `CEO (${userObj.name})` :
      resolvedRole === 'it_admin' ? `IT Admin (${userObj.name})` :
      resolvedRole === 'admin' ? `COO (${userObj.name})` :
      resolvedRole === 'hr' ? `HR Manager (${userObj.name})` :
      resolvedRole === 'accounting' ? `Accounting & Finance (${userObj.name})` :
      resolvedRole === 'canteen' ? `Canteen Admin (${userObj.name})` :
      `Employee ESS (${userObj.name})`;
    showToast(`Switched active account to: ${roleLabel}`);
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
    
    const newStaff = {
      id: `staff-${Date.now()}`,
      employeeId: generatedId,
      barcodeValue: barcodeVal,
      status: 'active',
      employmentType,
      avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}_${data.lastName}`,
      pin: data.pin || '12345678',
      ...data
    };

    setStaffList(prev => [newStaff, ...prev]);
    showToast(`Added staff ${newStaff.firstName} ${newStaff.lastName} with ID ${generatedId}`);
    return newStaff;
  };

  const updateStaff = (id, data) => {
    if (currentUser && !isHR && currentUser.staffId !== id) {
      showToast('Access Denied: Only HR Management can modify staff profiles.', 'error');
      return;
    }
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    setCurrentUser(prev => {
      if (prev && prev.staffId === id) {
        return {
          ...prev,
          ...data,
          name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : prev.name,
          avatar: data.avatar !== undefined ? data.avatar : prev.avatar
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
    const cleanVal = barcodeOrId.trim().toUpperCase();
    const staff = staffList.find(
      s => s.barcodeValue.toUpperCase() === cleanVal || s.employeeId.toUpperCase() === cleanVal
    );

    if (!staff) {
      return { success: false, message: 'Invalid barcode or ID. Staff record not found.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const existingLog = attendanceLogs.find(
      l => l.staffId === staff.id && l.date === todayStr
    );

    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (existingLog && !existingLog.timeOut) {
      // Clock Out
      setAttendanceLogs(prev => prev.map(l => l.id === existingLog.id ? { ...l, timeOut: nowTimeStr } : l));
      showToast(`Clock-Out registered for ${staff.firstName} ${staff.lastName} at ${nowTimeStr}`);
      return { success: true, action: 'out', staff, time: nowTimeStr };
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
      showToast(`Clock-In registered for ${staff.firstName} ${staff.lastName} at ${nowTimeStr}`);
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

  // Cash Loan Operations (2% cash/med/motor, 3% gadget/educ, 5% appliance)
  const requestCashLoan = ({ staffId, category, principal, termMonths, purpose }) => {
    const p = Number(principal);
    const t = Number(termMonths);

    if (!p || p <= 0 || !t || t <= 0) {
      showToast('Please enter a valid loan amount and repayment term.', 'error');
      return { success: false };
    }

    // Interest rate determination
    let rate = 2; // default 2% per month (cash, medical, motor)
    if (category === 'appliance') rate = 5;
    else if (category === 'gadget' || category === 'education') rate = 3;

    const totalInterest = Math.round(p * (rate / 100) * t);
    const totalRepayable = p + totalInterest;
    const monthlyDeduction = Math.round(totalRepayable / t);
    const cutoffDeduction = Math.round(totalRepayable / (t * 2)); // Semi-monthly cutoff

    const catObj = LOAN_CATEGORIES.find(c => c.id === category) || { label: category };

    const newLoan = {
      id: `loan-${Date.now()}`,
      staffId,
      category,
      categoryLabel: catObj.label,
      principal: p,
      interestRate: rate,
      termMonths: t,
      totalInterest,
      totalRepayable,
      monthlyDeduction,
      cutoffDeduction,
      balanceRemaining: totalRepayable,
      status: 'Pending HR',
      requestedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
      purpose: purpose || `${catObj.label} Application`
    };

    setCashLoans(prev => [newLoan, ...prev]);
    showToast(`Loan application for ₱${p.toLocaleString()} submitted for HR approval.`);
    return { success: true };
  };

  const approveCashLoan = (loanId) => {
    if (currentUser && !isHR) {
      showToast('Only HR or Super Admin can review and endorse loan applications.', 'error');
      return;
    }
    const loan = cashLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Step 1: HR approves and forwards to Accounting for withdrawal & disbursement
    setCashLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Pending Accounting Approval',
      hrApprovedAt: new Date().toISOString(),
      hrApprovedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : l));

    showToast(`HR endorsed ₱${loan.principal.toLocaleString()} loan. Forwarded to Accounting for fund withdrawal & disbursement.`);
  };

  // Step 2: Accounting approves and withdraws from Coop Shares
  const accountingApproveLoan = (loanId) => {
    if (currentUser && !isAccounting) {
      showToast('Only Accounting & Finance can authorize fund disbursements from Coop Share Capital.', 'error');
      return;
    }
    const loan = cashLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Withdrawn and funded from Coop Shares upon Accounting approval
    const todayStr = new Date().toISOString().split('T')[0];
    setCoopLedger(prev => [
      {
        id: `csl-${Date.now()}`,
        staffId: loan.staffId,
        type: 'loan_funding',
        amount: loan.principal,
        date: todayStr,
        note: `Loan Principal Withdrawn & Disbursed (${loan.categoryLabel}) - Approved by Accounting, Funded from Coop Share Capital`
      },
      ...prev
    ]);

    setCashLoans(prev => prev.map(l => l.id === loanId ? {
      ...l,
      status: 'Approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser ? `${currentUser.name} (Accounting)` : 'Finance & Accounting'
    } : l));

    showToast(`Accounting approved & disbursed ₱${loan.principal.toLocaleString()} loan. Funded via Coop Shares.`);
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

  const replenishCanteenCash = (amount, note = '') => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Canteen Cash Drawer is managed strictly under HR authority.', 'error');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('Please enter a valid replenishment amount.', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    setCanteenDrawer(prev => ({
      balance: prev.balance + numAmount,
      transactions: [
        {
          id: `cd-${Date.now()}`,
          type: 'replenish',
          amount: numAmount,
          date: todayStr,
          note: note || 'Canteen Cash Drawer Replenishment'
        },
        ...prev.transactions
      ]
    }));

    showToast(`Canteen Cash Drawer replenished with ₱${numAmount.toLocaleString()}.`);
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
      // Attendance inputs
      const att = { otHours: 0, lateMinutes: 0, unpaidDays: 0 };

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
      });

      grossSum += comp.grossPay;
      dedSum += comp.totalDeductions;
      netSum += comp.netPay;

      return {
        staffId: staff.id,
        ...comp
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
    if (currentUser && !isCanteen) {
      showToast('Access Denied: Only Canteen Management or Super Admin can encode supplies.', 'error');
      return { success: false };
    }
    const newItem = {
      id: `prod-${Date.now()}`,
      barcode: data.barcode || `480${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: data.name,
      company: data.company || 'Direct Supplier',
      brand: data.brand || 'General',
      category: data.category || 'General Supplies',
      costPrice: Number(data.costPrice) || 0,
      sellingPrice: Number(data.sellingPrice) || 0,
      quantity: Number(data.quantity) || 0,
      size: data.size || '',
      reorderLevel: Number(data.reorderLevel) || 10,
      unit: data.unit || 'Piece',
      expirationDate: data.expirationDate || '',
      isLateEncoded: !!data.isLateEncoded,
      lateReason: data.isLateEncoded ? (data.lateReason || 'Delayed vendor delivery invoice encoding') : null,
      encodedAt: data.isLateEncoded && data.customDate ? new Date(data.customDate).toISOString() : new Date().toISOString(),
      notes: data.notes || (data.isLateEncoded ? '[Late Encoded Inbound Stock]' : 'Standard inbound')
    };

    setCanteenInventory(prev => [newItem, ...prev]);
    showToast(`Added supply item "${newItem.name}" (${newItem.isLateEncoded ? 'Late Encoded' : 'Regular Entry'}).`);
    return { success: true, item: newItem };
  };

  const updateSupplyItem = (id, data) => {
    if (currentUser && !isCanteen) {
      showToast('Access Denied: Only Canteen Management or Super Admin can update supplies.', 'error');
      return { success: false };
    }
    setCanteenInventory(prev => prev.map(item => item.id === id ? {
      ...item,
      ...data,
      size: data.size !== undefined ? data.size : item.size,
      costPrice: data.costPrice !== undefined ? Number(data.costPrice) : item.costPrice,
      sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : item.sellingPrice,
      quantity: data.quantity !== undefined ? Number(data.quantity) : item.quantity
    } : item));
    showToast('Supply item inventory record updated.');
    return { success: true };
  };

  const recordCanteenSale = ({
    customerName,
    customerType,
    staffId,
    items,
    orderType = 'Dine In', // 'Dine In' | 'Grocery'
    paymentMethod = 'Cash' // 'Cash' | 'Salary Deduction'
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
    const subtotal = items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
    const tax = 0;
    const total = subtotal;

    // Deduct stock from inventory
    setCanteenInventory(prev => prev.map(inv => {
      const soldItem = items.find(it => it.barcode === inv.barcode || it.id === inv.id);
      if (soldItem) {
        return {
          ...inv,
          quantity: Math.max(0, inv.quantity - soldItem.quantity)
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
        date: new Date().toISOString(),
        staffId: staffId || null,
        staffName: staffObj ? `${staffObj.firstName} ${staffObj.lastName}` : (customerName || 'Walk-in Guest'),
        employeeId: staffObj?.employeeId || 'WALK-IN',
        departmentName: departments.find(d => d.id === staffObj?.departmentId)?.name || 'General Operations',
        plantLocation: 'Main Plant Facility',
        items: items.map(it => ({
          barcode: it.barcode,
          name: it.name,
          quantity: it.quantity,
          unit: it.unit || 'pcs',
          unitPrice: it.unitPrice,
          total: it.unitPrice * it.quantity
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
      date: new Date().toISOString(),
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
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.unitPrice * it.quantity
      })),
      subtotal,
      tax,
      total,
      status: 'COMPLETED' // Immutable records - receipts cannot be modified, only card-voided
    };

    setCanteenReceipts(prev => [newReceipt, ...prev]);
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

  // Confirm Canteen Salary Deduction by HR (deducted to bank payroll, then charged to COOP budget)
  const confirmCanteenSalaryDeduction = (receiptNo) => {
    if (currentUser && !isHR) {
      showToast('Access Denied: Only HR or Super Admin or Super Admin can confirm bank payroll deductions.', 'error');
      return { success: false, message: 'Unauthorized' };
    }

    const rct = canteenReceipts.find(r => r.receiptNo === receiptNo);
    if (!rct) {
      showToast('Receipt not found.', 'error');
      return { success: false, message: 'Receipt not found' };
    }

    if (rct.salaryDeductionStatus === 'Confirmed by HR - Deducted to Bank & COOP') {
      showToast('This salary deduction is already confirmed.', 'info');
      return { success: false };
    }

    const staffId = rct.staffId;
    const staffMember = staffList.find(s => s.id === staffId);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Mark receipt as Confirmed and Deducted to COOP
    setCanteenReceipts(prev => prev.map(r => r.receiptNo === receiptNo ? {
      ...r,
      salaryDeductionStatus: 'Confirmed by HR - Deducted to Bank & COOP',
      isDeductedToCoop: true,
      hrConfirmedAt: new Date().toISOString(),
      hrConfirmedBy: currentUser ? `${currentUser.name} (HR)` : 'HR Management'
    } : r));

    // 2. Deduct from COOP budget / balance
    if (staffId) {
      setCoopBalances(prev => ({
        ...prev,
        [staffId]: Math.max(0, (prev[staffId] || 0) - rct.total)
      }));

      // 3. Append to Coop Ledger
      setCoopLedger(prev => [
        {
          id: `csl-canteen-${Date.now()}`,
          staffId,
          type: 'canteen_salary_deduction',
          amount: rct.total,
          date: todayStr,
          note: `Canteen ${rct.orderType || 'Grocery/Meal'} Salary Deduction (Receipt #${rct.receiptNo}) confirmed deducted via bank payroll by HR - charged to COOP budget.`
        },
        ...prev
      ]);
    }

    showToast(`Canteen salary deduction for ${staffMember?.firstName || 'Staff'} (₱${rct.total.toLocaleString()}) confirmed by HR (bank deducted) & debited from COOP budget!`, 'success');
    return { success: true };
  };

  // Plant Gate Security Checkpoint: Clear Outbound Grocery Gate Pass
  const clearGatePass = (gatePassNo, securityGuardName = 'Gate Guard Officer (Post 1)') => {
    setCanteenGatePasses(prev => prev.map(gp => gp.gatePassNo === gatePassNo ? {
      ...gp,
      gateStatus: 'Cleared at Gate',
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
      staffName: `${staff.firstName} ${staff.lastName}`,
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
        switchDemoRole,
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
        // Coop Share Capital
        coopBalances,
        coopLedger,
        coopWithdrawals,
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
        // Canteen Cash Advance & Cash Drawer
        canteenDrawer,
        cashAdvances,
        requestCashAdvance,
        hrAcceptCashAdvance,
        hrDeclineCashAdvance,
        claimCashAdvance,
        replenishCanteenCash,
        // Canteen Hub & Inventory
        canteenInventory,
        addSupplyItem,
        updateSupplyItem,
        // NKB Manufacturing Products & Personal Purchase Orders
        manufacturingProducts,
        setManufacturingProducts,
        personalPurchaseOrders,
        createPersonalPurchaseOrder,
        fulfillPurchaseOrder,
        canteenReceipts,
        recordCanteenSale,
        voidTransactionWithCard,
        canteenVoidLogs,
        // Canteen Gate Passes & Salary Deductions
        canteenGatePasses,
        confirmCanteenSalaryDeduction,
        clearGatePass,
        productJourneys,
        advanceProductJourneyStage,
        voidProductJourneyToInventory,
        updateProductJourneyClaimant,
        resetProductJourney,
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

