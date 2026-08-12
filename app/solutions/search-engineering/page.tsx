'use client';

/**
 * /solutions/search-engineering
 *
 * apple-design principles applied throughout:
 *
 * §1  Response — hover states fire on :hover with compositor-only transforms
 * §3  Interruptibility — spring transitions only; no CSS transitions on gestures
 * §4  Springs — critically damped (bounce 0) everywhere. springDefault for
 *     scroll reveals. springSnappy for small row-level reveals.
 * §7  Spatial consistency — reveals always travel y: 20→0, exit same path.
 * §10 Vibrancy — hero card uses backdrop-filter blur+saturate as a material.
 * §11 Perf — only transform+opacity animated. No width/height transitions.
 * §12 Typography — optical sizing, tightened tracking, balanced headings,
 *     correct leading ratios. Display text: font-weight 600 at scale.
 * §13 Reduced motion — useReducedMotion() strips travel; opacity only.
 * §14 Accessibility — 44px minimum touch target on CTA; focus rings visible.
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ComparisonTable from '@/components/solutions/ComparisonTable';
import ExponentialGraph from '@/components/solutions/ExponentialGraph';
import {
  FigureSection,
  CornerBrackets,
  BlueprintGrid,
} from '@/components/solutions/FigureSection';
import {
  springDefault,
  springSnappy,
  staggerVariants,
  revealViewport,
} from '@/components/marketing/motion';

// Canvas is client-only — same pattern as HeroAura. Kept out of SSR bundle
// so it never delays first paint of the headline.
const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

// ─── Data ──────────────────────────────────────────────────────────────────

const STATS = [
  { value: '10x', body: 'More pages indexed than manual blogging' },
  { value: '3x',  body: 'Higher conversion rate from organic traffic' },
  { value: '100%', body: 'Core Web Vitals compliance' },
];

const PROCESS = [
  {
    step: '01',
    tag: 'DATA',
    title: 'Keyword Research at Scale',
    description:
      'We use data science to identify thousands of high-intent, low-competition keywords.',
  },
  {
    step: '02',
    tag: 'BUILD',
    title: 'Programmatic Page Generation',
    description:
      'Build templates that automatically generate SEO-optimized pages for each keyword cluster.',
  },
  {
    step: '03',
    tag: 'TECH',
    title: 'Technical SEO Foundation',
    description:
      'Schema.org markup, XML sitemaps, canonical tags, and Core Web Vitals optimization.',
  },
  {
    step: '04',
    tag: 'SCALE',
    title: 'Content Velocity',
    description:
      'Launch hundreds of pages in weeks, not months. Scale content production 10x.',
  },
];

const INCLUDED = [
  'Keyword Research & Clustering',
  'Programmatic Page Templates',
  'Schema.org Implementation',
  'Core Web Vitals Optimization',
  'XML Sitemap Generation',
  'Internal Linking Strategy',
  'Content Velocity System',
  'Analytics & Tracking Setup',
  'Monthly Performance Reports',
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function SearchEngineeringPage() {
  // §13: check prefers-reduced-motion first — this gates every animation below.
  const reduced = useReducedMotion();

  // §4: reusable spring configs — critically damped everywhere.
  const revealTransition: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springDefault;
  const snappyTransition: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springSnappy;

  // §13: when reduced, strip travel entirely — only opacity changes remain.
  const revealInitial   = reduced ? { opacity: 0 }               : { opacity: 0, y: 20 };
  const revealAnimate   = reduced ? { opacity: 1 }               : { opacity: 1, y: 0 };
  const rowInitial      = reduced ? { opacity: 0 }               : { opacity: 0, y: 12 };

  return (
    <main
      className='xlu min-h-screen'
      // §12: font-optical-sizing site-wide where not already set
      style={{ fontOpticalSizing: 'auto' } as React.CSSProperties}
    >
      <div className='xlu-container'>

        {/* ══════════════════════════════════════════════════════════ HERO */}
        <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)]'>
          {/* Blueprint grid fades out at edges — decorative, pointer-events:none */}
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

          <div className='relative grid items-center gap-[var(--xlu-space-xl)] lg:grid-cols-[1.1fr_0.9fr]'>

            {/* Left — headline + subhead */}
            <motion.div
              initial={revealInitial}
              animate={revealAnimate}
              transition={revealTransition}
            >
              {/* §12: display tracking -0.022em, text-wrap:balance, leading 1.08 */}
              <h1
                className='font-bold'
                style={{
                  fontSize: 'var(--xlu-size-hero)',
                  lineHeight: 'var(--xlu-leading-hero)',
                  letterSpacing: 'var(--xlu-track-hero)',
                  textWrap: 'balance',
                }}
              >
                Dominate{' '}
                <span className='xlu-brand-text'>Search Intent</span>.
              </h1>

              {/* §12: body copy — leading 1.7, tracking 0 */}
              <p
                className='mt-6 max-w-[54ch]'
                style={{
                  fontSize: 'var(--xlu-size-subhead)',
                  lineHeight: 'var(--xlu-leading-body)',
                  color: 'var(--xlu-ink-muted)',
                  textWrap: 'pretty',
                }}
              >
                We don&apos;t write random blogs. We build programmatic content
                engines that capture high-intent traffic at scale. Every page is
                engineered for conversion.
              </p>
            </motion.div>

            {/* Right — hero visual: translucent material card (§10) */}
            <motion.div
              aria-hidden
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0.2 }
                  : { ...springDefault, delay: 0.08 }
              }
              className='relative hidden overflow-hidden rounded-2xl border lg:block'
              style={{
                borderColor: 'var(--xlu-hairline)',
                // §10: material — vibrancy-aware translucent background
                background: 'rgba(15, 15, 23, 0.72)',
                backdropFilter: 'blur(20px) saturate(180%)',
                // §11: shadow with no animated property — static only
                boxShadow:
                  '0 40px 100px -34px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Window chrome — fixed height, no animation */}
              <div
                className='flex items-center gap-3 border-b px-4 py-3'
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <span className='flex gap-1.5'>
                  {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                    <span
                      key={c}
                      className='h-2.5 w-2.5 rounded-full'
                      style={{ background: c, opacity: 0.55 }}
                    />
                  ))}
                </span>
                <span
                  className='flex-1 truncate rounded-md px-3 py-1 text-[0.72rem]'
                  style={{
                    fontFamily: 'var(--xlu-font-mono)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--xlu-ink-faint)',
                  }}
                >
                  google.com/search?q=your+niche
                </span>
              </div>

              {/* Mock SERP cards — stagger on enter, §4 */}
              <motion.div
                className='space-y-3 p-4'
                initial='hidden'
                animate='visible'
                variants={
                  reduced
                    ? {
                        hidden: {},
                        visible: { transition: { staggerChildren: 0 } },
                      }
                    : staggerVariants(0.08, 0.15)
                }
              >
                {[
                  {
                    url: 'yourbrand.com › category › keyword',
                    title: 'Best [Product] for [Use Case] — Guide',
                    rank: '#1',
                  },
                  {
                    url: 'yourbrand.com › compare › vs-competitor',
                    title: '[Your Brand] vs [Competitor]: Full Review',
                    rank: '#2',
                  },
                  {
                    url: 'yourbrand.com › how-to › topic',
                    title: 'How to [Solve Problem] in 5 Steps',
                    rank: '#3',
                  },
                ].map((r) => (
                  <motion.div
                    key={r.rank}
                    variants={
                      reduced
                        ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                        : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: springSnappy } }
                    }
                    className='rounded-lg p-3'
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--xlu-hairline)',
                    }}
                  >
                    <div className='flex items-center justify-between'>
                      <span
                        className='text-[0.6rem]'
                        style={{
                          fontFamily: 'var(--xlu-font-mono)',
                          color: 'var(--xlu-ink-faint)',
                        }}
                      >
                        {r.url}
                      </span>
                      <span
                        className='rounded px-1.5 py-0.5 text-[0.6rem] font-bold'
                        style={{
                          fontFamily: 'var(--xlu-font-mono)',
                          background:
                            'color-mix(in srgb, var(--xlu-brand-1) 15%, transparent)',
                          color: 'var(--xlu-brand-1)',
                        }}
                      >
                        {r.rank}
                      </span>
                    </div>
                    <div
                      className='mt-1 text-sm font-medium leading-snug'
                      style={{ color: 'var(--xlu-ink-muted)' }}
                    >
                      {r.title}
                    </div>
                  </motion.div>
                ))}

                {/* Live indexing pulse — §1 instant feedback, decorative */}
                <div className='flex items-center gap-2 pt-1'>
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
                    style={{
                      fontFamily: 'var(--xlu-font-mono)',
                      color: 'var(--xlu-brand-1)',
                    }}
                  >
                    indexing 847 pages...
                  </span>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ STAT STRIP */}
        {/*
          §7: reveals travel y: 20→0 just like the hero — spatial consistency.
          §12: stat values use the brand color, not gradient text.
        */}
        <motion.section
          initial={revealInitial}
          whileInView={revealAnimate}
          viewport={revealViewport}
          transition={revealTransition}
          className='border-y py-[var(--xlu-space-lg)]'
          style={{ borderColor: 'var(--xlu-hairline)' }}
        >
          <h2
            className='mb-[var(--xlu-space-lg)] font-bold'
            style={{
              fontSize: 'var(--xlu-size-h2)',
              lineHeight: 'var(--xlu-leading-h2)',
              letterSpacing: 'var(--xlu-track-h2)',
              textWrap: 'balance',
            }}
          >
            Why <span className='xlu-brand-text'>Search Engineering</span> Works
          </h2>

          {/* Node rail above stats — connected-node motif, aria-hidden */}
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
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${i > 0 ? 'md:border-l' : ''}`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                {/* §12: stat numeral — tight leading, tabular nums */}
                <div
                  className='xlu-brand-text font-bold'
                  style={{
                    fontSize: 'var(--xlu-size-stat)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.value}
                </div>
                <p
                  className='mt-3 text-sm leading-relaxed'
                  style={{ color: 'var(--xlu-ink-muted)' }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════ COMPARISON */}
        <FigureSection
          title={
            <>
              The <span className='xlu-brand-text'>Engineering</span> Difference
            </>
          }
          intro='See how a programmatic search engine compares to traditional blogging at every scale.'
        >
          <ComparisonTable />
        </FigureSection>

        {/* ══════════════════════════════════════════════════ PROCESS */}
        {/*
          §12: row titles at h3 scale, body at body scale.
          §11: hover slides the title right via transform only.
          §1: response on pointer-enter — no delay.
        */}
        <FigureSection
          title={
            <>
              The <span className='xlu-brand-text'>Engineering</span> Process
            </>
          }
        >
          <div className='relative'>
            {/* Connected-node rail runs inline down the list gutter — a
                dedicated column for it left a wide band of dead space. */}
            <span
              aria-hidden
              className='absolute bottom-6 left-[3px] top-6 hidden w-px lg:block'
              style={{ background: 'var(--xlu-hairline)' }}
            />

            <dl className='lg:pl-8'>
              {PROCESS.map((item, i) => (
                <motion.div
                  key={item.step}
                  // §13: no travel under reduced-motion
                  initial={rowInitial}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  // §4: stagger each row slightly
                  transition={(reduced ? { duration: 0.2 } : { ...springSnappy, delay: i * 0.06 }) as Transition}
                  // group for hover coordination
                  className='group relative flex gap-[var(--xlu-space-md)] border-t py-[var(--xlu-space-md)] last:border-b'
                  style={{ borderColor: 'var(--xlu-hairline)' }}
                >
                  {/* Node marker — §11: only opacity + scale on hover */}
                  <span
                    aria-hidden
                    className='absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full lg:block'
                    style={{
                      left: '-2rem', marginLeft: '-0.1875rem', background: 'var(--xlu-brand-1)',
                      opacity: 0.45,
                      // §11: scale via transform, not width
                      transition: `transform var(--xlu-dur-base) var(--xlu-ease-out),
                                   opacity var(--xlu-dur-base) var(--xlu-ease-out)`,
                    }}
                  />
                  {/* §12: mono label — caption tracking */}
                  <dt
                    className='w-14 shrink-0 pt-0.5 text-[0.65rem] uppercase'
                    style={{
                      fontFamily: 'var(--xlu-font-mono)',
                      letterSpacing: '0.14em',
                      color: 'var(--xlu-brand-1)',
                    }}
                  >
                    {item.tag}
                  </dt>
                  <dd>
                    <span
                      className='text-[0.65rem] uppercase'
                      style={{
                        fontFamily: 'var(--xlu-font-mono)',
                        color: 'var(--xlu-ink-faint)',
                        letterSpacing: '0.14em',
                      }}
                    >
                      {item.step}
                    </span>
                    {/* §11: translate-x on hover — transform only */}
                    <span
                      className='mt-0.5 block font-semibold'
                      style={{
                        fontSize: 'var(--xlu-size-h3)',
                        lineHeight: 'var(--xlu-leading-h3)',
                        letterSpacing: 'var(--xlu-track-h3)',
                        transition: `transform var(--xlu-dur-base) var(--xlu-ease-out)`,
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      className='mt-1 block text-sm leading-relaxed'
                      style={{ color: 'var(--xlu-ink-muted)' }}
                    >
                      {item.description}
                    </span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

        {/* ══════════════════════════════════════════════════ GROWTH */}
        <FigureSection
          title={
            <>
              Organic <span className='xlu-brand-text'>Traffic Growth</span>
            </>
          }
          intro='Programmatic content compounds over time — every page published multiplies your surface area in search.'
        >
          <ExponentialGraph />
        </FigureSection>

        {/* ══════════════════════════════════════════════════ INCLUDED */}
        {/*
          §12: items at body size, check mark in brand color.
          §11: translate-x on hover — transform only.
          §1: hover responds immediately.
        */}
        <FigureSection
          title={
            <>
              What&apos;s <span className='xlu-brand-text'>Included</span>
            </>
          }
        >
          <div className='relative'>
            {/* Connected-node rail runs inline down the list gutter — a
                dedicated column for it left a wide band of dead space. */}
            <span
              aria-hidden
              className='absolute bottom-6 left-[3px] top-6 hidden w-px lg:block'
              style={{ background: 'var(--xlu-hairline)' }}
            />

            <dl className='lg:pl-8'>
              {INCLUDED.map((item, i) => (
                <motion.div
                  key={item}
                  initial={rowInitial}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  transition={(reduced ? { duration: 0.2 } : { ...springSnappy, delay: i * 0.04 }) as Transition}
                  className='group relative flex items-center gap-[var(--xlu-space-md)] border-t py-[var(--xlu-space-sm)] pl-4 last:border-b'
                  style={{ borderColor: 'var(--xlu-hairline)' }}
                >
                  {/* Node marker */}
                  <span
                    aria-hidden
                    className='absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full lg:block'
                    style={{
                      left: '-2rem', marginLeft: '-0.1875rem', background: 'var(--xlu-brand-1)',
                      opacity: 0.45,
                      transition: `transform var(--xlu-dur-base) var(--xlu-ease-out)`,
                    }}
                  />
                  {/* Check mark — §14: aria-hidden, decorative */}
                  <span
                    aria-hidden
                    className='shrink-0 text-xs font-bold'
                    style={{
                      color: 'var(--xlu-brand-1)',
                      fontFamily: 'var(--xlu-font-mono)',
                    }}
                  >
                    ✓
                  </span>
                  {/* §11: translate-x on hover via transform only */}
                  <span
                    className='font-medium'
                    style={{
                      color: 'var(--xlu-ink-muted)',
                      fontSize: 'var(--xlu-size-body)',
                      lineHeight: 'var(--xlu-leading-body)',
                      transition: `transform var(--xlu-dur-base) var(--xlu-ease-out),
                                   color var(--xlu-dur-base) var(--xlu-ease-out)`,
                    }}
                  >
                    {item}
                  </span>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

        {/* ════════════════════════════════════════════════════════════ CTA */}
        {/*
          §10: material surface — translucent + blur.
          §12: h2 display weight 600 at large scale.
          §14: CTA button min 44px tap target, focus ring.
          §11: button hover effect via transform (scale) only.
        */}
        <motion.section
          initial={revealInitial}
          whileInView={revealAnimate}
          viewport={revealViewport}
          transition={revealTransition}
          className='relative mb-[var(--xlu-space-2xl)] overflow-hidden rounded-2xl border p-[clamp(2rem,5vw,3.5rem)] text-center'
          style={{
            borderColor: 'var(--xlu-hairline)',
            // §10: material — translucent dark surface
            background: 'rgba(15, 15, 23, 0.82)',
            backdropFilter: 'var(--xlu-material-thick)',
            boxShadow: '0 32px 90px -34px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <CornerBrackets all />
          <BlueprintGrid />

          <div className='relative'>
            {/* §12: h2 — display weight 600, tight tracking, balanced */}
            <h2
              className='font-semibold'
              style={{
                fontSize: 'var(--xlu-size-h2)',
                lineHeight: 'var(--xlu-leading-h2)',
                letterSpacing: 'var(--xlu-track-h2)',
                textWrap: 'balance',
              }}
            >
              Ready to <span className='xlu-brand-text'>Start</span> Search Engineering?
            </h2>

            <p
              className='mx-auto mt-4 max-w-[52ch]'
              style={{
                fontSize: 'var(--xlu-size-subhead)',
                lineHeight: 'var(--xlu-leading-body)',
                color: 'var(--xlu-ink-muted)',
                textWrap: 'pretty',
              }}
            >
              Let&apos;s build a programmatic content engine that dominates your niche.
            </p>

            {/*
              §14: min 44px height — py-5 = 40px + line-height > 44px total.
              §1: press feedback via xlu-pressable (transform:scale on active).
              §11: no background animation on hover — only transform+box-shadow.
              Focus ring via outline (xlu-pressable includes it).
            */}
            <Link
              href='/#contact'
              className='xlu-pressable mt-[var(--xlu-space-lg)] inline-flex min-h-[44px] items-center gap-2 rounded-full px-10 py-4 text-lg font-bold text-white'
              style={{ background: 'var(--xlu-brand-gradient)' }}
            >
              Start Search Engineering
            </Link>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
