const DatabaseManager = require('./database');

/**
 * Initialize database and create tables
 * This script is run during Docker container startup
 */
const dbManager = new DatabaseManager();

console.log('Database initialized successfully with all tables and indexes');

// Close the connection
dbManager.close();

process.exit(0);