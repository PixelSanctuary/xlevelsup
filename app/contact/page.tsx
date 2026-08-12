'use client';

import { m as motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import ContactForm from '@/components/ContactForm';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';
import { springDefault, revealViewport } from '@/components/marketing/motion';

/**
 * /contact — restyled onto the --xlu-* system.
 *
 * IMPORTANT: <ContactForm /> is untouched. All submission wiring, field names
 * and the endpoint live inside that component; this file only restyles the
 * surface around it.
 *
 * Previously five separate `.glass` cards stacked in a column, each with a
 * gradient-circle icon on a different legacy hue. Rebuilt as a single
 * connected contact panel — the detail rows share one surface with hairline
 * separators, so they read as one record rather than five floating boxes.
 *
 * Content is untouched: the heading, subhead, form heading, all five detail
 * labels and values, and the response-time note are verbatim.
 *
 * apple-design:
 *  §1  hover feedback is instant and local to the row under the pointer
 *  §12 material weight encodes hierarchy — the form is the heaviest surface
 *      on the page because it is the conversion target; details are lighter
 *  §14 all motion degrades to opacity-only under reduced motion
 */

const ConstellationField = dynamic(
    () => import('@/components/marketing/ConstellationField'),
    { ssr: false },
);

const MONO = 'var(--xlu-font-mono)';

const MailIcon = (
    <path d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
);
const PhoneIcon = (
    <path d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
);
const PinIcon = (
    <>
        <path d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
        <path d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
    </>
);
const ClockIcon = <path d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />;

interface Detail {
    label: string;
    icon: React.ReactNode;
    href?: string;
    value: React.ReactNode;
}

const DETAILS: Detail[] = [
    { label: 'Email', icon: MailIcon, href: 'mailto:hello@xlevelsup.com', value: 'hello@xlevelsup.com' },
    { label: 'Phone', icon: PhoneIcon, href: 'tel:+919047055888', value: '+91 90470 55888' },
    {
        label: 'Location',
        icon: PinIcon,
        value: (
            <>
                Coimbatore, Tamil Nadu<br />
                India
            </>
        ),
    },
    {
        label: 'Office Hours',
        icon: ClockIcon,
        value: (
            <>
                Monday - Friday<br />
                9:00 AM - 6:00 PM IST
            </>
        ),
    },
];

export default function ContactPage() {
    const reduced = useReducedMotion();

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
                        {/* Availability chip — live status, not new copy */}
                        <div
                            className='mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5'
                            style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
                        >
                            <span className='relative flex h-1.5 w-1.5' aria-hidden>
                                {!reduced && (
                                    <span
                                        className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-70'
                                        style={{ background: 'var(--xlu-brand-1)' }}
                                    />
                                )}
                                <span
                                    className='relative inline-flex h-1.5 w-1.5 rounded-full'
                                    style={{ background: 'var(--xlu-brand-1)' }}
                                />
                            </span>
                            <span
                                className='text-[0.65rem] uppercase'
                                style={{ fontFamily: MONO, letterSpacing: '0.16em', color: 'var(--xlu-ink-subtle)' }}
                            >
                                Fast Response Time
                            </span>
                        </div>

                        <h1 className='text-[2.5rem] sm:text-5xl font-bold leading-tight tracking-[-0.02em] md:text-6xl'>
                            Let&apos;s Engineer <span className='xlu-brand-text'>Your Growth</span>
                        </h1>
                        <p className='mx-auto mt-6 max-w-3xl text-xl leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                            Ready to scale your business with engineering-driven marketing? Let&apos;s start with a growth audit.
                        </p>
                    </motion.div>
                </section>

                <div className='mx-auto grid max-w-6xl gap-3 pb-[var(--xlu-space-2xl)] lg:grid-cols-[1.15fr_0.85fr]'>
                    {/* ============ FORM — heaviest surface (§12) ============ */}
                    <motion.div
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={reduced ? { duration: 0.25 } : springDefault}
                        className='relative overflow-hidden rounded-2xl border'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background:
                                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            boxShadow: '0 32px 90px -30px rgba(0,0,0,0.9)',
                        }}
                    >
                        <CornerBrackets all />

                        {/* Console chrome */}
                        <div
                            className='flex items-center gap-3 border-b px-5 py-3'
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
                                style={{ fontFamily: MONO, letterSpacing: '0.16em', color: 'var(--xlu-ink-faint)' }}
                            >
                                growth audit
                            </span>
                        </div>

                        <div className='relative p-[clamp(1.5rem,4vw,2.5rem)]'>
                            <h2 className='mb-6 text-2xl font-bold tracking-[-0.015em]'>
                                Get Your Growth Audit
                            </h2>
                            <ContactForm />
                        </div>
                    </motion.div>

                    {/* ============ DETAILS — one connected record ============ */}
                    <motion.div
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
                        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={reduced ? { duration: 0.25 } : { ...springDefault, delay: 0.08 }}
                        className='flex flex-col gap-3'
                    >
                        <div
                            className='overflow-hidden rounded-2xl border'
                            style={{
                                borderColor: 'var(--xlu-hairline)',
                                background:
                                    'linear-gradient(160deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            }}
                        >
                            {DETAILS.map((d, i) => {
                                const Row = (
                                    <>
                                        {/* Node marker on the record rail */}
                                        <span
                                            aria-hidden
                                            className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-[var(--xlu-dur-base)] group-hover:scale-150'
                                            style={{ background: 'var(--xlu-brand-1)', opacity: 0.6 }}
                                        />
                                        <svg
                                            className='mt-0.5 h-5 w-5 shrink-0'
                                            fill='none'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth='1.75'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                            style={{ color: 'var(--xlu-brand-1)' }}
                                            aria-hidden
                                        >
                                            {d.icon}
                                        </svg>
                                        <span className='min-w-0'>
                                            <span
                                                className='block text-[0.6rem] uppercase'
                                                style={{
                                                    fontFamily: MONO,
                                                    letterSpacing: '0.14em',
                                                    color: 'var(--xlu-ink-faint)',
                                                }}
                                            >
                                                {d.label}
                                            </span>
                                            <span
                                                className='mt-1 block text-sm leading-relaxed'
                                                style={{ color: 'var(--xlu-ink-muted)' }}
                                            >
                                                {d.value}
                                            </span>
                                        </span>
                                    </>
                                );

                                const rowClass =
                                    'group flex items-start gap-3 p-5 transition-colors duration-[var(--xlu-dur-base)]';
                                const rowStyle = {
                                    borderColor: 'var(--xlu-hairline)',
                                    borderTopWidth: i === 0 ? 0 : 1,
                                };

                                return d.href ? (
                                    <a key={d.label} href={d.href} className={rowClass} style={rowStyle}>
                                        {Row}
                                    </a>
                                ) : (
                                    <div key={d.label} className={rowClass} style={rowStyle}>
                                        {Row}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Response note */}
                        <div
                            className='relative overflow-hidden rounded-2xl border p-5'
                            style={{
                                borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 25%, transparent)',
                                background: 'color-mix(in srgb, var(--xlu-brand-1) 6%, var(--xlu-surface-1))',
                            }}
                        >
                            <h3 className='xlu-brand-text mb-2 font-semibold'>Fast Response Time</h3>
                            <p className='text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                                We typically respond to all inquiries within 24 hours. For urgent matters, please mention it in your message.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
