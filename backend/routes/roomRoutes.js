const express = require("express");
const {
  createRoom,
  joinRoom,
  getAllRooms,
  leaveRoom,
  assignAdmin,
  acceptJoinRequest, // Add this line
} = require("../controllers/roomController");
const { protect } = require("../middleware/authMiddleware");

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
router.post("/accept-join", protect, acceptJoinRequest); // Add this line

module.exports = router;
