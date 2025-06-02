const User = require("../models/User");

/**
 * Find users who were active in the last 7 days
 * @returns {Promise<Array>} Array of users with _id, username, and email
 */
const getActiveUsersLast7Days = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const activeUsers = await User.find({
      lastActiveAt: { $gte: sevenDaysAgo }
    })
    .select('_id username email lastActiveAt')
    .sort({ lastActiveAt: -1 });
    
    return activeUsers;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};

/**
 * Get count of active users in the last 7 days
 * @returns {Promise<number>} Count of active users
 */
const getActiveUsersCount = async () => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const count = await User.countDocuments({
      lastActiveAt: { $gte: sevenDaysAgo }
    });
    
    return count;
  } catch (error) {
    console.error('Error counting active users:', error);
    throw error;
  }
};

/**
 * Find users who were active in a custom time period
 * @param {number} days Number of days to look back
 * @returns {Promise<Array>} Array of users with _id, username, and email
 */
const getActiveUsersLastNDays = async (days) => {
  try {
    const nDaysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const activeUsers = await User.find({
      lastActiveAt: { $gte: nDaysAgo }
    })
    .select('_id username email lastActiveAt')
    .sort({ lastActiveAt: -1 });
    
    return activeUsers;
  } catch (error) {
    console.error('Error fetching active users:', error);
    throw error;
  }
};

module.exports = {
  getActiveUsersLast7Days,
  getActiveUsersCount,
  getActiveUsersLastNDays
};