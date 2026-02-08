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