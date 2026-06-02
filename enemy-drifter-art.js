/**
 * Block Ball — 2D placeholder art for Drifter (editor + non-3D demo).
 */

/** Shell silhouette — erratic floater. */
function buildDrifterCanvas(cellW, cellH) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const cx = cellW / 2;
  const cy = cellH * 0.52;

  // Outer shell
  c.fillStyle = '#e8b4a0';
  c.beginPath();
  c.ellipse(cx, cy, cellW * 0.38, cellH * 0.34, 0, 0, Math.PI * 2);
  c.fill();

  // Spiral ridges
  c.strokeStyle = '#c9927a';
  c.lineWidth = Math.max(1, cellW * 0.04);
  for (let i = 0; i < 4; i++) {
    const r = cellW * (0.12 + i * 0.07);
    c.beginPath();
    c.arc(cx + cellW * 0.04, cy - cellH * 0.02, r, Math.PI * 0.15, Math.PI * 1.35);
    c.stroke();
  }

  // Highlight
  c.fillStyle = 'rgba(255, 255, 255, 0.35)';
  c.beginPath();
  c.ellipse(cx - cellW * 0.1, cy - cellH * 0.12, cellW * 0.12, cellH * 0.08, -0.4, 0, Math.PI * 2);
  c.fill();

  // Eye peek
  c.fillStyle = '#2a2520';
  c.beginPath();
  c.arc(cx + cellW * 0.08, cy + cellH * 0.04, cellW * 0.045, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx + cellW * 0.1, cy + cellH * 0.02, cellW * 0.018, 0, Math.PI * 2);
  c.fill();

  return canvas;
}

if (typeof globalThis !== 'undefined') {
  globalThis.buildDrifterCanvas = buildDrifterCanvas;
}
