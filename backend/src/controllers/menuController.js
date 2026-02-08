const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
// Create new menu item
exports.createMenuItem = async (req, res) => {
  try {
    const { restaurantId, name, description, category, price, image } = req.body;
     

    // Check restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
      
    const menuItem = new Menu({
      restaurant: restaurantId,
      name,
      description,
      category,
      price,
      image
    });

    await menuItem.save();

    // Add menu item to restaurant
    restaurant.menu.push(menuItem._id);
    await restaurant.save();

    res.status(201).json({ message: 'Menu item created', menuItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get menu items by restaurant
exports.getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menu = await Menu.find({ restaurant: restaurantId });
    res.status(200).json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await Menu.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json({ message: 'Menu item updated', updatedItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await Menu.findByIdAndDelete(id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    // Remove from restaurant menu array
    await Restaurant.findByIdAndUpdate(menuItem.restaurant, { $pull: { menu: id } });

    res.status(200).json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get single menu item by ID
exports.getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await Menu.findById(id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    res.status(200).json(menuItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};