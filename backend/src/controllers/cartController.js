const Cart = require('../models/Cart');
const Menu = require('../models/Menu');

// Get customer's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate('items.menuItem');
    res.status(200).json(cart || { items: [], totalPrice: 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;

    const menuItem = await Menu.findById(menuItemId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(i => i.menuItem.toString() === menuItemId);
    if (itemIndex > -1) {
      // Item exists, update quantity
      cart.items[itemIndex].quantity += quantity;
      // Update price in case it changed
      cart.items[itemIndex].price = menuItem.price;
    } else {
      // FIXED: Add new item with price field
      cart.items.push({ 
        menuItem: menuItemId, 
        quantity,
        price: menuItem.price  // This was missing!
      });
    }

    await cart.save();

    // Populate and return the cart
    const populatedCart = await Cart.findById(cart._id).populate('items.menuItem');
    res.status(200).json(populatedCart);
  } catch (error) {
    console.error('Error in addToCart:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { menuItemId } = req.body;

    let cart = await Cart.findOne({ customer: req.user._id }).populate('items.menuItem');
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    // Remove the item
    cart.items = cart.items.filter(i => i.menuItem._id.toString() !== menuItemId);

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};