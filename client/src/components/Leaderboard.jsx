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
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    const totalSecondsElapsed = Math.floor(ms / 1000);
    const totalSecondsRemaining = Math.max(0, 3600 - totalSecondsElapsed);
    const m = Math.floor(totalSecondsRemaining / 60).toString().padStart(2, '0');
    const s = (totalSecondsRemaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="container flex-col items-center">
      <h1 className="text-4xl text-blue glitch mt-8 mb-8" data-text="&gt; HALL OF AVENGERS">&gt; HALL OF AVENGERS</h1>
      
      <div className="panel w-full" style={{ maxWidth: '1000px', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,240,255,0.1)', textAlign: 'left' }}>
              <th className="p-4">RANK</th>
              <th className="p-4">TEAM</th>
              <th className="p-4">STATUS</th>
              <th className="p-4">CORES</th>
              <th className="p-4">HINTS</th>
              <th className="p-4">TIME LEFT</th>
              <th className="p-4 text-gold">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4">&gt; NO TEAMS REGISTERED</td>
              </tr>
            )}
            {teams.map((t, idx) => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td className="p-4 font-bold">{idx + 1}</td>
                <td className="p-4 text-blue font-bold">{t.team_name}</td>
                <td className="p-4">
                  {t.status === 'escaped' ? <span className="text-gold">RESTORED</span> : 
                   t.status === 'in_progress' ? 'ACTIVE' : 'STANDBY'}
                </td>
                <td className="p-4">{Math.min(5, t.current_level - 1)}/5</td>
                <td className="p-4">{t.hints_used}</td>
                <td className="p-4">
                  {t.status === 'escaped' || t.status === 'in_progress'
                    ? formatTime(t.status === 'escaped' ? t.final_time : t.current_time_ms) 
                    : '--'}
                </td>
                <td className="p-4 text-gold font-bold">
                  {t.status === 'escaped' ? t.score : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8">
        <a href="/" className="text-red">[ BACK TO TERMINAL ]</a>
      </div>
    </div>
  );
}

export default Leaderboard;
