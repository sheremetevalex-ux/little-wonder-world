// Pop toy: a big silicone board you can press or sweep across. When every dome is
// popped, the board flips over with all domes up again, in a new shape. Some domes
// hide a little friend who peeks out.
import { app, hint, wait, tween, Spring, haptic, Btn, candy } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, clay, light, dark, gloss, vgrad, sprite, heart, softStar, TAU } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature } from '../art/creatures.js';

// Each shape is a grid mask. Rainbow bands run across, as with the real toys.
const SHAPES = [
  { name: 'heart', rows: ['0110110', '1111111', '1111111', '1111111', '0111110', '0011100', '0001000'] },
  { name: 'star', rows: ['0001000', '0011100', '1111111', '0111110', '0111110', '0110110', '1100011'] },
  { name: 'flower', rows: ['0011100', '0111110', '1111111', '1111111', '1111111', '0111110', '0011100'] },
  { name: 'cat', rows: ['1000001', '1100011', '1111111', '1111111', '1111111', '0111110', '0011100'] },
  { name: 'butterfly', rows: ['1100011', '1110111', '1111111', '0111110', '1111111', '1110111', '0100010'] },
  { name: 'fish', rows: ['0011100', '0111110', '1111111', '1111111', '0111110', '0011101', '0000011'] },
  { name: 'square', rows: ['1111111', '1111111', '1111111', '1111111', '1111111', '1111111', '1111111'] }
];
const BANDS = ['#FF6F91', '#FF9F5C', '#FFD84D', '#6FDB8F', '#55C6F5', '#7F97FF', '#B98AFF'];
const PALETTES = [
  BANDS,
  ['#FF8FC4', '#FFB3D9', '#D9A6FF', '#B48BFF', '#8FB5FF', '#7FD6FF', '#7FEBD6'],
  ['#FFD84D', '#FFB84D', '#FF9F5C', '#FF7F7F', '#FF6FA8', '#D96FD9', '#9F7FEB'],
  ['#7FEBC6', '#6FDBB8', '#55C6C6', '#55B0E6', '#6F97F2', '#8F87F2', '#B98AFF']
];

function domeSprite(col, up) {
  return sprite(`dome:${col}:${up ? 1 : 0}`, 56, 56, (c) => {
    const x = 28, y = 28, r = 22;
    if (up) {
      // Raised dome: long soft highlight, darker foot
      c.fillStyle = 'rgba(60,20,90,.22)';
      ell(c, x, y + 2.4, r + 2.4, r + 2);
      c.fill();
      const g = c.createRadialGradient(x - 7, y - 9, 2, x, y, r + 1);
      g.addColorStop(0, light(col, 0.72));
      g.addColorStop(0.42, light(col, 0.16));
      g.addColorStop(0.86, col);
      g.addColorStop(1, dark(col, 0.2));
      c.fillStyle = g;
      ell(c, x, y, r);
      c.fill();
      gloss(c, x - 7, y - 9, 8.5, 5.2, 0.9, -0.5);
      c.strokeStyle = 'rgba(255,255,255,.3)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(x, y, r - 2.5, 0.4, 1.9);
      c.stroke();
    } else {
      // Pushed-in: the light now falls on the far lower wall
      const g = c.createRadialGradient(x + 3, y + 6, 2, x, y, r + 1);
      g.addColorStop(0, dark(col, 0.1));
      g.addColorStop(0.55, dark(col, 0.26));
      g.addColorStop(0.92, dark(col, 0.42));
      g.addColorStop(1, dark(col, 0.2));
      c.fillStyle = g;
      ell(c, x, y, r);
      c.fill();
      c.strokeStyle = light(col, 0.38);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, r - 0.5, 0.3, 2.6);
      c.stroke();
      c.strokeStyle = 'rgba(40,10,60,.3)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, r - 0.5, 3.4, 5.9);
      c.stroke();
    }
  });
}

export const popit = {
  tint: '#B9A0FF',

  enter() {
    this.t = 0;
    this.shape = 0;
    this.palette = 0;
    this.flip = { a: 0 };
    this.bx = new Spring(0, 90, 7);
    this.flipping = false;
    this.combo = 0;
    this.lastPop = 0;
    this.layout();
    this.makeBoard();
    music.play('dream');
    if (!save.data.seen.popit) {
      const a = this.cells[0], b = this.cells[Math.min(this.cells.length - 1, 12)];
      hint.set({ from: [a.x, a.y], to: [b.x, b.y], delay: 1.2 });
    }
  },
  resize() { this.layout(); this.makeBoard(true); },

  layout() {
    this.W = app.W;
    this.H = app.H;
    const maxBoard = Math.min(this.W - 20, this.H - 170);
    this.size = maxBoard;
    this.cell = this.size / 7.5;
    this.cx = this.W / 2;
    this.cy = this.H * 0.53;
  },

  makeBoard(keep) {
    const S = SHAPES[this.shape], grid = S.rows, cells = [];
    const oldUp = keep && this.cells ? this.cells : null;
    const pal = PALETTES[this.palette];
    grid.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] !== '1') continue;
        cells.push({
          rx, ry, x: this.cx + (rx - 3) * this.cell, y: this.cy + (ry - 3) * this.cell,
          col: pal[ry % pal.length], up: true, sq: new Spring(1, 520, 14), wob: 0, peek: 0, friend: null
        });
      }
    });
    // A few friends hide under domes: finding them is the surprise
    const owned = save.data.friends;
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) pick(cells).friend = pick(owned);
    this.cells = cells;
    this.left = cells.length;
    if (oldUp) oldUp.forEach((o, i) => { if (cells[i]) cells[i].up = o.up; });
  },

  boardPath(c, pad = 0) {
    // The board outline is the union of rounded cell tiles
    const s = this.cell, R = s * 0.5 + pad;
    for (const q of this.cells) {
      ell(c, q.x, q.y, R * 1.06);
      c.fill();
      for (const o of this.cells) {
        if (o === q) continue;
        const dx = Math.abs(o.rx - q.rx), dy = Math.abs(o.ry - q.ry);
        if (dx + dy === 1 && (o.rx > q.rx || o.ry > q.ry)) {
          const mx = Math.min(q.x, o.x), my = Math.min(q.y, o.y);
          if (dy === 0) c.fillRect(mx, my - R, s, R * 2);
          else c.fillRect(mx - R, my, R * 2, s);
        }
      }
    }
  },

  boardSprite() {
    const key = `popboard:${this.shape}:${this.palette}:${this.size | 0}`;
    return sprite(key, this.W, this.H, (c) => {
      const k = c.canvas.width / this.W;
      const layer = (pad) => {
        const cv = document.createElement('canvas');
        cv.width = c.canvas.width;
        cv.height = c.canvas.height;
        const m = cv.getContext('2d');
        m.scale(k, k);
        m.fillStyle = '#fff';
        this.boardPath(m, pad);
        return { cv, m };
      };
      // Shadow and pale rim come from solid silhouettes so that overlaps never show
      const sh = layer(3);
      sh.m.globalCompositeOperation = 'source-in';
      sh.m.fillStyle = 'rgba(50,20,110,1)';
      sh.m.fillRect(0, 0, this.W, this.H);
      c.globalAlpha = 0.3;
      c.drawImage(sh.cv, 0, 9, this.W, this.H);
      c.globalAlpha = 0.65;
      c.drawImage(layer(6).cv, 0, 0, this.W, this.H);
      c.globalAlpha = 1;
      const face = layer(2);
      face.m.globalCompositeOperation = 'source-in';
      const pal = PALETTES[this.palette];
      face.m.fillStyle = pal[0];
      face.m.fillRect(0, 0, this.W, this.H);
      face.m.globalCompositeOperation = 'source-atop';
      pal.forEach((col, i) => {
        const y = this.cy + (i - 3) * this.cell;
        face.m.fillStyle = col;
        face.m.fillRect(0, y - this.cell / 2 - 0.5, this.W, i === pal.length - 1 ? this.H : this.cell + 1);
      });
      // Silicone sheen on the whole sheet
      const sheen = face.m.createLinearGradient(0, this.cy - this.size / 2, 0, this.cy + this.size / 2);
      sheen.addColorStop(0, 'rgba(255,255,255,.28)');
      sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
      sheen.addColorStop(1, 'rgba(60,20,110,.14)');
      face.m.fillStyle = sheen;
      face.m.fillRect(0, 0, this.W, this.H);
      c.drawImage(face.cv, 0, 0, this.W, this.H);
    }, 2);
  },

  update(dt) {
    this.t += dt;
    this.bx.step(dt);
    for (const q of this.cells) {
      q.sq.step(dt);
      if (q.peek > 0) q.peek -= dt;
    }
    if (app.t - this.lastPop > 1.6) this.combo = 0;
  },

  draw(c) {
    const W = this.W, H = this.H;
    const back = softBack('pop', W, H, '#6E5BE0', '#C78CF2', (x, w, h) => {
      for (let i = 0; i < 18; i++) {
        x.fillStyle = `rgba(255,255,255,${0.04 + (i % 4) * 0.02})`;
        ell(x, ((i * 97) % w), ((i * 61) % h), 20 + (i % 5) * 16);
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);

    // The flip is a fake 3D turn around the vertical axis
    const f = Math.cos(this.flip.a);
    c.save();
    c.translate(this.cx, this.cy);
    c.scale(Math.max(0.02, Math.abs(f)), 1 + (1 - Math.abs(f)) * 0.05);
    c.translate(-this.cx, -this.cy);
    const b = this.boardSprite();
    c.drawImage(b.cv, 0, 0, W, H);

    const s = this.cell / 56 * 1.04;
    for (const q of this.cells) {
      if (q.peek > 0 && q.friend) {
        const k = clamp(Math.min(q.peek, 1.4 - q.peek) * 4);
        c.save();
        c.translate(q.x, q.y - k * this.cell * 0.2);
        c.scale(k, k);
        drawCreature(c, q.friend, { R: this.cell * 0.4, t: this.t, eyes: 'happy', mouthOpen: 0.5 });
        c.restore();
        continue;
      }
      const spr = domeSprite(q.col, q.up);
      const k = q.sq.x;
      const w = 56 * s * k, h = 56 * s * (2 - k);
      c.drawImage(spr.cv, q.x - w / 2, q.y - h / 2, w, h);
    }
    c.restore();
  },

  popAt(x, y, p) {
    for (const q of this.cells) {
      if (!q.up) continue;
      if (dist(x, y, q.x, q.y) < this.cell * 0.56) this.popCell(q, p);
    }
  },

  popCell(q) {
    if (this.flipping) return;
    q.up = false;
    q.sq.x = 1.16;
    q.sq.v = -8;
    this.left--;
    this.lastPop = app.t;
    this.combo++;
    save.data.seen.popit = 1;
    hint.clear();
    // A rising scale rewards long sweeps; each row has its own place in it
    const pitch = penta(((q.ry + this.combo) % 10) - 3, 60);
    audio.sfx('pop', { rate: 0.82 + (6 - q.ry) * 0.055 + rand(-0.02, 0.02), vol: 1, pan: (q.rx - 3) * 0.1, gap: 8, wet: 0.14 });
    audio.note('marimba', pitch + 12, { vol: 0.22, wet: 0.45, pan: (q.rx - 3) * 0.1 });
    haptic();
    if (q.friend) {
      q.peek = 1.4;
      audio.voice('giggle', 1.1, 0.5);
      fx.hearts(q.x, q.y - 10, 5);
      wait(1.4, () => { q.friend = null; });
    } else {
      if (Math.random() < 0.3) fx.sparkle(q.x, q.y, 3);
    }
    if (this.left <= 0) wait(0.35, () => this.flipBoard());
  },

  flipBoard() {
    if (this.flipping) return;
    this.flipping = true;
    audio.success();
    fx.confetti(this.W, this.H, 40);
    save.earnStar();
    audio.sfx('whoosh');
    tween(this.flip, { a: Math.PI / 2 }, 0.34, {
      ease: E.in, done: () => {
        this.shape = (this.shape + 1) % SHAPES.length;
        if (this.shape === 0) this.palette = (this.palette + 1) % PALETTES.length;
        this.makeBoard();
        audio.sfx('thud', { vol: 0.8 });
        tween(this.flip, { a: Math.PI }, 0.42, {
          ease: E.back, done: () => {
            this.flip.a = 0;
            this.flipping = false;
            // Domes come back up in a little wave
            this.cells.forEach((q) => {
              q.sq.x = 0.7;
              wait((q.rx + q.ry) * 0.022, () => { q.sq.v = 8; audio.sfx('popBack', { rate: 1 + q.ry * 0.05, vol: 0.2, gap: 40 }); });
            });
          }
        });
      }
    });
  },

  down(p) { this.popAt(p.x, p.y, p); },
  move(p) {
    // Check along the finger's path, so a fast swipe pops every dome it crosses
    const d = dist(p.x, p.y, p.px, p.py), steps = Math.ceil(d / (this.cell * 0.4));
    for (let i = 1; i <= steps; i++) this.popAt(p.px + ((p.x - p.px) * i) / steps, p.py + ((p.y - p.py) * i) / steps, p);
  }
};
