const fs = require('fs');

let content = fs.readFileSync('./src/context/AppContext.jsx', 'utf8');

// 1. Add schema wipe at the top before AppProvider
const schemaPurgeCode = `
const SCHEMA_VERSION = 'v4_excel_masterlist_clean_zero_salary';
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
`;

if (!content.includes('v4_excel_masterlist_clean_zero_salary')) {
  content = content.replace('export function AppProvider({ children }) {', schemaPurgeCode + '\nexport function AppProvider({ children }) {');
}

// 2. Simplify staffList initializer
const oldStaffInit = `  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_staff');
    let parsed = saved ? JSON.parse(saved) : [...INITIAL_STAFF];
    // Guarantee all 92 registered Masterlist staff and system admins are present
    INITIAL_STAFF.forEach(init => {
      const idx = parsed.findIndex(s => 
        s.id === init.id || 
        s.employeeId === init.employeeId || 
        (s.email && init.email && s.email.toLowerCase() === init.email.toLowerCase())
      );
      if (idx === -1) {
        parsed.push(init);
      } else {
        // Sync role, position, department, and pin if not yet initialized
        parsed[idx] = { 
          ...init, 
          ...parsed[idx], 
          role: init.role || parsed[idx].role,
          departmentId: init.departmentId || parsed[idx].departmentId
        };
      }
    });
    return parsed.map(s => (!s.pin || s.pin.length < 8) ? { ...s, pin: '12345678' } : s);
  });`;

const newStaffInit = `  const [staffList, setStaffList] = useState(() => {
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
  });`;

if (content.includes(oldStaffInit)) {
  content = content.replace(oldStaffInit, newStaffInit);
}

// 3. Fix payRuns initializer
const oldPayRuns = `  const [payRuns, setPayRuns] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_payruns');
    if (saved) return JSON.parse(saved);
    
    // Seed initial payrun items
    const seeded = [...INITIAL_PAY_RUNS];
    const run1Items = INITIAL_STAFF.map(s => {
      const activeLoan = INITIAL_LOANS.find(l => l.staffId === s.id && l.status === 'Approved');
      const activeCA = INITIAL_CASH_ADVANCES.find(ca => ca.staffId === s.id && ca.status === 'Active');
      return {
        staffId: s.id,
        ...computeEmployeePayroll(
          s,
          { otHours: s.id === 'staff-3' ? 12 : 0, lateMinutes: s.id === 'staff-4' ? 35 : 0 },
          {
            loanDeduction: activeLoan ? activeLoan.cutoffDeduction : 0,
            cashAdvanceDeduction: activeCA ? activeCA.cutoffDeduction : 0
          }
        )
      };
    });
    seeded[0].items = run1Items;
    return seeded;
  });`;

const newPayRuns = `  const [payRuns, setPayRuns] = useState(() => {
    const saved = localStorage.getItem('nkb_hr_payruns');
    if (saved) return JSON.parse(saved);
    return INITIAL_PAY_RUNS;
  });`;

if (content.includes(oldPayRuns)) {
  content = content.replace(oldPayRuns, newPayRuns);
}

// 4. Update loginStaff to support email, employee ID, and clean error messages
const oldLoginStaff = `  const loginStaff = (email, password) => {
    const found = staffList.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      const userObj = {
        staffId: found.id,
        name: \`\${found.firstName} \${found.lastName}\`,
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
      const roleDescription = 
        found.role === 'ceo' ? 'Chief Executive Officer (CEO - Full Universal Access)' :
        found.role === 'it_admin' ? 'IT Systems Administrator (Super Admin)' :
        found.role === 'canteen' ? 'Canteen & Inventory Manager' :
        (found.role === 'finance' || found.role === 'accounting') ? 'Accounting & Finance Officer' :
        found.role === 'employee' ? 'Employee Self-Service' :
        'HR Manager & Administrator';
      showToast(\`Welcome back, \${userObj.name}! Logged in as \${roleDescription}\`);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Try canteen@nkb.com, ceo@nkb.com, it.admin@nkb.com, elena.vance@nkb.com or david.chen@nkb.com' };
  };`;

const newLoginStaff = `  const loginStaff = (emailOrId, password) => {
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
        name: \`\${found.firstName} \${found.lastName}\`,
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
      showToast(\`Welcome, \${userObj.name}! Logged in as \${found.positionTitle || found.role}\`);
      return { success: true };
    }
    return { success: false, message: 'Invalid credentials. Enter your registered work email or Employee ID (e.g. NKB052026-0001) and 8-digit PIN.' };
  };`;

if (content.includes(oldLoginStaff)) {
  content = content.replace(oldLoginStaff, newLoginStaff);
}

// 5. Update switchDemoRole to match real roles
content = content.replace(/sample = staffList\.find\(s => s\.id === 'staff-1'\) \|\| staffList\.find\(s => s\.role === 'hr' \|\| s\.role === 'admin'\);/g, "sample = staffList.find(s => s.role === 'hr') || staffList.find(s => s.departmentName && s.departmentName.includes('HR'));");
content = content.replace(/sample = staffList\.find\(s => s\.id === 'staff-2'\) \|\| staffList\.find\(s => s\.role === 'accounting' \|\| s\.role === 'finance'\);/g, "sample = staffList.find(s => s.role === 'accounting') || staffList.find(s => s.departmentName && s.departmentName.includes('Accounting'));");
content = content.replace(/sample = staffList\.find\(s => s\.role === 'canteen'\) \|\| staffList\.find\(s => s\.id === 'staff-canteen'\);/g, "sample = staffList.find(s => s.role === 'canteen') || staffList.find(s => s.employeeId === 'NKBCANTEEN');");
content = content.replace(/sample = staffList\.find\(s => s\.role === 'employee'\) \|\| staffList\.find\(s => s\.id === 'staff-3'\);/g, "sample = staffList.find(s => s.role === 'employee') || staffList[2];");
content = content.replace(/staffId: sample\?\.id \|\| 'staff-ceo',/g, "staffId: sample?.id || 'emp-nkb052026-0001',");
content = content.replace(/name: sample \? `\${sample\.firstName} \${sample\.lastName}` : 'Roberto Sterling',/g, "name: sample ? `${sample.firstName} ${sample.lastName}` : 'Katherine A. BELLA',");
content = content.replace(/email: sample\?\.email \|\| 'ceo@nkb\.com',/g, "email: sample?.email || 'katherinea.bella@nkb.com',");
content = content.replace(/employeeId: sample\?\.employeeId \|\| 'NKB-2026-0000',/g, "employeeId: sample?.employeeId || 'NKB052026-0001',");

// 6. Clean names in toast messages
content = content.replace(/Only HR \(Elena Vance\)/g, 'Only HR or Super Admin');
content = content.replace(/'Elena Vance \(HR\)'/g, "'HR Management'");
content = content.replace(/Only Accounting & Finance \(David Chen\)/g, 'Only Accounting & Finance');
content = content.replace(/'David Chen \(Accounting\)'/g, "'Finance & Accounting'");
content = content.replace(/'David Chen \(Finance\)'/g, "'Finance & Accounting'");
content = content.replace(/'Maria Santos \(Canteen Lead\)'/g, "'Canteen Cashier'");
content = content.replace(/'Maria Santos'/g, "'Canteen Cashier'");
content = content.replace(/'Maria Santos \(Supervisor\)'/g, "'Authorized Supervisor'");
content = content.replace(/'Maria Santos \(Canteen Supervisor\)'/g, "'Authorized Supervisor'");
content = content.replace(/'Maria Santos \(Canteen\)'/g, "'Canteen Staff'");

fs.writeFileSync('./src/context/AppContext.jsx', content, 'utf8');
console.log('AppContext.jsx cleaned successfully');
