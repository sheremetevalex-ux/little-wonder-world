// Album: all the friends she has found (with mysterious shadows for the rest,
// so she can see that there are more to discover) and her saved pictures.
import { app, go, Btn, candy, haptic, hint } from '../core/engine.js';
import { audio, penta } from '../core/audio.js';
import { fx } from '../core/fx.js';
import { music } from '../core/music.js';
import { save } from '../core/save.js';
import { P, ell, rr, clamp, softStar, heart, rand, sprite } from '../core/draw.js';
import { softBack } from '../art/world.js';
import { drawCreature, FRIEND_IDS, FRIENDS, blinkAt } from '../art/creatures.js';

export const album = {
  tint: '#FFC7A8',

  enter() {
    this.t = 0;
    this.W = app.W;
    this.H = app.H;
    this.tab = save.data.photos.length && save.data.friends.length < 2 ? 'photos' : 'friends';
    this.scroll = 0;
    this.v = 0;
    this.drag = null;
    this.big = null;
    this.images = new Map();
    this.hops = new Map();
    music.play('pet');
    this.makeButtons();
  },

  resize() { this.W = app.W; this.H = app.H; this.makeButtons(); },

  makeButtons() {
    const y = Math.max(app.safeTop, 10) + 34;
    this.buttons = [
      new Btn({
        x: this.W / 2 - 40, y, r: 27, slop: 6,
        paint: (c, r) => {
          candy(c, r, P.pink, this.tab === 'friends');
          drawCreature(c, 'moko', { R: r * 0.56, t: this.t });
        },
        tap: () => { this.tab = 'friends'; this.scroll = 0; audio.note('marimba', 76, { vol: 0.6 }); }
      }),
      new Btn({
        x: this.W / 2 + 40, y, r: 27, slop: 6,
        paint: (c, r) => {
          candy(c, r, P.teal, this.tab === 'photos');
          c.fillStyle = '#fff';
          rr(c, -13, -14, 26, 28, 3);
          c.fill();
          c.fillStyle = P.sky;
          rr(c, -10, -11, 20, 16, 2);
          c.fill();
          heart(c, 0, -3, 5);
          c.fillStyle = P.rose;
          c.fill();
        },
        tap: () => { this.tab = 'photos'; this.scroll = 0; audio.note('marimba', 79, { vol: 0.6 }); }
      })
    ];
  },

  image(url) {
    let im = this.images.get(url);
    if (!im) {
      im = new Image();
      im.src = url;
      this.images.set(url, im);
    }
    return im;
  },

  grid() {
    const W = this.W;
    const friends = this.tab === 'friends';
    const cols = friends ? Math.max(4, Math.floor(W / 92)) : Math.max(2, Math.floor(W / 170));
    const gap = (W - 16) / cols;
    const top = Math.max(app.safeTop, 10) + 84;
    return { cols, gap, top, h: friends ? gap * 1.02 : gap * 1.24 };
  },

  maxScroll() {
    const g = this.grid();
    const n = this.tab === 'friends' ? FRIEND_IDS.length : save.data.photos.length;
    const rows = Math.ceil(n / g.cols);
    return Math.max(0, g.top + rows * g.h + 30 - this.H);
  },

  update(dt) {
    this.t += dt;
    if (!this.drag) {
      this.scroll += this.v * dt;
      this.v *= Math.pow(0.04, dt);
      const m = this.maxScroll();
      if (this.scroll < 0) this.scroll *= Math.pow(0.0005, dt);
      if (this.scroll > m) this.scroll = m + (this.scroll - m) * Math.pow(0.0005, dt);
    }
    for (const [k, v] of this.hops) {
      v.v += 1000 * dt;
      v.y += v.v * dt;
      if (v.y > 0) this.hops.delete(k);
    }
  },

  draw(c) {
    const W = this.W, H = this.H;
    const back = softBack('album', W, H, '#FFE7D2', '#FFD3DF', (x) => {
      x.fillStyle = 'rgba(255,255,255,.3)';
      for (let i = 0; i < 40; i++) {
        heart(x, (i * 97.3) % W, (i * 61.7) % H, 6 + (i % 4) * 2);
        x.fill();
      }
    });
    c.drawImage(back.cv, 0, 0, W, H);

    const g = this.grid(), friends = this.tab === 'friends';
    const owned = new Set(save.data.friends);
    c.save();
    c.beginPath();
    c.rect(0, g.top - 12, W, H);
    c.clip();
    if (friends) {
      FRIEND_IDS.forEach((id, i) => {
        const col = i % g.cols, row = Math.floor(i / g.cols);
        const x = 8 + g.gap * (col + 0.5), y = g.top + g.h * (row + 0.5) - this.scroll;
        if (y < -60 || y > H + 60) return;
        const has = owned.has(id);
        c.fillStyle = has ? 'rgba(255,255,255,.75)' : 'rgba(150,120,190,.22)';
        ell(c, x, y, g.gap * 0.46);
        c.fill();
        const hop = this.hops.get(id);
        c.save();
        c.translate(x, y - 2 + (hop ? hop.y : 0));
        if (has) {
          drawCreature(c, id, { R: g.gap * 0.26, t: this.t + i, blink: blinkAt(this.t, i), eyes: hop ? 'happy' : 'open', mouthOpen: hop ? 0.7 : 0 });
        } else {
          // Shadow: the shape is a riddle, and each egg might solve it
          const size = g.gap * 0.86;
          const sh = sprite('shadow:' + id + ':' + (size | 0), size, size, (x) => {
            x.translate(size / 2, size / 2);
            drawCreature(x, id, { R: g.gap * 0.26, t: 0, blink: 0 });
            x.setTransform(1, 0, 0, 1, 0, 0);
            x.globalCompositeOperation = 'source-in';
            x.fillStyle = '#8D78B5';
            x.fillRect(0, 0, x.canvas.width, x.canvas.height);
          });
          c.globalAlpha = 0.72;
          c.drawImage(sh.cv, -size / 2, -size / 2, size, size);
          c.globalAlpha = 1;
          softStar(c, 0, 0, 7 + Math.sin(this.t * 2 + i) * 1.2, 4, 0.42);
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.fill();
        }
        c.restore();
      });
    } else {
      const ph = save.data.photos;
      if (!ph.length) {
        // An empty frame, inviting the first picture
        c.save();
        c.translate(W / 2, H * 0.42);
        c.rotate(-0.05);
        c.fillStyle = '#fff';
        rr(c, -74, -92, 148, 182, 8);
        c.fill();
        c.fillStyle = '#FFE7F0';
        rr(c, -64, -82, 128, 128, 4);
        c.fill();
        softStar(c, 0, -18, 26);
        c.fillStyle = '#FFD45C';
        c.fill();
        c.restore();
      }
      ph.forEach((url, i) => {
        const col = i % g.cols, row = Math.floor(i / g.cols);
        const x = 8 + g.gap * (col + 0.5), y = g.top + g.h * (row + 0.5) - this.scroll;
        if (y < -160 || y > H + 160) return;
        const w = g.gap * 0.86, h = g.h * 0.9;
        c.save();
        c.translate(x, y);
        c.rotate(((i * 37) % 7 - 3) * 0.012);
        c.shadowColor = 'rgba(70,40,110,.3)';
        c.shadowBlur = 9;
        c.shadowOffsetY = 3;
        c.fillStyle = '#fff';
        rr(c, -w / 2, -h / 2, w, h, 6);
        c.fill();
        c.shadowColor = 'transparent';
        const im = this.image(url);
        if (im.complete && im.naturalWidth) c.drawImage(im, -w / 2 + 7, -h / 2 + 7, w - 14, h - 28);
        c.restore();
      });
    }
    c.restore();
    for (const b of this.buttons) b.draw(c);

    if (this.big) {
      c.fillStyle = 'rgba(40,20,80,.72)';
      c.fillRect(0, 0, W, H);
      const im = this.image(this.big);
      if (im.complete && im.naturalWidth) {
        const maxW = W * 0.86, maxH = H * 0.74, r = Math.min(maxW / im.naturalWidth, maxH / im.naturalHeight);
        const w = im.naturalWidth * r, h = im.naturalHeight * r;
        c.fillStyle = '#fff';
        rr(c, W / 2 - w / 2 - 12, H / 2 - h / 2 - 12, w + 24, h + 58, 10);
        c.fill();
        c.drawImage(im, W / 2 - w / 2, H / 2 - h / 2, w, h);
      }
    }
  },

  down(p) {
    if (this.big) {
      this.big = null;
      audio.sfx('tap');
      return;
    }
    this.drag = p;
    this.v = 0;
    p.s0 = this.scroll;
  },
  move(p) {
    if (this.drag !== p) return;
    const dy = p.y - p.py;
    this.scroll = p.s0 + (p.sy - p.y);
    this.v = -dy / Math.max(app.dt, 0.008);
  },
  up(p) {
    if (this.drag !== p) return;
    this.drag = null;
    if (p.moved > 14) return;
    this.v = 0;
    const g = this.grid(), friends = this.tab === 'friends';
    const col = Math.floor((p.x - 8) / g.gap), row = Math.floor((p.y - g.top + this.scroll) / g.h);
    if (col < 0 || col >= g.cols || row < 0) return;
    const i = col + row * g.cols;
    if (friends) {
      const id = FRIEND_IDS[i];
      if (!id) return;
      if (save.data.friends.includes(id)) {
        this.hops.set(id, { y: -1, v: -330 });
        audio.voice('giggle', FRIENDS[id].voice);
        fx.hearts(p.x, p.y - 20, 4);
        haptic();
      } else {
        audio.note('bell', penta(Math.floor(rand(3, 8))), { vol: 0.35 });
        fx.sparkle(p.x, p.y, 8);
      }
    } else {
      const url = save.data.photos[i];
      if (url) {
        this.big = url;
        audio.sparkle(2, 3, 0.3);
      }
    }
  }
};
