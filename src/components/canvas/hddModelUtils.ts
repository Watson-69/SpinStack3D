import * as THREE from 'three';
import { getPartById, getPartStaggerWindow } from '../../data/hddParts';
import { hddPartRegistry } from './partRegistry';

/** Scale factor: converts 1 Blender unit (1 mm) to Three.js scene units (147mm -> 4.2 units). */
export const MM_TO_SCENE = 4.2 / 147.0;

export const HDD_MODEL_URL = '/models/hdd/hdd_internals.glb';
export const DRACO_DECODER_PATH = '/draco/';

export const PLATTER_ROTATION_KEYS = [
  'Platter_01',
  'Platter_02',
  'Platter_03',
  'Platter_Clamp',
  'Spindle_Motor',
] as const;

export const ACTUATOR_SEEK_KEYS = [
  'Actuator_Arm',
  'Head_Stack',
  'VCM_Coil',
] as const;

export interface HddComponentEntry {
  name: string;
  object: THREE.Object3D;
  partId: string;
  label: string;
  explodeOffset: THREE.Vector3;
  restPosition: THREE.Vector3;
  staggerWindow: [number, number];
  isCover: boolean;
  isCasting: boolean;
  materials: THREE.MeshStandardMaterial[];
}

const SELECTED_EMISSIVE = new THREE.Color('#ff6255');
const HOVERED_EMISSIVE = new THREE.Color('#ff9288');
const IDLE_EMISSIVE = new THREE.Color(0x000000);

const NAME_TO_PART_ID_RULES: ReadonlyArray<readonly [string[], string]> = [
  [['Cover', 'Filter'], 'top_cover'],
  [['Casting', 'Chassis'], 'chassis'],
  [['Platter', 'Clamp', 'Spacer'], 'platters'],
  [['Spindle'], 'spindle_motor'],
  [['Head'], 'rw_heads'],
  [['VCM', 'Magnet', 'Coil'], 'voice_coil_motor'],
  [['Pivot'], 'pivot_bearing'],
  [['PCB'], 'pcb_board'],
  [['SATA'], 'sata_connector'],
  [['Screw'], 'mounting_screws'],
  [['Ramp'], 'actuator_arm'],
];

const PRIMARY_REPRESENTATIVE_NAMES = [
  'Platter_01',
  'Top_Cover',
  'Actuator_Arm',
  'Head_Stack',
  'Spindle_Motor',
  'PCB',
  'VCM_Coil',
];

function resolveFallbackPartId(name: string, parentName?: string): string {
  const combined = `${name} ${parentName || ''}`;
  for (const [keywords, partId] of NAME_TO_PART_ID_RULES) {
    if (keywords.some((kw) => combined.includes(kw))) {
      return partId;
    }
  }
  return 'actuator_arm';
}

function cloneAndCollectMaterials(root: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const collected: THREE.MeshStandardMaterial[] = [];

  const processMesh = (mesh: THREE.Mesh) => {
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((mat) => {
        const cloned = mat.clone();
        if (cloned instanceof THREE.MeshStandardMaterial) {
          collected.push(cloned);
        }
        return cloned;
      });
    } else {
      const cloned = mesh.material.clone();
      mesh.material = cloned;
      if (cloned instanceof THREE.MeshStandardMaterial) {
        collected.push(cloned);
      }
    }
  };

  if ((root as THREE.Mesh).isMesh) {
    processMesh(root as THREE.Mesh);
  } else {
    root.traverse((descendant) => {
      if ((descendant as THREE.Mesh).isMesh) {
        processMesh(descendant as THREE.Mesh);
      }
    });
  }

  return collected;
}

/**
 * Traverses a loaded glTF HDD scene once, clones per-part materials, registers meshes
 * with `hddPartRegistry`, and returns both the map and a resource disposal function.
 */
export function buildHddComponentMap(rootScene: THREE.Object3D): {
  map: Map<string, HddComponentEntry>;
  dispose: () => void;
} {
  const map = new Map<string, HddComponentEntry>();
  const clonedMaterials: THREE.Material[] = [];
  hddPartRegistry.clear();

  rootScene.traverse((child) => {
    const isTarget =
      (child as THREE.Mesh).isMesh ||
      (child.children.length > 0 && child.parent === rootScene);
    if (!isTarget) return;

    const name = child.name;
    const extras =
      child.userData && Object.keys(child.userData).length > 0
        ? child.userData
        : child.parent?.userData || {};

    const partId: string =
      extras.partId || resolveFallbackPartId(name, child.parent?.name);

    const explodeOffset = new THREE.Vector3();
    if (Array.isArray(extras.explodeOffset) && extras.explodeOffset.length === 3) {
      explodeOffset.set(
        extras.explodeOffset[0],
        extras.explodeOffset[1],
        extras.explodeOffset[2]
      );
    } else {
      const partInfo = getPartById(partId);
      if (partInfo) {
        explodeOffset.set(
          partInfo.explodedOffset[0] / MM_TO_SCENE,
          partInfo.explodedOffset[1] / MM_TO_SCENE,
          partInfo.explodedOffset[2] / MM_TO_SCENE
        );
      }
    }

    const materials = cloneAndCollectMaterials(child);
    clonedMaterials.push(...materials);

    map.set(name, {
      name,
      object: child,
      partId,
      label: extras.label || name,
      explodeOffset,
      restPosition: child.position.clone(),
      staggerWindow: getPartStaggerWindow(partId),
      isCover: name.includes('Cover'),
      isCasting: name.includes('Casting'),
      materials,
    });

    const isPrimary = PRIMARY_REPRESENTATIVE_NAMES.some((key) => name.includes(key));
    hddPartRegistry.register(partId, child, isPrimary);
  });

  const dispose = () => {
    for (const mat of clonedMaterials) {
      mat.dispose();
    }
    hddPartRegistry.clear();
  };

  return { map, dispose };
}

/**
 * Synchronizes PBR roughness, X-Ray/cover ghosting, and emissive highlights declaratively
 * when selection/hover/X-Ray state changes (outside `useFrame`).
 */
export function syncComponentMaterials(
  componentMap: Map<string, HddComponentEntry>,
  params: {
    selectedPartId: string | null;
    hoveredPartId: string | null;
    isXRayMode: boolean;
    shouldGhostCover: boolean;
  }
): void {
  const { selectedPartId, hoveredPartId, isXRayMode, shouldGhostCover } = params;

  componentMap.forEach((comp) => {
    const isSelected = selectedPartId === comp.partId;
    const isHovered = hoveredPartId === comp.partId;

    for (let i = 0; i < comp.materials.length; i++) {
      const mat = comp.materials[i];

      if (comp.isCover) {
        mat.transparent = shouldGhostCover;
        mat.opacity = shouldGhostCover ? (isXRayMode ? 0.22 : 0.15) : 1.0;
        mat.depthWrite = !shouldGhostCover;
        mat.roughness = 0.55;
        mat.metalness = 0.50;
        mat.envMapIntensity = 0.35;
      } else if (comp.isCasting) {
        mat.transparent = isXRayMode;
        mat.opacity = isXRayMode ? 0.22 : 1.0;
        mat.depthWrite = !isXRayMode;
        mat.roughness = 0.68;
        mat.metalness = 0.35;
      }

      if (isSelected) {
        mat.emissive.copy(SELECTED_EMISSIVE);
        mat.emissiveIntensity = 0.45;
      } else if (isHovered) {
        mat.emissive.copy(HOVERED_EMISSIVE);
        mat.emissiveIntensity = 0.25;
      } else {
        mat.emissive.copy(IDLE_EMISSIVE);
        mat.emissiveIntensity = 0;
      }
    }
  });
}

/**
 * Maps an intersected Three.js Object3D up the glTF parent hierarchy to its canonical partId.
 */
export function resolvePartIdFromObject(
  hit: THREE.Object3D | null,
  rootScene: THREE.Object3D,
  decalMesh: THREE.Mesh | null,
  componentMap: Map<string, HddComponentEntry>
): string | null {
  if (!hit) return null;
  if (decalMesh && (hit === decalMesh || hit.parent === decalMesh)) {
    return 'top_cover';
  }

  let cur: THREE.Object3D | null = hit;
  while (cur && cur !== rootScene) {
    if (cur.userData?.partId) return cur.userData.partId;
    const entry = componentMap.get(cur.name);
    if (entry) return entry.partId;
    cur = cur.parent;
  }

  return null;
}

/**
 * Resolves the clicked/hovered partId from R3F pointer event intersections,
 * allowing click-through when the top cover is ghosted/X-Rayed.
 */
export function resolvePointerPartId(
  intersections: ReadonlyArray<{ object: THREE.Object3D }> | undefined,
  fallbackObject: THREE.Object3D | null,
  rootScene: THREE.Object3D,
  decalMesh: THREE.Mesh | null,
  componentMap: Map<string, HddComponentEntry>,
  allowCoverClickThrough: boolean
): string | null {
  if (intersections && intersections.length > 0) {
    let firstMatch: string | null = null;

    for (let i = 0; i < intersections.length; i++) {
      const pid = resolvePartIdFromObject(
        intersections[i].object,
        rootScene,
        decalMesh,
        componentMap
      );
      if (!pid) continue;
      if (!firstMatch) firstMatch = pid;
      if (!allowCoverClickThrough) return pid;
      if (pid !== 'top_cover') return pid;
    }

    return firstMatch;
  }

  return resolvePartIdFromObject(fallbackObject, rootScene, decalMesh, componentMap);
}
