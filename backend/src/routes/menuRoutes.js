const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Create menu item (POST must come before /:id routes)
router.post('/', protect, authorize('restaurant'), menuController.createMenuItem);

// Get menu items by restaurant ID (more specific path)
router.get('/restaurant/:restaurantId', protect, menuController.getMenuByRestaurant);

// Get single menu item by ID
router.get('/item/:id', protect, menuController.getMenuItemById);

// Update menu item
router.put('/:id', protect, authorize('restaurant'), menuController.updateMenuItem);

// Delete menu item
router.delete('/:id', protect, authorize('restaurant'), menuController.deleteMenuItem);

module.exports = router;