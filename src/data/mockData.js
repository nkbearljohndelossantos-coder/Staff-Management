import generatedStaffData from './generatedStaff.json';
import canteenInventoryData from './canteenInventory.json';

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

export const INITIAL_STAFF = generatedStaffData.staff.map(s => {
  const last = (s.lastName || '').trim().toUpperCase();
  const first = (s.firstName || '').trim().toUpperCase();
  const raw = last && first && last !== first ? `${last}, ${first}` : (s.rawName || last || first).trim().toUpperCase();
  return {
    ...s,
    firstName: first,
    lastName: last,
    rawName: raw,
    dateHired: s.hireDate || '2026-05-01',
  hireDate: s.hireDate || '2026-05-01',
  birthday: s.birthday || '1995-06-15',
  address: s.address || 'Subic Bay Gateway Park, Olongapo City, Zambales',
  sssNo: s.sssNo || '',
  philHealthNo: s.philHealthNo || '12-094820192-1',
  hdmfNo: s.hdmfNo || '1210-9482-0192',
  salaryRateType: s.salaryRateType || 'monthly',
  workScheduleType: s.workScheduleType || '6_days', // '5_days' | '6_days'
  salaryRate: s.salaryRate !== undefined ? s.salaryRate : (s.baseSalary || 0),
  filedSalary: s.filedSalary !== undefined ? s.filedSalary : 0,
  sickLeaveTotal: s.sickLeaveTotal !== undefined ? s.sickLeaveTotal : 5,
  sickLeaveRemaining: s.sickLeaveRemaining !== undefined ? s.sickLeaveRemaining : 5,
  vacationLeaveTotal: s.vacationLeaveTotal !== undefined ? s.vacationLeaveTotal : 5,
  vacationLeaveRemaining: s.vacationLeaveRemaining !== undefined ? s.vacationLeaveRemaining : 5,
  documents: s.documents || []
  };
});

// No demo attendance logs
export const INITIAL_ATTENDANCE = [];

// No demo pay runs
export const INITIAL_PAY_RUNS = [];

// Initial Coop Share Capital Balances and Ledger (Clean - 0 balances)
export const INITIAL_COOP_BALANCES = {};

export const INITIAL_COOP_LEDGER = [];

export const INITIAL_COOP_WITHDRAWALS = [];

// Loan Categories with specific monthly rates
// Policy: Cash Loan 2%, Education 2.5%, Cash Advance 1.5% (per cut-off), Medical 3%, Application 3%, Motor 2.5%
export const LOAN_CATEGORIES = [
  { id: 'cash', label: 'Personal Cash Loan', monthlyRate: 2, icon: 'Banknote', desc: 'Standard cash assistance for personal needs (2% monthly)' },
  { id: 'education', label: 'Tuition & Education Loan', monthlyRate: 2.5, icon: 'GraduationCap', desc: 'Tuition fees, books, and school supplies (2.5% monthly)' },
  { id: 'medical', label: 'Medical Emergency Loan', monthlyRate: 3, icon: 'Activity', desc: 'Hospitalization and prescription medicine (3% monthly)' },
  { id: 'application', label: 'Application & Equipment Loan', monthlyRate: 3, icon: 'Tv', desc: 'Equipment, appliances, and application loans (3% monthly)' },
  { id: 'appliance', label: 'Home Appliance & Tools Loan', monthlyRate: 3, icon: 'Tv', desc: 'Refrigerators, air conditioning, home appliances (3% monthly)' },
  { id: 'motor', label: 'Motorcycle & Vehicle Loan', monthlyRate: 2.5, icon: 'Bike', desc: 'Transportation and vehicle maintenance (2.5% monthly)' },
  { id: 'gadget', label: 'Laptop & Gadget Loan', monthlyRate: 3, icon: 'Smartphone', desc: 'Laptops, mobile devices, and electronics (3% monthly)' }
];

export const INITIAL_LOANS = [];

// Canteen Cash Fund (Clean)
export const INITIAL_CANTEEN_DRAWER = {
  balance: 0,
  transactions: []
};

export const INITIAL_CASH_ADVANCES = [];

// Canteen Inventory Supplies Catalog (Official 355 products from Canteen_Inventory.xlsx)
export const INITIAL_CANTEEN_INVENTORY = [
  ...canteenInventoryData.products
];

// Default Canteen Supply Categories
export const DEFAULT_CANTEEN_CATEGORIES = [
  ...canteenInventoryData.categories
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

// Baseline Canteen Supplier Sales Invoices (Official Supplier Intake Receipts)
export const INITIAL_CANTEEN_SALES_INVOICES = [
  {
    id: 'INV-20260925-001',
    invoiceNumber: 'SI-2026-8812',
    supplier: 'San Miguel Dairy Corp',
    purchaseDate: '2026-09-25',
    receivedDate: '2026-09-25',
    paymentMethod: 'Company Fund',
    paymentStatus: 'Paid',
    encodedBy: 'Glen Nobleza (Canteen Staff)',
    notes: 'Official Inbound Delivery - San Miguel Dairy Milk & Butter delivery',
    totalAmount: 5120.00,
    itemsCount: 2,
    totalUnits: 75,
    status: 'POSTED_TO_INVENTORY',
    createdAt: '2026-09-25T08:30:00.000Z',
    items: [
      {
        id: 'item-8812-1',
        name: 'San Miguel Fresh Milk 1L',
        category: 'Beverages & Dairy',
        brand: 'Magnolia Pure Fresh',
        company: 'San Miguel Dairy Corp',
        size: '1L',
        unit: 'Bottle',
        quantity: 45,
        costPrice: 82.00,
        sellingPrice: 98.00,
        totalCost: 3690.00,
        expirationDate: '2027-03-31',
        barcode: '4800016644012'
      },
      {
        id: 'item-8812-2',
        name: 'Magnolia Gold Pure Butter 225g',
        category: 'Beverages & Dairy',
        brand: 'Magnolia',
        company: 'San Miguel Dairy Corp',
        size: '225g',
        unit: 'Block',
        quantity: 30,
        costPrice: 47.66,
        sellingPrice: 58.00,
        totalCost: 1430.00,
        expirationDate: '2027-01-15',
        barcode: '4800016644029'
      }
    ]
  },
  {
    id: 'INV-20260926-002',
    invoiceNumber: 'SI-2026-9045',
    supplier: 'Universal Robina Corp',
    purchaseDate: '2026-09-26',
    receivedDate: '2026-09-26',
    paymentMethod: 'Cash',
    paymentStatus: 'Paid',
    encodedBy: 'Glen Nobleza (Canteen Staff)',
    notes: 'Official Inbound Delivery - URC Beverages & Snacks replenishment',
    totalAmount: 3820.00,
    itemsCount: 2,
    totalUnits: 140,
    status: 'POSTED_TO_INVENTORY',
    createdAt: '2026-09-26T09:15:00.000Z',
    items: [
      {
        id: 'item-9045-1',
        name: 'C2 Green Tea Apple 500ml',
        category: 'Cold Beverages',
        brand: 'URC C2',
        company: 'Universal Robina Corp',
        size: '500ml',
        unit: 'Bottle',
        quantity: 80,
        costPrice: 22.00,
        sellingPrice: 30.00,
        totalCost: 1760.00,
        expirationDate: '2026-12-10',
        barcode: '4807770270014'
      },
      {
        id: 'item-9045-2',
        name: 'Piattos Cheese Flavored Potato Crisps 85g',
        category: 'Chips',
        brand: 'Jack \'n Jill',
        company: 'Universal Robina Corp',
        size: '85g',
        unit: 'Pack',
        quantity: 60,
        costPrice: 34.33,
        sellingPrice: 42.00,
        totalCost: 2060.00,
        expirationDate: '2027-04-20',
        barcode: '4800016050127'
      }
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

// No demo product journeys
export const INITIAL_PRODUCT_JOURNEYS = [];

// Active Leave Requests (Clean - Starts empty for production)
export const INITIAL_LEAVE_REQUESTS = [];

// Active Overtime Requests (Clean - Starts empty for production)
export const INITIAL_OVERTIME_REQUESTS = [];

