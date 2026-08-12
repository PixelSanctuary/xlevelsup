'use client';

/**
 * The Vitals — Lighthouse dials, restyled onto the --xlu-* system.
 *
 * Previously this was the one section still on the legacy theme: `.glass`,
 * the old --cyan/--purple gradient and hardcoded green-400. That made it read
 * as a different page. It now uses the same console framing and material
 * surfaces as the request-path diagram, and the connected-node rail that runs
 * through the rest of the site.
 *
 * Scores are green because a Lighthouse 100 is green — that is the tool's own
 * semantics, not decoration, so the colour stays. Everything around it moves
 * onto the brand system.
 *
 * apple-design §12: material weight encodes hierarchy — the dials sit on the
 * heavier surface, the pass strip below is lighter.
 * §14: ring sweep and hover lift both drop under reduced motion.
 *
 * Content unchanged: the four metric names, the four 100 scores, the heading,
 * the subhead and the pass strip are all verbatim.
 */

import { m as motion, useReducedMotion } from 'framer-motion';

const GREEN = '#28C840';
const RADIUS = 40;
const CIRC = 2 * Math.PI * RADIUS;

export default function LighthouseScore() {
    const reduced = useReducedMotion();

    const metrics = [
        { name: 'Performance', score: 100 },
        { name: 'Accessibility', score: 100 },
        { name: 'Best Practices', score: 100 },
        { name: 'SEO', score: 100 },
    ];

    return (
        <div
            className='relative overflow-hidden rounded-2xl border'
            style={{
                borderColor: 'var(--xlu-hairline)',
                background:
                    'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                boxShadow: '0 32px 90px -30px rgba(0,0,0,0.9)',
            }}
        >
            {/* Console chrome, matching the request-path panel */}
            <div
                className='flex items-center gap-3 border-b px-4 py-3'
                style={{ borderColor: 'var(--xlu-hairline)' }}
            >
                <span className='flex gap-1.5' aria-hidden>
                    {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                        <span
                            key={c}
                            className='h-2.5 w-2.5 rounded-full'
                            style={{ background: c, opacity: 0.55 }}
                        />
                    ))}
                </span>
                <span
                    className='text-[0.7rem] uppercase'
                    style={{
                        fontFamily: 'var(--xlu-font-mono)',
                        letterSpacing: '0.16em',
                        color: 'var(--xlu-ink-faint)',
                    }}
                >
                    lighthouse
                </span>
                <span className='ml-auto flex items-center gap-2'>
                    <span className='h-1.5 w-1.5 rounded-full' style={{ background: GREEN }} />
                    <span
                        className='text-[0.7rem]'
                        style={{ fontFamily: 'var(--xlu-font-mono)', color: GREEN }}
                    >
                        4 / 4 passed
                    </span>
                </span>
            </div>

            <div className='p-[var(--xlu-space-lg)]'>
                <div className='mb-[var(--xlu-space-lg)] flex items-center gap-3'>
                    <div
                        className='flex h-12 w-12 items-center justify-center rounded-full'
                        style={{ background: 'var(--xlu-brand-gradient)' }}
                    >
                        <svg
                            className='h-6 w-6 text-[#05050A]'
                            fill='none'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path d='M13 10V3L4 14h7v7l9-11h-7z' />
                        </svg>
                    </div>
                    <div>
                        <h3 className='text-xl font-bold'>Google Lighthouse Vitals</h3>
                        <p className='text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                            All Green. Every Time.
                        </p>
                    </div>
                </div>

                {/* Node rail linking the four dials */}
                <div aria-hidden className='relative mb-4 hidden h-2 md:block'>
                    <div
                        className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
                        style={{
                            background:
                                'linear-gradient(90deg, transparent, var(--xlu-hairline) 12%, var(--xlu-hairline) 88%, transparent)',
                        }}
                    />
                    <div className='relative grid h-full grid-cols-4'>
                        {metrics.map((m) => (
                            <span key={m.name} className='flex items-center justify-center'>
                                <span
                                    className='h-1.5 w-1.5 rounded-full'
                                    style={{ background: GREEN, opacity: 0.75 }}
                                />
                            </span>
                        ))}
                    </div>
                </div>

                <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={metric.name}
                            className='group rounded-xl border p-4 text-center'
                            style={{
                                borderColor: 'var(--xlu-hairline)',
                                background:
                                    'linear-gradient(160deg, var(--xlu-surface-3) 0%, var(--xlu-surface-1) 100%)',
                                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
                            }}
                            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            whileHover={reduced ? undefined : { y: -3 }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: index * 0.08 }}
                        >
                            <div className='relative mx-auto mb-3 h-24 w-24'>
                                <svg className='h-full w-full -rotate-90'>
                                    <circle
                                        cx='48'
                                        cy='48'
                                        r={RADIUS}
                                        stroke='var(--xlu-hairline)'
                                        strokeWidth='7'
                                        fill='none'
                                    />
                                    <motion.circle
                                        cx='48'
                                        cy='48'
                                        r={RADIUS}
                                        stroke={GREEN}
                                        strokeWidth='7'
                                        fill='none'
                                        strokeLinecap='round'
                                        style={{ filter: `drop-shadow(0 0 6px ${GREEN}88)` }}
                                        initial={{
                                            strokeDasharray: CIRC,
                                            strokeDashoffset: reduced ? 0 : CIRC,
                                        }}
                                        whileInView={{ strokeDashoffset: 0 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: reduced ? 0 : 1.4,
                                            ease: [0.22, 1, 0.36, 1] as const,
                                            delay: index * 0.08,
                                        }}
                                    />
                                </svg>
                                <div className='absolute inset-0 flex items-center justify-center'>
                                    <span
                                        className='text-2xl font-bold tabular-nums'
                                        style={{ color: GREEN }}
                                    >
                                        {metric.score}
                                    </span>
                                </div>
                            </div>
                            <p className='text-sm font-medium' style={{ color: 'var(--xlu-ink-muted)' }}>
                                {metric.name}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div
                    className='mt-[var(--xlu-space-md)] rounded-lg border p-4'
                    style={{
                        borderColor: `color-mix(in srgb, ${GREEN} 25%, transparent)`,
                        background: `color-mix(in srgb, ${GREEN} 8%, transparent)`,
                    }}
                >
                    <p className='text-center text-sm' style={{ color: GREEN }}>
                        ✓ Core Web Vitals Passed • ✓ Mobile Optimized • ✓ Production Ready
                    </p>
                </div>
            </div>
        </div>
    );
}
