// Generative background music. A phrase is written fresh each session, then
// repeated and varied like a real tune (A A B A), with long breaths between
// sections. So it feels like a song but never loops into something annoying.
import { audio } from './audio.js';

const CHORDS = {
  C: [48, 60, 64, 67, 72], Am: [45, 57, 60, 64, 69], F: [41, 57, 60, 65, 69],
  G: [43, 55, 59, 62, 67], Em: [40, 55, 59, 64, 67], Dm: [38, 57, 62, 65, 69],
  Csus: [48, 60, 65, 67, 72], Fmaj: [41, 57, 64, 65, 72]
};
const SCALE = [0, 2, 4, 7, 9];

const STYLES = {
  hub: { bpm: 80, meter: 4, lead: 'kalimba', comp: 'marimba', level: 0.34, prog: [['C', 'Am', 'F', 'G'], ['F', 'G', 'Em', 'Am'], ['C', 'G', 'Am', 'F']], arp: [0, null, 2, null, 3, null, 2, null], density: 0.62 },
  dress: { bpm: 112, meter: 3, lead: 'bell', comp: 'harp', level: 0.3, prog: [['C', 'F', 'G', 'C'], ['Am', 'F', 'C', 'G']], arp: [0, null, 2, null, 3, null], density: 0.55, leadOct: 0 },
  pet: { bpm: 72, meter: 4, lead: 'harp', comp: 'harp', level: 0.3, prog: [['F', 'C', 'G', 'Am'], ['F', 'G', 'C', 'C']], arp: [0, null, 3, null, 2, null, 3, null], density: 0.45 },
  cake: { bpm: 100, meter: 4, lead: 'marimba', comp: 'marimba', level: 0.32, prog: [['C', 'F', 'G', 'C'], ['Am', 'Dm', 'G', 'C']], arp: [0, null, 3, 2, null, 3, 2, null], density: 0.68, bounce: true },
  adventure: { bpm: 92, meter: 4, lead: 'kalimba', comp: 'marimba', level: 0.3, prog: [['Am', 'F', 'C', 'G'], ['F', 'C', 'G', 'Am']], arp: [0, 2, null, 3, null, 2, 3, null], density: 0.6, bounce: true },
  dream: { bpm: 58, meter: 4, lead: 'bell', comp: null, level: 0.24, prog: [['Fmaj', 'C', 'Am', 'Csus']], arp: null, density: 0.16 },
  night: { bpm: 56, meter: 3, lead: 'bell', comp: 'harp', level: 0.26, prog: [['C', 'F', 'C', 'G']], arp: [0, null, 2, null, 3, null], density: 0.34 }
};

function buildMotif(style) {
  const beats = style.meter * 2;
  const m = [];
  let deg = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < beats * 2; i++) {
    const strong = i % style.meter === 0;
    if (Math.random() < (strong ? style.density + 0.25 : style.density * 0.55)) {
      deg += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
      deg = Math.max(1, Math.min(9, deg));
      m.push({ d: deg, v: strong ? 1 : 0.76 });
    } else m.push(null);
  }
  // Land each phrase on a calm, stable note
  m[m.length - style.meter * 2] = { d: 5, v: 0.9 };
  return m;
}

const degToMidi = (d, base = 72) => {
  const o = Math.floor(d / 5);
  return base - 12 + o * 12 + SCALE[((d % 5) + 5) % 5];
};

class Music {
  constructor() {
    this.enabled = true;
    this.style = null;
    this.name = null;
    this.timer = null;
    this.next = 0;
    this.step = 0;
    this.bar = 0;
  }

  setEnabled(on) {
    this.enabled = on;
    audio.setMusicLevel(on && this.style ? this.style.level : 0, 0.4);
  }

  play(name) {
    if (this.name === name) return;
    this.name = name;
    if (!name) {
      audio.setMusicLevel(0, 0.5);
      this.style = null;
      return;
    }
    const st = STYLES[name];
    audio.setMusicLevel(0, 0.25);
    const startNew = () => {
      if (this.name !== name) return;
      this.style = st;
      this.motifA = buildMotif(st);
      this.motifB = buildMotif(st);
      this.step = 0;
      this.bar = 0;
      this.prog = st.prog[Math.floor(Math.random() * st.prog.length)];
      this.next = audio.now + 0.12;
      if (this.enabled) audio.setMusicLevel(st.level, 1.1);
    };
    setTimeout(startNew, 280);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 70);
  }

  tick() {
    if (!this.style || !audio.running || document.hidden) return;
    if (this.next < audio.now) this.next = audio.now + 0.05;
    while (this.next < audio.now + 0.32) {
      this.scheduleStep(this.next);
      this.next += (60 / this.style.bpm) / 2;
    }
  }

  scheduleStep(when) {
    const st = this.style, stepsPerBar = st.meter * 2;
    const inBar = this.step % stepsPerBar;
    const chordName = this.prog[this.bar % this.prog.length];
    const chord = CHORDS[chordName];
    const bus = audio.musicBus;
    const beat = 60 / st.bpm;

    if (inBar === 0) {
      const dur = beat * st.meter + 0.5;
      for (let i = 1; i < 4; i++) audio.note('pad', chord[i], { vol: 0.17, when, bus, dur: Math.min(3.9, dur) });
      audio.note('bass', chord[0], { vol: 0.42, when, bus });
    }
    if (st.bounce && inBar === st.meter) audio.note('bass', chord[0] + 7, { vol: 0.3, when, bus });

    if (st.comp && st.arp) {
      const a = st.arp[inBar % st.arp.length];
      if (a !== null && a !== undefined) {
        audio.note(st.comp, chord[a + 1] + 12, { vol: 0.16 + Math.random() * 0.03, when: when + Math.random() * 0.006, bus, pan: (a - 1.5) * 0.18 });
      }
    }

    // Sixteen-bar form: A A B A, then rest for four bars and start again
    const section = Math.floor(this.bar / 4) % 5;
    if (section < 4) {
      const motif = section === 2 ? this.motifB : this.motifA;
      const n = motif[(this.step) % motif.length];
      if (n) {
        const d = n.d + (section === 3 && Math.random() < 0.12 ? 1 : 0);
        audio.note(st.lead, degToMidi(d) + (st.leadOct || 0), { vol: 0.34 * n.v, when: when + Math.random() * 0.012, bus, pan: 0.12 });
      }
    }

    this.step++;
    if (inBar === stepsPerBar - 1) {
      this.bar++;
      if (this.bar % 20 === 0) {
        this.motifA = buildMotif(st);
        this.motifB = buildMotif(st);
        this.prog = st.prog[Math.floor(Math.random() * st.prog.length)];
      }
    }
  }
}

export const music = new Music();
