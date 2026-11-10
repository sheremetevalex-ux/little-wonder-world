// Singing garden: plant flowers in a 3D flower bed and a little bee flies over
// them, column by column, and they sing as it passes, mouths wide open. It is a
// real step sequencer, but all she sees is a garden. Every note is pentatonic over
// a soft chord, so whatever she grows becomes a nice little song.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rand, pick, dist, clamp, TAU } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, canvasTex } from '../core/stage.js';
import { Critter } from '../art/critter3d.js';

const COLS = 6, ROWS = 5;
const PETALS = ['#FF82AF', '#FFB54D', '#FFE05C', '#6FD8FF', '#B48BFF'];
const NOTES = [7, 5, 4, 2, 0];
const INSTS = ['kalimba', 'bell', 'marimba', 'harp'];
const INST_COL = [P.coral, P.sky, P.mint, P.lilac];
const INST_FRIEND = ['moko', 'unicorn', 'frog', 'bunny'];
const CHORDS = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];
const SEED = [[0, 4], [1, 2], [2, 1], [3, 0], [4, 2], [5, 3]];
const CW = 1.25, RD = 1.05; // cell width and depth in the bed

function makeFlower(row) {
  const g = new THREE.Group();
  const col = PETALS[row];
  mesh(G.cyl(8), M.toy('#5FBF72'), { p: [0, 0.45, 0], s: [0.05, 0.9, 0.05], parent: g, cast: false });
  for (const k of [-1, 1]) mesh(G.sphere(12), M.toy('#7FD86F'), { p: [k * 0.16, 0.35, 0], r: [0, 0, k * -0.8], s: [0.2, 0.07, 0.11], parent: g, cast: false });
  const head = group(g, [0, 1.0, 0]);
  const petals = group(head);
  const n = row % 2 ? 6 : 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    mesh(G.sphere(14), M.toy(col), { p: [Math.cos(a) * 0.26, Math.sin(a) * 0.26, -0.02], s: [0.17, 0.17, 0.07], parent: petals });
  }
  mesh(G.sphere(20), M.toy('#FFF2A8'), { s: [0.21, 0.21, 0.12], parent: head });
  const ink = M.glossy('#2B1D48');
  const eyes = group(head, [0, 0.04, 0.11]);
  for (const k of [-1, 1]) {
    mesh(G.sphere(10), ink, { p: [k * 0.075, 0, 0], s: [0.035, 0.045, 0.02], parent: eyes, cast: false });
    mesh(G.sphere(6), M.basic('#FFFFFF'), { p: [k * 0.075 - 0.01, 0.015, 0.02], s: 0.012, parent: eyes, cast: false });
  }
  const mouth = mesh(G.sphere(12), M.glossy('#7A2C50'), { p: [0, -0.06, 0.11], s: [0.04, 0.01, 0.02], parent: head, cast: false });
  return { g, head, petals, mouth };
}

export const garden = {
  tint: '#A8E6A1',

  enter() {
    this.t = 0;
    const saved = save.data.garden;
    this.grid = saved && saved.length === COLS * ROWS ? [...saved] : new Array(COLS * ROWS).fill(0);
    if (!saved) for (const [c, r] of SEED) this.grid[c + r * COLS] = 1;
    this.step = 0;
    this.inst = save.data.gardenInst || 0;
    this.bpm = 96;
    this.next = 0;
    this.bar = 0;
    this.queue = [];
    this.touched = 0;
    const st = this.stage = new Stage({ bg: [[0, '#7CC8FF'], [1, '#E6F6FF']], fov: 32, keyPos: [-5, 11, 7], shadowArea: 7, hemi: 0.7 });
    this.world = group(st.scene);
    this.buildGarden();
    this.cells = this.grid.map((v, i) => ({ v, f: null, s: 0, sq: new Spring(1, 300, 9), sing: 0 }));
    this.grid.forEach((v, i) => { if (v) this.plant(i, true); });
    this.bee = new Critter('bee', { size: 0.42, shadow: false });
    this.world.add(this.bee.root);
    this.beeX = this.colX(0);
    this.layout();
    st.snap(this.pose);
    music.play(null);
    this.buttons = this.makeButtons();
    if (!save.data.seen.garden) wait(1, () => { const s = st.toScreen(this.cellPos(3, 3)); hint.set({ from: [s.x, s.y], delay: 2 }); });
  },
  exit() {
    save.data.garden = this.grid;
    save.data.gardenInst = this.inst;
    save.touch();
    this.bee.dispose();
    for (const s of this.singers || []) s.c.dispose();
    this.stage.dispose();
  },

  colX(c) { return (c - (COLS - 1) / 2) * CW; },
  rowZ(r) { return (r - (ROWS - 1) / 2) * RD; },
  cellPos(c, r) { return V(this.colX(c), 0.55, this.rowZ(r)); },

  buildGarden() {
    const W = this.world;
    mesh(G.plane(), M.matte('#8FDE7E'), { r: [-Math.PI / 2, 0, 0], s: [80, 80, 1], receive: true, cast: false, parent: W });
    // the raised bed
    const bw = COLS * CW + 0.8, bd = ROWS * RD + 0.6;
    mesh(G.box(0.15), M.toy('#C98A52', { roughness: 0.7 }), { p: [0, 0.25, 0], s: [bw + 0.3, 0.5, bd + 0.3], parent: W, receive: true });
    mesh(G.box(0.2), new THREE.MeshStandardMaterial({ map: soilTex(), roughness: 1 }), { p: [0, 0.3, 0], s: [bw - 0.1, 0.52, bd - 0.1], parent: W, receive: true });
    // little planting holes
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) mesh(G.circle(16), M.basic('#5A3A28', { transparent: true, opacity: 0.35 }), { p: [this.colX(c), 0.565, this.rowZ(r)], r: [-Math.PI / 2, 0, 0], s: 0.18, parent: W, cast: false });
    // a fence, trees and a tiny shed for cosiness
    for (let i = 0; i < 22; i++) mesh(G.box(0.05), M.toy('#FFFFFF'), { p: [(i - 10.5) * 0.9, 0.5, -5], s: [0.18, 1, 0.1], parent: W });
    mesh(G.box(0.03), M.toy('#FFFFFF'), { p: [0, 0.7, -4.95], s: [20, 0.12, 0.08], parent: W, cast: false });
    for (const [x, z, col] of [[-8, -7, '#6CCB76'], [7.5, -7.5, '#FF9FC6'], [-11, -4, '#86D96E'], [11, -3.5, '#6CCB76']]) {
      const t = group(W, [x, 0, z]);
      mesh(G.cyl(10), M.toy('#B9825A'), { p: [0, 1.2, 0], s: [0.3, 2.4, 0.3], parent: t });
      mesh(G.sphere(24), M.toy(col), { p: [0, 3.1, 0], s: 1.7, parent: t });
    }
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const cl = group(W, [rand(-14, 14), rand(7, 10), -18]);
      for (let k = 0; k < 4; k++) mesh(G.sphere(14), M.plush('#FFFFFF'), { p: [(k - 1.5) * 1.3, Math.sin(k) * 0.4, 0], s: 1 + (k % 2) * 0.4, parent: cl, cast: false });
      this.clouds.push(cl);
    }
    // butterflies
    this.flies = [];
    for (let i = 0; i < 3; i++) {
      const b = group(W);
      for (const k of [-1, 1]) mesh(G.sphere(10), M.toy(pick(PETALS)), { p: [k * 0.12, 0, 0], s: [0.12, 0.09, 0.02], parent: b, cast: false });
      b.userData = { ph: rand(TAU), base: V(rand(-6, 6), rand(1.5, 3), rand(-4, 2)) };
      this.flies.push(b);
    }
  },

  layout() {
    const wide = app.W > app.H;
    this.pose = this.stage.pose(V(0, 0.9, 0.3), wide ? 9.4 : 8.2, wide ? 7.2 : 9.5, [0, 0.95, 1]);
    this.stage.shadowArea(7, V(0, 0, 0));
  },
  resize() { this.layout(); this.stage.snap(this.pose); this.placeButtons(); },

  makeButtons() {
    const b = [
      new Btn({
        r: 30, slop: 8,
        paint: (c, r) => {
          candy(c, r, INST_COL[this.inst]);
          c.fillStyle = '#fff';
          ell(c, 0, 2, 12, 11); c.fill();
          c.fillStyle = '#2B1D48'; ell(c, -4, 0, 2, 2.6); c.fill(); ell(c, 4, 0, 2, 2.6); c.fill();
          c.fillStyle = '#7A2C50'; ell(c, 0, 6, 3, 3); c.fill();
        },
        tap: () => {
          this.inst = (this.inst + 1) % INSTS.length;
          audio.note(INSTS[this.inst], 79, { vol: 0.7 });
          audio.sparkle(this.inst, 2, 0.3);
        }
      }),
      new Btn({
        r: 30, slop: 8,
        paint: (c, r) => {
          candy(c, r, P.sun);
          for (const [x, y2, k] of [[-8, -3, PETALS[0]], [8, -5, PETALS[3]], [0, 8, PETALS[4]]]) { c.fillStyle = k; ell(c, x, y2, 7); c.fill(); c.fillStyle = '#fff'; ell(c, x - 2, y2 - 2.4, 2); c.fill(); }
        },
        tap: () => this.surprise()
      }),
      new Btn({
        r: 30, slop: 8,
        paint: (c, r) => {
          candy(c, r, '#9EC7FF');
          c.strokeStyle = '#fff'; c.lineWidth = 4.5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-14, -6); c.lineTo(6, -6); c.arc(6, -11, 5, 1.57, -1.2, true); c.stroke();
          c.beginPath(); c.moveTo(-14, 2); c.lineTo(11, 2); c.stroke();
          c.beginPath(); c.moveTo(-9, 10); c.lineTo(5, 10); c.arc(5, 15, 5, -1.57, 1.2); c.stroke();
        },
        tap: () => this.clearAll()
      })
    ];
    this.btns = b;
    this.placeButtons(b);
    return b;
  },
  placeButtons(b = this.btns) {
    if (!b) return;
    const y = app.H - 50 - app.safeBottom * 0.6;
    b.forEach((x, i) => { x.x = app.W / 2 + (i - 1) * 92; x.y = y; });
  },

  plant(i, quiet) {
    const c = this.cells[i];
    if (c.f) return;
    const col = i % COLS, r = Math.floor(i / COLS);
    const f = makeFlower(r);
    f.g.position.copy(this.cellPos(col, r));
    f.g.scale.setScalar(0.01);
    this.world.add(f.g);
    c.f = f;
    tween(f.g.scale, { x: 1.35, y: 1.35, z: 1.35 }, 0.45, { ease: E.back, delay: quiet ? ((col + r) * 0.03) : 0 });
  },
  unplant(i) {
    const c = this.cells[i];
    if (!c.f) return;
    const f = c.f;
    c.f = null;
    tween(f.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.25, { ease: E.in, done: () => this.world.remove(f.g) });
  },

  surprise() {
    audio.sfx('whoosh');
    for (let i = 0; i < this.grid.length; i++) if (this.grid[i]) this.unplant(i);
    this.grid.fill(0);
    let r = Math.floor(rand(0, ROWS));
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.85) {
        this.grid[c + r * COLS] = 1;
        if (Math.random() < 0.25) this.grid[c + ((r + 2) % ROWS) * COLS] = 1;
      }
      r = clamp(r + pick([-1, -1, 1, 1, 0]), 0, ROWS - 1);
    }
    wait(0.28, () => this.grid.forEach((v, i) => v && this.plant(i, true)));
    audio.sparkle(0, 6, 0.35);
  },

  clearAll() {
    audio.sfx('whoosh', { vol: 1 });
    this.grid.forEach((v, i) => {
      if (!v) return;
      const s = this.stage.toScreen(this.cellPos(i % COLS, Math.floor(i / COLS)).add(V(0, 1, 0)));
      fx.add({ kind: 'dot', x: s.x, y: s.y, vx: rand(150, 300), vy: rand(-60, 30), g: 40, size: rand(8, 13), life: 1, color: PETALS[Math.floor(i / COLS)] });
      this.unplant(i);
    });
    this.grid.fill(0);
  },

  scheduleStep(when) {
    const st = this.step, stepDur = 60 / this.bpm / 2;
    if (st % COLS === 0) {
      const ch = CHORDS[this.bar % 4];
      this.bar++;
      for (let i = 1; i < 4; i++) audio.note('pad', ch[i], { vol: 0.09, when, wet: 0.5, dur: stepDur * COLS + 0.4 });
      audio.note('bass', ch[0], { vol: 0.26, when, wet: 0.2 });
    }
    if (st % 4 === 2) audio.hit('shaker', { vol: 0.06, when });
    const col = st % COLS;
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[col + r * COLS]) audio.note(INSTS[this.inst], penta(NOTES[r] - 2), { vol: 0.56, when, wet: 0.65, pan: (col / (COLS - 1) - 0.5) * 0.6 });
    }
    this.queue.push({ when, col });
    this.step++;
  },

  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    st.glide(this.pose, dt, 4);
    if (audio.running) {
      const stepDur = 60 / this.bpm / 2;
      if (this.next < audio.now) this.next = audio.now + 0.05;
      while (this.next < audio.now + 0.14) { this.scheduleStep(this.next); this.next += stepDur; }
      while (this.queue.length && this.queue[0].when <= audio.now) {
        const q = this.queue.shift();
        this.curCol = q.col;
        for (let r = 0; r < ROWS; r++) {
          const i = q.col + r * COLS;
          if (this.grid[i] && this.cells[i].f) {
            const c = this.cells[i];
            c.sq.kick(5);
            c.sing = 1;
            if (Math.random() < 0.5) { const s = st.toScreen(c.f.head.getWorldPosition(V())); fx.add({ kind: 'note', x: s.x, y: s.y - 20, vx: rand(-20, 20), vy: rand(-70, -30), size: 16, life: 0.8, color: PETALS[r], g: -20 }); }
          }
        }
      }
    } else {
      this.fakeT = (this.fakeT || 0) + dt;
      this.curCol = Math.floor(this.fakeT / (60 / this.bpm / 2)) % COLS;
    }
    for (const c of this.cells) {
      const k = c.sq.step(dt);
      c.sing = Math.max(0, c.sing - dt * 2.6);
      if (!c.f) continue;
      c.f.head.scale.set(1 / Math.sqrt(k), k, 1);
      c.f.mouth.scale.y = 0.01 + c.sing * 0.06;
      c.f.head.rotation.z = Math.sin(t * 2 + c.f.g.position.x) * 0.08;
      c.f.petals.rotation.z = t * 0.2 + c.sing * 0.4;
      c.f.g.rotation.x = -0.25;
    }
    // the bee flies over the beat
    const tx = this.colX(this.curCol ?? 0);
    const wrap = tx < this.beeX - CW * 3;
    this.beeX += (tx - this.beeX) * (wrap ? 1 : Math.min(1, dt * 14));
    this.bee.root.position.set(this.beeX, 2.3 + Math.sin(t * 6) * 0.12, this.rowZ(0) - 0.4);
    this.bee.look(st.camera.position);
    this.bee.update(dt);
    for (const cl of this.clouds) { cl.position.x += dt * 0.5; if (cl.position.x > 18) cl.position.x = -18; }
    for (const f of this.flies) {
      const u = f.userData;
      u.ph += dt;
      f.position.set(u.base.x + Math.sin(u.ph * 0.6) * 2, u.base.y + Math.sin(u.ph * 1.7) * 0.4, u.base.z + Math.cos(u.ph * 0.5) * 1.5);
      f.children[0].rotation.y = Math.sin(u.ph * 18) * 0.9;
      f.children[1].rotation.y = -Math.sin(u.ph * 18) * 0.9;
    }
  },

  draw(c) {
    for (const b of this.buttons) b.draw(c);
  },

  cellAt(p) {
    const w = this.stage.onPlane(p.x, p.y, 0.56);
    if (!w) return null;
    const col = Math.round(w.x / CW + (COLS - 1) / 2), r = Math.round(w.z / RD + (ROWS - 1) / 2);
    if (col < 0 || col >= COLS || r < 0 || r >= ROWS) {
      // tapping a flower's head counts too
      for (let i = 0; i < this.cells.length; i++) {
        const f = this.cells[i].f;
        if (!f) continue;
        const s = this.stage.toScreen(f.head.getWorldPosition(V()));
        if (dist(p.x, p.y, s.x, s.y) < 34) return { col: i % COLS, r: Math.floor(i / COLS) };
      }
      return null;
    }
    return { col, r };
  },

  down(p) {
    const bs = this.stage.objScreen(this.bee.body);
    if (dist(p.x, p.y, bs.x, bs.y) < 40) { this.bee.poke(); this.bee.say('giggle', 0.5); fx.hearts(p.x, p.y, 4); return; }
    const cell = this.cellAt(p);
    if (!cell) return;
    p.paint = true;
    p.setTo = this.grid[cell.col + cell.r * COLS] ? 0 : 1;
    this.setCell(cell.col, cell.r, p.setTo);
    p.lastCell = cell.col + cell.r * COLS;
    save.data.seen.garden = 1;
    hint.clear();
  },
  move(p) {
    if (!p.paint) return;
    const cell = this.cellAt(p);
    if (!cell) return;
    const i = cell.col + cell.r * COLS;
    if (i !== p.lastCell) {
      p.lastCell = i;
      if (this.grid[i] !== p.setTo) this.setCell(cell.col, cell.r, p.setTo);
    }
  },

  setCell(col, r, v) {
    if (++this.touched === 12) { save.earnStar(); audio.sparkle(3, 4, 0.3); fx.stars(app.W / 2, app.H * 0.3, 12); }
    const i = col + r * COLS;
    this.grid[i] = v;
    const s = this.stage.toScreen(this.cellPos(col, r));
    if (v) {
      this.plant(i);
      this.cells[i].sing = 1;
      audio.note(INSTS[this.inst], penta(NOTES[r] - 2), { vol: 0.62, wet: 0.7, pan: (col / (COLS - 1) - 0.5) * 0.6 });
      fx.burst(s.x, s.y, { kind: 'dot', n: 5, colors: ['#9A6B47', '#7E5235'], speed: 110, size: 6, g: 500, life: 0.5, spin: 0 });
      haptic();
    } else {
      this.unplant(i);
      audio.sfx('popBack', { vol: 0.6 });
      fx.burst(s.x, s.y - 30, { kind: 'dot', n: 6, colors: [PETALS[r]], speed: 90, size: 7, g: 200, life: 0.6, spin: 0 });
    }
  }
};

let soilT = null;
function soilTex() {
  return soilT || (soilT = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#8A5A3C'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { x.fillStyle = pick(['#7A4E33', '#9A6B47', '#6E452D']); x.beginPath(); x.arc(rand(w), rand(h), rand(1, 4), 0, TAU); x.fill(); }
  }));
}
