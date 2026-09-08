import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { TABLES, IDS } from './fixtures.mjs';

const DIST = '/home/user/Habit-Tracking-with-Friends/dist-demo';
const types = {'.js':'text/javascript','.html':'text/html','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.json':'application/json'};
const server = http.createServer((req,res)=>{
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST,'index.html');
  res.setHeader('Content-Type', types[path.extname(f)] ?? 'application/octet-stream');
  res.end(fs.readFileSync(f));
});
await new Promise(r=>server.listen(4602,r));

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now()/1000)+3600;
const SESSION = { access_token:`${b64({alg:'HS256'})}.${b64({sub:IDS.ME,exp})}.s`, refresh_token:'r',
  token_type:'bearer', expires_in:3600, expires_at:exp,
  user:{ id:IDS.ME, aud:'authenticated', role:'authenticated', email:'c@e.com',
         app_metadata:{}, user_metadata:{}, created_at:new Date().toISOString() } };

function applyQuery(rows,url){const p=url.searchParams;let out=[...rows];
  for(const [k,raw] of p.entries()){ if(['select','order','limit','offset','on_conflict'].includes(k))continue;
    const [op,...rest]=raw.split('.'); const v=rest.join('.');
    if(op==='eq') out=out.filter(r=>String(r[k])===v);
    else if(op==='is') out=out.filter(r=> v==='null'? r[k]==null : r[k]!=null);
    else if(op==='in'){const s=new Set(v.replace(/^\(|\)$/g,'').split(',').map(x=>x.replace(/^"|"$/g,'')));out=out.filter(r=>s.has(String(r[k])));}
    else if(op==='gte') out=out.filter(r=>String(r[k])>=v);
    else if(op==='lte') out=out.filter(r=>String(r[k])<=v);
  } return out; }

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, hasTouch:true });
let refetches = 0;
await ctx.route('**/*.supabase.co/**', async route => {
  const url = new URL(route.request().url());
  const json = b => route.fulfill({ status:200, contentType:'application/json',
    headers:{'access-control-allow-origin':'*'}, body: JSON.stringify(b) });
  if (url.pathname.startsWith('/auth/v1/token')) return json(SESSION);
  if (url.pathname.startsWith('/auth/v1/user')) return json(SESSION.user);
  if (url.pathname.startsWith('/rest/v1/rpc/')) return json(true);
  if (url.pathname.startsWith('/rest/v1/')) {
    const t = url.pathname.replace('/rest/v1/','').split('?')[0];
    refetches++;
    if (route.request().method() !== 'GET') return json([]);
    return json(applyQuery(TABLES[t] ?? [], url));
  }
  return json({});
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:4602/', { waitUntil:'domcontentloaded' });
await page.evaluate(([k,v]) => localStorage.setItem(k,v), ['sb-demoproject-auth-token', JSON.stringify(SESSION)]);
await page.goto('http://localhost:4602/', { waitUntil:'networkidle' });
await page.waitForTimeout(1200);

const row = page.locator('[aria-label="Open Morning run"]').first();
console.log('habit row found:', await row.count() > 0);
console.log('accessibility hint:', await row.getAttribute('aria-describedby') ? '(described)' : await row.evaluate(e => e.getAttribute('aria-roledescription') || e.title || '(none exposed on web)'));

// A real press-and-hold: press, wait past delayLongPress, release.
const box = await row.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(600);
await page.mouse.up();
await page.waitForTimeout(500);

const text = await page.evaluate(() => document.body.innerText);
const opened = /Morning run/.test(text) && /Archive/.test(text) && /Off Today/.test(text);
console.log('long press opened the sheet:', opened);
console.log('sheet offers:', ['Open','Edit','Archive'].filter(a => new RegExp(`\\b${a}\\b`).test(text)).join(', '));
console.log('sheet does NOT offer Delete:', !/Delete/.test(text));
await page.screenshot({ path: '/tmp/screens/gesture-sheet.png' });

// Dismiss, and confirm a plain tap still navigates rather than opening it.
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(900);
console.log('a normal tap still opens the habit:', page.url().includes('/habit/'));

// ---- task options: the visible route and the gesture ----
await page.goto('http://localhost:4602/focus', { waitUntil:'networkidle' });
await page.waitForTimeout(1200);

const more = page.locator('[aria-label="Options for Draft the launch post"]').first();
console.log('\nvisible options button on a task:', await more.count() > 0);
const mbox = await more.boundingBox();
console.log('  its size:', mbox && `${Math.round(mbox.width)}x${Math.round(mbox.height)}`);

await more.click();
await page.waitForTimeout(500);
let t = await page.evaluate(() => document.body.innerText);
console.log('  sheet offers:', ['Rename','Delete'].filter(a => new RegExp(`\\b${a}\\b`).test(t)).join(', '));

// Rename reuses the composer rather than opening another screen.
await page.locator('text=Rename').first().click();
await page.waitForTimeout(600);
t = await page.evaluate(() => document.body.innerText);
const inputValue = await page.evaluate(() => {
  const i = [...document.querySelectorAll('input')].find(x => x.value);
  return i ? i.value : null;
});
console.log('  rename opens the composer:', /RENAME TASK/i.test(t));
console.log('  prefilled with the task name:', inputValue);
console.log('  and offers Save:', /save/i.test(t));

// Long press does the same thing.
await page.locator('text=Cancel').first().click();
await page.waitForTimeout(400);
const taskRow = page.locator(`[aria-label="Focus on Reply to the physio"]`).first();
const rbox = await taskRow.boundingBox();
await page.mouse.move(rbox.x + rbox.width/2, rbox.y + rbox.height/2);
await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up();
await page.waitForTimeout(500);
t = await page.evaluate(() => document.body.innerText);
console.log('  long press opens the same sheet:', /Rename/.test(t) && /Delete/.test(t));
await page.screenshot({ path: `${process.env.OUT || '/tmp/screens'}/task-sheet.png` });

console.log('page errors:', errors.length ? errors : 'none');
await browser.close(); server.close();
