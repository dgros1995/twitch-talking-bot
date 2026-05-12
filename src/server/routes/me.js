const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.twitch_id, u.username, u.display_name, u.profile_image_url,
           c.id as channel_id, c.channel_name, c.bot_active
    FROM users u
    LEFT JOIN channels c ON c.user_id = u.id
    WHERE u.id = ?
  `).get(req.session.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

module.exports = router;
