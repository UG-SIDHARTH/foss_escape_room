import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'puzzles'

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

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <div className="container">&gt; LOADING DIRECTOR TERMINAL...</div>;

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

  return (
    <div className="container" style={{ maxWidth: '100%' }}>
      <header className="flex-row justify-between items-center mb-8">
        <h1 className="text-4xl text-red">&gt; S.H.I.E.L.D. OVERRIDE DASHBOARD</h1>
        <div className="flex-row gap-4">
          <button onClick={() => setActiveTab('teams')} className={activeTab === 'teams' ? 'gold' : ''}>AGENTS</button>
          <button onClick={() => setActiveTab('puzzles')} className={activeTab === 'puzzles' ? 'gold' : ''}>PUZZLES</button>
        </div>
      </header>
      
      {errorMsg && <div className="text-red mb-4">&gt; ERR: {errorMsg}</div>}

      <div className="mb-8 p-4 panel flex-row justify-between items-center" style={{ border: '1px solid var(--accent-magenta)' }}>
        <h3 className="text-magenta">&gt; GLOBAL EVENT CONTROLS</h3>
        <div className="flex-row gap-4">
          <button onClick={handleStartEvent} className="gold" style={{ padding: '0.5rem 2rem' }}>&gt; START EVENT</button>
          <button onClick={handleStopEvent} className="red" style={{ padding: '0.5rem 2rem' }}>&gt; STOP EVENT</button>
        </div>
      </div>

      {activeTab === 'teams' && (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <div className="flex-row justify-between items-center mb-4">
            <h2 className="text-blue">AGENT LOGS</h2>
            <button className="gold" onClick={exportCSV}>&gt; EXPORT CSV</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--accent-blue)', textAlign: 'left' }}>
                <th className="p-4">ID</th>
                <th className="p-4">AGENT ALIAS</th>
                <th className="p-4">STATUS</th>
                <th className="p-4">LEVEL</th>
                <th className="p-4">HINTS</th>
                <th className="p-4">SCORE</th>
                <th className="p-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                  <td className="p-4">{t.id}</td>
                  <td className="p-4 font-bold">{t.team_name}</td>
                  <td className="p-4">{t.status === 'escaped' ? <span className="text-gold">ESCAPED</span> : t.status === 'timeout' ? <span className="text-red">TIMEOUT</span> : t.status === 'in_progress' ? 'ACTIVE' : 'IDLE'}</td>
                  <td className="p-4 text-blue cursor-pointer" onClick={() => handleUpdateLevel(t.id, t.current_level)}>
                    {t.current_level} ✏️
                  </td>
                  <td className="p-4">{t.hints_used}</td>
                  <td className="p-4">{t.score}</td>
                  <td className="p-4 flex-row gap-4">
                    <button className="red" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleResetTeam(t.id)}>RESET</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'puzzles' && (
        <div className="flex-col gap-8">
          {puzzles.map(p => (
            <div key={p.mission_id} className="panel">
              <h3 className="text-blue mb-4">&gt; MISSION 0{p.mission_id}: {p.title}</h3>
              <form onSubmit={(e) => handlePuzzleUpdate(e, p)} className="flex-col gap-4">
                <div className="flex-row gap-4">
                  <div className="flex-col flex-1">
                    <label>TITLE</label>
                    <input name="title" defaultValue={p.title} />
                  </div>
                  <div className="flex-col flex-1">
                    <label>HERO</label>
                    <input name="hero" defaultValue={p.hero} />
                  </div>
                </div>
                <div className="flex-col">
                  <label>CONTENT</label>
                  <textarea name="content" defaultValue={p.content} rows="4" style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--text-color)', border: '1px solid var(--accent-blue)', padding: '0.5rem', fontFamily: 'monospace' }}></textarea>
                </div>
                <div className="flex-row gap-4">
                  <div className="flex-col flex-1">
                    <label>ANSWER</label>
                    <input name="answer" defaultValue={p.answer} />
                  </div>
                  <div className="flex-col flex-1">
                    <label>HINT</label>
                    <input name="hint" defaultValue={p.hint} />
                  </div>
                </div>
                <button type="submit" className="gold mt-4" style={{ alignSelf: 'flex-start' }}>&gt; SAVE OVERRIDE</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
