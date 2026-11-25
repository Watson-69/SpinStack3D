import * as THREE from 'three';

export interface PartBoundsResult {
  center: THREE.Vector3;
  size: THREE.Vector3;
  radius: number;
  box: THREE.Box3;
}

interface CachedAnchorData {
  primary: THREE.Object3D;
  localCenter: THREE.Vector3;
  worldSize: THREE.Vector3;
}

const DEFAULT_FALLBACK_SIZE = new THREE.Vector3(0.5, 0.2, 0.5);

/**
 * Encapsulates runtime 3D mesh mappings, union bounding-box calculations,
 * and O(1) cached world-space anchor touchpoints for HDD subsystems.
 */
class HddPartRegistry {
  private readonly primaryMeshes = new Map<string, THREE.Object3D>();
  private readonly partObjects = new Map<string, THREE.Object3D[]>();
  private readonly cachedAnchors = new Map<string, CachedAnchorData>();

  // Scratch math objects reused across frames to eliminate GC pressure
  private readonly _tempBox = new THREE.Box3();
  private readonly _objBox = new THREE.Box3();
  private readonly _worldCenter = new THREE.Vector3();

  public clear(): void {
    this.primaryMeshes.clear();
    this.partObjects.clear();
    this.cachedAnchors.clear();
  }

  public register(partId: string, object: THREE.Object3D, isPrimary: boolean): void {
    let list = this.partObjects.get(partId);
    if (!list) {
      list = [];
      this.partObjects.set(partId, list);
    }
    list.push(object);

    if (isPrimary || !this.primaryMeshes.has(partId)) {
      this.primaryMeshes.set(partId, object);
    }
    this.cachedAnchors.delete(partId);
  }

  /**
   * Precomputes and caches each part's local center relative to its primary mesh
   * so per-frame anchor projection runs in O(1) without scanning vertex buffers.
   */
  public precomputeLocalAnchors(): void {
    this.primaryMeshes.forEach((primary, partId) => {
      this.cacheAnchorForPart(partId, primary);
    });
  }

  private cacheAnchorForPart(partId: string, primary: THREE.Object3D): CachedAnchorData | null {
    if (!primary || !primary.parent) return null;

    const valid = this.computeUnionBox(partId, this._tempBox);
    const worldSize = new THREE.Vector3();

    if (valid) {
      this._tempBox.getCenter(this._worldCenter);
      this._tempBox.getSize(worldSize);
    } else {
      primary.updateMatrixWorld(true);
      primary.getWorldPosition(this._worldCenter);
      worldSize.copy(DEFAULT_FALLBACK_SIZE);
    }

    primary.updateMatrixWorld(true);
    const localCenter = this._worldCenter.clone();
    primary.worldToLocal(localCenter);

    const entry: CachedAnchorData = { primary, localCenter, worldSize };
    this.cachedAnchors.set(partId, entry);
    return entry;
  }

  /**
   * Computes a fresh world-space bounding snapshot for camera framing (used on discrete selection events).
   */
  public getWorldBounds(partId: string): PartBoundsResult | null {
    const valid = this.computeUnionBox(partId, this._tempBox);
    if (!valid) {
      const primary = this.primaryMeshes.get(partId);
      if (!primary) return null;

      primary.updateMatrixWorld(true);
      const center = new THREE.Vector3();
      primary.getWorldPosition(center);
      return {
        center,
        size: DEFAULT_FALLBACK_SIZE.clone(),
        radius: 0.35,
        box: new THREE.Box3().setFromCenterAndSize(center, DEFAULT_FALLBACK_SIZE),
      };
    }

    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    this._tempBox.getCenter(center);
    this._tempBox.getSize(size);

    return {
      center,
      size,
      radius: Math.max(size.x, size.y, size.z) * 0.5,
      box: this._tempBox.clone(),
    };
  }

  /**
   * Zero-allocation O(1) world-space anchor lookup written directly into `outPoint`.
   */
  public getAnchorWorldPoint(partId: string, outPoint: THREE.Vector3): boolean {
    let entry = this.cachedAnchors.get(partId);
    if (!entry) {
      const primary = this.primaryMeshes.get(partId);
      if (!primary) return false;
      entry = this.cacheAnchorForPart(partId, primary) ?? undefined;
      if (!entry) return false;
    }

    if (!entry.primary.parent) return false;
    outPoint.copy(entry.localCenter).applyMatrix4(entry.primary.matrixWorld);
    this.applyAnchorOffset(partId, outPoint, entry.worldSize);
    return true;
  }

  private computeUnionBox(partId: string, targetBox: THREE.Box3): boolean {
    const objects = this.partObjects.get(partId);
    targetBox.makeEmpty();

    if (!objects || objects.length === 0) {
      const single = this.primaryMeshes.get(partId);
      if (!single || !single.parent) return false;
      single.updateMatrixWorld(true);
      targetBox.setFromObject(single);
      return !targetBox.isEmpty();
    }

    let hasValid = false;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (!obj || !obj.parent) continue;
      obj.updateMatrixWorld(true);
      this._objBox.setFromObject(obj);
      if (!this._objBox.isEmpty()) {
        if (!hasValid) {
          targetBox.copy(this._objBox);
          hasValid = true;
        } else {
          targetBox.union(this._objBox);
        }
      }
    }

    return hasValid && !targetBox.isEmpty();
  }

  private applyAnchorOffset(partId: string, outPoint: THREE.Vector3, size: THREE.Vector3): void {
    switch (partId) {
      case 'platters':
        outPoint.x += 0.42;
        outPoint.y += size.y * 0.25;
        break;
      case 'spindle_motor':
        outPoint.y += size.y * 0.35;
        break;
      case 'actuator_arm':
        outPoint.x += 0.12;
        outPoint.y += 0.05;
        break;
      case 'rw_heads':
        outPoint.y += 0.04;
        break;
      case 'top_cover':
        outPoint.y += size.y * 0.4;
        break;
      case 'mounting_screws':
        outPoint.y += size.y * 0.45;
        break;
      case 'pcb_board':
        outPoint.y -= size.y * 0.25;
        break;
      default:
        break;
    }
  }
}

export const hddPartRegistry = new HddPartRegistry();
