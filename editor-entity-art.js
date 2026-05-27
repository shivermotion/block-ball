/**
 * Level editor — entity thumbnails, placeholders, and canvas sprites.
 * PNG paths: assets/blocks/{type}.png, assets/enemies/{id}.png (optional).
 */
/* global ENEMY_COMPENDIUM, ENEMY_TIER */

const EDITOR_ART_VERSION = '4';

const BLOCK_PICKER_OPTIONS = [
  { value: 0, label: 'Empty', key: '0' },
  { value: 1, label: 'Normal', key: '1', image: 'assets/blocks/normal.png' },
  { value: 2, label: 'Gray', key: '2', procedural: 'gray' },
  { value: 3, label: 'Power', key: '3', procedural: 'power' },
  { value: 4, label: 'Spike', key: '4', image: 'assets/blocks/spike.png' },
  { value: 5, label: 'Indestructible', key: '5', procedural: 'indestructible' },
];

const BLOCK_FALLBACK_COLORS = { 1: '#fff5e6', 2: '#9ca3af', 3: '#6b7280', 4: '#ff3366', 5: '#6b7c8c' };

const ENEMY_TIER_COLORS = {
  mob: '#ff6bcb',
  midBoss: '#e879f9',
  boss: '#a855f7',
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

async function tryLoadImage(src) {
  try {
    return await loadImage(`${src}?v=${EDITOR_ART_VERSION}`);
  } catch {
    return null;
  }
}

function roundRectPath(c, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  c.beginPath();
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, w, h, rad);
  } else {
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }
}

function fillRoundRect(c, x, y, w, h, r, fill) {
  c.fillStyle = fill;
  roundRectPath(c, x, y, w, h, r);
  c.fill();
}

function buildProceduralBlockCanvas(cellW, cellH, type) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const pad = 2;
  const innerW = cellW - pad * 2;
  const innerH = cellH - pad * 2;

  if (type === 'gray') {
    fillRoundRect(c, pad, pad, innerW, innerH, 4, '#4b5563');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, 3, '#9ca3af');
    c.strokeStyle = 'rgba(107, 114, 128, 0.8)';
    c.lineWidth = 1;
    c.strokeRect(pad + innerW * 0.2, pad + innerH * 0.35, innerW * 0.6, innerH * 0.3);
  } else if (type === 'power') {
    fillRoundRect(c, pad, pad, innerW, innerH, 4, '#374151');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, 3, '#6b7280');
    c.strokeStyle = 'rgba(255, 230, 109, 0.85)';
    c.lineWidth = 2;
    roundRectPath(c, pad + 4, pad + 4, innerW - 8, innerH - 8, 3);
    c.stroke();
    c.fillStyle = 'rgba(255, 230, 109, 0.35)';
    c.fillRect(pad + 6, pad + 6, innerW - 12, Math.max(4, innerH * 0.2));
  } else if (type === 'indestructible') {
    fillRoundRect(c, pad, pad, innerW, innerH, 4, '#3d4d5d');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, 3, '#6b7c8c');
    const lw = Math.max(2, Math.floor(Math.min(innerW, innerH) * 0.08));
    c.strokeStyle = 'rgba(30, 40, 50, 0.95)';
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(pad + 4, pad + 4);
    c.lineTo(pad + innerW - 4, pad + innerH - 4);
    c.moveTo(pad + innerW - 4, pad + 4);
    c.lineTo(pad + 4, pad + innerH - 4);
    c.stroke();
  }
  return canvas;
}

/** Demo enemy silhouette (matches block-ball-demo generateTextures). */
function buildProceduralEnemyCanvas(cellW, cellH) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const pad = 2;
  const innerW = cellW - pad * 2;
  const innerH = cellH - pad * 2;

  c.fillStyle = '#c94d9a';
  c.beginPath();
  c.ellipse(cellW / 2, cellH * 0.65, innerW * 0.85, innerH * 0.7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ff6bcb';
  c.beginPath();
  c.ellipse(cellW / 2, cellH * 0.58, innerW * 0.8, innerH * 0.65, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cellW * 0.35, cellH * 0.42, Math.max(3, cellW * 0.1), 0, Math.PI * 2);
  c.arc(cellW * 0.65, cellH * 0.42, Math.max(3, cellW * 0.1), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#1e3a5f';
  c.beginPath();
  c.arc(cellW * 0.35, cellH * 0.42, Math.max(2, cellW * 0.05), 0, Math.PI * 2);
  c.arc(cellW * 0.65, cellH * 0.42, Math.max(2, cellW * 0.05), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(30, 58, 95, 0.8)';
  c.beginPath();
  c.ellipse(cellW / 2, cellH * 0.72, cellW * 0.15, cellH * 0.1, 0, 0, Math.PI * 2);
  c.fill();
  return canvas;
}

function buildPlaceholderCanvas(cellW, cellH, { bg, label, hint }) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  c.fillStyle = bg || '#3d3558';
  c.fillRect(0, 0, cellW, cellH);
  c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  c.lineWidth = 1;
  c.setLineDash([3, 3]);
  c.strokeRect(2.5, 2.5, cellW - 5, cellH - 5);
  c.setLineDash([]);
  c.fillStyle = 'rgba(255, 255, 255, 0.35)';
  c.font = `bold ${Math.max(8, Math.floor(cellW * 0.28))}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('?', cellW / 2, cellH * 0.38);
  c.fillStyle = '#ddd';
  c.font = `600 ${Math.max(7, Math.floor(cellW * 0.22))}px system-ui, sans-serif`;
  c.fillText(label || '?', cellW / 2, cellH * 0.62);
  if (hint && cellH >= 28) {
    c.fillStyle = '#888';
    c.font = `${Math.max(6, Math.floor(cellW * 0.16))}px system-ui, sans-serif`;
    c.fillText(hint, cellW / 2, cellH * 0.82);
  }
  return canvas;
}

function enemyAbbrev(id) {
  const parts = id.split('_').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return id.slice(0, 2).toUpperCase();
}

function getEnemyPickerOptions() {
  const list = typeof ENEMY_COMPENDIUM !== 'undefined' ? [...ENEMY_COMPENDIUM] : [];
  return list.sort((a, b) => {
    if (a.implemented !== b.implemented) return a.implemented ? -1 : 1;
    const tierOrder = { mob: 0, midBoss: 1, boss: 2 };
    const ta = tierOrder[a.tier] ?? 0;
    const tb = tierOrder[b.tier] ?? 0;
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });
}

async function resolveBlockSprite(opt, cellW, cellH) {
  if (opt.value === 0) return null;
  if (opt.image) {
    const img = await tryLoadImage(opt.image);
    if (img) return img;
  }
  if (opt.procedural) {
    return buildProceduralBlockCanvas(cellW, cellH, opt.procedural);
  }
  return buildPlaceholderCanvas(cellW, cellH, {
    bg: BLOCK_FALLBACK_COLORS[opt.value] || '#666',
    label: String(opt.key),
    hint: 'block',
  });
}

async function resolveEnemySprite(entry, cellW, cellH) {
  const img = await tryLoadImage(`assets/enemies/${entry.id}.png`);
  if (img) return img;
  if (entry.implemented) {
    return buildProceduralEnemyCanvas(cellW, cellH);
  }
  return buildPlaceholderCanvas(cellW, cellH, {
    bg: ENEMY_TIER_COLORS[entry.tier] || '#555',
    label: enemyAbbrev(entry.id),
    hint: entry.tier === 'boss' ? 'boss' : entry.tier === 'midBoss' ? 'mid' : 'mob',
  });
}

async function buildEntityArt(cellW, cellH) {
  const blocks = {};
  await Promise.all(
    BLOCK_PICKER_OPTIONS.map(async (opt) => {
      blocks[opt.value] = await resolveBlockSprite(opt, cellW, cellH);
    })
  );

  const enemies = {};
  const enemyOpts = getEnemyPickerOptions();
  await Promise.all(
    enemyOpts.map(async (entry) => {
      enemies[entry.id] = await resolveEnemySprite(entry, cellW, cellH);
    })
  );

  return { blocks, enemies };
}

function drawThumbContained(c, sprite, size, pad) {
  c.clearRect(0, 0, size, size);
  if (!sprite) return;
  const iw = sprite.naturalWidth || sprite.width;
  const ih = sprite.naturalHeight || sprite.height;
  const inner = size - pad * 2;
  const scale = Math.min(inner / iw, inner / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  c.drawImage(sprite, (size - dw) / 2, (size - dh) / 2, dw, dh);
}

function drawEmptyThumb(c, size) {
  c.clearRect(0, 0, size, size);
  c.fillStyle = '#2d1b4e';
  c.fillRect(0, 0, size, size);
  c.strokeStyle = 'rgba(255, 230, 109, 0.45)';
  c.lineWidth = 1;
  c.setLineDash([4, 3]);
  c.strokeRect(4, 4, size - 8, size - 8);
  c.setLineDash([]);
  c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(10, 10);
  c.lineTo(size - 10, size - 10);
  c.moveTo(size - 10, 10);
  c.lineTo(10, size - 10);
  c.stroke();
}

function drawContained(ctx, sprite, x, y, w, h, pad) {
  if (!sprite) return;
  const iw = sprite.naturalWidth || sprite.width;
  const ih = sprite.naturalHeight || sprite.height;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const scale = Math.min(innerW / iw, innerH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(sprite, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

const EditorEntityArt = {
  EDITOR_ART_VERSION,
  BLOCK_PICKER_OPTIONS,
  BLOCK_FALLBACK_COLORS,
  getEnemyPickerOptions,
  buildEntityArt,
  drawThumbContained,
  drawEmptyThumb,
  drawContained,
  buildPlaceholderCanvas,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditorEntityArt;
}
