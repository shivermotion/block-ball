/**
 * Power block rendering — procedural textures sized to each footprint.
 */
/* global Phaser */

const BLOCK_SLOT_PAD = 2;

/** Proportional corner radii for procedural block tiles. */
function blockProceduralRadii(w, h) {
  const m = Math.min(w, h);
  return {
    outer: Math.max(6, Math.round(m * 0.24)),
    inner: Math.max(4, Math.round(m * 0.17)),
    detail: Math.max(3, Math.round(m * 0.12)),
  };
}

function isNormalBlockType(typeId) {
  return typeId === 'normal' || typeId === 'normal_long_h' || typeId === 'normal_long_v';
}

function isGrayBlockType(typeId) {
  return typeId === 'gray' || typeId === 'gray_long_h' || typeId === 'gray_long_v';
}

function normalStarOuterRadius(w, h) {
  return Math.min(w, h) * 0.26;
}

/** Single rounded cute black spike (hazard blocks). */
const SPIKE_STYLE = {
  fill: 0x1a1520,
  fillCanvas: '#1a1520',
  /** Diagonal sheen — tip/upper-left → base/lower-right */
  sheenLight: 0x9a8ab8,
  sheenLightCanvas: '#9a8ab8',
  sheenMid: 0x3a3048,
  sheenMidCanvas: '#3a3048',
  sheenDark: 0x08060c,
  sheenDarkCanvas: '#08060c',
  tipYFrac: 0.1,
  baseYFrac: 1,
  halfWFrac: 0.38,
};

function cuteSpikeLayout(pad, innerW, innerH) {
  return {
    cx: pad + innerW * 0.5,
    tipY: pad + innerH * SPIKE_STYLE.tipYFrac,
    baseY: pad + innerH * SPIKE_STYLE.baseYFrac,
    halfW: innerW * SPIKE_STYLE.halfWFrac,
  };
}

/** Rounded teardrop pointing up (Phaser y-down). */
function sampleCuteSpikePoints(cx, tipY, baseY, halfW, segments = 10) {
  const bulge = halfW * 0.24;
  const left = { x: cx - halfW, y: baseY };
  const tip = { x: cx, y: tipY };
  const right = { x: cx + halfW, y: baseY };
  const baseMid = { x: cx, y: baseY - bulge * 0.45 };
  const leftMid = { x: cx - halfW * 0.38, y: (baseY + tipY) * 0.38 };
  const rightMid = { x: cx + halfW * 0.38, y: (baseY + tipY) * 0.38 };
  const pts = [];

  const quad = (a, b, c, segs) => {
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const u = 1 - t;
      pts.push({
        x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
        y: u * u * a.y + 2 * u * t * b.y + t * t * c.y,
      });
    }
  };

  quad(left, leftMid, tip, segments);
  quad(tip, rightMid, right, segments);
  quad(right, baseMid, left, Math.max(6, Math.floor(segments * 0.85)));
  return pts;
}

function traceCuteSpikePath(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

/** Clip to spike silhouette and fill with a diagonal gradient sheen. */
function fillCuteSpikeGradientCanvas(ctx, pad, innerW, innerH) {
  const { cx, tipY, baseY, halfW } = cuteSpikeLayout(pad, innerW, innerH);
  const pts = sampleCuteSpikePoints(cx, tipY, baseY, halfW);

  ctx.save();
  traceCuteSpikePath(ctx, pts);
  ctx.clip();

  const grad = ctx.createLinearGradient(
    cx - halfW * 0.45,
    tipY,
    cx + halfW * 0.55,
    baseY + halfW * 0.12
  );
  grad.addColorStop(0, SPIKE_STYLE.sheenLightCanvas);
  grad.addColorStop(0.38, SPIKE_STYLE.sheenMidCanvas);
  grad.addColorStop(1, SPIKE_STYLE.sheenDarkCanvas);
  ctx.fillStyle = grad;
  ctx.fillRect(cx - halfW * 1.1, tipY - halfW * 0.2, halfW * 2.2, baseY - tipY + 1);
  ctx.restore();
}

function drawCuteSpikePhaser(g, pad, innerW, innerH) {
  const { cx, tipY, baseY, halfW } = cuteSpikeLayout(pad, innerW, innerH);
  const pts = sampleCuteSpikePoints(cx, tipY, baseY, halfW);

  if (typeof g.fillGradientStyle === 'function') {
    g.fillGradientStyle(
      SPIKE_STYLE.sheenLight,
      SPIKE_STYLE.sheenMid,
      SPIKE_STYLE.sheenMid,
      SPIKE_STYLE.sheenDark,
      1
    );
    g.fillPoints(pts, true);
    return;
  }

  g.fillStyle(SPIKE_STYLE.fill, 1);
  g.fillPoints(pts, true);
  const shinePts = sampleCuteSpikePoints(
    cx - innerW * 0.07,
    tipY + innerH * 0.07,
    baseY - innerH * 0.06,
    halfW * 0.34,
    7
  );
  g.fillStyle(SPIKE_STYLE.sheenMid, 0.42);
  g.fillPoints(shinePts, true);
}

function drawCuteSpikeCanvas(ctx, pad, innerW, innerH) {
  fillCuteSpikeGradientCanvas(ctx, pad, innerW, innerH);
}

/** Black outline star on normal blocks */
const NORMAL_STAR_OUTLINE = '#220044';

const NORMAL_STAR_STYLE = {
  innerRatio: 0.66,
  roundness: 0.42,
  curveSegments: 6,
};

/** Stepped star rotation interval (matches launch-aim ticker in demo). */
const NORMAL_STAR_TICK_MS = 650;
const NORMAL_STAR_STEPS_PER_REV = 8;

/** Discrete rotation angle for normal-block stars at a given time. */
function normalStarTickerAngle(timeMs, tickMs = NORMAL_STAR_TICK_MS, phase = 0) {
  const step = Math.floor(timeMs / tickMs);
  const stepAngle = (Math.PI * 2) / NORMAL_STAR_STEPS_PER_REV;
  return (step % NORMAL_STAR_STEPS_PER_REV) * stepAngle + phase;
}

/** Per-block phase offset so stars are not perfectly synchronized. */
function normalStarTickerPhase(gridCol = 0, gridRow = 0) {
  const slot = (((gridCol * 5 + gridRow * 3) % NORMAL_STAR_STEPS_PER_REV) + NORMAL_STAR_STEPS_PER_REV) %
    NORMAL_STAR_STEPS_PER_REV;
  return slot * ((Math.PI * 2) / NORMAL_STAR_STEPS_PER_REV);
}

/** Cute soft 5-point star — rotation defaults to point-up. */
function buildNormalStarPoints(cx, cy, outerR, innerRatio = NORMAL_STAR_STYLE.innerRatio, points = 5, rotation = -Math.PI / 2) {
  const innerR = outerR * innerRatio;
  const result = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = rotation + (i * Math.PI) / points;
    result.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return result;
}

/** Rounded star outline sampled as a polyline (Phaser + canvas). */
function sampleRoundedNormalStarPoints(cx, cy, outerR, opts = {}) {
  const innerRatio = opts.innerRatio ?? NORMAL_STAR_STYLE.innerRatio;
  const roundness = opts.roundness ?? NORMAL_STAR_STYLE.roundness;
  const segments = opts.segments ?? NORMAL_STAR_STYLE.curveSegments;
  const corners = buildNormalStarPoints(cx, cy, outerR, innerRatio);
  const n = corners.length;
  const result = [];

  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const curr = corners[i];
    const next = corners[(i + 1) % n];
    const sx = prev.x + (curr.x - prev.x) * (1 - roundness);
    const sy = prev.y + (curr.y - prev.y) * (1 - roundness);
    const ex = curr.x + (next.x - curr.x) * roundness;
    const ey = curr.y + (next.y - curr.y) * roundness;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const u = 1 - t;
      result.push({
        x: u * u * sx + 2 * u * t * curr.x + t * t * ex,
        y: u * u * sy + 2 * u * t * curr.y + t * t * ey,
      });
    }
  }
  return result;
}

function offsetNormalStarPoints(pts, cx, cy, dx, dy, scale = 1) {
  return pts.map((p) => ({
    x: cx + (p.x - cx) * scale + dx,
    y: cy + (p.y - cy) * scale + dy,
  }));
}

function traceNormalStarPath(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

/** Black outline star for canvas 2D (editor). */
function drawDebossedNormalStarCanvas(ctx, cx, cy, outerR) {
  const pts = sampleRoundedNormalStarPoints(cx, cy, outerR);
  ctx.strokeStyle = NORMAL_STAR_OUTLINE;
  ctx.lineWidth = Math.max(1.5, outerR * 0.16);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  traceNormalStarPath(ctx, pts);
  ctx.stroke();
}

/** Black outline star for Phaser Graphics (game textures). */
function drawDebossedNormalStarPhaser(g, cx, cy, outerR) {
  const pts = sampleRoundedNormalStarPoints(cx, cy, outerR);
  g.lineStyle(Math.max(1.5, outerR * 0.16), 0x220044, 1);
  g.strokePoints(pts, true);
}

/** Yellow fill + brown outline — matches score / shield block 3D stars. */
const SCORE_STAR_FACE_STYLE = {
  fill: 0xffee44,
  fillCanvas: '#ffee44',
  outline: 0x331100,
  outlineCanvas: '#331100',
};

function drawFilledScoreStarCanvas(ctx, cx, cy, outerR) {
  const pts = sampleRoundedNormalStarPoints(cx, cy, outerR);
  ctx.fillStyle = SCORE_STAR_FACE_STYLE.fillCanvas;
  traceNormalStarPath(ctx, pts);
  ctx.fill();
  ctx.strokeStyle = SCORE_STAR_FACE_STYLE.outlineCanvas;
  ctx.lineWidth = Math.max(1.5, outerR * 0.12);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  traceNormalStarPath(ctx, pts);
  ctx.stroke();
}

function drawFilledScoreStarPhaser(g, cx, cy, outerR) {
  const pts = sampleRoundedNormalStarPoints(cx, cy, outerR);
  g.fillStyle(SCORE_STAR_FACE_STYLE.fill, 1);
  g.fillPoints(pts, true);
  g.lineStyle(Math.max(1.5, outerR * 0.12), SCORE_STAR_FACE_STYLE.outline, 1);
  g.strokePoints(pts, true);
}

/** Filled star on gray blocks — matches block_gray inner/border (static, no ticker). */
const GRAY_STAR_STYLE = {
  fill: 0xa8c0ff,
  fillCanvas: '#a8c0ff',
  outline: 0x4466ff,
  outlineCanvas: '#4466ff',
  innerRatio: 0.66,
  roundness: 0.42,
};

function drawMutedGrayStarCanvas(ctx, cx, cy, outerR) {
  const pts = sampleRoundedNormalStarPoints(cx, cy, outerR, GRAY_STAR_STYLE);
  ctx.fillStyle = GRAY_STAR_STYLE.fillCanvas;
  traceNormalStarPath(ctx, pts);
  ctx.fill();
  ctx.strokeStyle = GRAY_STAR_STYLE.outlineCanvas;
  ctx.lineWidth = Math.max(1, outerR * 0.1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  traceNormalStarPath(ctx, pts);
  ctx.stroke();
}

/** Wooden flip panel (hidden block face). */
function drawHiddenPanelPhaser(g, pad, innerW, innerH, r) {
  g.fillStyle(0x4a382c, 1);
  g.fillRoundedRect(pad, pad, innerW, innerH, r.outer);
  g.fillStyle(0x7a5c48, 1);
  g.fillRoundedRect(pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner);
  const plankH = Math.max(3, Math.floor(innerH / 5));
  g.fillStyle(0x6b5344, 0.55);
  for (let i = 1; i < 5; i++) {
    const y = pad + i * plankH;
    g.fillRect(pad + 3, y, innerW - 6, 1);
  }
  g.lineStyle(2, 0x3d2e24, 0.9);
  g.strokeRoundedRect(pad + 4, pad + 4, innerW - 8, innerH - 8, r.detail);
  const cx = pad + innerW / 2;
  const cy = pad + innerH / 2;
  const q = innerW * 0.14;
  g.fillStyle(0x3d2e24, 0.8);
  g.fillCircle(cx, cy - q * 0.12, q * 0.85);
  g.fillTriangle(cx - q * 0.32, cy + q * 0.5, cx + q * 0.32, cy + q * 0.5, cx, cy + q * 0.08);
}

function drawMutedGrayStarPhaser(g, cx, cy, outerR) {
  const pts = sampleRoundedNormalStarPoints(cx, cy, outerR, GRAY_STAR_STYLE);
  g.fillStyle(GRAY_STAR_STYLE.fill, 1);
  g.fillPoints(pts, true);
  g.lineStyle(Math.max(1, outerR * 0.1), GRAY_STAR_STYLE.outline, 0.92);
  g.strokePoints(pts, true);
}

/** Cute teardrop symbol on block faces (points up). */
const BLOCK_TEARDROP_STYLE = {
  outlineCanvas: '#220044',
  outlinePhaser: 0x220044,
  roundness: 0.52,
  curveSegments: 8,
};

const GRAY_TEARDROP_STYLE = {
  fill: 0xa8c0ff,
  fillCanvas: '#a8c0ff',
  outline: 0x4466ff,
  outlineCanvas: '#4466ff',
};

/** Soft knot ring for a chubby teardrop silhouette. */
function buildCuteTeardropKnots(cx, cy, outerR, yDown = true) {
  const dir = yDown ? 1 : -1;
  return [
    { x: cx, y: cy - dir * outerR * 0.62 },
    { x: cx + outerR * 0.34, y: cy - dir * outerR * 0.48 },
    { x: cx + outerR * 0.72, y: cy - dir * outerR * 0.08 },
    { x: cx + outerR * 0.78, y: cy + dir * outerR * 0.34 },
    { x: cx + outerR * 0.48, y: cy + dir * outerR * 0.62 },
    { x: cx, y: cy + dir * outerR * 0.7 },
    { x: cx - outerR * 0.48, y: cy + dir * outerR * 0.62 },
    { x: cx - outerR * 0.78, y: cy + dir * outerR * 0.34 },
    { x: cx - outerR * 0.72, y: cy - dir * outerR * 0.08 },
    { x: cx - outerR * 0.34, y: cy - dir * outerR * 0.48 },
  ];
}

/** Rounded loop through knot points (same technique as the cute star). */
function sampleRoundedKnotLoop(knots, roundness, segments) {
  const n = knots.length;
  const result = [];
  for (let i = 0; i < n; i++) {
    const prev = knots[(i - 1 + n) % n];
    const curr = knots[i];
    const next = knots[(i + 1) % n];
    const sx = prev.x + (curr.x - prev.x) * (1 - roundness);
    const sy = prev.y + (curr.y - prev.y) * (1 - roundness);
    const ex = curr.x + (next.x - curr.x) * roundness;
    const ey = curr.y + (next.y - curr.y) * roundness;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const u = 1 - t;
      result.push({
        x: u * u * sx + 2 * u * t * curr.x + t * t * ex,
        y: u * u * sy + 2 * u * t * curr.y + t * t * ey,
      });
    }
  }
  return result;
}

/**
 * Cute soft teardrop — chubby bulb, blunt rounded tip.
 * @param {boolean} yDown true for canvas/Phaser (y grows downward); false for Three.js block faces (+y up).
 */
function sampleBlockTeardropPoints(cx, cy, outerR, segments, yDown = true) {
  const roundness = BLOCK_TEARDROP_STYLE.roundness;
  const segs = segments ?? BLOCK_TEARDROP_STYLE.curveSegments;
  const knots = buildCuteTeardropKnots(cx, cy, outerR, yDown);
  return sampleRoundedKnotLoop(knots, roundness, segs);
}

function traceBlockTeardropPath(ctx, cx, cy, outerR) {
  const pts = sampleBlockTeardropPoints(cx, cy, outerR);
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
}

function drawDebossedNormalTeardropCanvas(ctx, cx, cy, outerR) {
  traceBlockTeardropPath(ctx, cx, cy, outerR);
  ctx.strokeStyle = BLOCK_TEARDROP_STYLE.outlineCanvas;
  ctx.lineWidth = Math.max(1.5, outerR * 0.16);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawDebossedNormalTeardropPhaser(g, cx, cy, outerR) {
  const pts = sampleBlockTeardropPoints(cx, cy, outerR);
  g.lineStyle(Math.max(1.5, outerR * 0.16), BLOCK_TEARDROP_STYLE.outlinePhaser, 1);
  g.strokePoints(pts, true);
}

function drawMutedGrayTeardropCanvas(ctx, cx, cy, outerR) {
  traceBlockTeardropPath(ctx, cx, cy, outerR);
  ctx.fillStyle = GRAY_TEARDROP_STYLE.fillCanvas;
  ctx.fill();
}

function drawMutedGrayTeardropPhaser(g, cx, cy, outerR) {
  const pts = sampleBlockTeardropPoints(cx, cy, outerR);
  g.fillStyle(GRAY_TEARDROP_STYLE.fill, 1);
  g.fillPoints(pts, true);
}

function isShieldBlockType(typeId) {
  return typeId === 'shield';
}

const POWER_BLOCK_COLORS = {
  fill: 0x235789,
  border: 0x1a425f,
  glow: 0x8fb4d4,
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
  const pad = BLOCK_SLOT_PAD;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  const r = blockProceduralRadii(innerW, innerH);
  g.clear();
  g.fillStyle(POWER_BLOCK_COLORS.border, 1);
  g.fillRoundedRect(pad, pad, innerW, innerH, r.outer);
  g.fillStyle(POWER_BLOCK_COLORS.fill, 1);
  g.fillRoundedRect(pad + 2, pad + 2, innerW - 4, innerH - 4, r.inner);
  g.lineStyle(2, POWER_BLOCK_COLORS.glow, 0.85);
  g.strokeRoundedRect(pad + 4, pad + 4, innerW - 8, innerH - 8, r.detail);
  g.fillStyle(POWER_BLOCK_COLORS.glow, 0.35);
  g.fillRoundedRect(
    pad + 6,
    pad + 6,
    innerW - 12,
    Math.max(4, innerH * 0.2),
    r.detail
  );
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

if (typeof globalThis !== 'undefined') {
  globalThis.NORMAL_STAR_TICK_MS = NORMAL_STAR_TICK_MS;
  globalThis.normalStarTickerAngle = normalStarTickerAngle;
  globalThis.normalStarTickerPhase = normalStarTickerPhase;
  globalThis.SPIKE_STYLE = SPIKE_STYLE;
  globalThis.cuteSpikeLayout = cuteSpikeLayout;
  globalThis.sampleCuteSpikePoints = sampleCuteSpikePoints;
  globalThis.fillCuteSpikeGradientCanvas = fillCuteSpikeGradientCanvas;
  globalThis.isGrayBlockType = isGrayBlockType;
  globalThis.drawMutedGrayStarCanvas = drawMutedGrayStarCanvas;
  globalThis.drawMutedGrayStarPhaser = drawMutedGrayStarPhaser;
  globalThis.drawHiddenPanelPhaser = drawHiddenPanelPhaser;
  globalThis.sampleBlockTeardropPoints = sampleBlockTeardropPoints;
  globalThis.drawDebossedNormalTeardropCanvas = drawDebossedNormalTeardropCanvas;
  globalThis.drawDebossedNormalTeardropPhaser = drawDebossedNormalTeardropPhaser;
  globalThis.drawFilledScoreStarCanvas = drawFilledScoreStarCanvas;
  globalThis.drawFilledScoreStarPhaser = drawFilledScoreStarPhaser;
  globalThis.drawMutedGrayTeardropCanvas = drawMutedGrayTeardropCanvas;
  globalThis.drawMutedGrayTeardropPhaser = drawMutedGrayTeardropPhaser;
  globalThis.isShieldBlockType = isShieldBlockType;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BLOCK_SLOT_PAD,
    POWER_BLOCK_COLORS,
    getBlockSlotSize,
    isPowerBlockType,
    blockProceduralRadii,
    isNormalBlockType,
    isGrayBlockType,
    normalStarOuterRadius,
    GRAY_STAR_STYLE,
    drawMutedGrayStarCanvas,
    drawMutedGrayStarPhaser,
    sampleBlockTeardropPoints,
    drawDebossedNormalTeardropCanvas,
    drawDebossedNormalTeardropPhaser,
    drawMutedGrayTeardropCanvas,
    drawMutedGrayTeardropPhaser,
    isShieldBlockType,
    buildNormalStarPoints,
    sampleRoundedNormalStarPoints,
    NORMAL_STAR_OUTLINE,
    NORMAL_STAR_STYLE,
    NORMAL_STAR_TICK_MS,
    NORMAL_STAR_STEPS_PER_REV,
    normalStarTickerAngle,
    normalStarTickerPhase,
    drawDebossedNormalStarCanvas,
    drawDebossedNormalStarPhaser,
    SCORE_STAR_FACE_STYLE,
    drawFilledScoreStarCanvas,
    drawFilledScoreStarPhaser,
    SPIKE_STYLE,
    cuteSpikeLayout,
    sampleCuteSpikePoints,
    drawCuteSpikePhaser,
    drawCuteSpikeCanvas,
    fillCuteSpikeGradientCanvas,
    bakePowerBlockTextures,
  };
}
