const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { registerSocketHandlers } = require('./sockets/socketHandler');

// Import Route handlers
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const musicRoutes = require('./routes/musicRoutes');
const soundclashRoutes = require('./routes/soundclashRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with permissive CORS for development
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    // console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/soundclash', soundclashRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ai-collaborative-dj-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found on the running backend. Stop any outdated server and restart this project from its backend folder.'
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'AI-Powered Collaborative DJ Platform Backend API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Register real-time Socket.IO events
registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 AI Collaborative DJ Server running on port ${PORT}`);
      console.log(`📡 Socket.IO real-time engine ready.`);
      console.log(`🎧 Apple Music catalog and MusicKit integration ready.`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start backend server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
