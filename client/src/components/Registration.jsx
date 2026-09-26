import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

function Registration() {
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!teamName || !members) return;

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
        setErrorMsg(data.error || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg('Network error.');
    }
  };

  return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center' }}>
      <h1 className="text-4xl glitch mb-4" data-text="FOSS // CORE — SYSTEM FAILURE">
        FOSS // CORE — SYSTEM FAILURE
      </h1>
      <h2 className="text-red mb-8">05 MODULES CORRUPTED</h2>
      
      <p className="mb-8" style={{ maxWidth: '600px', fontSize: '1.2rem' }}>
        The code is broken. A hero must rise.<br/>
        Recruiting a Code Avenger to recover the encrypted modules and restore the core.
      </p>

      <form onSubmit={handleRegister} className="flex-col gap-4" style={{ width: '100%', maxWidth: '400px' }}>
        <input 
          type="text" 
          placeholder="AGENT ALIAS" 
          value={teamName} 
          onChange={e => setTeamName(e.target.value)} 
          required 
        />
        <input 
          type="text" 
          placeholder="FULL NAME" 
          value={members} 
          onChange={e => setMembers(e.target.value)} 
          required 
        />
        <button type="submit" className="red mt-4">&gt; BEGIN MISSION</button>
      </form>

      {errorMsg && <div className="text-red mt-4">&gt; ERR: {errorMsg}</div>}
      
      <div className="mt-8">
        <a href="/admin/login" className="text-blue" style={{ fontSize: '0.8rem' }}>[ SYSADMIN LOGIN ]</a>
      </div>
    </div>
  );
}

export default Registration;
