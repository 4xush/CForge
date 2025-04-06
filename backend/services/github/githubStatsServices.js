const User = require("../../models/User");
const { getGitHubStats } = require("./githubService");

const updateUserGitHubStats = async (user, throwError = false, force = false) => {
    try {
        // Validate user object
        if (!user?._id || !user?.platforms?.github?.username) {
            const error = new Error("Invalid user data or missing GitHub username");
            error.code = "INVALID_USER_DATA";
            throw error;
        }

        // Check if stats update is needed (if not forced)
        if (!force) {
            const lastUpdate = user.platforms?.github?.lastUpdated;
            const isStale = !lastUpdate || (Date.now() - lastUpdate.getTime()) > 3600000; // 1 hour
            if (!isStale) {
                return user;
            }
        }

        const githubUsername = user.platforms.github.username;

        // Fetch GitHub stats
        const stats = await getGitHubStats(githubUsername);

        // Validate stats response
        if (!stats || typeof stats.publicRepos !== 'number') {
            const error = new Error("Invalid GitHub API response");
            error.code = "INVALID_GITHUB_RESPONSE";
            throw error;
        }

        // Prepare stats update object - only including available fields
        const statsToUpdate = {
            "platforms.github.publicRepos": stats.publicRepos || 0,
            "platforms.github.followers": stats.followers || 0,
            "platforms.github.following": stats.following || 0,
            "platforms.github.lastUpdated": new Date()
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
        console.error(`GitHub stats update failed for user ${user?._id}:`, {
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

const refreshUserGitHubStats = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return await updateUserGitHubStats(user, true, true);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    updateUserGitHubStats,
    refreshUserGitHubStats
};