const express = require('express');
const {
  getReviews,
  submitReview,
  markReviewHelpful,
  getReviewStats,
  updateMyReview,
  getMyReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getReviews);
router.get('/stats', getReviewStats); // rating stats, helpful counts, etc.

// Protected routes
router.post('/', protect, submitReview);
router.put('/:id/helpful', protect, markReviewHelpful);
router.get('/my-review', protect, getMyReview);
router.put('/my-review', protect, updateMyReview);

module.exports = router;
