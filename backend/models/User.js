const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    Fullname: {
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
      enum: ["male", "female"],
    },
    profilePicture: {
      type: String,
      default: "",
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
userSchema.index({ "platforms.leetcode.username": 1 }, { sparse: true });
userSchema.index({ "platforms.leetcode.attendedContestsCount": -1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
