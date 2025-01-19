const Room = require('../models/Room');
const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
    const {
        sortBy = "platforms.leetcode.totalQuestionsSolved",
        order = "desc",
        limit = 10,
        page = 1
    } = req.query;

    const allowedSortFields = [
        "platforms.leetcode.totalQuestionsSolved",
        "platforms.leetcode.contestRating",
        "platforms.leetcode.attendedContestsCount"
    ];

    try {
        if (!allowedSortFields.includes(sortBy)) {
            return res.status(400).json({ message: "Invalid sort field" });
        }

        // Validate and parse query parameters
        const parsedLimit = parseInt(limit, 10);
        const parsedPage = parseInt(page, 10);
        const skip = (parsedPage - 1) * parsedLimit;

        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Aggregate pipeline for leaderboard
        const pipeline = [
            {
                $match: {
                    _id: { $in: room.members }
                }
            },
            {
                $sort: {
                    [sortBy]: order === "asc" ? 1 : -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: parsedLimit
            },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    profilePicture: 1,
                    email: 1,
                    "platforms.leetcode": 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
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
        res.status(500).json({ message: "Server error", error: error.message });
    }
};