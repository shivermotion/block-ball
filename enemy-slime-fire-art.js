/**
 * Block Ball — 2D placeholder art for Flame Riser (editor + non-3D demo).
 * 1×1 cell — flames hug the body.
 */

function drawFlameTongue(c, x, y, w, h, colorTop, colorMid) {
  c.fillStyle = colorMid;
  c.beginPath();
  c.moveTo(x - w * 0.35, y);
  c.quadraticCurveTo(x, y - h, x + w * 0.35, y);
  c.quadraticCurveTo(x, y - h * 0.55, x - w * 0.35, y);
  c.fill();
  c.fillStyle = colorTop;
  c.beginPath();
  c.moveTo(x - w * 0.18, y);
  c.quadraticCurveTo(x, y - h * 0.72, x + w * 0.18, y);
  c.quadraticCurveTo(x, y - h * 0.38, x - w * 0.18, y);
  c.fill();
}

/** Fiery slime blob — matches slime_fire.glb silhouette. */
function buildSlimeFireCanvas(cellW, cellH) {
  const canvas = document.createElement('canvas');
  canvas.width = cellW;
  canvas.height = cellH;
  const c = canvas.getContext('2d');
  const cx = cellW / 2;
  const cy = cellH * 0.58;

  c.fillStyle = 'rgba(255, 100, 30, 0.18)';
  c.beginPath();
  c.ellipse(cx, cy, cellW * 0.34, cellH * 0.32, 0, 0, Math.PI * 2);
  c.fill();

  const ring = [
    { a: -Math.PI * 0.82, s: 0.9 },
    { a: -Math.PI * 0.5, s: 1.0 },
    { a: -Math.PI * 0.18, s: 0.88 },
    { a: Math.PI * 0.14, s: 0.95 },
    { a: Math.PI * 0.46, s: 0.9 },
    { a: Math.PI * 0.74, s: 0.92 },
  ];
  const bodyR = cellW * 0.22;
  for (const f of ring) {
    const fx = cx + Math.cos(f.a) * bodyR * 1.1;
    const fy = cy + Math.sin(f.a) * cellH * 0.18 * 1.1;
    drawFlameTongue(
      c,
      fx,
      fy,
      cellW * 0.1 * f.s,
      cellH * 0.2 * f.s,
      '#ffe566',
      'rgba(255, 120, 30, 0.78)'
    );
  }

  const grad = c.createRadialGradient(cx, cy - cellH * 0.04, cellW * 0.03, cx, cy, cellW * 0.26);
  grad.addColorStop(0, '#ffe566');
  grad.addColorStop(0.45, '#ff7a22');
  grad.addColorStop(1, '#c42e10');
  c.fillStyle = grad;
  c.beginPath();
  c.ellipse(cx, cy, cellW * 0.22, cellH * 0.22, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = 'rgba(255, 255, 220, 0.5)';
  c.beginPath();
  c.ellipse(cx - cellW * 0.06, cy - cellH * 0.08, cellW * 0.08, cellH * 0.06, -0.35, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = '#2a1208';
  c.beginPath();
  c.arc(cx - cellW * 0.06, cy - cellH * 0.01, cellW * 0.032, 0, Math.PI * 2);
  c.arc(cx + cellW * 0.07, cy - cellH * 0.02, cellW * 0.028, 0, Math.PI * 2);
  c.fill();

  drawFlameTongue(c, cx - cellW * 0.08, cy - cellH * 0.16, cellW * 0.08, cellH * 0.18, '#fff0aa', 'rgba(255, 140, 35, 0.82)');
  drawFlameTongue(c, cx, cy - cellH * 0.2, cellW * 0.09, cellH * 0.22, '#ffe566', 'rgba(255, 110, 25, 0.85)');
  drawFlameTongue(c, cx + cellW * 0.08, cy - cellH * 0.15, cellW * 0.07, cellH * 0.16, '#fff0aa', 'rgba(255, 130, 30, 0.8)');

  return canvas;
}

if (typeof globalThis !== 'undefined') {
  globalThis.buildSlimeFireCanvas = buildSlimeFireCanvas;
}
