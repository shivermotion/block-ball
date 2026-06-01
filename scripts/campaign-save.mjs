import { writeFile } from 'fs/promises';
import { join } from 'path';
import { readManifest } from './level-save.mjs';

export const CAMPAIGN_WORLD_COUNT = 10;
export const CAMPAIGN_STAGE_COUNT = 5;

function worldIdForIndex(index) {
  return `world-${String(index + 1).padStart(2, '0')}`;
}

function isValidWorldId(id) {
  return typeof id === 'string' && /^world-\d{2}$/.test(id);
}

function normalizeStageId(value) {
  if (value == null || value === '') return null;
  const id = String(value).trim();
  return id || null;
}

/** @param {unknown} raw @param {Set<string>} [knownLevelIds] */
export function ensureCampaign(raw, knownLevelIds = new Set()) {
  const worlds = [];
  const srcWorlds = raw && typeof raw === 'object' && Array.isArray(raw.worlds) ? raw.worlds : [];

  for (let i = 0; i < CAMPAIGN_WORLD_COUNT; i++) {
    const src = srcWorlds[i] || {};
    const id = typeof src.id === 'string' && isValidWorldId(src.id) ? src.id : worldIdForIndex(i);
    const name = typeof src.name === 'string' && src.name.trim() ? src.name.trim() : `World ${i + 1}`;
    const stages = Array(CAMPAIGN_STAGE_COUNT).fill(null);
    const srcStages = Array.isArray(src.stages) ? src.stages : [];
    for (let s = 0; s < CAMPAIGN_STAGE_COUNT; s++) {
      const levelId = normalizeStageId(srcStages[s]);
      if (levelId && knownLevelIds.size > 0 && !knownLevelIds.has(levelId)) {
        throw new Error(`Unknown level id "${levelId}" in ${id} stage ${s + 1}`);
      }
      stages[s] = levelId;
    }
    worlds.push({ id, name, stages });
  }

  return { version: 1, worlds };
}

/**
 * @param {{ rootDir: string, campaign: object }} opts
 */
export async function saveCampaignToRepo(opts) {
  const { rootDir, campaign } = opts;
  if (!campaign || typeof campaign !== 'object') {
    throw new Error('Campaign data is required.');
  }

  const levelsDir = join(rootDir, 'levels');
  const manifest = await readManifest(levelsDir);
  const knownLevelIds = new Set(manifest.map((e) => e.id));

  const normalized = ensureCampaign(campaign, knownLevelIds);
  const filePath = join(levelsDir, 'campaign.json');
  await writeFile(filePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return { filePath: 'levels/campaign.json', campaign: normalized };
}
