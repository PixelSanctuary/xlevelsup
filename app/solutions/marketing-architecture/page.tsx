'use client';

import { m as motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import LighthouseScore from '@/components/solutions/LighthouseScore';
import RequestPathDiagram from '@/components/solutions/RequestPathDiagram';
import {
  FigureSection,
  CornerBrackets,
  BlueprintGrid,
} from '@/components/solutions/FigureSection';
import { springDefault, revealViewport } from '@/components/marketing/motion';

// Canvas is client-only — same pattern as HeroAura. Kept out of SSR bundle
// so it never delays first paint of the headline.
const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

/**
 * /solutions/marketing-architecture — technical document layout.
 *
 * Replaces three back-to-back card grids with a figure-numbered structure that
 * reflects the page's subject (architecture), carrying the site's connected-node
 * theme through the request-path diagram and node-marked labels.
 *
 * All original copy is preserved verbatim: the headline, subhead, the three
 * stats, the Lighthouse section, the six "What You Get" items and the CTA.
 *
 * Stat source citations are intentionally omitted — see the note in the stat
 * strip below.
 */

const STATS = [
  { value: '53%', body: 'of mobile users abandon sites that take over 3 seconds to load' },
  { value: '100ms', body: 'faster load time = 1% increase in conversion rate' },
  { value: '2x', body: 'better SEO rankings for fast-loading sites' },
];

const SCOPE = [
  { tag: 'ARCH', title: 'Custom Next.js Architecture', desc: 'No templates. Built from scratch for your business.' },
  { tag: 'UX', title: 'Mobile-First Design', desc: 'Optimized for the 70% of users on mobile devices.' },
  { tag: 'SEO', title: 'SEO Foundation', desc: 'Semantic HTML, meta tags, and structured data built-in.' },
  { tag: 'CRO', title: 'Conversion Optimization', desc: 'Every element designed to guide users to action.' },
  { tag: 'DATA', title: 'Analytics Integration', desc: 'Track every interaction, optimize every funnel.' },
  { tag: 'OPS', title: 'Ongoing Performance', desc: 'Regular audits and optimizations included.' },
];

const PAGESPEED_URL =
  'https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fwww.xlevelsup.com';

export default function MarketingArchitecturePage() {
  const reduced = useReducedMotion();

  return (
    <main className='xlu min-h-screen'>
      <div className='xlu-container'>
        {/* ============ HERO ============ */}
        <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)]'>
          <BlueprintGrid />
          {/* Connected-node network — brand identity canvas. Sits behind all
              content via z-index. IntersectionObserver stops the rAF loop
              when the section leaves the viewport. */}
          <ConstellationField className='pointer-events-none absolute inset-0 h-full w-full' />
          {/* Vignette — protects headline legibility at the edges */}
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0'
            style={{
              background:
                'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 40%, var(--xlu-surface-0) 100%)',
            }}
          />
          <CornerBrackets />

          <div className='relative grid items-center gap-[var(--xlu-space-xl)] lg:grid-cols-[1.05fr_0.95fr]'>
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.25 } : springDefault}
            >
              <h1 className='text-[2.5rem] sm:text-5xl font-bold leading-tight tracking-[-0.02em] md:text-6xl'>
                Built for <span className='xlu-brand-text'>Speed</span>.
                <br />
                Designed to <span className='xlu-brand-text'>Convert</span>.
              </h1>

              <p
                className='mt-6 text-xl leading-relaxed'
                style={{ color: 'var(--xlu-ink-muted)' }}
              >
                We abandon slow WordPress templates for custom Next.js architectures that load instantly.
                Every millisecond counts when you&apos;re converting visitors into customers.
              </p>
            </motion.div>

            {/* Build artifact — a rendered browser frame, so the hero has a
                visual anchor instead of type alone. Carries no copy: the chrome
                is a URL bar and skeleton blocks, which are structure, not text. */}
            <motion.div
              aria-hidden
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.25 } : { ...springDefault, delay: 0.1 }}
              className='relative hidden overflow-hidden rounded-2xl border lg:block'
              style={{
                borderColor: 'var(--xlu-hairline)',
                background: 'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                boxShadow: '0 40px 100px -34px rgba(0,0,0,0.95)',
              }}
            >
              {/* Window chrome */}
              <div
                className='flex items-center gap-3 border-b px-4 py-3'
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <span className='flex gap-1.5'>
                  {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                    <span key={c} className='h-2.5 w-2.5 rounded-full' style={{ background: c, opacity: 0.55 }} />
                  ))}
                </span>
                <span
                  className='flex-1 truncate rounded-md px-3 py-1 text-[0.72rem]'
                  style={{
                    fontFamily: 'var(--xlu-font-mono)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--xlu-ink-faint)',
                  }}
                >
                  yourbrand.com
                </span>
              </div>

              {/* Rendered page skeleton */}
              <div className='p-4'>
                <div
                  className='h-40 w-full rounded-xl'
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--xlu-brand-1) 22%, var(--xlu-surface-2)) 0%, color-mix(in srgb, var(--xlu-brand-3) 20%, var(--xlu-surface-1)) 100%)',
                  }}
                />
                <div className='mt-3 grid grid-cols-3 gap-3'>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className='h-16 rounded-lg'
                      style={{ background: 'rgba(255,255,255,0.035)' }}
                    />
                  ))}
                </div>

                {/* Deploy status — mono chrome with a live dot */}
                <div className='mt-4 flex items-center gap-2'>
                  {!reduced && (
                    <span className='relative flex h-1.5 w-1.5'>
                      <span
                        className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-70'
                        style={{ background: 'var(--xlu-brand-1)' }}
                      />
                      <span
                        className='relative inline-flex h-1.5 w-1.5 rounded-full'
                        style={{ background: 'var(--xlu-brand-1)' }}
                      />
                    </span>
                  )}
                  <span
                    className='text-[0.7rem]'
                    style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-brand-1)' }}
                  >
                    deployed to production
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============ STAT STRIP ============ */}
        <motion.section
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={reduced ? { duration: 0.25 } : springDefault}
          className='border-y py-[var(--xlu-space-lg)]'
          style={{ borderColor: 'var(--xlu-hairline)' }}
        >
          {/* Visible, as on the original page, where it headed the three stats. */}
          <h2 className='mb-[var(--xlu-space-lg)] text-3xl font-bold tracking-[-0.02em]'>
            Why <span className='xlu-brand-text'>Performance</span> = Revenue
          </h2>
          {/* Node rail above the three stats — the connected-node motif that
              runs through the request path and the scope list. */}
          <div aria-hidden className='relative mb-[var(--xlu-space-md)] hidden h-3 md:block'>
            <div
              className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--xlu-hairline) 10%, var(--xlu-hairline) 90%, transparent)',
              }}
            />
            <div className='relative grid h-full grid-cols-3'>
              {STATS.map((s, i) => (
                <span key={s.value} className='flex items-center justify-center'>
                  <span
                    className='h-1.5 w-1.5 rounded-full'
                    style={{
                      background: 'var(--xlu-brand-1)',
                      opacity: i === 1 ? 0.9 : 0.5,
                    }}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-[var(--xlu-space-md)] md:grid-cols-3 md:gap-0'>
            {STATS.map((s, i) => (
              <div
                key={s.value}
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${
                  i > 0 ? 'md:border-l' : ''
                }`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <div className='xlu-brand-text text-4xl font-bold'>{s.value}</div>
                <p className='mt-2 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ============ TECH STACK ============ */}
        <FigureSection
          title={
            <>
              The <span className='xlu-brand-text'>Tech Stack</span>
            </>
          }
        >
          <RequestPathDiagram />
        </FigureSection>

        {/* ============ VITALS ============ */}
        <FigureSection
          title={
            <>
              The <span className='xlu-brand-text'>Vitals</span>
            </>
          }
        >
          <LighthouseScore />
          <div className='mt-[var(--xlu-space-md)]'>
            <a
              href={PAGESPEED_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='xlu-link inline-flex items-center gap-2 text-sm font-semibold'
              style={{ color: 'var(--xlu-brand-1)' }}
            >
              View live PageSpeed report
              <span aria-hidden>→</span>
            </a>
          </div>
        </FigureSection>

        {/* ============ WHAT YOU GET ============ */}
        <FigureSection
          title={
            <>
              What You <span className='xlu-brand-text'>Get</span>
            </>
          }
        >
          {/* The scope list is the whole section — a wide empty left column
              beside it read as dead space. The connected-node rail now runs
              inline down the list's own gutter instead of occupying a column
              of its own. */}
          <div className='relative'>
            <span
              aria-hidden
              className='absolute bottom-6 left-[3px] top-6 hidden w-px lg:block'
              style={{ background: 'var(--xlu-hairline)' }}
            />

            <dl className='lg:pl-8'>
              {SCOPE.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className='group relative flex gap-[var(--xlu-space-md)] border-t py-[var(--xlu-space-md)] transition-colors last:border-b'
                  style={{ borderColor: 'var(--xlu-hairline)' }}
                >
                  {/* Node marker sitting on the rail in the list gutter —
                      lights and grows on hover, so each scope item reads as a
                      node on the rail rather than a bullet. */}
                  <span
                    aria-hidden
                    className='absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full transition-all duration-[var(--xlu-dur-base)] group-hover:scale-[1.8] lg:block'
                    style={{
                      left: '-2rem',
                      marginLeft: '-0.1875rem',
                      background: 'var(--xlu-brand-1)',
                      opacity: 0.5,
                    }}
                  />
                  <dt
                    className='w-14 shrink-0 pt-0.5 text-[0.65rem] uppercase transition-colors duration-[var(--xlu-dur-base)]'
                    style={{
                      fontFamily: 'var(--xlu-font-mono)',
                      letterSpacing: '0.14em',
                      color: 'var(--xlu-brand-1)',
                    }}
                  >
                    {item.tag}
                  </dt>
                  <dd>
                    <span className='block font-semibold transition-transform duration-[var(--xlu-dur-base)] ease-[var(--xlu-ease-out)] group-hover:translate-x-1'>
                      {item.title}
                    </span>
                    <span className='mt-1 block text-sm' style={{ color: 'var(--xlu-ink-muted)' }}>
                      {item.desc}
                    </span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

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
            <h2 className='text-4xl font-bold tracking-[-0.02em]'>
              Ready to <span className='xlu-brand-text'>Upgrade</span> Your Architecture?
            </h2>
            <p className='mx-auto mt-4 max-w-xl text-lg' style={{ color: 'var(--xlu-ink-muted)' }}>
              Let&apos;s audit your current site and engineer a high-performance solution.
            </p>
            <Link
              href='/#contact'
              className='xlu-pressable mt-[var(--xlu-space-lg)] inline-flex items-center gap-2 rounded-full px-10 py-5 text-lg font-bold text-white'
              style={{ background: 'var(--xlu-brand-gradient)' }}
            >
              Upgrade My Architecture
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
