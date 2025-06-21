const Review = require("../models/Review");
const User = require("../models/User");

// @desc    Get all reviews with stats
// @route   GET /api/reviews
// @access  Public
const getReviews = async (req, res) => {
  try {
    const { category, sortBy = 'newest', page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isVisible: true };
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Build sort object
    let sortObj = {};
    switch (sortBy) {
      case 'rating':
        sortObj = { rating: -1, createdAt: -1 };
        break;
      case 'helpful':
        sortObj = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      default: // newest
        sortObj = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with user info
    const reviews = await Review.find(filter)
      .populate('user', 'username fullName profilePicture')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalReviews = await Review.countDocuments(filter);
    
    // Calculate stats
    const stats = await Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    // Format response
    const formattedReviews = reviews.map(review => ({
      id: review._id,
      user: review.user?.username || 'Anonymous',
      fullName: review.user?.fullName,
      profilePicture: review.user?.profilePicture,
      category: review.category,
      message: review.message,
      rating: review.rating,
      helpful: review.helpfulCount,
      date: review.createdAt.toISOString().split('T')[0],
      createdAt: review.createdAt,
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          hasNext: skip + reviews.length < totalReviews,
          hasPrev: parseInt(page) > 1
        },
        stats: {
          averageRating: stats[0]?.averageRating?.toFixed(1) || 0,
          totalReviews: stats[0]?.totalReviews || 0,
        }
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Submit a new review
// @route   POST /api/reviews
// @access  Private
const submitReview = async (req, res) => {
  try {
    const { category, message, rating } = req.body;
    const userId = req.user._id;

    // Validation
    if (!category || !message || !rating) {
      return res.status(400).json({
        success: false,
        message: "Category, message, and rating are required"
      });
    }

    if (![1, 2, 3, 4, 5].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 500 characters"
      });
    }

    const validCategories = ["Feature Request", "UI/UX", "Bug Report", "Compliment"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    // Check if user already has a review
    const existingReview = await Review.findOne({ user: userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review. You can edit your existing review instead."
      });
    }

    // Create new review
    const review = new Review({
      user: userId,
      category,
      message: message.trim(),
      rating,
    });

    await review.save();

    // Populate user info for response
    await review.populate('user', 'username fullName profilePicture');

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: {
        id: review._id,
        user: review.user.username,
        category: review.category,
        message: review.message,
        rating: review.rating,
        helpful: review.helpfulCount,
        date: review.createdAt.toISOString().split('T')[0],
        createdAt: review.createdAt,
      }
    });

  } catch (error) {
    console.error('Submit review error:', error);
    
    // Handle duplicate key error (user already has review)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markReviewHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the review
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found"
      });
    }

    // Check if user already marked this review as helpful
    const alreadyMarked = review.helpfulUsers.includes(userId);
    
    if (alreadyMarked) {
      // Remove helpful mark (toggle off)
      review.helpfulUsers = review.helpfulUsers.filter(
        user => !user.equals(userId)
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add helpful mark (toggle on)
      review.helpfulUsers.push(userId);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: alreadyMarked ? "Helpful mark removed" : "Marked as helpful",
      data: {
        helpful: review.helpfulCount,
        isMarkedHelpful: !alreadyMarked
      }
    });

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update helpful status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get review statistics
// @route   GET /api/reviews/stats
// @access  Public
const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          categoryBreakdown: {
            $push: "$category"
          },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    if (!stats.length) {
      return res.json({
        success: true,
        data: {
          averageRating: 0,
          totalReviews: 0,
          categoryBreakdown: {},
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      });
    }

    const { averageRating, totalReviews, categoryBreakdown, ratingDistribution } = stats[0];

    // Process category breakdown
    const categoryStats = {};
    categoryBreakdown.forEach(category => {
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // Process rating distribution
    const ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach(rating => {
      ratingStats[rating] = (ratingStats[rating] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
        categoryBreakdown: categoryStats,
        ratingDistribution: ratingStats
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user's review
// @route   PUT /api/reviews/my-review
// @access  Private
const updateMyReview = async (req, res) => {
  try {
    const { category, message, rating } = req.body;
    const userId = req.user._id;

    // Find user's existing review
    const review = await Review.findOne({ user: userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "You haven't submitted a review yet"
      });
    }

    // Validation
    if (rating && ![1, 2, 3, 4, 5].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    if (message && message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 500 characters"
      });
    }

    const validCategories = ["Feature Request", "UI/UX", "Bug Report", "Compliment"];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    // Update fields
    if (category) review.category = category;
    if (message) review.message = message.trim();
    if (rating) review.rating = rating;

    await review.save();
    await review.populate('user', 'username fullName profilePicture');

    res.json({
      success: true,
      message: "Review updated successfully",
      data: {
        id: review._id,
        user: review.user.username,
        category: review.category,
        message: review.message,
        rating: review.rating,
        helpful: review.helpfulCount,
        date: review.createdAt.toISOString().split('T')[0],
        updatedAt: review.updatedAt,
      }
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user's own review
// @route   GET /api/reviews/my-review
// @access  Private
const getMyReview = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const review = await Review.findOne({ user: userId })
      .populate('user', 'username fullName profilePicture');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "You haven't submitted a review yet"
      });
    }

    res.json({
      success: true,
      data: {
        id: review._id,
        user: review.user.username,
        category: review.category,
        message: review.message,
        rating: review.rating,
        helpful: review.helpfulCount,
        date: review.createdAt.toISOString().split('T')[0],
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      }
    });

  } catch (error) {
    console.error('Get my review error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your review",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getReviews,
  submitReview,
  markReviewHelpful,
  getReviewStats,
  updateMyReview,
  getMyReview
};
