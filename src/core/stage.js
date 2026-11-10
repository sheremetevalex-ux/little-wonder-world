// The 3D layer. One WebGL renderer for the whole app draws on a canvas behind the
// 2D canvas: a scene that wants depth owns a Stage, and the 2D layer on top keeps
// buttons, particles and hints. Everything looks like soft vinyl toys in a bright
// studio: an image-based light for reflections, a warm key light with soft
// shadows, a cool rim light that outlines every shape, and gentle tone mapping.
import * as THREE from '../vendor/three.js';
import { RoomEnvironment } from '../vendor/three.js';

export { THREE };

export const gl = { renderer: null, canvas: null, env: null, w: 0, h: 0, pr: 1, failed: false, app: null };

/** Created on first use, then kept for the whole session (iOS dislikes many contexts). */
export function renderer() {
  if (gl.renderer || gl.failed) return gl.renderer;
  const cv = gl.canvas = document.getElementById('gl');
  try {
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance', stencil: false });
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    gl.renderer = r;
    const pm = new THREE.PMREMGenerator(r);
    gl.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    cv.addEventListener('webglcontextlost', (e) => e.preventDefault());
  } catch (e) {
    console.error(e);
    gl.failed = true;
  }
  return gl.renderer;
}

export function resizeGL(app) {
  gl.app = app;
  const r = gl.renderer;
  if (!r) return;
  const vw = app.W * app.scale, vh = app.H * app.scale;
  // Retina is wasted on soft shapes: cap the 3D layer lower than the 2D one
  const pr = Math.min(window.devicePixelRatio || 1, 2) * Math.min(1, app.quality + 0.05);
  if (vw === gl.w && vh === gl.h && pr === gl.pr) return;
  gl.w = vw; gl.h = vh; gl.pr = pr;
  r.setPixelRatio(pr);
  r.setSize(vw, vh, false);
  gl.canvas.style.width = vw + 'px';
  gl.canvas.style.height = vh + 'px';
}

export function showGL(on) {
  if (!gl.canvas) gl.canvas = document.getElementById('gl');
  const d = on ? 'block' : 'none';
  if (gl.canvas.style.display !== d) gl.canvas.style.display = d;
}

// ---- colours -------------------------------------------------------------------
const tmpC = new THREE.Color();
export const col = (c) => new THREE.Color(c);
export function lighten(c, t) { return tmpC.set(c).lerp(new THREE.Color('#ffffff'), t).getHex(); }
export function darken(c, t) { return tmpC.set(c).lerp(new THREE.Color('#3A2060'), t).getHex(); }

// ---- materials -------------------------------------------------------------------
const matCache = new Map();
function cached(key, make) {
  let m = matCache.get(key);
  if (!m) { m = make(); matCache.set(key, m); }
  return m;
}
export const M = {
  /** Glossy vinyl: the default toy surface */
  toy: (color, o = {}) => cached('toy' + color + JSON.stringify(o), () => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.28, envMapIntensity: 0.9, ...o
  })),
  /** Candy-hard shine: buttons, gems, eyes */
  glossy: (color, o = {}) => cached('gl' + color + JSON.stringify(o), () => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1, ...o
  })),
  /** Soft velvet for plush toys and dough */
  plush: (color, o = {}) => cached('pl' + color + JSON.stringify(o), () => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.82, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(lighten(color, 0.6)), envMapIntensity: 0.7, ...o
  })),
  matte: (color, o = {}) => cached('mt' + color + JSON.stringify(o), () => new THREE.MeshStandardMaterial({ color, roughness: 0.85, envMapIntensity: 0.6, ...o })),
  /** Jelly and gummy: light passes through and tints */
  jelly: (color, o = {}) => cached('je' + color + JSON.stringify(o), () => new THREE.MeshPhysicalMaterial({
    color: lighten(color, 0.25), roughness: 0.12, transmission: 0.82, thickness: 1.4, ior: 1.33,
    attenuationColor: new THREE.Color(color), attenuationDistance: 1.1, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1, ...o
  })),
  /** Soap-bubble skin: transparent with a rainbow sheen */
  bubble: (o = {}) => cached('bb' + JSON.stringify(o), () => new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, iridescence: 1, iridescenceIOR: 1.35,
    iridescenceThicknessMinimum: 180, iridescenceThicknessMaximum: 620, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, depthWrite: false, ...o
  })),
  metal: (color, o = {}) => cached('me' + color + JSON.stringify(o), () => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 0.25, envMapIntensity: 1.2, ...o })),
  basic: (color, o = {}) => cached('ba' + color + JSON.stringify(o), () => new THREE.MeshBasicMaterial({ color, ...o })),
  glow: (color, o = {}) => cached('gw' + color + JSON.stringify(o), () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, ...o }))
};

// ---- geometry --------------------------------------------------------------------
const geoCache = new Map();
export function geo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
export const G = {
  sphere: (seg = 32) => geo('sph' + seg, () => new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75))),
  box: (r = 0.12, seg = 3) => geo('rbox' + r + ':' + seg, () => new THREE.RoundedBoxGeometry(1, 1, 1, seg, r)),
  cyl: (seg = 32, top = 1) => geo('cyl' + seg + ':' + top, () => new THREE.CylinderGeometry(top, 1, 1, seg, 1)),
  cone: (seg = 24) => geo('cone' + seg, () => new THREE.ConeGeometry(1, 1, seg)),
  capsule: (len = 1, seg = 16) => geo('cap' + len + ':' + seg, () => new THREE.CapsuleGeometry(1, len, 8, seg)),
  torus: (tube = 0.3, arc = Math.PI * 2, seg = 32) => geo('tor' + tube + ':' + arc + ':' + seg, () => new THREE.TorusGeometry(1, tube, 12, seg, arc)),
  plane: () => geo('plane', () => new THREE.PlaneGeometry(1, 1)),
  circle: (seg = 40) => geo('circ' + seg, () => new THREE.CircleGeometry(1, seg)),
  /** A rounded cylinder: cushions, cake tiers, buttons */
  puck: (bevel = 0.25, seg = 40) => geo('puck' + bevel + ':' + seg, () => lathe(puckProfile(bevel), seg)),
  /** Puffy extruded outline, like a pillow: stars, hearts, clouds */
  puffy: (key, shape, depth = 0.35, bevel = 0.22) => geo('puffy' + key + depth + bevel, () => {
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.85, bevelSegments: 6, curveSegments: 20 });
    g.center();
    g.computeVertexNormals();
    return g;
  })
};

function puckProfile(b) {
  const pts = [new THREE.Vector2(0, -0.5)];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(1 - b + Math.cos(a) * b, -0.5 + b + Math.sin(a) * b));
  }
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(1 - b + Math.cos(a) * b, 0.5 - b + Math.sin(a) * b));
  }
  pts.push(new THREE.Vector2(0, 0.5));
  return pts;
}

export function lathe(points, seg = 40) {
  const g = new THREE.LatheGeometry(points, seg);
  g.computeVertexNormals();
  return g;
}

export function starShape(n = 5, r = 1, inner = 0.5, round = 0.16) {
  const s = new THREE.Shape();
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n, R = i % 2 ? r * inner : r;
    pts.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], o = pts[(i - 1 + pts.length) % pts.length];
    const ax = p[0] + (o[0] - p[0]) * round, ay = p[1] + (o[1] - p[1]) * round;
    const bx = p[0] + (q[0] - p[0]) * round, by = p[1] + (q[1] - p[1]) * round;
    if (!i) s.moveTo(ax, ay); else s.lineTo(ax, ay);
    s.quadraticCurveTo(p[0], p[1], bx, by);
  }
  s.closePath();
  return s;
}
export function heartShape(r = 1) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9 * r);
  s.bezierCurveTo(-1.5 * r, 0.1 * r, -0.72 * r, 1.05 * r, 0, 0.32 * r);
  s.bezierCurveTo(0.72 * r, 1.05 * r, 1.5 * r, 0.1 * r, 0, -0.9 * r);
  return s;
}

/** Mesh helper: mesh(geometry, material, {p:[x,y,z], s:[...]|n, r:[...], shadow}) */
export function mesh(g, m, o = {}) {
  const me = new THREE.Mesh(g, m);
  if (o.p) me.position.set(o.p[0], o.p[1], o.p[2]);
  if (o.s !== undefined) Array.isArray(o.s) ? me.scale.set(o.s[0], o.s[1], o.s[2]) : me.scale.setScalar(o.s);
  if (o.r) me.rotation.set(o.r[0], o.r[1], o.r[2]);
  me.castShadow = o.cast !== false;
  me.receiveShadow = !!o.receive;
  if (o.parent) o.parent.add(me);
  return me;
}
export function group(parent, p) {
  const g = new THREE.Group();
  if (p) g.position.set(p[0], p[1], p[2]);
  if (parent) parent.add(g);
  return g;
}

// ---- soft contact shadow: grounds every toy even where the shadow map is coarse ----
let blobTex = null;
export function blobShadow(r = 1, a = 0.35) {
  if (!blobTex) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const x = cv.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 63);
    g.addColorStop(0, 'rgba(60,30,100,1)');
    g.addColorStop(0.45, 'rgba(60,30,100,.55)');
    g.addColorStop(1, 'rgba(60,30,100,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    blobTex = new THREE.CanvasTexture(cv);
    blobTex.colorSpace = THREE.SRGBColorSpace;
  }
  const m = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: a, depthWrite: false, toneMapped: false });
  const me = new THREE.Mesh(G.plane(), m);
  me.rotation.x = -Math.PI / 2;
  me.scale.set(r * 2, r * 2, 1);
  me.renderOrder = -1;
  me.castShadow = false;
  return me;
}

/** Canvas-painted texture (gradients for skies, labels, patterns) */
export function canvasTex(w, h, paint, { repeat = false, srgb = true } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  paint(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Vertical gradient sky dome texture */
export function skyTexture(stops) {
  return canvasTex(4, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s));
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  });
}

// ---- the stage ---------------------------------------------------------------------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const v3 = new THREE.Vector3();

export class Stage {
  /**
   * opts: fov, bg (colour or [stops] gradient), fog [color, near, far], env (0..2),
   * key light {color, intensity, pos, shadow:{size, area}} and hemisphere colours.
   */
  constructor(opts = {}) {
    const o = {
      fov: 34, bg: ['#9FD4FF', '#FFE6F2'], env: 0.6, keyColor: '#FFF4E8', key: 2.9, keyPos: [-5, 10, 7],
      sky: '#DDEBFF', ground: '#FFD9E6', hemi: 0.55, rim: 1.3, rimColor: '#CFE2FF', shadowSize: 1024, shadowArea: 9, ...opts
    };
    this.o = o;
    renderer();
    this.ok = !!gl.renderer;
    if (gl.app) resizeGL(gl.app);
    const s = this.scene = new THREE.Scene();
    if (Array.isArray(o.bg)) s.background = skyTexture(o.bg);
    else if (o.bg) s.background = new THREE.Color(o.bg);
    s.environment = gl.env;
    s.environmentIntensity = o.env;
    if (o.fog) s.fog = new THREE.Fog(o.fog[0], o.fog[1], o.fog[2]);

    this.camera = new THREE.PerspectiveCamera(o.fov, 1, 0.1, 400);
    this.target = new THREE.Vector3();

    this.hemi = new THREE.HemisphereLight(o.sky, o.ground, o.hemi);
    s.add(this.hemi);
    const k = this.key = new THREE.DirectionalLight(o.keyColor, o.key);
    k.position.set(...o.keyPos);
    k.castShadow = o.shadowSize > 0;
    if (k.castShadow) {
      k.shadow.mapSize.set(o.shadowSize, o.shadowSize);
      k.shadow.radius = 5;
      k.shadow.bias = -0.0006;
      k.shadow.normalBias = 0.02;
      this.shadowArea(o.shadowArea);
    }
    s.add(k, k.target);
    const rim = this.rim = new THREE.DirectionalLight(o.rimColor, o.rim);
    rim.position.set(4, 5, -8);
    s.add(rim);
    this.updaters = new Set();
  }

  /** Size of the square the shadow map covers, centred on the key light target */
  shadowArea(a, center) {
    const sc = this.key.shadow.camera;
    sc.left = sc.bottom = -a;
    sc.right = sc.top = a;
    sc.near = 0.5;
    sc.far = 60;
    sc.updateProjectionMatrix();
    if (center) {
      this.key.target.position.copy(center);
      this.key.position.set(center.x + this.o.keyPos[0], center.y + this.o.keyPos[1], center.z + this.o.keyPos[2]);
    }
  }

  add(...o) { this.scene.add(...o); return o[0]; }

  get aspect() { const a = gl.app; return a ? a.W / a.H : 1; }

  /**
   * Places the camera looking at `target` from direction `dir` so that a box of
   * w x h world units around the target is fully visible, in any screen shape.
   */
  frame(target, w, h, dir = [0, 0.35, 1], margin = 1) {
    const cam = this.camera;
    cam.aspect = this.aspect;
    const vf = THREE.MathUtils.degToRad(cam.fov);
    const dv = (h * margin / 2) / Math.tan(vf / 2);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
    const dh = (w * margin / 2) / Math.tan(hf / 2);
    const d = Math.max(dv, dh);
    v3.set(dir[0], dir[1], dir[2]).normalize().multiplyScalar(d);
    cam.position.copy(target).add(v3);
    this.target.copy(target);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    return d;
  }

  /** Like frame(), but only computes where the camera should be: {pos, look} */
  pose(target, w, h, dir = [0, 0.35, 1], margin = 1) {
    const cam = this.camera;
    const aspect = this.aspect;
    const vf = THREE.MathUtils.degToRad(cam.fov);
    const dv = (h * margin / 2) / Math.tan(vf / 2);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const dh = (w * margin / 2) / Math.tan(hf / 2);
    const d = Math.max(dv, dh);
    const off = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(d);
    return { pos: target.clone().add(off), look: target.clone() };
  }

  /** Smoothly move the camera toward a pose; call every frame */
  glide(goal, dt, k = 4) {
    const cam = this.camera;
    if (!this._look) this._look = goal.look.clone();
    const a = 1 - Math.exp(-k * dt);
    cam.position.lerp(goal.pos, a);
    this._look.lerp(goal.look, a);
    cam.lookAt(this._look);
  }
  snap(goal) {
    this.camera.position.copy(goal.pos);
    this._look = goal.look.clone();
    this.camera.lookAt(this._look);
    this.camera.updateMatrixWorld();
  }

  resize() {
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  render() {
    if (!this.ok) return;
    const r = gl.renderer;
    if (Math.abs(this.camera.aspect - this.aspect) > 0.001) this.resize();
    r.render(this.scene, this.camera);
  }

  /** Raycast from a point in 2D layer (logical) coordinates */
  ray(x, y) {
    const a = gl.app;
    ndc.set((x / a.W) * 2 - 1, -(y / a.H) * 2 + 1);
    ray.setFromCamera(ndc, this.camera);
    return ray;
  }

  pick(x, y, objects, recursive = true) {
    const hits = this.ray(x, y).intersectObjects(objects, recursive);
    return hits.length ? hits[0] : null;
  }

  /** Where a 2D point meets the horizontal plane at height h (or any THREE.Plane) */
  onPlane(x, y, h = 0, out = new THREE.Vector3()) {
    const pl = h instanceof THREE.Plane ? h : new THREE.Plane(new THREE.Vector3(0, 1, 0), -h);
    return this.ray(x, y).ray.intersectPlane(pl, out);
  }

  /** Point on a plane facing the camera through `through` */
  onFacing(x, y, through, out = new THREE.Vector3()) {
    const n = new THREE.Vector3();
    this.camera.getWorldDirection(n);
    const pl = new THREE.Plane().setFromNormalAndCoplanarPoint(n.negate(), through);
    return this.ray(x, y).ray.intersectPlane(pl, out);
  }

  /** World position to 2D layer coordinates, for particles and hints */
  toScreen(p, out = {}) {
    const a = gl.app;
    v3.copy(p).project(this.camera);
    out.x = (v3.x + 1) / 2 * a.W;
    out.y = (1 - v3.y) / 2 * a.H;
    out.z = v3.z;
    return out;
  }
  objScreen(o, out = {}) { o.getWorldPosition(v3); return this.toScreen(v3, out); }

  /** World units per logical pixel at a given depth: for sizes that must match a finger */
  unitsPerPx(at) {
    const a = gl.app;
    const d = this.camera.position.distanceTo(at);
    return (2 * d * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2)) / a.H;
  }

  dispose() {
    this.scene.traverse((o) => {
      if (o.isMesh && o.material && o.material.map && o.material.userData.own) o.material.map.dispose();
    });
    this.scene.clear();
  }
}

// ---- small maths -------------------------------------------------------------------
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
