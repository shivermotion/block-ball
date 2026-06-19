/**
 * Campaign flow — 10 worlds × 5 stages; each stage slot holds a level id or null.
 */

const CAMPAIGN_WORLD_COUNT = 10;
const CAMPAIGN_STAGE_COUNT = 5;
const CAMPAIGN_PROGRESS_KEY = 'blockBall.campaignProgress';
const CAMPAIGN_LAST_KEY = 'blockBall.campaignLast';
const WORLD_STAR_COUNT_KEY = 'blockBall.worldStarCounts';

function worldIdForIndex(index) {
  return `world-${String(index + 1).padStart(2, '0')}`;
}

function createDefaultCampaign() {
  const worlds = [];
  for (let i = 0; i < CAMPAIGN_WORLD_COUNT; i++) {
    worlds.push({
      id: worldIdForIndex(i),
      name: `World ${i + 1}`,
      stages: Array(CAMPAIGN_STAGE_COUNT).fill(null),
    });
  }
  worlds[0].stages[0] = 'demo-level-01';
  return { version: 1, worlds };
}

const DEFAULT_CAMPAIGN = createDefaultCampaign();

function normalizeStageId(value) {
  if (value == null || value === '') return null;
  const id = String(value).trim();
  return id || null;
}

/** @param {unknown} raw */
function ensureCampaign(raw) {
  const base = createDefaultCampaign();
  if (!raw || typeof raw !== 'object') return base;

  const worlds = Array.isArray(raw.worlds) ? raw.worlds : [];
  for (let i = 0; i < CAMPAIGN_WORLD_COUNT; i++) {
    const src = worlds[i] || {};
    base.worlds[i].id = typeof src.id === 'string' && src.id ? src.id : base.worlds[i].id;
    base.worlds[i].name =
      typeof src.name === 'string' && src.name.trim() ? src.name.trim() : base.worlds[i].name;
    const stages = Array.isArray(src.stages) ? src.stages : [];
    for (let s = 0; s < CAMPAIGN_STAGE_COUNT; s++) {
      base.worlds[i].stages[s] = normalizeStageId(stages[s]);
    }
  }
  return base;
}

let _campaignPromise = null;

async function fetchCampaign(force = false) {
  if (force) _campaignPromise = null;
  if (_campaignPromise) return _campaignPromise;
  _campaignPromise = (async () => {
    try {
      const res = await fetch('levels/campaign.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`campaign ${res.status}`);
      const raw = await res.json();
      return ensureCampaign(raw);
    } catch (err) {
      console.warn('[BlockBall] campaign fallback', err?.message || err);
      return ensureCampaign(null);
    }
  })();
  return _campaignPromise;
}

function findWorld(campaign, worldId) {
  return campaign?.worlds?.find((w) => w.id === worldId) ?? null;
}

function findWorldIndex(campaign, worldId) {
  return campaign?.worlds?.findIndex((w) => w.id === worldId) ?? -1;
}

function stageKey(worldId, stageIndex) {
  return `${worldId}:${stageIndex}`;
}

function parseStageKey(key) {
  const idx = key.lastIndexOf(':');
  if (idx <= 0) return null;
  const worldId = key.slice(0, idx);
  const stageIndex = Number(key.slice(idx + 1));
  if (!Number.isInteger(stageIndex)) return null;
  return { worldId, stageIndex };
}

function loadCampaignProgress() {
  try {
    const raw = localStorage.getItem(CAMPAIGN_PROGRESS_KEY);
    if (!raw) return { completedStages: [] };
    const data = JSON.parse(raw);
    const list = Array.isArray(data?.completedStages) ? data.completedStages : [];
    return { completedStages: [...new Set(list.filter((k) => typeof k === 'string'))] };
  } catch (_) {
    return { completedStages: [] };
  }
}

function saveCampaignProgress(progress) {
  try {
    localStorage.setItem(CAMPAIGN_PROGRESS_KEY, JSON.stringify(progress));
  } catch (_) {
    /* private mode */
  }
}

function isStageCompleted(worldId, stageIndex, progress = loadCampaignProgress()) {
  return progress.completedStages.includes(stageKey(worldId, stageIndex));
}

function markStageCompleted(worldId, stageIndex) {
  const progress = loadCampaignProgress();
  const key = stageKey(worldId, stageIndex);
  if (!progress.completedStages.includes(key)) {
    progress.completedStages.push(key);
    saveCampaignProgress(progress);
  }
  return progress;
}

function resetCampaignProgress() {
  saveCampaignProgress({ completedStages: [] });
  saveWorldStarCounts({});
}

function resetAllWorldStarCounts() {
  saveWorldStarCounts({});
}

function loadWorldStarCounts() {
  try {
    const raw = localStorage.getItem(WORLD_STAR_COUNT_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch (_) {
    return {};
  }
}

function saveWorldStarCounts(counts) {
  try {
    localStorage.setItem(WORLD_STAR_COUNT_KEY, JSON.stringify(counts));
  } catch (_) {
    /* private mode */
  }
}

function getWorldStarCount(worldId) {
  if (!worldId) return 0;
  const counts = loadWorldStarCounts();
  const n = counts[worldId];
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function incrementWorldStarCount(worldId) {
  if (!worldId) return 0;
  const counts = loadWorldStarCounts();
  const next = getWorldStarCount(worldId) + 1;
  counts[worldId] = next;
  saveWorldStarCounts(counts);
  return next;
}

function resetWorldStarCount(worldId) {
  if (!worldId) return;
  const counts = loadWorldStarCounts();
  if (counts[worldId] == null) return;
  delete counts[worldId];
  saveWorldStarCounts(counts);
}

/** Campaign stage 5 (index 4) is the world boss stage. */
function isBossStage(stageIndex) {
  return stageIndex === CAMPAIGN_STAGE_COUNT - 1;
}

function assignedStagesInWorld(world) {
  if (!world?.stages) return [];
  return world.stages
    .map((levelId, stageIndex) => ({ stageIndex, levelId }))
    .filter((s) => s.levelId);
}

function isWorldComplete(campaign, worldIndex, progress = loadCampaignProgress()) {
  const world = campaign.worlds[worldIndex];
  if (!world) return false;
  const assigned = assignedStagesInWorld(world);
  if (assigned.length === 0) return false;
  return assigned.every(({ stageIndex }) => isStageCompleted(world.id, stageIndex, progress));
}

function isWorldUnlocked(campaign, worldIndex, progress = loadCampaignProgress()) {
  if (worldIndex <= 0) return true;
  return isWorldComplete(campaign, worldIndex - 1, progress);
}

function isStageAssigned(world, stageIndex) {
  return Boolean(normalizeStageId(world?.stages?.[stageIndex]));
}

function isStageUnlocked(campaign, worldId, stageIndex, progress = loadCampaignProgress()) {
  const worldIndex = findWorldIndex(campaign, worldId);
  if (worldIndex < 0) return false;
  if (!isWorldUnlocked(campaign, worldIndex, progress)) return false;
  if (stageIndex <= 0) return true;
  return isStageCompleted(worldId, stageIndex - 1, progress);
}

function isStagePlayable(campaign, worldId, stageIndex, levelIds, progress = loadCampaignProgress()) {
  const world = findWorld(campaign, worldId);
  if (!world) return false;
  const levelId = normalizeStageId(world.stages[stageIndex]);
  if (!levelId) return false;
  if (!levelIds.has(levelId)) return false;
  return isStageUnlocked(campaign, worldId, stageIndex, progress);
}

function getStageEntry(campaign, worldId, stageIndex) {
  const world = findWorld(campaign, worldId);
  if (!world) return null;
  if (stageIndex < 0 || stageIndex >= CAMPAIGN_STAGE_COUNT) return null;
  return {
    worldId: world.id,
    worldName: world.name,
    worldIndex: findWorldIndex(campaign, worldId),
    stageIndex,
    levelId: normalizeStageId(world.stages[stageIndex]),
  };
}

function getFirstAssignedStageInWorld(world) {
  for (let s = 0; s < CAMPAIGN_STAGE_COUNT; s++) {
    const levelId = normalizeStageId(world.stages[s]);
    if (levelId) return s;
  }
  return -1;
}

/** Next playable assigned stage after current; skips empty slots. */
function getNextStage(campaign, worldId, stageIndex) {
  const worldIndex = findWorldIndex(campaign, worldId);
  if (worldIndex < 0) return null;

  const world = campaign.worlds[worldIndex];
  for (let s = stageIndex + 1; s < CAMPAIGN_STAGE_COUNT; s++) {
    const levelId = normalizeStageId(world.stages[s]);
    if (levelId) {
      return { worldId: world.id, worldIndex, stageIndex: s, levelId };
    }
  }

  for (let w = worldIndex + 1; w < CAMPAIGN_WORLD_COUNT; w++) {
    const nextWorld = campaign.worlds[w];
    const first = getFirstAssignedStageInWorld(nextWorld);
    if (first >= 0) {
      return {
        worldId: nextWorld.id,
        worldIndex: w,
        stageIndex: first,
        levelId: normalizeStageId(nextWorld.stages[first]),
      };
    }
  }
  return null;
}

function worldProgress(campaign, worldIndex, progress = loadCampaignProgress()) {
  const world = campaign.worlds[worldIndex];
  const assigned = assignedStagesInWorld(world);
  const done = assigned.filter(({ stageIndex }) => isStageCompleted(world.id, stageIndex, progress)).length;
  return { assigned: assigned.length, completed: done };
}

function saveCampaignLastPosition(worldId, stageIndex) {
  try {
    localStorage.setItem(CAMPAIGN_LAST_KEY, JSON.stringify({ worldId, stageIndex }));
  } catch (_) {
    /* private mode */
  }
}

function loadCampaignLastPosition() {
  try {
    const raw = localStorage.getItem(CAMPAIGN_LAST_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.worldId || !Number.isInteger(data.stageIndex)) return null;
    return { worldId: data.worldId, stageIndex: data.stageIndex };
  } catch (_) {
    return null;
  }
}

function parseStageParam(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const idx = Math.floor(n) - 1;
  if (idx < 0 || idx >= CAMPAIGN_STAGE_COUNT) return null;
  return idx;
}

function campaignPlayUrl(worldId, stageIndex1Based) {
  const url = new URL('block-ball-demo.html', window.location.href);
  url.searchParams.set('campaign', '1');
  url.searchParams.set('world', worldId);
  url.searchParams.set('stage', String(stageIndex1Based));
  return url.pathname + url.search;
}

function campaignMenuUrl(worldId) {
  const url = new URL('campaign-menu.html', window.location.href);
  if (worldId) url.searchParams.set('world', worldId);
  return url.pathname + url.search;
}

async function isCampaignSaveAvailable() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.saveCampaign === true;
  } catch (_) {
    return false;
  }
}

async function saveCampaignToServer(campaign) {
  const res = await fetch('/api/campaign/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Campaign save failed (${res.status})`);
  }
  return data;
}

const Campaign = {
  CAMPAIGN_WORLD_COUNT,
  CAMPAIGN_STAGE_COUNT,
  CAMPAIGN_PROGRESS_KEY,
  WORLD_STAR_COUNT_KEY,
  DEFAULT_CAMPAIGN,
  createDefaultCampaign,
  ensureCampaign,
  fetchCampaign,
  findWorld,
  findWorldIndex,
  stageKey,
  loadCampaignProgress,
  saveCampaignProgress,
  resetCampaignProgress,
  loadWorldStarCounts,
  getWorldStarCount,
  incrementWorldStarCount,
  resetWorldStarCount,
  resetAllWorldStarCounts,
  isBossStage,
  isStageCompleted,
  markStageCompleted,
  isWorldComplete,
  isWorldUnlocked,
  isStageAssigned,
  isStageUnlocked,
  isStagePlayable,
  getStageEntry,
  getNextStage,
  worldProgress,
  saveCampaignLastPosition,
  loadCampaignLastPosition,
  parseStageParam,
  campaignPlayUrl,
  campaignMenuUrl,
  isCampaignSaveAvailable,
  saveCampaignToServer,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Campaign;
}
