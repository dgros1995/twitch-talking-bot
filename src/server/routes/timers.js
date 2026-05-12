const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getChannelId(db, userId) {
  const channel = db.prepare('SELECT id FROM channels WHERE user_id = ?').get(userId);
  return channel ? channel.id : null;
}

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const timers = db.prepare('SELECT * FROM timers WHERE channel_id = ? ORDER BY created_at DESC').all(channelId);
  res.json(timers);
});

router.post('/', requireAuth, (req, res) => {
  const { name, message, interval_minutes } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'name and message required' });

  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const result = db.prepare(`
    INSERT INTO timers (channel_id, name, message, interval_minutes) VALUES (?, ?, ?, ?)
  `).run(channelId, name.trim(), message.trim(), interval_minutes ?? 10);

  const timer = db.prepare('SELECT * FROM timers WHERE id = ?').get(result.lastInsertRowid);

  const { bot } = require('../bot-ref');
  if (bot) bot.reloadTimers(channelId);

  res.status(201).json(timer);
});

router.put('/:id', requireAuth, (req, res) => {
  const { name, message, interval_minutes, enabled } = req.body;
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const existing = db.prepare('SELECT id FROM timers WHERE id = ? AND channel_id = ?').get(req.params.id, channelId);
  if (!existing) return res.status(404).json({ error: 'Timer not found' });

  db.prepare(`
    UPDATE timers SET name = ?, message = ?, interval_minutes = ?, enabled = ? WHERE id = ?
  `).run(
    name.trim(),
    message.trim(),
    interval_minutes ?? 10,
    enabled !== undefined ? (enabled ? 1 : 0) : 1,
    req.params.id
  );

  const timer = db.prepare('SELECT * FROM timers WHERE id = ?').get(req.params.id);

  const { bot } = require('../bot-ref');
  if (bot) bot.reloadTimers(channelId);

  res.json(timer);
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const result = db.prepare('DELETE FROM timers WHERE id = ? AND channel_id = ?').run(req.params.id, channelId);
  if (result.changes === 0) return res.status(404).json({ error: 'Timer not found' });

  const { bot } = require('../bot-ref');
  if (bot) bot.reloadTimers(channelId);

  res.json({ ok: true });
});

module.exports = router;
