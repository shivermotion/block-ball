/**
 * Block Ball — item compendium & type registry (drops, power-ups, copy abilities).
 */
/* global Phaser */

const ITEM_ART_VERSION = '1';

const ITEM_CATEGORY = {
  food: 'food',
  powerUp: 'powerUp',
  copyAbility: 'copyAbility',
  life: 'life',
};

const ITEM_COMPENDIUM = [
  {
    id: 'food_apple',
    name: 'Apple',
    category: ITEM_CATEGORY.food,
    points: 1000,
    image: 'assets/items/food_apple.png',
    implemented: false,
    notes: 'Most common food; most regular enemies.',
  },
  {
    id: 'food_candy',
    name: 'Candy',
    category: ITEM_CATEGORY.food,
    points: 1500,
    implemented: false,
    notes: 'Medium-value food.',
  },
  {
    id: 'food_cake',
    name: 'Cake',
    category: ITEM_CATEGORY.food,
    points: 2000,
    implemented: false,
    notes: 'Highest regular food value.',
  },
  {
    id: 'food_big_cake',
    name: 'Big Cake',
    category: ITEM_CATEGORY.food,
    points: 5000,
    implemented: false,
    notes: 'Rare / mid-boss drops; 5000+ in classic.',
  },
  {
    id: 'replica_multiball',
    name: 'Replica',
    category: ITEM_CATEGORY.powerUp,
    effect: 'split_ball_two',
    duration: 'until_lost',
    dropFrom: ['popper'],
    implemented: false,
    notes: 'Extra balls may become 1-Ups at round end.',
  },
  {
    id: 'item_crash',
    name: 'Crash',
    category: ITEM_CATEGORY.powerUp,
    effect: 'destroy_all_indestructible',
    duration: 'instant',
    dropFrom: ['bomb_carrier', 'aggro_floater', 'high_jumper'],
    implemented: false,
    notes: 'Clears indestructible blocks on screen.',
  },
  {
    id: 'item_flip',
    name: 'Flip',
    category: ITEM_CATEGORY.powerUp,
    effect: 'recolor_blocks_double_points',
    duration: 'round',
    dropFrom: ['block_shifter'],
    implemented: false,
    notes: 'Colored normals often worth double.',
  },
  {
    id: 'item_changer',
    name: 'Changer',
    category: ITEM_CATEGORY.powerUp,
    effect: 'random_copy_ability',
    duration: 'until_replaced',
    dropFrom: ['pinball_bouncer'],
    implemented: false,
    notes: 'Roulette for a new Copy Ability.',
  },
  {
    id: 'warp_star',
    name: 'Warp Star',
    category: ITEM_CATEGORY.powerUp,
    effect: 'bonus_minigame',
    duration: 'instant',
    image: 'assets/items/warp_star.png',
    colSpan: 2,
    rowSpan: 3,
    implemented: false,
    notes: 'Rare spawn; bonus lives and points. Occupies 2×3 cells (anchor = top-left).',
  },
  {
    id: 'ability_spark',
    name: 'Spark',
    category: ITEM_CATEGORY.copyAbility,
    effect: 'electric_path_clear',
    dropFrom: ['spark_blaster'],
    implemented: false,
    notes: 'Destroys blocks along path.',
  },
  {
    id: 'ability_burn',
    name: 'Burn',
    category: ITEM_CATEGORY.copyAbility,
    effect: 'upward_fire_clear',
    dropFrom: ['flame_riser'],
    implemented: false,
    notes: 'Vertical burn line.',
  },
  {
    id: 'ability_stone',
    name: 'Stone',
    category: ITEM_CATEGORY.copyAbility,
    effect: 'downward_crush',
    dropFrom: ['heavy_roller'],
    implemented: false,
    notes: 'Straight-down crush.',
  },
  {
    id: 'ability_needle',
    name: 'Needle',
    category: ITEM_CATEGORY.copyAbility,
    effect: 'paddle_stick_reaim',
    dropFrom: ['wall_clinger'],
    implemented: false,
    notes: 'Stick to paddle for aim.',
  },
  {
    id: 'one_up',
    name: '1-Up',
    category: ITEM_CATEGORY.life,
    effect: 'extra_life',
    implemented: false,
    notes: 'Rare drop; also from stars/score blocks per stage rules.',
  },
];

const ITEM_TYPES = {};
ITEM_COMPENDIUM.forEach((entry) => {
  ITEM_TYPES[entry.id] = entry;
});

function getItemDef(itemId) {
  return ITEM_TYPES[itemId] || null;
}

/** Points when the item is collected / cleared (0 = no floating score). */
function getItemPoints(itemId) {
  const p = getItemDef(itemId)?.points;
  return typeof p === 'number' && p > 0 ? p : 0;
}

function getCompendiumItem(itemId) {
  return ITEM_COMPENDIUM.find((i) => i.id === itemId);
}

/** Relative asset path for preload (`?v=ITEM_ART_VERSION`), or null if no art yet. */
function getItemImagePath(itemId) {
  return getItemDef(itemId)?.image ?? null;
}

/** Phaser texture key for level-placed items. */
function getItemTextureKey(itemId) {
  return `item_${itemId}`;
}

/** Grid footprint for a placed item (`col`/`row` = top-left anchor). */
function getItemFootprint(itemId) {
  const def = getItemDef(itemId);
  return {
    colSpan: def?.colSpan ?? 1,
    rowSpan: def?.rowSpan ?? 1,
  };
}

function itemCoversCell(item, col, row) {
  const { colSpan, rowSpan } = getItemFootprint(item.type);
  return col >= item.col && col < item.col + colSpan && row >= item.row && row < item.row + rowSpan;
}
