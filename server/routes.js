const express = require('express');
const db = require('./db');

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secret123';

// Helper to get puzzle
function getPuzzle(missionId) {
  return db.prepare('SELECT * FROM puzzles WHERE mission_id = ?').get(missionId);
}

// POST /api/login - admin login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

// POST /api/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Middleware to authenticate admin
function authenticateAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Admin Dashboard Routes
router.get('/admin/teams', authenticateAdmin, (req, res) => {
  const teams = db.prepare('SELECT * FROM teams').all();
  teams.forEach(t => {
    t.keys_discovered = JSON.parse(t.keys_discovered || '[]');
  });
  res.json(teams);
});

router.post('/admin/event/start', authenticateAdmin, (req, res) => {
  const start_time = Date.now();
  const info = db.prepare("UPDATE teams SET status = 'in_progress', start_time = ? WHERE status = 'not_started'").run(start_time);
  res.json({ success: true, message: `Started event for ${info.changes} waiting agents.` });
});

router.post('/admin/event/stop', authenticateAdmin, (req, res) => {
  const end_time = Date.now();
  const activeTeams = db.prepare("SELECT * FROM teams WHERE status = 'in_progress'").all();
  
  const updateStmt = db.prepare("UPDATE teams SET end_time = ?, final_time = ?, score = 0, status = 'timeout' WHERE id = ?");
  const transaction = db.transaction((teams) => {
    for (const team of teams) {
      const elapsed_ms = end_time - team.start_time;
      updateStmt.run(end_time, elapsed_ms, team.id);
    }
  });
  transaction(activeTeams);
  
  res.json({ success: true, message: `Stopped event for ${activeTeams.length} active agents.` });
});

router.post('/admin/event/reset-all', authenticateAdmin, (req, res) => {
  db.prepare("DELETE FROM level_attempts").run();
  db.prepare("DELETE FROM teams").run();
  res.json({ success: true, message: 'All agent data has been permanently erased.' });
});

router.post('/admin/event/reset-leaderboard', authenticateAdmin, (req, res) => {
  db.prepare("UPDATE teams SET current_level = 1, status = 'not_started', score = 0, hints_used = 0, keys_discovered = '[]', start_time = NULL, end_time = NULL, final_time = NULL, total_penalty_minutes = 0").run();
  db.prepare("DELETE FROM level_attempts").run();
  res.json({ success: true, message: 'Leaderboard cleared. All agents are back to STANDBY.' });
});

router.post('/admin/teams/:id/reset', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE teams SET current_level = 1, status = 'not_started', score = 0, hints_used = 0, keys_discovered = '[]' WHERE id = ?").run(id);
  res.json({ success: true });
});

router.post('/admin/teams/:id/level', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { level } = req.body;
  db.prepare('UPDATE teams SET current_level = ? WHERE id = ?').run(level, id);
  res.json({ success: true });
});

router.get('/admin/puzzles', authenticateAdmin, (req, res) => {
  const puzzles = db.prepare('SELECT * FROM puzzles').all();
  res.json(puzzles);
});

router.post('/admin/puzzles/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { title, hero, content, answer, hint } = req.body;
  db.prepare('UPDATE puzzles SET title = ?, hero = ?, content = ?, answer = ?, hint = ? WHERE mission_id = ?')
    .run(title, hero, content, answer, hint, id);
  res.json({ success: true });
});

// Public / Player Routes
router.get('/leaderboard', (req, res) => {
  const teams = db.prepare('SELECT id, team_name, current_level, status, start_time, end_time, score, hints_used, final_time FROM teams').all();
  teams.forEach(t => {
    if (t.status === 'in_progress') {
       t.current_time_ms = Date.now() - t.start_time;
    }
  });
  teams.sort((a, b) => {
    if (a.status === 'escaped' && b.status !== 'escaped') return -1;
    if (b.status === 'escaped' && a.status !== 'escaped') return 1;
    if (a.status === 'escaped' && b.status === 'escaped') {
      if (b.score !== a.score) return b.score - a.score;
      return a.final_time - b.final_time; 
    }
    if (a.current_level !== b.current_level) return b.current_level - a.current_level;
    return (a.current_time_ms || 0) - (b.current_time_ms || 0);
  });
  res.json(teams);
});

router.get('/teams/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  team.keys_discovered = JSON.parse(team.keys_discovered || '[]');
  
  const puzzle = getPuzzle(team.current_level);
  if (puzzle) {
    team.level_name = puzzle.title;
    team.level_hero = puzzle.hero;
    team.level_text = puzzle.content;
  }
  res.json(team);
});

router.post('/teams', (req, res) => {
  const { team_name, members } = req.body;
  if (!team_name || !members) return res.status(400).json({ error: 'Missing fields' });

  try {
    const info = db.prepare('INSERT INTO teams (team_name, members) VALUES (?, ?)').run(team_name, members);
    res.json({ id: info.lastInsertRowid, team_name, members });
  } catch (err) {
    res.status(400).json({ error: 'Team name might already exist' });
  }
});

router.post('/teams/:id/start', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  if (team.status === 'not_started') {
    db.prepare('UPDATE teams SET start_time = ?, status = ? WHERE id = ?').run(Date.now(), 'in_progress', req.params.id);
  }
  res.json({ success: true });
});

router.post('/teams/:id/submit', (req, res) => {
  const { answer } = req.body;
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  
  if (!team || team.status !== 'in_progress') {
    return res.status(400).json({ error: 'Invalid team or not in progress' });
  }

  // Rate Limiter: Prevent brute-forcing by requiring 2 seconds between guesses
  const lastAttempt = db.prepare('SELECT timestamp FROM level_attempts WHERE team_id = ? ORDER BY timestamp DESC LIMIT 1').get(teamId);
  if (lastAttempt) {
    const timeSinceLastAttempt = Date.now() - lastAttempt.timestamp;
    if (timeSinceLastAttempt < 2000) {
      return res.status(429).json({ message: 'RATE LIMIT: SYSTEM OVERLOAD. Wait 2 seconds before overriding again.' });
    }
  }

  const puzzle = getPuzzle(team.current_level);
  if (!puzzle) return res.status(500).json({ error: 'Puzzle not found' });

  const isCorrect = answer.trim().toLowerCase() === puzzle.answer.trim().toLowerCase();
  
  db.prepare('INSERT INTO level_attempts (team_id, level_number, submitted_answer, is_correct, timestamp) VALUES (?, ?, ?, ?, ?)').run(
    teamId, team.current_level, answer, isCorrect ? 1 : 0, Date.now()
  );

  if (isCorrect) {
    const key_reward = `${puzzle.title}_CORE`;
    if (team.current_level < 7) {
      const keys = JSON.parse(team.keys_discovered || '[]');
      keys.push(key_reward);
      db.prepare('UPDATE teams SET current_level = current_level + 1, keys_discovered = ? WHERE id = ?').run(JSON.stringify(keys), teamId);
      return res.json({ success: true, message: 'MISSION COMPLETE!', key: key_reward });
    } else {
      return res.json({ success: true, message: 'FOSS CORE RESTORED!' });
    }
  } else {
    return res.json({ success: false, message: 'Incorrect answer.' });
  }
});

router.post('/teams/:id/hint', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team || team.status !== 'in_progress') return res.status(400).json({ error: 'Invalid team' });

  db.prepare('UPDATE teams SET hints_used = hints_used + 1 WHERE id = ?').run(teamId);

  const puzzle = getPuzzle(team.current_level);
  res.json({ success: true, hints_used: team.hints_used + 1, hint: puzzle.hint });
});

router.post('/teams/:id/finish', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team || team.status !== 'in_progress') return res.status(400).json({ error: 'Invalid team' });

  if (team.current_level === 7) {
    const end_time = Date.now();
    const elapsed_ms = end_time - team.start_time;
    const elapsed_minutes = elapsed_ms / (1000 * 60);

    let base_score = 0;
    if (elapsed_minutes <= 15) base_score = 60;
    else if (elapsed_minutes <= 30) base_score = 45;
    else if (elapsed_minutes <= 45) base_score = 30;
    else if (elapsed_minutes <= 60) base_score = 15;
    else base_score = 0;

    const hint_penalty = team.hints_used > 0 ? 10 : 0;
    let final_score = Math.max(0, base_score - hint_penalty);
    if (base_score === 0) final_score = 0;

    db.prepare('UPDATE teams SET end_time = ?, final_time = ?, score = ?, status = ? WHERE id = ?').run(
      end_time, elapsed_ms, final_score, 'escaped', teamId
    );
    res.json({ success: true, score: final_score, final_time: elapsed_ms });
  } else {
    res.status(400).json({ error: 'Not finished yet' });
  }
});

router.post('/teams/:id/timeout', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team || team.status !== 'in_progress') return res.status(400).json({ error: 'Invalid team' });

  const end_time = Date.now();
  const elapsed_ms = end_time - team.start_time;

  db.prepare('UPDATE teams SET end_time = ?, final_time = ?, score = ?, status = ? WHERE id = ?').run(
    end_time, elapsed_ms, 0, 'timeout', teamId
  );
  res.json({ success: true });
});

module.exports = router;
