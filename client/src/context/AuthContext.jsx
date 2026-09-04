import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('civicai_user');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('civicai_token') || null);
  const [rankProgression, setRankProgression] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await authApi.getMe();
      if (data.success) {
        setUser(data.user);
        setRankProgression(data.rankProgression);
        localStorage.setItem('civicai_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.warn('Session check failed:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUser();
      return res.user;
    }
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success) {
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUser();
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('civicai_token');
    localStorage.removeItem('civicai_user');
    setToken(null);
    setUser(null);
    setRankProgression(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user?.role || null,
        rankProgression,
        loading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
