require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    database: db.getActiveAdapter(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'API Endpoint not found'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await db.connect();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Server is running on port ${PORT}`);
      console.log(` Active Database Adapter: ${db.getActiveAdapter().toUpperCase()}`);
      console.log(` Health Check: http://localhost:${PORT}/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start the backend server:', error);
    process.exit(1);
  }
};

startServer();
