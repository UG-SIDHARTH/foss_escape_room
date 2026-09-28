import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, ExternalLink, RefreshCw, Hourglass, 
  Play, Trophy, RotateCcw, MonitorX 
} from 'lucide-react';
import './AdminDashboard.css';

const API_BASE = '/api';

function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'puzzles'
  const [inviteMode, setInviteMode] = useState('OPEN');

  const fetchData = async () => {
    try {
      const [teamRes, puzzleRes] = await Promise.all([
        fetch(`${API_BASE}/admin/teams`, { credentials: 'include' }),
        fetch(`${API_BASE}/admin/puzzles`, { credentials: 'include' })
      ]);
      
      if (teamRes.status === 401 || puzzleRes.status === 401) {
        navigate('/admin/login');
        return;
      }
      
      setTeams(await teamRes.json());
      setPuzzles(await puzzleRes.json());
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleResetTeam = async (id) => {
    if (!window.confirm("Are you sure you want to reset this team's progress?")) return;
    await fetch(`${API_BASE}/admin/teams/${id}/reset`, { method: 'POST', credentials: 'include' });
    fetchData();
  };

  const handleUpdateLevel = async (id, level) => {
    const newLevel = prompt("Enter new level (1-6):", level);
    if (newLevel && !isNaN(newLevel)) {
      await fetch(`${API_BASE}/admin/teams/${id}/level`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: parseInt(newLevel) }),
        credentials: 'include' 
      });
      fetchData();
    }
  };

  const handlePuzzleUpdate = async (e, p) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    await fetch(`${API_BASE}/admin/puzzles/${p.mission_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    alert('Puzzle Updated');
    fetchData();
  };

  const handleStartEvent = async () => {
    if (!window.confirm("Are you sure you want to START the event for ALL waiting players?")) return;
    const res = await fetch(`${API_BASE}/admin/event/start`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    alert(data.message);
    fetchData();
  };

  const handleStopEvent = async () => {
    if (!window.confirm("WARNING: Are you sure you want to FORCE STOP the event for all active players? (They will be marked as Timeout)")) return;
    const res = await fetch(`${API_BASE}/admin/event/stop`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    alert(data.message);
    fetchData();
  };

  const handleWipeData = async () => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to PERMANENTLY ERASE all agent registrations and scores? This cannot be undone!")) return;
    if (window.prompt("Type 'CONFIRM' to execute data wipe:") !== 'CONFIRM') return;
    const res = await fetch(`${API_BASE}/admin/event/reset-all`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    alert(data.message);
    fetchData();
  };

  const handleClearLeaderboard = async () => {
    if (!window.confirm("WARNING: Are you sure you want to CLEAR the leaderboard? (Agents will remain registered, but their progress and scores will be reset).")) return;
    const res = await fetch(`${API_BASE}/admin/event/reset-leaderboard`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    alert(data.message);
    fetchData();
  };

  const exportCSV = () => {
    if (teams.length === 0) return;
    const headers = ['ID', 'Alias', 'Full Name', 'Status', 'Level', 'Hints', 'Score', 'Final Time (ms)'];
    const rows = teams.map(t => [
      t.id,
      `"${t.team_name.replace(/"/g, '""')}"`,
      `"${t.members.replace(/"/g, '""')}"`,
      t.status,
      t.current_level,
      t.hints_used,
      t.score,
      t.final_time || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'agents_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="admin-theme" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#8b5cf6' }}>Loading Director Terminal...</div>;

  const joinedCount = teams.length;
  const escapedCount = teams.filter(t => t.status === 'escaped').length;
  const activeCount = teams.filter(t => t.status === 'in_progress').length;
  const timeoutCount = teams.filter(t => t.status === 'timeout').length;

  const joinUrl = `${window.location.origin}/join/agent-token-123`;

  return (
    <div className="admin-theme">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge">H</div>
          <span className="admin-title">Host Dashboard</span>
          <span className="admin-subtitle">FOSS ESCAPE ROOM</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>AGENTS</button>
        <button className={`admin-tab ${activeTab === 'puzzles' ? 'active' : ''}`} onClick={() => setActiveTab('puzzles')}>PUZZLES</button>
      </div>
      
      {errorMsg && <div style={{ color: '#f87171', padding: '1rem 1.5rem' }}>{errorMsg}</div>}

      <div className="admin-layout">
        {/* Left Sidebar */}
        <aside className="admin-sidebar">
          {/* QR Code Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Current QR Code</h3>
              <button className="admin-card-action">
                <RefreshCw size={14} /> Next
              </button>
            </div>
            
            <div className="qr-container">
               <QRCodeSVG value={joinUrl} size={200} />
            </div>

            <div className="qr-link-area">
              <div>Token: agent-token-123...</div>
              <div className="qr-link">
                {joinUrl}
                <button className="qr-icon-btn"><ExternalLink size={14} /></button>
                <button className="qr-icon-btn"><Copy size={14} /></button>
              </div>
            </div>

            <div className="invite-toggle">
              <button className={inviteMode === 'OPEN' ? 'active' : ''} onClick={() => setInviteMode('OPEN')}>OPEN</button>
              <button className={inviteMode === 'INVITE ONLY' ? 'active' : ''} onClick={() => setInviteMode('INVITE ONLY')}>INVITE ONLY</button>
            </div>
            <div className="invite-toggle-subtext">Anyone with the link can join.</div>
          </div>

          {/* Event Controls */}
          <div className="admin-card">
            <h3 className="admin-card-title admin-mb-4">Event Controls</h3>
            <div className="event-controls">
              <button className="control-btn" style={{ cursor: 'default' }}>
                <Hourglass className="control-btn-icon" />
                <div className="control-btn-text">
                  <h4>Waiting</h4>
                  <p>Hold participants</p>
                </div>
              </button>
              
              <button className="control-btn active" onClick={handleStartEvent}>
                <Play className="control-btn-icon" />
                <div className="control-btn-text">
                  <h4>Start Event</h4>
                  <p>Let participants play</p>
                </div>
              </button>

              <button className="control-btn" onClick={handleStopEvent}>
                <MonitorX className="control-btn-icon" />
                <div className="control-btn-text">
                  <h4>Stop Event</h4>
                  <p>Force timeout all active players</p>
                </div>
              </button>

              <button className="control-btn" onClick={handleClearLeaderboard}>
                <Trophy className="control-btn-icon" />
                <div className="control-btn-text">
                  <h4>Clear Leaderboard</h4>
                  <p>Reset progress & scores</p>
                </div>
              </button>

              <button className="control-btn danger" onClick={handleWipeData}>
                <RotateCcw className="control-btn-icon" />
                <div className="control-btn-text">
                  <h4>Wipe Data</h4>
                  <p>Permanently erase all data</p>
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="admin-main">
          {activeTab === 'teams' ? (
            <>
              {/* Stat Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Joined</span>
                  <p className="stat-value blue">{joinedCount}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Escaped</span>
                  <p className="stat-value green">{escapedCount}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Active</span>
                  <p className="stat-value yellow">{activeCount}</p>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Timeout</span>
                  <p className="stat-value red">{timeoutCount}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="admin-card">
                <div className="progress-header">
                  <span>Escape Progress</span>
                  <span>{escapedCount} / {joinedCount || 0}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${joinedCount === 0 ? 0 : (escapedCount / joinedCount) * 100}%` }}></div>
                </div>
                <div className="progress-footer">
                  <span>In Progress</span>
                  <span>Remaining: {joinedCount - escapedCount}</span>
                </div>
              </div>

              {/* Participants Table */}
              <div className="admin-card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="admin-card-header" style={{ padding: '1.25rem', marginBottom: 0, borderBottom: '1px solid #27272a' }}>
                  <h3 className="admin-card-title">Participants</h3>
                  <button className="admin-card-action" onClick={exportCSV}>
                    <RefreshCw size={14} /> Export CSV
                  </button>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Agent Alias</th>
                        <th>Status</th>
                        <th>Level</th>
                        <th>Hints</th>
                        <th>Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.length === 0 ? (
                        <tr>
                          <td colSpan="7">
                            <div className="empty-state">No participants yet</div>
                          </td>
                        </tr>
                      ) : (
                        teams.map(t => (
                          <tr key={t.id}>
                            <td>{t.id}</td>
                            <td style={{ fontWeight: 600 }}>{t.team_name}</td>
                            <td>
                              <span className={`status-badge status-${t.status}`}>
                                {t.status === 'escaped' ? 'ESCAPED' : t.status === 'timeout' ? 'TIMEOUT' : t.status === 'in_progress' ? 'ACTIVE' : 'IDLE'}
                              </span>
                            </td>
                            <td className="clickable-cell" onClick={() => handleUpdateLevel(t.id, t.current_level)}>
                              {t.current_level} ✏️
                            </td>
                            <td>{t.hints_used}</td>
                            <td>{t.score}</td>
                            <td>
                              <button className="action-btn-danger" onClick={() => handleResetTeam(t.id)}>Reset</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-card" style={{ padding: '2rem' }}>
              <div className="admin-card-header" style={{ marginBottom: '2rem' }}>
                <h3 className="admin-card-title">Puzzle Overrides</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {puzzles.map(p => (
                  <div key={p.mission_id} style={{ borderBottom: '1px solid #27272a', paddingBottom: '2rem' }}>
                    <h4 style={{ color: '#60a5fa', marginBottom: '1rem', marginTop: 0 }}>MISSION 0{p.mission_id}: {p.title}</h4>
                    <form onSubmit={(e) => handlePuzzleUpdate(e, p)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="admin-flex-row">
                        <div className="admin-flex-col">
                          <label className="stat-label">Title</label>
                          <input name="title" defaultValue={p.title} className="admin-input" />
                        </div>
                        <div className="admin-flex-col">
                          <label className="stat-label">Hero</label>
                          <input name="hero" defaultValue={p.hero} className="admin-input" />
                        </div>
                      </div>
                      <div className="admin-flex-col">
                        <label className="stat-label">Content</label>
                        <textarea name="content" defaultValue={p.content} className="admin-textarea"></textarea>
                      </div>
                      <div className="admin-flex-row">
                        <div className="admin-flex-col">
                          <label className="stat-label">Answer</label>
                          <input name="answer" defaultValue={p.answer} className="admin-input" />
                        </div>
                        <div className="admin-flex-col">
                          <label className="stat-label">Hint</label>
                          <input name="hint" defaultValue={p.hint} className="admin-input" />
                        </div>
                      </div>
                      <button type="submit" className="admin-btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>Save Override</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
