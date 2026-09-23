import React, { useState } from 'react';
import { Briefcase, Building, Plus, Trash2, Edit3, X, Save, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PositionDeptManager() {
  const {
    positions,
    departments,
    addPosition,
    updatePosition,
    deletePosition,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    isHR
  } = useApp();

  // Modal states for Position
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [posForm, setPosForm] = useState({
    title: '',
    departmentId: ''
  });

  // Modal states for Department
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    manager: ''
  });

  // Open Position Modal (Add or Edit)
  const handleOpenPosModal = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setPosForm({
        title: pos.title,
        departmentId: pos.departmentId
      });
    } else {
      setEditingPos(null);
      setPosForm({
        title: '',
        departmentId: departments[0]?.id || ''
      });
    }
    setPosModalOpen(true);
  };

  const handleSavePosition = (e) => {
    e.preventDefault();
    if (!posForm.title.trim()) return;

    if (editingPos) {
      updatePosition(editingPos.id, {
        title: posForm.title.trim(),
        departmentId: posForm.departmentId || departments[0]?.id
      });
    } else {
      addPosition({
        title: posForm.title.trim(),
        departmentId: posForm.departmentId || departments[0]?.id
      });
    }
    setPosModalOpen(false);
  };

  // Open Department Modal (Add or Edit)
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        code: dept.code,
        manager: dept.manager || ''
      });
    } else {
      setEditingDept(null);
      setDeptForm({
        name: '',
        code: '',
        manager: ''
      });
    }
    setDeptModalOpen(true);
  };

  const handleSaveDepartment = (e) => {
    e.preventDefault();
    if (!deptForm.name.trim() || !deptForm.code.trim()) return;

    if (editingDept) {
      updateDepartment(editingDept.id, {
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase(),
        manager: deptForm.manager.trim() || 'To be assigned'
      });
    } else {
      addDepartment({
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase(),
        manager: deptForm.manager.trim() || 'To be assigned'
      });
    }
    setDeptModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (White Card, Monochrome Icons) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-slate-500" />
            Company Setup &amp; Hierarchy
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            Positions &amp; Departments Management
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure job roles, compensation limits, and departmental units for your company. New entries immediately sync with staff onboarding and payroll formulas.
          </p>
        </div>

        {/* Global Quick Add Buttons */}
        {isHR && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenDeptModal()}
              className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Plus className="h-4 w-4 text-slate-600" />
              Add Department
            </button>
            <button
              type="button"
              onClick={() => handleOpenPosModal()}
              className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
            >
              <Plus className="h-4 w-4 text-white" />
              Add Position
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Positions Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-600" />
                Job Positions ({positions.length})
              </h3>
              <p className="text-[11px] text-slate-500">Position titles and corporate departments</p>
            </div>
            {isHR && (
              <button
                type="button"
                onClick={() => handleOpenPosModal()}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-slate-600" />
                Add Position
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {positions.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200/90 bg-white text-center space-y-2 shadow-sm">
                <Briefcase className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">No job positions defined yet.</p>
                <button
                  type="button"
                  onClick={() => handleOpenPosModal()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5 text-white" />
                  Create First Position
                </button>
              </div>
            ) : (
              positions.map((pos) => {
                const dept = departments.find(d => d.id === pos.departmentId);
                return (
                  <div
                    key={pos.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{pos.title}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        <span>{dept?.name || 'General Dept'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isHR ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenPosModal(pos)}
                            title="Edit Position"
                            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer border border-slate-200"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePosition(pos.id)}
                            title="Delete Position"
                            className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 flex items-center justify-center transition cursor-pointer border border-slate-200"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-600" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold italic">View Only</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Departments Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-600" />
                Departments ({departments.length})
              </h3>
              <p className="text-[11px] text-slate-500">Company branches &amp; units</p>
            </div>
            {isHR && (
              <button
                type="button"
                onClick={() => handleOpenDeptModal()}
                className="text-xs text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-slate-600" />
                Add Department
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {departments.length === 0 ? (
              <div className="p-8 rounded-2xl border border-slate-200/90 bg-white text-center space-y-2 shadow-sm">
                <Building className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500 font-medium">No departments created yet.</p>
                {isHR && (
                  <button
                    type="button"
                    onClick={() => handleOpenDeptModal()}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-600" />
                    Create First Department
                  </button>
                )}
              </div>
            ) : (
              departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{dept.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Manager: {dept.manager || 'Unassigned'}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isHR ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenDeptModal(dept)}
                          title="Edit Department"
                          className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer border border-slate-200"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDepartment(dept.id)}
                          title="Delete Department"
                          className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 flex items-center justify-center transition cursor-pointer border border-slate-200"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-600" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic">View Only</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Position Add/Edit Modal */}
      {posModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-600" />
                {editingPos ? 'Edit Position' : 'Add New Job Position'}
              </h3>
              <button
                type="button"
                onClick={() => setPosModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSavePosition} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Position Title</label>
                <input
                  type="text"
                  required
                  value={posForm.title}
                  onChange={(e) => setPosForm({ ...posForm, title: e.target.value })}
                  placeholder="e.g. Senior Logistics Coordinator"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={posForm.departmentId}
                  onChange={(e) => setPosForm({ ...posForm, departmentId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPosModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4 text-white" />
                  {editingPos ? 'Save Changes' : 'Create Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Add/Edit Modal */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-600" />
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button
                type="button"
                onClick={() => setDeptModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Sales & Customer Success"
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dept Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    placeholder="SCS"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none font-mono uppercase focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department Lead / Manager</label>
                  <input
                    type="text"
                    value={deptForm.manager}
                    onChange={(e) => setDeptForm({ ...deptForm, manager: e.target.value })}
                    placeholder="e.g. Department Head"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4 text-white" />
                  {editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
