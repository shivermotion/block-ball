/**
 * Block Ball — transparent Three.js overlay synced to Phaser sprites.
 * Enable with ?3d=1 on block-ball-demo.html
 *
 * Phaser sprites for meshed entities (blocks, paddle, ball) are hidden; Three.js meshes render on top.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const DIORAMA = {
  /** Soft isometric tilt — blocks lean toward camera; Phaser positions unchanged. */
  viewTiltX: Math.PI / 12,
  viewTiltY: 0,
  blockDepthFrac: 0.62,
  blockLiftPx: 14,
  /** Extra screen lift so tilted blocks sit above their Phaser anchor. */
  tiltLiftFactor: 0.22,
  blockPuffScale: 1.08,
  blockCornerRadiusFrac: 0.34,
  blockBulgeScaleX: 1,
  blockBulgeScaleY: 1,
  blockBulgeScaleZ: 1,
  roundedBoxSegments: 6,
};

/** RoundedBoxGeometry groups: 0±X, 1±X, 2+Y, 3-Y, 4+Z front, 5-Z back. */
const BOX_FACE = { POS_X: 0, NEG_X: 1, POS_Y: 2, NEG_Y: 3, POS_Z: 4, NEG_Z: 5 };

function dioramaFrontFaceIndex() {
  const cos = Math.cos(DIORAMA.viewTiltX);
  const sin = Math.sin(DIORAMA.viewTiltX);
  const faces = [
    { dot: cos, index: BOX_FACE.POS_Z },
    { dot: -cos, index: BOX_FACE.NEG_Z },
    { dot: sin, index: BOX_FACE.POS_Y },
    { dot: -sin, index: BOX_FACE.NEG_Y },
  ];
  return faces.reduce((best, f) => (f.dot > best.dot ? f : best)).index;
}

function dioramaFrontZ(depth) {
  return depth * DIORAMA.blockBulgeScaleZ * 0.5 + 0.12;
}

function dioramaBlockLift(depth) {
  return DIORAMA.blockLiftPx + depth * Math.sin(Math.abs(DIORAMA.viewTiltX)) * DIORAMA.tiltLiftFactor;
}

/** Matches GRAY_DOWNGRADE_FX in block-ball-demo.html */
const GRAY_DOWNGRADE_FX = {
  squashScaleX: 1.14,
  squashScaleY: 0.78,
  squashMs: 52,
  settleMs: 420,
};

const SCORE_BLOCK_FX = {
  starScale: 0.36,
  idleSpinRadPerMs: 0.0028,
  hitSpinMs: 300,
  hitMoveMs: 540,
  hitSpinTurns: 2.25,
  hitMoveMarginFrac: 0.2,
};

/** Panel flip when a hidden block is hit. */
const HIDDEN_BLOCK_REVEAL_FX = {
  flipMs: 260,
};

/** Star set free when the score block is cleared. */
const SCORE_STAR_LIBERATION = {
  spinMs: 400,
  spinTurns: 2.75,
  /** Pop toward camera before lift/exit (ortho: scale + motion along view axis). */
  towardMs: 380,
  towardDist: 62,
  towardScaleMul: 1.95,
  towardSpinTurns: 0.65,
  liftMs: 620,
  liftPx: 52,
  liftSpinTurns: 2.4,
  awayMs: 560,
  awayDist: 135,
  awayYPx: 78,
  awayScaleMul: 0.22,
  awaySpinTurns: 2.2,
};

const _libStarScratch = {
  axis: new THREE.Vector3(),
  camW: new THREE.Vector3(),
};

/** Detach star from block, keep world pose, face the camera (+Z normal toward viewer). */
function detachScoreStarForLiberation(starGroup, blockGroup, root, camera) {
  if (starGroup.parent !== blockGroup) return null;
  root.attach(starGroup);
  starGroup.updateWorldMatrix(true, false);
  prepareStarCameraBillboard(starGroup, camera);
  setLiberatedStarOpacity(starGroup, 1);
  const s = starGroup.scale;
  const safe = (n) => (Number.isFinite(n) && n > 1e-4 ? n : 1);
  return {
    baseRotZ: starGroup.rotation.z,
    baseScale: { x: safe(s.x), y: safe(s.y), z: safe(s.z) },
  };
}

/** Unit vector in root space from star toward the camera. */
function cameraTowardAxisLocal(starGroup, root, camera, out) {
  const starW = _libStarScratch.camW;
  starGroup.getWorldPosition(starW);
  camera.getWorldPosition(out);
  out.sub(starW);
  if (out.lengthSq() < 1e-8) out.set(0, 0, 1);
  else out.normalize();
  out.transformDirection(root.matrixWorld.clone().invert());
  if (!Number.isFinite(out.x)) out.set(0, 0, 1);
  return out;
}

function applyLiberatedStarSpinZ(starGroup, baseRotZ, spinZ) {
  starGroup.rotation.z = baseRotZ + spinZ;
}

function setLiberatedStarScale(starGroup, baseScale, mul) {
  const m = Number.isFinite(mul) && mul > 0 ? mul : 1;
  starGroup.scale.set(baseScale.x * m, baseScale.y * m, baseScale.z * m);
}

/** Matches POWER_BLOCK_RESIST in block-ball-demo.html */
const POWER_BLOCK_FX = {
  godRayAngleDeg: -36,
  godRaySweepMs: 360,
  godRayCoreScale: 0.18,
  godRayHaloScale: 0.36,
  godRayLengthScale: 0.92,
  godRayTravelScale: 1.05,
  godRayCoreAlpha: 0.9,
  godRayHaloAlpha: 0.38,
  squashScaleX: 1.07,
  squashScaleY: 0.86,
  squashInMs: 42,
};

let powerGodRayTexture = null;
let ballFaceTexture = null;
let ballPowerFaceTexture = null;
let ballFaceLoadPromise = null;

const BALL_FACE_URL = 'assets/ball/face.png?v=1';
const BALL_POWER_FACE_URL = 'assets/ball/power.png?v=1';

function loadBallFaceTextureFromUrl(url) {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.premultiplyAlpha = false;
        resolve(tex);
      },
      undefined,
      () => {
        console.warn('[BlockBall:3D] ball face failed to load:', url);
        resolve(null);
      }
    );
  });
}

export function loadBallFaceTexture() {
  if (ballFaceTexture && ballPowerFaceTexture) return Promise.resolve(ballFaceTexture);
  if (ballFaceLoadPromise) return ballFaceLoadPromise;

  ballFaceLoadPromise = Promise.all([
    loadBallFaceTextureFromUrl(BALL_FACE_URL),
    loadBallFaceTextureFromUrl(BALL_POWER_FACE_URL),
  ]).then(([neutral, power]) => {
    ballFaceTexture = neutral;
    ballPowerFaceTexture = power || neutral;
    return ballFaceTexture;
  });

  return ballFaceLoadPromise;
}

function getBallFaceTextureForPower(powered) {
  if (powered) return ballPowerFaceTexture || ballFaceTexture;
  return ballFaceTexture;
}

const _ballRollAxis = new THREE.Vector3();
const _ballRollDelta = new THREE.Quaternion();
const _ballTiltQuat = new THREE.Quaternion();
const _ballTiltEuler = new THREE.Euler();

function getPowerGodRayTexture() {
  if (powerGodRayTexture) return powerGodRayTexture;
  const w = 64;
  const h = 168;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const hGrad = ctx.createLinearGradient(0, 0, w, 0);
  hGrad.addColorStop(0, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.4, 'rgba(255,255,255,0)');
  hGrad.addColorStop(0.5, 'rgba(255,255,255,1)');
  hGrad.addColorStop(0.6, 'rgba(255,255,255,0)');
  hGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, w, h);
  const vGrad = ctx.createLinearGradient(0, 0, 0, h);
  vGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(0.1, 'rgba(255,255,255,1)');
  vGrad.addColorStop(0.9, 'rgba(255,255,255,1)');
  vGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  powerGodRayTexture = new THREE.CanvasTexture(canvas);
  powerGodRayTexture.colorSpace = THREE.SRGBColorSpace;
  return powerGodRayTexture;
}

let normalBlockSheenTexture = null;
let grayBlockSheenTexture = null;

/** Bold yellow base + diagonal highlight band for normal block faces. */
function getNormalBlockSheenTexture() {
  if (normalBlockSheenTexture) return normalBlockSheenTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#fff59d');
  baseGrad.addColorStop(0.28, '#ffee22');
  baseGrad.addColorStop(0.58, '#ffe600');
  baseGrad.addColorStop(0.82, '#f1d302');
  baseGrad.addColorStop(1, '#b89200');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const sheenGrad = ctx.createLinearGradient(size * 0.05, size * 0.02, size * 0.92, size * 0.62);
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(0.38, 'rgba(255,255,255,0.72)');
  sheenGrad.addColorStop(0.52, 'rgba(255,255,255,0.18)');
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, size, size);

  const rimGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.18, size * 0.5, size * 0.5, size * 0.72);
  rimGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  rimGrad.addColorStop(0.72, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(1, 'rgba(120,90,0,0.08)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, size, size);

  normalBlockSheenTexture = new THREE.CanvasTexture(canvas);
  normalBlockSheenTexture.colorSpace = THREE.SRGBColorSpace;
  normalBlockSheenTexture.wrapS = THREE.RepeatWrapping;
  normalBlockSheenTexture.wrapT = THREE.RepeatWrapping;
  return normalBlockSheenTexture;
}

/** Bold poster blue base + diagonal highlight for gray block faces. */
function getGrayBlockSheenTexture() {
  if (grayBlockSheenTexture) return grayBlockSheenTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#a8c8ff');
  baseGrad.addColorStop(0.28, '#6b92ff');
  baseGrad.addColorStop(0.58, '#4466ff');
  baseGrad.addColorStop(0.82, '#3355ee');
  baseGrad.addColorStop(1, '#2233cc');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const sheenGrad = ctx.createLinearGradient(size * 0.05, size * 0.02, size * 0.92, size * 0.62);
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(0.38, 'rgba(255,255,255,0.65)');
  sheenGrad.addColorStop(0.52, 'rgba(255,255,255,0.16)');
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, size, size);

  const rimGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.18, size * 0.5, size * 0.5, size * 0.72);
  rimGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
  rimGrad.addColorStop(0.72, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(1, 'rgba(16,32,120,0.12)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, size, size);

  grayBlockSheenTexture = new THREE.CanvasTexture(canvas);
  grayBlockSheenTexture.colorSpace = THREE.SRGBColorSpace;
  grayBlockSheenTexture.wrapS = THREE.RepeatWrapping;
  grayBlockSheenTexture.wrapT = THREE.RepeatWrapping;
  return grayBlockSheenTexture;
}

let scoreBlockSheenTexture = null;

/** Bold orange base + diagonal highlight for score block faces. */
function getScoreBlockSheenTexture() {
  if (scoreBlockSheenTexture) return scoreBlockSheenTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#ffcc66');
  baseGrad.addColorStop(0.28, '#ff9922');
  baseGrad.addColorStop(0.58, '#ff7700');
  baseGrad.addColorStop(0.82, '#ee6600');
  baseGrad.addColorStop(1, '#cc5500');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const sheenGrad = ctx.createLinearGradient(size * 0.05, size * 0.02, size * 0.92, size * 0.62);
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(0.38, 'rgba(255,255,255,0.68)');
  sheenGrad.addColorStop(0.52, 'rgba(255,255,255,0.16)');
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, size, size);

  const rimGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.18, size * 0.5, size * 0.5, size * 0.72);
  rimGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
  rimGrad.addColorStop(0.72, 'rgba(255,255,255,0)');
  rimGrad.addColorStop(1, 'rgba(120,40,0,0.1)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, size, size);

  scoreBlockSheenTexture = new THREE.CanvasTexture(canvas);
  scoreBlockSheenTexture.colorSpace = THREE.SRGBColorSpace;
  scoreBlockSheenTexture.wrapS = THREE.RepeatWrapping;
  scoreBlockSheenTexture.wrapT = THREE.RepeatWrapping;
  return scoreBlockSheenTexture;
}

function makeNormalBlockMaterial(tone = 1) {
  const spec = BLOCK_MATERIALS.normal;
  const tint = new THREE.Color(0xffffff);
  if (tone !== 1) tint.multiplyScalar(tone);

  return new THREE.MeshPhysicalMaterial({
    map: getNormalBlockSheenTexture(),
    color: tint,
    emissive: spec.emissive,
    emissiveIntensity: (spec.emissiveIntensity ?? 0.16) * Math.min(1.12, tone + 0.12),
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.78,
    clearcoatRoughness: 0.22,
    sheen: 1,
    sheenRoughness: 0.18,
    sheenColor: new THREE.Color(0xfff8a8),
  });
}

function makeGrayBlockMaterial(tone = 1) {
  const spec = BLOCK_MATERIALS.gray;
  const tint = new THREE.Color(0xffffff);
  if (tone !== 1) tint.multiplyScalar(tone);

  return new THREE.MeshPhysicalMaterial({
    map: getGrayBlockSheenTexture(),
    color: tint,
    emissive: spec.emissive,
    emissiveIntensity: (spec.emissiveIntensity ?? 0.3) * Math.min(1.12, tone + 0.12),
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.76,
    clearcoatRoughness: 0.24,
    sheen: 1,
    sheenRoughness: 0.2,
    sheenColor: new THREE.Color(0xc8dcff),
  });
}

function makeScoreBlockMaterial(tone = 1) {
  const spec = BLOCK_MATERIALS.score;
  const tint = new THREE.Color(0xffffff);
  if (tone !== 1) tint.multiplyScalar(tone);

  return new THREE.MeshPhysicalMaterial({
    map: getScoreBlockSheenTexture(),
    color: tint,
    emissive: spec.emissive,
    emissiveIntensity: (spec.emissiveIntensity ?? 0.34) * Math.min(1.12, tone + 0.12),
    roughness: 0.34,
    metalness: 0.04,
    clearcoat: 0.8,
    clearcoatRoughness: 0.22,
    sheen: 1,
    sheenRoughness: 0.18,
    sheenColor: new THREE.Color(0xffdd88),
  });
}

const BLOCK_MATERIALS = {
  normal: { color: 0xffe600, emissive: 0xffe014, emissiveIntensity: 0.28 },
  gray: { color: 0x4466ff, emissive: 0x3355ee, emissiveIntensity: 0.3 },
  power: { color: 0x235789, emissive: 0x235789, emissiveIntensity: 0.28 },
  spike: {
    color: 0x2e2438,
    emissive: 0x120a18,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
  },
  bonus: { color: 0xffee22, emissive: 0xddaa00, emissiveIntensity: 0.45, transparent: true, opacity: 0.96 },
  bonusCollectible: { color: 0xffee44, emissive: 0xddaa00, emissiveIntensity: 0.5, transparent: true, opacity: 0.88 },
  score: { color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.36 },
  hidden: { color: 0x7a5c48, emissive: 0x4a382c, emissiveIntensity: 0.12 },
};

const MESH_BLOCK_TYPES = new Set([
  'normal',
  'gray',
  'hidden',
  'hidden_2x2',
  'spike',
  'bonus',
  'score',
  'power',
  'normal_long_h',
  'normal_long_v',
  'gray_long_h',
  'gray_long_v',
  'power_long_h',
  'power_long_v',
]);

function isPowerBlockTypeId(typeId) {
  return typeId === 'power' || typeId === 'power_long_h' || typeId === 'power_long_v';
}

function blockMaterialKey(block) {
  if (block.getData('isBonusCollectible')) return 'bonusCollectible';
  const typeId = block.getData('typeId');
  if (typeId === 'spike') return 'spike';
  if (typeId === 'bonus') return 'bonus';
  if (typeId === 'score') return 'score';
  if (typeId === 'hidden' || typeId === 'hidden_2x2') return 'hidden';
  if (isPowerBlockTypeId(typeId)) return 'power';
  if (typeId === 'gray' || typeId.startsWith('gray_')) return 'gray';
  return 'normal';
}

function makePuffyBlockMaterial(key, tone = 1) {
  const spec = BLOCK_MATERIALS[key] || BLOCK_MATERIALS.normal;
  const whiteMix = key === 'normal' || key === 'power' ? 0.04 : 0.14;
  const color = new THREE.Color(spec.color).lerp(new THREE.Color(0xffffff), whiteMix);
  if (tone !== 1) color.multiplyScalar(tone);

  const transparent = Boolean(spec.transparent);
  const opacity = spec.opacity ?? 1;

  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: spec.emissive,
    emissiveIntensity: (spec.emissiveIntensity ?? 0.28) * Math.min(1, tone + 0.15),
    roughness: 0.78,
    metalness: 0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.82,
    sheen: 0.62,
    sheenRoughness: 0.58,
    sheenColor: new THREE.Color(0xffffff),
    transparent,
    opacity,
    depthWrite: !transparent || opacity > 0.02,
  });
}

/** Brighter top / front, darker sides for readable diorama depth. */
function makeDioramaBlockMaterials(key) {
  const frontIdx = dioramaFrontFaceIndex();
  if (key === 'normal') {
    const side = makeNormalBlockMaterial(1);
    const top = makeNormalBlockMaterial(1.04);
    const front = makeNormalBlockMaterial(1.02);
    return Array.from({ length: 6 }, (_, i) => {
      if (i === frontIdx) return front;
      if (i === BOX_FACE.POS_Y) return top;
      return side.clone();
    });
  }

  if (key === 'gray') {
    const side = makeGrayBlockMaterial(1);
    const top = makeGrayBlockMaterial(1.04);
    const front = makeGrayBlockMaterial(1.02);
    return Array.from({ length: 6 }, (_, i) => {
      if (i === frontIdx) return front;
      if (i === BOX_FACE.POS_Y) return top;
      return side.clone();
    });
  }

  if (key === 'score') {
    const side = makeScoreBlockMaterial(1);
    const top = makeScoreBlockMaterial(1.04);
    const front = makeScoreBlockMaterial(1.02);
    return Array.from({ length: 6 }, (_, i) => {
      if (i === frontIdx) return front;
      if (i === BOX_FACE.POS_Y) return top;
      return side.clone();
    });
  }

  const side = makePuffyBlockMaterial(key, 0.98);
  const top = makePuffyBlockMaterial(key, 1.04);
  const front = makePuffyBlockMaterial(key, 1);
  return Array.from({ length: 6 }, (_, i) => {
    if (i === frontIdx) return front;
    if (i === BOX_FACE.POS_Y) return top;
    return side.clone();
  });
}

function disposeBlockMaterials(material) {
  if (Array.isArray(material)) material.forEach((m) => m.dispose());
  else material?.dispose();
}

function blockPuffyDimensions(w, h) {
  const base = Math.min(w, h);
  const pw = w * DIORAMA.blockPuffScale;
  const ph = h * DIORAMA.blockPuffScale;
  const depth = base * DIORAMA.blockDepthFrac;
  const radius = Math.min(pw, ph, depth) * DIORAMA.blockCornerRadiusFrac;
  return { pw, ph, depth, radius };
}

function createCuteSpikeShape(pw, ph) {
  const layout =
    typeof globalThis.cuteSpikeLayout === 'function'
      ? globalThis.cuteSpikeLayout(0, pw, ph)
      : {
        cx: pw * 0.5,
        tipY: ph * 0.1,
        baseY: ph * 0.9,
        halfW: pw * 0.38,
      };
  const sample =
    typeof globalThis.sampleCuteSpikePoints === 'function'
      ? globalThis.sampleCuteSpikePoints
      : null;
  const pts = sample
    ? sample(layout.cx, layout.tipY, layout.baseY, layout.halfW)
    : [];
  const ox = pw * 0.5;
  const oy = ph * 0.5;
  const shape = new THREE.Shape();
  if (pts.length < 3) return shape;
  pts.forEach((p, i) => {
    const x = p.x - ox;
    const y = -(p.y - oy);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

let spikeGradientTexture = null;

function getSpikeGradientTexture() {
  if (spikeGradientTexture) return spikeGradientTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const pad = 10;
  const innerW = size - pad * 2;
  const innerH = size - pad * 2;

  if (typeof globalThis.fillCuteSpikeGradientCanvas === 'function') {
    globalThis.fillCuteSpikeGradientCanvas(ctx, pad, innerW, innerH);
  } else {
    ctx.fillStyle = '#1a1520';
    ctx.fillRect(0, 0, size, size);
  }

  spikeGradientTexture = new THREE.CanvasTexture(canvas);
  spikeGradientTexture.colorSpace = THREE.SRGBColorSpace;
  return spikeGradientTexture;
}

function addCuteSpikeFace(group, pw, ph, depth) {
  const zFront = dioramaFrontZ(depth);
  const tex = getSpikeGradientTexture();

  const spike = new THREE.Mesh(
    new THREE.PlaneGeometry(pw, ph),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  spike.position.set(0, 0, zFront);
  spike.userData.blockDetail = true;
  group.add(spike);
}

function createRoundedRectShape(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

function createRoundedRectFrameShape(outerW, outerH, thickness, radius) {
  const outer = createRoundedRectShape(outerW, outerH, radius);
  const innerW = outerW - thickness * 2;
  const innerH = outerH - thickness * 2;
  if (innerW > 0 && innerH > 0) {
    const innerR = Math.max(2, radius - thickness * 0.5);
    const innerPts = createRoundedRectShape(innerW, innerH, innerR).getPoints(12);
    innerPts.reverse();
    outer.holes.push(new THREE.Path(innerPts));
  }
  return outer;
}

function createCuteStarShape(outerR, innerRatio = 0.66, roundness = 0.42) {
  const innerR = outerR * innerRatio;
  const startAngle = -Math.PI / 2;
  const corners = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = startAngle + (i * Math.PI) / 5;
    corners.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }

  const shape = new THREE.Shape();
  const n = corners.length;
  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const curr = corners[i];
    const next = corners[(i + 1) % n];
    const sx = prev.x + (curr.x - prev.x) * (1 - roundness);
    const sy = prev.y + (curr.y - prev.y) * (1 - roundness);
    const ex = curr.x + (next.x - curr.x) * roundness;
    const ey = curr.y + (next.y - curr.y) * roundness;
    if (i === 0) shape.moveTo(sx, sy);
    shape.quadraticCurveTo(curr.x, curr.y, ex, ey);
  }
  return shape;
}

function createStarOutlineShape(outerR, innerRatio = 0.66, roundness = 0.42, thickness = 0.28) {
  const outer = createCuteStarShape(outerR, innerRatio, roundness);
  const innerR = outerR * (1 - thickness);
  const innerPts = createCuteStarShape(innerR, innerRatio, roundness).getPoints(24);
  innerPts.reverse();
  outer.holes.push(new THREE.Path(innerPts));
  return outer;
}

/** Fill + outline star mesh pair (score block, liberation, bonus chance). */
function createFaceStarGroup(outerR, {
  fillColor = 0xffee44,
  outlineColor = 0x331100,
  detailTag = 'starDetail',
  renderOrder = 0,
  depthTest = true,
  depthWrite = false,
} = {}) {
  const starGroup = new THREE.Group();

  const fill = new THREE.Mesh(
    new THREE.ShapeGeometry(createCuteStarShape(outerR)),
    new THREE.MeshBasicMaterial({
      color: fillColor,
      transparent: false,
      opacity: 1,
      depthTest,
      depthWrite,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  fill.userData[detailTag] = true;
  fill.renderOrder = renderOrder;

  const outline = new THREE.Mesh(
    new THREE.ShapeGeometry(createStarOutlineShape(outerR, 0.66, 0.42, 0.2)),
    new THREE.MeshBasicMaterial({
      color: outlineColor,
      transparent: false,
      opacity: 1,
      depthTest,
      depthWrite,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  outline.position.z = 0.02;
  outline.userData[detailTag] = true;
  outline.renderOrder = renderOrder;

  starGroup.add(fill, outline);
  starGroup.renderOrder = renderOrder;
  return starGroup;
}

/** Face the camera and draw both sides — same setup as liberation detach. */
function prepareStarCameraBillboard(starGroup, camera) {
  camera.getWorldPosition(_libStarScratch.camW);
  starGroup.lookAt(_libStarScratch.camW);
  starGroup.traverse((child) => {
    if (!child.material) return;
    child.material.side = THREE.DoubleSide;
  });
}

function addNormalBlockStarFace(group, pw, ph, depth) {
  const outerR = Math.min(pw, ph) * 0.26;
  const zFront = dioramaFrontZ(depth);

  const outline = new THREE.Mesh(
    new THREE.ShapeGeometry(createStarOutlineShape(outerR)),
    new THREE.MeshBasicMaterial({
      color: 0x220044,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  outline.position.set(0, 0, zFront);
  outline.userData.blockDetail = true;
  group.userData.starMesh = outline;
  group.add(outline);
}

function isGrayBlockTypeId(typeId) {
  return typeId === 'gray' || typeId === 'gray_long_h' || typeId === 'gray_long_v';
}

function addGrayBlockStarFace(group, pw, ph, depth) {
  const outerR = Math.min(pw, ph) * 0.26;
  const zFront = dioramaFrontZ(depth);
  const starGroup = new THREE.Group();
  starGroup.position.set(0, 0, zFront);

  const fill = new THREE.Mesh(
    new THREE.ShapeGeometry(createCuteStarShape(outerR)),
    new THREE.MeshBasicMaterial({
      color: 0xa8c0ff,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  fill.userData.blockDetail = true;

  const outline = new THREE.Mesh(
    new THREE.ShapeGeometry(createStarOutlineShape(outerR, 0.66, 0.42, 0.18)),
    new THREE.MeshBasicMaterial({
      color: 0x4466ff,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  outline.position.z = 0.02;
  outline.userData.blockDetail = true;

  starGroup.add(fill, outline);
  group.userData.grayStarGroup = starGroup;
  group.add(starGroup);
}

function removeGrayBlockStarFace(group) {
  const starGroup = group.userData.grayStarGroup;
  if (!starGroup) return;
  group.remove(starGroup);
  disposeMeshTree(starGroup);
  group.userData.grayStarGroup = null;
}

function ensureGrayBlockStarFace(group, block) {
  if (!isGrayBlockTypeId(block.getData('typeId')) || group.userData.grayStarGroup) return;
  const w = block.displayWidth;
  const h = block.displayHeight;
  const { pw, ph, depth } = blockPuffyDimensions(w, h);
  addGrayBlockStarFace(group, pw, ph, depth);
}

function isNormalBlockTypeId(typeId) {
  return typeId === 'normal' || typeId === 'normal_long_h' || typeId === 'normal_long_v';
}

function resolveNormalStarTickerAngle(timeMs, phase = 0) {
  if (typeof globalThis.normalStarTickerAngle === 'function') {
    const tickMs = globalThis.NORMAL_STAR_TICK_MS ?? 650;
    return globalThis.normalStarTickerAngle(timeMs, tickMs, phase);
  }
  const tickMs = 650;
  const steps = 8;
  const step = Math.floor(timeMs / tickMs);
  return (step % steps) * ((Math.PI * 2) / steps) + phase;
}

function ensureNormalBlockStarFace(group, block) {
  if (!isNormalBlockTypeId(block.getData('typeId')) || group.userData.starMesh) return;
  const w = block.displayWidth;
  const h = block.displayHeight;
  const { pw, ph, depth } = blockPuffyDimensions(w, h);
  addNormalBlockStarFace(group, pw, ph, depth);
}

function syncNormalBlockStarRotation(block, entry, scene) {
  const star = entry.group.userData.starMesh;
  if (!star || !scene?.time) return;
  const phase = block.getData('starPhase') || 0;
  star.rotation.z = resolveNormalStarTickerAngle(scene.time.now, phase);
}

function isScoreBlockTypeId(typeId) {
  return typeId === 'score';
}

function addScoreBlockStar(group, pw, ph, depth) {
  const outerR = Math.min(pw, ph) * SCORE_BLOCK_FX.starScale;
  const zFront = dioramaFrontZ(depth) + 0.04;

  const starGroup = createFaceStarGroup(outerR, { detailTag: 'blockDetail' });
  starGroup.position.set(0, 0, zFront);
  group.userData.scoreStarGroup = starGroup;
  group.userData.scoreStarOffset = { x: 0, y: 0 };
  group.userData.scoreStarTarget = { x: 0, y: 0 };
  group.add(starGroup);
}

function prepareScoreBlockHitFx(block, entry) {
  const w = block.displayWidth;
  const h = block.displayHeight;
  const margin = Math.min(w, h) * SCORE_BLOCK_FX.hitMoveMarginFrac;
  const current = entry.group.userData.scoreStarOffset || { x: 0, y: 0 };

  block.setData('scoreHitFromOffset', { x: current.x, y: current.y });
  entry.group.userData.scoreStarTarget = {
    x: (Math.random() - 0.5) * margin * 2,
    y: (Math.random() - 0.5) * margin * 2,
  };
}

function syncScoreBlockFx(block, entry, scene) {
  if (!isScoreBlockTypeId(block.getData('typeId')) || !scene?.time) return;

  const starGroup = entry.group.userData.scoreStarGroup;
  if (!starGroup) return;

  const t = scene.time.now;
  const phase = block.getData('starPhase') || 0;
  const z = starGroup.position.z;
  const hitStart = block.getData('scoreHitFxStart');
  const { hitSpinMs, hitMoveMs, hitSpinTurns, idleSpinRadPerMs } = SCORE_BLOCK_FX;

  if (hitStart != null) {
    const elapsed = t - hitStart;

    if (elapsed >= hitSpinMs + hitMoveMs) {
      const target = entry.group.userData.scoreStarTarget || { x: 0, y: 0 };
      entry.group.userData.scoreStarOffset = { x: target.x, y: target.y };
      block.setData('scoreHitFxStart', null);
      starGroup.position.set(target.x, target.y, z);
      starGroup.rotation.z = t * idleSpinRadPerMs + phase;
      return;
    }

    const from = block.getData('scoreHitFromOffset') || entry.group.userData.scoreStarOffset || { x: 0, y: 0 };
    const to = entry.group.userData.scoreStarTarget || from;

    if (elapsed < hitSpinMs) {
      const spinT = elapsed / hitSpinMs;
      const eased = 1 - (1 - spinT) * (1 - spinT);
      starGroup.rotation.z = phase + eased * Math.PI * 2 * hitSpinTurns;
      starGroup.position.set(from.x, from.y, z);
      return;
    }

    const moveT = (elapsed - hitSpinMs) / hitMoveMs;
    const eased = 1 - Math.pow(1 - moveT, 3);
    starGroup.position.set(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased, z);
    starGroup.rotation.z = phase + Math.PI * 2 * hitSpinTurns + moveT * Math.PI * 2 * 0.4;
    return;
  }

  const off = entry.group.userData.scoreStarOffset || { x: 0, y: 0 };
  starGroup.position.set(off.x, off.y, z);
  starGroup.rotation.z = t * idleSpinRadPerMs + phase;
}

function setLiberatedStarOpacity(starGroup, opacity) {
  starGroup.traverse((child) => {
    if (!child.material) return;
    child.material.transparent = true;
    child.material.opacity = opacity;
  });
}

function syncLiberatedScoreStars(scene, liberations, root, camera) {
  if (!scene?.time || !liberations.length || !camera) return;

  const t = scene.time.now;
  const {
    spinMs,
    spinTurns,
    towardMs,
    towardDist,
    towardScaleMul,
    towardSpinTurns,
    liftMs,
    liftPx,
    liftSpinTurns,
    awayMs,
    awayDist,
    awayYPx,
    awayScaleMul,
    awaySpinTurns,
  } = SCORE_STAR_LIBERATION;

  const total = spinMs + towardMs + liftMs + awayMs;
  const axis = _libStarScratch.axis;

  for (let i = liberations.length - 1; i >= 0; i--) {
    const lib = liberations[i];
    const { starGroup, onComplete, baseRotZ, baseScale } = lib;
    const elapsed = t - lib.start;

    if (!starGroup.parent) {
      liberations.splice(i, 1);
      onComplete?.();
      continue;
    }

    if (elapsed >= total) {
      root.remove(starGroup);
      disposeMeshTree(starGroup);
      liberations.splice(i, 1);
      onComplete?.();
      continue;
    }

    axis.set(lib.towardAxis.x, lib.towardAxis.y, lib.towardAxis.z);

    const spinEnd = Math.PI * 2 * spinTurns;
    const towardEnd = spinEnd + Math.PI * 2 * towardSpinTurns;
    const liftEnd = towardEnd + Math.PI * 2 * liftSpinTurns;

    const bx = lib.baseX;
    const by = lib.baseY;
    const bz = lib.baseZ;
    const ax = axis.x;
    const ay = axis.y;
    const az = axis.z;

    if (elapsed < spinMs) {
      const st = elapsed / spinMs;
      const eased = 1 - (1 - st) * (1 - st);
      applyLiberatedStarSpinZ(starGroup, baseRotZ, eased * spinEnd);
      const pulse = 1 + 0.1 * Math.sin(st * Math.PI * 5);
      setLiberatedStarScale(starGroup, baseScale, pulse);
      starGroup.position.set(bx, by, bz);
      setLiberatedStarOpacity(starGroup, 1);
    } else if (elapsed < spinMs + towardMs) {
      const tt = (elapsed - spinMs) / towardMs;
      const eased = 1 - Math.pow(1 - tt, 3);
      applyLiberatedStarSpinZ(starGroup, baseRotZ, spinEnd + tt * Math.PI * 2 * towardSpinTurns);
      setLiberatedStarScale(starGroup, baseScale, 1 + (towardScaleMul - 1) * eased);
      starGroup.position.set(
        bx + ax * towardDist * eased,
        by + ay * towardDist * eased,
        bz + az * towardDist * eased
      );
      setLiberatedStarOpacity(starGroup, 1);
    } else if (elapsed < spinMs + towardMs + liftMs) {
      const lt = (elapsed - spinMs - towardMs) / liftMs;
      const eased = 1 - Math.pow(1 - lt, 3);
      applyLiberatedStarSpinZ(starGroup, baseRotZ, towardEnd + lt * Math.PI * 2 * liftSpinTurns);
      setLiberatedStarScale(starGroup, baseScale, towardScaleMul * (1 + 0.06 * Math.sin(lt * Math.PI * 3)));
      starGroup.position.set(
        bx + ax * towardDist,
        by + ay * towardDist + liftPx * eased,
        bz + az * towardDist
      );
      setLiberatedStarOpacity(starGroup, 1);
    } else {
      const at = (elapsed - spinMs - towardMs - liftMs) / awayMs;
      const eased = 1 - Math.pow(1 - at, 2);
      const tx = bx + ax * towardDist;
      const ty = by + ay * towardDist + liftPx;
      const tz = bz + az * towardDist;
      applyLiberatedStarSpinZ(starGroup, baseRotZ, liftEnd + at * Math.PI * 2 * awaySpinTurns);
      setLiberatedStarScale(
        starGroup,
        baseScale,
        towardScaleMul + (awayScaleMul - towardScaleMul) * eased
      );
      starGroup.position.set(
        tx - ax * awayDist * eased,
        ty + awayYPx * eased - ay * awayDist * eased,
        tz - az * awayDist * eased
      );
      const fade = at < 0.3 ? 1 : 1 - (at - 0.3) / 0.7;
      setLiberatedStarOpacity(starGroup, fade);
    }
  }
}

function createScoreBlockMesh(block) {
  const w = block.displayWidth;
  const h = block.displayHeight;
  const { pw, ph, depth, radius } = blockPuffyDimensions(w, h);
  const group = new THREE.Group();
  const geo = new RoundedBoxGeometry(pw, ph, depth, DIORAMA.roundedBoxSegments, radius);
  const box = new THREE.Mesh(geo, makeDioramaBlockMaterials('score'));
  box.scale.set(
    DIORAMA.blockBulgeScaleX,
    DIORAMA.blockBulgeScaleY,
    DIORAMA.blockBulgeScaleZ
  );
  group.add(box);
  addScoreBlockStar(group, pw, ph, depth);

  group.userData.matKey = 'score';
  group.userData.boxMesh = box;
  group.userData.blockDepth = depth;
  return group;
}

function addPowerBlockFaceDetails(group, pw, ph, depth) {
  const zFront = dioramaFrontZ(depth);
  const base = Math.min(pw, ph);
  const margin = base * 0.13;
  const outerW = pw - margin * 2;
  const outerH = ph - margin * 2;
  const cornerR = base * 0.1;
  const trimThickness = Math.max(1.8, base * 0.07);

  const markDetail = (mesh) => {
    mesh.userData.blockDetail = true;
  };

  const trim = new THREE.Mesh(
    new THREE.ShapeGeometry(createRoundedRectFrameShape(outerW, outerH, trimThickness, cornerR)),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a425f,
      emissive: 0x1a425f,
      emissiveIntensity: 0.35,
      roughness: 0.52,
      metalness: 0,
      transparent: true,
      opacity: 0.92,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  trim.position.set(0, 0, zFront);
  markDetail(trim);
  group.add(trim);

  const glowH = Math.max(3, ph * 0.18);
  const glowW = outerW - trimThickness * 4;
  const glow = new THREE.Mesh(
    new THREE.ShapeGeometry(createRoundedRectShape(glowW, glowH, cornerR * 0.6)),
    new THREE.MeshBasicMaterial({
      color: 0x8fb4d4,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  glow.position.set(0, ph * 0.5 - margin - glowH * 0.5 - trimThickness, zFront + 0.08);
  markDetail(glow);
  group.add(glow);
}

function disposePowerFxGroup(entry) {
  if (!entry?.powerFxGroup) return;
  entry.group.remove(entry.powerFxGroup);
  disposeMeshTree(entry.powerFxGroup);
  entry.powerFxGroup = null;
}

function createPowerGodRayGroup(bw, bh, depth) {
  const span = Math.hypot(bw, bh);
  const rayH = span * POWER_BLOCK_FX.godRayLengthScale;
  const tex = getPowerGodRayTexture();
  const zFront = dioramaFrontZ(depth);

  const root = new THREE.Group();
  root.rotation.z = THREE.MathUtils.degToRad(POWER_BLOCK_FX.godRayAngleDeg);
  root.position.z = zFront;

  const mover = new THREE.Group();
  root.add(mover);
  root.userData.mover = mover;

  const makeRay = (width, height, opacity) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );

  const halo = makeRay(span * POWER_BLOCK_FX.godRayHaloScale, rayH, POWER_BLOCK_FX.godRayHaloAlpha);
  const core = makeRay(
    span * POWER_BLOCK_FX.godRayCoreScale,
    rayH * 0.92,
    POWER_BLOCK_FX.godRayCoreAlpha
  );
  halo.userData.blockDetail = true;
  core.userData.blockDetail = true;
  mover.add(halo, core);

  return root;
}

function easeElasticOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function syncHiddenBlockRevealFx(block, entry, scene, getEntry) {
  const fx = block.getData('hiddenRevealFlipFx') || entry?.hiddenRevealFx;
  if (!fx || !scene?.time) return false;

  let meshEntry = entry;
  if (!meshEntry?.group) return false;

  let mesh = meshEntry.group;
  let baseSx = fx.baseScaleX ?? (Math.abs(mesh.scale.x) || 1);
  let sign = mesh.scale.x < 0 ? -1 : 1;
  const t = Math.min(1, (scene.time.now - fx.start) / HIDDEN_BLOCK_REVEAL_FX.flipMs);

  if (t < 0.5) {
    const st = t / 0.5;
    mesh.scale.x = sign * baseSx * Math.max(0.05, 1 - st);
  } else {
    if (!fx.midCalled) {
      fx.midCalled = true;
      fx.onMidpoint?.();
      meshEntry = (typeof getEntry === 'function' && getEntry()) || meshEntry;
      mesh = meshEntry.group;
      baseSx = fx.baseScaleX ?? (Math.abs(mesh.scale.x) || 1);
      sign = mesh.scale.x < 0 ? -1 : 1;
      fx.baseScaleX = baseSx;
    }
    const st = (t - 0.5) / 0.5;
    mesh.scale.x = sign * baseSx * Math.max(0.05, st);
  }

  meshEntry.group.visible = block.active;

  if (t >= 1) {
    mesh.scale.x = sign * baseSx;
    const done = fx.onComplete;
    block.setData('hiddenRevealFlipFx', null);
    if (meshEntry.hiddenRevealFx) meshEntry.hiddenRevealFx = null;
    done?.();
  }
  return true;
}

function syncGrayDowngradeFx(block, entry, scene) {
  const fxStart = block.getData('grayDowngradeFxStart');
  if (!fxStart || !scene?.time) return;

  const elapsed = scene.time.now - fxStart;
  const { squashScaleX, squashScaleY, squashMs, settleMs } = GRAY_DOWNGRADE_FX;
  const total = squashMs + settleMs;

  if (elapsed >= total) {
    entry.group.scale.set(1, 1, 1);
    block.setData('grayDowngradeFxStart', null);
    return;
  }

  if (elapsed < squashMs) {
    const t = elapsed / squashMs;
    const eased = 1 - (1 - t) * (1 - t);
    entry.group.scale.set(
      1 + (squashScaleX - 1) * eased,
      1 + (squashScaleY - 1) * eased,
      1
    );
    return;
  }

  const t = (elapsed - squashMs) / settleMs;
  const e = easeElasticOut(t);
  entry.group.scale.set(
    squashScaleX + (1 - squashScaleX) * e,
    squashScaleY + (1 - squashScaleY) * e,
    1
  );
}

function syncPowerBlockFx(block, entry, scene) {
  if (!isPowerBlockTypeId(block.getData('typeId'))) {
    disposePowerFxGroup(entry);
    if (!block.getData('grayDowngradeFxStart')) {
      entry.group.scale.set(1, 1, 1);
    }
    return;
  }

  const fxStart = block.getData('powerResistFxStart');
  if (!fxStart || !scene?.time) {
    entry.group.scale.set(1, 1, 1);
    disposePowerFxGroup(entry);
    return;
  }

  const elapsed = scene.time.now - fxStart;
  const squashTotal = POWER_BLOCK_FX.squashInMs * 2;

  if (elapsed < squashTotal) {
    const half = POWER_BLOCK_FX.squashInMs;
    const t = elapsed < half ? elapsed / half : (squashTotal - elapsed) / half;
    const eased = 1 - (1 - t) * (1 - t);
    entry.group.scale.set(
      1 + (POWER_BLOCK_FX.squashScaleX - 1) * eased,
      1 + (POWER_BLOCK_FX.squashScaleY - 1) * eased,
      1
    );
  } else {
    entry.group.scale.set(1, 1, 1);
  }

  if (elapsed > POWER_BLOCK_FX.godRaySweepMs + 16) {
    block.setData('powerResistFxStart', null);
    entry.group.scale.set(1, 1, 1);
    disposePowerFxGroup(entry);
    return;
  }

  const bw = block.displayWidth;
  const bh = block.displayHeight;
  const { depth } = blockPuffyDimensions(bw, bh);
  const span = Math.hypot(bw, bh);
  const travel = span * POWER_BLOCK_FX.godRayTravelScale;
  const t = Math.min(1, elapsed / POWER_BLOCK_FX.godRaySweepMs);
  const eased = -(Math.cos(Math.PI * t) - 1) / 2;

  if (!entry.powerFxGroup) {
    entry.powerFxGroup = createPowerGodRayGroup(bw, bh, depth);
    entry.group.add(entry.powerFxGroup);
  }

  entry.powerFxGroup.userData.mover.position.x = -travel + eased * travel * 2;
}

function createBlockMesh(block) {
  if (block.getData('typeId') === 'score') {
    return createScoreBlockMesh(block);
  }

  const w = block.displayWidth;
  const h = block.displayHeight;
  const { pw, ph, depth, radius } = blockPuffyDimensions(w, h);
  const group = new THREE.Group();
  const matKey = blockMaterialKey(block);
  const geo = new RoundedBoxGeometry(pw, ph, depth, DIORAMA.roundedBoxSegments, radius);
  const box = new THREE.Mesh(geo, makeDioramaBlockMaterials(matKey));
  box.scale.set(
    DIORAMA.blockBulgeScaleX,
    DIORAMA.blockBulgeScaleY,
    DIORAMA.blockBulgeScaleZ
  );
  group.add(box);

  const typeId = block.getData('typeId');
  if (typeId === 'normal' || typeId === 'normal_long_h' || typeId === 'normal_long_v') {
    addNormalBlockStarFace(group, pw, ph, depth);
  }
  if (isGrayBlockTypeId(typeId)) {
    addGrayBlockStarFace(group, pw, ph, depth);
  }

  if (isPowerBlockTypeId(typeId)) {
    addPowerBlockFaceDetails(group, pw, ph, depth);
  }

  if (block.getData('typeId') === 'spike' || block.getData('isHazard')) {
    addCuteSpikeFace(group, pw, ph, depth);
  }

  group.userData.matKey = matKey;
  group.userData.boxMesh = box;
  group.userData.blockDepth = depth;
  return group;
}

/** Matches COLORS.paddle / COLORS.paddleDark in block-ball-demo.html */
const PADDLE_COLORS = {
  main: 0x00ffcc,
  shadow: 0x00ccaa,
  chargeTint: 0xccffff,
};

/** End-cap ticker stars — rapid smooth spin after a power bounce hit. */
const PADDLE_STAR_POWER_SPIN = {
  durationMs: 760,
  revolutions: 4.25,
};

/** Brief pop on power bounce — not tied to full power-ball duration. */
const PADDLE_STAR_SCALE_BURST = {
  durationMs: 380,
  peak: 1.55,
};

const PADDLE_STAR_SCALE = {
  /** Per-frame lerp toward target scale. */
  lerp: 0.28,
  /** Extra outward push when enlarged (keeps overflow past paddle caps). */
  xOverflowMul: 0.2,
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function createPaddleTickerStar(outerR, phase = 0) {
  const starGroup = new THREE.Group();
  const fill = new THREE.Mesh(
    new THREE.ShapeGeometry(createCuteStarShape(outerR)),
    new THREE.MeshBasicMaterial({
      color: 0xffff88,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  fill.userData.paddleDetail = true;

  const outline = new THREE.Mesh(
    new THREE.ShapeGeometry(createStarOutlineShape(outerR, 0.66, 0.42, 0.2)),
    new THREE.MeshBasicMaterial({
      color: 0x220044,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    })
  );
  outline.position.z = 0.02;
  outline.userData.paddleDetail = true;

  starGroup.add(fill, outline);
  starGroup.userData.phase = phase;
  starGroup.renderOrder = 7;
  return starGroup;
}

function addPaddleEndStars(group, pw, ph, depth) {
  const outerR = Math.min(pw * 0.28, ph * 0.58);
  const zFront = dioramaFrontZ(depth) + 0.06;
  /** Center slightly past the cap — partial overflow past the paddle ends. */
  const xEnd = pw * 0.5 + outerR * 0.08;

  const left = createPaddleTickerStar(outerR, 0);
  left.position.set(-xEnd, 0, zFront);
  left.userData.baseX = xEnd;
  left.userData.xSign = -1;
  group.add(left);

  const right = createPaddleTickerStar(outerR, Math.PI / 4);
  right.position.set(xEnd, 0, zFront);
  right.userData.baseX = xEnd;
  right.userData.xSign = 1;
  group.add(right);

  group.userData.endStars = [left, right];
}

function resolvePaddleStarScale(star, timeMs) {
  const fx = star.userData.scaleBurstFx;
  if (!fx) return 1;
  const elapsed = timeMs - fx.start;
  if (elapsed >= fx.durationMs) {
    star.userData.scaleBurstFx = null;
    return 1;
  }
  const t = elapsed / fx.durationMs;
  const peak = fx.peak ?? PADDLE_STAR_SCALE_BURST.peak;
  return 1 + (peak - 1) * Math.sin(t * Math.PI);
}

function syncPaddleEndStarVisuals(star, timeMs) {
  star.rotation.z = resolvePaddleStarRotationZ(star, timeMs);

  const target = resolvePaddleStarScale(star, timeMs);
  const cur = star.scale.x;
  const next = cur + (target - cur) * PADDLE_STAR_SCALE.lerp;
  star.scale.set(next, next, 1);

  const baseX = star.userData.baseX;
  if (baseX != null) {
    const sign = star.userData.xSign ?? 1;
    const outward = 1 + (next - 1) * PADDLE_STAR_SCALE.xOverflowMul;
    star.position.x = sign * baseX * outward;
  }
}

function resolvePaddleStarRotationZ(star, timeMs) {
  const fx = star.userData.powerSpinFx;
  if (fx) {
    const elapsed = timeMs - fx.start;
    if (elapsed < fx.durationMs) {
      const t = elapsed / fx.durationMs;
      return fx.fromAngle + easeInOutCubic(t) * fx.revolutions * Math.PI * 2;
    }
    star.userData.powerSpinFx = null;
  }
  return resolveNormalStarTickerAngle(timeMs, star.userData.phase ?? 0);
}

function triggerPaddleEndStarPowerSpin(stars, timeMs) {
  if (!stars?.length) return;
  for (const star of stars) {
    const fromAngle = resolvePaddleStarRotationZ(star, timeMs);
    star.userData.powerSpinFx = {
      start: timeMs,
      fromAngle,
      durationMs: PADDLE_STAR_POWER_SPIN.durationMs,
      revolutions: PADDLE_STAR_POWER_SPIN.revolutions,
    };
    star.userData.scaleBurstFx = {
      start: timeMs,
      durationMs: PADDLE_STAR_SCALE_BURST.durationMs,
      peak: PADDLE_STAR_SCALE_BURST.peak,
    };
  }
}

function makePaddleMaterial(colorHex) {
  const color = new THREE.Color(colorHex);
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.24,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.38,
    clearcoatRoughness: 0.48,
  });
}

function createPaddleMesh(width, height) {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const base = Math.min(w, h);
  const pw = w * 1.02;
  const ph = h * 1.02;
  const depth = base * 0.36;
  const radius = Math.min(pw, ph, depth) * DIORAMA.blockCornerRadiusFrac;
  const group = new THREE.Group();
  const shadowGeo = new RoundedBoxGeometry(pw, ph, depth, DIORAMA.roundedBoxSegments, radius);
  const shadow = new THREE.Mesh(shadowGeo, makePaddleMaterial(PADDLE_COLORS.shadow));
  shadow.position.set(0, -2, -depth * 0.2);
  group.add(shadow);

  const mainGeo = new RoundedBoxGeometry(pw, ph, depth, DIORAMA.roundedBoxSegments, radius);
  const main = new THREE.Mesh(mainGeo, makePaddleMaterial(PADDLE_COLORS.main));
  group.add(main);

  addPaddleEndStars(group, pw, ph, depth);

  group.userData.baseW = w;
  group.userData.baseH = h;
  group.userData.mainMesh = main;
  group.userData.shadowMesh = shadow;
  group.renderOrder = 6;
  return group;
}

/** Stepped rainbow hue cycle — bonus chance item + converted bonus blocks. */
const BONUS_RAINBOW_STROBE = {
  periodMs: 5600,
  steps: 7,
  saturation: 0.88,
  lightness: 0.54,
};

/** Bonus Chance pickup — marble sphere, rainbow strobe, tilted-orbit satellites. */
const BONUS_CHANCE_ITEM_FX = {
  orbitSpeedRadPerMs: 0.00165,
  marbleSpinRadPerMs: 0.00085,
  orbitTiltX: Math.PI / 5,
  starOuterFrac: 0.42,
  /** Local +Z offset — star sits on the marble surface, not at the center. */
  starSurfaceFrac: 1.02,
  satelliteRadiusFrac: 0.24,
  orbitRadiusFrac: 1.48,
};

const _bonusRainbowColor = new THREE.Color();

let bonusChanceMarbleTexture = null;

function getBonusChanceMarbleTexture() {
  if (bonusChanceMarbleTexture) return bonusChanceMarbleTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const baseGrad = ctx.createRadialGradient(size * 0.42, size * 0.38, size * 0.04, size * 0.5, size * 0.52, size * 0.58);
  baseGrad.addColorStop(0, '#7dffc0');
  baseGrad.addColorStop(0.28, '#3ef5a0');
  baseGrad.addColorStop(0.52, '#22ee88');
  baseGrad.addColorStop(0.78, '#0fb868');
  baseGrad.addColorStop(1, '#067a42');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  const veins = [
    { c: 'rgba(255,255,255,0.55)', w: 14, pts: [[18, 210], [72, 168], [118, 92], [196, 48]] },
    { c: 'rgba(210,255,235,0.42)', w: 10, pts: [[240, 188], [176, 142], [132, 78], [58, 34]] },
    { c: 'rgba(255,255,255,0.32)', w: 8, pts: [[34, 118], [98, 132], [154, 176], [228, 154]] },
    { c: 'rgba(180,255,220,0.36)', w: 12, pts: [[128, 12], [108, 88], [142, 156], [188, 228]] },
    { c: 'rgba(255,255,255,0.28)', w: 6, pts: [[8, 64], [64, 98], [112, 62], [168, 88]] },
  ];
  ctx.lineCap = 'round';
  for (const vein of veins) {
    ctx.strokeStyle = vein.c;
    ctx.lineWidth = vein.w;
    ctx.beginPath();
    ctx.moveTo(vein.pts[0][0], vein.pts[0][1]);
    ctx.bezierCurveTo(
      vein.pts[1][0], vein.pts[1][1],
      vein.pts[2][0], vein.pts[2][1],
      vein.pts[3][0], vein.pts[3][1]
    );
    ctx.stroke();
  }

  const depthGrad = ctx.createRadialGradient(size * 0.52, size * 0.48, size * 0.08, size * 0.5, size * 0.5, size * 0.62);
  depthGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
  depthGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
  depthGrad.addColorStop(1, 'rgba(0,48,24,0.28)');
  ctx.fillStyle = depthGrad;
  ctx.fillRect(0, 0, size, size);

  const specGrad = ctx.createLinearGradient(size * 0.08, size * 0.04, size * 0.72, size * 0.58);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.55)');
  specGrad.addColorStop(0.35, 'rgba(255,255,255,0.12)');
  specGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = specGrad;
  ctx.fillRect(0, 0, size, size);

  bonusChanceMarbleTexture = new THREE.CanvasTexture(canvas);
  bonusChanceMarbleTexture.colorSpace = THREE.SRGBColorSpace;
  return bonusChanceMarbleTexture;
}

function createBonusChanceStar(outerR) {
  return createFaceStarGroup(outerR, {
    fillColor: 0xffee44,
    outlineColor: 0x331100,
    detailTag: 'bonusChanceDetail',
    renderOrder: 20,
    depthTest: true,
    depthWrite: true,
  });
}

function bonusRainbowColorAt(timeMs, out = _bonusRainbowColor) {
  const { periodMs, steps, saturation, lightness } = BONUS_RAINBOW_STROBE;
  const stepCount = Math.max(2, steps);
  const phase = (timeMs % periodMs) / periodMs;
  const step = Math.floor(phase * stepCount) % stepCount;
  const hue = step / stepCount;
  out.setHSL(hue, saturation, lightness);
  return out;
}

function applyBonusRainbowMaterials(materials, rainbow, { emissiveIntensity = 0.45 } = {}) {
  const list = Array.isArray(materials) ? materials : [materials];
  for (const mat of list) {
    if (!mat?.color) continue;
    mat.color.copy(rainbow);
    if (mat.emissive) {
      mat.emissive.copy(rainbow);
      mat.emissiveIntensity = emissiveIntensity;
    }
  }
}

function syncBonusCollectibleBlockRainbow(block, entry, timeMs) {
  if (!block.getData('isBonusCollectible')) return;
  const box = entry.group.userData.boxMesh;
  if (!box?.material) return;
  const spec = BLOCK_MATERIALS.bonusCollectible;
  applyBonusRainbowMaterials(box.material, bonusRainbowColorAt(timeMs), {
    emissiveIntensity: spec.emissiveIntensity ?? 0.5,
  });
}

function syncBonusChanceRainbowColors(group, timeMs) {
  const rainbow = bonusRainbowColorAt(timeMs);

  const marble = group.userData.marbleMesh;
  if (marble?.material) {
    applyBonusRainbowMaterials(marble.material, rainbow, { emissiveIntensity: 0.22 });
  }

  const orbitGroup = group.userData.orbitGroup;
  if (orbitGroup) {
    for (const child of orbitGroup.children) {
      if (child.material) {
        applyBonusRainbowMaterials(child.material, rainbow, { emissiveIntensity: 0.48 });
      }
    }
  }
}

function createBonusChanceSatelliteMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xd4ffe8,
    emissive: 0x44ffaa,
    emissiveIntensity: 0.55,
    roughness: 0.14,
    metalness: 0.05,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.94,
    transmission: 0.04,
    thickness: 0.4,
  });
}

function createBonusChanceItemMesh(displayWidth, displayHeight) {
  const group = new THREE.Group();
  const size = Math.min(Math.max(1, displayWidth), Math.max(1, displayHeight));
  const radius = size * 0.44;
  group.userData.baseRadius = radius;
  group.userData.baseSize = size;

  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.set(DIORAMA.viewTiltX, DIORAMA.viewTiltY, 0);
  group.add(tiltGroup);
  group.userData.tiltGroup = tiltGroup;

  const marble = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 28),
    new THREE.MeshPhysicalMaterial({
      map: getBonusChanceMarbleTexture(),
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.22,
      transparent: true,
      opacity: 0.94,
      roughness: 0.1,
      metalness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      transmission: 0.06,
      thickness: radius * 0.65,
      ior: 1.48,
      depthWrite: true,
    })
  );
  marble.renderOrder = 6;
  const starGroup = createBonusChanceStar(radius * BONUS_CHANCE_ITEM_FX.starOuterFrac);
  starGroup.position.set(0, 0, radius * BONUS_CHANCE_ITEM_FX.starSurfaceFrac);
  marble.add(starGroup);
  group.userData.starGroup = starGroup;
  tiltGroup.add(marble);
  group.userData.marbleMesh = marble;

  const orbitPivot = new THREE.Group();
  orbitPivot.rotation.x = BONUS_CHANCE_ITEM_FX.orbitTiltX;

  const orbitGroup = new THREE.Group();
  const orbitR = radius * BONUS_CHANCE_ITEM_FX.orbitRadiusFrac;
  const satR = radius * BONUS_CHANCE_ITEM_FX.satelliteRadiusFrac;
  const satGeo = new THREE.SphereGeometry(satR, 16, 14);
  const satMat = createBonusChanceSatelliteMaterial();

  for (let i = 0; i < 2; i++) {
    const angle = i * Math.PI;
    const sat = new THREE.Mesh(satGeo, satMat.clone());
    sat.position.set(Math.cos(angle) * orbitR, 0, Math.sin(angle) * orbitR);
    sat.renderOrder = 7;
    orbitGroup.add(sat);
  }
  orbitPivot.add(orbitGroup);
  tiltGroup.add(orbitPivot);
  group.userData.orbitGroup = orbitGroup;

  group.renderOrder = 6;
  return group;
}

function createBallMesh(radius) {
  const tex = ballFaceTexture;
  const material = tex
    ? new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xffffff,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      depthTest: true,
    })
    : new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x44ddff,
      emissiveIntensity: 0.38,
      roughness: 0.68,
      metalness: 0,
      clearcoat: 0.32,
      clearcoatRoughness: 0.78,
      sheen: 0.65,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color(0xffffff),
      transparent: false,
      opacity: 1,
    });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 20), material);
  mesh.userData.baseRadius = radius;
  mesh.userData.hasFaceMap = Boolean(tex);
  mesh.userData.rollQuat = new THREE.Quaternion();
  mesh.renderOrder = 10;
  return mesh;
}

function syncBallMeshRoll(ballMesh, vx, vy, radius, deltaMs, onPaddle) {
  if (!ballMesh?.userData.rollQuat) return;

  if (onPaddle) {
    ballMesh.userData.rollQuat.identity();
    return;
  }

  const speed = Math.hypot(vx, vy);
  if (speed < 8 || radius <= 0) return;

  const spin = globalThis.BLOCK_BALL_ROLL_SPIN ?? 0.45;
  const angle = (speed / radius) * spin * (deltaMs / 1000);
  const vyThree = -vy;
  _ballRollAxis.set(vyThree, -vx, 0);
  if (_ballRollAxis.lengthSq() < 1e-6) return;
  _ballRollAxis.normalize();
  _ballRollDelta.setFromAxisAngle(_ballRollAxis, angle);
  ballMesh.userData.rollQuat.premultiply(_ballRollDelta);
}

function applyBallMeshOrientation(ballMesh) {
  _ballTiltEuler.set(DIORAMA.viewTiltX, 0, 0);
  _ballTiltQuat.setFromEuler(_ballTiltEuler);
  ballMesh.quaternion.copy(_ballTiltQuat).multiply(ballMesh.userData.rollQuat);
}

function stashPhaserSprite(sprite) {
  if (sprite.getData('threeOverlayBase')) return;
  sprite.setData('threeOverlayBase', {
    visible: sprite.visible,
    alpha: sprite.alpha,
    scaleX: sprite.scaleX,
    scaleY: sprite.scaleY,
    x: sprite.x,
    y: sprite.y,
    depth: sprite.depth,
  });
}

function restorePhaserSprite(sprite) {
  const base = sprite.getData('threeOverlayBase');
  if (!base) return;
  sprite.clearTint();
  sprite.setAlpha(base.alpha);
  sprite.setScale(base.scaleX, base.scaleY);
  sprite.x = base.x;
  sprite.y = base.y;
  sprite.setDepth(base.depth);
  sprite.setVisible(base.visible);
  sprite.setData('threeOverlayBase', null);
}

function hidePhaserSprite(sprite) {
  stashPhaserSprite(sprite);
  sprite.setVisible(false);
}

function disposeMeshTree(mesh) {
  mesh.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

/**
 * @param {{
 *   width: number,
 *   height: number,
 *   parent: HTMLElement,
 *   getPhaserCanvas: () => HTMLCanvasElement,
 *   getLayout?: () => {
 *     gameW: number,
 *     gameH: number,
 *     displayW: number,
 *     displayH: number,
 *     offsetLeft: number,
 *     offsetTop: number,
 *   } | null,
 *   getCamera?: () => {
 *     scrollX?: number,
 *     scrollY?: number,
 *     zoom?: number,
 *     rotation?: number,
 *     shakeX?: number,
 *     shakeY?: number,
 *   } | null,
 * }} opts
 */
export function createThreeOverlay(opts) {
  const { width, height, parent, getLayout, getCamera } = opts;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  canvas.id = 'three-overlay';

  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);

  const camera = new THREE.OrthographicCamera(0, width, height, 0, -1000, 1000);
  camera.position.set(0, 0, 500);

  scene.add(new THREE.AmbientLight(0xffffff, 0.95));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf4f0e8, 0.72));

  const keyLight = new THREE.DirectionalLight(0xffffff, 0.42);
  keyLight.position.set(0.25, -0.55, 1.1);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.52);
  fillLight.position.set(-0.35, 0.25, 1.05);
  scene.add(fillLight);

  const frontLight = new THREE.DirectionalLight(0xfff8ee, 0.38);
  frontLight.position.set(0, 0, 1);
  scene.add(frontLight);

  /** @type {Map<object, { group: THREE.Group, powerFxGroup: THREE.Group | null }>} */
  const blockMeshes = new Map();
  /** @type {Map<object, { group: THREE.Group }>} */
  const itemMeshes = new Map();
  /** @type {Array<{ starGroup: THREE.Group, start: number, baseY: number, baseRot: number, onComplete?: () => void }>} */
  const scoreStarLiberations = [];
  let ballMesh = null;
  let ballRef = null;
  let paddleMesh = null;
  let paddleRef = null;
  let phaserScene = null;
  let resizeObserver = null;
  let rafId = 0;
  let viewW = width;
  let viewH = height;
  let mounted = false;
  let disposed = false;

  function phaserYToThreeY(py) {
    return viewH - py;
  }

  function syncCameraRoot() {
    const cam = getCamera?.();
    if (!cam) {
      root.position.set(0, 0, 0);
      root.scale.set(1, 1, 1);
      root.rotation.z = 0;
      return;
    }

    const zoom = cam.zoom ?? 1;
    const scrollX = cam.scrollX ?? 0;
    const scrollY = cam.scrollY ?? 0;
    const shakeX = cam.shakeX ?? 0;
    const shakeY = cam.shakeY ?? 0;
    const rot = cam.rotation ?? 0;
    const cx = viewW * 0.5;
    const cy = viewH * 0.5;

    root.position.set(
      -scrollX * zoom + cx * (1 - zoom) + shakeX,
      scrollY * zoom + cy * (zoom - 1) - shakeY,
      0
    );
    root.scale.set(zoom, zoom, 1);
    root.rotation.z = -rot;
  }

  function placeMesh(mesh, sprite, zBias = 0, liftPx = 0) {
    const px = sprite.x;
    const liftSign = Math.sign(DIORAMA.viewTiltX || 1);
    let py = sprite.y + liftSign * liftPx;
    // Hazards use Phaser origin (0.5, 1) at the cell bottom; meshes are group-centered.
    if (sprite.getData?.('isHazard')) {
      py -= sprite.displayHeight * 0.5;
    }
    mesh.position.set(
      Math.round(px),
      Math.round(phaserYToThreeY(py)),
      zBias
    );
    const rz = sprite.rotation || 0;
    mesh.rotation.set(DIORAMA.viewTiltX, DIORAMA.viewTiltY, rz);
  }

  function blockLiftFor(block, group = null) {
    if (block.getData?.('isHazard')) return 0;
    const depth =
      group?.userData?.blockDepth ??
      blockPuffyDimensions(block.displayWidth, block.displayHeight).depth;
    return dioramaBlockLift(depth);
  }

  function refreshBlockMaterial(block, entry) {
    const mesh = entry.group;
    const matKey = blockMaterialKey(block);
    const prevKey = mesh.userData.matKey;
    if (prevKey === matKey) return;
    const box = mesh.userData.boxMesh;
    if (box) {
      disposeBlockMaterials(box.material);
      box.material = makeDioramaBlockMaterials(matKey);
    }
    mesh.userData.matKey = matKey;
    if (matKey === 'normal' && prevKey !== 'normal') {
      ensureNormalBlockStarFace(mesh, block);
    }
    if (matKey === 'gray' && prevKey !== 'gray') {
      ensureGrayBlockStarFace(mesh, block);
    }
    if (matKey !== 'gray' && prevKey === 'gray') {
      removeGrayBlockStarFace(mesh);
    }
  }

  function blockMeshMatchesType(block, entry) {
    const typeId = block.getData('typeId');
    const meshIsScore = Boolean(entry.group.userData.scoreStarGroup);
    return (typeId === 'score') === meshIsScore;
  }

  function replaceBlockMesh(block) {
    const entry = blockMeshes.get(block);
    if (entry) {
      root.remove(entry.group);
      disposeMeshTree(entry.group);
      blockMeshes.delete(block);
    }
    const typeId = block.getData('typeId');
    if (!MESH_BLOCK_TYPES.has(typeId)) {
      restorePhaserSprite(block);
      return;
    }
    const group = createBlockMesh(block);
    const row = block.getData('gridRow') ?? 0;
    const col = block.getData('gridCol') ?? 0;
    placeMesh(group, block, row * 0.45 + col * 0.02 + 4, blockLiftFor(block, group));
    root.add(group);
    blockMeshes.set(block, { group, powerFxGroup: null });
    hidePhaserSprite(block);
  }

  function isUnrevealedHidden(block) {
    if (typeof globalThis.isUnrevealedHiddenBlock === 'function') {
      return globalThis.isUnrevealedHiddenBlock(block);
    }
    const typeId = block.getData('typeId');
    return (typeId === 'hidden' || typeId === 'hidden_2x2') && !block.getData('hiddenRevealed');
  }

  /** Invisible until hit; visible while the flip tween runs. */
  function shouldHideHiddenPanel(block, entry) {
    if (!isUnrevealedHidden(block)) return false;
    if (block.getData('hiddenRevealing')) return false;
    if (block.getData('hiddenRevealFlipFx') || entry?.hiddenRevealFx) return false;
    return true;
  }

  function syncBlock(block) {
    const entry = blockMeshes.get(block);
    if (!entry) return;
    const hidePanel = shouldHideHiddenPanel(block, entry);
    if (syncHiddenBlockRevealFx(block, entry, phaserScene, () => blockMeshes.get(block))) {
      return;
    }
    const row = block.getData('gridRow') ?? 0;
    const col = block.getData('gridCol') ?? 0;
    placeMesh(entry.group, block, -row * 0.45 + col * 0.02 + 4, blockLiftFor(block, entry.group));
    refreshBlockMaterial(block, entry);
    if (phaserScene?.time && block.getData('isBonusCollectible')) {
      syncBonusCollectibleBlockRainbow(block, entry, phaserScene.time.now);
    }
    syncPowerBlockFx(block, entry, phaserScene);
    syncGrayDowngradeFx(block, entry, phaserScene);
    syncNormalBlockStarRotation(block, entry, phaserScene);
    syncScoreBlockFx(block, entry, phaserScene);
    entry.group.visible = block.active && !hidePanel;
  }

  function syncPaddleMesh() {
    if (!paddleRef?.active || !paddleMesh) return;

    const depth =
      Math.min(paddleMesh.userData.baseW, paddleMesh.userData.baseH) * 0.36;
    placeMesh(paddleMesh, paddleRef, 5, dioramaBlockLift(depth));

    const baseW = paddleMesh.userData.baseW;
    const baseH = paddleMesh.userData.baseH;
    if (baseW > 0 && baseH > 0) {
      paddleMesh.scale.set(paddleRef.displayWidth / baseW, paddleRef.displayHeight / baseH, 1);
    }
    paddleMesh.visible = paddleRef.active;

    const main = paddleMesh.userData.mainMesh;
    if (main?.material) {
      const charging = Boolean(phaserScene?.paddleCharging);
      const hex = charging ? PADDLE_COLORS.chargeTint : PADDLE_COLORS.main;
      main.material.color.setHex(hex);
      main.material.emissive.setHex(hex);
      main.material.emissiveIntensity = charging ? 0.32 : 0.24;
    }

    const stars = paddleMesh.userData.endStars;
    if (stars?.length && phaserScene?.time) {
      const timeMs = phaserScene.time.now;
      for (const star of stars) {
        syncPaddleEndStarVisuals(star, timeMs);
      }
    }
  }

  function syncBallMesh() {
    if (!ballRef?.active || !ballMesh) return;

    const baseR = ballMesh.userData.baseRadius;
    const halfW = ballRef.displayWidth * 0.5;
    const halfH = ballRef.displayHeight * 0.5;
    ballMesh.position.set(
      Math.round(ballRef.x),
      Math.round(phaserYToThreeY(ballRef.y)),
      8
    );

    const vx = ballRef.body?.velocity?.x ?? 0;
    const vy = ballRef.body?.velocity?.y ?? 0;
    const deltaMs = phaserScene?.game?.loop?.delta ?? 16;
    const onPaddle = Boolean(phaserScene?.ballOnPaddle);
    syncBallMeshRoll(ballMesh, vx, vy, Math.max(halfW, halfH), deltaMs, onPaddle);
    applyBallMeshOrientation(ballMesh);

    if (baseR > 0) {
      const sx = halfW / baseR;
      const sy = halfH / baseR;
      const sz = (sx + sy) * 0.5;
      ballMesh.scale.set(sx, sy, sz);
    }
    ballMesh.visible = ballRef.active;

    const powered = phaserScene.ballPowerMode || phaserScene.powerBounceActive;
    if (ballMesh.userData.hasFaceMap) {
      const nextMap = getBallFaceTextureForPower(powered);
      if (nextMap && ballMesh.material.map !== nextMap) {
        ballMesh.material.map = nextMap;
        ballMesh.material.needsUpdate = true;
      }
      ballMesh.material.color.setHex(0xffffff);
    } else if (ballMesh.material.emissive) {
      ballMesh.material.emissive.setHex(powered ? 0xff8800 : 0x44ddff);
      ballMesh.material.emissiveIntensity = powered ? 0.55 : 0.38;
    }
  }

  function placeBonusChanceItemMesh(group, item, zBias = 0, liftPx = 0) {
    const px = item.x;
    const liftSign = Math.sign(DIORAMA.viewTiltX || 1);
    const py = item.y + liftSign * liftPx;
    group.position.set(
      Math.round(px),
      Math.round(phaserYToThreeY(py)),
      zBias
    );
    const rz = item.rotation || 0;
    const tiltGroup = group.userData.tiltGroup;
    if (tiltGroup) {
      tiltGroup.rotation.set(DIORAMA.viewTiltX, DIORAMA.viewTiltY, rz);
    }
  }

  function syncBonusChanceItemMesh(entry) {
    const item = entry.itemRef;
    const group = entry.group;
    if (!item?.active || !group) return;

    const depth = group.userData.baseRadius ?? 8;
    placeBonusChanceItemMesh(group, item, 5.5, dioramaBlockLift(depth));

    const size = Math.min(item.displayWidth, item.displayHeight);
    const baseSize = group.userData.baseSize;
    if (baseSize > 0 && Math.abs(size - baseSize) > 0.5) {
      const s = size / baseSize;
      group.scale.set(s, s, s);
    }

    group.visible = item.active;

    const timeMs = phaserScene?.time?.now ?? performance.now();
    const marble = group.userData.marbleMesh;
    if (marble) {
      marble.rotation.y = timeMs * BONUS_CHANCE_ITEM_FX.marbleSpinRadPerMs;
    }
    const orbitGroup = group.userData.orbitGroup;
    if (orbitGroup) {
      orbitGroup.rotation.y = timeMs * BONUS_CHANCE_ITEM_FX.orbitSpeedRadPerMs;
    }
    syncBonusChanceRainbowColors(group, timeMs);
  }

  function syncMeshes() {
    if (!phaserScene) return;

    syncPaddleMesh();
    syncBallMesh();

    for (const block of blockMeshes.keys()) {
      if (block.active) syncBlock(block);
    }

    for (const entry of itemMeshes.values()) {
      if (entry.itemRef?.active) syncBonusChanceItemMesh(entry);
    }

    syncLiberatedScoreStars(phaserScene, scoreStarLiberations, root, camera);
  }

  function syncLayout() {
    if (!canvas || !parent) return;

    phaserScene?.scale?.updateBounds?.();

    const layout = getLayout?.();
    if (!layout) return;

    canvas.style.position = 'absolute';
    canvas.style.left = `${layout.offsetLeft}px`;
    canvas.style.top = `${layout.offsetTop}px`;
    canvas.style.width = `${layout.displayW}px`;
    canvas.style.height = `${layout.displayH}px`;
    canvas.style.margin = '0';
    canvas.style.padding = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2';

    window.syncGameFxOverlayLayout?.(layout, parent);

    const phaserCanvas = document.querySelector('#game-container canvas:not(#three-overlay)');
    if (phaserCanvas) {
      phaserCanvas.style.position = 'relative';
      phaserCanvas.style.zIndex = '1';
    }

    const gameW = layout.gameW;
    const gameH = layout.gameH;
    if (gameW !== viewW || gameH !== viewH) {
      viewW = gameW;
      viewH = gameH;
      camera.left = 0;
      camera.right = gameW;
      camera.top = gameH;
      camera.bottom = 0;
      camera.updateProjectionMatrix();
      renderer.setSize(gameW, gameH, false);
    }
  }

  function renderFrame() {
    try {
      syncLayout();
      syncCameraRoot();
      syncMeshes();
      renderer.render(scene, camera);
    } catch (err) {
      console.error('[BlockBall 3D] renderFrame failed', err);
    }
  }

  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);
    renderFrame();
  }

  const api = {
    supportsBlock(block) {
      return MESH_BLOCK_TYPES.has(block.getData('typeId'));
    },

    hasBlockMesh(block) {
      return blockMeshes.has(block);
    },

    bindPhaserScene(scene) {
      phaserScene = scene;
      scene.events.once('shutdown', () => api.dispose());
      scene.events.once('destroy', () => api.dispose());
    },

    registerBlock(block) {
      if (!this.supportsBlock(block)) return false;
      if (blockMeshes.has(block)) return true;
      const group = createBlockMesh(block);
      const row = block.getData('gridRow') ?? 0;
      const col = block.getData('gridCol') ?? 0;
      if (typeof globalThis.normalStarTickerPhase === 'function') {
        block.setData('starPhase', globalThis.normalStarTickerPhase(col, row));
      }
      placeMesh(group, block, row * 0.45 + col * 0.02 + 4, blockLiftFor(block, group));
      root.add(group);
      blockMeshes.set(block, { group, powerFxGroup: null });
      hidePhaserSprite(block);
      return true;
    },

    unregisterBlock(block) {
      restorePhaserSprite(block);
      const entry = blockMeshes.get(block);
      if (!entry) return;
      root.remove(entry.group);
      disposeMeshTree(entry.group);
      blockMeshes.delete(block);
    },

    updateBlock(block) {
      const typeId = block.getData('typeId');
      const entry = blockMeshes.get(block);
      if (typeId && MESH_BLOCK_TYPES.has(typeId) && !entry) {
        this.registerBlock(block);
        return;
      }
      if (entry && !blockMeshMatchesType(block, entry)) {
        replaceBlockMesh(block);
        return;
      }
      syncBlock(block);
    },

    triggerScoreBlockHit(block) {
      const entry = blockMeshes.get(block);
      if (!entry || !phaserScene?.time) return;
      prepareScoreBlockHitFx(block, entry);
      block.setData('scoreHitFxStart', phaserScene.time.now);
    },

    startHiddenBlockReveal(block, onMidpoint, onComplete) {
      const entry = blockMeshes.get(block);
      if (!entry || !phaserScene?.time) return false;
      const fx = {
        start: phaserScene.time.now,
        baseScaleX: Math.abs(entry.group.scale.x) || 1,
        onMidpoint,
        onComplete,
        midCalled: false,
      };
      block.setData('hiddenRevealFlipFx', fx);
      entry.hiddenRevealFx = fx;
      entry.group.visible = true;
      return true;
    },

    releaseScoreBlockStar(block) {
      const entry = blockMeshes.get(block);
      if (!entry || !phaserScene?.time) return false;

      const group = entry.group;
      const starGroup = group.userData.scoreStarGroup;
      if (!starGroup) return false;

      block.setData('scoreHitFxStart', null);

      const box = group.userData.boxMesh;
      if (box) box.visible = false;

      starGroup.visible = true;
      const detached = detachScoreStarForLiberation(starGroup, group, root, camera);
      if (!detached) return false;
      const { baseRotZ, baseScale } = detached;
      root.updateWorldMatrix(true, false);
      const towardAxis = cameraTowardAxisLocal(starGroup, root, camera, new THREE.Vector3());

      scoreStarLiberations.push({
        starGroup,
        start: phaserScene.time.now,
        baseX: starGroup.position.x,
        baseY: starGroup.position.y,
        baseZ: starGroup.position.z,
        towardAxis: { x: towardAxis.x, y: towardAxis.y, z: towardAxis.z },
        baseRotZ,
        baseScale,
      });

      blockMeshes.delete(block);
      root.remove(group);
      disposeMeshTree(group);
      return true;
    },

    registerPaddle(paddle) {
      paddleRef = paddle;
      if (paddleMesh) {
        root.remove(paddleMesh);
        disposeMeshTree(paddleMesh);
        paddleMesh = null;
      }
      paddleMesh = createPaddleMesh(paddle.displayWidth, paddle.displayHeight);
      root.add(paddleMesh);
      hidePhaserSprite(paddle);
      syncPaddleMesh();
    },

    triggerPaddlePowerStarSpin() {
      if (!paddleMesh || !phaserScene?.time) return;
      triggerPaddleEndStarPowerSpin(paddleMesh.userData.endStars, phaserScene.time.now);
    },

    registerBall(ball) {
      ballRef = ball;
      if (ballMesh) {
        root.remove(ballMesh);
        disposeMeshTree(ballMesh);
      }
      const radius = ball.displayWidth * 0.5;
      ballMesh = createBallMesh(radius);
      root.add(ballMesh);
      hidePhaserSprite(ball);
    },

    registerItem(item) {
      const typeId = item.getData('typeId');
      if (typeId !== 'item_bonus_chance') return false;
      if (itemMeshes.has(item)) return true;

      const group = createBonusChanceItemMesh(item.displayWidth, item.displayHeight);
      root.add(group);
      itemMeshes.set(item, { group, itemRef: item });
      hidePhaserSprite(item);
      syncBonusChanceItemMesh(itemMeshes.get(item));
      return true;
    },

    unregisterItem(item) {
      restorePhaserSprite(item);
      const entry = itemMeshes.get(item);
      if (!entry) return;
      root.remove(entry.group);
      disposeMeshTree(entry.group);
      itemMeshes.delete(item);
    },

    hasItemMesh(item) {
      return itemMeshes.has(item);
    },

    syncLayout,

    resize(w, h) {
      viewW = w;
      viewH = h;
      camera.left = 0;
      camera.right = w;
      camera.top = h;
      camera.bottom = 0;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      syncLayout();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncLayout);
      for (const block of [...blockMeshes.keys()]) {
        api.unregisterBlock(block);
      }
      for (const item of [...itemMeshes.keys()]) {
        api.unregisterItem(item);
      }
      for (const lib of scoreStarLiberations) {
        if (lib.starGroup?.parent) root.remove(lib.starGroup);
        disposeMeshTree(lib.starGroup);
      }
      scoreStarLiberations.length = 0;
      if (paddleRef) restorePhaserSprite(paddleRef);
      if (paddleMesh) {
        disposeMeshTree(paddleMesh);
        root.remove(paddleMesh);
        paddleMesh = null;
      }
      paddleRef = null;
      if (ballRef) restorePhaserSprite(ballRef);
      if (ballMesh) {
        disposeMeshTree(ballMesh);
        root.remove(ballMesh);
        ballMesh = null;
      }
      renderer.dispose();
      canvas.remove();
      phaserScene = null;
      ballRef = null;
      mounted = false;
    },

    start() {
      if (mounted) return;
      if (parent && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(canvas);
      mounted = true;
      syncLayout();
      resizeObserver = new ResizeObserver(syncLayout);
      resizeObserver.observe(parent);
      window.addEventListener('resize', syncLayout);
      renderLoop();
    },
  };

  return api;
}
