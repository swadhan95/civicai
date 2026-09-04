import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { geographyApi } from '../../api/geographyApi';
import PriorityBadge from '../complaint/PriorityBadge';
import StatusBadge from '../complaint/StatusBadge';
import {
  X,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Clock,
  Calendar,
  Building2,
  MapPin,
  Flame,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AreaProblemDrawer = ({
  isOpen = false,
  onClose,
  regionId = null,
  regionName = 'Selected Area',
  departments = [],
  categories = []
}) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchProblems = async () => {
    if (!regionId) return;
    setLoading(true);
    try {
      const filters = {};
      if (search.trim()) filters.search = search.trim();
      if (selectedDept !== 'ALL') filters.departmentId = selectedDept;
      if (selectedCat !== 'ALL') filters.categoryId = selectedCat;
      if (selectedPriority !== 'ALL') filters.priority = selectedPriority;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;

      const res = await geographyApi.getRegionProblems(regionId, {
        page,
        limit: 10,
        ...filters
      });

      if (res.success) {
        setComplaints(res.complaints || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching region problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && regionId) {
      fetchProblems();
    }
  }, [isOpen, regionId, page, selectedDept, selectedCat, selectedPriority, selectedStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Geographic Problem Roster
              </span>
              <span className="text-xs text-slate-400 font-mono">({totalCount} Total Issues)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1">
              📍 Problems in {regionName}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID, street, or issue..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d._id || d.departmentId} value={d._id || d.departmentId}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Complaints Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">Loading problems for {regionName}...</p>
            </div>
          ) : complaints.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
              {complaints.map((c) => (
                <div
                  key={c._id}
                  className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{c.complaintId}</span>
                      <PriorityBadge priority={c.priority} size="xs" />
                      <StatusBadge status={c.status} size="xs" />
                      {c.isEscalated && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          🚨 Escalated
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">{c.title || c.categoryName}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{c.address}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>🏛️ {c.assignedDepartment?.name || c.departmentName || 'Department Assigned'}</span>
                      <span>•</span>
                      <span>⏱️ SLA: {c.slaDuration || 24}h ({c.slaStatus?.replace(/_/g, ' ') || 'ON TRACK'})</span>
                    </div>
                  </div>

                  <Link
                    to={`/complaints/${c._id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold rounded-lg border border-slate-200 transition shrink-0"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">No matching problems found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer & Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Page {page} of {totalPages} ({totalCount} items)</span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaProblemDrawer;
