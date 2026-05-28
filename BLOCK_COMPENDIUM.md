# Block Compendium — Generic Bouncy Ball Breakout

Reference for every block type: durability, scoring, and how each block responds to **Normal Bounce** vs **Power Bounce** hits.

**Demo implementation today:** `normal`, `gray`, `normal_long_h` / `normal_long_v`, `gray_long_h` / `gray_long_v`, `power`, `power_long_h` / `power_long_v`, `spike`, `indestructible` (see [`block-types.js`](block-types.js)). Long variants span **2×1** or **1×2** cells with the same rules and art as their base type. All other types below are design targets for future levels.

---

## Regular / core blocks

| Generic name | HP / durability | Points (base) | Normal bounce | Power bounce | Purpose |
|--------------|-----------------|---------------|---------------|--------------|---------|
| **Normal** (white) | 1 | 100 (rectangles) / 50 (squares) | Destroyed in 1 hit | Destroyed in 1 hit (often bonus) | Basic filler; primary destroyable blocks. Colored variants often double points. |
| **Normal long** (↔ / ↕) | 1 | 100 | Same as Normal | Same as Normal | **2×1** or **1×2** footprint; grid values `6`/`7` or `8`/`9` ([`LEVEL_GRID.md`](LEVEL_GRID.md)). |
| **Gray** | 2 | 200 | Becomes Normal (needs 2nd hit) | Destroyed in 1 hit | Introduces toughness; Power Bounce is efficient for score and speed. |
| **Gray long** (↔ / ↕) | 2 | 200 | Becomes Normal long | Destroyed in 1 hit | Same as Gray across two cells; grid `10`/`11` or `12`/`13`. |
| **Power** | 1 | 500 | No effect (immune) — god-ray sweep + squash | Destroyed in 1 hit | Gatekeeper; requires Power Bounce. Often shields clusters or forces puzzle paths. |
| **Splitting** | 1 (large) | 200 (white large) / 400 (gray large); pieces 50–100 | Splits into 4 smaller blocks | Can destroy completely or split | Raises block count, chaos, and scoring chances. |
| **Ability** | 1 | 300 (small) / 500 (wide) | Usually no effect or minimal damage | Stronger hit, often still not enough alone | Typically needs special destruction rules beyond a normal Power Bounce. |
| **Indestructible** | ∞ | 0 | No effect | No effect | Cannot be broken by bounce alone; used for permanent walls and mazes. |
| **Spike** *(demo hazard)* | ∞ | 0 | Hazard on contact | Safe bounce while powered | Demo-only hazard tile (`block_spike`); not destroyed by hits. |

---

## Special / bonus blocks

| Generic name | HP / durability | Points (base) | Normal bounce | Power bounce | Purpose |
|--------------|-----------------|---------------|---------------|--------------|---------|
| **Star / Protective Star** | 1 | **0** | Destroyed / collected | Same | Shields spike gutters later — see [Star blocks](#star--protective-star-block) below. |
| **Switch / Bonus Trigger** | 1 | Varies (usually low) | Destroyed / collected | Same | **Bonus Chance** — collect all; remaining blocks become **Through** blocks. |
| **Through** | 1 | 40–160 (size-dependent) | Ball passes through (no ricochet) | Same | Appears when Switch blocks trigger Bonus Chance; no bounce. |
| **Score / Bonus** | Up to 7 hits | 50 → 100 → 200 → 400 → 800 → 1600 → 3200 | Points rise per hit | Even higher | Optional high-score target; extra reward on final hit in some rulesets. May start invisible. |
| **Pinball / Bumper** | ∞ | 20 per hit | Bounce + extra speed/force | Same | Indestructible accelerator; pinball chaos and reach for distant cells. |

---

## Star / Protective Star Block

Star blocks are **not** scoring blocks and **not** the same as Switch blocks. They exist to **shield spike gutters** in a later area of the same stage.

| Property | Details |
|----------|---------|
| HP | 1 (one hit to collect) |
| Points | **0** — no points for hitting them |
| Look | Small rectangle with a **star** symbol |
| Placement | Often grouped in a target area **before** a spike-heavy zone |

### Link to spike blocks

1. Each collected Star Block places a **protective cover** over one **Spike** gutter in the next zone.
2. More stars collected → more spike sections remain covered (full collection can cover nearly all gutters).
3. Collecting **all** Star Blocks in the group sometimes triggers a separate stage bonus (implementation-specific).

### Covers vs spikes

- A cover sits on top of a spike gutter the player “earned” by collecting stars.
- When the ball hits a cover, the cover is **removed** and the **Spike** block underneath is active again.

### Star vs Switch vs Score (easy to confuse)

| Block | Main purpose |
|-------|----------------|
| **Star / Protective Star** | Boss spike protection; **0 points** |
| **Switch / Bonus Trigger** | Triggers **Bonus Chance** (Through blocks) |
| **Score / Bonus** | Escalating points over up to 7 hits |

---

## Switch / Bonus Trigger Block

- Collect **all** Switch blocks in a round to start **Bonus Chance**.
- Remaining blocks turn into **Through** blocks.
- Distinct from Star blocks: Switch blocks trigger **Through** transformation, not spike covers.

---

## Normal vs Power bounce

### Normal bounce

- **Normal:** destroyed in one hit
- **Gray:** first hit → becomes Normal; second hit destroys
- **Power:** immune
- **Star / Switch:** collected or destroyed instantly (when implemented)
- **Spike** *(demo):* hazard on contact; not destroyed
- **Indestructible:** immune; ball bounces

### Power bounce

- **Required** for Power blocks
- One-shots **Gray** blocks
- Often higher score multiplier on destroyable blocks (demo: 1.5×)
- **Spike** *(demo):* safe to bounce off while powered; hazard otherwise
- **Indestructible:** always immune; never removed by bounce

---

## Block interactions

| Interaction | Effect |
|-------------|--------|
| **Gray → Normal** | First normal bounce downgrades Gray to Normal; second hit destroys |
| **Power Bounce** | Required to destroy Power blocks; one-shots Gray |
| **Switch → Through** | All Switch blocks collected → remaining blocks become Through blocks (Bonus Chance) |
| **Star → spike cover** | Each Star collected adds a protective cover over one Spike gutter in the next zone |
| **Splitting** | Large block splits into four smaller Normal/Gray pieces |
| **Required vs optional** | Normal, Gray, Power, Splitting usually required to clear; Star, Score, Pinball often optional |

---

## Block art (demo)

Sprites are keyed in Phaser as `block_<type>` (see `BLOCK_TYPES` in [`block-types.js`](block-types.js)). PNGs are preloaded in `GameScene.preload()`; anything not loaded is drawn procedurally in `generateTextures()` when the level starts.

| Type | Texture key | Asset / source | Sizing |
|------|-------------|----------------|--------|
| **Normal** | `block_normal` | [`assets/blocks/normal.png`](assets/blocks/normal.png) — creamy block with hex cutout (RGBA) | `contain` |
| **Gray** | `block_gray` | [`assets/blocks/gray.png`](assets/blocks/gray.png) — pale blue-grey stone cube (RGBA) | `contain` |
| **Spike** | `block_spike` | [`assets/blocks/spike.png`](assets/blocks/spike.png) — grey weathered stone triangle (RGBA) | `contain` |
| **Power** | `block_power` | [`assets/blocks/power.png`](assets/blocks/power.png) — rotated 90°, stretched to cell | Fills cell |
| **Power long ↔** | `block_power_long_h` | Same PNG, baked 2×1 | Fills footprint |
| **Power long ↕** | `block_power_long_v` | Same PNG, baked 1×2 (portrait) | Fills footprint |
| **Indestructible** | `block_indestructible` | Procedural — steel grey + **X** | Fills cell |

**Pipeline for PNG blocks:** [`scripts/process-ball-sprite.py`](scripts/process-ball-sprite.py) (edge flood-fill removes black, crops to content). **Power** uses a dedicated pass: shadow lift + outer-ring background strip only (the art is mostly black crystal, so standard flood-fill would erase the block).

**Destroy VFX:** clay-chunk particles (`clay_debris` atlas); tint sampled from the destroyed block’s texture (see `getBlockDebrisTint` in [`block-ball-demo.html`](block-ball-demo.html)).

**Level editor:** block brush uses the same sprites (`level-editor.html`, `editor-entity-art.js`).

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
| `6` + `7` | Normal long ↔ |
| `8` + `9` | Normal long ↕ |
| `10` + `11` | Gray long ↔ |
| `12` + `13` | Gray long ↕ |
| `14` + `15` | Power long ↔ |
| `16` + `17` | Power long ↕ |

String keys: `.` empty, `1` normal, `g` gray, `p` power, `s` spike, `i` indestructible.

Spike blocks use cell value `4` in `blocks.cells`. Legacy `blocks.spikes` is migrated at load.

Future types (star, switch, through, score, pinball, splitting, ability) will need new cell values when implemented.

---

## Source of truth in code

- Registry & helpers: [`block-types.js`](block-types.js)
- Block PNGs: [`assets/blocks/`](assets/blocks/)
- Texture preload, procedural fallbacks, destroy VFX: [`block-ball-demo.html`](block-ball-demo.html)
- Items (Flip, Crash, food, abilities): [`ITEM_COMPENDIUM.md`](ITEM_COMPENDIUM.md) · [`item-types.js`](item-types.js)
