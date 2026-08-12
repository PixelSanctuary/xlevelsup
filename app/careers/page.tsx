'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';
import { springDefault, revealViewport } from '@/components/marketing/motion';

/**
 * /careers — restyled onto the --xlu-* system.
 *
 * Previously `.glass` cards on the legacy --cyan/--purple/orange palette, with
 * three tracks stacked as separate scrolling sections.
 *
 * New style element introduced here: a filterable job board. Ten roles across
 * three tracks is genuinely something a visitor needs to navigate, so the
 * tracks become filters with a live count, and each role renders as a board
 * row rather than a boxed card. The track sections still exist as grouped
 * headers when "All" is selected, so nothing is lost.
 *
 * Content is untouched. All 10 job titles, tags, descriptions, experience
 * levels and LinkedIn URLs are verbatim, as are the hero copy, the three track
 * headings and blurbs, and the "What We Value" items.
 *
 * apple-design:
 *  §1  hover feedback is instant and local to the row under the pointer
 *  §4  critically damped springs — rows lift without overshoot
 *  §12 material weight encodes hierarchy: rows are the substance, the filter
 *      rail recedes
 *  §14 all motion degrades to opacity-only under reduced motion
 */

const ConstellationField = dynamic(
    () => import('@/components/marketing/ConstellationField'),
    { ssr: false },
);

const MONO = 'var(--xlu-font-mono)';

// Job data structure
interface Job {
    id: number;
    title: string;
    category: 'growth' | 'product' | 'creative';
    tag: string;
    description: string;
    experience: string;
    linkedinUrl: string;
}

// Jobs data - easily updatable
const JOBS_DATA: Job[] = [
    // GROWTH ENGINEERING TRACK
    {
        id: 1,
        title: 'Senior Marketing Engineer',
        category: 'growth',
        tag: 'Hybrid',
        description: "You aren't just a marketer. You understand pixels, CAPI, and ROAS logic. Lead our high-budget ad campaigns and architect the funnel strategy for enterprise clients.",
        experience: '5+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 2,
        title: 'Performance Marketing Engineer',
        category: 'growth',
        tag: 'Remote',
        description: 'Execute precision ad campaigns on Meta & Google. You live in Ads Manager and obsess over lowering CAC while maintaining creative excellence.',
        experience: '2+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 3,
        title: 'Growth Associate (Marketing)',
        category: 'growth',
        tag: 'Hybrid',
        description: 'The entry point. You will learn the XLU system—SEO, Content, and Ad Operations. Fast-paced execution required.',
        experience: 'Fresher / 1 Year',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    // PRODUCT & AI TRACK
    {
        id: 4,
        title: 'Senior Software Engineer (Full Stack)',
        category: 'product',
        tag: 'Hybrid',
        description: 'Architect scalable web apps. You own the stack (React/Vue/Node). You care about render cycles, state management, and shipping bug-free code.',
        experience: '4+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 5,
        title: 'Mobile Engineer (Flutter)',
        category: 'product',
        tag: 'Remote',
        description: 'Build cross-platform eCommerce apps that feel native. You will translate our web architectures into fluid mobile experiences using Flutter.',
        experience: '2+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 6,
        title: 'AI Automation Engineer',
        category: 'product',
        tag: 'Remote',
        description: "The X-Factor. Build Python scripts, integrate LLMs into workflows, and automate internal ops. If it can be automated, you build it.",
        experience: '2+ Years (Python/OpenAI API)',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 7,
        title: 'Software Engineer (Fresher/Entry)',
        category: 'product',
        tag: 'Hybrid',
        description: 'We hire for potential. You know React/JS basics and are hungry to learn modern engineering standards.',
        experience: 'Fresher',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    // CREATIVE ENGINEERING TRACK
    {
        id: 8,
        title: 'Product Designer (UI/UX)',
        category: 'creative',
        tag: 'Hybrid',
        description: 'Design the "X Experience." Create high-fidelity Figma prototypes for web & mobile apps. You understand user psychology and pixel-perfect design.',
        experience: '3+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 9,
        title: 'Video Engineer (Editor)',
        category: 'creative',
        tag: 'Remote',
        description: 'Create high-retention ad creatives and motion graphics. Speed + Storytelling. You ship video content that converts, not just looks pretty.',
        experience: '2+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 10,
        title: 'Social Media & Content Manager',
        category: 'creative',
        tag: 'Hybrid',
        description: 'Own the XLU brand voice. Manage LinkedIn/Insta/Twitter organic growth. You write copy that resonates and build communities that engage.',
        experience: '1+ Years / Fresher',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
];

/** Track metadata — headings and blurbs are verbatim from the original page. */
const TRACKS = [
    {
        key: 'growth' as const,
        num: 'Track 1',
        name: 'Growth Engineering',
        accent: 'var(--xlu-brand-3)',
        blurb: 'Marketing roles for those who understand code, data, and conversion psychology. You build campaigns like software—testable, scalable, optimized.',
    },
    {
        key: 'product' as const,
        num: 'Track 2',
        name: 'Product & AI',
        accent: 'var(--xlu-brand-1)',
        blurb: 'Engineering roles for builders who ship. You write clean code, care about performance, and understand that every millisecond matters.',
    },
    {
        key: 'creative' as const,
        num: 'Track 3',
        name: 'Creative Engineering',
        accent: 'var(--xlu-brand-4)',
        blurb: 'Design and content roles for those who blend creativity with execution. You ship beautiful work that converts, not just looks good.',
    },
];

const VALUES = [
    { icon: '⚡', title: 'Execution Speed', desc: 'Ship fast. Iterate faster. No endless meetings.' },
    { icon: '📊', title: 'Data-Driven', desc: 'Every decision backed by metrics, not opinions.' },
    { icon: '🎯', title: 'Ownership', desc: 'You own your domain. No micromanagement.' },
];

const HERO_STATS = [
    { value: '10', label: 'Open Positions' },
    { value: 'Coimbatore', label: 'HQ Location' },
    { value: 'High-Performance', label: 'Culture' },
];

function accentFor(category: Job['category']) {
    return TRACKS.find((t) => t.key === category)?.accent ?? 'var(--xlu-brand-1)';
}

/* ─── Job board row ──────────────────────────────────────────── */
function JobCard({ job, index }: { job: Job; index: number }) {
    const reduced = useReducedMotion();
    const accent = accentFor(job.category);

    return (
        <motion.div
            layout={!reduced}
            // `animate`, not `whileInView` — see the note on the track section.
            // Filtering re-mounts cards that are already on screen, so a
            // scroll-triggered reveal would leave them invisible.
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springDefault, delay: (index % 2) * 0.05 }}
            whileHover={reduced ? undefined : { y: -3 }}
            className='group relative h-full overflow-hidden rounded-2xl border'
            style={{
                borderColor: 'var(--xlu-hairline)',
                background: 'linear-gradient(160deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
            }}
        >
            {/* Track accent edge */}
            <span
                aria-hidden
                className='absolute left-0 top-0 h-full w-[2px]'
                style={{ background: `linear-gradient(180deg, ${accent}, transparent 75%)`, opacity: 0.6 }}
            />
            {/* Hover wash */}
            <span
                aria-hidden
                className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--xlu-dur-slow)] group-hover:opacity-100'
                style={{
                    background: `radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in srgb, ${accent} 14%, transparent), transparent 70%)`,
                }}
            />

            {/* Oversized req number as a watermark — gives the card a focal
                mass instead of leaving the top-right corner empty. */}
            <span
                aria-hidden
                className='pointer-events-none absolute -right-2 -top-8 select-none text-[7rem] font-bold leading-none tabular-nums transition-opacity duration-[var(--xlu-dur-slow)] group-hover:opacity-[0.13]'
                style={{
                    fontFamily: MONO,
                    color: accent,
                    opacity: 0.06,
                    letterSpacing: '-0.06em',
                }}
            >
                {String(job.id).padStart(2, '0')}
            </span>

            <div className='relative flex h-full flex-col p-6'>
                {/* Status line — mono chrome reading as an open requisition */}
                <div className='mb-4 flex items-center gap-2'>
                    <span className='relative flex h-1.5 w-1.5' aria-hidden>
                        {!reduced && (
                            <span
                                className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-70'
                                style={{ background: accent }}
                            />
                        )}
                        <span
                            className='relative inline-flex h-1.5 w-1.5 rounded-full'
                            style={{ background: accent }}
                        />
                    </span>
                    <span
                        className='text-[0.65rem] uppercase'
                        style={{ fontFamily: MONO, letterSpacing: '0.16em', color: 'var(--xlu-ink-faint)' }}
                    >
                        open
                    </span>
                    <span
                        aria-hidden
                        className='h-px flex-1'
                        style={{ background: 'var(--xlu-hairline)' }}
                    />
                </div>

                <h3 className='text-xl font-bold leading-tight tracking-[-0.015em]'>
                    {job.title}
                </h3>

                {/* Spec row — label/value pairs, the way a job req reads */}
                <div className='mt-4 grid grid-cols-2 gap-3'>
                    <div>
                        <div
                            className='text-[0.6rem] uppercase'
                            style={{ fontFamily: MONO, letterSpacing: '0.14em', color: 'var(--xlu-ink-faint)' }}
                        >
                            Mode
                        </div>
                        <div className='mt-1 text-sm font-semibold' style={{ color: accent }}>
                            {job.tag}
                        </div>
                    </div>
                    <div>
                        <div
                            className='text-[0.6rem] uppercase'
                            style={{ fontFamily: MONO, letterSpacing: '0.14em', color: 'var(--xlu-ink-faint)' }}
                        >
                            Experience
                        </div>
                        <div className='mt-1 text-sm font-semibold'>{job.experience}</div>
                    </div>
                </div>

                <p className='mt-4 flex-1 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                    {job.description}
                </p>

                <div className='mt-5 h-px' style={{ background: 'var(--xlu-hairline)' }} />

                {/* Apply — full-width row that fills with the track accent on hover */}
                <a
                    href={job.linkedinUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='xlu-pressable group/apply relative mt-4 flex items-center justify-between overflow-hidden rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors duration-[var(--xlu-dur-base)]'
                    style={{
                        borderColor: `color-mix(in srgb, ${accent} 28%, transparent)`,
                        color: accent,
                    }}
                >
                    <span
                        aria-hidden
                        className='pointer-events-none absolute inset-0 origin-left scale-x-0 transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover/apply:scale-x-100'
                        style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
                    />
                    <span className='relative'>Apply on LinkedIn</span>
                    <svg
                        className='relative h-4 w-4 transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover/apply:translate-x-0.5'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                    >
                        <path d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                    </svg>
                </a>
            </div>
        </motion.div>
    );
}

export default function CareersPage() {
    const reduced = useReducedMotion();
    const [filter, setFilter] = useState<Job['category'] | null>(null);

    const visible = filter ? JOBS_DATA.filter((j) => j.category === filter) : JOBS_DATA;
    const shownTracks = filter ? TRACKS.filter((t) => t.key === filter) : TRACKS;

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
                        <div className='mb-6 inline-flex'>
                            <div
                                className='flex h-20 w-20 items-center justify-center rounded-2xl text-4xl'
                                style={{
                                    background:
                                        'linear-gradient(140deg, var(--xlu-surface-3), var(--xlu-surface-1))',
                                    border: '1px solid color-mix(in srgb, var(--xlu-brand-1) 30%, transparent)',
                                }}
                            >
                                ⚙️
                            </div>
                        </div>

                        <h1 className='text-5xl font-bold leading-tight tracking-[-0.02em] md:text-7xl'>
                            Build the <span className='xlu-brand-text'>Machine</span>.
                        </h1>

                        <p
                            className='mx-auto mt-6 max-w-3xl text-xl leading-relaxed md:text-2xl'
                            style={{ color: 'var(--xlu-ink-muted)' }}
                        >
                            We don&apos;t hire employees. We hire engineers of growth. Join the team redefining how businesses scale.
                        </p>

                        {/* Hero stats on a node rail */}
                        <div className='mx-auto mt-12 max-w-2xl'>
                            <div aria-hidden className='relative mb-4 hidden h-2 md:block'>
                                <div
                                    className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
                                    style={{
                                        background:
                                            'linear-gradient(90deg, transparent, var(--xlu-hairline) 12%, var(--xlu-hairline) 88%, transparent)',
                                    }}
                                />
                                <div className='relative grid h-full grid-cols-3'>
                                    {HERO_STATS.map((s, i) => (
                                        <span key={s.label} className='flex items-center justify-center'>
                                            <span
                                                className='h-1.5 w-1.5 rounded-full'
                                                style={{ background: 'var(--xlu-brand-1)', opacity: i === 1 ? 0.9 : 0.55 }}
                                            />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
                                {HERO_STATS.map((s) => (
                                    <div key={s.label} className='text-center'>
                                        <div className='xlu-brand-text text-2xl font-bold'>{s.value}</div>
                                        <div className='mt-1 text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* ============ TRACK FILTER RAIL ============ */}
                <div
                    className='flex flex-wrap items-center gap-2 border-y py-[var(--xlu-space-md)]'
                    style={{ borderColor: 'var(--xlu-hairline)' }}
                >
                    <span
                        className='mr-2 text-[0.7rem] uppercase tabular-nums'
                        style={{ fontFamily: MONO, letterSpacing: '0.16em', color: 'var(--xlu-ink-faint)' }}
                    >
                        {visible.length} / {JOBS_DATA.length}
                    </span>

                    {[null, ...TRACKS.map((t) => t.key)].map((k) => {
                        const track = TRACKS.find((t) => t.key === k);
                        const accent = track?.accent ?? 'var(--xlu-brand-1)';
                        const active = filter === k;
                        return (
                            <button
                                key={k ?? 'all'}
                                onClick={() => setFilter(k)}
                                aria-pressed={active}
                                className='xlu-pressable inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors duration-[var(--xlu-dur-base)]'
                                style={{
                                    borderColor: active
                                        ? `color-mix(in srgb, ${accent} 55%, transparent)`
                                        : 'var(--xlu-hairline)',
                                    background: active
                                        ? `color-mix(in srgb, ${accent} 10%, transparent)`
                                        : 'transparent',
                                    color: active ? accent : 'var(--xlu-ink-subtle)',
                                }}
                            >
                                <span
                                    aria-hidden
                                    className='h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-[var(--xlu-dur-base)]'
                                    style={{
                                        background: active ? accent : 'var(--xlu-ink-faint)',
                                        boxShadow: active ? `0 0 8px 1px ${accent}` : 'none',
                                    }}
                                />
                                {track?.name ?? 'All Tracks'}
                            </button>
                        );
                    })}
                </div>

                {/* ============ TRACK SECTIONS ============ */}
                <AnimatePresence mode='wait'>
                    {shownTracks.map((track) => {
                        const jobs = JOBS_DATA.filter((j) => j.category === track.key);
                        return (
                            <motion.section
                                key={track.key}
                                layout={!reduced}
                                // `animate`, NOT `whileInView`. Filtering re-mounts this
                                // section under a new AnimatePresence key while it is
                                // already in the viewport, so a scroll-triggered reveal
                                // never fires and the section stays at opacity 0.
                                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={reduced ? { duration: 0.25 } : springDefault}
                                className='py-[var(--xlu-space-xl)]'
                            >
                                <div className='mb-6 flex items-center gap-4'>
                                    <span
                                        className='h-1.5 w-1.5 shrink-0 rounded-full'
                                        style={{ background: track.accent }}
                                        aria-hidden
                                    />
                                    <h2 className='text-3xl font-bold tracking-[-0.02em]'>
                                        {track.num}: <span className='xlu-brand-text'>{track.name}</span>
                                    </h2>
                                    <span
                                        className='rounded-full px-2 py-0.5 text-[0.65rem] tabular-nums'
                                        style={{
                                            fontFamily: MONO,
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'var(--xlu-ink-subtle)',
                                        }}
                                    >
                                        {jobs.length}
                                    </span>
                                    <div
                                        aria-hidden
                                        className='h-px flex-1'
                                        style={{
                                            background: `linear-gradient(90deg, ${track.accent}, transparent)`,
                                            opacity: 0.35,
                                        }}
                                    />
                                </div>

                                <p
                                    className='mb-8 max-w-3xl leading-relaxed'
                                    style={{ color: 'var(--xlu-ink-muted)' }}
                                >
                                    {track.blurb}
                                </p>

                                <div className='grid items-stretch gap-3 md:grid-cols-2'>
                                    {jobs.map((job, index) => (
                                        <JobCard key={job.id} job={job} index={index} />
                                    ))}
                                </div>
                            </motion.section>
                        );
                    })}
                </AnimatePresence>

                {/* ============ WHAT WE VALUE ============ */}
                <motion.section
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    viewport={revealViewport}
                    transition={reduced ? { duration: 0.25 } : springDefault}
                    className='pb-[var(--xlu-space-2xl)]'
                >
                    <div
                        className='relative mx-auto max-w-4xl overflow-hidden rounded-2xl border p-[clamp(2rem,5vw,3rem)]'
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
                            <h2 className='mb-8 text-center text-3xl font-bold tracking-[-0.02em]'>
                                What We <span className='xlu-brand-text'>Value</span>
                            </h2>

                            <div className='grid gap-6 md:grid-cols-3'>
                                {VALUES.map((v, i) => (
                                    <motion.div
                                        key={v.title}
                                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={revealViewport}
                                        transition={{ ...springDefault, delay: i * 0.07 }}
                                        className='group border-t pt-4'
                                        style={{ borderColor: 'var(--xlu-hairline)' }}
                                    >
                                        <div className='mb-2 text-2xl'>{v.icon}</div>
                                        <h3 className='mb-2 font-bold'>{v.title}</h3>
                                        <p className='text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                                            {v.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>
        </main>
    );
}
