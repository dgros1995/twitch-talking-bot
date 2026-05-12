import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './hooks/useUser';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { user, loading, refresh } = useUser();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route
        path="/dashboard/*"
        element={user ? <Dashboard user={user} refresh={refresh} /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}
