/**
 * Block Ball — GLB enemy model loader & instancing.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

/** @type {Record<string, { url: string, anchor?: 'floor' | 'center' }>} */
export const ENEMY_MODELS = {
  ground_walker: {
    url: 'assets/enemies/ground-walker/mushroom_monster.glb',
    anchor: 'center',
  },
  drifter: {
    url: 'assets/enemies/drifter/shell.glb',
    anchor: 'center',
  },
  saucer: {
    url: 'assets/enemies/saucer/ufo.glb',
    anchor: 'center',
  },
  horizontal_flyer: {
    url: 'assets/enemies/horizontal-flyer/cute_monster.glb',
    anchor: 'center',
  },
  flame_riser: {
    url: 'assets/enemies/slime-fire/slime_fire.glb',
    anchor: 'center',
  },
};

/** @type {Map<string, THREE.Object3D>} */
const templates = new Map();

/** @type {Promise<void> | null} */
let loadAllPromise = null;

function poseSkinnedMeshes(root) {
  root.traverse((node) => {
    if (node.isMesh) {
      node.frustumCulled = false;
    }
    if (node.isSkinnedMesh) {
      node.skeleton?.pose();
    }
  });
  root.updateMatrixWorld(true);
}

function normalizeEnemyRoot(source, anchor = 'floor') {
  const root = new THREE.Group();
  root.add(source);

  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  root.position.x -= center.x;
  root.position.z -= center.z;
  if (anchor === 'center') {
    root.position.y -= center.y;
  } else {
    root.position.y -= box.min.y;
  }

  root.userData.baseMaxDim = Math.max(size.x, size.y, size.z, 1e-6);
  root.userData.baseHeight = size.y || root.userData.baseMaxDim;
  root.userData.anchor = anchor;
  poseSkinnedMeshes(root);
  return root;
}

/**
 * @param {string} typeId
 * @returns {Promise<THREE.Object3D | null>}
 */
async function loadTemplate(typeId) {
  const config = ENEMY_MODELS[typeId];
  if (!config) return null;
  if (templates.has(typeId)) return templates.get(typeId);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(config.url);
  const normalized = normalizeEnemyRoot(gltf.scene, config.anchor ?? 'floor');
  templates.set(typeId, normalized);
  return normalized;
}

/** Preload all registered enemy GLBs (failures are logged; other models still load). */
export function loadEnemyModels() {
  if (!loadAllPromise) {
    const ids = Object.keys(ENEMY_MODELS);
    loadAllPromise = Promise.all(
      ids.map(async (id) => {
        try {
          await loadTemplate(id);
        } catch (err) {
          console.error(`[BlockBall 3D] failed to load enemy model "${id}":`, err);
        }
      })
    ).then(() => {});
  }
  return loadAllPromise;
}

/** @param {string} typeId */
export function hasEnemyModel(typeId) {
  return Boolean(ENEMY_MODELS[typeId]);
}

/** @param {string} typeId */
export function isEnemyModelLoaded(typeId) {
  return templates.has(typeId);
}

/** @param {string} typeId @returns {THREE.Object3D | null} */
export function cloneEnemyModel(typeId) {
  const tpl = templates.get(typeId);
  if (!tpl) return null;
  let hasSkinned = false;
  tpl.traverse((node) => {
    if (node.isSkinnedMesh) hasSkinned = true;
  });
  try {
    const clone = hasSkinned ? SkeletonUtils.clone(tpl) : tpl.clone(true);
    poseSkinnedMeshes(clone);
    return clone;
  } catch (err) {
    console.error(`[BlockBall 3D] clone failed for "${typeId}":`, err);
    return null;
  }
}
