const express = require('express');
const app = require('./app');
const DatabaseManager = require('./db/database');

// Initialize database
const dbManager = new DatabaseManager();

// Make database available globally
global.db = dbManager.getDatabase();

const PORT = process.env.PORT || 5000;

// Create main app and mount routes at /api
const mainApp = express();
mainApp.use('/api', app);

const server = mainApp.listen(PORT, '0.0.0.0', () => {
  console.log(`🎳 Bowling Tracker API Server running on 0.0.0.0:${PORT}`);
  console.log(`📊 Database initialized at: ${process.env.DB_PATH || 'data/bowling.db'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    dbManager.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    dbManager.close();
    process.exit(0);
  });
});