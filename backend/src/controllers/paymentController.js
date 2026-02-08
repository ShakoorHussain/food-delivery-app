const Order = require('../models/Order');

// Simulate payment
exports.simulatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Simulate payment success/failure
    const isPaid = Math.random() < 0.9; // 90% chance success

    order.paymentStatus = isPaid ? 'paid' : 'failed';
    await order.save();

    res.status(200).json({
      message: isPaid ? 'Payment successful' : 'Payment failed',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
