import React from 'react';
import {
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Building2,
  Layers,
  Sparkles,
  ChevronRight,
  BarChart3,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const AreaIntelligencePanel = ({
  statistics = null,
  isLoading = false,
  onSelectChildArea,
  onOpenProblemDrawer,
  onFilterByDepartment,
  onFilterByCategory,
  activeDeptFilter = 'ALL',
  activeCatFilter = 'ALL'
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[450px]">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center animate-bounce mb-3">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">Computing Geographic Intelligence...</h4>
        <p className="text-slate-400 text-xs mt-1">Aggregating real-time telemetry from database</p>
      </div>
    );
  }

  if (!statistics || !statistics.region) {
    return (
      <div className="w-full h-full bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[450px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">No Geographic Area Selected</h4>
        <p className="text-slate-400 text-xs mt-1 max-w-xs">Select a region on the map or from the breadcrumbs to inspect problems.</p>
      </div>
    );
  }

  const { region, overview, alert, categories = [], departments = [], childRegions = [], topDepartment, topCategory } = statistics;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col overflow-hidden divide-y divide-slate-100">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
              {region.type?.replace(/_/g, ' ')}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              📍 {region.displayName || region.name}
            </h2>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-xs ${
                alert.level === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                  : alert.level === 'HIGH_ALERT'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : alert.level === 'WATCH'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alert.color }} />
              <span>{alert.label}</span>
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-3xl font-extrabold text-white">{overview.total}</span>
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Total Recorded Problems</span>
        </div>
      </div>

      {/* 2. Key Status KPI Telemetry */}
      <div className="grid grid-cols-4 p-3 bg-slate-50 text-center gap-2">
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Active</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{overview.active}</p>
        </div>
        <div className="p-2 rounded-xl bg-white border border-rose-100 shadow-2xs">
          <p className="text-[10px] font-bold text-rose-600 uppercase">Critical</p>
          <p className="text-lg font-black text-rose-600 mt-0.5">{overview.critical}</p>
        </div>
        <div className="p-2 rounded-xl bg-white border border-amber-100 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-600 uppercase">Overdue</p>
          <p className="text-lg font-black text-amber-600 mt-0.5">{overview.overdue}</p>
        </div>
        <div className="p-2 rounded-xl bg-white border border-rose-100 shadow-2xs">
          <p className="text-[10px] font-bold text-purple-600 uppercase">Escalated</p>
          <p className="text-lg font-black text-purple-600 mt-0.5">{overview.escalated}</p>
        </div>
      </div>

      {/* 3. Problem Types / Category Breakdown */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Problem Types</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">{categories.length} Categories</span>
        </div>

        <div className="space-y-2.5">
          {categories.slice(0, 5).map((cat) => (
            <div
              key={cat.categoryId || cat.name}
              onClick={() => onFilterByCategory?.(cat.categoryId)}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                activeCatFilter === cat.categoryId
                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                  : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {cat.count}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(8, cat.percentage))}%` }}
                />
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-2">No category data recorded for this area</p>
          )}
        </div>
      </div>

      {/* 4. Department Workload */}
      <div className="p-4 sm:p-5 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Department Workload</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">{departments.length} Departments</span>
        </div>

        <div className="space-y-2">
          {departments.map((dept) => (
            <button
              key={dept.departmentId || dept.name}
              onClick={() => onFilterByDepartment?.(dept.departmentId)}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between border text-xs ${
                activeDeptFilter === dept.departmentId
                  ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400 font-bold'
                  : 'bg-white hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span className="font-semibold text-slate-800">{dept.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">{dept.percentage}%</span>
                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  {dept.count}
                </span>
              </div>
            </button>
          ))}

          {departments.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-2">No department workload logged</p>
          )}
        </div>
      </div>

      {/* 5. Priority & SLA Breakdown */}
      <div className="p-4 sm:p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          <span>Priority & SLA Compliance</span>
        </h4>

        {/* Priority distribution pills */}
        <div className="grid grid-cols-4 gap-1.5 mb-4 text-center text-xs">
          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
            <span className="text-[10px] font-bold text-rose-700 block">Critical</span>
            <span className="font-black text-rose-900">{overview.critical}</span>
          </div>
          <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-[10px] font-bold text-orange-700 block">High</span>
            <span className="font-black text-orange-900">{overview.high}</span>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-[10px] font-bold text-amber-700 block">Medium</span>
            <span className="font-black text-amber-900">{overview.medium}</span>
          </div>
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-[10px] font-bold text-emerald-700 block">Low</span>
            <span className="font-black text-emerald-900">{overview.low}</span>
          </div>
        </div>

        {/* SLA Compliance card */}
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">SLA Performance</p>
            <p className="text-xs text-slate-300 mt-0.5">Resolved on-time rate</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400">{overview.slaComplianceRate}%</span>
          </div>
        </div>
      </div>

      {/* 6. Child Administrative Areas */}
      {childRegions.length > 0 && (
        <div className="p-4 sm:p-5 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Sub-Areas ({childRegions.length})</span>
            </h4>
            <span className="text-[10px] text-slate-400">Click to drill down</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {childRegions.map((child) => (
              <button
                key={child._id}
                onClick={() => onSelectChildArea?.(child._id)}
                className="w-full px-3 py-2 bg-white hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 rounded-xl transition flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: child.alertColor }} />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                      {child.displayName || child.name}
                    </h5>
                    <span className="text-[10px] text-slate-400">{child.type?.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-900 px-2 py-0.5 rounded-md">
                    {child.totalProblems}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Action Button: View Problems */}
      <div className="p-4 bg-white">
        <button
          onClick={onOpenProblemDrawer}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 group"
        >
          <FileText className="w-4 h-4" />
          <span>View All Problems in {region.name}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
        </button>
      </div>
    </div>
  );
};

export default AreaIntelligencePanel;
