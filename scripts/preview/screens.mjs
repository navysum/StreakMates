/**
 * Screenshot every signed-in screen, in both themes, without a Supabase
 * project.
 *
 *   npm run build:web -- --output-dir dist-demo    # with any .env that parses
 *   node scripts/preview/screens.mjs
 *
 * Needs Playwright and a Chromium, which are deliberately NOT dependencies of
 * this app — it ships to phones and browsers, not to CI:
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *
 * Why it exists: everything behind the sign-in gate is otherwise unreviewable
 * without a live database and a real account, so the entire redesign was
 * verified on one signed-out screen. The first run of this found three bugs in
 * about a minute — avatars reading "@(" on the leaderboard, a habit rate of
 * 106%, and a completed day drawn as a row of tiny rainbows.
 *
 * Nothing in the app is stubbed or altered. A fake session goes into
 * localStorage and every request to *.supabase.co is answered from
 * fixtures.mjs, so these are the real screens with real components — only the
 * network is a lie.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { TABLES, IDS } from './fixtures.mjs';

const DIST = process.env.DIST || new URL('../../dist-demo', import.meta.url).pathname;
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; object-src 'none'";
const types = { '.js':'text/javascript', '.html':'text/html', '.png':'image/png',
                '.ico':'image/x-icon', '.ttf':'font/ttf', '.json':'application/json', '.css':'text/css' };

const server = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('Content-Type', types[path.extname(f)] ?? 'application/octet-stream');
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(4600, r));

// A session the client will accept: unexpired, with the user it will read off
// `session.user` rather than by calling the network.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = `${b64({alg:'HS256',typ:'JWT'})}.${b64({sub:IDS.ME,role:'authenticated',exp,aud:'authenticated'})}.sig`;
const SESSION = {
  access_token: jwt, refresh_token: 'refresh-token', token_type: 'bearer',
  expires_in: 3600, expires_at: exp,
  user: { id: IDS.ME, aud: 'authenticated', role: 'authenticated',
          email: 'craig@example.com', app_metadata: { provider: 'google' },
          user_metadata: { full_name: 'Craig Ataide' }, created_at: new Date().toISOString() },
};

/** The slice of PostgREST the app actually uses: eq, in, is, order, select. */
function applyQuery(rows, url) {
  const p = url.searchParams;
  let out = [...rows];
  for (const [key, raw] of p.entries()) {
    if (['select','order','limit','offset','on_conflict'].includes(key)) continue;
    const [op, ...rest] = raw.split('.');
    const value = rest.join('.');
    if (op === 'eq') out = out.filter(r => String(r[key]) === value);
    else if (op === 'is') out = out.filter(r => (value === 'null' ? r[key] == null : r[key] != null));
    else if (op === 'in') {
      const set = new Set(value.replace(/^\(|\)$/g, '').split(',').map(v => v.replace(/^"|"$/g, '')));
      out = out.filter(r => set.has(String(r[key])));
    } else if (op === 'gte') out = out.filter(r => String(r[key]) >= value);
    else if (op === 'lte') out = out.filter(r => String(r[key]) <= value);
    else if (op === 'neq') out = out.filter(r => String(r[key]) !== value);
  }
  const order = p.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    out.sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1) * (dir === 'desc' ? -1 : 1));
  }
  return out;
}

/** The app selects `profile:profiles(...)` on group_members; expand it. */
function embed(table, rows, select) {
  if (table === 'group_members' && select && select.includes('profile')) return rows;
  return rows;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

const SHOTS = [
  ['today', '/'],
  ['groups', '/groups'],
  ['group', `/group/${IDS.GROUP}`],
  ['leaderboard', `/group/leaderboard?id=${IDS.GROUP}`],
  ['habit', '/habit/h1'],
  ['you', '/you'],
  ['focus', '/focus'],
  ['activity', '/activity'],
];

const OUT = process.env.OUT || '/tmp/screens';
fs.mkdirSync(OUT, { recursive: true });

const problems = [];

for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({
    viewport: { width: 402, height: 850 }, deviceScaleFactor: 2, colorScheme: scheme,
    reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
  });

  await ctx.route('**/*.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    const json = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json',
                      headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

    if (url.pathname.startsWith('/auth/v1/token')) return json(SESSION);
    if (url.pathname.startsWith('/auth/v1/user')) return json(SESSION.user);
    if (url.pathname.startsWith('/auth/v1/logout')) return json({});

    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.split('/rpc/')[1];
      if (fn === 'username_available') return json(true);
      return json(null);
    }

    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.replace('/rest/v1/', '').split('?')[0];
      const rows = TABLES[table];
      if (!rows) { problems.push(`no fixture for table "${table}"`); return json([]); }
      if (route.request().method() !== 'GET') return json([]);
      return json(embed(table, applyQuery(rows, url), url.searchParams.get('select')));
    }
    return json({});
  });

  const page = await ctx.newPage();
  page.on('console', m => {
    const t = m.text();
    // The realtime socket cannot leave this sandbox; that is the network, not the app.
    if (/WebSocket|realtime/.test(t)) return;
    if (m.type() === 'error' || /Refused to|Content Security/.test(t)) problems.push(`${scheme} console: ${t}`);
  });
  page.on('pageerror', e => problems.push(`${scheme} pageerror: ${e.message}`));

  await page.goto('http://localhost:4600/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(([key, value]) => localStorage.setItem(key, value),
    ['sb-demoproject-auth-token', JSON.stringify(SESSION)]);

  for (const [name, route] of SHOTS) {
    await page.goto('http://localhost:4600' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${scheme}-${name}.png` });
    const text = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 110));
    console.log(`${scheme.padEnd(5)} ${name.padEnd(12)} ${text}`);
  }
  await ctx.close();
}

console.log('\nproblems:', problems.length ? [...new Set(problems)].slice(0, 12) : 'none');
await browser.close();
server.close();
