/**
 * Block Ball — Ability block art (gravel texture tiles).
 */
/* global Phaser */

const ABILITY_GRAVEL_URL = 'assets/blocks/ability-gravel.png?v=1';
const ABILITY_MOB_ICON_URL = 'assets/blocks/ability-mob-icon.png?v=2';

/** Match three-overlay TILED_BLOCK_TEXTURE_ZOOM for consistent 2D/3D scale. */
const ABILITY_TEXTURE_ZOOM = 2.4;
/** Icon size as fraction of inner block face (matches 3D overlay). */
const ABILITY_MOB_ICON_SCALE = 2;
/** Pixels at or above this RGB level become transparent (knocks out white backdrop). */
const ABILITY_MOB_ICON_WHITE_THRESHOLD = 242;
/** Dark grey-beige ink — replaces black line art. */
const ABILITY_MOB_ICON_INK = { r: 74, g: 66, b: 58 };
/** Hit flash — icon ink shifts toward white. */
const ABILITY_MOB_ICON_INK_WHITE = { r: 255, g: 252, b: 248 };

let abilityGravelImage = null;
let abilityGravelImagePromise = null;
let abilityMobIconSourceImage = null;
let abilityMobIconImage = null;
let abilityMobIconWhiteImage = null;
let abilityMobIconImagePromise = null;

function isAbilityBlockType(typeId) {
  return typeId === 'ability' || typeId === 'ability_long_h' || typeId === 'ability_long_v';
}

function loadAbilityGravelImage() {
  if (abilityGravelImage) return Promise.resolve(abilityGravelImage);
  if (abilityGravelImagePromise) return abilityGravelImagePromise;

  abilityGravelImagePromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      abilityGravelImage = img;
      resolve(img);
    };
    img.onerror = () => {
      console.warn('[BlockBall] ability gravel image failed to load:', ABILITY_GRAVEL_URL);
      resolve(null);
    };
    img.src = ABILITY_GRAVEL_URL;
  });

  return abilityGravelImagePromise;
}

/**
 * Copy an image to a canvas: knock out white, recolor ink to dark grey-beige.
 * @param {CanvasImageSource} img
 * @param {number} [threshold]
 * @param {{ r: number, g: number, b: number }} [ink]
 * @returns {HTMLCanvasElement}
 */
function removeWhiteFromImageSource(
  img,
  threshold = ABILITY_MOB_ICON_WHITE_THRESHOLD,
  ink = ABILITY_MOB_ICON_INK
) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const softBand = 28;
  const { r: inkR, g: inkG, b: inkB } = ABILITY_MOB_ICON_INK;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const lum = (r + g + b) / 3;

    if (min >= threshold) {
      px[i + 3] = 0;
      continue;
    }

    let ink = Math.max(0, Math.min(1, (255 - lum) / 255));

    if (max >= threshold - softBand && lum >= threshold - softBand) {
      const whiteFade = Math.max(0, Math.min(1, (threshold - lum) / softBand));
      ink *= whiteFade;
    }

    if (ink < 0.04) {
      px[i + 3] = 0;
      continue;
    }

    const shade = 0.78 + 0.22 * ink;
    px[i] = Math.round(inkR * shade);
    px[i + 1] = Math.round(inkG * shade);
    px[i + 2] = Math.round(inkB * shade);
    px[i + 3] = Math.round(255 * Math.min(1, ink * 1.05));
  }

  ctx.putImageData(data, 0, 0);
  return canvas;
}

function loadAbilityMobIconImage() {
  if (abilityMobIconImage) return Promise.resolve(abilityMobIconImage);
  if (abilityMobIconImagePromise) return abilityMobIconImagePromise;

  abilityMobIconImagePromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      abilityMobIconSourceImage = img;
      abilityMobIconImage = removeWhiteFromImageSource(img);
      abilityMobIconWhiteImage = removeWhiteFromImageSource(img, ABILITY_MOB_ICON_WHITE_THRESHOLD, ABILITY_MOB_ICON_INK_WHITE);
      resolve(abilityMobIconImage);
    };
    img.onerror = () => {
      console.warn('[BlockBall] ability mob icon failed to load:', ABILITY_MOB_ICON_URL);
      resolve(null);
    };
    img.src = ABILITY_MOB_ICON_URL;
  });

  return abilityMobIconImagePromise;
}

function loadAbilityBlockAssets() {
  return Promise.all([loadAbilityGravelImage(), loadAbilityMobIconImage()]);
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawAbilityGravelCanvas(ctx, w, h, img) {
  const pad = typeof BLOCK_SLOT_PAD !== 'undefined' ? BLOCK_SLOT_PAD : 2;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  const r = typeof blockProceduralRadii === 'function' ? blockProceduralRadii(innerW, innerH) : { outer: 6 };

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  roundRectPath(ctx, pad, pad, innerW, innerH, r.outer);
  ctx.clip();

  if (img) {
    const unit = Math.min(innerW, innerH);
    const tileW = (unit / ABILITY_TEXTURE_ZOOM) * (innerW / unit);
    const tileH = (unit / ABILITY_TEXTURE_ZOOM) * (innerH / unit);
    for (let y = pad - tileH; y < pad + innerH + tileH; y += tileH) {
      for (let x = pad - tileW; x < pad + innerW + tileW; x += tileW) {
        ctx.drawImage(img, x, y, tileW, tileH);
      }
    }
  } else {
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(pad, pad, innerW, innerH);
  }

  ctx.restore();

  ctx.strokeStyle = 'rgba(42, 28, 16, 0.55)';
  ctx.lineWidth = 2;
  roundRectPath(ctx, pad + 1, pad + 1, innerW - 2, innerH - 2, Math.max(2, r.outer - 1));
  ctx.stroke();
}

function drawAbilityMobIconOnCanvas(ctx, w, h, iconImg) {
  if (!iconImg) return;
  const pad = typeof BLOCK_SLOT_PAD !== 'undefined' ? BLOCK_SLOT_PAD : 2;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  const size = Math.min(innerW, innerH) * ABILITY_MOB_ICON_SCALE;
  ctx.drawImage(iconImg, (w - size) / 2, (h - size) / 2, size, size);
}

function drawAbilityBlockCanvas(ctx, w, h, gravelImg, iconImg) {
  drawAbilityGravelCanvas(ctx, w, h, gravelImg);
  drawAbilityMobIconOnCanvas(ctx, w, h, iconImg);
}

function buildAbilityGravelBlockCanvas(cellW, cellH, colSpan = 1, rowSpan = 1) {
  const { width: w, height: h } = getBlockSlotSize(cellW, cellH, colSpan, rowSpan);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawAbilityGravelCanvas(canvas.getContext('2d'), w, h, abilityGravelImage);
  return canvas;
}

function buildAbilityMobIconOverlayCanvas(cellW, cellH, white = false) {
  const iconImg = white ? abilityMobIconWhiteImage : abilityMobIconImage;
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  drawAbilityMobIconOnCanvas(canvas.getContext('2d'), cellW, cellH, iconImg);
  return canvas;
}

function buildAbilityBlockCanvas(cellW, cellH, colSpan = 1, rowSpan = 1) {
  const { width: w, height: h } = getBlockSlotSize(cellW, cellH, colSpan, rowSpan);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawAbilityBlockCanvas(canvas.getContext('2d'), w, h, abilityGravelImage, abilityMobIconImage);
  return canvas;
}

/**
 * Bake gravel block textures + separate mob icon overlays (2D hit FX).
 */
function bakeAbilityBlockTextures(scene, cellW, cellH, _sharedGfx) {
  const specs = [
    { key: 'block_ability', colSpan: 1, rowSpan: 1 },
    { key: 'block_ability_long_h', colSpan: 2, rowSpan: 1 },
    { key: 'block_ability_long_v', colSpan: 1, rowSpan: 2 },
  ];

  for (const spec of specs) {
    if (scene.textures.exists(spec.key)) {
      scene.textures.remove(spec.key);
    }
    const canvas = buildAbilityGravelBlockCanvas(cellW, cellH, spec.colSpan, spec.rowSpan);
    scene.textures.addCanvas(spec.key, canvas);
  }

  for (const { key, white } of [
    { key: 'block_ability_mob_icon', white: false },
    { key: 'block_ability_mob_icon_white', white: true },
  ]) {
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
    const canvas = buildAbilityMobIconOverlayCanvas(cellW, cellH, white);
    scene.textures.addCanvas(key, canvas);
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.ABILITY_GRAVEL_URL = ABILITY_GRAVEL_URL;
  globalThis.ABILITY_MOB_ICON_URL = ABILITY_MOB_ICON_URL;
  globalThis.isAbilityBlockType = isAbilityBlockType;
  globalThis.loadAbilityGravelImage = loadAbilityGravelImage;
  globalThis.loadAbilityMobIconImage = loadAbilityMobIconImage;
  globalThis.loadAbilityBlockAssets = loadAbilityBlockAssets;
  globalThis.ABILITY_MOB_ICON_INK = ABILITY_MOB_ICON_INK;
  globalThis.ABILITY_MOB_ICON_INK_WHITE = ABILITY_MOB_ICON_INK_WHITE;
  globalThis.ABILITY_MOB_ICON_SCALE = ABILITY_MOB_ICON_SCALE;
  globalThis.removeWhiteFromImageSource = removeWhiteFromImageSource;
  Object.defineProperty(globalThis, 'abilityMobIconWhiteImage', {
    get: () => abilityMobIconWhiteImage,
  });
  globalThis.drawAbilityGravelCanvas = drawAbilityGravelCanvas;
  globalThis.buildAbilityGravelBlockCanvas = buildAbilityGravelBlockCanvas;
  globalThis.buildAbilityMobIconOverlayCanvas = buildAbilityMobIconOverlayCanvas;
  globalThis.drawAbilityMobIconOnCanvas = drawAbilityMobIconOnCanvas;
  globalThis.drawAbilityBlockCanvas = drawAbilityBlockCanvas;
  globalThis.buildAbilityBlockCanvas = buildAbilityBlockCanvas;
  globalThis.bakeAbilityBlockTextures = bakeAbilityBlockTextures;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ABILITY_GRAVEL_URL,
    ABILITY_MOB_ICON_URL,
    isAbilityBlockType,
    loadAbilityGravelImage,
    loadAbilityMobIconImage,
    loadAbilityBlockAssets,
    removeWhiteFromImageSource,
    drawAbilityGravelCanvas,
    drawAbilityMobIconOnCanvas,
    drawAbilityBlockCanvas,
    buildAbilityBlockCanvas,
    bakeAbilityBlockTextures,
  };
}
