'use client';

import { m as motion, useReducedMotion } from 'framer-motion';
import { springDefault, revealViewport, replayViewport } from '@/components/marketing/motion';

/**
 * Why XLEVELSUP — a vertical convergence funnel.
 *
 * Previous layout (cards left, panel right, dot in a middle column) required
 * runtime DOM measurement to keep the connector aligned, because the two
 * columns had mismatched heights — three separate alignment bugs came from
 * that. This layout is symmetric by construction:
 *
 *   [ problem ] [ problem ] [ problem ]   <- three equal columns
 *        \          |          /
 *         \         |         /           <- lines DRAW downward into
 *              ( junction )                  one glowing node
 *   [        The XLU Advantage        ]   <- full-width unified panel
 *              resolution copy
 *
 * The connector SVG uses a numeric viewBox (0 0 100 100) with
 * preserveAspectRatio="none" — equal grid columns mean the line origins are
 * exactly x=16.67/50/83.33, so no measurement, no refs, no reflow drift.
 * (Path data cannot contain "%" values; that invalid syntax is what broke
 * the earlier horizontal version.) vectorEffect keeps stroke width constant
 * under the non-uniform scale.
 *
 * apple-design:
 *  §1  per-card hover feedback is local and instant (lift + border accent)
 *  §4  critically damped springs throughout — nothing here was "thrown"
 *  §7  motion tells the story spatially: scattered things travel DOWN into
 *      the unified panel, entering along the same axis the eye reads
 *  §14 reduced motion: lines render complete, no draw-in, fades only
 *
 * All copy, icons, and font sizes unchanged.
 */

const problems = [
    {
        icon: '🧩',
        text: 'Slow, outdated websites that bleed traffic and erode trust before a sale is even possible.',
    },
    {
        icon: '⚙️',
        text: 'Manual, repetitive workflows consuming your team\'s time—work that should be handled by intelligent systems.',
    },
    {
        icon: '📣',
        text: 'Disconnected marketing agencies that guess rather than measure, burning budget without a coherent strategy.',
    },
];

const advantages = [
    { icon: '→', label: 'One partner.', sub: 'Software, automation & marketing—unified.' },
    { icon: '→', label: 'Precision over guesswork.', sub: 'Every decision is backed by data and systems.' },
    { icon: '→', label: 'Infrastructure that compounds.', sub: 'Built to scale from day one, not retrofitted.' },
    { icon: '→', label: 'Full-stack accountability.', sub: 'We own outcomes, not just deliverables.' },
];

const stats = [
    { value: '95+', label: 'Lighthouse Score, Every Build' },
    { value: '4+', label: 'Active Business Partners' },
];

// Line origins: centers of three equal grid columns in a 0-100 viewBox.
const FUNNEL_PATHS = [
    'M 16.667 0 C 16.667 62, 50 40, 50 100',
    'M 50 0 L 50 100',
    'M 83.333 0 C 83.333 62, 50 40, 50 100',
];

export default function About() {
    const reduced = useReducedMotion();

    const fade = reduced
        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
        : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: springDefault } };

    // Problem cards keep their slight independent tilts — scattered, not a tidy row.
    const scatter = (i: number) =>
        reduced
            ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
            : {
                  hidden: { opacity: 0, y: -14, rotate: 0 },
                  visible: {
                      opacity: 1,
                      y: 0,
                      // Tilt only applies once the cards sit side by side. In a
                      // single-column mobile stack a rotation has nothing to be
                      // "scattered" against — it just reads as misalignment,
                      // and its bounding box clips against the section's
                      // overflow-hidden.
                      rotate: 0,
                      transition: springDefault,
                  },
              };

    // Desktop-only tilt, applied via a class so it never affects the mobile stack.
    const tiltClass = (i: number) =>
        reduced ? '' : i === 0 ? 'md:-rotate-[1.2deg]' : i === 2 ? 'md:rotate-[1.2deg]' : '';

    const drawLine = reduced
        ? { hidden: { opacity: 0 }, visible: { opacity: 0.6, transition: { duration: 0.25 } } }
        : {
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                  pathLength: 1,
                  opacity: 0.6,
                  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay: 0.25 },
              },
          };

    return (
        <section className='xlu xlu-section relative overflow-hidden' id='about'>
            <div className='xlu-container'>
                {/* Header */}
                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={revealViewport}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                    className='mx-auto mb-[var(--xlu-space-lg)] max-w-[42rem] text-center'
                >
                    <motion.p
                        variants={fade}
                        className='mb-4 text-sm font-semibold uppercase tracking-widest'
                        style={{ color: 'var(--xlu-brand-1)' }}
                    >
                        Why XLEVELSUP
                    </motion.p>
                    <motion.h2
                        variants={fade}
                        className='mb-6 text-[1.875rem] sm:text-4xl font-bold leading-tight tracking-[-0.02em] md:text-5xl'
                    >
                        Fragmented Systems Are{' '}
                        <span className='xlu-brand-text'>Killing Your Growth.</span>
                    </motion.h2>
                    <motion.p variants={fade} className='text-lg leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                        Most businesses are held back by the same silent constraints:
                    </motion.p>
                </motion.div>

                {/* Three scattered problems — replays on re-entry so the whole
                    convergence demonstration restarts, not just the lines. */}
                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={replayViewport}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
                    className='grid gap-4 md:grid-cols-3'
                >
                    {problems.map((p, i) => (
                        <motion.div
                            key={i}
                            variants={scatter(i)}
                            whileHover={reduced ? undefined : { y: -4 }}
                            transition={springDefault}
                            className={`group relative rounded-2xl border p-[var(--xlu-space-md)] transition-transform hover:md:rotate-0 ${tiltClass(i)}`}
                            style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
                        >
                            {/* Hollow "disconnected" node — sits where its line launches */}
                            <span
                                className='absolute -bottom-1 left-1/2 hidden h-2 w-2 -translate-x-1/2 rounded-full border md:block'
                                style={{ borderColor: 'var(--xlu-ink-faint)', background: 'var(--xlu-surface-0)' }}
                                aria-hidden
                            />
                            <div className='mb-3 text-2xl' aria-hidden>{p.icon}</div>
                            <p className='text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                                {p.text}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Convergence funnel — lines travel DOWN into one node */}
                <div className='relative hidden h-24 md:block' aria-hidden>
                    <svg
                        className='h-full w-full'
                        viewBox='0 0 100 100'
                        preserveAspectRatio='none'
                    >
                        <defs>
                            <linearGradient id='xlu-funnel' x1='0%' y1='0%' x2='0%' y2='100%'>
                                <stop offset='0%' stopColor='var(--xlu-hairline)' />
                                <stop offset='100%' stopColor='var(--xlu-brand-1)' />
                            </linearGradient>
                        </defs>
                        {FUNNEL_PATHS.map((d, i) => (
                            <motion.path
                                key={i}
                                d={d}
                                fill='none'
                                stroke='url(#xlu-funnel)'
                                strokeWidth='1.5'
                                strokeDasharray='4 5'
                                vectorEffect='non-scaling-stroke'
                                initial='hidden'
                                whileInView='visible'
                                viewport={replayViewport}
                                variants={drawLine}
                                transition={
                                    reduced
                                        ? undefined
                                        : { ...drawLine.visible.transition, delay: 0.25 + i * 0.1 }
                                }
                            />
                        ))}
                    </svg>

                    {/* Junction node — receives the three lines at the panel's doorstep */}
                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        viewport={replayViewport}
                        variants={{
                            hidden: { scale: 0, opacity: 0 },
                            visible: { scale: 1, opacity: 1, transition: { ...springDefault, delay: 0.9 } },
                        }}
                        className='absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full'
                        style={{ background: 'var(--xlu-brand-1)', boxShadow: '0 0 22px 4px var(--xlu-brand-1)' }}
                    >
                        {!reduced && (
                            <motion.span
                                initial={{ scale: 1, opacity: 0.6 }}
                                whileInView={{ scale: 3, opacity: 0 }}
                                viewport={replayViewport}
                                transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
                                className='absolute inset-0 rounded-full'
                                style={{ background: 'var(--xlu-brand-1)' }}
                            />
                        )}
                    </motion.div>
                </div>

                {/* Unified panel — everything lands here */}
                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={revealViewport}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }}
                    className='relative mt-4 overflow-hidden rounded-3xl border md:mt-0'
                    style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
                >
                    {/* Top-center glow where the node docks — the panel "receives" */}
                    <div
                        className='pointer-events-none absolute inset-x-0 top-0 h-40'
                        style={{
                            background: 'radial-gradient(ellipse 40% 100% at 50% 0%, rgba(18,229,254,0.10), transparent 70%)',
                        }}
                        aria-hidden
                    />

                    <div className='p-[var(--xlu-space-lg)]'>
                        <motion.div variants={fade} className='mb-[var(--xlu-space-lg)] text-center'>
                            <div className='mb-4 text-5xl' aria-hidden>⚡</div>
                            <h3 className='text-2xl font-bold'>The XLU Advantage</h3>
                        </motion.div>

                        <ul className='mx-auto grid max-w-4xl gap-x-[var(--xlu-space-lg)] gap-y-[var(--xlu-space-sm)] sm:grid-cols-2'>
                            {advantages.map((item, i) => (
                                <motion.li
                                    key={i}
                                    variants={fade}
                                    className='group flex items-start gap-3 border-t border-[var(--xlu-hairline)] py-[var(--xlu-space-sm)]'
                                >
                                    <span
                                        className='mt-[0.15rem] font-bold transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'
                                        style={{ color: 'var(--xlu-brand-1)' }}
                                        aria-hidden
                                    >
                                        {item.icon}
                                    </span>
                                    <span style={{ color: 'var(--xlu-ink-muted)' }}>
                                        <span className='font-semibold' style={{ color: 'var(--xlu-ink)' }}>
                                            {item.label}
                                        </span>{' '}
                                        {item.sub}
                                    </span>
                                </motion.li>
                            ))}
                        </ul>

                        {/* Stats — centered row, the panel's proof line */}
                        <div className='mx-auto mt-[var(--xlu-space-lg)] flex max-w-4xl flex-col items-center justify-center gap-[var(--xlu-space-md)] border-t border-[var(--xlu-hairline)] pt-[var(--xlu-space-lg)] sm:flex-row sm:gap-[var(--xlu-space-2xl)]'>
                            {stats.map((s) => (
                                <motion.div key={s.label} variants={fade} className='text-center'>
                                    <div className='xlu-brand-text mb-1 text-3xl font-bold'>{s.value}</div>
                                    <div className='text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                                        {s.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Resolution — the payoff line, copy verbatim */}
                <motion.p
                    initial='hidden'
                    whileInView='visible'
                    viewport={revealViewport}
                    variants={fade}
                    className='mx-auto mt-[var(--xlu-space-lg)] max-w-[46rem] text-center text-lg leading-relaxed'
                    style={{ color: 'var(--xlu-ink-muted)' }}
                >
                    <span className='font-semibold' style={{ color: 'var(--xlu-ink)' }}>
                        We built XLEVELSUP to eliminate this problem entirely.
                    </span>{' '}
                    We are not a vendor—we are your end-to-end technology partner.
                    We design cohesive digital ecosystems where your software, automation,
                    and customer acquisition strategies work{' '}
                    <span className='xlu-brand-text font-semibold'>flawlessly together.</span>
                </motion.p>
            </div>
        </section>
    );
}
