import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  LogIn,
  Key,
  Mail,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Building2,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activePortal, setActivePortal] = useState('CITIZEN'); // 'CITIZEN' | 'OFFICER' | 'ADMIN'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if redirected from registration
  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
      if (location.state.registeredRole) {
        setActivePortal(location.state.registeredRole);
      }
    }
    if (location.state?.successMessage) {
      setSuccessMsg(location.state.successMessage);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);

      // Verify portal compatibility
      if (activePortal === 'OFFICER' && user.role !== 'OFFICER' && user.role !== 'ADMIN') {
        setError('This account does not have Municipal Officer privileges. Please switch to Citizen login.');
        setLoading(false);
        return;
      }
      if (activePortal === 'ADMIN' && user.role !== 'ADMIN') {
        setError('This account does not have Administrator privileges. Please switch to Officer or Citizen login.');
        setLoading(false);
        return;
      }

      if (user.role === 'OFFICER') {
        navigate('/officer/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/settings');
      } else {
        navigate('/citizen/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillSample = (sampleEmail, samplePass) => {
    setEmail(sampleEmail);
    setPassword(samplePass);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign in to CivicAI</h2>
          <p className="text-xs text-slate-500">
            Enter your credentials to authenticate and access your portal
          </p>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActivePortal('CITIZEN');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'CITIZEN'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Citizen
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('OFFICER');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'OFFICER'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Officer
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePortal('ADMIN');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activePortal === 'ADMIN'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Success Alert (e.g. from signup) */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {activePortal === 'OFFICER'
                  ? 'Officer Government Email'
                  : activePortal === 'ADMIN'
                  ? 'Administrator Email'
                  : 'Citizen Email Address'}
              </label>
              {/* Quick Fill Helper */}
              {activePortal === 'CITIZEN' && (
                <button
                  type="button"
                  onClick={() => handleFillSample('citizen@civicai.org', 'Citizen123!')}
                  className="text-[11px] text-emerald-600 hover:underline font-semibold"
                >
                  Use Demo: citizen@civicai.org
                </button>
              )}
              {activePortal === 'OFFICER' && (
                <button
                  type="button"
                  onClick={() => handleFillSample('officer@civicai.org', 'Officer123!')}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Use Demo: officer@civicai.org
                </button>
              )}
              {activePortal === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleFillSample('admin@civicai.org', 'Admin123!')}
                  className="text-[11px] text-purple-600 hover:underline font-semibold"
                >
                  Use Demo: admin@civicai.org
                </button>
              )}
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  activePortal === 'OFFICER'
                    ? 'officer@civicai.org'
                    : activePortal === 'ADMIN'
                    ? 'admin@civicai.org'
                    : 'citizen@civicai.org'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              activePortal === 'OFFICER'
                ? 'bg-blue-600 hover:bg-blue-700'
                : activePortal === 'ADMIN'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              'Authenticating Credentials...'
            ) : (
              <>
                <span>
                  Log In to {activePortal === 'OFFICER' ? 'Officer Portal' : activePortal === 'ADMIN' ? 'Admin Portal' : 'Citizen Dashboard'}
                </span>
                <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Reference Box */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
            🔑 Pre-configured Test Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
            <div
              onClick={() => {
                setActivePortal('CITIZEN');
                handleFillSample('citizen@civicai.org', 'Citizen123!');
              }}
              className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-emerald-400"
            >
              <p className="font-bold text-emerald-700">Citizen</p>
              <p className="text-[10px] text-slate-400">Citizen123!</p>
            </div>
            <div
              onClick={() => {
                setActivePortal('OFFICER');
                handleFillSample('officer@civicai.org', 'Officer123!');
              }}
              className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-blue-400"
            >
              <p className="font-bold text-blue-700">Officer</p>
              <p className="text-[10px] text-slate-400">Officer123!</p>
            </div>
            <div
              onClick={() => {
                setActivePortal('ADMIN');
                handleFillSample('admin@civicai.org', 'Admin123!');
              }}
              className="p-1.5 rounded-lg bg-white border border-slate-200 cursor-pointer hover:border-purple-400"
            >
              <p className="font-bold text-purple-700">Admin</p>
              <p className="text-[10px] text-slate-400">Admin123!</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-1">
          <p className="text-xs text-slate-500">
            Need a new account?{' '}
            <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
