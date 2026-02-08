const Order = require('../models/Order');
const User = require('../models/User');

// Assign delivery agent to order
exports.assignDeliveryAgent = async (req, res) => {
  try {
    const { orderId, deliveryAgentId } = req.body;

    // Find delivery agent
    const agent = await User.findById(deliveryAgentId);
    if (!agent || agent.role !== 'delivery') {
      return res.status(400).json({ message: 'Invalid delivery agent' });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.deliveryAgent = deliveryAgentId;
    await order.save();

    res.status(200).json({ message: 'Delivery agent assigned', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// Get orders assigned to delivery agent
exports.getAssignedOrders = async (req, res) => {
  try {
    const agentId = req.user._id;

    const orders = await Order.find({ deliveryAgent: agentId })
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price');

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delivery agent updates order status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.deliveryAgent.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all available delivery agents
exports.getAllDeliveryAgents = async (req, res) => {
  try {
    const deliveryAgents = await User.find({ role: 'delivery' }).select('name email');
    res.status(200).json(deliveryAgents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get optimized route for delivery agent
exports.getOptimizedRoute = async (req, res) => {
  try {
    const deliveryAgentId = req.user._id;

    // Get all assigned orders that are 'out-for-delivery'
    const orders = await Order.find({
      deliveryAgent: deliveryAgentId,
      status: 'out-for-delivery',
    })
      .populate('customer', 'name address location')
      .populate('restaurant', 'name address location');

    if (orders.length === 0) {
      return res.status(200).json({
        message: 'No active deliveries',
        optimizedRoute: [],
        totalDistance: 0,
        estimatedTime: 0,
      });
    }

    // Get delivery agent's current location (default to first restaurant)
    const startLocation = orders[0].restaurant.location || {
      lat: 31.5204, // Default Lahore coordinates
      lng: 74.3587,
    };

    // Prepare delivery locations
    const deliveryLocations = orders.map((order) => ({
      orderId: order._id,
      customerName: order.customer.name,
      address: order.customer.address,
      lat: order.customer.location?.lat || 31.5204,
      lng: order.customer.location?.lng || 74.3587,
      totalPrice: order.totalPrice,
    }));

    // Import route optimizer
    const {
      optimizeRoute,
      calculateTotalDistance,
      calculateEstimatedTime,
    } = require('../utils/routeOptimizer');

    // Optimize the route
    const optimizedRoute = optimizeRoute(startLocation, deliveryLocations);
    const totalDistance = calculateTotalDistance(optimizedRoute);
    const estimatedTime = calculateEstimatedTime(totalDistance);

    res.status(200).json({
      message: 'Route optimized successfully',
      startLocation,
      optimizedRoute,
      totalDistance: totalDistance.toFixed(2),
      estimatedTime,
      ordersCount: orders.length,
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};