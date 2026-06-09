/**
 * pinball-bumper-test — Pinball / Bumper blocks (cell 34 anchor, 2×2).
 */

const LEVEL_PINBALL_BUMPER_TEST = {
  version: 1,
  id: 'pinball-bumper-test',
  name: 'pinball-bumper-test',
  hud: {
    height: 72,
    padX: 12,
    padY: 8,
    originX: 8,
    originY: 8,
  },
  hudLayout: {
    left: ['score'],
    right: ['lives', 'avatar'],
    gaps: { livesToAvatar: 10 },
    avatar: { size: 44 },
  },
  hudGap: 8,
  grid: {
    cols: 10,
    cellHeight: 36,
    originX: 8,
    fillBelowHud: true,
  },
  blocks: {
    cells: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 34, 35, 0, 0, 0, 0, 0],
      [0, 0, 0, 36, 37, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 34, 35, 0, 0, 0],
      [0, 0, 0, 0, 0, 36, 37, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 0, 0, 0, 0, 0, 5, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  enemies: [],
  items: [],
  paddle: { col: 4, colSpan: 2, rowFromBottom: 2 },
  meta: {
    lives: 3,
    description: 'Pinball bumper blocks — +20 per hit, speed boost, indestructible',
  },
};

window.LEVEL_PINBALL_BUMPER_TEST = LEVEL_PINBALL_BUMPER_TEST;
