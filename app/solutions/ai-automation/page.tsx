'use client';

/**
 * /solutions/ai-automation
 *
 * Revamped to match marketing-architecture + search-engineering + digital-marketing + growth-systems.
 * apple-design §1 §3 §4 §7 §10 §11 §12 §13 §14 applied throughout.
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

const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

// ─── Data ──────────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  { stat: 'Hours', body: 'Your team wastes hours on data entry and repetitive tasks' },
  { stat: '↑ Cost', body: 'Hiring more people increases costs faster than revenue' },
  { stat: 'Slow',  body: 'Manual processes create bottlenecks that slow growth' },
];

const TECH_STACK = [
  { name: 'Python' },
  { name: 'OpenAI API' },
  { name: 'LangChain' },
  { name: 'Zapier' },
  { name: 'Make.com' },
  { name: 'n8n' },
];

const USE_CASES = [
  {
    tag: 'LEADS',
    step: '01',
    title: 'Lead Qualification',
    description:
      'AI agents that analyze inbound leads, score them based on your criteria, and route high-value prospects automatically.',
  },
  {
    tag: 'CRM',
    step: '02',
    title: 'CRM Automation',
    description:
      'Eliminate manual data entry. Our workflows sync data across platforms, update records, and trigger actions based on customer behavior.',
  },
  {
    tag: 'SUPPORT',
    step: '03',
    title: 'Customer Support',
    description:
      'AI-powered chatbots and email responders that handle tier-1 support, escalating complex issues to your team.',
  },
  {
    tag: 'CONTENT',
    step: '04',
    title: 'Content Generation',
    description:
      'Automated content pipelines for social media, email campaigns, and product descriptions using LLMs.',
  },
];

const PROCESS = [
  {
    tag: 'AUDIT',
    step: '01',
    title: 'Workflow Audit',
    description:
      'We map your current processes, identify repetitive tasks, and calculate time/cost savings potential.',
  },
  {
    tag: 'BUILD',
    step: '02',
    title: 'Custom Automation',
    description:
      'Build Python scripts, AI agents, or no-code workflows tailored to your exact needs.',
  },
  {
    tag: 'INTG',
    step: '03',
    title: 'Integration & Testing',
    description:
      'Connect to your existing tools (CRM, email, Slack) and test thoroughly before deployment.',
  },
  {
    tag: 'OPT',
    step: '04',
    title: 'Monitor & Optimize',
    description:
      'Track performance metrics and continuously improve automation efficiency.',
  },
];

const IMPACT = [
  { value: '70%',  label: 'Time Saved' },
  { value: '5x',   label: 'Faster Processing' },
  { value: '$0',   label: 'Hiring Costs' },
  { value: '24/7', label: 'Automation Runtime' },
];

// ─── AI Workflow Visual — replaces the old emoji hero icon ──────────────────

function AIWorkflowCard({ reduced }: { reduced: boolean | null }) {
  const nodes = [
    { id: 'input',   label: 'Inbound Lead',   x: '12%',  y: '20%' },
    { id: 'agent',   label: 'AI Agent',        x: '50%',  y: '18%' },
    { id: 'crm',     label: 'CRM Update',      x: '82%',  y: '20%' },
    { id: 'llm',     label: 'LLM Layer',       x: '50%',  y: '60%' },
    { id: 'notify',  label: 'Slack / Email',   x: '82%',  y: '62%' },
  ];

  const edges = [
    { x1: '20%', y1: '26%', x2: '44%', y2: '24%' },
    { x1: '56%', y1: '24%', x2: '76%', y2: '26%' },
    { x1: '50%', y1: '32%', x2: '50%', y2: '52%' },
    { x1: '56%', y1: '64%', x2: '76%', y2: '64%' },
  ];

  return (
    <div
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
          ai_agent_orchestrator.runtime
        </span>
        {!reduced && (
          <span className='flex items-center gap-1.5'>
            <span className='relative flex h-1.5 w-1.5'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-60' style={{ background: 'var(--xlu-brand-1)' }} />
              <span className='relative inline-flex h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
            </span>
            <span className='text-[0.65rem]' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-brand-1)' }}>RUNNING</span>
          </span>
        )}
      </div>

      {/* SVG node graph */}
      <div className='relative p-4' style={{ height: '200px' }}>
        <svg className='absolute inset-0 h-full w-full' viewBox='0 0 400 200' preserveAspectRatio='none'>
          {/* Connector edges */}
          {edges.map((e, i) => (
            <motion.line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke='var(--xlu-brand-1)'
              strokeWidth='0.8'
              strokeOpacity='0.35'
              strokeDasharray='4 3'
              initial={reduced ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              whileInView={reduced ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
            />
          ))}
        </svg>

        {/* Node labels */}
        {nodes.map((n, i) => (
          <motion.div
            key={n.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={({ ...springSnappy, delay: i * 0.08 }) as Transition}
            className='absolute -translate-x-1/2 -translate-y-1/2'
            style={{ left: n.x, top: n.y }}
          >
            <div
              className='flex flex-col items-center gap-1'
            >
              <div
                className='flex h-7 w-7 items-center justify-center rounded-full border'
                style={{
                  borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 50%, transparent)',
                  background: 'color-mix(in srgb, var(--xlu-brand-1) 12%, rgba(15,15,23,0.9))',
                }}
              >
                <span className='h-2 w-2 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
              </div>
              <span
                className='whitespace-nowrap rounded px-1.5 py-0.5 text-[0.58rem] font-medium'
                style={{
                  fontFamily: 'var(--xlu-font-mono)',
                  color: 'var(--xlu-ink-muted)',
                  background: 'rgba(15,15,23,0.8)',
                }}
              >
                {n.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live log feed */}
      <div className='border-t px-4 pb-4 pt-3' style={{ borderColor: 'var(--xlu-hairline)' }}>
        {[
          { ts: '12:48:02', msg: 'lead scored → high_value → routed to sales' },
          { ts: '12:48:05', msg: 'crm.update() → contact_id #4821 synced' },
          { ts: '12:48:07', msg: 'llm.generate() → email draft ready' },
        ].map((log) => (
          <div key={log.ts} className='flex gap-3 py-0.5'>
            <span className='shrink-0 text-[0.6rem]' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-faint)' }}>{log.ts}</span>
            <span className='text-[0.6rem]' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-muted)' }}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AIAutomationPage() {
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
            style={{ background: 'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 40%, var(--xlu-surface-0) 100%)' }}
          />
          <CornerBrackets />

          <div className='relative grid items-center gap-[var(--xlu-space-xl)] lg:grid-cols-[1.1fr_0.9fr]'>
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
                AI Automation Systems &{' '}
                <span className='xlu-brand-text'>Custom Operational Intelligence</span>{' '}
                Workflows
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
                We engineer custom AI agents and Python workflows to automate lead qualification,
                CRM entry, and customer support. Your team focuses on high-value work while AI
                handles the repetitive tasks.
              </p>
            </motion.div>

            {/* Right — live AI orchestrator card */}
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0.2 } : { ...springDefault, delay: 0.08 }}
            >
              <AIWorkflowCard reduced={reduced} />
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════ PAIN POINTS — STAT STRIP */}
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
            Custom AI Agent Workflows Built for{' '}
            <span style={{ color: 'hsl(4, 62%, 58%)' }}>Enterprise Scale</span>
          </h2>

          {/* Node rail */}
          <div aria-hidden className='relative mb-[var(--xlu-space-md)] hidden h-3 md:block'>
            <div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2' style={{ background: 'linear-gradient(90deg, transparent, var(--xlu-hairline) 10%, var(--xlu-hairline) 90%, transparent)' }} />
            <div className='relative grid h-full grid-cols-3'>
              {PAIN_POINTS.map((p, i) => (
                <span key={p.stat} className='flex items-center justify-center'>
                  <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'hsl(4, 62%, 58%)', opacity: i === 1 ? 1 : 0.55 }} />
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-[var(--xlu-space-md)] md:grid-cols-3 md:gap-0'>
            {PAIN_POINTS.map((p, i) => (
              <div
                key={p.stat}
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${i > 0 ? 'md:border-l' : ''}`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <div
                  className='font-bold'
                  style={{ fontSize: 'var(--xlu-size-stat)', lineHeight: 0.95, letterSpacing: '-0.03em', color: 'hsl(4, 62%, 58%)', fontVariantNumeric: 'tabular-nums' }}
                >
                  {p.stat}
                </div>
                <p className='mt-3 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════ TECH STACK */}
        <FigureSection
          title={<>Powered By <span className='xlu-brand-text'>Modern AI Tools</span></>}
        >
          <div className='flex flex-wrap gap-3'>
            {TECH_STACK.map((tool, i) => (
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
                }}
              >
                <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)', opacity: 0.8 }} />
                <span className='text-sm font-medium' style={{ color: 'var(--xlu-ink-muted)', fontFamily: 'var(--xlu-font-mono)', fontSize: '0.8rem' }}>
                  {tool.name}
                </span>
              </motion.div>
            ))}
          </div>
        </FigureSection>

        {/* ════════════════════════════════════════════ WHAT WE AUTOMATE */}
        <FigureSection
          title={<>What We <span className='xlu-brand-text'>Automate</span></>}
        >
          {/* 2×2 compact card grid — visually distinct from the DL rows in Our Process */}
          <div className='grid gap-3 sm:grid-cols-2'>
            {USE_CASES.map((item, i) => (
              <motion.div
                key={item.step}
                initial={rowInit}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={revealViewport}
                transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.07 }) as Transition}
                className='rounded-xl border p-5'
                style={{
                  borderColor: 'var(--xlu-hairline)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {/* Tag + step row */}
                <div className='mb-3 flex items-center gap-2'>
                  <span
                    className='rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase'
                    style={{
                      fontFamily: 'var(--xlu-font-mono)',
                      letterSpacing: '0.12em',
                      background: 'color-mix(in srgb, var(--xlu-brand-1) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--xlu-brand-1) 22%, transparent)',
                      color: 'var(--xlu-brand-1)',
                    }}
                  >
                    {item.tag}
                  </span>
                  <span
                    className='text-[0.6rem]'
                    style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-faint)', letterSpacing: '0.1em' }}
                  >
                    {item.step}
                  </span>
                </div>
                <span
                  className='block font-semibold'
                  style={{ fontSize: 'var(--xlu-size-h3)', lineHeight: 'var(--xlu-leading-h3)', letterSpacing: 'var(--xlu-track-h3)' }}
                >
                  {item.title}
                </span>
                <span
                  className='mt-2 block text-sm leading-relaxed'
                  style={{ color: 'var(--xlu-ink-muted)' }}
                >
                  {item.description}
                </span>
              </motion.div>
            ))}
          </div>
        </FigureSection>


        {/* ════════════════════════════════════════════ OUR PROCESS */}
        <FigureSection
          title={<>Our <span className='xlu-brand-text'>Process</span></>}
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
                  <span aria-hidden className='absolute top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full lg:block' style={{ left: '-2rem', marginLeft: '-0.1875rem', background: 'var(--xlu-brand-1)', opacity: 0.5 }} />
                  <dt className='w-14 shrink-0 pt-0.5 text-[0.65rem] uppercase' style={{ fontFamily: 'var(--xlu-font-mono)', letterSpacing: '0.14em', color: 'var(--xlu-brand-1)' }}>
                    {item.tag}
                  </dt>
                  <dd>
                    <span className='text-[0.65rem] uppercase' style={{ fontFamily: 'var(--xlu-font-mono)', color: 'var(--xlu-ink-faint)', letterSpacing: '0.14em' }}>{item.step}</span>
                    <span className='mt-0.5 block font-semibold' style={{ fontSize: 'var(--xlu-size-h3)', lineHeight: 'var(--xlu-leading-h3)', letterSpacing: 'var(--xlu-track-h3)' }}>{item.title}</span>
                    <span className='mt-1 block text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>{item.description}</span>
                  </dd>
                </motion.div>
              ))}
            </dl>
          </div>
        </FigureSection>

        {/* ══════════════════════════════════════════ EXPECTED IMPACT */}
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
            style={{ fontSize: 'var(--xlu-size-h2)', lineHeight: 'var(--xlu-leading-h2)', letterSpacing: 'var(--xlu-track-h2)', textWrap: 'balance' }}
          >
            Expected <span className='xlu-brand-text'>Impact</span>
          </h2>

          <div aria-hidden className='relative mb-[var(--xlu-space-md)] hidden h-3 md:block'>
            <div className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2' style={{ background: 'linear-gradient(90deg, transparent, var(--xlu-hairline) 10%, var(--xlu-hairline) 90%, transparent)' }} />
            <div className='relative grid h-full grid-cols-4'>
              {IMPACT.map((r, i) => (
                <span key={r.value} className='flex items-center justify-center'>
                  <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)', opacity: i === 1 ? 0.9 : 0.5 }} />
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-[var(--xlu-space-md)] md:grid-cols-4 md:gap-0'>
            {IMPACT.map((r, i) => (
              <motion.div
                key={r.value}
                initial={rowInit}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={revealViewport}
                transition={(reduced ? { duration: 0.2 } : { ...snappyT, delay: i * 0.06 }) as Transition}
                className={`px-4 text-center md:px-[var(--xlu-space-lg)] ${i > 0 ? 'md:border-l' : ''}`}
                style={{ borderColor: 'var(--xlu-hairline)' }}
              >
                <div className='xlu-brand-text font-bold' style={{ fontSize: 'var(--xlu-size-stat)', lineHeight: 0.95, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
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
              style={{ fontSize: 'var(--xlu-size-h2)', lineHeight: 'var(--xlu-leading-h2)', letterSpacing: 'var(--xlu-track-h2)', textWrap: 'balance' }}
            >
              Ready to <span className='xlu-brand-text'>Automate</span> Your Operations?
            </h2>
            <p
              className='mx-auto mt-4 max-w-[52ch]'
              style={{ fontSize: 'var(--xlu-size-subhead)', lineHeight: 'var(--xlu-leading-body)', color: 'var(--xlu-ink-muted)', textWrap: 'pretty' }}
            >
              Let&apos;s audit your workflows and engineer AI-powered automation.
            </p>
            <Link
              href='/#contact'
              className='xlu-pressable mt-[var(--xlu-space-lg)] inline-flex min-h-[44px] items-center gap-2 rounded-full px-10 py-4 text-lg font-bold text-white'
              style={{ background: 'var(--xlu-brand-gradient)' }}
            >
              Start Automating
            </Link>
          </div>
        </motion.section>

      </div>
    </main>
  );
}
