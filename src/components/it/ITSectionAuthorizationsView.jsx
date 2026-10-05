import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  ShieldCheck,
  UserCheck,
  Users,
  Lock,
  Eye,
  Edit3,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Search,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  SYSTEM_SECTIONS,
  SYSTEM_ROLES,
  PERMISSION_LEVELS,
  DEFAULT_ROLE_PERMISSIONS
} from '../../utils/sectionAuthorization';

export default function ITSectionAuthorizationsView() {
  const {
    staffList = [],
    sectionAuthorizations,
    userAuthorizationOverrides = {},
    updateRoleSectionPermission,
    updateUserSectionPermission,
    clearUserSectionOverrides,
    resetSectionAuthorizationsToDefault,
    showToast = () => {}
  } = useApp();

  // Mode: 'ROLES' vs 'USERS'
  const [authMode, setAuthMode] = useState('ROLES'); // 'ROLES' | 'USERS'

  // Selected Role in Role Mode
  const [selectedRole, setSelectedRole] = useState('hr'); // 'ceo' | 'it_admin' | 'hr' | 'finance' | 'canteen' | 'employee'

  // Selected Staff Member in User Mode
  const [selectedStaffId, setSelectedStaffId] = useState(() => staffList[0]?.id || '');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Filtered staff list for user override picker
  const filteredStaff = useMemo(() => {
    if (!userSearchQuery) return staffList;
    const q = userSearchQuery.toLowerCase();
    return staffList.filter(s =>
      (s.firstName && s.firstName.toLowerCase().includes(q)) ||
      (s.lastName && s.lastName.toLowerCase().includes(q)) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q))
    );
  }, [staffList, userSearchQuery]);

  const activeStaffMember = useMemo(() => {
    return staffList.find(s => s.id === selectedStaffId || s.employeeId === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  // Bulk actions for current target
  const handleSetAllForCurrentRole = (level) => {
    if (selectedRole === 'ceo' || selectedRole === 'it_admin') {
      alert('Super Admin and IT Admin accounts retain permanent management access.');
      return;
    }
    SYSTEM_SECTIONS.forEach(sec => {
      updateRoleSectionPermission(selectedRole, sec.id, level);
    });
    showToast(`Updated all sections to ${level.toUpperCase()} for role ${selectedRole.toUpperCase()}`);
  };

  const handleSetAllForCurrentUser = (level) => {
    if (!activeStaffMember) return;
    SYSTEM_SECTIONS.forEach(sec => {
      updateUserSectionPermission(activeStaffMember.id, sec.id, level);
    });
    showToast(`Assigned all sections to ${level.toUpperCase()} for ${activeStaffMember.firstName} ${activeStaffMember.lastName}`);
  };

  // Export Matrix
  const handleExportMatrix = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      rolePermissions: sectionAuthorizations,
      userOverrides: userAuthorizationOverrides
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NKB-Section-Authorizations-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Section Authorizations exported to JSON.');
  };

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight">Section Authorization &amp; Access Matrix</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                Granular RBAC Enforced
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign Viewing Only, Editing / Managing, or No Access per operational subsystem across roles and staff accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetSectionAuthorizationsToDefault}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
            title="Reset role authorizations to recommended factory defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleExportMatrix}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Role-Based Defaults vs User-Specific Overrides */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setAuthMode('ROLES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            authMode === 'ROLES'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>1. Role-Based Permissions</span>
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('USERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            authMode === 'USERS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>2. Individual User Overrides</span>
          {Object.keys(userAuthorizationOverrides).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[9px] font-mono">
              {Object.keys(userAuthorizationOverrides).length}
            </span>
          )}
        </button>
      </div>

      {/* Mode 1: Role-Based Authorization Grid */}
      {authMode === 'ROLES' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          
          {/* Role Selector Tabs */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Select Role to Configure:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {SYSTEM_ROLES.map(role => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-3 rounded-2xl text-left border-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {role.badge}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 truncate">{role.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium">
              Configuring default permissions for: <strong className="text-slate-900">{SYSTEM_ROLES.find(r => r.id === selectedRole)?.name}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetAllForCurrentRole('manage')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                Set All Manage
              </button>
              <button
                type="button"
                onClick={() => handleSetAllForCurrentRole('view')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                Set All View Only
              </button>
              <button
                type="button"
                onClick={() => handleSetAllForCurrentRole('none')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                Set All No Access
              </button>
            </div>
          </div>

          {/* Section Permissions Table */}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
            {SYSTEM_SECTIONS.map(section => {
              const currentLevel = (selectedRole === 'ceo' || selectedRole === 'it_admin')
                ? 'manage'
                : (sectionAuthorizations[selectedRole]?.[section.id] || DEFAULT_ROLE_PERMISSIONS[selectedRole]?.[section.id] || 'none');

              return (
                <div key={section.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                  <div className="space-y-0.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{section.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.2 rounded-full border border-slate-200">
                        {section.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{section.description}</p>
                  </div>

                  {/* Tri-State Permission Button Group */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/80">
                    <button
                      type="button"
                      disabled={selectedRole === 'ceo' || selectedRole === 'it_admin'}
                      onClick={() => updateRoleSectionPermission(selectedRole, section.id, 'none')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        currentLevel === 'none'
                          ? 'bg-rose-500 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <X className="h-3 w-3" />
                      <span>No Access</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedRole === 'ceo' || selectedRole === 'it_admin'}
                      onClick={() => updateRoleSectionPermission(selectedRole, section.id, 'view')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        currentLevel === 'view'
                          ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Viewing Only</span>
                    </button>

                    <button
                      type="button"
                      disabled={selectedRole === 'ceo' || selectedRole === 'it_admin'}
                      onClick={() => updateRoleSectionPermission(selectedRole, section.id, 'manage')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        currentLevel === 'manage'
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Editing / Managing</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Mode 2: Individual User Overrides Grid */}
      {authMode === 'USERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6">
          
          {/* Left Column: Staff Member Picker */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Select Employee</h3>
              <span className="text-[10px] text-slate-400 font-mono">{filteredStaff.length} staff</span>
            </div>

            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
              {filteredStaff.map(staff => {
                const isSelected = activeStaffMember?.id === staff.id;
                const hasOverrides = Boolean(userAuthorizationOverrides[staff.id]);

                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => setSelectedStaffId(staff.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {staff.firstName} {staff.lastName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {staff.employeeId} · {staff.role || 'Staff'}
                      </div>
                    </div>
                    {hasOverrides && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[8px] font-bold uppercase shrink-0">
                        Custom
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Custom Overrides Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            {activeStaffMember ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {activeStaffMember.firstName} {activeStaffMember.lastName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        {activeStaffMember.employeeId}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase">
                        Role: {activeStaffMember.role || 'employee'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign individual section permissions that override the staff member's default role configuration.
                    </p>
                  </div>

                  {userAuthorizationOverrides[activeStaffMember.id] && (
                    <button
                      type="button"
                      onClick={() => clearUserSectionOverrides(activeStaffMember.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                    >
                      Clear Custom Overrides
                    </button>
                  )}
                </div>

                {/* Quick Presets Bar */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600 text-[11px]">Quick Assign:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetAllForCurrentUser('manage')}
                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      All Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllForCurrentUser('view')}
                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      All View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllForCurrentUser('none')}
                      className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      All None
                    </button>
                  </div>
                </div>

                {/* Section Permissions List */}
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
                  {SYSTEM_SECTIONS.map(section => {
                    const isCustom = userAuthorizationOverrides[activeStaffMember.id]?.[section.id] !== undefined;
                    const defaultRoleLevel = sectionAuthorizations[activeStaffMember.role]?.[section.id] || DEFAULT_ROLE_PERMISSIONS[activeStaffMember.role]?.[section.id] || 'none';
                    const effectiveLevel = isCustom
                      ? userAuthorizationOverrides[activeStaffMember.id][section.id]
                      : defaultRoleLevel;

                    return (
                      <div key={section.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{section.name}</span>
                            {isCustom ? (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                                Overridden
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-mono">
                                (Role default: {defaultRoleLevel})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tri-State Selector */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => updateUserSectionPermission(activeStaffMember.id, section.id, 'none')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              effectiveLevel === 'none'
                                ? 'bg-rose-500 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <X className="h-3 w-3" />
                            <span>None</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateUserSectionPermission(activeStaffMember.id, section.id, 'view')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              effectiveLevel === 'view'
                                ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateUserSectionPermission(activeStaffMember.id, section.id, 'manage')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              effectiveLevel === 'manage'
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Manage</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select an employee from the left panel to configure individual section overrides.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
