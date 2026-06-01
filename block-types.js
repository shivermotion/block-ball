/**
 * Block Ball — block compendium & type registry
 * Source of truth for IDs, scoring, and hit rules (demo + future levels).
 */
/* global Phaser */

const BLOCK_COMPENDIUM = [
  {
    id: 'normal',
    name: 'Normal Block',
    implemented: true,
    appearance: 'Procedural — cream rounded block',
    points: 100,
    normalHit: 'destroy',
    powerHit: 'destroy',
    notes: 'Basic building block. Colored (Flip) variants often double points.',
  },
  {
    id: 'gray',
    name: 'Gray Block',
    implemented: true,
    appearance: 'Procedural — pale grey stone block',
    points: 200,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    notes: 'Two-step on normal bounces; one Power Bounce clears it.',
  },
  {
    id: 'normal_long_h',
    name: 'Normal Block (long — horizontal)',
    implemented: true,
    appearance: 'Same as Normal; spans 2×1 play cells',
    points: 100,
    normalHit: 'destroy',
    powerHit: 'destroy',
    notes: 'Anchor = top-left cell. Extension cell to the right.',
  },
  {
    id: 'normal_long_v',
    name: 'Normal Block (long — vertical)',
    implemented: true,
    appearance: 'Same as Normal; spans 1×2 play cells',
    points: 100,
    normalHit: 'destroy',
    powerHit: 'destroy',
    notes: 'Anchor = top cell. Extension cell below.',
  },
  {
    id: 'gray_long_h',
    name: 'Gray Block (long — horizontal)',
    implemented: true,
    appearance: 'Same as Gray; spans 2×1 play cells',
    points: 200,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    notes: 'Downgrades to normal long horizontal.',
  },
  {
    id: 'gray_long_v',
    name: 'Gray Block (long — vertical)',
    implemented: true,
    appearance: 'Same as Gray; spans 1×2 play cells',
    points: 200,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    notes: 'Downgrades to normal long vertical.',
  },
  {
    id: 'power',
    name: 'Power Block',
    implemented: true,
    appearance: 'Procedural — dark block with gold glow trim',
    points: 500,
    normalHit: 'immune',
    powerHit: 'destroy',
    notes: 'Gatekeeper — requires Power Bounce. Often protects clusters behind.',
  },
  {
    id: 'power_long_h',
    name: 'Power Block (long — horizontal)',
    implemented: true,
    appearance: 'Same as Power; rotated 90°; spans 2×1 cells',
    points: 500,
    normalHit: 'immune',
    powerHit: 'destroy',
    notes: 'Anchor = top-left. Extension cell to the right.',
  },
  {
    id: 'power_long_v',
    name: 'Power Block (long — vertical)',
    implemented: true,
    appearance: 'Same as Power; fills 1×2 cells (portrait orientation)',
    points: 500,
    normalHit: 'immune',
    powerHit: 'destroy',
    notes: 'Anchor = top cell. Extension cell below.',
  },
  {
    id: 'spike',
    name: 'Spike Block',
    implemented: true,
    appearance: 'Procedural — single rounded cute black spike on transparent tile',
    points: 0,
    normalHit: 'hazard',
    powerHit: 'hazard_bounce',
    notes: 'Costs a life on contact unless the ball is powered. Indestructible.',
  },
  {
    id: 'splitting',
    name: 'Splitting Block',
    implemented: false,
    appearance: 'Large white or gray',
    points: 200,
    normalHit: 'split_four',
    powerHit: 'split_or_destroy',
    notes: 'Breaks into four smaller normal/gray pieces.',
  },
  {
    id: 'ability',
    name: 'Ability Block',
    implemented: false,
    appearance: 'Special pattern',
    points: 0,
    normalHit: 'immune_or_weak',
    powerHit: 'damage_with_ability',
    notes: 'Usually needs active Copy Ability to destroy.',
  },
  {
    id: 'indestructible',
    name: 'Indestructible Block',
    implemented: true,
    appearance: 'Steel grey procedural block with X mark',
    points: 0,
    normalHit: 'immune',
    powerHit: 'immune',
    notes: 'Bounces off; never destroyed or damaged. Does not count toward level clear.',
  },
  {
    id: 'score',
    name: 'Score Block',
    implemented: true,
    appearance: '3D orange 2×2 puff with big rotating star; hit = spin then random nudge',
    points: 0,
    normalHit: 'hit_increment',
    powerHit: 'hit_increment_high',
    notes: 'Up to ~7 hits; escalating points; 1-Ups at max with ability. Optional — does not count toward level clear.',
  },
  {
    id: 'hidden',
    name: 'Hidden Block',
    implemented: true,
    appearance: 'Wooden panel — first hit flips to reveal block behind',
    points: 0,
    normalHit: 'reveal',
    powerHit: 'reveal',
    notes: 'Editor sets reveal type via blocks.hiddenBehind. Does not count until revealed.',
  },
  {
    id: 'hidden_2x2',
    name: 'Hidden Block (2×2)',
    implemented: true,
    appearance: 'Large wooden panel — spans 2×2; first hit flips to reveal block behind',
    points: 0,
    normalHit: 'reveal',
    powerHit: 'reveal',
    notes: 'Same as hidden; reveal type stored on all four footprint cells in hiddenBehind.',
  },
  {
    id: 'bonus',
    name: 'Bonus Block',
    implemented: true,
    appearance: 'Procedural gold tile — pass-through collectible',
    points: 100,
    normalHit: 'destroy',
    powerHit: 'destroy',
    notes: 'Solid when placed; pass-through collectible during Bonus Chance timer.',
  },
  {
    id: 'star',
    name: 'Star / Protective Star Block',
    implemented: false,
    appearance: 'Small rectangle with star symbol',
    points: 0,
    normalHit: 'collect',
    powerHit: 'collect',
    notes:
      'Round 4 only (typical). Each collected star covers one boss spike gutter in Round 5; all stars → 1-Up. Covers break on hit, exposing spikes. Not for score.',
  },
  {
    id: 'switch',
    name: 'Switch / Bonus Trigger Block',
    implemented: false,
    appearance: 'Distinct from star; bonus trigger mark',
    points: 0,
    normalHit: 'collect',
    powerHit: 'collect',
    notes: 'Collect all → Bonus Chance (remaining blocks become Through blocks). Not boss spike protection.',
  },
  {
    id: 'through',
    name: 'Through Block',
    implemented: false,
    appearance: 'Semi-transparent',
    points: 50,
    normalHit: 'pass_through',
    powerHit: 'pass_through',
    notes: 'Bonus Chance only; no bounce.',
  },
  {
    id: 'pinball',
    name: 'Pinball / Bumper Block',
    implemented: false,
    appearance: 'Round bumper',
    points: 10,
    normalHit: 'bounce_boost',
    powerHit: 'bounce_boost',
    notes: 'Indestructible; speeds up ball; farmable small points.',
  },
];

/** Playable block definitions (textures + collision rules) */
const BLOCK_TYPES = {
  normal: {
    id: 'normal',
    texture: 'block_normal',
    points: 100,
    powerOnly: false,
    normalHit: 'destroy',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  gray: {
    id: 'gray',
    texture: 'block_gray',
    points: 200,
    powerOnly: false,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    downgradeTo: 'normal',
    countsTowardClear: true,
  },
  normal_long_h: {
    id: 'normal_long_h',
    texture: 'block_normal',
    colSpan: 2,
    rowSpan: 1,
    points: 100,
    powerOnly: false,
    normalHit: 'destroy',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  normal_long_v: {
    id: 'normal_long_v',
    texture: 'block_normal',
    colSpan: 1,
    rowSpan: 2,
    points: 100,
    powerOnly: false,
    normalHit: 'destroy',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  gray_long_h: {
    id: 'gray_long_h',
    texture: 'block_gray',
    colSpan: 2,
    rowSpan: 1,
    points: 200,
    powerOnly: false,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    downgradeTo: 'normal_long_h',
    countsTowardClear: true,
  },
  gray_long_v: {
    id: 'gray_long_v',
    texture: 'block_gray',
    colSpan: 1,
    rowSpan: 2,
    points: 200,
    powerOnly: false,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    downgradeTo: 'normal_long_v',
    countsTowardClear: true,
  },
  power: {
    id: 'power',
    texture: 'block_power',
    points: 500,
    powerOnly: true,
    normalHit: 'immune',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  power_long_h: {
    id: 'power_long_h',
    texture: 'block_power_long_h',
    colSpan: 2,
    rowSpan: 1,
    points: 500,
    powerOnly: true,
    normalHit: 'immune',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  power_long_v: {
    id: 'power_long_v',
    texture: 'block_power_long_v',
    colSpan: 1,
    rowSpan: 2,
    points: 500,
    powerOnly: true,
    normalHit: 'immune',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  spike: {
    id: 'spike',
    texture: 'block_spike',
    points: 0,
    powerOnly: false,
    normalHit: 'hazard',
    powerHit: 'hazard_bounce',
    countsTowardClear: false,
    isHazard: true,
  },
  indestructible: {
    id: 'indestructible',
    texture: 'block_indestructible',
    points: 0,
    powerOnly: false,
    normalHit: 'immune',
    powerHit: 'immune',
    countsTowardClear: false,
  },
  score: {
    id: 'score',
    texture: 'block_score',
    colSpan: 2,
    rowSpan: 2,
    points: 0,
    scoreTiers: [50, 100, 200, 400, 800, 1600, 3200],
    maxHits: 7,
    powerOnly: false,
    normalHit: 'hit_increment',
    powerHit: 'hit_increment_high',
    countsTowardClear: false,
  },
  /** Placed in editor — solid until Bonus Chance; pass-through while timer runs. */
  hidden: {
    id: 'hidden',
    texture: 'block_hidden',
    points: 0,
    powerOnly: false,
    normalHit: 'reveal',
    powerHit: 'reveal',
    countsTowardClear: false,
    invisibleUntilReveal: true,
  },
  hidden_2x2: {
    id: 'hidden_2x2',
    texture: 'block_hidden_2x2',
    colSpan: 2,
    rowSpan: 2,
    points: 0,
    powerOnly: false,
    normalHit: 'reveal',
    powerHit: 'reveal',
    countsTowardClear: false,
    invisibleUntilReveal: true,
  },
  bonus: {
    id: 'bonus',
    texture: 'block_bonus',
    points: 100,
    powerOnly: false,
    normalHit: 'destroy',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
};

/** Grid cell for hidden-block surface (1×1). */
const HIDDEN_BLOCK_CELL = 23;

/** Grid anchor for hidden block 2×2 (extensions `25`–`27`). */
const HIDDEN_2X2_BLOCK_CELL = 24;

/** Allowed `hiddenBehind` values for 1×1 hidden panels. */
const HIDDEN_REVEAL_CELLS = new Set([1, 2, 3, 4, 5, 22]);

/** Extra reveal types valid only behind a 2×2 hidden panel (e.g. score block). */
const HIDDEN_2X2_REVEAL_CELLS = new Set([18]);

/** Union stored in level `hiddenBehind` grids. */
const HIDDEN_BEHIND_CELLS = new Set([...HIDDEN_REVEAL_CELLS, ...HIDDEN_2X2_REVEAL_CELLS]);

/** Level grid cell → block type id (single-cell and long-block anchors only). */
const BLOCK_CELL_MAP = {
  0: null,
  1: 'normal',
  2: 'gray',
  3: 'power',
  4: 'spike',
  5: 'indestructible',
  6: 'normal_long_h',
  8: 'normal_long_v',
  10: 'gray_long_h',
  12: 'gray_long_v',
  14: 'power_long_h',
  16: 'power_long_v',
  18: 'score',
  22: 'bonus',
  23: 'hidden',
  24: 'hidden_2x2',
};

/** Long-block extension cells (second half of footprint; not spawned as their own body). */
const BLOCK_CELL_EXTENSION = {
  7: { anchorCell: 6, dCol: -1, dRow: 0 },
  9: { anchorCell: 8, dCol: 0, dRow: -1 },
  11: { anchorCell: 10, dCol: -1, dRow: 0 },
  13: { anchorCell: 12, dCol: 0, dRow: -1 },
  15: { anchorCell: 14, dCol: -1, dRow: 0 },
  17: { anchorCell: 16, dCol: 0, dRow: -1 },
  19: { anchorCell: 18, dCol: -1, dRow: 0 },
  20: { anchorCell: 18, dCol: 0, dRow: -1 },
  21: { anchorCell: 18, dCol: -1, dRow: -1 },
  25: { anchorCell: 24, dCol: -1, dRow: 0 },
  26: { anchorCell: 24, dCol: 0, dRow: -1 },
  27: { anchorCell: 24, dCol: -1, dRow: -1 },
};

/** Score block — 2×2 anchor `18` plus extension cells `19`–`21`. */
const SCORE_BLOCK_CELLS = [
  { dc: 0, dr: 0, v: 18 },
  { dc: 1, dr: 0, v: 19 },
  { dc: 0, dr: 1, v: 20 },
  { dc: 1, dr: 1, v: 21 },
];

const HIDDEN_2X2_BLOCK_CELLS = [
  { dc: 0, dr: 0, v: 24 },
  { dc: 1, dr: 0, v: 25 },
  { dc: 0, dr: 1, v: 26 },
  { dc: 1, dr: 1, v: 27 },
];

const LONG_BLOCK_PAINT = {
  6: { ext: 7, dCol: 1, dRow: 0 },
  8: { ext: 9, dCol: 0, dRow: 1 },
  10: { ext: 11, dCol: 1, dRow: 0 },
  12: { ext: 13, dCol: 0, dRow: 1 },
  14: { ext: 15, dCol: 1, dRow: 0 },
  16: { ext: 17, dCol: 0, dRow: 1 },
};

function isBlockExtensionCell(cell) {
  return Object.prototype.hasOwnProperty.call(BLOCK_CELL_EXTENSION, cell);
}

function isBlockAnchorCell(cell) {
  return (
    Object.prototype.hasOwnProperty.call(LONG_BLOCK_PAINT, cell) || cell === 18 || cell === HIDDEN_2X2_BLOCK_CELL
  );
}

function resolveBlockAnchor(cells, col, row) {
  const v = cells?.[row]?.[col];
  if (!v) return null;
  if (isBlockAnchorCell(v)) return { col, row, anchorCell: v };
  const ext = BLOCK_CELL_EXTENSION[v];
  if (!ext) return null;
  return { col: col + ext.dCol, row: row + ext.dRow, anchorCell: ext.anchorCell };
}

/** @deprecated Use resolveBlockAnchor */
function resolveLongBlockAnchor(cells, col, row) {
  return resolveBlockAnchor(cells, col, row);
}

function clearScoreFootprint(cells, col, row) {
  for (const slot of SCORE_BLOCK_CELLS) {
    const r = row + slot.dr;
    const c = col + slot.dc;
    if (cells[r]?.[c] != null) cells[r][c] = 0;
  }
}

function clearHidden2x2Footprint(cells, col, row) {
  for (const slot of HIDDEN_2X2_BLOCK_CELLS) {
    const r = row + slot.dr;
    const c = col + slot.dc;
    if (cells[r]?.[c] != null) cells[r][c] = 0;
  }
}

function canPaintScoreBlock(cells, cols, rows, col, row) {
  for (const slot of SCORE_BLOCK_CELLS) {
    const c = col + slot.dc;
    const r = row + slot.dr;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
    const v = cells[r][c];
    if (!v) continue;
    const existing = resolveBlockAnchor(cells, c, r);
    if (existing && existing.col === col && existing.row === row && existing.anchorCell === 18) {
      continue;
    }
    return false;
  }
  return true;
}

function paintScoreBlockCells(cells, col, row) {
  for (const slot of SCORE_BLOCK_CELLS) {
    cells[row + slot.dr][col + slot.dc] = slot.v;
  }
  return true;
}

function canPaintHidden2x2Block(cells, cols, rows, col, row) {
  for (const slot of HIDDEN_2X2_BLOCK_CELLS) {
    const c = col + slot.dc;
    const r = row + slot.dr;
    if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
    const v = cells[r][c];
    if (!v) continue;
    const existing = resolveBlockAnchor(cells, c, r);
    if (
      existing &&
      existing.col === col &&
      existing.row === row &&
      existing.anchorCell === HIDDEN_2X2_BLOCK_CELL
    ) {
      continue;
    }
    return false;
  }
  return true;
}

function paintHidden2x2BlockCells(cells, col, row) {
  for (const slot of HIDDEN_2X2_BLOCK_CELLS) {
    cells[row + slot.dr][col + slot.dc] = slot.v;
  }
  return true;
}

function migrateHidden2x2Footprints(cells, cols, rows) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (cells[row][col] !== HIDDEN_2X2_BLOCK_CELL) continue;
      const complete =
        cells[row][col + 1] === 25 &&
        cells[row + 1]?.[col] === 26 &&
        cells[row + 1]?.[col + 1] === 27;
      if (complete) continue;
      if (canPaintHidden2x2Block(cells, cols, rows, col, row)) {
        paintHidden2x2BlockCells(cells, col, row);
      } else {
        clearHidden2x2Footprint(cells, col, row);
      }
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const v = cells[row][col];
      if (v !== 25 && v !== 26 && v !== 27) continue;
      const anchor = resolveBlockAnchor(cells, col, row);
      if (!anchor || anchor.anchorCell !== HIDDEN_2X2_BLOCK_CELL) cells[row][col] = 0;
    }
  }
}

function migrateScoreFootprints(cells, cols, rows) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (cells[row][col] !== 18) continue;
      const complete =
        cells[row][col + 1] === 19 &&
        cells[row + 1]?.[col] === 20 &&
        cells[row + 1]?.[col + 1] === 21;
      if (complete) continue;
      if (canPaintScoreBlock(cells, cols, rows, col, row)) {
        paintScoreBlockCells(cells, col, row);
      } else {
        clearScoreFootprint(cells, col, row);
      }
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const v = cells[row][col];
      if (v !== 19 && v !== 20 && v !== 21) continue;
      const anchor = resolveBlockAnchor(cells, col, row);
      if (!anchor || anchor.anchorCell !== 18) cells[row][col] = 0;
    }
  }
}

function clearBlockFootprint(cells, col, row) {
  const anchor = resolveBlockAnchor(cells, col, row);
  if (anchor?.anchorCell === 18) {
    clearScoreFootprint(cells, anchor.col, anchor.row);
    return;
  }
  if (anchor?.anchorCell === HIDDEN_2X2_BLOCK_CELL) {
    clearHidden2x2Footprint(cells, anchor.col, anchor.row);
    return;
  }
  if (anchor && LONG_BLOCK_PAINT[anchor.anchorCell]) {
    const paint = LONG_BLOCK_PAINT[anchor.anchorCell];
    cells[anchor.row][anchor.col] = 0;
    cells[anchor.row + paint.dRow][anchor.col + paint.dCol] = 0;
    return;
  }
  if (cells[row]?.[col]) cells[row][col] = 0;
}

function getBlockTypeFromCell(cell) {
  if (!cell || isBlockExtensionCell(cell)) return null;
  return BLOCK_CELL_MAP[cell] ?? null;
}

function getBlockFootprint(typeId) {
  const def = getBlockDef(typeId);
  return { colSpan: def.colSpan ?? 1, rowSpan: def.rowSpan ?? 1 };
}

const BONUS_CHANCE_IMMUNE_TYPES = new Set(['indestructible', 'spike']);

/** Whether a live block can be turned into a pass-through bonus block (Bonus Chance item). */
function canBlockBecomeBonus(typeId) {
  return Boolean(typeId) && !BONUS_CHANCE_IMMUNE_TYPES.has(typeId);
}

/** Points awarded when collecting a converted bonus block. */
function getBonusCollectPoints(typeId, extra = {}) {
  if (typeId === 'score') {
    const tiers = getBlockDef('score').scoreTiers || [50];
    const hits = extra.scoreHits || 0;
    return tiers[Math.min(hits, tiers.length - 1)];
  }
  const def = getBlockDef(typeId);
  return typeof def.points === 'number' ? def.points : 0;
}

function canPaintLongBlock(cells, cols, rows, col, row, anchorCell) {
  const paint = LONG_BLOCK_PAINT[anchorCell];
  if (!paint) return false;
  const c2 = col + paint.dCol;
  const r2 = row + paint.dRow;
  if (col < 0 || row < 0 || c2 < 0 || r2 < 0 || col >= cols || row >= rows || c2 >= cols || r2 >= rows) {
    return false;
  }
  const slots = [
    { c: col, r: row },
    { c: c2, r: r2 },
  ];
  for (const { c, r } of slots) {
    const v = cells[r][c];
    if (!v) continue;
    const existing = resolveBlockAnchor(cells, c, r);
    if (existing && existing.col === col && existing.row === row && existing.anchorCell === anchorCell) {
      continue;
    }
    return false;
  }
  return true;
}

function paintLongBlockCells(cells, col, row, anchorCell) {
  const paint = LONG_BLOCK_PAINT[anchorCell];
  if (!paint) return false;
  cells[row][col] = anchorCell;
  cells[row + paint.dRow][col + paint.dCol] = paint.ext;
  return true;
}

function getBlockDef(typeId) {
  return BLOCK_TYPES[typeId] || BLOCK_TYPES.normal;
}

/** Whether destroying this block type can complete the level (score/spike/indestructible: false). */
function blockCountsTowardLevelClear(typeId) {
  if (!typeId || typeId === 'score' || typeId === 'hidden' || typeId === 'hidden_2x2') return false;
  return getBlockDef(typeId).countsTowardClear === true;
}

/** Gameplay: hidden panels are collidable but not drawn until first hit. */
function isUnrevealedHiddenBlock(block) {
  if (!block?.getData) return false;
  if (block.getData('hiddenRevealed')) return false;
  const typeId = block.getData('typeId');
  return typeId === 'hidden' || typeId === 'hidden_2x2';
}

function normalizeHiddenRevealCell(cell) {
  return HIDDEN_BEHIND_CELLS.has(cell) ? cell : 1;
}

function normalizeHiddenRevealCellForSurface(surfaceCell, revealCell) {
  const v = normalizeHiddenRevealCell(revealCell);
  if (surfaceCell === HIDDEN_2X2_BLOCK_CELL) return v;
  if (HIDDEN_2X2_REVEAL_CELLS.has(v)) return 1;
  return v;
}

function ensureHiddenBehindGrid(level, cols, rows) {
  if (!level) return Array.from({ length: rows }, () => Array(cols).fill(0));
  if (!level.blocks) level.blocks = {};
  const raw = level.blocks.hiddenBehind;
  const grid = Array.from({ length: rows }, (_, row) => {
    const src = raw?.[row];
    return Array.from({ length: cols }, (_, col) => {
      const v = Number(src?.[col]) || 0;
      return v && HIDDEN_BEHIND_CELLS.has(v) ? v : 0;
    });
  });
  level.blocks.hiddenBehind = grid;
  return grid;
}

function hiddenSurfaceAnchorCell(level, col, row, surfaceCell) {
  if (surfaceCell != null) return surfaceCell;
  const cells = level?.blocks?.cells;
  if (!cells) return null;
  const anchor = resolveBlockAnchor(cells, col, row);
  return anchor?.anchorCell ?? cells[row]?.[col] ?? null;
}

function getHiddenRevealCell(level, col, row, surfaceCell) {
  const v = level?.blocks?.hiddenBehind?.[row]?.[col];
  const surface = hiddenSurfaceAnchorCell(level, col, row, surfaceCell);
  return normalizeHiddenRevealCellForSurface(surface, v || 1);
}

function setHiddenRevealCell(level, col, row, revealCell, surfaceCell) {
  if (!level.blocks) level.blocks = {};
  const grid = level.blocks.hiddenBehind;
  if (!grid?.[row]) return;
  const surface = hiddenSurfaceAnchorCell(level, col, row, surfaceCell);
  grid[row][col] = normalizeHiddenRevealCellForSurface(surface, revealCell);
}

function clearHiddenRevealCell(level, col, row) {
  const grid = level?.blocks?.hiddenBehind;
  if (grid?.[row]) grid[row][col] = 0;
}

function setHiddenRevealFootprint(level, col, row, revealCell) {
  for (const slot of HIDDEN_2X2_BLOCK_CELLS) {
    setHiddenRevealCell(level, col + slot.dc, row + slot.dr, revealCell);
  }
}

function clearHiddenRevealFootprint(level, col, row) {
  for (const slot of HIDDEN_2X2_BLOCK_CELLS) {
    clearHiddenRevealCell(level, col + slot.dc, row + slot.dr);
  }
}

function getCompendiumEntry(typeId) {
  return BLOCK_COMPENDIUM.find((b) => b.id === typeId);
}

function resolveBlockHit(typeId, isPowered) {
  const def = getBlockDef(typeId);
  if (def.normalHit === 'hazard' || def.isHazard) {
    if (isPowered && def.powerHit === 'hazard_bounce') return { action: 'hazard_bounce', points: 0 };
    return { action: 'hazard', points: 0 };
  }
  if (isPowered) {
    if (def.powerHit === 'destroy') return { action: 'destroy', points: def.points };
    if (def.powerHit === 'immune') return { action: 'immune', points: 0 };
  }
  if (def.powerOnly || def.normalHit === 'immune') return { action: 'immune', points: 0 };
  if (def.normalHit === 'damage_to_normal' && def.downgradeTo) {
    return { action: 'downgrade', toType: def.downgradeTo, points: 0 };
  }
  if (def.normalHit === 'reveal' || typeId === 'hidden' || typeId === 'hidden_2x2') {
    return { action: 'reveal' };
  }
  if (def.normalHit === 'hit_increment' || def.powerHit === 'hit_increment_high') {
    return { action: 'score_hit', powered: isPowered };
  }
  if (def.normalHit === 'collect' || def.normalHit === 'pass_through') {
    return { action: 'collect', points: def.points ?? 0 };
  }
  if (def.normalHit === 'destroy') return { action: 'destroy', points: def.points };
  return { action: 'immune', points: 0 };
}

if (typeof globalThis !== 'undefined') {
  globalThis.blockCountsTowardLevelClear = blockCountsTowardLevelClear;
  globalThis.isUnrevealedHiddenBlock = isUnrevealedHiddenBlock;
  globalThis.HIDDEN_BLOCK_CELL = HIDDEN_BLOCK_CELL;
  globalThis.HIDDEN_2X2_BLOCK_CELL = HIDDEN_2X2_BLOCK_CELL;
  globalThis.HIDDEN_REVEAL_CELLS = HIDDEN_REVEAL_CELLS;
  globalThis.HIDDEN_2X2_REVEAL_CELLS = HIDDEN_2X2_REVEAL_CELLS;
  globalThis.HIDDEN_BEHIND_CELLS = HIDDEN_BEHIND_CELLS;
  globalThis.normalizeHiddenRevealCellForSurface = normalizeHiddenRevealCellForSurface;
  globalThis.canPaintHidden2x2Block = canPaintHidden2x2Block;
  globalThis.paintHidden2x2BlockCells = paintHidden2x2BlockCells;
  globalThis.setHiddenRevealFootprint = setHiddenRevealFootprint;
  globalThis.clearHiddenRevealFootprint = clearHiddenRevealFootprint;
  globalThis.clearHidden2x2Footprint = clearHidden2x2Footprint;
  globalThis.paintScoreBlockCells = paintScoreBlockCells;
  globalThis.ensureHiddenBehindGrid = ensureHiddenBehindGrid;
  globalThis.getHiddenRevealCell = getHiddenRevealCell;
  globalThis.setHiddenRevealCell = setHiddenRevealCell;
  globalThis.clearHiddenRevealCell = clearHiddenRevealCell;
  globalThis.normalizeHiddenRevealCell = normalizeHiddenRevealCell;
}
