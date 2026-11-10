// The first screen: Moko sleeps inside a shining soap bubble under the stars.
// One tap wakes the world (and is also what lets sound play on phones): the
// bubble pops, Moko wakes up with a happy little hop and off we go.
import { app, go, hint, wait, tween } from '../core/engine.js';
import { audio } from '../core/audio.js';
import { fx } from '../core/fx.js';
import { P, E, TAU, rand, pick } from '../core/draw.js';
import { Stage, THREE, M, G, mesh, group, V, starShape } from '../core/stage.js';
import { Critter } from '../art/critter3d.js';

export const splash = {
  tint: '#3C2E9E',
  home: false,
  enter() {
    this.t = 0;
    this.popped = false;
    const st = this.stage = new Stage({ bg: [[0, '#2B2280'], [0.6, '#6A4FC0'], [1, '#FF9CC4']], fov: 34, hemi: 0.6, key: 2.2, keyColor: '#FFE9F6', rim: 1.6, rimColor: '#9FC4FF', shadowSize: 0 });
    this.world = group(st.scene);
    const m = this.moko = new Critter('moko', { size: 1, shadow: false });
    m.sleep = true;
    m.root.position.set(0, -0.95, 0);
    this.world.add(m.root);
    this.bubble = mesh(G.sphere(48), M.bubble({ opacity: 0.28 }), { s: 1.9, parent: this.world, cast: false });
    this.bubble.renderOrder = 2;
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      const s = mesh(G.puffy('sstar', starShape(4, 1, 0.38), 0.2, 0.1), M.glow(pick(['#FFF2A8', '#FFFFFF', '#FFC4E8']), { opacity: 1 }), { p: [rand(-9, 9), rand(-5, 6), rand(-12, -4)], s: rand(0.05, 0.16), parent: this.world, cast: false });
      s.userData.ph = rand(TAU);
      this.stars.push(s);
    }
    st.frame(V(0, 0, 0), 6, 6, [0, 0, 1]);
    hint.set({ from: [app.W / 2, app.H * 0.5], delay: 1.1 });
    document.dispatchEvent(new CustomEvent('wonder:splash', { detail: true }));
  },
  exit() {
    this.moko.dispose();
    this.stage.dispose();
    document.dispatchEvent(new CustomEvent('wonder:splash', { detail: false }));
  },
  resize() { this.stage.frame(V(0, 0, 0), 6, 6, [0, 0, 1]); },
  update(dt) {
    this.t += dt;
    const t = this.t;
    this.world.position.y = Math.sin(t * 1.4) * 0.12;
    if (!this.popped) this.bubble.scale.set(1.9 + Math.sin(t * 2.6) * 0.03, 1.9 - Math.sin(t * 2.6) * 0.03, 1.9);
    this.bubble.rotation.y = t * 0.3;
    for (const s of this.stars) s.scale.setScalar(0.05 + 0.08 * (0.5 + 0.5 * Math.sin(t * 2 + s.userData.ph)));
    this.moko.look(this.popped ? this.stage.camera.position : null);
    this.moko.update(dt);
  },
  draw() {},
  down() {},
  up() {
    if (this.popped) return;
    this.popped = true;
    audio.unlock();
    hint.clear();
    const cx = app.W / 2, cy = app.H * 0.5;
    tween(this.bubble.scale, { x: 2.6, y: 2.6, z: 2.6 }, 0.12, { done: () => { this.bubble.visible = false; } });
    fx.bubbles(cx, cy, 30);
    fx.sparkle(cx, cy, 30);
    fx.burst(cx, cy, { kind: 'star', n: 18, colors: [P.sun, P.butter, P.pink], speed: 340, size: 22, g: 200 });
    const m = this.moko;
    m.sleep = false;
    m.setMood('wow', 0.5);
    wait(0.15, () => { m.hop(7); m.setMood('happy', 1); });
    const play = () => {
      audio.sfx('bubble', { rate: 0.55, vol: 1 });
      audio.sparkle(0, 5, 0.5);
      wait(0.2, () => m.say('yay', 0.7));
    };
    if (audio.ctx && audio.ctx.state !== 'running') audio.ctx.resume().then(play).catch(() => {});
    else play();
    wait(0.85, () => go('hub', { intro: 1 }, { x: cx, y: cy }));
  }
};
