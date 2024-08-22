const express = require("express");
const {
  createRoom,
  joinRoom,
  getAllRooms,
  leaveRoom,
  assignAdmin,
  acceptJoinRequest,
  getRoomMembers,
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getRoomMessages,
} = require("../controllers/messageController");

const router = express.Router();

// Route to create a new room
router.post("/create", protect, createRoom);

// Route to join a room using an invite code
router.post("/join", protect, joinRoom);

// Route to get all rooms for a logged-in user
router.get("/", protect, getAllRooms);

// Route to leave a room
router.post("/leave", protect, leaveRoom);

// Route to assign a user as admin
router.post("/assign-admin", protect, assignAdmin);

// Route for an admin to accept a join request
router.post("/accept-join", protect, acceptJoinRequest);

// Route to get members of a room (including sorting)
router.get("/members", protect, getRoomMembers);

// Route to send a message to a room
router.post("/:roomId/messages", protect, sendMessage);

// Route to get all messages in a room
router.get("/:roomId/messages", protect, getRoomMessages);

module.exports = router;
