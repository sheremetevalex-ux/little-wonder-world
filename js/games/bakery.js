// ============================================================================
// Game 5: Sweet Treat Bakery & Cake Decorator
// Phase 1: Mix Ingredients in the Magic Bowl
// Phase 2: Frost & Decorate Cakes, Cupcakes & Donuts with Toppings & Candles
// Phase 3: Light & Blow Out Birthday Candles + Eat Cake Bite-by-Bite!
// ============================================================================

import { state } from '../state.js';
import { audio } from '../audio.js';
import { fx } from '../fx.js';

const BASES = [
  { id: 'cake',    icon: '🎂', name: 'Party Cake' },
  { id: 'cupcake', icon: '🧁', name: 'Giant Cupcake' },
  { id: 'donut',   icon: '🍩', name: 'Magic Donut' }
];

const FROSTINGS = [
  { id: '#FF80AB', drip: '#F50057', name: 'Strawberry Pink' },
  { id: '#80D8FF', drip: '#0091EA', name: 'Blueberry Sky' },
  { id: '#EA80FC', drip: '#AA00FF', name: 'Unicorn Grape' },
  { id: '#FFE57F', drip: '#FFB300', name: 'Lemon Sunshine' },
  { id: '#A7FFEB', drip: '#00BFA5', name: 'Mint Vanilla' },
  { id: '#8D6E63', drip: '#4E342E', name: 'Choco Fudge' }
];

const TOPPINGS = [
  { emoji: '🍓', name: 'Strawberry' },
  { emoji: '🍒', name: 'Sweet Cherry' },
  { emoji: '🕯️', name: 'Birthday Candle', isCandle: true },
  { emoji: '🦄', name: 'Unicorn Topper' },
  { emoji: '🌸', name: 'Sugar Flower' },
  { emoji: '🍪', name: 'Cookie Crunch' },
  { emoji: '🌈', name: 'Rainbow Arc' },
  { emoji: '💖', name: 'Candy Heart' }
];

export class BakeryGame {
  constructor() {
    this.container = null;
    this.phase = 'decorate'; // Start right in decorate or switch to 'mix' / 'party' anytime!
    this.baseType = 'cake';
    this.spongeColor = '#FFE0B2';
    this.frosting = FROSTINGS[0];
    this.activeTopping = TOPPINGS[0];
    this.placedToppings = [
      { emoji: '🍓', x: 92,  y: 94 },
      { emoji: '🍓', x: 188, y: 94 },
      { emoji: '🕯️', x: 140, y: 58, isCandle: true }
    ];
    this.candlesLit = true;
    this.bitesTaken = 0;

    // Mixing phase state
    this.mixedSet = new Set();
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
      <div class="game-screen bakery-screen phase-${this.phase}">
        <!-- Top Bakery Phase Switcher -->
        <div class="bakery-phase-tabs">
          <button class="bakery-tab ${this.phase === 'mix' ? 'active' : ''}" data-phase="mix">
            <span>🥣</span> <span>1. Mix</span>
          </button>
          <button class="bakery-tab ${this.phase === 'decorate' ? 'active' : ''}" data-phase="decorate">
            <span>🎂</span> <span>2. Decorate</span>
          </button>
          <button class="bakery-tab ${this.phase === 'party' ? 'active' : ''}" data-phase="party">
            <span>🎉</span> <span>3. Party & Eat!</span>
          </button>
        </div>

        <!-- Main Bakery Stage -->
        <div class="bakery-stage-wrap">
          ${this.phase === 'mix' ? this._renderMixPhase() : ''}
          ${this.phase === 'decorate' ? this._renderDecoratePhase() : ''}
          ${this.phase === 'party' ? this._renderPartyPhase() : ''}
        </div>
      </div>
    `;

    this._bindCommonEvents();
    if (this.phase === 'mix') this._bindMixEvents();
    if (this.phase === 'decorate') this._bindDecorateEvents();
    if (this.phase === 'party') this._bindPartyEvents();
  }

  _renderMixPhase() {
    const ingredients = [
      { id: 'egg',   emoji: '🥚', name: 'Crack Egg' },
      { id: 'milk',  emoji: '🥛', name: 'Rainbow Milk' },
      { id: 'sugar', emoji: '🍓', name: 'Berry Sugar' },
      { id: 'flour', emoji: '🌾', name: 'Magic Flour' }
    ];
    const progress = this.mixedSet.size;

    return `
      <div class="bakery-mix-area">
        <div class="quest-banner-pill">
          🥣 Tap Ingredients to Mix Magic Batter! (${progress} / 4)
        </div>

        <div class="ingredients-row">
          ${ingredients.map(ing => `
            <button class="ingredient-btn ${this.mixedSet.has(ing.id) ? 'added' : ''}" data-ing="${ing.id}" data-name="${ing.name}">
              <span class="ing-emoji">${ing.emoji}</span>
              <span class="ing-label">${ing.name}</span>
            </button>
          `).join('')}
        </div>

        <button class="magic-mixing-bowl" id="mixing-bowl-btn">
          <div class="bowl-batter-fill" style="height: ${20 + progress * 20}%; background: ${this.frosting.id};"></div>
          <span class="bowl-spoon-icon">🥄</span>
          <span class="bowl-caption">${progress >= 4 ? '✨ Bake Now! ✨' : 'Stir the Bowl!'}</span>
        </button>
      </div>
    `;
  }

  _renderCakeSVG() {
    const f = this.frosting;
    if (this.bitesTaken >= 4) {
      return `
        <svg viewBox="0 0 280 260" class="cake-svg">
          <ellipse cx="140" cy="220" rx="110" ry="22" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="4"/>
          <text x="140" y="150" text-anchor="middle" font-size="52">😋⭐</text>
          <text x="140" y="195" text-anchor="middle" font-size="20" fill="#AD1457" font-weight="bold">All Eaten! Yum!</text>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 280 260" class="cake-svg" id="cake-interactive-svg">
        <defs>
          <clipPath id="biteClip">
            <rect x="0" y="${this.bitesTaken * 48}" width="280" height="260"/>
          </clipPath>
        </defs>

        <!-- Cake Stand / Plate -->
        <path d="M110,220 L170,220 L185,246 L95,246 Z" fill="#F8BBD0"/>
        <ellipse cx="140" cy="218" rx="112" ry="20" fill="#FFFFFF" stroke="#F48FB1" stroke-width="4"/>

        <g clip-path="url(#biteClip)">
          ${this.baseType === 'cake' ? `
            <!-- Bottom Tier Sponge & Frosting -->
            <rect x="48" y="142" width="184" height="74" rx="18" fill="${this.spongeColor}" stroke="#FFB74D" stroke-width="3"/>
            <path d="M46,142 Q46,126 64,126 L216,126 Q234,126 234,142 L234,162 Q218,176 202,160 Q186,176 170,160 Q154,176 138,160 Q122,176 106,160 Q90,176 74,160 Q58,176 46,162 Z" fill="${f.id}" stroke="${f.drip}" stroke-width="2.5"/>

            <!-- Top Tier Sponge & Frosting -->
            <rect x="76" y="84" width="128" height="58" rx="14" fill="${this.spongeColor}" stroke="#FFB74D" stroke-width="3"/>
            <path d="M74,84 Q74,70 90,70 L190,70 Q206,70 206,84 L206,102 Q190,115 174,100 Q158,115 140,100 Q122,115 106,100 Q90,115 74,102 Z" fill="${f.id}" stroke="${f.drip}" stroke-width="2.5"/>
          ` : this.baseType === 'cupcake' ? `
            <!-- Cupcake Liner -->
            <polygon points="74,138 206,138 184,218 96,218" fill="#FF80AB" stroke="#C51162" stroke-width="3"/>
            <line x1="104" y1="138" x2="112" y2="218" stroke="#F8BBD0" stroke-width="3"/>
            <line x1="140" y1="138" x2="140" y2="218" stroke="#F8BBD0" stroke-width="3"/>
            <line x1="176" y1="138" x2="168" y2="218" stroke="#F8BBD0" stroke-width="3"/>
            <!-- Giant Swirl Frosting -->
            <ellipse cx="140" cy="132" rx="74" ry="26" fill="${f.id}" stroke="${f.drip}" stroke-width="2.5"/>
            <ellipse cx="140" cy="106" rx="56" ry="22" fill="${f.id}" stroke="${f.drip}" stroke-width="2.5"/>
            <ellipse cx="140" cy="84" rx="36" ry="18" fill="${f.id}" stroke="${f.drip}" stroke-width="2.5"/>
          ` : `
            <!-- Giant Unicorn Donut -->
            <ellipse cx="140" cy="152" rx="92" ry="62" fill="${this.spongeColor}" stroke="#FFB74D" stroke-width="4"/>
            <ellipse cx="140" cy="146" rx="84" ry="52" fill="${f.id}" stroke="${f.drip}" stroke-width="3"/>
            <ellipse cx="140" cy="150" rx="28" ry="18" fill="#FFF8E1" stroke="${f.drip}" stroke-width="3"/>
          `}

          <!-- Placed Toppings & Birthday Candles -->
          ${this.placedToppings.map(t => `
            <g transform="translate(${t.x}, ${t.y})">
              ${t.isCandle && this.candlesLit ? `
                <ellipse cx="0" cy="-22" rx="7" ry="12" fill="#FFD700" class="candle-flame-anim"/>
                <circle cx="0" cy="-20" r="4" fill="#FFFFFF"/>
              ` : ''}
              <text x="0" y="8" text-anchor="middle" font-size="32">${t.emoji}</text>
            </g>
          `).join('')}
        </g>
      </svg>
    `;
  }

  _renderDecoratePhase() {
    return `
      <div class="bakery-decorate-area">
        <!-- Base & Clear Row -->
        <div class="bakery-top-controls">
          <div class="base-shape-pills">
            ${BASES.map(b => `
              <button class="base-pill-btn ${this.baseType === b.id ? 'active' : ''}" data-base="${b.id}" data-name="${b.name}">
                ${b.icon} ${b.name.split(' ')[1]}
              </button>
            `).join('')}
          </div>
          <button class="clear-cake-btn" id="btn-clear-cake" aria-label="Reset Toppings">🔄</button>
        </div>

        <!-- Center Interactive Cake Canvas (Tap anywhere on cake to add toppings!) -->
        <div class="cake-stage-box" id="cake-stage-box">
          ${this._renderCakeSVG()}
          <div class="cake-tap-hint">👆 Tap Frosting or Toppings to Decorate!</div>
        </div>

        <!-- Bottom Frosting & Toppings Selector -->
        <div class="bakery-palette-sheet">
          <div class="frosting-swatch-row">
            ${FROSTINGS.map((f, idx) => `
              <button class="frosting-swatch ${this.frosting.id === f.id ? 'active' : ''}"
                      data-fidx="${idx}"
                      style="background: ${f.id}; border-color: ${f.drip};"></button>
            `).join('')}
          </div>

          <div class="toppings-scroll-row">
            ${TOPPINGS.map((t, idx) => `
              <button class="topping-pick-btn ${this.activeTopping.emoji === t.emoji ? 'active' : ''}"
                      data-tidx="${idx}">
                <span class="top-emoji">${t.emoji}</span>
                <span class="top-name">${t.name.split(' ')[0]}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderPartyPhase() {
    return `
      <div class="bakery-party-area">
        <div class="party-banner">
          ${this.candlesLit
            ? '🕯️ Make a Wish & Blow Out the Candles!'
            : this.bitesTaken < 4
              ? '😋 Tap the Cake to Eat It!'
              : '🎉 Delicious! Bake Another Treat!'}
        </div>

        <div class="cake-stage-box party-cake-box" id="party-cake-box">
          ${this._renderCakeSVG()}
        </div>

        <div class="party-actions-row">
          ${this.candlesLit ? `
            <button class="party-action-btn blow-btn" id="btn-blow-candles">
              💨 Blow Out Candles! 🕯️
            </button>
          ` : this.bitesTaken < 4 ? `
            <button class="party-action-btn eat-btn" id="btn-eat-bite">
              😋 Take a Big Bite! 🍰
            </button>
          ` : `
            <button class="party-action-btn bake-again-btn" id="btn-bake-again">
              🧁 Bake Another Cake! ✨
            </button>
          `}
        </div>
      </div>
    `;
  }

  _bindCommonEvents() {
    if (!this.container) return;
    this.container.querySelectorAll('.bakery-tab').forEach(tab => {
      tab.addEventListener('pointerdown', (e) => {
        const nextPhase = tab.getAttribute('data-phase');
        this.phase = nextPhase;
        if (nextPhase === 'party') {
          this.bitesTaken = 0;
          this.candlesLit = true;
          // Ensure at least one candle is on the cake for the party!
          if (!this.placedToppings.some(t => t.isCandle)) {
            this.placedToppings.push({ emoji: '🕯️', x: 140, y: 58, isCandle: true });
          }
          audio.playFanfare();
          audio.speak("Happy Birthday party! Blow out the candles!");
        } else {
          audio.playTap(1.15);
        }
        fx.burstSparkles(e.clientX, e.clientY, 16);
        this.render();
      });
    });
  }

  _bindMixEvents() {
    this.container.querySelectorAll('.ingredient-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const id = btn.getAttribute('data-ing');
        const name = btn.getAttribute('data-name');
        this.mixedSet.add(id);
        audio.playPop(this.mixedSet.size * 2);
        if (name) audio.speak(name);
        fx.burstSparkles(e.clientX, e.clientY, 18);
        this.render();
      });
    });

    const bowl = this.container.querySelector('#mixing-bowl-btn');
    if (bowl) {
      bowl.addEventListener('pointerdown', (e) => {
        audio.playBubble();
        fx.burstSparkles(e.clientX, e.clientY, 22);
        if (this.mixedSet.size >= 4) {
          audio.playFanfare();
          audio.speak("Fresh cake is baked! Let's decorate!");
          state.addStars(1);
          fx.flyStarToCounter(e.clientX, e.clientY, 1);
          this.mixedSet.clear();
          this.phase = 'decorate';
          this.render();
        } else {
          const all = ['egg', 'milk', 'sugar', 'flour'];
          const next = all.find(x => !this.mixedSet.has(x));
          if (next) this.mixedSet.add(next);
          audio.speak("Stirring the magic batter!");
          this.render();
        }
      });
    }
  }

  _bindDecorateEvents() {
    // Base selector
    this.container.querySelectorAll('.base-pill-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        this.baseType = btn.getAttribute('data-base');
        this.bitesTaken = 0;
        audio.playPop(5);
        audio.speak(btn.getAttribute('data-name'));
        fx.burstSparkles(e.clientX, e.clientY, 16);
        this.render();
      });
    });

    // Clear toppings button
    const clearBtn = this.container.querySelector('#btn-clear-cake');
    if (clearBtn) {
      clearBtn.addEventListener('pointerdown', () => {
        this.placedToppings = [];
        this.bitesTaken = 0;
        audio.playBubble();
        this.render();
      });
    }

    // Frosting Swatches
    this.container.querySelectorAll('.frosting-swatch').forEach(sw => {
      sw.addEventListener('pointerdown', (e) => {
        const idx = parseInt(sw.getAttribute('data-fidx') || '0', 10);
        this.frosting = FROSTINGS[idx] || FROSTINGS[0];
        audio.playSquish();
        audio.speak(this.frosting.name);
        fx.burstSparkles(e.clientX, e.clientY, 18);
        this.render();
      });
    });

    // Topping Buttons: Tapping adds one right onto the cake AND sets active topping!
    this.container.querySelectorAll('.topping-pick-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const idx = parseInt(btn.getAttribute('data-tidx') || '0', 10);
        const top = TOPPINGS[idx] || TOPPINGS[0];
        this.activeTopping = top;
        const randX = 76 + Math.random() * 128;
        const randY = top.isCandle ? (55 + Math.random() * 25) : (85 + Math.random() * 95);
        this.placedToppings.push({
          emoji: top.emoji,
          x: Math.round(randX),
          y: Math.round(randY),
          isCandle: !!top.isCandle
        });
        if (this.placedToppings.length > 22) this.placedToppings.shift();
        audio.playPop(idx + 3);
        audio.speak(top.name);
        fx.burstSparkles(e.clientX, e.clientY, 16);
        this.render();
      });
    });

    // Tap directly anywhere on the Cake SVG to stamp the active topping at that exact spot!
    const cakeSvg = this.container.querySelector('#cake-interactive-svg');
    if (cakeSvg) {
      cakeSvg.addEventListener('pointerdown', (e) => {
        const r = cakeSvg.getBoundingClientRect();
        const svgX = ((e.clientX - r.left) / r.width) * 280;
        const svgY = ((e.clientY - r.top) / r.height) * 260;
        this.placedToppings.push({
          emoji: this.activeTopping.emoji,
          x: Math.round(Math.max(55, Math.min(225, svgX))),
          y: Math.round(Math.max(45, Math.min(195, svgY))),
          isCandle: !!this.activeTopping.isCandle
        });
        audio.playPop(8);
        fx.burstSparkles(e.clientX, e.clientY, 16);
        this.render();
      });
    }
  }

  _bindPartyEvents() {
    const blowAction = (cx, cy) => {
      if (!this.candlesLit) return;
      this.candlesLit = false;
      audio.playFanfare();
      audio.speak("Hooray! Wish come true! Now tap the cake to eat it!");
      state.addStars(2);
      fx.confettiShower(75);
      fx.flyStarToCounter(cx, cy, 2);
      this.render();
    };

    const eatAction = (cx, cy) => {
      if (this.bitesTaken >= 4) return;
      this.bitesTaken++;
      audio.playMunch();
      fx.burstSparkles(cx, cy, 18);
      if (this.bitesTaken >= 4) {
        audio.playFanfare();
        audio.speak("Yum yum! All gone!");
        state.addStars(1);
        fx.flyStarToCounter(cx, cy, 1);
      } else {
        audio.speak("Chomp! Yummy!");
      }
      this.render();
    };

    const blowBtn = this.container.querySelector('#btn-blow-candles');
    if (blowBtn) {
      blowBtn.addEventListener('pointerdown', (e) => blowAction(e.clientX, e.clientY));
    }

    const eatBtn = this.container.querySelector('#btn-eat-bite');
    if (eatBtn) {
      eatBtn.addEventListener('pointerdown', (e) => eatAction(e.clientX, e.clientY));
    }

    const partyBox = this.container.querySelector('#party-cake-box');
    if (partyBox) {
      partyBox.addEventListener('pointerdown', (e) => {
        if (this.candlesLit) {
          blowAction(e.clientX, e.clientY);
        } else if (this.bitesTaken < 4) {
          eatAction(e.clientX, e.clientY);
        }
      });
    }

    const againBtn = this.container.querySelector('#btn-bake-again');
    if (againBtn) {
      againBtn.addEventListener('pointerdown', (e) => {
        this.bitesTaken = 0;
        this.candlesLit = true;
        this.phase = 'decorate';
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 18);
        this.render();
      });
    }
  }
}
