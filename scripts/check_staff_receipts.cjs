const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const receipts = JSON.parse(backup.data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(backup.data.nkb_canteen_deductions_ledger || '[]');

function checkStaffReceipts(staffId, staffName) {
  console.log(`\n======================================================`);
  console.log(`CHECKING STAFF: ${staffId} (${staffName})`);
  console.log(`======================================================`);
  const staffReceipts = receipts
    .map((r, idx) => ({ ...r, _sourceIndex: idx }))
    .filter(r => r.staffId === staffId && String(r.paymentMethod || '').toLowerCase().includes('deduction'));
  
  const staffLedger = ledger
    .map((l, idx) => ({ ...l, _sourceIndex: idx }))
    .filter(l => l.staffId === staffId);

  console.log(`Receipts count: ${staffReceipts.length}, Ledger count: ${staffLedger.length}`);
  
  staffReceipts.forEach(r => {
    const l = staffLedger.find(entry => entry.salaryDeductionRef === r.receiptNo);
    const inLedger = !!l;
    console.log(`  Receipt [Idx ${r._sourceIndex}] ${r.receiptNo} | Date: ${r.date} | Encoded: ${r.actualEncodedAt} | Late: ${r.isLateEncoded} | Total: ${r.total} | InLedger: ${inLedger} ${l ? `(Ledger Idx: ${l._sourceIndex}, Bal: ${l.previousBalance}->${l.newBalance})` : '*** UNMATCHED ***'}`);
  });
}

checkStaffReceipts('emp-nkb052026-0028', 'RICKY O. MIRAMBIL');
checkStaffReceipts('emp-prj2026-0036', 'ISAGANI GULLIERMO');
checkStaffReceipts('emp-nkb052026-0014', 'EARL JOHN DELOS SANTOS');
checkStaffReceipts('emp-prj2026-0017', 'VINCENT MACOL');
