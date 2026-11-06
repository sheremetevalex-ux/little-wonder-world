// ============================================================================
// Game 4: Enchanted Forest Quest (4-Stage Adventure, Exploration & Challenges)
// Stage 1: Whispering Woods Hide-and-Seek (Find 5 Hidden Woodland Friends)
// Stage 2: Rainbow River Lily Pad Puzzle (Pattern & Symbol Matching Hops)
// Stage 3: Crystal Cave Treasure Chest (Find & Match 3 Shaped Magic Keys)
// Stage 4: Sky Balloon Flight to Rainbow Castle (Steer & Collect 10 Sky Stars)
// ============================================================================

import { state } from '../state.js';
import { audio } from '../audio.js';
import { fx } from '../fx.js';
import { renderAvatarSVG } from '../avatar.js';

const QUEST_STAGES = [
  { id: 0, icon: '🌲', title: 'Hide & Seek',   voice: "Find five hidden forest friends!" },
  { id: 1, icon: '🐸', title: 'Lily River',    voice: "Hop on the matching lily pad!" },
  { id: 2, icon: '🗝️', title: 'Treasure Keys', voice: "Match the three magic keys to open the chest!" },
  { id: 3, icon: '🎈', title: 'Sky Balloon',   voice: "Fly the balloon and catch ten rainbow stars!" }
];

export class AdventureGame {
  constructor() {
    this.container = null;
    this.stage = 0;
    this.rafId = null;

    // Stage 1 state (Hide & Seek)
    this.hidingSpots = [];
    this.foundFriends = [];

    // Stage 2 state (Lily Pads)
    this.riverStep = 0;
    this.riverTargets = [];
    this.riverOptions = [];

    // Stage 3 state (Treasure Chest Keys)
    this.locks = [];

    // Stage 4 state (Sky Balloon Flight)
    this.balloonX = 0.5;
    this.skyItems = [];
    this.skyScore = 0;
  }

  mount(container) {
    this.container = container;
    this._initStage(0);
  }

  unmount() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.container = null;
  }

  _initStage(stageIdx) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.stage = stageIdx % 4;
    const stObj = QUEST_STAGES[this.stage];
    audio.speak(stObj.voice);

    if (this.stage === 0) {
      const spots = [
        { cover: '🌳', label: 'Oak Tree' },
        { cover: '🍄', label: 'Giant Mushroom' },
        { cover: '🌿', label: 'Berry Bush' },
        { cover: '🌺', label: 'Flower Patch' },
        { cover: '🪨', label: 'Crystal Rock' },
        { cover: '🌊', label: 'Waterfall' }
      ];
      const friends = ['🦊', '🦉', '🐰', '🧚‍♀️', '🦄'];
      // Shuffle which 5 of the 6 spots hide a friend
      const indices = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
      this.hidingSpots = spots.map((s, i) => {
        const fIdx = indices.indexOf(i);
        return {
          ...s,
          friend: fIdx < 5 ? friends[fIdx] : null,
          revealed: false
        };
      });
      this.foundFriends = [];
    } else if (this.stage === 1) {
      const symbols = ['⭐', '💖', '🌸', '💎'];
      this.riverStep = 0;
      this.riverTargets = [];
      this.riverOptions = [];
      for (let r = 0; r < 4; r++) {
        const target = symbols[Math.floor(Math.random() * symbols.length)];
        this.riverTargets.push(target);
        const others = symbols.filter(s => s !== target).sort(() => Math.random() - 0.5).slice(0, 2);
        const rowOpts = [target, ...others].sort(() => Math.random() - 0.5);
        this.riverOptions.push(rowOpts);
      }
    } else if (this.stage === 2) {
      this.locks = [
        { id: 'heart', shape: '❤️', color: '#FF4081', name: 'Heart Key', unlocked: false },
        { id: 'star',  shape: '⭐', color: '#FFD700', name: 'Star Key',  unlocked: false },
        { id: 'moon',  shape: '🌙', color: '#00E5FF', name: 'Moon Key',  unlocked: false }
      ];
    } else if (this.stage === 3) {
      this.balloonX = 0.5;
      this.skyItems = [];
      this.skyScore = 0;
    }

    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="game-screen adventure-screen stage-bg-${this.stage}">
        <!-- Top Quest Map Progress Bar -->
        <div class="quest-map-bar">
          ${QUEST_STAGES.map((s, i) => `
            <button class="quest-node-btn ${i === this.stage ? 'active' : ''} ${i < this.stage ? 'done' : ''}" data-stage="${i}">
              <span class="q-node-icon">${s.icon}</span>
              <span class="q-node-label">${s.title}</span>
            </button>
          `).join('')}
        </div>

        <!-- Active Stage Playfield -->
        <div class="quest-playfield" id="quest-playfield">
          ${this.stage === 0 ? this._renderStage0() : ''}
          ${this.stage === 1 ? this._renderStage1() : ''}
          ${this.stage === 2 ? this._renderStage2() : ''}
          ${this.stage === 3 ? this._renderStage3() : ''}
        </div>
      </div>
    `;

    this._bindMapEvents();
    if (this.stage === 0) this._bindStage0();
    if (this.stage === 1) this._bindStage1();
    if (this.stage === 2) this._bindStage2();
    if (this.stage === 3) this._initStage3Balloon();
  }

  _bindMapEvents() {
    if (!this.container) return;
    this.container.querySelectorAll('.quest-node-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const idx = parseInt(btn.getAttribute('data-stage') || '0', 10);
        audio.playTap(1.2);
        fx.burstSparkles(e.clientX, e.clientY, 14);
        this._initStage(idx);
      });
    });
  }

  // ==========================================================================
  // STAGE 0: Whispering Woods Hide-and-Seek
  // ==========================================================================
  _renderStage0() {
    return `
      <div class="quest-stage-wrap hide-seek-stage">
        <div class="quest-banner-pill">
          🔍 Tap Wiggling Bushes to Find Friends! (${this.foundFriends.length} / 5)
        </div>

        <div class="forest-spots-grid">
          ${this.hidingSpots.map((spot, idx) => `
            <button class="hiding-spot-btn ${spot.friend && !spot.revealed ? 'has-friend-wiggle' : ''} ${spot.revealed ? 'spot-opened' : ''}"
                    data-spot="${idx}">
              ${spot.friend && !spot.revealed ? `<span class="peek-sparkle">✨</span>` : ''}
              <span class="spot-cover-emoji">${spot.cover}</span>
              ${spot.revealed ? `
                <span class="spot-friend-pop">${spot.friend || '🍃'}</span>
              ` : ''}
            </button>
          `).join('')}
        </div>

        <div class="found-party-dock">
          <div class="mini-hero-badge">${renderAvatarSVG(state.data.avatar)}</div>
          <div class="found-slots">
            ${[0, 1, 2, 3, 4].map(i => `
              <div class="found-slot ${this.foundFriends[i] ? 'filled' : ''}">
                ${this.foundFriends[i] || '❔'}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _bindStage0() {
    this.container.querySelectorAll('.hiding-spot-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const idx = parseInt(btn.getAttribute('data-spot') || '0', 10);
        const spot = this.hidingSpots[idx];
        if (!spot || spot.revealed) return;

        spot.revealed = true;
        if (spot.friend) {
          this.foundFriends.push(spot.friend);
          audio.playSparkle();
          fx.burstSparkles(e.clientX, e.clientY, 22);
          audio.speak("Found a friend!");

          if (this.foundFriends.length >= 5) {
            this.render();
            this._completeStageCelebration(e.clientX, e.clientY, "You found all the forest friends!");
            return;
          }
        } else {
          audio.playPop(3);
          fx.burstSparkles(e.clientX, e.clientY, 8);
          audio.speak("Just leaves! Try another bush!");
        }
        this.render();
      });
    });
  }

  // ==========================================================================
  // STAGE 1: Rainbow River Lily Pad Pattern Crossing
  // ==========================================================================
  _renderStage1() {
    const currentTarget = this.riverTargets[this.riverStep] || '⭐';
    const currentOptions = this.riverOptions[this.riverStep] || ['⭐', '💖', '🌸'];

    return `
      <div class="quest-stage-wrap river-stage">
        <!-- Frog Guide Clue Box -->
        <div class="frog-guide-card">
          <span class="frog-king-emoji">🐸👑</span>
          <div class="frog-clue-text">
            <span>Hop on the</span>
            <span class="clue-big-symbol">${currentTarget}</span>
            <span>Lily Pad! (${this.riverStep + 1}/4)</span>
          </div>
        </div>

        <!-- River Stream with 3 Big Lily Pad Buttons -->
        <div class="river-water-zone">
          <div class="lilypad-row">
            ${currentOptions.map(sym => `
              <button class="lilypad-btn" data-sym="${sym}">
                <span class="lily-leaf">🪷</span>
                <span class="lily-symbol">${sym}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Hero Avatar Stepping Stones Progress -->
        <div class="river-hero-track">
          ${[0, 1, 2, 3].map(step => `
            <div class="stone-step ${step < this.riverStep ? 'passed' : ''} ${step === this.riverStep ? 'current' : ''}">
              ${step === this.riverStep ? `<div class="river-mini-hero">${renderAvatarSVG(state.data.avatar)}</div>` : '🪨'}
            </div>
          `).join('')}
          <div class="stone-step goal-castle">🏰</div>
        </div>
      </div>
    `;
  }

  _bindStage1() {
    const target = this.riverTargets[this.riverStep];
    this.container.querySelectorAll('.lilypad-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const sym = btn.getAttribute('data-sym');
        if (sym === target) {
          audio.playPop(6 + this.riverStep * 2);
          fx.burstSparkles(e.clientX, e.clientY, 22);
          this.riverStep++;
          if (this.riverStep >= 4) {
            this._completeStageCelebration(e.clientX, e.clientY, "Hooray! You crossed the Rainbow River!");
          } else {
            audio.speak("Great hop!");
            this.render();
          }
        } else {
          // Gentle guidance: shake the pad & highlight the right one!
          audio.playSquish();
          btn.classList.add('shake-gentle');
          setTimeout(() => btn.classList.remove('shake-gentle'), 400);
          this.container.querySelectorAll('.lilypad-btn').forEach(b => {
            if (b.getAttribute('data-sym') === target) {
              b.classList.add('hint-glow');
            }
          });
        }
      });
    });
  }

  // ==========================================================================
  // STAGE 2: Crystal Cave Treasure Chest & 3 Magic Keys
  // ==========================================================================
  _renderStage2() {
    const allUnlocked = this.locks.every(l => l.unlocked);
    return `
      <div class="quest-stage-wrap chest-stage">
        <div class="quest-banner-pill">
          🗝️ Tap or Drag Each Magic Key to Its Matching Lock!
        </div>

        <!-- Giant Royal Treasure Chest -->
        <div class="treasure-chest-box ${allUnlocked ? 'chest-opened' : ''}" id="treasure-chest-box">
          <div class="chest-main-graphic">
            ${allUnlocked ? '👑💎🌈🏆💎👑' : '🧰'}
          </div>
          <div class="chest-locks-row">
            ${this.locks.map(l => `
              <div class="chest-lock-slot ${l.unlocked ? 'unlocked' : ''}" data-lock="${l.id}" style="--lock-color:${l.color};">
                <span class="lock-icon">${l.unlocked ? '🔓' : '🔒'}</span>
                <span class="lock-badge">${l.shape}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 3 Magic Keys to Tap or Drag -->
        <div class="magic-keys-row">
          ${this.locks.map(l => `
            <button class="magic-key-btn ${l.unlocked ? 'key-used' : ''}"
                    data-key-id="${l.id}"
                    style="--key-color:${l.color};"
                    ${l.unlocked ? 'disabled' : ''}>
              <span class="key-shape">${l.shape}</span>
              <span class="key-emoji">🗝️</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  _bindStage2() {
    const unlockById = (id, cx, cy) => {
      const lock = this.locks.find(l => l.id === id);
      if (!lock || lock.unlocked) return;
      lock.unlocked = true;
      audio.playSparkle();
      fx.burstSparkles(cx, cy, 24);
      audio.speak(lock.name + " unlocked!");
      this.render();

      if (this.locks.every(l => l.unlocked)) {
        this._completeStageCelebration(cx, cy, "The royal treasure chest is open!");
      }
    };

    this.container.querySelectorAll('.magic-key-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const keyId = btn.getAttribute('data-key-id');
        unlockById(keyId, e.clientX, e.clientY);
      });
    });
  }

  // ==========================================================================
  // STAGE 3: Sky Balloon Flight to the Cloud Castle
  // ==========================================================================
  _renderStage3() {
    return `
      <div class="quest-stage-wrap balloon-stage" id="balloon-stage">
        <div class="quest-banner-pill">
          🎈 Slide Finger to Catch 10 Sky Stars! (${this.skyScore} / 10 ⭐)
        </div>
        <canvas id="balloon-canvas"></canvas>
      </div>
    `;
  }

  _initStage3Balloon() {
    const wrap = this.container.querySelector('#balloon-stage');
    const canvas = this.container.querySelector('#balloon-canvas');
    if (!wrap || !canvas) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(280, rect.width);
    const h = Math.max(280, rect.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let targetX = w / 2;
    let balloonX = w / 2;
    const balloonY = h - 88;
    const goodies = ['⭐', '🌟', '🌈', '🧁', '💎', '💖'];

    const spawnSkyGoodie = (initial = false) => {
      this.skyItems.push({
        x: 36 + Math.random() * (w - 72),
        y: initial ? Math.random() * (h * 0.65) : -30 - Math.random() * 80,
        vy: 1.9 + Math.random() * 1.4,
        emoji: goodies[Math.floor(Math.random() * goodies.length)]
      });
    };

    this.skyItems = [];
    for (let i = 0; i < 6; i++) spawnSkyGoodie(true);

    const handleMove = (clientX) => {
      const r = canvas.getBoundingClientRect();
      targetX = Math.max(45, Math.min(w - 45, clientX - r.left));
    };

    canvas.addEventListener('pointerdown', (e) => handleMove(e.clientX));
    canvas.addEventListener('pointermove', (e) => handleMove(e.clientX));

    const loop = () => {
      if (this.stage !== 3 || !this.container) return;
      ctx.clearRect(0, 0, w, h);

      // Smoothly move balloon toward finger
      balloonX += (targetX - balloonX) * 0.16;

      // Draw decorative floating clouds
      ctx.font = '44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.45;
      ctx.fillText('☁️', w * 0.2, (performance.now() * 0.03) % h);
      ctx.fillText('☁️', w * 0.8, ((performance.now() * 0.025) + 180) % h);
      ctx.globalAlpha = 1;

      // Update & draw falling sky treasures
      ctx.font = '36px sans-serif';
      for (let i = this.skyItems.length - 1; i >= 0; i--) {
        const it = this.skyItems[i];
        it.y += it.vy;
        ctx.fillText(it.emoji, it.x, it.y);

        // Collision with Balloon Basket / Envelope
        if (Math.hypot(it.x - balloonX, it.y - (balloonY - 12)) < 54) {
          this.skyItems.splice(i, 1);
          this.skyScore++;
          audio.playNote(this.skyScore + 4, 0.35);
          const r = canvas.getBoundingClientRect();
          fx.burstSparkles(r.left + it.x, r.top + it.y, 14);

          const banner = this.container.querySelector('.quest-banner-pill');
          if (banner) {
            banner.textContent = `🎈 Slide Finger to Catch 10 Sky Stars! (${this.skyScore} / 10 ⭐)`;
          }

          if (this.skyScore >= 10) {
            state.data.questsCompleted = (state.data.questsCompleted || 0) + 1;
            this._completeStageCelebration(
              r.left + balloonX,
              r.top + balloonY,
              "You reached the Rainbow Cloud Castle! Quest Complete!"
            );
            return;
          }
          spawnSkyGoodie(false);
          continue;
        }

        if (it.y > h + 40) {
          this.skyItems.splice(i, 1);
          spawnSkyGoodie(false);
        }
      }

      // Draw Rainbow Hot-Air Balloon
      ctx.save();
      ctx.translate(balloonX, balloonY);
      // Basket ropes
      ctx.strokeStyle = '#8D6E63';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-14, -8); ctx.lineTo(-10, 18);
      ctx.moveTo(14, -8);  ctx.lineTo(10, 18);
      ctx.stroke();
      // Basket
      ctx.fillStyle = '#FFB74D';
      ctx.strokeStyle = '#E65100';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-18, 16, 36, 24, 6);
      ctx.fill();
      ctx.stroke();
      // Balloon Envelope
      const bg = ctx.createRadialGradient(-10, -38, 6, 0, -28, 36);
      bg.addColorStop(0, '#FFF59D');
      bg.addColorStop(0.45, '#FF80AB');
      bg.addColorStop(1, '#7C4DFF');
      ctx.beginPath();
      ctx.arc(0, -28, 34, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.font = '24px sans-serif';
      ctx.fillText('👑', 0, -28);
      ctx.restore();

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  _completeStageCelebration(cx, cy, message) {
    audio.playFanfare();
    audio.speak(message, true);
    state.addStars(2);
    fx.confettiShower(75);
    fx.flyStarToCounter(cx || window.innerWidth / 2, cy || window.innerHeight / 2, 2);

    setTimeout(() => {
      if (!this.container) return;
      this._initStage((this.stage + 1) % 4);
    }, 2100);
  }
}
