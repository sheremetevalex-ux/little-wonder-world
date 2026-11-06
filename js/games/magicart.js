// ============================================================================
// Game 6: Magic Glow Canvas & Musical Fireworks
// Neon Rainbow Brush, 4-Way Kaleidoscope Symmetry, Living Stamps & Pentatonic Harp
// ============================================================================

import { state } from '../state.js';
import { audio } from '../audio.js';
import { fx } from '../fx.js';

const BRUSH_MODES = [
  { id: 'rainbow',   icon: '🌈', label: 'Rainbow' },
  { id: 'symmetry',  icon: '🦋', label: 'Mirror' },
  { id: 'neon',      icon: '✨', label: 'Neon' },
  { id: 'stamp',     icon: '🦄', label: 'Stamps' }
];

const NEON_COLORS = [
  '#FF4081', '#FFD740', '#00E676', '#00E5FF', '#B388FF', '#FF6E40', '#FFFFFF'
];

const STAMPS = ['🦄', '🦋', '🌸', '⭐', '💖', '👑', '🌈', '🐬'];

const TEMPLATES = [
  { id: 'none',      icon: '🌌', name: 'Blank' },
  { id: 'butterfly', icon: '🦋', name: 'Butterfly' },
  { id: 'unicorn',   icon: '🦄', name: 'Unicorn' },
  { id: 'castle',    icon: '🏰', name: 'Castle' },
  { id: 'heart',     icon: '💖', name: 'Heart' }
];

export class MagicArtGame {
  constructor() {
    this.container = null;
    this.brushMode = 'symmetry'; // Start in magical 4-way mirror mode so first touch wows her!
    this.activeColor = '#FF4081';
    this.activeStamp = '🦋';
    this.template = 'none';
    this.darkBg = true;
    this.drawing = false;
    this.lastPt = null;
    this.hue = 0;
    this.strokeCount = 0;
    this.noteStep = 0;
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  unmount() {
    this.container = null;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="game-screen magicart-screen ${this.darkBg ? 'canvas-dark' : 'canvas-light'}">
        <!-- Top Brush Mode & Template Bar -->
        <div class="art-top-bar">
          <div class="brush-mode-pills">
            ${BRUSH_MODES.map(b => `
              <button class="brush-pill-btn ${this.brushMode === b.id ? 'active' : ''}" data-brush="${b.id}">
                <span>${b.icon}</span>
                <span>${b.label}</span>
              </button>
            `).join('')}
          </div>
          <div class="art-quick-actions">
            <button class="art-action-icon" id="btn-art-bg" aria-label="Toggle Day/Night Canvas">
              ${this.darkBg ? '☀️' : '🌙'}
            </button>
            <button class="art-action-icon" id="btn-art-celebrate" aria-label="Celebrate Artwork">
              📸
            </button>
            <button class="art-action-icon clear-btn" id="btn-art-clear" aria-label="Clear Canvas">
              🗑️
            </button>
          </div>
        </div>

        <!-- Center Interactive Drawing Canvas + Coloring Guide Overlay -->
        <div class="art-canvas-wrap" id="art-canvas-wrap">
          <canvas id="art-draw-canvas"></canvas>
          <div class="art-template-overlay" id="art-template-overlay">
            ${this._renderTemplateSVG()}
          </div>
        </div>

        <!-- Bottom Color Swatches / Stamps / Coloring Outlines -->
        <div class="art-bottom-tray">
          ${this.brushMode === 'stamp' ? `
            <div class="stamp-picker-row">
              ${STAMPS.map(st => `
                <button class="stamp-pick-btn ${this.activeStamp === st ? 'active' : ''}" data-stamp="${st}">
                  ${st}
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="art-color-row">
              ${NEON_COLORS.map(c => `
                <button class="art-color-swatch ${this.activeColor === c && this.brushMode === 'neon' ? 'active' : ''}"
                        data-color="${c}"
                        style="background: ${c}; box-shadow: 0 0 10px ${c};"></button>
              `).join('')}
            </div>
          `}

          <div class="template-picker-row">
            ${TEMPLATES.map(t => `
              <button class="template-pill-btn ${this.template === t.id ? 'active' : ''}" data-template="${t.id}" data-name="${t.name}">
                ${t.icon} ${t.name}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this._initCanvas();
    this._bindEvents();
  }

  _renderTemplateSVG() {
    const stroke = this.darkBg ? 'rgba(255,255,255,0.32)' : 'rgba(90,60,120,0.28)';
    switch (this.template) {
      case 'butterfly':
        return `
          <svg viewBox="0 0 300 300" class="template-guide-svg">
            <path d="M150,70 C80,10 15,65 45,140 C65,175 115,170 145,155 C90,175 55,235 95,265 C125,285 145,235 150,205 C155,235 175,285 205,265 C245,235 210,175 155,155 C185,170 235,175 255,140 C285,65 220,10 150,70 Z"
                  fill="none" stroke="${stroke}" stroke-width="5" stroke-dasharray="8 6"/>
            <line x1="150" y1="55" x2="150" y2="235" stroke="${stroke}" stroke-width="6" stroke-linecap="round"/>
          </svg>`;
      case 'unicorn':
        return `
          <svg viewBox="0 0 300 300" class="template-guide-svg">
            <circle cx="150" cy="165" r="78" fill="none" stroke="${stroke}" stroke-width="5" stroke-dasharray="8 6"/>
            <polygon points="135,90 150,20 165,90" fill="none" stroke="${stroke}" stroke-width="5"/>
            <circle cx="122" cy="152" r="12" fill="none" stroke="${stroke}" stroke-width="4"/>
            <circle cx="178" cy="152" r="12" fill="none" stroke="${stroke}" stroke-width="4"/>
            <path d="M125,195 Q150,215 175,195" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
          </svg>`;
      case 'castle':
        return `
          <svg viewBox="0 0 300 300" class="template-guide-svg">
            <rect x="75" y="130" width="150" height="130" rx="8" fill="none" stroke="${stroke}" stroke-width="5"/>
            <polygon points="65,130 100,65 135,130" fill="none" stroke="${stroke}" stroke-width="5"/>
            <polygon points="165,130 200,65 235,130" fill="none" stroke="${stroke}" stroke-width="5"/>
            <polygon points="120,130 150,40 180,130" fill="none" stroke="${stroke}" stroke-width="5"/>
            <path d="M125,260 L125,205 A25,25 0 0,1 175,205 L175,260" fill="none" stroke="${stroke}" stroke-width="5"/>
          </svg>`;
      case 'heart':
        return `
          <svg viewBox="0 0 300 300" class="template-guide-svg">
            <path d="M150,255 C150,255 45,180 45,105 C45,60 85,40 120,65 C138,78 150,98 150,98 C150,98 162,78 180,65 C215,40 255,60 255,105 C255,180 150,255 150,255 Z"
                  fill="none" stroke="${stroke}" stroke-width="6" stroke-dasharray="8 6"/>
          </svg>`;
      default:
        return '';
    }
  }

  _initCanvas() {
    const wrap = this.container.querySelector('#art-canvas-wrap');
    const canvas = this.container.querySelector('#art-draw-canvas');
    if (!wrap || !canvas) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(280, rect.width);
    const h = Math.max(260, rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.canvas = canvas;
    this.ctx = ctx;
    this.cw = w;
    this.ch = h;

    let lastMusicTime = 0;

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const stampAt = (x, y, clientX, clientY) => {
      ctx.save();
      ctx.font = '38px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FF80AB';
      ctx.shadowBlur = 12;
      ctx.fillText(this.activeStamp, x, y);
      if (this.brushMode === 'symmetry') {
        ctx.fillText(this.activeStamp, this.cw - x, y);
      }
      ctx.restore();
      audio.playNote((this.noteStep++) % 12 + 3, 0.35);
      fx.burstSparkles(clientX, clientY, 12);
    };

    const drawSegment = (p1, p2) => {
      this.hue = (this.hue + 5) % 360;
      const strokeColor = (this.brushMode === 'rainbow' || this.brushMode === 'symmetry')
        ? `hsl(${this.hue}, 95%, 62%)`
        : this.activeColor;

      const lineSegment = (ax, ay, bx, by) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 11;
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Bright inner core for magical neon look
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.restore();
      };

      lineSegment(p1.x, p1.y, p2.x, p2.y);

      if (this.brushMode === 'symmetry') {
        // 4-Way Kaleidoscope Butterfly Mirror!
        lineSegment(this.cw - p1.x, p1.y, this.cw - p2.x, p2.y);
        lineSegment(p1.x, this.ch - p1.y, p2.x, this.ch - p2.y);
        lineSegment(this.cw - p1.x, this.ch - p1.y, this.cw - p2.x, this.ch - p2.y);
      }

      const now = performance.now();
      if (now - lastMusicTime > 125) {
        lastMusicTime = now;
        const noteIdx = Math.floor((1 - p2.y / this.ch) * 10) + 2;
        audio.playNote(noteIdx, 0.35);
      }
    };

    canvas.addEventListener('pointerdown', (e) => {
      const pt = getPos(e);
      if (this.brushMode === 'stamp') {
        stampAt(pt.x, pt.y, e.clientX, e.clientY);
        return;
      }
      this.drawing = true;
      this.lastPt = pt;
      drawSegment(pt, { x: pt.x + 0.5, y: pt.y + 0.5 });
      fx.burstSparkles(e.clientX, e.clientY, 10);

      this.strokeCount++;
      if (this.strokeCount % 6 === 0) {
        state.addStars(1);
        fx.flyStarToCounter(e.clientX, e.clientY, 1);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.drawing || !this.lastPt) return;
      const pt = getPos(e);
      drawSegment(this.lastPt, pt);
      this.lastPt = pt;
    });

    window.addEventListener('pointerup', () => {
      this.drawing = false;
      this.lastPt = null;
    });
  }

  _bindEvents() {
    if (!this.container) return;

    // Brush Mode Pills
    this.container.querySelectorAll('.brush-pill-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        this.brushMode = btn.getAttribute('data-brush');
        audio.playTap(1.15);
        fx.burstSparkles(e.clientX, e.clientY, 14);
        const voices = {
          rainbow: "Rainbow Glow Brush!",
          symmetry: "Butterfly Mirror Magic!",
          neon: "Sparkle Neon Brush!",
          stamp: "Magic Stickers!"
        };
        audio.speak(voices[this.brushMode]);
        this.render();
      });
    });

    // Day/Night Canvas Toggle
    const bgBtn = this.container.querySelector('#btn-art-bg');
    if (bgBtn) {
      bgBtn.addEventListener('pointerdown', () => {
        this.darkBg = !this.darkBg;
        audio.playSparkle();
        this.render();
      });
    }

    // Celebrate / Camera Snapshot Button
    const celBtn = this.container.querySelector('#btn-art-celebrate');
    if (celBtn) {
      celBtn.addEventListener('pointerdown', (e) => {
        audio.playCameraShutter();
        audio.speak("What a masterpiece!", true);
        state.addStars(1);
        fx.confettiShower(65);
        fx.flyStarToCounter(e.clientX, e.clientY, 1);
      });
    }

    // Clear Canvas Button
    const clearBtn = this.container.querySelector('#btn-art-clear');
    if (clearBtn) {
      clearBtn.addEventListener('pointerdown', (e) => {
        if (this.ctx && this.canvas) {
          this.ctx.clearRect(0, 0, this.cw, this.ch);
        }
        audio.playBubble();
        fx.burstSparkles(e.clientX, e.clientY, 16);
      });
    }

    // Color Swatches
    this.container.querySelectorAll('.art-color-swatch').forEach(sw => {
      sw.addEventListener('pointerdown', (e) => {
        this.activeColor = sw.getAttribute('data-color');
        if (this.brushMode === 'rainbow') this.brushMode = 'neon';
        audio.playPop(6);
        fx.burstSparkles(e.clientX, e.clientY, 12);
        this.container.querySelectorAll('.art-color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      });
    });

    // Stamp Picker
    this.container.querySelectorAll('.stamp-pick-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        this.activeStamp = btn.getAttribute('data-stamp');
        audio.playPop(9);
        fx.burstSparkles(e.clientX, e.clientY, 12);
        this.container.querySelectorAll('.stamp-pick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Template Guide Picker
    this.container.querySelectorAll('.template-pill-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        this.template = btn.getAttribute('data-template');
        audio.playTap(1.1);
        audio.speak(btn.getAttribute('data-name'));
        const overlay = this.container.querySelector('#art-template-overlay');
        if (overlay) overlay.innerHTML = this._renderTemplateSVG();
        this.container.querySelectorAll('.template-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
}
