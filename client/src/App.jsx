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
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/mission/:id" element={<MissionDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/complete/:id" element={<EscapeComplete />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
