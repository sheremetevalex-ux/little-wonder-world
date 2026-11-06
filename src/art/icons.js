// Hand-drawn illustrations for the eight worlds in the main bubbles. Drawn in a
// roughly 100x100 box around the origin; no text anywhere, the picture says it all.
import { P, ell, rr, clay, light, dark, gloss, vgrad, hgrad, softStar, heart, sparkleShape, TAU, spline, alpha } from '../core/draw.js';
import { drawCreature } from './creatures.js';

export const ICONS = {
  dress(c) {
    // A ball gown on a stand
    c.translate(0, -5);
    c.scale(0.92, 0.92);
    c.fillStyle = vgrad(c, -6, 44, '#FF9CC4', '#F2548F');
    c.beginPath();
    c.moveTo(-11, -8);
    c.bezierCurveTo(-18, 12, -36, 26, -37, 42);
    c.quadraticCurveTo(-18, 52, 0, 47);
    c.quadraticCurveTo(18, 52, 37, 42);
    c.bezierCurveTo(36, 26, 18, 12, 11, -8);
    c.closePath();
    c.fill();
    // Folds
    c.strokeStyle = 'rgba(180,30,100,.25)';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 7, 4);
      c.quadraticCurveTo(s * 13, 24, s * 21, 40);
      c.stroke();
    }
    // Lace hem
    c.fillStyle = '#FFF3F8';
    for (let i = 0; i < 7; i++) {
      ell(c, -30 + i * 10, 44 + Math.abs(i - 3) * -0.8, 6.5, 5.5);
      c.fill();
    }
    // Bodice
    c.fillStyle = clay(c, 0, -18, 16, '#FF7DAE');
    c.beginPath();
    c.moveTo(-12, -8);
    c.quadraticCurveTo(-14, -22, -13, -32);
    c.quadraticCurveTo(-6, -27, 0, -29);
    c.quadraticCurveTo(6, -27, 13, -32);
    c.quadraticCurveTo(14, -22, 12, -8);
    c.closePath();
    c.fill();
    c.fillStyle = P.sun;
    rr(c, -13, -12, 26, 6, 3);
    c.fill();
    softStar(c, 0, -9, 6);
    c.fillStyle = '#FFF2A8';
    c.fill();
    sparkleShape(c, 27, -24, 10);
    c.fillStyle = '#FFF4B0';
    c.fill();
    sparkleShape(c, -28, 6, 6);
    c.fill();
  },
  pet(c, t) {
    c.translate(0, 6);
    drawCreature(c, 'bunny', { R: 31, t, eyes: 'open', mouth: 'smile' });
    // Bath bubbles
    for (const [x, y, r] of [[30, -26, 7], [-35, 14, 5], [37, 6, 4]]) {
      c.fillStyle = 'rgba(255,255,255,.75)';
      ell(c, x, y, r);
      c.fill();
    }
  },
  cake(c) {
    // Two-tier cake with dripping icing
    c.fillStyle = 'rgba(58,32,96,.15)';
    ell(c, 0, 44, 40, 7);
    c.fill();
    c.fillStyle = '#FFFFFF';
    ell(c, 0, 41, 41, 8);
    c.fill();
    c.fillStyle = hgrad(c, -32, 32, '#FFD7A8', '#F2AC6E');
    rr(c, -32, 12, 64, 29, 8);
    c.fill();
    c.fillStyle = hgrad(c, -22, 22, '#FFE0B8', '#F6B87E');
    rr(c, -22, -14, 44, 27, 7);
    c.fill();
    const icing = (w, y, drips) => {
      c.fillStyle = '#FF8DB8';
      c.beginPath();
      c.moveTo(-w, y);
      c.quadraticCurveTo(-w, y - 7, -w + 8, y - 7);
      c.lineTo(w - 8, y - 7);
      c.quadraticCurveTo(w, y - 7, w, y);
      for (let i = 0; i < drips; i++) {
        const x1 = w - (2 * w * i) / drips, x2 = w - (2 * w * (i + 1)) / drips;
        c.quadraticCurveTo((x1 + x2) / 2, y + (i % 2 ? 7 : 13), x2, y);
      }
      c.closePath();
      c.fill();
    };
    icing(33, 18, 7);
    icing(23, -8, 5);
    const sp = ['#FFF', P.butter, P.sky, P.mint];
    for (let i = 0; i < 10; i++) {
      c.fillStyle = sp[i % 4];
      rr(c, -25 + (i * 53) / 10, 31 + (i % 3) * 3, 3, 3, 1.5);
      c.fill();
    }
    // Candle
    c.fillStyle = '#7CCBFF';
    rr(c, -3, -30, 6, 18, 2);
    c.fill();
    c.fillStyle = '#FFD45C';
    ell(c, 0, -37, 4.5, 7);
    c.fill();
    c.fillStyle = '#FFF4C0';
    ell(c, 0, -35, 2, 3.5);
    c.fill();
  },
  popit(c) {
    // A rainbow silicone toy
    const rows = ['#FF7F9F', '#FFB65C', '#FFE066', '#7FE3A0', '#6FC6FF'];
    c.save();
    rr(c, -38, -38, 76, 76, 20);
    c.clip();
    rows.forEach((col, i) => {
      c.fillStyle = col;
      c.fillRect(-40, -40 + (i * 80) / 5, 80, 17);
    });
    c.restore();
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const px = -23 + x * 23, py = -23 + y * 23, col = rows[[0, 2, 4][y]];
        const pressed = (x === 2 && y === 0) || (x === 0 && y === 1);
        c.fillStyle = pressed ? dark(col, 0.2) : clay(c, px, py, 10, light(col, 0.12));
        ell(c, px, py, 9.6);
        c.fill();
        if (!pressed) gloss(c, px - 3, py - 4, 4.6, 3, 0.85);
      }
    }
  },
  slime(c) {
    // A shiny dollop with glitter, dripping off a jar rim
    c.fillStyle = '#FFFFFF';
    c.globalAlpha = 0.55;
    rr(c, -32, -2, 64, 44, 15);
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = vgrad(c, -40, 42, '#C7F75E', '#2FD6A8');
    spline(c, [[-40, 4], [-34, -22], [-12, -40], [14, -38], [34, -22], [41, 4], [36, 26], [30, 12], [22, 8], [15, 33], [6, 12], [-8, 10], [-16, 26], [-24, 8], [-33, 16]]);
    c.fill();
    gloss(c, -14, -24, 18, 9, 0.95);
    gloss(c, 22, -8, 6, 10, 0.5, 0);
    [[P.rose, -18, -6], [P.white, 2, -18], [P.sun, 18, 2], [P.violet, 0, 2], [P.white, -28, 2], [P.sky, 26, -14]].forEach(([col, x, y]) => {
      softStar(c, x, y, 4.3);
      c.fillStyle = col;
      c.fill();
    });
  },
  paint(c) {
    // Glowing rainbow brush stroke
    c.lineCap = 'round';
    const cols = ['#FF6F91', '#FFB84D', '#FFE45C', '#6FE3A5', '#61BFFF', '#A985FF'];
    cols.forEach((col, i) => {
      c.strokeStyle = col;
      c.lineWidth = 7.5;
      c.beginPath();
      const r = 38 - i * 7;
      c.arc(-3, 16, r, Math.PI * 1.04, Math.PI * 1.9);
      c.stroke();
    });
    // The brush
    c.save();
    c.translate(21, 8);
    c.rotate(0.62);
    c.fillStyle = hgrad(c, -4, 4, '#FFC680', '#E08C47');
    rr(c, -4.5, -3, 9, 37, 4);
    c.fill();
    c.fillStyle = '#C7CCE8';
    rr(c, -5.5, -10, 11, 10, 2);
    c.fill();
    c.fillStyle = '#A985FF';
    c.beginPath();
    c.moveTo(-5.5, -9);
    c.quadraticCurveTo(-8, -20, 0, -30);
    c.quadraticCurveTo(8, -20, 5.5, -9);
    c.closePath();
    c.fill();
    c.restore();
  },
  garden(c, t) {
    // A singing flower
    const sw = Math.sin((t || 0) * 2.2) * 0.05;
    c.save();
    c.translate(-2, 42);
    c.rotate(sw);
    c.strokeStyle = '#4DBE6A';
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-2, -22, 0, -42);
    c.stroke();
    for (const s of [-1, 1]) {
      c.fillStyle = clay(c, s * 14, -18, 14, '#7ADB80');
      ell(c, s * 14, -16, 15, 7, s * -0.5);
      c.fill();
    }
    c.translate(0, -56);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      c.fillStyle = clay(c, Math.cos(a) * 20, Math.sin(a) * 20, 13, i % 2 ? '#FF9FC3' : '#FF82AF');
      ell(c, Math.cos(a) * 20, Math.sin(a) * 20, 12.5);
      c.fill();
    }
    c.fillStyle = clay(c, 0, 0, 15, '#FFD45C');
    ell(c, 0, 0, 15.5);
    c.fill();
    c.strokeStyle = '#7A4A1E';
    c.lineWidth = 2.3;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(s * 5.5, -1, 2.8, Math.PI + 0.2, -0.2);
      c.stroke();
    }
    c.fillStyle = '#C24A63';
    ell(c, 0, 6, 3.6, 4.6);
    c.fill();
    c.restore();
    // Musical note
    c.fillStyle = '#7C5AE6';
    c.strokeStyle = '#7C5AE6';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(33, -6);
    c.lineTo(33, -30);
    c.lineTo(42, -26);
    c.stroke();
    ell(c, 28.5, -6, 5, 4, -0.3);
    c.fill();
  },
  balloon(c, t) {
    // Hot-air balloon over a tiny cloud
    const bob = Math.sin((t || 0) * 1.7) * 2;
    c.save();
    c.translate(0, bob);
    c.strokeStyle = '#9B6B3F';
    c.lineWidth = 1.8;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * 20, 3);
      c.lineTo(s * 8, 22);
      c.stroke();
    }
    c.save();
    c.beginPath();
    c.moveTo(0, 14);
    c.bezierCurveTo(-46, -10, -30, -44, 0, -44);
    c.bezierCurveTo(30, -44, 46, -10, 0, 14);
    c.clip();
    const cols = ['#FF7F9F', '#FFE066', '#6FC6FF', '#7FE3A0', '#C7ABFF'];
    for (let i = 0; i < 7; i++) {
      c.fillStyle = cols[i % 5];
      c.fillRect(-44 + (i * 88) / 7, -48, 13, 66);
    }
    c.fillStyle = 'rgba(255,255,255,.2)';
    ell(c, -13, -26, 18, 16);
    c.fill();
    c.fillStyle = 'rgba(80,30,110,.14)';
    c.fillRect(-46, -2, 92, 18);
    c.restore();
    c.fillStyle = clay(c, 0, 28, 12, '#D98F56');
    rr(c, -9, 22, 18, 14, 4);
    c.fill();
    c.restore();
    c.fillStyle = '#fff';
    for (const [x, y, r] of [[-27, 39, 8], [-17, 35, 10], [-7, 41, 7], [26, 26, 6], [34, 24, 7], [41, 28, 5]]) {
      ell(c, x, y, r);
      c.fill();
    }
  }
};
