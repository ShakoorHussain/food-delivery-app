const express = require('express');
const router = express.Router();
const {registerUser,loginUser}= require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');
// post /api/auth/register
router.post('/register',registerUser);
router.post('/login',loginUser);


router.get('/customer-dashboard', protect, authorize('customer'), (req, res) => {
  res.json({ message: `Welcome ${req.user.name} to Customer Dashboard` });
});

router.get('/restaurant-dashboard', protect, authorize('restaurant'), (req, res) => {
  res.json({ message: `Welcome ${req.user.name} to Restaurant Dashboard` });
});

router.get('/delivery-dashboard', protect, authorize('delivery'), (req, res) => {
  res.json({ message: `Welcome ${req.user.name} to Delivery Dashboard` });
});

module.exports= router;