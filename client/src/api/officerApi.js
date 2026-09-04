import api from './client';

export const officerApi = {
  getStats: async () => {
    const res = await api.get('/officer/stats');
    return res.data;
  }
};
