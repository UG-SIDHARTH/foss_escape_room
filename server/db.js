const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'escape_room.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize schema
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT NOT NULL UNIQUE,
      members TEXT NOT NULL,
      current_level INTEGER DEFAULT 1,
      hints_used INTEGER DEFAULT 0,
      start_time INTEGER,
      end_time INTEGER,
      total_penalty_minutes INTEGER DEFAULT 0,
      final_time INTEGER,
      score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'escaped'
      keys_discovered TEXT DEFAULT '[]', -- JSON array of key strings
      level_variants TEXT DEFAULT '{}' -- JSON object of variants
    );

    CREATE TABLE IF NOT EXISTS level_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      level_number INTEGER NOT NULL,
      submitted_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(team_id) REFERENCES teams(id)
    );
  `);
  
  try {
    db.exec(`ALTER TABLE teams ADD COLUMN level_variants TEXT DEFAULT '{}'`);
  } catch(e) {}
  
  try {
    db.exec(`ALTER TABLE teams ADD COLUMN score INTEGER DEFAULT 0`);
  } catch(e) {}
}

initDb();

module.exports = db;
