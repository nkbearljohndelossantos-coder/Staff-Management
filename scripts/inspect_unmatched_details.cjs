const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const data = backup.data;

const receipts = JSON.parse(data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(data.nkb_canteen_deductions_ledger || '[]');
const coopAudit = JSON.parse(data.nkb_coop_audit_trail || '[]');
const staffBalances = JSON.parse(data.nkb_canteen_ledger_balances || '{}');

console.log('=== FULL DETAILS OF THE 4 UNMATCHED RECEIPTS ===\n');
const targetReceiptNos = ['RCT-2026-742421', 'RCT-2026-660129', 'RCT-2026-974934', 'RCT-2026-943735'];

receipts.forEach((r, idx) => {
  if (targetReceiptNos.includes(r.receiptNo)) {
    console.log(`--- RECEIPT INDEX ${idx}: ${r.receiptNo} ---`);
    console.log(JSON.stringify(r, null, 2));
    
    // Check if staff has a ledger balance
    const staffId = r.staffId;
    console.log(`Staff ID: ${staffId}, Current Ledger Balance in nkb_canteen_ledger_balances:`, staffBalances[staffId]);
    
    // Check if staff has other receipts and ledger entries
    const otherReceipts = receipts.filter(x => x.staffId === staffId && String(x.paymentMethod || '').toLowerCase().includes('deduction'));
    const otherLedger = ledger.filter(x => x.staffId === staffId);
    console.log(`Staff ${staffId} total deduction receipts: ${otherReceipts.length}, total ledger entries: ${otherLedger.length}`);
    const receiptSum = otherReceipts.reduce((s, x) => s + Number(x.totalAmount || x.total || 0), 0);
    const ledgerSum = otherLedger.reduce((s, x) => s + Number(x.amount || 0), 0);
    console.log(`Staff ${staffId} receipts sum: ${receiptSum}, ledger sum: ${ledgerSum}, diff: ${receiptSum - ledgerSum}`);
    console.log('\n');
  }
});

// Let's also verify coop audit matching with ledger
let coopMatches = 0;
let coopMismatches = [];
ledger.forEach((l, idx) => {
  const c = coopAudit.find(ca => ca.referenceId === l.salaryDeductionRef);
  if (c) {
    if (Math.abs(Number(c.amount) - Number(l.amount)) < 0.001 && c.memberId === l.staffId) {
      coopMatches++;
    } else {
      coopMismatches.push({ ledger: l, coop: c });
    }
  }
});
console.log(`Ledger to Coop Audit exact matches: ${coopMatches} / ${ledger.length}`);
console.log(`Mismatches: ${coopMismatches.length}`);

