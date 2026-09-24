/**
 * Payroll Calculation Engine
 * Implements standard statutory deductions (Social Security, Health Insurance, Pag-IBIG / HDMF, Withholding Tax)
 * based strictly on the manual "Filed Salary", decoupled from actual earnings and salary rate (daily/monthly).
 */

export function formatCurrency(amount, currency = '₱') {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Standard Philippine DOLE Annual Work Day Factors
export const FACTOR_5_DAYS = 261; // 365 days - 104 weekend days (Saturdays & Sundays)
export const FACTOR_6_DAYS = 313; // 365 days - 52 rest days (Sundays only)

/**
 * Calculates Equivalent Daily Rate (EDR) / Absence Rate
 * For Monthly Rate:
 *  - 5 Days Work Week: (Monthly Salary * 12) / 261 days
 *  - 6 Days Work Week: (Monthly Salary * 12) / 313 days
 * For Daily Rate:
 *  - Returns the daily salary rate directly
 */
export function getDailyRate(salaryRate, salaryRateType = 'monthly', workScheduleType = '6_days') {
  const rate = Number(salaryRate) || 0;
  if (rate <= 0) return 0;
  if (salaryRateType === 'daily') {
    return rate;
  }
  // Monthly rate calculation
  const factor = workScheduleType === '5_days' ? FACTOR_5_DAYS : FACTOR_6_DAYS;
  return (rate * 12) / factor;
}

/**
 * Calculates Hourly Rate from Daily Rate (based on standard 8-hour workday)
 */
export function getHourlyRate(dailyRate) {
  return (Number(dailyRate) || 0) / 8;
}

/**
 * Calculates Minute Rate from Daily Rate (based on 480 minutes per standard 8-hour shift)
 * Used as the exact deduction rate for tardiness/lateness.
 */
export function getMinuteRate(dailyRate) {
  return (Number(dailyRate) || 0) / 480;
}

/**
 * Calculates SSS (Social Security System) employee contribution from Filed Salary
 * 2025 SSS Schedule: 4.5% employee share based on Monthly Salary Credit (MSC ₱4,000 - ₱30,000)
 */
export function calculateSocialSecurity(filedSalary) {
  const base = Number(filedSalary) || 0;
  if (base <= 0) return 0;
  const msc = Math.min(Math.max(base, 4000), 30000);
  return Math.round(msc * 0.045);
}

/**
 * Calculates PhilHealth employee contribution from Filed Salary
 * 2024/2025 Premium Rate: 5% total (2.5% employee share), floor ₱10,000, ceiling ₱100,000
 */
export function calculateHealthInsurance(filedSalary) {
  const base = Number(filedSalary) || 0;
  if (base <= 0) return 0;
  const cappedBase = Math.min(Math.max(base, 10000), 100000);
  return Math.round(cappedBase * 0.025);
}

/**
 * Calculates Pag-IBIG / HDMF employee contribution from Filed Salary
 * 2% of monthly basic salary, capped at ₱200/month maximum employee contribution
 */
export function calculatePension(filedSalary) {
  const base = Number(filedSalary) || 0;
  if (base <= 0) return 0;
  const rate = base <= 1500 ? 0.01 : 0.02;
  return Math.min(Math.round(base * rate), 200);
}

/**
 * Computes progressive withholding tax estimate under the TRAIN Law monthly table
 */
export function calculateWithholdingTax(taxableIncome) {
  const inc = Number(taxableIncome) || 0;
  if (inc <= 20833) {
    return 0; // Tax-exempt bracket (₱250k annual threshold)
  } else if (inc <= 33332) {
    return Math.round((inc - 20833) * 0.15);
  } else if (inc <= 66666) {
    return Math.round(1875 + (inc - 33333) * 0.20);
  } else if (inc <= 166666) {
    return Math.round(8541.67 + (inc - 66667) * 0.25);
  } else if (inc <= 666666) {
    return Math.round(33541.67 + (inc - 166667) * 0.30);
  } else {
    return Math.round(183541.67 + (inc - 666667) * 0.35);
  }
}

/**
 * Computes all statutory "other deductions" (SSS, PhilHealth, HDMF, Tax)
 * based strictly on the manual "Filed Salary", completely decoupled from actual salary.
 *
 * @param {number|string} filedSalary - Declared filed salary for government compliance
 * @returns {object} Breakdown of monthly and cut-off (15-day semi-monthly) deductions
 */
export function computeFiledSalaryDeductions(filedSalary) {
  const fs = Number(filedSalary) || 0;
  if (fs <= 0) {
    return {
      filedSalary: 0,
      monthly: { sss: 0, philhealth: 0, pagibig: 0, tax: 0, mandatorySubtotal: 0, total: 0 },
      cutoff: { sss: 0, philhealth: 0, pagibig: 0, tax: 0, mandatorySubtotal: 0, total: 0 }
    };
  }

  // 1. SSS Employee Contribution
  const sssMonthly = calculateSocialSecurity(fs);

  // 2. PhilHealth Employee Contribution
  const philhealthMonthly = calculateHealthInsurance(fs);

  // 3. HDMF / Pag-IBIG Employee Contribution
  const pagibigMonthly = calculatePension(fs);

  // 4. Withholding Tax on taxable filed compensation
  const mandatorySubtotalMonthly = sssMonthly + philhealthMonthly + pagibigMonthly;
  const taxableFiledMonthly = Math.max(0, fs - mandatorySubtotalMonthly);
  const taxMonthly = calculateWithholdingTax(taxableFiledMonthly);

  const totalMonthly = mandatorySubtotalMonthly + taxMonthly;

  // Semi-monthly (15-day salary cut-off) breakdown
  const sssCutoff = Math.round(sssMonthly * 0.5);
  const philhealthCutoff = Math.round(philhealthMonthly * 0.5);
  const pagibigCutoff = Math.round(pagibigMonthly * 0.5);
  const taxCutoff = Math.round(taxMonthly * 0.5);
  const mandatorySubtotalCutoff = sssCutoff + philhealthCutoff + pagibigCutoff;
  const totalCutoff = mandatorySubtotalCutoff + taxCutoff;

  return {
    filedSalary: fs,
    monthly: {
      sss: sssMonthly,
      philhealth: philhealthMonthly,
      pagibig: pagibigMonthly,
      tax: taxMonthly,
      mandatorySubtotal: mandatorySubtotalMonthly,
      total: totalMonthly
    },
    cutoff: {
      sss: sssCutoff,
      philhealth: philhealthCutoff,
      pagibig: pagibigCutoff,
      tax: taxCutoff,
      mandatorySubtotal: mandatorySubtotalCutoff,
      total: totalCutoff
    }
  };
}

/**
 * Complete payroll compilation for a single employee in a pay period
 * Actual earnings derive from salaryRate (daily or monthly with 5-day / 6-day schedule),
 * while other deductions (SSS, PhilHealth, HDMF, Tax) derive strictly from filedSalary.
 */
export function computeEmployeePayroll(staff, attendance = {}, customAdjustments = {}) {
  const isSemiMonthly = staff.payFrequency !== 'monthly';
  const salaryRateType = staff.salaryRateType || 'monthly';
  // Daily rate employees are strictly 6 days per week (Monday to Saturday)
  const workScheduleType = salaryRateType === 'daily' ? '6_days' : (staff.workScheduleType || '6_days');
  const workFactorDays = workScheduleType === '5_days' ? FACTOR_5_DAYS : FACTOR_6_DAYS;

  // Determine actual compensation rate
  let salaryRate = Number(staff.salaryRate);
  if (!salaryRate || isNaN(salaryRate) || salaryRate <= 0) {
    salaryRate = Number(staff.baseSalary) || 25000;
  }

  let dailyRate = 0;
  let monthlyEquivalent = 0;
  let cutoffBasePay = 0;

  if (salaryRateType === 'daily') {
    dailyRate = salaryRate;
    // Daily rate employees are strictly 6 days per week: 26 working days/month, 13 days per 15-day cut-off
    monthlyEquivalent = Math.round(dailyRate * 26);
    cutoffBasePay = isSemiMonthly ? Math.round(dailyRate * 13) : monthlyEquivalent;
  } else {
    // monthly rate
    monthlyEquivalent = salaryRate;
    // Formula: (monthly salary x mos of a year) / days of year without weekend for 5 days (261) and without sunday for 6 days (313)
    dailyRate = (monthlyEquivalent * 12) / workFactorDays;
    // Semi-monthly 15-day salary: monthly / 2
    cutoffBasePay = isSemiMonthly ? (monthlyEquivalent / 2) : monthlyEquivalent;
  }

  // Hourly and minute rates for attendance computation
  const hourlyRate = dailyRate / 8;
  const minuteRate = hourlyRate / 60; // dailyRate / 480

  // Attendance inputs
  const otHours = Number(attendance.otHours) || 0;
  const lateMinutes = Number(attendance.lateMinutes) || 0;
  const unpaidDays = Number(attendance.unpaidDays) || 0;

  // Overtime computation (1.25x regular hourly rate for day shift extension)
  const overtimePay = Math.round(otHours * hourlyRate * 1.25);

  // Incentives & Adjustments
  const bonus = Number(customAdjustments.bonus) || 0;
  const cutoffAllowance = 0;

  // Actual Gross Earnings (Before attendance deductions)
  const grossPay = Math.round(cutoffBasePay + overtimePay + bonus + cutoffAllowance);

  // Attendance Deductions:
  // Tardiness based on minute rate: lateMinutes * minuteRate
  const tardinessDeduction = Math.round(lateMinutes * minuteRate);
  // Absences based on daily absence rate: unpaidDays * dailyRate
  const absentDeduction = Math.round(unpaidDays * dailyRate);

  // Net Basic Salary after absences: salary(15 days) - absences
  const netBasePayAfterAbsence = Math.max(0, cutoffBasePay - absentDeduction);

  // Statutory "Other Deductions" (SSS, PhilHealth, HDMF, Tax):
  // Rule: In computing other deduction, do NOT use actual salary; use manual "filed salary".
  const filedSalary = Number(staff.filedSalary) || 0;
  const statBreakdown = computeFiledSalaryDeductions(filedSalary);

  const sssDeduction = isSemiMonthly ? statBreakdown.cutoff.sss : statBreakdown.monthly.sss;
  const philhealthDeduction = isSemiMonthly ? statBreakdown.cutoff.philhealth : statBreakdown.monthly.philhealth;
  const pagibigDeduction = isSemiMonthly ? statBreakdown.cutoff.pagibig : statBreakdown.monthly.pagibig;
  const withholdingTax = isSemiMonthly ? statBreakdown.cutoff.tax : statBreakdown.monthly.tax;
  const statutoryTotal = sssDeduction + philhealthDeduction + pagibigDeduction + withholdingTax;

  // Other deductions (e.g. company loans & canteen cash advances)
  const loanDeduction = Number(customAdjustments.loanDeduction) || 0;
  const cashAdvanceDeduction = Number(customAdjustments.cashAdvanceDeduction) || 0;

  // Total Deductions & Net Pay
  const totalDeductions = tardinessDeduction + absentDeduction + statutoryTotal + loanDeduction + cashAdvanceDeduction;
  const netPay = Math.max(0, grossPay - totalDeductions);

  return {
    salaryRateType,
    workScheduleType,
    workFactorDays,
    salaryRate,
    dailyRate,
    hourlyRate,
    minuteRate,
    filedSalary,
    cutoffBasePay,
    netBasePayAfterAbsence,
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
    withholdingTax,
    statutoryTotal,
    loanDeduction,
    cashAdvanceDeduction,
    totalDeductions,
    netPay,
    calculatedAt: new Date().toISOString()
  };
}
