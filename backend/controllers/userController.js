const User = require("../models/User");
const {
    checkLeetCodeUsername,
    checkGitHubUsername,
    checkCodeforcesUsername
} = require("../utils/authHelpers.js");
const { updateUserLeetCodeStats } = require("../services/leetcode/leetcodeStatsService.js");
const { updateUserGitHubStats } = require("../services/github/githubStatsServices.js");
const { updateUserCodeforcesStats } = require("../services/codeforces/codeforcesStatsService.js");
const { 
    getActiveUsersLast7Days, 
    getActiveUsersCount, 
    getActiveUsersLastNDays 
} = require("../utils/activeUsers.js");

exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.searchUser = async (req, res) => {
    const { query } = req.query; // `query` parameter from the request URL (e.g., `/search?query=johndoe`).

    try {
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ message: "Search query cannot be empty" });
        }

        // Perform a case-insensitive search for users based on username or email
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } }, // Case-insensitive match on username
                { email: { $regex: query, $options: "i" } },    // Case-insensitive match on email
            ],
        }).select("-password"); // Exclude the password field.

        if (users.length === 0) {
            return res.status(404).json({ message: "No users found matching the query" });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.setupLeetCode = async (req, res) => {
    const { username: leetcodeUsername } = req.body;
    const userId = req.user.id;

    try {
        if (!leetcodeUsername) {
            return res.status(400).json({
                message: "LeetCode username is required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate username
        try {
            const isValid = await checkLeetCodeUsername(leetcodeUsername);
            if (!isValid) {
                return res.status(400).json({
                    message: "Invalid LeetCode username"
                });
            }
        } catch (error) {
            return res.status(400).json({
                message: "Invalid LeetCode username"
            });
        }

        // Update user's LeetCode information
        user.platforms.leetcode = {
            username: leetcodeUsername.trim(),
            totalQuestionsSolved: 0,
            questionsSolvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
            attendedContestsCount: 0,
            contestRating: 0
        };

        user.isProfileComplete = true;
        await user.save();

        // Update LeetCode stats
        let updatedUser = user;
        try {
            const result = await updateUserLeetCodeStats(user, false);
            updatedUser = result.user;
        } catch (error) {
            console.error("LeetCode stats update failed:", error);
        }

        res.status(200).json({
            message: "LeetCode username updated successfully",
            platform: updatedUser.platforms.leetcode
        });

    } catch (error) {
        console.error("LeetCode setup error:", error);
        res.status(500).json({
            message: "Failed to setup LeetCode username"
        });
    }
};

exports.setupGitHub = async (req, res) => {
    const { username: githubUsername } = req.body;
    const userId = req.user.id;

    try {
        if (!githubUsername) {
            return res.status(400).json({
                message: "GitHub username is required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate username
        try {
            const isValid = await checkGitHubUsername(githubUsername);
            if (!isValid) {
                return res.status(400).json({
                    message: "Invalid GitHub username"
                });
            }
        } catch (error) {
            return res.status(400).json({
                message: "Invalid GitHub username"
            });
        }

        // Update user's GitHub information
        user.platforms.github = {
            username: githubUsername.trim(),
            publicRepos: 0,
            followers: 0,
            following: 0
        };

        user.isProfileComplete = true;
        await user.save();

        // Update GitHub stats
        let updatedUser = user;
        try {
            const result = await updateUserGitHubStats(user, false);
            updatedUser = result.user;
        } catch (error) {
            console.error("GitHub stats update failed:", error);
        }

        res.status(200).json({
            message: "GitHub username updated successfully",
            platform: updatedUser.platforms.github
        });

    } catch (error) {
        console.error("GitHub setup error:", error);
        res.status(500).json({
            message: "Failed to setup GitHub username"
        });
    }
};

exports.setupCodeforces = async (req, res) => {
    const { username: codeforcesUsername } = req.body;
    const userId = req.user.id;

    try {
        if (!codeforcesUsername) {
            return res.status(400).json({
                message: "Codeforces username is required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate username
        try {
            const isValid = await checkCodeforcesUsername(codeforcesUsername);
            if (!isValid) {
                return res.status(400).json({
                    message: "Invalid Codeforces username"
                });
            }
        } catch (error) {
            return res.status(400).json({
                message: "Invalid Codeforces username"
            });
        }

        // Update user's Codeforces information
        user.platforms.codeforces = {
            username: codeforcesUsername.trim(),
            currentRating: 0,
            maxRating: 0,
            rank: "",
            maxRank: "",
            contribution: 0,
            friendOfCount: 0
        };

        user.isProfileComplete = true;
        await user.save();

        // Update Codeforces stats
        let updatedUser = user;
        try {
            const result = await updateUserCodeforcesStats(user, false);
            updatedUser = result.user;
        } catch (error) {
            console.error("Codeforces stats update failed:", error);
        }

        res.status(200).json({
            message: "Codeforces username updated successfully",
            platform: updatedUser.platforms.codeforces
        });

    } catch (error) {
        console.error("Codeforces setup error:", error);
        res.status(500).json({
            message: "Failed to setup Codeforces username"
        });
    }
};

exports.getActiveUsers = async (req, res) => {
    try {
        const { days } = req.query;
        let activeUsers;

        if (days && !isNaN(days)) {
            activeUsers = await getActiveUsersLastNDays(parseInt(days));
        } else {
            activeUsers = await getActiveUsersLast7Days();
        }

        res.status(200).json({
            message: "Active users fetched successfully",
            count: activeUsers.length,
            users: activeUsers
        });
    } catch (error) {
        console.error("Error fetching active users:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

exports.getActiveUsersCount = async (req, res) => {
    try {
        const count = await getActiveUsersCount();
        
        res.status(200).json({
            message: "Active users count fetched successfully",
            count: count
        });
    } catch (error) {
        console.error("Error fetching active users count:", error);
        res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};
