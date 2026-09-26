import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Registration from './components/Registration';
import MissionDashboard from './components/MissionDashboard';
import Leaderboard from './components/Leaderboard';
import AdminDashboard from './components/AdminDashboard';
import EscapeComplete from './components/EscapeComplete';
import AdminLogin from './components/AdminLogin';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Registration />} />
            <Route path="/mission/:id" element={<MissionDashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/complete/:id" element={<EscapeComplete />} />
          </Routes>
        </div>
        <footer style={{ textAlign: 'center', padding: '1rem', color: 'var(--accent-blue)', opacity: 0.7, fontSize: '0.8rem', letterSpacing: '1px' }}>
          &copy; {new Date().getFullYear()} UG_SIDHARTH. All Rights Reserved.
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
