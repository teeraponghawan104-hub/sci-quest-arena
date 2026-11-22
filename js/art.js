/* =========================================================================
 * Sci-Quest! — Custom Vector Art Library (Zero-Emoji Studio Illustration Set)
 * -------------------------------------------------------------------------
 * 16 Custom Mascot Avatars • 9 Multi-Tone Power-Up Emblems • 4 Film Emblems
 * Hero Game-Show Vectors (Crown, Medals, Mystery Chest, Hammer, Sponge,
 * Smoke Clouds, Brand Atom) + Crisp 24x24 UI Control Icons.
 * Pure inline cel-shaded SVG (no <defs> ID collisions, 0 network requests,
 * 4K / Retina crisp, 200+ concurrent player safe).
 * ========================================================================= */
const SQA_ART = (() => {
  const INK = '#1e1b2e';

  /* Helper to wrap viewBox="0 0 64 64" artwork */
  const svg64 = (inner, size = 48, cls = '') =>
    `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="sqa-svg ${cls}" aria-hidden="true" focusable="false">${inner}</svg>`;

  /* Helper to wrap viewBox="0 0 24 24" UI icons */
  const svg24 = (inner, size = 18, cls = '') =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" class="sqa-svg ${cls}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;

  /* =====================================================================
   * 16 CUSTOM ILLUSTRATED MASCOT AVATARS (index 0..15)
   * ===================================================================== */
  const AVATAR_SVGS = [
    /* 0: Fox (จิ้งจอกวิทย์) */
    `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M12 12 L25 22 L13 32 Z" fill="#ff7a1a"/>
      <path d="M52 12 L39 22 L51 32 Z" fill="#ff7a1a"/>
      <path d="M16 17 L22 22 L16 27 Z" fill="#fff4e0" stroke="none"/>
      <path d="M48 17 L42 22 L48 27 Z" fill="#fff4e0" stroke="none"/>
      <path d="M12 34 C12 22 21 17 32 17 C43 17 52 22 52 34 C52 46 42 54 32 54 C22 54 12 46 12 34 Z" fill="#ff7a1a"/>
      <path d="M13 36 C19 36 25 40 32 53 C39 40 45 36 51 36 C50 47 41 54 32 54 C23 54 14 47 13 36 Z" fill="#fff7eb" stroke="none"/>
      <path d="M12 34 C12 22 21 17 32 17 C43 17 52 22 52 34 C52 46 42 54 32 54 C22 54 12 46 12 34 Z" fill="none"/>
      <ellipse cx="23" cy="35" rx="3.4" ry="4" fill="${INK}" stroke="none"/>
      <ellipse cx="41" cy="35" rx="3.4" ry="4" fill="${INK}" stroke="none"/>
      <circle cx="24.2" cy="33.5" r="1.3" fill="#fff" stroke="none"/>
      <circle cx="42.2" cy="33.5" r="1.3" fill="#fff" stroke="none"/>
      <ellipse cx="18" cy="40.5" rx="3" ry="1.8" fill="#ff9ca8" opacity="0.7" stroke="none"/>
      <ellipse cx="46" cy="40.5" rx="3" ry="1.8" fill="#ff9ca8" opacity="0.7" stroke="none"/>
      <path d="M28.5 42.5 L35.5 42.5 L32 46.8 Z" fill="${INK}" stroke="none"/>
      <path d="M27.5 48 Q32 51.5 36.5 48" fill="none" stroke="${INK}" stroke-width="2.2"/>
    </g>`,

    /* 1: Panda (แพนด้าแล็บ) */
    `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="16" cy="17" r="8" fill="#232234"/>
      <circle cx="48" cy="17" r="8" fill="#232234"/>
      <circle cx="16" cy="17" r="3.5" fill="#4b4a67" stroke="none"/>
      <circle cx="48" cy="17" r="3.5" fill="#4b4a67" stroke="none"/>
      <ellipse cx="32" cy="36" rx="22" ry="19.5" fill="#ffffff"/>
      <path d="M13 39 C15 48 23 53 32 53 C41 53 49 48 51 39 C47 45 40 49 32 49 C24 49 17 45 13 39 Z" fill="#e5e7eb" stroke="none"/>
      <ellipse cx="22.5" cy="35" rx="6.2" ry="7.4" transform="rotate(-16 22.5 35)" fill="#232234" stroke="none"/>
      <ellipse cx="41.5" cy="35" rx="6.2" ry="7.4" transform="rotate(16 41.5 35)" fill="#232234" stroke="none"/>
      <circle cx="23.5" cy="34.2" r="2.7" fill="#fff" stroke="none"/>
      <circle cx="40.5" cy="34.2" r="2.7" fill="#fff" stroke="none"/>
      <circle cx="24" cy="34.5" r="1.4" fill="${INK}" stroke="none"/>
      <circle cx="40" cy="34.5" r="1.4" fill="${INK}" stroke="none"/>
      <circle cx="24.6" cy="33.5" r="0.8" fill="#fff" stroke="none"/>
      <circle cx="40.6" cy="33.5" r="0.8" fill="#fff" stroke="none"/>
      <ellipse cx="16.5" cy="42.5" rx="3.2" ry="2" fill="#fda4af" stroke="none"/>
      <ellipse cx="47.5" cy="42.5" rx="3.2" ry="2" fill="#fda4af" stroke="none"/>
      <ellipse cx="32" cy="41.5" rx="4" ry="2.7" fill="#232234" stroke="none"/>
      <path d="M27.5 46 Q32 50 36.5 46" fill="none" stroke="${INK}" stroke-width="2.3"/>
    </g>`,

    /* 2: Frog (กบนักคิด) */
    `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="20" cy="20" r="10" fill="#65d637"/>
      <circle cx="44" cy="20" r="10" fill="#65d637"/>
      <ellipse cx="32" cy="38" rx="22.5" ry="17" fill="#65d637"/>
      <ellipse cx="32" cy="45" rx="16.5" ry="9" fill="#d9f99d" stroke="none"/>
      <circle cx="20" cy="20" r="6.2" fill="#ffffff"/>
      <circle cx="44" cy="20" r="6.2" fill="#ffffff"/>
      <circle cx="21" cy="20.5" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="43" cy="20.5" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="22.2" cy="19" r="1.3" fill="#fff" stroke="none"/>
      <circle cx="44.2" cy="19" r="1.3" fill="#fff" stroke="none"/>
      <ellipse cx="16.5" cy="38" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.65" stroke="none"/>
      <ellipse cx="47.5" cy="38" rx="3.6" ry="2.2" fill="#fb7185" opacity="0.65" stroke="none"/>
      <circle cx="28.5" cy="35" r="1.3" fill="${INK}" stroke="none"/>
      <circle cx="35.5" cy="35" r="1.3" fill="${INK}" stroke="none"/>
      <path d="M19 41 Q32 51 45 41" fill="none" stroke="${INK}" stroke-width="2.8"/>
    </g>`,

    /* 3: Unicorn (ยูนิคอร์นสายรุ้ง) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M16 25 L13 13 L25 20 Z" fill="#fff0f6"/>
      <path d="M48 25 L51 13 L39 20 Z" fill="#fff0f6"/>
      <path d="M17.5 22.5 L16 16 L22.5 20 Z" fill="#f472b6" stroke="none"/>
      <path d="M46.5 22.5 L48 16 L41.5 20 Z" fill="#f472b6" stroke="none"/>
      <path d="M27 23 L32 6 L37 23 Z" fill="#fbbf24"/>
      <path d="M29 18 L35 16 M28 21.5 L36 19.5" stroke="#d97706" stroke-width="1.8"/>
      <ellipse cx="32" cy="38" rx="19" ry="17" fill="#ffffff"/>
      <path d="M19 25 C22 19 30 18 35 23 C39 19 46 21 48 27 C42 25 38 28 33 27 C28 29 23 27 19 25 Z" fill="#ec4899"/>
      <path d="M25 22 C29 19 35 20 38 24 C34 25 29 25 25 22 Z" fill="#38bdf8" stroke="none"/>
      <ellipse cx="32" cy="46.5" rx="13" ry="8.5" fill="#fbcfe8"/>
      <circle cx="23" cy="35.5" r="3.3" fill="${INK}" stroke="none"/>
      <circle cx="41" cy="35.5" r="3.3" fill="${INK}" stroke="none"/>
      <circle cx="24.2" cy="34.2" r="1.3" fill="#fff" stroke="none"/>
      <circle cx="42.2" cy="34.2" r="1.3" fill="#fff" stroke="none"/>
      <circle cx="27.5" cy="45.5" r="1.5" fill="#db2777" stroke="none"/>
      <circle cx="36.5" cy="45.5" r="1.5" fill="#db2777" stroke="none"/>
      <path d="M28 50 Q32 53 36 50" fill="none" stroke="${INK}" stroke-width="2.2"/>
    </g>`,

    /* 4: Octopus (หมึกอัจฉริยะ) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M14 42 C8 46 8 54 14 55 C19 56 21 50 22 47" fill="#f43f5e"/>
      <path d="M50 42 C56 46 56 54 50 55 C45 56 43 50 42 47" fill="#f43f5e"/>
      <path d="M22 45 C19 52 21 57 26 57 C30 57 30 51 31 48" fill="#f43f5e"/>
      <path d="M42 45 C45 52 43 57 38 57 C34 57 34 51 33 48" fill="#f43f5e"/>
      <path d="M13 32 C13 17 21 10 32 10 C43 10 51 17 51 32 C51 42 44 48 32 48 C20 48 13 42 13 32 Z" fill="#fb7185"/>
      <ellipse cx="24" cy="18" rx="5" ry="2.8" transform="rotate(-24 24 18)" fill="#ffe4e6" opacity="0.7" stroke="none"/>
      <circle cx="23.5" cy="32" r="5" fill="#ffffff"/>
      <circle cx="40.5" cy="32" r="5" fill="#ffffff"/>
      <circle cx="24.5" cy="32.5" r="2.7" fill="${INK}" stroke="none"/>
      <circle cx="39.5" cy="32.5" r="2.7" fill="${INK}" stroke="none"/>
      <circle cx="25.5" cy="31.3" r="1.1" fill="#fff" stroke="none"/>
      <circle cx="40.5" cy="31.3" r="1.1" fill="#fff" stroke="none"/>
      <ellipse cx="17.5" cy="38.5" rx="2.8" ry="1.8" fill="#fda4af" stroke="none"/>
      <ellipse cx="46.5" cy="38.5" rx="2.8" ry="1.8" fill="#fda4af" stroke="none"/>
      <path d="M28 40.5 Q32 44.5 36 40.5" fill="none" stroke="${INK}" stroke-width="2.4"/>
    </g>`,

    /* 5: Science Robot (หุ่นยนต์เอไอ) */
    `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <line x1="32" y1="19" x2="32" y2="12" stroke="${INK}" stroke-width="3"/>
      <circle cx="32" cy="10" r="4.2" fill="#facc15"/>
      <rect x="7" y="30" width="6" height="12" rx="3" fill="#f97316"/>
      <rect x="51" y="30" width="6" height="12" rx="3" fill="#f97316"/>
      <rect x="12" y="19" width="40" height="34" rx="10" fill="#e2e8f0"/>
      <path d="M16 22 H48" stroke="#ffffff" stroke-width="2.6" opacity="0.9"/>
      <rect x="17" y="25" width="30" height="19" rx="6" fill="#0f172a"/>
      <circle cx="25.5" cy="34.5" r="4.2" fill="#22d3ee" stroke="none"/>
      <circle cx="38.5" cy="34.5" r="4.2" fill="#22d3ee" stroke="none"/>
      <circle cx="26.8" cy="33" r="1.5" fill="#ffffff" stroke="none"/>
      <circle cx="39.8" cy="33" r="1.5" fill="#ffffff" stroke="none"/>
      <path d="M27 47 H37" stroke="#0f172a" stroke-width="3"/>
      <circle cx="22" cy="47.5" r="1.8" fill="#22c55e" stroke="none"/>
      <circle cx="42" cy="47.5" r="1.8" fill="#ef4444" stroke="none"/>
    </g>`,

    /* 6: Friendly Alien (เอเลี่ยนจิ๋ว) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M23 19 Q19 11 15 11" fill="none" stroke="${INK}" stroke-width="2.8"/>
      <path d="M41 19 Q45 11 49 11" fill="none" stroke="${INK}" stroke-width="2.8"/>
      <circle cx="14.5" cy="11" r="3.6" fill="#fde047"/>
      <circle cx="49.5" cy="11" r="3.6" fill="#fde047"/>
      <path d="M12 31 C12 19 20 15 32 15 C44 15 52 19 52 31 C52 44 42 54 32 54 C22 54 12 44 12 31 Z" fill="#4ade80"/>
      <ellipse cx="24" cy="21" rx="5" ry="2.2" transform="rotate(-18 24 21)" fill="#bbf7d0" stroke="none"/>
      <ellipse cx="22.5" cy="34.5" rx="5.8" ry="7.4" transform="rotate(-12 22.5 34.5)" fill="#0f172a" stroke="none"/>
      <ellipse cx="41.5" cy="34.5" rx="5.8" ry="7.4" transform="rotate(12 41.5 34.5)" fill="#0f172a" stroke="none"/>
      <circle cx="24" cy="32" r="2.2" fill="#fff" stroke="none"/>
      <circle cx="40" cy="32" r="2.2" fill="#fff" stroke="none"/>
      <circle cx="21" cy="37" r="1" fill="#38bdf8" stroke="none"/>
      <circle cx="43" cy="37" r="1" fill="#38bdf8" stroke="none"/>
      <path d="M26 45.5 Q32 50 38 45.5" fill="none" stroke="${INK}" stroke-width="2.4"/>
    </g>`,

    /* 7: Tiger (เสือน้อย) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="15" cy="19" r="7.5" fill="#fb923c"/>
      <circle cx="49" cy="19" r="7.5" fill="#fb923c"/>
      <circle cx="15" cy="19" r="3.8" fill="#fed7aa" stroke="none"/>
      <circle cx="49" cy="19" r="3.8" fill="#fed7aa" stroke="none"/>
      <ellipse cx="32" cy="36" rx="21.5" ry="19" fill="#fb923c"/>
      <path d="M27 18 L29 25 L32 21 L35 25 L37 18" fill="${INK}" stroke="none"/>
      <path d="M12 30 L19 32 L13 36 Z M52 30 L45 32 L51 36 Z" fill="${INK}" stroke="none"/>
      <ellipse cx="32" cy="44" rx="12" ry="8.5" fill="#fff7ed"/>
      <circle cx="23.5" cy="34" r="3.3" fill="${INK}" stroke="none"/>
      <circle cx="40.5" cy="34" r="3.3" fill="${INK}" stroke="none"/>
      <circle cx="24.6" cy="32.7" r="1.2" fill="#fff" stroke="none"/>
      <circle cx="41.6" cy="32.7" r="1.2" fill="#fff" stroke="none"/>
      <path d="M28.5 40.5 L35.5 40.5 L32 44.5 Z" fill="#f43f5e"/>
      <path d="M27 47.5 Q32 51 37 47.5" fill="none" stroke="${INK}" stroke-width="2.2"/>
    </g>`,

    /* 8: Penguin (เพนกวินขั้วโลก) */
    `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="32" cy="34" rx="21" ry="22" fill="#1e293b"/>
      <path d="M32 24 C27 18 16 22 16 34 C16 47 24 54 32 54 C40 54 48 47 48 34 C48 22 37 18 32 24 Z" fill="#ffffff" stroke="none"/>
      <ellipse cx="32" cy="34" rx="21" ry="22" fill="none"/>
      <circle cx="23.5" cy="33" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="40.5" cy="33" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="24.7" cy="31.7" r="1.3" fill="#fff" stroke="none"/>
      <circle cx="41.7" cy="31.7" r="1.3" fill="#fff" stroke="none"/>
      <ellipse cx="18.5" cy="39" rx="3.4" ry="2.1" fill="#fb7185" opacity="0.65" stroke="none"/>
      <ellipse cx="45.5" cy="39" rx="3.4" ry="2.1" fill="#fb7185" opacity="0.65" stroke="none"/>
      <path d="M25.5 39 L32 35.5 L38.5 39 L32 46 Z" fill="#f59e0b"/>
      <path d="M28 39.2 L32 41.2 L36 39.2" fill="none" stroke="#b45309" stroke-width="1.6"/>
    </g>`,

    /* 9: Dino (ไดโนเสาร์) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M20 15 L25 9 L28 16 L34 10 L37 17 L44 13 L44 21" fill="#f97316"/>
      <path d="M13 38 C13 22 22 15 35 15 C46 15 53 22 53 33 C53 41 47 46 39 47 L38 54 L17 54 C14 50 13 44 13 38 Z" fill="#22c55e"/>
      <path d="M16 47 C22 44 30 45 38 47 L38 53 L17 53 Z" fill="#bef264" stroke="none"/>
      <circle cx="28" cy="28" r="4.8" fill="#ffffff"/>
      <circle cx="29.3" cy="28.3" r="2.7" fill="${INK}" stroke="none"/>
      <circle cx="30.4" cy="27.1" r="1.1" fill="#fff" stroke="none"/>
      <circle cx="45" cy="26" r="1.8" fill="#15803d" stroke="none"/>
      <path d="M35 37 Q44 39 51 35" fill="none" stroke="${INK}" stroke-width="2.5"/>
      <path d="M42 38 L44 43 L46.5 37.5" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="22" cy="35" rx="3" ry="1.8" fill="#fda4af" opacity="0.65" stroke="none"/>
    </g>`,

    /* 10: Bee (ผึ้งขยัน) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="14" cy="24" rx="8" ry="5.5" transform="rotate(-25 14 24)" fill="#bae6fd"/>
      <ellipse cx="50" cy="24" rx="8" ry="5.5" transform="rotate(25 50 24)" fill="#bae6fd"/>
      <path d="M25 18 Q22 10 18 10 M39 18 Q42 10 46 10" fill="none" stroke="${INK}" stroke-width="2.6"/>
      <circle cx="17.5" cy="10" r="2.8" fill="${INK}" stroke="none"/>
      <circle cx="46.5" cy="10" r="2.8" fill="${INK}" stroke="none"/>
      <circle cx="32" cy="36" r="19" fill="#facc15"/>
      <path d="M16 26 Q32 21 48 26" fill="none" stroke="${INK}" stroke-width="4.5"/>
      <path d="M15 47 Q32 52 49 47" fill="none" stroke="${INK}" stroke-width="4"/>
      <circle cx="32" cy="36" r="19" fill="none"/>
      <circle cx="24" cy="35" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="40" cy="35" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="25.2" cy="33.7" r="1.3" fill="#fff" stroke="none"/>
      <circle cx="41.2" cy="33.7" r="1.3" fill="#fff" stroke="none"/>
      <ellipse cx="19" cy="40" rx="3" ry="1.8" fill="#fb7185" opacity="0.7" stroke="none"/>
      <ellipse cx="45" cy="40" rx="3" ry="1.8" fill="#fb7185" opacity="0.7" stroke="none"/>
      <path d="M27.5 41 Q32 45 36.5 41" fill="none" stroke="${INK}" stroke-width="2.3"/>
    </g>`,

    /* 11: Professor Owl (นกฮูกศาสตราจารย์) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M14 23 L12 12 L24 19 Z" fill="#92400e"/>
      <path d="M50 23 L52 12 L40 19 Z" fill="#92400e"/>
      <ellipse cx="32" cy="36" rx="21" ry="19.5" fill="#b45309"/>
      <ellipse cx="32" cy="45" rx="13" ry="9" fill="#fde68a" stroke="none"/>
      <circle cx="22.5" cy="33" r="8.5" fill="#ffffff" stroke="#fbbf24" stroke-width="3"/>
      <circle cx="41.5" cy="33" r="8.5" fill="#ffffff" stroke="#fbbf24" stroke-width="3"/>
      <line x1="31" y1="33" x2="33" y2="33" stroke="#fbbf24" stroke-width="3"/>
      <circle cx="23" cy="33" r="3.6" fill="${INK}" stroke="none"/>
      <circle cx="41" cy="33" r="3.6" fill="${INK}" stroke="none"/>
      <circle cx="24.2" cy="31.5" r="1.4" fill="#fff" stroke="none"/>
      <circle cx="42.2" cy="31.5" r="1.4" fill="#fff" stroke="none"/>
      <path d="M28.5 39 L35.5 39 L32 45 Z" fill="#f59e0b"/>
    </g>`,

    /* 12: Whale (วาฬน้ำลึก) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M32 22 V12 M32 13 Q26 8 23 13 M32 13 Q38 8 41 13" fill="none" stroke="#7dd3fc" stroke-width="3"/>
      <path d="M10 38 C10 24 20 20 33 20 C44 20 50 27 50 38 C53 35 56 31 58 33 C59 36 55 41 51 43 C54 45 57 49 54 51 C50 52 47 48 45 46 C40 50 32 52 24 52 C14 52 10 46 10 38 Z" fill="#38bdf8"/>
      <path d="M12 43 C19 42 29 42 38 47 C32 51 24 52 18 50 C14 49 12 46 12 43 Z" fill="#e0f2fe" stroke="none"/>
      <path d="M10 38 C10 24 20 20 33 20 C44 20 50 27 50 38 C53 35 56 31 58 33 C59 36 55 41 51 43 C54 45 57 49 54 51 C50 52 47 48 45 46 C40 50 32 52 24 52 C14 52 10 46 10 38 Z" fill="none"/>
      <circle cx="22" cy="35" r="3.4" fill="${INK}" stroke="none"/>
      <circle cx="23.2" cy="33.7" r="1.3" fill="#fff" stroke="none"/>
      <ellipse cx="27" cy="39.5" rx="3" ry="1.8" fill="#fb7185" opacity="0.65" stroke="none"/>
      <path d="M13 42 Q20 45.5 27 42" fill="none" stroke="${INK}" stroke-width="2.3"/>
    </g>`,

    /* 13: Lion (สิงโตเจ้าป่า) */
    `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="14" r="7" fill="#d97706"/>
      <circle cx="44" cy="17" r="7" fill="#d97706"/>
      <circle cx="51" cy="28" r="7" fill="#d97706"/>
      <circle cx="50" cy="41" r="7" fill="#d97706"/>
      <circle cx="41" cy="50" r="7" fill="#d97706"/>
      <circle cx="23" cy="50" r="7" fill="#d97706"/>
      <circle cx="14" cy="41" r="7" fill="#d97706"/>
      <circle cx="13" cy="28" r="7" fill="#d97706"/>
      <circle cx="20" cy="17" r="7" fill="#d97706"/>
      <circle cx="32" cy="34" r="16.5" fill="#fde047"/>
      <circle cx="21" cy="22" r="4.5" fill="#fde047"/>
      <circle cx="43" cy="22" r="4.5" fill="#fde047"/>
      <circle cx="25" cy="33" r="3" fill="${INK}" stroke="none"/>
      <circle cx="39" cy="33" r="3" fill="${INK}" stroke="none"/>
      <circle cx="26" cy="31.8" r="1.2" fill="#fff" stroke="none"/>
      <circle cx="40" cy="31.8" r="1.2" fill="#fff" stroke="none"/>
      <path d="M28.5 38.5 L35.5 38.5 L32 42.5 Z" fill="#92400e"/>
      <path d="M26.5 44.5 Q32 48 37.5 44.5" fill="none" stroke="${INK}" stroke-width="2.2"/>
    </g>`,

    /* 14: Koala (โคอาล่าชิล) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="13" cy="27" r="10.5" fill="#94a3b8"/>
      <circle cx="51" cy="27" r="10.5" fill="#94a3b8"/>
      <circle cx="13.5" cy="27.5" r="5.8" fill="#f1f5f9" stroke="none"/>
      <circle cx="50.5" cy="27.5" r="5.8" fill="#f1f5f9" stroke="none"/>
      <ellipse cx="32" cy="36" rx="18.5" ry="18" fill="#cbd5e1"/>
      <circle cx="22.5" cy="34" r="3.2" fill="${INK}" stroke="none"/>
      <circle cx="41.5" cy="34" r="3.2" fill="${INK}" stroke="none"/>
      <circle cx="23.6" cy="32.7" r="1.2" fill="#fff" stroke="none"/>
      <circle cx="42.6" cy="32.7" r="1.2" fill="#fff" stroke="none"/>
      <ellipse cx="18.5" cy="40" rx="3" ry="1.8" fill="#fda4af" opacity="0.7" stroke="none"/>
      <ellipse cx="45.5" cy="40" rx="3" ry="1.8" fill="#fda4af" opacity="0.7" stroke="none"/>
      <ellipse cx="32" cy="38.5" rx="4.6" ry="6.4" fill="#334155"/>
      <ellipse cx="30.5" cy="36" rx="1.4" ry="2.2" fill="#94a3b8" stroke="none"/>
      <path d="M28 47.5 Q32 50.5 36 47.5" fill="none" stroke="${INK}" stroke-width="2.2"/>
    </g>`,

    /* 15: Space Rocket (จรวดอวกาศ) */
    `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="13" cy="14" r="2.2" fill="#fde047" stroke="none"/>
      <circle cx="52" cy="48" r="2" fill="#fde047" stroke="none"/>
      <path d="M17 47 C13 51 11 56 11 56 C11 56 16 54 20 50 Z" fill="#facc15"/>
      <path d="M18 46 L11 43 L20 33 Z" fill="#ef4444"/>
      <path d="M19 47 L22 54 L32 45 Z" fill="#ef4444"/>
      <path d="M51 13 C42 13 31 19 21 31 L18 46 L33 43 C45 33 51 22 51 13 Z" fill="#ffffff"/>
      <path d="M51 13 C45 13 40 15 36 18 L46 28 C49 24 51 19 51 13 Z" fill="#ef4444"/>
      <circle cx="34" cy="30" r="6.2" fill="#38bdf8"/>
      <circle cx="32.5" cy="28.3" r="2" fill="#e0f2fe" stroke="none"/>
    </g>`
  ];

  /* =====================================================================
   * 9 MULTI-TONE POWER-UP EMBLEMS (viewBox 0 0 64 64)
   * ===================================================================== */
  const ITEM_SVGS = {
    x2: `<g stroke="${INK}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
      <polygon points="36,6 14,35 29,35 23,58 50,27 34,27" fill="#fde047"/>
      <polygon points="33,12 20,31 30,31" fill="#fef9c3" stroke="none"/>
      <rect x="34" y="37" width="24" height="20" rx="5" fill="#1e1b2e"/>
      <text x="46" y="52" text-anchor="middle" fill="#fde047" font-family="Montserrat,sans-serif" font-weight="900" font-size="14" stroke="none">2×</text>
    </g>`,

    shield: `<g stroke="${INK}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M32 7 L53 15 V31 C53 45 43 54 32 58 C21 54 11 45 11 31 V15 Z" fill="#38bdf8"/>
      <path d="M32 7 L53 15 V31 C53 45 43 54 32 58 Z" fill="#0284c7" stroke="none"/>
      <path d="M32 7 L53 15 V31 C53 45 43 54 32 58 C21 54 11 45 11 31 V15 Z" fill="none"/>
      <path d="M32 14 L46 20 V31 C46 41 39 48 32 51 C25 48 18 41 18 31 V20 Z" fill="#e0f2fe" stroke="none" opacity="0.28"/>
      <polygon points="32,20 41,31 32,42 23,31" fill="#ffffff"/>
    </g>`,

    steal: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M23 18 L19 10 L29 13 L35 10 L41 18 Z" fill="#fde047"/>
      <path d="M15 41 C15 28 21 20 32 20 C43 20 49 28 49 41 C49 52 42 57 32 57 C22 57 15 52 15 41 Z" fill="#fbbf24"/>
      <rect x="21" y="16" width="22" height="6" rx="3" fill="#ef4444"/>
      <circle cx="32" cy="39" r="10.5" fill="#fef08a"/>
      <path d="M32 32 V46 M36 35 C34 33 28 33 28 36.5 C28 39.5 36 39 36 42.5 C36 45 30 45.5 28 43.5" fill="none" stroke="${INK}" stroke-width="2.5"/>
    </g>`,

    freeze: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M32 7 V57 M10 19.5 L54 44.5 M54 19.5 L10 44.5" stroke="#e0f2fe" stroke-width="7"/>
      <path d="M32 7 V57 M10 19.5 L54 44.5 M54 19.5 L10 44.5" stroke="#38bdf8" stroke-width="3.2"/>
      <path d="M26 12 L32 18 L38 12 M26 52 L32 46 L38 52" fill="none" stroke="#ffffff" stroke-width="2.8"/>
      <path d="M13 26 L20 25 L18 18 M51 38 L44 39 L46 46" fill="none" stroke="#ffffff" stroke-width="2.8"/>
      <path d="M51 26 L44 25 L46 18 M13 38 L20 39 L18 46" fill="none" stroke="#ffffff" stroke-width="2.8"/>
      <polygon points="32,22 41,27 41,37 32,42 23,37 23,27" fill="#ffffff"/>
      <polygon points="32,26 37,29 37,35 32,38 27,35 27,29" fill="#38bdf8" stroke="none"/>
    </g>`,

    blind: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="22" cy="39" r="13" fill="#c084fc"/>
      <circle cx="43" cy="39" r="12" fill="#a855f7"/>
      <circle cx="32" cy="27" r="14" fill="#d8b4fe"/>
      <circle cx="34" cy="43" r="12" fill="#e9d5ff" stroke="none"/>
      <path d="M13 42 C13 35 19 30 24 31 C24 21 31 15 39 17 C46 18 50 24 49 30 C54 32 56 38 53 44 C50 49 44 51 39 50 C34 54 25 54 21 49 C16 49 13 46 13 42 Z" fill="none"/>
      <path d="M25 32 C25 27 33 27 33 32 C33 36 28 36 28 33" fill="none" stroke="${INK}" stroke-width="2.4"/>
      <path d="M39 39 C39 35 45 35 45 39" fill="none" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="51" cy="14" r="3.5" fill="#a3e635"/>
    </g>`,

    flip: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M14 27 A19 19 0 0 1 48 18" fill="none" stroke="#fef08a" stroke-width="5.5"/>
      <polygon points="51,10 53,23 40,21" fill="#fef08a"/>
      <path d="M50 37 A19 19 0 0 1 16 46" fill="none" stroke="#ffffff" stroke-width="5.5"/>
      <polygon points="13,54 11,41 24,43" fill="#ffffff"/>
      <rect x="24" y="21" width="16" height="22" rx="3.5" fill="#1e1b2e"/>
      <rect x="27" y="24" width="10" height="14" rx="1.5" fill="#38bdf8" stroke="none"/>
      <circle cx="32" cy="40.5" r="1.2" fill="#ffffff" stroke="none"/>
    </g>`,

    zap: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M15 33 C10 33 8 29 9 25 C10 21 14 19 18 20 C20 13 28 10 35 12 C41 13 44 17 45 21 C50 21 55 24 54 29 C53 33 49 34 45 34 Z" fill="#e2e8f0"/>
      <polygon points="36,27 21,44 31,44 26,59 45,39 34,39" fill="#facc15"/>
      <polygon points="34,31 26,41 33,41" fill="#fef9c3" stroke="none"/>
    </g>`,

    boost: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <rect x="25" y="10" width="14" height="6" rx="2.5" fill="#e2e8f0"/>
      <path d="M27 16 V25 L13 48 C11 52 13 56 18 56 H46 C51 56 53 52 51 48 L37 25 V16 Z" fill="#e0f2fe"/>
      <path d="M21 36 H43 L49 48 C50 51 48 54 45 54 H19 C16 54 14 51 15 48 Z" fill="#4ade80" stroke="none"/>
      <path d="M27 16 V25 L13 48 C11 52 13 56 18 56 H46 C51 56 53 52 51 48 L37 25 V16 Z" fill="none"/>
      <circle cx="28" cy="46" r="3" fill="#bbf7d0" stroke="none"/>
      <circle cx="37" cy="43" r="2.2" fill="#bbf7d0" stroke="none"/>
      <circle cx="32" cy="30" r="2.6" fill="#4ade80"/>
      <circle cx="38" cy="21" r="2" fill="#a3e635" stroke="none"/>
    </g>`,

    selfie: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M22 20 L26 14 H38 L42 20 Z" fill="#f5d0fe"/>
      <rect x="9" y="20" width="46" height="33" rx="7" fill="#ffffff"/>
      <rect x="9" y="28" width="46" height="8" fill="#f472b6" stroke="none"/>
      <rect x="9" y="20" width="46" height="33" rx="7" fill="none"/>
      <circle cx="32" cy="36.5" r="11" fill="#1e1b2e"/>
      <circle cx="32" cy="36.5" r="6.8" fill="#38bdf8"/>
      <circle cx="29.5" cy="34" r="2.3" fill="#ffffff" stroke="none"/>
      <polygon points="50,7 52,13 58,15 52,17 50,23 48,17 42,15 48,13" fill="#fde047"/>
    </g>`
  };

  /* =====================================================================
   * 4 FILM TOPIC EMBLEMS (f1..f4)
   * ===================================================================== */
  const FILM_SVGS = {
    f1: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="28" cy="28" r="16" fill="#fef08a"/>
      <circle cx="28" cy="28" r="11" fill="#ffffff" stroke="none"/>
      <path d="M28 20 L30 25 L35 27 L30 29 L28 34 L26 29 L21 27 L26 25 Z" fill="#e21b3c" stroke="none"/>
      <line x1="40" y1="40" x2="54" y2="54" stroke="${INK}" stroke-width="6.5"/>
      <line x1="40" y1="40" x2="54" y2="54" stroke="#ffffff" stroke-width="2.5"/>
    </g>`,

    f2: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="10" y="13" width="44" height="38" rx="8" fill="#ffffff"/>
      <circle cx="32" cy="28" r="7" fill="#38bdf8"/>
      <path d="M20 45 C22 38 42 38 44 45" fill="#38bdf8"/>
      <polygon points="50,7 52,12 57,14 52,16 50,21 48,16 43,14 48,12" fill="#facc15"/>
    </g>`,

    f3: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <rect x="11" y="16" width="42" height="32" rx="10" fill="#ffffff"/>
      <path d="M23 48 L18 56 L30 48" fill="#ffffff"/>
      <path d="M32 41 C24 35 20 31 20 26.5 C20 23 23 21 26 21 C28.5 21 30.5 22.5 32 24.5 C33.5 22.5 35.5 21 38 21 C41 21 44 23 44 26.5 C44 31 40 35 32 41 Z" fill="#ef4444"/>
    </g>`,

    f4: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <rect x="11" y="25" width="7" height="14" rx="3.5" fill="#ffffff"/>
      <rect x="22" y="15" width="7" height="34" rx="3.5" fill="#fde047"/>
      <rect x="33" y="21" width="7" height="22" rx="3.5" fill="#ffffff"/>
      <rect x="44" y="11" width="7" height="42" rx="3.5" fill="#a3e635"/>
    </g>`
  };

  /* =====================================================================
   * HERO ILLUSTRATIONS (64x64)
   * ===================================================================== */
  const HERO_SVGS = {
    giftBox: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M32 21 C22 10 13 13 16 20 C18 24 27 23 32 21 Z" fill="#facc15"/>
      <path d="M32 21 C42 10 51 13 48 20 C46 24 37 23 32 21 Z" fill="#facc15"/>
      <rect x="11" y="28" width="42" height="28" rx="5" fill="#e21b3c"/>
      <rect x="8" y="20" width="48" height="11" rx="4" fill="#ff3355"/>
      <rect x="27" y="20" width="10" height="36" fill="#facc15"/>
      <rect x="11" y="38" width="42" height="7" fill="#facc15"/>
      <circle cx="52" cy="11" r="2.8" fill="#fef08a" stroke="none"/>
      <circle cx="13" cy="12" r="2.2" fill="#38bdf8" stroke="none"/>
    </g>`,

    crown: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M9 46 L13 20 L25 32 L32 14 L39 32 L51 20 L55 46 Z" fill="#facc15"/>
      <rect x="10" y="45" width="44" height="9" rx="3.5" fill="#eab308"/>
      <circle cx="13" cy="18" r="3.6" fill="#fef08a"/>
      <circle cx="32" cy="12" r="4.2" fill="#fef08a"/>
      <circle cx="51" cy="18" r="3.6" fill="#fef08a"/>
      <circle cx="32" cy="38" r="3.8" fill="#e21b3c"/>
      <circle cx="20" cy="40" r="2.6" fill="#1368ce"/>
      <circle cx="44" cy="40" r="2.6" fill="#26890c"/>
    </g>`,

    trophy: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M18 16 H9 C9 28 14 33 21 33" fill="none" stroke="#eab308" stroke-width="4.5"/>
      <path d="M46 16 H55 C55 28 50 33 43 33" fill="none" stroke="#eab308" stroke-width="4.5"/>
      <path d="M17 12 H47 V25 C47 36 40 42 32 42 C24 42 17 36 17 25 Z" fill="#facc15"/>
      <rect x="28" y="42" width="8" height="8" fill="#eab308"/>
      <rect x="19" y="49" width="26" height="7" rx="3" fill="#ca8a04"/>
      <polygon points="32,19 34.4,24 39.8,24.6 35.8,28.2 36.8,33.5 32,30.8 27.2,33.5 28.2,28.2 24.2,24.6 29.6,24" fill="#ffffff" stroke="none"/>
    </g>`,

    medal1: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <polygon points="20,6 30,26 21,29 12,10" fill="#e21b3c"/>
      <polygon points="44,6 34,26 43,29 52,10" fill="#1368ce"/>
      <circle cx="32" cy="38" r="19" fill="#facc15"/>
      <circle cx="32" cy="38" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
      <text x="32" y="45" text-anchor="middle" fill="${INK}" font-family="Montserrat,sans-serif" font-weight="900" font-size="22" stroke="none">1</text>
    </g>`,

    medal2: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <polygon points="20,6 30,26 21,29 12,10" fill="#1368ce"/>
      <polygon points="44,6 34,26 43,29 52,10" fill="#0ea5e9"/>
      <circle cx="32" cy="38" r="19" fill="#cbd5e1"/>
      <circle cx="32" cy="38" r="14" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>
      <text x="32" y="45" text-anchor="middle" fill="${INK}" font-family="Montserrat,sans-serif" font-weight="900" font-size="22" stroke="none">2</text>
    </g>`,

    medal3: `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <polygon points="20,6 30,26 21,29 12,10" fill="#26890c"/>
      <polygon points="44,6 34,26 43,29 52,10" fill="#16a34a"/>
      <circle cx="32" cy="38" r="19" fill="#f97316"/>
      <circle cx="32" cy="38" r="14" fill="#fed7aa" stroke="#9a3412" stroke-width="2"/>
      <text x="32" y="45" text-anchor="middle" fill="${INK}" font-family="Montserrat,sans-serif" font-weight="900" font-size="22" stroke="none">3</text>
    </g>`,

    hammer: `<g stroke="${INK}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round" transform="rotate(-35 32 32)">
      <rect x="27" y="25" width="10" height="31" rx="4.5" fill="#d97706"/>
      <rect x="13" y="10" width="38" height="18" rx="6" fill="#38bdf8"/>
      <path d="M18 15 H46" stroke="#e0f2fe" stroke-width="3" opacity="0.85"/>
      <rect x="13" y="10" width="38" height="18" rx="6" fill="none"/>
      <polygon points="52,6 54,11 59,13 54,15 52,20 50,15 45,13 50,11" fill="#fef08a" stroke="none"/>
    </g>`,

    sponge: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <rect x="10" y="20" width="44" height="28" rx="9" transform="rotate(-12 32 34)" fill="#facc15"/>
      <circle cx="23" cy="31" r="2.8" fill="#ca8a04" stroke="none"/>
      <circle cx="36" cy="27" r="2.2" fill="#ca8a04" stroke="none"/>
      <circle cx="43" cy="36" r="3" fill="#ca8a04" stroke="none"/>
      <circle cx="29" cy="40" r="2" fill="#ca8a04" stroke="none"/>
      <circle cx="15" cy="14" r="5" fill="#e0f2fe"/>
      <circle cx="51" cy="15" r="4" fill="#e0f2fe"/>
      <circle cx="54" cy="47" r="4.5" fill="#e0f2fe"/>
    </g>`,

    brandSpark: `<g stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(-30 32 32)" fill="none" stroke="#38bdf8" stroke-width="3.6"/>
      <ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(30 32 32)" fill="none" stroke="#facc15" stroke-width="3.6"/>
      <ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(90 32 32)" fill="none" stroke="#f472b6" stroke-width="3.6"/>
      <circle cx="32" cy="32" r="9" fill="#ffffff"/>
      <polygon points="32,25 34.5,29.8 39.5,32 34.5,34.2 32,39 29.5,34.2 24.5,32 29.5,29.8" fill="#46178f" stroke="none"/>
      <circle cx="53" cy="20" r="3.6" fill="#22c55e"/>
      <circle cx="11" cy="44" r="3.6" fill="#e21b3c"/>
    </g>`,

    funnyFace: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="32" r="23" fill="#facc15"/>
      <circle cx="22" cy="25" r="7" fill="#ffffff"/>
      <circle cx="42" cy="28" r="5.5" fill="#ffffff"/>
      <circle cx="24" cy="23" r="3" fill="${INK}" stroke="none"/>
      <circle cx="40.5" cy="29.5" r="2.6" fill="${INK}" stroke="none"/>
      <path d="M18 39 Q32 49 46 37" fill="#1e1b2e"/>
      <path d="M29 41 C29 51 35 55 39 52 C43 49 41 42 38 40 Z" fill="#fb7185"/>
      <line x1="34.5" y1="42" x2="36" y2="49" stroke="#e11d48" stroke-width="2"/>
    </g>`,

    party: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <polygon points="10,54 24,22 42,40" fill="#facc15"/>
      <path d="M17 38 L29 48 M21 29 L35 42" stroke="#e21b3c" stroke-width="3.5"/>
      <circle cx="42" cy="16" r="4" fill="#38bdf8"/>
      <circle cx="53" cy="26" r="3.5" fill="#4ade80"/>
      <polygon points="32,8 34,14 40,16 34,18 32,24 30,18 24,16 30,14" fill="#f472b6"/>
      <path d="M44 31 Q51 30 55 35" fill="none" stroke="#facc15" stroke-width="3.2"/>
    </g>`,

    pauseIcon: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="32" r="23" fill="#ffa602"/>
      <rect x="21" y="19" width="8" height="26" rx="3" fill="#ffffff"/>
      <rect x="35" y="19" width="8" height="26" rx="3" fill="#ffffff"/>
    </g>`,

    finishFlag: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <line x1="16" y1="10" x2="16" y2="56" stroke="#1e1b2e" stroke-width="4.5"/>
      <rect x="16" y="12" width="36" height="24" rx="3" fill="#ffffff"/>
      <rect x="16" y="12" width="9" height="8" fill="#1e1b2e" stroke="none"/>
      <rect x="34" y="12" width="9" height="8" fill="#1e1b2e" stroke="none"/>
      <rect x="25" y="20" width="9" height="8" fill="#1e1b2e" stroke="none"/>
      <rect x="43" y="20" width="9" height="8" fill="#1e1b2e" stroke="none"/>
      <rect x="16" y="28" width="9" height="8" fill="#1e1b2e" stroke="none"/>
      <rect x="34" y="28" width="9" height="8" fill="#1e1b2e" stroke="none"/>
      <rect x="16" y="12" width="36" height="24" rx="3" fill="none"/>
    </g>`,

    flame: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M34 8 C38 18 49 23 49 36 C49 48 41 56 32 56 C22 56 15 48 15 37 C15 29 20 23 24 20 C23 26 26 29 28 28 C27 20 30 13 34 8 Z" fill="#f97316"/>
      <path d="M33 26 C37 32 41 36 41 42 C41 49 37 53 32 53 C26 53 23 48 23 42 C23 37 27 33 33 26 Z" fill="#fde047" stroke="none"/>
      <ellipse cx="32" cy="46" rx="4.5" ry="5.5" fill="#ffffff" stroke="none" opacity="0.85"/>
    </g>`,

    feverBolt: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="32" r="24" fill="#facc15"/>
      <circle cx="32" cy="32" r="19" fill="#fef08a" stroke="none"/>
      <polygon points="36,11 18,34 31,34 26,53 46,29 33,29" fill="#e21b3c"/>
    </g>`,

    rocketBoost: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M16 48 C11 53 9 57 9 57 C9 57 14 55 19 50 Z" fill="#facc15"/>
      <path d="M18 46 L10 42 L20 31 Z" fill="#f97316"/>
      <path d="M19 47 L23 55 L34 45 Z" fill="#f97316"/>
      <path d="M53 11 C43 11 31 18 20 31 L17 47 L33 44 C46 33 53 21 53 11 Z" fill="#ffffff"/>
      <path d="M53 11 C46 11 41 13 36 17 L47 28 C51 23 53 18 53 11 Z" fill="#26890c"/>
      <circle cx="34" cy="30" r="6.5" fill="#38bdf8"/>
      <circle cx="32.5" cy="28.3" r="2.2" fill="#e0f2fe" stroke="none"/>
    </g>`,

    chaosWheel: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="32" r="23" fill="#864cbf"/>
      <path d="M32 9 A23 23 0 0 1 55 32 L32 32 Z" fill="#e21b3c"/>
      <path d="M55 32 A23 23 0 0 1 32 55 L32 32 Z" fill="#facc15"/>
      <path d="M32 55 A23 23 0 0 1 9 32 L32 32 Z" fill="#26890c"/>
      <path d="M9 32 A23 23 0 0 1 32 9 L32 32 Z" fill="#1368ce"/>
      <circle cx="32" cy="32" r="9" fill="#ffffff"/>
      <polygon points="32,26 34,30 38,32 34,34 32,38 30,34 26,32 30,30" fill="#1e1b2e" stroke="none"/>
    </g>`,

    reactFire: `<g stroke="${INK}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M34 6 C39 17 51 23 51 37 C51 49 42 58 32 58 C21 58 13 49 13 38 C13 29 19 22 24 19 C23 26 26 29 28 28 C27 19 30 12 34 6 Z" fill="#ef4444"/>
      <path d="M33 23 C38 30 43 35 43 42 C43 50 38 55 32 55 C25 55 21 49 21 42 C21 36 26 31 33 23 Z" fill="#f97316" stroke="none"/>
      <path d="M32 34 C35 39 38 42 38 46 C38 51 35 53 32 53 C28 53 26 50 26 46 C26 42 29 39 32 34 Z" fill="#fde047" stroke="none"/>
    </g>`,

    reactLaugh: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="32" r="23" fill="#facc15"/>
      <path d="M17 26 Q22 20 27 26" fill="none" stroke="${INK}" stroke-width="3"/>
      <path d="M37 26 Q42 20 47 26" fill="none" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="14" cy="32" rx="4" ry="2.5" fill="#38bdf8"/>
      <ellipse cx="50" cy="32" rx="4" ry="2.5" fill="#38bdf8"/>
      <path d="M18 35 H46 C46 47 39 51 32 51 C25 51 18 47 18 35 Z" fill="#1e1b2e"/>
      <path d="M23 44 Q32 49 41 44 C39 49 35 51 32 51 C29 51 25 49 23 44 Z" fill="#fb7185" stroke="none"/>
      <rect x="21" y="36" width="22" height="4" rx="1.5" fill="#ffffff" stroke="none"/>
    </g>`,

    reactClap: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M22 10 L20 17 M33 7 L33 14 M44 10 L46 17" stroke="#facc15" stroke-width="3.2"/>
      <path d="M16 36 L26 20 C28 17 32 19 30 22 L25 30 L34 18 C36 15 40 17 38 21 L31 32 L41 21 C43 19 47 22 44 25 L36 36 L44 29 C46 27 49 30 47 33 L36 47 C31 53 22 54 17 48 C13 44 13 40 16 36 Z" fill="#fbbf24"/>
      <path d="M22 41 L32 28 C34 25 38 27 36 30 L31 38 L40 28 C42 25 46 28 43 31 L36 41 L46 33 C48 31 51 34 49 37 L38 51 C33 56 25 56 20 51 C17 48 18 44 22 41 Z" fill="#fde047"/>
    </g>`,

    reactShock: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <circle cx="32" cy="32" r="23" fill="#38bdf8"/>
      <circle cx="32" cy="32" r="20" fill="#7dd3fc" stroke="none"/>
      <circle cx="32" cy="32" r="23" fill="none"/>
      <circle cx="22.5" cy="27" r="6.5" fill="#ffffff"/>
      <circle cx="41.5" cy="27" r="6.5" fill="#ffffff"/>
      <circle cx="23" cy="27" r="2.8" fill="${INK}" stroke="none"/>
      <circle cx="41" cy="27" r="2.8" fill="${INK}" stroke="none"/>
      <ellipse cx="32" cy="43" rx="6.5" ry="8.5" fill="#1e1b2e"/>
      <ellipse cx="32" cy="47" rx="4" ry="3" fill="#fb7185" stroke="none"/>
      <polygon points="52,9 54,14 59,16 54,18 52,23 50,18 45,16 50,14" fill="#fde047"/>
    </g>`,

    bossRaid: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <path d="M12 10 L24 22 L19 27 L9 14 Z" fill="#facc15"/>
      <path d="M52 10 L40 22 L45 27 L55 14 Z" fill="#facc15"/>
      <path d="M15 28 C15 16 23 11 32 11 C41 11 49 16 49 28 C49 38 45 43 42 46 L42 54 H22 L22 46 C19 43 15 38 15 28 Z" fill="#e21b3c"/>
      <path d="M21 20 C25 15 39 15 43 20 C40 18 24 18 21 20 Z" fill="#ff6b81" stroke="none"/>
      <polygon points="19,27 29,31 21,35" fill="#fde047"/>
      <polygon points="45,27 35,31 43,35" fill="#fde047"/>
      <rect x="25" y="42" width="14" height="8" rx="2" fill="#1e1b2e"/>
      <line x1="29" y1="42" x2="29" y2="50" stroke="#ffffff" stroke-width="2.2"/>
      <line x1="35" y1="42" x2="35" y2="50" stroke="#ffffff" stroke-width="2.2"/>
      <polygon points="32,4 35,11 40,9 37,16 27,16 24,9 29,11" fill="#facc15"/>
    </g>`,

    swordHit: `<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <polygon points="52,8 46,24 26,44 18,36 38,16" fill="#38bdf8"/>
      <polygon points="52,8 43,21 24,40 21,37 40,18" fill="#e0f2fe" stroke="none"/>
      <polygon points="52,8 46,24 26,44 18,36 38,16" fill="none"/>
      <path d="M14 31 L31 48 L27 52 L10 35 Z" fill="#facc15"/>
      <path d="M11 49 L19 41 L23 45 L15 53 Z" fill="#d97706"/>
      <circle cx="11" cy="53" r="4.5" fill="#facc15"/>
      <polygon points="18,12 20,17 25,19 20,21 18,26 16,21 11,19 16,17" fill="#fde047"/>
      <polygon points="50,38 52,43 57,45 52,47 50,52 48,47 43,45 48,43" fill="#f472b6"/>
    </g>`
  };

  /* =====================================================================
   * 4 BESPOKE STUDIO CEL-SHADED RAID BOSSES (viewBox 0 0 220 190)
   * Zero <defs> ID collisions, 4K crisp, multi-layer sci-fi/fantasy design
   * ===================================================================== */
  const BOSS_SVGS = {
    /* 1: Dr. Glitch AI — จอมหลอนข้อมูล (Film 1: AI Hallucination Overlord) */
    dr_glitch: `<g stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
      <!-- Cosmic Orbit Rings -->
      <ellipse cx="110" cy="102" rx="92" ry="30" transform="rotate(-10 110 102)" fill="none" stroke="#f472b6" stroke-width="3.5" stroke-dasharray="18 10" opacity="0.8"/>
      <ellipse cx="110" cy="102" rx="88" ry="26" transform="rotate(11 110 102)" fill="none" stroke="#38bdf8" stroke-width="2.8" stroke-dasharray="12 12" opacity="0.75"/>
      <!-- Floating Glitch Shards / Cyber Wings -->
      <polygon points="16,74 52,58 46,96 20,104" fill="#be123c"/>
      <polygon points="24,78 46,68 42,90 26,95" fill="#fb7185" stroke="none"/>
      <polygon points="204,74 168,58 174,96 200,104" fill="#be123c"/>
      <polygon points="196,78 174,68 178,90 194,95" fill="#fb7185" stroke="none"/>
      <polygon points="24,118 54,108 58,136 32,144" fill="#7c3aed"/>
      <polygon points="196,118 166,108 162,136 188,144" fill="#7c3aed"/>
      <!-- Lightning Sparks -->
      <polygon points="48,30 34,50 45,50 38,68 58,44 47,44" fill="#fde047"/>
      <polygon points="172,30 186,50 175,50 182,68 162,44 173,44" fill="#fde047"/>
      <!-- Lower Floating Mech Tail / Thruster -->
      <path d="M84 146 L110 176 L136 146 Z" fill="#4c1d95"/>
      <path d="M95 148 L110 168 L125 148 Z" fill="#38bdf8" stroke="none"/>
      <ellipse cx="110" cy="176" rx="18" ry="5" fill="#f472b6" opacity="0.85" stroke="none"/>
      <!-- Armored Cyber Core Body -->
      <path d="M62 56 L110 38 L158 56 L166 116 L142 150 L78 150 L54 116 Z" fill="#2e1065"/>
      <path d="M72 62 L110 47 L148 62 L154 110 L135 141 L85 141 L66 110 Z" fill="#4c1d95" stroke="none"/>
      <!-- Shoulder Armor Horns -->
      <path d="M56 64 L36 36 L76 48 Z" fill="#e21b3c"/>
      <path d="M164 64 L184 36 L144 48 Z" fill="#e21b3c"/>
      <!-- Cyber Crown -->
      <polygon points="84,45 90,18 103,36 110,12 117,36 130,18 136,45" fill="#facc15"/>
      <circle cx="110" cy="12" r="5" fill="#fef08a"/>
      <circle cx="90" cy="18" r="4" fill="#fef08a"/>
      <circle cx="130" cy="18" r="4" fill="#fef08a"/>
      <!-- Giant Glowing Cyclops Visor Screen -->
      <path d="M70 72 H150 L144 114 H76 Z" fill="#0f172a"/>
      <path d="M75 77 H145 L142 86 H78 Z" fill="#1e293b" stroke="none"/>
      <!-- Glitch Scanlines inside Screen -->
      <line x1="78" y1="90" x2="142" y2="90" stroke="#e21b3c" stroke-width="2" opacity="0.5"/>
      <line x1="80" y1="103" x2="140" y2="103" stroke="#38bdf8" stroke-width="2" opacity="0.5"/>
      <!-- Glowing Crimson Laser Eye -->
      <ellipse cx="110" cy="94" rx="22" ry="15" fill="#e21b3c"/>
      <ellipse cx="110" cy="94" rx="13" ry="10" fill="#fde047" stroke="none"/>
      <ellipse cx="110" cy="94" rx="5.5" ry="9" fill="#1e1b2e" stroke="none"/>
      <circle cx="115" cy="89" r="3.4" fill="#ffffff" stroke="none"/>
      <!-- Jagged Digital Mouth / Reactor -->
      <path d="M84 126 L93 135 L102 126 L110 136 L118 126 L127 135 L136 126" fill="none" stroke="#38bdf8" stroke-width="4.2"/>
      <!-- Floating Data Cubes -->
      <rect x="26" y="42" width="12" height="12" rx="2.5" transform="rotate(18 32 48)" fill="#38bdf8"/>
      <rect x="182" y="42" width="12" height="12" rx="2.5" transform="rotate(-18 188 48)" fill="#f472b6"/>
      <circle cx="110" cy="144" r="5" fill="#fde047"/>
    </g>`,

    /* 2: Phantom Mirage — ราชินีมายาดิจิทัล (Film 2: Virtual Influencer Mirage) */
    mirage_queen: `<g stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
      <!-- Radiant Hologram Halo -->
      <circle cx="110" cy="94" r="76" fill="none" stroke="#38bdf8" stroke-width="3.2" stroke-dasharray="20 8" opacity="0.8"/>
      <circle cx="110" cy="94" r="64" fill="#1e3a8a" opacity="0.32" stroke="none"/>
      <!-- Crystal Prism Wings -->
      <polygon points="14,66 64,46 58,92 22,102" fill="#0ea5e9"/>
      <polygon points="24,70 58,56 54,84 28,92" fill="#7dd3fc" stroke="none"/>
      <polygon points="206,66 156,46 162,92 198,102" fill="#0ea5e9"/>
      <polygon points="196,70 162,56 166,84 192,92" fill="#7dd3fc" stroke="none"/>
      <polygon points="24,112 62,102 68,144 36,154" fill="#c026d3"/>
      <polygon points="34,116 58,109 62,136 42,143" fill="#f0abfc" stroke="none"/>
      <polygon points="196,112 158,102 152,144 184,154" fill="#c026d3"/>
      <polygon points="186,116 162,109 158,136 178,143" fill="#f0abfc" stroke="none"/>
      <!-- Flowing Ethereal Cape / Diamond Base -->
      <path d="M74 134 L110 178 L146 134 Z" fill="#1d4ed8"/>
      <path d="M88 138 L110 166 L132 138 Z" fill="#38bdf8" stroke="none"/>
      <!-- Sculpted Royal Collar & Shoulders -->
      <path d="M62 126 Q110 156 158 126 L146 102 H74 Z" fill="#1e1b2e"/>
      <polygon points="110,122 124,136 110,150 96,136" fill="#f472b6"/>
      <polygon points="110,127 118,136 110,145 102,136" fill="#fbcfe8" stroke="none"/>
      <!-- Regal Crystal Head / Visor Mask -->
      <path d="M68 78 C68 48 86 36 110 36 C134 36 152 48 152 78 C152 108 134 128 110 132 C86 128 68 108 68 78 Z" fill="#f8fafc"/>
      <path d="M75 64 C84 52 96 46 110 46 C124 46 136 52 145 64 C134 60 122 58 110 58 C98 58 86 60 75 64 Z" fill="#e0f2fe" stroke="none"/>
      <!-- Obsidian Masquerade Visor -->
      <path d="M68 74 L92 66 L110 76 L128 66 L152 74 L146 102 L124 106 L110 96 L96 106 L74 102 Z" fill="#0f172a"/>
      <!-- Glowing Neon Dual Eyes -->
      <polygon points="82,84 101,88 86,96" fill="#38bdf8"/>
      <polygon points="138,84 119,88 134,96" fill="#38bdf8"/>
      <circle cx="92" cy="89" r="3" fill="#ffffff" stroke="none"/>
      <circle cx="128" cy="89" r="3" fill="#ffffff" stroke="none"/>
      <!-- Smirk Lip -->
      <path d="M98 113 Q110 120 122 113" fill="none" stroke="#c026d3" stroke-width="3.6"/>
      <!-- Diamond Hologram Tiara -->
      <polygon points="82,46 96,24 110,8 124,24 138,46 122,40 110,48 98,40" fill="#38bdf8"/>
      <polygon points="110,14 118,28 110,40 102,28" fill="#fef08a"/>
      <!-- Levitating Neon Stars -->
      <polygon points="36,30 40,38 48,41 40,44 36,52 32,44 24,41 32,38" fill="#fde047"/>
      <polygon points="184,30 188,38 196,41 188,44 184,52 180,44 172,41 180,38" fill="#f472b6"/>
    </g>`,

    /* 3: Echo Heart — จักรกลหัวใจจำลอง (Film 3: Synthetic Heart Colossus) */
    echo_colossus: `<g stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
      <!-- Golden Halo Ring -->
      <ellipse cx="110" cy="24" rx="46" ry="11" fill="none" stroke="#facc15" stroke-width="5.5"/>
      <ellipse cx="110" cy="24" rx="46" ry="11" fill="none" stroke="#fef9c3" stroke-width="2" stroke-dasharray="16 10"/>
      <!-- Articulated Golden Angelic Mech Wings -->
      <path d="M58 84 L12 42 L22 76 L10 92 L46 108 L26 128 L66 126 Z" fill="#facc15"/>
      <path d="M52 86 L24 58 L30 78 L22 90 L48 102 Z" fill="#fef08a" stroke="none"/>
      <path d="M162 84 L208 42 L198 76 L210 92 L174 108 L194 128 L154 126 Z" fill="#facc15"/>
      <path d="M168 86 L196 58 L190 78 L198 90 L172 102 Z" fill="#fef08a" stroke="none"/>
      <!-- Gilded Mech Torso -->
      <path d="M64 82 L110 68 L156 82 L164 134 L132 168 H88 L56 134 Z" fill="#fff7ed"/>
      <path d="M72 90 L110 78 L148 90 L153 130 L127 159 H93 L67 130 Z" fill="#fde68a" stroke="none"/>
      <!-- Armored Shoulder Pauldrons -->
      <path d="M46 84 C46 66 64 58 82 68 L74 96 L48 98 Z" fill="#d97706"/>
      <path d="M174 84 C174 66 156 58 138 68 L146 96 L172 98 Z" fill="#d97706"/>
      <!-- Head Helm -->
      <path d="M80 42 C80 28 93 22 110 22 C127 22 140 28 140 42 L144 74 L110 86 L76 74 Z" fill="#f59e0b"/>
      <path d="M84 48 H136 L132 68 L110 76 L88 68 Z" fill="#0f172a"/>
      <!-- Expressive Cyan Visor Eyes -->
      <ellipse cx="97" cy="58" rx="7" ry="4.5" fill="#38bdf8"/>
      <ellipse cx="123" cy="58" rx="7" ry="4.5" fill="#38bdf8"/>
      <circle cx="99" cy="56.5" r="2" fill="#ffffff" stroke="none"/>
      <circle cx="125" cy="56.5" r="2" fill="#ffffff" stroke="none"/>
      <!-- Glowing Holographic Heart Core in Chest -->
      <circle cx="110" cy="122" r="28" fill="#1e1b2e"/>
      <circle cx="110" cy="122" r="22" fill="#be185d" opacity="0.45" stroke="none"/>
      <path d="M110 142 C92 130 85 122 85 113 C85 105 91 100 98 100 C103 100 107 103 110 108 C113 103 117 100 122 100 C129 100 135 105 135 113 C135 122 128 130 110 142 Z" fill="#fb7185"/>
      <path d="M95 108 C92 108 90 111 91 114" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.85"/>
      <!-- Heartbeat Pulse Line across Core -->
      <polyline points="86,122 99,122 104,112 111,132 117,118 122,122 134,122" fill="none" stroke="#fef08a" stroke-width="3.2"/>
      <!-- Bottom Hover Thruster -->
      <ellipse cx="110" cy="176" rx="28" ry="6" fill="#facc15" opacity="0.7" stroke="none"/>
    </g>`,

    /* 4: Decibel Titan — ไททันคลื่นเสียงคลั่ง (Film 4: Sonic Boom Titan) */
    decibel_titan: `<g stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
      <!-- Vibrating Sonic Shockwave Arcs -->
      <path d="M16 58 Q4 95 16 132" fill="none" stroke="#4ade80" stroke-width="4.5"/>
      <path d="M28 68 Q19 95 28 122" fill="none" stroke="#38bdf8" stroke-width="3.5"/>
      <path d="M204 58 Q216 95 204 132" fill="none" stroke="#4ade80" stroke-width="4.5"/>
      <path d="M192 68 Q201 95 192 122" fill="none" stroke="#38bdf8" stroke-width="3.5"/>
      <!-- Twin Massive Bass-Cannon Shoulders -->
      <circle cx="48" cy="84" r="30" fill="#14532d"/>
      <circle cx="48" cy="84" r="21" fill="#1e293b"/>
      <circle cx="48" cy="84" r="13" fill="#22c55e"/>
      <circle cx="48" cy="84" r="5.5" fill="#fef08a"/>
      <circle cx="172" cy="84" r="30" fill="#14532d"/>
      <circle cx="172" cy="84" r="21" fill="#1e293b"/>
      <circle cx="172" cy="84" r="13" fill="#22c55e"/>
      <circle cx="172" cy="84" r="5.5" fill="#fef08a"/>
      <!-- Armored Titan Chassis -->
      <path d="M66 64 L110 52 L154 64 L162 132 L140 166 H80 L58 132 Z" fill="#16a34a"/>
      <path d="M74 72 L110 62 L146 72 L152 126 L134 156 H86 L68 126 Z" fill="#22c55e" stroke="none"/>
      <!-- Armored Head & Acoustic Crest -->
      <path d="M84 30 L110 14 L136 30 L142 64 H78 Z" fill="#15803d"/>
      <polygon points="103,14 110,4 117,14 115,36 105,36" fill="#fde047"/>
      <rect x="82" y="38" width="56" height="22" rx="6" fill="#0f172a"/>
      <!-- Intense Laser Eyes -->
      <polygon points="88,45 106,49 91,55" fill="#fde047"/>
      <polygon points="132,45 114,49 129,55" fill="#fde047"/>
      <!-- Giant Chest Equalizer Reactor -->
      <rect x="74" y="80" width="72" height="58" rx="10" fill="#0f172a"/>
      <rect x="82" y="106" width="9" height="24" rx="3" fill="#4ade80" stroke="none"/>
      <rect x="94" y="92" width="9" height="38" rx="3" fill="#fde047" stroke="none"/>
      <rect x="106" y="86" width="9" height="44" rx="3" fill="#38bdf8" stroke="none"/>
      <rect x="118" y="96" width="9" height="34" rx="3" fill="#fde047" stroke="none"/>
      <rect x="130" y="104" width="9" height="26" rx="3" fill="#4ade80" stroke="none"/>
      <!-- Heavy Armored Belt & Lower Glow -->
      <rect x="82" y="144" width="56" height="14" rx="4" fill="#1e293b"/>
      <rect x="98" y="147" width="24" height="8" rx="2" fill="#38bdf8" stroke="none"/>
      <ellipse cx="110" cy="176" rx="34" ry="6" fill="#4ade80" opacity="0.7" stroke="none"/>
    </g>`
  };

  /* =====================================================================
   * CRISP 24x24 UI CONTROL ICONS
   * ===================================================================== */
  const UI_SVGS = {
    clock: `<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/><path d="M12 2v3"/>`,
    speakerOn: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.8 5.5a9.5 9.5 0 0 1 0 13"/>`,
    speakerLow: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>`,
    speakerOff: `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/>`,
    minus: `<line x1="5" y1="12" x2="19" y2="12" stroke-width="2.8"/>`,
    plus: `<line x1="12" y1="5" x2="12" y2="19" stroke-width="2.8"/><line x1="5" y1="12" x2="19" y2="12" stroke-width="2.8"/>`,
    sliders: `<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2.2" fill="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2.2" fill="currentColor"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="18" r="2.2" fill="currentColor"/>`,
    skipNext: `<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19" stroke-width="2.6"/>`,
    flameMini: `<path d="M12.5 2c1.5 3.5 5 5.2 5 9.8A5.5 5.5 0 0 1 12 17.5a5.5 5.5 0 0 1-5.5-5.5c0-2.6 1.5-4.7 3-5.8-.2 1.8.8 2.8 1.5 2.5-.3-2.5.4-4.7 1.5-6.7z" fill="currentColor"/>`,
    music: `<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/>`,
    mic: `<rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>`,
    fullscreen: `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`,
    exitFullscreen: `<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>`,
    dice: `<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none"/>`,
    cards: `<rect x="7" y="4" width="13" height="16" rx="2.5"/><path d="M4 8v10a2.5 2.5 0 0 0 2.5 2.5H15"/><path d="M11 10h5M11 14h3"/>`,
    users: `<circle cx="9" cy="8" r="3.5" fill="currentColor"/><path d="M2.5 20c.5-4 3.2-6.5 6.5-6.5s6 2.5 6.5 6.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14c2.4.5 4.2 2.4 4.8 6"/>`,
    camera: `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`,
    search: `<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
    refresh: `<path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/>`,
    bulb: `<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>`,
    wrench: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
    bolt: `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor"/>`,
    check: `<circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" opacity="0.18"/><polyline points="7 12.5 10.5 16 17.5 9"/>`,
    cross: `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
    sparkles: `<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor"/><path d="M19 3l.7 2L22 5.7l-2.3.7-.7 2.1-.7-2.1L16 5.7l2.3-.7.7-2z" fill="currentColor" stroke="none"/>`,
    star: `<polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.7 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" fill="currentColor"/>`,
    globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/>`,
    phone: `<rect x="6" y="2" width="12" height="20" rx="2.5"/><line x1="10.5" y1="18.5" x2="13.5" y2="18.5"/>`,
    target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>`,
    play: `<polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/>`,
    pause: `<rect x="6" y="4" width="4.5" height="16" rx="1" fill="currentColor"/><rect x="13.5" y="4" width="4.5" height="16" rx="1" fill="currentColor"/>`,
    stop: `<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>`,
    hourglass: `<path d="M6 2h12M6 22h12M7 2v5l5 5-5 5v5M17 2v5l-5 5 5 5v5"/>`,
    send: `<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor"/>`,
    qr: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14v3M14 19h7"/>`,
    gift: `<rect x="3" y="10" width="18" height="11" rx="2"/><rect x="2" y="6" width="20" height="4" rx="1"/><line x1="12" y1="6" x2="12" y2="21"/><path d="M12 6H8.5a2.5 2.5 0 1 1 0-5C11 1 12 6 12 6zM12 6h3.5a2.5 2.5 0 1 0 0-5C13 1 12 6 12 6z"/>`,
    crownMini: `<path d="M3 18L5 8l5 5 2-7 2 7 5-5 2 10H3z" fill="currentColor"/>`,
    trophyMini: `<path d="M6 4h12v5a6 6 0 0 1-12 0V4z" fill="currentColor"/><path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3M12 15v4M8 21h8"/>`
  };

  /* Stylized Smoke Cloud puffs (6 distinct palette variants for blind overlay) */
  const SMOKE_PALETTES = [
    ['#c084fc', '#9333ea'], ['#a78bfa', '#6d28d9'], ['#818cf8', '#4338ca'],
    ['#d8b4fe', '#7e22ce'], ['#67e8f9', '#0e7490'], ['#e879f9', '#a21caf']
  ];

  function smokeSvg(variant = 0, size = 128) {
    const [light, deep] = SMOKE_PALETTES[variant % SMOKE_PALETTES.length];
    return `<svg viewBox="0 0 120 90" width="${size}" height="${Math.round(size * 0.75)}" class="sqa-svg" aria-hidden="true">
      <g stroke="#1e1b2e" stroke-width="3.2" stroke-linejoin="round">
        <path d="M28 70 C14 70 8 60 11 49 C13 40 21 36 28 37 C30 22 44 12 60 14 C73 15 82 23 85 33 C98 31 110 40 109 53 C108 65 98 72 86 70 C79 77 67 79 58 75 C48 80 35 77 28 70 Z" fill="${deep}"/>
        <path d="M32 63 C22 63 17 56 19 48 C21 41 27 38 33 39 C35 27 46 19 59 20 C70 21 78 28 80 36 C90 35 99 42 98 52 C97 61 90 66 80 64 C74 69 64 70 57 67 C49 71 38 69 32 63 Z" fill="${light}" stroke="none"/>
        <path d="M44 40 C44 30 60 30 60 40 C60 46 51 46 51 41" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity="0.72"/>
        <path d="M72 48 C72 42 82 42 82 48" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" opacity="0.55"/>
      </g>
    </svg>`;
  }

  return {
    avatarSvg(idx, size = 44, cls = '') {
      const inner = AVATAR_SVGS[idx] || AVATAR_SVGS[0];
      return svg64(inner, size, cls);
    },
    itemSvg(key, size = 24, cls = '') {
      const inner = ITEM_SVGS[key] || HERO_SVGS.giftBox;
      return svg64(inner, size, cls);
    },
    filmSvg(key, size = 28, cls = '') {
      const inner = FILM_SVGS[key] || FILM_SVGS.f1;
      return svg64(inner, size, cls);
    },
    heroSvg(name, size = 48, cls = '') {
      const inner = HERO_SVGS[name] || HERO_SVGS.giftBox;
      return svg64(inner, size, cls);
    },
    uiSvg(name, size = 16, cls = '') {
      const inner = UI_SVGS[name] || UI_SVGS.star;
      return svg24(inner, size, cls);
    },
    bossSvg(key, width = 200, cls = '') {
      const inner = BOSS_SVGS[key] || BOSS_SVGS.dr_glitch;
      const h = Math.round(width * 190 / 220);
      return `<svg viewBox="0 0 220 190" width="${width}" height="${h}" class="sqa-svg ${cls}" aria-hidden="true" focusable="false">${inner}</svg>`;
    },
    smokeSvg
  };
})();
window.SQA_ART = SQA_ART;
