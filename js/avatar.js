// ============================================================================
// Little Wonder World — Multi-Layer SVG Character & Magical Baby Pet Renderer
// High-detail vector art with gradients, specular catchlights & live animations
// ============================================================================

export const AVATAR_CATALOG = {
  skinTones: [
    { id: '#FFE0CC', name: 'Peach Cream' },
    { id: '#F7C9A6', name: 'Warm Honey' },
    { id: '#E0A378', name: 'Golden Tan' },
    { id: '#B8764F', name: 'Caramel' },
    { id: '#7F4B2B', name: 'Rich Cocoa' }
  ],
  eyeColors: [
    { id: '#7C4DFF', name: 'Violet Star' },
    { id: '#00B0FF', name: 'Sapphire Sky' },
    { id: '#00C853', name: 'Emerald Leaf' },
    { id: '#FF4081', name: 'Rose Berry' },
    { id: '#8D6E63', name: 'Warm Hazel' },
    { id: '#FFB300', name: 'Amber Gold' }
  ],
  hairStyles: [
    { id: 'princess_waves', icon: '👸', name: 'Princess Waves' },
    { id: 'space_buns', icon: '🎀', name: 'Twin Buns' },
    { id: 'fairy_braids', icon: '🌸', name: 'Fairy Braids' },
    { id: 'mermaid_curls', icon: '🧜‍♀️', name: 'Mermaid Curls' },
    { id: 'star_ponytail', icon: '⭐', name: 'Star Ponytail' },
    { id: 'royal_bob', icon: '👑', name: 'Sweet Bob' }
  ],
  hairColors: [
    { id: '#FF6B9D', name: 'Rose Pink' },
    { id: '#FFD54F', name: 'Golden Blonde' },
    { id: '#6D4C41', name: 'Chestnut' },
    { id: '#B388FF', name: 'Lavender' },
    { id: '#00E5FF', name: 'Mermaid Aqua' },
    { id: '#FF7043', name: 'Sunset Coral' },
    { id: '#263238', name: 'Midnight' },
    { id: 'url(#rainbowHairGrad)', name: 'Rainbow Magic', swatch: 'linear-gradient(135deg,#FF6B9D,#FFD54F,#00E5FF,#B388FF)' }
  ],
  dresses: [
    { id: 'ballgown_rose', icon: '👗', name: 'Rose Ballgown', color: '#FF4081' },
    { id: 'fairy_petal', icon: '🌷', name: 'Fairy Petal', color: '#69F0AE' },
    { id: 'mermaid_shimmer', icon: '🐚', name: 'Mermaid Gown', color: '#00E5FF' },
    { id: 'crystal_ice', icon: '❄️', name: 'Crystal Queen', color: '#80D8FF' },
    { id: 'unicorn_cozy', icon: '🦄', name: 'Unicorn Tunic', color: '#EA80FC' },
    { id: 'starlight_hero', icon: '🦸‍♀️', name: 'Star Heroine', color: '#7C4DFF' },
    { id: 'sunshine_explorer', icon: '🌻', name: 'Sunny Overall', color: '#FFD740' },
    { id: 'royal_velvet', icon: '👑', name: 'Royal Velvet', color: '#FF5252' }
  ],
  shoes: [
    { id: 'glass_slippers', icon: '👠', name: 'Glass Slippers' },
    { id: 'fairy_sandals', icon: '🩰', name: 'Fairy Ribbons' },
    { id: 'rainbow_sneakers', icon: '👟', name: 'Rainbow Kicks' },
    { id: 'unicorn_boots', icon: '👢', name: 'Starlight Boots' },
    { id: 'golden_heels', icon: '✨', name: 'Golden Shoes' },
    { id: 'berry_flats', icon: '🍓', name: 'Berry Bows' }
  ],
  hats: [
    { id: 'diamond_tiara', icon: '👑', name: 'Diamond Tiara' },
    { id: 'flower_crown', icon: '🌺', name: 'Flower Crown' },
    { id: 'unicorn_horn', icon: '🦄', name: 'Unicorn Horn' },
    { id: 'witch_hat', icon: '🧙‍♀️', name: 'Star Witch Hat' },
    { id: 'kitty_ears', icon: '🐱', name: 'Kitty Ears' },
    { id: 'royal_bow', icon: '🎀', name: 'Giant Ribbon' },
    { id: 'none', icon: '🚫', name: 'No Hat' }
  ],
  wings: [
    { id: 'fairy_butterfly', icon: '🦋', name: 'Butterfly Wings' },
    { id: 'angel_feathers', icon: '👼', name: 'Feather Wings' },
    { id: 'dragonfly_wings', icon: '✨', name: 'Crystal Wings' },
    { id: 'royal_cape', icon: '🧣', name: 'Royal Cape' },
    { id: 'rainbow_halo', icon: '🌈', name: 'Rainbow Aura' },
    { id: 'none', icon: '🚫', name: 'No Wings' }
  ],
  wands: [
    { id: 'star_wand', icon: '🪄', name: 'Star Wand' },
    { id: 'heart_scepter', icon: '💖', name: 'Heart Scepter' },
    { id: 'bunny_plush', icon: '🐰', name: 'Bunny Plushie' },
    { id: 'rainbow_ribbon', icon: '🎗️', name: 'Dance Ribbon' },
    { id: 'ice_cream', icon: '🍦', name: 'Sweet Cone' },
    { id: 'magic_lantern', icon: '🏮', name: 'Pixie Lantern' },
    { id: 'none', icon: '🚫', name: 'Empty Hand' }
  ],
  stages: [
    { id: 'crystal_palace', icon: '🏰', name: 'Crystal Palace', bg: 'linear-gradient(180deg, #F3E5F5 0%, #E1BEE7 55%, #F8BBD0 100%)' },
    { id: 'enchanted_forest', icon: '🌳', name: 'Pixie Woods', bg: 'linear-gradient(180deg, #A7FFEB 0%, #B9F6CA 60%, #81C784 100%)' },
    { id: 'mermaid_lagoon', icon: '🐚', name: 'Coral Lagoon', bg: 'linear-gradient(180deg, #84FFFF 0%, #80D8FF 60%, #F48FB1 100%)' },
    { id: 'starlight_stage', icon: '🌟', name: 'Star Concert', bg: 'linear-gradient(180deg, #311B92 0%, #6A1B9A 60%, #AD1457 100%)' },
    { id: 'rainbow_cloud', icon: '🌈', name: 'Cloud Kingdom', bg: 'linear-gradient(180deg, #FFF9C4 0%, #FFCCBC 55%, #F8BBD0 100%)' }
  ]
};

export function renderAvatarSVG(cfg = {}, pose = 'idle') {
  const skin = cfg.skinTone || '#FFE0CC';
  const eye = cfg.eyeColor || '#7C4DFF';
  const hairStyle = cfg.hairStyle || 'princess_waves';
  const hairColor = cfg.hairColor || '#FF6B9D';
  const dress = cfg.dress || 'ballgown_rose';
  const shoes = cfg.shoes || 'glass_slippers';
  const hat = cfg.hat || 'diamond_tiara';
  const wings = cfg.wings || 'fairy_butterfly';
  const wand = cfg.wand || 'star_wand';

  return `
  <svg viewBox="0 0 260 340" class="wonder-avatar-svg pose-${pose}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rainbowHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF6B9D"/>
        <stop offset="33%" stop-color="#FFD54F"/>
        <stop offset="66%" stop-color="#00E5FF"/>
        <stop offset="100%" stop-color="#B388FF"/>
      </linearGradient>
      <linearGradient id="roseGownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FF80AB"/>
        <stop offset="50%" stop-color="#FF4081"/>
        <stop offset="100%" stop-color="#C51162"/>
      </linearGradient>
      <linearGradient id="fairyGownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#B9F6CA"/>
        <stop offset="55%" stop-color="#00E676"/>
        <stop offset="100%" stop-color="#00BFA5"/>
      </linearGradient>
      <linearGradient id="mermaidGownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#84FFFF"/>
        <stop offset="50%" stop-color="#00B0FF"/>
        <stop offset="100%" stop-color="#7C4DFF"/>
      </linearGradient>
      <linearGradient id="iceGownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#E1F5FE"/>
        <stop offset="50%" stop-color="#40C4FF"/>
        <stop offset="100%" stop-color="#0288D1"/>
      </linearGradient>
      <linearGradient id="unicornGownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCE4EC"/>
        <stop offset="50%" stop-color="#EA80FC"/>
        <stop offset="100%" stop-color="#8C9EFF"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF59D"/>
        <stop offset="50%" stop-color="#FFD700"/>
        <stop offset="100%" stop-color="#FFA000"/>
      </linearGradient>
      <linearGradient id="wingFairyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF80AB" stop-opacity="0.85"/>
        <stop offset="50%" stop-color="#EA80FC" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#84FFFF" stop-opacity="0.85"/>
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.16"/>
      </filter>
    </defs>

    <!-- Soft Ground Shadow -->
    <ellipse cx="130" cy="318" rx="58" ry="12" fill="rgba(0,0,0,0.14)"/>

    <g class="avatar-body-group" filter="url(#softGlow)">
      <!-- 1. WINGS / BACK ITEMS -->
      ${renderWingsLayer(wings)}

      <!-- 2. BACK HAIR LAYER -->
      ${renderBackHairLayer(hairStyle, hairColor)}

      <!-- 3. LEGS & ARMS -->
      <!-- Left & Right Arms -->
      <path d="M92,162 Q66,182 58,205" stroke="${skin}" stroke-width="15" stroke-linecap="round" fill="none"/>
      <circle cx="57" cy="207" r="9" fill="${skin}"/>
      <path d="M168,162 Q194,180 204,196" stroke="${skin}" stroke-width="15" stroke-linecap="round" fill="none"/>
      <circle cx="205" cy="198" r="9" fill="${skin}"/>

      <!-- Legs -->
      <rect x="108" y="242" width="15" height="58" rx="7" fill="${skin}"/>
      <rect x="137" y="242" width="15" height="58" rx="7" fill="${skin}"/>

      <!-- 4. SHOES LAYER -->
      ${renderShoesLayer(shoes)}

      <!-- 5. DRESS / OUTFIT LAYER -->
      ${renderDressLayer(dress)}

      <!-- Neck -->
      <rect x="121" y="138" width="18" height="20" rx="8" fill="${skin}"/>

      <!-- 6. HEAD & EXPRESSIVE FACE -->
      <g class="avatar-head-group">
        <!-- Ears -->
        <circle cx="82" cy="104" r="10" fill="${skin}"/>
        <circle cx="178" cy="104" r="10" fill="${skin}"/>
        <!-- Main Chibi Face Oval -->
        <ellipse cx="130" cy="102" rx="47" ry="44" fill="${skin}"/>

        <!-- Rosy Blushing Cheeks -->
        <ellipse cx="98" cy="114" rx="10.5" ry="6" fill="#FF80AB" opacity="0.52"/>
        <ellipse cx="162" cy="114" rx="10.5" ry="6" fill="#FF80AB" opacity="0.52"/>

        <!-- Eyebrows -->
        <path d="M96,86 Q106,81 115,85" stroke="#5D4037" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <path d="M145,85 Q154,81 164,86" stroke="#5D4037" stroke-width="2.6" stroke-linecap="round" fill="none"/>

        <!-- Big Sparkly Anime/Pixar Eyes -->
        <g class="avatar-eyes">
          <!-- Left Eye -->
          <ellipse cx="106" cy="100" rx="12" ry="13.5" fill="#FFFFFF"/>
          <ellipse cx="106" cy="101" rx="9" ry="10.5" fill="${eye}"/>
          <circle cx="106" cy="101" r="5" fill="#1A1A2E"/>
          <circle cx="102" cy="96" r="3.6" fill="#FFFFFF"/>
          <circle cx="110" cy="105" r="1.8" fill="#FFFFFF"/>
          <path d="M93,95 Q106,84 118,95" stroke="#2D1B2E" stroke-width="3.2" stroke-linecap="round" fill="none"/>
          <path d="M94,93 L90,88 M99,89 L97,84" stroke="#2D1B2E" stroke-width="2" stroke-linecap="round"/>

          <!-- Right Eye -->
          <ellipse cx="154" cy="100" rx="12" ry="13.5" fill="#FFFFFF"/>
          <ellipse cx="154" cy="101" rx="9" ry="10.5" fill="${eye}"/>
          <circle cx="154" cy="101" r="5" fill="#1A1A2E"/>
          <circle cx="150" cy="96" r="3.6" fill="#FFFFFF"/>
          <circle cx="158" cy="105" r="1.8" fill="#FFFFFF"/>
          <path d="M142,95 Q154,84 167,95" stroke="#2D1B2E" stroke-width="3.2" stroke-linecap="round" fill="none"/>
          <path d="M166,93 L170,88 M161,89 L163,84" stroke="#2D1B2E" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- Cute Button Nose -->
        <path d="M128,110 Q130,113 132,110" stroke="#D78B66" stroke-width="2.2" stroke-linecap="round" fill="none"/>

        <!-- Joyful Smile -->
        <path d="M118,121 Q130,133 142,121 Z" fill="#FF5252"/>
        <path d="M122,126 Q130,131 138,126" fill="#FF8A80"/>
        <path d="M117,121 Q130,132 143,121" stroke="#AD1457" stroke-width="2.2" stroke-linecap="round" fill="none"/>

        <!-- 7. FRONT HAIR BANGS & LOCKS -->
        ${renderFrontHairLayer(hairStyle, hairColor)}

        <!-- 8. CROWN / HAT LAYER -->
        ${renderHatLayer(hat)}
      </g>

      <!-- 9. HANDHELD MAGIC WAND / ACCESSORY -->
      ${renderWandLayer(wand)}
    </g>
  </svg>
  `;
}

function renderWingsLayer(wings) {
  switch (wings) {
    case 'fairy_butterfly':
      return `
      <g class="avatar-wings">
        <!-- Left Butterfly Wing -->
        <path d="M118,165 C55,105 22,135 42,182 C52,202 88,198 115,186 Z" fill="url(#wingFairyGrad)" stroke="#FFFFFF" stroke-width="2.5"/>
        <path d="M115,186 C62,192 42,232 68,248 C90,260 112,225 120,198 Z" fill="url(#wingFairyGrad)" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="66" cy="162" r="8" fill="#FFF59D" opacity="0.7"/>
        <!-- Right Butterfly Wing -->
        <path d="M142,165 C205,105 238,135 218,182 C208,202 172,198 145,186 Z" fill="url(#wingFairyGrad)" stroke="#FFFFFF" stroke-width="2.5"/>
        <path d="M145,186 C198,192 218,232 192,248 C170,260 148,225 140,198 Z" fill="url(#wingFairyGrad)" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="194" cy="162" r="8" fill="#FFF59D" opacity="0.7"/>
      </g>`;
    case 'angel_feathers':
      return `
      <g class="avatar-wings">
        <path d="M115,165 C55,120 25,155 38,205 C55,205 70,222 88,215 C98,212 110,195 118,185 Z" fill="#FFFFFF" stroke="#E1F5FE" stroke-width="3"/>
        <path d="M145,165 C205,120 235,155 222,205 C205,205 190,222 172,215 C162,212 150,195 142,185 Z" fill="#FFFFFF" stroke="#E1F5FE" stroke-width="3"/>
      </g>`;
    case 'dragonfly_wings':
      return `
      <g class="avatar-wings">
        <ellipse cx="72" cy="158" rx="52" ry="18" transform="rotate(-22 72 158)" fill="#84FFFF" fill-opacity="0.65" stroke="#00E5FF" stroke-width="2.5"/>
        <ellipse cx="78" cy="192" rx="44" ry="15" transform="rotate(14 78 192)" fill="#B388FF" fill-opacity="0.65" stroke="#7C4DFF" stroke-width="2.5"/>
        <ellipse cx="188" cy="158" rx="52" ry="18" transform="rotate(22 188 158)" fill="#84FFFF" fill-opacity="0.65" stroke="#00E5FF" stroke-width="2.5"/>
        <ellipse cx="182" cy="192" rx="44" ry="15" transform="rotate(-14 182 192)" fill="#B388FF" fill-opacity="0.65" stroke="#7C4DFF" stroke-width="2.5"/>
      </g>`;
    case 'royal_cape':
      return `
      <path d="M96,154 L66,282 Q130,302 194,282 L164,154 Z" fill="#D50000" stroke="#FFD700" stroke-width="4"/>
      <path d="M92,154 Q130,168 168,154" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" fill="none"/>`;
    case 'rainbow_halo':
      return `
      <g class="avatar-wings">
        <circle cx="130" cy="165" r="82" fill="none" stroke="#FF80AB" stroke-width="6" opacity="0.55"/>
        <circle cx="130" cy="165" r="76" fill="none" stroke="#FFD54F" stroke-width="6" opacity="0.55"/>
        <circle cx="130" cy="165" r="70" fill="none" stroke="#69F0AE" stroke-width="6" opacity="0.55"/>
        <circle cx="130" cy="165" r="64" fill="none" stroke="#40C4FF" stroke-width="6" opacity="0.55"/>
      </g>`;
    default:
      return '';
  }
}

function renderBackHairLayer(style, color) {
  switch (style) {
    case 'princess_waves':
      return `<path d="M74,88 C58,135 64,210 82,235 C105,245 155,245 178,235 C196,210 202,135 186,88 Z" fill="${color}"/>`;
    case 'mermaid_curls':
      return `
      <path d="M72,88 C45,145 55,230 78,258 C110,270 150,270 182,258 C205,230 215,145 188,88 Z" fill="${color}"/>
      <circle cx="72" cy="235" r="16" fill="${color}"/>
      <circle cx="188" cy="235" r="16" fill="${color}"/>`;
    case 'space_buns':
      return `
      <circle cx="76" cy="58" r="24" fill="${color}"/>
      <circle cx="184" cy="58" r="24" fill="${color}"/>
      <circle cx="76" cy="58" r="24" fill="none" stroke="#FFF" stroke-width="2" opacity="0.3"/>`;
    case 'fairy_braids':
      return `
      <path d="M82,115 C68,155 68,200 76,228" stroke="${color}" stroke-width="20" stroke-linecap="round" fill="none"/>
      <path d="M178,115 C192,155 192,200 184,228" stroke="${color}" stroke-width="20" stroke-linecap="round" fill="none"/>
      <circle cx="76" cy="230" r="8" fill="#FF80AB"/>
      <circle cx="184" cy="230" r="8" fill="#FF80AB"/>`;
    case 'star_ponytail':
      return `
      <path d="M168,72 C212,68 226,125 204,175 C190,158 182,120 168,95 Z" fill="${color}"/>`;
    case 'royal_bob':
    default:
      return `<path d="M74,88 C64,125 70,152 90,158 L170,158 C190,152 196,125 186,88 Z" fill="${color}"/>`;
  }
}

function renderFrontHairLayer(style, color) {
  return `
    <!-- Full Volume Crown & Sweeping Side Bangs -->
    <path d="M80,98 C76,48 184,48 180,98 C176,82 162,74 148,79 C139,68 121,68 112,79 C98,74 84,82 80,98 Z" fill="${color}"/>
    <!-- Cute Cheek-Framing Side Locks -->
    <path d="M82,86 C75,105 78,128 89,138 C87,120 88,102 93,86 Z" fill="${color}"/>
    <path d="M178,86 C185,105 182,128 171,138 C173,120 172,102 167,86 Z" fill="${color}"/>
    <!-- Glossy Hair Shine Arc -->
    <path d="M98,66 Q130,55 162,66" stroke="rgba(255,255,255,0.45)" stroke-width="4" stroke-linecap="round" fill="none"/>
  `;
}

function renderDressLayer(dress) {
  switch (dress) {
    case 'ballgown_rose':
      return `
      <g>
        <!-- Full Ballgown Skirt -->
        <path d="M98,192 C64,218 56,268 62,286 Q130,304 198,286 C204,268 196,218 162,192 Z" fill="url(#roseGownGrad)"/>
        <!-- Tulle Peplum Overlays -->
        <path d="M96,192 Q80,226 105,232 Q130,215 130,195" fill="#FF80AB" opacity="0.85"/>
        <path d="M164,192 Q180,226 155,232 Q130,215 130,195" fill="#FF80AB" opacity="0.85"/>
        <!-- Golden Trim & Sparkles -->
        <path d="M65,278 Q130,295 195,278" stroke="url(#goldGrad)" stroke-width="4" fill="none"/>
        <!-- Bodice & Puff Sleeves -->
        <circle cx="94" cy="164" r="14" fill="#FF80AB"/>
        <circle cx="166" cy="164" r="14" fill="#FF80AB"/>
        <path d="M98,152 L162,152 L156,196 L104,196 Z" fill="#FF4081"/>
        <path d="M114,152 L130,188 L146,152" stroke="url(#goldGrad)" stroke-width="3" fill="none"/>
        <circle cx="130" cy="166" r="6" fill="#FFD700"/>
      </g>`;
    case 'fairy_petal':
      return `
      <g>
        <path d="M100,190 L68,262 Q95,275 112,248 Q130,282 148,248 Q165,275 192,262 L160,190 Z" fill="url(#fairyGownGrad)"/>
        <path d="M96,190 Q82,232 110,238 Q130,255 150,238 Q178,232 164,190 Z" fill="#FF80AB" opacity="0.85"/>
        <path d="M98,152 L162,152 L156,194 L104,194 Z" fill="#00E676"/>
        <circle cx="130" cy="192" r="9" fill="#FF4081"/>
        <circle cx="130" cy="192" r="4" fill="#FFD740"/>
      </g>`;
    case 'mermaid_shimmer':
      return `
      <g>
        <path d="M102,192 C88,235 94,268 108,284 L152,284 C166,268 172,235 158,192 Z" fill="url(#mermaidGownGrad)"/>
        <!-- Mermaid Tail Fin Ruffle -->
        <path d="M106,278 C75,288 68,308 98,306 C116,304 126,294 130,286 C134,294 144,304 162,306 C192,308 185,288 154,278 Z" fill="#EA80FC"/>
        <!-- Seashell Bodice -->
        <path d="M98,152 L162,152 L156,194 L104,194 Z" fill="#00E5FF"/>
        <ellipse cx="116" cy="168" rx="13" ry="11" fill="#EA80FC"/>
        <ellipse cx="144" cy="168" rx="13" ry="11" fill="#EA80FC"/>
        <circle cx="130" cy="192" r="6" fill="#FFF59D"/>
      </g>`;
    case 'crystal_ice':
      return `
      <g>
        <path d="M82,160 L54,284 L206,284 L178,160 Z" fill="#E1F5FE" opacity="0.55"/>
        <path d="M98,192 L68,286 Q130,300 192,286 L162,192 Z" fill="url(#iceGownGrad)"/>
        <path d="M98,152 L162,152 L156,194 L104,194 Z" fill="#80D8FF"/>
        <!-- Snowflake Emblem -->
        <path d="M130,160 L130,184 M118,172 L142,172 M122,164 L138,180 M138,164 L122,180" stroke="#FFFFFF" stroke-width="2.5"/>
      </g>`;
    case 'unicorn_cozy':
      return `
      <g>
        <path d="M96,152 L164,152 L182,256 Q130,268 78,256 Z" fill="url(#unicornGownGrad)"/>
        <circle cx="94" cy="164" r="13" fill="#FF80AB"/>
        <circle cx="166" cy="164" r="13" fill="#84FFFF"/>
        <!-- Rainbow Heart on Tunic -->
        <path d="M112,206 A18,18 0 0,1 148,206" stroke="#FF4081" stroke-width="5" fill="none"/>
        <path d="M116,206 A14,14 0 0,1 144,206" stroke="#FFD740" stroke-width="5" fill="none"/>
        <path d="M120,206 A10,10 0 0,1 140,206" stroke="#00E5FF" stroke-width="5" fill="none"/>
      </g>`;
    case 'starlight_hero':
      return `
      <g>
        <path d="M90,154 L68,266 L192,266 L170,154 Z" fill="#FF4081"/>
        <path d="M98,152 L162,152 L158,202 L102,202 Z" fill="#7C4DFF"/>
        <path d="M92,198 L78,244 L182,244 L168,198 Z" fill="#FFD740"/>
        <polygon points="130,160 134,171 146,171 136,178 140,189 130,182 120,189 124,178 114,171 126,171" fill="#FFD700"/>
      </g>`;
    case 'sunshine_explorer':
      return `
      <g>
        <rect x="96" y="152" width="68" height="44" rx="10" fill="#FFFFFF"/>
        <path d="M100,154 L160,154 L172,252 L88,252 Z" fill="#FFD740"/>
        <rect x="114" y="182" width="32" height="26" rx="6" fill="#FF80AB"/>
        <circle cx="130" cy="195" r="7" fill="#FFF59D"/>
      </g>`;
    case 'royal_velvet':
    default:
      return `
      <g>
        <path d="M98,192 C66,225 62,272 68,288 Q130,304 192,288 C198,272 194,225 162,192 Z" fill="#D50000"/>
        <path d="M118,192 L106,292 L154,292 L142,192 Z" fill="#FFF8E1"/>
        <path d="M98,152 L162,152 L156,194 L104,194 Z" fill="#B71C1C"/>
        <path d="M90,154 Q130,170 170,154" stroke="#FFD700" stroke-width="7" stroke-linecap="round" fill="none"/>
      </g>`;
  }
}

function renderShoesLayer(shoes) {
  switch (shoes) {
    case 'glass_slippers':
      return `
      <g>
        <ellipse cx="114" cy="303" rx="14" ry="8" fill="#B3E5FC" stroke="#00E5FF" stroke-width="2"/>
        <ellipse cx="146" cy="303" rx="14" ry="8" fill="#B3E5FC" stroke="#00E5FF" stroke-width="2"/>
        <circle cx="110" cy="300" r="4" fill="#FFFFFF"/>
        <circle cx="150" cy="300" r="4" fill="#FFFFFF"/>
      </g>`;
    case 'fairy_sandals':
      return `
      <g>
        <path d="M108,270 L122,282 M122,270 L108,282 M138,270 L152,282 M152,270 L138,282" stroke="#FF80AB" stroke-width="3"/>
        <ellipse cx="114" cy="303" rx="14" ry="7" fill="#FF4081"/>
        <ellipse cx="146" cy="303" rx="14" ry="7" fill="#FF4081"/>
      </g>`;
    case 'rainbow_sneakers':
      return `
      <g>
        <rect x="98" y="292" width="28" height="16" rx="8" fill="#00E5FF" stroke="#FFFFFF" stroke-width="2.5"/>
        <rect x="134" y="292" width="28" height="16" rx="8" fill="#FF4081" stroke="#FFFFFF" stroke-width="2.5"/>
      </g>`;
    case 'unicorn_boots':
      return `
      <g>
        <rect x="103" y="274" width="22" height="32" rx="8" fill="#EA80FC" stroke="#FFD700" stroke-width="2"/>
        <rect x="135" y="274" width="22" height="32" rx="8" fill="#EA80FC" stroke="#FFD700" stroke-width="2"/>
      </g>`;
    case 'golden_heels':
      return `
      <g>
        <ellipse cx="114" cy="303" rx="14" ry="8" fill="url(#goldGrad)"/>
        <ellipse cx="146" cy="303" rx="14" ry="8" fill="url(#goldGrad)"/>
      </g>`;
    default:
      return `
      <g>
        <ellipse cx="114" cy="303" rx="14" ry="8" fill="#FF1744"/>
        <ellipse cx="146" cy="303" rx="14" ry="8" fill="#FF1744"/>
      </g>`;
  }
}

function renderHatLayer(hat) {
  switch (hat) {
    case 'diamond_tiara':
      return `
      <g>
        <path d="M98,58 L108,34 L120,50 L130,24 L140,50 L152,34 L162,58 Z" fill="url(#goldGrad)" stroke="#FFA000" stroke-width="2"/>
        <circle cx="130" cy="42" r="5.5" fill="#FF4081"/>
        <circle cx="112" cy="48" r="3.5" fill="#00E5FF"/>
        <circle cx="148" cy="48" r="3.5" fill="#00E5FF"/>
      </g>`;
    case 'flower_crown':
      return `
      <g>
        <circle cx="96" cy="60" r="10" fill="#FF80AB"/>
        <circle cx="113" cy="54" r="11" fill="#FFD54F"/>
        <circle cx="130" cy="52" r="12" fill="#FF4081"/>
        <circle cx="147" cy="54" r="11" fill="#84FFFF"/>
        <circle cx="164" cy="60" r="10" fill="#EA80FC"/>
        <circle cx="130" cy="52" r="5" fill="#FFF59D"/>
      </g>`;
    case 'unicorn_horn':
      return `
      <g>
        <path d="M92,62 L82,36 L106,52 Z" fill="#FFFFFF" stroke="#FF80AB" stroke-width="2.5"/>
        <path d="M168,62 L178,36 L154,52 Z" fill="#FFFFFF" stroke="#FF80AB" stroke-width="2.5"/>
        <polygon points="122,56 130,12 138,56" fill="url(#goldGrad)" stroke="#FFA000" stroke-width="2"/>
        <circle cx="118" cy="56" r="8" fill="#FF80AB"/>
        <circle cx="142" cy="56" r="8" fill="#84FFFF"/>
      </g>`;
    case 'witch_hat':
      return `
      <g>
        <ellipse cx="130" cy="58" rx="54" ry="12" fill="#5E35B1"/>
        <path d="M98,56 L134,6 L162,56 Z" fill="#7E57C2"/>
        <path d="M100,52 Q130,60 160,52" stroke="#FFD700" stroke-width="6" fill="none"/>
        <circle cx="132" cy="34" r="5" fill="#FFD700"/>
      </g>`;
    case 'kitty_ears':
      return `
      <g>
        <polygon points="84,68 90,34 114,54" fill="#FF80AB" stroke="#FFFFFF" stroke-width="2.5"/>
        <polygon points="176,68 170,34 146,54" fill="#FF80AB" stroke="#FFFFFF" stroke-width="2.5"/>
      </g>`;
    case 'royal_bow':
      return `
      <g>
        <path d="M130,50 L94,30 L98,64 Z" fill="#FF4081"/>
        <path d="M130,50 L166,30 L162,64 Z" fill="#FF4081"/>
        <circle cx="130" cy="49" r="9" fill="#FF80AB"/>
      </g>`;
    default:
      return '';
  }
}

function renderWandLayer(wand) {
  switch (wand) {
    case 'star_wand':
      return `
      <g class="avatar-wand">
        <line x1="204" y1="202" x2="226" y2="128" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round"/>
        <polygon points="226,104 233,118 248,120 237,130 240,145 226,137 212,145 215,130 204,120 219,118" fill="url(#goldGrad)" stroke="#FFFFFF" stroke-width="2"/>
      </g>`;
    case 'heart_scepter':
      return `
      <g class="avatar-wand">
        <line x1="204" y1="202" x2="224" y2="132" stroke="#FF80AB" stroke-width="6" stroke-linecap="round"/>
        <circle cx="224" cy="126" r="16" fill="#FF4081" stroke="#FFD700" stroke-width="3"/>
        <circle cx="220" cy="121" r="5" fill="#FFFFFF" opacity="0.7"/>
      </g>`;
    case 'bunny_plush':
      return `
      <g class="avatar-wand">
        <ellipse cx="212" cy="166" rx="6" ry="15" fill="#FFF" stroke="#FF80AB" stroke-width="2"/>
        <ellipse cx="226" cy="166" rx="6" ry="15" fill="#FFF" stroke="#FF80AB" stroke-width="2"/>
        <circle cx="219" cy="188" r="16" fill="#FFFFFF" stroke="#F8BBD0" stroke-width="2"/>
        <circle cx="214" cy="186" r="2.5" fill="#333"/>
        <circle cx="224" cy="186" r="2.5" fill="#333"/>
        <circle cx="219" cy="190" r="3" fill="#FF80AB"/>
      </g>`;
    case 'rainbow_ribbon':
      return `
      <g class="avatar-wand">
        <line x1="204" y1="200" x2="218" y2="160" stroke="#FFF" stroke-width="4"/>
        <path d="M218,160 C255,140 190,110 238,85 C262,72 215,48 242,35" stroke="url(#rainbowHairGrad)" stroke-width="8" stroke-linecap="round" fill="none"/>
      </g>`;
    case 'ice_cream':
      return `
      <g class="avatar-wand">
        <polygon points="204,185 228,185 216,218" fill="#FFB74D"/>
        <circle cx="216" cy="178" r="13" fill="#FF80AB"/>
        <circle cx="216" cy="162" r="11" fill="#84FFFF"/>
        <circle cx="216" cy="150" r="5" fill="#FF1744"/>
      </g>`;
    case 'magic_lantern':
      return `
      <g class="avatar-wand">
        <rect x="206" y="172" width="24" height="30" rx="8" fill="#FFF59D" stroke="#FFB300" stroke-width="3"/>
        <circle cx="218" cy="187" r="7" fill="#FFFFFF"/>
      </g>`;
    default:
      return '';
  }
}

// ============================================================================
// Magical Baby Pet SVG Renderer (Used in Pet Spa & Wonder Island Hub)
// Supports Lumi Unicorn, Mochi Kitten, Puff Dragon, Pip Bunny + live states!
// ============================================================================

export const PET_CATALOG = [
  { id: 'unicorn', name: 'Lumi Unicorn', emoji: '🦄', color: '#FF80AB' },
  { id: 'kitten',  name: 'Mochi Kitten', emoji: '🐱', color: '#FFB74D' },
  { id: 'dragon',  name: 'Puff Dragon',  emoji: '🐲', color: '#40C4FF' },
  { id: 'bunny',   name: 'Pip Bunny',    emoji: '🐰', color: '#EA80FC' }
];

export function renderPetSVG(petId = 'unicorn', opts = {}) {
  const {
    mood = 'happy',      // 'happy' | 'open_mouth' | 'sleepy' | 'sad'
    dirtyLevel = 0,      // 0..100
    foamLevel = 0,       // 0..100
    hasBooBoo = false,
    puffed = false
  } = opts;

  const bodyColors = {
    unicorn: { main: '#FFFFFF', accent: '#FF80AB', ear: '#FCE4EC', belly: '#FCE4EC' },
    kitten:  { main: '#FFF3E0', accent: '#FFB74D', ear: '#FFCCBC', belly: '#FFFFFF' },
    dragon:  { main: '#B3E5FC', accent: '#7C4DFF', ear: '#80D8FF', belly: '#E1F5FE' },
    bunny:   { main: '#F3E5F5', accent: '#EA80FC', ear: '#F8BBD0', belly: '#FFFFFF' }
  };
  const c = bodyColors[petId] || bodyColors.unicorn;
  const scaleRx = puffed ? 76 : 64;

  return `
  <svg viewBox="0 0 240 250" class="wonder-pet-svg pet-${petId} mood-${mood}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="petBodyGrad_${petId}" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="100%" stop-color="${c.main}"/>
      </radialGradient>
    </defs>

    <!-- Ground Shadow -->
    <ellipse cx="120" cy="226" rx="64" ry="12" fill="rgba(0,0,0,0.14)"/>

    <!-- Tail / Back Wings -->
    ${petId === 'dragon' ? `
      <path d="M68,140 C24,105 18,150 48,168 Z" fill="#EA80FC" stroke="#7C4DFF" stroke-width="3"/>
      <path d="M172,140 C216,105 222,150 192,168 Z" fill="#EA80FC" stroke="#7C4DFF" stroke-width="3"/>
    ` : ''}
    <path d="M168,188 C208,175 215,208 182,212" stroke="${c.accent}" stroke-width="14" stroke-linecap="round" fill="none"/>

    <!-- Chubby Sitting Body -->
    <ellipse cx="120" cy="176" rx="${scaleRx}" ry="48" fill="url(#petBodyGrad_${petId})" stroke="${c.accent}" stroke-width="2.5"/>
    <ellipse cx="120" cy="182" rx="36" ry="32" fill="${c.belly}"/>

    <!-- Cute Paws -->
    <ellipse cx="82" cy="214" rx="18" ry="12" fill="${c.main}" stroke="${c.accent}" stroke-width="2"/>
    <ellipse cx="158" cy="214" rx="18" ry="12" fill="${c.main}" stroke="${c.accent}" stroke-width="2"/>
    <ellipse cx="82" cy="216" rx="9" ry="6" fill="${c.accent}" opacity="0.6"/>
    <ellipse cx="158" cy="216" rx="9" ry="6" fill="${c.accent}" opacity="0.6"/>

    <!-- Ears & Horns by Pet Type -->
    ${petId === 'bunny' ? `
      <ellipse cx="86" cy="54" rx="16" ry="38" transform="rotate(-12 86 54)" fill="${c.main}" stroke="${c.accent}" stroke-width="2.5"/>
      <ellipse cx="86" cy="56" rx="9" ry="26" transform="rotate(-12 86 56)" fill="${c.accent}" opacity="0.5"/>
      <ellipse cx="154" cy="54" rx="16" ry="38" transform="rotate(12 154 54)" fill="${c.main}" stroke="${c.accent}" stroke-width="2.5"/>
      <ellipse cx="154" cy="56" rx="9" ry="26" transform="rotate(12 154 56)" fill="${c.accent}" opacity="0.5"/>
    ` : `
      <polygon points="68,84 56,38 98,62" fill="${c.main}" stroke="${c.accent}" stroke-width="2.5"/>
      <polygon points="72,78 64,48 92,64" fill="${c.accent}" opacity="0.55"/>
      <polygon points="172,84 184,38 142,62" fill="${c.main}" stroke="${c.accent}" stroke-width="2.5"/>
      <polygon points="168,78 176,48 148,64" fill="${c.accent}" opacity="0.55"/>
    `}

    <!-- Big Cuddly Head -->
    <ellipse cx="120" cy="105" rx="${puffed ? 70 : 60}" ry="52" fill="url(#petBodyGrad_${petId})" stroke="${c.accent}" stroke-width="2.5"/>

    ${petId === 'unicorn' ? `
      <!-- Rainbow Mane Curl & Golden Horn -->
      <path d="M96,56 C112,38 136,42 146,60 C128,68 110,68 96,56 Z" fill="#FF80AB"/>
      <path d="M106,62 C122,48 142,52 150,66" stroke="#40C4FF" stroke-width="7" stroke-linecap="round" fill="none"/>
      <polygon points="111,56 120,12 129,56" fill="#FFD700" stroke="#FFA000" stroke-width="2"/>
    ` : ''}

    ${petId === 'dragon' ? `
      <!-- Cute Head Crest -->
      <circle cx="120" cy="50" r="9" fill="#FFD740"/>
      <circle cx="105" cy="54" r="6" fill="#FF80AB"/>
      <circle cx="135" cy="54" r="6" fill="#FF80AB"/>
    ` : ''}

    <!-- Rosy Cheeks -->
    <ellipse cx="82" cy="118" rx="12" ry="7" fill="#FF80AB" opacity="0.55"/>
    <ellipse cx="158" cy="118" rx="12" ry="7" fill="#FF80AB" opacity="0.55"/>

    <!-- Eyes (Happy vs Sleepy) -->
    ${mood === 'sleepy' ? `
      <path d="M82,102 Q95,114 108,102" stroke="#37474F" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M132,102 Q145,114 158,102" stroke="#37474F" stroke-width="4" stroke-linecap="round" fill="none"/>
    ` : `
      <g class="pet-eyes">
        <circle cx="94" cy="100" r="14" fill="#263238"/>
        <circle cx="94" cy="100" r="10" fill="#4A148C"/>
        <circle cx="89" cy="95" r="4.5" fill="#FFFFFF"/>
        <circle cx="99" cy="104" r="2.2" fill="#FFFFFF"/>

        <circle cx="146" cy="100" r="14" fill="#263238"/>
        <circle cx="146" cy="100" r="10" fill="#4A148C"/>
        <circle cx="141" cy="95" r="4.5" fill="#FFFFFF"/>
        <circle cx="151" cy="104" r="2.2" fill="#FFFFFF"/>
      </g>
    `}

    <!-- Cute Snout & Mouth -->
    <ellipse cx="120" cy="116" rx="16" ry="11" fill="#FFFFFF"/>
    <ellipse cx="120" cy="112" rx="6" ry="4" fill="#FF80AB"/>
    ${mood === 'open_mouth' ? `
      <ellipse cx="120" cy="128" rx="16" ry="14" fill="#FF5252" stroke="#AD1457" stroke-width="2.5"/>
      <ellipse cx="120" cy="133" rx="10" ry="7" fill="#FF8A80"/>
    ` : mood === 'sad' ? `
      <path d="M110,126 Q120,118 130,126" stroke="#37474F" stroke-width="3" stroke-linecap="round" fill="none"/>
    ` : `
      <path d="M108,120 Q120,130 132,120" stroke="#37474F" stroke-width="3" stroke-linecap="round" fill="none"/>
    `}

    <!-- Boo-Boo Band-Aid Overlay (Doctor mode) -->
    ${hasBooBoo ? `
      <g transform="rotate(-18 148 168)">
        <rect x="130" y="158" width="36" height="18" rx="8" fill="#FFCDD2" stroke="#E57373" stroke-width="2"/>
        <circle cx="148" cy="167" r="5" fill="#FF4081"/>
      </g>
    ` : ''}

    <!-- Mud Splatters Overlay (Bath mode before scrubbing) -->
    ${dirtyLevel > 10 ? `
      <g opacity="${Math.min(1, dirtyLevel / 80)}">
        <circle cx="92" cy="168" r="12" fill="#8D6E63"/>
        <circle cx="102" cy="176" r="7" fill="#8D6E63"/>
        <circle cx="148" cy="128" r="9" fill="#8D6E63"/>
        <circle cx="84" cy="80" r="10" fill="#8D6E63"/>
        <circle cx="144" cy="190" r="11" fill="#8D6E63"/>
      </g>
    ` : ''}

    <!-- Soap Foam Bubbles Overlay (Bath mode while scrubbing) -->
    ${foamLevel > 5 ? `
      <g opacity="${Math.min(1, foamLevel / 75)}">
        <circle cx="88" cy="70" r="18" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
        <circle cx="115" cy="62" r="22" fill="#FCE4EC" stroke="#F8BBD0" stroke-width="2"/>
        <circle cx="144" cy="68" r="19" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
        <circle cx="86" cy="162" r="20" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
        <circle cx="120" cy="168" r="24" fill="#FCE4EC" stroke="#F8BBD0" stroke-width="2"/>
        <circle cx="152" cy="164" r="19" fill="#FFFFFF" stroke="#B3E5FC" stroke-width="2"/>
      </g>
    ` : ''}
  </svg>
  `;
}
