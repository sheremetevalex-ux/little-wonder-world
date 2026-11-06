// A journey: a long winding path with stops, from the forest over the sea and up to a
// cloud castle. Each stop is a challenge that gently gets harder. Nothing can be
// lost: a mistake earns a soft "aww" and another try.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, vgrad, hgrad, glow, TAU, softStar, heart, groundShadow, sprite, grain, spline } from '../core/draw.js';
import { softBack, drawCloud, drawStarPickup } from '../art/world.js';
import { drawCreature, FRIENDS, FRIEND_IDS, blinkAt } from '../art/creatures.js';

const STOPS = 18;
const TYPES = ['seek', 'simon', 'pairs', 'puzzle', 'balloon'];

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((v) => v[1]);

// ========================================================================================
// HIDE AND SEEK: tap bushes, stumps and mushrooms to find the hiding friends
// ========================================================================================
function drawSpot(c, kind, s, shake, t) {
  c.save();
  c.scale(s, s);
  c.rotate(shake);
  if (kind === 'bush') {
    for (const [x, y, r, k] of [[-28, 4, 26, '#4FB86C'], [28, 4, 26, '#4FB86C'], [0, -14, 34, '#62CE7E'], [-14, 12, 24, '#58C476'], [16, 12, 24, '#58C476']]) {
      c.fillStyle = clay(c, x, y, r, k);
      ell(c, x, y, r);
      c.fill();
    }
    for (const [x, y] of [[-16, -16], [12, -24], [24, 4], [-4, 4]]) {
      c.fillStyle = '#FF7F9F';
      ell(c, x, y, 4.4);
      c.fill();
    }
  } else if (kind === 'stump') {
    c.fillStyle = hgrad(c, -32, 32, '#A9734A', '#D49A68', '#8E5E3A');
    c.beginPath();
    c.moveTo(-32, -8);
    c.lineTo(-36, 34);
    c.lineTo(36, 34);
    c.lineTo(32, -8);
    c.closePath();
    c.fill();
    c.fillStyle = '#F0CC9A';
    ell(c, 0, -8, 32, 13);
    c.fill();
    c.strokeStyle = '#C49B6A';
    c.lineWidth = 2.5;
    ell(c, 0, -8, 18, 7);
    c.stroke();
  } else if (kind === 'mush') {
    c.fillStyle = hgrad(c, -15, 15, '#FFF3E0', '#EFD9C0');
    rr(c, -15, -6, 30, 42, 11);
    c.fill();
    c.fillStyle = clay(c, 0, -14, 44, '#FF6F73');
    c.beginPath();
    c.moveTo(-42, -2);
    c.bezierCurveTo(-42, -48, 42, -48, 42, -2);
    c.quadraticCurveTo(0, 8, -42, -2);
    c.fill();
    c.fillStyle = '#FFF';
    for (const [x, y, r] of [[-19, -18, 8], [13, -26, 9], [26, -9, 5], [-4, -8, 5]]) {
      ell(c, x, y, r);
      c.fill();
    }
  } else if (kind === 'rock') {
    c.fillStyle = clay(c, 0, 4, 44, '#AEB6CF');
    c.beginPath();
    c.moveTo(-40, 32);
    c.bezierCurveTo(-48, -16, -12, -34, 8, -30);
    c.bezierCurveTo(34, -28, 48, 4, 40, 32);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(120,200,120,.8)';
    ell(c, -8, -24, 16, 7);
    c.fill();
  } else if (kind === 'leaves') {
    const cols = ['#FFB54D', '#FF8F5C', '#FFD45C', '#E8795A'];
    for (let i = 0; i < 14; i++) {
      const a = i * 2.4, r = 6 + i * 2.5;
      c.fillStyle = cols[i % 4];
      ell(c, Math.cos(a) * r, Math.sin(a) * r * 0.5 + 8, 14, 8, a);
      c.fill();
    }
  } else if (kind === 'flowers') {
    c.fillStyle = clay(c, 0, 16, 40, '#7FD86F');
    ell(c, 0, 18, 40, 20);
    c.fill();
    const cols = ['#FF82AF', '#FFD45C', '#B48BFF', '#6FD8FF', '#FF8F7A'];
    for (let i = 0; i < 7; i++) {
      const x = -30 + i * 10, y = 8 - ((i * 37) % 26);
      c.strokeStyle = '#3EAB5E';
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(x, 24);
      c.lineTo(x, y);
      c.stroke();
      c.fillStyle = cols[i % 5];
      for (let k = 0; k < 5; k++) {
        ell(c, x + Math.cos(k * 1.26) * 5, y + Math.sin(k * 1.26) * 5, 4);
        c.fill();
      }
      c.fillStyle = '#FFD45C';
      ell(c, x, y, 3);
      c.fill();
    }
  }
  c.restore();
}

class Seek {
  constructor(level, done) {
    this.done = done;
    this.t = 0;
    const W = app.W, H = app.H;
    const friends = shuffle(FRIEND_IDS).slice(0, Math.min(2 + Math.floor(level / 3), 5));
    const cols = W > 640 ? 4 : 3;
    const rows = 3 + (level > 5 ? 1 : 0);
    const kinds = ['bush', 'stump', 'mush', 'rock', 'leaves', 'flowers'];
    const top = Math.max(app.safeTop, 8) + 136, bottom = H - 50 - app.safeBottom * 0.6;
    const cellW = (W - 20) / cols, cellH = (bottom - top) / rows;
    const spots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        spots.push({
          x: 10 + cellW * (c + 0.5) + rand(-8, 8), y: top + cellH * (r + 0.5) + rand(-8, 8), kind: kinds[(r * 3 + c) % kinds.length], sc: Math.min(cellH / 92, cellW / 92, 1.5),
          shake: new Spring(0, 400, 7), friend: null, open: false, used: false
        });
      }
    }
    shuffle(spots).slice(0, friends.length).forEach((s, i) => { s.friend = friends[i]; });
    this.spots = spots;
    this.friends = friends;
    this.found = [];
    this.flyers = [];
    this.pop = [];
    this.idle = 0;
    this.ambient = 0;
    this.hintSpot = null;
    hint.set({ from: [spots[1].x, spots[1].y], delay: 2.2 });
  }

  update(dt) {
    this.t += dt;
    this.idle += dt;
    for (const s of this.spots) s.shake.step(dt);
    // Stuck for a while? A hiding friend gives itself away with a little rustle
    this.ambient -= dt;
    if (this.idle > 6 && this.ambient <= 0) {
      this.ambient = 2.2;
      const h = this.spots.find((s) => s.friend && !s.open);
      if (h) {
        h.shake.kick(3);
        audio.voice('chirp', FRIENDS[h.friend].voice, 0.3);
      }
    }
    for (const q of this.pop) {
      q.v += 1200 * dt;
      q.y += q.v * dt;
      q.age += dt;
    }
  }

  draw(c) {
    const W = app.W, H = app.H;
    const back = softBack('seek', W, H, '#BDEBFF', '#7FD68A', (x) => {
      x.fillStyle = vgrad(x, H * 0.14, H, '#B8EEA4', '#59C477');
      x.beginPath();
      x.moveTo(0, H * 0.16);
      x.quadraticCurveTo(W * 0.5, H * 0.1, W, H * 0.19);
      x.lineTo(W, H);
      x.lineTo(0, H);
      x.closePath();
      x.fill();
      for (let i = 0; i < 6; i++) {
        const px = (i * 91) % W, py = H * 0.13 + (i % 3) * 8, r = 24 + (i % 3) * 8;
        x.strokeStyle = '#9C6B45';
        x.lineWidth = 8;
        x.beginPath();
        x.moveTo(px, py + 40);
        x.lineTo(px, py);
        x.stroke();
        x.fillStyle = '#6FCB7F';
        ell(x, px, py - 10, r);
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);

    // Which friends are still to be found: shadows at the top
    const top = Math.max(app.safeTop, 8) + 88;
    const gap = 62, x0 = W / 2 - ((this.friends.length - 1) * gap) / 2;
    this.friends.forEach((id, i) => {
      const x = x0 + i * gap;
      c.fillStyle = 'rgba(255,255,255,.55)';
      ell(c, x, top, 26);
      c.fill();
      c.save();
      c.translate(x, top - 2);
      if (this.found.includes(id)) {
        drawCreature(c, id, { R: 20, t: this.t, eyes: 'happy', mouthOpen: 0.4 });
      } else {
        c.globalAlpha = 0.5;
        c.fillStyle = '#5A7C78';
        ell(c, 0, 0, 16);
        c.fill();
        c.globalAlpha = 1;
      }
      c.restore();
    });

    for (const s of [...this.spots].sort((a, b) => a.y - b.y)) {
      groundShadow(c, s.x, s.y + 32 * s.sc, 42 * s.sc, 9 * s.sc);
      c.save();
      c.translate(s.x, s.y);
      if (s.open) {
        c.translate(0, 0);
      }
      drawSpot(c, s.kind, s.sc, s.shake.x * 0.14, this.t);
      c.restore();
    }
    for (const q of this.pop) {
      if (q.age > q.life) continue;
      c.save();
      c.translate(q.x, q.y);
      const k = clamp(q.age * 6);
      c.scale(k, k);
      drawCreature(c, q.id, { R: 32, t: this.t, eyes: 'happy', mouthOpen: 0.7, wave: 0.8, waveBoth: true });
      c.restore();
    }
  }

  down(p) {
    this.idle = 0;
    hint.clear();
    for (const s of this.spots) {
      if (dist(p.x, p.y, s.x, s.y) < 56 * s.sc) {
        s.shake.kick(7);
        haptic();
        audio.sfx('swish', { rate: rand(0.8, 1.2), vol: 0.9 });
        if (s.friend && !s.open) {
          s.open = true;
          const id = s.friend;
          this.pop.push({ id, x: s.x, y: s.y, v: -720, age: 0, life: 1.0 });
          audio.voice('giggle', FRIENDS[id].voice);
          audio.success();
          fx.sparkle(s.x, s.y, 18);
          fx.hearts(s.x, s.y, 6);
          wait(0.95, () => {
            this.found.push(id);
            audio.sfx('plip', { rate: 1.3 });
            if (this.found.length === this.friends.length) wait(0.5, () => this.done());
          });
        } else if (!s.used) {
          // Empty, but never boring: something always happens
          s.used = true;
          const roll = Math.random();
          if (roll < 0.4) {
            for (let i = 0; i < 2; i++) fx.add({ kind: 'dot', x: s.x + rand(-20, 20), y: s.y - 16, vx: rand(-120, 120), vy: rand(-200, -100), g: 300, size: 10, life: 1, color: pick(['#FFB54D', '#FF8F5C', '#FFD45C', '#7FD86F']) });
            audio.sfx('scrub', { rate: 0.7, vol: 0.8 });
          } else if (roll < 0.75) {
            fx.burst(s.x, s.y - 16, { kind: 'heart', n: 5, speed: 90, size: 15, g: -80, life: 1, spin: 1, colors: [P.pink, P.lilac] });
            audio.note('bell', penta(Math.floor(rand(1, 7))), { vol: 0.34 });
          } else {
            fx.bubbles(s.x, s.y - 14, 5);
            audio.sfx('bubble', { rate: rand(0.9, 1.3), vol: 0.7 });
          }
        }
        return;
      }
    }
  }
}

// ========================================================================================
// POND SONG: lily pads sing a tune, she sings it back
// ========================================================================================
class Simon {
  constructor(level, done) {
    this.done = done;
    this.t = 0;
    this.len = clamp(2 + Math.floor(level / 3), 2, 6);
    this.rounds = 3;
    this.round = 0;
    this.seq = [];
    const W = app.W, H = app.H, r = Math.min(W * 0.2, H * 0.1, 96), cx = W / 2, cy = H * 0.57;
    const d = r * 1.32;
    this.pads = [
      { x: cx - d, y: cy - d * 0.7, r, col: '#FF82AF', note: 3 }, { x: cx + d, y: cy - d * 0.7, r, col: '#FFC233', note: 5 },
      { x: cx - d, y: cy + d * 0.9, r, col: '#6FD8FF', note: 0 }, { x: cx + d, y: cy + d * 0.9, r, col: '#B48BFF', note: 2 }
    ].map((q) => ({ ...q, lit: 0, sq: new Spring(1, 320, 11) }));
    this.frog = { x: cx, y: Math.max(app.safeTop, 8) + H * 0.2, sq: new Spring(1, 300, 9), hop: 0, v: 0, expr: 'open', exprT: 0, mouth: 0 };
    this.mode = 'wait';
    this.fireflies = [];
    wait(0.6, () => this.nextRound());
  }

  nextRound() {
    if (this.round >= this.rounds) {
      wait(0.3, () => this.done());
      return;
    }
    this.seq = [];
    for (let i = 0; i < this.len + this.round; i++) {
      let n;
      do { n = Math.floor(rand(0, 4)); } while (i > 0 && n === this.seq[i - 1] && Math.random() < 0.7);
      this.seq.push(n);
    }
    this.playSeq();
  }

  playSeq() {
    this.mode = 'show';
    this.input = 0;
    const gap = 0.56;
    this.seq.forEach((n, i) => wait(0.45 + i * gap, () => this.lightPad(n, true)));
    wait(0.5 + this.seq.length * gap, () => {
      this.mode = 'input';
      if (this.round === 0 && !save.data.seen.simon) {
        const q = this.pads[this.seq[0]];
        hint.set({ from: [q.x, q.y], delay: 1.5 });
      }
    });
  }

  lightPad(i, sing) {
    const q = this.pads[i];
    q.lit = 1;
    q.sq.kick(sing ? 4 : 6);
    audio.note('kalimba', penta(q.note), { vol: 0.82, wet: 0.6 });
    audio.note('bell', penta(q.note + 5), { vol: 0.18, wet: 0.8 });
    if (sing) {
      this.frog.mouth = 0.5;
      this.frog.sq.kick(3);
    }
  }

  update(dt) {
    this.t += dt;
    for (const q of this.pads) {
      q.sq.step(dt);
      q.lit = Math.max(0, q.lit - dt * 2.4);
    }
    const f = this.frog;
    f.sq.step(dt);
    f.v += 1000 * dt;
    f.hop += f.v * dt;
    if (f.hop > 0) { f.hop = 0; f.v = 0; }
    f.exprT = Math.max(0, f.exprT - dt);
    f.mouth = Math.max(0, f.mouth - dt * 1.6);
  }

  draw(c) {
    const W = app.W, H = app.H;
    const back = softBack('pond', W, H, '#7FD6E8', '#2FA8C0', (x) => {
      for (let i = 0; i < 30; i++) {
        x.strokeStyle = 'rgba(255,255,255,.14)';
        x.lineWidth = 2.5;
        ell(x, (i * 89.7) % W, (i * 61.3) % H, 14 + (i % 4) * 8, 5 + (i % 4) * 2.6);
        x.stroke();
      }
      x.fillStyle = 'rgba(120,210,120,.85)';
      for (const [px, py, r] of [[28, H * 0.34, 28], [W - 22, H * 0.28, 22], [W - 34, H * 0.9, 36], [22, H * 0.92, 28]]) {
        ell(x, px, py, r, r * 0.7);
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);
    // Progress: three lanterns light up
    const px = W / 2, py = Math.max(app.safeTop, 8) + 40;
    for (let i = 0; i < this.rounds; i++) {
      softStar(c, px + (i - 1) * 40, py, i < this.round ? 16 : 13);
      c.fillStyle = i < this.round ? P.sun : 'rgba(255,255,255,.5)';
      c.fill();
    }
    for (const q of this.pads) {
      const k = q.sq.x;
      c.save();
      c.translate(q.x, q.y);
      c.scale(k, k);
      if (q.lit > 0) glow(c, 0, 0, q.r * 1.8, q.col, q.lit * 0.9);
      c.fillStyle = 'rgba(30,110,120,.3)';
      ell(c, 2, 7, q.r, q.r * 0.82);
      c.fill();
      c.fillStyle = clay(c, 0, 0, q.r, q.lit > 0.2 ? light(q.col, 0.1) : '#79D989');
      c.beginPath();
      c.ellipse(0, 0, q.r, q.r * 0.82, 0, 0.3, TAU - 0.05);
      c.lineTo(0, 0);
      c.closePath();
      c.fill();
      // The lotus tells the pads apart
      const f = q.r * 0.34;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU;
        c.fillStyle = clay(c, Math.cos(a) * f * 0.8, Math.sin(a) * f * 0.8, f * 0.7, q.col);
        ell(c, Math.cos(a) * f * 0.8, Math.sin(a) * f * 0.8, f * 0.62);
        c.fill();
      }
      c.fillStyle = clay(c, 0, 0, f * 0.6, '#FFE27D');
      ell(c, 0, 0, f * 0.54);
      c.fill();
      c.restore();
    }
    const f = this.frog;
    groundShadow(c, f.x, f.y + 62, 58, 11, 0.2);
    c.save();
    c.translate(f.x, f.y + f.hop);
    drawCreature(c, 'frog', { R: 64, t: this.t, sx: 2 - f.sq.x, sy: f.sq.x, eyes: f.exprT > 0 ? f.expr : 'open', mouthOpen: f.mouth, blink: blinkAt(this.t, 4), wave: f.exprT > 0 && f.expr === 'happy' ? 0.8 : 0, waveBoth: true });
    c.restore();
  }

  down(p) {
    if (this.mode !== 'input') return;
    for (let i = 0; i < 4; i++) {
      const q = this.pads[i];
      if (dist(p.x, p.y, q.x, q.y) < q.r * 1.04) {
        hint.clear();
        save.data.seen.simon = 1;
        this.lightPad(i, false);
        haptic();
        if (i === this.seq[this.input]) {
          this.input++;
          if (this.input === this.seq.length) {
            this.mode = 'wait';
            this.round++;
            this.frog.v = -420;
            this.frog.expr = 'happy';
            this.frog.exprT = 1.4;
            audio.voice('giggle', FRIENDS.frog.voice);
            wait(0.25, () => audio.success());
            fx.sparkle(q.x, q.y, 16);
            wait(1.5, () => this.nextRound());
          }
        } else {
          // A kind, not scolding, little "aww", then the tune again
          this.mode = 'wait';
          this.frog.expr = 'wow';
          this.frog.exprT = 1;
          audio.voice('aww', FRIENDS.frog.voice);
          this.frog.sq.kick(-4);
          wait(0.9, () => this.playSeq());
        }
        return;
      }
    }
  }
}

// ========================================================================================
// PAIRS: remember the cards
// ========================================================================================
class Pairs {
  constructor(level, done) {
    this.done = done;
    this.t = 0;
    const pairs = clamp(3 + Math.floor(level / 3), 3, 8);
    const ids = shuffle(FRIEND_IDS).slice(0, pairs);
    const deck = shuffle([...ids, ...ids]);
    const W = app.W, H = app.H, n = deck.length;
    const cols = W > 640 ? Math.ceil(n / 2) : (n <= 6 ? 2 : n <= 12 ? 3 : 4);
    const rows = Math.ceil(n / cols);
    const top = Math.max(app.safeTop, 8) + 82, bottom = H - 26 - app.safeBottom * 0.5;
    const cw = Math.min((W - 24) / cols, ((bottom - top) / rows) * 0.86), ch = Math.min((bottom - top) / rows, cw * 1.18);
    const gx = W / 2 - (cw * (cols - 1)) / 2, gy = (top + bottom) / 2 - (ch * (rows - 1)) / 2;
    // A short last row is centred rather than left hanging
    const lastCount = n % cols || cols;
    const rowX = (i) => (Math.floor(i / cols) === rows - 1 ? W / 2 - (cw * (lastCount - 1)) / 2 + (i % cols) * cw : gx + (i % cols) * cw);
    this.cards = deck.map((id, i) => ({ id, x: rowX(i), y: gy + Math.floor(i / cols) * ch, w: cw * 0.9, h: ch * 0.9, f: 0, face: false, done: false, sq: new Spring(1, 300, 11), a: 0 }));
    this.cards.forEach((q, i) => tween(q, { a: 1 }, 0.4, { ease: E.back, delay: i * 0.04 }));
    this.open = [];
    this.lock = false;
    hint.set({ from: [this.cards[0].x, this.cards[0].y], delay: 2 });
  }

  update(dt) {
    this.t += dt;
    for (const q of this.cards) {
      q.sq.step(dt);
      const to = q.face ? 1 : 0;
      q.f += (to - q.f) * Math.min(1, dt * 11);
    }
  }

  draw(c) {
    const W = app.W, H = app.H;
    const back = softBack('pairs', W, H, '#C7B0FF', '#FFD0E3', (x) => {
      x.fillStyle = 'rgba(255,255,255,.2)';
      for (let i = 0; i < 26; i++) {
        softStar(x, (i * 89.3) % W, (i * 67.1) % H, 8 + (i % 4) * 5);
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);
    for (const q of this.cards) {
      const fl = Math.cos(q.f * Math.PI), sx = Math.abs(fl);
      c.save();
      c.translate(q.x, q.y);
      c.scale(Math.max(0.02, sx) * q.a * q.sq.x, q.a * q.sq.x);
      c.fillStyle = 'rgba(70,40,120,.2)';
      rr(c, -q.w / 2, -q.h / 2 + 5, q.w, q.h, 16);
      c.fill();
      if (fl < 0) {
        c.fillStyle = q.done ? '#FFF7D6' : '#FFFFFF';
        rr(c, -q.w / 2, -q.h / 2, q.w, q.h, 16);
        c.fill();
        drawCreature(c, q.id, { R: Math.min(q.w, q.h) * 0.27, t: this.t, eyes: q.done ? 'happy' : 'open', mouthOpen: q.done ? 0.6 : 0, blink: blinkAt(this.t, q.x) });
      } else {
        c.fillStyle = vgrad(c, -q.h / 2, q.h / 2, '#9E7BFF', '#7A58E8');
        rr(c, -q.w / 2, -q.h / 2, q.w, q.h, 16);
        c.fill();
        c.lineWidth = 3.5;
        c.strokeStyle = 'rgba(255,255,255,.45)';
        rr(c, -q.w / 2 + 6, -q.h / 2 + 6, q.w - 12, q.h - 12, 11);
        c.stroke();
        softStar(c, 0, 0, Math.min(q.w, q.h) * 0.22);
        c.fillStyle = '#FFE27D';
        c.fill();
      }
      c.restore();
    }
  }

  down(p) {
    if (this.lock) return;
    for (const q of this.cards) {
      if (q.face || q.done) continue;
      if (Math.abs(p.x - q.x) < q.w / 2 + 4 && Math.abs(p.y - q.y) < q.h / 2 + 4) {
        hint.clear();
        q.face = true;
        q.sq.kick(3);
        audio.sfx('swish', { vol: 0.9, rate: 1.2 });
        audio.note('marimba', penta(this.open.length * 2 + 2), { vol: 0.5 });
        audio.voice('chirp', FRIENDS[q.id].voice, 0.4);
        haptic();
        this.open.push(q);
        if (this.open.length === 2) {
          this.lock = true;
          const [a, b] = this.open;
          this.open = [];
          if (a.id === b.id) {
            wait(0.35, () => {
              a.done = b.done = true;
              a.sq.kick(6);
              b.sq.kick(6);
              audio.success();
              audio.voice('giggle', FRIENDS[a.id].voice, 0.6);
              fx.sparkle(a.x, a.y, 14);
              fx.sparkle(b.x, b.y, 14);
              this.lock = false;
              if (this.cards.every((k) => k.done)) wait(0.8, () => this.done());
            });
          } else {
            wait(0.95, () => {
              a.face = b.face = false;
              audio.sfx('swish', { vol: 0.5 });
              this.lock = false;
            });
          }
        }
        return;
      }
    }
  }
}

// ========================================================================================
// PUZZLE: build a toy from its pieces
// ========================================================================================
const part = {
  rect: (x, y, w, h, r, col) => ({ x, y, w, h, r, col, type: 'rect' }),
  ell: (x, y, rx, ry, col) => ({ x, y, w: rx, h: ry, col, type: 'ell' }),
  tri: (x, y, w, h, col, flip) => ({ x, y, w, h, col, type: 'tri', flip })
};
function drawPart(c, q, shadow) {
  const col = shadow || q.col;
  if (q.type === 'rect') {
    c.fillStyle = shadow || hgrad(c, -q.w / 2, q.w / 2, light(col, 0.15), col, dark(col, 0.14));
    rr(c, -q.w / 2, -q.h / 2, q.w, q.h, q.r);
    c.fill();
  } else if (q.type === 'ell') {
    c.fillStyle = shadow || clay(c, 0, 0, q.w, col, q.h);
    ell(c, 0, 0, q.w, q.h);
    c.fill();
  } else {
    c.fillStyle = shadow || hgrad(c, -q.w / 2, q.w / 2, light(col, 0.15), dark(col, 0.14));
    c.beginPath();
    if (q.flip) { c.moveTo(-q.w / 2, -q.h / 2); c.lineTo(q.w / 2, -q.h / 2); c.lineTo(0, q.h / 2); } else { c.moveTo(-q.w / 2, q.h / 2); c.lineTo(q.w / 2, q.h / 2); c.lineTo(0, -q.h / 2); }
    c.closePath();
    c.fill();
  }
  if (!shadow) gloss(c, -q.w * 0.16, -q.h * 0.2, Math.min(q.w, q.h) * 0.24, Math.min(q.w, q.h) * 0.14, 0.5);
}
const PICTURES = [
  [part.rect(0, 30, 120, 90, 14, '#FF9F7A'), part.tri(0, -50, 170, 76, '#E8476F'), part.rect(0, 50, 40, 52, 16, '#FFD45C')],
  [part.ell(0, 58, 70, 62, '#FFFFFF'), part.ell(0, -36, 48, 46, '#F2F8FF'), part.tri(26, -36, 44, 16, '#FF9E50'), part.rect(0, -90, 70, 18, 7, '#5698FF')],
  [part.ell(0, 40, 90, 60, '#FF8FB8'), part.tri(-108, 40, 56, 90, '#FFB3D1'), part.ell(44, 28, 12, 12, '#3A2A57'), part.rect(0, -36, 16, 40, 8, '#FFC233')],
  [part.rect(0, 40, 70, 124, 28, '#F2F4FF'), part.tri(0, -62, 70, 62, '#FF5C8F'), part.tri(-52, 86, 40, 50, '#7C8CE8'), part.tri(52, 86, 40, 50, '#7C8CE8'), part.ell(0, 20, 20, 20, '#6FC6FF')],
  [part.rect(0, 60, 150, 90, 8, '#C7ABFF'), part.rect(-90, 30, 50, 150, 8, '#B48BFF'), part.rect(90, 30, 50, 150, 8, '#B48BFF'), part.tri(-90, -70, 66, 56, '#FF5C8F'), part.tri(90, -70, 66, 56, '#FF5C8F'), part.rect(0, 80, 46, 56, 20, '#FFD45C')],
  [part.rect(0, 90, 18, 110, 9, '#4DBE6A'), part.ell(-40, 80, 30, 14, '#67CF74'), part.ell(0, -40, 20, 20, '#FFD45C'), part.ell(-42, -40, 25, 25, '#FF82AF'), part.ell(42, -40, 25, 25, '#FF82AF'), part.ell(0, -82, 25, 25, '#FF9FC3'), part.ell(0, 2, 25, 25, '#FF9FC3')]
];

class Puzzle {
  constructor(level, done) {
    this.done = done;
    this.t = 0;
    this.pic = PICTURES[Math.min(PICTURES.length - 1, Math.floor(level / 3)) % PICTURES.length];
    if (level > 9) this.pic = pick(PICTURES);
    const W = app.W, H = app.H;
    this.cx = W / 2;
    this.cy = H * 0.37;
    const scale = this.scale = Math.min(W / 390, H / 800, 1.4) * 1.08;
    const n = this.pic.length;
    const tray = H - 96 - app.safeBottom * 0.6;
    const order = shuffle(this.pic.map((_, i) => i));
    this.pieces = this.pic.map((q, i) => {
      const slot = order.indexOf(i);
      const hx = W / 2 + (slot - (n - 1) / 2) * Math.min(96, (W - 30) / n);
      return { q, x: hx, y: tray, hx, hy: tray, tx: this.cx + q.x * scale, ty: this.cy + q.y * scale, placed: false, sq: new Spring(1, 300, 11), s: 0.5 };
    });
    this.left = n;
    const first = this.pieces[0];
    hint.set({ from: [first.hx, first.hy], to: [first.tx, first.ty], delay: 1.6 });
    this.win = 0;
  }

  update(dt) {
    this.t += dt;
    for (const q of this.pieces) q.sq.step(dt);
  }

  draw(c) {
    const W = app.W, H = app.H;
    const back = softBack('puzzle', W, H, '#FFE9B8', '#BFEFFF', (x) => {
      x.fillStyle = 'rgba(255,255,255,.75)';
      rr(x, 16, H * 0.12, W - 32, H * 0.56, 36);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,.55)';
      rr(x, 8, H - 170 - app.safeBottom * 0.6, W - 16, 150, 28);
      x.fill();
    });
    c.drawImage(back.cv, 0, 0, W, H);
    // The silhouette shows where everything goes
    const s = this.scale;
    for (const p of this.pieces) {
      c.save();
      c.translate(p.tx, p.ty);
      c.scale(s, s);
      drawPart(c, p.q, p.placed ? null : 'rgba(110,80,160,.18)');
      c.restore();
    }
    const list = [...this.pieces].filter((p) => !p.placed).sort((a, b) => (a === this.hold ? 1 : b === this.hold ? -1 : 0));
    for (const p of list) {
      const k = (p === this.hold ? 1 : 0.7) * s * p.sq.x;
      c.save();
      c.translate(p.x, p.y + (p === this.hold ? 0 : Math.sin(this.t * 2 + p.hx) * 2));
      c.scale(k, k);
      drawPart(c, p.q);
      c.restore();
    }
  }

  down(p) {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const q = this.pieces[i];
      if (q.placed) continue;
      if (dist(p.x, p.y, q.x, q.y) < 60) {
        this.hold = q;
        p.piece = q;
        p.ox = q.x - p.x;
        p.oy = q.y - p.y;
        q.sq.kick(3);
        audio.sfx('tap');
        hint.clear();
        return;
      }
    }
  }
  move(p) {
    if (p.piece) {
      p.piece.x = p.x + p.ox;
      p.piece.y = p.y + p.oy;
    }
  }
  up(p) {
    const q = p.piece;
    if (!q) return;
    this.hold = null;
    if (dist(q.x, q.y, q.tx, q.ty) < 58) {
      q.placed = true;
      this.left--;
      audio.note('kalimba', penta(this.pieces.length - this.left + 2), { vol: 0.8 });
      audio.sfx('thud', { vol: 0.5, rate: 1.3 });
      fx.sparkle(q.tx, q.ty, 12);
      haptic();
      if (this.left === 0) {
        audio.success();
        fx.confetti(app.W, app.H, 40);
        wait(1.1, () => this.done());
      }
    } else tween(q, { x: q.hx, y: q.hy }, 0.32, { ease: E.back });
  }
}

// ========================================================================================
// BALLOON FLIGHT: steer through the sky and catch the stars
// ========================================================================================
class Balloon {
  constructor(level, done) {
    this.done = done;
    this.t = 0;
    const W = app.W, H = app.H;
    this.target = 7 + level;
    this.got = 0;
    this.x = W / 2;
    this.y = H * 0.68;
    this.tx = this.x;
    this.ty = this.y;
    this.stars = [];
    this.clouds = Array.from({ length: 6 }, () => ({ x: rand(W), y: rand(H), s: rand(0.5, 1.1), v: rand(30, 70) }));
    this.bad = [];
    this.spawn = 0;
    this.badT = 3;
    this.level = level;
    this.bump = new Spring(0, 200, 8);
    this.speed = 96 + level * 7;
    this.finished = false;
    hint.set({ from: [this.x, this.y], to: [W * 0.28, H * 0.5], delay: 1.4 });
  }

  update(dt) {
    this.t += dt;
    const W = app.W, H = app.H;
    this.x += (this.tx - this.x) * Math.min(1, dt * 7);
    this.y += (this.ty - this.y) * Math.min(1, dt * 7);
    this.bump.step(dt);
    for (const q of this.clouds) {
      q.y += q.v * dt;
      if (q.y > H + 70) { q.y = -70; q.x = rand(W); }
    }
    if (this.finished) return;
    this.spawn -= dt;
    if (this.spawn <= 0) {
      this.spawn = 0.62 - Math.min(0.2, this.level * 0.02);
      this.stars.push({ x: rand(36, W - 36), y: -30, r: rand(17, 23), p: rand(TAU), gold: true });
    }
    this.badT -= dt;
    if (this.badT <= 0 && this.level > 1) {
      this.badT = Math.max(1.7, 4 - this.level * 0.25);
      this.bad.push({ x: rand(40, W - 40), y: -50, p: rand(TAU) });
    }
    for (const s of this.stars) {
      s.y += this.speed * dt;
      s.p += dt;
      if (dist(s.x, s.y, this.x, this.y - 22) < 56) {
        s.dead = true;
        this.got++;
        audio.note('kalimba', penta(this.got % 10), { vol: 0.75 });
        audio.note('bell', penta((this.got % 10) + 5), { vol: 0.2 });
        fx.stars(s.x, s.y, 7);
        haptic();
        if (this.got >= this.target) {
          this.finished = true;
          audio.fanfare();
          fx.confetti(W, H, 60);
          wait(1.5, () => this.done());
        }
      }
      if (s.y > H + 40) s.dead = true;
    }
    this.stars = this.stars.filter((s) => !s.dead);
    for (const b of this.bad) {
      b.y += this.speed * 0.8 * dt;
      b.p += dt;
      if (!b.hit && dist(b.x, b.y, this.x, this.y - 22) < 66) {
        // A little rain cloud bumps the balloon. It's only a giggle, no penalty.
        b.hit = true;
        this.bump.kick(this.x < b.x ? -9 : 9);
        audio.sfx('boing', { vol: 0.8 });
        audio.voice('wow', FRIENDS.moko.voice, 0.4);
        fx.bubbles(this.x, this.y - 20, 4);
      }
      if (b.y > H + 80) b.dead = true;
    }
    this.bad = this.bad.filter((b) => !b.dead);
  }

  draw(c) {
    const W = app.W, H = app.H;
    const back = softBack('flight', W, H, '#5FB4FF', '#FFE6D0');
    c.drawImage(back.cv, 0, 0, W, H);
    for (const q of this.clouds) drawCloud(c, q.x, q.y, q.s, 0.9);

    for (const s of this.stars) {
      glow(c, s.x, s.y, s.r * 1.9, '#FFF0A0', 0.45);
      drawStarPickup(c, s.x + Math.sin(s.p * 1.6) * 6, s.y, s.r, Math.sin(s.p) * 0.3);
    }
    for (const b of this.bad) {
      c.save();
      c.translate(b.x + Math.sin(b.p * 1.2) * 12, b.y);
      c.fillStyle = '#9CA8C9';
      for (const [x, y, r] of [[-24, 4, 20], [0, -8, 28], [24, 4, 20]]) {
        ell(c, x, y, r);
        c.fill();
      }
      c.fillStyle = '#3A2A57';
      for (const k of [-1, 1]) {
        ell(c, k * 10, -2, 3.4);
        c.fill();
      }
      c.lineWidth = 2.5;
      c.strokeStyle = '#3A2A57';
      c.beginPath();
      c.arc(0, 8, 5, Math.PI + 0.3, -0.3);
      c.stroke();
      c.restore();
    }

    // Counter: a little jar of stars in a row, always full of hope
    const py = Math.max(app.safeTop, 8) + 34, px = 92;
    c.fillStyle = 'rgba(255,255,255,.65)';
    rr(c, px, py - 15, W - px - 22, 30, 15);
    c.fill();
    c.fillStyle = hgrad(c, px, W - 22, P.sun, '#FF9F5C');
    rr(c, px + 3, py - 12, Math.max(24, (W - px - 28) * clamp(this.got / this.target)), 24, 12);
    c.fill();
    drawStarPickup(c, W - 36, py, 21, 0);

    // The balloon itself
    const x = this.x + this.bump.x * 3, y = this.y;
    c.save();
    c.translate(x, y);
    c.rotate(this.bump.x * 0.02 + (this.tx - this.x) * 0.0016);
    c.strokeStyle = '#9B6B3F';
    c.lineWidth = 2.5;
    for (const k of [-1, 1]) {
      c.beginPath();
      c.moveTo(k * 40, -18);
      c.lineTo(k * 19, 34);
      c.stroke();
    }
    c.save();
    c.beginPath();
    c.moveTo(0, 2);
    c.bezierCurveTo(-74, -38, -46, -110, 0, -110);
    c.bezierCurveTo(46, -110, 74, -38, 0, 2);
    c.clip();
    const cols = ['#FF7F9F', '#FFE066', '#6FC6FF', '#7FE3A0', '#C7ABFF', '#FF9F5C'];
    for (let i = 0; i < 8; i++) {
      c.fillStyle = cols[i % 6];
      c.fillRect(-72 + i * 18, -112, 18.5, 116);
    }
    c.fillStyle = 'rgba(255,255,255,.24)';
    ell(c, -18, -72, 26, 30);
    c.fill();
    c.restore();
    c.fillStyle = hgrad(c, -24, 24, '#E8B27C', '#C48A52');
    rr(c, -24, 34, 48, 30, 8);
    c.fill();
    c.restore();
    c.save();
    c.translate(x, y + 26);
    drawCreature(c, save.data.pet || 'moko', { R: 20, t: this.t, eyes: this.finished ? 'happy' : 'open', mouthOpen: this.finished ? 0.8 : 0, lookY: -1, wave: 0.8 });
    c.restore();
    c.save();
    c.fillStyle = hgrad(c, x - 24, x + 24, '#E8B27C', '#C48A52');
    rr(c, x - 24, y + 42, 48, 22, 8);
    c.fill();
    c.restore();
  }

  down(p) {
    hint.clear();
    this.tx = clamp(p.x, 30, app.W - 30);
    this.ty = clamp(p.y, 120, app.H - 70);
  }
  move(p) {
    this.tx = clamp(p.x, 30, app.W - 30);
    this.ty = clamp(p.y, 120, app.H - 70);
  }
}

const GAMES = { seek: Seek, simon: Simon, pairs: Pairs, puzzle: Puzzle, balloon: Balloon };
const STOP_TINT = { seek: '#7FD86F', simon: '#6FC6FF', pairs: '#B48BFF', puzzle: '#FFB54D', balloon: '#FF8FB8' };

function drawStopIcon(c, type) {
  c.fillStyle = '#fff';
  c.strokeStyle = '#fff';
  if (type === 'seek') {
    for (const [x, y, r] of [[-8, 3, 8], [8, 3, 8], [0, -5, 10]]) {
      ell(c, x, y, r);
      c.fill();
    }
  } else if (type === 'simon') {
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(5, 8); c.lineTo(5, -9); c.lineTo(12, -6); c.stroke();
    ell(c, 0, 9, 5.4, 4.2, -0.3);
    c.fill();
  } else if (type === 'pairs') {
    rr(c, -13, -9, 13, 18, 3);
    c.fill();
    rr(c, 1, -9, 13, 18, 3);
    c.fill();
  } else if (type === 'puzzle') {
    rr(c, -10, -10, 20, 20, 3);
    c.fill();
    ell(c, 10, 0, 5);
    c.fill();
    ell(c, 0, -10, 5);
    c.fill();
  } else {
    ell(c, 0, -5, 11, 12);
    c.fill();
    rr(c, -4, 10, 8, 6, 2);
    c.fill();
  }
}

export const quest = {
  tint: '#A8E6A1',

  enter() {
    this.t = 0;
    this.sub = null;
    this.chest = null;
    this.layout();
    this.scroll = this.focusScroll(Math.min(save.data.quest, STOPS - 1));
    this.v = 0;
    this.hop = { y: 0 };
    this.pos = Math.min(save.data.quest, STOPS - 1);
    music.play('adventure');
    this.mapHint();
    this.pressed = -1;
  },

  mapHint() {
    const i = Math.min(save.data.quest, STOPS - 1), q = this.stop(i);
    hint.set({ from: [q.x, q.y - this.scroll], delay: 1.5 });
  },

  layout() {
    this.W = app.W;
    this.H = app.H;
    this.spacing = 128;
    this.mapH = this.spacing * (STOPS + 1) + 260;
  },
  resize() { this.layout(); if (this.sub && this.sub.resize) this.sub.resize(); },

  stop(i) {
    const W = this.W;
    const amp = Math.min(W * 0.28, 150);
    return { x: W / 2 + Math.sin(i * 1.15 + 0.5) * amp, y: this.mapH - 150 - i * this.spacing, type: TYPES[i % TYPES.length] };
  },

  focusScroll(i) {
    const q = this.stop(i);
    return clamp(q.y - this.H * 0.62, 0, Math.max(0, this.mapH - this.H));
  },

  mapSprite() {
    const W = this.W, mapH = this.mapH;
    return sprite(`map:${W | 0}:${mapH}`, W, mapH, (c) => {
      // Sky above, sea in the middle, forest below
      const g = c.createLinearGradient(0, 0, 0, mapH);
      g.addColorStop(0, '#6E5BE0');
      g.addColorStop(0.2, '#A6B9FF');
      g.addColorStop(0.34, '#BDE9FF');
      g.addColorStop(0.42, '#6FD0E8');
      g.addColorStop(0.62, '#3EB9D8');
      g.addColorStop(0.67, '#FFE9B8');
      g.addColorStop(0.71, '#A9E89A');
      g.addColorStop(1, '#55C47B');
      c.fillStyle = g;
      c.fillRect(0, 0, W, mapH);
      let seed = 7;
      const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      // Stars high up
      for (let i = 0; i < 70; i++) {
        c.fillStyle = `rgba(255,250,220,${0.3 + r() * 0.6})`;
        ell(c, r() * W, r() * mapH * 0.18, 0.6 + r() * 1.3);
        c.fill();
      }
      // Clouds in the sky band
      for (let i = 0; i < 12; i++) drawCloud(c, r() * W, mapH * (0.1 + r() * 0.24), 0.5 + r() * 0.6, 0.9);
      // Sea waves and little islands
      c.strokeStyle = 'rgba(255,255,255,.3)';
      c.lineWidth = 3;
      c.lineCap = 'round';
      for (let i = 0; i < 34; i++) {
        const x = r() * W, y = mapH * (0.42 + r() * 0.24);
        c.beginPath();
        c.arc(x, y, 10, Math.PI + 0.5, -0.5);
        c.arc(x + 17, y, 10, Math.PI + 0.5, -0.5);
        c.stroke();
      }
      // A friendly whale
      c.save();
      c.translate(W * 0.2, mapH * 0.52);
      drawCreature(c, 'mermaid', { R: 26, t: 0 });
      c.restore();
      c.save();
      c.translate(W * 0.84, mapH * 0.6);
      drawCreature(c, 'penguin', { R: 22, t: 0 });
      c.restore();
      // Forest: trees and mushrooms
      for (let i = 0; i < W * 0.09; i++) {
        const x = r() * W, y = mapH * (0.73 + r() * 0.26), h = 34 + r() * 30;
        c.fillStyle = '#9C6B45';
        rr(c, x - 5, y - h * 0.4, 10, h * 0.6, 4);
        c.fill();
        const col = ['#6FCB7F', '#55BE72', '#7FD86F'][Math.floor(r() * 3)];
        c.fillStyle = clay(c, x, y - h * 0.8, h * 0.6, col);
        ell(c, x, y - h * 0.8, h * 0.56);
        c.fill();
      }
      // Cloud castle at the very end of the trail
      c.save();
      c.translate(W / 2, this.stop(STOPS - 1).y - 120);
      const cast = '#FFE3F1';
      for (const [x, y, w, h, roof] of [[-62, -20, 34, 100, P.rose], [62, -20, 34, 100, P.rose], [0, -46, 46, 130, P.violet], [-26, 10, 100, 60, null]]) {
        c.fillStyle = hgrad(c, x - w / 2, x + w / 2, '#FFFFFF', cast, '#E6C7E6');
        c.fillRect(x - w / 2, y, w, h);
        if (roof) {
          c.fillStyle = roof;
          c.beginPath();
          c.moveTo(x - w * 0.65, y);
          c.lineTo(x + w * 0.65, y);
          c.lineTo(x, y - w * 1.1);
          c.closePath();
          c.fill();
        }
      }
      c.fillStyle = '#FFD45C';
      rr(c, -14, 40, 28, 30, 14);
      c.fill();
      c.restore();
      drawCloud(c, W / 2 - 60, this.stop(STOPS - 1).y - 42, 1, 0.95);
      drawCloud(c, W / 2 + 70, this.stop(STOPS - 1).y - 40, 1.1, 0.95);
      grain(c, W, mapH, 0.04);
    }, 1.5);
  },

  update(dt) {
    this.t += dt;
    if (this.sub) { this.sub.update(dt); return; }
    if (this.chest) { this.updateChest(dt); return; }
    if (!this.drag) {
      this.scroll += this.v * dt;
      this.v *= Math.pow(0.05, dt);
      const m = Math.max(0, this.mapH - this.H);
      this.scroll = clamp(this.scroll, 0, m);
    }
  },

  draw(c) {
    if (this.sub) { this.sub.draw(c); return; }
    const W = this.W, H = this.H, sc = this.scroll;
    const m = this.mapSprite();
    c.drawImage(m.cv, 0, -sc, W, this.mapH);
    const cur = Math.min(save.data.quest, STOPS - 1);
    // Trail
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const pts = [];
    for (let i = 0; i < STOPS; i++) {
      const q = this.stop(i);
      pts.push([q.x, q.y - sc]);
    }
    c.lineWidth = 16;
    c.strokeStyle = 'rgba(255,255,255,.8)';
    spline(c, pts, false, 0.9);
    c.stroke();
    if (cur > 0) {
      c.lineWidth = 9;
      c.strokeStyle = P.sun;
      spline(c, pts.slice(0, cur + 1), false, 0.9);
      c.stroke();
    }
    // Stops
    for (let i = 0; i < STOPS; i++) {
      const q = this.stop(i), x = q.x, y = q.y - sc;
      if (y < -60 || y > H + 60) continue;
      const done = i < save.data.quest, now = i === cur, open = i <= save.data.quest;
      const r = now ? 33 : 27;
      const col = open ? STOP_TINT[q.type] : '#C9C3D8';
      const pulse = now ? 1 + Math.sin(this.t * 4) * 0.05 : 1;
      c.save();
      c.translate(x, y);
      c.scale(pulse, pulse);
      if (now) glow(c, 0, 0, r * 2.2, '#FFF3A0', 0.7);
      candy(c, r, col);
      if (done) {
        softStar(c, 0, -1, r * 0.62);
        c.fillStyle = '#FFE27D';
        c.fill();
      } else if (open) {
        c.save();
        c.scale(r / 26, r / 26);
        drawStopIcon(c, q.type);
        c.restore();
      } else {
        c.fillStyle = 'rgba(255,255,255,.75)';
        softStar(c, 0, 0, r * 0.3, 4, 0.45);
        c.fill();
      }
      c.restore();
    }
    // Moko waits at the current stop
    const q = this.stop(cur), hopY = Math.abs(Math.sin(this.t * 2.6)) * 7;
    c.save();
    c.translate(q.x + 44, q.y - sc - 34 - hopY);
    drawCreature(c, save.data.pet || 'moko', { R: 24, t: this.t, eyes: 'happy', mouthOpen: 0.4, wave: Math.sin(this.t * 1.2) > 0.4 ? 0.8 : 0 });
    c.restore();
    if (this.chest) this.drawChest(c);
  },

  // ---- end of a stop: a treasure chest --------------------------------------------------
  finishStop() {
    hint.clear();
    const i = this.playing;
    this.sub = null;
    music.play('adventure');
    this.chest = { i, t: 0, open: 0, sq: new Spring(0, 200, 12), done: false, fresh: i === save.data.quest };
    this.chest.sq.to = 1;
    audio.sparkle(2, 4, 0.4);
    wait(0.7, () => this.chest && !this.chest.open && hint.set({ from: [this.W / 2, this.H * 0.5], delay: 0.8 }));
  },

  updateChest(dt) {
    const ch = this.chest;
    ch.t += dt;
    ch.sq.step(dt);
  },

  drawChest(c) {
    const ch = this.chest, W = this.W, H = this.H, x = W / 2, y = H * 0.5, k = ch.sq.x;
    c.fillStyle = `rgba(40,20,90,${0.55 * clamp(ch.t * 3)})`;
    c.fillRect(0, 0, W, H);
    if (ch.open) {
      c.save();
      c.translate(x, y);
      c.rotate(this.t * 0.4);
      for (let i = 0; i < 10; i++) {
        c.rotate(TAU / 10);
        const g = c.createLinearGradient(0, 0, 0, -320);
        g.addColorStop(0, 'rgba(255,240,170,.5)');
        g.addColorStop(1, 'rgba(255,240,170,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-42, -320);
        c.lineTo(42, -320);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    const shake = ch.open ? 0 : Math.sin(this.t * 9) * 0.03;
    c.rotate(shake);
    groundShadow(c, 0, 76, 110, 20, 0.4);
    c.fillStyle = hgrad(c, -96, 96, '#C8834A', '#F0B46E', '#B5733F');
    rr(c, -96, -6, 192, 80, 16);
    c.fill();
    c.fillStyle = P.sun;
    for (const q of [-66, 66]) {
      c.fillRect(q - 8, -6, 16, 80);
    }
    if (ch.open) {
      c.fillStyle = '#6B3F22';
      rr(c, -88, -20, 176, 26, 10);
      c.fill();
      glow(c, 0, -10, 120, '#FFF0A0', 0.9);
      c.fillStyle = hgrad(c, -96, 96, '#C8834A', '#F0B46E', '#B5733F');
      rr(c, -96, -72, 192, 44, 22);
      c.fill();
    } else {
      c.fillStyle = hgrad(c, -96, 96, '#D18D52', '#FFC47D', '#BD7C45');
      c.beginPath();
      c.moveTo(-96, -6);
      c.bezierCurveTo(-96, -70, 96, -70, 96, -6);
      c.closePath();
      c.fill();
      c.fillStyle = P.sun;
      for (const q of [-66, 66]) {
        c.fillRect(q - 8, -44, 16, 38);
      }
      c.fillStyle = clay(c, 0, 0, 20, P.sun);
      rr(c, -17, -18, 34, 34, 8);
      c.fill();
      softStar(c, 0, -1, 10);
      c.fillStyle = '#FF9F3D';
      c.fill();
    }
    c.restore();
  },

  tapChest() {
    const ch = this.chest;
    if (!ch.open) {
      ch.open = 1;
      hint.clear();
      audio.fanfare();
      haptic();
      const x = this.W / 2, y = this.H * 0.5;
      fx.burst(x, y - 20, { kind: 'star', n: 30, colors: [P.sun, P.butter], speed: 460, size: 26, g: 420, life: 1.4 });
      fx.confetti(this.W, this.H, 70);
      save.earnStar();
      if (ch.fresh) {
        save.data.quest = Math.min(STOPS, save.data.quest + 1);
        save.touch();
      }
      wait(0.8, () => { ch.done = true; });
      return;
    }
    if (!ch.done) return;
    this.chest = null;
    this.scroll = this.focusScroll(Math.min(save.data.quest, STOPS - 1));
    audio.success();
    this.mapHint();
  },

  // ---- input --------------------------------------------------------------------------------
  down(p) {
    if (this.sub) { this.sub.down && this.sub.down(p); return; }
    if (this.chest) { this.tapChest(); return; }
    this.drag = p;
    this.v = 0;
    p.s0 = this.scroll;
  },
  move(p) {
    if (this.sub) { this.sub.move && this.sub.move(p); return; }
    if (this.drag !== p) return;
    this.scroll = clamp(p.s0 + (p.sy - p.y), 0, Math.max(0, this.mapH - this.H));
    this.v = -(p.y - p.py) / Math.max(app.dt, 0.008);
  },
  up(p) {
    if (this.sub) { this.sub.up && this.sub.up(p); return; }
    if (this.drag !== p) return;
    this.drag = null;
    if (p.moved > 14) return;
    this.v = 0;
    for (let i = 0; i < STOPS; i++) {
      const q = this.stop(i);
      if (dist(p.x, p.y, q.x, q.y - this.scroll) < 44) {
        if (i <= save.data.quest) {
          hint.clear();
          this.playing = i;
          audio.success();
          fx.sparkle(p.x, p.y, 14);
          // A later stop is a slightly harder challenge; replays stay at their level
          this.sub = new GAMES[q.type](i, () => this.finishStop());
          if (q.type === 'simon' || q.type === 'puzzle') music.play('dream');
        } else {
          audio.note('bell', 72, { vol: 0.2 });
          fx.sparkle(p.x, p.y, 5);
        }
        return;
      }
    }
  }
};
