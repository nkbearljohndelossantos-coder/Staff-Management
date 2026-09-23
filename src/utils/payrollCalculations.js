/**
 * Payroll Calculation Engine
 * Implements standard statutory deductions (Social Security, Health Insurance, Pension/Housing, Withholding Tax)
 * and attendance adjustments (Overtime, Tardiness, Absences).
 */

export function formatCurrency(amount, currency = '₱') {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculates hourly and daily rate from monthly base salary
 * Assuming 22 working days/month and 8 hours/day
 */
export function getHourlyRate(monthlySalary) {
  const dailyRate = (Number(monthlySalary) || 0) / 22;
  return dailyRate / 8;
}

/**
 * Calculates SSS (Social Security) contribution bracket estimate
 */
export function calculateSocialSecurity(grossPay) {
  const base = Math.min(Math.max(grossPay, 4000), 30000);
  return Math.round(base * 0.045); // 4.5% employee share estimate
}

/**
 * Calculates Health Insurance (PhilHealth) contribution estimate
 */
export function calculateHealthInsurance(grossPay) {
  const base = Math.min(Math.max(grossPay, 10000), 100000);
  return Math.round(base * 0.025); // 2.5% employee share
}

/**
 * Calculates Pension / Provident Fund (Pag-IBIG) contribution
 */
export function calculatePension(grossPay) {
  return 200; // Standard monthly employee contribution
}

/**
 * Computes progressive withholding tax estimate
 */
export function calculateWithholdingTax(taxableIncome) {
  if (taxableIncome <= 20833) {
    return 0; // Tax-exempt bracket
  } else if (taxableIncome <= 33332) {
    return Math.round((taxableIncome - 20833) * 0.15);
  } else if (taxableIncome <= 66666) {
    return Math.round(1875 + (taxableIncome - 33333) * 0.20);
  } else if (taxableIncome <= 166666) {
    return Math.round(8541.80 + (taxableIncome - 66667) * 0.25);
  } else {
    return Math.round(33541.80 + (taxableIncome - 166667) * 0.30);
  }
}

/**
 * Complete payroll compilation for a single employee in a pay period
 */
export function computeEmployeePayroll(staff, attendance = {}, customAdjustments = {}) {
  const monthlySalary = Number(staff.baseSalary) || 25000;
  // If semi-monthly cutoff (half of monthly)
  const isSemiMonthly = staff.payFrequency !== 'monthly';
  const cutoffBasePay = isSemiMonthly ? monthlySalary / 2 : monthlySalary;
  
  const hourlyRate = getHourlyRate(monthlySalary);
  const minuteRate = hourlyRate / 60;

  // Attendance inputs
  const otHours = Number(attendance.otHours) || 0;
  const lateMinutes = Number(attendance.lateMinutes) || 0;
  const unpaidDays = Number(attendance.unpaidDays) || 0;

  // Overtime computation (1.25x regular hourly rate)
  const overtimePay = Math.round(otHours * hourlyRate * 1.25);

  // Incentives & Adjustments
  const bonus = Number(customAdjustments.bonus) || 0;
  const cutoffAllowance = 0;

  // Gross Earnings
  const grossPay = Math.round(cutoffBasePay + overtimePay + bonus);

  // Attendance Deductions
  const tardinessDeduction = Math.round(lateMinutes * minuteRate);
  const absentDeduction = Math.round(unpaidDays * (hourlyRate * 8));

  // Statutory Deductions (scaled to cut-off)
  const scale = isSemiMonthly ? 0.5 : 1.0;
  const sssDeduction = Math.round(calculateSocialSecurity(monthlySalary) * scale);
  const philhealthDeduction = Math.round(calculateHealthInsurance(monthlySalary) * scale);
  const pagibigDeduction = Math.round(calculatePension(monthlySalary) * scale);

  // Taxable income = Gross - Statutory
  const statutoryTotal = sssDeduction + philhealthDeduction + pagibigDeduction;
  const taxableIncome = Math.max(0, grossPay - statutoryTotal - tardinessDeduction - absentDeduction);
  const withholdingTax = Math.round(calculateWithholdingTax(taxableIncome * (isSemiMonthly ? 2 : 1)) * scale);

  // Other deductions (e.g. company loans & canteen cash advances)
  const loanDeduction = Number(customAdjustments.loanDeduction) || 0;
  const cashAdvanceDeduction = Number(customAdjustments.cashAdvanceDeduction) || 0;

  // Total Deductions & Net Pay
  const totalDeductions = tardinessDeduction + absentDeduction + statutoryTotal + withholdingTax + loanDeduction + cashAdvanceDeduction;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    cutoffBasePay,
    overtimePay,
    otHours,
    cutoffAllowance,
    bonus,
    grossPay,
    tardinessDeduction,
    lateMinutes,
    absentDeduction,
    unpaidDays,
    sssDeduction,
    philhealthDeduction,
    pagibigDeduction,
    statutoryTotal,
    withholdingTax,
    loanDeduction,
    cashAdvanceDeduction,
    totalDeductions,
    netPay,
    calculatedAt: new Date().toISOString()
  };
}
