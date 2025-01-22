const User = require('../models/User');
const axios = require('axios');

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
