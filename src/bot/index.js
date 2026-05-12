const tmi = require('tmi.js');
const fetch = require('node-fetch');
const { getDb } = require('../server/db');

class TwitchBot {
  constructor() {
    this.client = null;
    this.activeChannels = new Map(); // channelName -> channelId
    this.timerIntervals = new Map(); // channelId -> [intervalIds]
    this.loyaltyIntervals = new Map(); // channelId -> intervalId
    this.commandCooldowns = new Map(); // `${channelId}:${trigger}` -> timestamp
    this.activeUsers = new Map(); // channelId -> Set of usernames
  }

  async init() {
    this.client = new tmi.Client({
      options: { debug: false },
      identity: {
        username: process.env.TWITCH_BOT_USERNAME,
        password: process.env.TWITCH_BOT_OAUTH,
      },
      channels: [],
    });

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return;
      const channelName = channel.replace('#', '');
      const channelId = this.activeChannels.get(channelName);
      if (!channelId) return;

      this._trackActivity(channelId, tags.username);
      this._handleMessage(channel, channelName, channelId, tags, message);
    });

    this.client.on('connected', () => console.log('Bot connected to Twitch IRC'));
    this.client.on('disconnected', (reason) => console.log('Bot disconnected:', reason));

    await this.client.connect();

    // Rejoin channels that were active before restart
    const db = getDb();
    const activeChannels = db.prepare('SELECT id, channel_name FROM channels WHERE bot_active = 1').all();
    for (const ch of activeChannels) {
      await this.joinChannel(ch.channel_name, ch.id).catch(console.error);
    }
  }

  async joinChannel(channelName, channelId) {
    if (this.activeChannels.has(channelName)) return;
    await this.client.join(channelName);
    this.activeChannels.set(channelName, channelId);
    this.activeUsers.set(channelId, new Set());
    this.reloadTimers(channelId);
    this.reloadLoyalty(channelId);
    console.log(`Bot joined #${channelName}`);
  }

  async leaveChannel(channelName, channelId) {
    if (!this.activeChannels.has(channelName)) return;
    await this.client.part(channelName);
    this.activeChannels.delete(channelName);
    this._clearTimers(channelId);
    this._clearLoyalty(channelId);
    this.activeUsers.delete(channelId);
    console.log(`Bot left #${channelName}`);
  }

  _trackActivity(channelId, username) {
    if (!this.activeUsers.has(channelId)) this.activeUsers.set(channelId, new Set());
    this.activeUsers.get(channelId).add(username.toLowerCase());
  }

  async _handleMessage(channel, channelName, channelId, tags, message) {
    const text = message.trim();
    if (!text.startsWith('!')) return;

    const parts = text.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const username = tags.username;
    const isMod = tags.mod || tags.badges?.broadcaster === '1';

    // Built-in commands
    switch (command) {
      case 'points':
        return this._cmdPoints(channel, channelId, username);
      case 'top':
        return this._cmdTop(channel, channelId);
      case 'addpoints':
        if (!isMod) return this.client.say(channel, `@${username} Only mods can use that command.`);
        return this._cmdAddPoints(channel, channelId, args);
      case 'so':
        if (!isMod) return this.client.say(channel, `@${username} Only mods can use that command.`);
        return this._cmdShoutout(channel, args);
      case 'uptime':
        return this._cmdUptime(channel, channelName);
      case 'followage':
        return this._cmdFollowage(channel, channelName, username, tags['user-id']);
    }

    // Custom commands
    const db = getDb();
    const customCmd = db.prepare(`
      SELECT * FROM commands WHERE channel_id = ? AND trigger = ? AND enabled = 1
    `).get(channelId, command);

    if (customCmd) {
      const cooldownKey = `${channelId}:${command}`;
      const lastUsed = this.commandCooldowns.get(cooldownKey) || 0;
      const now = Date.now();
      if (now - lastUsed < customCmd.cooldown * 1000) return;
      this.commandCooldowns.set(cooldownKey, now);

      const response = customCmd.response
        .replace(/\{user\}/g, username)
        .replace(/\{channel\}/g, channelName);
      this.client.say(channel, response);
    }
  }

  _cmdPoints(channel, channelId, username) {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM loyalty_settings WHERE channel_id = ?').get(channelId);
    if (!settings || !settings.enabled) {
      return this.client.say(channel, `Loyalty points are not enabled in this channel.`);
    }
    const row = db.prepare('SELECT points FROM loyalty_points WHERE channel_id = ? AND username = ?').get(channelId, username);
    const pts = row ? row.points : 0;
    this.client.say(channel, `@${username} has ${pts} ${settings.points_name}.`);
  }

  _cmdTop(channel, channelId) {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM loyalty_settings WHERE channel_id = ?').get(channelId);
    if (!settings || !settings.enabled) {
      return this.client.say(channel, `Loyalty points are not enabled in this channel.`);
    }
    const top = db.prepare(`
      SELECT username, points FROM loyalty_points WHERE channel_id = ? ORDER BY points DESC LIMIT 5
    `).all(channelId);
    if (!top.length) return this.client.say(channel, 'No points data yet!');
    const list = top.map((r, i) => `${i + 1}. ${r.username} (${r.points})`).join(' | ');
    this.client.say(channel, `Top ${settings.points_name}: ${list}`);
  }

  _cmdAddPoints(channel, channelId, args) {
    const [targetUser, amountStr] = args;
    const amount = parseInt(amountStr, 10);
    if (!targetUser || isNaN(amount)) {
      return this.client.say(channel, 'Usage: !addpoints [user] [amount]');
    }
    const db = getDb();
    const settings = db.prepare('SELECT * FROM loyalty_settings WHERE channel_id = ?').get(channelId);
    db.prepare(`
      INSERT INTO loyalty_points (channel_id, username, points)
      VALUES (?, ?, ?)
      ON CONFLICT(channel_id, username) DO UPDATE SET points = points + excluded.points
    `).run(channelId, targetUser.replace('@', '').toLowerCase(), amount);
    const row = db.prepare('SELECT points FROM loyalty_points WHERE channel_id = ? AND username = ?').get(channelId, targetUser.replace('@', '').toLowerCase());
    this.client.say(channel, `Added ${amount} ${settings?.points_name || 'points'} to ${targetUser}. New total: ${row.points}.`);
  }

  _cmdShoutout(channel, args) {
    const target = args[0]?.replace('@', '');
    if (!target) return this.client.say(channel, 'Usage: !so [username]');
    this.client.say(channel, `Check out ${target} at https://twitch.tv/${target} — give them a follow!`);
  }

  async _cmdUptime(channel, channelName) {
    try {
      const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${channelName}`, {
        headers: {
          'Client-Id': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${this._getAppToken()}`,
        },
      });
      const data = await res.json();
      if (!data.data || !data.data[0]) {
        return this.client.say(channel, `${channelName} is currently offline.`);
      }
      const startedAt = new Date(data.data[0].started_at);
      const diff = Date.now() - startedAt.getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      this.client.say(channel, `${channelName} has been live for ${hours}h ${mins}m.`);
    } catch (err) {
      this.client.say(channel, 'Could not fetch uptime.');
    }
  }

  async _cmdFollowage(channel, channelName, username, userId) {
    try {
      const db = getDb();
      const channelUser = db.prepare('SELECT u.twitch_id, u.access_token FROM users u JOIN channels c ON c.user_id = u.id WHERE c.channel_name = ?').get(channelName);
      if (!channelUser) return this.client.say(channel, 'Could not check followage.');

      const res = await fetch(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channelUser.twitch_id}&user_id=${userId}`,
        {
          headers: {
            'Client-Id': process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${channelUser.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!data.data || !data.data[0]) {
        return this.client.say(channel, `@${username} is not following ${channelName}.`);
      }
      const followedAt = new Date(data.data[0].followed_at);
      const diff = Date.now() - followedAt.getTime();
      const days = Math.floor(diff / 86400000);
      const months = Math.floor(days / 30);
      const years = Math.floor(months / 12);
      let display = `${days} days`;
      if (years > 0) display = `${years} year${years > 1 ? 's' : ''}, ${months % 12} month${months % 12 !== 1 ? 's' : ''}`;
      else if (months > 0) display = `${months} month${months > 1 ? 's' : ''}, ${days % 30} day${days % 30 !== 1 ? 's' : ''}`;
      this.client.say(channel, `@${username} has been following ${channelName} for ${display}.`);
    } catch (err) {
      this.client.say(channel, 'Could not fetch followage.');
    }
  }

  // Placeholder — uptime cmd uses broadcaster token instead of app token for simplicity
  _getAppToken() {
    // For stream uptime we reuse any stored user access_token as a fallback
    const db = getDb();
    const user = db.prepare('SELECT access_token FROM users LIMIT 1').get();
    return user ? user.access_token : '';
  }

  reloadTimers(channelId) {
    this._clearTimers(channelId);
    const db = getDb();
    const timers = db.prepare('SELECT * FROM timers WHERE channel_id = ? AND enabled = 1').all(channelId);

    const channelEntry = [...this.activeChannels.entries()].find(([, id]) => id === channelId);
    if (!channelEntry) return;
    const channelName = '#' + channelEntry[0];

    const intervals = [];
    for (const timer of timers) {
      const ms = timer.interval_minutes * 60 * 1000;
      const id = setInterval(() => {
        this.client.say(channelName, timer.message).catch(console.error);
      }, ms);
      intervals.push(id);
    }
    this.timerIntervals.set(channelId, intervals);
  }

  reloadLoyalty(channelId) {
    this._clearLoyalty(channelId);
    const db = getDb();
    const settings = db.prepare('SELECT * FROM loyalty_settings WHERE channel_id = ?').get(channelId);
    if (!settings || !settings.enabled) return;

    const ms = settings.earn_interval_minutes * 60 * 1000;
    const id = setInterval(() => {
      const users = this.activeUsers.get(channelId);
      if (!users || users.size === 0) return;

      const insert = db.prepare(`
        INSERT INTO loyalty_points (channel_id, username, points)
        VALUES (?, ?, ?)
        ON CONFLICT(channel_id, username) DO UPDATE SET
          points = points + excluded.points,
          last_seen = CURRENT_TIMESTAMP
      `);
      const insertMany = db.transaction((userList) => {
        for (const u of userList) insert.run(channelId, u, settings.earn_amount);
      });
      insertMany([...users]);
      users.clear();
    }, ms);

    this.loyaltyIntervals.set(channelId, id);
  }

  _clearTimers(channelId) {
    const ids = this.timerIntervals.get(channelId) || [];
    ids.forEach(clearInterval);
    this.timerIntervals.delete(channelId);
  }

  _clearLoyalty(channelId) {
    const id = this.loyaltyIntervals.get(channelId);
    if (id) clearInterval(id);
    this.loyaltyIntervals.delete(channelId);
  }
}

module.exports = TwitchBot;
