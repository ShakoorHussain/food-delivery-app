const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { placeOrder } = require('../controllers/orderController');

// Only restaurant can view their orders
router.get('/restaurant', protect, authorize('restaurant'), orderController.getOrdersByRestaurant);

// Only restaurant can update status
router.put('/:orderId/status', protect, authorize('restaurant'), orderController.updateOrderStatus);

// Customer places an order
router.post('/place', protect, authorize('customer'), placeOrder);

// Customer order history (NEW)
router.get('/customer/history', protect, authorize('customer'), orderController.getCustomerOrderHistory);

module.exports = router;