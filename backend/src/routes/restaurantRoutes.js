const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Get all restaurants (for customer view)
router.get('/', protect, async (req, res) => {
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
});

// Create restaurant profile
router.post('/create', async (req, res) => {
  try {
    const { userId, name, address, cuisine, rating } = req.body;

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
});

// Get restaurant by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('menu');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;