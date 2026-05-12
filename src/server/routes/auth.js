const express = require('express');
const fetch = require('node-fetch');
const { getDb } = require('../db');

const router = express.Router();

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_USERS_URL = 'https://api.twitch.tv/helix/users';

router.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: process.env.CALLBACK_URL,
    response_type: 'code',
    scope: 'user:read:email moderator:read:followers',
  });
  res.redirect(`${TWITCH_AUTH_URL}?${params}`);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?error=' + encodeURIComponent(error));
  }

  try {
    const tokenRes = await fetch(TWITCH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.CALLBACK_URL,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect('/?error=token_failed');
    }

    const userRes = await fetch(TWITCH_USERS_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID,
      },
    });

    const userData = await userRes.json();
    const twitchUser = userData.data[0];

    const db = getDb();

    const existingUser = db.prepare('SELECT id FROM users WHERE twitch_id = ?').get(twitchUser.id);

    let userId;
    if (existingUser) {
      db.prepare(`
        UPDATE users SET username = ?, display_name = ?, profile_image_url = ?,
        access_token = ?, refresh_token = ? WHERE twitch_id = ?
      `).run(
        twitchUser.login,
        twitchUser.display_name,
        twitchUser.profile_image_url,
        tokenData.access_token,
        tokenData.refresh_token || null,
        twitchUser.id
      );
      userId = existingUser.id;
    } else {
      const result = db.prepare(`
        INSERT INTO users (twitch_id, username, display_name, profile_image_url, access_token, refresh_token)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        twitchUser.id,
        twitchUser.login,
        twitchUser.display_name,
        twitchUser.profile_image_url,
        tokenData.access_token,
        tokenData.refresh_token || null
      );
      userId = result.lastInsertRowid;

      db.prepare(`
        INSERT INTO channels (user_id, channel_name) VALUES (?, ?)
      `).run(userId, twitchUser.login);

      db.prepare(`
        INSERT INTO loyalty_settings (channel_id)
        SELECT id FROM channels WHERE user_id = ?
      `).run(userId);
    }

    req.session.userId = userId;
    req.session.twitchId = twitchUser.id;
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Auth callback error:', err);
    res.redirect('/?error=auth_failed');
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

module.exports = router;
