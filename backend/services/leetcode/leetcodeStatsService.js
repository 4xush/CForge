const User = require("../../models/User");
const { getLeetCodeStats } = require("./leetcodeService");
const { validatePlatformUsername, handleInvalidUsername } = require('../platformValidationService');
const createApiClient = require('../apiClient');

const updateUserLeetCodeStats = async (user, throwError = false, force = false) => {
    try {
        // Validate user object
        if (!user?._id || !user?.platforms?.leetcode?.username) {
            const error = new Error("Invalid user data or missing LeetCode username");
            error.code = "INVALID_USER_DATA";
            throw error;
        }

        // Check if username is marked as invalid
        if (user.platforms.leetcode.isValid === false) {
            const lastCheck = user.platforms.leetcode.lastValidationCheck;
            const daysSinceLastCheck = lastCheck ? 
                Math.floor((Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)) : 0;
            
            // If it was checked recently and found invalid, skip API call
            if (daysSinceLastCheck < 1 && !force) {
                return {
                    user,
                    error: {
                        code: "INVALID_USERNAME",
                        message: "LeetCode username is invalid. Please update it in your profile."
                    }
                };
            }
            
            // Revalidate if it's been a while or forced
            const isValid = await validatePlatformUsername('leetcode', user.platforms.leetcode.username);
            if (!isValid) {
                return {
                    user,
                    error: {
                        code: "INVALID_USERNAME",
                        message: "LeetCode username is still invalid. Please update it in your profile."
                    }
                };
            }
            
            // If now valid, mark as valid
            user.platforms.leetcode.isValid = true;
            user.platforms.leetcode.lastValidationCheck = new Date();
            await user.save();
        }

        // Check if stats update is needed (if not forced)
        if (!force) {
            const lastUpdate = user.platforms?.leetcode?.lastUpdated;
            const isStale = !lastUpdate || (Date.now() - lastUpdate.getTime()) > 3600000; // 1 hour

            if (!isStale) {
                return { user };
            }
        }

        const leetcodeUsername = user.platforms.leetcode.username;

        // Fetch LeetCode stats with enhanced error handling
        try {
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
                "platforms.leetcode.lastUpdated": new Date(),
                "platforms.leetcode.isValid": true,
                "platforms.leetcode.lastValidationCheck": new Date()
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

            return { user: updatedUser };
        } catch (error) {
            // Check for 404 error, which likely means username doesn't exist anymore
            if (error.response?.status === 404 || 
                (error.response?.data && error.response.data.errors && 
                 error.response.data.errors.some(e => e.message.includes("not found")))) {
                
                await handleInvalidUsername(user, 'leetcode');
                return {
                    user,
                    error: {
                        code: "USERNAME_NOT_FOUND",
                        message: "LeetCode username no longer exists. Please update it in your profile."
                    }
                };
            }
            
            // For rate limit errors
            if (error.response?.status === 429) {
                console.error(`LeetCode API rate limit exceeded for user ${user._id}`);
                return {
                    user,
                    error: {
                        code: "RATE_LIMIT",
                        message: "LeetCode API rate limit exceeded. Please try again later."
                    }
                };
            }
            
            // General API errors
            console.error(`LeetCode stats update failed for user ${user?._id}:`, {
                error: error.message,
                code: error.code || "UNKNOWN_ERROR",
                stack: error.stack
            });
            
            if (throwError) {
                throw error;
            }
            
            return {
                user,
                error: {
                    code: error.code || "API_ERROR",
                    message: "Failed to update LeetCode stats. Service may be temporarily unavailable."
                }
            };
        }

    } catch (error) {
        console.error(`LeetCode stats update failed for user ${user?._id}:`, {
            error: error.message,
            code: error.code,
            stack: error.stack
        });

        if (throwError) {
            throw error;
        }

        return { 
            user,
            error: {
                code: error.code || "UNKNOWN_ERROR",
                message: error.message || "An unknown error occurred"
            }
        };
    }
};

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