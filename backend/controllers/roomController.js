const Room = require("../models/Room");
const User = require("../models/User");
const LastSeen = require("../models/LastSeen");
const Message = require("../models/Message");
const shortid = require('shortid');
const { getLeetCodeStats } = require("../services/leetcode/leetcodeService");
const { getCodeforcesStats } = require('../services/codeforces/codeforcesService');
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
      .lean()
      .exec();

    const roomsWithUnreadCount = await Promise.all(
      rooms.map(async (room) => {

        const lastSeen = await LastSeen.findOne({ user: userId, room: room._id });

        let unreadCount = 0;

        const lastMessage = await Message.findOne({ room: room._id })
          .sort({ createdAt: -1 })
          .lean();

        if (lastSeen && lastSeen.lastSeenMessage) {

          if (lastMessage && lastSeen.lastSeenMessage.toString() === lastMessage._id.toString()) {
            unreadCount = 0;
          }
          else {
            const lastSeenMessage = await Message.findById(lastSeen.lastSeenMessage);

            if (lastSeenMessage) {
              unreadCount = await Message.countDocuments({
                room: room._id,
                createdAt: { $gt: lastSeenMessage.createdAt },
                sender: { $ne: userId } // ← ADD THIS: Exclude messages sent by the user themselves
              });
            } else {
              unreadCount = await Message.countDocuments({
                room: room._id,
                sender: { $ne: userId } // ← ADD THIS: Exclude user's own messages
              });
            }
          }
        } else {
          unreadCount = await Message.countDocuments({
            room: room._id,
            sender: { $ne: userId } // ← ADD THIS: Exclude user's own messages
          });
        }

        return {
          ...room,
          unreadCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender
          } : null
        };
      })
    );

    res.json({ rooms: roomsWithUnreadCount });
  } catch (error) {
    console.error("Error fetching user's rooms:", error);
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
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating room", error: error.message });
  }
};

exports.updateLastSeenMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isMember(room, userId)) {
      return res.status(403).json({ message: "You are not a member of this room" });
    }

    const lastMessage = await Message.findOne({ room: room._id }).sort({ createdAt: -1 });

    if (!lastMessage) {
      return res.status(200).json({ message: "No messages in the room to mark as seen." });
    }

    await LastSeen.findOneAndUpdate(
      { user: userId, room: room._id },
      { lastSeenMessage: lastMessage._id },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Last seen message updated successfully." });
  } catch (error) {
    console.error("Error updating last seen message:", error);
    res.status(500).json({ message: "Error updating last seen message", error: error.message });
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
    const { roomId } = req.params;
    const userId = req.user?._id;

    const room = await Room.findOne({ roomId })
      .populate("members", "username profilePicture")
      .populate("admins", "username profilePicture")
      .populate("creator", "username")
      .lean(); // ✔️ Faster response

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isMember =
      room.members?.some((m) => String(m._id) === String(userId)) ||
      room.admins?.some((a) => String(a._id) === String(userId)) ||
      String(room.creator?._id) === String(userId);

    if (!room.isPublic && !isMember) {
      return res.status(403).json({
        message: "You don't have permission to view this room",
      });
    }

    // Build the final response object (same format + platformStats added)
    const roomDetails = {
      _id: room._id,
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      createdAt: room.createdAt,
      createdBy: room.creator?.username || "Unknown",
      admins: room.admins,
      members: room.members,
      maxMembers: room.maxMembers,

      // ✔️ Include platformStats for frontend use
      platformStats: {
        leetcode: {
          lastUpdated: room.platformStats?.leetcode?.lastUpdated || null,
          updateStatus: room.platformStats?.leetcode?.updateStatus || 'idle',
        },
        codeforces: {
          lastUpdated: room.platformStats?.codeforces?.lastUpdated || null,
          updateStatus: room.platformStats?.codeforces?.updateStatus || 'idle',
        },
      }
    };

    res.json(roomDetails);
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).json({
      message: "Error fetching room details",
      error: error.message,
    });
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
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.updateRoomMembersLeetCodeStats = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isMember(room, userId) && !room.admins.includes(userId)) {
      return res.status(403).json({ message: "You don't have permission to update this room's stats" });
    }

    // Check if last update was less than 2 days ago
    const lastUpdate = room.platformStats?.leetcode?.lastUpdated;
    if (lastUpdate) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      if (lastUpdate > twoDaysAgo) {
        return res.status(200).json({
          message: "LeetCode stats were recently updated",
          lastUpdated: lastUpdate,
          nextUpdateAvailable: new Date(lastUpdate.getTime() + (2 * 24 * 60 * 60 * 1000))
        });
      }
    }

    // Set status to updating
    await Room.findByIdAndUpdate(room._id, {
      'platformStats.leetcode.updateStatus': 'updating'
    });

    const members = await User.find({ _id: { $in: room.members } });

    const updateResults = {
      success: [],
      failed: []
    };

    for (const member of members) {
      const leetcodeUsernameRaw = member.platforms?.leetcode?.username;

      if (!leetcodeUsernameRaw) {
        updateResults.failed.push({
          username: member.username,
          reason: "LeetCode username not set"
        });
        continue;
      }

      const leetcodeUsername = leetcodeUsernameRaw.trim();

      try {
        const apiResponse = await getLeetCodeStats(leetcodeUsername);

        // Optional: Normalize stored username case if it differs
        if (
          apiResponse.leetcodeUsername &&
          apiResponse.leetcodeUsername !== leetcodeUsername
        ) {
          await User.findOneAndUpdate(
            { _id: member._id },
            { $set: { "platforms.leetcode.username": apiResponse.leetcodeUsername } }
          );
        }

        const {
          totalQuestionsSolved,
          questionsSolvedByDifficulty,
          attendedContestsCount,
          contestRating
        } = apiResponse;

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

        // Delay to reduce chance of rate limit
        await delay(1000);

      } catch (error) {
        if (error.name === "PlatformUsernameError") {
          updateResults.failed.push({
            username: member.username,
            reason: error.message
          });
        } else if (error.message.toLowerCase().includes("rate limit")) {
          console.warn("Rate limit detected. Stopping further updates.");
          updateResults.failed.push({
            username: member.username,
            reason: "LeetCode rate limit reached. Try again later."
          });
          // Update status to failed
          await Room.findByIdAndUpdate(room._id, {
            'platformStats.leetcode.updateStatus': 'failed'
          });
          break; // Stop further processing to avoid hitting hard limits
        } else {
          console.error(`Error updating LeetCode stats for ${member.username}:`, error);
          updateResults.failed.push({
            username: member.username,
            reason: "Unexpected error: " + error.message
          });
        }
      }
    }

    // Update lastUpdated and status
    await Room.findByIdAndUpdate(room._id, {
      'platformStats.leetcode.lastUpdated': new Date(),
      'platformStats.leetcode.updateStatus': 'idle'
    });

    return res.status(200).json({
      message: "LeetCode stats update completed",
      results: updateResults,
      lastUpdated: new Date()
    });
  } catch (error) {
    // Update status to failed in case of error
    if (room) {
      await Room.findByIdAndUpdate(room._id, {
        'platformStats.leetcode.updateStatus': 'failed'
      });
    }
    console.error("Error updating room members' LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};





exports.updateRoomMembersCodeforcesStats = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isMember(room, userId) && !room.admins.includes(userId)) {
      return res.status(403).json({ message: "You don't have permission to update this room's stats" });
    }

    // Check if last update was less than 2 days ago
    const lastUpdate = room.platformStats?.codeforces?.lastUpdated;
    if (lastUpdate) {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      if (lastUpdate > twoDaysAgo) {
        return res.status(200).json({
          message: "Codeforces stats were recently updated",
          lastUpdated: lastUpdate,
          nextUpdateAvailable: new Date(lastUpdate.getTime() + (2 * 24 * 60 * 60 * 1000))
        });
      }
    }

    // Set status to updating
    await Room.findByIdAndUpdate(room._id, {
      'platformStats.codeforces.updateStatus': 'updating'
    });

    const members = await User.find({ _id: { $in: room.members } });

    const updateResults = {
      success: [],
      failed: []
    };

    for (const member of members) {
      const rawUsername = member.platforms?.codeforces?.username;

      if (!rawUsername) {
        updateResults.failed.push({
          username: member.username,
          reason: "Codeforces username not set"
        });
        continue;
      }

      const codeforcesUsername = rawUsername.trim();

      try {
        const stats = await getCodeforcesStats(codeforcesUsername);

        // Normalize username if case changed
        if (stats.username && stats.username !== codeforcesUsername) {
          await User.findOneAndUpdate(
            { _id: member._id },
            { $set: { "platforms.codeforces.username": stats.username } }
          );
        }

        const statsToUpdate = {
          "platforms.codeforces.currentRating": stats.currentRating,
          "platforms.codeforces.maxRating": stats.maxRating,
          "platforms.codeforces.rank": stats.rank,
          "platforms.codeforces.maxRank": stats.maxRank,
          "platforms.codeforces.contribution": stats.contribution,
          "platforms.codeforces.friendOfCount": stats.friendOfCount,
        };

        await User.findOneAndUpdate(
          { _id: member._id },
          { $set: statsToUpdate },
          { runValidators: true }
        );

        updateResults.success.push(member.username);

        await delay(500); // Slight delay to be respectful of API limits

      } catch (error) {
        if (error.name === "PlatformUsernameError") {
          updateResults.failed.push({
            username: member.username,
            reason: error.message
          });
        } else {
          console.error(`Error updating Codeforces stats for ${member.username}:`, error);
          updateResults.failed.push({
            username: member.username,
            reason: "Unexpected error: " + error.message
          });
        }
      }
    }

    // Update lastUpdated and status
    await Room.findByIdAndUpdate(room._id, {
      'platformStats.codeforces.lastUpdated': new Date(),
      'platformStats.codeforces.updateStatus': 'idle'
    });

    return res.status(200).json({
      message: "Codeforces stats update completed",
      results: updateResults,
      lastUpdated: new Date()
    });
  } catch (error) {
    // Update status to failed in case of error
    if (room) {
      await Room.findByIdAndUpdate(room._id, {
        'platformStats.codeforces.updateStatus': 'failed'
      });
    }
    console.error("Error updating room members' Codeforces stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
