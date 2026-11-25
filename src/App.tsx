import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useHddStore } from './store/useHddStore';
import { useResponsiveLayout } from './hooks/useResponsiveLayout';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { Preloader } from './components/ui/Preloader';
import { HeaderBar } from './components/ui/HeaderBar';
import { Sidebar } from './components/ui/Sidebar';
import { FocusCard } from './components/ui/FocusCard';
import { CommandPalette } from './components/ui/CommandPalette';
import { KeyboardShortcutsModal } from './components/ui/KeyboardShortcutsModal';
import { ToastContainer } from './components/ui/Toast';

const loadHddCanvasModule = () => import('./components/canvas/HddCanvas');
const LazyHddCanvas = lazy(() =>
  loadHddCanvasModule().then((m) => ({ default: m.HddCanvas }))
);

export const App: React.FC = () => {
  const isInitialized = useHddStore((s) => s.isInitialized);
  const setInitialized = useHddStore((s) => s.setInitialized);
  const setIsShortcutsModalOpen = useHddStore((s) => s.setIsShortcutsModalOpen);

  const {
    windowWidth,
    isMobile,
    isLargeDesktop,
    isSidebarDocked,
    isDrawerOpen,
    setIsDrawerOpen,
    toggleSidebar,
    menuButtonRef,
    searchInputRef,
  } = useResponsiveLayout();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(() =>
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).has('commandPalette')
      : false
  );

  // Mount shell panels right when curtain begins rising; mount WebGL canvas only after curtain finishes exiting
  const [showShell, setShowShell] = useState(isInitialized);
  const [hasEnteredOnce, setHasEnteredOnce] = useState(isInitialized);

  useEffect(() => {
    if (isInitialized) {
      if (!showShell) setShowShell(true);
      if (!hasEnteredOnce) setHasEnteredOnce(true);
    }
  }, [isInitialized, showShell, hasEnteredOnce]);

  const handleStartExit = useCallback(() => {
    setShowShell(true);
  }, []);

  useGlobalShortcuts({
    windowWidth,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsCommandPaletteOpen,
    searchInputRef,
  });

  return (
    <div className="relative w-full max-w-full h-screen bg-page font-sans text-ink select-none overflow-hidden flex flex-col">
      {!isInitialized && (
        <Preloader
          onStartExit={handleStartExit}
          onComplete={() => setInitialized(true)}
        />
      )}

      {showShell && (
        <>
          <HeaderBar
            onToggleSidebar={toggleSidebar}
            isSidebarOpenMobile={isDrawerOpen}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            menuButtonRef={menuButtonRef}
          />

          <div className="flex-1 min-h-0 w-full flex overflow-hidden relative">
            {isLargeDesktop && isSidebarDocked && (
              <div className="w-[272px] xl:w-[304px] h-full shrink-0 z-10 border-r border-line bg-page">
                <Sidebar searchInputRef={searchInputRef} />
              </div>
            )}

            <main className="flex-1 h-full min-w-0 relative bg-[var(--canvas-bg)] overflow-hidden">
              {hasEnteredOnce && (
                <Suspense fallback={null}>
                  <LazyHddCanvas />
                </Suspense>
              )}
            </main>

            {!isMobile ? (
              <div className="w-80 lg:w-[368px] xl:w-[400px] min-w-[320px] max-w-[400px] xl:max-w-[440px] h-full shrink-0 flex-none z-10 border-l border-line bg-page flex flex-col overflow-hidden">
                <FocusCard />
              </div>
            ) : (
              <div className="fixed bottom-0 left-0 right-0 z-20 max-h-[45vh] border-t border-line bg-page shadow-2xl overflow-y-auto">
                <FocusCard />
              </div>
            )}
          </div>

          {isDrawerOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Component Navigation Drawer"
              className="fixed inset-0 z-40 flex"
            >
              <div
                className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
                onClick={() => setIsDrawerOpen(false)}
              />
              <div className="relative z-50 w-72 max-w-[85vw] h-full shadow-2xl">
                <Sidebar
                  searchInputRef={searchInputRef}
                  onCloseMobile={() => setIsDrawerOpen(false)}
                />
              </div>
            </div>
          )}

          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onOpenHelp={() => setIsShortcutsModalOpen(true)}
          />

          <KeyboardShortcutsModal />
        </>
      )}

      <ToastContainer />
    </div>
  );
};

export default App;
