'use client';

/**
 * /solutions/growth-systems
 *
 * Revamped to match marketing-architecture + search-engineering + digital-marketing.
 * apple-design §1 §3 §4 §7 §10 §11 §12 §13 §14 applied throughout.
 * All original copy preserved verbatim.
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import SystemDiagram from '@/components/solutions/SystemDiagram';
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

const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

// ─── Data ──────────────────────────────────────────────────────────────────

const PROBLEM = [
  { stat: '60%',  body: 'of tracking pixels blocked by iOS 14.5+' },
  { stat: 'Bad',  body: 'Ad platforms make poor decisions with incomplete data' },
  { stat: '$$',   body: 'Budget wasted on campaigns that don\'t convert' },
];

const RESULTS = [
  { value: '-40%', label: 'Lower CAC' },
  { value: '+60%', label: 'More Conversions' },
  { value: '8x',   label: 'Average ROAS' },
  { value: '100%', label: 'Data Accuracy' },
];

const FEATURES = [
  {
    tag: 'TRACK',
    step: '01',
    title: 'Server-Side API Tracking',
    description: 'Bypass iOS blocks and ad blockers with server-side conversion tracking.',
    benefits: ['100% Accurate Data', 'Privacy Compliant', 'Platform Independent'],
  },
  {
    tag: 'AUTO',
    step: '02',
    title: 'Automated Lead Nurturing',
    description: 'SMS and email sequences that convert leads while you sleep.',
    benefits: ['Multi-Channel', 'Behavior Triggered', 'Personalized Content'],
  },
  {
    tag: 'ROAS',
    step: '03',
    title: 'Real-Time ROAS Dashboards',
    description: 'Know your return on ad spend instantly, optimize campaigns on the fly.',
    benefits: ['Live Metrics', 'Revenue Attribution', 'Campaign Insights'],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function GrowthSystemsPage() {
  const reduced = useReducedMotion();

  const revealT: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springDefault;
  const snappyT: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springSnappy;
  const revealInit = reduced ? { opacity: 0 } : { opacity: 0, y: 20 };
  const revealAnim = reduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const rowInit    = reduced ? { opacity: 0 } : { opacity: 0, y: 12 };

  return (
    <main className='xlu min-h-screen' style={{ fontOpticalSizing: 'auto' } as React.CSSProperties}>
      <div className='xlu-container'>

        {/* ══════════════════════════════════════════════════════════ HERO */}
        <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)]'>
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

          <div className='relative grid items-center gap-[var(--xlu-space-xl)] lg:grid-cols-[1.1fr_0.9fr]'>

            {/* Left — headline + subhead */}
            <motion.div initial={revealInit} animate={revealAnim} transition={revealT}>
              <h1
                className='font-bold'
                style={{
                  fontSize: 'var(--xlu-size-hero)',
                  lineHeight: 'var(--xlu-leading-hero)',
                  letterSpacing: 'var(--xlu-track-hero)',
                  textWrap: 'balance',
                }}
              >
                <span className='xlu-brand-text'>Algorithmic</span> User Acquisition.
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
                We use server-side tracking to feed ad platforms better data, lowering your CAC.
                Every conversion event is captured, every dollar is tracked, every campaign is optimized.
              </p>
            </motion.div>

            {/* Right — system status card (§10: material surface) */}
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
                  growth_system.monitor
                </span>
                {!reduced && (
                  <span className='flex items-center gap-1.5'>
                    <span className='relative flex h-1.5 w-1.5'>
                      <span className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-60' style={{ background: 'var(--xlu-brand-1)' }} />
                      <span className='relative inline-flex h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
                    </span>
                    <span className='text-[0.65rem]' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-brand-1)' }}>LIVE</span>
                  </span>
                )}
              </div>

              {/* Live metrics feed */}
              <div className='space-y-2 p-4'>
                {[
                  { key: 'events_tracked',   value: '14,847',   label: 'Conversion events today' },
                  { key: 'roas_live',        value: '8.2×',     label: 'Live ROAS' },
                  { key: 'cac_delta',        value: '−38%',     label: 'CAC vs. last month' },
                  { key: 'leads_nurturing',  value: '2,104',    label: 'Active nurture sequences' },
                ].map((row) => (
                  <div
                    key={row.key}
                    className='flex items-center justify-between rounded-lg px-3 py-2'
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--xlu-hairline)' }}
                  >
                    <span className='text-[0.65rem]' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-faint)' }}>
                      {row.key}
                    </span>
                    <div className='text-right'>
                      <span className='text-sm font-bold' style={{ color: 'var(--xlu-brand-1)', fontFamily: 'var(--xlu-font-mono)' }}>
                        {row.value}
                      </span>
                      <span className='ml-2 text-[0.6rem]' style={{ color: 'var(--xlu-ink-faint)', fontFamily: 'var(--xlu-font-mono)' }}>
                        {row.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════ THE PROBLEM */}
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
            The <span style={{ color: 'hsl(4, 62%, 58%)' }}>Problem</span> with Traditional Tracking
          </h2>

          {/* Node rail */}
          <div aria-hidden className='relative mb-[var(--xlu-space-md)] hidden h-3 md:block'>
            <div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2' style={{ background: 'linear-gradient(90deg, transparent, var(--xlu-hairline) 10%, var(--xlu-hairline) 90%, transparent)' }} />
            <div className='relative grid h-full grid-cols-3'>
              {PROBLEM.map((p, i) => (
                <span key={p.stat} className='flex items-center justify-center'>
                  <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'hsl(4, 62%, 58%)', opacity: i === 1 ? 1 : 0.55 }} />
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-[var(--xlu-space-md)] md:grid-cols-3 md:gap-0'>
            {PROBLEM.map((p, i) => (
              <div
                key={p.stat}
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${i > 0 ? 'md:border-l' : ''}`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <div
                  className='font-bold'
                  style={{
                    fontSize: 'var(--xlu-size-stat)',
                    lineHeight: 0.95,
                    letterSpacing: '-0.03em',
                    color: 'hsl(4, 62%, 58%)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {p.stat}
                </div>
                <p className='mt-3 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════ SYSTEM DIAGRAM */}
        <FigureSection
          title={<>The <span className='xlu-brand-text'>Growth System</span> Flow</>}
          intro='Every event — click, form fill, purchase — travels from ad platform through your server to the CRM in real time.'
        >
          <SystemDiagram />
        </FigureSection>

        {/* ══════════════════════════════════════════════════ SYSTEM FEATURES */}
        <FigureSection
          title={<>The <span className='xlu-brand-text'>System</span> Features</>}
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
              {FEATURES.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={rowInit}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={revealViewport}
                  transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.08 }) as Transition}
                  className='group relative flex gap-[var(--xlu-space-md)] border-t py-[var(--xlu-space-md)] last:border-b'
                  style={{ borderColor: 'var(--xlu-hairline)' }}
                >
                  <span
                    aria-hidden
                    className='absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full lg:block'
                    style={{ left: '-2rem', marginLeft: '-0.1875rem', background: 'var(--xlu-brand-1)', opacity: 0.45, transition: `transform var(--xlu-dur-base) var(--xlu-ease-out)` }}
                  />
                  <dt
                    className='w-14 shrink-0 pt-0.5 text-[0.65rem] uppercase'
                    style={{ fontFamily: 'var(--xlu-font-mono)', letterSpacing: '0.14em', color: 'var(--xlu-brand-1)' }}
                  >
                    {item.tag}
                  </dt>
                  <dd>
                    <span className='text-[0.65rem] uppercase' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-faint)', letterSpacing: '0.14em' }}>
                      {item.step}
                    </span>
                    <span
                      className='mt-0.5 block font-semibold'
                      style={{ fontSize: 'var(--xlu-size-h3)', lineHeight: 'var(--xlu-leading-h3)', letterSpacing: 'var(--xlu-track-h3)', transition: `transform var(--xlu-dur-base) var(--xlu-ease-out)` }}
                    >
                      {item.title}
                    </span>
                    <span className='mt-1 block text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                      {item.description}
                    </span>
                    {/* Benefit chips */}
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {item.benefits.map((b) => (
                        <span
                          key={b}
                          className='rounded-full px-2.5 py-1 text-[0.65rem]'
                          style={{
                            fontFamily: 'var(--xlu-font-mono)',
                            letterSpacing: '0.08em',
                            background: 'color-mix(in srgb, var(--xlu-brand-1) 8%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--xlu-brand-1) 20%, transparent)',
                            color: 'var(--xlu-brand-1)',
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

        {/* ══════════════════════════════════════════════════ EXPECTED RESULTS */}
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
            Expected <span className='xlu-brand-text'>Results</span>
          </h2>

          {/* Node rail */}
          <div aria-hidden className='relative mb-[var(--xlu-space-md)] hidden h-3 md:block'>
            <div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2' style={{ background: 'linear-gradient(90deg, transparent, var(--xlu-hairline) 10%, var(--xlu-hairline) 90%, transparent)' }} />
            <div className='relative grid h-full grid-cols-4'>
              {RESULTS.map((r, i) => (
                <span key={r.value} className='flex items-center justify-center'>
                  <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)', opacity: i === 2 ? 0.9 : 0.5 }} />
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-[var(--xlu-space-md)] md:grid-cols-4 md:gap-0'>
            {RESULTS.map((r, i) => (
              <motion.div
                key={r.value}
                initial={rowInit}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={revealViewport}
                transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.06 }) as Transition}
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${i > 0 ? 'md:border-l' : ''}`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <div
                  className='xlu-brand-text font-bold'
                  style={{ fontSize: 'var(--xlu-size-stat)', lineHeight: 0.95, letterSpacing: '-0.03em', color: 'hsl(4, 62%, 58%)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {r.value}
                </div>
                <p className='mt-3 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>{r.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

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
              Ready to <span className='xlu-brand-text'>Deploy</span> Your Growth System?
            </h2>
            <p
              className='mx-auto mt-4 max-w-[52ch]'
              style={{ fontSize: 'var(--xlu-size-subhead)', lineHeight: 'var(--xlu-leading-body)', color: 'var(--xlu-ink-muted)', textWrap: 'pretty' }}
            >
              Let&apos;s engineer a data-driven acquisition system that scales.
            </p>
            <Link
              href='/#contact'
              className='xlu-pressable mt-[var(--xlu-space-lg)] inline-flex min-h-[44px] items-center gap-2 rounded-full px-10 py-4 text-lg font-bold text-white'
              style={{ background: 'var(--xlu-brand-gradient)' }}
            >
              Deploy Growth System
            </Link>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
