/**
 * Power block rendering — procedural textures sized to each footprint.
 */
/* global Phaser */

const BLOCK_SLOT_PAD = 2;

const POWER_BLOCK_COLORS = {
  fill: 0x6b7280,
  border: 0x374151,
  glow: 0xffe66d,
};

function getBlockSlotSize(cellW, cellH, colSpan, rowSpan) {
  return {
    width: Math.max(1, Math.round(colSpan * cellW - BLOCK_SLOT_PAD)),
    height: Math.max(1, Math.round(rowSpan * cellH - BLOCK_SLOT_PAD)),
  };
}

function isPowerBlockType(typeId) {
  return typeId === 'power' || typeId === 'power_long_h' || typeId === 'power_long_v';
}

function drawPowerBlockGraphics(g, w, h) {
  const pad = 2;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  g.clear();
  g.fillStyle(POWER_BLOCK_COLORS.border, 1);
  g.fillRoundedRect(0, 0, innerW, innerH, 4);
  g.fillStyle(POWER_BLOCK_COLORS.fill, 1);
  g.fillRoundedRect(2, 2, innerW - 4, innerH - 4, 3);
  g.lineStyle(2, POWER_BLOCK_COLORS.glow, 0.85);
  g.strokeRoundedRect(4, 4, innerW - 8, innerH - 8, 3);
  g.fillStyle(POWER_BLOCK_COLORS.glow, 0.35);
  g.fillRect(6, 6, innerW - 12, Math.max(4, innerH * 0.2));
}

/**
 * Bake procedural power textures for 1×1, 2×1, and 1×2 footprints.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Graphics} [sharedGfx]
 */
function bakePowerBlockTextures(scene, cellW, cellH, sharedGfx) {
  const g = sharedGfx ?? scene.make.graphics({ x: 0, y: 0, add: false });

  const specs = [
    { key: 'block_power', colSpan: 1, rowSpan: 1 },
    { key: 'block_power_long_h', colSpan: 2, rowSpan: 1 },
    { key: 'block_power_long_v', colSpan: 1, rowSpan: 2 },
  ];

  for (const spec of specs) {
    const { width: w, height: h } = getBlockSlotSize(cellW, cellH, spec.colSpan, spec.rowSpan);
    if (scene.textures.exists(spec.key)) {
      scene.textures.remove(spec.key);
    }
    drawPowerBlockGraphics(g, w, h);
    g.generateTexture(spec.key, w, h);
  }

  if (!sharedGfx) g.destroy();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BLOCK_SLOT_PAD,
    POWER_BLOCK_COLORS,
    getBlockSlotSize,
    isPowerBlockType,
    bakePowerBlockTextures,
  };
}
