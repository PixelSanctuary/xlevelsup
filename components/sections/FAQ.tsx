'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { springDefault, revealViewport } from '@/components/marketing/motion';
import XluButton from '@/components/marketing/XluButton';

/**
 * FAQ accordion.
 *
 * Restyled onto the new type system: hairline rows rather than stacked glass
 * cards, question at h3 scale, generous row rhythm.
 *
 * §7  the chevron rotates one way open and unwinds the same way closed —
 *     the exit path mirrors the entry path.
 * §14 height animation is replaced by an instant open under reduced-motion,
 *     since an expanding box is the vestibular part.
 *
 * All 5 questions and answers are unchanged.
 */

const faqs = [
    {
        id: 1,
        question: 'What does XLEVELSUP actually do?',
        answer:
            'XLEVELSUP is your end-to-end growth partner. We handle everything a business needs to grow digitally — logo and brand identity design, marketing and eCommerce websites, Meta Ads and social media management, Google Ads campaigns, ERP and enterprise software development, and AI workflow automation. One partner. All disciplines. All under one roof in Coimbatore, India.',
    },
    {
        id: 2,
        question: 'Are you an agency or a software company?',
        answer:
            'Both — and that\'s the point. Most agencies can\'t write code. Most software companies can\'t run ads. XLEVELSUP combines both. We\'re a full-service digital agency that also builds enterprise-grade software, ERP systems, and AI automation. You get creative execution and engineering depth from the same team, with no handoff problems between vendors.',
    },
    {
        id: 3,
        question: 'How is XLEVELSUP different from other digital agencies?',
        answer:
            'Most agencies specialise in one channel — social media, or SEO, or web design. XLEVELSUP covers the entire stack: design, development, advertising, automation, and analytics. Our approach is engineering-driven — we apply data and systems thinking to every service, not guesswork. And because we build both the marketing and the technology, every layer compounds on the one before it.',
    },
    {
        id: 4,
        question: 'What does working with XLEVELSUP look like?',
        answer:
            'We start with a discovery session to understand your business, goals, and current gaps. From there, we propose the specific services that will move the needle — whether that\'s a website rebuild, an ad campaign, an ERP system, or AI automation. We work in focused sprints with clear deliverables, keeping you informed at every stage. Most clients start seeing measurable results within 30–60 days.',
    },
    {
        id: 5,
        question: 'How do I get started?',
        answer:
            'Simple — fill out the contact form below or reach out directly at hello@xlevelsup.com. We\'ll schedule a free growth audit call where we review your current setup, identify gaps, and outline a clear path forward. No commitment required to start the conversation.',
    },
];

export default function FAQ() {
    const [openId, setOpenId] = useState<number | null>(null);
    const reduced = useReducedMotion();

    const toggle = (id: number) => setOpenId(openId === id ? null : id);

    const fade = reduced
        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } } }
        : {
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: springDefault },
          };

    return (
        <section className='xlu xlu-section relative' id='faq'>
            <div className='xlu-container'>
                <div className='mx-auto max-w-[42rem]'>
                    {/* Header — centred. Renders immediately rather than waiting on a
                        scroll-triggered reveal: a section heading is read-on-load
                        content, not something that should ever be invisible while a
                        user is still deciding whether to scroll toward it. */}
                    <div className='mb-[var(--xlu-space-xl)] text-center'>
                        <p
                            className='mb-4 text-sm font-semibold uppercase tracking-widest'
                            style={{ color: 'var(--xlu-brand-1)' }}
                        >
                            Common Questions
                        </p>
                        <h2 className='mb-4 text-[1.875rem] sm:text-4xl font-bold leading-tight tracking-[-0.02em] md:text-5xl'>
                            Frequently Asked <span className='xlu-brand-text'>Questions</span>
                        </h2>
                        <p className='text-lg' style={{ color: 'var(--xlu-ink-subtle)' }}>
                            Everything you need to know before we get started.
                        </p>
                    </div>

                    {/* Accordion */}
                    <motion.div
                        initial='hidden'
                        whileInView='visible'
                        viewport={revealViewport}
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
                    >
                        {faqs.map((faq, i) => {
                            const isOpen = openId === faq.id;
                            return (
                                <motion.div
                                    key={faq.id}
                                    variants={fade}
                                    // Each row is its own surface that MATERIALIZES when
                                    // opened — border and background lift together rather
                                    // than the panel just unfurling from a flat rule
                                    // (apple-design §12: a real material arriving).
                                    className='group relative mb-3 overflow-hidden rounded-2xl border transition-colors duration-[var(--xlu-dur-base)]'
                                    style={{
                                        borderColor: isOpen
                                            ? 'color-mix(in srgb, var(--xlu-brand-1) 40%, transparent)'
                                            : 'var(--xlu-hairline)',
                                        background: isOpen ? 'var(--xlu-surface-1)' : 'transparent',
                                    }}
                                >
                                    {/* Accent glow, only while open */}
                                    <div
                                        aria-hidden
                                        className='pointer-events-none absolute inset-0 transition-opacity duration-[var(--xlu-dur-slow)]'
                                        style={{
                                            opacity: isOpen ? 1 : 0,
                                            background:
                                                'radial-gradient(ellipse 60% 100% at 0% 0%, rgba(18,229,254,0.08), transparent 70%)',
                                        }}
                                    />

                                    <h3 className='relative'>
                                        <button
                                            onClick={() => toggle(faq.id)}
                                            aria-expanded={isOpen}
                                            aria-controls={`faq-panel-${faq.id}`}
                                            id={`faq-trigger-${faq.id}`}
                                            className='flex w-full cursor-pointer items-start gap-4 px-[var(--xlu-space-md)] py-[var(--xlu-space-md)] text-left transition-colors duration-[var(--xlu-dur-base)] hover:text-[var(--xlu-brand-1)]'
                                        >
                                            {/* Node index — same connected-node grammar as
                                                the hero rail and About funnel */}
                                            <span
                                                aria-hidden
                                                className='mt-1 shrink-0 font-mono text-[0.75rem] transition-colors duration-[var(--xlu-dur-base)]'
                                                style={{
                                                    color: isOpen ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-faint)',
                                                }}
                                            >
                                                0{i + 1}
                                            </span>

                                            <span className='flex-1 text-lg font-semibold'>
                                                {faq.question}
                                            </span>

                                            {/* Plus that morphs to minus — the vertical bar
                                                rotates and fades, so open/close mirror each
                                                other exactly (§7 symmetric paths). */}
                                            <span
                                                aria-hidden
                                                className='relative mt-1.5 h-[1.05rem] w-[1.05rem] shrink-0'
                                                style={{ color: 'var(--xlu-brand-1)' }}
                                            >
                                                <span
                                                    className='absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rounded-full'
                                                    style={{ background: 'currentColor' }}
                                                />
                                                <span
                                                    className='absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 rounded-full transition-[transform,opacity] duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)]'
                                                    style={{
                                                        background: 'currentColor',
                                                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                                        opacity: isOpen ? 0 : 1,
                                                    }}
                                                />
                                            </span>
                                        </button>
                                    </h3>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key='answer'
                                                id={`faq-panel-${faq.id}`}
                                                role='region'
                                                aria-labelledby={`faq-trigger-${faq.id}`}
                                                initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                                animate={reduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                                                exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                                                transition={
                                                    reduced
                                                        ? { duration: 0.2 }
                                                        : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
                                                }
                                                className='relative overflow-hidden'
                                            >
                                                <p
                                                    className='px-[var(--xlu-space-md)] pb-[var(--xlu-space-lg)] pl-[calc(var(--xlu-space-md)+2.25rem)] leading-[1.7]'
                                                    style={{ color: 'var(--xlu-ink-muted)', maxWidth: 'var(--xlu-measure)' }}
                                                >
                                                    {faq.answer}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}

                        {/* Bottom CTA */}
                        <motion.div
                            variants={fade}
                            // Centred on mobile to match the rest of the section;
                            // `items-start` left-aligned this row while every
                            // heading above it was centred.
                            className='mt-[var(--xlu-space-xl)] flex flex-col items-center gap-[var(--xlu-space-md)] text-center sm:flex-row sm:items-center sm:justify-between sm:text-left'
                        >
                            <p className='text-lg' style={{ color: 'var(--xlu-ink-muted)' }}>
                                Still have questions? Let&apos;s talk.
                            </p>
                            {/* Same button component used sitewide — see XluButton for
                                the shared magnetic-pull + sheen treatment. */}
                            <XluButton href='#contact' variant='primary' className='shrink-0'>
                                Book a Free Growth Audit
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
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
