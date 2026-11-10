// Bakery: a whole little story in 3D. Drag ingredients into the bowl, stir in
// circles, choose a pan, watch the cake rise behind the glowing oven door, then
// decorate it: frosting is piped right onto the top of the cake, sprinkles and
// toppers land on it for real, candles get lit. Then a party: friends arrive,
// blow out the candles, and the cake is shared, slice by slice.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, TAU, softStar, heart, mix as mixCol, light } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lighten, darken, starShape, heartShape } from '../core/stage.js';
import { Critter } from '../art/critter3d.js';
import { FRIENDS } from '../art/creatures.js';

const INGREDIENTS = [
  { id: 'egg', col: '#FFE27D', batter: null },
  { id: 'milk', col: '#FFFFFF', batter: null },
  { id: 'flour', col: '#FFF2DC', batter: null },
  { id: 'berry', col: '#FF6F91', batter: '#FF9BB8' },
  { id: 'choco', col: '#8A5230', batter: '#A6683F' },
  { id: 'blue', col: '#6F7FE8', batter: '#A99BF0' },
  { id: 'lemon', col: '#FFE24D', batter: '#FFE993' },
  { id: 'mint', col: '#7FE3B8', batter: '#ABEBCD' }
];
const FROSTS = ['#FFFFFF', '#FF8FC4', '#8A5230', '#7FD6FF', 'rainbow'];
const TOPPERS = ['strawberry', 'cherry', 'star', 'heart', 'flower', 'candy', 'friend'];
const RAINBOW = ['#FF6F91', '#FFB054', '#FFE066', '#7FD86F', '#5FB8FF', '#B48BFF'];

function cakeShape(id) {
  if (id === 'heart') return heartShape(1.25);
  if (id === 'star') return starShape(5, 1.35, 0.62, 0.22);
  const s = new THREE.Shape();
  if (id === 'flower') {
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * TAU, r = 1.05 + 0.2 * Math.cos(a * 6);
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  } else s.absarc(0, 0, 1.2, 0, TAU, false);
  return s;
}

function ingredientMesh(id) {
  const g = new THREE.Group();
  const nc = { cast: false };
  if (id === 'egg') mesh(G.sphere(20), M.glossy('#FFF3E0'), { s: [0.3, 0.38, 0.3], parent: g });
  else if (id === 'milk') {
    mesh(G.box(0.1), M.glossy('#FFFFFF'), { s: [0.4, 0.6, 0.4], parent: g });
    mesh(G.box(0.05), M.toy('#5FB8FF'), { p: [0, 0.05, 0.21], s: [0.34, 0.2, 0.02], parent: g, ...nc });
    mesh(G.cone(4), M.glossy('#FFFFFF'), { p: [0, 0.4, 0], r: [0, Math.PI / 4, 0], s: [0.3, 0.2, 0.3], parent: g, ...nc });
  } else if (id === 'flour') {
    mesh(G.box(0.2), M.plush('#FFF2DC'), { s: [0.5, 0.55, 0.32], parent: g });
    mesh(G.sphere(10), M.toy('#FFC233'), { p: [0, 0.05, 0.17], s: [0.12, 0.12, 0.02], parent: g, ...nc });
  } else if (id === 'berry') { for (let i = 0; i < 3; i++) mesh(G.sphere(14), M.glossy('#FF4F6E'), { p: [(i - 1) * 0.18, Math.abs(i - 1) * -0.05, 0], s: 0.15, parent: g }); }
  else if (id === 'choco') {
    mesh(G.box(0.06), M.toy('#8A5230'), { s: [0.55, 0.1, 0.4], parent: g });
    for (let i = 0; i < 6; i++) mesh(G.box(0.04), M.toy('#9A6240'), { p: [(i % 3 - 1) * 0.17, 0.06, (Math.floor(i / 3) - 0.5) * 0.18], s: [0.14, 0.04, 0.14], parent: g, ...nc });
  } else if (id === 'blue') { for (let i = 0; i < 5; i++) mesh(G.sphere(12), M.glossy('#6F7FE8'), { p: [Math.cos(i * 1.3) * 0.15, (i % 2) * 0.08, Math.sin(i * 1.3) * 0.12], s: 0.11, parent: g }); }
  else if (id === 'lemon') mesh(G.sphere(18), M.glossy('#FFE24D'), { s: [0.33, 0.25, 0.25], parent: g });
  else if (id === 'mint') for (const k of [-1, 1]) mesh(G.sphere(14), M.toy('#5FBF72'), { p: [k * 0.1, 0, 0], r: [0, 0, k * 0.6], s: [0.12, 0.25, 0.04], parent: g });
  return g;
}

function topperMesh(id) {
  const g = new THREE.Group();
  if (id === 'strawberry') {
    mesh(G.cone(16), M.glossy('#FF3E6C'), { p: [0, 0.18, 0], r: [Math.PI, 0, 0], s: [0.17, 0.3, 0.17], parent: g });
    mesh(G.sphere(12), M.glossy('#FF3E6C'), { p: [0, 0.28, 0], s: [0.17, 0.1, 0.17], parent: g });
    for (let i = 0; i < 4; i++) mesh(G.sphere(6), M.toy('#5FBF72'), { p: [Math.cos(i * 1.57) * 0.08, 0.36, Math.sin(i * 1.57) * 0.08], s: [0.06, 0.02, 0.04], parent: g, cast: false });
  } else if (id === 'cherry') {
    mesh(G.sphere(14), M.glossy('#E8243C'), { p: [0, 0.13, 0], s: 0.13, parent: g });
    mesh(G.capsule(1, 4), M.toy('#5FBF72'), { p: [0.04, 0.33, 0], r: [0, 0, -0.4], s: [0.012, 0.1, 0.012], parent: g, cast: false });
  } else if (id === 'star') mesh(G.puffy('cstar', starShape(5, 1, 0.5), 0.3, 0.15), M.glossy('#FFC233'), { p: [0, 0.22, 0], s: 0.16, parent: g });
  else if (id === 'heart') mesh(G.puffy('cheart', heartShape(1), 0.3, 0.15), M.glossy('#FF5C8F'), { p: [0, 0.2, 0], s: 0.16, parent: g });
  else if (id === 'flower') {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; mesh(G.sphere(10), M.toy('#FFFFFF'), { p: [Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1], s: [0.08, 0.04, 0.08], parent: g, cast: false }); }
    mesh(G.sphere(10), M.toy('#FFD45C'), { p: [0, 0.07, 0], s: 0.06, parent: g, cast: false });
  } else if (id === 'candy') mesh(G.sphere(14), M.jelly(pick(['#FF5C8F', '#7FE3A0', '#5FB8FF', '#FFE066'])), { p: [0, 0.1, 0], s: [0.13, 0.1, 0.13], parent: g });
  else if (id === 'friend') {
    const ids = save.data.friends;
    const c = new Critter(pick(ids), { size: 0.22, shadow: false });
    g.add(c.root);
    g.userData.critter = c;
  }
  return g;
}

export const cake = {
  tint: '#FFE2B0',

  enter() {
    this.t = 0;
    const st = this.stage = new Stage({ bg: '#FFE9D6', fov: 34, keyPos: [-4, 10, 7], shadowArea: 6, hemi: 0.75, sky: '#FFFFFF', ground: '#FFE1C8', env: 0.7 });
    this.world = group(st.scene);
    this.buildKitchen();
    this.layout();
    this.startMix();
    st.snap(this.pose);
    music.play('cake');
  },
  exit() {
    for (const g of this.guests || []) g.c.dispose();
    for (const tp of this.toppers || []) if (tp.userData.critter) tp.userData.critter.dispose();
    this.stage.dispose();
  },

  buildKitchen() {
    const W = this.world;
    mesh(G.box(0.2), new THREE.MeshPhysicalMaterial({ color: '#BFEFD8', roughness: 0.4, clearcoat: 0.5 }), { p: [0, -0.4, 0], s: [24, 0.8, 9], receive: true, parent: W });
    mesh(G.box(0.1), M.toy('#FFB3CF'), { p: [0, -0.85, 4.4], s: [24, 0.9, 0.3], parent: W, cast: false });
    const wall = canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#FFF3E4'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#FFD9E6';
      for (let i = 0; i < 8; i++) x.fillRect(i * 32, 0, 16, h);
    }, { repeat: true });
    wall.repeat.set(12, 4);
    mesh(G.plane(), new THREE.MeshStandardMaterial({ map: wall, roughness: 0.9 }), { p: [0, 6, -4.4], s: [60, 14, 1], receive: true, cast: false, parent: W });
    // bunting garland
    const cols = ['#FF6F91', '#FFE066', '#7FD86F', '#5FB8FF', '#B48BFF'];
    for (let i = 0; i < 18; i++) mesh(G.cone(3), M.toy(cols[i % 5]), { p: [(i - 8.5) * 1.1, 6.6 - Math.sin((i / 17) * Math.PI) * 0.6, -4.2], r: [Math.PI, 0, 0], s: [0.4, 0.6, 0.06], parent: W, cast: false });
    // the bowl
    const bowl = this.bowl = group(W, [0, 0, -0.4]);
    const prof = [new THREE.Vector2(0.001, 0), new THREE.Vector2(0.8, 0.04), new THREE.Vector2(1.45, 0.6), new THREE.Vector2(1.65, 1.35), new THREE.Vector2(1.55, 1.38), new THREE.Vector2(1.32, 0.68), new THREE.Vector2(0.7, 0.16), new THREE.Vector2(0.001, 0.14)];
    const bg = new THREE.LatheGeometry(prof, 48);
    bg.computeVertexNormals();
    mesh(bg, M.glossy('#E9F0FF', { side: THREE.DoubleSide }), { parent: bowl });
    for (let i = 0; i < 6; i++) mesh(G.puffy('bheart', heartShape(1), 0.1, 0.05), M.glossy('#FF8FC0'), { p: [Math.sin(i * 0.5 - 1.25) * 1.5, 0.75, Math.cos(i * 0.5 - 1.25) * 1.5], r: [0, i * 0.5 - 1.25, 0], s: 0.09, parent: bowl, cast: false });
    this.batterM = new THREE.MeshPhysicalMaterial({ color: '#FFE9C2', roughness: 0.35, clearcoat: 0.5 });
    this.batterMesh = mesh(G.sphere(40), this.batterM, { p: [0, 0.2, 0], s: [0.1, 0.1, 0.1], parent: bowl, cast: false });
    this.swirl = mesh(G.torus(0.06, TAU * 2, 64), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.5 }), { r: [Math.PI / 2, 0, 0], s: 0.6, parent: bowl, cast: false });
    this.swirl.visible = false;
    this.whisk = group(W);
    mesh(G.cyl(8), M.toy('#FF8FC0'), { p: [0, 1.0, 0], s: [0.08, 1.2, 0.08], parent: this.whisk });
    for (let i = 0; i < 4; i++) mesh(G.torus(0.04, TAU, 20), M.metal('#E8E8F0'), { p: [0, 0.2, 0], r: [0, (i / 4) * Math.PI, 0], s: [0.25, 0.42, 0.25], parent: this.whisk, cast: false });
    this.whisk.visible = false;
    this.bowlSq = new Spring(1, 300, 9);
    // the oven
    const ov = this.oven = group(W, [7, 0, -1.6]);
    mesh(G.box(0.3), M.toy('#FF8FB8'), { p: [0, 1.6, 0], s: [3.2, 3.2, 2.4], parent: ov });
    this.ovenWin = mesh(G.box(0.1), new THREE.MeshPhysicalMaterial({ color: '#3A2050', roughness: 0.1, clearcoat: 1, emissive: '#FF9F43', emissiveIntensity: 0 }), { p: [0, 1.4, 1.2], s: [2.2, 1.6, 0.1], parent: ov });
    for (let i = 0; i < 3; i++) mesh(G.cyl(12), M.glossy('#FFFFFF'), { p: [-0.8 + i * 0.8, 2.85, 1.22], r: [Math.PI / 2, 0, 0], s: [0.16, 0.1, 0.16], parent: ov, cast: false });
    mesh(G.capsule(1, 8), M.metal('#E8E8F0'), { p: [0, 2.35, 1.3], r: [0, 0, Math.PI / 2], s: [0.07, 0.8, 0.07], parent: ov, cast: false });
    this.ovenLight = new THREE.PointLight('#FFB060', 0, 6, 1.5);
    this.ovenLight.position.set(0, 1.4, 1.6);
    ov.add(this.ovenLight);
    // the cake stand
    const stand = this.stand = group(W, [0, 0, -0.2]);
    mesh(G.cyl(24, 0.5), M.glossy('#FFFFFF'), { p: [0, 0.35, 0], s: [0.5, 0.7, 0.5], parent: stand });
    mesh(G.puck(0.3), M.glossy('#FFFFFF'), { p: [0, 0.75, 0], s: [1.9, 0.12, 1.9], parent: stand, receive: true });
    stand.visible = false;
  },

  layout() {
    this.wide = app.W > app.H;
    this.poseBowl = this.stage.pose(V(0, 1.1, 0.6), this.wide ? 8.6 : 6, this.wide ? 6.2 : 8, [0, 0.75, 1]);
    this.poseOven = this.stage.pose(V(7, 1.6, -0.6), this.wide ? 7 : 5, this.wide ? 5 : 7, [0, 0.25, 1]);
    this.poseCake = this.stage.pose(V(0, 1.2, 0.3), this.wide ? 8 : 5.6, this.wide ? 5.6 : 8, [0, 0.85, 1]);
    this.poseParty = this.stage.pose(V(0, 1.1, 0.8), this.wide ? 10 : 7, this.wide ? 6.4 : 9.5, [0, 0.6, 1]);
    this.pose = this.step === 'oven' ? this.poseOven : this.step === 'decorate' ? this.poseCake : this.step === 'party' ? this.poseParty : this.poseBowl;
  },
  resize() { this.layout(); this.stage.snap(this.pose); this.placeUI(); },

  clearItems() {
    for (const it of this.items || []) this.world.remove(it.g);
    this.items = [];
  },

  // ---- 1: mixing --------------------------------------------------------------------
  startMix() {
    this.step = 'mix';
    this.layout();
    this.batter = '#FFE9C2';
    this.batterM.color.set(this.batter);
    this.level = 0;
    this.added = 0;
    this.stir = 0;
    this.bowl.visible = true;
    this.stand.visible = false;
    if (this.cakeG) { this.world.remove(this.cakeG); this.cakeG = null; }
    for (const g of this.guests || []) { this.world.remove(g.c.root); g.c.dispose(); }
    this.guests = [];
    this.clearItems();
    const n = INGREDIENTS.length, cols = 4;
    this.items = INGREDIENTS.map((ing, i) => {
      const g = ingredientMesh(ing.id);
      const row = Math.floor(i / cols), col = i % cols;
      const sp = this.wide ? 1.5 : 1.25;
      const home = V((col - (Math.min(cols, n) - 1) / 2) * sp + (row ? sp * 0.5 : 0), 0.4, 1.9 + row * 1.0);
      g.position.copy(home);
      g.scale.setScalar(1.45);
      this.world.add(g);
      return { ...ing, g, home, used: false };
    });
    this.buttons = [];
    if (!save.data.seen.cake) wait(0.8, () => { const a = this.stage.toScreen(this.items[0].home), b = this.stage.toScreen(V(0, 1.3, -0.4)); hint.set({ from: [a.x, a.y], to: [b.x, b.y], delay: 1.2 }); });
  },

  addIngredient(it) {
    it.used = true;
    this.world.remove(it.g);
    this.added++;
    if (it.batter) this.batter = this.added <= 1 ? it.batter : mixCol(this.batter, it.batter, 0.55);
    this.batterM.color.set(this.batter);
    this.level = Math.min(1, this.level + 0.3);
    audio.sfx('splash', { rate: rand(0.95, 1.25), vol: 0.75 });
    audio.note('marimba', penta(this.added + 1), { vol: 0.5 });
    const s = this.stage.toScreen(V(0, 1.2, -0.4));
    fx.burst(s.x, s.y, { kind: 'dot', n: 12, colors: [it.col, light(it.col, 0.4)], speed: 200, size: 8, g: 700, life: 0.6, spin: 0 });
    this.bowlSq.kick(4);
    haptic();
    save.data.seen.cake = 1;
    hint.clear();
    if (this.added === 3) {
      this.whisk.visible = true;
      this.swirl.visible = true;
      audio.sparkle(2, 3, 0.3);
      const a = this.stage.toScreen(V(0.8, 1.3, -0.4)), b = this.stage.toScreen(V(-0.8, 1.3, -0.4));
      hint.set({ from: [a.x, a.y], to: [b.x, b.y], delay: 1 });
    }
  },

  // ---- 2: choosing a pan ----------------------------------------------------------------
  startPan() {
    this.step = 'pan';
    hint.clear();
    audio.success();
    this.whisk.visible = false;
    this.swirl.visible = false;
    this.clearItems();
    const ids = ['round', 'heart', 'star', 'flower'];
    this.items = ids.map((id, i) => {
      const g = new THREE.Group();
      const sh = cakeShape(id);
      const pan = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 24 });
      pan.rotateX(-Math.PI / 2);
      mesh(pan, M.metal('#E3E6F0', { roughness: 0.3 }), { parent: g });
      const fill = new THREE.ShapeGeometry(sh, 24);
      fill.rotateX(-Math.PI / 2);
      mesh(fill, this.batterM, { p: [0, 0.37, 0], s: [0.92, 1, 0.92], parent: g, cast: false });
      g.scale.setScalar(0.5);
      const home = V((i - 1.5) * (this.wide ? 1.9 : 1.4), 0.1, 2.3);
      g.position.copy(home);
      this.world.add(g);
      return { id, g, home, sq: new Spring(1, 300, 9) };
    });
    const s = this.stage.toScreen(this.items[0].home);
    hint.set({ from: [s.x, s.y], delay: 1.4 });
  },

  choosePan(it) {
    this.shape = it.id;
    hint.clear();
    audio.sfx('pour', { rate: 0.85, vol: 1 });
    audio.note('kalimba', 76, { vol: 0.5 });
    this.clearItems();
    this.step = 'oven';
    this.bowl.visible = false;
    this.layout();
    this.buildCake(0.2);
    this.cakeG.position.set(7, 1.0, -1.0);
    this.cakeG.scale.setScalar(0.55);
    this.ovenPhase = 'bake';
    this.rise = { k: 0.2 };
    wait(0.7, () => {
      audio.sfx('thud');
      tween(this.rise, { k: 1 }, 3, { ease: E.io, done: () => {
        audio.note('bell', 84, { vol: 0.8, wet: 0.8 });
        audio.note('bell', 88, { vol: 0.5, wet: 0.8, when: audio.now + 0.18 });
        this.ovenPhase = 'ready';
        const s = this.stage.objScreen(this.ovenWin);
        hint.set({ from: [s.x, s.y], delay: 0.7 });
      } });
    });
  },

  buildCake(k) {
    if (this.cakeG) this.world.remove(this.cakeG);
    const g = this.cakeG = new THREE.Group();
    const sh = cakeShape(this.shape);
    const H = 0.9;
    const body = new THREE.ExtrudeGeometry(sh, { depth: H, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 5, curveSegments: 32 });
    body.rotateX(-Math.PI / 2);
    this.cakeBody = mesh(body, new THREE.MeshPhysicalMaterial({ color: this.batter, roughness: 0.7, sheen: 0.5, sheenColor: new THREE.Color('#FFF4E0') }), { parent: g });
    // a soft frosting cap with drips
    const cap = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 32 });
    cap.rotateX(-Math.PI / 2);
    this.capM = new THREE.MeshPhysicalMaterial({ color: '#FFF8F0', roughness: 0.35, clearcoat: 0.6 });
    mesh(cap, this.capM, { p: [0, H + 0.04, 0], s: [1.02, 1, 1.02], parent: g });
    const pts = sh.getSpacedPoints(26);
    for (let i = 0; i < pts.length - 1; i++) {
      if (i % 2) continue;
      mesh(G.capsule(1, 8), this.capM, { p: [pts[i].x * 1.06, H - 0.12 - (i % 4 ? 0.06 : 0.14), -pts[i].y * 1.06], s: [0.07, i % 4 ? 0.1 : 0.18, 0.07], parent: g, cast: false });
    }
    // the drawing surface: a texture on the top
    const cv = this.topCanvas = document.createElement('canvas');
    cv.width = cv.height = 512;
    const x = this.topCtx = cv.getContext('2d');
    x.fillStyle = '#FFF8F0';
    x.fillRect(0, 0, 512, 512);
    this.topTex = new THREE.CanvasTexture(cv);
    this.topTex.colorSpace = THREE.SRGBColorSpace;
    const top = new THREE.ShapeGeometry(sh, 40);
    const uv = top.attributes.uv, pos = top.attributes.position;
    const B = 1.6;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + B) / (2 * B), (pos.getY(i) + B) / (2 * B));
    top.rotateX(-Math.PI / 2);
    this.topMesh = mesh(top, new THREE.MeshPhysicalMaterial({ map: this.topTex, roughness: 0.4, clearcoat: 0.5 }), { p: [0, H + 0.205, 0], s: [1.03, 1, 1.03], parent: g, cast: false });
    this.topY = H + 0.21;
    this.toppers = [];
    this.candles = [];
    this.world.add(g);
    g.scale.set(1, k, 1);
  },

  // ---- 4: decorating ---------------------------------------------------------------------
  startDecorate() {
    this.step = 'decorate';
    hint.clear();
    this.layout();
    this.stand.visible = true;
    this.cakeG.scale.setScalar(1);
    tween(this.cakeG.position, { x: 0, y: 0.83, z: -0.2 }, 0.8, { ease: E.io });
    this.tool = { kind: 'frost', col: '#FF8FC4' };
    this.makeTools();
    wait(1.2, () => { const a = this.stage.toScreen(V(-0.7, 1.9, -0.4)), b = this.stage.toScreen(V(0.7, 1.9, 0.2)); hint.set({ from: [a.x, a.y], to: [b.x, b.y], delay: 1.2 }); });
  },

  makeTools() {
    const tools = [
      ...FROSTS.map((col) => ({ kind: 'frost', col })),
      { kind: 'sprinkle' },
      ...TOPPERS.map((id) => ({ kind: 'topper', id })),
      { kind: 'candle' }
    ];
    this.toolBtns = tools.map((tl) => new Btn({
      r: 23, slop: 4, tl,
      paint: (c, r) => {
        const on = this.tool.kind === tl.kind && this.tool.col === tl.col && this.tool.id === tl.id;
        candy(c, r, tl.kind === 'frost' ? (tl.col === 'rainbow' ? '#FFB0D8' : tl.col) : '#FFF3E0', on);
        drawToolIcon(c, tl, r);
        if (on) { c.strokeStyle = '#fff'; c.lineWidth = 3.5; ell(c, 0, -1, r - 2); c.stroke(); }
      },
      tap: () => { this.tool = tl; audio.sfx('tap', { rate: 1.2 }); }
    }));
    this.doneBtn = new Btn({
      r: 32, slop: 10,
      paint: (c, r) => {
        candy(c, r, '#58CC7A');
        c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(-12, 1); c.lineTo(-3, 10); c.lineTo(13, -9); c.stroke();
      },
      tap: () => this.startParty()
    });
    this.buttons = [...this.toolBtns, this.doneBtn];
    this.placeUI();
  },
  placeUI() {
    if (!this.toolBtns || this.step !== 'decorate') return;
    const n = this.toolBtns.length;
    if (this.wide) {
      const half = Math.ceil(n / 2), gy = Math.min(50, (app.H - 140) / half);
      this.toolBtns.forEach((b, i) => { b.x = i < half ? 40 : app.W - 40; b.y = 110 + (i % half) * gy; });
      this.doneBtn.x = app.W - 110; this.doneBtn.y = app.H - 60;
    } else {
      const per = Math.ceil(n / 2), gx = Math.min(48, (app.W - 20) / per);
      this.toolBtns.forEach((b, i) => { const row = Math.floor(i / per); b.x = app.W / 2 + ((i % per) - (per - 1) / 2) * gx; b.y = app.H - Math.max(app.safeBottom, 6) - 36 - (1 - row) * 52; });
      this.doneBtn.x = app.W - 44; this.doneBtn.y = Math.max(app.safeTop, 10) + 34;
    }
  },

  /** hit on the top of the cake: returns {uv, point} */
  hitTop(x, y) {
    const h = this.stage.pick(x, y, [this.topMesh], false);
    return h ? { uv: h.uv, point: h.point } : null;
  },

  decorateAt(x, y, p) {
    const t = this.tool, h = this.hitTop(x, y);
    if (!h) { p.last = null; return; }
    if (t.kind === 'frost') {
      const d = this.topCtx;
      const u = h.uv.x * 512, v = (1 - h.uv.y) * 512;
      const col = t.col === 'rainbow' ? RAINBOW[Math.floor(this.t * 5) % RAINBOW.length] : t.col;
      const last = p.last || { u, v };
      d.lineCap = 'round'; d.lineJoin = 'round';
      d.strokeStyle = darken(col, 0.12) !== undefined ? '#' + new THREE.Color(darken(col, 0.14)).getHexString() : col;
      d.lineWidth = 30;
      d.beginPath(); d.moveTo(last.u, last.v + 3); d.lineTo(u, v + 3); d.stroke();
      d.strokeStyle = col;
      d.lineWidth = 26;
      d.beginPath(); d.moveTo(last.u, last.v); d.lineTo(u, v); d.stroke();
      d.strokeStyle = 'rgba(255,255,255,.55)';
      d.lineWidth = 7;
      d.beginPath(); d.moveTo(last.u - 5, last.v - 6); d.lineTo(u - 5, v - 6); d.stroke();
      p.last = { u, v };
      this.topTex.needsUpdate = true;
      if (Math.random() < 0.3) audio.sfx('squish2', { rate: rand(1.15, 1.5), vol: 0.32, gap: 90 });
    } else if (t.kind === 'sprinkle') {
      const cols = ['#FF6F91', '#FFD84D', '#61BFFF', '#6FE3A5', '#FFFFFF', '#A985FF'];
      const local = this.cakeG.worldToLocal(h.point.clone());
      for (let i = 0; i < 4; i++) {
        const m = mesh(G.capsule(1, 6), M.glossy(pick(cols)), { p: [local.x + rand(-0.25, 0.25), this.topY + 0.02, local.z + rand(-0.25, 0.25)], r: [Math.PI / 2, 0, rand(TAU)], s: [0.025, 0.05, 0.025], parent: this.cakeG, cast: false });
        m.rotation.z = rand(TAU);
      }
      audio.sfx('plip', { rate: rand(1.2, 2), vol: 0.32, gap: 60 });
    } else if (t.kind === 'topper' || t.kind === 'candle') {
      if (p.stamped) return;
      p.stamped = true;
      const local = this.cakeG.worldToLocal(h.point.clone());
      if (t.kind === 'candle') {
        if (this.candles.length >= 8) return;
        const g = group(this.cakeG, [local.x, this.topY, local.z]);
        const col = pick(['#FF8FC4', '#7FD6FF', '#FFD45C', '#B48BFF']);
        mesh(G.cyl(12), new THREE.MeshPhysicalMaterial({ map: candleTex(col), roughness: 0.4 }), { p: [0, 0.3, 0], s: [0.06, 0.6, 0.06], parent: g });
        const flame = mesh(G.sphere(12), new THREE.MeshBasicMaterial({ color: '#FFD45C' }), { p: [0, 0.72, 0], s: [0.06, 0.11, 0.06], parent: g, cast: false });
        mesh(G.sphere(10), M.glow('#FFC233', { opacity: 0.4 }), { s: 2.2, parent: flame, cast: false });
        g.scale.setScalar(0.01);
        tween(g.scale, { x: 1, y: 1, z: 1 }, 0.3, { ease: E.back });
        this.candles.push({ g, flame, lit: true });
        audio.note('kalimba', penta(this.candles.length + 2), { vol: 0.55 });
      } else {
        const g = topperMesh(t.id);
        g.position.set(local.x, this.topY, local.z);
        g.rotation.y = rand(-0.5, 0.5);
        this.cakeG.add(g);
        g.scale.setScalar(0.01);
        tween(g.scale, { x: 1, y: 1, z: 1 }, 0.35, { ease: E.back });
        this.toppers.push(g);
        if (g.userData.critter) g.userData.critter.say('yay', 0.4);
        audio.note('marimba', penta(Math.floor(rand(0, 7))), { vol: 0.55 });
        audio.sfx('thud', { rate: 1.4, vol: 0.4 });
      }
      fx.sparkle(x, y, 6);
      haptic();
    }
  },

  // ---- 5: the party -----------------------------------------------------------------------
  startParty() {
    this.step = 'party';
    this.layout();
    this.buttons = [];
    hint.clear();
    const fr = save.data.friends;
    const others = Object.keys(FRIENDS).filter((f) => !fr.includes(f)).sort(() => Math.random() - 0.5);
    const ids = [...fr].sort(() => Math.random() - 0.5).slice(0, 3);
    while (ids.length < 3) ids.push(others.pop());
    this.guests = ids.map((id, i) => {
      const c = new Critter(id, { size: 0.8 });
      const tx = [-2.6, 2.6, -1.6][i], tz = [0.9, 0.9, -1.9][i];
      c.root.position.set(-9 - i * 1.5, 0, tz);
      this.world.add(c.root);
      const g = { c, tx, tz, arrived: false };
      wait(0.1 + i * 0.25, () => tween(c.root.position, { x: tx }, 1.0, { ease: E.out, done: () => { c.say('yay', 0.5); c.hop(4); g.arrived = true; } }));
      return g;
    });
    if (!this.candles.length) {
      this.tool = { kind: 'candle' };
      this.decorateAt(...this.centerScreen(), { });
    }
    this.lit = this.candles.length;
    this.partyPhase = 'candles';
    this.slices = 0;
    this.takePhoto();
    wait(1.5, () => { const s = this.stage.objScreen(this.candles[0].flame); hint.set({ from: [s.x, s.y], delay: 0.6 }); });
  },
  centerScreen() { const s = this.stage.toScreen(this.cakeG.localToWorld(V(0, this.topY, 0))); return [s.x, s.y]; },

  blowCandle(q) {
    q.lit = false;
    this.lit--;
    q.flame.visible = false;
    audio.sfx('flame', { vol: 1 });
    const s = this.stage.objScreen(q.flame);
    fx.burst(s.x, s.y, { kind: 'dot', n: 6, colors: ['#D9D3E8', '#FFFFFF'], speed: 40, size: 9, g: -80, life: 0.8, spin: 0 });
    haptic();
    if (this.lit <= 0) {
      audio.fanfare();
      fx.confetti(app.W, app.H, 90);
      for (const g of this.guests) { g.c.hop(6); g.c.setMood('love', 1.6); g.c.say('giggle', 0.4); }
      this.partyPhase = 'eat';
      save.earnStar();
      wait(1.6, () => { const [x, y] = this.centerScreen(); hint.set({ from: [x, y], delay: 0.5 }); });
    }
  },

  eatSlice() {
    this.slices++;
    hint.clear();
    const g = this.guests[this.slices % this.guests.length];
    // a slice flies to a friend, and the cake gets smaller
    const piece = mesh(G.box(0.08), new THREE.MeshPhysicalMaterial({ color: this.batter, roughness: 0.7 }), { s: [0.45, 0.4, 0.45], parent: this.world, cast: false });
    mesh(G.box(0.05), this.capM, { p: [0, 0.6, 0], s: [1.02, 0.25, 1.02], parent: piece, cast: false });
    piece.position.copy(this.cakeG.localToWorld(V(rand(-0.3, 0.3), this.topY * 0.5, rand(-0.3, 0.3))));
    const to = g.c.mouth.getWorldPosition(V());
    tween(piece.position, { x: to.x, y: to.y, z: to.z }, 0.5, { ease: E.io, done: () => {
      this.world.remove(piece);
      g.c.setMood('eat', 0.9);
      audio.sfx('chew', { vol: 1 });
      wait(0.2, () => audio.sfx('chew', { rate: 1.2, vol: 0.8 }));
      wait(0.7, () => { g.c.say(pick(['yum', 'mmm']), 0.6); g.c.setMood('happy', 1); });
      const s = this.stage.toScreen(to);
      fx.burst(s.x, s.y, { kind: 'dot', n: 8, colors: [this.batter, '#FFFFFF', P.pink], speed: 160, size: 7, g: 700, life: 0.6, spin: 0 });
    } });
    audio.sfx('swish', { vol: 0.5 });
    haptic();
    const k = Math.max(0.05, 1 - this.slices * 0.16);
    tween(this.cakeG.scale, { x: k, z: k }, 0.3, { ease: E.out });
    if (this.slices >= 6) {
      this.partyPhase = 'done';
      wait(1.2, () => {
        this.cakeG.visible = false;
        audio.success();
        for (const gg of this.guests) { gg.c.hop(7); gg.c.setMood('love', 2); }
        const [x, y] = this.centerScreen();
        fx.hearts(x, y, 18);
        const again = new Btn({
          r: 44, slop: 14,
          paint: (c, r) => {
            candy(c, r, P.coral);
            c.strokeStyle = '#fff'; c.lineWidth = 6.5; c.lineCap = 'round';
            c.beginPath(); c.arc(0, 0, r * 0.55, 0.5, 5.4); c.stroke();
            c.fillStyle = '#fff';
            c.beginPath(); c.moveTo(r * 0.72, -r * 0.3); c.lineTo(r * 0.34, -r * 0.42); c.lineTo(r * 0.62, 0); c.closePath(); c.fill();
          },
          tap: () => { this.cakeG.visible = true; this.startMix(); }
        });
        again.x = x; again.y = y - 20;
        this.buttons = [again];
      });
    }
  },

  takePhoto() {
    try {
      const r = this.stage;
      r.render();
      const src = document.getElementById('gl');
      const w = 240, h = 300, cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      const sw = src.width, sh = src.height, k = Math.max(w / sw, h / sh) * 1.25;
      x.drawImage(src, (w - sw * k) / 2, (h - sh * k) / 2 + h * 0.05, sw * k, sh * k);
      save.addPhoto(cv.toDataURL('image/jpeg', 0.72));
    } catch (e) {}
  },

  // ---- frame ------------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    st.glide(this.pose, dt, 3.2);
    const bs = this.bowlSq.step(dt);
    this.bowl.scale.set(1 / Math.sqrt(bs), bs, 1 / Math.sqrt(bs));
    const lv = this.level;
    this.batterMesh.visible = lv > 0;
    this.batterMesh.scale.set(0.9 + lv * 0.55, 0.12 + lv * 0.32, 0.9 + lv * 0.55);
    this.batterMesh.position.y = 0.25 + lv * 0.45;
    this.swirl.position.y = 0.3 + lv * 0.75;
    this.swirl.rotation.z = (this.stirA || 0);
    this.swirl.material.opacity = 0.6 * (1 - clamp(this.stir)) + 0.1;
    for (const it of this.items || []) {
      if (it.held) continue;
      it.g.position.lerp(it.home, Math.min(1, dt * 8));
      it.g.position.y = it.home.y + Math.sin(t * 2 + it.home.x) * 0.05;
      it.g.rotation.y = Math.sin(t * 0.7 + it.home.x) * 0.5;
      if (it.sq) { const k = it.sq.step(dt); it.g.scale.setScalar(0.5 * k); }
    }
    if (this.step === 'oven') {
      const k = this.rise ? this.rise.k : 0.2;
      this.cakeG.scale.set(0.55, 0.55 * k, 0.55);
      const glow = this.ovenPhase === 'bake' ? 0.7 + Math.sin(t * 4) * 0.1 : 0.2;
      this.ovenWin.material.emissiveIntensity = glow;
      this.ovenLight.intensity = glow * 8;
    } else { this.ovenWin.material.emissiveIntensity = 0; this.ovenLight.intensity = 0; }
    for (const q of this.candles || []) if (q.lit) { q.flame.scale.set(0.06 + Math.sin(t * 20 + q.g.position.x * 9) * 0.008, 0.11 + Math.sin(t * 13) * 0.015, 0.06); }
    for (const tp of this.toppers || []) if (tp.userData.critter) { tp.userData.critter.look(st.camera.position); tp.userData.critter.update(dt); }
    for (const g of this.guests || []) {
      if (this.cakeG) g.c.look(this.cakeG.localToWorld(V(0, this.topY, 0)));
      g.c.update(dt);
    }
  },

  draw(c) {
    if (this.step === 'mix' && this.added >= 3) {
      // a ring that fills while she stirs
      const s = this.stage.toScreen(V(0, 1.7, -0.4));
      c.save();
      c.lineWidth = 8; c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(s.x, s.y - 110, 18, 0, TAU); c.stroke();
      c.strokeStyle = P.rose;
      c.beginPath(); c.arc(s.x, s.y - 110, 18, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(this.stir)); c.stroke();
      c.restore();
    }
    for (const b of this.buttons) b.draw(c);
  },

  // ---- input ------------------------------------------------------------------------------
  down(p) {
    const st = this.stage;
    if (this.step === 'mix') {
      if (this.added >= 3) { p.stir = true; p.lastA = null; return; }
      for (const it of this.items) {
        const s = st.toScreen(it.g.position);
        if (!it.used && dist(p.x, p.y, s.x, s.y) < 44) { it.held = true; p.item = it; audio.sfx('tap'); return; }
      }
    } else if (this.step === 'pan') {
      for (const it of this.items) {
        const s = st.toScreen(it.g.position);
        if (dist(p.x, p.y, s.x, s.y) < 60) { this.choosePan(it); return; }
      }
    } else if (this.step === 'oven') {
      if (this.ovenPhase === 'ready') {
        this.ovenPhase = 'out';
        hint.clear();
        audio.sfx('lid');
        audio.sfx('steam', { vol: 0.6 });
        this.startDecorate();
      }
    } else if (this.step === 'decorate') {
      this.decorateAt(p.x, p.y, p);
    } else if (this.step === 'party') {
      if (this.partyPhase === 'candles') {
        for (const q of this.candles) {
          if (!q.lit) continue;
          const s = st.objScreen(q.flame);
          if (dist(p.x, p.y, s.x, s.y) < 40) { this.blowCandle(q); return; }
        }
      } else if (this.partyPhase === 'eat') {
        const [x, y] = this.centerScreen();
        if (dist(p.x, p.y, x, y) < 150) { this.eatSlice(); return; }
      }
      const hit = st.pick(p.x, p.y, this.guests.map((g) => g.c.root));
      if (hit) { const g = this.guests.find((q) => q.c.root.getObjectById(hit.object.id)); if (g) { g.c.hop(5); g.c.say(pick(['giggle', 'yay', 'hehe']), 0.5); fx.hearts(p.x, p.y, 4); } }
    }
  },

  move(p) {
    const st = this.stage;
    if (p.item) {
      const w = st.onFacing(p.x, p.y, V(0, 1.2, 0.6));
      if (w) p.item.g.position.copy(w);
      return;
    }
    if (p.stir) {
      const s = st.toScreen(V(0, 1.2, -0.4));
      const a = Math.atan2(p.y - s.y, p.x - s.x);
      if (p.lastA !== null) {
        let d = a - p.lastA;
        if (d > Math.PI) d -= TAU;
        if (d < -Math.PI) d += TAU;
        this.stirA = (this.stirA || 0) + d;
        this.stir += Math.abs(d) / (TAU * 3);
        if (Math.random() < 0.25) audio.sfx('squish', { rate: rand(1, 1.3), vol: 0.35, gap: 80 });
        if (this.stir >= 1 && this.step === 'mix') this.startPan();
      }
      p.lastA = a;
      const w = st.onPlane(p.x, p.y, 1.0);
      if (w) this.whisk.position.set(clamp(w.x, -1, 1), 0.4, clamp(w.z, -1.3, 0.5));
      return;
    }
    if (this.step === 'decorate') this.decorateAt(p.x, p.y, p);
  },

  up(p) {
    if (p.item) {
      const it = p.item;
      it.held = false;
      const s = this.stage.toScreen(V(0, 1.2, -0.4)), g = this.stage.toScreen(it.g.position);
      if (dist(s.x, s.y, g.x, g.y) < 130) this.addIngredient(it);
    }
  }
};

const candleTexCache = new Map();
function candleTex(col) {
  if (candleTexCache.has(col)) return candleTexCache.get(col);
  const t = canvasTex(64, 128, (x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    x.fillStyle = col;
    for (let i = -2; i < 8; i++) { x.save(); x.translate(0, i * 20); x.transform(1, 0.5, 0, 1, 0, 0); x.fillRect(0, 0, w, 9); x.restore(); }
  });
  candleTexCache.set(col, t);
  return t;
}

function drawToolIcon(c, tl, r) {
  if (tl.kind === 'frost') {
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.moveTo(-6, -10); c.lineTo(6, -10); c.lineTo(2, 8); c.lineTo(-2, 8); c.closePath(); c.fill();
    if (tl.col === 'rainbow') RAINBOW.forEach((col, i) => { c.fillStyle = col; c.fillRect(-7 + i * 2.4, 6, 2.4, 4); });
    return;
  }
  if (tl.kind === 'sprinkle') { ['#FF5C8F', '#FFC233', '#5698FF', '#7FD86F', '#B48BFF'].forEach((col, i) => { c.save(); c.translate(Math.cos(i * 1.3) * 7, Math.sin(i * 1.9) * 6); c.rotate(i); c.fillStyle = col; rr(c, -1.8, -5, 3.6, 10, 1.8); c.fill(); c.restore(); }); return; }
  if (tl.kind === 'candle') { c.fillStyle = '#FF8FC4'; rr(c, -3, -4, 6, 16, 2); c.fill(); c.fillStyle = '#FFC233'; ell(c, 0, -9, 3.5, 5); c.fill(); return; }
  const id = tl.id;
  if (id === 'strawberry' || id === 'cherry') { c.fillStyle = '#FF3E6C'; ell(c, 0, 2, 9, 9); c.fill(); c.fillStyle = '#5FBF72'; ell(c, 0, -8, 6, 3); c.fill(); }
  else if (id === 'star') { softStar(c, 0, 1, 12, 5, 0.5); c.fillStyle = P.sun; c.fill(); }
  else if (id === 'heart') { heart(c, 0, 0, 10); c.fillStyle = P.rose; c.fill(); }
  else if (id === 'flower') { for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; c.fillStyle = '#FFFFFF'; ell(c, Math.cos(a) * 6, Math.sin(a) * 6, 4.5); c.fill(); } c.fillStyle = P.sun; ell(c, 0, 0, 4); c.fill(); }
  else if (id === 'candy') { c.fillStyle = '#7FE3A0'; ell(c, 0, 0, 9, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -3, -3, 3, 2); c.fill(); }
  else if (id === 'friend') { c.fillStyle = '#FFB3C7'; ell(c, 0, 2, 11, 10); c.fill(); c.fillStyle = '#2B1D48'; ell(c, -4, 1, 2, 2.6); c.fill(); ell(c, 4, 1, 2, 2.6); c.fill(); }
}
