import api from './client';

export const leaderboardApi = {
  getLeaderboard: async (params = {}) => {
    const res = await api.get('/leaderboard', { params });
    return res.data;
  }
};
