/**
 * Block Ball — 2D placeholder art for Horizontal Flyer (editor + non-3D demo).
 */

/** Cute aerial monster — matches cute_monster.glb silhouette. */
function buildHorizontalFlyerCanvas(cellW, cellH) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const cx = cellW / 2;
  const cy = cellH * 0.5;

  // Soft shadow / float glow
  c.fillStyle = 'rgba(120, 80, 200, 0.2)';
  c.beginPath();
  c.ellipse(cx, cy + cellH * 0.22, cellW * 0.34, cellH * 0.08, 0, 0, Math.PI * 2);
  c.fill();

  // Body
  c.fillStyle = '#9b6fd4';
  c.beginPath();
  c.ellipse(cx, cy, cellW * 0.36, cellH * 0.32, 0, 0, Math.PI * 2);
  c.fill();

  // Belly
  c.fillStyle = '#c9a8e8';
  c.beginPath();
  c.ellipse(cx, cy + cellH * 0.06, cellW * 0.22, cellH * 0.18, 0, 0, Math.PI * 2);
  c.fill();

  // Horns
  c.fillStyle = '#7a4fb8';
  c.beginPath();
  c.moveTo(cx - cellW * 0.18, cy - cellH * 0.18);
  c.lineTo(cx - cellW * 0.28, cy - cellH * 0.38);
  c.lineTo(cx - cellW * 0.1, cy - cellH * 0.22);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(cx + cellW * 0.18, cy - cellH * 0.18);
  c.lineTo(cx + cellW * 0.28, cy - cellH * 0.38);
  c.lineTo(cx + cellW * 0.1, cy - cellH * 0.22);
  c.closePath();
  c.fill();

  // Eyes
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx - cellW * 0.12, cy - cellH * 0.04, cellW * 0.09, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.12, cy - cellH * 0.04, cellW * 0.09, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#2a1a40';
  c.beginPath();
  c.arc(cx - cellW * 0.1, cy - cellH * 0.03, cellW * 0.045, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.14, cy - cellH * 0.03, cellW * 0.045, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx - cellW * 0.08, cy - cellH * 0.05, cellW * 0.018, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.16, cy - cellH * 0.05, cellW * 0.018, 0, Math.PI * 2);
  c.fill();

  // Smile
  c.strokeStyle = '#5a3588';
  c.lineWidth = Math.max(1, cellW * 0.035);
  c.lineCap = 'round';
  c.beginPath();
  c.arc(cx, cy + cellH * 0.06, cellW * 0.1, 0.15, Math.PI - 0.15);
  c.stroke();

  return canvas;
}

if (typeof globalThis !== 'undefined') {
  globalThis.buildHorizontalFlyerCanvas = buildHorizontalFlyerCanvas;
}
