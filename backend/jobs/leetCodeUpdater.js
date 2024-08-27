const { getLeetCodeStats } = require("../services/leetcodeService");
const User = require("../models/User");

exports.updateLeetCodeStats = async (req, res) => {
  try {
    const user = req.user;
    if (
      !user ||
      !user.platforms.leetcode ||
      !user.platforms.leetcode.username // Fixed field name
    ) {
      return res
        .status(400)
        .json({ message: "LeetCode username not found for user" });
    }

    const leetcodeUsername = user.platforms.leetcode.username; // Fixed field name
    const apiResponse = await getLeetCodeStats(leetcodeUsername);

    console.log("API Response:", apiResponse);

    const statsToUpdate = {
      "platforms.leetcode.totalQuestionsSolved":
        apiResponse.totalQuestionsSolved,
      "platforms.leetcode.questionsSolvedByDifficulty.easy":
        apiResponse.questionsSolvedByDifficulty.easy,
      "platforms.leetcode.questionsSolvedByDifficulty.medium":
        apiResponse.questionsSolvedByDifficulty.medium,
      "platforms.leetcode.questionsSolvedByDifficulty.hard":
        apiResponse.questionsSolvedByDifficulty.hard,
      "platforms.leetcode.attendedContestsCount":
        apiResponse.attendedContestsCount,
      "platforms.leetcode.contestRating": apiResponse.contestRating,
    };

    console.log("Stats to update:", statsToUpdate);

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: statsToUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error("User not found or update failed");
      return res
        .status(404)
        .json({ message: "User not found or update failed" });
    }

    console.log("Updated user:", updatedUser);

    res.status(200).json({
      message: "LeetCode stats updated successfully",
      stats: updatedUser,
    });
  } catch (error) {
    console.error("Error updating LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
