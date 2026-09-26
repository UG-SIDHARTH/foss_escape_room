const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'escape_room.db');
const db = new Database(dbPath, { verbose: console.log });

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
      keys_discovered TEXT DEFAULT '[]',
      level_variants TEXT DEFAULT '{}'
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

    CREATE TABLE IF NOT EXISTS puzzles (
      mission_id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      hero TEXT NOT NULL,
      content TEXT NOT NULL,
      answer TEXT NOT NULL,
      hint TEXT NOT NULL
    );
  `);

  // Seed puzzles if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM puzzles').get();
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO puzzles (mission_id, title, hero, content, answer, hint) VALUES (?, ?, ?, ?, ?, ?)');
    insert.run(1, 'IRON CODE', 'Iron Man', 'The logic gates have been jammed. A simple XOR is all it takes to find the override key.\\nIf A = 1011 and B = 1101, what is A XOR B?', '0110', 'Use binary XOR rules: 1^1=0, 0^0=0, 1^0=1, 0^1=1.');
    insert.run(2, 'WEB OF TRUTH', 'Spider-Man', 'The attacker left a trace online. What is the standard port number for secure web traffic?', '443', 'HTTP is 80, but secure is...?');
    insert.run(3, 'SHIELD PROTOCOL', 'Captain America', 'Defense is down. We need the name of the most common symmetric encryption algorithm standard used today (3 letters).', 'AES', 'Advanced Encryption Standard.');
    insert.run(4, 'GAMMA ERROR', 'Hulk', 'A memory leak is causing a meltdown! The debugger output shows a Segmentation fault. What signal number represents SIGSEGV on most POSIX systems?', '11', 'Look up Linux signal numbers.');
    insert.run(5, 'MIND OF CODE', 'Vision', 'The core kernel was written by one man in 1991. What is his first name?', 'Linus', 'He also created Git.');
    insert.run(6, 'AVENGERS ASSEMBLE', 'All', 'Combine the fragments: What is the ultimate open-source operating system kernel?', 'Linux', 'It relates to mission 5.');
  }
}

initDb();

module.exports = db;
