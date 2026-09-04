import api from './client';

export const adminApi = {
  // 1. Master Monitoring
  getMasterMonitoring: async (params = {}) => {
    const res = await api.get('/admin/master-monitoring', { params });
    return res.data;
  },

  // 2. Analytics
  getAnalytics: async (params = {}) => {
    const res = await api.get('/admin/analytics', { params });
    return res.data;
  },

  // 3. Area Management
  getAreas: async () => {
    const res = await api.get('/admin/areas');
    return res.data;
  },
  createArea: async (data) => {
    const res = await api.post('/admin/areas', data);
    return res.data;
  },
  updateArea: async (id, data) => {
    const res = await api.put(`/admin/areas/${id}`, data);
    return res.data;
  },
  deleteArea: async (id) => {
    const res = await api.delete(`/admin/areas/${id}`);
    return res.data;
  },

  // 4. Officer Management
  getOfficersManagement: async () => {
    const res = await api.get('/admin/officers-management');
    return res.data;
  },
  updateOfficerDetails: async (id, data) => {
    const res = await api.put(`/admin/officers/${id}`, data);
    return res.data;
  },
  reassignComplaint: async (data) => {
    const res = await api.post('/admin/reassign-complaint', data);
    return res.data;
  },

  // 5. Department Management
  getDepartmentsManagement: async () => {
    const res = await api.get('/admin/departments-management');
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await api.post('/admin/departments', data);
    return res.data;
  },
  updateDepartment: async (id, data) => {
    const res = await api.put(`/admin/departments/${id}`, data);
    return res.data;
  },
  deleteDepartment: async (id) => {
    const res = await api.delete(`/admin/departments/${id}`);
    return res.data;
  },

  // 6. User Management
  getUsersManagement: async (params = {}) => {
    const res = await api.get('/admin/users-management', { params });
    return res.data;
  },
  toggleUserStatus: async (id, isActive) => {
    const res = await api.put(`/admin/users/${id}/status`, { isActive });
    return res.data;
  },
  updateUserRole: async (id, data) => {
    const res = await api.put(`/admin/users/${id}/role`, data);
    return res.data;
  },

  // Legacy & Settings
  getOverview: async () => {
    const res = await api.get('/admin/overview');
    return res.data;
  },
  getDepartmentDashboards: async () => {
    const res = await api.get('/admin/departments-dashboard');
    return res.data;
  },
  getUsers: async (params = {}) => {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },
  createOfficer: async (data) => {
    const res = await api.post('/admin/officers', data);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await api.patch(`/admin/users/${id}`, data);
    return res.data;
  },
  getSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data;
  },
  updateSettings: async (settings) => {
    const res = await api.put('/admin/settings', settings);
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/admin/audit-points');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  }
};
