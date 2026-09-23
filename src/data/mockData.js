import generatedStaffData from './generatedStaff.json';

export const INITIAL_DEPARTMENTS = [
  ...generatedStaffData.departments,
  { id: 'dept-0', name: 'Executive Leadership (Board)', code: 'EXEC', manager: 'Katherine A. BELLA' },
  { id: 'dept-6', name: 'Information Technology', code: 'IT', manager: 'Victor Stone' },
  { id: 'dept-7', name: 'Canteen & Nutrition Services', code: 'CANT', manager: 'Maria Santos' }
];

export const INITIAL_POSITIONS = [
  { id: 'pos-0', title: 'Chief Executive Officer (CEO)', departmentId: 'dept-0' },
  { id: 'pos-1', title: 'HR Manager & Administrator', departmentId: 'dept-2' },
  { id: 'pos-2', title: 'HR Specialist', departmentId: 'dept-2' },
  { id: 'pos-3', title: 'Accounting & Finance Officer', departmentId: 'dept-3' },
  { id: 'pos-4', title: 'Senior Software Engineer', departmentId: 'dept-1' },
  { id: 'pos-5', title: 'Plant Operations Lead', departmentId: 'dept-4' },
  { id: 'pos-6', title: 'QA Compliance Inspector', departmentId: 'dept-5' },
  { id: 'pos-7', title: 'IT Systems Administrator', departmentId: 'dept-6' },
  { id: 'pos-8', title: 'Canteen & Inventory Lead', departmentId: 'dept-7' }
];

export const INITIAL_STAFF = [
  // 92 Registered Personnel from Employee Masterlist.xlsx
  ...generatedStaffData.staff,

  // Core administrative and demo accounts preserved for system administration
  {
    id: 'staff-ceo',
    employeeId: 'NKB-2026-0000',
    barcodeValue: 'NKB-2026-0000',
    employmentType: 'regular',
    firstName: 'Roberto',
    lastName: 'Sterling',
    email: 'ceo@nkb.com',
    phone: '+63 917 000 0001',
    positionId: 'pos-0',
    departmentId: 'dept-0',
    role: 'ceo', // CEO / Executive Super Admin
    hireDate: '2020-01-01',
    baseSalary: 250000,
    payFrequency: 'semi-monthly',
    bankName: 'Citibank N.A.',
    bankAccount: '1100-2233-4455',
    tin: '100-000-001',
    sssNo: '01-0000001-0',
    pin: '88888888',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-it',
    employeeId: 'NKB-2026-0009',
    barcodeValue: 'NKB-2026-0009',
    employmentType: 'regular',
    firstName: 'Victor',
    lastName: 'Stone',
    email: 'it.admin@nkb.com',
    phone: '+63 917 999 0002',
    positionId: 'pos-7',
    departmentId: 'dept-6',
    role: 'it_admin', // IT Systems Administrator / Super Admin
    hireDate: '2022-03-01',
    baseSalary: 95000,
    payFrequency: 'semi-monthly',
    bankName: 'BDO Unibank',
    bankAccount: '0045-9988-1122',
    tin: '202-999-111',
    sssNo: '03-8899112-9',
    pin: '99999999',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-1',
    employeeId: 'NKB-2026-0001',
    barcodeValue: 'NKB-2026-0001',
    employmentType: 'regular',
    firstName: 'Elena',
    lastName: 'Vance',
    email: 'elena.vance@nkb.com',
    phone: '+63 917 123 4567',
    positionId: 'pos-1',
    departmentId: 'dept-2',
    role: 'hr', // HR Manager (Account Locked)
    hireDate: '2023-01-15',
    baseSalary: 78000,
    payFrequency: 'semi-monthly',
    bankName: 'BDO Unibank',
    bankAccount: '0045-8821-9920',
    tin: '302-849-112',
    sssNo: '34-8921470-1',
    pin: '12345678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-2',
    employeeId: 'NKB-2026-0002',
    barcodeValue: 'NKB-2026-0002',
    employmentType: 'regular',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.chen@nkb.com',
    phone: '+63 918 234 5678',
    positionId: 'pos-3',
    departmentId: 'dept-3',
    role: 'accounting', // Accounting Officer (Account Locked)
    hireDate: '2023-04-10',
    baseSalary: 48000,
    payFrequency: 'semi-monthly',
    bankName: 'Bank of the Philippine Islands (BPI)',
    bankAccount: '1982-4412-09',
    tin: '419-102-883',
    sssNo: '02-7719203-4',
    pin: '12345678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-3',
    employeeId: 'NKB-2026-0003',
    barcodeValue: 'NKB-2026-0003',
    employmentType: 'regular',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@nkb.com',
    phone: '+63 919 345 6789',
    positionId: 'pos-4',
    departmentId: 'dept-1',
    role: 'employee',
    hireDate: '2024-02-01',
    baseSalary: 75000,
    payFrequency: 'semi-monthly',
    bankName: 'Metrobank',
    bankAccount: '551-092-882',
    tin: '219-482-901',
    sssNo: '04-9982103-2',
    pin: '12345678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-4',
    employeeId: 'NKB-2026-0004',
    barcodeValue: 'NKB-2026-0004',
    employmentType: 'regular',
    firstName: 'Marcus',
    lastName: 'Brody',
    email: 'marcus.brody@nkb.com',
    phone: '+63 920 456 7890',
    positionId: 'pos-5',
    departmentId: 'dept-4',
    role: 'employee',
    hireDate: '2023-08-20',
    baseSalary: 52000,
    payFrequency: 'semi-monthly',
    bankName: 'Security Bank',
    bankAccount: '0000-8472-192',
    tin: '592-384-019',
    sssNo: '33-1928471-9',
    pin: '12345678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-5',
    employeeId: 'PRJ-2026-0001',
    barcodeValue: 'PRJ-2026-0001',
    employmentType: 'contractual',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.jenkins@nkb.com',
    phone: '+63 921 567 8901',
    positionId: 'pos-6',
    departmentId: 'dept-5',
    role: 'employee',
    hireDate: '2024-06-15',
    baseSalary: 34000,
    payFrequency: 'semi-monthly',
    bankName: 'BDO Unibank',
    bankAccount: '1120-9481-44',
    tin: '182-394-012',
    sssNo: '09-1928374-5',
    pin: '12345678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'staff-canteen',
    employeeId: 'NKB-2026-0005',
    barcodeValue: 'NKB-2026-0005',
    employmentType: 'regular',
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'canteen@nkb.com',
    phone: '+63 922 678 9012',
    positionId: 'pos-8',
    departmentId: 'dept-7',
    role: 'canteen',
    hireDate: '2024-03-01',
    baseSalary: 38000,
    payFrequency: 'semi-monthly',
    bankName: 'BPI Bank',
    bankAccount: '2091-8841-55',
    tin: '320-192-881',
    sssNo: '03-8829104-6',
    pin: '12345678',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_ATTENDANCE = [
  { id: 'att-1', staffId: 'staff-3', date: '2026-05-15', timeIn: '07:55 AM', timeOut: '05:30 PM', status: 'On-time', otHours: 1.5, lateMinutes: 0 },
  { id: 'att-2', staffId: 'staff-4', date: '2026-05-15', timeIn: '08:12 AM', timeOut: '05:00 PM', status: 'Tardy', otHours: 0, lateMinutes: 12 },
  { id: 'att-3', staffId: 'staff-5', date: '2026-05-15', timeIn: '07:50 AM', timeOut: '07:00 PM', status: 'Overtime', otHours: 2.0, lateMinutes: 0 },
  { id: 'att-4', staffId: 'staff-1', date: '2026-05-15', timeIn: '08:00 AM', timeOut: '05:00 PM', status: 'On-time', otHours: 0, lateMinutes: 0 },
  { id: 'att-5', staffId: 'staff-2', date: '2026-05-15', timeIn: '07:58 AM', timeOut: '05:00 PM', status: 'On-time', otHours: 0, lateMinutes: 0 }
];

export const INITIAL_PAY_RUNS = [
  {
    id: 'payrun-1',
    code: 'PR-2026-05A',
    title: '1st Half May 2026 Regular Payroll',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-15',
    payDate: '2026-05-15',
    status: 'Approved', // Draft, Calculated, Approved, Disbursed
    totalGross: 147500,
    totalDeductions: 19820,
    totalNet: 127680,
    approvedBy: 'David Chen (Finance)',
    approvedAt: '2026-05-15T10:30:00Z',
    items: []
  },
  {
    id: 'payrun-2',
    code: 'PR-2026-05B',
    title: '2nd Half May 2026 Regular Payroll',
    periodStart: '2026-05-16',
    periodEnd: '2026-05-31',
    payDate: '2026-05-31',
    status: 'Draft',
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    items: []
  }
];

// Initial Coop Share Capital Balances and Ledger
export const INITIAL_COOP_BALANCES = {
  'staff-ceo': 100000,
  'staff-it': 60000,
  'staff-1': 50000,
  'staff-2': 45000,
  'staff-3': 35000,
  'staff-4': 28000,
  'staff-5': 15000
};

export const INITIAL_COOP_LEDGER = [
  { id: 'csl-ceo', staffId: 'staff-ceo', type: 'deposit', amount: 100000, date: '2026-01-01', note: 'Executive Founding Equity & Coop Share Deposit' },
  { id: 'csl-it', staffId: 'staff-it', type: 'deposit', amount: 60000, date: '2026-01-10', note: 'Initial Coop Membership Share Capital' },
  { id: 'csl-1', staffId: 'staff-1', type: 'deposit', amount: 50000, date: '2026-01-15', note: 'Initial Coop Membership Share Capital' },
  { id: 'csl-2', staffId: 'staff-2', type: 'deposit', amount: 45000, date: '2026-01-15', note: 'Initial Coop Membership Share Capital' },
  { id: 'csl-3', staffId: 'staff-3', type: 'deposit', amount: 35000, date: '2026-02-01', note: 'Initial Coop Membership Share Capital' },
  { id: 'csl-4', staffId: 'staff-4', type: 'deposit', amount: 28000, date: '2026-02-01', note: 'Initial Coop Membership Share Capital' },
  { id: 'csl-5', staffId: 'staff-5', type: 'deposit', amount: 15000, date: '2026-03-01', note: 'Initial Coop Membership Share Capital' }
];

export const INITIAL_COOP_WITHDRAWALS = [
  {
    id: 'cw-1',
    staffId: 'staff-4',
    amount: 5000,
    reason: 'Emergency home repair assistance',
    status: 'Pending Accounting Approval',
    requestedBy: 'Elena Vance (HR)',
    requestedAt: '2026-05-14T09:30:00Z',
    approvedBy: null,
    approvedAt: null
  }
];

// 6 Categories with specific monthly rates:
// cash: 2%, medical: 2%, motor: 2%, education: 3%, gadget: 3%, appliance: 5%
export const LOAN_CATEGORIES = [
  { id: 'cash', label: 'Personal Cash Loan', monthlyRate: 2, icon: 'Banknote', desc: 'Standard cash assistance for personal needs' },
  { id: 'medical', label: 'Medical Emergency Loan', monthlyRate: 2, icon: 'Activity', desc: 'Hospitalization and prescription medicine' },
  { id: 'motor', label: 'Motorcycle & Vehicle Loan', monthlyRate: 2, icon: 'Bike', desc: 'Transportation and vehicle maintenance' },
  { id: 'education', label: 'Tuition & Education Loan', monthlyRate: 3, icon: 'GraduationCap', desc: 'Tuition fees, books, and school supplies' },
  { id: 'gadget', label: 'Laptop & Gadget Loan', monthlyRate: 3, icon: 'Smartphone', desc: 'Laptops, mobile devices, and electronics' },
  { id: 'appliance', label: 'Home Appliance Loan', monthlyRate: 5, icon: 'Tv', desc: 'Refrigerators, air conditioning, home appliances' }
];

export const INITIAL_LOANS = [
  {
    id: 'loan-1',
    staffId: 'staff-3',
    category: 'gadget',
    categoryLabel: 'Laptop & Gadget Loan',
    principal: 15000,
    interestRate: 3, // 3% per month
    termMonths: 6,
    totalInterest: 2700, // 15000 * 0.03 * 6
    totalRepayable: 17700,
    monthlyDeduction: 2950,
    cutoffDeduction: 1475,
    balanceRemaining: 14750,
    status: 'Approved',
    requestedAt: '2026-04-02T10:00:00Z',
    approvedAt: '2026-04-03T14:00:00Z',
    approvedBy: 'Elena Vance (HR)'
  },
  {
    id: 'loan-2',
    staffId: 'staff-4',
    category: 'medical',
    categoryLabel: 'Medical Emergency Loan',
    principal: 10000,
    interestRate: 2, // 2% per month
    termMonths: 4,
    totalInterest: 800, // 10000 * 0.02 * 4
    totalRepayable: 10800,
    monthlyDeduction: 2700,
    cutoffDeduction: 1350,
    balanceRemaining: 10800,
    status: 'Pending HR',
    requestedAt: '2026-05-14T11:20:00Z',
    approvedAt: null,
    approvedBy: null
  },
  {
    id: 'loan-3',
    staffId: 'staff-5',
    category: 'education',
    categoryLabel: 'Tuition & Education Loan',
    principal: 12000,
    interestRate: 3, // 3% per month
    termMonths: 3,
    totalInterest: 1080, // 12000 * 0.03 * 3
    totalRepayable: 13080,
    monthlyDeduction: 4360,
    cutoffDeduction: 2180,
    balanceRemaining: 13080,
    status: 'Pending Accounting Approval',
    requestedAt: '2026-05-13T10:00:00Z',
    hrApprovedAt: '2026-05-14T08:30:00Z',
    hrApprovedBy: 'Elena Vance (HR)',
    approvedAt: null,
    approvedBy: null
  }
];

// Canteen Cash Fund & Cash Advance (1.5% fee, deducted first from Canteen cash drawer)
export const INITIAL_CANTEEN_DRAWER = {
  balance: 50000,
  transactions: [
    { id: 'cd-1', type: 'replenish', amount: 50000, date: '2026-05-01', note: 'Monthly Canteen Cash Advance Fund Allocation' }
  ]
};

export const INITIAL_CASH_ADVANCES = [
  {
    id: 'ca-1',
    staffId: 'staff-3',
    principal: 4000,
    feeRate: 1.5, // 1.5% fee directly charged to salary once claimed
    feeAmount: 60, // 4000 * 0.015
    totalRepayable: 4060,
    termMonths: 1,
    cutoffDeduction: 2030,
    balanceRemaining: 4060,
    status: 'Active',
    requestedAt: '2026-05-10T12:00:00Z',
    claimedAt: '2026-05-10T15:00:00Z',
    disbursedFrom: 'Canteen Cash Drawer'
  },
  {
    id: 'ca-2',
    staffId: 'staff-5',
    principal: 2000,
    feeRate: 1.5,
    feeAmount: 30,
    totalRepayable: 2030,
    termMonths: 1,
    cutoffDeduction: 1015,
    balanceRemaining: 2030,
    status: 'Pending Canteen Claim',
    requestedAt: '2026-05-15T08:30:00Z',
    claimedAt: null,
    disbursedFrom: null
  }
];

// Canteen Inventory Supplies (Company/Supplier, Brand, Amount, Quantity, Expiration Date, Size, Late Encoding tag)
export const INITIAL_CANTEEN_INVENTORY = [
  {
    id: 'prod-1',
    barcode: '4800016644012',
    name: 'San Miguel Fresh Milk 1L',
    company: 'San Miguel Dairy Corp',
    brand: 'Magnolia Pure Fresh',
    category: 'Beverages & Dairy',
    costPrice: 82.00,
    sellingPrice: 98.00,
    quantity: 45,
    reorderLevel: 15,
    unit: 'Bottle',
    size: '1L',
    expirationDate: '2026-08-15',
    isLateEncoded: false,
    encodedAt: '2026-05-01T08:00:00Z',
    notes: 'Regular cold chain delivery'
  },
  {
    id: 'prod-2',
    barcode: '4800841200115',
    name: 'Nissin Cup Noodles Seafood 60g',
    company: 'Monde Nissin Corp',
    brand: 'Nissin',
    category: 'Instant Meals',
    costPrice: 28.50,
    sellingPrice: 38.00,
    quantity: 120,
    reorderLevel: 30,
    unit: 'Cup',
    size: '60g',
    expirationDate: '2026-11-20',
    isLateEncoded: false,
    encodedAt: '2026-05-02T09:15:00Z',
    notes: 'Inbound pallet batch #882'
  },
  {
    id: 'prod-3',
    barcode: '4800047820102',
    name: 'Gardenia Classic White Bread 600g',
    company: 'Gardenia Bakeries Phils',
    brand: 'Gardenia',
    category: 'Bakery & Bread',
    costPrice: 65.00,
    sellingPrice: 78.00,
    quantity: 24,
    reorderLevel: 10,
    unit: 'Loaf',
    size: '600g',
    expirationDate: '2026-05-25',
    isLateEncoded: true,
    lateReason: 'Delivery invoice arrived 2 days delayed from logistics vendor',
    encodedAt: '2026-05-14T14:30:00Z',
    notes: 'Late encoded inbound stock'
  },
  {
    id: 'prod-4',
    barcode: '4807770270014',
    name: 'C2 Green Tea Apple 500ml',
    company: 'Universal Robina Corp',
    brand: 'URC C2',
    category: 'Beverages',
    costPrice: 22.00,
    sellingPrice: 30.00,
    quantity: 80,
    reorderLevel: 25,
    unit: 'Bottle',
    size: '500ml',
    expirationDate: '2026-12-10',
    isLateEncoded: false,
    encodedAt: '2026-05-05T10:00:00Z',
    notes: 'Shelf inventory verified'
  },
  {
    id: 'prod-5',
    barcode: '4800016600216',
    name: 'Purefoods Corned Beef 210g',
    company: 'San Miguel Foods Inc',
    brand: 'Purefoods',
    category: 'Canned Goods',
    costPrice: 74.00,
    sellingPrice: 92.00,
    quantity: 65,
    reorderLevel: 20,
    unit: 'Can',
    size: '210g',
    expirationDate: '2027-03-30',
    isLateEncoded: false,
    encodedAt: '2026-05-06T11:00:00Z',
    notes: 'Long shelf-life standard'
  },
  {
    id: 'prod-6',
    barcode: '4800552109923',
    name: 'Nature Spring Mineral Water 500ml',
    company: 'Philippine Spring Water Resources Inc',
    brand: 'Nature Spring',
    category: 'Beverages',
    costPrice: 12.00,
    sellingPrice: 18.00,
    quantity: 150,
    reorderLevel: 40,
    unit: 'Bottle',
    size: '500ml',
    expirationDate: '2027-05-01',
    isLateEncoded: false,
    encodedAt: '2026-05-08T08:30:00Z',
    notes: 'High turnover hydration supply'
  }
];

// NKB Manufactured Products (Manufactured by NKB Manufacturing & Operations Dept)
// Available for Employee Personal Purchase Orders (Personal Use) at Factory Employee Pricing
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
    specs: 'Chrome Vanadium Steel, 1/4" & 1/2" Ratchet Wrenches, Metric & SAE Sockets, Hard Blow-Mold Case',
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

// Personal Purchase Orders (Personal Use: NKB Manufacturing Products)
// Payment options: 'cash' (Receivable by Accounting) or 'coop' (Deducted from Coop Share Capital)
export const INITIAL_PERSONAL_PURCHASE_ORDERS = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-0081',
    staffId: 'staff-3',
    staffName: 'Alex Rivera',
    departmentName: 'Engineering & Technology',
    items: [
      { id: 'mfg-5', name: 'NKB Precision Angle Grinder 850W 100mm', sku: 'NKB-AG-850W', quantity: 1, price: 2650.00, total: 2650.00 },
      { id: 'mfg-3', name: 'NKB Master Mechanic Tool Chest & Socket Set (120-pc)', sku: 'NKB-TLS-120PRO', quantity: 1, price: 3850.00, total: 3850.00 }
    ],
    totalAmount: 6500.00,
    paymentMethod: 'coop', // 'cash' | 'coop'
    paymentStatus: 'Charged to COOP Share Capital',
    accountingReceivableStatus: null,
    coopDeductionStatus: 'Deducted from Share Capital Balance',
    status: 'Fulfilled', // 'Pending Canteen Fulfillment', 'Fulfilled', 'Cancelled'
    purpose: 'Personal home workshop metal crafting and repairs',
    requestedAt: '2026-05-14T09:15:00Z',
    fulfilledAt: '2026-05-14T11:00:00Z',
    fulfilledBy: 'Maria Santos (Canteen & Inventory Lead)'
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-0082',
    staffId: 'staff-4',
    staffName: 'Marcus Brody',
    departmentName: 'Manufacturing & Operations',
    items: [
      { id: 'mfg-1', name: 'NKB Pro Inverter Arc Welder 200A', sku: 'NKB-WELD-200A', quantity: 1, price: 9800.00, total: 9800.00 }
    ],
    totalAmount: 9800.00,
    paymentMethod: 'cash',
    paymentStatus: 'Pending Accounting Collection',
    accountingReceivableStatus: 'Open - Payable at Accounting Cashier',
    coopDeductionStatus: null,
    status: 'Pending Canteen Fulfillment',
    purpose: 'Personal garage gate fabrication and farm gate repair',
    requestedAt: '2026-05-15T08:45:00Z',
    fulfilledAt: null,
    fulfilledBy: null
  }
];

// Canteen Grocery Gate Passes (Required for taking out groceries/pantry supplies from factory premises)
export const INITIAL_CANTEEN_GATE_PASSES = [
  {
    id: 'gp-1',
    gatePassNo: 'GP-2026-00412',
    receiptNo: 'RCT-2026-050101',
    date: '2026-05-14T11:32:00Z',
    staffId: 'staff-4',
    staffName: 'Marcus Brody',
    employeeId: 'NKB-2026-0004',
    departmentName: 'Manufacturing & Operations',
    plantLocation: 'Plant 1 - Machine Shop & Fabrication',
    items: [
      { barcode: '4800016644012', name: 'San Miguel Fresh Milk 1L', quantity: 1, unit: 'Bottle', unitPrice: 98.00, total: 98.00 },
      { barcode: '4807770270014', name: 'C2 Green Tea Apple 500ml', quantity: 2, unit: 'Bottle', unitPrice: 30.00, total: 60.00 }
    ],
    totalAmount: 158.00,
    paymentMethod: 'Cash',
    orderType: 'Grocery',
    purpose: 'Canteen Grocery Pantry - Authorized Factory Gate Pass for Personal Household Supplies',
    issuedBy: 'Maria Santos (Canteen Lead)',
    gateStatus: 'Cleared at Gate',
    clearedAt: '2026-05-14T17:10:00Z',
    securityGuard: 'Officer R. Mendoza (Main Gate Post 1)'
  },
  {
    id: 'gp-2',
    gatePassNo: 'GP-2026-00415',
    receiptNo: 'RCT-2026-050103',
    date: '2026-05-15T09:20:00Z',
    staffId: 'staff-3',
    staffName: 'Alex Rivera',
    employeeId: 'NKB-2026-0003',
    departmentName: 'Engineering & Technology',
    plantLocation: 'Main Technical Center',
    items: [
      { barcode: '4800047820102', name: 'Gardenia Classic White Bread 600g', quantity: 2, unit: 'Loaf', unitPrice: 78.00, total: 156.00 },
      { barcode: '4800016600216', name: 'Purefoods Corned Beef 210g', quantity: 3, unit: 'Can', unitPrice: 92.00, total: 276.00 }
    ],
    totalAmount: 432.00,
    paymentMethod: 'Salary Deduction',
    orderType: 'Grocery',
    purpose: 'Canteen Grocery Pantry - Authorized Factory Gate Pass for Personal Household Supplies',
    issuedBy: 'Maria Santos (Canteen Lead)',
    gateStatus: 'Issued - Awaiting Gate Exit',
    clearedAt: null,
    securityGuard: null
  }
];

// Immutable Canteen POS Sales Receipts (Cannot be edited, only Card-Voided with audit trail)
export const INITIAL_CANTEEN_RECEIPTS = [
  {
    receiptNo: 'RCT-2026-050101',
    date: '2026-05-14T11:30:00Z',
    cashierName: 'Maria Santos',
    customerType: 'Staff Member',
    customerName: 'Marcus Brody',
    staffId: 'staff-4',
    orderType: 'Grocery', // 'Dine In' | 'Grocery'
    items: [
      { barcode: '4800016644012', name: 'San Miguel Fresh Milk 1L', quantity: 1, unitPrice: 98.00, total: 98.00 },
      { barcode: '4807770270014', name: 'C2 Green Tea Apple 500ml', quantity: 2, unitPrice: 30.00, total: 60.00 }
    ],
    subtotal: 158.00,
    tax: 0.00,
    total: 158.00,
    paymentMethod: 'Cash',
    gatePassNo: 'GP-2026-00412',
    salaryDeductionStatus: null,
    isDeductedToCoop: false,
    status: 'COMPLETED' // 'COMPLETED' | 'VOIDED'
  },
  {
    receiptNo: 'RCT-2026-050102',
    date: '2026-05-14T13:45:00Z',
    cashierName: 'Maria Santos',
    customerType: 'Staff Member',
    customerName: 'Sarah Jenkins',
    staffId: 'staff-5',
    orderType: 'Dine In',
    items: [
      { barcode: '4800841200115', name: 'Nissin Cup Noodles Seafood 60g', quantity: 2, unitPrice: 38.00, total: 76.00 }
    ],
    subtotal: 76.00,
    tax: 0.00,
    total: 76.00,
    paymentMethod: 'Salary Deduction',
    gatePassNo: null,
    salaryDeductionStatus: 'Pending HR Bank Confirmation',
    isDeductedToCoop: false,
    status: 'COMPLETED'
  },
  {
    receiptNo: 'RCT-2026-050103',
    date: '2026-05-15T09:20:00Z',
    cashierName: 'Maria Santos',
    customerType: 'Staff Member',
    customerName: 'Alex Rivera',
    staffId: 'staff-3',
    orderType: 'Grocery',
    items: [
      { barcode: '4800047820102', name: 'Gardenia Classic White Bread 600g', quantity: 2, unitPrice: 78.00, total: 156.00 },
      { barcode: '4800016600216', name: 'Purefoods Corned Beef 210g', quantity: 3, unitPrice: 92.00, total: 276.00 }
    ],
    subtotal: 432.00,
    tax: 0.00,
    total: 432.00,
    paymentMethod: 'Salary Deduction',
    gatePassNo: 'GP-2026-00415',
    salaryDeductionStatus: 'Pending HR Bank Confirmation',
    isDeductedToCoop: false,
    status: 'COMPLETED'
  },
  {
    receiptNo: 'RCT-2026-050099',
    date: '2026-05-13T16:20:00Z',
    cashierName: 'Maria Santos',
    customerType: 'Walk-in / Visitor',
    customerName: 'Guest',
    staffId: null,
    orderType: 'Dine In',
    items: [
      { barcode: '4800016600216', name: 'Purefoods Corned Beef 210g', quantity: 2, unitPrice: 92.00, total: 184.00 }
    ],
    subtotal: 184.00,
    tax: 0.00,
    total: 184.00,
    paymentMethod: 'Cash',
    gatePassNo: null,
    salaryDeductionStatus: null,
    isDeductedToCoop: false,
    status: 'VOIDED'
  }
];

// Canteen Card-Based Void Audit Logs
export const INITIAL_CANTEEN_VOID_LOGS = [
  {
    id: 'void-log-1',
    receiptNo: 'RCT-2026-050099',
    voidedAt: '2026-05-13T16:25:00Z',
    voidedBy: 'Maria Santos (Canteen Supervisor)',
    authRole: 'canteen',
    authMethod: 'RFID Badge Tap',
    cardBadgeId: 'RFID-CANT-8890',
    reason: 'Customer mistakenly scanned duplicate canned goods and requested refund before departure',
    stockRestored: true,
    returnedItems: [
      { barcode: '4800016600216', name: 'Purefoods Corned Beef 210g', quantity: 2 }
    ]
  }
];

// Systematic Product Journey Stages (5 Systematic Steps)
export const PRODUCT_JOURNEY_STAGES = [
  { id: 'ordered', name: 'Ordered', icon: 'ShoppingCart', description: 'Purchase order placed with supplier', coordinate: { x: 10, y: 50 } },
  { id: 'receiving_dock', name: 'Receiving Dock', icon: 'PackageCheck', description: 'Inbound dock scanning & quarantine inspection', coordinate: { x: 30, y: 50 } },
  { id: 'inventory', name: 'Inventory', icon: 'Store', description: 'Stocked in canteen pantry & warehouse shelves', coordinate: { x: 50, y: 50 } },
  { id: 'employee_claimed', name: 'Employee Claimed', icon: 'UserCheck', description: 'Officially handed over and claimed by employee', coordinate: { x: 70, y: 50 } },
  { id: 'voided_back', name: 'Voided Back to Inventory', icon: 'RotateCcw', description: 'Authorized return/void back to active inventory', coordinate: { x: 90, y: 50 } }
];

export const INITIAL_PRODUCT_JOURNEYS = [
  {
    id: 'journey-1',
    batchNumber: 'LOT-2026-MILK-091',
    productName: 'San Miguel Fresh Milk 1L',
    barcode: '4800016644012',
    supplier: 'San Miguel Dairy Corp',
    brand: 'Magnolia Pure Fresh',
    size: '1L',
    quantity: 45,
    currentStageIndex: 2, // Inventory
    currentProcedure: 'Inventory',
    lastProcedureDate: '2026-05-15T09:30:00Z',
    temperature: '3.8°C',
    humidity: '55%',
    carrier: 'ColdTrans Express Truck #14',
    inspector: 'Maria Santos',
    updatedAt: '2026-05-15T09:30:00Z',
    status: 'Stocked in Canteen Inventory (Chiller B-2)',
    claimedBy: null,
    claimedByEmployeeId: null,
    claimedByDepartment: null,
    claimedAt: null,
    milestones: [
      { stageId: 'ordered', stageName: 'Ordered', timestamp: '2026-05-13T08:00:00Z', note: 'Purchase Order #PO-NKB-2026-104 placed with San Miguel Dairy Corp' },
      { stageId: 'receiving_dock', stageName: 'Receiving Dock', timestamp: '2026-05-14T07:30:00Z', note: 'Refrigerated logistics unit arrived. Dock temp 3.8°C and barcode 4800016644012 verified' },
      { stageId: 'inventory', stageName: 'Inventory', timestamp: '2026-05-15T09:30:00Z', note: 'Stocked in Canteen Chiller B-2. Active inventory count updated to 45 units' }
    ]
  },
  {
    id: 'journey-2',
    batchNumber: 'LOT-2026-BEEF-104',
    productName: 'Purefoods Corned Beef 210g',
    barcode: '4800016600216',
    supplier: 'San Miguel Foods Inc',
    brand: 'Purefoods',
    size: '210g',
    quantity: 2,
    currentStageIndex: 3, // Employee Claimed
    currentProcedure: 'Claimed by Employee',
    lastProcedureDate: '2026-05-15T12:30:00Z',
    temperature: '24.5°C',
    humidity: '48%',
    carrier: 'SM Foods Logistics Delivery Unit #5',
    inspector: 'Maria Santos (Canteen Supervisor)',
    updatedAt: '2026-05-15T12:30:00Z',
    status: 'Claimed & Released to Merry Jean I. ALONZO (Production)',
    claimedBy: 'Merry Jean I. ALONZO',
    claimedByEmployeeId: 'NKB052026-0003',
    claimedByDepartment: 'Production',
    claimedAt: '2026-05-15T12:30:00Z',
    milestones: [
      { stageId: 'ordered', stageName: 'Ordered', timestamp: '2026-05-12T09:00:00Z', note: 'PO placed for Canned Grocery supplies' },
      { stageId: 'receiving_dock', stageName: 'Receiving Dock', timestamp: '2026-05-13T10:15:00Z', note: 'Scanned at dock. Expiration date 2027-03-30 verified' },
      { stageId: 'inventory', stageName: 'Inventory', timestamp: '2026-05-14T11:00:00Z', note: 'Stocked on Shelf G-4. Available for POS checkout' },
      { stageId: 'employee_claimed', stageName: 'Employee Claimed', timestamp: '2026-05-15T12:30:00Z', note: 'Handed over to Merry Jean I. ALONZO (NKB052026-0003, Production) with Gate Pass GP-2026-0038 via Salary Deduction' }
    ]
  },
  {
    id: 'journey-3',
    batchNumber: 'LOT-2026-NOODLES-220',
    productName: 'Nissin Cup Noodles Seafood 60g',
    barcode: '4800841200115',
    supplier: 'Monde Nissin Corp',
    brand: 'Nissin',
    size: '60g',
    quantity: 2,
    currentStageIndex: 4, // Voided Back to Inventory
    currentProcedure: 'Voided Back to Inventory',
    lastProcedureDate: '2026-05-15T14:45:00Z',
    temperature: '25.0°C',
    humidity: '50%',
    carrier: 'Apex Logistics Freight #7',
    inspector: 'Maria Santos (Canteen Supervisor)',
    updatedAt: '2026-05-15T14:45:00Z',
    status: 'Voided Back to Inventory - Returned by Glenn L. NOBLEZA',
    claimedBy: 'Glenn L. NOBLEZA',
    claimedByEmployeeId: 'NKB052026-0036',
    claimedByDepartment: 'Plant Maintenance',
    claimedAt: '2026-05-15T13:00:00Z',
    voidedBy: 'Maria Santos (Canteen Supervisor)',
    voidCardBadgeId: 'MGR-CARD-001',
    voidReason: 'Employee emergency shift call-out; grocery order cancelled and unopened items restored to inventory',
    voidedAt: '2026-05-15T14:45:00Z',
    stockRestored: true,
    milestones: [
      { stageId: 'ordered', stageName: 'Ordered', timestamp: '2026-05-11T14:00:00Z', note: 'Inbound PO confirmed with Monde Nissin Corp' },
      { stageId: 'receiving_dock', stageName: 'Receiving Dock', timestamp: '2026-05-12T16:20:00Z', note: 'Pallet received and dock barcode validated' },
      { stageId: 'inventory', stageName: 'Inventory', timestamp: '2026-05-13T09:00:00Z', note: 'Arranged in canteen quick-serve section' },
      { stageId: 'employee_claimed', stageName: 'Employee Claimed', timestamp: '2026-05-15T13:00:00Z', note: 'Purchased at POS by Glenn L. NOBLEZA (NKB052026-0036, Plant Maintenance)' },
      { stageId: 'voided_back', stageName: 'Voided Back to Inventory', timestamp: '2026-05-15T14:45:00Z', note: 'Supervisor Maria Santos approved void. Stock restored (+2) to active inventory. Reason: Employee emergency shift call-out' }
    ]
  },
  {
    id: 'journey-4',
    batchNumber: 'LOT-2026-TOOL-077',
    productName: 'NKB Master Mechanic Tool Chest & Socket Set (120-pc)',
    barcode: '4809012340035',
    supplier: 'NKB Plant 1 - Tooling & Metal Forming Division',
    brand: 'NKB Heavy Industries',
    size: '120-pc Professional Set',
    quantity: 1,
    currentStageIndex: 3, // Employee Claimed
    currentProcedure: 'Claimed by Employee',
    lastProcedureDate: '2026-05-15T15:20:00Z',
    temperature: '24.0°C',
    humidity: '42%',
    carrier: 'Internal Plant Flatbed #1',
    inspector: 'Earl John DELOS SANTOS (Warehouse Lead)',
    updatedAt: '2026-05-15T15:20:00Z',
    status: 'Claimed & Released to Katherine A. BELLA (CEO)',
    claimedBy: 'Katherine A. BELLA',
    claimedByEmployeeId: 'NKB052026-0001',
    claimedByDepartment: 'Executive Leadership',
    claimedAt: '2026-05-15T15:20:00Z',
    milestones: [
      { stageId: 'ordered', stageName: 'Ordered', timestamp: '2026-05-13T10:00:00Z', note: 'Personal PO request submitted; approved by Executive Management' },
      { stageId: 'receiving_dock', stageName: 'Receiving Dock', timestamp: '2026-05-14T11:30:00Z', note: 'Internal plant transit completed from Plant 1' },
      { stageId: 'inventory', stageName: 'Inventory', timestamp: '2026-05-15T09:00:00Z', note: 'Staged in Canteen Personal PO Holding Bay' },
      { stageId: 'employee_claimed', stageName: 'Employee Claimed', timestamp: '2026-05-15T15:20:00Z', note: 'Inspected and handed over to Katherine A. BELLA (NKB052026-0001). Gate pass verified by plant security' }
    ]
  },
  {
    id: 'journey-5',
    batchNumber: 'LOT-2026-TEA-339',
    productName: 'C2 Green Tea Apple 500ml',
    barcode: '4807770270014',
    supplier: 'Universal Robina Corp',
    brand: 'URC C2',
    size: '500ml',
    quantity: 80,
    currentStageIndex: 1, // Receiving Dock
    currentProcedure: 'Receiving Dock',
    lastProcedureDate: '2026-05-15T08:00:00Z',
    temperature: '26.0°C',
    humidity: '52%',
    carrier: 'Universal Robina Logistics Truck #9',
    inspector: 'Receiving Dock Officer',
    updatedAt: '2026-05-15T08:00:00Z',
    status: 'At Inbound Receiving Dock (Dock Scanning & Inspection)',
    claimedBy: null,
    claimedByEmployeeId: null,
    claimedByDepartment: null,
    claimedAt: null,
    milestones: [
      { stageId: 'ordered', stageName: 'Ordered', timestamp: '2026-05-14T08:00:00Z', note: 'PO-2026-0992 sent to Universal Robina Corp' },
      { stageId: 'receiving_dock', stageName: 'Receiving Dock', timestamp: '2026-05-15T08:00:00Z', note: 'Shipment docked at Bay 2. Barcode scanned, best-before 2026-12-10 verified' }
    ]
  },
  {
    id: 'journey-6',
    batchNumber: 'LOT-2026-BREAD-055',
    productName: 'Gardenia Classic White Bread 600g',
    barcode: '4800047820102',
    supplier: 'Gardenia Bakeries Phils',
    brand: 'Gardenia',
    size: '600g',
    quantity: 24,
    currentStageIndex: 2, // Inventory
    currentProcedure: 'Inventory',
    lastProcedureDate: '2026-05-14T14:30:00Z',
    temperature: '23.5°C',
    humidity: '46%',
    carrier: 'Gardenia Direct Store Fleet Unit #3',
    inspector: 'Maria Santos',
    updatedAt: '2026-05-14T14:30:00Z',
    status: 'Stocked in Canteen Inventory (Bakery Rack A-1)',
    claimedBy: null,
    claimedByEmployeeId: null,
    claimedByDepartment: null,
    claimedAt: null,
    milestones: [
      { stageId: 'ordered', stageName: 'Ordered', timestamp: '2026-05-13T07:00:00Z', note: 'Direct store delivery order placed' },
      { stageId: 'receiving_dock', stageName: 'Receiving Dock', timestamp: '2026-05-14T11:00:00Z', note: 'Dock barcode check passed. Expiration 2026-05-25 noted' },
      { stageId: 'inventory', stageName: 'Inventory', timestamp: '2026-05-14T14:30:00Z', note: 'Stocked on bakery display shelf' }
    ]
  }
];

