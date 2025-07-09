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
      min: 1,
      max: 365, // Allow up to 1 year
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