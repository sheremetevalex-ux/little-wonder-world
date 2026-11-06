// Renders the app icon and iOS launch images from the game's own art, using Playwright.
// Dev-only: run `node tools/make-icons.mjs` with the app served on localhost:5199.
// Requires: npm i playwright (anywhere on NODE_PATH); the outputs are committed.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
mkdirSync(root + 'icons/splash', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5199/');
await page.waitForTimeout(400);

const render = (w, h, mode) => page.evaluate(async ({ w, h, mode }) => {
  const { drawCreature } = await import('/src/art/creatures.js');
  const { gloss, glow, softStar, ell } = await import('/src/core/draw.js');
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3C2E9E');
  g.addColorStop(1, '#FF9CC4');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const m = Math.min(w, h);
  for (let i = 0; i < 26; i++) {
    softStar(c, (i * 73.1 * w / 100) % w, (i * 41.3 * h / 100) % (h * 0.8), m * (0.006 + (i % 4) * 0.004), 4, 0.35);
    c.fillStyle = 'rgba(255,248,210,.8)';
    c.fill();
  }
  const r = mode === 'splash' ? m * 0.3 : mode === 'mask' ? m * 0.33 : m * 0.42;
  const cx = w / 2, cy = mode === 'splash' ? h * 0.47 : h * 0.5;
  glow(c, cx, cy, r * 1.9, '#FFE6FF', 0.5);
  c.save();
  c.translate(cx, cy + r * 0.06);
  drawCreature(c, 'moko', { R: r * 0.6, t: 0.4, eyes: mode === 'splash' ? 'closed' : 'open', mouth: 'smile', blink: 0 });
  c.restore();
  const b = c.createRadialGradient(cx - r * 0.3, cy - r * 0.38, r * 0.2, cx, cy, r);
  b.addColorStop(0, 'rgba(255,255,255,.04)');
  b.addColorStop(0.72, 'rgba(190,220,255,.1)');
  b.addColorStop(0.92, 'rgba(255,190,240,.34)');
  b.addColorStop(1, 'rgba(255,255,255,.9)');
  c.fillStyle = b;
  ell(c, cx, cy, r);
  c.fill();
  c.lineCap = 'round';
  c.lineWidth = r * 0.06;
  c.strokeStyle = 'rgba(255,255,255,.92)';
  c.beginPath();
  c.arc(cx, cy, r * 0.86, Math.PI * 1.06, Math.PI * 1.46);
  c.stroke();
  return cv.toDataURL('image/png');
}, { w, h, mode });

const save = async (file, w, h, mode) => {
  const url = await render(w, h, mode);
  writeFileSync(root + file, Buffer.from(url.split(',')[1], 'base64'));
};

await save('icons/icon-512.png', 512, 512, 'icon');
await save('icons/icon-192.png', 192, 192, 'icon');
await save('icons/apple-touch-icon.png', 180, 180, 'icon');
await save('icons/maskable-512.png', 512, 512, 'mask');

// [css width, css height, device pixel ratio]
const DEVICES = [[440, 956, 3], [430, 932, 3], [428, 926, 3], [414, 896, 3], [414, 896, 2], [402, 874, 3], [393, 852, 3], [390, 844, 3], [375, 812, 3], [375, 667, 2], [320, 568, 2], [768, 1024, 2], [810, 1080, 2], [820, 1180, 2], [834, 1194, 2], [1024, 1366, 2]];
let links = '';
for (const [w, h, r] of DEVICES) {
  for (const o of ['portrait', 'landscape']) {
    const iPad = w >= 768;
    if (!iPad && o === 'landscape') continue;
    const pw = (o === 'portrait' ? w : h) * r, ph = (o === 'portrait' ? h : w) * r;
    const file = `icons/splash/${pw}x${ph}.png`;
    await save(file, pw, ph, 'splash');
    links += `<link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: ${o})" href="${file}">\n`;
  }
}
writeFileSync(root + 'tools/startup-links.html', links);
await browser.close();
console.log('done');
