/**
 * Block Ball — GLTF pinball bumper model ("Simple Bumpers" by Jenson_A, CC-BY-4.0).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const PINBALL_BUMPER_URL = 'assets/blocks/pinball-bumper/scene.gltf';

/** @type {THREE.Object3D | null} */
let template = null;

/** @type {Promise<void> | null} */
let loadPromise = null;

function normalizePinballRoot(source) {
  const root = new THREE.Group();
  root.add(source);

  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());

  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;

  // Y-up export → diorama block axes (XY face, +Z depth toward camera).
  root.rotation.x = -Math.PI / 2;

  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const pivot = box.getCenter(new THREE.Vector3());
  root.position.x -= pivot.x;
  root.position.y -= pivot.y;
  root.position.z -= pivot.z;

  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  root.userData.baseMaxDim = Math.max(size.x, size.y, size.z, 1e-6);
  root.userData.baseHeight = size.z || root.userData.baseMaxDim;
  return root;
}

/** Preload the pinball bumper GLTF. */
export function loadPinballBumperModel() {
  if (!loadPromise) {
    loadPromise = (async () => {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(PINBALL_BUMPER_URL);
      template = normalizePinballRoot(gltf.scene);
    })();
  }
  return loadPromise;
}

export function isPinballBumperModelLoaded() {
  return Boolean(template);
}

/** @returns {THREE.Object3D | null} */
export function clonePinballBumperModel() {
  if (!template) return null;
  return template.clone(true);
}
