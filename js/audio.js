// ============================================================================
// Little Wonder World — Synthesized Web Audio & Gentle Voice Engine
// 100% Offline, Zero External Audio Files Required, iOS Safari Auto-Unlocked
// ============================================================================

class WonderAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.voiceEnabled = true;
    this.unlocked = false;
    this.preferredVoice = null;
    this.lastSpeakTime = 0;

    // C Major Pentatonic frequencies across 3 octaves (always harmonious!)
    this.pentatonic = [
      261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
      523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
      1046.50, 1174.66, 1318.51, 1567.98, 1760.00 // C6, D6, E6, G6, A6
    ];

    this.popCombo = 0;
    this.lastPopTime = 0;

    this._initVoice();
    this._setupUnlockListeners();
  }

  _initVoice() {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || !voices.length) return;
      // Prefer warm, natural iOS/macOS English voices
      const preferredNames = ['Samantha', 'Ava', 'Nicky', 'Victoria', 'Karen', 'Moira', 'Google US English'];
      for (const name of preferredNames) {
        const found = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
        if (found) {
          this.preferredVoice = found;
          break;
        }
      }
      if (!this.preferredVoice) {
        this.preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  _setupUnlockListeners() {
    const unlock = () => {
      this._ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.unlocked && this.ctx) {
        // Play a 1-frame silent buffer to unlock iOS Safari Web Audio
        try {
          const buffer = this.ctx.createBuffer(1, 1, 22050);
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.ctx.destination);
          source.start(0);
          this.unlocked = true;
        } catch (e) {}
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playSparkle();
    }
    return this.muted;
  }

  // Gentle voice prompt for 4-year-old (non-reading navigation!)
  speak(text, force = false) {
    if (this.muted || !this.voiceEnabled || !('speechSynthesis' in window)) return;
    const now = performance.now();
    if (!force && now - this.lastSpeakTime < 900) return;
    this.lastSpeakTime = now;

    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (this.preferredVoice) utter.voice = this.preferredVoice;
      utter.lang = 'en-US';
      utter.pitch = 1.18; // Warm, friendly storybook tone
      utter.rate = 0.96;  // Clear and easy to understand for a 4yo
      utter.volume = 0.85;
      window.speechSynthesis.speak(utter);
    } catch (e) {}
  }

  // Soft bouncy button tap
  playTap(pitchMultiplier = 1) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(680 * pitchMultiplier, now + 0.065);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Satisfying silicone Pop-It bubble sound with rising combo scale!
  playPop(customIndex = null) {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const nowMs = performance.now();
    if (nowMs - this.lastPopTime < 1400) {
      this.popCombo = (this.popCombo + 1) % this.pentatonic.length;
    } else {
      this.popCombo = 0;
    }
    this.lastPopTime = nowMs;

    const idx = customIndex !== null ? customIndex % this.pentatonic.length : this.popCombo;
    const baseFreq = this.pentatonic[idx];
    const now = ctx.currentTime;

    // 1. Rubbery pop thump
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq * 0.55, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.045);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, now + 0.11);

    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.13);

    // 2. Crisp harmonic plop overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.01);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.0, now + 0.06);

    gain2.gain.setValueAtTime(0.12, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.01);
    osc2.stop(now + 0.08);
  }

  // Play a specific note on the pentatonic harp/celesta
  playNote(index, duration = 0.45, type = 'sine') {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const freq = this.pentatonic[Math.abs(Math.round(index)) % this.pentatonic.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(freq * 2, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.06, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    sub.connect(subGain);
    subGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    sub.start(now);
    osc.stop(now + duration + 0.02);
    sub.stop(now + duration + 0.02);
  }

  // Magical fairy wand glissando sparkle
  playSparkle() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.042;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  // Joyful win / completion fanfare
  playFanfare() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const melody = [
      { f: 523.25, t: 0.00, d: 0.14 }, // C5
      { f: 659.25, t: 0.12, d: 0.14 }, // E5
      { f: 783.99, t: 0.24, d: 0.14 }, // G5
      { f: 1046.50, t: 0.36, d: 0.45 }, // C6
      { f: 783.99, t: 0.52, d: 0.14 }, // G5
      { f: 1046.50, t: 0.66, d: 0.55 }  // C6
    ];

    melody.forEach(n => {
      const start = ctx.currentTime + n.t;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(n.f, start);
      osc2.frequency.setValueAtTime(n.f * 1.5, start); // Fifth harmonic

      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.06, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

      osc.connect(gain);
      osc2.connect(g2);
      g2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc2.start(start);
      osc.stop(start + n.d + 0.02);
      osc2.stop(start + n.d + 0.02);
    });
  }

  // Stretchy slime squish sound
  playSquish() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const startFreq = 180 + Math.random() * 120;
    const endFreq = 340 + Math.random() * 220;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.7, now + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.09);
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Cute munch / eating sound for Pet Feeding & Cake Eating
  playMunch() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    [0, 0.13].forEach((offset, i) => {
      const start = ctx.currentTime + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240 + i * 70, start);
      osc.frequency.exponentialRampToValueAtTime(110, start + 0.09);

      gain.gain.setValueAtTime(0.24, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.11);
    });
  }

  // Water / bubble scrub sound
  playBubble() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const base = 380 + Math.random() * 420;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 2.1, now + 0.075);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Camera shutter + magic chime for Lookbook & Bakery snapshots
  playCameraShutter() {
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // White noise burst for shutter click
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    setTimeout(() => this.playSparkle(), 90);
  }

  // Gentle music box lullaby notes for Pet Naptime
  playLullabyNote(step = 0) {
    const lullaby = [523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33];
    if (this.muted) return;
    const ctx = this._ensureContext();
    if (!ctx) return;

    const freq = lullaby[step % lullaby.length];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);
  }
}

export const audio = new WonderAudio();
