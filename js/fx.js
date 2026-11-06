// ============================================================================
// Little Wonder World — Global Particle, Confetti & Reward Star FX Engine
// Renders 60fps sparkles, hearts, bubbles, confetti, and flying reward stars
// ============================================================================

import { audio } from './audio.js';

class WonderFX {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.running = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  init() {
    this.canvas = document.getElementById('fx-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  _startLoop() {
    if (this.running) return;
    this.running = true;
    const step = () => {
      if (!this.particles.length) {
        if (this.ctx && this.canvas) {
          this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
        this.running = false;
        return;
      }
      this._updateAndDraw();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  burstSparkles(x, y, count = 18, palette = ['#FFD700', '#FF6B9D', '#7C4DFF', '#00E5FF', '#FF9E80', '#FFFFFF']) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 6.5;
      this.particles.push({
        type: Math.random() > 0.3 ? 'star' : 'circle',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.14,
        size: 6 + Math.random() * 9,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: 0.018 + Math.random() * 0.015
      });
    }
    this._startLoop();
  }

  heartBurst(x, y, count = 10) {
    const colors = ['#FF4081', '#FF80AB', '#FF1744', '#F50057', '#FFB2FF'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
      const speed = 1.8 + Math.random() * 4.2;
      this.particles.push({
        type: 'heart',
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        gravity: -0.03, // Float upward gently!
        size: 10 + Math.random() * 10,
        rot: (Math.random() - 0.5) * 0.4,
        vRot: (Math.random() - 0.5) * 0.04,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.014 + Math.random() * 0.01
      });
    }
    this._startLoop();
  }

  bubbleBurst(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'bubble',
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -1.5 - Math.random() * 3,
        gravity: -0.02,
        size: 8 + Math.random() * 14,
        rot: 0,
        vRot: 0,
        color: '#E0F7FA',
        alpha: 0.9,
        decay: 0.014 + Math.random() * 0.01
      });
    }
    this._startLoop();
  }

  confettiShower(count = 75) {
    const colors = ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB', '#FF4081', '#FFFF00'];
    const w = window.innerWidth;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: i % 4 === 0 ? 'star' : 'confetti',
        x: Math.random() * w,
        y: -20 - Math.random() * 140,
        vx: (Math.random() - 0.5) * 4,
        vy: 2.5 + Math.random() * 4.5,
        gravity: 0.06,
        size: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.006 + Math.random() * 0.006
      });
    }
    this._startLoop();
  }

  // Spawns a glowing golden star that flies from (x, y) into the top Star Counter!
  flyStarToCounter(fromX, fromY, count = 1, onArrive = null) {
    const badge = document.getElementById('hud-star-pill');
    let targetX = window.innerWidth - 70;
    let targetY = 36;
    if (badge) {
      const rect = badge.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
    }

    this.burstSparkles(fromX, fromY, 16);

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'flying-reward-star';
        el.textContent = '⭐';
        el.style.left = `${fromX}px`;
        el.style.top = `${fromY}px`;
        document.body.appendChild(el);

        requestAnimationFrame(() => {
          el.style.transform = `translate(${targetX - fromX}px, ${targetY - fromY}px) scale(0.65) rotate(360deg)`;
          el.style.opacity = '0.9';
        });

        setTimeout(() => {
          el.remove();
          this.burstSparkles(targetX, targetY, 10, ['#FFD700', '#FFF59D', '#FF80AB']);
          audio.playNote(8 + i * 2, 0.35);
          if (badge) {
            badge.classList.remove('pulse-pop');
            void badge.offsetWidth;
            badge.classList.add('pulse-pop');
          }
          if (i === count - 1 && onArrive) onArrive();
        }, 620);
      }, i * 140);
    }
  }

  _updateAndDraw() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rot += p.vRot;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > window.innerHeight + 60) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.type === 'star') {
        this._drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45, p.color);
      } else if (p.type === 'heart') {
        this._drawHeart(ctx, 0, 0, p.size, p.color);
      } else if (p.type === 'bubble') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#80DEEA';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      } else if (p.type === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.6, -p.size * 0.3, p.size * 1.2, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  _drawStar(ctx, cx, cy, spikes, outerR, innerR, color) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  _drawHeart(ctx, x, y, size, color) {
    const s = size * 0.06;
    ctx.beginPath();
    ctx.moveTo(x, y + 3 * s);
    ctx.bezierCurveTo(x, y, x - 10 * s, y - 5 * s, x - 10 * s, y + 2 * s);
    ctx.bezierCurveTo(x - 10 * s, y + 8 * s, x, y + 12 * s, x, y + 16 * s);
    ctx.bezierCurveTo(x, y + 12 * s, x + 10 * s, y + 8 * s, x + 10 * s, y + 2 * s);
    ctx.bezierCurveTo(x + 10 * s, y - 5 * s, x, y, x, y + 3 * s);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

export const fx = new WonderFX();
