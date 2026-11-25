import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useHddStore } from '../../store/useHddStore';
import { CAMERA_PRESETS } from '../../data/cameraPresets';
import { hddPartRegistry } from './partRegistry';

interface CameraControllerProps {
  controlsRef: React.RefObject<OrbitControlsImpl>;
}

const VIEW_DIR_PCB = new THREE.Vector3(0.55, -0.65, 0.72).normalize();
const VIEW_DIR_SATA = new THREE.Vector3(0.35, -0.45, 0.85).normalize();
const VIEW_DIR_ISO = new THREE.Vector3(0.68, 0.62, 0.72).normalize();

export const CameraController: React.FC<CameraControllerProps> = ({ controlsRef }) => {
  const { camera, invalidate } = useThree();
  const activeCameraPreset = useHddStore((s) => s.activeCameraPreset);
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const cameraRefitNonce = useHddStore((s) => s.cameraRefitNonce);

  const desiredCamPos = useRef(new THREE.Vector3(...CAMERA_PRESETS.isometric.position));
  const desiredTarget = useRef(new THREE.Vector3(...CAMERA_PRESETS.isometric.target));
  const tempCamOffset = useRef(new THREE.Vector3());
  const isTransitioning = useRef(true);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onUserStart = () => {
      isTransitioning.current = false;
    };
    controls.addEventListener('start', onUserStart);
    return () => controls.removeEventListener('start', onUserStart);
  }, [controlsRef]);

  // Whole-assembly camera preset framing when no part is selected (does not hijack orbit during slider drag)
  useEffect(() => {
    if (selectedPartId) return;

    const preset = CAMERA_PRESETS[activeCameraPreset] || CAMERA_PRESETS.isometric;
    const explode = useHddStore.getState().explodedProgress;
    const distScale = 1.0 + explode * 0.35;

    if (
      activeCameraPreset === 'isometric' ||
      activeCameraPreset === 'reset' ||
      activeCameraPreset === 'exploded_blueprint'
    ) {
      desiredCamPos.current.set(
        preset.position[0] * distScale,
        preset.position[1] * distScale + explode * 0.45,
        preset.position[2] * distScale
      );
      desiredTarget.current.set(
        preset.target[0],
        preset.target[1] + explode * 0.25,
        preset.target[2]
      );
    } else {
      desiredCamPos.current.set(...preset.position);
      desiredTarget.current.set(...preset.target);
    }

    isTransitioning.current = true;
    invalidate();
  }, [activeCameraPreset, selectedPartId, cameraRefitNonce, invalidate]);

  // Dynamic part-bounds framing when a component is selected
  useEffect(() => {
    if (!selectedPartId) return;

    const bounds = hddPartRegistry.getWorldBounds(selectedPartId);
    if (!bounds) return;

    const persCam = camera as THREE.PerspectiveCamera;
    const fovRad = ((persCam.fov || 42) * Math.PI) / 180;
    const aspect = persCam.aspect || 1.6;
    const halfFovV = fovRad / 2;
    const halfFovH = Math.atan(Math.tan(halfFovV) * aspect);
    const minHalfFov = Math.min(halfFovV, halfFovH);

    const fitDist = bounds.radius / Math.sin(minHalfFov);
    const explodeFactor = 1.0 + useHddStore.getState().explodedProgress * 0.65;
    const targetDist = THREE.MathUtils.clamp(fitDist * 1.8 * explodeFactor, 3.2, 8.5);

    const viewDir =
      selectedPartId === 'pcb_board'
        ? VIEW_DIR_PCB
        : selectedPartId === 'sata_connector'
        ? VIEW_DIR_SATA
        : VIEW_DIR_ISO;

    tempCamOffset.current.copy(viewDir).multiplyScalar(targetDist);
    desiredTarget.current.copy(bounds.center);
    desiredCamPos.current.copy(bounds.center).add(tempCamOffset.current);
    isTransitioning.current = true;
    invalidate();
  }, [selectedPartId, cameraRefitNonce, camera, invalidate]);

  useFrame((state, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls || !isTransitioning.current) return;

    const delta = Math.min(rawDelta, 0.05);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamPos.current.x, 5.0, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamPos.current.y, 5.0, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamPos.current.z, 5.0, delta);

    controls.target.x = THREE.MathUtils.damp(controls.target.x, desiredTarget.current.x, 5.0, delta);
    controls.target.y = THREE.MathUtils.damp(controls.target.y, desiredTarget.current.y, 5.0, delta);
    controls.target.z = THREE.MathUtils.damp(controls.target.z, desiredTarget.current.z, 5.0, delta);

    controls.update();

    const distPos = camera.position.distanceTo(desiredCamPos.current);
    const distTarget = controls.target.distanceTo(desiredTarget.current);
    if (distPos < 0.015 && distTarget < 0.015) {
      isTransitioning.current = false;
    } else {
      state.invalidate();
    }
  });

  return null;
};
