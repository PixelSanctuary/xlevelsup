'use client';

import { useState } from 'react';
import { m as motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import EmojiIcon from '@/components/ui/EmojiIcon';
import { springDefault, revealViewport } from '@/components/marketing/motion';
import XluButton from '@/components/marketing/XluButton';

/**
 * Our Solutions — 2x2 connected grid.
 *
 * The four alternating full-width rows from the previous pass were visually
 * inert (identical layout repeated 4x, ~4 viewport-heights tall) and read as
 * "simple" per the brief. Rebuilt as a compact grid where hovering a card
 * expands it and draws a live connecting line to its diagonal neighbour —
 * ties directly into the connected-node identity running through the rest of
 * the page, and takes roughly half the vertical space.
 *
 * Copy (tag, title, description, cta, href) is unchanged from the source data.
 */

const solutions = [
    {
        id: 1,
        icon: '🏗️',
        tag: 'Core Infrastructure',
        title: 'Custom Software & Web Platforms',
        description:
            'Your digital presence is your most valuable sales asset. We architect frictionless, high-performance web applications and eCommerce platforms engineered to convert at the highest industry benchmarks—built on Next.js, Headless infrastructure, and enterprise-grade cloud.',
        cta: 'Explore Product Engineering',
        href: '/solutions/marketing-architecture',
        accent: 'var(--xlu-brand-1)',
    },
    {
        id: 2,
        icon: '🤖',
        tag: 'Operational Intelligence',
        title: 'AI & Operational Automation',
        description:
            'Every hour your team spends on repetitive tasks is an hour not spent on growth. We replace manual workflows with intelligent, custom-built AI systems—automating lead qualification, CRM operations, and internal processes so your people focus exclusively on high-leverage decisions.',
        cta: 'Explore AI Automation',
        href: '/solutions/ai-automation',
        accent: 'var(--xlu-brand-3)',
    },
    {
        id: 3,
        icon: '📲',
        tag: 'Revenue Engine',
        title: 'Precision Digital Marketing',
        description:
            'We don\'t run ads. We orchestrate algorithmic customer acquisition. Our data-backed performance marketing systems—server-side tracked, creatively engineered, and ROI-measured—turn your marketing spend into a predictable, scalable revenue engine across Meta, Google, and organic channels.',
        cta: 'Explore Growth Marketing',
        href: '/solutions/digital-marketing',
        accent: 'var(--xlu-brand-2)',
    },
    {
        id: 4,
        icon: '🔍',
        tag: 'Authority & Visibility',
        title: 'Search & Authority Engineering',
        description:
            'Digital real estate is finite. We use programmatic content infrastructure, Core Web Vitals optimization, and technical SEO architecture to ensure that when your ideal customers search for solutions—they find you, not your competitors. Compounding, organic, and defensible.',
        cta: 'Explore Search Engineering',
        href: '/solutions/search-engineering',
        accent: 'var(--xlu-brand-4)',
    },
];

export default function Services() {
    const reduced = useReducedMotion();
    const [active, setActive] = useState<number | null>(null);

    const fade = reduced
        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
        : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: springDefault } };

    const cardFade = reduced
        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
        : { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1, transition: springDefault } };

    return (
        <section className='xlu xlu-section relative' id='services'>
            <div className='xlu-container'>
                {/* Header */}
                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={revealViewport}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                    className='mx-auto mb-[var(--xlu-space-xl)] max-w-[42rem] text-center'
                >
                    <motion.p
                        variants={fade}
                        className='mb-4 text-sm font-semibold uppercase tracking-widest'
                        style={{ color: 'var(--xlu-brand-1)' }}
                    >
                        Our Solutions
                    </motion.p>
                    <motion.h2
                        variants={fade}
                        className='mb-4 text-[1.875rem] sm:text-4xl font-bold leading-tight tracking-[-0.02em] md:text-5xl'
                    >
                        Everything Your Business Needs —{' '}
                        <span className='xlu-brand-text'>Design, Web, Marketing & AI Automation</span>
                    </motion.h2>
                    <motion.p variants={fade} className='text-lg' style={{ color: 'var(--xlu-ink-subtle)' }}>
                        Four integrated disciplines. One strategic partner. Built to compound your market position over time.
                    </motion.p>
                </motion.div>

                {/* Connected 2x2 grid */}
                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={revealViewport}
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                    className='relative grid grid-cols-1 gap-3 sm:grid-cols-2'
                    onMouseLeave={() => setActive(null)}
                >
                    {/* Connecting lines between the four nodes — drawn under the cards,
                        brighten toward whichever card is active. Pure SVG, no canvas
                        needed at this scale. */}
                    <svg
                        className='pointer-events-none absolute inset-0 hidden h-full w-full sm:block'
                        aria-hidden='true'
                    >
                        <defs>
                            <linearGradient id='svc-link' x1='0%' y1='0%' x2='100%' y2='100%'>
                                <stop offset='0%' stopColor='var(--xlu-brand-1)' />
                                <stop offset='100%' stopColor='var(--xlu-brand-4)' />
                            </linearGradient>
                        </defs>
                        <line x1='50%' y1='4%' x2='50%' y2='96%' stroke='var(--xlu-hairline)' strokeWidth='1' />
                        <line x1='4%' y1='50%' x2='96%' y2='50%' stroke='var(--xlu-hairline)' strokeWidth='1' />
                        <line
                            x1='4%' y1='4%' x2='96%' y2='96%'
                            stroke='url(#svc-link)' strokeWidth='1.5'
                            style={{
                                opacity: active === 1 || active === 4 ? 0.55 : 0,
                                transition: 'opacity var(--xlu-dur-slow) var(--xlu-ease-out)',
                            }}
                        />
                        <line
                            x1='96%' y1='4%' x2='4%' y2='96%'
                            stroke='url(#svc-link)' strokeWidth='1.5'
                            style={{
                                opacity: active === 2 || active === 3 ? 0.55 : 0,
                                transition: 'opacity var(--xlu-dur-slow) var(--xlu-ease-out)',
                            }}
                        />
                        {/* Junction node at centre — pulses toward the active card's accent */}
                        <circle
                            cx='50%' cy='50%' r='3'
                            fill={solutions.find((s) => s.id === active)?.accent ?? 'var(--xlu-ink-faint)'}
                            style={{ transition: 'fill var(--xlu-dur-slow) var(--xlu-ease-out)' }}
                        />
                    </svg>

                    {solutions.map((s) => {
                        const isActive = active === s.id;
                        const isDimmed = active !== null && !isActive;

                        return (
                            <motion.article
                                key={s.id}
                                variants={cardFade}
                                onMouseEnter={() => setActive(s.id)}
                                onFocus={() => setActive(s.id)}
                                tabIndex={-1}
                                animate={
                                    reduced
                                        ? undefined
                                        : { opacity: isDimmed ? 0.55 : 1, scale: isActive ? 1.015 : 1 }
                                }
                                transition={springDefault}
                                className='group relative z-10 overflow-hidden rounded-2xl border p-[var(--xlu-space-lg)]'
                                style={{
                                    borderColor: isActive
                                        ? `color-mix(in srgb, ${s.accent} 45%, transparent)`
                                        : 'var(--xlu-hairline)',
                                    background: 'var(--xlu-surface-1)',
                                }}
                            >
                                {/* Accent wash — appears only when this card is active */}
                                <div
                                    className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--xlu-dur-slow)] group-hover:opacity-100'
                                    style={{
                                        background: `radial-gradient(circle at 15% 0%, color-mix(in srgb, ${s.accent} 16%, transparent), transparent 62%)`,
                                    }}
                                />

                                <div className='relative flex items-start justify-between gap-4'>
                                    <div className='flex items-center gap-4'>
                                        <EmojiIcon emoji={s.icon} className='h-9 w-9 text-4xl' />
                                        <span
                                            className='rounded-full border border-current/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest'
                                            style={{ color: s.accent }}
                                        >
                                            {s.tag}
                                        </span>
                                    </div>
                                    <span
                                        className='font-mono text-[0.75rem]'
                                        style={{ color: 'var(--xlu-ink-subtle)' }}
                                        aria-hidden
                                    >
                                        0{s.id}
                                    </span>
                                </div>

                                <h3 className='relative mt-[var(--xlu-space-sm)] text-2xl font-bold leading-snug tracking-[-0.015em]'>
                                    {s.title}
                                </h3>

                                {/* Description reveals on hover/focus rather than sitting
                                    permanently open — this is what compresses the section's
                                    resting height while staying fully readable on demand. */}
                                <AnimatePresence initial={false}>
                                    {(isActive || reduced) && (
                                        <motion.div
                                            key='desc'
                                            initial={reduced ? false : { height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={reduced ? undefined : { height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                            className='relative overflow-hidden'
                                        >
                                            <p
                                                className='pt-[var(--xlu-space-sm)]'
                                                style={{ color: 'var(--xlu-ink-muted)' }}
                                            >
                                                {s.description}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <Link
                                    href={s.href}
                                    className='xlu-pressable relative mt-[var(--xlu-space-md)] inline-flex items-center gap-2 text-sm font-semibold'
                                    style={{ color: s.accent }}
                                >
                                    {s.cta}
                                    <svg
                                        className='h-4 w-4 transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        viewBox='0 0 24 24'
                                        aria-hidden='true'
                                    >
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                                    </svg>
                                </Link>
                            </motion.article>
                        );
                    })}
                </motion.div>

                {/* Bottom CTA strip */}
                <motion.div
                    initial='hidden'
                    whileInView='visible'
                    viewport={revealViewport}
                    variants={fade}
                    className='mt-[var(--xlu-space-xl)] flex flex-col items-center gap-[var(--xlu-space-md)] border-t border-[var(--xlu-hairline)] pt-[var(--xlu-space-xl)] text-center sm:flex-row sm:justify-between sm:text-left'
                >
                    <p className='text-[1.0625rem]' style={{ color: 'var(--xlu-ink-muted)' }}>
                        Ready to consolidate your tech stack under one focused partner?
                    </p>

                    {/* Same button component used sitewide — see XluButton for the
                        shared magnetic-pull + sheen treatment (apple-design §2, §12). */}
                    <XluButton href='#contact' variant='primary' className='shrink-0'>
                        Discuss Your Infrastructure
                        <svg
                            className='h-[1.05rem] w-[1.05rem] transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            aria-hidden='true'
                        >
                            <path strokeLinecap='round' strokeLinejoin='round' d='M17 8l4 4m0 0l-4 4m4-4H3' />
                        </svg>
                    </XluButton>
                </motion.div>
            </div>
        </section>
    );
}
