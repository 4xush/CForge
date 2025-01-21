const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
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
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    profilePicture: {
      type: String,
      default: "",
    },
    socialNetworks: {
      linkedin: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      }
    },
    isProfileComplete: {
      type: Boolean,
      default: false
    },
    platforms: {
      codeforces: {
        username: {
          type: String,
          sparse: true,
        },
        currentRating: {
          type: Number,
          default: 0,
        },
        maxRating: {
          type: Number,
          default: 0,
        },
        rank: {
          type: String,
          default: "",
        },
        maxRank: {
          type: String,
          default: "",
        },
        contribution: {
          type: Number,
          default: 0,
        },
        friendOfCount: {
          type: Number,
          default: 0,
        },
      },
      github: {
        username: {
          type: String,
          sparse: true,
        },
        publicRepos: {
          type: Number,
          default: 0,
        },
        followers: {
          type: Number,
          default: 0,
        },
        following: {
          type: Number,
          default: 0,
        },
      },
      leetcode: {
        username: {
          type: String,
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
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual properties for rooms
userSchema.virtual("rooms", {
  ref: "Room",
  localField: "_id",
  foreignField: "members",
});

userSchema.virtual("createdRooms", {
  ref: "Room",
  localField: "_id",
  foreignField: "creator",
});

// Indexes for performance optimization
userSchema.index({ "platforms.leetcode.totalQuestionsSolved": -1 });
userSchema.index({ "platforms.leetcode.contestRating": -1 });
userSchema.index({ "platforms.leetcode.username": 1 }, { sparse: false });
userSchema.index({ "platforms.leetcode.attendedContestsCount": -1 });
userSchema.index({ "platforms.codeforces.currentRating": -1 });
userSchema.index({ "platforms.codeforces.maxRating": -1 });
userSchema.index({ "platforms.codeforces.username": 1 }, { sparse: false });
userSchema.index({ "platforms.github.publicRepos": -1 });
userSchema.index({ "platforms.github.followers": -1 });
userSchema.index({ "platforms.github.username": 1 }, { sparse: false });

const User = mongoose.model("User", userSchema);

module.exports = User;