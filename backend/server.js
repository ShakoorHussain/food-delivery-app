const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const etaRoutes = require('./src/routes/etaRoutes');
const restaurantRoutes = require('./src/routes/restaurantRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
const app = express();

// Middleware - Updated CORS for production
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/test', (req, res) => {
  console.log('backend working...');
  res.send('Backend working...');
});
app.use('/api/ratings', ratingRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/eta', etaRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.send('Backend is running');
});

// Connect to MongoDB
connectDB();

// Create server for socket.io
const server = http.createServer(app);

// Socket.io with updated CORS for production
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('joinOrder', (orderId) => {
    socket.join(orderId);
    console.log(`Client joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Store io in app for controllers
app.set('socketio', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export io for controllers
module.exports = { io };