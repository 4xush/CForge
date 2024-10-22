const { getLeetCodeStats } = require("../services/leetcodeService");
const User = require("../models/User");

exports.updateLeetCodeStats = async (req, res) => {
  try {
    const user = req.user;

    // Ensure the user has a LeetCode username
    if (!user || !user.platforms.leetcode || !user.platforms.leetcode.username) {
      return res.status(400).json({ message: "LeetCode username not found for user" });
    }

    const leetcodeUsername = user.platforms.leetcode.username;

    // Fetch LeetCode stats
    const apiResponse = await getLeetCodeStats(leetcodeUsername);
    if (!apiResponse || !apiResponse.totalQuestionsSolved) {
      return res.status(400).json({ message: "Invalid LeetCode stats response" });
    }

    const { totalQuestionsSolved, questionsSolvedByDifficulty, attendedContestsCount, contestRating } = apiResponse;

    const statsToUpdate = {
      "platforms.leetcode.totalQuestionsSolved": totalQuestionsSolved,
      "platforms.leetcode.questionsSolvedByDifficulty.easy": questionsSolvedByDifficulty.easy,
      "platforms.leetcode.questionsSolvedByDifficulty.medium": questionsSolvedByDifficulty.medium,
      "platforms.leetcode.questionsSolvedByDifficulty.hard": questionsSolvedByDifficulty.hard,
      "platforms.leetcode.attendedContestsCount": attendedContestsCount,
      "platforms.leetcode.contestRating": contestRating,
    };

    // Update user stats
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: statsToUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }

    res.status(200).json({
      message: "LeetCode stats updated successfully",
      stats: updatedUser.platforms.leetcode, // Return only LeetCode stats
    });
  } catch (error) {
    console.error("Error updating LeetCode stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
