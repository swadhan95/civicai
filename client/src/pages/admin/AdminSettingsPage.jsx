import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { complaintApi } from '../../api/complaintApi';
import { authApi } from '../../api/authApi';
import {
  Sliders,
  Trophy,
  Users,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  History,
  UserPlus,
  Mail,
  Key,
  User,
  Plus,
  Lock,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('security'); // Default to Security & Password Management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Settings State
  const [pointRules, setPointRules] = useState({
    VALID_ISSUE_ACCEPTED: 20,
    OFFICER_CONFIRMED: 30,
    RESOLVED: 40,
    UNIQUE_BONUS: 20,
    COMMUNITY_CONFIRMED: 10,
    DUPLICATE_REPORT: 0,
    REJECTED_SPAM: -20
  });

  const [rankTiers, setRankTiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Change Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // New Officer Provisioning Modal
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    city: 'Metropolis'
  });
  const [provisioningLoading, setProvisioningLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsRes = await adminApi.getSettings();
      if (settingsRes.success) {
        setPointRules(settingsRes.data.pointRules);
        setRankTiers(settingsRes.data.rankTiers || []);
      }

      const usersRes = await adminApi.getUsers();
      if (usersRes.success) {
        setUsers(usersRes.data);
      }

      const deptsRes = await complaintApi.getDepartments();
      if (deptsRes.success) {
        setDepartments(deptsRes.data);
        if (deptsRes.data.length > 0 && !newOfficer.departmentId) {
          setNewOfficer((prev) => ({ ...prev, departmentId: deptsRes.data[0]._id }));
        }
      }

      const auditRes = await adminApi.getAuditLogs();
      if (auditRes.success) {
        setAuditLogs(auditRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await adminApi.updateSettings({ pointRules, rankTiers });
      if (res.success) {
        setSuccessMsg('System configuration and rank progression updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle Admin Password Change with Strict Integrity Validation
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordSaving(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and Confirmation password do not match.');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });

      if (res.success) {
        setPasswordSuccess(res.message || 'Admin password updated and synchronized permanently!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleProvisionOfficer = async (e) => {
    e.preventDefault();
    setProvisioningLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await adminApi.createOfficer(newOfficer);
      if (res.success) {
        setSuccessMsg(res.message || 'Officer provisioned successfully!');
        setShowOfficerModal(false);
        setNewOfficer({ name: '', email: '', password: '', departmentId: departments[0]?._id || '', city: 'Metropolis' });
        loadData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to provision officer');
    } finally {
      setProvisioningLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, role, departmentId = null) => {
    try {
      const res = await adminApi.updateUser(userId, { role, departmentId });
      if (res.success) {
        loadData();
        setSuccessMsg('User role & department updated.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to update user role');
    }
  };

  // Password validation score
  const passwordLengthOk = passwordForm.newPassword.length >= 6;
  const passwordsMatch = passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Administrative & Governance Portal
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            System configuration, officer provisioning, credential security & points ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
            <ShieldCheck className="w-4 h-4" />
            Admin Authority Level
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Admin Security & Password
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Personnel & Officers ({users.filter((u) => u.role === 'OFFICER').length} Officers)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'points'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Dynamic Point Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ranks')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ranks'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Rank Tier Thresholds
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Points Audit Ledger
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* TAB 1: ADMIN SECURITY & PASSWORD MANAGEMENT */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Form: Change Password Form (2 cols) */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Key className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Change Administrator Password
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Update your master administrative credentials. Changes are cryptographically hashed and mirrored to disk immediately.
                  </p>
                </div>

                {passwordSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Admin Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        placeholder="Enter current password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Admin Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        placeholder="Enter strong new password (min 6 chars)"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirm New Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                        placeholder="Re-enter new password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Integrity Checklist */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Security & Integrity Requirements:
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          passwordLengthOk ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        ✓
                      </div>
                      <span className={passwordLengthOk ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                        Minimum 6 characters long
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        ✓
                      </div>
                      <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                        Passwords match exactly
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordSaving || !passwordLengthOk || !passwordsMatch}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {passwordSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Encrypting & Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Update Admin Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Card: Account Security Overview */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Master Admin Account
                  </span>
                  <h4 className="text-xl font-extrabold">Security Architecture</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Administrator accounts control all department routing, officer allocations, and contribution scoring across the entire municipality.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Admin Email</span>
                    <p className="font-mono font-bold text-emerald-400">admin@civicai.org</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Encryption Standard</span>
                    <p className="font-bold text-slate-200">BCrypt Salt-Rounds 10 (OWASP Compliant)</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Persistence Mirror</span>
                    <p className="font-bold text-slate-200">Auto-Synced to Persistent Disk Storage</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 leading-relaxed">
                  💡 <strong>Security Tip:</strong> Use a combination of uppercase letters, numbers, and symbols to ensure maximum governance protection.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONNEL & OFFICER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Municipal Personnel & Access Management
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Securely onboard and provision new municipal officers into specific departments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOfficerModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  + Onboard New Officer
                </button>
              </div>

              {/* Users & Officers Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Assigned Department</th>
                        <th className="py-3 px-4">Points</th>
                        <th className="py-3 px-4 text-right">Role Governance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.role === 'OFFICER' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                                🛡️ Officer
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'OFFICER'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {u.department ? u.department.name : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-amber-600">{u.points}</td>
                          <td className="py-3.5 px-4 text-right">
                            {u.role === 'CITIZEN' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleUpdateUserRole(u._id, 'OFFICER', e.target.value);
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg border border-slate-200 text-[11px] bg-white outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>
                                    Promote to Officer Dept...
                                  </option>
                                  {departments.map((d) => (
                                    <option key={d._id} value={d._id}>
                                      {d.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {u.role === 'OFFICER' && (
                              <span className="text-[10px] font-semibold text-blue-600">
                                Assigned Officer
                              </span>
                            )}
                            {u.role === 'ADMIN' && (
                              <span className="text-[10px] font-semibold text-purple-600">
                                Super Admin
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC POINT RULES */}
          {activeTab === 'points' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
            >
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Dynamic Points & Reputation Rules
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust points awarded to citizens for various quality actions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valid Issue Accepted (+ pts)
                  </label>
                  <input
                    type="number"
                    value={pointRules.VALID_ISSUE_ACCEPTED}
                    onChange={(e) =>
                      setPointRules({
                        ...pointRules,
                        VALID_ISSUE_ACCEPTED: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Officer Verification (+ pts)
                  </label>
                  <input
                    type="number"
                    value={pointRules.OFFICER_CONFIRMED}
                    onChange={(e) =>
                      setPointRules({
                        ...pointRules,
                        OFFICER_CONFIRMED: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Resolved (+ pts)
                  </label>
                  <input
                    type="number"
                    value={pointRules.RESOLVED}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, RESOLVED: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unique Discovery Bonus (+ pts)
                  </label>
                  <input
                    type="number"
                    value={pointRules.UNIQUE_BONUS}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, UNIQUE_BONUS: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Community Corroboration (+ pts)
                  </label>
                  <input
                    type="number"
                    value={pointRules.COMMUNITY_CONFIRMED}
                    onChange={(e) =>
                      setPointRules({
                        ...pointRules,
                        COMMUNITY_CONFIRMED: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Spam/Fake Penalty (- pts)
                  </label>
                  <input
                    type="number"
                    value={pointRules.REJECTED_SPAM}
                    onChange={(e) =>
                      setPointRules({ ...pointRules, REJECTED_SPAM: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Point Rules
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: RANK TIER THRESHOLDS */}
          {activeTab === 'ranks' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
            >
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Citizen Contributor Rank Thresholds
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure badges and points required to promote citizens through recognition tiers.
                </p>
              </div>

              <div className="space-y-4">
                {rankTiers.map((tier, idx) => (
                  <div
                    key={tier.code}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tier.badge}</span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{tier.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">Code: {tier.code}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-slate-600">Points Target:</label>
                      <input
                        type="number"
                        value={tier.minPoints}
                        onChange={(e) => {
                          const updated = [...rankTiers];
                          updated[idx].minPoints = parseInt(e.target.value) || 0;
                          setRankTiers(updated);
                        }}
                        className="w-28 p-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Rank Thresholds
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: POINTS AUDIT LEDGER */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Municipal Points Audit Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete immutable ledger of all points awarded and deducted across the platform.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Citizen</th>
                      <th className="py-3 px-4">Action Type</th>
                      <th className="py-3 px-4">Points</th>
                      <th className="py-3 px-4">Balance After</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {log.citizen?.name || 'Citizen'}
                        </td>
                        <td className="py-3.5 px-4">{log.actionType}</td>
                        <td
                          className={`py-3.5 px-4 font-bold ${
                            log.points >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {log.points >= 0 ? `+${log.points}` : log.points} pts
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{log.balanceAfter}</td>
                        <td className="py-3.5 px-4 text-slate-500">{log.description}</td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* PROVISION OFFICER MODAL */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Onboard Municipal Officer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOfficerModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleProvisionOfficer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  placeholder="e.g. Officer Vikram Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                  placeholder="officer.roads@civicai.gov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Assignment
                </label>
                <select
                  required
                  value={newOfficer.departmentId}
                  onChange={(e) => setNewOfficer({ ...newOfficer, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={newOfficer.password}
                  onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfficerModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={provisioningLoading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {provisioningLoading ? 'Provisioning...' : 'Provision Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
