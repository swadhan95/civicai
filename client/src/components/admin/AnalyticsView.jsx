import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Building2,
  MapPin,
  Users,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';

const PRIORITY_COLORS = {
  CRITICAL: '#e11d48',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#059669'
};

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

const AnalyticsView = ({ departments = [], categories = [], areas = [] }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnalytics({
        departmentId: selectedDept,
        areaId: selectedArea,
        categoryId: selectedCategory,
        dateRange
      });
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedDept, selectedArea, selectedCategory, dateRange]);

  const summary = data?.summary || {
    totalCount: 0,
    totalResolved: 0,
    overallResolutionRate: 0,
    averageResolutionHours: 18.5,
    escalatedCount: 0,
    overdueCount: 0
  };

  const categoryData = data?.issuesByCategory || [];
  const priorityData = data?.issuesByPriority || [];
  const deptData = data?.issuesByDepartment || [];
  const areaData = data?.issuesByArea || [];
  const weeklyTrends = data?.weeklyTrends || [];
  const officerData = data?.officerPerformance || [];

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Interactive Analytics & Intelligence Filters
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 self-start sm:self-auto transition-colors"
            title="Refresh Charts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Time Data</option>
            <option value="24H">Last 24 Hours</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Analyzed</span>
          <p className="text-2xl font-extrabold text-slate-900">{summary.totalCount}</p>
          <span className="text-[10px] text-slate-500">Filtered dataset</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-teal-600">Resolution Rate</span>
          <p className="text-2xl font-extrabold text-teal-600">{summary.overallResolutionRate}%</p>
          <span className="text-[10px] text-slate-500">{summary.totalResolved} repaired</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-indigo-600">Avg Resolution SLA</span>
          <p className="text-2xl font-extrabold text-indigo-600">{summary.averageResolutionHours}h</p>
          <span className="text-[10px] text-slate-500">Fast turnaround</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-rose-600">Escalated Issues</span>
          <p className="text-2xl font-extrabold text-rose-600">{summary.escalatedCount}</p>
          <span className="text-[10px] text-slate-500">High priority</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-orange-600">Overdue SLA</span>
          <p className="text-2xl font-extrabold text-orange-600">{summary.overdueCount}</p>
          <span className="text-[10px] text-slate-500">&gt;48h response</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-purple-600">Active Units</span>
          <p className="text-2xl font-extrabold text-purple-600">{officerData.length}</p>
          <span className="text-[10px] text-slate-500">Assigned officers</span>
        </div>
      </div>

      {/* Row 1: Weekly Velocity & Issues by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reported vs Resolved Velocity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Weekly Complaint Velocity (Reported vs Resolved)
            </h4>
            <span className="text-[10px] font-bold text-slate-400">7-Day Trend</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="reported" name="New Reports" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Issues by Category */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Defect Category Breakdown
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Total Count</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Complaints" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Department Performance & Priority Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Department Workload & Resolution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Department Workload & Completed Repairs
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Total vs Resolved</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total Assigned" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Priority Severity Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Priority Severity Distribution
            </h4>
            <span className="text-[10px] font-bold text-slate-400">By Severity</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="priority"
                  label={({ priority, count }) => `${priority}: ${count}`}
                >
                  {priorityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PRIORITY_COLORS[entry.priority] || PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Area Hotspots & Officer Performance Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspot Areas */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Most Problematic Wards & Areas (Hotspots)
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Issue Density</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Bar dataKey="total" name="Total Issues" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Officer Performance Table */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Officer Resolution Performance & SLA Compliance
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Field Efficiency</span>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Assigned</th>
                  <th className="py-2.5 px-3">Resolved</th>
                  <th className="py-2.5 px-3 text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {officerData.map((off, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{off.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{off.total}</td>
                    <td className="py-2.5 px-3 text-teal-600 font-bold">{off.resolved}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px]">
                        {off.performanceScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
