import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  Users,
  UserPlus,
  Edit2,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
  ShieldCheck,
  Award,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  Check
} from 'lucide-react';

const OfficerManagementView = ({ departments = [], areas = [], onDataChange }) => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Add Officer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    city: 'Metropolis'
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });

  // Edit Officer Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    assignedAreaId: '',
    isActive: true
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });

  // Officer Profile / Workload Detail Modal
  const [profileOfficer, setProfileOfficer] = useState(null);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOfficersManagement();
      if (res.success) {
        setOfficers(res.data);
      }
    } catch (err) {
      console.error('Failed to load officers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleAddOfficer = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    setAddMsg({ type: '', text: '' });

    try {
      const res = await adminApi.createOfficer(addForm);
      if (res.success) {
        setAddMsg({ type: 'success', text: 'Officer provisioned and onboarded successfully!' });
        fetchOfficers();
        if (onDataChange) onDataChange();
        setAddForm({ name: '', email: '', password: '', departmentId: departments[0]?._id || '', city: 'Metropolis' });
        setTimeout(() => setShowAddModal(false), 1400);
      }
    } catch (err) {
      setAddMsg({ type: 'error', text: err.response?.data?.message || 'Failed to onboard officer.' });
    } finally {
      setAddSaving(false);
    }
  };

  const handleOpenEdit = (off) => {
    setEditingOfficer(off);
    setEditForm({
      name: off.name,
      email: off.email,
      departmentId: off.department?._id || off.department || '',
      assignedAreaId: off.assignedArea?._id || off.assignedArea || '',
      isActive: off.status === 'ACTIVE'
    });
    setEditMsg({ type: '', text: '' });
    setShowEditModal(true);
  };

  const handleUpdateOfficer = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditMsg({ type: '', text: '' });

    try {
      const res = await adminApi.updateOfficerDetails(editingOfficer._id, editForm);
      if (res.success) {
        setEditMsg({ type: 'success', text: 'Officer updated successfully!' });
        fetchOfficers();
        if (onDataChange) onDataChange();
        setTimeout(() => setShowEditModal(false), 1200);
      }
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update officer.' });
    } finally {
      setEditSaving(false);
    }
  };

  const filteredOfficers = officers.filter((off) => {
    if (selectedDeptFilter !== 'ALL') {
      const deptId = off.department?._id || off.department;
      if (deptId !== selectedDeptFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = off.name?.toLowerCase().includes(q);
      const matchEmail = off.email?.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Onboarding button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Municipal Officer Roster & Field Operations
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage officer department assignments, active case workloads, SLA performance ratings, and area responsibilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOfficers}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setAddForm({
                name: '',
                email: '',
                password: '',
                departmentId: departments[0]?._id || '',
                city: 'Metropolis'
              });
              setAddMsg({ type: '', text: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Onboard New Officer
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by officer name, email address..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No municipal officers found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Officer Details</th>
                  <th className="py-3.5 px-4">Department & Area</th>
                  <th className="py-3.5 px-4">Active Cases</th>
                  <th className="py-3.5 px-4">Completed</th>
                  <th className="py-3.5 px-4">Pending</th>
                  <th className="py-3.5 px-4">Performance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOfficers.map((off) => (
                  <tr key={off._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          🛡️
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{off.name}</span>
                          <span className="text-[11px] text-slate-400">{off.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-indigo-700">
                        {off.department?.name || 'General Municipal'}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        {off.assignedArea?.name || 'All Municipal Wards'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-600">{off.activeCases}</td>
                    <td className="py-3.5 px-4 font-bold text-teal-600">{off.completedCases}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">{off.pendingCases}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[11px] text-slate-900">{off.performance}%</span>
                        <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${off.performance}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          off.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {off.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setProfileOfficer(off)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors"
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(off)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit Officer Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OFFICER PROFILE MODAL */}
      {profileOfficer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center">
                  🛡️
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{profileOfficer.name}</h3>
                  <p className="text-[11px] text-slate-400">{profileOfficer.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileOfficer(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Active Workload</span>
                <p className="text-xl font-extrabold text-blue-600 mt-0.5">{profileOfficer.activeCases}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Completed</span>
                <p className="text-xl font-extrabold text-teal-600 mt-0.5">{profileOfficer.completedCases}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">SLA Rating</span>
                <p className="text-xl font-extrabold text-purple-600 mt-0.5">{profileOfficer.performance}%</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Department Unit:</span>
                <span className="font-bold text-indigo-700">
                  {profileOfficer.department?.name || 'General Municipal Works'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Ward:</span>
                <span className="font-bold text-slate-900">
                  {profileOfficer.assignedArea?.name || 'All Municipal Zones'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Jurisdiction City:</span>
                <span className="font-bold text-slate-900">{profileOfficer.city}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileOfficer(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD OFFICER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Onboard Municipal Officer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  addMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {addMsg.text}
              </div>
            )}

            <form onSubmit={handleAddOfficer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Officer Sunita Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="officer.roads@civicai.gov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assigned Department <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={addForm.departmentId}
                  onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Temporary Access Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {addSaving ? 'Provisioning...' : 'Provision Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OFFICER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Edit Officer Assignment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  editMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateOfficer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Department</label>
                <select
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="">-- General Municipal --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Ward / Area</label>
                <select
                  value={editForm.assignedAreaId}
                  onChange={(e) => setEditForm({ ...editForm, assignedAreaId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="">-- All Municipal Wards --</option>
                  {areas.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Status</label>
                <select
                  value={editForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'ACTIVE' })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="ACTIVE">Active Field Unit</option>
                  <option value="INACTIVE">Deactivated / On Leave</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {editSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerManagementView;
