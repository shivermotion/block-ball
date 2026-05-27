import { readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export const RESERVED_LEVEL_IDS = new Set(['blank', 'preview']);

/** @param {string} id */
export function isValidLevelId(id) {
  return typeof id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && !RESERVED_LEVEL_IDS.has(id);
}

/** @param {string} id */
export function levelIdToGlobal(id) {
  return `LEVEL_${id.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase()}`;
}

/** @param {object} level @param {string} globalName */
export function generateLevelSource(level, globalName) {
  const title = level.name || level.id || 'Level';
  const json = JSON.stringify(level, null, 2);
  return `/**\n * ${title}\n */\n\nconst ${globalName} = ${json};\n\n/** Dynamic loader (registry.js) reads \`window\`; \`const\` does not set that. */\nwindow.${globalName} = ${globalName};\n`;
}

/** @param {string} levelsDir */
export async function readManifest(levelsDir) {
  const path = join(levelsDir, 'manifest.json');
  try {
    const raw = await readFile(path, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/** @param {string} levelsDir @param {object[]} entries */
export async function writeManifest(levelsDir, entries) {
  const path = join(levelsDir, 'manifest.json');
  await writeFile(path, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

/**
 * Write level .js + update manifest (create, update, or rename).
 * @param {{ rootDir: string, id: string, originalId?: string|null, name: string, description?: string, level: object }} opts
 */
export async function saveLevelToRepo(opts) {
  const { rootDir, id, originalId, name, description, level } = opts;
  if (!isValidLevelId(id)) {
    throw new Error('Level id must be lowercase letters, numbers, and hyphens (not "blank" or "preview").');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Level name is required.');
  }
  if (!level || typeof level !== 'object') {
    throw new Error('Level data is required.');
  }

  const levelsDir = join(rootDir, 'levels');
  const global = levelIdToGlobal(id);
  const script = `levels/${id}.js`;
  const filePath = join(levelsDir, `${id}.js`);

  const normalized = structuredClone(level);
  normalized.id = id;
  normalized.name = name.trim();
  normalized.meta = { ...(normalized.meta || {}), lives: normalized.meta?.lives ?? 3 };
  if (description != null && String(description).trim()) {
    normalized.meta.description = String(description).trim();
  } else {
    delete normalized.meta.description;
  }

  const source = generateLevelSource(normalized, global);
  await writeFile(filePath, source, 'utf8');

  let manifest = await readManifest(levelsDir);
  const entry = { id, name: normalized.name, script, global };

  if (originalId && originalId !== id) {
    if (!isValidLevelId(originalId) && originalId !== 'demo-01') {
      throw new Error('Invalid original level id.');
    }
    const old = manifest.find((e) => e.id === originalId);
    if (old && old.id !== id) {
      const oldPath = join(rootDir, old.script);
      await unlink(oldPath).catch((err) => {
        if (err.code !== 'ENOENT') throw err;
      });
      manifest = manifest.filter((e) => e.id !== originalId);
    }
  }

  const idx = manifest.findIndex((e) => e.id === id);
  if (idx >= 0) manifest[idx] = entry;
  else manifest.push(entry);

  manifest.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  await writeManifest(levelsDir, manifest);

  return { id, name: normalized.name, script, global, filePath: script };
}

/**
 * Remove level file + manifest entry.
 * @param {{ rootDir: string, id: string }} opts
 */
export async function deleteLevelFromRepo(opts) {
  const { rootDir, id } = opts;
  if (!id || typeof id !== 'string') {
    throw new Error('Level id is required.');
  }
  if (!isValidLevelId(id)) {
    throw new Error('Cannot delete built-in or invalid level ids.');
  }

  const levelsDir = join(rootDir, 'levels');
  let manifest = await readManifest(levelsDir);
  const entry = manifest.find((e) => e.id === id);
  if (!entry) {
    throw new Error(`Level "${id}" is not in manifest.json.`);
  }

  const filePath = join(rootDir, entry.script);
  await unlink(filePath).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });

  manifest = manifest.filter((e) => e.id !== id);
  await writeManifest(levelsDir, manifest);

  return { id, script: entry.script, global: entry.global };
}
