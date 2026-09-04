import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { officerApi } from '../../api/officerApi';
import { complaintApi } from '../../api/complaintApi';
import { escalationApi } from '../../api/escalationApi';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import StatusBadge from '../../components/complaint/StatusBadge';
import {
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Loader2,
  FileCheck,
  RefreshCw,
  FolderOpen,
  MapPin,
  ExternalLink,
  ChevronRight,
  Flame,
  Wrench,
  Sparkles,
  Activity,
  CheckCheck,
  MessageSquare,
  X
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Queue Segment Tab: 'ACTIVE' | 'OVERDUE' | 'IN_PROGRESS' | 'RESOLVED' | 'ALL'
  const [queueTab, setQueueTab] = useState('ACTIVE');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');

  // Delay Reason Modal
  const [delayModalComplaint, setDelayModalComplaint] = useState(null);
  const [delayReasonText, setDelayReasonText] = useState('');
  const [delaySaving, setDelaySaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const compRes = await complaintApi.getComplaints({ limit: 150 });
      if (compRes.success) {
        setComplaints(compRes.data);
      }
    } catch (err) {
      console.error('Error fetching officer dashboard complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Quick Status Transition directly from dashboard
  const handleQuickStatusChange = async (complaintId, nextStatus) => {
    setStatusUpdateLoading(complaintId);
    setSuccessBanner('');
    try {
      const res = await complaintApi.updateStatus(complaintId, {
        status: nextStatus,
        message: `Status updated to ${nextStatus.replace('_', ' ')} by ${user?.name || 'Officer'}.`
      });
      if (res.success) {
        setSuccessBanner(`Issue #${res.data.complaintId} successfully moved to ${nextStatus.replace('_', ' ')}!`);
        setComplaints((prev) =>
          prev.map((c) => (c._id === complaintId || c.complaintId === complaintId ? res.data : c))
        );
        setTimeout(() => setSuccessBanner(''), 3500);
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  // Record Delay Reason
  const handleSaveDelayReason = async (e) => {
    e.preventDefault();
    if (!delayReasonText.trim()) return;
    setDelaySaving(true);
    try {
      const res = await escalationApi.recordDelayReason(delayModalComplaint._id || delayModalComplaint.complaintId, {
        reason: delayReasonText.trim()
      });
      if (res.success) {
        setSuccessBanner(`Delay reason recorded in #${delayModalComplaint.complaintId} audit log.`);
        setDelayModalComplaint(null);
        setDelayReasonText('');
        fetchAll();
        setTimeout(() => setSuccessBanner(''), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record delay reason.');
    } finally {
      setDelaySaving(false);
    }
  };

  // Live Summary Computed dynamically
  const summary = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter((c) => c.status === 'SUBMITTED').length;
    const reviewed = complaints.filter((c) => c.status === 'REVIEWED').length;
    const inProgress = complaints.filter((c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
    const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;
    const overdue = complaints.filter((c) => c.slaStatus === 'OVERDUE' && c.status !== 'RESOLVED').length;
    const critical = complaints.filter((c) => c.priority === 'CRITICAL' && c.status !== 'RESOLVED').length;
    const activeBacklog = submitted + reviewed + inProgress;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      totalIssues: total,
      submitted,
      reviewed,
      inProgress,
      resolved,
      overdue,
      critical,
      activeBacklog,
      resolutionRate
    };
  }, [complaints]);

  // SLA Urgency Ranker helper
  const getSlaUrgencyWeight = (item) => {
    if (item.status === 'RESOLVED' || item.status === 'REJECTED') return 0;
    const isOverdue = item.slaStatus === 'OVERDUE';
    const isDueSoon = item.slaStatus === 'DUE_SOON';

    if (isOverdue && item.priority === 'CRITICAL') return 100;
    if (isOverdue && item.priority === 'HIGH') return 90;
    if (isOverdue) return 80;

    if (isDueSoon && item.priority === 'CRITICAL') return 70;
    if (isDueSoon && item.priority === 'HIGH') return 60;
    if (isDueSoon) return 50;

    if (item.priority === 'CRITICAL') return 40;
    if (item.priority === 'HIGH') return 30;
    if (item.priority === 'MEDIUM') return 20;
    return 10;
  };

  // Filtered & SLA-Sorted complaints
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((item) => {
        if (queueTab === 'ACTIVE') {
          if (item.status === 'RESOLVED' || item.status === 'REJECTED') return false;
        } else if (queueTab === 'OVERDUE') {
          if (item.slaStatus !== 'OVERDUE' || item.status === 'RESOLVED') return false;
        } else if (queueTab === 'IN_PROGRESS') {
          if (item.status !== 'IN_PROGRESS' && item.status !== 'ASSIGNED') return false;
        } else if (queueTab === 'RESOLVED') {
          if (item.status !== 'RESOLVED') return false;
        }

        if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = item.complaintId?.toLowerCase().includes(q);
          const matchCat = item.categoryName?.toLowerCase().includes(q);
          const matchAddr = item.address?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchId && !matchCat && !matchAddr && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const weightDiff = getSlaUrgencyWeight(b) - getSlaUrgencyWeight(a);
        if (weightDiff !== 0) return weightDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [complaints, queueTab, priorityFilter, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Officer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Officer Operations & Resolution Control
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Inspector: <strong>{user?.displayName || user?.name}</strong> • Department:{' '}
            <strong className="text-blue-700">{user?.department?.name || 'Municipal Works'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAll}
            title="Refresh Incident Queue"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Field SLA Dispatch Online
          </span>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* KPI Statistic Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Queue</span>
          <p className="text-3xl font-extrabold text-slate-900">{summary.totalIssues}</p>
          <p className="text-[11px] text-slate-500">Assigned field cases</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Active Backlog</span>
          <p className="text-3xl font-extrabold text-amber-600">{summary.activeBacklog}</p>
          <p className="text-[11px] text-slate-500">Awaiting / in progress</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">🚨 SLA Breached</span>
          <p className="text-3xl font-extrabold text-rose-600">{summary.overdue}</p>
          <p className="text-[11px] text-slate-500">Priority action required</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Resolved Cases</span>
          <p className="text-3xl font-extrabold text-teal-600">{summary.resolved}</p>
          <p className="text-[11px] text-slate-500">{summary.resolutionRate}% closure rate</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Critical Priority</span>
          <p className="text-3xl font-extrabold text-purple-600">{summary.critical}</p>
          <p className="text-[11px] text-slate-500">Immediate response</p>
        </div>
      </div>

      {/* Incident Queue Segment Selector & Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Segment Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setQueueTab('ACTIVE')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                queueTab === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Workload ({summary.activeBacklog})
            </button>
            <button
              type="button"
              onClick={() => setQueueTab('OVERDUE')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 ${
                queueTab === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:text-rose-700'
              }`}
            >
              🚨 SLA Overdue ({summary.overdue})
            </button>
            <button
              type="button"
              onClick={() => setQueueTab('IN_PROGRESS')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                queueTab === 'IN_PROGRESS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({summary.inProgress})
            </button>
            <button
              type="button"
              onClick={() => setQueueTab('RESOLVED')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                queueTab === 'RESOLVED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved History ({summary.resolved})
            </button>
          </div>

          {/* Search & Priority Filter */}
          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, street, defect..."
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* INCIDENT QUEUE FEED */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex justify-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No complaints in this queue segment</h3>
            <p className="text-xs text-slate-500">All registered defects are currently processed.</p>
          </div>
        ) : (
          filteredComplaints.map((item) => {
            const isOverdue = item.slaStatus === 'OVERDUE';
            const isDueSoon = item.slaStatus === 'DUE_SOON';

            return (
              <div
                key={item._id}
                className={`p-6 rounded-3xl bg-white border transition-all shadow-xs ${
                  isOverdue
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isDueSoon
                    ? 'border-amber-300 ring-1 ring-amber-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column: Photo & Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 relative">
                      <img
                        src={item.resolution?.afterImage || item.image}
                        alt="Defect"
                        className="w-full h-full object-cover"
                      />
                      {item.status === 'RESOLVED' && item.resolution?.afterImage && (
                        <span className="absolute bottom-0 right-0 px-1 py-0.5 bg-teal-600 text-white text-[8px] font-bold rounded-tl">
                          AFTER
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-500">
                          {item.complaintId}
                        </span>
                        <PriorityBadge priority={item.priority} size="xs" />
                        <StatusBadge status={item.status} size="xs" />

                        {/* SLA Badges */}
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] animate-pulse">
                            🚨 SLA OVERDUE
                          </span>
                        )}
                        {isDueSoon && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                            ⏰ DUE SOON
                          </span>
                        )}
                        {item.isEscalated && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-extrabold text-[10px]">
                            ⚡ ESCALATED
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-extrabold text-slate-900">
                        {item.categoryName}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.address}
                      </p>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => setDelayModalComplaint(item)}
                      className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors text-center"
                    >
                      ⚠️ Record Delay
                    </button>

                    {item.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(item._id, 'REVIEWED')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors text-center"
                      >
                        Accept & Review
                      </button>
                    )}

                    {item.status === 'REVIEWED' && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(item._id, 'IN_PROGRESS')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors text-center"
                      >
                        Start Field Work
                      </button>
                    )}

                    {item.status !== 'RESOLVED' && (
                      <Link
                        to={`/officer/complaints/${item.complaintId || item._id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Upload Resolution
                      </Link>
                    )}

                    <Link
                      to={`/complaints/${item.complaintId || item._id}`}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
                      title="View Public Issue Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5 inline" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RECORD DELAY REASON MODAL */}
      {delayModalComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Record Field Delay Justification
              </h3>
              <button
                type="button"
                onClick={() => setDelayModalComplaint(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Complaint #{delayModalComplaint.complaintId} ({delayModalComplaint.categoryName}). Provide the legitimate operational reason for delay (e.g. road excavation permit pending, adverse storm, equipment maintenance).
            </p>

            <form onSubmit={handleSaveDelayReason} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                value={delayReasonText}
                onChange={(e) => setDelayReasonText(e.target.value)}
                placeholder="Operational justification..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDelayModalComplaint(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={delaySaving}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {delaySaving ? 'Saving...' : 'Record Justification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerDashboard;
