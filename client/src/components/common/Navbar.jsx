import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  ShieldAlert,
  MapPin,
  Trophy,
  PlusCircle,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  Sliders,
  Activity,
  BarChart3,
  Users,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  AlertTriangle
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const currentRole = user?.role;
  const currentTab = searchParams.get('tab') || 'monitoring';

  // Active check helper
  const isNavActive = (path, tab) => {
    if (path === '/admin/dashboard') {
      if (location.pathname === '/admin/dashboard') {
        return (searchParams.get('tab') || 'monitoring') === tab;
      }
      return false;
    }
    if (path === '/admin/settings') {
      return location.pathname === '/admin/settings';
    }
    return location.pathname === path;
  };

  // ADMIN Navigation Items
  const adminNavItems = [
    { label: 'Command Center', icon: Activity, path: '/admin/dashboard', tab: 'monitoring' },
    { label: 'Escalations', icon: Flame, path: '/admin/dashboard', tab: 'escalations' },
    { label: 'Analytics', icon: BarChart3, path: '/admin/dashboard', tab: 'analytics' },
    { label: 'Areas', icon: MapPin, path: '/admin/dashboard', tab: 'areas' },
    { label: 'Officers', icon: Users, path: '/admin/dashboard', tab: 'officers' },
    { label: 'Departments', icon: Building2, path: '/admin/dashboard', tab: 'departments' },
    { label: 'Users', icon: ShieldCheck, path: '/admin/dashboard', tab: 'users' },
    { label: 'Security', icon: Sliders, path: '/admin/settings', tab: 'security' }
  ];

  // OFFICER Navigation Items
  const officerNavItems = [
    { label: 'Incident Queue', icon: Building2, path: '/officer/dashboard' },
    { label: 'Live City Map', icon: MapPin, path: '/map' }
  ];

  // CITIZEN Navigation Items
  const citizenNavItems = [
    { label: 'Overview', path: '/' },
    { label: 'Report Issue', path: '/report' },
    { label: 'My Reports', path: '/citizen/complaints' },
    { label: 'My Impact', path: '/citizen/dashboard' },
    { label: 'Live City Map', path: '/map' },
    { label: 'Contributors', path: '/leaderboard' }
  ];

  // Unauthenticated Public Navigation Items
  const publicNavItems = [
    { label: 'Overview', path: '/' },
    { label: 'Live City Map', path: '/map' },
    { label: 'Contributors', path: '/leaderboard' }
  ];

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur border-b transition-colors ${
        currentRole === 'ADMIN'
          ? 'bg-slate-900 text-white border-slate-800 shadow-md'
          : currentRole === 'OFFICER'
          ? 'bg-slate-900 text-white border-slate-800 shadow-md'
          : 'bg-white/95 text-slate-900 border-slate-200 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO & ROLE BRANDING */}
          <div className="flex items-center gap-6">
            <Link
              to={
                currentRole === 'ADMIN'
                  ? '/admin/dashboard'
                  : currentRole === 'OFFICER'
                  ? '/officer/dashboard'
                  : '/'
              }
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-transform group-hover:scale-105 ${
                  currentRole === 'ADMIN'
                    ? 'bg-indigo-600 shadow-indigo-600/30'
                    : currentRole === 'OFFICER'
                    ? 'bg-blue-600 shadow-blue-600/30'
                    : 'bg-emerald-600 shadow-emerald-600/30'
                }`}
              >
                {currentRole === 'ADMIN' ? (
                  <Activity className="w-5 h-5" />
                ) : currentRole === 'OFFICER' ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>

              <div>
                <span
                  className={`text-lg font-extrabold tracking-tight flex items-center gap-1 leading-none ${
                    currentRole === 'ADMIN' || currentRole === 'OFFICER' ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Civic
                  <span
                    className={
                      currentRole === 'ADMIN'
                        ? 'text-indigo-400'
                        : currentRole === 'OFFICER'
                        ? 'text-blue-400'
                        : 'text-emerald-600'
                    }
                  >
                    AI
                  </span>
                </span>
                <span
                  className={`hidden sm:block text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
                    currentRole === 'ADMIN'
                      ? 'text-indigo-300 font-mono'
                      : currentRole === 'OFFICER'
                      ? 'text-blue-300 font-mono'
                      : 'text-slate-400'
                  }`}
                >
                  {currentRole === 'ADMIN'
                    ? 'MUNICIPAL COMMAND CENTER'
                    : currentRole === 'OFFICER'
                    ? 'MUNICIPAL OPERATIONS PORTAL'
                    : 'PUBLIC INFRASTRUCTURE HUB'}
                </span>
              </div>
            </Link>

            {/* DESKTOP ROLE-BASED NAVIGATION */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* 1. ADMIN EXCLUSIVE NAVIGATION */}
              {isAuthenticated && currentRole === 'ADMIN' && (
                <>
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(item.path, item.tab);
                    const linkTarget = item.tab ? `${item.path}?tab=${item.tab}` : item.path;

                    return (
                      <Link
                        key={item.label}
                        to={linkTarget}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* 2. OFFICER EXCLUSIVE NAVIGATION */}
              {isAuthenticated && currentRole === 'OFFICER' && (
                <>
                  {officerNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;

                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          active
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* 3. CITIZEN EXCLUSIVE NAVIGATION */}
              {isAuthenticated && currentRole === 'CITIZEN' && (
                <>
                  {citizenNavItems.map((item) => {
                    const active = location.pathname === item.path;

                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}

              {/* 4. UNAUTHENTICATED PUBLIC NAVIGATION */}
              {!isAuthenticated && (
                <>
                  {publicNavItems.map((item) => {
                    const active = location.pathname === item.path;

                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>

          {/* RIGHT HEADER ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Primary Action: Report Issue Button (Citizens & Public Only) */}
            {(!isAuthenticated || currentRole === 'CITIZEN') && (
              <Link
                to="/report"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all hover:shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Report Issue
              </Link>
            )}

            {/* Notifications Bell (Only when logged in) */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserDropdownOpen(false);
                  }}
                  className={`p-2 rounded-xl relative transition-colors focus:outline-none ${
                    currentRole === 'ADMIN' || currentRole === 'OFFICER'
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popup */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 fade-in">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((item) => (
                          <div
                            key={item._id}
                            onClick={() => markAsRead(item._id)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                              !item.isRead ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <div className="mt-0.5">
                              {item.type === 'POINTS_EARNED' ? (
                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                                  🏆
                                </div>
                              ) : item.type === 'RANK_UP' ? (
                                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                                  ⭐
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(item.createdAt).toLocaleDateString()} at{' '}
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Account / Role Pill / Auth Actions */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationsOpen(false);
                  }}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-colors focus:outline-none ${
                    currentRole === 'ADMIN'
                      ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-750'
                      : currentRole === 'OFFICER'
                      ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-750'
                      : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg font-extrabold flex items-center justify-center text-xs text-white ${
                      currentRole === 'ADMIN'
                        ? 'bg-indigo-600'
                        : currentRole === 'OFFICER'
                        ? 'bg-blue-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold leading-tight truncate max-w-[120px]">
                      {user?.displayName || user?.name}
                    </p>
                    <span
                      className={`text-[10px] font-extrabold uppercase block leading-tight ${
                        currentRole === 'ADMIN'
                          ? 'text-indigo-400 font-mono'
                          : currentRole === 'OFFICER'
                          ? 'text-blue-400 font-mono'
                          : 'text-emerald-600'
                      }`}
                    >
                      {currentRole === 'ADMIN'
                        ? 'Administrator'
                        : currentRole === 'OFFICER'
                        ? 'Field Officer'
                        : `${user?.points || 0} pts • ${user?.rank?.name || 'Citizen'}`}
                    </span>
                  </div>
                </button>

                {/* Profile dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          currentRole === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-800'
                            : currentRole === 'OFFICER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {currentRole}
                      </span>
                    </div>

                    <div className="py-1 text-xs font-semibold">
                      {/* ADMIN Shortcuts */}
                      {currentRole === 'ADMIN' && (
                        <>
                          <Link
                            to="/admin/dashboard?tab=monitoring"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Activity className="w-3.5 h-3.5 text-indigo-600" />
                            Command Center
                          </Link>
                          <Link
                            to="/admin/settings"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Sliders className="w-3.5 h-3.5 text-purple-600" />
                            Security & Settings
                          </Link>
                        </>
                      )}

                      {/* OFFICER Shortcuts */}
                      {currentRole === 'OFFICER' && (
                        <Link
                          to="/officer/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                        >
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          Officer Incident Queue
                        </Link>
                      )}

                      {/* CITIZEN Shortcuts */}
                      {currentRole === 'CITIZEN' && (
                        <>
                          <Link
                            to="/citizen/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            Impact & Rank ({user?.points || 0} pts)
                          </Link>
                          <Link
                            to="/citizen/complaints"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            My Reports History
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl ${
                currentRole === 'ADMIN' || currentRole === 'OFFICER'
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t px-4 py-4 space-y-1.5 ${
            currentRole === 'ADMIN' || currentRole === 'OFFICER'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Admin Mobile Links */}
          {isAuthenticated && currentRole === 'ADMIN' && (
            <>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const linkTarget = item.tab ? `${item.path}?tab=${item.tab}` : item.path;
                return (
                  <Link
                    key={item.label}
                    to={linkTarget}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          {/* Officer Mobile Links */}
          {isAuthenticated && currentRole === 'OFFICER' && (
            <>
              {officerNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}

          {/* Citizen Mobile Links */}
          {isAuthenticated && currentRole === 'CITIZEN' && (
            <>
              {citizenNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </>
          )}

          {/* Public Mobile Links */}
          {!isAuthenticated && (
            <>
              {publicNavItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center rounded-xl border border-slate-300 font-bold text-xs text-slate-700"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 text-center rounded-xl bg-slate-900 font-bold text-xs text-white"
                >
                  Sign Up
                </Link>
              </div>
            </>
          )}

          {isAuthenticated && (
            <div className="pt-2 border-t border-slate-800/20">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
