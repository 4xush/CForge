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
    platformStats: {
      leetcode: {
        lastUpdated: { type: Date, default: null },
        lastUpdateStarted: { type: Date, default: null },
        updateStatus: { type: String, enum: ['idle', 'updating', 'completed', 'failed'], default: 'idle' },
        lastResults: {
          total: { type: Number, default: 0 },
          processed: { type: Number, default: 0 },
          successful: { type: Number, default: 0 },
          failed: { type: Number, default: 0 },
          skipped: { type: Number, default: 0 },
          fromCache: { type: Number, default: 0 },
          processingTime: { type: Number, default: 0 },
          warnings: [{ type: String }]
        },
        lastError: { type: String, default: null },
        updateCount: { type: Number, default: 0 },
        rateLimitInfo: {
          lastRefresh: { type: Date, default: null },
          nextAllowedRefresh: { type: Date, default: null }
        }
      },
      codeforces: {
        lastUpdated: { type: Date, default: null },
        lastUpdateStarted: { type: Date, default: null },
        updateStatus: { type: String, enum: ['idle', 'updating', 'completed', 'failed'], default: 'idle' },
        lastResults: {
          total: { type: Number, default: 0 },
          processed: { type: Number, default: 0 },
          successful: { type: Number, default: 0 },
          failed: { type: Number, default: 0 },
          skipped: { type: Number, default: 0 },
          fromCache: { type: Number, default: 0 },
          processingTime: { type: Number, default: 0 },
          warnings: [{ type: String }]
        },
        lastError: { type: String, default: null },
        updateCount: { type: Number, default: 0 },
        rateLimitInfo: {
          lastRefresh: { type: Date, default: null },
          nextAllowedRefresh: { type: Date, default: null }
        }
      },
      github: {
        lastUpdated: { type: Date, default: null },
        lastUpdateStarted: { type: Date, default: null },
        updateStatus: { type: String, enum: ['idle', 'updating', 'completed', 'failed'], default: 'idle' },
        lastResults: {
          total: { type: Number, default: 0 },
          processed: { type: Number, default: 0 },
          successful: { type: Number, default: 0 },
          failed: { type: Number, default: 0 },
          skipped: { type: Number, default: 0 },
          fromCache: { type: Number, default: 0 },
          processingTime: { type: Number, default: 0 },
          warnings: [{ type: String }]
        },
        lastError: { type: String, default: null },
        updateCount: { type: Number, default: 0 },
        rateLimitInfo: {
          lastRefresh: { type: Date, default: null },
          nextAllowedRefresh: { type: Date, default: null }
        }
      }
    }
  },
  { timestamps: true }
);
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;