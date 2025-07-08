const mongoose = require("mongoose");

const userSolvedProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    solvedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    // Auto-sync metadata
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    syncSource: {
      type: String,
      enum: ["leetcode_api", "manual"],
      default: "leetcode_api",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
userSolvedProblemSchema.index({ user: 1, problem: 1 }, { unique: true });
userSolvedProblemSchema.index({ user: 1, solvedAt: -1 });
userSolvedProblemSchema.index({ user: 1, isImportant: 1 });
userSolvedProblemSchema.index({ user: 1, lastReviewedAt: 1 });

const UserSolvedProblem = mongoose.model("UserSolvedProblem", userSolvedProblemSchema);
module.exports = UserSolvedProblem;
