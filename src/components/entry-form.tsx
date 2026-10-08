'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { categoryVisual } from '@/lib/category-icons';
import { api, errMsg } from '@/lib/client';
import { num } from '@/lib/format';
import type { DailyEntry, ExpenseCategory, Vehicle } from '@/lib/types';
import { useCanManage, useCurrency } from './session-context';
import { Field, IconBadge, Loading } from './ui';

const today = () => new Date().toISOString().slice(0, 10);

export function EntryForm({ entry }: { entry?: DailyEntry }) {
  const router = useRouter();
  const cur = useCurrency();
  const canManage = useCanManage();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [vehicleId, setVehicleId] = useState(entry?.vehicleId ?? '');
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? today());
  const [income, setIncome] = useState(entry ? String(entry.income) : '');
  const [parcels, setParcels] = useState(entry ? String(entry.parcels) : '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries((entry?.expenses ?? []).map((e) => [e.categoryId, String(e.amount)])),
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ vehicles: Vehicle[]; categories: ExpenseCategory[] }>('/bootstrap').then((b) => {
      const active = b.vehicles.filter((v) => v.status === 'active' || v.id === entry?.vehicleId);
      setVehicles(active);
      setCategories(b.categories.filter((c) => c.kind === 'daily'));
      if (!entry && active.length === 1) setVehicleId(active[0].id);
    });
  }, [entry]);

  // Keep categories already used on this entry even if since deactivated.
  const shownCategories = useMemo(() => {
    const extra = (entry?.expenses ?? [])
      .filter((e) => !categories.some((c) => c.id === e.categoryId))
      .map((e) => ({ id: e.categoryId, name: e.categoryName, kind: 'daily' as const, tag: null, sortOrder: 999, active: false }));
    return [...categories, ...extra];
  }, [categories, entry]);

  const n = (s: string) => Number(s) || 0;
  const totalExp = shownCategories.reduce((a, c) => a + n(amounts[c.id] ?? ''), 0);
  const net = n(income) - totalExp;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId) return toast.error('Pick a vehicle');
    setBusy(true);
    try {
      const body = {
        vehicleId,
        entryDate,
        income: n(income),
        parcels: n(parcels),
        notes: notes || null,
        expenses: Object.entries(amounts)
          .filter(([, v]) => n(v) > 0)
          .map(([categoryId, v]) => ({ categoryId, amount: n(v) })),
      };
      if (entry) await api(`/entries/${entry.id}`, { method: 'PUT', body });
      else await api('/entries', { method: 'POST', body });
      toast.success('Entry saved');
      router.push('/entries');
      router.refresh();
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry || !confirm('Delete this entry? It will no longer count in reports.')) return;
    try {
      await api(`/entries/${entry.id}`, { method: 'DELETE' });
      toast.success('Entry deleted');
      router.push('/entries');
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  if (!vehicles) return <Loading />;
  if (!vehicles.length)
    return <div className="card p-8 text-center text-sm text-slate-500">No vehicles available. {canManage ? 'Add a vehicle first.' : 'Ask your manager to assign you a vehicle.'}</div>;

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Vehicle">
            <select className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration}
                  {v.nickname ? ` · ${v.nickname}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className="input" value={entryDate} max={today()} onChange={(e) => setEntryDate(e.target.value)} required />
          </Field>
          <Field label={`Total collection (${cur})`}>
            <input type="number" inputMode="decimal" min={0} step="any" className="input text-lg font-semibold" value={income} onChange={(e) => setIncome(e.target.value)} required />
          </Field>
          <Field label={`Parcels (${cur})`}>
            <input type="number" inputMode="decimal" min={0} step="any" className="input" value={parcels} onChange={(e) => setParcels(e.target.value)} />
          </Field>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold">Expenses</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {shownCategories.map((c) => {
              const { icon, color } = categoryVisual(c.name);
              const filled = Number(amounts[c.id]) > 0;
              return (
                <label
                  key={c.id}
                  className={clsx('flex items-center gap-3 rounded-xl border p-2.5 transition', filled ? 'bg-surface' : 'border-slate-200 bg-slate-50')}
                  style={filled ? { borderColor: `${color}80`, background: `${color}10` } : undefined}
                >
                  <IconBadge icon={icon} color={color} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-slate-600">{c.name}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      className="w-full bg-transparent text-sm font-semibold tabular-nums text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                      placeholder="0"
                      aria-label={c.name}
                      value={amounts[c.id] ?? ''}
                      onChange={(e) => setAmounts({ ...amounts, [c.id]: e.target.value })}
                    />
                  </span>
                </label>
              );
            })}
          </div>
          <div className="mt-4">
            <Field label="Notes (optional)">
              <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </div>
      </div>
      <div>
        <div className="card sticky top-40 space-y-3 p-5">
          <h2 className="text-sm font-semibold">Summary</h2>
          <Row label="Total collection" value={`${cur} ${num(n(income))}`} />
          <Row label="Expenses" value={`− ${cur} ${num(totalExp)}`} />
          <div className="border-t border-slate-200 pt-3">
            <Row label="Net" value={`${cur} ${num(net)}`} strong bad={net < 0} />
          </div>
          <Row label="Parcels (separate)" value={`${cur} ${num(n(parcels))}`} />
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Saving…' : entry ? 'Save changes' : 'Save entry'}
          </button>
          {entry && canManage && (
            <button type="button" onClick={remove} className="btn-ghost w-full text-red-600">
              Delete entry
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Row({ label, value, strong, bad }: { label: string; value: string; strong?: boolean; bad?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`tabular-nums ${strong ? 'text-lg font-bold' : 'font-medium'} ${bad ? 'text-red-600' : ''}`}>{value}</span>
    </div>
  );
}
