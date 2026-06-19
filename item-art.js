/**
 * Shared item art — food drops with bg removal + cell fill.
 */

const ITEM_ART_SOURCES = {
  food_apple: { asset: 'assets/items/apple.png', keyMode: 'dark', fit: 'cover' },
  food_candy: { asset: 'assets/items/candy.png', keyMode: 'light', fit: 'contain' },
  food_big_cake: { asset: 'assets/items/big-cake.png', keyMode: 'light', fit: 'contain' },
};

const DARK_BG_KEY_THRESHOLD = 32;
const LIGHT_BG_MIN_CHANNEL = 250;

const itemCanvasCache = new Map();
const itemLoadPromises = new Map();

function isNearWhitePixel(r, g, b) {
  return r >= LIGHT_BG_MIN_CHANNEL && g >= LIGHT_BG_MIN_CHANNEL && b >= LIGHT_BG_MIN_CHANNEL;
}

function cropOpaqueCanvas(scratch, w, h) {
  const ctx = scratch.getContext('2d');
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 8) continue;
    const x = (i / 4) % w;
    const y = Math.floor(i / 4 / w);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (maxX < minX || maxY < minY) return scratch;

  const cropPad = 1;
  minX = Math.max(0, minX - cropPad);
  minY = Math.max(0, minY - cropPad);
  maxX = Math.min(w - 1, maxX + cropPad);
  maxY = Math.min(h - 1, maxY + cropPad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const out = document.createElement('canvas');
  out.width = cw;
  out.height = ch;
  out.getContext('2d').drawImage(scratch, minX, minY, cw, ch, 0, 0, cw, ch);
  return out;
}

/** Knock out solid black backdrop and crop to opaque silhouette. */
function processItemSourceDark(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scratch = document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;

  for (let i = 0; i < px.length; i += 4) {
    if (px[i] + px[i + 1] + px[i + 2] < DARK_BG_KEY_THRESHOLD) {
      px[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return cropOpaqueCanvas(scratch, w, h);
}

/** Flood-fill near-white pixels connected to the image border. */
function processItemSourceLight(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scratch = document.createElement('canvas');
  scratch.width = w;
  scratch.height = h;
  const ctx = scratch.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function idx(x, y) {
    return y * w + x;
  }

  function trySeed(x, y) {
    const i = idx(x, y);
    if (visited[i]) return;
    const o = i * 4;
    if (!isNearWhitePixel(px[o], px[o + 1], px[o + 2])) return;
    visited[i] = 1;
    queue.push(i);
  }

  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (queue.length) {
    const i = queue.pop();
    const o = i * 4;
    px[o + 3] = 0;
    const x = i % w;
    const y = Math.floor(i / w);
    if (x > 0) trySeed(x - 1, y);
    if (x < w - 1) trySeed(x + 1, y);
    if (y > 0) trySeed(x, y - 1);
    if (y < h - 1) trySeed(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  return cropOpaqueCanvas(scratch, w, h);
}

function processItemSource(img, keyMode) {
  if (keyMode === 'light') return processItemSourceLight(img);
  return processItemSourceDark(img);
}

function loadItemImage(itemId) {
  const spec = ITEM_ART_SOURCES[itemId];
  if (!spec) return Promise.resolve(null);
  if (itemCanvasCache.has(itemId)) return Promise.resolve(itemCanvasCache.get(itemId));
  if (itemLoadPromises.has(itemId)) return itemLoadPromises.get(itemId);

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = processItemSource(img, spec.keyMode);
      itemCanvasCache.set(itemId, canvas);
      resolve(canvas);
    };
    img.onerror = () => {
      console.warn('[BlockBall] item image failed to load:', spec.asset);
      resolve(null);
    };
    img.src = spec.asset;
  });

  itemLoadPromises.set(itemId, promise);
  return promise;
}

function loadAllItemImages() {
  return Promise.all(Object.keys(ITEM_ART_SOURCES).map((id) => loadItemImage(id)));
}

function getItemCanvas(itemId) {
  return itemCanvasCache.get(itemId) ?? null;
}

function hasItemArt(itemId) {
  return Boolean(ITEM_ART_SOURCES[itemId]);
}

/** Fit cropped art inside the target rect (`contain`) or fill it (`cover`). */
function drawItemArt(c, w, h, img, fit = 'contain') {
  if (!img) return false;
  c.clearRect(0, 0, w, h);
  const iw = img.width;
  const ih = img.height;
  const scale = fit === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return true;
}

function getItemArtFit(itemId) {
  return ITEM_ART_SOURCES[itemId]?.fit ?? 'contain';
}

function bakeItemTexture(itemId, width, height) {
  const art = getItemCanvas(itemId);
  if (!art) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawItemArt(canvas.getContext('2d'), width, height, art, getItemArtFit(itemId));
  return canvas;
}

// Back-compat aliases for apple-specific call sites.
function loadAppleItemImage() {
  return loadItemImage('food_apple');
}

function getAppleItemCanvas() {
  return getItemCanvas('food_apple');
}

function drawAppleItemArt(c, w, h, img) {
  return drawItemArt(c, w, h, img);
}

if (typeof globalThis !== 'undefined') {
  globalThis.ITEM_ART_SOURCES = ITEM_ART_SOURCES;
  globalThis.loadItemImage = loadItemImage;
  globalThis.loadAllItemImages = loadAllItemImages;
  globalThis.getItemCanvas = getItemCanvas;
  globalThis.hasItemArt = hasItemArt;
  globalThis.getItemArtFit = getItemArtFit;
  globalThis.drawItemArt = drawItemArt;
  globalThis.bakeItemTexture = bakeItemTexture;
  globalThis.loadAppleItemImage = loadAppleItemImage;
  globalThis.getAppleItemCanvas = getAppleItemCanvas;
  globalThis.drawAppleItemArt = drawAppleItemArt;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ITEM_ART_SOURCES,
    loadItemImage,
    loadAllItemImages,
    getItemCanvas,
    hasItemArt,
    drawItemArt,
    bakeItemTexture,
    processItemSource,
    processItemSourceDark,
    processItemSourceLight,
  };
}
