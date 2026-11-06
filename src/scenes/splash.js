// The first screen: Moko sleeps inside a shining bubble. One tap wakes the world,
// and that tap is also what lets sound play on phones.
import { app, go, hint, wait } from '../core/engine.js';
import { audio } from '../core/audio.js';
import { fx } from '../core/fx.js';
import { P, ell, glow, gloss, alpha, softStar } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature } from '../art/creatures.js';

export const splash = {
  tint: '#FFFFFF',
  home: false,
  enter() {
    this.t = 0;
    this.popped = false;
    this.stars = Array.from({ length: 34 }, (_, i) => ({ x: (i * 73.1) % 1, y: (i * 41.3) % 1, s: 1 + (i % 5) * 0.7, p: i * 1.3 }));
    hint.set({ from: [app.W / 2, app.H * 0.5], delay: 1.1 });
    document.dispatchEvent(new CustomEvent('wonder:splash', { detail: true }));
  },
  exit() {
    document.dispatchEvent(new CustomEvent('wonder:splash', { detail: false }));
  },
  update(dt) { this.t += dt; },
  draw(c) {
    const W = app.W, H = app.H, t = this.t;
    const b = softBack('splash', W, H, '#3C2E9E', '#FF9CC4');
    c.drawImage(b.cv, 0, 0, W, H);
    for (const s of this.stars) {
      const k = 0.5 + 0.5 * Math.sin(t * 2 + s.p);
      softStar(c, s.x * W, s.y * H * 0.8, s.s * (1 + k), 4, 0.35);
      c.fillStyle = `rgba(255,248,210,${0.35 + 0.6 * k})`;
      c.fill();
    }
    const cx = W / 2, cy = H * 0.47 + Math.sin(t * 1.4) * 8, r = Math.min(W * 0.36, 150);
    glow(c, cx, cy, r * 2, '#FFE6FF', 0.5);
    if (this.popped) return;
    c.save();
    c.translate(cx, cy);
    const pulse = 1 + Math.sin(t * 3) * 0.012;
    c.scale(pulse, pulse);
    drawCreature(c, 'moko', { R: r * 0.52, t: t * 0.5, eyes: 'closed', mouth: 'smile', sy: 1 + Math.sin(t * 1.5) * 0.015 });
    // Dream bubbles
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.28 + i / 3) % 1;
      c.fillStyle = alpha('#FFFFFF', 0.8 * (1 - u));
      ell(c, r * (0.34 + u * 0.3), -r * (0.3 + u * 0.46), 3 + u * 10);
      c.fill();
    }
    // Rainbow soap skin
    const g = c.createRadialGradient(-r * 0.3, -r * 0.38, r * 0.2, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,.04)');
    g.addColorStop(0.72, 'rgba(190,220,255,.1)');
    g.addColorStop(0.92, 'rgba(255,190,240,.32)');
    g.addColorStop(1, 'rgba(255,255,255,.85)');
    c.fillStyle = g;
    ell(c, 0, 0, r);
    c.fill();
    c.lineCap = 'round';
    c.lineWidth = r * 0.055;
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.beginPath();
    c.arc(0, 0, r * 0.87, Math.PI * 1.06, Math.PI * 1.46);
    c.stroke();
    gloss(c, r * 0.48, r * 0.54, r * 0.14, r * 0.07, 0.8, -0.8);
    c.restore();
  },
  down() {},
  up(p) {
    if (this.popped) return;
    this.popped = true;
    audio.unlock();
    hint.clear();
    const cx = app.W / 2, cy = app.H * 0.47;
    fx.bubbles(cx, cy, 30);
    fx.sparkle(cx, cy, 30);
    fx.burst(cx, cy, { kind: 'star', n: 18, colors: [P.sun, P.butter, P.pink], speed: 340, size: 22, g: 200 });
    const play = () => {
      audio.sfx('bubble', { rate: 0.55, vol: 1 });
      audio.sparkle(0, 5, 0.5);
    };
    if (audio.ctx && audio.ctx.state !== 'running') audio.ctx.resume().then(play).catch(() => {});
    else play();
    wait(0.26, () => go('hub', { intro: 1 }, { x: cx, y: cy }));
  }
};
