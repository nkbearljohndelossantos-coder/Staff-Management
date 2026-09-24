import React, { useState } from 'react';
import {
  X,
  Sparkles,
  UserPlus,
  Save,
  DollarSign,
  Plus,
  Building,
  Briefcase,
  Eye,
  EyeOff,
  Camera,
  Upload,
  Trash2,
  Calendar,
  MapPin,
  Shield,
  FileText,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateNextEmployeeId } from '../../utils/idGenerator';
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

export default function StaffFormModal({ staff, onClose }) {
  const { staffList, departments, positions, addStaff, updateStaff, addDepartment, addPosition } = useApp();

  useEscapeKey('staff-form-modal', ESCAPE_PRIORITY.MODAL, true, onClose);

  const isEditing = Boolean(staff);

  const [formData, setFormData] = useState({
    firstName: staff?.firstName || '',
    lastName: staff?.lastName || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    birthday: staff?.birthday || '',
    address: staff?.address || '',
    avatar: staff?.avatar || '',
    employmentType: staff?.employmentType || (staff?.employeeId?.startsWith('PRJ') ? 'contractual' : 'regular'),
    positionId: staff?.positionId || positions[0]?.id || '',
    departmentId: staff?.departmentId || departments[0]?.id || '',
    role: staff?.role || 'employee',
    dateHired: staff?.dateHired || staff?.hireDate || new Date().toISOString().split('T')[0],
    hireDate: staff?.hireDate || staff?.dateHired || new Date().toISOString().split('T')[0],

    // Government Statutory Identifiers
    sssNo: staff?.sssNo || '',
    philHealthNo: staff?.philHealthNo || '',
    hdmfNo: staff?.hdmfNo || '',
    tin: staff?.tin || '',

    // Actual Compensation Setup
    salaryRateType: staff?.salaryRateType || 'monthly', // 'daily' | 'monthly'
    workScheduleType: staff?.workScheduleType || '6_days', // '5_days' | '6_days'
    salaryRate: staff?.salaryRate !== undefined ? staff.salaryRate : (staff?.baseSalary || 25000),
    baseSalary: staff?.baseSalary || 25000,
    payFrequency: staff?.payFrequency || 'semi-monthly',

    // Government Compliance Filed Salary (basis for SSS, PhilHealth, HDMF, Tax)
    filedSalary: staff?.filedSalary !== undefined ? staff.filedSalary : 0,

    bankName: staff?.bankName || 'BDO Unibank',
    bankAccount: staff?.bankAccount || '',
    pin: staff?.pin || '12345678'
  });

  // Suggested next ID for employee based on employment type (NKB for regular, PRJ for part-time/contractual)
  const nextId = isEditing
    ? staff.employeeId
    : generateNextEmployeeId(staffList, formData.employmentType, 2026);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Inline modal state for adding new department
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  // Inline modal state for adding new position
  const [showAddPos, setShowAddPos] = useState(false);
  const [newPosTitle, setNewPosTitle] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Automatically update department when position is selected
  const handlePositionChange = (posId) => {
    const selectedPos = positions.find(p => p.id === posId);
    if (selectedPos) {
      setFormData(prev => ({
        ...prev,
        positionId: posId,
        departmentId: selectedPos.departmentId || prev.departmentId
      }));
    }
  };

  const handleQuickAddDepartment = (e) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;
    const created = addDepartment({
      name: newDeptName.trim(),
      code: newDeptCode.trim().toUpperCase(),
      manager: 'To be assigned'
    });
    setFormData(prev => ({ ...prev, departmentId: created.id }));
    setNewDeptName('');
    setNewDeptCode('');
    setShowAddDept(false);
  };

  const handleQuickAddPosition = (e) => {
    e.preventDefault();
    if (!newPosTitle.trim()) return;
    const created = addPosition({
      title: newPosTitle.trim(),
      departmentId: formData.departmentId || departments[0]?.id
    });
    setFormData(prev => ({
      ...prev,
      positionId: created.id
    }));
    setNewPosTitle('');
    setShowAddPos(false);
  };

  const standardBanks = [
    'Cash',
    'BDO Unibank',
    'Bank of the Philippine Islands (BPI)',
    'Metrobank',
    'Security Bank',
    'UnionBank of the Philippines',
    'Land Bank of the Philippines',
    'RCBC'
  ];

  const isCash = formData.bankName === 'Cash';

  const handleBankChange = (value) => {
    if (value === 'Cash') {
      setFormData(prev => ({
        ...prev,
        bankName: 'Cash',
        bankAccount: 'N/A'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bankName: value,
        bankAccount: (prev.bankAccount.startsWith('N/A') || prev.bankAccount === '') ? '' : prev.bankAccount
      }));
    }
  };

  const statutoryBreakdown = computeFiledSalaryDeductions(formData.filedSalary);

  const rateValue = Number(formData.salaryRate) || 0;
  const isMonthlyRate = formData.salaryRateType === 'monthly';
  const effectiveScheduleType = isMonthlyRate ? (formData.workScheduleType || '6_days') : '6_days';
  const workFactorDays = effectiveScheduleType === '5_days' ? FACTOR_5_DAYS : FACTOR_6_DAYS;
  const computedDailyRate = getDailyRate(rateValue, formData.salaryRateType, effectiveScheduleType);
  const computedHourlyRate = getHourlyRate(computedDailyRate);
  const computedMinuteRate = getMinuteRate(computedDailyRate);
  const computedCutoff15Days = isMonthlyRate
    ? rateValue / 2
    : computedDailyRate * 13; // 13 days in a 15-day semi-monthly cut-off for 6-day work week

  const handleSubmit = (e) => {
    e.preventDefault();
    const rateVal = Number(formData.salaryRate) || 0;
    const monthlyEquivalent = formData.salaryRateType === 'daily'
      ? Math.round(rateVal * 26) // 26 working days per month for 6-day work week
      : rateVal;

    const finalData = {
      ...formData,
      workScheduleType: formData.salaryRateType === 'daily' ? '6_days' : formData.workScheduleType,
      employeeId: isEditing ? staff.employeeId : nextId,
      barcodeValue: isEditing ? staff.barcodeValue : nextId,
      dateHired: formData.dateHired || formData.hireDate,
      hireDate: formData.dateHired || formData.hireDate,
      birthday: formData.birthday || '',
      address: formData.address || '',
      sssNo: formData.sssNo || '',
      philHealthNo: formData.philHealthNo || '',
      hdmfNo: formData.hdmfNo || '',
      tin: formData.tin || '',
      salaryRateType: formData.salaryRateType,
      salaryRate: rateVal,
      baseSalary: monthlyEquivalent,
      filedSalary: Number(formData.filedSalary) || 0,
      bankName: formData.bankName === 'Other' ? (formData.customBank || 'Other Bank') : formData.bankName,
      bankAccount: isCash ? 'N/A' : formData.bankAccount
    };
    delete finalData.allowance;
    if (isEditing) {
      updateStaff(staff.id, finalData);
    } else {
      addStaff(finalData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-slate-600" />
              {isEditing ? 'Edit Staff Profile' : 'Onboard New Staff Member'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Update employment, credentials and salary profile' : 'Automated ID sequencing, barcode generation & payroll setup'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Automated ID & Barcode Card with Employment Classification */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-slate-500" />
                  Automated Employee ID Generator
                </span>
                <div className="font-mono text-lg font-black text-slate-900 tracking-wider flex items-center gap-2">
                  <span>{nextId}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-200 text-slate-800 border border-slate-300">
                    {formData.employmentType === 'regular' ? 'Regular (NKB)' : formData.employmentType === 'contractual' ? 'Contractual (PRJ)' : 'Part-Time (PRJ)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {formData.employmentType === 'regular' ? (
                    <>Prefix: <span className="font-mono text-slate-900 font-bold">NKB-2026-</span> (Regular full-time staff)</>
                  ) : (
                    <>Prefix: <span className="font-mono text-slate-900 font-bold">PRJ-2026-</span> (Part-Time &amp; Contractual staff)</>
                  )}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm shrink-0">
                <BarcodeView value={nextId} width={1.2} height={28} displayValue={false} />
              </div>
            </div>

            {/* Employment Type Selector */}
            <div className="pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-700">
                Employment Classification:
              </label>
              <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, employmentType: 'regular' })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    formData.employmentType === 'regular'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  Regular (NKB)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, employmentType: 'contractual' })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    formData.employmentType === 'contractual'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  Contractual (PRJ)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, employmentType: 'part-time' })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 ${
                    formData.employmentType === 'part-time'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  Part-Time (PRJ)
                </button>
              </div>
            </div>
          </div>

          {/* Profile Photo / Avatar */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <img
                src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.firstName || 'Staff'}`}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-300 shadow-sm bg-slate-100"
              />
              <label
                htmlFor="admin-photo-file-input"
                title="Upload Photo"
                className="absolute inset-0 bg-slate-900/80 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition"
              >
                <Camera className="h-4 w-4 mb-0.5 text-slate-300" />
                Upload
              </label>
            </div>

            <div className="flex-1 w-full space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-slate-600" />
                  Staff Profile Picture
                </span>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: '' })}
                    className="text-[11px] text-slate-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Trash2 className="h-3 w-3 text-slate-600" /> Reset Photo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Upload picture file from computer (PNG, JPG, WebP) or paste a web URL.
              </p>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="admin-photo-file-input"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm transition"
                >
                  <Upload className="h-3 w-3 text-white" />
                  Choose Picture
                </label>
                <input
                  id="admin-photo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="flex-1 h-8 px-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dela Cruz"
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan.delacruz@nkb.com"
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+63 917 000 0000"
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Birthday & Residential Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-600" />
                <span>Birthday</span>
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-600" />
                <span>Complete Residential Address</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House No., Street, Barangay, City, Province"
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none text-xs"
              />
            </div>
          </div>

          {/* Position, Department & Date Hired */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Position Select with Quick Add Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-slate-600" />
                  Job Position
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddPos(!showAddPos)}
                  className="text-[10px] text-slate-700 hover:text-slate-900 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-slate-600" />
                  Add Position
                </button>
              </div>
              <select
                value={formData.positionId}
                onChange={(e) => handlePositionChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none text-xs"
              >
                {positions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              {/* Inline Quick Add Position Form */}
              {showAddPos && (
                <div className="mt-2 p-3 rounded-xl border border-slate-300 bg-slate-50 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Create New Job Position</span>
                    <button type="button" onClick={() => setShowAddPos(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="h-3 w-3 text-slate-600" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newPosTitle}
                    onChange={(e) => setNewPosTitle(e.target.value)}
                    placeholder="Position Title (e.g. Sales Executive)"
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddPosition}
                    className="w-full h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3 w-3 text-white" /> Save &amp; Select Position
                  </button>
                </div>
              )}
            </div>

            {/* Department Select with Quick Add Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold flex items-center gap-1">
                  <Building className="h-3 w-3 text-slate-600" />
                  Department
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddDept(!showAddDept)}
                  className="text-[10px] text-slate-700 hover:text-slate-900 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-slate-600" />
                  Add Department
                </button>
              </div>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none text-xs"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              {/* Inline Quick Add Department Form */}
              {showAddDept && (
                <div className="mt-2 p-3 rounded-xl border border-slate-300 bg-slate-50 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Create New Department</span>
                    <button type="button" onClick={() => setShowAddDept(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="h-3 w-3 text-slate-600" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Department Name (e.g. Sales & Marketing)"
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    maxLength={5}
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    placeholder="Dept Code (e.g. SLS)"
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs outline-none font-mono uppercase focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddDepartment}
                    className="w-full h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-3 w-3 text-white" /> Save &amp; Select Department
                  </button>
                </div>
              )}
            </div>

            {/* Date Hired */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-600" />
                <span>Date Hired</span>
              </label>
              <input
                type="date"
                required
                value={formData.dateHired}
                onChange={(e) => setFormData({ ...formData, dateHired: e.target.value, hireDate: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none text-xs"
              />
            </div>

          </div>

          {/* Statutory Identification Numbers */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-600" />
              Government Statutory Identification Numbers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">SSS No.</label>
                <input
                  type="text"
                  placeholder="03-8899001-1"
                  value={formData.sssNo}
                  onChange={(e) => setFormData({ ...formData, sssNo: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none font-mono text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">PhilHealth No.</label>
                <input
                  type="text"
                  placeholder="12-094820192-1"
                  value={formData.philHealthNo}
                  onChange={(e) => setFormData({ ...formData, philHealthNo: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none font-mono text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">HDMF (Pag-IBIG) No.</label>
                <input
                  type="text"
                  placeholder="1210-9482-0192"
                  value={formData.hdmfNo}
                  onChange={(e) => setFormData({ ...formData, hdmfNo: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none font-mono text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Taxpayer ID (TIN)</label>
                <input
                  type="text"
                  placeholder="100-200-001"
                  value={formData.tin}
                  onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none font-mono text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Actual Salary Compensation Setup */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-slate-600" />
                Actual Compensation &amp; Salary Rate
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Used for actual earnings calculation</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Daily vs Monthly Toggle */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Salary Rate Type</label>
                <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, salaryRateType: 'daily' })}
                    className={`py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                      formData.salaryRateType === 'daily'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Daily Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, salaryRateType: 'monthly' })}
                    className={`py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                      formData.salaryRateType === 'monthly'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly Rate
                  </button>
                </div>
              </div>

              {/* Work Schedule Type */}
              <div>
                <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                  <span>Work Schedule</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isMonthlyRate
                      ? (formData.workScheduleType === '5_days' ? '261 days/yr' : '313 days/yr')
                      : 'Fixed: 6 Days/wk'}
                  </span>
                </label>
                {isMonthlyRate ? (
                  <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, workScheduleType: '5_days' })}
                      className={`py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                        formData.workScheduleType === '5_days'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="5 Days / Week (Monday to Friday, No Weekends: 261 days/year)"
                    >
                      5 Days (Mon-Fri)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, workScheduleType: '6_days' })}
                      className={`py-1 rounded font-bold text-[11px] transition cursor-pointer ${
                        formData.workScheduleType === '6_days'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="6 Days / Week (Monday to Saturday, Sundays Off: 313 days/year)"
                    >
                      6 Days (Mon-Sat)
                    </button>
                  </div>
                ) : (
                  <div className="h-9 px-3 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between text-slate-800 font-semibold text-[11px]">
                    <span>6 Days (Mon–Sat)</span>
                    <span className="text-[10px] text-slate-500 font-mono">26 days / mo</span>
                  </div>
                )}
              </div>

              {/* Rate Input Amount */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Salary Rate (₱ / {formData.salaryRateType === 'daily' ? 'day' : 'month'})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.salaryRate}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, salaryRate: val, baseSalary: val });
                  }}
                  placeholder={formData.salaryRateType === 'daily' ? '650' : '25000'}
                  className="w-full h-9 px-3 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none font-mono focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {formData.salaryRateType === 'daily'
                    ? `~${formatCurrency((Number(formData.salaryRate) || 0) * 26)} / mo (26 days @ 6 days/wk)`
                    : `~${formatCurrency(computedDailyRate)} / day (${formData.workScheduleType === '5_days' ? '261' : '313'} days/yr)`}
                </p>
              </div>
            </div>

            {/* Live Rate Breakdown & Absence/Tardiness Computation Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <Calculator className="h-3 w-3 text-slate-600" />
                  Absence &amp; Tardiness Computation Breakdown
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {isMonthlyRate
                    ? `(Monthly × 12) ÷ ${workFactorDays} days (${formData.workScheduleType === '5_days' ? 'w/o weekends' : 'w/o Sunday'})`
                    : 'Daily Rate (strictly 6 days/week · 13 days/cut-off · 26 days/mo)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">15-Day Salary</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(computedCutoff15Days)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Cut-off base</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Daily Absence Rate</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(computedDailyRate)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Per day absent</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Hourly Rate</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(computedHourlyRate)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Daily ÷ 8 hrs</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Minute Rate (Late)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {formatCurrency(computedMinuteRate)}
                  </span>
                  <span className="text-[9px] text-slate-400 block">Per min tardy</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>
                  <strong>Absence Policy:</strong> Salary(15 days) - Absences. (1 missed day = -{formatCurrency(computedDailyRate)})
                </span>
                <span>
                  <strong>Tardiness Policy:</strong> 30 mins late = -{formatCurrency(computedMinuteRate * 30)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Pay Frequency</label>
                <select
                  value={formData.payFrequency}
                  onChange={(e) => setFormData({ ...formData, payFrequency: e.target.value })}
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                >
                  <option value="semi-monthly">Semi-Monthly (15th &amp; 30th)</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Disbursement Method</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                >
                  <option value="Cash">Cash (Over-the-Counter)</option>
                  <option value="BDO Unibank">BDO Unibank</option>
                  <option value="Bank of the Philippine Islands (BPI)">Bank of the Philippine Islands (BPI)</option>
                  <option value="Metrobank">Metrobank</option>
                  <option value="Security Bank">Security Bank</option>
                  <option value="UnionBank of the Philippines">UnionBank of the Philippines</option>
                  <option value="Land Bank of the Philippines">Land Bank of the Philippines</option>
                  <option value="RCBC">RCBC</option>
                  {!standardBanks.includes(formData.bankName) && formData.bankName && (
                    <option value={formData.bankName}>{formData.bankName}</option>
                  )}
                  <option value="Other">Other Bank...</option>
                </select>
                {formData.bankName === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Type custom bank name"
                    value={formData.customBank || ''}
                    onChange={(e) => setFormData({ ...formData, customBank: e.target.value })}
                    className="w-full h-8 px-2.5 mt-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none text-xs focus:ring-2 focus:ring-slate-900"
                  />
                )}
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                  <span>Bank Account Number</span>
                  {isCash && <span className="text-[10px] text-slate-500 font-bold">(Auto-Disabled)</span>}
                </label>
                <input
                  type="text"
                  disabled={isCash}
                  value={isCash ? 'N/A (Cash Disbursement)' : formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder={isCash ? 'N/A' : '0000-0000-00'}
                  className={`w-full h-9 px-3 rounded-lg border text-slate-900 outline-none font-mono text-xs transition ${
                    isCash
                      ? 'bg-slate-100 text-slate-400 border-dashed border-slate-300 cursor-not-allowed select-none'
                      : 'bg-white border-slate-300 focus:ring-2 focus:ring-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                  <span>Portal PIN (8 digits)</span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold cursor-pointer transition"
                  >
                    {showPin ? <EyeOff className="h-3 w-3 text-slate-600" /> : <Eye className="h-3 w-3 text-slate-600" />}
                    <span>{showPin ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={8}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="12345678"
                    className="w-full h-9 pl-3 pr-8 rounded-lg bg-white border border-slate-300 text-slate-900 outline-none font-mono tracking-widest text-xs focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition p-0.5 cursor-pointer"
                    title={showPin ? "Hide PIN" : "Show PIN"}
                  >
                    {showPin ? <EyeOff className="h-3.5 w-3.5 text-slate-600" /> : <Eye className="h-3.5 w-3.5 text-slate-600" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Government Compliance: Filed Salary & Statutory Deductions Section */}
          <div className="p-3.5 rounded-2xl border-2 border-slate-300 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-slate-800" />
                Statutory Deductions &amp; Filed Salary Basis
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold uppercase tracking-wider">
                Government Compliance
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Statutory Computation Rule:</strong> In computing other deductions, the actual employee salary is <strong>not used</strong>.
                Enter the official manual <strong>Filed Salary</strong> below. SSS, PhilHealth, HDMF (Pag-IBIG), and Tax are computed strictly from this filed salary.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Manual Filed Salary (₱ / month)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.filedSalary}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, filedSalary: val });
                  }}
                  placeholder="e.g. 15000"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-400 text-slate-900 font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave at 0 if employee has no statutory deductions filed.
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Statutory Deduction Basis</span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {formatCurrency(statutoryBreakdown.monthly.total)} <span className="text-xs text-slate-500 font-normal">/mo</span>
                </span>
                <div className="text-[11px] font-mono text-slate-600">
                  {formatCurrency(statutoryBreakdown.cutoff.total)} / 15-day cut-off
                </div>
              </div>
            </div>

            {/* Live Statutory Computation Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SSS Contribution</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutoryBreakdown.monthly.sss)}
                  <span className="text-[9px] text-slate-500 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutoryBreakdown.cutoff.sss)} / cutoff
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PhilHealth</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutoryBreakdown.monthly.philhealth)}
                  <span className="text-[9px] text-slate-500 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutoryBreakdown.cutoff.philhealth)} / cutoff
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">HDMF (Pag-IBIG)</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutoryBreakdown.monthly.pagibig)}
                  <span className="text-[9px] text-slate-500 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutoryBreakdown.cutoff.pagibig)} / cutoff
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Withholding Tax</div>
                <div className="font-mono font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(statutoryBreakdown.monthly.tax)}
                  <span className="text-[9px] text-slate-500 font-normal"> /mo</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(statutoryBreakdown.cutoff.tax)} / cutoff
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Save className="h-4 w-4 text-white" />
              {isEditing ? 'Save Changes' : 'Confirm & Generate ID'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
