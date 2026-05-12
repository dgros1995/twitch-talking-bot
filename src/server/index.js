require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Run migrations before anything else
require('./db/migrate');

const SqliteStore = require('connect-sqlite3')(session);
const botRef = require('./bot-ref');
const TwitchBot = require('../bot');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  store: new SqliteStore({ db: 'sessions.db', dir: path.join(__dirname, '../../') }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/auth', require('./routes/auth'));
app.use('/api/me', require('./routes/me'));
app.use('/api/commands', require('./routes/commands'));
app.use('/api/timers', require('./routes/timers'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/loyalty', require('./routes/loyalty'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  try {
    const bot = new TwitchBot();
    await bot.init();
    botRef.bot = bot;
    console.log('Bot initialized');
  } catch (err) {
    console.error('Bot failed to initialize (check .env credentials):', err.message);
  }
});
