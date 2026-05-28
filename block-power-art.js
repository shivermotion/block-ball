/**
 * Power block rendering — portrait art rotated on its side, stretched to fill cells.
 */
/* global Phaser */

const BLOCK_SLOT_PAD = 2;

function getBlockSlotSize(cellW, cellH, colSpan, rowSpan) {
  return {
    width: Math.max(1, Math.round(colSpan * cellW - BLOCK_SLOT_PAD)),
    height: Math.max(1, Math.round(rowSpan * cellH - BLOCK_SLOT_PAD)),
  };
}

/** @returns {'cw'|'none'|null} */
function getPowerBlockRotate(typeId) {
  if (typeId === 'power_long_v') return 'none';
  if (typeId === 'power' || typeId === 'power_long_h') return 'cw';
  return null;
}

function isPowerBlockType(typeId) {
  return typeId === 'power' || typeId === 'power_long_h' || typeId === 'power_long_v';
}

/**
 * Bake rotated/stretched power textures for 1×1, 2×1, and 1×2 footprints.
 * @param {Phaser.Scene} scene
 */
function bakePowerBlockTextures(scene, cellW, cellH) {
  const srcKey = 'block_power';
  if (!scene.textures.exists(srcKey)) return;

  const src = scene.textures.get(srcKey).getSourceImage();
  if (!src) return;

  const specs = [
    { key: 'block_power', colSpan: 1, rowSpan: 1, rotate: 'cw' },
    { key: 'block_power_long_h', colSpan: 2, rowSpan: 1, rotate: 'cw' },
    { key: 'block_power_long_v', colSpan: 1, rowSpan: 2, rotate: 'none' },
  ];

  for (const spec of specs) {
    const { width: w, height: h } = getBlockSlotSize(cellW, cellH, spec.colSpan, spec.rowSpan);
    if (scene.textures.exists(spec.key)) {
      scene.textures.remove(spec.key);
    }

    const canvasTex = scene.textures.createCanvas(spec.key, w, h);
    const ctx = canvasTex.getContext();
    ctx.clearRect(0, 0, w, h);

    if (spec.rotate === 'cw') {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(src, -h / 2, -w / 2, h, w);
      ctx.restore();
    } else {
      ctx.drawImage(src, 0, 0, w, h);
    }

    canvasTex.refresh();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BLOCK_SLOT_PAD,
    getBlockSlotSize,
    getPowerBlockRotate,
    isPowerBlockType,
    bakePowerBlockTextures,
  };
}
