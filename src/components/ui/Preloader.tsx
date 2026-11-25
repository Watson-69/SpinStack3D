import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useHddStore } from '../../store/useHddStore';
import { sound } from '../../utils/sound';

gsap.registerPlugin(useGSAP);

interface PreloaderProps {
  onComplete: () => void;
  onStartExit?: () => void;
}

const DIAGNOSTIC_STEPS = [
  { at: 25, code: '01', label: 'POST RAILS & SPI FIRMWARE' },
  { at: 50, code: '02', label: '7,200 RPM FDB SPINDLE SYNC' },
  { at: 75, code: '03', label: '3.8 NM AIR-BEARING FLY HEIGHT' },
  { at: 100, code: '04', label: 'TMR READ CHANNEL TRACK LOCK' },
] as const;

const LOCKUP_LETTERS = Array.from('HARDDISK');

/**
 * Knockout-inspired GSAP editorial curtain intro.
 * Drives GPU-only transforms (`scaleX`, `yPercent`) and direct DOM refs with zero layout thrash
 * and zero WebGL shader compilation until after the curtain exits.
 */
export const Preloader: React.FC<PreloaderProps> = ({ onComplete, onStartExit }) => {
  const isReplay = useHddStore((s) => s.isIntroReplay);
  const curtainRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const skipBtnRef = useRef<HTMLButtonElement>(null);
  const completedRef = useRef(false);
  const onStartExitRef = useRef(onStartExit);
  onStartExitRef.current = onStartExit;

  const [ready, setReady] = useState(false);

  const exitCurtain = useCallback(
    (immediate = false) => {
      if (completedRef.current) return;
      completedRef.current = true;
      onStartExitRef.current?.();
      sound.playUiClick(1150, 0.04);

      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (immediate || prefersReduced || !curtainRef.current) {
        onComplete();
        return;
      }

      gsap.to(curtainRef.current, {
        yPercent: -100,
        duration: 0.52,
        ease: 'power3.inOut',
        force3D: true,
        onComplete,
      });
    },
    [onComplete]
  );

  useEffect(() => {
    if (isReplay) {
      skipBtnRef.current?.focus({ preventScroll: true });
    }
  }, [isReplay]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        exitCurtain(true);
        return;
      }
      if (ready && ['Enter', ' ', 'ArrowDown', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        exitCurtain(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [ready, exitCurtain]);

  useGSAP(
    () => {
      const root = curtainRef.current;
      if (!root) return;

      const setStepActive = (val: number) => {
        for (let i = 0; i < DIAGNOSTIC_STEPS.length; i++) {
          const el = stepRefs.current[i];
          if (!el) continue;
          const active = val >= DIAGNOSTIC_STEPS[i].at;
          el.style.opacity = active ? '1' : '0.42';
          el.style.borderColor = active ? 'currentColor' : 'rgba(56, 39, 38, 0.25)';
        }
      };

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        if (countRef.current) countRef.current.textContent = '100';
        if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
        setStepActive(100);
        setReady(true);
        return;
      }

      const glyphs = root.querySelectorAll('.knockout-curtain-glyph-ink');
      const counter = { value: 0 };
      let lastMilestone = 0;

      const tl = gsap.timeline();

      tl.fromTo(
        glyphs,
        { yPercent: 112 },
        {
          yPercent: 0,
          duration: 0.44,
          stagger: 0.028,
          ease: 'expo.out',
          force3D: true,
        },
        0
      );

      if (barRef.current) {
        tl.fromTo(
          barRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.85,
            ease: 'power2.out',
            force3D: true,
          },
          0.03
        );
      }

      tl.to(
        counter,
        {
          value: 100,
          duration: 0.85,
          ease: 'power2.out',
          onUpdate: () => {
            const val = Math.floor(counter.value);
            if (countRef.current) {
              countRef.current.textContent = String(val).padStart(3, '0');
            }
            const nextMilestone =
              val >= 100 ? 100 : val >= 75 ? 75 : val >= 50 ? 50 : val >= 25 ? 25 : 0;
            if (nextMilestone > lastMilestone) {
              lastMilestone = nextMilestone;
              setStepActive(nextMilestone);
            }
          },
          onComplete: () => {
            if (countRef.current) countRef.current.textContent = '100';
            setStepActive(100);
            setReady(true);
          },
        },
        0.03
      );

      return () => {
        tl.kill();
      };
    },
    { scope: curtainRef }
  );

  return (
    <section
      ref={curtainRef}
      className="knockout-curtain select-none px-4 sm:px-8 will-change-transform"
      data-replay={isReplay ? 'true' : undefined}
      aria-label="Hardware explorer introduction"
      onWheel={(e) => {
        if (ready && e.deltaY > 12) exitCurtain(false);
      }}
    >
      <button
        ref={skipBtnRef}
        type="button"
        onClick={() => exitCurtain(true)}
        className="absolute top-4 right-4 sm:top-7 sm:right-8 inline-flex items-center gap-1.5 min-h-[40px] px-2 text-xs font-extrabold tracking-tight hover:underline underline-offset-4"
        style={{ color: 'var(--intro-ui)' }}
      >
        <span>Skip intro</span>
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 sm:gap-6">
        <div
          className="flex items-center justify-between text-[11px] font-mono-tech uppercase tracking-wider opacity-85"
          style={{ color: 'var(--intro-ui)' }}
        >
          <span>MAKING HARDWARE // EDITION (01)</span>
          <span>SFF-8301 3.5&quot; PMR</span>
        </div>

        {/* Knockout Oversized Masked Typographic Lockup */}
        <div className="relative flex items-end gap-2 sm:gap-4 overflow-hidden">
          <h1
            className="m-0 font-editorial-display uppercase tracking-[-0.075em] leading-[0.88]"
            style={{ fontSize: 'clamp(2.85rem, 11vw, 7.6rem)' }}
          >
            {LOCKUP_LETTERS.map((ch, idx) => (
              <span key={idx} className="knockout-curtain-glyph">
                <span className="knockout-curtain-glyph-ink">{ch}</span>
              </span>
            ))}
          </h1>

          <div className="mb-1 sm:mb-3 flex flex-col items-start shrink-0">
            <span className="text-[11px] sm:text-xs font-extrabold tracking-tight tabular-nums">
              (01)
            </span>
            <span
              ref={countRef}
              className="knockout-curtain-count font-mono-tech text-xs sm:text-sm font-bold tabular-nums opacity-90"
              style={{ color: 'var(--intro-ui)' }}
            >
              000
            </span>
          </div>
        </div>

        {/* Hairline Progress Rule (GPU transform scaleX) */}
        <div className="relative w-full h-[2px] bg-current/20 overflow-hidden">
          <div
            ref={barRef}
            className="h-full w-full origin-left bg-current"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* Subsystem Calibration Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {DIAGNOSTIC_STEPS.map((step, idx) => (
            <div
              key={step.code}
              ref={(el) => {
                stepRefs.current[idx] = el;
              }}
              className="border-t pt-2"
              style={{
                borderColor: 'rgba(56, 39, 38, 0.25)',
                opacity: 0.42,
                color: 'var(--intro-ui)',
              }}
            >
              <div className="font-mono-tech text-[10px] font-bold">§ {step.code}</div>
              <div className="font-mono-tech text-[10px] tracking-tight mt-0.5 truncate">
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Enter Action */}
        <div className="flex items-center justify-between pt-2">
          <span
            className="text-xs font-bold tracking-tight max-w-[34ch]"
            style={{ color: 'var(--intro-ui)' }}
          >
            Interactive CAD dissection of platters, air bearings, and voice-coil actuation.
          </span>

          <button
            type="button"
            disabled={!ready}
            onClick={() => exitCurtain(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider border transition-colors"
            style={{
              backgroundColor: ready ? 'var(--cutline-signal)' : 'transparent',
              color: ready ? '#fff0eb' : 'var(--intro-ui)',
              borderColor: ready ? 'var(--cutline-signal)' : 'currentColor',
              opacity: ready ? 1 : 0.5,
            }}
          >
            <span>{ready ? 'Enter 3D Explorer' : 'Calibrating...'}</span>
            <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
