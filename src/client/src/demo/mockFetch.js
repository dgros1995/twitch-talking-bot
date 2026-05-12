import {
  DEMO_USER, DEMO_COMMANDS, DEMO_TIMERS, DEMO_LOYALTY, DEMO_LEADERBOARD,
} from './data';

// In-memory mutable copies so add/edit/delete feel real during the demo
let commands = DEMO_COMMANDS.map(c => ({ ...c }));
let timers = DEMO_TIMERS.map(t => ({ ...t }));
let loyalty = { ...DEMO_LOYALTY };
let nextId = 100;
let botActive = DEMO_USER.bot_active;

function ok(body) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}
function created(body) {
  return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(body) });
}
function err(msg, status = 400) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve({ error: msg }) });
}

export function mockFetch(url, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const body = opts.body ? JSON.parse(opts.body) : null;
  const path = url.split('?')[0];

  // --- /api/me ---
  if (path === '/api/me') {
    return ok({ ...DEMO_USER, bot_active: botActive });
  }

  // --- /api/commands ---
  if (path === '/api/commands') {
    if (method === 'GET') return ok([...commands]);
    if (method === 'POST') {
      if (!body.trigger || !body.response) return err('trigger and response required');
      const exists = commands.find(c => c.trigger === body.trigger.toLowerCase().trim());
      if (exists) return err('Command with that trigger already exists', 409);
      const cmd = { id: nextId++, channel_id: 1, trigger: body.trigger.toLowerCase().trim(), response: body.response.trim(), cooldown: body.cooldown ?? 5, enabled: 1 };
      commands.push(cmd);
      return created(cmd);
    }
  }
  if (/^\/api\/commands\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop());
    if (method === 'PUT') {
      const idx = commands.findIndex(c => c.id === id);
      if (idx === -1) return err('Command not found', 404);
      commands[idx] = { ...commands[idx], ...body, trigger: body.trigger.toLowerCase().trim(), response: body.response.trim() };
      return ok(commands[idx]);
    }
    if (method === 'DELETE') {
      const before = commands.length;
      commands = commands.filter(c => c.id !== id);
      return commands.length < before ? ok({ ok: true }) : err('Command not found', 404);
    }
  }

  // --- /api/timers ---
  if (path === '/api/timers') {
    if (method === 'GET') return ok([...timers]);
    if (method === 'POST') {
      if (!body.name || !body.message) return err('name and message required');
      const t = { id: nextId++, channel_id: 1, name: body.name.trim(), message: body.message.trim(), interval_minutes: body.interval_minutes ?? 10, enabled: 1 };
      timers.push(t);
      return created(t);
    }
  }
  if (/^\/api\/timers\/\d+$/.test(path)) {
    const id = Number(path.split('/').pop());
    if (method === 'PUT') {
      const idx = timers.findIndex(t => t.id === id);
      if (idx === -1) return err('Timer not found', 404);
      timers[idx] = { ...timers[idx], ...body };
      return ok(timers[idx]);
    }
    if (method === 'DELETE') {
      const before = timers.length;
      timers = timers.filter(t => t.id !== id);
      return timers.length < before ? ok({ ok: true }) : err('Timer not found', 404);
    }
  }

  // --- /api/loyalty ---
  if (path === '/api/loyalty/leaderboard') return ok([...DEMO_LEADERBOARD]);
  if (path === '/api/loyalty') {
    if (method === 'GET') return ok({ ...loyalty });
    if (method === 'PUT') { loyalty = { ...loyalty, ...body }; return ok({ ...loyalty }); }
  }

  // --- /api/bot ---
  if (path === '/api/bot/join')  { botActive = 1; return ok({ ok: true }); }
  if (path === '/api/bot/leave') { botActive = 0; return ok({ ok: true }); }

  // --- /auth/logout ---
  if (path === '/auth/logout') return ok({ ok: true });

  return err('Not found', 404);
}
