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

  const settings = db.prepare('SELECT * FROM loyalty_settings WHERE channel_id = ?').get(channelId);
  res.json(settings || { channel_id: channelId, enabled: 0, points_name: 'points', earn_amount: 10, earn_interval_minutes: 5 });
});

router.put('/', requireAuth, (req, res) => {
  const { enabled, points_name, earn_amount, earn_interval_minutes } = req.body;
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  db.prepare(`
    INSERT INTO loyalty_settings (channel_id, enabled, points_name, earn_amount, earn_interval_minutes)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(channel_id) DO UPDATE SET
      enabled = excluded.enabled,
      points_name = excluded.points_name,
      earn_amount = excluded.earn_amount,
      earn_interval_minutes = excluded.earn_interval_minutes
  `).run(
    channelId,
    enabled ? 1 : 0,
    points_name || 'points',
    earn_amount ?? 10,
    earn_interval_minutes ?? 5
  );

  const { bot } = require('../bot-ref');
  if (bot) bot.reloadLoyalty(channelId);

  const settings = db.prepare('SELECT * FROM loyalty_settings WHERE channel_id = ?').get(channelId);
  res.json(settings);
});

router.get('/leaderboard', requireAuth, (req, res) => {
  const db = getDb();
  const channelId = getChannelId(db, req.session.userId);
  if (!channelId) return res.status(404).json({ error: 'Channel not found' });

  const top = db.prepare(`
    SELECT username, points FROM loyalty_points
    WHERE channel_id = ?
    ORDER BY points DESC
    LIMIT 10
  `).all(channelId);

  res.json(top);
});

module.exports = router;
