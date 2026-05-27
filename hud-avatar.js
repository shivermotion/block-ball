/**
 * HUD avatar — state → texture mapping. Swap art by registering textures under these keys
 * or override per-level via `hudLayout.avatar.states`.
 */

const HUD_AVATAR_STATES = {
  default: { texture: 'ball', fallback: 'hud_avatar_default', priority: 0 },
  power: { texture: 'ball_determined', fallback: 'hud_avatar_power', priority: 40 },
  hurt: { texture: 'hud_avatar_hurt', priority: 10 },
  charging: { texture: 'hud_avatar_charging', priority: 20 },
  armed: { texture: 'hud_avatar_armed', priority: 25 },
  cooling: { texture: 'hud_avatar_cooling', priority: 30 },
  level_clear: { texture: 'hud_avatar_happy', priority: 50 },
  game_over: { texture: 'hud_avatar_defeated', priority: 60 },
};

/** @param {Phaser.GameObjects.Graphics} g */
function drawAvatarFace(g, av, skin, ringColor) {
  g.fillStyle(ringColor, 1);
  g.fillCircle(av / 2, av / 2, av / 2 - 1);
  g.fillStyle(skin, 1);
  g.fillCircle(av / 2, av * 0.42, av * 0.22);
  g.fillStyle(0x1a1a2e, 1);
  g.fillCircle(av * 0.38, av * 0.4, 2.5);
  g.fillCircle(av * 0.62, av * 0.4, 2.5);
  g.lineStyle(2, 0x1a1a2e, 0.85);
  g.beginPath();
  g.arc(av / 2, av * 0.48, av * 0.12, 0.15, Math.PI - 0.15, false);
  g.strokePath();
}

/** Procedural placeholders until real portrait assets are loaded. */
function generateHudAvatarTextures(scene, size = 48) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  const av = size;

  if (!scene.textures.exists('ball')) {
    g.clear();
    drawAvatarFace(g, av, 0xffd4a8, 0x3d4f6f);
    g.generateTexture('hud_avatar_default', av, av);
  }

  g.clear();
  drawAvatarFace(g, av, 0xffb8a8, 0x8b2942);
  g.fillStyle(0xff6b6b, 0.9);
  g.fillTriangle(av * 0.72, av * 0.18, av * 0.88, av * 0.34, av * 0.72, av * 0.34);
  g.generateTexture('hud_avatar_hurt', av, av);

  g.clear();
  drawAvatarFace(g, av, 0xffd4a8, 0x00a884);
  g.lineStyle(3, 0xb8ffec, 0.9);
  g.strokeCircle(av / 2, av / 2, av / 2 - 4);
  g.generateTexture('hud_avatar_charging', av, av);

  g.clear();
  drawAvatarFace(g, av, 0xffd4a8, 0x6b7280);
  g.fillStyle(0xffe66d, 1);
  g.fillCircle(av * 0.78, av * 0.22, av * 0.1);
  g.lineStyle(2, 0xffe66d, 0.85);
  g.strokeCircle(av * 0.78, av * 0.22, av * 0.14);
  g.generateTexture('hud_avatar_armed', av, av);

  g.clear();
  drawAvatarFace(g, av, 0xcfd4dc, 0x6b7280);
  g.lineStyle(2, 0x9ca3af, 0.7);
  g.strokeCircle(av / 2, av / 2, av / 2 - 3);
  g.generateTexture('hud_avatar_cooling', av, av);

  if (!scene.textures.exists('ball_determined')) {
    g.clear();
    drawAvatarFace(g, av, 0xfff0a0, 0xffe66d);
    g.lineStyle(3, 0xffffff, 0.95);
    g.strokeCircle(av / 2, av / 2, av / 2 - 3);
    g.fillStyle(0xffe66d, 1);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      g.fillCircle(av / 2 + Math.cos(a) * (av * 0.38), av / 2 + Math.sin(a) * (av * 0.38), 3);
    }
    g.generateTexture('hud_avatar_power', av, av);
  }

  g.clear();
  drawAvatarFace(g, av, 0xffd4a8, 0x00d4aa);
  g.lineStyle(3, 0xffffff, 0.9);
  g.beginPath();
  g.arc(av / 2, av * 0.55, av * 0.18, 0.1, Math.PI - 0.1, false);
  g.strokePath();
  g.generateTexture('hud_avatar_happy', av, av);

  g.clear();
  drawAvatarFace(g, av, 0x9ca3af, 0x374151);
  g.lineStyle(2, 0x1a1a2e, 0.9);
  g.beginPath();
  g.arc(av / 2, av * 0.52, av * 0.14, Math.PI + 0.2, -0.2, true);
  g.strokePath();
  g.generateTexture('hud_avatar_defeated', av, av);

  g.destroy();
}

/**
 * Pick highest-priority avatar state from current gameplay flags.
 * @param {object} snap
 * @returns {string} state id
 */
function resolveHudAvatarState(snap) {
  const candidates = [];

  if (snap.gameState === 'gameOver') candidates.push('game_over');
  if (snap.gameState === 'levelClear') candidates.push('level_clear');
  if (snap.ballPowerMode) candidates.push('power');
  if (snap.ballPowerCooling) candidates.push('cooling');
  if (snap.powerBounceQueued) candidates.push('armed');
  if (snap.paddleCharging) candidates.push('charging');
  if (snap.lives === 1 && snap.lives > 0) candidates.push('hurt');

  if (candidates.length === 0) return 'default';

  let best = 'default';
  let bestPri = -1;
  for (const id of candidates) {
    const pri = HUD_AVATAR_STATES[id]?.priority ?? 0;
    if (pri > bestPri) {
      bestPri = pri;
      best = id;
    }
  }
  return best;
}

function getHudAvatarTextureKey(stateId, avatarConfig = null, scene = null) {
  const override = avatarConfig?.states?.[stateId];
  if (override) return override;
  const entry = HUD_AVATAR_STATES[stateId] ?? HUD_AVATAR_STATES.default;
  const primary = entry.texture;
  if (scene?.textures?.exists(primary)) return primary;
  if (entry.fallback && scene?.textures?.exists(entry.fallback)) return entry.fallback;
  return primary;
}

/**
 * Apply state to a Phaser Image. No-op if texture key missing.
 * @param {Phaser.GameObjects.Image} image
 * @param {string} stateId
 * @param {object} [avatarConfig] level.hudLayout.avatar
 */
function applyHudAvatarState(image, stateId, avatarConfig = null) {
  if (!image?.setTexture) return stateId;
  const scene = image.scene;
  const key = getHudAvatarTextureKey(stateId, avatarConfig, scene);
  if (!scene?.textures?.exists(key)) return stateId;
  if (image.texture.key !== key) image.setTexture(key);
  const size = image.getData('hudAvatarSize');
  if (size) image.setDisplaySize(size, size);
  image.setData('avatarState', stateId);
  return stateId;
}
