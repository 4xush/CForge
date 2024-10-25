const express = require("express");
const router = express.Router();

const {
  generateRoomInvite,
  verifyRoomInvite,
  joinRoomByInvite
} = require("../controllers/roomInviteController");

const { protect } = require("../middleware/authMiddleware");

// console.log(typeof approveJoinRequest);
router.post('/:roomId/invite', protect, generateRoomInvite);
router.get('/invite/:inviteCode/verify', verifyRoomInvite);
router.post('/invite/:inviteCode/join', protect, joinRoomByInvite);


module.exports = router;
// http://localhost:5173/rooms/join/5d7d8fd615