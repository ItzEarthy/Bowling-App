/**
 * Migration 003: Add `status` column to `users` table and index
 */
module.exports.applyMigration = function(db) {
  try {
    // Add the status column with default 'active' (safe if column doesn't exist)
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
  } catch (err) {
    // If column already exists, ignore the error
    console.warn('Migration 003: status column may already exist:', err.message);
  }

  try {
    // Ensure existing rows have an explicit status value
    db.exec("UPDATE users SET status = 'active' WHERE status IS NULL");
  } catch (err) {
    console.warn('Migration 003: failed to update existing user statuses:', err.message);
  }

  try {
    // Create an index on status for faster lookups
    db.exec("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)");
  } catch (err) {
    console.warn('Migration 003: failed to create index idx_users_status:', err.message);
  }
};
