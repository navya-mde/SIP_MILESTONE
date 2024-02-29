
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const fb = require('fb');
const bodyParser = require('body-parser');

const cors = require('cors');
const { ensureAuthenticated } = require('./middleware/auth');
const { Food, Order, User } = require('./models/userModel');
const routes = require('./router/userrouter');




// Initialize Express app
const app = express();
app.use(bodyParser.json());
// MongoDB setup
mongoose.connect('mongodb://0.0.0.0:27017/sip')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(session({
  secret: '2fd45',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://0.0.0.0:27017/sip',
    ttl: 60 * 60 // session expiration time in seconds
  }),
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration for Google authentication
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
    clientID: '281922567883-at4cbcfe80bdtirq8h7de76ot9r4599a.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:4000/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          displayName: profile.displayName
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Passport configuration for Facebook authentication
const FacebookStrategy = require('passport-facebook').Strategy;
passport.use(new FacebookStrategy({
    clientID: 'your-facebook-client-id',
    clientSecret: 'your-facebook-client-secret',
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });
      if (!user) {
        user = await User.create({
          facebookId: profile.id,
          displayName: profile.displayName
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
app.use('/', routes);

// Routes for Google authentication
app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// Routes for Facebook authentication
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/profile');
  }
);

// User Registration and Authentication
app.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/login', passport.authenticate('local'), (req, res) => {
  res.json(req.user);
});

app.get('/logout', (req, res) => {
  req.logout();
  res.json({ message: 'Logged out successfully' });
});

// Food Management
app.get('/foods', async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Order Placement
app.post('/orders', ensureAuthenticated, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, userId: req.user._id });
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Scheduled Order Status Updates
const nodeCron = require('node-cron');

nodeCron.schedule('*/20 * * * *', async () => {
  try {
    const orders = await Order.find({ status: 'pending' });
    const currentTime = new Date();
    orders.forEach(async order => {
      if (currentTime - order.createdAt > 20 * 60 * 1000) {
        order.status = 'canceled';
        await order.save();
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
  }
});

//sixth question of the milestone
const FACEBOOK_ACCESS_TOKEN = 'YOUR_FACEBOOK_ACCESS_TOKEN';

// Initialize the Facebook SDK with your access token
fb.options({
  accessToken: FACEBOOK_ACCESS_TOKEN,
});

// Route to share a review on Facebook
app.post('/share-review', (req, res) => {
  const { reviewText } = req.body;

  // Post the review to Facebook
  fb.api('me/feed', 'post', { message: reviewText }, (response) => {
    if (!response || response.error) {
      console.error('Error sharing review on Facebook:', response.error);
      res.status(500).json({ message: 'Failed to share review on Facebook' });
    } else {
      console.log('Review shared successfully on Facebook:', response);
      res.status(200).json({ message: 'Review shared successfully on Facebook' });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);


//first question of the milestone
  // Schedule a job to run every 20 minutes
  nodeCron.schedule('*/20 * * * *', async () => {
    try {
      const orders = await Order.find({ status: 'pending' });
      const currentTime = new Date();
      orders.forEach(async order => {
        if (currentTime - order.createdAt > 20 * 60 * 1000) {
          order.status = 'canceled';
          await order.save();
        }
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  });
});