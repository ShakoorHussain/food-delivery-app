const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Cart = require('../models/Cart');

// Get all orders for a restaurant
exports.getOrdersByRestaurant = async (req, res) => {
  try {
    const restaurantId = req.user.role === 'restaurant' ? req.user._id : req.params.restaurantId;

    // Make sure restaurant exists
    const restaurant = await Restaurant.findOne({ user: restaurantId });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('customer', 'name email')
      .populate('items.menuItem', 'name price category')
      .populate('deliveryAgent', 'name email');

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update order status
// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId)
      .populate('customer', 'name email')
      .populate('restaurant', 'name')
      .populate('deliveryAgent', 'name email');
      
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Update status
    order.status = status;
    await order.save();

    // Emit socket.io event for real-time update
    const io = req.app.get('socketio');
    if (io) {
      console.log('🔴 Emitting socket events for order:', orderId);
      
      // Emit to the specific order room
      io.to(orderId).emit('orderStatusUpdated', {
        orderId: order._id,
        status: order.status,
        order: order
      });

      // Emit to ALL connected clients (broadcast)
      io.emit('orderUpdate', {
        customerId: order.customer._id.toString(),
        orderId: order._id.toString(),
        status: order.status,
        restaurantName: order.restaurant?.name
      });

      console.log('✅ Socket events emitted successfully');
    } else {
      console.log('❌ Socket.io not available');
    }

    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Place order from cart
exports.placeOrder = async (req, res) => {
  try {
    const customerId = req.user._id;

    // Get customer's cart
    const cart = await Cart.findOne({ customer: customerId }).populate('items.menuItem');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Get restaurant ID from first item (assuming all items from same restaurant)
    const restaurantId = cart.items[0].menuItem.restaurant;

    // Calculate total price
    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.menuItem.price * item.quantity;
    }, 0);

    // Create order items array
    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      quantity: item.quantity
    }));

    // Create new order
    const order = new Order({
      customer: customerId,
      restaurant: restaurantId,
      items: orderItems,
      totalPrice
    });

    await order.save();

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get customer's order history
exports.getCustomerOrderHistory = async (req, res) => {
  try {
    const customerId = req.user._id;

    const orders = await Order.find({ customer: customerId })
      .populate('restaurant', 'name address')
      .populate('items.menuItem', 'name price category')
      .populate('deliveryAgent', 'name')
      .sort({ createdAt: -1 }); 

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};