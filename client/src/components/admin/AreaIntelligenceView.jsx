import React, { useState, useEffect } from 'react';
import { geographyApi } from '../../api/geographyApi';
import GeographyBreadcrumb from '../map/GeographyBreadcrumb';
import HierarchicalProblemMap from '../map/HierarchicalProblemMap';
import AreaIntelligencePanel from '../map/AreaIntelligencePanel';
import AreaProblemDrawer from '../map/AreaProblemDrawer';
import {
  MapPin,
  Building2,
  Sparkles,
  Layers,
  Table,
  BarChart3,
  RefreshCw,
  Loader2,
  Filter,
  Flame,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Search,
  ExternalLink
} from 'lucide-react';

const AreaIntelligenceView = ({ departments = [], categories = [] }) => {
  const [currentRegionId, setCurrentRegionId] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP', 'DEPT_MATRIX', 'CAT_MATRIX'
  const [matrixData, setMatrixData] = useState(null);
  const [matrixLoading, setMatrixLoading] = useState(false);

  // Global filters
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSla, setSelectedSla] = useState('ALL');

  // Problem Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load initial root region (e.g. State / Amalapuram Parliament)
  useEffect(() => {
    const initRoot = async () => {
      setLoading(true);
      try {
        const res = await geographyApi.getRootRegions();
        if (res.success && res.data) {
          // Prioritize State level (Andhra Pradesh) so Districts are shown first
          const target = res.data.rootState || res.data.primaryRegions?.[0];
          if (target) {
            setCurrentRegionId(target._id);
          }
        }
      } catch (err) {
        console.error('Error initializing root geography:', err);
      } finally {
        setLoading(false);
      }
    };

    initRoot();
  }, []);

  // Fetch statistics whenever currentRegionId or filters change
  const fetchStatistics = async () => {
    if (!currentRegionId) return;
    setLoading(true);
    try {
      const filters = {};
      if (selectedDept !== 'ALL') filters.departmentId = selectedDept;
      if (selectedCat !== 'ALL') filters.categoryId = selectedCat;
      if (selectedPriority !== 'ALL') filters.priority = selectedPriority;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;
      if (selectedSla !== 'ALL') filters.slaStatus = selectedSla;

      const res = await geographyApi.getRegionStatistics(currentRegionId, filters);
      if (res.success) {
        setStatistics(res.data);
      }
    } catch (err) {
      console.error('Error loading region statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRegionId) {
      fetchStatistics();
    }
  }, [currentRegionId, selectedDept, selectedCat, selectedPriority, selectedStatus, selectedSla]);

  // Load Matrix Data when Matrix tab is active
  const fetchMatrix = async (type) => {
    if (!currentRegionId) return;
    setMatrixLoading(true);
    try {
      const filters = {};
      if (selectedPriority !== 'ALL') filters.priority = selectedPriority;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;

      const res = await geographyApi.getRegionMatrix(currentRegionId, type, filters);
      if (res.success) {
        setMatrixData(res.data);
      }
    } catch (err) {
      console.error('Error loading matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'DEPT_MATRIX') {
      fetchMatrix('DEPARTMENT');
    } else if (activeTab === 'CAT_MATRIX') {
      fetchMatrix('CATEGORY');
    }
  }, [activeTab, currentRegionId, selectedPriority, selectedStatus]);

  const handleNavigateBack = () => {
    if (statistics?.lineage && statistics.lineage.length > 1) {
      const parent = statistics.lineage[statistics.lineage.length - 2];
      if (parent) {
        setCurrentRegionId(parent._id);
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedDept('ALL');
    setSelectedCat('ALL');
    setSelectedPriority('ALL');
    setSelectedStatus('ALL');
    setSelectedSla('ALL');
  };

  const hasActiveFilters =
    selectedDept !== 'ALL' ||
    selectedCat !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedSla !== 'ALL';

  const mapCenter = statistics?.region?.coordinates
    ? [statistics.region.coordinates.lat, statistics.region.coordinates.lng]
    : [16.5787, 82.0061];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Telemetry KPIs */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Hierarchical GIS Problem Intelligence</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              Municipal Area Problem Command Center
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Recursively aggregate complaints across administrative tiers (State ➔ District ➔ Parliament ➔ Assembly Constituency ➔ Mandal / Area) with real-time analytics.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchStatistics}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Top-Level KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Inspected Region</span>
            <span className="text-xl font-extrabold text-white mt-1 block truncate">
              {statistics?.region?.displayName || statistics?.region?.name || 'Loading...'}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Active Problems</span>
            <span className="text-2xl font-black text-white mt-1 block">
              {statistics?.overview?.active ?? 0}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Critical & Overdue</span>
            <span className="text-2xl font-black text-rose-400 mt-1 block">
              {(statistics?.overview?.critical ?? 0) + (statistics?.overview?.overdue ?? 0)}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">SLA Compliance</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {statistics?.overview?.slaComplianceRate ?? 85}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Global Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Interactive Filters:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full lg:w-auto">
            {/* Department */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* SLA Status */}
            <select
              value={selectedSla}
              onChange={(e) => setSelectedSla(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All SLA States</option>
              <option value="ON_TRACK">On Track</option>
              <option value="DUE_SOON">Due Soon</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold underline shrink-0"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Navigation View Switcher (Map View vs Matrices) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('MAP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'MAP'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Drill-Down Map</span>
          </button>

          <button
            onClick={() => setActiveTab('DEPT_MATRIX')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'DEPT_MATRIX'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Department × Area Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('CAT_MATRIX')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'CAT_MATRIX'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Category × Area Matrix</span>
          </button>
        </div>

        <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
          Region: {statistics?.region?.code || 'AP'}
        </span>
      </div>

      {/* 4. MAIN CONTENT VIEW */}
      {activeTab === 'MAP' ? (
        <div className="space-y-4">
          {/* Breadcrumb Navigation Ribbon */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <GeographyBreadcrumb
              lineage={statistics?.lineage || []}
              currentRegion={statistics?.region}
              onSelectRegion={(id) => setCurrentRegionId(id)}
              onNavigateBack={handleNavigateBack}
              isLoading={loading}
            />
          </div>

          {/* Interactive Split View: Map (Left) + Area Intelligence Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Map */}
            <div className="lg:col-span-7 xl:col-span-8">
              <HierarchicalProblemMap
                center={mapCenter}
                zoom={
                  statistics?.region?.type === 'STATE'
                    ? 7.5
                    : statistics?.region?.type === 'DISTRICT'
                    ? 9.5
                    : statistics?.region?.type === 'PARLIAMENT'
                    ? 10.5
                    : statistics?.region?.type === 'ASSEMBLY_CONSTITUENCY'
                    ? 11.5
                    : 13
                }
                childRegions={statistics?.childRegions || []}
                onSelectRegion={(id) => setCurrentRegionId(id)}
                height="h-[680px]"
              />
            </div>

            {/* Right: Area Intelligence Panel */}
            <div className="lg:col-span-5 xl:col-span-4">
              <AreaIntelligencePanel
                statistics={statistics}
                isLoading={loading}
                onSelectChildArea={(id) => setCurrentRegionId(id)}
                onOpenProblemDrawer={() => setDrawerOpen(true)}
                onFilterByDepartment={(deptId) => setSelectedDept(deptId)}
                onFilterByCategory={(catId) => setSelectedCat(catId)}
                activeDeptFilter={selectedDept}
                activeCatFilter={selectedCat}
              />
            </div>
          </div>
        </div>
      ) : (
        /* 5. Cross-Tabulation Matrix Views (Department vs Area OR Category vs Area) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-xs uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {activeTab === 'DEPT_MATRIX' ? 'Department Distribution' : 'Category Distribution'}
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                {activeTab === 'DEPT_MATRIX' ? 'Area Problems by Department' : 'Area Problems by Issue Category'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cross-tabulated problem volume across all child constituencies & mandals in {statistics?.region?.name}. Click any cell to inspect.
              </p>
            </div>
          </div>

          {matrixLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">Computing cross-tabulation matrix...</p>
            </div>
          ) : matrixData && matrixData.rows?.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5 sticky left-0 bg-slate-900 z-10">Administrative Area</th>
                    <th className="p-3.5 text-center">Total Issues</th>
                    {matrixData.columns.map((col) => (
                      <th key={col.id} className="p-3.5 text-center whitespace-nowrap">
                        {col.icon && <span className="mr-1">{col.icon}</span>}
                        <span>{col.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matrixData.rows.map((row) => (
                    <tr key={row.areaId} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold text-slate-900 sticky left-0 bg-white hover:bg-slate-50 z-10 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCurrentRegionId(row.areaId);
                            setActiveTab('MAP');
                          }}
                          className="hover:text-emerald-600 hover:underline flex items-center gap-1.5"
                        >
                          <span>{row.areaName}</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="p-3.5 text-center font-extrabold text-slate-900 bg-slate-50">
                        {row.total}
                      </td>
                      {matrixData.columns.map((col) => {
                        const cellVal = row.counts[col.id] || 0;
                        return (
                          <td
                            key={col.id}
                            onClick={() => {
                              setCurrentRegionId(row.areaId);
                              if (activeTab === 'DEPT_MATRIX') setSelectedDept(col.id);
                              if (activeTab === 'CAT_MATRIX') setSelectedCat(col.id);
                              setDrawerOpen(true);
                            }}
                            className={`p-3.5 text-center font-bold cursor-pointer transition ${
                              cellVal > 10
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : cellVal > 5
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : cellVal > 0
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {cellVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              No sub-areas found for matrix generation at this level.
            </div>
          )}
        </div>
      )}

      {/* Problem Drawer */}
      <AreaProblemDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        regionId={currentRegionId}
        regionName={statistics?.region?.displayName || statistics?.region?.name || 'Selected Region'}
        departments={departments}
        categories={categories}
      />
    </div>
  );
};

export default AreaIntelligenceView;
