# Block Compendium — Generic Bouncy Ball Breakout

Blocks are the main targets you destroy to clear each round. Each type has its own durability, scoring, and rules for **Normal Bounce** vs **Power Bounce** (timed release before paddle contact).

**Demo implementation today:** `normal`, `gray`, `power`, `spike`, `indestructible` (see `block-types.js`).

---

## Block art (demo)

Sprites are keyed in Phaser as `block_<type>` (see `BLOCK_TYPES` in [`block-types.js`](block-types.js)). PNGs are preloaded in `GameScene.preload()`; anything not loaded is drawn procedurally in `generateTextures()` when the level starts.

| Type | Texture key | Asset / source | Sizing |
|------|-------------|----------------|--------|
| **Normal** | `block_normal` | [`assets/blocks/normal.png`](assets/blocks/normal.png) — pale blue-grey molded clay (RGBA, black background removed) | `contain` — fits inside cell without stretch |
| **Spike** | `block_spike` | [`assets/blocks/spike.png`](assets/blocks/spike.png) — hazard art (RGBA) | `contain` |
| **Gray** | `block_gray` | Procedural — dark grey rounded rect + score band | Fills cell |
| **Power** | `block_power` | Procedural — dark grey block + yellow glow stroke | Fills cell |
| **Indestructible** | `block_indestructible` | Procedural — steel grey + **X** mark | Fills cell |

**Pipeline for PNG blocks:** run [`scripts/process-ball-sprite.py`](scripts/process-ball-sprite.py) on new art (edge flood-fill removes black, crops to content). Example:

```bash
python3 scripts/process-ball-sprite.py assets/blocks/normal.png
```

**Spike fallback:** if `block_spike` is missing at runtime, the demo generates a red triple-triangle hazard texture per cell size.

**Destroy VFX:** normal blocks use clay-chunk particles (`clay_debris` atlas); tint keyed in `CLAY_DEBRIS_TINT` in [`block-ball-demo.html`](block-ball-demo.html).

**Level editor:** [`level-editor.html`](level-editor.html) + [`editor-entity-art.js`](editor-entity-art.js) — image pickers for every block and enemy. PNGs under `assets/blocks/` and `assets/enemies/<id>.png`; missing art uses procedural previews (implemented types) or **?** placeholders (tier-colored).

---

## Core block types

| Block type | Appearance | Base points | Normal bounce | Power bounce | Notes |
|------------|------------|-------------|---------------|--------------|-------|
| **Normal** | Blue-grey clay cube sprite (`normal.png`) | 100 | 1 hit, destroyed | 1 hit, destroyed (+ bonus) | Level filler; downgraded Gray blocks use this texture |
| **Gray** | Dark gray procedural rectangle | 200 | **Damaged → becomes Normal** (2 hits total) | 1 hit, destroyed | Use Power Bounce for efficiency |
| **Power** | Dark gray procedural block + glow | 500 | **Immune** (no damage) | 1 hit, destroyed | Gatekeeper; protects clusters behind it |
| **Spike** | Spike sprite (`spike.png`) or red triangle fallback | 0 | **Hazard** (lose life) | Safe bounce while powered | Floor hazard; indestructible |
| **Splitting** | Large white or gray | 200 / 50–100 pieces | Splits into 4 smaller blocks | Splits or destroys | Large pieces behave like normal/gray when small |
| **Ability** | Special pattern | Varies | Weak / no effect | Stronger | Often needs active Copy Ability to break |
| **Indestructible** | Metallic, X mark | 0 | **Immune** (bounces) | **Immune** | Walls; not cleared for level win |
| **Score / Bonus** | Numbered / flashing | Escalating | Points per hit | Higher | Up to ~7 hits; max hits + ability → 1-Ups |
| **Star / Switch** | Star mark | Varies | Collect / destroy | Same | Collect all → Bonus Chance (Through blocks) |
| **Through** | Semi-transparent | Per pass | Ball passes through | Same | Bonus Chance only; no bounce |
| **Pinball / Bumper** | Round bumper | Small per hit | Bounce + speed | Same | Indestructible; repeated small points |

---

## Normal vs Power bounce

### Normal bounce (automatic paddle hit)

- Standard speed and angle
- Destroys **Normal** blocks in one hit
- **Gray:** first hit converts to Normal (second hit destroys)
- **Power:** immune
- **Spike:** costs a life (not destroyed)
- **Indestructible:** immune; ball bounces off (same as Power for damage, but never destroyed)

### Power bounce (release timing before contact)

- Higher launch speed and destructive force
- **Required** for Power blocks
- One-shots **Gray** blocks
- Often **+50% score** (or more) while ball is powered
- **Spike blocks:** safe bounce while powered; otherwise costs a life (demo)
- **Indestructible:** always immune; does not count toward blocks remaining for level clear

---

## Cross-system interactions

| System | Effect on blocks |
|--------|------------------|
| **Copy abilities** | Some blocks only break with active ability; line clears (Flame up, Stone down, etc.) |
| **Flip item** | Recolors blocks; colored whites often worth double |
| **Bonus Chance** | All required blocks → Through blocks; ball scores on pass-through, time bonus for fast clear |

---

## Level design role

- **Early:** mostly Normal + a few Gray
- **Mid–late:** Power, Splitting, Indestructible puzzles
- **Power blocks** as walls in front of clusters — open paths with aimed Power Bounces
- High scores need angles + Power timing + ability planning

---

## Scoring tips

- Power Bounce hits: +50% or more on many block types (demo: 1.5× while powered)
- Fast full clears (especially Bonus Chance) → large time bonuses
- Save tough blocks for abilities or Power Bounces
- Pinball blocks: infinite small hits if you want to farm (usually low value)

---

## Demo level encoding (`LEVEL_LAYOUT`)

| Cell | Type |
|------|------|
| `0` | Empty |
| `1` | Normal |
| `2` | Gray |
| `3` | Power |
| `4` | Spike |
| `5` | Indestructible |

String keys: `.` empty, `1` normal, `g` gray, `p` power, `s` spike, `i` indestructible.

Spike blocks use cell value `4` in `blocks.cells` (full play grid). Legacy `blocks.spikes` is migrated at load.

---

## Source of truth in code

- Registry & helpers: [`block-types.js`](block-types.js)
- Block PNGs: [`assets/blocks/`](assets/blocks/)
- Texture preload + procedural fallbacks: `preload()` / `generateTextures()` in [`block-ball-demo.html`](block-ball-demo.html)
- Enemies (HP, movement, drops): [`ENEMY_COMPENDIUM.md`](ENEMY_COMPENDIUM.md) · [`enemy-types.js`](enemy-types.js)
