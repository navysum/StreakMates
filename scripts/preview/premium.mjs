/**
 * Exercise the things that make the app feel finished, rather than trusting
 * that they compile.
 *
 *   npm run build:web -- --output-dir dist-demo
 *   npm run preview:premium
 *
 * Four behaviours, each of which was wrong or absent before:
 *
 *   the loading state      shows structure, and the layout does not jump
 *   the milestone          fires on the day a run reaches a week
 *   an ordinary check-in   stays quiet
 *   the remembered tab     survives leaving the screen
 *
 * The mock keeps writes. Returning [] to a POST and then serving the original
 * fixture to the refetch that follows makes every optimistic update look like
 * it reverts — which is the harness lying about the app, and it did exactly
 * that until a screenshot showed a check-in un-ticking itself.
 */
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { TABLES, IDS } from './fixtures.mjs';

const DIST = process.env.DIST || '/home/user/Habit-Tracking-with-Friends/dist-demo';
const OUT = process.env.OUT || '/tmp/screens';
const types = {'.js':'text/javascript','.html':'text/html','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.json':'application/json'};
const server = http.createServer((q,r)=>{ let f=path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(DIST,'index.html');
  r.setHeader('Content-Type', types[path.extname(f)]??'application/octet-stream'); r.end(fs.readFileSync(f)); });
await new Promise(r=>server.listen(4604,r));

const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const exp=Math.floor(Date.now()/1000)+3600;
const S={access_token:`${b64({alg:'HS256'})}.${b64({sub:IDS.ME,exp})}.s`,refresh_token:'r',token_type:'bearer',
  expires_in:3600,expires_at:exp,user:{id:IDS.ME,aud:'authenticated',role:'authenticated',email:'c@e.com',
  app_metadata:{},user_metadata:{},created_at:new Date().toISOString()}};

function applyQuery(rows,url){const p=url.searchParams;let out=[...rows];
  for(const [k,raw] of p.entries()){ if(['select','order','limit','offset','on_conflict'].includes(k))continue;
    const [op,...rest]=raw.split('.'); const v=rest.join('.');
    if(op==='eq') out=out.filter(r=>String(r[k])===v);
    else if(op==='is') out=out.filter(r=> v==='null'? r[k]==null : r[k]!=null);
    else if(op==='in'){const st=new Set(v.replace(/^\(|\)$/g,'').split(',').map(x=>x.replace(/^"|"$/g,'')));out=out.filter(r=>st.has(String(r[k])));}
    else if(op==='gte') out=out.filter(r=>String(r[k])>=v);
    else if(op==='lte') out=out.filter(r=>String(r[k])<=v);
  } return out; }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let delay = 0;
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true });
await ctx.route('**/*.supabase.co/**', async route => {
  const url = new URL(route.request().url());
  const json = b => route.fulfill({ status:200, contentType:'application/json',
    headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(b) });
  if (url.pathname.startsWith('/auth/v1/token')) return json(S);
  if (url.pathname.startsWith('/auth/v1/user')) return json(S.user);
  if (url.pathname.startsWith('/rest/v1/rpc/')) return json(true);
  if (url.pathname.startsWith('/rest/v1/')) {
    if (delay) await new Promise(r => setTimeout(r, delay));
    const t = url.pathname.replace('/rest/v1/','').split('?')[0];
    const method = route.request().method();

    // Writes are kept, not swallowed. Returning [] to a POST and then serving
    // the original fixture to the refetch that follows makes every optimistic
    // update look like it reverts — which is the mock lying about the app.
    if (method === 'POST' || method === 'PATCH') {
      let body = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch {}
      const rows = Array.isArray(body) ? body : [body];
      TABLES[t] = TABLES[t] ?? [];
      for (const r of rows) TABLES[t].push({ id: `new-${Math.random().toString(36).slice(2)}`, ...r });
      return json(rows);
    }
    if (method === 'DELETE') {
      TABLES[t] = applyQuery(TABLES[t] ?? [], url).length
        ? (TABLES[t] ?? []).filter((r) => !applyQuery([r], url).length)
        : TABLES[t];
      return json([]);
    }
    return json(applyQuery(TABLES[t] ?? [], url));
  }
  return json({});
});

const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:4604/', { waitUntil:'domcontentloaded' });
await page.evaluate(([k,v]) => localStorage.setItem(k,v), ['sb-demoproject-auth-token', JSON.stringify(S)]);

// ---- 1. the loading state, which was a bare spinner and a jumping layout ----
delay = 2500;
await page.goto('http://localhost:4604/', { waitUntil:'domcontentloaded' });
await page.waitForTimeout(1100);
const loadingShot = `${OUT}/premium-loading.png`;
await page.screenshot({ path: loadingShot });
const whileLoading = await page.evaluate(() => ({
  progressbars: document.querySelectorAll('[role="progressbar"]').length,
  text: document.body.innerText.replace(/\n+/g, ' | ').slice(0, 80),
  height: document.body.scrollHeight,
}));
console.log('while loading:', JSON.stringify(whileLoading));
await page.waitForTimeout(2600);
const loaded = await page.evaluate(() => ({ height: document.body.scrollHeight }));
console.log('after loading: height', loaded.height,
  `— layout shift ${Math.abs(loaded.height - whileLoading.height)}px`);

// ---- 2. the milestone: check in a habit sitting at exactly six days ----
delay = 0;
await page.goto('http://localhost:4604/', { waitUntil:'networkidle' });
await page.waitForTimeout(1200);
const before = await page.evaluate(() => document.body.innerText);
console.log('\nCold shower before:', /Cold shower/.test(before) ? (before.match(/Cold shower[\s\S]{0,40}/) || [''])[0].replace(/\n/g,' ') : 'NOT FOUND');

await page.locator('[aria-label="Check in Cold shower"]').first().click();
// Straight away: did the row acknowledge the tap before the network answered?
await page.waitForTimeout(120);
const instant = await page.evaluate(() =>
  !!document.querySelector('[aria-label="Undo Cold shower"]'));
console.log('row ticks optimistically, before the server replies:', instant);
await page.waitForTimeout(900);
const after = await page.evaluate(() => document.body.innerText);
console.log('milestone banner shown:', /A week/i.test(after) && /Kept every day it was owed/i.test(after));
console.log('  says:', (after.match(/A WEEK[\s\S]{0,60}/i) || [''])[0].replace(/\n/g, ' | '));
await page.screenshot({ path: `${OUT}/premium-milestone.png` });
const stuck = await page.evaluate(() =>
  !!document.querySelector('[aria-label="Undo Cold shower"]'));
console.log('  and stays ticked after the refetch:', stuck);
console.log('  streak now reads:',
  (await page.evaluate(() => document.body.innerText)).match(/Cold shower[\s\S]{0,24}/)?.[0].replace(/\n/g,' '));

// It must go away by itself.
await page.waitForTimeout(6200);
const later = await page.evaluate(() => document.body.innerText);
console.log('  dismisses itself:', !/Kept every day it was owed/i.test(later));

// ---- 3. an ordinary check-in must NOT celebrate ----
await page.locator('[aria-label="Check in Stretch"]').first().click();
await page.waitForTimeout(900);
const ordinary = await page.evaluate(() => document.body.innerText);
console.log('\nordinary check-in stays quiet:', !/Kept every day it was owed/i.test(ordinary));

// ---- 4. the remembered tab ----
await page.locator('text=/Shared . 2/').first().click();
await page.waitForTimeout(700);
await page.goto('http://localhost:4604/focus', { waitUntil:'networkidle' });
await page.waitForTimeout(700);
await page.goto('http://localhost:4604/', { waitUntil:'networkidle' });
await page.waitForTimeout(1200);
const stored = await page.evaluate(() => localStorage.getItem('pref.today.tab'));
console.log('\nremembered tab in storage:', stored);

console.log('\npage errors:', errors.length ? errors : 'none');
await browser.close(); server.close();
