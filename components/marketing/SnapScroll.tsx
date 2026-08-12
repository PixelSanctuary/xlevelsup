'use client';

/**
 * Section snap-scrolling — a minimal, safe implementation.
 *
 * WHY `proximity` AND NOT `mandatory`:
 * `scroll-snap-type: y mandatory` forces the viewport to land on a snap point.
 * That works only while every section fits within the viewport. The moment a
 * section is TALLER than the screen — which "Our Solutions" is on a phone
 * (2x2 grid + header + CTA ≈ 2 screens) — mandatory snap fights the user:
 * they scroll into the middle of the section and get pulled back to its top,
 * making the content unreachable.
 *
 * `proximity` only snaps when the scroll already ends NEAR a boundary, so long
 * sections scroll normally and short ones still click into place. It is the
 * difference between an assist and a trap.
 *
 * Usage — wrap the page and mark the sections that should snap:
 *
 *   <SnapScroll>
 *     <SnapSection>  <Hero />      </SnapSection>
 *     <SnapSection>  <Services />  </SnapSection>
 *   </SnapScroll>
 *
 * apple-design §14: disabled entirely under prefers-reduced-motion, where
 * hijacking the scroll position is exactly the kind of vestibular surprise the
 * setting exists to prevent.
 */

import type { ReactNode } from 'react';

export function SnapScroll({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`xlu-snap ${className}`}>
      <style>{`
        /* Proximity, not mandatory — see the note above. */
        .xlu-snap {
          scroll-snap-type: y proximity;
        }
        .xlu-snap > .xlu-snap-section {
          scroll-snap-align: start;
          /* Stops a snap landing under the fixed navbar. */
          scroll-margin-top: 5rem;
        }
        /* Never hijack scrolling for users who asked for reduced motion. */
        @media (prefers-reduced-motion: reduce) {
          .xlu-snap { scroll-snap-type: none; }
        }
        /* Coarse pointers (touch) get a gentler stop: a section taller than the
           screen must never resist a deliberate swipe. */
        @media (pointer: coarse) {
          .xlu-snap > .xlu-snap-section { scroll-snap-align: none; }
          .xlu-snap > .xlu-snap-section[data-snap-mobile='true'] {
            scroll-snap-align: start;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

export function SnapSection({
  children,
  /**
   * Opt in to snapping on touch devices. Only set this for sections that
   * genuinely fit within a phone viewport — a hero, a single full-bleed
   * panel. Leave it off for anything that scrolls internally.
   */
  snapOnMobile = false,
  className = '',
}: {
  children: ReactNode;
  snapOnMobile?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`xlu-snap-section ${className}`}
      data-snap-mobile={snapOnMobile ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}
