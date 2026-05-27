/**
 * Block Ball — block compendium & type registry
 * Source of truth for IDs, scoring, and hit rules (demo + future levels).
 */
/* global Phaser */

const BLOCK_COMPENDIUM = [
  {
    id: 'normal',
    name: 'Normal Block',
    implemented: true,
    appearance: 'Blue-grey clay cube (assets/blocks/normal.png)',
    points: 100,
    normalHit: 'destroy',
    powerHit: 'destroy',
    notes: 'Basic building block. Colored (Flip) variants often double points.',
  },
  {
    id: 'gray',
    name: 'Gray Block',
    implemented: true,
    appearance: 'Dark gray procedural rectangle',
    points: 200,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    notes: 'Two-step on normal bounces; one Power Bounce clears it.',
  },
  {
    id: 'power',
    name: 'Power Block',
    implemented: true,
    appearance: 'Dark gray procedural block with glow',
    points: 500,
    normalHit: 'immune',
    powerHit: 'destroy',
    notes: 'Gatekeeper — requires Power Bounce. Often protects clusters behind.',
  },
  {
    id: 'spike',
    name: 'Spike Block',
    implemented: true,
    appearance: 'Spike sprite (assets/blocks/spike.png); procedural fallback',
    points: 0,
    normalHit: 'hazard',
    powerHit: 'hazard_bounce',
    notes: 'Costs a life on contact unless the ball is powered. Indestructible.',
  },
  {
    id: 'splitting',
    name: 'Splitting Block',
    implemented: false,
    appearance: 'Large white or gray',
    points: 200,
    normalHit: 'split_four',
    powerHit: 'split_or_destroy',
    notes: 'Breaks into four smaller normal/gray pieces.',
  },
  {
    id: 'ability',
    name: 'Ability Block',
    implemented: false,
    appearance: 'Special pattern',
    points: 0,
    normalHit: 'immune_or_weak',
    powerHit: 'damage_with_ability',
    notes: 'Usually needs active Copy Ability to destroy.',
  },
  {
    id: 'indestructible',
    name: 'Indestructible Block',
    implemented: true,
    appearance: 'Steel grey procedural block with X mark',
    points: 0,
    normalHit: 'immune',
    powerHit: 'immune',
    notes: 'Bounces off; never destroyed or damaged. Does not count toward level clear.',
  },
  {
    id: 'score',
    name: 'Score / Bonus Block',
    implemented: false,
    appearance: 'Numbered or flashing',
    points: 0,
    normalHit: 'hit_increment',
    powerHit: 'hit_increment_high',
    notes: 'Up to ~7 hits; escalating points; 1-Ups at max with ability.',
  },
  {
    id: 'star',
    name: 'Star / Switch Block',
    implemented: false,
    appearance: 'Star mark',
    points: 0,
    normalHit: 'collect',
    powerHit: 'collect',
    notes: 'Collect all → Bonus Chance (Through blocks).',
  },
  {
    id: 'through',
    name: 'Through Block',
    implemented: false,
    appearance: 'Semi-transparent',
    points: 50,
    normalHit: 'pass_through',
    powerHit: 'pass_through',
    notes: 'Bonus Chance only; no bounce.',
  },
  {
    id: 'pinball',
    name: 'Pinball / Bumper Block',
    implemented: false,
    appearance: 'Round bumper',
    points: 10,
    normalHit: 'bounce_boost',
    powerHit: 'bounce_boost',
    notes: 'Indestructible; speeds up ball; farmable small points.',
  },
];

/** Playable block definitions (textures + collision rules) */
const BLOCK_TYPES = {
  normal: {
    id: 'normal',
    texture: 'block_normal',
    points: 100,
    powerOnly: false,
    normalHit: 'destroy',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  gray: {
    id: 'gray',
    texture: 'block_gray',
    points: 200,
    powerOnly: false,
    normalHit: 'damage_to_normal',
    powerHit: 'destroy',
    downgradeTo: 'normal',
    countsTowardClear: true,
  },
  power: {
    id: 'power',
    texture: 'block_power',
    points: 500,
    powerOnly: true,
    normalHit: 'immune',
    powerHit: 'destroy',
    countsTowardClear: true,
  },
  spike: {
    id: 'spike',
    texture: 'block_spike',
    points: 0,
    powerOnly: false,
    normalHit: 'hazard',
    powerHit: 'hazard_bounce',
    countsTowardClear: false,
    isHazard: true,
  },
  indestructible: {
    id: 'indestructible',
    texture: 'block_indestructible',
    points: 0,
    powerOnly: false,
    normalHit: 'immune',
    powerHit: 'immune',
    countsTowardClear: false,
  },
};

/** Level grid cell → block type id */
const BLOCK_CELL_MAP = {
  0: null,
  1: 'normal',
  2: 'gray',
  3: 'power',
  4: 'spike',
  5: 'indestructible',
};

function getBlockDef(typeId) {
  return BLOCK_TYPES[typeId] || BLOCK_TYPES.normal;
}

function getCompendiumEntry(typeId) {
  return BLOCK_COMPENDIUM.find((b) => b.id === typeId);
}

function resolveBlockHit(typeId, isPowered) {
  const def = getBlockDef(typeId);
  if (def.normalHit === 'hazard' || def.isHazard) {
    if (isPowered && def.powerHit === 'hazard_bounce') return { action: 'hazard_bounce', points: 0 };
    return { action: 'hazard', points: 0 };
  }
  if (isPowered) {
    if (def.powerHit === 'destroy') return { action: 'destroy', points: def.points };
    if (def.powerHit === 'immune') return { action: 'immune', points: 0 };
  }
  if (def.powerOnly || def.normalHit === 'immune') return { action: 'immune', points: 0 };
  if (def.normalHit === 'damage_to_normal' && def.downgradeTo) {
    return { action: 'downgrade', toType: def.downgradeTo, points: 0 };
  }
  if (def.normalHit === 'destroy') return { action: 'destroy', points: def.points };
  return { action: 'immune', points: 0 };
}
