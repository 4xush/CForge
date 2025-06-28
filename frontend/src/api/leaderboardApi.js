import api from "../config/api";

export const refreshLeetcodeLeaderboard = async (roomId) => {
    try {
      const response = await api.post(`/rooms/${roomId}/update-leetcode-stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to update LeetCode stats");
    }
  };

export const refreshCodeforcesLeaderboard = async (roomId) => {
    try {
      const response = await api.post(`/rooms/${roomId}/update-codeforces-stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to update Codeforces stats");
    }
  };

export const getLeaderboard = async (roomId, sortBy, limit, page, platform = 'leetcode') => {
    try {
      const response = await api.get(`/rooms/${roomId}/leaderboard`, {
        params: { sortBy, limit, page, platform }
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to fetch leaderboard");
    }
  };
  