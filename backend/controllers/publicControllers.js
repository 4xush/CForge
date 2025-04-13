const User = require('../models/User');
const axios = require("axios");

exports.getPublicUserProfile = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username }).select('-password -_id')

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getPublicUserHeatMaps = async (req, res) => {
    try {

        const username = req.params.username;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Fetch activity heatmap data
        const leetcodeHeatmap = user.platforms.leetcode.username
            ? await getLeetCodeHeatmap(user.platforms.leetcode.username)
            : null;

        const githubHeatmap = user.platforms.github.username
            ? await getGitHubHeatmap(user.platforms.github.username)
            : null;
        const codeforcesHeatmap = user.platforms.codeforces.username
            ? await getCodeforcesHeatmap(user.platforms.codeforces.username)
            : null;

        res.status(200).json({
            success: true,
            heatmaps: {
                leetcode: leetcodeHeatmap,
                github: githubHeatmap,
                codeforces: codeforcesHeatmap,
            },
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

async function getLeetCodeHeatmap(leetcodeUsername) {
    const response = await axios.post('https://leetcode.com/graphql', {
        query: `
            query submissionCalendar($username: String!) {
                matchedUser(username: $username) {
                    submissionCalendar
                }
            }
        `,
        variables: { username: leetcodeUsername },
    }, {
        headers: { "Content-Type": "application/json" },
    });

    // Add null checks before accessing submissionCalendar
    const matchedUser = response.data?.data?.matchedUser;
    const submissionCalendar = matchedUser?.submissionCalendar;

    if (!submissionCalendar) {
        console.warn(`No submissionCalendar found for LeetCode user: ${leetcodeUsername}`);
        return {}; // Return empty object if data is missing
    }

    try {
        return JSON.parse(submissionCalendar); // Returns { "timestamp": "count", ... }
    } catch (parseError) {
        console.error(`Error parsing submissionCalendar for LeetCode user ${leetcodeUsername}:`, parseError);
        return {}; // Return empty object on parsing error
    }
}
async function getGitHubHeatmap(githubUsername) {
    try {
        // Add authentication and proper headers
        const headers = {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        // Get events with authentication
        const response = await axios.get(
            `https://api.github.com/users/${githubUsername}/events`,
            { headers }
        );

        // Validate response
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response format from GitHub API');
        }

        const events = response.data;
        const dailyContributions = {};

        // Process events into daily contributions
        events.forEach(event => {
            if (!event.created_at) return; // Skip invalid events

            const date = new Date(event.created_at).toISOString().split('T')[0];

            // Count different types of contributions differently
            let contributionCount = 0;
            switch (event.type) {
                case 'PushEvent':
                    contributionCount = event.payload?.commits?.length || 1;
                    break;
                case 'PullRequestEvent':
                case 'IssuesEvent':
                    contributionCount = 1;
                    break;
                default:
                    contributionCount = 0.5; // Other events count as partial contributions
            }

            dailyContributions[date] = (dailyContributions[date] || 0) + contributionCount;
        });

        // Convert to array format with dates and counts
        return Object.entries(dailyContributions).map(([date, count]) => ({
            date,
            count: Math.round(count * 10) / 10 // Round to 1 decimal place
        }));

    } catch (error) {
        console.error(`Error fetching GitHub heatmap for user ${githubUsername}:`, error);
        if (error.response?.status === 403) {
            throw new Error('GitHub API rate limit exceeded');
        } else if (error.response?.status === 404) {
            throw new Error('GitHub user not found');
        }
        throw new Error('Failed to fetch GitHub contribution data');
    }
}

async function getCodeforcesHeatmap(codeforcesHandle) {
    const response = await axios.get(`https://codeforces.com/api/user.status?handle=${codeforcesHandle}`);
    const data = response.data;

    const dailySubmissions = {};
    data.result.forEach(submission => {
        const date = new Date(submission.creationTimeSeconds * 1000).toISOString().split('T')[0];
        dailySubmissions[date] = (dailySubmissions[date] || 0) + 1;
    });

    return Object.entries(dailySubmissions).map(([date, count]) => ({ date, count }));
}
