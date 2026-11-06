// The atelier: pick a cut, then paint, roll patterns and pin decorations right onto
// the dress she is wearing. Everything keeps the folds of the cloth and stays inside
// the seams by itself. The finished dress joins her wardrobe and walks the runway.
import { app, go, hint, Btn, Spring, candy, haptic, tween } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, dist, clamp, clay, dark, TAU, softStar, heart, sparkleShape, mix } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawDoll, DRESS, DEFAULT_DOLL, registerCustomDress } from '../art/doll.js';
import { blinkAt } from '../art/creatures.js';
import { drawSticker } from './salon.js';

const CUTS = ['gown', 'tutu', 'princess', 'mermaid', 'sailor', 'petals'];
const COLORS = ['#FF5C8F', '#FF9FC3', '#FFB02E', '#FFE066', '#7FE3A0', '#3FD0C9', '#6FC6FF', '#5698FF', '#B48BFF', '#8C68F2', '#FFFFFF', '#3A2A57', 'rainbow'];
const RAINBOW = ['#FF7F9F', '#FFB65C', '#FFE066', '#7FE3A0', '#6FC6FF', '#B48BFF'];
const TOOLS = ['brush', 'dots', 'stars', 'hearts', 'stripes', 'fill', 'erase', 'bow', 'flower', 'butterfly', 'gem'];
const STAMPS = new Set(['bow', 'flower', 'butterfly', 'gem']);
// The paint layer covers this part of doll space, at this many pixels per unit
const LX = -120, LY = -60, LW = 240, LH = 200, LK = 2;
const MAX_SAVED = 8;

function drawGem(c, r, col) {
  c.fillStyle = clay(c, 0, 0, r, col === 'rainbow' ? '#FFD45C' : col);
  c.beginPath();
  c.moveTo(-r, -r * 0.2); c.lineTo(-r * 0.5, -r * 0.8); c.lineTo(r * 0.5, -r * 0.8); c.lineTo(r, -r * 0.2); c.lineTo(0, r);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.beginPath();
  c.moveTo(-r * 0.5, -r * 0.8); c.lineTo(0, -r * 0.2); c.lineTo(-r, -r * 0.2);
  c.closePath();
  c.fill();
}

function toolIcon(c, id, r, col) {
  const pc = col === 'rainbow' ? P.rose : col;
  c.save();
  c.scale(r / 24, r / 24);
  c.lineCap = 'round';
  switch (id) {
    case 'brush':
      c.save();
      c.rotate(0.5);
      c.fillStyle = '#E8A968';
      rr(c, -3, -2, 6, 22, 3);
      c.fill();
      c.fillStyle = '#C7CCE8';
      rr(c, -4.5, -8, 9, 8, 2);
      c.fill();
      c.fillStyle = pc;
      c.beginPath();
      c.moveTo(-5, -7); c.quadraticCurveTo(-7, -17, 0, -24); c.quadraticCurveTo(7, -17, 5, -7);
      c.closePath();
      c.fill();
      c.restore();
      break;
    case 'dots':
      c.fillStyle = pc;
      for (const [x, y] of [[-10, -9], [8, -11], [-2, 2], [12, 7], [-13, 11]]) {
        ell(c, x, y, 5);
        c.fill();
      }
      break;
    case 'stars':
      c.fillStyle = pc;
      softStar(c, -6, -5, 11);
      c.fill();
      softStar(c, 10, 9, 7);
      c.fill();
      break;
    case 'hearts':
      c.fillStyle = pc;
      heart(c, -6, -4, 10);
      c.fill();
      heart(c, 10, 9, 6);
      c.fill();
      break;
    case 'stripes':
      c.strokeStyle = pc;
      c.lineWidth = 5.5;
      for (const x of [-12, 0, 12]) {
        c.beginPath();
        c.moveTo(x - 4, 13);
        c.lineTo(x + 4, -13);
        c.stroke();
      }
      break;
    case 'fill':
      c.fillStyle = '#C7CCE8';
      c.beginPath();
      c.moveTo(-13, -5); c.lineTo(13, -5); c.lineTo(9, 16); c.lineTo(-9, 16);
      c.closePath();
      c.fill();
      c.fillStyle = pc;
      ell(c, 0, -5, 13, 5);
      c.fill();
      break;
    case 'erase':
      c.save();
      c.rotate(-0.5);
      c.fillStyle = '#FF9FC3';
      rr(c, -13, -8, 15, 16, 4);
      c.fill();
      c.fillStyle = '#fff';
      rr(c, 0, -8, 13, 16, 4);
      c.fill();
      c.restore();
      break;
    case 'gem':
      drawGem(c, 15, pc);
      break;
    default:
      drawSticker(c, id, 16);
  }
  c.restore();
}

export const atelier = {
  tint: '#C9F3EC',

  enter() {
    this.t = 0;
    this.cut = 'gown';
    this.tool = 'brush';
    this.color = COLORS[0];
    this.sq = new Spring(1, 300, 11);
    this.look = { x: 0, y: 0, on: 0 };
    this.expr = null;
    this.exprT = 0;
    this.painted = 0;
    this.paint = document.createElement('canvas');
    this.paint.width = LW * LK;
    this.paint.height = LH * LK;
    this.px = this.paint.getContext('2d');
    this.px.setTransform(LK, 0, 0, LK, -LX * LK, -LY * LK);
    this.mask = document.createElement('canvas');
    this.mask.width = LW * LK;
    this.mask.height = LH * LK;
    this.comp = document.createElement('canvas');
    this.comp.width = LW * LK;
    this.comp.height = LH * LK;
    this.renderBase();
    this.layout();
    this.registerPreview();
    music.play('dress');
    if (!save.data.seen.atelier) hint.set({ from: [this.cx - 40 * this.s, this.dollY + 40 * this.s], to: [this.cx + 40 * this.s, this.dollY + 60 * this.s], delay: 1.4 });
  },

  exit() {
    delete DRESS.__atelier;
  },

  // The doll wears the work in progress, so she sees it on as she paints
  registerPreview() {
    const self = this;
    DRESS.__atelier = {
      colors: null, draw(c) {
        c.drawImage(self.mask, LX, LY, LW, LH);
        c.save();
        c.globalCompositeOperation = 'multiply';
        c.drawImage(self.comp, LX, LY, LW, LH);
        c.restore();
      }
    };
  },

  renderBase() {
    // The cut in plain white cloth: its folds will show through the paint
    const x = this.mask.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, this.mask.width, this.mask.height);
    x.setTransform(LK, 0, 0, LK, -LX * LK, -LY * LK);
    DRESS[this.cut].draw(x, '#FFFFFF', 0, 0);
    x.setTransform(1, 0, 0, 1, 0, 0);
    this.recompose();
  },

  recompose() {
    const x = this.comp.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, this.comp.width, this.comp.height);
    x.drawImage(this.paint, 0, 0);
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(this.mask, 0, 0);
    x.globalCompositeOperation = 'source-over';
    this.dirty = false;
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.wide = W > 640;
    const rows = this.wide ? 1 : 2;
    this.panelH = 26 + rows * 66 + app.safeBottom * 0.7;
    this.panelY = H - this.panelH;
    const top = Math.max(app.safeTop, 8);
    const area = this.panelY - top - 10;
    this.s = Math.min(area / 292, (W - 150) / 190, 2.1);
    this.cx = W / 2;
    this.dollY = top + 6 + 168 * this.s;
    this.toolPos = TOOLS.map((id, i) => {
      if (this.wide) {
        const gap = Math.min(74, (W - 20) / TOOLS.length);
        return { id, x: W / 2 + (i - (TOOLS.length - 1) / 2) * gap, y: this.panelY + 13 + 33 };
      }
      const per = 6, row = i < per ? 0 : 1, n = row ? TOOLS.length - per : per, col = row ? i - per : i;
      const gap = Math.min(64, (W - 12) / per);
      return { id, x: W / 2 + (col - (n - 1) / 2) * gap, y: this.panelY + 40 + row * 62 };
    });
    // Paint pots down the left
    const room = this.panelY - top - 80;
    const step = Math.min(44, room / COLORS.length);
    this.pots = COLORS.map((col, i) => ({ col, x: 30, y: this.panelY - 26 - i * step, r: Math.min(18, step * 0.46) }));
    // Cuts down the right, the "finished" button below them
    const right = W - 40, cutStep = Math.min(58, (this.panelY - top - 90) / (CUTS.length + 1.2));
    this.cutPos = CUTS.map((id, i) => ({ id, x: right, y: top + 40 + i * cutStep, r: Math.min(25, cutStep * 0.46) }));
    this.buttons = [new Btn({
      x: right, y: this.panelY - 42, r: 30, slop: 8,
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
      tap: () => this.finish()
    })];
  },
  resize() { this.layout(); },

  toLayer(p) { return { x: (p.x - this.cx) / this.s, y: (p.y - this.dollY) / this.s }; },
  onDress(q) {
    if (q.x < LX || q.x > LX + LW || q.y < LY || q.y > LY + LH) return false;
    const x = this.mask.getContext('2d');
    try {
      const d = x.getImageData((q.x - LX) * LK, (q.y - LY) * LK, 1, 1).data;
      return d[3] > 8;
    } catch (e) { return true; }
  },
  paintCol() {
    return this.color === 'rainbow' ? RAINBOW[Math.floor(this.t * 5) % RAINBOW.length] : this.color;
  },

  strokeAt(q, p) {
    const d = this.px, T = this.tool, last = p.lastL || q;
    const moved = dist(q.x, q.y, last.x, last.y);
    if (T === 'brush' || T === 'erase') {
      d.save();
      if (T === 'erase') d.globalCompositeOperation = 'destination-out';
      d.lineCap = 'round';
      d.lineJoin = 'round';
      d.strokeStyle = T === 'erase' ? '#000' : this.paintCol();
      d.lineWidth = T === 'erase' ? 30 : 22;
      d.beginPath();
      d.moveTo(last.x, last.y);
      d.lineTo(q.x + 0.01, q.y);
      d.stroke();
      d.restore();
      p.lastL = q;
      this.dirty = true;
      if (moved > 2 && Math.random() < 0.2) audio.sfx(T === 'erase' ? 'scrub' : 'squish2', { rate: 1.2, vol: 0.32, gap: 110 });
    } else if (T === 'stripes') {
      // A roller: bands that follow her finger
      d.save();
      d.lineCap = 'round';
      d.strokeStyle = this.paintCol();
      d.lineWidth = 7;
      const a = Math.atan2(q.y - last.y, q.x - last.x) || 0, nx = -Math.sin(a), ny = Math.cos(a);
      for (const off of [-14, 0, 14]) {
        d.beginPath();
        d.moveTo(last.x + nx * off, last.y + ny * off);
        d.lineTo(q.x + nx * off + 0.01, q.y + ny * off);
        d.stroke();
      }
      d.restore();
      p.lastL = q;
      this.dirty = true;
      if (moved > 2 && Math.random() < 0.15) audio.sfx('scrub', { rate: 1.4, vol: 0.3, gap: 110 });
    } else if (T === 'dots' || T === 'stars' || T === 'hearts') {
      p.acc = (p.acc ?? 99) + moved;
      if (p.acc > 22) {
        p.acc = 0;
        d.save();
        d.translate(q.x + rand(-5, 5), q.y + rand(-5, 5));
        d.fillStyle = this.paintCol();
        if (T === 'dots') { ell(d, 0, 0, 7); d.fill(); }
        else if (T === 'stars') { d.rotate(rand(-0.4, 0.4)); softStar(d, 0, 0, 10); d.fill(); }
        else { d.rotate(rand(-0.3, 0.3)); heart(d, 0, 0, 9); d.fill(); }
        d.restore();
        this.dirty = true;
        audio.note('marimba', penta(Math.floor(rand(0, 8))), { vol: 0.28 });
      }
      p.lastL = q;
    }
  },

  stamp(q) {
    const d = this.px;
    d.save();
    d.translate(q.x, q.y);
    d.rotate(rand(-0.25, 0.25));
    if (this.tool === 'gem') drawGem(d, 11, this.paintCol());
    else drawSticker(d, this.tool, 16);
    d.restore();
    this.dirty = true;
    this.painted += 4;
    audio.note('marimba', penta(Math.floor(rand(0, 8))), { vol: 0.55 });
    audio.sfx('thud', { rate: 1.5, vol: 0.35 });
    this.sq.kick(1.6);
    haptic();
  },

  fillAll() {
    const d = this.px;
    d.save();
    d.setTransform(1, 0, 0, 1, 0, 0);
    if (this.color === 'rainbow') {
      const g = d.createLinearGradient(0, 0, 0, this.paint.height);
      RAINBOW.forEach((k, i) => g.addColorStop(i / 5, k));
      d.fillStyle = g;
    } else d.fillStyle = this.color;
    d.fillRect(0, 0, this.paint.width, this.paint.height);
    d.restore();
    this.dirty = true;
    this.painted += 10;
    audio.sfx('splash', { vol: 0.7 });
    audio.sparkle(2, 4, 0.35);
    this.sq.kick(4);
    this.react('wow', 0.9);
    fx.sparkle(this.cx, this.dollY + 30 * this.s, 22);
    haptic();
  },

  react(e, t) { this.expr = e; this.exprT = t; },

  setCut(id) {
    if (this.cut === id) { this.sq.kick(3); return; }
    this.cut = id;
    this.renderBase();
    audio.sfx('swish');
    audio.note('bell', penta(CUTS.indexOf(id) + 2), { vol: 0.45 });
    this.sq.kick(5);
    this.react('happy', 0.9);
    fx.sparkle(this.cx, this.dollY + 30 * this.s, 12);
    haptic();
  },

  finish() {
    if (this.dirty) this.recompose();
    let url;
    try {
      const out = document.createElement('canvas');
      out.width = this.mask.width;
      out.height = this.mask.height;
      const x = out.getContext('2d');
      x.drawImage(this.mask, 0, 0);
      x.globalCompositeOperation = 'multiply';
      x.drawImage(this.comp, 0, 0);
      url = out.toDataURL('image/png');
    } catch (e) { return; }
    const id = 'my' + Date.now();
    const list = save.data.myDresses = save.data.myDresses || [];
    list.push({ id, url, cut: this.cut });
    while (list.length > MAX_SAVED) {
      const old = list.shift();
      delete DRESS[old.id];
    }
    registerCustomDress(id, url);
    save.data.doll = { ...DEFAULT_DOLL, stage: 'palace', ...(save.data.doll || {}), dress: id };
    save.data.seen.atelier = 1;
    save.earnStar();
    save.now();
    audio.fanfare();
    fx.confetti(this.W, this.H, 70);
    go('dress', { show: true }, { x: this.buttons[0].x, y: this.buttons[0].y });
  },

  update(dt) {
    this.t += dt;
    this.sq.step(dt);
    this.exprT = Math.max(0, this.exprT - dt);
    if (this.exprT <= 0) this.expr = null;
    this.look.on = Math.max(0, this.look.on - dt);
    if (this.dirty) this.recompose();
  },

  draw(c) {
    const W = this.W, H = this.H;
    const back = softBack('atelier', W, H, '#DDF7F1', '#FFEAD8', (x) => {
      // Rolls of cloth on the wall, and a wooden floor
      const cols = ['#FFC4DC', '#FFE9A8', '#BFE9FF', '#D9C7FF', '#CFF5DF'];
      for (let i = 0; i < W / 62 + 1; i++) {
        x.fillStyle = cols[i % 5];
        rr(x, i * 62 + 6, app.safeTop + 62, 42, 96 + (i % 3) * 22, 10);
        x.fill();
        x.fillStyle = 'rgba(255,255,255,.35)';
        rr(x, i * 62 + 12, app.safeTop + 68, 9, 80 + (i % 3) * 22, 4);
        x.fill();
      }
      x.fillStyle = '#E5BD8F';
      x.fillRect(0, H * 0.74, W, H);
      x.strokeStyle = 'rgba(140,90,50,.2)';
      x.lineWidth = 2;
      for (let i = 0; i < W / 90; i++) {
        x.beginPath(); x.moveTo(i * 90, H * 0.74); x.lineTo(i * 90 - 40, H); x.stroke();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);

    const d = { ...DEFAULT_DOLL, ...(save.data.doll || {}), dress: '__atelier', dressCol: '#FFFFFF', back: 'none', hand: 'none', head: 'none' };
    const q = this.sq.x, s = this.s;
    c.save();
    c.translate(this.cx, this.dollY + 114 * s);
    c.scale(s * (2 - q), s * q);
    c.translate(0, -114);
    const lk = this.look.on > 0;
    drawDoll(c, d, {
      t: 0, sway: 0, expr: this.expr || 'open', blink: blinkAt(this.t, 2),
      lookX: lk ? clamp((this.look.x - this.cx) / 100, -1, 1) : 0, lookY: lk ? clamp((this.look.y - (this.dollY - 80 * s)) / 140, -1, 1) : 0.4
    });
    c.restore();

    // Paint pots
    for (const p of this.pots) {
      const on = this.color === p.col;
      c.save();
      c.translate(p.x, p.y);
      c.fillStyle = 'rgba(70,40,130,.2)';
      ell(c, 0, 3, p.r);
      c.fill();
      if (p.col === 'rainbow') {
        RAINBOW.forEach((k, i) => {
          c.fillStyle = k;
          c.beginPath();
          c.moveTo(0, 0);
          c.arc(0, 0, p.r, (i / 6) * TAU, ((i + 1) / 6) * TAU);
          c.fill();
        });
      } else {
        c.fillStyle = clay(c, 0, 0, p.r, p.col);
        ell(c, 0, 0, p.r);
        c.fill();
      }
      c.lineWidth = on ? 4 : 2.4;
      c.strokeStyle = on ? P.sun : '#fff';
      ell(c, 0, 0, p.r);
      c.stroke();
      c.restore();
    }

    // Cuts to choose from
    for (const p of this.cutPos) {
      const on = this.cut === p.id;
      c.save();
      c.translate(p.x, p.y);
      c.fillStyle = on ? '#FFF0C8' : '#fff';
      ell(c, 0, 0, p.r);
      c.fill();
      c.lineWidth = on ? 4 : 2;
      c.strokeStyle = on ? P.sun : '#EEE0F5';
      c.stroke();
      c.scale((p.r / 25) * 0.25, (p.r / 25) * 0.25);
      c.translate(0, -34);
      DRESS[p.id].draw(c, on ? '#FF9FC3' : '#C7ABFF', 0, 0);
      c.restore();
    }

    // Tools
    c.save();
    c.shadowColor = 'rgba(70,40,130,.28)';
    c.shadowBlur = 14;
    c.shadowOffsetY = -3;
    c.fillStyle = '#FFF9F1';
    rr(c, -10, this.panelY, W + 20, this.panelH + 30, 26);
    c.fill();
    c.restore();
    for (const t of this.toolPos) {
      const on = this.tool === t.id, r = on ? 28 : 25;
      c.save();
      c.translate(t.x, t.y + (on ? -2 : 0));
      c.fillStyle = on ? '#FFE9A8' : '#F4ECFA';
      ell(c, 0, 0, r);
      c.fill();
      if (on) {
        c.lineWidth = 3;
        c.strokeStyle = P.sun;
        c.stroke();
      }
      toolIcon(c, t.id, r * 0.78, this.color);
      c.restore();
    }
    for (const b of this.buttons) b.draw(c);
  },

  down(p) {
    this.look.x = p.x; this.look.y = p.y; this.look.on = 1;
    if (p.y >= this.panelY) {
      let best = null, bd = 42;
      for (const t of this.toolPos) {
        const d = dist(p.x, p.y, t.x, t.y);
        if (d < bd) { bd = d; best = t; }
      }
      if (best) {
        this.tool = best.id;
        audio.note('marimba', penta(TOOLS.indexOf(best.id)), { vol: 0.6 });
        haptic();
        if (best.id === 'fill') this.fillAll();
      }
      return;
    }
    for (const q of this.pots) {
      if (dist(p.x, p.y, q.x, q.y) < q.r + 6) {
        this.color = q.col;
        audio.note('bell', penta(this.pots.indexOf(q)), { vol: 0.45 });
        fx.sparkle(q.x, q.y, 4);
        haptic();
        if (STAMPS.has(this.tool) && this.tool !== 'gem') this.tool = 'brush';
        return;
      }
    }
    for (const q of this.cutPos) {
      if (dist(p.x, p.y, q.x, q.y) < q.r + 6) {
        this.setCut(q.id);
        return;
      }
    }
    const L = this.toLayer(p);
    hint.clear();
    save.data.seen.atelier = 1;
    if (this.tool === 'fill') {
      this.fillAll();
      return;
    }
    p.deco = true;
    if (STAMPS.has(this.tool)) {
      if (this.onDress(L)) {
        this.stamp(L);
        fx.sparkle(p.x, p.y, 6);
      } else {
        audio.sfx('plip', { vol: 0.4 });
      }
      p.deco = false;
      return;
    }
    this.strokeAt(L, p);
  },

  move(p) {
    this.look.x = p.x; this.look.y = p.y; this.look.on = 1;
    if (p.deco) {
      this.strokeAt(this.toLayer(p), p);
      this.painted += 0.02;
      if (Math.random() < 0.03) this.react('happy', 0.7);
    }
  },

  up(p) { p.lastL = null; }
};
