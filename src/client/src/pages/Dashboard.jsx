import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Overview from './Overview';
import Commands from './Commands';
import Timers from './Timers';
import Loyalty from './Loyalty';

export default function Dashboard({ user, refresh }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/');
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <main style={{ flex: 1, overflow: 'auto', padding: 32, background: 'var(--bg-primary)' }}>
        <Routes>
          <Route index element={<Overview user={user} refresh={refresh} />} />
          <Route path="commands" element={<Commands />} />
          <Route path="timers" element={<Timers />} />
          <Route path="loyalty" element={<Loyalty />} />
        </Routes>
      </main>
    </div>
  );
}
