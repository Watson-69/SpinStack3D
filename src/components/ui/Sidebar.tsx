import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronRight, BookOpen } from 'lucide-react';
import { useHddStore } from '../../store/useHddStore';
import { HDD_PARTS, LOGICAL_SECTIONS, SECTION_CHAPTERS } from '../../data/hddParts';
import { sound } from '../../utils/sound';

interface SidebarProps {
  className?: string;
  onCloseMobile?: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  onCloseMobile,
  searchInputRef: externalSearchRef,
}) => {
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const setSelectedPartId = useHddStore((s) => s.setSelectedPartId);
  const hoveredPartId = useHddStore((s) => s.hoveredPartId);
  const setHoveredPartId = useHddStore((s) => s.setHoveredPartId);
  const searchQuery = useHddStore((s) => s.searchQuery);
  const setSearchQuery = useHddStore((s) => s.setSearchQuery);

  const localSearchRef = useRef<HTMLInputElement>(null);
  const searchRef = externalSearchRef || localSearchRef;
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
    sound.playUiClick(850, 0.02);
  };

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HDD_PARTS;
    return HDD_PARTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortSubtitle.toLowerCase().includes(q) ||
        p.section.toLowerCase().includes(q) ||
        p.indexNumber.includes(q)
    );
  }, [searchQuery]);

  const groupedSections = useMemo(() => {
    return LOGICAL_SECTIONS.map((section) => ({
      section,
      chapter: SECTION_CHAPTERS[section],
      parts: filteredParts.filter((p) => p.section === section),
    })).filter((group) => group.parts.length > 0);
  }, [filteredParts]);

  const flatVisibleParts = useMemo(() => {
    return groupedSections.flatMap((g) => (collapsedSections.has(g.section) ? [] : g.parts));
  }, [groupedSections, collapsedSections]);

  useEffect(() => {
    if (selectedPartId && itemRefs.current.has(selectedPartId)) {
      itemRefs.current.get(selectedPartId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedPartId]);

  const handleItemKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    const currentIndex = flatVisibleParts.findIndex((p) => p.id === currentId);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      const nextPart = flatVisibleParts[(currentIndex + 1) % flatVisibleParts.length];
      setSelectedPartId(nextPart.id);
      itemRefs.current.get(nextPart.id)?.focus();
      sound.playUiClick(900, 0.02);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      const prevPart =
        flatVisibleParts[(currentIndex - 1 + flatVisibleParts.length) % flatVisibleParts.length];
      setSelectedPartId(prevPart.id);
      itemRefs.current.get(prevPart.id)?.focus();
      sound.playUiClick(900, 0.02);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSearchQuery('');
      onCloseMobile?.();
    }
  };

  return (
    <aside
      className={`h-full flex flex-col bg-page border-r border-line text-ink select-none overflow-hidden ${className}`}
      aria-label="Table of Contents"
    >
      <div className="p-3.5 border-b border-line bg-page shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-accent" />
            <h2 className="font-editorial-title text-xs uppercase tracking-[-0.02em] text-ink">
              Table of Contents
            </h2>
          </div>
          <span className="font-mono-tech text-[10px] text-muted uppercase font-semibold">
            V1.0 // 11 CH.
          </span>
        </div>

        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-muted absolute left-2.5 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="FILTER INDEX..."
            aria-label="Filter chapters"
            className="w-full bg-surface text-xs font-mono text-ink placeholder-muted pl-8 pr-12 py-1.5 border border-line focus:border-accent focus:outline-none transition-colors"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
                className="text-muted hover:text-ink transition-colors p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="manual-tag text-[9px] px-1 py-0 bg-page">/</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4" tabIndex={0} aria-label="Chapters List">
        {groupedSections.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-muted border border-line bg-surface">
            NO CHAPTERS MATCHED &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          groupedSections.map(({ section, chapter, parts }) => {
            const isCollapsed = collapsedSections.has(section);

            return (
              <div key={section} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between text-left py-1 px-1.5 hover:bg-surface transition-colors group"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight
                      className={`w-3 h-3 text-muted shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-90'
                        }`}
                    />
                    <span className="font-mono-tech text-[10.5px] font-bold text-ink uppercase tracking-wider truncate">
                      {chapter.code} — {chapter.title}
                    </span>
                  </div>
                  <span className="font-mono-tech text-[10px] text-muted font-semibold shrink-0 ml-2">
                    {parts.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pl-2 border-l border-line ml-2 mt-1">
                    {parts.map((part) => {
                      const isSelected = selectedPartId === part.id;
                      const isHovered = hoveredPartId === part.id;

                      return (
                        <button
                          key={part.id}
                          ref={(el) => {
                            if (el) itemRefs.current.set(part.id, el);
                            else itemRefs.current.delete(part.id);
                          }}
                          type="button"
                          onClick={() => {
                            setSelectedPartId(part.id);
                            sound.playUiClick(950, 0.02);
                          }}
                          onMouseEnter={() => setHoveredPartId(part.id)}
                          onMouseLeave={() => setHoveredPartId(null)}
                          onKeyDown={(e) => handleItemKeyDown(e, part.id)}
                          aria-selected={isSelected}
                          className={`w-full group text-left px-2.5 py-1.5 transition-colors flex items-baseline justify-between gap-2 border ${isSelected
                            ? 'bg-surface border-accent border-l-[3px] text-ink font-bold'
                            : isHovered
                              ? 'bg-surface border-line text-ink'
                              : 'border-transparent hover:border-line hover:bg-surface/60 text-ink'
                            }`}
                        >
                          <div className="flex items-baseline gap-2 min-w-0 flex-1">
                            <span
                              className={`font-mono-tech text-[11px] font-bold shrink-0 ${isSelected ? 'text-accent' : 'text-muted group-hover:text-ink'
                                }`}
                            >
                              § {part.indexNumber}
                            </span>
                            <span
                              className={`text-[12.5px] truncate leading-snug group-hover:underline underline-offset-4 ${isSelected ? 'font-extrabold text-ink' : 'font-semibold text-ink'
                                }`}
                            >
                              {part.name}
                            </span>
                          </div>

                          <span
                            className={`font-mono-tech text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 border shrink-0 ${isSelected
                              ? 'bg-accent text-accent-ink border-accent font-bold'
                              : 'bg-surface text-muted border-line group-hover:text-ink'
                              }`}
                          >
                            {part.compactTag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-line bg-page shrink-0 flex items-center justify-between">
        <span className="font-mono-tech text-[10px] text-muted">
          <span className="linear-keycap mr-1">J</span>
          <span className="linear-keycap mr-1.5">K</span>
          STEP CHAPTER
        </span>
        <span className="font-mono-tech text-[10px] text-muted">
          <span className="linear-keycap">?</span> HELP
        </span>
      </div>
    </aside>
  );
};
