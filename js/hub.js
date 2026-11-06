// ============================================================================
// Little Wonder World — Interactive Wonder Island Hub & Surprise Egg Gacha
// Living sky, musical rainbow, dancing custom avatar, pet & 6 game portals
// ============================================================================

import { state, STICKER_CATALOG } from './state.js';
import { audio } from './audio.js';
import { fx } from './fx.js';
import { renderAvatarSVG, renderPetSVG } from './avatar.js';

export const GAME_PORTALS = [
  {
    id: 'dressup',
    title: 'Dress-Up',
    voice: "Princess Dress Up Salon!",
    emoji: '👗',
    badge: '👑',
    subEmoji: '🧚‍♀️',
    gradient: 'linear-gradient(145deg, #FF6B9D 0%, #FF4081 55%, #C51162 100%)',
    shadow: '#AD1457'
  },
  {
    id: 'sensory',
    title: 'Pop & Slime',
    voice: "Pop It and Stretchy Slime!",
    emoji: '🫧',
    badge: '🌈',
    subEmoji: '✨',
    gradient: 'linear-gradient(145deg, #00E5FF 0%, #00B0FF 55%, #2979FF 100%)',
    shadow: '#0D47A1'
  },
  {
    id: 'petspa',
    title: 'Pet Spa',
    voice: "Baby Pet Spa and Care!",
    emoji: '🦄',
    badge: '🛁',
    subEmoji: '🍓',
    gradient: 'linear-gradient(145deg, #EA80FC 0%, #AA00FF 55%, #7C4DFF 100%)',
    shadow: '#4A148C'
  },
  {
    id: 'adventure',
    title: 'Forest Quest',
    voice: "Enchanted Forest Treasure Quest!",
    emoji: '🗺️',
    badge: '🗝️',
    subEmoji: '🏰',
    gradient: 'linear-gradient(145deg, #69F0AE 0%, #00E676 55%, #00BFA5 100%)',
    shadow: '#00695C'
  },
  {
    id: 'bakery',
    title: 'Sweet Bakery',
    voice: "Sweet Treat Cake Bakery!",
    emoji: '🧁',
    badge: '🎂',
    subEmoji: '🕯️',
    gradient: 'linear-gradient(145deg, #FFB74D 0%, #FF8A65 55%, #FF5252 100%)',
    shadow: '#BF360C'
  },
  {
    id: 'magicart',
    title: 'Glow Paint',
    voice: "Magic Glow Paint and Music!",
    emoji: '🎨',
    badge: '🦋',
    subEmoji: '🎵',
    gradient: 'linear-gradient(145deg, #7C4DFF 0%, #536DFE 55%, #304FFE 100%)',
    shadow: '#1A237E'
  }
];

export class WonderHub {
  constructor(onSelectGame, onOpenEgg, onOpenStickers) {
    this.onSelectGame = onSelectGame;
    this.onOpenEgg = onOpenEgg;
    this.onOpenStickers = onOpenStickers;
    this.container = null;
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  render() {
    if (!this.container) return;
    const d = state.data;
    const skyMode = d.skyMode || 'day';
    const skyIcon = skyMode === 'day' ? '☀️' : skyMode === 'sunset' ? '🌅' : '🌙';
    const eggReady = (d.eggCharge || 0) >= 5 || d.stars >= 3;
    const unlockedCount = (d.stickers || []).length;

    this.container.innerHTML = `
      <div class="hub-world sky-${skyMode}">
        <!-- Interactive Living Sky & Musical Rainbow -->
        <div class="hub-sky-stage">
          <!-- Floating Clouds & Night Stars -->
          <div class="sky-clouds">
            <button class="sky-cloud cloud-1" aria-label="Fluffy Cloud">☁️</button>
            <button class="sky-cloud cloud-2" aria-label="Fluffy Cloud">☁️</button>
            ${skyMode === 'night' ? `
              <span class="night-star s1">✨</span>
              <span class="night-star s2">🌟</span>
              <span class="night-star s3">⭐</span>
              <span class="night-star s4">✨</span>
            ` : ''}
          </div>

          <!-- Interactive Sun / Moon Toggle -->
          <button class="sky-celestial-btn" id="hub-sky-btn" aria-label="Change Sky">
            <span class="celestial-emoji">${skyIcon}</span>
          </button>

          <!-- Musical Xylophone Rainbow -->
          <svg class="hub-rainbow-svg" id="hub-rainbow" viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg">
            <path data-note="0" class="rainbow-band" d="M 20 125 A 140 115 0 0 1 300 125" stroke="#FF5252" stroke-width="12" stroke-linecap="round" fill="none"/>
            <path data-note="2" class="rainbow-band" d="M 32 125 A 128 103 0 0 1 288 125" stroke="#FFD740" stroke-width="12" stroke-linecap="round" fill="none"/>
            <path data-note="4" class="rainbow-band" d="M 44 125 A 116 91 0 0 1 276 125" stroke="#69F0AE" stroke-width="12" stroke-linecap="round" fill="none"/>
            <path data-note="7" class="rainbow-band" d="M 56 125 A 104 79 0 0 1 264 125" stroke="#40C4FF" stroke-width="12" stroke-linecap="round" fill="none"/>
            <path data-note="9" class="rainbow-band" d="M 68 125 A 92 67 0 0 1 252 125" stroke="#EA80FC" stroke-width="12" stroke-linecap="round" fill="none"/>
          </svg>

          <!-- Island Meadow Hill with Player's Customized Character & Pet -->
          <div class="hub-meadow-hill"></div>

          <div class="hub-plaza-characters">
            <!-- Player's Customized Princess / Fairy -->
            <button class="hub-hero-avatar" id="hub-avatar-btn" aria-label="My Character">
              ${renderAvatarSVG(d.avatar)}
              <span class="avatar-edit-pill">👗✨</span>
            </button>

            <!-- Active Companion Pet -->
            <button class="hub-companion-pet" id="hub-pet-btn" aria-label="My Baby Pet">
              ${renderPetSVG(d.activePet || 'unicorn', { mood: 'happy' })}
            </button>
          </div>

          <!-- Surprise Egg & Sticker Book Floating Dock -->
          <div class="hub-treasure-row">
            <button class="hub-special-btn egg-pod-btn ${eggReady ? 'egg-ready-glow' : ''}" id="hub-egg-btn">
              <span class="special-icon egg-wobble">🥚</span>
              <div class="special-info">
                <span class="special-label">${eggReady ? 'TAP TO HATCH!' : 'Surprise Egg'}</span>
                <div class="egg-meter-bar">
                  <div class="egg-meter-fill" style="width: ${Math.min(100, ((d.eggCharge || 0) / 5) * 100)}%"></div>
                </div>
              </div>
              <span class="egg-sparkle-badge">✨</span>
            </button>

            <button class="hub-special-btn sticker-book-btn" id="hub-stickers-btn">
              <span class="special-icon">📖</span>
              <div class="special-info">
                <span class="special-label">Stickers</span>
                <span class="special-count">${unlockedCount} / ${STICKER_CATALOG.length} 🌟</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 6 Big Tactile Mini-Game Portals -->
        <div class="hub-portals-grid">
          ${GAME_PORTALS.map(p => `
            <button class="portal-card" data-game="${p.id}" style="background: ${p.gradient}; --card-shadow: ${p.shadow};">
              <div class="portal-badge-float">${p.badge}</div>
              <div class="portal-sub-float">${p.subEmoji}</div>
              <div class="portal-main-emoji">${p.emoji}</div>
              <div class="portal-title">${p.title}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.container) return;

    // 1. Sky Day/Sunset/Night Button
    const skyBtn = this.container.querySelector('#hub-sky-btn');
    if (skyBtn) {
      skyBtn.addEventListener('pointerdown', (e) => {
        const modes = ['day', 'sunset', 'night'];
        const next = modes[(modes.indexOf(state.data.skyMode || 'day') + 1) % modes.length];
        state.data.skyMode = next;
        state.save();
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 20);
        const phrases = { day: 'Sunny Day!', sunset: 'Golden Sunset!', night: 'Starry Magical Night!' };
        audio.speak(phrases[next], true);
        this.render();
      });
    }

    // 2. Fluffy Clouds
    this.container.querySelectorAll('.sky-cloud').forEach((cloud, idx) => {
      cloud.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        audio.playBubble();
        fx.bubbleBurst(e.clientX, e.clientY, 10);
        cloud.classList.remove('squish-bounce');
        void cloud.offsetWidth;
        cloud.classList.add('squish-bounce');
      });
    });

    // 3. Musical Rainbow Stripes
    this.container.querySelectorAll('.rainbow-band').forEach(band => {
      band.addEventListener('pointerdown', (e) => {
        const note = parseInt(band.getAttribute('data-note') || '0', 10);
        audio.playNote(note + 5, 0.5, 'triangle');
        fx.burstSparkles(e.clientX, e.clientY, 14);
      });
    });

    // 4. Hero Avatar on Plaza (Twirls & speaks or jumps to Dress-Up on double tap)
    const avatarBtn = this.container.querySelector('#hub-avatar-btn');
    if (avatarBtn) {
      avatarBtn.addEventListener('pointerdown', (e) => {
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 22);
        avatarBtn.classList.remove('avatar-twirl-anim');
        void avatarBtn.offsetWidth;
        avatarBtn.classList.add('avatar-twirl-anim');
        const lines = [
          "Hi! Let's play together!",
          "Sparkle magic power!",
          "Tap any game to start!",
          "I love my magical outfit!"
        ];
        audio.speak(lines[Math.floor(Math.random() * lines.length)]);
      });
    }

    // 5. Companion Pet on Plaza
    const petBtn = this.container.querySelector('#hub-pet-btn');
    if (petBtn) {
      petBtn.addEventListener('pointerdown', (e) => {
        audio.playPop(8);
        fx.heartBurst(e.clientX, e.clientY, 12);
        petBtn.classList.remove('squish-bounce');
        void petBtn.offsetWidth;
        petBtn.classList.add('squish-bounce');
        audio.speak("Cuddle pet loves you!");
      });
    }

    // 6. Surprise Egg Pod
    const eggBtn = this.container.querySelector('#hub-egg-btn');
    if (eggBtn) {
      eggBtn.addEventListener('pointerdown', (e) => {
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 18);
        if (this.onOpenEgg) this.onOpenEgg();
      });
    }

    // 7. Sticker Book Button
    const stickerBtn = this.container.querySelector('#hub-stickers-btn');
    if (stickerBtn) {
      stickerBtn.addEventListener('pointerdown', (e) => {
        audio.playTap(1.2);
        fx.burstSparkles(e.clientX, e.clientY, 14);
        if (this.onOpenStickers) this.onOpenStickers();
      });
    }

    // 8. 6 Game Portal Cards
    this.container.querySelectorAll('.portal-card').forEach(card => {
      card.addEventListener('pointerdown', (e) => {
        const gameId = card.getAttribute('data-game');
        const portal = GAME_PORTALS.find(p => p.id === gameId);
        audio.playTap(1.15);
        fx.burstSparkles(e.clientX, e.clientY, 20);
        if (portal) audio.speak(portal.voice, true);
        card.classList.add('portal-pressed');
        setTimeout(() => {
          if (this.onSelectGame) this.onSelectGame(gameId);
        }, 180);
      });
    });
  }
}
