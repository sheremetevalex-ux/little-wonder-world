// The café: friends sit at the counter and show what they would like in a little
// thought bubble. Tap one and make it: stack a burger, scoop ice cream, roll and
// top a pizza, flip pancakes, whizz up a smoothie. Then they eat it, bite by bite.
// The more friends she has hatched, the more customers come. Nothing can go wrong.
import { app, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, vgrad, hgrad, glow, TAU, softStar, heart, groundShadow, mix } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature, FRIENDS, blinkAt } from '../art/creatures.js';

const DISHES = ['burger', 'icecream', 'pizza', 'pancake', 'smoothie'];

// ---- food drawing, all centred on 0,0 ------------------------------------------------
const LAYERS = {
  patty: { h: 15, col: '#8A5230', draw(c, w) { c.fillStyle = vgrad(c, -8, 8, '#A6683F', '#6E3F24'); rr(c, -w, -8, w * 2, 16, 8); c.fill(); } },
  cheese: {
    h: 5, col: '#FFD24D', draw(c, w) {
      c.fillStyle = '#FFD24D';
      c.beginPath();
      c.moveTo(-w - 2, -3); c.lineTo(w + 2, -3); c.lineTo(w, 4); c.lineTo(w * 0.42, 4); c.lineTo(w * 0.2, 16); c.lineTo(-w * 0.04, 4); c.lineTo(-w, 4);
      c.closePath();
      c.fill();
    }
  },
  lettuce: {
    h: 6, col: '#7FD86F', draw(c, w) {
      c.fillStyle = '#7FD86F';
      c.beginPath();
      c.moveTo(-w - 5, 0);
      for (let i = 0; i <= 8; i++) c.quadraticCurveTo(-w - 5 + (i + 0.5) * ((w * 2 + 10) / 9), i % 2 ? 11 : -3, -w - 5 + (i + 1) * ((w * 2 + 10) / 9), 3);
      c.lineTo(w + 5, -4);
      c.lineTo(-w - 5, -4);
      c.closePath();
      c.fill();
    }
  },
  tomato: { h: 7, col: '#E8473F', draw(c, w) { for (const s of [-1, 1]) { c.fillStyle = vgrad(c, -4, 4, '#FF6F61', '#D93A34'); rr(c, s * w * 0.5 - w * 0.48, -4, w * 0.96, 8, 4); c.fill(); } } },
  egg: {
    h: 7, col: '#FFF8EA', draw(c, w) {
      c.fillStyle = '#FFF8EA';
      rr(c, -w + 3, -4, w * 2 - 6, 8, 4);
      c.fill();
      c.fillStyle = clay(c, 0, -3, 12, '#FFC233');
      ell(c, 0, -3, 12, 6);
      c.fill();
    }
  },
  onion: { h: 5, col: '#E2B8F0', draw(c, w) { c.strokeStyle = '#E2B8F0'; c.lineWidth = 4; for (const x of [-0.56, 0, 0.56]) { ell(c, x * w, 0, w * 0.27, 3.5); c.stroke(); } } },
  pickle: { h: 5, col: '#7FB84D', draw(c, w) { for (const x of [-0.6, -0.04, 0.5]) { c.fillStyle = '#7FB84D'; ell(c, x * w, 0, w * 0.24, 4); c.fill(); } } },
  bacon: { h: 5, col: '#D9694F', draw(c, w) { c.strokeStyle = '#D9694F'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-w, 0); for (let i = 1; i <= 8; i++) c.lineTo(-w + (i / 8) * w * 2, i % 2 ? -3 : 3); c.stroke(); } }
};

function bun(c, w, top) {
  if (top) {
    c.fillStyle = clay(c, 0, -16, w * 1.1, '#E9A85C');
    c.beginPath();
    c.moveTo(-w - 2, 10);
    c.bezierCurveTo(-w - 2, -28, w + 2, -28, w + 2, 10);
    c.quadraticCurveTo(0, 15, -w - 2, 10);
    c.fill();
    c.fillStyle = '#FFF3D6';
    for (let i = 0; i < 9; i++) {
      ell(c, -w * 0.7 + (i * w * 1.4) / 8, -10 - ((i * 7) % 3) * 4 - Math.sin((i / 8) * Math.PI) * 6, 3.4, 2, (i % 3) * 0.5);
      c.fill();
    }
  } else {
    c.fillStyle = vgrad(c, -8, 10, '#F2BC78', '#D99450');
    rr(c, -w - 2, -8, w * 2 + 4, 18, 9);
    c.fill();
  }
}

const FLAVORS = ['#FFF3D6', '#FF9FC3', '#8A5230', '#BFE9FF', '#A7E8B8', '#FFD24D', '#C7ABFF', '#FF8A7A'];
function scoop(c, r, col) {
  c.fillStyle = clay(c, 0, 0, r, col);
  c.beginPath();
  c.moveTo(-r, r * 0.2);
  c.bezierCurveTo(-r * 1.04, -r * 1.3, r * 1.04, -r * 1.3, r, r * 0.2);
  for (let i = 0; i < 7; i++) {
    const x0 = r - (i * 2 * r) / 7, x1 = r - ((i + 1) * 2 * r) / 7;
    c.quadraticCurveTo((x0 + x1) / 2, r * (i % 2 ? 0.62 : 0.32), x1, r * 0.2);
  }
  c.closePath();
  c.fill();
  gloss(c, -r * 0.3, -r * 0.46, r * 0.32, r * 0.2, 0.7);
}

function cone(c, r, kind) {
  if (kind === 1) {
    // A cup
    c.fillStyle = hgrad(c, -r, r, '#FFB3C7', '#FFD9E4', '#FF8FB8');
    c.beginPath();
    c.moveTo(-r * 1.1, 0); c.lineTo(r * 1.1, 0); c.lineTo(r * 0.72, r * 1.3); c.lineTo(-r * 0.72, r * 1.3);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    for (let i = -2; i <= 2; i++) {
      heart(c, i * r * 0.38, r * 0.5 + (i % 2) * 6, 5);
      c.fill();
    }
    return;
  }
  const col = kind === 2 ? '#6E3F24' : '#E9B066';
  c.fillStyle = hgrad(c, -r, r, light(col, 0.12), col, dark(col, 0.12));
  c.beginPath();
  c.moveTo(-r * 0.96, 0); c.lineTo(r * 0.96, 0); c.lineTo(0, r * 2.2);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = alpha(dark(col, 0.35), 0.5);
  c.lineWidth = 2.4;
  for (let i = -5; i <= 5; i++) {
    c.beginPath(); c.moveTo(i * r * 0.46 - r, 0); c.lineTo(i * r * 0.46 + r, r * 2.4); c.stroke();
    c.beginPath(); c.moveTo(i * r * 0.46 + r, 0); c.lineTo(i * r * 0.46 - r, r * 2.4); c.stroke();
  }
  c.restore();
}

const PIZZA_TOPS = {
  mushroom(c, r) {
    c.fillStyle = '#F3E2CC';
    rr(c, -r * 0.3, 0, r * 0.6, r * 0.8, r * 0.2);
    c.fill();
    c.fillStyle = clay(c, 0, -r * 0.1, r, '#D9B48C');
    c.beginPath();
    c.arc(0, 0, r, Math.PI, 0);
    c.closePath();
    c.fill();
  },
  olive(c, r) {
    c.strokeStyle = '#3A2A57';
    c.lineWidth = r * 0.5;
    ell(c, 0, 0, r * 0.72);
    c.stroke();
  },
  salami(c, r) {
    c.fillStyle = clay(c, 0, 0, r * 1.1, '#E8473F');
    ell(c, 0, 0, r * 1.1);
    c.fill();
    c.fillStyle = 'rgba(255,220,200,.75)';
    for (const [x, y] of [[-0.4, -0.3], [0.4, -0.1], [-0.1, 0.45]]) {
      ell(c, x * r, y * r, r * 0.14);
      c.fill();
    }
  },
  pepper(c, r) {
    c.strokeStyle = '#7FD86F';
    c.lineWidth = r * 0.42;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, r * 0.3, r * 0.8, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  },
  pineapple(c, r) {
    c.fillStyle = '#FFD24D';
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, r, -2.2, -0.9);
    c.closePath();
    c.fill();
    c.fillStyle = '#FFE98C';
    c.beginPath();
    c.moveTo(0, -r * 0.3);
    c.arc(0, -r * 0.3, r * 0.5, -2.2, -0.9);
    c.fill();
  },
  basil(c, r) {
    c.fillStyle = clay(c, 0, 0, r, '#58B562');
    ell(c, 0, 0, r * 0.6, r, 0.5);
    c.fill();
  },
  heart(c, r) {
    heart(c, 0, 0, r);
    c.fillStyle = clay(c, 0, 0, r, P.rose);
    c.fill();
  }
};

const FRUIT = [
  { id: 'berry', col: '#FF5C7A' }, { id: 'banana', col: '#FFE27D' }, { id: 'orange', col: '#FFA53D' }, { id: 'kiwi', col: '#A7DB5A' },
  { id: 'blue', col: '#7486E8' }, { id: 'peach', col: '#FFB89A' }, { id: 'milk', col: '#FFF9F0' }, { id: 'ice', col: '#D8F2FF' }
];
function drawFruit(c, id, r) {
  switch (id) {
    case 'berry':
      c.fillStyle = clay(c, 0, 0, r, '#FF4D6A');
      c.beginPath();
      c.moveTo(0, r);
      c.bezierCurveTo(-r * 1.2, r * 0.1, -r * 0.9, -r * 0.8, 0, -r * 0.7);
      c.bezierCurveTo(r * 0.9, -r * 0.8, r * 1.2, r * 0.1, 0, r);
      c.fill();
      c.fillStyle = '#6FCB66';
      ell(c, 0, -r * 0.76, r * 0.46, r * 0.17);
      c.fill();
      break;
    case 'banana':
      c.strokeStyle = '#FFD84D';
      c.lineWidth = r * 0.66;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(r * 0.4, -r * 0.4, r * 1.05, Math.PI * 0.42, Math.PI * 1.02);
      c.stroke();
      break;
    case 'orange':
      c.fillStyle = clay(c, 0, 0, r, '#FFA53D');
      ell(c, 0, 0, r * 0.92);
      c.fill();
      c.fillStyle = '#6FCB66';
      ell(c, r * 0.18, -r * 0.86, r * 0.26, r * 0.12, -0.4);
      c.fill();
      break;
    case 'kiwi':
      c.fillStyle = '#9A6B47';
      ell(c, 0, 0, r * 0.92);
      c.fill();
      c.fillStyle = '#A7DB5A';
      ell(c, 0, 0, r * 0.78);
      c.fill();
      c.fillStyle = '#FFF9D6';
      ell(c, 0, 0, r * 0.26);
      c.fill();
      c.fillStyle = '#3A2A57';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ell(c, Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.46, r * 0.05, r * 0.09, a);
        c.fill();
      }
      break;
    case 'blue':
      for (const [x, y] of [[-0.42, 0.26], [0.42, 0.26], [0, -0.36]]) {
        c.fillStyle = clay(c, x * r, y * r, r * 0.5, '#6F7FE8');
        ell(c, x * r, y * r, r * 0.5);
        c.fill();
      }
      break;
    case 'peach':
      c.fillStyle = clay(c, 0, 0, r, '#FFB89A');
      ell(c, 0, 0, r * 0.92);
      c.fill();
      c.strokeStyle = 'rgba(220,110,90,.5)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, -r * 0.8);
      c.quadraticCurveTo(r * 0.3, 0, 0, r * 0.8);
      c.stroke();
      break;
    case 'milk':
      c.fillStyle = hgrad(c, -r * 0.6, r * 0.6, '#FFFFFF', '#D6E6FF');
      c.beginPath();
      c.moveTo(-r * 0.6, r); c.lineTo(-r * 0.6, -r * 0.3); c.lineTo(0, -r * 0.9); c.lineTo(r * 0.6, -r * 0.3); c.lineTo(r * 0.6, r);
      c.closePath();
      c.fill();
      c.fillStyle = P.sky;
      rr(c, -r * 0.6, r * 0.05, r * 1.2, r * 0.44, 3);
      c.fill();
      break;
    case 'ice':
      c.fillStyle = hgrad(c, -r, r, '#F2FBFF', '#BFE9FF');
      rr(c, -r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.3);
      c.fill();
      gloss(c, -r * 0.3, -r * 0.34, r * 0.34, r * 0.2, 0.9);
      break;
  }
}

const PAN_COL = (u) => mix('#FFEFB8', '#E9A85C', clamp(u));

function pancakeArt(c, w, u) {
  c.fillStyle = vgrad(c, -7, 7, PAN_COL(u), dark(PAN_COL(u), 0.14));
  rr(c, -w, -7, w * 2, 14, 7);
  c.fill();
}

/** Small picture of each dish for the thought bubbles. */
function dishIcon(c, id, r) {
  c.save();
  c.scale(r / 30, r / 30);
  if (id === 'burger') {
    c.translate(0, 10);
    bun(c, 24, false);
    c.translate(0, -12);
    LAYERS.patty.draw(c, 24);
    c.translate(0, -8);
    LAYERS.cheese.draw(c, 24);
    c.translate(0, -6);
    LAYERS.lettuce.draw(c, 24);
    c.translate(0, -8);
    bun(c, 24, true);
  } else if (id === 'icecream') {
    c.translate(0, -2);
    cone(c, 15, 0);
    c.translate(0, -10);
    scoop(c, 16, FLAVORS[1]);
    c.translate(0, -15);
    scoop(c, 13, FLAVORS[3]);
  } else if (id === 'pizza') {
    c.fillStyle = '#E9B066';
    ell(c, 0, 0, 26);
    c.fill();
    c.fillStyle = '#FFD86B';
    ell(c, 0, 0, 21);
    c.fill();
    for (const [x, y] of [[-9, -7], [8, -8], [10, 7], [-7, 9], [0, 0]]) {
      c.save();
      c.translate(x, y);
      PIZZA_TOPS.salami(c, 5.4);
      c.restore();
    }
  } else if (id === 'pancake') {
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(0, 14 - i * 11);
      pancakeArt(c, 24 - i * 1.5, 0.8);
      c.restore();
    }
    c.fillStyle = '#FFE27D';
    rr(c, -7, -15, 14, 7, 2);
    c.fill();
  } else {
    c.fillStyle = 'rgba(255,255,255,.7)';
    rr(c, -14, -18, 28, 40, 7);
    c.fill();
    c.fillStyle = vgrad(c, -12, 22, '#FF8FB8', '#FFB89A');
    rr(c, -12, -11, 24, 31, 5);
    c.fill();
    c.strokeStyle = P.teal;
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(2, -8);
    c.lineTo(9, -30);
    c.lineTo(17, -30);
    c.stroke();
  }
  c.restore();
}

// ---- a tidy shelf of tappable things -------------------------------------------------
function makeShelf(scene, items, drawItem, rows = 2) {
  const W = scene.W, H = scene.H;
  const perRow = Math.ceil(items.length / rows);
  const gap = Math.min(74, (W - 20) / perRow), rowH = 66;
  const y0 = H - 42 - app.safeBottom * 0.7 - (rows - 1) * rowH;
  return {
    items: items.map((it, i) => ({
      it, x: W / 2 + ((i % perRow) - (Math.min(perRow, items.length - Math.floor(i / perRow) * perRow) - 1) / 2) * gap,
      y: y0 + Math.floor(i / perRow) * rowH, sq: new Spring(1, 340, 12), on: false
    })),
    y0, top: y0 - 34, drawItem
  };
}
function drawShelf(c, scene, shelf) {
  const W = scene.W, H = scene.H;
  c.fillStyle = 'rgba(255,255,255,.86)';
  rr(c, 6, shelf.top, W - 12, H - shelf.top + 30, 26);
  c.fill();
  for (const q of shelf.items) {
    q.sq.step(app.dt);
    c.save();
    c.translate(q.x, q.y);
    c.scale(q.sq.x, q.sq.x);
    c.fillStyle = q.on ? '#FFE9A8' : '#FFE9D9';
    ell(c, 0, 0, 30);
    c.fill();
    if (q.on) {
      c.lineWidth = 3;
      c.strokeStyle = P.sun;
      c.stroke();
    }
    c.scale(1.22, 1.22);
    shelf.drawItem(c, q.it);
    c.restore();
  }
}
function shelfHit(shelf, p) {
  for (const q of shelf.items) if (dist(p.x, p.y, q.x, q.y) < 34) return q;
  return null;
}

// Plate at the bottom of every dish
function plate(c, x, y, w) {
  groundShadow(c, x, y + 12, w * 1.1, 12);
  c.fillStyle = '#FFFFFF';
  ell(c, x, y, w, w * 0.2);
  c.fill();
  c.fillStyle = 'rgba(190,160,230,.22)';
  ell(c, x, y - 1, w * 0.74, w * 0.13);
  c.fill();
}

function doneBtn(scene, fn, y) {
  return new Btn({
    x: scene.W - 44, y: y ?? (scene.shelf ? scene.shelf.top - 44 : scene.H * 0.6), r: 31, slop: 10,
    paint: (c, r) => {
      candy(c, r, '#58CC7A');
      c.strokeStyle = '#fff';
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(-12, 1); c.lineTo(-3, 10); c.lineTo(13, -9);
      c.stroke();
    },
    tap: fn
  });
}

// ---- the dishes --------------------------------------------------------------------------
// Each one: start(scene), update(dt), draw(c), down(p), move(p), up(p), and
// paint(c, s): the finished dish at scale s, drawn resting on the origin.
const RECIPES = {
  burger: {
    start(sc) {
      this.sc = sc;
      this.stack = [];
      this.closed = false;
      this.falling = [];
      this.sq = new Spring(1, 300, 10);
      this.cx = sc.W / 2;
      this.baseY = sc.foodY();
      this.w = Math.min(sc.W * 0.2, 84);
      const list = [...Object.keys(LAYERS), 'top'];
      sc.shelf = makeShelf(sc, list, (c, id) => {
        c.save();
        if (id === 'top') { c.translate(0, 3); bun(c, 21, true); } else LAYERS[id].draw(c, 21);
        c.restore();
      });
      hint.set({ from: [sc.shelf.items[0].x, sc.shelf.items[0].y], delay: 1.5 });
      sc.buttons = [];
    },
    down(p) {
      const q = shelfHit(this.sc.shelf, p);
      if (!q) return;
      hint.clear();
      q.sq.kick(4);
      if (this.closed) return;
      if (this.stack.length + this.falling.length >= 13 && q.it !== 'top') { audio.sfx('blup'); return; }
      this.falling.push({ id: q.it, y: -60, v: 0, wob: rand(-0.04, 0.04), off: rand(-4, 4) });
      if (q.it === 'top') this.closed = true;
      audio.sfx('swish', { vol: 0.7 });
      audio.note('marimba', penta(this.stack.length), { vol: 0.5 });
    },
    height(n = this.stack.length) {
      let h = 12;
      const k = this.w / 60;
      for (let i = 0; i < n; i++) h += (this.stack[i].id === 'top' ? 20 : LAYERS[this.stack[i].id].h * 1.7) * k;
      return h;
    },
    update(dt) {
      this.sq.step(dt);
      for (const f of this.falling) {
        f.v += 2100 * dt;
        f.y += f.v * dt;
        const land = this.baseY - this.height();
        if (f.y >= land) {
          this.stack.push(f);
          this.falling = this.falling.filter((q) => q !== f);
          this.sq.kick(-2.6);
          audio.sfx(f.id === 'patty' ? 'thud' : 'squish2', { rate: rand(0.9, 1.3), vol: 0.6 });
          fx.burst(this.cx, land, { kind: 'dot', n: 5, colors: [f.id === 'top' ? '#E9A85C' : LAYERS[f.id].col], speed: 120, size: 7, g: 500, life: 0.4, spin: 0 });
          haptic();
          if (f.id === 'top') {
            audio.sparkle(2, 4, 0.4);
            wait(0.7, () => this.sc.finish());
          } else if (this.stack.length === 3) {
            this.sc.buttons = [doneBtn(this.sc, () => this.closeUp())];
          }
          return;
        }
      }
    },
    closeUp() {
      if (this.closed) return;
      this.closed = true;
      this.sc.buttons = [];
      this.falling.push({ id: 'top', y: -60, v: 0, wob: 0, off: 0 });
    },
    paint(c, s = 1) {
      const k = (this.w / 60) * s, sway = Math.sin(app.t * 2) * Math.min(1, this.stack.length / 10) * 0.012;
      c.save();
      c.scale(s, s);
      c.save();
      c.scale(this.w / 60, this.w / 60);
      bun(c, 58, false);
      c.restore();
      c.restore();
      let y = -12 * s;
      for (const f of this.stack) {
        const h = (f.id === 'top' ? 20 : LAYERS[f.id].h * 1.7) * k;
        c.save();
        c.rotate(sway * 0.3 + f.wob * 0.3);
        c.translate(f.off * s, y - h * 0.5);
        c.scale(k * 1.0, k);
        if (f.id === 'top') bun(c, 58, true);
        else LAYERS[f.id].draw(c, 58);
        c.restore();
        y -= h;
      }
    },
    draw(c) {
      const { cx, baseY } = this;
      plate(c, cx, baseY + 16, this.w * 1.6);
      c.save();
      c.translate(cx, baseY);
      c.scale(2 - this.sq.x, this.sq.x);
      this.paint(c, 1);
      c.restore();
      for (const f of this.falling) {
        const k = this.w / 60;
        c.save();
        c.translate(cx + f.off, f.y);
        c.scale(k, k);
        if (f.id === 'top') bun(c, 58, true);
        else LAYERS[f.id].draw(c, 58);
        c.restore();
      }
    }
  },

  icecream: {
    start(sc) {
      this.sc = sc;
      this.kind = Math.floor(rand(3));
      this.scoops = [];
      this.sauce = null;
      this.sprinkled = 0;
      this.cherry = false;
      this.wafer = false;
      this.sq = new Spring(1, 300, 9);
      this.cx = sc.W / 2;
      this.baseY = sc.foodY() - 84;
      this.r = Math.min(sc.W * 0.13, 56);
      const tools = [...FLAVORS.map((col) => ({ col })), { t: 'sauceC' }, { t: 'sauceP' }, { t: 'spr' }, { t: 'cherry' }, { t: 'wafer' }, { t: 'swap' }];
      sc.shelf = makeShelf(sc, tools, (c, it) => {
        if (it.col) {
          c.save();
          c.translate(0, 3);
          scoop(c, 18, it.col);
          c.restore();
        } else if (it.t === 'sauceC' || it.t === 'sauceP') {
          const col = it.t === 'sauceC' ? '#6E3F24' : '#FF5C8F';
          c.fillStyle = hgrad(c, -9, 9, light(col, 0.3), col);
          rr(c, -9, -8, 18, 24, 6);
          c.fill();
          c.fillStyle = '#FFF9F0';
          c.beginPath(); c.moveTo(-5, -8); c.lineTo(0, -19); c.lineTo(5, -8); c.closePath(); c.fill();
        } else if (it.t === 'spr') {
          ['#FF6F91', '#FFD84D', '#61BFFF', '#6FE3A5', '#A985FF'].forEach((col, i) => {
            c.save();
            c.translate(-11 + i * 5.5, -4 + (i % 2) * 8);
            c.rotate(i);
            c.fillStyle = col;
            rr(c, -6, -1.8, 12, 3.6, 1.8);
            c.fill();
            c.restore();
          });
        } else if (it.t === 'cherry') {
          c.fillStyle = clay(c, 0, 3, 11, '#E8314F');
          ell(c, 0, 3, 11);
          c.fill();
          c.strokeStyle = '#5BA84F';
          c.lineWidth = 2.4;
          c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(2, -16, 10, -18); c.stroke();
        } else if (it.t === 'wafer') {
          c.save();
          c.rotate(0.35);
          c.fillStyle = '#C98A4B';
          rr(c, -5, -18, 10, 36, 3);
          c.fill();
          c.restore();
        } else {
          c.save();
          c.scale(0.8, 0.8);
          c.translate(0, -10);
          cone(c, 12, (this.kind + 1) % 3);
          c.restore();
        }
      });
      sc.buttons = [];
      hint.set({ from: [sc.shelf.items[1].x, sc.shelf.items[1].y], delay: 1.5 });
    },
    down(p) {
      const q = shelfHit(this.sc.shelf, p);
      if (!q) {
        if (dist(p.x, p.y, this.cx, this.baseY - 40) < this.r * 2) {
          this.sq.kick(4);
          audio.sfx('blup', { rate: rand(0.9, 1.2) });
        }
        return;
      }
      q.sq.kick(4);
      hint.clear();
      const it = q.it;
      if (it.col) {
        if (this.scoops.length >= 7) { audio.sfx('blup'); return; }
        this.scoops.push({ col: it.col, y: -300, off: rand(-3, 3), rot: rand(-0.14, 0.14) });
        const s = this.scoops[this.scoops.length - 1];
        tween(s, { y: 0 }, 0.3, {
          ease: E.in, done: () => {
            this.sq.kick(-3);
            audio.sfx('squish', { vol: 0.7, rate: rand(1, 1.3) });
            audio.note('kalimba', penta(this.scoops.length + 1), { vol: 0.5 });
            haptic();
            fx.burst(this.cx, this.topY(), { kind: 'dot', n: 5, colors: [s.col], speed: 120, size: 8, g: 500, life: 0.4, spin: 0 });
          }
        });
        if (this.scoops.length === 1) this.sc.buttons = [doneBtn(this.sc, () => this.sc.finish())];
      } else if (it.t === 'swap') {
        this.kind = (this.kind + 1) % 3;
        this.sq.kick(4);
        audio.sfx('tap');
      } else if (!this.scoops.length) {
        audio.sfx('blup');
      } else if (it.t === 'sauceC' || it.t === 'sauceP') {
        this.sauce = it.t === 'sauceC' ? '#6E3F24' : '#FF4D85';
        audio.sfx('pour', { vol: 0.8, rate: 1.1 });
        audio.sparkle(1, 3, 0.25);
      } else if (it.t === 'spr') {
        this.sprinkled = Math.min(this.sprinkled + 8, 32);
        audio.sfx('plip', { rate: rand(1.2, 1.8) });
        fx.burst(this.cx, this.topY() - 30, { kind: 'confetti', n: 8, speed: 80, size: 9, g: 500, life: 0.5 });
      } else if (it.t === 'cherry') {
        this.cherry = true;
        audio.sfx('boing', { rate: 1.3 });
        this.sq.kick(4);
      } else if (it.t === 'wafer') {
        this.wafer = !this.wafer;
        audio.sfx('tap');
      }
      haptic();
    },
    topY() { return this.baseY - this.scoops.length * this.r * 1.04; },
    update(dt) { this.sq.step(dt); },
    paint(c, s = 1) {
      const r = this.r * s, sway = Math.sin(app.t * 2.2);
      c.save();
      cone(c, r * 0.94, this.kind);
      this.scoops.forEach((q, i) => {
        c.save();
        const lean = sway * 0.006 * i * i * r;
        c.translate(q.off * s + lean, -r * 0.1 - i * r * 1.04 + q.y * s);
        c.rotate(q.rot);
        const k = 1 - i * 0.03;
        scoop(c, r * k, q.col);
        c.restore();
      });
      const n = this.scoops.length;
      if (n) {
        const ty = -r * 0.1 - (n - 1) * r * 1.04;
        if (this.wafer) {
          c.save();
          c.translate(r * 0.5, ty - r * 0.5);
          c.rotate(0.4);
          c.fillStyle = hgrad(c, -r * 0.14, r * 0.14, '#E9B066', '#B9783F');
          rr(c, -r * 0.14, -r * 0.9, r * 0.28, r * 1.2, 4);
          c.fill();
          c.restore();
        }
        if (this.sauce) {
          c.fillStyle = this.sauce;
          c.beginPath();
          c.moveTo(-r * 0.74, ty - r * 0.42);
          c.bezierCurveTo(-r * 0.5, ty - r * 1.18, r * 0.5, ty - r * 1.18, r * 0.74, ty - r * 0.42);
          for (let i = 0; i < 6; i++) {
            const x0 = r * 0.74 - (i * r * 1.48) / 6, x1 = r * 0.74 - ((i + 1) * r * 1.48) / 6;
            c.quadraticCurveTo((x0 + x1) / 2, ty - r * (i % 2 ? 0.1 : 0.42) + (i % 3) * r * 0.1, x1, ty - r * 0.42);
          }
          c.fill();
          gloss(c, -r * 0.26, ty - r * 0.74, r * 0.28, r * 0.12, 0.6);
        }
        for (let i = 0; i < this.sprinkled; i++) {
          const a = i * 2.4, rr2 = (i % 7) / 7;
          c.save();
          c.translate(Math.cos(a) * r * 0.74 * rr2, ty - r * 0.4 + Math.sin(a) * r * 0.42 * rr2 + (i % 5) * r * 0.05 - r * 0.1);
          c.rotate(i);
          c.fillStyle = ['#FF6F91', '#FFD84D', '#61BFFF', '#6FE3A5', '#FFFFFF', '#A985FF'][i % 6];
          rr(c, -r * 0.09, -r * 0.03, r * 0.18, r * 0.06, r * 0.03);
          c.fill();
          c.restore();
        }
        if (this.cherry) {
          c.strokeStyle = '#5BA84F';
          c.lineWidth = r * 0.06;
          c.beginPath();
          c.moveTo(0, ty - r * 1.1);
          c.quadraticCurveTo(r * 0.1, ty - r * 1.6, r * 0.4, ty - r * 1.66);
          c.stroke();
          c.fillStyle = clay(c, 0, ty - r * 0.96, r * 0.24, '#E8314F');
          ell(c, 0, ty - r * 0.96, r * 0.24);
          c.fill();
          gloss(c, -r * 0.07, ty - r * 1.03, r * 0.07, r * 0.05, 0.9);
        }
      }
      c.restore();
    },
    draw(c) {
      groundShadow(c, this.cx, this.baseY + this.r * 2.3, this.r * 0.7, 9);
      c.save();
      c.translate(this.cx, this.baseY + this.r * 2);
      c.scale(2 - this.sq.x, this.sq.x);
      c.translate(0, -this.r * 2);
      this.paint(c, 1);
      c.restore();
    }
  },

  pizza: {
    start(sc) {
      this.sc = sc;
      this.step = 'roll';
      this.cx = sc.W / 2;
      this.cy = Math.min(sc.H * 0.38, sc.foodY() - 90);
      this.R = Math.min(sc.W * 0.32, sc.H * 0.2, 150);
      this.size = 0.5;
      this.pin = { x: this.cx, y: this.cy - 10 };
      this.sq = new Spring(1, 300, 10);
      const S = Math.ceil(this.R * 2.2), k = Math.min(app.pr * app.scale, 2);
      this.cv = document.createElement('canvas');
      this.cv.width = this.cv.height = Math.ceil(S * k);
      this.S = S;
      this.dx = this.cv.getContext('2d');
      this.dx.scale(k, k);
      this.dx.translate(S / 2, S / 2);
      this.covered = 0;
      this.cuts = [];
      this.oven = 0;
      sc.shelf = null;
      sc.buttons = [];
      hint.set({ from: [this.cx - 60, this.cy], to: [this.cx + 60, this.cy], delay: 1 });
    },
    toSauce() {
      this.step = 'sauce';
      audio.success();
      hint.set({ from: [this.cx - this.R * 0.4, this.cy], to: [this.cx + this.R * 0.4, this.cy], delay: 1 });
    },
    toppings() {
      this.step = 'top';
      hint.clear();
      const sc = this.sc;
      sc.shelf = makeShelf(sc, ['cheese', ...Object.keys(PIZZA_TOPS)], (c, id) => {
        if (id === 'cheese') {
          c.fillStyle = '#FFD86B';
          c.beginPath(); c.moveTo(-15, 9); c.lineTo(15, 9); c.lineTo(15, -4); c.lineTo(-7, -11); c.lineTo(-15, -4); c.closePath(); c.fill();
          c.fillStyle = '#FFF0A8';
          ell(c, 3, 2, 4); c.fill();
          ell(c, -7, 3, 2.6); c.fill();
        } else PIZZA_TOPS[id](c, 13);
      }, 1);
      this.tool = sc.shelf.items[0];
      this.tool.on = true;
      sc.buttons = [doneBtn(sc, () => this.bake())];
      hint.set({ from: [this.cx - 40, this.cy - 20], to: [this.cx + 40, this.cy + 20], delay: 1.2 });
    },
    bake() {
      this.step = 'oven';
      this.sc.buttons = [];
      this.sc.shelf = null;
      this.oven = 0;
      audio.sfx('whoosh');
      tween(this, { oven: 1 }, 2.6, {
        ease: E.io, done: () => {
          audio.note('bell', 84, { vol: 0.8, wet: 0.8 });
          audio.note('bell', 88, { vol: 0.5, wet: 0.8, when: audio.now + 0.18 });
          this.step = 'slice';
          fx.sparkle(this.cx, this.cy, 20);
          this.sc.buttons = [doneBtn(this.sc, () => this.sc.finish())];
          hint.set({ from: [this.cx - this.R, this.cy - this.R * 0.4], to: [this.cx + this.R, this.cy + this.R * 0.4], delay: 1 });
        }
      });
    },
    place(x, y, p) {
      const lx = x - this.cx, ly = y - this.cy, d = this.dx;
      if (Math.hypot(lx, ly) > this.R * 0.98) return;
      const it = this.tool && this.tool.it;
      if (it === 'cheese') {
        for (let i = 0; i < 6; i++) {
          d.save();
          d.translate(lx + rand(-26, 26), ly + rand(-26, 26));
          d.rotate(rand(TAU));
          d.fillStyle = pick(['#FFE98C', '#FFD86B', '#FFF3B8']);
          rr(d, -7, -1.8, 14, 3.6, 1.8);
          d.fill();
          d.restore();
        }
        audio.sfx('scrub', { vol: 0.5, gap: 70 });
      } else if (!p.placed) {
        p.placed = true;
        d.save();
        d.translate(lx, ly);
        d.rotate(rand(-0.6, 0.6));
        PIZZA_TOPS[it](d, 14 * clamp(this.R / 120, 0.8, 1.3));
        d.restore();
        audio.note('marimba', penta(Math.floor(rand(0, 7))), { vol: 0.5 });
        audio.sfx('plip', { rate: rand(0.9, 1.3) });
        fx.sparkle(x, y, 4);
        haptic();
      }
    },
    down(p) {
      const { cx, cy, R } = this;
      if (this.step === 'roll') { p.roll = true; p.lastX = p.x; p.lastY = p.y; hint.clear(); }
      else if (this.step === 'sauce') { p.sauce = true; hint.clear(); this.spread(p); }
      else if (this.step === 'top') {
        const q = this.sc.shelf && shelfHit(this.sc.shelf, p);
        if (q) {
          if (this.tool) this.tool.on = false;
          this.tool = q;
          q.on = true;
          q.sq.kick(4);
          audio.note('marimba', penta(this.sc.shelf.items.indexOf(q)), { vol: 0.5 });
          haptic();
          return;
        }
        if (dist(p.x, p.y, cx, cy) < R) { p.top = true; hint.clear(); this.place(p.x, p.y, p); }
      } else if (this.step === 'slice') { p.slice = { x: p.x, y: p.y }; hint.clear(); }
    },
    spread(p) {
      const lx = p.x - this.cx, ly = p.y - this.cy, d = this.dx, R = this.R;
      if (Math.hypot(lx, ly) > R * 0.96) return;
      const last = p.lastS || { x: lx, y: ly };
      d.lineCap = 'round';
      d.strokeStyle = '#E8473F';
      d.lineWidth = R * 0.42;
      d.beginPath();
      d.moveTo(last.x, last.y);
      d.lineTo(lx, ly);
      d.stroke();
      const moved = Math.hypot(lx - last.x, ly - last.y);
      this.covered += moved / (R * 7);
      p.lastS = { x: lx, y: ly };
      if (moved > 3 && Math.random() < 0.3) audio.sfx('squish2', { rate: rand(1, 1.4), vol: 0.35, gap: 110 });
      if (this.covered >= 1) {
        // Spread the last gaps for her and move on
        d.fillStyle = '#E8473F';
        ell(d, 0, 0, R * 0.92);
        d.fill();
        this.toppings();
      }
    },
    move(p) {
      if (p.roll) {
        const dd = Math.hypot(p.x - p.lastX, p.y - p.lastY);
        p.lastX = p.x;
        p.lastY = p.y;
        this.pin.x = p.x;
        this.pin.y = p.y;
        const was = this.size;
        this.size = Math.min(1, this.size + dd / (this.R * 9));
        if (dd > 2 && Math.random() < 0.25) audio.sfx('squish2', { rate: rand(0.7, 1), vol: 0.4, gap: 120 });
        if (Math.floor(was * 10) !== Math.floor(this.size * 10)) { audio.note('kalimba', penta(Math.floor(this.size * 10) - 3), { vol: 0.45 }); haptic(); }
        if (this.size >= 1 && this.step === 'roll') this.toSauce();
      }
      if (p.sauce && this.step === 'sauce') this.spread(p);
      if (p.top && this.tool && this.tool.it === 'cheese') this.place(p.x, p.y, p);
    },
    up(p) {
      if (p.slice && this.step === 'slice') {
        const dx = p.x - p.slice.x, dy = p.y - p.slice.y;
        if (Math.hypot(dx, dy) > 60) {
          // A cut always goes neatly through the middle, wherever she swiped
          this.cuts.push(Math.atan2(dy, dx));
          audio.sfx('snip', { vol: 1 });
          audio.sfx('squish2', { rate: 1.4, vol: 0.4 });
          haptic();
          fx.sparkle(this.cx, this.cy, 6);
        }
      }
      p.lastS = null;
    },
    update(dt) { this.sq.step(dt); },
    paint(c, s = 1) {
      const R = this.R * s, sizeK = this.size;
      const baked = this.step === 'slice' || this.step === 'done' ? 1 : this.oven;
      c.save();
      c.scale(1, 0.92);
      c.fillStyle = clay(c, 0, 0, R * sizeK, mix('#FFE3A8', '#E9B066', baked));
      ell(c, 0, 0, R * sizeK, R * sizeK * (1 - (1 - sizeK) * 0.2));
      c.fill();
      if (this.step !== 'roll') {
        c.fillStyle = mix('#FFEBC4', '#F2C47E', baked);
        ell(c, 0, 0, R * 0.92);
        c.fill();
        const S = this.S * s;
        c.drawImage(this.cv, -S / 2, -S / 2, S, S);
        if (baked > 0) {
          c.fillStyle = `rgba(180,90,20,${baked * 0.1})`;
          ell(c, 0, 0, R * 0.92);
          c.fill();
        }
      }
      c.strokeStyle = 'rgba(120,70,30,.55)';
      c.lineWidth = 2.4 * s;
      for (const a of this.cuts) {
        c.beginPath();
        c.moveTo(Math.cos(a) * R, Math.sin(a) * R);
        c.lineTo(-Math.cos(a) * R, -Math.sin(a) * R);
        c.stroke();
      }
      c.restore();
    },
    draw(c) {
      const { cx, cy, R } = this;
      if (this.step === 'oven') {
        // The oven swallows it, glows, and hands it back
        const u = this.oven, w = R * 1.3, h = R * 1.1;
        c.fillStyle = hgrad(c, cx - w, cx + w, '#FF9FB8', '#FFC2D4', '#FF9FB8');
        rr(c, cx - w, cy - h, w * 2, h * 2, 28);
        c.fill();
        c.fillStyle = '#4A3060';
        rr(c, cx - w * 0.82, cy - h * 0.6, w * 1.64, h * 1.42, 16);
        c.fill();
        c.save();
        rr(c, cx - w * 0.82, cy - h * 0.6, w * 1.64, h * 1.42, 16);
        c.clip();
        c.globalCompositeOperation = 'lighter';
        glow(c, cx, cy + h * 0.3, w * 1.3, '#FFB347', 0.7);
        c.restore();
        c.save();
        c.translate(cx, cy + h * 0.2);
        c.scale(0.62, 0.34);
        this.paint(c, 1);
        c.restore();
        c.lineWidth = 8;
        c.strokeStyle = '#FFF6EC';
        rr(c, cx - w * 0.84, cy - h * 0.62, w * 1.68, h * 1.46, 18);
        c.stroke();
        for (const k of [-1, 0, 1]) {
          c.fillStyle = clay(c, cx + k * w * 0.42, cy - h + 22, 11, '#FFF6EC');
          ell(c, cx + k * w * 0.42, cy - h + 22, 11);
          c.fill();
        }
        // Steam
        if (Math.random() < 0.18) fx.add({ kind: 'dot', x: cx + rand(-w * 0.5, w * 0.5), y: cy - h, vy: -40, g: -20, size: rand(10, 18), life: 1, color: '#FFFFFF' });
        return;
      }
      groundShadow(c, cx, cy + R * 0.98, R * 1.04, R * 0.1);
      // Wooden board
      c.fillStyle = hgrad(c, cx - R * 1.1, cx + R * 1.1, '#E2B27C', '#F2C997', '#D6A06A');
      ell(c, cx, cy + 6, R * 1.1, R * 1.03);
      c.fill();
      c.save();
      c.translate(cx, cy);
      c.scale(2 - this.sq.x, this.sq.x);
      this.paint(c, 1);
      c.restore();
      if (this.step === 'roll') {
        c.save();
        c.translate(this.pin.x, this.pin.y);
        c.fillStyle = hgrad(c, -R * 0.7, R * 0.7, '#D9944C', '#F2C78E', '#D9944C');
        rr(c, -R * 0.7, -15, R * 1.4, 30, 15);
        c.fill();
        c.fillStyle = '#B9783F';
        for (const s of [-1, 1]) {
          rr(c, s * R * 0.84 - 13, -8, 26, 16, 8);
          c.fill();
        }
        gloss(c, -R * 0.2, -7, R * 0.3, 4, 0.6, 0);
        c.restore();
      }
      if (this.step === 'sauce') {
        // Progress: a ring of stars round the board
        const n = 8, on = Math.floor(clamp(this.covered) * n);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU - Math.PI / 2;
          softStar(c, cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.14, i < on ? 11 : 7);
          c.fillStyle = i < on ? P.sun : 'rgba(255,255,255,.75)';
          c.fill();
        }
      }
    }
  },

  pancake: {
    start(sc) {
      this.sc = sc;
      this.step = 'pour';
      this.cx = sc.W / 2;
      this.panY = Math.min(sc.H * 0.42, sc.foodY() - 60);
      this.w = Math.min(sc.W * 0.25, 110);
      this.plateX = sc.W > 640 ? this.cx + this.w * 2.6 : this.cx;
      this.plateY = sc.W > 640 ? sc.foodY() : sc.foodY() + 20;
      if (sc.W > 640) this.cx -= this.w * 1.3;
      this.blob = 0;
      this.pouring = false;
      this.cook = 0;
      this.side = 0;
      this.fly = null;
      this.stack = [];
      this.toppings = [];
      this.sq = new Spring(1, 300, 10);
      sc.shelf = null;
      sc.buttons = [];
      hint.set({ from: [this.cx, this.panY], delay: 1 });
      this.syrup = 0;
    },
    decorate() {
      this.step = 'decorate';
      this.pouring = false;
      const sc = this.sc;
      sc.shelf = makeShelf(sc, ['syrup', 'choco', 'butter', 'berry', 'banana', 'blue', 'cream'], (c, id) => {
        if (id === 'syrup' || id === 'choco') {
          const col = id === 'syrup' ? '#C9721E' : '#6E3F24';
          c.fillStyle = hgrad(c, -9, 9, light(col, 0.3), col);
          rr(c, -9, -8, 18, 24, 6);
          c.fill();
          c.fillStyle = '#FFF9F0';
          c.beginPath(); c.moveTo(-5, -8); c.lineTo(0, -19); c.lineTo(5, -8); c.closePath(); c.fill();
        } else if (id === 'butter') {
          c.fillStyle = vgrad(c, -8, 10, '#FFF0A8', '#FFD24D');
          rr(c, -13, -8, 26, 18, 4);
          c.fill();
        } else if (id === 'cream') {
          c.fillStyle = '#FFFDF6';
          ell(c, 0, 8, 14, 9); c.fill();
          ell(c, 0, -1, 10, 8); c.fill();
          ell(c, 0, -9, 6, 6); c.fill();
        } else drawFruit(c, id, 14);
      }, 1);
      sc.buttons = [doneBtn(sc, () => sc.finish())];
    },
    topY() { return this.plateY - 14 * this.stack.length - 4; },
    down(p) {
      if (this.step === 'pour') {
        if (dist(p.x, p.y, this.cx, this.panY) < this.w * 1.5) {
          this.pouring = true;
          p.pour = true;
          hint.clear();
        }
      } else if (this.step === 'cook') {
        p.flipFrom = p.y;
      } else if (this.step === 'decorate') {
        const q = shelfHit(this.sc.shelf, p);
        if (!q) return;
        q.sq.kick(4);
        const id = q.it;
        if (id === 'syrup' || id === 'choco') {
          this.syrup = id === 'syrup' ? '#C9721E' : '#6E3F24';
          audio.sfx('pour', { vol: 0.8 });
        } else {
          this.toppings.push({ id, x: rand(-0.6, 0.6) * this.w, y: rand(-6, 6), rot: rand(-0.5, 0.5) });
          audio.note('marimba', penta(Math.floor(rand(0, 7))), { vol: 0.5 });
          audio.sfx('plip', { rate: rand(0.9, 1.3) });
        }
        fx.sparkle(this.plateX, this.topY() - 10, 6);
        haptic();
      }
    },
    up(p) {
      if (p.pour) {
        this.pouring = false;
        if (this.blob > 0.34) {
          this.step = 'cook';
          this.cook = 0;
          this.side = 0;
          audio.sfx('flame', { vol: 0.7 });
          hint.set({ from: [this.cx, this.panY], to: [this.cx, this.panY - 120], delay: 2.2 });
        }
      }
    },
    move(p) {
      if (this.step === 'cook' && p.flipFrom !== undefined && !this.fly && p.flipFrom - p.y > 34) {
        p.flipFrom = undefined;
        this.flip();
      }
    },
    flip() {
      hint.clear();
      audio.sfx('boing', { rate: 1.2 });
      haptic();
      if (this.side === 0) {
        this.fly = { t: 0, dur: 0.7, land: 'pan', u: this.cook };
        this.side = 1;
      } else {
        this.fly = { t: 0, dur: 0.75, land: 'plate', u: this.cook };
      }
    },
    update(dt) {
      this.sq.step(dt);
      if (this.pouring) {
        this.blob = Math.min(1, this.blob + dt * 0.9);
        if (Math.random() < 0.3) audio.sfx('pour', { vol: 0.5, gap: 300 });
        if (this.blob >= 1) {
          this.pouring = false;
          this.step = 'cook';
          this.cook = 0;
          audio.sfx('flame', { vol: 0.7 });
          hint.set({ from: [this.cx, this.panY], to: [this.cx, this.panY - 120], delay: 2.2 });
        }
      }
      if (this.step === 'cook' && !this.fly) {
        this.cook = Math.min(1, this.cook + dt * 0.5);
        if (Math.random() < dt * 6) fx.add({ kind: 'dot', x: this.cx + rand(-this.w * 0.6, this.w * 0.6), y: this.panY - 8, vy: -30, g: -30, size: rand(5, 10), life: 0.7, color: '#FFFFFF' });
      }
      if (this.fly) {
        const f = this.fly;
        f.t += dt;
        if (f.t >= f.dur) {
          this.fly = null;
          if (f.land === 'pan') {
            this.cook = 0.35;
            this.sq.kick(-3);
            audio.sfx('thud', { rate: 1.2, vol: 0.7 });
            fx.burst(this.cx, this.panY, { kind: 'dot', n: 6, colors: ['#FFEFB8'], speed: 130, size: 7, g: 500, life: 0.4, spin: 0 });
            hint.set({ from: [this.cx, this.panY], to: [this.cx, this.panY - 120], delay: 2.4 });
          } else {
            this.stack.push({ w: this.w * Math.max(0.5, this.blob) * rand(0.92, 1), off: rand(-5, 5), u: 0.8 });
            this.blob = 0;
            this.sq.kick(-3);
            audio.sfx('squish', { vol: 0.7 });
            audio.note('kalimba', penta(this.stack.length + 2), { vol: 0.55 });
            fx.sparkle(this.plateX, this.topY(), 8);
            this.step = 'pour';
            if (this.stack.length >= 5) this.decorate();
            else if (this.stack.length === 1) this.sc.buttons = [doneBtn(this.sc, () => this.decorate(), this.sc.H - 80 - app.safeBottom * 0.7)];
          }
        }
      }
    },
    drawStack(c, s = 1) {
      let y = 0;
      this.stack.forEach((q, i) => {
        c.save();
        c.translate(q.off * s, y - 7 * s);
        c.scale(s, s);
        pancakeArt(c, q.w, q.u);
        c.restore();
        y -= 13 * s;
      });
      const top = y - 3 * s;
      if (this.syrup && this.stack.length) {
        const w = this.stack[this.stack.length - 1].w * s;
        c.fillStyle = this.syrup;
        c.beginPath();
        c.ellipse(0, top + 4 * s, w * 0.74, 6 * s, 0, 0, TAU);
        c.fill();
        for (const [x, l] of [[-0.6, 16], [-0.2, 28], [0.3, 20], [0.62, 12]]) {
          rr(c, x * w - 3.5 * s, top + 4 * s, 7 * s, l * s, 3.5 * s);
          c.fill();
        }
        gloss(c, -w * 0.2, top + 2 * s, w * 0.3, 2.4 * s, 0.55, 0);
      }
      for (const t of this.toppings) {
        c.save();
        c.translate(t.x * s, top + t.y * 0.4 * s - 4 * s);
        c.rotate(t.rot);
        if (t.id === 'butter') {
          c.fillStyle = vgrad(c, -7 * s, 7 * s, '#FFF0A8', '#FFD24D');
          rr(c, -10 * s, -6 * s, 20 * s, 12 * s, 3 * s);
          c.fill();
        } else if (t.id === 'cream') {
          c.fillStyle = '#FFFDF6';
          ell(c, 0, 4 * s, 13 * s, 8 * s); c.fill();
          ell(c, 0, -3 * s, 9 * s, 7 * s); c.fill();
          ell(c, 0, -10 * s, 5 * s, 5 * s); c.fill();
        } else drawFruit(c, t.id, 12 * s);
        c.restore();
      }
    },
    paint(c, s = 1) { this.drawStack(c, s); },
    draw(c) {
      const { cx, panY, w } = this;
      // Stove and pan
      if (this.step !== 'decorate') {
        c.fillStyle = 'rgba(90,60,120,.14)';
        rr(c, cx - w * 1.4, panY + 18, w * 2.8, 30, 12);
        c.fill();
        c.save();
        c.globalCompositeOperation = 'lighter';
        if (this.step === 'cook') glow(c, cx, panY + 24, w * 0.9, '#FF9F3D', 0.5);
        c.restore();
        c.fillStyle = '#5B4A7C';
        rr(c, cx + w * 1.1, panY - 5, w * 0.9, 13, 6);
        c.fill();
        c.fillStyle = hgrad(c, cx - w * 1.2, cx + w * 1.2, '#4B3F68', '#7C6BA6', '#3F3459');
        ell(c, cx, panY + 6, w * 1.2, 22);
        c.fill();
        c.fillStyle = '#332A4C';
        ell(c, cx, panY, w * 1.1, 17);
        c.fill();
        // The batter or pancake
        if (this.blob > 0 && (!this.fly || this.fly.land !== 'plate')) {
          let py = panY - 2, rot = 0;
          if (this.fly) {
            const u = this.fly.t / this.fly.dur;
            py -= Math.sin(u * Math.PI) * 170;
            rot = u * TAU;
          }
          c.save();
          c.translate(cx, py);
          c.scale(1, this.fly ? Math.max(0.2, Math.abs(Math.cos(rot))) : 1);
          const bw = w * Math.max(0.3, this.blob);
          c.fillStyle = clay(c, 0, 0, bw, PAN_COL(this.cook * 0.85), 12);
          ell(c, 0, 0, bw, 13);
          c.fill();
          if (this.step === 'cook' && !this.fly && this.cook > 0.2) {
            c.fillStyle = 'rgba(160,100,40,.35)';
            for (let i = 0; i < 7; i++) {
              ell(c, Math.cos(i * 2.4) * bw * 0.6, Math.sin(i * 2.4) * 6, 2.4);
              c.fill();
            }
          }
          c.restore();
          if (this.step === 'cook' && !this.fly && this.cook >= 0.99) {
            // Ready to flip: it hops to say so
            const k = Math.abs(Math.sin(this.sc.t * 5));
            softStar(c, cx, panY - 30 - k * 12, 12);
            c.fillStyle = P.sun;
            c.fill();
          }
        }
        // The jug follows the pouring
        if (this.step === 'pour') {
          const k = this.pouring ? 1 : 0;
          c.save();
          c.translate(cx + 16, panY - 96 - (1 - k) * 12);
          c.rotate(k * 0.7 + 0.2);
          c.fillStyle = hgrad(c, -24, 24, '#FFFFFF', '#D6E6FF');
          rr(c, -24, -30, 48, 58, 12);
          c.fill();
          c.fillStyle = '#FFE5A8';
          rr(c, -19, -6, 38, 28, 8);
          c.fill();
          c.restore();
          if (this.pouring) {
            c.strokeStyle = '#FFEFB8';
            c.lineWidth = 8;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(cx - 14, panY - 74);
            c.lineTo(cx, panY - 4);
            c.stroke();
          }
        }
      }
      // The plate
      const pX = this.step === 'decorate' ? this.sc.W / 2 : this.plateX, pY = this.step === 'decorate' ? this.sc.foodY() : this.plateY;
      plate(c, pX, pY, w * 1.4);
      c.save();
      c.translate(pX, pY);
      const k = this.step === 'decorate' ? 1.3 : 1;
      this.drawStack(c, k);
      c.restore();
      if (this.fly && this.fly.land === 'plate') {
        const u = this.fly.t / this.fly.dur;
        const x = lerp(cx, pX, E.io(u)), y = lerp(panY, this.topY() - 8, u) - Math.sin(u * Math.PI) * 150;
        c.save();
        c.translate(x, y);
        c.rotate(u * 4);
        pancakeArt(c, w * Math.max(0.5, this.blob), 0.8);
        c.restore();
      }
    }
  },

  smoothie: {
    start(sc) {
      this.sc = sc;
      this.step = 'fill';
      this.cx = sc.W / 2;
      this.baseY = sc.foodY() + 10;
      this.w = Math.min(sc.W * 0.17, 68);
      this.h = Math.min(sc.H * 0.34, 220);
      this.bits = [];
      this.col = null;
      this.level = 0;
      this.spin = 0;
      this.blend = 0;
      this.holding = false;
      this.shake = 0;
      this.glass = 0;
      this.extras = [];
      this.sq = new Spring(1, 300, 10);
      sc.shelf = makeShelf(sc, FRUIT, (c, f) => drawFruit(c, f.id, 15), 2);
      this.btn = { x: this.cx - this.w * 2.1, y: this.baseY - this.w * 0.2 };
      sc.buttons = [];
      this.loop = null;
      hint.set({ from: [sc.shelf.items[0].x, sc.shelf.items[0].y], delay: 1.5 });
    },
    stopLoop() { if (this.loop) { this.loop.stop(); this.loop = null; } },
    add(f) {
      if (this.bits.length >= 10) { audio.sfx('blup'); return; }
      const b = { ...f, x: rand(-0.5, 0.5) * this.w, y: -this.h - 40, r: 15, v: 0, floor: -(10 + this.bits.length * 13) };
      this.bits.push(b);
      this.col = this.bits.length === 1 ? f.col : mix(this.col, f.col, 0.45);
      this.level = clamp(this.bits.length / 7);
      audio.sfx('swish', { vol: 0.5 });
    },
    pour() {
      this.step = 'pour';
      this.stopLoop();
      audio.success();
      this.glass = 0;
      audio.sfx('pour', { vol: 1 });
      tween(this, { glass: 1 }, 1.3, {
        ease: E.io, done: () => {
          this.step = 'garnish';
          this.sc.shelf = makeShelf(this.sc, ['straw', 'umbrella', 'orange', 'berry', 'cream', 'bubbles'], (c, id) => this.drawExtra(c, id, 0.9), 1);
          this.sc.buttons = [doneBtn(this.sc, () => this.sc.finish())];
        }
      });
    },
    drawExtra(c, id, k) {
      c.save();
      c.scale(k, k);
      if (id === 'straw') {
        c.strokeStyle = P.teal;
        c.lineWidth = 6;
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(-6, 18); c.lineTo(4, -14); c.lineTo(14, -18); c.stroke();
      } else if (id === 'umbrella') {
        c.strokeStyle = '#D9944C';
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 18); c.stroke();
        c.fillStyle = P.rose;
        c.beginPath(); c.arc(0, -4, 19, Math.PI, 0); c.closePath(); c.fill();
        c.fillStyle = P.butter;
        c.beginPath(); c.moveTo(-6, -4); c.lineTo(0, -23); c.lineTo(6, -4); c.closePath(); c.fill();
      } else if (id === 'orange') {
        c.fillStyle = '#FFA53D';
        ell(c, 0, 0, 16);
        c.fill();
        c.fillStyle = '#FFD89A';
        ell(c, 0, 0, 13);
        c.fill();
        c.strokeStyle = '#FFA53D';
        c.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.moveTo(Math.cos(i * 0.785) * 13, Math.sin(i * 0.785) * 13);
          c.lineTo(-Math.cos(i * 0.785) * 13, -Math.sin(i * 0.785) * 13);
          c.stroke();
        }
      } else if (id === 'berry') drawFruit(c, 'berry', 14);
      else if (id === 'cream') {
        c.fillStyle = '#FFFDF6';
        ell(c, 0, 8, 17, 10); c.fill();
        ell(c, 0, -2, 12, 9); c.fill();
        ell(c, 0, -11, 6, 6); c.fill();
      } else {
        c.fillStyle = 'rgba(255,255,255,.9)';
        for (const [x, y, r] of [[-8, 4, 7], [8, 2, 9], [0, -9, 6]]) {
          ell(c, x, y, r);
          c.fill();
        }
      }
      c.restore();
    },
    down(p) {
      if (this.step === 'fill') {
        const q = shelfHit(this.sc.shelf, p);
        if (q) {
          q.sq.kick(4);
          hint.clear();
          this.add(q.it);
          haptic();
          return;
        }
        if (this.bits.length && dist(p.x, p.y, this.btn.x, this.btn.y) < 44) {
          this.step = 'blend';
          this.holding = true;
          p.hold = true;
          hint.clear();
          this.loop = audio.loop('rumble', 0.35, 1.4);
        }
      } else if (this.step === 'blend') {
        if (dist(p.x, p.y, this.btn.x, this.btn.y) < 54) {
          this.holding = true;
          p.hold = true;
          if (!this.loop) this.loop = audio.loop('rumble', 0.35, 1.4);
        }
      } else if (this.step === 'garnish') {
        const q = shelfHit(this.sc.shelf, p);
        if (!q) return;
        q.sq.kick(4);
        const i = this.extras.indexOf(q.it);
        if (i >= 0) this.extras.splice(i, 1);
        else this.extras.push(q.it);
        audio.note('marimba', penta(this.sc.shelf.items.indexOf(q)), { vol: 0.5 });
        fx.sparkle(this.cx, this.baseY - this.h * 0.7, 6);
        haptic();
      }
    },
    up(p) {
      if (p.hold) {
        this.holding = false;
        this.stopLoop();
        if (this.step === 'blend' && this.blend < 1) hint.set({ from: [this.btn.x, this.btn.y], delay: 1.5 });
      }
    },
    update(dt) {
      this.sq.step(dt);
      for (const b of this.bits) {
        if (b.y < b.floor) {
          b.v += 1800 * dt;
          b.y += b.v * dt;
          if (b.y >= b.floor) {
            b.y = b.floor;
            audio.sfx('blup', { rate: rand(0.9, 1.3), vol: 0.7 });
            audio.note('marimba', penta(Math.floor(rand(0, 6))), { vol: 0.4 });
            this.sq.kick(-1.6);
            if (this.bits.length && this.step === 'fill') hint.set({ from: [this.btn.x, this.btn.y], delay: 1.5 });
          }
        }
      }
      if (this.holding) {
        this.blend = Math.min(1, this.blend + dt * 0.45);
        this.spin += dt * 26;
        this.shake = Math.sin(this.sc.t * 60) * 3;
        if (this.loop) this.loop.set(0.3 + this.blend * 0.15);
        if (Math.random() < dt * 10) fx.bubbles(this.cx + rand(-this.w, this.w), this.baseY - this.h * this.level * 0.8, 1);
        if (this.blend >= 1) {
          this.holding = false;
          this.pour();
        }
      } else this.shake = 0;
    },
    glassArt(c, s = 1, level = 1) {
      const w = 36 * s, h = 96 * s;
      if (this.extras.includes('straw')) {
        c.strokeStyle = P.teal;
        c.lineWidth = 8 * s;
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(-w * 0.1, -h * 0.4); c.lineTo(w * 0.5, -h * 1.2); c.lineTo(w * 1, -h * 1.26); c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath();
      c.moveTo(-w, -h); c.lineTo(w, -h); c.lineTo(w * 0.76, 0); c.quadraticCurveTo(0, 7 * s, -w * 0.76, 0);
      c.closePath();
      c.fill();
      c.save();
      c.clip();
      const top = -h * 0.92 * level;
      c.fillStyle = vgrad(c, top, 0, light(this.col || '#FFB3C7', 0.16), this.col || '#FFB3C7');
      c.fillRect(-w, top, w * 2, h);
      gloss(c, -w * 0.4, -h * 0.5, w * 0.2, h * 0.3, 0.45, 0);
      c.restore();
      c.lineWidth = 2.5 * s;
      c.strokeStyle = 'rgba(255,255,255,.9)';
      c.beginPath();
      c.moveTo(-w, -h); c.lineTo(w, -h); c.lineTo(w * 0.76, 0); c.quadraticCurveTo(0, 7 * s, -w * 0.76, 0);
      c.closePath();
      c.stroke();
      const lvl = -h * 0.92 * level;
      if (this.extras.includes('cream')) { c.save(); c.translate(0, lvl - 9 * s); this.drawExtra(c, 'cream', s * 1.4); c.restore(); }
      if (this.extras.includes('bubbles')) { c.save(); c.translate(-w * 0.3, lvl - 6 * s); this.drawExtra(c, 'bubbles', s * 1.1); c.restore(); }
      if (this.extras.includes('orange')) { c.save(); c.translate(w * 0.96, -h * 0.98); this.drawExtra(c, 'orange', s * 1.25); c.restore(); }
      if (this.extras.includes('berry')) { c.save(); c.translate(-w * 0.2, lvl - 22 * s); this.drawExtra(c, 'berry', s * 1); c.restore(); }
      if (this.extras.includes('umbrella')) { c.save(); c.translate(-w * 0.5, -h * 1.15); c.rotate(-0.3); this.drawExtra(c, 'umbrella', s * 1.4); c.restore(); }
    },
    paint(c, s = 1) { this.glassArt(c, s, 1); },
    draw(c) {
      const { cx, baseY, w, h } = this;
      const inGlass = this.step === 'pour' || this.step === 'garnish';
      if (!inGlass) {
        c.save();
        c.translate(cx + this.shake, baseY);
        groundShadow(c, 0, 8, w * 1.3, 11);
        // Jar
        c.fillStyle = 'rgba(220,240,255,.45)';
        rr(c, -w, -h, w * 2, h - 34, 18);
        c.fill();
        c.save();
        rr(c, -w, -h, w * 2, h - 34, 18);
        c.clip();
        const lv = this.level * (h - 44);
        if (this.blend > 0) {
          c.fillStyle = alpha(this.col || '#FFB3C7', clamp(this.blend * 2));
          ell(c, 0, -34, w * 1.2, lv + 8 + Math.sin(this.spin) * 3);
          c.fill();
          // The whirlpool
          c.strokeStyle = alpha(light(this.col || '#FFB3C7', 0.4), 0.6);
          c.lineWidth = 6;
          for (let i = 0; i < 3; i++) {
            c.beginPath();
            c.ellipse(0, -44 - i * 26, w * (0.6 - i * 0.1), 7, 0, this.spin + i, this.spin + i + 3.4);
            c.stroke();
          }
        }
        c.restore();
        for (const b of this.bits) {
          if (this.blend > 0.5) break;
          c.save();
          const sw = this.holding ? Math.sin(this.spin + b.x) * w * 0.4 : 0;
          c.translate(b.x + sw, b.y - 34);
          c.rotate(this.holding ? this.spin * 0.3 : b.x * 0.05);
          c.globalAlpha = 1 - clamp(this.blend * 2);
          drawFruit(c, b.id, b.r);
          c.restore();
        }
        c.lineWidth = 4;
        c.strokeStyle = 'rgba(255,255,255,.9)';
        rr(c, -w, -h, w * 2, h - 34, 18);
        c.stroke();
        gloss(c, -w * 0.5, -h * 0.6, w * 0.2, h * 0.24, 0.7, 0);
        // Lid and base
        c.fillStyle = clay(c, 0, -h - 6, w, '#FF8FB8');
        rr(c, -w - 4, -h - 14, w * 2 + 8, 18, 9);
        c.fill();
        c.fillStyle = hgrad(c, -w * 1.2, w * 1.2, '#FF8FB8', '#FFC2D4', '#FF7DAE');
        c.beginPath();
        c.moveTo(-w * 1.04, -36); c.lineTo(w * 1.04, -36); c.lineTo(w * 1.22, 4); c.lineTo(-w * 1.22, 4);
        c.closePath();
        c.fill();
        c.restore();
        // The big button: hold it down
        const b = this.btn, ready = this.bits.length > 0;
        if (ready) {
          const k = this.holding ? 0.9 : 1 + Math.sin(this.sc.t * 4) * 0.04;
          c.save();
          c.translate(b.x, b.y);
          c.scale(k, k);
          candy(c, 34, this.holding ? '#FF8A7A' : '#58CC7A');
          c.strokeStyle = '#fff';
          c.lineWidth = 5.5;
          c.lineCap = 'round';
          c.beginPath();
          for (let a = 0; a < 9; a += 0.4) {
            const r = a * 1.9, A = a + this.spin * 0.4;
            c[a ? 'lineTo' : 'moveTo'](Math.cos(A) * r, Math.sin(A) * r);
          }
          c.stroke();
          c.restore();
          // Stars count up the blending
          const n = 6, on = Math.floor(this.blend * n);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU - Math.PI / 2;
            softStar(c, b.x + Math.cos(a) * 48, b.y + Math.sin(a) * 48, i < on ? 9 : 6);
            c.fillStyle = i < on ? P.sun : 'rgba(255,255,255,.8)';
            c.fill();
          }
        }
      } else {
        c.save();
        c.translate(cx, baseY);
        groundShadow(c, 0, 8, 56, 10);
        this.glassArt(c, Math.min(1.5, this.sc.H / 480), this.step === 'pour' ? this.glass : 1);
        c.restore();
      }
    }
  }
};

// ---- the café itself --------------------------------------------------------------------
export const cafe = {
  tint: '#FFD9B8',

  enter() {
    this.t = 0;
    this.W = app.W;
    this.H = app.H;
    this.state = 'counter';
    this.recipe = null;
    this.shelf = null;
    this.buttons = [];
    this.served = 0;
    this.hearts = 0;
    this.seats = [];
    this.flying = [];
    music.play('cake');
    this.fillSeats();
    if (!save.data.seen.cafe && this.seats[0]) hint.set({ from: [this.seats[0].x, this.seats[0].y - 66], delay: 1.6 });
  },
  exit() {
    if (this.recipe && this.recipe.stopLoop) this.recipe.stopLoop();
  },
  resize() {
    this.W = app.W;
    this.H = app.H;
    this.seats.forEach((s, i) => { s.x = this.seatX(i); s.y = this.seatY(); });
    if (this.state === 'cook') {
      this.startRecipe(this.recipeId, this.seatNow);
    }
  },
  seatCount() { return this.W > 640 ? 4 : 3; },
  seatX(i) {
    const n = this.seatCount();
    return this.W / 2 + (i - (n - 1) / 2) * Math.min(this.W / n, 190);
  },
  seatY() { return this.H * 0.56; },
  foodY() { return this.H - 170 - app.safeBottom * 0.7; },

  pickGuest() {
    const taken = new Set(this.seats.filter(Boolean).map((s) => s.id));
    const mine = save.data.friends.filter((f) => !taken.has(f));
    const others = Object.keys(FRIENDS).filter((f) => !taken.has(f));
    return mine.length ? pick(mine) : pick(others);
  },

  fillSeats() {
    const n = this.seatCount();
    const used = new Set();
    for (let i = 0; i < n; i++) {
      let want = pick(DISHES);
      if (used.size < DISHES.length) while (used.has(want)) want = pick(DISHES);
      used.add(want);
      const seat = { id: this.pickGuest(), want, x: this.seatX(i), y: this.seatY(), slide: 0, hop: 0, v: 0, sq: new Spring(1, 300, 11), seed: i * 2.1, expr: null, exprT: 0, bubble: 0, plate: null, bites: 0 };
      this.seats[i] = seat;
      tween(seat, { slide: 1 }, 0.7, { ease: E.back, delay: 0.1 + i * 0.14, done: () => { audio.voice('chirp', FRIENDS[seat.id].voice, 0.4); tween(seat, { bubble: 1 }, 0.35, { ease: E.back }); } });
    }
  },

  startRecipe(id, seat) {
    this.state = 'cook';
    this.recipeId = id;
    this.seatNow = seat;
    this.shelf = null;
    this.buttons = [];
    hint.clear();
    // A fresh copy each time: the dish on a friend's plate must not change when the next is cooked
    this.recipe = Object.create(RECIPES[id]);
    this.recipe.kind_ = id;
    this.recipe.start(this);
  },

  /** The dish is done: back to the counter, where the friend tucks in. */
  finish() {
    const seat = this.seatNow, rec = this.recipe;
    if (rec.stopLoop) rec.stopLoop();
    this.state = 'counter';
    this.shelf = null;
    this.buttons = [];
    hint.clear();
    audio.success();
    fx.confetti(this.W, this.H, 40);
    if (seat) {
      seat.plate = rec;
      seat.plateS = 0;
      seat.bites = 0;
      seat.bubble = 0;
      seat.v = -340;
      seat.expr = 'heart';
      seat.exprT = 1.6;
      tween(seat, { plateS: 1 }, 0.4, { ease: E.back });
      audio.voice('wow', FRIENDS[seat.id].voice, 0.6);
      hint.set({ from: [seat.x, seat.y + 84], delay: 1.4 });
    }
    save.data.seen.cafe = 1;
    save.touch();
  },

  bite(seat, x, y) {
    seat.bites++;
    seat.chew = 0.7;
    seat.v = -180;
    audio.sfx('chew', { vol: 1 });
    wait(0.2, () => audio.sfx('chew', { rate: 1.2, vol: 0.8 }));
    wait(0.6, () => audio.voice('yum', FRIENDS[seat.id].voice, 0.55));
    fx.burst(x, y, { kind: 'dot', n: 7, colors: ['#FFE3A8', P.pink, '#E9A85C'], speed: 150, size: 7, g: 600, life: 0.6, spin: 0 });
    haptic();
    hint.clear();
    if (seat.bites >= 3) {
      seat.plate = null;
      seat.expr = 'heart';
      seat.exprT = 1.4;
      seat.v = -380;
      fx.hearts(seat.x, seat.y - 40, 8);
      audio.voice('giggle', FRIENDS[seat.id].voice, 0.6);
      this.served++;
      const h = { x: seat.x, y: seat.y - 30, s: 1 };
      this.flying.push(h);
      tween(h, { x: this.jarX(), y: this.jarY() - 16, s: 0.6 }, 0.8, {
        ease: E.io, done: () => {
          this.flying = this.flying.filter((q) => q !== h);
          this.hearts++;
          audio.note('bell', penta(this.hearts + 3), { vol: 0.5 });
          fx.sparkle(this.jarX(), this.jarY(), 8);
          if (this.hearts % 3 === 0) {
            save.earnStar();
            audio.fanfare();
            fx.stars(this.jarX(), this.jarY() - 20, 16);
          }
        }
      });
      // A new customer takes the seat
      wait(1.3, () => {
        tween(seat, { slide: 0 }, 0.4, {
          ease: E.in, done: () => {
            const others = this.seats.filter((s) => s !== seat).map((s) => s.want);
            const choice = DISHES.filter((d) => !others.includes(d));
            seat.want = pick(choice.length ? choice : DISHES);
            seat.id = this.pickGuest();
            seat.bubble = 0;
            tween(seat, { slide: 1 }, 0.6, { ease: E.back, done: () => { audio.voice('chirp', FRIENDS[seat.id].voice, 0.4); tween(seat, { bubble: 1 }, 0.35, { ease: E.back }); } });
          }
        });
      });
    }
  },

  jarX() { return this.W - 44; },
  jarY() { return Math.max(this.H * 0.82, this.H - 96 - app.safeBottom * 0.7); },

  update(dt) {
    this.t += dt;
    for (const s of this.seats) {
      s.v += 1000 * dt;
      s.hop += s.v * dt;
      if (s.hop > 0) { s.hop = 0; s.v = 0; }
      s.sq.step(dt);
      s.exprT = Math.max(0, s.exprT - dt);
      s.chew = Math.max(0, (s.chew || 0) - dt);
    }
    if (this.state === 'cook' && this.recipe.update) this.recipe.update(dt);
  },

  drawRoom(c) {
    const W = this.W, H = this.H;
    const back = softBack('cafe', W, H, '#FFF0DC', '#FFE1E8', (x) => {
      // Tiles on the wall
      x.strokeStyle = 'rgba(210,160,170,.22)';
      x.lineWidth = 2;
      for (let yy = 0; yy < H; yy += 44) {
        x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke();
        for (let xx = (yy / 44) % 2 ? 22 : 0; xx < W; xx += 44) {
          x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx, yy + 44); x.stroke();
        }
      }
      // Striped awning
      const n = Math.ceil(W / 46), top = app.safeTop;
      for (let i = 0; i < n; i++) {
        x.fillStyle = i % 2 ? '#FF8FB8' : '#FFFFFF';
        x.beginPath();
        x.moveTo(i * 46, 0);
        x.lineTo((i + 1) * 46, 0);
        x.lineTo((i + 1) * 46, top + 44);
        x.quadraticCurveTo((i + 0.5) * 46, top + 66, i * 46, top + 44);
        x.closePath();
        x.fill();
      }
      x.fillStyle = 'rgba(120,70,120,.12)';
      x.fillRect(0, H * 0.67, W, 12);
      // Counter
      x.fillStyle = vgrad(x, H * 0.68, H, '#C98A5C', '#A56A42');
      x.fillRect(0, H * 0.68, W, H);
      x.strokeStyle = 'rgba(90,50,30,.2)';
      x.lineWidth = 3;
      for (let i = 0; i < W / 70; i++) {
        x.beginPath(); x.moveTo(i * 70 + 20, H * 0.72); x.lineTo(i * 70 + 20, H); x.stroke();
      }
      x.fillStyle = vgrad(x, H * 0.655, H * 0.7, '#FFF9F1', '#F2E4D6');
      rr(x, -8, H * 0.655, W + 16, H * 0.05, 8);
      x.fill();
    });
    c.drawImage(back.cv, 0, 0, W, H);
  },

  drawKitchen(c) {
    const W = this.W, H = this.H;
    const back = softBack('cafeKitchen', W, H, '#FFF4E4', '#FFE7DA', (x) => {
      for (let i = 0; i < W / 40 + 1; i++) {
        if (i % 2) continue;
        x.fillStyle = 'rgba(255,255,255,.5)';
        x.fillRect(i * 40, 0, 40, H);
      }
      x.fillStyle = vgrad(x, H * 0.72, H, '#F7C6A8', '#E8A988');
      x.fillRect(0, H * 0.72, W, H);
      x.fillStyle = '#FFF6EC';
      x.fillRect(0, H * 0.72, W, 9);
    });
    c.drawImage(back.cv, 0, 0, W, H);
  },

  drawSeat(c, s) {
    const R = this.W > 640 ? 54 : 44;
    const slideX = s.x, y = s.y + (1 - s.slide) * 180;
    c.save();
    c.translate(slideX, y + s.hop);
    drawCreature(c, s.id, {
      R, t: this.t + s.seed, seed: s.seed, eyes: s.exprT > 0 ? s.expr : 'open', blink: s.exprT ? 0 : blinkAt(this.t, s.seed),
      mouth: s.chew > 0 ? 'chew' : 'smile', mouthOpen: s.chew > 0 ? 0 : s.exprT > 0 ? 0.7 : 0, lookY: s.plate ? 0.8 : 0
    });
    c.restore();
    // What they would like
    if (s.bubble > 0.01 && !s.plate) {
      const bob = Math.sin(this.t * 2 + s.seed) * 3, bx = s.x, by = y - R * 1.7 + bob;
      c.save();
      c.translate(bx, by);
      c.scale(s.bubble, s.bubble);
      c.save();
      c.shadowColor = 'rgba(70,40,130,.25)';
      c.shadowBlur = 8;
      c.shadowOffsetY = 3;
      c.fillStyle = '#fff';
      ell(c, 0, 0, 38);
      c.fill();
      ell(c, -8, 42, 7);
      c.fill();
      ell(c, -4, 54, 4);
      c.fill();
      c.restore();
      dishIcon(c, s.want, 27);
      c.restore();
    }
  },

  draw(c) {
    if (this.state === 'cook') {
      this.drawKitchen(c);
      this.recipe.draw(c);
      if (this.shelf) drawShelf(c, this, this.shelf);
      for (const b of this.buttons) b.draw(c);
      return;
    }
    this.drawRoom(c);
    for (const s of this.seats) this.drawSeat(c, s);
    this.drawMenu(c);
    // The counter top sits in front of them, plates on it
    const H = this.H;
    c.fillStyle = 'rgba(255,249,241,.96)';
    rr(c, -8, H * 0.655, this.W + 16, H * 0.04, 8);
    c.fill();
    for (const s of this.seats) {
      if (!s.plate) continue;
      const py = H * 0.69;
      c.save();
      c.translate(s.x, py);
      const k = s.plateS || 0;
      c.scale(k, k);
      plate(c, 0, 0, 56);
      const left = 1 - s.bites * 0.28;
      c.save();
      c.translate(0, -2);
      c.scale(left, left);
      if (s.plate.kind_ === 'pizza') c.scale(1, 0.5);
      s.plate.paint(c, this.servingScale(s.plate));
      c.restore();
      c.restore();
    }
    // Tip jar: full of hearts
    const jx = this.jarX(), jy = this.jarY();
    c.fillStyle = 'rgba(255,255,255,.6)';
    rr(c, jx - 26, jy - 28, 52, 56, 12);
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = '#fff';
    c.stroke();
    const n = Math.min(this.hearts, 9);
    for (let i = 0; i < n; i++) {
      heart(c, jx - 13 + (i % 3) * 13, jy + 16 - Math.floor(i / 3) * 14, 7);
      c.fillStyle = P.rose;
      c.fill();
    }
    for (const h of this.flying) {
      heart(c, h.x, h.y, 15 * h.s);
      c.fillStyle = P.rose;
      c.fill();
    }
  },

  // The menu on the front of the counter: tap anything to make it for whoever is free
  menuPos(i) {
    const gap = Math.min(92, (this.W - 110) / DISHES.length);
    return { x: this.W / 2 - 22 + (i - (DISHES.length - 1) / 2) * gap, y: Math.max(this.H * 0.82, this.H - 96 - app.safeBottom * 0.7), r: Math.min(36, gap * 0.45) };
  },
  drawMenu(c) {
    DISHES.forEach((id, i) => {
      const q = this.menuPos(i);
      c.save();
      c.translate(q.x, q.y + Math.sin(this.t * 1.6 + i) * 1.6);
      c.fillStyle = 'rgba(90,50,30,.25)';
      ell(c, 0, 3, q.r);
      c.fill();
      c.fillStyle = '#FFF9F1';
      ell(c, 0, 0, q.r);
      c.fill();
      dishIcon(c, id, q.r * 0.72);
      c.restore();
    });
  },

  servingScale(rec) {
    return { pizza: 60 / rec.R, smoothie: 0.7, burger: 0.62, icecream: 0.5 }[rec.kind_] || 0.68;
  },

  down(p) {
    if (this.state === 'cook') {
      this.recipe.down && this.recipe.down(p);
      return;
    }
    for (let i = 0; i < DISHES.length; i++) {
      const q = this.menuPos(i);
      if (dist(p.x, p.y, q.x, q.y) < q.r + 8) {
        const free = this.seats.find((s) => !s.plate && s.bubble > 0.6);
        if (free) {
          free.want = DISHES[i];
          audio.sfx('bubble', { vol: 0.9 });
          audio.voice('coo', FRIENDS[free.id].voice, 0.6);
          free.v = -260;
          haptic();
          hint.clear();
          p.startRecipe = free;
        }
        return;
      }
    }
    let best = null, bd = 1e9;
    for (const s of this.seats) {
      const d = Math.abs(p.x - s.x);
      if (d < bd) { bd = d; best = s; }
    }
    if (!best || bd > Math.min(this.W / this.seatCount(), 190) / 2 + 10 || p.y < best.y - 150 || p.y > this.H * 0.76) {
      fx.sparkle(p.x, p.y, 4);
      return;
    }
    if (best.plate) {
      this.bite(best, best.x, this.H * 0.68);
      return;
    }
    if (best.bubble > 0.6) {
      hint.clear();
      audio.sfx('bubble', { vol: 0.9 });
      audio.voice('coo', FRIENDS[best.id].voice, 0.6);
      best.v = -260;
      haptic();
      p.startRecipe = best;
    }
  },

  move(p) {
    if (this.state === 'cook') this.recipe.move && this.recipe.move(p);
  },

  up(p) {
    if (p.startRecipe && this.state === 'counter') {
      this.startRecipe(p.startRecipe.want, p.startRecipe);
      return;
    }
    if (this.state === 'cook') this.recipe.up && this.recipe.up(p);
  }
};
