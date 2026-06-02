# Enemy Compendium — Generic Bouncy Ball Breakout

Enemies are shootable targets (ball collision) with **HP**, movement patterns, and drops. The ball **bounces** off them; each hit deals damage until HP reaches zero.

**Demo today:** `ground_walker`, `drifter`, and `saucer` mobs (GLB models) — see [`enemy-types.js`](enemy-types.js).

---

## Hit rules (ball collision)

| Hit type | Damage (typical) | Notes |
|----------|------------------|-------|
| Normal bounce | 1 | Standard mob dies in one hit |
| Power bounce | 2 (or instant on 1 HP) | Bonus points on kill while powered |

**Footprint:** Regular mobs occupy **2×2** play cells (top-left anchor in level JSON). Mid-bosses **3×3**, bosses **4×4**.

---

## Regular mobs (1 HP)

Small, single-hit targets — points, food, or power-up drops.

| Name             | HP | Movement                      | Speed     | Drops / reward | Notes |
|------            |-----|----------                    |-------    |----------------|-------|
| Ground Walker    | 1 | Slow horizontal / gentle float | Very slow | Food (candy/cake) | Most common; predictable — **implemented** (`assets/enemies/ground-walker/mushroom_monster.glb`) |
| Horizontal Flyer | 1 | Horizontal + gentle waves      | Medium    | Food (apple/cake) | Aerial practice target |
| Pinball Bouncer  | 1 | Short arcs between walls/blocks| Medium    | Ability changer (roulette) | Erratic but contained |
| Spark Blaster    | 1 | Stationary / slow drift        | Stationary | Spark ability | Often near blocks |
| Flame Riser      | 1 | Upward / diagonal              | Medium    | Burn ability | Vertical clear |
| Heavy Roller     | 1 | Very slow walk / stationary    | Very slow | Stone ability | Moving block feel |
| Wall Clinger     | 1 | Along walls; occasional drop   | Slow      | Needle ability | Paddle-stick |
| Block Shifter    | 1 | Slow roll / shift increments   | Slow      | Flip item | Tough moving block |
| Bomb Carrier     | 1 | Slow straight float/walk       | Slow      | Crash item (bomb) | Clears indestructible |
| Sweeper          | 1 | Back-forth sweep + bob         | Medium    | Basic food | Highly predictable |
| Quick Bird       | 1 | Short fast bursts / loops      | Fast      | Food | Fast aerial points |
| Drifter          | 1|  Erratic float / random paths   | Slow     |— | Unpredictable wildcard — **implemented** (`assets/enemies/drifter/shell.glb`) |
| Saucer           | 1 | Circles, figure-8, darts       | Medium–fast | — | Tricky skill target — **implemented** (`assets/enemies/saucer/ufo.glb`) |
| Popper           | 1 | Pop in/out, short dashes       | Medium     | Replica (multi-ball) | High reward |
| Roller           | 1 | Fast roll along bottom         | Fast        | — | High-speed target |
| Wall Clinger     | 1 | Stationary on walls            | Stationary | Food | Easy points |
| Aggro Floater    | 1 | Calm float → brief chase       | Slow       | Crash item | Mild aggro state |
| High Jumper      | 1 | High parabolic arcs            | Medium     | Crash item | Dynamic paths |

---

## Mid-bosses (Round 4)

Larger targets guarding star blocks. **~5000 points** base.

| Name | HP | Movement | Hits to defeat | Notes |
|------|-----|----------|----------------|-------|
| Big Shield | 4 | Stationary / slow drift | 4 | Guards spikes for boss round |
| Big Jelly | 4 | Float / pulse | 4 | — |
| Big Stone Head | 4 | Stationary / slow spin | 4 | — |
| Big Bomber | 4 | Slow + occasional jumps | 4 | — |
| Twin Lights | 4 | Coordinated pair | 4 | Dual target |
| Big Variant | 4 | Slow / stationary | 4 | One per stage |

---

## Bosses (Round 5)

One per stage. Multi-phase; need Power Bounces + abilities.

| Name | HP | Style | ~Hits | Notes |
|------|-----|-------|-------|-------|
| Giant Shield | 12 | Side-to-side, orbiting shields | 12+ | Multi-phase |
| Giant Jelly | 12 | Bounce / expand attacks | 12+ | — |
| Giant Stone Head | 14 | Roll / teleport, falling hazards | 12+ | — |
| Clown Bomber | 12 | Bombs / jumps | 12+ | — |
| Dual Orbiters | 13 | Coordinated light attacks | 12+ | — |
| Frost Giant | 12 | Slide, freezing wind | 12+ | — |
| Storm Cloud | 15 | Fly, lightning | 12+ | — |
| Tree Guardian | 12 | Drops while moving | 12+ | — |
| Cannon Blimp | 14 | Strafe + projectiles | 12+ | — |
| Mech Tank | 16 | Roll + missiles | 12+ | — |
| Final Emperor | 25 | Hammer, float, phases | 20+ | Final boss; high score gate |

---

## Level encoding (future)

```js
// Example spawn list for a level JSON
{ type: 'drifter', x: 195, y: 340 }
{ type: 'big_jelly', x: 195, y: 280, hp: 4 }
```

---

## Source of truth in code

- Registry: [`enemy-types.js`](enemy-types.js)
- 3D models: [`enemy-models.js`](enemy-models.js) · GLBs under `assets/enemies/`
- 2D placeholders: [`enemy-ground-walker-art.js`](enemy-ground-walker-art.js), [`enemy-drifter-art.js`](enemy-drifter-art.js), [`enemy-saucer-art.js`](enemy-saucer-art.js) (editor + non-3D demo)
- Playable spawns: [`block-ball-demo.html`](block-ball-demo.html) → `createEnemies()`
- Block interactions: [`BLOCK_COMPENDIUM.md`](BLOCK_COMPENDIUM.md)
- Item drops: [`ITEM_COMPENDIUM.md`](ITEM_COMPENDIUM.md) · [`item-types.js`](item-types.js)
