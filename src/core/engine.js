// The app shell: canvas, game loop, touch input, buttons, tweens, scene changes.
import { audio } from './audio.js';
import { fx } from './fx.js';
import { P, E, clamp, dist, ell, gloss, light, dark, clay, setSpriteScale, TAU, rand, groundShadow, rr, alpha } from './draw.js';
import { measureViewport } from './viewport.js';
import { resizeGL, showGL } from './stage.js';

export const app = {
  W: 390, H: 844, scale: 1, pr: 2, t: 0, dt: 1 / 60,
  safeTop: 0, safeBottom: 0, quality: 1,
  canvas: null, c: null, scene: null, scenes: {}, frame: 0, fps: 60
};

// ---- tweens ------------------------------------------------------------------
let tweens = [];
let waits = [];
export function tween(o, to, dur = 0.4, { ease = E.out, delay = 0, done = null, tag = null } = {}) {
  const tw = { o, to, from: null, dur, ease, delay, done, age: 0, tag };
  tweens.push(tw);
  return tw;
}
export function wait(sec, fn) { const w = { t: sec, fn }; waits.push(w); return w; }
export function clearTimers() { tweens = []; waits = []; }

function stepTimers(dt) {
  for (let i = 0; i < tweens.length; i++) {
    const tw = tweens[i];
    tw.age += dt;
    if (tw.age < tw.delay) continue;
    if (!tw.from) {
      tw.from = {};
      for (const k in tw.to) tw.from[k] = tw.o[k];
    }
    const u = clamp((tw.age - tw.delay) / tw.dur), e = tw.ease(u);
    for (const k in tw.to) tw.o[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
    if (u >= 1) {
      tweens.splice(i--, 1);
      if (tw.done) tw.done();
    }
  }
  for (let i = 0; i < waits.length; i++) {
    const w = waits[i];
    w.t -= dt;
    if (w.t <= 0) {
      waits.splice(i--, 1);
      w.fn();
    }
  }
}

// ---- springs: all squash and stretch comes from here ---------------------------
export class Spring {
  constructor(x = 0, k = 240, d = 13) { this.x = x; this.v = 0; this.to = x; this.k = k; this.d = d; }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += ((this.to - this.x) * this.k - this.v * this.d) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
  kick(v) { this.v += v; }
}

// ---- buttons ------------------------------------------------------------------
export class Btn {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, r: 30, slop: 10, hidden: false, sound: 'tap', pitch: 1 }, o);
    this.s = new Spring(1, 420, 16);
  }
  hit(x, y) { return !this.hidden && dist(x, y, this.x, this.y) <= this.r + this.slop; }
  press() { this.s.to = 0.84; this.s.kick(-1.4); if (this.sound) audio.sfx(this.sound, { rate: this.pitch, vol: 0.8 }); }
  release() { this.s.to = 1; this.s.kick(3.5); }
  draw(c) {
    if (this.hidden) return;
    this.s.step(app.dt);
    const k = this.s.x;
    c.save();
    c.translate(this.x, this.y);
    c.scale(k, k);
    this.paint(c, this.r, this);
    c.restore();
  }
}

/** Standard candy button: thick rim, glossy top. */
export function candy(c, r, color, on = false) {
  groundShadow(c, 0, r * 0.92, r * 1.02, r * 0.26, 0.26);
  c.fillStyle = dark(color, 0.22);
  ell(c, 0, r * 0.1, r, r);
  c.fill();
  c.fillStyle = clay(c, 0, -r * 0.04, r * 0.98, on ? light(color, 0.2) : color);
  ell(c, 0, -r * 0.04, r * 0.96, r * 0.96);
  c.fill();
  c.lineWidth = r * 0.07;
  c.strokeStyle = 'rgba(255,255,255,.55)';
  ell(c, 0, -r * 0.04, r * 0.87, r * 0.87);
  c.stroke();
  gloss(c, -r * 0.3, -r * 0.5, r * 0.5, r * 0.28, 0.7);
}

function houseIcon(c, r) {
  const s = r / 27;
  c.save();
  c.scale(s, s);
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(0, -14); c.lineTo(15, -1); c.lineTo(11, -1); c.lineTo(11, 13); c.lineTo(-11, 13); c.lineTo(-11, -1); c.lineTo(-15, -1);
  c.closePath();
  c.fillStyle = '#fff';
  c.strokeStyle = '#fff';
  c.lineWidth = 4;
  c.stroke();
  c.fill();
  c.fillStyle = P.rose;
  rr(c, -4, 2, 8, 11, 3);
  c.fill();
  c.restore();
}

const homeBtn = new Btn({
  r: 27, slop: 12, sound: 'tap',
  paint(c, r) { candy(c, r, P.violet); houseIcon(c, r * 0.9); },
  tap() { go('hub', null, { x: homeBtn.x, y: homeBtn.y }); }
});

// ---- hint hand: how to play, shown rather than told -----------------------------
export const hint = {
  spec: null, idle: 0, a: 0,
  /** {from:[x,y], to:[x,y]|null, delay} A soft hand demonstrates after idling. */
  set(spec) { this.spec = spec ? { delay: 2.2, ...spec } : null; this.idle = 0; },
  clear() { this.spec = null; },
  poke() { this.idle = 0; },
  draw(c, dt) {
    const sp = this.spec;
    this.idle += dt;
    const on = sp && this.idle > sp.delay;
    this.a = clamp(this.a + (on ? dt * 5 : -dt * 7));
    if (this.a <= 0 || !sp) return;
    const cyc = sp.to ? 2.2 : 1.3;
    const u = (Math.max(0, this.idle - sp.delay) % cyc) / cyc;
    let x = sp.from[0], y = sp.from[1], press = 0, al = this.a;
    if (sp.to) {
      const m = E.io(clamp((u - 0.2) / 0.55));
      x += (sp.to[0] - x) * m;
      y += (sp.to[1] - y) * m;
      press = u > 0.1 && u < 0.8 ? 1 : 0;
      if (u > 0.86) al *= (1 - u) / 0.14;
      if (u < 0.08) al *= u / 0.08;
    } else {
      press = Math.sin(u * TAU * 2) > 0.2 ? 1 : 0;
    }
    if (press && sp.to == null) {
      c.save();
      c.globalAlpha = al * 0.45;
      c.strokeStyle = '#fff';
      c.lineWidth = 3;
      ell(c, x, y, 16 + u * 22);
      c.stroke();
      c.restore();
    }
    drawHand(c, x + 2, y + 2 + (press ? 0 : -7), 1 - press * 0.08, al);
  }
};

export function drawHand(c, x, y, s = 1, al = 1) {
  c.save();
  c.globalAlpha = al;
  c.translate(x, y);
  c.scale(s, s);
  c.rotate(-0.25);
  // Rounded little mitten with a pointing finger
  c.shadowColor = 'rgba(58,32,96,.35)';
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = '#FFF9F2';
  c.beginPath();
  c.moveTo(-7, 1);
  c.bezierCurveTo(-7, -7, 7, -7, 7, 1);
  c.lineTo(8, 16);
  c.bezierCurveTo(17, 15, 24, 19, 23, 30);
  c.bezierCurveTo(22, 50, 6, 55, -5, 52);
  c.bezierCurveTo(-13, 50, -17, 42, -19, 34);
  c.bezierCurveTo(-21, 28, -13, 24, -8, 30);
  c.closePath();
  c.fill();
  c.shadowColor = 'transparent';
  c.lineWidth = 2.5;
  c.strokeStyle = '#6A4FB0';
  c.lineJoin = 'round';
  c.stroke();
  c.restore();
}

// ---- transition between scenes -----------------------------------------------
let trans = null;
export function go(name, args, from) {
  if (trans) return;
  if (!app.scenes[name]) return;
  const x = from ? from.x : app.W / 2, y = from ? from.y : app.H / 2;
  audio.sfx('whoosh', { vol: 0.7 });
  trans = { phase: 0, t: 0, x, y, name, args, color: app.scenes[name].tint || P.lilac };
}

function setScene(name, args) {
  if (app.scene && app.scene.exit) app.scene.exit();
  clearTimers();
  fx.clear();
  hint.clear();
  pointers.clear();
  app.scene = app.scenes[name];
  app.scene.name = name;
  app.scene.buttons = [];
  // Whatever peeks around the canvas (rubber-banding, a rotating screen) matches the scene
  const tint = app.scene.tint;
  if (tint) {
    document.documentElement.style.background = tint;
    document.body.style.background = tint;
  }
  if (app.scene.enter) app.scene.enter(args);
}

function drawTransition(c, dt) {
  const tr = trans;
  tr.t += dt;
  const W = app.W, H = app.H, maxR = Math.hypot(Math.max(tr.x, W - tr.x), Math.max(tr.y, H - tr.y)) + 40;
  let r;
  const DUR = [0.3, 0.42][tr.phase];
  const u = clamp(tr.t / DUR);
  if (tr.phase === 0) r = maxR * (1 - E.in(u));
  else r = maxR * E.out(u);
  c.save();
  c.fillStyle = tr.color;
  c.beginPath();
  c.rect(-5, -5, W + 10, H + 10);
  // A slightly wobbling opening, like the skin of a soap bubble
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const wob = r > 2 ? r + Math.sin(a * 5 + app.t * 9) * Math.min(8, r * 0.05) : 0;
    const px = tr.x + Math.cos(-a) * wob, py = tr.y + Math.sin(-a) * wob;
    c[i ? 'lineTo' : 'moveTo'](px, py);
  }
  c.closePath();
  c.fill('evenodd');
  c.lineWidth = 7;
  c.strokeStyle = 'rgba(255,255,255,.6)';
  if (r > 3) {
    c.beginPath();
    c.arc(tr.x, tr.y, r, 0, TAU);
    c.stroke();
  }
  c.restore();
  if (u >= 1) {
    if (tr.phase === 0) {
      setScene(tr.name, tr.args);
      tr.phase = 1;
      tr.t = 0;
      // Reopen in the middle: a new scene must always start with its centre visible
      tr.x = W / 2;
      tr.y = H / 2;
    } else trans = null;
  }
}

// ---- input -----------------------------------------------------------------------
const pointers = new Map();
function toLogical(e) {
  const b = app.canvas.getBoundingClientRect();
  return { x: (e.clientX - b.left) / app.scale, y: (e.clientY - b.top) / app.scale };
}
function allButtons() {
  const s = app.scene;
  const list = s.buttons ? s.buttons : [];
  return s.home === false ? list : [...list, homeBtn];
}

function onDown(e) {
  e.preventDefault();
  const { x, y } = toLogical(e);
  try { app.canvas.setPointerCapture(e.pointerId); } catch (err) {}
  hint.poke();
  if (trans) return;
  const p = { id: e.pointerId, x, y, sx: x, sy: y, px: x, py: y, t0: app.t, moved: 0, btn: null };
  pointers.set(e.pointerId, p);
  const btns = allButtons();
  for (let i = btns.length - 1; i >= 0; i--) {
    if (btns[i].hit(x, y)) {
      p.btn = btns[i];
      btns[i].press();
      return;
    }
  }
  app.scene.down && app.scene.down(p);
}
function onMove(e) {
  e.preventDefault();
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const { x, y } = toLogical(e);
  // iOS coalesces touch moves: replay them so fast slides miss nothing
  p.px = p.x; p.py = p.y; p.x = x; p.y = y;
  p.moved += Math.hypot(x - p.px, y - p.py);
  if (p.btn) return;
  app.scene.move && app.scene.move(p);
}
function onUp(e) {
  e.preventDefault();
  const p = pointers.get(e.pointerId);
  pointers.delete(e.pointerId);
  if (!p) return;
  const { x, y } = toLogical(e);
  p.x = x; p.y = y;
  if (p.btn) {
    p.btn.release();
    if (e.type !== 'pointercancel' && p.btn.hit(x, y) && p.btn.tap) p.btn.tap(p);
    return;
  }
  app.scene.up && app.scene.up(p, e.type === 'pointercancel');
}

// ---- haptics (iOS 18 gives a tick when a switch input toggles) ---------------------
let hapticLabel = null, lastHaptic = 0;
export function haptic() {
  const now = performance.now();
  if (now - lastHaptic < 45) return;
  lastHaptic = now;
  if (navigator.vibrate) { navigator.vibrate(8); return; }
  if (!hapticLabel) {
    hapticLabel = document.createElement('label');
    hapticLabel.style.cssText = 'position:fixed;left:-99px;top:-99px;width:1px;height:1px;overflow:hidden;opacity:0';
    const i = document.createElement('input');
    i.type = 'checkbox';
    i.setAttribute('switch', '');
    i.tabIndex = -1;
    hapticLabel.appendChild(i);
    document.body.appendChild(hapticLabel);
  }
  try { hapticLabel.click(); } catch (e) {}
}

// ---- layout ---------------------------------------------------------------------
function readSafe() {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
  document.body.appendChild(d);
  const cs = getComputedStyle(d);
  const t = parseFloat(cs.paddingTop) || 0, b = parseFloat(cs.paddingBottom) || 0;
  d.remove();
  return { t, b };
}

const UA = navigator.userAgent;
const IS_IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
function isStandalone() {
  return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
}
function currentViewport() {
  const de = document.documentElement;
  return measureViewport({
    innerW: window.innerWidth, innerH: window.innerHeight, clientW: de.clientWidth, clientH: de.clientHeight,
    screenW: window.screen.width, screenH: window.screen.height, ios: IS_IOS, standalone: isStandalone()
  });
}
let lastVW = 0, lastVH = 0;

function layout() {
  const { w: vw, h: vh } = currentViewport();
  lastVW = vw;
  lastVH = vh;
  document.documentElement.style.height = vh + 'px';
  document.body.style.height = vh + 'px';
  // One logical space for phones and tablets alike: at least 390 wide and 694
  // tall, stretched to fill the screen. Scenes lay out from app.W / app.H.
  const prevW = app.W, prevH = app.H;
  app.scale = Math.min(vw / 390, vh / 694);
  app.W = vw / app.scale;
  app.H = vh / app.scale;
  app.rotate = vw > vh && vh < 520;
  const safe = readSafe();
  app.safeTop = safe.t / app.scale;
  app.safeBottom = safe.b / app.scale;
  const dpr = window.devicePixelRatio || 1;
  app.pr = Math.min(dpr, 2.6) * app.quality;
  const cv = app.canvas;
  cv.style.width = vw + 'px';
  cv.style.height = vh + 'px';
  cv.width = Math.round(vw * app.pr);
  cv.height = Math.round(vh * app.pr);
  setSpriteScale(app.pr * app.scale);
  resizeGL(app);
  homeBtn.x = 44;
  homeBtn.y = Math.max(app.safeTop, 10) + 34;
  if (app.scene && app.scene.resize && (prevH !== app.H || prevW !== app.W)) app.scene.resize();
}

/** A phone held sideways: show, without words, that it wants to be upright. */
function drawRotateHint(c) {
  const W = app.W, H = app.H;
  c.fillStyle = '#6F5BD8';
  c.fillRect(0, 0, W, H);
  c.save();
  c.translate(W / 2, H / 2);
  const u = (app.t % 2.4) / 2.4;
  c.rotate(-Math.PI / 2 * (1 - E.io(clamp((u - 0.2) / 0.5))));
  c.fillStyle = '#fff';
  rr(c, -60, -110, 120, 220, 22);
  c.fill();
  c.fillStyle = P.sky;
  rr(c, -50, -96, 100, 192, 10);
  c.fill();
  c.restore();
}

// ---- main loop -------------------------------------------------------------------
let last = 0, slowFor = 0;
function frame(now) {
  requestAnimationFrame(frame);
  if (document.hidden) { last = now; return; }
  // The first rAF stamp can predate our last clock read: time must never run backward
  const raw = Math.max(0, (now - last) / 1000);
  last = now;
  const dt = Math.min(raw || 1 / 60, 1 / 20);
  app.dt = dt;
  app.t += dt;
  app.frame++;
  app.fps += (1 / Math.max(raw || 1 / 60, 0.001) - app.fps) * 0.05;

  // iOS can settle on its final window size after every event has fired: keep watching
  if (app.frame % 40 === 0) {
    const v = currentViewport();
    if (v.w !== lastVW || v.h !== lastVH) layout();
  }

  // If an old phone can't keep up, trade a little sharpness for smoothness
  if (raw > 0 && raw < 0.2) {
    slowFor = app.fps < 38 ? slowFor + dt : Math.max(0, slowFor - dt);
    if (slowFor > 2.2 && app.quality > 0.62) {
      app.quality -= 0.19;
      slowFor = 0;
      layout();
    }
  }

  const c = app.c;
  c.setTransform(app.pr * app.scale, 0, 0, app.pr * app.scale, 0, 0);
  try {
    stepTimers(dt);
    const s = app.scene;
    if (s) {
      s.update && s.update(dt);
      // A 3D scene renders on the canvas below; the 2D layer above stays clear
      // except for what the scene adds on top (buttons, particles, hints)
      const st = s.stage;
      showGL(!!(st && st.ok));
      if (st && st.ok) {
        c.clearRect(0, 0, app.W, app.H);
        st.render();
      }
      s.draw(c);
      if (s.home !== false) homeBtn.draw(c);
    }
    fx.update(dt);
    fx.draw(c);
    hint.draw(c, dt);
    if (s && s.overlay) s.overlay(c);
    if (trans) drawTransition(c, dt);
    if (app.rotate) drawRotateHint(c);
  } catch (err) {
    // One bad frame must never freeze the game in a child's hands
    console.error(err);
    if (c.reset) c.reset();
  }
}

export function start(first) {
  const cv = app.canvas = document.getElementById('game');
  app.c = cv.getContext('2d', { alpha: true, desynchronized: false });
  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 200));
  window.addEventListener('pageshow', layout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);

  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', (e) => {
    const ev = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (ev && ev.length > 1) for (const k of ev) onMove(k);
    else onMove(e);
  });
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('lostpointercapture', (e) => { if (pointers.has(e.pointerId)) onUp(e); });
  // Keep iOS from zooming, selecting, scrolling or popping up menus mid-play
  const stop = (e) => e.preventDefault();
  document.addEventListener('touchmove', stop, { passive: false });
  document.addEventListener('gesturestart', stop, { passive: false });
  document.addEventListener('gesturechange', stop, { passive: false });
  document.addEventListener('dblclick', stop, { passive: false });
  document.addEventListener('contextmenu', stop);

  // Android back button / gesture: step back to the world instead of quitting
  try {
    history.pushState({ w: 1 }, '');
    window.addEventListener('popstate', () => {
      history.pushState({ w: 1 }, '');
      if (app.scene && app.scene.name !== 'hub' && app.scene.name !== 'splash') go('hub');
    });
  } catch (e) {}

  audio.init();
  setScene(first);
  last = performance.now();
  requestAnimationFrame(frame);
}

export const pointersActive = () => pointers.size;
export const allPointers = () => pointers.values();
export { rand };
