const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    leetcodeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
problemSchema.index({ leetcodeId: 1 });
problemSchema.index({ title: 1 });

const Problem = mongoose.model("Problem", problemSchema);
module.exports = Problem;