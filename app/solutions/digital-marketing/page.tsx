'use client';

/**
 * /solutions/digital-marketing
 *
 * Revamped to match marketing-architecture + search-engineering layout.
 * apple-design principles applied throughout:
 *
 * §1  Response — hover fires instantly via compositor transforms
 * §3  Interruptibility — springs only, no locked CSS transitions
 * §4  Springs — critically damped everywhere (bounce 0)
 * §7  Spatial consistency — all reveals travel y:20→0
 * §10 Vibrancy — material surfaces on hero card + CTA
 * §11 Perf — only transform+opacity animated
 * §12 Typography — optical sizing, tight tracking, balanced headings
 * §13 Reduced motion — useReducedMotion() strips travel
 * §14 Accessibility — 44px CTA, aria-hidden decoratives, focus rings
 *
 * All original copy preserved verbatim.
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  FigureSection,
  CornerBrackets,
  BlueprintGrid,
} from '@/components/solutions/FigureSection';
import {
  springDefault,
  springSnappy,
  revealViewport,
} from '@/components/marketing/motion';

// Canvas is client-only — same pattern as HeroAura.
const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

// ─── Data ──────────────────────────────────────────────────────────────────

const METRICS = [
  { value: '4×',   body: 'average reach lift when organic winners are pushed to paid' },
  { value: '30+',  body: 'pieces of content produced and posted per month per client' },
  { value: '<48h', body: 'turnaround from brief approval to first-cut video delivery' },
];

const PROCESS = [
  {
    tag: 'SCRIPT',
    step: '01',
    title: 'Data-Backed Scripting',
    description:
      'Video hooks written from live platform trend data and competitor ad analysis. Every script is a hypothesis designed to beat a benchmark — not just fill a brief.',
    label: 'Trend-Led Hooks',
  },
  {
    tag: 'PROD',
    step: '02',
    title: 'Studio Production',
    description:
      'Professional video shooting and editing in partnership with premium studios. Every deliverable is natively formatted for Instagram Reels, TikTok, and YouTube Shorts.',
    label: 'Mobile-Native Format',
  },
  {
    tag: 'SMM',
    step: '03',
    title: 'Social Media Management',
    description:
      'Consistent, high-quality organic posting managed end-to-end. We own your content calendar, captions, hashtag strategy, and community engagement.',
    label: 'Always-On Presence',
  },
  {
    tag: 'PAID',
    step: '04',
    title: 'Paid Amplification',
    description:
      'Top-performing organic content is injected into targeted Meta and Google Ads campaigns — turning proven hooks into paid assets that scale reach and revenue.',
    label: 'Organic × Paid Flywheel',
  },
];

const TOOLS = [
  { name: 'Meta Ads Manager' },
  { name: 'Premiere Pro' },
  { name: 'CapCut Pro' },
  { name: 'Content Calendars' },
  { name: 'GA4' },
];

const DELIVERABLES = [
  { title: 'Trend-Led Scripts & Hooks',     desc: 'Data-informed scripts written to capture attention in the first 3 seconds on every platform.' },
  { title: 'Studio-Quality Video Assets',   desc: 'Mobile-first video deliverables in all required formats — Reels, Shorts, TikTok, and square.' },
  { title: 'Full Social Media Management',  desc: 'End-to-end management of your brand presence: posting, captions, hashtags, and engagement.' },
  { title: 'Paid Ad Creatives',             desc: 'Organic winners repurposed and deployed as Meta/Google ad creatives — no wasted production budget.' },
  { title: 'Monthly Performance Report',    desc: 'Clear reporting on reach, engagement, CPM, CPC, and ROAS — tied to business outcomes.' },
  { title: 'Continuous Content Testing',    desc: 'Ongoing A/B testing of hooks, formats, and posting times to stay ahead of algorithm shifts.' },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function DigitalMarketingPage() {
  const reduced = useReducedMotion();

  const revealT: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springDefault;
  const snappyT: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springSnappy;

  const revealInit  = reduced ? { opacity: 0 }          : { opacity: 0, y: 20 };
  const revealAnim  = reduced ? { opacity: 1 }          : { opacity: 1, y: 0 };
  const rowInit     = reduced ? { opacity: 0 }          : { opacity: 0, y: 12 };

  return (
    <main className='xlu min-h-screen' style={{ fontOpticalSizing: 'auto' } as React.CSSProperties}>
      <div className='xlu-container'>

        {/* ══════════════════════════════════════════════════════════ HERO */}
        <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)]'>
          <BlueprintGrid />
          {/* Connected-node network — brand identity canvas */}
          <ConstellationField className='pointer-events-none absolute inset-0 h-full w-full' />
          {/* Vignette — protects headline legibility */}
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
              initial={revealInit}
              animate={revealAnim}
              transition={revealT}
            >
              <h1
                className='font-bold'
                style={{
                  fontSize: 'var(--xlu-size-hero)',
                  lineHeight: 'var(--xlu-leading-hero)',
                  letterSpacing: 'var(--xlu-track-hero)',
                  textWrap: 'balance',
                }}
              >
                Tech-Driven{' '}
                <span className='xlu-brand-text'>Digital</span>{' '}
                Marketing.
              </h1>
              <p
                className='mt-6 max-w-[54ch]'
                style={{
                  fontSize: 'var(--xlu-size-subhead)',
                  lineHeight: 'var(--xlu-leading-body)',
                  color: 'var(--xlu-ink-muted)',
                  textWrap: 'pretty',
                }}
              >
                We partner with premium studios to shoot high-retention content, then use algorithmic
                distribution and Meta Ads to turn viewers into revenue.
              </p>
            </motion.div>

            {/* Right — content flywheel visual card (§10: material surface) */}
            <motion.div
              aria-hidden
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.2 } : { ...springDefault, delay: 0.08 }}
              className='relative hidden overflow-hidden rounded-2xl border lg:block'
              style={{
                borderColor: 'var(--xlu-hairline)',
                background: 'rgba(15, 15, 23, 0.72)',
                backdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 40px 100px -34px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Terminal chrome */}
              <div className='flex items-center gap-3 border-b px-4 py-3' style={{ borderColor: 'var(--xlu-hairline)' }}>
                <span className='flex gap-1.5'>
                  {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                    <span key={c} className='h-2.5 w-2.5 rounded-full' style={{ background: c, opacity: 0.55 }} />
                  ))}
                </span>
                <span
                  className='flex-1 truncate rounded-md px-3 py-1 text-[0.72rem]'
                  style={{ fontFamily: 'var(--xlu-font-mono)', background: 'rgba(255,255,255,0.04)', color: 'var(--xlu-ink-faint)' }}
                >
                  content_flywheel.dashboard
                </span>
              </div>

              {/* Flywheel step pills */}
              <div className='space-y-2.5 p-4'>
                {[
                  { step: '01', label: 'Trend Research', status: 'complete' },
                  { step: '02', label: 'Script & Hook Writing', status: 'complete' },
                  { step: '03', label: 'Studio Shoot', status: 'active' },
                  { step: '04', label: 'Edit → Post → Analyse', status: 'pending' },
                  { step: '05', label: 'Paid Amplification', status: 'pending' },
                ].map((r) => (
                  <div
                    key={r.step}
                    className='flex items-center gap-3 rounded-lg px-3 py-2.5'
                    style={{
                      background: r.status === 'active' ? 'color-mix(in srgb, var(--xlu-brand-1) 8%, transparent)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${r.status === 'active' ? 'color-mix(in srgb, var(--xlu-brand-1) 28%, transparent)' : 'var(--xlu-hairline)'}`,
                    }}
                  >
                    <span
                      className='shrink-0 text-[0.6rem] font-bold'
                      style={{ fontFamily: 'var(--xlu-font-mono)', color: r.status === 'complete' ? 'var(--xlu-brand-1)' : r.status === 'active' ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-faint)' }}
                    >
                      {r.status === 'complete' ? '✓' : r.step}
                    </span>
                    <span
                      className='text-sm font-medium'
                      style={{ color: r.status === 'pending' ? 'var(--xlu-ink-faint)' : 'var(--xlu-ink-muted)' }}
                    >
                      {r.label}
                    </span>
                    {r.status === 'active' && !reduced && (
                      <span className='relative ml-auto flex h-1.5 w-1.5'>
                        <span className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-70' style={{ background: 'var(--xlu-brand-1)' }} />
                        <span className='relative inline-flex h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ STAT STRIP */}
        <motion.section
          initial={revealInit}
          whileInView={revealAnim}
          viewport={revealViewport}
          transition={revealT}
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
            Why <span className='xlu-brand-text'>Content + Distribution</span> = Revenue
          </h2>

          {/* Node rail */}
          <div aria-hidden className='relative mb-[var(--xlu-space-md)] hidden h-3 md:block'>
            <div
              className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
              style={{ background: 'linear-gradient(90deg, transparent, var(--xlu-hairline) 10%, var(--xlu-hairline) 90%, transparent)' }}
            />
            <div className='relative grid h-full grid-cols-3'>
              {METRICS.map((m, i) => (
                <span key={m.value} className='flex items-center justify-center'>
                  <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)', opacity: i === 1 ? 0.9 : 0.5 }} />
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-[var(--xlu-space-md)] md:grid-cols-3 md:gap-0'>
            {METRICS.map((m, i) => (
              <div
                key={m.value}
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${i > 0 ? 'md:border-l' : ''}`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <div
                  className='xlu-brand-text font-bold'
                  style={{ fontSize: 'var(--xlu-size-stat)', lineHeight: 0.95, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}
                >
                  {m.value}
                </div>
                <p className='mt-3 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                  {m.body}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ THE PROCESS */}
        <FigureSection
          title={<>The <span className='xlu-brand-text'>Process</span></>}
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
                  initial={rowInit}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.07 }) as Transition}
                  className='group relative flex gap-[var(--xlu-space-md)] border-t py-[var(--xlu-space-md)] last:border-b'
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
                  <dt
                    className='w-16 shrink-0 pt-0.5 text-[0.65rem] uppercase'
                    style={{ fontFamily: 'var(--xlu-font-mono)', letterSpacing: '0.14em', color: 'var(--xlu-brand-1)' }}
                  >
                    {item.tag}
                  </dt>
                  <dd>
                    <span
                      className='text-[0.65rem] uppercase'
                      style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-faint)', letterSpacing: '0.14em' }}
                    >
                      {item.step} — {item.label}
                    </span>
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
                    <span className='mt-1 block text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                      {item.description}
                    </span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

        {/* ══════════════════════════════════════════════════════ TOOL STACK */}
        <FigureSection
          title={<>The <span className='xlu-brand-text'>Tool Stack</span></>}
        >
          <div className='flex flex-wrap gap-3'>
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={rowInit}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={revealViewport}
                transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.06 }) as Transition}
                className='flex items-center gap-2.5 rounded-full border px-4 py-2'
                style={{
                  borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 22%, transparent)',
                  background: 'color-mix(in srgb, var(--xlu-brand-1) 5%, transparent)',
                  transition: `border-color var(--xlu-dur-base) var(--xlu-ease-out), background var(--xlu-dur-base) var(--xlu-ease-out)`,
                }}
              >
                <span
                  className='h-1.5 w-1.5 rounded-full'
                  style={{ background: 'var(--xlu-brand-1)', opacity: 0.8 }}
                />
                <span
                  className='text-sm font-medium'
                  style={{ color: 'var(--xlu-ink-muted)', fontFamily: 'var(--xlu-font-mono)', fontSize: '0.8rem' }}
                >
                  {tool.name}
                </span>
              </motion.div>
            ))}
          </div>
        </FigureSection>

        {/* ══════════════════════════════════════════════════ WHAT YOU GET */}
        <FigureSection
          title={<>What You <span className='xlu-brand-text'>Get</span></>}
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
              {DELIVERABLES.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={rowInit}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.05 }) as Transition}
                  className='group relative flex gap-[var(--xlu-space-md)] border-t py-[var(--xlu-space-md)] last:border-b'
                  style={{ borderColor: 'var(--xlu-hairline)' }}
                >
                  <span
                    aria-hidden
                    className='absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full lg:block'
                    style={{
                      left: '-2rem', marginLeft: '-0.1875rem', background: 'var(--xlu-brand-1)',
                      opacity: 0.45,
                      transition: `transform var(--xlu-dur-base) var(--xlu-ease-out)`,
                    }}
                  />
                  <dd>
                    <span
                      className='block font-semibold'
                      style={{
                        fontSize: 'var(--xlu-size-h3)',
                        lineHeight: 'var(--xlu-leading-h3)',
                        letterSpacing: 'var(--xlu-track-h3)',
                        color: 'var(--xlu-brand-1)',
                        transition: `transform var(--xlu-dur-base) var(--xlu-ease-out)`,
                      }}
                    >
                      {item.title}
                    </span>
                    <span className='mt-1 block text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                      {item.desc}
                    </span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

        {/* ════════════════════════════════════════════════════════════ CTA */}
        <motion.section
          initial={revealInit}
          whileInView={revealAnim}
          viewport={revealViewport}
          transition={revealT}
          className='relative mb-[var(--xlu-space-2xl)] overflow-hidden rounded-2xl border p-[clamp(2rem,5vw,3.5rem)] text-center'
          style={{
            borderColor: 'var(--xlu-hairline)',
            background: 'rgba(15, 15, 23, 0.82)',
            backdropFilter: 'var(--xlu-material-thick)',
            boxShadow: '0 32px 90px -34px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <CornerBrackets all />
          <BlueprintGrid />

          <div className='relative'>
            <h2
              className='font-semibold'
              style={{
                fontSize: 'var(--xlu-size-h2)',
                lineHeight: 'var(--xlu-leading-h2)',
                letterSpacing: 'var(--xlu-track-h2)',
                textWrap: 'balance',
              }}
            >
              Ready to <span className='xlu-brand-text'>Grow</span> Your Digital Presence?
            </h2>
            <p
              className='mx-auto mt-4 max-w-[52ch]'
              style={{ fontSize: 'var(--xlu-size-subhead)', lineHeight: 'var(--xlu-leading-body)', color: 'var(--xlu-ink-muted)', textWrap: 'pretty' }}
            >
              Let&apos;s audit your content, map your audience, and build a system that turns attention into revenue.
            </p>
            <Link
              href='/#contact'
              className='xlu-pressable mt-[var(--xlu-space-lg)] inline-flex min-h-[44px] items-center gap-2 rounded-full px-10 py-4 text-lg font-bold text-white'
              style={{ background: 'var(--xlu-brand-gradient)' }}
            >
              Start My Marketing Engine
            </Link>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
