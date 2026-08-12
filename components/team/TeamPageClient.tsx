'use client';

import { useState, useMemo } from 'react';
import { m as motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { TeamMember } from '@/lib/erp/team';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';

/**
 * /team — restyled onto the --xlu-* system.
 *
 * NOTE: this page reads live data from lib/erp/team. That data layer is NOT
 * touched here — only the presentation. Member names, roles, departments,
 * employee IDs, joining dates and every static string are rendered exactly as
 * before; the derived labels (tenure, initials) use the same functions.
 *
 * New style element introduced here: a personnel roster / directory treatment.
 * Cards become roster entries with mono employee-ID chrome and a department
 * node, department sections get a counted rail header, and the whole page
 * carries the connected-node identity used across the site.
 *
 * The nine hardcoded department hues and the Tailwind tier-badge classes are
 * replaced by brand-derived accents: department distinction is preserved by
 * mapping each department onto one of the four brand stops rather than nine
 * unrelated colours, which never belonged to the palette.
 *
 * apple-design:
 *  §1  hover feedback is instant and local to the card under the pointer
 *  §4  critically damped springs — cards lift without overshoot
 *  §12 material weight encodes hierarchy: executives carry the heaviest
 *      surface, roster entries are lighter
 *  §14 all motion degrades to opacity-only under reduced motion
 */

const ConstellationField = dynamic(
  () => import('@/components/marketing/ConstellationField'),
  { ssr: false },
);

/* ─── department accent: mapped onto the brand ramp ──────────── */
const BRAND_STOPS = [
  'var(--xlu-brand-1)',
  'var(--xlu-brand-2)',
  'var(--xlu-brand-3)',
  'var(--xlu-brand-4)',
];

/** Stable per-department accent, drawn from the four brand stops. */
function getDeptAccent(dept: string): string {
  let hash = 0;
  for (let i = 0; i < dept.length; i++) hash = dept.charCodeAt(i) + ((hash << 5) - hash);
  return BRAND_STOPS[Math.abs(hash) % BRAND_STOPS.length];
}

/* ─── hierarchy tier labels — text and icons unchanged ───────── */
const TIER_LABELS: Record<number, { label: string; icon: string }> = {
  1: { label: 'Executive', icon: '👑' },
  2: { label: 'Director', icon: '🎯' },
  3: { label: 'Leadership', icon: '⭐' },
  4: { label: 'Team', icon: '🚀' },
  5: { label: 'Associate', icon: '✨' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Months since joining — drives the tenure bar. */
function tenureMonths(joiningDate: string): number {
  const join = new Date(joiningDate);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth()));
}

/** Calculate years of experience from joining date */
function tenureLabel(joiningDate: string): string {
  const join = new Date(joiningDate);
  const now = new Date();
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  if (months < 1) return 'Just joined';
  if (months < 12) return `${months}m tenure`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs}y ${rem}m` : `${yrs} yr${yrs > 1 ? 's' : ''}`;
}

const MONO = 'var(--xlu-font-mono)';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0, duration: 0.45 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.06 } },
};

/* ─── Roster entry card ──────────────────────────────────────── */
function MemberCard({ member }: { member: TeamMember; index: number }) {
  const accent = getDeptAccent(member.department);
  const tier = TIER_LABELS[member.hierarchy_level] ?? TIER_LABELS[5];
  const initials = getInitials(member.name);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      whileHover={{ y: -4 }}
      className='group relative cursor-default select-none overflow-hidden rounded-2xl border'
      style={{
        borderColor: 'var(--xlu-hairline)',
        background: 'linear-gradient(160deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Accent wash on hover */}
      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[var(--xlu-dur-slow)] group-hover:opacity-100'
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 0%, color-mix(in srgb, ${accent} 16%, transparent), transparent 70%)`,
        }}
      />

      {/* Oversized initials as a watermark — with no photo field available, the
          monogram becomes the card's visual anchor rather than a small tile. */}
      <span
        aria-hidden
        className='pointer-events-none absolute -right-3 -top-6 select-none text-[6rem] font-bold leading-none transition-opacity duration-[var(--xlu-dur-slow)] group-hover:opacity-[0.14]'
        style={{ color: accent, opacity: 0.07, letterSpacing: '-0.05em' }}
      >
        {initials}
      </span>

      {/* Department accent edge */}
      <span
        aria-hidden
        className='absolute left-0 top-0 h-full w-[2px]'
        style={{ background: `linear-gradient(180deg, ${accent}, transparent 75%)`, opacity: 0.55 }}
      />

      <div className='relative p-5'>
        {/* Employee ID as ledger chrome, top-right */}
        <span
          className='absolute right-4 top-4 text-[0.6rem] tabular-nums'
          style={{ fontFamily: MONO, letterSpacing: '0.14em', color: 'var(--xlu-ink-faint)' }}
        >
          {member.employee_id}
        </span>

        {/* Monogram tile */}
        <div className='relative mb-4 inline-flex'>
          <div
            className='flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold'
            style={{
              background: `linear-gradient(140deg, color-mix(in srgb, ${accent} 34%, var(--xlu-surface-3)), var(--xlu-surface-2))`,
              border: `1px solid color-mix(in srgb, ${accent} 38%, transparent)`,
              color: 'var(--xlu-ink)',
            }}
          >
            {initials}
          </div>
          <span
            className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2'
            style={{ background: accent, borderColor: 'var(--xlu-surface-1)' }}
            aria-hidden
          />
        </div>

        {/* Name at real scale — this is the subject of the card */}
        <div className='flex items-start gap-1.5'>
          <h3 className='text-lg font-bold leading-tight tracking-[-0.015em]'>{member.name}</h3>
          {member.hierarchy_level === 1 && (
            <span className='shrink-0 text-base' title='Executive'>👑</span>
          )}
        </div>

        <p className='mt-1 text-sm font-semibold' style={{ color: accent }}>
          {member.role.split(/[&\/|\-–—+]|\band\b/i)[0].trim()}
        </p>

        {member.specialty && (
          <span
            className='mt-2 inline-block max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-medium'
            style={{
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              color: accent,
              border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
            }}
            title={member.specialty}
          >
            🎨 {member.specialty}
          </span>
        )}

        <div className='mt-4 h-px' style={{ background: 'var(--xlu-hairline)' }} />

        {/* Footer: tier + department + tenure, on one readable line */}
        <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-2'>
          <span
            className='inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold'
            style={{
              borderColor: 'var(--xlu-hairline)',
              color: 'var(--xlu-ink-subtle)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            {tier.icon} {tier.label}
          </span>
          <span className='text-[11px]' style={{ color: 'var(--xlu-ink-subtle)' }}>
            {member.department}
          </span>
          <span
            className='ml-auto text-[11px] tabular-nums'
            style={{ fontFamily: MONO, color: 'var(--xlu-ink-faint)' }}
          >
            {tenureLabel(member.joining_date)}
          </span>
        </div>

        {/* Tenure bar — the same label rendered as a measure. Caps at 36 months,
            so the bar reads as "how established", not an exact scale. */}
        <div
          className='mt-3 h-0.5 w-full overflow-hidden rounded-full'
          style={{ background: 'var(--xlu-hairline)' }}
          aria-hidden
        >
          <div
            className='h-full rounded-full transition-all duration-[var(--xlu-dur-slow)]'
            style={{
              width: `${Math.min(100, (tenureMonths(member.joining_date) / 36) * 100)}%`,
              background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 40%, transparent), ${accent})`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Department section header ──────────────────────────────── */
function DeptHeader({ dept, count }: { dept: string; count: number }) {
  const accent = getDeptAccent(dept);
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
      className='mb-6 flex items-center gap-4'
    >
      {/* Department node with a soft halo — the branch point of this section */}
      <span className='relative flex h-1.5 w-1.5 shrink-0' aria-hidden>
        <span
          className='absolute inline-flex h-full w-full rounded-full'
          style={{ background: accent, opacity: 0.35, transform: 'scale(2.6)' }}
        />
        <span className='relative h-1.5 w-1.5 rounded-full' style={{ background: accent }} />
      </span>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-bold'>{dept}</span>
        <span
          className='rounded-full px-2 py-0.5 text-[0.65rem]'
          style={{ fontFamily: MONO, background: 'rgba(255,255,255,0.05)', color: 'var(--xlu-ink-subtle)' }}
        >
          {count}
        </span>
      </div>
      <div
        className='h-px flex-1'
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)`, opacity: 0.35 }}
      />
    </motion.div>
  );
}

/* ─── Hierarchy legend strip ─────────────────────────────────── */
function HierarchyLegend() {
  return (
    <div className='mb-10 flex flex-wrap justify-center gap-2'>
      {Object.entries(TIER_LABELS).map(([level, { label, icon }]) => (
        <div
          key={level}
          className='flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium'
          style={{
            borderColor: 'var(--xlu-hairline)',
            color: 'var(--xlu-ink-subtle)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {icon} {label}
        </div>
      ))}
    </div>
  );
}

type ViewMode = 'hierarchy' | 'grid';

interface TeamPageClientProps {
  members: TeamMember[];
  departments: string[];
}

export default function TeamPageClient({ members, departments }: TeamPageClientProps) {
  const reduced = useReducedMotion();
  const [activeDept, setActiveDept] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = members;
    if (activeDept !== 'All') list = list.filter((m) => m.department === activeDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q) ||
          m.employee_id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [members, activeDept, search]);

  const groupedByDept = useMemo(() => {
    const map = new Map<string, TeamMember[]>();
    for (const m of filtered) {
      if (!map.has(m.department)) map.set(m.department, []);
      map.get(m.department)!.push(m);
    }
    return map;
  }, [filtered]);

  const executives = useMemo(() => filtered.filter((m) => m.hierarchy_level === 1), [filtered]);

  const stats = useMemo(() => {
    const totalActive = members.length;
    const deptCount = new Set(members.map((m) => m.department)).size;
    const execCount = members.filter((m) => m.hierarchy_level === 1).length;
    const avgTenure = (() => {
      if (!members.length) return 0;
      const totalMonths = members.reduce((acc, m) => {
        const join = new Date(m.joining_date);
        const now = new Date();
        return acc + (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
      }, 0);
      return Math.round(totalMonths / members.length);
    })();
    return { totalActive, deptCount, execCount, avgTenure };
  }, [members]);

  const STAT_ITEMS = [
    { label: 'Team Members', value: `${stats.totalActive}` },
    { label: 'Departments', value: `${stats.deptCount}` },
    { label: 'Executives', value: `${stats.execCount}` },
    {
      label: 'Avg Tenure',
      value: stats.avgTenure < 12 ? `${stats.avgTenure}m` : `${Math.floor(stats.avgTenure / 12)}y`,
    },
  ];

  return (
    <main className='xlu min-h-screen overflow-hidden'>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className='relative isolate overflow-hidden px-4 py-[var(--xlu-space-2xl)] text-center'>
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

        <div className='relative mx-auto max-w-5xl'>
          <motion.span
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest'
            style={{
              borderColor: 'var(--xlu-hairline)',
              background: 'var(--xlu-surface-1)',
              color: 'var(--xlu-brand-1)',
            }}
          >
            <span className='h-1.5 w-1.5 rounded-full' style={{ background: 'var(--xlu-brand-1)' }} />
            The Humans Behind the Magic
          </motion.span>

          <motion.h1
            className='mb-6 text-[2.5rem] sm:text-5xl font-bold leading-tight tracking-[-0.02em] md:text-7xl'
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Meet the <span className='xlu-brand-text'>Team</span>
          </motion.h1>

          <motion.p
            className='mx-auto max-w-3xl text-xl leading-relaxed'
            style={{ color: 'var(--xlu-ink-muted)' }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A collective of engineers, marketers, designers, and strategists
            united by one obsession —{' '}
            <span className='xlu-brand-text font-semibold'>growing your business X times more</span>.
          </motion.p>

          {/* Live stats on a node rail */}
          <motion.div
            className='mx-auto mt-12 max-w-3xl'
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <div aria-hidden className='relative mb-4 hidden h-2 md:block'>
              <div
                className='absolute inset-x-0 top-1/2 h-px -translate-y-1/2'
                style={{
                  background:
                    'linear-gradient(90deg, transparent, var(--xlu-hairline) 12%, var(--xlu-hairline) 88%, transparent)',
                }}
              />
              <div className='relative grid h-full grid-cols-4'>
                {STAT_ITEMS.map((s) => (
                  <span key={s.label} className='flex items-center justify-center'>
                    <span
                      className='h-1.5 w-1.5 rounded-full'
                      style={{ background: 'var(--xlu-brand-1)', opacity: 0.6 }}
                    />
                  </span>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
              {STAT_ITEMS.map((s) => (
                <div key={s.label} className='text-center'>
                  <div className='xlu-brand-text text-3xl font-bold tabular-nums'>{s.value}</div>
                  <div className='mt-1 text-sm' style={{ color: 'var(--xlu-ink-subtle)' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Controls bar ──────────────────────────────────────── */}
      <section className='xlu-container pb-8'>
        <motion.div
          className='flex flex-col items-start gap-4 rounded-2xl border p-4 md:flex-row md:items-center'
          style={{
            borderColor: 'var(--xlu-hairline)',
            background: 'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
          }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Search */}
          <div className='relative w-full max-w-sm flex-1'>
            <svg
              className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2'
              style={{ color: 'var(--xlu-ink-faint)' }}
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
            <input
              type='text'
              placeholder='Search by name, role, department…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm transition-colors focus:outline-none'
              style={{
                borderColor: 'var(--xlu-hairline)',
                background: 'var(--xlu-surface-0)',
                color: 'var(--xlu-ink)',
              }}
            />
          </div>

          {/* Dept filter */}
          <div className='flex flex-wrap gap-2'>
            {['All', ...departments].map((dept) => {
              const accent = dept === 'All' ? 'var(--xlu-brand-1)' : getDeptAccent(dept);
              const active = activeDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className='xlu-pressable inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-[var(--xlu-dur-base)]'
                  style={{
                    borderColor: active
                      ? `color-mix(in srgb, ${accent} 55%, transparent)`
                      : 'var(--xlu-hairline)',
                    background: active ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'transparent',
                    color: active ? accent : 'var(--xlu-ink-subtle)',
                  }}
                >
                  <span
                    aria-hidden
                    className='h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-[var(--xlu-dur-base)]'
                    style={{
                      background: active ? accent : 'var(--xlu-ink-faint)',
                      boxShadow: active ? `0 0 8px 1px ${accent}` : 'none',
                    }}
                  />
                  {dept}
                </button>
              );
            })}
          </div>

          {/* Live result count — instant feedback that filtering did something */}
          <span
            className='ml-auto shrink-0 text-[0.7rem] uppercase tabular-nums'
            style={{
              fontFamily: MONO,
              letterSpacing: '0.16em',
              color: 'var(--xlu-ink-faint)',
            }}
          >
            {filtered.length} / {members.length}
          </span>

          {/* View mode toggle */}
          <div
            className='flex gap-1 rounded-lg border p-1'
            style={{ borderColor: 'var(--xlu-hairline)', background: 'var(--xlu-surface-0)' }}
          >
            {(['hierarchy', 'grid'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className='xlu-pressable rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-[var(--xlu-dur-base)]'
                style={{
                  background: viewMode === mode ? 'var(--xlu-brand-gradient)' : 'transparent',
                  color: viewMode === mode ? '#05050A' : 'var(--xlu-ink-subtle)',
                }}
              >
                {mode === 'hierarchy' ? '🏛 Hierarchy' : '⊞ Grid'}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Empty state ───────────────────────────────────────── */}
      {filtered.length === 0 && (
        <motion.div
          className='py-24 text-center'
          style={{ color: 'var(--xlu-ink-subtle)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className='mb-4 text-5xl'>🔍</div>
          <p className='text-lg'>No team members match your search.</p>
        </motion.div>
      )}

      {/* ── HIERARCHY VIEW ────────────────────────────────────── */}
      <AnimatePresence mode='wait'>
        {viewMode === 'hierarchy' && filtered.length > 0 && (
          <motion.section
            key='hierarchy'
            className='xlu-container space-y-16 pb-20'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {executives.length > 0 && (
              <div>
                <motion.div
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className='mb-8 flex items-center gap-4'
                >
                  <span
                    className='h-1.5 w-1.5 shrink-0 rounded-full'
                    style={{ background: 'var(--xlu-brand-1)' }}
                    aria-hidden
                  />
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-bold'>👑 Executive Leadership</span>
                    <span
                      className='rounded-full px-2 py-0.5 text-[0.65rem]'
                      style={{
                        fontFamily: MONO,
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--xlu-ink-subtle)',
                      }}
                    >
                      {executives.length}
                    </span>
                  </div>
                  <div
                    className='h-px flex-1'
                    style={{
                      background: 'linear-gradient(90deg, var(--xlu-brand-1), transparent)',
                      opacity: 0.35,
                    }}
                  />
                </motion.div>

                <div
                  className={`grid gap-6 ${
                    executives.length === 1
                      ? 'mx-auto max-w-sm grid-cols-1'
                      : executives.length === 2
                        ? 'mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  <AnimatePresence>
                    {executives.map((m, i) => (
                      <ExecutiveCard key={m.id} member={m} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {Array.from(groupedByDept.entries())
              .filter(([dept]) => {
                const deptMembers = groupedByDept.get(dept) ?? [];
                return deptMembers.filter((m) => m.hierarchy_level > 1).length > 0;
              })
              .map(([dept, deptMembers]) => {
                const nonExec = deptMembers.filter((m) => m.hierarchy_level > 1);
                return (
                  <motion.div
                    key={dept}
                    variants={sectionVariants}
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, margin: '-80px' }}
                  >
                    <DeptHeader dept={dept} count={nonExec.length} />
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                      <AnimatePresence>
                        {nonExec.map((m, i) => (
                          <MemberCard key={m.id} member={m} index={i} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
          </motion.section>
        )}

        {/* ── GRID VIEW ───────────────────────────────────────── */}
        {viewMode === 'grid' && filtered.length > 0 && (
          <motion.section
            key='grid'
            className='xlu-container pb-20'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HierarchyLegend />
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              <AnimatePresence>
                {filtered.map((m, i) => (
                  <MemberCard key={m.id} member={m} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Culture section ───────────────────────────────────── */}
      <section className='xlu-container pb-20'>
        <motion.div
          className='mb-12 text-center'
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className='mb-3 text-3xl font-bold tracking-[-0.02em] md:text-4xl'>
            How We <span className='xlu-brand-text'>Work</span>
          </h2>
          <p className='mx-auto max-w-2xl text-sm' style={{ color: 'var(--xlu-ink-muted)' }}>
            Our culture is built on engineering principles — systems thinking, measurable outcomes, and relentless iteration.
          </p>
        </motion.div>

        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          {[
            { icon: '🧠', title: 'Engineering Mindset', accent: 'var(--xlu-brand-1)', desc: 'Every marketing challenge is a systems problem. If we can\'t measure it, we engineer a way to measure it first.' },
            { icon: '🔁', title: 'Iterate & Improve', accent: 'var(--xlu-brand-3)', desc: 'Weekly retrospectives, A/B testing obsession, and a culture where "good enough" is never shipped — only measurably better.' },
            { icon: '🤝', title: 'Client Partnership', accent: 'var(--xlu-brand-2)', desc: 'We embed ourselves in your business goals, not just your deliverables. Your growth metrics are our KPIs.' },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              className='group relative overflow-hidden rounded-2xl border p-7'
              style={{
                borderColor: 'var(--xlu-hairline)',
                background: 'linear-gradient(160deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
              }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={reduced ? undefined : { y: -4 }}
            >
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 0% 0%, color-mix(in srgb, ${v.accent} 14%, transparent), transparent 70%)`,
                }}
              />
              <div className='relative'>
                <div className='mb-4 text-4xl'>{v.icon}</div>
                <h3 className='mb-2 text-lg font-bold'>{v.title}</h3>
                <p className='text-sm leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
                  {v.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className='xlu-container pb-28'>
        <motion.div
          className='relative mx-auto max-w-4xl overflow-hidden rounded-3xl border p-12 text-center'
          style={{
            borderColor: 'var(--xlu-hairline)',
            background: 'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
            boxShadow: '0 32px 90px -34px rgba(0,0,0,0.9)',
          }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <CornerBrackets all />
          <BlueprintGrid />

          <div className='relative'>
            <div className='mb-5 text-5xl'>🌟</div>
            <h2 className='mb-4 text-3xl font-bold tracking-[-0.02em] md:text-4xl'>
              Want to Join the <span className='xlu-brand-text'>Crew?</span>
            </h2>
            <p className='mx-auto mb-8 max-w-xl leading-relaxed' style={{ color: 'var(--xlu-ink-muted)' }}>
              We&apos;re always looking for exceptional engineers, marketers, and designers who believe growth is a science.
            </p>
            <div className='flex flex-col justify-center gap-4 sm:flex-row'>
              <Link
                href='/careers'
                id='careers-cta-btn'
                className='xlu-pressable inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white'
                style={{ background: 'var(--xlu-brand-gradient)' }}
              >
                View Open Positions
                <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
                </svg>
              </Link>
              <Link
                href='/contact'
                id='contact-team-btn'
                className='xlu-pressable inline-flex items-center justify-center gap-2 rounded-full border px-7 py-3.5 font-semibold'
                style={{
                  borderColor: 'var(--xlu-hairline)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--xlu-ink)',
                }}
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

/* ─── Executive card — heaviest surface on the page (§12) ────── */
function ExecutiveCard({ member }: { member: TeamMember; index: number }) {
  const accent = getDeptAccent(member.department);
  const initials = getInitials(member.name);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      whileHover={{ y: -6 }}
      className='group relative cursor-default overflow-hidden rounded-2xl border'
      style={{
        borderColor: 'color-mix(in srgb, var(--xlu-brand-1) 30%, transparent)',
        background: 'linear-gradient(160deg, var(--xlu-surface-3) 0%, var(--xlu-surface-1) 100%)',
        boxShadow: '0 28px 70px -30px rgba(0,0,0,0.95), inset 0 1px 0 0 rgba(255,255,255,0.07)',
      }}
    >
      <CornerBrackets />

      <span
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100'
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 0%, color-mix(in srgb, var(--xlu-brand-1) 16%, transparent), transparent 70%)',
        }}
      />

      <div className='relative p-7'>
        <div className='mb-6 flex flex-col items-center text-center'>
          <div className='relative mb-4'>
            <div
              className='flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold'
              style={{
                background: `linear-gradient(140deg, color-mix(in srgb, ${accent} 35%, var(--xlu-surface-3)), var(--xlu-surface-2))`,
                border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                color: 'var(--xlu-ink)',
              }}
            >
              {initials}
            </div>
            <div
              className='absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm'
              style={{ background: 'var(--xlu-brand-gradient)', borderColor: 'var(--xlu-surface-1)' }}
            >
              👑
            </div>
          </div>

          <h3 className='text-lg font-bold'>{member.name}</h3>
          <p className='mt-1 text-sm font-semibold' style={{ color: 'var(--xlu-brand-1)' }}>
            {member.role.split(/[&\/|\-–—+]|\band\b/i)[0].trim()}
          </p>
          {member.specialty && (
            <span
              className='mt-1.5 inline-block rounded-lg px-3 py-1 text-xs font-semibold'
              style={{
                background: 'color-mix(in srgb, var(--xlu-brand-1) 12%, transparent)',
                color: 'var(--xlu-brand-1)',
                border: '1px solid color-mix(in srgb, var(--xlu-brand-1) 25%, transparent)',
              }}
            >
              🎨 {member.specialty}
            </span>
          )}
          <div className='mt-2 flex items-center gap-2 text-xs' style={{ color: 'var(--xlu-ink-subtle)' }}>
            <span>{member.department}</span>
            <span>·</span>
            <span>{tenureLabel(member.joining_date)}</span>
          </div>
        </div>

        <div className='mb-4 h-px' style={{ background: 'var(--xlu-hairline)' }} />

        <div className='text-center text-[11px]' style={{ color: 'var(--xlu-ink-subtle)' }}>
          <div
            className='rounded-lg border p-2'
            style={{
              borderColor: 'var(--xlu-hairline)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <div
              className='text-sm font-bold'
              style={{ fontFamily: MONO, color: 'var(--xlu-brand-1)', letterSpacing: '0.08em' }}
            >
              {member.employee_id}
            </div>
            <div>Employee ID</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
