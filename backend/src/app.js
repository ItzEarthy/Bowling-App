const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/auth');
const { 
  addCorrelationId, 
  requestLogger, 
  errorLogger, 
  requestTimer 
} = require('./middleware/logging');

// Import logger
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const ballRoutes = require('./routes/balls');
const friendRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware (order matters)
app.use(addCorrelationId);
app.use(requestTimer);
app.use(requestLogger);

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// Health check
app.get('/health', (req, res) => {
  logger.info('Health check requested', { correlationId: req.correlationId });
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'bowling-tracker-backend',
    version: '1.0.0',
    correlationId: req.correlationId
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/games', gameRoutes);
app.use('/balls', ballRoutes);
app.use('/friends', friendRoutes);
app.use('/admin', adminRoutes);

// Error logging middleware (before error handlers)
app.use(errorLogger);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
