import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="flex-col items-center" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <h1 className="text-red mb-4 glitch" data-text="&gt; DIRECTOR_ACCESS_REQUIRED">&gt; DIRECTOR_ACCESS_REQUIRED</h1>
      {error && <div className="text-red mb-4 p-2" style={{ border: '1px solid var(--error-color)' }}>&gt; ERR: {error}</div>}
      <form onSubmit={handleLogin} className="flex-col gap-4" style={{ width: '100%', maxWidth: '300px' }}>
        <input 
          type="password" 
          placeholder="_ENTER_PASSWORD" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="red">&gt; AUTHENTICATE</button>
      </form>
    </div>
  );
}

export default AdminLogin;
