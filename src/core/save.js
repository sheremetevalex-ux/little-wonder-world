// Local progress only: nothing ever leaves the phone.
const KEY = 'wonder.save.2';

const DEFAULT = {
  v: 2,
  friends: ['moko'],        // creatures hatched so far
  eggs: 1,                  // gift eggs waiting on the meadow
  stars: 0,                 // 0-2, three stars become an egg
  lastDay: '',              // for one free egg per calendar day
  music: true,
  doll: null,               // current outfit
  unlocked: [],             // extra wardrobe items received as gifts
  photos: [],               // album: small jpeg data URLs
  quest: 0,                 // adventure stops finished
  pet: 'moko',
  paint: null,              // autosaved drawing
  garden: null,             // music garden pattern
  seen: {}                  // which games have shown their first hand hint
};

let data;
try {
  const raw = localStorage.getItem(KEY);
  data = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
} catch (e) {
  data = { ...DEFAULT };
}

let timer = null;
function flush() {
  timer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    // Storage full: drop the oldest pictures rather than lose the progress
    if (data.photos.length > 4) {
      data.photos = data.photos.slice(0, 4);
      data.paint = null;
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e2) {}
    }
  }
}

export const save = {
  get data() { return data; },
  touch() { if (!timer) timer = setTimeout(flush, 300); },
  now() { if (timer) clearTimeout(timer); flush(); },
  addPhoto(url) {
    data.photos.unshift(url);
    if (data.photos.length > 24) data.photos.length = 24;
    this.touch();
  },
  /** A finished activity earns a star; three of them turn into an egg. */
  earnStar() {
    data.stars++;
    data.pendingStars = (data.pendingStars || 0) + 1;
    if (data.stars >= 3) {
      data.stars -= 3;
      data.eggs++;
    }
    this.touch();
  },
  dailyGift() {
    const d = new Date();
    const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (data.lastDay !== day) {
      if (data.lastDay) data.eggs++;
      data.lastDay = day;
      this.touch();
    }
  }
};

window.addEventListener('pagehide', () => save.now());
document.addEventListener('visibilitychange', () => { if (document.hidden) save.now(); });
// Ask the browser not to evict the data under storage pressure
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
