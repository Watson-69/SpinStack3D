import { useEffect, RefObject } from 'react';
import { useHddStore } from '../store/useHddStore';
import { TOOLBAR_CAMERA_PRESETS } from '../data/cameraPresets';
import { toast } from '../components/ui/Toast';
import { sound } from '../utils/sound';
import {
  selectCameraPresetWithFeedback,
  toggleExplodedWithFeedback,
  toggleSimulateWithFeedback,
  toggleSoundWithFeedback,
} from '../utils/viewerActions';

interface UseGlobalShortcutsOptions {
  windowWidth: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (val: boolean) => void;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchInputRef: RefObject<HTMLInputElement>;
}

/**
 * Registers global keyboard navigation and inspection hotkeys matching KeyboardShortcutsModal.
 */
export function useGlobalShortcuts({
  windowWidth,
  isDrawerOpen,
  setIsDrawerOpen,
  setIsCommandPaletteOpen,
  searchInputRef,
}: UseGlobalShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        sound.playUiClick(1000, 0.02);
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const store = useHddStore.getState();

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          store.selectNextPart();
          sound.playUiClick(880, 0.02);
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          store.selectPrevPart();
          sound.playUiClick(880, 0.02);
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          toggleExplodedWithFeedback();
          break;
        case 'f':
        case 'F':
        case 'r':
        case 'R':
          e.preventDefault();
          store.setSelectedPartId(null);
          store.setActiveCameraPreset('reset');
          sound.playUiClick(850, 0.02);
          toast.info('Camera refitted to view');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          toggleSimulateWithFeedback();
          break;
        case 'x':
        case 'X':
          e.preventDefault();
          store.toggleXRayMode();
          sound.playUiClick(820, 0.02);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          store.toggleCalloutPins();
          sound.playUiClick(860, 0.02);
          toast.info(store.showCalloutPins ? 'Callout labels hidden' : 'Callout labels shown');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleSoundWithFeedback();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5': {
          e.preventDefault();
          const preset = TOOLBAR_CAMERA_PRESETS[Number(e.key) - 1];
          if (preset) {
            selectCameraPresetWithFeedback(preset.id);
          }
          break;
        }
        case '/':
          e.preventDefault();
          if (windowWidth < 1200 && !isDrawerOpen) {
            setIsDrawerOpen(true);
          } else {
            searchInputRef.current?.focus();
          }
          break;
        case '?':
          e.preventDefault();
          store.setIsShortcutsModalOpen(true);
          sound.playUiClick(950, 0.02);
          break;
        case 'Escape':
          e.preventDefault();
          store.setSelectedPartId(null);
          store.setIsShortcutsModalOpen(false);
          setIsCommandPaletteOpen(false);
          setIsDrawerOpen(false);
          sound.playUiClick(700, 0.02);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowWidth, isDrawerOpen, setIsDrawerOpen, setIsCommandPaletteOpen, searchInputRef]);
}
