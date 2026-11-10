// 3D portraits for the 2D games. Friends are rendered once per expression with
// the same 3D toys as in the hub and the new worlds, then drawn as pictures, so
// the café, the journey, the salon and the album show exactly the same lovable
// characters, with real volume and shine, at no cost per frame.
import { THREE, renderer, gl, M, G, mesh, group } from '../core/stage.js';
import { Critter, wear } from './critter3d.js';
import { hooks } from './creatures.js';

const SIZE = 256;
const cache = new Map();
let rig = null, rt = null, pixels = null;
let budget = 0;

function makeRig() {
  const scene = new THREE.Scene();
  scene.environment = gl.env;
  scene.environmentIntensity = 0.35;
  scene.add(new THREE.HemisphereLight('#E8F0FF', '#FFD9E6', 0.4));
  const key = new THREE.DirectionalLight('#FFF4E8', 1.5);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#CFE2FF', 1.0);
  rim.position.set(3, 3, -5);
  scene.add(rim);
  // the 2D drawing space: body centre at 0, ears up to -1.65 R, feet to 1.25 R
  const cam = new THREE.OrthographicCamera(-1.45, 1.45, 1.65, -1.25, 0.1, 20);
  cam.position.set(0, 0, 8);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  rt = new THREE.WebGLRenderTarget(SIZE, SIZE, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  pixels = new Uint8Array(SIZE * SIZE * 4);
  return { scene, cam };
}

/** expr: idle | happy | wow | sleep */
export function portrait(id, expr = 'idle', shiny = false) {
  const key = id + ':' + expr + (shiny ? ':s' : '');
  if (cache.has(key)) return cache.get(key);
  const r = renderer();
  if (!r) return null;
  // build at most a couple per frame, so a screen full of friends never stalls
  if (budget > 2) return null;
  budget++;
  if (!rig) rig = makeRig();
  const c = new Critter(id, { size: 1, shadow: false });
  c.root.position.y = -c.ry;
  if (shiny) wear(c, 'crown');
  if (expr === 'sleep') c.sleep = true;
  else if (expr !== 'idle') c.setMood(expr, 10);
  c.t = 0.4;
  c.blinkT = 10;
  for (let i = 0; i < 12; i++) c.update(1 / 30);
  c.lookYaw = 0; c.lookPitch = 0;
  c.yaw.rotation.y = 0;
  c.face.rotation.set(0, 0, 0);
  c.squash.scale.set(1, 1, 1);
  c.squash.rotation.z = 0;
  rig.scene.add(c.root);
  const prevTarget = r.getRenderTarget();
  const prevClear = new THREE.Color();
  r.getClearColor(prevClear);
  const prevAlpha = r.getClearAlpha();
  r.setRenderTarget(rt);
  r.setClearColor(0x000000, 0);
  r.clear();
  r.render(rig.scene, rig.cam);
  r.readRenderTargetPixels(rt, 0, 0, SIZE, SIZE, pixels);
  r.setRenderTarget(prevTarget);
  r.setClearColor(prevClear, prevAlpha);
  rig.scene.remove(c.root);
  c.dispose();
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const x = cv.getContext('2d');
  const img = x.createImageData(SIZE, SIZE);
  // flip rows: GL reads bottom-up
  for (let y = 0; y < SIZE; y++) img.data.set(pixels.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4), y * SIZE * 4);
  // edges come out premultiplied by coverage: undo that so they are not dark
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a > 0 && a < 255) { const k = 255 / a; d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k); }
  }
  x.putImageData(img, 0, 0);
  cache.set(key, cv);
  return cv;
}

/** Pick an expression from the options the 2D games pass to drawCreature */
function exprOf(o) {
  if ((o.blink || 0) > 0.5 || o.eyes === 'closed') return 'sleep';
  if (o.eyes === 'happy' || o.eyes === 'heart') return 'happy';
  if (o.eyes === 'wow' || (o.mouthOpen || 0) > 0.45) return 'wow';
  return 'idle';
}

hooks.portrait = (c, id, o, R) => {
  const want = exprOf(o);
  let cv = portrait(id, want, !!o.shiny);
  // while a new face is still being made, show one we already have
  if (!cv) cv = cache.get(id + ':idle' + (o.shiny ? ':s' : '')) || cache.get(id + ':idle');
  if (!cv) return false;
  c.drawImage(cv, -1.45 * R, -1.65 * R, 2.9 * R, 2.9 * R);
  return true;
};

// reset the per-frame budget
(function tick() { budget = 0; requestAnimationFrame(tick); })();
