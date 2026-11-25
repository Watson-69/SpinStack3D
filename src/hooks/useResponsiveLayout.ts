import { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../utils/sound';

const DESKTOP_DOCK_BREAKPOINT = 1200;
const MOBILE_BREAKPOINT = 768;

/**
 * Encapsulates responsive breakpoint detection, sidebar docking/drawer state,
 * and accessible focus restoration when toggling the mobile navigation drawer.
 */
export function useResponsiveLayout() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );
  const [isSidebarDocked, setIsSidebarDocked] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_DOCK_BREAKPOINT : true
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wasDrawerOpen = useRef(false);

  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const isCompactDesktop = windowWidth >= MOBILE_BREAKPOINT && windowWidth < DESKTOP_DOCK_BREAKPOINT;
  const isLargeDesktop = windowWidth >= DESKTOP_DOCK_BREAKPOINT;

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      if (w >= DESKTOP_DOCK_BREAKPOINT) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      wasDrawerOpen.current = true;
      const timer = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }

    if (wasDrawerOpen.current && windowWidth < DESKTOP_DOCK_BREAKPOINT) {
      wasDrawerOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [isDrawerOpen, windowWidth]);

  const toggleSidebar = useCallback(() => {
    if (windowWidth < DESKTOP_DOCK_BREAKPOINT) {
      setIsDrawerOpen((prev) => !prev);
    } else {
      setIsSidebarDocked((prev) => !prev);
    }
    sound.playUiClick(850, 0.02);
  }, [windowWidth]);

  return {
    windowWidth,
    isMobile,
    isCompactDesktop,
    isLargeDesktop,
    isSidebarDocked,
    isDrawerOpen,
    setIsDrawerOpen,
    toggleSidebar,
    menuButtonRef,
    searchInputRef,
  };
}
