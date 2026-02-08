const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Submit rating (customer only)
router.post('/:orderId', protect, authorize('customer'), ratingController.submitRating);

// Get rating for an order
router.get('/:orderId', protect, ratingController.getOrderRating);

module.exports = router;