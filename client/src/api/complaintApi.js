import api from './client';

export const complaintApi = {
  createComplaint: async (formData) => {
    const res = await api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getComplaints: async (params = {}) => {
    const res = await api.get('/complaints', { params });
    return res.data;
  },

  getComplaintById: async (id) => {
    const res = await api.get(`/complaints/${id}`);
    return res.data;
  },

  getNearbyComplaints: async (lat, lon, categoryId) => {
    const res = await api.get('/complaints/nearby', {
      params: { lat, lon, categoryId }
    });
    return res.data;
  },

  updateStatus: async (id, payload) => {
    const res = await api.patch(`/complaints/${id}/status`, payload);
    return res.data;
  },

  resolveComplaint: async (id, formData) => {
    const res = await api.post(`/complaints/${id}/resolve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  addNote: async (id, note) => {
    const res = await api.post(`/complaints/${id}/notes`, { note });
    return res.data;
  },

  analyzeImage: async (formData) => {
    const res = await api.post('/ai/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getAIStatus: async () => {
    const res = await api.get('/ai/status');
    return res.data;
  },

  setAIApiKey: async (apiKey) => {
    const res = await api.post('/ai/set-key', { apiKey });
    return res.data;
  },

  verifyResolutionAI: async (formData) => {
    const res = await api.post('/ai/verify-resolution', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },

  getDepartments: async () => {
    const res = await api.get('/departments');
    return res.data;
  }
};
