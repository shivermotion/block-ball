# AGENTS.md

## Cursor Cloud specific instructions

Block Ball is a client-side browser game (Phaser 3 + Three.js) served by a small
Node dev server. There is no build step, no automated test suite, and no linter
configured.

### Running the app (single service)

- Start the dev server with `npm run dev` (alias of `npm start`, runs
  `scripts/dev-server.mjs`). It listens on `http://localhost:8080` (override with
  the `PORT` env var).
- Play the game at `http://localhost:8080/block-ball-demo` (add
  `?level=demo-level-01` to load a specific level; append `&3d=1` for the
  Three.js overlay). Level editor is at `/level-editor`, campaign menu at
  `/campaign-menu`. Click the canvas to launch the ball; move the mouse to steer
  the paddle.
- Health check endpoint: `GET /api/health` returns
  `{"ok":true,"saveLevels":true,"saveCampaign":true}`.

### Non-obvious caveats

- `.html` URLs are 301-redirected to their extensionless form (`cleanUrls`), so
  link/test against paths like `/block-ball-demo`, not `/block-ball-demo.html`.
- Phaser and Three.js are served locally from `node_modules` via `/vendor/...`
  routes (see `tryServeVendor` in `scripts/dev-server.mjs`) to avoid CDN/ad-block
  issues. Dependencies MUST be installed (`npm install`) or these `/vendor/*`
  requests 404 and the game will not load.
- The dev server writes level/campaign files into the repo (`levels/`) through
  the `POST /api/levels/save`, `/api/levels/delete`, and `/api/campaign/save`
  endpoints used by the in-browser editors.
- The server is static (no hot reload); after editing `.js`/`.html` assets just
  refresh the browser. Only restart the Node process if you change files under
  `scripts/`.
