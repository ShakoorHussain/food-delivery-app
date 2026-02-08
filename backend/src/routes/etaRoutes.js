const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const etaController = require('../controllers/etaController');

// Restaurant or delivery agent can calculate ETA
router.post('/', protect, authorize('restaurant', 'delivery'), etaController.calculateETA);

module.exports = router;
