/**
 * XLU marketing motion primitives.
 *
 * Apple's fluid-interface model (WWDC 2018 "Designing Fluid Interfaces"),
 * expressed in framer-motion's `bounce` + `duration` spring API — which maps
 * onto Apple's designer-facing damping + response pair.
 *
 *   damping ratio -> bounce   (damping 1.0 == bounce 0, critically damped)
 *   response      -> duration (NOT a fixed duration; settle time emerges)
 *
 * House rule: critically damped everywhere by default. Bounce is reserved for
 * motion the user physically threw — a flick, a drag release. Overshoot on a
 * menu that merely faded in feels wrong; on a card you flung it feels right.
 *
 * Marketing-only. Nothing here is imported by ERP.
 */

import type { Transition, Variants } from 'framer-motion';

/* -- Springs ---------------------------------------------------------------
   Values Apple ships, transcribed. */

/** Default UI spring: no overshoot. Reposition, reveal, layout shift. */
export const springDefault: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
};

/** Snappier critically-damped spring for small, frequent UI (chips, toggles). */
export const springSnappy: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.3,
};

/** Momentum spring — ONLY after a gesture carried velocity (flick/drag release). */
export const springMomentum: Transition = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.4,
};

/** Drawer / sheet: Apple ships damping 0.8, response 0.3. */
export const springSheet: Transition = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.3,
};

/* -- Momentum projection (§6) ----------------------------------------------
   Project where a flick is GOING, then snap to the target nearest that point.
   This is the exponential-decay form from Apple's sample code — deliberately
   not the textbook v^2/(2a), which does not match iOS feel. */
export function project(initialVelocity: number, decelerationRate = 0.998): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Snap target nearest a projected endpoint. */
export function nearestSnapPoint(projected: number, points: number[]): number {
  return points.reduce((best, p) =>
    Math.abs(p - projected) < Math.abs(best - projected) ? p : best,
  );
}

/* -- Rubber-banding (§9) ---------------------------------------------------
   Progressive resistance past a boundary. A hard stop reads as "frozen";
   continuous resistance reads as "responsive, but there's nothing more here." */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/* -- Scroll reveal ---------------------------------------------------------
   Subtle, not gimmicky. Compositor-friendly properties only (transform +
   opacity), so reveals never cause layout shift or hurt CLS. */

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springDefault },
};

/** Stagger children on section entry. `delayChildren` keeps the first beat calm. */
export function staggerVariants(stagger = 0.07, delayChildren = 0.04): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

/** Standard viewport config: reveal once, slightly before the element lands. */
export const revealViewport = { once: true, margin: '-12% 0px -12% 0px' } as const;

/**
 * Replaying viewport config — the animation resets when the element leaves and
 * plays again on re-entry.
 *
 * Reserved for motion that DEMONSTRATES something rather than just announcing
 * arrival (e.g. the About convergence funnel, where the lines drawing into the
 * junction is the argument the section is making). A plain fade-up should not
 * use this: replaying decoration on every scroll pass is noise, and §6 says
 * every element earns its place.
 */
export const replayViewport = { once: false, margin: '-18% 0px -18% 0px' } as const;

/* -- Reduced motion (§14) --------------------------------------------------
   Reduced motion does not mean NO feedback — it means a gentler, non-vestibular
   equivalent. Drop travel and overshoot; keep the opacity change that carries
   comprehension. Components read this via framer-motion's useReducedMotion(). */
export const revealVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
};

export function reveal(prefersReduced: boolean | null): Variants {
  return prefersReduced ? revealVariantsReduced : revealVariants;
}
