/**
 * Block Ball — 2D placeholder art for Saucer (editor + non-3D demo).
 */

function buildSaucerCanvas(cellW, cellH) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const cx = cellW / 2;
  const cy = cellH * 0.48;

  // Glow
  c.fillStyle = 'rgba(120, 220, 255, 0.25)';
  c.beginPath();
  c.ellipse(cx, cy + cellH * 0.08, cellW * 0.44, cellH * 0.12, 0, 0, Math.PI * 2);
  c.fill();

  // Disc
  c.fillStyle = '#8aa0b8';
  c.beginPath();
  c.ellipse(cx, cy + cellH * 0.06, cellW * 0.42, cellH * 0.1, 0, 0, Math.PI * 2);
  c.fill();

  // Dome
  c.fillStyle = '#66ccff';
  c.beginPath();
  c.ellipse(cx, cy - cellH * 0.02, cellW * 0.22, cellH * 0.2, 0, Math.PI, 0);
  c.fill();

  c.fillStyle = 'rgba(255, 255, 255, 0.45)';
  c.beginPath();
  c.ellipse(cx - cellW * 0.06, cy - cellH * 0.1, cellW * 0.08, cellH * 0.05, -0.5, 0, Math.PI * 2);
  c.fill();

  // Lights
  c.fillStyle = '#ffe066';
  for (let i = -2; i <= 2; i++) {
    c.beginPath();
    c.arc(cx + i * cellW * 0.11, cy + cellH * 0.08, cellW * 0.035, 0, Math.PI * 2);
    c.fill();
  }

  return canvas;
}

if (typeof globalThis !== 'undefined') {
  globalThis.buildSaucerCanvas = buildSaucerCanvas;
}
