'use client';

/**
 * Client leaves for SocialProof — the ONLY parts of that section that need JS.
 *
 * SocialProof itself is a server component: its markup, the 8 client names, the
 * signal rail, the sweep and the marquee track are all static HTML + CSS
 * keyframes, so none of it needs to ship as JavaScript or hydrate.
 *
 * What genuinely needs the client:
 *  - `Reveal`      — whileInView reveals, which require an IntersectionObserver
 *  - `HoverChip`   — the per-chip hover lift
 *  - `reduced`     — prefers-reduced-motion, read at runtime
 *
 * Keeping these as small named leaves means framer-motion is pulled in for a
 * handful of elements instead of the whole 215-line section. The animations are
 * byte-for-byte the same ones that were there before.
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import { springDefault, revealViewport } from '@/components/marketing/motion';
import type { ReactNode } from 'react';

/** Fade-only reveal — used for the section heading. */
export function RevealHeading({
    children,
    className,
    style,
}: {
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={revealViewport}
            transition={{ duration: 0.4 }}
            className={className}
            style={style}
        >
            {children}
        </motion.h2>
    );
}

/**
 * Reduced-motion switch for the strip.
 *
 * §14 behaviour is preserved exactly: under reduced motion the scrolling track
 * never exists in the DOM — we render `fallback` instead, rather than animating
 * something and hiding it.
 */
export function StripSwitch({
    animated,
    fallback,
}: {
    animated: ReactNode;
    fallback: ReactNode;
}) {
    const reduced = useReducedMotion();

    if (reduced) return <>{fallback}</>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={springDefault}
            className='relative py-3'
        >
            {animated}
        </motion.div>
    );
}

/** One partner chip. Hover only ever touches this element's own transform. */
export function HoverChip({
    children,
    hidden,
    className,
    style,
}: {
    children: ReactNode;
    hidden?: boolean;
    className?: string;
    style?: React.CSSProperties;
}) {
    return (
        <motion.span
            aria-hidden={hidden}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className={className}
            style={style}
        >
            {children}
        </motion.span>
    );
}
