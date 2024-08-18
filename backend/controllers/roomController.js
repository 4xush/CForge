const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Importing the User model
const Room = require("../models/Room"); // Importing the Room model
const { getLeetCodeStats } = require("../services/leetcodeService"); // Importing the LeetCode service

// Create a new room
exports.createRoom = async (req, res) => {
  const { roomName, inviteCode } = req.body;
  const createdBy = req.user.id; // Get the ID of the logged-in user

  try {
    const newRoom = new Room({
      roomName,
      createdBy,
      inviteCode,
      members: [createdBy], // Add creator to members
      admins: [createdBy], // Add creator as admin
    });

    await newRoom.save();
    res
      .status(201)
      .json({ message: "Room created successfully", room: newRoom });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Join a room using invite code
exports.joinRoom = async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.user.id; // Get the ID of the logged-in user

  try {
    const room = await Room.findOne({ inviteCode });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is already a member
    if (room.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this room" });
    }

    room.members.push(userId);
    await room.save();

    res.status(200).json({ message: "Joined room successfully", room });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all rooms for a logged-in user
exports.getAllRooms = async (req, res) => {
  const userId = req.user.id; // Get the ID of the logged-in user

  try {
    const rooms = await Room.find({
      $or: [{ members: userId }, { admins: userId }],
    }).populate("members admins");

    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Leave a room
exports.leaveRoom = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user.id; // Get the ID of the logged-in user

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Remove user from members
    room.members = room.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    // Check if the user is an admin
    if (room.admins.includes(userId)) {
      room.admins = room.admins.filter(
        (adminId) => adminId.toString() !== userId.toString()
      );
      // Optionally, assign a new admin if necessary
    }

    await room.save();
    res.status(200).json({ message: "Left room successfully", room });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign a user as admin
exports.assignAdmin = async (req, res) => {
  const { roomId, userId } = req.body;
  const adminId = req.user.id; // Get the ID of the logged-in user

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the requesting user is an admin
    if (!room.admins.includes(adminId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add the user to admins
    if (!room.admins.includes(userId)) {
      room.admins.push(userId);
    }

    await room.save();
    res.status(200).json({ message: "Admin assigned successfully", room });
  } catch (error) {
    console.error("Error assigning admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Accept a join request
exports.acceptJoinRequest = async (req, res) => {
  const { roomId, userId } = req.body;
  const adminId = req.user.id; // Get the ID of the logged-in user

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the requesting user is an admin
    if (!room.admins.includes(adminId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Add the user to members
    if (!room.members.includes(userId)) {
      room.members.push(userId);
    }

    await room.save();
    res.status(200).json({ message: "Join request accepted", room });
  } catch (error) {
    console.error("Error accepting join request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get members of a room with sorting
exports.getRoomMembers = async (req, res) => {
  const { roomId, sortBy } = req.query;
  const userId = req.user.id; // Get the ID of the logged-in user

  try {
    const room = await Room.findById(roomId).populate("members");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is a member of the room
    if (!room.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let members = await User.find({ _id: { $in: room.members } });

    // Sort members based on query parameter
    if (sortBy === "totalQuestionsSolved") {
      members = members.sort(
        (a, b) => b.totalQuestionsSolved - a.totalQuestionsSolved
      );
    } else if (sortBy === "totalContestsGiven") {
      members = members.sort(
        (a, b) => b.attendedContestsCount - a.attendedContestsCount
      );
    } else if (sortBy === "contestRating") {
      // Assuming you have a field for contestRating in User schema
      members = members.sort((a, b) => b.contestRating - a.contestRating);
    } else if (sortBy === "difficultyEasy") {
      members = members.sort(
        (a, b) =>
          b.questionsSolvedByDifficulty.easy -
          a.questionsSolvedByDifficulty.easy
      );
    } else if (sortBy === "difficultyMedium") {
      members = members.sort(
        (a, b) =>
          b.questionsSolvedByDifficulty.medium -
          a.questionsSolvedByDifficulty.medium
      );
    } else if (sortBy === "difficultyHard") {
      members = members.sort(
        (a, b) =>
          b.questionsSolvedByDifficulty.hard -
          a.questionsSolvedByDifficulty.hard
      );
    }

    res.status(200).json({ members });
  } catch (error) {
    console.error("Error getting room members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Sort members of a room
exports.sortRoomMembers = async (req, res) => {
  const { roomId } = req.params;
  const { sortBy } = req.query;
  const userId = req.user.id; // Get the ID of the logged-in user

  try {
    const room = await Room.findById(roomId).populate("members");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is a member of the room
    if (!room.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    let members = await User.find({ _id: { $in: room.members } });

    // Sort members based on query parameter
    if (sortBy === "totalQuestionsSolved") {
      members = members.sort(
        (a, b) => b.totalQuestionsSolved - a.totalQuestionsSolved
      );
    } else if (sortBy === "totalContestsGiven") {
      members = members.sort(
        (a, b) => b.attendedContestsCount - a.attendedContestsCount
      );
    } else if (sortBy === "contestRating") {
      members = members.sort((a, b) => b.contestRating - a.contestRating);
    } else if (sortBy === "difficultyEasy") {
      members = members.sort(
        (a, b) =>
          b.questionsSolvedByDifficulty.easy -
          a.questionsSolvedByDifficulty.easy
      );
    } else if (sortBy === "difficultyMedium") {
      members = members.sort(
        (a, b) =>
          b.questionsSolvedByDifficulty.medium -
          a.questionsSolvedByDifficulty.medium
      );
    } else if (sortBy === "difficultyHard") {
      members = members.sort(
        (a, b) =>
          b.questionsSolvedByDifficulty.hard -
          a.questionsSolvedByDifficulty.hard
      );
    }

    res.status(200).json({ members });
  } catch (error) {
    console.error("Error sorting room members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
