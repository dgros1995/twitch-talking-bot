export const DEMO_USER = {
  id: 1,
  twitch_id: '123456789',
  username: 'streamerdemo',
  display_name: 'StreamerDemo',
  profile_image_url: 'https://static-cdn.jtvnw.net/user-default-pictures-uv/75305d54-c7cc-40d1-bb9c-91fbe85943c7-profile_image-70x70.png',
  channel_id: 1,
  channel_name: 'streamerdemo',
  bot_active: 1,
};

export const DEMO_COMMANDS = [
  { id: 1, channel_id: 1, trigger: 'hello',    response: 'Hey {user}! Welcome to the stream! 👋',          cooldown: 5,  enabled: 1 },
  { id: 2, channel_id: 1, trigger: 'discord',  response: 'Join our Discord: https://discord.gg/example',   cooldown: 30, enabled: 1 },
  { id: 3, channel_id: 1, trigger: 'lurk',     response: '{user} is now lurking in the shadows 🌙',        cooldown: 0,  enabled: 1 },
  { id: 4, channel_id: 1, trigger: 'gg',       response: 'GG! Thanks for watching {user}! 🎮',             cooldown: 5,  enabled: 1 },
  { id: 5, channel_id: 1, trigger: 'schedule', response: 'We stream Mon/Wed/Fri at 8PM EST!',               cooldown: 15, enabled: 0 },
  { id: 6, channel_id: 1, trigger: 'socials',  response: 'Follow on Twitter: @streamerdemo | IG: @streamerdemo', cooldown: 20, enabled: 1 },
];

export const DEMO_TIMERS = [
  { id: 1, channel_id: 1, name: 'Discord Reminder',  message: '👾 Join our Discord community! Link in description.', interval_minutes: 20, enabled: 1 },
  { id: 2, channel_id: 1, name: 'Follow Reminder',   message: '❤️ Enjoying the stream? Drop a follow to get notified!', interval_minutes: 30, enabled: 1 },
  { id: 3, channel_id: 1, name: 'Hydration Check',   message: '💧 Hydration check! Have you had water recently?',    interval_minutes: 45, enabled: 1 },
  { id: 4, channel_id: 1, name: 'Schedule Post',     message: '📅 Stream schedule: Mon/Wed/Fri @ 8PM EST',            interval_minutes: 60, enabled: 0 },
];

export const DEMO_LOYALTY = {
  id: 1,
  channel_id: 1,
  enabled: 1,
  points_name: 'StreamCoins',
  earn_amount: 10,
  earn_interval_minutes: 5,
};

export const DEMO_LEADERBOARD = [
  { username: 'superfan99',    points: 48200 },
  { username: 'xXgamerXx',    points: 31750 },
  { username: 'loyalty_king',  points: 27100 },
  { username: 'nightwatcher',  points: 19400 },
  { username: 'lurker_pro',    points: 14800 },
  { username: 'chatmaster',    points: 11200 },
  { username: 'viewerOne',     points: 8900  },
  { username: 'coolguy42',     points: 5300  },
  { username: 'just_watching', points: 2100  },
  { username: 'newchatter',    points: 450   },
];
