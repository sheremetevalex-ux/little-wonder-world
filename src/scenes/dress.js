// Fashion studio: try on anything with a tap or by dragging it to the doll, recolour
// it with one touch, take a photo, or walk the runway in front of all her friends.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rr, rand, pick, dist, clamp, lerp, clay, light, dark, gloss, alpha, vgrad, glow, TAU, softStar, sprite, heart, groundShadow, sparkleShape, grain, hgrad, mix } from '../core/draw.js';
import { drawDoll, drawHairTile, HAIR, DRESS, SHOES, HEADWEAR, BACK, HAND, SKINS, EYES, HAIR_COLORS, DEFAULT_DOLL } from '../art/doll.js';
import { softBack } from '../art/world.js';
import { drawCreature, FRIENDS, blinkAt } from '../art/creatures.js';

// Gifts she receives by hatching eggs. They simply aren't shown until earned.
const LOCKED = ['dress:mermaid', 'dress:butterfly', 'dress:ice', 'dress:princess', 'hair:space', 'hair:braid', 'head:horn', 'head:starband', 'head:witch', 'back:rainbow', 'back:angel', 'hand:kitten', 'hand:mirror', 'hand:lolli', 'shoes:bunny', 'shoes:sparkle', 'stage:candy', 'stage:sea'];

export function unlockNextItem() {
  const u = save.data.unlocked;
  const next = LOCKED.find((k) => !u.includes(k));
  if (!next) return null;
  u.push(next);
  save.data.freshItems = save.data.freshItems || [];
  save.data.freshItems.push(next);
  return next;
}

export function drawGiftItem(c, key, size) {
  const [cat, id] = key.split(':');
  c.save();
  const k = size / 100;
  c.scale(k, k);
  paintTile(c, CATS[cat] || CATS.dress, id, 'preview');
  c.restore();
}

function firstCol(table, id) { return (table[id].colors || [null])[0]; }

const STAGES = {
  palace: {
    top: '#D3C2FF', bot: '#FFD7EC', paint(c, W, H, fl) {
      // Tall arched windows
      for (let i = -1; i < Math.ceil(W / 110) + 1; i++) {
        const x = i * 110 + 26;
        c.fillStyle = vgrad(c, 60, fl, 'rgba(255,255,255,.7)', 'rgba(255,240,250,.28)');
        c.beginPath();
        c.moveTo(x, fl - 46);
        c.lineTo(x, 130);
        c.quadraticCurveTo(x + 32, 62, x + 64, 130);
        c.lineTo(x + 64, fl - 46);
        c.closePath();
        c.fill();
        softStar(c, x + 32, 130, 8);
        c.fillStyle = 'rgba(255,220,120,.9)';
        c.fill();
      }
      c.fillStyle = vgrad(c, fl - 40, H, '#FFEAF4', '#E8B9E2');
      c.fillRect(0, fl - 40, W, H);
      c.fillStyle = 'rgba(160,110,200,.14)';
      for (let i = 0; i < 12; i++) c.fillRect(0, fl - 40 + i * i * 2.6, W, 1.5);
    }
  },
  meadow: {
    top: '#8FD6FF', bot: '#E9FFF2', paint(c, W, H, fl) {
      for (const [x, y, r] of [[W * 0.2, 90, 30], [W * 0.27, 84, 40], [W * 0.36, 94, 28], [W * 0.75, 136, 26], [W * 0.82, 128, 34], [W * 0.9, 138, 22]]) {
        c.fillStyle = 'rgba(255,255,255,.88)';
        ell(c, x, y, r);
        c.fill();
      }
      c.fillStyle = vgrad(c, fl - 96, fl, '#C5F2A8', '#8FE292');
      c.beginPath();
      c.moveTo(0, fl - 50);
      c.quadraticCurveTo(W * 0.3, fl - 130, W * 0.6, fl - 60);
      c.quadraticCurveTo(W * 0.85, fl - 20, W, fl - 80);
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
      c.fill();
      c.fillStyle = vgrad(c, fl - 40, H, '#8FE292', '#55C47B');
      c.fillRect(0, fl - 26, W, H);
      const cols = ['#FF9FC3', '#FFF', '#FFD45C', '#C7ABFF'];
      for (let i = 0; i < W * 0.09; i++) {
        const x = (i * 83.7) % W, y = fl - 18 + ((i * 29) % 70);
        c.fillStyle = cols[i % 4];
        for (let k = 0; k < 5; k++) {
          ell(c, x + Math.cos(k * 1.26) * 4, y + Math.sin(k * 1.26) * 4, 3);
          c.fill();
        }
        c.fillStyle = '#FFC233';
        ell(c, x, y, 2.3);
        c.fill();
      }
    }
  },
  beach: {
    top: '#7FD8FF', bot: '#FFF0C8', paint(c, W, H, fl) {
      c.fillStyle = 'rgba(255,241,170,.95)';
      ell(c, W * 0.8, 100, 34);
      c.fill();
      c.fillStyle = vgrad(c, fl - 130, fl - 26, '#3FBFE0', '#8DE6E0');
      c.fillRect(0, fl - 130, W, 120);
      c.fillStyle = 'rgba(255,255,255,.5)';
      for (let i = 0; i < 12; i++) {
        c.fillRect((i * 67.3) % W, fl - 124 + ((i * 17) % 90), 26 + (i % 3) * 12, 2.5);
      }
      c.fillStyle = vgrad(c, fl - 30, H, '#FFEBB4', '#F7CF88');
      c.beginPath();
      c.moveTo(0, fl - 22);
      c.quadraticCurveTo(W * 0.5, fl - 44, W, fl - 16);
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
      c.fill();
      for (let i = 0; i < 16; i++) {
        c.fillStyle = 'rgba(190,130,70,.25)';
        ell(c, (i * 97.1) % W, fl + ((i * 41) % 70), 2);
        c.fill();
      }
    }
  },
  night: {
    top: '#201B66', bot: '#7C5AC2', paint(c, W, H, fl) {
      for (let i = 0; i < 80; i++) {
        c.fillStyle = `rgba(255,250,220,${0.3 + (i % 7) / 10})`;
        ell(c, (i * 113.3) % W, (i * 57.7) % (fl - 60), 0.7 + (i % 3) * 0.6);
        c.fill();
      }
      c.fillStyle = clay(c, W * 0.8, 110, 36, '#FFF3C4');
      ell(c, W * 0.8, 110, 34);
      c.fill();
      c.fillStyle = vgrad(c, fl - 40, H, '#4A3AA0', '#2D2470');
      c.beginPath();
      c.moveTo(0, fl - 30);
      c.quadraticCurveTo(W * 0.5, fl - 60, W, fl - 24);
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
      c.fill();
    }
  },
  candy: {
    top: '#FFC4E6', bot: '#FFF3D0', paint(c, W, H, fl) {
      const cols = ['#FF7DAE', '#7FE3C8', '#FFC233', '#B48BFF', '#6FC6FF'];
      for (let i = 0; i < Math.ceil(W / 70) + 1; i++) {
        const x = i * 70 + 10, col = cols[i % 5], y = fl - 100 - (i % 3) * 34;
        c.strokeStyle = '#FFF';
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(x, fl);
        c.lineTo(x, y);
        c.stroke();
        c.fillStyle = clay(c, x, y, 30, col);
        ell(c, x, y, 28);
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,.65)';
        c.lineWidth = 4;
        c.beginPath();
        for (let a = 0; a < 12; a += 0.3) c.lineTo(x + Math.cos(a) * a * 1.9, y + Math.sin(a) * a * 1.9);
        c.stroke();
      }
      c.fillStyle = vgrad(c, fl - 20, H, '#FFE7F4', '#FFB6D8');
      c.beginPath();
      c.moveTo(0, fl - 16);
      for (let x = 0; x <= W + 30; x += 30) c.quadraticCurveTo(x + 15, fl - 34, x + 30, fl - 16);
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
      c.fill();
    }
  },
  sea: {
    top: '#3DD0E0', bot: '#1E5FAE', paint(c, W, H, fl) {
      c.fillStyle = 'rgba(255,255,255,.14)';
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.moveTo(i * W / 5 + 10, 0);
        c.lineTo(i * W / 5 + 70, 0);
        c.lineTo(i * W / 5 - 30, fl);
        c.lineTo(i * W / 5 - 110, fl);
        c.closePath();
        c.fill();
      }
      for (let i = 0; i < 26; i++) {
        c.fillStyle = 'rgba(255,255,255,.3)';
        ell(c, (i * 71) % W, (i * 43) % (fl - 40), 2 + (i % 4));
        c.fill();
      }
      c.fillStyle = vgrad(c, fl - 30, H, '#F7E0A8', '#C99D60');
      c.fillRect(0, fl - 18, W, H);
      const cor = ['#FF7DAE', '#FFB65C', '#B48BFF'];
      for (let i = 0; i < W / 62; i++) {
        c.strokeStyle = cor[i % 3];
        c.lineWidth = 8;
        c.lineCap = 'round';
        const x = i * 62 + 20;
        for (const a of [-0.5, 0, 0.5]) {
          c.beginPath();
          c.moveTo(x, fl - 8);
          c.lineTo(x + Math.sin(a) * 36, fl - 8 - Math.cos(a) * 44 * (1 - (i % 2) * 0.3));
          c.stroke();
        }
      }
    }
  }
};

function paintDressTile(c, id, col) {
  c.save();
  c.translate(0, -8);
  c.scale(0.42, 0.42);
  DRESS[id].draw(c, col, 0, 0);
  c.restore();
}

const CATS = {
  dress: { key: 'dress', colKey: 'dressCol', table: DRESS, color: P.rose },
  hair: { key: 'hair', colKey: 'hairCol', table: HAIR, color: '#E98B3E', cols: HAIR_COLORS },
  head: { key: 'head', colKey: 'headCol', table: HEADWEAR, color: P.sun },
  back: { key: 'back', colKey: 'backCol', table: BACK, color: P.sky },
  shoes: { key: 'shoes', colKey: 'shoesCol', table: SHOES, color: P.violet },
  hand: { key: 'hand', colKey: 'handCol', table: HAND, color: P.teal },
  face: { key: 'skin', table: null, color: '#F0BE96' },
  stage: { key: 'stage', table: STAGES, color: '#7C8CE8' }
};

function paintCatIcon(c, name, r) {
  c.save();
  c.scale(r / 26, r / 26);
  const sc = (s, ty) => { c.scale(s, s); c.translate(0, ty); };
  switch (name) {
    case 'dress': sc(0.3, -30); DRESS.gown.draw(c, '#FFFFFF', 0, 0); break;
    case 'hair':
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(-14, 14);
      c.bezierCurveTo(-20, -20, 20, -20, 14, 14);
      c.quadraticCurveTo(7, 9, 7, 2);
      c.quadraticCurveTo(0, 0, -7, 2);
      c.quadraticCurveTo(-7, 9, -14, 14);
      c.fill();
      break;
    case 'head': sc(0.34, 150); HEADWEAR.crown.draw(c, '#FFFFFF'); break;
    case 'back': sc(0.2, 16); BACK.fairy.draw(c, '#FFFFFF', 0, 0); break;
    case 'shoes':
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(-15, 8); c.lineTo(-15, -8); c.quadraticCurveTo(-8, -10, -5, -4);
      c.quadraticCurveTo(4, 0, 12, 1); c.quadraticCurveTo(17, 3, 16, 8);
      c.closePath();
      c.fill();
      break;
    case 'hand': sc(0.4, 30); HAND.wand.draw(c, '#FFFFFF', 0); break;
    case 'face':
      c.fillStyle = '#fff';
      ell(c, 0, 0, 15);
      c.fill();
      c.fillStyle = P.ink;
      for (const s of [-1, 1]) { ell(c, s * 5.5, -2, 2.2, 3); c.fill(); }
      c.strokeStyle = P.rose;
      c.lineWidth = 2;
      c.beginPath(); c.arc(0, 3, 4.5, 0.3, Math.PI - 0.3); c.stroke();
      break;
    case 'stage':
      c.fillStyle = '#fff';
      rr(c, -16, -13, 32, 26, 6);
      c.fill();
      c.fillStyle = '#7C8CE8';
      c.beginPath();
      c.moveTo(-13, 10); c.lineTo(-4, -3); c.lineTo(3, 5); c.lineTo(7, 0); c.lineTo(13, 10);
      c.closePath();
      c.fill();
      ell(c, 8, -7, 3.2);
      c.fill();
      break;
  }
  c.restore();
}

/** Draws one wardrobe item centred in a ~100 unit tile. */
function paintTile(c, cat, id, col) {
  const key = cat.key;
  const color = (table) => (col && col !== 'preview' ? col : firstCol(table, id));
  if (key === 'dress') { paintDressTile(c, id, color(DRESS)); return; }
  if (key === 'hair') {
    c.save();
    c.translate(0, 8);
    c.scale(1.05, 1.05);
    drawHairTile(c, id, col && col !== 'preview' ? col : '#E98B3E', '#FBD3B6');
    c.restore();
    return;
  }
  if (key === 'head') {
    c.save();
    const off = { tiara: [0.8, 148], crown: [0.62, 160], flowers: [0.62, 128], bow: [0.92, 144], cat: [0.74, 136], bunny: [0.62, 180], horn: [0.72, 168], witch: [0.46, 170], sunhat: [0.5, 142], phones: [0.5, 88], starband: [0.72, 160] }[id] || [0.6, 140];
    c.scale(off[0], off[0]);
    c.translate(id === 'bow' ? -30 : 0, off[1]);
    HEADWEAR[id].draw(c, color(HEADWEAR), 0, 0);
    c.restore();
    return;
  }
  if (key === 'back') {
    c.save();
    c.scale(0.36, 0.36);
    c.translate(0, id === 'cape' ? -28 : 18);
    BACK[id].draw(c, color(BACK), 0, 0);
    c.restore();
    return;
  }
  if (key === 'shoes') {
    c.save();
    const sc = id === 'boots' ? 1 : 1.25;
    c.scale(sc, sc);
    c.translate(0, id === 'boots' ? -90 : -102);
    SHOES[id].draw(c, color(SHOES));
    c.restore();
    return;
  }
  if (key === 'hand') {
    c.save();
    const sc = id === 'balloon' ? 0.44 : 0.72;
    c.scale(sc, sc);
    c.translate(-4, { wand: 26, flower: 14, balloon: 62, teddy: 8, icecream: 14, lolli: 18, mirror: 14, kitten: 22 }[id] || 16);
    HAND[id].draw(c, color(HAND), 0, 0);
    c.restore();
    return;
  }
  if (key === 'stage') {
    const s = STAGES[id];
    c.save();
    rr(c, -32, -32, 64, 64, 14);
    c.clip();
    const spr = stageSprite(id, 390, 700, 520);
    c.drawImage(spr.cv, -32, -32, 64, 115);
    c.restore();
  }
}

function stageSprite(id, W, H, fl) {
  const s = STAGES[id];
  return sprite(`stage:${id}:${W | 0}:${H | 0}:${fl | 0}`, W, H, (c) => {
    c.fillStyle = vgrad(c, 0, fl, s.top, s.bot);
    c.fillRect(0, 0, W, H);
    s.paint(c, W, H, fl);
    grain(c, W, H, 0.04);
  }, 2);
}

export const dress = {
  tint: '#FF9FC3',

  enter() {
    const d = save.data;
    d.doll = { ...DEFAULT_DOLL, stage: 'palace', ...(d.doll || {}) };
    this.d = d.doll;
    this.t = 0;
    this.bounce = new Spring(1, 300, 11);
    this.expr = null;
    this.exprT = 0;
    this.tw = { a: 0 };
    this.cat = 'dress';
    this.scroll = 0;
    this.scrollV = 0;
    this.drag = null;
    this.look = { x: 0, y: 0, on: 0 };
    this.fresh = new Set(d.freshItems || []);
    this.show = null;
    this.flash = 0;
    this.poly = null;
    this.layout();
    music.play('dress');
    if (!d.seen.dress) hint.set({ from: [this.tileX(1), this.rowY], to: [this.cx, this.dollY - 40], delay: 1.6 });
  },

  exit() { save.touch(); },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    this.cx = W / 2;
    this.panelH = 158 + app.safeBottom;
    this.panelY = H - this.panelH;
    this.catY = this.panelY + 30;
    this.rowY = this.panelY + 100;
    this.tile = 74;
    this.fl = this.panelY - 16;
    const room = this.fl - (Math.max(app.safeTop, 6) + 16);
    this.dollS = clamp(room / 330, 0.86, 1.8);
    this.dollY = this.fl - 118 * this.dollS;
    const bx = W - 42;
    this.buttons = [
      new Btn({
        x: bx, y: this.panelY - 66, r: 27, slop: 8, paint: (c, r) => {
          candy(c, r, P.sun);
          softStar(c, 0, -2, 15);
          c.fillStyle = '#fff';
          c.fill();
        }, tap: () => this.startShow()
      }),
      new Btn({
        x: bx, y: this.panelY - 130, r: 27, slop: 8, paint: (c, r) => {
          candy(c, r, P.teal);
          c.fillStyle = '#fff';
          rr(c, -15, -9, 30, 21, 6);
          c.fill();
          rr(c, -6, -14, 12, 6, 2);
          c.fill();
          c.fillStyle = P.teal;
          ell(c, 0, 1, 6.5);
          c.fill();
          c.fillStyle = '#fff';
          ell(c, 0, 1, 3.2);
          c.fill();
        }, tap: () => this.takePhoto()
      }),
      new Btn({
        x: bx, y: this.panelY - 194, r: 27, slop: 8, paint: (c, r) => {
          candy(c, r, P.violet);
          c.save();
          c.rotate(0.5);
          c.fillStyle = '#fff';
          rr(c, -3, -2, 6, 24, 3);
          c.fill();
          c.restore();
          softStar(c, 5, -10, 11);
          c.fillStyle = P.butter;
          c.fill();
        }, tap: () => this.surprise()
      })
    ];
  },
  resize() { this.layout(); },

  tileX(i) { return 54 + i * (this.tile + 10) + this.scroll; },

  catList() { return Object.keys(CATS); },

  items() {
    const cat = CATS[this.cat], u = save.data.unlocked;
    if (this.cat === 'face') {
      return [...SKINS.map((c, i) => ({ id: 'skin' + i, skin: i })), ...EYES.map((c, i) => ({ id: 'eye' + i, eye: i }))];
    }
    return Object.keys(cat.table).filter((id) => !LOCKED.includes(this.cat + ':' + id) || u.includes(this.cat + ':' + id)).map((id) => ({ id }));
  },

  activeColors() {
    const cat = CATS[this.cat];
    if (this.cat === 'hair') return HAIR_COLORS;
    if (!cat.table || this.cat === 'stage') return null;
    const cur = cat.table[this.d[cat.key]];
    return cur && cur.colors ? cur.colors : null;
  },

  isOn(it) {
    const c = CATS[this.cat];
    if (this.cat === 'face') return it.skin !== undefined ? this.d.skin === it.skin : this.d.eye === it.eye;
    return this.d[c.key] === it.id;
  },

  apply(it, x, y) {
    const c = CATS[this.cat], d = this.d;
    if (this.cat === 'face') {
      if (it.skin !== undefined) d.skin = it.skin;
      else d.eye = it.eye;
    } else {
      d[c.key] = it.id;
      if (c.colKey && c.table[it.id].colors && !c.table[it.id].colors.includes(d[c.colKey])) d[c.colKey] = c.table[it.id].colors[0];
    }
    const k = this.cat + ':' + it.id;
    if (this.fresh.has(k)) {
      this.fresh.delete(k);
      save.data.freshItems = [...this.fresh];
    }
    save.data.seen.dress = 1;
    hint.clear();
    save.touch();
    this.react(x, y);
  },

  react(x, y) {
    this.bounce.kick(4.5);
    this.expr = pick(['happy', 'happy', 'wow']);
    this.exprT = 0.95;
    audio.sfx('swish', { vol: 0.8 });
    audio.note('bell', penta(Math.floor(rand(0, 7))), { vol: 0.45 });
    audio.note('kalimba', penta(Math.floor(rand(-2, 4))), { vol: 0.34, when: audio.now + 0.07 });
    if (Math.random() < 0.3) audio.voice('giggle', 1.15, 0.45);
    haptic();
    const part = { dress: 0, hair: -130, head: -160, back: -30, shoes: 100, hand: 10, face: -90, stage: -30 }[this.cat] || 0;
    fx.sparkle(this.cx + rand(-30, 30), this.dollY + part * this.dollS, 16);
  },

  surprise() {
    const list = (t, cat) => Object.keys(t).filter((id) => !LOCKED.includes(cat + ':' + id) || save.data.unlocked.includes(cat + ':' + id));
    const d = this.d;
    const col = (t, id) => (t[id].colors ? pick(t[id].colors) : null);
    d.dress = pick(list(DRESS, 'dress')); d.dressCol = col(DRESS, d.dress);
    d.hair = pick(list(HAIR, 'hair')); d.hairCol = pick(HAIR_COLORS);
    d.head = pick(list(HEADWEAR, 'head')); d.headCol = col(HEADWEAR, d.head);
    d.back = pick(list(BACK, 'back')); d.backCol = col(BACK, d.back);
    d.shoes = pick(list(SHOES, 'shoes')); d.shoesCol = col(SHOES, d.shoes);
    d.hand = pick(list(HAND, 'hand')); d.handCol = col(HAND, d.hand);
    save.touch();
    this.bounce.kick(7);
    this.expr = 'wow';
    this.exprT = 1.2;
    this.tw.a = 0;
    tween(this.tw, { a: TAU }, 0.8, { ease: E.io, done: () => { this.tw.a = 0; } });
    audio.sparkle(0, 6, 0.55);
    audio.sfx('whoosh');
    fx.burst(this.cx, this.dollY, { kind: 'star', n: 22, colors: [P.sun, P.pink, P.lilac, P.sky], speed: 340, size: 20, g: 120 });
  },

  drawStage(c, H0 = this.H) {
    const st = STAGES[this.d.stage] ? this.d.stage : 'palace';
    const spr = stageSprite(st, this.W, this.H, this.fl);
    c.drawImage(spr.cv, 0, 0, this.W, this.H);
  },

  update(dt) {
    this.t += dt;
    this.bounce.step(dt);
    this.exprT = Math.max(0, this.exprT - dt);
    if (this.exprT <= 0) this.expr = null;
    if (!this.pDown) {
      this.scroll += this.scrollV * dt;
      this.scrollV *= Math.pow(0.03, dt);
    }
    const n = this.items().length, minS = Math.min(0, this.W - 108 - (n - 1) * (this.tile + 10));
    if (this.scroll > 0) { this.scroll *= Math.pow(0.0005, dt); }
    if (this.scroll < minS) { this.scroll = minS + (this.scroll - minS) * Math.pow(0.0005, dt); }
    this.look.on = Math.max(0, this.look.on - dt * 0.8);
    this.flash = Math.max(0, this.flash - dt * 3);
    if (this.show) this.updateShow(dt);
  },

  paintDoll(c, x, y, s, extra = {}) {
    const lookK = this.look.on > 0 ? 1 : 0;
    const q = this.bounce.x;
    const twirl = Math.cos(this.tw.a);
    groundShadow(c, x, y + 114 * s, 72 * s, 15 * s, 0.26);
    c.save();
    c.translate(x, y + 114 * s);
    c.scale(s * (2 - q) * (Math.abs(twirl) * 0.86 + 0.14) * (twirl < 0 ? -1 : 1), s * q);
    c.translate(0, -114);
    drawDoll(c, this.d, {
      t: this.t, sway: this.tw.a ? Math.sin(this.tw.a) * 3 : this.bounce.v * 0.1, expr: this.expr || 'open', blink: blinkAt(this.t, 2),
      lookX: lookK * clamp((this.look.x - x) / 100, -1, 1), lookY: lookK * clamp((this.look.y - (y - 80 * s)) / 140, -1, 1), ...extra
    });
    c.restore();
  },

  draw(c) {
    this.drawStage(c);
    if (this.show) { this.drawShow(c); return; }
    this.paintDoll(c, this.cx, this.dollY, this.dollS);
    for (const b of this.buttons) b.draw(c);
    this.drawPanel(c);
    if (this.drag) {
      const cat = CATS[this.cat];
      c.save();
      c.translate(this.drag.x, this.drag.y - 22);
      c.scale(1.2, 1.2);
      paintTile(c, cat, this.drag.it.id, this.colOf(this.drag.it));
      c.restore();
    }
    if (this.poly) this.drawPolaroid(c);
    if (this.flash > 0) {
      c.fillStyle = `rgba(255,255,255,${this.flash})`;
      c.fillRect(0, 0, this.W, this.H);
    }
  },

  colOf(it) {
    const c = CATS[this.cat];
    if (!c.colKey) return null;
    return this.isOn(it) ? this.d[c.colKey] : (this.cat === 'hair' ? this.d.hairCol : null);
  },

  drawPanel(c) {
    const W = this.W, y = this.panelY;
    // Panel as a soft cream shelf
    c.save();
    c.shadowColor = 'rgba(70,40,130,.28)';
    c.shadowBlur = 14;
    c.shadowOffsetY = -3;
    c.fillStyle = '#FFF9F1';
    rr(c, -10, y, W + 20, this.panelH + 30, 26);
    c.fill();
    c.restore();

    // Tabs
    const names = this.catList();
    const n = names.length, slot = Math.min(W - 20, 480) / n, x0 = W / 2 - (slot * (n - 1)) / 2;
    this.catX = names.map((_, i) => x0 + i * slot);
    names.forEach((name, i) => {
      const x = this.catX[i], on = name === this.cat, col = CATS[name].color;
      const r = on ? 22 : 19;
      c.save();
      c.translate(x, this.catY + (on ? -2 : 0));
      c.fillStyle = dark(col, 0.2);
      ell(c, 0, 2.4, r);
      c.fill();
      c.fillStyle = clay(c, 0, 0, r, on ? col : mix(col, '#FFFFFF', 0.28));
      ell(c, 0, 0, r);
      c.fill();
      paintCatIcon(c, name, r * 0.95);
      if (on) {
        c.lineWidth = 3;
        c.strokeStyle = '#fff';
        ell(c, 0, 0, r - 1);
        c.stroke();
      }
      if ([...this.fresh].some((k) => k.startsWith(name + ':'))) {
        const k = 0.6 + 0.4 * Math.sin(this.t * 5);
        sparkleShape(c, r * 0.8, -r * 0.8, 10 * k);
        c.fillStyle = P.sun;
        c.fill();
      }
      c.restore();
    });

    // Items
    const its = this.items(), T = this.tile;
    c.save();
    c.beginPath();
    c.rect(0, y + 52, W, 96);
    c.clip();
    const cols = this.activeColors();
    its.forEach((it, i) => {
      const x = this.tileX(i), yy = this.rowY;
      if (x < -60 || x > W + 60) return;
      const on = this.isOn(it);
      c.save();
      c.translate(x, yy + (on ? -2 : 0));
      if (it.press) c.scale(0.92, 0.92);
      rr(c, -T / 2, -T / 2, T, T, 20);
      c.fillStyle = on ? '#FFF0C8' : '#FFFFFF';
      c.fill();
      c.lineWidth = on ? 4 : 2;
      c.strokeStyle = on ? P.sun : '#EEE0F5';
      c.stroke();
      if (it.id === 'none') {
        c.strokeStyle = '#D9CFE8';
        c.lineWidth = 5;
        c.lineCap = 'round';
        ell(c, 0, 0, 17);
        c.stroke();
        c.beginPath(); c.moveTo(-11, -11); c.lineTo(11, 11); c.stroke();
      } else if (this.cat === 'face') {
        if (it.skin !== undefined) {
          c.fillStyle = clay(c, 0, 0, 22, SKINS[it.skin]);
          ell(c, 0, 0, 22);
          c.fill();
        } else {
          c.fillStyle = '#fff';
          ell(c, 0, 0, 18, 22);
          c.fill();
          c.fillStyle = clay(c, 0, 0, 15, EYES[it.eye]);
          ell(c, 0, 1, 14, 18);
          c.fill();
          c.fillStyle = '#2A1B46';
          ell(c, 0, 1, 7, 10);
          c.fill();
          c.fillStyle = '#fff';
          ell(c, -4, -6, 4);
          c.fill();
        }
      } else {
        c.save();
        rr(c, -T / 2 + 2, -T / 2 + 2, T - 4, T - 4, 18);
        c.clip();
        paintTile(c, CATS[this.cat], it.id, this.colOf(it));
        c.restore();
      }
      if (this.fresh.has(this.cat + ':' + it.id)) {
        const k = 0.6 + 0.4 * Math.sin(this.t * 5);
        sparkleShape(c, T / 2 - 12, -T / 2 + 12, 11 * k);
        c.fillStyle = P.sun;
        c.fill();
      }
      c.restore();
    });
    c.restore();

    // Paint drops: touch one to recolour what she is wearing
    if (cols) {
      const step = Math.min(42, (y - Math.max(app.safeTop, 8) - 84) / cols.length);
      this.palette = cols.map((col, i) => ({ col, x: 32, y: y - 30 - i * step }));
      const curKey = CATS[this.cat].colKey;
      for (const p of this.palette) {
        const on = this.d[curKey] === p.col;
        c.save();
        c.translate(p.x, p.y + Math.sin(this.t * 2 + p.x) * 1.3);
        const r = on ? 17 : 15;
        c.fillStyle = 'rgba(70,40,130,.2)';
        ell(c, 0, 3, r);
        c.fill();
        if (p.col === 'rainbow') {
          ['#FF7F9F', '#FFB65C', '#FFE066', '#7FE3A0', '#6FC6FF', '#B48BFF'].forEach((k, i) => {
            c.fillStyle = k;
            c.beginPath();
            c.moveTo(0, 0);
            c.arc(0, 0, r, (i / 6) * TAU, ((i + 1) / 6) * TAU);
            c.fill();
          });
        } else {
          c.fillStyle = clay(c, 0, 0, r, p.col);
          ell(c, 0, 0, r);
          c.fill();
        }
        c.lineWidth = on ? 3.6 : 2.4;
        c.strokeStyle = '#fff';
        ell(c, 0, 0, r);
        c.stroke();
        gloss(c, -r * 0.3, -r * 0.42, r * 0.36, r * 0.22, 0.75);
        c.restore();
      }
    } else this.palette = null;
  },

  // ---- input -------------------------------------------------------------------
  down(p) {
    this.look.x = p.x; this.look.y = p.y; this.look.on = 1;
    if (this.show) {
      fx.hearts(p.x, p.y, 6);
      audio.note('bell', penta(Math.floor(rand(0, 8))), { vol: 0.4 });
      return;
    }
    if (this.palette) {
      for (const q of this.palette) {
        if (dist(p.x, p.y, q.x, q.y) < 22) {
          this.d[CATS[this.cat].colKey] = q.col;
          this.react();
          save.touch();
          return;
        }
      }
    }
    if (p.y >= this.panelY) {
      if (p.y < this.panelY + 56) {
        const names = this.catList();
        let best = -1, bd = 1e9;
        names.forEach((n, i) => {
          const d = Math.abs(p.x - this.catX[i]);
          if (d < bd) { bd = d; best = i; }
        });
        if (names[best] !== this.cat) {
          this.cat = names[best];
          this.scroll = 0;
          this.scrollV = 0;
          audio.note('marimba', penta(best), { vol: 0.65 });
          haptic();
        }
        return;
      }
      p.row = true;
      this.pDown = true;
      p.lastX = p.x;
      this.scrollV = 0;
      const its = this.items();
      const i = Math.round((p.x - 54 - this.scroll) / (this.tile + 10));
      if (i >= 0 && i < its.length && Math.abs(this.tileX(i) - p.x) < this.tile / 2 + 3) {
        p.it = its[i];
        p.it.press = 1;
      }
      return;
    }
    // The doll herself: tap to twirl
    if (dist(p.x, p.y, this.cx, this.dollY - 40) < 130 * this.dollS) {
      this.twirl();
      return;
    }
    fx.sparkle(p.x, p.y, 4);
  },

  twirl() {
    if (this.tw.a) return;
    tween(this.tw, { a: TAU }, 0.85, { ease: E.io, done: () => { this.tw.a = 0; } });
    this.expr = 'happy';
    this.exprT = 1;
    audio.voice('giggle', 1.15, 0.55);
    audio.sparkle(1, 4, 0.3);
    fx.sparkle(this.cx, this.dollY, 10);
  },

  move(p) {
    this.look.x = p.x; this.look.y = p.y; this.look.on = 1;
    if (!p.row) return;
    if (this.drag && this.drag.p === p) {
      this.drag.x = p.x;
      this.drag.y = p.y;
      return;
    }
    const dx = p.x - p.lastX;
    p.lastX = p.x;
    const up = p.sy - p.y, side = Math.abs(p.x - p.sx);
    if (p.it && up > 22 && up > side * 1.1) {
      if (this.cat !== 'stage') {
        this.drag = { it: p.it, p, x: p.x, y: p.y };
        audio.sfx('swish');
      }
      p.it.press = 0;
      return;
    }
    if (side > 8) {
      if (p.it) { p.it.press = 0; p.it = null; }
      this.scroll += dx;
      this.scrollV = dx / Math.max(app.dt, 0.008);
    }
  },

  up(p) {
    if (!p.row) return;
    this.pDown = false;
    if (p.it) p.it.press = 0;
    if (this.drag && this.drag.p === p) {
      const it = this.drag.it;
      this.drag = null;
      if (p.y < this.panelY) this.apply(it, p.x, p.y);
      return;
    }
    if (p.it && p.moved < 16) this.apply(p.it, p.x, p.y);
  },

  // ---- photo: polaroid drops into the album ----------------------------------------
  capture() {
    const w = 240, h = 300, s = w / 280;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const x = cv.getContext('2d');
    const st = STAGES[this.d.stage] ? this.d.stage : 'palace';
    x.drawImage(stageSprite(st, this.W, this.H, this.fl).cv, 0, 0, w, Math.round(w * (this.H / this.W)));
    x.save();
    x.translate(w / 2, 180);
    x.scale(0.68, 0.68);
    drawDoll(x, this.d, { t: this.t, expr: 'happy' });
    x.restore();
    return cv;
  },

  takePhoto() {
    if (this.poly) return;
    audio.sfx('shutter', { vol: 1 });
    audio.sparkle(2, 3, 0.3);
    this.flash = 1;
    const cv = this.capture();
    try { save.addPhoto(cv.toDataURL('image/jpeg', 0.72)); } catch (e) {}
    this.poly = { cv, x: this.cx, y: this.H * 0.42, s: 0.2, r: -0.1, a: 1 };
    tween(this.poly, { s: 0.92 }, 0.4, { ease: E.back });
    tween(this.poly, { x: 58, y: 60, s: 0.15, r: 0.25 }, 0.55, {
      ease: E.io, delay: 1.1, done: () => { this.poly = null; audio.sfx('plip'); }
    });
    this.expr = 'happy';
    this.exprT = 1.5;
  },

  drawPolaroid(c) {
    const p = this.poly;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.r);
    c.scale(p.s, p.s);
    c.shadowColor = 'rgba(40,20,90,.4)';
    c.shadowBlur = 22;
    c.shadowOffsetY = 8;
    c.fillStyle = '#fff';
    rr(c, -130, -162, 260, 330, 10);
    c.fill();
    c.shadowColor = 'transparent';
    c.drawImage(p.cv, -120, -152, 240, 270);
    c.restore();
  },

  // ---- runway show ---------------------------------------------------------------------
  startShow() {
    if (this.show) return;
    hint.clear();
    const fr = save.data.friends;
    const crowd = [...fr].sort(() => Math.random() - 0.5);
    const others = Object.keys(FRIENDS).filter((f) => !fr.includes(f)).sort(() => Math.random() - 0.5);
    while (crowd.length < 7 && others.length) crowd.push(others.pop());
    this.show = { t: 0, cur: 0, spot: 0, crowd: crowd.slice(0, Math.max(7, Math.round(this.W / 54))).map((id, i) => ({ id, hop: 0, v: 0, seed: i * 3 })), done: false };
    tween(this.show, { cur: 1 }, 0.6, { ease: E.out });
    audio.sfx('whoosh');
    music.play(null);
    wait(0.5, () => {
      audio.fanfare();
      fx.confetti(this.W, this.H, 90);
    });
    wait(1.4, () => {
      this.twirl();
    });
    wait(3, () => {
      this.twirl();
      audio.fanfare();
      fx.confetti(this.W, this.H, 70);
    });
    wait(5.1, () => {
      tween(this.show, { cur: 0 }, 0.5, {
        ease: E.io, done: () => {
          this.show = null;
          music.play('dress');
          save.earnStar();
        }
      });
    });
  },

  updateShow(dt) {
    const s = this.show;
    s.t += dt;
    for (const q of s.crowd) {
      q.v += 900 * dt;
      q.hop += q.v * dt;
      if (q.hop > 0) {
        q.hop = 0;
        q.v = Math.random() < 0.6 ? -rand(160, 280) : 0;
      }
    }
    if (Math.floor(s.t * 3) !== Math.floor((s.t - dt) * 3) && s.t > 0.8 && s.t < 5) {
      audio.voice(pick(['chirp', 'giggle', 'coo']), rand(0.8, 1.5), 0.22);
      audio.sfx('tick', { vol: 0.45 });
    }
  },

  drawShow(c) {
    const s = this.show, W = this.W, H = this.H, t = s.t;
    // The room dims, the spotlights find her
    c.fillStyle = `rgba(30,14,70,${0.62 * s.cur})`;
    c.fillRect(0, 0, W, H);
    const cx = this.cx, sc = this.dollS * 1.08, dy = H * 0.52;
    const walk = clamp(t / 1.4);
    const y = lerp(this.dollY, dy, E.out(walk));
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const sw = Math.sin(t * 1.5 + i * 2.1) * 34;
      const top = -40, bx = cx + sw + (i - 1) * 16;
      const g = c.createLinearGradient(0, top, 0, y + 120 * sc);
      const col = [P.pink, P.butter, P.sky][i];
      g.addColorStop(0, alpha(col, 0.34 * s.cur));
      g.addColorStop(1, alpha(col, 0.03 * s.cur));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(cx + (i - 1) * 130 - 18, top);
      c.lineTo(cx + (i - 1) * 130 + 18, top);
      c.lineTo(bx + 90, y + 126 * sc);
      c.lineTo(bx - 90, y + 126 * sc);
      c.closePath();
      c.fill();
    }
    c.restore();
    // Glowing floor pool
    c.save();
    c.translate(cx, y + 116 * sc);
    c.scale(1, 0.22);
    glow(c, 0, 0, 170, '#FFE9B0', 0.7 * s.cur);
    c.restore();
    this.paintDoll(c, cx, y, sc, { armUp: Math.max(0, Math.sin(t * 1.7)) * 0.65, expr: t > 0.5 ? 'happy' : 'open' });

    // Curtains frame the stage
    for (const k of [-1, 1]) {
      const cw = W * 0.2 * s.cur;
      c.fillStyle = hgrad(c, k < 0 ? 0 : W - cw, k < 0 ? cw : W, k < 0 ? '#A32458' : '#E8476F', k < 0 ? '#E8476F' : '#A32458');
      c.beginPath();
      if (k < 0) {
        c.moveTo(0, 0); c.lineTo(cw + 26, 0);
        c.quadraticCurveTo(cw * 0.7, H * 0.38, cw * 0.3, H * 0.62);
        c.lineTo(0, H);
      } else {
        c.moveTo(W, 0); c.lineTo(W - cw - 26, 0);
        c.quadraticCurveTo(W - cw * 0.7, H * 0.38, W - cw * 0.3, H * 0.62);
        c.lineTo(W, H);
      }
      c.closePath();
      c.fill();
    }
    // Friends cheer from the front row
    const n = s.crowd.length;
    const rowY = H - 58 * s.cur - app.safeBottom * 0.4 + (1 - s.cur) * 90;
    s.crowd.forEach((q, i) => {
      const x = (W * (i + 0.5)) / n;
      c.save();
      c.translate(x, rowY + q.hop);
      drawCreature(c, q.id, { R: 28, t: t + q.seed, eyes: Math.sin(t * 3 + q.seed) > 0 ? 'happy' : 'heart', mouthOpen: 0.7, wave: 0.8 + 0.2 * Math.sin(t * 9 + q.seed), waveBoth: true });
      c.restore();
    });
  }
};
