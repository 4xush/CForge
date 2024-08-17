const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Add admins field
  inviteCode: { type: String, unique: true, required: true },
});

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
