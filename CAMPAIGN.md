# Campaign flow

Block Ball supports a **10 worlds × 5 stages** campaign in addition to flat free-play levels.

## Data model

- **Campaign file:** `levels/campaign.json` — fixed shape: 10 worlds, 5 stage slots each.
- **Stage slot:** holds a level id (from `levels/manifest.json`) or `null` (empty / unassigned).
- **Same level id** may appear in multiple slots.
- **Runtime helpers:** `levels/campaign.js` — fetch, normalize, progress, unlock rules, URL builders.

## Authoring

1. Create or edit levels in **Level Editor** (`level-editor.html`).
2. Assign levels to world/stage slots in **Campaign Planner** (`campaign-editor.html`).
3. Save the campaign with **Save** (requires `yarn start` — same dev server as level save).

Drag levels from the library onto stage slots. Drag between slots to move or swap; drop on the library zone to clear a slot.

## Playing

- **Campaign Menu** (`campaign-menu.html`) — pick a world, then a stage.
- **Continue** — resumes the last played stage (stored in `localStorage`).
- **Play URL:**

  ```
  /block-ball-demo?campaign=1&world=world-01&stage=1
  ```

  `stage` is 1-based (1–5). `world` is the world slug (`world-01` … `world-10`).

Free play (no `campaign=1`) uses the level dropdown as before.

## Progress & unlock rules

Progress is stored in `localStorage` under `blockBall.campaignProgress`.

| Rule | Behavior |
|------|----------|
| World 1 | Always unlocked |
| World N+1 | Unlocks when every **assigned** (non-null) stage in World N is completed |
| Stage k | Unlocked when stage k−1 is completed (or k = 1), and its world is unlocked |
| Empty slot | Not playable; ignored for world completion |

On level clear in campaign mode, the stage is marked complete. The overlay offers **Next Stage** (if another assigned stage exists) and **World Map** back to the menu.

## Dev server APIs

| Endpoint | Purpose |
|----------|---------|
| `POST /api/campaign/save` | Write `levels/campaign.json` |
| `GET /api/health` | `{ saveCampaign: true }` when save is available |

Run `yarn start` and open pages at `http://localhost:8080`.
