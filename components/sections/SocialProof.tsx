/**
 * Trusted by Industry Leaders — single marquee track.
 *
 * SERVER COMPONENT. This section used to be `'use client'` in its entirety,
 * which shipped all 215 lines — every client name, the rail, the sweep, the
 * chips — as JavaScript to be hydrated, on top of the HTML it already sent.
 * Almost none of it needed that: the marquee, the sweep and the node dots are
 * pure CSS keyframes. Only the whileInView reveals, the per-chip hover and the
 * reduced-motion check need the client, and those now live in small leaves in
 * ./SocialProofClient.tsx. The animations themselves are unchanged.
 *
 * The earlier two-row version paused BOTH rows on :hover, so touching one row
 * froze the other — read as broken. The fix here is structural, not cosmetic:
 * the track itself is never paused by hover. It keeps scrolling continuously,
 * and each item gets its own instant, local hover response (lift + brighten)
 * layered on top — apple-design §1: feedback must be immediate and per-element,
 * never a shared animation-state flip that one interaction can freeze for
 * everyone.
 *
 * New style: a bordered "signal strip" — a thin brand-gradient rail runs
 * behind the row, each name sits in a glass chip with a live status dot, and
 * the whole strip has a scan-line sweep behind it. Reads as a live feed of
 * partners rather than plain scrolling text or a static pill grid.
 *
 * §14: under reduced-motion, collapses to a static wrapped row — no scrolling
 * track exists in the DOM at all in that mode.
 */

import { RevealHeading, StripSwitch, HoverChip } from './SocialProofClient';

const clients = [
  { name: 'Pratyagra Silks' },
  { name: 'Wanderingkite' },
  { name: 'Nihaa Jewels' },
  { name: 'Alusea' },
  { name: 'Kandangi Sarees' },
  { name: 'TagMyTaxi' },
  { name: 'Astrosara' },
  { name: 'Studio OS' },
];

export default function SocialProof() {
  // Tripled, not doubled. With only two copies the track can be narrower than
  // a wide viewport, so when the -50% reset lands there is nothing left to the
  // right of "Studio OS" and the strip shows a gap before looping. Three copies
  // resetting at -33.333% keep the visible area covered at every screen width.
  const track = [...clients, ...clients, ...clients];

  // Static wrapped row shown under prefers-reduced-motion (§14).
  const staticRow = (
    <div className='xlu-container flex flex-wrap items-center justify-center gap-3'>
      {clients.map((c) => (
        <span
          key={c.name}
          className='flex items-center gap-2.5 rounded-full border px-5 py-2.5'
          style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
        >
          <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
          <span className='text-lg font-bold' style={{ color: 'var(--xlu-ink-subtle)' }}>
            {c.name}
          </span>
        </span>
      ))}
    </div>
  );

  const animatedStrip = (
    <>
      {/* Signal rail — thin brand-gradient line the chips sit on */}
      <div
        aria-hidden
        className='absolute left-0 right-0 top-1/2 h-px -translate-y-1/2'
        style={{ background: 'linear-gradient(90deg, transparent, var(--xlu-hairline) 12%, var(--xlu-hairline) 88%, transparent)' }}
      />
      {/* Data packet travelling the rail — a soft glow trail with a bright
          leading core, rather than a flat 1px line (§12: light on a surface,
          not a drawn stroke). */}
      <div
        aria-hidden
        className='xlu-signal-sweep pointer-events-none absolute left-0 top-1/2 w-[60%] -translate-y-1/2'
      >
        {/* Wide soft halo */}
        <div
          className='absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 blur-[10px]'
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--xlu-brand-1) 50%, transparent) 20%, color-mix(in srgb, var(--xlu-brand-3) 60%, transparent) 70%, color-mix(in srgb, var(--xlu-brand-4) 40%, transparent) 90%, transparent 100%)',
          }}
        />
        {/* The rail itself, lit — full sweep length */}
        <div
          className='absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full'
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--xlu-brand-1) 25%, var(--xlu-brand-3) 65%, var(--xlu-brand-4) 88%, #ffffff 96%, transparent 100%)',
          }}
        />
        {/* Bright leading core */}
        <div
          className='xlu-signal-core absolute right-[2%] top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full'
          style={{
            background: '#ffffff',
            boxShadow: '0 0 12px 3px var(--xlu-brand-4), 0 0 26px 8px color-mix(in srgb, var(--xlu-brand-3) 60%, transparent)',
          }}
        />
      </div>

      <div
        className='relative overflow-hidden'
        style={{
          maskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <div className='xlu-signal-track flex w-max gap-4'>
          {track.map((c, i) => (
            <HoverChip
              key={`${c.name}-${i}`}
              hidden={i >= clients.length}
              className='group relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-5 py-2.5'
              style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-1)' }}
            >
              <span
                className='xlu-chip-dot h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-[var(--xlu-dur-base)] group-hover:bg-[var(--xlu-brand-1)]'
                style={{
                  background: 'var(--xlu-ink-faint)',
                  // Staggered per chip so the dots beat independently, like
                  // separate signals on one network — never in unison.
                  animationDelay: `${(i % clients.length) * 0.42}s`,
                }}
              />
              <span
                className='text-lg font-bold transition-colors duration-[var(--xlu-dur-base)] group-hover:text-[var(--xlu-ink)]'
                style={{ color: 'var(--xlu-ink-subtle)' }}
              >
                {c.name}
              </span>
            </HoverChip>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <section className='xlu relative overflow-hidden' style={{ paddingBlock: 'var(--xlu-section-y)' }}>
      <style>{`
        /* Resets at one third because the track holds three copies of the list.
           Resetting at -50% with three copies would jump mid-sequence and
           visibly stutter. */
        @keyframes xlu-signal-scroll {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-33.3333%,0,0); }
        }
        /* The track NEVER pauses on hover — that was the bug. Individual
           items respond to hover on their own transform, independently of
           the track's animation. */
        .xlu-signal-track {
          animation: xlu-signal-scroll 36s linear infinite;
          will-change: transform;
        }
        /* A data packet travelling the rail — not a bare line. Runs at a steady
           linear pace (a signal does not ease), fading in/out only at the very
           edges so it appears to enter and leave the strip rather than blinking
           on in place. */
        @keyframes xlu-signal-sweep {
          0%   { transform: translateX(-40%); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateX(240%); opacity: 0; }
        }
        .xlu-signal-sweep { animation: xlu-signal-sweep 4.2s linear infinite; }
        /* Bright core that pulses as the packet travels, so the head of the
           sweep reads as the live element. */
        @keyframes xlu-signal-core {
          0%, 100% { opacity: 0.75; }
          50%      { opacity: 1; }
        }
        .xlu-signal-core { animation: xlu-signal-core 1.1s ease-in-out infinite; }
        /* Each chip's connection dot beats like a live node on the network.
           Staggered per chip via animation-delay so the strip reads as many
           independent signals, not one synchronised blink. Opacity+transform
           only — compositor-cheap. */
        @keyframes xlu-node-beat {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.4); }
        }
        .xlu-chip-dot { animation: xlu-node-beat 3.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .xlu-signal-track, .xlu-signal-sweep, .xlu-signal-core, .xlu-chip-dot {
            animation: none !important;
          }
          .xlu-signal-sweep { opacity: 0; }
        }
      `}</style>

      <div className='xlu-container'>
        <RevealHeading
          className='mb-10 text-center text-sm uppercase tracking-wider'
          style={{ color: 'var(--xlu-ink-subtle)' }}
        >
          Trusted by Industry Leaders
        </RevealHeading>
      </div>

      <StripSwitch animated={animatedStrip} fallback={staticRow} />
    </section>
  );
}
