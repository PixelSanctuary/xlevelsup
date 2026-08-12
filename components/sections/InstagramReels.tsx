'use client';

import { useEffect, useRef, useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2, VolumeX } from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
      <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 100-8 4 4 0 000 8zm4.965-10.322a1.44 1.44 0 110.002-2.88 1.44 1.44 0 01-.002 2.88z' />
    </svg>
  );
}

interface Reel {
  id: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
  /** False when Instagram withheld media_url — renders as a poster instead. */
  playable: boolean;
}

const INSTAGRAM_PROFILE = 'https://www.instagram.com/xlevelsup';

// Satellite orbit slots around the center player (% of the stage, card center)
const ORBIT_SLOTS = [
  { left: 14, top: 22, rotate: -8, width: 150, bobDuration: 4.2 },
  { left: 22, top: 74, rotate: 6, width: 120, bobDuration: 5.1 },
  { left: 86, top: 24, rotate: 9, width: 140, bobDuration: 4.6 },
  { left: 79, top: 76, rotate: -6, width: 125, bobDuration: 5.6 },
];

// Evenly balanced corner slots for narrow screens
const MOBILE_ORBIT_SLOTS = [
  { left: 15, top: 15, rotate: -8, width: 150, bobDuration: 4.2 },
  { left: 15, top: 85, rotate: 6, width: 140, bobDuration: 5.1 },
  { left: 85, top: 15, rotate: 9, width: 150, bobDuration: 4.6 },
  { left: 85, top: 85, rotate: -6, width: 140, bobDuration: 5.6 },
];

function timeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days >= 7) return `${Math.floor(days / 7)}w ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diffMs / 3_600_000);
  return hours >= 1 ? `${hours}h ago` : 'just now';
}

export default function InstagramReels() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [stageWidth, setStageWidth] = useState(1000);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/instagram/reels')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { reels: Reel[] }) => {
        if (!cancelled && Array.isArray(data.reels) && data.reels.length > 0) {
          setReels(data.reels);
          setActiveId(data.reels[0].id); // latest reel takes the stage
        }
      })
      .catch(() => {
        /* Section stays hidden when the feed is unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setStageWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [reels.length]);

  useEffect(() => {
    // Autoplay can be blocked until user interaction; retry silently
    videoRef.current?.play().catch(() => {});
  }, [activeId]);

  if (reels.length === 0 || !activeId) return null;

  const activeReel = reels.find((r) => r.id === activeId) ?? reels[0];
  const satellites = reels.filter((r) => r.id !== activeReel.id);
  // Derive "latest" from the actual timestamps, not from array position. The
  // API promotes a playable reel into slot 0 so the centre stage can play
  // video, so reels[0] is no longer guaranteed to be the newest post — using
  // it here would put a "Latest drop" badge on an older reel.
  const latestId = reels.reduce((newest, r) =>
    new Date(r.timestamp) > new Date(newest.timestamp) ? r : newest,
  ).id;
  // Shrink the orbiting cards in step with the stage so the layout holds on small screens
  const orbitScale = Math.max(0.5, Math.min(1, stageWidth / 980));
  const orbitSlots = stageWidth < 640 ? MOBILE_ORBIT_SLOTS : ORBIT_SLOTS;

  const centerPlayer = (
    <div className='relative w-[min(44vw,200px)] sm:w-[min(50vw,250px)] md:w-[290px] aspect-[9/16]'>
      {/* Rotating neon ring */}
      <div className='absolute -inset-[3px] rounded-[26px] overflow-hidden'>
        <div
          className='absolute -inset-1/2 animate-spin'
          style={{
            animationDuration: '7s',
            background:
              'conic-gradient(from 0deg, #00F0FF, #B026FF, #FF2DAF, #00F0FF)',
          }}
        />
      </div>
      <div className='absolute inset-0 rounded-3xl overflow-hidden bg-dark-800'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeReel.id}
            className='absolute inset-0'
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {activeReel.playable ? (
              <video
                ref={videoRef}
                src={`/api/instagram/reels/video/${activeReel.id}`}
                poster={activeReel.thumbnailUrl || undefined}
                className='w-full h-full object-cover'
                autoPlay
                muted={muted}
                loop
                playsInline
                preload='metadata'
              >
                <track kind='captions' src='' label='English' />
              </video>
            ) : (
              // Instagram withheld media_url for this reel, so there is no file
              // to play. Show the poster and send the visitor to Instagram —
              // better than dropping the reel from the feed entirely.
              <a
                href={activeReel.permalink}
                target='_blank'
                rel='noopener noreferrer'
                className='group block w-full h-full'
                aria-label='Watch this reel on Instagram'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeReel.thumbnailUrl}
                  alt={activeReel.caption ? activeReel.caption.slice(0, 80) : 'Instagram reel'}
                  className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                />
                <span className='absolute inset-0 flex items-center justify-center bg-black/25 transition-colors duration-300 group-hover:bg-black/15'>
                  <span className='flex items-center justify-center w-16 h-16 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 transition-transform duration-300 group-hover:scale-110'>
                    <Play className='w-6 h-6 text-white fill-white translate-x-0.5' />
                  </span>
                </span>
              </a>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Top chips */}
        <div className='absolute top-3 inset-x-3 flex items-center justify-between'>
          <span className='text-[10px] font-mono tracking-widest uppercase text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10'>
            {activeReel.id === latestId ? (
              <span className='inline-flex items-center gap-1.5'>
                <span className='relative flex w-1.5 h-1.5'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75' style={{ background: '#00F0FF' }} />
                  <span className='relative inline-flex rounded-full w-1.5 h-1.5' style={{ background: '#00F0FF' }} />
                </span>
                Latest drop
              </span>
            ) : (
              timeAgo(activeReel.timestamp)
            )}
          </span>
          {/* Only meaningful when a video is actually playing — a mute toggle
              over a static poster is a control that does nothing. */}
          {activeReel.playable && (
            <button
              type='button'
              aria-label={muted ? 'Unmute reel' : 'Mute reel'}
              className='p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border border-white/10 transition-colors'
              onClick={() => setMuted((prev) => !prev)}
            >
              {muted ? <VolumeX className='w-4 h-4' /> : <Volume2 className='w-4 h-4' />}
            </button>
          )}
        </div>

        {/* Bottom overlay */}
        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 pt-14'>
          {activeReel.caption && (
            <p className='text-white/90 text-xs leading-snug line-clamp-2 mb-3'>
              {activeReel.caption}
            </p>
          )}
          <a
            href={activeReel.permalink}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors'
          >
            <InstagramIcon className='w-3.5 h-3.5' />
            View on Instagram
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <section className='relative py-24 px-4 overflow-hidden bg-dark-900' id='reels'>
      {/* Cyber grid backdrop */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.045) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)',
        }}
      />
      <div
        className='pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-3xl'
        style={{ background: 'rgba(176, 38, 255, 0.08)' }}
      />

      <div className='max-w-6xl mx-auto relative'>
        <motion.div
          className='text-center mb-6 md:mb-0'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className='inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-5 text-xs font-mono tracking-widest uppercase text-gray-300'>
            <span className='relative flex w-2 h-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full opacity-60' style={{ background: '#00F0FF' }} />
              <span className='relative inline-flex rounded-full w-2 h-2' style={{ background: '#00F0FF' }} />
            </span>
            @xlevelsup on Instagram
          </div>
          <h2 className='text-4xl md:text-5xl font-bold mb-4'>
            Growth <span className='gradient-text'>In Motion</span>
          </h2>
          <p className='text-gray-400 text-lg'>
            Real work, real wins — the latest from our Instagram.
          </p>
        </motion.div>

        {/* Orbital constellation — scales down with the viewport */}
        <div
          ref={stageRef}
          className='relative mt-6 md:mt-0 h-[520px] sm:h-[560px] md:h-[620px]'
        >
            {/* Glowing connection lines */}
            <svg
              className='absolute inset-0 w-full h-full pointer-events-none'
              viewBox='0 0 100 100'
              preserveAspectRatio='none'
              aria-hidden='true'
            >
              <defs>
                <linearGradient id='reel-link' x1='0%' y1='0%' x2='100%' y2='100%'>
                  <stop offset='0%' stopColor='#00F0FF' />
                  <stop offset='100%' stopColor='#B026FF' />
                </linearGradient>
              </defs>
              {orbitSlots.slice(0, satellites.length).map((slot) => (
                <line
                  key={`${slot.left}-${slot.top}`}
                  x1='50'
                  y1='50'
                  x2={slot.left}
                  y2={slot.top}
                  stroke='url(#reel-link)'
                  strokeWidth='1.5'
                  strokeDasharray='3 7'
                  opacity='0.45'
                  vectorEffect='non-scaling-stroke'
                />
              ))}
            </svg>

            {/* Center stage */}
            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20'>
              {centerPlayer}
            </div>

            {/* Orbiting satellites */}
            {satellites.map((reel, i) => {
              const slot = orbitSlots[i % orbitSlots.length];
              return (
                <motion.button
                  key={reel.id}
                  type='button'
                  aria-label='Play this reel'
                  onClick={() => setActiveId(reel.id)}
                  className='absolute z-10 cursor-pointer group'
                  style={{ x: '-50%', y: '-50%' }}
                  initial={false}
                  animate={{
                    left: `${slot.left}%`,
                    top: `${slot.top}%`,
                    rotate: slot.rotate,
                    width: Math.round(slot.width * orbitScale),
                  }}
                  transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  whileHover={{ scale: 1.08, rotate: 0 }}
                >
                  <motion.div
                    className='relative w-full aspect-[9/16] rounded-2xl overflow-hidden border border-white/15 shadow-2xl group-hover:border-cyan transition-colors'
                    animate={{ y: [0, -9, 0] }}
                    transition={{
                      duration: slot.bobDuration,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {reel.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reel.thumbnailUrl}
                        alt={reel.caption ? reel.caption.slice(0, 80) : 'Instagram reel'}
                        className='w-full h-full object-cover brightness-[.6] group-hover:brightness-90 transition-all duration-300'
                        loading='lazy'
                      />
                    ) : (
                      <span className='absolute inset-0 bg-dark-700' />
                    )}
                    <span className='absolute inset-0 flex items-center justify-center'>
                      <span className='p-2.5 rounded-full bg-black/45 backdrop-blur-sm border border-white/20'>
                        <Play className='w-4 h-4 text-white fill-white' />
                      </span>
                    </span>
                    <span className='absolute bottom-2 left-2 text-[10px] font-mono text-white/85 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full'>
                      {timeAgo(reel.timestamp)}
                    </span>
                  </motion.div>
                </motion.button>
              );
            })}
        </div>

        <div className='text-center mt-10'>
          <a
            href={INSTAGRAM_PROFILE}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white bg-linear-to-r from-cyan to-purple hover:shadow-lg hover:shadow-cyan/30 transition-all duration-300 hover:scale-105'
          >
            <InstagramIcon className='w-5 h-5' />
            Follow @xlevelsup
          </a>
        </div>
      </div>
    </section>
  );
}
