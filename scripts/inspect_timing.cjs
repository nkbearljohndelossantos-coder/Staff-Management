const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const data = backup.data;

const receipts = JSON.parse(data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(data.nkb_canteen_deductions_ledger || '[]');

console.log('=== LATE ENCODED RECEIPTS ===');
const lateReceipts = receipts.filter(r => r.isLateEncoded);
console.log(`Total late encoded receipts: ${lateReceipts.length}`);
lateReceipts.forEach((r, idx) => {
  const inLedger = ledger.some(l => l.salaryDeductionRef === r.receiptNo);
  console.log(`Late #${idx + 1} | Receipt: ${r.receiptNo} | Method: ${r.paymentMethod} | Date: ${r.date} | EncodedAt: ${r.actualEncodedAt} | Amount: ${r.total} | InLedger: ${inLedger}`);
});

console.log('\n=== RECEIPTS AROUND INDEX 1160 - 1164 ===');
for (let i = 1158; i < Math.min(1165, receipts.length); i++) {
  const r = receipts[i];
  const inLedger = ledger.some(l => l.salaryDeductionRef === r.receiptNo);
  console.log(`Index ${i} | Receipt: ${r.receiptNo} | Method: ${r.paymentMethod} | Date: ${r.date} | EncodedAt: ${r.actualEncodedAt} | Amount: ${r.total} | Staff: ${r.staffId} | InLedger: ${inLedger}`);
}

console.log('\n=== RECEIPTS AROUND INDEX 1035 - 1042 ===');
for (let i = 1035; i <= 1042; i++) {
  const r = receipts[i];
  const inLedger = ledger.some(l => l.salaryDeductionRef === r.receiptNo);
  console.log(`Index ${i} | Receipt: ${r.receiptNo} | Method: ${r.paymentMethod} | Date: ${r.date} | EncodedAt: ${r.actualEncodedAt} | Amount: ${r.total} | Staff: ${r.staffId} | InLedger: ${inLedger}`);
}

// Let's check chronological ordering of receipts
console.log('\nFirst 3 receipts in array:');
receipts.slice(0, 3).forEach((r, i) => console.log(`  [${i}] ${r.receiptNo} | Date: ${r.date} | Encoded: ${r.actualEncodedAt}`));

console.log('\nLast 3 receipts in array:');
receipts.slice(-3).forEach((r, i) => console.log(`  [${receipts.length - 3 + i}] ${r.receiptNo} | Date: ${r.date} | Encoded: ${r.actualEncodedAt}`));

