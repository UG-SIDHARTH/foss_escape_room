import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LevelView from './LevelView';

const API_BASE = '/api';

function MissionDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hintMsg, setHintMsg] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`${API_BASE}/teams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
        if (data.status === 'escaped') {
          navigate(`/complete/${id}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    // Poll team state occasionally to keep in sync if they play on multiple devices
    const interval = setInterval(fetchTeam, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (team && team.status === 'in_progress') {
      const interval = setInterval(() => {
        setElapsedMs(Date.now() - team.start_time);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [team]);

  const handleStart = async () => {
    try {
      await fetch(`${API_BASE}/teams/${id}/start`, { method: 'POST' });
      fetchTeam();
    } catch (err) {}
  };

  const handleHint = async () => {
    if (!window.confirm("Use a hint? This will add 5 minutes to your final time!")) return;
    try {
      const res = await fetch(`${API_BASE}/teams/${id}/hint`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setErrorMsg('');
        setHintMsg(data.hint);
        fetchTeam();
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {}
  };

  const handleSubmit = async (answer) => {
    setErrorMsg('');
    setSuccessMsg('');
    setHintMsg('');
    try {
      const res = await fetch(`${API_BASE}/teams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        if (data.message === 'ESCAPE COMPLETE!') {
          // Finish mission
          await fetch(`${API_BASE}/teams/${id}/finish`, { method: 'POST' });
          navigate(`/complete/${id}`);
        } else {
          fetchTeam();
        }
      } else {
        setErrorMsg(data.message || 'INCORRECT ANSWER.');
      }
    } catch (err) {}
  };

  if (loading) return <div className="container">&gt; LOADING...</div>;
  if (!team) return <div className="container text-red">&gt; TEAM NOT FOUND</div>;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (team.status === 'not_started') {
    return (
      <div className="container flex-col items-center" style={{ marginTop: '20vh' }}>
        <h1 className="text-4xl glitch mb-4">&gt; MISSION BRIEFING</h1>
        <p className="mb-4">Welcome, Team {team.team_name}.</p>
        <p className="mb-4" style={{ maxWidth: '600px', textAlign: 'center' }}>
          You are trapped in the FOSS Escape Room. You must solve 6 levels to collect the keys and escape.
          You have 3 hints available. Each hint will add a 5-minute penalty to your final time.
        </p>
        <button onClick={handleStart} className="text-2xl p-4">&gt; START MISSION</button>
      </div>
    );
  }

  return (
    <div className="container flex-col" style={{ minHeight: '100vh' }}>
      <header className="flex justify-between items-center p-4 mb-8" style={{ borderBottom: '1px solid var(--text-color)' }}>
        <div>
          <h2>&gt; TEAM: {team.team_name}</h2>
          <p>LEVEL {team.current_level} / 6</p>
        </div>
        <div className="text-right">
          <h2 className="text-amber">&gt; T+ {formatTime(elapsedMs)}</h2>
          <p className="text-red">PENALTY: {team.total_penalty_minutes} MIN</p>
        </div>
      </header>

      <div className="responsive-layout" style={{ height: 'calc(100vh - 80px)' }}>
        <aside className="sidebar flex-col gap-4 p-4">
          <h3>&gt; STATS</h3>
          <p>TEAM: {team.team_name}</p>
          <p>LEVEL: {team.current_level}</p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {team.keys_discovered.length === 0 && <li style={{ opacity: 0.5 }}>Empty</li>}
            {team.keys_discovered.map((k, i) => (
              <li key={i} className="text-amber mt-2">KEY {i+1}: {k}</li>
            ))}
          </ul>

          <h3 className="mt-8">&gt; HINTS ({3 - team.hints_used} LEFT)</h3>
          <button 
            onClick={handleHint} 
            disabled={team.hints_used >= 3}
            className="amber mt-2"
          >
            &gt; REQUEST HINT
          </button>
          
          {hintMsg && (
            <div className="mt-4 p-2 text-amber" style={{ border: '1px dashed var(--accent-color)', fontSize: '0.9em' }}>
              &gt; SYS_HINT: {hintMsg}
            </div>
          )}
        </aside>

        <main className="main-content flex-col p-8 items-center" style={{ overflowY: 'auto' }}>
          {successMsg && <div className="text-amber mb-4 p-2" style={{ border: '1px solid var(--accent-color)', width: '100%', textAlign: 'center' }}>&gt; {successMsg}</div>}
          {errorMsg && <div className="text-red mb-4 p-2" style={{ border: '1px solid var(--error-color)', width: '100%', textAlign: 'center' }}>&gt; ERR: {errorMsg}</div>}
          
          <LevelView 
            level={team.current_level} 
            levelName={team.level_name}
            levelText={team.level_text}
            onSubmit={handleSubmit} 
            isSubmitting={false} 
          />
        </main>
      </div>
    </div>
  );
}

export default MissionDashboard;
