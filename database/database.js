// ==============================================================================
// Member 2: Database Management
// Files Owned: database/database.js
// Key Responsibilities:
// 1. Establish asynchronous SQLite database connection (lensLab.db).
// 2. Enable referential integrity with PRAGMA foreign_keys = ON.
// 3. Define relational schemas: photographers, cameras, and rentals tables.
// 4. Ensure cameras table is initialized cleanly without pre-seeded records (Twist Test 3).
// 5. Provide singleton getDB() accessor for endpoint handlers.
// ==============================================================================

const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

let db = null;

const dbPath = path.join(__dirname, 'lensLab.db');

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Enable SQLite foreign key constraint enforcement
    await db.run('PRAGMA foreign_keys = ON;');

    // Table 1: photographers
    await db.run(`
      CREATE TABLE IF NOT EXISTS photographers (
        photographer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT
      );
    `);

    // Table 2: cameras
    // NOTE: Kept initially empty without seed data to demonstrate Twist Test 3
    await db.run(`
      CREATE TABLE IF NOT EXISTS cameras (
        camera_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        kind TEXT NOT NULL
      );
    `);

    // Table 3: rentals
    await db.run(`
      CREATE TABLE IF NOT EXISTS rentals (
        rental_id INTEGER PRIMARY KEY AUTOINCREMENT,
        photographer_id INTEGER NOT NULL,
        camera_id INTEGER NOT NULL,
        rental_date TEXT NOT NULL,
        return_date TEXT,
        FOREIGN KEY (photographer_id) REFERENCES photographers(photographer_id),
        FOREIGN KEY (camera_id) REFERENCES cameras(camera_id)
      );
    `);

    console.log('Database initialized successfully with photographers, cameras, and rentals tables.');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDB first.');
  }
  return db;
};

module.exports = {
  initializeDB,
  getDB,
};
