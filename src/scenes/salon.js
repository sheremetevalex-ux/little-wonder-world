// Hair salon: real strands of hair that swing, fall and fly. Comb them, cut them,
// grow them back, curl them, dye them strand by strand, wash and blow-dry them, and
// pin bows on. The client is the doll or any friend she has hatched: more friends,
// more clients. Everything can be undone with a tap on the magic wig.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, vgrad, hgrad, TAU, softStar, heart, groundShadow, mix } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawDollHead, DEFAULT_DOLL, HAIR_COLORS } from '../art/doll.js';
import { drawCreature, blinkAt } from '../art/creatures.js';

const RAINBOW = ['#FF7F9F', '#FFB65C', '#FFE066', '#7FE3A0', '#6FC6FF', '#B48BFF'];
const COLORS = ['#6B4226', '#2F2A44', '#F4CE6A', '#D9622B', '#FF8FC4', '#6FB8FF', '#B48BFF', '#7FE3C8', '#FF5C5C', 'rainbow'];
const STICKERS = ['bow', 'flower', 'star', 'heart', 'clip', 'butterfly'];
const TOOLS = ['comb', 'scissors', 'grow', 'curl', 'dye', 'foam', 'shower', 'dryer', 'sticker'];
const TOOL_COL = { comb: P.pink, scissors: P.sky, grow: P.mint, curl: P.lilac, dye: P.coral, foam: '#BFE9FF', shower: P.teal, dryer: P.sun, sticker: P.rose };
const STYLES = [
  { len: 9, curl: 0 },   // shoulders
  { len: 16, curl: 0 },  // long
  { len: 5, curl: 0 },   // short
  { len: 11, curl: 0.8 } // curls
];
const MAX_NODES = 26;
let SEG = 13; // set from the size of the head, so that hair is the same length on every screen

const shadeMemo = new Map();
function shaded(col, s) {
  const k = col + ':' + s;
  let v = shadeMemo.get(k);
  if (!v) {
    v = s < 0 ? dark(col, -s) : light(col, s);
    shadeMemo.set(k, v);
  }
  return v;
}

export function drawSticker(c, id, r) {
  switch (id) {
    case 'bow':
      for (const s of [-1, 1]) {
        c.fillStyle = clay(c, s * r * 0.6, 0, r * 0.7, '#FF5C8F');
        ell(c, s * r * 0.62, 0, r * 0.62, r * 0.44, s * 0.2);
        c.fill();
      }
      c.fillStyle = '#FFC233';
      ell(c, 0, 0, r * 0.24);
      c.fill();
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU - 1.57;
        c.fillStyle = clay(c, Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.46, '#FFF');
        ell(c, Math.cos(a) * r * 0.54, Math.sin(a) * r * 0.54, r * 0.42);
        c.fill();
      }
      c.fillStyle = '#FFC233';
      ell(c, 0, 0, r * 0.34);
      c.fill();
      break;
    case 'star':
      softStar(c, 0, 0, r);
      c.fillStyle = clay(c, 0, 0, r, P.sun);
      c.fill();
      break;
    case 'heart':
      heart(c, 0, -r * 0.1, r * 0.9);
      c.fillStyle = clay(c, 0, 0, r, P.rose);
      c.fill();
      break;
    case 'clip':
      c.save();
      c.rotate(-0.4);
      c.fillStyle = hgrad(c, -r, r, '#8C68F2', '#C7ABFF');
      rr(c, -r, -r * 0.24, r * 2, r * 0.48, r * 0.24);
      c.fill();
      c.fillStyle = '#fff';
      for (const x of [-0.6, 0, 0.6]) {
        ell(c, x * r, 0, r * 0.11);
        c.fill();
      }
      c.restore();
      break;
    case 'butterfly':
      for (const s of [-1, 1]) {
        c.fillStyle = clay(c, s * r * 0.5, -r * 0.2, r * 0.6, '#6FC6FF');
        ell(c, s * r * 0.54, -r * 0.24, r * 0.5, r * 0.56, s * 0.3);
        c.fill();
        c.fillStyle = clay(c, s * r * 0.4, r * 0.4, r * 0.4, '#FF8FC4');
        ell(c, s * r * 0.4, r * 0.42, r * 0.36, r * 0.36);
        c.fill();
      }
      c.fillStyle = P.ink;
      ell(c, 0, 0, r * 0.1, r * 0.56);
      c.fill();
      break;
  }
}

function drawTool(c, id, r, t = 0, active = false) {
  c.save();
  c.scale(r / 24, r / 24);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  switch (id) {
    case 'comb':
      c.fillStyle = hgrad(c, -16, 16, '#FF8FC4', '#FF5C8F');
      rr(c, -17, -13, 34, 9, 4);
      c.fill();
      for (let i = 0; i < 8; i++) {
        rr(c, -16 + i * 4.4, -6, 2.8, 19, 1.4);
        c.fill();
      }
      break;
    case 'scissors': {
      const a = active ? 0.12 + Math.abs(Math.sin(t * 16)) * 0.22 : 0.26;
      for (const s of [-1, 1]) {
        c.save();
        c.rotate(s * a);
        c.fillStyle = '#C7CCE8';
        c.beginPath();
        c.moveTo(-3, 4); c.lineTo(0, -22); c.lineTo(3, 4);
        c.closePath();
        c.fill();
        c.strokeStyle = '#FF5C8F';
        c.lineWidth = 3.8;
        ell(c, -s * 4, 14, 5.6, 7.4);
        c.stroke();
        c.restore();
      }
      c.fillStyle = '#fff';
      ell(c, 0, 3, 2);
      c.fill();
      break;
    }
    case 'grow':
      c.fillStyle = hgrad(c, -9, 9, '#7FE3A0', '#3FB87A');
      rr(c, -10, -6, 20, 24, 6);
      c.fill();
      c.fillStyle = '#FFF';
      rr(c, -4, -14, 8, 9, 2);
      c.fill();
      softStar(c, 0, 6, 6.5);
      c.fillStyle = P.butter;
      c.fill();
      break;
    case 'curl':
      c.fillStyle = '#8C68F2';
      rr(c, -5, 2, 10, 18, 4);
      c.fill();
      c.fillStyle = '#C7CCE8';
      rr(c, -3.5, -20, 7, 23, 3.5);
      c.fill();
      c.strokeStyle = '#FF8FC4';
      c.lineWidth = 2.6;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(-7, -17 + i * 7);
        c.quadraticCurveTo(0, -12 + i * 7, 7, -15 + i * 7);
        c.stroke();
      }
      break;
    case 'dye':
      c.save();
      c.rotate(0.5);
      c.fillStyle = hgrad(c, -3, 3, '#FFC680', '#E08C47');
      rr(c, -3, -2, 6, 22, 3);
      c.fill();
      c.fillStyle = '#C7CCE8';
      rr(c, -4.5, -8, 9, 8, 2);
      c.fill();
      c.fillStyle = '#FF7F9F';
      c.beginPath();
      c.moveTo(-5, -7); c.quadraticCurveTo(-7, -17, 0, -24); c.quadraticCurveTo(7, -17, 5, -7);
      c.closePath();
      c.fill();
      c.restore();
      break;
    case 'foam':
      c.fillStyle = '#fff';
      for (const [x, y, q] of [[-8, 7, 8], [8, 7, 8], [0, -3, 10], [-11, -6, 5], [12, -8, 4.5]]) {
        ell(c, x, y, q);
        c.fill();
      }
      c.fillStyle = '#BFE9FF';
      ell(c, -2, -5, 2.6);
      c.fill();
      break;
    case 'shower':
      c.strokeStyle = '#AEBBD4';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(14, 18); c.lineTo(14, -6); c.quadraticCurveTo(14, -16, 2, -14);
      c.stroke();
      c.fillStyle = '#C7CCE8';
      c.beginPath();
      c.moveTo(-16, -6); c.lineTo(10, -16); c.lineTo(8, -7); c.lineTo(-12, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = '#6FC6FF';
      c.lineWidth = 2.6;
      for (const x of [-11, -5, 1]) {
        c.beginPath();
        c.moveTo(x, 3 - x * 0.25);
        c.lineTo(x - 3, 15 - x * 0.25);
        c.stroke();
      }
      break;
    case 'dryer':
      c.fillStyle = hgrad(c, -18, 16, '#FFB65C', '#FF8FC4');
      rr(c, -8, -12, 26, 18, 8);
      c.fill();
      c.fillStyle = '#8C68F2';
      c.beginPath();
      c.moveTo(-6, -10); c.lineTo(-18, -14); c.lineTo(-18, 7); c.lineTo(-6, 3);
      c.closePath();
      c.fill();
      c.fillStyle = '#FF8FC4';
      rr(c, 3, 3, 9, 18, 3);
      c.fill();
      break;
    case 'sticker':
      drawSticker(c, 'bow', 17);
      break;
  }
  c.restore();
}

// ---- the hair ---------------------------------------------------------------------
function makeStrand(layer, rootX, rootY, len, col, curl, dirX, phase) {
  const pts = [];
  for (let i = 0; i < MAX_NODES; i++) {
    const x = rootX + dirX * i * SEG * 0.5, y = rootY + i * SEG * 0.86;
    pts.push({ x, y, px: x, py: y, col });
  }
  return { layer, rootX, rootY, len, pts, curl, phase, wet: 0, shade: (Math.floor(phase * 10) % 5) * 0.05 - 0.1 };
}

export const salon = {
  tint: '#E7D6FF',

  enter() {
    this.t = 0;
    this.W = app.W;
    this.H = app.H;
    this.tool = 'comb';
    this.color = COLORS[4];
    this.stick = STICKERS[0];
    this.styleI = 0;
    this.clientI = 0;
    this.pieces = [];
    this.stickers = [];
    this.foam = [];
    this.drops = [];
    this.active = new Map();
    this.look = { x: 0, y: 0, on: 0 };
    this.expr = null;
    this.exprT = 0;
    this.sq = new Spring(1, 300, 11);
    this.flash = 0;
    this.finishT = 0;
    this.cutCount = 0;
    this.layout();
    this.newHair(save.data.doll && save.data.doll.hairCol && save.data.doll.hairCol !== 'rainbow' ? save.data.doll.hairCol : '#FF8FC4');
    music.play('dress');
    if (!save.data.seen.salon) hint.set({ from: [this.hx - this.R * 0.8, this.hy], to: [this.hx - this.R * 1.1, this.hy + this.R * 1.5], delay: 1.4 });
  },

  exit() {
    this.stopLoop();
    if (this.clientI === 0 && this.capCol && save.data.doll) {
      save.data.doll.hairCol = this.capCol;
      save.touch();
    }
  },

  clients() { return ['doll', ...save.data.friends]; },
  client() { const c = this.clients(); return c[this.clientI % c.length]; },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.wide = W > 640;
    const rows = this.wide ? 1 : 2;
    this.rowH = 66;
    this.panelH = 46 + rows * this.rowH + app.safeBottom * 0.7;
    this.panelY = H - this.panelH;
    const area = this.panelY - Math.max(app.safeTop, 8);
    this.R = Math.min(area * 0.27, (W - 100) * 0.36, 150);
    SEG = this.R * 0.15;
    this.hx = W / 2;
    this.hy = Math.max(app.safeTop, 8) + area * 0.36;
    const k = this.R / 58;
    this.k = k;
    const right = W - 42, top = Math.max(app.safeTop, 10) + 34;
    this.toolPos = TOOLS.map((id, i) => {
      if (this.wide) {
        const gap = Math.min(82, (W - 20) / TOOLS.length);
        return { id, x: W / 2 + (i - (TOOLS.length - 1) / 2) * gap, y: this.panelY + 54 };
      }
      const per = 5, row = i < per ? 0 : 1, n = row ? TOOLS.length - per : per, col = row ? i - per : i;
      const gap = Math.min(74, (W - 16) / per);
      return { id, x: W / 2 + (col - (n - 1) / 2) * gap, y: this.panelY + 42 + row * this.rowH };
    });
    this.buttons = [
      new Btn({
        x: right, y: top, r: 26, slop: 6, paint: (c, r) => {
          candy(c, r, '#58CC7A');
          c.strokeStyle = '#fff';
          c.lineWidth = 6;
          c.lineCap = 'round';
          c.lineJoin = 'round';
          c.beginPath();
          c.moveTo(-11, 1); c.lineTo(-3, 9); c.lineTo(12, -8);
          c.stroke();
        }, tap: () => this.finish()
      }),
      new Btn({
        x: right, y: top + 62, r: 26, slop: 6, paint: (c, r) => {
          candy(c, r, P.violet);
          // A wig on a stand
          c.fillStyle = '#fff';
          c.beginPath();
          c.moveTo(-14, 10);
          c.bezierCurveTo(-18, -18, 18, -18, 14, 10);
          c.quadraticCurveTo(8, 4, 7, -1);
          c.quadraticCurveTo(0, -4, -7, -1);
          c.quadraticCurveTo(-8, 4, -14, 10);
          c.fill();
        }, tap: () => this.nextStyle()
      }),
      new Btn({
        x: right, y: top + 124, r: 26, slop: 6, paint: (c, r) => {
          candy(c, r, '#FFD9E4');
          const id = this.clients()[(this.clientI + 1) % this.clients().length];
          if (id === 'doll') {
            c.save();
            c.scale(0.26, 0.26);
            c.translate(0, 92);
            drawDollHead(c, { ...DEFAULT_DOLL, ...(save.data.doll || {}) }, { t: 0 });
            c.restore();
          } else drawCreature(c, id, { R: r * 0.56, t: this.t });
        }, tap: () => this.nextClient()
      })
    ];
    this.setRoots();
  },

  resize() {
    this.layout();
    this.newHair(this.capCol);
  },

  // Roots follow the head: an arc over the top for hair behind it, a hairline in front
  headShape() {
    const R = this.R, doll = this.client() === 'doll';
    return { cx: this.hx, cy: this.hy, rx: R * (doll ? 1 : 1.0), ry: R * (doll ? 0.95 : 0.97) };
  },
  setRoots() {
    this.head = this.headShape();
  },

  newHair(col) {
    this.setRoots();
    const { cx, cy, rx, ry } = this.head;
    const st = STYLES[this.styleI % STYLES.length];
    this.capCol = col;
    this.strands = [];
    // Behind the head
    const B = 58;
    for (let i = 0; i < B; i++) {
      const u = i / (B - 1), a = Math.PI * (1.02 + u * 0.96);
      const x = cx + Math.cos(a) * rx * 0.98, y = cy + Math.sin(a) * ry * 0.98;
      this.strands.push(makeStrand('back', x, y, st.len + (i % 3) * 0.6, col, st.curl, Math.cos(a) * 0.8, rand(TAU)));
    }
    // Locks falling in front of the shoulders, framing the face
    for (const s of [-1, 1]) {
      for (let i = 0; i < 15; i++) {
        const a = -Math.PI / 2 + s * (0.84 + i * 0.05);
        const x = cx + Math.cos(a) * rx * 0.93, y = cy + Math.sin(a) * ry * 0.93;
        this.strands.push(makeStrand('side', x, y, st.len - 1 + (i % 2), col, st.curl, s * 0.5, rand(TAU)));
      }
    }
    // Fringe: short at first, so that there is something to grow over her eyes
    for (let i = 0; i < 19; i++) {
      const u = i / 18 * 2 - 1;
      const x = cx + u * rx * 0.66, y = cy - ry * (0.6 + (1 - u * u) * 0.08);
      this.strands.push(makeStrand('fringe', x, y, 2.4 + (i % 2) * 0.4, col, st.curl * 0.6, u * 0.2, rand(TAU)));
    }
    this.stickers = [];
    this.foam = [];
    this.pieces = [];
    // Let the hair settle before anyone sees it, so that a new style lands combed
    this.windAt = null;
    for (let i = 0; i < 50; i++) this.stepHair(1 / 40);
    for (const q of this.strands) for (const pt of q.pts) { pt.px = pt.x; pt.py = pt.y; }
  },

  nextStyle() {
    this.styleI = (this.styleI + 1) % STYLES.length;
    this.newHair(this.capCol);
    this.sq.kick(5);
    audio.sparkle(2, 5, 0.4);
    audio.sfx('whoosh');
    fx.burst(this.hx, this.hy - this.R, { kind: 'star', n: 14, colors: [P.sun, P.pink, P.lilac], speed: 280, size: 18, g: 200 });
    this.react('wow', 1);
  },

  nextClient() {
    const list = this.clients();
    this.clientI = (this.clientI + 1) % list.length;
    audio.sfx('swish');
    audio.voice('wow', 1.1, 0.6);
    this.newHair(pick(HAIR_COLORS.filter((k) => k !== 'rainbow')));
    this.sq.kick(6);
    this.react('happy', 1);
    fx.sparkle(this.hx, this.hy, 16);
  },

  react(e, t) {
    this.expr = e;
    this.exprT = t;
  },

  finish() {
    audio.fanfare();
    fx.confetti(this.W, this.H, 90);
    this.sq.kick(7);
    this.react('happy', 2.2);
    fx.hearts(this.hx, this.hy - this.R, 8);
    save.data.seen.salon = 1;
    if (this.stickers.length || this.cutCount || this.dirty) save.earnStar();
    this.dirty = false;
    this.cutCount = 0;
    // A snapshot for the album, taken as she looks now
    this.flash = 1;
    audio.sfx('shutter', { vol: 1 });
    this.wantPhoto = true;
  },

  takePhoto() {
    try {
      const cv = document.createElement('canvas');
      cv.width = 240;
      cv.height = 300;
      const x = cv.getContext('2d');
      const k = app.pr * app.scale, h = (this.panelY - 6) * k, w = Math.min(h * 0.8, app.canvas.width);
      x.drawImage(app.canvas, (app.canvas.width - w) / 2, 0, w, w / 0.8, 0, 0, 240, 300);
      save.addPhoto(cv.toDataURL('image/jpeg', 0.72));
    } catch (e) {}
  },

  stopLoop() { if (this.loopS) { this.loopS.stop(); this.loopS = null; } },

  // --- physics ---------------------------------------------------------------------------
  stepHair(dt) {
    const h = Math.min(dt, 1 / 40);
    const { cx, cy, rx, ry } = this.head;
    const g = 1100 * h * h;
    const wind = this.windAt;
    const pull = this.combPull;
    const bobX = (this.sq.x - 1) * 8;
    for (const s of this.strands) {
      const n = Math.min(MAX_NODES, Math.ceil(s.len) + 1);
      const P0 = s.pts[0];
      P0.x = s.rootX;
      P0.y = s.rootY + bobX;
      const grav = g * (1 + s.wet * 0.5);
      for (let i = 1; i < n; i++) {
        const q = s.pts[i];
        const vx = (q.x - q.px) * 0.95, vy = (q.y - q.py) * 0.95;
        q.px = q.x;
        q.py = q.y;
        q.x += vx;
        q.y += vy + grav;
        if (wind) {
          const dx = q.x - wind.x, dy = q.y - wind.y, d = Math.hypot(dx, dy);
          if (d < wind.r) {
            const f = (1 - d / wind.r) * wind.f * h * h * (0.7 + 0.5 * Math.sin(this.t * 22 + i + s.phase));
            q.x += (dx / (d || 1)) * f;
            q.y += (dy / (d || 1)) * f;
          }
        }
        if (pull) {
          for (const c of pull) {
            const d = dist(q.x, q.y, c.x, c.y);
            if (d < c.r) {
              const w = (1 - d / c.r) * 0.82;
              q.x += c.dx * w;
              q.y += c.dy * w;
            }
          }
        }
      }
      // The next node waits at the tip, ready to grow out from there
      if (n < MAX_NODES) {
        const tip = s.pts[n - 1], nx = s.pts[n];
        nx.x = nx.px = tip.x;
        nx.y = nx.py = tip.y;
        nx.col = tip.col;
      }
      for (let it = 0; it < 3; it++) {
        for (let i = 1; i < n; i++) {
          const a = s.pts[i - 1], b = s.pts[i];
          const rest = i === n - 1 ? SEG * Math.max(0.05, s.len - Math.floor(s.len) || 1) : SEG;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
          const f = (d - rest) / d;
          if (i === 1) {
            b.x -= dx * f;
            b.y -= dy * f;
          } else {
            a.x += dx * f * 0.5;
            a.y += dy * f * 0.5;
            b.x -= dx * f * 0.5;
            b.y -= dy * f * 0.5;
          }
        }
        // Hair lies around the head instead of passing through it
        if (s.layer !== 'fringe') {
          const k = s.layer === 'side' ? 0.8 : 1;
          for (let i = 1; i < n; i++) {
            const q = s.pts[i];
            if (s.layer === 'back' && q.y > cy + ry * 0.2) continue;
            const ex = (q.x - cx) / (rx * k), ey = (q.y - cy) / (ry * k), d = Math.hypot(ex, ey);
            if (d < 1 && d > 0.001) {
              q.x = cx + (ex / d) * rx * k;
              q.y = cy + (ey / d) * ry * k;
            }
          }
        }
      }
      if (s.wet > 0) s.wet = Math.max(0, s.wet - dt * 0.05);
    }
    this.combPull = null;

    for (const q of this.pieces) {
      q.vy += 1500 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.rot += q.spin * dt;
    }
    this.pieces = this.pieces.filter((q) => q.y < this.H + 60);
    if (this.pieces.length > 50) this.pieces.splice(0, this.pieces.length - 50);
  },

  update(dt) {
    this.t += dt;
    this.sq.step(dt);
    this.exprT = Math.max(0, this.exprT - dt);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.look.on = Math.max(0, this.look.on - dt);
    let windy = null;
    for (const p of this.active.values()) {
      this.look.x = p.x; this.look.y = p.y; this.look.on = 0.5;
      this.useTool(p, dt);
      if (this.tool === 'dryer') windy = p;
    }
    this.windAt = windy ? { x: windy.x, y: windy.y + 12, r: this.R * 2.4, f: 5200 } : null;
    this.stepHair(dt);
    // Droplets from the shower
    for (const d of this.drops) {
      d.vy += 1400 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    this.drops = this.drops.filter((d) => d.y < this.H);
    for (const f of this.foam) f.s = Math.min(1, f.s + dt * 6);
  },

  /** Which hair is touching a point? Returns matching strand/node pairs. */
  near(x, y, r, fn) {
    for (const s of this.strands) {
      const n = Math.min(MAX_NODES, Math.ceil(s.len) + 1);
      for (let i = 0; i < n; i++) {
        const q = s.pts[i];
        const d = dist(x, y, q.x, q.y);
        if (d < r) fn(s, q, i, d);
      }
    }
  },

  useTool(p, dt) {
    const T = this.tool, moved = p.lastT ? dist(p.x, p.y, p.lastT.x, p.lastT.y) : 0;
    const prev = p.lastT || { x: p.x, y: p.y };
    if (T === 'comb') {
      if (moved > 0.5) {
        this.combPull = this.combPull || [];
        this.combPull.push({ x: p.x, y: p.y, r: 26 * this.k + 12, dx: p.x - prev.x, dy: p.y - prev.y });
        const seen = new Set();
        this.near(p.x, p.y, 30 * this.k, (s) => {
          if (seen.has(s)) return;
          seen.add(s);
          s.curl = Math.max(0, s.curl - dt * 0.8);
        });
        if (seen.size && Math.random() < 0.2) audio.sfx('scrub', { rate: rand(0.9, 1.3), vol: 0.6, gap: 90 });
        if (seen.size && Math.random() < 0.06) { this.react('happy', 0.8); fx.sparkle(p.x, p.y, 2); }
      }
    } else if (T === 'scissors') {
      this.cut(prev, p);
    } else if (T === 'grow') {
      let hit = 0;
      const seen = new Set();
      this.near(p.x, p.y, 34 * this.k, (s) => {
        if (seen.has(s)) return;
        seen.add(s);
        s.len = Math.min(MAX_NODES - 1, s.len + dt * 7);
        hit++;
      });
      if (hit) {
        this.dirty = true;
        if (Math.random() < dt * 14) {
          fx.add({ kind: 'sparkle', x: p.x + rand(-26, 26), y: p.y + rand(-26, 26), vy: 60, size: 16, life: 0.5, color: P.mint });
          audio.note('bell', penta(Math.floor(this.t * 6) % 10), { vol: 0.2, wet: 0.7 });
        }
      }
    } else if (T === 'curl') {
      let hit = 0;
      const seen = new Set();
      this.near(p.x, p.y, 34 * this.k, (s) => {
        if (seen.has(s)) return;
        seen.add(s);
        s.curl = Math.min(1, s.curl + dt * 1.6);
        hit++;
      });
      if (hit) {
        this.dirty = true;
        if (Math.random() < dt * 9) {
          fx.add({ kind: 'dot', x: p.x + rand(-14, 14), y: p.y, vy: -60, g: -40, size: rand(8, 14), life: 0.7, color: '#FFFFFF' });
          audio.sfx('flame', { rate: rand(1.4, 1.9), vol: 0.3, gap: 130 });
        }
      }
    } else if (T === 'dye') {
      let hit = 0;
      const col = this.color === 'rainbow' ? null : this.color;
      this.near(p.x, p.y, 26 * this.k, (s, q, i) => {
        q.col = col || RAINBOW[(i + Math.floor(s.phase)) % RAINBOW.length];
        hit++;
      });
      const capDist = dist(p.x, p.y, this.hx, this.hy - this.head.ry * 0.7);
      if (capDist < this.head.rx * 0.8) this.capCol = col || RAINBOW[Math.floor(this.t * 2) % 6];
      if (hit) {
        this.dirty = true;
        if (Math.random() < dt * 8) audio.sfx('squish2', { rate: rand(1.1, 1.5), vol: 0.35, gap: 120 });
      }
    } else if (T === 'foam') {
      if (moved > 2 || !p.foamed) {
        p.foamed = true;
        let best = null, bd = 44 * this.k;
        this.near(p.x, p.y, 44 * this.k, (s, q, i, d) => { if (d < bd) { bd = d; best = { s, i }; } });
        const onHead = dist(p.x, p.y, this.hx, this.hy) < this.R * 1.2;
        if ((best || onHead) && this.foam.length < 70) {
          this.foam.push(best ? { s: 0, st: best.s, i: best.i, ox: rand(-12, 12), oy: rand(-10, 10), r: rand(9, 18) * this.k } : { s: 0, x: p.x, y: p.y, r: rand(10, 18) * this.k });
          audio.sfx('squish', { rate: rand(1.1, 1.6), vol: 0.4, gap: 90 });
          this.react('closed', 0.7);
          this.dirty = true;
        }
      }
    } else if (T === 'shower') {
      for (let i = 0; i < 2; i++) this.drops.push({ x: p.x + rand(-26, 26), y: p.y + 16, vx: rand(-20, 20), vy: rand(200, 420), r: rand(2, 3.6) });
      this.near(p.x, p.y + 60, 70 * this.k, (s) => { s.wet = 1; s.curl = Math.max(0, s.curl - dt * 0.4); });
      const before = this.foam.length;
      this.foam = this.foam.filter((f) => {
        const pos = this.foamPos(f);
        if (Math.abs(pos.x - p.x) < 44 && pos.y > p.y - 10) {
          if (Math.random() < 0.4) fx.bubbles(pos.x, pos.y, 1);
          return false;
        }
        return true;
      });
      if (before !== this.foam.length) this.react('happy', 0.8);
    } else if (T === 'dryer') {
      this.near(p.x, p.y, this.R * 2.2, (s) => { s.wet = Math.max(0, s.wet - dt * 1.6); });
      if (Math.random() < dt * 2) this.react('happy', 0.8);
    }
    p.lastT = { x: p.x, y: p.y };
  },

  foamPos(f) {
    if (f.st) {
      const q = f.st.pts[Math.min(f.i, Math.max(1, Math.ceil(f.st.len)))];
      return { x: q.x + f.ox, y: q.y + f.oy };
    }
    return { x: f.x, y: f.y };
  },

  cut(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    let snips = 0;
    for (const s of this.strands) {
      const n = Math.min(MAX_NODES, Math.ceil(s.len) + 1);
      for (let i = 2; i < n; i++) {
        const q = s.pts[i];
        // Distance from the node to the path of the blades
        const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / (len * len));
        const d = dist(q.x, q.y, a.x + dx * t, a.y + dy * t);
        if (d < 10 * this.k) {
          this.dropPiece(s, i, n);
          s.len = i - 1 + 0.01;
          snips++;
          break;
        }
      }
    }
    if (snips) {
      audio.sfx('snip', { rate: rand(0.95, 1.15), vol: 1, gap: 90 });
      haptic();
      this.cutCount += snips;
      if (Math.random() < 0.2) this.react('wow', 0.6);
      save.data.seen.salon = 1;
      hint.clear();
    }
  },

  dropPiece(s, i, n) {
    const pts = [];
    for (let k = i; k < n; k++) pts.push({ x: s.pts[k].x, y: s.pts[k].y, col: s.pts[k].col });
    if (pts.length < 1) return;
    const a = pts[0];
    this.pieces.push({ pts: pts.map((q) => ({ x: q.x - a.x, y: q.y - a.y, col: q.col })), x: a.x, y: a.y, vx: rand(-40, 40), vy: rand(-60, 20), rot: 0, spin: rand(-2, 2), curl: s.curl, phase: s.phase });
    // Anything pinned to that hair falls off with it
    this.stickers = this.stickers.filter((st) => {
      if (st.st === s && st.i >= i) {
        const q = s.pts[st.i];
        fx.add({ kind: 'star', x: q.x, y: q.y, vy: 60, g: 900, size: 22, life: 0.8, color: P.sun });
        return false;
      }
      return true;
    });
    this.foam = this.foam.filter((f) => !(f.st === s && f.i >= i));
    // Regrown hair must start from a sensible place
    const r = s.pts[i - 1];
    for (let k = i; k < MAX_NODES; k++) {
      s.pts[k].x = s.pts[k].px = r.x;
      s.pts[k].y = s.pts[k].py = r.y + (k - i + 1) * 2;
    }
  },

  // --- drawing ---------------------------------------------------------------------------
  strandPath(s) {
    // Curls wiggle the drawn hair sideways, more towards the tips
    const n = Math.min(MAX_NODES, Math.ceil(s.len) + 1);
    const out = s._out || (s._out = []);
    out.length = 0;
    const amp = s.curl * (1 - s.wet * 0.7) * 12 * this.k;
    for (let i = 0; i < n; i++) {
      const q = s.pts[i];
      if (amp > 0.2 && i > 0) {
        const pr = s.pts[i - 1], dx = q.x - pr.x, dy = q.y - pr.y, d = Math.hypot(dx, dy) || 1;
        const w = amp * Math.min(1, i / 3) * Math.sin(i * 1.5 + s.phase);
        out.push(q.x - (dy / d) * w, q.y + (dx / d) * w);
      } else out.push(q.x, q.y);
    }
    return n;
  },

  drawStrand(c, s, width) {
    const n = this.strandPath(s), o = s._out;
    if (n < 2) return;
    c.lineWidth = width;
    const wetDark = s.wet > 0.3 ? -0.14 : 0;
    let i = 0;
    while (i < n - 1) {
      const col = s.pts[i].col;
      let j = i + 1;
      while (j < n - 1 && s.pts[j].col === col) j++;
      c.strokeStyle = shaded(col, Math.round((s.shade + wetDark) * 100) / 100 || 0.001);
      c.beginPath();
      c.moveTo(o[i * 2], o[i * 2 + 1]);
      for (let k = i + 1; k < j; k++) {
        const mx = (o[k * 2] + o[k * 2 + 2]) / 2, my = (o[k * 2 + 1] + o[k * 2 + 3]) / 2;
        c.quadraticCurveTo(o[k * 2], o[k * 2 + 1], mx, my);
      }
      c.lineTo(o[j * 2], o[j * 2 + 1]);
      c.stroke();
      i = j;
    }
  },

  drawLayer(c, layer) {
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const w = (layer === 'back' ? 7 : layer === 'fringe' ? 5.6 : 5.2) * this.k;
    for (const s of this.strands) if (s.layer === layer) this.drawStrand(c, s, w);
    // A sheen across some of the strands
    c.strokeStyle = 'rgba(255,255,255,.2)';
    c.lineWidth = 1.5 * this.k;
    let idx = 0;
    for (const s of this.strands) {
      if (s.layer !== layer || idx++ % 3) continue;
      const n = Math.min(this.strandPath(s), 6), o = s._out;
      if (n < 3) continue;
      c.beginPath();
      c.moveTo(o[2], o[3]);
      for (let k = 2; k < n; k++) c.lineTo(o[k * 2], o[k * 2 + 1]);
      c.stroke();
    }
  },

  drawCap(c) {
    const { cx, cy, rx, ry } = this.head;
    const col = this.capCol || '#FF8FC4';
    c.fillStyle = vgrad(c, cy - ry, cy - ry * 0.2, light(col, 0.18), col);
    c.beginPath();
    c.moveTo(cx - rx * 1.02, cy - ry * 0.14);
    c.bezierCurveTo(cx - rx * 1.08, cy - ry * 1.3, cx + rx * 1.08, cy - ry * 1.3, cx + rx * 1.02, cy - ry * 0.14);
    c.bezierCurveTo(cx + rx * 0.84, cy - ry * 0.46, cx + rx * 0.46, cy - ry * 0.62, cx, cy - ry * 0.64);
    c.bezierCurveTo(cx - rx * 0.46, cy - ry * 0.62, cx - rx * 0.84, cy - ry * 0.46, cx - rx * 1.02, cy - ry * 0.14);
    c.fill();
    gloss(c, cx - rx * 0.32, cy - ry * 0.86, rx * 0.4, ry * 0.12, 0.42);
  },

  drawClient(c) {
    const id = this.client(), q = this.sq.x;
    const lk = this.look.on > 0;
    const lx = lk ? clamp((this.look.x - this.hx) / 120, -1, 1) : 0, ly = lk ? clamp((this.look.y - this.hy) / 150, -1, 1) : 0;
    const blink = this.exprT > 0 ? 0 : blinkAt(this.t, 2);
    if (id === 'doll') {
      const d = { ...DEFAULT_DOLL, ...(save.data.doll || {}) };
      const k = this.k;
      // Neck and a salon cape
      c.save();
      c.translate(this.hx, this.hy);
      c.scale(k * (2 - q), k * q);
      const capeTop = 50;
      c.fillStyle = hgrad(c, -70, 70, '#8C68F2', '#B59BF7', '#7C58E2');
      c.beginPath();
      c.moveTo(-16, capeTop);
      c.bezierCurveTo(-80, capeTop + 16, -92, capeTop + 100, -100, capeTop + 700);
      c.lineTo(100, capeTop + 700);
      c.bezierCurveTo(92, capeTop + 100, 80, capeTop + 16, 16, capeTop);
      c.closePath();
      c.fill();
      c.fillStyle = '#FFFFFF';
      for (let i = -3; i <= 3; i++) {
        softStar(c, i * 24, capeTop + 56 + Math.abs(i) * 6, 5);
        c.fill();
      }
      c.fillStyle = '#FFF';
      rr(c, -24, capeTop - 6, 48, 13, 6);
      c.fill();
      c.translate(0, 92);
      const expr = this.exprT > 0 ? (this.expr === 'closed' ? 'happy' : this.expr) : 'open';
      drawDollHead(c, d, { t: this.t, expr, blink, lookX: lx, lookY: ly });
      c.restore();
    } else {
      const R = this.R * 0.98;
      c.save();
      c.translate(this.hx, this.hy);
      c.scale(2 - q, q);
      drawCreature(c, id, {
        R, t: this.t, blink, lookX: lx, lookY: ly, eyes: this.exprT > 0 ? this.expr : 'open',
        mouthOpen: this.exprT > 0 && this.expr !== 'closed' ? 0.6 : 0
      });
      c.restore();
    }
  },

  draw(c) {
    const W = this.W, H = this.H;
    const back = softBack('salon', W, H, '#EFE4FF', '#FFE1EE', (x) => {
      // Wallpaper dots, and a big mirror behind the client
      x.fillStyle = 'rgba(255,255,255,.4)';
      for (let i = 0; i < W / 34; i++) {
        for (let j = 0; j < H / 34; j++) {
          ell(x, i * 34 + (j % 2) * 17, j * 34, 3);
          x.fill();
        }
      }
      const R = this.R;
      x.fillStyle = '#FFE1A8';
      ell(x, this.hx, this.hy + R * 0.2, R * 2.06, R * 2.3);
      x.fill();
      const g = x.createLinearGradient(this.hx - R, this.hy - R * 2, this.hx + R, this.hy + R * 2);
      g.addColorStop(0, '#E8F6FF');
      g.addColorStop(0.5, '#FFFFFF');
      g.addColorStop(1, '#D8EEFF');
      x.fillStyle = g;
      ell(x, this.hx, this.hy + R * 0.2, R * 1.9, R * 2.14);
      x.fill();
      x.fillStyle = vgrad(x, this.panelY - 30, H, '#D8A9C8', '#B987B2');
      x.fillRect(0, this.panelY - 30, W, H);
    });
    c.drawImage(back.cv, 0, 0, W, H);

    this.drawLayer(c, 'back');
    this.drawClient(c);
    this.drawCap(c);
    this.drawLayer(c, 'side');
    this.drawLayer(c, 'fringe');

    // Foam sits on the hair
    for (const f of this.foam) {
      const pos = this.foamPos(f);
      c.fillStyle = 'rgba(255,255,255,.95)';
      ell(c, pos.x, pos.y, f.r * f.s);
      c.fill();
      c.fillStyle = 'rgba(190,233,255,.6)';
      ell(c, pos.x - f.r * 0.3, pos.y - f.r * 0.3, f.r * 0.2 * f.s);
      c.fill();
    }
    for (const st of this.stickers) {
      const q = st.st ? st.st.pts[Math.min(st.i, Math.max(1, Math.ceil(st.st.len)))] : st;
      c.save();
      c.translate(q.x, q.y);
      c.rotate(st.rot);
      const k = st.s;
      c.scale(k, k);
      drawSticker(c, st.id, 15 * this.k);
      c.restore();
    }
    // Falling snippets
    c.lineCap = 'round';
    for (const q of this.pieces) {
      c.save();
      c.translate(q.x, q.y);
      c.rotate(q.rot);
      c.lineWidth = 5 * this.k;
      c.strokeStyle = q.pts[0].col;
      c.beginPath();
      q.pts.forEach((o, i) => c[i ? 'lineTo' : 'moveTo'](o.x, o.y));
      if (q.pts.length === 1) c.lineTo(1, 6);
      c.stroke();
      c.restore();
    }
    c.fillStyle = '#7CCBFF';
    for (const d of this.drops) {
      ell(c, d.x, d.y, d.r, d.r * 1.8);
      c.fill();
    }
    if (this.wantPhoto) {
      this.wantPhoto = false;
      this.takePhoto();
    }
    this.drawPanel(c);
    for (const b of this.buttons) b.draw(c);

    // The tool in hand, just above the fingertip
    for (const p of this.active.values()) {
      const r = 34;
      c.save();
      c.translate(p.x - 8, p.y - 30);
      if (this.tool === 'sticker') drawSticker(c, this.stick, 18 * this.k);
      else {
        if (this.tool === 'dryer' || this.tool === 'shower') c.rotate(-0.2);
        drawTool(c, this.tool, r, this.t, true);
      }
      if (this.tool === 'dye') {
        c.fillStyle = this.color === 'rainbow' ? RAINBOW[Math.floor(this.t * 6) % 6] : this.color;
        ell(c, 14, -24, 8);
        c.fill();
      }
      c.restore();
    }
    if (this.flash > 0) {
      c.fillStyle = `rgba(255,255,255,${this.flash})`;
      c.fillRect(0, 0, W, H);
    }
  },

  drawPanel(c) {
    const W = this.W, y = this.panelY;
    c.save();
    c.shadowColor = 'rgba(70,40,130,.28)';
    c.shadowBlur = 14;
    c.shadowOffsetY = -3;
    c.fillStyle = '#FFF9F1';
    rr(c, -10, y, W + 20, this.panelH + 30, 26);
    c.fill();
    c.restore();
    for (const q of this.toolPos) {
      const on = q.id === this.tool, col = TOOL_COL[q.id], r = on ? 29 : 26;
      c.save();
      c.translate(q.x, q.y + (on ? -3 : 0));
      c.fillStyle = dark(col, 0.14);
      ell(c, 0, 2.5, r);
      c.fill();
      c.fillStyle = clay(c, 0, 0, r, on ? col : mix(col, '#FFFFFF', 0.45));
      ell(c, 0, 0, r);
      c.fill();
      if (on) {
        c.lineWidth = 3;
        c.strokeStyle = '#fff';
        ell(c, 0, 0, r - 2);
        c.stroke();
      }
      drawTool(c, q.id, r * 0.78, this.t);
      c.restore();
    }
    // Colours or stickers appear on the left when they are needed
    this.palette = null;
    if (this.tool === 'dye' || this.tool === 'sticker') {
      const list = this.tool === 'dye' ? COLORS : STICKERS;
      const room = y - Math.max(app.safeTop, 10) - 92;
      const step = Math.min(50, room / list.length);
      this.palette = list.map((v, i) => ({ v, x: 34, y: y - 32 - i * step, r: Math.min(21, step * 0.46) }));
      for (const q of this.palette) {
        const on = (this.tool === 'dye' ? this.color : this.stick) === q.v;
        c.save();
        c.translate(q.x, q.y);
        c.fillStyle = 'rgba(70,40,130,.2)';
        ell(c, 0, 3, q.r);
        c.fill();
        if (this.tool === 'sticker') {
          c.fillStyle = '#fff';
          ell(c, 0, 0, q.r);
          c.fill();
          drawSticker(c, q.v, q.r * 0.7);
        } else if (q.v === 'rainbow') {
          RAINBOW.forEach((k, i) => {
            c.fillStyle = k;
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(0, 0, q.r, (i / 6) * TAU, ((i + 1) / 6) * TAU);
            c.fill();
          });
        } else {
          c.fillStyle = clay(c, 0, 0, q.r, q.v);
          ell(c, 0, 0, q.r);
          c.fill();
        }
        c.lineWidth = on ? 4 : 2.4;
        c.strokeStyle = on ? P.sun : '#fff';
        ell(c, 0, 0, q.r);
        c.stroke();
        c.restore();
      }
    }
  },

  // --- input ------------------------------------------------------------------------------
  down(p) {
    if (p.y >= this.panelY) {
      let best = null, bd = 44;
      for (const q of this.toolPos) {
        const d = dist(p.x, p.y, q.x, q.y);
        if (d < bd) { bd = d; best = q; }
      }
      if (best) {
        this.tool = best.id;
        audio.note('marimba', penta(TOOLS.indexOf(best.id)), { vol: 0.6 });
        haptic();
      }
      return;
    }
    if (this.palette) {
      for (const q of this.palette) {
        if (dist(p.x, p.y, q.x, q.y) < q.r + 7) {
          if (this.tool === 'dye') this.color = q.v;
          else this.stick = q.v;
          audio.note('bell', penta(this.palette.indexOf(q)), { vol: 0.45 });
          haptic();
          return;
        }
      }
    }
    hint.clear();
    if (this.tool === 'sticker') {
      this.placeSticker(p);
      return;
    }
    this.active.set(p.id, p);
    p.lastT = { x: p.x, y: p.y };
    if (this.tool === 'dryer' && !this.loopS) this.loopS = audio.loop('rumble', 0.28, 1.9);
    if (this.tool === 'shower' && !this.loopS) this.loopS = audio.loop('hiss', 0.22, 1.1);
    if (this.tool === 'grow') audio.sfx('blup', { rate: 1.3, vol: 0.5 });
    save.data.seen.salon = 1;
  },

  placeSticker(p) {
    let best = null, bd = 34 * this.k;
    this.near(p.x, p.y, bd, (s, q, i, d) => {
      if (d < bd && i > 0) { bd = d; best = { st: s, i }; }
    });
    if (this.stickers.length >= 16) this.stickers.shift();
    const st = { id: this.stick, rot: rand(-0.4, 0.4), s: 0, ...(best || { x: p.x, y: p.y }) };
    if (!best && dist(p.x, p.y, this.hx, this.hy) > this.R * 1.5) {
      fx.sparkle(p.x, p.y, 4);
      audio.sfx('plip', { vol: 0.4 });
      return;
    }
    this.stickers.push(st);
    tween(st, { s: 1 }, 0.3, { ease: E.back });
    audio.note('marimba', penta(Math.floor(rand(0, 8))), { vol: 0.55 });
    fx.sparkle(p.x, p.y, 8);
    this.react('happy', 0.9);
    this.dirty = true;
    haptic();
  },

  up(p) {
    if (this.active.delete(p.id) && !this.active.size) this.stopLoop();
  }
};
