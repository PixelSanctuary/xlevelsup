'use client';

import { m as motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';
import { springDefault, revealViewport } from '@/components/marketing/motion';

// Client-only canvas — kept out of the SSR bundle so it never delays first paint.
const ConstellationField = dynamic(
    () => import('@/components/marketing/ConstellationField'),
    { ssr: false },
);

/**
 * /about — restyled onto the --xlu-* system.
 *
 * Previously five `.glass` panels on the legacy --cyan/--purple palette.
 * Rebuilt with the site's connected-node identity and the console/material
 * language used across the solutions and work pages.
 *
 * New style element introduced here: the four "Our Approach" items are a
 * SEQUENCE, not a list, so they render as a numbered process rail with a
 * connecting line and step nodes — a variant of the node motif that does not
 * appear elsewhere on the site.
 *
 * Content is untouched. Every heading, paragraph, list item, stat, quote and
 * attribution is verbatim from the original page.
 *
 * apple-design:
 *  §1  hover feedback is instant and local to the step under the pointer
 *  §4  critically damped springs — nothing overshoots
 *  §12 material weight encodes hierarchy: the vision quote is the heaviest
 *      surface on the page, the stat tiles are lighter
 *  §14 all motion degrades to opacity-only under reduced motion
 */

const APPROACH = [
    'Audit existing systems and workflows',
    'Engineer high-performance solutions',
    'Optimize for speed and scalability',
    'Measure, analyze, and iterate',
];

const STATS = [
    { end: 100, suffix: '%', label: 'Code-Based Solutions' },
    { end: 5, suffix: '+', label: 'Active Partners' },
    { end: 95, suffix: '+', label: 'Lighthouse Scores' },
];

export default function AboutPage() {
    const reduced = useReducedMotion();

    const rise = {
        initial: reduced ? { opacity: 0 } : { opacity: 0, y: 20 },
        whileInView: reduced ? { opacity: 1 } : { opacity: 1, y: 0 },
        viewport: revealViewport,
        transition: reduced ? { duration: 0.25 } : springDefault,
    };

    return (
        <main className='xlu min-h-screen'>
            <div className='xlu-container'>
                {/* ============ HERO ============ */}
                <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)] text-center'>
                    <BlueprintGrid />
                    <ConstellationField className='pointer-events-none absolute inset-0 h-full w-full' />
                    <div
                        aria-hidden
                        className='pointer-events-none absolute inset-0'
                        style={{
                            background:
                                'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 40%, var(--xlu-surface-0) 100%)',
                        }}
                    />
                    <CornerBrackets />

                    <motion.div
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={reduced ? { duration: 0.25 } : springDefault}
                        className='relative mx-auto max-w-3xl'
                    >
                        <h1 className='text-[2.5rem] sm:text-5xl font-bold leading-tight tracking-[-0.02em] md:text-6xl'>
                            The Marketing <span className='xlu-brand-text'>Engineering</span> Philosophy
                        </h1>
                        <p className='mt-6 text-xl leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                            Where coding logic meets creative marketing. We don&apos;t just build—we engineer growth systems.
                        </p>
                    </motion.div>
                </section>

                {/* ============ STORY + APPROACH RAIL ============ */}
                <motion.section
                    {...rise}
                    className='grid items-start gap-[var(--xlu-space-xl)] py-[var(--xlu-space-xl)] lg:grid-cols-[1fr_0.9fr]'
                >
                    <div>
                        <h2 className='text-3xl font-bold tracking-[-0.02em]'>
                            Engineering <span className='xlu-brand-text'>Meets</span> Marketing
                        </h2>
                        <div className='mt-6 space-y-4 text-[1.0625rem] leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                            <p>
                                XLEVELSUP was born from a simple observation: most marketing agencies treat technology as a tool, not a foundation. We flipped that model.
                            </p>
                            <p>
                                Our team doesn&apos;t just understand marketing—we understand code, architecture, databases, APIs, and performance optimization. We analyze your existing workflows, identify bottlenecks, and engineer solutions that scale.
                            </p>
                            <p>
                                Every website we build is optimized for speed. Every campaign we run is backed by data. Every solution we deliver is engineered for measurable, long-term growth.
                            </p>
                        </div>
                    </div>

                    {/* Process rail — the four approach steps as a connected sequence */}
                    <div
                        className='relative overflow-hidden rounded-2xl border'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background:
                                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            boxShadow: '0 28px 70px -30px rgba(0,0,0,0.9)',
                        }}
                    >
                        <div
                            className='flex items-center gap-3 border-b px-4 py-3'
                            style={{ borderColor: 'var(--xlu-hairline)' }}
                        >
                            <span className='text-xl' aria-hidden>⚡</span>
                            <h3 className='text-lg font-bold'>Our Approach</h3>
                        </div>

                        <ol className='relative p-[var(--xlu-space-lg)]'>
                            {/* Connecting line running the length of the sequence */}
                            <span
                                aria-hidden
                                className='absolute left-[calc(var(--xlu-space-lg)+0.6875rem)] top-[calc(var(--xlu-space-lg)+1rem)] bottom-[calc(var(--xlu-space-lg)+1rem)] w-px'
                                style={{
                                    background:
                                        'linear-gradient(180deg, var(--xlu-brand-1), color-mix(in srgb, var(--xlu-brand-3) 60%, transparent))',
                                    opacity: 0.4,
                                }}
                            />

                            {APPROACH.map((step, i) => (
                                <motion.li
                                    key={step}
                                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={revealViewport}
                                    transition={{ ...springDefault, delay: i * 0.08 }}
                                    className='group relative flex items-start gap-4 py-3'
                                >
                                    {/* Step node — numbered, lights on hover */}
                                    <span
                                        aria-hidden
                                        className='relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.6rem] tabular-nums transition-all duration-[var(--xlu-dur-base)] group-hover:scale-110'
                                        style={{
                                            fontFamily: 'var(--xlu-font-mono)',
                                            borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 45%, transparent)',
                                            background: 'var(--xlu-surface-2)',
                                            color: 'var(--xlu-brand-1)',
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    <span
                                        className='pt-0.5 transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'
                                        style={{ color: 'var(--xlu-ink-muted)' }}
                                    >
                                        {step}
                                    </span>
                                </motion.li>
                            ))}
                        </ol>
                    </div>
                </motion.section>

                {/* ============ BY THE NUMBERS ============ */}
                <motion.section {...rise} className='py-[var(--xlu-space-xl)]'>
                    <h2 className='text-center text-3xl font-bold tracking-[-0.02em]'>
                        By The <span className='xlu-brand-text'>Numbers</span>
                    </h2>

                    {/* Node rail linking the three figures */}
                    <div aria-hidden className='relative mx-auto mt-[var(--xlu-space-lg)] hidden h-2 max-w-3xl md:block'>
                        <div
                            className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
                            style={{
                                background:
                                    'linear-gradient(90deg, transparent, var(--xlu-hairline) 12%, var(--xlu-hairline) 88%, transparent)',
                            }}
                        />
                        <div className='relative grid h-full grid-cols-3'>
                            {STATS.map((s, i) => (
                                <span key={s.label} className='flex items-center justify-center'>
                                    <span
                                        className='h-1.5 w-1.5 rounded-full'
                                        style={{ background: 'var(--xlu-brand-1)', opacity: i === 1 ? 0.9 : 0.55 }}
                                    />
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className='mt-[var(--xlu-space-md)] grid grid-cols-1 gap-3 md:grid-cols-3'>
                        {STATS.map((s, i) => (
                            <motion.div
                                key={s.label}
                                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={revealViewport}
                                transition={{ ...springDefault, delay: i * 0.07 }}
                                whileHover={reduced ? undefined : { y: -3 }}
                                className='group rounded-2xl border p-[var(--xlu-space-lg)] text-center'
                                style={{
                                    borderColor: 'var(--xlu-hairline)',
                                    background:
                                        'linear-gradient(160deg, var(--xlu-surface-3) 0%, var(--xlu-surface-1) 100%)',
                                    boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
                                }}
                            >
                                <div className='xlu-brand-text mb-2 text-5xl font-bold tabular-nums'>
                                    <AnimatedCounter end={s.end} suffix={s.suffix} />
                                </div>
                                <div style={{ color: 'var(--xlu-ink-subtle)' }}>{s.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* ============ THE VISION ============ */}
                <motion.section {...rise} className='py-[var(--xlu-space-xl)]'>
                    <div
                        className='relative mx-auto max-w-4xl overflow-hidden rounded-2xl border'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background:
                                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            boxShadow: '0 32px 90px -30px rgba(0,0,0,0.9)',
                        }}
                    >
                        <CornerBrackets all />

                        {/* Oversized quote mark as a watermark behind the text */}
                        <span
                            aria-hidden
                            className='pointer-events-none absolute -top-8 right-6 select-none text-[10rem] leading-none'
                            style={{ color: 'var(--xlu-brand-1)', opacity: 0.07 }}
                        >
                            &quot;
                        </span>

                        <div className='relative p-[clamp(1.75rem,4vw,3rem)]'>
                            <h2 className='text-3xl font-bold tracking-[-0.02em]'>
                                The <span className='xlu-brand-text'>Vision</span>
                            </h2>

                            <div className='mt-6 space-y-4 text-[1.0625rem] leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                                <p>
                                    &quot;We started XLEVELSUP with a mission: to prove that marketing doesn&apos;t have to be guesswork. When you combine engineering principles with creative strategy, you get something powerful—predictable, scalable growth.&quot;
                                </p>
                                <p>
                                    &quot;Every line of code we write, every campaign we launch, every system we build is designed with one goal: to increase your business reach X times more. That&apos;s not just a tagline—it&apos;s our engineering mandate.&quot;
                                </p>
                            </div>

                            <div
                                className='mt-[var(--xlu-space-lg)] flex items-center gap-4 border-t pt-[var(--xlu-space-md)]'
                                style={{ borderColor: 'var(--xlu-hairline)' }}
                            >
                                <div
                                    className='flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-[#05050A]'
                                    style={{ background: 'var(--xlu-brand-gradient)' }}
                                >
                                    X
                                </div>
                                <div>
                                    <div className='font-bold'>XLEVELSUP Team</div>
                                    <div className='text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                                        Engineering Your Growth
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ============ OUR MISSION ============ */}
                <motion.section {...rise} className='pb-[var(--xlu-space-2xl)]'>
                    <div
                        className='relative mx-auto max-w-3xl overflow-hidden rounded-2xl border p-[clamp(2rem,5vw,3.5rem)] text-center'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background:
                                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            boxShadow: '0 32px 90px -34px rgba(0,0,0,0.9)',
                        }}
                    >
                        <CornerBrackets all />
                        <BlueprintGrid />

                        <div className='relative'>
                            <h2 className='text-4xl font-bold tracking-[-0.02em]'>
                                Our <span className='xlu-brand-text'>Mission</span>
                            </h2>
                            <p
                                className='mx-auto mt-6 text-xl leading-relaxed'
                                style={{ color: 'var(--xlu-ink-muted)' }}
                            >
                                Leverage technology, marketing, and engineering to increase business reach{' '}
                                <span className='xlu-brand-text font-bold'>X times</span> more—where X represents
                                unlimited growth potential tailored to your goals. We build for speed, scalability,
                                and long-term success.
                            </p>
                        </div>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}
