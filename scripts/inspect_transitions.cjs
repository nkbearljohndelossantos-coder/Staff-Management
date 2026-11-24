const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const receipts = JSON.parse(backup.data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(backup.data.nkb_canteen_deductions_ledger || '[]');

function inspectStaffTransition(staffId, staffName) {
  console.log(`\n======================================================`);
  console.log(`INSPECTING TRANSITIONS: ${staffId} (${staffName})`);
  console.log(`======================================================`);
  const staffLedger = ledger
    .map((l, idx) => ({ ...l, _sourceIndex: idx }))
    .filter(l => l.staffId === staffId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  staffLedger.forEach((l, i) => {
    console.log(`  Ledger [${i}] Created: ${l.createdAt} | Ref: ${l.salaryDeductionRef} | Amount: ${l.amount} | Bal: ${l.previousBalance} -> ${l.newBalance}`);
  });
}

inspectStaffTransition('emp-nkb052026-0028', 'RICKY O. MIRAMBIL');
inspectStaffTransition('emp-prj2026-0036', 'ISAGANI GULLIERMO');
