// The hub: a living 3D meadow under a big sky. Every world is a glass ball with
// its own little toy inside, floating in neat rows; below, every friend found so
// far walks about, hops and chats. The nest holds eggs, the sun changes the time
// of day, clouds bounce, flowers play notes and gifts float by on balloons.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rand, pick, dist, clamp, lerp, heart, TAU } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, skyTexture, blobShadow, starShape, heartShape, canvasTex, lighten, PM, bake } from '../core/stage.js';
import { skyByClock } from '../art/world.js';
import { FRIENDS, FRIEND_IDS } from '../art/creatures.js';
import { Critter } from '../art/critter3d.js';
import { makeWorldToy, eggShape, eggTex } from '../art/worldtoys.js';
import { unlockNextItem, drawGiftItem } from './dress.js';

// The five newest first: they glitter until she has visited each one
export const WORLDS = [
  { id: 'dumplings', color: '#FFE3C2', note: 0, fresh: 1 },
  { id: 'eggs', color: '#E3D6FF', note: 1, fresh: 1 },
  { id: 'squishy', color: '#FFD1E6', note: 2, fresh: 1 },
  { id: 'hidden', color: '#D3F5D2', note: 3, fresh: 1 },
  { id: 'jump', color: '#CDEBFF', note: 4, fresh: 1 },
  { id: 'dress', color: '#FFC9DF', note: 5 },
  { id: 'pet', color: '#C9EEFF', note: 6 },
  { id: 'cake', color: '#FFE7BD', note: 7 },
  { id: 'cafe', color: '#FFEBD0', note: 8 },
  { id: 'salon', color: '#EBDDFF', note: 9 },
  { id: 'atelier', color: '#CDF4EE', note: 10 },
  { id: 'sing', color: '#FFD6E8', note: 11 },
  { id: 'popit', color: '#E0D2FF', note: 7 },
  { id: 'slime', color: '#CFF7DC', note: 8 },
  { id: 'paint', color: '#FFDCE5', note: 9 },
  { id: 'garden', color: '#DCF6FF', note: 10 },
  { id: 'quest', color: '#FFF3B8', note: 11 },
  { id: 'album', color: '#FFE0CC', note: 12 }
];

const SKY = {
  day: { bg: [[0, '#6EC1FF'], [0.55, '#A8DCFF'], [1, '#FFE8F3']], fog: '#E9F2FF', hemi: 0.6, key: 2.9, keyColor: '#FFF3E4', exposure: 1, grass: '#8FDE7E', hill: ['#7ED37A', '#A6E39A', '#C3EAB4'] },
  sunset: { bg: [[0, '#7A6BE0'], [0.5, '#FF9FC0'], [1, '#FFD7A6']], fog: '#FFD9C6', hemi: 0.5, key: 2.3, keyColor: '#FFC9A0', exposure: 1, grass: '#9ED98A', hill: ['#8BCB86', '#B6D9A0', '#E8C8B4'] },
  night: { bg: [[0, '#1B1650'], [0.6, '#3B2F8E'], [1, '#7C5BC4']], fog: '#4B3A99', hemi: 0.42, key: 1.2, keyColor: '#BFC8FF', exposure: 1, grass: '#5E9E86', hill: ['#4F8A7E', '#5F8F9C', '#6E7DB0'] }
};

function makeResident(hub, id, x, z) {
  const c = new Critter(id, { size: 1.15 });
  c.root.position.set(x, 0, z);
  c.shiny = save.data.shiny.includes(id);
  if (c.shiny) addCrown(c);
  return { id, c, tx: x, tz: z, idle: rand(1, 5), walk: 0, greet: 0 };
}

function addCrown(cr) {
  const g = group(cr.yaw, [0, cr.ry * 2 + 0.05, 0]);
  const gold = M.metal('#FFC93C', { roughness: 0.2 });
  mesh(G.cyl(24, 1.05), gold, { s: [0.3, 0.14, 0.3], parent: g, cast: false });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    mesh(G.cone(8), gold, { p: [Math.sin(a) * 0.28, 0.14, Math.cos(a) * 0.28], s: [0.07, 0.16, 0.07], parent: g, cast: false });
    mesh(G.sphere(8), M.glossy(['#FF5C8F', '#6FC4FF', '#7FE3A0'][i % 3]), { p: [Math.sin(a) * 0.3, 0.0, Math.cos(a) * 0.3], s: 0.04, parent: g, cast: false });
  }
  g.rotation.x = -0.15;
}

export const hub = {
  tint: '#8FCBFF',
  home: false,

  enter(args) {
    save.dailyGift();
    save.data.seen = save.data.seen || {};
    this.mode = this.mode || skyByClock();
    this.t = 0;
    this.W = app.W; this.H = app.H;
    const st = this.stage = new Stage({ fov: 36, shadowSize: 1024, shadowArea: 12, rim: 1.2 });
    this.cam = st.camera;
    this.world = group(st.scene);
    this.buildScenery();
    this.bubbles = WORLDS.map((w, i) => this.makeBubble(w, i));
    this.residents = [];
    this.layout();
    this.fillResidents();
    this.buildNest();
    this.applySky(true);
    this.small = [];
    this.smallT = 1;
    this.gift = null;
    this.giftT = rand(14, 26);
    this.nudgeT = 3;
    this.hatch = null;
    this.flyStars = [];
    this.press = null;
    this.bubbles.forEach((b, i) => {
      b.enter = 0;
      tween(b, { enter: 1 }, 0.6, { ease: E.back, delay: 0.08 + i * 0.035 });
    });
    this.buttons = [this.musicButton(), this.skyButton()];
    this.placeButtons();
    music.play(this.mode === 'night' ? 'night' : 'hub');
    music.setEnabled(save.data.music);
    if (args && args.intro) wait(0.35, () => audio.success());
    this.updateHint();
    if (save.data.pendingStars) {
      const n = save.data.pendingStars;
      save.data.pendingStars = 0;
      save.touch();
      for (let i = 0; i < n; i++) wait(0.8 + i * 0.35, () => this.launchStar());
    }
  },

  exit() {
    for (const r of this.residents) r.c.dispose();
    this.stage.dispose();
  },

  placeButtons() {
    const y = this.H - Math.max(app.safeBottom, 6) - 34;
    this.buttons[0].x = 36; this.buttons[0].y = y;
    this.buttons[1].x = 92; this.buttons[1].y = y;
  },

  skyButton() {
    return new Btn({
      r: 23, slop: 8,
      paint: (c, r) => {
        const night = this.mode === 'night';
        candy(c, r, night ? '#6B5BD6' : this.mode === 'sunset' ? '#FF9F7A' : '#FFC233');
        c.fillStyle = '#FFF6D0';
        if (night) {
          c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill();
          c.fillStyle = '#6B5BD6';
          c.beginPath(); c.arc(5, -4, 10, 0, TAU); c.fill();
        } else {
          c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
          c.lineWidth = 3; c.lineCap = 'round'; c.strokeStyle = '#FFF6D0';
          for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + this.t * 0.5; c.beginPath(); c.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); c.stroke(); }
        }
      },
      tap: () => this.nextSky()
    });
  },

  nextSky() {
    this.sunSq.kick(5);
    audio.sparkle(2, 5);
    const order = ['day', 'sunset', 'night'];
    this.mode = order[(order.indexOf(this.mode) + 1) % 3];
    this.applySky();
    music.play(this.mode === 'night' ? 'night' : 'hub');
    fx.sparkle(this.buttons[1].x, this.buttons[1].y, 14);
  },

  musicButton() {
    return new Btn({
      r: 23, slop: 8,
      paint: (c, r) => {
        candy(c, r, save.data.music ? P.teal : '#A9A6C4');
        c.fillStyle = '#fff';
        c.strokeStyle = '#fff';
        c.lineWidth = 2.6;
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(4, 8); c.lineTo(4, -10); c.lineTo(11, -6); c.stroke();
        ell(c, -1, 9, 5.4, 4.4, -0.3);
        c.fill();
        if (!save.data.music) {
          c.strokeStyle = P.rose;
          c.lineWidth = 3.5;
          c.beginPath(); c.moveTo(-12, -11); c.lineTo(13, 12); c.stroke();
        }
      },
      tap: () => {
        save.data.music = !save.data.music;
        music.setEnabled(save.data.music);
        save.touch();
        if (save.data.music) audio.sparkle(0, 3);
      }
    });
  },

  // ---- scenery --------------------------------------------------------------------
  buildScenery() {
    const W = this.world;
    // ground: a soft rolling meadow
    const gg = new THREE.PlaneGeometry(260, 200, 80, 60);
    gg.rotateX(-Math.PI / 2);
    const pos = gg.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const far = Math.max(0, -z - 12) / 60;
      pos.setY(i, (Math.sin(x * 0.12) * 0.5 + Math.sin(z * 0.17 + x * 0.05) * 0.4) * far * 2.2);
    }
    gg.computeVertexNormals();
    this.groundMat = new THREE.MeshStandardMaterial({ color: '#8FDE7E', roughness: 0.95, envMapIntensity: 0.4 });
    this.ground = mesh(gg, this.groundMat, { p: [0, 0, -60], receive: true, cast: false, parent: W });
    // far hills fading into the haze
    this.hills = [];
    const hillDefs = [[-48, -95, 34, 0], [5, -110, 42, 1], [55, -92, 30, 0], [-22, -130, 48, 2], [36, -140, 52, 2], [-70, -120, 40, 1], [80, -125, 44, 1]];
    for (const [x, z, r, k] of hillDefs) {
      const m = new THREE.MeshStandardMaterial({ color: '#A6E39A', roughness: 1, envMapIntensity: 0.3 });
      const h = mesh(G.sphere(40), m, { p: [x, -r * 0.62, z], s: [r * 1.4, r, r], cast: false, parent: W });
      h.userData.k = k;
      this.hills.push(h);
    }
    // lollipop trees on the sides
    this.trees = [];
    const trunk = M.toy('#B9825A', { roughness: 0.8 });
    const treeCols = ['#6CCB76', '#86D96E', '#FF9FC6', '#FFC86B', '#7FD8B0'];
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -18 - i * 3.6 - rand(0, 4);
      const x = side * (10 + rand(0, 12) + (-z) * 0.32);
      const t = group(W, [x, 0, z]);
      const s = rand(1.6, 2.6);
      mesh(G.cyl(10), trunk, { p: [0, s * 0.6, 0], s: [0.22 * s, s * 1.2, 0.22 * s], parent: t });
      const col = pick(treeCols);
      mesh(G.sphere(24), M.toy(col, { roughness: 0.55 }), { p: [0, s * 1.55, 0], s: s * 0.95, parent: t });
      mesh(G.sphere(16), M.toy(lighten(col, 0.15), { roughness: 0.55 }), { p: [s * 0.55, s * 1.25, s * 0.2], s: s * 0.55, parent: t, cast: false });
      t.userData.ph = rand(TAU);
      t.userData.sq = new Spring(1, 200, 6);
      bake(t);
      this.trees.push(t);
    }
    // scattered little flowers (instanced)
    const fl = new THREE.InstancedMesh(G.sphere(8), new THREE.MeshStandardMaterial({ roughness: 0.6 }), 160);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
    const fcols = ['#FF82AF', '#FFD45C', '#FFFFFF', '#B48BFF', '#6FD8FF', '#FF9F7A'];
    for (let i = 0; i < 160; i++) {
      p.set(rand(-30, 30), 0.06, rand(-46, -17));
      sc.setScalar(rand(0.1, 0.18));
      m4.compose(p, q, sc);
      fl.setMatrixAt(i, m4);
      fl.setColorAt(i, cc.set(pick(fcols)));
    }
    fl.castShadow = false;
    W.add(fl);
    // clouds made of plush puffs
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      const cl = group(W, [rand(-60, 60), rand(16, 34), -70 - rand(0, 30)]);
      const cm = M.plush('#FFFFFF', { sheenColor: new THREE.Color('#E8F1FF') });
      const n = 5;
      for (let k = 0; k < n; k++) mesh(G.sphere(20), cm, { p: [(k - 2) * 2.4 + rand(-0.5, 0.5), Math.sin((k / (n - 1)) * Math.PI) * 1.6, rand(-0.5, 0.5)], s: 2.2 + Math.sin((k / (n - 1)) * Math.PI) * 1.4, parent: cl, cast: false });
      cl.userData = { v: rand(0.6, 1.4), sq: new Spring(1, 180, 6) };
      bake(cl);
      cl.scale.setScalar(rand(0.8, 1.3));
      this.clouds.push(cl);
    }
    // sun with a sleepy smile
    this.sun = group(W, [-30, 10, -150]);
    this.sunBall = mesh(G.sphere(32), new THREE.MeshBasicMaterial({ color: '#FFE070' }), { s: 9, parent: this.sun, cast: false });
    this.sunGlow = mesh(G.sphere(24), M.glow('#FFD24D', { opacity: 0.25 }), { s: 15, parent: this.sun, cast: false });
    for (const k of [-1, 1]) mesh(G.sphere(12), M.basic('#C2742E'), { p: [k * 3, 1.2, 8.6], s: [0.75, 0.95, 0.4], parent: this.sun, cast: false });
    mesh(G.torus(0.25, Math.PI, 16), M.basic('#C2742E'), { p: [0, -1.6, 8.7], r: [0, 0, Math.PI], s: 2, parent: this.sun, cast: false });
    for (const k of [-1, 1]) mesh(G.sphere(12), M.basic('#FF9F7A'), { p: [k * 5, -1, 7.6], s: [1.3, 0.8, 0.3], parent: this.sun, cast: false });
    this.sunSq = new Spring(1, 200, 7);
    // moon and stars for the night
    this.moon = group(W, [32, 26, -150]);
    mesh(G.sphere(32), new THREE.MeshBasicMaterial({ color: '#FFF4C8' }), { s: 6, parent: this.moon, cast: false });
    mesh(G.sphere(24), M.glow('#FFF0B0', { opacity: 0.2 }), { s: 11, parent: this.moon, cast: false });
    const sg = new THREE.BufferGeometry();
    const sp = new Float32Array(600);
    for (let i = 0; i < 200; i++) { sp[i * 3] = rand(-160, 160); sp[i * 3 + 1] = rand(10, 90); sp[i * 3 + 2] = -160 - rand(0, 20); }
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starsPts = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#FFF6C8', size: 1.4, sizeAttenuation: true, transparent: true, opacity: 0.9, fog: false }));
    W.add(this.starsPts);
    // fireflies / butterflies
    this.flies = [];
    for (let i = 0; i < 6; i++) {
      const f = mesh(G.sphere(10), M.glow(pick(['#FFF2A8', '#FFC4E8', '#BDF0FF']), { opacity: 0.9 }), { s: 0.12, parent: W, cast: false });
      f.userData = { a: rand(TAU), base: V(rand(-8, 8), rand(0.6, 2.2), rand(-24, -12)), ph: rand(TAU) };
      this.flies.push(f);
    }
  },

  applySky(first) {
    const s = SKY[this.mode], st = this.stage;
    st.scene.background = skyTexture(s.bg);
    st.scene.fog = new THREE.Fog(s.fog, 60, 230);
    st.hemi.intensity = s.hemi;
    st.key.intensity = s.key;
    st.key.color.set(s.keyColor);
    this.groundMat.color.set(s.grass);
    for (const h of this.hills) h.material.color.set(s.hill[h.userData.k]);
    const night = this.mode === 'night';
    this.moon.visible = night;
    this.starsPts.visible = night;
    this.sun.visible = !night;
    this.sun.position.y = this.mode === 'sunset' ? -2 : 10;
    this.sunBall.material.color.set(this.mode === 'sunset' ? '#FFB066' : '#FFE070');
    for (const f of this.flies) f.material.opacity = night ? 1 : 0.0;
    for (const r of this.residents || []) r.c.sleep = night && Math.random() < 0.6;
    if (!first) for (const b of this.bubbles) b.sq.kick(3);
  },

  // ---- world bubbles -------------------------------------------------------------
  makeBubble(w, i) {
    const g = group(this.world);
    const inner = group(g);
    // a pastel medallion behind the toy so each ball reads as a button
    const disc = mesh(G.sphere(36), M.toy(w.color, { roughness: 0.35, clearcoat: 0.8 }), { s: [0.86, 0.86, 0.2], p: [0, 0, -0.35], parent: inner, cast: false });
    mesh(G.torus(0.07, TAU, 48), M.glossy('#FFFFFF', { roughness: 0.15 }), { s: 0.86, p: [0, 0, -0.32], parent: inner, cast: false });
    let toy;
    let crit = null;
    if (w.id === 'pet') {
      crit = new Critter('bunny', { size: 0.42, shadow: false });
      crit.root.position.set(0, -0.42, 0.05);
      toy = group(inner);
      toy.add(crit.root);
    } else {
      toy = makeWorldToy(w.id);
      toy.scale.setScalar(0.6);
      toy.position.z = 0.1;
      inner.add(toy);
    }
    toy.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    if (!crit) bake(toy);
    bake(inner, [toy]);
    const glass = mesh(G.sphere(40), M.bubble(), { s: 1, parent: g, cast: false });
    glass.renderOrder = 2;
    // a sparkle that orbits the worlds she has not visited yet
    let spark = null;
    if (w.fresh && !save.data.seen['w:' + w.id]) {
      spark = mesh(G.puffy('star4', starShape(4, 1, 0.36), 0.2, 0.1), M.glow('#FFF4A0', { opacity: 1 }), { s: 0.14, parent: g, cast: false });
    }
    return { ...w, g, inner, toy, crit, glass, disc, spark, sq: new Spring(1, 340, 11), spin: new Spring(0, 60, 5), phase: i * 1.7, enter: 0, x: 0, y: 0, r: 40, wr: 1 };
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    const st = this.stage, cam = this.cam;
    const wide = W > H;
    // horizon low enough that the sky can hold every world, high enough for the meadow
    this.horizon = H * (wide ? 0.7 : 0.75);
    cam.fov = 36;
    cam.aspect = W / H;
    const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const pitch = Math.atan((this.horizon / H - 0.5) * 2 * tanH);
    cam.position.set(0, 3, 0);
    cam.rotation.set(pitch, 0, 0);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    const cols = wide ? 6 : W >= 600 ? 4 : 3;
    const rows = Math.ceil(this.bubbles.length / cols);
    const topY = Math.max(app.safeTop, 8) + (wide ? 14 : 22);
    const areaH = this.horizon - topY + (wide ? 8 : 4);
    const r = this.r = Math.min((W - 24) / (cols * 2.22), areaH / (rows * (wide ? 2.14 : 2.04)), 76);
    const stepY = Math.min((areaH - r * 2) / Math.max(1, rows - 1), r * 2.35);
    const y0 = topY + r + Math.max(0, (areaH - r * 2 - stepY * (rows - 1)) * 0.4);
    const spanX = Math.min(r * 2.62, (W - 2 * r - 20) / (cols - 1));
    const plane = V(0, 0, -16);
    this.bubbles.forEach((b, i) => {
      const row = Math.floor(i / cols), ci = i % cols;
      const count = Math.min(cols, this.bubbles.length - row * cols);
      b.x = W / 2 - ((count - 1) * spanX) / 2 + ci * spanX;
      b.y = y0 + row * stepY;
      const p = st.onFacing(b.x, b.y, plane);
      b.home = p.clone();
      b.wr = r * st.unitsPerPx(p);
      b.g.position.copy(p);
      b.g.quaternion.copy(cam.quaternion);
    });
    // the meadow: walkable band in front of the camera
    const near = st.onPlane(W / 2, H - (H - this.horizon) * 0.42, 0), far = st.onPlane(W / 2, this.horizon + (H - this.horizon) * 0.2, 0);
    this.meadow = { z0: far ? far.z : -22, z1: near ? near.z : -11 };
    const zMid = (this.meadow.z0 + this.meadow.z1) / 2;
    const edge = st.onPlane(16, H - 60, 0);
    this.meadow.x = edge ? Math.abs(edge.x) * 0.82 : 6;
    st.shadowArea(Math.max(12, this.meadow.x * 1.4), V(0, 0, zMid));
    // big front flowers that play like a harp
    if (this.harp) this.harp.forEach((f) => this.world.remove(f.g));
    const nH = Math.max(4, Math.floor((W - 140) / 82));
    this.harp = [];
    const hcols = ['#FF82AF', '#FFB54D', '#6FD8FF', '#B48BFF', '#FF8F7A', '#7FE3A0', '#FFD45C'];
    for (let i = 0; i < nH; i++) {
      const sx = 130 + ((W - 145) * (i + 0.5)) / nH;
      const pt = st.onPlane(sx, H - 6 - app.safeBottom * 0.4, 0) || V(0, 0, -10);
      const g = group(this.world, [pt.x, 0, pt.z]);
      const s = st.unitsPerPx(pt) * 34;
      g.scale.setScalar(s);
      const col = hcols[i % hcols.length];
      mesh(G.cyl(8), M.toy('#5FBF72'), { p: [0, 0.6, 0], s: [0.06, 1.2, 0.06], parent: g, cast: false });
      mesh(G.sphere(12), M.toy('#7FD86F'), { p: [0.18, 0.45, 0], r: [0, 0, -0.8], s: [0.24, 0.08, 0.12], parent: g, cast: false });
      const head = group(g, [0, 1.25, 0]);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        mesh(G.sphere(14), M.toy(col), { p: [Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0], s: [0.2, 0.2, 0.1], parent: head, cast: false });
      }
      mesh(G.sphere(16), M.toy('#FFF2A8'), { p: [0, 0, 0.05], s: [0.17, 0.17, 0.1], parent: head, cast: false });
      bake(head);
      bake(g, [head]);
      this.harp.push({ g, head, x: sx, y: H - 6 - 30, note: i, sq: new Spring(1, 300, 8), lean: new Spring(0, 160, 6), glow: 0 });
    }
    if (this.nest) this.placeNest();
    if (this.buttons && this.buttons.length) this.placeButtons();
  },

  resize() {
    this.layout();
    for (const r of this.residents) {
      r.tx = clamp(r.tx, -this.meadow.x, this.meadow.x * 0.6);
      r.tz = clamp(r.tz, this.meadow.z0, this.meadow.z1);
      r.c.root.position.x = r.tx;
      r.c.root.position.z = r.tz;
    }
  },

  meadowCap() { return this.W > 900 ? 8 : this.W > 640 ? 7 : 5; },
  randSpot() { return [rand(-this.meadow.x, this.meadow.x * 0.55), rand(this.meadow.z0, this.meadow.z1)]; },

  fillResidents() {
    const chosen = meadowList(this.meadowCap());
    chosen.forEach((id, i) => {
      const u = chosen.length > 1 ? i / (chosen.length - 1) : 0.5;
      const x = lerp(-this.meadow.x, this.meadow.x * 0.55, u);
      const z = lerp(this.meadow.z0, this.meadow.z1, (i * 0.37) % 1);
      this.addResident(id, x, z);
    });
  },
  addResident(id, x, z) {
    const r = makeResident(this, id, x, z);
    this.world.add(r.c.root);
    r.c.sleep = this.mode === 'night' && Math.random() < 0.6;
    this.residents.push(r);
    return r;
  },

  buildNest() {
    const n = this.nest = { g: group(this.world), egg: null, sq: new Spring(1, 420, 10), taps: 0, wob: 0 };
    const straw = M.toy('#E3B26C', { roughness: 0.85 });
    for (let i = 0; i < 3; i++) mesh(G.torus(0.32, TAU, 32), straw, { p: [0, 0.18 + i * 0.12, 0], r: [Math.PI / 2, 0, i], s: [0.95 - i * 0.05, 0.95 - i * 0.05, 0.8], parent: n.g });
    n.eggG = group(n.g, [0, 0.35, 0]);
    const tex = eggTex('#FFF3F8', '#FF9FC6', '#FFD7EA', 3);
    n.egg = mesh(eggShape(), PM({ map: tex, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12 }), { p: [0, 0.75, 0], s: 0.72, parent: n.eggG });
    // star slots: three stars make an egg
    n.stars = [];
    for (let i = 0; i < 3; i++) {
      const s = mesh(G.puffy('star', starShape(5, 1, 0.5), 0.3, 0.15), M.glossy('#FFC233'), { s: 0.24, parent: n.g, cast: false });
      n.stars.push(s);
    }
    // a second egg waiting its turn
    n.count = mesh(eggShape(), n.egg.material, { s: 0.42, p: [0.95, 0.42, 0.25], r: [0, 0, -0.5], parent: n.g, cast: false });
    const sh = blobShadow(1.2, 0.35);
    sh.position.y = 0.02;
    n.g.add(sh);
    bake(n.g, [n.eggG, ...n.stars, n.count]);
    this.placeNest();
  },
  placeNest() {
    const st = this.stage, n = this.nest;
    const sx = this.W - Math.min(92, this.W * 0.2), sy = this.horizon + (this.H - this.horizon) * 0.55;
    const p = st.onPlane(sx, sy, 0) || V(5, 0, -14);
    n.g.position.copy(p);
    n.g.scale.setScalar(st.unitsPerPx(p) * 46);
    n.x = sx; n.y = sy;
  },

  updateHint() {
    if (save.data.eggs > 0 && !this.hatch && save.data.friends.length < 3) {
      const s = this.stage.objScreen(this.nest.egg);
      hint.set({ from: [s.x, s.y], delay: 1.8 });
    } else if (!save.data.seen.hub) {
      const b = this.bubbles[0];
      hint.set({ from: [b.x, b.y], delay: 6 });
    } else hint.clear();
  },

  launchStar() {
    audio.sparkle(2, 3);
    const s = mesh(G.puffy('star', starShape(5, 1, 0.5), 0.3, 0.15), M.glossy('#FFC233', { emissive: '#FFA000', emissiveIntensity: 0.4 }), { s: 0.01, parent: this.world, cast: false });
    const from = this.stage.onFacing(this.W / 2, this.H * 0.45, V(0, 0, -10));
    const to = this.nest.g.position.clone().add(V(0, 1.4 * this.nest.g.scale.x, 0));
    s.position.copy(from);
    const o = { k: 0, u: 0 };
    tween(o, { k: 1 }, 0.3, { ease: E.back });
    tween(o, { u: 1 }, 0.95, {
      ease: E.io, delay: 0.3, done: () => {
        this.world.remove(s);
        const sc = this.stage.toScreen(to);
        fx.stars(sc.x, sc.y, 12);
        this.nest.sq.kick(4);
        audio.note('bell', 84, { vol: 0.5 });
      }
    });
    this.flyStars.push({ s, o, from, to });
  },

  // ---- per frame ----------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    // bubbles bob, breathe, spin their toys
    for (const b of this.bubbles) {
      const k = b.sq.step(dt) * Math.max(0.001, b.enter);
      b.spin.step(dt);
      b.g.position.copy(b.home);
      b.g.position.y += Math.sin(t * 1.3 + b.phase) * b.wr * 0.05;
      const sx = k * (1 + (1 - b.sq.x) * 0.25);
      b.g.scale.set(b.wr * sx, b.wr * k, b.wr * k);
      b.toy.rotation.y = Math.sin(t * 0.7 + b.phase) * 0.45 + b.spin.x;
      b.toy.position.y = Math.sin(t * 2 + b.phase) * 0.03 + (b.crit ? 0 : 0);
      if (b.crit) b.crit.update(dt);
      if (b.spark) {
        const a = t * 1.8 + b.phase;
        b.spark.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.3);
        b.spark.rotation.z = t * 2;
        b.spark.scale.setScalar(0.12 + Math.sin(t * 6 + b.phase) * 0.03);
      }
    }
    // clouds drift and wobble
    for (const cl of this.clouds) {
      cl.position.x += cl.userData.v * dt;
      if (cl.position.x > 90) cl.position.x = -90;
      const s = cl.userData.sq.step(dt);
      cl.scale.y = cl.scale.x * s;
    }
    for (const tr of this.trees) {
      const s = tr.userData.sq.step(dt);
      tr.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      tr.rotation.z = Math.sin(t * 0.8 + tr.userData.ph) * 0.02;
    }
    const sq = this.sunSq.step(dt);
    this.sun.scale.setScalar(sq);
    this.sunGlow.scale.setScalar(15 + Math.sin(t * 1.5) * 0.8);
    this.sun.rotation.z = Math.sin(t * 0.5) * 0.05;
    for (const f of this.flies) {
      const u = f.userData;
      u.ph += dt;
      f.position.set(u.base.x + Math.sin(u.ph * 0.7) * 3, u.base.y + Math.sin(u.ph * 1.9) * 0.5, u.base.z + Math.cos(u.ph * 0.5) * 2);
    }
    for (const h of this.harp) {
      const s = h.sq.step(dt);
      h.head.scale.setScalar(s);
      h.g.rotation.z = h.lean.step(dt) * 0.12 + Math.sin(t * 1.4 + h.note) * 0.03;
      h.head.rotation.z = t * 0.3 + h.note;
    }
    // nest, egg and star slots
    const n = this.nest;
    const ns = n.sq.step(dt);
    n.wob += dt;
    n.eggG.visible = save.data.eggs > 0 && !this.hatch;
    n.eggG.scale.set(1 / Math.sqrt(ns), ns, 1 / Math.sqrt(ns));
    n.eggG.rotation.z = Math.sin(n.wob * (n.taps ? 14 : 3)) * (0.05 + n.taps * 0.06) * (n.taps || Math.sin(t * 0.7) > 0.6 ? 1 : 0.3);
    n.stars.forEach((s, i) => {
      const on = i < save.data.stars;
      s.position.set((i - 1) * 0.7, 2.75 - Math.abs(i - 1) * 0.2 + Math.sin(t * 2 + i) * 0.05, 0.2);
      s.material = on ? STAR_ON : STAR_OFF;
      s.rotation.y = on ? t * 1.5 + i : 0;
    });
    n.count.visible = save.data.eggs > 1;

    this.updateResidents(dt);
    this.updateSmall(dt);
    this.updateGift(dt);
    for (const f of this.flyStars) {
      const k = f.o.k, u = f.o.u;
      f.s.scale.setScalar(0.5 * k);
      f.s.position.lerpVectors(f.from, f.to, u);
      f.s.position.y += Math.sin(u * Math.PI) * 2;
      f.s.rotation.y = u * 8;
    }
    this.flyStars = this.flyStars.filter((f) => f.o.u < 1);

    this.nudgeT -= dt;
    if (this.nudgeT <= 0 && !this.hatch) {
      this.nudgeT = rand(3.2, 6);
      const b = pick(this.bubbles);
      b.sq.kick(2);
      b.spin.kick(rand(-6, 6));
      fx.sparkle(b.x + rand(-this.r, this.r) * 0.6, b.y - this.r * 0.8, 3);
    }
    if (this.hatch) this.updateHatch(dt);
  },

  updateResidents(dt) {
    const cam = this.cam.position;
    for (const r of this.residents) {
      const c = r.c, p = c.root.position;
      const dx = r.tx - p.x, dz = r.tz - p.z, d = Math.hypot(dx, dz);
      if (d > 0.08 && !c.sleep) {
        const v = 1.3 * dt;
        p.x += (dx / d) * Math.min(v, d);
        p.z += (dz / d) * Math.min(v, d);
        r.walk += dt * 9;
        c.root.rotation.y += (clamp(Math.atan2(dx, dz), -1.1, 1.1) - c.root.rotation.y) * Math.min(1, dt * 6);
        if (c.y <= 0 && Math.sin(r.walk) > 0.95) c.hop(2.2);
      } else {
        c.root.rotation.y += (0 - c.root.rotation.y) * Math.min(1, dt * 3);
        r.idle -= dt;
        if (r.idle <= 0) {
          r.idle = rand(2.5, 7);
          if (c.sleep) {
            if (Math.random() < 0.4) audio.voice('snore', c.voicePitch, 0.12);
            continue;
          }
          const act = Math.random();
          if (act < 0.55) [r.tx, r.tz] = this.randSpot();
          else if (act < 0.75) {
            c.hop(4.5);
            if (Math.random() < 0.35) c.say(pick(['chirp', 'hehe', 'coo']), 0.18);
          } else if (act < 0.88) c.wave();
          else {
            // greet a neighbour: both turn to each other and chat
            const o = pick(this.residents);
            if (o !== r) { c.look(o.c.root.position.clone().add(V(0, 0.6, 0))); r.greet = 2; c.say('hehe', 0.15); }
          }
        }
      }
      r.greet = Math.max(0, r.greet - dt);
      if (r.greet <= 0 && !this.hatch) c.look(cam);
      c.update(dt);
    }
  },

  updateSmall(dt) {
    this.smallT -= dt;
    if (this.smallT <= 0 && this.small.length < 6 && !this.hatch) {
      this.smallT = rand(1.4, 3.4);
      const x = rand(-this.meadow.x, this.meadow.x), z = rand(this.meadow.z0, this.meadow.z1);
      const s = mesh(G.sphere(20), M.bubble({ opacity: 0.3 }), { p: [x, 0.5, z], s: rand(0.22, 0.4), parent: this.world, cast: false });
      s.renderOrder = 3;
      this.small.push({ m: s, v: rand(0.6, 1.2), ph: rand(TAU), x });
    }
    for (const s of this.small) {
      s.ph += dt;
      s.m.position.y += s.v * dt;
      s.m.position.x = s.x + Math.sin(s.ph * 1.6) * 0.3;
      if (s.m.position.y > 14) { this.world.remove(s.m); s.dead = true; }
    }
    this.small = this.small.filter((s) => !s.dead);
  },

  updateGift(dt) {
    this.giftT -= dt;
    if (this.giftT <= 0 && !this.gift && !this.hatch) {
      this.giftT = rand(32, 62);
      const g = group(this.world);
      const kind = pick(['#FF6F9B', '#6FC4FF', '#FFC233', '#B48BFF']);
      mesh(G.box(0.12), M.toy(kind), { s: 0.8, parent: g });
      mesh(G.box(0.05), M.toy('#FFFFFF'), { s: [0.84, 0.84, 0.18], parent: g, cast: false });
      mesh(G.box(0.05), M.toy('#FFFFFF'), { s: [0.18, 0.84, 0.84], parent: g, cast: false });
      for (const k of [-1, 1]) mesh(G.sphere(12), M.glossy('#FFFFFF'), { p: [k * 0.2, 0.5, 0], s: [0.22, 0.14, 0.1], parent: g, cast: false });
      const bal = mesh(G.sphere(24), M.glossy(pick(['#FF5C8F', '#FFC233', '#5698FF'])), { p: [0, 2.2, 0], s: [0.7, 0.85, 0.7], parent: g, cast: false });
      mesh(G.cyl(4), M.basic('#FFFFFF'), { p: [0, 1, 0], s: [0.015, 1.4, 0.015], parent: g, cast: false });
      const x = rand(-6, 6);
      g.position.set(x, -3, -14);
      this.gift = { g, x, ph: rand(TAU), sq: new Spring(1, 300, 9), bal };
    }
    const gf = this.gift;
    if (gf) {
      gf.ph += dt;
      gf.g.position.y += 1.2 * dt;
      gf.g.position.x = gf.x + Math.sin(gf.ph * 0.9) * 1.2;
      gf.g.rotation.z = Math.sin(gf.ph * 1.3) * 0.12;
      const s = gf.sq.step(dt);
      gf.g.scale.setScalar(s);
      if (gf.g.position.y > 22) { this.world.remove(gf.g); this.gift = null; }
    }
  },

  draw(c) {
    if (this.hatch) this.drawHatch(c);
    else for (const b of this.buttons) b.draw(c);
  },

  // ---- input -----------------------------------------------------------------------
  down(p) {
    if (this.hatch) { this.tapHatch(p); return; }
    const st = this.stage;
    // gift
    if (this.gift) {
      const s = st.objScreen(this.gift.g);
      const sb = st.objScreen(this.gift.bal);
      if (dist(p.x, p.y, s.x, s.y) < 60 || dist(p.x, p.y, sb.x, sb.y) < 50) {
        fx.burst(s.x, s.y, { kind: 'confetti', n: 26, speed: 260 });
        fx.stars(s.x, s.y, 10);
        audio.sfx('poof');
        audio.success();
        haptic();
        this.world.remove(this.gift.g);
        this.gift = null;
        save.earnStar();
        save.data.pendingStars = 0;
        wait(0.2, () => this.launchStar());
        return;
      }
    }
    for (const s of this.small) {
      const sc = st.objScreen(s.m);
      if (dist(p.x, p.y, sc.x, sc.y) < 30) {
        audio.sfx('bubble', { rate: rand(0.8, 1.3) });
        audio.note('bell', penta(Math.floor(rand(0, 9))), { vol: 0.28 });
        fx.bubbles(sc.x, sc.y, 5);
        this.world.remove(s.m);
        s.dead = true;
        this.small = this.small.filter((q) => !q.dead);
        return;
      }
    }
    for (const b of this.bubbles) {
      if (dist(p.x, p.y, b.x, b.y) < this.r + 6) {
        p.bubble = b;
        b.sq.to = 0.84;
        b.sq.kick(-2);
        b.spin.kick(8);
        if (b.crit) { b.crit.poke(); b.crit.say('hehe', 0.4); }
        audio.note('kalimba', penta(b.note), { vol: 0.62 });
        haptic();
        return;
      }
    }
    // egg
    if (save.data.eggs > 0) {
      const e = st.objScreen(this.nest.egg);
      if (dist(p.x, p.y, e.x, e.y) < 70) { this.tapEgg(); return; }
    }
    // friends
    const hit = st.pick(p.x, p.y, this.residents.map((r) => r.c.root));
    if (hit) {
      const r = this.residents.find((q) => q.c.root.getObjectById(hit.object.id));
      if (r) {
        const c = r.c;
        if (c.sleep) {
          c.sleep = false;
          c.setMood('wow', 0.8);
          c.say('yawn', 0.5);
        } else {
          c.poke();
          c.hop(5.5);
          c.setMood(pick(['happy', 'wow', 'happy']), 1.1);
          c.say(pick(['giggle', 'yay', 'hehe', 'wow', 'mew']), 0.6);
        }
        const s = st.objScreen(c.body);
        fx.hearts(s.x, s.y - 20, 4);
        haptic();
        return;
      }
    }
    for (const h of this.harp) {
      const s = st.objScreen(h.head);
      if (dist(p.x, p.y, s.x, s.y) < 34) { this.playFlower(h); p.flowerSlide = h; return; }
    }
    // sun or moon changes the time of day
    const sunObj = this.mode === 'night' ? this.moon : this.sun;
    const ss = st.objScreen(sunObj);
    if (dist(p.x, p.y, ss.x, ss.y) < 60) { this.nextSky(); return; }
    // clouds and trees
    const hc = st.pick(p.x, p.y, [...this.clouds, ...this.trees]);
    if (hc) {
      let o = hc.object;
      while (o.parent && !this.clouds.includes(o) && !this.trees.includes(o)) o = o.parent;
      o.userData.sq.kick(this.clouds.includes(o) ? 5 : 4);
      audio.sfx(this.clouds.includes(o) ? 'blup' : 'boing', { rate: rand(0.8, 1.2), vol: 0.6 });
      fx.burst(p.x, p.y, { kind: this.clouds.includes(o) ? 'bubble' : 'heart', n: 6, speed: 80, g: 200, colors: [P.sky, P.white, P.pink], size: 14, life: 0.9, spin: 0 });
      return;
    }
    fx.sparkle(p.x, p.y, 5);
    audio.sfx('plip', { rate: rand(0.9, 1.3), vol: 0.5 });
  },

  move(p) {
    if (p.bubble && dist(p.x, p.y, p.bubble.x, p.bubble.y) > this.r + 30) {
      p.bubble.sq.to = 1;
      p.bubble = null;
    }
    if (p.flowerSlide) {
      for (const h of this.harp) {
        if (h !== p.flowerSlide && Math.abs(p.x - h.x) < 26) {
          this.playFlower(h);
          p.flowerSlide = h;
          break;
        }
      }
    }
  },

  up(p, cancelled) {
    const b = p.bubble;
    if (!b) return;
    b.sq.to = 1;
    b.sq.kick(4);
    if (cancelled) return;
    save.data.seen.hub = 1;
    save.data.seen['w:' + b.id] = 1;
    save.touch();
    audio.sfx('bubble', { rate: 0.7, vol: 0.8 });
    fx.bubbles(b.x, b.y, 12);
    fx.sparkle(b.x, b.y, 10);
    go(b.id, null, { x: b.x, y: b.y });
  },

  playFlower(h) {
    h.sq.kick(5);
    h.lean.kick(rand(-3, 3));
    audio.note('harp', penta(h.note - 2), { vol: 0.7, wet: 0.7 });
    const s = this.stage.objScreen(h.head);
    fx.sparkle(s.x, s.y, 3);
    haptic();
  },

  // ---- eggs: three taps, and a brand-new friend ---------------------------------------
  tapEgg() {
    const n = this.nest;
    n.taps++;
    n.sq.kick(7);
    audio.note('kalimba', penta(2 + n.taps * 2), { vol: 0.8 });
    audio.sfx('crack', { vol: 0.5 + n.taps * 0.15 });
    const s = this.stage.objScreen(n.egg);
    fx.sparkle(s.x, s.y, 8 + n.taps * 4);
    haptic();
    if (n.taps >= 3) this.startHatch();
    else hint.set({ from: [s.x, s.y], delay: 1.2 });
  },

  startHatch() {
    hint.clear();
    save.data.eggs--;
    const owned = new Set(save.data.friends);
    const fresh = FRIEND_IDS.filter((f) => !owned.has(f));
    const plain = FRIEND_IDS.filter((f) => !save.data.shiny.includes(f));
    const id = fresh.length ? fresh[Math.floor(Math.random() * Math.min(5, fresh.length))] : pick(plain.length ? plain : FRIEND_IDS);
    const isNew = !owned.has(id);
    if (isNew) {
      save.data.friends.push(id);
      inviteToMeadow(id, this.meadowCap());
    } else if (!save.data.shiny.includes(id)) {
      save.data.shiny.push(id);
      inviteToMeadow(id, this.meadowCap());
    }
    const item = unlockNextItem();
    save.touch();
    this.nest.taps = 0;
    // the stage for the new friend: a dimmed world, turning rays, the friend up close
    const st = this.stage, cam = this.cam;
    const g = group(st.scene);
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    g.position.copy(cam.position).addScaledVector(fwd, 7);
    g.quaternion.copy(cam.quaternion);
    const dim = mesh(G.plane(), new THREE.MeshBasicMaterial({ color: '#2E1E66', transparent: true, opacity: 0, depthWrite: false, fog: false }), { s: [60, 60, 1], p: [0, 0, -1.5], parent: g, cast: false });
    const rays = mesh(G.plane(), new THREE.MeshBasicMaterial({ map: raysTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), { s: [14, 14, 1], p: [0, 0.2, -1.2], parent: g, cast: false });
    const crit = new Critter(id, { size: 1 });
    if (save.data.shiny.includes(id)) addCrown(crit);
    crit.root.position.set(0, -1.15, 0);
    crit.root.scale.setScalar(0.01);
    g.add(crit.root);
    crit.setMood('wow', 1);
    // shell halves fly away
    const shells = [];
    for (const k of [-1, 1]) {
      const sh = mesh(eggShape(), this.nest.egg.material, { s: [0.9, 0.5, 0.9], p: [0, 0.1, 0], parent: g, cast: false });
      if (k > 0) sh.rotation.x = Math.PI;
      shells.push({ m: sh, v: V(k * 2.4, 3.5 + k, 1.5), spin: k * 5 });
    }
    this.hatch = { id, t: 0, a: 0, ready: false, item, g, dim, rays, crit, shells, closing: false };
    audio.fanfare();
    audio.sfx('shell');
    wait(0.15, () => crit.say('yay', 0.8));
    fx.confetti(this.W, this.H, 80);
    fx.burst(this.W / 2, this.H * 0.46, { kind: 'star', n: 26, colors: [P.sun, P.butter], speed: 400, size: 24, g: 300, life: 1.2 });
    wait(0.9, () => { if (this.hatch) this.hatch.ready = true; });
    wait(1.1, () => this.hatch && crit.say('giggle', 0.7));
  },

  updateHatch(dt) {
    const h = this.hatch;
    h.t += dt;
    const fade = h.closing ? clamp(1 - (h.t - h.closeAt) / 0.45) : clamp(h.t / 0.35);
    h.dim.material.opacity = 0.62 * fade;
    h.rays.material.opacity = 0.9 * fade;
    h.rays.rotation.z = this.t * 0.35;
    const k = h.closing ? fade : E.back(clamp(h.t / 0.55));
    h.crit.root.scale.setScalar(Math.max(0.01, k * 1.0));
    h.crit.update(dt);
    h.crit.look(this.cam.position);
    if (h.t > 0.8 && h.crit.y <= 0 && Math.random() < dt * 0.9) { h.crit.hop(5); h.crit.setMood('happy', 0.8); }
    for (const s of h.shells) {
      s.v.y -= 9 * dt;
      s.m.position.addScaledVector(s.v, dt);
      s.m.rotation.z += s.spin * dt;
      s.m.visible = h.t < 1.6;
    }
    if (h.closing && fade <= 0) {
      this.stage.scene.remove(h.g);
      h.crit.dispose();
      const id = h.id;
      this.hatch = null;
      if (!this.residents.find((r) => r.id === id)) {
        const [x, z] = this.randSpot();
        const R = this.addResident(id, 0, (this.meadow.z0 + this.meadow.z1) / 2);
        R.tx = x; R.tz = z;
        R.c.hop(6);
        R.c.wave();
        if (this.residents.length > this.meadowCap()) {
          const stay = meadowList(this.meadowCap());
          const idx = this.residents.findIndex((r) => !stay.includes(r.id));
          if (idx >= 0) {
            const gone = this.residents.splice(idx, 1)[0];
            this.world.remove(gone.c.root);
          }
        }
      }
      audio.success();
      this.updateHint();
    }
  },

  tapHatch(p) {
    const h = this.hatch;
    h.crit.hop(6);
    h.crit.poke();
    h.crit.setMood('happy', 1);
    h.crit.say(pick(['giggle', 'yay', 'hehe', 'mew']), 0.7);
    fx.hearts(p.x, p.y, 6);
    haptic();
    if (!h.ready || h.t < 1.2 || h.closing) return;
    h.closing = true;
    h.closeAt = h.t + 0.4;
  },

  drawHatch(c) {
    const h = this.hatch;
    if (!h.item) return;
    const fade = h.closing ? clamp(1 - (h.t - h.closeAt) / 0.45) : 1;
    const k = E.back(clamp((h.t - 0.6) / 0.4)) * fade;
    if (k <= 0) return;
    const ix = this.W / 2, iy = this.H * 0.5 + Math.min(this.H * 0.3, 230);
    c.save();
    c.translate(ix, iy + Math.sin(this.t * 2.2) * 4);
    c.scale(k, k);
    c.shadowColor = 'rgba(40,20,90,.35)';
    c.shadowBlur = 14;
    c.shadowOffsetY = 5;
    c.fillStyle = 'rgba(255,255,255,.96)';
    ell(c, 0, 0, 46);
    c.fill();
    c.shadowColor = 'transparent';
    c.lineWidth = 4;
    c.strokeStyle = P.butter;
    c.stroke();
    drawGiftItem(c, h.item, 62);
    c.restore();
  }
};

const STAR_ON = M.glossy('#FFC233', { emissive: '#FFA000', emissiveIntensity: 0.25 });
const STAR_OFF = M.toy('#FFFFFF', { transparent: true, opacity: 0.55 });
let raysT = null;
function raysTex() {
  if (raysT) return raysT;
  raysT = canvasTex(512, 512, (x) => {
    x.translate(256, 256);
    for (let i = 0; i < 14; i++) {
      x.rotate(TAU / 14);
      const g = x.createLinearGradient(0, 0, 0, -256);
      g.addColorStop(0, 'rgba(255,240,170,.75)');
      g.addColorStop(1, 'rgba(255,240,170,0)');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(-34, -256); x.lineTo(34, -256); x.closePath(); x.fill();
    }
    const r = x.createRadialGradient(0, 0, 0, 0, 0, 200);
    r.addColorStop(0, 'rgba(255,250,220,.9)');
    r.addColorStop(1, 'rgba(255,250,220,0)');
    x.fillStyle = r;
    x.fillRect(-256, -256, 512, 512);
  });
  return raysT;
}

/** Who lives on the meadow: her own choice first, then the newest friends. */
export function meadowList(cap) {
  const all = save.data.friends;
  const mine = (save.data.meadow || []).filter((f) => all.includes(f));
  if (save.data.meadow && mine.length) return mine.slice(0, cap);
  return [...new Set(['moko', ...[...all].reverse()])].filter((f) => all.includes(f)).slice(0, cap);
}

/** The newest arrival always gets to come out and play. */
function inviteToMeadow(id, cap) {
  const m = save.data.meadow;
  if (!m) return;
  if (!m.includes(id)) m.unshift(id);
  if (m.length > cap) m.length = cap;
}
