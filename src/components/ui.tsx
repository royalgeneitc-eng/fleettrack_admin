'use client';

import clsx from 'clsx';
import { ArrowDown, ArrowUp, Inbox, X, type LucideIcon } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Page title bar pinned under the app top bar; page content scrolls beneath it.
 * `children` render inside the pinned area (tabs, KPI cards…). Tall headers pass
 * `pinOnMobile={false}` so they only stick from md up.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  children,
  pinOnMobile = true,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  pinOnMobile?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'z-20 -mx-4 mb-4 border-b border-slate-200 bg-slate-50 px-4 py-3 print:static print:border-0',
        pinOnMobile ? 'sticky top-14' : 'md:sticky md:top-14',
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/** Rounded-square icon on a tint of its own colour (KPI cards, list rows). */
export function IconBadge({ icon: Icon, color, size = 36 }: { icon: LucideIcon; color: string; size?: number }) {
  return (
    <span className="icon-badge" style={{ width: size, height: size, background: `${color}22`, color }}>
      <Icon size={Math.round(size * 0.52)} />
    </span>
  );
}

/** Text colour for a money figure: green profit, red loss, grey zero. */
export const netClass = (n: number) => (Math.round(n) > 0 ? 'text-green-600' : Math.round(n) < 0 ? 'text-red-600' : 'text-slate-500');

/** Change vs last month; `upIsGood` false for costs (expenses rising is bad). */
export function Delta({ pct, upIsGood = true }: { pct: number | null; upIsGood?: boolean }) {
  if (pct === null || !Number.isFinite(pct)) return <span className="text-xs text-slate-400">No data last month</span>;
  const r = Math.round(pct);
  const good = r >= 0 ? upIsGood : !upIsGood;
  const Icon = r >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={clsx('inline-flex items-center gap-0.5 text-xs font-medium', r === 0 ? 'text-slate-500' : good ? 'text-green-600' : 'text-red-600')}>
      <Icon size={12} /> {Math.abs(r)}% vs last month
    </span>
  );
}

/** KPI tile: label, icon, amount and change vs last month. */
export function KpiCard({
  label, value, icon, color, delta, upIsGood = true, valueClass,
}: { label: string; value: string; icon: LucideIcon; color: string; delta?: number | null; upIsGood?: boolean; valueClass?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <IconBadge icon={icon} color={color} size={32} />
      </div>
      <div className={clsx('mt-1 text-lg font-bold tabular-nums xl:text-xl', valueClass ?? 'text-slate-900')}>{value}</div>
      {delta !== undefined && <Delta pct={delta} upIsGood={upIsGood} />}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={clsx('mt-0.5 text-lg font-bold xl:text-xl', tone === 'bad' ? 'text-red-600' : 'text-slate-900')}>{value}</div>
      {hint && <div className="mt-0.5 truncate text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className={clsx('card w-full p-5', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Empty({ children, icon: Icon = Inbox, title }: { children?: React.ReactNode; icon?: LucideIcon; title?: string }) {
  return (
    <div className="card flex flex-col items-center p-10 text-center">
      <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={30} />
      </span>
      {title && <div className="text-base font-semibold text-slate-900">{title}</div>}
      <div className="mt-1 text-sm text-slate-500">{children}</div>
    </div>
  );
}

export function Loading() {
  return <div className="p-10 text-center text-sm text-slate-400">Loading…</div>;
}
