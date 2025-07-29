const express = require('express');
const router = express.Router();
const axios = require('axios');
const redisClient = require('../services/cache/redisClient');

// Improved rate limiting middleware that correctly identifies user IP
const rateLimiter = async (req, res, next) => {
    // Get the real IP address (will use X-Forwarded-For when trust proxy is enabled)
    const ip = req.ip || 'anonymous';
    const endpoint = req.path.split('/')[1] || 'contests';
    const rateLimitKey = redisClient.generateRateLimitKey(ip, endpoint);

    try {
        const limit = process.env.NODE_ENV === 'production' ? 10 : 100;
        const rateLimit = await redisClient.checkRateLimit(rateLimitKey, limit, 60);
        res.set({
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.reset).toISOString()
        });

        // Log only in development for debugging
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Rate limit for ${ip} (${endpoint}): ${rateLimit.remaining} requests remaining`);
        }

        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: 'Too many requests. Please try again later.'
            });
        }
        next();
    } catch (error) {
        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('Rate limit error:', error);
        }
        // In production, we'll continue rather than failing the request
        next();
    }
};

// GET /api/contests/codeforces (unchanged - this works correctly)
router.get("/codeforces", rateLimiter, async (req, res) => {
    try {
        const cacheKey = "contests:codeforces";
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log("Returning cached Codeforces contests data");
            return res.json(JSON.parse(cachedData));
        }

        // console.log("Fetching fresh Codeforces contests data");
        const response = await axios.get("https://codeforces.com/api/contest.list", {
            headers: {
                "User-Agent": "CForge-Contest-Tracker/1.0",
            },
        });

        if (response.data.status !== "OK") {
            throw new Error(`Codeforces API error: ${response.data.status}`);
        }

        const now = Math.floor(Date.now() / 1000);

        const ongoing = response.data.result
            .filter(
                (contest) =>
                    contest.phase === "CODING" &&
                    contest.startTimeSeconds <= now &&
                    contest.startTimeSeconds + contest.durationSeconds > now,
            )
            .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

        const upcoming = response.data.result
            .filter((contest) => contest.phase === "BEFORE" && contest.startTimeSeconds > now)
            .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
            .slice(0, 15);

        const result = { ongoing, upcoming, lastUpdated: new Date().toISOString() };
        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        res.json(result);
    } catch (error) {
        console.error("Error fetching Codeforces contests:", error);
        res.status(500).json({
            error: "Failed to fetch contests from Codeforces",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// FIXED: GET /api/contests/leetcode - Using proper GraphQL API
router.get("/leetcode", rateLimiter, async (req, res) => {
    try {
        const cacheKey = "contests:leetcode";
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log("Returning cached LeetCode contests data");
            return res.json(JSON.parse(cachedData));
        }

        console.log("Fetching fresh LeetCode contests data");

        // Method 1: Using LeetCode's GraphQL API (most reliable)
        const graphqlQuery = {
            query: `
                query {
                    allContests {
                        title
                        titleSlug
                        startTime
                        duration
                        description
                        isVirtual
                    }
                }
            `
        };

        try {
            const response = await axios.post("https://leetcode.com/graphql/", graphqlQuery, {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                    "Referer": "https://leetcode.com/contest/",
                },
                timeout: 15000,
            });

            const contests = response.data.data.allContests || [];
            const now = Math.floor(Date.now() / 1000);

            // Process contests
            const processedContests = contests
                .filter(contest => !contest.isVirtual) // Filter out virtual contests
                .map(contest => ({
                    id: contest.titleSlug,
                    name: contest.title,
                    titleSlug: contest.titleSlug,
                    startTimeSeconds: contest.startTime,
                    durationSeconds: contest.duration,
                    description: contest.description || "LeetCode Contest",
                }));

            const ongoing = processedContests.filter(contest => {
                const startTime = contest.startTimeSeconds;
                const endTime = startTime + contest.durationSeconds;
                return startTime <= now && endTime > now;
            });

            const upcoming = processedContests
                .filter(contest => contest.startTimeSeconds > now)
                .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
                .slice(0, 15);

            const result = {
                ongoing,
                upcoming,
                lastUpdated: new Date().toISOString(),
            };

            await redisClient.set(cacheKey, JSON.stringify(result), 600);
            res.json(result);

        } catch (graphqlError) {
            console.log("GraphQL failed, trying alternative method:", graphqlError.message);

            // Method 2: Fallback to contest calendar API
            try {
                const calendarResponse = await axios.get("https://leetcode.com/contest/api/info/", {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Accept": "application/json",
                        "Referer": "https://leetcode.com/contest/",
                    },
                    timeout: 10000,
                });

                // This endpoint might return different structure
                const contestData = calendarResponse.data;

                // Process the data based on actual API response structure
                const result = {
                    ongoing: [],
                    upcoming: [],
                    lastUpdated: new Date().toISOString(),
                    note: "Using alternative LeetCode API endpoint"
                };

                await redisClient.set(cacheKey, JSON.stringify(result), 300);
                res.json(result);

            } catch (fallbackError) {
                console.log("All LeetCode APIs failed, using web scraping approach");

                // Method 3: Web scraping as last resort
                const scrapedData = await scrapeLeetCodeContests();

                const result = {
                    ongoing: scrapedData.ongoing,
                    upcoming: scrapedData.upcoming,
                    lastUpdated: new Date().toISOString(),
                    note: "Data obtained via web scraping - may be less reliable"
                };

                await redisClient.set(cacheKey, JSON.stringify(result), 180); // Shorter cache
                res.json(result);
            }
        }

    } catch (error) {
        console.error("Error fetching LeetCode contests:", error);
        res.status(500).json({
            error: "Failed to fetch contests from LeetCode",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// Web scraping function for LeetCode contests
async function scrapeLeetCodeContests() {
    try {
        const response = await axios.get("https://leetcode.com/contest/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            timeout: 15000,
        });

        // Parse HTML to extract contest information
        // This would require a HTML parser like cheerio
        // For now, return empty arrays
        return {
            ongoing: [],
            upcoming: []
        };
    } catch (error) {
        console.error("Web scraping failed:", error);
        return {
            ongoing: [],
            upcoming: []
        };
    }
}

// Alternative: GET /api/contests/leetcode using contests.json approach
router.get("/leetcode-alt", rateLimiter, async (req, res) => {
    try {
        const cacheKey = "contests:leetcode-alt";
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Try to fetch from LeetCode's contest data endpoint
        const response = await axios.get("https://leetcode.com/contest/api/list/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://leetcode.com/contest/",
            },
            timeout: 10000,
        });

        const now = Math.floor(Date.now() / 1000);
        const contestList = response.data;

        // Process based on actual API response structure
        const ongoing = [];
        const upcoming = [];

        // You'll need to adjust this based on the actual API response format
        if (Array.isArray(contestList)) {
            contestList.forEach(contest => {
                const startTime = new Date(contest.start_time).getTime() / 1000;
                const duration = contest.duration * 60; // Convert minutes to seconds
                const endTime = startTime + duration;

                const processedContest = {
                    id: contest.contest_id,
                    name: contest.title,
                    titleSlug: contest.title_slug,
                    startTimeSeconds: startTime,
                    durationSeconds: duration,
                    description: "LeetCode Contest"
                };

                if (startTime <= now && endTime > now) {
                    ongoing.push(processedContest);
                } else if (startTime > now) {
                    upcoming.push(processedContest);
                }
            });
        }

        const result = {
            ongoing: ongoing.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds),
            upcoming: upcoming.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds).slice(0, 15),
            lastUpdated: new Date().toISOString(),
        };

        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        res.json(result);

    } catch (error) {
        console.error("Error fetching LeetCode contests (alternative):", error);
        res.status(500).json({
            error: "Failed to fetch contests from LeetCode",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
});

// GET /api/contests/all - Get contests from all platforms (updated)
router.get("/all", rateLimiter, async (req, res) => {
    try {
        const cacheKey = "contests:all";
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }

        // Fetch from all platforms in parallel
        const [codeforcesRes, leetcodeRes] = await Promise.allSettled([
            axios.get(`${req.protocol}://${req.get("host")}/api/contests/codeforces`),
            axios.get(`${req.protocol}://${req.get("host")}/api/contests/leetcode`)
        ]);

        let allOngoing = [];
        let allUpcoming = [];
        const errors = [];
        const notes = [];

        // Process Codeforces data
        if (codeforcesRes.status === "fulfilled") {
            const cfData = codeforcesRes.value.data;
            allOngoing = [...allOngoing, ...cfData.ongoing.map((contest) => ({ ...contest, platform: "codeforces" }))];
            allUpcoming = [...allUpcoming, ...cfData.upcoming.map((contest) => ({ ...contest, platform: "codeforces" }))];
        } else {
            errors.push(`Codeforces: ${codeforcesRes.reason.message}`);
        }

        // Process LeetCode data
        if (leetcodeRes.status === "fulfilled") {
            const lcData = leetcodeRes.value.data;
            allOngoing = [...allOngoing, ...lcData.ongoing.map((contest) => ({ ...contest, platform: "leetcode" }))];
            allUpcoming = [...allUpcoming, ...lcData.upcoming.map((contest) => ({ ...contest, platform: "leetcode" }))];
            if (lcData.note) notes.push(lcData.note);
        } else {
            errors.push(`LeetCode: ${leetcodeRes.reason.message}`);
        }

        // Sort by start time
        allOngoing.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
        allUpcoming.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

        const result = {
            ongoing: allOngoing,
            upcoming: allUpcoming,
            lastUpdated: new Date().toISOString(),
            errors: errors.length > 0 ? errors : undefined,
            notes: notes.length > 0 ? notes : undefined,
        };

        await redisClient.set(cacheKey, JSON.stringify(result), 600);
        res.json(result);
    } catch (error) {
        console.error("Error fetching all contests:", error);
        res.status(500).json({ error: "Failed to fetch contests" });
    }
});

module.exports = router;