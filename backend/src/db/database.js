const Database = require('better-sqlite3');
const path = require('path');

/**
 * Database initialization and schema setup
 * Creates SQLite database with all required tables and indexes
 */
class DatabaseManager {
  constructor() {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/bowling.db');
    this.db = new Database(dbPath);
    
    // Enable foreign key constraints
    this.db.pragma('foreign_keys = ON');
    
    this.initSchema();
  }

  /**
   * Initialize database schema with all required tables
   */
  initSchema() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        display_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bowling balls table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS balls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        weight INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Games table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        ball_id INTEGER,
        location TEXT,
        score INTEGER DEFAULT 0,
        is_complete BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(ball_id) REFERENCES balls(id) ON DELETE SET NULL
      )
    `);

    // Frames table - stores individual frame data
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS frames (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id INTEGER NOT NULL,
        frame_number INTEGER NOT NULL,
        throws_data TEXT NOT NULL,
        cumulative_score INTEGER DEFAULT 0,
        is_complete BOOLEAN DEFAULT FALSE,
        FOREIGN KEY(game_id) REFERENCES games(id) ON DELETE CASCADE
      )
    `);

    // Friends table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    this.createIndexes();
  }

  /**
   * Create database indexes for improved query performance
   */
  createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_balls_user_id ON balls(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_frames_game_id ON frames(game_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_receiver ON friends(receiver_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)'
    ];

    indexes.forEach(indexSQL => {
      try {
        this.db.exec(indexSQL);
      } catch (error) {
        console.warn(`Warning: Could not create index: ${error.message}`);
      }
    });
  }

  /**
   * Get database instance
   * @returns {Database} SQLite database instance
   */
  getDatabase() {
    return this.db;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;