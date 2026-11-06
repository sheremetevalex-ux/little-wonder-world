// Singing faces: a big rubber face. Stretch the mouth with a finger and it sings;
// the further it stretches, the higher the note. Noses, cheeks and ears stretch too.
// Everything is drawn through one warp function, so the whole face is true rubber.
// Modes: free singing, a real song one mouth-opening per note, a choir of faces for
// several fingers, and a copycat who sings back whatever she just sang.
import { app, hint, wait, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, TAU, softStar, heart, spline, sprite, mix } from '../core/draw.js';
import { softBack } from '../art/world.js';

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const ss = (u) => { const v = clamp(u); return v * v * (3 - 2 * v); };

// ---- the cast ---------------------------------------------------------------------
const FACES = [
  { id: 'moko', head: 'round', col: '#FFB3C7', ears: 'sprout', eyes: 'big', nose: 'dot', lip: '#C2476F', base: 60, fm: 1.06, teeth: 'two', bg: ['#FFDCE9', '#FFEFD0'] },
  { id: 'cat', head: 'round', col: '#FFD08A', ears: 'cat', inner: '#FF9FB5', eyes: 'cat', nose: 'pink', whisk: 1, stripes: '#F2A65A', lip: '#B9663D', base: 67, fm: 1.2, teeth: 'fangs', bg: ['#FFE9C2', '#FFD3DF'] },
  { id: 'frog', head: 'wide', col: '#93E47A', ears: 'frog', eyes: 'top', nose: 'two', lip: '#3F9A52', base: 48, fm: 0.8, mw: 62, my: 34, smile: 18, teeth: 'none', bg: ['#C7F3FF', '#C9F5B8'] },
  { id: 'lion', head: 'round', col: '#FFC76B', ears: 'mane', mane: '#E8893A', eyes: 'big', nose: 'brown', whisk: 1, lip: '#A65B2A', base: 50, fm: 0.84, teeth: 'fangs', bg: ['#FFF0B8', '#FFC9A0'] },
  { id: 'robot', head: 'square', col: '#A9C8E8', ears: 'bolts', eyes: 'led', nose: 'none', lip: '#5C7396', base: 55, fm: 1, fx: 'robot', teeth: 'grid', smile: 2, bg: ['#D4E4FF', '#CDBFFF'] },
  { id: 'alien', head: 'egg', col: '#A7F06B', ears: 'antenna', eyes: 'alien', nose: 'none', lip: '#4FA33D', base: 72, fm: 1.3, teeth: 'none', mw: 30, my: 58, bg: ['#3C2E9E', '#7A4FC4'] },
  { id: 'hippo', head: 'wide', col: '#B7A6E8', ears: 'small', inner: '#FFC4DC', eyes: 'small', nose: 'nostril', lip: '#7C63B8', base: 46, fm: 0.74, mw: 66, my: 40, smile: 10, teeth: 'tusks', bg: ['#BFEFFF', '#E4D8FF'] },
  { id: 'ghost', head: 'ghost', col: '#F4F7FF', eyes: 'hollow', nose: 'none', lip: '#8D78B5', base: 64, fm: 1.1, teeth: 'none', mw: 26, smile: 4, bg: ['#2D2470', '#5B3FA8'] },
  { id: 'sun', head: 'round', col: '#FFD45C', ears: 'rays', eyes: 'big', nose: 'dot', lip: '#C2772A', base: 69, fm: 1.15, teeth: 'two', bg: ['#8FD6FF', '#FFF2C8'] },
  { id: 'tomato', head: 'wide', col: '#FF6F61', ears: 'stem', eyes: 'big', nose: 'dot', lip: '#B4322E', base: 65, fm: 1.1, teeth: 'two', bg: ['#FFF3D8', '#D2F5C2'] },
  { id: 'bunny', head: 'round', col: '#CDB6FF', ears: 'bunny', inner: '#FFC4DC', eyes: 'big', nose: 'pink', whisk: 1, lip: '#7C5AC2', base: 70, fm: 1.22, teeth: 'buck', bg: ['#EDE3FF', '#FFDCEB'] },
  { id: 'grandpa', head: 'tall', col: '#FBD3B6', ears: 'human', eyes: 'specs', nose: 'big', lip: '#B5604F', base: 49, fm: 0.82, teeth: 'two', stache: 1, brow: '#F6F3EE', bald: 1, my: 56, mw: 34, bg: ['#E6F2FF', '#FFE6C9'] },
  { id: 'dragon', head: 'round', col: '#7FE6BE', ears: 'dragon', eyes: 'big', nose: 'two', lip: '#2F9C7C', base: 52, fm: 0.9, teeth: 'fangs', mw: 46, bg: ['#FFDAB8', '#CFF3E8'] }
];

const VOICE_FX = {
  normal: { pm: 1, fm: 1, vib: 22, rate: 5.4 },
  high: { pm: 2, fm: 1.42, vib: 30, rate: 7 },
  low: { pm: 0.5, fm: 0.72, vib: 14, rate: 4.6 },
  wobble: { pm: 1, fm: 1, vib: 95, rate: 8.5 },
  robot: { pm: 1, fm: 1, vib: 0, rate: 0, wave: 'square', trem: 38, step: true }
};
const FX_ORDER = ['normal', 'high', 'low', 'wobble', 'robot'];
const HATS = ['none', 'party', 'crown', 'specs', 'bow', 'stache'];

// Old songs that belong to everyone. Each number is one mouth-opening.
const SONGS = [
  // Twinkle, Twinkle, Little Star
  { key: 60, n: [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60, 67, 67, 65, 65, 64, 64, 62, 67, 67, 65, 65, 64, 64, 62, 60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60] },
  // В лесу родилась ёлочка
  { key: 65, n: [60, 69, 69, 67, 69, 65, 60, 60, 60, 69, 69, 70, 67, 72, 72, 62, 62, 70, 70, 69, 67, 65, 72, 69, 69, 67, 69, 65] },
  // Jingle Bells
  { key: 60, n: [64, 64, 64, 64, 64, 64, 64, 67, 60, 62, 64, 65, 65, 65, 65, 65, 64, 64, 64, 64, 62, 62, 64, 62, 67] },
  // Happy Birthday
  { key: 60, n: [55, 55, 57, 55, 60, 59, 55, 55, 57, 55, 62, 60, 55, 55, 67, 64, 60, 59, 57, 65, 65, 64, 60, 62, 60] },
  // Frère Jacques
  { key: 60, n: [60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67, 64, 65, 67, 67, 69, 67, 65, 64, 60, 67, 69, 67, 65, 64, 60, 60, 55, 60, 60, 55, 60] }
];
const CHORD_SETS = (k) => [[k, k + 4, k + 7], [k + 5, k + 9, k + 12], [k + 7, k + 11, k + 14], [k + 9, k + 12, k + 16]];

// ---- head outlines, sampled once ----------------------------------------------------
const HEADS = {};
function headPts(kind) {
  if (HEADS[kind]) return HEADS[kind];
  const n = 52, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, cs = Math.cos(a), sn = Math.sin(a);
    let x = cs * 100, y = sn * 96;
    if (kind === 'wide') { x = cs * 122; y = sn * 88; }
    if (kind === 'tall') { x = cs * 90; y = sn * 110; }
    if (kind === 'egg') { x = cs * (88 - sn * 18); y = sn * 112; }
    if (kind === 'square') {
      const p = 2 / 5;
      x = Math.sign(cs) * Math.pow(Math.abs(cs), p) * 98;
      y = Math.sign(sn) * Math.pow(Math.abs(sn), p) * 96;
    }
    if (kind === 'ghost') {
      x = cs * 92;
      y = sn < 0 ? sn * 104 : sn * 128 + Math.cos(a * 8) * 9 * sn;
    }
    pts.push([x, y]);
  }
  HEADS[kind] = pts;
  return pts;
}

class Face {
  constructor(def, fxName = def.fx || 'normal') {
    this.def = def;
    this.cx = 0; this.cy = 0; this.k = 1;
    this.my = def.my ?? 44;
    this.mw = def.mw ?? 40;
    this.up = new Spring(0, 260, 11);
    this.down = new Spring(0, 260, 11);
    this.wide = new Spring(0, 260, 11);
    this.grabs = [];
    this.mouth = new Set();
    this.t = rand(20);
    this.seed = rand(7);
    this.look = { x: 0, y: 0 };
    this.lookT = 0;
    this.fx = fxName;
    this.hat = 'none';
    this.voice = null;
    this.quiet = 0;
    this.midi = def.base;
    this.step = -1;
    this.noteT = 0;
    this.fixed = null;     // a choir face holds one note
    this.pm = 1;           // extra pitch, for the copycat
    this.auto = null;      // recorded mouth to replay
    this.bump = new Spring(1, 300, 10);
    this.squint = 0;
  }

  // --- rubber ------------------------------------------------------------------------
  warpG(x, y) {
    let X = x, Y = y;
    for (const g of this.grabs) {
      const dx = x - g.ax, dy = y - g.ay, w = Math.exp(-(dx * dx + dy * dy) / (2 * g.r * g.r));
      X += g.dx * w;
      Y += g.dy * w;
    }
    return [X, Y];
  }
  warp(x, y) {
    const my = this.my, up = this.up.x, dn = this.down.x, wd = this.wide.x;
    let Y = y + dn * ss((y - (my - 24)) / 70) * 0.92 - up * ss((my - 6 - y) / 90) * 0.7;
    const near = Math.exp(-((y - my) * (y - my)) / 4900);
    const X = x + clamp(x / this.mw, -1, 1) * wd * near;
    return this.warpG(X, Y);
  }
  path(c, pts, closed = true) {
    spline(c, pts.map((p) => this.warp(p[0], p[1])), closed);
  }
  blob(c, x, y, rx, ry = rx, rot = 0, n = 14) {
    const pts = [];
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, ox = Math.cos(a) * rx, oy = Math.sin(a) * ry;
      pts.push(this.warp(x + ox * cr - oy * sr, y + ox * sr + oy * cr));
    }
    spline(c, pts, true);
  }
  fill(c, x, y, rx, ry, color, rot = 0) {
    const [X, Y] = this.warp(x, y);
    c.fillStyle = clay(c, X, Y, Math.max(rx, ry), color);
    this.blob(c, x, y, rx, ry, rot);
    c.fill();
  }

  // --- input from a finger -------------------------------------------------------------
  toFace(x, y) { return [(x - this.cx) / this.k, (y - this.cy) / this.k]; }
  overMouth(fx0, fy0) {
    const hw = this.mw + this.wide.x + 34, gap = this.up.x + this.down.x;
    return Math.abs(fx0) < hw && fy0 > this.my - 24 - this.up.x && fy0 < this.my + 44 + gap;
  }
  overHead(fx0, fy0) { return Math.hypot(fx0 * 0.9, fy0 * 0.9) < 138; }

  pressMouth(p) {
    p.mouthOf = this;
    this.mouth.add(p);
    this.bump.kick(2.4);
    haptic();
    hint.clear();
  }
  grab(p, fx0, fy0) {
    const g = { ax: fx0, ay: fy0, dx: 0, dy: 0, vx: 0, vy: 0, r: 58, held: true, x0: p.x, y0: p.y };
    p.grab = g;
    p.grabOf = this;
    this.grabs.push(g);
    if (this.grabs.length > 5) this.grabs.shift();
    // Every part has its own little voice
    const onNose = Math.hypot(fx0, fy0 - (this.def.ny ?? 14)) < 26;
    const onEye = Math.abs(Math.abs(fx0) - 38) < 26 && Math.abs(fy0 + 24) < 28;
    if (onNose && this.def.nose !== 'none') audio.sfx('honk', { rate: rand(0.9, 1.15), vol: 0.8 });
    else if (onEye) { this.squint = 1; audio.voice('chirp', rand(0.9, 1.2), 0.5); }
    else audio.sfx('squish', { rate: rand(0.9, 1.3), vol: 0.5, gap: 60 });
    haptic();
    hint.clear();
  }
  moveGrab(p) {
    const g = p.grab;
    g.dx = clamp((p.x - g.x0) / this.k, -160, 160);
    g.dy = clamp((p.y - g.y0) / this.k, -160, 160);
    const len = Math.hypot(g.dx, g.dy);
    if (len > 26 && Math.random() < 0.08) audio.sfx('squish2', { rate: 0.7 + len / 120, vol: 0.3, gap: 110 });
  }
  releaseGrab(p) {
    const g = p.grab;
    g.held = false;
    const len = Math.hypot(g.dx, g.dy);
    if (len > 14) {
      audio.sfx('boing', { rate: clamp(1.5 - len / 170, 0.7, 1.5), vol: 0.6 + Math.min(0.3, len / 400) });
      this.bump.kick(3);
    }
    p.grab = null;
  }

  // --- every frame ----------------------------------------------------------------------
  update(dt, scene) {
    this.t += dt;
    this.bump.step(dt);
    this.squint = Math.max(0, this.squint - dt * 2);
    let u = 0, d = 0, w = 0, hold = false;
    for (const p of this.mouth) {
      const [fx0, fy0] = this.toFace(p.x, p.y);
      const dy = fy0 - this.my;
      hold = true;
      if (dy >= 0) { d = Math.max(d, dy + 16); u = Math.max(u, (dy + 16) * 0.14); }
      else { u = Math.max(u, -dy * 0.9); d = Math.max(d, 14 - dy * 0.2); }
      w = Math.max(w, Math.abs(fx0) - this.mw * 0.55);
      this.look.x = fx0; this.look.y = fy0; this.lookT = 0.4;
    }
    if (this.auto) {
      const a = this.auto;
      a.t += dt * 30;
      const q = a.s[Math.floor(a.t)];
      if (!q) { this.auto = null; if (a.done) a.done(); }
      else { u = q[0]; d = q[1]; w = q[2]; hold = true; }
    }
    for (const s of [this.up, this.down, this.wide]) {
      s.k = hold ? 620 : 240;
      s.d = hold ? 34 : 10;
    }
    this.up.to = clamp(u, 0, 80);
    this.down.to = clamp(d, 0, 160);
    this.wide.to = clamp(w, 0, 95);
    this.up.step(dt);
    this.down.step(dt);
    this.wide.step(dt);

    // Pulled parts snap back with a wobble
    for (let i = this.grabs.length - 1; i >= 0; i--) {
      const g = this.grabs[i];
      if (g.held) continue;
      g.vx += (-g.dx * 210 - g.vx * 9) * dt;
      g.vy += (-g.dy * 210 - g.vy * 9) * dt;
      g.dx += g.vx * dt;
      g.dy += g.vy * dt;
      if (Math.hypot(g.dx, g.dy) < 0.3 && Math.hypot(g.vx, g.vy) < 2) this.grabs.splice(i, 1);
    }
    this.lookT -= dt;
    if (this.lookT < -2.4) {
      this.lookT = rand(0.3, 1);
      this.look.x = rand(-70, 70);
      this.look.y = rand(-40, 40);
    }
    this.sing(dt, scene);
  }

  amp() {
    const gap = Math.max(0, this.up.x + this.down.x), wn = clamp(this.wide.x / 80);
    if (gap < 5 && wn < 0.06) return 0;
    return clamp((gap / 130) * 1.45 + wn * 0.4 + 0.12);
  }

  sing(dt, scene) {
    const gap = Math.max(0, this.up.x + this.down.x), area = clamp(gap / 130), wn = clamp(this.wide.x / 80);
    const amp = this.amp(), V = VOICE_FX[this.fx] || VOICE_FX.normal;
    if (amp > 0.02) {
      this.quiet = 0;
      if (!this.voice) this.voice = audio.singer({ wave: V.wave, vib: V.vib, vibRate: V.rate, trem: V.trem });
      let midi;
      if (this.fixed !== null) midi = this.fixed;
      else if (scene.mode === 'song' && !this.auto) midi = scene.songMidi(this, area);
      else {
        const st = Math.round(area * 8 + wn * 1.5);
        if (st !== this.step) {
          this.step = st;
          this.bump.kick(0.6);
          if (this.auto == null && st > 0) haptic();
        }
        midi = penta(st, this.def.base);
      }
      this.midi = midi;
      const f = hz(midi) * V.pm * this.pm, fm = this.def.fm * V.fm;
      // A tall open mouth is "ah", a wide one is "ee", a small round one is "oo"
      const F1 = lerp(320, 860, area) * fm, F2 = lerp(lerp(820, 1250, area), 2150, wn) * fm, F3 = 2650 * fm;
      if (this.voice) this.voice.set(f, amp * (this.fixed !== null ? 0.75 : 1), [F1, F2, F3], V.step ? 0.012 : 0.05);
      // Notes fly out of a singing mouth
      this.noteT -= dt;
      if (this.noteT <= 0 && amp > 0.22) {
        this.noteT = lerp(0.3, 0.13, amp);
        const [mx, my] = this.warpG(0, this.my + this.down.x * 0.4);
        const dir = Math.random() < 0.5 ? -1 : 1;
        fx.add({ kind: 'note', x: this.cx + mx * this.k, y: this.cy + my * this.k, vx: dir * rand(30, 110), vy: rand(-170, -80), g: -24, size: rand(22, 34) * clamp(this.k * 1.6, 0.7, 1.3), life: 1.1, color: pick(['#FF5C8F', '#8C68F2', '#3FD0C9', '#FFB02E', '#5698FF']), rot: rand(-0.3, 0.3), spin: rand(-1, 1) });
      }
      scene.sung = (scene.sung || 0) + dt;
    } else if (this.voice) {
      this.voice.set(hz(this.midi) * V.pm * this.pm, 0);
      this.quiet += dt;
      if (this.quiet > 0.7) this.closeVoice();
    }
  }
  closeVoice() {
    if (this.voice) this.voice.close();
    this.voice = null;
    this.step = -1;
  }

  // --- drawing ---------------------------------------------------------------------------
  drawBody(c) {
    const col = this.def.col;
    if (this.def.head === 'ghost' || this.noBody) return;
    const y = 150 + this.down.x * 0.5;
    c.fillStyle = clay(c, 0, y, 150, dark(col, 0.08));
    ell(c, 0, y + 70, 150, 130);
    c.fill();
  }

  drawEars(c) {
    const d = this.def, col = d.col, t = this.t;
    const sway = Math.sin(t * 2.2 + this.seed) * 0.05;
    switch (d.ears) {
      case 'sprout': {
        c.strokeStyle = '#5FBF72';
        c.lineWidth = 9;
        c.lineCap = 'round';
        this.path(c, [[0, -92], [2, -112], [5, -128]], false);
        c.stroke();
        this.fill(c, -18, -142, 15, 27, '#7ADB80', -0.7 + sway);
        this.fill(c, 24, -142, 15, 27, '#92E58E', 0.7 + sway);
        break;
      }
      case 'cat':
        for (const s of [-1, 1]) {
          c.fillStyle = clay(c, s * 62, -100, 40, col);
          this.path(c, [[s * 88, -56], [s * 84, -112], [s * 72, -142], [s * 52, -116], [s * 32, -84]]);
          c.fill();
          c.fillStyle = d.inner;
          this.path(c, [[s * 74, -74], [s * 74, -108], [s * 69, -124], [s * 54, -102], [s * 44, -84]]);
          c.fill();
        }
        break;
      case 'bunny':
        for (const s of [-1, 1]) {
          this.fill(c, s * 42, -146, 25, 68, col, s * 0.12 + sway);
          c.fillStyle = d.inner;
          this.blob(c, s * 42, -146, 13, 50, s * 0.12 + sway);
          c.fill();
        }
        break;
      case 'frog':
        for (const s of [-1, 1]) this.fill(c, s * 54, -76, 37, 35, col);
        break;
      case 'mane':
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU + 0.1;
          this.fill(c, Math.cos(a) * 112, Math.sin(a) * 106, 36, 36, i % 2 ? d.mane : dark(d.mane, 0.1));
        }
        for (const s of [-1, 1]) this.fill(c, s * 68, -74, 22, 22, col);
        break;
      case 'bolts':
        for (const s of [-1, 1]) {
          c.fillStyle = '#7C93B8';
          this.path(c, [[s * 92, -18], [s * 124, -18], [s * 124, 18], [s * 92, 18]]);
          c.fill();
          this.fill(c, s * 130, 0, 12, 12, '#FFC233');
        }
        c.strokeStyle = '#7C93B8';
        c.lineWidth = 7;
        this.path(c, [[0, -92], [0, -134]], false);
        c.stroke();
        this.fill(c, 0, -140, 13, 13, Math.sin(this.t * 5) > 0 ? '#FF7F9F' : '#FFC233');
        break;
      case 'antenna':
        for (const s of [-1, 1]) {
          c.strokeStyle = dark(col, 0.2);
          c.lineWidth = 7;
          c.lineCap = 'round';
          this.path(c, [[s * 26, -104], [s * 38 + sway * 40, -132], [s * 52 + sway * 70, -152]], false);
          c.stroke();
          this.fill(c, s * 54 + sway * 70, -158, 14, 14, '#FF8FC4');
        }
        break;
      case 'small':
        for (const s of [-1, 1]) {
          this.fill(c, s * 76, -74, 20, 24, col, s * 0.4);
          c.fillStyle = d.inner;
          this.blob(c, s * 76, -72, 10, 13, s * 0.4);
          c.fill();
        }
        break;
      case 'rays':
        c.fillStyle = '#FFB02E';
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * TAU + t * 0.12, r = 132 + Math.sin(t * 2.4 + i) * 5;
          this.blob(c, Math.cos(a) * r, Math.sin(a) * r, 18, 9, a, 10);
          c.fill();
        }
        break;
      case 'stem':
        for (const a of [-1.1, -0.5, 0, 0.5, 1.1]) {
          const x = Math.sin(a) * 34, y = -84 - Math.cos(a) * 18;
          this.fill(c, x, y, 11, 24, '#67CF74', a);
        }
        c.strokeStyle = '#4DBE6A';
        c.lineWidth = 9;
        c.lineCap = 'round';
        this.path(c, [[0, -84], [4, -112]], false);
        c.stroke();
        break;
      case 'human':
        for (const s of [-1, 1]) {
          this.fill(c, s * 92, 2, 16, 24, d.col);
          c.fillStyle = dark(d.col, 0.12);
          this.blob(c, s * 92, 2, 8, 14);
          c.fill();
        }
        // A little white hair over each ear
        for (const s of [-1, 1]) {
          for (const [x, y, r] of [[76, -44, 16], [90, -28, 14], [64, -60, 14]]) this.fill(c, s * x, y, r, r, '#F6F3EE');
        }
        break;
      case 'dragon':
        for (const s of [-1, 1]) {
          c.fillStyle = clay(c, s * 46, -110, 30, '#FFE27D');
          this.path(c, [[s * 26, -84], [s * 40, -122], [s * 56, -150], [s * 62, -116], [s * 66, -74]]);
          c.fill();
        }
        for (let i = -1; i <= 1; i++) {
          c.fillStyle = '#FFBE8A';
          this.path(c, [[i * 22 - 10, -92], [i * 22, -122 + Math.abs(i) * 8], [i * 22 + 10, -92]]);
          c.fill();
        }
        break;
      default:
    }
  }

  drawEyes(c) {
    const d = this.def, gap = this.up.x + this.down.x;
    const blink = this.blinkAmount();
    const lk = Math.hypot(this.look.x, this.look.y - (-24)) || 1;
    const lx = (this.look.x / lk) * Math.min(1, lk / 60), ly = ((this.look.y + 24) / lk) * Math.min(1, lk / 60);
    const passion = gap > 104;
    const wow = 1 + clamp(gap / 90) * 0.24;
    const squint = this.grabs.some((g) => g.held) || this.squint > 0.2;
    const kind = d.eyes;
    if (kind === 'led') {
      for (const s of [-1, 1]) {
        const [X, Y] = this.warp(s * 40, -22);
        c.save();
        c.shadowColor = '#7FF0FF';
        c.shadowBlur = 16;
        c.fillStyle = '#AFF6FF';
        if (blink > 0.6) rr(c, X - 22, Y - 3, 44, 6, 3);
        else rr(c, X - 21 - (wow - 1) * 10, Y - 19 * wow, 42 + (wow - 1) * 20, 38 * wow, 10);
        c.fill();
        c.restore();
        if (blink <= 0.6) {
          c.fillStyle = '#26406A';
          ell(c, X + lx * 8, Y + ly * 6, 8, 11);
          c.fill();
        }
      }
      return;
    }
    if (kind === 'alien') {
      const spots = [[-44, -30, 28, 36, -0.35], [44, -30, 28, 36, 0.35], [0, -74, 20, 24, 0]];
      for (const [x, y, rx, ry, rot] of spots) {
        c.fillStyle = '#231A4C';
        this.blob(c, x, y, rx * wow, ry * wow * (1 - blink * 0.9), rot);
        c.fill();
        const [X, Y] = this.warp(x, y);
        c.fillStyle = '#fff';
        ell(c, X - rx * 0.28 + lx * 6, Y - ry * 0.34 + ly * 5, rx * 0.26, ry * 0.2);
        c.fill();
        ell(c, X + rx * 0.3 + lx * 6, Y + ry * 0.26 + ly * 5, rx * 0.12);
        c.fill();
      }
      return;
    }
    const ex = kind === 'top' ? 54 : kind === 'small' ? 46 : kind === 'specs' ? 36 : 40;
    const ey = kind === 'top' ? -82 : kind === 'small' ? -30 : kind === 'specs' ? -26 : -24;
    const er = kind === 'small' ? 13 : kind === 'top' ? 24 : kind === 'hollow' ? 19 : kind === 'specs' ? 15 : 26;
    for (const s of [-1, 1]) {
      const x = s * ex;
      if (d.brow) {
        c.strokeStyle = d.brow;
        c.lineWidth = 13;
        c.lineCap = 'round';
        const by = ey - 34 - clamp(gap / 3, 0, 16);
        this.path(c, [[x - 18, by + 5], [x, by - 3], [x + 18, by + 5]], false);
        c.stroke();
      }
      if (passion || (squint && kind !== 'hollow')) {
        // Eyes shut tight: singing from the heart, or being tickled
        c.strokeStyle = '#3A2A57';
        c.lineWidth = 7;
        c.lineCap = 'round';
        if (passion) this.path(c, [[x - er * 0.8, ey + 6], [x, ey - er * 0.5], [x + er * 0.8, ey + 6]], false);
        else this.path(c, [[x - s * er * 0.8, ey - er * 0.5], [x + s * er * 0.5, ey], [x - s * er * 0.8, ey + er * 0.5]], false);
        c.stroke();
        continue;
      }
      if (blink > 0.7) {
        c.strokeStyle = '#3A2A57';
        c.lineWidth = 6;
        c.lineCap = 'round';
        this.path(c, [[x - er * 0.8, ey], [x, ey + er * 0.4], [x + er * 0.8, ey]], false);
        c.stroke();
        continue;
      }
      const ry = er * 1.1 * wow * (1 - blink * 0.8);
      if (kind === 'hollow') {
        c.fillStyle = '#3B2E66';
        this.blob(c, x, ey, er * wow, ry * 1.2);
        c.fill();
        const [X, Y] = this.warp(x, ey);
        c.fillStyle = '#fff';
        ell(c, X - er * 0.3 + lx * 4, Y - ry * 0.5 + ly * 3, er * 0.26);
        c.fill();
        continue;
      }
      c.fillStyle = '#FFFFFF';
      this.blob(c, x, ey, er * wow, ry);
      c.fill();
      const [X, Y] = this.warp(x, ey);
      const px = X + lx * er * 0.34, py = Y + ly * er * 0.34;
      if (kind === 'cat') {
        c.fillStyle = '#58C97A';
        ell(c, px, py, er * 0.74, ry * 0.86);
        c.fill();
        c.fillStyle = '#2A1B46';
        ell(c, px, py, er * 0.26 * wow, ry * 0.74);
        c.fill();
      } else if (kind === 'small' || kind === 'specs') {
        c.fillStyle = '#2A1B46';
        ell(c, px, py, er * 0.62, ry * 0.66);
        c.fill();
      } else {
        const g = c.createRadialGradient(px, py + er * 0.4, 1, px, py, er * 0.86);
        g.addColorStop(0, '#9C7BE8');
        g.addColorStop(0.55, '#5A3FA8');
        g.addColorStop(1, '#2D1E4C');
        c.fillStyle = g;
        ell(c, px, py, er * 0.72, ry * 0.78);
        c.fill();
      }
      c.fillStyle = '#fff';
      ell(c, px - er * 0.24, py - ry * 0.36, er * 0.24);
      c.fill();
      ell(c, px + er * 0.24, py + ry * 0.24, er * 0.11);
      c.fill();
    }
    if (kind === 'specs') this.drawSpecs(c, 36, -26, 27, '#6E5A4C');
  }

  drawSpecs(c, ex, ey, r, col) {
    c.strokeStyle = col;
    c.lineWidth = 7;
    c.fillStyle = 'rgba(200,235,255,.22)';
    for (const s of [-1, 1]) {
      this.blob(c, s * ex, ey, r, r);
      c.fill();
      c.stroke();
    }
    this.path(c, [[-ex + r, ey], [0, ey - 5], [ex - r, ey]], false);
    c.stroke();
  }

  blinkAmount() {
    const p = (this.t + this.seed * 2.31) % (3.1 + (this.seed % 3) * 0.7);
    return p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0;
  }

  drawNose(c) {
    const d = this.def, ny = d.ny ?? 14;
    switch (d.nose) {
      case 'dot':
        this.fill(c, 0, ny, 8, 6, dark(d.col, 0.3));
        break;
      case 'pink':
        c.fillStyle = '#FF7FA2';
        this.path(c, [[-11, ny - 4], [11, ny - 4], [0, ny + 8]]);
        c.fill();
        break;
      case 'brown':
        this.fill(c, 0, ny, 18, 13, '#6E3F24');
        break;
      case 'two':
        c.fillStyle = dark(d.col, 0.42);
        for (const s of [-1, 1]) {
          this.blob(c, s * 13, ny - 4, 5, 6, 0, 8);
          c.fill();
        }
        break;
      case 'nostril':
        this.fill(c, 0, ny + 6, 66, 44, light(d.col, 0.24));
        c.fillStyle = dark(d.col, 0.42);
        for (const s of [-1, 1]) {
          this.blob(c, s * 28, ny - 2, 9, 12, s * 0.3, 8);
          c.fill();
        }
        break;
      case 'big':
        this.fill(c, 0, ny + 4, 24, 22, '#FF9E8A');
        break;
      default:
    }
  }

  lips() {
    const N = 12, up = Math.max(0, this.up.x), dn = Math.max(0, this.down.x), wd = Math.max(0, this.wide.x);
    const hw = this.mw + wd, my = this.my;
    const smile = (this.def.smile ?? 12) * (1 - clamp((up + dn) / 70));
    const U = [], L = [];
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 2 - 1, x = u * hw, b = Math.pow(1 - u * u, 0.55), y0 = my + smile * (1 - u * u);
      U.push(this.warpG(x, y0 - up * b));
      L.push(this.warpG(x, y0 + dn * b));
    }
    return { U, L, N };
  }

  drawMouth(c) {
    const d = this.def, gap = Math.max(0, this.up.x) + Math.max(0, this.down.x);
    const { U, L, N } = this.lips();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (gap < 4) {
      c.strokeStyle = d.lip;
      c.lineWidth = 7;
      spline(c, L, false);
      c.stroke();
      return;
    }
    const pts = [...U, ...L.slice(1, N).reverse()];
    const top = U[N >> 1], bot = L[N >> 1];
    spline(c, pts, true);
    const g = c.createLinearGradient(0, top[1], 0, bot[1]);
    g.addColorStop(0, '#5C1F40');
    g.addColorStop(1, '#8A2F55');
    c.fillStyle = g;
    c.fill();
    c.save();
    c.clip();
    const midX = (top[0] + bot[0]) / 2, hw = Math.abs(U[N][0] - U[0][0]) / 2;
    // Tongue
    c.fillStyle = clay(c, midX, bot[1], hw * 0.7, '#FF7FA2');
    ell(c, bot[0], bot[1] - gap * 0.02, Math.min(hw * 0.72, 56), Math.min(gap * 0.36, 44));
    c.fill();
    c.strokeStyle = 'rgba(180,50,90,.5)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(bot[0], bot[1] - gap * 0.32);
    c.lineTo(bot[0], bot[1]);
    c.stroke();
    // A dangly uvula when the mouth is huge
    if (gap > 70) {
      const sw = Math.sin(this.t * 22) * 3 * clamp(this.amp());
      c.fillStyle = '#E56B8D';
      ell(c, top[0] + sw, top[1] + 12 + clamp((gap - 70) / 3, 0, 12), 8, 13);
      c.fill();
    }
    // Teeth
    c.fillStyle = '#FFFDF6';
    const at = (u) => U[Math.round(((u + 1) / 2) * N)];
    if (d.teeth === 'two' || d.teeth === 'buck') {
      const w = d.teeth === 'buck' ? 17 : 13, h = d.teeth === 'buck' ? 30 : 14;
      for (const s of [-1, 1]) {
        const p = at(s * 0.12);
        rr(c, p[0] - w / 2, p[1] - 8, w, h + 8, 5);
        c.fill();
      }
    } else if (d.teeth === 'fangs') {
      for (const s of [-1, 1]) {
        const p = at(s * 0.56);
        c.beginPath();
        c.moveTo(p[0] - 10, p[1] - 6);
        c.lineTo(p[0], p[1] + 22);
        c.lineTo(p[0] + 10, p[1] - 6);
        c.closePath();
        c.fill();
      }
    } else if (d.teeth === 'grid') {
      for (let i = -3; i <= 3; i++) {
        const p = at((i / 4) * 0.9), q = L[Math.round((((i / 4) * 0.9 + 1) / 2) * N)];
        rr(c, p[0] - 7, p[1] - 3, 14, 16, 2);
        c.fill();
        rr(c, q[0] - 7, q[1] - 13, 14, 16, 2);
        c.fill();
      }
    } else if (d.teeth === 'tusks') {
      for (const s of [-1, 1]) {
        const q = L[Math.round(((s * 0.5 + 1) / 2) * N)];
        rr(c, q[0] - 10, q[1] - 30, 20, 34, 8);
        c.fill();
      }
    }
    c.restore();
    c.strokeStyle = d.lip;
    c.lineWidth = 7.5;
    spline(c, pts, true);
    c.stroke();
    gloss(c, bot[0] - hw * 0.34, bot[1] + 1, hw * 0.28, 4, 0.5, 0);
  }

  drawHat(c) {
    const col = dark(this.def.col, 0.1), topY = this.def.head === 'wide' ? -86 : this.def.head === 'tall' || this.def.head === 'egg' ? -106 : -94;
    switch (this.hat) {
      case 'party':
        c.fillStyle = clay(c, 0, topY - 50, 60, '#FF7DAE');
        this.path(c, [[-46, topY + 8], [-26, topY - 40], [-3, topY - 92], [3, topY - 92], [26, topY - 40], [46, topY + 8], [0, topY + 18]]);
        c.fill();
        for (const [x, y] of [[-14, topY - 12], [12, topY - 28], [-4, topY - 52]]) {
          c.fillStyle = pickStable(x);
          this.blob(c, x, y, 7, 7, 0, 8);
          c.fill();
        }
        this.fill(c, 0, topY - 98, 13, 13, P.butter);
        break;
      case 'crown': {
        c.fillStyle = '#FFC233';
        const pts = [[-50, topY + 10], [-56, topY - 40], [-28, topY - 14], [0, topY - 56], [28, topY - 14], [56, topY - 40], [50, topY + 10]];
        c.beginPath();
        pts.forEach((p, i) => {
          const q = this.warp(p[0], p[1]);
          c[i ? 'lineTo' : 'moveTo'](q[0], q[1]);
        });
        c.closePath();
        c.fill();
        c.lineJoin = 'round';
        c.lineWidth = 5;
        c.strokeStyle = '#FFE27D';
        c.stroke();
        for (const [x, cc] of [[-30, P.rose], [0, P.sky], [30, P.mint]]) this.fill(c, x, topY - 5, 8, 8, cc);
        break;
      }
      case 'specs':
        if (this.def.eyes !== 'specs') this.drawSpecs(c, 40, -24, 36, '#FF5C8F');
        break;
      case 'bow':
        for (const s of [-1, 1]) this.fill(c, s * 32, topY - 6, 32, 22, '#FF5C8F', s * 0.2);
        this.fill(c, 0, topY - 6, 11, 11, '#FFC233');
        break;
      case 'stache':
        if (!this.def.stache) this.drawStache(c, this.my - 12, '#6B4226', col);
        break;
      default:
    }
  }

  drawStache(c, y, color) {
    const wig = Math.sin(this.t * 3) * 3;
    for (const s of [-1, 1]) {
      c.fillStyle = clay(c, s * 26, y, 34, color);
      this.path(c, [[s * 2, y - 12], [s * 26, y - 16], [s * 54, y - 8 + wig], [s * 66, y - 22 + wig], [s * 58, y + 4 + wig], [s * 30, y + 12], [s * 4, y + 6]]);
      c.fill();
    }
  }

  draw(c) {
    const d = this.def, q = this.bump.x;
    c.save();
    c.translate(this.cx, this.cy);
    c.scale(this.k * (2 - q), this.k * q);
    this.drawBody(c);
    this.drawEars(c);
    // Head
    const [hX, hY] = this.warp(0, 0);
    c.fillStyle = clay(c, hX, hY, 124, d.col);
    spline(c, headPts(d.head).map((p) => this.warp(p[0], p[1])), true);
    c.fill();
    if (d.stripes) {
      c.fillStyle = alpha(d.stripes, 0.75);
      for (const s of [-1, 1]) {
        for (const y of [-34, 0, 34]) {
          this.blob(c, s * 86, y, 16, 5, s * 0.15, 10);
          c.fill();
        }
      }
      this.blob(c, 0, -80, 6, 14, 0, 10);
      c.fill();
    }
    if (d.bald) {
      const [X, Y] = this.warp(-30, -74);
      gloss(c, X, Y, 36, 16, 0.5);
    } else {
      const [X, Y] = this.warp(-38, -60);
      gloss(c, X, Y, 42, 22, 0.6);
    }
    // Cheeks flush as the song gets bigger
    c.fillStyle = alpha('#FF7FA8', 0.34 + clamp(this.amp()) * 0.3);
    for (const s of [-1, 1]) {
      this.blob(c, s * 70, d.head === 'wide' ? 8 : 18, 20, 13, 0, 10);
      c.fill();
    }
    if (d.whisk) {
      c.strokeStyle = alpha('#3A2A57', 0.32);
      c.lineWidth = 3;
      c.lineCap = 'round';
      for (const s of [-1, 1]) {
        for (const dy of [-6, 6]) {
          this.path(c, [[s * 48, 22 + dy], [s * 96, 14 + dy * 2.2]], false);
          c.stroke();
        }
      }
    }
    this.drawEyes(c);
    this.drawNose(c);
    this.drawMouth(c);
    if (d.stache) this.drawStache(c, this.my - 18, '#F6F3EE');
    this.drawHat(c);
    c.restore();
  }
}

const COLS_ = ['#FFC233', '#5698FF', '#3FD0C9', '#8C68F2'];
const pickStable = (x) => COLS_[Math.abs(Math.round(x)) % 4];

function tileSprite(def) {
  return sprite('singTile:' + def.id, 66, 66, (x) => {
    const f = new Face(def);
    f.t = 0;
    f.k = 0.21;
    f.cx = 33;
    f.cy = 36;
    x.save();
    f.draw(x);
    x.restore();
  }, 2);
}

// ---- icons for the round buttons ----------------------------------------------------
function iconMode(c, m, r) {
  c.save();
  c.scale(r / 26, r / 26);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (m === 'solo') {
    c.fillStyle = '#fff';
    ell(c, 0, 0, 17);
    c.fill();
    c.fillStyle = '#8A2F55';
    ell(c, 0, 4, 10, 8);
    c.fill();
    c.fillStyle = P.ink;
    for (const s of [-1, 1]) { ell(c, s * 7, -7, 2.6, 3.2); c.fill(); }
  } else if (m === 'song') {
    c.fillStyle = '#fff';
    c.strokeStyle = '#fff';
    c.lineWidth = 3.6;
    ell(c, -8, 10, 6.5, 5, -0.3);
    c.fill();
    ell(c, 9, 6, 6.5, 5, -0.3);
    c.fill();
    c.beginPath();
    c.moveTo(-3, 9); c.lineTo(-3, -12); c.lineTo(14, -16); c.lineTo(14, 5);
    c.stroke();
  } else if (m === 'choir') {
    for (const [x, y, r2, col] of [[-12, 4, 10, '#FFE27D'], [12, 4, 10, '#BFE9FF'], [0, -6, 12, '#fff']]) {
      c.fillStyle = col;
      ell(c, x, y, r2);
      c.fill();
      c.fillStyle = '#8A2F55';
      ell(c, x, y + r2 * 0.3, r2 * 0.45, r2 * 0.4);
      c.fill();
    }
  } else {
    // Echo: a big face and a small one saying the same
    c.fillStyle = '#fff';
    ell(c, -7, 0, 13);
    c.fill();
    c.fillStyle = '#FFE27D';
    ell(c, 13, 8, 8.5);
    c.fill();
    c.fillStyle = '#8A2F55';
    ell(c, -7, 4, 6, 5);
    c.fill();
    ell(c, 13, 10, 3.6, 3.2);
    c.fill();
  }
  c.restore();
}

function iconVoice(c, name, r) {
  c.save();
  c.scale(r / 26, r / 26);
  c.strokeStyle = '#fff';
  c.fillStyle = '#fff';
  c.lineWidth = 4.2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  if (name === 'normal') {
    c.moveTo(-15, 0); c.bezierCurveTo(-8, -15, -3, -15, 0, 0); c.bezierCurveTo(3, 15, 8, 15, 15, 0);
    c.stroke();
  } else if (name === 'high') {
    // Tiny mouse ears
    ell(c, 0, 4, 10);
    c.fill();
    for (const s of [-1, 1]) { ell(c, s * 10, -9, 7); c.fill(); }
  } else if (name === 'low') {
    // A big heavy bear
    ell(c, 0, 2, 16, 15);
    c.fill();
    for (const s of [-1, 1]) { ell(c, s * 14, -12, 5.5); c.fill(); }
    c.fillStyle = P.ink;
    ell(c, 0, 5, 5, 4);
    c.fill();
  } else if (name === 'wobble') {
    c.moveTo(-17, 0);
    for (let i = -17; i <= 17; i += 2) c.lineTo(i, Math.sin(i * 0.9) * 9);
    c.stroke();
  } else {
    c.moveTo(-16, 6); c.lineTo(-16, -7); c.lineTo(-6, -7); c.lineTo(-6, 7); c.lineTo(5, 7); c.lineTo(5, -7); c.lineTo(16, -7); c.lineTo(16, 6);
    c.stroke();
  }
  c.restore();
}

function iconHat(c, hat, r) {
  c.save();
  c.scale(r / 26, r / 26);
  c.fillStyle = '#fff';
  c.strokeStyle = '#fff';
  c.lineWidth = 3.6;
  c.lineCap = 'round';
  if (hat === 'party') {
    c.beginPath(); c.moveTo(-13, 14); c.lineTo(0, -15); c.lineTo(13, 14); c.closePath(); c.fill();
  } else if (hat === 'crown') {
    c.beginPath(); c.moveTo(-15, 11); c.lineTo(-16, -10); c.lineTo(-7, -1); c.lineTo(0, -14); c.lineTo(7, -1); c.lineTo(16, -10); c.lineTo(15, 11); c.closePath(); c.fill();
  } else if (hat === 'specs') {
    for (const s of [-1, 1]) { ell(c, s * 9, 0, 7.5); c.stroke(); }
  } else if (hat === 'bow') {
    for (const s of [-1, 1]) { ell(c, s * 9, 0, 9, 6.5, s * 0.2); c.fill(); }
  } else if (hat === 'stache') {
    for (const s of [-1, 1]) { ell(c, s * 8, 2, 9, 4.6, s * -0.3); c.fill(); }
  } else {
    softStar(c, 0, 0, 13);
    c.fill();
  }
  c.restore();
}

// ---- the scene ----------------------------------------------------------------------
export const sing = {
  tint: '#FFCFE0',

  enter() {
    this.t = 0;
    this.mode = 'solo';
    this.idx = clamp(save.data.singFace || 0, 0, FACES.length - 1);
    this.fxName = null;
    this.hat = 'none';
    this.scroll = 0;
    this.scrollV = 0;
    this.sung = 0;
    this.starred = false;
    this.songI = save.data.singSong || 0;
    this.noteI = 0;
    this.nudge = 4;
    this.rec = null;
    music.play(null);
    this.layout();
    this.buildFaces();
    this.scrollTo();
    if (!save.data.seen.sing) this.showHint();
  },

  exit() {
    this.faces.forEach((f) => f.closeVoice());
    if (this.copy) this.copy.closeVoice();
    save.data.singFace = this.idx;
    save.data.singSong = this.songI;
    save.touch();
  },

  showHint() {
    const f = this.faces[0];
    if (!f) return;
    const y = f.cy + f.my * f.k;
    hint.set({ from: [f.cx, y], to: [f.cx, y + 90 * f.k], delay: 1.4 });
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    const bottom = app.safeBottom * 0.7;
    this.tileY = H - 44 - bottom;
    this.modeY = H - 118 - bottom;
    this.top = Math.max(app.safeTop, 8) + 12;
    this.areaB = this.modeY - 36;
    const y = Math.max(app.safeTop, 10) + 34, right = W - 40, modes = ['solo', 'song', 'choir', 'echo'];
    const cx = W / 2, gap = Math.min(78, (W - 30) / 4);
    this.buttons = [
      ...modes.map((m, i) => new Btn({
        x: cx + (i - 1.5) * gap, y: this.modeY, r: 26, slop: 6, sound: null,
        paint: (c, r) => {
          candy(c, r, [P.rose, P.violet, P.teal, P.sun][i], this.mode === m);
          iconMode(c, m, r);
          if (this.mode === m) {
            c.lineWidth = 3.5;
            c.strokeStyle = '#fff';
            ell(c, 0, 0, r + 3);
            c.stroke();
          }
        },
        tap: () => this.setMode(m)
      })),
      new Btn({
        x: right, y, r: 25, slop: 6,
        paint: (c, r) => { candy(c, r, P.blue); iconVoice(c, this.fxName || this.main().def.fx || 'normal', r); },
        tap: () => this.nextVoice()
      }),
      new Btn({
        x: right, y: y + 62, r: 25, slop: 6,
        paint: (c, r) => { candy(c, r, P.coral); iconHat(c, this.hat === 'none' ? 'next' : this.hat, r); },
        tap: () => this.nextHat()
      }),
      new Btn({
        x: right, y: y + 124, r: 25, slop: 6, hidden: true,
        paint: (c, r) => { candy(c, r, P.violet); iconMode(c, 'song', r); },
        tap: () => this.nextSong()
      })
    ];
    this.songBtn = this.buttons[this.buttons.length - 1];
    this.songBtn.hidden = this.mode !== 'song';
  },

  resize() {
    this.layout();
    this.placeFaces();
  },

  main() { return this.faces ? this.faces[0] : { def: FACES[this.idx] }; },

  buildFaces() {
    if (this.faces) this.faces.forEach((f) => f.closeVoice());
    if (this.copy) this.copy.closeVoice();
    this.copy = null;
    const main = new Face(FACES[this.idx], this.fxName || FACES[this.idx].fx || 'normal');
    main.hat = this.hat;
    this.faces = [main];
    if (this.mode === 'choir') {
      const cols = this.W > 640 ? 5 : 4;
      const others = FACES.filter((f) => f !== FACES[this.idx]).sort(() => Math.random() - 0.5);
      for (let i = 1; i < cols; i++) this.faces.push(new Face(others[i - 1], this.fxName || others[i - 1].fx || 'normal'));
      const notes = [60, 64, 67, 72, 76];
      this.faces.forEach((f, i) => { f.fixed = notes[i] + (f.def.base < 56 ? -12 : 0); f.seed = i * 1.3; f.noBody = true; });
    }
    if (this.mode === 'echo') {
      const others = FACES.filter((f) => f !== FACES[this.idx] && f.id !== 'ghost');
      this.copy = new Face(pick(others), 'high');
      this.copy.pm = 0.8;
      this.copy.noBody = true;
      main.noBody = true;
    }
    this.placeFaces();
  },

  placeFaces() {
    const W = this.W, top = this.top, area = this.areaB - top;
    if (this.mode === 'choir') {
      const n = this.faces.length, wide = W > 640;
      const cols = wide ? n : 2, rows = Math.ceil(n / cols);
      const cw = (W - 12) / cols, ch = (area - 40) / rows;
      const k = Math.min(cw / 290, ch / 290, 0.95);
      this.faces.forEach((f, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        f.k = k;
        f.cx = 6 + cw * (col + 0.5);
        f.cy = top + 40 + ch * (row + 0.45);
      });
    } else if (this.mode === 'echo') {
      const f = this.faces[0], side = W > 640;
      if (side) {
        const k = Math.min(W / 720, area / 380, 1.1);
        f.k = k;
        f.cx = W * 0.36;
        f.cy = top + area * 0.48;
        this.copy.k = k * 0.72;
        this.copy.cx = W * 0.74;
        this.copy.cy = top + area * 0.56;
      } else {
        const k = Math.min(W / 420, area / 560, 0.85);
        f.k = k;
        f.cx = W * 0.5;
        f.cy = top + 30 + 140 * k;
        this.copy.k = k * 0.64;
        this.copy.cx = W * 0.5;
        this.copy.cy = this.areaB - 106 * this.copy.k;
      }
    } else {
      const f = this.faces[0];
      const k = Math.min((W - 100) / 300, area / 380, 1.6);
      f.k = k;
      f.cx = W / 2;
      f.cy = top + area * 0.52;
    }
  },

  setMode(m) {
    if (this.mode === m) return;
    this.mode = m;
    this.songBtn.hidden = m !== 'song';
    audio.note('marimba', penta(['solo', 'song', 'choir', 'echo'].indexOf(m) + 2), { vol: 0.6 });
    haptic();
    this.noteI = 0;
    this.buildFaces();
    if (m === 'song') {
      audio.sparkle(2, 3, 0.3);
      const f = this.faces[0];
      hint.set({ from: [f.cx, f.cy + f.my * f.k], to: [f.cx, f.cy + (f.my + 80) * f.k], delay: 1.2 });
    } else hint.clear();
  },

  setFace(i) {
    if (i === this.idx && this.mode !== 'choir') {
      this.faces[0].bump.kick(4);
      audio.voice('giggle', 1.1, 0.5);
      return;
    }
    this.idx = i;
    this.fxName = null;
    audio.sfx('swish');
    audio.voice('wow', clamp(FACES[i].base / 60, 0.7, 1.4), 0.6);
    this.buildFaces();
    this.faces[0].bump.kick(6);
    fx.sparkle(this.faces[0].cx, this.faces[0].cy, 12);
    haptic();
  },

  nextVoice() {
    const cur = this.fxName || this.faces[0].fx;
    this.fxName = FX_ORDER[(FX_ORDER.indexOf(cur) + 1) % FX_ORDER.length];
    this.faces.forEach((f) => { f.closeVoice(); f.fx = this.fxName; });
    // A short sample, so that the choice can be heard straight away
    const V = VOICE_FX[this.fxName], f = this.faces[0];
    const v = audio.singer({ wave: V.wave, vib: V.vib, vibRate: V.rate, trem: V.trem });
    if (v) {
      const fm = f.def.fm * V.fm;
      v.set(hz(f.def.base + 7) * V.pm, 0.7, [750 * fm, 1150 * fm, 2650 * fm], 0.01);
      wait(0.38, () => v.close());
    }
    f.bump.kick(3);
    fx.sparkle(f.cx, f.cy + f.my * f.k, 6);
  },

  nextHat() {
    this.hat = HATS[(HATS.indexOf(this.hat) + 1) % HATS.length];
    this.faces.forEach((f) => { f.hat = this.hat; f.bump.kick(3); });
    audio.sfx('swish');
    audio.sparkle(1, 3, 0.3);
    fx.sparkle(this.faces[0].cx, this.faces[0].cy - 90 * this.faces[0].k, 10);
  },

  nextSong() {
    this.songI = (this.songI + 1) % SONGS.length;
    this.noteI = 0;
    audio.sparkle(this.songI, 4, 0.35);
    this.playChord(SONGS[this.songI].n[0]);
  },

  // Each new opening of a mouth is the next note of the song.
  songMidi(face, area) {
    const song = SONGS[this.songI % SONGS.length];
    if (area > 0.13 && !face.noteOpen) {
      face.noteOpen = true;
      face.songNote = song.n[this.noteI % song.n.length];
      this.playChord(face.songNote);
      this.noteI++;
      face.bump.kick(2);
      haptic();
      if (this.noteI >= song.n.length) {
        this.noteI = 0;
        this.songDone();
      }
    }
    return face.songNote ?? song.n[this.noteI % song.n.length];
  },

  playChord(n) {
    const song = SONGS[this.songI % SONGS.length];
    const pc = (m) => ((m % 12) + 12) % 12;
    const ch = CHORD_SETS(song.key).find((set) => set.some((m) => pc(m) === pc(n)));
    if (!ch) return;
    const t = audio.now;
    audio.note('bass', ch[0] - 24 + (ch[0] > 66 ? -12 : 0), { vol: 0.22, wet: 0.2 });
    ch.forEach((m, i) => audio.note('harp', m, { vol: 0.17, when: t + i * 0.018, wet: 0.6 }));
  },

  songDone() {
    audio.fanfare();
    fx.confetti(this.W, this.H, 90);
    const f = this.faces[0];
    f.bump.kick(6);
    wait(1, () => { this.songI = (this.songI + 1) % SONGS.length; });
    if (!this.starredSong) {
      this.starredSong = true;
      save.earnStar();
    }
  },

  scrollTo() {
    const x = this.tileX(this.idx);
    if (x > this.W - 50) this.scroll -= x - (this.W - 70);
  },
  tileX(i) { return this.tileX0() + i * 72 + this.scroll; },
  tileX0() {
    const total = (FACES.length - 1) * 72;
    return total + 80 < this.W ? this.W / 2 - total / 2 : 40;
  },

  update(dt) {
    this.t += dt;
    if (!this.tileDown) {
      this.scroll += this.scrollV * dt;
      this.scrollV *= Math.pow(0.03, dt);
    }
    const total = (FACES.length - 1) * 72;
    const minS = Math.min(0, this.W - 80 - total);
    if (this.scroll > 0) this.scroll *= Math.pow(0.0005, dt);
    if (this.scroll < minS) this.scroll = minS + (this.scroll - minS) * Math.pow(0.0005, dt);

    for (const f of this.faces) {
      f.update(dt, this);
      // Closed again: the next opening starts a new note
      if (f.noteOpen && f.up.x + f.down.x < 12 && !f.mouth.size) f.noteOpen = false;
      else if (f.noteOpen && f.mouth.size && f.up.x + f.down.x < 8) f.noteOpen = false;
    }
    if (this.copy) this.copy.update(dt, this);

    // The copycat records her mouth and sings it back
    if (this.mode === 'echo') {
      const f = this.faces[0];
      if (f.mouth.size) {
        if (!this.rec) this.rec = [];
        if (this.rec.length < 240) {
          this.recAcc = (this.recAcc || 0) + dt * 30;
          while (this.recAcc >= 1) {
            this.recAcc -= 1;
            this.rec.push([f.up.to, f.down.to, f.wide.to]);
          }
        }
      } else if (this.rec && f.up.x + f.down.x < 10) {
        const s = this.rec;
        this.rec = null;
        if (s.length > 8 && this.copy && !this.copy.auto) {
          this.copy.look.x = -60; this.copy.lookT = 1;
          wait(0.28, () => {
            if (!this.copy) return;
            this.copy.bump.kick(3);
            this.copy.auto = {
              s, t: 0, done: () => {
                if (!this.copy) return;
                audio.voice('giggle', 1.2, 0.45);
                fx.hearts(this.copy.cx, this.copy.cy - 80 * this.copy.k, 4);
                this.copy.bump.kick(4);
              }
            };
          });
        }
      }
    }

    if (!this.starred && this.sung > 16) {
      this.starred = true;
      save.earnStar();
      save.data.seen.sing = 1;
      audio.sparkle(3, 4, 0.3);
      fx.stars(this.W / 2, this.H * 0.3, 14);
    }

    // Left alone, the face looks for attention with a tiny open-and-shut
    this.nudge -= dt;
    if (this.nudge <= 0) {
      this.nudge = rand(5, 9);
      const f = pick(this.faces);
      if (!f.mouth.size && !f.auto) {
        f.down.kick(120);
        f.up.kick(30);
        f.bump.kick(1.5);
      }
    }
  },

  drawBack(c) {
    const W = this.W, H = this.H, d = FACES[this.idx];
    const back = softBack('sing:' + d.id, W, H, d.bg[0], d.bg[1], (x) => {
      // Soft spotlight circles, a little theatre
      x.fillStyle = 'rgba(255,255,255,.16)';
      for (let i = 0; i < 6; i++) {
        const r = 90 + i * 70;
        ell(x, W / 2, H * 0.42, r);
        x.fill();
      }
      // Stage
      x.fillStyle = 'rgba(70,40,120,.16)';
      x.fillRect(0, this.modeY - 42, W, H);
      x.fillStyle = '#FFF9F1';
      rr(x, -8, this.modeY - 40, W + 16, H, 26);
      x.fill();
    });
    c.drawImage(back.cv, 0, 0, W, H);
  },

  drawSongRoad(c) {
    const song = SONGS[this.songI % SONGS.length];
    const y = Math.max(app.safeTop, 8) + 30, cx = this.W / 2, n = 7, gap = Math.min(30, (this.W - 180) / n);
    const minN = Math.min(...song.n), maxN = Math.max(...song.n);
    for (let i = -1; i < n; i++) {
      const k = (this.noteI + i + song.n.length * 2) % song.n.length;
      const m = song.n[k], x = cx + (i - 2.5) * gap;
      const yy = y + 12 - ((m - minN) / Math.max(1, maxN - minN)) * 24;
      softStar(c, x, yy, i === 0 ? 11 : 7);
      c.fillStyle = i < 0 ? 'rgba(255,255,255,.4)' : i === 0 ? P.sun : 'rgba(255,255,255,.85)';
      c.fill();
    }
  },

  draw(c) {
    this.drawBack(c);
    const clipB = this.modeY - 40;
    c.save();
    c.beginPath();
    c.rect(0, 0, this.W, clipB);
    c.clip();
    if (this.copy) this.copy.draw(c);
    for (const f of this.faces) f.draw(c);
    c.restore();
    // A stretched chin hangs over the stage edge: draw the mouth area above it
    for (const f of this.faces) {
      if (f.down.x > 8 && f.cy + (f.my + f.down.x) * f.k > clipB - 10) {
        c.save();
        c.beginPath();
        c.rect(0, clipB, this.W, this.H);
        c.clip();
        f.draw(c);
        c.restore();
      }
    }
    if (this.mode === 'song') this.drawSongRoad(c);

    // Row of faces
    FACES.forEach((d, i) => {
      const x = this.tileX(i), y = this.tileY;
      if (x < -50 || x > this.W + 50) return;
      const on = i === this.idx;
      c.fillStyle = on ? '#FFF0C8' : '#fff';
      ell(c, x, y, 32);
      c.fill();
      c.lineWidth = on ? 4 : 2;
      c.strokeStyle = on ? P.sun : '#EEE0F5';
      c.stroke();
      const s = tileSprite(d);
      c.save();
      ell(c, x, y, 30);
      c.clip();
      c.drawImage(s.cv, x - 33, y - 34, 66, 66);
      c.restore();
    });
    for (const b of this.buttons) b.draw(c);
  },

  down(p) {
    if (p.y > this.tileY - 36) {
      p.row = true;
      this.tileDown = true;
      p.lastX = p.x;
      this.scrollV = 0;
      return;
    }
    if (p.y > this.modeY - 40) return;
    // Nearest face wins: mouth first, then anything else on the head
    const order = [...this.faces].sort((a, b) => dist(p.x, p.y, a.cx, a.cy) - dist(p.x, p.y, b.cx, b.cy));
    for (const f of order) {
      const [fx0, fy0] = f.toFace(p.x, p.y);
      if (f.overMouth(fx0, fy0)) {
        f.pressMouth(p);
        save.data.seen.sing = 1;
        return;
      }
      if (f.overHead(fx0, fy0)) {
        f.grab(p, fx0, fy0);
        return;
      }
    }
    if (this.copy) {
      const [fx0, fy0] = this.copy.toFace(p.x, p.y);
      if (this.copy.overHead(fx0, fy0)) {
        this.copy.grab(p, fx0, fy0);
        return;
      }
    }
    fx.sparkle(p.x, p.y, 4);
    audio.sfx('plip', { rate: rand(0.9, 1.3), vol: 0.45 });
  },

  move(p) {
    if (p.row) {
      const dx = p.x - p.lastX;
      p.lastX = p.x;
      if (Math.abs(p.x - p.sx) > 8) {
        this.scroll += dx;
        this.scrollV = dx / Math.max(app.dt, 0.008);
      }
      return;
    }
    if (p.grab) p.grabOf.moveGrab(p);
  },

  up(p) {
    if (p.row) {
      this.tileDown = false;
      if (p.moved < 14) {
        const i = Math.round((p.x - this.tileX0() - this.scroll) / 72);
        if (i >= 0 && i < FACES.length && dist(p.x, p.y, this.tileX(i), this.tileY) < 42) this.setFace(i);
      }
      return;
    }
    if (p.mouthOf) {
      const f = p.mouthOf;
      f.mouth.delete(p);
      if (!f.mouth.size) {
        // Let go: the mouth snaps shut with a wobble
        f.bump.kick(2.5);
      }
    }
    if (p.grab) p.grabOf.releaseGrab(p);
  }
};
