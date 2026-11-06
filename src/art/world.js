// Scenery: skies by time of day, hills, clouds, flowers.
import { P, sprite, drawSprite, grain, ell, vgrad, glow, gloss, TAU, rand, alpha, light, dark, clay, softStar, mix } from '../core/draw.js';

export const SKIES = {
  day: { top: '#6EBBFF', mid: '#A9DEFF', low: '#FFF0D6', hillA: '#BCEFA0', hillB: '#8FE292', hillC: '#62CE82', far: '#BBD9F5' },
  sunset: { top: '#7A6BE0', mid: '#F596BE', low: '#FFD59B', hillA: '#DDB6DE', hillB: '#AE9BDD', hillC: '#8877CF', far: '#C89DDC' },
  night: { top: '#17144A', mid: '#3A2C86', low: '#7A4FA6', hillA: '#3C4090', hillB: '#2D3380', hillC: '#232870', far: '#2E2A74' }
};

export function skyByClock() {
  const h = new Date().getHours();
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'sunset';
  return 'night';
}

function hillPath(c, W, H, y, amp, freq, phase) {
  c.beginPath();
  c.moveTo(0, H);
  c.lineTo(0, y);
  for (let x = 0; x <= W + 8; x += 8) {
    c.lineTo(x, y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.22);
  }
  c.lineTo(W, H);
  c.closePath();
}

let seedVal = 12345;
const srand = () => { seedVal = (seedVal * 16807) % 2147483647; return seedVal / 2147483647; };

/** Full-screen scenery. horizon = y of the meadow top. */
export function worldSprite(W, H, mode, horizon) {
  return sprite(`world:${mode}:${W | 0}:${H | 0}:${horizon | 0}`, W, H, (c) => {
    const S = SKIES[mode];
    seedVal = 4242;
    c.fillStyle = vgrad(c, 0, horizon + 40, S.top, S.mid, S.low);
    c.fillRect(0, 0, W, H);

    if (mode === 'night') {
      for (let i = 0; i < 90; i++) {
        const x = srand() * W, y = srand() * horizon * 0.95, r = 0.4 + srand() * 1.5;
        c.fillStyle = `rgba(255,250,220,${0.25 + srand() * 0.7})`;
        ell(c, x, y, r);
        c.fill();
      }
    }
    // Soft haze on the horizon
    const hz = c.createLinearGradient(0, horizon - 120, 0, horizon + 20);
    hz.addColorStop(0, alpha(S.low, 0));
    hz.addColorStop(1, alpha(S.low, 0.75));
    c.fillStyle = hz;
    c.fillRect(0, horizon - 120, W, 140);

    // Distant round mountains
    c.fillStyle = vgrad(c, horizon - 70, horizon + 30, S.far, mix(S.far, S.hillA, 0.5));
    hillPath(c, W, H, horizon - 34, 24, 0.016, 1.1);
    c.fill();

    c.fillStyle = vgrad(c, horizon - 30, horizon + 120, light(S.hillA, 0.12), S.hillB);
    hillPath(c, W, H, horizon - 6, 16, 0.012, 3.1);
    c.fill();

    c.fillStyle = vgrad(c, horizon + 30, H, light(S.hillB, 0.08), S.hillC);
    hillPath(c, W, H, horizon + 42, 14, 0.009, 0.6);
    c.fill();

    // Tufts of grass and tiny flowers scattered on the meadow
    const tuft = dark(S.hillC, 0.1);
    c.lineCap = 'round';
    for (let i = 0; i < W * 0.3; i++) {
      const x = srand() * W, y = horizon + 40 + srand() * (H - horizon - 40);
      c.strokeStyle = alpha(tuft, 0.35);
      c.lineWidth = 1.6;
      for (const dx of [-3, 0, 3]) {
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + dx * 0.4, y - 5, x + dx, y - 8);
        c.stroke();
      }
    }
    const flowerCols = mode === 'night' ? ['#B8A6FF', '#8FD0FF', '#FFC4E8'] : ['#FFFFFF', '#FFD24D', '#FF9FBF', '#C7ABFF'];
    for (let i = 0; i < W * 0.16; i++) {
      const x = srand() * W, y = horizon + 50 + srand() * (H - horizon - 50), col = flowerCols[(srand() * flowerCols.length) | 0];
      c.fillStyle = col;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        ell(c, x + Math.cos(a) * 2.3, y + Math.sin(a) * 2.3, 1.7);
        c.fill();
      }
      c.fillStyle = '#FFC233';
      ell(c, x, y, 1.3);
      c.fill();
    }
    grain(c, W, H, 0.05);
  }, 2);
}

export function drawCloud(c, x, y, s, a = 1, night = false) {
  const key = night ? 'cloudN' : 'cloudD';
  const spr = sprite(key, 180, 100, (cx) => {
    const top = night ? '#6C60B8' : '#FFFFFF', bot = night ? '#3E347F' : '#D8ECFF';
    cx.fillStyle = vgrad(cx, 18, 88, top, bot);
    for (const [px, py, r] of [[42, 62, 26], [76, 46, 33], [112, 50, 29], [142, 66, 22], [90, 72, 30], [60, 74, 22], [122, 75, 20]]) {
      ell(cx, px, py, r);
      cx.fill();
    }
  }, 2);
  c.save();
  c.globalAlpha = a;
  c.drawImage(spr.cv, x - 90 * s, y - 50 * s, 180 * s, 100 * s);
  c.restore();
}

export function drawSun(c, x, y, r, t, press = 0) {
  glow(c, x, y, r * 2.8, '#FFE9A0', 0.75);
  c.save();
  c.translate(x, y);
  c.rotate(t * 0.15);
  for (let i = 0; i < 12; i++) {
    c.rotate(TAU / 12);
    c.fillStyle = '#FFD45C';
    ell(c, 0, -r * (1.32 + 0.06 * Math.sin(t * 2 + i)), r * 0.09, r * 0.2);
    c.fill();
  }
  c.restore();
  c.fillStyle = clay(c, x, y, r, '#FFCB45');
  ell(c, x, y, r);
  c.fill();
  // A friendly face
  c.lineCap = 'round';
  c.strokeStyle = '#B36A1E';
  c.lineWidth = r * 0.08;
  for (const s of [-1, 1]) {
    c.beginPath();
    if (press > 0.3) c.arc(x + s * r * 0.34, y - r * 0.02, r * 0.14, Math.PI + 0.2, -0.2);
    else c.arc(x + s * r * 0.34, y - r * 0.14, r * 0.13, 0.2, Math.PI - 0.2);
    c.stroke();
  }
  c.beginPath();
  c.arc(x, y + r * 0.14, r * (press > 0.3 ? 0.26 : 0.18), 0.2, Math.PI - 0.2);
  c.stroke();
  c.fillStyle = 'rgba(255,120,120,.4)';
  for (const s of [-1, 1]) {
    ell(c, x + s * r * 0.62, y + r * 0.2, r * 0.17, r * 0.1);
    c.fill();
  }
}

export function drawMoon(c, x, y, r, t) {
  glow(c, x, y, r * 2.8, '#CFC4FF', 0.55);
  c.fillStyle = clay(c, x, y, r, '#FFF3C4');
  ell(c, x, y, r);
  c.fill();
  c.fillStyle = 'rgba(214,190,130,.35)';
  for (const [dx, dy, s] of [[-0.42, -0.4, 0.18], [0.45, 0.34, 0.14], [0.36, -0.5, 0.09]]) {
    ell(c, x + dx * r, y + dy * r, s * r);
    c.fill();
  }
  c.lineCap = 'round';
  c.strokeStyle = '#9B8850';
  c.lineWidth = r * 0.07;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(x + s * r * 0.34, y - r * 0.08, r * 0.13, 0.2, Math.PI - 0.2);
    c.stroke();
  }
  c.beginPath();
  c.arc(x, y + r * 0.2, r * 0.13, 0.3, Math.PI - 0.3);
  c.stroke();
}

/** A clean pastel backdrop for activities: gradient + soft shapes + grain. */
export function softBack(key, W, H, top, bottom, paint) {
  return sprite(`back:${key}:${W | 0}:${H | 0}`, W, H, (c) => {
    c.fillStyle = vgrad(c, 0, H, top, bottom);
    c.fillRect(0, 0, W, H);
    if (paint) paint(c, W, H);
    grain(c, W, H, 0.05);
  }, 2);
}

export function drawStarPickup(c, x, y, r, rot = 0, col = '#FFC233') {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  softStar(c, 0, 0, r);
  c.fillStyle = clay(c, 0, 0, r, col);
  c.fill();
  c.lineWidth = r * 0.12;
  c.strokeStyle = 'rgba(255,255,255,.75)';
  c.stroke();
  gloss(c, -r * 0.25, -r * 0.35, r * 0.34, r * 0.2, 0.7);
  c.restore();
}
