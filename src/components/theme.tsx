'use client';

import clsx from 'clsx';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { THEME_EVENT, type ThemePref, getThemePref, isDarkNow, setThemePref } from '@/lib/theme';

/** True while the dark theme is showing; re-renders on theme changes (incl. OS switches). */
export function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => setDark(isDarkNow());
    sync();
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);
  return dark;
}

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** Top-bar theme menu: System (follows the OS) / Light / Dark. */
export function ThemeToggle() {
  const dark = useIsDark();
  const [open, setOpen] = useState(false);
  const [pref, setPref] = useState<ThemePref>('system');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setPref(getThemePref()), [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const Icon = dark ? Moon : Sun;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Theme" title="Theme" className="rounded-lg p-1.5 text-blue-100 hover:bg-white/10">
        <Icon size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-surface py-1 text-slate-900 shadow-lg">
          {OPTIONS.map(({ value, label, icon: I }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setThemePref(value);
                setPref(value);
                setOpen(false);
              }}
              className={clsx('flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100', pref === value && 'font-semibold text-brand-600')}
            >
              <I size={16} /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
