/**
 * Register levels for playtest + editor load.
 * When you add levels/my-level.js, append an entry here.
 *
 * @typedef {{ id: string, name: string, script: string, global: string }} BlockBallLevelEntry
 */

/** @type {BlockBallLevelEntry[]} */
const BLOCK_BALL_LEVELS = [
  {
    id: 'demo-01',
    name: 'Demo Pyramid',
    script: 'levels/demo-level-01.js',
    global: 'DEMO_LEVEL_01',
  },
];

function findLevelEntry(id) {
  return BLOCK_BALL_LEVELS.find((e) => e.id === id) || null;
}

function getDefaultLevelId() {
  return BLOCK_BALL_LEVELS[0]?.id ?? null;
}

/**
 * Level files often use `const NAME = {...}` — that does not set `window.NAME`.
 * Indirect eval reads the global lexical binding (same as other classic scripts).
 */
function readLevelGlobal(name) {
  const w = window[name];
  if (w != null && typeof w === 'object') return w;
  try {
    const v = (0, eval)(name);
    if (v != null && typeof v === 'object') return v;
  } catch (_) {
    /* missing binding */
  }
  return null;
}

/** @returns {Promise<object>} */
function loadLevelScript(entry) {
  const existing = readLevelGlobal(entry.global);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = entry.script;
    script.async = true;
    script.onload = () => {
      const level = readLevelGlobal(entry.global);
      if (!level) {
        reject(new Error(`Level script loaded but global "${entry.global}" is missing`));
        return;
      }
      resolve(level);
    };
    script.onerror = () => reject(new Error(`Failed to load ${entry.script}`));
    document.head.appendChild(script);
  });
}

/**
 * Resolve active level from ?level= id, then localStorage, then default.
 * @returns {Promise<{ level: object, entry: BlockBallLevelEntry }>}
 */
async function resolveActiveLevel(options = {}) {
  const params = new URLSearchParams(window.location.search);
  const storageKey = options.storageKey ?? 'blockBall.level';

  if (params.get('preview') === '1') {
    try {
      const raw = sessionStorage.getItem('blockBall.previewLevel');
      if (raw) {
        const level = JSON.parse(raw);
        return {
          level,
          entry: { id: 'preview', name: level.name || 'Editor preview', script: '', global: '' },
        };
      }
    } catch (_) {
      /* fall through to registered level */
    }
  }

  const requestedId = params.get('level') || localStorage.getItem(storageKey) || getDefaultLevelId();
  const entry = findLevelEntry(requestedId) || findLevelEntry(getDefaultLevelId());

  if (!entry) {
    throw new Error('No levels registered in BLOCK_BALL_LEVELS');
  }

  const level = await loadLevelScript(entry);
  try {
    localStorage.setItem(storageKey, entry.id);
  } catch (_) {
    /* private mode */
  }
  return { level, entry };
}

function populateLevelSelect(selectEl, selectedId) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  BLOCK_BALL_LEVELS.forEach((entry) => {
    const opt = document.createElement('option');
    opt.value = entry.id;
    opt.textContent = entry.name;
    if (entry.id === selectedId) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

function playLevelUrl(levelId) {
  const url = new URL('block-ball-demo.html', window.location.href);
  url.searchParams.set('level', levelId);
  const current = new URLSearchParams(window.location.search);
  if (current.has('debugGrid')) url.searchParams.set('debugGrid', '1');
  if (current.get('devBorders') === '0') url.searchParams.set('devBorders', '0');
  return url.pathname + url.search;
}
