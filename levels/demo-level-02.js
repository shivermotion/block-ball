/**
 * demo-level-02
 */

const LEVEL_DEMO_LEVEL_02 = {
  "version": 1,
  "id": "demo-level-02",
  "name": "demo-level-02",
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
        2,
        2,
        2,
        2,
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
        10,
        11,
        10,
        11,
        10,
        11,
        10,
        11,
        0
      ],
      [
        0,
        0,
        0,
        3,
        0,
        0,
        3,
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
        18,
        19,
        0,
        0,
        0,
        0
      ],
      [
        0,
        8,
        8,
        0,
        20,
        21,
        0,
        8,
        8,
        0
      ],
      [
        0,
        9,
        9,
        0,
        0,
        0,
        0,
        9,
        9,
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
    }
  ],
  "items": [],
  "paddle": {
    "col": 4,
    "colSpan": 2,
    "rowFromBottom": 2
  },
  "meta": {
    "lives": 3,
    "description": "demo-level-02"
  }
};

/** Dynamic loader (registry.js) reads `window`; `const` does not set that. */
window.LEVEL_DEMO_LEVEL_02 = LEVEL_DEMO_LEVEL_02;
