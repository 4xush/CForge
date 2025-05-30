import api from "../config/api";

export const refreshLeetcodeLeaderboard = async (roomId) => {
    try {
      const response = await api.post(`/rooms/${roomId}/update-leetcode-stats`);
      // Clear cached data after successful refresh
      clearLeaderboardCache(roomId, 'leetcode');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to update LeetCode stats");
    }
  };

export const refreshCodeforcesLeaderboard = async (roomId) => {
    try {
      const response = await api.post(`/rooms/${roomId}/update-codeforces-stats`);
      // Clear cached data after successful refresh
      clearLeaderboardCache(roomId, 'codeforces');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to update Codeforces stats");
    }
  };

export const getLeaderboard = async (roomId, sortBy, limit, page, platform = 'leetcode') => {
    try {
      // Create a unique key for this specific leaderboard request including platform
      const cacheKey = `leaderboard_${roomId}_${platform}_${sortBy}_${limit}_${page}`;
  
      // Check if we have cached data and it's not expired
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
  
        // Use cache if it's less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          return data;
        }
  
        // Remove expired cache
        sessionStorage.removeItem(cacheKey);
      }
  
      // Fetch fresh data if no cache or cache expired
      const response = await api.get(`/rooms/${roomId}/leaderboard`, {
        params: { sortBy, limit, page, platform }
      });
  
      // Cache the new data with timestamp
      const cacheData = {
        data: response.data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
  
      return response.data;
    } catch (error) {
      // Try to return cached data if request fails, even if expired
      const cacheKey = `leaderboard_${roomId}_${platform}_${sortBy}_${limit}_${page}`;
      const cachedData = sessionStorage.getItem(cacheKey);
  
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        return data;
      }
  
      throw error.response?.data || new Error("Failed to fetch leaderboard");
    }
  };
  
  // Add a function to clear leaderboard cache for a room and platform
  export const clearLeaderboardCache = (roomId, platform = null) => {
    // Clear all cached data for this room
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(`leaderboard_${roomId}`)) {
        // If platform is specified, only clear cache for that platform
        if (platform && !key.includes(`_${platform}_`)) {
          return;
        }
        sessionStorage.removeItem(key);
      }
    });
  };
  