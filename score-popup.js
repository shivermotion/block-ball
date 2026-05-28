/**
 * Arcade-style floating score labels when blocks, enemies, or items are cleared.
 */
/* global Phaser */

const FLOAT_SCORE_DEFAULTS = {
  rise: 44,
  duration: 880,
  fontSize: 16,
  color: '#ffe66d',
  stroke: '#1a1028',
  strokeThickness: 3,
  depth: 55,
  yOffset: 10,
};

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
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScorePopup;
}
