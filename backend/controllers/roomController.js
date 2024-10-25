const Room = require("../models/Room");
const User = require("../models/User");
const shortid = require('shortid');

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


exports.createRoom = async (req, res) => {
  try {
    const { name, description, isPublic, roomId } = req.body;
    // Use the custom roomId if provided, otherwise generate a shortid
    const newRoomId = roomId || shortid.generate();

    const newRoom = new Room({
      name,
      description,
      creator: req.user._id,
      isPublic,
      admins: [req.user._id],
      members: [req.user._id],
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
    const { roomId } = req.params; // Assuming roomId is passed as a parameter
    const userId = req.user._id; // Get the ID of the user trying to leave

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
    // Check if the room is private and the user is neither an admin nor a member
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
    const { roomId } = req.params;
    const { _id: userId } = req.user;

    // Find the room by its roomId
    const room = await Room.findOne({ roomId });

    // Check if the room exists
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is already a member of the room
    if (isMember(room, userId)) {
      return res.status(400).json({ message: "You are already a member of this room" });
    }

    // Check if the room has available space (applies to both public and private rooms)
    if (!hasAvailableSpace(room)) {
      return res.status(400).json({ message: "The room is full" });
    }

    // Public Room Logic: Directly add user if room is public
    if (room.isPublic) {
      room.members.push(userId);
      await room.save();
      return res.json({ message: "You have joined the room successfully" });
    }

    // Private Room Logic: Check for existing join requests
    const existingRequest = room.joinRequests.find(request => request.user.toString() === userId.toString());
    if (existingRequest) {
      return res.status(400).json({ message: "You have already sent a join request" });
    }

    // If no join request exists, add the user’s join request for private rooms
    room.joinRequests.push({ user: userId });
    await room.save();

    return res.json({ message: "Join request sent successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Error sending join request", error: error.message });
  }
};

exports.joinViaInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;

    // Find room with this invite code
    const room = await Room.findOne({
      'invites.code': inviteCode
    });

    if (!room) {
      return res.status(404).json({ message: "Invalid invite link" });
    }

    // Check if user is already a member
    if (room.members.includes(userId)) {
      return res.status(400).json({ message: "You are already a member of this room" });
    }

    // Find the specific invite
    const invite = room.invites.find(inv => inv.code === inviteCode);

    // Validate invite
    if (!isInviteValid(invite)) {
      return res.status(400).json({ message: "This invite link has expired or is no longer valid" });
    }

    // Check room capacity
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Add member and update invite usage
    room.members.push(userId);
    invite.uses += 1;

    // Disable invite if max uses reached
    if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
      invite.isActive = false;
    }

    await room.save();

    res.json({ message: "Successfully joined the room" });
  } catch (error) {
    res.status(500).json({ message: "Error joining room", error: error.message });
  }
};