# Item Compendium — Generic Bouncy Ball Breakout

Collectible pickups that appear in the playfield—usually after defeating an enemy. The ball must **touch** an item to collect it. Most items vanish after a few seconds if missed.

**Demo implementation today:** level-placed items can be collected by the ball (overlap). Food items award compendium **points** with an arcade-style floating `+N` label ([`score-popup.js`](score-popup.js)). Art exists for **Apple** and **Warp Star**; other items use placeholders until PNGs are added.

---

## Item art

| Item | ID | Asset |
|------|-----|-------|
| **Apple** | `food_apple` | [`assets/items/food_apple.png`](assets/items/food_apple.png) — stylized red clay apple with leaf (RGBA) |
| **Warp Star** | `warp_star` | [`assets/items/warp_star.png`](assets/items/warp_star.png) — turquoise/orange clay rocket (RGBA) |

**Pipeline:** [`scripts/process-ball-sprite.py`](scripts/process-ball-sprite.py) (black background → transparent). Cache bust: `ITEM_ART_VERSION` in [`item-types.js`](item-types.js).

---

## Food items (scoring)

Instant points on collection. Typically despawn after ~4–6 seconds.

| Item | Points | Appearance | Typical source | Notes |
|------|--------|------------|----------------|-------|
| **Apple** | 1,000 | Red clay apple with leaf (`food_apple.png`) | Most regular enemies | Most common food drop. |
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
| **Warp Star** | Warps to a **bonus minigame** (extra lives and points) | Instant | Rare enemy or random spawn | Clay rocket sprite (`warp_star.png`). **2×3 cells** tall (anchor = top-left). High-risk, high-reward side activity. |

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
| **1-Up** | +1 life (extra ball) | Rare | May drop from high-tier food, perfect Star Block collection, or Score Block final hit (with ability). |

---

## Not items (level objects)

These are **blocks** or stage rules, not ball-collected pickups. Documented in [`BLOCK_COMPENDIUM.md`](BLOCK_COMPENDIUM.md).

| Name | What it is |
|------|------------|
| **Star / Protective Star block** | Collected by breaking the block; adds spike covers in a later zone — not carried in inventory. |
| **Score / Bonus block** | Fixed in the layout; hit up to 7 times for escalating points — not a dropped item. |

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
| `replica_multiball` | Replica |
| `ability_spark` | Spark |
| `ability_burn` | Burn |
| `ability_stone` | Stone |
| `ability_needle` | Needle |

---

## Source of truth in code

- Item registry & art paths: [`item-types.js`](item-types.js) · [`assets/items/`](assets/items/)
- Enemy drops: [`enemy-types.js`](enemy-types.js) · [`ENEMY_COMPENDIUM.md`](ENEMY_COMPENDIUM.md)
- Blocks affected by Flip / Crash: [`BLOCK_COMPENDIUM.md`](BLOCK_COMPENDIUM.md)
