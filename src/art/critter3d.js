// Living 3D toys. One soft-bodied family of characters, built from rounded
// shapes with painted bellies, glossy eyes and springy ears, so that every
// creature in every game moves, blinks, squishes and talks the same lovable way.
import { THREE, M, G, mesh, group, blobShadow, lighten, darken, lathe, PM, bake } from '../core/stage.js';
import { Spring } from '../core/engine.js';
import { audio } from '../core/audio.js';
import { FRIENDS } from './creatures.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);

// Extra species for the new games, in the same family as the meadow friends
export const SPECIES = {
  ...FRIENDS,
  puppy: { body: '#F2C48D', belly: '#FFF1DE', ears: 'dog', snout: '#FFF4E4', nose: 1, tail: 'wag', voice: 1.15 },
  dalmatian: { body: '#FFFFFF', belly: '#FFFFFF', ears: 'dog', earCol: '#4B4560', spots: '#4B4560', snout: '#FFFFFF', nose: 1, tail: 'wag', voice: 1.2 },
  pug: { body: '#E9D2B0', belly: '#F7EAD5', ears: 'dogSmall', earCol: '#5E4B52', snout: '#7D6A6E', nose: 1, tail: 'curl', voice: 0.95 },
  husky: { body: '#9AA7C2', belly: '#FFFFFF', ears: 'cat', inner: '#FFE4EE', snout: '#FFFFFF', nose: 1, tail: 'wag', voice: 1.05, mask: '#FFFFFF' },
  corgi: { body: '#FFA45C', belly: '#FFFFFF', ears: 'cat', inner: '#FFD9C4', snout: '#FFFFFF', nose: 1, tail: 'puff', voice: 1.25 },
  poodle: { body: '#FFC6DD', belly: '#FFE3EF', ears: 'poodle', snout: '#FFE3EF', nose: 1, tail: 'puff', voice: 1.3 },
  babyDragon: { body: '#9C8CFF', belly: '#FFE9A8', ears: 'dragon', wings: '#FFB3D9', tail: 'spike', voice: 0.9 },
  phoenix: { body: '#FF9F5A', belly: '#FFE08A', ears: 'crest', beak: '#FFD23F', wingsSmall: 1, voice: 1.4, glow: '#FFC266' },
  foal: { body: '#FFE3F1', belly: '#FFFFFF', ears: 'unicorn', inner: '#FFC4DC', mane: 1, wingsPeg: '#FFFFFF', voice: 1.3 },
  turtle: { body: '#8FE3B0', belly: '#FFF2C4', ears: 'none', shell: '#5FC9A8', voice: 0.85 },
  axolotl: { body: '#FFC2E0', belly: '#FFE6F2', ears: 'gills', voice: 1.2 },
  starBunny: { body: '#3D3A7A', belly: '#6E6AC8', ears: 'bunny', inner: '#FFD45C', sparkly: '#FFE27D', voice: 1.25 },
  slimey: { body: '#7CE6C8', belly: '#BFFFEA', ears: 'none', jelly: 1, voice: 1.1 },
  hero: { body: '#FF8FB8', belly: '#FFE4EC', ears: 'sprout', voice: 1.1 }
};

// ---- shared shapes ---------------------------------------------------------------
let pointEarG = null;
const pointEar = () => pointEarG || (pointEarG = lathe([
  new THREE.Vector2(0, -0.5), new THREE.Vector2(0.48, -0.46), new THREE.Vector2(0.52, -0.3), new THREE.Vector2(0.4, 0.05),
  new THREE.Vector2(0.22, 0.34), new THREE.Vector2(0.08, 0.5), new THREE.Vector2(0, 0.52)
], 20));
let hornG = null;
const horn = () => hornG || (hornG = lathe([new THREE.Vector2(0, -0.5), new THREE.Vector2(0.34, -0.48), new THREE.Vector2(0.26, 0), new THREE.Vector2(0.12, 0.38), new THREE.Vector2(0.03, 0.5), new THREE.Vector2(0, 0.5)], 16));

const INK = '#2B1D48';
const TMP_V = new THREE.Vector3(), TMP_D = new THREE.Vector3(), TMP_Q = new THREE.Quaternion();
const MOUTH = '#6B2A4E';

// ---- body paint: belly, stripes, spots, patches as smooth vertex colours -----------------
function bodyGeometry(id, sp) {
  const key = 'body:' + id;
  if (bodyCache.has(key)) return bodyCache.get(key);
  const g = new THREE.SphereGeometry(1, 36, 26);
  // A toy is never a perfect ball: a little fuller at the bottom, flat where it sits
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = 1 + 0.07 * (0.3 - y) * (sp.pear ?? 1);
    x *= k; z *= k;
    if (y < -0.78) y = -0.78 - (y + 0.78) * 0.35;
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const n = g.attributes.normal, cnt = n.count;
  const cols = new Float32Array(cnt * 3);
  const cBody = new THREE.Color(sp.body), cBelly = new THREE.Color(sp.belly || lighten(sp.body, 0.5)), c = new THREE.Color();
  const cStripe = sp.stripes ? new THREE.Color(sp.stripes) : null;
  const cSpot = sp.spots ? new THREE.Color(sp.spots) : null;
  const cMask = sp.mask ? new THREE.Color(sp.mask) : null;
  const cFace = sp.face ? new THREE.Color(sp.face) : null;
  const cSpark = sp.sparkly ? new THREE.Color(sp.sparkly) : null;
  const spots = [];
  if (cSpot) for (let i = 0; i < 9; i++) {
    const a = rndSeed(i * 3.1 + id.length) * TAU, e = rndSeed(i * 7.7) * 1.2 - 0.25;
    spots.push(new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)));
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < cnt; i++) {
    const x = n.getX(i), y = n.getY(i), z = n.getZ(i);
    c.copy(cBody);
    if (sp.rainbow) {
      const hue = (0.95 - (y + 1) * 0.38) % 1;
      c.setHSL((hue + 1) % 1, 0.75, 0.82);
    }
    // Belly: soft oval on the front lower half
    const b = sp.bellyBig ? smooth(0.05, 0.4, z * 0.9 - y * 0.2) : smooth(0.35, 0.62, z * 0.8 - y * 0.5 + 0.05);
    c.lerp(cBelly, b * (sp.belly === sp.body ? 0 : 1));
    if (cStripe) {
      if (sp.wingsBee) {
        const band = smooth(0.45, 0.7, Math.sin((y + 0.15) * 9.5));
        if (y < 0.15) c.lerp(cStripe, band);
      } else {
        // tabby marks over the top of the head
        const band = smooth(0.55, 0.85, Math.sin(x * 9)) * smooth(0.5, 0.75, y) * smooth(0.2, -0.3, z);
        c.lerp(cStripe, band);
      }
    }
    if (cSpot) {
      let m = 0;
      for (const s of spots) {
        const d = Math.hypot(x - s.x, y - s.y, z - s.z);
        m = Math.max(m, smooth(0.3, 0.22, d));
      }
      if (sp.ears === 'antenna') m *= smooth(0.5, 0.2, z * 0.8 + y * 0.2); // keep the face clear
      c.lerp(cSpot, m);
    }
    if (cMask) c.lerp(cMask, smooth(0.55, 0.75, z) * smooth(0.25, -0.05, y));
    if (cFace) c.lerp(cFace, smooth(0.62, 0.78, z * 0.9 + y * 0.1));
    if (cSpark) {
      const s = Math.sin(x * 23 + y * 7) * Math.sin(y * 19 - z * 5) * Math.sin(z * 17 + x * 3);
      c.lerp(cSpark, smooth(0.5, 0.7, s) * (1 - b));
    }
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  bodyCache.set(key, g);
  return g;
}
const bodyCache = new Map();
function rndSeed(s) { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---- the creature --------------------------------------------------------------------
export class Critter {
  /**
   * id: key in SPECIES, or a spec object. o: { size, shape:{rx,ry,rz}, eye, shadow, voice }
   */
  constructor(id, o = {}) {
    const sp = this.sp = typeof id === 'string' ? (SPECIES[id] || SPECIES.moko) : id;
    this.id = typeof id === 'string' ? id : (o.key || 'custom');
    this.size = o.size || 1;
    this.voicePitch = o.voice || sp.voice || 1;
    const rx = this.rx = (o.rx || (sp.wide ? 1.12 : 1)), ry = this.ry = (o.ry || (sp.wide ? 0.88 : 0.96)), rz = this.rz = (o.rz || 0.92);

    this.root = new THREE.Group();
    this.root.scale.setScalar(this.size);
    if (o.shadow !== false) {
      this.shadow = blobShadow(1.05, 0.32);
      this.shadow.position.y = 0.012;
      this.root.add(this.shadow);
    }
    this.bounce = group(this.root);
    this.squash = group(this.bounce);
    this.yaw = group(this.squash);

    // Body
    const bodyMat = sp.jelly ? M.jelly(sp.body, { thickness: 1.6 }) :
      PM({ vertexColors: true, roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.3, sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.85 });
    this.bodyMat = bodyMat;
    this.body = mesh(bodyGeometry(this.id, sp), bodyMat, { p: [0, ry, 0], s: [rx, ry, rz], parent: this.yaw });
    this.body.userData.critter = this;
    if (sp.jelly) {
      // a glowing heart inside the jelly
      const core = mesh(G.sphere(16), M.toy(lighten(sp.body, 0.4), { emissive: sp.body, emissiveIntensity: 0.25 }), { p: [0, ry * 0.9, 0], s: 0.35, parent: this.yaw, cast: false });
      core.userData.critter = this;
    }

    this.face = group(this.yaw, [0, ry, 0]);
    this.parts = [];
    this.ears = [];
    this.arms = [];
    this.feet = [];
    this.buildFeet(sp);
    this.buildFace(sp, o);
    this.buildEars(sp);
    this.buildExtras(sp);

    // animation state
    this.sq = new Spring(1, 260, 9);
    this.tilt = new Spring(0, 160, 8);
    this.y = 0; this.vy = 0;
    this.t = rnd(0, 10);
    this.blinkT = rnd(1, 4);
    this.blinkK = 1;
    this.mood = 'idle';
    this.moodT = 0;
    this.mouthOpen = 0;
    this.talkT = 0;
    this.waveT = 0;
    this.lookAt = null;
    this.lookYaw = 0; this.lookPitch = 0;
    this.sleep = false;
    this.wagT = 0;
    this.excite = 0;
  }

  /** Point on the body's surface by yaw (from front) and elevation, plus its normal */
  surf(a, e, out = 0) {
    const d = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
    const k = 1 / Math.sqrt((d.x / this.rx) ** 2 + (d.y / this.ry) ** 2 + (d.z / this.rz) ** 2);
    const p = d.clone().multiplyScalar(k);
    const nrm = new THREE.Vector3(p.x / this.rx ** 2, p.y / this.ry ** 2, p.z / this.rz ** 2).normalize();
    p.addScaledVector(nrm, out);
    return { p, n: nrm };
  }
  /** Attach obj onto the surface, its +z pointing out of the body */
  stick(obj, a, e, out = 0, parent = this.face, spin = 0) {
    const { p, n } = this.surf(a, e, out);
    if (parent !== this.face) p.y += this.ry;
    obj.position.copy(p);
    parent.add(obj);
    obj.lookAt(obj.getWorldPosition(new THREE.Vector3()).add(n.clone().transformDirection(parent.matrixWorld)));
    if (spin) obj.rotateZ(spin);
    return obj;
  }

  buildFeet(sp) {
    const fm = M.toy(sp.foot || darken(sp.body, 0.08));
    for (const s of [-1, 1]) {
      const f = mesh(G.sphere(20), fm, { p: [s * 0.42, 0.1, 0.32], s: [0.26, 0.16, 0.3], parent: this.yaw, cast: false });
      this.feet.push(f);
    }
    // little arms
    const am = M.toy(sp.arm || sp.body);
    for (const s of [-1, 1]) {
      const pivot = group(this.yaw, [s * this.rx * 0.9, this.ry * 0.78, 0.18]);
      if (!sp.wingsSmall) mesh(G.sphere(18), am, { p: [s * 0.08, -0.12, 0], s: [0.16, 0.24, 0.17], parent: pivot, cast: false });
      pivot.userData.side = s;
      this.arms.push(pivot);
    }
  }

  buildFace(sp, o) {
    const eyeCol = o.eye || sp.eye || '#6A4FE0';
    const ink = M.glossy(INK, { clearcoatRoughness: 0.02, roughness: 0.12 });
    const irisM = M.glossy(eyeCol, { roughness: 0.2 });
    const white = M.basic('#FFFFFF');
    const eyeSize = sp.owlEyes ? 1.15 : sp.oneEye ? 1.55 : 1;
    const spots = sp.oneEye ? [[0, 0.16]] : sp.ears === 'frog' ? [[-0.42, 0.42], [0.42, 0.42]] : [[-0.36, 0.13], [0.36, 0.13]];
    this.eyes = [];
    for (const [a, e] of spots) {
      if (sp.ears === 'frog') {
        // frog eyes sit on bumps on the top of the head
        const bump = mesh(G.sphere(24), M.toy(sp.body), { s: 0.27, cast: false });
        this.stick(bump, a, e, -0.12);
      }
      if (sp.owlEyes || sp.patches) {
        const disc = mesh(G.sphere(24), M.toy(sp.patches || lighten(sp.body, 0.55)), { s: sp.patches ? [0.27, 0.32, 0.06] : [0.31, 0.31, 0.06], cast: false });
        this.stick(disc, a * 1.05, e - 0.02, -0.02, this.face, sp.patches ? (a < 0 ? -0.5 : 0.5) : 0);
      }
      const eye = group(null);
      this.stick(eye, a, e, sp.ears === 'frog' ? 0.1 : 0.0);
      const ball = group(eye);
      mesh(G.sphere(28), ink, { s: [0.19 * eyeSize, 0.23 * eyeSize, 0.11], parent: ball, cast: false });
      mesh(G.sphere(20), irisM, { p: [0, -0.07 * eyeSize, 0.045], s: [0.13 * eyeSize, 0.12 * eyeSize, 0.07], parent: ball, cast: false });
      mesh(G.sphere(12), white, { p: [-0.06 * eyeSize, 0.085 * eyeSize, 0.1], s: 0.068 * eyeSize, parent: ball, cast: false });
      mesh(G.sphere(10), white, { p: [0.065 * eyeSize, -0.05 * eyeSize, 0.1], s: 0.034 * eyeSize, parent: ball, cast: false });
      // closed / happy eye: a little arch
      const shut = mesh(G.torus(0.28, Math.PI, 16), ink, { p: [0, -0.02, 0.07], s: [0.12 * eyeSize, 0.11 * eyeSize, 0.12], parent: eye, cast: false });
      shut.visible = false;
      const flatShut = mesh(G.torus(0.28, Math.PI, 16), ink, { p: [0, 0.03, 0.07], r: [0, 0, Math.PI], s: [0.12 * eyeSize, 0.08 * eyeSize, 0.12], parent: eye, cast: false });
      flatShut.visible = false;
      this.eyes.push({ g: eye, ball, shut, flatShut, base: eye.position.clone() });
    }
    // cheeks
    const blushM = M.basic(sp.rosy || '#FF8FB4', { transparent: true, opacity: 0.55, depthWrite: false });
    for (const s of [-1, 1]) {
      const b = mesh(G.sphere(16), blushM, { s: [0.14, 0.085, 0.03], cast: false });
      this.stick(b, s * 0.6, -0.08, 0.005);
    }
    // muzzle and nose
    let mouthE = -0.17, mouthOut = 0;
    if (sp.snout) {
      const sn = mesh(G.sphere(24), M.toy(sp.snout), { s: [0.3, 0.21, 0.2], cast: false });
      this.stick(sn, 0, -0.14, -0.08);
      mouthE = -0.27;
      mouthOut = 0.06;
    }
    if (sp.nose || sp.snout) {
      const nose = mesh(G.sphere(20), M.glossy(sp.noseCol || '#4A3050'), { s: [0.085, 0.06, 0.06], cast: false });
      this.stick(nose, 0, sp.snout ? -0.07 : -0.05, sp.snout ? 0.1 : 0.02);
    }
    if (sp.noseBig) {
      const nose = mesh(G.sphere(20), M.glossy('#4A4660'), { s: [0.15, 0.12, 0.09], cast: false });
      this.stick(nose, 0, -0.06, 0.02);
      mouthE = -0.26;
    }
    if (sp.pigSnout) {
      const sn = mesh(G.puck(0.4), M.toy('#FF9DB8'), { s: [0.17, 0.07, 0.12], r: [Math.PI / 2, 0, 0], cast: false });
      const holder = group(null);
      holder.add(sn);
      this.stick(holder, 0, -0.08, 0.03);
      for (const s of [-1, 1]) mesh(G.sphere(10), M.basic('#C25C7E'), { p: [s * 0.055, 0, 0.04], s: [0.025, 0.035, 0.01], parent: holder, cast: false });
      mouthE = -0.28;
    }
    if (sp.beak) {
      const bk = group(null);
      this.stick(bk, 0, -0.06, -0.02);
      mesh(G.sphere(20), M.glossy(sp.beak), { p: [0, 0.02, 0.06], s: [0.14, 0.09, 0.16], parent: bk, cast: false });
      this.beakLow = mesh(G.sphere(16), M.glossy(darken(sp.beak, 0.1)), { p: [0, -0.06, 0.04], s: [0.1, 0.05, 0.11], parent: bk, cast: false });
      mouthE = null;
    }
    if (sp.whisk) {
      const wm = M.basic('#8A6E8E');
      for (const s of [-1, 1]) for (const k of [-1, 1]) {
        const w = mesh(G.capsule(1, 6), wm, { s: [0.008, 0.11, 0.008], cast: false });
        const holder = group(null);
        holder.add(w);
        w.rotation.z = s * (Math.PI / 2 + k * 0.18);
        w.position.x = s * 0.1;
        this.stick(holder, s * 0.52, -0.16 + k * 0.035, 0.0);
      }
    }
    // mouth
    this.mouth = group(null);
    if (mouthE === null) this.stick(this.mouth, 0, -0.08, 0.12);
    if (mouthE !== null) {
      this.stick(this.mouth, 0, mouthE, mouthOut);
      this.smile = mesh(G.torus(0.34, Math.PI, 20), M.glossy(MOUTH), { r: [0, 0, Math.PI], s: [0.115, 0.095, 0.1], parent: this.mouth, cast: false });
      const om = group(this.mouth);
      mesh(G.sphere(20), M.glossy('#7A2C50'), { s: [0.13, 0.12, 0.05], parent: om, cast: false });
      mesh(G.sphere(16), M.toy('#FF8BA7'), { p: [0, -0.055, 0.025], s: [0.085, 0.05, 0.04], parent: om, cast: false });
      this.open = om;
      om.scale.y = 0.01;
      om.visible = false;
    }
  }

  buildEars(sp) {
    const body = M.toy(sp.earCol || sp.body);
    const inner = M.toy(sp.inner || lighten(sp.body, 0.45));
    const T = this.yaw;
    // Ears are placed on the surface but oriented explicitly: y is "out of the head",
    // z faces the viewer, and each side leans outward a little
    const at = (a, e, out = -0.05, lean = 0, back = 0) => {
      const h = group(T);
      h.position.copy(this.surf(a, e, out).p);
      h.position.y += this.ry;
      h.rotation.set(back, 0, lean);
      return h;
    };
    const ear = (h, side, floppy = 0) => { h.userData.side = side; h.userData.floppy = floppy; this.ears.push(h); return h; };
    switch (sp.ears) {
      case 'cat': case 'fox': {
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.52, 0.86, -0.08, -s * 0.42, -0.1), s);
          mesh(pointEar(), body, { p: [0, 0.2, 0], s: [0.32, 0.46, 0.16], parent: h, cast: false });
          mesh(pointEar(), inner, { p: [0, 0.18, 0.07], s: [0.19, 0.3, 0.07], parent: h, cast: false });
        }
        break;
      }
      case 'bunny': {
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.3, 1.0, -0.06, -s * 0.2, -0.12), s, 0.6);
          mesh(G.capsule(1.6, 16), body, { p: [0, 0.48, 0], s: [0.15, 0.24, 0.1], parent: h, cast: false });
          mesh(G.capsule(1.6, 12), inner, { p: [0, 0.5, 0.06], s: [0.085, 0.19, 0.05], parent: h, cast: false });
        }
        break;
      }
      case 'round': case 'panda': case 'koala': case 'mouse': {
        const big = sp.ears === 'mouse' ? 0.36 : sp.ears === 'koala' ? 0.34 : 0.26;
        const em = sp.ears === 'panda' ? M.toy(sp.patches) : body;
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.95, 0.8, -0.1, -s * 0.6, -0.15), s);
          mesh(G.sphere(24), em, { p: [0, big * 0.6, 0], s: [big, big, big * 0.55], parent: h, cast: false });
          if (sp.ears !== 'panda') mesh(G.sphere(20), inner, { p: [0, big * 0.6, big * 0.42], s: [big * 0.6, big * 0.6, big * 0.18], parent: h, cast: false });
          if (sp.ears === 'koala') for (let i = 0; i < 5; i++) mesh(G.sphere(12), M.plush('#FFFFFF'), { p: [s * big * 0.8 * Math.abs(Math.cos(i * 0.7)), big * 0.6 + Math.sin(i * 1.3 - 1) * big * 0.7, 0.08], s: big * 0.28, parent: h, cast: false });
        }
        break;
      }
      case 'dog': case 'floppy': case 'poodle': case 'dogSmall': {
        const em = sp.ears === 'poodle' ? M.plush(sp.body) : body;
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.72, 0.62, -0.06, 0, 0), s, 1);
          if (sp.ears === 'poodle') {
            for (let i = 0; i < 3; i++) mesh(G.sphere(16), em, { p: [s * 0.06, -0.06 - i * 0.15, 0], s: 0.15, parent: h, cast: false });
          } else if (sp.ears === 'dogSmall') {
            mesh(G.sphere(20), em, { p: [s * 0.08, 0.02, 0.02], r: [0, 0, s * 0.7], s: [0.17, 0.13, 0.06], parent: h, cast: false });
          } else {
            mesh(G.sphere(22), em, { p: [s * 0.12, -0.2, 0], r: [0, 0, s * 0.3], s: [0.16, sp.ears === 'floppy' ? 0.2 : 0.33, 0.08], parent: h, cast: false });
          }
        }
        break;
      }
      case 'sprout': {
        const h = ear(at(0, 1.5, -0.03), 0, 0.4);
        mesh(G.capsule(2, 8), M.toy('#5FBF72'), { p: [0, 0.1, 0], s: [0.035, 0.06, 0.035], parent: h, cast: false });
        for (const s of [-1, 1]) {
          mesh(G.sphere(20), M.toy(s < 0 ? '#7ADB80' : '#92E58E'), { p: [s * 0.14, 0.24, 0], r: [0, 0, s * -0.9], s: [0.07, 0.2, 0.13], parent: h, cast: false });
        }
        break;
      }
      case 'unicorn': {
        const h = at(0, 0.98, -0.03, 0, 0.25);
        mesh(horn(), M.glossy('#FFD45C', { emissive: '#FFB000', emissiveIntensity: 0.15 }), { p: [0, 0.24, 0], s: [0.34, 0.5, 0.34], parent: h, cast: false });
        for (const s of [-1, 1]) {
          const e = ear(at(s * 0.56, 0.84, -0.06, -s * 0.5), s);
          mesh(pointEar(), body, { p: [0, 0.14, 0], s: [0.22, 0.32, 0.12], parent: e, cast: false });
          mesh(pointEar(), inner, { p: [0, 0.13, 0.05], s: [0.13, 0.2, 0.05], parent: e, cast: false });
        }
        break;
      }
      case 'dragon': case 'horns': {
        const hm = M.glossy(sp.ears === 'horns' ? '#FFF1C9' : '#FFE9B0');
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.44, 0.95, -0.05, -s * 0.38), s);
          mesh(horn(), hm, { p: [0, 0.14, 0], s: [0.2, 0.32, 0.2], parent: h, cast: false });
        }
        break;
      }
      case 'tuft': case 'crest': {
        const fm = sp.ears === 'crest' ? M.toy('#FFD23F', { emissive: '#FF8800', emissiveIntensity: 0.25 }) : body;
        for (let i = -1; i <= 1; i++) {
          const h = ear(at(i * 0.22, 1.32, -0.04, -i * 0.5), i, 0.5);
          mesh(G.sphere(16), fm, { p: [0, 0.14, 0], s: [0.07, 0.2, 0.07], parent: h, cast: false });
        }
        break;
      }
      case 'tufts': {
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.6, 0.82, -0.06, -s * 0.75), s);
          mesh(pointEar(), body, { p: [0, 0.16, 0], s: [0.2, 0.36, 0.1], parent: h, cast: false });
        }
        break;
      }
      case 'antenna': {
        for (const s of [-1, 1]) {
          const h = ear(at(s * 0.3, 1.1, -0.02, -s * 0.35), s, 0.8);
          mesh(G.capsule(1, 6), M.toy('#5A4470'), { p: [0, 0.18, 0], s: [0.025, 0.12, 0.025], parent: h, cast: false });
          mesh(G.sphere(14), M.glossy('#5A4470'), { p: [0, 0.38, 0], s: 0.07, parent: h, cast: false });
        }
        break;
      }
      case 'fins': case 'gills': {
        const fm = sp.ears === 'gills' ? M.toy('#FF7FB8') : M.toy(lighten(sp.body, 0.35));
        for (const s of [-1, 1]) {
          const h = ear(at(s * 1.3, 0.3, -0.06, -s * 1.2), s, 0.6);
          if (sp.ears === 'gills') {
            for (let i = -1; i <= 1; i++) mesh(G.capsule(1, 8), fm, { p: [i * 0.1, 0.16, 0], r: [0, 0, -i * 0.4], s: [0.04, 0.13, 0.04], parent: h, cast: false });
          } else mesh(G.sphere(18), fm, { p: [0, 0.14, 0], s: [0.2, 0.2, 0.05], parent: h, cast: false });
        }
        break;
      }
      case 'fluff': case 'sheep': {
        const wool = M.plush(sp.ears === 'sheep' ? '#FFF9EE' : sp.body);
        const n = sp.ears === 'sheep' ? 13 : 7;
        for (let i = 0; i < n; i++) {
          const a = ((i + 0.5) / n - 0.5) * 3.4;
          const e = (sp.ears === 'sheep' ? 0.95 : 0.82) + 0.25 * Math.cos(i * 2.1) - Math.abs(a) * 0.12;
          const h = at(a, e, -0.12);
          mesh(G.sphere(16), wool, { s: 0.2 + 0.06 * Math.abs(Math.sin(i * 1.7)), parent: h, cast: false });
        }
        if (sp.ears === 'sheep') for (const s of [-1, 1]) {
          const h = ear(at(s * 0.95, 0.4, -0.05), s, 1);
          mesh(G.sphere(16), M.toy('#FFD9C2'), { p: [s * 0.1, -0.04, 0], r: [0, 0, s * 0.4], s: [0.17, 0.08, 0.08], parent: h, cast: false });
        }
        break;
      }
      case 'stars': {
        for (let i = -1; i <= 1; i++) {
          const h = ear(at(i * 0.42, 1.05 - Math.abs(i) * 0.14, -0.02, -i * 0.5), i);
          mesh(G.puffy('star5', starShapeFn(), 0.18, 0.08), M.glossy('#FFC233'), { p: [0, 0.12, 0], s: 0.13, parent: h, cast: false });
        }
        break;
      }
      default: break;
    }
  }

  buildExtras(sp) {
    const T = this.yaw;
    if (sp.mane) {
      const cols = ['#FF9EC9', '#C7ABFF', '#8FDBFF', '#FFE27D'];
      for (let i = 0; i < 7; i++) {
        const e = 1.25 - i * 0.28;
        const h = group(null);
        this.stick(h, Math.PI + 0.001, e - 0.5, -0.1, T);
        mesh(G.sphere(16), M.toy(cols[i % 4]), { p: [0, 0, 0.12], s: 0.2 - i * 0.012, parent: h, cast: false });
      }
    }
    if (sp.wings || sp.wingsPeg) {
      const wm = M.toy(sp.wings || sp.wingsPeg);
      this.wings = [];
      for (const s of [-1, 1]) {
        const piv = group(T, [s * 0.45, this.ry * 1.05, -0.65]);
        const w = mesh(G.sphere(20), wm, { p: [s * 0.32, 0.12, 0], s: [0.38, 0.24, 0.05], parent: piv, cast: false });
        w.rotation.z = s * 0.4;
        piv.userData.side = s;
        this.wings.push(piv);
      }
    }
    if (sp.wingsSmall) {
      this.flaps = [];
      const fm = M.toy(darken(sp.body, 0.05));
      for (const s of [-1, 1]) {
        const piv = group(T, [s * this.rx * 0.92, this.ry * 0.95, 0.05]);
        mesh(G.sphere(18), fm, { p: [s * 0.08, -0.16, 0], s: [0.1, 0.28, 0.2], parent: piv, cast: false });
        piv.userData.side = s;
        this.flaps.push(piv);
      }
    }
    if (sp.wingsBee) {
      this.wings = [];
      const wm = M.glossy('#FFFFFF', { transparent: true, opacity: 0.55, depthWrite: false });
      for (const s of [-1, 1]) {
        const piv = group(T, [s * 0.35, this.ry * 1.5, -0.5]);
        mesh(G.sphere(18), wm, { p: [s * 0.25, 0.15, 0], s: [0.3, 0.2, 0.03], r: [0, 0, s * 0.5], parent: piv, cast: false });
        piv.userData.side = s;
        this.wings.push(piv);
      }
    }
    if (sp.gem) {
      const g = group(null);
      this.stick(g, 0, 0.62, 0.02, this.face);
      mesh(G.sphere(12), M.glossy('#FF7FC8', { emissive: '#FF4FA8', emissiveIntensity: 0.3 }), { s: [0.09, 0.09, 0.05], parent: g, cast: false });
    }
    if (sp.shell) {
      const sh = mesh(G.sphere(32), M.glossy(sp.shell), { p: [0, this.ry * 1.05, -0.35], s: [0.95, 0.75, 0.75], parent: T });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        mesh(G.sphere(12), M.toy(lighten(sp.shell, 0.35)), { p: [Math.cos(a) * 0.45, this.ry * 1.05 + Math.sin(a) * 0.38 + 0.2, -0.9], s: [0.18, 0.18, 0.08], parent: T, cast: false });
      }
      sh.castShadow = true;
    }
    if (sp.glow) {
      const gl = mesh(G.sphere(16), M.glow(sp.glow, { opacity: 0.08 }), { p: [0, this.ry, 0], s: 1.35, parent: T, cast: false });
      this.halo = gl;
    }
    // tails
    const tm = M.toy(sp.tailCol || sp.body);
    if (sp.tail === 'wag' || sp.ears === 'cat' || sp.ears === 'fox') {
      const piv = group(T, [0, this.ry * 0.55, -this.rz * 0.92]);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const tip = sp.ears === 'fox' && i === n - 1;
        mesh(G.sphere(12), tip ? M.toy('#FFFFFF') : tm, { p: [0, i * 0.09 + i * i * 0.012, -i * 0.08], s: 0.12 + (sp.ears === 'fox' ? i * 0.03 : -i * 0.008), parent: piv, cast: false });
      }
      this.tail = piv;
    } else if (sp.tail === 'puff' || sp.ears === 'bunny') {
      this.tail = group(T, [0, this.ry * 0.5, -this.rz * 0.95]);
      mesh(G.sphere(14), M.plush('#FFFFFF'), { s: 0.2, parent: this.tail, cast: false });
    } else if (sp.tail === 'curl' || sp.pigSnout) {
      this.tail = group(T, [0, this.ry * 0.6, -this.rz * 0.98]);
      mesh(G.torus(0.3, Math.PI * 1.6, 16), tm, { s: 0.1, r: [0, Math.PI / 2, 0], parent: this.tail, cast: false });
    } else if (sp.tail === 'spike') {
      this.tail = group(T, [0, this.ry * 0.45, -this.rz * 0.9]);
      for (let i = 0; i < 4; i++) mesh(G.sphere(12), tm, { p: [0, i * 0.03, -i * 0.12], s: 0.16 - i * 0.025, parent: this.tail, cast: false });
      mesh(horn(), M.glossy('#FFE9B0'), { p: [0, 0.1, -0.5], r: [-1.2, 0, 0], s: 0.14, parent: this.tail, cast: false });
    }
  }

  // ---- behaviour ----------------------------------------------------------------------
  say(kind = 'coo', vol = 0.6) {
    audio.voice(kind, this.voicePitch, vol);
    this.talkT = kind === 'giggle' ? 0.55 : kind === 'yawn' ? 0.8 : 0.35;
  }
  poke(k = 1) {
    this.sq.kick(-6 * k);
    this.tilt.kick((Math.random() - 0.5) * 6 * k);
    this.excite = 1;
  }
  hop(v = 4.5) {
    if (this.y > 0.02) return;
    this.vy = v;
    this.sq.kick(4);
  }
  wave() { this.waveT = 1.4; }
  setMood(m, dur = 1.2) { this.mood = m; this.moodT = dur; }
  /** look at a world point (or null to look ahead) */
  look(p) { this.lookAt = p; }

  /** Merge the parts that never move on their own: half the draw calls */
  bakeParts() {
    this.baked = true;
    bake(this.yaw, [this.body, this.face, ...this.ears, ...this.arms, this.tail, ...(this.wings || []), ...(this.flaps || []), this.halo, this.halo2 && this.halo2.parent, this.ring, this.aura]);
    bake(this.face, [...this.eyes.map((e) => e.g), this.mouth, this.beakLow]);
    for (const e of this.ears) bake(e);
    for (const e of this.eyes) bake(e.ball);
  }

  update(dt, cam) {
    if (!this.baked) this.bakeParts();
    this.t += dt;
    const t = this.t;
    if (this.moodT > 0) { this.moodT -= dt; if (this.moodT <= 0) this.mood = this.sleep ? 'sleep' : 'idle'; }
    this.excite = Math.max(0, this.excite - dt * 0.8);

    // hop physics in local units
    if (this.y > 0 || this.vy > 0) {
      this.vy -= 18 * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        if (this.vy < -2) this.sq.kick(this.vy * 1.3);
        this.vy = 0;
      }
    }
    this.bounce.position.y = this.y;
    if (this.shadow) {
      const k = 1 / (1 + this.y * 0.6);
      this.shadow.scale.set(2.1 * k, 2.1 * k, 1);
      this.shadow.material.opacity = 0.32 * k;
    }

    // squash and stretch, plus breathing
    this.sq.to = 1 + (this.vy > 0.5 ? 0.12 : 0);
    const s = this.sq.step(dt);
    const breathe = this.sleep ? Math.sin(t * 1.6) * 0.035 : Math.sin(t * 2.4) * 0.016;
    const sy = s + breathe, sxz = 1 / Math.sqrt(Math.max(0.3, sy));
    this.squash.scale.set(sxz, sy, sxz);
    this.squash.rotation.z = this.tilt.step(dt) * 0.08 + (this.mood === 'happy' ? Math.sin(t * 9) * 0.06 : 0);

    // looking around
    let ty = 0, tp = 0;
    if (this.lookAt) {
      const wp = TMP_V;
      this.face.getWorldPosition(wp);
      const d = TMP_D.copy(this.lookAt).sub(wp);
      const inv = TMP_Q;
      this.root.getWorldQuaternion(inv).invert();
      d.applyQuaternion(inv);
      ty = Math.max(-0.5, Math.min(0.5, Math.atan2(d.x, Math.max(0.3, d.z))));
      tp = Math.max(-0.3, Math.min(0.3, -Math.atan2(d.y, Math.hypot(d.x, d.z)) * 0.6));
    } else {
      ty = Math.sin(t * 0.37) * 0.12;
      tp = Math.sin(t * 0.29) * 0.04;
    }
    const k = 1 - Math.exp(-dt * 6);
    this.lookYaw += (ty - this.lookYaw) * k;
    this.lookPitch += (tp - this.lookPitch) * k;
    this.yaw.rotation.y = this.lookYaw * 0.55;
    this.face.rotation.set(this.lookPitch * 0.6, this.lookYaw * 0.35, 0);

    // blinking and eye shapes
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinkT = rnd(2, 5); this.blinkK = 0; }
    this.blinkK = Math.min(1, this.blinkK + dt * 9);
    const blink = this.blinkK < 0.5 ? 1 - this.blinkK * 2 : (this.blinkK - 0.5) * 2;
    const closed = this.mood === 'sleep' || this.sleep;
    const happy = this.mood === 'happy' || this.mood === 'love';
    for (const e of this.eyes) {
      e.ball.visible = !closed && !happy;
      e.shut.visible = happy;
      e.flatShut.visible = closed;
      const wow = this.mood === 'wow' ? 1.18 : 1;
      e.ball.scale.set(wow, Math.max(0.08, blink) * wow, 1);
    }

    // mouth
    this.talkT = Math.max(0, this.talkT - dt);
    let open = 0;
    if (this.talkT > 0) open = 0.45 + 0.45 * Math.abs(Math.sin(t * 22));
    else if (this.mood === 'wow') open = 0.8;
    else if (this.mood === 'eat') open = 0.5 + 0.5 * Math.abs(Math.sin(t * 10));
    else if (this.mood === 'happy') open = 0.55;
    else if (this.mood === 'sleep' || this.sleep) open = 0.15 + 0.05 * Math.sin(t * 1.6);
    this.mouthOpen += (open - this.mouthOpen) * Math.min(1, dt * 18);
    if (this.open) {
      this.open.visible = this.mouthOpen > 0.08;
      this.smile.visible = !this.open.visible;
      this.open.scale.set(1, Math.max(0.01, this.mouthOpen), 1);
    }
    if (this.beakLow) this.beakLow.position.y = -0.06 - this.mouthOpen * 0.05;

    // ears, arms, wings, tail
    const ex = this.excite;
    for (const e of this.ears) {
      const side = e.userData.side || 0;
      const fl = e.userData.floppy || 0;
      if (!e.userData.base) e.userData.base = e.quaternion.clone();
      e.quaternion.copy(e.userData.base);
      e.rotateZ(Math.sin(t * 2.2 + side) * 0.05 + this.sq.v * 0.012 * side * (1 + fl));
      e.rotateX(Math.sin(t * 1.7) * 0.03 * fl - this.sq.v * 0.01 * fl);
    }
    this.waveT = Math.max(0, this.waveT - dt);
    for (const a of this.arms) {
      const sd = a.userData.side;
      let r = Math.sin(t * 2.4 + sd) * 0.08 + ex * Math.sin(t * 16) * 0.3;
      if (this.waveT > 0 && sd > 0) r = -2.2 + Math.sin(t * 14) * 0.45;
      if (this.mood === 'happy' && this.waveT <= 0) r = -1.2 * 1 + Math.sin(t * 12 + sd) * 0.3;
      a.rotation.z = sd > 0 ? r : -r;
    }
    if (this.flaps) for (const f of this.flaps) f.rotation.z = f.userData.side * (0.1 + (this.y > 0 || ex > 0.2 ? Math.abs(Math.sin(t * 18)) * 0.9 : Math.sin(t * 2) * 0.05));
    if (this.wings) for (const w of this.wings) w.rotation.y = w.userData.side * (0.3 + Math.sin(t * (this.sp.wingsBee ? 40 : 4 + ex * 10)) * 0.35);
    if (this.tail) {
      const wag = this.sp.tail === 'wag' ? Math.sin(t * (6 + ex * 14)) * (0.3 + ex * 0.5) : Math.sin(t * 2) * 0.1;
      this.tail.rotation.set(-0.3, wag, 0);
    }
    if (this.halo) this.halo.scale.setScalar(1.4 + Math.sin(t * 3) * 0.06);
    if (this.halo2) this.halo2.parent.position.y = this.ry * 2.25 + Math.sin(t * 2.5) * 0.04;
  }

  /** Free everything this creature created only for itself */
  dispose() {
    this.root.traverse((o) => { if (o.geometry && o.geometry.userData.baked) o.geometry.dispose(); });
    if (this.shadow) this.shadow.material.dispose();
    if (!this.sp.jelly && this.bodyMat) this.bodyMat.dispose();
  }
}

let starShapeCache = null;
function starShapeFn() {
  if (starShapeCache) return starShapeCache;
  const s = new THREE.Shape();
  const n = 5, pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n, R = i % 2 ? 0.5 : 1;
    pts.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  pts.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
  s.closePath();
  starShapeCache = s;
  return s;
}

/** A tiny critter preview spinning on a cushion: used by collections */
export function critterIds() { return Object.keys(SPECIES); }

// ---- accessories: small things to wear, so every collectible feels unique ---------------
const ACC = {
  bow(c, col = '#FF5C8F') {
    const g = headTop(c, 0.55, 1.0);
    for (const k of [-1, 1]) mesh(G.sphere(16), M.glossy(col), { p: [k * 0.13, 0, 0], r: [0, 0, k * 0.3], s: [0.15, 0.1, 0.07], parent: g, cast: false });
    mesh(G.sphere(12), M.glossy(darken(col, 0.1)), { s: 0.065, parent: g, cast: false });
  },
  chef(c) {
    const g = headTop(c, 0, 1.45, -0.06);
    mesh(G.cyl(24), M.plush('#FFFFFF'), { p: [0, 0.1, 0], s: [0.36, 0.22, 0.36], parent: g, cast: false });
    for (let i = 0; i < 5; i++) mesh(G.sphere(16), M.plush('#FFFFFF'), { p: [Math.cos(i * 1.26) * 0.22, 0.32, Math.sin(i * 1.26) * 0.22], s: 0.2, parent: g, cast: false });
    mesh(G.sphere(16), M.plush('#FFFFFF'), { p: [0, 0.4, 0], s: 0.24, parent: g, cast: false });
  },
  flower(c, col = '#FFD45C') {
    const g = headTop(c, -0.6, 0.85);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; mesh(G.sphere(12), M.toy(col), { p: [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0], s: [0.08, 0.08, 0.04], parent: g, cast: false }); }
    mesh(G.sphere(10), M.toy('#FF8A4C'), { p: [0, 0, 0.03], s: 0.06, parent: g, cast: false });
    g.rotation.x = -0.6;
  },
  crown(c) {
    const g = headTop(c, 0, 1.45, -0.04);
    const gold = M.metal('#FFC93C', { roughness: 0.2 });
    mesh(G.cyl(24, 1.08), gold, { s: [0.3, 0.13, 0.3], parent: g, cast: false });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      mesh(G.cone(8), gold, { p: [Math.sin(a) * 0.28, 0.13, Math.cos(a) * 0.28], s: [0.07, 0.15, 0.07], parent: g, cast: false });
      mesh(G.sphere(8), M.glossy(['#FF5C8F', '#6FC4FF', '#7FE3A0'][i % 3]), { p: [Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3], s: 0.04, parent: g, cast: false });
    }
  },
  party(c, col = '#6FC4FF') {
    const g = headTop(c, 0.3, 1.3, -0.04);
    mesh(G.cone(20), M.toy(col), { p: [0, 0.22, 0], s: [0.18, 0.45, 0.18], parent: g, cast: false });
    mesh(G.sphere(12), M.plush('#FFFFFF'), { p: [0, 0.46, 0], s: 0.08, parent: g, cast: false });
    for (let i = 0; i < 3; i++) mesh(G.torus(0.2, TAU, 20), M.toy('#FFE066'), { p: [0, 0.08 + i * 0.12, 0], r: [Math.PI / 2, 0, 0], s: 0.15 - i * 0.04, parent: g, cast: false });
    g.rotation.z = -0.25;
  },
  strawberry(c) {
    const g = headTop(c, 0, 1.4, -0.05);
    mesh(G.sphere(24), M.glossy('#FF4F6E'), { p: [0, 0.12, 0], s: [0.3, 0.26, 0.3], parent: g, cast: false });
    for (let i = 0; i < 12; i++) mesh(G.sphere(6), M.basic('#FFE9A8'), { p: [Math.cos(i * 2.4) * 0.27, 0.06 + (i % 3) * 0.06, Math.sin(i * 2.4) * 0.27], s: 0.02, parent: g, cast: false });
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; mesh(G.sphere(10), M.toy('#5FBF72'), { p: [Math.cos(a) * 0.12, 0.34, Math.sin(a) * 0.12], r: [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6], s: [0.08, 0.03, 0.13], parent: g, cast: false }); }
  },
  glasses(c, col = '#8C68F2') {
    const g = new THREE.Group();
    c.stick(g, 0, 0.13, 0.05);
    for (const k of [-1, 1]) mesh(G.torus(0.14, TAU, 24), M.glossy(col), { p: [k * 0.33, 0, 0], s: 0.19, parent: g, cast: false });
    mesh(G.capsule(1, 6), M.glossy(col), { r: [0, 0, Math.PI / 2], s: [0.02, 0.06, 0.02], parent: g, cast: false });
  },
  scarf(c, col = '#FF6F8F') {
    const g = group(c.yaw, [0, c.ry * 0.62, 0]);
    mesh(G.torus(0.3, TAU, 32), M.plush(col), { r: [Math.PI / 2, 0, 0], s: [c.rx * 0.98, c.rz * 0.98, 0.5], parent: g, cast: false });
    mesh(G.box(0.4), M.plush(col), { p: [0.35, -0.2, c.rz * 0.8], r: [0.2, 0, 0.2], s: [0.18, 0.35, 0.08], parent: g, cast: false });
  },
  headphones(c, col = '#FF8FC0') {
    const g = group(c.yaw, [0, c.ry, 0]);
    mesh(G.torus(0.06, Math.PI, 32), M.glossy(col), { s: [c.rx * 1.08, c.ry * 1.08, 1], parent: g, cast: false });
    for (const k of [-1, 1]) mesh(G.puck(0.4), M.glossy(lighten(col, 0.2)), { p: [k * c.rx * 1.02, 0, 0], r: [0, 0, Math.PI / 2], s: [0.24, 0.12, 0.24], parent: g, cast: false });
  },
  halo(c) {
    const g = headTop(c, 0, 1.6, 0.35);
    c.halo2 = mesh(G.torus(0.18, TAU, 32), M.glow('#FFE680', { opacity: 0.95 }), { r: [Math.PI / 2, 0, 0], s: 0.3, parent: g, cast: false });
  },
  star(c, col = '#FFC233') {
    const g = headTop(c, 0.62, 0.8);
    mesh(G.puffy('star5c', starShapeFn(), 0.25, 0.1), M.glossy(col), { s: 0.13, parent: g, cast: false });
    g.rotation.x = -0.6;
  },
  beret(c, col = '#5698FF') {
    const g = headTop(c, 0.2, 1.4, -0.06);
    mesh(G.sphere(24), M.plush(col), { s: [0.42, 0.12, 0.4], r: [0, 0, -0.2], parent: g, cast: false });
    mesh(G.sphere(8), M.plush(col), { p: [0, 0.12, 0], s: 0.05, parent: g, cast: false });
  },
  leaf(c) {
    const g = headTop(c, 0.1, 1.45, -0.04);
    mesh(G.capsule(1, 6), M.toy('#5FBF72'), { p: [0, 0.2, 0], s: [0.025, 0.2, 0.025], parent: g, cast: false });
    mesh(G.sphere(20), M.toy('#7FD86F'), { p: [0, 0.45, 0], s: [0.42, 0.08, 0.36], parent: g, cast: false });
  },
  cherry(c) {
    const g = headTop(c, 0.45, 1.1, -0.04);
    for (const k of [-1, 1]) {
      mesh(G.sphere(16), M.glossy('#FF3E6C'), { p: [k * 0.09, 0, 0], s: 0.1, parent: g, cast: false });
      mesh(G.capsule(1, 4), M.toy('#5FBF72'), { p: [k * 0.045, 0.14, 0], r: [0, 0, -k * 0.4], s: [0.012, 0.08, 0.012], parent: g, cast: false });
    }
  },
  donut(c) {
    const g = headTop(c, -0.2, 1.4, -0.06);
    mesh(G.torus(0.45, TAU, 32), M.toy('#E8B27C'), { r: [Math.PI / 2 - 0.3, 0, 0], s: 0.22, parent: g, cast: false });
    mesh(G.torus(0.38, TAU, 32), M.glossy('#FF8FC0'), { p: [0, 0.035, 0], r: [Math.PI / 2 - 0.3, 0, 0], s: [0.225, 0.225, 0.16], parent: g, cast: false });
  },
  sailor(c) {
    const g = headTop(c, 0, 1.42, -0.06);
    mesh(G.puck(0.3), M.plush('#FFFFFF'), { s: [0.34, 0.18, 0.34], parent: g, cast: false });
    mesh(G.torus(0.2, TAU, 28), M.toy('#5698FF'), { p: [0, -0.06, 0], r: [Math.PI / 2, 0, 0], s: 0.33, parent: g, cast: false });
  },
  sparkles(c) {
    c.sparkleOn = true;
  }
};
function headTop(c, a, e, out = 0) {
  const g = group(c.yaw);
  g.position.copy(c.surf(a, e, out).p);
  g.position.y += c.ry;
  g.rotation.z = -a * 0.5;
  return g;
}
/** Dress a creature: kind is a key of ACC, col an optional colour */
export function wear(c, kind, col) {
  if (ACC[kind]) ACC[kind](c, col);
  return c;
}
export const ACCESSORIES = Object.keys(ACC);
