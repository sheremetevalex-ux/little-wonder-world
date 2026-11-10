// Magic Eggs: an enchanted glade at night. She picks one of the glowing eggs,
// warms it with her finger until it knocks back from inside, taps until light
// leaks through the cracks and two little eyes peek out, and then a magical baby
// hatches wearing its shell as a hat. Babies live in the glade: feed them magic
// berries and they transform, twice, into their grown-up shapes.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rand, pick, dist, clamp, lerp, TAU, softStar } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lathe, lighten, darken, starShape, skyTexture } from '../core/stage.js';
import { Critter, SPECIES, wear } from '../art/critter3d.js';
import { eggShape, eggTex } from '../art/worldtoys.js';

// six kinds of egg, each with its own family of magical babies
const EGGS = [
  { id: 'dragon', base: '#9C8CFF', dot: '#FFD45C', band: '#FF9FD0', glow: '#C9A8FF', pets: [['babyDragon', null], ['dragon', null]], grow: ['crown', 'sparkles'] },
  { id: 'crystal', base: '#9FE3FF', dot: '#FFFFFF', band: '#C7F3FF', glow: '#BFF4FF', crystal: true, pets: [['slimey', { body: '#9FE3FF', belly: '#E6FBFF' }], ['turtle', { body: '#A8E8FF', belly: '#FFFFFF', shell: '#6FC4FF' }]], grow: ['halo', 'crown'] },
  { id: 'cloud', base: '#F4F8FF', dot: '#FFC4E0', band: '#C9E6FF', glow: '#FFFFFF', pets: [['cloud', null], ['foal', null]], grow: ['halo', 'star'] },
  { id: 'flower', base: '#FFC2DA', dot: '#FFFFFF', band: '#B8F0A8', glow: '#FFB0D8', pets: [['axolotl', null], ['bunny', { body: '#FFD1E6', belly: '#FFF3F8' }]], grow: ['flower', 'crown'] },
  { id: 'star', base: '#3D3A7A', dot: '#FFE27D', band: '#6E6AC8', glow: '#FFE680', pets: [['starBunny', null], ['starlet', null]], grow: ['star', 'halo'] },
  { id: 'fire', base: '#FF9F5A', dot: '#FFE08A', band: '#FF6F8F', glow: '#FFC266', pets: [['phoenix', null], ['fox', { body: '#FF8A5C', belly: '#FFE9C8' }]], grow: ['crown', 'sparkles'] }
];

function magic() {
  return save.data.magic || (save.data.magic = { pets: [], hatched: 0 });
}

// ---- eggs -------------------------------------------------------------------------
let crystalG = null;
function crystalEgg() {
  if (crystalG) return crystalG;
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = 0.78 * (1 - 0.18 * (y + 1) / 2);
    p.setXYZ(i, p.getX(i) * k, y, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  crystalG = g;
  return g;
}

function eggMaterial(def) {
  if (def.crystal) return new THREE.MeshPhysicalMaterial({ color: def.base, roughness: 0.08, transmission: 0.55, thickness: 1.2, ior: 1.45, clearcoat: 1, flatShading: true, emissive: def.glow, emissiveIntensity: 0.12, envMapIntensity: 1.4 });
  return new THREE.MeshPhysicalMaterial({ map: eggTex(def.base, def.dot, def.band, def.id.length), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12, emissive: def.glow, emissiveIntensity: 0.06, sheen: 0.4, sheenColor: new THREE.Color(def.glow) });
}

function buildEgg(def) {
  const g = new THREE.Group();
  const mat = eggMaterial(def);
  const body = mesh(def.crystal ? crystalEgg() : eggShape(), mat, { p: [0, 1, 0], parent: g });
  const glow = mesh(G.sphere(24), M.glow(def.glow, { opacity: 0.0 }), { p: [0, 1, 0], s: [1.15, 1.35, 1.15], parent: g, cast: false });
  return { def, g, body, mat, glow, cracks: [], heat: 0, sq: new Spring(1, 300, 9), wob: new Spring(0, 140, 5) };
}

/** A jagged crack of light that runs around the egg */
function crackMesh(def, seed, y) {
  const pts = [];
  const a0 = seed * 2.3, span = 1.3 + (seed % 2) * 0.6;
  for (let i = 0; i <= 10; i++) {
    const a = a0 + (i / 10) * span - span / 2;
    const yy = y + (i % 2 ? 0.1 : -0.08);
    const r = 0.785 * Math.sqrt(Math.max(0, 1 - yy * yy)) * (1 - 0.18 * (yy + 1) / 2) + 0.012;
    pts.push(new THREE.Vector3(Math.sin(a) * r, yy + 1, Math.cos(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
  return mesh(new THREE.TubeGeometry(curve, 40, 0.028, 6), new THREE.MeshBasicMaterial({ color: '#FFF4B0' }), { cast: false });
}

// ---- pets ---------------------------------------------------------------------------
function petSpec(p) {
  const def = EGGS.find((e) => e.id === p.egg);
  const [sp, over] = def.pets[p.kind];
  return { ...SPECIES[sp], ...(over || {}) };
}
const STAGE_SIZE = [0.62, 0.85, 1.08];
function makePet(p) {
  const def = EGGS.find((e) => e.id === p.egg);
  const c = new Critter(petSpec(p), { key: 'magic:' + p.egg + p.kind, size: STAGE_SIZE[p.stage] });
  if (p.stage === 0) {
    // still wearing its shell as a hat
    const hat = group(c.yaw, [0, c.ry * 1.82, 0]);
    const cap = mesh(eggShape(), eggMaterial(def), { s: [1.05, 0.55, 1.05], p: [0, -0.1, 0], parent: hat, cast: false });
    cap.geometry = shellCap();
    hat.rotation.z = -0.25;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      mesh(G.cone(4), eggMaterial(def), { p: [Math.sin(a) * 0.8, -0.18, Math.cos(a) * 0.8], r: [Math.PI, 0, 0], s: [0.14, 0.2, 0.14], parent: hat, cast: false });
    }
  }
  if (p.stage >= 1) wear(c, def.grow[0], def.glow);
  if (p.stage >= 2) {
    wear(c, def.grow[1], def.glow);
    const aura = mesh(G.sphere(20), M.glow(def.glow, { opacity: 0.16 }), { p: [0, c.ry, 0], s: 1.5, parent: c.yaw, cast: false });
    c.aura = aura;
    if (!c.sp.wings && !c.sp.wingsPeg && !c.sp.wingsSmall) {
      // grown-ups get little fairy wings
      c.wings = [];
      const wm = M.glossy('#FFFFFF', { transparent: true, opacity: 0.6, depthWrite: false, emissive: def.glow, emissiveIntensity: 0.3 });
      for (const s of [-1, 1]) {
        const piv = group(c.yaw, [s * 0.35, c.ry * 1.25, -0.6]);
        mesh(G.sphere(16), wm, { p: [s * 0.35, 0.2, 0], r: [0, 0, s * 0.5], s: [0.42, 0.26, 0.04], parent: piv, cast: false });
        piv.userData.side = s;
        c.wings.push(piv);
      }
    }
  }
  c.pet = p;
  return c;
}
let capG = null;
function shellCap() {
  if (capG) return capG;
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, a = Math.PI * 0.15 + u * Math.PI * 0.35;
    const y = Math.sin(a), r = Math.cos(a) * (1 - 0.18 * (y + 1) / 2) * 0.78;
    pts.push(new THREE.Vector2(Math.max(0.001, r), y - 0.45));
  }
  capG = lathe(pts, 32);
  return capG;
}

// ---- scene -----------------------------------------------------------------------------
export const eggs = {
  tint: '#2D2770',

  enter() {
    this.t = 0;
    this.m = magic();
    const st = this.stage = new Stage({
      bg: [[0, '#151244'], [0.55, '#2D2770'], [1, '#5A3F9E']], fov: 34, hemi: 0.5, sky: '#8C9CFF', ground: '#3A2A70', key: 1.5, keyColor: '#C9D2FF',
      keyPos: [-4, 10, 6], rim: 1.6, rimColor: '#FF9FE0', env: 0.55, shadowArea: 10
    });
    st.scene.fog = new THREE.Fog('#2D2770', 30, 70);
    this.world = group(st.scene);
    this.buildGlade();
    this.pets = [];
    this.layout();
    for (const p of this.m.pets.slice(-8)) this.addPet(p);
    this.egg = null;
    this.choices = [];
    this.state = 'garden';
    this.berries = [];
    this.makeBerries();
    st.snap(this.poseGarden);
    this.buttons = [this.eggButton()];
    music.play('eggs');
    if (!this.m.pets.length) wait(0.6, () => this.showChoices());
    this.setHint();
  },

  exit() {
    for (const p of this.pets) p.c.dispose();
    this.stage.dispose();
  },

  buildGlade() {
    const W = this.world;
    const gg = new THREE.CircleGeometry(30, 64);
    gg.rotateX(-Math.PI / 2);
    mesh(gg, new THREE.MeshStandardMaterial({ color: '#3F7F7A', roughness: 1 }), { receive: true, cast: false, parent: W });
    // a soft path of light to the nest
    mesh(G.circle(48), new THREE.MeshBasicMaterial({ color: '#7FD6C8', transparent: true, opacity: 0.12, depthWrite: false }), { p: [0, 0.02, -1], r: [-Math.PI / 2, 0, 0], s: 6, parent: W, cast: false });
    // little glowing flowers all over the grass
    const fl = new THREE.InstancedMesh(G.sphere(8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), 140);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pp = new THREE.Vector3(), cc = new THREE.Color();
    for (let i = 0; i < 140; i++) {
      const a = rand(TAU), r = rand(3, 16);
      pp.set(Math.cos(a) * r * 1.3, 0.06, Math.sin(a) * r * 0.8 - 2);
      sc.setScalar(rand(0.05, 0.11));
      m4.compose(pp, q, sc);
      fl.setMatrixAt(i, m4);
      fl.setColorAt(i, cc.set(pick(['#FFB0E8', '#9FF0FF', '#FFF2A8', '#C9B0FF'])));
    }
    W.add(fl);
    // grass tufts
    for (let i = 0; i < 40; i++) {
      const a = rand(TAU), r = rand(4, 14);
      const tg = group(W, [Math.cos(a) * r * 1.3, 0, Math.sin(a) * r * 0.7 - 1]);
      for (let k = 0; k < 3; k++) mesh(G.cone(6), M.toy('#4FA08A', { roughness: 0.9 }), { p: [(k - 1) * 0.08, 0.12, 0], r: [0, 0, (k - 1) * 0.3], s: [0.05, 0.3, 0.05], parent: tg, cast: false });
    }
    // dark magic trees around
    this.trees = [];
    const tc = ['#5E4FB8', '#4A3E9E', '#7A5FD0', '#3D6FA8'];
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * 0.12 + (i / 13) * Math.PI * 0.76;
      const r = rand(19, 27);
      const tg = group(W, [Math.cos(a) * r * 1.25, 0, -Math.sin(a) * r - 2]);
      const s = rand(1.8, 3);
      mesh(G.cyl(10), M.toy('#3A2A5E'), { p: [0, s * 0.7, 0], s: [0.3 * s, s * 1.4, 0.3 * s], parent: tg });
      mesh(G.sphere(20), M.toy(pick(tc), { roughness: 0.6 }), { p: [0, s * 1.8, 0], s: [s * 1.1, s, s * 1.1], parent: tg });
      tg.userData = { sq: new Spring(1, 200, 6), ph: rand(TAU) };
      this.trees.push(tg);
    }
    // glowing mushrooms that ring like bells
    this.shrooms = [];
    const mc = ['#FF8FE0', '#8FE8FF', '#FFE27D', '#B48BFF', '#7FFFC8'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.3;
      const r = i % 2 ? 6.2 : 7.4;
      const x = Math.cos(a) * r * 1.15, z = Math.sin(a) * r * 0.6 - 0.5;
      if (z > 2.5) continue;
      const g = group(W, [x, 0, z]);
      const col = mc[i % mc.length];
      const s = rand(0.6, 1);
      mesh(G.cyl(12, 0.8), M.toy('#FFF4E8'), { p: [0, 0.4 * s, 0], s: [0.16 * s, 0.8 * s, 0.16 * s], parent: g });
      const cap = mesh(G.sphere(24), M.toy(col, { emissive: col, emissiveIntensity: 0.55 }), { p: [0, 0.85 * s, 0], s: [0.55 * s, 0.34 * s, 0.55 * s], parent: g });
      for (let k = 0; k < 4; k++) mesh(G.sphere(8), M.basic('#FFFFFF'), { p: [Math.cos(k * 1.6) * 0.3 * s, 1.08 * s, Math.sin(k * 1.6) * 0.3 * s], s: 0.06 * s, parent: g, cast: false });
      const light = mesh(G.sphere(12), M.glow(col, { opacity: 0.1 }), { p: [0, 0.8 * s, 0], s: 0.8 * s, parent: g, cast: false });
      g.userData = { sq: new Spring(1, 260, 8), note: this.shrooms.length, cap, light };
      this.shrooms.push(g);
    }
    // the nest on a mossy stump
    this.nest = group(W, [0, 0, -1.2]);
    mesh(G.cyl(32, 0.92), M.toy('#8A6A9E', { roughness: 0.8 }), { p: [0, 0.4, 0], s: [1.6, 0.8, 1.6], parent: this.nest, receive: true });
    mesh(G.cyl(32), M.toy('#6FCB8A', { roughness: 0.9 }), { p: [0, 0.82, 0], s: [1.5, 0.08, 1.5], parent: this.nest, receive: true });
    for (let i = 0; i < 3; i++) mesh(G.torus(0.3, TAU, 32), M.toy('#D9B27C', { roughness: 0.85 }), { p: [0, 0.95 + i * 0.13, 0], r: [Math.PI / 2, 0, i], s: [1.05 - i * 0.05, 1.05 - i * 0.05, 0.7], parent: this.nest });
    // the berry bush
    this.bush = group(W, [-4.6, 0, 1.6]);
    for (let i = 0; i < 5; i++) mesh(G.sphere(20), M.toy(i % 2 ? '#3F9E7A' : '#4FB88A', { roughness: 0.7 }), { p: [Math.cos(i * 1.3) * 0.7, 0.75 + (i % 2) * 0.35, Math.sin(i * 1.3) * 0.4], s: 0.75, parent: this.bush });
    this.bushSq = new Spring(1, 220, 7);
    // sky: moon, stars, fireflies
    this.moon = group(W, [9, 14, -28]);
    mesh(G.sphere(32), new THREE.MeshBasicMaterial({ color: '#FFF4C8', fog: false }), { s: 2.4, parent: this.moon, cast: false });
    mesh(G.sphere(24), M.glow('#FFF0B0', { opacity: 0.18, fog: false }), { s: 4.4, parent: this.moon, cast: false });
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(900);
    for (let i = 0; i < 300; i++) { const a = rand(-1.2, 1.2); sp[i * 3] = Math.sin(a) * 45; sp[i * 3 + 1] = rand(6, 40); sp[i * 3 + 2] = -Math.cos(a) * 45; }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    W.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#FFF6C8', size: 0.35, transparent: true, opacity: 0.9, fog: false })));
    this.flies = [];
    for (let i = 0; i < 16; i++) {
      const f = mesh(G.sphere(8), M.glow(pick(['#FFF2A8', '#BDF0FF', '#FFC4E8']), { opacity: 1 }), { s: 0.07, parent: W, cast: false });
      f.userData = { base: V(rand(-8, 8), rand(0.5, 3.5), rand(-7, 3)), ph: rand(TAU), sp: rand(0.4, 1) };
      this.flies.push(f);
    }
    // lights: a soft magic glow from the nest
    this.nestLight = new THREE.PointLight('#FFC9F0', 6, 8, 1.6);
    this.nestLight.position.set(0, 2.4, -0.4);
    W.add(this.nestLight);
  },

  layout() {
    const wide = app.W > app.H;
    const st = this.stage;
    this.poseGarden = st.pose(V(0, 2.0, -0.6), wide ? 15 : 9.5, wide ? 8.4 : 12, [0, 0.3, 1]);
    this.poseNest = st.pose(V(0, 2.1, -1.2), wide ? 6.6 : 4.6, wide ? 4.6 : 6.4, [0, 0.28, 1]);
    this.bush.position.x = wide ? -5.2 : -3.0;
    this.bush.position.z = wide ? 1.6 : 2.2;
    this.roamX = wide ? 6 : 3.3;
    st.shadowArea(10, V(0, 0, 0));
  },
  resize() {
    this.layout();
    this.stage.snap(this.state === 'garden' || this.state === 'pick' ? this.poseGarden : this.poseNest);
    this.buttons[0].place();
  },

  eggButton() {
    const b = new Btn({
      r: 28, slop: 10,
      place() { b.x = app.W - 44; b.y = Math.max(app.safeTop, 10) + 34; },
      paint: (c, r) => {
        candy(c, r, '#8C68F2');
        c.save();
        c.fillStyle = '#FFE9F6';
        c.beginPath();
        c.ellipse(0, 1, 11, 14, 0, 0, TAU);
        c.fill();
        c.fillStyle = '#FFC233';
        softStar(c, 0, 2, 6, 5, 0.5);
        c.fill();
        c.restore();
      },
      tap: () => { if (this.state === 'garden') this.showChoices(); }
    });
    b.place();
    return b;
  },

  setHint() {
    hint.clear();
    const st = this.stage;
    if (this.state === 'pick' && this.choices.length) {
      const s = st.objScreen(this.choices[1].body);
      hint.set({ from: [s.x, s.y], delay: 1.5 });
    } else if (this.state === 'warm') {
      const s = st.objScreen(this.egg.body);
      hint.set({ from: [s.x - 50, s.y], to: [s.x + 50, s.y + 10], delay: 1.5 });
    } else if (this.state === 'crack') {
      const s = st.objScreen(this.egg.body);
      hint.set({ from: [s.x, s.y], delay: 2 });
    } else if (this.state === 'garden' && this.pets.length && !this.m.fedOnce) {
      const b = st.objScreen(this.berries[0] ? this.berries[0].m : this.bush);
      const p = st.objScreen(this.pets[this.pets.length - 1].c.body);
      hint.set({ from: [b.x, b.y], to: [p.x, p.y], delay: 3 });
    }
  },

  // ---- choosing an egg ------------------------------------------------------------
  showChoices() {
    if (this.state !== 'garden') return;
    this.state = 'pick';
    audio.sfx('magic', { vol: 0.5 });
    // prefer kinds with babies she has not met yet
    const met = new Set(this.m.pets.map((p) => p.egg + p.kind));
    const order = [...EGGS].sort((a, b) => {
      const fa = a.pets.filter((_, k) => !met.has(a.id + k)).length, fb = b.pets.filter((_, k) => !met.has(b.id + k)).length;
      return fb - fa + (Math.random() - 0.5) * 1.5;
    }).slice(0, 3);
    this.choices = order.map((def, i) => {
      const e = buildEgg(def);
      e.home = V((i - 1) * (app.W > app.H ? 2.9 : 1.9), 1.7, 1.4);
      e.g.position.copy(e.home).add(V(0, -3, 0));
      e.g.scale.setScalar(0.01);
      e.ph = i * 2;
      this.world.add(e.g);
      tween(e.g.scale, { x: 0.9, y: 0.9, z: 0.9 }, 0.6, { ease: E.back, delay: i * 0.15 });
      tween(e.g.position, { y: e.home.y }, 0.8, { ease: E.out, delay: i * 0.15 });
      wait(i * 0.15, () => audio.note('harp', penta(5 + i * 2), { vol: 0.5 }));
      return e;
    });
    wait(1.1, () => this.setHint());
  },

  chooseEgg(e) {
    this.state = 'moving';
    hint.clear();
    audio.sfx('wee', { vol: 0.3 });
    audio.sparkle(3, 4);
    for (const o of this.choices) {
      if (o === e) continue;
      tween(o.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.4, { ease: E.in, done: () => this.world.remove(o.g) });
    }
    this.choices = [];
    this.egg = e;
    const to = this.nest.position.clone().add(V(0, 0.95, 0));
    tween(e.g.position, { x: to.x, y: to.y, z: to.z }, 0.9, { ease: E.io });
    tween(e.g.scale, { x: 1, y: 1, z: 1 }, 0.9, { ease: E.io, done: () => {
      e.sq.kick(-5);
      audio.sfx('land');
      this.state = 'warm';
      this.setHint();
    } });
    this.camGoal = 'nest';
  },

  // ---- warming, cracking, hatching -------------------------------------------------------
  warm(amount) {
    const e = this.egg;
    e.heat = Math.min(1, e.heat + amount);
    e.mat.emissiveIntensity = 0.06 + e.heat * 0.5;
    e.glow.material.opacity = e.heat * 0.35;
    if (e.heat > (e.nextKnock || 0.33)) {
      // something inside knocks back!
      e.nextKnock = (e.nextKnock || 0.33) + 0.33;
      wait(0.25, () => {
        e.sq.kick(-7);
        e.wob.kick(rand(-6, 6));
        audio.sfx('knock', { vol: 0.9 });
        const s = this.stage.objScreen(e.body);
        fx.sparkle(s.x, s.y, 8);
        haptic();
      });
    }
    if (e.heat >= 1) {
      this.state = 'crack';
      e.taps = 0;
      audio.sfx('magic', { vol: 0.6 });
      this.setHint();
    }
  },

  tapEgg() {
    const e = this.egg;
    e.taps++;
    e.sq.kick(-6);
    e.wob.kick(rand(-8, 8));
    audio.sfx('crack', { vol: 0.7 + e.taps * 0.1 });
    audio.note('bell', penta(4 + e.taps * 2), { vol: 0.4 });
    haptic();
    const cr = crackMesh(e.def, e.taps, 0.15 + (e.taps % 2) * 0.2 - 0.1);
    e.body.add(cr);
    cr.position.y = -1;
    e.cracks.push(cr);
    const s = this.stage.objScreen(e.body);
    fx.burst(s.x, s.y, { kind: 'sparkle', n: 10, colors: ['#FFF4B0', '#FFFFFF', e.def.glow], speed: 220, size: 16, g: 100, life: 0.7 });
    if (e.taps === 2) {
      // little eyes peek through the crack and blink at her
      const peek = group(e.g, [0.05, 1.15, 0.76]);
      mesh(G.sphere(16), M.basic('#1A1030'), { s: [0.32, 0.17, 0.05], parent: peek, cast: false });
      for (const k of [-1, 1]) {
        const ey = mesh(G.sphere(12), M.glossy('#2B1D48'), { p: [k * 0.1, 0, 0.04], s: [0.055, 0.07, 0.03], parent: peek, cast: false });
        mesh(G.sphere(8), M.basic('#FFFFFF'), { p: [-0.3, 0.4, 0.8], s: 0.35, parent: ey, cast: false });
      }
      peek.scale.setScalar(0.01);
      tween(peek.scale, { x: 1, y: 1, z: 1 }, 0.3, { ease: E.back, delay: 0.2 });
      e.peek = peek;
      wait(0.4, () => audio.voice('hmm', 1.3, 0.5));
    }
    if (e.taps >= 4) this.hatch();
  },

  hatch() {
    const e = this.egg;
    this.state = 'hatching';
    hint.clear();
    const st = this.stage;
    const s = st.objScreen(e.body);
    audio.sfx('shell');
    audio.sfx('pop', { rate: 0.8 });
    audio.fanfare();
    fx.burst(s.x, s.y, { kind: 'star', n: 26, colors: [P.sun, P.butter, '#FFFFFF', e.def.glow], speed: 420, size: 22, g: 260, life: 1.2 });
    fx.confetti(app.W, app.H, 60);
    haptic();
    // the shell breaks apart
    const pieces = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const piece = mesh(G.sphere(8, 0), e.mat, { p: [e.g.position.x + Math.sin(a) * 0.5, e.g.position.y + 1 + rand(-0.3, 0.4), e.g.position.z + Math.cos(a) * 0.5], s: [0.22, 0.26, 0.06], parent: this.world, cast: false });
      piece.geometry = new THREE.IcosahedronGeometry(1, 0);
      pieces.push({ m: piece, v: V(Math.sin(a) * rand(2, 4), rand(3, 6), Math.cos(a) * rand(2, 4) + 1), spin: V(rand(-8, 8), rand(-8, 8), 0), age: 0 });
    }
    this.pieces = pieces;
    this.world.remove(e.g);
    // who hatches? a baby she has not met yet from this family, if there is one
    const met = new Set(this.m.pets.map((p) => p.egg + p.kind));
    const kinds = [0, 1].filter((k) => !met.has(e.def.id + k));
    const kind = kinds.length ? pick(kinds) : pick([0, 1]);
    const p = { egg: e.def.id, kind, stage: 0, fed: 0, born: Date.now() };
    this.m.pets.push(p);
    this.m.hatched++;
    if (this.m.pets.length > 24) this.m.pets.shift();
    save.touch();
    save.earnStar();
    const pet = this.addPet(p, true);
    pet.c.root.position.copy(this.nest.position).add(V(0, 0.95, 0));
    pet.hold = true;
    pet.c.setMood('wow', 1.4);
    pet.c.root.scale.setScalar(0.01);
    tween(pet.c.root.scale, { x: STAGE_SIZE[0] * 1.4, y: STAGE_SIZE[0] * 1.4, z: STAGE_SIZE[0] * 1.4 }, 0.6, { ease: E.back });
    wait(0.3, () => { pet.c.hop(6); pet.c.say('yay', 0.8); });
    wait(1.4, () => { pet.c.setMood('happy', 1.2); pet.c.say('giggle', 0.7); pet.c.wave(); });
    this.egg = null;
    this.newborn = pet;
    wait(3.4, () => this.releaseNewborn());
  },

  releaseNewborn() {
    const pet = this.newborn;
    if (!pet) return;
    this.newborn = null;
    pet.hold = false;
    tween(pet.c.root.scale, { x: STAGE_SIZE[0], y: STAGE_SIZE[0], z: STAGE_SIZE[0] }, 0.5, { ease: E.out });
    const from = pet.c.root.position.clone();
    const [x, z] = this.spot();
    pet.jump = { from, to: V(x, 0, z), u: 0 };
    tween(pet.jump, { u: 1 }, 0.8, { ease: (u) => u, done: () => { pet.jump = null; pet.c.poke(); audio.sfx('land'); } });
    audio.sfx('jump2');
    this.camGoal = 'garden';
    this.state = 'garden';
    this.makeBerries();
    wait(1, () => this.setHint());
  },

  spot() {
    return [rand(-this.roamX, this.roamX), rand(0.4, 3.2)];
  },

  addPet(p, fresh = false) {
    const c = makePet(p);
    const [x, z] = this.spot();
    c.root.position.set(x, 0, z);
    this.world.add(c.root);
    const pet = { p, c, tx: x, tz: z, idle: rand(1, 4), walk: 0 };
    this.pets.push(pet);
    while (this.pets.length > 8) {
      const old = this.pets.shift();
      this.world.remove(old.c.root);
      old.c.dispose();
    }
    return pet;
  },

  // ---- berries and growing up ------------------------------------------------------------
  makeBerries() {
    for (const b of this.berries) if (!b.held) this.bush.remove(b.m);
    this.berries = this.berries.filter((b) => b.held);
    const cols = ['#FF5C8F', '#B48BFF', '#5FD0FF', '#FFC233'];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const m = mesh(G.sphere(16), M.glossy(cols[i % 4], { emissive: cols[i % 4], emissiveIntensity: 0.35 }), { p: [Math.cos(a) * 0.95, 0.9 + Math.sin(i * 2.1) * 0.35, Math.sin(a) * 0.5 + 0.35], s: 0.2, parent: this.bush, cast: false });
      this.berries.push({ m, col: cols[i % 4], home: m.position.clone() });
    }
  },

  feed(pet, berry) {
    const c = pet.c, p = pet.p;
    this.m.fedOnce = 1;
    c.setMood('eat', 1.1);
    c.say('mmm', 0.6);
    audio.sfx('chew', { vol: 0.6 });
    wait(0.45, () => audio.sfx('gulp', { vol: 0.6 }));
    const s = this.stage.objScreen(c.body);
    fx.hearts(s.x, s.y - 20, 5);
    haptic();
    p.fed++;
    save.touch();
    wait(1.2, () => { c.setMood('happy', 1); c.hop(4); });
    if (p.stage < 2 && p.fed >= 3) {
      p.fed = 0;
      wait(1.4, () => this.evolve(pet));
    }
  },

  evolve(pet) {
    const p = pet.p;
    this.state = 'evolving';
    this.evolving = pet;
    hint.clear();
    const st = this.stage;
    const c = pet.c;
    audio.sfx('magic', { vol: 0.8 });
    audio.voice('ooh', c.voicePitch, 0.6);
    // spin up in a whirl of light...
    const o = { k: 0 };
    tween(o, { k: 1 }, 1.3, { ease: E.in, done: () => {
      p.stage++;
      save.touch();
      save.earnStar();
      const pos = c.root.position.clone();
      this.world.remove(c.root);
      c.dispose();
      const nc = makePet(p);
      nc.root.position.copy(pos);
      this.world.add(nc.root);
      pet.c = nc;
      const sc = st.objScreen(nc.body);
      fx.burst(sc.x, sc.y, { kind: 'star', n: 30, colors: [P.sun, P.butter, '#FFFFFF', '#FFC4E8'], speed: 460, size: 24, g: 200, life: 1.3 });
      fx.confetti(app.W, app.H, 70);
      audio.fanfare();
      nc.setMood('wow', 1.2);
      nc.hop(7);
      nc.root.scale.setScalar(STAGE_SIZE[p.stage] * 1.35);
      tween(nc.root.scale, { x: STAGE_SIZE[p.stage], y: STAGE_SIZE[p.stage], z: STAGE_SIZE[p.stage] }, 0.8, { ease: E.elastic });
      wait(0.5, () => { nc.say('yay', 0.8); nc.wave(); });
      wait(1.6, () => { this.state = 'garden'; this.evolving = null; this.setHint(); });
      this.whirl = null;
    } });
    this.whirl = { pet, o };
  },

  // ---- frame ----------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    const goal = this.camGoal === 'nest' || ['warm', 'crack', 'hatching', 'moving'].includes(this.state) ? this.poseNest : this.poseGarden;
    if (this.state === 'garden') this.camGoal = null;
    st.glide(goal, dt, 2.8);

    for (const f of this.flies) {
      const u = f.userData;
      u.ph += dt * u.sp;
      f.position.set(u.base.x + Math.sin(u.ph * 0.9) * 1.6, u.base.y + Math.sin(u.ph * 2.1) * 0.4, u.base.z + Math.cos(u.ph * 0.7) * 1.3);
      f.scale.setScalar(0.06 + 0.03 * Math.sin(u.ph * 6));
    }
    for (const s of this.shrooms) {
      const k = s.userData.sq.step(dt);
      s.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
      s.userData.light.material.opacity = 0.08 + 0.04 * Math.sin(t * 2 + s.userData.note) + Math.max(0, (k - 1)) * 0.6;
    }
    for (const tr of this.trees) {
      const k = tr.userData.sq.step(dt);
      tr.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k));
    }
    const bk = this.bushSq.step(dt);
    this.bush.scale.set(1 / Math.sqrt(bk), bk, 1 / Math.sqrt(bk));
    this.nestLight.intensity = 4 + Math.sin(t * 1.7) * 1 + (this.egg ? this.egg.heat * 6 : 0);
    for (const b of this.berries) if (!b.held) b.m.position.y = b.home.y + Math.sin(t * 2 + b.home.x) * 0.03;

    for (const e of this.choices) {
      e.g.position.y = e.home.y + Math.sin(t * 1.6 + e.ph) * 0.12;
      e.g.rotation.y = Math.sin(t * 0.8 + e.ph) * 0.4;
      e.glow.material.opacity = 0.12 + 0.08 * Math.sin(t * 3 + e.ph);
      const s = e.sq.step(dt);
      e.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
    }
    const e = this.egg;
    if (e) {
      const s = e.sq.step(dt);
      e.body.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      e.g.rotation.z = e.wob.step(dt) * 0.08 + (e.heat > 0.5 ? Math.sin(t * 18) * 0.015 * e.heat : 0);
      if (this.state === 'warm') {
        e.heat = Math.max(0, e.heat - dt * 0.03);
        e.mat.emissiveIntensity = 0.06 + e.heat * 0.5;
      }
      if (e.peek) {
        const b = (t % 3) < 0.12 ? 0.15 : 1;
        e.peek.children.forEach((ch, i) => { if (i) ch.scale.y = 0.07 * b; });
        e.peek.position.x = 0.05 + Math.sin(t * 1.3) * 0.08;
      }
      for (const c of e.cracks) c.material.color.setHSL(0.14, 1, 0.75 + Math.sin(t * 8) * 0.1);
    }
    if (this.pieces) {
      for (const pc of this.pieces) {
        pc.age += dt;
        pc.v.y -= 12 * dt;
        pc.m.position.addScaledVector(pc.v, dt);
        if (pc.m.position.y < 0.05) { pc.m.position.y = 0.05; pc.v.multiplyScalar(0.4); pc.v.y = Math.abs(pc.v.y) * 0.3; }
        pc.m.rotation.x += pc.spin.x * dt;
        pc.m.rotation.y += pc.spin.y * dt;
        if (pc.age > 2.2) pc.m.scale.multiplyScalar(1 - dt * 3);
      }
      if (this.pieces.every((pc) => pc.age > 3)) { this.pieces.forEach((pc) => this.world.remove(pc.m)); this.pieces = null; }
    }
    if (this.whirl) {
      const c = this.whirl.pet.c, k = this.whirl.o.k;
      c.root.rotation.y += dt * (2 + k * 26);
      c.root.position.y = k * 0.8;
      c.bodyMat.emissive = c.bodyMat.emissive || new THREE.Color();
      if (c.bodyMat.emissive) { c.bodyMat.emissive.set('#FFF4C0'); c.bodyMat.emissiveIntensity = k * 1.2; }
      if (Math.random() < dt * 20) { const s = st.objScreen(c.body); fx.sparkle(s.x + rand(-40, 40), s.y + rand(-40, 40), 2); }
    }
    this.updatePets(dt);
  },

  updatePets(dt) {
    const cam = this.stage.camera.position;
    for (const pet of this.pets) {
      const c = pet.c, pos = c.root.position;
      if (pet.hold || (this.whirl && this.whirl.pet === pet)) { c.look(cam); c.update(dt); continue; }
      if (pet.jump) {
        pos.lerpVectors(pet.jump.from, pet.jump.to, pet.jump.u);
        pos.y = pet.jump.from.y * (1 - pet.jump.u) + Math.sin(pet.jump.u * Math.PI) * 2;
        c.update(dt);
        continue;
      }
      if (pet.carried) {
        pos.lerp(pet.carried, Math.min(1, dt * 14));
        c.root.rotation.z = Math.sin(this.t * 6) * 0.1;
        c.look(cam);
        c.update(dt);
        continue;
      }
      if (pos.y > 0) { pet.vy = (pet.vy || 0) - 20 * dt; pos.y = Math.max(0, pos.y + pet.vy * dt); if (pos.y === 0) { c.poke(1.2); pet.vy = 0; audio.sfx('land', { vol: 0.5 }); } }
      c.root.rotation.z *= 0.9;
      const dx = pet.tx - pos.x, dz = pet.tz - pos.z, d = Math.hypot(dx, dz);
      if (d > 0.06) {
        const v = (pet.p.stage === 2 ? 1.5 : 1.1) * dt;
        pos.x += (dx / d) * Math.min(v, d);
        pos.z += (dz / d) * Math.min(v, d);
        pet.walk += dt * 10;
        c.root.rotation.y += (clamp(Math.atan2(dx, dz), -1.2, 1.2) - c.root.rotation.y) * Math.min(1, dt * 6);
        if (c.y <= 0 && Math.sin(pet.walk) > 0.95) c.hop(2.2);
      } else {
        c.root.rotation.y *= 1 - Math.min(1, dt * 3);
        pet.idle -= dt;
        if (pet.idle <= 0) {
          pet.idle = rand(2, 6);
          const r = Math.random();
          if (r < 0.5) [pet.tx, pet.tz] = this.spot();
          else if (r < 0.75) { c.hop(4); if (Math.random() < 0.35) c.say(pick(['chirp', 'mew', 'hehe', 'coo']), 0.15); }
          else c.wave();
        }
      }
      c.look(cam);
      c.update(dt);
      if (c.aura) c.aura.scale.setScalar(1.45 + Math.sin(this.t * 3) * 0.08);
    }
  },

  draw(c) {
    if (this.state === 'warm' && this.egg) {
      // a ring that fills as the egg warms up
      const s = this.stage.objScreen(this.egg.body);
      const r = 88;
      c.save();
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,.18)';
      c.beginPath(); c.arc(s.x, s.y, r, 0, TAU); c.stroke();
      c.strokeStyle = '#FFC4E0';
      c.beginPath(); c.arc(s.x, s.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * this.egg.heat); c.stroke();
      c.restore();
    }
    for (const b of this.buttons) b.draw(c);
  },

  // ---- input ------------------------------------------------------------------------
  petAt(p) {
    const hit = this.stage.pick(p.x, p.y, this.pets.map((q) => q.c.root));
    return hit ? this.pets.find((q) => q.c.root.getObjectById(hit.object.id)) : null;
  },

  down(p) {
    const st = this.stage;
    if (this.state === 'pick') {
      for (const e of this.choices) {
        const s = st.objScreen(e.body);
        if (dist(p.x, p.y, s.x, s.y) < 80) { this.chooseEgg(e); return; }
      }
      return;
    }
    if (this.state === 'warm') { p.rub = { x: p.x, y: p.y }; return; }
    if (this.state === 'crack') {
      const s = st.objScreen(this.egg.body);
      if (dist(p.x, p.y, s.x, s.y) < 130) this.tapEgg();
      return;
    }
    if (this.state === 'hatching' && this.newborn) {
      this.newborn.c.poke(); this.newborn.c.hop(5); this.newborn.c.say(pick(['giggle', 'yay', 'mew']), 0.6);
      fx.hearts(p.x, p.y, 5);
      return;
    }
    if (this.state !== 'garden') return;
    // berries
    for (const b of this.berries) {
      if (b.held) continue;
      const s = st.objScreen(b.m);
      if (dist(p.x, p.y, s.x, s.y) < 36) {
        b.held = true;
        const wp = b.m.getWorldPosition(V());
        this.bush.remove(b.m);
        this.world.add(b.m);
        b.m.position.copy(wp);
        b.m.scale.setScalar(0.28);
        p.berry = b;
        this.bushSq.kick(-3);
        audio.sfx('plip');
        return;
      }
    }
    const pet = this.petAt(p);
    if (pet) {
      p.pet = pet;
      p.t0 = this.t;
      const c = pet.c;
      c.poke();
      c.hop(5);
      c.setMood(pick(['happy', 'wow']), 1);
      c.say(pick(['giggle', 'yay', 'hehe', 'mew', 'wee']), 0.6);
      if (pet.p.egg === 'dragon' && Math.random() < 0.5) c.say('roar', 0.5);
      fx.hearts(p.x, p.y - 10, 5);
      haptic();
      return;
    }
    for (const s of this.shrooms) {
      const sc = st.objScreen(s.userData.cap);
      if (dist(p.x, p.y, sc.x, sc.y) < 46) {
        s.userData.sq.kick(5);
        audio.note('bell', penta(s.userData.note + 3), { vol: 0.55, wet: 0.9 });
        fx.sparkle(sc.x, sc.y, 6);
        p.shroom = true;
        return;
      }
    }
    const bs = st.objScreen(this.bush);
    if (dist(p.x, p.y, bs.x, bs.y - 30) < 70) { this.bushSq.kick(5); audio.sfx('swish'); if (this.berries.length < 2) this.makeBerries(); return; }
    const ht = st.pick(p.x, p.y, this.trees);
    if (ht) {
      let o = ht.object;
      while (o.parent && !this.trees.includes(o)) o = o.parent;
      o.userData.sq.kick(4);
      audio.sfx('boing', { rate: 0.7, vol: 0.5 });
      fx.burst(p.x, p.y, { kind: 'sparkle', n: 8, colors: ['#FFF2A8', '#BDF0FF', '#FFC4E8'], speed: 120, g: 60, size: 14, life: 1 });
      return;
    }
    fx.sparkle(p.x, p.y, 5);
    audio.note('glock', penta(Math.floor(rand(5, 12))), { vol: 0.25 });
  },

  move(p) {
    const st = this.stage;
    if (p.rub && this.state === 'warm' && this.egg) {
      const s = st.objScreen(this.egg.body);
      const d = Math.hypot(p.x - p.rub.x, p.y - p.rub.y);
      if (dist(p.x, p.y, s.x, s.y) < 150) {
        this.warm(d / 1400);
        if (Math.random() < 0.3) audio.sfx('scrub', { vol: 0.35 });
        if (Math.random() < 0.15) fx.sparkle(p.x, p.y, 2);
      }
      p.rub.x = p.x; p.rub.y = p.y;
      return;
    }
    if (p.berry) {
      const w = st.onPlane(p.x, p.y, 1.1);
      if (w) p.berry.m.position.copy(w);
      return;
    }
    if (p.pet && this.state === 'garden') {
      if (!p.pet.carried && Math.hypot(p.x - p.sx, p.y - p.sy) > 18) {
        p.pet.carried = V();
        p.pet.c.say('wee', 0.5);
        audio.sfx('zip', { vol: 0.4 });
      }
      if (p.pet.carried) {
        const w = st.onPlane(p.x, p.y, 1.2);
        if (w) { w.x = clamp(w.x, -this.roamX - 1, this.roamX + 1); w.z = clamp(w.z, -2, 4); p.pet.carried.copy(w); }
      }
    }
  },

  up(p) {
    if (p.berry) {
      const b = p.berry;
      // did it land on a mouth?
      let best = null, bd = 1.5;
      for (const pet of this.pets) {
        const d = pet.c.body.getWorldPosition(V()).distanceTo(b.m.position);
        if (d < bd) { bd = d; best = pet; }
      }
      this.world.remove(b.m);
      this.berries = this.berries.filter((q) => q !== b);
      if (best) this.feed(best, b);
      else { audio.sfx('blup'); const s = this.stage.toScreen(b.m.position); fx.burst(s.x, s.y, { kind: 'dot', n: 8, colors: [b.col], speed: 120, size: 10, g: 300, life: 0.7 }); }
      if (!this.berries.length) wait(0.8, () => this.makeBerries());
      return;
    }
    if (p.pet && p.pet.carried) {
      const pet = p.pet;
      pet.carried = null;
      pet.tx = pet.c.root.position.x;
      pet.tz = pet.c.root.position.z;
      pet.vy = 0;
      pet.c.say('hehe', 0.4);
    }
  }
};
