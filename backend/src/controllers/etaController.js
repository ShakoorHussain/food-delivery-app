const Order = require('../models/Order');

// Simple ETA calculation
exports.calculateETA = async (req, res) => {
  try {
    const { orderId, distanceKm } = req.body; // distance in km

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Assume average delivery speed 40 km/h
    const avgSpeedKmh = 40;

    // Calculate ETA in minutes
    const etaMinutes = (distanceKm / avgSpeedKmh) * 60;

    // Set ETA
    const now = new Date();
    order.estimatedDeliveryTime = new Date(now.getTime() + etaMinutes * 60000);
    await order.save();

    res.status(200).json({
      message: 'Estimated delivery time calculated',
      estimatedDeliveryTime: order.estimatedDeliveryTime
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
