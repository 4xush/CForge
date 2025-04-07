const Room = require('../models/Room');
const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
    const {
        sortBy = "platforms.leetcode.totalQuestionsSolved",
        order = "desc",
        limit = 10,
        page = 1,
        platform
    } = req.query;

    const allowedSortFields = {
        leetcode: [
            "platforms.leetcode.totalQuestionsSolved",
            "platforms.leetcode.contestRating",
            "platforms.leetcode.attendedContestsCount"
        ],
        codeforces: [
            "platforms.codeforces.currentRating",
            "platforms.codeforces.maxRating",
            "platforms.codeforces.contribution"
        ]
    };

    try {
        // Determine platform with better fallback
        const detectedPlatform = platform || (sortBy.includes('leetcode') ? 'leetcode' : sortBy.includes('codeforces') ? 'codeforces' : null);
        if (!detectedPlatform || !allowedSortFields[detectedPlatform]) {
            return res.status(400).json({ 
                message: "Invalid or unspecified platform. Supported platforms: leetcode, codeforces" 
            });
        }

        if (!allowedSortFields[detectedPlatform].includes(sortBy)) {
            return res.status(400).json({ 
                message: `Invalid sort field for ${detectedPlatform}. Allowed fields: ${allowedSortFields[detectedPlatform].join(', ')}` 
            });
        }

        // Validate and parse query parameters
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const skip = (parsedPage - 1) * parsedLimit;

        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Platform-specific projection
        const platformProjection = {
            username: 1,
            fullName: 1,
            profilePicture: 1,
            email: 1,
            createdAt: 1,
            updatedAt: 1,
            [`platforms.${detectedPlatform}`]: 1
        };

        // Aggregate pipeline for leaderboard
        const pipeline = [
            { $match: { _id: { $in: room.members } } },
            { $sort: { [sortBy]: order === "asc" ? 1 : -1 } },
            { $skip: skip },
            { $limit: parsedLimit },
            { $project: platformProjection }
        ];

        // Execute aggregation
        const members = await User.aggregate(pipeline);
        const totalCount = await User.countDocuments({ _id: { $in: room.members } });

        const validatedMembers = members.map(member => ({
            ...member,
            fullName: member.fullName || member.username || 'Anonymous User',
            profilePicture: member.profilePicture || null
        }));

        res.status(200).json({
            members: validatedMembers,
            totalCount,
            page: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(totalCount / parsedLimit)
        });

    } catch (error) {
        console.error("Error in getLeaderboard:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};