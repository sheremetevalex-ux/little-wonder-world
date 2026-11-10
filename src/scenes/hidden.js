// Hidden Treasures: puppies are hiding all over little 3D worlds. Ears poke out
// behind bushes, a tail sticks out of the haystack, a face looks out of a window,
// a box wiggles because someone is inside. Drag to look around, tap to find.
// Six places, three rounds each, every round arranged afresh. No clock, ever:
// if she gets stuck, a hiding puppy gives a little bark and sparkles, and the
// magnifier shows the way.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, TAU, softStar, heart } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, blobShadow, canvasTex, lighten, darken, starShape, PM, bake } from '../core/stage.js';
import { Critter, SPECIES } from '../art/critter3d.js';

const PLACES = [
  { id: 'meadow', ground: '#9BE07E', edge: '#7ACB6E', sky: [[0, '#7CC8FF'], [1, '#E2F4FF']], props: ['tree', 'bush', 'bush', 'rock', 'hay', 'barrel', 'house', 'box', 'flowers', 'fence'], pups: ['puppy', 'corgi', 'dalmatian'] },
  { id: 'forest', ground: '#74C47A', edge: '#5DAF68', sky: [[0, '#8FD7C8'], [1, '#E6FFF4']], props: ['pine', 'pine', 'bush', 'shroom', 'log', 'rock', 'stump', 'box', 'pine'], pups: ['husky', 'pug', 'puppy'] },
  { id: 'beach', ground: '#FFE2A8', edge: '#F2CC88', sky: [[0, '#6FD0FF'], [1, '#FFF3D9']], sea: true, props: ['palm', 'umbrella', 'castle', 'rock', 'bucket', 'ball', 'box', 'palm'], pups: ['poodle', 'corgi', 'dalmatian'] },
  { id: 'snow', ground: '#F4F8FF', edge: '#DCE8FA', sky: [[0, '#9FC4FF'], [1, '#F2F6FF']], props: ['snowpine', 'snowman', 'igloo', 'snowpile', 'gift', 'snowpine', 'rock'], pups: ['husky', 'dalmatian', 'pug'] },
  { id: 'candy', ground: '#FFD1E6', edge: '#FFB8D8', sky: [[0, '#FFB0D8'], [1, '#FFF0F8']], props: ['lolly', 'cupcake', 'cane', 'gumdrop', 'donut', 'gift', 'lolly'], pups: ['poodle', 'puppy', 'corgi'] },
  { id: 'night', ground: '#3F6F7A', edge: '#33606B', sky: [[0, '#151244'], [1, '#3B2F8E']], night: true, props: ['tree', 'bush', 'lantern', 'shroomGlow', 'house', 'box', 'bush', 'rock'], pups: ['puppy', 'dalmatian', 'husky', 'poodle'] }
];
const COUNTS = [[3, 5, 7], [4, 6, 8], [4, 6, 8], [5, 7, 9], [5, 7, 9], [4, 6, 8]];
const PUP_COLORS = { puppy: '#F2C48D', corgi: '#FFA45C', dalmatian: '#FFFFFF', husky: '#9AA7C2', pug: '#E9D2B0', poodle: '#FFC6DD' };

function hdata() {
  return save.data.hidden || (save.data.hidden = { level: 0, best: {} });
}

// ---- props ----------------------------------------------------------------------------
// Each builder returns { g, hide: 'behind'|'inside'|'window'|'tail'|'under'|'cover'|null, h: height, cover? }
const B = {
  tree(pl) {
    const g = new THREE.Group();
    mesh(G.cyl(10), M.toy('#B9825A'), { p: [0, 0.8, 0], s: [0.28, 1.6, 0.28], parent: g });
    const col = pick(pl.night ? ['#3F7F6A', '#4A8F7A'] : ['#6CCB76', '#86D96E', '#5FBF72']);
    mesh(G.sphere(20), M.toy(col), { p: [0, 2.1, 0], s: [1.2, 1.1, 1.2], parent: g });
    mesh(G.sphere(16), M.toy(lighten(col, 0.12)), { p: [0.5, 1.8, 0.4], s: 0.6, parent: g, cast: false });
    if (!pl.night && Math.random() < 0.5) for (let i = 0; i < 4; i++) mesh(G.sphere(10), M.glossy('#FF5C6F'), { p: [Math.cos(i * 1.7) * 0.9, 1.9 + Math.sin(i * 2.3) * 0.4, Math.sin(i * 1.7) * 0.6 + 0.5], s: 0.13, parent: g, cast: false });
    return { g, hide: 'side', h: 1.0, wob: 'tree' };
  },
  pine(pl) {
    const g = new THREE.Group();
    mesh(G.cyl(8), M.toy('#9A6A48'), { p: [0, 0.4, 0], s: [0.22, 0.8, 0.22], parent: g });
    for (let i = 0; i < 3; i++) mesh(G.cone(16), M.toy(i % 2 ? '#3FA06A' : '#4FB07A'), { p: [0, 1.1 + i * 0.6, 0], s: [1.1 - i * 0.28, 1.0, 1.1 - i * 0.28], parent: g });
    return { g, hide: 'side', h: 0.8, wob: 'tree' };
  },
  snowpine(pl) {
    const r = B.pine(pl);
    for (let i = 0; i < 3; i++) mesh(G.cone(16), M.toy('#FFFFFF'), { p: [0, 1.38 + i * 0.6, 0], s: [0.6 - i * 0.16, 0.42, 0.6 - i * 0.16], parent: r.g, cast: false });
    return r;
  },
  palm() {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) mesh(G.cyl(10, 0.9), M.toy(i % 2 ? '#C9965A' : '#D9A86A'), { p: [i * 0.06, 0.25 + i * 0.42, 0], r: [0, 0, -0.06 * i], s: [0.22 - i * 0.015, 0.44, 0.22 - i * 0.015], parent: g });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const leaf = mesh(G.sphere(12), M.toy('#5FBF72'), { p: [0.4 + Math.cos(a) * 0.7, 2.7, Math.sin(a) * 0.7], r: [Math.sin(a) * 0.5, -a, -Math.cos(a) * 0.5 - 0.3], s: [0.9, 0.08, 0.25], parent: g, cast: false });
      leaf.rotation.order = 'YXZ';
    }
    for (let i = 0; i < 3; i++) mesh(G.sphere(10), M.toy('#8A5A30'), { p: [0.35 + Math.cos(i * 2) * 0.15, 2.5, Math.sin(i * 2) * 0.15], s: 0.14, parent: g, cast: false });
    return { g, hide: 'side', h: 0.8, wob: 'tree' };
  },
  bush(pl) {
    const g = new THREE.Group();
    const col = pick(pl.id === 'night' ? ['#3F8F7A', '#4FA08A'] : ['#5BC46E', '#6FD07A', '#4FB866']);
    for (let i = 0; i < 4; i++) mesh(G.sphere(18), M.toy(i % 2 ? lighten(col, 0.1) : col), { p: [(i - 1.5) * 0.45, 0.5 + (i % 2) * 0.2, (i % 2) * 0.15], s: 0.62 - (i % 3) * 0.06, parent: g });
    if (Math.random() < 0.5) for (let i = 0; i < 5; i++) mesh(G.sphere(8), M.toy(pick(['#FF8FC0', '#FFFFFF', '#FFE066'])), { p: [rand(-0.9, 0.9), rand(0.5, 1), 0.5], s: 0.09, parent: g, cast: false });
    return { g, hide: 'behind', h: 0.95, wob: 'bush' };
  },
  rock(pl) {
    const g = new THREE.Group();
    const col = pl.id === 'snow' ? '#C9D4E8' : pl.id === 'candy' ? '#E9C9FF' : '#B8B0C8';
    mesh(G.sphere(14), M.toy(col, { roughness: 0.8 }), { p: [0, 0.4, 0], s: [0.95, 0.62, 0.7], parent: g });
    mesh(G.sphere(12), M.toy(lighten(col, 0.1), { roughness: 0.8 }), { p: [0.6, 0.25, 0.2], s: [0.45, 0.35, 0.4], parent: g, cast: false });
    return { g, hide: 'behind', h: 0.8 };
  },
  hay() {
    const g = new THREE.Group();
    mesh(G.cyl(20, 0.85), M.toy('#F2CF6A', { roughness: 0.9 }), { p: [0, 0.6, 0], s: [0.9, 1.2, 0.9], parent: g });
    mesh(G.sphere(20), M.toy('#F2CF6A', { roughness: 0.9 }), { p: [0, 1.2, 0], s: [0.78, 0.45, 0.78], parent: g });
    for (let i = 0; i < 8; i++) mesh(G.capsule(1, 4), M.toy('#E8BE50'), { p: [Math.cos(i) * 0.85, 0.3 + (i % 3) * 0.3, Math.sin(i) * 0.85], r: [rand(-1, 1), 0, rand(-1, 1)], s: [0.02, 0.15, 0.02], parent: g, cast: false });
    return { g, hide: 'tail', h: 1.2 };
  },
  barrel() {
    const g = new THREE.Group();
    mesh(G.cyl(20, 0.92), M.toy('#C98A52'), { p: [0, 0.45, 0], s: [0.55, 0.9, 0.55], parent: g });
    for (const y of [0.15, 0.75]) mesh(G.torus(0.06, TAU, 24), M.metal('#9A8A9E'), { p: [0, y, 0], r: [Math.PI / 2, 0, 0], s: 0.56, parent: g, cast: false });
    mesh(G.cyl(20), M.toy('#5A3A28'), { p: [0, 0.89, 0], s: [0.5, 0.02, 0.5], parent: g, cast: false });
    return { g, hide: 'inside', h: 0.9 };
  },
  bucket() {
    const g = new THREE.Group();
    mesh(G.cyl(20, 1.2), M.glossy(pick(['#FF6F9B', '#6FC4FF', '#FFC233'])), { p: [0, 0.38, 0], s: [0.5, 0.76, 0.5], parent: g });
    mesh(G.cyl(20), M.toy('#5A3A28'), { p: [0, 0.75, 0], s: [0.56, 0.02, 0.56], parent: g, cast: false });
    mesh(G.torus(0.04, Math.PI, 16), M.glossy('#FFFFFF'), { p: [0, 0.8, 0], s: 0.5, parent: g, cast: false });
    return { g, hide: 'inside', h: 0.76 };
  },
  house(pl) {
    const g = new THREE.Group();
    const wall = pick(pl.night ? ['#8C7FD8', '#6E9FD0'] : ['#FFF1DC', '#FFE3EF', '#E3F0FF']);
    mesh(G.box(0.1), M.toy(wall), { p: [0, 0.9, 0], s: [2, 1.8, 1.6], parent: g });
    const roof = mesh(G.cone(4), M.toy(pick(['#FF6F8F', '#6FA8FF', '#FF9F5A'])), { p: [0, 2.35, 0], r: [0, Math.PI / 4, 0], s: [1.75, 1.1, 1.45], parent: g });
    mesh(G.box(0.1), M.toy('#B07BFF'), { p: [-0.5, 0.5, 0.81], s: [0.5, 1, 0.05], parent: g, cast: false });
    // the window, dark inside, where a face can appear
    mesh(G.box(0.05), M.toy('#FFFFFF'), { p: [0.45, 1.15, 0.81], s: [0.7, 0.7, 0.06], parent: g, cast: false });
    mesh(G.box(0.05), M.basic(pl.night ? '#FFE9A0' : '#5A4A7A'), { p: [0.45, 1.15, 0.83], s: [0.58, 0.58, 0.04], parent: g, cast: false });
    return { g, hide: 'window', h: 1.0, win: V(0.45, 1.05, 0.86), wob: 'house' };
  },
  box() {
    const g = new THREE.Group();
    const col = pick(['#FF8FC0', '#8FD0FF', '#FFC86B', '#B48BFF']);
    mesh(G.box(0.12), M.toy(col), { p: [0, 0.4, 0], s: [0.9, 0.8, 0.9], parent: g });
    const lid = group(g, [0, 0.82, 0]);
    mesh(G.box(0.08), M.toy(darken(col, 0.08)), { s: [1.0, 0.14, 1.0], parent: lid });
    mesh(G.box(0.05), M.toy('#FFFFFF'), { p: [0, -0.4, 0.46], s: [0.18, 0.82, 0.02], parent: lid, cast: false });
    return { g, hide: 'cover', h: 0.8, lid, wob: 'box' };
  },
  gift(pl) {
    const r = B.box(pl);
    for (const k of [-1, 1]) mesh(G.sphere(12), M.glossy('#FF5C8F'), { p: [k * 0.17, 0.16, 0], r: [0, 0, k * 0.4], s: [0.2, 0.12, 0.1], parent: r.lid, cast: false });
    return r;
  },
  flowers() {
    const g = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const x = rand(-0.9, 0.9), z = rand(-0.5, 0.5), h = rand(0.5, 0.9);
      mesh(G.cyl(6), M.toy('#5FBF72'), { p: [x, h / 2, z], s: [0.03, h, 0.03], parent: g, cast: false });
      mesh(G.sphere(10), M.toy(pick(['#FF82AF', '#FFD45C', '#B48BFF', '#FFFFFF', '#6FD8FF'])), { p: [x, h, z], s: [0.16, 0.1, 0.16], parent: g, cast: false });
    }
    return { g, hide: null, h: 0.7, wob: 'flowers' };
  },
  fence() {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) mesh(G.box(0.05), M.toy('#FFFFFF'), { p: [(i - 1.5) * 0.5, 0.45, 0], s: [0.14, 0.9, 0.08], parent: g });
    for (const y of [0.3, 0.65]) mesh(G.box(0.03), M.toy('#FFFFFF'), { p: [0, y, 0.05], s: [1.9, 0.1, 0.05], parent: g, cast: false });
    return { g, hide: 'behind', h: 0.6 };
  },
  shroom() {
    const g = new THREE.Group();
    mesh(G.cyl(14, 0.85), M.toy('#FFF4E8'), { p: [0, 0.5, 0], s: [0.3, 1, 0.3], parent: g });
    mesh(G.sphere(24), M.toy('#FF5C6F'), { p: [0, 1.05, 0], s: [0.9, 0.5, 0.9], parent: g });
    for (let i = 0; i < 6; i++) mesh(G.sphere(8), M.basic('#FFFFFF'), { p: [Math.cos(i) * 0.5, 1.35 - (i % 2) * 0.1, Math.sin(i) * 0.5], s: 0.1, parent: g, cast: false });
    return { g, hide: 'under', h: 0.6 };
  },
  shroomGlow() {
    const r = B.shroom();
    r.g.children[1].material = M.toy('#8FE8FF', { emissive: '#8FE8FF', emissiveIntensity: 0.6 });
    return r;
  },
  log() {
    const g = new THREE.Group();
    mesh(G.cyl(16), M.toy('#B07A55'), { p: [0, 0.4, 0], r: [0, 0, Math.PI / 2], s: [0.4, 1.8, 0.4], parent: g });
    for (const k of [-1, 1]) mesh(G.circle(16), M.toy('#E8C49A'), { p: [k * 0.91, 0.4, 0], r: [0, k * Math.PI / 2, 0], s: 0.38, parent: g, cast: false });
    return { g, hide: 'behind', h: 0.8 };
  },
  stump() {
    const g = new THREE.Group();
    mesh(G.cyl(16, 0.9), M.toy('#9A6A48'), { p: [0, 0.3, 0], s: [0.6, 0.6, 0.6], parent: g });
    mesh(G.cyl(16), M.toy('#E8C49A'), { p: [0, 0.61, 0], s: [0.54, 0.02, 0.54], parent: g, cast: false });
    return { g, hide: 'behind', h: 0.6 };
  },
  umbrella() {
    const g = new THREE.Group();
    mesh(G.cyl(6), M.toy('#FFFFFF'), { p: [0, 1, 0], s: [0.05, 2, 0.05], parent: g, cast: false });
    const cols = ['#FF5C8F', '#FFFFFF'];
    for (let i = 0; i < 8; i++) mesh(G.cone(3), M.toy(cols[i % 2]), { p: [0, 2.0, 0], r: [0, (i / 8) * TAU, 0], s: [1.3, 0.5, 1.3], parent: g });
    mesh(G.box(0.1), M.toy('#6FC4FF'), { p: [0.2, 0.05, 0.3], s: [1.1, 0.06, 0.7], parent: g, cast: false, receive: true });
    return { g, hide: 'under', h: 0.6 };
  },
  castle() {
    const g = new THREE.Group();
    const sand = M.toy('#F2C988', { roughness: 0.9 });
    mesh(G.cyl(16, 0.85), sand, { p: [0, 0.4, 0], s: [0.9, 0.8, 0.9], parent: g });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; mesh(G.cyl(10, 0.8), sand, { p: [Math.cos(a) * 0.6, 0.95, Math.sin(a) * 0.6], s: [0.25, 0.5, 0.25], parent: g }); }
    mesh(G.cone(4), M.toy('#FF5C8F'), { p: [0, 1.45, 0], s: [0.12, 0.25, 0.04], parent: g, cast: false });
    return { g, hide: 'behind', h: 1.0 };
  },
  ball() {
    const g = new THREE.Group();
    mesh(G.sphere(20), PM({ map: ballTex(), roughness: 0.3, clearcoat: 1 }), { p: [0, 0.4, 0], s: 0.4, parent: g });
    return { g, hide: null, h: 0.8, wob: 'ball' };
  },
  snowman() {
    const g = new THREE.Group();
    const sn = M.plush('#FFFFFF');
    mesh(G.sphere(20), sn, { p: [0, 0.5, 0], s: 0.6, parent: g });
    mesh(G.sphere(20), sn, { p: [0, 1.25, 0], s: 0.42, parent: g });
    mesh(G.cone(10), M.toy('#FF8A3C'), { p: [0, 1.25, 0.48], r: [Math.PI / 2, 0, 0], s: [0.07, 0.25, 0.07], parent: g, cast: false });
    for (const k of [-1, 1]) mesh(G.sphere(8), M.glossy('#2B1D48'), { p: [k * 0.13, 1.35, 0.38], s: 0.05, parent: g, cast: false });
    mesh(G.torus(0.3, TAU, 20), M.plush('#FF5C8F'), { p: [0, 0.95, 0], r: [Math.PI / 2, 0, 0], s: 0.42, parent: g, cast: false });
    return { g, hide: 'side', h: 0.9 };
  },
  igloo() {
    const g = new THREE.Group();
    const dome = mesh(new THREE.SphereGeometry(1, 24, 12, 0, TAU, 0, Math.PI / 2), M.toy('#EAF4FF'), { s: [1.1, 0.95, 1.1], parent: g });
    mesh(G.circle(16), M.basic('#5A6A9A'), { p: [0, 0.35, 1.0], s: [0.38, 0.38, 1], parent: g, cast: false });
    return { g, hide: 'window', h: 0.8, win: V(0, 0.28, 1.05) };
  },
  snowpile() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) mesh(G.sphere(16), M.plush('#FFFFFF'), { p: [(i - 1) * 0.45, 0.25, (i % 2) * 0.2], s: [0.6, 0.45, 0.55], parent: g });
    return { g, hide: 'behind', h: 0.55 };
  },
  lolly() {
    const g = new THREE.Group();
    mesh(G.cyl(8), M.toy('#FFFFFF'), { p: [0, 0.8, 0], s: [0.08, 1.6, 0.08], parent: g });
    const t = new THREE.Group();
    t.position.y = 1.9;
    g.add(t);
    mesh(G.puck(0.4), PM({ map: swirlTex(pick(['#FF5C8F', '#8C68F2', '#3FD0C9'])), roughness: 0.2, clearcoat: 1 }), { r: [Math.PI / 2, 0, 0], s: [0.85, 0.22, 0.85], parent: t });
    return { g, hide: 'side', h: 0.8, wob: 'tree' };
  },
  cupcake() {
    const g = new THREE.Group();
    mesh(G.cyl(16, 1.25), M.toy('#FFB0D0'), { p: [0, 0.4, 0], s: [0.7, 0.8, 0.7], parent: g });
    for (let i = 0; i < 3; i++) mesh(G.sphere(20), M.plush(i === 2 ? '#FFFFFF' : '#FFF4FA'), { p: [0, 1.0 + i * 0.3, 0], s: 0.85 - i * 0.25, parent: g });
    mesh(G.sphere(12), M.glossy('#FF3E6C'), { p: [0, 1.85, 0], s: 0.16, parent: g, cast: false });
    return { g, hide: 'side', h: 1.0 };
  },
  cane() {
    const g = new THREE.Group();
    const m = PM({ map: stripeTex(), roughness: 0.25, clearcoat: 1 });
    mesh(G.cyl(10), m, { p: [0, 0.9, 0], s: [0.12, 1.8, 0.12], parent: g });
    mesh(G.torus(0.12, Math.PI, 16), m, { p: [0.3, 1.8, 0], s: 0.3, parent: g });
    return { g, hide: null, h: 0.5 };
  },
  gumdrop() {
    const g = new THREE.Group();
    const col = pick(['#FF5C8F', '#7FE3A0', '#FFE066', '#8FD0FF', '#B48BFF']);
    mesh(new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI / 2), M.jelly(col), { s: [0.7, 0.8, 0.7], parent: g });
    return { g, hide: 'behind', h: 0.7 };
  },
  donut() {
    const g = new THREE.Group();
    mesh(G.torus(0.42, TAU, 24), M.toy('#E8B27C'), { p: [0, 0.75, 0], s: 0.7, parent: g });
    mesh(G.torus(0.34, TAU, 24), M.glossy('#FF8FC0'), { p: [0, 0.75, 0.06], s: [0.71, 0.71, 0.5], parent: g, cast: false });
    return { g, hide: 'behind', h: 0.8 };
  },
  lantern() {
    const g = new THREE.Group();
    mesh(G.cyl(6), M.toy('#5A4A7A'), { p: [0, 0.9, 0], s: [0.06, 1.8, 0.06], parent: g });
    mesh(G.sphere(16), M.toy('#FFD45C', { emissive: '#FFB000', emissiveIntensity: 1 }), { p: [0, 1.95, 0], s: [0.26, 0.32, 0.26], parent: g, cast: false });
    // a real light only for some lanterns: every light makes every pixel dearer
    B.lights = (B.lights || 0) + 1;
    if (B.lights % 3 === 1) {
      const l = new THREE.PointLight('#FFD48A', 5, 6, 1.6);
      l.position.y = 1.9;
      g.add(l);
    }
    return { g, hide: null, h: 0.5 };
  }
};
let ballT = null, swirlC = new Map(), stripeT = null;
function ballTex() { return ballT || (ballT = canvasTex(256, 128, (x, w, h) => { const c = ['#FF5C8F', '#FFFFFF', '#FFC233', '#FFFFFF', '#6FC4FF', '#FFFFFF']; c.forEach((col, i) => { x.fillStyle = col; x.fillRect((i * w) / 6, 0, w / 6 + 1, h); }); })); }
function swirlTex(col) { if (swirlC.has(col)) return swirlC.get(col); const t = canvasTex(256, 256, (x) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 256, 256); x.strokeStyle = col; x.lineWidth = 18; x.beginPath(); for (let a = 0; a < 18; a += 0.05) { const r = a * 6.6; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.stroke(); }); swirlC.set(col, t); return t; }
function stripeTex() { return stripeT || (stripeT = canvasTex(64, 256, (x) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 64, 256); x.fillStyle = '#FF3E6C'; for (let i = 0; i < 8; i++) { x.save(); x.translate(0, i * 32); x.transform(1, 0.5, 0, 1, 0, 0); x.fillRect(0, 0, 64, 14); x.restore(); } })); }

// ---- the scene -------------------------------------------------------------------------
export const hidden = {
  tint: '#BFE9B8',

  enter(args) {
    this.t = 0;
    this.d = hdata();
    this.buttons = [this.mapButton(), this.helpButton()];
    this.startLevel(args && args.level !== undefined ? args.level : this.d.level);
    music.play('hidden');
  },

  exit() {
    if (this.pups) for (const p of this.pups) p.c.dispose();
    if (this.stage) this.stage.dispose();
  },

  startLevel(level) {
    if (this.nextBtn) { this.buttons = this.buttons.filter((b) => b !== this.nextBtn); this.nextBtn = null; }
    if (this.mapBtns) this.closeMap();
    if (this.stage) {
      for (const p of this.pups) p.c.dispose();
      this.stage.dispose();
    }
    this.level = clamp(level, 0, PLACES.length * 3 - 1);
    B.lights = 0;
    const pl = this.place = PLACES[Math.floor(this.level / 3)];
    const tier = this.level % 3;
    const count = COUNTS[Math.floor(this.level / 3)][tier];
    this.width = 16 + tier * 6;
    const st = this.stage = new Stage({
      bg: pl.sky, fov: 32, keyPos: [-6, 12, 7], shadowArea: 12, shadowSize: 2048,
      hemi: pl.night ? 0.35 : 0.65, key: pl.night ? 0.5 : 2.6, keyColor: pl.night ? '#AFC0FF' : '#FFF4E4', env: pl.night ? 0.25 : 0.6, rim: pl.night ? 0.6 : 1.1
    });
    this.world = group(st.scene);
    this.buildGround(pl);
    this.props = [];
    this.pups = [];
    this.layoutProps(pl, count, tier);
    this.panX = 0;
    this.panV = 0;
    this.found = 0;
    this.total = this.pups.length;
    this.idleT = 0;
    this.done = false;
    this.layout();
    st.snap(this.pose());
    if (pl.night) {
      // at night her finger is a torch
      const sp = this.torch = new THREE.SpotLight('#FFF2C8', 60, 14, 0.42, 0.6, 1.2);
      sp.position.set(0, 8, 4);
      st.scene.add(sp, sp.target);
      sp.target.position.set(0, 0, -1);
    } else this.torch = null;
    this.trayAnim = this.pups.map(() => 0);
    hint.clear();
    if (this.level === 0 && !this.d.seenHint) wait(2.5, () => this.helpFor(this.pups.find((p) => !p.found), true));
  },

  buildGround(pl) {
    const W = this.world, w = this.width + 30;
    mesh(G.box(0.3), M.matte(pl.ground), { p: [0, -0.5, -2], s: [w, 1, 20], receive: true, parent: W });
    // a little path winding through
    const path = new THREE.Shape();
    path.moveTo(-w / 2, 0.6);
    for (let x = -w / 2; x <= w / 2; x += 1) path.lineTo(x, 0.6 + Math.sin(x * 0.3) * 1.2);
    for (let x = w / 2; x >= -w / 2; x -= 1) path.lineTo(x, -0.6 + Math.sin(x * 0.3) * 1.2);
    const pm = mesh(new THREE.ShapeGeometry(path, 4), M.matte(pl.id === 'snow' ? '#E2ECFA' : pl.id === 'candy' ? '#FFF0F8' : pl.id === 'night' ? '#5A8A8A' : pl.id === 'beach' ? '#FFF0CC' : '#E8D9A8'), { r: [-Math.PI / 2, 0, 0], p: [0, 0.01, 1.2], receive: true, cast: false, parent: W });
    if (pl.sea) {
      const sea = mesh(G.plane(), PM({ color: '#4FC4E8', roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.9 }), { r: [-Math.PI / 2, 0, 0], p: [0, 0.03, -9.5], s: [w, 6, 1], cast: false, parent: W });
      this.sea = sea;
    } else this.sea = null;
    // distant scenery: hills or dunes along the back
    for (let i = 0; i < 9; i++) {
      const x = (i / 8 - 0.5) * w;
      mesh(G.sphere(20), M.matte(pl.edge), { p: [x, -1.5, -13 - rand(0, 3)], s: [rand(5, 8), rand(3, 5), 3], cast: false, parent: W });
    }
  },

  layoutProps(pl, count, tier) {
    const W = this.world, w = this.width;
    // jittered grid of spots; depth rows from back (-5) to front (2.2)
    const spots = [];
    const cols = Math.round(w / 2.4), rows = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      spots.push(V(-w / 2 + (c + 0.5) * (w / cols) + rand(-0.4, 0.4), 0, -4.6 + r * 2.6 + rand(-0.4, 0.4)));
    }
    spots.sort(() => Math.random() - 0.5);
    const hideable = [];
    for (const sp of spots) {
      // leave the path in front a little clearer
      if (Math.abs(sp.z - 1.2 - Math.sin(sp.x * 0.3) * 1.2) < 0.7 && Math.random() < 0.6) continue;
      const kind = pick(pl.props);
      const pr = B[kind](pl);
      pr.kind = kind;
      pr.g.position.copy(sp);
      pr.g.rotation.y = rand(-0.25, 0.25);
      const s = rand(0.9, 1.15);
      pr.g.scale.setScalar(s);
      pr.sq = new Spring(1, 240, 8);
      if (pr.lid) bake(pr.lid);
      bake(pr.g, [pr.lid]);
      W.add(pr.g);
      this.props.push(pr);
      if (pr.hide) hideable.push(pr);
    }
    // a few little extras: flowers, pebbles
    const bits = group(W);
    for (let i = 0; i < 30; i++) {
      const col = pl.id === 'snow' ? '#FFFFFF' : pl.id === 'candy' ? pick(['#FF5C8F', '#FFE066', '#8FD0FF']) : pick(['#FF82AF', '#FFD45C', '#FFFFFF', '#B48BFF']);
      mesh(G.sphere(8), M.toy(col), { p: [rand(-w / 2, w / 2), 0.06, rand(-5, 3)], s: rand(0.07, 0.13), parent: bits, cast: false });
    }
    bake(bits);
    // spread the puppies along the whole width
    hideable.sort((a, b) => a.g.position.x - b.g.position.x);
    const chosen = [];
    const n = Math.min(count, hideable.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(((i + Math.random() * 0.8) / n) * hideable.length);
      let pr = hideable[clamp(idx, 0, hideable.length - 1)];
      if (chosen.includes(pr)) pr = hideable.find((h) => !chosen.includes(h));
      if (pr) chosen.push(pr);
    }
    // difficulty: later rounds peek out less
    const peek = [0.42, 0.32, 0.24][tier];
    for (const pr of chosen) this.hidePup(pr, pick(pl.pups), peek);
  },

  hidePup(pr, sp, peek) {
    const c = new Critter(sp, { size: 0.5, shadow: false });
    const g = pr.g, s = g.scale.x;
    const pup = { c, pr, sp, found: false, mode: pr.hide, ph: rand(TAU) };
    c.root.rotation.y = 0;
    const base = g.position.clone();
    const sz = 0.5 * s;
    if (pr.hide === 'behind') {
      // ears and eyes above the top edge
      c.root.position.set(base.x + rand(-0.4, 0.4) * s, (pr.h - (1 - peek) * 0.95) * s, base.z - 0.75 * s);
    } else if (pr.hide === 'side') {
      const k = Math.random() < 0.5 ? -1 : 1;
      c.root.position.set(base.x + k * (0.32 + peek * 0.9) * s, 0, base.z - 0.5 * s);
      c.root.rotation.y = -k * 0.5;
    } else if (pr.hide === 'inside') {
      c.root.position.set(base.x, (pr.h - 0.95 * (1 - peek * 0.8)) * s, base.z);
    } else if (pr.hide === 'tail') {
      c.root.position.set(base.x + 0.2 * s, 0, base.z + 0.65 * s);
      c.root.rotation.y = Math.PI;
      pup.mode = 'tail';
    } else if (pr.hide === 'window') {
      c.root.position.copy(base).add(pr.win.clone().multiplyScalar(s)).add(V(0, -0.55 * s, -0.42 * s));
      c.root.scale.multiplyScalar(0.85);
    } else if (pr.hide === 'under') {
      c.root.position.set(base.x + 0.3 * s, 0, base.z + 0.15 * s);
      c.root.scale.multiplyScalar(0.75);
    } else if (pr.hide === 'cover') {
      c.root.position.set(base.x, 0, base.z);
      c.root.scale.multiplyScalar(0.8);
      c.root.visible = false;
      pup.covered = true;
    }
    c.root.scale.multiplyScalar(s);
    this.world.add(c.root);
    c.sleep = Math.random() < 0.25;
    this.pups.push(pup);
  },

  pose() {
    const wide = app.W > app.H;
    const vis = wide ? 13 : 8.2;
    return this.stage.pose(V(this.panX, 0.2, -1.4), vis, wide ? 7.5 : 10, [0, 1.05, 1]);
  },
  layout() {
    const wide = app.W > app.H;
    this.panMax = Math.max(0, this.width / 2 - (wide ? 6 : 3.6));
    this.stage.shadowArea(12, V(this.panX, 0, -1.5));
  },
  resize() {
    this.layout();
    this.stage.snap(this.pose());
    this.placeButtons();
  },

  mapButton() {
    const b = new Btn({
      r: 26, slop: 8,
      paint: (c, r) => {
        candy(c, r, '#7FD86F');
        c.fillStyle = '#FFF6E6';
        c.beginPath(); c.moveTo(-13, -9); c.lineTo(-4, -12); c.lineTo(4, -9); c.lineTo(13, -12); c.lineTo(13, 10); c.lineTo(4, 13); c.lineTo(-4, 10); c.lineTo(-13, 13); c.closePath(); c.fill();
        c.fillStyle = P.rose; heart(c, 2, 0, 4.5); c.fill();
      },
      tap: () => this.toggleMap()
    });
    return b;
  },
  helpButton() {
    return new Btn({
      r: 28, slop: 10,
      paint: (c, r) => {
        candy(c, r, '#FFB054');
        c.strokeStyle = '#FFF6E6'; c.lineWidth = 4.5; c.lineCap = 'round';
        ell(c, -3, -3, 9); c.stroke();
        c.beginPath(); c.moveTo(4, 4); c.lineTo(11, 11); c.stroke();
      },
      tap: () => { this.d.seenHint = 1; this.helpFor(this.pups.filter((p) => !p.found).sort((a, b) => Math.abs(a.c.root.position.x - this.panX) - Math.abs(b.c.root.position.x - this.panX))[0], true); }
    });
  },
  placeButtons() {
    const top = Math.max(app.safeTop, 10) + 34;
    this.buttons[0].x = app.W - 44; this.buttons[0].y = top;
    this.buttons[1].x = app.W - 44; this.buttons[1].y = app.H - Math.max(app.safeBottom, 8) - 42;
    if (this.mapBtns) this.placeMap();
  },

  // ---- the map of places ------------------------------------------------------------
  toggleMap() {
    if (this.mapBtns) { this.closeMap(); return; }
    audio.sfx('whoosh', { vol: 0.5 });
    this.mapOpen = 0;
    tween(this, { mapOpen: 1 }, 0.35, { ease: E.out });
    this.mapBtns = PLACES.map((pl, i) => new Btn({
      r: 46, slop: 6, i,
      paint: (c, r) => {
        const unlocked = i * 3 <= this.d.level;
        drawPlaceIcon(c, pl, r, unlocked);
        for (let k = 0; k < 3; k++) {
          const on = this.d.best[i * 3 + k];
          softStar(c, (k - 1) * 18, r + 14, on ? 9 : 7, 5, 0.5);
          c.fillStyle = on ? P.sun : 'rgba(255,255,255,.7)';
          c.fill();
        }
      },
      tap: () => {
        if (i * 3 > this.d.level) { audio.sfx('tick'); return; }
        // the next round she has not done in that place, or the first
        let lv = i * 3;
        while (lv < i * 3 + 2 && this.d.best[lv]) lv++;
        this.closeMap();
        wait(0.2, () => this.startLevel(lv));
      }
    }));
    this.placeMap();
    this.buttons = [this.buttons[0], this.buttons[1], ...this.mapBtns];
  },
  placeMap() {
    const wide = app.W > app.H, cols = wide ? 3 : 2;
    const gx = wide ? 150 : 140, gy = wide ? 150 : 150;
    this.mapBtns.forEach((b, i) => {
      const r = Math.floor(i / cols), c = i % cols, rows = Math.ceil(this.mapBtns.length / cols);
      b.x = app.W / 2 + (c - (cols - 1) / 2) * gx;
      b.y = app.H / 2 + (r - (rows - 1) / 2) * gy - 10;
    });
  },
  closeMap() {
    this.buttons = this.buttons.slice(0, 2);
    this.mapBtns = null;
  },

  helpFor(pup, strong = false) {
    if (!pup || pup.found) return;
    this.idleT = 0;
    // pan toward it, bark, sparkle
    const x = clamp(pup.c.root.position.x, -this.panMax, this.panMax);
    this.panTo = x;
    const s = this.stage.objScreen(pup.c.body);
    audio.voice('arf', pup.c.voicePitch, 0.6);
    if (pup.covered) pup.pr.sq.kick(-4);
    pup.c.poke(0.6);
    wait(0.5, () => {
      const s2 = this.stage.objScreen(pup.covered ? pup.pr.g : pup.c.body);
      fx.sparkle(s2.x, s2.y - 10, strong ? 16 : 8);
      if (strong) this.ring = { x: s2.x, y: s2.y, t: 0, pup };
    });
  },

  // ---- finding --------------------------------------------------------------------------
  find(pup) {
    if (pup.found) return;
    pup.found = true;
    this.found++;
    this.idleT = 0;
    const c = pup.c;
    c.sleep = false;
    c.root.visible = true;
    if (pup.covered) {
      const lid = pup.pr.lid;
      tween(lid.position, { y: lid.position.y + 0.9 }, 0.25, { ease: E.out });
      tween(lid.rotation, { z: 0.8 }, 0.25, { ease: E.out });
      pup.covered = false;
    }
    if (pup.pr.wob) pup.pr.sq.kick(-5);
    const s = this.stage.objScreen(c.body);
    audio.voice('arf', c.voicePitch, 0.75);
    audio.sfx('found', { vol: 0.7 });
    fx.burst(s.x, s.y, { kind: 'star', n: 14, colors: [P.sun, P.butter, '#FFFFFF'], speed: 260, size: 18, g: 200, life: 0.9 });
    fx.hearts(s.x, s.y - 20, 4);
    haptic();
    c.setMood('happy', 2);
    // out of the hiding place, a happy spin, then up to the row of found friends
    const from = c.root.position.clone();
    const out = V(from.x, 0, Math.max(from.z, pup.pr.g.position.z) + 1.1);
    const o = { u: 0, spin: 0 };
    c.root.rotation.y = 0;
    tween(o, { u: 1 }, 0.55, { ease: E.out });
    tween(o, { spin: TAU }, 0.6, { ease: E.io, delay: 0.1 });
    pup.jump = { from, out, o };
    const slot = this.pups.filter((p) => p.found).length - 1;
    wait(1.1, () => {
      pup.jump = null;
      pup.fly = { from: c.root.position.clone(), t: 0, slot };
      audio.sfx('zip', { vol: 0.5 });
    });
    if (this.found >= this.total) wait(1.9, () => this.complete());
  },

  complete() {
    if (this.done) return;
    this.done = true;
    const lv = this.level;
    this.d.best[lv] = 1;
    if (lv >= this.d.level) this.d.level = Math.min(PLACES.length * 3 - 1, lv + 1);
    save.touch();
    save.earnStar();
    audio.fanfare();
    fx.confetti(app.W, app.H, 120);
    // everyone comes back to dance in the middle
    this.party = [];
    this.pups.forEach((p, i) => {
      p.fly = null;
      p.c.root.visible = true;
      const x = this.panX + (i - (this.pups.length - 1) / 2) * 1.0;
      p.c.root.position.set(x, 0, 1.6);
      p.c.root.scale.setScalar(0.62);
      p.c.root.rotation.y = 0;
      p.c.setMood('happy', 4);
      wait(i * 0.12, () => { p.c.hop(6); p.c.say(pick(['arf', 'yay', 'hehe']), 0.5); });
      this.party.push(p);
    });
    this.nextBtn = new Btn({
      r: 46, slop: 10,
      paint: (c, r) => {
        candy(c, r, '#FF8FB8');
        c.fillStyle = '#fff';
        c.beginPath(); c.moveTo(-10, -16); c.lineTo(16, 0); c.lineTo(-10, 16); c.closePath(); c.fill();
      },
      tap: () => {
        this.buttons = this.buttons.filter((b) => b !== this.nextBtn);
        this.nextBtn = null;
        this.startLevel(lv + 1 >= PLACES.length * 3 ? Math.floor(Math.random() * PLACES.length * 3) : lv + 1);
      }
    });
    this.nextBtn.x = app.W / 2;
    this.nextBtn.y = app.H * 0.32;
    wait(1.5, () => { if (this.nextBtn) { this.buttons.push(this.nextBtn); this.nextBtn.s.x = 0.01; this.nextBtn.s.kick(6); audio.sparkle(3, 4); } });
  },

  // ---- frame ---------------------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const t = this.t, st = this.stage;
    if (this.panTo !== undefined) {
      this.panX += (this.panTo - this.panX) * Math.min(1, dt * 3.5);
      if (Math.abs(this.panTo - this.panX) < 0.02) this.panTo = undefined;
    } else if (!this.dragging) {
      this.panX += this.panV * dt;
      this.panV *= Math.pow(0.04, dt);
    }
    this.panX = clamp(this.panX, -this.panMax, this.panMax);
    st.glide(this.pose(), dt, 8);
    st.shadowArea(12, V(this.panX, 0, -1.5));
    if (this.sea) this.sea.position.y = 0.03 + Math.sin(t * 1.2) * 0.03;
    for (const pr of this.props) {
      const k = pr.sq.step(dt);
      pr.g.scale.y = pr.g.scale.x * k;
      // boxes with someone inside wiggle now and then: a clue
      if (pr.lid) {
        const inside = this.pups.find((p) => p.pr === pr && p.covered);
        pr.g.rotation.z = inside && Math.sin(t * 1.3 + pr.g.position.x) > 0.93 ? Math.sin(t * 30) * 0.06 : 0;
      }
    }
    for (const p of this.pups) {
      const c = p.c;
      if (p.jump) {
        const u = p.jump.o.u;
        c.root.position.lerpVectors(p.jump.from, p.jump.out, u);
        c.root.position.y = Math.sin(u * Math.PI) * 1.6 + lerp(p.jump.from.y, 0, u);
        c.root.rotation.y = p.jump.o.spin;
        c.root.scale.setScalar(lerp(c.root.scale.x, 0.6, 0.1));
      } else if (p.fly) {
        // fly up toward its slot in the row at the top of the screen
        p.fly.t += dt;
        const target = this.slotWorld(p.fly.slot);
        c.root.position.lerp(target, Math.min(1, dt * 5));
        c.root.scale.setScalar(Math.max(0.01, c.root.scale.x * (1 - dt * 2.4)));
        if (p.fly.t > 0.9) { p.fly = null; c.root.visible = false; this.trayAnim[this.pups.indexOf(p)] = 1; audio.note('bell', penta(4 + this.found), { vol: 0.5 }); }
      } else if (!p.found) {
        if (p.mode === 'side') c.root.position.x += Math.sin(t * 1.4 + p.ph) * 0.0015;
        if (p.mode === 'tail') c.wagT = 1;
      }
      if (c.root.visible) {
        if (!p.found && p.mode !== 'tail') c.look(st.camera.position);
        c.update(dt);
        if (p.mode === 'tail' && !p.found && c.tail) c.tail.rotation.y = Math.sin(t * 10 + p.ph) * 0.7;
      }
    }
    for (let i = 0; i < this.trayAnim.length; i++) if (this.trayAnim[i] > 0) this.trayAnim[i] = Math.max(0, this.trayAnim[i] - dt * 2);
    // gentle help: after a long quiet spell, a hidden puppy barks
    this.idleT += dt;
    if (!this.done && this.idleT > 18) {
      const left = this.pups.filter((p) => !p.found);
      this.helpFor(pick(left));
    }
    if (this.ring) { this.ring.t += dt; if (this.ring.t > 3.5) this.ring = null; }
    if (this.torch) {
      const tp = this.torchAt || V(this.panX, 0, -1);
      this.torch.target.position.lerp(tp, Math.min(1, dt * 10));
      this.torch.position.set(this.torch.target.position.x, 7, this.torch.target.position.z + 3.5);
    }
  },

  slotWorld(i) {
    const s = this.slotScreen(i);
    return this.stage.onFacing(s.x, s.y, V(this.panX, 2, 0));
  },
  slotScreen(i) {
    const n = this.total, gap = Math.min(54, (app.W - 220) / Math.max(1, n));
    return { x: app.W / 2 + (i - (n - 1) / 2) * gap, y: Math.max(app.safeTop, 10) + 34 };
  },

  draw(c) {
    // the row of puppies to find
    const n = this.total;
    for (let i = 0; i < n; i++) {
      const s = this.slotScreen(i);
      const p = this.pups.filter((q) => q.found && !q.fly && !q.jump)[i];
      const bounce = p ? this.trayAnim[this.pups.indexOf(p)] : 0;
      const r = 21 * (1 + bounce * 0.4);
      c.save();
      c.translate(s.x, s.y);
      c.fillStyle = p ? '#FFFFFF' : 'rgba(255,255,255,.45)';
      c.shadowColor = 'rgba(40,20,90,.25)';
      c.shadowBlur = 6;
      c.shadowOffsetY = 2;
      ell(c, 0, 0, r);
      c.fill();
      c.shadowColor = 'transparent';
      if (p) drawPupFace(c, p.sp, r * 0.8);
      else { c.fillStyle = 'rgba(120,90,140,.35)'; drawPupSilhouette(c, r * 0.8); }
      c.restore();
    }
    if (this.ring) {
      const k = this.ring.t, s = this.stage.objScreen(this.ring.pup.covered ? this.ring.pup.pr.g : this.ring.pup.c.body);
      c.save();
      c.globalAlpha = clamp(3.5 - k);
      c.strokeStyle = '#FFF2A0';
      c.lineWidth = 5;
      ell(c, s.x, s.y, 48 + Math.sin(k * 6) * 6);
      c.stroke();
      c.restore();
    }
    if (this.mapBtns) {
      c.save();
      c.globalAlpha = (this.mapOpen || 0) * 0.55;
      c.fillStyle = '#2E1E66';
      c.fillRect(0, 0, app.W, app.H);
      c.restore();
    }
    if (!this.buttons[0].y) this.placeButtons();
    for (const b of this.buttons) b.draw(c);
  },

  // ---- input -------------------------------------------------------------------------
  down(p) {
    if (this.mapBtns) { this.closeMap(); return; }
    p.pan0 = this.panX;
    p.lastX = p.x;
    p.lt = this.t;
    this.panTo = undefined;
    if (this.torch) this.torchAt = this.stage.onPlane(p.x, p.y, 0);
  },
  move(p) {
    if (this.torch) this.torchAt = this.stage.onPlane(p.x, p.y, 0);
    if (p.moved > 14 || this.dragging) {
      this.dragging = true;
      const upp = this.stage.unitsPerPx(V(this.panX, 0, -1.4)) * 1.0;
      this.panX = clamp(p.pan0 - (p.x - p.sx) * upp, -this.panMax, this.panMax);
      const dt = Math.max(0.016, this.t - p.lt);
      this.panV = -(p.x - p.lastX) * upp / dt;
      p.lastX = p.x;
      p.lt = this.t;
    }
  },
  up(p) {
    const wasDrag = this.dragging && p.moved > 14;
    this.dragging = false;
    if (wasDrag) return;
    this.panV = 0;
    this.tap(p);
  },

  tap(p) {
    const st = this.stage;
    if (this.done) {
      for (const q of this.pups) {
        const s = st.objScreen(q.c.body);
        if (dist(p.x, p.y, s.x, s.y) < 50) { q.c.hop(6); q.c.say(pick(['arf', 'yay', 'giggle']), 0.6); fx.hearts(s.x, s.y, 4); return; }
      }
      return;
    }
    // generous: a tap near any visible bit of a puppy finds it
    let best = null, bd = 1e9;
    for (const q of this.pups) {
      if (q.found || q.covered) continue;
      const s = st.objScreen(q.c.body);
      const head = st.toScreen(q.c.body.getWorldPosition(V()).add(V(0, 0.35, 0)));
      const d = Math.min(dist(p.x, p.y, s.x, s.y), dist(p.x, p.y, head.x, head.y));
      const hitR = 46;
      if (d < hitR && d < bd) { bd = d; best = q; }
    }
    const hit = st.pick(p.x, p.y, [...this.props.map((pr) => pr.g), ...this.pups.map((q) => q.c.root)]);
    if (hit) {
      const q = this.pups.find((pp) => !pp.found && pp.c.root.getObjectById(hit.object.id));
      if (q) best = q;
    }
    if (best) { this.find(best); return; }
    if (hit) {
      const pr = this.props.find((x) => x.g.getObjectById(hit.object.id));
      if (pr) {
        const inside = this.pups.find((q) => q.pr === pr && q.covered && !q.found);
        if (inside) { this.find(inside); return; }
        this.poke(pr, p);
        return;
      }
    }
    fx.sparkle(p.x, p.y, 4);
    audio.sfx('plip', { rate: rand(0.9, 1.2), vol: 0.4 });
  },

  poke(pr, p) {
    pr.sq.kick(-4);
    const k = pr.kind;
    if (k === 'tree' || k === 'pine' || k === 'palm' || k === 'snowpine' || k === 'lolly') {
      audio.sfx('swish', { vol: 0.7 });
      fx.burst(p.x, p.y - 20, { kind: k === 'snowpine' ? 'dot' : 'heart', n: 6, colors: k === 'snowpine' ? ['#FFFFFF'] : [P.pink, P.rose], speed: 90, g: 220, size: 12, life: 0.9 });
    } else if (k === 'house' || k === 'igloo') audio.sfx('knock', { vol: 0.7 });
    else if (k === 'box' || k === 'gift') { audio.sfx('knock', { vol: 0.5 }); const lid = pr.lid; tween(lid.position, { y: 1.2 }, 0.15, { ease: E.out, done: () => tween(lid.position, { y: 0.82 }, 0.3, { ease: E.back }) }); }
    else if (k === 'ball') { audio.sfx('boing'); tween(pr.g.position, { y: 1.2 }, 0.25, { ease: E.out, done: () => tween(pr.g.position, { y: 0 }, 0.35, { ease: E.in }) }); }
    else if (k === 'flowers' || k === 'shroom' || k === 'shroomGlow') audio.note('bell', penta(Math.floor(rand(3, 10))), { vol: 0.45 });
    else audio.sfx('blup', { rate: rand(0.8, 1.2), vol: 0.5 });
    // nothing here... gently wobble so the tap still feels answered
    fx.sparkle(p.x, p.y, 5);
  }
};

function drawPupFace(c, sp, r) {
  const col = PUP_COLORS[sp] || '#F2C48D';
  c.fillStyle = col;
  ell(c, 0, 1, r * 0.85, r * 0.78);
  c.fill();
  c.fillStyle = sp === 'dalmatian' ? '#4B4560' : sp === 'pug' ? '#5E4B52' : '#C98A52';
  ell(c, -r * 0.78, -r * 0.05, r * 0.26, r * 0.48, 0.3); c.fill();
  ell(c, r * 0.78, -r * 0.05, r * 0.26, r * 0.48, -0.3); c.fill();
  c.fillStyle = '#FFF4E4';
  ell(c, 0, r * 0.32, r * 0.36, r * 0.26); c.fill();
  c.fillStyle = '#2B1D48';
  ell(c, -r * 0.3, -r * 0.1, r * 0.11, r * 0.14); c.fill();
  ell(c, r * 0.3, -r * 0.1, r * 0.11, r * 0.14); c.fill();
  ell(c, 0, r * 0.22, r * 0.1, r * 0.07); c.fill();
}
function drawPupSilhouette(c, r) {
  ell(c, 0, 1, r * 0.85, r * 0.78); c.fill();
  ell(c, -r * 0.78, -r * 0.05, r * 0.26, r * 0.48, 0.3); c.fill();
  ell(c, r * 0.78, -r * 0.05, r * 0.26, r * 0.48, -0.3); c.fill();
}
function drawPlaceIcon(c, pl, r, unlocked) {
  c.save();
  c.shadowColor = 'rgba(40,20,90,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
  c.fillStyle = unlocked ? pl.sky[0][1] : '#A9A6C4';
  ell(c, 0, 0, r); c.fill();
  c.restore();
  c.save();
  c.beginPath(); c.arc(0, 0, r - 3, 0, TAU); c.clip();
  c.fillStyle = unlocked ? pl.ground : '#C9C6DA';
  c.fillRect(-r, r * 0.15, r * 2, r);
  if (unlocked) {
    const k = r / 46;
    if (pl.id === 'meadow') { c.fillStyle = '#5BC46E'; ell(c, -16 * k, 10 * k, 16 * k, 12 * k); c.fill(); c.fillStyle = '#B9825A'; c.fillRect(12 * k, -6 * k, 6 * k, 20 * k); c.fillStyle = '#6CCB76'; ell(c, 15 * k, -12 * k, 14 * k); c.fill(); }
    if (pl.id === 'forest') { c.fillStyle = '#3FA06A'; for (const x of [-18, 0, 18]) { c.beginPath(); c.moveTo((x - 12) * k, 12 * k); c.lineTo(x * k, -22 * k); c.lineTo((x + 12) * k, 12 * k); c.fill(); } }
    if (pl.id === 'beach') { c.fillStyle = '#4FC4E8'; c.fillRect(-r, 2 * k, r * 2, 10 * k); c.fillStyle = '#FF5C8F'; c.beginPath(); c.arc(10 * k, -4 * k, 18 * k, Math.PI, 0); c.fill(); }
    if (pl.id === 'snow') { c.fillStyle = '#FFFFFF'; ell(c, 0, 8 * k, 12 * k); c.fill(); ell(c, 0, -10 * k, 8 * k); c.fill(); }
    if (pl.id === 'candy') { c.fillStyle = '#FF5C8F'; ell(c, -10 * k, -8 * k, 12 * k); c.fill(); c.fillStyle = '#fff'; c.fillRect(-11 * k, 2 * k, 3 * k, 18 * k); c.fillStyle = '#B48BFF'; ell(c, 14 * k, 10 * k, 10 * k, 8 * k); c.fill(); }
    if (pl.id === 'night') { c.fillStyle = '#FFF4C8'; ell(c, 12 * k, -14 * k, 9 * k); c.fill(); c.fillStyle = '#FFD45C'; ell(c, -12 * k, 2 * k, 6 * k); c.fill(); }
  } else {
    c.fillStyle = '#FFFFFF';
    rr(c, -9, -4, 18, 15, 3); c.fill();
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 3.5;
    c.beginPath(); c.arc(0, -5, 6, Math.PI, 0); c.stroke();
  }
  c.restore();
  c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.9)';
  ell(c, 0, 0, r - 2); c.stroke();
}
