# TwitchBot Dashboard

A full-stack Twitch bot platform. Streamers log in with Twitch OAuth, connect a bot to their channel, and manage commands, timers, and loyalty points via a dashboard.

## Setup

### 1. Register a Twitch Application

1. Go to https://dev.twitch.tv/console/apps and click **Register Your Application**
2. Set **OAuth Redirect URL** to `http://localhost:3001/auth/callback`
3. Select **Category: Chat Bot**
4. Note your **Client ID** and generate a **Client Secret**

### 2. Get a Bot OAuth Token

For the bot account (can be the same account or a separate one):

1. Go to https://twitchapps.com/tmi/ and log in as your bot account
2. Copy the OAuth token (starts with `oauth:`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
TWITCH_CLIENT_ID=       # From Twitch dev console
TWITCH_CLIENT_SECRET=   # From Twitch dev console
TWITCH_BOT_USERNAME=    # Bot Twitch username (lowercase)
TWITCH_BOT_OAUTH=       # oauth:xxxxxx token for the bot
SESSION_SECRET=         # Any random string (e.g. openssl rand -hex 32)
CALLBACK_URL=http://localhost:3001/auth/callback
PORT=3001
```

### 4. Install Dependencies

```bash
npm install
npm install --prefix src/client
```

### 5. Run

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

Open http://localhost:5173 in your browser.

## Commands

| npm script | Description |
|---|---|
| `npm run dev` | Start backend + frontend (development) |
| `npm run server` | Start backend only |
| `npm run client` | Start frontend only |
| `npm run migrate` | Run DB migrations manually |

## Built-in Bot Commands

| Command | Who | Description |
|---|---|---|
| `!points` | Everyone | Shows your loyalty point balance |
| `!top` | Everyone | Top 5 point holders |
| `!addpoints [user] [n]` | Mods | Add points to a user |
| `!so [user]` | Mods | Shoutout a user |
| `!uptime` | Everyone | Stream uptime |
| `!followage` | Everyone | How long you've followed |

## Architecture

```
src/
  server/        Express API (port 3001)
    db/          SQLite via better-sqlite3
    routes/      auth, commands, timers, bot, loyalty
    middleware/  session auth check
  bot/           tmi.js bot client
  client/        React + Vite (port 5173)
    pages/       Landing, Dashboard, Commands, Timers, Loyalty, Overview
```

## Database

SQLite file at `data.db` (auto-created on first run). Tables: `users`, `channels`, `commands`, `timers`, `loyalty_settings`, `loyalty_points`.
