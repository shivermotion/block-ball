# Item Compendium — Generic Bouncy Ball Breakout

Collectible pickups that appear in the playfield—usually after defeating an enemy. The ball must **touch** an item to collect it. Most items vanish after a few seconds if missed.

**Demo implementation today:** level-placed items can be collected by the ball (overlap). **Bonus Chance** converts non-indestructible blocks into pass-through bonus blocks. Food items award compendium **points** with an arcade-style floating `+N` label ([`score-popup.js`](score-popup.js)). All items use **procedural category placeholders** (colored tile + abbreviation).

---

## Item art

Every item uses a procedural icon keyed `item_<id>` — category color + two-letter abbrev ([`editor-entity-art.js`](editor-entity-art.js), `generateItemTextures()` in the demo).

---

## Food items (scoring)

Instant points on collection. Typically despawn after ~4–6 seconds.

| Item | Points | Appearance | Typical source | Notes |
|------|--------|------------|----------------|-------|
| **Apple** | 1,000 | Procedural food tile | Most regular enemies | Most common food drop. |
| **Candy** | 1,500 | Colorful wrapped candy | Common enemies | Medium value. |
| **Cake** | 2,000 | Slice of cake | Stronger or rarer enemies | Highest regular food value. |
| **Big Cake** | 5,000+ | Large fancy cake | Rare / mid-boss drops | Large score spike. |

**Power Bounce** often increases points gained from food items when collected while powered.

---

## Power-up items

Carried or active until used, lost, or the round ends (per item).

| Item | Effect | Duration | Typical source | Strategic use |
|------|--------|----------|----------------|---------------|
| **Replica** | Splits the current ball into **2** balls (extras often convert to **1-Ups** at round end) | Until balls are lost | Popper | Strong for fast clears; multi-ball chaos. |
| **Crash** | One-shot bomb: destroys **all Indestructible blocks** on screen | Instant (single use) | Bomb Carrier, Aggro Floater | Required when indestructible mazes block progress. See [Indestructible blocks](BLOCK_COMPENDIUM.md#regular--core-blocks). |
| **Flip** | Recolors affected blocks (colored normals often **double** point value) | Until round ends | Block Shifter | Major scoring multiplier on block-heavy layouts. |
| **Changer** | Roulette — grants a **random Copy Ability** | Until replaced | Pinball Bouncer | Reroll when you want a different ability. |
| **Bonus Chance** | Every block except **Indestructible** becomes a **bonus block** (hit to collect, no ricochet) | Instant | Level-placed (demo) | **2×2** pickup; **30s** timer to collect all or blocks revert. |
| **Warp Star** | Warps to a **bonus minigame** (extra lives and points) | Instant | Rare enemy or random spawn | **2×3 cells** tall (anchor = top-left). High-risk, high-reward side activity. |

---

## Copy ability items

Dropped by specific enemies. Only **one** Copy Ability can be held; a new pickup **replaces** the current ability.

| Ability | Granted by (enemy) | Effect while active | Best for |
|---------|-------------------|---------------------|----------|
| **Spark** | Spark Blaster | Electric aura — destroys blocks along the ball’s path | Line clears, safer movement through clusters |
| **Burn** | Flame Riser | Fireball shoots **straight upward**, burning blocks above | Vertical clears |
| **Stone** | Heavy Roller | Heavy form — ball drops **straight down**, crushing blocks below | Vertical power drops |
| **Needle** | Wall Clinger | Spiky form — **stick to paddle** on tap for re-aim | Precision shots and control |

Ability blocks in the level often still require an active Copy Ability to destroy fully — see [Ability blocks](BLOCK_COMPENDIUM.md#regular--core-blocks).

---

## Lives and related pickups

| Item | Effect | Rarity | Notes |
|------|--------|--------|-------|
| **1-Up** | +1 life (extra ball) | Rare | May drop from high-tier food, collecting **all Star Blocks in Round 4**, or **7th hit on a Score block** (with Copy Ability active). |

---

## Not items (level blocks)

These are **blocks in the level layout**, not ball-collected pickups and **not** inventory items. Full rules: [`BLOCK_COMPENDIUM.md`](BLOCK_COMPENDIUM.md).

### Star / Protective Star block

| | |
|--|--|
| **What it is** | A breakable block with a star symbol — **not something you carry** |
| **When** | **Round 4 only** |
| **Effect** | Each star collected adds a **protective cover** over one spike gutter in the **boss round** |
| **Full set** | Collecting **all** stars in Round 4 → **1-Up** + safer boss fight |
| **Points** | **0** |

### Score block

| | |
|--|--|
| **What it is** | A fixed block in the level — **not dropped** by enemies |
| **Hits** | Up to **7** hits for increasing points (50 → … → 3200) |
| **7th hit** | Top score tier; with **Copy Ability active**, can also award a **1-Up** |
| **Placement** | Authored in level layout (`blocks.cells`) |

---

## Collection rules

1. Most items spawn briefly after an enemy is defeated (or appear as rare field spawns).
2. Collect by hitting the item with the **ball** (not the paddle alone, unless a specific rule says otherwise).
3. Uncollected items despawn after about **4–6 seconds**.
4. Only **one Copy Ability** at a time; new ability pickups overwrite the old one.
5. **Power Bounce** can boost food point values when collected while powered.
6. **Replica** extra balls at round end may convert to **1-Ups** per classic rules.

---

## Drop ID reference (code)

Reserved `drop` strings on enemies in [`enemy-types.js`](enemy-types.js) map to item families:

| Drop ID | Item family |
|---------|-------------|
| `food`, `food_basic` | Generic food |
| `food_apple` | Apple |
| `food_candy` | Candy |
| `food_cake` | Cake (when added) |
| `item_crash` | Crash |
| `item_flip` | Flip |
| `item_changer`, `ability_roulette` | Changer |
| `item_bonus_chance` | Bonus Chance |
| `replica_multiball` | Replica |
| `ability_spark` | Spark |
| `ability_burn` | Burn |
| `ability_stone` | Stone |
| `ability_needle` | Needle |

---

## Source of truth in code

- Item registry: [`item-types.js`](item-types.js) · procedural icons in [`editor-entity-art.js`](editor-entity-art.js)
- Enemy drops: [`enemy-types.js`](enemy-types.js) · [`ENEMY_COMPENDIUM.md`](ENEMY_COMPENDIUM.md)
- Blocks affected by Flip / Crash: [`BLOCK_COMPENDIUM.md`](BLOCK_COMPENDIUM.md)
