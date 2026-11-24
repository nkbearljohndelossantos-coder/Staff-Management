const fs = require('fs');
const path = require('path');

const backupPath = path.resolve('Z:/HP Gaming Backup/Staff-Management-main/Staff-Management-main/NKB_ComputerB_Backup_2026-11-05T01-49-40-188Z.json');
const raw = fs.readFileSync(backupPath, 'utf8');
const backup = JSON.parse(raw);
const data = backup.data;

const receipts = JSON.parse(data.nkb_canteen_receipts || '[]');
const ledger = JSON.parse(data.nkb_canteen_deductions_ledger || '[]');
const coopAudit = JSON.parse(data.nkb_coop_audit_trail || '[]');
const drawer = typeof data.nkb_hr_canteen_drawer === 'string' ? JSON.parse(data.nkb_hr_canteen_drawer) : data.nkb_hr_canteen_drawer;
const voidLogs = JSON.parse(data.nkb_canteen_void_logs || '[]');
const ledgerBalances = typeof data.nkb_canteen_ledger_balances === 'string' ? JSON.parse(data.nkb_canteen_ledger_balances) : data.nkb_canteen_ledger_balances;

// 1. Separate salary deduction receipts
const salDedReceipts = [];
receipts.forEach((r, idx) => {
  const pm = String(r.paymentMethod || r.paymentType || '').toLowerCase();
  if (pm.includes('deduction')) {
    salDedReceipts.push({ ...r, _sourceIndex: idx });
  }
});

console.log('=== SALARY DEDUCTION RECEIPTS VS DEDUCTIONS LEDGER ===');
console.log(`Total receipts: ${receipts.length}`);
console.log(`Salary deduction receipts: ${salDedReceipts.length}`);
console.log(`Deductions ledger records: ${ledger.length}`);

// Add index to ledger
const indexedLedger = ledger.map((l, idx) => ({ ...l, _sourceIndex: idx }));

// Map receipts by receiptNo
const receiptByNo = new Map();
const duplicateReceiptNos = [];
salDedReceipts.forEach(r => {
  const no = r.receiptNo;
  if (!no) {
    console.log('Receipt missing receiptNo:', r);
    return;
  }
  if (receiptByNo.has(no)) {
    duplicateReceiptNos.push({ receiptNo: no, first: receiptByNo.get(no), second: r });
  } else {
    receiptByNo.set(no, r);
  }
});
console.log(`Unique receiptNo in salary deduction receipts: ${receiptByNo.size}`);
console.log(`Duplicate receiptNos: ${duplicateReceiptNos.length}`);

// Map ledger by salaryDeductionRef
const ledgerByRef = new Map();
const duplicateLedgerRefs = [];
const duplicateLedgerIds = [];
const ledgerById = new Map();

indexedLedger.forEach(l => {
  const id = l.id;
  if (ledgerById.has(id)) {
    duplicateLedgerIds.push({ id, first: ledgerById.get(id), second: l });
  } else {
    ledgerById.set(id, l);
  }

  const ref = l.salaryDeductionRef;
  if (!ref) {
    console.log('Ledger missing salaryDeductionRef:', l);
    return;
  }
  if (ledgerByRef.has(ref)) {
    duplicateLedgerRefs.push({ ref, first: ledgerByRef.get(ref), second: l });
  } else {
    ledgerByRef.set(ref, l);
  }
});
console.log(`Unique ledger IDs: ${ledgerById.size}`);
console.log(`Duplicate ledger IDs: ${duplicateLedgerIds.length}`);
console.log(`Unique salaryDeductionRef in ledger: ${ledgerByRef.size}`);
console.log(`Duplicate ledger refs: ${duplicateLedgerRefs.length}`);

// Find receipts with no matching ledger entry
const receiptsWithNoLedger = [];
salDedReceipts.forEach(r => {
  if (!ledgerByRef.has(r.receiptNo)) {
    receiptsWithNoLedger.push(r);
  }
});
console.log(`\nReceipts with no matching ledger entry: ${receiptsWithNoLedger.length}`);
let unmatchedReceiptsTotal = 0;
receiptsWithNoLedger.forEach((r, i) => {
  const amt = Number(r.totalAmount || r.total || 0);
  unmatchedReceiptsTotal += amt;
  console.log(`  [${i + 1}] SourceIdx: ${r._sourceIndex} | Receipt: ${r.receiptNo} | Date: ${r.date} | Staff: ${r.staffId} (${r.customerName}) | Amount: ${amt} | Status: ${r.status} | SDStatus: ${r.salaryDeductionStatus} | isDeductedToCoop: ${r.isDeductedToCoop}`);
  if (r.items) {
    console.log('      Items:', r.items.map(it => `${it.name} (qty: ${it.quantity}, total: ${it.total})`).join(', '));
  }
});
console.log(`Sum of unmatched receipts: ₱${unmatchedReceiptsTotal.toFixed(2)}`);

// Find ledger entries with no matching receipt
const ledgerWithNoReceipt = [];
indexedLedger.forEach(l => {
  if (!receiptByNo.has(l.salaryDeductionRef)) {
    ledgerWithNoReceipt.push(l);
  }
});
console.log(`\nLedger entries with no matching receipt: ${ledgerWithNoReceipt.length}`);
let unmatchedLedgerTotal = 0;
ledgerWithNoReceipt.forEach((l, i) => {
  const amt = Number(l.amount || 0);
  unmatchedLedgerTotal += amt;
  console.log(`  [${i + 1}] SourceIdx: ${l._sourceIndex} | ID: ${l.id} | Ref: ${l.salaryDeductionRef} | Date: ${l.date} | Staff: ${l.staffId} (${l.employeeName}) | Amount: ${amt} | Status: ${l.status}`);
});
console.log(`Sum of unmatched ledger entries: ₱${unmatchedLedgerTotal.toFixed(2)}`);

// Check matched records for amount discrepancies
const amountDiscrepancies = [];
salDedReceipts.forEach(r => {
  const l = ledgerByRef.get(r.receiptNo);
  if (l) {
    const rAmt = Number(r.totalAmount || r.total || 0);
    const lAmt = Number(l.amount || 0);
    if (Math.abs(rAmt - lAmt) > 0.001) {
      amountDiscrepancies.push({
        receiptNo: r.receiptNo,
        receiptIndex: r._sourceIndex,
        ledgerIndex: l._sourceIndex,
        receiptAmount: rAmt,
        ledgerAmount: lAmt,
        difference: rAmt - lAmt
      });
    }
  }
});
console.log(`\nRecords with same ID but different amount: ${amountDiscrepancies.length}`);
amountDiscrepancies.forEach(d => console.log('  ', d));

// Check void logs
console.log('\n=== VOID LOGS INSPECTION ===');
console.log(`Total void logs: ${voidLogs.length}`);
voidLogs.forEach((v, i) => {
  console.log(`  [${i + 1}] ID: ${v.id} | Time: ${v.timestamp} | Type: ${v.type} | Item: ${v.itemName} | Amount: ${v.amount} | Reason: ${v.reason} | ReceiptRef: ${v.receiptNo || v.receiptRef || 'N/A'}`);
});

// Check Coop Audit trail matching
console.log('\n=== COOP AUDIT TRAIL MATCHING ===');
console.log(`Coop audit total records: ${coopAudit.length}`);
const coopByRef = new Map();
coopAudit.forEach((c, idx) => {
  const ref = c.transactionId || c.referenceNo || c.receiptNo || c.salaryDeductionRef;
  coopByRef.set(ref, { ...c, _sourceIndex: idx });
});

// Let's see how coopAudit matches ledger
let coopMatchedLedger = 0;
let coopUnmatchedLedger = 0;
indexedLedger.forEach(l => {
  // Let's see how coop matches: does coop have l.id or l.salaryDeductionRef?
  const match = coopAudit.find(c => c.transactionId === l.id || c.salaryDeductionRef === l.salaryDeductionRef || c.referenceNo === l.salaryDeductionRef);
  if (match) coopMatchedLedger++;
  else coopUnmatchedLedger++;
});
console.log(`Coop audit matched with ledger: ${coopMatchedLedger}, unmatched: ${coopUnmatchedLedger}`);
if (coopUnmatchedLedger > 0) {
  console.log('Sample coop entry:', coopAudit[0]);
  console.log('Sample ledger entry:', indexedLedger[0]);
}

// Check Drawer vs Cash receipts
console.log('\n=== CASH DRAWER ANALYSIS ===');
console.log('Drawer balance:', drawer.balance);
console.log('Drawer transactions count:', drawer.transactions ? drawer.transactions.length : 0);
let drawerTxTotal = 0;
if (drawer.transactions) {
  drawer.transactions.forEach(t => drawerTxTotal += Number(t.amount || 0));
}
console.log('Sum of drawer transactions:', drawerTxTotal);

const cashReceipts = receipts.filter(r => !String(r.paymentMethod || r.paymentType || '').toLowerCase().includes('deduction'));
console.log(`Cash receipts count: ${cashReceipts.length}`);
let cashReceiptsTotal = 0;
cashReceipts.forEach(r => cashReceiptsTotal += Number(r.totalAmount || r.total || 0));
console.log(`Cash receipts sum: ${cashReceiptsTotal}`);

// Match cash receipts with drawer transactions
const drawerByReceiptNo = new Map();
if (drawer.transactions) {
  drawer.transactions.forEach((t, idx) => {
    drawerByReceiptNo.set(t.receiptNo, { ...t, _index: idx });
  });
}
const unmatchedCashReceipts = cashReceipts.filter(r => !drawerByReceiptNo.has(r.receiptNo));
console.log(`Cash receipts not in drawer: ${unmatchedCashReceipts.length}`);
const unmatchedDrawerTx = (drawer.transactions || []).filter(t => !receipts.find(r => r.receiptNo === t.receiptNo));
console.log(`Drawer transactions not in receipts: ${unmatchedDrawerTx.length}`);

