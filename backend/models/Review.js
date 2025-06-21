const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Feature Request", "UI/UX", "Bug Report", "Compliment"],
    },
    message: {
      type: String,
      required: true,
      maxLength: 500,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ category: 1 });
reviewSchema.index({ user: 1 });

// Ensure one review per user
reviewSchema.index({ user: 1 }, { unique: true });

// Virtual to get user info without password
reviewSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
  select: 'username fullName profilePicture'
});

module.exports = mongoose.model("Review", reviewSchema);