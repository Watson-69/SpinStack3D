import { useHddStore, CAMERA_PRESETS, CameraPresetType } from '../store/useHddStore';
import { sound } from './sound';
import { toast } from '../components/ui/Toast';

/** Applies a named camera preset with consistent audio cue and toast notification. */
export function selectCameraPresetWithFeedback(preset: CameraPresetType): void {
  const config = CAMERA_PRESETS[preset];
  if (!config) return;
  useHddStore.getState().applyCameraPreset(preset);
  sound.playUiClick(950, 0.02);
  toast.info(`View: ${config.name}`);
}

/** Toggles exploded disassembly view with audio feedback and status toast. */
export function toggleExplodedWithFeedback(): void {
  const store = useHddStore.getState();
  const wasActive = store.isExploded || store.explodedProgress > 0.05;
  store.toggleExploded();
  sound.playUiClick(900, 0.02);
  toast.info(wasActive ? 'Assembled view' : 'Exploded blueprint view');
}

/** Toggles 7,200 RPM spindle motor simulation with audio feedback and status toast. */
export function toggleSimulateWithFeedback(): void {
  const store = useHddStore.getState();
  const wasSimulating = store.isSimulating;
  store.toggleSimulate();
  sound.playUiClick(1000, 0.03);
  toast.info(wasSimulating ? 'Spindle motor stopped' : 'Spindle active: 7,200 RPM');
}

/** Toggles audio synthesis and notifies current mute state. */
export function toggleSoundWithFeedback(): void {
  const store = useHddStore.getState();
  store.toggleSound();
  const nextEnabled = useHddStore.getState().soundEnabled;
  toast.info(nextEnabled ? 'Audio enabled' : 'Audio muted');
}
