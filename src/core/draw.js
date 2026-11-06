// Drawing toolkit: colour maths, soft "vinyl toy" shading and a sprite cache.
export const P = {
  pink: '#FF8FB8', rose: '#FF5C8F', coral: '#FF8A7A', peach: '#FFC7A8', butter: '#FFE27D', sun: '#FFC233',
  mint: '#8DEBC9', teal: '#3FD0C9', sky: '#7CCBFF', blue: '#5698FF', lilac: '#C7ABFF', violet: '#8C68F2',
  cream: '#FFF6E6', ink: '#3A2A57', white: '#FFFFFF', leaf: '#7FD86F', grass: '#5BC46E'
};

const cache = new Map();
function rgb(c) {
  let r = cache.get(c);
  if (r) return r;
  let h = c.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  r = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  cache.set(c, r);
  return r;
}
const hex2 = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
export const mix = (a, b, t) => {
  const A = rgb(a), B = rgb(b);
  return '#' + hex2(A[0] + (B[0] - A[0]) * t) + hex2(A[1] + (B[1] - A[1]) * t) + hex2(A[2] + (B[2] - A[2]) * t);
};
export const light = (c, t = 0.3) => mix(c, '#FFFFFF', t);
// Shadows lean to plum instead of black, which keeps every colour clean and warm
export const dark = (c, t = 0.25) => mix(c, '#3A2060', t);
export const alpha = (c, a) => {
  const A = rgb(c);
  return `rgba(${A[0]},${A[1]},${A[2]},${a})`;
};

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
export const TAU = Math.PI * 2;

export const E = {
  out: (t) => 1 - (1 - t) * (1 - t) * (1 - t),
  in: (t) => t * t * t,
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 8 - 0.75) * (TAU / 3)) + 1)
};

// ---- shape primitives -------------------------------------------------------
export function ell(c, x, y, rx, ry = rx, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
}
export function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
export function star(c, x, y, r, n = 5, inner = 0.5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, R = i % 2 ? r * inner : r;
    c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * R, y + Math.sin(a) * R);
  }
  c.closePath();
}
/** Star with rounded points, far friendlier than a sharp one */
export function softStar(c, x, y, r, n = 5, inner = 0.56, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, R = i % 2 ? r * inner : r;
    pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R]);
  }
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    if (!i) c.moveTo(mx, my);
    else c.quadraticCurveTo(p[0], p[1], mx, my);
  }
  const p0 = pts[0], q0 = pts[1];
  c.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2);
  c.closePath();
}
export function heart(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.92);
  c.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.72, y - s * 1.05, x, y - s * 0.32);
  c.bezierCurveTo(x + s * 0.72, y - s * 1.05, x + s * 1.5, y - s * 0.1, x, y + s * 0.92);
  c.closePath();
}
export function sparkleShape(c, x, y, r, rot = 0) {
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 2, b = a + Math.PI / 4;
    const ox = Math.cos(a) * r, oy = Math.sin(a) * r;
    const ix = Math.cos(b) * r * 0.2, iy = Math.sin(b) * r * 0.2;
    if (!i) c.moveTo(ox + x, oy + y);
    else c.lineTo(ox + x, oy + y);
    c.quadraticCurveTo(x + ix * 0.5, y + iy * 0.5, x + ix, y + iy);
  }
  c.closePath();
}
/** Catmull-Rom spline through points, closed or open */
export function spline(c, pts, closed = true, tension = 0.5, begin = true) {
  const n = pts.length;
  if (begin) c.beginPath();
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  if (begin) c.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const k = tension / 3 * 2;
    c.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) * k / 2, p1[1] + (p2[1] - p0[1]) * k / 2,
      p2[0] - (p3[0] - p1[0]) * k / 2, p2[1] - (p3[1] - p1[1]) * k / 2,
      p2[0], p2[1]
    );
  }
  if (closed) c.closePath();
}

// ---- soft toy shading ---------------------------------------------------------
/** Round volume lit from upper left: the look of a glossy vinyl toy. */
export function clay(c, x, y, r, color, ry = r) {
  const R = Math.max(r, ry);
  const g = c.createRadialGradient(x - r * 0.34, y - ry * 0.42, R * 0.06, x, y, R * 1.16);
  g.addColorStop(0, light(color, 0.42));
  g.addColorStop(0.5, color);
  g.addColorStop(1, dark(color, 0.26));
  return g;
}
export function vgrad(c, y0, y1, ...stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  return g;
}
export function hgrad(c, x0, x1, ...stops) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  return g;
}
export function gloss(c, x, y, rx, ry, a = 0.65, rot = -0.35) {
  const g = c.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  ell(c, x, y, rx, ry, rot);
  c.fill();
}
export function groundShadow(c, x, y, rx, ry = rx * 0.26, a = 0.22) {
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
  g.addColorStop(0, `rgba(58,32,96,${a})`);
  g.addColorStop(1, 'rgba(58,32,96,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, TAU);
  c.fill();
  c.restore();
}
export function glow(c, x, y, r, color, a = 0.5) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, alpha(color, a));
  g.addColorStop(0.45, alpha(color, a * 0.35));
  g.addColorStop(1, alpha(color, 0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}

// ---- sprite cache --------------------------------------------------------------
let spriteScale = 2;
const sprites = new Map();
let spriteBytes = 0;
const SPRITE_BUDGET = 150 * 1024 * 1024;

export function setSpriteScale(s) {
  if (Math.abs(s - spriteScale) > 0.01) {
    spriteScale = s;
    sprites.clear();
    spriteBytes = 0;
  }
}

/** Renders fn once at device resolution, then blits. fn draws in w*h space. */
export function sprite(key, w, h, fn, maxScale = 3) {
  let s = sprites.get(key);
  if (!s) {
    const sc = Math.min(spriteScale, maxScale);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * sc);
    cv.height = Math.ceil(h * sc);
    const x = cv.getContext('2d');
    x.scale(sc, sc);
    fn(x, w, h);
    s = { cv, w, h, used: 0, bytes: cv.width * cv.height * 4 };
    sprites.set(key, s);
    spriteBytes += s.bytes;
    if (spriteBytes > SPRITE_BUDGET) {
      const old = [...sprites.entries()].sort((a, b) => a[1].used - b[1].used);
      for (const [k, v] of old) {
        if (spriteBytes < SPRITE_BUDGET * 0.7) break;
        if (k === key) continue;
        sprites.delete(k);
        spriteBytes -= v.bytes;
        v.cv.width = v.cv.height = 0;
      }
    }
  }
  s.used = performance.now();
  return s;
}
export function drawSprite(c, s, x, y) { c.drawImage(s.cv, x, y, s.w, s.h); }
/** Draw a sprite centred at x,y with its logical size */
export function blit(c, key, x, y, w, h, fn, maxScale) {
  const s = sprite(key, w, h, fn, maxScale);
  c.drawImage(s.cv, x - w / 2, y - h / 2, w, h);
}

/** Adds very fine paper grain: stops gradients banding and gives a printed feel */
export function grain(c, w, h, a = 0.03) {
  a *= 0.6;
  const n = 128, g = document.createElement('canvas');
  g.width = g.height = n;
  const x = g.getContext('2d'), im = x.createImageData(n, n);
  for (let i = 0; i < n * n * 4; i += 4) {
    const v = Math.random() * 255;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
    im.data[i + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  c.save();
  c.globalAlpha = a;
  c.globalCompositeOperation = 'overlay';
  c.fillStyle = c.createPattern(g, 'repeat');
  c.fillRect(0, 0, w, h);
  c.restore();
}
