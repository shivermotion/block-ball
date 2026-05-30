/**
 * Register levels for playtest + editor load.
 * Built-in levels live here; file levels are listed in levels/manifest.json (updated on Save).
 *
 * @typedef {{ id: string, name: string, script: string, global: string, builtin?: 'blank' }} BlockBallLevelEntry
 */

function bbLog(...args) {
  console.log('[BlockBall]', ...args);
}

function summarizeLevel(level) {
  const cells = level?.blocks?.cells;
  let filled = 0;
  if (cells) {
    for (const row of cells) {
      for (const c of row) if (c) filled += 1;
    }
  }
  return {
    id: level?.id,
    name: level?.name,
    gridRows: cells?.length,
    gridCols: cells?.[0]?.length,
    filledCells: filled,
    enemies: level?.enemies?.length ?? 0,
    items: level?.items?.length ?? 0,
  };
}

/** Built-in levels (not stored on disk). */
const BUILTIN_LEVELS = [
  {
    id: 'blank',
    name: 'Blank',
    script: '',
    global: '',
    builtin: 'blank',
  },
];

/** Used when manifest.json is unavailable (e.g. file://). */
const FALLBACK_FILE_LEVELS = [
  {
    id: 'demo-level-01',
    name: 'Demo Pyramid',
    script: 'levels/demo-level-01.js',
    global: 'LEVEL_DEMO_LEVEL_01',
  },
];

/** Legacy ids → current manifest id (e.g. saved localStorage / old links). */
const LEVEL_ID_ALIASES = {
  'demo-01': 'demo-level-01',
};

/** @type {BlockBallLevelEntry[]} */
let BLOCK_BALL_LEVELS = [...BUILTIN_LEVELS, ...FALLBACK_FILE_LEVELS];
let _registryPromise = null;

async function ensureLevelRegistry(force = false) {
  if (force) _registryPromise = null;
  if (_registryPromise) return _registryPromise;
  _registryPromise = (async () => {
    try {
      const res = await fetch('levels/manifest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      const fileLevels = await res.json();
      if (!Array.isArray(fileLevels)) throw new Error('manifest not array');
      BLOCK_BALL_LEVELS = [...BUILTIN_LEVELS, ...fileLevels];
      bbLog('registry loaded', { fileLevels: fileLevels.length, total: BLOCK_BALL_LEVELS.length });
    } catch (err) {
      BLOCK_BALL_LEVELS = [...BUILTIN_LEVELS, ...FALLBACK_FILE_LEVELS];
      bbLog('registry fallback (manifest unavailable)', err?.message || err);
    }
  })();
  return _registryPromise;
}

function invalidateLevelScript(globalName) {
  if (!globalName) return;
  try {
    delete window[globalName];
  } catch (_) {
    /* readonly global */
  }
  document.querySelectorAll(`script[data-level-global="${globalName}"]`).forEach((el) => el.remove());
}

/** @param {string} id */
function levelIdToGlobal(id) {
  return `LEVEL_${id.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase()}`;
}

function isValidLevelId(id) {
  return typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id !== 'blank' && id !== 'preview';
}

async function isLevelSaveAvailable() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.saveLevels === true;
  } catch (_) {
    return false;
  }
}

/**
 * Save level to levels/ via dev server (yarn start).
 * @returns {Promise<{ id: string, script: string, global: string }>}
 */
async function saveLevelToServer({ id, originalId, name, description, level }) {
  const res = await fetch('/api/levels/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, originalId: originalId || null, name, description, level }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Save failed (${res.status})`);
  }
  return data;
}

/** @returns {Promise<{ id: string, script: string, global: string }>} */
async function deleteLevelFromServer(id) {
  const res = await fetch('/api/levels/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Delete failed (${res.status})`);
  }
  return data;
}

/** Empty playfield — same HUD/grid defaults as demo; cells filled by ensurePlayBlockCells. */
function createBlankLevel() {
  return {
    version: 1,
    id: 'blank',
    name: 'Blank',
    hud: {
      height: 72,
      padX: 12,
      padY: 8,
      originX: 8,
      originY: 8,
    },
    hudGap: 8,
    hudLayout: {
      left: ['score'],
      right: ['lives', 'avatar'],
      gaps: { livesToAvatar: 10 },
      avatar: { size: 44 },
    },
    grid: {
      cols: 10,
      cellHeight: 36,
      originX: 8,
      fillBelowHud: true,
    },
    blocks: { cells: [] },
    enemies: [],
    items: [],
    paddle: { col: 4, colSpan: 2, rowFromBottom: 2 },
    meta: { lives: 3, description: 'Empty canvas for level design.' },
  };
}

function findLevelEntry(id) {
  const resolved = LEVEL_ID_ALIASES[id] || id;
  return BLOCK_BALL_LEVELS.find((e) => e.id === resolved) || null;
}

function getDefaultLevelId() {
  const demo = findLevelEntry('demo-level-01');
  return demo?.id ?? BLOCK_BALL_LEVELS.find((e) => e.id !== 'blank')?.id ?? null;
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
function loadLevelScript(entry, options = {}) {
  if (entry.builtin === 'blank') {
    return Promise.resolve(structuredClone(createBlankLevel()));
  }

  if (options.reload && entry.global) {
    invalidateLevelScript(entry.global);
  } else {
    const existing = readLevelGlobal(entry.global);
    if (existing) return Promise.resolve(existing);
  }

  if (!entry.script || !entry.global) {
    return Promise.reject(new Error(`Level "${entry.id}" is not loadable`));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.dataset.levelGlobal = entry.global;
    script.src = options.reload ? `${entry.script}?t=${Date.now()}` : entry.script;
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

const EDITOR_PREVIEW_KEY = 'blockBall.previewLevel';
const EDITOR_DRAFT_KEY = 'blockBall.editorDraft';
/** Set when editor clicks Play test; editor boot restores draft instead of default level */
const EDITOR_RESTORE_FLAG_KEY = 'blockBall.editorRestoreOnLoad';
/** Set when editor clicks Play test; survives clean-URL redirects that drop ?preview=1 */
const EDITOR_PLAYTEST_PENDING_KEY = 'blockBall.playTestPending';
const EDITOR_PLAYTEST_PENDING_MS = 20000;

function markEditorPlaytestPending() {
  try {
    localStorage.setItem(EDITOR_PLAYTEST_PENDING_KEY, String(Date.now()));
  } catch (_) {
    /* private mode */
  }
}

function clearEditorPlaytestPending() {
  try {
    localStorage.removeItem(EDITOR_PLAYTEST_PENDING_KEY);
  } catch (_) {
    /* private mode */
  }
}

function isEditorPlaytestPending() {
  try {
    const raw = localStorage.getItem(EDITOR_PLAYTEST_PENDING_KEY);
    if (!raw) return false;
    const t = Number(raw);
    if (!Number.isFinite(t) || Date.now() - t > EDITOR_PLAYTEST_PENDING_MS) {
      clearEditorPlaytestPending();
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

/** True when URL or a fresh Play-test flag requests editor preview. */
function wantsEditorPreviewMode(params) {
  if (params.get('preview') === '1') return true;
  const hash = (window.location.hash || '').replace(/^#/, '');
  if (hash === 'preview' || hash.startsWith('preview=')) return true;
  if (isEditorPlaytestPending()) return true;
  return false;
}

function storeEditorDraft(levelData) {
  const raw = typeof levelData === 'string' ? levelData : JSON.stringify(levelData);
  try {
    localStorage.setItem(EDITOR_DRAFT_KEY, raw);
  } catch (_) {
    /* private mode */
  }
}

function loadEditorDraft() {
  try {
    const raw = localStorage.getItem(EDITOR_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[BlockBall] Invalid editor draft JSON', err);
    return null;
  }
}

function markEditorRestoreAfterPlayTest() {
  try {
    localStorage.setItem(EDITOR_RESTORE_FLAG_KEY, '1');
  } catch (_) {
    /* private mode */
  }
}

/** One-shot: true if editor should restore draft on this load (Play test return). */
function consumeEditorRestoreAfterPlayTest() {
  try {
    if (localStorage.getItem(EDITOR_RESTORE_FLAG_KEY) !== '1') return false;
    localStorage.removeItem(EDITOR_RESTORE_FLAG_KEY);
    return true;
  } catch (_) {
    return false;
  }
}

/** Store editor canvas for playtest (localStorage — shared across tabs; sessionStorage is per-tab). */
function storeEditorPreviewLevel(levelData) {
  const raw = typeof levelData === 'string' ? levelData : JSON.stringify(levelData);
  const summary = typeof levelData === 'string' ? { bytes: raw.length } : summarizeLevel(levelData);
  markEditorPlaytestPending();
  markEditorRestoreAfterPlayTest();
  storeEditorDraft(levelData);
  localStorage.setItem(EDITOR_PREVIEW_KEY, raw);
  let sessionOk = false;
  try {
    sessionStorage.setItem(EDITOR_PREVIEW_KEY, raw);
    sessionOk = true;
  } catch (err) {
    bbLog('preview store: sessionStorage skipped (per-tab only)', err?.message || err);
  }
  bbLog('preview stored', {
    key: EDITOR_PREVIEW_KEY,
    bytes: raw.length,
    origin: window.location.href,
    sessionStorage: sessionOk,
    ...summary,
  });
}

function loadEditorPreviewLevel() {
  const fromLocal = localStorage.getItem(EDITOR_PREVIEW_KEY);
  const fromSession = sessionStorage.getItem(EDITOR_PREVIEW_KEY);
  const raw = fromLocal || fromSession;
  bbLog('preview load attempt', {
    key: EDITOR_PREVIEW_KEY,
    origin: window.location.href,
    localStorage: fromLocal ? `${fromLocal.length} bytes` : 'missing',
    sessionStorage: fromSession ? `${fromSession.length} bytes` : 'missing',
    using: fromLocal ? 'localStorage' : fromSession ? 'sessionStorage' : 'none',
  });
  if (!raw) return null;
  try {
    const level = JSON.parse(raw);
    bbLog('preview parsed', summarizeLevel(level));
    return level;
  } catch (err) {
    console.error('[BlockBall] Invalid editor preview JSON', err);
    return null;
  }
}

/**
 * Resolve level from campaign URL (?campaign=1&world=world-01&stage=1).
 * Requires levels/campaign.js loaded first.
 * @returns {Promise<{ level: object, entry: BlockBallLevelEntry, campaignCtx: object }>}
 */
async function resolveActiveCampaignLevel(options = {}) {
  await ensureLevelRegistry();
  const campaign = await fetchCampaign(options.forceCampaign);
  const params = new URLSearchParams(window.location.search);
  const worldId = params.get('world');
  const stageIndex = parseStageParam(params.get('stage'));

  if (!worldId || stageIndex == null) {
    throw new Error('Campaign mode requires ?world=world-01&stage=1 (stage 1–5).');
  }

  const levelIds = new Set(BLOCK_BALL_LEVELS.map((e) => e.id));
  const progress = loadCampaignProgress();

  if (!isStagePlayable(campaign, worldId, stageIndex, levelIds, progress)) {
    throw new Error(`Stage not playable: ${worldId} stage ${stageIndex + 1}. Unlock it from the campaign menu.`);
  }

  const stage = getStageEntry(campaign, worldId, stageIndex);
  if (!stage?.levelId) {
    throw new Error('Stage has no level assigned.');
  }

  const entry = findLevelEntry(stage.levelId);
  if (!entry) {
    throw new Error(`Level "${stage.levelId}" is not in the registry.`);
  }

  saveCampaignLastPosition(worldId, stageIndex);
  const level = await loadLevelScript(entry);
  bbLog('resolveActiveCampaignLevel', {
    worldId,
    stage: stageIndex + 1,
    levelId: stage.levelId,
  });

  return {
    level,
    entry,
    campaignCtx: {
      campaign,
      worldId: stage.worldId,
      worldName: stage.worldName,
      worldIndex: stage.worldIndex,
      stageIndex: stage.stageIndex,
      stageNumber: stage.stageIndex + 1,
    },
  };
}

/**
 * Resolve active level from ?preview=1, ?campaign=1, ?level= id, then localStorage, then default.
 * @returns {Promise<{ level: object, entry: BlockBallLevelEntry, campaignCtx?: object }>}
 */
async function resolveActiveLevel(options = {}) {
  await ensureLevelRegistry();
  const params = new URLSearchParams(window.location.search);

  if (params.get('campaign') === '1') {
    return resolveActiveCampaignLevel(options);
  }

  const storageKey = options.storageKey ?? 'blockBall.level';
  const previewWanted = wantsEditorPreviewMode(params);
  bbLog('resolveActiveLevel', {
    href: window.location.href,
    preview: params.get('preview'),
    hash: window.location.hash || '(none)',
    playTestPending: isEditorPlaytestPending(),
    previewWanted,
    levelParam: params.get('level'),
    savedLevel: localStorage.getItem(storageKey),
  });

  if (previewWanted) {
    const level = loadEditorPreviewLevel();
    if (level) {
      clearEditorPlaytestPending();
      bbLog('resolveActiveLevel → editor preview', summarizeLevel(level));
      return {
        level,
        entry: { id: 'preview', name: level.name || 'Editor preview', script: '', global: '' },
      };
    }
    clearEditorPlaytestPending();
    bbLog('resolveActiveLevel → preview requested but no data');
    throw new Error(
      'Editor preview data not found. Use Play test from level-editor.html (same site, e.g. localhost:8080).'
    );
  }

  const requestedId =
    LEVEL_ID_ALIASES[params.get('level') || ''] ||
    params.get('level') ||
    LEVEL_ID_ALIASES[localStorage.getItem(storageKey) || ''] ||
    localStorage.getItem(storageKey) ||
    getDefaultLevelId();
  const entry = findLevelEntry(requestedId) || findLevelEntry(getDefaultLevelId());
  bbLog('resolveActiveLevel → registered level', { requestedId, entryId: entry?.id, script: entry?.script });

  if (!entry) {
    throw new Error('No levels registered in BLOCK_BALL_LEVELS');
  }

  const level = await loadLevelScript(entry);
  bbLog('resolveActiveLevel → loaded script', summarizeLevel(level));
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
