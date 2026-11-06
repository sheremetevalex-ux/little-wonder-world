// Caring for a little friend: a bath with real foam and rinsing, a kitchen where
// the mouth opens as food approaches, and a cosy bedtime with a lullaby.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, vgrad, hgrad, glow, TAU, softStar, heart, groundShadow, sparkleShape, spline } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature, FRIENDS, blinkAt } from '../art/creatures.js';

// ---- Food art -----------------------------------------------------------------------
const FOODS = {
  apple(c, r) {
    c.fillStyle = clay(c, 0, 2, r, '#FF5F68');
    ell(c, -r * 0.2, 2, r * 0.68, r * 0.84);
    c.fill();
    ell(c, r * 0.2, 2, r * 0.68, r * 0.84);
    c.fill();
    c.fillStyle = '#7D5230';
    rr(c, -1.5, -r * 0.96, 3, r * 0.34, 1.5);
    c.fill();
    c.fillStyle = '#6FCB66';
    ell(c, r * 0.28, -r * 0.82, r * 0.28, r * 0.14, -0.4);
    c.fill();
    gloss(c, -r * 0.34, -r * 0.3, r * 0.2, r * 0.3, 0.75, 0.2);
  },
  berry(c, r) {
    c.fillStyle = clay(c, 0, 0, r, '#FF4D6A');
    c.beginPath();
    c.moveTo(0, r);
    c.bezierCurveTo(-r * 1.2, r * 0.1, -r * 0.9, -r * 0.8, 0, -r * 0.7);
    c.bezierCurveTo(r * 0.9, -r * 0.8, r * 1.2, r * 0.1, 0, r);
    c.fill();
    c.fillStyle = '#FFE082';
    for (const [x, y] of [[-0.35, -0.2], [0.25, -0.3], [0, 0.1], [-0.25, 0.4], [0.3, 0.3]]) {
      ell(c, x * r, y * r, r * 0.05, r * 0.08);
      c.fill();
    }
    c.fillStyle = '#6FCB66';
    for (let i = 0; i < 5; i++) {
      ell(c, Math.cos(i * 1.26 + 0.3) * r * 0.26, -r * 0.8 + Math.sin(i * 1.26) * r * 0.1, r * 0.2, r * 0.1, i * 1.26);
      c.fill();
    }
  },
  carrot(c, r) {
    c.save();
    c.rotate(0.5);
    c.fillStyle = hgrad(c, -r * 0.4, r * 0.4, '#FFB347', '#F5812A');
    c.beginPath();
    c.moveTo(-r * 0.42, -r * 0.5);
    c.quadraticCurveTo(0, -r * 0.8, r * 0.42, -r * 0.5);
    c.quadraticCurveTo(r * 0.3, r * 0.5, 0, r);
    c.quadraticCurveTo(-r * 0.3, r * 0.5, -r * 0.42, -r * 0.5);
    c.fill();
    c.fillStyle = '#65C95D';
    for (const a of [-0.5, 0, 0.5]) {
      ell(c, Math.sin(a) * r * 0.3, -r * 0.8 - Math.cos(a) * r * 0.2, r * 0.13, r * 0.3, a);
      c.fill();
    }
    c.restore();
  },
  cupcake(c, r) {
    c.fillStyle = hgrad(c, -r * 0.6, r * 0.6, '#FFC2DA', '#FF8CB8');
    c.beginPath();
    c.moveTo(-r * 0.68, -r * 0.05);
    c.lineTo(r * 0.68, -r * 0.05);
    c.lineTo(r * 0.46, r * 0.86);
    c.lineTo(-r * 0.46, r * 0.86);
    c.closePath();
    c.fill();
    for (const [x, y, s, k] of [[0, -0.2, 0.74, '#FFF3E0'], [0, -0.55, 0.54, '#FFE0F0'], [0, -0.82, 0.3, '#FFF3E0']]) {
      c.fillStyle = clay(c, x * r, y * r, s * r, k);
      ell(c, x * r, y * r, s * r, s * r * 0.7);
      c.fill();
    }
    c.fillStyle = P.rose;
    ell(c, 0, -r * 1.02, r * 0.14);
    c.fill();
  },
  donut(c, r) {
    c.fillStyle = clay(c, 0, 0, r, '#E8B27C');
    ell(c, 0, 0, r * 0.95);
    c.fill();
    c.fillStyle = clay(c, 0, -2, r, '#FF8FC4');
    ell(c, 0, -1, r * 0.82);
    c.fill();
    const cols = ['#fff', P.butter, P.sky, P.mint];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      c.fillStyle = cols[i % 4];
      ell(c, Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58 - 1, r * 0.11, r * 0.05, a);
      c.fill();
    }
    c.fillStyle = 'rgba(120,70,40,.7)';
    ell(c, 0, 0, r * 0.26);
    c.fill();
  },
  melon(c, r) {
    c.beginPath();
    c.arc(0, -r * 0.2, r * 1.05, 0, Math.PI);
    c.closePath();
    c.fillStyle = '#5BC46E';
    c.fill();
    c.beginPath();
    c.arc(0, -r * 0.2, r * 0.9, 0, Math.PI);
    c.closePath();
    c.fillStyle = '#FF6F7F';
    c.fill();
    c.fillStyle = '#3A2A57';
    for (const [x, y] of [[-0.5, 0.05], [-0.15, 0.3], [0.2, 0.05], [0.5, 0.2]]) {
      ell(c, x * r, y * r, r * 0.05, r * 0.08);
      c.fill();
    }
  },
  lemon(c, r) {
    c.fillStyle = clay(c, 0, 0, r, '#FFE24D');
    ell(c, 0, 0, r * 0.96, r * 0.76);
    c.fill();
    ell(c, -r * 1.0, 0, r * 0.12);
    c.fill();
    ell(c, r * 1.0, 0, r * 0.12);
    c.fill();
    gloss(c, -r * 0.3, -r * 0.3, r * 0.3, r * 0.14, 0.8);
  },
  cheese(c, r) {
    c.fillStyle = vgrad(c, -r, r, '#FFE27D', '#FFC233');
    c.beginPath();
    c.moveTo(-r, r * 0.6);
    c.lineTo(r, r * 0.6);
    c.lineTo(r, -r * 0.1);
    c.lineTo(-r * 0.5, -r * 0.7);
    c.closePath();
    c.fill();
    c.fillStyle = '#F2A92E';
    for (const [x, y, s] of [[-0.3, 0.1, 0.18], [0.4, 0.2, 0.15], [0.1, -0.15, 0.1]]) {
      ell(c, x * r, y * r, s * r);
      c.fill();
    }
  },
  icecream(c, r) {
    c.fillStyle = hgrad(c, -r * 0.4, r * 0.4, '#F2C07E', '#D9944C');
    c.beginPath();
    c.moveTo(-r * 0.5, -r * 0.1);
    c.lineTo(r * 0.5, -r * 0.1);
    c.lineTo(0, r);
    c.closePath();
    c.fill();
    c.fillStyle = clay(c, 0, -r * 0.4, r * 0.6, '#FFC4DC');
    ell(c, 0, -r * 0.42, r * 0.6);
    c.fill();
  }
};
const SOUR = { lemon: 1 };

// ---- Room tools -----------------------------------------------------------------------
function drawSoap(c, r) {
  c.fillStyle = clay(c, 0, 0, r, '#FFB3D1');
  rr(c, -r, -r * 0.62, r * 2, r * 1.24, r * 0.45);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)';
  rr(c, -r * 0.62, -r * 0.34, r * 1.24, r * 0.6, r * 0.3);
  c.fill();
  heart(c, 0, -r * 0.05, r * 0.26);
  c.fillStyle = '#FF7DAE';
  c.fill();
  for (const [x, y, s] of [[-r * 0.9, -r * 0.7, 5], [r * 0.9, -r * 0.5, 4], [r * 0.2, -r * 0.9, 3.4]]) {
    c.fillStyle = 'rgba(255,255,255,.9)';
    ell(c, x, y, s);
    c.fill();
  }
}
function drawShower(c, r) {
  c.save();
  c.rotate(0.15);
  c.fillStyle = hgrad(c, -5, 5, '#E6EDF7', '#9EADC9');
  rr(c, -5, -r * 1.1, 10, r * 1.2, 5);
  c.fill();
  c.fillStyle = vgrad(c, -r * 0.1, r * 0.5, '#F2F6FC', '#A8B8D4');
  c.beginPath();
  c.moveTo(-r * 0.9, r * 0.44);
  c.quadraticCurveTo(0, -r * 0.5, r * 0.9, r * 0.44);
  c.closePath();
  c.fill();
  c.fillStyle = '#7A8BB0';
  for (let i = -3; i <= 3; i++) {
    ell(c, (i * r) / 4, r * 0.37, 1.8);
    c.fill();
  }
  c.restore();
}
function drawTowel(c, r) {
  c.fillStyle = hgrad(c, -r, r, '#A6DDF7', '#6FC6FF');
  rr(c, -r * 0.94, -r * 0.8, r * 1.88, r * 1.6, r * 0.34);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,.75)';
  for (const y of [-0.4, 0, 0.4]) {
    rr(c, -r * 0.84, y * r, r * 1.68, 4.5, 2);
    c.fill();
  }
}
function drawDuck(c, r) {
  c.fillStyle = clay(c, 0, r * 0.2, r, '#FFD84D');
  ell(c, 0, r * 0.25, r, r * 0.72);
  c.fill();
  c.fillStyle = clay(c, r * 0.2, -r * 0.5, r * 0.6, '#FFE27D');
  ell(c, r * 0.24, -r * 0.46, r * 0.58);
  c.fill();
  c.fillStyle = '#FF9E50';
  ell(c, r * 0.84, -r * 0.4, r * 0.28, r * 0.15);
  c.fill();
  c.fillStyle = P.ink;
  ell(c, r * 0.42, -r * 0.6, r * 0.09);
  c.fill();
  gloss(c, -r * 0.3, 0, r * 0.3, r * 0.2, 0.6);
}

const ROOMS = ['bath', 'food', 'bed'];

export const pet = {
  tint: '#8FD8FF',

  enter() {
    const d = save.data;
    this.t = 0;
    this.W = app.W;
    this.H = app.H;
    this.id = d.friends.includes(d.pet) ? d.pet : d.friends[d.friends.length - 1];
    this.room = 'bath';
    this.sq = new Spring(1, 280, 10);
    this.hopY = 0; this.hopV = 0;
    this.expr = null;
    this.exprT = 0;
    this.look = { x: 0, y: 0 };
    this.mouth = 0;
    this.belly = 0;
    this.layout();
    this.setRoom('bath', true);
    this.earned = {};
    this.makeButtons();
    music.play('pet');
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.cx = W / 2;
    this.R = clamp(Math.min(W * 0.27, H * 0.13), 84, 130);
    this.py = H * 0.4;
    this.tabY = H - 42 - app.safeBottom * 0.6;
    this.trayY = this.tabY - 84;
  },
  resize() { this.layout(); this.setRoom(this.room, true); this.makeButtons(); },

  makeButtons() {
    const tabIcon = (name) => (c, r) => {
      const on = this.room === name;
      candy(c, r, { bath: P.sky, food: P.coral, bed: P.violet }[name], on);
      c.save();
      if (name === 'bath') {
        c.fillStyle = '#fff';
        rr(c, -14, -2, 28, 12, 6);
        c.fill();
        for (const [x, y, s] of [[-6, -7, 4], [2, -10, 5], [9, -6, 3]]) {
          ell(c, x, y, s);
          c.fill();
        }
      } else if (name === 'food') {
        c.scale(0.72, 0.72);
        FOODS.apple(c, 20);
      } else {
        c.fillStyle = '#FFF3C4';
        c.beginPath();
        c.arc(-1, 0, 14, 0.9, 5.2);
        c.arc(5, -3, 11, 5, 1.1, true);
        c.fill();
      }
      c.restore();
      if (on) {
        c.lineWidth = 3;
        c.strokeStyle = '#fff';
        ell(c, 0, -1, r - 2);
        c.stroke();
      }
    };
    this.buttons = ROOMS.map((name, i) => new Btn({
      x: this.cx + (i - 1) * 76, y: this.tabY, r: 29, slop: 6,
      paint: tabIcon(name),
      tap: () => { if (this.room !== name) this.setRoom(name); }
    }));
    if (save.data.friends.length > 1) {
      this.buttons.push(new Btn({
        x: this.W - 44, y: Math.max(app.safeTop, 10) + 34, r: 27, slop: 10,
        paint: (c, r) => {
          candy(c, r, P.butter);
          const fr = save.data.friends, nx = fr[(fr.indexOf(this.id) + 1) % fr.length];
          drawCreature(c, nx, { R: r * 0.56, t: this.t });
        },
        tap: () => {
          const fr = save.data.friends;
          this.id = fr[(fr.indexOf(this.id) + 1) % fr.length];
          save.data.pet = this.id;
          save.touch();
          this.hopV = -420;
          this.sq.kick(5);
          audio.voice('wow', FRIENDS[this.id].voice);
          fx.sparkle(this.cx, this.py, 16);
        }
      }));
    }
  },

  setRoom(name, silent) {
    const prev = this.room;
    this.room = name;
    this.hold = null;
    this.tools = [];
    this.foam = [];
    if (!silent) {
      audio.sfx('swish');
      audio.note('marimba', penta(ROOMS.indexOf(name) + 2), { vol: 0.55 });
      this.hopV = -300;
    }
    if (name === 'bath') this.setupBath();
    if (name === 'food') this.setupFood();
    if (name === 'bed') this.setupBed();
    if (name === 'bed') music.play('night');
    else if (prev === 'bed') music.play('pet');
  },

  petPos() { return { x: this.cx, y: this.py + this.hopY }; },
  say(type) { audio.voice(type, FRIENDS[this.id].voice); },
  feel(expr, time = 1) { this.expr = expr; this.exprT = time; },

  earn(room) {
    if (this.earned[room]) return;
    this.earned[room] = 1;
    save.earnStar();
    audio.fanfare();
    fx.confetti(this.W, this.H, 60);
    this.hopV = -460;
    this.feel('heart', 1.8);
  },

  // ---- BATH --------------------------------------------------------------------------
  setupBath() {
    this.py = this.H * 0.36;
    const x = this.cx, y = this.trayY, gap = Math.min(82, (this.W - 30) / 3.6);
    this.tools = [
      { id: 'soap', x: x - gap * 1.5, y, hx: x - gap * 1.5, hy: y, r: 27, paint: drawSoap, s: 1 },
      { id: 'shower', x: x - gap * 0.5, y, hx: x - gap * 0.5, hy: y, r: 27, paint: drawShower, s: 1 },
      { id: 'towel', x: x + gap * 0.5, y, hx: x + gap * 0.5, hy: y, r: 27, paint: drawTowel, s: 1 },
      { id: 'duck', x: x + gap * 1.5, y, hx: x + gap * 1.5, hy: y, r: 24, paint: drawDuck, s: 1 }
    ];
    // Muddy spots: a real reason to wash, and very satisfying when they vanish
    // Spots go round the face, never over it: she should still see who she's washing
    const spots = [[-0.62, -0.56], [0.1, -0.74], [0.66, -0.5], [-0.84, 0.0], [0.86, 0.04], [-0.5, 0.56], [0.1, 0.62], [0.58, 0.52], [-0.22, -0.48]];
    this.mud = spots.map(([x, y]) => ({ x: x * this.R + rand(-5, 5), y: y * this.R + rand(-5, 5), r: rand(11, 19), a: 1, seed: rand(9) }));
    this.foam = [];
    this.wet = 0;
    this.drops = [];
    this.bathStage = 0;
    this.duck = { x: this.cx + this.R * 1.1, ph: 0, on: true };
    if (!save.data.seen.bath) hint.set({ from: [this.tools[0].x, this.tools[0].y], to: [this.cx, this.py], delay: 1.2 });
  },

  bathTool(tool, x, y, dx, dy) {
    const pp = this.petPos(), near = dist(x, y, pp.x, pp.y) < this.R * 1.05;
    if (tool.id === 'soap' && near) {
      const speed = Math.hypot(dx, dy);
      if (speed > 0.8 && this.foam.length < 90) {
        const n = 1 + (speed > 8 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          this.foam.push({ x: x - pp.x + rand(-13, 13), y: y - pp.y + rand(-13, 13), r: rand(10, 21), s: 0, p: rand(TAU) });
        }
        audio.sfx('scrub', { rate: rand(0.8, 1.3), vol: 0.75, gap: 70 });
        if (Math.random() < 0.05) audio.sfx('plip', { rate: rand(1, 1.6), vol: 0.5, gap: 100 });
        this.sq.kick(rand(-0.8, 0.8));
        if (!this.exprT) this.feel('happy', 0.7);
        if (Math.random() < 0.025) this.say('giggle');
        // Mud loosens under the foam
        for (const m of this.mud) {
          if (dist(m.x, m.y, x - pp.x, y - pp.y) < m.r + 20) m.a = Math.max(0.25, m.a - 0.06);
        }
        if (Math.random() < 0.35) fx.add({ kind: 'bubble', x, y, vx: rand(-40, 40), vy: rand(-110, -30), g: -30, size: rand(9, 18), life: 1, color: P.sky });
        if (!save.data.seen.bath) { save.data.seen.bath = 1; hint.clear(); }
        if (this.foam.length > 22 && this.bathStage === 0) {
          this.bathStage = 1;
          hint.set({ from: [this.tools[1].x, this.tools[1].y], to: [this.cx, this.py - this.R], delay: 2.4 });
        }
      }
    }
  },

  stepShower(dt) {
    const tool = this.hold && this.hold.id === 'shower' ? this.hold : null;
    if (tool) {
      for (let i = 0; i < 3; i++) {
        this.drops.push({ x: tool.x + rand(-18, 18), y: tool.y + 18, vy: rand(320, 440), vx: rand(-14, 14) });
      }
      if (Math.floor(this.t * 6) !== Math.floor((this.t - dt) * 6)) audio.sfx('pour', { rate: rand(0.9, 1.1), vol: 0.75, gap: 90 });
    }
    const pp = this.petPos();
    for (const d of this.drops) {
      d.vy += 900 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      const lx = d.x - pp.x, ly = d.y - pp.y;
      if (lx * lx + ly * ly < this.R * this.R * 1.05) {
        d.dead = Math.random() < 0.6;
        for (let k = this.foam.length - 1; k >= 0; k--) {
          if (dist(this.foam[k].x, this.foam[k].y, lx, ly) < this.foam[k].r + 8) {
            this.foam[k].r -= 2;
            if (this.foam[k].r < 5) this.foam.splice(k, 1);
            break;
          }
        }
        for (const m of this.mud) {
          if (dist(m.x, m.y, lx, ly) < m.r + 7) m.a -= m.a < 0.3 ? 0.06 : 0.012;
        }
        this.wet = Math.min(1, this.wet + dt * 0.3);
      }
      if (d.y > this.H * 0.68) d.dead = true;
    }
    this.drops = this.drops.filter((d) => !d.dead);
    this.mud = this.mud.filter((m) => m.a > 0);
    if (tool && !this.foam.length && !this.mud.length && this.bathStage < 2) {
      this.bathStage = 2;
      hint.set({ from: [this.tools[2].x, this.tools[2].y], to: [this.cx, this.py], delay: 2 });
    }
    if (tool && !this.foam.length && this.mud.length && Math.random() < 0.01) this.feel('happy', 0.5);
  },

  towelRub(x, y, dx, dy) {
    const pp = this.petPos();
    if (dist(x, y, pp.x, pp.y) > this.R * 1.2) return;
    const sp = Math.hypot(dx, dy);
    if (sp < 1) return;
    this.wet = Math.max(0, this.wet - sp * 0.0022);
    this.sq.kick(rand(-0.7, 0.7));
    if (Math.random() < 0.3) fx.sparkle(x, y, 1);
    audio.sfx('swish', { rate: rand(0.7, 1.1), vol: 0.6, gap: 110 });
    if (this.bathStage === 2 && this.wet <= 0.02) {
      this.bathStage = 3;
      hint.clear();
      this.sparkle = 3.5;
      this.earn('bath');
      this.say('giggle');
    }
  },

  // ---- KITCHEN -------------------------------------------------------------------------
  setupFood() {
    this.py = this.H * 0.4;
    const names = Object.keys(FOODS);
    const pickFoods = ['lemon', ...names.filter((n) => n !== 'lemon').sort(() => Math.random() - 0.5).slice(0, 4)].sort(() => Math.random() - 0.5);
    const n = pickFoods.length, gap = Math.min(70, (this.W - 16) / n);
    this.tools = pickFoods.map((id, i) => ({
      id, food: true, x: this.cx + (i - (n - 1) / 2) * gap, y: this.trayY - 4, hx: this.cx + (i - (n - 1) / 2) * gap, hy: this.trayY - 4, r: 26, s: 1, paint: FOODS[id], bites: 0
    }));
    this.fed = 0;
    this.chewT = 0;
    if (!save.data.seen.feed) hint.set({ from: [this.tools[1].x, this.tools[1].y], to: [this.cx, this.py + 22], delay: 1.2 });
  },

  bite(food) {
    food.bites++;
    this.chewT = 0.7;
    this.mouth = 1;
    audio.sfx('chew', { rate: rand(0.9, 1.15), vol: 0.9 });
    wait(0.18, () => audio.sfx('chew', { rate: rand(1, 1.25), vol: 0.7 }));
    fx.burst(this.cx + rand(-14, 14), this.py + this.R * 0.3, { kind: 'dot', n: 5, colors: ['#FFD0A0', '#FFE0C0', '#F7B26A'], speed: 90, size: 7, g: 500, life: 0.6, spin: 0 });
    this.sq.kick(-3);
    haptic();
    if (!save.data.seen.feed) { save.data.seen.feed = 1; hint.clear(); }
    wait(0.75, () => {
      if (this.room !== 'food') return;
      if (SOUR[food.id]) {
        this.feel('sour', 1.9);
        this.say('sour');
        this.shiver = 1.6;
        this.sq.kick(6);
      } else {
        this.feel(Math.random() < 0.55 ? 'heart' : 'happy', 1.3);
        this.say('yum');
        fx.hearts(this.cx, this.py - this.R * 0.3, 6);
      }
      this.belly = Math.min(1, this.belly + 0.24);
      this.fed++;
      if (this.fed === 3 || this.fed === 6) {
        wait(1.35, () => {
          if (this.room !== 'food') return;
          this.say('burp');
          this.belly *= 0.35;
          this.sq.kick(-7);
          this.feel('wow', 0.8);
          fx.bubbles(this.cx, this.py + this.R * 0.2, 3);
        });
        wait(2.3, () => this.earn('food'));
      }
    });
  },

  // ---- BEDROOM ----------------------------------------------------------------------------
  setupBed() {
    this.py = this.H * 0.46;
    this.lamp = 1;
    this.lampOn = true;
    this.blanket = 0;
    this.sleep = 0;
    this.mobile = new Spring(0, 40, 2);
    this.lullT = 0;
    this.lullStep = 0;
    this.moon = 0;
    if (!save.data.seen.bed) hint.set({ from: [this.cx + this.R * 0.2, this.py + this.R * 0.9], to: [this.cx + this.R * 0.2, this.py + this.R * 0.3], delay: 1.5 });
  },

  update(dt) {
    this.t += dt;
    this.sq.step(dt);
    this.hopV += 1100 * dt;
    this.hopY += this.hopV * dt;
    if (this.hopY > 0) {
      if (this.hopV > 200) this.sq.kick(-4);
      this.hopY = 0;
      this.hopV = 0;
    }
    this.exprT = Math.max(0, this.exprT - dt);
    if (this.exprT <= 0) this.expr = null;
    if (this.shiver > 0) this.shiver -= dt;
    if (this.sparkle > 0) this.sparkle -= dt;
    this.chewT = Math.max(0, this.chewT - dt);

    for (const f of this.foam) f.s = Math.min(1, f.s + dt * 7);
    if (this.room === 'bath') {
      this.stepShower(dt);
      this.duck.ph += dt;
    }
    if (this.room === 'food') {
      const h = this.hold;
      let open = 0;
      if (h && h.food) {
        const d = dist(h.x, h.y, this.cx, this.py + this.R * 0.2);
        open = clamp(1 - (d - 40) / 170);
      }
      this.mouth += (Math.max(open, this.chewT > 0 ? 0 : 0) - this.mouth) * Math.min(1, dt * 12);
    }
    if (this.room === 'bed') {
      this.mobile.step(dt);
      this.lamp += ((this.lampOn ? 1 : 0) - this.lamp) * Math.min(1, dt * 5);
      const wants = !this.lampOn && this.blanket > 0.6;
      this.sleep += ((wants ? 1 : 0) - this.sleep) * Math.min(1, dt * 1.5);
      if (wants) {
        this.lullT -= dt;
        if (this.lullT <= 0) {
          this.lullT = 0.62;
          const song = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 3, 2, 4, 2, 1, 0];
          audio.note('bell', penta(song[this.lullStep++ % song.length]), { vol: 0.3, wet: 0.9 });
        }
        if (this.sleep > 0.8 && !this.earned.bed) {
          wait(4, () => {
            if (this.room === 'bed' && this.sleep > 0.8 && !this.earned.bed) {
              this.earned.bed = 1;
              save.earnStar();
              fx.burst(this.W * 0.76, this.H * 0.18, { kind: 'star', n: 16, colors: [P.butter, '#fff'], speed: 180, size: 16, g: 80 });
              audio.sparkle(3, 5, 0.3);
            }
          });
          this.earned.bedWaiting = 1;
        }
      }
    }
  },

  drawPet(c, opts = {}) {
    const { x, y } = this.petPos();
    const shiverX = this.shiver > 0 ? Math.sin(this.t * 55) * 4 * clamp(this.shiver) : 0;
    const q = this.sq.x;
    const lookX = clamp((this.look.x - x) / 120, -1, 1), lookY = clamp((this.look.y - y) / 130, -1, 1);
    c.save();
    c.translate(x + shiverX, y);
    const sleepy = this.room === 'bed' ? this.sleep : 0;
    let eyes = this.expr || (sleepy > 0.5 ? 'closed' : 'open');
    let mouth = this.expr === 'sour' ? 'sour' : this.chewT > 0 ? 'chew' : 'smile';
    drawCreature(c, this.id, {
      R: this.R, t: this.t, sx: (2 - q) * (1 + this.belly * 0.12), sy: q, eyes, mouth, mouthOpen: this.chewT > 0 ? 0 : (this.expr === 'happy' || this.expr === 'wow' ? 0.7 : this.mouth), blink: this.expr ? 0 : blinkAt(this.t, 3),
      lookX, lookY, wob: this.sq.v * 0.1, sparkly: this.sparkle > 0, blush: this.expr ? 1 : 0, wave: opts.wave
    });
    c.restore();
  },

  drawBath(c) {
    const W = this.W, H = this.H, R = this.R;
    const back = softBack('bath', W, H, '#BFEEFF', '#E6FBFF', (x) => {
      // Tiled wall
      const s = 58;
      x.strokeStyle = 'rgba(255,255,255,.65)';
      x.lineWidth = 3;
      for (let i = 0; i < W / s + 1; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, H); x.stroke(); }
      for (let i = 0; i < H / s + 1; i++) { x.beginPath(); x.moveTo(0, i * s); x.lineTo(W, i * s); x.stroke(); }
      x.fillStyle = vgrad(x, H * 0.66, H, '#FFE1EC', '#FFC7DE');
      x.fillRect(0, H * 0.66, W, H);
    });
    c.drawImage(back.cv, 0, 0, W, H);

    const tubY = this.py + R * 0.8;
    const tubW = Math.min(W * 0.46, R * 1.78);
    // Rear rim of the tub
    c.fillStyle = '#E6F2FF';
    ell(c, this.cx, tubY, tubW, R * 0.2);
    c.fill();

    this.drawPet(c);

    // Mud & foam live on the pet
    const pp = this.petPos();
    c.save();
    c.translate(pp.x, pp.y);
    for (const m of this.mud) {
      c.fillStyle = alpha('#8A5A3C', m.a * 0.9);
      ell(c, m.x, m.y, m.r, m.r * 0.84, m.seed);
      c.fill();
      c.fillStyle = alpha('#74482E', m.a * 0.6);
      ell(c, m.x + m.r * 0.26, m.y + m.r * 0.18, m.r * 0.42);
      c.fill();
    }
    for (const f of this.foam) {
      const r = f.r * f.s * (1 + Math.sin(this.t * 3 + f.p) * 0.03);
      c.fillStyle = clay(c, f.x, f.y, r, '#FFFFFF');
      ell(c, f.x, f.y, r);
      c.fill();
    }
    c.restore();
    if (this.wet > 0.2) {
      c.fillStyle = `rgba(160,220,255,${this.wet * 0.4})`;
      for (let i = 0; i < 6; i++) {
        const x = pp.x + Math.cos(i * 2.4) * R * 0.75, y = pp.y + Math.sin(i * 1.7) * R * 0.7 + ((this.t * 30 + i * 20) % 26);
        ell(c, x, y, 3.2, 5);
        c.fill();
      }
    }

    // Water and front of the tub
    c.save();
    c.beginPath();
    c.ellipse(this.cx, tubY, tubW, R * 0.2, 0, 0, TAU);
    c.clip();
    c.fillStyle = vgrad(c, tubY - 20, tubY + 20, '#BFEFFF', '#7FD6F5');
    c.fillRect(0, tubY - 40, W, 80);
    c.restore();
    // Foam cresting the water
    for (let i = 0; i < 11; i++) {
      const x = this.cx - tubW * 0.84 + (i * tubW * 1.68) / 10, r = 15 + Math.sin(i * 2.1 + this.t * 1.4) * 2 + (i % 3) * 2;
      c.fillStyle = clay(c, x, tubY + 2, r, '#FFFFFF');
      ell(c, x, tubY + 3, r);
      c.fill();
    }
    c.fillStyle = hgrad(c, this.cx - tubW, this.cx + tubW, '#DDE9FF', '#FFFFFF', '#FFFFFF', '#CBDAF5');
    c.beginPath();
    c.moveTo(this.cx - tubW, tubY);
    c.quadraticCurveTo(this.cx, tubY + R * 0.32, this.cx + tubW, tubY);
    c.bezierCurveTo(this.cx + tubW, tubY + R * 1.04, this.cx + tubW * 0.76, tubY + R * 1.16, this.cx, tubY + R * 1.16);
    c.bezierCurveTo(this.cx - tubW * 0.76, tubY + R * 1.16, this.cx - tubW, tubY + R * 1.04, this.cx - tubW, tubY);
    c.fill();
    gloss(c, this.cx - tubW * 0.5, tubY + R * 0.46, tubW * 0.3, R * 0.14, 0.9);
    c.fillStyle = '#FFC233';
    for (const k of [-1, 1]) {
      ell(c, this.cx + k * tubW * 0.72, tubY + R * 1.16, 12, 7);
      c.fill();
    }

    // Duck on the water
    const dk = this.duck;
    if (dk.on) {
      c.save();
      c.translate(this.cx - tubW * 0.72 + Math.sin(dk.ph * 0.5) * 8, tubY - 12 + Math.sin(dk.ph * 2) * 2);
      c.rotate(Math.sin(dk.ph * 1.6) * 0.08);
      drawDuck(c, 15);
      c.restore();
    }

    // Water droplets
    c.fillStyle = '#7FD0FF';
    for (const d of this.drops) {
      ell(c, d.x, d.y, 2.6, 5);
      c.fill();
    }
  },

  drawFood(c) {
    const W = this.W, H = this.H, R = this.R;
    const back = softBack('kitchen', W, H, '#FFE7C7', '#FFD7C4', (x) => {
      x.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 6; i++) {
        for (let k = 0; k < 11; k++) {
          if ((i + k) % 2) x.fillRect(i * (W / 5), k * 72, W / 5, 72);
        }
      }
      // Window with a little scene
      const wx = W * 0.7, wy = 80 + app.safeTop;
      x.fillStyle = '#fff';
      rr(x, wx - 8, wy - 8, 116, 116, 20);
      x.fill();
      x.fillStyle = vgrad(x, wy, wy + 100, '#9EE0FF', '#E6FFF2');
      rr(x, wx, wy, 100, 100, 14);
      x.fill();
      x.save();
      rr(x, wx, wy, 100, 100, 14);
      x.clip();
      x.fillStyle = '#8FE292';
      ell(x, wx + 28, wy + 104, 56, 30);
      x.fill();
      x.fillStyle = '#7CD38F';
      ell(x, wx + 84, wy + 108, 50, 30);
      x.fill();
      x.fillStyle = '#fff';
      for (const [cx, cy, r] of [[wx + 26, wy + 28, 12], [wx + 40, wy + 24, 15], [wx + 54, wy + 30, 10]]) {
        ell(x, cx, cy, r);
        x.fill();
      }
      x.fillStyle = '#FFD45C';
      ell(x, wx + 80, wy + 22, 11);
      x.fill();
      x.restore();
      // Table
      x.fillStyle = vgrad(x, H * 0.58, H, '#FFF6EC', '#F3D7BE');
      x.fillRect(0, H * 0.585, W, H);
    });
    c.drawImage(back.cv, 0, 0, W, H);
    groundShadow(c, this.cx, this.py + R * 0.96, R * 1.05, R * 0.2);
    this.drawPet(c);
    // Bib
    const { x, y } = this.petPos();
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.beginPath();
    c.moveTo(x - R * 0.46, y + R * 0.46);
    c.quadraticCurveTo(x, y + R * 0.6, x + R * 0.46, y + R * 0.46);
    c.quadraticCurveTo(x + R * 0.38, y + R * 0.92, x, y + R * 0.94);
    c.quadraticCurveTo(x - R * 0.38, y + R * 0.92, x - R * 0.46, y + R * 0.46);
    c.fill();
    heart(c, x, y + R * 0.71, R * 0.12);
    c.fillStyle = P.rose;
    c.fill();
    // Serving tray
    c.fillStyle = '#FFFFFF';
    rr(c, 10, this.trayY - 44, W - 20, 82, 26);
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = '#F7D9B8';
    c.stroke();
  },

  drawBed(c) {
    const W = this.W, H = this.H, R = this.R, lamp = this.lamp;
    const back = softBack('bedroom', W, H, '#3A3190', '#6A52B8', (x) => {
      // Wallpaper dots
      x.fillStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i < 90; i++) {
        ell(x, (i * 83.3) % W, (i * 47.9) % H, 5);
        x.fill();
      }
      const wx = W * 0.62, wy = app.safeTop + 58;
      const ww = Math.min(130, W * 0.3), wh = ww * 1.18;
      x.fillStyle = '#FFFFFF';
      rr(x, wx - 8, wy - 8, ww + 16, wh + 16, 18);
      x.fill();
      x.fillStyle = vgrad(x, wy, wy + wh, '#1C1A58', '#4A3AA0');
      rr(x, wx, wy, ww, wh, 12);
      x.fill();
      x.fillStyle = clay(x, wx + ww * 0.62, wy + wh * 0.3, 18, '#FFF3C4');
      ell(x, wx + ww * 0.62, wy + wh * 0.3, 18);
      x.fill();
      for (let i = 0; i < 12; i++) {
        softStar(x, wx + 8 + ((i * 47) % (ww - 14)), wy + 8 + ((i * 29) % (wh - 14)), 2.4, 4, 0.4);
        x.fillStyle = '#FFF8D8';
        x.fill();
      }
      x.fillStyle = vgrad(x, H * 0.7, H, '#7C5AC0', '#5A3F9C');
      x.fillRect(0, H * 0.7, W, H);
    });
    c.drawImage(back.cv, 0, 0, W, H);

    const bedY = this.py + R * 0.74, bedW = Math.min(W * 0.44, R * 1.9);
    // Headboard
    c.fillStyle = vgrad(c, this.py - R * 1.1, bedY, '#FFD0E3', '#FF9FC3');
    rr(c, this.cx - bedW * 0.94, this.py - R * 1.1, bedW * 1.88, R * 2, R * 0.6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)';
    rr(c, this.cx - bedW * 0.72, this.py - R * 0.92, bedW * 1.44, R * 0.24, R * 0.12);
    c.fill();
    // Pillow
    c.fillStyle = clay(c, this.cx, this.py - R * 0.32, R, '#FFFFFF');
    rr(c, this.cx - R * 1.12, this.py - R * 0.8, R * 2.24, R * 0.96, R * 0.4);
    c.fill();

    this.drawPet(c);

    // Mattress
    c.fillStyle = hgrad(c, this.cx - bedW, this.cx + bedW, '#E6DAFF', '#FFFFFF', '#E6DAFF');
    rr(c, this.cx - bedW, bedY, bedW * 2, R * 0.8, R * 0.26);
    c.fill();
    // Blanket pulled up by a finger
    const blk = this.blanket;
    const top = lerp(bedY + R * 0.22, this.py + R * 0.34, blk);
    c.fillStyle = vgrad(c, top, bedY + R * 0.8, '#8FC8FF', '#6FA8F5');
    rr(c, this.cx - bedW * 1.02, top, bedW * 2.04, bedY + R * 0.82 - top, R * 0.3);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,.55)';
    rr(c, this.cx - bedW * 1.02, top, bedW * 2.04, R * 0.2, R * 0.1);
    c.fill();
    for (let i = 0; i < 14; i++) {
      const x = this.cx - bedW * 0.88 + ((i * 53) % (bedW * 1.76)), y = top + R * 0.32 + ((i * 37) % Math.max(10, bedY + R * 0.7 - top - R * 0.32));
      softStar(c, x, y, 5.5);
      c.fillStyle = 'rgba(255,255,255,.6)';
      c.fill();
    }

    // Zzz bubbles
    if (this.sleep > 0.5) {
      for (let i = 0; i < 3; i++) {
        const u = (this.t * 0.26 + i / 3) % 1;
        c.fillStyle = alpha('#FFFFFF', 0.8 * (1 - u));
        ell(c, this.cx + R * 0.7 + u * R * 0.5, this.py - R * 0.6 - u * R * 0.9, 4 + u * 13);
        c.fill();
      }
    }

    // Lamp on a little table
    const lx = this.lampX = Math.max(46, this.cx - bedW - 8), ly = this.lampY = bedY - 16;
    c.fillStyle = '#C89462';
    rr(c, lx - 20, ly + 40, 40, 70, 8);
    c.fill();
    c.fillStyle = '#F2E2FF';
    rr(c, lx - 3.5, ly, 7, 42, 3);
    c.fill();
    c.fillStyle = vgrad(c, ly - 44, ly, this.lampOn ? '#FFF6B8' : '#B9A8D8', this.lampOn ? '#FFD45C' : '#8F7EB8');
    c.beginPath();
    c.moveTo(lx - 12, ly - 44);
    c.lineTo(lx + 12, ly - 44);
    c.lineTo(lx + 28, ly);
    c.lineTo(lx - 28, ly);
    c.closePath();
    c.fill();

    // Dim the room with the lamp; glow around it
    if (lamp < 1) {
      c.fillStyle = `rgba(18,12,60,${(1 - lamp) * 0.52})`;
      c.fillRect(0, 0, W, H);
    }
    if (lamp > 0.02) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      glow(c, lx, ly - 16, 210, '#FFD680', 0.5 * lamp);
      c.restore();
    }
    // Night-time ceiling stars from the night-light
    if (lamp < 0.5) {
      for (let i = 0; i < 16; i++) {
        const x = (i * 97.7) % W, y = ((i * 53.3) % (H * 0.3)) + 40, k = 0.5 + 0.5 * Math.sin(this.t * 2 + i);
        softStar(c, x, y, 4 + k * 3, 4, 0.4);
        c.fillStyle = `rgba(255,245,190,${(1 - lamp * 2) * (0.4 + 0.5 * k)})`;
        c.fill();
      }
    }

    // Hanging mobile
    const mx = this.cx - R * 0.1, my = app.safeTop + 28;
    c.save();
    c.translate(mx, my);
    c.rotate(this.mobile.x * 0.3);
    c.strokeStyle = 'rgba(255,255,255,.8)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 10); c.moveTo(-52, 10); c.lineTo(52, 10); c.stroke();
    [[-52, 34, P.butter], [0, 48, P.pink], [52, 34, P.sky]].forEach(([x, l, col], i) => {
      const sw = Math.sin(this.t * 1.1 + i * 2) * 4;
      c.beginPath(); c.moveTo(x, 10); c.lineTo(x + sw, 10 + l); c.stroke();
      softStar(c, x + sw, 10 + l + 11, 13);
      c.fillStyle = col;
      c.fill();
    });
    c.restore();
    this.mobilePos = { x: mx, y: my + 44 };
  },

  draw(c) {
    if (this.room === 'bath') this.drawBath(c);
    if (this.room === 'food') this.drawFood(c);
    if (this.room === 'bed') this.drawBed(c);

    // Bottom shelf
    for (const b of this.buttons) b.draw(c);
    for (const t of this.tools) {
      if (t === this.hold) continue;
      this.drawTool(c, t);
    }
    if (this.hold) this.drawTool(c, this.hold);
  },

  drawTool(c, t) {
    c.save();
    c.translate(t.x, t.y + (t === this.hold ? -6 : Math.sin(this.t * 2 + t.hx) * 1.6));
    const on = t === this.hold ? 1.28 : 1;
    c.scale(on * (t.s || 1), on * (t.s || 1));
    if (t.food && t.bites) c.scale(1 - t.bites * 0.3, 1 - t.bites * 0.3);
    t.paint(c, t.r);
    c.restore();
  },

  // ---- input -----------------------------------------------------------------------
  down(p) {
    this.look.x = p.x; this.look.y = p.y;
    for (let i = this.tools.length - 1; i >= 0; i--) {
      const t = this.tools[i];
      if (dist(p.x, p.y, t.x, t.y) < t.r + 16) {
        if (t.id === 'duck') {
          this.say('coo');
          audio.sfx('boing', { rate: 1.4 });
          fx.bubbles(t.x, t.y, 5);
          t.s = 1.3;
          tween(t, { s: 1 }, 0.3, { ease: E.elastic });
          return;
        }
        this.hold = t;
        p.tool = t;
        t.x = p.x;
        t.y = p.y;
        audio.sfx('tap', { rate: 1.1 });
        return;
      }
    }
    if (this.room === 'bed') {
      if (dist(p.x, p.y, this.lampX, this.lampY - 20) < 46) {
        this.lampOn = !this.lampOn;
        audio.sfx('tick', { vol: 1 });
        audio.note('marimba', this.lampOn ? 72 : 67, { vol: 0.5 });
        haptic();
        if (!this.lampOn) wait(0.3, () => this.say('yawn'));
        return;
      }
      if (this.mobilePos && dist(p.x, p.y, this.mobilePos.x, this.mobilePos.y) < 76) {
        this.mobile.kick(rand(-2.4, 2.4));
        audio.sparkle(Math.floor(rand(0, 4)), 3, 0.35);
        return;
      }
      const bedY = this.py + this.R * 0.74;
      const top = lerp(bedY + this.R * 0.22, this.py + this.R * 0.34, this.blanket);
      if (p.y > top - 22 && p.y < bedY + this.R && Math.abs(p.x - this.cx) < this.R * 2) {
        p.blanket = true;
        p.blank0 = this.blanket;
        return;
      }
    }
    const pp = this.petPos();
    if (dist(p.x, p.y, pp.x, pp.y) < this.R * 1.1) {
      this.sq.kick(5);
      this.feel(pick(['happy', 'happy', 'wow', 'heart']), 0.9);
      this.say(pick(['giggle', 'coo', 'chirp']));
      fx.hearts(p.x, p.y, 4);
      haptic();
      if (this.room === 'bed' && this.sleep > 0.4) this.sleep = 0;
      p.tickle = true;
      return;
    }
    fx.sparkle(p.x, p.y, 4);
  },

  move(p) {
    this.look.x = p.x; this.look.y = p.y;
    if (p.tool) {
      const dx = p.x - p.px, dy = p.y - p.py;
      p.tool.x = p.x;
      p.tool.y = p.y;
      if (this.room === 'bath') {
        if (p.tool.id === 'soap') this.bathTool(p.tool, p.x, p.y, dx, dy);
        if (p.tool.id === 'towel') this.towelRub(p.x, p.y, dx, dy);
      }
      return;
    }
    if (p.blanket) {
      const k = (p.sy - p.y) / (this.R * 0.9);
      const was = this.blanket;
      this.blanket = clamp(p.blank0 + k);
      if (Math.abs(was - this.blanket) > 0.02) audio.sfx('swish', { rate: 0.7, vol: 0.5, gap: 120 });
      if (this.blanket > 0.6 && !save.data.seen.bed) {
        save.data.seen.bed = 1;
        hint.set({ from: [this.lampX, this.lampY - 20], delay: 1.2 });
      }
      return;
    }
    if (p.tickle && Math.hypot(p.x - p.px, p.y - p.py) > 3 && Math.random() < 0.08) {
      this.say('giggle');
      this.sq.kick(rand(-2, 2));
      fx.hearts(p.x, p.y, 1);
    }
  },

  up(p) {
    if (p.tickle) p.tickle = false;
    if (p.blanket && this.blanket > 0.7) {
      audio.sfx('swish', { rate: 0.55 });
      this.sq.kick(1);
    }
    const t = p.tool;
    if (!t) return;
    if (this.hold === t) this.hold = null;
    if (t.food) {
      const d = dist(t.x, t.y, this.cx, this.py + this.R * 0.2);
      if (d < this.R * 1.25) {
        // Eaten: this food slot refills with something new
        t.x = t.hx;
        t.y = t.hy + 110;
        const others = Object.keys(FOODS).filter((n) => !this.tools.some((q) => q.id === n));
        this.bite({ id: t.id });
        const nid = pick(others);
        t.id = nid;
        t.paint = FOODS[nid];
        tween(t, { y: t.hy }, 0.42, { ease: E.back, delay: 0.3 });
        return;
      }
    }
    tween(t, { x: t.hx, y: t.hy }, 0.3, { ease: E.back });
    if (this.room === 'bath' && t.id === 'shower' && !this.foam.length && !this.mud.length) this.sq.kick(4);
  }
};
