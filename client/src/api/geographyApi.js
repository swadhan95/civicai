import api from './client';

export const geographyApi = {
  // Get root geographic regions (State & Primary Parliaments/Districts)
  getRootRegions: async () => {
    const res = await api.get('/geography/root');
    return res.data;
  },

  // Get single region metadata with breadcrumb lineage
  getRegionById: async (id) => {
    const res = await api.get(`/geography/${id}`);
    return res.data;
  },

  // Get child regions with problem counts and alert levels
  getChildRegions: async (id, filters = {}) => {
    const res = await api.get(`/geography/${id}/children`, { params: filters });
    return res.data;
  },

  // Get comprehensive multi-dimensional intelligence statistics for an area
  getRegionStatistics: async (id, filters = {}) => {
    const res = await api.get(`/geography/${id}/statistics`, { params: filters });
    return res.data;
  },

  // Get cross-tabulation matrix (Department vs Area OR Category vs Area)
  getRegionMatrix: async (id, matrixType = 'DEPARTMENT', filters = {}) => {
    const res = await api.get(`/geography/${id}/matrix`, {
      params: { matrixType, ...filters }
    });
    return res.data;
  },

  // Get filterable paginated complaints for an area & its descendants
  getRegionProblems: async (id, params = {}) => {
    const res = await api.get(`/geography/${id}/problems`, { params });
    return res.data;
  },

  // Search geographic entities by name or code
  searchRegions: async (query) => {
    const res = await api.get('/geography/search', { params: { q: query } });
    return res.data;
  }
};
