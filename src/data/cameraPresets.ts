export type CameraPresetType =
  | 'isometric'
  | 'platter_macro'
  | 'vcm_actuator'
  | 'pcb_underside'
  | 'exploded_blueprint'
  | 'reset';

export interface CameraPresetConfig {
  id: CameraPresetType;
  code?: string;
  shortLabel: string;
  name: string;
  subtitle: string;
  shortcut?: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  selectedPartId: string | null;
  explodedProgress?: number;
  clearXRay?: boolean;
}

export const CAMERA_PRESETS: Readonly<Record<CameraPresetType, CameraPresetConfig>> = {
  isometric: {
    id: 'isometric',
    code: 'V01',
    shortLabel: 'Hero',
    name: 'Isometric Hero',
    subtitle: 'Default balanced angle',
    shortcut: '1',
    position: [4.8, 4.1, 5.0],
    target: [0, -0.1, 0],
    fov: 38,
    selectedPartId: null,
    explodedProgress: 0.0,
    clearXRay: true,
  },
  platter_macro: {
    id: 'platter_macro',
    code: 'V02',
    shortLabel: 'Platters',
    name: 'Platters & Head Macro',
    subtitle: 'Close-up on PMR media stack',
    shortcut: '2',
    position: [1.6, 1.9, 1.6],
    target: [0.0, 0.2, -0.4],
    fov: 34,
    selectedPartId: 'platters',
    explodedProgress: 0.45,
  },
  vcm_actuator: {
    id: 'vcm_actuator',
    code: 'V03',
    shortLabel: 'Actuator',
    name: 'Voice Coil & Actuator',
    subtitle: 'Close-up on VCM magnets and E-block',
    shortcut: '3',
    position: [-2.2, 1.9, 2.0],
    target: [-0.8, 0.1, 0.6],
    fov: 34,
    selectedPartId: 'voice_coil_motor',
    explodedProgress: 0.45,
  },
  pcb_underside: {
    id: 'pcb_underside',
    code: 'V04',
    shortLabel: 'PCB',
    name: 'PCB & ICs Underside',
    subtitle: 'Inspection of underside electronics',
    shortcut: '4',
    position: [2.8, -2.6, 2.5],
    target: [0, -0.4, 0.4],
    fov: 38,
    selectedPartId: 'pcb_board',
    explodedProgress: 0.2,
  },
  exploded_blueprint: {
    id: 'exploded_blueprint',
    code: 'V05',
    shortLabel: 'Blueprint',
    name: 'Exploded Blueprint',
    subtitle: 'Orthographic separated perspective',
    shortcut: '5',
    position: [5.2, 4.4, 5.4],
    target: [0, 0.4, 0],
    fov: 44,
    selectedPartId: null,
    explodedProgress: 1.0,
  },
  reset: {
    id: 'reset',
    shortLabel: 'Reset',
    name: 'Reset View',
    subtitle: 'Re-centers camera on assembly',
    shortcut: 'F',
    position: [4.8, 4.1, 5.0],
    target: [0, -0.1, 0],
    fov: 38,
    selectedPartId: null,
  },
};

export const TOOLBAR_CAMERA_PRESETS: readonly CameraPresetConfig[] = [
  CAMERA_PRESETS.isometric,
  CAMERA_PRESETS.platter_macro,
  CAMERA_PRESETS.vcm_actuator,
  CAMERA_PRESETS.pcb_underside,
  CAMERA_PRESETS.exploded_blueprint,
];
