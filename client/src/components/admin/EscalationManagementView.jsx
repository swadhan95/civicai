import React, { useState, useEffect } from 'react';
import { escalationApi } from '../../api/escalationApi';
import PriorityBadge from '../complaint/PriorityBadge';
import StatusBadge from '../complaint/StatusBadge';
import {
  Flame,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
  Building2,
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  CheckCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EscalationManagementView = ({ departments = [], officers = [] }) => {
  const [escalations, setEscalations] = useState([]);
  const [telemetry, setTelemetry] = useState({
    totalCount: 0,
    requestedCount: 0,
    underReviewCount: 0,
    actionRequiredCount: 0,
    resolvedCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [search, setSearch] = useState('');

  // Active modal
  const [activeEscalation, setActiveEscalation] = useState(null);
  const [actionStatus, setActionStatus] = useState('UNDER_REVIEW');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [reassignOfficerId, setReassignOfficerId] = useState('');
  const [escalationLevel, setEscalationLevel] = useState(1);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const res = await escalationApi.getEscalations({
        departmentId: selectedDept,
        status: selectedStatus,
        escalationLevel: selectedLevel,
        search
      });
      if (res.success) {
        setEscalations(res.data);
        if (res.telemetry) setTelemetry(res.telemetry);
      }
    } catch (err) {
      console.error('Failed to load escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [selectedDept, selectedStatus, selectedLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEscalations();
  };

  const handleOpenDetail = (esc) => {
    setActiveEscalation(esc);
    setActionStatus(esc.status === 'REQUESTED' ? 'UNDER_REVIEW' : esc.status);
    setAdminNotes(esc.adminNotes || '');
    setActionTaken(esc.actionTaken || '');
    setEscalationLevel(esc.escalationLevel || 1);
    setReassignOfficerId(esc.assignedOfficer?._id || '');
    setActionMsg({ type: '', text: '' });
  };

  const handleSaveAction = async (e) => {
    e.preventDefault();
    setActionSaving(true);
    setActionMsg({ type: '', text: '' });

    try {
      const res = await escalationApi.updateEscalationStatus(activeEscalation._id, {
        status: actionStatus,
        adminNotes,
        actionTaken,
        escalationLevel,
        reassignOfficerId: reassignOfficerId || null
      });

      if (res.success) {
        setActionMsg({ type: 'success', text: `Escalation updated to [${actionStatus}] successfully.` });
        fetchEscalations();
        setTimeout(() => {
          setActiveEscalation(null);
        }, 1200);
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update escalation.' });
    } finally {
      setActionSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Escalations</span>
          <p className="text-2xl font-extrabold text-slate-900">{telemetry.totalCount}</p>
          <span className="text-[10px] text-slate-500">Citizen Invocations</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-rose-600">New / Requested</span>
          <p className="text-2xl font-extrabold text-rose-600">{telemetry.requestedCount}</p>
          <span className="text-[10px] text-slate-500">Awaiting Action</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-600">Under Review</span>
          <p className="text-2xl font-extrabold text-amber-600">{telemetry.underReviewCount}</p>
          <span className="text-[10px] text-slate-500">Supervisor Inspecting</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-blue-600">Action Required</span>
          <p className="text-2xl font-extrabold text-blue-600">{telemetry.actionRequiredCount}</p>
          <span className="text-[10px] text-slate-500">Dispatch Order Issued</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-teal-600">Resolved</span>
          <p className="text-2xl font-extrabold text-teal-600">{telemetry.resolvedCount}</p>
          <span className="text-[10px] text-slate-500">Issues Rectified</span>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Escalation Command & Accountability Filters
            </h3>
          </div>

          <button
            type="button"
            onClick={fetchEscalations}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 self-start sm:self-auto transition-colors"
            title="Refresh Escalations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Escalation ID, complaint, reason..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-none"
            />
          </form>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Escalation Statuses</option>
              <option value="REQUESTED">Requested (New)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="ACTION_REQUIRED">Action Required</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">All Escalation Levels</option>
              <option value="1">Level 1: Department Supervisor</option>
              <option value="2">Level 2: Municipal Administrator</option>
              <option value="3">Level 3: Central Command Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Escalations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          </div>
        ) : escalations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No active citizen escalations matching selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Escalation ID & Level</th>
                  <th className="py-3.5 px-4">Complaint ID & Category</th>
                  <th className="py-3.5 px-4">Department & Officer</th>
                  <th className="py-3.5 px-4">Citizen Reason</th>
                  <th className="py-3.5 px-4">Escalation Status</th>
                  <th className="py-3.5 px-4">Escalated At</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {escalations.map((esc) => (
                  <tr key={esc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-extrabold text-rose-600 block">
                          {esc.escalationId}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold inline-block">
                          Level {esc.escalationLevel}: {esc.levelName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {esc.complaint?.complaintId || 'CIV-ISSUE'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">
                        {esc.complaint?.categoryName}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-indigo-700">
                        {esc.originalDepartment?.name || 'Sanitation'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Officer: {esc.assignedOfficer?.name || 'Unassigned'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-800 text-xs line-clamp-2 leading-relaxed">
                        "{esc.reason}"
                      </p>
                      <span className="text-[10px] text-slate-400">
                        By {esc.citizen?.displayName || esc.citizen?.name || 'Citizen'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          esc.status === 'REQUESTED'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : esc.status === 'UNDER_REVIEW'
                            ? 'bg-amber-100 text-amber-900'
                            : esc.status === 'ACTION_REQUIRED'
                            ? 'bg-blue-100 text-blue-900'
                            : esc.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {esc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(esc.createdAt).toLocaleDateString()} at{' '}
                      {new Date(esc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(esc)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors"
                      >
                        Take Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ESCALATION DETAIL & ADMINISTRATIVE ACTION MODAL */}
      {activeEscalation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Escalation Command Action: {activeEscalation.escalationId}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Linked Complaint: #{activeEscalation.complaint?.complaintId} ({activeEscalation.complaint?.categoryName})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveEscalation(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionMsg.text && (
              <div
                className={`p-3 rounded-2xl text-xs font-semibold ${
                  actionMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {/* Complaint Overview Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Department Unit:</span>
                <span className="font-bold text-indigo-700">
                  {activeEscalation.originalDepartment?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Citizen Escalation Reason:</span>
                <span className="font-semibold text-rose-950">"{activeEscalation.reason}"</span>
              </div>
              {activeEscalation.evidence && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Additional Citizen Evidence:</span>
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                    <img
                      src={activeEscalation.evidence}
                      alt="Escalation Evidence"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Form */}
            <form onSubmit={handleSaveAction} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Set Escalation Status
                  </label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none"
                  >
                    <option value="UNDER_REVIEW">UNDER_REVIEW (Supervisor Inspecting)</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED (Notice Issued)</option>
                    <option value="ACTION_REQUIRED">ACTION_REQUIRED (Direct Crew Dispatch)</option>
                    <option value="RESOLVED">RESOLVED (Issue Closed)</option>
                    <option value="REJECTED">REJECTED (Invalid / False Alarm)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Escalation Authority Level
                  </label>
                  <select
                    value={escalationLevel}
                    onChange={(e) => setEscalationLevel(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none"
                  >
                    <option value={1}>Level 1: Department Supervisor</option>
                    <option value={2}>Level 2: Municipal Administrator</option>
                    <option value={3}>Level 3: Central Command Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Action Taken / Dispatch Directives
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Immediate priority clean-up team dispatched with compactor truck."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrative Review Notes
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes regarding field investigation, accountability check, or contractor penalties..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Link
                  to={`/complaints/${activeEscalation.complaint?.complaintId || activeEscalation.complaint?._id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public Complaint Page
                </Link>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveEscalation(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSaving}
                    className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md disabled:opacity-50"
                  >
                    {actionSaving ? 'Applying...' : 'Apply Action'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationManagementView;
