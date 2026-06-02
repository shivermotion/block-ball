/**
 * Block Ball — 2D placeholder art for Ground Walker (editor + non-3D demo).
 */

function fillRoundRect(c, x, y, w, h, r, fill) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  c.beginPath();
  c.moveTo(x + rad, y);
  c.arcTo(x + w, y, x + w, y + h, rad);
  c.arcTo(x + w, y + h, x, y + h, rad);
  c.arcTo(x, y + h, x, y, rad);
  c.arcTo(x, y, x + w, y, rad);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

/** Mushroom silhouette — matches compendium “most common” mob. */
function buildGroundWalkerCanvas(cellW, cellH) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const cx = cellW / 2;
  const pad = Math.max(2, cellW * 0.06);

  // Cap
  c.fillStyle = '#c94a4a';
  c.beginPath();
  c.ellipse(cx, cellH * 0.38, cellW * 0.42 - pad, cellH * 0.28, 0, Math.PI, 0);
  c.fill();

  c.fillStyle = '#f5efe6';
  c.beginPath();
  c.arc(cx - cellW * 0.14, cellH * 0.34, cellW * 0.07, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.1, cellH * 0.3, cellW * 0.05, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.22, cellH * 0.38, cellW * 0.04, 0, Math.PI * 2);
  c.fill();

  // Stem
  fillRoundRect(c, cx - cellW * 0.14, cellH * 0.38, cellW * 0.28, cellH * 0.38, cellW * 0.08, '#e8dcc8');

  // Feet
  c.fillStyle = '#4a423a';
  c.beginPath();
  c.ellipse(cx - cellW * 0.12, cellH * 0.78, cellW * 0.1, cellH * 0.06, 0, 0, Math.PI * 2);
  c.ellipse(cx + cellW * 0.12, cellH * 0.78, cellW * 0.1, cellH * 0.06, 0, 0, Math.PI * 2);
  c.fill();

  // Eyes
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx - cellW * 0.08, cellH * 0.5, cellW * 0.05, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.08, cellH * 0.5, cellW * 0.05, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#2a2520';
  c.beginPath();
  c.arc(cx - cellW * 0.07, cellH * 0.5, cellW * 0.025, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.09, cellH * 0.5, cellW * 0.025, 0, Math.PI * 2);
  c.fill();

  return canvas;
}

if (typeof globalThis !== 'undefined') {
  globalThis.buildGroundWalkerCanvas = buildGroundWalkerCanvas;
}
