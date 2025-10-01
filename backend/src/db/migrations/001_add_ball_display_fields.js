/**
 * Migration: Add color and image fields to balls table
 * Also add profile_picture to users table
 */

const applyMigration = (db) => {
  console.log('Running migration: Add ball display fields...');
  
  try {
    // Add color and image columns to balls table
    db.exec(`
      ALTER TABLE balls ADD COLUMN color TEXT DEFAULT '#374151';
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN image TEXT;
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN coverstock TEXT;
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN core_type TEXT;
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN hook_potential TEXT;
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN length TEXT;
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN backend TEXT;
    `);
    
    db.exec(`
      ALTER TABLE balls ADD COLUMN notes TEXT;
    `);
    
    // Add profile picture column to users table
    db.exec(`
      ALTER TABLE users ADD COLUMN profile_picture TEXT;
    `);
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    // Check if columns already exist (migration already ran)
    if (error.message.includes('duplicate column name')) {
      console.log('Migration already applied, skipping...');
      return true;
    }
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = { applyMigration };
