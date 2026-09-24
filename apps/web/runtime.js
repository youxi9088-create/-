/**
 * Player-facing runtime preferences: NPC pacing and audio toggle.
 * Kept out of app.js so localStorage access stays in one auditable place.
 * The E2E override channel (window.__DRESSBATTLE_NPC_DELAY) always wins so
 * tests/e2e can drive the loop without depending on persisted user state.
 */
const STORAGE_KEY = 'dressbattle.runtime.v1';

export const SPEED_STEPS = { fast: 320, normal: 850, slow: 1500 };
export const SPEED_ORDER = ['fast', 'normal', 'slow'];
export const SPEED_LABEL = { fast: '快速', normal: '标准', slow: '慢速' };

const DEFAULTS = { speed: 'normal', sfx: true };
let cache = null;

export function prefs() {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const speed = SPEED_ORDER.includes(raw.speed) ? raw.speed : DEFAULTS.speed;
    cache = { speed, sfx: typeof raw.sfx === 'boolean' ? raw.sfx : DEFAULTS.sfx };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}

export function setPref(key, value) {
  cache = { ...prefs(), [key]: value };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cache)); } catch { /* private mode: keep in-memory only */ }
  return cache;
}

export function cycleSpeed() {
  const current = prefs().speed;
  return setPref('speed', SPEED_ORDER[(SPEED_ORDER.indexOf(current) + 1) % SPEED_ORDER.length]).speed;
}

export function npcDelay() {
  const override = Number(window.__DRESSBATTLE_NPC_DELAY);
  if (Number.isFinite(override) && override > 0) return Math.max(16, override);
  return SPEED_STEPS[prefs().speed] ?? SPEED_STEPS.normal;
}
