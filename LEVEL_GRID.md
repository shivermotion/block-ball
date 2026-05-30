# Level grid & template format

Every **placeable entity** uses the same grid cell size on the **playfield**. The **HUD** is a separate strip above play — laid out with zones, not play cells.

## HUD strip (`level.hud`)

Fixed container above gameplay — not part of the play grid.

| Field | Default | Meaning |
|-------|---------|---------|
| `height` | *(or `rows × cellHeight`)* | HUD strip height (px). Prefer `height: 72` over row/cell grid. |
| `padX` / `padY` | 12 / 8 | Inner padding for layout |
| `originX` / `originY` | 8 / 8 | HUD top-left (snapped to game frame when playing) |
| `rows`, `cols`, `cellHeight` | legacy | Used only if `height` is omitted |

`hudGap` (default `8`) — pixels between HUD bottom and play grid top.

### HUD layout (`level.hudLayout`)

Zone-based — **not** play-grid cells.

```js
hudLayout: {
  left: ['score'],
  right: ['lives', 'avatar'],
  gaps: { livesToAvatar: 10 },
  avatar: { size: 44 },
}
```

| Zone | Widgets |
|------|---------|
| `left` | `score` |
| `right` | `lives` (icons), then `avatar` (state portrait on the edge) |

**Avatar states** (`hud-avatar.js`): portrait swaps automatically from gameplay.

| State id | When |
|----------|------|
| `default` | Normal play |
| `hurt` | 1 life left |
| `charging` | Paddle charge animation |
| `armed` | Power bounce queued (released, waiting for hit) |
| `cooling` | Power ball cooldown |
| `power` | Active power ball |
| `level_clear` | Level cleared |
| `game_over` | Out of lives |

Default textures: `hud_avatar_default`, `hud_avatar_power`, etc. (procedural placeholders).

Override with real art in the level:

```js
avatar: {
  size: 44,
  states: {
    default: 'portrait_idle',
    power: 'portrait_power',
  },
}
```

Load textures in a Boot scene or `preload`, then register keys before play.

Legacy `level.ui` (cell-based HUD) is no longer used.

## Playfield grid (`level.grid`)

| Field | Default | Meaning |
|-------|---------|---------|
| `cols` | 10 | Columns |
| `rows` | *(auto)* | Fills canvas below HUD when omitted (`fillBelowHud`) |
| `cellWidth` / `cellHeight` | 36 | Base cell size; height may scale slightly to fit |
| `originX` | 8 | Play grid left (aligned with HUD / frame) |
| `originY` | *(auto)* | `hud.bottom + hudGap` |
| `fillBelowHud` | `true` | Play grid fills space below HUD to **game frame** bottom (8px inset) |

Blocks (including **spike** hazards), enemies, and paddle use **only** the playfield grid. The demo paddle is **half a cell tall** (wide `colSpan` cells).

## Level template (`version: 1`)

```js
{
  version: 1,
  hud: { height: 72, padX: 12, padY: 8, originX: 8, originY: 8 },
  hudLayout: { left: ['score'], right: ['lives', 'avatar'], avatar: { size: 44 } },
  hudGap: 8,
  grid: { cols: 10, cellHeight: 36, originX: 8, fillBelowHud: true },
  blocks: { cells: [ /* rows × cols */ ] },
  enemies: [ { col, row, type } ],
  paddle: { col: 4, colSpan: 2, rowFromBottom: 2 },
}
```

### Block cells

| Value | Type |
|-------|------|
| `0` | Empty |
| `1` | Normal |
| `2` | Gray |
| `3` | Power |
| `4` | Spike |
| `5` | Indestructible |
| `6` + `7` | Normal long **horizontal** (2×1; anchor `6` left, `7` right) |
| `8` + `9` | Normal long **vertical** (1×2; anchor `8` top, `9` bottom) |
| `10` + `11` | Gray long **horizontal** (anchor `10`, extension `11`) |
| `12` + `13` | Gray long **vertical** (anchor `12`, extension `13`) |
| `14` + `15` | Power long **horizontal** (2×1; anchor `14` left, `15` right) |
| `16` + `17` | Power long **vertical** (1×2; anchor `16` top, `17` bottom) |
| `18` + `19`–`21` | Score **2×2** (anchor `18` top-left; `19` top-right, `20` bottom-left, `21` bottom-right) |
| `22` | Bonus — pass-through collectible (**100** pts when placed; also created by Bonus Chance item) |

Long blocks and score blocks use one physics body across the footprint. Paint from the **anchor** cell (top-left for ↔ and 2×2, top for ↕).

String keys in row strings (legacy import): `.` `1` `g` `p` `s` `i` `e`. Older levels may use `anchor` + `layer` + `spikes`; they are migrated to `blocks.cells` at load time.

## Files

| File | Role |
|------|------|
| `level-grid.js` | `createHudGrid`, `resolveHudLayout`, play origin, `fitEntityToCell` |
| `hud-avatar.js` | Avatar state → texture; procedural placeholders |
| `levels/demo-level-01.js` | Reference level |
| `levels/manifest.json` | Registered file levels (updated when you **Save** in editor) |
| `levels/registry.js` | Built-in **Blank** + manifest loader |
| `level-editor.html` | Paint play cells; **Save** writes `levels/<id>.js` |
| `block-ball-demo.html` | HUD bar; level select + `?level=id` |
| `scripts/dev-server.mjs` | `yarn start` — static server + `POST /api/levels/save` |

### Saving levels

1. Run **`yarn start`** and open **`/level-editor`** (Save needs the dev server; opening HTML directly won’t write files).
2. Paint your layout, click **Save**, set **id**, **name**, **description**, and **lives**.
3. The server writes **`levels/<id>.js`** and updates **`levels/manifest.json`** — the level appears in the editor and game dropdowns.
4. Renaming the id on save moves the file (old id is removed from manifest).
5. **Delete** removes the selected level’s `.js` file and its manifest entry (not **Blank**).

### Playtesting levels

1. **Play test** from the editor opens the game with your current layout (preview in `localStorage`).
2. Return via the game **Editor** link (`?restore=1`) to restore your draft.
3. Or play a saved level: **`/block-ball-demo?level=my-level`** or the in-game dropdown.

**Campaign vs flat levels:** Individual levels are still one file per level (`levels/<id>.js`). The campaign (`levels/campaign.json`) assigns those level ids to world/stage slots for progression — see [CAMPAIGN.md](CAMPAIGN.md).

## Debug

| URL flag | Effect |
|----------|--------|
| `?debugGrid=1` | Cell grid lines inside HUD + play |
| `?devBorders=0` | Hide GAME / HUD / PLAY dev outlines (on by default) |

Dev border colors: **GAME** yellow (arcade frame, 8px inset), **HUD** cyan, **PLAY** magenta (playfield, inside GAME below HUD).
