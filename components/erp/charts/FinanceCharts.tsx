'use client';

/**
 * Hand-rolled chart primitives for the Financial Center's Overview and
 * Analytics tabs. No charting library is installed in this project, and
 * these are simple enough (bars, grouped columns, a line, a donut) that
 * pulling one in isn't worth it — matches the existing donut/progress-bar
 * precedent this file replaces.
 *
 * Both BarBreakdown and TrendChart offer a second view (donut, line) via a
 * small self-contained toggle — a display-mode switch, not a data filter,
 * so it doesn't run afoul of "no per-chart filters": every view of a given
 * chart renders the exact same (already-filtered) data.
 */

import { useState } from 'react';

/** Fixed categorical order — never reassigned by rank/filter, so a given
 * category keeps its color across renders. Capped at 7 + "Other" fold. */
export const CATEGORY_COLORS = [
  // bg-cyan/bg-purple aren't real utilities here — this codebase only
  // hand-defines .text-cyan/.text-purple/.border-cyan in globals.css, no
  // .bg-cyan/.bg-purple — so those classes silently apply no background at
  // all (confirmed via computed styles: transparent). Arbitrary-value
  // bg-[var(--cyan)] resolves to the real brand hex reliably.
  'bg-[var(--cyan)] text-cyan',
  'bg-[var(--purple)] text-purple',
  'bg-blue-500 text-blue-500',
  'bg-emerald-500 text-emerald-500',
  'bg-yellow-500 text-yellow-500',
  'bg-pink-500 text-pink-500',
  'bg-orange-500 text-orange-500',
];
export const OTHER_COLOR = 'bg-gray-600 text-gray-500';

// SVG needs real paint values, not classes — this is the stroke/fill twin
// of CATEGORY_COLORS, same fixed order, used only where className+currentColor
// isn't an option (the donut's <circle> segments).
const CATEGORY_HEX = ['#00F0FF', '#B026FF', '#3b82f6', '#10b981', '#eab308', '#ec4899', '#f97316'];
const OTHER_HEX = '#4b5563';

export function colorForIndex(index: number): string {
  return index < CATEGORY_COLORS.length ? CATEGORY_COLORS[index] : OTHER_COLOR;
}

function hexForIndex(index: number): string {
  return index < CATEGORY_HEX.length ? CATEGORY_HEX[index] : OTHER_HEX;
}

// ─────────────────────────────────────────────────────────────────────────
// Small shared view-mode toggle (Bar/Donut, Bar/Line, ...)
// ─────────────────────────────────────────────────────────────────────────

function ViewToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-gray-700 text-[10px] shrink-0">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 font-semibold transition-colors ${
            value === opt.value ? 'bg-[var(--cyan)] text-black' : 'bg-dark-800 text-gray-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Stat tile
// ─────────────────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  accentClassName?: string; // e.g. 'border-green-500', drawn as a left rail
}

export function StatTile({ label, value, sublabel, accentClassName }: StatTileProps) {
  return (
    <div className={`glass p-5 rounded-lg ${accentClassName ? `border-l-4 ${accentClassName}` : ''}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-white mt-1.5">{value}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1.5">{sublabel}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Breakdown — category / payment mode / vendor / client. Two views over the
// same ranked-and-folded items: a horizontal bar list (precise comparison)
// or a donut (part-to-whole at a glance) — capped at 6 + "Other", which is
// exactly the donut's "≤6 segments" comfort zone.
// ─────────────────────────────────────────────────────────────────────────

export interface BarBreakdownItem {
  key: string;
  label: string;
  value: number;
}

interface BarBreakdownProps {
  items: BarBreakdownItem[];
  formatValue: (n: number) => string;
  limit?: number;
  emptyLabel?: string;
  totalLabel?: string;
}

function rankAndFold(items: BarBreakdownItem[], limit: number) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const visible = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  if (rest.length > 0) {
    visible.push({
      key: '__other__',
      label: `Other (${rest.length})`,
      value: rest.reduce((sum, r) => sum + r.value, 0),
    });
  }
  return { visible, total: sorted.reduce((sum, i) => sum + i.value, 0) || 1 };
}

export function BarBreakdown({
  items,
  formatValue,
  limit = 6,
  emptyLabel = 'No data for this filter',
  totalLabel = 'Total',
}: BarBreakdownProps) {
  const [view, setView] = useState<'bar' | 'donut'>('bar');

  if (items.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">{emptyLabel}</p>;
  }

  const { visible, total } = rankAndFold(items, limit);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <ViewToggle
          value={view}
          onChange={setView}
          options={[
            { value: 'bar', label: 'Bar' },
            { value: 'donut', label: 'Donut' },
          ]}
        />
      </div>
      {view === 'bar' ? (
        <BarBreakdownBars visible={visible} total={total} formatValue={formatValue} />
      ) : (
        <BarBreakdownDonut visible={visible} total={total} formatValue={formatValue} totalLabel={totalLabel} />
      )}
    </div>
  );
}

function BarBreakdownBars({
  visible,
  total,
  formatValue,
}: {
  visible: BarBreakdownItem[];
  total: number;
  formatValue: (n: number) => string;
}) {
  const max = Math.max(...visible.map((i) => i.value), 1);

  return (
    <div className="space-y-3.5">
      {visible.map((item, index) => {
        const isOther = item.key === '__other__';
        const colorClasses = isOther ? OTHER_COLOR : colorForIndex(index);
        const [bgClass] = colorClasses.split(' ');
        const pct = (item.value / total) * 100;
        const widthPct = (item.value / max) * 100;
        return (
          <div key={item.key}>
            <div className="flex justify-between items-baseline gap-3 text-xs mb-1.5">
              <span className="font-medium text-gray-300 truncate">{item.label}</span>
              <span className="text-gray-400 font-semibold whitespace-nowrap">
                {formatValue(item.value)} <span className="text-gray-600">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="w-full h-2 bg-gray-800 border border-gray-700/60 rounded-r-md overflow-hidden">
              <div
                className={`h-full ${bgClass} rounded-r-md transition-all duration-500`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BarBreakdownDonut({
  visible,
  total,
  formatValue,
  totalLabel,
}: {
  visible: BarBreakdownItem[];
  total: number;
  formatValue: (n: number) => string;
  totalLabel: string;
}) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  // r=15.915 makes the circle's circumference ~100 user units, so
  // percentages can be used directly as stroke-dasharray values below.
  const gapDeg = visible.length > 1 ? 1.5 : 0; // thin surface gap between segments, not a stroke

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
      <div className="flex justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="4" />
            {(() => {
              let acc = 0;
              return visible.map((item, index) => {
                const isOther = item.key === '__other__';
                const pct = (item.value / total) * 100;
                const dash = Math.max(pct - gapDeg, 0);
                const offset = 100 - acc;
                acc += pct;
                return (
                  <circle
                    key={item.key}
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke={isOther ? OTHER_HEX : hexForIndex(index)}
                    strokeWidth="4"
                    strokeDasharray={`${dash} ${100 - dash}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    opacity={hoverKey && hoverKey !== item.key ? 0.35 : 1}
                    className="transition-all duration-300"
                    onMouseEnter={() => setHoverKey(item.key)}
                    onMouseLeave={() => setHoverKey((k) => (k === item.key ? null : k))}
                  />
                );
              });
            })()}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-bold text-white">{formatValue(total).split('.')[0]}</span>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">{totalLabel}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {visible.map((item, index) => {
          const isOther = item.key === '__other__';
          const pct = (item.value / total) * 100;
          return (
            <div
              key={item.key}
              className={`flex items-center justify-between gap-3 text-xs rounded px-1.5 py-1 -mx-1.5 transition-colors ${
                hoverKey === item.key ? 'bg-white/5' : ''
              }`}
              onMouseEnter={() => setHoverKey(item.key)}
              onMouseLeave={() => setHoverKey((k) => (k === item.key ? null : k))}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: isOther ? OTHER_HEX : hexForIndex(index) }}
                />
                <span className="font-medium text-gray-300 truncate">{item.label}</span>
              </span>
              <span className="text-gray-400 font-semibold whitespace-nowrap">
                {formatValue(item.value)} <span className="text-gray-600">({pct.toFixed(0)}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Trend chart — 2 series (inflow vs outflow), one shared y-axis. Two views:
// grouped columns (precise per-period comparison) or a line+area (the
// skill's default form for "trend over time") — same data either way.
// ─────────────────────────────────────────────────────────────────────────

export interface TrendPoint {
  label: string;
  inflow: number;
  outflow: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  formatValue: (n: number) => string;
}

const CHART_HEIGHT = 200;
const CHART_PADDING_TOP = 16;
const VIEWBOX_WIDTH = 1000;

export function TrendChart({ data, formatValue }: TrendChartProps) {
  const [view, setView] = useState<'bar' | 'line'>('bar');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 py-12 text-center">No transactions in range</p>;
  }

  const max = Math.max(...data.map((d) => Math.max(d.inflow, d.outflow)), 1);
  const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP;
  const yTicks = [0, 0.5, 1].map((f) => Math.round((max * f) / 100) * 100 || max * f);

  const xAt = (i: number) => ((i + 0.5) / data.length) * VIEWBOX_WIDTH;
  const yAt = (value: number) => CHART_PADDING_TOP + (1 - value / max) * plotHeight;
  const linePath = (key: 'inflow' | 'outflow') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(d[key])}`).join(' ');
  const areaPath = (key: 'inflow' | 'outflow') =>
    `${linePath(key)} L ${xAt(data.length - 1)} ${CHART_HEIGHT} L ${xAt(0)} ${CHART_HEIGHT} Z`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        {/* Legend — identity channel, never color-alone */}
        <div className="flex items-center gap-5 text-xs">
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Inflow
          </span>
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Outflow
          </span>
        </div>
        <ViewToggle
          value={view}
          onChange={setView}
          options={[
            { value: 'bar', label: 'Bar' },
            { value: 'line', label: 'Line' },
          ]}
        />
      </div>

      <div className="relative">
        {/* Gridlines + y ticks */}
        <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-gray-600" style={{ height: CHART_HEIGHT }}>
          {[...yTicks].reverse().map((tick, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-12 text-right shrink-0">{tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : Math.round(tick)}</span>
              <span className="flex-1 border-t border-gray-800" />
            </div>
          ))}
        </div>

        {view === 'bar' ? (
          <div className="flex items-end pl-14" style={{ height: CHART_HEIGHT }}>
            {data.map((point, i) => {
              const inflowH = (point.inflow / max) * plotHeight;
              const outflowH = (point.outflow / max) * plotHeight;
              return (
                <div
                  key={point.label}
                  className="relative flex-1 h-full flex items-end justify-center gap-[3px]"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
                >
                  {hoverIndex === i && <TrendTooltip point={point} formatValue={formatValue} />}
                  <div
                    style={{ height: `${Math.max(inflowH, point.inflow > 0 ? 2 : 0)}px`, width: 'min(32%, 10px)' }}
                    className="bg-green-500 rounded-t-[3px] min-w-[4px] transition-all"
                  />
                  <div
                    style={{ height: `${Math.max(outflowH, point.outflow > 0 ? 2 : 0)}px`, width: 'min(32%, 10px)' }}
                    className="bg-red-400 rounded-t-[3px] min-w-[4px] transition-all"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative pl-14" style={{ height: CHART_HEIGHT }}>
            <svg
              className="absolute inset-0 w-full h-full pl-14"
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <path d={areaPath('inflow')} className="text-green-500" fill="currentColor" fillOpacity="0.1" stroke="none" />
              <path d={areaPath('outflow')} className="text-red-400" fill="currentColor" fillOpacity="0.1" stroke="none" />
              <path d={linePath('inflow')} className="text-green-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <path d={linePath('outflow')} className="text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {data.map((d, i) => (
                <g key={d.label}>
                  <circle cx={xAt(i)} cy={yAt(d.inflow)} r="4" className="text-green-500" fill="currentColor" stroke="#0c0c0e" strokeWidth="2" />
                  <circle cx={xAt(i)} cy={yAt(d.outflow)} r="4" className="text-red-400" fill="currentColor" stroke="#0c0c0e" strokeWidth="2" />
                </g>
              ))}
            </svg>
            {/* Invisible per-point hit targets — bigger than the marker, per the interaction spec */}
            <div className="relative flex h-full pl-14">
              {data.map((point, i) => (
                <div
                  key={point.label}
                  className="relative flex-1 h-full"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
                >
                  {hoverIndex === i && <TrendTooltip point={point} formatValue={formatValue} center />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* X-axis labels */}
        <div className="flex pl-14 mt-2">
          {data.map((point) => (
            <div key={point.label} className="flex-1 text-center text-[10px] text-gray-500 truncate">
              {point.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendTooltip({
  point,
  formatValue,
  center = false,
}: {
  point: TrendPoint;
  formatValue: (n: number) => string;
  center?: boolean;
}) {
  return (
    <div
      className={`absolute bottom-full mb-2 z-10 bg-[#0c0c0e] border border-gray-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl ${
        center ? 'left-1/2 -translate-x-1/2' : ''
      }`}
    >
      <p className="font-semibold text-white mb-1">{point.label}</p>
      <p className="text-green-400">Inflow: {formatValue(point.inflow)}</p>
      <p className="text-red-400">Outflow: {formatValue(point.outflow)}</p>
    </div>
  );
}
