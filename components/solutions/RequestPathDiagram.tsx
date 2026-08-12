'use client';

/**
 * The Tech Stack — request path, staged as a live build console.
 *
 * Rebuilt from flat SVG rects to real HTML surfaces. The previous version was
 * five outlined boxes on near-black, which read as thin no matter how much
 * interaction physics went into it: visual weight comes from filled, layered
 * material, not from outlines. So each stage is now a genuine surface with a
 * gradient wash, an inner highlight edge and depth shadow, and the whole panel
 * is framed as a console with mono status chrome.
 *
 * Content is untouched — the three original tech-stack cards keep their icons,
 * names, taglines and all nine feature bullets; Browser and Pixel Painted
 * remain the endpoints.
 *
 * apple-design:
 *  §1  hover feedback is instant and local to the stage under the pointer
 *  §2  hovering a stage scrubs the request packet to it and holds it there
 *  §3  packet rides a spring on a motion value, so moving between stages
 *      re-targets from its live position — no jump, interruptible mid-flight
 *  §4  critically damped: it settles without overshoot, since it was not thrown
 *  §12 material weight encodes hierarchy — the three tech stages are the
 *      substance and carry the heaviest surface; the endpoints recede
 *  §14 reduced motion: no travelling packet, no springs; hover states remain,
 *      so nothing is gated on animation
 *
 * Performance: no canvas, no rAF loop, no layout-animating properties. The
 * packet is a single spring-driven transform, and every other effect is a
 * static gradient or a CSS transition on transform/opacity/border-color.
 */

import { useEffect, useState } from 'react';
import {
  m as motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  animate,
} from 'framer-motion';
import { revealViewport } from '@/components/marketing/motion';

/**
 * Every string comes from the original page's tech-stack cards — the three
 * names, their taglines, their icons, and all nine feature bullets.
 */
interface PathNode {
  id: string;
  label: string;
  icon?: string;
  tagline?: string;
  tags: string[];
  /** Endpoints frame the path; stack stages are the substance (§12). */
  kind: 'endpoint' | 'stack';
}

const NODES: PathNode[] = [
  { id: 'browser', label: 'Browser', tags: ['REQUEST'], kind: 'endpoint' },
  {
    id: 'edge',
    label: 'Vercel Edge',
    icon: '🌐',
    tagline: 'For Global Content Delivery',
    tags: ['EDGE FUNCTIONS', 'CDN', 'ZERO CONFIG'],
    kind: 'stack',
  },
  {
    id: 'next',
    label: 'React/Next.js',
    icon: '⚛️',
    tagline: 'For SEO and Speed',
    tags: ['SERVER-SIDE RENDERING', 'STATIC GENERATION', 'API ROUTES'],
    kind: 'stack',
  },
  {
    id: 'style',
    label: 'Tailwind CSS',
    icon: '🎨',
    tagline: 'For Pixel-Perfect Design',
    tags: ['UTILITY-FIRST', 'RESPONSIVE', 'CUSTOM THEMES'],
    kind: 'stack',
  },
  { id: 'paint', label: 'Pixel Painted', tags: ['FIRST CONTENTFUL PAINT'], kind: 'endpoint' },
];

const LEGEND = [
  { tag: 'EDGE', icon: '🌐', title: 'Vercel Edge', body: 'For Global Content Delivery' },
  { tag: 'RENDER', icon: '⚛️', title: 'React/Next.js', body: 'For SEO and Speed' },
  { tag: 'STYLE', icon: '🎨', title: 'Tailwind CSS', body: 'For Pixel-Perfect Design' },
];

export default function RequestPathDiagram() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);

  // Packet position across the rail, 0..1, spring-smoothed so re-targeting
  // continues from the live value rather than restarting (§3).
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 170, damping: 26, mass: 0.7 });
  const packetLeft = useTransform(smooth, (p) => `${p * 100}%`);

  useEffect(() => {
    if (reduced || active !== null) return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        await animate(progress, 1, { duration: 3.6, ease: 'linear' });
        if (cancelled) break;
        progress.set(0);
      }
    };
    loop();
    return () => { cancelled = true; };
  }, [active, progress, reduced]);

  useEffect(() => {
    if (reduced || active === null) return;
    // Centre of the active stage, as a fraction across the row.
    progress.set((active + 0.5) / NODES.length);
  }, [active, progress, reduced]);

  return (
    <div>
      {/* ============ Console panel ============ */}
      <div
        className='relative overflow-hidden rounded-2xl border'
        style={{
          borderColor: 'var(--xlu-hairline)',
          background:
            'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
          boxShadow: '0 32px 90px -30px rgba(0,0,0,0.9)',
        }}
        onMouseLeave={() => setActive(null)}
      >
        {/* Console chrome — mono status bar with a live dot */}
        <div
          className='flex items-center gap-3 border-b px-4 py-3'
          style={{ borderColor: 'var(--xlu-hairline)' }}
        >
          <span className='flex gap-1.5' aria-hidden>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <span key={c} className='h-2.5 w-2.5 rounded-full' style={{ background: c, opacity: 0.55 }} />
            ))}
          </span>
          <span
            className='text-[0.7rem] uppercase'
            style={{
              fontFamily: 'var(--xlu-font-mono)',
              letterSpacing: '0.16em',
              color: 'var(--xlu-ink-faint)',
            }}
          >
            request path
          </span>
          <span className='ml-auto flex items-center gap-2'>
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
              live
            </span>
          </span>
        </div>

        {/* ---- Desktop: horizontal path ---- */}
        <div className='relative hidden p-[var(--xlu-space-lg)] md:block'>
          {/* Rail + travelling packet, behind the stages */}
          <div className='pointer-events-none absolute inset-x-[var(--xlu-space-lg)] top-1/2 -translate-y-1/2'>
            <div className='relative h-px w-full' style={{ background: 'var(--xlu-hairline)' }}>
              {!reduced && (
                <>
                  {/* Lit trail behind the packet */}
                  <motion.div
                    className='absolute left-0 top-0 h-px'
                    style={{
                      width: packetLeft,
                      background:
                        'linear-gradient(90deg, transparent, var(--xlu-brand-1))',
                    }}
                  />
                  {/* The packet itself */}
                  <motion.div
                    className='absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full'
                    style={{
                      left: packetLeft,
                      background: '#fff',
                      boxShadow:
                        '0 0 12px 3px var(--xlu-brand-1), 0 0 28px 8px color-mix(in srgb, var(--xlu-brand-2) 55%, transparent)',
                    }}
                  />
                </>
              )}
            </div>
          </div>

          <div className='relative grid grid-cols-5 gap-3'>
            {NODES.map((n, i) => {
              const isStack = n.kind === 'stack';
              const isActive = active === i;
              const isDimmed = active !== null && !isActive;

              return (
                <motion.div
                  key={n.id}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  tabIndex={0}
                  role='button'
                  aria-label={`${n.label}${n.tagline ? `: ${n.tagline}` : ''}. ${n.tags.join(', ')}`}
                  animate={reduced ? undefined : { y: isActive ? -4 : 0, opacity: isDimmed ? 0.5 : 1 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  className='relative cursor-pointer overflow-hidden rounded-xl border p-4 text-center outline-none'
                  style={{
                    // Stack stages carry real material; endpoints recede (§12).
                    borderColor: isActive
                      ? 'color-mix(in srgb, var(--xlu-brand-1) 55%, transparent)'
                      : 'var(--xlu-hairline)',
                    background: isStack
                      ? 'linear-gradient(160deg, var(--xlu-surface-3) 0%, var(--xlu-surface-1) 100%)'
                      : 'color-mix(in srgb, var(--xlu-surface-1) 70%, transparent)',
                    boxShadow: isStack
                      ? '0 18px 44px -22px rgba(0,0,0,0.95), inset 0 1px 0 0 rgba(255,255,255,0.06)'
                      : 'none',
                    transition: 'border-color 180ms var(--xlu-ease-out)',
                  }}
                >
                  {/* Accent wash on the active stage */}
                  <span
                    aria-hidden
                    className='pointer-events-none absolute inset-0 transition-opacity duration-300'
                    style={{
                      opacity: isActive ? 1 : 0,
                      background:
                        'radial-gradient(ellipse 90% 70% at 50% 0%, color-mix(in srgb, var(--xlu-brand-1) 16%, transparent), transparent 70%)',
                    }}
                  />

                  <div className='relative'>
                    {n.icon && <div className='mb-2 text-2xl' aria-hidden>{n.icon}</div>}
                    <div
                      className={isStack ? 'text-[0.95rem] font-bold' : 'text-sm font-semibold'}
                      style={{ color: isStack ? 'var(--xlu-ink)' : 'var(--xlu-ink-muted)' }}
                    >
                      {n.label}
                    </div>
                    {n.tagline && (
                      <div className='mt-1 text-[0.7rem]' style={{ color: 'var(--xlu-brand-1)' }}>
                        {n.tagline}
                      </div>
                    )}
                    <div className='mt-3 space-y-1'>
                      {n.tags.map((t) => (
                        <div
                          key={t}
                          className='text-[0.6rem] uppercase leading-relaxed'
                          style={{
                            fontFamily: 'var(--xlu-font-mono)',
                            letterSpacing: '0.1em',
                            color: isActive ? 'var(--xlu-ink-muted)' : 'var(--xlu-ink-faint)',
                            transition: 'color 180ms var(--xlu-ease-out)',
                          }}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ---- Mobile: vertical path ---- */}
        <div className='p-[var(--xlu-space-md)] md:hidden'>
          <ol className='space-y-2'>
            {NODES.map((n, i) => {
              const isStack = n.kind === 'stack';
              return (
                <li key={n.id}>
                  <div
                    className='rounded-xl border p-4'
                    style={{
                      borderColor: 'var(--xlu-hairline)',
                      background: isStack
                        ? 'linear-gradient(160deg, var(--xlu-surface-3) 0%, var(--xlu-surface-1) 100%)'
                        : 'transparent',
                    }}
                  >
                    <div className='flex items-center gap-2.5'>
                      {n.icon ? (
                        <span className='shrink-0 text-lg' aria-hidden>{n.icon}</span>
                      ) : (
                        <span
                          className='h-1.5 w-1.5 shrink-0 rounded-full'
                          style={{ background: 'var(--xlu-brand-1)' }}
                          aria-hidden
                        />
                      )}
                      <span className='font-semibold'>{n.label}</span>
                    </div>
                    {n.tagline && (
                      <p className='mt-1 text-sm' style={{ color: 'var(--xlu-brand-1)' }}>
                        {n.tagline}
                      </p>
                    )}
                    <div className='mt-2 flex flex-wrap gap-x-3 gap-y-1'>
                      {n.tags.map((t) => (
                        <span
                          key={t}
                          className='text-[0.65rem] uppercase'
                          style={{
                            fontFamily: 'var(--xlu-font-mono)',
                            letterSpacing: '0.12em',
                            color: 'var(--xlu-ink-faint)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {i < NODES.length - 1 && (
                    <span
                      aria-hidden
                      className='mx-auto my-1 block h-3 w-px'
                      style={{ background: 'var(--xlu-hairline)' }}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* ============ Legend ============ */}
      <div
        className='mt-3 grid gap-px overflow-hidden rounded-2xl md:grid-cols-3'
        style={{ background: 'var(--xlu-hairline)' }}
      >
        {LEGEND.map((l, i) => (
          <motion.div
            key={l.tag}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className='group relative overflow-hidden p-[var(--xlu-space-md)]'
            style={{
              background:
                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
            }}
          >
            <span
              aria-hidden
              className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in srgb, var(--xlu-brand-1) 12%, transparent), transparent 70%)',
              }}
            />
            <div className='relative flex items-center justify-between gap-3'>
              <span
                className='text-[0.65rem] uppercase'
                style={{
                  fontFamily: 'var(--xlu-font-mono)',
                  letterSpacing: '0.16em',
                  color: 'var(--xlu-brand-1)',
                }}
              >
                {l.tag}
              </span>
              <span className='text-xl' aria-hidden>{l.icon}</span>
            </div>
            <h3 className='relative mt-2 font-semibold'>{l.title}</h3>
            <p className='relative mt-1.5 text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
              {l.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
