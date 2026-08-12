'use client';

/**
 * Magnetic pull toward the pointer.
 *
 * apple-design §2 (direct manipulation) + §3 (interruptibility):
 * the element tracks the pointer continuously while it is near, and because the
 * position is driven by springs rather than a keyframe timeline, a new pointer
 * position simply re-targets the spring from its live presentation value. Move
 * away mid-flight and it reverses smoothly — no jump, no "brick wall".
 *
 * X and Y are decomposed into independent springs (§3), so diagonal motion does
 * not desync when the two axes carry different velocities.
 */

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useReducedMotion, type MotionValue } from 'framer-motion';

interface MagneticOptions {
  /** How far (px) from the element's edge the field starts acting. */
  radius?: number;
  /** Fraction of the pointer offset the element travels. 0.2 = subtle. */
  strength?: number;
}

export function useMagnetic<T extends HTMLElement>({
  radius = 110,
  strength = 0.22,
}: MagneticOptions = {}): {
  ref: React.RefObject<T | null>;
  x: MotionValue<number>;
  y: MotionValue<number>;
} {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Critically damped (§4): the element settles without overshoot, because the
  // user did not throw it — they merely approached it.
  const x = useSpring(rawX, { stiffness: 260, damping: 28, mass: 0.6 });
  const y = useSpring(rawY, { stiffness: 260, damping: 28, mass: 0.6 });

  useEffect(() => {
    if (reduced) return; // §14 — no vestibular pull under reduced motion

    // Fine pointers only. A magnetic pull is meaningless on touch — there is no
    // hover state to anticipate — and actively harmful: a tap fires
    // pointermove, yanking the control toward the touch point and potentially
    // pushing it past its container's edge. §2 is about tracking a pointer the
    // user is already moving, not displacing a target they are trying to hit.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const onPointerMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Distance to the element's edge, not its centre — a wide button should
      // not need the pointer to reach its middle before responding.
      const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const dist = Math.hypot(edgeX, edgeY);

      if (dist < radius) {
        // Falls off with distance so the pull eases in rather than snapping on.
        const falloff = 1 - dist / radius;
        rawX.set(dx * strength * falloff);
        rawY.set(dy * strength * falloff);
      } else if (rawX.get() !== 0 || rawY.get() !== 0) {
        rawX.set(0);
        rawY.set(0);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [radius, strength, rawX, rawY, reduced]);

  return { ref, x, y };
}
