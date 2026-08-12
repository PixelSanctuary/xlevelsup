'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  m as motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
  type MotionValue,
} from 'framer-motion';
import { revealViewport, project, springMomentum, springDefault } from '@/components/marketing/motion';

/**
 * What Our Clients Say — gesture-driven carousel with visible neighbors.
 *
 * The drag physics are unchanged (they are the most apple-design thing on the
 * page); this pass upgrades the presentation around them:
 *
 *  - slides sit at ~86% width so the neighbors PEEK in from both edges at
 *    reduced scale/opacity — §8: the in-between state telegraphs the gesture.
 *    A full-bleed slide hides that dragging is even possible.
 *  - each slide's scale/opacity is a continuous function of the LIVE drag
 *    position (useTransform on the x motion value), not a switch on the active
 *    index — mid-drag, both cards blend smoothly, and interrupting a settle
 *    reads correctly because presentation is derived from presentation (§3).
 *  - the active quote sits on a material card with a corner-node motif, and
 *    the dots became a node rail — same connected-node grammar as the hero
 *    rail and the About funnel.
 *
 * Existing physics kept: 1:1 drag (§2), velocity handoff into the spring (§5),
 * momentum projection picks the landing slide from where the flick is going
 * (§6), rubber-banding at the ends (§9), interruptible throughout (§3).
 * §14: reduced motion = no drag, plain crossfade between slides.
 *
 * Copy and font sizes unchanged.
 */

const testimonials = [
  {
    id: 1,
    name: 'Poorani Anandakumar',
    company: 'Pratyagara Silks',
    quote:
      'XLEVELSUP engineered our entire digital presence from scratch. Their technical approach to eCommerce resulted in a 300% increase in online revenue within 6 months.',
  },
  {
    id: 2,
    name: 'Sandesh Anantha Kumar',
    company: 'Wanderingkite Studio',
    quote:
      'They analyzed our workflows, optimized our tech stack, and built a high-performance platform. Page load times dropped by 70%, conversions increased by 2.5x.',
  },
  {
    id: 3,
    name: 'Anand Kumar',
    company: 'Nihaa Jewels',
    quote:
      'Not just marketing—growth engineering. They automated our customer acquisition, optimized our ad spend, and delivered 8x ROI on every campaign.',
  },
];

const SLIDE_FRAC = 0.86; // slide width as a fraction of the viewport — the rest is peek

interface SlideProps {
  t: (typeof testimonials)[number];
  i: number;
  x: MotionValue<number>;
  slideW: number;
  activeIndex: number;
  reduced: boolean | null;
}

function Slide({ t, i, x, slideW, activeIndex, reduced }: SlideProps) {
  // Distance of this slide from the viewport centre, in px, live during drag.
  const dist = useTransform(x, (v) => Math.abs(v + i * slideW));
  const scale = useTransform(dist, [0, slideW || 1], [1, 0.92]);
  const opacity = useTransform(dist, [0, slideW || 1], [1, 0.35]);

  return (
    <motion.figure
      className='shrink-0'
      style={
        reduced
          ? { width: slideW || '100%', opacity: i === activeIndex ? 1 : 0 }
          : { width: slideW || '100%', scale, opacity }
      }
      aria-hidden={i !== activeIndex}
    >
      <div
        className='relative mx-3 overflow-hidden rounded-3xl border p-[var(--xlu-space-lg)] text-center sm:mx-4'
        style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
      >
        {/* Corner node motif — same grammar as the Contact panel */}
        <svg className='pointer-events-none absolute right-5 top-5 h-14 w-14 opacity-30' aria-hidden='true'>
          <circle cx='4' cy='4' r='2.5' fill='var(--xlu-brand-1)' />
          <circle cx='36' cy='18' r='2' fill='var(--xlu-brand-3)' />
          <line x1='4' y1='4' x2='36' y2='18' stroke='var(--xlu-hairline)' strokeWidth='1' />
        </svg>

        {/* Decorative quote mark — original size (text-5xl) */}
        <div className='mb-6 text-5xl' style={{ color: 'var(--xlu-brand-1)' }} aria-hidden>
          &quot;
        </div>

        <blockquote className='mx-auto max-w-[42rem] text-xl font-normal leading-relaxed'>
          {t.quote}
        </blockquote>

        <figcaption className='mt-[var(--xlu-space-lg)] flex items-center justify-center gap-4'>
          <span className='h-px w-10 shrink-0' style={{ background: 'var(--xlu-brand-gradient)' }} />
          <span className='text-left'>
            <span className='xlu-brand-text block text-lg font-bold'>{t.name}</span>
            <span className='block text-[0.9rem]' style={{ color: 'var(--xlu-ink-subtle)' }}>
              {t.company}
            </span>
          </span>
          <span className='h-px w-10 shrink-0' style={{ background: 'var(--xlu-brand-gradient)' }} />
        </figcaption>
      </div>
    </motion.figure>
  );
}

export default function Testimonials() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [containerW, setContainerW] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const slideW = containerW * SLIDE_FRAC;
  const peek = (containerW - slideW) / 2;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback(
    (next: number, velocity = 0) => {
      const clamped = Math.max(0, Math.min(testimonials.length - 1, next));
      setIndex(clamped);

      if (reduced) {
        x.set(-clamped * slideW);
        return;
      }
      // Velocity handed off into the spring (§5); bounce only when the gesture
      // carried momentum — a dot/arrow tap gets the critically damped spring.
      animate(x, -clamped * slideW, {
        ...(velocity !== 0 ? springMomentum : springDefault),
        velocity,
      });
    },
    [reduced, slideW, x],
  );

  // Keep position correct across resize without animating.
  useEffect(() => {
    x.set(-index * slideW);
  }, [slideW, index, x]);

  const handleDragEnd = (
    _e: unknown,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const v = info.velocity.x;
    const current = x.get();

    // Land where the flick is GOING, not where the finger stopped (§6).
    const projected = current + project(v);
    let next = Math.round(-projected / (slideW || 1));

    // A decisive flick always advances, even a short one.
    if (Math.abs(v) > 380 && next === index) {
      next = v < 0 ? index + 1 : index - 1;
    }
    goTo(next, v);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
  };

  return (
    <section className='xlu xlu-section relative' id='testimonials'>
      <div className='xlu-container'>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={revealViewport}
          transition={springDefault}
          className='mx-auto mb-[var(--xlu-space-xl)] max-w-[46rem] text-center'
        >
          <h2 className='mb-4 text-[1.875rem] sm:text-4xl font-bold leading-tight tracking-[-0.02em] md:text-5xl'>
            What Our <span className='xlu-brand-text'>Clients Say</span>
          </h2>
          <p className='text-lg' style={{ color: 'var(--xlu-ink-subtle)' }}>
            Real results from real partnerships
          </p>
        </motion.div>

        {/* Carousel viewport — neighbors peek in from both edges */}
        <div
          ref={viewportRef}
          className='relative cursor-grab overflow-hidden active:cursor-grabbing'
          role='region'
          aria-roledescription='carousel'
          aria-label='Client testimonials'
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <motion.div
            className='flex'
            style={{ x, touchAction: 'pan-y', paddingLeft: peek, paddingRight: peek }}
            drag={reduced ? false : 'x'}
            dragConstraints={{ left: -(testimonials.length - 1) * slideW, right: 0 }}
            dragElastic={0.16}   /* rubber-band past the ends (§9) */
            dragMomentum={false} /* we do our own projection (§6) */
            onDragEnd={handleDragEnd}
          >
            {testimonials.map((t, i) => (
              <Slide
                key={t.id}
                t={t}
                i={i}
                x={x}
                slideW={slideW}
                activeIndex={index}
                reduced={reduced}
              />
            ))}
          </motion.div>
        </div>

        {/* Controls — prev / node rail / next */}
        <div className='mt-[var(--xlu-space-lg)] flex items-center justify-center gap-[var(--xlu-space-lg)]'>
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label='Previous testimonial'
            className='xlu-pressable flex h-11 w-11 items-center justify-center rounded-full border border-[var(--xlu-hairline)] transition-opacity disabled:opacity-30'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' viewBox='0 0 24 24' aria-hidden='true'>
              <path d='M15 19l-7-7 7-7' />
            </svg>
          </button>

          {/* Node rail: dots joined by a hairline, active node stretched */}
          <div className='relative flex items-center gap-2.5'>
            <span
              className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
              style={{ background: 'var(--xlu-hairline)' }}
              aria-hidden
            />
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                onClick={() => goTo(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                aria-current={i === index}
                className='xlu-pressable relative flex h-11 min-w-[24px] items-center justify-center transition-all duration-[var(--xlu-dur-base)]'
              >
                <span
                  className='h-1.5 rounded-full transition-all duration-[var(--xlu-dur-base)]'
                  style={{
                    width: i === index ? '2rem' : '0.375rem',
                    background: i === index ? 'var(--xlu-brand-gradient)' : 'var(--xlu-ink-faint)',
                  }}
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => goTo(index + 1)}
            disabled={index === testimonials.length - 1}
            aria-label='Next testimonial'
            className='xlu-pressable flex h-11 w-11 items-center justify-center rounded-full border border-[var(--xlu-hairline)] transition-opacity disabled:opacity-30'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' viewBox='0 0 24 24' aria-hidden='true'>
              <path d='M9 5l7 7-7 7' />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
