const fs = require('fs');

const sql = fs.readFileSync('tests/staging_migrated_export_20261105.sql', 'utf8');

const requiredTables = [
  'departments', 'positions', 'staff', 'canteen_categories', 'canteen_inventory',
  'canteen_sales_invoices', 'canteen_sales_invoice_items', 'canteen_receipts',
  'canteen_receipt_items', 'canteen_deductions_ledger', 'canteen_ledger_balances',
  'canteen_drawer_sessions', 'canteen_drawer_transactions', 'canteen_gate_passes',
  'canteen_void_logs', 'mfg_products', 'system_audit_trail', 'system_notifications',
  'system_storage_archive', 'system_reconciliation_conflicts'
];

console.log('=== 1. VERIFYING 20 TABLE DEFINITIONS ===');
const missingTables = [];
for (const tbl of requiredTables) {
  const tableDefRegex = new RegExp(`CREATE TABLE (public\\.)?${tbl}\\b`, 'i');
  if (!tableDefRegex.test(sql)) {
    missingTables.push(tbl);
  }
}
console.log(`Tables Checked: ${requiredTables.length} | Missing: ${missingTables.length}`);
if (missingTables.length > 0) {
  console.error('Missing tables:', missingTables);
} else {
  console.log('All 20 table schemas are present.');
}

console.log('\n=== 2. VERIFYING PRIMARY KEYS & CONSTRAINTS ===');
const pkeyMatches = sql.match(/ADD CONSTRAINT \w+_pkey PRIMARY KEY/gi) || [];
console.log(`Primary Key constraints found: ${pkeyMatches.length}`);

const fkeyMatches = sql.match(/ADD CONSTRAINT \w+ FOREIGN KEY/gi) || [];
console.log(`Foreign Key constraints found: ${fkeyMatches.length}`);

const indexMatches = sql.match(/CREATE (UNIQUE )?INDEX \w+ ON/gi) || [];
console.log(`Index definitions found: ${indexMatches.length}`);

console.log('\n=== 3. VERIFYING NUMERIC / MONETARY FIELDS ===');
// Search for key money columns in COPY statements
const sampleMoneyLines = [];
const moneyRegex = /(RCT-2026-\d+[\s\S]*?(\d+\.\d{2}))/g;
const rctSample = sql.match(/RCT-2026-742421\t[^\n]+/);
console.log('Sample Quarantined Receipt (RCT-2026-742421):', rctSample ? rctSample[0] : 'NOT FOUND');

const deductionSample = sql.match(/cded-[^\n]+/);
console.log('Sample Deduction Ledger Record:', deductionSample ? deductionSample[0].substring(0, 100) : 'NOT FOUND');

console.log('\n=== 4. VERIFYING QUARANTINE & CONFLICT PAYLOADS ===');
const conflictMatches = sql.match(/emp-nkbcanteen/g) || [];
console.log(`Occurrences of 'emp-nkbcanteen': ${conflictMatches.length}`);

const quarantinedReceiptIds = ['RCT-2026-742421', 'RCT-2026-660129', 'RCT-2026-974934', 'RCT-2026-943735'];
for (const qid of quarantinedReceiptIds) {
  const inConflicts = sql.includes(qid);
  console.log(`Quarantined Receipt ${qid} present: ${inConflicts}`);
}

console.log('\n=== 5. CHECKING FOR EMBEDDED PASSWORDS / SECRETS ===');
const suspiciousPatterns = [
  /nkb_staging_password/i,
  /NkbManufacturing@2025/,
  /staging_secure_pass/,
  /password_hash\s+VALUES\s+\('[^']+'\)/
];

let leaksFound = 0;
for (const p of suspiciousPatterns) {
  if (p.test(sql)) {
    console.warn(`[WARNING] Pattern matched: ${p}`);
    leaksFound++;
  }
}
if (leaksFound === 0) {
  console.log('Zero embedded database passwords or staging secrets found.');
}
