// Bakery: a whole little story. Tip ingredients into the bowl, stir, pour into a pan,
// watch the cake rise in the oven, decorate it however she likes, then hold a party:
// candles out, cake shared with friends, bite by bite.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, vgrad, hgrad, glow, TAU, softStar, heart, groundShadow, sparkleShape, mix } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature, FRIENDS, blinkAt } from '../art/creatures.js';

const INGREDIENTS = [
  { id: 'egg', col: '#FFE27D', batter: null },
  { id: 'milk', col: '#FFFFFF', batter: null },
  { id: 'flour', col: '#FFF2DC', batter: null },
  { id: 'berry', col: '#FF6F91', batter: '#FF9BB8' },
  { id: 'choco', col: '#8A5230', batter: '#A6683F' },
  { id: 'blue', col: '#6F7FE8', batter: '#A99BF0' },
  { id: 'lemon', col: '#FFE24D', batter: '#FFE993' },
  { id: 'mint', col: '#7FE3B8', batter: '#ABEBCD' }
];

function drawIngredient(c, id, r) {
  switch (id) {
    case 'egg':
      c.fillStyle = clay(c, 0, 0, r, '#FFF3E0');
      c.beginPath();
      c.moveTo(0, -r);
      c.bezierCurveTo(r * 0.8, -r, r * 0.85, r * 0.86, 0, r * 0.86);
      c.bezierCurveTo(-r * 0.85, r * 0.86, -r * 0.8, -r, 0, -r);
      c.fill();
      break;
    case 'milk':
      c.fillStyle = hgrad(c, -r * 0.6, r * 0.6, '#FFFFFF', '#D6E6FF');
      c.beginPath();
      c.moveTo(-r * 0.6, r);
      c.lineTo(-r * 0.6, -r * 0.3);
      c.lineTo(0, -r * 0.9);
      c.lineTo(r * 0.6, -r * 0.3);
      c.lineTo(r * 0.6, r);
      c.closePath();
      c.fill();
      c.fillStyle = P.sky;
      rr(c, -r * 0.6, r * 0.05, r * 1.2, r * 0.44, 3);
      c.fill();
      break;
    case 'flour':
      c.fillStyle = hgrad(c, -r * 0.7, r * 0.7, '#FFFBEF', '#EAD9BC');
      rr(c, -r * 0.72, -r * 0.8, r * 1.44, r * 1.76, r * 0.3);
      c.fill();
      softStar(c, 0, r * 0.1, r * 0.34);
      c.fillStyle = P.sun;
      c.fill();
      break;
    case 'berry':
      c.fillStyle = clay(c, 0, 0, r, '#FF4D6A');
      c.beginPath();
      c.moveTo(0, r);
      c.bezierCurveTo(-r * 1.2, r * 0.1, -r * 0.9, -r * 0.8, 0, -r * 0.7);
      c.bezierCurveTo(r * 0.9, -r * 0.8, r * 1.2, r * 0.1, 0, r);
      c.fill();
      c.fillStyle = '#6FCB66';
      ell(c, 0, -r * 0.76, r * 0.46, r * 0.17);
      c.fill();
      break;
    case 'choco':
      c.fillStyle = vgrad(c, -r, r, '#A6683F', '#6E3F24');
      rr(c, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.2);
      c.fill();
      c.strokeStyle = 'rgba(50,20,10,.35)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -r * 0.8); c.lineTo(0, r * 0.8); c.moveTo(-r * 0.8, 0); c.lineTo(r * 0.8, 0);
      c.stroke();
      break;
    case 'blue':
      for (const [x, y] of [[-0.42, 0.22], [0.42, 0.22], [0, -0.38]]) {
        c.fillStyle = clay(c, x * r, y * r, r * 0.5, '#6F7FE8');
        ell(c, x * r, y * r, r * 0.5);
        c.fill();
      }
      break;
    case 'lemon':
      c.fillStyle = clay(c, 0, 0, r, '#FFE24D');
      ell(c, 0, 0, r * 0.94, r * 0.74);
      c.fill();
      break;
    case 'mint':
      for (const a of [-0.7, 0.7, 0]) {
        c.save();
        c.rotate(a);
        c.fillStyle = clay(c, 0, -r * 0.3, r * 0.5, '#6FDB9F');
        ell(c, 0, -r * 0.34, r * 0.34, r * 0.66);
        c.fill();
        c.restore();
      }
      break;
  }
}

// ---- cake shapes -------------------------------------------------------------------
const SHAPES = {
  round(c, s) { ell(c, 0, 0, s, s * 0.92); },
  heart(c, s) { heart(c, 0, -s * 0.12, s * 0.96); },
  star(c, s) { softStar(c, 0, 0, s * 1.14, 5, 0.62); },
  cloud(c, s) {
    c.beginPath();
    for (const [x, y, r] of [[-0.5, 0.1, 0.56], [0, -0.26, 0.66], [0.52, 0.08, 0.56], [0, 0.26, 0.6]]) {
      c.moveTo(x * s + r * s, y * s);
      c.arc(x * s, y * s, r * s, 0, TAU);
    }
  }
};

const TOOLS = [
  { id: 'frost', col: '#FFFFFF', kind: 'frost' }, { id: 'frost', col: '#FF8FC4', kind: 'frost' }, { id: 'frost', col: '#8A5230', kind: 'frost' }, { id: 'frost', col: '#7FD6FF', kind: 'frost' },
  { id: 'frost', col: 'rainbow', kind: 'frost' }, { id: 'sprinkle', kind: 'sprinkle' }, { id: 'berry', kind: 'stamp' }, { id: 'cherry', kind: 'stamp' }, { id: 'star', kind: 'stamp' }, { id: 'heart', kind: 'stamp' },
  { id: 'flower', kind: 'stamp' }, { id: 'candy', kind: 'stamp' }, { id: 'bluey', kind: 'stamp' }, { id: 'candle', kind: 'candle' }
];

const RAINBOW = ['#FF6F91', '#FFB84D', '#FFE45C', '#6FE3A5', '#61BFFF', '#A985FF'];

function drawTopper(c, id, r) {
  switch (id) {
    case 'berry':
      c.fillStyle = clay(c, 0, 0, r, '#FF4D6A');
      c.beginPath();
      c.moveTo(0, r);
      c.bezierCurveTo(-r * 1.2, r * 0.1, -r * 0.9, -r * 0.8, 0, -r * 0.7);
      c.bezierCurveTo(r * 0.9, -r * 0.8, r * 1.2, r * 0.1, 0, r);
      c.fill();
      c.fillStyle = '#FFE082';
      for (const [x, y] of [[-0.35, -0.2], [0.25, -0.3], [0, 0.1], [-0.25, 0.4], [0.3, 0.3]]) {
        ell(c, x * r, y * r, r * 0.06, r * 0.09);
        c.fill();
      }
      c.fillStyle = '#6FCB66';
      ell(c, 0, -r * 0.76, r * 0.46, r * 0.17);
      c.fill();
      break;
    case 'cherry':
      c.strokeStyle = '#5BA84F';
      c.lineWidth = r * 0.14;
      c.beginPath();
      c.moveTo(0, -r * 0.4);
      c.quadraticCurveTo(r * 0.1, -r * 1.2, r * 0.6, -r * 1.3);
      c.stroke();
      c.fillStyle = clay(c, 0, 0, r * 0.8, '#E8314F');
      ell(c, 0, 0, r * 0.76);
      c.fill();
      gloss(c, -r * 0.24, -r * 0.26, r * 0.22, r * 0.14, 0.9);
      break;
    case 'star':
      softStar(c, 0, 0, r);
      c.fillStyle = clay(c, 0, 0, r, P.sun);
      c.fill();
      break;
    case 'heart':
      heart(c, 0, -r * 0.1, r * 0.92);
      c.fillStyle = clay(c, 0, 0, r, P.rose);
      c.fill();
      gloss(c, -r * 0.34, -r * 0.34, r * 0.26, r * 0.16, 0.8);
      break;
    case 'flower':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        c.fillStyle = clay(c, Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56, r * 0.42, '#FF9FC3');
        ell(c, Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56, r * 0.4);
        c.fill();
      }
      c.fillStyle = clay(c, 0, 0, r * 0.4, P.butter);
      ell(c, 0, 0, r * 0.38);
      c.fill();
      break;
    case 'candy':
      c.fillStyle = clay(c, 0, 0, r * 0.7, '#6FC6FF');
      ell(c, 0, 0, r * 0.68);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.8)';
      c.lineWidth = r * 0.14;
      c.beginPath();
      for (let a = 0; a < 10; a += 0.3) c.lineTo(Math.cos(a) * a * r * 0.06, Math.sin(a) * a * r * 0.06);
      c.stroke();
      for (const k of [-1, 1]) {
        c.fillStyle = '#FF9FC3';
        c.beginPath();
        c.moveTo(k * r * 0.66, 0);
        c.lineTo(k * r * 1.14, -r * 0.34);
        c.lineTo(k * r * 1.14, r * 0.34);
        c.closePath();
        c.fill();
      }
      break;
    case 'bluey':
      c.fillStyle = clay(c, 0, 0, r * 0.7, '#6F7FE8');
      ell(c, 0, 0, r * 0.66);
      c.fill();
      break;
  }
}

function drawTube(c, col, r) {
  c.save();
  c.rotate(0.35);
  if (col === 'rainbow') {
    RAINBOW.forEach((k, i) => {
      c.fillStyle = k;
      c.fillRect(-r * 0.52, -r * 0.8 + (i * r * 1.3) / 6, r * 1.04, (r * 1.3) / 6 + 0.6);
    });
  } else {
    c.fillStyle = hgrad(c, -r * 0.52, r * 0.52, light(col, 0.3), col, dark(col, 0.14));
    rr(c, -r * 0.52, -r * 0.84, r * 1.04, r * 1.4, r * 0.24);
    c.fill();
  }
  c.fillStyle = '#E5E9F5';
  c.beginPath();
  c.moveTo(-r * 0.38, r * 0.5);
  c.lineTo(r * 0.38, r * 0.5);
  c.lineTo(0, r * 1.02);
  c.closePath();
  c.fill();
  c.restore();
}

export const cake = {
  tint: '#FFD3A8',

  enter() {
    this.t = 0;
    this.layout();
    this.startMix();
    this.dec = null;
    music.play('cake');
    this.buttons = [];
  },
  resize() { this.layout(); },
  layout() {
    this.W = app.W;
    this.H = app.H;
    this.cx = this.W / 2;
    this.cy = this.H * 0.42;
    this.S = Math.min(this.W * 0.34, this.H * 0.19, 170);
  },

  // ---- 1. MIX ---------------------------------------------------------------------------
  startMix() {
    this.step = 'mix';
    this.batter = '#FFE9C2';
    this.bowlLevel = 0;
    this.added = 0;
    this.stir = 0;
    this.stirA = 0;
    this.spoon = null;
    this.flying = [];
    const items = [...INGREDIENTS];
    const n = items.length, cols = 4;
    const gapX = Math.min(82, (this.W - 20) / cols), y0 = this.H - 170 - app.safeBottom * 0.7;
    this.items = items.map((it, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = this.cx + (col - (cols - 1) / 2) * gapX, y = y0 + row * 76;
      return { ...it, x, y, hx: x, hy: y, r: 27, used: false, sq: new Spring(1, 300, 11) };
    });
    this.buttons = [];
    if (!save.data.seen.cake) hint.set({ from: [this.items[0].x, this.items[0].y], to: [this.cx, this.cy], delay: 1.2 });
  },

  addIngredient(it) {
    it.used = true;
    this.added++;
    if (it.batter) this.batter = this.added <= 1 ? it.batter : mix(this.batter, it.batter, 0.55);
    this.bowlLevel = Math.min(1, this.bowlLevel + 0.3);
    audio.sfx('splash', { rate: rand(0.95, 1.25), vol: 0.75 });
    audio.note('marimba', penta(this.added + 1), { vol: 0.5 });
    fx.burst(this.cx, this.cy - 10, { kind: 'dot', n: 12, colors: [it.col, light(it.col, 0.4)], speed: 200, size: 8, g: 700, life: 0.6, spin: 0 });
    this.bowlSq.kick(4);
    haptic();
    save.data.seen.cake = 1;
    if (this.added === 3) {
      this.spoon = { x: this.cx + this.S * 0.4, y: this.cy - 22 };
      hint.set({ from: [this.cx + this.S * 0.4, this.cy - 6], to: [this.cx - this.S * 0.4, this.cy], delay: 1 });
      audio.sparkle(2, 3, 0.3);
    } else if (this.added < 3) hint.clear();
  },

  drawBowl(c, y, front) {
    const S = this.S, x = this.cx, rx = S * 1.04, ry = S * 0.26;
    if (!front) {
      c.fillStyle = '#E9F0FF';
      ell(c, x, y, rx, ry);
      c.fill();
      const lv = this.bowlLevel;
      if (lv > 0) {
        c.fillStyle = clay(c, x, y + ry * 0.4, rx * 0.9, this.batter, ry);
        ell(c, x, y + ry * (0.5 - lv * 0.3), rx * (0.68 + lv * 0.26), ry * (0.5 + lv * 0.42));
        c.fill();
        if (this.step === 'mix') {
          // Swirl lines that wind up as she stirs
          c.save();
          c.translate(x, y + ry * 0.2);
          c.scale(1, 0.26);
          c.rotate(this.stirA);
          c.strokeStyle = alpha(light(this.batter, 0.4), 0.75 * (1 - clamp(this.stir)) + 0.2);
          c.lineWidth = 7;
          c.lineCap = 'round';
          for (let k = 0; k < 2; k++) {
            c.beginPath();
            for (let a = 0; a < 5; a += 0.2) {
              const r = a * rx * 0.15, b = a + k * Math.PI;
              c.lineTo(Math.cos(b) * r, Math.sin(b) * r);
            }
            c.stroke();
          }
          c.restore();
        }
      }
    } else {
      c.fillStyle = hgrad(c, x - rx, x + rx, '#D6E2FA', '#FFFFFF', '#FFFFFF', '#BBCDF2');
      c.beginPath();
      c.moveTo(x - rx, y);
      c.quadraticCurveTo(x, y + ry * 1.3, x + rx, y);
      c.bezierCurveTo(x + rx * 0.96, y + S * 0.86, x + rx * 0.5, y + S * 0.96, x, y + S * 0.96);
      c.bezierCurveTo(x - rx * 0.5, y + S * 0.96, x - rx * 0.96, y + S * 0.86, x - rx, y);
      c.fill();
      gloss(c, x - rx * 0.5, y + S * 0.42, rx * 0.22, S * 0.22, 0.85, 0.2);
      c.fillStyle = P.pink;
      for (let i = -2; i <= 2; i++) {
        heart(c, x + i * rx * 0.3, y + S * 0.6 - Math.abs(i) * 4, 5.5);
        c.fill();
      }
    }
  },

  // ---- 2. PAN & OVEN --------------------------------------------------------------------
  startPan() {
    this.step = 'pan';
    hint.clear();
    audio.success();
    const names = Object.keys(SHAPES);
    const gap = Math.min(92, (this.W - 16) / 4);
    this.pans = names.map((id, i) => ({
      id, x: this.cx + (i - 1.5) * gap, y: this.H * 0.62, sq: new Spring(0, 200, 10), r: gap * 0.44
    }));
    this.pans.forEach((p, i) => { p.sq.to = 1; p.sq.x = 0; });
    hint.set({ from: [this.pans[0].x, this.pans[0].y], delay: 1.4 });
  },

  choosePan(p) {
    this.shape = p.id;
    this.step = 'oven';
    hint.clear();
    audio.sfx('pour', { rate: 0.85, vol: 1 });
    audio.note('kalimba', 76, { vol: 0.5 });
    this.oven = { door: 0, rise: 0, slide: 0, phase: 'in', glow: 0, tap: 0 };
    tween(this.oven, { slide: 1 }, 0.7, {
      ease: E.io, delay: 0.25, done: () => {
        audio.sfx('thud');
        this.oven.phase = 'bake';
        tween(this.oven, { door: 1 }, 0.3, {
          ease: E.back, done: () => {
            tween(this.oven, { glow: 1 }, 0.5);
            tween(this.oven, { rise: 1 }, 3, {
              ease: E.io, done: () => {
                audio.note('bell', 84, { vol: 0.8, wet: 0.8 });
                audio.note('bell', 88, { vol: 0.5, wet: 0.8, when: audio.now + 0.18 });
                this.oven.phase = 'ready';
                hint.set({ from: [this.cx, this.ovenY() + this.S * 0.4], delay: 0.7 });
              }
            });
          }
        });
      }
    });
  },

  ovenY() { return this.H * 0.42; },

  // ---- 3. DECORATE -----------------------------------------------------------------------
  startDecorate() {
    this.step = 'decorate';
    hint.clear();
    const S = this.S * 1.12;
    this.decS = S;
    this.decY = this.H * 0.38;
    // Layer for icing and toppers, cropped to the cake at compose time
    const size = Math.ceil(S * 3);
    const cv = document.createElement('canvas');
    this.decK = Math.min(app.pr * app.scale, 2);
    cv.width = cv.height = Math.ceil(size * this.decK);
    this.dec = cv;
    this.decSize = size;
    this.dx = cv.getContext('2d');
    this.dx.scale(this.decK, this.decK);
    this.dx.translate(size / 2, size / 2);
    this.bites = 0;
    this.candles = [];
    this.tool = TOOLS[1];
    this.toolScroll = 0;
    this.lastFrost = null;
    this.buttons = [new Btn({
      x: this.W - 42, y: this.H * 0.62, r: 30, slop: 10, sound: 'tap',
      paint: (c, r) => {
        candy(c, r, '#58CC7A');
        c.strokeStyle = '#fff';
        c.lineWidth = 7;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(-12, 1); c.lineTo(-3, 10); c.lineTo(13, -9);
        c.stroke();
      },
      tap: () => this.startParty()
    })];
    hint.set({ from: [this.cx - 40, this.decY - 20], to: [this.cx + 40, this.decY + 20], delay: 1.5 });
  },

  decorateAt(x, y, p) {
    const S = this.decS, t = this.tool;
    const lx = x - this.cx, ly = y - this.decY;
    const d = this.dx;
    if (t.kind === 'frost') {
      const col = t.col === 'rainbow' ? RAINBOW[Math.floor(this.t * 5) % RAINBOW.length] : t.col;
      const last = p.lastF || { x: lx, y: ly };
      // A thick piped line with a soft highlight
      d.lineCap = 'round';
      d.lineJoin = 'round';
      d.strokeStyle = dark(col, 0.14);
      d.lineWidth = 19;
      d.beginPath(); d.moveTo(last.x, last.y + 1.4); d.lineTo(lx, ly + 1.4); d.stroke();
      d.strokeStyle = col;
      d.lineWidth = 16;
      d.beginPath(); d.moveTo(last.x, last.y); d.lineTo(lx, ly); d.stroke();
      d.strokeStyle = alpha(light(col, 0.7), 0.7);
      d.lineWidth = 4.5;
      d.beginPath(); d.moveTo(last.x - 3, last.y - 3.5); d.lineTo(lx - 3, ly - 3.5); d.stroke();
      p.lastF = { x: lx, y: ly };
      if (Math.random() < 0.3) audio.sfx('squish2', { rate: rand(1.15, 1.5), vol: 0.32, gap: 90 });
    } else if (t.kind === 'sprinkle') {
      const cols = ['#FF6F91', '#FFD84D', '#61BFFF', '#6FE3A5', '#FFFFFF', '#A985FF'];
      for (let i = 0; i < 6; i++) {
        const sx = lx + rand(-32, 32), sy = ly + rand(-32, 32);
        d.save();
        d.translate(sx, sy);
        d.rotate(rand(TAU));
        d.fillStyle = pick(cols);
        rr(d, -5, -1.8, 10, 3.6, 1.8);
        d.fill();
        d.restore();
      }
      audio.sfx('plip', { rate: rand(1.2, 2), vol: 0.32, gap: 60 });
    } else if (t.kind === 'stamp') {
      if (p.stamped) return;
      p.stamped = true;
      d.save();
      d.translate(lx, ly);
      d.rotate(rand(-0.3, 0.3));
      drawTopper(d, t.id, t.id === 'bluey' ? 13 : 19);
      d.restore();
      audio.note('marimba', penta(Math.floor(rand(0, 7))), { vol: 0.55 });
      audio.sfx('thud', { rate: 1.4, vol: 0.4 });
      fx.sparkle(x, y, 6);
      haptic();
    } else if (t.kind === 'candle') {
      if (p.stamped) return;
      p.stamped = true;
      if (this.candles.length < 8) {
        this.candles.push({ x: lx, y: ly, col: pick(['#FF8FC4', '#7FD6FF', '#FFD45C', '#B48BFF']), lit: true, s: 0 });
        tween(this.candles[this.candles.length - 1], { s: 1 }, 0.3, { ease: E.back });
        audio.note('kalimba', penta(this.candles.length + 2), { vol: 0.55 });
      }
    }
  },

  cakeImage(S) {
    // Everything clipped to the cake top, plus a cake side for thickness
    const id = this.shape, size = this.decSize;
    const cv = this._img || (this._img = document.createElement('canvas'));
    const k = this.decK;
    if (cv.width !== this.dec.width) { cv.width = this.dec.width; cv.height = this.dec.height; }
    const x = cv.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, cv.width, cv.height);
    x.scale(k, k);
    x.translate(size / 2, size / 2);
    const base = this.batter;
    // Side wall
    x.save();
    x.translate(0, S * 0.2);
    x.fillStyle = dark(base, 0.24);
    SHAPES[id](x, S);
    x.fill();
    x.restore();
    x.save();
    x.translate(0, S * 0.09);
    x.fillStyle = dark(base, 0.12);
    SHAPES[id](x, S);
    x.fill();
    x.restore();
    // Top
    x.fillStyle = clay(x, 0, 0, S, base);
    SHAPES[id](x, S);
    x.fill();
    x.save();
    SHAPES[id](x, S);
    x.clip();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(this.dec, 0, 0);
    x.setTransform(k, 0, 0, k, (size / 2) * k, (size / 2) * k);
    x.restore();
    // Bites are cut from the finished picture
    if (this.biteList && this.biteList.length) {
      x.globalCompositeOperation = 'destination-out';
      for (const b of this.biteList) {
        ell(x, b.x, b.y, b.r);
        x.fill();
      }
      x.globalCompositeOperation = 'source-over';
    }
    return cv;
  },

  // ---- 4. PARTY ------------------------------------------------------------------------------
  startParty() {
    this.step = 'party';
    this.buttons = [];
    hint.clear();
    const fr = save.data.friends;
    const others = Object.keys(FRIENDS).filter((f) => !fr.includes(f)).sort(() => Math.random() - 0.5);
    const guests = [...fr].sort(() => Math.random() - 0.5).slice(0, 3);
    while (guests.length < 3) guests.push(others.pop());
    const y = this.H * 0.76;
    this.guests = guests.map((id, i) => ({
      id, x: -60 - i * 50, tx: this.cx + (i - 1) * Math.min(110, this.W * 0.28), y: y + Math.abs(i - 1) * -14, hop: 0, v: 0, sq: new Spring(1, 280, 11), expr: 'happy', exprT: 0
    }));
    this.guests.forEach((g, i) => tween(g, { x: g.tx }, 0.9, { ease: E.out, delay: 0.1 + i * 0.12, done: () => audio.voice('chirp', FRIENDS[g.id].voice, 0.5) }));
    if (!this.candles.length) {
      // Every birthday cake has a candle; she's allowed to skip placing one
      this.candles.push({ x: 0, y: -this.decS * 0.2, col: '#FF8FC4', lit: true, s: 1 });
    }
    this.biteList = [];
    this.partyPhase = 'candles';
    this.lit = this.candles.length;
    audio.sparkle(1, 5, 0.3);
    wait(0.9, () => {
      const q = this.candles[0];
      hint.set({ from: [this.cx + q.x, this.decY + q.y - 28], delay: 0.8 });
    });
    this.takePhoto();
  },

  takePhoto() {
    try {
      const S = this.decS, size = this.decSize;
      const img = this.cakeImage(S);
      const w = 240, h = 300;
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      x.fillStyle = vgrad(x, 0, h, '#FFF2DC', '#FFD3DF');
      x.fillRect(0, 0, w, h);
      const k = (w * 1.05) / size;
      x.save();
      x.translate(w / 2, h * 0.5);
      x.scale(k, k);
      x.drawImage(img, -size / 2, -size / 2, size, size);
      this.drawCandles(x, 0, 0, this.t);
      x.restore();
      save.addPhoto(cv.toDataURL('image/jpeg', 0.72));
    } catch (e) {}
  },

  blowCandle(q) {
    q.lit = false;
    this.lit--;
    audio.sfx('flame', { vol: 1 });
    fx.burst(this.cx + q.x, this.decY + q.y - 28, { kind: 'dot', n: 6, colors: ['#D9D3E8', '#FFFFFF'], speed: 40, size: 9, g: -80, life: 0.8, spin: 0 });
    haptic();
    if (this.lit <= 0) {
      audio.fanfare();
      fx.confetti(this.W, this.H, 90);
      this.guests.forEach((g) => { g.v = -360; g.exprT = 1.6; g.expr = 'heart'; audio.voice('giggle', FRIENDS[g.id].voice, 0.4); });
      this.partyPhase = 'eat';
      this.eaten = 0;
      save.earnStar();
      wait(1.6, () => hint.set({ from: [this.cx, this.decY], delay: 0.5 }));
    }
  },

  biteCake(x, y) {
    const S = this.decS;
    const lx = clamp(x - this.cx, -S, S), ly = clamp(y - this.decY, -S, S);
    this.biteList.push({ x: lx, y: ly, r: rand(30, 42) });
    this.eaten++;
    const g = this.guests[this.eaten % this.guests.length];
    g.v = -260;
    g.expr = 'happy';
    g.exprT = 1;
    g.chew = 0.7;
    audio.sfx('chew', { vol: 1 });
    wait(0.2, () => audio.sfx('chew', { rate: 1.2, vol: 0.8 }));
    wait(0.6, () => audio.voice('yum', FRIENDS[g.id].voice, 0.6));
    fx.burst(x, y, { kind: 'dot', n: 9, colors: [this.batter, light(this.batter, 0.4), P.pink], speed: 190, size: 8, g: 700, life: 0.7, spin: 0 });
    haptic();
    if (this.eaten >= 11 + (S > 150 ? 2 : 0)) {
      this.partyPhase = 'done';
      hint.clear();
      this.guests.forEach((g2) => { g2.v = -420; g2.exprT = 2; g2.expr = 'heart'; });
      audio.success();
      fx.hearts(this.cx, this.decY, 18);
      this.buttons = [new Btn({
        x: this.cx, y: this.decY, r: 44, slop: 14, paint: (c, r) => {
          candy(c, r, P.coral);
          // Another cake: a tiny one, inside a circle arrow
          c.strokeStyle = '#fff';
          c.lineWidth = 6.5;
          c.lineCap = 'round';
          c.beginPath();
          c.arc(0, 0, r * 0.55, 0.5, 5.4);
          c.stroke();
          c.fillStyle = '#fff';
          c.beginPath();
          c.moveTo(r * 0.72, -r * 0.3);
          c.lineTo(r * 0.34, -r * 0.42);
          c.lineTo(r * 0.62, -r * 0.0);
          c.closePath();
          c.fill();
        }, tap: () => { this.biteList = []; this.dec = null; this._img = null; this.startMix(); }
      })];
      this.buttons[0].s.x = 0;
      this.buttons[0].s.to = 1;
      this.buttons[0].s.k = 200;
    }
  },

  drawCandles(c, ox, oy, t) {
    if (!this.candles) return;
    for (const q of this.candles) {
      c.save();
      c.translate(ox + q.x, oy + q.y);
      c.scale(q.s, q.s);
      c.fillStyle = hgrad(c, -4, 4, light(q.col, 0.4), q.col);
      rr(c, -4, -26, 8, 28, 3);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)';
      c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-4, -22 + i * 9);
        c.lineTo(4, -26 + i * 9);
        c.stroke();
      }
      c.fillStyle = '#3A2A57';
      c.fillRect(-1, -31, 2, 5);
      if (q.lit) {
        const f = Math.sin(t * 16 + q.x) * 0.6 + Math.sin(t * 27 + q.y) * 0.4;
        glow(c, 0, -36, 26, '#FFD680', 0.6);
        c.fillStyle = '#FF9F3D';
        c.beginPath();
        c.moveTo(0 + f, -48);
        c.bezierCurveTo(7, -38, 6, -30, 0, -30);
        c.bezierCurveTo(-6, -30, -7, -38, 0 + f, -48);
        c.fill();
        c.fillStyle = '#FFF0A8';
        ell(c, 0, -35, 2.6, 4.5);
        c.fill();
      }
      c.restore();
    }
  },

  // ---- frame ------------------------------------------------------------------------
  bowlSq: new Spring(1, 280, 10),

  update(dt) {
    this.t += dt;
    this.bowlSq.step(dt);
    if (this.items) for (const it of this.items) it.sq.step(dt);
    if (this.pans) for (const q of this.pans) q.sq.step(dt);
    if (this.guests) {
      for (const g of this.guests) {
        g.v += 1000 * dt;
        g.hop += g.v * dt;
        if (g.hop > 0) { g.hop = 0; g.v = 0; }
        g.exprT = Math.max(0, g.exprT - dt);
        g.chew = Math.max(0, (g.chew || 0) - dt);
        g.sq.step(dt);
      }
    }
    if (this.step === 'oven' && this.oven.phase === 'bake') {
      if (Math.floor(this.t * 2.2) !== Math.floor((this.t - dt) * 2.2)) audio.sfx('tick', { vol: 0.25 });
    }
  },

  drawKitchen(c) {
    const W = this.W, H = this.H;
    const back = softBack('bakery', W, H, '#FFE2D1', '#FFF2DC', (x) => {
      // Striped wallpaper and shelf
      for (let i = 0; i < W / 40 + 1; i++) {
        if (i % 2) continue;
        x.fillStyle = 'rgba(255,255,255,.42)';
        x.fillRect(i * 40, 0, 40, H);
      }
      x.fillStyle = vgrad(x, H * 0.7, H, '#F7C6A8', '#E8A988');
      x.fillRect(0, H * 0.7, W, H);
      x.fillStyle = '#FFF6EC';
      x.fillRect(0, H * 0.7, W, 10);
      // Bunting
      const cols = [P.rose, P.butter, P.sky, P.mint];
      for (let i = 0; i < W / 40; i++) {
        const px = i * 40 + 84, py = app.safeTop + 22 + Math.sin(i * 0.8) * 6;
        x.fillStyle = cols[i % 4];
        x.beginPath();
        x.moveTo(px, py);
        x.lineTo(px + 28, py);
        x.lineTo(px + 14, py + 24);
        x.closePath();
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);
  },

  draw(c) {
    this.drawKitchen(c);
    if (this.step === 'mix') this.drawMix(c);
    if (this.step === 'pan') this.drawPans(c);
    if (this.step === 'oven') this.drawOven(c);
    if (this.step === 'decorate') this.drawDecorate(c);
    if (this.step === 'party') this.drawParty(c);
    for (const b of this.buttons) b.draw(c);
  },

  drawMix(c) {
    const q = this.bowlSq.x;
    c.save();
    c.translate(this.cx, this.cy + this.S * 0.5);
    c.scale(2 - q, q);
    c.translate(-this.cx, -this.cy - this.S * 0.5);
    groundShadow(c, this.cx, this.cy + this.S * 1.02, this.S * 1.1, this.S * 0.2);
    this.drawBowl(c, this.cy, false);
    if (this.spoon) {
      const a = this.stirA;
      const sx = this.spoon.x, sy = this.spoon.y;
      c.save();
      c.translate(sx, sy);
      c.rotate(0.38);
      c.fillStyle = hgrad(c, -7, 7, '#F2C78E', '#D9944C');
      rr(c, -6, -this.S * 0.86, 12, this.S * 0.8, 6);
      c.fill();
      c.fillStyle = clay(c, 0, 6, 18, '#EFBE85');
      ell(c, 0, 8, 18, 24);
      c.fill();
      c.restore();
    }
    this.drawBowl(c, this.cy, true);
    c.restore();

    // Stir progress as stars circling the bowl's rim
    if (this.spoon) {
      const n = 8, on = Math.floor(clamp(this.stir) * n);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU - Math.PI / 2;
        const x = this.cx + Math.cos(a) * this.S * 1.26, y = this.cy + this.S * 0.2 + Math.sin(a) * this.S * 0.9;
        softStar(c, x, y, i < on ? 11 : 7);
        c.fillStyle = i < on ? P.sun : 'rgba(255,255,255,.65)';
        c.fill();
      }
    }

    // Shelf of ingredients
    for (const it of this.items) {
      if (it.used) continue;
      c.save();
      c.translate(it.x, it.y + Math.sin(this.t * 2 + it.hx) * 1.4);
      c.scale(it.sq.x, it.sq.x);
      drawIngredient(c, it.id, it.r * (it === this.hold ? 1.2 : 1));
      c.restore();
    }
  },

  drawPanArt(c, q) {
    c.save();
    c.translate(q.x, q.y);
    const k = q.sq.x;
    c.scale(k, k);
    const r = q.r;
    groundShadow(c, 0, r * 0.72, r * 0.95, r * 0.22);
    c.fillStyle = '#AEBBD4';
    SHAPES[q.id](c, r * 0.8);
    c.fill();
    c.save();
    c.translate(0, -3);
    c.fillStyle = clay(c, 0, 0, r * 0.74, this.batter);
    c.scale(0.86, 0.86);
    SHAPES[q.id](c, r * 0.8);
    c.fill();
    c.restore();
    c.restore();
  },

  drawPans(c) {
    groundShadow(c, this.cx, this.cy + this.S * 0.9, this.S, this.S * 0.2);
    this.drawBowl(c, this.cy - 30, false);
    this.drawBowl(c, this.cy - 30, true);
    for (const q of this.pans) this.drawPanArt(c, q);
  },

  drawOven(c) {
    const o = this.oven, S = this.S, x = this.cx, y = this.ovenY();
    const w = S * 1.34, h = S * 1.34;
    // Oven body
    groundShadow(c, x, y + h + 8, w * 1.05, 18);
    c.fillStyle = hgrad(c, x - w, x + w, '#FF9FB8', '#FFC2D4', '#FF9FB8');
    rr(c, x - w, y - h, w * 2, h * 2, 30);
    c.fill();
    // Dials
    for (const k of [-1, 0, 1]) {
      c.fillStyle = clay(c, x + k * w * 0.42, y - h + 28, 13, '#FFF6EC');
      ell(c, x + k * w * 0.42, y - h + 28, 13);
      c.fill();
    }
    // Interior
    const ix = x - w * 0.8, iy = y - h * 0.62, iw = w * 1.6, ih = h * 1.42;
    c.fillStyle = '#4A3060';
    rr(c, ix, iy, iw, ih, 18);
    c.fill();
    if (o.glow > 0) {
      c.save();
      rr(c, ix, iy, iw, ih, 18);
      c.clip();
      c.globalCompositeOperation = 'lighter';
      glow(c, x, y + h * 0.2, w * 1.3, '#FFB347', 0.7 * o.glow);
      c.restore();
    }
    // Rack
    c.strokeStyle = 'rgba(255,255,255,.3)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ix + 8, y + h * 0.42);
    c.lineTo(ix + iw - 8, y + h * 0.42);
    c.stroke();
    // Cake on its way in, then rising inside
    const slideY = lerp(this.H * 0.75, y + h * 0.18, o.slide);
    const scaleK = 0.62 * (0.45 + 0.55 * o.rise);
    c.save();
    c.translate(x, slideY);
    c.scale(scaleK, 0.62 * (0.4 + 0.6 * o.rise));
    c.fillStyle = dark(this.batter, 0.2 - o.rise * 0.05);
    SHAPES[this.shape](c, S);
    c.fill();
    c.translate(0, -7);
    c.fillStyle = clay(c, 0, 0, S, mix(this.batter, '#E8A968', o.rise * 0.3));
    SHAPES[this.shape](c, S);
    c.fill();
    c.restore();
    // Glass door
    if (o.door > 0) {
      c.save();
      c.globalAlpha = o.door;
      c.fillStyle = 'rgba(255,240,200,.14)';
      rr(c, ix - 6, iy - 6, iw + 12, ih + 12, 22);
      c.fill();
      c.lineWidth = 9;
      c.strokeStyle = '#FFF6EC';
      rr(c, ix - 4, iy - 4, iw + 8, ih + 8, 22);
      c.stroke();
      gloss(c, ix + iw * 0.25, iy + ih * 0.2, iw * 0.2, ih * 0.06, 0.45, -0.4);
      c.fillStyle = '#FFF6EC';
      rr(c, x - w * 0.5, iy + 8, w, 11, 5.5);
      c.fill();
      c.restore();
    }
    if (o.phase === 'ready') {
      const k = 0.5 + 0.5 * Math.sin(this.t * 7);
      c.save();
      c.globalCompositeOperation = 'lighter';
      glow(c, x, y - h + 28, 44, '#FFF0A0', 0.3 + k * 0.5);
      c.restore();
    }
  },

  drawDecorate(c) {
    const S = this.decS;
    this.drawStand(c, this.cx, this.decY, S);
    const size = this.decSize;
    const img = this.cakeImage(S);
    c.drawImage(img, this.cx - size / 2, this.decY - size / 2, size, size);
    this.drawCandles(c, this.cx, this.decY, this.t);

    // The tool shelf: two neat rows, no scrolling for small hands
    const n = TOOLS.length, perRow = 7, gap = Math.min(52, (this.W - 16) / perRow);
    this.toolPos = [];
    const y0 = this.H - 118 - app.safeBottom * 0.8;
    c.fillStyle = 'rgba(255,255,255,.82)';
    rr(c, 8, y0 - 34, this.W - 16, 146, 26);
    c.fill();
    TOOLS.forEach((t, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const x = this.cx + (col - (perRow - 1) / 2) * gap, y = y0 + row * 66;
      this.toolPos.push({ t, x, y });
      const on = this.tool === t;
      c.save();
      c.translate(x, y);
      if (on) {
        c.fillStyle = '#FFE9A8';
        ell(c, 0, 0, 26);
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = P.sun;
        c.stroke();
      }
      const k = on ? 1.1 : 1;
      c.scale(k, k);
      if (t.kind === 'frost') drawTube(c, t.col, 17);
      else if (t.kind === 'sprinkle') {
        c.fillStyle = hgrad(c, -9, 9, '#FFD0E3', '#FF9FC3');
        rr(c, -9, -12, 18, 26, 6);
        c.fill();
        c.fillStyle = '#E5E9F5';
        rr(c, -10, -18, 20, 8, 3);
        c.fill();
        ['#FF6F91', '#FFD84D', '#61BFFF'].forEach((col, q) => {
          c.fillStyle = col;
          ell(c, -5 + q * 5, -2 + (q % 2) * 7, 2.4);
          c.fill();
        });
      } else if (t.kind === 'stamp') drawTopper(c, t.id, 15);
      else {
        c.fillStyle = hgrad(c, -4, 4, '#FFC4DC', '#FF8FC4');
        rr(c, -4, -10, 8, 26, 3);
        c.fill();
        c.fillStyle = '#FF9F3D';
        ell(c, 0, -15, 4, 6);
        c.fill();
      }
      c.restore();
    });
  },

  drawStand(c, x, y, S) {
    groundShadow(c, x, y + S * 1.12, S * 1.2, S * 0.18);
    c.fillStyle = hgrad(c, x - 30, x + 30, '#F8F2FF', '#FFFFFF', '#D6C9EC');
    c.beginPath();
    c.moveTo(x - 22, y + S * 0.86);
    c.lineTo(x + 22, y + S * 0.86);
    c.lineTo(x + 40, y + S * 1.12);
    c.lineTo(x - 40, y + S * 1.12);
    c.closePath();
    c.fill();
    c.fillStyle = '#FFFFFF';
    ell(c, x, y + S * 0.62, S * 1.12, S * 0.38);
    c.fill();
    c.fillStyle = 'rgba(190,160,230,.28)';
    ell(c, x, y + S * 0.66, S * 0.98, S * 0.29);
    c.fill();
  },

  drawParty(c) {
    const S = this.decS;
    // Dim a little while the candles are lit: makes them magical
    if (this.partyPhase === 'candles') {
      c.fillStyle = 'rgba(40,24,90,.42)';
      c.fillRect(0, 0, this.W, this.H);
    }
    this.drawStand(c, this.cx, this.decY, S);
    const size = this.decSize;
    if (this.partyPhase !== 'done') {
      const img = this.cakeImage(S);
      c.drawImage(img, this.cx - size / 2, this.decY - size / 2, size, size);
      if (this.partyPhase === 'candles') this.drawCandles(c, this.cx, this.decY, this.t);
    }
    for (const g of this.guests) {
      groundShadow(c, g.x, g.y + 42, 40, 9);
      c.save();
      c.translate(g.x, g.y + g.hop);
      const lookX = clamp((this.cx - g.x) / 90, -1, 1);
      drawCreature(c, g.id, {
        R: 44, t: this.t, eyes: g.exprT > 0 ? g.expr : 'open', lookX, lookY: -0.8, blink: g.exprT ? 0 : blinkAt(this.t, g.x % 7), mouth: g.chew > 0 ? 'chew' : 'smile',
        mouthOpen: g.chew > 0 ? 0 : (g.exprT > 0 ? 0.7 : 0), wave: this.partyPhase === 'done' ? 0.9 : 0, waveBoth: true
      });
      c.restore();
    }
  },

  // ---- input ---------------------------------------------------------------------------
  down(p) {
    if (this.step === 'mix') {
      for (const it of this.items) {
        if (!it.used && dist(p.x, p.y, it.x, it.y) < it.r + 14 && this.added < 5) {
          this.hold = it;
          p.it = it;
          it.sq.kick(3);
          audio.note('marimba', penta(this.items.indexOf(it)), { vol: 0.4 });
          return;
        }
      }
      if (this.spoon && dist(p.x, p.y, this.cx, this.cy + 10) < this.S * 1.4) {
        p.stir = true;
        p.lastA = Math.atan2(p.y - this.cy, p.x - this.cx);
        this.spoon.x = p.x;
        this.spoon.y = p.y;
        hint.clear();
      }
    } else if (this.step === 'pan') {
      for (const q of this.pans) {
        if (dist(p.x, p.y, q.x, q.y) < q.r + 8) {
          this.choosePan(q);
          return;
        }
      }
    } else if (this.step === 'oven') {
      if (this.oven.phase === 'ready') {
        audio.sfx('whoosh');
        audio.success();
        fx.sparkle(this.cx, this.ovenY(), 24);
        this.oven.phase = 'open';
        tween(this.oven, { door: 0, glow: 0 }, 0.3, { done: () => this.startDecorate() });
      }
    } else if (this.step === 'decorate') {
      if (this.toolPos) {
        for (const q of this.toolPos) {
          if (dist(p.x, p.y, q.x, q.y) < 28) {
            this.tool = q.t;
            audio.note('marimba', penta(TOOLS.indexOf(q.t) % 8), { vol: 0.55 });
            haptic();
            return;
          }
        }
      }
      if (dist(p.x, p.y, this.cx, this.decY) < this.decS * 1.3) {
        p.deco = true;
        hint.clear();
        this.decorateAt(p.x, p.y, p);
      }
    } else if (this.step === 'party') {
      if (this.partyPhase === 'candles') {
        let best = null, bd = 60;
        for (const q of this.candles) {
          if (!q.lit) continue;
          const d = dist(p.x, p.y, this.cx + q.x, this.decY + q.y - 28);
          if (d < bd) { bd = d; best = q; }
        }
        if (best) {
          hint.clear();
          this.blowCandle(best);
        }
      } else if (this.partyPhase === 'eat') {
        if (dist(p.x, p.y, this.cx, this.decY) < this.decS * 1.25) {
          hint.clear();
          this.biteCake(p.x, p.y);
        }
      }
      for (const g of this.guests) {
        if (dist(p.x, p.y, g.x, g.y) < 44) {
          g.v = -320;
          g.exprT = 0.8;
          g.expr = 'happy';
          audio.voice('coo', FRIENDS[g.id].voice);
        }
      }
    }
  },

  move(p) {
    if (p.it) {
      p.it.x = p.x;
      p.it.y = p.y;
    }
    if (p.stir) {
      this.spoon.x = p.x;
      this.spoon.y = p.y;
      const a = Math.atan2(p.y - this.cy, p.x - this.cx);
      let da = a - p.lastA;
      if (da > Math.PI) da -= TAU;
      if (da < -Math.PI) da += TAU;
      p.lastA = a;
      const inside = dist(p.x, p.y, this.cx, this.cy) < this.S * 1.5;
      if (inside) {
        const prev = this.stir;
        this.stirA += da;
        this.stir += Math.abs(da) / (TAU * 2.6);
        if (Math.abs(da) > 0.02) audio.sfx(Math.random() < 0.5 ? 'squish2' : 'plip', { rate: rand(0.9, 1.3), vol: 0.4, gap: 130 });
        const n = 8;
        if (Math.floor(prev * n) !== Math.floor(this.stir * n)) {
          audio.note('kalimba', penta(Math.floor(this.stir * n) + 1), { vol: 0.55 });
        }
        if (this.stir >= 1 && this.step === 'mix') this.startPan();
      }
    }
    if (p.deco) {
      if (this.tool.kind === 'frost' || this.tool.kind === 'sprinkle') this.decorateAt(p.x, p.y, p);
    }
  },

  up(p) {
    if (p.it) {
      const it = p.it;
      this.hold = null;
      // Forgiving: any release near the bowl, or a plain tap, tips it in
      const nearBowl = dist(p.x, p.y, this.cx, this.cy + 8) < this.S * 1.4;
      if (nearBowl || p.moved < 12) {
        hint.clear();
        it.x = it.hx;
        it.y = it.hy;
        this.addIngredient(it);
      } else tween(it, { x: it.hx, y: it.hy }, 0.3, { ease: E.back });
    }
    if (p.lastF) p.lastF = null;
  }
};
