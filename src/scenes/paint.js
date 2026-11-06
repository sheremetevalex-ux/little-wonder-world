// Light painting: every stroke glows, mirrors itself like butterfly wings and plays
// harp notes as it goes. A messy scribble still comes out beautiful, which is the point.
import { app, hint, wait, tween, Btn, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, clay, light, dark, gloss, alpha, vgrad, glow, TAU, softStar, heart, sparkleShape, sprite, grain } from '../core/draw.js';

const COLORS = ['#FF5C9A', '#FF8A3D', '#FFD93D', '#4FE38A', '#34D5FF', '#6E8BFF', '#B46EFF', 'rainbow'];
const RAINBOW = ['#FF5C9A', '#FF8A3D', '#FFD93D', '#4FE38A', '#34D5FF', '#6E8BFF', '#B46EFF'];
const BRUSHES = ['glow', 'star', 'heart', 'ribbon'];

export const paint = {
  tint: '#3A2E9A',

  enter() {
    this.t = 0;
    this.color = 'rainbow';
    this.brush = 'glow';
    this.mirror = 1; // 0 off, 1 butterfly, 2 kaleidoscope
    this.hue = 0;
    this.stars = [];
    this.dirty = false;
    this.fade = 1;
    this.layout();
    this.makeLayer();
    this.restore();
    music.play('dream');
    if (!save.data.seen.paint) {
      hint.set({ from: [this.W * 0.3, this.areaH * 0.35], to: [this.W * 0.72, this.areaH * 0.7], delay: 1 });
    }
  },

  exit() {
    this.store();
    this.cv = null;
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.trayH = 118 + app.safeBottom * 0.7;
    this.areaH = H - this.trayH;
    this.k = Math.min(app.pr * app.scale, 2);
    this.makeButtons();
  },
  resize() {
    const old = this.cv;
    this.layout();
    this.makeLayer();
    if (old) this.x.drawImage(old, 0, 0, old.width / this.k, old.height / this.k);
  },

  makeLayer() {
    const cv = this.cv = document.createElement('canvas');
    cv.width = Math.ceil(this.W * this.k);
    cv.height = Math.ceil(this.H * this.k);
    this.x = cv.getContext('2d');
    this.x.scale(this.k, this.k);
  },

  restore() {
    const data = save.data.paint;
    if (!data) return;
    const im = new Image();
    im.onload = () => {
      if (!this.x) return;
      this.x.drawImage(im, 0, 0, this.W, this.H);
      this.dirty = true;
    };
    im.src = data;
  },

  snapshot(w, h, q) {
    const c2 = document.createElement('canvas');
    c2.width = w;
    c2.height = h;
    const x = c2.getContext('2d');
    x.drawImage(this.back().cv, 0, 0, w, h);
    x.globalCompositeOperation = 'lighter';
    x.drawImage(this.cv, 0, 0, w, h);
    return c2.toDataURL('image/jpeg', q);
  },

  store() {
    if (!this.dirty || !this.cv) { save.data.paint = null; save.touch(); return; }
    try {
      // The canvas is kept on a transparent layer, so pasting it back stays additive-ish
      const w = 300, h = Math.round((300 * this.H) / this.W);
      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const x = c2.getContext('2d');
      x.drawImage(this.cv, 0, 0, w, h);
      const url = c2.toDataURL('image/png');
      save.data.paint = url.length < 600000 ? url : null;
      save.touch();
    } catch (e) {}
  },

  makeButtons() {
    const W = this.W;
    const y0 = this.H - this.trayH + 34;
    const n = BRUSHES.length;
    const gap = Math.min(62, (W - 20) / 6.2);
    const left = W / 2 - gap * 2.5;
    this.buttons = BRUSHES.map((b, i) => new Btn({
      x: left + i * gap, y: y0, r: 24, slop: 6,
      paint: (c, r) => {
        const on = this.brush === b;
        c.fillStyle = on ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.18)';
        ell(c, 0, 0, r);
        c.fill();
        const col = on ? '#6E4BE0' : '#fff';
        c.strokeStyle = col;
        c.fillStyle = col;
        if (b === 'glow') {
          c.lineWidth = 6;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-12, 7);
          c.bezierCurveTo(-4, -14, 4, 14, 12, -7);
          c.stroke();
        } else if (b === 'star') {
          softStar(c, 0, 0, 14);
          c.fill();
        } else if (b === 'heart') {
          heart(c, 0, -1, 12);
          c.fill();
        } else {
          c.lineWidth = 2.6;
          c.lineCap = 'round';
          for (const dy of [-6, 0, 6]) {
            c.beginPath();
            c.moveTo(-13, dy + 3);
            c.quadraticCurveTo(0, dy - 7, 13, dy + 3);
            c.stroke();
          }
        }
      },
      tap: () => { this.brush = b; audio.note('kalimba', penta(i + 3), { vol: 0.55 }); }
    }));
    this.buttons.push(new Btn({
      x: left + n * gap, y: y0, r: 24, slop: 6,
      paint: (c, r) => {
        c.fillStyle = this.mirror ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.18)';
        ell(c, 0, 0, r);
        c.fill();
        // Butterfly: one, or a 4-way flower for kaleidoscope
        const col = this.mirror ? '#E8559C' : '#fff';
        c.fillStyle = col;
        if (this.mirror === 2) {
          for (let i = 0; i < 4; i++) {
            c.rotate(Math.PI / 2);
            ell(c, 0, -8, 5.6, 8);
            c.fill();
          }
        } else {
          for (const k of [-1, 1]) {
            ell(c, k * 7, -5, 6.6, 7.6, k * 0.3);
            c.fill();
            ell(c, k * 5.4, 7, 4.8, 5.4);
            c.fill();
          }
          c.fillStyle = this.mirror ? '#6E4BE0' : '#fff';
          rr(c, -1.5, -8, 3, 17, 1.5);
          c.fill();
        }
      },
      tap: () => {
        this.mirror = (this.mirror + 1) % 3;
        audio.sparkle(this.mirror * 2, 3, 0.35);
      }
    }));
    this.buttons.push(new Btn({
      x: left + (n + 1) * gap, y: y0, r: 24, slop: 6,
      paint: (c, r) => {
        candy(c, r * 0.96, P.teal);
        c.fillStyle = '#fff';
        rr(c, -11, -14, 22, 28, 4);
        c.fill();
        c.fillStyle = P.teal;
        softStar(c, 0, 0, 7);
        c.fill();
      },
      tap: () => this.newPage()
    }));
    const cy = this.H - this.trayH + 86;
    const cg = Math.min(46, (W - 16) / COLORS.length);
    this.swatches = COLORS.map((col, i) => ({ col, x: W / 2 + (i - (COLORS.length - 1) / 2) * cg, y: cy }));
  },

  newPage() {
    if (this.dirty) {
      try { save.addPhoto(this.snapshot(240, Math.round(240 * Math.min(1.25, this.H / this.W)), 0.72)); } catch (e) {}
    }
    audio.sfx('whoosh');
    audio.sparkle(0, 5, 0.3);
    // A comet sweeps the old page into the album
    this.comet = { x: -40 };
    tween(this.comet, { x: this.W + 60 }, 0.55, {
      ease: E.io, done: () => {
        this.comet = null;
      }
    });
    wait(0.26, () => {
      this.x.clearRect(0, 0, this.W, this.H);
      this.stars.length = 0;
      this.dirty = false;
      save.data.paint = null;
      save.touch();
    });
    if (this.dirty) save.earnStar();
  },

  back() {
    return sprite(`paintback:${this.W | 0}:${this.H | 0}`, this.W, this.H, (c) => {
      c.fillStyle = vgrad(c, 0, this.H, '#120F3F', '#2B2070', '#46298F');
      c.fillRect(0, 0, this.W, this.H);
      for (let i = 0; i < 70; i++) {
        c.fillStyle = `rgba(255,255,255,${0.1 + (i % 5) / 18})`;
        ell(c, (i * 97.7) % this.W, (i * 57.3) % this.H, 0.6 + (i % 3) * 0.5);
        c.fill();
      }
      grain(c, this.W, this.H, 0.05);
    }, 2);
  },

  mirrored(x, y, fn) {
    fn(x, y);
    const W = this.W, A = this.areaH;
    if (this.mirror >= 1) fn(W - x, y);
    if (this.mirror === 2) {
      fn(x, A - y);
      fn(W - x, A - y);
    }
  },

  currentColor() {
    if (this.color === 'rainbow') return RAINBOW[Math.floor(this.hue) % RAINBOW.length];
    return this.color;
  },

  stroke(p, x, y, x0, y0) {
    const d = dist(x, y, x0, y0);
    if (d < 0.5) return;
    this.hue += d * 0.018;
    const ctx = this.x, col = this.currentColor();
    p.acc = (p.acc || 0) + d;
    this.dirty = true;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const seg = (ax, ay, bx, by) => {
      if (this.brush === 'glow') {
        ctx.strokeStyle = alpha(col, 0.09);
        ctx.lineWidth = 34;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.strokeStyle = alpha(col, 0.3);
        ctx.lineWidth = 16;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.strokeStyle = alpha(light(col, 0.5), 0.9);
        ctx.lineWidth = 5.5;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      } else if (this.brush === 'ribbon') {
        const nx = -(by - ay) / (d || 1), ny = (bx - ax) / (d || 1);
        for (const [off, w] of [[-14, 2.5], [-7, 3], [0, 3.6], [7, 3], [14, 2.5]]) {
          const wav = Math.sin((p.len || 0) * 0.04 + off) * 6;
          ctx.strokeStyle = alpha(RAINBOW[(Math.floor(this.hue) + off / 7 + 14) % RAINBOW.length | 0], 0.75);
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(ax + nx * (off + wav), ay + ny * (off + wav));
          ctx.lineTo(bx + nx * (off + wav), by + ny * (off + wav));
          ctx.stroke();
        }
      }
    };
    if (this.brush === 'glow' || this.brush === 'ribbon') {
      p.len = (p.len || 0) + d;
      const W = this.W, A = this.areaH;
      seg(x0, y0, x, y);
      if (this.mirror >= 1) seg(W - x0, y0, W - x, y);
      if (this.mirror === 2) {
        seg(x0, A - y0, x, A - y);
        seg(W - x0, A - y0, W - x, A - y);
      }
    } else {
      p.stampAcc = (p.stampAcc || 0) + d;
      if (p.stampAcc > 26) {
        p.stampAcc = 0;
        const size = rand(9, 19);
        const rot = rand(TAU);
        this.mirrored(x, y, (mx, my) => {
          glow(ctx, mx, my, size * 2.6, col, 0.28);
          ctx.fillStyle = light(col, 0.45);
          if (this.brush === 'star') {
            softStar(ctx, mx, my, size, 5, 0.52, rot);
            this.stars.push({ x: mx, y: my, r: size, p: rand(TAU) });
          } else heart(ctx, mx, my, size * 0.86);
          ctx.fill();
        });
        if (this.stars.length > 180) this.stars.splice(0, 40);
      }
    }
    ctx.restore();

    // The strokes sing: higher on the page means a higher note, always in tune
    if (p.acc > 42) {
      p.acc = 0;
      const u = 1 - clamp(y / this.areaH);
      const idx = Math.floor(u * 12) - 2;
      audio.note('harp', penta(idx, 60), { vol: 0.42, wet: 0.95, pan: (x / this.W - 0.5) * 0.7 });
    }
    if (Math.random() < 0.3) fx.add({ kind: 'sparkle', x, y, vx: rand(-30, 30), vy: rand(-40, 20), size: rand(8, 15), life: 0.6, color: col });
  },

  update(dt) { this.t += dt; },

  draw(c) {
    const W = this.W, H = this.H;
    c.drawImage(this.back().cv, 0, 0, W, H);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.drawImage(this.cv, 0, 0, W, H);
    c.restore();

    // Stars keep twinkling after they are painted
    for (const s of this.stars) {
      const k = 0.5 + 0.5 * Math.sin(this.t * 3 + s.p);
      if (k < 0.55) continue;
      sparkleShape(c, s.x, s.y, s.r * 0.7 * k);
      c.fillStyle = 'rgba(255,255,255,.9)';
      c.fill();
    }

    // The painting tray
    c.fillStyle = 'rgba(30,20,90,.8)';
    rr(c, -8, this.areaH, W + 16, this.trayH + 20, 26);
    c.fill();
    for (const b of this.buttons) b.draw(c);
    for (const s of this.swatches) {
      const on = this.color === s.col;
      const r = on ? 20 : 17;
      c.save();
      c.translate(s.x, s.y - (on ? 2 : 0));
      if (s.col === 'rainbow') {
        RAINBOW.forEach((k, i) => {
          c.fillStyle = k;
          c.beginPath();
          c.moveTo(0, 0);
          c.arc(0, 0, r, (i / 7) * TAU + this.t * 0.8, ((i + 1) / 7) * TAU + 0.02 + this.t * 0.8);
          c.fill();
        });
      } else {
        glow(c, 0, 0, r * 1.6, s.col, 0.5);
        c.fillStyle = clay(c, 0, 0, r, s.col);
        ell(c, 0, 0, r);
        c.fill();
      }
      c.lineWidth = on ? 3.6 : 2;
      c.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.55)';
      ell(c, 0, 0, r);
      c.stroke();
      gloss(c, -r * 0.3, -r * 0.42, r * 0.34, r * 0.2, 0.7);
      c.restore();
    }

    if (this.comet) {
      const x = this.comet.x;
      glow(c, x, this.areaH * 0.5, 180, '#FFF0C0', 0.85);
      softStar(c, x, this.areaH * 0.5, 34);
      c.fillStyle = '#FFE680';
      c.fill();
    }
  },

  down(p) {
    if (p.y > this.areaH + 4) {
      for (const s of this.swatches) {
        if (dist(p.x, p.y, s.x, s.y) < 24) {
          this.color = s.col;
          audio.note('marimba', penta(COLORS.indexOf(s.col)), { vol: 0.55 });
          haptic();
          return;
        }
      }
      return;
    }
    p.draw = true;
    save.data.seen.paint = 1;
    hint.clear();
    const x = p.x, y = Math.min(p.y, this.areaH);
    this.stroke(p, x + 0.6, y, x, y);
    p.acc = 99;
    this.stroke(p, x + 1.2, y, x + 0.6, y);
    if (this.brush === 'star' || this.brush === 'heart') {
      p.stampAcc = 99;
      this.stroke(p, x + 2, y, x + 1.2, y);
    }
  },
  move(p) {
    if (!p.draw) return;
    this.stroke(p, p.x, Math.min(p.y, this.areaH), p.px, Math.min(p.py, this.areaH));
  }
};
