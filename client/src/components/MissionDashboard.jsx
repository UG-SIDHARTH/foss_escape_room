import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LevelView from './LevelView';

const API_BASE = '/api';

const MISSIONS = [
  { id: 1, name: 'IRON CODE', hero: 'Iron Man' },
  { id: 2, name: 'WEB OF TRUTH', hero: 'Spider-Man' },
  { id: 3, name: 'SHIELD PROTOCOL', hero: 'Captain America' },
  { id: 4, name: 'GAMMA ERROR', hero: 'Hulk' },
  { id: 5, name: 'MIND OF CODE', hero: 'Vision' },
  { id: 6, name: 'THUNDER STRIKE', hero: 'Thor' },
  { id: 7, name: 'AVENGERS ASSEMBLE', hero: 'All' }
];

function MissionDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [hintMsg, setHintMsg] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedMission, setSelectedMission] = useState(null);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`${API_BASE}/teams/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
        if (data.status === 'escaped' || data.status === 'timeout') {
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
    const interval = setInterval(fetchTeam, 10000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (team && team.status === 'in_progress') {
      const interval = setInterval(async () => {
        const currentElapsed = Date.now() - team.start_time;
        setElapsedMs(currentElapsed);

        if (currentElapsed >= 3600000) {
          clearInterval(interval);
          try {
            await fetch(`${API_BASE}/teams/${id}/timeout`, { method: 'POST' });
            fetchTeam();
          } catch(err) {}
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [team, id]);

  const handleStart = async () => {
    try {
      await fetch(`${API_BASE}/teams/${id}/start`, { method: 'POST' });
      fetchTeam();
    } catch (err) {}
  };

  const handleHint = async () => {
    if (!window.confirm("Use a hint? This will deduct 10 points from your final score!")) return;
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
        if (data.message === 'FOSS CORE RESTORED!') {
          await fetch(`${API_BASE}/teams/${id}/finish`, { method: 'POST' });
          navigate(`/complete/${id}`);
        } else {
          fetchTeam();
          setSelectedMission(null); // Return to mission select to see the unlock animation
        }
      } else {
        setErrorMsg(data.message || 'INCORRECT ANSWER.');
      }
    } catch (err) {}
  };

  if (loading) return <div className="container">&gt; LOADING CORE...</div>;
  if (!team) return <div className="container text-red">&gt; AGENT NOT FOUND</div>;

  const formatTime = (ms) => {
    const totalSecondsElapsed = Math.floor(ms / 1000);
    const totalSecondsRemaining = Math.max(0, 3600 - totalSecondsElapsed);
    const m = Math.floor(totalSecondsRemaining / 60).toString().padStart(2, '0');
    const s = (totalSecondsRemaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (team.status === 'not_started') {
    return (
      <div className="container flex-col items-center" style={{ marginTop: '15vh' }}>
        <h1 className="text-4xl glitch mb-4" data-text="&gt; INITIATE PROTOCOL">&gt; INITIATE PROTOCOL</h1>
        <p className="mb-4 text-xl text-gold">Welcome, {team.team_name}.</p>
        <div className="panel mb-8 text-center" style={{ maxWidth: '600px' }}>
          <p className="mb-4">
            The FOSS Core has been fragmented across 6 encrypted modules by an unknown threat.
          </p>
          <p className="mb-4">
            You must assume the role of the ultimate Code Avenger. Recover all 6 Core Fragments before the system collapses in exactly 60 minutes.
          </p>
          <p className="text-red">
            WARNING: You have 2 hints available. Using a hint will deduct 10 points from your final score.
          </p>
        </div>
        <div className="mt-8 text-center" style={{ border: '1px solid var(--accent-blue)', padding: '2rem', background: 'rgba(0,0,0,0.5)' }}>
          <h2 className="text-red mb-4">STATUS: IDLE</h2>
          <p className="mb-8">Awaiting authorization from the Director.</p>
          <div className="glitch text-blue text-2xl" data-text="WAITING FOR ADMIN TO START THE EVENT...">
            WAITING FOR ADMIN TO START THE EVENT...
          </div>
          <p className="mt-4 text-sm" style={{ opacity: 0.7 }}>(This page will automatically update when the event begins)</p>
        </div>
      </div>
    );
  }

  const coresRecovered = Math.min(6, team.current_level - 1);

  return (
    <div className="container flex-col" style={{ minHeight: '100vh' }}>
      <header className="flex-row justify-between items-center p-4 mb-8" style={{ borderBottom: '2px solid var(--accent-blue)', background: 'rgba(0,240,255,0.05)' }}>
        <div>
          <h2 className="text-gold glitch" data-text={team.team_name}>{team.team_name}</h2>
          <p className="text-blue font-bold">⚡ {coresRecovered}/6 CORES RECOVERED</p>
        </div>
        <div className="text-right">
          <h2 className="text-red" style={{ fontSize: '2.5rem' }}>&gt; T- {formatTime(elapsedMs)}</h2>
        </div>
      </header>

      <div className="flex-row gap-8" style={{ alignItems: 'flex-start' }}>
        
        <main className="flex-col w-full" style={{ flexGrow: 1 }}>
          {successMsg && (
             <div className="mb-8 p-4 text-center" style={{ border: '2px solid var(--success-color)', background: 'rgba(52, 199, 89, 0.1)' }}>
               <h2 className="text-success-color" style={{ margin: 0 }}>&gt; {successMsg}</h2>
             </div>
          )}
          {errorMsg && (
             <div className="mb-8 p-4 text-center" style={{ border: '2px solid var(--error-color)', background: 'rgba(255, 59, 48, 0.1)' }}>
               <h3 className="text-red" style={{ margin: 0 }}>&gt; ERR: {errorMsg}</h3>
             </div>
          )}

          {selectedMission === null ? (
            <div className="flex-col gap-4">
              <h2 className="mb-4 text-magenta">&gt; MISSION SELECT</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {MISSIONS.map(m => {
                  const isCompleted = team.current_level > m.id;
                  const isCurrent = team.current_level === m.id;
                  const isLocked = team.current_level < m.id;
                  
                  let cardClass = 'mission-card';
                  if (isCompleted) cardClass += ' completed';
                  if (isLocked) cardClass += ' locked';
                  if (isCurrent) cardClass += ' current';

                  return (
                    <div key={m.id} className={cardClass}>
                      <div className="mc-sidebar">
                        <span className="mc-id">0{m.id}</span>
                        <div className="mc-track"></div>
                        <span className="mc-label">CHARACTERS</span>
                      </div>
                      
                      <div className="mc-content">
                        <div className="mc-bg-glow"></div>
                        
                        <div className="mc-header">
                           <span className="mc-logo">FOSS</span>
                           {isCurrent && <span className="mc-tag">MY HEROES</span>}
                        </div>
                        
                        <div className="mc-body" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <h2 className="mc-title">{m.hero.toUpperCase()}</h2>
                            <h4 className="mc-subtitle">MISSION: {m.name}</h4>
                            <p className="mc-desc">
                              {isLocked ? "ACCESS DENIED. Awaiting prior module restoration." : 
                               isCompleted ? "MODULE RESTORED. System integration complete. The code is secure." : 
                               "MODULE CORRUPTED. Ready for Code Avenger override. Deploying countermeasures..."}
                            </p>
                          </div>
                          <div style={{ 
                            width: '120px', 
                            height: '120px', 
                            borderRadius: '50%', 
                            overflow: 'hidden', 
                            border: '3px solid var(--accent-magenta)',
                            boxShadow: '0 0 15px var(--accent-magenta-dim)',
                            flexShrink: 0
                          }}>
                            <img 
                              src={`/images/${m.hero.toLowerCase().replace(/\s+/g, '-')}.jpeg`} 
                              alt={m.hero}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        </div>

                        <div className="mc-footer">
                           {isCompleted && <span className="text-blue font-bold" style={{ fontSize: '1.2rem' }}>✓ RESTORED</span>}
                           {isLocked && <span className="font-bold" style={{ color: '#666' }}>LOCKED</span>}
                           {isCurrent && (
                             <button onClick={() => setSelectedMission(m.id)} className="magenta-btn">
                               &gt; ENGAGE
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <LevelView 
              level={team.current_level} 
              levelName={team.level_name}
              levelHero={team.level_hero}
              levelText={team.level_text}
              onSubmit={handleSubmit}
              onBack={() => {
                setSelectedMission(null);
                setSuccessMsg('');
                setErrorMsg('');
                setHintMsg('');
              }}
              isSubmitting={false} 
            />
          )}
        </main>

        {selectedMission !== null && (
          <aside className="panel" style={{ width: '300px', flexShrink: 0 }}>
            <h3 className="text-red mb-4">&gt; TACTICAL ASSIST</h3>
            <p className="mb-4">HINTS REMAINING: {2 - team.hints_used}</p>
            <button 
              onClick={handleHint} 
              disabled={team.hints_used >= 2}
              className="red w-full"
            >
              &gt; REQUEST HINT
            </button>
            
            {hintMsg && (
              <div className="mt-4 p-4 text-gold" style={{ border: '1px dashed var(--accent-gold)', background: 'rgba(242, 201, 76, 0.1)', lineHeight: '1.5' }}>
                &gt; COMMS: {hintMsg}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default MissionDashboard;
