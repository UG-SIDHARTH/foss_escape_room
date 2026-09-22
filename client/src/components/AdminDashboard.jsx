import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/teams`, {
        credentials: 'include'
      });
      if (res.status === 401) {
        navigate('/admin/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch admin data');
      const data = await res.json();
      setTeams(data);
      setLoading(false);
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [navigate]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="container">
      <h1 className="text-4xl text-amber mb-8">&gt; SYSADMIN OVERRIDE DASHBOARD</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--text-color)', textAlign: 'left' }}>
            <th className="p-4">ID</th>
            <th className="p-4">TEAM NAME</th>
            <th className="p-4">MEMBERS</th>
            <th className="p-4">STATUS</th>
            <th className="p-4">LEVEL</th>
            <th className="p-4">HINTS (PENALTY)</th>
            <th className="p-4">TIME</th>
            <th className="p-4">KEYS</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
              <td className="p-4">{t.id}</td>
              <td className="p-4">{t.team_name}</td>
              <td className="p-4">{t.members}</td>
              <td className="p-4">{t.status}</td>
              <td className="p-4">{t.current_level}</td>
              <td className="p-4">{t.hints_used} ({t.total_penalty_minutes}m)</td>
              <td className="p-4">
                {t.status === 'escaped' 
                  ? formatTime(t.final_time) 
                  : t.status === 'in_progress' ? formatTime(t.current_time_ms) : '--'}
              </td>
              <td className="p-4" style={{ fontSize: '0.8rem' }}>
                {t.keys_discovered.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
