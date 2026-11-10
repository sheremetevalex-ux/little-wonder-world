// Squishy Studio: big soft toys that really give under a finger. Every vertex is
// on its own little spring, so a press makes a dent that bulges around it, a drag
// pulls the jelly out like taffy (and the toy sings higher the further it
// stretches), and letting go makes the whole thing wobble back. She can paint
// them, change their faces, sprinkle toppings on top, and squeezing enough
// times makes a tiny baby squishy pop out to play.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, TAU, softStar, heart } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lighten, darken, starShape } from '../core/stage.js';

const TYPES = [
  { id: 'cat', color: '#FFB3CF', mat: 'plush', voice: 1.15 },
  { id: 'bear', color: '#FF6FA8', mat: 'jelly', voice: 1.0 },
  { id: 'peach', color: '#FFB08A', mat: 'plush', voice: 1.1 },
  { id: 'cloud', color: '#BFE3FF', mat: 'soft', voice: 1.3 },
  { id: 'drop', color: '#7CE6C8', mat: 'jelly', voice: 0.95 },
  { id: 'star', color: '#FFD45C', mat: 'glossy', voice: 1.25 }
];
const COLORS = ['#FFB3CF', '#FF6FA8', '#FFB08A', '#FFE066', '#9FE8A8', '#7CE6C8', '#8FD0FF', '#B9A4FF', '#FFFFFF'];
const FACES = ['dots', 'sparkle', 'happy', 'sleepy'];
const TOPS = ['none', 'sprinkles', 'hearts', 'stars', 'cherry', 'bow'];

function data() {
  return save.data.squishy || (save.data.squishy = { type: 0, looks: {}, squeezes: 0 });
}

// ---- shapes: everything is a deformed sphere, so it squishes smoothly ----------------------
function shapeGeometry(id) {
  const g = new THREE.SphereGeometry(1, 72, 54);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const th = Math.atan2(v.x, v.z), y = v.y;
    let r = 1, sx = 1, sy = 0.9, sz = 0.9;
    if (id === 'cat') {
      // ears grow out of the same skin
      for (const s of [-1, 1]) {
        const ex = s * 0.55, ey = 0.78;
        const d = Math.hypot(v.x - ex, v.y - ey, v.z - 0.1);
        r += 0.5 * Math.exp(-(d * d) / 0.035);
      }
      sy = 0.86; sx = 1.08;
    } else if (id === 'bear') {
      for (const s of [-1, 1]) {
        const d = Math.hypot(v.x - s * 0.62, v.y - 0.72, v.z);
        r += 0.32 * Math.exp(-(d * d) / 0.05);
      }
    } else if (id === 'peach') {
      // the crease down the middle and a little point at the top
      r -= 0.07 * Math.exp(-(v.x * v.x) / 0.01) * (v.z < 0.2 ? 1 : 0.4) * Math.max(0, y + 0.3);
      r += 0.15 * Math.exp(-((v.x * v.x + v.z * v.z) / 0.06)) * Math.max(0, y);
      sy = 0.95;
    } else if (id === 'cloud') {
      const bumps = Math.cos(th * 5) * 0.5 + 0.5;
      r += 0.14 * bumps * (1 - Math.abs(y)) + 0.1 * Math.max(0, y) * (Math.cos(v.x * 9) * 0.5 + 0.5);
      sx = 1.3; sy = 0.78; sz = 0.85;
    } else if (id === 'drop') {
      const k = (y + 1) / 2;
      r = 1 - 0.55 * Math.pow(k, 3);
      v.y += 0.35 * Math.pow(Math.max(0, y), 3);
      sy = 1.05;
    } else if (id === 'star') {
      const a = Math.atan2(v.y, v.x);
      const st = 0.62 + 0.38 * Math.pow(Math.abs(Math.cos(((a - Math.PI / 2) * 5) / 2)), 1.6);
      const flat = Math.sqrt(Math.max(0, 1 - v.z * v.z));
      v.x = (v.x / (flat || 1)) * flat * st * 1.25;
      v.y = (v.y / (flat || 1)) * flat * st * 1.25;
      sz = 0.55; sy = 1; r = 1;
    }
    p.setXYZ(i, v.x * r * sx, v.y * r * sy + (id === 'drop' ? 0.05 : 0), v.z * r * sz);
  }
  g.computeVertexNormals();
  return g;
}

function squishMaterial(type, color) {
  if (type.mat === 'jelly') return new THREE.MeshPhysicalMaterial({ color: lighten(color, 0.2), roughness: 0.12, transmission: 0.6, thickness: 0.7, ior: 1.2, attenuationColor: new THREE.Color(color), attenuationDistance: 1.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1 });
  if (type.mat === 'plush') return new THREE.MeshPhysicalMaterial({ color, roughness: 0.78, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color(lighten(color, 0.6)), envMapIntensity: 0.7 });
  if (type.mat === 'soft') return new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, sheen: 0.7, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.3, envMapIntensity: 0.8 });
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1 });
}

// ---- a soft body --------------------------------------------------------------------
class Squishy {
  constructor(type, look) {
    this.type = type;
    this.look = look;
    this.g = new THREE.Group();
    this.geo = shapeGeometry(type.id);
    this.mat = squishMaterial(type, look.color || type.color);
    this.mesh = mesh(this.geo, this.mat, { parent: this.g });
    const n = this.geo.attributes.position.count;
    this.base = Float32Array.from(this.geo.attributes.position.array);
    this.bn = Float32Array.from(this.geo.attributes.normal.array);
    this.d = new Float32Array(n * 3);
    this.v = new Float32Array(n * 3);
    this.T = new Float32Array(n * 3);
    this.k = new Float32Array(n);
    for (let i = 0; i < n; i++) this.k[i] = 150 + 60 * (this.base[i * 3 + 1] + 1) * 0.5;
    this.touches = new Map();
    this.squeeze = 0;
    this.stretch = 0;
    this.attached = [];
    this.buildFace(look.face || 'dots');
    this.buildTop(look.top || 'none');
    this.idle = 0;
  }

  /** index of the vertex closest to a base-space point */
  nearest(x, y, z) {
    const b = this.base;
    let best = 0, bd = 1e9;
    for (let i = 0; i < b.length; i += 3) {
      const d = (b[i] - x) ** 2 + (b[i + 1] - y) ** 2 + (b[i + 2] - z) ** 2;
      if (d < bd) { bd = d; best = i / 3; }
    }
    return best;
  }
  /** pin an object to the skin: it rides the deformation */
  pin(obj, x, y, z, out = 0.02, orient = true) {
    const i = this.nearest(x, y, z);
    this.g.add(obj);
    this.attached.push({ obj, i, out, orient });
    return obj;
  }
  frontPoint(x, y) {
    // cast along -z from the front to find the surface for face features
    const b = this.base;
    let best = 0, bz = -9;
    for (let i = 0; i < b.length; i += 3) {
      if (Math.abs(b[i] - x) < 0.06 && Math.abs(b[i + 1] - y) < 0.06 && b[i + 2] > bz) { bz = b[i + 2]; best = i; }
    }
    return [b[best], b[best + 1], b[best + 2]];
  }

  buildFace(kind) {
    for (const f of this.face || []) { this.g.remove(f.obj); this.attached = this.attached.filter((a) => a !== f); }
    this.face = [];
    this.faceKind = kind;
    const ink = M.glossy('#2B1D48'), white = M.basic('#FFFFFF');
    const ey = this.type.id === 'star' ? 0.12 : this.type.id === 'drop' ? -0.05 : 0.08;
    const ex = this.type.id === 'cloud' ? 0.32 : 0.3;
    this.eyes = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Group();
      const open = group(e), shut = group(e), squint = group(e);
      if (kind === 'happy' || kind === 'sleepy') {
        mesh(G.torus(0.3, Math.PI, 14), ink, { r: [0, 0, kind === 'happy' ? 0 : Math.PI], s: [0.1, 0.09, 0.1], parent: open, cast: false });
      } else {
        mesh(G.sphere(20), ink, { s: [0.12, 0.15, 0.07], parent: open, cast: false });
        mesh(G.sphere(10), white, { p: [-0.035, 0.05, 0.06], s: kind === 'sparkle' ? 0.055 : 0.04, parent: open, cast: false });
        mesh(G.sphere(8), white, { p: [0.04, -0.04, 0.06], s: kind === 'sparkle' ? 0.03 : 0.02, parent: open, cast: false });
        if (kind === 'sparkle') mesh(G.puffy('star4s', starShape(4, 1, 0.38), 0.2, 0.1), white, { p: [0.03, 0.06, 0.07], s: 0.03, parent: open, cast: false });
      }
      // squeezed eyes: > <
      for (const k of [-1, 1]) mesh(G.capsule(1, 6), ink, { p: [0, k * 0.035, 0.02], r: [0, 0, s * (Math.PI / 2 + k * 0.5)], s: [0.022, 0.06, 0.022], parent: squint, cast: false });
      squint.visible = false;
      shut.visible = false;
      const [x, y, z] = this.frontPoint(s * ex, ey);
      const a = this.pin(e, x, y, z, 0.0);
      this.face.push(a);
      this.eyes.push({ open, squint });
      const bl = mesh(G.sphere(12), M.basic('#FF7FA8', { transparent: true, opacity: 0.45, depthWrite: false }), { s: [0.1, 0.06, 0.02], cast: false });
      const [bx, by, bz] = this.frontPoint(s * (ex + 0.2), ey - 0.17);
      this.face.push(this.pin(bl, bx, by, bz, 0.0));
    }
    const mouth = new THREE.Group();
    this.smile = mesh(G.torus(0.34, Math.PI, 16), M.glossy('#6B2A4E'), { r: [0, 0, Math.PI], s: [0.08, 0.07, 0.07], parent: mouth, cast: false });
    this.oMouth = group(mouth);
    mesh(G.sphere(16), M.glossy('#7A2C50'), { s: [0.08, 0.1, 0.04], parent: this.oMouth, cast: false });
    mesh(G.sphere(12), M.toy('#FF8BA7'), { p: [0, -0.045, 0.02], s: [0.05, 0.035, 0.03], parent: this.oMouth, cast: false });
    this.oMouth.visible = false;
    const [mx, my, mz] = this.frontPoint(0, ey - 0.2);
    this.face.push(this.pin(mouth, mx, my, mz, 0.0));
  }

  buildTop(kind) {
    for (const f of this.tops || []) { this.g.remove(f.obj); this.attached = this.attached.filter((a) => a !== f); }
    this.tops = [];
    this.topKind = kind;
    const b = this.base;
    const topPts = [];
    for (let i = 0; i < b.length; i += 3) if (b[i + 1] > 0.45 && b[i + 2] > -0.3 && Math.abs(b[i]) < 0.8) topPts.push(i / 3);
    const rndPt = () => topPts[Math.floor(Math.random() * topPts.length)];
    const add = (obj, i) => { this.g.add(obj); const a = { obj, i, out: 0.0, orient: true }; this.attached.push(a); this.tops.push(a); };
    if (kind === 'sprinkles') {
      const cols = ['#FF5C8F', '#FFE066', '#6FC4FF', '#7FE3A0', '#FFFFFF', '#B48BFF'];
      for (let k = 0; k < 40; k++) {
        const m = mesh(G.capsule(1, 6), M.glossy(pick(cols)), { s: [0.022, 0.05, 0.022], cast: false });
        m.rotation.z = rand(TAU);
        const holder = new THREE.Group();
        holder.add(m);
        m.rotation.set(Math.PI / 2, 0, rand(TAU));
        add(holder, rndPt());
      }
    } else if (kind === 'hearts' || kind === 'stars') {
      for (let k = 0; k < 9; k++) {
        const holder = new THREE.Group();
        const sh = kind === 'hearts' ? heartGeo() : G.puffy('starTop', starShape(5, 1, 0.5), 0.3, 0.15);
        mesh(sh, M.glossy(kind === 'hearts' ? pick(['#FF5C8F', '#FF8FC0', '#FFFFFF']) : pick(['#FFD23F', '#FFFFFF', '#8FDBFF'])), { s: 0.07, p: [0, 0, 0.02], parent: holder, cast: false });
        add(holder, rndPt());
      }
    } else if (kind === 'cherry') {
      const holder = new THREE.Group();
      mesh(G.sphere(20), M.plush('#FFFFFF'), { s: [0.3, 0.18, 0.3], parent: holder, cast: false });
      mesh(G.sphere(20), M.plush('#FFFFFF'), { p: [0, 0.14, 0], s: [0.2, 0.14, 0.2], parent: holder, cast: false });
      mesh(G.sphere(20), M.glossy('#FF3E6C'), { p: [0, 0.32, 0], s: 0.13, parent: holder, cast: false });
      mesh(G.capsule(1, 6), M.toy('#5FBF72'), { p: [0.04, 0.5, 0], r: [0, 0, -0.4], s: [0.015, 0.08, 0.015], parent: holder, cast: false });
      add(holder, this.nearest(0, 2, 0.1));
      this.tops[this.tops.length - 1].orient = false;
    } else if (kind === 'bow') {
      const holder = new THREE.Group();
      for (const k of [-1, 1]) mesh(G.sphere(16), M.glossy('#FF5C8F'), { p: [k * 0.13, 0, 0], r: [0, 0, k * 0.35], s: [0.15, 0.1, 0.07], parent: holder, cast: false });
      mesh(G.sphere(12), M.glossy('#FF3E7C'), { s: 0.07, parent: holder, cast: false });
      add(holder, this.nearest(0.45, 0.9, 0.3));
    }
  }

  setColor(c) {
    this.look.color = c;
    this.mat.dispose();
    this.mat = squishMaterial(this.type, c);
    this.mesh.material = this.mat;
  }

  /** a finger arrives: A is the local hit point, n its normal */
  touch(id, A, n) { this.touches.set(id, { A: A.clone(), n: n.clone(), D: A.clone(), drag: false, depth: 0, t: 0 }); }
  drag(id, D) {
    const t = this.touches.get(id);
    if (!t) return;
    t.D.copy(D);
    const len = t.D.distanceTo(t.A);
    if (len > 0.12) t.drag = true;
  }
  release(id) { this.touches.delete(id); }

  step(dt) {
    const n = this.k.length, b = this.base, bn = this.bn, T = this.T, d = this.d, v = this.v;
    T.fill(0);
    let stretch = 0, squeeze = 0;
    for (const t of this.touches.values()) {
      t.t += dt;
      t.depth = Math.min(0.5, t.depth + dt * 2.6);
      const dx = t.D.x - t.A.x, dy = t.D.y - t.A.y, dz = t.D.z - t.A.z;
      let len = Math.hypot(dx, dy, dz);
      // stretching has a soft limit, like real taffy
      const lim = 1.7, k = 1.3 * (len > lim ? (lim + (len - lim) * 0.25) / len : 1);
      const sx = dx * k, sy = dy * k, sz = dz * k;
      stretch = Math.max(stretch, Math.min(len, 2));
      squeeze = Math.max(squeeze, t.drag ? 0 : t.depth / 0.5);
      const s2 = t.drag ? 0.5 : 0.2;
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        const ex = b[j] - t.A.x, ey = b[j + 1] - t.A.y, ez = b[j + 2] - t.A.z;
        const r2 = ex * ex + ey * ey + ez * ez;
        if (t.drag) {
          const w = Math.exp(-r2 / s2);
          T[j] += sx * w; T[j + 1] += sy * w; T[j + 2] += sz * w;
          // the rest thins a little as it is pulled
          const thin = -0.08 * Math.min(1, len) * (1 - w);
          T[j] += bn[j] * thin; T[j + 1] += bn[j + 1] * thin; T[j + 2] += bn[j + 2] * thin;
        } else {
          const w = Math.exp(-r2 / s2);
          const dent = -t.depth * w, bulge = t.depth * 0.16 * (1 - w);
          T[j] += t.n.x * dent + bn[j] * bulge;
          T[j + 1] += t.n.y * dent + bn[j + 1] * bulge;
          T[j + 2] += t.n.z * dent + bn[j + 2] * bulge;
        }
      }
    }
    this.stretch = stretch;
    this.squeeze = squeeze;
    // idle breathing keeps it alive between touches
    this.idle += dt;
    const br = Math.sin(this.idle * 2.2) * 0.012;
    const steps = 2, h = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (let i = 0; i < n; i++) {
        const kk = this.k[i];
        for (let a = 0; a < 3; a++) {
          const j = i * 3 + a;
          const tgt = T[j] + bn[j] * br;
          v[j] += (kk * (tgt - d[j]) - 7.5 * v[j]) * h;
          d[j] += v[j] * h;
        }
      }
    }
    const pos = this.geo.attributes.position.array;
    for (let j = 0; j < pos.length; j++) pos[j] = b[j] + d[j];
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
    this.geo.computeBoundingSphere();
    const nr = this.geo.attributes.normal.array;
    const tmp = new THREE.Vector3();
    for (const a of this.attached) {
      const j = a.i * 3;
      a.obj.position.set(pos[j] + nr[j] * a.out, pos[j + 1] + nr[j + 1] * a.out, pos[j + 2] + nr[j + 2] * a.out);
      if (a.orient) { tmp.set(pos[j] + nr[j], pos[j + 1] + nr[j + 1], pos[j + 2] + nr[j + 2]); a.obj.lookAt(this.g.localToWorld(tmp)); }
    }
    // expressions follow the squeeze
    const sq = this.squeeze > 0.5;
    for (const e of this.eyes) { e.open.visible = !sq; e.squint.visible = sq; }
    const o = this.stretch > 0.3 || this.squeeze > 0.7;
    this.oMouth.visible = o;
    this.smile.visible = !o;
    if (o) this.oMouth.scale.set(1, 0.7 + Math.min(1.2, this.stretch) * 0.8, 1);
  }

  /** a kick of energy: wobble without a finger */
  wobble(k = 1) {
    const n = this.k.length;
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      this.v[j + 1] -= this.bn[j + 1] * 2.5 * k;
      this.v[j] += this.bn[j] * 1.2 * k;
      this.v[j + 2] += this.bn[j + 2] * 1.2 * k;
    }
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
  }
}

let heartG = null;
function heartGeo() {
  if (heartG) return heartG;
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.5, 0.1, -0.72, 1.05, 0, 0.32);
  s.bezierCurveTo(0.72, 1.05, 1.5, 0.1, 0, -0.9);
  heartG = G.puffy('heartTop', s, 0.3, 0.15);
  return heartG;
}

// ---- the studio --------------------------------------------------------------------------
export const squishy = {
  tint: '#FFD1E6',

  enter() {
    this.t = 0;
    this.d = data();
    const st = this.stage = new Stage({ bg: [[0, '#FFD6EC'], [0.6, '#FFE9F2'], [1, '#E6DCFF']], fov: 30, keyPos: [-4, 9, 8], shadowArea: 6, hemi: 0.75, sky: '#FFFFFF', ground: '#FFD1E6', env: 0.8, rim: 1.4, rimColor: '#D6E4FF' });
    this.world = group(st.scene);
    this.buildRoom();
    this.babies = [];
    this.layout();
    this.setType(this.d.type || 0, true);
    st.snap(this.pose);
    this.buttons = this.makeButtons();
    music.play('squishy');
    this.squeezes = 0;
    this.singer = null;
    hint.set({ from: [app.W / 2, app.H * 0.42], to: [app.W / 2 + 120, app.H * 0.3], delay: 2.2 });
  },

  exit() {
    if (this.singer) { this.singer.close(); this.singer = null; }
    if (this.sq) this.sq.dispose();
    this.stage.dispose();
  },

  buildRoom() {
    const W = this.world;
    mesh(G.plane(), new THREE.MeshStandardMaterial({ color: '#FFE4F0', roughness: 1 }), { p: [0, 0, 0], r: [-Math.PI / 2, 0, 0], s: [60, 60, 1], receive: true, cast: false, parent: W });
    // a big soft cushion to squish on
    this.cushion = group(W);
    mesh(G.puck(0.45), M.plush('#C9B0FF'), { p: [0, 0.3, 0], s: [1.8, 0.6, 1.8], parent: this.cushion, receive: true });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      mesh(G.sphere(12), M.plush('#FFE066'), { p: [Math.cos(a) * 1.72, 0.32, Math.sin(a) * 1.72], s: 0.15, parent: this.cushion, cast: false });
    }
    this.cushSq = new Spring(1, 200, 7);
    // floating bubbles and toy blocks in the background
    this.floaters = [];
    const cols = ['#FFB3CF', '#8FD0FF', '#FFE066', '#9FE8A8', '#B9A4FF'];
    for (let i = 0; i < 12; i++) {
      const m = i % 3 === 0 ? mesh(G.box(0.2), M.toy(pick(cols)), { s: rand(0.5, 0.9), parent: W }) : mesh(G.sphere(24), i % 3 === 1 ? M.bubble({ opacity: 0.3 }) : M.glossy(pick(cols)), { s: rand(0.3, 0.7), parent: W, cast: false });
      m.position.set(rand(-11, 11), rand(2.5, 8), rand(-16, -9));
      m.userData = { ph: rand(TAU), y: m.position.y, sp: rand(0.3, 0.8) };
      this.floaters.push(m);
    }
    // the shelf of squishies to choose from
    this.minis = TYPES.map((tp, i) => {
      const g = group(W);
      const geo = shapeGeometry(tp.id);
      const look = this.d.looks[tp.id] || {};
      const m = mesh(geo, squishMaterial(tp, look.color || tp.color), { s: 0.32, p: [0, 0.32, 0], parent: g });
      const ink = M.glossy('#2B1D48');
      for (const s of [-1, 1]) mesh(G.sphere(10), ink, { p: [s * 0.1, 0.36, 0.3], s: [0.035, 0.045, 0.02], parent: g, cast: false });
      mesh(G.puck(0.4), M.toy('#FFFFFF'), { p: [0, 0.03, 0], s: [0.45, 0.06, 0.45], parent: g, receive: true });
      g.userData = { i, sq: new Spring(1, 300, 9), m };
      return g;
    });
  },

  layout() {
    const wide = app.W > app.H;
    const st = this.stage;
    this.pose = st.pose(V(0, 1.25, 0.6), wide ? 7.4 : 5.2, wide ? 5.4 : 7.6, [0, 0.3, 1]);
    // minis along the front edge
    const n = this.minis.length, sp = wide ? 0.95 : 0.72;
    this.minis.forEach((g, i) => { g.position.set((i - (n - 1) / 2) * sp, 0, 2.2); g.scale.setScalar(wide ? 0.72 : 0.6); });
    st.shadowArea(6, V(0, 0, 0.5));
  },
  resize() {
    this.layout();
    this.stage.snap(this.pose);
    this.placeButtons();
  },

  setType(i, first = false) {
    const tp = TYPES[i];
    this.d.type = i;
    const look = this.d.looks[tp.id] || (this.d.looks[tp.id] = { color: tp.color, face: 'dots', top: 'none' });
    if (this.sq) {
      const old = this.sq;
      tween(old.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.25, { ease: E.in, done: () => { this.world.remove(old.g); old.dispose(); } });
    }
    const sq = this.sq = new Squishy(tp, look);
    sq.g.position.set(0, 0.6 + 1.0, 0);
    sq.g.scale.setScalar(0.01);
    this.world.add(sq.g);
    tween(sq.g.scale, { x: 1, y: 1, z: 1 }, 0.5, { ease: E.back, delay: first ? 0.2 : 0.2 });
    wait(first ? 0.5 : 0.35, () => { sq.wobble(1.5); audio.sfx('wobble', { vol: 0.6 }); audio.voice('yay', tp.voice, 0.4); });
    save.touch();
  },

  makeButtons() {
    const b = [];
    // colour pots
    COLORS.forEach((col) => b.push(new Btn({
      r: 19, slop: 4, kind: 'color', col,
      paint: (c, r) => {
        candy(c, r, col);
        if (this.sq && this.sq.look.color === col) { c.strokeStyle = '#fff'; c.lineWidth = 4; ell(c, 0, -1, r * 0.55); c.stroke(); }
      },
      tap: () => this.paint(col)
    })));
    // faces
    FACES.forEach((f) => b.push(new Btn({
      r: 22, slop: 4, kind: 'face', f,
      paint: (c, r) => { candy(c, r, '#FFF3E0', this.sq && this.sq.faceKind === f); drawFaceIcon(c, f, r); },
      tap: () => { this.sq.buildFace(f); this.sq.look.face = f; this.sq.wobble(0.8); audio.sfx('pop', { rate: 1.3 }); audio.voice(pick(['mew', 'hehe']), this.sq.type.voice, 0.5); save.touch(); }
    })));
    // toppings
    TOPS.forEach((tp) => b.push(new Btn({
      r: 22, slop: 4, kind: 'top', tp,
      paint: (c, r) => { candy(c, r, '#E9DEFF', this.sq && this.sq.topKind === tp); drawTopIcon(c, tp, r); },
      tap: () => this.topping(tp)
    })));
    this.btns = b;
    this.placeButtons(b);
    return b;
  },
  placeButtons(b = this.btns) {
    if (!b) return;
    const W = app.W, H = app.H, wide = W > H;
    const colors = b.filter((x) => x.kind === 'color'), faces = b.filter((x) => x.kind === 'face'), tops = b.filter((x) => x.kind === 'top');
    const top = Math.max(app.safeTop, 8) + 30;
    if (wide) {
      // colours down the left, faces and toppings down the right
      const gy = Math.min(46, (H - top - 120) / colors.length);
      colors.forEach((x, i) => { x.x = 34; x.y = top + 60 + i * gy; });
      const gy2 = Math.min(54, (H - top - 120) / 5);
      faces.forEach((x, i) => { x.x = W - 96; x.y = top + 70 + i * gy2; });
      tops.forEach((x, i) => { x.x = W - 40; x.y = top + 40 + i * gy2; });
    } else {
      colors.forEach((x, i) => { x.x = W / 2 + (i - (colors.length - 1) / 2) * 40; x.y = top + 50; });
      faces.forEach((x, i) => { x.x = 34; x.y = top + 110 + i * 54; });
      tops.forEach((x, i) => { x.x = W - 34; x.y = top + 110 + i * 54; });
    }
  },

  paint(col) {
    const sq = this.sq;
    sq.setColor(col);
    const minis = this.minis[this.d.type];
    minis.userData.m.material = squishMaterial(sq.type, col);
    sq.wobble(1.2);
    audio.sfx('splat', { vol: 0.6 });
    audio.note('marimba', penta(COLORS.indexOf(col) + 2), { vol: 0.4 });
    const s = this.stage.objScreen(sq.g);
    fx.burst(s.x, s.y, { kind: 'dot', n: 16, colors: [col, '#FFFFFF'], speed: 300, size: 12, g: 500, life: 0.8 });
    haptic();
    save.touch();
  },

  topping(tp) {
    const sq = this.sq;
    sq.buildTop(tp);
    sq.look.top = tp;
    sq.wobble(1);
    audio.sfx(tp === 'sprinkles' ? 'crinkle' : tp === 'none' ? 'whoosh' : 'pop', { vol: 0.6 });
    audio.sparkle(2, 3);
    const s = this.stage.objScreen(sq.g);
    if (tp !== 'none') fx.sparkle(s.x, s.y - 60, 12);
    save.touch();
  },

  // ---- babies: a surprise after enough squeezes -----------------------------------------
  spawnBaby() {
    const sq = this.sq;
    const tp = sq.type;
    const g = group(this.world);
    const m = mesh(shapeGeometry(tp.id), squishMaterial(tp, sq.look.color), { s: 0.28, parent: g });
    const ink = M.glossy('#2B1D48');
    for (const s of [-1, 1]) mesh(G.sphere(10), ink, { p: [s * 0.09, 0.04, 0.25], s: [0.03, 0.04, 0.02], parent: g, cast: false });
    g.position.copy(sq.g.position).add(V(0, 0.6, 0.4));
    const b = { g, m, v: V(rand(-2.5, 2.5), 6, rand(1, 2.5)), sq: new Spring(1, 300, 8), r: 0.27 };
    this.babies.push(b);
    if (this.babies.length > 4) { const old = this.babies.shift(); this.world.remove(old.g); }
    audio.sfx('pop');
    audio.voice('wee', 1.5, 0.6);
    audio.sparkle(4, 5);
    const s = this.stage.objScreen(sq.g);
    fx.burst(s.x, s.y - 40, { kind: 'heart', n: 12, colors: [P.rose, P.pink, '#FFFFFF'], speed: 260, size: 20, g: 120, life: 1.1 });
    save.earnStar();
  },

  // ---- frame ------------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    st.glide(this.pose, dt, 4);
    const sq = this.sq;
    if (sq) {
      sq.step(Math.min(dt, 1 / 30));
      // the singing stretch
      if (sq.stretch > 0.35) {
        if (!this.singer && audio.running) this.singer = audio.singer({ wave: 'triangle', vib: 18, vibRate: 5 });
        if (this.singer) {
          const f = 260 * sq.type.voice * Math.pow(2, Math.min(1.6, sq.stretch) * 0.9);
          const vow = Math.min(1, sq.stretch / 1.4);
          this.singer.set(f, 0.55, [lerp(500, 900, vow), lerp(900, 1500, vow), 2600], 0.06);
        }
      } else if (this.singer) { this.singer.close(); this.singer = null; }
    }
    const ck = this.cushSq.step(dt);
    this.cushion.scale.set(1 / Math.sqrt(ck), ck, 1 / Math.sqrt(ck));
    for (const f of this.floaters) {
      const u = f.userData;
      f.position.y = u.y + Math.sin(t * u.sp + u.ph) * 0.4;
      f.rotation.y += dt * 0.3;
      f.rotation.x = Math.sin(t * 0.5 + u.ph) * 0.3;
    }
    for (const g of this.minis) {
      const k = g.userData.sq.step(dt);
      g.userData.m.scale.set(0.32 / Math.sqrt(k), 0.32 * k, 0.32 / Math.sqrt(k));
      g.rotation.y = Math.sin(t * 0.8 + g.userData.i) * 0.3;
      g.position.y = g.userData.i === this.d.type ? 0.06 + Math.sin(t * 3) * 0.04 : 0;
    }
    for (const b of this.babies) {
      if (b.held) continue;
      b.v.y -= 16 * dt;
      b.g.position.addScaledVector(b.v, dt);
      const floor = b.r;
      if (b.g.position.y < floor) { b.g.position.y = floor; if (Math.abs(b.v.y) > 1.2) { b.sq.kick(b.v.y * 0.8); audio.sfx('blup', { vol: 0.25, rate: 1.4 }); } b.v.y = Math.abs(b.v.y) * 0.55; b.v.x *= 0.8; b.v.z *= 0.8; }
      if (Math.abs(b.g.position.x) > 4.2) { b.v.x = -b.v.x * 0.7; b.g.position.x = Math.sign(b.g.position.x) * 4.2; }
      if (b.g.position.z > 3.2 || b.g.position.z < -1.5) { b.v.z = -b.v.z * 0.7; b.g.position.z = clamp(b.g.position.z, -1.5, 3.2); }
      // babies never sink into the big one
      const dx = b.g.position.x - sq.g.position.x, dz = b.g.position.z - sq.g.position.z, dd = Math.hypot(dx, dz);
      if (dd < 1.3 && b.g.position.y < 2.4) { b.g.position.x = sq.g.position.x + (dx / (dd || 1)) * 1.3; b.g.position.z = sq.g.position.z + (dz / (dd || 1)) * 1.3; b.v.x += dx; }
      const k = b.sq.step(dt);
      b.m.scale.set(0.28 / Math.sqrt(k), 0.28 * k, 0.28 / Math.sqrt(k));
      b.g.rotation.y = Math.sin(t * 2 + b.r * 10) * 0.4;
    }
  },

  draw(c) {
    for (const b of this.buttons) b.draw(c);
  },

  // ---- input -------------------------------------------------------------------------------
  down(p) {
    const st = this.stage, sq = this.sq;
    hint.clear();
    const hit = st.pick(p.x, p.y, [sq.mesh], false);
    if (hit) {
      const A = sq.g.worldToLocal(hit.point.clone());
      const n = hit.face.normal.clone().normalize();
      sq.touch(p.id, A, n);
      p.sq = { plane: hit.point.clone() };
      audio.sfx(pick(['squish', 'squish2']), { vol: 0.7, rate: rand(0.9, 1.15) });
      haptic();
      this.cushSq.kick(-2);
      return;
    }
    for (const b of this.babies) {
      const s = st.objScreen(b.g);
      if (dist(p.x, p.y, s.x, s.y) < 40) {
        b.held = true;
        p.baby = { b, last: [p.x, p.y], vx: 0, vy: 0 };
        b.sq.kick(-4);
        audio.voice('hehe', 1.6, 0.4);
        return;
      }
    }
    for (const g of this.minis) {
      const s = st.objScreen(g.userData.m);
      if (dist(p.x, p.y, s.x, s.y) < 40) {
        g.userData.sq.kick(-5);
        if (g.userData.i !== this.d.type) { this.setType(g.userData.i); audio.sfx('whoosh', { vol: 0.5 }); }
        else { sq.wobble(1.5); audio.sfx('wobble'); }
        return;
      }
    }
    const hc = st.pick(p.x, p.y, [this.cushion]);
    if (hc) { this.cushSq.kick(-5); sq.wobble(1.2); audio.sfx('boing', { rate: 0.8, vol: 0.6 }); return; }
    const hf = st.pick(p.x, p.y, this.floaters, false);
    if (hf) {
      const o = hf.object;
      audio.note('glock', penta(Math.floor(rand(4, 12))), { vol: 0.4 });
      fx.sparkle(p.x, p.y, 6);
      tween(o.scale, { x: o.scale.x * 1.3, y: o.scale.y * 1.3, z: o.scale.z * 1.3 }, 0.12, { done: () => tween(o.scale, { x: o.scale.x / 1.3, y: o.scale.y / 1.3, z: o.scale.z / 1.3 }, 0.4, { ease: E.elastic }) });
      return;
    }
    fx.sparkle(p.x, p.y, 4);
  },

  move(p) {
    const st = this.stage, sq = this.sq;
    if (p.sq) {
      const w = st.onFacing(p.x, p.y, p.sq.plane);
      if (w) {
        const D = sq.g.worldToLocal(w);
        const t = sq.touches.get(p.id);
        const was = t && t.drag;
        sq.drag(p.id, D);
        if (t && t.drag && !was) audio.sfx('stretch', { vol: 0.5 });
      }
      return;
    }
    if (p.baby) {
      const w = st.onPlane(p.x, p.y, 1.4);
      if (w) {
        p.baby.vx = (p.x - p.baby.last[0]);
        p.baby.vy = (p.y - p.baby.last[1]);
        p.baby.last = [p.x, p.y];
        p.baby.b.g.position.lerp(w, 0.5);
      }
    }
  },

  up(p) {
    const sq = this.sq;
    if (p.sq) {
      const t = sq.touches.get(p.id);
      const stretched = t && t.drag;
      const deep = t ? t.depth : 0;
      sq.release(p.id);
      if (stretched) { audio.sfx('boing', { rate: 1.1 }); audio.voice(pick(['giggle', 'wee', 'yay']), sq.type.voice, 0.55); }
      else { audio.sfx('wobble', { vol: 0.6, rate: rand(0.9, 1.2) }); if (deep > 0.3) audio.voice(pick(['hehe', 'mew', 'giggle']), sq.type.voice, 0.45); }
      this.squeezes++;
      this.d.squeezes = (this.d.squeezes || 0) + 1;
      if (this.squeezes % 12 === 0) wait(0.3, () => this.spawnBaby());
      else if (this.squeezes % 4 === 0) { const s = this.stage.objScreen(sq.g); fx.hearts(s.x, s.y - 80, 3); }
      return;
    }
    if (p.baby) {
      const b = p.baby.b;
      b.held = false;
      b.v.set(p.baby.vx * 0.25, 4 - p.baby.vy * 0.15, 0.5);
      audio.sfx('zip', { vol: 0.4 });
    }
  }
};

function drawFaceIcon(c, f, r) {
  c.fillStyle = '#3A2450';
  c.strokeStyle = '#3A2450';
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    if (f === 'happy') { c.beginPath(); c.arc(s * 6, -1, 3.6, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    else if (f === 'sleepy') { c.beginPath(); c.arc(s * 6, -3, 3.6, Math.PI * 0.1, Math.PI * 0.9); c.stroke(); }
    else {
      ell(c, s * 6, -2, 3, 3.8); c.fill();
      if (f === 'sparkle') { c.fillStyle = '#fff'; ell(c, s * 6 - 1, -3.4, 1.4); c.fill(); c.fillStyle = '#3A2450'; }
    }
  }
  c.beginPath(); c.arc(0, 4, 3.5, 0.2, Math.PI - 0.2); c.stroke();
}
function drawTopIcon(c, tp, r) {
  if (tp === 'none') { c.strokeStyle = '#B4A0D0'; c.lineWidth = 3; ell(c, 0, 0, 8); c.stroke(); c.beginPath(); c.moveTo(-6, 6); c.lineTo(6, -6); c.stroke(); return; }
  if (tp === 'sprinkles') { ['#FF5C8F', '#FFC233', '#5698FF', '#7FD86F', '#B48BFF'].forEach((col, i) => { c.save(); c.translate(Math.cos(i * 1.3) * 7, Math.sin(i * 1.9) * 6); c.rotate(i); c.fillStyle = col; rr(c, -1.8, -5, 3.6, 10, 1.8); c.fill(); c.restore(); }); return; }
  if (tp === 'hearts') { heart(c, 0, 0, 9); c.fillStyle = P.rose; c.fill(); return; }
  if (tp === 'stars') { softStar(c, 0, 1, 11, 5, 0.5); c.fillStyle = P.sun; c.fill(); return; }
  if (tp === 'cherry') { c.fillStyle = '#FFFFFF'; ell(c, 0, 5, 10, 5); c.fill(); c.fillStyle = '#FF3E6C'; ell(c, 0, -3, 5.5); c.fill(); return; }
  if (tp === 'bow') { c.fillStyle = P.rose; ell(c, -6, 0, 6, 4.5, 0.3); c.fill(); ell(c, 6, 0, 6, 4.5, -0.3); c.fill(); ell(c, 0, 0, 3); c.fill(); }
}
