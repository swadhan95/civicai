import api from './client';

export const escalationApi = {
  // Citizen raises escalation for overdue complaint
  escalateComplaint: async (complaintId, data) => {
    const res = await api.post(`/complaints/${complaintId}/escalate`, data);
    return res.data;
  },

  // Officer / Admin extends SLA deadline with recorded reason
  extendSla: async (complaintId, data) => {
    const res = await api.post(`/complaints/${complaintId}/extend-sla`, data);
    return res.data;
  },

  // Officer records field delay reason
  recordDelayReason: async (complaintId, data) => {
    const res = await api.post(`/complaints/${complaintId}/delay-reason`, data);
    return res.data;
  },

  // Get all escalations (filtered)
  getEscalations: async (params = {}) => {
    const res = await api.get('/escalations', { params });
    return res.data;
  },

  // Get single escalation details
  getEscalationById: async (id) => {
    const res = await api.get(`/escalations/${id}`);
    return res.data;
  },

  // Update escalation status & administrative action
  updateEscalationStatus: async (id, data) => {
    const res = await api.patch(`/escalations/${id}/status`, data);
    return res.data;
  },

  // Get aggregated SLA metrics for analytics
  getSlaMetrics: async () => {
    const res = await api.get('/escalations/metrics');
    return res.data;
  }
};
