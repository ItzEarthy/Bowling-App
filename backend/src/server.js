const app = require('./app');
const DatabaseManager = require('./db/database');

// Initialize database
const dbManager = new DatabaseManager();

// Make database available globally
global.db = dbManager.getDatabase();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🎳 Bowling Tracker API Server running on port ${PORT}`);
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