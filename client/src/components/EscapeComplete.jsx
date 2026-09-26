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

  if (!team) return <div className="container">&gt; LOADING CORE...</div>;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="container flex-col items-center justify-center" style={{ minHeight: '100vh', textAlign: 'center' }}>
      <h1 className="text-4xl text-blue glitch mb-4" data-text={team.status === 'timeout' ? "> SYSTEM COLLAPSE" : "> FOSS CORE RESTORED"}>
        {team.status === 'timeout' ? "> SYSTEM COLLAPSE" : "> FOSS CORE RESTORED"}
      </h1>
      <h2 className="text-red mb-8">{team.status === 'timeout' ? "MISSION FAILED (TIME EXPIRED)" : "MISSION ACCOMPLISHED"}</h2>
      
      <div className="panel p-8" style={{ maxWidth: '600px', width: '100%', boxSizing: 'border-box' }}>
        <h2 className="mb-4 text-red">AGENT PROFILE</h2>
        <p className="mb-4 text-2xl font-bold">{team.team_name}</p>
        <p className="mb-4 text-blue">FULL NAME: {team.members}</p>
        
        <div className="flex-col gap-4 mt-8" style={{ borderTop: '2px solid var(--accent-blue)', paddingTop: '2rem' }}>
          <div>&gt; TIME TAKEN: {formatTime(team.final_time)}</div>
          <div>&gt; TACTICAL ASSISTS (HINTS): {team.hints_used}</div>
          <div className="text-2xl mt-4 text-gold">&gt; FINAL SCORE: {team.score} PTS</div>
        </div>
      </div>
      
      <div className="mt-8 flex-row gap-4">
        <button className="gold" onClick={() => window.print()}>&gt; PRINT RECORD</button>
        <button onClick={() => window.location.href = '/leaderboard'}>&gt; VIEW LEADERBOARD</button>
      </div>
    </div>
  );
}

export default EscapeComplete;
