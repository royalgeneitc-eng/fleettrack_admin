'use client';

import clsx from 'clsx';
import { BarChart3, Building2, Bus, ChevronRight, ClipboardList, FileText, LogOut, Menu, Plus, Receipt, Settings, Users, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useSession } from './session-context';
import { ThemeToggle } from './theme';

/**
 * App frame: a full-width top bar, the nav sidebar starting below it, and the
 * page area. Pages pin their own header under the top bar via <PageHeader>
 * (sticky top-14) so content scrolls underneath it.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const manage = user.role === 'owner' || user.role === 'manager';

  useEffect(() => setOpen(false), [path]);

  const items = [
    ...(user.organization
      ? [
          { href: '/', label: 'Dashboard', icon: BarChart3 },
          { href: '/entries', label: 'Daily entries', icon: ClipboardList },
          { href: '/vehicles', label: 'Vehicles', icon: Bus },
          ...(manage ? [{ href: '/expenses', label: 'Monthly expenses', icon: Receipt }] : []),
          { href: '/reports', label: 'Reports', icon: FileText },
          ...(manage ? [{ href: '/team', label: 'Team', icon: Users }] : []),
          ...(manage ? [{ href: '/settings', label: 'Settings', icon: Settings }] : []),
        ]
      : []),
    ...(user.isSuperAdmin ? [{ href: '/platform', label: 'Platform', icon: Building2 }] : []),
  ];

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const initials = user.fullName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const nav = (
    <nav className="flex h-full flex-col overflow-y-auto py-4">
      <div className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</div>
      <div className="flex-1 space-y-1 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                active ? 'bg-brand-50 font-semibold text-brand-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon size={18} className={active ? 'text-brand-600' : 'text-slate-400'} /> {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-600" />}
            </Link>
          );
        })}
      </div>
      <div className="mx-3 mt-4 border-t border-slate-200 pt-3">
        <Link href={manage ? '/settings' : '/'} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-100">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">{initials}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold">{user.fullName}</span>
            <span className="block truncate text-xs text-slate-500">{user.email}</span>
          </span>
          <ChevronRight size={16} className="text-slate-400" />
        </Link>
        <button type="button" onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <header className="topbar no-print fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 px-4 text-white shadow">
        <button type="button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)} className="-ml-1 rounded-lg p-1.5 hover:bg-white/10 lg:hidden">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href={user.organization ? '/' : '/platform'} className="flex min-w-0 items-center gap-2.5 lg:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9 shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block text-base font-bold">
              Fleet<span className="text-[#60a5fa]">Track</span>
            </span>
            <span className="block truncate text-[11px] text-blue-200">{user.organization?.name ?? 'Platform admin'}</span>
          </span>
        </Link>
        <div className="flex-1" />
        {user.organization && (
          <Link href="/entries/new" className="btn bg-[#0b5cff] px-3 py-1.5 text-white ring-1 ring-white/20 hover:bg-[#2f74ff]">
            <Plus size={16} /> <span className="hidden sm:inline">New entry</span>
          </Link>
        )}
        <ThemeToggle />
        <div className="flex items-center gap-2 border-l border-white/15 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed] text-xs font-bold">{initials}</div>
          <div className="hidden leading-tight md:block">
            <div className="text-sm font-medium">{user.fullName}</div>
            <div className="text-xs capitalize text-blue-200">{user.organization ? user.role : 'super admin'}</div>
          </div>
          <button type="button" onClick={logout} aria-label="Sign out" title="Sign out" className="ml-1 rounded-lg p-1.5 text-blue-100 hover:bg-white/10">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <aside className="no-print fixed bottom-0 left-0 top-14 z-30 hidden w-60 border-r border-slate-200 bg-surface lg:block">{nav}</aside>
      {open && (
        <div className="no-print fixed inset-x-0 bottom-0 top-14 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-surface shadow-xl">{nav}</aside>
        </div>
      )}

      <main className="min-h-screen px-4 pb-6 pt-14 lg:pl-64 print:p-0">{children}</main>
    </>
  );
}
