'use client';

/**
 * Hero backdrop — connected node network over a soft brand-coloured wash.
 *
 * The chain/constellation (ConstellationField) is the focus: drifting nodes
 * joined by blue links that brighten as nodes converge, plus cyan links out to
 * the pointer. Behind it sit two static gradient fields for colour depth.
 *
 * Nothing in this file animates; all motion is inside the canvas, which pauses
 * itself when offscreen or on tab blur.
 */

import dynamic from 'next/dynamic';

// Client-only: canvas has no meaning during SSR, and keeping it out of the
// server bundle means it never delays first paint of the headline.
const ConstellationField = dynamic(() => import('./ConstellationField'), { ssr: false });

export default function HeroAura() {
  return (
    <div aria-hidden className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
      {/* Static colour wash — depth behind the network */}
      <div
        className='absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]'
        style={{
          background:
            'radial-gradient(circle, rgba(18,229,254,0.11) 0%, rgba(108,146,255,0.07) 45%, transparent 70%)',
        }}
      />
      <div
        className='absolute right-[10%] top-[18%] h-[30rem] w-[30rem] rounded-full blur-[140px]'
        style={{ background: 'radial-gradient(circle, rgba(198,64,255,0.09) 0%, transparent 68%)' }}
      />

      {/* The network itself */}
      <ConstellationField className='absolute inset-0 h-full w-full' />

      {/* Vignette — protects headline legibility without erasing the network at
          the sides. Wider and gentler than before: the network now reaches the
          left/right edges instead of fading to flat background there. */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'radial-gradient(ellipse 96% 78% at 50% 42%, transparent 46%, var(--xlu-surface-0) 100%)',
        }}
      />
    </div>
  );
}
