# Block Compendium — Generic Bouncy Ball Breakout

Reference for every block type: durability, scoring, and how each block responds to **Normal Bounce** vs **Power Bounce** hits.

**Demo implementation today:** `normal`, `gray`, `normal_long_h` / `normal_long_v`, `gray_long_h` / `gray_long_v`, `power`, `power_long_h` / `power_long_v`, `ability`, `ability_long_h` / `ability_long_v`, `spike`, `indestructible`, `score`, `bonus` — see [`block-types.js`](block-types.js).

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
| **Ability** | 1 | 300 (1×1) / **500** (long) | No effect — immune | No effect — immune | **Copy Ability required** to destroy; see [Ability block](#ability-block). |
| **Ability long** (↔ / ↕) | 1 | 500 | Same as Ability | Same as Ability | **2×1** or **1×2** gatekeeper; grid `30`/`31` or `32`/`33`. |
| **Indestructible** | ∞ | 0 | No effect | No effect | Cannot be broken by bounce alone; used for permanent walls and mazes. |
| **Spike** *(demo hazard)* | ∞ | 0 | Hazard on contact | Safe bounce while powered | Demo-only hazard tile (`block_spike`); not destroyed by hits. |

---

## Special / bonus blocks

| Generic name | HP / durability | Points (base) | Normal bounce | Power bounce | Purpose |
|--------------|-----------------|---------------|---------------|--------------|---------|
| **Shield** | 1 | **0** | Destroyed / collected | Same | **Round 4 only** — protective covers for the boss fight; see [Shield block](#shield-block). |
| **Switch / Bonus Trigger** | 1 | Varies (usually low) | Destroyed / collected | Same | **Bonus Chance** — collect all; remaining blocks become **Through** blocks. |
| **Through** | 1 | 40–160 (size-dependent) | Ball passes through (no ricochet) | Same | Appears when Switch blocks trigger Bonus Chance; no bounce. |
| **Score** | Up to 7 hits | 50 → 100 → 200 → 400 → 800 → 1600 → 3200 | Points rise per hit | Even higher | **2×2** optional target — **not required for level clear**; see [Score block](#score-block). |
| **Bonus** | 1 (collect) | 100 (placed) / converted value | Pass-through collect | Same | No collision — see [Bonus block](#bonus-block). |
| **Pinball / Bumper** | ∞ | 20 per hit | Bounce + extra speed/force | Same | Indestructible accelerator; pinball chaos and reach for distant cells. |

---

## Ability Block

Ability blocks are **Copy Ability gatekeepers** — tougher than normal blocks, but unlike Power blocks they do **not** yield to a Power Bounce alone.

| Property | Details |
|----------|---------|
| **Destruction rule** | Destroyed only while the player holds an **active Copy Ability** (from enemy drops or Changer item) |
| **Normal bounce** | **Immune** — ball bounces off; cyan resist FX |
| **Power bounce** | **Still immune** — Power Bounce alone is not enough |
| **Points** | **300** (1×1) · **500** (long ↔ / ↕) |
| **Look** | Violet puff with a **cyan ability diamond** on the face (2D + 3D) |
| **Long variants** | `ability_long_h` (2×1) and `ability_long_v` (1×2) — same rules, higher payout |
| **Level clear** | **Does not count** toward `blocksRemaining` — optional bonus targets (like Score blocks) |

### vs Power Block

| Block | What breaks it |
|-------|----------------|
| **Power** | Power Bounce (release timing) |
| **Ability** | Active Copy Ability — any bounce type while ability is held |

Collect a Copy Ability item first, then hit Ability blocks to destroy them for points. Without an ability equipped, they behave like permanent obstacles. Clearing the level never requires destroying Ability blocks.

---

## Shield Block

Shield blocks are **not items you carry** — they are **level blocks** collected by breaking them. They exist to earn **protective covers** over spike gutters before the **boss round**.

| Property | Details |
|----------|---------|
| **Not an item** | Collected by hitting the block; nothing is added to inventory |
| **When** | **Round 4 only** |
| **HP** | 1 (one hit to collect) |
| **Points** | **0** — no score for hitting them |
| **Look** | Small rectangle with a **star** symbol |
| **Placement** | Grouped in the Round 4 layout, before the boss spike zone |

### Boss-round protection

1. Each collected Shield Block places a **protective cover** over one **Spike** gutter in the boss fight.
2. More shields collected → more gutters stay covered → **safer boss fight**.
3. Collecting **all** Shield Blocks in Round 4 awards a **1-Up** plus full spike coverage for the boss round.

### Covers vs spikes

- A cover sits on top of a spike gutter the player earned by collecting shields.
- When the ball hits a cover, the cover is **removed** and the **Spike** block underneath is active again.

### Shield vs Switch vs Score (easy to confuse)

| Block | Main purpose |
|-------|----------------|
| **Shield** | Round 4 boss spike protection; **0 points**; full set → **1-Up** |
| **Switch / Bonus Trigger** | Triggers **Bonus Chance** (Through blocks) |
| **Score** | Escalating points over up to 7 hits; optional **1-Up** on 7th hit |

---

## Score Block

Score blocks are **not dropped items** — they are **placed in the level layout** and hit in place.

| Property | Details |
|----------|---------|
| **Not an item** | Fixed block in `blocks.cells`; not spawned from enemy drops |
| **Footprint** | **2×2** play cells (anchor `18` top-left; extensions `19`–`21`) |
| **Hits** | Up to **7** hits per block |
| **Points** | Escalates each hit: **50 → 100 → 200 → 400 → 800 → 1600 → 3200** |
| **7th hit** | Awards the top point tier; with an **active Copy Ability**, the 7th hit can also grant a **1-Up** |
| **Visibility** | May start invisible until first hit (implementation-specific) |
| **Level clear** | **Does not count** toward `blocksRemaining` — destroy all required blocks with score blocks left on the field |

Optional high-score targets only — clearing the level never requires destroying score blocks.

---

## Bonus block (Bonus Chance)

During **Bonus Chance**, bonus blocks **collide** with the ball — you must hit them to collect. The ball **does not ricochet**; it keeps its path through the block.

| Property | Details |
|----------|---------|
| **Trigger** | Collect the **Bonus Chance** item ([`item_bonus_chance`](item-types.js)) — **2×2** pickup |
| **Timer** | **30 seconds** (demo) — collect all converted blocks before time runs out |
| **Placed in editor** | Cell **`22`** (`u`) — gold **1×1** tile; solid until Bonus Chance activates |
| **Conversion** | Normal, Gray, Power, Spike, Score, placed Bonus, long variants, etc. — all except **Indestructible** |
| **Collision** | Ball **hits** the block to collect it — **no ricochet** (keeps moving through) |
| **Success** | Collect every converted block before the timer ends |
| **Failure** | Uncollected blocks **revert** to their original type (solid, normal rules); also ends if the player **loses a life** |
| **Indestructible** | Never converted; stays solid |

---

## Switch / Bonus Trigger Block

- Collect **all** Switch blocks in a round to start **Bonus Chance**.
- Remaining blocks turn into **Through** blocks.
- Distinct from Shield blocks: Switch blocks trigger **Through** transformation, not spike covers.

---

## Normal vs Power bounce

### Normal bounce

- **Normal:** destroyed in one hit
- **Gray:** first hit → becomes Normal; second hit destroys
- **Power:** immune
- **Ability:** immune unless Copy Ability is active
- **Shield / Switch:** collected or destroyed instantly (when implemented)
- **Spike** *(demo):* hazard on contact; not destroyed
- **Indestructible:** immune; ball bounces

### Power bounce

- **Required** for Power blocks
- Does **not** destroy Ability blocks — Copy Ability is still required
- One-shots **Gray** blocks
- Often higher score multiplier on destroyable blocks (demo: 1.5×)
- **Spike** *(demo):* safe to bounce off while powered; hazard otherwise
- **Indestructible:** always immune; never removed by bounce

---

## Block interactions

| Interaction | Effect |
|-------------|--------|
| **Gray → Normal** | First normal bounce downgrades Gray to Normal; second hit destroys |
| **Power Bounce** | Required to destroy Power blocks; one-shots Gray; **does not** break Ability blocks |
| **Copy Ability + hit** | Required to destroy Ability blocks (300 / 500 pts) |
| **Switch → Through** | All Switch blocks collected → remaining blocks become Through blocks (Bonus Chance) |
| **Bonus Chance item** | Collect item → **30s** timer; blocks become hit-to-collect (no ricochet); uncollected blocks revert when time ends |
| **Shield → spike cover** | Each Shield collected (Round 4) adds a protective cover over one boss-round Spike gutter; all shields → **1-Up** + safer fight |
| **Score** | Layout block; up to 7 hits for escalating points; 7th hit with ability active may grant **1-Up** |
| **Splitting** | Large block splits into four smaller Normal/Gray pieces |
| **Required vs optional** | Normal, Gray, Power, Splitting usually required to clear; Shield, Score, Ability, Pinball often optional |

---

## Block art (demo)

All block, ball, paddle, enemy, and item visuals are **procedural placeholders** drawn at runtime in `generateTextures()` ([`block-ball-demo.html`](block-ball-demo.html)), [`block-ability-art.js`](block-ability-art.js), and [`editor-entity-art.js`](editor-entity-art.js). Texture keys match `BLOCK_TYPES` in [`block-types.js`](block-types.js) (`block_normal`, `block_gray`, `block_power`, `block_power_long_h` / `_v`, `block_ability`, `block_ability_long_h` / `_v`, `block_spike`, `block_indestructible`).

| Type | Texture key | Source |
|------|-------------|--------|
| **Normal** | `block_normal` | Procedural rounded cream block |
| **Gray** | `block_gray` | Procedural grey stone |
| **Spike** | `block_spike` | Procedural red triple-spike |
| **Power** | `block_power` | Procedural dark block + gold trim |
| **Power long** | `block_power_long_*` | Stretched from `block_power` |
| **Indestructible** | `block_indestructible` | Procedural steel + **X** |
| **Score** | `block_score` | Procedural lavender **2×2** tile (50→3200, ×7 hits) |
| **Bonus** | `block_bonus` | Procedural gold tile — pass-through collectible (100 pts when placed) |
| **Ability** | `block_ability` | Procedural violet block + cyan diamond |
| **Ability long** | `block_ability_long_*` | Stretched from `block_ability` |

**Destroy VFX:** clay-chunk particles (`clay_debris` atlas); tint sampled from the destroyed block’s texture (see `getBlockDebrisTint` in [`block-ball-demo.html`](block-ball-demo.html)).

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
| `18` + `19`–`21` | Score **2×2** (anchor `18` top-left) |
| `22` | Bonus (pass-through collectible) |
| `28` | Ability — Copy Ability gatekeeper (**300** pts) |
| `30` + `31` | Ability long ↔ (**500** pts) |
| `32` + `33` | Ability long ↕ (**500** pts) |

String keys: `.` empty, `1` normal, `g` gray, `p` power, `s` spike, `i` indestructible, `7`/`f` ability, `j`/`k` ability long, `e` score, `u` bonus.

Spike blocks use cell value `4` in `blocks.cells`. Legacy `blocks.spikes` is migrated at load.

Future types (shield, switch, through, pinball, splitting) will need new cell values when implemented.

---

## Source of truth in code

- Registry & helpers: [`block-types.js`](block-types.js)
- Texture preload, procedural art, destroy VFX: [`block-ball-demo.html`](block-ball-demo.html)
- Items (Flip, Crash, food, abilities): [`ITEM_COMPENDIUM.md`](ITEM_COMPENDIUM.md) · [`item-types.js`](item-types.js)
