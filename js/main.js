// ============================================================================
// Little Wonder World — Main App Router, HUD, Surprise Egg Hatcher & Album
// ============================================================================

import { state, STICKER_CATALOG } from './state.js';
import { audio } from './audio.js';
import { fx } from './fx.js';
import { WonderHub } from './hub.js';
import { DressUpGame } from './games/dressup.js';
import { SensoryGame } from './games/sensory.js';
import { PetSpaGame } from './games/petspa.js';
import { AdventureGame } from './games/adventure.js';
import { BakeryGame } from './games/bakery.js';
import { MagicArtGame } from './games/magicart.js';

class LittleWonderWorldApp {
  constructor() {
    this.currentView = 'hub';
    this.activeInstance = null;
    this.stageEl = null;
    this.modalEl = null;

    this.games = {
      dressup:   () => new DressUpGame(),
      sensory:   () => new SensoryGame(),
      petspa:    () => new PetSpaGame(),
      adventure: () => new AdventureGame(),
      bakery:    () => new BakeryGame(),
      magicart:  () => new MagicArtGame()
    };
  }

  init() {
    fx.init();
    this.stageEl = document.getElementById('app-stage');
    this.modalEl = document.getElementById('app-modal-root');

    audio.setMuted(!!state.data.muted);
    this._bindHeaderHUD();

    state.subscribe(() => {
      this._updateHUD();
    });

    this.navigateTo('hub');
    this._registerServiceWorker();
  }

  _bindHeaderHUD() {
    const homeBtn = document.getElementById('hud-home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('pointerdown', (e) => {
        audio.playTap(1.1);
        fx.burstSparkles(e.clientX, e.clientY, 16);
        audio.speak("Wonder Island!");
        this.navigateTo('hub');
      });
    }

    const starPill = document.getElementById('hud-star-pill');
    if (starPill) {
      starPill.addEventListener('pointerdown', (e) => {
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 18);
        this.openEggModal();
      });
    }

    const soundBtn = document.getElementById('hud-sound-btn');
    if (soundBtn) {
      soundBtn.addEventListener('pointerdown', (e) => {
        const muted = audio.toggleMute();
        state.data.muted = muted;
        state.save();
        fx.burstSparkles(e.clientX, e.clientY, 12);
        this._updateHUD();
      });
    }
  }

  _updateHUD() {
    const d = state.data;
    const starCountEl = document.getElementById('hud-star-count');
    if (starCountEl) starCountEl.textContent = d.stars;

    const soundBtn = document.getElementById('hud-sound-btn');
    if (soundBtn) soundBtn.textContent = d.muted ? '🔇' : '🔊';

    const homeBtn = document.getElementById('hud-home-btn');
    const titleBanner = document.getElementById('hud-title-banner');
    if (homeBtn && titleBanner) {
      if (this.currentView === 'hub') {
        homeBtn.classList.add('hidden');
        titleBanner.classList.remove('hidden');
      } else {
        homeBtn.classList.remove('hidden');
        titleBanner.classList.add('hidden');
      }
    }
  }

  navigateTo(view) {
    if (this.activeInstance && typeof this.activeInstance.unmount === 'function') {
      this.activeInstance.unmount();
    }

    this.currentView = view;
    this._updateHUD();

    if (!this.stageEl) return;
    this.stageEl.innerHTML = '';

    if (view === 'hub') {
      this.activeInstance = new WonderHub(
        (gameId) => this.navigateTo(gameId),
        () => this.openEggModal(),
        () => this.openStickerModal()
      );
      this.activeInstance.mount(this.stageEl);
    } else if (this.games[view]) {
      this.activeInstance = this.games[view]();
      this.activeInstance.mount(this.stageEl);
    }
  }

  // ==========================================================================
  // Surprise Wonder Egg Hatching Modal (3-Tap Interactive Crack & Reveal!)
  // ==========================================================================
  openEggModal() {
    if (!this.modalEl) return;
    let taps = 0;
    audio.speak("Tap the magic egg three times to hatch your surprise!");

    const renderModal = () => {
      this.modalEl.innerHTML = `
        <div class="wonder-modal-backdrop" id="egg-modal-backdrop">
          <div class="wonder-modal-card egg-hatch-card">
            <button class="modal-close-btn" id="btn-close-modal" aria-label="Close">✖️</button>
            <div class="modal-title-pill">✨ Surprise Wonder Egg ✨</div>

            <div class="egg-stage-center" id="egg-tap-zone">
              <div class="giant-wonder-egg crack-stage-${taps}" id="giant-egg-el">
                <span class="egg-graphic">🥚</span>
                ${taps >= 1 ? `<span class="egg-crack-mark c1">⚡</span>` : ''}
                ${taps >= 2 ? `<span class="egg-crack-mark c2">✨</span>` : ''}
              </div>
              <div class="egg-tap-prompt">
                👆 Tap Egg to Hatch! (${taps} / 3)
              </div>
            </div>
          </div>
        </div>
      `;

      const closeBtn = this.modalEl.querySelector('#btn-close-modal');
      if (closeBtn) {
        closeBtn.addEventListener('pointerdown', () => this.closeModal());
      }

      const eggZone = this.modalEl.querySelector('#egg-tap-zone');
      if (eggZone) {
        eggZone.addEventListener('pointerdown', (e) => {
          taps++;
          audio.playNote(taps * 3 + 4, 0.35);
          fx.burstSparkles(e.clientX, e.clientY, 24);

          if (taps < 3) {
            renderModal();
            const eggEl = this.modalEl.querySelector('#giant-egg-el');
            if (eggEl) {
              eggEl.classList.add('egg-shake-hard');
            }
          } else {
            this._revealHatchedSticker();
          }
        });
      }
    };

    renderModal();
  }

  _revealHatchedSticker() {
    if (!this.modalEl) return;
    const { sticker, isNew } = state.unlockRandomSticker();
    audio.playFanfare();
    fx.confettiShower(85);
    audio.speak(`Hooray! You hatched ${sticker.name}!`, true);

    this.modalEl.innerHTML = `
      <div class="wonder-modal-backdrop">
        <div class="wonder-modal-card egg-reveal-card">
          <div class="modal-title-pill">${isNew ? '🌟 NEW STICKER! 🌟' : '💖 MAGIC STICKER! 💖'}</div>

          <div class="hatched-prize-badge" style="background: ${sticker.bg};">
            <span class="prize-big-emoji">${sticker.emoji}</span>
          </div>

          <div class="prize-name-title">${sticker.name}</div>

          <div class="modal-btn-row">
            <button class="modal-primary-btn" id="btn-view-album">
              📖 Open Sticker Book
            </button>
            <button class="modal-secondary-btn" id="btn-yay-done">
              ✨ Yay!
            </button>
          </div>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#btn-view-album')?.addEventListener('pointerdown', () => {
      audio.playTap(1.1);
      this.openStickerModal();
    });

    this.modalEl.querySelector('#btn-yay-done')?.addEventListener('pointerdown', () => {
      audio.playTap(1.1);
      this.closeModal();
      if (this.currentView === 'hub' && this.activeInstance) {
        this.activeInstance.render();
      }
    });
  }

  // ==========================================================================
  // Collectible Wonder Sticker Album Modal (24 Magical Stickers)
  // ==========================================================================
  openStickerModal() {
    if (!this.modalEl) return;
    const unlocked = new Set(state.data.stickers || []);
    audio.speak("Your magical sticker treasure book!");

    this.modalEl.innerHTML = `
      <div class="wonder-modal-backdrop">
        <div class="wonder-modal-card sticker-album-card">
          <div class="album-header-row">
            <div class="modal-title-pill">📖 Sticker Book (${unlocked.size}/${STICKER_CATALOG.length})</div>
            <button class="modal-close-btn" id="btn-close-album">✖️</button>
          </div>

          <div class="sticker-album-grid">
            ${STICKER_CATALOG.map(st => {
              const has = unlocked.has(st.id);
              return `
                <button class="sticker-slot-card ${has ? 'unlocked' : 'locked'}"
                        data-st-id="${st.id}"
                        data-st-name="${st.name}"
                        data-unlocked="${has}"
                        style="${has ? `background: ${st.bg};` : ''}">
                  <span class="st-slot-emoji">${has ? st.emoji : '❔'}</span>
                  <span class="st-slot-name">${has ? st.name.split(' ')[1] || st.name : 'Mystery'}</span>
                </button>
              `;
            }).join('')}
          </div>

          <div class="album-footer-row">
            <button class="modal-primary-btn" id="btn-hatch-from-album">
              🥚 Hatch Another Egg! ✨
            </button>
          </div>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#btn-close-album')?.addEventListener('pointerdown', () => {
      audio.playTap(1.0);
      this.closeModal();
    });

    this.modalEl.querySelector('#btn-hatch-from-album')?.addEventListener('pointerdown', () => {
      audio.playSparkle();
      this.openEggModal();
    });

    this.modalEl.querySelectorAll('.sticker-slot-card').forEach(card => {
      card.addEventListener('pointerdown', (e) => {
        const isUnlocked = card.getAttribute('data-unlocked') === 'true';
        const name = card.getAttribute('data-st-name');
        if (isUnlocked) {
          audio.playSparkle();
          fx.burstSparkles(e.clientX, e.clientY, 18);
          audio.speak(name, true);
          card.classList.remove('squish-bounce');
          void card.offsetWidth;
          card.classList.add('squish-bounce');
        } else {
          audio.playPop(4);
          audio.speak("Hatch surprise eggs to find this sticker!");
        }
      });
    });
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.innerHTML = '';
    }
    if (this.currentView === 'hub' && this.activeInstance) {
      this.activeInstance.render();
    }
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new LittleWonderWorldApp();
  app.init();
});
