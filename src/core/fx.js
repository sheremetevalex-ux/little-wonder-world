// Particle system: sparkles, hearts, stars, confetti, bubbles. Pre-rendered
// sprites keep it smooth even with hundreds on screen.
import { P, sprite, sparkleShape, softStar, heart, rand, pick, TAU, ell, gloss, light, dark, rr } from './draw.js';

const RAINBOW = [P.rose, P.sun, P.mint, P.sky, P.lilac, P.pink, P.butter];

const makers = {
  sparkle: (color) => (c, w) => {
    const r = w / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, 'rgba(255,255,255,.8)');
    g.addColorStop(0.3, color + '66');
    g.addColorStop(1, color + '00');
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
    sparkleShape(c, r, r, r * 0.95);
    c.fillStyle = light(color, 0.55);
    c.fill();
  },
  star: (color) => (c, w) => {
    const r = w / 2;
    softStar(c, r, r, r * 0.95);
    const g = c.createLinearGradient(0, 0, w, w);
    g.addColorStop(0, light(color, 0.5));
    g.addColorStop(1, color);
    c.fillStyle = g;
    c.fill();
  },
  heart: (color) => (c, w) => {
    const r = w / 2;
    heart(c, r, r * 0.95, r * 0.8);
    const g = c.createLinearGradient(0, 0, w, w);
    g.addColorStop(0, light(color, 0.4));
    g.addColorStop(1, color);
    c.fillStyle = g;
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.6)';
    ell(c, r * 0.62, r * 0.62, r * 0.17, r * 0.11, -0.6);
    c.fill();
  },
  bubble: (color) => (c, w) => {
    const r = w / 2 - 1;
    const g = c.createRadialGradient(r * 0.8, r * 0.7, r * 0.1, r + 1, r + 1, r);
    g.addColorStop(0, 'rgba(255,255,255,.1)');
    g.addColorStop(0.8, color + '33');
    g.addColorStop(1, 'rgba(255,255,255,.8)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(r + 1, r + 1, r, 0, TAU);
    c.fill();
    gloss(c, r * 0.66, r * 0.58, r * 0.3, r * 0.2, 0.95);
  },
  dot: (color) => (c, w) => {
    const r = w / 2;
    const g = c.createRadialGradient(r * 0.75, r * 0.7, 0, r, r, r);
    g.addColorStop(0, light(color, 0.5));
    g.addColorStop(1, color);
    c.fillStyle = g;
    c.beginPath();
    c.arc(r, r, r, 0, TAU);
    c.fill();
  },
  note: (color) => (c, w) => {
    const k = w / 40;
    c.fillStyle = color;
    c.strokeStyle = color;
    c.lineWidth = 3.6 * k;
    c.lineCap = 'round';
    ell(c, 15 * k, 31 * k, 7.5 * k, 5.6 * k, -0.3);
    c.fill();
    c.beginPath();
    c.moveTo(21.5 * k, 30 * k);
    c.lineTo(21.5 * k, 8 * k);
    c.quadraticCurveTo(29 * k, 11 * k, 32 * k, 19 * k);
    c.stroke();
  },
  confetti: (color) => (c, w) => {
    rr(c, 0, w * 0.22, w, w * 0.56, 2);
    c.fillStyle = color;
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.fillRect(1, w * 0.25, w - 2, w * 0.14);
    c.fillStyle = dark(color, 0.05);
  }
};

const POOL_MAX = 420;

class FX {
  constructor() { this.list = []; }

  clear() { this.list.length = 0; }

  add(o) {
    if (this.list.length >= POOL_MAX) this.list.shift();
    this.list.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0.985, size: 12, life: 1, age: 0, kind: 'sparkle', color: P.butter,
      rot: rand(TAU), spin: 0, grow: 0, flip: false
    }, o));
  }

  burst(x, y, { kind = 'sparkle', n = 14, colors = RAINBOW, speed = 180, size = 16, life = 0.9, g = 240, drag = 0.965, spin = 6 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), s = speed * rand(0.35, 1.05);
      this.add({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.18, g, drag, kind, color: pick(colors),
        size: size * rand(0.6, 1.25), life: life * rand(0.65, 1.1), spin: rand(-spin, spin)
      });
    }
  }

  sparkle(x, y, n = 12, colors = [P.butter, '#FFFFFF', P.pink, P.sky]) { this.burst(x, y, { n, colors, speed: 150, size: 18, life: 0.75, g: 60 }); }
  hearts(x, y, n = 8, colors = [P.rose, P.pink, '#FF7AA8']) { this.burst(x, y, { kind: 'heart', n, colors, speed: 120, size: 22, life: 1.05, g: -60, drag: 0.97, spin: 1.5 }); }
  bubbles(x, y, n = 10, colors = [P.sky, P.mint, P.lilac, P.pink]) { this.burst(x, y, { kind: 'bubble', n, colors, speed: 90, size: 22, life: 1.1, g: -90, drag: 0.97, spin: 0 }); }
  stars(x, y, n = 10) { this.burst(x, y, { kind: 'star', n, colors: [P.sun, P.butter, '#FFD866'], speed: 210, size: 20, life: 0.9, g: 340, spin: 5 }); }

  confetti(W, H, n = 70) {
    for (let i = 0; i < n; i++) {
      this.add({
        x: rand(W), y: rand(-H * 0.5, -10), vx: rand(-30, 30), vy: rand(110, 240), g: 30, drag: 0.998, kind: 'confetti',
        color: pick(RAINBOW), size: rand(9, 15), life: rand(2.2, 3.6), spin: rand(-7, 7), flip: true
      });
    }
  }

  update(dt) {
    const L = this.list;
    let w = 0;
    const k = Math.pow(0.5, dt * 60 / 45);
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      p.age += dt;
      if (p.age >= p.life) continue;
      const dr = Math.pow(p.drag, dt * 60);
      p.vx *= dr;
      p.vy = p.vy * dr + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      L[w++] = p;
    }
    L.length = w;
    return k;
  }

  draw(c) {
    for (const p of this.list) {
      const u = p.age / p.life;
      // Pop in quickly, shrink away softly
      const pop = u < 0.14 ? u / 0.14 : 1;
      const fade = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
      const sz = p.size * pop * (0.45 + 0.55 * fade);
      const res = 40;
      const s = sprite('fx:' + p.kind + p.color, res, res, makers[p.kind](p.color), 2);
      c.save();
      c.globalAlpha = Math.min(1, fade * 1.2);
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      if (p.flip) c.scale(1, Math.cos(p.age * 6 + p.rot));
      c.drawImage(s.cv, -sz / 2, -sz / 2, sz, sz);
      c.restore();
    }
  }
}

export const fx = new FX();
