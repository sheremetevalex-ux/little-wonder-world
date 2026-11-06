// The paper-doll. Chibi vinyl proportions, layered parts, every garment recolourable.
// Doll space: head centre near (0,-92), feet near (0,112).
import { P, ell, rr, clay, light, dark, gloss, vgrad, hgrad, softStar, heart, sparkleShape, TAU, alpha, mix, spline, rand } from '../core/draw.js';

export const SKINS = ['#FFE4D2', '#FBD3B6', '#F0BE96', '#D99D70', '#AC724C', '#7E5137'];
export const EYES = ['#7B5BDE', '#3E8FE0', '#2FAE8E', '#8A5A33', '#E0589A', '#3A2A57'];
const RAINBOW = ['#FF7F9F', '#FFB65C', '#FFE066', '#7FE3A0', '#6FC6FF', '#B48BFF'];

/** Cloth shading: a garment is a soft cylinder, lit from the left. */
function cloth(c, x0, x1, col) {
  return hgrad(c, x0, x1, dark(col, 0.2), light(col, 0.26), col, dark(col, 0.26));
}
function hairFill(c, top, bot, col) {
  if (col === 'rainbow') {
    const g = c.createLinearGradient(0, top, 0, bot);
    RAINBOW.forEach((k, i) => g.addColorStop(i / 5, k));
    return g;
  }
  return vgrad(c, top, bot, light(col, 0.2), col, dark(col, 0.24));
}
const baseCol = (col) => (col === 'rainbow' ? '#FF8FC4' : col);

// ---- HAIR --------------------------------------------------------------------------
function bangs(c, col, kind = 'side') {
  c.fillStyle = hairFill(c, -152, -60, col);
  c.beginPath();
  if (kind === 'side') {
    c.moveTo(-59, -90);
    c.bezierCurveTo(-68, -160, 62, -162, 60, -86);
    c.bezierCurveTo(50, -110, 34, -122, 14, -127);
    c.bezierCurveTo(-6, -118, -36, -116, -59, -90);
  } else if (kind === 'fringe') {
    c.moveTo(-59, -88);
    c.bezierCurveTo(-70, -162, 70, -162, 59, -88);
    c.quadraticCurveTo(48, -112, 38, -108);
    c.quadraticCurveTo(26, -120, 14, -110);
    c.quadraticCurveTo(0, -122, -14, -110);
    c.quadraticCurveTo(-26, -120, -38, -108);
    c.quadraticCurveTo(-48, -112, -59, -88);
  } else {
    // middle parting
    c.moveTo(-60, -80);
    c.bezierCurveTo(-68, -160, 68, -160, 60, -80);
    c.bezierCurveTo(50, -108, 26, -122, 0, -130);
    c.bezierCurveTo(-26, -122, -50, -108, -60, -80);
  }
  c.closePath();
  c.fill();
  shine(c, -18, -128, 30, col);
}
function shine(c, x, y, w, col) {
  c.save();
  c.lineCap = 'round';
  c.lineWidth = 6.5;
  c.strokeStyle = 'rgba(255,255,255,.42)';
  c.beginPath();
  c.moveTo(x - w * 0.6, y + 6);
  c.quadraticCurveTo(x, y - 7, x + w * 0.6, y);
  c.stroke();
  c.restore();
}
function lock(c, pts, w0, col, top, bot) {
  c.fillStyle = hairFill(c, top, bot, col);
  c.beginPath();
  const left = [], right = [];
  pts.forEach((p, i) => {
    const w = w0 * (1 - (i / (pts.length - 1)) * 0.72);
    left.push([p[0] - w, p[1]]);
    right.unshift([p[0] + w, p[1]]);
  });
  spline(c, [...left, ...right]);
  c.fill();
}

export const HAIR = {
  long: {
    back(c, col, s) {
      c.fillStyle = hairFill(c, -150, 42, col);
      c.beginPath();
      c.moveTo(-64, -90);
      c.bezierCurveTo(-72, -170, 72, -170, 64, -90);
      c.bezierCurveTo(74, -30, 66 + s * 3, 18, 56 + s * 6, 44);
      c.quadraticCurveTo(30 + s * 5, 54, 0, 46);
      c.quadraticCurveTo(-30 + s * 5, 54, -56 + s * 6, 44);
      c.bezierCurveTo(-66 + s * 3, 18, -74, -30, -64, -90);
      c.fill();
    },
    front: (c, col) => bangs(c, col, 'mid')
  },
  waves: {
    back(c, col, s) {
      c.fillStyle = hairFill(c, -150, 60, col);
      c.beginPath();
      c.moveTo(-64, -92);
      c.bezierCurveTo(-70, -170, 70, -170, 64, -92);
      const edge = [[74, -50], [64, -22], [78, 6], [64 + s * 3, 32], [68 + s * 5, 56], [38 + s * 6, 64], [10, 50], [-12, 62], [-40 + s * 6, 58], [-68 + s * 5, 54], [-64 + s * 3, 30], [-78, 6], [-64, -22], [-74, -50]];
      let prev = [64, -92];
      edge.forEach((q, i) => {
        const nx = edge[i + 1] || [-64, -92];
        c.quadraticCurveTo(q[0], q[1], (q[0] + nx[0]) / 2, (q[1] + nx[1]) / 2);
        prev = q;
      });
      c.closePath();
      c.fill();
    },
    front: (c, col) => bangs(c, col, 'side')
  },
  buns: {
    back(c, col) {
      c.fillStyle = hairFill(c, -150, -40, col);
      ell(c, 0, -94, 64, 64);
      c.fill();
    },
    top(c, col, s) {
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 46, -146, 26, baseCol(col));
        ell(c, k * 46, -146 + s * k, 25);
        c.fill();
        gloss(c, k * 46 - 8, -155, 9, 5, 0.6);
      }
    },
    front: (c, col) => bangs(c, col, 'fringe')
  },
  pigtails: {
    back(c, col, s) {
      c.fillStyle = hairFill(c, -150, -40, col);
      ell(c, 0, -94, 63, 62);
      c.fill();
      for (const k of [-1, 1]) {
        lock(c, [[k * 56, -112], [k * 86, -84], [k * 94 + s * 2, -40], [k * 84 + s * 4, 0], [k * 88 + s * 6, 26]], 21, col, -110, 30);
      }
    },
    top(c, col) {
      for (const k of [-1, 1]) {
        c.fillStyle = P.rose;
        ell(c, k * 58, -112, 8);
        c.fill();
      }
    },
    front: (c, col) => bangs(c, col, 'fringe')
  },
  bob: {
    back(c, col) {
      c.fillStyle = hairFill(c, -150, -30, col);
      c.beginPath();
      c.moveTo(-68, -80);
      c.bezierCurveTo(-74, -172, 74, -172, 68, -80);
      c.bezierCurveTo(70, -56, 62, -40, 50, -36);
      c.lineTo(-50, -36);
      c.bezierCurveTo(-62, -40, -70, -56, -68, -80);
      c.fill();
    },
    front: (c, col) => bangs(c, col, 'fringe')
  },
  curls: {
    back(c, col) {
      const k = baseCol(col);
      const pts = [[-66, -116, 28], [-40, -148, 30], [0, -158, 32], [40, -148, 30], [66, -116, 28], [80, -80, 28], [80, -44, 25], [-80, -80, 28], [-80, -44, 25], [62, -18, 22], [-62, -18, 22], [0, -92, 60]];
      pts.forEach(([x, y, r], i) => {
        c.fillStyle = col === 'rainbow' ? clay(c, x, y, r, RAINBOW[i % 6]) : clay(c, x, y, r, k);
        ell(c, x, y, r);
        c.fill();
      });
    },
    front(c, col) {
      const k = baseCol(col);
      [[-40, -128, 18], [-14, -138, 19], [14, -138, 19], [40, -128, 18], [-55, -105, 13], [55, -105, 13]].forEach(([x, y, r], i) => {
        c.fillStyle = col === 'rainbow' ? clay(c, x, y, r, RAINBOW[i % 6]) : clay(c, x, y, r, k);
        ell(c, x, y, r);
        c.fill();
      });
    }
  },
  braid: {
    back(c, col, s) {
      c.fillStyle = hairFill(c, -150, -40, col);
      ell(c, 0, -94, 63, 62);
      c.fill();
      for (let i = 0; i < 6; i++) {
        const y = -56 + i * 21, x = 54 + Math.sin(i * 0.7) * 6 + s * i * 0.7, r = 17 - i * 1.4;
        c.fillStyle = clay(c, x, y, r, col === 'rainbow' ? RAINBOW[i % 6] : baseCol(col));
        ell(c, x, y, r, r * 0.84, 0.3);
        c.fill();
      }
      c.fillStyle = P.sky;
      ell(c, 58 + s * 5, 58, 7);
      c.fill();
    },
    front: (c, col) => bangs(c, col, 'side')
  },
  pony: {
    back(c, col, s) {
      c.fillStyle = hairFill(c, -150, -40, col);
      ell(c, 0, -94, 63, 62);
      c.fill();
      lock(c, [[8, -150], [60, -176], [92, -140], [100 + s * 3, -90], [90 + s * 6, -44], [96 + s * 8, -20]], 26, col, -176, -20);
    },
    top(c) {
      c.fillStyle = clay(c, 30, -152, 11, P.rose);
      ell(c, 30, -153, 11, 9, -0.5);
      c.fill();
    },
    front: (c, col) => bangs(c, col, 'side')
  },
  space: {
    back(c, col, s) {
      c.fillStyle = hairFill(c, -150, 20, col);
      c.beginPath();
      c.moveTo(-64, -92);
      c.bezierCurveTo(-70, -170, 70, -170, 64, -92);
      c.bezierCurveTo(70, -50, 64, -10, 58 + s * 3, 18);
      c.lineTo(-58 + s * 3, 18);
      c.bezierCurveTo(-64, -10, -70, -50, -64, -92);
      c.fill();
    },
    top(c, col, s) {
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 48, -150, 22, baseCol(col));
        ell(c, k * 48, -150 + s * k * 0.8, 21);
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = alpha(dark(baseCol(col), 0.2), 0.5);
        c.beginPath();
        c.arc(k * 48, -150, 12, 0.3, 4.5);
        c.stroke();
      }
    },
    front: (c, col) => bangs(c, col, 'mid')
  }
};

// ---- GARMENTS ------------------------------------------------------------------------
function bodice(c, col, opts = {}) {
  c.fillStyle = cloth(c, -26, 26, col);
  c.beginPath();
  c.moveTo(-23, -40);
  c.quadraticCurveTo(-12, -32, 0, -34);
  c.quadraticCurveTo(12, -32, 23, -40);
  c.quadraticCurveTo(28, -16, 22, 6);
  c.lineTo(-22, 6);
  c.quadraticCurveTo(-28, -16, -23, -40);
  c.closePath();
  c.fill();
  if (opts.belt) {
    c.fillStyle = opts.belt;
    rr(c, -24, 0, 48, 8, 4);
    c.fill();
  }
}
function bell(c, col, botW, botY, s, scallops = 0, topW = 22, topY = 4) {
  c.fillStyle = cloth(c, -botW, botW, col);
  c.beginPath();
  c.moveTo(-topW, topY);
  c.bezierCurveTo(-topW - (botW - topW) * 0.3, topY + (botY - topY) * 0.45, -botW * 0.96 + s * 3, botY * 0.8, -botW + s * 7, botY);
  if (scallops) {
    const n = scallops;
    for (let i = 0; i < n; i++) {
      const x0 = -botW + s * 7 + (i * 2 * botW) / n, x1 = -botW + s * 7 + ((i + 1) * 2 * botW) / n;
      c.quadraticCurveTo((x0 + x1) / 2, botY + 12, x1, botY);
    }
  } else c.quadraticCurveTo(s * 4, botY + 14, botW + s * 7, botY);
  c.bezierCurveTo(botW * 0.96 + s * 3, botY * 0.8, topW + (botW - topW) * 0.3, topY + (botY - topY) * 0.45, topW, topY);
  c.closePath();
  c.fill();
}
function folds(c, col, botW, botY, s, topY = 8, n = 3) {
  c.lineCap = 'round';
  c.lineWidth = 2.6;
  c.strokeStyle = alpha(dark(col, 0.5), 0.2);
  for (let i = -n; i <= n; i++) {
    if (i === 0) continue;
    const k = i / n;
    c.beginPath();
    c.moveTo(k * 16, topY);
    c.quadraticCurveTo(k * botW * 0.5, (topY + botY) * 0.55, k * botW * 0.88 + s * 6, botY - 2);
    c.stroke();
  }
}
function puff(c, col) {
  for (const k of [-1, 1]) {
    c.fillStyle = clay(c, k * 28, -35, 14, col);
    ell(c, k * 28, -34, 14, 12, k * 0.5);
    c.fill();
  }
}
function neckGem(c, col = '#FFD45C') {
  softStar(c, 0, -26, 7);
  c.fillStyle = col;
  c.fill();
}

export const DRESS = {
  gown: {
    colors: ['#FF7DAE', '#B48BFF', '#6FC6FF', '#FFD45C', '#7FE3C8', '#FF8A7A', '#FFFFFF'], draw(c, col, s) {
      bell(c, col, 74, 84, s);
      folds(c, col, 74, 84, s);
      c.fillStyle = light(col, 0.74);
      for (let i = 0; i < 11; i++) {
        ell(c, -66 + i * 13.2 + s * 7, 88 + Math.sin(i * 0.5) * 1, 8);
        c.fill();
      }
      bodice(c, col, { belt: P.sun });
      puff(c, light(col, 0.3));
      neckGem(c);
    }
  },
  tutu: {
    colors: ['#FF8FC4', '#B48BFF', '#7FE3C8', '#FFE066', '#6FC6FF'], draw(c, col, s) {
      for (let k = 2; k >= 0; k--) {
        const w = 52 + k * 7, y = 30 + k * 8;
        c.fillStyle = alpha(mix(col, '#FFFFFF', k * 0.2), 0.86);
        c.beginPath();
        c.moveTo(-24, 2);
        c.quadraticCurveTo(-w * 0.76, 8, -w + s * 5, y);
        for (let i = 0; i < 9; i++) {
          const x0 = -w + s * 5 + (i * 2 * w) / 9, x1 = -w + s * 5 + ((i + 1) * 2 * w) / 9;
          c.quadraticCurveTo((x0 + x1) / 2, y + 12, x1, y);
        }
        c.quadraticCurveTo(w * 0.76, 8, 24, 2);
        c.closePath();
        c.fill();
      }
      bodice(c, col);
      for (let i = 0; i < 4; i++) {
        sparkleShape(c, -16 + i * 11, -20 + (i % 2) * 11, 4.5);
        c.fillStyle = '#fff';
        c.fill();
      }
    }
  },
  mermaid: {
    colors: ['#3FD0C9', '#B48BFF', '#FF7DAE', '#6FC6FF', '#FFC233'], draw(c, col, s) {
      c.fillStyle = cloth(c, -44, 44, col);
      c.beginPath();
      c.moveTo(-22, 2);
      c.bezierCurveTo(-30, 28, -24, 52, -18, 72);
      c.quadraticCurveTo(-30 + s * 4, 90, -56 + s * 8, 108);
      c.quadraticCurveTo(0 + s * 6, 92, 56 + s * 8, 108);
      c.quadraticCurveTo(30 + s * 4, 90, 18, 72);
      c.bezierCurveTo(24, 52, 30, 28, 22, 2);
      c.closePath();
      c.fill();
      // Scales
      c.save();
      c.clip();
      c.strokeStyle = 'rgba(255,255,255,.36)';
      c.lineWidth = 1.8;
      for (let y = 0; y < 8; y++) {
        for (let x = -3; x <= 3; x++) {
          c.beginPath();
          c.arc(x * 12 + (y % 2) * 6, 14 + y * 11, 6.5, 0.1, Math.PI - 0.1);
          c.stroke();
        }
      }
      c.restore();
      bodice(c, col);
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 11, -26, 11, P.pink);
        ell(c, k * 11, -25, 11.5, 10);
        c.fill();
      }
    }
  },
  starry: {
    colors: ['#4D3BA8', '#23346F', '#7A3F9D', '#1F7A8C', '#B5396F'], draw(c, col, s) {
      bell(c, col, 64, 82, s);
      folds(c, col, 64, 82, s, 8, 2);
      const st = [[-34, 40, 5], [-14, 62, 6], [12, 34, 5], [30, 62, 7], [-44, 70, 4], [46, 44, 4], [0, 76, 4], [-4, 22, 3.5]];
      st.forEach(([x, y, r]) => {
        softStar(c, x + s * (y / 16), y, r);
        c.fillStyle = '#FFE680';
        c.fill();
      });
      bodice(c, col, { belt: '#FFD45C' });
      c.beginPath();
      c.arc(0, -19, 8, 0.7, 5.2);
      c.arc(4, -21, 6.5, 5.1, 0.9, true);
      c.fillStyle = '#FFE680';
      c.fill();
    }
  },
  petals: {
    colors: ['#FF9FC3', '#FFB65C', '#C7ABFF', '#FF7F7F', '#9BE8C8'], draw(c, col, s) {
      for (let row = 2; row >= 0; row--) {
        const n = 3 + row * 2, y = 26 + row * 23, w = 16 + row * 21;
        for (let i = 0; i < n; i++) {
          const k = n > 1 ? (i / (n - 1)) * 2 - 1 : 0, x = k * w + s * row * 2;
          c.save();
          c.translate(x, y);
          c.rotate(-k * 0.42);
          c.fillStyle = clay(c, 0, 0, 22, row % 2 ? light(col, 0.18) : col);
          ell(c, 0, 0, 15.5, 25);
          c.fill();
          c.restore();
        }
      }
      bodice(c, '#7FD86F', { belt: '#5BC46E' });
      for (let i = 0; i < 3; i++) {
        c.fillStyle = col;
        ell(c, -12 + i * 12, -33 + Math.abs(i - 1) * -2, 7);
        c.fill();
      }
    }
  },
  rainbow: {
    colors: null, draw(c, col, s) {
      const rows = 6;
      for (let i = rows - 1; i >= 0; i--) {
        const y = 12 + (i + 1) * 12.5, w = 26 + (i + 1) * 7.6;
        c.fillStyle = RAINBOW[i];
        c.beginPath();
        c.moveTo(-20, 2);
        c.lineTo(-w + s * i, y);
        c.quadraticCurveTo(s * 4, y + 10, w + s * i, y);
        c.lineTo(20, 2);
        c.closePath();
        c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,.2)';
      ell(c, -24, 34, 12, 34, 0.25);
      c.fill();
      bodice(c, '#FFFFFF', { belt: '#FF7F9F' });
      puff(c, '#FFF');
      heart(c, 0, -21, 7);
      c.fillStyle = P.rose;
      c.fill();
    }
  },
  sailor: {
    colors: ['#5698FF', '#FF7DAE', '#3FD0C9', '#8C68F2', '#FF8A7A'], draw(c, col, s) {
      bell(c, col, 50, 56, s, 7);
      folds(c, col, 50, 56, s, 8, 3);
      bodice(c, '#FFFFFF', { belt: col });
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(-23, -40);
      c.lineTo(0, -16);
      c.lineTo(23, -40);
      c.lineTo(32, -28);
      c.lineTo(0, 0);
      c.lineTo(-32, -28);
      c.closePath();
      c.fill();
      c.fillStyle = P.rose;
      ell(c, -7, -13, 7, 4.6, 0.4);
      c.fill();
      ell(c, 7, -13, 7, 4.6, -0.4);
      c.fill();
      ell(c, 0, -13, 3.5);
      c.fill();
    }
  },
  overalls: {
    colors: ['#6FA8E8', '#FF9FC3', '#FFC233', '#9BE8C8', '#C7ABFF'], draw(c, col, s) {
      // Striped tee
      bodice(c, '#FFFFFF');
      c.save();
      c.beginPath();
      c.rect(-28, -40, 56, 44);
      c.clip();
      c.fillStyle = P.coral;
      for (let y = -38; y < 0; y += 10) c.fillRect(-28, y, 56, 4);
      c.restore();
      // Shorts
      c.fillStyle = cloth(c, -32, 32, col);
      c.beginPath();
      c.moveTo(-24, -6);
      c.lineTo(24, -6);
      c.quadraticCurveTo(30, 18, 34, 46);
      c.lineTo(5, 46);
      c.lineTo(0, 28);
      c.lineTo(-5, 46);
      c.lineTo(-34, 46);
      c.quadraticCurveTo(-30, 18, -24, -6);
      c.closePath();
      c.fill();
      // Bib and straps
      c.fillStyle = cloth(c, -18, 18, col);
      rr(c, -16, -28, 32, 28, 5);
      c.fill();
      c.lineWidth = 7;
      c.strokeStyle = col;
      for (const k of [-1, 1]) {
        c.beginPath();
        c.moveTo(k * 12, -26);
        c.lineTo(k * 19, -40);
        c.stroke();
        c.fillStyle = P.sun;
        ell(c, k * 11, -23, 3.5);
        c.fill();
      }
      heart(c, 0, -14, 7);
      c.fillStyle = '#fff';
      c.fill();
    }
  },
  pajama: {
    colors: ['#B9D7FF', '#FFD0E3', '#D9C7FF', '#CFF5DF', '#FFE9A8'], draw(c, col, s) {
      const dk = dark(col, 0.1);
      c.fillStyle = cloth(c, -32, 32, col);
      for (const k of [-1, 1]) {
        rr(c, k > 0 ? 2 : -30, 6, 28, 98, 12);
        c.fill();
      }
      bodice(c, col);
      c.fillStyle = cloth(c, -30, 30, light(col, 0.1));
      rr(c, -29, -36, 58, 58, 16);
      c.fill();
      const dots = [[-16, -20], [14, -14], [-6, 4], [18, 8], [-18, 42], [18, 40], [-16, 72], [16, 78]];
      dots.forEach(([x, y]) => {
        softStar(c, x, y, 5);
        c.fillStyle = '#fff';
        c.fill();
      });
      c.strokeStyle = dk;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(0, -30);
      c.lineTo(0, 20);
      c.stroke();
    }
  },
  princess: {
    colors: ['#FFD45C', '#9CD3FF', '#FF9FC3', '#C7ABFF', '#FFFFFF', '#7FE3C8'], draw(c, col, s) {
      bell(c, dark(col, 0.08), 84, 94, s);
      bell(c, col, 76, 70, s * 1.1, 8);
      folds(c, col, 76, 70, s);
      // Draped swags
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.strokeStyle = light(col, 0.6);
      for (let i = 0; i < 3; i++) {
        const x0 = -60 + i * 40;
        c.beginPath();
        c.moveTo(x0, 42);
        c.quadraticCurveTo(x0 + 20, 58, x0 + 40, 42);
        c.stroke();
        softStar(c, x0, 42, 5);
        c.fillStyle = P.rose;
        c.fill();
      }
      softStar(c, 60, 42, 5);
      c.fill();
      bodice(c, col, { belt: light(col, 0.55) });
      puff(c, light(col, 0.5));
      neckGem(c, P.rose);
    }
  },
  ice: {
    colors: ['#A6E3FF', '#D9C7FF', '#BFF3E6', '#FFC4E8'], draw(c, col, s) {
      bell(c, col, 60, 96, s);
      c.save();
      c.clip();
      c.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 18; i++) {
        const x = -56 + ((i * 53) % 112), y = 10 + ((i * 37) % 86);
        sparkleShape(c, x, y, 3 + (i % 3));
        c.fill();
      }
      c.restore();
      bodice(c, light(col, 0.28));
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath();
      c.moveTo(-23, -40);
      c.lineTo(0, -6);
      c.lineTo(23, -40);
      c.closePath();
      c.fill();
    }
  },
  butterfly: {
    colors: ['#FF8FC4', '#FFB65C', '#6FC6FF', '#B48BFF', '#7FE3A0'], draw(c, col, s) {
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 36, 26, 38, col);
        ell(c, k * 34 + s * 4, 24, 38, 24, k * 0.3);
        c.fill();
        c.fillStyle = clay(c, k * 30, 60, 30, light(col, 0.2));
        ell(c, k * 28 + s * 5, 56, 29, 25, k * -0.3);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)';
        ell(c, k * 44 + s * 4, 22, 10);
        c.fill();
        ell(c, k * 30 + s * 5, 60, 8);
        c.fill();
      }
      bodice(c, dark(col, 0.25), { belt: P.sun });
    }
  }
};

// ---- SHOES -------------------------------------------------------------------------
function shoePair(c, draw) {
  for (const k of [-1, 1]) {
    c.save();
    c.translate(k * 16, 0);
    c.scale(k, 1);
    draw();
    c.restore();
  }
}
export const SHOES = {
  slippers: {
    colors: ['#FF7DAE', '#FFD45C', '#B48BFF', '#6FC6FF', '#FFFFFF'], draw(c, col) {
      shoePair(c, () => {
        c.fillStyle = clay(c, 3, 106, 15, col);
        ell(c, 3, 106, 15, 9);
        c.fill();
        softStar(c, 4, 101, 5);
        c.fillStyle = '#fff';
        c.fill();
      });
    }
  },
  sneakers: {
    colors: ['#FF8A7A', '#6FC6FF', '#7FE3A0', '#FFFFFF', '#B48BFF'], draw(c, col) {
      shoePair(c, () => {
        c.fillStyle = '#FFF';
        rr(c, -11, 106, 28, 7, 3.5);
        c.fill();
        c.fillStyle = clay(c, 2, 98, 16, col);
        c.beginPath();
        c.moveTo(-10, 107);
        c.lineTo(-10, 92);
        c.quadraticCurveTo(0, 90, 6, 96);
        c.quadraticCurveTo(16, 99, 16, 107);
        c.closePath();
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        for (const x of [-1, 3]) {
          c.beginPath();
          c.moveTo(x, 94);
          c.lineTo(x + 3, 99);
          c.stroke();
        }
      });
    }
  },
  boots: {
    colors: ['#FFD45C', '#FF7DAE', '#8C68F2', '#9E6B42', '#FFFFFF'], draw(c, col) {
      shoePair(c, () => {
        c.fillStyle = cloth(c, -12, 16, col);
        c.beginPath();
        c.moveTo(-11, 112);
        c.lineTo(-11, 72);
        c.lineTo(11, 72);
        c.lineTo(11, 94);
        c.quadraticCurveTo(20, 100, 19, 112);
        c.closePath();
        c.fill();
        c.fillStyle = light(col, 0.5);
        rr(c, -13, 69, 26, 8, 4);
        c.fill();
      });
    }
  },
  sparkle: {
    colors: ['#FFD45C', '#FF8FC4', '#BFE9FF', '#D9C7FF'], draw(c, col) {
      shoePair(c, () => {
        c.fillStyle = hgrad(c, -10, 17, light(col, 0.5), col);
        c.beginPath();
        c.moveTo(-10, 100);
        c.quadraticCurveTo(0, 92, 16, 108);
        c.lineTo(16, 112);
        c.lineTo(-3, 112);
        c.lineTo(-8, 112);
        c.closePath();
        c.fill();
        sparkleShape(c, 4, 102, 6);
        c.fillStyle = '#fff';
        c.fill();
      });
    }
  },
  bunny: {
    colors: ['#FFFFFF', '#FFC4DC', '#D9C7FF'], draw(c, col) {
      shoePair(c, () => {
        c.fillStyle = clay(c, 2, 104, 17, col);
        ell(c, 2, 104, 17, 11);
        c.fill();
        for (const s of [-1, 1]) {
          c.fillStyle = clay(c, 2 + s * 6, 90, 8, col);
          ell(c, 2 + s * 6, 91, 4.5, 10, s * 0.3);
          c.fill();
        }
        c.fillStyle = P.ink;
        ell(c, 7, 103, 1.8);
        c.fill();
      });
    }
  }
};

// ---- HEAD ITEMS --------------------------------------------------------------------
export const HEADWEAR = {
  none: { draw() {} },
  tiara: {
    colors: ['#FFD45C', '#D7DEEA', '#FF9FC3'], draw(c, col) {
      c.fillStyle = vgrad(c, -162, -130, light(col, 0.5), col, dark(col, 0.2));
      c.beginPath();
      c.moveTo(-34, -126);
      c.quadraticCurveTo(-30, -146, -26, -142);
      c.lineTo(-14, -148);
      c.lineTo(0, -168);
      c.lineTo(14, -148);
      c.lineTo(26, -142);
      c.quadraticCurveTo(30, -146, 34, -126);
      c.quadraticCurveTo(0, -140, -34, -126);
      c.closePath();
      c.fill();
      softStar(c, 0, -149, 8, 4, 0.5);
      c.fillStyle = P.rose;
      c.fill();
      for (const k of [-1, 1]) {
        ell(c, k * 22, -136, 3.5);
        c.fillStyle = P.sky;
        c.fill();
      }
    }
  },
  crown: {
    colors: ['#FFC233', '#FF7DAE', '#B48BFF'], draw(c, col) {
      c.fillStyle = vgrad(c, -186, -130, light(col, 0.42), col, dark(col, 0.26));
      c.beginPath();
      c.moveTo(-38, -130);
      c.lineTo(-44, -176);
      c.lineTo(-22, -154);
      c.lineTo(0, -186);
      c.lineTo(22, -154);
      c.lineTo(44, -176);
      c.lineTo(38, -130);
      c.quadraticCurveTo(0, -146, -38, -130);
      c.closePath();
      c.fill();
      for (const [x, y, k] of [[-44, -176, P.mint], [0, -186, P.rose], [44, -176, P.sky]]) {
        c.fillStyle = clay(c, x, y, 6, k);
        ell(c, x, y, 6);
        c.fill();
      }
      for (const [x, k] of [[-22, P.sky], [0, P.rose], [22, P.mint]]) {
        c.fillStyle = k;
        ell(c, x, -143 + Math.abs(x) * 0.1, 5);
        c.fill();
      }
    }
  },
  flowers: {
    colors: ['#FF9FC3', '#FFD45C', '#C7ABFF', '#FF8A7A'], draw(c, col) {
      c.strokeStyle = '#6FC767';
      c.lineWidth = 5;
      c.beginPath();
      c.arc(0, -96, 57, Math.PI + 0.3, -0.3);
      c.stroke();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + 0.36 + i * 0.41, x = Math.cos(a) * 57, y = -96 + Math.sin(a) * 57;
        const pc = i % 2 ? col : '#FFFFFF';
        for (let k = 0; k < 5; k++) {
          const b = (k / 5) * TAU;
          c.fillStyle = pc;
          ell(c, x + Math.cos(b) * 6, y + Math.sin(b) * 6, 5);
          c.fill();
        }
        c.fillStyle = P.sun;
        ell(c, x, y, 3.8);
        c.fill();
      }
    }
  },
  bow: {
    colors: ['#FF5C8F', '#FFD45C', '#6FC6FF', '#8C68F2', '#7FE3A0'], draw(c, col) {
      c.save();
      c.translate(30, -144);
      c.rotate(0.25);
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 16, -2, 18, col);
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(k * 12, -20, k * 32, -18, k * 30, 0);
        c.bezierCurveTo(k * 32, 16, k * 12, 18, 0, 0);
        c.fill();
      }
      c.fillStyle = clay(c, 0, 0, 7, dark(col, 0.1));
      ell(c, 0, 0, 7.5);
      c.fill();
      c.restore();
    }
  },
  cat: {
    colors: ['#FF9FC3', '#3A2A57', '#FFFFFF', '#FFB65C'], draw(c, col) {
      for (const k of [-1, 1]) {
        c.save();
        c.translate(k * 37, -136);
        c.rotate(k * 0.3);
        c.fillStyle = clay(c, 0, -6, 24, col);
        c.beginPath();
        c.moveTo(-20, 12);
        c.quadraticCurveTo(-6, -24, 0, -28);
        c.quadraticCurveTo(6, -24, 20, 12);
        c.closePath();
        c.fill();
        c.fillStyle = '#FFC4DC';
        c.beginPath();
        c.moveTo(-10, 8);
        c.quadraticCurveTo(0, -18, 10, 8);
        c.closePath();
        c.fill();
        c.restore();
      }
    }
  },
  bunny: {
    colors: ['#FFFFFF', '#FFC4DC', '#D9C7FF', '#BFE9FF'], draw(c, col, s) {
      for (const k of [-1, 1]) {
        c.save();
        c.translate(k * 26, -142);
        c.rotate(k * 0.18 + s * 0.05);
        c.fillStyle = clay(c, 0, -30, 18, col);
        ell(c, 0, -32, 13, 38);
        c.fill();
        c.fillStyle = '#FFB6D3';
        ell(c, 0, -32, 6, 27);
        c.fill();
        c.restore();
      }
    }
  },
  horn: {
    colors: ['#FFD45C', '#FF9FC3', '#BFE9FF'], draw(c, col) {
      c.fillStyle = hgrad(c, -10, 10, light(col, 0.5), dark(col, 0.1));
      c.beginPath();
      c.moveTo(-11, -138);
      c.quadraticCurveTo(-3, -170, 0, -192);
      c.quadraticCurveTo(3, -170, 11, -138);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)';
      c.lineWidth = 2.5;
      for (const y of [-150, -164, -176]) {
        c.beginPath();
        c.moveTo(-7, y + 3);
        c.lineTo(7, y - 4);
        c.stroke();
      }
    }
  },
  witch: {
    colors: ['#8C68F2', '#FF5C8F', '#3A2A57', '#3FD0C9'], draw(c, col, s) {
      c.fillStyle = clay(c, 0, -140, 50, col);
      ell(c, 0, -134, 70, 14);
      c.fill();
      c.fillStyle = vgrad(c, -216, -134, light(col, 0.18), dark(col, 0.1));
      c.beginPath();
      c.moveTo(-40, -134);
      c.quadraticCurveTo(-14, -180, 14 + s * 6, -214);
      c.quadraticCurveTo(26, -172, 40, -134);
      c.closePath();
      c.fill();
      c.fillStyle = P.sun;
      rr(c, -38, -146, 76, 9, 4);
      c.fill();
      softStar(c, 0, -170, 8);
      c.fillStyle = '#FFE680';
      c.fill();
    }
  },
  sunhat: {
    colors: ['#FFE9A8', '#FFC4DC', '#CFF5DF', '#BFE9FF'], draw(c, col) {
      c.fillStyle = clay(c, 0, -134, 80, col);
      ell(c, 0, -130, 86, 18);
      c.fill();
      c.fillStyle = clay(c, 0, -148, 44, col);
      c.beginPath();
      c.moveTo(-44, -132);
      c.bezierCurveTo(-44, -176, 44, -176, 44, -132);
      c.closePath();
      c.fill();
      c.fillStyle = P.rose;
      rr(c, -45, -144, 90, 10, 3);
      c.fill();
      for (const x of [32, 46]) {
        c.fillStyle = x > 40 ? P.sun : '#fff';
        ell(c, x, -140, 8);
        c.fill();
      }
    }
  },
  phones: {
    colors: ['#FF7DAE', '#6FC6FF', '#3A2A57', '#7FE3A0'], draw(c, col) {
      c.strokeStyle = col;
      c.lineWidth = 8;
      c.beginPath();
      c.arc(0, -96, 66, Math.PI + 0.2, -0.2);
      c.stroke();
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 64, -86, 20, col);
        ell(c, k * 64, -84, 15, 21);
        c.fill();
      }
    }
  },
  starband: {
    colors: ['#FFD45C', '#FF8FC4', '#B48BFF'], draw(c, col, s) {
      c.strokeStyle = '#FFF';
      c.lineWidth = 3;
      for (const k of [-1, 1]) {
        c.beginPath();
        c.moveTo(k * 22, -142);
        c.quadraticCurveTo(k * 26, -162, k * 34 + s, -174);
        c.stroke();
        softStar(c, k * 35 + s, -180, 14);
        c.fillStyle = clay(c, k * 35, -180, 14, col);
        c.fill();
      }
    }
  }
};

// ---- WINGS ---------------------------------------------------------------------------
function wingPair(c, draw) {
  for (const k of [-1, 1]) {
    c.save();
    c.scale(k, 1);
    draw(k);
    c.restore();
  }
}
export const BACK = {
  none: { draw() {} },
  fairy: {
    colors: ['#BFE9FF', '#FFC4E8', '#D9C7FF', '#CFF5DF', '#FFE9A8'], draw(c, col, s, t) {
      const f = Math.sin(t * 4) * 0.06;
      wingPair(c, () => {
        c.save();
        c.translate(16, -18);
        c.rotate(f);
        c.fillStyle = alpha(col, 0.72);
        c.strokeStyle = 'rgba(255,255,255,.95)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(30, -74, 92, -86, 96, -48);
        c.bezierCurveTo(98, -24, 52, -4, 0, 0);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(0, 2);
        c.bezierCurveTo(44, 8, 76, 26, 66, 52);
        c.bezierCurveTo(56, 72, 16, 46, 0, 2);
        c.fill();
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,.72)';
        ell(c, 68, -50, 8);
        c.fill();
        ell(c, 48, 36, 6);
        c.fill();
        c.restore();
      });
    }
  },
  butterfly: {
    colors: ['#FF9F5C', '#FF7DAE', '#6FC6FF', '#B48BFF'], draw(c, col, s, t) {
      const f = Math.sin(t * 5) * 0.08;
      wingPair(c, () => {
        c.save();
        c.translate(14, -16);
        c.rotate(f);
        c.fillStyle = clay(c, 56, -40, 60, col);
        c.beginPath();
        c.moveTo(0, 0);
        c.bezierCurveTo(16, -84, 100, -84, 92, -26);
        c.bezierCurveTo(90, 0, 40, 4, 0, 0);
        c.fill();
        c.fillStyle = clay(c, 40, 34, 40, light(col, 0.15));
        c.beginPath();
        c.moveTo(0, 2);
        c.bezierCurveTo(50, 0, 76, 20, 60, 52);
        c.bezierCurveTo(44, 74, 10, 44, 0, 2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,.72)';
        for (const [x, y, r] of [[60, -44, 12], [36, -38, 7], [74, -22, 6], [40, 30, 9]]) {
          ell(c, x, y, r);
          c.fill();
        }
        c.restore();
      });
    }
  },
  angel: {
    colors: ['#FFFFFF', '#FFE9A8', '#FFD0E3', '#D9C7FF'], draw(c, col, s, t) {
      const f = Math.sin(t * 2.4) * 0.05;
      wingPair(c, () => {
        c.save();
        c.translate(14, -24);
        c.rotate(f);
        const rows = [[30, -30, 19], [54, -46, 19], [74, -52, 16], [88, -48, 13], [22, 0, 17], [46, -10, 17], [66, -16, 14], [80, -18, 11], [18, 24, 13], [38, 16, 13], [54, 10, 10]];
        rows.forEach(([x, y, r]) => {
          c.fillStyle = clay(c, x, y, r, col);
          ell(c, x, y, r);
          c.fill();
        });
        c.restore();
      });
    }
  },
  cape: {
    colors: ['#E8476F', '#8C68F2', '#3FD0C9', '#FFC233', '#3F4AA8'], draw(c, col, s) {
      c.fillStyle = cloth(c, -70, 70, col);
      c.beginPath();
      c.moveTo(-24, -40);
      c.bezierCurveTo(-52, 8, -66 + s * 6, 66, -72 + s * 12, 98);
      c.quadraticCurveTo(0 + s * 8, 112, 72 + s * 12, 98);
      c.bezierCurveTo(66 + s * 6, 66, 52, 8, 24, -40);
      c.closePath();
      c.fill();
      for (const [x, y, r] of [[-40, 60, 7], [34, 48, 6], [46, 84, 7], [-16, 88, 5], [-48, 24, 5]]) {
        softStar(c, x + s * 3, y, r);
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.fill();
      }
    }
  },
  rainbow: {
    colors: null, draw(c, col, s, t) {
      const f = Math.sin(t * 3.4) * 0.05;
      wingPair(c, () => {
        c.save();
        c.translate(14, -8);
        c.rotate(f);
        RAINBOW.forEach((k, i) => {
          c.strokeStyle = k;
          c.lineWidth = 10;
          c.lineCap = 'round';
          c.beginPath();
          c.arc(0, 0, 92 - i * 12, -1.4, 0.3);
          c.stroke();
        });
        c.restore();
      });
    }
  },
  bag: {
    colors: ['#FF8A7A', '#6FC6FF', '#FFD45C', '#B48BFF'], draw(c, col) {
      c.fillStyle = clay(c, 0, -10, 42, col);
      rr(c, -40, -40, 80, 74, 22);
      c.fill();
      for (const k of [-1, 1]) {
        c.fillStyle = clay(c, k * 30, -44, 12, col);
        ell(c, k * 30, -44, 12);
        c.fill();
      }
    }
  }
};

// ---- HAND ITEMS --------------------------------------------------------------------
export const HAND = {
  none: { draw() {} },
  wand: {
    colors: ['#FFD45C', '#FF8FC4', '#B48BFF', '#6FC6FF'], draw(c, col, t) {
      c.strokeStyle = '#F8F3FF';
      c.lineWidth = 5;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 16); c.lineTo(10, -40); c.stroke();
      softStar(c, 12, -54, 19);
      c.fillStyle = clay(c, 12, -54, 19, col);
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = '#fff';
      c.stroke();
      const k = 0.5 + 0.5 * Math.sin(t * 5);
      sparkleShape(c, 36, -68, 5 + k * 5);
      c.fillStyle = '#FFF8C0';
      c.fill();
    }
  },
  flower: {
    colors: ['#FF8FC4', '#FFB65C', '#C7ABFF', '#FF7F7F'], draw(c, col) {
      c.strokeStyle = '#5BC46E';
      c.lineWidth = 4;
      for (const [x, y] of [[-14, -34], [2, -44], [16, -32]]) {
        c.beginPath(); c.moveTo(0, 14); c.lineTo(x, y); c.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          c.fillStyle = col;
          ell(c, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5.5);
          c.fill();
        }
        c.fillStyle = P.sun;
        ell(c, x, y, 4.5);
        c.fill();
      }
    }
  },
  balloon: {
    colors: ['#FF5C8F', '#6FC6FF', '#FFD45C', '#B48BFF', '#7FE3A0'], draw(c, col, t) {
      const b = Math.sin(t * 1.6) * 3;
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(0, 10);
      c.quadraticCurveTo(8, -40, 6 + b, -90);
      c.stroke();
      heart(c, 6 + b, -112, 30);
      c.fillStyle = clay(c, 6 + b, -112, 34, col);
      c.fill();
      gloss(c, -6 + b, -124, 9, 6, 0.8);
    }
  },
  teddy: {
    colors: ['#E8B27C', '#FFC4DC', '#B9D7FF'], draw(c, col) {
      c.save();
      c.translate(6, -8);
      for (const s of [-1, 1]) {
        c.fillStyle = clay(c, s * 13, -30, 8, col);
        ell(c, s * 13, -30, 8);
        c.fill();
      }
      c.fillStyle = clay(c, 0, 8, 18, col);
      ell(c, 0, 8, 15, 17);
      c.fill();
      c.fillStyle = clay(c, 0, -18, 18, col);
      ell(c, 0, -18, 17);
      c.fill();
      c.fillStyle = P.ink;
      for (const s of [-1, 1]) {
        ell(c, s * 6, -21, 2.4);
        c.fill();
      }
      c.fillStyle = '#FFE9D2';
      ell(c, 0, -13, 6.5, 5);
      c.fill();
      c.fillStyle = P.ink;
      ell(c, 0, -15, 2.2, 1.6);
      c.fill();
      c.restore();
    }
  },
  icecream: {
    colors: ['#FFC4DC', '#BFF3E6', '#FFE9A8', '#D9C7FF'], draw(c, col) {
      c.fillStyle = hgrad(c, -10, 10, '#F2C07E', '#D9944C');
      c.beginPath();
      c.moveTo(-12, -14);
      c.lineTo(12, -14);
      c.lineTo(0, 16);
      c.closePath();
      c.fill();
      for (const [x, y, r, k] of [[-5, -22, 12, col], [7, -24, 11, light(col, 0.3)], [1, -38, 11, mix(col, '#FF8FB8', 0.4)]]) {
        c.fillStyle = clay(c, x, y, r, k);
        ell(c, x, y, r);
        c.fill();
      }
      c.fillStyle = P.rose;
      ell(c, 1, -51, 4);
      c.fill();
    }
  },
  lolli: {
    colors: ['#FF7DAE', '#6FC6FF', '#FFC233', '#B48BFF'], draw(c, col) {
      c.strokeStyle = '#fff';
      c.lineWidth = 4.5;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 16); c.lineTo(5, -30); c.stroke();
      c.fillStyle = clay(c, 6, -46, 22, col);
      ell(c, 6, -48, 22);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)';
      c.lineWidth = 4;
      c.beginPath();
      for (let a = 0; a < 12; a += 0.25) {
        const r = a * 1.5;
        c.lineTo(6 + Math.cos(a) * r, -48 + Math.sin(a) * r);
      }
      c.stroke();
    }
  },
  mirror: {
    colors: ['#FFD45C', '#FF8FC4', '#B48BFF'], draw(c, col) {
      c.strokeStyle = col;
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 16); c.lineTo(3, -18); c.stroke();
      c.fillStyle = col;
      ell(c, 5, -42, 22, 27);
      c.fill();
      c.fillStyle = vgrad(c, -60, -24, '#E6F7FF', '#A6DDF7');
      ell(c, 5, -42, 16, 21);
      c.fill();
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.beginPath(); c.moveTo(-2, -50); c.lineTo(8, -32); c.stroke();
    }
  },
  kitten: {
    colors: ['#FFD08A', '#C7CCE8', '#3A2A57'], draw(c, col, t) {
      c.save();
      c.translate(8, -22);
      for (const s of [-1, 1]) {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(s * 16, -8);
        c.lineTo(s * 14, -28);
        c.lineTo(s * 2, -18);
        c.closePath();
        c.fill();
      }
      c.fillStyle = clay(c, 0, 0, 20, col);
      ell(c, 0, 0, 21, 19);
      c.fill();
      c.fillStyle = col === '#3A2A57' ? '#FFF' : P.ink;
      for (const s of [-1, 1]) {
        ell(c, s * 8, -2, 3.2);
        c.fill();
      }
      c.fillStyle = P.rose;
      ell(c, 0, 4, 2.2, 1.6);
      c.fill();
      c.restore();
    }
  }
};

export const DEFAULT_DOLL = {
  skin: 1, eye: 0, hair: 'waves', hairCol: '#FF8FC4', dress: 'gown', dressCol: '#FF7DAE', shoes: 'slippers', shoesCol: '#FF7DAE',
  head: 'tiara', headCol: '#FFD45C', back: 'fairy', backCol: '#BFE9FF', hand: 'wand', handCol: '#FFD45C'
};
export const HAIR_COLORS = ['#6B4226', '#2F2A44', '#F4CE6A', '#D9622B', '#FF8FC4', '#6FB8FF', '#B48BFF', '#7FE3C8', 'rainbow'];

// ---- THE DOLL ------------------------------------------------------------------------
function drawFace(c, d, o) {
  const eye = EYES[d.eye] || EYES[0];
  const expr = o.expr || 'open', blink = o.blink || 0;
  const lx = (o.lookX || 0) * 3.4, ly = (o.lookY || 0) * 2.6;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const ink = '#3A2A57';
  for (const s of [-1, 1]) {
    const x = s * 23, y = -84;
    if (expr === 'happy' || blink > 0.8) {
      c.strokeStyle = ink;
      c.lineWidth = 3.6;
      c.beginPath();
      if (expr === 'happy') c.arc(x, y + 5, 11.5, Math.PI + 0.25, -0.25);
      else c.arc(x, y - 4, 11, 0.25, Math.PI - 0.25);
      c.stroke();
    } else {
      const ry = 16 * (expr === 'wow' ? 1.12 : 1) * (1 - blink * 0.85), rx = 12.8 * (expr === 'wow' ? 1.08 : 1);
      c.fillStyle = '#FFFFFF';
      ell(c, x, y, rx, ry);
      c.fill();
      c.save();
      ell(c, x, y, rx, ry);
      c.clip();
      const g = c.createRadialGradient(x + lx, y + 7 + ly, 1, x + lx, y + ly, 13.5);
      g.addColorStop(0, light(eye, 0.55));
      g.addColorStop(0.55, eye);
      g.addColorStop(1, dark(eye, 0.45));
      c.fillStyle = g;
      ell(c, x + lx, y + ly, 11.5, 14);
      c.fill();
      c.fillStyle = '#2A1B46';
      ell(c, x + lx, y + ly, 6.2, 8);
      c.fill();
      c.restore();
      c.fillStyle = '#fff';
      ell(c, x + lx - 4.5, y + ly - 6.5, 4.4, 5);
      c.fill();
      ell(c, x + lx + 4.4, y + ly + 6, 2.1);
      c.fill();
      // Upper lash line with a tiny flick
      c.strokeStyle = ink;
      c.lineWidth = 3.4;
      c.beginPath();
      c.moveTo(x - s * -rx - 1 * s, y - 3);
      c.bezierCurveTo(x + rx * 0.6 * s, y - ry - 1, x - rx * 0.7 * s, y - ry - 1, x - rx * s, y - 4);
      c.stroke();
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(x + rx * s, y - 5);
      c.lineTo(x + (rx + 5) * s, y - 9);
      c.stroke();
    }
    // Brow
    c.strokeStyle = alpha(ink, 0.45);
    c.lineWidth = 2.1;
    c.beginPath();
    c.moveTo(x - 7, y - (expr === 'wow' ? 27 : 23));
    c.quadraticCurveTo(x, y - (expr === 'wow' ? 31 : 26), x + 7, y - (expr === 'wow' ? 27 : 23));
    c.stroke();
    // Cheek
    c.fillStyle = 'rgba(255,110,150,.34)';
    ell(c, s * 37, -64, 12, 7.5);
    c.fill();
  }
  // Nose
  c.fillStyle = 'rgba(190,100,90,.5)';
  ell(c, 0, -68, 2, 1.4);
  c.fill();
  // Mouth
  if (expr === 'happy' || expr === 'wow') {
    c.fillStyle = '#B83F62';
    c.beginPath();
    if (expr === 'wow') ell(c, 0, -55, 6, 7.5);
    else {
      c.moveTo(-10, -60);
      c.quadraticCurveTo(0, -57, 10, -60);
      c.quadraticCurveTo(8, -47, 0, -47);
      c.quadraticCurveTo(-8, -47, -10, -60);
    }
    c.fill();
    if (expr === 'happy') {
      c.fillStyle = '#FF9CB5';
      ell(c, 0, -50, 5, 3);
      c.fill();
    }
  } else {
    c.strokeStyle = '#B83F62';
    c.lineWidth = 2.8;
    c.beginPath();
    c.arc(0, -62, 7.5, 0.35, Math.PI - 0.35);
    c.stroke();
  }
}

/** o: t, sway (-1..1), expr, blink, lookX, lookY, armUp (0..1), nobg */
export function drawDoll(c, d, o = {}) {
  const t = o.t || 0, s = (o.sway || 0) + Math.sin(t * 1.9) * 0.28;
  const skin = SKINS[d.skin] || SKINS[1];
  const hair = HAIR[d.hair] || HAIR.waves;
  const dress = DRESS[d.dress] || DRESS.gown;
  const hw = HEADWEAR[d.head] || HEADWEAR.none, bk = BACK[d.back] || BACK.none, hnd = HAND[d.hand] || HAND.none, sh = SHOES[d.shoes] || SHOES.slippers;
  const breathe = Math.sin(t * 2.1) * 1.1;

  c.save();
  // Things behind everything
  c.save();
  c.translate(0, breathe * 0.5);
  bk.draw(c, d.backCol, s, t);
  c.restore();

  c.save();
  c.translate(0, breathe * 0.8);
  c.rotate(s * 0.012);
  hair.back(c, d.hairCol, s);
  c.restore();

  // Legs
  c.fillStyle = hgrad(c, -28, 28, dark(skin, 0.08), light(skin, 0.1), skin, dark(skin, 0.12));
  for (const k of [-1, 1]) {
    rr(c, k * 16 - 9, 12, 18, 94, 9);
    c.fill();
  }
  sh.draw(c, d.shoesCol);

  // Arms (under the garment's sleeves)
  const armUp = o.armUp || 0;
  const drawArm = (k, up) => {
    c.save();
    c.translate(k * 25, -34 + breathe);
    c.rotate(k * (-0.34 - up * 1.7 + Math.sin(t * 1.9) * 0.02));
    c.fillStyle = hgrad(c, -7, 7, light(skin, 0.1), dark(skin, 0.1));
    rr(c, -7, -2, 14, 56, 7);
    c.fill();
    c.fillStyle = clay(c, 0, 53, 8, skin);
    ell(c, 0, 53, 7.6, 8.6);
    c.fill();
    c.restore();
  };

  c.save();
  c.translate(0, breathe * 0.4);
  drawArm(-1, armUp);
  // Torso skin under the dress
  c.fillStyle = skin;
  rr(c, -24, -44, 48, 56, 16);
  c.fill();
  c.restore();

  // The garment
  c.save();
  c.translate(0, breathe * 0.4);
  dress.draw(c, d.dressCol, s, t);
  c.restore();

  // Right arm + what she holds
  c.save();
  c.translate(0, breathe * 0.4);
  c.save();
  c.translate(25, -34 + breathe);
  c.rotate(-0.34 + 0.28 - armUp * 1.2);
  c.fillStyle = hgrad(c, -7, 7, light(skin, 0.1), dark(skin, 0.1));
  rr(c, -7, -2, 14, 56, 7);
  c.fill();
  c.save();
  c.translate(0, 53);
  c.rotate(0.34 - 0.28 + armUp * 1.2);
  hnd.draw(c, d.handCol, t, s);
  c.restore();
  c.fillStyle = clay(c, 0, 53, 8, skin);
  ell(c, 0, 53, 7.6, 8.6);
  c.fill();
  c.restore();
  c.restore();

  // Head and face
  c.save();
  c.translate(0, breathe);
  c.rotate(s * 0.012 + (o.tilt || 0));
  c.fillStyle = hgrad(c, -18, 18, dark(skin, 0.14), skin);
  rr(c, -10, -52, 20, 18, 7);
  c.fill();
  // Ears
  for (const k of [-1, 1]) {
    c.fillStyle = clay(c, k * 57, -78, 10, skin);
    ell(c, k * 57, -78, 9, 11);
    c.fill();
  }
  c.fillStyle = clay(c, 0, -92, 58, skin, 54);
  c.beginPath();
  c.moveTo(-58, -92);
  c.bezierCurveTo(-58, -150, 58, -150, 58, -92);
  c.bezierCurveTo(58, -54, 30, -42, 0, -42);
  c.bezierCurveTo(-30, -42, -58, -54, -58, -92);
  c.fill();
  drawFace(c, d, o);
  if (hair.top) hair.top(c, d.hairCol, s);
  hair.front(c, d.hairCol, s);
  hw.draw(c, d.headCol, s, t);
  c.restore();
  c.restore();
}

export function drawHairTile(c, key, col, skin) {
  c.save();
  c.scale(0.33, 0.33);
  c.translate(0, 90);
  const h = HAIR[key];
  h.back(c, col, 0);
  c.fillStyle = skin;
  ell(c, 0, -92, 56, 52);
  c.fill();
  c.fillStyle = P.ink;
  for (const s of [-1, 1]) {
    ell(c, s * 23, -84, 7, 9);
    c.fill();
  }
  if (h.top) h.top(c, col, 0);
  h.front(c, col, 0);
  c.restore();
}
