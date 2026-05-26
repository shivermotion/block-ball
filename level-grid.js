/**
 * Block Ball — level grid (quantize layout + UI to cells).
 * Every placeable entity occupies exactly one cell (or colSpan × rowSpan cells).
 */

/** Matches arcade frame inset in block-ball-demo.html */
const GAME_FRAME_INSET = 8;

const DEFAULT_LEVEL_GRID = {
  cols: 10,
  rows: 17,
  cellWidth: 36,
  cellHeight: 36,
  originX: 8,
  originY: 92,
};

const DEFAULT_HUD = {
  rows: 2,
  cols: 10,
  cellWidth: 36,
  cellHeight: 36,
  originX: 8,
  originY: 8,
  /** When set, overrides `rows * cellHeight` for HUD strip height (px). */
  height: null,
  padX: 12,
  padY: 8,
};

/** Zone-based HUD slots (order within `right` is left → toward screen edge). */
const DEFAULT_HUD_LAYOUT = {
  left: ['score'],
  right: ['lives', 'avatar'],
  gaps: { betweenZones: 12, livesToAvatar: 10 },
  avatar: { size: 44 },
};

function getHudPixelHeight(level) {
  const h = { ...DEFAULT_HUD, ...(level.hud || {}) };
  if (h.height != null) return h.height;
  return h.rows * h.cellHeight;
}

function createHudGrid(level, gameFrame = null) {
  const config = { ...DEFAULT_HUD, ...(level.hud || {}) };
  const hudHeight = getHudPixelHeight(level);

  if (gameFrame) {
    config.originX = gameFrame.x;
    config.originY = gameFrame.y;
    config.cellWidth = gameFrame.width / (config.cols || 10);
  }

  const bounds = {
    x: config.originX,
    y: config.originY,
    width: gameFrame ? gameFrame.width : config.cols * config.cellWidth,
    height: hudHeight,
  };

  return { config, bounds };
}

/**
 * Pixel positions for HUD widgets (container-local coords).
 * @param {object} level
 * @param {{ width: number, height: number }} bounds
 * @param {{ maxLives?: number }} [options]
 */
function resolveHudLayout(level, bounds, options = {}) {
  const layout = { ...DEFAULT_HUD_LAYOUT, ...(level.hudLayout || {}) };
  const hud = { ...DEFAULT_HUD, ...(level.hud || {}) };
  const padX = hud.padX ?? 12;
  const padY = hud.padY ?? 8;
  const W = bounds.width;
  const H = bounds.height;
  const cy = H / 2;
  const maxLives = options.maxLives ?? 3;
  const lifeStep = 20;
  const gapLA = layout.gaps?.livesToAvatar ?? DEFAULT_HUD_LAYOUT.gaps.livesToAvatar;
  const avatarSize = layout.avatar?.size ?? DEFAULT_HUD_LAYOUT.avatar.size;

  const avatarCx = W - padX - avatarSize / 2;
  const avatarCy = cy;
  /** Lives container origin: rightmost life icon center sits ~8px left of this x (matches prior layout). */
  const livesOriginX = W - padX - avatarSize - gapLA - 8;

  return {
    padX,
    padY,
    cy,
    score: { x: padX, y: cy },
    livesContainer: { x: livesOriginX, y: cy },
    avatar: { x: avatarCx, y: avatarCy, size: avatarSize },
  };
}

function getGameFrameBounds(gameWidth, gameHeight, frameInset = GAME_FRAME_INSET) {
  return {
    x: frameInset,
    y: frameInset,
    width: gameWidth - frameInset * 2,
    height: gameHeight - frameInset * 2,
  };
}

function resolvePlayGridConfig(level, gameHeight = 780, frameInset = GAME_FRAME_INSET) {
  const config = { ...DEFAULT_LEVEL_GRID, ...(level.grid || {}) };
  const fillBelowHud = level.grid?.fillBelowHud !== false;
  const innerBottom = gameHeight - frameInset;

  if (level.hud) {
    const hud = { ...DEFAULT_HUD, ...level.hud };
    const gap = level.hudGap ?? 8;
    const hudH = getHudPixelHeight(level);
    const playTop = level.grid?.originY ?? hud.originY + hudH + gap;
    config.originY = playTop;

    const available = innerBottom - playTop;
    if (fillBelowHud && level.grid?.rows == null) {
      const baseCellH = config.cellHeight;
      config.rows = Math.max(1, Math.floor(available / baseCellH));
      config.cellHeight = available / config.rows;
    } else if (fillBelowHud && level.grid?.rows != null) {
      config.cellHeight = available / config.rows;
    }
  }

  return config;
}

/** Resolve `row` or `rowFromBottom` on play-grid entities (paddle, hazards). */
function resolveGridRow(levelGrid, def) {
  if (def.rowFromBottom != null) {
    return levelGrid.rowFromBottom(def.rowFromBottom);
  }
  return def.row ?? 0;
}

function getPlayAreaTop(level, hudBounds = null) {
  if (!level.hud) {
    return (level.grid || DEFAULT_LEVEL_GRID).originY ?? DEFAULT_LEVEL_GRID.originY;
  }
  if (hudBounds) {
    return hudBounds.y + hudBounds.height + (level.hudGap ?? 8);
  }
  const hudH = getHudPixelHeight(level);
  const hud = { ...DEFAULT_HUD, ...(level.hud || {}) };
  return hud.originY + hudH + (level.hudGap ?? 8);
}

/** Editor / string layouts — see LEVEL_GRID.md */
const BLOCK_LAYOUT_CHARS = {
  '0': 0,
  '.': 0,
  ' ': 0,
  '1': 1,
  n: 1,
  N: 1,
  '2': 2,
  g: 2,
  G: 2,
  '3': 3,
  p: 3,
  P: 3,
  '4': 4,
  s: 4,
  S: 4,
};

function createLevelGrid(level, gameHeight = 780, gameWidth = 390) {
  const frameInset = level.frameInset ?? GAME_FRAME_INSET;
  const config = resolvePlayGridConfig(level, gameHeight, frameInset);
  const gameFrame = getGameFrameBounds(gameWidth, gameHeight, frameInset);
  const innerBottom = gameHeight - frameInset;

  // Default: play grid fills the arcade frame width (fractional cellWidth allowed).
  config.originX = gameFrame.x;
  config.cellWidth = gameFrame.width / config.cols;

  function cellTopLeft(col, row) {
    return {
      x: config.originX + col * config.cellWidth,
      y: config.originY + row * config.cellHeight,
    };
  }

  function cellCenter(col, row) {
    return {
      x: config.originX + col * config.cellWidth + config.cellWidth / 2,
      y: config.originY + row * config.cellHeight + config.cellHeight / 2,
    };
  }

  function cellSpanCenter(col, row, colSpan = 1, rowSpan = 1) {
    return {
      x: config.originX + col * config.cellWidth + (colSpan * config.cellWidth) / 2,
      y: config.originY + row * config.cellHeight + (rowSpan * config.cellHeight) / 2,
    };
  }

  function rowFromBottom(rowsFromBottom) {
    return config.rows - rowsFromBottom;
  }

  function cellCenterFromBottom(col, rowsFromBottom) {
    return cellCenter(col, rowFromBottom(rowsFromBottom));
  }

  function getCellSize() {
    return { width: config.cellWidth, height: config.cellHeight };
  }

  function uiPosition(uiDef, gameWidth, gameHeight) {
    const pad = 4;
    let col = uiDef.col;
    let row = uiDef.row;
    if (uiDef.rowFromBottom != null) {
      row = rowFromBottom(uiDef.rowFromBottom);
    }
    const align = uiDef.align || 'c';
    const tl = cellTopLeft(col, row);
    const center = cellCenter(col, row);

    if (uiDef.yFromBottom != null && gameHeight != null) {
      const y = gameHeight - uiDef.yFromBottom;
      if (align === 'c') return { x: center.x, y };
      if (align === 'tr') return { x: gameWidth - pad, y };
      if (align === 'tl') return { x: pad, y };
      return { x: center.x, y };
    }

    switch (align) {
      case 'tl':
        return { x: tl.x + pad, y: tl.y + pad };
      case 'tr':
        return {
          x: config.originX + (col + 1) * config.cellWidth - pad,
          y: tl.y + pad,
        };
      case 'c':
      default:
        return center;
    }
  }

  function getBounds() {
    return getPlayBounds();
  }

  function getPlayBounds() {
    return {
      x: config.originX,
      y: config.originY,
      width: config.cols * config.cellWidth,
      height: innerBottom - config.originY,
    };
  }

  const hud = level.hud ? createHudGrid(level, gameFrame) : null;
  const playAreaTop = getPlayAreaTop(level, hud ? hud.bounds : null);

  return {
    config,
    gameHeight,
    gameWidth,
    frameInset,
    gameFrame,
    innerBottom,
    hud,
    playAreaTop,
    getPlayBounds,
    cellTopLeft,
    cellCenter,
    cellSpanCenter,
    rowFromBottom,
    cellCenterFromBottom,
    getCellSize,
    uiPosition,
    getBounds,
    iterateCells(fn) {
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          fn(col, row);
        }
      }
    },
  };
}

/** Block at grid cell (anchor.col + col, anchor.row + row). @deprecated Use play-grid cells. */
function blockCellCenter(levelGrid, blocks, col, row) {
  const anchor = blocks.anchor || { col: 0, row: 0 };
  return levelGrid.cellCenter(anchor.col + col, anchor.row + row);
}

/** @deprecated Use play-grid cells. */
function gridToBlockIndex(level, gridCol, gridRow) {
  const anchor = level.blocks?.anchor || { col: 0, row: 0 };
  return { col: gridCol - anchor.col, row: gridRow - anchor.row };
}

/** Copy legacy anchor/layer + spikes into a play-grid-sized 2D array. */
function migrateLegacyBlocksToCells(level, levelGrid) {
  const { cols, rows } = levelGrid.config;
  const cells = Array.from({ length: rows }, () => Array(cols).fill(0));

  const layout = parseBlockLayoutRows(level.blocks?.layer || level.blocks?.layout || []);
  const anchor = level.blocks?.anchor || { col: 0, row: 0 };
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      const gr = anchor.row + r;
      const gc = anchor.col + c;
      if (gr >= 0 && gr < rows && gc >= 0 && gc < cols) {
        cells[gr][gc] = layout[r][c];
      }
    }
  }

  const spikeDef = level.blocks?.spikes;
  if (spikeDef?.cells?.length) {
    const spikeRow =
      spikeDef.rowFromBottom != null
        ? levelGrid.rowFromBottom(spikeDef.rowFromBottom)
        : (spikeDef.row ?? rows - 1);
    const startCol = spikeDef.col ?? 0;
    spikeDef.cells.forEach((cell, i) => {
      const gc = startCol + i;
      if (cell && spikeRow >= 0 && spikeRow < rows && gc >= 0 && gc < cols) {
        cells[spikeRow][gc] = cell;
      }
    });
  }

  return cells;
}

/**
 * Full playfield block grid — one cell value (0–4) per play column/row.
 * Migrates legacy `anchor` + `layer` + `spikes` when `cells` is missing or wrong size.
 */
function ensurePlayBlockCells(level, levelGrid) {
  const { cols, rows } = levelGrid.config;
  if (!level.blocks) level.blocks = {};

  const raw = level.blocks.cells;
  let parsed = raw ? parseBlockLayoutRows(raw) : null;
  const sizeOk =
    parsed &&
    parsed.length === rows &&
    parsed.every((row) => row.length === cols);

  if (sizeOk) {
    level.blocks.cells = parsed;
    return parsed;
  }

  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  if (parsed) {
    for (let r = 0; r < Math.min(parsed.length, rows); r++) {
      for (let c = 0; c < Math.min(parsed[r].length, cols); c++) {
        grid[r][c] = parsed[r][c];
      }
    }
  } else {
    const migrated = migrateLegacyBlocksToCells(level, levelGrid);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[r][c] = migrated[r][c];
      }
    }
  }

  level.blocks.cells = grid;
  return grid;
}

/** Inscribed circle radius for a ball in one cell. */
function ballRadiusForCell(levelGrid, inset = 3) {
  const { cellWidth, cellHeight } = levelGrid.config;
  return Math.floor(Math.min(cellWidth, cellHeight) / 2) - inset;
}

/**
 * Scale display (and optional Arcade body) to fill one grid cell.
 * @returns {{ width: number, height: number, radius?: number }}
 */
function fitEntityToCell(gameObject, levelGrid, options = {}) {
  const { cellWidth, cellHeight } = levelGrid.config;
  const pad = options.padding ?? 1;
  const w = cellWidth - pad * 2;
  const h = cellHeight - pad * 2;

  gameObject.setDisplaySize(w, h);

  if (gameObject.body && options.circle) {
    const r = Math.min(w, h) / 2;
    gameObject.body.setCircle(r);
    return { width: w, height: h, radius: r };
  }

  if (gameObject.body && options.setBody !== false) {
    gameObject.body.setSize(w, h);
  }

  return { width: w, height: h };
}

/** Multi-cell entity (paddle uses heightFraction 0.5, spike row full height). */
function fitEntityToCellSpan(gameObject, levelGrid, colSpan, rowSpan = 1, options = {}) {
  const { cellWidth, cellHeight } = levelGrid.config;
  const pad = options.padding ?? 1;
  const hFrac = options.heightFraction ?? 1;
  const w = colSpan * cellWidth - pad * 2;
  const h = (rowSpan * cellHeight - pad * 2) * hFrac;
  gameObject.setDisplaySize(w, h);
  if (gameObject.body && options.setBody !== false) {
    gameObject.body.setSize(w, h);
  }
  return { width: w, height: h };
}

function parseBlockLayoutRows(rows) {
  return rows.map((row) => {
    if (Array.isArray(row)) return row.map((n) => Number(n) || 0);
    return String(row)
      .split('')
      .map((ch) => BLOCK_LAYOUT_CHARS[ch] ?? 0);
  });
}

function layoutToStrings(layout) {
  const inv = { 0: '.', 1: '1', 2: 'g', 3: 'p', 4: 's' };
  return layout.map((row) => row.map((c) => inv[c] ?? '.').join(''));
}

function drawHudZoneDebug(scene, levelGrid, options = {}) {
  const hud = levelGrid.hud;
  if (!hud) return null;
  const h = hud.config;
  const gfx = scene.add.graphics().setDepth(options.depth ?? 199);
  gfx.fillStyle(0x16082a, 0.35);
  gfx.fillRect(hud.bounds.x, hud.bounds.y, hud.bounds.width, hud.bounds.height);
  gfx.lineStyle(2, 0xffe66d, options.alpha ?? 0.45);
  gfx.strokeRect(hud.bounds.x, hud.bounds.y, hud.bounds.width, hud.bounds.height);
  gfx.lineStyle(2, 0xffe66d, 0.25);
  gfx.lineBetween(hud.bounds.x, hud.bounds.y + hud.bounds.height, hud.bounds.x + hud.bounds.width, hud.bounds.y + hud.bounds.height);

  const cols = Math.max(1, h.cols || 10);
  const cellW = hud.bounds.width / cols;
  for (let c = 0; c <= cols; c++) {
    const x = hud.bounds.x + c * cellW;
    gfx.lineBetween(x, hud.bounds.y, x, hud.bounds.y + hud.bounds.height);
  }
  const rowCount =
    h.rows != null ? h.rows : Math.max(1, Math.round(hud.bounds.height / (h.cellHeight || 36)));
  const cellH = hud.bounds.height / rowCount;
  for (let r = 0; r <= rowCount; r++) {
    const y = hud.bounds.y + r * cellH;
    gfx.lineBetween(hud.bounds.x, y, hud.bounds.x + hud.bounds.width, y);
  }
  return gfx;
}

function drawLevelGridDebug(scene, levelGrid, level, options = {}) {
  drawHudZoneDebug(scene, levelGrid, options);
  const g = levelGrid.config;
  const gfx = scene.add.graphics().setDepth(options.depth ?? 2);
  const alpha = options.alpha ?? 0.22;
  const color = options.color ?? 0xffe66d;

  gfx.lineStyle(2, 0xffe66d, 0.35);
  gfx.lineBetween(g.originX, levelGrid.playAreaTop, g.originX + g.cols * g.cellWidth, levelGrid.playAreaTop);

  gfx.lineStyle(1, color, alpha);
  for (let c = 0; c <= g.cols; c++) {
    const x = g.originX + c * g.cellWidth;
    gfx.lineBetween(x, g.originY, x, g.originY + g.rows * g.cellHeight);
  }
  for (let r = 0; r <= g.rows; r++) {
    const y = g.originY + r * g.cellHeight;
    gfx.lineBetween(g.originX, y, g.originX + g.cols * g.cellWidth, y);
  }

  const cells = ensurePlayBlockCells(level, levelGrid);
  gfx.lineStyle(1, 0x4da6ff, alpha * 1.2);
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (cells[row][col] === 0) continue;
      const tl = levelGrid.cellTopLeft(col, row);
      gfx.strokeRect(tl.x, tl.y, g.cellWidth, g.cellHeight);
    }
  }

  return gfx;
}

/** Dev outlines: full game canvas, HUD strip, playfield grid. */
function drawDevViewBorders(scene, levelGrid, gameWidth, gameHeight, options = {}) {
  const depth = options.depth ?? 198;
  const gfx = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  const labelDepth = depth + 1;

  function label(x, y, text, color) {
    scene.add
      .text(x, y, text, {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '10px',
        color,
        backgroundColor: '#000000cc',
        padding: { x: 4, y: 2 },
      })
      .setDepth(labelDepth)
      .setScrollFactor(0);
  }

  function strokeRect(x, y, w, h, color, lineWidth) {
    gfx.lineStyle(lineWidth, color, 1);
    gfx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  const frame = levelGrid.gameFrame ?? getGameFrameBounds(gameWidth, gameHeight, levelGrid.frameInset);
  strokeRect(frame.x, frame.y, frame.width, frame.height, 0xffe66d, 2);
  label(frame.x + 4, frame.y + 4, 'GAME', '#ffe66d');

  const hud = levelGrid.hud;
  if (hud) {
    const b = hud.bounds;
    strokeRect(b.x, b.y, b.width, b.height, 0x00ffcc, 3);
    label(b.x + 4, b.y + 3, 'HUD', '#00ffcc');
  }

  const play = levelGrid.getPlayBounds();
  strokeRect(play.x, play.y, play.width, play.height, 0xff66ff, 3);
  label(play.x + 4, play.y + 3, 'PLAY', '#ff66ff');

  return gfx;
}
