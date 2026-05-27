/**
 * Demo level — HUD strip above playfield; play grid fills canvas below HUD.
 */

const DEMO_LEVEL_01 = {
  version: 1,
  id: 'demo-01',
  name: 'Demo Pyramid',

  hud: {
    height: 72,
    padX: 12,
    padY: 8,
    originX: 8,
    originY: 8,
  },
  hudGap: 8,

  /** Zone layout: left score | right lives + state portrait */
  hudLayout: {
    left: ['score'],
    right: ['lives', 'avatar'],
    gaps: { livesToAvatar: 10 },
    avatar: {
      size: 44,
      /** Optional: map state id → texture key (after preload). See hud-avatar.js */
      // states: { power: 'my_power_portrait', default: 'my_idle_portrait' },
    },
  },

  grid: {
    cols: 10,
    cellHeight: 36,
    originX: 8,
    fillBelowHud: true,
  },

  blocks: {
    cells: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 2, 2, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 3, 1, 1, 3, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 4, 4, 4, 4, 4, 4, 4, 4, 0],
    ],
  },

  enemies: [
    { col: 2, row: 9, type: 'drifter' },
    { col: 5, row: 8, type: 'drifter' },
    { col: 7, row: 9, type: 'drifter' },
    { col: 5, row: 10, type: 'drifter' },
  ],

  paddle: { col: 4, colSpan: 2, rowFromBottom: 2 },

  meta: {
    lives: 3,
    description: 'Pyramid stack with gray armor, power gatekeepers, and spike floor.',
  },
};

/** Dynamic loader (registry.js) reads `window`; `const` does not set that. */
window.DEMO_LEVEL_01 = DEMO_LEVEL_01;
