'use client';

/**
 * Marketing-only button. Forked from components/ui/Button.tsx, which is imported
 * by 26 ERP files and must not be restyled in place.
 *
 * This is the ONE primary-CTA style for the homepage — every filled
 * brand-gradient button (Hero, Services bottom strip, FAQ bottom strip) renders
 * through this component, so they are provably identical rather than three
 * hand-copied instances that drift apart over edits.
 *
 * Motion follows apple-design:
 *  §1  feedback fires on pointer-DOWN, not release — whileTap is instant
 *  §2  primary variant is magnetic — it leans toward the pointer as it
 *      approaches (direct manipulation), via the same useMagnetic hook the
 *      hero already used, so the interaction language is consistent site-wide
 *  §4  critically damped spring (bounce 0) — no overshoot on a non-thrown control
 *  §12 the sheen sweep on hover materializes like light catching a real
 *      surface, rather than a flat colour swap
 *  §14 press-scale, magnetic pull and the sheen all drop under
 *      prefers-reduced-motion
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { springSnappy } from './motion';
import { useMagnetic } from './useMagnetic';

type Variant = 'primary' | 'secondary';

interface XluButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: Variant;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
  magnetic?: boolean;
  'aria-label'?: string;
}

const base =
  'xlu-pressable inline-flex items-center justify-center gap-2 rounded-full font-semibold ' +
  'px-8 py-4 text-[1.0625rem] tracking-[-0.01em] cursor-pointer select-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  // Solid brand gradient — the single loudest element on any given screen.
  primary: 'relative overflow-hidden text-white shadow-[0_10px_36px_-12px_rgba(18,229,254,0.55)]',
  // Translucent material, not a competing solid fill (§12).
  secondary: 'text-[var(--xlu-ink)] border border-[var(--xlu-hairline)]',
};

function Sheen({ reduced }: { reduced: boolean | null }) {
  if (reduced) return null;
  return (
    <span
      aria-hidden
      className='pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition-[transform,opacity] duration-500 ease-[var(--xlu-ease-out)] group-hover:translate-x-full group-hover:opacity-100'
      style={{
        background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
      }}
    />
  );
}

export default function XluButton({
  children,
  onClick,
  href,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled = false,
  magnetic = true,
  'aria-label': ariaLabel,
}: XluButtonProps) {
  const reduced = useReducedMotion();
  const mag = useMagnetic<HTMLDivElement>({ radius: 110, strength: 0.24 });
  const applyMagnet = magnetic && variant === 'primary' && !disabled;

  const style =
    variant === 'primary'
      ? { background: 'var(--xlu-brand-gradient)' }
      : {
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'var(--xlu-material-thin)',
          WebkitBackdropFilter: 'var(--xlu-material-thin)',
        };

  const motionProps = {
    whileHover: disabled || reduced ? undefined : { scale: 1.02 },
    whileTap: disabled || reduced ? undefined : { scale: 0.97 },
    transition: springSnappy,
  };

  const cls = `group ${base} ${variants[variant]} ${className}`;
  const sheen = variant === 'primary' ? <Sheen reduced={reduced} /> : null;

  let content: ReactNode;

  if (href) {
    const isInternal = href.startsWith('/') || href.startsWith('#');
    const MotionLink = motion(Link);

    content = isInternal ? (
      <MotionLink href={href} className={cls} style={style} aria-label={ariaLabel} {...motionProps}>
        {sheen}
        <span className='relative inline-flex items-center gap-2'>{children}</span>
      </MotionLink>
    ) : (
      <motion.a
        href={href}
        className={cls}
        style={style}
        aria-label={ariaLabel}
        target='_blank'
        rel='noopener noreferrer'
        {...motionProps}
      >
        {sheen}
        <span className='relative inline-flex items-center gap-2'>{children}</span>
      </motion.a>
    );
  } else {
    content = (
      <motion.button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={cls}
        style={style}
        aria-label={ariaLabel}
        {...motionProps}
      >
        {sheen}
        <span className='relative inline-flex items-center gap-2'>{children}</span>
      </motion.button>
    );
  }

  if (!applyMagnet) return content;

  // Magnetic wrapper carries the pointer-pull offset; the button inside keeps
  // its own press/hover transforms, so the two springs never fight over the
  // same value (apple-design §3: independent, interruptible springs).
  return (
    <motion.div ref={mag.ref} style={{ x: mag.x, y: mag.y, display: 'inline-block' }}>
      {content}
    </motion.div>
  );
}
