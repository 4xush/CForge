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
      enum: ["male", "female", "other", "unspecified"],
      default: "unspecified"
    },
    isGoogleAuth: {
      type: Boolean,
      default: false
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    rateLimitInfo: {
      lastPlatformRefresh: {
        type: Date
      },
      platformRefreshCount: {
        type: Number,
        default: 0
      },
      dailyApiCalls: {
        type: Number,
        default: 0
      },
      lastApiCallReset: {
        type: Date,
        default: Date.now
      }
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
        isValid: {
          type: Boolean,
          default: true
        },
        lastValidationCheck: {
          type: Date
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
        lastUpdated: {
          type: Date
        },
        lastRefreshAttempt: {
          type: Date
        },
        heatmapData: {
          type: Map,
          of: Number,
          default: new Map()
        },
        heatmapLastUpdated: {
          type: Date
        }
      },
      github: {
        username: {
          type: String,
          sparse: true,
        },
        isValid: {
          type: Boolean,
          default: true
        },
        lastValidationCheck: {
          type: Date
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
        lastUpdated: {
          type: Date
        },
        lastRefreshAttempt: {
          type: Date
        },
        rateLimitRemaining: {
          type: Number
        },
        rateLimitReset: {
          type: Date
        },
        heatmapData: {
          type: Map,
          of: Number,
          default: new Map()
        },
        heatmapLastUpdated: {
          type: Date
        }
      },
      leetcode: {
        username: {
          type: String,
          sparse: true,
        },
        isValid: {
          type: Boolean,
          default: true
        },
        lastValidationCheck: {
          type: Date
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
        lastUpdated: {
          type: Date
        },
        lastRefreshAttempt: {
          type: Date
        },
        heatmapData: {
          type: Map,
          of: Number,
          default: new Map()
        },
        heatmapLastUpdated: {
          type: Date
        }
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
userSchema.index({ "platforms.leetcode.attendedContestsCount": -1 });
userSchema.index({ "platforms.codeforces.currentRating": -1 });
userSchema.index({ "platforms.codeforces.maxRating": -1 });
userSchema.index({ "platforms.github.publicRepos": -1 });
userSchema.index({ "platforms.github.followers": -1 });
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ "platforms.leetcode.lastUpdated": -1 });
userSchema.index({ "platforms.github.lastUpdated": -1 });
userSchema.index({ "platforms.codeforces.lastUpdated": -1 });
userSchema.index({ "rateLimitInfo.lastPlatformRefresh": -1 });

const User = mongoose.model("User", userSchema);
module.exports = User;