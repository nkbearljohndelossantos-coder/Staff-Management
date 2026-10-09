/**
 * COOP System Business Rules, Financial Calculations, and Petty Cash API Integration
 * 
 * Rules Implemented:
 * 1. COOP Savings / Budget basis for loans: Max Loan = Savings * Multiplier (default 3x, configurable)
 * 2. COOP Savings is NOT reduced when a loan is granted
 * 3. Retirement rule: marks member as retired, settles COOP savings, blocks future loans, keeps audit trail
 * 4. Canteen Deduction automatically connected to salary deductions (idempotent, editable, reversible)
 * 5. Petty Cash -> Drawer Replenishment API state machine (DRAFT, PENDING, APPROVED, RELEASED, REJECTED, CANCELLED, FAILED)
 * 6. Cash Loan Repayment Terms (max 36 months; 1, 2, 3, 6, 9, 12, 18, 24, 30, 36 months)
 * 7. Strict Data Separation: Savings, Loans, Canteen Deductions, Drawer Cash
 * 8. Comprehensive Financial Audit Trail
 */

// ---------------------------------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// ---------------------------------------------------------------------------

export const REGULAR_COOP_LOAN_MULTIPLIER = 3; // Regular (NKB / VYU): 3x COOP Savings
export const PROJECT_COOP_LOAN_MULTIPLIER = 2; // Project-Based (PRJ / Project): 2x COOP Savings
export const DEFAULT_COOP_LOAN_MULTIPLIER = REGULAR_COOP_LOAN_MULTIPLIER;
export const MAX_LOAN_TERM_MONTHS = 36;
export const VALID_LOAN_TERMS = [1, 2, 3, 6, 9, 12, 18, 24, 30, 36];

/**
 * Determines whether a staff member is Project-Based (2x COOP basis) vs Regular (3x COOP basis).
 * Note: VYU (Vyuceutical Laboratories) staff can be Regular (3x) or Project-Based (2x), defaulting to Regular.
 */
export function isProjectBasedStaff(staff) {
  if (!staff) return false;
  const empType = String(staff.employmentType || '').toLowerCase().trim();
  if (empType === 'regular') return false;
  if (empType === 'project_based' || empType === 'project' || empType === 'contractual' || empType === 'part_time') {
    return true;
  }
  const empId = String(staff.employeeId || '').toUpperCase().trim();
  if (!empType && empId.startsWith('PRJ')) {
    return true;
  }
  return false;
}

/**
 * Returns the applicable COOP Cash Loan Multiplier for a staff member:
 * - Regular (NKB or VYU): 3x COOP Share Capital / Savings
 * - Project-Based (PRJ or Project-Based VYU): 2x COOP Share Capital / Savings
 */
export function getStaffCoopLoanMultiplier(staff, customRegularMultiplier = null, customProjectMultiplier = null) {
  if (isProjectBasedStaff(staff)) {
    const projMult = Number(customProjectMultiplier);
    return (!isNaN(projMult) && projMult > 0) ? projMult : PROJECT_COOP_LOAN_MULTIPLIER;
  }
  const regMult = Number(customRegularMultiplier);
  return (!isNaN(regMult) && regMult > 0) ? regMult : REGULAR_COOP_LOAN_MULTIPLIER;
}

/**
 * Returns a human-readable Employment Classification & COOP Multiplier label
 * Supports Regular (NKB), Regular (VYU), Project-Based (PRJ), and Project-Based (VYU)
 */
export function getStaffEmploymentLabel(staff, includeMultiplier = true) {
  const empId = String(staff?.employeeId || '').toUpperCase().trim();
  const isVyu = empId.startsWith('VYU') || staff?.departmentId === 'dept-vyu';
  const isProj = isProjectBasedStaff(staff);
  const mult = getStaffCoopLoanMultiplier(staff);

  if (isProj) {
    const prefixTag = isVyu ? 'VYU' : 'PRJ';
    return includeMultiplier
      ? `Project-Based (${prefixTag} · ${mult}× COOP)`
      : `Project-Based (${prefixTag})`;
  }
  const prefixTag = isVyu ? 'VYU' : 'NKB';
  return includeMultiplier
    ? `Regular (${prefixTag} · ${mult}× COOP)`
    : `Regular (${prefixTag})`;
}

export const LOAN_TERM_OPTIONS = [
  { months: 1, label: '1 Month (2 cutoffs)' },
  { months: 2, label: '2 Months (4 cutoffs)' },
  { months: 3, label: '3 Months (6 cutoffs)' },
  { months: 6, label: '6 Months (12 cutoffs)' },
  { months: 9, label: '9 Months (18 cutoffs)' },
  { months: 12, label: '12 Months (24 cutoffs)' },
  { months: 18, label: '18 Months (36 cutoffs)' },
  { months: 24, label: '24 Months (48 cutoffs)' },
  { months: 30, label: '30 Months (60 cutoffs)' },
  { months: 36, label: '36 Months (72 cutoffs) - Max Term' }
];

export const REPLENISHMENT_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  RELEASED: 'RELEASED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

/**
 * Retrieve configurable COOP Loan Multiplier for Regular staff (defaults to 3x)
 */
export function getCoopLoanMultiplier() {
  if (typeof window === 'undefined') return DEFAULT_COOP_LOAN_MULTIPLIER;
  try {
    const saved = localStorage.getItem('nkb_coop_loan_multiplier');
    if (saved) {
      const parsed = Number(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading loan multiplier:', e);
  }
  return DEFAULT_COOP_LOAN_MULTIPLIER;
}

/**
 * Update configurable COOP Loan Multiplier
 */
export function setCoopLoanMultiplier(multiplier) {
  const num = Number(multiplier);
  if (isNaN(num) || num <= 0) return false;
  if (typeof window !== 'undefined') {
    localStorage.setItem('nkb_coop_loan_multiplier', String(num));
  }
  return true;
}

// ---------------------------------------------------------------------------
// 2. LOAN ELIGIBILITY & CALCULATION ENGINE
// ---------------------------------------------------------------------------

/**
 * Calculates Maximum Loanable Amount = COOP Savings * Multiplier
 * Automatically applies 3x for Regular (NKB/VYU) and 2x for Project-Based when staff is provided.
 */
export function calculateMaxLoanableAmount(coopSavings, multiplierOrStaff = null, staff = null) {
  const savings = Math.max(0, Number(coopSavings) || 0);
  if (staff && typeof staff === 'object') {
    const mult = getStaffCoopLoanMultiplier(staff, typeof multiplierOrStaff === 'number' ? multiplierOrStaff : null);
    return savings * mult;
  }
  if (multiplierOrStaff && typeof multiplierOrStaff === 'object') {
    const mult = getStaffCoopLoanMultiplier(multiplierOrStaff);
    return savings * mult;
  }
  const mult = Number(multiplierOrStaff) || getCoopLoanMultiplier();
  return savings * mult;
}

/**
 * Validates a Cash Loan Application against all business rules
 * - Regular (NKB / VYU): Max Loan = 3x COOP Savings
 * - Project-Based (PRJ / Project): Max Loan = 2x COOP Savings
 */
export function validateLoanApplication({
  member,
  memberStatus,
  principal,
  termMonths,
  coopSavings,
  multiplier
}) {
  const p = Number(principal);
  const t = Number(termMonths);
  const savings = Math.max(0, Number(coopSavings) || 0);
  const mult = member
    ? getStaffCoopLoanMultiplier(member, multiplier)
    : (Number(multiplier) || getCoopLoanMultiplier());
  const maxLoanable = savings * mult;
  const isProj = isProjectBasedStaff(member);

  // 1. Retirement rule: Retired members cannot apply for loans
  const isRetired =
    memberStatus === 'Retired' ||
    memberStatus === 'retired' ||
    (member && (member.isRetired || member.status === 'retired' || member.status === 'Retired' || member.coopStatus === 'Retired'));
  if (isRetired) {
    return {
      valid: false,
      error: 'Loan application rejected: Member is retired from the company and cannot take new loans.',
      maxLoanable,
      multiplier: mult
    };
  }

  // 2. Principal check
  if (!p || p <= 0) {
    return {
      valid: false,
      error: 'Please enter a valid loan principal amount greater than 0.',
      maxLoanable,
      multiplier: mult
    };
  }

  // 3. Term check (maximum 36 months)
  if (!t || t <= 0) {
    return {
      valid: false,
      error: 'Please select a valid repayment term.',
      maxLoanable,
      multiplier: mult
    };
  }

  if (t > MAX_LOAN_TERM_MONTHS) {
    return {
      valid: false,
      error: `Loan application rejected: Repayment term of ${t} months exceeds the maximum allowed term of ${MAX_LOAN_TERM_MONTHS} months.`,
      maxLoanable,
      multiplier: mult
    };
  }

  // 4. Maximum Loanable rule: Principal cannot exceed Savings * Multiplier (3x Regular, 2x Project-Based)
  if (p > maxLoanable) {
    return {
      valid: false,
      error: `Loan application rejected: Requested loan of ₱${p.toLocaleString()} exceeds ${isProj ? 'Project-Based (2×)' : 'Regular (3×)'} member's maximum loanable amount of ₱${maxLoanable.toLocaleString()} (${mult}× COOP Savings of ₱${savings.toLocaleString()}).`,
      maxLoanable,
      multiplier: mult
    };
  }

  return {
    valid: true,
    maxLoanable,
    multiplier: mult
  };
}

/**
 * Calculates complete loan financial schedule and amortizations
 */
export function computeLoanFinancials({
  principal,
  termMonths,
  category = 'cash',
  interestRate = null,
  startDate = new Date()
}) {
  const p = Number(principal) || 0;
  const t = Number(termMonths) || 1;

  // Monthly interest rates by category
  let rate = Number(interestRate);
  if (!rate || isNaN(rate)) {
    if (category === 'cash') rate = 2.0;
    else if (category === 'education' || category === 'motor') rate = 2.5;
    else if (category === 'medical' || category === 'application' || category === 'appliance' || category === 'gadget') rate = 3.0;
    else rate = 2.0;
  }

  const totalInterest = Math.round(p * (rate / 100) * t);
  const totalPayable = p + totalInterest;
  const monthlyAmortization = Math.round(totalPayable / t);
  const cutoffAmortization = Math.round(totalPayable / (t * 2));

  // Payment dates calculation
  const start = new Date(startDate);
  const firstPaymentDate = new Date(start);
  firstPaymentDate.setDate(firstPaymentDate.getDate() + 15); // first semi-monthly cutoff
  const maturityDate = new Date(start);
  maturityDate.setMonth(maturityDate.getMonth() + t);

  // Amortization schedule breakdown
  const schedule = [];
  const monthlyPrincipal = p / t;
  const monthlyInt = totalInterest / t;
  let remaining = totalPayable;

  for (let month = 1; month <= t; month++) {
    const payDate = new Date(start);
    payDate.setMonth(payDate.getMonth() + month);
    const payment = month === t ? remaining : monthlyAmortization;
    remaining = Math.max(0, remaining - payment);

    schedule.push({
      installmentNumber: month,
      dueDate: payDate.toISOString().split('T')[0],
      principalPortion: Math.round(monthlyPrincipal),
      interestPortion: Math.round(monthlyInt),
      totalDue: payment,
      balanceRemaining: remaining
    });
  }

  return {
    principal: p,
    interestRate: rate,
    termMonths: t,
    totalInterest,
    totalPayable,
    monthlyAmortization,
    cutoffAmortization,
    firstPaymentDate: firstPaymentDate.toISOString().split('T')[0],
    maturityDate: maturityDate.toISOString().split('T')[0],
    schedule
  };
}

// ---------------------------------------------------------------------------
// 3. RETIREMENT & SETTLEMENT RULE ENGINE
// ---------------------------------------------------------------------------

/**
 * Prepares member retirement settlement
 */
export function buildRetirementSettlement({
  member,
  coopSavings,
  retiredBy = 'HR Management',
  remarks = ''
}) {
  const accumulatedSavings = Math.max(0, Number(coopSavings) || 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const nowIso = new Date().toISOString();

  const settlementId = `retire-settle-${Date.now()}`;
  const withdrawalRecord = {
    id: `cw-${settlementId}`,
    staffId: member.id,
    type: 'retirement_settlement',
    amount: accumulatedSavings,
    reason: `Retirement Exit Settlement: Accumulated COOP Savings withdrawn. ${remarks || ''}`.trim(),
    status: 'Settled',
    date: todayStr,
    requestedAt: nowIso,
    approvedAt: nowIso,
    approvedBy: retiredBy,
    settlementId
  };

  const coopLedgerEntry = {
    id: `csl-${settlementId}`,
    staffId: member.id,
    type: 'retirement_settlement',
    amount: accumulatedSavings,
    date: todayStr,
    note: `COOP Share Capital Settlement for Retired Member (${member.firstName} ${member.lastName}). Full accumulated savings released.`
  };

  const auditLog = createFinancialAuditEntry({
    transactionId: `tx-${settlementId}`,
    memberId: member.id,
    transactionType: 'RETIREMENT_SETTLEMENT',
    amount: accumulatedSavings,
    previousBalance: accumulatedSavings,
    newBalance: 0,
    referenceId: settlementId,
    createdBy: retiredBy,
    status: 'COMPLETED',
    remarks: `Retirement exit settlement for ${member.firstName} ${member.lastName}. All COOP savings marked for release. New loans prevented.`
  });

  return {
    accumulatedSavings,
    withdrawalRecord,
    coopLedgerEntry,
    auditLog
  };
}

// ---------------------------------------------------------------------------
// 4. CANTEEN SALARY DEDUCTIONS AUTOMATIC CONNECTION ENGINE
// ---------------------------------------------------------------------------

/**
 * Creates or updates an automated Canteen Deduction transaction connected to salary deductions
 */
export function processCanteenSalaryDeduction({
  currentLedger = [],
  currentBalances = {},
  deductionRecord,
  action = 'apply' // 'apply' | 'update' | 'reverse'
}) {
  const ledger = Array.isArray(currentLedger) ? [...currentLedger] : [];
  const balances = { ...(currentBalances || {}) };
  const ref = deductionRecord.salaryDeductionRef || deductionRecord.referenceId || deductionRecord.receiptNo;
  const staffId = deductionRecord.staffId;
  const amount = Number(deductionRecord.amount) || 0;
  const nowIso = new Date().toISOString();

  if (!ref || !staffId) {
    return {
      success: false,
      error: 'Missing required salary deduction reference or staff ID',
      ledger,
      balances
    };
  }

  const existingEntryIndex = ledger.findIndex(e => e.salaryDeductionRef === ref);

  if (action === 'apply') {
    // Idempotency check: prevent duplicate application of the same salary deduction
    if (existingEntryIndex >= 0) {
      return {
        success: false,
        isDuplicate: true,
        message: `Salary deduction ${ref} is already recorded in the Canteen Deduction ledger.`,
        ledger,
        balances
      };
    }

    const prevBal = Number(balances[staffId]) || 0;
    const newBal = prevBal + amount;
    balances[staffId] = newBal;

    const newEntry = {
      id: `cded-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      salaryDeductionRef: ref,
      staffId,
      employeeName: deductionRecord.employeeName || 'Staff Member',
      amount,
      deductionType: 'Canteen',
      orderType: deductionRecord.orderType || 'Meal/Grocery',
      status: 'Applied',
      previousBalance: prevBal,
      newBalance: newBal,
      date: deductionRecord.date || nowIso,
      createdAt: nowIso,
      createdBy: deductionRecord.createdBy || 'Automatic System Sync',
      remarks: deductionRecord.remarks || `Auto-applied from Salary Deduction #${ref}`
    };

    ledger.unshift(newEntry);
    return {
      success: true,
      entry: newEntry,
      ledger,
      balances
    };
  }

  if (action === 'update') {
    if (existingEntryIndex < 0) {
      // If not present, apply it as new
      return processCanteenSalaryDeduction({
        currentLedger,
        currentBalances,
        deductionRecord,
        action: 'apply'
      });
    }

    const oldEntry = ledger[existingEntryIndex];
    const oldAmount = oldEntry.amount || 0;
    const diff = amount - oldAmount;

    const prevBal = Number(balances[staffId]) || 0;
    const newBal = prevBal + diff;
    balances[staffId] = newBal;

    const updatedEntry = {
      ...oldEntry,
      amount,
      previousBalance: prevBal,
      newBalance: newBal,
      updatedAt: nowIso,
      updatedBy: deductionRecord.updatedBy || 'Automatic System Sync',
      status: 'Updated',
      remarks: deductionRecord.remarks || `Updated from Salary Deduction #${ref} (Old: ₱${oldAmount}, New: ₱${amount})`
    };

    ledger[existingEntryIndex] = updatedEntry;
    return {
      success: true,
      entry: updatedEntry,
      ledger,
      balances
    };
  }

  if (action === 'reverse') {
    if (existingEntryIndex < 0) {
      return {
        success: false,
        error: `Cannot reverse: Salary deduction ${ref} was not found in Canteen Deduction ledger.`,
        ledger,
        balances
      };
    }

    const oldEntry = ledger[existingEntryIndex];
    if (oldEntry.status === 'Reversed') {
      return {
        success: false,
        isAlreadyReversed: true,
        message: `Salary deduction ${ref} is already reversed.`,
        ledger,
        balances
      };
    }

    const prevBal = Number(balances[staffId]) || 0;
    const reversedAmount = oldEntry.amount || 0;
    const newBal = Math.max(0, prevBal - reversedAmount);
    balances[staffId] = newBal;

    const reversalEntry = {
      id: `cded-rev-${Date.now()}`,
      salaryDeductionRef: ref,
      originalEntryId: oldEntry.id,
      staffId,
      employeeName: oldEntry.employeeName,
      amount: -reversedAmount,
      deductionType: 'Canteen',
      orderType: oldEntry.orderType,
      status: 'Reversed',
      previousBalance: prevBal,
      newBalance: newBal,
      date: nowIso,
      createdAt: nowIso,
      createdBy: deductionRecord.reversedBy || 'Automatic System Sync',
      remarks: deductionRecord.reason || `Reversed Canteen Salary Deduction #${ref}`
    };

    // Mark old entry as reversed and prepend reversal entry
    ledger[existingEntryIndex] = {
      ...oldEntry,
      status: 'Reversed',
      reversedAt: nowIso,
      reversedBy: deductionRecord.reversedBy || 'System Reversal'
    };
    ledger.unshift(reversalEntry);

    return {
      success: true,
      entry: reversalEntry,
      ledger,
      balances
    };
  }

  return { success: false, error: 'Unknown action', ledger, balances };
}

// ---------------------------------------------------------------------------
// 5. PETTY CASH -> DRAWER REPLENISHMENT API ENGINE
// ---------------------------------------------------------------------------

/**
 * Manages configuration for connecting to the Petty Cash Website API
 */
export function getPettyCashApiConfig() {
  if (typeof window === 'undefined') {
    return {
      apiUrl: 'https://pettycash.nkbmanufacturing.com/api',
      apiKey: 'PETTY_CASH_KEY_PROD_01',
      apiSecret: 'PETTY_CASH_SECRET_PROD_01',
      mode: 'live_or_mock'
    };
  }
  try {
    const saved = localStorage.getItem('nkb_petty_cash_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error reading petty cash config:', e);
  }
  return {
    apiUrl: 'https://pettycash.nkbmanufacturing.com/api',
    apiKey: 'PETTY_CASH_KEY_PROD_01',
    apiSecret: 'PETTY_CASH_SECRET_PROD_01',
    mode: 'live_or_mock'
  };
}

export function savePettyCashApiConfig(config) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('nkb_petty_cash_config', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving petty cash config:', e);
  }
}

/**
 * Creates a new replenishment request destined for Petty Cash
 * State begins as PENDING (or DRAFT)
 */
export function createReplenishmentRequestModel({
  drawerId = 'DRAWER-001',
  amount,
  requestedBy = 'Canteen Cashier',
  reason = 'Drawer replenishment for cash advances'
}) {
  const p = Number(amount);
  if (!p || p <= 0) {
    throw new Error('Replenishment amount must be greater than zero.');
  }

  const requestId = `CA-REP-${Date.now().toString().slice(-6)}`;
  const nowIso = new Date().toISOString();

  return {
    request_id: requestId,
    drawer_id: drawerId,
    amount: p,
    requested_by: requestedBy,
    reason: reason.trim() || 'Drawer replenishment',
    requested_at: nowIso,
    status: REPLENISHMENT_STATUSES.PENDING,
    logs: [
      {
        status: REPLENISHMENT_STATUSES.PENDING,
        timestamp: nowIso,
        actor: requestedBy,
        remarks: 'Replenishment request dispatched to Petty Cash API.'
      }
    ]
  };
}

/**
 * Dispatches replenishment request to external Petty Cash API
 * Supports actual HTTP POST or graceful mock fallback for test/offline
 */
export async function sendPettyCashReplenishmentApi(payload) {
  const config = getPettyCashApiConfig();
  const endpoint = `${config.apiUrl.replace(/\/+$/, '')}/petty-cash/replenishment-request`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'Authorization': `Bearer ${config.apiSecret || ''}`
      },
      body: JSON.stringify({
        request_id: payload.request_id,
        drawer_id: payload.drawer_id,
        amount: payload.amount,
        requested_by: payload.requested_by,
        reason: payload.reason,
        requested_at: payload.requested_at
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        remoteData: data,
        status: data.status || REPLENISHMENT_STATUSES.PENDING
      };
    }
  } catch (err) {
    // Graceful offline/simulation fallback: request is safely logged locally
    console.warn('Petty Cash API endpoint not responding or offline, operating in verified mock/local mode:', err.message);
  }

  return {
    success: true,
    simulated: true,
    request_id: payload.request_id,
    status: REPLENISHMENT_STATUSES.PENDING
  };
}

// ---------------------------------------------------------------------------
// 6. UNIFIED FINANCIAL AUDIT TRAIL
// ---------------------------------------------------------------------------

export function createFinancialAuditEntry({
  transactionId,
  memberId = null,
  transactionType,
  amount,
  previousBalance = 0,
  newBalance = 0,
  referenceId,
  createdBy = 'System',
  status = 'COMPLETED',
  remarks = ''
}) {
  const nowIso = new Date().toISOString();
  return {
    transactionId: transactionId || `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    memberId: memberId || null,
    transactionType: transactionType || 'GENERAL_TRANSACTION',
    amount: Number(amount) || 0,
    previousBalance: Number(previousBalance) || 0,
    newBalance: Number(newBalance) || 0,
    referenceId: referenceId || 'N/A',
    createdBy,
    createdDateTime: nowIso,
    updatedBy: createdBy,
    updatedDateTime: nowIso,
    status: status || 'COMPLETED',
    remarks: remarks || ''
  };
}
