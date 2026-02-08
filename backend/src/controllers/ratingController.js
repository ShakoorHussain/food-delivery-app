const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');

// Submit rating for an order
exports.submitRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { restaurantRating, deliveryRating, feedback } = req.body;
    const customerId = req.user._id;

    // Validate ratings
    if (restaurantRating && (restaurantRating < 1 || restaurantRating > 5)) {
      return res.status(400).json({ message: 'Restaurant rating must be between 1 and 5' });
    }
    if (deliveryRating && (deliveryRating < 1 || deliveryRating > 5)) {
      return res.status(400).json({ message: 'Delivery rating must be between 1 and 5' });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to customer
    if (order.customer.toString() !== customerId.toString()) {
      return res.status(403).json({ message: 'Not authorized to rate this order' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate delivered orders' });
    }

    // Check if already rated
    if (order.rating && order.rating.ratedAt) {
      return res.status(400).json({ message: 'Order already rated' });
    }

    // Update order with rating
    order.rating = {
      restaurantRating,
      deliveryRating,
      feedback,
      ratedAt: new Date()
    };
    await order.save();

    // Update restaurant's average rating
    if (restaurantRating) {
      await updateRestaurantRating(order.restaurant);
    }

    res.status(200).json({ 
      message: 'Rating submitted successfully',
      rating: order.rating 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper function to update restaurant average rating
async function updateRestaurantRating(restaurantId) {
  try {
    // Get all delivered orders for this restaurant with ratings
    const orders = await Order.find({
      restaurant: restaurantId,
      status: 'delivered',
      'rating.restaurantRating': { $exists: true }
    });

    if (orders.length === 0) return;

    // Calculate average rating
    const totalRating = orders.reduce((sum, order) => sum + order.rating.restaurantRating, 0);
    const averageRating = totalRating / orders.length;

    // Update restaurant rating
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
    });
  } catch (error) {
    console.error('Error updating restaurant rating:', error);
  }
}

// Get ratings for a specific order
exports.getOrderRating = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).select('rating');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order.rating || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};