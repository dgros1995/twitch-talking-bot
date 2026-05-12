import React from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0e0e10 0%, #18181b 50%, #0e0e10 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    padding: 24,
    textAlign: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    background: 'var(--accent)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    margin: '0 auto',
  },
  title: {
    fontSize: 42,
    fontWeight: 700,
    letterSpacing: '-1px',
    background: 'linear-gradient(135deg, #fff 0%, var(--accent-light) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 18,
    color: 'var(--text-secondary)',
    maxWidth: 480,
    lineHeight: 1.6,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    maxWidth: 640,
    width: '100%',
  },
  feature: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 20,
    textAlign: 'left',
  },
  featureIcon: { fontSize: 24, marginBottom: 8 },
  featureTitle: { fontWeight: 600, marginBottom: 4 },
  featureDesc: { color: 'var(--text-secondary)', fontSize: 13 },
  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    background: 'var(--accent)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    padding: '14px 32px',
    borderRadius: 8,
    transition: 'background 0.15s',
    textDecoration: 'none',
  },
  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  demoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: 15,
    padding: '14px 28px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
};

const FEATURES = [
  { icon: '🤖', title: 'Smart Bot', desc: 'Custom commands with cooldowns, auto-replies' },
  { icon: '⏱️', title: 'Timers', desc: 'Auto-post messages at configurable intervals' },
  { icon: '🏆', title: 'Loyalty Points', desc: 'Reward active chatters automatically' },
  { icon: '📊', title: 'Leaderboard', desc: 'Top viewer rankings in your chat' },
];

export default function Landing() {
  const navigate = useNavigate();

  const startDemo = () => {
    sessionStorage.setItem('demo', 'true');
    navigate('/dashboard');
  };

  return (
    <div style={styles.page}>
      <div>
        <div style={styles.logo}>🎮</div>
      </div>
      <div>
        <h1 style={styles.title}>TwitchBot Dashboard</h1>
        <p style={styles.subtitle}>
          A powerful bot platform for Twitch streamers. Manage commands, timers, and loyalty points all in one place.
        </p>
      </div>
      <div style={styles.features}>
        {FEATURES.map(f => (
          <div key={f.title} style={styles.feature}>
            <div style={styles.featureIcon}>{f.icon}</div>
            <div style={styles.featureTitle}>{f.title}</div>
            <div style={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={styles.btnRow}>
        <a href="/auth/login" style={styles.loginBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
          Login with Twitch
        </a>
        <button style={styles.demoBtn} onClick={startDemo}>
          ▶ Try Demo
        </button>
      </div>
    </div>
  );
}
