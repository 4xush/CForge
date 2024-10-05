const mongoose = require("mongoose");
const shortid = require("shortid"); // You'll need to install this package: npm install shortid

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true, // Ensures the roomId is unique
      index: true, // Creates an index on roomId for faster lookups
      default: shortid.generate,
    },
    name: { type: String, required: true },
    description: { type: String },
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
      default: false, // By default, room is not in admin-only mode
    },
    mutedUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        muteUntil: {
          type: Date, // The time until the user is muted
        },
      },
    ],
    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
