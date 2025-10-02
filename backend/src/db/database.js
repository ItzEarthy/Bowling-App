const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

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
    this.runMigrations();
    // Create default users after schema initialization
    this.createDefaultUsers().catch(console.error);
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
        role TEXT DEFAULT 'user',
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
        total_score INTEGER DEFAULT 0,
        strikes INTEGER,
        spares INTEGER,
        notes TEXT,
        entry_mode TEXT DEFAULT 'pin_by_pin',
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

    // Admin settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(updated_by) REFERENCES users(id)
      )
    `);

    // System logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        user_id INTEGER,
        target_type TEXT,
        target_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // User achievements table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_id TEXT NOT NULL,
        date_earned TEXT DEFAULT CURRENT_TIMESTAMP,
        progress INTEGER DEFAULT 100,
        UNIQUE(user_id, achievement_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_balls_user_id ON balls(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_frames_game_id ON frames(game_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_receiver ON friends(receiver_id)',
      'CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status)',
      'CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id)'
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
   * Create default users (admin account)
   */
  async createDefaultUsers() {
    try {
      // Check if admin user already exists
      const adminExists = this.db.prepare(`
        SELECT id FROM users WHERE username = 'admin'
      `).get();

      if (!adminExists) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('admin', saltRounds);
        
        this.db.prepare(`
          INSERT INTO users (username, display_name, email, hashed_password, role)
          VALUES (?, ?, ?, ?, ?)
        `).run('admin', 'Administrator', 'admin@bowling-app.com', hashedPassword, 'admin');
        
        console.log('Default admin user created (username: admin, password: admin)');
        
        // Create default admin settings
        await this.createDefaultSettings();
      }
    } catch (error) {
      console.error('Error creating default users:', error);
    }
  }

  /**
   * Create default admin settings
   */
  async createDefaultSettings() {
    const defaultSettings = [
      {
        key: 'app_name',
        value: 'Pin Stats',
        description: 'Application display name'
      },
      {
        key: 'max_users',
        value: '1000',
        description: 'Maximum number of users allowed'
      },
      {
        key: 'require_email_verification',
        value: 'false',
        description: 'Require email verification for new accounts'
      },
      {
        key: 'auto_backup_enabled',
        value: 'true',
        description: 'Enable automatic database backups'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable maintenance mode'
      },
      {
        key: 'default_theme',
        value: 'light',
        description: 'Default application theme'
      },
      {
        key: 'session_timeout',
        value: '168',
        description: 'Session timeout in hours'
      },
      {
        key: 'max_games_per_user',
        value: '500',
        description: 'Maximum games per user'
      }
    ];

    for (const setting of defaultSettings) {
      const existing = this.db.prepare(`
        SELECT id FROM admin_settings WHERE setting_key = ?
      `).get(setting.key);

      if (!existing) {
        this.db.prepare(`
          INSERT INTO admin_settings (setting_key, setting_value, description)
          VALUES (?, ?, ?)
        `).run(setting.key, setting.value, setting.description);
      }
    }

    console.log('Default admin settings created');
  }

  /**
   * Run database migrations
   */
  runMigrations() {
    const migrationsPath = path.join(__dirname, 'migrations');
    
    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsPath)) {
      return;
    }
    
    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    for (const file of migrationFiles) {
      // Check if migration was already applied
      const applied = this.db.prepare(`
        SELECT id FROM migrations WHERE filename = ?
      `).get(file);
      
      if (!applied) {
        console.log(`Applying migration: ${file}`);
        try {
          const migration = require(path.join(migrationsPath, file));
          migration.applyMigration(this.db);
          
          // Record migration as applied
          this.db.prepare(`
            INSERT INTO migrations (filename) VALUES (?)
          `).run(file);
          
          console.log(`Migration ${file} applied successfully`);
        } catch (error) {
          console.error(`Failed to apply migration ${file}:`, error);
        }
      }
    }
  }
  
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