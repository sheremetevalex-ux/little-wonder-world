// The residents of the world. One parametric toy-like body with many species,
// so that every friend belongs to the same family and reacts in the same way.
import { P, ell, clay, light, dark, gloss, heart, softStar, TAU, alpha, sparkleShape, mix } from '../core/draw.js';

export const FRIENDS = {
  moko: { body: '#FFB3C7', belly: '#FFE9E4', ears: 'sprout', voice: 1 },
  bunny: { body: '#CDB6FF', belly: '#F2EBFF', ears: 'bunny', inner: '#FFC4DC', voice: 1.2 },
  kitty: { body: '#FFD08A', belly: '#FFF3DC', ears: 'cat', inner: '#FF9FB5', stripes: '#F2A65A', whisk: 1, voice: 1.12 },
  unicorn: { body: '#FFF7FA', belly: '#FFFFFF', ears: 'unicorn', inner: '#FFC4DC', mane: 1, voice: 1.28 },
  dragon: { body: '#7FE6BE', belly: '#E6FFD9', ears: 'dragon', wings: '#FFBE8A', voice: 0.82 },
  bear: { body: '#E8B27C', belly: '#FFE9C8', ears: 'round', inner: '#FFD3A8', snout: '#FFEFD8', voice: 0.78 },
  chick: { body: '#FFE27D', belly: '#FFF6BD', ears: 'tuft', beak: '#FF9E50', wingsSmall: 1, voice: 1.45 },
  frog: { body: '#93E47A', belly: '#E8FFC9', ears: 'frog', wide: 1, voice: 0.72 },
  penguin: { body: '#6E8BE8', belly: '#FFFFFF', ears: 'none', beak: '#FFB23E', bellyBig: 1, wingsSmall: 1, voice: 1.05 },
  piggy: { body: '#FFC2D2', belly: '#FFE3EA', ears: 'floppy', inner: '#FF9DB8', pigSnout: 1, voice: 0.92 },
  panda: { body: '#FFFFFF', belly: '#FFFFFF', ears: 'panda', patches: '#4B4560', voice: 0.86 },
  fox: { body: '#FF9E68', belly: '#FFF3E6', ears: 'fox', inner: '#FFE3CC', whisk: 1, voice: 1.1 },
  cloud: { body: '#EAF6FF', belly: '#FFFFFF', ears: 'fluff', voice: 1.34, rosy: '#FFC4DC' },
  starlet: { body: '#FFD45C', belly: '#FFEFB0', ears: 'stars', voice: 1.5 },
  jelly: { body: '#9FD8FF', belly: '#D5F0FF', ears: 'none', jelly: 1, voice: 1.22 },
  owl: { body: '#B08CE0', belly: '#EBDCFF', ears: 'tufts', beak: '#FFB23E', owlEyes: 1, voice: 0.95 },
  mouse: { body: '#C7CCE8', belly: '#F2F3FF', ears: 'mouse', inner: '#FFC4DC', whisk: 1, voice: 1.5 },
  koala: { body: '#AEBBD0', belly: '#EDF2FA', ears: 'koala', inner: '#F7E3EE', noseBig: 1, voice: 0.8 },
  bee: { body: '#FFD24D', belly: '#FFE78F', ears: 'antenna', stripes: '#5A4470', wingsBee: 1, voice: 1.38 },
  mermaid: { body: '#7FDCD8', belly: '#D4FFF4', ears: 'fins', voice: 1.18, gem: 1 },
  monster: { body: '#B07BFF', belly: '#E6D3FF', ears: 'horns', oneEye: 1, voice: 0.68 },
  sheep: { body: '#FFF9EE', belly: '#FFF9EE', ears: 'sheep', face: '#FFD9C2', voice: 0.98 },
  ladybug: { body: '#FF6F73', belly: '#FFD3C9', ears: 'antenna', spots: '#4B3260', voice: 1.32 },
  rainbow: { body: '#FFD6F0', belly: '#FFF1FB', ears: 'cat', inner: '#C7ABFF', rainbow: 1, voice: 1.25 }
};

export const FRIEND_IDS = Object.keys(FRIENDS);

// Set by portraits.js: draws the 3D version of a friend when the 3D layer is available
export const hooks = { portrait: null };

function earShape(c, spec, R, t, wob) {
  const col = spec.body;
  const fill = (x, y, rx, ry, rot = 0, color = col) => {
    c.fillStyle = clay(c, x, y, Math.max(rx, ry), color);
    ell(c, x, y, rx, ry, rot);
    c.fill();
  };
  const sway = Math.sin(t * 2.3) * 0.05 + wob * 0.16;
  switch (spec.ears) {
    case 'sprout': {
      // Moko's signature: a springy leaf
      c.save();
      c.translate(0, -R * 0.86);
      c.rotate(sway * 2.4);
      c.strokeStyle = '#5FBF72';
      c.lineWidth = R * 0.075;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(0, -R * 0.14, R * 0.03, -R * 0.26); c.stroke();
      for (const s of [-1, 1]) {
        c.save();
        c.translate(R * 0.03, -R * 0.26);
        c.rotate(s * 0.7 + sway);
        c.fillStyle = clay(c, 0, -R * 0.15, R * 0.2, s < 0 ? '#7ADB80' : '#92E58E');
        ell(c, 0, -R * 0.16, R * 0.1, R * 0.19);
        c.fill();
        c.restore();
      }
      c.restore();
      break;
    }
    case 'bunny':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.38, -R * 0.74);
        c.rotate(s * (0.16 + sway));
        fill(0, -R * 0.42, R * 0.2, R * 0.56);
        c.fillStyle = spec.inner;
        ell(c, 0, -R * 0.42, R * 0.1, R * 0.4);
        c.fill();
        c.restore();
      }
      break;
    case 'cat': case 'fox': case 'unicorn':
      for (const s of [-1, 1]) {
        const big = spec.ears === 'fox' ? 1.3 : 1;
        c.save();
        c.translate(s * R * 0.58, -R * 0.68);
        c.rotate(s * (0.4 + sway * 0.5));
        c.fillStyle = clay(c, 0, -R * 0.1, R * 0.34 * big, col);
        c.beginPath();
        c.moveTo(-R * 0.28 * big, R * 0.14);
        c.quadraticCurveTo(-R * 0.1 * big, -R * 0.42 * big, 0, -R * 0.46 * big);
        c.quadraticCurveTo(R * 0.1 * big, -R * 0.42 * big, R * 0.28 * big, R * 0.14);
        c.closePath();
        c.fill();
        c.fillStyle = spec.inner;
        c.beginPath();
        c.moveTo(-R * 0.14 * big, R * 0.08);
        c.quadraticCurveTo(0, -R * 0.42 * big, R * 0.14 * big, R * 0.08);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
    case 'round': case 'panda': case 'koala': case 'mouse': {
      const dk = spec.ears === 'panda';
      const sz = spec.ears === 'koala' ? 0.38 : spec.ears === 'mouse' ? 0.42 : 0.28;
      for (const s of [-1, 1]) {
        const x = s * R * (spec.ears === 'koala' ? 0.82 : 0.68), y = -R * (spec.ears === 'koala' ? 0.56 : 0.72) + wob * s * 2;
        fill(x, y, R * sz, R * sz, 0, dk ? spec.patches : col);
        if (spec.inner) {
          c.fillStyle = spec.inner;
          ell(c, x, y + R * 0.02, R * sz * 0.58, R * sz * 0.58);
          c.fill();
        }
      }
      break;
    }
    case 'floppy':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.62, -R * 0.68);
        c.rotate(s * (0.9 + sway));
        fill(0, -R * 0.12, R * 0.2, R * 0.27);
        c.restore();
      }
      break;
    case 'frog':
      for (const s of [-1, 1]) fill(s * R * 0.48, -R * 0.74, R * 0.3, R * 0.28);
      break;
    case 'dragon':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.42, -R * 0.82);
        c.rotate(s * 0.28);
        c.fillStyle = clay(c, 0, -R * 0.1, R * 0.2, P.butter);
        c.beginPath();
        c.moveTo(-R * 0.1, R * 0.06);
        c.quadraticCurveTo(0, -R * 0.36, R * 0.1, R * 0.06);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
    case 'horns':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.48, -R * 0.74);
        c.rotate(s * 0.34);
        c.fillStyle = clay(c, 0, -R * 0.1, R * 0.2, P.mint);
        c.beginPath();
        c.moveTo(-R * 0.12, R * 0.08);
        c.quadraticCurveTo(0, -R * 0.42, R * 0.12, R * 0.08);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
    case 'tuft':
      for (const a of [-0.4, 0, 0.4]) {
        c.save();
        c.translate(0, -R * 0.88);
        c.rotate(a + sway);
        fill(0, -R * 0.12, R * 0.06, R * 0.16);
        c.restore();
      }
      break;
    case 'tufts':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.52, -R * 0.72);
        c.rotate(s * 0.5);
        fill(0, -R * 0.14, R * 0.13, R * 0.26);
        c.restore();
      }
      break;
    case 'antenna':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.26, -R * 0.84);
        c.rotate(s * 0.3 + sway);
        c.strokeStyle = spec.spots || spec.stripes || P.ink;
        c.lineWidth = R * 0.06;
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -R * 0.3); c.stroke();
        c.fillStyle = clay(c, 0, -R * 0.34, R * 0.1, spec.spots || spec.stripes || P.ink);
        ell(c, 0, -R * 0.34, R * 0.09);
        c.fill();
        c.restore();
      }
      break;
    case 'fluff':
      for (const [x, y, r] of [[-0.56, -0.68, 0.34], [0, -0.92, 0.38], [0.56, -0.68, 0.34], [-0.92, -0.14, 0.3], [0.92, -0.14, 0.3]]) fill(x * R, y * R, r * R, r * R);
      break;
    case 'sheep':
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * TAU;
        fill(Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.84, R * 0.28, R * 0.28);
      }
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.88, -R * 0.14);
        c.rotate(s * 0.9);
        c.fillStyle = spec.face;
        ell(c, 0, 0, R * 0.14, R * 0.24);
        c.fill();
        c.restore();
      }
      break;
    case 'stars':
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 5;
        softStar(c, Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.86, R * 0.34, 3, 0.5, a - Math.PI / 2 * 0 - Math.PI);
        c.fillStyle = clay(c, 0, 0, R * 1.3, col);
        c.fill();
      }
      break;
    case 'fins':
      for (const s of [-1, 1]) {
        c.save();
        c.translate(s * R * 0.9, -R * 0.26);
        c.rotate(s * (0.9 + sway));
        fill(0, -R * 0.14, R * 0.15, R * 0.3, 0, '#FF9FD0');
        c.restore();
      }
      break;
    default:
  }
}

export function drawEyes(c, spec, R, o) {
  const kind = o.eyes || 'open';
  const lx = (o.lookX || 0) * R * 0.05, ly = (o.lookY || 0) * R * 0.05;
  const ex = spec.owlEyes ? R * 0.33 : R * 0.36, ey = spec.ears === 'frog' ? -R * 0.34 : -R * 0.06;
  const er = R * 0.145;
  const blink = o.blink || 0;
  const ink = '#3A2A57';
  const eyesAt = spec.oneEye ? [0] : [-1, 1];

  if (spec.owlEyes) {
    for (const s of eyesAt) {
      c.fillStyle = '#FFF8EA';
      ell(c, s * ex, ey, R * 0.27);
      c.fill();
    }
  }
  if (spec.oneEye) {
    c.fillStyle = '#FFFFFF';
    ell(c, 0, ey - R * 0.08, R * 0.32);
    c.fill();
  }
  c.lineCap = 'round';
  for (const s of eyesAt) {
    const x = s * ex + lx, y = ey + ly + (spec.oneEye ? -R * 0.08 : 0);
    const mul = spec.oneEye ? 1.3 : 1;
    if (kind === 'happy' || (kind === 'open' && blink > 0.8) || kind === 'closed') {
      c.strokeStyle = ink;
      c.lineWidth = R * 0.075;
      c.beginPath();
      if (kind === 'closed' || (kind === 'open' && blink > 0.8)) c.arc(x, y - er * 0.35, er * 0.95 * mul, 0.2, Math.PI - 0.2);
      else c.arc(x, y + er * 0.5, er * 0.98 * mul, Math.PI + 0.2, -0.2);
      c.stroke();
    } else if (kind === 'sour') {
      c.strokeStyle = ink;
      c.lineWidth = R * 0.075;
      c.beginPath();
      c.moveTo(x + s * er * 0.9, y - er * 0.7);
      c.lineTo(x - s * er * 0.5, y);
      c.lineTo(x + s * er * 0.9, y + er * 0.7);
      c.stroke();
    } else if (kind === 'heart') {
      heart(c, x, y, er * 1.08);
      c.fillStyle = P.rose;
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.75)';
      ell(c, x - er * 0.4, y - er * 0.35, er * 0.22, er * 0.16, -0.5);
      c.fill();
    } else if (kind === 'star') {
      softStar(c, x, y, er * 1.35);
      c.fillStyle = P.sun;
      c.fill();
    } else {
      const big = (kind === 'wow' ? 1.28 : 1) * mul;
      const ryK = 1.14 * (1 - blink * 0.85);
      const g = c.createRadialGradient(x, y + er * 0.55 * big, er * 0.1, x, y, er * 1.25 * big);
      g.addColorStop(0, spec.eyeGlow || '#6F58B8');
      g.addColorStop(0.6, '#3F2C66');
      g.addColorStop(1, '#2D1E4C');
      c.fillStyle = g;
      ell(c, x, y, er * big, er * big * ryK);
      c.fill();
      if (blink < 0.5) {
        c.fillStyle = '#FFFFFF';
        ell(c, x - er * 0.34 * big, y - er * 0.42 * big, er * 0.36 * big);
        c.fill();
        ell(c, x + er * 0.36 * big, y + er * 0.36 * big, er * 0.17 * big);
        c.fill();
      }
    }
  }
}

function drawMouth(c, spec, R, o) {
  const open = o.mouthOpen || 0;
  const my = spec.beak || spec.pigSnout || spec.snout ? R * 0.34 : R * 0.2;
  const ink = '#3A2A57';
  c.lineCap = 'round';
  const kind = open > 0.02 ? 'open' : (o.mouth || 'smile');
  if (kind === 'open') {
    const a = Math.max(open, 0.55);
    const w = R * 0.15 * (0.8 + a * 0.75), h = R * 0.27 * a;
    c.fillStyle = '#7A2F54';
    c.beginPath();
    c.ellipse(0, my + h * 0.28, w, h * 0.72, 0, 0, TAU);
    c.fill();
    c.save();
    c.clip();
    c.fillStyle = '#FF7FA2';
    ell(c, 0, my + h * 0.88, w * 0.72, h * 0.42);
    c.fill();
    c.restore();
  } else if (kind === 'o') {
    c.fillStyle = '#7A2F54';
    ell(c, 0, my + R * 0.04, R * 0.07, R * 0.09);
    c.fill();
  } else if (kind === 'chew') {
    const k = Math.sin((o.t || 0) * 22);
    c.strokeStyle = ink;
    c.lineWidth = R * 0.055;
    c.beginPath();
    c.moveTo(-R * 0.1, my + k * R * 0.02);
    c.quadraticCurveTo(0, my + R * 0.08 - k * R * 0.05, R * 0.1, my - k * R * 0.02);
    c.stroke();
  } else if (kind === 'sad') {
    c.strokeStyle = ink;
    c.lineWidth = R * 0.055;
    c.beginPath();
    c.arc(0, my + R * 0.14, R * 0.09, Math.PI + 0.5, -0.5);
    c.stroke();
  } else if (kind === 'sour') {
    c.strokeStyle = ink;
    c.lineWidth = R * 0.055;
    c.beginPath();
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const x = -R * 0.14 + (i / n) * R * 0.28;
      const y = my + R * 0.05 + (i % 2 ? -R * 0.04 : R * 0.04);
      c[i ? 'lineTo' : 'moveTo'](x, y);
    }
    c.stroke();
  } else {
    c.strokeStyle = ink;
    c.lineWidth = R * 0.055;
    c.beginPath();
    c.arc(0, my - R * 0.03, R * 0.1, 0.25, Math.PI - 0.25);
    c.stroke();
  }
}

/** Draws a friend. Origin = body centre; o: R,t,sx,sy,lookX,lookY,eyes,mouth,mouthOpen,wave,blink,wob,lean */
export function drawCreature(c, id, o = {}) {
  const spec = FRIENDS[id] || FRIENDS.moko;
  const R = o.R || 40, t = o.t || 0, wob = o.wob || 0;
  const breathe = Math.sin(t * 2.1 + (o.seed || 0)) * 0.012;
  const sx = (o.sx || 1) * (1 + breathe), sy = (o.sy || 1) * (1 - breathe);
  c.save();
  // Scale from the feet so that squashing looks like real weight
  c.translate(0, R * 0.92);
  c.rotate(o.lean || 0);
  c.scale(sx, sy);
  c.translate(0, -R * 0.92);
  if (hooks.portrait && !o.flat && hooks.portrait(c, id, o, R)) { c.restore(); return; }

  // Wings and things behind the body
  if (spec.wings) {
    for (const s of [-1, 1]) {
      c.save();
      c.translate(s * R * 0.78, -R * 0.12);
      c.rotate(s * (0.34 + Math.sin(t * 8) * 0.1));
      c.fillStyle = clay(c, s * R * 0.2, -R * 0.2, R * 0.5, spec.wings);
      c.beginPath();
      c.moveTo(0, R * 0.2);
      c.quadraticCurveTo(s * R * 0.25, -R * 0.56, s * R * 0.62, -R * 0.42);
      c.quadraticCurveTo(s * R * 0.48, -R * 0.1, s * R * 0.56, R * 0.02);
      c.quadraticCurveTo(s * R * 0.3, R * 0.02, 0, R * 0.2);
      c.fill();
      c.restore();
    }
  }
  if (spec.wingsBee) {
    for (const s of [-1, 1]) {
      c.save();
      c.translate(s * R * 0.72, -R * 0.46);
      c.rotate(s * (0.8 + Math.sin(t * 34) * 0.14));
      c.fillStyle = 'rgba(210,240,255,.78)';
      ell(c, 0, -R * 0.2, R * 0.2, R * 0.4);
      c.fill();
      c.restore();
    }
  }
  if (spec.mane) {
    const cols = ['#FF9FBF', '#FFD27D', '#9BE8C8', '#9CD3FF', '#C7ABFF'];
    cols.forEach((col, i) => {
      c.fillStyle = col;
      ell(c, -R * 0.7 + i * 0.12 * R, -R * 0.46 + i * 0.26 * R, R * 0.28, R * 0.32);
      c.fill();
    });
  }
  earShape(c, spec, R, t, wob);

  // Feet
  const walk = o.walk || 0;
  for (const s of [-1, 1]) {
    const lift = walk ? Math.max(0, Math.sin(walk + (s > 0 ? 0 : Math.PI))) * R * 0.1 : 0;
    c.fillStyle = clay(c, s * R * 0.42, R * 0.82 - lift, R * 0.28, spec.feet || dark(spec.body, 0.1));
    ell(c, s * R * 0.42, R * 0.84 - lift, R * 0.27, R * 0.16);
    c.fill();
  }

  // Body
  const bw = R * (spec.wide ? 1.12 : 1), bh = R * 0.97;
  c.fillStyle = clay(c, 0, 0, bw, spec.body, bh);
  c.beginPath();
  if (spec.jelly) {
    c.moveTo(-bw, R * 0.1);
    c.bezierCurveTo(-bw, -bh * 1.3, bw, -bh * 1.3, bw, R * 0.1);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x0 = bw - (i * 2 * bw) / n, x1 = bw - ((i + 1) * 2 * bw) / n;
      const lift = R * 0.86 + Math.sin(t * 3 + i) * R * 0.08;
      c.quadraticCurveTo((x0 + x1) / 2, lift, x1, R * 0.28);
    }
  } else c.ellipse(0, 0, bw, bh, 0, 0, TAU);
  c.fill();

  // Soft rim light along the lower edge: this is what sells the "toy" volume
  c.save();
  c.clip();
  if (spec.rainbow) {
    ['#FF9FBF', '#FFD27D', '#9BE8C8', '#9CD3FF', '#C7ABFF'].forEach((col, i) => {
      c.strokeStyle = alpha(col, 0.75);
      c.lineWidth = R * 0.14;
      c.beginPath();
      c.arc(0, R * 1.05, R * (1.65 - i * 0.14), Math.PI, TAU);
      c.stroke();
    });
  }
  if (spec.stripes) {
    c.fillStyle = spec.ears === 'antenna' ? spec.stripes : alpha(spec.stripes, 0.75);
    if (spec.ears === 'antenna') {
      for (const y of [0.32, 0.64]) {
        c.beginPath();
        c.rect(-bw, y * R, bw * 2, R * 0.15);
        c.fill();
      }
    } else {
      for (const s of [-1, 1]) {
        for (const y of [-0.52, -0.24, 0.04]) {
          ell(c, s * R * 0.92, y * R, R * 0.2, R * 0.05, s * 0.2);
          c.fill();
        }
      }
    }
  }
  if (spec.spots) {
    c.fillStyle = spec.spots;
    for (const [x, y, r] of [[-0.66, -0.42, 0.13], [0.66, -0.42, 0.13], [-0.72, 0.28, 0.12], [0.72, 0.28, 0.12]]) {
      ell(c, x * R, y * R, r * R);
      c.fill();
    }
  }
  // Belly
  if (spec.ears !== 'sheep') {
    c.fillStyle = spec.belly;
    const by = spec.bellyBig ? R * 0.2 : R * 0.48, brx = spec.bellyBig ? R * 0.78 : R * 0.6, bry = spec.bellyBig ? R * 0.82 : R * 0.54;
    ell(c, 0, by, brx, bry);
    c.fill();
  } else {
    c.fillStyle = spec.face;
    ell(c, 0, R * 0.1, R * 0.66, R * 0.68);
    c.fill();
  }
  // Under-shading
  const rim = c.createLinearGradient(0, R * 0.25, 0, R);
  rim.addColorStop(0, 'rgba(90,50,130,0)');
  rim.addColorStop(1, 'rgba(90,50,130,.18)');
  c.fillStyle = rim;
  c.fillRect(-R * 1.3, R * 0.25, R * 2.6, R);
  c.restore();

  gloss(c, -R * 0.34, -R * 0.56, R * 0.42, R * 0.24, 0.62);

  // Face
  if (spec.patches) {
    c.fillStyle = spec.patches;
    for (const s of [-1, 1]) {
      ell(c, s * R * 0.38, -R * 0.04, R * 0.24, R * 0.27, s * 0.45);
      c.fill();
    }
  }
  const blushCol = spec.rosy || '#FF7FA8';
  c.fillStyle = alpha(blushCol, 0.42 + (o.blush || 0) * 0.4);
  for (const s of [-1, 1]) {
    ell(c, s * R * 0.6, R * 0.18, R * 0.15, R * 0.095);
    c.fill();
  }
  if (spec.whisk) {
    c.strokeStyle = alpha('#3A2A57', 0.28);
    c.lineWidth = R * 0.028;
    c.lineCap = 'round';
    for (const s of [-1, 1]) {
      for (const dy of [-0.05, 0.05]) {
        c.beginPath();
        c.moveTo(s * R * 0.72, R * (0.03 + dy));
        c.lineTo(s * R * 1.0, R * (0.0 + dy * 2.2));
        c.stroke();
      }
    }
  }
  drawEyes(c, spec, R, { ...o, t });
  if (spec.snout) {
    c.fillStyle = spec.snout;
    ell(c, 0, R * 0.25, R * 0.28, R * 0.22);
    c.fill();
    c.fillStyle = '#5C3F59';
    ell(c, 0, R * 0.16, R * 0.08, R * 0.055);
    c.fill();
  }
  if (spec.noseBig) {
    c.fillStyle = clay(c, 0, R * 0.11, R * 0.15, '#6E6A86');
    ell(c, 0, R * 0.12, R * 0.12, R * 0.15);
    c.fill();
  }
  if (spec.pigSnout) {
    c.fillStyle = clay(c, 0, R * 0.17, R * 0.24, '#FFA6BE');
    ell(c, 0, R * 0.19, R * 0.22, R * 0.15);
    c.fill();
    c.fillStyle = '#C96E8F';
    for (const s of [-1, 1]) {
      ell(c, s * R * 0.08, R * 0.19, R * 0.035, R * 0.05);
      c.fill();
    }
  }
  if (spec.gem) {
    softStar(c, 0, -R * 0.56, R * 0.12, 4, 0.55);
    c.fillStyle = '#FFD45C';
    c.fill();
  }
  drawMouth(c, spec, R, { ...o, t });
  if (spec.beak) {
    c.fillStyle = clay(c, 0, R * 0.17, R * 0.14, spec.beak);
    c.beginPath();
    c.moveTo(-R * 0.13, R * 0.1);
    c.quadraticCurveTo(0, R * 0.04, R * 0.13, R * 0.1);
    c.quadraticCurveTo(0, R * (0.28 + (o.mouthOpen || 0) * 0.12), -R * 0.13, R * 0.1);
    c.fill();
  }
  if (spec.ears === 'unicorn') {
    // Golden horn drawn over the head
    c.save();
    c.translate(0, -R * 0.86);
    const hg = c.createLinearGradient(-R * 0.1, 0, R * 0.1, -R * 0.4);
    hg.addColorStop(0, '#FFC233');
    hg.addColorStop(1, '#FFE99B');
    c.fillStyle = hg;
    c.beginPath();
    c.moveTo(-R * 0.13, R * 0.1);
    c.quadraticCurveTo(-R * 0.03, -R * 0.26, 0, -R * 0.48);
    c.quadraticCurveTo(R * 0.03, -R * 0.26, R * 0.13, R * 0.1);
    c.closePath();
    c.fill();
    c.restore();
  }

  // Arms, on top of the body, can wave hello
  const wave = o.wave || 0;
  const armC = spec.arms || mix(spec.body, '#3A2060', 0.06);
  for (const s of [-1, 1]) {
    c.save();
    c.translate(s * R * 0.84, R * 0.24);
    const raise = s > 0 ? wave : (o.waveBoth ? wave : 0);
    c.rotate(s * (0.3 - raise * (2.0 + Math.sin(t * 13) * 0.3)));
    c.fillStyle = clay(c, 0, R * 0.12, R * 0.2, armC);
    const w = spec.wingsSmall ? 0.2 : 0.15;
    ell(c, 0, R * 0.14, R * w, R * 0.26);
    c.fill();
    c.restore();
  }

  // Hatched twice: she has earned a golden crown and a little sparkle
  if (o.shiny) {
    c.save();
    c.translate(0, -R * 1.02);
    const w = R * 0.42, h = R * 0.36;
    c.fillStyle = clay(c, 0, -h * 0.4, w, '#FFC233');
    c.beginPath();
    c.moveTo(-w, 0);
    c.lineTo(-w * 1.08, -h);
    c.lineTo(-w * 0.45, -h * 0.5);
    c.lineTo(0, -h * 1.2);
    c.lineTo(w * 0.45, -h * 0.5);
    c.lineTo(w * 1.08, -h);
    c.lineTo(w, 0);
    c.quadraticCurveTo(0, h * 0.25, -w, 0);
    c.closePath();
    c.fill();
    c.fillStyle = P.rose;
    ell(c, 0, -h * 0.22, R * 0.06);
    c.fill();
    c.restore();
    for (let i = 0; i < 3; i++) {
      const a = t * 0.7 + i * 2.09, k = 0.5 + 0.5 * Math.sin(t * 4 + i * 2);
      sparkleShape(c, Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.05, R * 0.14 * k);
      c.fillStyle = '#FFE680';
      c.fill();
    }
  }

  if (o.sparkly) {
    for (let i = 0; i < 4; i++) {
      const a = t * 0.8 + i * 1.57, k = 0.5 + 0.5 * Math.sin(t * 5 + i * 2);
      sparkleShape(c, Math.cos(a) * R * 1.16, Math.sin(a) * R * 1.05, R * 0.15 * k);
      c.fillStyle = '#FFF6B0';
      c.fill();
    }
  }
  c.restore();
}

/** Blink timing shared by all friends. Returns 0..1 (1 = shut). */
export function blinkAt(t, seed = 0) {
  const p = (t + seed * 2.31) % (3.2 + (seed % 3) * 0.7);
  return p < 0.14 ? Math.sin((p / 0.14) * Math.PI) : 0;
}
