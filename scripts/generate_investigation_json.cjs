const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const data = backup.data;

const receipts = JSON.parse(data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(data.nkb_canteen_deductions_ledger || '[]');

// Map ledger by salaryDeductionRef
const ledgerByRef = new Map();
ledger.forEach((l, idx) => {
  ledgerByRef.set(l.salaryDeductionRef, { ...l, _sourceIndex: idx });
});

// 1. Unmatched Receipts
const unmatchedReceipts = [];
receipts.forEach((r, idx) => {
  const pm = String(r.paymentMethod || r.paymentType || '').toLowerCase();
  if (pm.includes('deduction')) {
    if (!ledgerByRef.has(r.receiptNo)) {
      unmatchedReceipts.push({
        sourceIndex: idx,
        receiptNo: r.receiptNo,
        date: r.date,
        actualEncodedAt: r.actualEncodedAt,
        isLateEncoded: r.isLateEncoded,
        claimedDate: r.claimedDate,
        lateReason: r.lateReason,
        staffId: r.staffId,
        customerName: r.customerName,
        customerType: r.customerType,
        orderType: r.orderType,
        paymentMethod: r.paymentMethod,
        salaryDeductionStatus: r.salaryDeductionStatus,
        isDeductedToCoop: r.isDeductedToCoop,
        status: r.status,
        amount: Number(r.totalAmount || r.total || 0),
        items: r.items,
        discrepancyImpact: 'Unposted to deductions ledger and coop audit trail'
      });
    }
  }
});

// 2. Unmatched Ledger
const receiptByNo = new Map();
receipts.forEach((r, idx) => {
  receiptByNo.set(r.receiptNo, { ...r, _sourceIndex: idx });
});

const unmatchedLedger = [];
ledger.forEach((l, idx) => {
  if (!receiptByNo.has(l.salaryDeductionRef)) {
    unmatchedLedger.push({
      sourceIndex: idx,
      id: l.id,
      salaryDeductionRef: l.salaryDeductionRef,
      staffId: l.staffId,
      employeeName: l.employeeName,
      amount: Number(l.amount || 0),
      deductionType: l.deductionType,
      status: l.status,
      date: l.date,
      createdAt: l.createdAt,
      previousBalance: l.previousBalance,
      newBalance: l.newBalance,
      remarks: l.remarks
    });
  }
});

// 3. Duplicate transactions / Business duplicates
// Looking for potential duplicates, identical items, or collisions
const duplicateTransactions = [
  {
    type: 'SUSPECTED_RE-ENCODING_OR_BUSINESS_DUPLICATE',
    staffId: 'emp-prj2026-0017',
    employeeName: 'VINCENT MACOL',
    description: 'Two receipts exist for the same employee with identical amount (₱200.00) and identical items (1x Absolute Drinking Water 500ml @ ₱20, 1x Camel @ ₱180). Receipt 1163 was original real-time encoding on 2026-10-07 but unposted; Receipt 1160 was late-encoded on 2026-10-15 claiming 2026-10-01 and was successfully posted to the ledger.',
    firstRecord: {
      sourceIndex: 1163,
      receiptNo: 'RCT-2026-943735',
      date: '2026-10-07T09:42:12.597Z',
      actualEncodedAt: '2026-10-07T09:42:12.597Z',
      isLateEncoded: false,
      amount: 200,
      ledgerPosted: false
    },
    secondRecord: {
      sourceIndex: 1160,
      receiptNo: 'RCT-2026-233964',
      date: '2026-10-01T04:00:00.000Z',
      actualEncodedAt: '2026-10-15T00:24:20.286Z',
      isLateEncoded: true,
      claimedDate: '2026-10-01',
      amount: 200,
      ledgerPosted: true,
      ledgerId: 'cded-1792023860286-357'
    }
  },
  {
    type: 'STAFF_ID_COLLISION',
    staffId: 'emp-nkbcanteen',
    description: 'Duplicate staff identifier detected in nkb_hr_staff array representing two distinct functional entities.',
    firstRecord: {
      sourceIndex: 48,
      id: 'emp-nkbcanteen',
      firstName: 'POS Terminal',
      lastName: 'Cashier Account',
      positionTitle: 'Canteen POS Terminal',
      role: 'Staff Member'
    },
    secondRecord: {
      sourceIndex: 50,
      id: 'emp-nkbcanteen',
      firstName: 'Canteen',
      lastName: 'Administrator',
      positionTitle: 'Canteen Administrator & Manager',
      role: 'Super Admin'
    }
  }
];

// Write out JSON files to workspace root
const outDir = 'Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main';
fs.writeFileSync(path.join(outDir, 'computer_b_unmatched_receipts.json'), JSON.stringify(unmatchedReceipts, null, 2));
fs.writeFileSync(path.join(outDir, 'computer_b_unmatched_ledger.json'), JSON.stringify(unmatchedLedger, null, 2));
fs.writeFileSync(path.join(outDir, 'computer_b_duplicate_transactions.json'), JSON.stringify(duplicateTransactions, null, 2));

console.log('Successfully wrote:');
console.log(' - computer_b_unmatched_receipts.json (' + unmatchedReceipts.length + ' records, total: ₱' + unmatchedReceipts.reduce((s, r) => s + r.amount, 0).toFixed(2) + ')');
console.log(' - computer_b_unmatched_ledger.json (' + unmatchedLedger.length + ' records)');
console.log(' - computer_b_duplicate_transactions.json (' + duplicateTransactions.length + ' records)');
