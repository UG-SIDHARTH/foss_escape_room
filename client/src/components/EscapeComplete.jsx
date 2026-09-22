import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = '/api';

function EscapeComplete() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      const res = await fetch(`${API_BASE}/teams/${id}`);
      if (res.ok) {
        setTeam(await res.json());
      }
    };
    fetchTeam();
  }, [id]);

  if (!team) return <div className="container">&gt; LOADING...</div>;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center' }}>
      <h1 className="text-4xl text-amber glitch mb-8">&gt; ESCAPE COMPLETE</h1>
      
      <div className="p-8" style={{ border: '2px solid var(--accent-color)', maxWidth: '600px', width: '100%', boxSizing: 'border-box' }}>
        <h2 className="mb-4">CERTIFICATE OF COMPLETION</h2>
        <p className="mb-4 text-2xl">{team.team_name}</p>
        <p className="mb-4">Operatives: {team.members}</p>
        
        <div className="flex-col gap-4 mt-8">
          <div>&gt; BASE TIME: {formatTime(team.final_time - (team.total_penalty_minutes * 60 * 1000))}</div>
          <div>&gt; PENALTIES: {team.total_penalty_minutes} MINUTES ({team.hints_used} HINTS)</div>
          <div className="text-2xl mt-4">&gt; FINAL TIME: {formatTime(team.final_time)}</div>
        </div>
      </div>
      
      <div className="mt-8">
        <button onClick={() => window.print()}>&gt; PRINT CERTIFICATE</button>
      </div>
      <div className="mt-4">
        <a href="/leaderboard" className="text-amber">[ VIEW LEADERBOARD ]</a>
      </div>
    </div>
  );
}

export default EscapeComplete;
