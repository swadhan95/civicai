import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import PriorityBadge from '../complaint/PriorityBadge';
import StatusBadge from '../complaint/StatusBadge';
import BeforeAfterViewer from '../complaint/BeforeAfterViewer';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
  Layers,
  Sparkles,
  FolderOpen,
  Eye,
  ChevronRight,
  ExternalLink,
  Flame,
  CheckCheck,
  Wrench,
  SlidersHorizontal
} from 'lucide-react';

const DepartmentManagementView = ({ onDataChange }) => {
  const [departmentsData, setDepartmentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-view mode: 'dashboards' (Department switcher & active/resolved problems) | 'directory' (Department CRUD table)
  const [viewMode, setViewMode] = useState('dashboards');

  // Selected Department for deep-dive: 'ALL' or department._id
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');

  // Sub-tab inside selected department: 'ACTIVE' | 'RESOLVED' | 'OFFICERS'
  const [problemTab, setProblemTab] = useState('ACTIVE');

  // Search & Filter controls for complaints
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Add / Edit Department Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDeptId, setCurrentDeptId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactEmail: '',
    active: true
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalMsg, setModalMsg] = useState({ type: '', text: '' });

  const fetchDepartmentsData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDepartmentDashboards();
      if (res.success) {
        setDepartmentsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load department dashboards data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentDeptId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      contactEmail: '',
      active: true
    });
    setModalMsg({ type: '', text: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setIsEditing(true);
    setCurrentDeptId(dept._id);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      contactEmail: dept.contactEmail || '',
      active: dept.active !== false
    });
    setModalMsg({ type: '', text: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    setModalMsg({ type: '', text: '' });

    try {
      if (isEditing) {
        const res = await adminApi.updateDepartment(currentDeptId, formData);
        if (res.success) {
          setModalMsg({ type: 'success', text: 'Department updated successfully!' });
          fetchDepartmentsData();
          if (onDataChange) onDataChange();
          setTimeout(() => setShowModal(false), 1200);
        }
      } else {
        const res = await adminApi.createDepartment(formData);
        if (res.success) {
          setModalMsg({ type: 'success', text: 'Department created successfully!' });
          fetchDepartmentsData();
          if (onDataChange) onDataChange();
          setTimeout(() => setShowModal(false), 1200);
        }
      }
    } catch (err) {
      setModalMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save department.' });
    } finally {
      setModalSaving(false);
    }
  };

  const handleDelete = async (deptId, deptName) => {
    if (!window.confirm(`Are you sure you want to delete ${deptName}?`)) return;
    try {
      const res = await adminApi.deleteDepartment(deptId);
      if (res.success) {
        fetchDepartmentsData();
        if (onDataChange) onDataChange();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department.');
    }
  };

  // Currently Selected Department Dashboard Data
  const currentDept = useMemo(() => {
    if (selectedDeptId === 'ALL') return null;
    return departmentsData.find((d) => d.department._id === selectedDeptId);
  }, [departmentsData, selectedDeptId]);

  // Combined or Selected Complaints
  const activeComplaintsList = useMemo(() => {
    if (selectedDeptId === 'ALL') {
      return departmentsData.flatMap((d) => d.activeComplaints || []);
    }
    return currentDept ? currentDept.activeComplaints || [] : [];
  }, [departmentsData, selectedDeptId, currentDept]);

  const resolvedComplaintsList = useMemo(() => {
    if (selectedDeptId === 'ALL') {
      return departmentsData.flatMap((d) => d.resolvedComplaints || []);
    }
    return currentDept ? currentDept.resolvedComplaints || [] : [];
  }, [departmentsData, selectedDeptId, currentDept]);

  const activeOfficersList = useMemo(() => {
    if (selectedDeptId === 'ALL') {
      return departmentsData.flatMap((d) => d.officers || []);
    }
    return currentDept ? currentDept.officers || [] : [];
  }, [departmentsData, selectedDeptId, currentDept]);

  // Filter & Search complaints according to active tab
  const displayedComplaints = useMemo(() => {
    const list = problemTab === 'RESOLVED' ? resolvedComplaintsList : activeComplaintsList;

    return list
      .filter((item) => {
        if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = item.complaintId?.toLowerCase().includes(q);
          const matchCat = item.categoryName?.toLowerCase().includes(q);
          const matchAddr = item.address?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchId && !matchCat && !matchAddr && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'priority') {
          const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        return 0;
      });
  }, [activeComplaintsList, resolvedComplaintsList, problemTab, priorityFilter, searchQuery, sortBy]);

  // Aggregate stats across all departments
  const aggregatedStats = useMemo(() => {
    const totalDepts = departmentsData.length;
    const totalActive = departmentsData.reduce((acc, d) => acc + (d.activeCount || 0), 0);
    const totalResolved = departmentsData.reduce((acc, d) => acc + (d.resolvedCount || 0), 0);
    const totalOfficers = departmentsData.reduce((acc, d) => acc + (d.officers?.length || 0), 0);
    const overallRate =
      totalActive + totalResolved > 0
        ? Math.round((totalResolved / (totalActive + totalResolved)) * 100)
        : 0;

    return { totalDepts, totalActive, totalResolved, totalOfficers, overallRate };
  }, [departmentsData]);

  return (
    <div className="space-y-6">
      {/* Header & Sub-View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Municipal Department Command & Dashboards
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor department dashboards, inspect active defect backlogs, review resolved complaints with Before/After photos, and manage department configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-view switcher button */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('dashboards')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'dashboards'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏛️ Department Dashboards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('directory')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'directory'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Directory & CRUD
            </button>
          </div>

          <button
            type="button"
            onClick={fetchDepartmentsData}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            + Add Department
          </button>
        </div>
      </div>

      {/* VIEW 1: DEPARTMENT DASHBOARDS & ACTIVE/RESOLVED PROBLEMS */}
      {viewMode === 'dashboards' && (
        <div className="space-y-6">
          {/* Department Selector Tabs Ribbon */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                🏛️ Select Department Dashboard:
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {selectedDeptId === 'ALL'
                  ? 'Viewing: Consolidated City-Wide Overview'
                  : `Viewing: ${currentDept?.department.name}`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {/* Consolidated Tab */}
              <button
                type="button"
                onClick={() => setSelectedDeptId('ALL')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedDeptId === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">🌐</span>
                <p className="text-xs font-extrabold truncate mt-1">All Depts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {aggregatedStats.totalActive + aggregatedStats.totalResolved} Total
                </p>
              </button>

              {/* Individual Department Tabs */}
              {departmentsData.map((d) => {
                const isSelected = selectedDeptId === d.department._id;
                return (
                  <button
                    key={d.department._id}
                    type="button"
                    onClick={() => setSelectedDeptId(d.department._id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/50'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{d.department.icon || '🏛️'}</span>
                      {d.criticalCount > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                            isSelected ? 'bg-rose-400 text-slate-950' : 'bg-rose-100 text-rose-700'
                          }`}
                          title={`${d.criticalCount} Critical/High Priority`}
                        >
                          {d.criticalCount}!
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold truncate mt-1">{d.department.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] mt-0.5 opacity-80">
                      <span className="text-amber-300 font-bold">{d.activeCount} active</span>
                      <span>•</span>
                      <span className="text-teal-300">{d.resolvedCount} done</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Department Command Panel */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentDept?.department.icon || '🏛️'}</span>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {selectedDeptId === 'ALL'
                      ? 'Consolidated Master Incident Feed (All Departments)'
                      : `${currentDept?.department.name} Dashboard`}
                  </h3>
                  {currentDept && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-slate-100 text-slate-600">
                      {currentDept.department.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 max-w-2xl">
                  {currentDept?.department.description ||
                    'Consolidated overview of issues across all municipal branches and service categories.'}
                </p>
              </div>

              {/* Sub-Tabs: Active Problems | Resolved Problems | Officers */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 text-xs font-bold self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setProblemTab('ACTIVE')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    problemTab === 'ACTIVE'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active Problems ({activeComplaintsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProblemTab('RESOLVED')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    problemTab === 'RESOLVED'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Resolved ({resolvedComplaintsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProblemTab('OFFICERS')}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    problemTab === 'OFFICERS'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Staffed Officers ({activeOfficersList.length})</span>
                </button>
              </div>
            </div>

            {/* Complaints Feed & Filter Controls */}
            {problemTab !== 'OFFICERS' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="relative sm:col-span-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by ID, address, category..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-xs"
                    />
                  </div>

                  <div>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="CRITICAL">Critical Priority</option>
                      <option value="HIGH">High Priority</option>
                      <option value="MEDIUM">Medium Priority</option>
                      <option value="LOW">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 outline-none"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="priority">Sort: Highest Priority</option>
                    </select>
                  </div>
                </div>

                {displayedComplaints.length === 0 ? (
                  <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <FolderOpen className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      No {problemTab.toLowerCase()} complaints found for this department selection.
                    </p>
                    <p className="text-[11px] text-slate-400">All registered defects are processed.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {displayedComplaints.map((item) => (
                      <Link
                        key={item._id}
                        to={`/complaints/${item.complaintId || item._id}`}
                        className="block p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            {/* Image Thumbnail with Before/After Tag */}
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative border border-slate-200">
                              <img
                                src={item.resolution?.afterImage || item.image}
                                alt="Issue"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              {item.status === 'RESOLVED' && item.resolution?.afterImage && (
                                <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-teal-600 text-white text-[8px] font-bold rounded-tl">
                                  AFTER
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-500">
                                  {item.complaintId}
                                </span>
                                <PriorityBadge priority={item.priority} size="xs" />
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                  {item.assignedDepartment?.name || item.suggestedDepartment?.name || 'General Dept'}
                                </span>
                              </div>

                              <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                                {item.categoryName}
                              </h4>

                              <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {item.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <StatusBadge status={item.status} size="xs" />
                            <div className="text-[11px] text-slate-400 text-right">
                              <p>
                                Filed by: <strong className="text-slate-700">{item.citizen?.displayName || item.citizen?.name || 'Citizen'}</strong>
                              </p>
                              <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 3: Staffed Officers Roster */}
            {problemTab === 'OFFICERS' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Staffed Field Officers ({activeOfficersList.length})
                  </h4>
                </div>

                {activeOfficersList.length === 0 ? (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <p className="text-xs font-bold text-slate-700">No officers assigned to this department yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {activeOfficersList.map((off) => (
                      <div
                        key={off._id || off.email}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            🛡️
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Active Unit
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{off.name || off.displayName}</p>
                          <p className="text-xs text-slate-500 truncate">{off.email}</p>
                          <p className="text-[11px] text-purple-700 font-semibold mt-1">
                            🏛️ {off.department?.name || currentDept?.department.name || 'Assigned'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DEPARTMENT DIRECTORY & CRUD */}
      {viewMode === 'directory' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Department & Code</th>
                  <th className="py-3.5 px-4">Staffed Officers</th>
                  <th className="py-3.5 px-4">Total Issues</th>
                  <th className="py-3.5 px-4">Active Backlog</th>
                  <th className="py-3.5 px-4">Resolved</th>
                  <th className="py-3.5 px-4">Resolution Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {departmentsData.map((d) => (
                  <tr key={d.department._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {d.department.icon || '🏛️'}
                        </span>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{d.department.name}</span>
                          <span className="text-[10px] font-mono text-purple-600 font-bold">{d.department.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {d.officers?.length || 0} Officers
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.totalComplaints}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">{d.activeCount}</td>
                    <td className="py-3.5 px-4 font-bold text-teal-600">{d.resolvedCount}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[11px] text-slate-900">{d.resolutionRate}%</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${d.resolutionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(d.department)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit Department"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d.department._id, d.department.name)}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Delete Department"
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
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {isEditing ? 'Edit Department' : 'Add New Municipal Department'}
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
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Public Parks & Greenery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. FORESTRY"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="parks@civicai.gov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scope Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jurisdiction and responsibilities..."
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
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {modalSaving ? 'Saving...' : isEditing ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagementView;
