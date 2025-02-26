const mongoose = require("mongoose");
const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true },
    description: { type: String },
    displayPicture: {
      type: String,
      default: null
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: { type: Boolean, default: true },
    maxMembers: { type: Number, default: 50 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isAdminOnlyMode: {
      type: Boolean,
      default: false,
    },
    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    invite: {
      code: {
        type: String,
        unique: true,
        sparse: true,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      expiresAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;