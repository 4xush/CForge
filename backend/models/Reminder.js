const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userSolvedProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserSolvedProblem",
      required: true,
      index: true,
    },
    reminderDate: {
      type: Date,
      required: true,
      index: true,
    },
    interval: {
      type: Number,
      required: true,
      enum: [1, 3, 7, 14, 30], // Days
    },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
reminderSchema.index({ user: 1, status: 1, isActive: 1 });
reminderSchema.index({ reminderDate: 1, status: 1, isActive: 1 });
reminderSchema.index({ user: 1, reminderDate: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);
module.exports = Reminder;