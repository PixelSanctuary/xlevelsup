'use client';

import { m as motion, useReducedMotion } from 'framer-motion';
import ContactForm from '../ContactForm';
import { springDefault, revealViewport } from '@/components/marketing/motion';

/**
 * Ready to Level Up? — contact.
 *
 * IMPORTANT: <ContactForm /> is untouched. All submission wiring, field names
 * (Name, Email, Phone, Service Interested In) and the endpoint live inside that
 * component; this file only restyles the surface around it.
 *
 * Rebuilt from a plain centred card into one connected panel: the "direct
 * contact" links now live inside the same material as the form (a footer row,
 * not a separate floating block), and a live-status chip plus a corner node
 * motif tie the section into the connected-node identity used elsewhere.
 *
 * The form sits on the heaviest material on the page — it is the primary
 * conversion target (apple-design §12: bigger surfaces read as thicker).
 *
 * Copy unchanged.
 */

export default function Contact() {
    const reduced = useReducedMotion();

    const rise = (delay = 0) =>
        reduced
            ? { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.25, delay } }
            : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: { ...springDefault, delay },
              };

    return (
        <section className='xlu xlu-section relative isolate' id='contact'>
            {/* Anchor glow — marks this as the page's destination */}
            <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
                <div
                    className='absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]'
                    style={{
                        background:
                            'radial-gradient(circle, rgba(18,229,254,0.10) 0%, rgba(198,64,255,0.07) 50%, transparent 72%)',
                    }}
                />
            </div>

            <div className='xlu-container'>
                <motion.div
                    {...rise()}
                    viewport={revealViewport}
                    className='mx-auto mb-[var(--xlu-space-xl)] max-w-[46rem] text-center'
                >
                    <div
                        className='mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5'
                        style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
                    >
                        <span className='relative flex h-1.5 w-1.5'>
                            {!reduced && (
                                <span
                                    className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-70'
                                    style={{ background: 'var(--xlu-brand-1)' }}
                                />
                            )}
                            <span className='relative inline-flex h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
                        </span>
                        <span className='text-xs font-semibold uppercase tracking-widest' style={{ color: 'var(--xlu-ink-subtle)' }}>
                            Open to new partnerships
                        </span>
                    </div>

                    <h2 className='mb-4 text-[1.875rem] sm:text-4xl font-bold leading-tight tracking-[-0.02em] md:text-5xl'>
                        Ready to <span className='xlu-brand-text'>Level Up?</span>
                    </h2>
                    <p className='text-lg' style={{ color: 'var(--xlu-ink-subtle)' }}>
                        Let&apos;s discuss how we can accelerate your growth
                    </p>
                </motion.div>

                {/* One connected panel: form + direct contact share a surface */}
                <motion.div
                    {...rise(0.06)}
                    viewport={revealViewport}
                    className='xlu-material-thick relative mx-auto max-w-[46rem] overflow-hidden rounded-3xl'
                >
                    {/* Corner node — small nod to the connected motif, not a distraction */}
                    <svg className='pointer-events-none absolute right-6 top-6 h-16 w-16 opacity-30' aria-hidden='true'>
                        <circle cx='4' cy='4' r='2.5' fill='var(--xlu-brand-1)' />
                        <circle cx='40' cy='20' r='2' fill='var(--xlu-brand-3)' />
                        <line x1='4' y1='4' x2='40' y2='20' stroke='var(--xlu-hairline)' strokeWidth='1' />
                    </svg>

                    <div className='p-[clamp(1.5rem,4vw,3rem)] pb-0'>
                        <ContactForm />
                    </div>

                    {/* Direct contact — now a footer row of the same panel.
                        Fixed two bugs from the previous pass: the phone number had
                        no whitespace-nowrap and could wrap onto two lines inside the
                        flex row, and the "Or reach us directly" label sat at the
                        dimmest colour token on the page (--xlu-ink-faint) next to
                        much brighter links, so it read as almost invisible. */}
                    <div
                        className='mt-[var(--xlu-space-lg)] flex flex-col items-center justify-center gap-x-[var(--xlu-space-lg)] gap-y-[var(--xlu-space-sm)] border-t px-[clamp(1.5rem,4vw,3rem)] py-[var(--xlu-space-lg)] sm:flex-row sm:flex-wrap'
                        style={{ borderColor: 'var(--xlu-hairline)' }}
                    >
                        <span
                            className='shrink-0 text-sm font-semibold uppercase tracking-widest'
                            style={{ color: 'var(--xlu-ink-subtle)' }}
                        >
                            Or reach us directly
                        </span>
                        <span
                            className='hidden h-3 w-px shrink-0 sm:block'
                            style={{ background: 'var(--xlu-hairline)' }}
                            aria-hidden
                        />
                        <a
                            href='mailto:hello@xlevelsup.com'
                            className='xlu-link inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap'
                        >
                            <span aria-hidden>📧</span> hello@xlevelsup.com
                        </a>
                        <span
                            className='hidden h-3 w-px shrink-0 sm:block'
                            style={{ background: 'var(--xlu-hairline)' }}
                            aria-hidden
                        />
                        <a
                            href='tel:+919047055888'
                            className='xlu-link inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap'
                        >
                            <span aria-hidden>📞</span> +91 90470 55888
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
