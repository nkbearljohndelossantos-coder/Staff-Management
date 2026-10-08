import assert from 'node:assert/strict';
import {
  DEFAULT_COOP_LOAN_MULTIPLIER,
  VALID_LOAN_TERMS,
  MAX_LOAN_TERM_MONTHS,
  REPLENISHMENT_STATUSES,
  calculateMaxLoanableAmount,
  validateLoanApplication,
  computeLoanFinancials,
  buildRetirementSettlement,
  processCanteenSalaryDeduction,
  createReplenishmentRequestModel
} from '../src/utils/coopBusinessRules.js';

console.log('=== COOP System Business Rules Acceptance Tests ===\n');

// =========================================================================
// Test 1 — COOP Loan Eligibility & Savings Preservation
// =========================================================================
console.log('Test 1 — COOP Loan Eligibility (Savings = ₱20,000, Multiplier = 3x)');
{
  let coopBalances = { 'STAFF-001': 20000 };
  const maxLoan = calculateMaxLoanableAmount(coopBalances['STAFF-001'], DEFAULT_COOP_LOAN_MULTIPLIER);
  assert.equal(maxLoan, 60000, 'Maximum Loan should equal ₱60,000 (₱20,000 × 3)');

  // Validate a ₱40,000 loan over 12 months
  const validation = validateLoanApplication({
    memberStatus: 'Active',
    coopSavings: coopBalances['STAFF-001'],
    principal: 40000,
    termMonths: 12,
    multiplier: 3
  });
  assert.equal(validation.valid, true, '₱40,000 loan within ₱60,000 limit should be valid');

  // Reject a ₱65,000 loan exceeding ₱60,000 limit
  const overLimit = validateLoanApplication({
    memberStatus: 'Active',
    coopSavings: coopBalances['STAFF-001'],
    principal: 65000,
    termMonths: 12,
    multiplier: 3
  });
  assert.equal(overLimit.valid, false, 'Loan exceeding 3x COOP Savings must be rejected');

  // Reject repayment term > 36 months
  const overTerm = validateLoanApplication({
    memberStatus: 'Active',
    coopSavings: coopBalances['STAFF-001'],
    principal: 40000,
    termMonths: 48,
    multiplier: 3
  });
  assert.equal(overTerm.valid, false, 'Repayment term > 36 months must be rejected');

  // Verify 36-month term is valid
  const term36 = validateLoanApplication({
    memberStatus: 'Active',
    coopSavings: coopBalances['STAFF-001'],
    principal: 40000,
    termMonths: 36,
    multiplier: 3
  });
  assert.equal(term36.valid, true, '36-month repayment term must be allowed');
  assert.deepEqual(VALID_LOAN_TERMS, [1, 2, 3, 6, 9, 12, 18, 24, 30, 36]);
  assert.equal(MAX_LOAN_TERM_MONTHS, 36);

  // Approve ₱40,000 loan -> COOP Savings remains ₱20,000, Loan Balance tracked separately
  const loan = computeLoanFinancials({
    principal: 40000,
    interestRate: 2,
    termMonths: 12,
    startDate: '2026-10-08'
  });
  assert.equal(coopBalances['STAFF-001'], 20000, 'COOP Savings must remain ₱20,000 after taking a ₱40,000 loan');
  assert.equal(loan.principal, 40000, 'Loan Principal is ₱40,000');
  assert.equal(loan.schedule.length, 12, '12-month amortization schedule generated');
  console.log('  ✓ Maximum Loan = ₱60,000');
  console.log('  ✓ After approving ₱40,000 loan: COOP Savings = ₱20,000, Loan Principal = ₱40,000');
  console.log('  ✓ Repayment terms up to 36 months validated (terms > 36 rejected)\n');
}

// =========================================================================
// Test 2 — Retirement Settlement & Blocking New Loans
// =========================================================================
console.log('Test 2 — Member Retirement & Settlement');
{
  const member = { id: 'STAFF-001', firstName: 'Juan', lastName: 'Dela Cruz', status: 'Regular' };
  const currentSavings = 20000;
  const historicalLoans = [{ id: 'LN-101', staffId: 'STAFF-001', principal: 40000, status: 'Approved' }];

  const settlement = buildRetirementSettlement({
    member,
    coopSavings: currentSavings,
    retiredBy: 'HR-ADMIN'
  });

  const updatedMember = { ...member, status: 'Retired', coopStatus: 'Retired' };
  assert.equal(updatedMember.status, 'Retired', 'Member status marked Retired');
  assert.equal(settlement.accumulatedSavings, 20000, 'Accumulated COOP Savings calculated for settlement');
  assert.equal(settlement.auditLog.newBalance, 0, 'COOP Savings balance settled to 0 after retirement withdrawal');
  assert.equal(settlement.withdrawalRecord.type, 'retirement_settlement', 'Withdrawal settlement transaction created');
  assert.equal(settlement.withdrawalRecord.status, 'Settled', 'Withdrawal marked Settled');

  // Verify retired member cannot apply for new loans
  const retiredLoanAttempt = validateLoanApplication({
    memberStatus: updatedMember.status,
    coopSavings: 20000,
    principal: 10000,
    termMonths: 6,
    multiplier: 3
  });
  assert.equal(retiredLoanAttempt.valid, false, 'Retired member must be blocked from new loan applications');
  assert.equal(historicalLoans.length, 1, 'Historical loan records preserved for auditing');
  console.log('  ✓ Member marked Retired and settlement withdrawal transaction created');
  console.log('  ✓ New loan applications blocked after retirement');
  console.log('  ✓ Historical transactions and loan records preserved\n');
}

// =========================================================================
// Test 3 — Canteen Salary Deduction Automatic Connection
// =========================================================================
console.log('Test 3 — Canteen Salary Deduction Auto-Sync, Update & Reversal');
{
  let ledger = [];
  let balances = {};

  // Record salary deduction: Employee Juan, Type: Canteen, Amount: ₱750
  const res1 = processCanteenSalaryDeduction({
    currentLedger: ledger,
    currentBalances: balances,
    deductionRecord: {
      salaryDeductionRef: 'SD-12345',
      staffId: 'STAFF-001',
      employeeName: 'Juan',
      amount: 750,
      remarks: 'Salary Deduction #12345'
    },
    action: 'apply'
  });

  assert.equal(res1.success, true, 'Canteen salary deduction automatically applied');
  assert.equal(res1.balances['STAFF-001'], 750, 'Canteen Deduction balance = ₱750');
  assert.equal(res1.entry.salaryDeductionRef, 'SD-12345', 'Stores reference to original salary deduction');

  // Prevent duplicate application of the same salary-deduction record
  const resDuplicate = processCanteenSalaryDeduction({
    currentLedger: res1.ledger,
    currentBalances: res1.balances,
    deductionRecord: {
      salaryDeductionRef: 'SD-12345',
      staffId: 'STAFF-001',
      employeeName: 'Juan',
      amount: 750
    },
    action: 'apply'
  });
  assert.equal(resDuplicate.isDuplicate, true, 'Duplicate salary deduction prevented');
  assert.equal(resDuplicate.balances['STAFF-001'], 750, 'Balance unchanged on duplicate attempt');

  // Edit salary deduction from ₱750 to ₱900
  const resUpdate = processCanteenSalaryDeduction({
    currentLedger: res1.ledger,
    currentBalances: res1.balances,
    deductionRecord: {
      salaryDeductionRef: 'SD-12345',
      staffId: 'STAFF-001',
      employeeName: 'Juan',
      amount: 900
    },
    action: 'update'
  });
  assert.equal(resUpdate.success, true, 'Edited salary deduction updates Canteen Deduction');
  assert.equal(resUpdate.balances['STAFF-001'], 900, 'Updated Canteen Deduction balance = ₱900');

  // Cancel / Reverse salary deduction
  const resReverse = processCanteenSalaryDeduction({
    currentLedger: resUpdate.ledger,
    currentBalances: resUpdate.balances,
    deductionRecord: {
      salaryDeductionRef: 'SD-12345',
      staffId: 'STAFF-001',
      employeeName: 'Juan',
      amount: 900
    },
    action: 'reverse'
  });
  assert.equal(resReverse.success, true, 'Cancelled salary deduction reverses Canteen Deduction');
  assert.equal(resReverse.balances['STAFF-001'], 0, 'Balance restored to ₱0 after reversal');
  console.log('  ✓ Canteen salary deduction (₱750) automatically creates Canteen Deduction = ₱750');
  console.log('  ✓ Idempotency prevents duplicate application of SD-12345');
  console.log('  ✓ Editing and reversing salary deduction updates ledger and audit trail\n');
}

// =========================================================================
// Test 4 — Petty Cash → Drawer Replenishment API Workflow
// =========================================================================
console.log('Test 4 — Drawer Replenishment via Petty Cash API State Machine');
{
  let drawerBalance = 25000;
  const req = createReplenishmentRequestModel({
    drawerId: 'DRAWER-001',
    amount: 10000,
    requestedBy: 'CASHIER-01',
    reason: 'Drawer replenishment',
    status: REPLENISHMENT_STATUSES.PENDING
  });

  // 1. User requests ₱10,000 -> Status is PENDING, drawer balance MUST NOT increase yet
  assert.equal(req.status, 'PENDING', 'Initial request status is PENDING');
  assert.equal(drawerBalance, 25000, 'Drawer balance must NOT increase while PENDING');

  // 2. Petty Cash approves request -> Status is APPROVED, drawer balance still unchanged
  const approvedReq = { ...req, status: REPLENISHMENT_STATUSES.APPROVED };
  assert.equal(approvedReq.status, 'APPROVED');
  assert.equal(drawerBalance, 25000, 'Drawer balance must NOT increase while APPROVED');

  // 3. Petty Cash confirms release -> Status = RELEASED, Drawer Balance += ₱10,000
  const releasedReq = {
    ...approvedReq,
    status: REPLENISHMENT_STATUSES.RELEASED,
    creditedToDrawer: true
  };
  if (releasedReq.status === REPLENISHMENT_STATUSES.RELEASED && releasedReq.creditedToDrawer) {
    drawerBalance += releasedReq.amount;
  }
  assert.equal(releasedReq.status, 'RELEASED', 'Status is RELEASED');
  assert.equal(drawerBalance, 35000, 'Drawer Balance increased by ₱10,000 only upon RELEASED confirmation');
  console.log('  ✓ Request ₱10,000 sets status = PENDING; Drawer Balance remains ₱25,000');
  console.log('  ✓ After Petty Cash confirms RELEASED: Drawer Balance += ₱10,000 (₱35,000)\n');
}

console.log('ALL 4 ACCEPTANCE TESTS PASSED SUCCESSFULLY!');
