import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import PriorityBadge from '../complaint/PriorityBadge';
import StatusBadge from '../complaint/StatusBadge';
import BeforeAfterViewer from '../complaint/BeforeAfterViewer';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  Wrench,
  X,
  ExternalLink,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Calendar,
  Building2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const createSeverityIcon = (priority, status) => {
  const color =
    status === 'RESOLVED'
      ? '#059669'
      : priority === 'CRITICAL'
      ? '#e11d48'
      : priority === 'HIGH'
      ? '#ea580c'
      : priority === 'MEDIUM'
      ? '#d97706'
      : '#0284c7';

  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22]
  });
};

const MasterMonitoringView = ({ departments = [], categories = [], areas = [] }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'

  // Filters
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lifecycle Inspection Modal
  const [activeLifecycleIssue, setActiveLifecycleIssue] = useState(null);

  const fetchMonitoringData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getMasterMonitoring({
        departmentId: selectedDept,
        areaId: selectedArea,
        categoryId: selectedCategory,
        priority: selectedPriority,
        status: selectedStatus,
        dateRange,
        search: searchQuery
      });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch master monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, [selectedDept, selectedArea, selectedCategory, selectedPriority, selectedStatus, dateRange]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMonitoringData();
  };

  const telemetry = data?.telemetry || {
    totalReported: 0,
    pendingIssues: 0,
    assignedIssues: 0,
    inProgressIssues: 0,
    resolvedIssues: 0,
    escalatedIssues: 0,
    overdueIssues: 0,
    criticalIssues: 0,
    activeOfficersCount: 0,
    activeInspectionsCount: 0,
    resolutionRate: 0
  };

  const complaintsList = data?.complaints || [];

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Issues</span>
          <p className="text-2xl font-extrabold text-slate-900">{telemetry.totalReported}</p>
          <span className="text-[10px] text-slate-500">Platform Total</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-600">Pending</span>
          <p className="text-2xl font-extrabold text-amber-600">{telemetry.pendingIssues}</p>
          <span className="text-[10px] text-slate-500">Awaiting Action</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-indigo-600">Assigned</span>
          <p className="text-2xl font-extrabold text-indigo-600">{telemetry.assignedIssues}</p>
          <span className="text-[10px] text-slate-500">To Dept / Officer</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-blue-600">In Progress</span>
          <p className="text-2xl font-extrabold text-blue-600">{telemetry.inProgressIssues}</p>
          <span className="text-[10px] text-slate-500">Crews On-Site</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-teal-600">Resolved</span>
          <p className="text-2xl font-extrabold text-teal-600">{telemetry.resolvedIssues}</p>
          <span className="text-[10px] text-slate-500">{telemetry.resolutionRate}% closure</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-rose-600">Escalated</span>
          <p className="text-2xl font-extrabold text-rose-600">{telemetry.escalatedIssues}</p>
          <span className="text-[10px] text-slate-500">Urgent Attention</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-orange-600">Overdue SLA</span>
          <p className="text-2xl font-extrabold text-orange-600">{telemetry.overdueIssues}</p>
          <span className="text-[10px] text-slate-500">&gt;48h response</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-purple-600">Officers</span>
          <p className="text-2xl font-extrabold text-purple-600">{telemetry.activeOfficersCount}</p>
          <span className="text-[10px] text-slate-500">Active Field Units</span>
        </div>
      </div>

      {/* Multi-Dimensional Filter Control Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Master Command Filters
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📋 Incident Table ({complaintsList.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🗺️ Live Map View
            </button>
            <button
              type="button"
              onClick={fetchMonitoringData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* 1. Department */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* 2. Area / Ward */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Wards / Areas</option>
            {areas.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* 3. Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* 4. Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          {/* 5. Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* 6. Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Time</option>
            <option value="24H">Last 24 Hours</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
          </select>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Complaint ID, street address, category name..."
            className="w-full pl-9 pr-24 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-white font-bold text-[11px] rounded-lg"
          >
            Search
          </button>
        </form>
      </div>

      {/* VIEW: TABLE OR MAP */}
      {viewMode === 'map' ? (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-2">
          <div className="h-[520px] rounded-2xl overflow-hidden relative">
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {complaintsList.map((item) => {
                const [lon, lat] = item.location?.coordinates || [77.5946, 12.9716];
                return (
                  <Marker
                    key={item._id}
                    position={[lat, lon]}
                    icon={createSeverityIcon(item.priority, item.status)}
                  >
                    <Popup>
                      <div className="p-1 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-indigo-600">{item.complaintId}</span>
                          <PriorityBadge priority={item.priority} size="xs" />
                        </div>
                        <p className="font-bold text-slate-900">{item.categoryName}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{item.address}</p>
                        <button
                          type="button"
                          onClick={() => setActiveLifecycleIssue(item)}
                          className="w-full mt-1 px-2 py-1 rounded bg-indigo-600 text-white font-bold text-[10px] text-center"
                        >
                          Inspect Lifecycle ➔
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Issue ID & Photo</th>
                  <th className="py-3.5 px-4">Category & Location</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dept & Officer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Lifecycle Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {complaintsList.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 relative">
                          <img
                            src={item.resolution?.afterImage || item.image}
                            alt="Defect"
                            className="w-full h-full object-cover"
                          />
                          {item.status === 'RESOLVED' && item.resolution?.afterImage && (
                            <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-teal-600 text-white text-[7px] font-bold rounded-tl">
                              AFTER
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">
                            {item.complaintId}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            By {item.citizen?.displayName || 'Citizen'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{item.categoryName}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {item.address}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} size="xs" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="xs" />
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-indigo-700">
                        {item.assignedDepartment?.name || item.suggestedDepartment?.name || 'Municipal Works'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Officer: {item.assignedOfficer?.name || 'Unassigned'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveLifecycleIssue(item)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Lifecycle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPLETE ISSUE LIFECYCLE MODAL */}
      {activeLifecycleIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-600 text-sm">
                    {activeLifecycleIssue.complaintId}
                  </span>
                  <PriorityBadge priority={activeLifecycleIssue.priority} size="xs" />
                  <StatusBadge status={activeLifecycleIssue.status} size="xs" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                  Complete Issue Lifecycle & Governance Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLifecycleIssue(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Step-by-Step Lifecycle Track */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">1. Citizen Report</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {activeLifecycleIssue.citizen?.displayName || 'Citizen'}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold">+20 Points Awarded</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">2. Dept Routing</span>
                <p className="font-bold text-indigo-700 mt-0.5">
                  {activeLifecycleIssue.assignedDepartment?.name || 'Roads'}
                </p>
                <span className="text-[10px] text-slate-500">AI Auto-Classified</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">3. Field Crew</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {activeLifecycleIssue.assignedOfficer?.name || 'Inspection Assigned'}
                </p>
                <span className="text-[10px] text-blue-600 font-bold">In-Progress</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">4. Closure</span>
                <p className="font-bold text-teal-700 mt-0.5">
                  {activeLifecycleIssue.status === 'RESOLVED' ? 'Repaired & Verified' : 'Pending Verification'}
                </p>
                <span className="text-[10px] text-teal-600 font-bold">
                  {activeLifecycleIssue.status === 'RESOLVED' ? '+40 Points Awarded' : 'SLA: 48h'}
                </span>
              </div>
            </div>

            {/* Before vs After Photos */}
            {activeLifecycleIssue.status === 'RESOLVED' && activeLifecycleIssue.resolution?.afterImage ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Visual Evidence Comparison (Before vs After)
                </h4>
                <BeforeAfterViewer
                  beforeImage={activeLifecycleIssue.image}
                  afterImage={activeLifecycleIssue.resolution.afterImage}
                  categoryName={activeLifecycleIssue.categoryName}
                  resolutionDate={activeLifecycleIssue.resolution?.resolvedAt}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Reported Defect Photographic Evidence
                </h4>
                <div className="h-56 rounded-2xl overflow-hidden bg-slate-950 border border-slate-200">
                  <img
                    src={activeLifecycleIssue.image}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Timeline Events Log */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audit Timeline Events
              </h4>
              <div className="space-y-2 text-xs">
                {activeLifecycleIssue.timeline?.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.status}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{t.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                to={`/complaints/${activeLifecycleIssue.complaintId || activeLifecycleIssue._id}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Full Public Issue Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterMonitoringView;
