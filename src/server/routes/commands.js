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

  const commands = db.prepare('SELECT * FROM commands WHERE channel_id = ? ORDER BY created_at DESC').all(channelId);
  res.json(commands);
});

router.post('/', requireAuth, (req, res) => {
  const { trigger, response, cooldown } = req.body;
  if (!trigger || !response) return res.status(400).json({ error: 'trigger and response required' });

  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  try {
    const result = db.prepare(`
      INSERT INTO commands (channel_id, trigger, response, cooldown) VALUES (?, ?, ?, ?)
    `).run(channelId, trigger.toLowerCase().trim(), response.trim(), cooldown ?? 5);

    const command = db.prepare('SELECT * FROM commands WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(command);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Command with that trigger already exists' });
    }
    throw err;
  }
});

router.put('/:id', requireAuth, (req, res) => {
  const { trigger, response, cooldown, enabled } = req.body;
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const existing = db.prepare('SELECT id FROM commands WHERE id = ? AND channel_id = ?').get(req.params.id, channelId);
  if (!existing) return res.status(404).json({ error: 'Command not found' });

  db.prepare(`
    UPDATE commands SET trigger = ?, response = ?, cooldown = ?, enabled = ? WHERE id = ?
  `).run(
    trigger.toLowerCase().trim(),
    response.trim(),
    cooldown ?? 5,
    enabled !== undefined ? (enabled ? 1 : 0) : 1,
    req.params.id
  );

  const command = db.prepare('SELECT * FROM commands WHERE id = ?').get(req.params.id);
  res.json(command);
});

router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const result = db.prepare('DELETE FROM commands WHERE id = ? AND channel_id = ?').run(req.params.id, channelId);
  if (result.changes === 0) return res.status(404).json({ error: 'Command not found' });

  res.json({ ok: true });
});

module.exports = router;
