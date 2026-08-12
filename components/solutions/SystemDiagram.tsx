'use client';

/**
 * SystemDiagram — redesigned.
 *
 * Replaces the old glass+emoji card chain with a horizontal pipeline rail
 * using the xlu token system: hairline connectors, node dots, monospace
 * labels, material surface card — matching the marketing-architecture style.
 *
 * apple-design §11: only transform+opacity animated.
 * apple-design §13: respects useReducedMotion.
 * All original copy preserved verbatim.
 */

import { m as motion, useReducedMotion } from 'framer-motion';
import { springSnappy, revealViewport } from '@/components/marketing/motion';
import type { Transition } from 'framer-motion';

const STEPS = [
  { tag: 'SRC',  name: 'Traffic Source',  description: 'Google Ads, Meta, LinkedIn' },
  { tag: 'LP',   name: 'Landing Page',    description: 'Custom High-Convert Pages' },
  { tag: 'API',  name: 'API Event',       description: 'Server-Side Tracking' },
  { tag: 'CRM',  name: 'CRM',             description: 'Lead Nurturing & ROAS' },
];

export default function SystemDiagram() {
  const reduced = useReducedMotion();
  const t: Transition = reduced ? { duration: 0.2, ease: 'easeOut' } : springSnappy;

  return (
    <div
      className='overflow-hidden rounded-2xl border'
      style={{
        borderColor: 'var(--xlu-hairline)',
        background: 'rgba(15, 15, 23, 0.72)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 24px 60px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Terminal header */}
      <div className='flex items-center gap-3 border-b px-5 py-3' style={{ borderColor: 'var(--xlu-hairline)' }}>
        <span className='flex gap-1.5'>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} className='h-2 w-2 rounded-full' style={{ background: c, opacity: 0.55 }} />
          ))}
        </span>
        <span
          className='ml-2 text-[0.7rem] uppercase'
          style={{ fontFamily: 'var(--xlu-font-mono)', letterSpacing: '0.16em', color: 'var(--xlu-ink-faint)' }}
        >
          growth_system_flow.pipeline
        </span>
      </div>

      <div className='p-6'>

        {/* ── Horizontal pipeline — desktop ──
            Nodes size to their content; the CONNECTORS absorb the leftover
            width. Previously both the step wrapper and the node were flex-1,
            so on a wide screen the four nodes split the whole container and
            left large gaps around short labels. */}
        <div className='mx-auto hidden max-w-4xl items-start md:flex'>
          {STEPS.map((step, i) => (
            <div key={step.tag} className='flex flex-1 items-center last:flex-none'>

              {/* Step node */}
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={revealViewport}
                transition={(reduced ? { duration: 0.2 } : { ...t, delay: i * 0.1 }) as Transition}
                className='flex w-[10.5rem] shrink-0 flex-col items-center'
              >
                {/* Mono tag chip */}
                <div
                  className='mb-3 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase'
                  style={{
                    fontFamily: 'var(--xlu-font-mono)',
                    letterSpacing: '0.14em',
                    background: 'color-mix(in srgb, var(--xlu-brand-1) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--xlu-brand-1) 24%, transparent)',
                    color: 'var(--xlu-brand-1)',
                  }}
                >
                  {step.tag}
                </div>

                {/* Node circle — steady, no constant ping */}
                <div className='relative mb-3 flex h-10 w-10 items-center justify-center'>
                  <span
                    className='flex h-8 w-8 items-center justify-center rounded-full border-2'
                    style={{
                      borderColor: 'var(--xlu-brand-1)',
                      background: 'color-mix(in srgb, var(--xlu-brand-1) 12%, transparent)',
                    }}
                  >
                    <span
                      className='h-2.5 w-2.5 rounded-full'
                      style={{ background: 'var(--xlu-brand-1)' }}
                    />
                  </span>
                </div>

                {/* Label */}
                <span
                  className='block text-center text-sm font-semibold'
                  style={{ color: 'var(--xlu-ink-base)', lineHeight: 1.3 }}
                >
                  {step.name}
                </span>
                <span
                  className='mt-1 block text-center text-[0.72rem]'
                  style={{ color: 'var(--xlu-ink-faint)', fontFamily: 'var(--xlu-font-mono)' }}
                >
                  {step.description}
                </span>
              </motion.div>

              {/* Connector line + arrowhead between nodes */}
              {i < STEPS.length - 1 && (
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
                  whileInView={reduced ? { opacity: 1 } : { opacity: 1, scaleX: 1 }}
                  viewport={revealViewport}
                  transition={(reduced ? { duration: 0.2 } : { ...t, delay: i * 0.1 + 0.15 }) as Transition}
                  className='relative mx-3 mt-[1.35rem] h-px min-w-[2rem] flex-1'
                  style={{
                    transformOrigin: 'left',
                    background: 'linear-gradient(90deg, var(--xlu-brand-1), color-mix(in srgb, var(--xlu-brand-1) 40%, transparent))',
                  }}
                >
                  {/* Arrowhead */}
                  <span
                    className='absolute right-0 top-1/2 -translate-y-1/2'
                    style={{ color: 'var(--xlu-brand-1)', fontSize: '0.6rem', lineHeight: 1 }}
                  >
                    ▶
                  </span>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* ── Vertical pipeline — mobile ── */}
        <div className='flex flex-col gap-0 md:hidden'>
          {STEPS.map((step, i) => (
            <div key={step.tag}>
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
                whileInView={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
                viewport={revealViewport}
                transition={(reduced ? { duration: 0.2 } : { ...t, delay: i * 0.08 }) as Transition}
                className='relative flex items-start gap-4 py-3 pl-4'
              >
                {/* Left track dot */}
                <span
                  className='mt-1.5 h-2 w-2 shrink-0 rounded-full'
                  style={{ background: 'var(--xlu-brand-1)', opacity: 0.7 }}
                />
                <div>
                  <span
                    className='text-[0.65rem] uppercase'
                    style={{ fontFamily: 'var(--xlu-font-mono)', letterSpacing: '0.14em', color: 'var(--xlu-brand-1)' }}
                  >
                    {step.tag}
                  </span>
                  <span className='ml-2 text-sm font-semibold' style={{ color: 'var(--xlu-ink-base)' }}>
                    {step.name}
                  </span>
                  <p className='mt-0.5 text-[0.75rem]' style={{ color: 'var(--xlu-ink-faint)', fontFamily: 'var(--xlu-font-mono)' }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>

              {/* Vertical connector */}
              {i < STEPS.length - 1 && (
                <div className='ml-[1.1rem] h-4 w-px' style={{ background: 'var(--xlu-hairline)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Legend footer ── */}
        <div
          className='mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-lg border px-4 py-2.5'
          style={{ borderColor: 'var(--xlu-hairline)', background: 'rgba(255,255,255,0.02)' }}
        >
          {[
            { icon: '⚡', label: 'Server-Side Tracking Bypasses iOS Blocks' },
            { icon: '▪',  label: 'Real-Time ROAS Monitoring' },
            { icon: '◎',  label: 'Automated Lead Nurturing' },
          ].map((item) => (
            <span
              key={item.label}
              className='flex items-center gap-1.5 text-[0.7rem]'
              style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-subtle)' }}
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
