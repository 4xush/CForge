// services/leetcodeStatsService.js
const User = require("../models/User");
const { getLeetCodeStats } = require("./leetcodeService");

const updateUserLeetCodeStats = async (user, throwError = false, force = false) => {
    try {
        // Validate user object
        if (!user?._id || !user?.platforms?.leetcode?.username) {
            const error = new Error("Invalid user data or missing LeetCode username");
            error.code = "INVALID_USER_DATA";
            throw error;
        }

        // Check if stats update is needed (if not forced)
        if (!force) {
            const lastUpdate = user.platforms?.leetcode?.lastUpdated;
            const isStale = !lastUpdate || (Date.now() - lastUpdate.getTime()) > 3600000; // 1 hour

            if (!isStale) {
                return user;
            }
        }

        const leetcodeUsername = user.platforms.leetcode.username;

        // Fetch LeetCode stats
        const stats = await getLeetCodeStats(leetcodeUsername);

        // Validate stats response
        if (!stats || typeof stats.totalQuestionsSolved !== 'number') {
            const error = new Error("Invalid LeetCode API response");
            error.code = "INVALID_LEETCODE_RESPONSE";
            throw error;
        }

        // Prepare stats update object
        const statsToUpdate = {
            "platforms.leetcode.totalQuestionsSolved": stats.totalQuestionsSolved || 0,
            "platforms.leetcode.questionsSolvedByDifficulty.easy": stats.questionsSolvedByDifficulty?.easy || 0,
            "platforms.leetcode.questionsSolvedByDifficulty.medium": stats.questionsSolvedByDifficulty?.medium || 0,
            "platforms.leetcode.questionsSolvedByDifficulty.hard": stats.questionsSolvedByDifficulty?.hard || 0,
            "platforms.leetcode.attendedContestsCount": stats.attendedContestsCount || 0,
            "platforms.leetcode.contestRating": stats.contestRating || 0,
            "platforms.leetcode.lastUpdated": new Date()
        };

        // Update user document
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: statsToUpdate },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            const error = new Error("User not found during stats update");
            error.code = "USER_NOT_FOUND";
            throw error;
        }

        return updatedUser;

    } catch (error) {
        console.error(`LeetCode stats update failed for user ${user?._id}:`, {
            error: error.message,
            code: error.code,
            stack: error.stack
        });

        if (throwError) {
            throw error;
        }

        return user;
    }
};

/**
 * Force updates a user's LeetCode stats by user ID
 * @param {string} userId - User's MongoDB ID
 * @returns {Promise<Object>} Updated user document
 */
const refreshUserLeetCodeStats = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        return await updateUserLeetCodeStats(user, true, true);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    updateUserLeetCodeStats,
    refreshUserLeetCodeStats
};