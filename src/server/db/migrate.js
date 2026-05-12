require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../../data.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    twitch_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT NOT NULL,
    profile_image_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_name TEXT NOT NULL,
    bot_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );

  CREATE TABLE IF NOT EXISTS commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    cooldown INTEGER DEFAULT 5,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, trigger)
  );

  CREATE TABLE IF NOT EXISTS timers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    interval_minutes INTEGER DEFAULT 10,
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS loyalty_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    enabled INTEGER DEFAULT 0,
    points_name TEXT DEFAULT 'points',
    earn_amount INTEGER DEFAULT 10,
    earn_interval_minutes INTEGER DEFAULT 5,
    UNIQUE(channel_id)
  );

  CREATE TABLE IF NOT EXISTS loyalty_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, username)
  );
`);

console.log('✅ Database migrated successfully at', DB_PATH);
db.close();
