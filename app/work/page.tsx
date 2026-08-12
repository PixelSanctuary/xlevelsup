'use client';

import { useState } from 'react';
import { m as motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';
import { springDefault, revealViewport } from '@/components/marketing/motion';

// Client-only canvas, same pattern as the hero elsewhere — kept out of the SSR
// bundle so it never delays first paint of the headline.
const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

/**
 * /work — client index, restyled onto the --xlu-* system.
 *
 * Previously a grid of `.glass` cards on the legacy --cyan/--purple palette.
 * Rebuilt as a filterable ledger of shipped builds carrying the site's
 * connected-node identity: the hero sits on the constellation field, each
 * project is a material surface with mono chrome, and every metric renders as
 * a node on a rail rather than a bullet.
 *
 * Content is untouched — all 8 project names, tags, descriptions, 24 metrics,
 * logos and links are verbatim, as are the page headings and CTA.
 *
 * apple-design:
 *  §1  hover feedback is instant and local to the card under the pointer
 *  §4  critically damped springs — cards lift without overshoot
 *  §12 material weight encodes hierarchy: cards are the substance and carry
 *      gradient + inner highlight + depth shadow; the filter row recedes
 *  §14 all motion degrades to opacity-only under reduced motion
 *
 * Performance: no layout-animating properties. Card lift is a transform, the
 * accent wash is an opacity transition, and filtering is a CSS-free re-render
 * of an already-mounted list.
 */

const projects = [
  {
    id: 1,
    name: 'Pratyagra Silks',
    tag: 'eCommerce / Scale',
    description:
      'Engineered a high-performance eCommerce platform that increased online revenue by 300% in 6 months.',
    metrics: [
      '300% Revenue Growth',
      '70% Faster Load Times',
      '2.5x Conversion Rate',
    ],
    gradient: 'from-cyan/20 to-purple/20',
    link: 'https://pratyagrasilks.com',
    logo: 'https://www.google.com/s2/favicons?domain=pratyagrasilks.com&sz=128',
  },
  {
    id: 2,
    name: 'Wanderingkite Studio',
    tag: 'Brand Design / UX',
    description:
      'Optimized tech stack and built a high-performance platform with focus on user experience and brand identity.',
    metrics: [
      '70% Load Time Reduction',
      '2.5x Conversions',
      'Modern Tech Stack',
    ],
    gradient: 'from-purple/20 to-pink/20',
    link: 'https://www.wanderingkite.in',
    logo: 'https://www.google.com/s2/favicons?domain=wanderingkite.in&sz=128',
  },
  {
    id: 3,
    name: 'Nihaa Jewels',
    tag: 'Digital Presence',
    description:
      'Crafted an elegant digital storefront for a fine jewellery brand, translating their in-store luxury experience into a seamless online discovery journey.',
    metrics: ['4x Organic Traffic Growth', '60% Longer Session Duration', '3x More Enquiries via Web'],
    gradient: 'from-blue/20 to-cyan/20',
    link: 'https://www.nihaajewels.com',
    logo: 'https://www.google.com/s2/favicons?domain=nihaajewels.com&sz=128',
  },
  {
    id: 4,
    name: 'Alusea',
    tag: 'Digital Presence',
    description:
      'Built a modern digital presence from the ground up with focus on performance and user engagement.',
    metrics: [
      'Modern Architecture',
      'High Performance',
      'Enhanced Engagement',
    ],
    gradient: 'from-green/20 to-cyan/20',
    link: 'https://www.alusea.in',
    logo: 'https://www.google.com/s2/favicons?domain=alusea.in&sz=128',
  },
  {
    id: 5,
    name: 'TagMyTaxi',
    tag: 'Brand Design / UX',
    description: 'Designed a modern, conversion-focused website that gave a UAE-based taxi service a credible brand identity and a booking experience riders actually trust.',
    metrics: ['85% Improvement in Brand Perception', '40% Drop in Bounce Rate', '2x More Booking Inquiries'],
    gradient: 'from-cyan/20 to-green/20',
    link: 'https://tagmytaxi.ae',
    logo: '/clients/tagmytaxi.webp',
  },
  {
    id: 6,
    name: 'Kandangi Sarees',
    tag: 'eCommerce / Scale',
    description: 'Built a rich, catalogue-driven eCommerce experience for a traditional handloom brand — making it effortless for customers to explore, fall in love, and buy.',
    metrics: ['5x Product Discoverability', '65% Increase in Add-to-Cart Rate', '3.2x Revenue in First Quarter'],
    gradient: 'from-pink/20 to-purple/20',
    link: 'https://www.kandangisarees.com',
    logo: 'https://www.google.com/s2/favicons?domain=kandangisarees.com&sz=128',
  },
  {
    id: 7,
    name: 'Studio OS',
    tag: 'ERP / SaaS',
    description: 'Delivered a clean, intuitive ERP/SaaS web platform that simplified complex studio operations — reducing admin overhead and giving teams more time to focus on what matters.',
    metrics: ['70% Reduction in Manual Tasks', '50% Faster Onboarding', '98% User Retention at 3 Months'],
    gradient: 'from-purple/20 to-blue/20',
    link: 'https://www.wanderingkite.in/studiospace',
    logo: 'https://www.google.com/s2/favicons?domain=wanderingkite.in&sz=128',
  },
  {
    id: 8,
    name: 'Astrosara',
    tag: 'Digital Presence',
    description: 'Created a compelling digital home for an astrology platform — building trust through intentional design and driving consistent user engagement from day one.',
    metrics: ['3.5x Growth in Daily Active Users', '55% More Consultation Bookings', '80% Positive User Feedback Score'],
    gradient: 'from-cyan/20 to-blue/20',
    link: 'https://astrosara.in',
    logo: 'https://www.google.com/s2/favicons?domain=astrosara.in&sz=128',
  },
];

/** Filter values are the project tags themselves — no new copy introduced. */
const TAGS = Array.from(new Set(projects.map((p) => p.tag)));

/**
 * Splits a metric into its leading figure and the rest, so the number can carry
 * the visual weight a statistic deserves. Purely presentational — the string is
 * re-rendered whole, never edited.
 *
 *   '300% Revenue Growth'  -> ['300%', 'Revenue Growth']
 *   'Modern Tech Stack'    -> [null,   'Modern Tech Stack']
 */
function splitMetric(metric: string): [string | null, string] {
  const m = metric.match(/^([\d.]+[%x+]?)\s+(.*)$/i);
  return m ? [m[1], m[2]] : [null, metric];
}

export default function WorkPage() {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const visible = filter ? projects.filter((p) => p.tag === filter) : projects;

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
              Engineered <span className='xlu-brand-text'>Results</span>
            </h1>
            <p className='mt-6 text-xl leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
              Real projects. Measurable outcomes. Engineering-driven growth for
              businesses across industries.
            </p>
          </motion.div>
        </section>

        {/* ============ FILTER RAIL ============ */}
        <div
          className='flex flex-wrap items-center gap-2 border-y py-[var(--xlu-space-md)]'
          style={{ borderColor: 'var(--xlu-hairline)' }}
        >
          <span
            className='mr-2 text-[0.7rem] uppercase'
            style={{
              fontFamily: 'var(--xlu-font-mono)',
              letterSpacing: '0.16em',
              color: 'var(--xlu-ink-faint)',
            }}
          >
            {visible.length} / {projects.length}
          </span>

          {/* Tag filters — the labels are the existing project tags */}
          {[null, ...TAGS].map((t) => {
            const isActive = filter === t;
            return (
              <button
                key={t ?? 'all'}
                onClick={() => setFilter(t)}
                aria-pressed={isActive}
                className='xlu-pressable group/f inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors duration-[var(--xlu-dur-base)]'
                style={{
                  borderColor: isActive
                    ? 'color-mix(in srgb, var(--xlu-brand-1) 55%, transparent)'
                    : 'var(--xlu-hairline)',
                  background: isActive
                    ? 'color-mix(in srgb, var(--xlu-brand-1) 10%, transparent)'
                    : 'transparent',
                  color: isActive ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-subtle)',
                }}
              >
                {/* Node dot — filled when this filter is the active one */}
                <span
                  aria-hidden
                  className='h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-[var(--xlu-dur-base)]'
                  style={{
                    background: isActive ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-faint)',
                    boxShadow: isActive ? '0 0 8px 1px var(--xlu-brand-1)' : 'none',
                  }}
                />
                {t ?? 'All'}
              </button>
            );
          })}
        </div>

        {/* ============ PROJECT GRID ============ */}
        <motion.div
          layout={!reduced}
          className='grid grid-cols-1 gap-3 py-[var(--xlu-space-xl)] md:grid-cols-2'
        >
          {visible.map((project, i) => {
            const isHovered = hovered === project.id;
            const isDimmed = hovered !== null && !isHovered;

            return (
              <motion.article
                key={project.id}
                layout={!reduced}
                // A single `animate` target drives both the entrance and the
                // dim-on-sibling-hover state. Previously this had BOTH
                // whileInView='visible' and an `animate` prop — `animate` wins,
                // so the reveal variant never ran. It also meant filtering,
                // which re-mounts cards already in the viewport, left them
                // stuck at their hidden opacity.
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                animate={{ opacity: isDimmed ? 0.55 : 1, y: 0 }}
                transition={{ ...springDefault, delay: (i % 2) * 0.05 }}
                onMouseEnter={() => setHovered(project.id)}
                onMouseLeave={() => setHovered(null)}
                whileHover={reduced ? undefined : { y: -4 }}
                className='group relative overflow-hidden rounded-2xl border p-[var(--xlu-space-lg)]'
                style={{
                  borderColor: isHovered
                    ? 'color-mix(in srgb, var(--xlu-brand-1) 45%, transparent)'
                    : 'var(--xlu-hairline)',
                  background:
                    'linear-gradient(160deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                  boxShadow:
                    '0 24px 60px -30px rgba(0,0,0,0.95), inset 0 1px 0 0 rgba(255,255,255,0.05)',
                  transition: 'border-color 200ms var(--xlu-ease-out)',
                }}
              >
                {/* Accent wash on hover */}
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--xlu-dur-slow)] group-hover:opacity-100'
                  style={{
                    background:
                      'radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in srgb, var(--xlu-brand-1) 14%, transparent), transparent 70%)',
                  }}
                />

                {/* Index numeral — quiet ledger chrome, brightens on hover */}
                <span
                  aria-hidden
                  className='pointer-events-none absolute right-5 top-4 text-[0.7rem] tabular-nums transition-colors duration-[var(--xlu-dur-base)]'
                  style={{
                    fontFamily: 'var(--xlu-font-mono)',
                    letterSpacing: '0.14em',
                    color: isHovered ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-faint)',
                  }}
                >
                  {String(project.id).padStart(2, '0')}
                </span>

                {/* Corner bracket that draws in on hover */}
                <span
                  aria-hidden
                  className='pointer-events-none absolute left-0 top-0 h-6 w-6 border-l border-t opacity-0 transition-opacity duration-[var(--xlu-dur-base)] group-hover:opacity-100'
                  style={{ borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 55%, transparent)' }}
                />

                <div className='relative'>
                  {/* Logo + tag */}
                  <div className='mb-5 flex items-center justify-between gap-4 pr-10'>
                    {project.logo && (
                      <a
                        href={project.link}
                        target='_blank'
                        rel='noopener noreferrer'
                        aria-label={`Visit ${project.name} website`}
                        className='flex h-12 items-center justify-center rounded-xl border px-3 py-2 transition-colors duration-[var(--xlu-dur-base)]'
                        style={{
                          borderColor: 'var(--xlu-hairline)',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={project.logo}
                          alt={`${project.name} logo`}
                          loading='lazy'
                          className='h-full w-auto max-w-[140px] rounded-md object-contain'
                        />
                      </a>
                    )}
                    <span
                      className='shrink-0 rounded-full border px-3 py-1 text-[0.65rem] uppercase'
                      style={{
                        fontFamily: 'var(--xlu-font-mono)',
                        letterSpacing: '0.12em',
                        borderColor: 'var(--xlu-hairline)',
                        color: 'var(--xlu-brand-1)',
                      }}
                    >
                      {project.tag}
                    </span>
                  </div>

                  <h3 className='text-2xl font-bold tracking-[-0.015em]'>{project.name}</h3>

                  <p className='mt-3 leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                    {project.description}
                  </p>

                  {/* Metrics as nodes on a rail */}
                  <div
                    className='relative mt-6 border-t pt-4'
                    style={{ borderColor: 'var(--xlu-hairline)' }}
                  >
                    <div className='space-y-2.5'>
                      {project.metrics.map((metric, index) => {
                        const [figure, rest] = splitMetric(metric);
                        return (
                          <div key={index} className='flex items-baseline gap-3'>
                            <span
                              aria-hidden
                              className='relative top-[-0.15rem] h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-[var(--xlu-dur-base)] group-hover:scale-150'
                              style={{ background: 'var(--xlu-brand-1)', opacity: 0.65 }}
                            />
                            {figure ? (
                              <span className='text-sm' style={{ color: 'var(--xlu-ink-muted)' }}>
                                {/* Leading figure carries the weight; wording is
                                    untouched. The space is emitted explicitly —
                                    JSX collapses whitespace between an element
                                    and a following expression, which would
                                    render "300%Revenue Growth". */}
                                <span className='xlu-brand-text text-base font-bold tabular-nums'>
                                  {figure}
                                </span>
                                {' '}
                                {rest}
                              </span>
                            ) : (
                              <span className='text-sm' style={{ color: 'var(--xlu-ink-muted)' }}>
                                {metric}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* View project */}
                  <Link
                    href={project?.link || `/work/${project.id}`}
                    target={project?.link ? '_blank' : '_self'}
                    className='xlu-pressable mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-[var(--xlu-dur-base)]'
                    style={{ color: 'var(--xlu-brand-1)' }}
                  >
                    <span>View Project</span>
                    <svg
                      className='h-4 w-4 transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M17 8l4 4m0 0l-4 4m4-4H3' />
                    </svg>
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>

        {/* ============ CTA ============ */}
        <motion.section
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={reduced ? { duration: 0.25 } : springDefault}
          className='relative mb-[var(--xlu-space-2xl)] overflow-hidden rounded-2xl border p-[clamp(2rem,5vw,3.5rem)] text-center'
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
            <h2 className='text-3xl font-bold tracking-[-0.02em]'>
              Ready to Engineer{' '}
              <span className='xlu-brand-text'>Your Growth?</span>
            </h2>
            <p className='mx-auto mt-4 max-w-xl' style={{ color: 'var(--xlu-ink-muted)' }}>
              Let&apos;s analyze your workflows and build a growth system tailored to
              your business.
            </p>
            <Link
              href='/#contact'
              className='xlu-pressable mt-[var(--xlu-space-lg)] inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-white'
              style={{ background: 'var(--xlu-brand-gradient)' }}
            >
              Get Your Growth Audit
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
