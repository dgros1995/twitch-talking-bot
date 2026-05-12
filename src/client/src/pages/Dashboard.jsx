import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { apiFetch } from '../demo/apiFetch';
import Sidebar from '../components/Sidebar';
import Overview from './Overview';
import Commands from './Commands';
import Timers from './Timers';
import Loyalty from './Loyalty';

const demoBanner = {
  background: 'linear-gradient(90deg, #9147ff22, #9147ff44, #9147ff22)',
  borderBottom: '1px solid #9147ff66',
  padding: '8px 24px',
  fontSize: 13,
  color: 'var(--accent-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  flexShrink: 0,
};

export default function Dashboard({ user, refresh }) {
  const navigate = useNavigate();
  const demo = sessionStorage.getItem('demo') === 'true';

  const handleLogout = async () => {
    if (demo) sessionStorage.removeItem('demo');
    await apiFetch('/auth/logout', { method: 'POST', credentials: 'include' });
    navigate('/');
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {demo && (
          <div style={demoBanner}>
            <span>👁</span>
            <span>Demo mode — data is local and not saved. Click ✕ in the sidebar to exit.</span>
          </div>
        )}
        <main style={{ flex: 1, overflow: 'auto', padding: 32, background: 'var(--bg-primary)' }}>
          <Routes>
            <Route index element={<Overview user={user} refresh={refresh} />} />
            <Route path="commands" element={<Commands />} />
            <Route path="timers" element={<Timers />} />
            <Route path="loyalty" element={<Loyalty />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
