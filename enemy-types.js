/**
 * Block Ball — enemy compendium & type registry (HP, movement, drops).
 */
/* global Phaser */

const ENEMY_TIER = {
  mob: 'mob',
  midBoss: 'midBoss',
  boss: 'boss',
};

const MOB_FOOTPRINT = { colSpan: 2, rowSpan: 2 };
const SMALL_MOB_FOOTPRINT = { colSpan: 1, rowSpan: 1 };
const MID_BOSS_FOOTPRINT = { colSpan: 3, rowSpan: 3 };
const BOSS_FOOTPRINT = { colSpan: 4, rowSpan: 4 };

const ENEMY_COMPENDIUM = [
  { id: 'ground_walker', tier: ENEMY_TIER.mob, name: 'Ground Walker', hp: 1, movement: 'slow_horizontal', speed: 'very_slow', drop: 'food_candy', points: 200, implemented: true, model3d: true, notes: 'Most common basic target — mushroom mob.' },
  { id: 'horizontal_flyer', tier: ENEMY_TIER.mob, name: 'Horizontal Flyer', hp: 1, movement: 'horizontal_bounce', speed: 'medium', drop: 'food_apple', points: 200, implemented: true, model3d: true, notes: 'Common aerial target — cute monster flyer.' },
  { id: 'spark_blaster', tier: ENEMY_TIER.mob, name: 'Spark Blaster', hp: 1, movement: 'stationary_drift', speed: 'stationary', drop: 'ability_spark', points: 350, implemented: false, notes: 'Electric ability giver.' },
  { id: 'flame_riser', tier: ENEMY_TIER.mob, name: 'Flame Riser', hp: 1, movement: 'vertical_diagonal', speed: 'medium', drop: 'ability_burn', points: 350, footprint: SMALL_MOB_FOOTPRINT, implemented: true, model3d: true, notes: '1×1 — spins down, then rockets back up.' },
  { id: 'heavy_roller', tier: ENEMY_TIER.mob, name: 'Heavy Roller', hp: 1, movement: 'slow_walk', speed: 'very_slow', drop: 'ability_stone', points: 300, implemented: false, notes: 'Acts like a moving block.' },
  { id: 'wall_clinger', tier: ENEMY_TIER.mob, name: 'Wall Clinger', hp: 1, movement: 'wall_crawl_drop', speed: 'slow', drop: 'ability_needle', points: 350, implemented: false, notes: 'Paddle-stick ability.' },
  { id: 'block_shifter', tier: ENEMY_TIER.mob, name: 'Block Shifter', hp: 1, movement: 'shift_increments', speed: 'slow', drop: 'item_flip', points: 250, implemented: false, notes: 'Tougher moving block.' },
  { id: 'bomb_carrier', tier: ENEMY_TIER.mob, name: 'Bomb Carrier', hp: 1, movement: 'slow_straight', speed: 'slow', drop: 'item_crash', points: 400, implemented: false, notes: 'Clears indestructible blocks.' },
  { id: 'sweeper', tier: ENEMY_TIER.mob, name: 'Sweeper', hp: 1, movement: 'sweep_bob', speed: 'medium', drop: 'food_basic', points: 150, implemented: false, notes: 'Highly predictable.' },
  { id: 'quick_bird', tier: ENEMY_TIER.mob, name: 'Quick Bird', hp: 1, movement: 'fast_burst', speed: 'fast', drop: 'food', points: 250, implemented: false, notes: 'Fast aerial points.' },
  { id: 'drifter', tier: ENEMY_TIER.mob, name: 'Drifter', hp: 1, movement: 'erratic_float', speed: 'slow', drop: null, points: 500, implemented: true, model3d: true, notes: 'Unpredictable wildcard — shell floater.' },
  { id: 'saucer', tier: ENEMY_TIER.mob, name: 'Saucer', hp: 1, movement: 'fast_horizontal_random', speed: 'medium_fast', drop: null, points: 400, implemented: true, model3d: true, notes: 'Tricky high-skill target — fast random horizontal dashes.' },
  { id: 'popper', tier: ENEMY_TIER.mob, name: 'Popper', hp: 1, movement: 'pop_dash', speed: 'medium', drop: 'replica_multiball', points: 600, implemented: false, notes: 'Multi-ball dropper.' },
  { id: 'roller', tier: ENEMY_TIER.mob, name: 'Roller', hp: 1, movement: 'fast_horizontal', speed: 'fast', drop: null, points: 300, implemented: false, notes: 'High-speed moving target.' },
  { id: 'wall_clinger_static', tier: ENEMY_TIER.mob, name: 'Wall Clinger (Static)', hp: 1, movement: 'stationary', speed: 'stationary', drop: 'food', points: 150, implemented: false, notes: 'Easy stationary target.' },
  { id: 'aggro_floater', tier: ENEMY_TIER.mob, name: 'Aggro Floater', hp: 1, movement: 'float_chase', speed: 'slow', drop: 'item_crash', points: 400, implemented: false, notes: 'Brief chase if ignored.' },
  { id: 'high_jumper', tier: ENEMY_TIER.mob, name: 'High Jumper', hp: 1, movement: 'parabolic_jump', speed: 'medium', drop: 'item_crash', points: 350, implemented: false, notes: 'Dynamic jump arcs.' },
  { id: 'big_shield', tier: ENEMY_TIER.midBoss, name: 'Big Shield', hp: 4, movement: 'slow_drift', speed: 'slow', drop: null, points: 5000, implemented: false, notes: 'Guards spikes for boss round.' },
  { id: 'big_jelly', tier: ENEMY_TIER.midBoss, name: 'Big Jelly', hp: 4, movement: 'float_pulse', speed: 'slow', drop: null, points: 5000, implemented: false, notes: 'Mid-boss variant.' },
  { id: 'big_stone_head', tier: ENEMY_TIER.midBoss, name: 'Big Stone Head', hp: 4, movement: 'slow_rotate', speed: 'very_slow', drop: null, points: 5000, implemented: false, notes: '—' },
  { id: 'big_bomber', tier: ENEMY_TIER.midBoss, name: 'Big Bomber', hp: 4, movement: 'slow_jump', speed: 'slow', drop: null, points: 5000, implemented: false, notes: '—' },
  { id: 'twin_lights', tier: ENEMY_TIER.midBoss, name: 'Twin Lights', hp: 4, movement: 'coordinated_pair', speed: 'medium', drop: null, points: 5000, implemented: false, notes: 'Dual-target fight.' },
  { id: 'big_variant', tier: ENEMY_TIER.midBoss, name: 'Big Variant', hp: 4, movement: 'slow_stationary', speed: 'slow', drop: null, points: 5000, implemented: false, notes: 'One per stage.' },
  { id: 'giant_shield', tier: ENEMY_TIER.boss, name: 'Giant Shield', hp: 12, movement: 'side_shields', speed: 'medium', drop: null, points: 12000, implemented: false, notes: 'Multi-phase boss.' },
  { id: 'giant_jelly', tier: ENEMY_TIER.boss, name: 'Giant Jelly', hp: 12, movement: 'bounce_expand', speed: 'medium', drop: null, points: 12000, implemented: false, notes: '—' },
  { id: 'giant_stone_head', tier: ENEMY_TIER.boss, name: 'Giant Stone Head', hp: 14, movement: 'roll_teleport', speed: 'medium', drop: null, points: 14000, implemented: false, notes: 'Falling hazards.' },
  { id: 'clown_bomber', tier: ENEMY_TIER.boss, name: 'Clown Bomber', hp: 12, movement: 'bomb_jump', speed: 'medium', drop: null, points: 12000, implemented: false, notes: '—' },
  { id: 'dual_orbiters', tier: ENEMY_TIER.boss, name: 'Dual Orbiters', hp: 13, movement: 'coordinated_lights', speed: 'medium', drop: null, points: 13000, implemented: false, notes: '—' },
  { id: 'frost_giant', tier: ENEMY_TIER.boss, name: 'Frost Giant', hp: 12, movement: 'slide_freeze', speed: 'slow', drop: null, points: 12000, implemented: false, notes: '—' },
  { id: 'storm_cloud', tier: ENEMY_TIER.boss, name: 'Storm Cloud', hp: 15, movement: 'fly_lightning', speed: 'fast', drop: null, points: 15000, implemented: false, notes: '—' },
  { id: 'tree_guardian', tier: ENEMY_TIER.boss, name: 'Tree Guardian', hp: 12, movement: 'move_drop', speed: 'slow', drop: null, points: 12000, implemented: false, notes: '—' },
  { id: 'cannon_blimp', tier: ENEMY_TIER.boss, name: 'Cannon Blimp', hp: 14, movement: 'strafe_shoot', speed: 'medium', drop: null, points: 14000, implemented: false, notes: '—' },
  { id: 'mech_tank', tier: ENEMY_TIER.boss, name: 'Mech Tank', hp: 16, movement: 'roll_missiles', speed: 'slow', drop: null, points: 16000, implemented: false, notes: '—' },
  { id: 'final_emperor', tier: ENEMY_TIER.boss, name: 'Final Emperor', hp: 25, movement: 'multi_phase', speed: 'varies', drop: null, points: 25000, implemented: false, notes: 'True final boss.' },
];

function getEnemyFootprint(typeId) {
  const entry = ENEMY_COMPENDIUM.find((e) => e.id === typeId);
  if (entry?.footprint) return entry.footprint;
  const tier = entry?.tier ?? ENEMY_TIER.mob;
  if (tier === ENEMY_TIER.midBoss) return MID_BOSS_FOOTPRINT;
  if (tier === ENEMY_TIER.boss) return BOSS_FOOTPRINT;
  return MOB_FOOTPRINT;
}

function enemyCoversCell(enemy, col, row) {
  const { colSpan, rowSpan } = getEnemyFootprint(enemy.type);
  return (
    col >= enemy.col &&
    col < enemy.col + colSpan &&
    row >= enemy.row &&
    row < enemy.row + rowSpan
  );
}

/** Runtime stats used by Phaser demo */
const ENEMY_TYPES = {};
ENEMY_COMPENDIUM.forEach((entry) => {
  const foot = entry.footprint
    ?? (entry.tier === ENEMY_TIER.midBoss
      ? MID_BOSS_FOOTPRINT
      : entry.tier === ENEMY_TIER.boss
        ? BOSS_FOOTPRINT
        : MOB_FOOTPRINT);
  const isSmallMob = foot.colSpan === 1 && foot.rowSpan === 1;
  ENEMY_TYPES[entry.id] = {
    id: entry.id,
    tier: entry.tier,
    hp: entry.hp,
    maxHp: entry.hp,
    points: entry.points,
    movement: entry.movement,
    speed: entry.speed,
    drop: entry.drop,
    damagePerHit: 1,
    powerDamage: 2,
    colSpan: foot.colSpan,
    rowSpan: foot.rowSpan,
    radius: isSmallMob ? 8 : entry.tier === ENEMY_TIER.mob ? 14 : entry.tier === ENEMY_TIER.midBoss ? 22 : 32,
    texture: entry.model3d ? `enemy_${entry.id}` : (entry.tier === ENEMY_TIER.mob ? 'enemy' : 'enemy'),
    model3d: Boolean(entry.model3d),
    implemented: entry.implemented,
  };
});

function getEnemyDef(typeId) {
  return ENEMY_TYPES[typeId] || ENEMY_TYPES.drifter;
}

function getCompendiumEnemy(typeId) {
  return ENEMY_COMPENDIUM.find((e) => e.id === typeId);
}

function resolveEnemyHit(typeId, isPowered) {
  const def = getEnemyDef(typeId);
  const damage = isPowered ? def.powerDamage : def.damagePerHit;
  return { damage, pointsOnKill: def.points, drop: def.drop };
}

if (typeof globalThis !== 'undefined') {
  globalThis.ENEMY_TIER = ENEMY_TIER;
  globalThis.getEnemyDef = getEnemyDef;
  globalThis.getEnemyFootprint = getEnemyFootprint;
  globalThis.enemyCoversCell = enemyCoversCell;
  globalThis.getCompendiumEnemy = getCompendiumEnemy;
  globalThis.resolveEnemyHit = resolveEnemyHit;
}
