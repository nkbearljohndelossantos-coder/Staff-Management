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

// Canteen Inventory Supplies Catalog (with standard products)
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
