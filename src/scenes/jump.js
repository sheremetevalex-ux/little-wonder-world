// Sky Jump: a climbing adventure. Pip the sprout jumps from ledge to ledge up
// through six worlds: the meadow, the treetops, the clouds, the candy sky, the
// starry sky and the moon. One finger plays it: touch to jump, hold to jump
// higher, and Pip runs toward the finger. Touch again in the air for a double
// jump. Bump the gift boxes from below for a propeller hat, spring shoes, a
// bubble shield, a berry magnet or the rainbow star. Falling is never the end:
// a bubble floats Pip back up to the last flag.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, TAU, softStar, heart } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lighten, darken, starShape } from '../core/stage.js';
import { Critter, wear } from '../art/critter3d.js';

const WORLDS = [
  { id: 'meadow', sky: [[0, '#7CC8FF'], [1, '#E8F6FF']], top: '#7FD86F', side: '#C98A52', n: 26, types: { static: 1 }, bees: 0, music: 'jump', deco: 'hills', acc: 'party' },
  { id: 'trees', sky: [[0, '#8FE0C8'], [1, '#F0FFF6']], top: '#5FBF72', side: '#9A6A48', n: 32, types: { static: 0.6, move: 0.25, bounce: 0.15 }, bees: 0.15, music: 'jump', deco: 'trees', acc: 'flower' },
  { id: 'clouds', sky: [[0, '#A8C8FF'], [1, '#FFF0F8']], top: '#FFFFFF', side: '#E8F0FF', n: 36, types: { cloud: 0.5, crumble: 0.25, move: 0.25 }, bees: 0.2, music: 'jumpSky', deco: 'clouds', acc: 'bow' },
  { id: 'candy', sky: [[0, '#FFB0D8'], [1, '#FFF6E0']], top: '#FF8FC0', side: '#FFF1F7', n: 40, types: { static: 0.35, move: 0.3, bounce: 0.2, crumble: 0.15 }, bees: 0.25, music: 'jumpSky', deco: 'candy', acc: 'star' },
  { id: 'stars', sky: [[0, '#1B1650'], [1, '#5A3F9E']], top: '#B48BFF', side: '#6E5BD6', n: 42, types: { static: 0.3, move: 0.35, cloud: 0.15, crumble: 0.2 }, bees: 0.25, low: true, music: 'jumpSpace', deco: 'stars', acc: 'halo' },
  { id: 'moon', sky: [[0, '#0E0B30'], [1, '#2D2770']], top: '#E6E0FF', side: '#9A94C8', n: 46, types: { static: 0.25, move: 0.35, bounce: 0.15, crumble: 0.25 }, bees: 0.3, low: true, music: 'jumpSpace', deco: 'moon', acc: 'crown' }
];
const HALF = 4.6;      // play area: x in [-HALF, HALF]
const GRAV = 24, GRAV_HOLD = 14, JUMP = 10.2, RUN = 6, ACC = 34;

function jdata() {
  return save.data.jump || (save.data.jump = { level: 0, stars: {}, berries: 0, done: {} });
}

// a tiny seeded random, so each level keeps its shape
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const jump = {
  tint: '#9FD4FF',

  enter(args) {
    this.t = 0;
    this.d = jdata();
    this.held = new Set();
    this.keys = {};
    this.onKey = (e) => { this.keys[e.key] = e.type === 'keydown'; if (e.type === 'keydown' && (e.key === ' ' || e.key === 'ArrowUp')) this.press(); if (e.type === 'keyup' && (e.key === ' ' || e.key === 'ArrowUp')) this.releaseJump(); };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    this.buttons = [];
    this.startLevel(args && args.level !== undefined ? args.level : Math.min(this.d.level, WORLDS.length - 1), true);
  },

  exit() {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    if (this.hero) this.hero.dispose();
    if (this.stage) this.stage.dispose();
  },

  // ---- building a level --------------------------------------------------------------------
  startLevel(li, showMap = false) {
    if (this.stage) { this.hero.dispose(); this.stage.dispose(); }
    this.li = li;
    const w = this.w = WORLDS[li];
    const night = li >= 4;
    const st = this.stage = new Stage({ bg: w.sky, fov: 40, keyPos: [-5, 9, 10], shadowArea: 9, hemi: night ? 0.45 : 0.7, key: night ? 1.6 : 2.6, keyColor: night ? '#D8DCFF' : '#FFF4E4', env: 0.65, rim: 1.4, rimColor: night ? '#B48BFF' : '#D6E4FF' });
    this.world = group(st.scene);
    this.plats = [];
    this.berries = [];
    this.stars = [];
    this.boxes = [];
    this.bees = [];
    this.items = [];
    this.checkpoints = [];
    this.buildLevel(li);
    this.buildBackdrop(li);
    // Pip
    const h = this.hero = new Critter('hero', { size: 0.55 });
    for (let k = 0; k <= li - 1; k++) if (WORLDS[k] && this.d.done[k]) wear(h, WORLDS[k].acc);
    this.world.add(h.root);
    this.p = { x: 0, y: 0.5, vx: 0, vy: 0, ground: null, coyote: 0, buffer: 0, air: 0, jumps: 0, face: 1, dizzy: 0, holding: false };
    this.spawn = { x: 0, y: 0.5 };
    this.power = { kind: null, t: 0, shoes: 0 };
    this.got = { berries: 0, stars: [false, false, false] };
    this.maxY = 0;
    this.camY = 3;
    this.rescue = null;
    this.done = false;
    this.layoutCam();
    music.play(w.music);
    this.mapOpen = showMap;
    this.buttons = [];
    if (showMap) this.openMap();
    else this.introHint();
  },

  introHint() {
    if (this.li === 0 && !this.d.seenHint) {
      const s = this.stage.toScreen(V(0, 0.5, 0));
      hint.set({ from: [s.x + 90, s.y - 20], delay: 1.2 });
    }
  },

  addPlat(x, y, wdt, type, extra = {}) {
    const w = this.w;
    const g = group(this.world, [x, y, 0]);
    const th = 0.55;
    let top = w.top, side = w.side;
    if (type === 'bounce') {
      // a springy mushroom
      mesh(G.cyl(14), M.toy('#FFF4E8'), { p: [0, -0.35, 0], s: [0.28, 0.7, 0.28], parent: g });
      mesh(G.sphere(28), M.toy('#FF5C8F'), { p: [0, -0.02, 0], s: [wdt * 0.55, 0.4, 0.9], parent: g });
      for (let i = 0; i < 4; i++) mesh(G.sphere(10), M.basic('#FFFFFF'), { p: [(i - 1.5) * wdt * 0.25, 0.22, 0.6], s: 0.1, parent: g, cast: false });
    } else if (type === 'cloud' || type === 'crumble') {
      const col = type === 'crumble' ? '#FFE4F2' : '#FFFFFF';
      const n = Math.max(3, Math.round(wdt / 0.6));
      for (let i = 0; i < n; i++) mesh(G.sphere(16), M.plush(col), { p: [(i / (n - 1) - 0.5) * (wdt - 0.5), -0.15 + Math.sin(i * 2.1) * 0.06, 0], s: [0.45, 0.36, 0.7], parent: g });
      if (type === 'crumble') for (let i = 0; i < 3; i++) mesh(G.sphere(8), M.basic('#FFB0D8'), { p: [(i - 1) * 0.4, 0.05, 0.62], s: 0.07, parent: g, cast: false });
    } else {
      if (w.id === 'candy') { top = pick(['#FF8FC0', '#8FD0FF', '#FFE066', '#B9A4FF']); side = '#FFF4FA'; }
      if (w.id === 'stars' || w.id === 'moon') { top = pick(['#B48BFF', '#8FD0FF', '#FFB0D8', '#E6E0FF']); }
      mesh(G.box(0.2), M.toy(side, { roughness: 0.7 }), { p: [0, -th / 2 - 0.05, 0], s: [wdt, th, 1.3], parent: g });
      mesh(G.box(0.18), M.toy(top, { roughness: 0.55 }), { p: [0, -0.07, 0], s: [wdt + 0.1, 0.22, 1.4], parent: g });
      if (w.id === 'meadow' || w.id === 'trees') for (let i = 0; i < Math.round(wdt * 2); i++) mesh(G.sphere(6), M.toy(pick(['#FF82AF', '#FFD45C', '#FFFFFF'])), { p: [rand(-wdt / 2 + 0.2, wdt / 2 - 0.2), 0.05, rand(-0.4, 0.55)], s: 0.07, parent: g, cast: false });
      if (type === 'move') for (const k of [-1, 1]) mesh(G.sphere(10), M.glossy('#FFC233'), { p: [k * (wdt / 2 - 0.15), -0.3, 0.68], s: 0.1, parent: g, cast: false });
    }
    const pl = { g, x, y, x0: x, y0: y, w: wdt, type, sq: new Spring(0, 300, 10), ...extra };
    if (type === 'move') { pl.amp = extra.amp || 1.6; pl.sp = extra.sp || 0.8; pl.ph = extra.ph || 0; }
    this.plats.push(pl);
    return pl;
  },

  buildLevel(li) {
    const w = this.w, R = rng(li * 7919 + 17);
    const r = (a, b) => a + R() * (b - a);
    const choose = () => {
      let u = R(), acc = 0;
      for (const k in w.types) { acc += w.types[k]; if (u <= acc) return k; }
      return 'static';
    };
    // the ground to start from
    this.addPlat(0, 0, HALF * 2 + 1, 'static');
    let x = 0, y = 0;
    let starAt = [Math.round(w.n * 0.3), Math.round(w.n * 0.6), Math.round(w.n * 0.9)];
    const diff = li / (WORLDS.length - 1);
    for (let i = 1; i <= w.n; i++) {
      const dy = r(1.55, 2.0 + diff * 0.45);
      y += dy;
      const span = r(1.8, 3.4 + diff * 0.8);
      let nx = x + (R() < 0.5 ? -1 : 1) * span;
      if (Math.abs(nx) > HALF - 1.2) nx = x - Math.sign(nx) * span;
      nx = clamp(nx, -HALF + 1.2, HALF - 1.2);
      x = nx;
      const cp = i % 10 === 0;
      let type = cp ? 'static' : choose();
      const wdt = cp ? 3.6 : type === 'bounce' ? 1.6 : r(1.7, 2.8 - diff * 0.7);
      const pl = this.addPlat(x, y, wdt, type, type === 'move' ? { amp: r(1.0, 2.2), sp: r(0.6, 1.0 + diff * 0.4), ph: r(0, TAU) } : {});
      if (type === 'move') {
        // keep moving ledges inside the walls
        pl.amp = Math.min(pl.amp, HALF - wdt / 2 - Math.abs(x) + 0.6);
        if (pl.amp < 0.4) { pl.type = 'static'; }
      }
      if (cp) this.addCheckpoint(pl);
      // berries in a little arc above the ledge
      if (R() < 0.7) {
        const n = 3 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) this.addBerry(x + (k - (n - 1) / 2) * 0.55, y + 1.0 + Math.sin((k / Math.max(1, n - 1)) * Math.PI) * 0.6, pl.type === 'move' ? pl : null, (k - (n - 1) / 2) * 0.55);
      }
      // a gift box to bump from below
      if (i % 7 === 3) this.addBox(x + r(-0.4, 0.4), y + 2.9);
      // a big star off to one side, a little harder to reach
      if (starAt.includes(i)) {
        const k = starAt.indexOf(i);
        const sx = x > 0 ? -HALF + 1.2 : HALF - 1.2;
        const side = this.addPlat(sx, y + 0.6, 1.4, 'static');
        this.addStar(sx, y + 1.7, k);
        side.star = true;
      }
      // buzzing bees between ledges
      if (i > 3 && R() < w.bees) this.addBee(r(-HALF + 1, HALF - 1), y + dy * 0.5 + 0.5, r(1.5, 3.2), r(0.6, 1.2));
    }
    // the goal: a rainbow arch on a big cloud
    y += 2.2;
    const goal = this.addPlat(0, y, 5.2, 'cloud');
    goal.goal = true;
    this.goalY = y;
    const arch = group(this.world, [0, y, -0.6]);
    const cols = ['#FF5C6F', '#FF9F43', '#FFE066', '#7FD86F', '#5FB8FF', '#B48BFF'];
    cols.forEach((c, k) => mesh(G.torus(0.12, Math.PI, 40), M.toy(c, { emissive: c, emissiveIntensity: 0.25 }), { s: 3 - k * 0.24, parent: arch, cast: false }));
    this.arch = arch;
    this.top = y;
  },

  addCheckpoint(pl) {
    const g = group(pl.g, [pl.w / 2 - 0.4, 0, -0.2]);
    mesh(G.cyl(8), M.toy('#FFFFFF'), { p: [0, 0.9, 0], s: [0.05, 1.8, 0.05], parent: g, cast: false });
    const flag = mesh(G.box(0.05), M.toy('#C9C6DA'), { p: [0.35, 1.55, 0], s: [0.6, 0.4, 0.04], parent: g, cast: false });
    this.checkpoints.push({ pl, flag, on: false });
  },
  addBerry(x, y, carrier, off) {
    const m = mesh(G.sphere(16), M.glossy('#FF3E6C', { emissive: '#FF3E6C', emissiveIntensity: 0.15 }), { p: [x, y, 0], s: 0.2, parent: this.world, cast: false });
    mesh(G.sphere(8), M.toy('#5FBF72'), { p: [0, 1.1, 0], s: [0.35, 0.25, 0.35], parent: m, cast: false });
    this.berries.push({ m, x, y, carrier, off, got: false, ph: Math.random() * TAU });
  },
  addStar(x, y, k) {
    const m = mesh(G.puffy('jstar', starShape(5, 1, 0.5), 0.35, 0.18), M.glossy('#FFD23F', { emissive: '#FFB000', emissiveIntensity: 0.45 }), { p: [x, y, 0], s: 0.42, parent: this.world, cast: false });
    const glow = mesh(G.sphere(16), M.glow('#FFF2A0', { opacity: 0.25 }), { s: 2.2, parent: m, cast: false });
    this.stars.push({ m, x, y, k, got: false });
  },
  addBox(x, y) {
    const g = group(this.world, [x, y, 0]);
    mesh(G.box(0.18), M.glossy('#FFC233'), { s: 0.9, parent: g });
    mesh(G.box(0.05), M.toy('#FF5C8F'), { s: [0.94, 0.94, 0.2], parent: g, cast: false });
    mesh(G.box(0.05), M.toy('#FF5C8F'), { s: [0.2, 0.94, 0.94], parent: g, cast: false });
    for (const k of [-1, 1]) mesh(G.sphere(10), M.glossy('#FF5C8F'), { p: [k * 0.16, 0.55, 0], r: [0, 0, k * 0.4], s: [0.18, 0.11, 0.1], parent: g, cast: false });
    this.boxes.push({ g, x, y, used: false, sq: new Spring(0, 300, 10) });
  },
  addBee(x, y, amp, sp) {
    const c = new Critter('bee', { size: 0.42, shadow: false });
    c.root.position.set(x, y, 0.1);
    this.world.add(c.root);
    this.bees.push({ c, x0: x, y0: y, amp: Math.min(amp, HALF - 0.6 - Math.abs(x) + amp * 0.5), sp, ph: Math.random() * TAU, x, y });
  },

  buildBackdrop(li) {
    const W = this.world, w = this.w, top = this.top + 10;
    // side walls: soft pillars so Pip never falls off the edge of the world
    const wc = w.id === 'clouds' ? '#FFFFFF' : w.id === 'candy' ? '#FFD1E6' : w.id === 'stars' || w.id === 'moon' ? '#4A3E9E' : '#B9E6A8';
    for (const k of [-1, 1]) {
      // a climbing vine on each side marks the edge of the world
      mesh(G.cyl(10), M.toy(darken(wc, 0.15), { roughness: 0.8 }), { p: [k * (HALF + 1.0), top / 2 - 2, -0.8], s: [0.22, top + 4, 0.22], parent: W, cast: false });
      for (let y = -2; y < top; y += 1.6) mesh(G.sphere(12), M.toy(wc, { roughness: 0.7 }), { p: [k * (HALF + 1.0) + Math.sin(y) * 0.35, y + (k > 0 ? 0.8 : 0), -0.6], r: [0, 0, Math.sin(y * 3) * 0.8], s: [0.42, 0.22, 0.3], parent: W, cast: false });
    }
    // far decorations
    const deco = w.deco;
    for (let i = 0; i < 40; i++) {
      const y = (i / 40) * top + rand(-2, 2), x = rand(-16, 16), z = rand(-14, -6);
      if (deco === 'hills' && y < 8) mesh(G.sphere(20), M.matte(pick(['#8FDE7E', '#A6E39A'])), { p: [x, -2, z - 6], s: [rand(4, 7), rand(3, 5), 3], parent: W, cast: false });
      else if (deco === 'trees' || deco === 'hills') {
        const g = group(W, [x, y, z]);
        mesh(G.sphere(16), M.toy(pick(['#6CCB76', '#86D96E', '#FF9FC6'])), { s: rand(1, 2), parent: g, cast: false });
      } else if (deco === 'clouds' || (deco === 'hills' && i % 3 === 0)) {
        const g = group(W, [x, y, z]);
        for (let k = 0; k < 4; k++) mesh(G.sphere(12), M.plush('#FFFFFF'), { p: [(k - 1.5) * 0.9, Math.sin(k * 1.4) * 0.3, 0], s: 0.8 + (k % 2) * 0.3, parent: g, cast: false });
      } else if (deco === 'candy') {
        const g = group(W, [x, y, z]);
        mesh(G.sphere(14), M.glossy(pick(['#FF8FC0', '#8FD0FF', '#FFE066', '#B9A4FF'])), { s: rand(0.5, 1.2), parent: g, cast: false });
      } else {
        mesh(G.puffy('bgstar', starShape(5, 1, 0.5), 0.2, 0.1), M.glow(pick(['#FFF2A0', '#BDF0FF', '#FFC4E8']), { opacity: 0.9 }), { p: [x, y, z], s: rand(0.15, 0.4), parent: W, cast: false });
      }
    }
    if (deco === 'moon' || deco === 'stars') {
      const moon = mesh(G.sphere(32), new THREE.MeshBasicMaterial({ color: '#FFF4C8' }), { p: [9, top * 0.6, -20], s: 4, parent: W, cast: false });
      for (let i = 0; i < 5; i++) mesh(G.sphere(12), M.basic('#F2E6B0'), { p: [rand(-2, 2), rand(-2, 2), 3.5], s: rand(0.4, 0.8), parent: moon, cast: false });
    }
  },

  layoutCam() {
    const cam = this.stage.camera;
    const aspect = app.W / app.H;
    const vf = THREE.MathUtils.degToRad(cam.fov);
    const need = (HALF * 2 + 1.8) / (2 * Math.tan(vf / 2) * aspect);
    this.camD = Math.max(13, need);
    this.stage.shadowArea(8, V(0, this.camY, 0));
  },
  resize() { this.layoutCam(); if (this.mapBtns) this.placeMap(); },

  // ---- the map of six worlds -----------------------------------------------------------
  openMap() {
    this.mapOpen = true;
    hint.clear();
    this.mapBtns = WORLDS.map((w, i) => new Btn({
      r: 40, slop: 8, i,
      paint: (c, r) => {
        const open = i <= this.d.level;
        drawWorldIcon(c, w, r, open, i === this.li && open ? this.t : 0);
        const got = this.d.stars[i] || [];
        for (let k = 0; k < 3; k++) {
          softStar(c, (k - 1) * 17, r + 13, got[k] ? 9 : 7, 5, 0.5);
          c.fillStyle = got[k] ? P.sun : 'rgba(255,255,255,.75)';
          c.fill();
        }
      },
      tap: () => {
        if (i > this.d.level) { audio.sfx('tick'); return; }
        audio.sfx('whoosh', { vol: 0.5 });
        if (i === this.li) this.closeMap();
        else this.startLevel(i, false);
      }
    }));
    this.placeMap();
    this.buttons = [...this.mapBtns];
  },
  placeMap() {
    const wide = app.W > app.H;
    this.mapBtns.forEach((b, i) => {
      if (wide) { b.x = app.W / 2 + (i - 2.5) * Math.min(140, (app.W - 120) / 6); b.y = app.H * 0.5 + Math.sin(i * 1.2) * 70; }
      else { b.x = app.W / 2 + (i % 2 ? 70 : -70); b.y = app.H * 0.2 + i * Math.min(110, app.H * 0.12); }
    });
  },
  closeMap() {
    this.mapOpen = false;
    this.mapBtns = null;
    this.buttons = [];
    this.introHint();
  },

  // ---- controls ------------------------------------------------------------------------------
  press() {
    if (this.mapOpen || this.done) return;
    const p = this.p;
    p.holding = true;
    if (p.dizzy > 0 || this.rescue) return;
    if (this.power.kind === 'prop') return;
    if (p.ground || p.coyote > 0) this.doJump(false);
    else if (p.jumps < 2) this.doJump(true);
    else p.buffer = 0.16;
  },
  releaseJump() { this.p.holding = false; },

  doJump(double) {
    const p = this.p, h = this.hero;
    let v = JUMP;
    if (this.power.shoes > 0) { v *= 1.45; this.power.shoes--; }
    if (this.power.kind === 'star') v *= 1.25;
    if (double) v *= 0.88;
    p.vy = v;
    p.ground = null;
    p.coyote = 0;
    p.jumps = double ? 2 : 1;
    h.sq.x = 1.25;
    h.sq.kick(3);
    audio.sfx(double ? 'jump2' : 'jump', { vol: 0.6, rate: double ? 1.1 : rand(0.96, 1.04) });
    if (double) {
      const s = this.stage.toScreen(V(p.x, p.y, 0));
      fx.burst(s.x, s.y, { kind: 'star', n: 8, colors: [P.sun, '#FFFFFF', P.pink], speed: 150, size: 14, g: 200, life: 0.6 });
      h.setMood('happy', 0.6);
      if (Math.random() < 0.4) h.say('wee', 0.4);
    }
    this.d.seenHint = 1;
    hint.clear();
  },

  // ---- frame -----------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    dt = Math.min(dt, 1 / 30);
    const t = this.t, p = this.p, h = this.hero, st = this.stage;
    if (!this.mapOpen && !this.done) this.physics(dt);
    // moving things
    for (const pl of this.plats) {
      if (pl.type === 'move') {
        const nx = pl.x0 + Math.sin(t * pl.sp + pl.ph) * pl.amp;
        pl.dx = nx - pl.x;
        pl.x = nx;
      }
      if (pl.crumbleT !== undefined) {
        pl.crumbleT -= dt;
        if (pl.crumbleT <= 0 && !pl.gone) {
          pl.gone = true;
          pl.goneT = 3.5;
          tween(pl.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.25, { ease: E.in });
          audio.sfx('poof', { vol: 0.5 });
          const s = st.toScreen(V(pl.x, pl.y, 0));
          fx.burst(s.x, s.y, { kind: 'bubble', n: 8, colors: ['#FFFFFF', '#FFE4F2'], speed: 90, size: 18, g: -40, life: 0.8, spin: 0 });
          if (p.ground === pl) p.ground = null;
        }
        if (pl.gone) {
          pl.goneT -= dt;
          if (pl.goneT <= 0) { pl.gone = false; pl.crumbleT = undefined; tween(pl.g.scale, { x: 1, y: 1, z: 1 }, 0.4, { ease: E.back }); }
        }
      }
      const k = pl.sq.step(dt);
      pl.g.position.set(pl.x, pl.y + k * 0.15 + (pl.type === 'cloud' || pl.type === 'crumble' ? Math.sin(t * 1.5 + pl.y0) * 0.04 : 0), 0);
    }
    for (const b of this.bees) {
      b.x = b.x0 + Math.sin(t * b.sp + b.ph) * b.amp;
      b.y = b.y0 + Math.sin(t * 3 + b.ph) * 0.25;
      b.c.root.position.set(b.x, b.y - 0.4, 0.1);
      b.c.root.rotation.y = Math.cos(t * b.sp + b.ph) > 0 ? 0.9 : -0.9;
      if (Math.abs(b.y - p.y) < 12) b.c.update(dt);
    }
    for (const bb of this.boxes) bb.g.position.y = bb.y + bb.sq.step(dt) * 0.3;
    for (const be of this.berries) {
      if (be.got) continue;
      if (be.carrier) be.x = be.carrier.x + be.off;
      if (this.power.kind === 'magnet' && Math.hypot(be.x - p.x, be.y - p.y) < 4.5) { be.x += (p.x - be.x) * dt * 6; be.y += (p.y + 0.4 - be.y) * dt * 6; be.carrier = null; }
      be.m.position.set(be.x, be.y + Math.sin(t * 3 + be.ph) * 0.06, 0);
      be.m.rotation.y = t * 2 + be.ph;
    }
    for (const s of this.stars) if (!s.got) { s.m.rotation.y = t * 1.6; s.m.position.y = s.y + Math.sin(t * 2.2) * 0.1; }
    for (const it of this.items) {
      if (it.got) continue;
      it.age += dt;
      if (it.age < 0.5) it.y += dt * 2.4;
      it.g.position.set(it.x, it.y + Math.sin(t * 3) * 0.08, 0.2);
      it.g.rotation.y = t * 2;
    }
    this.arch.rotation.z = 0;
    for (const c of this.checkpoints) c.flag.rotation.y = Math.sin(t * 3 + c.pl.y) * 0.3;

    // Pip
    h.root.position.set(p.x, p.y, 0);
    const targetYaw = clamp(p.vx / RUN, -1, 1) * 0.7;
    h.root.rotation.y += (targetYaw - h.root.rotation.y) * Math.min(1, dt * 10);
    if (!p.ground) h.sq.to = 1 + clamp(p.vy / 30, -0.12, 0.18);
    h.y = 0; h.vy = 0;
    h.update(dt);
    if (this.power.kind === 'star') {
      h.bodyMat.emissive.setHSL((t * 0.8) % 1, 0.9, 0.5);
      h.bodyMat.emissiveIntensity = 0.55;
      if (Math.random() < dt * 30) { const s = st.toScreen(V(p.x, p.y + 0.4, 0)); fx.sparkle(s.x + rand(-20, 20), s.y + rand(-20, 20), 1); }
    } else if (h.bodyMat.emissiveIntensity) h.bodyMat.emissiveIntensity = 0;
    if (this.propG) { this.propG.children[1].rotation.y = t * 30; }
    if (this.shieldM) { this.shieldM.visible = this.power.kind === 'shield'; this.shieldM.scale.setScalar(1.25 + Math.sin(t * 5) * 0.05); }

    // camera
    let fy = this.rescue ? this.rescue.y : p.y;
    this.camY += ((fy + 1.6) - this.camY) * Math.min(1, dt * 4);
    const cam = st.camera;
    cam.position.set(clamp(p.x * 0.15, -0.8, 0.8), this.camY + 1.2, this.camD);
    cam.lookAt(cam.position.x * 0.6, this.camY, 0);
    st.shadowArea(8, V(0, this.camY, 0));
    if (this.rescue) this.updateRescue(dt);
  },

  physics(dt) {
    const p = this.p, pw = this.power;
    // power timers
    if (pw.kind && pw.kind !== 'shield') { pw.t -= dt; if (pw.t <= 0) this.endPower(); }
    if (pw.kind === 'shield') { pw.t -= dt; if (pw.t <= 0) this.endPower(); }
    p.dizzy = Math.max(0, p.dizzy - dt);
    p.coyote = Math.max(0, p.coyote - dt);
    p.buffer = Math.max(0, p.buffer - dt);
    if (this.rescue) return;
    // where the finger is
    let target = null;
    if (this.finger) {
      const w = this.stage.onFacing(this.finger.x, this.finger.y, V(0, this.camY, 0));
      if (w) target = clamp(w.x, -HALF, HALF);
    }
    if (this.keys.ArrowLeft) target = p.x - 3;
    if (this.keys.ArrowRight) target = p.x + 3;
    const run = pw.kind === 'star' ? RUN * 1.3 : RUN;
    let want = 0;
    if (target !== null && p.dizzy <= 0) {
      const dx = target - p.x;
      want = Math.abs(dx) < 0.15 ? 0 : clamp(dx * 3, -run, run);
    }
    const acc = p.ground ? ACC : ACC * 0.8;
    p.vx += clamp(want - p.vx, -acc * dt, acc * dt);
    if (want === 0 && p.ground) p.vx *= Math.pow(0.0005, dt);
    if (Math.abs(p.vx) > 0.2) p.face = Math.sign(p.vx);
    // gravity, or the propeller
    if (pw.kind === 'prop') {
      p.vy += (7 - p.vy) * Math.min(1, dt * 4);
    } else {
      const low = this.w.low ? 0.8 : 1;
      const g = (p.holding && p.vy > 0 ? GRAV_HOLD : GRAV) * low;
      p.vy -= g * dt;
      p.vy = Math.max(p.vy, -18);
    }
    const ox = p.x, oy = p.y;
    if (p.ground && p.ground.type === 'move') p.x += p.ground.dx || 0;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, -HALF, HALF);
    if (Math.abs(p.x) >= HALF) p.vx = 0;
    // landing on ledges: from above only
    const wasGround = p.ground;
    p.ground = null;
    if (p.vy <= 0) {
      for (const pl of this.plats) {
        if (pl.gone) continue;
        const top = pl.y;
        if (oy >= top - 0.06 && p.y <= top && Math.abs(p.x - pl.x) <= pl.w / 2 + 0.25) {
          p.y = top;
          this.land(pl, wasGround, -p.vy);
          break;
        }
      }
    }
    if (!p.ground && wasGround && p.vy <= 0) p.coyote = 0.12;
    // gift boxes: bump from below, stand on top
    for (const b of this.boxes) {
      if (Math.abs(p.x - b.x) < 0.7) {
        const head = p.y + 0.9;
        if (p.vy > 0 && oy + 0.9 <= b.y - 0.45 + 0.05 && head >= b.y - 0.45) {
          p.y = b.y - 0.45 - 0.9;
          p.vy = -1;
          this.bump(b);
        } else if (p.vy <= 0 && oy >= b.y + 0.45 - 0.06 && p.y <= b.y + 0.45) {
          p.y = b.y + 0.45;
          this.land({ y: b.y + 0.45, x: b.x, w: 0.9, type: 'static', sq: b.sq }, wasGround, -p.vy);
        }
      }
    }
    // collect
    for (const be of this.berries) {
      if (be.got) continue;
      if (Math.hypot(be.x - p.x, be.y - (p.y + 0.45)) < 0.6) this.collectBerry(be);
    }
    for (const s of this.stars) if (!s.got && Math.hypot(s.x - p.x, s.y - (p.y + 0.45)) < 0.8) this.collectStar(s);
    for (const it of this.items) if (!it.got && Math.hypot(it.x - p.x, it.y - (p.y + 0.45)) < 0.8) this.collectItem(it);
    // bees bonk
    for (const b of this.bees) {
      if (Math.hypot(b.x - p.x, b.y - (p.y + 0.45)) < 0.7) this.bonk(b);
    }
    // checkpoints
    for (const c of this.checkpoints) {
      if (!c.on && p.ground === c.pl) {
        c.on = true;
        c.flag.material = M.toy('#FF5C8F');
        this.spawn = { x: c.pl.x, y: c.pl.y + 0.1 };
        audio.success();
        const s = this.stage.toScreen(V(c.pl.x, c.pl.y + 1.5, 0));
        fx.burst(s.x, s.y, { kind: 'confetti', n: 30, speed: 260 });
        this.hero.setMood('happy', 1.2);
        this.hero.say('yay', 0.5);
      }
    }
    this.maxY = Math.max(this.maxY, p.y);
    // falling far below the last flag: a bubble comes to help
    if (p.y < Math.max(this.spawn.y, this.camY - 9) - 6 && !this.rescue) this.startRescue();
    if (p.y < -6 && !this.rescue) this.startRescue();
  },

  land(pl, wasGround, impact) {
    const p = this.p, h = this.hero;
    p.ground = pl;
    p.vy = 0;
    p.jumps = 0;
    if (!wasGround) {
      h.sq.x = clamp(1 - impact * 0.025, 0.7, 1);
      h.sq.kick(-impact * 0.5);
      pl.sq.kick(-impact * 0.35);
      if (impact > 4) audio.sfx('land', { vol: 0.5 });
      if (pl.goal && !this.done) { this.finish(); return; }
    }
    if (pl.type === 'bounce' && !this.done) {
      p.vy = JUMP * 1.55;
      p.ground = null;
      p.jumps = 1;
      pl.sq.kick(-6);
      h.sq.x = 1.3;
      audio.sfx('bounce', { vol: 0.7 });
      h.say('wee', 0.4);
      return;
    }
    if (pl.type === 'cloud' && impact > 3) {
      p.vy = impact * 0.32;
      p.ground = null;
      p.jumps = 1;
      audio.sfx('blup', { vol: 0.4, rate: 1.3 });
      return;
    }
    if (pl.type === 'crumble' && pl.crumbleT === undefined && !pl.gone) { pl.crumbleT = 0.7; audio.sfx('squish2', { vol: 0.4 }); }
    if (p.buffer > 0) { p.buffer = 0; this.doJump(false); }
  },

  collectBerry(be) {
    be.got = true;
    this.got.berries++;
    this.d.berries++;
    this.world.remove(be.m);
    const streak = this.t - (this.lastBerry || 0) < 0.6 ? (this.streak = (this.streak || 0) + 1) : (this.streak = 0);
    this.lastBerry = this.t;
    audio.sfx('coin', { vol: 0.5, rate: Math.pow(2, Math.min(streak, 6) / 12) });
    const s = this.stage.toScreen(V(be.x, be.y, 0));
    fx.sparkle(s.x, s.y, 4);
  },
  collectStar(s) {
    s.got = true;
    this.got.stars[s.k] = true;
    this.world.remove(s.m);
    audio.sfx('found', { vol: 0.8 });
    audio.sparkle(4, 6);
    const sc = this.stage.toScreen(V(s.x, s.y, 0));
    fx.burst(sc.x, sc.y, { kind: 'star', n: 20, colors: [P.sun, P.butter, '#FFFFFF'], speed: 320, size: 22, g: 200, life: 1 });
    this.hero.setMood('wow', 1);
    this.hero.say('ooh', 0.5);
    haptic();
  },

  bump(b) {
    b.sq.kick(6);
    audio.sfx('knock', { vol: 0.8 });
    haptic();
    if (b.used) return;
    b.used = true;
    b.g.children[0].material = M.toy('#D8D2E8');
    const kinds = ['prop', 'shoes', 'shield', 'magnet', 'star'];
    const kind = kinds[(this.boxes.indexOf(b) + this.li) % kinds.length];
    const g = group(this.world, [b.x, b.y + 0.6, 0.2]);
    this.itemMesh(kind, g);
    this.items.push({ g, kind, x: b.x, y: b.y + 0.6, age: 0, got: false });
    audio.sfx('powerup', { vol: 0.5 });
    const s = this.stage.toScreen(V(b.x, b.y + 0.6, 0));
    fx.burst(s.x, s.y, { kind: 'sparkle', n: 14, speed: 200 });
  },
  itemMesh(kind, g) {
    if (kind === 'prop') {
      mesh(G.sphere(16), M.glossy('#6FC4FF'), { s: [0.3, 0.2, 0.3], parent: g, cast: false });
      const bl = group(g, [0, 0.25, 0]);
      for (const k of [0, 1]) mesh(G.box(0.05), M.glossy(k ? '#FF5C8F' : '#FFC233'), { r: [0, k * Math.PI / 2, 0], s: [0.9, 0.05, 0.16], parent: bl, cast: false });
    } else if (kind === 'shoes') {
      for (const k of [-1, 1]) { mesh(G.sphere(14), M.glossy('#FF5C8F'), { p: [k * 0.18, 0, 0], s: [0.16, 0.12, 0.22], parent: g, cast: false }); mesh(G.torus(0.3, TAU, 12), M.metal('#C9C6DA'), { p: [k * 0.18, -0.18, 0], r: [Math.PI / 2, 0, 0], s: 0.1, parent: g, cast: false }); }
    } else if (kind === 'shield') {
      mesh(G.sphere(24), M.bubble({ opacity: 0.45 }), { s: 0.4, parent: g, cast: false });
    } else if (kind === 'magnet') {
      mesh(G.torus(0.3, Math.PI, 16), M.glossy('#FF3E6C'), { r: [0, 0, Math.PI], s: 0.3, parent: g, cast: false });
      for (const k of [-1, 1]) mesh(G.box(0.05), M.metal('#E8E8F0'), { p: [k * 0.3, 0.05, 0], s: [0.18, 0.14, 0.18], parent: g, cast: false });
    } else {
      mesh(G.puffy('jstar2', starShape(5, 1, 0.5), 0.35, 0.18), M.toy('#FFFFFF', { emissive: '#FF8FE0', emissiveIntensity: 0.6 }), { s: 0.32, parent: g, cast: false });
    }
  },
  collectItem(it) {
    it.got = true;
    this.world.remove(it.g);
    this.endPower(true);
    const pw = this.power, h = this.hero;
    audio.sfx('powerup', { vol: 0.8 });
    audio.sfx('magic', { vol: 0.5 });
    h.setMood('wow', 1);
    h.say('yay', 0.6);
    const s = this.stage.toScreen(V(this.p.x, this.p.y + 0.5, 0));
    fx.burst(s.x, s.y, { kind: 'star', n: 16, colors: [P.sun, P.pink, P.sky, '#FFFFFF'], speed: 300, size: 18, g: 100, life: 0.9 });
    haptic();
    if (it.kind === 'shoes') { pw.shoes = 5; this.shoesG = group(h.yaw); for (const k of [-1, 1]) mesh(G.torus(0.3, TAU, 12), M.metal('#C9C6DA'), { p: [k * 0.42, -0.04, 0.3], r: [Math.PI / 2, 0, 0], s: 0.16, parent: this.shoesG, cast: false }); return; }
    pw.kind = it.kind;
    pw.t = it.kind === 'prop' ? 3.2 : it.kind === 'shield' ? 12 : it.kind === 'magnet' ? 9 : 7;
    if (it.kind === 'prop') {
      this.propG = group(h.yaw, [0, h.ry * 2 + 0.05, 0]);
      mesh(G.sphere(16), M.glossy('#6FC4FF'), { s: [0.35, 0.22, 0.35], parent: this.propG, cast: false });
      const bl = group(this.propG, [0, 0.28, 0]);
      for (const k of [0, 1]) mesh(G.box(0.05), M.glossy(k ? '#FF5C8F' : '#FFC233'), { r: [0, k * Math.PI / 2, 0], s: [1.2, 0.05, 0.2], parent: bl, cast: false });
      audio.sfx('zip');
      this.propLoop = audio.loop('hiss', 0.12, 1.6);
    }
    if (it.kind === 'shield') this.shieldM = mesh(G.sphere(28), M.bubble({ opacity: 0.3 }), { p: [0, h.ry, 0], parent: h.yaw, cast: false });
    if (it.kind === 'star') music.play('jumpSky');
  },
  endPower(quiet) {
    const pw = this.power, h = this.hero;
    if (pw.kind === 'prop' && this.propG) { h.yaw.remove(this.propG); this.propG = null; if (this.propLoop) { this.propLoop.stop(); this.propLoop = null; } }
    if (pw.kind === 'shield' && this.shieldM) { h.yaw.remove(this.shieldM); this.shieldM = null; if (!quiet) audio.sfx('bubble'); }
    if (pw.kind === 'star') music.play(this.w.music);
    pw.kind = null;
    pw.t = 0;
    if (pw.shoes <= 0 && this.shoesG) { h.yaw.remove(this.shoesG); this.shoesG = null; }
  },

  bonk(b) {
    const p = this.p, h = this.hero;
    if (p.dizzy > 0 || this.rescue) return;
    if (this.power.kind === 'star') {
      // the rainbow star sends bees off giggling
      audio.sfx('boing'); b.c.say('hehe', 0.5); b.y0 += 3; return;
    }
    if (this.power.kind === 'shield') { this.endPower(); p.vy = 6; audio.sfx('boing'); return; }
    p.dizzy = 0.7;
    p.vx = (p.x < b.x ? -1 : 1) * 6;
    p.vy = 5;
    p.ground = null;
    audio.sfx('boing', { vol: 0.7 });
    h.say('oops', 0.6);
    h.setMood('wow', 0.8);
    h.poke(1.2);
    b.c.setMood('happy', 1);
    b.c.say('giggle', 0.3);
    const s = this.stage.toScreen(V(p.x, p.y + 0.9, 0));
    fx.burst(s.x, s.y, { kind: 'star', n: 6, colors: [P.sun, '#FFFFFF'], speed: 90, size: 12, g: -20, life: 0.8 });
  },

  startRescue() {
    const p = this.p;
    this.endPower(true);
    this.rescue = { from: V(p.x, p.y, 0), to: V(this.spawn.x, this.spawn.y + 0.2, 0), u: 0, y: p.y };
    this.bubbleM = mesh(G.sphere(28), M.bubble({ opacity: 0.35 }), { p: [0, this.hero.ry, 0], s: 1.35, parent: this.hero.yaw, cast: false });
    audio.sfx('bubble', { rate: 0.7 });
    audio.voice('wee', 1.1, 0.5);
    this.hero.setMood('happy', 2);
  },
  updateRescue(dt) {
    const r = this.rescue, p = this.p;
    r.u = Math.min(1, r.u + dt / 1.8);
    const e = E.io(r.u);
    p.x = lerp(r.from.x, r.to.x, e);
    p.y = lerp(r.from.y, r.to.y, e) + Math.sin(e * Math.PI) * 1.5;
    r.y = p.y;
    p.vx = 0; p.vy = 0;
    if (r.u >= 1) {
      this.hero.yaw.remove(this.bubbleM);
      audio.sfx('pop');
      const s = this.stage.toScreen(V(p.x, p.y + 0.5, 0));
      fx.bubbles(s.x, s.y, 10);
      this.rescue = null;
      p.ground = null;
      p.jumps = 0;
    }
  },

  finish() {
    this.done = true;
    const li = this.li;
    this.d.done[li] = 1;
    const prev = this.d.stars[li] || [false, false, false];
    this.d.stars[li] = prev.map((v, k) => v || this.got.stars[k]);
    if (li >= this.d.level) this.d.level = Math.min(WORLDS.length - 1, li + 1);
    save.touch();
    save.earnStar();
    this.endPower(true);
    audio.fanfare();
    fx.confetti(app.W, app.H, 130);
    const h = this.hero;
    h.setMood('happy', 5);
    h.wave();
    // the reward for this world: something new to wear
    wear(h, this.w.acc);
    let n = 0;
    const dance = () => { if (!this.done || n++ > 6) return; h.sq.kick(5); h.root.rotation.y = 0; this.p.vy = 0; h.say(pick(['yay', 'lala', 'hehe']), 0.5); wait(0.55, dance); };
    dance();
    wait(3.2, () => this.openMap());
  },

  // ---- drawing the HUD ------------------------------------------------------------------------
  draw(c) {
    const W = app.W, H = app.H, top = Math.max(app.safeTop, 10) + 34;
    if (!this.mapOpen) {
      // berries
      c.save();
      c.translate(W / 2 - 60, top);
      c.fillStyle = 'rgba(255,255,255,.85)';
      rr(c, -30, -20, 80, 40, 20); c.fill();
      c.fillStyle = '#FF3E6C'; ell(c, -12, 0, 11); c.fill();
      c.fillStyle = '#5FBF72'; ell(c, -12, -11, 5, 3); c.fill();
      c.fillStyle = '#3A2A57';
      c.font = '800 20px -apple-system, system-ui, sans-serif';
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(String(this.got.berries), 4, 1);
      c.restore();
      // big stars
      for (let k = 0; k < 3; k++) {
        softStar(c, W / 2 + 40 + k * 32, top, this.got.stars[k] ? 14 : 11, 5, 0.5);
        c.fillStyle = this.got.stars[k] ? P.sun : 'rgba(255,255,255,.6)';
        c.fill();
        c.strokeStyle = this.got.stars[k] ? '#E89A1A' : 'rgba(150,130,170,.5)';
        c.lineWidth = 2; c.stroke();
      }
      // how high: a vine with Pip climbing it toward the rainbow
      const x = W - 28, y0 = H - Math.max(app.safeBottom, 10) - 40, y1 = top + 50;
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
      const u = clamp(this.p.y / this.top);
      c.strokeStyle = '#7FD86F'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, lerp(y0, y1, u)); c.stroke();
      for (const cp of this.checkpoints) { const yy = lerp(y0, y1, cp.pl.y / this.top); c.fillStyle = cp.on ? P.rose : '#FFFFFF'; ell(c, x, yy, 5); c.fill(); }
      c.save(); c.translate(x, y1 - 8);
      ['#FF5C6F', '#FFE066', '#5FB8FF'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(0, 4, 13 - i * 4, Math.PI, 0); c.stroke(); });
      c.restore();
      c.fillStyle = '#FF8FB8'; ell(c, x, lerp(y0, y1, u), 10); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      // power-up timer ring
      if (this.power.kind && this.power.kind !== 'shield' || this.power.shoes > 0) {
        const s = this.stage.toScreen(V(this.p.x, this.p.y + 1.6, 0));
        if (this.power.shoes > 0 && !this.power.kind) {
          for (let k = 0; k < this.power.shoes; k++) { c.fillStyle = '#FF5C8F'; ell(c, s.x + (k - 2) * 10, s.y, 3.5); c.fill(); }
        }
      }
    } else {
      c.save();
      c.fillStyle = 'rgba(46,30,102,.45)';
      c.fillRect(0, 0, W, H);
      // a vine linking the worlds
      if (this.mapBtns) {
        c.strokeStyle = 'rgba(127,216,111,.9)'; c.lineWidth = 10; c.lineCap = 'round';
        c.beginPath();
        this.mapBtns.forEach((b, i) => (i ? c.lineTo(b.x, b.y) : c.moveTo(b.x, b.y)));
        c.stroke();
      }
      c.restore();
    }
    for (const b of this.buttons) b.draw(c);
    if (this.mapOpen && this.mapBtns) {
      // Pip waits on the next world to play
      const b = this.mapBtns[Math.min(this.d.level, this.mapBtns.length - 1)];
      c.save();
      c.translate(b.x, b.y - 56 + Math.sin(this.t * 4) * 4);
      c.fillStyle = '#FF8FB8'; ell(c, 0, 0, 14, 13); c.fill();
      c.fillStyle = '#2B1D48'; ell(c, -5, -1, 2.2, 2.8); c.fill(); ell(c, 5, -1, 2.2, 2.8); c.fill();
      c.fillStyle = '#7ADB80'; ell(c, -4, -15, 5, 3, -0.6); c.fill(); ell(c, 4, -15, 5, 3, 0.6); c.fill();
      c.restore();
    }
  },

  // ---- input ------------------------------------------------------------------------------
  down(p) {
    if (this.mapOpen) return;
    if (this.done) return;
    this.finger = { x: p.x, y: p.y, id: p.id };
    this.press();
  },
  move(p) {
    if (this.finger && this.finger.id === p.id) { this.finger.x = p.x; this.finger.y = p.y; }
  },
  up(p) {
    if (this.finger && this.finger.id === p.id) { this.finger = null; this.releaseJump(); }
  }
};

function drawWorldIcon(c, w, r, open, pulse) {
  c.save();
  const k = pulse ? 1 + Math.sin(pulse * 5) * 0.05 : 1;
  c.scale(k, k);
  c.shadowColor = 'rgba(40,20,90,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
  c.fillStyle = open ? w.sky[0][1] : '#A9A6C4';
  ell(c, 0, 0, r); c.fill();
  c.shadowColor = 'transparent';
  c.save(); c.beginPath(); c.arc(0, 0, r - 3, 0, TAU); c.clip();
  if (open) {
    c.fillStyle = w.top;
    rr(c, -r * 0.7, r * 0.25, r * 0.7, r * 0.18, 4); c.fill();
    rr(c, r * 0.05, -r * 0.1, r * 0.6, r * 0.18, 4); c.fill();
    rr(c, -r * 0.45, -r * 0.5, r * 0.55, r * 0.18, 4); c.fill();
    c.fillStyle = '#FF8FB8'; ell(c, -r * 0.35, r * 0.1, r * 0.16); c.fill();
    if (w.id === 'stars' || w.id === 'moon') { c.fillStyle = '#FFF4C8'; ell(c, r * 0.45, -r * 0.5, r * 0.2); c.fill(); }
  } else {
    c.fillStyle = '#FFFFFF';
    rr(c, -9, -4, 18, 15, 3); c.fill();
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 3.5;
    c.beginPath(); c.arc(0, -5, 6, Math.PI, 0); c.stroke();
  }
  c.restore();
  c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.9)';
  ell(c, 0, 0, r - 2); c.stroke();
  c.restore();
}
