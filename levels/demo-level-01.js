/**
 * demo-level-01
 */

const LEVEL_DEMO_LEVEL_01 = {
  "version": 1,
  "id": "demo-level-01",
  "name": "demo-level-01",
  "hud": {
    "height": 72,
    "padX": 12,
    "padY": 8,
    "originX": 8,
    "originY": 8
  },
  "hudLayout": {
    "left": [
      "score"
    ],
    "right": [
      "lives",
      "avatar"
    ],
    "gaps": {
      "livesToAvatar": 10
    },
    "avatar": {
      "size": 44
    }
  },
  "hudGap": 8,
  "grid": {
    "cols": 10,
    "cellHeight": 36,
    "originX": 8,
    "fillBelowHud": true
  },
  "blocks": {
    "cells": [
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        1,
        1,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        1,
        1,
        1,
        1,
        0,
        0,
        0
      ],
      [
        0,
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        0,
        0
      ],
      [
        0,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4,
        4
      ]
    ]
  },
  "enemies": [
    {
      "col": 1,
      "row": 1,
      "type": "drifter"
    },
    {
      "col": 8,
      "row": 1,
      "type": "drifter"
    },
    {
      "col": 4,
      "row": 9,
      "type": "drifter"
    },
    {
      "col": 5,
      "row": 9,
      "type": "drifter"
    }
  ],
  "items": [
    {
      "col": 4,
      "row": 6,
      "type": "item_bonus_chance"
    }
  ],
  "paddle": {
    "col": 4,
    "colSpan": 2,
    "rowFromBottom": 2
  },
  "meta": {
    "lives": 3,
    "description": "demo-level-01"
  }
};

/** Dynamic loader (registry.js) reads `window`; `const` does not set that. */
window.LEVEL_DEMO_LEVEL_01 = LEVEL_DEMO_LEVEL_01;
