const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');

console.log('Loading backup from:', backupPath);
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const data = backup.data;

console.log('Keys in data:', Object.keys(data).length);

// Parse relevant arrays
const receipts = JSON.parse(data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(data.nkb_canteen_deductions_ledger || '[]');
const coopAudit = JSON.parse(data.nkb_coop_audit_trail || '[]');
const drawer = typeof data.nkb_hr_canteen_drawer === 'string' ? JSON.parse(data.nkb_hr_canteen_drawer) : data.nkb_hr_canteen_drawer;
const voidLogs = JSON.parse(data.nkb_canteen_void_logs || '[]');
const ledgerBalances = typeof data.nkb_canteen_ledger_balances === 'string' ? JSON.parse(data.nkb_canteen_ledger_balances) : data.nkb_canteen_ledger_balances;

console.log(`Receipts total: ${receipts.length}`);
console.log(`Ledger total: ${ledger.length}`);
console.log(`Coop audit total: ${coopAudit.length}`);
console.log(`Void logs total: ${voidLogs.length}`);
console.log('Drawer object:', JSON.stringify(drawer, null, 2));

// Inspect sample receipt and sample ledger
console.log('\n--- SAMPLE RECEIPT ---');
console.log(JSON.stringify(receipts[0], null, 2));
console.log('\n--- SAMPLE SALARY DEDUCTION RECEIPT ---');
const sampleSalDed = receipts.find(r => r.paymentMethod === 'Salary Deduction' || r.paymentMethod === 'salary_deduction' || r.paymentType === 'Salary Deduction' || r.paymentType === 'salary_deduction');
console.log(JSON.stringify(sampleSalDed, null, 2));

console.log('\n--- SAMPLE LEDGER ENTRY ---');
console.log(JSON.stringify(ledger[0], null, 2));

console.log('\n--- SAMPLE VOID LOG ---');
if (voidLogs.length > 0) {
  console.log(JSON.stringify(voidLogs[0], null, 2));
}

// Payment methods in receipts
const paymentMethods = {};
receipts.forEach((r, idx) => {
  const pm = r.paymentMethod || r.paymentType || 'UNKNOWN';
  if (!paymentMethods[pm]) paymentMethods[pm] = { count: 0, total: 0 };
  paymentMethods[pm].count++;
  paymentMethods[pm].total += Number(r.totalAmount || r.total || 0);
});
console.log('\n--- RECEIPT PAYMENT METHODS ---');
console.log(paymentMethods);
