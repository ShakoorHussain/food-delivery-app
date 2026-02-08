const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const cartController = require('../controllers/cartController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Restaurant listing
router.get('/restaurants', protect, authorize('customer'), customerController.getRestaurants);

// Cart routes
router.get('/cart', protect, authorize('customer'), cartController.getCart);
router.post('/cart', protect, authorize('customer'), cartController.addToCart);
router.delete('/cart', protect, authorize('customer'), cartController.removeFromCart);

module.exports = router;
