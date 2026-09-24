import React, { useState } from 'react';
import { Search, UserPlus, Filter, Edit3, Trash2, DollarSign, Users, Building, ScanLine, QrCode, Eye, Calendar, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/payrollCalculations';
import StaffBadgeModal from './StaffBadgeModal';
import StaffFormModal from './StaffFormModal';
import StaffDetailModal from './StaffDetailModal';
import BarcodeView from '../common/BarcodeView';
import TableActionDropdown from '../common/TableActionDropdown';

export default function StaffDirectory() {
  const { staffList, departments, positions, deleteStaff, isHR, openDigitalId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [badgeModalStaff, setBadgeModalStaff] = useState(null);
  const [formModalStaff, setFormModalStaff] = useState(null);
  const [detailModalStaff, setDetailModalStaff] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Filter staff
  const filteredStaff = staffList.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.employeeId?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.sssNo?.toLowerCase().includes(q) ||
      s.philHealthNo?.toLowerCase().includes(q) ||
      s.hdmfNo?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || s.departmentId === selectedDept;

    return matchesSearch && matchesDept;
  });

  const totalPayrollBudget = staffList.reduce((acc, s) => {
    const rate = Number(s.salaryRate) || Number(s.baseSalary) || 0;
    const monthly = s.salaryRateType === 'daily' ? rate * 22 : rate;
    return acc + monthly;
  }, 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Stats Overview (Light Cards, Monochrome Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Workforce</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Users className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{staffList.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active automated employee IDs</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Departments</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Building className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{departments.length}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Corporate cost centers</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly Base Payroll</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalPayrollBudget)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Standard monthly commitment</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Badges &amp; Barcodes</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <ScanLine className="h-4 w-4 text-slate-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">100%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Code 128 synced to time kiosk</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, or barcode..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Onboard Staff Button (HR Only) */}
        {isHR && (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="w-full sm:w-auto h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition shrink-0"
          >
            <UserPlus className="h-4 w-4 text-white" />
            Onboard Staff (Auto-Generate ID)
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Generated ID &amp; Barcode</th>
                <th className="py-3 px-4">Position &amp; Department</th>
                <th className="py-3 px-4">Date Hired</th>
                <th className="py-3 px-4">Salary Rate &amp; Filed Basis</th>
                <th className="py-3 px-4 text-center">Badge</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No staff records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const pos = positions.find(p => p.id === staff.positionId);
                  const dept = departments.find(d => d.id === staff.departmentId);
                  const salaryRate = Number(staff.salaryRate) || Number(staff.baseSalary) || 0;
                  const rateType = staff.salaryRateType || 'monthly';
                  const filedSalary = Number(staff.filedSalary) || 0;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setDetailModalStaff(staff)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={staff.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.firstName}`}
                            alt={staff.firstName}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-sm"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition">
                              {staff.firstName} {staff.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID & Barcode */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-[11px]">
                              {staff.employeeId}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {staff.employeeId?.startsWith('PRJ') ? 'PRJ' : 'NKB'}
                            </span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 w-fit">
                            <BarcodeView value={staff.barcodeValue} width={1.0} height={18} displayValue={false} />
                          </div>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{pos?.title || 'Staff Specialist'}</div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-medium inline-block mt-0.5">
                          {dept?.name || 'General'}
                        </span>
                      </td>

                      {/* Date Hired */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {formatDate(staff.dateHired || staff.hireDate)}
                      </td>

                      {/* Salary Rate & Filed Salary Basis */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {formatCurrency(salaryRate)}
                          <span className="text-[10px] text-slate-500 font-normal"> / {rateType === 'daily' ? 'day' : 'mo'}</span>
                        </div>
                        <div className="mt-0.5">
                          {filedSalary > 0 ? (
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold" title="Basis for SSS, PhilHealth, HDMF & Tax">
                              Filed: {formatCurrency(filedSalary)}/mo
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              No filed salary
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Digital ID (Barcode & QR) Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => openDigitalId(staff)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                          title="View Digital ID with Barcode & QR"
                        >
                          <QrCode className="h-3.5 w-3.5 text-cyan-600" />
                          <span>Digital ID</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailModalStaff(staff)}
                            title="View Full Staff Profile"
                            className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer border border-slate-200"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                          </button>

                          {isHR && (
                            <button
                              type="button"
                              onClick={() => setFormModalStaff(staff)}
                              title="Quick Edit Profile"
                              className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer border border-slate-200"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          )}

                          <TableActionDropdown
                            id={`staff-${staff.id}`}
                            actions={[
                              {
                                label: 'View Profile & Deductions',
                                icon: Eye,
                                onClick: () => setDetailModalStaff(staff)
                              },
                              {
                                label: 'Digital ID (Barcode & QR)',
                                icon: QrCode,
                                onClick: () => openDigitalId(staff)
                              },
                              {
                                label: 'Print Badge Card',
                                icon: ScanLine,
                                onClick: () => setBadgeModalStaff(staff)
                              },
                              ...(isHR
                                ? [
                                    {
                                      label: 'Edit Profile & Salary',
                                      icon: Edit3,
                                      onClick: () => setFormModalStaff(staff)
                                    },
                                    {
                                      label: 'Delete Staff Member',
                                      icon: Trash2,
                                      danger: true,
                                      onClick: () => deleteStaff(staff.id)
                                    }
                                  ]
                                : [])
                            ]}
                          />
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {detailModalStaff && (
        <StaffDetailModal
          staff={detailModalStaff}
          department={departments.find(d => d.id === detailModalStaff.departmentId)}
          position={positions.find(p => p.id === detailModalStaff.positionId)}
          onClose={() => setDetailModalStaff(null)}
          onEdit={(s) => setFormModalStaff(s)}
          onOpenDigitalId={(s) => openDigitalId(s)}
        />
      )}

      {badgeModalStaff && (
        <StaffBadgeModal
          staff={badgeModalStaff}
          department={departments.find(d => d.id === badgeModalStaff.departmentId)}
          position={positions.find(p => p.id === badgeModalStaff.positionId)}
          onClose={() => setBadgeModalStaff(null)}
        />
      )}

      {(isAddingNew || formModalStaff) && (
        <StaffFormModal
          staff={formModalStaff}
          onClose={() => {
            setIsAddingNew(false);
            setFormModalStaff(null);
          }}
        />
      )}

    </div>
  );
}
