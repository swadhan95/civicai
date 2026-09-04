import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { complaintApi } from '../../api/complaintApi';
import { authApi } from '../../api/authApi';
import PriorityBadge from '../../components/complaint/PriorityBadge';
import StatusBadge from '../../components/complaint/StatusBadge';
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  FileText,
  Bell,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
  Wrench,
  ShieldCheck,
  Award,
  History,
  CheckCircle,
  Eye,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user, rankProgression, refreshUser } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  // Active Selected Metric Tab: 'ALL' | 'VALID' | 'RESOLVED' | 'IN_PROGRESS' | 'POINTS'
  const [activeTab, setActiveTab] = useState('ALL');

  // Complaints & Points State
  const [allComplaints, setAllComplaints] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'priority' | 'points'

  const loadData = async () => {
    setLoading(true);
    try {
      refreshUser();
      const [compRes, catRes] = await Promise.all([
        complaintApi.getComplaints({ citizen: user?.id, limit: 100 }),
        complaintApi.getCategories()
      ]);

      if (compRes.success) setAllComplaints(compRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPointHistory = async () => {
    setLoadingPoints(true);
    try {
      const res = await authApi.getPointHistory();
      if (res.success) setPointHistory(res.data);
    } catch (err) {
      console.warn('Point history endpoint fallback:', err);
    } finally {
      setLoadingPoints(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'POINTS') {
      loadPointHistory();
    }
  }, [activeTab]);

  // Counts Computed from Actual Complaints & User Record
  const counts = useMemo(() => {
    const total = allComplaints.length > 0 ? allComplaints.length : (user?.reportsCount || 0);
    const valid = allComplaints.filter((c) =>
      ['REVIEWED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(c.status)
    ).length;
    const resolved = allComplaints.filter((c) => c.status === 'RESOLVED').length;
    const inProgress = allComplaints.filter((c) =>
      ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)
    ).length;
    const points = user?.points || 0;

    return {
      total: Math.max(total, user?.reportsCount || 0),
      valid: Math.max(valid, user?.validReportsCount || 0),
      resolved: Math.max(resolved, user?.resolvedReportsCount || 0),
      inProgress,
      points
    };
  }, [allComplaints, user]);

  // Filtered & Sorted Complaints based on Active Tab & Search/Filter Controls
  const filteredComplaints = useMemo(() => {
    return allComplaints
      .filter((item) => {
        // Tab Filter
        if (activeTab === 'VALID') {
          if (!['REVIEWED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].includes(item.status)) return false;
        } else if (activeTab === 'RESOLVED') {
          if (item.status !== 'RESOLVED') return false;
        } else if (activeTab === 'IN_PROGRESS') {
          if (!['ASSIGNED', 'IN_PROGRESS'].includes(item.status)) return false;
        }

        // Category Filter
        if (selectedCategoryFilter !== 'ALL') {
          if (item.category?._id !== selectedCategoryFilter && item.categoryName !== selectedCategoryFilter) return false;
        }

        // Priority Filter
        if (selectedPriorityFilter !== 'ALL') {
          if (item.priority !== selectedPriorityFilter) return false;
        }

        // Search Filter
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
        if (sortBy === 'points') return (b.pointsAwarded || 0) - (a.pointsAwarded || 0);
        if (sortBy === 'priority') {
          const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        return 0;
      });
  }, [allComplaints, activeTab, selectedCategoryFilter, selectedPriorityFilter, searchQuery, sortBy]);

  const currentRank = rankProgression?.currentRank || user?.rank || { name: 'Silver Contributor', badge: '🥈' };
  const nextRank = rankProgression?.nextRank || { name: 'Gold Contributor', targetPoints: 500, pointsNeeded: 80 };
  const progressPercent = rankProgression?.progressPercent ?? 65;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome & Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce-short">{currentRank.badge || '🥈'}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.displayName || user?.name}!
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
            <span>Verified Citizen Contributor</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">{counts.points} Total Impact Points</span>
            <span>•</span>
            <span>{user?.city || 'Metropolis'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadData}
            title="Refresh Complaints Data"
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/report"
            className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group"
          >
            <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Report New Issue
          </Link>
        </div>
      </div>

      {/* INTERACTIVE IMPACT METRIC BLOCKS (CLICKABLE TABS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            📊 Interactive Impact Overview (Click Any Block to Filter & Inspect):
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Active Segment: <strong className="text-slate-900">{activeTab}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* Block 1: Total Reports */}
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/50 scale-[1.02]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              {activeTab === 'ALL' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold">{counts.total}</p>
            <p
              className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                activeTab === 'ALL' ? 'text-blue-100' : 'text-slate-500'
              }`}
            >
              Total Reports
            </p>
            <p
              className={`text-[11px] mt-1 line-clamp-1 ${
                activeTab === 'ALL' ? 'text-blue-200' : 'text-slate-400'
              }`}
            >
              All filed issues
            </p>
          </button>

          {/* Block 2: Valid Accepted */}
          <button
            type="button"
            onClick={() => setActiveTab('VALID')}
            className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              activeTab === 'VALID'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/50 scale-[1.02]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeTab === 'VALID' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              {activeTab === 'VALID' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold">{counts.valid}</p>
            <p
              className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                activeTab === 'VALID' ? 'text-emerald-100' : 'text-slate-500'
              }`}
            >
              Valid Accepted
            </p>
            <p
              className={`text-[11px] mt-1 line-clamp-1 ${
                activeTab === 'VALID' ? 'text-emerald-200' : 'text-slate-400'
              }`}
            >
              Verified by city
            </p>
          </button>

          {/* Block 3: Repaired & Resolved */}
          <button
            type="button"
            onClick={() => setActiveTab('RESOLVED')}
            className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              activeTab === 'RESOLVED'
                ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/25 ring-2 ring-teal-400/50 scale-[1.02]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeTab === 'RESOLVED' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              {activeTab === 'RESOLVED' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold">{counts.resolved}</p>
            <p
              className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                activeTab === 'RESOLVED' ? 'text-teal-100' : 'text-slate-500'
              }`}
            >
              Repairs Resolved
            </p>
            <p
              className={`text-[11px] mt-1 line-clamp-1 ${
                activeTab === 'RESOLVED' ? 'text-teal-200' : 'text-slate-400'
              }`}
            >
              Completed & verified
            </p>
          </button>

          {/* Block 4: In Progress / Active */}
          <button
            type="button"
            onClick={() => setActiveTab('IN_PROGRESS')}
            className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
              activeTab === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-600/25 ring-2 ring-amber-400/50 scale-[1.02]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeTab === 'IN_PROGRESS' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              {activeTab === 'IN_PROGRESS' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold">{counts.inProgress}</p>
            <p
              className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                activeTab === 'IN_PROGRESS' ? 'text-amber-100' : 'text-slate-500'
              }`}
            >
              In Progress
            </p>
            <p
              className={`text-[11px] mt-1 line-clamp-1 ${
                activeTab === 'IN_PROGRESS' ? 'text-amber-200' : 'text-slate-400'
              }`}
            >
              Active field repairs
            </p>
          </button>

          {/* Block 5: Civic Points & Ledger */}
          <button
            type="button"
            onClick={() => setActiveTab('POINTS')}
            className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer col-span-2 md:col-span-1 ${
              activeTab === 'POINTS'
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/25 ring-2 ring-purple-400/50 scale-[1.02]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activeTab === 'POINTS' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'
                }`}
              >
                <Trophy className="w-5 h-5" />
              </div>
              {activeTab === 'POINTS' && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Ledger Active
                </span>
              )}
            </div>
            <p className="text-3xl font-extrabold">{counts.points}</p>
            <p
              className={`text-xs font-bold uppercase tracking-wider mt-1 ${
                activeTab === 'POINTS' ? 'text-purple-100' : 'text-slate-500'
              }`}
            >
              Civic Points
            </p>
            <p
              className={`text-[11px] mt-1 line-clamp-1 ${
                activeTab === 'POINTS' ? 'text-purple-200' : 'text-slate-400'
              }`}
            >
              View Points History →
            </p>
          </button>
        </div>
      </div>

      {/* Rank Progression Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              <Trophy className="w-3.5 h-3.5" />
              Verified Civic Contributor Tier
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
              <span>{currentRank.badge}</span>
              <span>{currentRank.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Points are awarded for authentic defect reports (+20), officer verifications (+30), and successful resolutions (+40). Duplicate reports yield 0 spam points.
            </p>
          </div>

          {/* Progress bar to next rank */}
          {nextRank && (
            <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 w-full md:w-80 shrink-0 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Next Tier Target:</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  <span>{nextRank.badge}</span> {nextRank.name}
                </span>
              </div>

              <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500 shadow-sm shadow-amber-400"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>{user?.points || 0} pts</span>
                <span>{nextRank.targetPoints} pts</span>
              </div>
              <p className="text-[10px] text-slate-400 text-right">
                {nextRank.pointsNeeded} more points needed to promote
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC CONTENT CONTAINER (TAB-DRIVEN) */}
      {activeTab === 'POINTS' ? (
        /* --- VIEW: CIVIC POINTS & AUDIT LEDGER --- */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Your Verified Civic Points Ledger
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Every point earned or deducted is cryptographically tracked and recorded for transparency.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto"
            >
              ← Back to All Reports
            </button>
          </div>

          {/* Points Breakdown Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-0.5">
              <span className="font-bold text-emerald-800">Valid Submission</span>
              <p className="text-lg font-extrabold text-emerald-600">+20 pts</p>
              <p className="text-[10px] text-emerald-700">Initial quality verification</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-0.5">
              <span className="font-bold text-blue-800">Officer Confirmed</span>
              <p className="text-lg font-extrabold text-blue-600">+30 pts</p>
              <p className="text-[10px] text-blue-700">Crew dispatched on-site</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 space-y-0.5">
              <span className="font-bold text-teal-800">Repaired & Resolved</span>
              <p className="text-lg font-extrabold text-teal-600">+40 pts</p>
              <p className="text-[10px] text-teal-700">Before vs After AI verified</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-0.5">
              <span className="font-bold text-amber-800">Unique Discovery</span>
              <p className="text-lg font-extrabold text-amber-600">+20 pts</p>
              <p className="text-[10px] text-amber-700">First in ~75m radius</p>
            </div>
          </div>

          {/* Points Transaction Table */}
          {loadingPoints ? (
            <div className="py-12 flex justify-center text-purple-600">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : pointHistory.length === 0 ? (
            <div className="text-center py-10 space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700">Your Current Balance: {counts.points} Points</p>
              <p className="text-[11px] text-slate-400">
                Submit new verified infrastructure reports to earn more impact points and climb contributor tiers!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Running Balance</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {pointHistory.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.actionType}</td>
                      <td
                        className={`py-3.5 px-4 font-extrabold ${
                          log.points >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {log.points >= 0 ? `+${log.points}` : log.points} pts
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.balanceAfter}</td>
                      <td className="py-3.5 px-4 text-slate-500">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* --- VIEW: COMPLAINTS LIST WITH LIVE SEARCH & CONTROLS --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Complaints List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header & Filter Controls Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {activeTab === 'ALL' && 'All Submitted Complaints'}
                    {activeTab === 'VALID' && 'Valid Accepted Complaints'}
                    {activeTab === 'RESOLVED' && 'Repaired & Resolved Issues'}
                    {activeTab === 'IN_PROGRESS' && 'Active Field Repairs in Progress'}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {filteredComplaints.length} found
                  </span>
                </div>

                <Link
                  to="/citizen/complaints"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 self-start sm:self-auto"
                >
                  Full Complaints Log <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Fast Search & Dropdown Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {/* Search Input */}
                <div className="relative sm:col-span-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, location..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-700 outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority / Sort Filter */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-700 outline-none"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="priority">Sort: Highest Priority</option>
                    <option value="points">Sort: Most Points</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Complaints Cards */}
            <div className="space-y-3">
              {loading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>Loading your civic complaints...</span>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    No complaints match the "{activeTab}" filter.
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {searchQuery
                      ? 'Try clearing your search query or selecting a different category.'
                      : 'File a new report or switch filters above to see your issues.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ALL');
                      setSearchQuery('');
                      setSelectedCategoryFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredComplaints.map((item) => (
                  <Link
                    key={item._id}
                    to={`/complaints/${item.complaintId || item._id}`}
                    className="block bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all group relative overflow-hidden"
                  >
                    {/* Status accent strip */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        item.status === 'RESOLVED'
                          ? 'bg-teal-500'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-amber-500'
                          : item.status === 'ASSIGNED'
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                      }`}
                    ></div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                      <div className="flex items-start gap-4">
                        {/* Image Thumbnail with Before/After Badge */}
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 shrink-0 relative border border-slate-200 shadow-xs">
                          {item.image ? (
                            <img
                              src={item.resolution?.afterImage || item.image}
                              alt="Defect"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                              No Image
                            </div>
                          )}
                          {item.status === 'RESOLVED' && item.resolution?.afterImage && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-teal-600/90 text-white text-[9px] font-bold">
                              AFTER
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {item.complaintId}
                            </span>
                            <PriorityBadge priority={item.priority} size="xs" />
                            {item.masterIssue && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Corroborated Master Issue
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {item.categoryName}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {item.address}
                          </p>

                          {item.assignedDepartment && (
                            <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 pt-0.5">
                              <span>🏛️</span>
                              <span>{item.assignedDepartment.name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Status & Points Pill */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Trophy className="w-3 h-3 text-emerald-600" />
                          +{item.pointsAwarded || 20} pts
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right Live Notifications & Quick Stats (1 col) */}
          <div className="space-y-6">
            {/* Live Notification Feed */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  Live Incident Alerts
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Real-Time
                </span>
              </div>

              <div className="divide-y divide-slate-100 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No alerts at this moment.</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n._id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800">{n.title}</p>
                        <span className="text-[9px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{n.message}</p>
                      {n.complaintIdStr && (
                        <Link
                          to={`/complaints/${n.complaintIdStr}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline pt-0.5"
                        >
                          <span>Track Issue #{n.complaintIdStr}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Municipal Support Card */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300">
                City Control Room
              </span>
              <h4 className="text-base font-extrabold">Immediate Hazard Hotline</h4>
              <p className="text-xs text-blue-200 leading-relaxed">
                For active gas leaks, downed high-voltage wires, or severe road sinkholes, dial the municipal emergency desk directly.
              </p>
              <div className="pt-1">
                <a
                  href="tel:18002484224"
                  className="inline-block px-4 py-2 rounded-xl bg-white text-blue-950 font-extrabold text-xs hover:bg-blue-50 transition-colors"
                >
                  📞 1800-CIVIC-SOS
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
