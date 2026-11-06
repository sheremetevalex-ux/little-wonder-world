// ============================================================================
// Game 2: Sensory Pop & Slime Lab (3-in-1 Anti-Stress Tactile Toybox)
// 1. Multi-Shape Silicone Pop-It (Slide-to-pop, 3D Flip & Hidden Golden Bug)
// 2. Stretchy Galaxy Slime Mixer (Spring-mesh physics, ASMR squish & charms)
// 3. Musical Soap Bubble & Balloon Pop
// ============================================================================

import { state } from '../state.js';
import { audio } from '../audio.js';
import { fx } from '../fx.js';

const POPIT_SHAPES = [
  { id: 'heart',     icon: '💖', name: 'Heart Pop-It',     rows: [4, 6, 6, 5, 3, 1] },
  { id: 'unicorn',   icon: '🦄', name: 'Unicorn Pop-It',   rows: [3, 5, 6, 6, 5, 4] },
  { id: 'star',      icon: '⭐', name: 'Star Pop-It',      rows: [2, 5, 6, 5, 4, 2] },
  { id: 'butterfly', icon: '🦋', name: 'Butterfly Pop-It', rows: [6, 6, 4, 6, 6, 4] },
  { id: 'icecream',  icon: '🍦', name: 'Sundae Pop-It',    rows: [4, 6, 6, 4, 3, 2] }
];

const ROW_COLORS = [
  { bg: '#FF5252', rim: '#D50000', lit: '#FF8A80' },
  { bg: '#FFB300', rim: '#FF6F00', lit: '#FFE57F' },
  { bg: '#00E676', rim: '#00C853', lit: '#B9F6CA' },
  { bg: '#00B0FF', rim: '#0091EA', lit: '#80D8FF' },
  { bg: '#AA00FF', rim: '#6200EA', lit: '#EA80FC' },
  { bg: '#FF4081', rim: '#C51162', lit: '#FF80AB' }
];

const SLIME_THEMES = [
  { id: 'pink',   name: 'Cotton Candy', main: '#FF80AB', mid: '#FF4081', rim: '#C51162', glow: '#FCE4EC' },
  { id: 'mint',   name: 'Mermaid Mint', main: '#69F0AE', mid: '#00E676', rim: '#00BFA5', glow: '#E0F2F1' },
  { id: 'galaxy', name: 'Galaxy Berry', main: '#B388FF', mid: '#7C4DFF', rim: '#311B92', glow: '#EDE7F6' },
  { id: 'gold',   name: 'Honey Gold',   main: '#FFE57F', mid: '#FFD740', rim: '#FF8F00', glow: '#FFF8E1' },
  { id: 'aqua',   name: 'Ocean Lagoon', main: '#84FFFF', mid: '#00E5FF', rim: '#0097A7', glow: '#E0F7FA' }
];

const SLIME_CHARMS = ['⭐', '💖', '🍓', '👀', '💎', '🦄', '🦋', '🌈'];

export class SensoryGame {
  constructor() {
    this.container = null;
    this.mode = 'popit'; // 'popit' | 'slime' | 'bubbles'
    this.shapeIdx = 0;
    this.poppedSet = new Set();
    this.totalBubbles = 0;
    this.secretIndex = 3;
    this.isPointerDown = false;
    this.rafId = null;

    // Slime state
    this.slimeTheme = SLIME_THEMES[0];
    this.slimeNodes = [];
    this.slimeCharms = [];
    this.slimeRipples = [];
    this.slimePointer = { active: false, x: 0, y: 0 };

    // Floating bubbles state
    this.floatBubbles = [];
    this.bubblesPoppedCount = 0;
  }

  mount(container) {
    this.container = container;
    this._resetPopBoard();
    this.render();
  }

  unmount() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.container = null;
  }

  _resetPopBoard() {
    this.poppedSet.clear();
    const shape = POPIT_SHAPES[this.shapeIdx];
    this.totalBubbles = shape.rows.reduce((a, b) => a + b, 0);
    this.secretIndex = Math.floor(Math.random() * this.totalBubbles);
  }

  render() {
    if (!this.container) return;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.container.innerHTML = `
      <div class="game-screen sensory-screen">
        <!-- Top Mode Switcher Tabs -->
        <div class="sensory-mode-tabs">
          <button class="sensory-tab ${this.mode === 'popit' ? 'active' : ''}" data-mode="popit">
            <span class="s-tab-emoji">🫧</span>
            <span class="s-tab-label">Pop-It</span>
          </button>
          <button class="sensory-tab ${this.mode === 'slime' ? 'active' : ''}" data-mode="slime">
            <span class="s-tab-emoji">🧪</span>
            <span class="s-tab-label">Slime</span>
          </button>
          <button class="sensory-tab ${this.mode === 'bubbles' ? 'active' : ''}" data-mode="bubbles">
            <span class="s-tab-emoji">🎈</span>
            <span class="s-tab-label">Bubbles</span>
          </button>
        </div>

        <!-- Active Sensory Toy Stage -->
        <div class="sensory-stage-wrap" id="sensory-stage-wrap">
          ${this.mode === 'popit' ? this._renderPopItHTML() : ''}
          ${this.mode === 'slime' ? this._renderSlimeHTML() : ''}
          ${this.mode === 'bubbles' ? this._renderBubblesHTML() : ''}
        </div>
      </div>
    `;

    this._bindCommonEvents();
    if (this.mode === 'popit') this._bindPopItEvents();
    if (this.mode === 'slime') this._initSlimeCanvas();
    if (this.mode === 'bubbles') this._initBubblesCanvas();
  }

  _renderPopItHTML() {
    const shape = POPIT_SHAPES[this.shapeIdx];
    let bubbleCounter = 0;

    return `
      <div class="popit-play-area">
        <div class="popit-board-frame shape-${shape.id}" id="popit-board">
          ${shape.rows.map((count, rIdx) => {
            const c = ROW_COLORS[rIdx % ROW_COLORS.length];
            const rowHTML = [];
            for (let b = 0; b < count; b++) {
              const idx = bubbleCounter++;
              const isPopped = this.poppedSet.has(idx);
              const isSecret = idx === this.secretIndex;
              rowHTML.push(`
                <button class="popit-bubble ${isPopped ? 'popped' : ''}"
                        data-bidx="${idx}"
                        style="--b-bg:${c.bg}; --b-rim:${c.rim}; --b-lit:${c.lit};"
                        aria-label="Pop Bubble">
                  <span class="bubble-gloss"></span>
                  ${isSecret ? `<span class="secret-bug ${isPopped ? 'revealed' : ''}">🐞</span>` : ''}
                </button>
              `);
            }
            return `<div class="popit-row" style="--row-color:${c.bg};">${rowHTML.join('')}</div>`;
          }).join('')}
        </div>

        <!-- Bottom Shape Selector & Flip Button -->
        <div class="popit-bottom-bar">
          <div class="popit-shape-picker">
            ${POPIT_SHAPES.map((s, idx) => `
              <button class="shape-pick-btn ${idx === this.shapeIdx ? 'active' : ''}" data-shape-idx="${idx}">
                ${s.icon}
              </button>
            `).join('')}
          </div>
          <button class="flip-board-btn" id="btn-flip-popit">
            🔄 Flip!
          </button>
        </div>
      </div>
    `;
  }

  _renderSlimeHTML() {
    return `
      <div class="slime-play-area">
        <div class="slime-canvas-box" id="slime-canvas-box">
          <canvas id="slime-canvas"></canvas>
          <div class="slime-hint-pill">👆 Poke, Stretch & Swirl!</div>
        </div>
        <div class="slime-controls-tray">
          <div class="slime-color-row">
            ${SLIME_THEMES.map(t => `
              <button class="slime-color-btn ${this.slimeTheme.id === t.id ? 'active' : ''}"
                      data-slime-theme="${t.id}"
                      style="background: linear-gradient(135deg, ${t.main}, ${t.mid});"></button>
            `).join('')}
          </div>
          <div class="slime-charms-row">
            ${SLIME_CHARMS.map(ch => `
              <button class="slime-charm-btn" data-charm="${ch}">${ch}</button>
            `).join('')}
            <button class="slime-charm-btn clear-charms-btn" id="btn-clear-charms">🧼</button>
          </div>
        </div>
      </div>
    `;
  }

  _renderBubblesHTML() {
    return `
      <div class="bubbles-play-area" id="bubbles-play-area">
        <canvas id="bubbles-canvas"></canvas>
        <div class="bubbles-bottom-bar">
          <button class="bubble-wand-btn" id="btn-mega-bubbles">
            🪄 Blow Giant Bubbles! 🫧
          </button>
        </div>
      </div>
    `;
  }

  _bindCommonEvents() {
    if (!this.container) return;
    this.container.querySelectorAll('.sensory-tab').forEach(tab => {
      tab.addEventListener('pointerdown', (e) => {
        const nextMode = tab.getAttribute('data-mode');
        if (nextMode === this.mode) return;
        this.mode = nextMode;
        audio.playTap(1.2);
        fx.burstSparkles(e.clientX, e.clientY, 15);
        const voices = {
          popit: "Rainbow Pop It!",
          slime: "Stretchy Magic Slime!",
          bubbles: "Pop the Bubbles!"
        };
        audio.speak(voices[nextMode]);
        this.render();
      });
    });
  }

  _bindPopItEvents() {
    const board = this.container.querySelector('#popit-board');
    if (!board) return;

    const popBubbleEl = (btn, clientX, clientY) => {
      if (!btn || btn.classList.contains('popped')) return;
      const idx = parseInt(btn.getAttribute('data-bidx') || '0', 10);
      this.poppedSet.add(idx);
      btn.classList.add('popped');
      audio.playPop();

      const rect = btn.getBoundingClientRect();
      const cx = clientX || (rect.left + rect.width / 2);
      const cy = clientY || (rect.top + rect.height / 2);
      fx.burstSparkles(cx, cy, 8);

      // Secret Golden Ladybug surprise!
      if (idx === this.secretIndex) {
        audio.playSparkle();
        audio.speak("You found the lucky bug!");
        state.addStars(1);
        fx.flyStarToCounter(cx, cy, 1);
      }

      // Check if entire board is popped!
      if (this.poppedSet.size >= this.totalBubbles) {
        audio.playFanfare();
        audio.speak("All popped! Flip the board!");
        state.addStars(1);
        fx.confettiShower(55);
        fx.flyStarToCounter(window.innerWidth / 2, window.innerHeight / 2, 1);
        setTimeout(() => this._flipBoard(), 650);
      }
    };

    // Support both direct tap AND sliding finger across bubbles!
    board.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      const btn = e.target.closest('.popit-bubble');
      if (btn) popBubbleEl(btn, e.clientX, e.clientY);
    });

    board.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const btn = el.closest('.popit-bubble');
        if (btn) popBubbleEl(btn, e.clientX, e.clientY);
      }
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    }, { once: false });

    // Shape Picker buttons
    this.container.querySelectorAll('.shape-pick-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        this.shapeIdx = parseInt(btn.getAttribute('data-shape-idx') || '0', 10);
        this._resetPopBoard();
        audio.playSparkle();
        audio.speak(POPIT_SHAPES[this.shapeIdx].name);
        fx.burstSparkles(e.clientX, e.clientY, 16);
        this.render();
      });
    });

    // Manual Flip Button
    const flipBtn = this.container.querySelector('#btn-flip-popit');
    if (flipBtn) {
      flipBtn.addEventListener('pointerdown', () => {
        audio.playSparkle();
        this._flipBoard();
      });
    }
  }

  _flipBoard() {
    if (!this.container) return;
    const board = this.container.querySelector('#popit-board');
    if (board) {
      board.classList.add('flipping');
      setTimeout(() => {
        this._resetPopBoard();
        this.render();
      }, 320);
    }
  }

  // ==========================================================================
  // Mode 2: Interactive Stretchy Slime Physics Canvas
  // ==========================================================================
  _initSlimeCanvas() {
    const box = this.container.querySelector('#slime-canvas-box');
    const canvas = this.container.querySelector('#slime-canvas');
    if (!box || !canvas) return;

    const rect = box.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(280, rect.width);
    const h = Math.max(260, rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = Math.min(w, h) * 0.37;
    const numNodes = 28;

    this.slimeNodes = [];
    for (let i = 0; i < numNodes; i++) {
      const angle = (Math.PI * 2 * i) / numNodes;
      const hx = cx + Math.cos(angle) * baseRadius;
      const hy = cy + Math.sin(angle) * baseRadius;
      this.slimeNodes.push({ x: hx, y: hy, hx, hy, vx: 0, vy: 0 });
    }

    if (this.slimeCharms.length === 0) {
      for (let i = 0; i < 6; i++) {
        this.slimeCharms.push({
          emoji: SLIME_CHARMS[i % SLIME_CHARMS.length],
          x: cx + (Math.random() - 0.5) * baseRadius * 1.1,
          y: cy + (Math.random() - 0.5) * baseRadius * 1.1,
          vx: 0,
          vy: 0,
          rot: (Math.random() - 0.5) * 0.8
        });
      }
    }

    let lastSoundTime = 0;
    const pokeSlime = (px, py, isDrag = false) => {
      const now = performance.now();
      if (now - lastSoundTime > (isDrag ? 160 : 60)) {
        lastSoundTime = now;
        Math.random() > 0.35 ? audio.playSquish() : audio.playBubble();
      }

      this.slimeRipples.push({ x: px, y: py, r: 6, maxR: 58, alpha: 0.85 });

      // Pull nearby slime boundary nodes & swirl embedded charms
      this.slimeNodes.forEach(n => {
        const dx = px - n.x;
        const dy = py - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          const force = (1 - dist / 130) * 9.5;
          n.vx += (dx / (dist || 1)) * force;
          n.vy += (dy / (dist || 1)) * force;
        }
      });

      this.slimeCharms.forEach(c => {
        const dx = px - c.x;
        const dy = py - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          c.vx += (dx / (dist || 1)) * 3.2 + (Math.random() - 0.5) * 2;
          c.vy += (dy / (dist || 1)) * 3.2 + (Math.random() - 0.5) * 2;
          c.rot += (Math.random() - 0.5) * 0.25;
        }
      });
    };

    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      this.slimePointer = { active: true, x: px, y: py };
      pokeSlime(px, py, false);
      fx.burstSparkles(e.clientX, e.clientY, 10);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.slimePointer.active) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      this.slimePointer.x = px;
      this.slimePointer.y = py;
      pokeSlime(px, py, true);
    });

    window.addEventListener('pointerup', () => {
      this.slimePointer.active = false;
    });

    // Slime Color Swatches
    this.container.querySelectorAll('[data-slime-theme]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const id = btn.getAttribute('data-slime-theme');
        const found = SLIME_THEMES.find(t => t.id === id);
        if (found) {
          this.slimeTheme = found;
          audio.playSparkle();
          audio.speak(found.name + ' slime!');
          fx.burstSparkles(e.clientX, e.clientY, 16);
          this.container.querySelectorAll('[data-slime-theme]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // Add Mix-In Charms
    this.container.querySelectorAll('[data-charm]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const ch = btn.getAttribute('data-charm');
        audio.playPop(7);
        fx.burstSparkles(e.clientX, e.clientY, 14);
        for (let i = 0; i < 3; i++) {
          this.slimeCharms.push({
            emoji: ch,
            x: cx + (Math.random() - 0.5) * baseRadius * 1.1,
            y: cy + (Math.random() - 0.5) * baseRadius * 1.1,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            rot: (Math.random() - 0.5) * 0.9
          });
        }
        if (this.slimeCharms.length > 24) {
          this.slimeCharms.splice(0, 3);
        }
      });
    });

    const clearBtn = this.container.querySelector('#btn-clear-charms');
    if (clearBtn) {
      clearBtn.addEventListener('pointerdown', () => {
        this.slimeCharms = [];
        audio.playBubble();
      });
    }

    const animateSlime = () => {
      if (this.mode !== 'slime' || !this.container) return;
      ctx.clearRect(0, 0, w, h);

      const t = performance.now() * 0.003;
      // Update nodes spring physics
      this.slimeNodes.forEach((n, i) => {
        const wobbleX = Math.cos(t + i * 0.5) * 3.5;
        const wobbleY = Math.sin(t + i * 0.5) * 3.5;
        const ax = (n.hx + wobbleX - n.x) * 0.085;
        const ay = (n.hy + wobbleY - n.y) * 0.085;
        n.vx = (n.vx + ax) * 0.84;
        n.vy = (n.vy + ay) * 0.84;
        n.x += n.vx;
        n.y += n.vy;
      });

      // Draw glossy slime blob with smooth quadratic curves
      const th = this.slimeTheme;
      const grad = ctx.createRadialGradient(cx - baseRadius * 0.28, cy - baseRadius * 0.28, 12, cx, cy, baseRadius * 1.25);
      grad.addColorStop(0, th.glow);
      grad.addColorStop(0.35, th.main);
      grad.addColorStop(0.85, th.mid);
      grad.addColorStop(1, th.rim);

      ctx.save();
      ctx.beginPath();
      const nodes = this.slimeNodes;
      const len = nodes.length;
      const startMidX = (nodes[0].x + nodes[len - 1].x) / 2;
      const startMidY = (nodes[0].y + nodes[len - 1].y) / 2;
      ctx.moveTo(startMidX, startMidY);

      for (let i = 0; i < len; i++) {
        const curr = nodes[i];
        const next = nodes[(i + 1) % len];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.shadowColor = th.rim;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.stroke();
      ctx.restore();

      // Glossy top-left specular highlight
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx - baseRadius * 0.34, cy - baseRadius * 0.36, baseRadius * 0.28, baseRadius * 0.13, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fill();
      ctx.restore();

      // Draw ripples inside slime
      for (let i = this.slimeRipples.length - 1; i >= 0; i--) {
        const rp = this.slimeRipples[i];
        rp.r += 2.4;
        rp.alpha -= 0.028;
        if (rp.alpha <= 0) {
          this.slimeRipples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rp.alpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // Update & draw embedded charms
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.slimeCharms.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.vx *= 0.9;
        c.vy *= 0.9;
        const distFromCenter = Math.hypot(c.x - cx, c.y - cy);
        if (distFromCenter > baseRadius * 0.72) {
          const angle = Math.atan2(c.y - cy, c.x - cx);
          c.x = cx + Math.cos(angle) * baseRadius * 0.72;
          c.y = cy + Math.sin(angle) * baseRadius * 0.72;
          c.vx *= -0.5;
          c.vy *= -0.5;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.fillText(c.emoji, 0, 0);
        ctx.restore();
      });

      this.rafId = requestAnimationFrame(animateSlime);
    };

    this.rafId = requestAnimationFrame(animateSlime);
  }

  // ==========================================================================
  // Mode 3: Floating Musical Soap Bubbles & Animal Balloons
  // ==========================================================================
  _initBubblesCanvas() {
    const area = this.container.querySelector('#bubbles-play-area');
    const canvas = this.container.querySelector('#bubbles-canvas');
    if (!area || !canvas) return;

    const rect = area.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(280, rect.width);
    const h = Math.max(280, rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const emojis = ['🦄', '🦋', '🍓', '👑', '🌈', '⭐', '🐱', '🍦', '💖', '🐬'];
    const colors = ['#FF80AB', '#84FFFF', '#B388FF', '#FFD54F', '#69F0AE', '#FF8A65'];

    const spawnBubble = (fromBottom = true) => {
      const r = 26 + Math.random() * 26;
      this.floatBubbles.push({
        x: r + Math.random() * (w - r * 2),
        y: fromBottom ? h + r + Math.random() * 60 : Math.random() * h,
        r,
        vy: -(1.1 + Math.random() * 1.6),
        wobblePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        prize: emojis[Math.floor(Math.random() * emojis.length)]
      });
    };

    this.floatBubbles = [];
    for (let i = 0; i < 11; i++) spawnBubble(false);

    const checkPopAt = (px, py, clientX, clientY) => {
      for (let i = this.floatBubbles.length - 1; i >= 0; i--) {
        const b = this.floatBubbles[i];
        if (Math.hypot(px - b.x, py - b.y) <= b.r + 12) {
          this.floatBubbles.splice(i, 1);
          this.bubblesPoppedCount++;
          audio.playPop(this.bubblesPoppedCount % 12);
          fx.burstSparkles(clientX, clientY, 16);

          if (this.bubblesPoppedCount % 10 === 0) {
            state.addStars(1);
            fx.flyStarToCounter(clientX, clientY, 1);
          }

          spawnBubble(true);
          break;
        }
      }
    };

    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.isPointerDown = true;
      checkPopAt(e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const r = canvas.getBoundingClientRect();
      checkPopAt(e.clientX - r.left, e.clientY - r.top, e.clientX, e.clientY);
    });

    const megaBtn = this.container.querySelector('#btn-mega-bubbles');
    if (megaBtn) {
      megaBtn.addEventListener('pointerdown', (e) => {
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 20);
        for (let i = 0; i < 6; i++) spawnBubble(true);
      });
    }

    const animateBubbles = () => {
      if (this.mode !== 'bubbles' || !this.container) return;
      ctx.clearRect(0, 0, w, h);

      while (this.floatBubbles.length < 11) {
        spawnBubble(true);
      }

      this.floatBubbles.forEach(b => {
        b.y += b.vy;
        b.wobblePhase += 0.04;
        b.x += Math.sin(b.wobblePhase) * 0.8;

        if (b.y < -b.r - 20) {
          b.y = h + b.r + 10;
          b.x = b.r + Math.random() * (w - b.r * 2);
        }

        // Draw iridescent bubble sphere
        ctx.save();
        const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 4, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(255,255,255,0.85)');
        g.addColorStop(0.55, b.color + '55');
        g.addColorStop(1, b.color + 'CC');

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Prize icon inside bubble
        ctx.font = `${Math.round(b.r * 0.85)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.prize, b.x, b.y + 2);

        // Specular shine dot
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
        ctx.restore();
      });

      this.rafId = requestAnimationFrame(animateBubbles);
    };

    this.rafId = requestAnimationFrame(animateBubbles);
  }
}
