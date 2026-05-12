const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/join', requireAuth, async (req, res) => {
  const db = getDb();
  const channel = db.prepare('SELECT * FROM channels WHERE user_id = ?').get(req.session.userId);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });

  const { bot } = require('../bot-ref');
  if (!bot) return res.status(503).json({ error: 'Bot not initialized' });

  try {
    await bot.joinChannel(channel.channel_name, channel.id);
    db.prepare('UPDATE channels SET bot_active = 1 WHERE id = ?').run(channel.id);
    res.json({ ok: true, channel: channel.channel_name });
  } catch (err) {
    console.error('Bot join error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/leave', requireAuth, async (req, res) => {
  const db = getDb();
  const channel = db.prepare('SELECT * FROM channels WHERE user_id = ?').get(req.session.userId);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });

  const { bot } = require('../bot-ref');
  if (!bot) return res.status(503).json({ error: 'Bot not initialized' });

  try {
    await bot.leaveChannel(channel.channel_name, channel.id);
    db.prepare('UPDATE channels SET bot_active = 0 WHERE id = ?').run(channel.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Bot leave error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
