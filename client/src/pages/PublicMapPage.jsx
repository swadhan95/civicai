import React, { useState, useEffect } from 'react';
import { geographyApi } from '../api/geographyApi';
import GeographyBreadcrumb from '../components/map/GeographyBreadcrumb';
import HierarchicalProblemMap from '../components/map/HierarchicalProblemMap';
import AreaIntelligencePanel from '../components/map/AreaIntelligencePanel';
import AreaProblemDrawer from '../components/map/AreaProblemDrawer';
import { MapPin, Filter, Layers, RefreshCw, Loader2, Sparkles, Building2 } from 'lucide-react';
import { complaintApi } from '../api/complaintApi';

const PublicMapPage = () => {
  const [currentRegionId, setCurrentRegionId] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filters
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Problem Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Initialize root geography and metadata
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [geoRes, deptRes, catRes] = await Promise.all([
          geographyApi.getRootRegions(),
          complaintApi.getDepartments(),
          complaintApi.getCategories()
        ]);

        if (geoRes.success && geoRes.data) {
          const target = geoRes.data.rootState || geoRes.data.primaryRegions?.[0];
          if (target) {
            setCurrentRegionId(target._id);
          }
        }
        if (deptRes.success) setDepartments(deptRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        console.error('Error initializing map page:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Fetch statistics on region or filter change
  const fetchStats = async () => {
    if (!currentRegionId) return;
    setLoading(true);
    try {
      const filters = {};
      if (selectedDept !== 'ALL') filters.departmentId = selectedDept;
      if (selectedCat !== 'ALL') filters.categoryId = selectedCat;
      if (selectedPriority !== 'ALL') filters.priority = selectedPriority;
      if (selectedStatus !== 'ALL') filters.status = selectedStatus;

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
      fetchStats();
    }
  }, [currentRegionId, selectedDept, selectedCat, selectedPriority, selectedStatus]);

  const handleNavigateBack = () => {
    if (statistics?.lineage && statistics.lineage.length > 1) {
      const parent = statistics.lineage[statistics.lineage.length - 2];
      if (parent) {
        setCurrentRegionId(parent._id);
      }
    }
  };

  const mapCenter = statistics?.region?.coordinates
    ? [statistics.region.coordinates.lat, statistics.region.coordinates.lng]
    : [16.5787, 82.0061];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                CivicAI Spatial Intelligence
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Live Geographic Problem Intelligence
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
            Hierarchical municipal telemetry. Drill down through State, District, Parliament, Constituency, and Mandal to inspect real-time civic issues.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-xs self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Map</span>
        </button>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <GeographyBreadcrumb
          lineage={statistics?.lineage || []}
          currentRegion={statistics?.region}
          onSelectRegion={(id) => setCurrentRegionId(id)}
          onNavigateBack={handleNavigateBack}
          isLoading={loading}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 mr-2">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        {(selectedDept !== 'ALL' || selectedCat !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedDept('ALL');
              setSelectedCat('ALL');
              setSelectedPriority('ALL');
              setSelectedStatus('ALL');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Grid: Map (Left) + Area Intelligence Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

export default PublicMapPage;
