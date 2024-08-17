const Room = require("../models/Room");
const User = require("../models/User");

// Create Room
exports.createRoom = async (req, res) => {
  const { roomName } = req.body;
  const userId = req.user.id;

  try {
    // Generate a unique invite code for the room
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newRoom = new Room({
      roomName,
      createdBy: userId,
      members: [userId],
      inviteCode,
    });

    await newRoom.save();

    res
      .status(201)
      .json({ message: "Room created successfully", room: newRoom });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Join Room
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

    // Add the user to the room's members
    room.members.push(userId);
    await room.save();

    res.status(200).json({ message: "Joined room successfully", room });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// leaderboard added

// Get All Rooms for a User with LeetCode Stats
exports.getAllRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await Room.find({ members: userId }).populate(
      "members",
      "username leetcodeStats"
    );

    // For each room, sort members by their LeetCode stats
    const roomsWithSortedMembers = rooms.map((room) => {
      room.members.sort(
        (a, b) =>
          b.leetcodeStats.problemsSolved - a.leetcodeStats.problemsSolved
      );
      return room;
    });

    res.status(200).json(roomsWithSortedMembers);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Leave Room
exports.leaveRoom = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user.id;

  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.members = room.members.filter(
      (member) => member.toString() !== userId
    );
    await room.save();

    res.status(200).json({ message: "Left room successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Assign Admin
exports.assignAdmin = async (req, res) => {
  const { roomId, userIdToAssign } = req.body;
  const userId = req.user.id;

  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Ensure that the user assigning admin privileges is either the creator or an existing admin
    if (room.createdBy.toString() !== userId && !room.admins.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to assign admins" });
    }

    // Convert ObjectId to strings before checking membership
    if (
      !room.members.map((member) => member.toString()).includes(userIdToAssign)
    ) {
      return res
        .status(400)
        .json({ message: "User is not a member of this room" });
    }

    // Promote the user to admin if they are not already
    if (!room.admins.includes(userIdToAssign)) {
      room.admins.push(userIdToAssign);
      await room.save();
      return res
        .status(200)
        .json({ message: "User promoted to admin successfully" });
    } else {
      return res.status(400).json({ message: "User is already an admin" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Accept Join Request
exports.acceptJoinRequest = async (req, res) => {
  const { roomId, userIdToAccept } = req.body;
  const userId = req.user.id;

  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.admins.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept join requests" });
    }

    if (!room.members.includes(userIdToAccept)) {
      room.members.push(userIdToAccept);
      await room.save();
      return res
        .status(200)
        .json({ message: "User added to the room successfully" });
    } else {
      return res
        .status(400)
        .json({ message: "User is already a member of the room" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
