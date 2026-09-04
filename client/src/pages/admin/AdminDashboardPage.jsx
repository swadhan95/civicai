import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { complaintApi } from '../../api/complaintApi';
import MasterMonitoringView from '../../components/admin/MasterMonitoringView';
import AnalyticsView from '../../components/admin/AnalyticsView';
import AreaManagementView from '../../components/admin/AreaManagementView';
import AreaIntelligenceView from '../../components/admin/AreaIntelligenceView';
import OfficerManagementView from '../../components/admin/OfficerManagementView';
import DepartmentManagementView from '../../components/admin/DepartmentManagementView';
import UserManagementView from '../../components/admin/UserManagementView';
import EscalationManagementView from '../../components/admin/EscalationManagementView';
import {
  Activity,
  BarChart3,
  MapPin,
  Users,
  Building2,
  ShieldCheck,
  Sliders,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Flame,
  SlidersHorizontal,
  FolderOpen,
  Sparkles,
  Layers,
  ArrowUpRight,
  Radio
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'monitoring';

  // Common metadata for filters
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const loadMetadata = async () => {
    setMetaLoading(true);
    try {
      const [deptRes, catRes, areaRes, offRes] = await Promise.all([
        complaintApi.getDepartments(),
        complaintApi.getCategories(),
        adminApi.getAreas(),
        adminApi.getOfficersManagement()
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (areaRes.success) setAreas(areaRes.data);
      if (offRes.success) setOfficers(offRes.data);
    } catch (err) {
      console.error('Failed to load admin metadata:', err);
    } finally {
      setMetaLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  const handleModuleChange = (modKey) => {
    setSearchParams({ tab: modKey });
  };

  const navModules = [
    {
      key: 'monitoring',
      label: 'Master Monitoring',
      sublabel: 'Command Center & Live Map',
      icon: Activity,
      badge: 'Live'
    },
    {
      key: 'escalations',
      label: 'Escalation Center',
      sublabel: 'Citizen SLA Escalations',
      icon: Flame,
      badge: 'SLA'
    },
    {
      key: 'analytics',
      label: 'Visual Analytics',
      sublabel: 'Weekly SLA & Charts',
      icon: BarChart3,
      badge: 'Charts'
    },
    {
      key: 'areas',
      label: 'Area Intelligence',
      sublabel: 'Hierarchical GIS & Matrices',
      icon: MapPin,
      badge: 'GIS'
    },
    {
      key: 'officers',
      label: 'Officer Management',
      sublabel: 'Workloads & Field Dispatch',
      icon: Users,
      badge: 'Field Units'
    },
    {
      key: 'departments',
      label: 'Department Dashboards',
      sublabel: 'Backlog & Repaired Feeds',
      icon: Building2,
      badge: `${departments.length} Units`
    },
    {
      key: 'users',
      label: 'User Management',
      sublabel: 'RBAC Roles & Governance',
      icon: ShieldCheck,
      badge: 'Governance'
    }
  ];

  const currentModuleObj = navModules.find((m) => m.key === currentTab) || navModules[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Command Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
                CivicAI Municipal Operations Center
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {currentModuleObj.label}
            </h1>
            <p className="text-xs text-slate-400">
              {currentModuleObj.sublabel} • Real-time database telemetry, SLA timeline and field accountability
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={loadMetadata}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Refresh Metadata"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${metaLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/admin/settings"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Security & Settings</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Command Center Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className="lg:col-span-3 space-y-2">
            <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-2 pb-1 block">
                Command Modules
              </span>
              {navModules.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleModuleChange(item.key)}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : item.key === 'escalations'
                            ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-200'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{item.label}</p>
                        <p
                          className={`text-[10px] leading-tight truncate max-w-[130px] ${
                            isActive ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.key === 'escalations'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/admin/settings"
                  className="w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between text-slate-700 hover:bg-slate-50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">Security & Settings</p>
                      <p className="text-[10px] text-slate-400 leading-tight">Password & Rules</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </aside>

          {/* MAIN OPERATIONAL VIEW */}
          <main className="lg:col-span-9 space-y-6">
            {/* 1. Master Monitoring */}
            {currentTab === 'monitoring' && (
              <MasterMonitoringView
                departments={departments}
                categories={categories}
                areas={areas}
              />
            )}

            {/* 2. Escalation Management */}
            {currentTab === 'escalations' && (
              <EscalationManagementView
                departments={departments}
                officers={officers}
              />
            )}

            {/* 3. Visual Analytics */}
            {currentTab === 'analytics' && (
              <AnalyticsView
                departments={departments}
                categories={categories}
                areas={areas}
              />
            )}

            {/* 4. Area Intelligence & Hierarchical GIS */}
            {currentTab === 'areas' && (
              <AreaIntelligenceView
                departments={departments}
                categories={categories}
              />
            )}

            {/* 5. Officer Management */}
            {currentTab === 'officers' && (
              <OfficerManagementView
                departments={departments}
                areas={areas}
                onDataChange={loadMetadata}
              />
            )}

            {/* 6. Department Management */}
            {currentTab === 'departments' && (
              <DepartmentManagementView
                onDataChange={loadMetadata}
              />
            )}

            {/* 7. User Management */}
            {currentTab === 'users' && (
              <UserManagementView
                departments={departments}
                onDataChange={loadMetadata}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
