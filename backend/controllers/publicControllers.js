const User = require('../models/User');
const axios = require("axios");
const winston = require('winston');

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/public-controller-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/public-controller-combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

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
        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        logger.error('Error in getPublicUserProfile:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

exports.getPublicUserHeatMaps = async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const CACHE_DURATION_DAYS = 3;
        const now = new Date();
        const heatmaps = {};

        // Helper function to check if heatmap data needs refresh
        const needsRefresh = (lastUpdated) => {
            if (!lastUpdated) return true;
            const diffTime = Math.abs(now - lastUpdated);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > CACHE_DURATION_DAYS;
        };

        // Process each platform
        for (const platform of ['leetcode', 'github', 'codeforces']) {
            const platformData = user.platforms[platform];
            if (platformData?.username) {
                if (needsRefresh(platformData.heatmapLastUpdated)) {
                    try {
                        let heatmapData;
                        switch (platform) {
                            case 'leetcode':
                                heatmapData = await getLeetCodeHeatmap(platformData.username);
                                break;
                            case 'github':
                                heatmapData = await getGitHubHeatmap(platformData.username);
                                break;
                            case 'codeforces':
                                heatmapData = await getCodeforcesHeatmap(platformData.username);
                                break;
                        }

                        // Convert the data to Map format for storage
                        const heatmapMap = new Map();
                        if (platform === 'leetcode') {
                            Object.entries(heatmapData).forEach(([timestamp, count]) => {
                                heatmapMap.set(timestamp, count);
                            });
                        } else {
                            heatmapData.forEach(({ date, count }) => {
                                heatmapMap.set(date, count);
                            });
                        }

                        // Update user document with new heatmap data
                        await User.findOneAndUpdate(
                            { username },
                            {
                                $set: {
                                    [`platforms.${platform}.heatmapData`]: heatmapMap,
                                    [`platforms.${platform}.heatmapLastUpdated`]: now
                                }
                            }
                        );

                        heatmaps[platform] = heatmapData;
                    } catch (error) {
                        logger.error(`Failed to fetch ${platform} heatmap:`, error);
                        // If fetch fails, use cached data if available
                        if (platformData.heatmapData) {
                            // Convert Map back to original format
                            if (platform === 'leetcode') {
                                const leetcodeData = {};
                                platformData.heatmapData.forEach((value, key) => {
                                    leetcodeData[key] = value;
                                });
                                heatmaps[platform] = leetcodeData;
                            } else {
                                const arrayData = [];
                                platformData.heatmapData.forEach((value, key) => {
                                    arrayData.push({ date: key, count: value });
                                });
                                heatmaps[platform] = arrayData;
                            }
                        }
                    }
                } else {
                    // Use cached data
                    if (platform === 'leetcode') {
                        const leetcodeData = {};
                        platformData.heatmapData.forEach((value, key) => {
                            leetcodeData[key] = value;
                        });
                        heatmaps[platform] = leetcodeData;
                    } else {
                        const arrayData = [];
                        platformData.heatmapData.forEach((value, key) => {
                            arrayData.push({ date: key, count: value });
                        });
                        heatmaps[platform] = arrayData;
                    }
                }
            }
        }

        res.status(200).json({
            success: true,
            heatmaps
        });
    } catch (error) {
        logger.error('Error in getPublicUserHeatMaps:', error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
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
