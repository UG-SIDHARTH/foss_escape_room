const express = require('express');
const db = require('./db');
const { validateAnswer, getLevelHint, getLevelInfo } = require('./puzzleLogic');
const jwt = require('jsonwebtoken');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secret123';

// POST /api/login - admin login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

// Middleware to authenticate admin
function authenticateAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/admin/teams - fetch full team state for dashboard
router.get('/admin/teams', authenticateAdmin, (req, res) => {
  const teams = db.prepare('SELECT * FROM teams').all();
  teams.forEach(t => {
    t.keys_discovered = JSON.parse(t.keys_discovered || '[]');
    t.level_variants = JSON.parse(t.level_variants || '{}');
  });
  res.json(teams);
});

// GET /api/leaderboard - fetch public leaderboard state (stripped of secrets)
router.get('/leaderboard', (req, res) => {
  const teams = db.prepare('SELECT id, team_name, current_level, status, start_time, end_time, total_penalty_minutes, final_time FROM teams').all();
  res.json(teams);
});

// GET /api/teams/:id - fetch team state
router.get('/teams/:id', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  team.keys_discovered = JSON.parse(team.keys_discovered);
  
  // Attach current level info
  const variants = JSON.parse(team.level_variants || '{}');
  const variantId = variants[team.current_level] !== undefined ? variants[team.current_level] : 0;
  const levelInfo = getLevelInfo(team.current_level, variantId);
  if (levelInfo) {
    team.level_name = levelInfo.name;
    team.level_text = levelInfo.text;
  }
  
  res.json(team);
});

// POST /api/teams - register
router.post('/teams', (req, res) => {
  const { team_name, members } = req.body;
  if (!team_name || !members) return res.status(400).json({ error: 'Missing fields' });

  // Generate random variants for levels 1-5 (picking from 0, 1, 2)
  const variants = {};
  for(let i=1; i<=5; i++) {
    variants[i] = Math.floor(Math.random() * 3);
  }
  variants[6] = 0; // Level 6 only has 1 variant

  try {
    const info = db.prepare('INSERT INTO teams (team_name, members, level_variants) VALUES (?, ?, ?)').run(team_name, members, JSON.stringify(variants));
    res.json({ id: info.lastInsertRowid, team_name, members });
  } catch (err) {
    res.status(400).json({ error: 'Team name might already exist' });
  }
});

// POST /api/teams/:id/start
router.post('/teams/:id/start', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  if (team.status === 'not_started') {
    db.prepare('UPDATE teams SET start_time = ?, status = ? WHERE id = ?').run(Date.now(), 'in_progress', req.params.id);
  }
  res.json({ success: true });
});

// POST /api/teams/:id/submit
router.post('/teams/:id/submit', (req, res) => {
  const { answer } = req.body;
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  
  if (!team || team.status !== 'in_progress') {
    return res.status(400).json({ error: 'Invalid team or not in progress' });
  }

  const variants = JSON.parse(team.level_variants || '{}');
  const variantId = variants[team.current_level] !== undefined ? variants[team.current_level] : 0;
  
  const { isCorrect, key_reward } = validateAnswer(team.current_level, variantId, answer, JSON.parse(team.keys_discovered));
  
  // Log attempt
  db.prepare('INSERT INTO level_attempts (team_id, level_number, submitted_answer, is_correct, timestamp) VALUES (?, ?, ?, ?, ?)').run(
    teamId, team.current_level, answer, isCorrect ? 1 : 0, Date.now()
  );

  if (isCorrect) {
    if (team.current_level < 6) {
      const keys = JSON.parse(team.keys_discovered);
      keys.push(key_reward);
      db.prepare('UPDATE teams SET current_level = current_level + 1, keys_discovered = ? WHERE id = ?').run(JSON.stringify(keys), teamId);
      return res.json({ success: true, message: 'Level complete!', key: key_reward });
    } else {
      // Finished all levels
      return res.json({ success: true, message: 'ESCAPE COMPLETE!' });
    }
  } else {
    return res.json({ success: false, message: 'Incorrect answer.' });
  }
});

// POST /api/teams/:id/hint
router.post('/teams/:id/hint', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team || team.status !== 'in_progress') return res.status(400).json({ error: 'Invalid team' });

  if (team.hints_used >= 3) {
    return res.status(400).json({ error: 'No hints remaining' });
  }

  // Add a 5 minute penalty per hint
  const PENALTY_MINUTES = 5;
  db.prepare('UPDATE teams SET hints_used = hints_used + 1, total_penalty_minutes = total_penalty_minutes + ? WHERE id = ?').run(PENALTY_MINUTES, teamId);

  const variants = JSON.parse(team.level_variants || '{}');
  const variantId = variants[team.current_level] !== undefined ? variants[team.current_level] : 0;

  const hintText = getLevelHint(team.current_level, variantId);
  res.json({ success: true, hints_used: team.hints_used + 1, hint: hintText });
});

// POST /api/teams/:id/finish
router.post('/teams/:id/finish', (req, res) => {
  const teamId = req.params.id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team || team.status !== 'in_progress') return res.status(400).json({ error: 'Invalid team' });

  if (team.current_level === 6) { // Make sure they actually solved level 6
    const end_time = Date.now();
    const elapsed_ms = end_time - team.start_time;
    const final_time_ms = elapsed_ms + (team.total_penalty_minutes * 60 * 1000);

    db.prepare('UPDATE teams SET end_time = ?, final_time = ?, status = ? WHERE id = ?').run(
      end_time, final_time_ms, 'escaped', teamId
    );
    res.json({ success: true, final_time: final_time_ms });
  } else {
    res.status(400).json({ error: 'Not finished yet' });
  }
});

// GET /api/leaderboard - fetch public leaderboard state (stripped of secrets)
router.get('/leaderboard', (req, res) => {
  const teams = db.prepare('SELECT id, team_name, current_level, status, start_time, end_time, total_penalty_minutes, final_time FROM teams').all();
  
  teams.forEach(t => {
    // calculate current time if still in progress
    if (t.status === 'in_progress') {
       const elapsed = Date.now() - t.start_time;
       t.current_time_ms = elapsed + (t.total_penalty_minutes * 60 * 1000);
    }
  });

  // Sort: 'escaped' first by final_time, then 'in_progress' by level (desc) and current_time (asc)
  teams.sort((a, b) => {
    if (a.status === 'escaped' && b.status !== 'escaped') return -1;
    if (b.status === 'escaped' && a.status !== 'escaped') return 1;
    if (a.status === 'escaped' && b.status === 'escaped') return a.final_time - b.final_time;
    
    // Both in progress
    if (a.current_level !== b.current_level) return b.current_level - a.current_level;
    return (a.current_time_ms || 0) - (b.current_time_ms || 0);
  });

  res.json(teams);
});

module.exports = router;
