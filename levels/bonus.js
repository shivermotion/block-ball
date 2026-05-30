/**
 * bonus chance
 */

const LEVEL_BONUS = {
  "version": 1,
  "id": "bonus",
  "name": "bonus chance",
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
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        1,
        1,
        1,
        16,
        0,
        0,
        16,
        1,
        1,
        1
      ],
      [
        1,
        1,
        1,
        17,
        0,
        0,
        17,
        1,
        1,
        1
      ],
      [
        1,
        1,
        1,
        16,
        0,
        0,
        16,
        1,
        1,
        1
      ],
      [
        1,
        1,
        1,
        17,
        0,
        0,
        17,
        1,
        1,
        1
      ],
      [
        1,
        1,
        1,
        16,
        0,
        0,
        16,
        1,
        1,
        1
      ],
      [
        1,
        1,
        1,
        17,
        0,
        0,
        17,
        1,
        1,
        1
      ],
      [
        14,
        15,
        14,
        15,
        0,
        0,
        14,
        15,
        14,
        15
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
      ]
    ]
  },
  "enemies": [],
  "items": [
    {
      "col": 4,
      "row": 7,
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
    "description": "bonus chance"
  }
};

/** Dynamic loader (registry.js) reads `window`; `const` does not set that. */
window.LEVEL_BONUS = LEVEL_BONUS;
