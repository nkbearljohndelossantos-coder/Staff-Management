-- ==============================================================================
-- NKB MANUFACTURING SYSTEM -- PRODUCTION POSTGRESQL RELATIONAL SCHEMA
-- Zero Data Loss Architecture · NUMERIC(14,2) Currency Precision · Full Traceability
-- Exactly 20 Tables Declared (Reconciled from previous 19-table draft count)
-- ==============================================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ORGANIZATION HIERARCHY
-- ------------------------------------------------------------------------------

-- Table 1: departments
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(32),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: positions
CREATE TABLE IF NOT EXISTS positions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
    salary_grade VARCHAR(32),
    min_salary NUMERIC(14, 2) DEFAULT 0.00,
    max_salary NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: staff
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(64) PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(128),
    phone VARCHAR(32),
    role VARCHAR(32) NOT NULL DEFAULT 'employee',
    employment_type VARCHAR(32) NOT NULL DEFAULT 'regular',
    department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
    position_id VARCHAR(64) REFERENCES positions(id) ON DELETE SET NULL,
    hire_date DATE,
    birth_date DATE,
    address TEXT,
    tin VARCHAR(32),
    sss VARCHAR(32),
    philhealth VARCHAR(32),
    pagibig VARCHAR(32),
    bank_account VARCHAR(64),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    source_variant VARCHAR(32) DEFAULT 'standard',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_staff_dept ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_pos ON staff(position_id);

-- ------------------------------------------------------------------------------
-- 2. CANTEEN INVENTORY & PRODUCTS
-- ------------------------------------------------------------------------------

-- Table 4: canteen_categories
CREATE TABLE IF NOT EXISTS canteen_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: canteen_inventory
CREATE TABLE IF NOT EXISTS canteen_inventory (
    id VARCHAR(64) PRIMARY KEY,
    barcode VARCHAR(64),
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    brand VARCHAR(64),
    company VARCHAR(128),
    size VARCHAR(64),
    unit VARCHAR(32) NOT NULL DEFAULT 'Piece',
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 5,
    is_box_item BOOLEAN DEFAULT FALSE,
    pieces_per_box INTEGER DEFAULT 1,
    piece_selling_price NUMERIC(14, 2) DEFAULT 0.00,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canteen_inv_barcode ON canteen_inventory(barcode);
CREATE INDEX IF NOT EXISTS idx_canteen_inv_category ON canteen_inventory(category);

-- ------------------------------------------------------------------------------
-- 3. CANTEEN INBOUND SALES INVOICES
-- ------------------------------------------------------------------------------

-- Table 6: canteen_sales_invoices
CREATE TABLE IF NOT EXISTS canteen_sales_invoices (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL,
    supplier VARCHAR(128) NOT NULL,
    purchase_date DATE,
    received_date DATE,
    payment_method VARCHAR(64),
    payment_status VARCHAR(32) DEFAULT 'Paid',
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    items_count INTEGER DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    encoded_by VARCHAR(128),
    notes TEXT,
    status VARCHAR(32) DEFAULT 'POSTED_TO_INVENTORY',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: canteen_sales_invoice_items
CREATE TABLE IF NOT EXISTS canteen_sales_invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES canteen_sales_invoices(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64),
    brand VARCHAR(64),
    company VARCHAR(128),
    size VARCHAR(64),
    unit VARCHAR(32),
    quantity NUMERIC(14, 2) NOT NULL,
    cost_price NUMERIC(14, 2) NOT NULL,
    selling_price NUMERIC(14, 2) NOT NULL,
    total_cost NUMERIC(14, 2) NOT NULL,
    barcode VARCHAR(64),
    expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_inv_id ON canteen_sales_invoice_items(invoice_id);

-- ------------------------------------------------------------------------------
-- 4. POS SALES RECEIPTS & TRANSACTIONS
-- ------------------------------------------------------------------------------

-- Table 8: canteen_receipts
CREATE TABLE IF NOT EXISTS canteen_receipts (
    id VARCHAR(64) PRIMARY KEY,
    receipt_no VARCHAR(64) UNIQUE NOT NULL,
    transaction_type VARCHAR(64) DEFAULT 'REGULAR_SALE',
    staff_id VARCHAR(64),
    staff_name VARCHAR(128),
    payment_method VARCHAR(64) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    amount_tendered NUMERIC(14, 2) DEFAULT 0.00,
    change_due NUMERIC(14, 2) DEFAULT 0.00,
    cashier_id VARCHAR(64),
    cashier_name VARCHAR(128),
    timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_receipt_no ON canteen_receipts(receipt_no);
CREATE INDEX IF NOT EXISTS idx_receipts_staff_id ON canteen_receipts(staff_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_method ON canteen_receipts(payment_method);

-- Table 9: canteen_receipt_items
CREATE TABLE IF NOT EXISTS canteen_receipt_items (
    id VARCHAR(64) PRIMARY KEY,
    receipt_id VARCHAR(64) NOT NULL REFERENCES canteen_receipts(id) ON DELETE CASCADE,
    item_id VARCHAR(64),
    item_name VARCHAR(128) NOT NULL,
    quantity NUMERIC(14, 2) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    total_price NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON canteen_receipt_items(receipt_id);

-- ------------------------------------------------------------------------------
-- 5. CANTEEN SALARY DEDUCTIONS & DEBT LEDGER
-- ------------------------------------------------------------------------------

-- Table 10: canteen_deductions_ledger
CREATE TABLE IF NOT EXISTS canteen_deductions_ledger (
    id VARCHAR(64) PRIMARY KEY,
    staff_id VARCHAR(64) NOT NULL,
    staff_name VARCHAR(128) NOT NULL,
    receipt_no VARCHAR(64) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    cutoff_period VARCHAR(64),
    deduction_date DATE,
    status VARCHAR(64) DEFAULT 'PENDING_CUTOFF',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deductions_staff ON canteen_deductions_ledger(staff_id);
CREATE INDEX IF NOT EXISTS idx_deductions_receipt ON canteen_deductions_ledger(receipt_no);

-- Table 11: canteen_ledger_balances
CREATE TABLE IF NOT EXISTS canteen_ledger_balances (
    staff_id VARCHAR(64) PRIMARY KEY,
    staff_name VARCHAR(128),
    accumulated_debt NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    last_transaction_date TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. POS CASH DRAWER SESSIONS
-- ------------------------------------------------------------------------------

-- Table 12: canteen_drawer_sessions
CREATE TABLE IF NOT EXISTS canteen_drawer_sessions (
    id VARCHAR(64) PRIMARY KEY,
    cashier_id VARCHAR(64) NOT NULL,
    cashier_name VARCHAR(128) NOT NULL,
    opening_cash NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(14, 2),
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(64) NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMPTZ NOT NULL,
    closed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Table 13: canteen_drawer_transactions
CREATE TABLE IF NOT EXISTS canteen_drawer_transactions (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES canteen_drawer_sessions(id) ON DELETE CASCADE,
    transaction_type VARCHAR(64) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. LOGISTICS, VOIDS & GATE PASSES
-- ------------------------------------------------------------------------------

-- Table 14: canteen_gate_passes
CREATE TABLE IF NOT EXISTS canteen_gate_passes (
    id VARCHAR(64) PRIMARY KEY,
    pass_no VARCHAR(64) UNIQUE NOT NULL,
    issued_to VARCHAR(128) NOT NULL,
    issued_by VARCHAR(128) NOT NULL,
    reason TEXT,
    destination VARCHAR(128),
    status VARCHAR(64) DEFAULT 'APPROVED',
    issued_at TIMESTAMPTZ NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 15: canteen_void_logs
CREATE TABLE IF NOT EXISTS canteen_void_logs (
    id VARCHAR(64) PRIMARY KEY,
    receipt_no VARCHAR(64) NOT NULL,
    voided_by VARCHAR(128) NOT NULL,
    reason TEXT,
    voided_at TIMESTAMPTZ NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 16: mfg_products
CREATE TABLE IF NOT EXISTS mfg_products (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) UNIQUE,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(64),
    unit VARCHAR(32) DEFAULT 'Piece',
    unit_price NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. SYSTEM AUDIT & NOTIFICATIONS
-- ------------------------------------------------------------------------------

-- Table 17: system_audit_trail
CREATE TABLE IF NOT EXISTS system_audit_trail (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL DEFAULT 'GENERAL',
    action VARCHAR(128) NOT NULL,
    details TEXT,
    operator_id VARCHAR(64) DEFAULT 'SYSTEM',
    operator_name VARCHAR(128) DEFAULT 'System Automated',
    operator_role VARCHAR(32) DEFAULT 'system',
    target_id VARCHAR(64),
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_category ON system_audit_trail(category);
CREATE INDEX IF NOT EXISTS idx_audit_created ON system_audit_trail(created_at);

-- Table 18: system_notifications
CREATE TABLE IF NOT EXISTS system_notifications (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) DEFAULT 'INFO',
    recipient_role VARCHAR(32),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. COMPLETE SYSTEM STORAGE ARCHIVE (100% PRESERVATION GUARANTEE)
-- Separate Computer A and Computer B datasets, preserve raw keys and structures
-- ------------------------------------------------------------------------------

-- Table 19: system_storage_archive
CREATE TABLE IF NOT EXISTS system_storage_archive (
    key_name VARCHAR(128) NOT NULL,
    source_origin VARCHAR(64) NOT NULL DEFAULT 'Computer B',
    source_file VARCHAR(128),
    backup_timestamp TIMESTAMPTZ,
    data_type VARCHAR(32) NOT NULL,
    raw_value TEXT,
    json_payload JSONB,
    record_count INTEGER DEFAULT 0,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (key_name, source_origin)
);

-- ------------------------------------------------------------------------------
-- 10. RECONCILIATION CONFLICTS & AUDIT LOGGING
-- Tracks any collision, duplicate ID, unresolved FK, or differing record on re-run
-- ------------------------------------------------------------------------------

-- Table 20: system_reconciliation_conflicts
CREATE TABLE IF NOT EXISTS system_reconciliation_conflicts (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    conflict_type VARCHAR(64) NOT NULL,
    status VARCHAR(64) DEFAULT 'PENDING_APPROVAL',
    details TEXT,
    existing_record JSONB,
    incoming_record JSONB,
    resolved_id VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
