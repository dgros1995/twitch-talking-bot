import React, { useState, useEffect } from 'react';
import { apiFetch } from '../demo/apiFetch';

const s = {
  page: { maxWidth: 720 },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 24 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 },
  cardTitle: { fontWeight: 600, marginBottom: 20, fontSize: 16 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' },
  input: { width: '100%', display: 'block' },
  hint: { color: 'var(--text-muted)', fontSize: 12, marginTop: 4 },
  switchRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  toggle: (enabled) => ({ width: 44, height: 24, borderRadius: 12, background: enabled ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }),
  toggleKnob: (enabled) => ({ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: enabled ? 23 : 3, transition: 'left 0.2s' }),
  switchLabel: { fontWeight: 600 },
  switchSub: { color: 'var(--text-secondary)', fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  saveBtn: { background: 'var(--accent)', color: '#fff', fontWeight: 600, padding: '10px 24px', borderRadius: 8, marginTop: 8 },
  success: { color: 'var(--success)', fontSize: 13, marginTop: 8 },
  error: { color: 'var(--danger)', fontSize: 13, marginTop: 8 },
  lbTable: { width: '100%', borderCollapse: 'collapse' },
  lbTh: { padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' },
  lbTd: { padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  rank: (i) => ({ fontWeight: 700, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--text-secondary)' }),
  points: { fontWeight: 600, color: 'var(--accent-light)' },
  empty: { padding: 32, textAlign: 'center', color: 'var(--text-muted)' },
  refreshBtn: { background: 'var(--bg-hover)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: 6, fontWeight: 500, fontSize: 13 },
};

export default function Loyalty() {
  const [settings, setSettings] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadSettings = () => {
    apiFetch('/api/loyalty', { credentials: 'include' }).then(r => r.json()).then(setSettings).catch(console.error);
  };

  const loadLeaderboard = () => {
    apiFetch('/api/loyalty/leaderboard', { credentials: 'include' }).then(r => r.json()).then(setLeaderboard).catch(console.error);
  };

  useEffect(() => { loadSettings(); loadLeaderboard(); }, []);

  const save = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const res = await apiFetch('/api/loyalty', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSettings(data);
      setMsg('Settings saved!');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  if (!settings) return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div style={s.page}>
      <h1 style={s.title}>Loyalty Points</h1>

      <div style={s.card}>
        <div style={s.cardTitle}>Settings</div>
        <div style={s.switchRow}>
          <div style={s.toggle(settings.enabled)} onClick={() => setSettings(p => ({ ...p, enabled: !p.enabled }))}>
            <div style={s.toggleKnob(settings.enabled)} />
          </div>
          <div>
            <div style={s.switchLabel}>{settings.enabled ? 'Loyalty Points Enabled' : 'Loyalty Points Disabled'}</div>
            <div style={s.switchSub}>Award points to active chatters automatically</div>
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.field}>
            <label style={s.label}>Points Name</label>
            <input style={s.input} value={settings.points_name} onChange={e => setSettings(p => ({ ...p, points_name: e.target.value }))} placeholder="points" />
            <div style={s.hint}>Shown in !points and !top commands</div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Points per Interval</label>
            <input type="number" style={s.input} value={settings.earn_amount} onChange={e => setSettings(p => ({ ...p, earn_amount: Number(e.target.value) }))} min={1} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Earn Interval (minutes)</label>
            <input type="number" style={s.input} value={settings.earn_interval_minutes} onChange={e => setSettings(p => ({ ...p, earn_interval_minutes: Number(e.target.value) }))} min={1} />
            <div style={s.hint}>How often active chatters earn points</div>
          </div>
        </div>

        <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
        {msg && <div style={s.success}>{msg}</div>}
        {err && <div style={s.error}>{err}</div>}
      </div>

      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={s.cardTitle} style={{ marginBottom: 0 }}>Leaderboard — Top 10</div>
          <button style={s.refreshBtn} onClick={loadLeaderboard}>Refresh</button>
        </div>
        {leaderboard.length === 0 ? (
          <div style={s.empty}>No points data yet. The leaderboard will fill up as chatters earn points.</div>
        ) : (
          <table style={s.lbTable}>
            <thead>
              <tr>
                <th style={s.lbTh}>Rank</th>
                <th style={s.lbTh}>Username</th>
                <th style={s.lbTh}>{settings.points_name}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr key={row.username}>
                  <td style={s.lbTd}><span style={s.rank(i)}>#{i + 1}</span></td>
                  <td style={s.lbTd}>{row.username}</td>
                  <td style={s.lbTd}><span style={s.points}>{row.points.toLocaleString()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
