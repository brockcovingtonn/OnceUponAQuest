/**
 * Loads the 3D explorer model (a .glb bundled with the app) for the 3D viewer.
 *
 * The model's meshes stay separate and named, grouped by wardrobe slot
 * (hair, top, bottoms, shoes, accessories…), so later we can swap a
 * hairstyle or outfit by hiding one group and adding another.
 */
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Bone, Box3, Group, type Material, Mesh, MeshStandardMaterial, type Object3D, SkinnedMesh, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Bundled models.
 *  - sculpted: the rigged explorer built in Blender (scripts/avatar3d), Y-up,
 *    one mesh per part named by slot (hair_, face_, top_, bottom_, shoes_, body_).
 *  - original: the first blockout from avatar_01_stylized_brunette.glb, Z-up.
 * Colors live in vertex colors in both.
 */
const MODELS = {
  sculpted: { source: require('../../assets/models/explorer_sculpted.glb'), zUp: false },
  original: { source: require('../../assets/models/avatar_01_stylized_brunette.glb'), zUp: true },
} as const;
export type AvatarModelId = keyof typeof MODELS;

export type AvatarPartSlot = 'body' | 'face' | 'hair' | 'top' | 'bottom' | 'shoes' | 'accessory';

/** Which slot a mesh belongs to, by its name in the model file. */
const SLOT_PREFIXES: [AvatarPartSlot, string[]][] = [
  ['hair', ['hair_', 'bang_']],
  ['face', ['face_', 'eye_', 'iris_', 'pupil_', 'brow_', 'mouth', 'lower_lip', 'cheek_']],
  ['top', ['top_', 'torso']],
  ['bottom', ['bottom_', 'hips', 'jean_', 'belt']],
  ['shoes', ['shoes_', 'shoe_', 'sole_', 'lace_']],
  ['accessory', ['accessory_', 'shoulder_bag', 'bag_strap']],
];

export function slotOf(meshName: string): AvatarPartSlot {
  for (const [slot, prefixes] of SLOT_PREFIXES) {
    if (prefixes.some((p) => meshName.startsWith(p))) return slot;
  }
  return 'body';
}

export type AvatarModel = {
  /** Stand-up, centered root: feet at y = 0, facing +z (toward the default camera). */
  root: Group;
  /** Every mesh, grouped by slot and keyed by its name in the file. */
  parts: Record<AvatarPartSlot, Map<string, Mesh>>;
  /** Size of the standing model. */
  height: number;
  width: number;
  /** Skeleton bones by name (empty for unrigged models). */
  bones: Map<string, Bone>;
};

// GLTFLoader reads the .glb's JSON chunk with TextDecoder; Hermes may not have one.
function ensureTextDecoder() {
  const g = globalThis as { TextDecoder?: unknown };
  if (typeof g.TextDecoder !== 'undefined') return;
  class Utf8Decoder {
    decode(input?: ArrayBufferView | ArrayBuffer): string {
      if (!input) return '';
      const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      let out = '';
      for (let i = 0; i < bytes.length; ) {
        const b = bytes[i++];
        let cp = b;
        if (b >= 0xf0) cp = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
        else if (b >= 0xe0) cp = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
        else if (b >= 0xc0) cp = ((b & 31) << 6) | (bytes[i++] & 63);
        out += String.fromCodePoint(cp);
      }
      return out;
    }
  }
  g.TextDecoder = Utf8Decoder;
}

// GLTFLoader sniffs navigator.userAgent for Safari/Firefox quirks; React Native has none.
function ensureUserAgent() {
  const g = globalThis as { navigator?: { userAgent?: string } };
  if (g.navigator && typeof g.navigator.userAgent !== 'string') g.navigator.userAgent = 'ReactNative';
}

/** Soft, matte "clay" response for the vertex-colored parts; eyes stay glossy. */
function tuneMaterial(mesh: Mesh) {
  const glossy = /^(iris_|pupil_|eye_white|eye_glint)/.test(mesh.name);
  const tune = (m: Material) => {
    if (m instanceof MeshStandardMaterial) {
      m.roughness = glossy ? 0.18 : 0.62;
      m.metalness = 0;
    }
  };
  if (Array.isArray(mesh.material)) mesh.material.forEach(tune);
  else tune(mesh.material);
}

export async function loadAvatarModel(id: AvatarModelId): Promise<AvatarModel> {
  ensureTextDecoder();
  ensureUserAgent();
  const asset = Asset.fromModule(MODELS[id].source);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('Model file is missing');
  const data = await new File(asset.localUri).arrayBuffer();
  const gltf = await new GLTFLoader().parseAsync(data, '');

  // Z-up files (height along +z, face toward -y) are stood up for three.js (Y-up).
  const upright = new Group();
  if (MODELS[id].zUp) upright.rotation.x = -Math.PI / 2;
  upright.add(gltf.scene);
  const root = new Group();
  root.add(upright);
  root.updateMatrixWorld(true);

  const box = new Box3().setFromObject(root);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  upright.position.set(-center.x, -box.min.y, -center.z);

  const parts = {
    body: new Map(),
    face: new Map(),
    hair: new Map(),
    top: new Map(),
    bottom: new Map(),
    shoes: new Map(),
    accessory: new Map(),
  } as Record<AvatarPartSlot, Map<string, Mesh>>;
  const bones = new Map<string, Bone>();
  gltf.scene.traverse((o: Object3D) => {
    if (o instanceof Bone) bones.set(o.name, o);
    if (o instanceof Mesh) {
      tuneMaterial(o);
      parts[slotOf(o.name)].set(o.name, o);
    }
  });
  return { root, parts, height: size.y, width: Math.max(size.x, size.z), bones };
}

/**
 * Swaps every skinned mesh for a plain one in its rest pose (same geometry and
 * material). For GPUs that are slow at skinning, like the iOS Simulator: the
 * figure looks the same, it just can't move. Returns how many were swapped.
 */
export function freezePose(model: AvatarModel): number {
  const swaps: [SkinnedMesh, Mesh][] = [];
  model.root.traverse((o) => {
    if (o instanceof SkinnedMesh) {
      const plain = new Mesh(o.geometry, o.material);
      plain.name = o.name;
      plain.position.copy(o.position);
      plain.quaternion.copy(o.quaternion);
      plain.scale.copy(o.scale);
      swaps.push([o, plain]);
    }
  });
  for (const [skinned, plain] of swaps) {
    skinned.parent?.add(plain);
    skinned.parent?.remove(skinned);
    model.parts[slotOf(plain.name)].set(plain.name, plain);
  }
  return swaps.length;
}
