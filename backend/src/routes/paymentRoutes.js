const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Only customer can pay
router.post('/', protect, authorize('customer'), paymentController.simulatePayment);

module.exports = router;
