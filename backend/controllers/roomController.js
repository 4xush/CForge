const Room = require("../models/Room");
const User = require("../models/User");

exports.createRoom = async (req, res) => {
  const { roomName, inviteCode } = req.body;
  const createdBy = req.user.id;
  try {
    const newRoom = new Room({
      roomName,
      createdBy,
      inviteCode,
      members: [createdBy],
      admins: [createdBy],
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

exports.joinRoom = async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.user.id;
  try {
    const room = await Room.findOne({ inviteCode });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
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

exports.getAllRooms = async (req, res) => {
  const userId = req.user.id;
  try {
    const rooms = await Room.find({
      $or: [{ members: userId }, { admins: userId }],
    }).populate({
      path: "members admins",
      select: "-password", // Exclude the password field
    });
    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.leaveRoom = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user.id;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    room.members = room.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );
    room.admins = room.admins.filter(
      (adminId) => adminId.toString() !== userId.toString()
    );
    await room.save();
    res.status(200).json({ message: "Left room successfully", room });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.assignAdmin = async (req, res) => {
  const { roomId, userId } = req.body;
  const adminId = req.user.id;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.admins.includes(adminId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
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

exports.acceptJoinRequest = async (req, res) => {
  const { roomId, userId } = req.body;
  const adminId = req.user.id;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.admins.includes(adminId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
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

exports.getRoomMembers = async (req, res) => {
  const { roomId } = req.query;
  const userId = req.user.id;
  try {
    const room = await Room.findById(roomId).populate({
      path: "members",
      select: "-password", // Exclude the password field
    });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    res.status(200).json({ members: room.members });
  } catch (error) {
    console.error("Error getting room members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.sortRoomMembers = async (req, res) => {
  const { roomId } = req.params;
  const { sortBy } = req.query;
  const userId = req.user.id;
  try {
    const room = await Room.findById(roomId).populate({
      path: "members",
      select: "-password", // Exclude the password field
    });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.members.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    let members = room.members;
    members = sortMembers(members, sortBy);
    res.status(200).json({ members });
  } catch (error) {
    console.error("Error sorting room members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

function sortMembers(members, sortBy) {
  const sortingCriteria = {
    totalQuestionsSolved: (a, b) =>
      b.totalQuestionsSolved - a.totalQuestionsSolved,
    totalContestsGiven: (a, b) =>
      b.attendedContestsCount - a.attendedContestsCount,
    contestRating: (a, b) => b.contestRating - a.contestRating,
    difficultyEasy: (a, b) =>
      b.questionsSolvedByDifficulty.easy - a.questionsSolvedByDifficulty.easy,
    difficultyMedium: (a, b) =>
      b.questionsSolvedByDifficulty.medium -
      a.questionsSolvedByDifficulty.medium,
    difficultyHard: (a, b) =>
      b.questionsSolvedByDifficulty.hard - a.questionsSolvedByDifficulty.hard,
  };
  return members.sort(sortingCriteria[sortBy] || ((a, b) => 0));
}
