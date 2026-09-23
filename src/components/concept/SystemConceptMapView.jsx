import React, { useState } from 'react';
import {
  Network,
  Workflow,
  Shield,
  ShieldCheck,
  Users,
  Briefcase,
  ScanLine,
  Calculator,
  Landmark,
  Utensils,
  FileText,
  CheckCircle2,
  ArrowRight,
  Search,
  Printer,
  Eye,
  Layers,
  Lock,
  Coins,
  Package,
  Clock,
  ArrowUpRight,
  Check,
  Share2,
  HelpCircle,
  Activity,
  FileSpreadsheet,
  Compass,
  Sparkles,
  Building2,
  Calendar,
  AlertCircle,
  Maximize2,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SystemConceptMapView() {
  const { currentUser, isSuperAdmin, isHR, isCanteen } = useApp();

  // Role perspective: If CEO/IT Admin, they can switch between CEO Full Master and individual role views
  const [selectedPerspective, setSelectedPerspective] = useState(
    currentUser?.role === 'ceo' || currentUser?.role === 'it_admin' ? 'ceo' : currentUser?.role || 'employee'
  );

  // Active View Mode: 'map' (Visual Topology), 'pipelines' (Sequence Workflows), 'rbac' (Security Matrix)
  const [viewMode, setViewMode] = useState('map');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('all');

  // Selected Node for Deep-Dive Modal/Drawer
  const [selectedNode, setSelectedNode] = useState(null);

  // Quick Info Target for Subsystems Description Summary Popup
  const [quickInfoTarget, setQuickInfoTarget] = useState(null);

  // Active Pipeline Simulator Step
  const [activePipelineId, setActivePipelineId] = useState('canteen_coop');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Determine current active role perspective
  const effectiveRole = isSuperAdmin ? selectedPerspective : (currentUser?.role || 'employee');
  const isCeoMaster = effectiveRole === 'ceo' || effectiveRole === 'it_admin';

  // -------------------------------------------------------------
  // CLUSTERS & NODES MASTER REPOSITORY
  // -------------------------------------------------------------
  const CLUSTERS = [
    {
      id: 'governance',
      title: '1. Executive Governance & RBAC Security',
      subtitle: 'Universal Oversight & Policy Engine',
      roleBadge: 'CEO & IT Admin',
      description: 'System-wide account governance, role delegation, immutable audit trails, and financial policy administration.'
    },
    {
      id: 'hr_ops',
      title: '2. HR Operations & Personnel Masterfiles',
      subtitle: 'Staff Lifecycle & Digital Identity',
      roleBadge: 'HR Management',
      description: 'Employee onboarding, digital barcode ID badge generation, department/position hierarchy, and leave allocations.'
    },
    {
      id: 'attendance',
      title: '3. Timeclock & Biometric Punches',
      subtitle: 'Plant Entrance Terminal Kiosk',
      roleBadge: 'HR & Kiosk',
      description: 'Real-time barcode/ID shift logging, shift differentials, overtime aggregation, tardiness, and absence deduction feeds.'
    },
    {
      id: 'payroll',
      title: '4. Payroll Calculation Engine',
      subtitle: 'Gross-to-Net & Statutory Tax Remittance',
      roleBadge: 'Accounting & Finance',
      description: 'Semi-monthly cutoff processing, PhilHealth/SSS/Pag-IBIG/BIR tax withholding tables, 13th month provision, and bank transmittals.'
    },
    {
      id: 'coop',
      title: '5. Cooperative Capital & Credit Union',
      subtitle: 'Member Equity, Loans & Bank Reconciliation',
      roleBadge: 'HR & Accounting',
      description: 'Member share capital balances, 2-stage Cash Loans (2%/3%/5%), withdrawal approvals, and bank payroll deduction reconciliation.'
    },
    {
      id: 'canteen',
      title: '6. Canteen POS & Supply Inventory',
      subtitle: 'Barcode Register & Late Encoding Intake',
      roleBadge: 'Canteen Staff',
      description: 'Barcode POS checkout (Dine-In vs Grocery, Cash vs Salary Deduction), supervisor card voids with stock returns, and late delivery memos.'
    },
    {
      id: 'logistics',
      title: '7. Plant Security Gate Passes & Live Tracking',
      subtitle: 'Half-A4 (A5) Manifests & Egress Clearance',
      roleBadge: 'Canteen & Plant Security',
      description: 'Official Half-A4 (148mm × 210mm) security exit pass generation, gate inspection, dual signature clearance, and live product movement tracking.'
    },
    {
      id: 'manufacturing',
      title: '8. Factory Manufacturing & Personal Request Orders',
      subtitle: 'Discounted Industrial Products & Tools',
      roleBadge: 'Operations & Accounting',
      description: 'NKB factory manufactured goods (arc welders, electric motors, modular steel workbenches) ordered for personal use via Cash or COOP.'
    },
    {
      id: 'ess',
      title: '9. Employee Self-Service (ESS)',
      subtitle: 'Worker Portal & Benefits Transparency',
      roleBadge: 'Staff Employee',
      description: 'Confidential payslip viewer & print, digital ID badge printing, loan/advance applications, request orders, and grocery gate passes.'
    }
  ];

  const NODES = [
    // Governance Nodes
    {
      id: 'gov-1',
      clusterId: 'governance',
      title: 'Executive Master Control & Audit Ledger',
      code: 'GOV-MASTER',
      owner: 'CEO (Mark Sterling)',
      roles: ['ceo', 'it_admin'],
      summary: 'Central dashboard monitoring all operational accounts, payroll disbursements, cooperative equity, and canteen registers.',
      inputs: ['All subsystem audit logs', 'Pay run batches', 'COOP ledgers', 'Gate pass manifests'],
      outputs: ['Executive reports', 'System policy directives', 'Cross-role overrides'],
      storageKey: 'nkb_system_config',
      formula: 'Universal read/write access across all sub-accounts with zero restriction',
      security: 'Super Admin credentials required (CEO & IT Admin only)'
    },
    {
      id: 'gov-2',
      clusterId: 'governance',
      title: 'RBAC Security & Role Boundaries',
      code: 'SEC-RBAC',
      owner: 'IT Admin (Sarah Jenkins)',
      roles: ['ceo', 'it_admin'],
      summary: 'Enforces strict role separation so non-admin accounts cannot access other workspaces or administrative tools.',
      inputs: ['User session credentials', 'Staff role assignments'],
      outputs: ['Side navigation filtering', 'Route authorization tokens', 'Permission denial audit'],
      storageKey: 'nkb_user_sessions',
      formula: 'isTabAuthorized(tabId, role) -> Strict boolean gating',
      security: 'Hardware and session token level access control'
    },

    // HR Operations Nodes
    {
      id: 'hr-1',
      clusterId: 'hr_ops',
      title: 'Staff Masterfiles & Automated ID Generation',
      code: 'HR-STAFF',
      owner: 'HR Department (Genevieve Anne A. JURADO)',
      roles: ['ceo', 'it_admin', 'hr', 'admin'],
      summary: 'Central employee directory maintaining personal data, employment status, compensation baselines, and unique barcodes.',
      inputs: ['New hire onboarding forms', 'Department / position mappings'],
      outputs: ['Automated Employee ID (EMP-2026-XXXX)', 'Code 128 barcode badge', 'Staff master record'],
      storageKey: 'nkb_staff_list',
      formula: 'Sequential auto-indexing with plant location code prefixes',
      security: 'HR and Super Admin write authority; Accounting read-only'
    },
    {
      id: 'hr-2',
      clusterId: 'hr_ops',
      title: 'Department Hierarchy & Position Taxonomy',
      code: 'HR-ORG',
      owner: 'HR Department (Genevieve Anne A. JURADO)',
      roles: ['ceo', 'it_admin', 'hr', 'admin'],
      summary: 'Defines factory organizational structure, operational departments (Mfg, QA, Logistics, Canteen, etc.), and salary grades.',
      inputs: ['Organizational restructuring memos', 'Job position benchmarks'],
      outputs: ['Department rosters', 'Base pay rate bounds', 'Approval hierarchy'],
      storageKey: 'nkb_departments, nkb_positions',
      formula: 'Tiered department classification with parent-child linkages',
      security: 'Restricted to HR Management & Executive approval'
    },

    // Timeclock Nodes
    {
      id: 'att-1',
      clusterId: 'attendance',
      title: 'Barcode ID Kiosk Timeclock Terminal',
      code: 'ATT-KIOSK',
      owner: 'HR Operations & Entrance Kiosk',
      roles: ['ceo', 'it_admin', 'hr', 'admin', 'employee'],
      summary: 'Entrance hall scanner kiosk where staff punch in/out using physical ID cards or mobile barcode displays.',
      inputs: ['Physical / Digital Barcode Scan (Code 128)', 'Current timestamp'],
      outputs: ['Time In / Time Out event logs', 'Daily punch summary', 'Shift status'],
      storageKey: 'nkb_attendance_logs',
      formula: 'Grace period = 15 mins; Tardiness penalty calculated per minute thereafter',
      security: 'Public scanner kiosk running in locked terminal mode'
    },
    {
      id: 'att-2',
      clusterId: 'attendance',
      title: 'Attendance Audit & Overtime Computation',
      code: 'ATT-AUDIT',
      owner: 'HR Attendance Auditor',
      roles: ['ceo', 'it_admin', 'hr', 'admin'],
      summary: 'Aggregates punch logs into payable regular hours, night differentials (10%), regular overtime (125%), and rest day overtime (130%).',
      inputs: ['Raw attendance punch logs', 'Shift schedules', 'Approved leave vouchers'],
      outputs: ['Semi-monthly hours summary', 'Tardiness/Absence deduction feed for Payroll'],
      storageKey: 'nkb_attendance_summary',
      formula: 'Regular Hrs = 8/day; OT = (BaseHourly * 1.25) * OTHours; ND = (BaseHourly * 0.10) * NDHours',
      security: 'HR verifies before passing immutable timesheet batch to Payroll'
    },

    // Payroll Nodes
    {
      id: 'pay-1',
      clusterId: 'payroll',
      title: 'Gross-to-Net Payroll Calculation Engine',
      code: 'PAY-CALC',
      owner: 'Finance & Accounting (Dorina NABONG)',
      roles: ['ceo', 'it_admin', 'accounting', 'finance'],
      summary: 'Executes mathematical computation of gross compensation, statutory social insurance deductions, loan amortizations, and take-home pay.',
      inputs: ['Staff base pay rates', 'HR verified attendance hours', 'Active loan amortization schedules', 'Canteen advances'],
      outputs: ['Draft pay run items', 'Detailed pay breakdown', 'Variance analysis'],
      storageKey: 'nkb_pay_runs',
      formula: 'Gross = Base + Allowances + OT + ND; Net = Gross - (SSS + PhilHealth + PagIBIG + Tax + Loans + Advances)',
      security: 'Strictly restricted to Accounting & Finance officers'
    },
    {
      id: 'pay-2',
      clusterId: 'payroll',
      title: 'Statutory Welfare & BIR Tax Withholding',
      code: 'PAY-TAX',
      owner: 'Accounting Compliance',
      roles: ['ceo', 'it_admin', 'accounting', 'finance'],
      summary: 'Applies Philippine statutory contribution tables (SSS 2026 bracket, PhilHealth 5% rate, Pag-IBIG ₱200 cap, and TRAIN Act withholding tax).',
      inputs: ['Employee gross taxable salary', 'Tax status / dependents'],
      outputs: ['SSS Employee/Employer share', 'PhilHealth share', 'Pag-IBIG share', 'BIR Form 2316 report'],
      storageKey: 'nkb_statutory_tables',
      formula: 'TRAIN Tax Brackets: Graduated 0% to 35% on excess over threshold',
      security: 'Regulatory tables locked against non-finance tampering'
    },
    {
      id: 'pay-3',
      clusterId: 'payroll',
      title: 'Bank Transmittal File Generator (BDO/BPI/Metrobank)',
      code: 'PAY-BANK',
      owner: 'Finance Disbursement Officer',
      roles: ['ceo', 'it_admin', 'accounting', 'finance'],
      summary: 'Generates formatted electronic payroll transmittal files for direct bank batch credit transfer to employee savings accounts.',
      inputs: ['Approved pay run batch', 'Employee bank account numbers'],
      outputs: ['Encrypted CSV/TXT bank transmittal file', 'Batch hash total', 'Bank disbursement acknowledgment'],
      storageKey: 'nkb_bank_transmittals',
      formula: 'Fixed-width format compliant with Philippine ACH / PESONet guidelines',
      security: 'Dual-approval required before electronic bank submission'
    },

    // Cooperative & Loans Nodes
    {
      id: 'coop-1',
      clusterId: 'coop',
      title: 'Coop Member Share Capital & Equity Ledger',
      code: 'COOP-EQUITY',
      owner: 'HR (Deposits) & Accounting (Withdrawals)',
      roles: ['ceo', 'it_admin', 'hr', 'accounting', 'admin'],
      summary: 'Tracks employee cooperative shares, member capital investments, dividend accumulations, and withdrawal disbursements.',
      inputs: ['Voluntary payroll share contributions', 'Direct member deposits', 'Withdrawal requests'],
      outputs: ['Current Share Capital balance', 'Dividend allocation statements', 'COOP ledger audit entries'],
      storageKey: 'nkb_coop_balances, nkb_coop_ledger',
      formula: 'Equity Balance = Sum(Deposits) + Dividends - Sum(Approved Withdrawals) - Sum(COOP PO Deductions)',
      security: 'HR accepts deposit requests; Accounting strictly controls fund release'
    },
    {
      id: 'coop-2',
      clusterId: 'coop',
      title: '2-Stage Multi-Category Cash Loans (2%, 3%, 5%)',
      code: 'COOP-LOAN',
      owner: 'Stage 1: HR · Stage 2: Accounting',
      roles: ['ceo', 'it_admin', 'hr', 'accounting', 'admin', 'employee'],
      summary: 'Multi-category employee credit system: Cash/Medical/Motor (2%/mo), Gadget/Education (3%/mo), Appliance (5%/mo).',
      inputs: ['Employee ESS loan application', 'HR Stage 1 Endorsement', 'Accounting Stage 2 Disbursement'],
      outputs: ['Approved loan agreement', 'Amortization schedule', 'Automatic semi-monthly payroll deduction queue'],
      storageKey: 'nkb_cash_loans',
      formula: 'Total Interest = Principal * MonthlyRate * TermMonths; Cutoff Deduction = (Principal + Interest) / (TermMonths * 2)',
      security: 'Stage 1 (HR Eligibility Endorsement) -> Stage 2 (Accounting Fund Release from COOP Pool)'
    },
    {
      id: 'coop-3',
      clusterId: 'coop',
      title: 'Canteen Salary Deduction & COOP Budget Reconciliation',
      code: 'COOP-CANTEEN-RECON',
      owner: 'HR Department & Finance / Accounting',
      roles: ['ceo', 'it_admin', 'hr', 'accounting', 'admin'],
      summary: 'Validates that Canteen transactions charged to Salary Deduction have been deducted in the bank payroll before debiting the employee COOP budget.',
      inputs: ['Canteen receipts marked "Salary Deduction"', 'Bank payroll disbursement confirmation'],
      outputs: ['COOP budget debit entry', 'Receipt status: "Confirmed by HR - Deducted to Bank & COOP"'],
      storageKey: 'nkb_canteen_receipts, nkb_coop_ledger',
      formula: 'Upon HR Bank Verification: coopBalances[staffId] -= ReceiptTotal; log to coopLedger',
      security: 'Strictly gated by HR confirmation after bank payroll confirmation'
    },

    // Canteen POS & Supply Inventory Nodes
    {
      id: 'cant-1',
      clusterId: 'canteen',
      title: 'Barcode POS Register & Dual-Nature Checkout',
      code: 'POS-CHECKOUT',
      owner: 'Canteen Operations & Inventory (Earl John DELOS SANTOS)',
      roles: ['ceo', 'it_admin', 'canteen'],
      summary: 'High-speed retail barcode scanner register. Distinguishes Dine-In vs Grocery and Cash vs Salary Deduction.',
      inputs: ['Barcode scan of pantry items / meals', 'Order Nature (Dine In / Grocery)', 'Payment Method (Cash / Salary Deduction)'],
      outputs: ['Official printed Canteen receipt', 'Inventory deduction', 'Gate Pass trigger (if Grocery)'],
      storageKey: 'nkb_canteen_receipts, nkb_canteen_inventory',
      formula: 'Net Receipt = Sum(ItemPrice * Qty) - Discounts; If Salary Deduction -> queues for HR verification',
      security: 'Supervisor authorization required for any line modification or void'
    },
    {
      id: 'cant-2',
      clusterId: 'canteen',
      title: 'Supply Inventory & Late Encoding Intake Protocol',
      code: 'INV-SUPPLY',
      owner: 'Canteen Inventory Officer',
      roles: ['ceo', 'it_admin', 'canteen'],
      summary: 'Inbound warehouse management for food logistics carriers. Captures product name, brand, barcode, stock count, and expiration date.',
      inputs: ['Supplier delivery invoices (San Miguel, Monde Nissin, Gardenia)', 'Physical barcode scan'],
      outputs: ['Live active stock levels', 'Expiration alerts (within 7 days)', 'Permanent [Late Encoded] audit label with carrier memo'],
      storageKey: 'nkb_canteen_inventory',
      formula: 'Stock Level = InitialQty + InboundReceived - SalesDeducted + VoidsRestocked',
      security: 'Locked against retroactive editing without documented delivery receipt memo'
    },
    {
      id: 'cant-3',
      clusterId: 'canteen',
      title: 'Card-Based Supervisor Void Ledger & Stock Restoration',
      code: 'POS-VOID',
      owner: 'Canteen Shift Supervisor',
      roles: ['ceo', 'it_admin', 'canteen'],
      summary: 'Security card / RFID scan authorized void mechanism. Reverses accidental transactions and returns items back to stock.',
      inputs: ['Supervisor RFID / Barcode card scan', 'Void reason memo', 'Original receipt #'],
      outputs: ['Restored inventory counts', 'Immutable void ledger entry', 'Supervisor badge record'],
      storageKey: 'nkb_canteen_void_logs',
      formula: 'Restores item.quantity += voidedQuantity; logs void timestamp and supervisor signature',
      security: 'Cashiers cannot void alone; physical supervisor card scan mandatory'
    },

    // Plant Logistics & Gate Passes Nodes
    {
      id: 'log-1',
      clusterId: 'logistics',
      title: 'Half-A4 (A5) Official Grocery Gate Pass Generator',
      code: 'GATE-PASS-GEN',
      owner: 'Canteen POS & Logistics System',
      roles: ['ceo', 'it_admin', 'canteen', 'employee'],
      summary: 'Automated document pipeline creating printable ISO A5 (148mm × 210mm) security exit permits for all grocery purchases.',
      inputs: ['Canteen grocery receipt', 'Bearer employee ID & department', 'Outbound item manifest'],
      outputs: ['Half-A4 printable Gate Pass document', 'Security document control # (GP-2026-XXXXX)', 'Document barcode'],
      storageKey: 'nkb_canteen_gate_passes',
      formula: '@page { size: A5 portrait; margin: 6mm; } -> Half-A4 browser print layout with dual signatures',
      security: 'Unique cryptographic document # generated per outbound grocery transaction'
    },
    {
      id: 'log-2',
      clusterId: 'logistics',
      title: 'Plant Perimeter Security Clearance & Barcode Scan',
      code: 'GATE-CLEARANCE',
      owner: 'Plant Gate Security (Main Gate & Gate 2)',
      roles: ['ceo', 'it_admin', 'canteen'],
      summary: 'Security guards at factory exit gates inspect physical groceries against the Half-A4 manifest and scan the document barcode.',
      inputs: ['Physical printed Gate Pass', 'Barcode scanner reading', 'Physical bag inspection'],
      outputs: ['Cleared at Gate timestamp', 'Security officer digital signature', 'Exit clearance audit'],
      storageKey: 'nkb_canteen_gate_passes',
      formula: 'Pass status changes from "Issued" to "Cleared at Gate" with officer metadata',
      security: 'Outbound goods cannot cross plant gates without verified clearance'
    },
    {
      id: 'log-3',
      clusterId: 'logistics',
      title: 'Live Interactive Product Journey & Categorized Excel Ledger',
      code: 'PROD-MAP',
      owner: 'Operations & Logistics Dispatch',
      roles: ['ceo', 'it_admin', 'canteen'],
      summary: '5-stage product lifecycle tracking across Ordered -> Receiving Dock -> Inventory -> Employee Claimed (with employee name, ID & department) -> Voided Back to Inventory (with supervisor audit). Generates printable multi-sheet Excel reports categorized by last procedure.',
      inputs: ['Inbound scan data (supplier, brand, expiry, size, prices)', 'Employee handover claim vouchers', 'Supervisor void authorizer badges'],
      outputs: ['5-stage visual transit telemetry', 'Categorized Printable Excel Workbooks', 'Signed employee claimant manifests', 'Void restock audit log'],
      storageKey: 'nkb_product_journeys',
      formula: 'Ordered -> Receiving Dock -> Inventory -> Employee Claimed -> Voided Back; XLSX categorized exports by last procedure',
      security: 'Visual transparency and audit records for Admin, Canteen, and Logistics operations'
    },

    // Factory Manufacturing & Personal Request Orders Nodes
    {
      id: 'mfg-1',
      clusterId: 'manufacturing',
      title: 'NKB Manufactured Products & Factory Pricing Catalog',
      code: 'MFG-CATALOG',
      owner: 'Manufacturing & Plant Operations',
      roles: ['ceo', 'it_admin', 'employee'],
      summary: 'Catalog of factory-manufactured equipment (arc welders, electric motors, steel workbenches, generators) with employee factory discounts.',
      inputs: ['Factory production lines (Plant 1, 2, 3, 4)', 'Model numbers & warranties'],
      outputs: ['Discounted employee prices (e.g. Save ₱3,700 on Welder)', 'Factory SKU specs'],
      storageKey: 'nkb_mfg_products',
      formula: 'Employee Price = Factory Cost + 10% Margin (Save 20% to 35% vs SRP)',
      security: 'Catalog prices verified by Factory Management'
    },
    {
      id: 'mfg-2',
      clusterId: 'manufacturing',
      title: 'Personal Request Order (PO) Processing & Payment Routing',
      code: 'MFG-PO-ORDER',
      owner: 'Accounting (Cash) & COOP (Shares)',
      roles: ['ceo', 'it_admin', 'accounting', 'hr', 'employee'],
      summary: 'Processes employee purchase orders for manufactured goods. Routes payment to either Cash (Receivable by Accounting) or COOP Share Capital.',
      inputs: ['Employee request order cart', 'Payment selection (Cash vs COOP)', 'Purpose statement'],
      outputs: ['Official PO Number (PO-2026-XXXX)', 'Accounting A/R invoice OR COOP balance deduction', 'Plant dispatch authorization'],
      storageKey: 'nkb_personal_pos',
      formula: 'If Cash: AccountsReceivable += Total; If COOP: coopBalances[staffId] -= Total',
      security: 'Requires accounting collection receipt or automated COOP capital verification'
    },

    // Employee Self-Service Nodes
    {
      id: 'ess-1',
      clusterId: 'ess',
      title: 'Employee Self-Service (ESS) Personal Portal',
      code: 'ESS-PORTAL',
      owner: 'All Staff Personnel',
      roles: ['ceo', 'it_admin', 'hr', 'accounting', 'canteen', 'employee'],
      summary: 'Self-service dashboard where staff view payslips, print digital ID badges, inspect attendance logs, and track loans.',
      inputs: ['Employee login credentials or Barcode scan'],
      outputs: ['Confidential payslip viewer', 'Printable Digital ID badge with barcode', 'Credit obligation schedules'],
      storageKey: 'nkb_staff_list, nkb_pay_runs',
      formula: 'Displays strictly data filtered to currentUser.staffId',
      security: 'Strictly isolated to individual authenticated employee'
    },
    {
      id: 'ess-2',
      clusterId: 'ess',
      title: 'Request Order Button & Gate Pass Download Center',
      code: 'ESS-REQUEST-CENTER',
      owner: 'All Staff Personnel',
      roles: ['ceo', 'it_admin', 'hr', 'accounting', 'canteen', 'employee'],
      summary: 'Prominent "Request Order" interface for manufactured products and 1-click access to print Half-A4 grocery Gate Passes.',
      inputs: ['Employee order request trigger', 'Gate pass history'],
      outputs: ['Request Order submission modal', 'Instant Half-A4 PDF gate pass printout'],
      storageKey: 'nkb_personal_pos, nkb_canteen_gate_passes',
      formula: 'Streamlined employee action modal with real-time stock and COOP balance checks',
      security: 'Personal authenticated self-service access'
    }
  ];

  // -------------------------------------------------------------
  // END-TO-END PIPELINES (WORKFLOW SEQUENCE SIMULATOR)
  // -------------------------------------------------------------
  const PIPELINES = [
    {
      id: 'canteen_coop',
      title: 'Pipeline 1: Canteen Salary Deduction & COOP Budget Reconciliation',
      badge: 'HR & Banking Integration',
      description: 'How a grocery or meal purchased via Salary Deduction moves through POS, Payroll bank payout, HR bank confirmation, and debits the employee COOP budget.',
      steps: [
        {
          step: 1,
          role: 'Canteen Cashier',
          title: 'Register Barcode Scan & Order Selection',
          detail: 'Cashier scans groceries/food. Selects Order Nature: "Grocery" and Payment Method: "Salary Deduction". Selects staff bearer.',
          icon: Utensils,
          nodeId: 'cant-1'
        },
        {
          step: 2,
          role: 'POS Automated Engine',
          title: 'Receipt Issuance & Half-A4 Gate Pass Creation',
          detail: 'System issues Receipt #RCT-2026-XXXXX flagged as "Pending HR Bank Confirmation". Automatically generates Half-A4 Gate Pass GP-2026-XXXXX for plant exit.',
          icon: FileText,
          nodeId: 'log-1'
        },
        {
          step: 3,
          role: 'Perimeter Security Guard',
          title: 'Plant Gate Inspection & Barcode Clearance',
          detail: 'Bearer presents Half-A4 Gate Pass at factory gate. Guard verifies grocery items against manifest, scans barcode, and marks "Cleared at Gate".',
          icon: ShieldCheck,
          nodeId: 'log-2'
        },
        {
          step: 4,
          role: 'Finance & Accounting (Dorina NABONG)',
          title: 'Semi-Monthly Payroll Deduction Inclusion',
          detail: 'During pay run computation, the Canteen Salary Deduction is deducted from the employee net pay and included in the bank transmittal schedule.',
          icon: Calculator,
          nodeId: 'pay-1'
        },
        {
          step: 5,
          role: 'HR Department (Genevieve Anne A. JURADO)',
          title: 'HR Bank Payroll Deduction Confirmation',
          detail: 'HR accesses the Cooperative & Loans Manager. Verifies bank confirmed the payroll deduction. Clicks "Confirm Bank Deduction & Deduct to COOP".',
          icon: Landmark,
          nodeId: 'coop-3'
        },
        {
          step: 6,
          role: 'General Ledger System',
          title: 'COOP Budget Debit & Immutable Audit Trail',
          detail: 'System debits employee COOP share balance (coopBalances[staffId] -= amount), logs immutable transaction in coopLedger, and marks receipt confirmed.',
          icon: CheckCircle2,
          nodeId: 'coop-1'
        }
      ]
    },
    {
      id: 'coop_loan_cycle',
      title: 'Pipeline 2: Cooperative Cash Loan 2-Stage Lifecycle',
      badge: 'Credit Governance',
      description: 'End-to-end processing of employee cash loans from ESS filing to HR Stage 1 endorsement, Accounting Stage 2 disbursement, and automated payroll amortization.',
      steps: [
        {
          step: 1,
          role: 'Staff Employee',
          title: 'ESS Loan Application Submission',
          detail: 'Employee selects loan category (Cash/Medical/Motor 2%, Gadget/Education 3%, Appliance 5%), principal amount, and repayment term (3-12 mos).',
          icon: Users,
          nodeId: 'coop-2'
        },
        {
          step: 2,
          role: 'HR Department (Genevieve Anne A. JURADO)',
          title: 'Stage 1: HR Eligibility Endorsement',
          detail: 'HR reviews employee tenure, performance standing, and debt-to-income ratio. Endorses application and forwards it to Accounting.',
          icon: Shield,
          nodeId: 'coop-2'
        },
        {
          step: 3,
          role: 'Finance & Accounting (Dorina NABONG)',
          title: 'Stage 2: Accounting Approval & Fund Release',
          detail: 'Accounting validates Cooperative Capital Pool liquidity. Approves voucher and disburses cash/check from the COOP pool.',
          icon: Calculator,
          nodeId: 'coop-2'
        },
        {
          step: 4,
          role: 'Payroll Calculation Engine',
          title: 'Automated Semi-Monthly Payroll Amortization',
          detail: 'Per-cutoff deduction is automatically inserted into subsequent pay runs until principal and interest are fully paid.',
          icon: Clock,
          nodeId: 'pay-1'
        }
      ]
    },
    {
      id: 'personal_po_mfg',
      title: 'Pipeline 3: Personal Request Order for NKB Manufactured Goods',
      badge: 'Manufacturing & Sales',
      description: 'How employees order factory-produced industrial machinery at employee factory rates via Cash (Accounting) or COOP Share Capital.',
      steps: [
        {
          step: 1,
          role: 'Staff Employee',
          title: 'Click "Request Order" in Employee Portal',
          detail: 'Employee selects NKB manufactured products (e.g. Inverter Arc Welder 200A, Electric Motor, Tool Chest) with factory discount pricing.',
          icon: Package,
          nodeId: 'mfg-1'
        },
        {
          step: 2,
          role: 'Employee Portal Checkout',
          title: 'Payment Selection: Cash or COOP Share Capital',
          detail: 'Option A: Cash (Receivable by Accounting at Cashier). Option B: Direct deduction from available COOP Share balance.',
          icon: Coins,
          nodeId: 'mfg-2'
        },
        {
          step: 3,
          role: 'Accounting / COOP Treasury',
          title: 'Financial Settlement & Receipt Acknowledgment',
          detail: 'If Cash, Accounting Cashier collects cash and issues official receipt. If COOP, system instantly verifies and debits member equity.',
          icon: Landmark,
          nodeId: 'mfg-2'
        },
        {
          step: 4,
          role: 'Factory Plant Dispatch',
          title: 'Production Verification & Item Handover',
          detail: 'Dispatch verifies PO number, cross-checks factory SKU and model number, and executes official customer handover.',
          icon: CheckCircle2,
          nodeId: 'mfg-2'
        }
      ]
    }
  ];

  // Filter nodes based on active role perspective, cluster filter, and search query
  const filteredNodes = NODES.filter(node => {
    // Role visibility filter
    if (!isCeoMaster) {
      if (!node.roles.includes(effectiveRole)) return false;
    }
    // Cluster filter
    if (selectedClusterFilter !== 'all' && node.clusterId !== selectedClusterFilter) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.title.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q) ||
        node.owner.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Current active pipeline
  const activePipeline = PIPELINES.find(p => p.id === activePipelineId) || PIPELINES[0];

  return (
    <div className="space-y-6">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & ROLE PERSPECTIVE SWITCHER */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <Network className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    NKB System Concept Map &amp; Architecture
                  </h1>
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white border border-slate-800">
                    {isCeoMaster ? 'Full Master Map' : `${effectiveRole.toUpperCase()} View`}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {isCeoMaster 
                    ? 'Comprehensive 360° enterprise architecture blueprint with all subsystems, role boundaries & data flows'
                    : `Role-tailored architectural map and operational touchpoints for ${currentUser?.name || 'current account'}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools: Print / View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'map'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Concept Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pipelines')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'pipelines'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Workflow className="h-3.5 w-3.5" />
                Data Pipelines
              </button>
              <button
                type="button"
                onClick={() => setViewMode('rbac')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'rbac'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                RBAC Matrix
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-700" />
              Print Map
            </button>
          </div>
        </div>

        {/* CEO / SUPER ADMIN PERSPECTIVE CONTROL BAR */}
        {isSuperAdmin && (
          <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-2xl border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  CEO Executive Perspective Switcher
                </span>
                <span className="text-[10px] text-slate-500">
                  Preview exactly how each role experiences the system architecture, or view the complete master map.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ceo', label: '👑 CEO Full Master Map', roleClass: 'font-black' },
                { id: 'hr', label: 'HR Director View', roleClass: 'font-semibold' },
                { id: 'accounting', label: 'Accounting Officer View', roleClass: 'font-semibold' },
                { id: 'canteen', label: 'Canteen Operations View', roleClass: 'font-semibold' },
                { id: 'employee', label: 'Employee ESS View', roleClass: 'font-semibold' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPerspective(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition cursor-pointer border ${
                    selectedPerspective === p.id
                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NON-SUPER ADMIN ROLE BANNER */}
        {!isSuperAdmin && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-slate-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Customized for: {currentUser?.name} ({currentUser?.role?.toUpperCase()})
                </span>
                <span className="text-[11px] text-slate-500">
                  Showing nodes, data inputs, and downstream connections authorized for your operational position.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-800">
              Role Scope: Authorized Only
            </span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN VIEW 1: CONCEPT MAP TOPOLOGY */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subsystems, nodes, algorithms, formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 shrink-0">Cluster:</span>
              <select
                value={selectedClusterFilter}
                onChange={(e) => setSelectedClusterFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="all">All Clusters ({NODES.length} Nodes)</option>
                {CLUSTERS.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* CLUSTERS ACCORDION / GRID */}
          <div className="space-y-6">
            {CLUSTERS.map((cluster) => {
              const clusterNodes = filteredNodes.filter(n => n.clusterId === cluster.id);
              if (clusterNodes.length === 0) return null;

              return (
                <div 
                  key={cluster.id} 
                  className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden"
                >
                  {/* Cluster Header */}
                  <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          {cluster.title}
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          {clusterNodes.length} {clusterNodes.length === 1 ? 'Node' : 'Nodes'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{cluster.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xl">
                        Owner: {cluster.roleBadge}
                      </span>
                    </div>
                  </div>

                  {/* Nodes Grid */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clusterNodes.map((node) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className="group p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {node.code}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {node.owner.split(' ')[0]}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-slate-900 group-hover:text-slate-800 transition line-clamp-2">
                            {node.title}
                          </h3>

                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                            {node.summary}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[10px]">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold">Inputs:</span>
                            <span className="font-mono text-slate-800">{node.inputs.length} Sources</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="font-semibold">Storage:</span>
                            <span className="font-mono text-slate-700 truncate max-w-[140px]">{node.storageKey}</span>
                          </div>
                          <div className="flex items-center justify-end text-slate-900 font-bold pt-1 gap-1 text-[11px]">
                            <span>Inspect Node</span>
                            <ArrowRight className="h-3 w-3 text-slate-600 group-hover:translate-x-0.5 transition" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MAIN VIEW 2: DATA PIPELINES (WORKFLOW SIMULATOR) */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'pipelines' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">
                End-to-End Operational Workflow Pipelines
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trace real-time data handoffs and approval states across multiple departments.
              </p>
            </div>

            {/* Pipeline Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {PIPELINES.map((pipe) => (
                <button
                  key={pipe.id}
                  type="button"
                  onClick={() => {
                    setActivePipelineId(pipe.id);
                    setCurrentStepIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    activePipelineId === pipe.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pipe.badge}
                </button>
              ))}
            </div>
          </div>

          {/* Active Pipeline Header Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white">
                Active Simulation
              </span>
              <span className="text-xs font-mono text-slate-500 font-bold">
                Step {currentStepIndex + 1} of {activePipeline.steps.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">{activePipeline.title}</h3>
            <p className="text-xs text-slate-600">{activePipeline.description}</p>
          </div>

          {/* Step-by-Step Interactive Workflow Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePipeline.steps.map((step, idx) => {
              const StepIcon = step.icon || ArrowRight;
              const isCurrent = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;

              return (
                <div
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`p-4 rounded-2xl border transition cursor-pointer relative space-y-2.5 ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]'
                      : isPast
                        ? 'bg-slate-100 border-slate-300 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isCurrent ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                    }`}>
                      Stage {step.step}
                    </span>
                    <StepIcon className={`h-4 w-4 ${isCurrent ? 'text-white' : 'text-slate-600'}`} />
                  </div>

                  <div>
                    <span className={`text-[10px] font-bold block ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                      {step.role}
                    </span>
                    <h4 className={`text-xs font-black mt-0.5 ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                      {step.title}
                    </h4>
                  </div>

                  <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-slate-200' : 'text-slate-600'}`}>
                    {step.detail}
                  </p>

                  <div className="pt-2 border-t border-slate-200/40 flex items-center justify-between text-[10px]">
                    <span className={isCurrent ? 'text-slate-300' : 'text-slate-400'}>
                      Node: <span className="font-mono font-bold">{step.nodeId}</span>
                    </span>
                    {isPast && <span className="font-bold text-slate-700 flex items-center gap-1">✓ Complete</span>}
                    {isCurrent && <span className="font-bold text-white animate-pulse">● Active Stage</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stepper Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous Stage
            </button>
            <button
              type="button"
              disabled={currentStepIndex === activePipeline.steps.length - 1}
              onClick={() => setCurrentStepIndex(prev => Math.min(activePipeline.steps.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              Next Stage
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MAIN VIEW 3: RBAC SECURITY & AUTHORITY MATRIX */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'rbac' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Role-Based Access Control (RBAC) Governance Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Strict operational boundaries declared for each account category.
              </p>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Universal Audit Policy Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">Subsystem / Function</th>
                  <th className="px-3 py-3 text-center">CEO &amp; IT Admin</th>
                  <th className="px-3 py-3 text-center">HR Director</th>
                  <th className="px-3 py-3 text-center">Accounting Officer</th>
                  <th className="px-3 py-3 text-center">Canteen Staff</th>
                  <th className="px-3 py-3 text-center">Plant Security</th>
                  <th className="px-3 py-3 text-center">Regular Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  {
                    code: 'SEC-GOV',
                    func: 'Universal System Access & Role Switcher',
                    category: 'Executive Governance & Security',
                    owner: 'Executive CEO & IT Super Admin',
                    summary: 'Grants universal, unrestricted administrative access across all system modules, account delegations, and role simulations. Strictly restricted to CEO and IT Super Admin.',
                    ceo: 'FULL', hr: 'DENIED', acct: 'DENIED', cant: 'DENIED', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'HR-STAFF',
                    func: 'Staff Masterfiles & ID Generation',
                    category: 'Personnel Management',
                    owner: 'Human Resources Department',
                    summary: 'Centralizes employee master records, automated employee ID assignment (EMP-2026-XXXX), and printable Code 128 barcode badge generation.',
                    ceo: 'FULL', hr: 'MANAGE', acct: 'VIEW', cant: 'VIEW (POS)', sec: 'VIEW', emp: 'OWN'
                  },
                  {
                    code: 'HR-ORG',
                    func: 'Positions & Department Taxonomy',
                    category: 'Organizational Architecture',
                    owner: 'Human Resources Department',
                    summary: 'Defines factory organizational units (Mfg, QA, Logistics, Canteen, etc.), job titles, reporting hierarchy, and salary grade levels.',
                    ceo: 'FULL', hr: 'MANAGE', acct: 'VIEW', cant: 'DENIED', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'ATT-KIOSK',
                    func: 'Barcode Timeclock Kiosk Punches',
                    category: 'Time & Attendance Operations',
                    owner: 'HR & Plant Operations (Terminal Kiosk)',
                    summary: 'Entrance hall barcode scanner terminal recording real-time shift check-ins/outs, computing tardiness grace periods, and aggregating hours for payroll.',
                    ceo: 'FULL', hr: 'AUDIT', acct: 'VIEW', cant: 'PUNCH', sec: 'PUNCH', emp: 'PUNCH'
                  },
                  {
                    code: 'PAY-CALC',
                    func: 'Payroll Engine & Bank Transmittals',
                    category: 'Payroll & Statutory Tax Compliance',
                    owner: 'Finance & Accounting Department',
                    summary: 'Computes semi-monthly gross-to-net pay, applies SSS/PhilHealth/Pag-IBIG/BIR tax tables, and generates encrypted bank batch files (BDO, BPI, Metrobank).',
                    ceo: 'FULL', hr: 'DENIED', acct: 'MANAGE', cant: 'DENIED', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'COOP-DEP',
                    func: 'Coop Member Share Deposits',
                    category: 'Cooperative Capital & Equity',
                    owner: 'Cooperative Committee & HR',
                    summary: 'Records voluntary employee cooperative share capital contributions and tracks member equity growth and annual dividend allocations.',
                    ceo: 'FULL', hr: 'RECORD', acct: 'AUDIT', cant: 'DENIED', sec: 'DENIED', emp: 'APPLY'
                  },
                  {
                    code: 'COOP-WDR',
                    func: 'Coop Share Capital Withdrawals',
                    category: 'Treasury & Approvals',
                    owner: 'Cooperative Committee & Accounting',
                    summary: 'Governs member equity withdrawals. HR originates the withdrawal request on behalf of the employee, and Accounting audits and releases funds.',
                    ceo: 'FULL', hr: 'REQUEST', acct: 'APPROVE', cant: 'DENIED', sec: 'DENIED', emp: 'REQUEST'
                  },
                  {
                    code: 'LOAN-STG1',
                    func: 'Cash Loans (Stage 1 Endorsement)',
                    category: 'Credit Risk Endorsement',
                    owner: 'Human Resources Director',
                    summary: 'HR reviews employee tenure, credit history, and capacity to pay before endorsing multi-category loans (Cash 2%, Gadget 3%, Appliance 5%).',
                    ceo: 'FULL', hr: 'ENDORSE', acct: 'DENIED', cant: 'DENIED', sec: 'DENIED', emp: 'APPLY'
                  },
                  {
                    code: 'LOAN-STG2',
                    func: 'Cash Loans (Stage 2 Disbursement)',
                    category: 'Fund Release & Amortization',
                    owner: 'Accounting & Finance Department',
                    summary: 'Accounting validates cooperative treasury reserves, disburses loan funds, and queues automatic semi-monthly payroll deductions.',
                    ceo: 'FULL', hr: 'DENIED', acct: 'DISBURSE', cant: 'DENIED', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'POS-REG',
                    func: 'Canteen POS Barcode Checkout',
                    category: 'Retail Point-of-Sale',
                    owner: 'Canteen Staff & Cashier',
                    summary: 'Cashier register supporting Dine-In vs Grocery orders and Cash vs Salary Deduction payments with instant receipt generation and inventory decrements.',
                    ceo: 'FULL', hr: 'VIEW', acct: 'VIEW', cant: 'OPERATE', sec: 'DENIED', emp: 'BUY'
                  },
                  {
                    code: 'INV-LATE',
                    func: 'Canteen Late Inbound Encoding',
                    category: 'Supply Chain & Inventory',
                    owner: 'Canteen Inventory Manager',
                    summary: 'Enables encoding of delayed food carrier deliveries with required delivery invoice memos, expiration date capture, and permanent [Late Encoded] audit tags.',
                    ceo: 'FULL', hr: 'DENIED', acct: 'DENIED', cant: 'MANAGE', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'POS-VOID',
                    func: 'Supervisor RFID / Card Voids',
                    category: 'Loss Prevention & Audit',
                    owner: 'Canteen Supervisor (Security Credential)',
                    summary: 'Mandates supervisor RFID/barcode security badge authorization to void sales tickets, record audit reasons, and return items back to stock.',
                    ceo: 'FULL', hr: 'DENIED', acct: 'DENIED', cant: 'AUTHORIZE', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'GATE-A5',
                    func: 'Half-A4 Grocery Gate Pass Print',
                    category: 'Security Document Logistics',
                    owner: 'Canteen Cashier & Security',
                    summary: 'Generates official printable ISO A5 (148mm × 210mm) half-A4 gate passes with barcodes and manifest item checklists for all grocery purchases leaving the plant.',
                    ceo: 'FULL', hr: 'VIEW', acct: 'VIEW', cant: 'GENERATE', sec: 'VERIFY', emp: 'PRINT OWN'
                  },
                  {
                    code: 'GATE-SEC',
                    func: 'Perimeter Gate Security Clearance',
                    category: 'Physical Plant Security',
                    owner: 'Perimeter Gate Security Guard',
                    summary: 'Perimeter gate guards inspect physical items against the Half-A4 gate pass, scan the barcode, and stamp electronic "Cleared at Gate" clearance.',
                    ceo: 'FULL', hr: 'DENIED', acct: 'DENIED', cant: 'CLEAR', sec: 'CLEAR', emp: 'DENIED'
                  },
                  {
                    code: 'MFG-PO',
                    func: 'Personal Request Orders (Mfg Goods)',
                    category: 'Factory Manufacturing Privileges',
                    owner: 'Manufacturing Plant & Employee Portal',
                    summary: 'Worker portal for ordering factory-manufactured industrial products (welders, electric motors, workbenches) at employee discount rates via Cash or COOP.',
                    ceo: 'FULL', hr: 'ORDER', acct: 'RECEIVE $', cant: 'DISPATCH', sec: 'INSPECT', emp: 'ORDER'
                  },
                  {
                    code: 'CANTEEN-COOP',
                    func: 'Canteen Salary Deduction -> COOP',
                    category: 'Payroll & COOP Synchronization',
                    owner: 'HR Director & Accounting Reconciliation',
                    summary: 'Reconciles canteen salary deductions with bank payroll payout. Automatically debits the employee COOP budget once HR confirms bank payroll deduction.',
                    ceo: 'FULL', hr: 'CONFIRM HR', acct: 'PAYROLL', cant: 'ORIGINATE', sec: 'DENIED', emp: 'DENIED'
                  },
                  {
                    code: 'PROD-MAP',
                    func: 'Product Journey & Categorized Excel Ledger',
                    category: 'Supply Chain & Material Tracking',
                    owner: 'Canteen & Receiving Operations',
                    summary: '5-stage product lifecycle tracking (Ordered -> Receiving Dock -> Inventory -> Employee Claimed -> Voided Back to Inventory) with employee claim records and categorized printable Excel exports.',
                    ceo: 'FULL', hr: 'VIEW', acct: 'AUDIT', cant: 'OPERATE', sec: 'VIEW', emp: 'CLAIM'
                  }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition text-xs">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold text-slate-900">{row.func}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {row.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQuickInfoTarget({
                            title: row.func,
                            code: row.code,
                            category: row.category,
                            owner: row.owner,
                            summary: row.summary,
                            permissions: {
                              ceo: row.ceo,
                              hr: row.hr,
                              acct: row.acct,
                              cant: row.cant,
                              sec: row.sec,
                              emp: row.emp
                            }
                          })}
                          title={`View short description summary for ${row.func}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 text-[10px] font-bold shadow-xs transition cursor-pointer shrink-0"
                        >
                          <Info className="h-3 w-3 text-slate-600" />
                          <span>Info</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px]">{row.ceo}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.hr === 'DENIED' ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-800'
                      }`}>{row.hr}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.acct === 'DENIED' ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-800'
                      }`}>{row.acct}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.cant === 'DENIED' ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-800'
                      }`}>{row.cant}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.sec === 'DENIED' ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-800'
                      }`}>{row.sec}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.emp === 'DENIED' ? 'bg-slate-100 text-slate-400' : 'bg-slate-200 text-slate-800'
                      }`}>{row.emp}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. NODE DETAILS MODAL / DRAWER */}
      {/* ------------------------------------------------------------- */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden space-y-4 max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Network className="h-5 w-5 text-slate-300" />
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {selectedNode.code} · Architectural Specification
                  </span>
                  <h3 className="text-sm font-black text-white">{selectedNode.title}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Subsystem Objective &amp; Functionality
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {selectedNode.summary}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Responsible Owner
                  </span>
                  <span className="font-bold text-slate-900">{selectedNode.owner}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Database Storage Key
                  </span>
                  <span className="font-mono text-[11px] text-slate-900 font-bold">{selectedNode.storageKey}</span>
                </div>
              </div>

              {/* Inputs & Outputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Incoming Inputs / Data Feeds
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                    {selectedNode.inputs.map((inp, idx) => (
                      <li key={idx}>{inp}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Outgoing Data / Handoffs
                  </span>
                  <ul className="space-y-1 text-[11px] text-slate-700 list-disc list-inside">
                    {selectedNode.outputs.map((out, idx) => (
                      <li key={idx}>{out}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Formula & Calculation Logic */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                  Processing Algorithm / Business Formula
                </span>
                <p className="font-mono text-[11px] text-slate-900 font-bold">
                  {selectedNode.formula}
                </p>
              </div>

              {/* Security & Access Guard */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                  Security &amp; Authorization Constraints
                </span>
                <p className="text-[11px] text-slate-700">
                  {selectedNode.security}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                Authorized for: {selectedNode.roles.join(', ').toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Specification
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SUBSYSTEM QUICK INFO MODAL (SHORT SUMMARY OF DESCRIPTION) */}
      {/* ------------------------------------------------------------- */}
      {quickInfoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden space-y-4 flex flex-col animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                  <Info className="h-4 w-4 text-slate-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {quickInfoTarget.code || 'Subsystem Summary'}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {quickInfoTarget.type === 'cluster' ? 'Subsystem Cluster' : 'Subsystem'}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white line-clamp-1">{quickInfoTarget.title}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuickInfoTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Short Description Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-600" />
                  Description Summary
                </span>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                  {quickInfoTarget.summary}
                </p>
              </div>

              {/* Details Key-Value Cards */}
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Primary Owner</span>
                  <span className="font-bold text-slate-900">{quickInfoTarget.owner || 'System Governance'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Category</span>
                  <span className="font-bold text-slate-900 truncate block">{quickInfoTarget.category}</span>
                </div>
              </div>

              {/* Role Authority Breakdown (from RBAC Matrix) */}
              {quickInfoTarget.permissions && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-slate-600" />
                    Role Authority Matrix
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-slate-500 block text-[9px] font-bold">CEO / IT Admin</span>
                      <span className="font-black text-slate-900">{quickInfoTarget.permissions.ceo}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-slate-500 block text-[9px] font-bold">HR Director</span>
                      <span className={`font-bold ${quickInfoTarget.permissions.hr === 'DENIED' ? 'text-slate-400' : 'text-slate-900 font-black'}`}>
                        {quickInfoTarget.permissions.hr}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-slate-500 block text-[9px] font-bold">Accounting</span>
                      <span className={`font-bold ${quickInfoTarget.permissions.acct === 'DENIED' ? 'text-slate-400' : 'text-slate-900 font-black'}`}>
                        {quickInfoTarget.permissions.acct}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-slate-500 block text-[9px] font-bold">Canteen Staff</span>
                      <span className={`font-bold ${quickInfoTarget.permissions.cant === 'DENIED' ? 'text-slate-400' : 'text-slate-900 font-black'}`}>
                        {quickInfoTarget.permissions.cant}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-slate-500 block text-[9px] font-bold">Plant Security</span>
                      <span className={`font-bold ${quickInfoTarget.permissions.sec === 'DENIED' ? 'text-slate-400' : 'text-slate-900 font-black'}`}>
                        {quickInfoTarget.permissions.sec}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-center">
                      <span className="text-slate-500 block text-[9px] font-bold">Regular Employee</span>
                      <span className={`font-bold ${quickInfoTarget.permissions.emp === 'DENIED' ? 'text-slate-400' : 'text-slate-900 font-black'}`}>
                        {quickInfoTarget.permissions.emp}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {quickInfoTarget.storageKey && (
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-semibold">Storage Key:</span>
                  <span className="font-mono font-bold text-slate-900">{quickInfoTarget.storageKey}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              {quickInfoTarget.node ? (
                <button
                  type="button"
                  onClick={() => {
                    const nodeToInspect = quickInfoTarget.node;
                    setQuickInfoTarget(null);
                    setSelectedNode(nodeToInspect);
                  }}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
                  View Full Specs
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                onClick={() => setQuickInfoTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Summary
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
