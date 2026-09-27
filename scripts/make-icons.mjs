/**
 * Draw the StreakMates seal, and every icon cut from it.
 *
 *   npm i --no-save playwright     # once; it is not a dependency of the app
 *   node scripts/make-icons.mjs
 *
 * NavySum apps each carry a seal: a small square stamp in the accent colour
 * that marks something complete. Parables' says 寓話, "parable". StreakMates'
 * says 連 — a character that means both "in a row" (連続, a streak) and "to
 * bring someone along" (連れ, a companion), which is the app in one mark.
 *
 * The seal is drawn rather than kept as a master image, so it has one source:
 * the glyph comes from Shippori Mincho, the NavySum CJK face, and the grain is
 * seeded, so running this twice produces the same files byte for byte.
 *
 * WHAT EACH OUTPUT IS FOR
 *
 *   seal.png          The in-app stamp, on transparency. The paper themes show
 *                     it as drawn; LifeOS tints it, which keeps the grain.
 *   icon.png          The seal on washi, full bleed: the OS rounds the corners.
 *   splash-icon.png   The seal alone; app.json sets the paper colour behind it.
 *   favicon.png       The seal, small enough for a browser tab.
 *   android-icon-*    An adaptive icon is two layers the launcher moves apart,
 *                     so the foreground is the seal alone, inside the middle
 *                     66% that survives the crop, and the background is paper.
 *   monochrome,       Android keeps only the alpha channel and tints it, so
 *   notification      these are clean white silhouettes without the grain,
 *                     which would read as noise at 24dp.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const ASSETS = path.join(ROOT, 'assets');
const FONT = path.join(
  ROOT,
  'node_modules/@expo-google-fonts/shippori-mincho/800ExtraBold/ShipporiMincho_800ExtraBold.ttf',
);

/** Washi's seal and paper, from src/theme/palette.ts. */
const SEAL = '#B2382A';
const PAPER = '#F3EDE2';

const browser = await chromium.launch();
const page = await browser.newPage();

const font = fs.readFileSync(FONT).toString('base64');
const washi = fs.readFileSync(path.join(ASSETS, 'washi.png')).toString('base64');
await page.setContent(`<!doctype html><style>
  @font-face { font-family: Seal; src: url(data:font/ttf;base64,${font}); }
</style><body></body>`);
await page.evaluate(() => document.fonts.load('800 100px Seal'));

/**
 * Renders one PNG in the page and returns it as a Buffer.
 *
 *   size       the canvas, in pixels
 *   scale      the seal's share of the canvas
 *   colour     the stamp's ink
 *   grain      speckle it like a real stamp, or keep it clean
 *   ground     'paper' draws washi behind it; null leaves transparency
 */
async function render({ size, scale = 1, colour = SEAL, grain = true, ground = null }) {
  const dataUrl = await page.evaluate(
    async ({ size, scale, colour, grain, ground, washi, paper }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');

      // A seeded generator, so the grain is identical on every run.
      let seed = 0x9e3779b9;
      const random = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

      if (ground === 'paper') {
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, size, size);
        const tile = new Image();
        tile.src = `data:image/png;base64,${washi}`;
        await tile.decode();
        ctx.fillStyle = ctx.createPattern(tile, 'repeat');
        ctx.fillRect(0, 0, size, size);
      }

      // Paper alone, for the layer an adaptive icon draws behind the seal.
      const s = Math.round(size * scale);
      if (s === 0) return canvas.toDataURL('image/png');

      // The stamp, drawn on its own layer so knocking out the glyph and the
      // grain never cuts through the paper behind it.
      const layer = document.createElement('canvas');
      layer.width = layer.height = s;
      const l = layer.getContext('2d');

      const rounded = (x, y, w, h, r) => {
        l.beginPath();
        l.moveTo(x + r, y);
        l.arcTo(x + w, y, x + w, y + h, r);
        l.arcTo(x + w, y + h, x, y + h, r);
        l.arcTo(x, y + h, x, y, r);
        l.arcTo(x, y, x + w, y, r);
        l.closePath();
      };

      const inset = s * 0.03;
      l.fillStyle = colour;
      rounded(inset, inset, s - inset * 2, s - inset * 2, s * 0.1);
      l.fill();

      // Everything below is cut out of the ink, so the paper shows through.
      l.globalCompositeOperation = 'destination-out';

      // The inner frame: a fine line just inside the edge, as a carved seal has.
      const frame = s * 0.085;
      l.lineWidth = Math.max(1, s * 0.02);
      l.strokeStyle = '#000';
      rounded(frame, frame, s - frame * 2, s - frame * 2, s * 0.055);
      l.stroke();

      // The glyph, centred on its ink rather than its em box: a Mincho glyph
      // sits high in its box, and centring the box leaves it visibly low.
      l.fillStyle = '#000';
      l.font = `800 ${Math.round(s * 0.66)}px Seal`;
      l.textAlign = 'left';
      l.textBaseline = 'alphabetic';
      const m = l.measureText('連');
      const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      l.fillText(
        '連',
        (s - w) / 2 + m.actualBoundingBoxLeft,
        (s - h) / 2 + m.actualBoundingBoxAscent,
      );

      if (grain) {
        // Ink that did not take: small flecks everywhere, more of them towards
        // the edge, where a stamp presses least evenly.
        const flecks = Math.round(s * s * 0.009);
        for (let i = 0; i < flecks; i++) {
          const x = random() * s;
          const y = random() * s;
          const edge = Math.min(x, y, s - x, s - y) / (s / 2);
          if (random() < edge * 0.6) continue;
          // Mostly fine grain, with the odd larger fleck.
          const r = s * (random() < 0.9 ? 0.0015 + random() * 0.0025 : 0.004 + random() * 0.003);
          l.beginPath();
          l.ellipse(x, y, r, r * (0.5 + random() * 0.6), random() * Math.PI, 0, Math.PI * 2);
          l.fill();
        }
      }

      const offset = Math.round((size - s) / 2);
      ctx.drawImage(layer, offset, offset);
      return canvas.toDataURL('image/png');
    },
    { size, scale, colour, grain, ground, washi, paper: PAPER },
  );
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function write(name, options) {
  const png = await render(options);
  fs.writeFileSync(path.join(ASSETS, name), png);
  console.log(`  ${name.padEnd(30)} ${options.size}x${options.size}`);
}

await write('seal.png', { size: 256 });
await write('icon.png', { size: 1024, scale: 0.58, ground: 'paper' });
await write('splash-icon.png', { size: 512 });
await write('favicon.png', { size: 64, grain: false });
await write('android-icon-foreground.png', { size: 432, scale: 0.5 });
await write('android-icon-background.png', { size: 432, scale: 0, ground: 'paper' });
await write('android-icon-monochrome.png', { size: 432, scale: 0.5, colour: '#FFFFFF', grain: false });
await write('notification-icon.png', { size: 96, scale: 0.92, colour: '#FFFFFF', grain: false });

await browser.close();
