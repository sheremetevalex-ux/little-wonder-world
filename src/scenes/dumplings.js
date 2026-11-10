// Dumplings: a cosy tea-house table with four treats, each hiding a collectible
// toy. Every treat opens its own way: stretch the bao, tickle the dumpling along
// its pleats, crack the fortune cookie, squish the mochi. Inside, a little
// character wakes up, dances on the plate and joins her collection shelf.
// Every opening brings a toy she does not have yet, so nothing is ever scarce.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, TAU, softStar, heart } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lathe, lighten, darken, starShape, PM, bake } from '../core/stage.js';
import { Critter, SPECIES, wear } from '../art/critter3d.js';
import { dumplingShape } from '../art/worldtoys.js';

// ---- the collection: four series of eight ------------------------------------------
const KINDS = [
  {
    id: 'bao', name: 'bao', tint: '#FFE9CF', act: 'stretch', goal: 3,
    toys: [
      ['bunny', 'bow', '#FF5C8F'], ['kitty', 'chef'], ['bear', 'scarf', '#6FC4FF'], ['piggy', 'flower', '#FFD45C'],
      ['puppy', 'party', '#B48BFF'], ['panda', 'headphones', '#FF8FC0'], ['fox', 'beret', '#5698FF'], ['mouse', 'cherry']
    ]
  },
  {
    id: 'jiaozi', act: 'rub', goal: 7, tint: '#DDF3FF',
    toys: [
      ['penguin', 'scarf', '#FF6F8F'], ['jelly', 'star', '#FFE066'], ['mermaid', 'crown'], ['axolotl', 'flower', '#FFFFFF'],
      ['turtle', 'glasses', '#FF8A4C'], ['frog', 'leaf'], ['chick', 'sailor'], ['slimey', 'bow', '#6FC4FF']
    ]
  },
  {
    id: 'cookie', act: 'crack', goal: 3, tint: '#FFF0C2',
    toys: [
      ['unicorn', 'halo'], ['starlet', 'crown'], ['rainbow', 'star', '#FF8FC0'], ['phoenix', 'halo'],
      ['foal', 'flower', '#C7ABFF'], ['starBunny', 'star', '#FFE066'], ['babyDragon', 'crown'], ['cloud', 'halo']
    ]
  },
  {
    id: 'mochi', act: 'squish', goal: 4, tint: '#FFDCEB',
    toys: [
      ['bunny', 'strawberry', null, '#FFC2D6'], ['kitty', 'leaf', null, '#B8E6A0'], ['chick', 'flower', '#FF8FC0', '#FFCBA4'], ['bear', 'cherry', null, '#B07A55'],
      ['pug', 'donut'], ['owl', 'beret', '#8C68F2', '#9FC4FF'], ['bee', 'bow', '#FF8FC0'], ['sheep', 'party', '#FF8FC0']
    ]
  }
];
const TOYS = {};
KINDS.forEach((k) => k.toys.forEach((t, i) => {
  const id = k.id + i;
  TOYS[id] = { id, kind: k.id, sp: t[0], acc: t[1], col: t[2], body: t[3] };
}));

function toySpec(def) {
  const base = SPECIES[def.sp] || SPECIES.moko;
  if (!def.body) return base;
  return { ...base, body: def.body, belly: lighten(def.body, 0.55), foot: darken(def.body, 0.1) };
}
function makeToy(id, size = 1, shiny = false) {
  const def = TOYS[id];
  const c = new Critter(toySpec(def), { key: 'dump:' + id, size, voice: (SPECIES[def.sp] || {}).voice });
  if (def.acc) wear(c, def.acc, def.col || undefined);
  c.toyId = id;
  if (shiny) {
    // glittering twin: a ring of tiny stars that circles forever
    const ring = group(c.yaw, [0, c.ry, 0]);
    for (let i = 0; i < 5; i++) mesh(G.puffy('star4d', starShape(4, 1, 0.38), 0.2, 0.1), M.glow(['#FFF2A0', '#FFC4E8', '#BDF0FF'][i % 3], { opacity: 0.95 }), { p: [Math.cos(i * 1.26) * 1.25, Math.sin(i * 2.1) * 0.3, Math.sin(i * 1.26) * 1.25], s: 0.12, parent: ring, cast: false });
    c.ring = ring;
  }
  return c;
}

function dumpData() {
  const d = save.data.dump || (save.data.dump = { found: [], shiny: [], recent: [], opened: 0 });
  return d;
}

// ---- treats ------------------------------------------------------------------------
const DOUGH = '#FFF5EA';
function sleepyFace(parent, y, z, s = 1, open = false) {
  const f = group(parent, [0, y, z]);
  const ink = M.glossy('#3A2450');
  const closed = group(f), awake = group(f);
  for (const k of [-1, 1]) {
    mesh(G.torus(0.3, Math.PI, 12), ink, { p: [k * 0.17 * s, 0.03 * s, 0], r: [0, 0, Math.PI], s: [0.06 * s, 0.045 * s, 0.05 * s], parent: closed, cast: false });
    const e = mesh(G.sphere(14), ink, { p: [k * 0.17 * s, 0.03 * s, 0], s: [0.06 * s, 0.075 * s, 0.04 * s], parent: awake, cast: false });
    mesh(G.sphere(8), M.basic('#FFFFFF'), { p: [-0.3, 0.35, 0.8], s: 0.35, parent: e, cast: false });
    mesh(G.sphere(10), M.basic('#FF8FB4', { transparent: true, opacity: 0.6, depthWrite: false }), { p: [k * 0.29 * s, -0.05 * s, -0.01], s: [0.07 * s, 0.04 * s, 0.01], parent: f, cast: false });
  }
  const smile = mesh(G.torus(0.35, Math.PI, 12), M.glossy('#7A2C50'), { p: [0, -0.07 * s, 0], r: [0, 0, Math.PI], s: [0.05 * s, 0.04 * s, 0.04 * s], parent: f, cast: false });
  const o = mesh(G.sphere(12), M.glossy('#7A2C50'), { p: [0, -0.09 * s, 0], s: [0.05 * s, 0.06 * s, 0.03 * s], parent: f, cast: false });
  o.visible = false;
  awake.visible = open;
  closed.visible = !open;
  return { f, closed, awake, smile, o, set(mode) { closed.visible = mode === 'sleep'; awake.visible = mode !== 'sleep'; o.visible = mode === 'wow'; smile.visible = mode !== 'wow'; } };
}

let jiaoziTop = null, jiaoziBot = null;
function bentHalf(top) {
  // half of a plump crescent: flat underneath, round on top, ends curling back
  const g = new THREE.SphereGeometry(1, 44, 16, 0, Math.PI * 2, top ? 0 : Math.PI / 2, Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * 1.25, y = p.getY(i) * (top ? 0.7 : 0.18), z = p.getZ(i) * 0.62;
    p.setXYZ(i, x, y, z - 0.42 * x * x + 0.3);
  }
  g.computeVertexNormals();
  return g;
}

function buildTreat(kind) {
  const g = new THREE.Group();
  const t = { kind, g, parts: {} };
  if (kind === 'bao') {
    const body = mesh(dumplingShape(), M.plush(DOUGH), { s: [0.95, 0.95, 0.95], p: [0, 0.48, 0], parent: g });
    const top = group(g, [0, 1.12, 0]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const pl = mesh(G.sphere(10), M.plush('#FFF0DE'), { p: [Math.sin(a) * 0.22, -0.08, Math.cos(a) * 0.22], s: [0.07, 0.22, 0.06], parent: top, cast: false });
      pl.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6);
    }
    mesh(G.sphere(12), M.toy('#FF8FB4'), { p: [0, 0.06, 0], s: 0.07, parent: top, cast: false });
    t.parts = { body, top };
    t.face = sleepyFace(g, 0.62, 1.02, 1.5);
  } else if (kind === 'jiaozi') {
    if (!jiaoziTop) { jiaoziTop = bentHalf(true); jiaoziBot = bentHalf(false); }
    const hinge = group(g, [0, 0.2, -0.3]);
    const topM = mesh(jiaoziTop, M.plush(DOUGH), { p: [0, 0, 0.3], parent: hinge });
    const botM = mesh(jiaoziBot, M.plush('#FFEEDC'), { p: [0, 0.2, 0], parent: g });
    const pleats = [];
    for (let i = 0; i < 7; i++) {
      const x = (i / 6 - 0.5) * 1.9;
      const pl = mesh(G.sphere(12), M.plush('#FFF2E2'), { p: [x, 0.68 - x * x * 0.12, 0.3 - 0.42 * x * x + 0.3 - 0.3], s: [0.12, 0.1, 0.16], parent: hinge, cast: false });
      pl.rotation.y = x * 0.6;
      pleats.push(pl);
    }
    t.parts = { hinge, topM, botM, pleats };
    t.face = sleepyFace(g, 0.45, 0.88, 1.3);
  } else if (kind === 'cookie') {
    const gold = M.toy('#F2B45C', { roughness: 0.5, clearcoat: 0.6 });
    const halves = [];
    for (const k of [-1, 1]) {
      const h = group(g, [0, 0.5, 0]);
      mesh(G.torus(0.62, Math.PI / 2, 24), gold, { r: [0, k > 0 ? 0 : Math.PI, Math.PI / 2], s: [0.62, 0.62, 0.7], parent: h });
      halves.push(h);
    }
    // the baked edge and the crease
    mesh(G.capsule(1, 8), M.toy('#E09A45'), { p: [0, 0.5, 0.42], r: [0, 0, Math.PI / 2], s: [0.08, 0.38, 0.08], parent: g, cast: false });
    const cracks = [];
    for (let i = 0; i < 6; i++) {
      const c = mesh(G.capsule(1, 4), M.basic('#8A4B1E'), { p: [rand(-0.45, 0.45), 0.5 + rand(-0.25, 0.3), 0.6], r: [0, 0, rand(-1.2, 1.2)], s: [0.015, rand(0.08, 0.14), 0.015], parent: g, cast: false });
      c.visible = false;
      cracks.push(c);
    }
    t.parts = { halves, cracks };
    t.face = sleepyFace(g, 0.62, 0.66, 1.2);
  } else {
    // mochi on a fluted paper cup
    const cup = group(g);
    const cupMat = M.toy('#FFFFFF', { roughness: 0.7 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      mesh(G.box(0.05), cupMat, { p: [Math.sin(a) * 0.72, 0.16, Math.cos(a) * 0.72], r: [0, a, 0], s: [0.3, 0.34, 0.06], parent: cup, cast: false });
    }
    const body = mesh(G.sphere(36), M.plush('#FFC2DA', { sheenColor: new THREE.Color('#FFFFFF') }), { p: [0, 0.62, 0], s: [0.9, 0.66, 0.9], parent: g });
    for (let i = 0; i < 10; i++) mesh(G.sphere(6), M.basic('#FFFFFF'), { p: [rand(-0.5, 0.5), 1.15 + rand(-0.1, 0.05), rand(-0.3, 0.4)], s: 0.025, parent: g, cast: false });
    t.parts = { body, cup };
    t.face = sleepyFace(g, 0.6, 0.86, 1.4);
  }
  return t;
}

// ---- containers on the back of the table --------------------------------------------
function buildContainer(kind) {
  const g = new THREE.Group();
  const c = { kind, g, lid: null, sq: new Spring(1, 300, 10), peek: [] };
  if (kind === 'bao') {
    const bam = PM({ map: slatTex(), roughness: 0.7, clearcoat: 0.2 });
    mesh(G.cyl(40), bam, { p: [0, 0.45, 0], s: [1.05, 0.9, 1.05], parent: g });
    mesh(G.cyl(40), M.toy('#F3DDB5'), { p: [0, 0.91, 0], s: [0.98, 0.02, 0.98], parent: g, cast: false });
    for (const y of [0.04, 0.88]) mesh(G.torus(0.06, TAU, 40), M.toy('#C9965A'), { p: [0, y, 0], r: [Math.PI / 2, 0, 0], s: 1.07, parent: g, cast: false });
    for (let i = 0; i < 3; i++) {
      const b = mesh(dumplingShape(), M.plush(DOUGH), { p: [(i - 1) * 0.55, 0.95, i === 1 ? 0.2 : -0.15], s: 0.3, parent: g, cast: false });
      c.peek.push(b);
    }
    const lid = group(g, [-0.55, 1.15, -0.2]);
    const lidIn = group(lid, [0.55, 0, 0.2]);
    mesh(G.sphere(40), bam, { s: [1.08, 0.42, 1.08], p: [0, 0.05, 0], parent: lidIn });
    mesh(G.torus(0.06, TAU, 40), M.toy('#C9965A'), { r: [Math.PI / 2, 0, 0], s: 1.08, parent: lidIn, cast: false });
    mesh(G.torus(0.3, TAU, 20), M.toy('#C9965A'), { p: [0, 0.5, 0], s: 0.14, parent: lidIn, cast: false });
    lid.rotation.z = 0.32;
    c.lid = lid;
  } else if (kind === 'jiaozi') {
    mesh(G.puck(0.3), M.glossy('#FFFFFF'), { p: [0, 0.08, 0], s: [1.15, 0.16, 1.15], parent: g });
    mesh(G.torus(0.04, TAU, 48), M.glossy('#5698FF'), { p: [0, 0.16, 0], r: [Math.PI / 2, 0, 0], s: 1.02, parent: g, cast: false });
    for (let i = 0; i < 3; i++) {
      const tr = buildTreat('jiaozi');
      tr.g.scale.setScalar(0.38);
      tr.g.position.set((i - 1) * 0.62, 0.12, i === 1 ? 0.25 : -0.15);
      tr.g.rotation.y = (i - 1) * 0.4;
      g.add(tr.g);
      c.peek.push(tr.g);
    }
  } else if (kind === 'cookie') {
    const bowl = lathe([new THREE.Vector2(0.001, 0), new THREE.Vector2(0.6, 0.02), new THREE.Vector2(1.0, 0.35), new THREE.Vector2(1.15, 0.8), new THREE.Vector2(1.08, 0.82), new THREE.Vector2(0.9, 0.45), new THREE.Vector2(0.001, 0.12)], 40);
    mesh(bowl, M.glossy('#FF5C6F'), { parent: g });
    mesh(G.torus(0.04, TAU, 40), M.glossy('#FFD45C'), { p: [0, 0.81, 0], r: [Math.PI / 2, 0, 0], s: 1.11, parent: g, cast: false });
    for (let i = 0; i < 3; i++) {
      const tr = buildTreat('cookie');
      tr.g.scale.setScalar(0.42);
      tr.g.position.set((i - 1) * 0.5, 0.45 + (i === 1 ? 0.15 : 0), (i === 1 ? 0.1 : -0.1));
      tr.g.rotation.set(-0.3, (i - 1) * 0.5, (i - 1) * 0.3);
      g.add(tr.g);
      c.peek.push(tr.g);
    }
  } else {
    mesh(G.box(0.18), M.glossy('#FF8FB8'), { p: [0, 0.3, 0], s: [1.9, 0.6, 1.3], parent: g });
    mesh(G.box(0.12), M.toy('#FFE3EF'), { p: [0, 0.58, 0], s: [1.7, 0.1, 1.1], parent: g, cast: false });
    const lid = group(g, [0, 0.62, -0.68]);
    mesh(G.box(0.18), M.glossy('#FF6FA8'), { p: [0, 0.6, 0.02], r: [-1.25, 0, 0], s: [1.95, 0.14, 1.35], parent: lid });
    mesh(G.puffy('heartbox', heartFn(), 0.2, 0.08), M.glossy('#FFD45C'), { p: [0, 0.95, 0.3], r: [-1.25 + Math.PI / 2, 0, 0], s: 0.2, parent: lid, cast: false });
    c.lid = lid;
    const cols = ['#FFC2DA', '#C9F0B8', '#FFF1B8', '#D8C9FF'];
    for (let i = 0; i < 4; i++) {
      const m = mesh(G.sphere(24), M.plush(cols[i]), { p: [(i % 2 - 0.5) * 0.85, 0.72, (Math.floor(i / 2) - 0.5) * 0.5], s: [0.34, 0.24, 0.3], parent: g, cast: false });
      c.peek.push(m);
    }
  }
  const sh = blobShadow(1.4, 0.3);
  sh.position.y = 0.01;
  g.add(sh);
  if (c.lid) bake(c.lid);
  bake(g, [c.lid, ...c.peek]);
  for (const p of c.peek) if (p.isGroup) bake(p);
  return c;
}
let heartS = null;
function heartFn() {
  if (heartS) return heartS;
  heartS = new THREE.Shape();
  heartS.moveTo(0, -0.9);
  heartS.bezierCurveTo(-1.5, 0.1, -0.72, 1.05, 0, 0.32);
  heartS.bezierCurveTo(0.72, 1.05, 1.5, 0.1, 0, -0.9);
  return heartS;
}

// ---- the room -----------------------------------------------------------------------
function slatTex() {
  return canvasTex(256, 64, (x, w, h) => {
    x.fillStyle = '#E8BE7E';
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 32; i++) {
      x.fillStyle = i % 2 ? '#DDAE6C' : '#EFC98E';
      x.fillRect(i * 8, 0, 8, h);
      x.fillStyle = 'rgba(150,100,50,.25)';
      x.fillRect(i * 8, 0, 1, h);
    }
  });
}

function woodTex() {
  return canvasTex(512, 256, (x, w, h) => {
    x.fillStyle = '#E9B888';
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i % 2 ? '#E3AF7E' : '#EDBF92';
      x.fillRect(0, i * 32, w, 32);
      x.fillStyle = 'rgba(160,100,60,.25)';
      x.fillRect(0, i * 32, w, 2);
    }
    x.strokeStyle = 'rgba(170,110,60,.18)';
    x.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      x.beginPath();
      const y = Math.random() * h;
      x.moveTo(0, y);
      x.bezierCurveTo(w * 0.3, y + rand(-6, 6), w * 0.6, y + rand(-6, 6), w, y + rand(-4, 4));
      x.stroke();
    }
  }, { repeat: true });
}
function wallTex() {
  return canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#FFE1E8';
    x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      x.beginPath();
      x.arc(i * 64 + 32 + (j % 2) * 32, j * 64 + 32, 7, 0, TAU);
      x.fill();
    }
  }, { repeat: true });
}

export const dumplings = {
  tint: '#FFE3C2',

  enter() {
    this.t = 0;
    this.d = dumpData();
    const st = this.stage = new Stage({ bg: '#FFE1E8', fov: 32, keyPos: [-5, 11, 8], shadowArea: 9, hemi: 0.7, sky: '#FFF4F0', ground: '#FFD9C4', env: 0.65 });
    this.world = group(st.scene);
    this.buildRoom();
    this.containers = KINDS.map((k) => {
      const c = buildContainer(k.id);
      this.world.add(c.g);
      return c;
    });
    this.plate = group(this.world);
    mesh(G.puck(0.35), M.glossy('#FFFFFF'), { p: [0, 0.08, 0], s: [1.9, 0.16, 1.9], parent: this.plate, receive: true });
    mesh(G.torus(0.035, TAU, 64), M.glossy('#FF8FB8'), { p: [0, 0.165, 0], r: [Math.PI / 2, 0, 0], s: 1.62, parent: this.plate, cast: false });
    const ps = blobShadow(2.3, 0.28);
    ps.position.y = 0.005;
    this.plate.add(ps);
    bake(this.plate);
    this.pets = [];
    this.layout();
    for (const id of this.d.recent.slice(-3)) if (TOYS[id]) this.addPet(id, false);
    this.state = 'choose';
    this.treat = null;
    this.toy = null;
    this.beam = null;
    this.view = 'table';
    this.shelf = null;
    st.snap(this.poseTable);
    this.buttons = [this.shelfButton()];
    music.play('dumplings');
    wait(0.6, () => this.containers.forEach((c, i) => wait(i * 0.12, () => { c.sq.kick(4); audio.note('marimba', penta(i + 3), { vol: 0.35 }); })));
    this.setHint();
  },

  exit() {
    for (const p of this.pets) p.c.dispose();
    if (this.toy) this.toy.dispose();
    this.stage.dispose();
  },

  buildRoom() {
    const W = this.world;
    const wood = woodTex();
    wood.repeat.set(2, 1);
    mesh(G.box(0.2), PM({ map: wood, roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.4 }), { p: [0, -0.4, 0], s: [26, 0.8, 11], receive: true, parent: W });
    const wt = wallTex();
    wt.repeat.set(10, 5);
    mesh(G.plane(), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.9 }), { p: [0, 6, -5.6], s: [60, 16, 1], receive: true, cast: false, parent: W });
    // paper lanterns
    this.lanterns = [];
    const lc = ['#FF6F8F', '#FFC24D', '#FF8FC0', '#8FDBFF', '#B48BFF'];
    for (let i = 0; i < 7; i++) {
      const g = group(W, [(i - 3) * 3.4, 7.2 + (i % 2) * 0.6, -4.2]);
      mesh(G.sphere(24), M.toy(lc[i % lc.length], { roughness: 0.6, emissive: lc[i % lc.length], emissiveIntensity: 0.15 }), { s: [0.55, 0.62, 0.55], parent: g });
      for (const k of [-1, 1]) mesh(G.cyl(16), M.toy('#FFD45C'), { p: [0, k * 0.6, 0], s: [0.26, 0.1, 0.26], parent: g, cast: false });
      mesh(G.cyl(4), M.basic('#C98A52'), { p: [0, 2, 0], s: [0.015, 2.8, 0.015], parent: g, cast: false });
      for (let r = 0; r < 4; r++) mesh(G.torus(0.02, TAU, 24), M.toy(darken(lc[i % lc.length], 0.15)), { p: [0, -0.36 + r * 0.24, 0], r: [Math.PI / 2, 0, 0], s: [0.52 - Math.abs(r - 1.5) * 0.08, 0.52 - Math.abs(r - 1.5) * 0.08, 0.5], parent: g, cast: false });
      g.userData = { ph: rand(TAU), sq: new Spring(0, 60, 2) };
      bake(g);
      this.lanterns.push(g);
    }
    // the collection shelf on the wall above the table
    this.shelfG = group(W, [0, 0, -5.2]);
    const plank = M.toy('#D9A16E', { roughness: 0.6 });
    mesh(G.box(0.1), M.toy('#FFF1DC', { roughness: 0.8 }), { p: [0, 4.6, -0.1], s: [10.4, 5.0, 0.2], parent: this.shelfG, receive: true });
    for (const y of [2.1, 4.3, 6.5]) mesh(G.box(0.08), plank, { p: [0, y, 0.35], s: [10.6, 0.24, 1.0], parent: this.shelfG });
    for (const x of [-5.2, 5.2]) mesh(G.box(0.08), plank, { p: [x, 4.3, 0.35], s: [0.28, 4.6, 1.0], parent: this.shelfG });
    mesh(G.puffy('heartshelf', heartFn(), 0.3, 0.12), M.glossy('#FF6F9B'), { p: [0, 7.15, 0.4], s: 0.45, parent: this.shelfG, cast: false });
    bake(this.shelfG);
    // a tiny window with a garden outside
    const win = group(W, [7.5, 4.5, -5.5]);
    mesh(G.box(0.1), M.toy('#FFFFFF'), { s: [3.2, 3.2, 0.2], parent: win, cast: false });
    mesh(G.plane(), new THREE.MeshBasicMaterial({ map: canvasTex(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8FD0FF'); g.addColorStop(0.7, '#D4F0FF'); g.addColorStop(0.71, '#8FDE7E'); g.addColorStop(1, '#7ACB6E'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }), { p: [0, 0, 0.12], s: [2.7, 2.7, 1], parent: win, cast: false });
    mesh(G.box(0.05), M.toy('#FFFFFF'), { p: [0, 0, 0.16], s: [0.12, 2.8, 0.06], parent: win, cast: false });
    mesh(G.box(0.05), M.toy('#FFFFFF'), { p: [0, 0, 0.16], s: [2.8, 0.12, 0.06], parent: win, cast: false });
    bake(win);
    // teapot and cups for cosiness
    const pot = group(W, [-6.6, 0, -2.6]);
    mesh(G.sphere(28), M.glossy('#8FDBFF'), { p: [0, 0.75, 0], s: [0.85, 0.72, 0.85], parent: pot });
    mesh(G.sphere(16), M.glossy('#8FDBFF'), { p: [0, 1.45, 0], s: [0.4, 0.2, 0.4], parent: pot, cast: false });
    mesh(G.sphere(10), M.glossy('#FFFFFF'), { p: [0, 1.62, 0], s: 0.12, parent: pot, cast: false });
    mesh(G.capsule(1, 8), M.glossy('#8FDBFF'), { p: [0.95, 0.95, 0], r: [0, 0, -0.9], s: [0.11, 0.3, 0.11], parent: pot, cast: false });
    mesh(G.torus(0.25, Math.PI * 1.4, 20), M.glossy('#8FDBFF'), { p: [-0.85, 0.85, 0], r: [0, 0, Math.PI * 0.7], s: 0.35, parent: pot, cast: false });
    for (let i = 0; i < 5; i++) mesh(G.sphere(12), M.glossy('#FFFFFF'), { p: [Math.cos(i * 1.25) * 0.86, 0.75, Math.sin(i * 1.25) * 0.86], s: 0.1, parent: pot, cast: false });
    bake(pot);
    this.pot = pot;
    this.potSq = new Spring(1, 260, 8);
    // steam puffs
    this.steam = [];
  },

  layout() {
    const wide = app.W > app.H;
    const sp = wide ? 3.1 : 1.7;
    this.containers.forEach((c, i) => {
      c.g.position.set((i - 1.5) * sp, 0, -2.6);
      c.g.scale.setScalar(wide ? 1 : 0.66);
      c.x = c.g.position.x;
    });
    this.plate.position.set(0, 0, 0.9);
    this.plate.scale.setScalar(wide ? 1 : 0.85);
    const st = this.stage;
    this.poseTable = st.pose(V(0, 0.9, wide ? -0.5 : -0.3), wide ? 13.6 : 7.2, wide ? 6.4 : 8, [0, 0.9, 1]);
    this.poseOpen = st.pose(V(0, 1.25, 0.9), wide ? 7.5 : 5.2, wide ? 5.4 : 6.2, [0, 0.45, 1]);
    this.poseShelf = st.pose(V(0, 4.25, -4.9), wide ? 10.8 : 10.4, wide ? 6.2 : 6.6, [0, 0.08, 1]);
    this.roam = wide ? 5.2 : 3.3;
    st.shadowArea(9, V(0, 0, -0.5));
  },

  resize() {
    this.layout();
    this.stage.snap(this.view === 'shelf' ? this.poseShelf : this.state === 'choose' ? this.poseTable : this.poseOpen);
    this.buttons.forEach((b) => b.place && b.place());
  },

  // ---- buttons ----------------------------------------------------------------------
  shelfButton() {
    const b = new Btn({
      r: 28, slop: 10,
      place() { b.x = app.W - 44; b.y = Math.max(app.safeTop, 10) + 34; },
      paint: (c, r) => {
        candy(c, r, '#FFB054');
        c.fillStyle = '#FFF6E6';
        rr(c, -14, -12, 28, 25, 4);
        c.fill();
        c.fillStyle = '#E08A3C';
        c.fillRect(-14, -1, 28, 3);
        c.fillStyle = '#FF6F9B';
        ell(c, -6, -6, 4.2); c.fill();
        c.fillStyle = '#6FC4FF';
        ell(c, 6, -6, 4.2); c.fill();
        c.fillStyle = '#7FD86F';
        ell(c, 0, 7, 4.2); c.fill();
        const n = this.d.found.length;
        if (this.newBadge) {
          c.fillStyle = P.rose;
          ell(c, r * 0.72, -r * 0.72, 8 + Math.sin(this.t * 6) * 1.5);
          c.fill();
        }
        return n;
      },
      tap: () => (this.view === 'shelf' ? this.closeShelf() : this.openShelf())
    });
    b.place();
    return b;
  },

  // ---- choosing -----------------------------------------------------------------------
  setHint() {
    hint.clear();
    if (this.view === 'shelf') return;
    const st = this.stage;
    if (this.state === 'choose') {
      if (this.d.opened > 1) return;
      const c = this.containers[Math.floor(this.t) % 4] || this.containers[0];
      const s = st.toScreen(c.g.position.clone().add(V(0, 0.9, 0)));
      hint.set({ from: [s.x, s.y], delay: 2.2 });
    } else if (this.state === 'open' && this.treat) {
      const s = st.toScreen(this.treat.g.getWorldPosition(V()).add(V(0, 0.7, 0)));
      const k = this.treat.kind;
      if (k === 'bao') hint.set({ from: [s.x, s.y], to: [s.x, s.y - 140], delay: 1.6 });
      else if (k === 'jiaozi') hint.set({ from: [s.x - 90, s.y], to: [s.x + 90, s.y], delay: 1.6 });
      else hint.set({ from: [s.x, s.y], delay: 1.6 });
    }
  },

  pickContainer(c) {
    if (this.state !== 'choose' || this.view !== 'table') return;
    const kind = c.kind;
    this.state = 'flying';
    this.d.opened++;
    save.touch();
    c.sq.kick(-6);
    haptic();
    const st = this.stage;
    const s = st.toScreen(c.g.position.clone().add(V(0, 1, 0)));
    if (c.lid) {
      tween(c.lid.position, { y: c.lid.position.y + 1.2 }, 0.3, { ease: E.out });
      tween(c.lid.rotation, { x: kind === 'mochi' ? -0.6 : -0.5 }, 0.3, { ease: E.out });
      wait(1.1, () => {
        tween(c.lid.position, { y: c.lid.userData.y0 }, 0.35, { ease: E.back });
        tween(c.lid.rotation, { x: 0 }, 0.35, { ease: E.back });
      });
      c.lid.userData.y0 = c.lid.userData.y0 ?? c.lid.position.y;
    }
    audio.sfx(kind === 'bao' ? 'lid' : kind === 'mochi' ? 'knock' : 'crinkle', { vol: 0.7 });
    if (kind === 'bao') { audio.sfx('steam', { vol: 0.6 }); this.puff(c.g.position.clone().add(V(0, 1.2, 0)), 8); }
    fx.sparkle(s.x, s.y, 10);
    // the treat jumps across to the plate
    const tr = this.treat = buildTreat(kind);
    this.world.add(tr.g);
    const from = c.g.position.clone().add(V(0, 1, 0));
    const to = this.plate.position.clone().add(V(0, 0.17, 0));
    tr.g.position.copy(from);
    tr.g.scale.setScalar(0.4);
    const o = { u: 0 };
    tr.sq = new Spring(1, 220, 7);
    tr.wob = new Spring(0, 160, 6);
    tr.progress = 0;
    tr.goal = KINDS.find((k) => k.id === kind).goal;
    audio.sfx('jump', { rate: 0.9 });
    tween(o, { u: 1 }, 0.75, {
      ease: (u) => u, done: () => {
        tr.sq.kick(-8);
        audio.sfx('land');
        audio.voice('mmm', 1.1, 0.4);
        this.state = 'open';
        this.setHint();
      }
    });
    tr.fly = { o, from, to };
    wait(0.2, () => this.camGoal = 'open');
    hint.clear();
  },

  puff(p, n = 6) {
    for (let i = 0; i < n; i++) {
      const m = mesh(G.sphere(12), new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.55, depthWrite: false, roughness: 1 }), { p: [p.x + rand(-0.4, 0.4), p.y + rand(0, 0.3), p.z + rand(-0.3, 0.3)], s: rand(0.2, 0.4), parent: this.world, cast: false });
      this.steam.push({ m, v: rand(0.8, 1.6), life: rand(0.9, 1.6), age: 0, s0: m.scale.x });
    }
  },

  // ---- opening interactions --------------------------------------------------------------
  advance(amount = 1) {
    const tr = this.treat;
    if (!tr || tr.done) return;
    tr.progress += amount;
    const step = Math.floor(tr.progress);
    if (tr.lastStep === step) return;
    tr.lastStep = step;
    tr.face.set(step >= tr.goal - 1 ? 'wow' : 'awake');
    const s = this.stage.toScreen(tr.g.getWorldPosition(V()).add(V(0, 0.8, 0)));
    audio.note('bell', penta(3 + step * 2), { vol: 0.45 });
    fx.sparkle(s.x, s.y, 6 + step * 3);
    haptic();
    if (step >= tr.goal) this.openTreat();
  },

  openTreat() {
    const tr = this.treat;
    tr.done = true;
    hint.clear();
    this.state = 'reveal';
    const kind = tr.kind;
    const st = this.stage;
    const center = tr.g.getWorldPosition(V()).add(V(0, 0.6, 0));
    const sc = st.toScreen(center);
    audio.sfx('magic', { vol: 0.7 });
    if (kind === 'bao') {
      // the top unfurls like a flower
      tween(tr.parts.top.position, { y: 2.2 }, 0.5, { ease: E.out });
      tween(tr.parts.top.scale, { x: 1.8, y: 0.2, z: 1.8 }, 0.5, { ease: E.out });
      tween(tr.parts.body.scale, { x: 1.15, y: 0.55, z: 1.15 }, 0.35, { ease: E.back });
      audio.sfx('pop');
      this.puff(center, 10);
    } else if (kind === 'jiaozi') {
      tween(tr.parts.hinge.rotation, { x: -1.6 }, 0.55, { ease: E.back });
      audio.sfx('squish2');
    } else if (kind === 'cookie') {
      tr.parts.halves.forEach((h, i) => {
        const k = i ? 1 : -1;
        tween(h.position, { x: k * 1.6, y: 0.3 }, 0.6, { ease: E.out });
        tween(h.rotation, { z: k * 1.2, y: k * 0.6 }, 0.6, { ease: E.out });
      });
      audio.sfx('crack', { vol: 1 });
      audio.sfx('shell');
      tr.face.f.visible = false;
      tr.g.children.forEach((ch) => { if (ch.isMesh && ch.geometry.type === 'CapsuleGeometry') ch.visible = false; });
      fx.burst(sc.x, sc.y, { kind: 'dot', n: 14, colors: ['#F2B45C', '#E09A45', '#FFD9A0'], speed: 260, size: 9, g: 600, life: 0.9 });
      this.paperSlip(center);
    } else {
      tween(tr.parts.body.scale, { x: 1.5, y: 0.2, z: 1.5 }, 0.18, { ease: E.out });
      wait(0.18, () => { tr.parts.body.visible = false; });
      tr.face.f.visible = false;
      audio.sfx('pop', { rate: 0.8 });
      audio.sfx('splat', { vol: 0.5 });
      fx.burst(sc.x, sc.y, { kind: 'confetti', n: 30, speed: 320 });
    }
    if (kind !== 'cookie' && kind !== 'mochi') {
      tr.face.set('wow');
      // the empty dough melts away as the toy climbs out
      tween(tr.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.45, { ease: E.in, delay: 0.55 });
    }
    // light beam
    const beam = this.beam = group(this.world);
    beam.position.copy(tr.g.position);
    const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: raysTex(), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    rays.position.set(0, 1.4, -0.4);
    rays.scale.set(6, 6, 1);
    beam.add(rays);
    beam.rays = rays;
    beam.scale.set(0.01, 0.01, 0.01);
    tween(beam.scale, { x: 1, y: 1, z: 1 }, 0.35, { ease: E.back });
    fx.burst(sc.x, sc.y, { kind: 'star', n: 18, colors: [P.sun, P.butter, '#FFFFFF'], speed: 340, size: 20, g: 200, life: 1.1 });
    haptic();
    // who is inside? Always someone new while there is anyone left to find
    const id = this.nextToy(kind);
    const isNew = !this.d.found.includes(id);
    const shiny = !isNew && !this.d.shiny.includes(id);
    if (isNew) this.d.found.push(id);
    else if (shiny) this.d.shiny.push(id);
    this.d.recent = [...this.d.recent.filter((r) => r !== id), id].slice(-6);
    save.touch();
    const toy = this.toy = makeToy(id, 0.01, this.d.shiny.includes(id));
    toy.root.position.copy(tr.g.position).add(V(0, 0.5, 0));
    this.world.add(toy.root);
    toy.setMood('wow', 1.4);
    const o = { k: 0.01, y: 0, spin: 0 };
    tween(o, { k: 1.05, y: 1.25, spin: TAU * 2 }, 0.9, { ease: E.out, delay: 0.25 });
    tween(o, { y: 0.17 }, 0.45, { ease: E.in, delay: 1.25, done: () => {
      toy.poke(1.4);
      audio.sfx('land');
      toy.say('yay', 0.8);
      toy.setMood('happy', 1.6);
      toy.wave();
      if (isNew) { audio.fanfare(); fx.confetti(app.W, app.H, 70); this.newBadge = true; } else audio.success();
      if (isNew && (this.d.found.length % 3 === 0)) save.earnStar();
      this.checkSeries(kind, isNew);
      tween(beam.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.5, { ease: E.in, done: () => { this.world.remove(beam); this.beam = null; } });
      this.revealReady = this.t + 0.5;
      wait(4.5, () => this.state === 'reveal' && this.toy === toy && this.finishReveal());
    } });
    toy.rise = o;
    wait(0.25, () => toy.say('ooh', 0.6));
  },

  paperSlip(center) {
    const g = group(this.world, [center.x, center.y, center.z + 0.2]);
    const m = mesh(G.box(0.02), M.toy('#FFFFFF'), { s: [0.01, 0.3, 0.02], parent: g, cast: false });
    tween(m.scale, { x: 1.8 }, 0.5, { ease: E.out });
    const o = { y: center.y };
    tween(o, { y: center.y + 1.4 }, 1.6, { ease: E.out });
    this.slip = { g, o, t: 0 };
    audio.sfx('rip', { vol: 0.5 });
  },

  nextToy(kind) {
    const series = Object.keys(TOYS).filter((k) => TOYS[k].kind === kind);
    const fresh = series.filter((k) => !this.d.found.includes(k));
    if (fresh.length) return pick(fresh);
    const anyFresh = Object.keys(TOYS).filter((k) => !this.d.found.includes(k));
    // this treat's friends are all home: it brings back a sparkly twin instead
    const notShiny = series.filter((k) => !this.d.shiny.includes(k));
    if (notShiny.length) return pick(notShiny);
    return anyFresh.length ? pick(anyFresh) : pick(series);
  },

  checkSeries(kind, isNew) {
    if (!isNew) return;
    const series = Object.keys(TOYS).filter((k) => TOYS[k].kind === kind);
    if (series.every((k) => this.d.found.includes(k))) {
      wait(1.2, () => {
        audio.fanfare();
        fx.confetti(app.W, app.H, 110);
        save.earnStar();
      });
    }
  },

  finishReveal() {
    if (this.state !== 'reveal') return;
    this.state = 'leaving';
    const toy = this.toy;
    this.toy = null;
    const tr = this.treat;
    this.treat = null;
    if (tr) {
      tween(tr.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.35, { ease: E.in, done: () => this.world.remove(tr.g) });
    }
    if (this.slip) { this.world.remove(this.slip.g); this.slip = null; }
    // the toy hops off to play on the table
    const pet = this.addPet(toy.toyId, false, toy);
    const [x, z] = this.roamSpot();
    const from = toy.root.position.clone();
    pet.jump = { from, to: V(x, 0, z), u: 0 };
    tween(pet.jump, { u: 1 }, 0.7, { ease: (u) => u, done: () => { pet.jump = null; toy.poke(); audio.sfx('land'); } });
    audio.sfx('jump2');
    toy.say('wee', 0.5);
    this.camGoal = 'table';
    wait(0.8, () => {
      this.state = 'choose';
      this.setHint();
    });
  },

  roamSpot() {
    const side = Math.random() < 0.5 ? -1 : 1;
    return [side * rand(Math.max(3.2, this.roam * 0.65), this.roam), rand(-1.1, 0.9)];
  },

  addPet(id, place = true, critter = null) {
    const c = critter || makeToy(id, 0.72, this.d.shiny.includes(id));
    if (!critter) {
      const [x, z] = this.roamSpot();
      c.root.position.set(x, 0, z);
      this.world.add(c.root);
    }
    c.root.scale.setScalar(0.72);
    const p = { id, c, tx: c.root.position.x, tz: c.root.position.z, idle: rand(1, 4), walk: 0 };
    this.pets.push(p);
    while (this.pets.length > 4) {
      const old = this.pets.shift();
      tween(old.c.root.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.4, { ease: E.in, done: () => { this.world.remove(old.c.root); old.c.dispose(); } });
      const s = this.stage.objScreen(old.c.body);
      fx.sparkle(s.x, s.y, 8);
    }
    return p;
  },

  // ---- the shelf ------------------------------------------------------------------
  openShelf(tab) {
    if (this.state !== 'choose' && this.state !== 'shelf') return;
    this.view = 'shelf';
    this.newBadge = false;
    this.camGoal = 'shelf';
    hint.clear();
    audio.sfx('whoosh', { vol: 0.5 });
    this.showSeries(tab ?? (this.shelfTab || 0));
    this.tabButtons = KINDS.map((k, i) => new Btn({
      r: 26, slop: 8,
      paint: (c, r) => {
        candy(c, r, i === this.shelfTab ? '#FFB054' : '#FFE3C2', i === this.shelfTab);
        drawKindIcon(c, k.id, r * 0.62);
        const n = Object.keys(TOYS).filter((t) => TOYS[t].kind === k.id && this.d.found.includes(t)).length;
        if (n === 8) { softStar(c, r * 0.72, -r * 0.72, 9); c.fillStyle = P.sun; c.fill(); }
      },
      tap: () => this.showSeries(i)
    }));
    this.placeTabs();
    this.buttons = [this.buttons[0], ...this.tabButtons];
  },
  placeTabs() {
    const n = this.tabButtons.length, gap = 66;
    this.tabButtons.forEach((b, i) => { b.x = app.W / 2 + (i - (n - 1) / 2) * gap; b.y = app.H - Math.max(app.safeBottom, 8) - 40; });
  },

  showSeries(i) {
    this.shelfTab = i;
    if (this.shelf) { this.shelf.items.forEach((it) => { this.shelfG.remove(it.g); if (it.c) it.c.dispose(); }); }
    const kind = KINDS[i];
    const ids = Object.keys(TOYS).filter((k) => TOYS[k].kind === kind.id);
    const wide = app.W > app.H;
    const items = ids.map((id, j) => {
      const row = Math.floor(j / 4), col = j % 4;
      const x = (col - 1.5) * (wide ? 2.45 : 2.3), y = row ? 2.22 : 4.42;
      const found = this.d.found.includes(id);
      const g = group(this.shelfG, [x, y, 0.4]);
      let c = null;
      if (found) {
        c = makeToy(id, 0.72, this.d.shiny.includes(id));
        g.add(c.root);
        c.look(this.stage.camera.position);
      } else {
        const tr = buildTreat(kind.id);
        tr.g.scale.setScalar(0.5);
        tr.g.traverse((o) => { if (o.isMesh) o.material = M.toy('#D8C8D6', { transparent: true, opacity: 0.55 }); });
        g.add(tr.g);
      }
      g.scale.setScalar(0.01);
      tween(g.scale, { x: 1, y: 1, z: 1 }, 0.4, { ease: E.back, delay: 0.05 * j });
      return { id, g, c, found };
    });
    this.shelf = { items };
    audio.note('marimba', penta(4 + i), { vol: 0.4 });
  },

  closeShelf() {
    this.view = 'table';
    this.camGoal = 'table';
    audio.sfx('whoosh', { vol: 0.5 });
    if (this.shelf) {
      const items = this.shelf.items;
      wait(0.6, () => items.forEach((it) => { this.shelfG.remove(it.g); if (it.c) it.c.dispose(); }));
      this.shelf = null;
    }
    this.buttons = [this.buttons[0]];
    this.setHint();
  },

  // ---- frame -----------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    const goal = this.view === 'shelf' ? this.poseShelf : this.camGoal === 'open' ? this.poseOpen : this.poseTable;
    if (this.camGoal === 'table' && this.state === 'choose') this.camGoal = null;
    st.glide(goal, dt, 3.2);

    for (const c of this.containers) {
      const s = c.sq.step(dt);
      c.g.scale.y = (app.W > app.H ? 1 : 0.66) * s;
      c.peek.forEach((p, i) => { p.rotation.z = Math.sin(t * 2 + i * 1.7 + c.x) * 0.06; p.position.y += Math.sin(t * 3 + i) * 0.0008; });
      if (c.lid && this.state === 'choose') c.lid.rotation.z = (c.lid.userData.z0 ??= c.lid.rotation.z) + Math.sin(t * 1.6 + c.x) * 0.03;
    }
    for (const l of this.lanterns) {
      l.rotation.z = Math.sin(t * 0.8 + l.userData.ph) * 0.05 + l.userData.sq.step(dt) * 0.1;
    }
    const ps = this.potSq.step(dt);
    this.pot.scale.set(1 / Math.sqrt(ps), ps, 1 / Math.sqrt(ps));
    if (Math.random() < dt * 1.2) this.puff(this.pot.position.clone().add(V(0.9, 1.7, 0)), 1);
    for (const s of this.steam) {
      s.age += dt;
      s.m.position.y += s.v * dt;
      s.m.scale.setScalar(s.s0 * (1 + s.age * 1.4));
      s.m.material.opacity = 0.5 * (1 - s.age / s.life);
      if (s.age > s.life) { this.world.remove(s.m); s.m.material.dispose(); s.dead = true; }
    }
    this.steam = this.steam.filter((s) => !s.dead);

    const tr = this.treat;
    if (tr) {
      if (tr.fly) {
        const u = tr.fly.o.u;
        tr.g.position.lerpVectors(tr.fly.from, tr.fly.to, u);
        tr.g.position.y += Math.sin(u * Math.PI) * 2.2;
        tr.g.scale.setScalar(lerp(0.4, 1, u));
        tr.g.rotation.y = (1 - u) * TAU;
        if (u >= 1) tr.fly = null;
      }
      const s = tr.sq.step(dt);
      const w = tr.wob.step(dt);
      if (!tr.done) {
        if (tr.stretch !== undefined) {
          const k = 1 + tr.stretch * 0.75;
          tr.g.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
        } else if (tr.press) {
          tr.g.scale.set(1.25, 0.6, 1.25);
        } else if (!tr.fly) tr.g.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
        tr.g.rotation.z = w * 0.15 + (tr.progress > 0 ? Math.sin(t * 7) * 0.02 * tr.progress : 0);
        // waiting treats breathe in their sleep
        if (tr.progress === 0 && !tr.fly && !tr.press && tr.stretch === undefined) tr.g.scale.y *= 1 + Math.sin(t * 2.2) * 0.02;
      }
    }
    if (this.slip) {
      this.slip.g.position.y = this.slip.o.y;
      this.slip.g.rotation.z = Math.sin(t * 3) * 0.1;
    }
    if (this.toy) {
      const o = this.toy.rise;
      this.toy.root.scale.setScalar(o.k);
      this.toy.root.position.y = (this.plate.position.y + o.y);
      this.toy.root.rotation.y = o.spin;
      this.toy.look(st.camera.position);
      this.toy.update(dt);
      if (this.toy.ring) this.toy.ring.rotation.y = t * 1.5;
    }
    if (this.beam) this.beam.rays.material.rotation = t * 0.4;
    this.updatePets(dt);
    if (this.shelf) for (const it of this.shelf.items) {
      if (it.c) { it.c.update(dt); if (it.c.ring) it.c.ring.rotation.y = t * 1.5; }
      else it.g.rotation.y = Math.sin(t + it.g.position.x) * 0.3;
    }
  },

  updatePets(dt) {
    const cam = this.stage.camera.position;
    for (const p of this.pets) {
      const c = p.c, pos = c.root.position;
      if (p.jump) {
        pos.lerpVectors(p.jump.from, p.jump.to, p.jump.u);
        pos.y = p.jump.from.y * (1 - p.jump.u) + Math.sin(p.jump.u * Math.PI) * 1.6;
        c.update(dt);
        continue;
      }
      // keep off the plate: that is where the treats are opened
      const px = pos.x - this.plate.position.x, pz = pos.z - this.plate.position.z, pd = Math.hypot(px, pz);
      if (pd < 2.9) { pos.x += (px / (pd || 1)) * (2.9 - pd) * Math.min(1, dt * 8); pos.z += (pz / (pd || 1)) * (2.9 - pd) * Math.min(1, dt * 8); }
      if (Math.abs(p.tx) < 3) p.tx = Math.sign(p.tx || 1) * 3.2;
      const dx = p.tx - pos.x, dz = p.tz - pos.z, d = Math.hypot(dx, dz);
      if (d > 0.06) {
        const v = 1.1 * dt;
        pos.x += (dx / d) * Math.min(v, d);
        pos.z += (dz / d) * Math.min(v, d);
        p.walk += dt * 10;
        c.root.rotation.y += (clamp(Math.atan2(dx, dz), -1.2, 1.2) - c.root.rotation.y) * Math.min(1, dt * 6);
        if (c.y <= 0 && Math.sin(p.walk) > 0.95) c.hop(2);
      } else {
        c.root.rotation.y *= 1 - Math.min(1, dt * 3);
        p.idle -= dt;
        if (p.idle <= 0) {
          p.idle = rand(2, 6);
          const r = Math.random();
          if (r < 0.5) [p.tx, p.tz] = this.roamSpot();
          else if (r < 0.75) { c.hop(4); if (Math.random() < 0.3) c.say(pick(['hehe', 'chirp', 'mew']), 0.15); }
          else c.wave();
        }
      }
      if (this.toy) c.look(this.toy.root.position.clone().add(V(0, 0.6, 0)));
      else c.look(cam);
      c.update(dt);
      if (c.ring) c.ring.rotation.y = this.t * 1.5;
    }
  },

  draw(c) {
    // progress pearls under the treat: how many more stretches, tickles or taps
    const tr = this.treat;
    if (tr && this.state === 'open' && !tr.done) {
      const s = this.stage.toScreen(this.plate.position.clone().add(V(0, 0.1, 1.9)));
      const n = tr.goal, gap = 26;
      for (let i = 0; i < n; i++) {
        const x = s.x + (i - (n - 1) / 2) * gap, on = i < Math.floor(tr.progress);
        c.fillStyle = on ? P.sun : 'rgba(255,255,255,.75)';
        softStar(c, x, s.y + 8, on ? 11 + Math.sin(this.t * 5 + i) : 8, 5, 0.55);
        c.fill();
        c.strokeStyle = on ? '#E89A1A' : 'rgba(160,120,140,.5)';
        c.lineWidth = 2;
        c.stroke();
      }
    }
    if (this.shelf && this.view === 'shelf') {
      for (const it of this.shelf.items) {
        if (it.found) continue;
        const sp = this.stage.toScreen(it.g.getWorldPosition(V()).add(V(0, 0.95, 0.3)));
        c.save();
        c.translate(sp.x, sp.y + Math.sin(this.t * 2 + sp.x) * 3);
        c.fillStyle = 'rgba(255,255,255,.85)';
        ell(c, 0, 0, 15); c.fill();
        c.strokeStyle = '#C9A8C8'; c.lineWidth = 3.4; c.lineCap = 'round';
        c.beginPath(); c.arc(0, -3, 5.5, Math.PI * 1.1, Math.PI * 2.25); c.lineTo(0, 4); c.stroke();
        c.fillStyle = '#C9A8C8'; ell(c, 0, 9, 2.2); c.fill();
        c.restore();
      }
    }
    for (const b of this.buttons) b.draw(c);
  },

  // ---- input ------------------------------------------------------------------------
  hitPet(p) {
    const hit = this.stage.pick(p.x, p.y, this.pets.map((q) => q.c.root));
    if (!hit) return null;
    return this.pets.find((q) => q.c.root.getObjectById(hit.object.id));
  },
  poke(c, p) {
    c.poke();
    c.hop(5);
    c.setMood(pick(['happy', 'wow', 'happy']), 1);
    c.say(pick(['giggle', 'yay', 'hehe', 'mew', 'wee']), 0.6);
    fx.hearts(p.x, p.y - 10, 5);
    haptic();
  },

  down(p) {
    const st = this.stage;
    if (this.view === 'shelf') {
      if (!this.shelf) return;
      const hit = st.pick(p.x, p.y, this.shelf.items.map((it) => it.g));
      const it = hit && this.shelf.items.find((q) => q.g.getObjectById(hit.object.id));
      if (it && it.c) this.poke(it.c, p);
      else if (it) { audio.sfx('blup', { rate: 1.2 }); fx.sparkle(p.x, p.y, 5); it.g.rotation.z = 0.3; tween(it.g.rotation, { z: 0 }, 0.4, { ease: E.elastic }); }
      return;
    }
    const pet = this.hitPet(p);
    if (pet && !pet.jump) { this.poke(pet.c, p); return; }
    if (this.state === 'choose') {
      for (const c of this.containers) {
        const s = st.toScreen(c.g.position.clone().add(V(0, 0.7, 0)));
        const r = 60 * (app.W > app.H ? 1.2 : 0.9);
        if (dist(p.x, p.y, s.x, s.y) < r) { this.pickContainer(c); return; }
      }
      // lanterns and the teapot are toys too
      const hl = st.pick(p.x, p.y, [...this.lanterns, this.pot]);
      if (hl) {
        let o = hl.object;
        while (o.parent && !this.lanterns.includes(o) && o !== this.pot) o = o.parent;
        if (o === this.pot) { this.potSq.kick(5); audio.sfx('steam', { vol: 0.5 }); this.puff(this.pot.position.clone().add(V(0.9, 1.7, 0)), 6); audio.note('bell', penta(6), { vol: 0.3 }); }
        else { o.userData.sq.kick(rand(-4, 4)); audio.note('glock', penta(Math.floor(rand(4, 10))), { vol: 0.4 }); }
        return;
      }
      fx.sparkle(p.x, p.y, 4);
      return;
    }
    if (this.state === 'reveal' && this.toy) {
      if (this.t > (this.revealReady || 0)) {
        this.poke(this.toy, p);
        wait(0.5, () => this.finishReveal());
      } else this.poke(this.toy, p);
      return;
    }
    const tr = this.treat;
    if (this.state !== 'open' || !tr || tr.done) return;
    const s = st.toScreen(tr.g.getWorldPosition(V()).add(V(0, 0.55, 0)));
    const near = dist(p.x, p.y, s.x, s.y) < 150;
    if (tr.kind === 'bao' && near) {
      p.grab = { y0: p.y };
      tr.stretch = 0;
      tr.face.set('awake');
      audio.sfx('squish', { vol: 0.4 });
    } else if (tr.kind === 'jiaozi') {
      p.rub = { last: [p.x, p.y], acc: 0 };
      if (near) { tr.wob.kick(3); tr.face.set('awake'); }
    } else if (tr.kind === 'cookie' && near) {
      tr.sq.kick(-5);
      tr.wob.kick(rand(-6, 6));
      audio.sfx('knock', { vol: 0.8 });
      audio.sfx('crack', { vol: 0.4 + tr.progress * 0.2 });
      const nC = Math.min(6, (Math.floor(tr.progress) + 1) * 2);
      tr.parts.cracks.forEach((c, i) => { c.visible = i < nC; });
      this.advance(1);
      if (!tr.done) tr.face.set('awake');
    } else if (tr.kind === 'mochi' && near) {
      tr.press = true;
      p.press = true;
      audio.sfx('squish', { vol: 0.7, rate: 0.9 + tr.progress * 0.1 });
      haptic();
    }
  },

  move(p) {
    const tr = this.treat;
    if (!tr || tr.done || this.state !== 'open') return;
    if (p.grab && tr.kind === 'bao') {
      const s = clamp((p.grab.y0 - p.y) / 170, 0, 1.2);
      if (s > 0.4 && (tr.stretch || 0) <= 0.4) audio.sfx('stretch', { vol: 0.6, rate: 0.9 + tr.progress * 0.12 });
      tr.stretch = s;
    }
    if (p.rub && tr.kind === 'jiaozi') {
      const s = this.stage.toScreen(tr.g.getWorldPosition(V()).add(V(0, 0.5, 0)));
      if (dist(p.x, p.y, s.x, s.y) < 170) {
        const d = Math.hypot(p.x - p.rub.last[0], p.y - p.rub.last[1]);
        p.rub.acc += d;
        if (Math.random() < 0.25) audio.sfx('scrub', { vol: 0.4 });
        if (p.rub.acc > 110) {
          p.rub.acc = 0;
          const i = Math.floor(tr.progress);
          const pl = tr.parts.pleats[i];
          if (pl) { pl.material = M.toy('#FFE066', { emissive: '#FFB000', emissiveIntensity: 0.5 }); pl.scale.multiplyScalar(1.3); }
          tr.wob.kick(rand(-5, 5));
          tr.sq.kick(-3);
          if (i % 2 === 0) audio.voice('hehe', 1.25, 0.4);
          this.advance(1);
        }
      }
      p.rub.last = [p.x, p.y];
    }
  },

  up(p) {
    const tr = this.treat;
    if (!tr || tr.done) return;
    if (p.grab && tr.kind === 'bao') {
      const s = tr.stretch || 0;
      tr.stretch = undefined;
      tr.sq.x = 1 + s * 0.75;
      tr.sq.kick(-4);
      if (s > 0.5) {
        audio.sfx('boing', { rate: 0.9 + tr.progress * 0.15 });
        audio.voice('wee', 1.15, 0.35);
        this.puff(tr.g.position.clone().add(V(0, 1.4, 0)), 3);
        this.advance(1);
      } else audio.sfx('wobble', { vol: 0.5 });
    }
    if (p.press && tr.kind === 'mochi') {
      tr.press = false;
      tr.sq.x = 0.6;
      tr.sq.v = 14;
      audio.sfx('boing', { rate: 1 + tr.progress * 0.12 });
      tr.parts.body.material = M.plush(['#FFC2DA', '#FFB0D0', '#FF9FC6', '#FF8FC0', '#FF7FB8'][Math.min(4, Math.floor(tr.progress) + 1)]);
      this.advance(1);
    }
  }
};

let raysT = null;
function raysTex() {
  return raysT || (raysT = canvasTex(256, 256, (x) => {
    x.translate(128, 128);
    for (let i = 0; i < 12; i++) {
      x.rotate(TAU / 12);
      const g = x.createLinearGradient(0, 0, 0, -128);
      g.addColorStop(0, 'rgba(255,236,160,.8)');
      g.addColorStop(1, 'rgba(255,236,160,0)');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(-18, -128); x.lineTo(18, -128); x.closePath(); x.fill();
    }
    const r = x.createRadialGradient(0, 0, 0, 0, 0, 90);
    r.addColorStop(0, 'rgba(255,250,220,.9)');
    r.addColorStop(1, 'rgba(255,250,220,0)');
    x.fillStyle = r;
    x.fillRect(-128, -128, 256, 256);
  }));
}

function drawKindIcon(c, id, s) {
  c.save();
  c.scale(s / 16, s / 16);
  if (id === 'bao') {
    c.fillStyle = '#FFF5EA';
    c.beginPath(); c.moveTo(-13, 6); c.quadraticCurveTo(-13, -12, 0, -13); c.quadraticCurveTo(13, -12, 13, 6); c.closePath(); c.fill();
    c.strokeStyle = '#E8CFB8'; c.lineWidth = 2; c.stroke();
  } else if (id === 'jiaozi') {
    c.fillStyle = '#FFF5EA';
    c.beginPath(); c.moveTo(-14, 4); c.quadraticCurveTo(0, -16, 14, 4); c.quadraticCurveTo(0, 10, -14, 4); c.fill();
    c.strokeStyle = '#E8CFB8'; c.lineWidth = 2; c.stroke();
  } else if (id === 'cookie') {
    c.fillStyle = '#F2B45C';
    c.beginPath(); c.arc(-5, 0, 9, Math.PI * 0.5, Math.PI * 1.5); c.arc(5, 0, 9, -Math.PI * 0.5, Math.PI * 0.5); c.closePath(); c.fill();
    c.strokeStyle = '#C97F2E'; c.lineWidth = 2; c.stroke();
  } else {
    c.fillStyle = '#FFC2DA';
    ell(c, 0, -2, 13, 10); c.fill();
    c.fillStyle = '#FFFFFF';
    rr(c, -11, 4, 22, 8, 3); c.fill();
  }
  c.fillStyle = '#3A2450';
  ell(c, -4, -1, 1.6); c.fill();
  ell(c, 4, -1, 1.6); c.fill();
  c.restore();
}
