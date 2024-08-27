const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark"],
        default: "light",
      },
      language: {
        type: String,
        default: "en",
      },
    },
    platforms: {
      leetcode: {
        username: {
          type: String,
          unique: true,
          sparse: true,
        },
        totalQuestionsSolved: {
          type: Number,
          default: 0,
        },
        questionsSolvedByDifficulty: {
          easy: { type: Number, default: 0 },
          medium: { type: Number, default: 0 },
          hard: { type: Number, default: 0 },
        },
        attendedContestsCount: {
          type: Number,
          default: 0,
        },
        contestRating: {
          type: Number,
          default: 0,
        },
      },
      // Other platforms can be added here
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for rooms the user is a member of
userSchema.virtual("rooms", {
  ref: "Room",
  localField: "_id",
  foreignField: "members",
});

// Virtual for rooms created by the user
userSchema.virtual("createdRooms", {
  ref: "Room",
  localField: "_id",
  foreignField: "creator",
});

// Indexes for performance optimization
userSchema.index({ "platforms.leetcode.totalQuestionsSolved": -1 });
userSchema.index({ "platforms.leetcode.contestRating": -1 });
userSchema.index({ "platforms.leetcode.username": 1 }, { sparse: true });
userSchema.index({ "platforms.leetcode.attendedContestsCount": -1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
