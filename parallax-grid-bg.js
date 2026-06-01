/**
 * Parallax black-lined grid background for the playfield.
 */
/* global Phaser */

const GRID_TEXTURE_KEYS = {
  fine: 'parallax_grid_fine_d',
  coarse: 'parallax_grid_coarse_d',
};

const GRID_BG = {
  fill: '#f6f6f6',
  line: '#111111',
};

/** @param {Phaser.Scene} scene */
function ensureParallaxGridTextures(scene) {
  if (scene.textures.exists(GRID_TEXTURE_KEYS.fine)) return;

  const makeTile = (key, cellSize, lineWidth, alpha) => {
    const tex = scene.textures.createCanvas(key, cellSize, cellSize);
    const ctx = tex.getContext();
    ctx.fillStyle = GRID_BG.fill;
    ctx.fillRect(0, 0, cellSize, cellSize);
    ctx.strokeStyle = GRID_BG.line;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0.5, 0);
    ctx.lineTo(0.5, cellSize);
    ctx.moveTo(0, 0.5);
    ctx.lineTo(cellSize, 0.5);
    ctx.stroke();
    ctx.globalAlpha = 1;
    tex.refresh();
  };

  makeTile(GRID_TEXTURE_KEYS.fine, 12, 1, 0.2);
  makeTile(GRID_TEXTURE_KEYS.coarse, 36, 1, 0.34);
}

/**
 * @param {Phaser.Scene} scene
 * @param {number} width
 * @param {number} height
 */
function createParallaxGridBackground(scene, width, height) {
  ensureParallaxGridTextures(scene);

  const base = scene.add.rectangle(width / 2, height / 2, width, height, 0xf6f6f6).setDepth(-100);
  const far = scene.add
    .tileSprite(0, 0, width, height, GRID_TEXTURE_KEYS.fine)
    .setOrigin(0, 0)
    .setDepth(-99)
    .setScrollFactor(0);
  const near = scene.add
    .tileSprite(0, 0, width, height, GRID_TEXTURE_KEYS.coarse)
    .setOrigin(0, 0)
    .setDepth(-98)
    .setScrollFactor(0);

  const parallax = {
    base,
    far,
    near,
    drift: 0,
    width,
    height,
  };
  scene.parallaxGrid = parallax;
  return parallax;
}

/**
 * @param {Phaser.Scene} scene
 * @param {number} delta
 */
function updateParallaxGridBackground(scene, delta) {
  const grid = scene.parallaxGrid;
  if (!grid) return;

  const { width, height } = scene.scale;
  if (grid.width !== width || grid.height !== height) {
    grid.width = width;
    grid.height = height;
    grid.base.setPosition(width / 2, height / 2);
    grid.base.setSize(width, height);
    grid.far.setSize(width, height);
    grid.near.setSize(width, height);
  }

  grid.drift += delta * 0.004;
  grid.far.tilePositionX = grid.drift * 0.35;
  grid.far.tilePositionY = grid.drift * 0.22;
  grid.near.tilePositionX = grid.drift * 0.75;
  grid.near.tilePositionY = grid.drift * 0.48;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GRID_BG,
    ensureParallaxGridTextures,
    createParallaxGridBackground,
    updateParallaxGridBackground,
  };
}
