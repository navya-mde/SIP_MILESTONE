// index.js
const express = require('express');
const passport = require('passport');
const { ensureAuthenticated } = require('../middleware/auth');
const { Food, Order, User } = require('../models/userModel');

const router = express.Router();

// User Registration and Authentication
router.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.json(req.user);
});

router.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out successfully' });
});

// Food Management
router.get('/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Order Placement
router.post('/orders', ensureAuthenticated, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, userId: req.user._id });
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;