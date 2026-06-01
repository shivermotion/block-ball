/**
 * Vibration feedback for Block Ball (Vibration API — mobile / some Android browsers).
 */

const GAME_HAPTIC = {
  minGapMs: 42,
  launchChargeIntervalMs: 150,
  launchChargePulseMin: 6,
  launchChargePulseMax: 16,
};

const PATTERNS = {
  launchChargeStart: 8,
  launchRelease: [16, 45, 28],
  blockHit: 9,
  blockDestroy: [10, 28],
  blockDowngrade: 14,
  blockImmune: 6,
  powerResist: [14, 10, 14],
  powerBounce: [22, 52, 30],
  perfectTiming: [12, 38, 20],
  paddleTap: 12,
  spike: [32, 72, 36],
  lifeLost: [28, 48, 32],
  gameOver: [48, 88, 58],
  enemyHit: 10,
  enemyKill: [12, 30],
  itemCollect: [14, 22, 14],
  bonusCollect: [18, 32, 18],
  levelClear: [20, 36, 20, 52],
  powerMode: [14, 24],
};

let hapticsEnabled = true;
let lastPulseAt = 0;
let lastLaunchChargeAt = 0;

function canGameHaptic() {
  return hapticsEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function setGameHapticsEnabled(on) {
  hapticsEnabled = !!on;
}

function isGameHapticsEnabled() {
  return hapticsEnabled;
}

function hapticRaw(pattern) {
  if (!canGameHaptic() || pattern == null) return false;
  try {
    navigator.vibrate(pattern);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * @param {keyof typeof PATTERNS} name
 * @param {{ force?: boolean }} [opts]
 */
function gameHaptic(name, opts = {}) {
  const pattern = PATTERNS[name];
  if (pattern == null) return;
  const now = performance.now();
  if (!opts.force && now - lastPulseAt < GAME_HAPTIC.minGapMs) return;
  if (hapticRaw(pattern)) lastPulseAt = now;
}

function hapticLaunchChargeStart() {
  lastLaunchChargeAt = 0;
  gameHaptic('launchChargeStart', { force: true });
}

/** @param {number} progress 0–1 */
function hapticLaunchChargeTick(progress) {
  const now = performance.now();
  if (progress < 0.06 || now - lastLaunchChargeAt < GAME_HAPTIC.launchChargeIntervalMs) return;
  lastLaunchChargeAt = now;
  const t = Math.max(0, Math.min(1, progress));
  const ms = Math.round(
    GAME_HAPTIC.launchChargePulseMin + (GAME_HAPTIC.launchChargePulseMax - GAME_HAPTIC.launchChargePulseMin) * t
  );
  if (hapticRaw(ms)) lastPulseAt = now;
}

function hapticLaunchRelease() {
  gameHaptic('launchRelease', { force: true });
  lastLaunchChargeAt = 0;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GAME_HAPTIC,
    setGameHapticsEnabled,
    isGameHapticsEnabled,
    gameHaptic,
    hapticLaunchChargeStart,
    hapticLaunchChargeTick,
    hapticLaunchRelease,
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.setGameHapticsEnabled = setGameHapticsEnabled;
  globalThis.isGameHapticsEnabled = isGameHapticsEnabled;
  globalThis.gameHaptic = gameHaptic;
  globalThis.hapticLaunchChargeStart = hapticLaunchChargeStart;
  globalThis.hapticLaunchChargeTick = hapticLaunchChargeTick;
  globalThis.hapticLaunchRelease = hapticLaunchRelease;
}
