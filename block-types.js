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
    appearance: 'Cream block with hex cutout (assets/blocks/normal.png)',
    points: 100,
    normalHit: 'destroy',
    powerHit: 'destroy',
    notes: 'Basic building block. Colored (Flip) variants often double points.',
  },
  {
    id: 'gray',
    name: 'Gray Block',
    implemented: true,
    appearance: 'Pale blue-grey stone cube (assets/blocks/gray.png)',
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
    appearance: 'Dark crystalline block — rotated 90°, fills cell (assets/blocks/power.png)',
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
    appearance: 'Grey stone triangle (assets/blocks/spike.png); procedural fallback',
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
    name: 'Score / Bonus Block',
    implemented: false,
    appearance: 'Numbered or flashing',
    points: 0,
    normalHit: 'hit_increment',
    powerHit: 'hit_increment_high',
    notes: 'Up to ~7 hits; escalating points; 1-Ups at max with ability.',
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
};

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
};

/** Long-block extension cells (second half of footprint; not spawned as their own body). */
const BLOCK_CELL_EXTENSION = {
  7: { anchorCell: 6, dCol: -1, dRow: 0 },
  9: { anchorCell: 8, dCol: 0, dRow: -1 },
  11: { anchorCell: 10, dCol: -1, dRow: 0 },
  13: { anchorCell: 12, dCol: 0, dRow: -1 },
  15: { anchorCell: 14, dCol: -1, dRow: 0 },
  17: { anchorCell: 16, dCol: 0, dRow: -1 },
};

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
  return Object.prototype.hasOwnProperty.call(LONG_BLOCK_PAINT, cell);
}

function getBlockTypeFromCell(cell) {
  if (!cell || isBlockExtensionCell(cell)) return null;
  return BLOCK_CELL_MAP[cell] ?? null;
}

function getBlockFootprint(typeId) {
  const def = getBlockDef(typeId);
  return { colSpan: def.colSpan ?? 1, rowSpan: def.rowSpan ?? 1 };
}

function resolveLongBlockAnchor(cells, col, row) {
  const v = cells?.[row]?.[col];
  if (!v) return null;
  if (isBlockAnchorCell(v)) return { col, row, anchorCell: v };
  const ext = BLOCK_CELL_EXTENSION[v];
  if (!ext) return null;
  return { col: col + ext.dCol, row: row + ext.dRow, anchorCell: ext.anchorCell };
}

function clearBlockFootprint(cells, col, row) {
  const anchor = resolveLongBlockAnchor(cells, col, row);
  if (anchor && LONG_BLOCK_PAINT[anchor.anchorCell]) {
    const paint = LONG_BLOCK_PAINT[anchor.anchorCell];
    cells[anchor.row][anchor.col] = 0;
    cells[anchor.row + paint.dRow][anchor.col + paint.dCol] = 0;
    return;
  }
  if (cells[row]?.[col]) cells[row][col] = 0;
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
    const existing = resolveLongBlockAnchor(cells, c, r);
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
  if (def.normalHit === 'destroy') return { action: 'destroy', points: def.points };
  return { action: 'immune', points: 0 };
}
