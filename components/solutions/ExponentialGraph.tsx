'use client';

/**
 * ExponentialGraph — redesigned.
 *
 * New design: terminal/dashboard aesthetic.
 * - Animated vertical bar columns instead of a curved SVG line.
 * - Milestone callout cards at M3 / M6 / M12 that stagger in.
 * - Monospace labels, hairline grid, brand-token colors.
 * - apple-design §11: bars animate height via scaleY (transform only).
 * - apple-design §13: respects prefers-reduced-motion.
 * - All original data preserved: 3x / 10x / 25x at months 3 / 6 / 12.
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import { springSnappy, replayViewport } from '@/components/marketing/motion';
import type { Transition } from 'framer-motion';

// Month columns — heights are % of max (month 12 = 100 %)
const MONTHS = [
  { label: 'M1',  height: 8  },
  { label: 'M2',  height: 14 },
  { label: 'M3',  height: 24 },
  { label: 'M4',  height: 33 },
  { label: 'M5',  height: 44 },
  { label: 'M6',  height: 58 },
  { label: 'M7',  height: 67 },
  { label: 'M8',  height: 74 },
  { label: 'M9',  height: 82 },
  { label: 'M10', height: 88 },
  { label: 'M11', height: 94 },
  { label: 'M12', height: 100 },
];

// Milestone pins — align with bar indices
const MILESTONES = [
  { barIndex: 2,  value: '3x',  label: 'Month 3', caption: 'Growth' },
  { barIndex: 5,  value: '10x', label: 'Month 6', caption: 'Growth' },
  { barIndex: 11, value: '25x', label: 'Month 12', caption: 'Growth' },
];

// Bar color — cyan at low, brand-1 at high, accent at peak
function barColor(pct: number): string {
  if (pct >= 90) return 'var(--xlu-brand-1)';
  if (pct >= 50) return 'color-mix(in srgb, var(--xlu-brand-1) 80%, var(--xlu-brand-3))';
  return 'color-mix(in srgb, var(--xlu-brand-1) 55%, var(--xlu-brand-2))';
}

export default function ExponentialGraph() {
  const reduced = useReducedMotion();
  const t: Transition = reduced
    ? { duration: 0.2, ease: 'easeOut' }
    : springSnappy;

  return (
    <div
      className='overflow-hidden rounded-2xl border'
      style={{
        borderColor: 'var(--xlu-hairline)',
        background: 'rgba(15, 15, 23, 0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 32px 80px -28px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Terminal header bar ── */}
      <div
        className='flex items-center justify-between border-b px-5 py-3'
        style={{ borderColor: 'var(--xlu-hairline)' }}
      >
        <div className='flex items-center gap-2'>
          <span className='flex gap-1.5'>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <span
                key={c}
                className='h-2 w-2 rounded-full'
                style={{ background: c, opacity: 0.55 }}
              />
            ))}
          </span>
          <span
            className='ml-2 text-[0.7rem] uppercase'
            style={{
              fontFamily: 'var(--xlu-font-mono)',
              letterSpacing: '0.16em',
              color: 'var(--xlu-ink-faint)',
            }}
          >
            traffic_velocity.dashboard
          </span>
        </div>
        {/* Live indicator */}
        {!reduced && (
          <span className='flex items-center gap-1.5'>
            <span className='relative flex h-1.5 w-1.5'>
              <span
                className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-60'
                style={{ background: 'var(--xlu-brand-1)' }}
              />
              <span
                className='relative inline-flex h-1.5 w-1.5 rounded-full'
                style={{ background: 'var(--xlu-brand-1)' }}
              />
            </span>
            <span
              className='text-[0.65rem]'
              style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-brand-1)' }}
            >
              LIVE
            </span>
          </span>
        )}
      </div>

      <div className='p-6'>

        {/* ── Milestone callout cards ── */}
        <div className='mb-6 grid grid-cols-3 gap-3'>
          {MILESTONES.map((m, i) => (
            <motion.div
              key={m.value}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={replayViewport}
              transition={reduced ? { duration: 0.2 } : ({ ...springSnappy, delay: i * 0.08 } as Transition)}
              className='rounded-xl border p-4 text-center'
              style={{
                borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 22%, transparent)',
                background: 'color-mix(in srgb, var(--xlu-brand-1) 6%, transparent)',
              }}
            >
              <div
                className='font-bold'
                style={{
                  fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--xlu-brand-1)',
                }}
              >
                {m.value}
              </div>
              <div
                className='mt-1.5 text-[0.7rem] uppercase'
                style={{
                  fontFamily: 'var(--xlu-font-mono)',
                  letterSpacing: '0.12em',
                  color: 'var(--xlu-ink-subtle)',
                }}
              >
                {m.label} {m.caption}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Bar chart ── */}
        <div
          className='relative rounded-xl border p-4'
          style={{
            borderColor: 'var(--xlu-hairline)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {/* Hairline grid rows */}
          <div className='pointer-events-none absolute inset-x-4 top-4 bottom-8' aria-hidden>
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className='absolute w-full'
                style={{
                  bottom: `${pct}%`,
                  borderTop: '1px solid var(--xlu-hairline)',
                }}
              />
            ))}
          </div>

          {/* Bars */}
          <div className='relative flex items-end gap-1.5 pb-8' style={{ height: '180px' }}>
            {MONTHS.map((m, i) => {
              const isMilestone = MILESTONES.some((ms) => ms.barIndex === i);
              return (
                <div
                  key={m.label}
                  className='group relative flex flex-1 flex-col items-center justify-end'
                  style={{ height: '100%' }}
                >
                  {/* Bar — scaleY from bottom via transform-origin */}
                  <motion.div
                    initial={reduced ? { opacity: 0 } : { scaleY: 0, opacity: 0 }}
                    whileInView={reduced ? { opacity: 1 } : { scaleY: 1, opacity: 1 }}
                    viewport={replayViewport}
                    transition={
                      reduced
                        ? { duration: 0.2 }
                        : ({ ...t, delay: i * 0.04 } as Transition)
                    }
                    style={{
                      width: '100%',
                      height: `${m.height}%`,
                      transformOrigin: 'bottom',
                      borderRadius: '4px 4px 2px 2px',
                      background: isMilestone
                        ? 'var(--xlu-brand-1)'
                        : barColor(m.height),
                      opacity: isMilestone ? 1 : 0.55,
                      boxShadow: isMilestone
                        ? '0 0 12px rgba(18,229,254,0.4)'
                        : 'none',
                      transition: 'opacity 200ms, box-shadow 200ms',
                    }}
                  />

                  {/* X-axis label */}
                  <span
                    className='absolute -bottom-6 text-[0.55rem]'
                    style={{
                      fontFamily: 'var(--xlu-font-mono)',
                      color: isMilestone ? 'var(--xlu-brand-1)' : 'var(--xlu-ink-faint)',
                      fontWeight: isMilestone ? 700 : 400,
                    }}
                  >
                    {m.label}
                  </span>

                  {/* Milestone value pin above bar */}
                  {isMilestone && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={replayViewport}
                      transition={({ ...t, delay: i * 0.04 + 0.2 } as Transition)}
                      className='absolute text-[0.6rem] font-bold'
                      style={{
                        bottom: `calc(${m.height}% + 6px)`,
                        fontFamily: 'var(--xlu-font-mono)',
                        color: 'var(--xlu-brand-1)',
                      }}
                    >
                      {MILESTONES.find((ms) => ms.barIndex === i)?.value}
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Y-axis label */}
          <span
            className='pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 -rotate-90 text-[0.55rem] uppercase'
            style={{
              fontFamily: 'var(--xlu-font-mono)',
              letterSpacing: '0.14em',
              color: 'var(--xlu-ink-faint)',
            }}
            aria-hidden
          >
            Organic Traffic
          </span>
        </div>

        {/* ── Footer legend ── */}
        <div
          className='mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg border px-4 py-3'
          style={{
            borderColor: 'var(--xlu-hairline)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {[
            { icon: '▪', label: 'Programmatic Content Generation' },
            { icon: '◎', label: 'High-Intent Keyword Targeting' },
            { icon: '⚡', label: 'Technical SEO Optimization' },
          ].map((item) => (
            <span
              key={item.label}
              className='flex items-center gap-1.5 text-[0.7rem]'
              style={{
                fontFamily: 'var(--xlu-font-mono)',
                color: 'var(--xlu-ink-subtle)',
              }}
            >
              <span style={{ color: 'var(--xlu-brand-1)' }}>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
