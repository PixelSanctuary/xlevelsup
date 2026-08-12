'use client';

/**
 * Shared primitives for the /solutions/* "technical document" layout.
 *
 * These exist so FIG. 01–04 can be reordered or reused on other solutions
 * pages without copying markup. Everything reads from the existing --xlu-*
 * tokens; the only additions to the token layer are the blueprint grid and
 * corner brackets, which had no equivalent.
 */

import type { ReactNode } from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import { springDefault, revealViewport } from '@/components/marketing/motion';

/** Mono eyebrow used for real figure references (FIG. 01) and section labels. */
export function FigLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className='inline-flex items-center gap-2 text-[0.7rem] uppercase'
      style={{
        fontFamily: 'var(--xlu-font-mono)',
        letterSpacing: '0.18em',
        color: 'var(--xlu-ink-subtle)',
      }}
    >
      <span
        aria-hidden
        className='h-1.5 w-1.5 rounded-full'
        style={{ background: 'var(--xlu-brand-1)' }}
      />
      {children}
    </span>
  );
}

/**
 * Corner brackets — thin L-shaped rules at the panel corners. Reads as a
 * technical drawing frame rather than a card border. Hidden below md, where
 * they crowd the content rather than framing it.
 */
export function CornerBrackets({ all = false }: { all?: boolean }) {
  const arm = 'absolute hidden md:block';
  const line = { borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 45%, transparent)' };
  return (
    <span aria-hidden>
      <span className={`${arm} right-0 top-0 h-5 w-5 border-r border-t`} style={line} />
      {all && (
        <>
          <span className={`${arm} left-0 top-0 h-5 w-5 border-l border-t`} style={line} />
          <span className={`${arm} left-0 bottom-0 h-5 w-5 border-b border-l`} style={line} />
          <span className={`${arm} right-0 bottom-0 h-5 w-5 border-b border-r`} style={line} />
        </>
      )}
    </span>
  );
}

/** Blueprint grid — 48px cyan lines at ~4% opacity, masked so it fades out. */
export function BlueprintGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(color-mix(in srgb, var(--xlu-brand-1) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--xlu-brand-1) 5%, transparent) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black, transparent)',
      }}
    />
  );
}

/**
 * A numbered figure section. Scroll-reveals as one unit (fade + slight rise),
 * respecting reduced motion.
 */
export function FigureSection({
  label,
  title,
  intro,
  children,
  id,
}: {
  label?: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      id={id}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={revealViewport}
      transition={reduced ? { duration: 0.25 } : springDefault}
      className='xlu-section'
    >
      {/* Header sits closer to its content — 2.5rem left a visible gap between
          the intro line and the panel below it. */}
      <div className='mb-[var(--xlu-space-md)]'>
        {label && <FigLabel>{label}</FigLabel>}
        <h2
          className={`text-[1.625rem] sm:text-3xl font-bold tracking-[-0.02em] md:text-4xl ${label ? 'mt-4' : ''}`}
        >
          {title}
        </h2>
        {intro && (
          <p
            className='mt-3 text-lg leading-relaxed'
            style={{ color: 'var(--xlu-ink-muted)', maxWidth: 'var(--xlu-measure)' }}
          >
            {intro}
          </p>
        )}
      </div>
      {children}
    </motion.section>
  );
}
