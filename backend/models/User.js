const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema(
  {
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
    leetcodeUsername: {
      type: String,
      required: true,
    },
    totalQuestionsSolved: {
      type: Number,
      default: 0,
    },
    questionsSolvedByDifficulty: {
      easy: {
        type: Number,
        default: 0,
      },
      medium: {
        type: Number,
        default: 0,
      },
      hard: {
        type: Number,
        default: 0,
      },
    },
    attendedContestsCount: {
      type: Number,
      default: 0,
    },
    globalRanking: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Create the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
