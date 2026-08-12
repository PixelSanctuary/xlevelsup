'use client';

/**
 * Connected node network — drifting points joined by fading blue links.
 *
 * Reads as infrastructure and connectivity, which is what the brand sells:
 * "cohesive digital ecosystems where your software, automation, and customer
 * acquisition strategies work flawlessly together."
 *
 * PERFORMANCE — a canvas + rAF loop is the one place real main-thread cost
 * appears, so it is budgeted carefully:
 *  - node count scales with viewport area and hard-caps at 70
 *  - the O(n²) link pass uses a squared-distance test (no sqrt in the reject
 *    path) and breaks early via a spatial sort on x
 *  - DPR capped at 2 — 3x costs 2.25x the pixels for no visible gain
 *  - IntersectionObserver stops the loop entirely when the hero leaves view
 *  - Page Visibility API stops it on tab blur
 *  - renders one static frame and never loops under prefers-reduced-motion
 *
 * apple-design §11: rAF is the display-synced clock; per-frame movement stays
 * far below the perception threshold so it reads as drift, not travel.
 * §2: nodes lean toward the pointer — the field responds to you.
 */

import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number; // 0 = cyan, 1 = violet, 2 = magenta
}

// Brand RGB components — matches --xlu-brand-1 / brand-3 / brand-4
const NODE_COLORS: [number, number, number][] = [
  [18, 229, 254],   // cyan    (primary — dominant)
  [139, 115, 248],  // violet  (secondary)
  [198, 64, 255],   // magenta (accent — rare)
];

// Weighted distribution mirrors brand hierarchy
const pickHue = () => {
  const r = Math.random();
  if (r < 0.55) return 0; // cyan
  if (r < 0.85) return 1; // violet
  return 2;               // magenta
};



const DENSITY = 1 / 11000;
const MAX_NODES = 110;
const LINK_DIST = 145;
const POINTER_RADIUS = 190;

export default function ConstellationField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // On mobile: static one-frame render — no rAF loop. Frees the main thread
    // entirely during page hydration which is the #1 source of mobile TBT.
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const staticMode = reduced || isMobile;

    let nodes: Node[] = [];
    let raf = 0;
    let onscreen = true;
    let visible = true;
    let w = 0;
    let h = 0;
    let pointerX = -9999;
    let pointerY = -9999;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const MAX = isMobile ? 28 : MAX_NODES;
      const count = Math.min(MAX, Math.floor(w * h * DENSITY));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.19,
        vy: (Math.random() - 0.5) * 0.19,
        r: Math.random() * 1.8 + 1.8, // 1.8px to 3.6px radius
        hue: pickHue(),
      }));
      // Sorting by x lets the link pass break out early (see draw()).
      nodes.sort((a, b) => a.x - b.x);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // --- links -----------------------------------------------------------
      // Same-colour pairs: flat stroke (cheap).
      // Different-colour pairs: linearGradient so the strand flows between
      // two differently-charged nodes — the web-strand identity in motion.
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const [ar, ag, ab] = NODE_COLORS[a.hue];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = b.x - a.x;
          if (dx > LINK_DIST) break;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > LINK_DIST * LINK_DIST) continue;

          const t = 1 - Math.sqrt(d2) / LINK_DIST;
          const alpha = (t * 0.52).toFixed(3);

          if (a.hue === b.hue) {
            ctx.strokeStyle = `rgba(${ar},${ag},${ab},${alpha})`;
          } else {
            const [br, bg, bb] = NODE_COLORS[b.hue];
            const mr = Math.round((ar + br) * 0.5);
            const mg = Math.round((ag + bg) * 0.5);
            const mb = Math.round((ab + bb) * 0.5);
            ctx.strokeStyle = `rgba(${mr},${mg},${mb},${alpha})`;
          }
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // --- links to the pointer --------------------------------------------
      if (pointerX > -9000) {
        for (const n of nodes) {
          const dx = n.x - pointerX;
          const dy = n.y - pointerY;
          const d2 = dx * dx + dy * dy;
          if (d2 > POINTER_RADIUS * POINTER_RADIUS) continue;
          const t = 1 - Math.sqrt(d2) / POINTER_RADIUS;
          // Glow range: 0.3 minimum opacity at 190px limit, up to 1.0 at cursor
          const alpha = (0.30 + t * 0.70).toFixed(3);
          ctx.strokeStyle = `rgba(18,229,254,${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(pointerX, pointerY);
          ctx.stroke();
        }
      }

      for (let hue = 0; hue < 3; hue++) {
        const [r, g, b] = NODE_COLORS[hue];
        ctx.shadowColor = `rgba(${r},${g},${b},1)`;
        ctx.shadowBlur = 15;
        for (const n of nodes) {
          if (n.hue !== hue) continue;
          ctx.fillStyle = `rgba(${r},${g},${b},1.0)`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    };

    const step = () => {
      if (!onscreen || !visible) return;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;

        // Gentle lean toward the pointer — the field acknowledges you without
        // chasing. Falls off with distance so the effect eases in.
        if (pointerX > -9000) {
          const dx = pointerX - n.x;
          const dy = pointerY - n.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const pull = (1 - d / POINTER_RADIUS) * 0.055;
            n.x += (dx / d) * pull;
            n.y += (dy / d) * pull;
          }
        }

        // Wrap rather than bounce — no rhythmic oscillation to notice
        if (n.x < -12) n.x = w + 12;
        if (n.x > w + 12) n.x = -12;
        if (n.y < -12) n.y = h + 12;
        if (n.y > h + 12) n.y = -12;
      }

      // Cheap re-sort: the array is nearly sorted every frame, so insertion
      // sort runs in ~O(n) here and keeps the early-break in draw() valid.
      for (let i = 1; i < nodes.length; i++) {
        const cur = nodes[i];
        let j = i - 1;
        while (j >= 0 && nodes[j].x > cur.x) {
          nodes[j + 1] = nodes[j];
          j--;
        }
        nodes[j + 1] = cur;
      }

      draw();
      raf = requestAnimationFrame(step);
    };


    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointerX = -9999;
      pointerY = -9999;
    };

    build();

    let idleTimer: ReturnType<typeof setTimeout> | 0 = 0;

    if (staticMode) {
      draw();
    } else {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerleave', onLeave, { passive: true });
      
      const startLoop = () => {
        if (onscreen && visible) {
          raf = requestAnimationFrame(step);
        }
      };

      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(startLoop, { timeout: 200 });
      } else {
        idleTimer = setTimeout(startLoop, 100);
      }
    }

    const ro = new ResizeObserver(() => {
      build();
      if (staticMode) draw();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (staticMode) return;
        onscreen = entry.isIntersecting;
        cancelAnimationFrame(raf);
        if (onscreen && visible) raf = requestAnimationFrame(step);
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (staticMode) return;
      visible = !document.hidden;
      cancelAnimationFrame(raf);
      if (onscreen && visible) raf = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      onscreen = false;
      if (idleTimer) clearTimeout(idleTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden='true' className={className} />;
}
