# NKB Manufacturing Corp. - HR, Payroll & Canteen Management System

An enterprise-grade Human Resources, Payroll, Cooperative Credit Union, Canteen Point-of-Sale (POS), and Plant Logistics Management System designed for manufacturing and industrial facilities.

---

## Table of Contents
- [Key Features](#key-features)
- [Architecture & Subsystems](#architecture--subsystems)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Default Credentials](#default-credentials)

---

## Key Features

### 1. Personnel & Masterfiles
- **Masterlist Integration**: Pre-loaded with 92 staff members across 21 factory departments.
- **Digital ID Generation**: Automated EMP-2026-XXXX identifiers and printable Code 128 barcode badges.
- **Department & Role Hierarchy**: Strict organizational structure from Executive Management down to production lines.

### 2. Time & Attendance Terminal Kiosk
- **Barcode Timeclock**: Fast barcode scanner interface for shift check-in and check-out.
- **Tardiness & Overtime**: Automatic grace period calculation and payroll integration.

### 3. Payroll & Statutory Compliance
- **Gross-to-Net Engine**: Semi-monthly cutoffs with statutory tables (SSS, PhilHealth, Pag-IBIG, BIR withholding tax).
- **Bank Transmittals**: Exportable transmittal batch files formatted for Philippine banks (BDO, BPI, Metrobank).
- **Payslips**: Confidential digital payslips with printable layouts.

### 4. Cooperative & Loans Management
- **Share Capital Ledgers**: Member deposits, equity balances, and withdrawal approval workflows.
- **2-Stage Cash Loans**: Stage 1 HR credit evaluation and Stage 2 Accounting fund release with amortization schedules.
- **Canteen Reconciliation**: Auto-reconciles Canteen salary deductions with bank payroll before debiting COOP budgets.

### 5. Canteen POS & Supply Inventory
- **Dual-Nature Checkout**: Separate flows for **Dine In** (on-premise) and **Grocery** (outbound exit clearance).
- **Flexible Payment**: Support for **Cash** and **Salary Deduction**.
- **Inbound Quick-Scanner**: Automatic 6-field capture (Supplier, Brand, Expiry, Quantity, Cost/Selling Prices, Size).
- **Supervisor Security Voids**: Supervisor RFID/card badge authorization required to void tickets and return stock to inventory.

### 6. Plant Security Logistics & Gate Passes
- **Official Half-A4 (ISO A5) Gate Passes**: Printable 148mm × 210mm security exit permits with manifests, document barcodes, and dual signature blocks.
- **Perimeter Gate Clearance**: Plant security guard terminal to inspect and clear outbound goods.

### 7. Systematic 5-Stage Live Product Journey
- **5-Stage Tracking**: Ordered -> Receiving Dock -> Inventory -> Employee Claimed -> Voided Back to Inventory.
- **Claimant Tracking**: Records designated employee names, IDs, and departments upon handover.
- **Categorized Multi-Sheet Excel Reports**: Client-side .xlsx generation categorized by last procedure (In Inventory, Claimed by Employee, Voided Back to Inventory) with full timestamps.

### 8. Role-Based Concept Map & RBAC Governance
- **360° Topology Blueprint**: Tailored views for CEO, HR, Accounting, Canteen, and Employees.
- **RBAC Governance Matrix**: Interactive permissions matrix with quick [Info] documentation dialogs.

---

## Tech Stack

- **Frontend**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Spreadsheets / Excel**: [SheetJS (xlsx)](https://docs.sheetjs.com/)
- **Barcodes**: [JsBarcode](https://lindell.me/JsBarcode/)

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   \ash
   git clone <REPO_URL>
   cd HR
   \\n
2. Install dependencies:
   \ash
   npm install
   \\n
3. Start the local development server:
   \ash
   npm run dev
   \\n
4. Open your browser and navigate to http://localhost:3001 (or the port specified by Vite).

### Production Build
\ash
npm run build
\\n
---

## Default Demo Logins

| Role | Name | Email | Permissions |
|---|---|---|---|
| **CEO** | Mark Sterling | ceo@nkb.ph | Full Unrestricted Access |
| **IT Super Admin** | Sarah Jenkins | itadmin@nkb.ph | Full System Administration |
| **HR Director** | Elena Vance | hr@nkb.ph | Staff, Kiosk, Endorsements |
| **Accounting Officer** | Marcus Brody | accounting@nkb.ph | Payroll, Loans, COOP Ledgers |
| **Canteen Staff** | Rosa Morales | canteen@nkb.ph | POS, Inventory, Gate Passes |
| **Plant Security** | Officer Ramos | security@nkb.ph | Gate Inspection & Clearance |
| **Employee** | Alex Rivera | employee@nkb.ph | Self-Service Portal (ESS) |

---

## License

Proprietary - NKB Manufacturing Corp. All rights reserved.
