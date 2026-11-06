// Slime table. A real little simulation: a height field for the gloss, plus a
// displaced texture map so colours and glitter stretch and marble under the finger.
// Pixel-lit, so it shines as you dent it.
import { app, hint, haptic, Btn } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, ell, rr, rand, pick, dist, clamp, clay, light, dark, gloss, vgrad, sprite, softStar, TAU, sparkleShape, heart } from '../core/draw.js';
import { softBack } from '../art/world.js';

const JARS = [
  { col: '#FF6FAF', rgb: [255, 111, 175] }, { col: '#FFC233', rgb: [255, 194, 51] }, { col: '#6FE36F', rgb: [111, 227, 111] },
  { col: '#3FC9F5', rgb: [63, 201, 245] }, { col: '#9F70FF', rgb: [159, 112, 255] }, { col: '#FFFFFF', rgb: [250, 246, 255] }
];

export const slime = {
  tint: '#9FEBC8',

  enter() {
    this.t = 0;
    this.layout();
    this.initSim();
    this.drops = [];
    this.lastSq = 0;
    this.lastBlup = 0;
    this.active = new Map();
    this.played = 0;
    music.play('dream');
    if (!save.data.seen.slime) {
      hint.set({ from: [this.W * 0.3, this.top + this.simH * 0.3], to: [this.W * 0.7, this.top + this.simH * 0.6], delay: 1 });
    }
  },
  exit() { this.cv = null; this.shadow = null; },
  resize() { this.layout(); this.shadow = null; this.initSim(); },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.top = Math.max(app.safeTop, 6) + 74;
    this.bottom = H - 86 - app.safeBottom;
    this.simX = 12;
    this.simW = W - 24;
    this.simH = this.bottom - this.top;
    this.jars = JARS.map((j, i) => ({ ...j, x: W / 2 + (i - 2.5) * Math.min(58, (W - 20) / 6), y: H - 46 - app.safeBottom * 0.7, sq: 1 }));
  },

  initSim() {
    // Resolution is a balance: enough for smooth marbling, still 60 fps on old phones
    const scale = app.quality < 0.8 ? 4.4 : 3.3;
    const gw = this.gw = Math.round(this.simW / scale), gh = this.gh = Math.round(this.simH / scale);
    this.gs = this.simW / gw;
    const n = gw * gh;
    const seed = rand(6.28);
    const [A, B] = pick([[[255, 120, 190], [186, 130, 255]], [[92, 226, 214], [120, 170, 255]], [[255, 170, 120], [255, 110, 170]], [[150, 110, 255], [70, 150, 245]], [[150, 240, 130], [70, 215, 190]]]);
    this.h = new Float32Array(n);      // height of the surface
    this.v = new Float32Array(n);      // its velocity
    this.u = new Float32Array(n);      // where this cell's dye came from (x)
    this.w = new Float32Array(n);      // ...and (y)
    this.tex = new Uint8ClampedArray(n * 3); // dye colours, in texture space
    this.spark = new Float32Array(n);  // glitter flecks
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = x + y * gw;
        this.u[i] = x;
        this.w[i] = y;
        // Soft marbling so that the very first stretch already looks pretty
        const wx = Math.sin(y * 0.041 + 0.7 * Math.sin(x * 0.033 + seed));
        const wy = Math.sin(x * 0.037 + 1.1 * Math.sin(y * 0.029 + seed * 2));
        const k = 0.5 + 0.5 * Math.sin((x + wx * 26) * 0.055 + (y + wy * 22) * 0.043 + seed);
        const m = k * k * (3 - 2 * k);
        this.tex[i * 3] = A[0] + (B[0] - A[0]) * m;
        this.tex[i * 3 + 1] = A[1] + (B[1] - A[1]) * m;
        this.tex[i * 3 + 2] = A[2] + (B[2] - A[2]) * m;
        this.spark[i] = Math.random() < 0.016 ? 1 + Math.random() : 0;
      }
    }
    this.cv = document.createElement('canvas');
    this.cv.width = gw;
    this.cv.height = gh;
    this.cx2 = this.cv.getContext('2d');
    this.img = this.cx2.createImageData(gw, gh);
    this.mask = new Float32Array(n);
    this.bn = new Float32Array(n);
    const rx = gw / 2, ry = gh / 2;
    const dd = new Float32Array(n);
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const nx = Math.abs(x - rx + 0.5) / rx, ny = Math.abs(y - ry + 0.5) / ry;
        const d = Math.pow(Math.pow(nx, 4.6) + Math.pow(ny, 4.6), 1 / 4.6);
        dd[x + y * gw] = d;
        this.mask[x + y * gw] = clamp((1 - d) * 30);
      }
    }
    // Slope of the rounded edge, along the light direction
    const P0 = (d) => { const e = clamp((1 - d) / 0.2); return Math.sqrt(1 - (1 - e) * (1 - e)); };
    for (let y = 1; y < gh - 1; y++) {
      for (let x = 1; x < gw - 1; x++) {
        const i = x + y * gw;
        this.bn[i] = ((P0(dd[i + 1]) - P0(dd[i - 1])) + (P0(dd[i + gw]) - P0(dd[i - gw]))) * 7;
      }
    }
  },

  paintDye(px, py, rgb, radius) {
    const { gw, gh, tex, u, w } = this;
    const ix = Math.round((px - this.simX) / this.gs), iy = Math.round((py - this.top) / this.gs);
    if (ix < 0 || iy < 0 || ix >= gw || iy >= gh) return;
    const i0 = ix + iy * gw, tx = u[i0], ty = w[i0];
    const R = radius / this.gs, R2 = R * R;
    const minX = Math.max(0, Math.floor(tx - R)), maxX = Math.min(gw - 1, Math.ceil(tx + R));
    const minY = Math.max(0, Math.floor(ty - R)), maxY = Math.min(gh - 1, Math.ceil(ty + R));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - tx, dy = y - ty, d = dx * dx + dy * dy;
        if (d > R2) continue;
        const a = (1 - d / R2) * 2.2;
        const k = Math.min(1, a), i = (x + y * gw) * 3;
        tex[i] += (rgb[0] - tex[i]) * k;
        tex[i + 1] += (rgb[1] - tex[i + 1]) * k;
        tex[i + 2] += (rgb[2] - tex[i + 2]) * k;
      }
    }
  },

  push(p, dx, dy, strength = 1) {
    const { gw, gh, h, v, u, w } = this;
    const R = 13 * (390 / this.simW + 0.3) * (1 + (p.force || 0));
    const fx0 = (p.x - this.simX) / this.gs, fy0 = (p.y - this.top) / this.gs;
    const minX = Math.max(1, Math.floor(fx0 - R)), maxX = Math.min(gw - 2, Math.ceil(fx0 + R));
    const minY = Math.max(1, Math.floor(fy0 - R)), maxY = Math.min(gh - 2, Math.ceil(fy0 + R));
    const R2 = R * R;
    const gdx = dx / this.gs, gdy = dy / this.gs;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const ax = x - fx0, ay = y - fy0, d = ax * ax + ay * ay;
        if (d > R2) continue;
        const f = 1 - d / R2, ff = f * f;
        const i = x + y * gw;
        // Dent under the finger, a rim of pushed-up slime round it
        v[i] -= ff * 0.13 * strength;
        // The dye map follows the finger: the marbling you actually see
        const uu = gdx * ff, vv = gdy * ff;
        if (uu || vv) {
          u[i] = clamp(u[i] - uu, 0, gw - 1);
          w[i] = clamp(w[i] - vv, 0, gh - 1);
        }
      }
    }
  },

  update(dt) {
    this.t += dt;
    const { gw, gh, h, v } = this;
    // Step the height field: thick, slow, gooey waves
    const sub = 2, c2 = 0.13, damp = 0.962, pull = 0.003;
    for (let s = 0; s < sub; s++) {
      for (let y = 1; y < gh - 1; y++) {
        let i = 1 + y * gw;
        for (let x = 1; x < gw - 1; x++, i++) {
          v[i] += ((h[i - 1] + h[i + 1] + h[i - gw] + h[i + gw]) * 0.25 - h[i]) * c2 * 4 - h[i] * pull;
          v[i] *= damp;
        }
      }
      for (let i = 0; i < h.length; i++) h[i] += v[i] * 0.5;
    }
    // Falling colour drops
    for (const dp of this.drops) {
      dp.vy += 900 * dt;
      dp.y += dp.vy * dt;
      if (dp.y >= dp.ty) {
        dp.done = true;
        this.paintDye(dp.x, dp.ty, dp.rgb, 34);
        this.push({ x: dp.x, y: dp.ty, force: 0.4 }, 0, 0, 3.4);
        audio.sfx('blup', { rate: rand(0.8, 1.3), vol: 0.9 });
        audio.sfx('squish', { rate: rand(0.9, 1.1), vol: 0.6 });
        audio.note('kalimba', penta(Math.floor(rand(-2, 5))), { vol: 0.3 });
        haptic();
      }
    }
    this.drops = this.drops.filter((d) => !d.done);
    if (this.active.size) {
      this.played += dt;
      if (this.played > 35 && this.played - dt <= 35) save.earnStar();
    }
    // A resting finger keeps pressing in
    for (const a of this.active.values()) {
      a.force = Math.min(1.2, (app.t - a.t0) * 0.5);
      this.push(a, 0, 0, 0.16 + a.force * 0.1);
    }
    this.shade();
  },

  shade() {
    const { gw, gh, h, u, w, tex, spark, mask, img, bn } = this;
    const d = img.data;
    const t = this.t;
    for (let y = 1; y < gh - 1; y++) {
      let i = 1 + y * gw, o = i * 4;
      for (let x = 1; x < gw - 1; x++, i++, o += 4) {
        const m = mask[i];
        if (m <= 0) { d[o + 3] = 0; continue; }
        const ti = (u[i] | 0) + (w[i] | 0) * gw, t3 = ti * 3;
        // Light comes from the upper left; the normal is pillow shape + dents
        const hx = h[i + 1] - h[i - 1], hy = h[i + gw] - h[i - gw];
        let dot = (hx + hy) * 0.9 + bn[i] * 0.3;
        if (dot > 1) dot = 1; else if (dot < -1) dot = -1;
        // Body light stays gentle so that colours never turn black or white...
        const shade = 1 + dot * (dot > 0 ? 0.14 : 0.32);
        // ...only the crest of each wave catches a wet highlight...
        const s0 = dot > 0.34 ? (dot - 0.34) / 0.66 : 0;
        let spec = s0 * s0 * 235;
        // ...and a soft window reflection bends as the surface moves. That's the shine.
        const rx0 = x / gw + hx * 0.16, ry0 = y / gh + hy * 0.12;
        const e1x = (rx0 - 0.3) / 0.25, e1y = (ry0 - 0.12) / 0.04;
        const e1 = e1x * e1x + e1y * e1y;
        if (e1 < 1) spec += (1 - e1) * (1 - e1) * 200;
        const e2x = (rx0 - 0.76) / 0.11, e2y = (ry0 - 0.2) / 0.02;
        const e2 = e2x * e2x + e2y * e2y;
        if (e2 < 1) spec += (1 - e2) * 120;
        let r = tex[t3] * shade + spec, g = tex[t3 + 1] * shade + spec, b = tex[t3 + 2] * shade + spec;
        const sp = spark[ti];
        if (sp > 0) {
          const tw = 0.5 + 0.5 * Math.sin(t * 3 + sp * 30 + dot * 9);
          const gold = sp > 1.5;
          r += ((255) - r) * tw * 0.85;
          g += ((gold ? 216 : 255) - g) * tw * 0.85;
          b += ((gold ? 120 : 255) - b) * tw * 0.85;
        }
        d[o] = r; d[o + 1] = g; d[o + 2] = b;
        d[o + 3] = 255 * m;
      }
    }
    this.cx2.putImageData(img, 0, 0);
  },

  draw(c) {
    const W = this.W, H = this.H;
    const back = softBack('slime', W, H, '#FFF0DC', '#FFD8E6', (x) => {
      // A cosy table top
      x.fillStyle = 'rgba(255,255,255,.55)';
      rr(x, 4, this.top - 10, W - 8, this.simH + 20, 40);
      x.fill();
      x.strokeStyle = 'rgba(190,140,190,.25)';
      x.lineWidth = 3;
      x.stroke();
    });
    c.drawImage(back.cv, 0, 0, W, H);
    // Soft contact shadow: the same silhouette, in plum, slightly lower
    c.save();
    if (!this.shadow) {
      const sc = document.createElement('canvas');
      sc.width = this.gw;
      sc.height = this.gh;
      const sx = sc.getContext('2d'), im = sx.createImageData(this.gw, this.gh);
      for (let i = 0; i < this.mask.length; i++) {
        im.data[i * 4] = 80; im.data[i * 4 + 1] = 40; im.data[i * 4 + 2] = 120; im.data[i * 4 + 3] = this.mask[i] * 255;
      }
      sx.putImageData(im, 0, 0);
      this.shadow = sc;
    }
    c.globalAlpha = 0.28;
    c.imageSmoothingEnabled = true;
    c.drawImage(this.shadow, this.simX + 1, this.top + 8, this.simW, this.simH);
    c.restore();
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(this.cv, this.simX, this.top, this.simW, this.simH);

    // Paint jars
    for (const j of this.jars) {
      const bob = Math.sin(this.t * 2 + j.x) * 1.4;
      c.save();
      c.translate(j.x, j.y + bob);
      c.fillStyle = 'rgba(70,40,110,.16)';
      ell(c, 0, 24, 24, 6);
      c.fill();
      c.fillStyle = clay(c, 0, 4, 24, j.col);
      rr(c, -22, -16, 44, 42, 14);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.72)';
      rr(c, -22, -20, 44, 12, 6);
      c.fill();
      gloss(c, -9, -3, 7, 12, 0.72, 0.1);
      c.restore();
    }
    // Falling drops
    for (const dp of this.drops) {
      c.fillStyle = clay(c, dp.x, dp.y, 17, dp.col);
      ell(c, dp.x, dp.y, 15, 18);
      c.fill();
      gloss(c, dp.x - 5, dp.y - 6, 5, 4, 0.8);
    }
  },

  down(p) {
    for (const j of this.jars) {
      if (dist(p.x, p.y, j.x, j.y) < 32) {
        this.drops.push({ x: j.x + rand(-40, 40) + (this.W / 2 - j.x) * 0.55, y: j.y - 34, ty: rand(this.top + this.simH * 0.25, this.top + this.simH * 0.82), vy: -520, col: j.col, rgb: j.rgb });
        audio.note('marimba', penta(this.jars.indexOf(j)), { vol: 0.6 });
        audio.sfx('tap');
        save.data.seen.slime = 1;
        hint.clear();
        return;
      }
    }
    if (p.y < this.top - 4 || p.y > this.bottom + 4) return;
    p.t0 = app.t;
    this.active.set(p.id, p);
    this.push(p, 0, 0, 2.4);
    audio.sfx('squish2', { rate: rand(0.85, 1.25), vol: 0.75 });
    audio.sfx('blup', { rate: rand(0.75, 1.1), vol: 0.5 });
    haptic();
    save.data.seen.slime = 1;
    hint.clear();
  },

  move(p) {
    if (!this.active.has(p.id)) return;
    const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy);
    if (d < 0.1) return;
    // Interpolate so that a fast swipe leaves one smooth furrow
    const steps = Math.ceil(d / 7);
    for (let i = 1; i <= steps; i++) {
      this.push({ x: p.px + (dx * i) / steps, y: p.py + (dy * i) / steps, force: p.force }, dx / steps * 1.5, dy / steps * 1.5, 0.75 / Math.sqrt(steps));
    }
    const now = performance.now();
    if (now - this.lastSq > 95 + 60 * Math.random() && d > 1.2) {
      this.lastSq = now;
      const k = clamp(d / 22);
      audio.sfx(Math.random() < 0.5 ? 'squish' : 'squish2', { rate: 0.75 + k * 0.5 + rand(-0.1, 0.1), vol: 0.32 + k * 0.42, pan: (p.x / this.W - 0.5) * 0.6, gap: 40, wet: 0.2 });
    }
    if (now - this.lastBlup > 200 + 300 * Math.random() && d > 2) {
      this.lastBlup = now;
      audio.sfx(Math.random() < 0.6 ? 'blup' : 'plip', { rate: rand(0.7, 1.6), vol: 0.3, gap: 60 });
    }
  },

  up(p) {
    if (!this.active.has(p.id)) return;
    this.active.delete(p.id);
    // Letting go after a long press: a thick, satisfying bloop
    const held = app.t - p.t0;
    const strong = held > 0.4 && p.moved < 30;
    this.push(p, 0, 0, strong ? -3.4 : -0.9);
    if (strong) {
      audio.sfx('blup', { rate: 0.68, vol: 0.95 });
      audio.note('kalimba', penta(Math.floor(rand(-3, 2))), { vol: 0.25 });
      fx.bubbles(p.x, p.y, 3);
      haptic();
    }
  }
};
