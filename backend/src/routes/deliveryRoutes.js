const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const deliveryController = require('../controllers/deliveryController');

// Get all delivery agents (for restaurant to assign)
router.get('/agents', protect, authorize('restaurant', 'admin'), deliveryController.getAllDeliveryAgents);

// Assign delivery agent (restaurant/admin)
router.post('/assign', protect, authorize('restaurant', 'admin'), deliveryController.assignDeliveryAgent);

// Delivery agent views assigned orders
router.get('/orders', protect, authorize('delivery'), deliveryController.getAssignedOrders);

// Get optimized route
router.get('/route/optimize', protect, authorize('delivery'), deliveryController.getOptimizedRoute);

// Update delivery status
router.put('/orders/:orderId/status', protect, authorize('delivery'), deliveryController.updateDeliveryStatus);

module.exports = router;