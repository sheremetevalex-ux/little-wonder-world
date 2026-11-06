// Singing garden: plant flowers, and a little bee flies over them and they sing.
// It is a real step sequencer, but all she sees is a garden. Every note is in
// pentatonic over a soft chord, so whatever she grows becomes a nice little song.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, clay, light, dark, gloss, alpha, vgrad, glow, TAU, softStar, heart, sparkleShape, groundShadow } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature } from '../art/creatures.js';

const COLS = 6, ROWS = 5;
const PETALS = ['#FF82AF', '#FFB54D', '#FFE05C', '#6FD8FF', '#B48BFF'];
const NOTES = [7, 5, 4, 2, 0];
const INSTS = ['kalimba', 'bell', 'marimba', 'harp'];
const INST_COL = [P.coral, P.sky, P.mint, P.lilac];
const CHORDS = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];

const SEED = [[0, 4], [1, 2], [2, 1], [3, 0], [4, 2], [5, 3]];

export const garden = {
  tint: '#A8E6A1',

  enter() {
    this.t = 0;
    this.layout();
    const saved = save.data.garden;
    this.grid = saved && saved.length === COLS * ROWS ? [...saved] : new Array(COLS * ROWS).fill(0);
    if (!saved) for (const [c, r] of SEED) this.grid[c + r * COLS] = 1;
    this.anim = this.grid.map((v) => ({ s: v ? 1 : 0, sq: new Spring(1, 300, 9), sing: 0 }));
    this.step = 0;
    this.inst = save.data.gardenInst || 0;
    this.bpm = 96;
    this.next = 0;
    this.bar = 0;
    this.beePos = { x: this.colX(0), y: 0 };
    this.queue = [];
    this.playing = true;
    this.touched = 0;
    music.play(null);
    this.makeButtons();
    if (!save.data.seen.garden) {
      hint.set({ from: [this.colX(3), this.rowY(3)], delay: 3 });
    }
  },
  exit() {
    save.data.garden = this.grid;
    save.data.gardenInst = this.inst;
    save.touch();
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.cell = Math.min((W - 18) / COLS, (H - 260 - app.safeTop) / ROWS, 92);
    this.gx = W / 2 - (this.cell * COLS) / 2 + this.cell / 2;
    this.gy = Math.max(app.safeTop + 120, (H - (this.cell * ROWS)) / 2 - 10 + this.cell * 0.3);
    this.btnY = H - 58 - app.safeBottom * 0.6;
  },
  resize() { this.layout(); this.makeButtons(); },
  colX(c) { return this.gx + c * this.cell; },
  rowY(r) { return this.gy + r * this.cell; },

  makeButtons() {
    const y = this.btnY, W = this.W;
    this.buttons = [
      new Btn({
        x: W / 2 - 92, y, r: 30, slop: 8,
        paint: (c, r) => {
          candy(c, r, INST_COL[this.inst]);
          // Each sound is a little friend who sings
          drawCreature(c, ['moko', 'unicorn', 'frog', 'bunny'][this.inst], { R: r * 0.58, t: this.t, mouthOpen: 0.6 });
        },
        tap: () => {
          this.inst = (this.inst + 1) % INSTS.length;
          audio.note(INSTS[this.inst], 79, { vol: 0.7 });
          audio.sparkle(this.inst, 2, 0.3);
        }
      }),
      new Btn({
        x: W / 2, y, r: 30, slop: 8,
        paint: (c, r) => {
          candy(c, r, P.sun);
          // Magic seeds: a surprise tune
          for (const [x, y2, k] of [[-8, -3, PETALS[0]], [8, -5, PETALS[3]], [0, 8, PETALS[4]]]) {
            c.fillStyle = k;
            ell(c, x, y2, 7);
            c.fill();
            c.fillStyle = '#fff';
            ell(c, x - 2, y2 - 2.4, 2);
            c.fill();
          }
        },
        tap: () => this.surprise()
      }),
      new Btn({
        x: W / 2 + 92, y, r: 30, slop: 8,
        paint: (c, r) => {
          candy(c, r, '#9EC7FF');
          // A breeze clears the bed
          c.strokeStyle = '#fff';
          c.lineWidth = 4.5;
          c.lineCap = 'round';
          c.beginPath(); c.moveTo(-14, -6); c.lineTo(6, -6); c.arc(6, -11, 5, 1.57, -1.2, true); c.stroke();
          c.beginPath(); c.moveTo(-14, 2); c.lineTo(11, 2); c.stroke();
          c.beginPath(); c.moveTo(-9, 10); c.lineTo(5, 10); c.arc(5, 15, 5, -1.57, 1.2); c.stroke();
        },
        tap: () => this.clearAll()
      })
    ];
  },

  surprise() {
    audio.sfx('whoosh');
    this.grid.fill(0);
    // A simple melodic walk: climbs and falls, so that it reads as a tune
    let r = Math.floor(rand(0, ROWS));
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.85) {
        this.grid[c + r * COLS] = 1;
        if (Math.random() < 0.25) this.grid[c + ((r + 2) % ROWS) * COLS] = 1;
      }
      r = clamp(r + pick([-1, -1, 1, 1, 0]), 0, ROWS - 1);
    }
    this.grid.forEach((v, i) => {
      const a = this.anim[i];
      a.s = 0;
      if (v) tween(a, { s: 1 }, 0.4, { ease: E.back, delay: ((i % COLS) + Math.floor(i / COLS)) * 0.03 });
    });
    audio.sparkle(0, 6, 0.35);
  },

  clearAll() {
    audio.sfx('whoosh', { vol: 1 });
    this.grid.forEach((v, i) => {
      if (!v) return;
      const x = this.colX(i % COLS), y = this.rowY(Math.floor(i / COLS));
      fx.add({ kind: 'dot', x, y, vx: rand(150, 300), vy: rand(-60, 30), g: 40, size: rand(8, 13), life: 1, color: PETALS[Math.floor(i / COLS)] });
    });
    this.grid.fill(0);
    this.anim.forEach((a) => { a.s = 0; });
  },

  scheduleStep(when) {
    const st = this.step, stepDur = 60 / this.bpm / 2;
    if (st % COLS === 0) {
      const ch = CHORDS[this.bar % 4];
      this.bar++;
      for (let i = 1; i < 4; i++) audio.note('pad', ch[i], { vol: 0.09, when, wet: 0.5, dur: stepDur * COLS + 0.4 });
      audio.note('bass', ch[0], { vol: 0.26, when, wet: 0.2 });
    }
    if (st % 4 === 2) audio.note('marimba', 60 + 24, { vol: 0.03, when });
    const col = st % COLS;
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[col + r * COLS]) {
        audio.note(INSTS[this.inst], penta(NOTES[r] - 2), { vol: 0.56, when, wet: 0.65, pan: (col / (COLS - 1) - 0.5) * 0.6 });
      }
    }
    this.queue.push({ when, col });
    this.step++;
  },

  update(dt) {
    this.t += dt;
    if (audio.running) {
      const stepDur = 60 / this.bpm / 2;
      if (this.next < audio.now) this.next = audio.now + 0.05;
      while (this.next < audio.now + 0.14) {
        this.scheduleStep(this.next);
        this.next += stepDur;
      }
      while (this.queue.length && this.queue[0].when <= audio.now) {
        const q = this.queue.shift();
        this.curCol = q.col;
        this.colT = audio.now;
        for (let r = 0; r < ROWS; r++) {
          const i = q.col + r * COLS;
          if (this.grid[i]) {
            const a = this.anim[i];
            a.sq.kick(5);
            a.sing = 1;
            if (Math.random() < 0.5) fx.add({ kind: 'sparkle', x: this.colX(q.col), y: this.rowY(r) - this.cell * 0.2, vx: rand(-20, 20), vy: rand(-70, -30), size: 12, life: 0.6, color: PETALS[r] });
          }
        }
      }
    } else {
      // No audio context yet (or tab just woke): keep the bee moving anyway
      this.fakeT = (this.fakeT || 0) + dt;
      this.curCol = Math.floor(this.fakeT / (60 / this.bpm / 2)) % COLS;
    }
    for (const a of this.anim) {
      a.sq.step(dt);
      a.sing = Math.max(0, a.sing - dt * 2.6);
    }
    // The bee flies smoothly above the row of the current beat
    const tx = this.colX(this.curCol ?? 0);
    const wrap = tx < this.beePos.x - this.cell * 3;
    this.beePos.x += (tx - this.beePos.x) * (wrap ? 1 : Math.min(1, dt * 14));
  },

  drawFlower(c, x, y, r, a, row) {
    const k = a.s;
    if (k <= 0.01) return;
    const col = PETALS[row], q = a.sq.x, s = (this.cell / 50) * k;
    c.save();
    c.translate(x, y + this.cell * 0.34);
    c.rotate(Math.sin(this.t * 1.8 + x + row) * 0.05);
    c.scale(s * (2 - q), s * q);
    c.strokeStyle = '#3EAB5E';
    c.lineWidth = 4.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -22);
    c.stroke();
    c.fillStyle = '#67CF74';
    ell(c, 8, -10, 9, 4, -0.5);
    c.fill();
    c.translate(0, -30);
    if (a.sing > 0) glow(c, 0, 0, 34, col, a.sing * 0.9);
    for (let i = 0; i < 7; i++) {
      const an = (i / 7) * TAU + 0.3;
      c.fillStyle = clay(c, Math.cos(an) * 11, Math.sin(an) * 11, 8, col);
      ell(c, Math.cos(an) * 11.5, Math.sin(an) * 11.5, 7.6);
      c.fill();
    }
    c.fillStyle = clay(c, 0, 0, 9, '#FFE27D');
    ell(c, 0, 0, 9.2);
    c.fill();
    c.fillStyle = '#5A3A2E';
    if (a.sing > 0.2) {
      c.lineWidth = 1.6;
      c.strokeStyle = '#5A3A2E';
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.arc(sx * 3.2, -1, 1.7, Math.PI + 0.3, -0.3);
        c.stroke();
      }
      c.fillStyle = '#C24A63';
      ell(c, 0, 3.5, 2.5, 3);
      c.fill();
    } else {
      for (const sx of [-1, 1]) {
        ell(c, sx * 3.2, -1, 1.2, 1.5);
        c.fill();
      }
      c.lineWidth = 1.2;
      c.strokeStyle = '#5A3A2E';
      c.beginPath();
      c.arc(0, 1.5, 2, 0.3, Math.PI - 0.3);
      c.stroke();
    }
    c.restore();
  },

  draw(c) {
    const W = this.W, H = this.H, cell = this.cell;
    const back = softBack('garden', W, H, '#BDEBFF', '#DFF8D8', (x) => {
      x.fillStyle = 'rgba(255,255,255,.75)';
      for (const [px, py, r] of [[W * 0.2, 86, 26], [W * 0.28, 80, 34], [W * 0.36, 90, 22], [W * 0.78, 120, 22], [W * 0.85, 114, 28]]) {
        ell(x, px, py + app.safeTop * 0.5, r);
        x.fill();
      }
      x.fillStyle = vgrad(x, this.gy - cell, H, '#A9EB9A', '#6BCF85');
      x.beginPath();
      x.moveTo(0, this.gy - cell * 0.7);
      x.quadraticCurveTo(W / 2, this.gy - cell * 1.5, W, this.gy - cell * 0.7);
      x.lineTo(W, H);
      x.lineTo(0, H);
      x.closePath();
      x.fill();
      // Soil beds: one row for each pitch
      for (let r = 0; r < ROWS; r++) {
        const y = this.rowY(r);
        x.fillStyle = vgrad(x, y - cell * 0.4, y + cell * 0.42, '#9A6B47', '#7E5235');
        rr(x, this.gx - cell * 0.58, y - cell * 0.13, cell * COLS + cell * 0.16 - cell * 0.0, cell * 0.56, cell * 0.26);
        x.fill();
        x.fillStyle = 'rgba(255,255,255,.08)';
        rr(x, this.gx - cell * 0.5, y - cell * 0.09, cell * COLS - cell * 0.1, cell * 0.14, cell * 0.07);
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);

    // A moving band of light marks the beat
    if (this.curCol !== undefined) {
      const x = this.colX(this.curCol);
      c.fillStyle = 'rgba(255,255,255,.14)';
      rr(c, x - cell * 0.46, this.rowY(0) - cell * 0.56, cell * 0.92, cell * (ROWS + 0.08), cell * 0.3);
      c.fill();
    }

    // Planting spots
    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const i = col + r * COLS, x = this.colX(col), y = this.rowY(r);
        if (!this.grid[i]) {
          c.fillStyle = 'rgba(70,40,20,.32)';
          ell(c, x, y + cell * 0.14, cell * 0.14, cell * 0.08);
          c.fill();
        }
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const i = col + r * COLS;
        if (this.grid[i]) this.drawFlower(c, this.colX(col), this.rowY(r), cell, this.anim[i], r);
      }
    }

    // The bee
    const bx = this.beePos.x, by = this.rowY(0) - cell * 0.92 + Math.sin(this.t * 5) * 4;
    groundShadow(c, bx, this.rowY(0) - cell * 0.42, 18, 4.5, 0.16);
    c.save();
    c.translate(bx, by);
    drawCreature(c, 'bee', { R: 25, t: this.t, eyes: 'happy', mouthOpen: 0.4, lean: Math.sin(this.t * 3) * 0.1 });
    c.restore();

    for (const b of this.buttons) b.draw(c);
  },

  down(p) {
    const col = Math.round((p.x - this.gx) / this.cell), r = Math.round((p.y - this.gy - this.cell * 0.05) / this.cell);
    if (col < 0 || col >= COLS || r < 0 || r >= ROWS) return;
    p.paint = true;
    p.setTo = this.grid[col + r * COLS] ? 0 : 1;
    this.setCell(col, r, p.setTo);
    p.lastCell = col + r * COLS;
    save.data.seen.garden = 1;
    hint.clear();
  },

  move(p) {
    if (!p.paint) return;
    const col = Math.round((p.x - this.gx) / this.cell), r = Math.round((p.y - this.gy - this.cell * 0.05) / this.cell);
    if (col < 0 || col >= COLS || r < 0 || r >= ROWS) return;
    const i = col + r * COLS;
    if (i !== p.lastCell) {
      p.lastCell = i;
      if (this.grid[i] !== p.setTo) this.setCell(col, r, p.setTo);
    }
  },

  setCell(col, r, v) {
    if (++this.touched === 12) { save.earnStar(); audio.sparkle(3, 4, 0.3); fx.stars(this.W / 2, this.gy, 12); }
    const i = col + r * COLS;
    this.grid[i] = v;
    const a = this.anim[i];
    const x = this.colX(col), y = this.rowY(r);
    if (v) {
      a.s = 0;
      tween(a, { s: 1 }, 0.42, { ease: E.back });
      a.sing = 1;
      audio.note(INSTS[this.inst], penta(NOTES[r] - 2), { vol: 0.62, wet: 0.7, pan: (col / (COLS - 1) - 0.5) * 0.6 });
      fx.burst(x, y, { kind: 'dot', n: 5, colors: ['#9A6B47', '#7E5235'], speed: 110, size: 6, g: 500, life: 0.5, spin: 0 });
      haptic();
    } else {
      audio.sfx('popBack', { vol: 0.6 });
      fx.burst(x, y - this.cell * 0.2, { kind: 'dot', n: 6, colors: [PETALS[r]], speed: 90, size: 7, g: 200, life: 0.6, spin: 0 });
      a.s = 0;
    }
  }
};
