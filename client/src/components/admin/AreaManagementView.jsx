import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Layers,
  Sparkles
} from 'lucide-react';

const AreaManagementView = ({ departments = [], onDataChange }) => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');

  // Modal State: Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAreaId, setCurrentAreaId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    zone: 'Central Zone',
    city: 'Metropolis',
    lat: 12.9716,
    lng: 77.5946,
    assignedDepartment: '',
    description: '',
    active: true
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAreas();
      if (res.success) {
        setAreas(res.data);
      }
    } catch (err) {
      console.error('Failed to load areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentAreaId(null);
    setFormData({
      name: '',
      code: '',
      zone: 'Central Zone',
      city: 'Metropolis',
      lat: 12.9716,
      lng: 77.5946,
      assignedDepartment: departments[0]?._id || '',
      description: '',
      active: true
    });
    setModalMsg({ type: '', text: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (area) => {
    setIsEditing(true);
    setCurrentAreaId(area._id);
    setFormData({
      name: area.name,
      code: area.code,
      zone: area.zone || 'Central Zone',
      city: area.city || 'Metropolis',
      lat: area.coordinates?.lat || 12.9716,
      lng: area.coordinates?.lng || 77.5946,
      assignedDepartment: area.assignedDepartment?._id || area.assignedDepartment || '',
      description: area.description || '',
      active: area.active !== false
    });
    setModalMsg({ type: '', text: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalMsg({ type: '', text: '' });

    const payload = {
      name: formData.name,
      code: formData.code,
      zone: formData.zone,
      city: formData.city,
      coordinates: {
        lat: parseFloat(formData.lat) || 12.9716,
        lng: parseFloat(formData.lng) || 77.5946
      },
      assignedDepartment: formData.assignedDepartment || null,
      description: formData.description,
      active: formData.active
    };

    try {
      if (isEditing) {
        const res = await adminApi.updateArea(currentAreaId, payload);
        if (res.success) {
          setModalMsg({ type: 'success', text: 'Area updated successfully!' });
          fetchAreas();
          if (onDataChange) onDataChange();
          setTimeout(() => setShowModal(false), 1200);
        }
      } else {
        const res = await adminApi.createArea(payload);
        if (res.success) {
          setModalMsg({ type: 'success', text: 'Area created successfully!' });
          fetchAreas();
          if (onDataChange) onDataChange();
          setTimeout(() => setShowModal(false), 1200);
        }
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save area.' });
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (areaId, areaName) => {
    if (!window.confirm(`Are you sure you want to delete ${areaName}?`)) return;
    try {
      const res = await adminApi.deleteArea(areaId);
      if (res.success) {
        fetchAreas();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete area.');
    }
  };

  const filteredAreas = areas.filter((a) => {
    if (selectedZone !== 'ALL' && a.zone !== selectedZone) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchCode = a.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Municipal Area & Ward Management
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Define municipal zones, wards, GPS centroids, department routing, and monitor area defect resolution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAreas}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Add Municipal Ward
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by area name, ward code..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Municipal Zones</option>
            <option value="Central Zone">Central Zone</option>
            <option value="North Zone">North Zone</option>
            <option value="South Zone">South Zone</option>
            <option value="East Zone">East Zone</option>
            <option value="West Zone">West Zone</option>
          </select>
        </div>
      </div>

      {/* Areas Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No municipal wards found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Ward Name & Code</th>
                  <th className="py-3.5 px-4">Zone & Coordinates</th>
                  <th className="py-3.5 px-4">Assigned Dept</th>
                  <th className="py-3.5 px-4">Total Issues</th>
                  <th className="py-3.5 px-4">Pending</th>
                  <th className="py-3.5 px-4">Resolved</th>
                  <th className="py-3.5 px-4">Resolution Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredAreas.map((area) => (
                  <tr key={area._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                          📍
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{area.name}</span>
                          <span className="text-[10px] font-mono text-indigo-600 font-bold">{area.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {area.zone}
                      </span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {area.coordinates?.lat?.toFixed(4)}, {area.coordinates?.lng?.toFixed(4)}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-indigo-700">
                        {area.assignedDepartment?.name || 'General Municipal'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">{area.totalIssues}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">{area.pending}</td>
                    <td className="py-3.5 px-4 font-bold text-teal-600">{area.resolved}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[11px] text-slate-900">{area.resolutionRate}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${area.resolutionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(area)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit Ward"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(area._id, area.name)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete Ward"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE / EDIT AREA MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {isEditing ? 'Edit Municipal Ward' : 'Add New Municipal Ward'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  modalMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {modalMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ward / Area Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ward 18 - Indira Canteen Sector"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ward Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. WARD-18"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Municipal Zone</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                  >
                    <option value="Central Zone">Central Zone</option>
                    <option value="North Zone">North Zone</option>
                    <option value="South Zone">South Zone</option>
                    <option value="East Zone">East Zone</option>
                    <option value="West Zone">West Zone</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centroid Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centroid Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Primary Assigned Department
                </label>
                <select
                  value={formData.assignedDepartment}
                  onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold outline-none"
                >
                  <option value="">-- General Municipal Jurisdiction --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Notes on ward boundaries and density..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {modalSaving ? 'Saving...' : isEditing ? 'Update Ward' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaManagementView;
