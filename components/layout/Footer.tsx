'use client';

import Link from 'next/link';
import Image from 'next/image';
import { m as motion, useReducedMotion } from 'framer-motion';
import { springDefault, revealViewport } from '@/components/marketing/motion';

/**
 * Footer — restyled onto the XLU token system.
 *
 * Font sizes are unchanged from the original: text-2xl brand mark (unused —
 * original had it commented out, so it stays commented out), text-sm body
 * copy, default weight headings. Only color, spacing, dividers and hover
 * language changed.
 *
 * Motion is light, per apple-design §1/§4: link underlines draw on hover
 * (compositor-only transform), social icons get an instant press-scale, and
 * the whole footer fades up once on scroll into view. Nothing loops, nothing
 * demands attention — a footer is not a stage.
 *
 * Copy, links, hrefs and structure are all unchanged.
 */

const SOLUTIONS = [
    { href: '/solutions/marketing-architecture', label: 'Marketing Architecture' },
    { href: '/solutions/search-engineering', label: 'Search Engineering' },
    { href: '/solutions/digital-marketing', label: 'Digital Marketing' },
    { href: '/solutions/growth-systems', label: 'Growth Systems' },
    { href: '/solutions/ai-automation', label: 'AI & Automation' },
];

const COMPANY = [
    { href: '/about', label: 'About' },
    { href: '/team', label: 'Meet the Team' },
    { href: '/work', label: 'Work' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
];

const SOCIALS = [
    {
        href: 'https://www.linkedin.com/company/xlevelsup',
        label: 'LinkedIn',
        path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
    },
    {
        href: 'https://www.instagram.com/xlevelsup',
        label: 'Instagram',
        path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 100-8 4 4 0 000 8zm4.965-10.322a1.44 1.44 0 110.002-2.88 1.44 1.44 0 01-.002 2.88z',
    },
    {
        href: 'https://x.com/xlevelsup',
        label: 'X (Twitter)',
        path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    {
        href: 'https://www.facebook.com/profile.php?id=61583746927121',
        label: 'Facebook',
        path: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z',
    },
    {
        href: 'https://www.youtube.com/@xlevelsup',
        label: 'YouTube',
        path: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    },
];

function FooterLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className='xlu-link' style={{ color: 'var(--xlu-ink-muted)' }}>
            {label}
        </Link>
    );
}

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const reduced = useReducedMotion();

    const fadeUp = reduced
        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
        : {
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: springDefault },
          };

    return (
        <footer className='xlu border-t' style={{ borderColor: 'var(--xlu-hairline)' }}>
            <motion.div
                initial='hidden'
                whileInView='visible'
                viewport={revealViewport}
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                className='xlu-container py-[var(--xlu-space-2xl)]'
            >
                <div className='mb-[var(--xlu-space-xl)] grid grid-cols-1 gap-[var(--xlu-space-lg)] md:grid-cols-2 lg:grid-cols-4'>
                    {/* Column 1: Brand */}
                    <motion.div variants={fadeUp}>
                        <Image
                            src='/xlevelsup_logo_footer.svg'
                            width={155}
                            height={24}
                            alt='XLEVELSUP logo — Custom Software Development & AI Automation Company India'
                            className='mb-4'
                        />
                        <p className='font-semibold leading-relaxed' style={{ color: 'var(--xlu-ink)' }}>
                            Engineering X Times More Growth.
                        </p>
                        <p className='mt-4 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-faint)' }}>
                            Engineering the digital infrastructure, custom software, and algorithmic growth systems that scale modern businesses.
                        </p>
                    </motion.div>

                    {/* Column 2: Solutions */}
                    <motion.div variants={fadeUp}>
                        <h3
                            className='mb-4 text-xs font-bold uppercase tracking-widest'
                            style={{ color: 'var(--xlu-brand-1)' }}
                        >
                            Solutions
                        </h3>
                        <ul className='space-y-2.5'>
                            {SOLUTIONS.map((s) => (
                                <li key={s.href}>
                                    <FooterLink {...s} />
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Column 3: Company */}
                    <motion.div variants={fadeUp}>
                        <h3
                            className='mb-4 text-xs font-bold uppercase tracking-widest'
                            style={{ color: 'var(--xlu-brand-1)' }}
                        >
                            Company
                        </h3>
                        <ul className='space-y-2.5'>
                            {COMPANY.map((c) => (
                                <li key={c.href}>
                                    <FooterLink {...c} />
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Column 4: Connect */}
                    <motion.div variants={fadeUp}>
                        <h3
                            className='mb-4 text-xs font-bold uppercase tracking-widest'
                            style={{ color: 'var(--xlu-brand-1)' }}
                        >
                            Connect
                        </h3>

                        <div className='mb-6 flex flex-wrap gap-3'>
                            {SOCIALS.map((s) => (
                                <motion.a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='xlu-pressable flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-[var(--xlu-dur-base)]'
                                    style={{ borderColor: 'var(--xlu-hairline)', background: 'rgba(255,255,255,0.03)' }}
                                    whileHover={reduced ? undefined : { borderColor: 'var(--xlu-brand-1)' }}
                                >
                                    <svg
                                        className='h-[1.1rem] w-[1.1rem]'
                                        fill='currentColor'
                                        viewBox='0 0 24 24'
                                        style={{ color: 'var(--xlu-ink-subtle)' }}
                                    >
                                        <path d={s.path} />
                                    </svg>
                                </motion.a>
                            ))}
                        </div>

                        <div className='text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-faint)' }}>
                            <p
                                className='mb-1.5 text-xs font-bold uppercase tracking-widest'
                                style={{ color: 'var(--xlu-brand-1)' }}
                            >
                                Location
                            </p>
                            <p style={{ color: 'var(--xlu-ink-muted)' }}>2nd floor, 178, A, Ramachandra Rd,</p>
                            <p style={{ color: 'var(--xlu-ink-muted)' }}>R.S. Puram, Coimbatore - 641002</p>
                            <p style={{ color: 'var(--xlu-ink-muted)' }}>Tamil Nadu, India</p>
                        </div>
                    </motion.div>
                </div>

                {/* Divider as a node rail — closes the connected-node motif that
                    runs through every other section (hero rail, marquee chips,
                    solutions grid, About funnel, testimonial dots, FAQ indices).
                    Four nodes align to the four footer columns above. */}
                <motion.div variants={fadeUp} className='relative mb-[var(--xlu-space-lg)]'>
                    <div className='xlu-rule' />
                    <div
                        aria-hidden
                        className='absolute inset-x-0 top-1/2 hidden -translate-y-1/2 grid-cols-4 md:grid'
                    >
                        {[0, 1, 2, 3].map((i) => (
                            <span key={i} className='flex justify-center'>
                                <span
                                    className='h-1.5 w-1.5 rounded-full'
                                    style={{
                                        background: 'var(--xlu-brand-1)',
                                        // Fade toward the edges so the rail reads as
                                        // one connected run, not four loose dots.
                                        opacity: i === 0 || i === 3 ? 0.35 : 0.7,
                                    }}
                                />
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Copyright and portals */}
                <motion.div
                    variants={fadeUp}
                    className='flex flex-col items-center justify-between gap-6 text-sm md:flex-row'
                    style={{ color: 'var(--xlu-ink-faint)' }}
                >
                    <p className='order-2 md:order-1'>
                        © {currentYear} XLEVELSUP. Built with Next.js & Passion.
                    </p>
                    <div className='order-1 flex flex-wrap items-center justify-center gap-6 md:order-2'>
                        <Link
                            href='/employee/login'
                            className='group flex items-center gap-2 text-sm transition-colors duration-[var(--xlu-dur-base)] hover:text-[var(--xlu-ink)]'
                            style={{ color: 'var(--xlu-ink-faint)' }}
                        >
                            <span
                                className='rounded-md border p-1.5 transition-colors duration-[var(--xlu-dur-base)] group-hover:border-[color-mix(in_srgb,var(--xlu-brand)_45%,transparent)]'
                                style={{ borderColor: 'var(--xlu-hairline)', background: 'rgba(255,255,255,0.03)' }}
                            >
                                <svg
                                    className='h-4 w-4 transition-colors duration-[var(--xlu-dur-base)] group-hover:text-[var(--xlu-brand-1)]'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                </svg>
                            </span>
                            <span className='font-medium'>Employee Login</span>
                        </Link>
                        <Link
                            href='/erp/login'
                            className='group flex items-center gap-2 text-sm transition-colors duration-[var(--xlu-dur-base)] hover:text-[var(--xlu-ink)]'
                            style={{ color: 'var(--xlu-ink-faint)' }}
                        >
                            <span
                                className='rounded-md border p-1.5 transition-colors duration-[var(--xlu-dur-base)] group-hover:border-[color-mix(in_srgb,var(--xlu-brand)_45%,transparent)]'
                                style={{ borderColor: 'var(--xlu-hairline)', background: 'rgba(255,255,255,0.03)' }}
                            >
                                <svg
                                    className='h-4 w-4 transition-colors duration-[var(--xlu-dur-base)] group-hover:text-[var(--xlu-brand-1)]'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                >
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                                </svg>
                            </span>
                            <span className='font-medium'>Admin Login</span>
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        </footer>
    );
}
