'use client';

/**
 * XLevelsUp preloader — level-up counter → wordmark reveal.
 *
 * Plays once per session on the marketing site, before the hero is revealed.
 *
 * Sequence (total ~2.9s):
 *   0.00s  counter 0→100% over 1.5s, ease-out cubic (decelerates into 100)
 *   1.50s  hold 400ms at a visible 100% — the readable beat
 *   1.90s  counter/bar/caption fade + scale(0.9) out over 300ms
 *   1.90s  wordmark bursts in: scale 0.7 → 1.08 → 1.0 over 500ms
 *   1.90s  radial glow: scale 0.6 → 1.7, opacity 0 → 0.85 → 0 over 600ms
 *   2.40s  hold on wordmark 450ms
 *   2.85s  whole preloader fades out over --xlu-dur-slow (420ms)
 *
 * apple-design:
 *  §11 rAF drives the counter (never setInterval) and only transform/opacity
 *      animate, so the sequence stays smooth and causes no layout shift.
 *  §14 prefers-reduced-motion: no counter, wordmark shown immediately at full
 *      scale/opacity, exit cut to --xlu-dur-fast.
 *
 * All colour and timing values reference the existing --xlu-* tokens.
 */

import { useEffect, useRef, useState } from 'react';

const COUNT_MS = 900;
const HOLD_100_MS = 250;
const SWAP_MS = 250;   // counter fade+scale out — runs concurrently with BURST_MS
const BURST_MS = 400;  // wordmark scale 0.7 → 1.08 → 1.0
const WORDMARK_HOLD_MS = 300;
const EXIT_MS = 350;   // must match --xlu-dur-slow
const SESSION_KEY = 'xlu-preloader-played';

type Phase = 'counting' | 'wordmark' | 'exiting' | 'done';

export default function Preloader() {
  // `null` = undecided (first client render, before we can read sessionStorage).
  // Rendering nothing until we know avoids a flash of the preloader on repeat
  // visits and keeps SSR output identical to the first client paint.
  const [shouldPlay, setShouldPlay] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>('counting');
  const [pct, setPct] = useState(0);
  const rafRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Skip preloader on mobile — mobile CPUs/networks are throttled enough
    // that the preloader overlay blocks the hero LCP for 4-6s on Lighthouse.
    // Mobile visitors benefit more from instant content than the intro sequence.
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
      const alreadyPlayedMobile = sessionStorage.getItem(SESSION_KEY) === '1';
      if (alreadyPlayedMobile) {
        setShouldPlay(false);
        return;
      }
      // Mobile: fast wordmark-only burst (~750ms total), no counter
      setShouldPlay(true);
      sessionStorage.setItem(SESSION_KEY, '1');
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const after = (ms: number, fn: () => void) => {
        timersRef.current.push(setTimeout(fn, ms));
      };
      setPct(100);
      setPhase('wordmark');
      after(300, () => setPhase('exiting'));
      after(650, () => {
        setPhase('done');
        document.body.style.overflow = prevOverflow;
      });
      return () => {
        timersRef.current.forEach(clearTimeout);
        document.body.style.overflow = prevOverflow;
      };
    }

    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === '1';
    if (alreadyPlayed) {
      setShouldPlay(false);
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(prefersReduced);
    setShouldPlay(true);
    sessionStorage.setItem(SESSION_KEY, '1');

    // Lock scroll while the preloader covers the viewport.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const after = (ms: number, fn: () => void) => {
      timersRef.current.push(setTimeout(fn, ms));
    };

    if (prefersReduced) {
      // §14: skip the counter entirely, show the wordmark, exit quickly.
      setPct(100);
      setPhase('wordmark');
      after(WORDMARK_HOLD_MS, () => setPhase('exiting'));
      after(WORDMARK_HOLD_MS + 120, () => {
        setPhase('done');
        document.body.style.overflow = prevOverflow;
      });
      return () => {
        timersRef.current.forEach(clearTimeout);
        document.body.style.overflow = prevOverflow;
      };
    }

    // --- Counter, driven by rAF so timing is frame-rate independent (§11) ---
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_MS);
      // ease-out cubic: decelerates into 100 rather than arriving linearly
      const eased = 1 - Math.pow(1 - p, 3);
      setPct(eased * 100);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPct(100);
        // Hold at a visibly complete 100% before swapping — the readable beat.
        // The counter's fade-out and the wordmark burst run SIMULTANEOUSLY from
        // this point, so the wordmark hold is measured from the end of the
        // 500ms burst, not stacked after the 300ms swap.
        const toWordmark = HOLD_100_MS;                       // 400
        const toExit = toWordmark + BURST_MS + WORDMARK_HOLD_MS; // 400+500+450
        after(toWordmark, () => setPhase('wordmark'));
        after(toExit, () => setPhase('exiting'));
        after(toExit + EXIT_MS, () => {
          setPhase('done');
          document.body.style.overflow = prevOverflow;
        });
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (shouldPlay !== true || phase === 'done') return null;

  const showWordmark = phase === 'wordmark' || phase === 'exiting';
  const exiting = phase === 'exiting';

  return (
    <div
      aria-hidden
      className='xlu-preloader'
      data-exiting={exiting ? 'true' : 'false'}
      data-reduced={reduced ? 'true' : 'false'}
      style={{
        position: 'fixed',
        inset: 0,
        // Must sit ABOVE the navbar, which is also fixed at z-50. At equal
        // z-index the later sibling in the DOM wins, and the navbar renders
        // after this component — so it would paint over the preloader.
        zIndex: 100,
        background: 'var(--xlu-surface-0)',
        display: 'grid',
        placeItems: 'center',
        opacity: exiting ? 0 : 1,
        visibility: exiting ? 'hidden' : 'visible',
        // Never block the page once it starts leaving.
        pointerEvents: exiting ? 'none' : 'auto',
        transition: `opacity ${reduced ? 'var(--xlu-dur-fast)' : 'var(--xlu-dur-slow)'} var(--xlu-ease-out), visibility ${reduced ? 'var(--xlu-dur-fast)' : 'var(--xlu-dur-slow)'} var(--xlu-ease-out)`,
      }}
    >
      <style>{`
        @keyframes xlu-pre-burst {
          0%   { transform: scale(0.7); opacity: 0; }
          62%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes xlu-pre-glow {
          0%   { transform: scale(0.6); opacity: 0; }
          45%  { opacity: 0.85; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        .xlu-pre-wordmark { animation: xlu-pre-burst 500ms var(--xlu-ease-out) both; }
        .xlu-pre-glow     { animation: xlu-pre-glow 600ms var(--xlu-ease-out) both; }
        @media (prefers-reduced-motion: reduce) {
          .xlu-pre-wordmark { animation: none; transform: none; opacity: 1; }
          .xlu-pre-glow     { animation: none; opacity: 0; }
        }
      `}</style>

      {/* --- Counter stage --- */}
      {!showWordmark && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            transform: 'scale(1)',
            opacity: 1,
            transition: `transform ${SWAP_MS}ms ease, opacity ${SWAP_MS}ms ease`,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--xlu-font-display)',
              fontWeight: 700,
              fontSize: '56px',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              background: 'var(--xlu-brand-gradient)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {Math.round(pct)}%
          </div>

          {/* Progress bar — width tracks the counter 1:1 */}
          <div
            style={{
              width: 'min(260px, 60vw)',
              height: '3px',
              borderRadius: '999px',
              background: 'var(--xlu-hairline)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: '999px',
                background: 'var(--xlu-brand-gradient)',
              }}
            />
          </div>

          <div
            style={{
              fontFamily: 'var(--xlu-font-mono)',
              fontSize: '12px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--xlu-ink-muted)',
            }}
          >
            Leveling Up
          </div>
        </div>
      )}

      {/* --- Wordmark stage --- */}
      {showWordmark && (
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <div
            className='xlu-pre-glow'
            style={{
              position: 'absolute',
              width: '22rem',
              height: '22rem',
              maxWidth: '80vw',
              maxHeight: '80vw',
              borderRadius: '9999px',
              filter: 'blur(18px)',
              background: 'radial-gradient(circle, rgba(18,229,254,0.25) 0%, rgba(139,115,248,0.22) 45%, rgba(198,64,255,0.12) 70%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            className='xlu-pre-wordmark'
            style={{
              position: 'relative',
              fontFamily: 'var(--xlu-font-display)',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 7vw, 3.5rem)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              background: 'var(--xlu-brand-gradient)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            XLevelsUp
          </div>
        </div>
      )}
    </div>
  );
}
