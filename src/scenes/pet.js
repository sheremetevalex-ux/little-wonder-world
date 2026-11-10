// Pet house: three cosy 3D rooms side by side, and her friend lives in all of
// them. In the bathroom, soap makes real foam that sticks to the fur, the shower
// rinses foam and mud away, and the towel rubs the shine off. In the kitchen, a
// mouth opens wide when food comes near, bites follow, a lemon makes a funny face
// and a full belly ends in a burp. In the bedroom, pull up the blanket and turn off
// the lamp: stars light up the ceiling and a lullaby plays her friend to sleep.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, TAU, softStar, heart } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lighten, darken, starShape } from '../core/stage.js';
import { Critter } from '../art/critter3d.js';

const ROOMS = ['bath', 'food', 'bed'];
const ROOM_X = { bath: -16, food: 0, bed: 16 };
const FOODS = ['apple', 'strawberry', 'carrot', 'cupcake', 'donut', 'melon', 'cheese', 'icecream', 'lemon'];

// ---- 3D food ------------------------------------------------------------------------
function makeFood(id) {
  const g = new THREE.Group();
  const nc = { cast: false };
  if (id === 'apple') {
    mesh(G.sphere(24), M.glossy('#FF4F5E'), { s: [0.42, 0.38, 0.42], parent: g });
    mesh(G.capsule(1, 6), M.toy('#8A5A30'), { p: [0, 0.4, 0], s: [0.025, 0.08, 0.025], parent: g, ...nc });
    mesh(G.sphere(10), M.toy('#5FBF72'), { p: [0.1, 0.42, 0], r: [0, 0, -0.6], s: [0.12, 0.05, 0.07], parent: g, ...nc });
  } else if (id === 'strawberry') {
    mesh(G.cone(20), M.glossy('#FF3E6C'), { r: [Math.PI, 0, 0], s: [0.34, 0.5, 0.34], parent: g });
    mesh(G.sphere(16), M.glossy('#FF3E6C'), { p: [0, 0.12, 0], s: [0.34, 0.2, 0.34], parent: g, ...nc });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; mesh(G.sphere(8), M.toy('#5FBF72'), { p: [Math.cos(a) * 0.15, 0.3, Math.sin(a) * 0.15], s: [0.1, 0.03, 0.06], r: [0, -a, 0], parent: g, ...nc }); }
  } else if (id === 'carrot') {
    mesh(G.cone(16), M.toy('#FF8A3C'), { r: [Math.PI, 0, 0.3], s: [0.2, 0.7, 0.2], parent: g });
    for (let i = 0; i < 3; i++) mesh(G.capsule(1, 6), M.toy('#5FBF72'), { p: [0.1 + i * 0.04, 0.42, 0], r: [0, 0, -0.3 + i * 0.3], s: [0.03, 0.12, 0.03], parent: g, ...nc });
  } else if (id === 'cupcake') {
    mesh(G.cyl(16, 1.25), M.toy('#FFB0D0'), { p: [0, -0.15, 0], s: [0.3, 0.3, 0.3], parent: g });
    mesh(G.sphere(20), M.plush('#FFF4FA'), { p: [0, 0.1, 0], s: [0.38, 0.24, 0.38], parent: g });
    mesh(G.sphere(12), M.glossy('#FF3E6C'), { p: [0, 0.34, 0], s: 0.09, parent: g, ...nc });
  } else if (id === 'donut') {
    mesh(G.torus(0.45, TAU, 24), M.toy('#E8B27C'), { r: [Math.PI / 2 - 0.5, 0, 0], s: 0.32, parent: g });
    mesh(G.torus(0.36, TAU, 24), M.glossy('#FF8FC0'), { p: [0, 0.06, 0.03], r: [Math.PI / 2 - 0.5, 0, 0], s: [0.33, 0.33, 0.25], parent: g, ...nc });
  } else if (id === 'melon') {
    mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.16, 24, 1, false, 0, Math.PI), M.toy('#FF6F7F'), { r: [Math.PI / 2, 0, 0], parent: g });
    mesh(new THREE.TorusGeometry(0.45, 0.06, 8, 24, Math.PI), M.toy('#5FBF72'), { r: [0, 0, Math.PI], parent: g, ...nc });
    for (let i = 0; i < 5; i++) mesh(G.sphere(6), M.basic('#3A2A30'), { p: [Math.cos(0.4 + i * 0.6) * 0.25, -Math.sin(0.4 + i * 0.6) * 0.25, 0.09], s: [0.03, 0.045, 0.01], parent: g, ...nc });
    g.rotation.z = Math.PI;
  } else if (id === 'cheese') {
    mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 3), M.toy('#FFD45C'), { r: [0, 0.3, 0], parent: g });
    for (let i = 0; i < 3; i++) mesh(G.sphere(8), M.toy('#E8B53C'), { p: [rand(-0.15, 0.15), 0.15, rand(-0.1, 0.1)], s: [0.06, 0.02, 0.06], parent: g, ...nc });
  } else if (id === 'icecream') {
    mesh(G.cone(16), M.toy('#E8A85C'), { p: [0, -0.2, 0], r: [Math.PI, 0, 0], s: [0.22, 0.5, 0.22], parent: g });
    mesh(G.sphere(18), M.toy('#FFB3CF'), { p: [0, 0.12, 0], s: 0.25, parent: g });
    mesh(G.sphere(16), M.toy('#9FE8C8'), { p: [0, 0.34, 0], s: 0.2, parent: g, ...nc });
  } else if (id === 'lemon') {
    mesh(G.sphere(22), M.glossy('#FFE14D'), { s: [0.42, 0.3, 0.3], parent: g });
    for (const k of [-1, 1]) mesh(G.sphere(10), M.glossy('#FFE14D'), { p: [k * 0.42, 0, 0], s: [0.07, 0.06, 0.06], parent: g, ...nc });
  }
  g.userData.food = id;
  return g;
}

// ---- bathroom tools ---------------------------------------------------------------------
function makeTool(id) {
  const g = new THREE.Group();
  if (id === 'soap') {
    mesh(G.box(0.25), M.glossy('#FFB3E0'), { s: [0.7, 0.32, 0.45], parent: g });
    mesh(G.puffy('soapHeart', heartShapeS(), 0.1, 0.05), M.glossy('#FF6FAE'), { p: [0, 0.17, 0], r: [-Math.PI / 2, 0, 0], s: 0.1, parent: g, cast: false });
  } else if (id === 'shower') {
    mesh(G.capsule(1, 10), M.metal('#DDE3F0'), { p: [0, -0.4, 0], s: [0.08, 0.35, 0.08], parent: g });
    mesh(G.cyl(24, 1.2), M.metal('#DDE3F0'), { p: [0, 0.1, 0], s: [0.35, 0.16, 0.35], parent: g });
    mesh(G.cyl(24), M.toy('#9FD8FF'), { p: [0, 0.01, 0], s: [0.32, 0.02, 0.32], parent: g, cast: false });
  } else if (id === 'towel') {
    for (let i = 0; i < 3; i++) mesh(G.box(0.25), M.plush(i % 2 ? '#FFE066' : '#8FD0FF'), { p: [0, i * 0.12, 0], s: [0.8, 0.14, 0.5], parent: g });
  } else if (id === 'duck') {
    mesh(G.sphere(20), M.glossy('#FFD84D'), { s: [0.36, 0.28, 0.3], parent: g });
    mesh(G.sphere(16), M.glossy('#FFD84D'), { p: [0.14, 0.27, 0], s: 0.2, parent: g });
    mesh(G.sphere(10), M.glossy('#FF9E50'), { p: [0.34, 0.25, 0], s: [0.12, 0.05, 0.08], parent: g, cast: false });
    for (const k of [-1, 1]) mesh(G.sphere(6), M.glossy('#2B1D48'), { p: [0.24, 0.33, k * 0.1], s: 0.03, parent: g, cast: false });
  }
  g.userData.tool = id;
  return g;
}
let heartSS = null;
function heartShapeS() {
  if (heartSS) return heartSS;
  heartSS = new THREE.Shape();
  heartSS.moveTo(0, -0.9);
  heartSS.bezierCurveTo(-1.5, 0.1, -0.72, 1.05, 0, 0.32);
  heartSS.bezierCurveTo(0.72, 1.05, 1.5, 0.1, 0, -0.9);
  return heartSS;
}

function tileTex(a, b) {
  return canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = a; x.fillRect(0, 0, w, h);
    x.fillStyle = b;
    x.fillRect(0, 0, w, 4); x.fillRect(0, 0, 4, h);
    x.fillRect(0, h / 2, w, 4); x.fillRect(w / 2, 0, 4, h);
  }, { repeat: true });
}

export const pet = {
  tint: '#8FD8FF',

  enter() {
    const d = save.data;
    this.t = 0;
    this.id = d.friends.includes(d.pet) ? d.pet : d.friends[d.friends.length - 1];
    const st = this.stage = new Stage({ bg: '#FFE9F2', fov: 34, keyPos: [-4, 10, 8], shadowArea: 7, hemi: 0.7, sky: '#FFFFFF', ground: '#FFD6E6', env: 0.7 });
    this.world = group(st.scene);
    this.buildRooms();
    this.earned = {};
    this.belly = 0;
    this.wet = 0;
    this.sleepK = 0;
    this.makePet();
    this.layout();
    this.setRoom('bath', true);
    st.snap(this.pose());
    this.buttons = this.makeButtons();
    music.play('pet');
  },

  exit() {
    if (this.critter) this.critter.dispose();
    if (this.showerLoop) this.showerLoop.stop();
    this.stage.dispose();
  },

  makePet() {
    if (this.critter) { this.critter.root.parent && this.critter.root.parent.remove(this.critter.root); this.critter.dispose(); }
    const c = this.critter = new Critter(this.id, { size: 1.15 });
    this.world.add(c.root);
    this.foam = [];
    this.mud = [];
  },

  // ---- rooms -------------------------------------------------------------------------
  buildRooms() {
    const W = this.world;
    // floor and back wall run through all three rooms
    const floorT = tileTex('#FFFFFF', '#E9E4F4');
    floorT.repeat.set(30, 6);
    mesh(G.plane(), new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.6 }), { r: [-Math.PI / 2, 0, 0], p: [0, 0, 0], s: [70, 14, 1], receive: true, cast: false, parent: W });
    const walls = [['#BFEFFF', '#A8E2F8', -16], ['#FFF0D8', '#FFE2BC', 0], ['#5E4FB8', '#5246A8', 16]];
    for (const [a, b, x] of walls) {
      const t = tileTex(a, b);
      t.repeat.set(8, 4);
      mesh(G.plane(), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }), { p: [x, 5, -4], s: [16, 10, 1], receive: true, cast: false, parent: W });
    }
    // bathroom: a big tub full of water and bubbles
    const tub = this.tub = group(W, [ROOM_X.bath, 0, 0]);
    mesh(G.puck(0.35), M.glossy('#FFFFFF'), { p: [0, 0.75, 0], s: [2.5, 1.5, 1.5], parent: tub });
    this.water = mesh(G.cyl(40), new THREE.MeshPhysicalMaterial({ color: '#8FDCFF', roughness: 0.05, transmission: 0.5, thickness: 0.5, transparent: true, opacity: 0.85, clearcoat: 1 }), { p: [0, 1.35, 0], s: [2.3, 0.05, 1.3], parent: tub, cast: false });
    for (let i = 0; i < 18; i++) mesh(G.sphere(12), M.bubble({ opacity: 0.5 }), { p: [rand(-2, 2), 1.42, rand(-1.1, 1.1)], s: rand(0.15, 0.32), parent: tub, cast: false });
    for (const k of [-1, 1]) mesh(G.sphere(12), M.metal('#FFC93C'), { p: [k * 2.1, 0.12, 0.9], s: [0.18, 0.15, 0.18], parent: tub, cast: false });
    this.duckToy = makeTool('duck');
    this.duckToy.position.set(1.4, 1.5, 0.7);
    tub.add(this.duckToy);
    this.duckSq = new Spring(1, 300, 9);
    // a mirror and a towel rail
    mesh(G.puck(0.2), M.toy('#FFFFFF'), { p: [ROOM_X.bath - 4.5, 4.2, -3.9], r: [Math.PI / 2, 0, 0], s: [1.2, 0.1, 1.4], parent: W, cast: false });
    mesh(G.circle(32), M.metal('#E8F4FF', { roughness: 0.05 }), { p: [ROOM_X.bath - 4.5, 4.2, -3.84], s: [1.05, 1.25, 1], parent: W, cast: false });
    // kitchen: a table with a checked cloth, a high stool
    const table = this.table = group(W, [ROOM_X.food, 0, 0.6]);
    mesh(G.puck(0.2), new THREE.MeshStandardMaterial({ map: checkTex(), roughness: 0.8 }), { p: [0, 1.25, 0], s: [2.6, 0.12, 1.4], parent: table, receive: true });
    for (const x of [-1.8, 1.8]) mesh(G.cyl(10), M.toy('#E0A87C'), { p: [x, 0.6, 0], s: [0.14, 1.2, 0.14], parent: table });
    mesh(G.puck(0.4), M.glossy('#FFFFFF'), { p: [0, 1.36, 0.4], s: [1.6, 0.08, 0.7], parent: table, receive: true });
    // shelves with jars
    for (let i = 0; i < 4; i++) mesh(G.cyl(16), M.glossy(['#FF8FC0', '#FFE066', '#9FE8A8', '#8FD0FF'][i], { transparent: true, opacity: 0.8 }), { p: [ROOM_X.food - 4 + i * 0.7, 4.3, -3.6], s: [0.25, 0.5, 0.25], parent: W });
    mesh(G.box(0.05), M.toy('#E0A87C'), { p: [ROOM_X.food - 2.95, 4.0, -3.6], s: [3.2, 0.12, 0.6], parent: W });
    // bedroom: a bed with a pillow and blanket, a lamp, a window to the night
    const bed = this.bed = group(W, [ROOM_X.bed, 0, 0]);
    mesh(G.box(0.3), M.toy('#FF9FC3'), { p: [0, 1.6, -1.4], s: [3.6, 2.4, 0.4], parent: bed });
    mesh(G.box(0.3), M.plush('#E6DAFF'), { p: [0, 0.6, 0], s: [3.4, 0.8, 2.6], parent: bed, receive: true });
    mesh(G.box(0.4), M.plush('#FFFFFF'), { p: [0, 1.15, -0.85], s: [1.8, 0.4, 0.7], parent: bed, receive: true });
    this.blanket = group(bed, [0, 1.05, 1.25]);
    mesh(G.box(0.15), new THREE.MeshPhysicalMaterial({ map: starsTex(), roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#ffffff') }), { p: [0, 0, -0.85], s: [3.5, 0.22, 1.8], parent: this.blanket });
    this.blanketK = 0;
    this.lampG = group(W, [ROOM_X.bed + 3.4, 0, -0.6]);
    mesh(G.box(0.1), M.toy('#FFFFFF'), { p: [0, 0.6, 0], s: [0.9, 1.2, 0.9], parent: this.lampG });
    mesh(G.cyl(8), M.toy('#C9C6DA'), { p: [0, 1.5, 0], s: [0.05, 0.8, 0.05], parent: this.lampG, cast: false });
    this.shade = mesh(G.cyl(20, 0.6), M.toy('#FFD45C', { emissive: '#FFC233', emissiveIntensity: 0.8 }), { p: [0, 2.05, 0], s: [0.55, 0.5, 0.55], parent: this.lampG, cast: false });
    this.lampLight = new THREE.PointLight('#FFD48A', 10, 9, 1.4);
    this.lampLight.position.set(0, 1.8, 0.3);
    this.lampG.add(this.lampLight);
    this.lampOn = true;
    this.lampK = 1;
    const win = group(W, [ROOM_X.bed - 3.2, 4.6, -3.9]);
    mesh(G.box(0.1), M.toy('#FFFFFF'), { s: [2.4, 2.8, 0.2], parent: win, cast: false });
    mesh(G.plane(), M.basic('#1C1A58'), { p: [0, 0, 0.11], s: [2.1, 2.5, 1], parent: win, cast: false });
    mesh(G.sphere(16), M.basic('#FFF3C4'), { p: [0.5, 0.6, 0.15], s: 0.3, parent: win, cast: false });
    for (let i = 0; i < 9; i++) mesh(G.sphere(6), M.basic('#FFF8D8'), { p: [rand(-0.9, 0.9), rand(-1.1, 1.1), 0.14], s: 0.04, parent: win, cast: false });
    // the mobile of stars above the bed
    this.mobileG = group(W, [ROOM_X.bed, 5.2, 0.2]);
    mesh(G.torus(0.04, TAU, 32), M.toy('#FFFFFF'), { r: [Math.PI / 2, 0, 0], s: 1, parent: this.mobileG, cast: false });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      mesh(G.cyl(4), M.basic('#FFFFFF'), { p: [Math.cos(a), -0.4, Math.sin(a)], s: [0.01, 0.8, 0.01], parent: this.mobileG, cast: false });
      mesh(G.puffy('mstar', starShape(5, 1, 0.5), 0.3, 0.15), M.glossy(['#FFD45C', '#FF8FC0', '#8FD0FF', '#B48BFF', '#9FE8A8'][i], { emissive: '#FFE680', emissiveIntensity: 0.2 }), { p: [Math.cos(a), -0.85, Math.sin(a)], s: 0.2, parent: this.mobileG, cast: false });
    }
    this.mobileSpin = new Spring(0, 20, 1.2);
    // night sky stars that appear on the ceiling and walls when the lamp goes off
    const sg = new THREE.BufferGeometry(), sp = new Float32Array(240);
    for (let i = 0; i < 80; i++) { sp[i * 3] = ROOM_X.bed + rand(-7, 7); sp[i * 3 + 1] = rand(2.5, 9); sp[i * 3 + 2] = -3.9; }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.nightStars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#FFF2A8', size: 0.22, transparent: true, opacity: 0 }));
    W.add(this.nightStars);
  },

  layout() {
    this.wide = app.W > app.H;
  },
  pose() {
    const x = ROOM_X[this.room];
    return this.stage.pose(V(x, 2.2, 0.2), this.wide ? 9.5 : 6.6, this.wide ? 6.2 : 9.2, [0, 0.3, 1]);
  },
  resize() {
    this.layout();
    this.stage.snap(this.pose());
    this.placeButtons();
    this.placeTray();
  },

  makeButtons() {
    const tab = (name) => (c, r) => {
      const on = this.room === name;
      candy(c, r, { bath: P.sky, food: P.coral, bed: P.violet }[name], on);
      c.fillStyle = '#fff';
      if (name === 'bath') { rr(c, -14, -2, 28, 12, 6); c.fill(); for (const [x, y, s] of [[-6, -7, 4], [2, -10, 5], [9, -6, 3]]) { ell(c, x, y, s); c.fill(); } }
      else if (name === 'food') { c.fillStyle = '#FF4F5E'; ell(c, 0, 2, 12, 11); c.fill(); c.fillStyle = '#5FBF72'; ell(c, 4, -11, 5, 3, -0.5); c.fill(); }
      else { c.fillStyle = '#FFF3C4'; c.beginPath(); c.arc(-1, 0, 14, 0.9, 5.2); c.arc(5, -3, 11, 5, 1.1, true); c.fill(); }
      if (on) { c.lineWidth = 3; c.strokeStyle = '#fff'; ell(c, 0, -1, r - 2); c.stroke(); }
    };
    const b = ROOMS.map((name) => new Btn({ r: 29, slop: 6, name, paint: tab(name), tap: () => { if (this.room !== name) this.setRoom(name); } }));
    if (save.data.friends.length > 1) {
      b.push(new Btn({
        r: 27, slop: 10, name: 'next',
        paint: (c, r) => {
          candy(c, r, P.butter);
          c.fillStyle = '#FF8FB8'; ell(c, 0, 2, 12, 11); c.fill();
          c.fillStyle = '#2B1D48'; ell(c, -4, 0, 2, 2.6); c.fill(); ell(c, 4, 0, 2, 2.6); c.fill();
          c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.moveTo(14, -12); c.lineTo(19, -7); c.lineTo(14, -2); c.stroke();
        },
        tap: () => this.nextFriend()
      }));
    }
    this.btns = b;
    this.placeButtons(b);
    return b;
  },
  placeButtons(b = this.btns) {
    if (!b) return;
    const y = app.H - Math.max(app.safeBottom, 6) - 40;
    b.forEach((x, i) => {
      if (x.name === 'next') { x.x = app.W - 44; x.y = Math.max(app.safeTop, 10) + 34; }
      else { x.x = app.W / 2 + (i - 1) * 76; x.y = y; }
    });
  },

  nextFriend() {
    const fr = save.data.friends;
    this.id = fr[(fr.indexOf(this.id) + 1) % fr.length];
    save.data.pet = this.id;
    save.touch();
    this.makePet();
    this.placePet();
    this.critter.hop(6);
    this.critter.say('yay', 0.6);
    if (this.room === 'bath') this.setupBath();
    audio.sfx('pop');
  },

  setRoom(name, silent) {
    const prev = this.room;
    this.room = name;
    hint.clear();
    if (this.trayItems) for (const t of this.trayItems) t.g.parent && t.g.parent.remove(t.g);
    this.trayItems = [];
    if (prev === 'bath' && name !== 'bath') {
      const c = this.critter;
      for (const f of this.foam) c.yaw.remove(f.m);
      for (const m of this.mud) c.yaw.remove(m.m);
      this.foam = []; this.mud = [];
      this.wet = 0;
    }
    if (!silent) { audio.sfx('whoosh', { vol: 0.6 }); audio.note('marimba', penta(ROOMS.indexOf(name) + 2), { vol: 0.5 }); }
    this.placePet();
    if (name === 'bath') this.setupBath();
    if (name === 'food') this.setupFood();
    if (name === 'bed') this.setupBed();
    if (name === 'bed') music.play('night');
    else if (prev === 'bed') music.play('pet');
    this.critter.hop(5);
  },

  placePet() {
    const c = this.critter;
    c.sleep = false;
    if (this.room === 'bath') { c.root.position.set(ROOM_X.bath, 0.9, 0.1); }
    else if (this.room === 'food') { c.root.position.set(ROOM_X.food, 1.32, -0.15); }
    else { c.root.position.set(ROOM_X.bed, 1.0, -0.35); }
    c.root.rotation.set(0, 0, 0);
    this.petBase = c.root.position.clone();
  },

  earn(room) {
    if (this.earned[room]) return;
    this.earned[room] = 1;
    save.earnStar();
    audio.fanfare();
    fx.confetti(app.W, app.H, 70);
    this.critter.hop(7);
    this.critter.setMood('love', 2);
  },

  // ---- tray of tools / food on the floor in front --------------------------------------------
  placeTray() {
    const n = this.trayItems.length;
    if (!n) return;
    const x0 = ROOM_X[this.room];
    const sp = this.wide ? 1.35 : 1.0;
    this.trayItems.forEach((t, i) => {
      t.home = V(x0 + (i - (n - 1) / 2) * sp, this.room === 'food' ? 0.6 : 0.5, 2.6);
      if (!t.held) t.g.position.copy(t.home);
    });
  },

  setupBath() {
    const c = this.critter;
    for (const f of this.foam) f.m.parent && f.m.parent.remove(f.m);
    for (const m of this.mud) m.m.parent && m.m.parent.remove(m.m);
    this.foam = [];
    this.mud = [];
    // muddy spots around the body, never over the face
    const spots = [[-1.2, 0.4], [1.2, 0.5], [-0.9, 0.95], [0.8, 0.9], [2.4, 0.2], [-2.4, 0.3], [0.2, 1.25], [1.6, -0.1], [-1.6, -0.1]];
    for (const [a, e] of spots) {
      const m = mesh(G.sphere(12), M.toy('#9A6A48', { roughness: 0.95 }), { s: [rand(0.14, 0.22), rand(0.1, 0.16), 0.05], cast: false });
      c.stick(m, a, e, 0.0, c.yaw);
      this.mud.push({ m, a: 1 });
    }
    this.bathStage = 0;
    this.wet = 0;
    this.trayItems = ['soap', 'shower', 'towel'].map((id) => ({ id, g: makeTool(id) }));
    for (const t of this.trayItems) this.world.add(t.g);
    this.placeTray();
    if (!save.data.seen.bath) wait(0.8, () => this.hintTool(0));
  },
  hintTool(i) {
    const t = this.trayItems[i];
    if (!t) return;
    const a = this.stage.toScreen(t.home), b = this.stage.objScreen(this.critter.body);
    hint.set({ from: [a.x, a.y], to: [b.x, b.y], delay: 1.4 });
  },

  setupFood() {
    const pickF = ['lemon', ...FOODS.filter((f) => f !== 'lemon').sort(() => Math.random() - 0.5).slice(0, 4)].sort(() => Math.random() - 0.5);
    this.trayItems = pickF.map((id) => ({ id, g: makeFood(id), bites: 0 }));
    for (const t of this.trayItems) { t.g.scale.setScalar(1.3); this.world.add(t.g); }
    this.placeTray();
    this.fed = 0;
    if (!save.data.seen.feed) wait(0.8, () => this.hintTool(1));
  },

  setupBed() {
    this.blanketK = 0;
    this.lampOn = true;
    this.sleepK = 0;
    this.lullT = 0;
    this.lullStep = 0;
    const s = this.stage.toScreen(V(ROOM_X.bed, 1.2, 1.2));
    if (!save.data.seen.bed) wait(0.8, () => hint.set({ from: [s.x, s.y + 40], to: [s.x, s.y - 50], delay: 1.5 }));
  },

  // ---- per frame ----------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage, c = this.critter;
    st.glide(this.pose(), dt, 3.5);
    // belly grows with every snack
    c.body.scale.set(c.rx * (1 + this.belly * 0.12), c.ry, c.rz * (1 + this.belly * 0.18));
    if (this.shiver > 0) { this.shiver -= dt; c.root.position.x = this.petBase.x + Math.sin(t * 55) * 0.04 * clamp(this.shiver); }
    // wet fur shines
    c.bodyMat.clearcoat = 0.45 + this.wet * 0.55;
    c.bodyMat.roughness = 0.48 - this.wet * 0.35;
    for (const f of this.foam) { f.k = Math.min(1, f.k + dt * 6); f.m.scale.setScalar(f.s * f.k * (1 + Math.sin(t * 3 + f.s * 20) * 0.04)); }
    // shower water
    if (this.room === 'bath') this.stepShower(dt);
    const dk = this.duckSq.step(dt);
    this.duckToy.scale.set(1 / Math.sqrt(dk), dk, 1 / Math.sqrt(dk));
    this.duckToy.position.y = 1.5 + Math.sin(t * 2) * 0.04;
    this.duckToy.position.x = 1.4 + Math.sin(t * 0.5) * 0.3;
    this.duckToy.rotation.y = Math.sin(t * 0.7) * 0.6;
    // food: the mouth opens as food comes close
    if (this.room === 'food') {
      const held = this.trayItems.find((x) => x.held);
      if (held) {
        const mp = c.mouth.getWorldPosition(V());
        const d = held.g.position.distanceTo(mp);
        c.look(held.g.position);
        if (d < 2.2 && c.talkT <= 0 && this.chewT <= 0) { c.mood = 'wow'; c.moodT = 0.2; }
      } else c.look(st.camera.position);
      this.chewT = Math.max(0, (this.chewT || 0) - dt);
      if (this.chewT > 0) { c.mood = 'eat'; c.moodT = 0.2; }
    } else c.look(st.camera.position);
    // bedroom
    this.lampK += ((this.lampOn ? 1 : 0) - this.lampK) * Math.min(1, dt * 5);
    if (this.room === 'bed' || this.lampK < 0.99) {
      const L = this.lampK;
      this.lampLight.intensity = 10 * L;
      this.shade.material.emissiveIntensity = 0.1 + 0.7 * L;
      const inBed = this.room === 'bed';
      st.key.intensity = inBed ? lerp(0.6, 2.9, L) : 2.9;
      st.hemi.intensity = inBed ? lerp(0.25, 0.7, L) : 0.7;
      this.nightStars.material.opacity = inBed ? (1 - L) * 0.95 : 0;
    }
    this.blanket.position.z = lerp(1.25, 1.25, this.blanketK);
    this.blanket.position.y = lerp(1.05, 1.15, this.blanketK);
    this.blanket.scale.z = lerp(0.35, 1.05, this.blanketK);
    this.blanket.position.z = lerp(1.3, 1.95, this.blanketK);
    this.mobileG.rotation.y += (0.15 + this.mobileSpin.step(dt)) * dt;
    if (this.room === 'bed') {
      const wants = !this.lampOn && this.blanketK > 0.6;
      this.sleepK += ((wants ? 1 : 0) - this.sleepK) * Math.min(1, dt * 1.2);
      c.sleep = this.sleepK > 0.6;
      if (wants) {
        this.lullT -= dt;
        if (this.lullT <= 0) {
          this.lullT = 0.62;
          const song = [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 3, 2, 4, 2, 1, 0];
          audio.note('bell', penta(song[this.lullStep++ % song.length]), { vol: 0.28, wet: 0.9 });
        }
        if (this.sleepK > 0.85 && !this.earned.bed && !this.bedWait) {
          this.bedWait = true;
          wait(3.5, () => { this.bedWait = false; if (this.room === 'bed' && this.sleepK > 0.8) { this.earned.bed = 1; save.earnStar(); audio.sparkle(3, 5, 0.3); const s = st.toScreen(V(ROOM_X.bed - 3.2, 4.6, -3.8)); fx.burst(s.x, s.y, { kind: 'star', n: 16, colors: [P.butter, '#fff'], speed: 180, size: 16, g: 80 }); } });
        }
        if (c.sleep && Math.random() < dt * 0.7) { const s = st.toScreen(c.body.getWorldPosition(V()).add(V(0.6, 1.2, 0))); this.zzz.push({ x: s.x, y: s.y, t: 0 }); }
      }
    } else c.sleep = false;
    this.zzz = (this.zzz || []).filter((z) => (z.t += dt) < 2.4);
    // tray items bob until picked up
    for (const it of this.trayItems) {
      if (it.held) continue;
      it.g.position.lerp(it.home, Math.min(1, dt * 8));
      it.g.position.y = it.home.y + Math.sin(t * 2 + it.home.x) * 0.06;
      it.g.rotation.y = Math.sin(t * 0.8 + it.home.x) * 0.5;
    }
    c.update(dt);
  },

  stepShower(dt) {
    const held = this.trayItems.find((x) => x.held && x.id === 'shower');
    this.drops = this.drops || [];
    if (held) {
      const head = held.g.position;
      for (let i = 0; i < 2; i++) {
        const m = mesh(G.sphere(6), M.glossy('#8FDCFF', { transparent: true, opacity: 0.8 }), { p: [head.x + rand(-0.25, 0.25), head.y - 0.1, head.z + rand(-0.25, 0.25)], s: 0.05, parent: this.world, cast: false });
        this.drops.push({ m, v: V(rand(-0.3, 0.3), -rand(5, 7), rand(-0.3, 0.3)) });
      }
      if (!this.showerLoop) this.showerLoop = audio.loop('hiss', 0.12, 1.3);
    } else if (this.showerLoop) { this.showerLoop.stop(); this.showerLoop = null; }
    const c = this.critter;
    const cp = c.body.getWorldPosition(V());
    const R = c.ry * c.size * 1.05;
    for (const d of this.drops) {
      d.v.y -= 12 * dt;
      d.m.position.addScaledVector(d.v, dt);
      if (d.m.position.distanceTo(cp) < R) {
        d.dead = true;
        const local = c.yaw.worldToLocal(d.m.position.clone());
        // rinse the nearest foam and mud
        for (let k = this.foam.length - 1; k >= 0; k--) {
          if (this.foam[k].m.position.distanceTo(local) < 0.55) { this.foam[k].s -= 0.04; if (this.foam[k].s < 0.05) { c.yaw.remove(this.foam[k].m); this.foam.splice(k, 1); } break; }
        }
        for (const m of this.mud) {
          if (m.m.position.distanceTo(local) < 0.6 && !this.foam.length) { m.a -= 0.06; m.m.material = M.toy('#9A6A48', { roughness: 0.95, transparent: true, opacity: Math.max(0, m.a) }); }
        }
        this.wet = Math.min(1, this.wet + dt * 0.35);
        if (Math.random() < 0.02) c.say('giggle', 0.3);
      }
      if (d.m.position.y < 1.3) d.dead = true;
      if (d.dead) this.world.remove(d.m);
    }
    this.drops = this.drops.filter((d) => !d.dead);
    for (let i = this.mud.length - 1; i >= 0; i--) if (this.mud[i].a <= 0) { c.yaw.remove(this.mud[i].m); this.mud.splice(i, 1); }
    if (held && !this.foam.length && !this.mud.length && this.bathStage < 2) { this.bathStage = 2; this.hintTool(2); }
  },

  draw(c) {
    for (const z of this.zzz || []) {
      c.save();
      c.globalAlpha = clamp(1 - z.t / 2.4) * 0.9;
      c.fillStyle = '#FFF4C8';
      c.font = `800 ${16 + z.t * 10}px -apple-system, system-ui, sans-serif`;
      c.fillText('z', z.x + Math.sin(z.t * 3) * 10, z.y - z.t * 40);
      c.restore();
    }
    for (const b of this.buttons) b.draw(c);
  },

  // ---- input ---------------------------------------------------------------------------
  down(p) {
    const st = this.stage, c = this.critter;
    // tray: pick up a tool or a snack
    for (const it of this.trayItems) {
      const s = st.objScreen(it.g);
      if (dist(p.x, p.y, s.x, s.y) < 46) {
        it.held = true;
        p.item = it;
        audio.sfx('tap', { rate: 1.1 });
        haptic();
        this.moveItem(p);
        return;
      }
    }
    if (this.room === 'bath') {
      const s = st.objScreen(this.duckToy);
      if (dist(p.x, p.y, s.x, s.y) < 40) { this.duckSq.kick(-6); audio.sfx('squeak'); audio.voice('coo', 1.3, 0.3); fx.bubbles(s.x, s.y, 5); return; }
    }
    if (this.room === 'bed') {
      const ls = st.objScreen(this.shade);
      if (dist(p.x, p.y, ls.x, ls.y) < 60) {
        this.lampOn = !this.lampOn;
        audio.sfx('tick', { vol: 1 });
        audio.note('marimba', this.lampOn ? 72 : 67, { vol: 0.5 });
        haptic();
        if (!this.lampOn) wait(0.3, () => c.say('yawn', 0.5));
        save.data.seen.bed = 1;
        return;
      }
      const ms = st.objScreen(this.mobileG);
      if (dist(p.x, p.y, ms.x, ms.y + 30) < 80) { this.mobileSpin.kick(3); audio.sparkle(Math.floor(rand(0, 4)), 3, 0.35); return; }
      const bs = st.toScreen(V(ROOM_X.bed, 1.2, lerp(1.4, 1.9, this.blanketK)));
      if (dist(p.x, p.y, bs.x, bs.y) < 140 && p.y > st.objScreen(c.body).y - 10) { p.blanket = { y0: p.y, k0: this.blanketK }; hint.clear(); return; }
    }
    const hit = st.pick(p.x, p.y, [c.root]);
    if (hit) {
      if (c.sleep) { c.say('snore', 0.4); c.poke(0.3); return; }
      c.poke();
      c.hop(5);
      c.setMood(pick(['happy', 'love', 'wow']), 1);
      c.say(pick(['giggle', 'yay', 'hehe', 'mew']), 0.6);
      fx.hearts(p.x, p.y - 10, 5);
      haptic();
      return;
    }
    fx.sparkle(p.x, p.y, 4);
  },

  moveItem(p) {
    const it = p.item;
    const w = this.stage.onFacing(p.x, p.y, V(ROOM_X[this.room], 2, 1.2));
    if (!w) return;
    w.z = Math.min(w.z, 2.6);
    const prev = it.g.position.clone();
    it.g.position.copy(w);
    it.g.rotation.set(0, 0, it.id === 'shower' ? Math.PI : 0);
    if (it.id === 'shower') it.g.position.y = Math.max(w.y, 3.2);
    const c = this.critter;
    const cp = c.body.getWorldPosition(V());
    const near = w.distanceTo(cp) < c.ry * c.size * 1.6;
    if (it.id === 'soap' && near) {
      const speed = w.distanceTo(prev);
      if (speed > 0.02 && this.foam.length < 70) {
        // foam where the soap touches the fur
        const dir = w.clone().sub(cp).normalize();
        // keep the face clear so she can still see who she is washing
        if (dir.z > 0.55 && dir.y > -0.5 && dir.y < 0.6) { dir.x += Math.sign(dir.x || 1) * 0.9; dir.y += 0.5; dir.normalize(); }
        const surf = cp.clone().addScaledVector(dir, c.ry * c.size * 0.95);
        const local = c.yaw.worldToLocal(surf);
        const m = mesh(G.sphere(12), M.plush('#FFFFFF', { sheenColor: new THREE.Color('#E8F4FF') }), { p: [local.x + rand(-0.1, 0.1), local.y + rand(-0.1, 0.1), local.z], s: 0.01, parent: c.yaw, cast: false });
        this.foam.push({ m, s: rand(0.14, 0.26), k: 0 });
        audio.sfx('scrub', { rate: rand(0.8, 1.3), vol: 0.7, gap: 70 });
        if (Math.random() < 0.05) c.say('giggle', 0.4);
        c.setMood('happy', 0.4);
        for (const md of this.mud) if (md.m.position.distanceTo(local) < 0.5) md.loose = true;
        if (Math.random() < 0.3) { const s = this.stage.toScreen(surf); fx.add({ kind: 'bubble', x: s.x, y: s.y, vx: rand(-40, 40), vy: rand(-110, -30), g: -30, size: rand(9, 18), life: 1, color: P.sky }); }
        if (!save.data.seen.bath) { save.data.seen.bath = 1; hint.clear(); }
        if (this.foam.length > 18 && this.bathStage === 0) { this.bathStage = 1; this.hintTool(1); }
      }
    }
    if (it.id === 'towel' && near && this.bathStage >= 2) {
      const sp = w.distanceTo(prev);
      if (sp > 0.02) {
        this.wet = Math.max(0, this.wet - sp * 0.25);
        c.poke(0.2);
        audio.sfx('swish', { rate: rand(0.7, 1.1), vol: 0.5, gap: 110 });
        if (Math.random() < 0.3) fx.sparkle(p.x, p.y, 1);
        if (this.wet <= 0.02 && this.bathStage === 2) { this.bathStage = 3; hint.clear(); this.earn('bath'); c.say('giggle', 0.6); }
      }
    }
  },

  move(p) {
    if (p.item) { this.moveItem(p); return; }
    if (p.blanket) {
      this.blanketK = clamp(p.blanket.k0 + (p.blanket.y0 - p.y) / 160);
      if (Math.random() < 0.2) audio.sfx('swish', { vol: 0.3, gap: 120 });
    }
  },

  up(p) {
    const it = p.item;
    if (it) {
      it.held = false;
      if (this.room === 'food') {
        const c = this.critter;
        const mp = c.mouth.getWorldPosition(V());
        if (it.g.position.distanceTo(mp) < 1.7) this.bite(it);
      }
      return;
    }
    if (p.blanket) {
      if (this.blanketK > 0.6) { this.blanketK = 1; audio.sfx('swish', { vol: 0.5 }); this.critter.setMood('love', 1); }
      p.blanket = null;
    }
  },

  bite(it) {
    const c = this.critter;
    it.bites++;
    this.chewT = 0.75;
    save.data.seen.feed = 1;
    hint.clear();
    audio.sfx('chew', { rate: rand(0.9, 1.15), vol: 0.9 });
    wait(0.2, () => audio.sfx('chew', { rate: rand(1, 1.25), vol: 0.7 }));
    const s = this.stage.objScreen(c.mouth);
    fx.burst(s.x, s.y, { kind: 'dot', n: 6, colors: ['#FFD0A0', '#FFE0C0', '#F7B26A'], speed: 90, size: 7, g: 500, life: 0.6, spin: 0 });
    c.poke(0.6);
    haptic();
    // the snack gets smaller with every bite
    const k = 1.3 * (1 - it.bites * 0.3);
    if (it.bites >= 3) {
      this.world.remove(it.g);
      this.trayItems = this.trayItems.filter((x) => x !== it);
      this.placeTray();
      if (!this.trayItems.length) wait(1, () => { if (this.room === 'food') this.setupFood(); });
    } else it.g.scale.setScalar(k);
    wait(0.8, () => {
      if (this.room !== 'food') return;
      if (it.id === 'lemon') {
        c.setMood('wow', 1.6);
        c.say('sour', 0.7);
        this.shiver = 1.4;
        c.poke(1.4);
      } else {
        c.setMood(Math.random() < 0.5 ? 'love' : 'happy', 1.2);
        c.say(pick(['yum', 'mmm']), 0.65);
        fx.hearts(s.x, s.y - 30, 6);
      }
      this.belly = Math.min(1, this.belly + 0.16);
      this.fed++;
      if (this.fed === 4 || this.fed === 8) {
        wait(1.3, () => {
          if (this.room !== 'food') return;
          c.say('burp', 0.7);
          this.belly *= 0.35;
          c.poke(1.5);
          c.setMood('wow', 0.8);
          fx.bubbles(s.x, s.y, 3);
        });
        wait(2.3, () => this.earn('food'));
      }
    });
  }
};

let checkT = null, starsT = null;
function checkTex() {
  return checkT || (checkT = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FF9FB8';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) x.fillRect(i * 16, j * 16, 16, 16);
  }));
}
function starsTex() {
  return starsT || (starsT = canvasTex(256, 128, (x, w, h) => {
    x.fillStyle = '#8C7FE0'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FFE680';
    for (let i = 0; i < 24; i++) { softStar(x, (i * 47) % w, (i * 29) % h, 6, 5, 0.5); x.fill(); }
  }));
}
