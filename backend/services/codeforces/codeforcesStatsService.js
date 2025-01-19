const User = require("../../models/User");
const { getCodeforcesStats } = require("./codeforcesService");

const updateUserCodeforcesStats = async (user, throwError = false, force = false) => {
    try {
        // Validate user object
        if (!user?._id || !user?.platforms?.codeforces?.username) {
            const error = new Error("Invalid user data or missing Codeforces username");
            error.code = "INVALID_USER_DATA";
            throw error;
        }

        // Check if stats update is needed (if not forced)
        if (!force) {
            const lastUpdate = user.platforms?.codeforces?.lastUpdated;
            const isStale = !lastUpdate || (Date.now() - lastUpdate.getTime()) > 3600000; // 1 hour

            if (!isStale) {
                return user;
            }
        }

        const codeforcesUsername = user.platforms.codeforces.username;

        // Fetch Codeforces stats
        const stats = await getCodeforcesStats(codeforcesUsername);

        // Validate stats response
        if (!stats || typeof stats.currentRating !== "number") {
            const error = new Error("Invalid Codeforces API response");
            error.code = "INVALID_CODEFORCES_RESPONSE";
            throw error;
        }

        // Prepare stats update object
        const statsToUpdate = {
            "platforms.codeforces.currentRating": stats.currentRating || 0,
            "platforms.codeforces.maxRating": stats.maxRating || 0,
            "platforms.codeforces.rank": stats.rank || "Unrated",
            "platforms.codeforces.maxRank": stats.maxRank || "Unrated",
            "platforms.codeforces.contribution": stats.contribution || 0,
            "platforms.codeforces.friendOfCount": stats.friendOfCount || 0,
            "platforms.codeforces.lastUpdated": new Date(),
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
        console.error(`Codeforces stats update failed for user ${user?._id}:`, {
            error: error.message,
            code: error.code,
            stack: error.stack,
        });

        if (throwError) {
            throw error;
        }

        return user;
    }
};

const refreshUserCodeforcesStats = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        return await updateUserCodeforcesStats(user, true, true);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    updateUserCodeforcesStats,
    refreshUserCodeforcesStats,
};
