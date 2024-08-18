const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Importing the User model
const Room = require("../models/Room"); // Importing the Room model
const { getLeetCodeStats } = require("../services/leetcodeService"); // Importing the LeetCode service

// Utility function to generate an invite code (replace with your implementation)
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// User Registration
const registerUser = async (req, res) => {
  const { username, email, password, leetcodeUsername } = req.body;
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the hashed password
    const user = new User({
      username,
      email,
      password: hashedPassword,
      leetcodeUsername,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// User Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt for email:", email);

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Password matched for email:", email);

    // Generate JWT (JSON Web Token)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("JWT token generated for user:", user._id);

    // Return success message with token
    res.status(200).json({ message: "User logged in successfully", token });
  } catch (error) {
    console.error("Server error during login:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update LeetCode Statistics for a User
const updateLeetCodeStats = async (req, res) => {
  const { leetcodeUsername } = req.user; // Assume the user is already authenticated and their username is available
  try {
    // Fetch the latest stats from LeetCode
    const stats = await getLeetCodeStats(leetcodeUsername);

    // Update the user's stats in the database
    await User.findOneAndUpdate(
      { leetcodeUsername },
      {
        totalQuestionsSolved: stats.totalQuestionsSolved,
        totalContestsGiven: stats.totalContestsGiven,
        questionsSolvedByDifficulty: stats.questionsSolvedByDifficulty,
      }
    );

    res
      .status(200)
      .json({ message: "LeetCode stats updated successfully", stats });
  } catch (error) {
    console.error("Error updating LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new room
const createRoom = async (req, res) => {
  const { roomName } = req.body;
  try {
    const newRoom = new Room({
      roomName,
      createdBy: req.user.id, // Ensure req.user.id is available
      members: [req.user.id], // Add the creator as a member
      inviteCode: generateInviteCode(), // Generate invite code
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

// Join a room
const joinRoom = async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (room.members.includes(req.user.id)) {
      return res.status(400).json({ message: "Already a member of the room" });
    }
    room.members.push(req.user.id);
    await room.save();
    res.status(200).json({ message: "Joined room successfully", room });
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all rooms for a user
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id });
    res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error retrieving rooms:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Leave a room
const leaveRoom = async (req, res) => {
  const { roomId } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    room.members = room.members.filter(
      (memberId) => memberId.toString() !== req.user.id.toString()
    );
    await room.save();
    res.status(200).json({ message: "Left room successfully", room });
  } catch (error) {
    console.error("Error leaving room:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign admin role
const assignAdmin = async (req, res) => {
  const { roomId, userId } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.admins.includes(userId)) {
      room.admins.push(userId);
      await room.save();
      res.status(200).json({ message: "Admin assigned successfully", room });
    } else {
      res.status(400).json({ message: "User is already an admin" });
    }
  } catch (error) {
    console.error("Error assigning admin:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Accept join request
const acceptJoinRequest = async (req, res) => {
  const { roomId, userId } = req.body;
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
      res.status(200).json({ message: "Join request accepted", room });
    } else {
      res.status(400).json({ message: "User is already a member" });
    }
  } catch (error) {
    console.error("Error accepting join request:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get members of a room
const getRoomMembers = async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await Room.findById(roomId).populate("members");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json({ members: room.members });
  } catch (error) {
    console.error("Error retrieving room members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Sort members of a room
const sortRoomMembers = async (req, res) => {
  const { roomId } = req.params;
  const { sortBy, difficulty } = req.query;

  try {
    const room = await Room.findById(roomId).populate("members");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    let members = room.members;

    switch (sortBy) {
      case "totalQuestionsSolved":
        members.sort((a, b) => b.totalQuestionsSolved - a.totalQuestionsSolved);
        break;
      case "totalContestsGiven":
        members.sort((a, b) => b.totalContestsGiven - a.totalContestsGiven);
        break;
      case "difficulty":
        if (
          difficulty === "easy" ||
          difficulty === "medium" ||
          difficulty === "hard"
        ) {
          members.sort(
            (a, b) =>
              b.questionsSolvedByDifficulty[difficulty] -
              a.questionsSolvedByDifficulty[difficulty]
          );
        } else {
          return res.status(400).json({ message: "Invalid difficulty level" });
        }
        break;
      default:
        return res.status(400).json({ message: "Invalid sort option" });
    }

    res.status(200).json({ members });
  } catch (error) {
    console.error("Error sorting room members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update User Settings
const updateUserSettings = async (req, res) => {
  const { username, password, leetcodeUsername, email } = req.body;
  try {
    const updateData = { username, leetcodeUsername, email };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });

    res
      .status(200)
      .json({ message: "User settings updated successfully", user });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Exporting all functions
module.exports = {
  registerUser,
  loginUser,
  updateLeetCodeStats,
  createRoom,
  joinRoom,
  getAllRooms,
  leaveRoom,
  assignAdmin,
  acceptJoinRequest,
  getRoomMembers,
  sortRoomMembers,
  updateUserSettings,
};
