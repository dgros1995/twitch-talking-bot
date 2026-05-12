import React, { useState, useEffect } from 'react';
import { apiFetch } from '../demo/apiFetch';

const s = {
  page: { maxWidth: 900 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 28, fontWeight: 700 },
  addBtn: { background: 'var(--accent)', color: '#fff', fontWeight: 600, padding: '10px 20px', borderRadius: 8 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  trigger: { fontFamily: 'monospace', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', color: 'var(--accent-light)', fontSize: 13 },
  response: { color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  actions: { display: 'flex', gap: 8 },
  editBtn: { background: 'var(--bg-hover)', color: 'var(--text-primary)', padding: '6px 14px', borderRadius: 6, fontWeight: 500 },
  delBtn: { background: 'transparent', color: 'var(--danger)', padding: '6px 14px', borderRadius: 6, fontWeight: 500, border: '1px solid var(--danger)' },
  toggle: (enabled) => ({ width: 36, height: 20, borderRadius: 10, background: enabled ? 'var(--accent)' : 'var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0 }),
  toggleKnob: (enabled) => ({ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: enabled ? 19 : 3, transition: 'left 0.15s' }),
  empty: { padding: 48, textAlign: 'center', color: 'var(--text-muted)' },
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

const EMPTY_FORM = { trigger: '', response: '', cooldown: 5, enabled: true };

export default function Commands() {
  const [commands, setCommands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    apiFetch('/api/commands', { credentials: 'include' })
      .then(r => r.json())
      .then(setCommands)
      .catch(console.error);
  };

  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = (cmd) => {
    setEditing(cmd);
    setForm({ trigger: cmd.trigger, response: cmd.response, cooldown: cmd.cooldown, enabled: Boolean(cmd.enabled) });
    setError('');
    setShowModal(true);
  };

  const save = async () => {
    if (!form.trigger.trim() || !form.response.trim()) { setError('Trigger and response are required.'); return; }
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/commands/${editing.id}` : '/api/commands';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setShowModal(false);
      load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this command?')) return;
    await apiFetch(`/api/commands/${id}`, { method: 'DELETE', credentials: 'include' });
    load();
  };

  const toggleEnabled = async (cmd) => {
    await apiFetch(`/api/commands/${cmd.id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cmd, enabled: !cmd.enabled }),
    });
    load();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Commands</h1>
        <button style={s.addBtn} onClick={openAdd}>+ Add Command</button>
      </div>
      <div style={s.card}>
        {commands.length === 0 ? (
          <div style={s.empty}>No commands yet. Add your first one!</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Trigger</th>
                <th style={s.th}>Response</th>
                <th style={s.th}>Cooldown</th>
                <th style={s.th}>Enabled</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {commands.map(cmd => (
                <tr key={cmd.id}>
                  <td style={s.td}><code style={s.trigger}>!{cmd.trigger}</code></td>
                  <td style={s.td}><span style={s.response}>{cmd.response}</span></td>
                  <td style={s.td} style={{ ...s.td, color: 'var(--text-secondary)' }}>{cmd.cooldown}s</td>
                  <td style={s.td}>
                    <div style={s.toggle(cmd.enabled)} onClick={() => toggleEnabled(cmd)}>
                      <div style={s.toggleKnob(cmd.enabled)} />
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={s.actions}>
                      <button style={s.editBtn} onClick={() => openEdit(cmd)}>Edit</button>
                      <button style={s.delBtn} onClick={() => remove(cmd.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalBox}>
            <div style={s.modalTitle}>{editing ? 'Edit Command' : 'Add Command'}</div>
            <div style={s.field}>
              <label style={s.label}>Trigger (without !)</label>
              <input style={s.input} value={form.trigger} onChange={e => setForm(f => ({ ...f, trigger: e.target.value }))} placeholder="e.g. hello" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Response</label>
              <textarea style={{ ...s.input, height: 80, resize: 'vertical' }} value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} placeholder="Use {user} for the caller's name" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Cooldown (seconds)</label>
              <input type="number" style={s.input} value={form.cooldown} onChange={e => setForm(f => ({ ...f, cooldown: Number(e.target.value) }))} min={0} />
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
