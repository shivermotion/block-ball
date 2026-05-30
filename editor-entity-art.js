/**
 * Level editor — procedural entity thumbnails and canvas sprites.
 */
/* global ENEMY_COMPENDIUM, ENEMY_TIER, ITEM_COMPENDIUM, ITEM_CATEGORY */

const BLOCK_PICKER_OPTIONS = [
  { value: 0, label: 'Empty', key: '0' },
  { value: 1, label: 'Normal', key: '1', procedural: 'normal' },
  { value: 2, label: 'Gray', key: '2', procedural: 'gray' },
  { value: 6, label: 'Normal Long ↔', key: '6', procedural: 'normal', long: 'h' },
  { value: 8, label: 'Normal Long ↕', key: '8', procedural: 'normal', long: 'v' },
  { value: 10, label: 'Gray Long ↔', key: 'a', procedural: 'gray', long: 'h' },
  { value: 12, label: 'Gray Long ↕', key: 'b', procedural: 'gray', long: 'v' },
  { value: 3, label: 'Power', key: '3', procedural: 'power', power: true },
  { value: 14, label: 'Power Long ↔', key: 'c', procedural: 'power', power: true, long: 'h' },
  { value: 16, label: 'Power Long ↕', key: 'd', procedural: 'power', power: true, long: 'v' },
  { value: 4, label: 'Spike', key: '4', procedural: 'spike' },
  { value: 5, label: 'Indestructible', key: '5', procedural: 'indestructible' },
  { value: 18, label: 'Score', key: 'e', procedural: 'score', span: '2x2' },
  { value: 22, label: 'Bonus', key: 'u', procedural: 'bonus' },
];

const BLOCK_FALLBACK_COLORS = {
  1: '#fff5e6',
  2: '#9ca3af',
  6: '#fff5e6',
  8: '#fff5e6',
  10: '#9ca3af',
  12: '#9ca3af',
  3: '#6b7280',
  14: '#6b7280',
  16: '#6b7280',
  4: '#ff3366',
  5: '#6b7c8c',
  18: '#9b7ede',
  22: '#ffd54f',
};

const ENEMY_TIER_COLORS = {
  mob: '#ff6bcb',
  midBoss: '#e879f9',
  boss: '#a855f7',
};

const ITEM_CATEGORY_COLORS = {
  food: { fill: '#c45c5c', border: '#8b3a3a' },
  powerUp: { fill: '#3d9a6a', border: '#2a6b4a' },
  copyAbility: { fill: '#6b8cce', border: '#4a6299' },
  life: { fill: '#9b7ede', border: '#6b5a9e' },
};

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

  if (type === 'normal') {
    fillRoundRect(c, pad, pad, innerW, innerH, 4, '#ffb347');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, 3, '#fff5e6');
  } else if (type === 'gray') {
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
  } else if (type === 'spike') {
    fillRoundRect(c, pad, pad, innerW, innerH, 3, '#4a1028');
    c.fillStyle = '#ff3366';
    const spikeW = innerW / 3;
    for (let i = 0; i < 3; i++) {
      const cx = pad + spikeW * i + spikeW * 0.5;
      const half = spikeW * 0.38;
      c.beginPath();
      c.moveTo(cx - half, pad + innerH);
      c.lineTo(cx, pad + innerH * 0.12);
      c.lineTo(cx + half, pad + innerH);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = 'rgba(204, 17, 68, 0.7)';
    c.lineWidth = 2;
    c.strokeRect(pad + 1, pad + innerH - 2, innerW - 2, 2);
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
  } else if (type === 'score') {
    fillRoundRect(c, pad, pad, innerW, innerH, 4, '#6b5a9e');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, 3, '#9b7ede');
    c.fillStyle = '#ffffff';
    c.font = `bold ${Math.max(8, Math.floor(innerW * 0.36))}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('50', cellW / 2, cellH * 0.46);
    c.fillStyle = 'rgba(255, 255, 255, 0.65)';
    c.font = `${Math.max(6, Math.floor(innerW * 0.18))}px system-ui, sans-serif`;
    c.fillText('×7', cellW / 2, cellH * 0.72);
  } else if (type === 'bonus') {
    fillRoundRect(c, pad, pad, innerW, innerH, 4, '#ffb300');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, 3, '#ffd54f');
    c.fillStyle = 'rgba(255, 255, 255, 0.9)';
    c.beginPath();
    c.arc(cellW / 2, cellH * 0.44, Math.min(innerW, innerH) * 0.14, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255, 255, 255, 0.75)';
    c.font = `bold ${Math.max(7, Math.floor(innerW * 0.28))}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('100', cellW / 2, cellH * 0.72);
  }
  return canvas;
}

/** Matches demo procedural paddle (generateTextures). */
function buildProceduralPaddleCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const c = canvas.getContext('2d');
  const pad = 2;
  const innerH = canvas.height - pad - 2;
  fillRoundRect(c, 0, 2, canvas.width, innerH, 6, '#00a080');
  fillRoundRect(c, 0, 0, canvas.width, innerH, 6, '#00d4aa');
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

function drawStar(c, cx, cy, outerR, innerR, points) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
  c.fill();
}

function drawBonusChanceItemArt(c, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const circleR = Math.min(w, h) * 0.42;
  const outerR = circleR * 0.55;
  const innerR = outerR * 0.42;

  c.fillStyle = '#3d9a6a';
  c.beginPath();
  c.arc(cx, cy, circleR, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#ffe66d';
  drawStar(c, cx, cy, outerR, innerR, 5);
}

function buildProceduralItemCanvas(cellW, cellH, entry) {
  const foot = getItemFootprint(entry.id);
  const canvas = document.createElement('canvas');
  canvas.width = cellW * foot.colSpan;
  canvas.height = cellH * foot.rowSpan;
  const c = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  if (entry.id === 'item_bonus_chance') {
    drawBonusChanceItemArt(c, w, h);
    return canvas;
  }

  const size = Math.max(8, Math.min(cellW, cellH) - 4);
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const colors = ITEM_CATEGORY_COLORS[entry.category] || { fill: '#888888', border: '#555555' };
  fillRoundRect(c, ox, oy, size, size, 4, colors.border);
  fillRoundRect(c, ox + 2, oy + 2, size - 4, size - 4, 3, colors.fill);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.arc(ox + size * 0.72, oy + size * 0.28, Math.max(2, size * 0.1), 0, Math.PI * 2);
  c.fill();
  const abbrev = itemAbbrev(entry.id);
  c.fillStyle = 'rgba(255,255,255,0.85)';
  c.font = `bold ${Math.max(7, Math.floor(size * 0.32))}px system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(abbrev, ox + size / 2, oy + size * 0.58);
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

function itemAbbrev(id) {
  const parts = id.split('_').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return id.slice(0, 2).toUpperCase();
}

function itemCategoryHint(category) {
  if (category === ITEM_CATEGORY?.food) return 'food';
  if (category === ITEM_CATEGORY?.powerUp) return 'pwr';
  if (category === ITEM_CATEGORY?.copyAbility) return 'abil';
  if (category === ITEM_CATEGORY?.life) return 'life';
  return 'item';
}

function getItemPickerOptions() {
  const list = typeof ITEM_COMPENDIUM !== 'undefined' ? [...ITEM_COMPENDIUM] : [];
  return list.sort((a, b) => {
    const catOrder = { food: 0, powerUp: 1, copyAbility: 2, life: 3 };
    const ca = catOrder[a.category] ?? 9;
    const cb = catOrder[b.category] ?? 9;
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });
}

/** Stretch sprite to fill rect (same art as 1×1, scaled to footprint). */
function drawStretched(ctx, sprite, x, y, w, h, pad = 0) {
  if (!sprite) return;
  const px = x + pad;
  const py = y + pad;
  const pw = w - pad * 2;
  const ph = h - pad * 2;
  if (pw <= 0 || ph <= 0) return;
  ctx.drawImage(sprite, px, py, pw, ph);
}

function drawPowerPickerThumb(c, size, sprite, opt) {
  c.clearRect(0, 0, size, size);
  const pad = 2;
  if (!sprite) {
    c.fillStyle = BLOCK_FALLBACK_COLORS[opt.value] || '#6b7280';
    if (opt.long === 'h') {
      c.fillRect(pad, pad + size * 0.2, size - pad * 2, size * 0.55);
    } else if (opt.long === 'v') {
      c.fillRect(pad + size * 0.2, pad, size * 0.55, size - pad * 2);
    } else {
      c.fillRect(pad, pad, size - pad * 2, size - pad * 2);
    }
    return;
  }
  if (opt.long === 'h') {
    drawStretched(c, sprite, pad, pad + size * 0.2, size - pad * 2, size * 0.55, 0);
  } else if (opt.long === 'v') {
    drawStretched(c, sprite, pad + size * 0.2, pad, size * 0.55, size - pad * 2, 0);
  } else {
    drawStretched(c, sprite, pad, pad, size - pad * 2, size - pad * 2, 0);
  }
}

function drawSpan2PickerThumb(c, size, sprite, opt) {
  c.clearRect(0, 0, size, size);
  const pad = 2;
  const w = size - pad * 2;
  const h = size - pad * 2;
  if (sprite) {
    drawStretched(c, sprite, pad, pad, w, h, 0);
    return;
  }
  c.fillStyle = BLOCK_FALLBACK_COLORS[opt.value] || '#9b7ede';
  c.fillRect(pad, pad, w, h);
}

function drawLongPickerThumb(c, size, sprite, opt) {
  const pad = 2;
  c.clearRect(0, 0, size, size);
  if (sprite) {
    if (opt.long === 'h') {
      drawStretched(c, sprite, pad, pad + size * 0.2, size - pad * 2, size * 0.55, 0);
    } else if (opt.long === 'v') {
      drawStretched(c, sprite, pad + size * 0.2, pad, size * 0.55, size - pad * 2, 0);
    }
    return;
  }
  c.fillStyle = BLOCK_FALLBACK_COLORS[opt.value] || '#888';
  if (opt.long === 'h') {
    c.fillRect(pad, pad + size * 0.2, size - pad * 2, size * 0.55);
  } else {
    c.fillRect(pad + size * 0.2, pad, size * 0.55, size - pad * 2);
  }
}

function resolveBlockSprite(opt, cellW, cellH) {
  if (opt.value === 0) return null;
  if (opt.procedural) {
    return buildProceduralBlockCanvas(cellW, cellH, opt.procedural);
  }
  return buildPlaceholderCanvas(cellW, cellH, {
    bg: BLOCK_FALLBACK_COLORS[opt.value] || '#666',
    label: String(opt.key),
    hint: 'block',
  });
}

function resolveEnemySprite(entry, cellW, cellH) {
  if (entry.implemented) {
    return buildProceduralEnemyCanvas(cellW, cellH);
  }
  return buildPlaceholderCanvas(cellW, cellH, {
    bg: ENEMY_TIER_COLORS[entry.tier] || '#555',
    label: enemyAbbrev(entry.id),
    hint: entry.tier === 'boss' ? 'boss' : entry.tier === 'midBoss' ? 'mid' : 'mob',
  });
}

function resolveItemSprite(entry, cellW, cellH) {
  return buildProceduralItemCanvas(cellW, cellH, entry);
}

function buildEntityArt(cellW, cellH) {
  const blocks = {};
  for (const opt of BLOCK_PICKER_OPTIONS) {
    blocks[opt.value] = resolveBlockSprite(opt, cellW, cellH);
  }

  const enemies = {};
  for (const entry of getEnemyPickerOptions()) {
    enemies[entry.id] = resolveEnemySprite(entry, cellW, cellH);
  }

  const items = {};
  for (const entry of getItemPickerOptions()) {
    items[entry.id] = resolveItemSprite(entry, cellW, cellH);
  }

  return { blocks, enemies, items };
}

function drawThumbContained(c, sprite, size, pad) {
  c.clearRect(0, 0, size, size);
  if (!sprite) return;
  const iw = sprite.width;
  const ih = sprite.height;
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
  const iw = sprite.width;
  const ih = sprite.height;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const scale = Math.min(innerW / iw, innerH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(sprite, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

const EditorEntityArt = {
  BLOCK_PICKER_OPTIONS,
  BLOCK_FALLBACK_COLORS,
  getEnemyPickerOptions,
  getItemPickerOptions,
  buildEntityArt,
  buildProceduralPaddleCanvas,
  drawThumbContained,
  drawEmptyThumb,
  drawContained,
  drawStretched,
  drawPowerPickerThumb,
  drawLongPickerThumb,
  drawSpan2PickerThumb,
  drawBonusChanceItemArt,
  buildPlaceholderCanvas,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditorEntityArt;
}
