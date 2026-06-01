/**
 * Arcade-style floating score labels when blocks, enemies, or items are cleared.
 */
/* global Phaser */

const FLOAT_SCORE_DEFAULTS = {
  rise: 44,
  duration: 880,
  fontSize: 18,
  color: '#ffee44',
  stroke: '#3a0080',
  strokeThickness: 4,
  depth: 55,
  yOffset: 10,
};

function useDomScorePopups() {
  return Boolean(document.getElementById('three-overlay'));
}

function ensureGameFxOverlay(scene) {
  const parent = document.getElementById('game-container');
  const canvas = scene?.game?.canvas;
  if (!parent || !canvas) return null;

  scene.scale?.updateBounds?.();

  let fx = document.getElementById('game-fx-overlay');
  if (!fx) {
    fx = document.createElement('div');
    fx.id = 'game-fx-overlay';
    parent.appendChild(fx);
  }
  applyGameFxOverlayBox(fx, canvas, parent);
  return fx;
}

function applyGameFxOverlayBox(fx, canvas, parent) {
  if (!fx || !canvas || !parent) return;
  const canvasRect = canvas.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  fx.style.position = 'absolute';
  fx.style.left = `${canvasRect.left - parentRect.left}px`;
  fx.style.top = `${canvasRect.top - parentRect.top}px`;
  fx.style.width = `${canvasRect.width}px`;
  fx.style.height = `${canvasRect.height}px`;
  fx.style.margin = '0';
  fx.style.padding = '0';
  fx.style.pointerEvents = 'none';
  fx.style.zIndex = '3';
  fx.style.overflow = 'visible';
}

/** @param {{ offsetLeft: number, offsetTop: number, displayW: number, displayH: number }} layout */
function syncGameFxOverlayLayout(layout, parent = document.getElementById('game-container')) {
  if (!layout || !parent) return;
  let fx = document.getElementById('game-fx-overlay');
  if (!fx) {
    fx = document.createElement('div');
    fx.id = 'game-fx-overlay';
    parent.appendChild(fx);
  }
  fx.style.position = 'absolute';
  fx.style.left = `${layout.offsetLeft}px`;
  fx.style.top = `${layout.offsetTop}px`;
  fx.style.width = `${layout.displayW}px`;
  fx.style.height = `${layout.displayH}px`;
  fx.style.margin = '0';
  fx.style.padding = '0';
  fx.style.pointerEvents = 'none';
  fx.style.zIndex = '3';
  fx.style.overflow = 'visible';
}

function worldToFxOverlay(scene, worldX, worldY) {
  const overlay = ensureGameFxOverlay(scene);
  const cam = scene.cameras?.main;
  const scale = scene.scale;
  if (!overlay || !cam || !scale) return null;

  const view = cam.worldView;
  if (!view.width || !view.height) return null;

  let sx = ((worldX - view.x) / view.width) * cam.width;
  let sy = ((worldY - view.y) / view.height) * cam.height;

  const shakeX = cam._shakeOffsetX ?? cam.shakeOffsetX ?? 0;
  const shakeY = cam._shakeOffsetY ?? cam.shakeOffsetY ?? 0;
  sx += shakeX;
  sy += shakeY;

  const gameW = scale.gameSize.width;
  const gameH = scale.gameSize.height;
  const displayW = overlay.clientWidth;
  const displayH = overlay.clientHeight;
  const scaleX = displayW / gameW;
  const scaleY = displayH / gameH;

  return {
    x: Math.round(sx * scaleX),
    y: Math.round(sy * scaleY),
    scaleX,
    scaleY,
  };
}

function spawnDomFloatingScore(scene, x, y, label, cfg) {
  const pos = worldToFxOverlay(scene, x, y - cfg.yOffset);
  const overlay = ensureGameFxOverlay(scene);
  if (!pos || !overlay) return null;

  const el = document.createElement('div');
  el.className = 'score-float-label';
  el.textContent = label;
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;
  el.style.fontSize = `${cfg.fontSize * pos.scaleY}px`;
  el.style.color = cfg.color;
  el.style.setProperty('-webkit-text-stroke', `${cfg.strokeThickness * pos.scaleY}px ${cfg.stroke}`);
  el.style.setProperty('--rise', `${cfg.rise * pos.scaleY}px`);
  overlay.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.add('score-float-label--animate');
    el.style.animationDuration = `${cfg.duration}ms`;
  });

  window.setTimeout(() => {
    el.remove();
  }, cfg.duration + 150);

  return el;
}

function formatFloatingScore(points) {
  return `+${Math.floor(points)}`;
}

/**
 * @param {Phaser.Scene} scene
 * @param {number} x — world x (entity center)
 * @param {number} y — world y (entity center)
 * @param {number} points — must be > 0 to spawn
 * @param {object} [options]
 * @returns {Phaser.GameObjects.Text|null}
 */
function spawnFloatingScore(scene, x, y, points, options = {}) {
  const pts = Math.floor(points);
  const label = options.label ?? (pts > 0 ? formatFloatingScore(pts) : null);
  if (!scene || (!label && pts <= 0)) return null;

  const cfg = { ...FLOAT_SCORE_DEFAULTS, ...options };
  const y0 = y - cfg.yOffset;

  if (useDomScorePopups()) {
    return spawnDomFloatingScore(scene, x, y, label, cfg);
  }

  const text = scene.add
    .text(x, y0, label, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: `${cfg.fontSize}px`,
      fontStyle: 'bold',
      color: cfg.color,
      stroke: cfg.stroke,
      strokeThickness: cfg.strokeThickness,
    })
    .setOrigin(0.5, 1)
    .setDepth(cfg.depth)
    .setScale(0.65);

  scene.tweens.add({
    targets: text,
    scale: 1,
    duration: 110,
    ease: 'Back.easeOut',
  });

  scene.tweens.add({
    targets: text,
    y: y0 - cfg.rise,
    alpha: 0,
    duration: cfg.duration,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      if (text.active) text.destroy();
    },
  });

  return text;
}

/**
 * Apply HUD score and optional world popup (global rule for destroys/collects).
 * @param {Phaser.Scene} scene — GameScene with addScore()
 * @param {number} points
 * @param {number} worldX
 * @param {number} worldY
 * @param {object} [popupOptions] — passed to spawnFloatingScore
 */
function awardPointsAt(scene, points, worldX, worldY, popupOptions) {
  const pts = Math.floor(points);
  if (pts <= 0 || worldX == null || worldY == null) return;
  if (typeof scene.addScore === 'function') {
    scene.addScore(pts);
  } else {
    scene.score = (scene.score || 0) + pts;
  }
  spawnFloatingScore(scene, worldX, worldY, pts, popupOptions);
}

/** Non-scoring hint (e.g. power block resist). */
function spawnFloatingHint(scene, x, y, label, options = {}) {
  return spawnFloatingScore(scene, x, y, 0, { ...options, label });
}

const ScorePopup = {
  FLOAT_SCORE_DEFAULTS,
  formatFloatingScore,
  spawnFloatingScore,
  spawnFloatingHint,
  awardPointsAt,
  syncGameFxOverlayLayout,
  useDomScorePopups,
};

if (typeof window !== 'undefined') {
  window.syncGameFxOverlayLayout = syncGameFxOverlayLayout;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScorePopup;
}
