const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// Create restaurant profile
exports.createRestaurant = async (req, res) => {
  try {
    const { userId, name, address, cuisine, rating } = req.body;

    // Check if user exists and is a restaurant
    const user = await User.findById(userId);
    if (!user || user.role !== 'restaurant') {
      return res.status(400).json({ message: 'Invalid user or not a restaurant' });
    }

    // Check if restaurant already exists for this user
    const existingRestaurant = await Restaurant.findOne({ user: userId });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'Restaurant already exists for this user' });
    }

    const restaurant = new Restaurant({
      user: userId,
      name,
      address,
      cuisine,
      rating: rating || 0,
      menu: []
    });

    await restaurant.save();

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all restaurants (for customer view)
exports.getAllRestaurants = async (req, res) => {
  try {
    const { cuisine, minRating } = req.query;

    let query = {};
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (minRating) query.rating = { $gte: Number(minRating) };

    const restaurants = await Restaurant.find(query).populate('menu');

    res.status(200).json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id).populate('menu');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};