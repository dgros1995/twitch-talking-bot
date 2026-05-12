import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const styles = {
  sidebar: {
    width: 220,
    minWidth: 220,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
  },
  brand: {
    padding: '20px 20px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    background: 'var(--accent)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  brandName: { fontWeight: 700, fontSize: 15 },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 },
  navLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 10px 4px' },
  user: {
    padding: '14px 16px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--border)',
    objectFit: 'cover',
  },
  userName: { fontWeight: 600, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'none',
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: 4,
    fontSize: 16,
    lineHeight: 1,
  },
};

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: '📊', end: true },
  { to: '/dashboard/commands', label: 'Commands', icon: '💬' },
  { to: '/dashboard/timers', label: 'Timers', icon: '⏱️' },
  { to: '/dashboard/loyalty', label: 'Loyalty', icon: '🏆' },
];

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 6,
  fontWeight: 500,
  color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
  background: isActive ? 'rgba(145, 71, 255, 0.15)' : 'transparent',
  transition: 'background 0.12s, color 0.12s',
});

export default function Sidebar({ user, onLogout }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandIcon}>🎮</div>
        <span style={styles.brandName}>TwitchBot</span>
      </div>
      <nav style={styles.nav}>
        <div style={styles.navLabel}>Menu</div>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} style={linkStyle}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={styles.user}>
        {user.profile_image_url
          ? <img src={user.profile_image_url} alt="" style={styles.avatar} />
          : <div style={styles.avatar} />}
        <span style={styles.userName}>{user.display_name}</span>
        <button style={styles.logoutBtn} onClick={onLogout} title="Logout">✕</button>
      </div>
    </aside>
  );
}
