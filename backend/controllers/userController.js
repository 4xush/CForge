const User = require("../models/User");
const {
  checkLeetCodeUsername,
  checkGitHubUsername,
  checkCodeforcesUsername
} = require("../utils/authHelpers.js");
const { updateUserLeetCodeStats } = require("../services/leetcodeStatsService");
const { updateUserGitHubStats } = require("../services/github/githubStatsServices.js");
const { updateUserCodeforcesStats } = require("../services/codeforces/codeforcesStatsService.js");

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.searchUser = async (req, res) => {
  const { query } = req.query; // `query` parameter from the request URL (e.g., `/search?query=johndoe`).

  try {
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query cannot be empty" });
    }

    // Perform a case-insensitive search for users based on username or email
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } }, // Case-insensitive match on username
        { email: { $regex: query, $options: "i" } },    // Case-insensitive match on email
      ],
    }).select("-password"); // Exclude the password field.

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found matching the query" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.setupPlatforms = async (req, res) => {
  const { leetcodeUsername, githubUsername, codeforcesUsername } = req.body;
  const userId = req.user.id; // From auth middleware

  try {
    // Validate at least one platform username is provided
    if (!leetcodeUsername && !githubUsername && !codeforcesUsername) {
      return res.status(400).json({
        message: "At least one platform username is required"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate provided usernames in parallel
    const validations = [];
    if (leetcodeUsername) {
      validations.push(checkLeetCodeUsername(leetcodeUsername));
    }
    if (githubUsername) {
      validations.push(checkGitHubUsername(githubUsername));
    }
    if (codeforcesUsername) {
      validations.push(checkCodeforcesUsername(codeforcesUsername));
    }

    const results = await Promise.all(validations.map(p => p.catch(e => false)));
    const allValid = results.every(result => result === true);

    if (!allValid) {
      return res.status(400).json({
        message: "One or more platform usernames are invalid"
      });
    }

    // Update user's platform information
    if (leetcodeUsername) {
      user.platforms.leetcode = {
        username: leetcodeUsername.trim(),
        totalQuestionsSolved: 0,
        questionsSolvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
        attendedContestsCount: 0,
        contestRating: 0
      };
    }

    if (githubUsername) {
      user.platforms.github = {
        username: githubUsername.trim(),
        publicRepos: 0,
        followers: 0,
        following: 0
      };
    }

    if (codeforcesUsername) {
      user.platforms.codeforces = {
        username: codeforcesUsername.trim(),
        currentRating: 0,
        maxRating: 0,
        rank: "",
        maxRank: "",
        contribution: 0,
        friendOfCount: 0
      };
    }

    // Mark profile as complete if at least one platform is set
    user.isProfileComplete = true;

    // Save user first
    await user.save();

    // Update platform stats
    let updatedUser = user;
    try {
      if (leetcodeUsername) {
        updatedUser = await updateUserLeetCodeStats(updatedUser, false);
      }
      if (githubUsername) {
        updatedUser = await updateUserGitHubStats(updatedUser, false);
      }
      if (codeforcesUsername) {
        updatedUser = await updateUserCodeforcesStats(updatedUser, false);
      }
    } catch (error) {
      console.error("Platform stats update failed:", error);
    }

    res.status(200).json({
      message: "Platform usernames updated successfully",
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        platforms: updatedUser.platforms,
        isProfileComplete: updatedUser.isProfileComplete
      }
    });

  } catch (error) {
    console.error("Platform setup error:", error);
    res.status(500).json({
      message: "Failed to setup platform usernames. Please try again later."
    });
  }
};