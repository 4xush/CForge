const Room = require("../models/Room");
const User = require("../models/User");

// Helper function to check if a user is a member of a room
const isMember = (room, userId) => {
  return room.members.some((member) => member.toString() === userId.toString());
};

// Helper function to check if there's space in the room
const hasAvailableSpace = (room) => {
  return room.members.length < room.maxMembers;
};

exports.getAllRoomsForUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({ members: userId })
      .select("roomId name description isPublic members admins")
      .exec();

    res.json({ rooms });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user's rooms", error: error.message });
  }
};

const shortid = require('shortid');

exports.createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, roomId } = req.body;
    const creator = req.user._id;

    // Use the custom roomId if provided, otherwise generate a shortid
    const newRoomId = roomId || shortid.generate();

    const newRoom = new Room({
      name,
      description,
      creator,
      isPublic,
      admins: [creator],
      members: [creator],
      roomId: newRoomId, // Ensure roomId is properly set
    });

    await newRoom.save();
    res
      .status(201)
      .json({ message: "Room created successfully", room: newRoom });
    console.log("Room created with ID:", newRoomId);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating room", error: error.message });
  }
};

exports.leaveRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isMember(room, userId)) {
      return res.status(400).json({ message: "You are not a member of this room" });
    }

    // Remove the user from the room's members
    room.members = room.members.filter((member) => member.toString() !== userId.toString());

    await room.save();

    res.json({ message: "You have left the room successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error leaving room", error: error.message });
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
      .populate("admins", "username profilePicture");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isPublic && !isMember(room, req.user._id)) {
      return res
        .status(403)
        .json({ message: "You don't have permission to view this room" });
    }

    // Separate admins and members for clarity
    const admins = room.admins.map((admin) => ({
      _id: admin._id,
      username: admin.username,
      profilePicture: admin.profilePicture,
    }));

    const members = room.members.map((member) => ({
      _id: member._id,
      username: member.username,
      profilePicture: member.profilePicture,
    }));

    // Additional room info, like creation date or creator
    const roomDetails = {
      _id: room._id,
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      isPublic: room.isPublic,
      createdAt: room.createdAt, // Assuming `createdAt` exists in the schema
      createdBy: room.creator, // Assuming `createdBy` exists in the schema
      admins: admins,
      members: members,
    };

    res.json(roomDetails);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching room details", error: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the room creator can delete the room" });
    }

    await Room.findByIdAndDelete(room._id);
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting room", error: error.message });
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
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.isPublic) {
      if (!hasAvailableSpace(room)) {
        return res.status(400).json({ message: "The room is full" });
      }
      room.members.push(req.user._id);
      await room.save();
      return res.json({ message: "You have joined the room successfully" });
    }

    if (isMember(room, req.user._id)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this room" });
    }

    const existingRequest = room.joinRequests.find(
      (request) => request.user.toString() === req.user._id.toString()
    );
    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "You have already sent a join request" });
    }

    if (!hasAvailableSpace(room)) {
      return res.status(400).json({ message: "The room is full" });
    }

    room.joinRequests.push({ user: req.user._id });
    await room.save();
    res.json({ message: "Join request sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending join request", error: error.message });
  }
};
