const express = require('express');
const app = require('./app');
const DatabaseManager = require('./db/database');
const logger = require('./utils/logger');

// Initialize database
const dbManager = new DatabaseManager();

// Make database available globally
global.db = dbManager.getDatabase();

const PORT = process.env.PORT || 5000;

// Create main app and mount routes at /api
const mainApp = express();
mainApp.use('/api', app);

const server = mainApp.listen(PORT, '0.0.0.0', () => {
  logger.info('🎳 Bowling Tracker API Server started', {
    port: PORT,
    host: '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_PATH || 'data/bowling.db',
    logLevel: process.env.LOG_LEVEL || 'info'
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    dbManager.close();
    logger.info('Database connection closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason.toString(),
    stack: reason.stack,
    promise: promise
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});