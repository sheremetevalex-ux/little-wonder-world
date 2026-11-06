// ============================================================================
// Game 1: Princess & Fairy Dress-Up Studio
// 7 Wardrobe Categories, Color Swatches, Stage Switcher, Runway Dance & Lookbook
// ============================================================================

import { state } from '../state.js';
import { audio } from '../audio.js';
import { fx } from '../fx.js';
import { AVATAR_CATALOG, renderAvatarSVG } from '../avatar.js';

const TABS = [
  { id: 'dresses',  icon: '👗', label: 'Dresses' },
  { id: 'hair',     icon: '💇‍♀️', label: 'Hair' },
  { id: 'hats',     icon: '👑', label: 'Crowns' },
  { id: 'wings',    icon: '🦋', label: 'Wings' },
  { id: 'shoes',    icon: '👠', label: 'Shoes' },
  { id: 'wands',    icon: '🪄', label: 'Magic' },
  { id: 'lookbook', icon: '📸', label: 'Looks' }
];

export class DressUpGame {
  constructor() {
    this.container = null;
    this.activeTab = 'dresses';
    this.pose = 'idle';
    this.changesCount = 0;
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
    const av = state.data.avatar;
    const stageObj = AVATAR_CATALOG.stages.find(s => s.id === av.stage) || AVATAR_CATALOG.stages[0];

    this.container.innerHTML = `
      <div class="game-screen dressup-screen">
        <!-- Top Interactive Stage & Runway -->
        <div class="dressup-stage" id="dressup-stage" style="background: ${stageObj.bg};">
          <div class="stage-decor stage-decor-${stageObj.id}">
            <span class="decor-float d1">${stageObj.icon}</span>
            <span class="decor-float d2">✨</span>
            <span class="decor-float d3">🌟</span>
          </div>

          <!-- Left Floating Stage Controls -->
          <div class="stage-side-controls left">
            <button class="stage-pill-btn" id="btn-stage-cycle" aria-label="Change Stage">
              <span class="btn-emoji">${stageObj.icon}</span>
              <span class="btn-caption">Stage</span>
            </button>
            <button class="stage-pill-btn magic-surprise-btn" id="btn-magic-random" aria-label="Surprise Outfit">
              <span class="btn-emoji">🪄</span>
              <span class="btn-caption">Surprise</span>
            </button>
          </div>

          <!-- Center Character Runway -->
          <div class="dressup-avatar-stage" id="dressup-avatar-box">
            <div class="runway-spotlight"></div>
            <div class="avatar-render-wrap" id="dressup-avatar-wrap">
              ${renderAvatarSVG(av, this.pose)}
            </div>
          </div>

          <!-- Right Floating Stage Controls -->
          <div class="stage-side-controls right">
            <button class="stage-pill-btn" id="btn-dance-pose" aria-label="Dance Twirl">
              <span class="btn-emoji">💃</span>
              <span class="btn-caption">Dance</span>
            </button>
            <button class="stage-pill-btn camera-snap-btn" id="btn-snap-photo" aria-label="Take Runway Photo">
              <span class="btn-emoji">📸</span>
              <span class="btn-caption">Photo!</span>
            </button>
          </div>

          <!-- Camera Flash Overlay -->
          <div class="camera-flash-overlay" id="camera-flash"></div>
        </div>

        <!-- Bottom Wardrobe Tray -->
        <div class="wardrobe-sheet">
          <!-- Category Tabs -->
          <div class="wardrobe-tabs" role="tablist">
            ${TABS.map(t => `
              <button class="wardrobe-tab ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
                <span class="tab-emoji">${t.icon}</span>
                <span class="tab-text">${t.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Wardrobe Items Grid -->
          <div class="wardrobe-items-scroll" id="wardrobe-items-area">
            ${this._renderTabContent(av)}
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _renderTabContent(av) {
    switch (this.activeTab) {
      case 'dresses':
        return `
          <div class="wardrobe-grid">
            ${AVATAR_CATALOG.dresses.map(item => `
              <button class="wardrobe-card ${av.dress === item.id ? 'selected' : ''}" data-key="dress" data-val="${item.id}" data-name="${item.name}">
                <span class="w-card-emoji" style="background: ${item.color}22;">${item.icon}</span>
                <span class="w-card-label">${item.name}</span>
              </button>
            `).join('')}
          </div>
        `;

      case 'hair':
        return `
          <div class="swatch-section-label">Hair Color ✨</div>
          <div class="swatch-row">
            ${AVATAR_CATALOG.hairColors.map(c => `
              <button class="color-swatch-btn ${av.hairColor === c.id ? 'selected' : ''}"
                      data-key="hairColor" data-val="${c.id}" data-name="${c.name}"
                      style="background: ${c.swatch || c.id};" aria-label="${c.name}"></button>
            `).join('')}
          </div>
          <div class="swatch-section-label">Hair Style 💇‍♀️</div>
          <div class="wardrobe-grid compact">
            ${AVATAR_CATALOG.hairStyles.map(item => `
              <button class="wardrobe-card ${av.hairStyle === item.id ? 'selected' : ''}" data-key="hairStyle" data-val="${item.id}" data-name="${item.name}">
                <span class="w-card-emoji">${item.icon}</span>
                <span class="w-card-label">${item.name}</span>
              </button>
            `).join('')}
          </div>
          <div class="swatch-section-label">Skin & Sparkle Eyes 👀</div>
          <div class="swatch-row">
            ${AVATAR_CATALOG.skinTones.map(s => `
              <button class="color-swatch-btn ${av.skinTone === s.id ? 'selected' : ''}"
                      data-key="skinTone" data-val="${s.id}" data-name="${s.name}"
                      style="background: ${s.id};" aria-label="${s.name}"></button>
            `).join('')}
            <span class="swatch-divider">|</span>
            ${AVATAR_CATALOG.eyeColors.map(e => `
              <button class="color-swatch-btn eye-swatch ${av.eyeColor === e.id ? 'selected' : ''}"
                      data-key="eyeColor" data-val="${e.id}" data-name="${e.name}"
                      style="background: ${e.id};" aria-label="${e.name}">👁️</button>
            `).join('')}
          </div>
        `;

      case 'hats':
        return `
          <div class="wardrobe-grid">
            ${AVATAR_CATALOG.hats.map(item => `
              <button class="wardrobe-card ${av.hat === item.id ? 'selected' : ''}" data-key="hat" data-val="${item.id}" data-name="${item.name}">
                <span class="w-card-emoji">${item.icon}</span>
                <span class="w-card-label">${item.name}</span>
              </button>
            `).join('')}
          </div>
        `;

      case 'wings':
        return `
          <div class="wardrobe-grid">
            ${AVATAR_CATALOG.wings.map(item => `
              <button class="wardrobe-card ${av.wings === item.id ? 'selected' : ''}" data-key="wings" data-val="${item.id}" data-name="${item.name}">
                <span class="w-card-emoji">${item.icon}</span>
                <span class="w-card-label">${item.name}</span>
              </button>
            `).join('')}
          </div>
        `;

      case 'shoes':
        return `
          <div class="wardrobe-grid">
            ${AVATAR_CATALOG.shoes.map(item => `
              <button class="wardrobe-card ${av.shoes === item.id ? 'selected' : ''}" data-key="shoes" data-val="${item.id}" data-name="${item.name}">
                <span class="w-card-emoji">${item.icon}</span>
                <span class="w-card-label">${item.name}</span>
              </button>
            `).join('')}
          </div>
        `;

      case 'wands':
        return `
          <div class="wardrobe-grid">
            ${AVATAR_CATALOG.wands.map(item => `
              <button class="wardrobe-card ${av.wand === item.id ? 'selected' : ''}" data-key="wand" data-val="${item.id}" data-name="${item.name}">
                <span class="w-card-emoji">${item.icon}</span>
                <span class="w-card-label">${item.name}</span>
              </button>
            `).join('')}
          </div>
        `;

      case 'lookbook':
        return `
          <div class="lookbook-grid">
            ${(state.data.lookbook || []).map((look, i) => `
              <button class="lookbook-card" data-look-index="${i}">
                <div class="lookbook-mini-svg">${renderAvatarSVG(look)}</div>
                <span class="lookbook-tag">⭐ Wear Look</span>
              </button>
            `).join('')}
          </div>
        `;
      default:
        return '';
    }
  }

  _refreshAvatarOnly() {
    if (!this.container) return;
    const wrap = this.container.querySelector('#dressup-avatar-wrap');
    if (wrap) {
      wrap.innerHTML = renderAvatarSVG(state.data.avatar, this.pose);
      wrap.classList.remove('avatar-pop-anim');
      void wrap.offsetWidth;
      wrap.classList.add('avatar-pop-anim');
    }
    const itemsArea = this.container.querySelector('#wardrobe-items-area');
    if (itemsArea) {
      itemsArea.innerHTML = this._renderTabContent(state.data.avatar);
      this._bindItemSelectionEvents();
    }
  }

  _bindEvents() {
    if (!this.container) return;

    // Category Tabs
    this.container.querySelectorAll('.wardrobe-tab').forEach(tab => {
      tab.addEventListener('pointerdown', () => {
        this.activeTab = tab.getAttribute('data-tab');
        audio.playTap(1.1);
        this.render();
      });
    });

    // Stage Cycle Button
    const stageBtn = this.container.querySelector('#btn-stage-cycle');
    if (stageBtn) {
      stageBtn.addEventListener('pointerdown', (e) => {
        const stages = AVATAR_CATALOG.stages;
        const currIdx = stages.findIndex(s => s.id === state.data.avatar.stage);
        const nextStage = stages[(currIdx + 1) % stages.length];
        state.updateAvatar({ stage: nextStage.id });
        audio.playSparkle();
        audio.speak(nextStage.name);
        fx.burstSparkles(e.clientX, e.clientY, 18);
        this.render();
      });
    }

    // Surprise Random Outfit Button
    const randomBtn = this.container.querySelector('#btn-magic-random');
    if (randomBtn) {
      randomBtn.addEventListener('pointerdown', (e) => {
        const pick = arr => arr[Math.floor(Math.random() * arr.length)].id;
        state.updateAvatar({
          hairStyle: pick(AVATAR_CATALOG.hairStyles),
          hairColor: pick(AVATAR_CATALOG.hairColors),
          dress: pick(AVATAR_CATALOG.dresses),
          shoes: pick(AVATAR_CATALOG.shoes),
          hat: pick(AVATAR_CATALOG.hats.slice(0, -1)),
          wings: pick(AVATAR_CATALOG.wings.slice(0, -1)),
          wand: pick(AVATAR_CATALOG.wands.slice(0, -1))
        });
        audio.playSparkle();
        audio.speak("Magic surprise outfit!");
        const avatarBox = this.container.querySelector('#dressup-avatar-box');
        const rect = avatarBox ? avatarBox.getBoundingClientRect() : { left: e.clientX, top: e.clientY, width: 0, height: 0 };
        fx.burstSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, 32);
        this._refreshAvatarOnly();
      });
    }

    // Dance Button
    const danceBtn = this.container.querySelector('#btn-dance-pose');
    if (danceBtn) {
      danceBtn.addEventListener('pointerdown', (e) => {
        this.pose = this.pose === 'dance' ? 'idle' : 'dance';
        audio.playFanfare();
        audio.speak("Twirl and dance!");
        fx.burstSparkles(e.clientX, e.clientY, 22);
        this._refreshAvatarOnly();
      });
    }

    // Photo Snapshot Button (Saves to Lookbook + Rewards Star!)
    const snapBtn = this.container.querySelector('#btn-snap-photo');
    if (snapBtn) {
      snapBtn.addEventListener('pointerdown', (e) => {
        const flash = this.container.querySelector('#camera-flash');
        if (flash) {
          flash.classList.add('flash-active');
          setTimeout(() => flash.classList.remove('flash-active'), 450);
        }
        audio.playCameraShutter();
        state.saveLookToLookbook();
        state.addStars(1);
        fx.confettiShower(65);
        fx.flyStarToCounter(e.clientX, e.clientY, 1);
        audio.speak("Gorgeous photo saved!", true);
        if (this.activeTab === 'lookbook') {
          this._refreshAvatarOnly();
        }
      });
    }

    // Tap directly on Avatar to giggle & sparkle
    const avatarWrap = this.container.querySelector('#dressup-avatar-wrap');
    if (avatarWrap) {
      avatarWrap.addEventListener('pointerdown', (e) => {
        audio.playSparkle();
        fx.burstSparkles(e.clientX, e.clientY, 20);
        avatarWrap.classList.remove('avatar-twirl-anim');
        void avatarWrap.offsetWidth;
        avatarWrap.classList.add('avatar-twirl-anim');
      });
    }

    this._bindItemSelectionEvents();
  }

  _bindItemSelectionEvents() {
    if (!this.container) return;

    // Wardrobe Cards & Color Swatches
    this.container.querySelectorAll('[data-key]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const key = btn.getAttribute('data-key');
        const val = btn.getAttribute('data-val');
        const name = btn.getAttribute('data-name');
        state.updateAvatar({ [key]: val });
        audio.playPop(Math.floor(Math.random() * 10));
        if (name) audio.speak(name);

        const avatarBox = this.container.querySelector('#dressup-avatar-box');
        if (avatarBox) {
          const r = avatarBox.getBoundingClientRect();
          fx.burstSparkles(r.left + r.width / 2, r.top + r.height * 0.45, 22);
        }

        this.changesCount++;
        if (this.changesCount % 5 === 0) {
          state.addStars(1);
          fx.flyStarToCounter(e.clientX, e.clientY, 1);
        }

        this._refreshAvatarOnly();
      });
    });

    // Lookbook Presets
    this.container.querySelectorAll('[data-look-index]').forEach(card => {
      card.addEventListener('pointerdown', (e) => {
        const idx = parseInt(card.getAttribute('data-look-index') || '0', 10);
        const look = state.data.lookbook[idx];
        if (look) {
          state.updateAvatar(look);
          audio.playSparkle();
          audio.speak("Wearing saved look!");
          fx.burstSparkles(e.clientX, e.clientY, 25);
          this.render();
        }
      });
    });
  }
}
