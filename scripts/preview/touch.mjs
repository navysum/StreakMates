/**
 * Measure every touch target and check for sideways overflow, on every screen.
 *
 *   npm run build:web -- --output-dir dist-demo
 *   npm run preview:touch
 *
 * Two of the mobile audit's mandatory failure flags are "important controls
 * are too small to tap reliably" and "essential content depends on horizontal
 * scrolling". Both are measurable, so neither should ever be a judgement call.
 *
 * The first run found ten controls under 44x44 — every text link in the app,
 * at 14px tall. They looked fine on a phone because they carried `hitSlop`,
 * and react-native-web does not implement hitSlop at all. That is exactly the
 * kind of thing reading the source will not tell you.
 */
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { TABLES, IDS } from './fixtures.mjs';

const DIST = process.env.DIST || new URL('../../dist-demo', import.meta.url).pathname;
const types = {'.js':'text/javascript','.html':'text/html','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.json':'application/json'};
const server = http.createServer((req,res)=>{
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST,'index.html');
  res.setHeader('Content-Type', types[path.extname(f)] ?? 'application/octet-stream');
  res.end(fs.readFileSync(f));
});
await new Promise(r=>server.listen(4601,r));

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now()/1000)+3600;
const SESSION = { access_token:`${b64({alg:'HS256'})}.${b64({sub:IDS.ME,role:'authenticated',exp})}.s`,
  refresh_token:'r', token_type:'bearer', expires_in:3600, expires_at:exp,
  user:{ id:IDS.ME, aud:'authenticated', role:'authenticated', email:'c@e.com',
         app_metadata:{}, user_metadata:{}, created_at:new Date().toISOString() } };

function applyQuery(rows, url){ const p=url.searchParams; let out=[...rows];
  for(const [k,raw] of p.entries()){ if(['select','order','limit','offset','on_conflict'].includes(k))continue;
    const [op,...rest]=raw.split('.'); const v=rest.join('.');
    if(op==='eq') out=out.filter(r=>String(r[k])===v);
    else if(op==='is') out=out.filter(r=> v==='null'? r[k]==null : r[k]!=null);
    else if(op==='in'){const s=new Set(v.replace(/^\(|\)$/g,'').split(',').map(x=>x.replace(/^"|"$/g,''))); out=out.filter(r=>s.has(String(r[k])));}
    else if(op==='gte') out=out.filter(r=>String(r[k])>=v);
    else if(op==='lte') out=out.filter(r=>String(r[k])<=v);
  } return out; }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2 });
await ctx.route('**/*.supabase.co/**', async route => {
  const url = new URL(route.request().url());
  const json = b => route.fulfill({ status:200, contentType:'application/json',
    headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(b) });
  if (url.pathname.startsWith('/auth/v1/token')) return json(SESSION);
  if (url.pathname.startsWith('/auth/v1/user')) return json(SESSION.user);
  if (url.pathname.startsWith('/rest/v1/rpc/')) return json(true);
  if (url.pathname.startsWith('/rest/v1/')) {
    const t = url.pathname.replace('/rest/v1/','').split('?')[0];
    if (route.request().method() !== 'GET') return json([]);
    return json(applyQuery(TABLES[t] ?? [], url));
  }
  return json({});
});
const page = await ctx.newPage();
await page.goto('http://localhost:4601/', { waitUntil:'domcontentloaded' });
await page.evaluate(([k,v]) => localStorage.setItem(k,v), ['sb-demoproject-auth-token', JSON.stringify(SESSION)]);

const ROUTES = [['today','/'],['groups','/groups'],['group',`/group/${IDS.GROUP}`],
  ['leaderboard',`/group/leaderboard?id=${IDS.GROUP}`],['habit','/habit/h1'],
  ['you','/you'],['focus','/focus'],['activity','/activity']];

const MIN = 44;
const small = [];
const overflow = [];
for (const [name, route] of ROUTES) {
  await page.goto('http://localhost:4601'+route, { waitUntil:'networkidle' });
  await page.waitForTimeout(900);
  const found = await page.evaluate((MIN) => {
    const out = [];
    const nodes = document.querySelectorAll('[role="button"],[role="checkbox"],[role="link"],button,input,a,[tabindex]');
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width >= MIN && r.height >= MIN) continue;
      out.push({ w: Math.round(r.width), h: Math.round(r.height),
                 label: (el.getAttribute('aria-label') || el.innerText || el.tagName).trim().replace(/\s+/g,' ').slice(0, 42) });
    }
    return out;
  }, MIN);
  const over = await page.evaluate(() => {
    const d = document.documentElement;
    const b = document.body;
    return { doc: d.scrollWidth - d.clientWidth, body: b.scrollWidth - b.clientWidth,
             w: d.clientWidth };
  });
  if (over.doc > 1 || over.body > 1) overflow.push({ screen: name, ...over });

  const seen = new Set();
  for (const f of found) {
    const k = `${f.label}|${f.w}x${f.h}`;
    if (seen.has(k)) continue; seen.add(k);
    small.push({ screen: name, ...f });
  }
}

console.log(`Touch targets under ${MIN}x${MIN} at 390x844:\n`);
if (!small.length) console.log('  none');
for (const s of small) console.log(`  ${s.screen.padEnd(12)} ${String(s.w).padStart(3)}x${String(s.h).padStart(3)}  ${s.label}`);
console.log('\nHorizontal overflow (essential content scrolling sideways):');
console.log(overflow.length ? overflow : '  none');
await browser.close(); server.close();
