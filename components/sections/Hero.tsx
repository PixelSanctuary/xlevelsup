'use client';

import { useEffect } from 'react';
import { m as motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import XluButton from '@/components/marketing/XluButton';
import HeroAura from '@/components/marketing/HeroAura';
import { useMagnetic } from '@/components/marketing/useMagnetic';
import { springDefault } from '@/components/marketing/motion';

/**
 * Homepage hero — centred, original type scale, depth-layered.
 *
 * Type sizes are unchanged from the pre-revamp build:
 *   h1 text-5xl/md:text-6xl · tagline text-xl/md:text-2xl
 *   body text-lg/md:text-xl · stats text-3xl · labels text-sm
 * Rhythm (mb-6 / mb-4 / mb-12 / mt-20) preserved. Copy untouched.
 *
 * What changed in this pass: the content now participates in the scene's
 * depth instead of sitting flat on it —
 *  - the text block counter-drifts a few px against the pointer while the
 *    aura leads it, so foreground and background separate like real planes
 *  - a breathing halo anchors the headline (opacity-only keyframe)
 *  - the stats sit on a node rail — the same connected-node language as the
 *    About funnel and the constellation, so the theme runs through the copy
 *  - the scroll cue returns (pure decoration, no copy)
 *
 * apple-design:
 *  §1  backdrop + parallax respond continuously to the pointer, settle on stop
 *  §2  CTAs pull toward the pointer (magnetic, via XluButton / useMagnetic)
 *  §3  all springs re-target from live values — interruptible everywhere
 *  §4  critically damped; nothing overshoots because nothing was thrown
 *  §11 transform/opacity only; the LCP heading's text is never gated on JS
 *  §14 parallax, halo, cue and word-stagger all collapse under reduced motion
 */

const STATS = [
  { value: 'X∞', label: 'Scalable Infrastructure' },
  { value: '100%', label: 'Data-Driven Execution' },
  { value: '24/7', label: 'Systems Always On' },
];

// Split so each phrase can settle on its own beat. Whitespace is preserved by
// rendering a trailing space inside every span — the sentence is unchanged.
const HEAD_LEAD = 'Your End-to-End Growth Partner —';
const HEAD_BRAND = 'From Logo Design to AI Automation';

export default function Hero() {
  const reduced = useReducedMotion();

  // The primary CTA's magnetic pull lives inside XluButton itself.
  const secondary = useMagnetic<HTMLDivElement>({ radius: 100, strength: 0.2 });

  // Foreground counter-parallax: the aura's cyan field LEADS the pointer
  // (+x), the content drifts gently AGAINST it (-x). Two planes moving in
  // opposition is what makes the depth read as physical rather than painted.
  // Motion values only — pointer movement never re-renders React.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 42, damping: 26, mass: 1 });
  const sy = useSpring(py, { stiffness: 42, damping: 26, mass: 1 });
  const contentX = useTransform(sx, (v) => v * -9);
  const contentY = useTransform(sy, (v) => v * -6);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [px, py, reduced]);

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  const rise = (delay: number) =>
    reduced
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.25, delay } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { ...springDefault, delay },
        };

  // Word-level reveal. Opacity + a short rise only — never a blur or scale on
  // the LCP text, which would delay perceived paint.
  const wordVariants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
    : {
        hidden: { opacity: 0, y: '0.4em' },
        visible: { opacity: 1, y: '0em', transition: { ...springDefault } },
      };

  // Each word gets a clipping wrapper so it can rise into view from behind its
  // own baseline. The separating space MUST live outside that wrapper —
  // `overflow-hidden` would clip a trailing space, and whitespace between two
  // adjacent inline-blocks collapses to nothing — so it is emitted as an
  // explicit non-breaking space sibling. Without this the headline renders as
  // "YourEnd-to-EndGrowthPartner…".
  const renderWords = (text: string, brand = false) =>
    text.split(' ').map((word, i) => (
      <span key={`${word}-${i}`}>
        <span className='inline-block overflow-hidden align-bottom'>
          <motion.span
            variants={wordVariants}
            className={`inline-block ${brand ? 'xlu-brand-text' : ''}`}
          >
            {word}
          </motion.span>
        </span>
        {' '}
      </span>
    ));

  return (
    <section className='xlu relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4'>
      <style>{`
        @keyframes xlu-halo-breathe {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.8; }
        }
        .xlu-halo { animation: xlu-halo-breathe 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .xlu-halo { animation: none; opacity: 0.55; }
        }
      `}</style>

      <HeroAura />

      <motion.div
        className='relative z-10 mx-auto max-w-5xl text-center'
        style={reduced ? undefined : { x: contentX, y: contentY }}
      >
        {/* Breathing halo — anchors the headline against the drifting field.
            Opacity-only keyframe on a static blurred layer: compositor-cheap. */}
        <div
          aria-hidden
          className='xlu-halo pointer-events-none absolute left-1/2 top-0 -z-10 h-[16rem] w-[42rem] max-w-[92vw] -translate-x-1/2 -translate-y-1/4 rounded-full blur-[110px]'
          style={{
            background:
              'radial-gradient(ellipse, rgba(18,229,254,0.13) 0%, rgba(139,115,248,0.09) 50%, transparent 75%)',
          }}
        />

        {/* H1 — words stagger in, but the text is present in the DOM immediately
            so the LCP element is never gated behind JS. */}
        <motion.h1
          initial='hidden'
          animate='visible'
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
          }}
          className='mb-6 text-[2.5rem] sm:text-5xl font-bold leading-tight tracking-[-0.02em] md:text-6xl'
        >
          {renderWords(HEAD_LEAD)}
          {renderWords(HEAD_BRAND, true)}
        </motion.h1>

        <motion.p
          {...rise(0.42)}
          className='mx-auto mb-4 max-w-3xl text-xl font-light md:text-2xl'
          style={{ color: 'var(--xlu-ink-muted)' }}
        >
          Engineering <span className='xlu-brand-text font-semibold'>X times</span> more growth.
        </motion.p>

        <motion.p
          {...rise(0.48)}
          className='mx-auto mb-12 max-w-3xl text-lg leading-relaxed md:text-xl'
          style={{ color: 'var(--xlu-ink-subtle)' }}
        >
          We build the technology that runs your business—and the marketing engines that scale it.
          XLEVELSUP is your dedicated partner for custom software, AI automation,
          and algorithmic customer acquisition. All under one roof. All engineered to compound.
        </motion.p>

        <motion.div
          {...rise(0.54)}
          className='flex flex-col items-center justify-center gap-4 sm:flex-row'
        >
          {/* XluButton's primary variant is magnetic + sheened by default. */}
          <XluButton onClick={scrollToContact} variant='primary'>
            Architect Your Growth
          </XluButton>

          <motion.div ref={secondary.ref} style={{ x: secondary.x, y: secondary.y }}>
            <Link
              href='/solutions/marketing-architecture'
              className='xlu-pressable group inline-flex items-center justify-center gap-2 rounded-full border border-[var(--xlu-hairline)] px-8 py-4 text-lg font-semibold text-[var(--xlu-ink)] transition-colors duration-[var(--xlu-dur-base)] hover:border-[color-mix(in_srgb,var(--xlu-brand)_45%,transparent)]'
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'var(--xlu-material-thin)',
                WebkitBackdropFilter: 'var(--xlu-material-thin)',
              }}
            >
              View Our Solutions
              <svg
                className='h-5 w-5 transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats on a node rail — the same connected-node language as the About
            funnel: a hairline with three nodes, one above each stat column. */}
        <div className='mx-auto mt-20 max-w-2xl'>
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className='mb-6 hidden h-3 w-full sm:block'
            viewBox='0 0 100 10'
            preserveAspectRatio='none'
            aria-hidden='true'
          >
            <line
              x1='8' y1='5' x2='92' y2='5'
              stroke='var(--xlu-hairline)'
              strokeWidth='1'
              vectorEffect='non-scaling-stroke'
            />
            {[16.667, 50, 83.333].map((cx) => (
              <circle key={cx} cx={cx} cy='5' r='1.6' fill='var(--xlu-brand-1)' opacity='0.8' />
            ))}
          </motion.svg>

          <motion.dl
            initial='hidden'
            animate='visible'
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07, delayChildren: 0.62 } },
            }}
            className='grid grid-cols-3 gap-8'
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={
                  reduced
                    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                    : {
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0, transition: springDefault },
                      }
                }
                className='group text-center'
              >
                <dt className='sr-only'>{s.label}</dt>
                <dd>
                  <div className='xlu-brand-text text-3xl font-bold transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:-translate-y-0.5'>
                    {s.value}
                  </div>
                  <div className='mt-1 text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                    {s.label}
                  </div>
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </motion.div>

      {/* Scroll cue — decoration only, no copy (§8: hint the page continues) */}
      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className='pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2'
          aria-hidden
        >
          <div className='h-9 w-[1.35rem] rounded-full border border-[var(--xlu-hairline)]'>
            <motion.span
              animate={{ y: [5, 14, 5], opacity: [0.9, 0.2, 0.9] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className='mx-auto block h-1 w-1 rounded-full'
              style={{ background: 'var(--xlu-brand-1)' }}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
