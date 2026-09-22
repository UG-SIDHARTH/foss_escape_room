import React, { useEffect, useState } from 'react';

const API_BASE = '/api';

function Leaderboard() {
  const [teams, setTeams] = useState([]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="container flex-col items-center">
      <h1 className="text-4xl glitch mt-8 mb-8">&gt; GLOBAL LEADERBOARD</h1>
      
      <table style={{ width: '100%', maxWidth: '900px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--text-color)', textAlign: 'left' }}>
            <th className="p-4">RANK</th>
            <th className="p-4">TEAM</th>
            <th className="p-4">STATUS</th>
            <th className="p-4">LEVEL</th>
            <th className="p-4">HINTS</th>
            <th className="p-4">TIME</th>
          </tr>
        </thead>
        <tbody>
          {teams.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center p-4">&gt; NO DATA FOUND</td>
            </tr>
          )}
          {teams.map((t, idx) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
              <td className="p-4">{idx + 1}</td>
              <td className="p-4">{t.team_name}</td>
              <td className="p-4">
                {t.status === 'escaped' ? <span className="text-amber">ESCAPED</span> : 
                 t.status === 'in_progress' ? 'IN PROGRESS' : 'NOT STARTED'}
              </td>
              <td className="p-4">{t.current_level}</td>
              <td className="p-4">{t.hints_used}</td>
              <td className="p-4">
                {t.status === 'escaped' 
                  ? formatTime(t.final_time) 
                  : t.status === 'in_progress' ? formatTime(t.current_time_ms) : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-8">
        <a href="/" className="text-amber">[ BACK TO TERMINAL ]</a>
      </div>
    </div>
  );
}

export default Leaderboard;
