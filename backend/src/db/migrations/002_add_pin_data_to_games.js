/**
 * Migration: Add pin data storage for pin-by-pin games
 * This stores which specific pins were hit for each throw
 */

const applyMigration = (db) => {
  console.log('Running migration: 002_add_pin_data_to_games');
  
  try {
    // Add pin_data column to games table to store frameThrowPins and frameBalls
    db.exec(`
      ALTER TABLE games ADD COLUMN pin_data TEXT;
    `);
    
    console.log('Migration 002_add_pin_data_to_games completed successfully');
    return true;
  } catch (error) {
    // Check if column already exists
    if (error.message.includes('duplicate column name')) {
      console.log('Migration already applied, skipping...');
      return true;
    }
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = { applyMigration };
