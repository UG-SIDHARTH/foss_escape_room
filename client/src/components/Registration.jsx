import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

function Registration() {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!teamName || !members) {
      setError('ALL FIELDS REQUIRED.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: teamName, members })
      });
      const data = await res.json();
      
      if (res.ok) {
        navigate(`/mission/${data.id}`);
      } else {
        setError(data.error || 'REGISTRATION FAILED.');
      }
    } catch (err) {
      setError('SYSTEM OFFLINE. BACKEND UNREACHABLE.');
    }
  };

  return (
    <div className="container flex-col items-center justify-between" style={{ justifyContent: 'center', height: '100vh' }}>
      <h1 className="text-4xl glitch mb-4">&gt; FOSS_ESCAPE_ROOM</h1>
      <p className="mb-4 text-amber">INITIATE TEAM SEQUENCE</p>
      
      <form onSubmit={handleSubmit} className="flex-col gap-4" style={{ width: '400px' }}>
        <div className="flex-col">
          <label>&gt; TEAM_IDENTIFIER</label>
          <input 
            type="text" 
            value={teamName} 
            onChange={e => setTeamName(e.target.value)} 
            placeholder="e.g. HackThePlanet"
            autoFocus
          />
        </div>
        
        <div className="flex-col mt-4">
          <label>&gt; OPERATIVES (comma separated)</label>
          <input 
            type="text" 
            value={members} 
            onChange={e => setMembers(e.target.value)} 
            placeholder="Alice, Bob, Charlie"
          />
        </div>

        {error && <p className="text-red mt-4">&gt; ERR: {error}</p>}

        <button type="submit" className="mt-4">&gt; REGISTER</button>
      </form>
      
      <div className="mt-4">
        <a href="/leaderboard" className="text-amber">[ VIEW LEADERBOARD ]</a>
      </div>
    </div>
  );
}

export default Registration;
