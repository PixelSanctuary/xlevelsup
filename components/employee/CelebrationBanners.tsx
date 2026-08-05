'use client';

import { useEffect, useState } from 'react';
import type { FestivalKey } from '@/lib/erp/holidays';
import type { CelebrationEmployee } from '@/lib/erp/employees';

interface CelebrationBannersProps {
  dateKey: string; // YYYY-MM-DD (IST) — scopes dismissal to today only
  festival: { key: FestivalKey; name: string } | null;
  birthdays: CelebrationEmployee[];
  anniversaries: CelebrationEmployee[];
  currentEmployeeId: number;
}

const FESTIVAL_THEME: Record<
  FestivalKey,
  { emoji: string; title: string; message: string; className: string }
> = {
  diwali: {
    emoji: '🪔',
    title: 'Happy Diwali!',
    message: 'Wishing you and your family a festival full of light, warmth and joy.',
    className: 'from-amber-500/20 via-orange-500/10 to-amber-500/20 border-amber-500/30',
  },
  christmas: {
    emoji: '🎄',
    title: 'Merry Christmas!',
    message: 'Wishing you a season of joy, rest, and good company.',
    className: 'from-emerald-500/20 via-red-500/10 to-emerald-500/20 border-emerald-500/30',
  },
  bakrid: {
    emoji: '🌙',
    title: 'Eid Mubarak!',
    message: 'Wishing you and your family peace, joy and blessings this Bakrid.',
    className: 'from-emerald-500/20 via-teal-500/10 to-emerald-500/20 border-emerald-500/30',
  },
};

function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

function useDismiss(id: string) {
  const [dismissed, setDismissed] = useState(true); // start hidden; localStorage read is client-only

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(id) === '1');
    } catch {
      setDismissed(false);
    }
  }, [id]);

  const dismiss = () => {
    try {
      localStorage.setItem(id, '1');
    } catch {
      // localStorage unavailable (private browsing etc.) — just hide for this render
    }
    setDismissed(true);
  };

  return { dismissed, dismiss };
}

function Banner({
  id,
  className,
  emoji,
  title,
  message,
}: {
  id: string;
  className: string;
  emoji: string;
  title: string;
  message: string;
}) {
  const { dismissed, dismiss } = useDismiss(id);
  if (dismissed) return null;

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border bg-gradient-to-r px-4 py-3 sm:items-center ${className}`}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{title}</p>
        <p className="text-sm text-gray-300">{message}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}

export default function CelebrationBanners({
  dateKey,
  festival,
  birthdays,
  anniversaries,
  currentEmployeeId,
}: CelebrationBannersProps) {
  if (!festival && birthdays.length === 0 && anniversaries.length === 0) {
    return null;
  }

  const birthdayNames = birthdays.map((b) => b.name);
  const isSelfBirthday = birthdays.some((b) => b.id === currentEmployeeId);
  const birthdayMessage = isSelfBirthday
    ? birthdays.length === 1
      ? 'Wishing you a fantastic year ahead — enjoy your day! 🎉'
      : `Happy Birthday to you and to ${joinNames(
          birthdayNames.filter((n, i) => birthdays[i].id !== currentEmployeeId),
        )}! Have a wonderful day.`
    : `Let's all wish ${joinNames(birthdayNames)} a very happy birthday today!`;

  const anniversaryMessage = anniversaries
    .map((a) => `${a.name} completes ${a.years} year${a.years === 1 ? '' : 's'} with us today`)
    .join(' · ');

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pt-4 sm:px-6 lg:px-8">
      {festival && (
        <Banner
          id={`celebration-dismissed-festival-${dateKey}`}
          className={FESTIVAL_THEME[festival.key].className}
          emoji={FESTIVAL_THEME[festival.key].emoji}
          title={FESTIVAL_THEME[festival.key].title}
          message={FESTIVAL_THEME[festival.key].message}
        />
      )}
      {birthdays.length > 0 && (
        <Banner
          id={`celebration-dismissed-birthday-${dateKey}`}
          className="from-pink-500/20 via-purple-500/10 to-pink-500/20 border-pink-500/30"
          emoji="🎂"
          title={`Happy Birthday, ${joinNames(birthdayNames)}!`}
          message={birthdayMessage}
        />
      )}
      {anniversaries.length > 0 && (
        <Banner
          id={`celebration-dismissed-anniversary-${dateKey}`}
          className="from-[var(--cyan)]/20 via-[var(--purple)]/10 to-[var(--cyan)]/20 border-[var(--cyan)]/30"
          emoji="🎊"
          title="Work Anniversary!"
          message={anniversaryMessage}
        />
      )}
    </div>
  );
}
