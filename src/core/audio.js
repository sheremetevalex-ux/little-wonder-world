// Audio engine. Everything is synthesised once into small buffers at start-up,
// so playback is instant, cheap and works offline. All pitched sounds live in
// C major pentatonic, so any overlap of game sounds and music stays in harmony.

const SR = 44100;
const TAU = Math.PI * 2;
const PENTA = [0, 2, 4, 7, 9];

/** Pentatonic note by index: 0 = C5, 1 = D5, 5 = C6, -1 = A4 ... */
export function penta(i, base = 72) {
  const o = Math.floor(i / 5);
  return base + o * 12 + PENTA[((i % 5) + 5) % 5];
}

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---- offline synthesis helpers ---------------------------------------------
function normalize(d, peak = 0.9) {
  let m = 0;
  for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]));
  if (m > 0) for (let i = 0; i < d.length; i++) d[i] *= peak / m;
  return d;
}

function fadeEdges(d, inS = 0.002, outS = 0.012) {
  const a = Math.floor(inS * SR), b = Math.floor(outS * SR);
  for (let i = 0; i < a && i < d.length; i++) d[i] *= i / a;
  for (let i = 0; i < b && i < d.length; i++) d[d.length - 1 - i] *= i / b;
  return d;
}

/** Additive tone. partials: [ratio, amp, decaySeconds] */
function tone(f, dur, partials, attack = 0.003) {
  const n = Math.floor(dur * SR), d = new Float32Array(n);
  for (const [r, a, dec] of partials) {
    const w = TAU * f * r / SR;
    if (f * r > 16000) continue;
    for (let i = 0; i < n; i++) d[i] += a * Math.exp(-i / SR / dec) * Math.sin(w * i);
  }
  fadeEdges(d, attack, 0.03);
  return normalize(d);
}

/** Sine with a pitch curve fn(t01)->Hz and amp curve fn(t01)->0..1 */
function sweep(dur, pitch, amp, harm = 0) {
  const n = Math.floor(dur * SR), d = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    ph += TAU * pitch(u) / SR;
    d[i] = amp(u) * (Math.sin(ph) + harm * Math.sin(2 * ph));
  }
  return fadeEdges(d, 0.002, 0.008);
}

/** Filtered noise through a resonant band-pass with moving centre frequency. */
function noiseBand(dur, center, q, amp) {
  const n = Math.floor(dur * SR), d = new Float32Array(n);
  let lo = 0, bp = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n, f = 2 * Math.sin(Math.PI * Math.min(center(u), 8000) / SR);
    const x = Math.random() * 2 - 1;
    lo += f * bp;
    const hi = x - lo - bp / q;
    bp += f * hi;
    d[i] = bp * amp(u);
  }
  return fadeEdges(d, 0.002, 0.01);
}

function mixInto(a, b, gain = 1, offs = 0) {
  const o = Math.floor(offs * SR);
  for (let i = 0; i < b.length && i + o < a.length; i++) a[i + o] += b[i] * gain;
  return a;
}

const expo = (k) => (u) => Math.exp(-u * k);

// ---- recipes ---------------------------------------------------------------
const INSTRUMENTS = {
  // warm thumb-piano: clean body, tiny bright tine that dies at once
  kalimba: { base: 60, dur: 1.5, make: (f) => tone(f, 1.5, [[1, 1, 0.55], [2, 0.1, 0.25], [5.43, 0.11, 0.05]], 0.003) },
  // wooden mallet
  marimba: { base: 60, dur: 0.9, make: (f) => tone(f, 0.9, [[1, 1, 0.3], [3.93, 0.16, 0.07], [9.2, 0.03, 0.02]], 0.002) },
  // tiny music box, kept round so that it never gets piercing
  bell: { base: 72, dur: 1.8, make: (f) => tone(f, 1.8, [[1, 1, 0.75], [2.0, 0.12, 0.45], [3.01, 0.09, 0.2], [4.2, 0.03, 0.08]], 0.002) },
  // plucked harp
  harp: { base: 60, dur: 1.6, make: (f) => tone(f, 1.6, [[1, 1, 0.65], [2, 0.3, 0.38], [3, 0.1, 0.2], [4, 0.05, 0.12]], 0.005) },
  // warm round bass
  bass: { base: 36, dur: 1.4, make: (f) => tone(f, 1.4, [[1, 1, 0.6], [2, 0.2, 0.3], [3, 0.04, 0.12]], 0.008) },
  // slow airy pad (soft swell, no percussive onset)
  pad: {
    base: 60, dur: 4, make: (f) => {
      const n = 4 * SR, d = new Float32Array(n);
      for (const [r, a] of [[1, 1], [1.004, 0.7], [0.997, 0.6], [2, 0.12], [3, 0.03]]) {
        const w = TAU * f * r / SR;
        for (let i = 0; i < n; i++) d[i] += a * Math.sin(w * i);
      }
      for (let i = 0; i < n; i++) {
        const u = i / n;
        d[i] *= Math.min(1, u / 0.22) * Math.min(1, (1 - u) / 0.45);
      }
      return normalize(d, 0.8);
    }
  }
};

const SFX = {
  // Silicone "pock": a low round thump that lifts a little in pitch
  pop: () => {
    const d = sweep(0.13, (u) => 260 + 240 * Math.min(1, u * 8) - 60 * u, expo(7), 0.12);
    mixInto(d, noiseBand(0.012, () => 2400, 1.1, () => 1), 0.05);
    return normalize(d, 0.85);
  },
  popBack: () => normalize(sweep(0.1, (u) => 520 - 240 * u, expo(6), 0.05), 0.5),
  bubble: () => normalize(sweep(0.09, (u) => 620 * Math.pow(2.3, u), expo(5), 0), 0.7),
  drop: () => normalize(sweep(0.15, (u) => 460 + 880 * u * u, expo(5.5)), 0.7),
  plip: () => normalize(sweep(0.06, (u) => 900 + 700 * u, expo(5)), 0.5),
  tap: () => normalize(sweep(0.07, (u) => 620 - 180 * u, expo(5), 0.1), 0.65),
  boing: () => normalize(sweep(0.34, (u) => 240 + 210 * u + 26 * Math.sin(u * 44), expo(4.2)), 0.65),
  thud: () => normalize(sweep(0.16, (u) => 150 - 70 * u, expo(5.5), 0.15), 0.8),
  squish: () => {
    const d = noiseBand(0.2, (u) => 240 + 500 * Math.sin(u * 3.1), 2.4, (u) => Math.sin(Math.PI * Math.min(1, u * 1.05)) ** 1.4);
    mixInto(d, sweep(0.16, (u) => 150 + 200 * u, expo(4), 0), 0.25);
    return normalize(d, 0.5);
  },
  squish2: () => {
    const d = noiseBand(0.16, (u) => 620 - 380 * u, 2.8, (u) => Math.sin(Math.PI * u));
    mixInto(d, sweep(0.11, (u) => 300 - 120 * u, expo(5)), 0.3);
    return normalize(d, 0.45);
  },
  blup: () => normalize(sweep(0.14, (u) => 130 + 300 * u * u, (u) => Math.sin(Math.PI * Math.min(1, u * 1.2))), 0.6),
  whoosh: () => normalize(noiseBand(0.42, (u) => 400 + 1500 * Math.sin(Math.PI * u), 1.3, (u) => Math.sin(Math.PI * u) ** 2), 0.3),
  swish: () => normalize(noiseBand(0.2, (u) => 2200 + 1000 * u, 1, (u) => Math.sin(Math.PI * u) ** 2), 0.16),
  scrub: () => normalize(noiseBand(0.09, () => 3000, 1.2, (u) => Math.sin(Math.PI * u)), 0.1),
  splash: () => {
    const d = noiseBand(0.55, (u) => 1500 - 900 * u, 0.9, expo(5));
    for (let i = 0; i < 7; i++) mixInto(d, sweep(0.07, (u) => 500 + Math.random() * 300 + 600 * u, expo(5)), 0.5, 0.03 + Math.random() * 0.3);
    return normalize(d, 0.5);
  },
  pour: () => normalize(noiseBand(0.5, (u) => 900 + 120 * Math.sin(u * 40), 1.2, (u) => Math.sin(Math.PI * u) ** 0.5), 0.22),
  chew: () => {
    const d = noiseBand(0.09, () => 700, 1.4, (u) => Math.sin(Math.PI * u));
    mixInto(d, sweep(0.08, (u) => 170 - 60 * u, expo(5)), 0.5);
    return normalize(d, 0.55);
  },
  shutter: () => {
    const d = new Float32Array(Math.floor(0.2 * SR));
    mixInto(d, noiseBand(0.024, () => 2600, 1.2, expo(5)), 1);
    mixInto(d, noiseBand(0.03, () => 1700, 1.2, expo(5)), 0.8, 0.08);
    return normalize(d, 0.5);
  },
  flame: () => normalize(noiseBand(0.26, (u) => 1200 - 800 * u, 0.8, (u) => Math.sin(Math.PI * Math.sqrt(u))), 0.26),
  tick: () => normalize(sweep(0.03, () => 1500, expo(6)), 0.3),
  // Voices: tiny wordless creature chirps. Round sines, never harsh.
  coo: () => normalize(sweep(0.28, (u) => 620 + 180 * Math.sin(Math.PI * u * 0.9), (u) => Math.sin(Math.PI * u) ** 0.8, 0.12), 0.7),
  chirp: () => normalize(sweep(0.12, (u) => 760 + 420 * u, (u) => Math.sin(Math.PI * u), 0.08), 0.65),
  giggle: () => {
    const d = new Float32Array(Math.floor(0.56 * SR));
    for (let i = 0; i < 5; i++) mixInto(d, sweep(0.09, (u) => 780 + i * 46 + 150 * Math.sin(Math.PI * u), (u) => Math.sin(Math.PI * u), 0.1), 1 - i * 0.09, i * 0.105);
    return normalize(d, 0.65);
  },
  wow: () => normalize(sweep(0.42, (u) => 500 + 420 * Math.sin(Math.PI * Math.min(1, u * 1.2) * 0.72), (u) => Math.sin(Math.PI * u) ** 0.6, 0.15), 0.7),
  yum: () => {
    const d = new Float32Array(Math.floor(0.36 * SR));
    mixInto(d, sweep(0.15, (u) => 500 + 100 * u, (u) => Math.sin(Math.PI * u), 0.15), 1);
    mixInto(d, sweep(0.18, (u) => 640 - 90 * u, (u) => Math.sin(Math.PI * u), 0.15), 1, 0.16);
    return normalize(d, 0.65);
  },
  aww: () => normalize(sweep(0.46, (u) => 760 - 280 * u, (u) => Math.sin(Math.PI * u) ** 0.7, 0.1), 0.6),
  yawn: () => normalize(sweep(0.8, (u) => 420 + 240 * Math.sin(Math.PI * u) - 120 * u, (u) => Math.sin(Math.PI * u) ** 1.1, 0.14), 0.5),
  sour: () => normalize(sweep(0.46, (u) => 860 - 240 * u + 50 * Math.sin(u * 62), (u) => Math.sin(Math.PI * u) ** 0.6, 0.06), 0.5),
  burp: () => normalize(sweep(0.26, (u) => 130 - 30 * u + 14 * Math.sin(u * 90), (u) => Math.sin(Math.PI * u) ** 0.5, 0.35), 0.75)
};

function makeImpulse(ctx) {
  const dur = 1.7, n = Math.floor(dur * ctx.sampleRate);
  const ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      // Bright start darkens fast: that is what makes a room sound soft and cosy
      const cut = 0.34 * Math.exp(-u * 3.4) + 0.03;
      lp += cut * ((Math.random() * 2 - 1) - lp);
      const env = Math.pow(1 - u, 2.6) * Math.min(1, i / (0.012 * ctx.sampleRate));
      d[i] = lp * env;
    }
  }
  return ir;
}

class Audio {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.ready = false;
    this.voices = 0;
    this.sfxOn = true;
    this.musicVol = 1;
    this.lastSfx = new Map();
    this.silentEl = null;
  }

  /** Builds the graph. Safe before any gesture: it just stays suspended. */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    // iPhones mute web audio on the side switch unless the session says otherwise.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    const ctx = this.ctx = new AC({ latencyHint: 'interactive' });

    this.master = ctx.createGain();
    this.master.gain.value = 0.92;
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 9500;
    this.tone.Q.value = 0.4;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16;
    this.comp.knee.value = 14;
    this.comp.ratio.value = 3.5;
    this.comp.attack.value = 0.006;
    this.comp.release.value = 0.2;
    this.master.connect(this.tone);
    this.tone.connect(this.comp);
    // A gentle soft limiter: even twenty sounds at once can never crackle
    const limiter = ctx.createWaveShaper();
    const curve = new Float32Array(1025);
    for (let i = 0; i < 1025; i++) {
      const x = (i - 512) / 512;
      curve[i] = Math.abs(x) < 0.6 ? x : Math.sign(x) * (0.6 + 0.4 * Math.tanh((Math.abs(x) - 0.6) / 0.4));
    }
    limiter.curve = curve;
    this.comp.connect(limiter);
    limiter.connect(ctx.destination);

    this.dry = ctx.createGain();
    this.dry.gain.value = 1;
    this.dry.connect(this.master);

    this.rev = ctx.createConvolver();
    this.rev.buffer = makeImpulse(ctx);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.34;
    this.rev.connect(this.wet);
    this.wet.connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.dry);
    this.musicRev = ctx.createGain();
    this.musicRev.gain.value = 0.55;
    this.musicBus.connect(this.musicRev);
    this.musicRev.connect(this.rev);

    this._bindLifecycle();
    // Render in small slices so that the first frame is never blocked
    const jobs = [];
    for (const name in INSTRUMENTS) jobs.push(() => this._instrument(name));
    for (const name in SFX) jobs.push(() => this._store(name, SFX[name]()));
    const step = () => {
      const t0 = performance.now();
      while (jobs.length && performance.now() - t0 < 6) jobs.shift()();
      if (jobs.length) setTimeout(step, 0); else this.ready = true;
    };
    setTimeout(step, 0);
  }

  _store(name, data) {
    const b = this.ctx.createBuffer(1, data.length, SR);
    b.copyToChannel ? b.copyToChannel(data, 0) : b.getChannelData(0).set(data);
    this.buffers.set(name, b);
  }

  _instrument(name) {
    const I = INSTRUMENTS[name];
    this._store('i:' + name, I.make(hz(I.base)));
  }

  _bindLifecycle() {
    const wake = () => this.unlock();
    ['touchend', 'pointerup', 'click', 'keydown'].forEach((ev) => window.addEventListener(ev, wake, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend().catch(() => {});
      else if (this.unlocked) this.ctx.resume().catch(() => {});
    });
    window.addEventListener('pagehide', () => this.ctx && this.ctx.suspend().catch(() => {}));
    window.addEventListener('focus', () => this.unlocked && this.ctx && this.ctx.resume().catch(() => {}));
  }

  /** Must be called from a user gesture. iOS only lets sound start from one. */
  unlock() {
    if (!this.ctx) this.init();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (this.unlocked) return;
    this.unlocked = true;
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, 22050);
    s.connect(ctx.destination);
    s.start(0);
    // Older iPhones without audioSession: a silent looping tag does the same job
    if (!navigator.audioSession) {
      try {
        const el = new window.Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
        el.loop = true;
        el.setAttribute('playsinline', '');
        el.play().catch(() => {});
        this.silentEl = el;
      } catch (e) {}
    }
  }

  get running() { return !!this.ctx && this.ctx.state === 'running' && this.ready; }
  get now() { return this.ctx ? this.ctx.currentTime : 0; }

  _play(buf, { vol = 1, rate = 1, pan = 0, when = 0, wet = 0.5, bus = null, dur = 0 } = {}) {
    if (!this.running || !buf) return;
    if (this.voices > 28 && !bus) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    let out = g;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      out = p;
    }
    if (bus) out.connect(bus);
    else {
      out.connect(this.dry);
      if (wet > 0) {
        const s = ctx.createGain();
        s.gain.value = wet;
        out.connect(s);
        s.connect(this.rev);
      }
      this.voices++;
      src.onended = () => { this.voices--; };
    }
    const at = when || ctx.currentTime;
    if (dur) {
      g.gain.setValueAtTime(vol, at + Math.max(0, dur - 0.1));
      g.gain.linearRampToValueAtTime(0, at + dur);
      src.start(at);
      src.stop(at + dur + 0.02);
    } else src.start(at);
    return src;
  }

  sfx(name, opts = {}) {
    if (!this.sfxOn || !this.ready) return;
    // The same sound retriggered within a few ms just gets louder, not nicer
    const now = performance.now();
    const gap = opts.gap ?? 28;
    if (now - (this.lastSfx.get(name) || 0) < gap) return;
    this.lastSfx.set(name, now);
    return this._play(this.buffers.get(name), { wet: 0.25, ...opts });
  }

  note(inst, midi, opts = {}) {
    if (!this.ready) return;
    const base = INSTRUMENTS[inst].base;
    return this._play(this.buffers.get('i:' + inst), { rate: Math.pow(2, (midi - base) / 12), ...opts });
  }

  /** Short rising shimmer: the universal "something nice happened" sound */
  sparkle(start = 0, count = 4, vol = 0.4) {
    if (!this.running) return;
    const t = this.now;
    for (let i = 0; i < count; i++) {
      this.note('bell', penta(start + 5 + i), { vol: vol * (1 - i * 0.1), when: t + i * 0.055, wet: 0.8, pan: -0.3 + (0.6 * i) / count });
    }
  }

  success() {
    if (!this.running) return;
    const t = this.now;
    [[72, 0], [76, 0.12], [79, 0.24], [84, 0.38]].forEach(([m, d]) => {
      this.note('kalimba', m, { vol: 0.62, when: t + d, wet: 0.5 });
      this.note('bell', m + 12, { vol: 0.2, when: t + d, wet: 0.8 });
    });
  }

  /** Bigger reward: a small musical phrase over a warm chord. */
  fanfare() {
    if (!this.running) return;
    const t = this.now;
    [[67, 0], [72, 0.14], [76, 0.28], [79, 0.42], [84, 0.6], [79, 0.82], [84, 0.98]].forEach(([m, d], i) => {
      this.note('kalimba', m, { vol: 0.62, when: t + d, wet: 0.5 });
      this.note('bell', m + 12, { vol: 0.2, when: t + d, wet: 0.9, pan: i % 2 ? 0.3 : -0.3 });
    });
    [48, 60, 64, 67, 72].forEach((m, i) => this.note(m < 60 ? 'bass' : 'pad', m, { vol: m < 60 ? 0.5 : 0.22, when: t + 0.6, wet: 0.5 }));
    for (let i = 0; i < 6; i++) this.note('bell', penta(8 + i), { vol: 0.14, when: t + 1.1 + i * 0.06, wet: 1 });
  }

  /** Wordless creature voice. pitch 1 = default; each friend has its own. */
  voice(type, pitch = 1, vol = 0.62) {
    this.sfx(type, { rate: pitch * (0.97 + Math.random() * 0.06), vol, wet: 0.35, gap: 60 });
  }

  /** How loud the music sits; 0 fades it out. */
  setMusicLevel(v, time = 0.5) {
    if (!this.ctx) return;
    const g = this.musicBus.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(v, t + time);
  }
}

export const audio = new Audio();
