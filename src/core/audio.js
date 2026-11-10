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


/** Plucked string by Karplus-Strong, with a soft initial burst so it stays mellow */
function karplus(f, dur, decay = 0.996, bright = 0.5) {
  const n = Math.floor(dur * SR), d = new Float32Array(n);
  const P = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(P);
  let lp = 0;
  for (let i = 0; i < P; i++) { lp += bright * ((Math.random() * 2 - 1) - lp); buf[i] = lp; }
  let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    const cur = buf[idx];
    const nx = decay * (0.5 * (cur + prev));
    prev = cur;
    buf[idx] = nx;
    d[i] = cur;
    idx = (idx + 1) % P;
  }
  fadeEdges(d, 0.002, 0.05);
  return normalize(d, 0.9);
}

// ---- wordless character voices ---------------------------------------------------
// A small vocal tract: a soft buzz with a pitch melody, shaped by three formant
// filters that glide between vowels. Pitched like a small child or a cartoon toy.
const VOWELS = { a: [900, 1450, 2900], o: [600, 1000, 2700], u: [420, 880, 2500], e: [620, 2150, 3100], i: [380, 2600, 3400], m: [300, 1300, 2600] };

function resonator(f, bw) {
  let y1 = 0, y2 = 0;
  return (x, freq) => {
    const r = Math.exp(-Math.PI * bw / SR), c = 2 * r * Math.cos(TAU * (freq || f) / SR);
    const y = (1 - r) * x + c * y1 - r * r * y2;
    y2 = y1; y1 = y;
    return y;
  };
}

/**
 * syl: [{d: seconds, f0: Hz start, f1: Hz end, v: 'a'|'e'..., v2: vowel at end, breath, gap}]
 * Pitches between 300 and 700 Hz keep it sweet; the formants never go shrill.
 */
function vocal(syls, { shift = 1.12, breath = 0.04 } = {}) {
  const total = syls.reduce((a, s) => a + s.d + (s.gap || 0), 0) + 0.05;
  const n = Math.floor(total * SR), out = new Float32Array(n);
  let at = 0;
  for (const sy of syls) {
    const m = Math.floor(sy.d * SR);
    const F = [resonator(0, 90), resonator(0, 120), resonator(0, 200)];
    const va = VOWELS[sy.v], vb = VOWELS[sy.v2 || sy.v];
    let ph = 0, lpN = 0;
    const o = Math.floor(at * SR);
    for (let i = 0; i < m && o + i < n; i++) {
      const u = i / m;
      const e = sy.curve ? sy.curve(u) : u;
      const f = sy.f0 + (sy.f1 - sy.f0) * e + (sy.wob ? Math.sin(u * TAU * sy.wob) * sy.f0 * 0.03 : 0);
      ph += f / SR;
      if (ph > 1) ph -= 1;
      // soft glottal buzz: a rounded saw, tilted to a gentle spectrum
      let x = 0;
      const H = Math.min(18, Math.floor(7000 / f));
      for (let h = 1; h <= H; h++) x += Math.sin(TAU * h * ph) / Math.pow(h, 1.25);
      lpN += 0.3 * ((Math.random() * 2 - 1) - lpN);
      x += lpN * (sy.breath ?? breath) * 6;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, u * (sy.atk || 3))), 0.6) * Math.pow(1 - u, sy.tail || 0.6);
      let y = 0;
      for (let k = 0; k < 3; k++) {
        const fk = (va[k] + (vb[k] - va[k]) * u) * shift;
        y += F[k](x, fk) * [1, 0.7, 0.22][k];
      }
      out[o + i] += y * env * (sy.amp || 1);
    }
    at += sy.d + (sy.gap || 0);
  }
  // gentle top-end roll-off
  let lp = 0;
  for (let i = 0; i < n; i++) { lp += 0.55 * (out[i] - lp); out[i] = lp; }
  fadeEdges(out, 0.004, 0.03);
  // Level by loudness, not by peak, so every voice sits at the same volume
  let r = 0, pk = 0;
  for (let i = 0; i < n; i++) { r += out[i] * out[i]; pk = Math.max(pk, Math.abs(out[i])); }
  r = Math.sqrt(r / n) || 1;
  const g = Math.min(0.22 / r, 0.95 / (pk || 1));
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}
const ease = (u) => u * u * (3 - 2 * u);
const hump = (u) => Math.sin(Math.PI * u);

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
  // warm ukulele-like string (Karplus-Strong): plucky, woody, never sharp
  pluck: { base: 60, dur: 1.3, make: (f) => karplus(f, 1.3, 0.996, 0.55) },
  // soft breathy flute for leads: round sine, a slow vibrato and a puff of air
  flute: {
    base: 72, dur: 1.2, make: (f) => {
      const n = Math.floor(1.2 * SR), d = new Float32Array(n);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR, u = i / n;
        const vib = 1 + 0.006 * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 0.25);
        ph += TAU * f * vib / SR;
        const env = Math.min(1, t / 0.05) * Math.exp(-t * 1.4) * Math.min(1, (1 - u) / 0.15);
        d[i] = env * (Math.sin(ph) + 0.16 * Math.sin(2 * ph) + 0.04 * Math.sin(3 * ph));
      }
      mixInto(d, noiseBand(0.12, () => f * 2, 2, (u) => Math.sin(Math.PI * u) ** 2), 0.05);
      return normalize(d, 0.85);
    }
  },
  // toy glockenspiel: pure and bright, quickly gone
  glock: { base: 84, dur: 1.2, make: (f) => tone(f, 1.2, [[1, 1, 0.5], [2.76, 0.18, 0.12], [5.4, 0.06, 0.04]], 0.001) },
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
  // Scissors: two tiny blades closing, all treble and no sting
  snip: () => {
    const d = new Float32Array(Math.floor(0.09 * SR));
    mixInto(d, noiseBand(0.03, () => 3400, 2.2, expo(5)), 1);
    mixInto(d, noiseBand(0.022, () => 2300, 2.6, expo(5)), 0.8, 0.038);
    return normalize(d, 0.4);
  },
  // A clown's squeezy nose
  honk: () => normalize(sweep(0.22, (u) => 300 + 90 * Math.sin(u * 9), (u) => Math.sin(Math.PI * Math.min(1, u * 1.1)) ** 0.5, 0.6), 0.6),
  // Long enough to loop quietly for the dryer, shower and blender
  hiss: () => normalize(noiseBand(1.2, () => 1500, 0.8, () => 1), 0.5),
  rumble: () => {
    const d = noiseBand(1.2, () => 320, 0.9, () => 1);
    mixInto(d, sweep(1.2, () => 110, () => 1, 0.5), 0.35);
    return normalize(d, 0.55);
  },
  // ---- character voices -----------------------------------------------------
  yay: () => vocal([{ d: 0.1, f0: 430, f1: 470, v: 'i', v2: 'e', atk: 6 }, { d: 0.32, f0: 520, f1: 640, v: 'e', v2: 'a', curve: ease, tail: 1 }]),
  ooh: () => vocal([{ d: 0.5, f0: 420, f1: 520, v: 'u', v2: 'o', curve: hump, tail: 1.2 }]),
  mew: () => vocal([{ d: 0.3, f0: 640, f1: 520, v: 'i', v2: 'u', curve: ease, tail: 1 }]),
  hehe: () => vocal([{ d: 0.11, f0: 560, f1: 600, v: 'e', breath: 0.25, gap: 0.05 }, { d: 0.11, f0: 600, f1: 640, v: 'e', breath: 0.25, gap: 0.05 }, { d: 0.14, f0: 640, f1: 560, v: 'i', v2: 'e', breath: 0.2 }]),
  arf: () => vocal([{ d: 0.09, f0: 560, f1: 440, v: 'a', v2: 'o', atk: 8, tail: 1.6, breath: 0.12, gap: 0.08 }, { d: 0.1, f0: 600, f1: 470, v: 'a', v2: 'o', atk: 8, tail: 1.6, breath: 0.12 }]),
  uhoh: () => vocal([{ d: 0.14, f0: 520, f1: 540, v: 'a', v2: 'o', gap: 0.05 }, { d: 0.24, f0: 400, f1: 380, v: 'o', tail: 1 }]),
  mmm: () => vocal([{ d: 0.42, f0: 380, f1: 470, v: 'm', curve: hump, tail: 0.7, breath: 0.02 }, { d: 0.16, f0: 470, f1: 520, v: 'm', v2: 'a', tail: 1.2 }]),
  wee: () => vocal([{ d: 0.5, f0: 480, f1: 760, v: 'u', v2: 'i', curve: ease, tail: 0.8 }]),
  hmm: () => vocal([{ d: 0.34, f0: 360, f1: 480, v: 'm', v2: 'u', curve: (u) => u * u, tail: 0.5 }]),
  aah: () => vocal([{ d: 0.6, f0: 420, f1: 560, v: 'a', curve: hump, tail: 1, wob: 4 }]),
  lala: () => vocal([{ d: 0.16, f0: 520, f1: 520, v: 'a', atk: 6, gap: 0.02 }, { d: 0.16, f0: 620, f1: 620, v: 'a', atk: 6, gap: 0.02 }, { d: 0.26, f0: 700, f1: 660, v: 'a', atk: 6, tail: 1 }]),
  oops: () => vocal([{ d: 0.12, f0: 560, f1: 600, v: 'u', atk: 8, gap: 0.04 }, { d: 0.18, f0: 470, f1: 380, v: 'u', v2: 'o', tail: 1.4, breath: 0.2 }]),
  mwah: () => {
    const d = vocal([{ d: 0.2, f0: 520, f1: 640, v: 'm', v2: 'a', tail: 1.4 }]);
    mixInto(d, noiseBand(0.02, () => 3000, 2, () => 1), 0.4, 0.2);
    return normalize(d, 0.7);
  },
  roar: () => vocal([{ d: 0.45, f0: 260, f1: 330, v: 'a', v2: 'o', curve: hump, wob: 9, breath: 0.18, tail: 1 }], { shift: 1 }),
  snore: () => normalize(noiseBand(0.9, (u) => 300 + 200 * Math.sin(Math.PI * u), 3, (u) => Math.sin(Math.PI * u) ** 2), 0.3),
  // ---- discovery, toys and adventure -----------------------------------------------
  crack: () => {
    const d = noiseBand(0.06, () => 2800, 1.5, expo(9));
    mixInto(d, sweep(0.05, (u) => 900 - 300 * u, expo(8)), 0.4);
    return normalize(d, 0.55);
  },
  shell: () => {
    const d = new Float32Array(Math.floor(0.5 * SR));
    for (let i = 0; i < 6; i++) mixInto(d, tone(1800 + Math.random() * 1600, 0.12, [[1, 1, 0.04], [2.3, 0.3, 0.02]]), 0.5 - i * 0.06, i * 0.06 + Math.random() * 0.03);
    return normalize(d, 0.35);
  },
  rip: () => normalize(noiseBand(0.3, (u) => 1800 + 1400 * u, 0.7, (u) => (0.5 + 0.5 * Math.sin(u * 70)) * Math.sin(Math.PI * u)), 0.3),
  crinkle: () => {
    const d = new Float32Array(Math.floor(0.35 * SR));
    for (let i = 0; i < 14; i++) mixInto(d, noiseBand(0.015, () => 2500 + Math.random() * 3000, 2, expo(6)), 0.4 + Math.random() * 0.5, Math.random() * 0.32);
    return normalize(d, 0.3);
  },
  steam: () => normalize(noiseBand(0.7, (u) => 2200 + 1800 * u, 0.7, (u) => Math.min(1, u * 8) * Math.pow(1 - u, 1.5)), 0.22),
  lid: () => {
    const d = tone(420, 0.25, [[1, 1, 0.05], [2.4, 0.5, 0.03], [4.1, 0.2, 0.02]]);
    mixInto(d, noiseBand(0.02, () => 1500, 1, () => 1), 0.2);
    return normalize(d, 0.6);
  },
  jump: () => normalize(sweep(0.2, (u) => 300 + 520 * Math.pow(u, 0.6), (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.15), 0.6),
  jump2: () => normalize(sweep(0.24, (u) => 420 + 700 * Math.pow(u, 0.6), (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.1), 0.55),
  land: () => {
    const d = sweep(0.1, (u) => 180 - 80 * u, expo(7), 0.2);
    mixInto(d, noiseBand(0.05, () => 700, 1, expo(6)), 0.25);
    return normalize(d, 0.55);
  },
  bounce: () => normalize(sweep(0.38, (u) => 200 + 600 * u + 40 * Math.sin(u * 60), (u) => Math.pow(1 - u, 1.2), 0.2), 0.6),
  coin: () => {
    const d = new Float32Array(Math.floor(0.45 * SR));
    mixInto(d, tone(hz(88), 0.1, [[1, 1, 0.08], [2, 0.2, 0.04]]), 0.7);
    mixInto(d, tone(hz(95), 0.35, [[1, 1, 0.2], [2, 0.2, 0.1]]), 0.9, 0.07);
    return normalize(d, 0.45);
  },
  powerup: () => {
    const d = new Float32Array(Math.floor(0.8 * SR));
    [72, 76, 79, 84, 88, 91].forEach((m, i) => mixInto(d, tone(hz(m), 0.3, [[1, 1, 0.15], [2, 0.25, 0.08], [3, 0.08, 0.05]]), 0.6, i * 0.07));
    return normalize(d, 0.5);
  },
  magic: () => {
    const d = new Float32Array(Math.floor(1.1 * SR));
    for (let i = 0; i < 12; i++) mixInto(d, tone(hz(84 + PENTA[i % 5] + 12 * Math.floor(i / 5)), 0.4, [[1, 1, 0.25], [2.01, 0.15, 0.1]]), 0.45 - i * 0.025, i * 0.045);
    mixInto(d, noiseBand(1, (u) => 5000 + 2000 * u, 1, (u) => Math.sin(Math.PI * u) * 0.4), 0.08);
    return normalize(d, 0.45);
  },
  wobble: () => normalize(sweep(0.5, (u) => 150 + 40 * Math.sin(u * 50) * (1 - u), (u) => Math.pow(1 - u, 1.4) * Math.min(1, u * 20), 0.3), 0.55),
  stretch: () => normalize(sweep(0.4, (u) => 180 + 260 * u + 12 * Math.sin(u * 140), (u) => Math.sin(Math.PI * u) ** 0.8, 0.35), 0.38),
  poof: () => normalize(noiseBand(0.35, (u) => 700 + 600 * (1 - u), 0.6, (u) => Math.min(1, u * 25) * Math.pow(1 - u, 2)), 0.42),
  twinkle: () => normalize(tone(hz(96), 0.5, [[1, 1, 0.2], [2.4, 0.2, 0.08]]), 0.3),
  found: () => {
    const d = new Float32Array(Math.floor(0.9 * SR));
    [79, 84, 88].forEach((m, i) => mixInto(d, tone(hz(m), 0.6, [[1, 1, 0.35], [2, 0.2, 0.2], [3, 0.06, 0.08]]), 0.6, i * 0.09));
    return normalize(d, 0.5);
  },
  zip: () => normalize(sweep(0.16, (u) => 500 + 1600 * u, (u) => Math.sin(Math.PI * u), 0.05), 0.35),
  splat: () => {
    const d = noiseBand(0.22, (u) => 500 - 250 * u, 1.2, expo(6));
    mixInto(d, sweep(0.12, (u) => 220 - 120 * u, expo(5)), 0.6);
    return normalize(d, 0.55);
  },
  gulp: () => normalize(sweep(0.16, (u) => 260 + 260 * Math.sin(Math.PI * u), (u) => Math.sin(Math.PI * u), 0.2), 0.55),
  squeak: () => normalize(sweep(0.14, (u) => 900 + 500 * Math.sin(Math.PI * u), (u) => Math.sin(Math.PI * u), 0.05), 0.4),
  knock: () => {
    const d = new Float32Array(Math.floor(0.3 * SR));
    for (let i = 0; i < 2; i++) mixInto(d, tone(300, 0.08, [[1, 1, 0.03], [2.6, 0.4, 0.015]]), 1, i * 0.13);
    return normalize(d, 0.6);
  },
  // soft percussion for the music
  kick: () => normalize(sweep(0.22, (u) => 110 * Math.pow(0.45, u * 3) + 45, expo(6), 0.1), 0.9),
  shaker: () => normalize(noiseBand(0.07, () => 6500, 0.8, (u) => Math.sin(Math.PI * Math.min(1, u * 1.6)) ** 2), 0.5),
  snap: () => {
    const d = noiseBand(0.05, () => 1900, 1.4, expo(9));
    mixInto(d, sweep(0.03, () => 1200, expo(8)), 0.3);
    return normalize(d, 0.6);
  },
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

  /** Percussion and one-shots scheduled on the music bus */
  hit(name, opts = {}) {
    if (!this.running) return;
    return this._play(this.buffers.get(name), { bus: this.musicBus, ...opts });
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

  /**
   * A live singing voice: two oscillators through three vowel filters, changed
   * every frame while a finger stretches a mouth. Returns null until sound is
   * unlocked. Kept dark and round, so that no pitch can ever turn shrill.
   */
  singer({ wave = 'sawtooth', vib = 22, vibRate = 5.4, trem = 0 } = {}) {
    if (!this.running) return null;
    const ctx = this.ctx, t0 = ctx.currentTime;
    const a = ctx.createOscillator(), b = ctx.createOscillator();
    a.type = wave;
    b.type = 'triangle';
    b.detune.value = 6;
    const lfo = ctx.createOscillator(), lfoAmt = ctx.createGain();
    lfo.frequency.value = vibRate || 0.01;
    lfoAmt.gain.value = vib;
    lfo.connect(lfoAmt);
    lfoAmt.connect(a.detune);
    lfoAmt.connect(b.detune);

    const src = ctx.createGain();
    a.connect(src);
    const bg = ctx.createGain();
    bg.gain.value = 0.6;
    b.connect(bg);
    bg.connect(src);
    const out = ctx.createGain();
    out.gain.value = 0;

    const forms = [[800, 7, 1], [1200, 9, 0.5], [2600, 11, 0.16]].map(([f, q, g]) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const gn = ctx.createGain();
      gn.gain.value = g * 2.6;
      src.connect(bp);
      bp.connect(gn);
      gn.connect(out);
      return bp;
    });
    // The chest of the voice: without it the vowels sound thin and whistly
    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.value = 700;
    const bodyG = ctx.createGain();
    bodyG.gain.value = 0.32;
    src.connect(body);
    body.connect(bodyG);
    bodyG.connect(out);

    let last = out, tremOsc = null;
    if (trem) {
      // Ring-modulated, for the robot
      const ring = ctx.createGain();
      ring.gain.value = 1.1;
      tremOsc = ctx.createOscillator();
      tremOsc.frequency.value = trem;
      const depth = ctx.createGain();
      depth.gain.value = 0.7;
      tremOsc.connect(depth);
      depth.connect(ring.gain);
      out.connect(ring);
      last = ring;
      tremOsc.start(t0);
    }
    last.connect(this.dry);
    const send = ctx.createGain();
    send.gain.value = 0.42;
    last.connect(send);
    send.connect(this.rev);

    a.start(t0);
    b.start(t0);
    lfo.start(t0);
    let closed = false;
    return {
      /** f in Hz, amp 0..1, F = [f1, f2, f3], glide = seconds to slide there */
      set(f, amp, F, glide = 0.05) {
        if (closed) return;
        const n = ctx.currentTime;
        a.frequency.setTargetAtTime(f, n, glide);
        b.frequency.setTargetAtTime(f, n, glide);
        out.gain.setTargetAtTime(amp * 0.42, n, 0.035);
        if (F) forms.forEach((bp, i) => bp.frequency.setTargetAtTime(Math.min(F[i], 7000), n, 0.07));
      },
      close() {
        if (closed) return;
        closed = true;
        const n = ctx.currentTime;
        out.gain.setTargetAtTime(0, n, 0.04);
        const end = n + 0.3;
        [a, b, lfo].forEach((o) => { try { o.stop(end); } catch (e) {} });
        if (tremOsc) { try { tremOsc.stop(end); } catch (e) {} }
        a.onended = () => { try { last.disconnect(); send.disconnect(); out.disconnect(); } catch (e) {} };
      }
    };
  }

  /** A quiet endless sound (dryer, shower, blender). Returns {set(vol), stop()}. */
  loop(name, vol = 0.3, rate = 1) {
    if (!this.running || !this.buffers.get(name)) return null;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.get(name);
    src.loop = true;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
    src.connect(g);
    g.connect(this.dry);
    src.start();
    let done = false;
    return {
      set: (v) => { if (!done) g.gain.setTargetAtTime(v, ctx.currentTime, 0.05); },
      stop: () => {
        if (done) return;
        done = true;
        g.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        try { src.stop(ctx.currentTime + 0.3); } catch (e) {}
      }
    };
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
export const __recipes = { SFX, INSTRUMENTS };
