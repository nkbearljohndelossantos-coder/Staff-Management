import React from 'react';
import {
  X,
  User,
  Calendar,
  MapPin,
  Shield,
  DollarSign,
  Building,
  Briefcase,
  QrCode,
  Edit3,
  Calculator,
  Mail,
  Phone,
  KeyRound,
  CreditCard
} from 'lucide-react';
import {
  formatCurrency,
  computeFiledSalaryDeductions,
  getDailyRate,
  getHourlyRate,
  getMinuteRate,
  FACTOR_5_DAYS,
  FACTOR_6_DAYS
} from '../../utils/payrollCalculations';
import BarcodeView from '../common/BarcodeView';
import { useEscapeKey, ESCAPE_PRIORITY } from '../../utils/escapeStack';

export default function StaffDetailModal({
  staff,
  department,
  position,
  onClose,
  onEdit,
  onOpenDigitalId
}) {
  useEscapeKey('staff-detail-modal', ESCAPE_PRIORITY.MODAL, Boolean(staff), onClose);

  if (!staff) return null;

  const salaryRateType = staff.salaryRateType || 'monthly';
  const isDaily = salaryRateType === 'daily';
  const workScheduleType = isDaily ? '6_days' : (staff.workScheduleType || '6_days');
  const workFactorDays = workScheduleType === '5_days' ? FACTOR_5_DAYS : FACTOR_6_DAYS;
  const salaryRate = Number(staff.salaryRate) || Number(staff.baseSalary) || 0;
  const dailyRate = getDailyRate(salaryRate, salaryRateType, workScheduleType);
  const hourlyRate = getHourlyRate(dailyRate);
  const minuteRate = getMinuteRate(dailyRate);
  const cutoff15Days = isDaily
    ? dailyRate * 13
    : salaryRate / 2;
  const monthlyEquivalent = isDaily
    ? Math.round(salaryRate * 26)
    : salaryRate;
  const filedSalary = Number(staff.filedSalary) || 0;
  const statutory = computeFiledSalaryDeductions(filedSalary);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200 text-xs">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
              alt={staff.firstName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-200 shadow-sm bg-slate-100"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {staff.firstName} {staff.lastName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  {staff.employmentType || (staff.employeeId?.startsWith('PRJ') ? 'Contractual' : 'Regular')}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {position?.title || 'Staff Specialist'} · <span className="font-normal text-slate-500">{department?.name || 'General'}</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                  {staff.employeeId}
                </span>
                <span className="text-[10px] text-slate-500">
                  Hired: <strong>{formatDate(staff.dateHired || staff.hireDate)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(staff);
                }}
                className="h-8 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Edit Staff Profile"
              >
                <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Modal Body Sections */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

          {/* Section 1: Personal & Contact Information */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-slate-600" />
              Personal &amp; Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Birthday</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formatDate(staff.birthday)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Work Email</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="h-3 w-3 text-slate-400" />
                  {staff.email || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Contact Phone</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {staff.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Date Hired</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formatDate(staff.dateHired || staff.hireDate)}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Residential Address</span>
                <span className="text-slate-800 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  {staff.address || 'Address not registered'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Identification Numbers */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5 text-slate-600" />
              Government Statutory Identification Numbers
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">SSS No.</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {staff.sssNo || 'Not Filed'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">PhilHealth No.</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {staff.philHealthNo || 'Not Filed'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">HDMF / Pag-IBIG</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {staff.hdmfNo || 'Not Filed'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Taxpayer ID (TIN)</span>
                <span className="font-mono font-bold text-slate-900 text-[11px]">
                  {staff.tin || 'Not Filed'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Actual Compensation & Salary Rate */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <DollarSign className="h-3.5 w-3.5 text-slate-600" />
                Actual Compensation &amp; Work Schedule
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Actual wage basis</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Salary Rate</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {formatCurrency(salaryRate)} <span className="text-xs font-normal text-slate-500">/ {salaryRateType === 'daily' ? 'day' : 'month'}</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 capitalize font-medium">
                  {salaryRateType} Rate
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Work Schedule</span>
                <span className="font-bold text-slate-900 text-xs block">
                  {salaryRateType === 'daily'
                    ? '6 Days (Mon–Sat)'
                    : workScheduleType === '5_days'
                    ? '5 Days (Mon–Fri)'
                    : '6 Days (Mon–Sat)'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                  {salaryRateType === 'daily'
                    ? '26 days/mo · 13 days/cut-off'
                    : `${workFactorDays} days/yr divisor`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">15-Day Salary</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(cutoff15Days)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Cut-off base pay</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Disbursement</span>
                <span className="font-semibold text-slate-900 block truncate">
                  {staff.bankName === 'Cash' ? 'Cash (Over-the-Counter)' : staff.bankName}
                </span>
                <span className="font-mono text-[10px] text-slate-500 block">
                  {staff.bankName === 'Cash' ? 'Physical Payout' : (staff.bankAccount || 'No Account Set')}
                </span>
              </div>
            </div>

            {/* Attendance Deduction Formula Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-slate-600" />
                  Absence &amp; Tardiness Rate Formula
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {salaryRateType === 'monthly'
                    ? `(Monthly × 12) ÷ ${workFactorDays} days`
                    : 'Daily direct wage'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Daily Absence Rate</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(dailyRate)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Deducted per day missed</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hourly Rate</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(hourlyRate)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Daily Rate ÷ 8 hrs</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Minute Rate (Late)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(minuteRate)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Daily Rate ÷ 480 mins</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-0.5">
                <div>
                  <strong>Absences Policy:</strong> Salary(15 days) - Absences = {formatCurrency(cutoff15Days)} - (Absent Days × {formatCurrency(dailyRate)})
                </div>
                <div>
                  <strong>Tardiness Policy:</strong> Late Minutes × {formatCurrency(minuteRate)} (Minute Rate)
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Government Compliance: Filed Salary & Statutory Deductions */}
          <div className="p-3.5 rounded-2xl border-2 border-slate-300 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                <Calculator className="h-4 w-4 text-slate-800" />
                Statutory Deductions &amp; Filed Salary Basis
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold uppercase tracking-wider">
                Government Compliance (Decoupled)
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Manual Filed Salary</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {formatCurrency(filedSalary)} <span className="text-xs text-slate-500 font-normal">/ month</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Statutory Deductions</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {formatCurrency(statutory.monthly.total)} <span className="text-xs text-slate-500 font-normal">/mo</span>
                </span>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutory.cutoff.total)} / 15-day cut-off
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">SSS</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutory.monthly.sss)}
                  <span className="text-[9px] text-slate-400 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutory.cutoff.sss)} / cutoff
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">PhilHealth</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutory.monthly.philhealth)}
                  <span className="text-[9px] text-slate-400 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutory.cutoff.philhealth)} / cutoff
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">HDMF (Pag-IBIG)</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutory.monthly.pagibig)}
                  <span className="text-[9px] text-slate-400 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutory.cutoff.pagibig)} / cutoff
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Withholding Tax</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutory.monthly.tax)}
                  <span className="text-[9px] text-slate-400 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutory.cutoff.tax)} / cutoff
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 italic">
              * Statutory contributions are computed solely from the manual Filed Salary and do not affect or derive from actual take-home earnings or hours worked.
            </p>
          </div>

          {/* Section 5: Barcode & Kiosk Integration */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                <BarcodeView value={staff.barcodeValue || staff.employeeId} width={1.0} height={22} displayValue={false} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Time Kiosk Barcode</span>
                <span className="font-mono font-black text-slate-900 text-xs">
                  {staff.barcodeValue || staff.employeeId}
                </span>
                <span className="text-[10px] text-slate-500 block">Kiosk PIN: {staff.pin || '12345678'}</span>
              </div>
            </div>

            {onOpenDigitalId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDigitalId(staff);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm shrink-0"
              >
                <QrCode className="h-3.5 w-3.5 text-cyan-400" />
                <span>Open Digital ID Pass</span>
              </button>
            )}
          </div>

        </div>

        {/* Modal Actions */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
