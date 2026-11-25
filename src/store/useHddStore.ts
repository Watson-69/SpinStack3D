import { create } from 'zustand';
import {
  HDD_PARTS,
  HDD_PART_INDEX_BY_ID,
  isInternalPartId,
} from '../data/hddParts';
import {
  CAMERA_PRESETS,
  CameraPresetConfig,
  CameraPresetType,
} from '../data/cameraPresets';
import { easeInOutCubic, normalizeProgressInput } from '../utils/math';
import { sound } from '../utils/sound';
import type { KnockoutTheme } from '../theme/knockoutTheme';

export { CAMERA_PRESETS };
export type { CameraPresetType, CameraPresetConfig, KnockoutTheme };

export type RpmSpeed = 0 | 60 | 5400 | 7200;

export function syncKnockoutDomTheme(theme: KnockoutTheme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.knockoutTheme = theme;
  }
}

interface HddState {
  isInitialized: boolean;
  isIntroReplay: boolean;
  setInitialized: (val: boolean) => void;
  replayIntro: () => void;

  theme: KnockoutTheme;
  setTheme: (theme: KnockoutTheme) => void;

  selectedPartId: string | null;
  hoveredPartId: string | null;
  setSelectedPartId: (id: string | null) => void;
  setHoveredPartId: (id: string | null) => void;
  selectNextPart: () => void;
  selectPrevPart: () => void;

  isExploded: boolean;
  explodedProgress: number;
  setIsExploded: (val: boolean) => void;
  setExplodedProgress: (val: number) => void;
  toggleExploded: () => void;

  isSimulating: boolean;
  rpm: RpmSpeed;
  setIsSimulating: (val: boolean) => void;
  setRpm: (rpm: RpmSpeed) => void;
  toggleSimulate: () => void;

  showCalloutPins: boolean;
  isXRayMode: boolean;
  soundEnabled: boolean;
  toggleCalloutPins: () => void;
  toggleXRayMode: () => void;
  toggleSound: () => void;

  activeCameraPreset: CameraPresetType;
  cameraRefitNonce: number;
  setActiveCameraPreset: (preset: CameraPresetType) => void;
  requestCameraRefit: () => void;
  applyCameraPreset: (preset: CameraPresetType) => void;

  activeInspectorTab: 'mechanism' | 'specs' | 'failure';
  searchQuery: string;
  isShortcutsModalOpen: boolean;

  setActiveInspectorTab: (tab: 'mechanism' | 'specs' | 'failure') => void;
  setSearchQuery: (query: string) => void;
  setIsShortcutsModalOpen: (val: boolean) => void;
}

/**
 * Encapsulates requestAnimationFrame interpolation for smooth exploded-view transitions.
 */
class ExplodeTransitionController {
  private rafId: number | null = null;

  public cancel(): void {
    if (this.rafId !== null && typeof window !== 'undefined') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public animateTo(target: number, durationMs = 450): void {
    if (typeof window === 'undefined') return;
    this.cancel();

    const clampedTarget = normalizeProgressInput(target);
    const start = useHddStore.getState().explodedProgress;
    if (Math.abs(start - clampedTarget) < 1e-4) {
      applyExplodeSnapshot(clampedTarget);
      return;
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const current = start + (clampedTarget - start) * easeInOutCubic(progress);
      applyExplodeSnapshot(current);

      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(step);
  }
}

const explodeController = new ExplodeTransitionController();

function applyExplodeSnapshot(rawValue: number): void {
  const clamped = normalizeProgressInput(rawValue);
  useHddStore.setState({
    explodedProgress: clamped,
    isExploded: clamped > 0.001,
  });
}

interface InitialQueryConfig {
  skipPreloader: boolean;
  selectedPartId: string | null;
  explodedProgress: number;
  isExploded: boolean;
  preset: CameraPresetType;
  isXRayMode: boolean;
  theme: KnockoutTheme;
}

function parseInitialQueryConfig(): InitialQueryConfig {
  if (typeof window === 'undefined') {
    return {
      skipPreloader: false,
      selectedPartId: null,
      explodedProgress: 0,
      isExploded: false,
      preset: 'isometric',
      isXRayMode: false,
      theme: 'dark',
    };
  }

  const params = new URLSearchParams(window.location.search);
  const explodedFlag = params.has('exploded');
  let progress = explodedFlag ? 1.0 : 0.0;

  if (params.has('explodeVal')) {
    progress = normalizeProgressInput(Number(params.get('explodeVal')));
  } else if (params.has('explodedProgress')) {
    progress = normalizeProgressInput(Number(params.get('explodedProgress')));
  }

  const isExploded = progress > 0.001 || explodedFlag;
  const rawPreset = params.get('preset') as CameraPresetType | null;
  const preset =
    rawPreset && rawPreset in CAMERA_PRESETS
      ? rawPreset
      : isExploded
      ? 'exploded_blueprint'
      : 'isometric';

  const rawTheme = params.get('theme');
  const theme: KnockoutTheme =
    rawTheme === 'light' || rawTheme === 'signal' ? rawTheme : 'dark';

  return {
    skipPreloader: params.has('skipPreloader') || params.has('skipIntro'),
    selectedPartId: params.get('selected'),
    explodedProgress: progress,
    isExploded,
    preset,
    isXRayMode: params.has('xray'),
    theme,
  };
}

const INITIAL_CONFIG = parseInitialQueryConfig();
syncKnockoutDomTheme(INITIAL_CONFIG.theme);

export const useHddStore = create<HddState>((set, get) => ({
  isInitialized: INITIAL_CONFIG.skipPreloader,
  isIntroReplay: false,
  setInitialized: (val) => set({ isInitialized: val, isIntroReplay: false }),
  replayIntro: () => set({ isInitialized: false, isIntroReplay: true }),

  theme: INITIAL_CONFIG.theme,
  setTheme: (theme) => {
    syncKnockoutDomTheme(theme);
    set({ theme });
  },

  selectedPartId: INITIAL_CONFIG.selectedPartId,
  hoveredPartId: null,
  setSelectedPartId: (id) => {
    set({ selectedPartId: id });

    if (isInternalPartId(id)) {
      const { explodedProgress, isXRayMode } = get();
      if (explodedProgress < 0.35 && !isXRayMode) {
        explodeController.animateTo(0.45, 500);
      }
    }
  },
  setHoveredPartId: (id) => set({ hoveredPartId: id }),

  selectNextPart: () => {
    const currentId = get().selectedPartId;
    const currentIndex = currentId ? (HDD_PART_INDEX_BY_ID.get(currentId) ?? -1) : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % HDD_PARTS.length;
    get().setSelectedPartId(HDD_PARTS[nextIndex].id);
  },

  selectPrevPart: () => {
    const currentId = get().selectedPartId;
    const currentIndex = currentId ? (HDD_PART_INDEX_BY_ID.get(currentId) ?? -1) : -1;
    const prevIndex = currentIndex <= 0 ? HDD_PARTS.length - 1 : currentIndex - 1;
    get().setSelectedPartId(HDD_PARTS[prevIndex].id);
  },

  isExploded: INITIAL_CONFIG.isExploded,
  explodedProgress: INITIAL_CONFIG.explodedProgress,

  setIsExploded: (val) => {
    explodeController.cancel();
    set({
      isExploded: val,
      explodedProgress: val ? 1.0 : 0.0,
      activeCameraPreset: val ? 'exploded_blueprint' : 'isometric',
    });
  },

  setExplodedProgress: (val) => {
    if (!Number.isFinite(val)) return;
    explodeController.cancel();
    applyExplodeSnapshot(val);
  },

  toggleExploded: () => {
    explodeController.cancel();
    const { isExploded, explodedProgress } = get();
    const shouldCollapse = isExploded || explodedProgress > 0.05;
    set({
      isExploded: !shouldCollapse,
      explodedProgress: shouldCollapse ? 0.0 : 1.0,
      activeCameraPreset: shouldCollapse ? 'isometric' : 'exploded_blueprint',
    });
  },

  isSimulating: false,
  rpm: 7200,
  setIsSimulating: (val) => set({ isSimulating: val }),
  setRpm: (rpm) => set({ rpm, isSimulating: rpm > 0 }),
  toggleSimulate: () => set((s) => ({ isSimulating: !s.isSimulating })),

  showCalloutPins: true,
  isXRayMode: INITIAL_CONFIG.isXRayMode,
  soundEnabled: true,
  toggleCalloutPins: () => set((s) => ({ showCalloutPins: !s.showCalloutPins })),
  toggleXRayMode: () => set((s) => ({ isXRayMode: !s.isXRayMode })),
  toggleSound: () => {
    const nextEnabled = !get().soundEnabled;
    sound.setMuted(!nextEnabled);
    set({ soundEnabled: nextEnabled });
  },

  activeCameraPreset: INITIAL_CONFIG.preset,
  cameraRefitNonce: 0,
  setActiveCameraPreset: (preset) => set({ activeCameraPreset: preset }),
  requestCameraRefit: () => set((s) => ({ cameraRefitNonce: s.cameraRefitNonce + 1 })),

  applyCameraPreset: (preset) => {
    const config = CAMERA_PRESETS[preset];
    if (!config) return;

    set((state) => ({
      activeCameraPreset: preset,
      selectedPartId: config.selectedPartId,
      isXRayMode: config.clearXRay ? false : state.isXRayMode,
    }));

    if (typeof config.explodedProgress === 'number') {
      const duration = config.explodedProgress >= 0.99 ? 600 : 500;
      explodeController.animateTo(config.explodedProgress, duration);
    }
  },

  activeInspectorTab: 'mechanism',
  searchQuery: '',
  isShortcutsModalOpen: false,

  setActiveInspectorTab: (tab) => set({ activeInspectorTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsShortcutsModalOpen: (val) => set({ isShortcutsModalOpen: val }),
}));

if (typeof window !== 'undefined') {
  (window as unknown as { useHddStore: typeof useHddStore }).useHddStore = useHddStore;
}
