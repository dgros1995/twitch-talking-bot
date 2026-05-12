import React, { useState } from 'react';
import { apiFetch } from '../demo/apiFetch';

const styles = {
  page: { maxWidth: 720, margin: '0 auto' },
  header: { marginBottom: 32 },
  pageTitle: { fontSize: 28, fontWeight: 700, marginBottom: 6 },
  pageSubtitle: { color: 'var(--text-secondary)' },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: { fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  statusRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  statusLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  dot: (active) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: active ? 'var(--success)' : 'var(--text-muted)',
    boxShadow: active ? '0 0 8px var(--success)' : 'none',
    flexShrink: 0,
  }),
  statusText: { fontWeight: 600 },
  statusSub: { color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 },
  toggleBtn: (active) => ({
    padding: '10px 20px',
    borderRadius: 8,
    fontWeight: 600,
    background: active ? 'var(--danger)' : 'var(--accent)',
    color: '#fff',
  }),
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 },
  infoItem: { background: 'var(--bg-secondary)', borderRadius: 8, padding: 16 },
  infoLabel: { color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 },
  infoValue: { fontWeight: 700, fontSize: 20 },
  builtinList: { display: 'flex', flexDirection: 'column', gap: 8 },
  builtinItem: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid var(--border)',
  },
  code: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '2px 8px',
    fontFamily: 'monospace',
    fontSize: 13,
    color: 'var(--accent-light)',
    flexShrink: 0,
  },
  cmdDesc: { color: 'var(--text-secondary)', fontSize: 13 },
};

const BUILTIN_CMDS = [
  { cmd: '!points', desc: 'Shows your loyalty point balance' },
  { cmd: '!top', desc: 'Shows top 5 point holders' },
  { cmd: '!addpoints [user] [n]', desc: 'Mods only — add points to a user' },
  { cmd: '!so [user]', desc: 'Mods only — shoutout a user' },
  { cmd: '!uptime', desc: 'How long the stream has been live' },
  { cmd: '!followage', desc: 'How long you have been following' },
];

export default function Overview({ user, refresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const botActive = Boolean(user.bot_active);

  const toggleBot = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = botActive ? '/api/bot/leave' : '/api/bot/join';
      const res = await apiFetch(endpoint, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Overview</h1>
        <p style={styles.pageSubtitle}>Manage your bot and see channel status</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>🤖 Bot Status</div>
        <div style={styles.statusRow}>
          <div style={styles.statusLeft}>
            <div style={styles.dot(botActive)} />
            <div>
              <div style={styles.statusText}>{botActive ? 'Connected' : 'Disconnected'}</div>
              <div style={styles.statusSub}>Channel: #{user.channel_name}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <button style={styles.toggleBtn(botActive)} onClick={toggleBot} disabled={loading}>
              {loading ? '...' : botActive ? 'Disconnect Bot' : 'Connect Bot'}
            </button>
            {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>📡 Channel Info</div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Channel</div>
            <div style={styles.infoValue}>#{user.channel_name}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Display Name</div>
            <div style={styles.infoValue}>{user.display_name}</div>
          </div>
          <div style={styles.infoItem}>
            <div style={styles.infoLabel}>Bot Status</div>
            <div style={{ ...styles.infoValue, color: botActive ? 'var(--success)' : 'var(--text-muted)', fontSize: 16 }}>
              {botActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>⌨️ Built-in Commands</div>
        <div style={styles.builtinList}>
          {BUILTIN_CMDS.map(c => (
            <div key={c.cmd} style={styles.builtinItem}>
              <code style={styles.code}>{c.cmd}</code>
              <span style={styles.cmdDesc}>{c.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
