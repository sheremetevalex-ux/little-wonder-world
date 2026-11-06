// The living meadow: twelve glossy worlds float in the sky above a meadow where
// every friend hatched so far is at home. Everything responds to a touch.
import { app, go, hint, wait, tween, Btn, Spring, candy, haptic } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { music } from '../core/music.js';
import { fx } from '../core/fx.js';
import { save } from '../core/save.js';
import { P, E, ell, rand, pick, dist, sprite, clay, gloss, light, dark, alpha, glow, TAU, groundShadow, clamp, softStar, lerp, heart } from '../core/draw.js';
import { ICONS } from '../art/icons.js';
import { worldSprite, drawCloud, drawSun, drawMoon, skyByClock, drawStarPickup } from '../art/world.js';
import { drawCreature, blinkAt, FRIENDS, FRIEND_IDS } from '../art/creatures.js';
import { unlockNextItem, drawGiftItem } from './dress.js';

const WORLDS = [
  { id: 'dress', icon: 'dress', color: '#FFB0CF', note: 0 },
  { id: 'pet', icon: 'pet', color: '#BFE9FF', note: 1 },
  { id: 'cake', icon: 'cake', color: '#FFE2B0', note: 2 },
  { id: 'popit', icon: 'popit', color: '#D9C7FF', note: 3 },
  { id: 'slime', icon: 'slime', color: '#C2F5D2', note: 4 },
  { id: 'paint', icon: 'paint', color: '#FFD0DC', note: 5 },
  { id: 'garden', icon: 'garden', color: '#D7F5FF', note: 6 },
  { id: 'quest', icon: 'balloon', color: '#FFF0A8', note: 7 },
  { id: 'sing', icon: 'sing', color: '#FFD0E4', note: 8 },
  { id: 'cafe', icon: 'cafe', color: '#FFE9C4', note: 9 },
  { id: 'salon', icon: 'salon', color: '#E7D6FF', note: 10 },
  { id: 'atelier', icon: 'atelier', color: '#C9F3EC', note: 11 }
];

function bubbleSprite(w, r) {
  const size = r * 2.5;
  return sprite(`bubble:${w.id}:${r | 0}`, size, size, (c) => {
    c.translate(size / 2, size / 2);
    // Soft shadow lifts it off the sky
    c.save();
    c.shadowColor = 'rgba(70,40,130,.3)';
    c.shadowBlur = r * 0.26;
    c.shadowOffsetY = r * 0.14;
    c.fillStyle = w.color;
    ell(c, 0, 0, r * 0.98);
    c.fill();
    c.restore();
    const g = c.createRadialGradient(-r * 0.32, -r * 0.38, r * 0.1, 0, 0, r);
    g.addColorStop(0, light(w.color, 0.85));
    g.addColorStop(0.68, light(w.color, 0.3));
    g.addColorStop(1, dark(w.color, 0.1));
    c.fillStyle = g;
    ell(c, 0, 0, r);
    c.fill();
    c.save();
    const k = (r / 54) * 0.92;
    c.translate(0, r * 0.04);
    c.scale(k, k);
    ICONS[w.icon](c, 0);
    c.restore();
    // Thick glass: bright rim, crescent highlight, a little bounce light
    c.lineWidth = r * 0.055;
    c.strokeStyle = 'rgba(255,255,255,.85)';
    ell(c, 0, 0, r * 0.97);
    c.stroke();
    c.save();
    c.beginPath();
    c.arc(0, 0, r * 0.88, Math.PI * 1.05, Math.PI * 1.58);
    c.lineWidth = r * 0.1;
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,.82)';
    c.stroke();
    c.beginPath();
    c.arc(0, 0, r * 0.88, Math.PI * 0.2, Math.PI * 0.42);
    c.lineWidth = r * 0.05;
    c.strokeStyle = 'rgba(255,255,255,.5)';
    c.stroke();
    c.restore();
    ell(c, -r * 0.14, -r * 0.8, r * 0.05);
    c.fillStyle = 'rgba(255,255,255,.9)';
    c.fill();
  });
}

function drawEgg(c, x, y, s, crack, t, colorA = '#FFF3F8', colorB = P.pink) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const g = c.createRadialGradient(-12, -20, 3, 0, -4, 46);
  g.addColorStop(0, '#FFFFFF');
  g.addColorStop(0.55, colorA);
  g.addColorStop(1, dark(colorB, 0.04));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, -38);
  c.bezierCurveTo(23, -38, 31, -6, 31, 8);
  c.bezierCurveTo(31, 26, 17, 34, 0, 34);
  c.bezierCurveTo(-17, 34, -31, 26, -31, 8);
  c.bezierCurveTo(-31, -6, -23, -38, 0, -38);
  c.fill();
  c.save();
  c.clip();
  // Painted spots and a zigzag sash
  c.fillStyle = alpha(colorB, 0.7);
  for (const [px, py, r] of [[-15, -14, 6], [14, -20, 4.6], [-2, -28, 3.4], [19, 2, 3.4], [-21, 8, 3.4]]) {
    ell(c, px, py, r);
    c.fill();
  }
  c.fillStyle = P.butter;
  c.beginPath();
  c.moveTo(-34, 10);
  for (let i = 0; i <= 8; i++) c.lineTo(-34 + i * 8.5, 10 + (i % 2 ? -6 : 3));
  for (let i = 8; i >= 0; i--) c.lineTo(-34 + i * 8.5, 20 + (i % 2 ? -6 : 3));
  c.closePath();
  c.fill();
  c.restore();
  gloss(c, -11, -18, 10, 14, 0.8, 0.25);
  if (crack > 0) {
    c.strokeStyle = '#7B5BB0';
    c.lineWidth = 2.4;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    const lines = [
      [[-8, -24], [-2, -14], [-9, -6], [-1, 0]],
      [[14, -18], [8, -9], [16, -2], [8, 6]],
      [[-25, 2], [-15, 6], [-19, 15], [-7, 18], [4, 12], [12, 20], [24, 12]]
    ];
    for (let i = 0; i < Math.min(crack, 3); i++) {
      c.beginPath();
      lines[i].forEach((p, k) => c[k ? 'lineTo' : 'moveTo'](p[0], p[1]));
      c.stroke();
    }
  }
  c.restore();
}

function makeResident(id, x, y) {
  return {
    id, x, y, tx: x, ty: y, face: 1, walk: 0, hop: 0, hopV: 0, sq: new Spring(1, 300, 13),
    idle: rand(1, 5), emote: null, emoteT: 0, seed: rand(100), wave: 0
  };
}

export const hub = {
  tint: '#9EC7FF',
  home: false,

  enter(args) {
    save.dailyGift();
    this.mode = this.mode || skyByClock();
    this.t = 0;
    this.press = new Map();
    this.look = { x: 0, y: 0 };
    this.bubbles = WORLDS.map((w, i) => ({ ...w, sq: new Spring(1, 340, 11), phase: i * 1.7, enter: 0, wiggle: 0 }));
    this.layout();
    this.clouds = [0, 1, 2, 3].map((i) => ({ x: rand(this.W), y: rand(40, this.horizon * 0.72), s: rand(0.55, 1.05), v: rand(3, 8), p: new Spring(1, 260, 9) }));
    this.flies = [0, 1, 2].map((i) => ({ x: rand(this.W), y: rand(this.horizon - 80, this.horizon + 50), a: rand(TAU), col: pick([P.pink, P.butter, P.lilac, P.sky]), f: rand(TAU) }));
    this.small = [];
    this.smallT = 0;
    this.sunSq = new Spring(1, 300, 10);
    this.sunLaugh = 0;
    this.gift = null;
    this.giftT = rand(14, 26);
    this.nudgeT = 3;
    this.flowers = this.makeFlowers();
    this.residents = [];
    this.fillResidents();
    this.egg = { taps: 0, sq: new Spring(1, 420, 10), wob: 0, t: 0 };
    this.hatch = null;
    this.bubbles.forEach((b, i) => {
      b.enter = 0;
      tween(b, { enter: 1 }, 0.55, { ease: E.back, delay: 0.06 + i * 0.045 });
    });
    this.buttons = [
      new Btn({
        x: this.W - 34, y: Math.max(app.safeTop, 8) + 30, r: 22, slop: 8,
        paint: (c, r) => {
          candy(c, r, save.data.music ? P.teal : '#A9A6C4');
          c.fillStyle = '#fff';
          c.strokeStyle = '#fff';
          c.lineWidth = 2.6;
          c.lineCap = 'round';
          c.beginPath(); c.moveTo(4, 8); c.lineTo(4, -10); c.lineTo(11, -6); c.stroke();
          ell(c, -1, 9, 5.4, 4.4, -0.3);
          c.fill();
          if (!save.data.music) {
            c.strokeStyle = P.rose;
            c.lineWidth = 3.5;
            c.beginPath(); c.moveTo(-12, -11); c.lineTo(13, 12); c.stroke();
          }
        },
        tap: () => {
          save.data.music = !save.data.music;
          music.setEnabled(save.data.music);
          save.touch();
          if (save.data.music) audio.sparkle(0, 3);
        }
      }),
      new Btn({
        x: 34, y: Math.max(app.safeTop, 8) + 30, r: 22, slop: 8,
        paint: (c, r) => {
          candy(c, r, P.coral);
          // Little book
          c.fillStyle = '#fff';
          c.beginPath();
          c.moveTo(-12, -9); c.quadraticCurveTo(-5, -12, 0, -8); c.quadraticCurveTo(5, -12, 12, -9);
          c.lineTo(12, 9); c.quadraticCurveTo(5, 6, 0, 10); c.quadraticCurveTo(-5, 6, -12, 9);
          c.closePath();
          c.fill();
          c.strokeStyle = P.coral;
          c.lineWidth = 1.6;
          c.beginPath(); c.moveTo(0, -7); c.lineTo(0, 9); c.stroke();
          heart(c, 6, -2, 3.2);
          c.fillStyle = P.rose;
          c.fill();
        },
        tap: (p) => go('album', null, { x: p.x, y: p.y })
      })
    ];
    music.play(this.mode === 'night' ? 'night' : 'hub');
    music.setEnabled(save.data.music);
    if (args && args.intro) {
      wait(0.35, () => audio.success());
    }
    this.updateHint();
    // A star earned in a game flies back to the nest: effort becomes visible
    if (save.data.pendingStars) {
      const n = save.data.pendingStars;
      save.data.pendingStars = 0;
      save.touch();
      this.flyStars = [];
      for (let i = 0; i < n; i++) wait(0.7 + i * 0.3, () => this.launchStar());
    }
  },

  launchStar() {
    audio.sparkle(i3(), 3);
    const nx = this.nest.x, ny = this.nest.y - 50;
    const s = { x: this.W / 2, y: this.H * 0.45, r: 0, rot: 0 };
    tween(s, { r: 16 }, 0.3, { ease: E.back });
    tween(s, { x: nx, y: ny, rot: 6 }, 0.9, {
      ease: E.io, delay: 0.3, done: () => {
        this.flyStars = this.flyStars.filter((q) => q !== s);
        fx.stars(nx, ny, 12);
        this.egg.sq.kick(4);
        audio.note('bell', 84, { vol: 0.5 });
      }
    });
    this.flyStars = this.flyStars || [];
    this.flyStars.push(s);
  },

  updateHint() {
    if (save.data.eggs > 0 && !this.hatch && save.data.friends.length < 3) {
      hint.set({ from: [this.nest.x, this.nest.y - 22], delay: 1.8 });
    } else if (!save.data.seen.hub) {
      const b = this.bubbles[0];
      hint.set({ from: [b.x, b.y], delay: 6 });
    } else hint.clear();
  },

  layout() {
    const W = this.W = app.W, H = this.H = app.H;
    const wide = W > 640;
    this.horizon = wide ? H * 0.7 : H * 0.655;
    // Four to a row whenever there is room for them; three on a narrow phone
    const rows = W >= 440 ? [4, 4, 4] : [3, 3, 3, 3];
    const topY = Math.max(app.safeTop, 8) + (wide ? 16 : 58);
    const areaH = this.horizon - topY - 6;
    const maxRow = rows[0];
    const r = this.r = Math.min((W - 22) / (maxRow * 2.16), areaH / (rows.length * 2.14), 84);
    const stepY = Math.min((areaH - r * 2) / (rows.length - 1), r * 2.3);
    const totalH = stepY * (rows.length - 1);
    const y0 = topY + r + Math.max(0, (areaH - r * 2 - totalH) * 0.42);
    let idx = 0;
    const spanX = Math.min(wide ? r * 2.7 : r * 2.36, (W - 2 * r - 14) / (maxRow - 1));
    rows.forEach((count, ri) => {
      const rowW = (count - 1) * spanX;
      for (let i = 0; i < count; i++) {
        const b = this.bubbles[idx++];
        b.x = W / 2 - rowW / 2 + i * spanX;
        b.y = y0 + ri * stepY;
      }
    });
    this.nest = { x: W - Math.min(82, W * 0.21), y: Math.min(H - 100, this.horizon + (H - this.horizon) * 0.54) };
    // The bubbles fill the sky, so the sun peeks out on the horizon
    this.sun = { x: W * 0.5, y: this.horizon + (wide ? -8 : 12), r: wide ? 30 : 24 };
  },

  resize() {
    this.layout();
    this.flowers = this.makeFlowers();
    this.residents.forEach((r) => { r.x = clamp(r.x, 30, this.W - 30); r.tx = r.x; r.y = this.meadowY(rand(0.2, 0.8)); r.ty = r.y; });
    this.buttons[0].x = this.W - 34;
  },

  meadowY(u) { return lerp(this.horizon + 48, this.H - 120, u); },

  fillResidents() {
    // Show the newest few, with the mascot always home
    const chosen = meadowList(this.meadowCap());
    chosen.forEach((id, i) => {
      const x = (this.W - 150) * (0.08 + (i + 0.3) / Math.max(chosen.length, 1) * 0.86);
      this.residents.push(makeResident(id, x, this.meadowY(rand(0.2, 0.75))));
    });
  },

  meadowCap() { return this.W > 900 ? 10 : this.W > 640 ? 8 : 5; },

  makeFlowers() {
    const n = Math.max(5, Math.floor(this.W / 74));
    const cols = ['#FF82AF', '#FFB54D', '#6FD8FF', '#B48BFF', '#FF8F7A', '#7FE3A0', '#FFD45C', '#FF82AF', '#6FD8FF', '#B48BFF', '#FF8F7A', '#FFB54D', '#7FE3A0'];
    return Array.from({ length: n }, (_, i) => ({
      x: (this.W * (i + 0.5)) / n, y: this.H - 8 - rand(0, 10) - app.safeBottom * 0.5, col: cols[i % cols.length], note: i, sq: new Spring(1, 300, 8), lean: new Spring(0, 160, 6), s: rand(0.95, 1.15), glow: 0
    }));
  },

  update(dt) {
    this.t += dt;
    const W = this.W, H = this.H;
    for (const b of this.bubbles) b.sq.step(dt);
    for (const cl of this.clouds) {
      cl.x += cl.v * dt;
      cl.p.step(dt);
      if (cl.x > W + 110) cl.x = -110;
    }
    this.sunSq.step(dt);
    this.sunLaugh = Math.max(0, this.sunLaugh - dt);
    for (const f of this.flowers) {
      f.sq.step(dt);
      f.lean.step(dt);
      f.glow = Math.max(0, f.glow - dt * 1.4);
    }
    this.egg.sq.step(dt);
    this.egg.wob += dt;

    // Butterflies / fireflies
    for (const b of this.flies) {
      b.a += rand(-2.4, 2.4) * dt;
      b.f += dt * 18;
      b.x += Math.cos(b.a) * 34 * dt;
      b.y += Math.sin(b.a) * 22 * dt;
      if (b.x < 16 || b.x > W - 16) b.a = Math.PI - b.a;
      if (b.y < this.horizon - 90 || b.y > this.horizon + 70) b.a = -b.a;
      b.x = clamp(b.x, 10, W - 10);
    }

    // Small free soap bubbles drifting up: a tiny toy that is always there
    this.smallT -= dt;
    if (this.smallT <= 0 && this.small.length < 6) {
      this.smallT = rand(1.4, 3.4);
      this.small.push({ x: rand(30, W - 30), y: this.horizon + rand(0, 60), r: rand(10, 19), v: rand(18, 38), ph: rand(TAU) });
    }
    for (const s of this.small) {
      s.y -= s.v * dt;
      s.ph += dt;
    }
    this.small = this.small.filter((s) => s.y > -30);

    // Now and then a little gift floats by. Catching it is a real surprise.
    this.giftT -= dt;
    if (this.giftT <= 0 && !this.gift && !this.hatch) {
      this.gift = { x: rand(50, W - 50), y: H + 50, ph: rand(TAU), kind: pick(['gift', 'star', 'heart']), sq: new Spring(1, 300, 9) };
      this.giftT = rand(32, 62);
    }
    if (this.gift) {
      this.gift.y -= 44 * dt;
      this.gift.ph += dt;
      this.gift.sq.step(dt);
      if (this.gift.y < -80) this.gift = null;
    }

    // Residents wander, hop and greet each other
    for (const r of this.residents) {
      r.sq.step(dt);
      r.hopV += 900 * dt;
      r.hop += r.hopV * dt;
      if (r.hop > 0) {
        if (r.hopV > 240) { r.sq.kick(-3.4); }
        r.hop = 0;
        r.hopV = 0;
      }
      r.wave = Math.max(0, r.wave - dt * 0.8);
      r.emoteT = Math.max(0, r.emoteT - dt);
      if (r.emoteT <= 0) r.emote = null;
      const d = r.tx - r.x;
      if (Math.abs(d) > 2) {
        const v = 42 * Math.sign(d);
        r.x += v * dt;
        r.y += (r.ty - r.y) * Math.min(1, dt * 1.2);
        r.face = Math.sign(d);
        r.walk += dt * 11;
        if (r.hop === 0 && Math.sin(r.walk) > 0.98) r.hopV = -70;
      } else {
        r.walk = 0;
        r.idle -= dt;
        if (r.idle <= 0) {
          r.idle = rand(2.5, 7);
          const act = Math.random();
          if (act < 0.55) {
            r.tx = clamp(r.x + rand(-110, 110), 30, W - 130);
            r.ty = this.meadowY(rand(0.1, 0.85));
          } else if (act < 0.75) {
            r.hopV = -210;
            if (Math.random() < 0.35) audio.voice('chirp', FRIENDS[r.id].voice, 0.22);
          } else {
            r.wave = 1;
          }
        }
      }
    }

    // Idle nudge: a world occasionally wiggles to invite a tap
    this.nudgeT -= dt;
    if (this.nudgeT <= 0 && !this.hatch) {
      this.nudgeT = rand(3.2, 6);
      const b = pick(this.bubbles);
      b.sq.kick(1.8);
      fx.sparkle(b.x + rand(-b.sq.x * this.r, this.r), b.y - this.r * 0.8, 3);
    }

    if (this.hatch) this.updateHatch(dt);
  },

  drawResident(c, r) {
    const R = this.W > 640 ? 42 : 35;
    // Further away means smaller: a touch of depth on the meadow
    const dep = lerp(0.84, 1.08, clamp((r.y - this.horizon) / (this.H - this.horizon - 80)));
    const RR = R * dep;
    groundShadow(c, r.x, r.y + RR * 0.92, RR * (1 + r.hop * 0.003), RR * 0.22);
    c.save();
    c.translate(r.x, r.y + r.hop);
    if (r.face < 0) c.scale(-1, 1);
    const sq = r.sq.x;
    const lookX = clamp((this.look.x - r.x) / 90, -1, 1) * r.face, lookY = clamp((this.look.y - r.y) / 120, -1, 1);
    drawCreature(c, r.id, {
      R: RR, t: this.t, sx: 2 - sq, sy: sq, seed: r.seed, blink: r.emote ? 0 : blinkAt(this.t, r.seed), lookX, lookY,
      eyes: r.emote || 'open', mouth: r.emote === 'happy' ? 'open' : 'smile', mouthOpen: r.emote === 'happy' ? 0.7 : 0, walk: r.walk,
      wave: r.wave > 0 ? Math.sin(Math.min(1, r.wave) * Math.PI) : 0, wob: r.sq.v * 0.1, shiny: save.data.shiny.includes(r.id)
    });
    c.restore();
  },

  draw(c) {
    const W = this.W, H = this.H, t = this.t, night = this.mode === 'night';
    const back = worldSprite(W, H, this.mode, this.horizon);
    c.drawImage(back.cv, 0, 0, W, H);

    // Sun or moon
    const sq = this.sunSq.x;
    c.save();
    c.translate(this.sun.x, this.sun.y);
    c.scale(sq, 2 - sq);
    if (night) drawMoon(c, 0, 0, this.sun.r, t);
    else drawSun(c, 0, 0, this.sun.r, t, this.sunLaugh);
    c.restore();

    if (night) {
      for (let i = 0; i < 6; i++) {
        const x = ((i * 137.5) % W), y = (i * 67) % (this.horizon * 0.8) + 16;
        const k = 0.5 + 0.5 * Math.sin(t * 2 + i * 2);
        softStar(c, x, y, 2 + 3 * k, 4, 0.34);
        c.fillStyle = `rgba(255,245,190,${0.5 + k * 0.5})`;
        c.fill();
      }
    }

    for (const cl of this.clouds) {
      const s = cl.s * cl.p.x;
      drawCloud(c, cl.x, cl.y, s, night ? 0.7 : 0.92, night);
    }

    // Butterflies by day, fireflies by night
    for (const b of this.flies) {
      if (night) {
        const k = 0.5 + 0.5 * Math.sin(t * 3 + b.f * 0.04);
        glow(c, b.x, b.y, 15, '#FFF08A', 0.5 + k * 0.4);
        c.fillStyle = '#FFFBD0';
        ell(c, b.x, b.y, 2.2);
        c.fill();
      } else {
        c.save();
        c.translate(b.x, b.y);
        c.rotate(Math.cos(b.a) * 0.3);
        const flap = Math.abs(Math.sin(b.f));
        c.fillStyle = b.col;
        for (const s of [-1, 1]) {
          c.save();
          c.scale(s * (0.26 + flap * 0.74), 1);
          ell(c, 5.6, -3.2, 5.6, 6.6, -0.3);
          c.fill();
          c.fillStyle = light(b.col, 0.3);
          ell(c, 4.2, 4, 3.8, 3.8);
          c.fill();
          c.restore();
        }
        c.fillStyle = P.ink;
        ell(c, 0, 0, 1.3, 5);
        c.fill();
        c.restore();
      }
    }

    for (const s of this.small) {
      const x = s.x + Math.sin(s.ph * 1.6) * 8;
      c.drawImage(smallBubble().cv, x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }

    // All the worlds
    const r = this.r;
    for (const b of this.bubbles) {
      const sp = bubbleSprite(b, r);
      const by = b.y + Math.sin(t * 1.15 + b.phase) * 4.6, bx = b.x + Math.cos(t * 0.8 + b.phase) * 2;
      const k = b.sq.x * b.enter;
      c.save();
      c.translate(bx, by);
      c.scale(k * (2 - b.sq.x) * 0.5 + k * 0.5, k);
      c.drawImage(sp.cv, -sp.w / 2, -sp.h / 2, sp.w, sp.h);
      c.restore();
    }

    // The nest with the waiting egg and its star progress
    this.drawNest(c);

    // Residents, nearest in front
    const list = [...this.residents].sort((a, b) => a.y - b.y);
    for (const q of list) this.drawResident(c, q);

    // Flower xylophone along the bottom
    for (const f of this.flowers) this.drawFlower(c, f);

    if (this.gift) this.drawGift(c);
    if (this.flyStars) for (const s of this.flyStars) drawStarPickup(c, s.x, s.y, s.r, s.rot);
    for (const b of this.buttons) b.draw(c);
    if (this.hatch) this.drawHatch(c);
  },

  drawNest(c) {
    const { x, y } = this.nest;
    groundShadow(c, x, y + 22, 58, 12);
    // Woven nest
    const back = c.createLinearGradient(0, y - 8, 0, y + 28);
    back.addColorStop(0, '#C9925C');
    back.addColorStop(1, '#A56F42');
    c.fillStyle = back;
    ell(c, x, y + 8, 50, 20);
    c.fill();
    const eggs = save.data.eggs;
    if (eggs > 0 && !this.hatch) {
      const wob = Math.sin(this.egg.wob * 3.6) * 0.06 * (0.5 + 0.5 * Math.sin(this.egg.wob * 0.9));
      const sq = this.egg.sq.x;
      glow(c, x, y - 22, 66 + Math.sin(this.t * 3) * 6, '#FFF3A0', 0.55);
      c.save();
      c.translate(x, y + 6);
      c.rotate(wob + (this.egg.shake || 0));
      c.scale(2 - sq, sq);
      drawEgg(c, 0, -30, 1.04, this.egg.taps, this.t);
      c.restore();
    }
    // Nest front rim
    c.fillStyle = '#D7A36B';
    c.beginPath();
    c.ellipse(x, y + 12, 52, 19, 0, 0.05, Math.PI - 0.05);
    c.quadraticCurveTo(x, y + 2, x + 52, y + 13);
    c.fill();
    c.strokeStyle = 'rgba(120,70,30,.45)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const px = x - 42 + i * 12;
      c.beginPath();
      c.moveTo(px, y + 12);
      c.quadraticCurveTo(px + 4, y + 20, px + 10, y + 22 - Math.abs(i - 3.5));
      c.stroke();
    }
    // Three star slots: every finished game fills one, three bring a new egg
    for (let i = 0; i < 3; i++) {
      const sx = x - 22 + i * 22, sy = y + 44;
      const on = i < save.data.stars;
      softStar(c, sx, sy, on ? 10.5 : 9);
      c.fillStyle = on ? '#FFC92E' : 'rgba(255,255,255,.42)';
      c.fill();
      if (on) {
        c.lineWidth = 1.6;
        c.strokeStyle = '#fff';
        c.stroke();
      }
    }
  },

  drawFlower(c, f) {
    const sq = f.sq.x;
    c.save();
    c.translate(f.x, f.y);
    c.rotate(f.lean.x + Math.sin(this.t * 1.5 + f.x) * 0.035);
    c.scale(f.s * (2 - sq), f.s * sq);
    c.strokeStyle = '#3EAB5E';
    c.lineWidth = 4.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 8);
    c.lineTo(0, -28);
    c.stroke();
    c.fillStyle = clay(c, 9, -8, 10, '#67CF74');
    ell(c, 9, -7, 10, 5, -0.5);
    c.fill();
    c.translate(0, -36);
    if (f.glow > 0) glow(c, 0, 0, 30, f.col, f.glow * 0.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      c.fillStyle = clay(c, Math.cos(a) * 9, Math.sin(a) * 9, 7.5, f.col);
      ell(c, Math.cos(a) * 9, Math.sin(a) * 9, 7.3);
      c.fill();
    }
    c.fillStyle = clay(c, 0, 0, 7, '#FFDE6A');
    ell(c, 0, 0, 6.8);
    c.fill();
    c.restore();
  },

  drawGift(c) {
    const g = this.gift;
    const x = g.x + Math.sin(g.ph * 1.2) * 14, y = g.y;
    const sq = g.sq.x;
    g.rx = x; g.ry = y;
    c.save();
    c.translate(x, y);
    c.scale(sq, 2 - sq);
    c.strokeStyle = 'rgba(255,255,255,.8)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, 26);
    c.quadraticCurveTo(5, 42, -2, 60);
    c.stroke();
    if (g.kind === 'heart') {
      heart(c, 0, 0, 27);
      c.fillStyle = clay(c, 0, 0, 34, P.rose);
      c.fill();
      gloss(c, -11, -11, 11, 7, 0.8);
    } else if (g.kind === 'star') {
      drawStarPickup(c, 0, 0, 30, Math.sin(g.ph) * 0.2);
    } else {
      ell(c, 0, 0, 27, 31);
      c.fillStyle = clay(c, 0, 0, 30, P.violet);
      c.fill();
      gloss(c, -9, -14, 10, 7, 0.8);
      c.fillStyle = P.butter;
      c.fillRect(-3.5, -30, 7, 60);
    }
    c.restore();
  },

  // --- input -----------------------------------------------------------------
  down(p) {
    this.look.x = p.x;
    this.look.y = p.y;
    if (this.hatch) { this.tapHatch(p); return; }

    // Gift on the wind
    if (this.gift && dist(p.x, p.y, this.gift.rx || 0, this.gift.ry || 0) < 52) {
      fx.burst(this.gift.rx, this.gift.ry, { kind: 'confetti', n: 26, speed: 260 });
      fx.stars(this.gift.rx, this.gift.ry, 10);
      audio.sfx('bubble');
      audio.success();
      haptic();
      this.gift = null;
      save.earnStar();
      save.data.pendingStars = 0;
      this.egg.sq.kick(5);
      return;
    }
    // Soap bubbles
    for (const s of this.small) {
      if (dist(p.x, p.y, s.x + Math.sin(s.ph * 1.6) * 8, s.y) < s.r + 12) {
        audio.sfx('bubble', { rate: 30 / (s.r + 10) });
        audio.note('bell', penta(Math.floor(rand(0, 9))), { vol: 0.28 });
        fx.bubbles(s.x, s.y, 5);
        this.small = this.small.filter((q) => q !== s);
        return;
      }
    }
    // Worlds
    for (const b of this.bubbles) {
      if (dist(p.x, p.y, b.x, b.y) < this.r + 8) {
        p.bubble = b;
        b.sq.to = 0.84;
        b.sq.kick(-2);
        audio.note('kalimba', penta(b.note), { vol: 0.62 });
        haptic();
        return;
      }
    }
    // Egg
    if (save.data.eggs > 0 && dist(p.x, p.y, this.nest.x, this.nest.y - 22) < 66) {
      this.tapEgg();
      return;
    }
    // Friends
    for (const r of [...this.residents].sort((a, b) => b.y - a.y)) {
      if (dist(p.x, p.y, r.x, r.y) < 44) {
        r.sq.kick(5);
        r.hopV = -300;
        r.emote = pick(['happy', 'happy', 'wow', 'heart']);
        r.emoteT = 1.1;
        audio.voice(pick(['giggle', 'coo', 'wow']), FRIENDS[r.id].voice);
        fx.hearts(r.x, r.y - 30, 4);
        haptic();
        return;
      }
    }
    // Flowers
    for (const f of this.flowers) {
      if (dist(p.x, p.y, f.x, f.y - 30) < 34) {
        this.playFlower(f);
        p.flowerSlide = f;
        return;
      }
    }
    // Sun
    if (dist(p.x, p.y, this.sun.x, this.sun.y) < this.sun.r + 22) {
      this.sunSq.kick(5);
      this.sunLaugh = 1;
      audio.sparkle(2, 5);
      const order = ['day', 'sunset', 'night'];
      this.mode = order[(order.indexOf(this.mode) + 1) % 3];
      music.play(this.mode === 'night' ? 'night' : 'hub');
      fx.sparkle(this.sun.x, this.sun.y, 18);
      return;
    }
    // Clouds
    for (const cl of this.clouds) {
      if (dist(p.x, p.y, cl.x, cl.y) < 66 * cl.s) {
        cl.p.kick(6);
        audio.sfx('blup', { rate: rand(0.8, 1.2) });
        fx.burst(cl.x, cl.y + 18, { kind: 'bubble', n: 7, speed: 70, g: 240, colors: [P.sky, P.white], size: 13, life: 0.9, spin: 0 });
        return;
      }
    }
    fx.sparkle(p.x, p.y, 5);
    audio.sfx('plip', { rate: rand(0.9, 1.3), vol: 0.5 });
  },

  move(p) {
    this.look.x = p.x;
    this.look.y = p.y;
    if (p.bubble && dist(p.x, p.y, p.bubble.x, p.bubble.y) > this.r + 30) {
      p.bubble.sq.to = 1;
      p.bubble = null;
    }
    if (p.flowerSlide) {
      // Sliding along the row plays them like a harp
      for (const f of this.flowers) {
        if (f !== p.flowerSlide && Math.abs(p.x - f.x) < 24) {
          this.playFlower(f);
          p.flowerSlide = f;
          break;
        }
      }
    }
  },

  up(p, cancelled) {
    const b = p.bubble;
    if (!b) return;
    b.sq.to = 1;
    b.sq.kick(4);
    if (cancelled) return;
    save.data.seen.hub = 1;
    save.touch();
    audio.sfx('bubble', { rate: 0.7, vol: 0.8 });
    fx.bubbles(b.x, b.y, 12);
    fx.sparkle(b.x, b.y, 10);
    go(b.id, null, { x: b.x, y: b.y });
  },

  playFlower(f) {
    f.sq.kick(5);
    f.lean.kick(rand(-3, 3));
    f.glow = 1;
    audio.note('harp', penta(f.note - 2), { vol: 0.7, wet: 0.7 });
    fx.sparkle(f.x, f.y - 38, 3);
    haptic();
  },

  // --- Egg hatching: three taps, and a brand-new friend ---------------------------
  tapEgg() {
    const e = this.egg;
    e.taps++;
    e.sq.kick(7);
    audio.note('kalimba', penta(2 + e.taps * 2), { vol: 0.8 });
    audio.sfx('tick', { vol: 0.8 });
    fx.sparkle(this.nest.x, this.nest.y - 30, 8 + e.taps * 4);
    haptic();
    if (e.taps >= 3) this.startHatch();
    else hint.set({ from: [this.nest.x, this.nest.y - 22], delay: 1.2 });
  },

  startHatch() {
    hint.clear();
    save.data.eggs--;
    const owned = new Set(save.data.friends);
    const fresh = FRIEND_IDS.filter((f) => !owned.has(f));
    // Everyone found? Then eggs bring a friend back wearing a golden crown, for a second
    // collection as long as the first. Only after that do they repeat.
    const plain = FRIEND_IDS.filter((f) => !save.data.shiny.includes(f));
    const id = fresh.length ? fresh[0 + Math.floor(Math.random() * Math.min(5, fresh.length))] : pick(plain.length ? plain : FRIEND_IDS);
    const isNew = !owned.has(id);
    if (isNew) {
      save.data.friends.push(id);
      inviteToMeadow(id, this.meadowCap());
    } else if (!save.data.shiny.includes(id)) {
      save.data.shiny.push(id);
      inviteToMeadow(id, this.meadowCap());
    }
    // Every friend arrives with a gift for the wardrobe
    const item = unlockNextItem();
    save.touch();
    this.hatch = { id, t: 0, a: 0, ready: false, jump: 0, jumpV: 0, sq: new Spring(1, 300, 9), item };
    this.egg.taps = 0;
    audio.fanfare();
    audio.voice('wow', FRIENDS[id].voice, 0.8);
    fx.confetti(this.W, this.H, 80);
    fx.burst(this.nest.x, this.nest.y - 30, { kind: 'star', n: 26, colors: [P.sun, P.butter], speed: 400, size: 24, g: 300, life: 1.2 });
    wait(0.9, () => { if (this.hatch) this.hatch.ready = true; });
    wait(1.0, () => this.hatch && audio.voice('giggle', FRIENDS[id].voice, 0.7));
  },

  updateHatch(dt) {
    const h = this.hatch;
    h.t += dt;
    h.a = Math.min(1, h.a + dt * 3);
    h.sq.step(dt);
    h.jumpV += 1100 * dt;
    h.jump += h.jumpV * dt;
    if (h.jump > 0) {
      h.jump = 0;
      if (h.jumpV > 200) h.sq.kick(-5);
      h.jumpV = h.t < 8 && Math.random() < 0.012 ? -420 : 0;
    }
  },

  tapHatch(p) {
    const h = this.hatch;
    h.jumpV = -480;
    h.sq.kick(5);
    audio.voice(pick(['giggle', 'chirp', 'wow']), FRIENDS[h.id].voice);
    fx.hearts(p.x, p.y, 6);
    haptic();
    if (!h.ready || h.t < 1.2) return;
    if (!h.closing) {
      h.closing = true;
      wait(0.5, () => {
        const id = h.id;
        this.hatch = null;
        const found = this.residents.find((r) => r.id === id);
        if (!found) {
          const R = makeResident(id, this.W * 0.5, this.meadowY(0.6));
          R.hopV = -400;
          R.wave = 1;
          this.residents.push(R);
          if (this.residents.length > this.meadowCap()) {
            const stay = meadowList(this.meadowCap());
            const idx = this.residents.findIndex((r) => !stay.includes(r.id));
            if (idx >= 0) this.residents.splice(idx, 1);
          }
        }
        audio.success();
        this.updateHint();
      });
    }
  },

  drawHatch(c) {
    const h = this.hatch, W = this.W, H = this.H;
    const a = h.closing ? Math.max(0, h.a - clamp(h.t - h.closeStart || 0)) : h.a;
    if (h.closing && h.closeStart === undefined) h.closeStart = h.t;
    const fade = h.closing ? clamp(1 - (h.t - h.closeStart) / 0.45) : h.a;
    c.save();
    c.globalAlpha = fade * 0.72;
    c.fillStyle = '#3A2470';
    c.fillRect(0, 0, W, H);
    c.restore();
    const cx = W / 2, cy = H * 0.46;
    c.save();
    c.globalAlpha = fade;
    // Slowly turning rays of light
    c.translate(cx, cy);
    c.rotate(this.t * 0.4);
    const n = 12, R = Math.max(W, H) * 0.8;
    for (let i = 0; i < n; i++) {
      c.rotate(TAU / n);
      const g = c.createLinearGradient(0, 0, 0, -R);
      g.addColorStop(0, 'rgba(255,240,170,.42)');
      g.addColorStop(1, 'rgba(255,240,170,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-R * 0.13, -R);
      c.lineTo(R * 0.13, -R);
      c.closePath();
      c.fill();
    }
    c.restore();

    const size = 94 * Math.min(W / 390, 1.4);
    const enter = E.back(clamp(h.t / 0.5));
    c.save();
    c.globalAlpha = fade;
    groundShadow(c, cx, cy + size * 0.98, size * (1 + h.jump * 0.002), size * 0.22, 0.4);
    glow(c, cx, cy, size * 2, '#FFF3C0', 0.5);
    c.translate(cx, cy + h.jump);
    c.scale(enter * (2 - h.sq.x), enter * h.sq.x);
    drawCreature(c, h.id, { R: size, t: this.t, eyes: h.t < 0.8 ? 'wow' : (Math.sin(h.t * 0.8) > 0.3 ? 'happy' : 'open'), mouthOpen: 0.75, wave: 0.8, waveBoth: true, sparkly: true, blink: blinkAt(this.t, 1), shiny: save.data.shiny.includes(h.id) });
    c.restore();
    if (h.item) {
      // The present she brought along
      const ix = cx, iy = cy + size * 1.72, k = E.back(clamp((h.t - 0.5) / 0.4));
      c.save();
      c.globalAlpha = fade;
      c.translate(ix, iy + Math.sin(this.t * 2.2) * 4);
      c.scale(k, k);
      c.fillStyle = 'rgba(255,255,255,.95)';
      ell(c, 0, 0, 44);
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = P.butter;
      c.stroke();
      drawGiftItem(c, h.item, 62);
      c.restore();
    }
  }
};

const i3 = () => Math.floor(rand(0, 5));

/** Who lives on the meadow: her own choice first, then the newest friends. */
export function meadowList(cap) {
  const all = save.data.friends;
  const mine = (save.data.meadow || []).filter((f) => all.includes(f));
  if (save.data.meadow && mine.length) return mine.slice(0, cap);
  // Not chosen yet: the mascot, then the newest friends
  return [...new Set(['moko', ...[...all].reverse()])].filter((f) => all.includes(f)).slice(0, cap);
}

/** The newest arrival always gets to come out and play. */
function inviteToMeadow(id, cap) {
  const m = save.data.meadow;
  if (!m) return;
  if (!m.includes(id)) m.unshift(id);
  if (m.length > cap) m.length = cap;
}

function smallBubble() {
  return sprite('smallBubble', 40, 40, (c) => {
    const r = 19, x = 20;
    const g = c.createRadialGradient(x - 4, x - 5, 2, x, x, r);
    g.addColorStop(0, 'rgba(255,255,255,.08)');
    g.addColorStop(0.75, 'rgba(205,235,255,.22)');
    g.addColorStop(1, 'rgba(255,255,255,.85)');
    c.fillStyle = g;
    ell(c, x, x, r);
    c.fill();
    gloss(c, x - 7, x - 8, 6, 3.6, 1);
    c.fillStyle = 'rgba(255,180,230,.35)';
    ell(c, x + 6, x + 7, 3.5);
    c.fill();
  });
}
