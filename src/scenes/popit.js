// Pop toy: a real silicone board on the table. Press or sweep and each dome
// snaps inside out with a pock. Pop them all and the board flips over in the air
// and lands as a new shape in new colours. Some domes hide a little friend who
// peeks out when popped.
import { app, hint, wait, tween, Spring, haptic, Btn, candy } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, rand, pick, dist, clamp, TAU } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, canvasTex } from '../core/stage.js';
import { Critter } from '../art/critter3d.js';

const SHAPES = [
  ['0110110', '1111111', '1111111', '1111111', '0111110', '0011100', '0001000'],
  ['0001000', '0011100', '1111111', '0111110', '0111110', '0110110', '1100011'],
  ['0011100', '0111110', '1111111', '1111111', '1111111', '0111110', '0011100'],
  ['1000001', '1100011', '1111111', '1111111', '1111111', '0111110', '0011100'],
  ['1100011', '1110111', '1111111', '0111110', '1111111', '1110111', '0100010'],
  ['0011100', '0111110', '1111111', '1111111', '0111110', '0011101', '0000011'],
  ['1111111', '1111111', '1111111', '1111111', '1111111', '1111111', '1111111']
];
const PALETTES = [
  ['#FF6F91', '#FF9F5C', '#FFD84D', '#6FDB8F', '#55C6F5', '#7F97FF', '#B98AFF'],
  ['#FF8FC4', '#FFB3D9', '#D9A6FF', '#B48BFF', '#8FB5FF', '#7FD6FF', '#7FEBD6'],
  ['#FFD84D', '#FFB84D', '#FF9F5C', '#FF7F7F', '#FF6FA8', '#D96FD9', '#9F7FEB'],
  ['#7FEBC6', '#6FDBB8', '#55C6C6', '#55B0E6', '#6F97F2', '#8F87F2', '#B98AFF']
];
let domeG = null;
const dome = () => domeG || (domeG = new THREE.SphereGeometry(1, 28, 12, 0, TAU, 0, Math.PI / 2));

function silicone(col) {
  return new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.42, sheen: 0.15, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.5, clearcoatRoughness: 0.35, side: THREE.DoubleSide, envMapIntensity: 0.55 });
}

export const popit = {
  tint: '#B9A0FF',

  enter() {
    this.t = 0;
    this.shape = 0;
    this.palette = 0;
    const st = this.stage = new Stage({ bg: [[0, '#9F86F0'], [1, '#FFC2E0']], fov: 32, keyPos: [-5, 9, 6], shadowArea: 6, hemi: 0.5, env: 0.5, key: 3.2 });
    this.world = group(st.scene);
    // a soft table to play on
    mesh(G.puck(0.2), M.toy('#C9B6F2', { roughness: 0.7 }), { p: [0, -0.3, 0], s: [9, 0.6, 7], receive: true, parent: this.world });
    this.boardG = group(this.world);
    this.combo = 0;
    this.lastPop = 0;
    this.flipping = false;
    this.layout();
    this.makeBoard();
    st.snap(this.pose);
    music.play('dream');
    if (!save.data.seen.popit) {
      const a = this.cells[0], b = this.cells[Math.min(this.cells.length - 1, 12)];
      wait(0.6, () => { const sa = st.objScreen(a.d), sb = st.objScreen(b.d); hint.set({ from: [sa.x, sa.y], to: [sb.x, sb.y], delay: 1.2 }); });
    }
  },
  exit() {
    for (const q of this.cells) if (q.friendC) q.friendC.dispose();
    this.stage.dispose();
  },

  layout() {
    const wide = app.W > app.H;
    this.pose = this.stage.pose(V(0, 0, 0.2), wide ? 9.2 : 8, wide ? 8.2 : 8, [0, 1.05, 1]);
  },
  resize() { this.layout(); this.stage.snap(this.pose); },

  makeBoard() {
    const g = this.boardG;
    while (g.children.length) g.remove(g.children[0]);
    for (const q of this.cells || []) if (q.friendC) q.friendC.dispose();
    const rows = SHAPES[this.shape], pal = PALETTES[this.palette];
    this.cells = [];
    const S = 1;
    rows.forEach((row, ry) => {
      const col = pal[ry % pal.length];
      const m = silicone(col);
      for (let rx = 0; rx < 7; rx++) {
        if (row[rx] !== '1') continue;
        const x = (rx - 3) * S, z = (ry - 3) * S;
        // the sheet: rounded tiles that melt together
        const left = rx > 0 && row[rx - 1] === '1', right = rx < 6 && row[rx + 1] === '1';
        const up = ry > 0 && rows[ry - 1][rx] === '1', down = ry < 6 && rows[ry + 1][rx] === '1';
        mesh(G.box(0.1), m, { p: [x, 0.12, z], s: [1.02, 0.24, 1.02], parent: g, receive: true });
        if (left && right) mesh(G.box(0.05), m, { p: [x, 0.12, z], s: [1.06, 0.24, 0.8], parent: g, cast: false });
        if (up && down) mesh(G.box(0.05), m, { p: [x, 0.12, z], s: [0.8, 0.24, 1.06], parent: g, cast: false });
        const d = mesh(dome(), m, { p: [x, 0.24, z], s: [0.4, 0.4, 0.4], parent: g });
        mesh(G.torus(0.12, TAU, 28), m, { p: [x, 0.25, z], r: [Math.PI / 2, 0, 0], s: 0.4, parent: g, cast: false });
        // the hollow of a popped dome
        const hole = mesh(G.circle(24), new THREE.MeshBasicMaterial({ color: '#3A2060', transparent: true, opacity: 0, depthWrite: false }), { p: [x, 0.245, z], r: [-Math.PI / 2, 0, 0], s: 0.36, parent: g, cast: false });
        this.cells.push({ rx, ry, x, z, d, hole, up: true, k: 1, v: 0, target: 1, friend: null });
      }
    });
    const owned = save.data.friends;
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) pick(this.cells).friend = pick(owned);
    this.left = this.cells.length;
  },

  popAt(x, y) {
    if (this.flipping) return;
    const w = this.stage.onPlane(x, y, 0.3);
    if (!w) return;
    for (const q of this.cells) {
      if (!q.up) continue;
      if (Math.abs(w.x - q.x) < 0.46 && Math.abs(w.z - q.z) < 0.46) { this.pop(q); return; }
    }
  },

  pop(q) {
    q.up = false;
    q.target = -0.75;
    q.v = -14;
    this.left--;
    const now = this.t;
    this.combo = now - this.lastPop < 0.25 ? this.combo + 1 : 0;
    this.lastPop = now;
    // rows are notes: a sweep across plays a little melody
    audio.sfx('pop', { rate: 0.9 + (6 - q.ry) * 0.06 + rand(-0.03, 0.03), vol: 0.85, gap: 18 });
    if (this.combo > 2) audio.note('bell', penta(q.rx + 2 + (this.combo % 4)), { vol: 0.18 });
    haptic();
    save.data.seen.popit = 1;
    hint.clear();
    const s = this.stage.objScreen(q.d);
    fx.burst(s.x, s.y, { kind: 'dot', n: 4, colors: ['#' + q.d.material.color.getHexString(), '#FFFFFF'], speed: 80, size: 7, g: 300, life: 0.4 });
    if (q.friend) {
      // a friend was hiding under this dome
      const c = new Critter(q.friend, { size: 0.36, shadow: false });
      c.root.position.set(q.x, -0.2, q.z);
      this.boardG.add(c.root);
      q.friendC = c;
      q.peekT = 0;
      c.setMood('happy', 1.5);
      wait(0.15, () => c.say(pick(['giggle', 'yay', 'hehe']), 0.6));
      fx.hearts(s.x, s.y - 20, 5);
    }
    if (this.left <= 0) this.flipBoard();
  },

  flipBoard() {
    this.flipping = true;
    wait(0.35, () => {
      audio.sfx('whoosh');
      audio.sparkle(2, 5);
      save.earnStar();
      const o = { a: 0, y: 0 };
      tween(o, { y: 2.2 }, 0.35, { ease: E.out });
      tween(o, { y: 0 }, 0.4, { ease: E.in, delay: 0.35 });
      tween(o, { a: Math.PI }, 0.75, {
        ease: E.io, done: () => {
          this.boardG.rotation.x = 0;
          this.boardG.position.y = 0;
          this.shape = (this.shape + 1) % SHAPES.length;
          this.palette = (this.palette + 1) % PALETTES.length;
          this.makeBoard();
          audio.sfx('thud');
          this.cells.forEach((q) => { q.k = 0.2; q.target = 1; wait((q.rx + q.ry) * 0.025, () => { q.v = 9; audio.sfx('popBack', { rate: 1 + q.ry * 0.05, vol: 0.2, gap: 40 }); }); });
          const s = this.stage.toScreen(V(0, 0.3, 0));
          fx.burst(s.x, s.y, { kind: 'star', n: 20, colors: [P.sun, P.butter, '#FFFFFF'], speed: 320, size: 20, g: 200, life: 1 });
          this.flipping = false;
        }
      });
      this.flip = o;
    });
  },

  update(dt) {
    this.t += dt;
    const st = this.stage;
    st.glide(this.pose, dt, 4);
    for (const q of this.cells) {
      // a stiff little spring: snaps through with a tiny overshoot
      q.v += ((q.target - q.k) * 520 - q.v * 18) * dt;
      q.k += q.v * dt;
      q.d.scale.set(0.4, 0.4 * q.k, 0.4);
      q.d.position.y = 0.24 + (q.k < 0 ? 0.005 : 0);
      q.hole.material.opacity = clamp(-q.k) * 0.28;
      if (q.friendC) {
        q.peekT += dt;
        const c = q.friendC;
        const up = q.peekT < 1.6 ? Math.min(1, q.peekT * 4) : Math.max(0, 1 - (q.peekT - 1.6) * 3);
        c.root.position.y = -0.25 + up * 0.45;
        c.look(st.camera.position);
        c.update(dt);
        if (up <= 0 && q.peekT > 1.7) { this.boardG.remove(c.root); c.dispose(); q.friendC = null; }
      }
    }
    if (this.flip && this.flipping) {
      this.boardG.rotation.x = this.flip.a;
      this.boardG.position.y = this.flip.y;
    }
  },

  draw() {},

  down(p) { this.popAt(p.x, p.y); },
  move(p) {
    const d = dist(p.x, p.y, p.px, p.py), steps = Math.max(1, Math.ceil(d / 14));
    for (let i = 1; i <= steps; i++) this.popAt(p.px + ((p.x - p.px) * i) / steps, p.py + ((p.y - p.py) * i) / steps);
  }
};
