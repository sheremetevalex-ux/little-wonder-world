// ============================================================================
// Little Wonder World — Persistent State, Collectibles & Event Bus
// Automatically saves progress offline on iPhone localStorage
// ============================================================================

const STORAGE_KEY = 'little_wonder_world_save_v1';

export const STICKER_CATALOG = [
  { id: 'st_unicorn', emoji: '🦄', name: 'Starlight Unicorn', rarity: 'Royal', bg: 'linear-gradient(135deg, #FF9A9E, #FECFEF)' },
  { id: 'st_fairy', emoji: '🧚‍♀️', name: 'Blossom Fairy', rarity: 'Magic', bg: 'linear-gradient(135deg, #A18CD1, #FBC2EB)' },
  { id: 'st_mermaid', emoji: '🧜‍♀️', name: 'Pearl Mermaid', rarity: 'Ocean', bg: 'linear-gradient(135deg, #84FAB0, #8FD3F4)' },
  { id: 'st_kitten', emoji: '🐱', name: 'Cloud Kitten', rarity: 'Cuddle', bg: 'linear-gradient(135deg, #FFECD2, #FCB69F)' },
  { id: 'st_dragon', emoji: '🐲', name: 'Crystal Dragon', rarity: 'Mythic', bg: 'linear-gradient(135deg, #A1C4FD, #C2E9FB)' },
  { id: 'st_bunny', emoji: '🐰', name: 'Marshmallow Bunny', rarity: 'Cuddle', bg: 'linear-gradient(135deg, #F6D365, #FDA085)' },
  { id: 'st_crown', emoji: '👑', name: 'Diamond Crown', rarity: 'Royal', bg: 'linear-gradient(135deg, #FFD200, #F7971E)' },
  { id: 'st_rainbow', emoji: '🌈', name: 'Wish Rainbow', rarity: 'Sky', bg: 'linear-gradient(135deg, #FF9A9E, #A1C4FD)' },
  { id: 'st_butterfly', emoji: '🦋', name: 'Flutter Wing', rarity: 'Forest', bg: 'linear-gradient(135deg, #667EEA, #764BA2)' },
  { id: 'st_cupcake', emoji: '🧁', name: 'Swirl Cupcake', rarity: 'Sweet', bg: 'linear-gradient(135deg, #FF758C, #FF7EB3)' },
  { id: 'st_castle', emoji: '🏰', name: 'Wonder Castle', rarity: 'Royal', bg: 'linear-gradient(135deg, #E0C3FC, #8EC5FC)' },
  { id: 'st_wand', emoji: '🪄', name: 'Sparkle Wand', rarity: 'Magic', bg: 'linear-gradient(135deg, #F093FB, #F5576C)' },
  { id: 'st_dolphin', emoji: '🐬', name: 'Splash Dolphin', rarity: 'Ocean', bg: 'linear-gradient(135deg, #4FACFE, #00F2FE)' },
  { id: 'st_owl', emoji: '🦉', name: 'Moonlight Owl', rarity: 'Forest', bg: 'linear-gradient(135deg, #43E97B, #38F9D7)' },
  { id: 'st_strawberry', emoji: '🍓', name: 'Ruby Berry', rarity: 'Sweet', bg: 'linear-gradient(135deg, #FA709A, #FEE140)' },
  { id: 'st_pegasus', emoji: '🎠', name: 'Carousel Pony', rarity: 'Royal', bg: 'linear-gradient(135deg, #FFDEE9, #B5FFFC)' },
  { id: 'st_shootingstar', emoji: '🌠', name: 'Comet Wish', rarity: 'Sky', bg: 'linear-gradient(135deg, #30CFD0, #330867)' },
  { id: 'st_puppy', emoji: '🐶', name: 'Honey Puppy', rarity: 'Cuddle', bg: 'linear-gradient(135deg, #FBAB7E, #F7CE68)' },
  { id: 'st_crystal', emoji: '💎', name: 'Heart Gem', rarity: 'Mythic', bg: 'linear-gradient(135deg, #FF0844, #FFB199)' },
  { id: 'st_flamingo', emoji: '🦩', name: 'Coral Flamingo', rarity: 'Ocean', bg: 'linear-gradient(135deg, #FF9A8B, #FF6A88)' },
  { id: 'st_icecream', emoji: '🍦', name: 'Dream Sundae', rarity: 'Sweet', bg: 'linear-gradient(135deg, #FAD0C4, #FFD1FF)' },
  { id: 'st_mushroom', emoji: '🍄', name: 'Pixie Toadstool', rarity: 'Forest', bg: 'linear-gradient(135deg, #FF5858, #F09819)' },
  { id: 'st_swan', emoji: '🦢', name: 'Royal Swan', rarity: 'Royal', bg: 'linear-gradient(135deg, #D9AFD9, #97D9E1)' },
  { id: 'st_sun', emoji: '☀️', name: 'Golden Sunbeam', rarity: 'Sky', bg: 'linear-gradient(135deg, #FDEB71, #F8D800)' }
];

const DEFAULT_STATE = {
  stars: 5,
  totalStarsEarned: 5,
  eggCharge: 5, // Out of 5: starts ready to hatch a welcome surprise egg!
  skyMode: 'day',
  muted: false,
  activePet: 'unicorn',
  avatar: {
    skinTone: '#FFE0CC',
    eyeColor: '#7C4DFF',
    hairStyle: 'princess_waves',
    hairColor: '#FF6B9D',
    dress: 'ballgown_rose',
    shoes: 'glass_slippers',
    hat: 'diamond_tiara',
    wings: 'fairy_butterfly',
    wand: 'star_wand',
    stage: 'crystal_palace'
  },
  lookbook: [
    {
      id: 'preset_fairy',
      title: 'Rose Fairy Princess',
      skinTone: '#FFE0CC',
      eyeColor: '#7C4DFF',
      hairStyle: 'princess_waves',
      hairColor: '#FF6B9D',
      dress: 'ballgown_rose',
      shoes: 'glass_slippers',
      hat: 'diamond_tiara',
      wings: 'fairy_butterfly',
      wand: 'star_wand',
      stage: 'crystal_palace'
    },
    {
      id: 'preset_mermaid',
      title: 'Lagoon Starlight',
      skinTone: '#F7C9A6',
      eyeColor: '#00B8D4',
      hairStyle: 'mermaid_curls',
      hairColor: '#00E5FF',
      dress: 'mermaid_shimmer',
      shoes: 'fairy_sandals',
      hat: 'flower_crown',
      wings: 'dragonfly_wings',
      wand: 'heart_scepter',
      stage: 'mermaid_lagoon'
    }
  ],
  stickers: ['st_unicorn', 'st_crown'],
  petCare: {
    unicorn: { clean: 90, full: 85, happy: 95, hat: 'crown' },
    kitten:  { clean: 80, full: 80, happy: 90, hat: 'bow' },
    dragon:  { clean: 85, full: 75, happy: 95, hat: 'star' },
    bunny:   { clean: 90, full: 90, happy: 95, hat: 'flower' }
  },
  questsCompleted: 0,
  cakesBaked: 0
};

class WonderState {
  constructor() {
    this.listeners = new Set();
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(raw);
      return {
        ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
        ...parsed,
        avatar: { ...DEFAULT_STATE.avatar, ...(parsed.avatar || {}) },
        petCare: { ...DEFAULT_STATE.petCare, ...(parsed.petCare || {}) }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {}
    this._notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    this.listeners.forEach(fn => {
      try { fn(this.data); } catch (e) {}
    });
  }

  addStars(amount = 1) {
    this.data.stars += amount;
    this.data.totalStarsEarned += amount;
    this.data.eggCharge = Math.min(5, (this.data.eggCharge || 0) + amount);
    this.save();
    return {
      stars: this.data.stars,
      eggReady: this.data.eggCharge >= 5
    };
  }

  updateAvatar(partial) {
    this.data.avatar = { ...this.data.avatar, ...partial };
    this.save();
  }

  saveLookToLookbook() {
    const snap = {
      id: 'look_' + Date.now(),
      title: 'Magical Look',
      ...this.data.avatar
    };
    this.data.lookbook.unshift(snap);
    if (this.data.lookbook.length > 12) {
      this.data.lookbook = this.data.lookbook.slice(0, 12);
    }
    this.save();
    return snap;
  }

  unlockRandomSticker() {
    const locked = STICKER_CATALOG.filter(s => !this.data.stickers.includes(s.id));
    let chosen;
    let isNew = false;
    if (locked.length > 0) {
      chosen = locked[Math.floor(Math.random() * locked.length)];
      this.data.stickers.push(chosen.id);
      isNew = true;
    } else {
      chosen = STICKER_CATALOG[Math.floor(Math.random() * STICKER_CATALOG.length)];
    }
    this.data.eggCharge = 0;
    this.save();
    return { sticker: chosen, isNew };
  }
}

export const state = new WonderState();
