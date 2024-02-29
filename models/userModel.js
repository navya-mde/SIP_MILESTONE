// index.js
const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  googleId: String,
  facebookId: String,
  email: { 
      type: String, 
      required: true,
      // Validate email format
      validate: {
          validator: function(v) {
              // Regular expression for email validation
              return /\S+@\S+\.\S+/.test(v);
          },
          message: props => `${props.value} is not a valid email address!`
      }
  },
  password: { type: String, required: true },
  displayName: String,
  role: { type: String, enum: ['admin', 'superuser', 'user'], default: 'user' }
});


const foodSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  image: String
});

const orderSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'canceled', 'completed'], default: 'pending' }
});

const User = mongoose.model('User', userSchema);
const Food = mongoose.model('Food', foodSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { User, Food, Order };