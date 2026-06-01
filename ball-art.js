/**
 * Player ball — character face texture.
 */
/* global Phaser */

const BALL_FACE_URL = 'assets/ball/face.png?v=1';
const BALL_POWER_FACE_URL = 'assets/ball/power.png?v=1';
/** Roll rate vs no-slip physics (1 = full speed, lower = slower tumble). */
const BALL_ROLL_SPIN = 0.45;

let ballFaceImage = null;
let ballPowerFaceImage = null;
let ballFaceLoadPromise = null;

function loadBallFaceImageFromUrl(url, label) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('[BlockBall] ball face failed to load:', label, url);
      resolve(null);
    };
    img.src = url;
  });
}

/** @returns {Promise<HTMLImageElement|null>} */
function loadBallFaceImage() {
  if (ballFaceImage && ballPowerFaceImage) return Promise.resolve(ballFaceImage);
  if (ballFaceLoadPromise) return ballFaceLoadPromise;

  ballFaceLoadPromise = Promise.all([
    loadBallFaceImageFromUrl(BALL_FACE_URL, 'neutral'),
    loadBallFaceImageFromUrl(BALL_POWER_FACE_URL, 'power'),
  ]).then(([neutral, power]) => {
    ballFaceImage = neutral;
    ballPowerFaceImage = power || neutral;
    return ballFaceImage;
  });

  return ballFaceLoadPromise;
}

function getBallFaceImage() {
  return ballFaceImage;
}

function getBallPowerFaceImage() {
  return ballPowerFaceImage || ballFaceImage;
}

/** 2D sprite roll direction from velocity (Phaser y-down). */
function ballRollSign(vx, vy) {
  if (Math.abs(vx) >= Math.abs(vy)) return Math.sign(vx) || 1;
  return Math.sign(-vy) || 1;
}

/** Angular speed (rad/s) for no-slip rolling at `speed` on radius `r`. */
function ballRollAngularSpeed(speed, radius, spinMul = BALL_ROLL_SPIN) {
  if (radius <= 0) return 0;
  return (speed / radius) * spinMul;
}

/** Register Phaser texture keys for neutral and power ball faces. */
function registerBallFaceTextures(scene, keys = { neutral: 'ball', determined: 'ball_determined' }) {
  if (!ballFaceImage) return false;
  const pairs = [
    [keys.neutral, ballFaceImage],
    [keys.determined, getBallPowerFaceImage()],
  ];
  for (const [key, img] of pairs) {
    if (!img) continue;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addImage(key, img);
  }
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BALL_FACE_URL,
    BALL_POWER_FACE_URL,
    BALL_ROLL_SPIN,
    loadBallFaceImage,
    getBallFaceImage,
    getBallPowerFaceImage,
    ballRollSign,
    ballRollAngularSpeed,
    registerBallFaceTextures,
  };
}

if (typeof globalThis !== 'undefined') {
  globalThis.BLOCK_BALL_ROLL_SPIN = BALL_ROLL_SPIN;
}
