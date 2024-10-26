const express = require("express");
const router = express.Router();

const {
  generateRoomInvite
} = require("../controllers/roomInviteController");

const { protect } = require("../middleware/authMiddleware");

// console.log(typeof approveJoinRequest);
router.post('/:roomId/invite', protect, generateRoomInvite);


module.exports = router;
// http://localhost:5173/rooms/join/5d7d8fd615