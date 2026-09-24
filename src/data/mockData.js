import generatedStaffData from './generatedStaff.json';

export const INITIAL_DEPARTMENTS = [
  ...generatedStaffData.departments
];

export const INITIAL_POSITIONS = [
  { id: 'pos-exec', title: 'Chief Executive Officer (CEO)', departmentId: 'dept-exec' },
  { id: 'pos-coo', title: 'Chief Operating Officer (COO)', departmentId: 'dept-coo' },
  { id: 'pos-hr', title: 'HR Manager & Administrator', departmentId: 'dept-hr' },
  { id: 'pos-fin', title: 'Accounting & Finance Officer', departmentId: 'dept-fin' },
  { id: 'pos-prod', title: 'Production Specialist', departmentId: 'dept-prod' },
  { id: 'pos-wh', title: 'Inventory & Warehouse Specialist', departmentId: 'dept-wh' },
  { id: 'pos-sec', title: 'Plant Security & Safety Officer', departmentId: 'dept-sec' },
  { id: 'pos-maint', title: 'Plant Maintenance Specialist', departmentId: 'dept-maint' },
  { id: 'pos-const', title: 'Construction & Facilities Specialist', departmentId: 'dept-const' },
  { id: 'pos-purch', title: 'Purchasing & Procurement Officer', departmentId: 'dept-purch' },
  { id: 'pos-mktg', title: 'Marketing & Brand Specialist', departmentId: 'dept-mktg' },
  { id: 'pos-reg', title: 'Regulatory Affairs Specialist', departmentId: 'dept-reg' },
  { id: 'pos-comp', title: 'Compounding Specialist', departmentId: 'dept-comp' },
  { id: 'pos-rd', title: 'R&D Specialist', departmentId: 'dept-rd' },
  { id: 'pos-hk', title: 'Housekeeping Specialist', departmentId: 'dept-hk' },
  { id: 'pos-coop', title: 'Cooperative Officer', departmentId: 'dept-coop' },
  { id: 'pos-biz', title: 'Business Development Specialist', departmentId: 'dept-biz' },
  { id: 'pos-vyu', title: 'Vyuceutical Specialist', departmentId: 'dept-vyu' },
  { id: 'pos-log', title: 'Logistics Specialist', departmentId: 'dept-log' },
  { id: 'pos-qc', title: 'Quality Control Specialist', departmentId: 'dept-qc' },
  { id: 'pos-silk', title: 'Silkscreen Specialist', departmentId: 'dept-silk' },
  { id: 'pos-cant', title: 'Canteen Administrator & Manager', departmentId: 'dept-cant' },
  { id: 'pos-it', title: 'IT Systems Administrator', departmentId: 'dept-it' }
];

// Registered Personnel from Employee Masterlist.xlsx (all salaries = 0, no demo accounts)
export const INITIAL_STAFF = [
  ...generatedStaffData.staff
];

// No demo attendance logs
export const INITIAL_ATTENDANCE = [];

// No demo pay runs
export const INITIAL_PAY_RUNS = [];

// Initial Coop Share Capital Balances and Ledger (Clean - 0 balances)
export const INITIAL_COOP_BALANCES = {};

export const INITIAL_COOP_LEDGER = [];

export const INITIAL_COOP_WITHDRAWALS = [];

// 6 Loan Categories with specific monthly rates
export const LOAN_CATEGORIES = [
  { id: 'cash', label: 'Personal Cash Loan', monthlyRate: 2, icon: 'Banknote', desc: 'Standard cash assistance for personal needs' },
  { id: 'medical', label: 'Medical Emergency Loan', monthlyRate: 2, icon: 'Activity', desc: 'Hospitalization and prescription medicine' },
  { id: 'motor', label: 'Motorcycle & Vehicle Loan', monthlyRate: 2, icon: 'Bike', desc: 'Transportation and vehicle maintenance' },
  { id: 'education', label: 'Tuition & Education Loan', monthlyRate: 3, icon: 'GraduationCap', desc: 'Tuition fees, books, and school supplies' },
  { id: 'gadget', label: 'Laptop & Gadget Loan', monthlyRate: 3, icon: 'Smartphone', desc: 'Laptops, mobile devices, and electronics' },
  { id: 'appliance', label: 'Home Appliance Loan', monthlyRate: 5, icon: 'Tv', desc: 'Refrigerators, air conditioning, home appliances' }
];

export const INITIAL_LOANS = [];

// Canteen Cash Fund (Clean)
export const INITIAL_CANTEEN_DRAWER = {
  balance: 0,
  transactions: []
};

export const INITIAL_CASH_ADVANCES = [];

// Canteen Inventory Supplies Catalog (Clean - No supply items)
export const INITIAL_CANTEEN_INVENTORY = [];

// Default Canteen Supply Categories
export const DEFAULT_CANTEEN_CATEGORIES = [
  'Beverages & Dairy',
  'Instant Meals',
  'Bakery & Bread',
  'Canned Goods',
  'Snacks & Confectionery',
  'Food & Pantry',
  'Personal Care & Hygiene',
  'Cleaning & Sanitation',
  'Office & Shop Supplies',
  'General Supplies'
];

// NKB Manufactured Products (Factory manufactured goods catalog)
export const INITIAL_MANUFACTURING_PRODUCTS = [
  {
    id: 'mfg-1',
    sku: 'NKB-WELD-200A',
    barcode: '4809012340011',
    name: 'NKB Pro Inverter Arc Welder 200A',
    category: 'Industrial Equipment & Welding',
    modelNumber: 'WLD-200A-PRO',
    plantLocation: 'NKB Plant 1 - Fabrication & Electrical Line',
    regularPrice: 13500.00,
    employeePrice: 9800.00,
    quantity: 24,
    warranty: '2 Years Factory Warranty',
    unit: 'Unit',
    specs: 'IGBT Inverter, 220V Single Phase, 20-200A Output, Anti-Stick Protection',
    description: 'Heavy-duty commercial arc welder manufactured at NKB Plant 1. High efficiency for personal fabrication, home workshop, and farm utility repairs.'
  },
  {
    id: 'mfg-2',
    sku: 'NKB-MTR-15HP',
    barcode: '4809012340028',
    name: 'NKB Industrial Heavy-Duty Electric Motor 1.5HP',
    category: 'Motors & Power Machinery',
    modelNumber: 'MTR-150-HD',
    plantLocation: 'NKB Plant 2 - Motor Winding & Casting Line',
    regularPrice: 8900.00,
    employeePrice: 6600.00,
    quantity: 35,
    warranty: '1 Year Factory Warranty',
    unit: 'Unit',
    specs: '1.5 HP, 1750 RPM, 4-Pole, Single Phase 220V, Cast Iron Casing, IP55 Enclosure',
    description: 'Continuous duty induction motor designed for compressors, water pumps, threshers, and shop machines.'
  },
  {
    id: 'mfg-3',
    sku: 'NKB-TLS-120PRO',
    barcode: '4809012340035',
    name: 'NKB Master Mechanic Tool Chest & Socket Set (120-pc)',
    category: 'Hand Tools & Mechanics',
    modelNumber: 'TLS-120-PRO',
    plantLocation: 'NKB Plant 1 - Tooling & Metal Forming Division',
    regularPrice: 5200.00,
    employeePrice: 3850.00,
    quantity: 50,
    warranty: 'Lifetime Tool Replacement Guarantee',
    unit: 'Set',
    specs: 'Chrome Vanadium Steel, 1/4" and 1/2" Ratchet Wrenches, Metric & SAE Sockets, Hard Blow-Mold Case',
    description: 'Precision forged mechanics set manufactured with industrial-grade hardening for automotive and maintenance personal use.'
  },
  {
    id: 'mfg-4',
    sku: 'NKB-WB-STEEL',
    barcode: '4809012340042',
    name: 'NKB Heavy Gauge Steel Modular Workbench 1.8m',
    category: 'Fabricated Steel Structures',
    modelNumber: 'WB-1800-MOD',
    plantLocation: 'NKB Plant 3 - Sheet Metal & Powder Coating',
    regularPrice: 16500.00,
    employeePrice: 12200.00,
    quantity: 16,
    warranty: '5 Years Structural Warranty',
    unit: 'Set',
    specs: 'Heavy 12-gauge cold rolled steel, 600kg load capacity, powder-coated finish with tool pegboard',
    description: 'Modular workshop table engineered and precision laser-cut at NKB sheet metal facility. Perfect for DIY garage workshops.'
  },
  {
    id: 'mfg-5',
    sku: 'NKB-AG-850W',
    barcode: '4809012340059',
    name: 'NKB Precision Angle Grinder 850W 100mm',
    category: 'Power Tools',
    modelNumber: 'AG-850-SLM',
    plantLocation: 'NKB Plant 1 - Electrical Tools Assembly',
    regularPrice: 3600.00,
    employeePrice: 2650.00,
    quantity: 65,
    warranty: '1 Year Factory Warranty',
    unit: 'Unit',
    specs: '850W High Copper Armature, 11,000 RPM, Slim Ergonomic Body, Spindle Lock',
    description: 'Compact metal cutting and grinding power tool assembled with Japanese bearings and copper coil windings.'
  },
  {
    id: 'mfg-6',
    sku: 'NKB-SOLAR-GEN',
    barcode: '4809012340066',
    name: 'NKB Solar Backup Energy Storage Generator 1.2kWh',
    category: 'Renewable Power Systems',
    modelNumber: 'GEN-SLR-1200',
    plantLocation: 'NKB Plant 4 - Electronics & Renewable Division',
    regularPrice: 28500.00,
    employeePrice: 21900.00,
    quantity: 12,
    warranty: '3 Years Battery Warranty',
    unit: 'Unit',
    specs: '1280Wh LiFePO4 Battery, 1200W Pure Sine Wave Inverter, Dual AC Outlets, USB-C PD 100W, Solar MPPT Input',
    description: 'Emergency brownout power station manufactured by NKB renewable energy division for residential backup.'
  }
];

// No demo purchase orders
export const INITIAL_PERSONAL_PURCHASE_ORDERS = [];

// No demo grocery gate passes
export const INITIAL_CANTEEN_GATE_PASSES = [];

// No demo canteen POS sales receipts
export const INITIAL_CANTEEN_RECEIPTS = [];

// No demo void audit logs
export const INITIAL_CANTEEN_VOID_LOGS = [];

// Systematic Product Journey Stages (5 Systematic Steps)
export const PRODUCT_JOURNEY_STAGES = [
  { id: 'ordered', name: 'Ordered', icon: 'ShoppingCart', description: 'Purchase order placed with supplier', coordinate: { x: 10, y: 50 } },
  { id: 'receiving_dock', name: 'Receiving Dock', icon: 'PackageCheck', description: 'Inbound dock scanning & quarantine inspection', coordinate: { x: 30, y: 50 } },
  { id: 'inventory', name: 'Inventory', icon: 'Store', description: 'Stocked in canteen pantry & warehouse shelves', coordinate: { x: 50, y: 50 } },
  { id: 'employee_claimed', name: 'Employee Claimed', icon: 'UserCheck', description: 'Officially handed over and claimed by employee', coordinate: { x: 70, y: 50 } },
  { id: 'voided_back', name: 'Voided Back to Inventory', icon: 'RotateCcw', description: 'Authorized return/void back to active inventory', coordinate: { x: 90, y: 50 } }
];

// No demo product journeys
export const INITIAL_PRODUCT_JOURNEYS = [];

// Demo Leave Requests
export const INITIAL_LEAVE_REQUESTS = [
  {
    id: 'leave-001',
    staffId: 'nkb-staff-001',
    staffName: 'Katherine A. BELLA',
    employeeId: 'NKB092026-0001',
    type: 'Vacation Leave',
    startDate: '2026-10-05',
    endDate: '2026-10-07',
    days: 3,
    reason: 'Annual executive board planning conference',
    status: 'Approved',
    submittedAt: '2026-09-20T08:30:00.000Z',
    reviewedBy: 'Norvin L. BELLA (COO)',
    reviewedAt: '2026-09-21T09:00:00.000Z',
    remarks: 'Approved for corporate planning.'
  },
  {
    id: 'leave-002',
    staffId: 'nkb-staff-011',
    staffName: 'Merry Jean I. ALONZO',
    employeeId: 'NKB092026-0011',
    type: 'Sick Leave',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    days: 1,
    reason: 'Medical dental appointment',
    status: 'Pending',
    submittedAt: '2026-09-23T14:15:00.000Z',
    reviewedBy: null,
    reviewedAt: null,
    remarks: ''
  }
];

// Demo Overtime Requests
export const INITIAL_OVERTIME_REQUESTS = [
  {
    id: 'ot-001',
    staffId: 'nkb-staff-011',
    staffName: 'Merry Jean I. ALONZO',
    employeeId: 'NKB092026-0011',
    date: '2026-09-24',
    hours: 2.5,
    task: 'Fabrication Line 2 Urgent Assembly Completion',
    status: 'Pending',
    submittedAt: '2026-09-23T16:00:00.000Z',
    reviewedBy: null,
    reviewedAt: null,
    remarks: ''
  },
  {
    id: 'ot-002',
    staffId: 'nkb-staff-048',
    staffName: 'Carl Laurence B. PATAGNAN',
    employeeId: 'NKB092026-0048',
    date: '2026-09-22',
    hours: 3.0,
    task: 'Server Maintenance & Network Turnstile Firmware Update',
    status: 'Approved',
    submittedAt: '2026-09-21T18:00:00.000Z',
    reviewedBy: 'Genevieve Anne A. JURADO (HR)',
    reviewedAt: '2026-09-22T08:00:00.000Z',
    remarks: 'Approved for plant network maintenance window.'
  }
];

