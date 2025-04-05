const User = require('../models/User');
const axios = require('axios');

const { updateUserCodeforcesStats } = require('../services/codeforces/codeforcesStatsService');
const { updateUserGitHubStats } = require('../services/github/githubStatsServices');
const { updateUserLeetCodeStats } = require('../services/leetcode/leetcodeStatsService');

exports.getUserQuestionStats = async (req, res) => {
    try {
        const username = req.params.username;

        // Fetch user by username, excluding sensitive information
        const user = await User.findOne({ username }).select('-password -_id');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Validate LeetCode username
        if (!user.platforms || !user.platforms.leetcode || !user.platforms.leetcode.username) {
            return res.status(400).json({
                success: false,
                message: "LeetCode username is not available for this user",
            });
        }

        const leetcodeUsername = user.platforms.leetcode.username;

        // GraphQL query for question stats
        const query = `
            {
                matchedUser(username: "${leetcodeUsername}") {
                    tagProblemCounts {
                        advanced {
                            tagName
                            problemsSolved
                        }
                        intermediate {
                            tagName
                            problemsSolved
                        }
                        fundamental {
                            tagName
                            problemsSolved
                        }
                    }
                }
            }
        `;

        const response = await axios.post(
            'https://leetcode.com/graphql',
            { query },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Referer': 'https://leetcode.com',
                },
            }
        );

        const tagProblemCounts = response.data.data.matchedUser.tagProblemCounts;

        res.status(200).json(tagProblemCounts);

    } catch (error) {
        console.error("Error fetching user question stats:", error.message);

        if (error.response) {
            console.error("Response Data:", error.response.data);
        }

        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.refreshUserPlatforms = async (req, res) => {
    const userId = req.user.id; // From auth middleware

    try {
        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user has any platform linked
        const { leetcode, github, codeforces } = user.platforms;
        if (!leetcode?.username && !github?.username && !codeforces?.username) {
            return res.status(400).json({ message: "No linked platform to refresh" });
        }

        // Refresh platform stats
        const results = {
            leetcode: null,
            github: null,
            codeforces: null,
            warnings: []
        };

        // Refresh LeetCode stats if username exists
        if (leetcode?.username) {
            const leetcodeResult = await updateUserLeetCodeStats(user, false);
            results.leetcode = leetcodeResult.user.platforms.leetcode;
            
            if (leetcodeResult.error) {
                results.warnings.push({
                    platform: 'leetcode',
                    message: leetcodeResult.error.message,
                    code: leetcodeResult.error.code
                });
                
                // If username is invalid, update user object
                if (leetcodeResult.error.code === 'INVALID_USERNAME' || 
                    leetcodeResult.error.code === 'USERNAME_NOT_FOUND') {
                    user.platforms.leetcode.isValid = false;
                }
            }
        }

        // Similar updates for GitHub and Codeforces...
        // (implement similar error handling as above for these platforms)

        // Save updated validation status
        await user.save();

        res.status(200).json({
            message: "Platform data refreshed",
            platforms: {
                leetcode: results.leetcode,
                github: results.github,
                codeforces: results.codeforces
            },
            warnings: results.warnings.length > 0 ? results.warnings : undefined
        });
    } catch (error) {
        console.error("Platform refresh error:", error);
        res.status(500).json({
            message: "Failed to refresh platform data. Please try again later.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
