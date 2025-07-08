import api from '../config/api';

const API_BASE = '/leetcode-tracker';

export const problemTrackerApi = {
  // Sync recent problems from LeetCode
  syncRecentProblems: async () => {
    try {
      const response = await api.post(`${API_BASE}/sync`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to sync problems' };
    }
  },

  // Get tracked problems with filtering and pagination
  getTrackedProblems: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `${API_BASE}/problems?${queryString}` : `${API_BASE}/problems`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch problems' };
    }
  },

  // Update a tracked problem
  updateTrackedProblem: async (problemId, updates) => {
    try {
      const response = await api.put(`${API_BASE}/problems/${problemId}`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update problem' };
    }
  },

  // Delete a tracked problem
  deleteTrackedProblem: async (problemId) => {
    try {
      const response = await api.delete(`${API_BASE}/problems/${problemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete problem' };
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get(`${API_BASE}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch stats' };
    }
  },

  // Reminder management
  createReminders: async (problemId, intervals = [1, 3, 7, 14, 30]) => {
    try {
      const response = await api.post(`${API_BASE}/problems/${problemId}/reminders`, { intervals });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create reminders' };
    }
  },

  getPendingReminders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `${API_BASE}/reminders/pending?${queryString}` : `${API_BASE}/reminders/pending`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reminders' };
    }
  },

  getProblemReminders: async (problemId) => {
    try {
      const response = await api.get(`${API_BASE}/problems/${problemId}/reminders`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch problem reminders' };
    }
  },

  completeReminder: async (reminderId) => {
    try {
      const response = await api.put(`${API_BASE}/reminders/${reminderId}/complete`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete reminder' };
    }
  },

  skipReminder: async (reminderId, snoozeHours = 24) => {
    try {
      const response = await api.put(`${API_BASE}/reminders/${reminderId}/skip`, { snoozeHours });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to skip reminder' };
    }
  },

  deleteReminders: async (problemId) => {
    try {
      const response = await api.delete(`${API_BASE}/problems/${problemId}/reminders`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete reminders' };
    }
  },
};
