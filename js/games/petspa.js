// ============================================================================
// Game 3: Cuddle Pet Spa & Care Salon
// 4 Baby Pets (Unicorn, Kitten, Dragon, Bunny) + 4 Interactive Care Stations
// Supports BOTH Drag-onto-Pet and Tap-to-Use for effortless 4yo play!
// ============================================================================

import { state } from '../state.js';
import { audio } from '../audio.js';
import { fx } from '../fx.js';
import { PET_CATALOG, renderPetSVG } from '../avatar.js';

const ROOMS = [
  { id: 'bath',   icon: '🛁', label: 'Bath' },
  { id: 'feed',   icon: '🍓', label: 'Feed' },
  { id: 'doctor', icon: '🩹', label: 'Doctor' },
  { id: 'sleep',  icon: '🌙', label: 'Bedtime' }
];

const FOODS = [
  { id: 'cupcake',  emoji: '🧁', name: 'Rainbow Cupcake' },
  { id: 'berry',    emoji: '🍓', name: 'Sweet Strawberry' },
  { id: 'sundae',   emoji: '🍦', name: 'Dream Sundae' },
  { id: 'donut',    emoji: '🍩', name: 'Sparkle Donut' },
  { id: 'apple',    emoji: '🍎', name: 'Crunchy Apple' },
  { id: 'broccoli', emoji: '🥦', name: 'Silly Broccoli' }
];

export class PetSpaGame {
  constructor() {
    this.container = null;
    this.room = 'bath';
    this.mood = 'happy';
    this.dirtyLevel = 75;
    this.foamLevel = 0;
    this.puffed = false;
    this.hasBooBoo = false;
    this.isSleeping = false;
    this.lullabyStep = 0;
    this.treatsFed = 0;
    this.dragGhost = null;
  }

  mount(container) {
    this.container = container;
    this.render();
  }

  unmount() {
    this._removeDragGhost();
    this.container = null;
  }

  render() {
    if (!this.container) return;
    const activePet = state.data.activePet || 'unicorn';
    const petObj = PET_CATALOG.find(p => p.id === activePet) || PET_CATALOG[0];

    this.container.innerHTML = `
      <div class="game-screen petspa-screen room-${this.room} ${this.isSleeping ? 'night-sleep-mode' : ''}">
        <!-- Top Pet Switcher Row -->
        <div class="pet-selector-bar">
          ${PET_CATALOG.map(p => `
            <button class="pet-pick-pill ${p.id === activePet ? 'active' : ''}" data-pet="${p.id}">
              <span>${p.emoji}</span>
              <span class="pet-pick-name">${p.name.split(' ')[0]}</span>
            </button>
          `).join('')}
        </div>

        <!-- Center Interactive Pet Stage -->
        <div class="pet-stage-area" id="pet-stage-area">
          <!-- Room Status / Prompt Bubble -->
          <div class="pet-speech-bubble" id="pet-speech-bubble">
            ${this._getStatusPrompt()}
          </div>

          <!-- Night Lamp Toggle (in Sleep Room) -->
          ${this.room === 'sleep' ? `
            <button class="bedroom-lamp-btn" id="btn-toggle-lamp">
              ${this.isSleeping ? '🌙 Wake Up' : '💡 Night Light'}
            </button>
          ` : ''}

          <!-- Mud Puddle Reset Button (in Bath Room when clean) -->
          ${this.room === 'bath' && this.dirtyLevel === 0 && this.foamLevel === 0 ? `
            <button class="bedroom-lamp-btn" id="btn-mud-splash">
              🌿 Splash in Mud!
            </button>
          ` : ''}

          <!-- Pet Character Target Box -->
          <div class="pet-character-target" id="pet-target-box">
            <div class="pet-svg-holder" id="pet-svg-holder">
              ${renderPetSVG(activePet, {
                mood: this.isSleeping ? 'sleepy' : this.mood,
                dirtyLevel: this.dirtyLevel,
                foamLevel: this.foamLevel,
                hasBooBoo: this.hasBooBoo,
                puffed: this.puffed
              })}
            </div>
            ${this.isSleeping ? `<div class="sleep-zzz-float">💤 Zzz...</div>` : ''}
          </div>
        </div>

        <!-- Bottom Care Tools & Room Tabs -->
        <div class="pet-bottom-panel">
          <!-- Active Room Interactive Tools Tray -->
          <div class="pet-tools-tray" id="pet-tools-tray">
            ${this._renderRoomTools()}
          </div>

          <!-- 4 Care Room Navigation Tabs -->
          <div class="pet-room-tabs">
            ${ROOMS.map(r => `
              <button class="pet-room-tab ${this.room === r.id ? 'active' : ''}" data-room="${r.id}">
                <span class="r-tab-icon">${r.icon}</span>
                <span class="r-tab-label">${r.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _getStatusPrompt() {
    if (this.room === 'bath') {
      if (this.dirtyLevel > 10) return '🧼 Scrub with Soap!';
      if (this.foamLevel > 10) return '🚿 Rinse with Water!';
      if (this.puffed) return '🪮 Brush Fluffy Fur!';
      return '✨ Squeaky Clean! ⭐';
    }
    if (this.room === 'feed') {
      return '🍓 Tap or Drag Yummy Treats!';
    }
    if (this.room === 'doctor') {
      return '🩺 Check Heart & Give Love!';
    }
    if (this.room === 'sleep') {
      return this.isSleeping ? '🎵 Shhh... Sweet Dreams!' : '🧸 Play or Tap Night Light!';
    }
    return '💖 Cuddle Time!';
  }

  _renderRoomTools() {
    if (this.room === 'bath') {
      return `
        <button class="care-tool-btn" data-tool="soap" data-emoji="🧼">
          <span class="tool-emoji">🧼</span>
          <span class="tool-label">Soap</span>
        </button>
        <button class="care-tool-btn" data-tool="shower" data-emoji="🚿">
          <span class="tool-emoji">🚿</span>
          <span class="tool-label">Rinse</span>
        </button>
        <button class="care-tool-btn" data-tool="dryer" data-emoji="💨">
          <span class="tool-emoji">💨</span>
          <span class="tool-label">Dryer</span>
        </button>
        <button class="care-tool-btn" data-tool="brush" data-emoji="🪮">
          <span class="tool-emoji">🪮</span>
          <span class="tool-label">Brush</span>
        </button>
      `;
    }

    if (this.room === 'feed') {
      return FOODS.map(f => `
        <button class="care-tool-btn food-btn" data-tool="food" data-food="${f.id}" data-name="${f.name}" data-emoji="${f.emoji}">
          <span class="tool-emoji">${f.emoji}</span>
          <span class="tool-label">${f.name.split(' ')[1]}</span>
        </button>
      `).join('');
    }

    if (this.room === 'doctor') {
      return `
        <button class="care-tool-btn" data-tool="stethoscope" data-emoji="🩺">
          <span class="tool-emoji">🩺</span>
          <span class="tool-label">Heart</span>
        </button>
        <button class="care-tool-btn" data-tool="bandaid" data-emoji="🩹">
          <span class="tool-emoji">🩹</span>
          <span class="tool-label">Band-Aid</span>
        </button>
        <button class="care-tool-btn" data-tool="syrup" data-emoji="🥄">
          <span class="tool-emoji">🥄</span>
          <span class="tool-label">Berry Sip</span>
        </button>
        <button class="care-tool-btn" data-tool="cuddle" data-emoji="💖">
          <span class="tool-emoji">💖</span>
          <span class="tool-label">Cuddle</span>
        </button>
      `;
    }

    if (this.room === 'sleep') {
      return `
        <button class="care-tool-btn" data-tool="lullaby" data-emoji="🎵">
          <span class="tool-emoji">🎵</span>
          <span class="tool-label">Lullaby</span>
        </button>
        <button class="care-tool-btn" data-tool="teddy" data-emoji="🧸">
          <span class="tool-emoji">🧸</span>
          <span class="tool-label">Teddy</span>
        </button>
        <button class="care-tool-btn" data-tool="ball" data-emoji="⚽">
          <span class="tool-emoji">⚽</span>
          <span class="tool-label">Ball</span>
        </button>
        <button class="care-tool-btn" data-tool="blanket" data-emoji="🌟">
          <span class="tool-emoji">🌟</span>
          <span class="tool-label">Wish Star</span>
        </button>
      `;
    }
    return '';
  }

  _updatePetVisual() {
    if (!this.container) return;
    const holder = this.container.querySelector('#pet-svg-holder');
    const speech = this.container.querySelector('#pet-speech-bubble');
    if (holder) {
      holder.innerHTML = renderPetSVG(state.data.activePet || 'unicorn', {
        mood: this.isSleeping ? 'sleepy' : this.mood,
        dirtyLevel: this.dirtyLevel,
        foamLevel: this.foamLevel,
        hasBooBoo: this.hasBooBoo,
        puffed: this.puffed
      });
    }
    if (speech) {
      speech.innerHTML = this._getStatusPrompt();
    }
  }

  _applyToolAction(btn, cx, cy) {
    const tool = btn.getAttribute('data-tool');
    const petBox = this.container?.querySelector('#pet-target-box');
    const rect = petBox ? petBox.getBoundingClientRect() : { left: cx, top: cy, width: 0, height: 0 };
    const px = rect.left + rect.width / 2;
    const py = rect.top + rect.height / 2;

    if (tool === 'soap') {
      this.dirtyLevel = Math.max(0, this.dirtyLevel - 40);
      this.foamLevel = Math.min(100, this.foamLevel + 50);
      audio.playBubble();
      fx.bubbleBurst(px, py, 16);
      audio.speak("Scrub a dub dub!");
      this._updatePetVisual();
    } else if (tool === 'shower') {
      const wasFoamy = this.foamLevel > 0 || this.dirtyLevel > 0;
      this.dirtyLevel = 0;
      this.foamLevel = Math.max(0, this.foamLevel - 55);
      audio.playBubble();
      fx.bubbleBurst(px, py, 18);
      if (wasFoamy && this.foamLevel === 0) {
        audio.playFanfare();
        audio.speak("All clean and sparkling!");
        state.addStars(1);
        fx.flyStarToCounter(px, py, 1);
        this.render();
        return;
      }
      this._updatePetVisual();
    } else if (tool === 'dryer') {
      this.puffed = true;
      audio.playSquish();
      fx.burstSparkles(px, py, 16);
      audio.speak("Poofy fluffy fur!");
      this._updatePetVisual();
    } else if (tool === 'brush') {
      this.puffed = false;
      audio.playSparkle();
      fx.heartBurst(px, py, 12);
      audio.speak("So soft and pretty!");
      state.addStars(1);
      fx.flyStarToCounter(px, py, 1);
      this._updatePetVisual();
    } else if (tool === 'food') {
      const name = btn.getAttribute('data-name') || 'Yummy treat';
      const foodId = btn.getAttribute('data-food');
      this.mood = 'open_mouth';
      this._updatePetVisual();
      audio.playMunch();
      fx.heartBurst(px, py, 10);
      fx.burstSparkles(px, py, 14);
      setTimeout(() => {
        this.mood = foodId === 'broccoli' ? 'sad' : 'happy';
        this._updatePetVisual();
        setTimeout(() => {
          this.mood = 'happy';
          this._updatePetVisual();
        }, 500);
      }, 320);

      this.treatsFed++;
      audio.speak(foodId === 'broccoli' ? "Crunchy broccoli!" : "Yum yum! " + name);
      if (this.treatsFed % 3 === 0) {
        state.addStars(1);
        fx.flyStarToCounter(px, py, 1);
      }
    } else if (tool === 'stethoscope') {
      audio.playPop(2);
      setTimeout(() => audio.playPop(5), 220);
      fx.heartBurst(px, py, 15);
      audio.speak("Strong happy heartbeat!");
    } else if (tool === 'bandaid') {
      this.hasBooBoo = !this.hasBooBoo;
      audio.playSparkle();
      fx.burstSparkles(px, py, 18);
      audio.speak("Cute heart band-aid!");
      state.addStars(1);
      fx.flyStarToCounter(px, py, 1);
      this._updatePetVisual();
    } else if (tool === 'syrup') {
      this.mood = 'open_mouth';
      this._updatePetVisual();
      audio.playMunch();
      fx.burstSparkles(px, py, 16);
      audio.speak("Sweet magic berry syrup!");
      setTimeout(() => {
        this.mood = 'happy';
        this._updatePetVisual();
      }, 450);
    } else if (tool === 'cuddle') {
      audio.playSparkle();
      fx.heartBurst(px, py, 18);
      audio.speak("Purr! I love cuddles!");
    } else if (tool === 'lullaby') {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => audio.playLullabyNote(this.lullabyStep++), i * 280);
      }
      fx.burstSparkles(px, py, 14);
    } else if (tool === 'teddy' || tool === 'ball' || tool === 'blanket') {
      audio.playPop(9);
      fx.heartBurst(px, py, 12);
      fx.burstSparkles(px, py, 14);
      const holder = this.container?.querySelector('#pet-svg-holder');
      if (holder) {
        holder.classList.remove('squish-bounce');
        void holder.offsetWidth;
        holder.classList.add('squish-bounce');
      }
    }
  }

  _removeDragGhost() {
    if (this.dragGhost) {
      this.dragGhost.remove();
      this.dragGhost = null;
    }
  }

  _bindEvents() {
    if (!this.container) return;

    // 1. Pet Selector Bar
    this.container.querySelectorAll('.pet-pick-pill').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        const petId = btn.getAttribute('data-pet');
        state.data.activePet = petId;
        state.save();
        audio.playSparkle();
        const petObj = PET_CATALOG.find(p => p.id === petId);
        if (petObj) audio.speak(petObj.name);
        fx.burstSparkles(e.clientX, e.clientY, 16);
        this.render();
      });
    });

    // 2. Room Navigation Tabs
    this.container.querySelectorAll('.pet-room-tab').forEach(tab => {
      tab.addEventListener('pointerdown', (e) => {
        const nextRoom = tab.getAttribute('data-room');
        this.room = nextRoom;
        this.isSleeping = false;
        if (nextRoom === 'bath' && this.dirtyLevel === 0 && this.foamLevel === 0) {
          this.dirtyLevel = 65;
        }
        audio.playTap(1.15);
        fx.burstSparkles(e.clientX, e.clientY, 14);
        const roomVoices = {
          bath: "Bubble bath time!",
          feed: "Yummy kitchen treats!",
          doctor: "Cuddle doctor checkup!",
          sleep: "Cozy bedtime room!"
        };
        audio.speak(roomVoices[nextRoom]);
        this.render();
      });
    });

    // 3. Tap directly on Pet to pet/cuddle
    const petTarget = this.container.querySelector('#pet-target-box');
    if (petTarget) {
      petTarget.addEventListener('pointerdown', (e) => {
        if (this.isSleeping) {
          audio.playLullabyNote(this.lullabyStep++);
          fx.burstSparkles(e.clientX, e.clientY, 10);
          return;
        }
        audio.playPop(6);
        fx.heartBurst(e.clientX, e.clientY, 12);
        const holder = this.container.querySelector('#pet-svg-holder');
        if (holder) {
          holder.classList.remove('squish-bounce');
          void holder.offsetWidth;
          holder.classList.add('squish-bounce');
        }
      });
    }

    // 4. Night Lamp Toggle in Sleep Room
    const lampBtn = this.container.querySelector('#btn-toggle-lamp');
    if (lampBtn) {
      lampBtn.addEventListener('pointerdown', (e) => {
        this.isSleeping = !this.isSleeping;
        if (this.isSleeping) {
          for (let i = 0; i < 4; i++) {
            setTimeout(() => audio.playLullabyNote(i), i * 300);
          }
          audio.speak("Goodnight little pet!");
          state.addStars(1);
          fx.flyStarToCounter(e.clientX, e.clientY, 1);
        } else {
          audio.playSparkle();
          audio.speak("Good morning!");
        }
        this.render();
      });
    }

    // 5. Mud Splash Reset in Bath Room
    const mudBtn = this.container.querySelector('#btn-mud-splash');
    if (mudBtn) {
      mudBtn.addEventListener('pointerdown', (e) => {
        this.dirtyLevel = 80;
        this.foamLevel = 0;
        audio.playSquish();
        audio.speak("Splash! Muddy puddles!");
        fx.burstSparkles(e.clientX, e.clientY, 14);
        this.render();
      });
    }

    // 6. Care Tools & Foods: Support BOTH Tap AND Drag-onto-Pet!
    this.container.querySelectorAll('.care-tool-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const emoji = btn.getAttribute('data-emoji') || '✨';
        const isFood = btn.getAttribute('data-tool') === 'food';
        if (isFood) {
          this.mood = 'open_mouth';
          this._updatePetVisual();
        }

        this._removeDragGhost();
        const ghost = document.createElement('div');
        ghost.className = 'floating-drag-tool';
        ghost.textContent = emoji;
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        document.body.appendChild(ghost);
        this.dragGhost = ghost;

        let moved = false;
        let lastScrubTime = 0;

        const onMove = (ev) => {
          moved = true;
          if (this.dragGhost) {
            this.dragGhost.style.left = `${ev.clientX}px`;
            this.dragGhost.style.top = `${ev.clientY}px`;
          }
          // Continuous scrubbing if dragging soap or shower over the pet!
          const toolType = btn.getAttribute('data-tool');
          if (toolType === 'soap' || toolType === 'shower') {
            const now = performance.now();
            if (now - lastScrubTime > 260) {
              const box = this.container?.querySelector('#pet-target-box');
              if (box) {
                const r = box.getBoundingClientRect();
                if (ev.clientX >= r.left - 30 && ev.clientX <= r.right + 30 &&
                    ev.clientY >= r.top - 30 && ev.clientY <= r.bottom + 30) {
                  lastScrubTime = now;
                  this._applyToolAction(btn, ev.clientX, ev.clientY);
                }
              }
            }
          }
        };

        const onUp = (ev) => {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          this._removeDragGhost();
          // Always apply on tap OR drop so a 4-year-old never misses!
          if (!moved || lastScrubTime === 0) {
            this._applyToolAction(btn, ev.clientX, ev.clientY);
          }
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
    });
  }
}
