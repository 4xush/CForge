const Room = require("../models/Room");
const User = require("../models/User");
const shortid = require('shortid');
const { getLeetCodeStats } = require("../services/leetcode/leetcodeService");

const isMember = (room, userId) => {
  return room.members.some((member) => member.toString() === userId.toString());
};

const hasAvailableSpace = (room) => {
  return room.members.length < room.maxMembers;
};

exports.getAllRoomsForUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({ members: userId })
      .select("roomId name description isPublic members admins maxMembers createdAt")
      .exec();

    res.json({ rooms });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user's rooms", error: error.message });
  }
};


exports.createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, roomId } = req.body;

    // Convert the roomId to lowercase if provided, otherwise generate a shortid
    const newRoomId = (roomId ? roomId.toLowerCase() : shortid.generate().toLowerCase());

    const newRoom = new Room({
      name,
      description,
      creator: req.user._id,
      isPublic,
      admins: [req.user._id],
      members: [req.user._id],
      roomId: newRoomId,
    });

    await newRoom.save();
    res
      .status(201)
      .json({ message: "Room created successfully", room: newRoom });
    // console.log("Room created with ID:", newRoomId);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating room", error: error.message });
  }
};


exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isAdmin = room.admins.includes(userId);
    const isMember = room.members.includes(userId);

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    // Remove user from members and admins if they exist in those arrays
    room.members = room.members.filter(member => member.toString() !== userId.toString());
    room.admins = room.admins.filter(admin => admin.toString() !== userId.toString());

    // Case 1: Last admin leaving and no other members - delete the room
    if (room.admins.length === 0 && room.members.length === 0) {
      await room.deleteOne();
      return res.status(200).json({ message: "Room deleted as last admin left and no members remain" });
    }

    // Case 2: Last admin leaving, but other members are present - assign a new admin
    if (room.admins.length === 0 && room.members.length > 0) {
      // Assign a random member as the new admin
      const newAdmin = room.members[0];
      room.admins.push(newAdmin);
    }

    await room.save();
    res.status(200).json({ message: "You have successfully left the room" });

  } catch (error) {
    res.status(500).json({ message: "Error while leaving the room", error: error.message });
  }
};



exports.searchPublicRooms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {
      isPublic: true,
      $or: [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    };

    const rooms = await Room.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("roomId name description maxMembers members")
      .exec();

    const count = await Room.countDocuments(query);

    res.json({
      rooms,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching rooms", error: error.message });
  }
};

exports.getRoomDetails = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate("members", "username profilePicture")
      .populate("admins", "username profilePicture")
      .populate("creator", "username");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.isPublic && !(isMember)) {
      return res
        .status(403)
        .json({ message: "You don't have permission to view this room" });
    }

    // Send room details including populated creator
    const roomDetails = {
      _id: room._id,
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      createdAt: room.createdAt,
      createdBy: room.creator ? room.creator.username : "Unknown", // dynamincally changing the db instance in response
      admins: room.admins,
      members: room.members,
      maxMembers: room.maxMembers,
    };

    res.json(roomDetails);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching room details", error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const room = await Room.findOne({ roomId: req.params.roomId }).populate({
      path: "members",
      select: "username profilePicture platforms.leetcode",
      options: {
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isPublic && !isMember(room, req.user._id)) {
      return res.status(403).json({
        message: "You don't have permission to view this room's leaderboard",
      });
    }

    const leaderboardData = room.members.map((member) => ({
      username: member.username,
      profilePicture: member.profilePicture,
      leetcodeStats: member.platforms.leetcode,
    }));

    const totalMembers = room.members.length;

    res.json({
      leaderboardData,
      currentPage: page,
      totalPages: Math.ceil(totalMembers / limit),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching leaderboard", error: error.message });
  }
};

exports.sendJoinRequest = async (req, res) => {
  try {
    const roomId = req.params.roomId.toLowerCase();
    const { _id: userId } = req.user;
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (isMember(room, userId)) {
      return res.status(400).json({ message: "You are already a member of this room" });
    }
    if (!hasAvailableSpace(room)) {
      return res.status(400).json({ message: "The room is full" });
    }
    if (room.isPublic) {
      room.members.push(userId);
      await room.save();
      const roomDetails = {
        name: room.name,
        createdBy: room.creator ? room.creator.username : "Unknown",
        admins: room.admins,
        members: room.members,
      };
      return res.json(roomDetails);
    }
    const existingRequest = room.joinRequests.find(request => request.user.toString() === userId.toString());
    if (existingRequest) {
      return res.status(400).json({ message: "You have already sent a join request" });
    }
    room.joinRequests.push({ user: userId });
    await room.save();
    return res.json({ message: "Join request sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending join request", error: error.message });
  }
};

exports.updateRoomMembersLeetCodeStats = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Find the room and check if it exists
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is a member or admin of the room
    if (!isMember(room, userId) && !room.admins.includes(userId)) {
      return res.status(403).json({ message: "You don't have permission to update this room's stats" });
    }

    // Get all members in the room
    const members = await User.find({ _id: { $in: room.members } });
    
    const updateResults = {
      success: [],
      failed: []
    };

    // Update stats for each member
    for (const member of members) {
      try {
        // Skip users without a LeetCode username
        if (!member.platforms?.leetcode?.username) {
          updateResults.failed.push({
            username: member.username,
            reason: "LeetCode username not set"
          });
          continue;
        }

        const leetcodeUsername = member.platforms.leetcode.username;
        const apiResponse = await getLeetCodeStats(leetcodeUsername);
        
        if (!apiResponse || apiResponse.error) {
          updateResults.failed.push({
            username: member.username,
            reason: "Invalid LeetCode stats response"
          });
          continue;
        }

        const { totalQuestionsSolved, questionsSolvedByDifficulty, attendedContestsCount, contestRating } = apiResponse;

        const statsToUpdate = {
          "platforms.leetcode.totalQuestionsSolved": totalQuestionsSolved,
          "platforms.leetcode.questionsSolvedByDifficulty.easy": questionsSolvedByDifficulty.easy,
          "platforms.leetcode.questionsSolvedByDifficulty.medium": questionsSolvedByDifficulty.medium,
          "platforms.leetcode.questionsSolvedByDifficulty.hard": questionsSolvedByDifficulty.hard,
          "platforms.leetcode.attendedContestsCount": attendedContestsCount,
          "platforms.leetcode.contestRating": contestRating,
        };

        await User.findOneAndUpdate(
          { _id: member._id },
          { $set: statsToUpdate },
          { runValidators: true }
        );

        updateResults.success.push(member.username);
      } catch (error) {
        console.error(`Error updating LeetCode stats for user ${member.username}:`, error);
        updateResults.failed.push({
          username: member.username,
          reason: error.message
        });
      }
    }

    res.status(200).json({
      message: "LeetCode stats update completed",
      results: updateResults
    });
  } catch (error) {
    console.error("Error updating room members' LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
