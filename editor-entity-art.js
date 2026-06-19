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
  { value: 12, label: 'Gray Long ↕', key: 'v', procedural: 'gray', long: 'v' },
  { value: 3, label: 'Power', key: '3', procedural: 'power', power: true },
  { value: 14, label: 'Power Long ↔', key: 'c', procedural: 'power', power: true, long: 'h' },
  { value: 16, label: 'Power Long ↕', key: 'd', procedural: 'power', power: true, long: 'v' },
  { value: 28, label: 'Ability', key: '7', ability: true },
  { value: 30, label: 'Ability Long ↔', key: 'j', ability: true, long: 'h' },
  { value: 32, label: 'Ability Long ↕', key: 'k', ability: true, long: 'v' },
  { value: 4, label: 'Spike', key: '4', procedural: 'spike' },
  { value: 5, label: 'Indestructible', key: '5', procedural: 'indestructible' },
  { value: 34, label: 'Pinball Bumper', key: 'b', procedural: 'pinball', span: '2x2' },
  { value: 18, label: 'Score', key: 'e', procedural: 'score', span: '2x2' },
  { value: 29, label: 'Shield', key: 's', procedural: 'shield' },
  { value: 22, label: 'Bonus', key: 'u', procedural: 'bonus' },
  { value: 23, label: 'Hidden', key: 'h', procedural: 'hidden' },
  { value: 24, label: 'Hidden 2×2', key: 'x', procedural: 'hidden', span: '2x2' },
];

/** 1×1 types that can sit behind a hidden panel (editor reveal brush). */
const HIDDEN_REVEAL_PICKER_OPTIONS = [
  { value: 1, label: 'Normal', key: '1', procedural: 'normal' },
  { value: 2, label: 'Gray', key: '2', procedural: 'gray' },
  { value: 3, label: 'Power', key: '3', procedural: 'power', power: true },
  { value: 28, label: 'Ability', key: '7', ability: true },
  { value: 4, label: 'Spike', key: '4', procedural: 'spike' },
  { value: 5, label: 'Indestructible', key: '5', procedural: 'indestructible' },
  { value: 22, label: 'Bonus', key: 'u', procedural: 'bonus' },
];

/** Reveal options when painting 2×2 hidden (includes score). */
const HIDDEN_2X2_REVEAL_PICKER_OPTIONS = [
  ...HIDDEN_REVEAL_PICKER_OPTIONS,
  { value: 18, label: 'Score', key: 'e', procedural: 'score', span: '2x2' },
];

const BLOCK_FALLBACK_COLORS = {
  1: '#f1d302',
  2: '#a8c0ff',
  6: '#f1d302',
  8: '#f1d302',
  10: '#a8c0ff',
  12: '#a8c0ff',
  3: '#235789',
  14: '#235789',
  16: '#235789',
  28: '#8b7355',
  30: '#8b7355',
  32: '#8b7355',
  4: '#ff2266',
  5: '#44aaff',
  34: '#ff3344',
  18: '#cc66ff',
  29: '#22ee55',
  22: '#ffee22',
  23: '#7a5c48',
  24: '#7a5c48',
};

const ENEMY_TIER_COLORS = {
  mob: '#ff44dd',
  midBoss: '#ff66ff',
  boss: '#cc44ff',
};

const ITEM_CATEGORY_COLORS = {
  food: { fill: '#ff5566', border: '#cc2244' },
  powerUp: { fill: '#22ee88', border: '#00aa55' },
  copyAbility: { fill: '#4488ff', border: '#2244cc' },
  life: { fill: '#cc66ff', border: '#8822cc' },
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

function strokeRoundRect(c, x, y, w, h, r, stroke, lineWidth = 1) {
  c.strokeStyle = stroke;
  c.lineWidth = lineWidth;
  roundRectPath(c, x, y, w, h, r);
  c.stroke();
}

function buildProceduralBlockCanvas(cellW, cellH, type) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const pad = 2;
  const innerW = cellW - pad * 2;
  const innerH = cellH - pad * 2;
  const r = blockProceduralRadii(innerW, innerH);

  if (type === 'normal') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#cdb002');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#f1d302');
    if (typeof drawDebossedNormalTeardropCanvas === 'function') {
      drawDebossedNormalTeardropCanvas(c, cellW / 2, cellH / 2, normalStarOuterRadius(innerW, innerH));
    }
  } else if (type === 'gray') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#4466ff');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#a8c0ff');
    if (typeof drawMutedGrayTeardropCanvas === 'function') {
      drawMutedGrayTeardropCanvas(c, cellW / 2, cellH / 2, normalStarOuterRadius(innerW, innerH));
    }
  } else if (type === 'power') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#1a425f');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#235789');
    strokeRoundRect(
      c,
      pad + 4,
      pad + 4,
      innerW - 8,
      innerH - 8,
      r.detail,
      'rgba(143, 180, 212, 0.95)',
      2
    );
    fillRoundRect(
      c,
      pad + 6,
      pad + 6,
      innerW - 12,
      Math.max(4, innerH * 0.2),
      r.detail,
      'rgba(143, 180, 212, 0.45)'
    );
  } else if (type === 'spike') {
    if (typeof drawCuteSpikeCanvas === 'function') {
      drawCuteSpikeCanvas(c, pad, innerW, innerH);
    }
  } else if (type === 'indestructible') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#0066cc');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#44aaff');
    const lw = Math.max(2, Math.floor(Math.min(innerW, innerH) * 0.08));
    c.strokeStyle = 'rgba(0, 51, 102, 0.95)';
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(pad + 4, pad + 4);
    c.lineTo(pad + innerW - 4, pad + innerH - 4);
    c.moveTo(pad + innerW - 4, pad + 4);
    c.lineTo(pad + 4, pad + innerH - 4);
    c.stroke();
  } else if (type === 'pinball') {
    const cx = cellW / 2;
    const baseH = innerH * 0.28;
    const domeR = Math.min(innerW, innerH) * 0.36;
    const domeCy = pad + innerH - baseH - domeR * 0.82;
    fillRoundRect(c, pad, pad + innerH - baseH, innerW, baseH, 4, '#0000cc');
    c.fillStyle = '#cc0022';
    c.beginPath();
    c.ellipse(cx, pad + innerH - baseH * 0.55, domeR * 1.05, baseH * 0.72, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#00cc33';
    c.beginPath();
    c.arc(cx, domeCy, domeR, Math.PI, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    c.lineWidth = Math.max(2, domeR * 0.08);
    c.beginPath();
    c.arc(cx, domeCy, domeR * 0.72, Math.PI * 1.12, Math.PI * -0.12);
    c.stroke();
  } else if (type === 'score') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#cc5500');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#ff8800');
    const starR = Math.min(innerW, innerH) * 0.22;
    const starCx = pad + innerW / 2;
    const starCy = pad + innerH / 2;
    if (typeof drawDebossedNormalStarCanvas === 'function') {
      drawDebossedNormalStarCanvas(c, starCx, starCy, starR);
    }
  } else if (type === 'shield') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#0a9944');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#22ee55');
    const starR = normalStarOuterRadius(innerW, innerH);
    if (typeof drawFilledScoreStarCanvas === 'function') {
      drawFilledScoreStarCanvas(c, cellW / 2, cellH / 2, starR);
    }
  } else if (type === 'hidden') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#4a382c');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#7a5c48');
    const plankH = Math.max(3, Math.floor(innerH / 5));
    for (let i = 1; i < 5; i++) {
      c.fillStyle = 'rgba(107, 83, 68, 0.55)';
      c.fillRect(pad + 3, pad + i * plankH, innerW - 6, 1);
    }
    strokeRoundRect(c, pad + 4, pad + 4, innerW - 8, innerH - 8, r.detail, 'rgba(61, 46, 36, 0.9)', 2);
    c.fillStyle = 'rgba(61, 46, 36, 0.85)';
    c.font = `bold ${Math.max(10, Math.floor(innerW * 0.42))}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', cellW / 2, cellH / 2);
  } else if (type === 'bonus') {
    fillRoundRect(c, pad, pad, innerW, innerH, r.outer, '#ff9900');
    fillRoundRect(c, pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner, '#ffee22');
    c.fillStyle = 'rgba(255, 255, 255, 0.9)';
    c.beginPath();
    c.arc(cellW / 2, cellH * 0.44, Math.min(innerW, innerH) * 0.14, 0, Math.PI * 2);
    c.fill();
    strokeRoundRect(
      c,
      pad + innerW * 0.28,
      pad + innerH * 0.62,
      innerW * 0.44,
      innerH * 0.18,
      r.detail,
      'rgba(255, 255, 255, 0.5)'
    );
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
  fillRoundRect(c, 0, 2, canvas.width, innerH, 6, '#00ccaa');
  fillRoundRect(c, 0, 0, canvas.width, innerH, 6, '#00ffcc');
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

  c.fillStyle = '#cc22aa';
  c.beginPath();
  c.ellipse(cellW / 2, cellH * 0.65, innerW * 0.85, innerH * 0.7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ff44dd';
  c.beginPath();
  c.ellipse(cellW / 2, cellH * 0.58, innerW * 0.8, innerH * 0.65, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cellW * 0.35, cellH * 0.42, Math.max(3, cellW * 0.1), 0, Math.PI * 2);
  c.arc(cellW * 0.65, cellH * 0.42, Math.max(3, cellW * 0.1), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#003366';
  c.beginPath();
  c.arc(cellW * 0.35, cellH * 0.42, Math.max(2, cellW * 0.05), 0, Math.PI * 2);
  c.arc(cellW * 0.65, cellH * 0.42, Math.max(2, cellW * 0.05), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(0, 51, 102, 0.85)';
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

  c.fillStyle = '#22ee88';
  c.beginPath();
  c.arc(cx, cy, circleR, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#ffee44';
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

  if (hasItemArt(entry.id) && typeof getItemCanvas === 'function') {
    const art = getItemCanvas(entry.id);
    const fit = typeof getItemArtFit === 'function' ? getItemArtFit(entry.id) : 'contain';
    if (art && drawItemArt(c, w, h, art, fit)) return canvas;
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

function drawAbilityPickerThumb(c, size, sprite, opt) {
  c.clearRect(0, 0, size, size);
  const pad = 2;
  if (!sprite) {
    c.fillStyle = BLOCK_FALLBACK_COLORS[opt.value] || '#8b7355';
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

function drawPowerPickerThumb(c, size, sprite, opt) {
  c.clearRect(0, 0, size, size);
  const pad = 2;
  if (!sprite) {
    c.fillStyle = BLOCK_FALLBACK_COLORS[opt.value] || '#235789';
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
  if (opt.ability && typeof buildAbilityBlockCanvas === 'function') {
    const colSpan = opt.long === 'h' ? 2 : 1;
    const rowSpan = opt.long === 'v' ? 2 : 1;
    return buildAbilityBlockCanvas(cellW, cellH, colSpan, rowSpan);
  }
  if (opt.procedural) {
    const cw = opt.span === '2x2' ? cellW * 2 : cellW;
    const ch = opt.span === '2x2' ? cellH * 2 : cellH;
    return buildProceduralBlockCanvas(cw, ch, opt.procedural);
  }
  return buildPlaceholderCanvas(cellW, cellH, {
    bg: BLOCK_FALLBACK_COLORS[opt.value] || '#666',
    label: String(opt.key),
    hint: 'block',
  });
}

function resolveEnemySprite(entry, cellW, cellH) {
  if (entry.id === 'ground_walker' && typeof buildGroundWalkerCanvas === 'function') {
    return buildGroundWalkerCanvas(cellW, cellH);
  }
  if (entry.id === 'drifter' && typeof buildDrifterCanvas === 'function') {
    return buildDrifterCanvas(cellW, cellH);
  }
  if (entry.id === 'saucer' && typeof buildSaucerCanvas === 'function') {
    return buildSaucerCanvas(cellW, cellH);
  }
  if (entry.id === 'horizontal_flyer' && typeof buildHorizontalFlyerCanvas === 'function') {
    return buildHorizontalFlyerCanvas(cellW, cellH);
  }
  if (entry.id === 'flame_riser' && typeof buildSlimeFireCanvas === 'function') {
    return buildSlimeFireCanvas(cellW, cellH);
  }
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
    const foot = typeof getEnemyFootprint === 'function'
      ? getEnemyFootprint(entry.id)
      : { colSpan: 2, rowSpan: 2 };
    enemies[entry.id] = resolveEnemySprite(
      entry,
      cellW * foot.colSpan,
      cellH * foot.rowSpan
    );
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
  HIDDEN_REVEAL_PICKER_OPTIONS,
  HIDDEN_2X2_REVEAL_PICKER_OPTIONS,
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
  drawAbilityPickerThumb,
  drawLongPickerThumb,
  drawSpan2PickerThumb,
  drawBonusChanceItemArt,
  buildPlaceholderCanvas,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditorEntityArt;
}
