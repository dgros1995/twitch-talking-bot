import React, { useState, useEffect } from 'react';

const s = {
  page: { maxWidth: 900 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 28, fontWeight: 700 },
  addBtn: { background: 'var(--accent)', color: '#fff', fontWeight: 600, padding: '10px 20px', borderRadius: 8 },
  grid: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 },
  cardBody: { flex: 1 },
  cardName: { fontWeight: 600, marginBottom: 4 },
  cardMsg: { color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 },
  cardMeta: { display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' },
  actions: { display: 'flex', gap: 8, flexShrink: 0 },
  editBtn: { background: 'var(--bg-hover)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: 6, fontWeight: 500 },
  delBtn: { background: 'transparent', color: 'var(--danger)', padding: '6px 14px', borderRadius: 6, fontWeight: 500, border: '1px solid var(--danger)' },
  toggle: (enabled) => ({ width: 36, height: 20, borderRadius: 10, background: enabled ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0, marginTop: 2 }),
  toggleKnob: (enabled) => ({ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: enabled ? 19 : 3, transition: 'left 0.15s' }),
  empty: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-muted)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480 },
  modalTitle: { fontWeight: 700, fontSize: 18, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' },
  input: { width: '100%', display: 'block' },
  row: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  cancelBtn: { background: 'var(--bg-hover)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 8, fontWeight: 600 },
  saveBtn: { background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600 },
  error: { color: 'var(--danger)', fontSize: 13, marginTop: 8 },
};

const EMPTY = { name: '', message: '', interval_minutes: 10, enabled: true };

export default function Timers() {
  const [timers, setTimers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch('/api/timers', { credentials: 'include' }).then(r => r.json()).then(setTimers).catch(console.error);
  };

  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name, message: t.message, interval_minutes: t.interval_minutes, enabled: Boolean(t.enabled) }); setError(''); setShowModal(true); };

  const save = async () => {
    if (!form.name.trim() || !form.message.trim()) { setError('Name and message are required.'); return; }
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/timers/${editing.id}` : '/api/timers';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShowModal(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this timer?')) return;
    await fetch(`/api/timers/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const toggleEnabled = async (t) => {
    await fetch(`/api/timers/${t.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...t, enabled: !t.enabled }) });
    load();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Timers</h1>
        <button style={s.addBtn} onClick={openAdd}>+ Add Timer</button>
      </div>
      <div style={s.grid}>
        {timers.length === 0 ? (
          <div style={s.empty}>No timers yet. Add your first one!</div>
        ) : timers.map(t => (
          <div key={t.id} style={s.card}>
            <div style={s.toggle(t.enabled)} onClick={() => toggleEnabled(t)}>
              <div style={s.toggleKnob(t.enabled)} />
            </div>
            <div style={s.cardBody}>
              <div style={s.cardName}>{t.name}</div>
              <div style={s.cardMsg}>{t.message}</div>
              <div style={s.cardMeta}>
                <span>⏱ Every {t.interval_minutes} minutes</span>
                <span style={{ color: t.enabled ? 'var(--success)' : 'var(--text-muted)' }}>{t.enabled ? 'Active' : 'Paused'}</span>
              </div>
            </div>
            <div style={s.actions}>
              <button style={s.editBtn} onClick={() => openEdit(t)}>Edit</button>
              <button style={s.delBtn} onClick={() => remove(t.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalBox}>
            <div style={s.modalTitle}>{editing ? 'Edit Timer' : 'Add Timer'}</div>
            <div style={s.field}>
              <label style={s.label}>Timer Name</label>
              <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Social Media Reminder" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Message</label>
              <textarea style={{ ...s.input, height: 80, resize: 'vertical' }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Message to post in chat" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Interval (minutes)</label>
              <input type="number" style={s.input} value={form.interval_minutes} onChange={e => setForm(f => ({ ...f, interval_minutes: Number(e.target.value) }))} min={1} />
            </div>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.row}>
              <button style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
