const Restaurant = require('../models/Restaurant');

// Get restaurants with optional filters
exports.getRestaurants = async (req, res) => {
  try {
    const { cuisine, minRating } = req.query;

    // Build query object
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
