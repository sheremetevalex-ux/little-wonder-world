// Little 3D toys that stand for each world in the hub: one glance says what is
// inside. Each fits in a ball of radius 1 around its origin, facing +z.
import { THREE, M, G, mesh, group, lathe, starShape, heartShape, lighten, darken } from '../core/stage.js';

const PI = Math.PI;
const nc = { cast: false };
const V2 = (x, y) => new THREE.Vector2(x, y);

function face(parent, x, y, z, s = 1, open = false) {
  const ink = M.glossy('#2B1D48');
  const white = M.basic('#FFFFFF');
  for (const k of [-1, 1]) {
    const e = mesh(G.sphere(16), ink, { p: [x + k * 0.16 * s, y + 0.04 * s, z], s: [0.065 * s, 0.085 * s, 0.04 * s], parent, ...nc });
    mesh(G.sphere(8), white, { p: [-0.02 * s, 0.03 * s, 0.035 * s].map((v, i) => v), s: 0.025 * s, parent: e, ...nc }).scale.set(0.35, 0.3, 0.6);
    mesh(G.sphere(12), M.basic('#FF8FB4', { transparent: true, opacity: 0.6, depthWrite: false }), { p: [x + k * 0.27 * s, y - 0.06 * s, z - 0.01], s: [0.06 * s, 0.035 * s, 0.01], parent, ...nc });
  }
  if (open) mesh(G.sphere(12), M.glossy('#7A2C50'), { p: [x, y - 0.1 * s, z], s: [0.06 * s, 0.05 * s, 0.03 * s], parent, ...nc });
  else mesh(G.torus(0.35, PI, 12), M.glossy('#6B2A4E'), { p: [x, y - 0.08 * s, z], r: [0, 0, PI], s: [0.05 * s, 0.04 * s, 0.04 * s], parent, ...nc });
}

let skirtG = null, coneG = null, eggG = null, dumplingG = null;
const skirt = () => skirtG || (skirtG = lathe([V2(0.12, 0.5), V2(0.2, 0.35), V2(0.45, -0.1), V2(0.62, -0.42), V2(0.6, -0.5), V2(0, -0.5)], 40));
const wafer = () => coneG || (coneG = lathe([V2(0.001, -0.6), V2(0.32, 0.3), V2(0.36, 0.36), V2(0.3, 0.38), V2(0, 0.38)], 24));
export const eggShape = () => eggG || (eggG = lathe(Array.from({ length: 25 }, (_, i) => {
  const u = i / 24, a = -PI / 2 + u * PI;
  const y = Math.sin(a), r = Math.cos(a) * (1 - 0.18 * (y + 1) / 2) * 0.78;
  return V2(Math.max(0.0001, r), y);
}), 40));
export const dumplingShape = () => dumplingG || (dumplingG = (() => {
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20, a = -PI / 2 + u * PI * 0.95;
    pts.push(V2(Math.max(0.0001, Math.cos(a) * (1 + 0.1 * Math.sin(u * PI))), Math.sin(a) * 0.62 + 0.02 + (u > 0.85 ? (u - 0.85) * 1.2 : 0)));
  }
  pts.push(V2(0.0001, 0.75));
  return lathe(pts, 48);
})());

const BUILDERS = {
  dress(g) {
    mesh(skirt(), M.toy('#FF8FC0'), { p: [0, -0.25, 0], s: [1.1, 1, 1.1], parent: g });
    mesh(G.torus(0.25, PI * 2, 40), M.toy('#FFFFFF'), { p: [0, -0.73, 0], r: [PI / 2, 0, 0], s: [0.66, 0.66, 0.5], parent: g, ...nc });
    mesh(G.cyl(24, 0.85), M.toy('#FF6FA8'), { p: [0, 0.38, 0], s: [0.22, 0.42, 0.18], parent: g });
    for (const k of [-1, 1]) mesh(G.sphere(16), M.toy('#FFFFFF'), { p: [k * 0.27, 0.55, 0], s: 0.14, parent: g, ...nc });
    mesh(G.puffy('star', starShape(5, 1, 0.5), 0.3, 0.15), M.glossy('#FFD45C'), { p: [0, 0.38, 0.2], s: 0.09, parent: g, ...nc });
    mesh(G.sphere(12), M.glossy('#FFD45C'), { p: [0.25, -0.35, 0.45], s: 0.06, parent: g, ...nc });
    mesh(G.sphere(12), M.glossy('#8FDBFF'), { p: [-0.3, -0.5, 0.42], s: 0.06, parent: g, ...nc });
  },
  cake(g) {
    mesh(G.puck(0.2), M.toy('#FFB3CF'), { p: [0, -0.45, 0], s: [0.78, 0.42, 0.78], parent: g });
    mesh(G.puck(0.2), M.toy('#FFF3E0'), { p: [0, 0.02, 0], s: [0.55, 0.36, 0.55], parent: g });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      mesh(G.sphere(12), M.toy('#FFFFFF'), { p: [Math.sin(a) * 0.74, -0.25, Math.cos(a) * 0.74], s: [0.12, 0.16, 0.12], parent: g, ...nc });
      mesh(G.sphere(10), M.toy(['#FF6FA8', '#FFD45C', '#8FDBFF', '#9FE8B0'][i % 4]), { p: [Math.sin(a + 0.3) * 0.52, 0.22, Math.cos(a + 0.3) * 0.52], s: 0.05, parent: g, ...nc });
    }
    mesh(G.sphere(20), M.glossy('#FF3E6C'), { p: [0, 0.34, 0], s: 0.17, parent: g });
    mesh(G.capsule(1, 6), M.toy('#5FBF72'), { p: [0.04, 0.53, 0], r: [0, 0, -0.4], s: [0.02, 0.07, 0.02], parent: g, ...nc });
  },
  popit(g) {
    mesh(G.box(0.3), M.toy('#C7ABFF'), { s: [1.45, 1.45, 0.3], parent: g });
    const cols = ['#FF6F9B', '#FFB054', '#FFE066', '#7FE3A0', '#6FC4FF', '#B48BFF'];
    for (let i = 0; i < 9; i++) {
      const x = (i % 3 - 1) * 0.42, y = (1 - Math.floor(i / 3)) * 0.42;
      mesh(G.sphere(20), M.toy(cols[(i + Math.floor(i / 3)) % 6], { roughness: 0.55, clearcoat: 0.2 }), { p: [x, y, 0.13], s: [0.17, 0.17, 0.12], parent: g, ...nc });
    }
  },
  slime(g) {
    mesh(G.cyl(32), M.glossy('#FFFFFF', { transparent: true, opacity: 0.35, depthWrite: false }), { p: [0, -0.3, 0], s: [0.55, 0.8, 0.55], parent: g, ...nc });
    mesh(G.cyl(32), M.jelly('#5FE3A1'), { p: [0, -0.38, 0], s: [0.5, 0.6, 0.5], parent: g, ...nc });
    mesh(G.sphere(28), M.jelly('#5FE3A1'), { p: [0, 0.12, 0], s: [0.62, 0.32, 0.62], parent: g, ...nc });
    for (const [x, z] of [[0.45, 0.3], [-0.4, 0.25], [0.1, 0.5]]) mesh(G.sphere(16), M.jelly('#5FE3A1'), { p: [x, -0.05, z], s: [0.12, 0.28, 0.12], parent: g, ...nc });
    face(g, 0, 0.18, 0.55, 1.2);
  },
  paint(g) {
    const s = new THREE.Shape();
    s.moveTo(0.9, 0); s.bezierCurveTo(0.9, 0.7, 0.2, 0.9, -0.3, 0.75); s.bezierCurveTo(-0.95, 0.55, -0.95, -0.55, -0.3, -0.75);
    s.bezierCurveTo(0.15, -0.88, 0.25, -0.35, 0.55, -0.4); s.bezierCurveTo(0.85, -0.42, 0.9, -0.2, 0.9, 0);
    mesh(G.puffy('palette', s, 0.12, 0.08), M.toy('#F5D9B0'), { r: [-0.3, 0, 0], parent: g });
    ['#FF5C8F', '#FFC233', '#5698FF', '#7FD86F', '#B48BFF'].forEach((c, i) => {
      const a = 1.9 + i * 0.75;
      mesh(G.sphere(16), M.glossy(c), { p: [Math.cos(a) * 0.55 - 0.05, Math.sin(a) * 0.55 * 0.95, 0.18], s: [0.15, 0.15, 0.07], parent: g, ...nc });
    });
    const br = group(g, [0.3, 0.2, 0.35]);
    br.rotation.z = -0.7;
    mesh(G.cyl(12), M.toy('#8C68F2'), { p: [0, -0.2, 0], s: [0.06, 0.7, 0.06], parent: br, ...nc });
    mesh(G.sphere(12), M.toy('#FF8FB8'), { p: [0, 0.22, 0], s: [0.09, 0.16, 0.09], parent: br, ...nc });
  },
  garden(g) {
    mesh(G.cyl(10), M.toy('#5FBF72'), { p: [0, -0.5, 0], s: [0.05, 0.6, 0.05], parent: g, ...nc });
    for (const k of [-1, 1]) mesh(G.sphere(16), M.toy('#7FD86F'), { p: [k * 0.2, -0.55, 0], r: [0, 0, k * -0.7], s: [0.22, 0.08, 0.12], parent: g, ...nc });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * PI * 2;
      mesh(G.sphere(20), M.toy('#FF8FC0'), { p: [Math.cos(a) * 0.38, 0.12 + Math.sin(a) * 0.38, -0.05], s: [0.22, 0.22, 0.1], parent: g });
    }
    mesh(G.sphere(28), M.toy('#FFD45C'), { p: [0, 0.12, 0.04], s: [0.32, 0.32, 0.2], parent: g });
    face(g, 0, 0.14, 0.24, 1.15, true);
    noteToy(g, 0.62, 0.62, 0.1, '#8C68F2');
  },
  quest(g) {
    const tex = stripeTex();
    const bm = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.4, clearcoat: 0.5 });
    mesh(G.sphere(32), bm, { p: [0, 0.22, 0], s: [0.62, 0.7, 0.62], parent: g });
    mesh(G.cone(16), M.toy('#FF6F9B'), { p: [0, -0.5, 0], r: [PI, 0, 0], s: [0.25, 0.25, 0.25], parent: g, ...nc });
    mesh(G.box(0.08), M.toy('#C98A52'), { p: [0, -0.68, 0], s: [0.34, 0.24, 0.34], parent: g });
    for (const k of [-1, 1]) mesh(G.cyl(6), M.toy('#8A6040'), { p: [k * 0.13, -0.5, 0], r: [0, 0, k * 0.25], s: [0.012, 0.28, 0.012], parent: g, ...nc });
  },
  sing(g) {
    mesh(G.sphere(36), M.toy('#FF9FC2'), { s: [0.7, 0.68, 0.62], parent: g });
    const ink = M.glossy('#2B1D48');
    for (const k of [-1, 1]) {
      mesh(G.sphere(16), ink, { p: [k * 0.22, 0.17, 0.53], s: [0.09, 0.11, 0.05], parent: g, ...nc });
      mesh(G.sphere(8), M.basic('#fff'), { p: [k * 0.22 - 0.03, 0.21, 0.58], s: 0.03, parent: g, ...nc });
    }
    mesh(G.sphere(24), M.glossy('#7A2C50'), { p: [0, -0.18, 0.52], s: [0.2, 0.22, 0.08], parent: g, ...nc });
    mesh(G.sphere(16), M.toy('#FF6F8F'), { p: [0, -0.3, 0.56], s: [0.12, 0.06, 0.05], parent: g, ...nc });
    noteToy(g, 0.62, 0.5, 0.1, '#FFC233');
    noteToy(g, -0.68, 0.6, 0, '#6FC4FF', 0.8);
  },
  cafe(g) {
    mesh(wafer(), M.toy('#E8A85C', { roughness: 0.7 }), { p: [0, -0.35, 0], s: 1.1, parent: g });
    mesh(G.sphere(28), M.toy('#FFB3CF'), { p: [0, 0.18, 0], s: 0.38, parent: g });
    mesh(G.sphere(28), M.toy('#9FE8C8'), { p: [0, 0.55, 0], s: 0.3, parent: g });
    mesh(G.sphere(16), M.glossy('#FF3E6C'), { p: [0, 0.88, 0], s: 0.1, parent: g, ...nc });
    for (let i = 0; i < 7; i++) mesh(G.capsule(1, 6), M.toy(['#FFD45C', '#6FC4FF', '#FF6FA8', '#FFFFFF'][i % 4]), { p: [Math.sin(i * 2.2) * 0.25, 0.55 + Math.cos(i * 1.7) * 0.15, 0.24], r: [0, 0, i], s: [0.018, 0.035, 0.018], parent: g, ...nc });
  },
  salon(g) {
    mesh(G.sphere(28), M.toy('#FFE0CC'), { p: [0, -0.15, 0.1], s: [0.45, 0.48, 0.42], parent: g });
    face(g, 0, -0.18, 0.5, 1);
    const hair = M.toy('#B48BFF');
    mesh(G.sphere(32), hair, { p: [0, 0.03, -0.02], s: [0.52, 0.5, 0.48], parent: g });
    mesh(G.sphere(24), hair, { p: [0, 0.55, -0.05], s: 0.28, parent: g });
    for (const k of [-1, 1]) mesh(G.capsule(1.4, 12), hair, { p: [k * 0.45, -0.35, 0.05], s: [0.12, 0.25, 0.12], parent: g, ...nc });
    const bow = group(g, [0.3, 0.42, 0.25]);
    for (const k of [-1, 1]) mesh(G.sphere(12), M.glossy('#FF5C8F'), { p: [k * 0.1, 0, 0], s: [0.11, 0.08, 0.06], parent: bow, ...nc });
    mesh(G.sphere(10), M.glossy('#FF3E7C'), { s: 0.05, parent: bow, ...nc });
  },
  atelier(g) {
    mesh(G.puck(0.15), M.toy('#E9C9A0'), { p: [0, 0.5, 0], s: [0.55, 0.14, 0.55], parent: g });
    mesh(G.puck(0.15), M.toy('#E9C9A0'), { p: [0, -0.5, 0], s: [0.55, 0.14, 0.55], parent: g });
    mesh(G.cyl(32), M.plush('#3FD0C9'), { s: [0.42, 0.86, 0.42], parent: g });
    for (let i = 0; i < 6; i++) mesh(G.torus(0.04, PI * 2, 32), M.toy('#2FB8B0'), { p: [0, -0.35 + i * 0.14, 0], r: [PI / 2, 0, 0], s: 0.43, parent: g, ...nc });
    const btn = group(g, [0.42, -0.25, 0.5]);
    mesh(G.puck(0.4), M.glossy('#FF8FB8'), { r: [PI / 2, 0, 0], s: [0.25, 0.08, 0.25], parent: btn, ...nc });
    for (let i = 0; i < 4; i++) mesh(G.sphere(8), M.basic('#C2457A'), { p: [(i % 2 - 0.5) * 0.1, (Math.floor(i / 2) - 0.5) * 0.1, 0.05], s: 0.025, parent: btn, ...nc });
  },
  dumplings(g) {
    mesh(G.cyl(36), M.toy('#E3B877', { roughness: 0.75 }), { p: [0, -0.55, 0], s: [0.85, 0.32, 0.85], parent: g });
    for (let i = 0; i < 2; i++) mesh(G.torus(0.06, PI * 2, 40), M.toy('#C9965A'), { p: [0, -0.62 + i * 0.16, 0], r: [PI / 2, 0, 0], s: 0.86, parent: g, ...nc });
    mesh(dumplingShape(), M.plush('#FFF6EC'), { p: [0, -0.2, 0.05], s: [0.62, 0.62, 0.62], parent: g });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      mesh(G.sphere(10), M.plush('#FFF1E2'), { p: [Math.sin(a) * 0.14, 0.27, Math.cos(a) * 0.14 + 0.05], r: [0, a, 0.5], s: [0.06, 0.14, 0.04], parent: g, ...nc });
    }
    face(g, 0, -0.08, 0.66, 1.2);
  },
  eggs(g) {
    const tex = eggTex('#B9A4FF', '#FFE27D', '#FF9FD0');
    mesh(eggShape(), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, emissive: '#5A3FD0', emissiveIntensity: 0.08 }), { s: [0.78, 0.82, 0.78], parent: g });
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3;
      mesh(G.puffy('star4', starShape(4, 1, 0.38), 0.2, 0.1), M.glow('#FFF2A8', { opacity: 0.9 }), { p: [Math.cos(a) * 0.8, Math.sin(a) * 0.75, 0.25], s: 0.07 + (i % 2) * 0.04, parent: g, ...nc });
    }
  },
  squishy(g) {
    const jm = M.jelly('#FF6FA8', { thickness: 1.2 });
    mesh(G.sphere(28), jm, { p: [0, -0.28, 0], s: [0.48, 0.48, 0.42], parent: g });
    mesh(G.sphere(28), jm, { p: [0, 0.3, 0], s: [0.42, 0.38, 0.38], parent: g });
    for (const k of [-1, 1]) {
      mesh(G.sphere(16), jm, { p: [k * 0.3, 0.6, 0], s: 0.14, parent: g, ...nc });
      mesh(G.sphere(16), jm, { p: [k * 0.42, -0.15, 0.1], s: [0.13, 0.18, 0.13], parent: g, ...nc });
      mesh(G.sphere(16), jm, { p: [k * 0.24, -0.72, 0.1], s: [0.17, 0.12, 0.17], parent: g, ...nc });
    }
    face(g, 0, 0.3, 0.38, 0.95);
  },
  hidden(g) {
    mesh(G.sphere(24), M.toy('#5BC46E'), { p: [-0.1, -0.35, -0.1], s: [0.75, 0.5, 0.5], parent: g });
    mesh(G.sphere(20), M.toy('#7FD86F'), { p: [0.45, -0.45, 0], s: [0.38, 0.32, 0.35], parent: g, ...nc });
    // a puppy peeking over the bush
    mesh(G.sphere(24), M.toy('#F2C48D'), { p: [-0.05, 0.05, 0.05], s: [0.36, 0.33, 0.32], parent: g });
    for (const k of [-1, 1]) mesh(G.sphere(12), M.toy('#C98A52'), { p: [k * 0.33, 0.06, 0.05], r: [0, 0, k * 0.3], s: [0.09, 0.17, 0.05], parent: g, ...nc });
    mesh(G.sphere(12), M.toy('#FFF4E4'), { p: [-0.05, -0.02, 0.32], s: [0.13, 0.09, 0.08], parent: g, ...nc });
    mesh(G.sphere(8), M.glossy('#4A3050'), { p: [-0.05, 0.02, 0.4], s: [0.04, 0.03, 0.03], parent: g, ...nc });
    for (const k of [-1, 1]) mesh(G.sphere(10), M.glossy('#2B1D48'), { p: [-0.05 + k * 0.12, 0.12, 0.31], s: [0.04, 0.05, 0.03], parent: g, ...nc });
    // magnifying glass
    const mg = group(g, [0.32, 0.25, 0.45]);
    mg.rotation.z = -0.5;
    mesh(G.torus(0.16, PI * 2, 36), M.glossy('#FF8A4C'), { s: 0.3, parent: mg });
    mesh(G.circle(32), M.glossy('#DFF4FF', { transparent: true, opacity: 0.35, depthWrite: false }), { s: 0.29, parent: mg, ...nc });
    mesh(G.capsule(1, 8), M.glossy('#8C68F2'), { p: [0, -0.55, 0], s: [0.07, 0.15, 0.07], parent: mg, ...nc });
  },
  jump(g) {
    for (const [x, y, c] of [[-0.45, -0.7, '#7FD86F'], [0.45, -0.05, '#FFB054']]) {
      mesh(G.box(0.3), M.toy(c), { p: [x, y, 0], s: [0.6, 0.18, 0.4], parent: g });
    }
    mesh(G.sphere(28), M.toy('#FF8FB8'), { p: [-0.42, -0.35, 0.05], s: [0.27, 0.25, 0.25], parent: g });
    mesh(G.sphere(12), M.toy('#92E58E'), { p: [-0.42, -0.06, 0.05], s: [0.05, 0.1, 0.05], parent: g, ...nc });
    face(g, -0.42, -0.35, 0.3, 0.85, true);
    mesh(G.puffy('star', starShape(5, 1, 0.5), 0.3, 0.15), M.glossy('#FFD23F', { emissive: '#FFB000', emissiveIntensity: 0.3 }), { p: [0.45, 0.48, 0.05], s: 0.22, parent: g });
    const arc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.35, -0.02, 0.1), new THREE.Vector3(0.0, 0.75, 0.1), new THREE.Vector3(0.3, 0.2, 0.1));
    mesh(new THREE.TubeGeometry(arc, 20, 0.025, 6), M.basic('#FFFFFF', { transparent: true, opacity: 0.8 }), { parent: g, ...nc });
  },
  album(g) {
    mesh(G.box(0.15), M.toy('#FFE9C4'), { p: [0, -0.3, 0], s: [0.95, 0.75, 0.8], parent: g });
    const roof = mesh(G.cone(4), M.toy('#FF6F8F'), { p: [0, 0.35, 0], r: [0, PI / 4, 0], s: [0.86, 0.55, 0.74], parent: g });
    roof.scale.set(0.86, 0.55, 0.74);
    mesh(G.box(0.1), M.toy('#B07BFF'), { p: [0, -0.48, 0.41], s: [0.26, 0.4, 0.05], parent: g, ...nc });
    mesh(G.puffy('heart', heartShape(1), 0.3, 0.15), M.glossy('#FF5C8F'), { p: [0.27, -0.13, 0.42], s: 0.09, parent: g, ...nc });
    mesh(G.box(0.1), M.glossy('#BFE6FF'), { p: [-0.27, -0.15, 0.41], s: [0.2, 0.2, 0.04], parent: g, ...nc });
    mesh(G.cyl(12), M.toy('#C98A52'), { p: [0.28, 0.45, 0], s: [0.08, 0.3, 0.08], parent: g, ...nc });
  }
};

function noteToy(g, x, y, z, color, s = 1) {
  const n = group(g, [x, y, z]);
  n.scale.setScalar(s);
  mesh(G.sphere(14), M.glossy(color), { p: [0, -0.15, 0], s: [0.11, 0.085, 0.08], r: [0, 0, 0.4], parent: n, ...nc });
  mesh(G.cyl(8), M.glossy(color), { p: [0.09, 0.03, 0], s: [0.02, 0.36, 0.02], parent: n, ...nc });
  mesh(G.sphere(10), M.glossy(color), { p: [0.15, 0.18, 0], s: [0.07, 0.04, 0.03], r: [0, 0, -0.5], parent: n, ...nc });
}

let stripeT = null;
function stripeTex() {
  if (stripeT) return stripeT;
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 8;
  const x = cv.getContext('2d');
  const cols = ['#FF6F9B', '#FFE066', '#6FC4FF', '#FFFFFF', '#B48BFF', '#7FE3A0'];
  for (let i = 0; i < 12; i++) { x.fillStyle = cols[i % 6]; x.fillRect(i * 256 / 12, 0, 256 / 12 + 1, 8); }
  stripeT = new THREE.CanvasTexture(cv);
  stripeT.colorSpace = THREE.SRGBColorSpace;
  return stripeT;
}

const eggTexCache = new Map();
/** Speckled, swirly egg paint */
export function eggTex(base, dot, band, seed = 1) {
  const key = base + dot + band + seed;
  if (eggTexCache.has(key)) return eggTexCache.get(key);
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 256;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, lightHex(base, 0.35)); g.addColorStop(1, base);
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 256);
  x.fillStyle = band;
  x.beginPath();
  for (let i = 0; i <= 64; i++) { const px = i * 8; x.lineTo(px, 120 + Math.sin(i * 0.8 + seed) * 14); }
  for (let i = 64; i >= 0; i--) { const px = i * 8; x.lineTo(px, 150 + Math.sin(i * 0.8 + seed) * 14); }
  x.fill();
  let s = seed * 9301;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 46; i++) {
    x.fillStyle = i % 3 ? dot : '#FFFFFF';
    x.beginPath();
    x.arc(r() * 512, r() * 256, 5 + r() * 12, 0, Math.PI * 2);
    x.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  eggTexCache.set(key, t);
  return t;
}
function lightHex(c, k) { return '#' + new THREE.Color(c).lerp(new THREE.Color('#ffffff'), k).getHexString(); }

/** A toy for a world id; extra builders can be added by games */
export function makeWorldToy(id, extra) {
  const g = new THREE.Group();
  const b = BUILDERS[id] || extra;
  if (b) b(g);
  return g;
}
export { BUILDERS as TOY_BUILDERS, face as toyFace, noteToy };
