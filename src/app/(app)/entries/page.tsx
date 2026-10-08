'use client';

import { NotebookPen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VehicleSelect, currentMonth, monthRange, useVehicles } from '@/components/filters';
import { Empty, Loading, PageHeader, netClass } from '@/components/ui';
import { api } from '@/lib/client';
import { MONTHS, weekday } from '@/lib/dates';
import { num } from '@/lib/format';
import type { DailyEntry } from '@/lib/types';

export default function EntriesPage() {
  const router = useRouter();
  const vehicles = useVehicles();
  const [month, setMonth] = useState(currentMonth());
  const [vehicleId, setVehicleId] = useState('');
  const [entries, setEntries] = useState<DailyEntry[] | null>(null);

  useEffect(() => {
    const { from, to } = monthRange(month);
    setEntries(null);
    api<DailyEntry[]>(`/entries?from=${from}&to=${to}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`).then(setEntries);
  }, [month, vehicleId]);

  const tot = (k: 'income' | 'parcels' | 'totalExpenses' | 'net') => (entries ?? []).reduce((a, e) => a + e[k], 0);

  return (
    <div>
      <PageHeader
        title="Daily entries"
        subtitle="One entry per vehicle per day"
        actions={
          <>
            <input type="month" className="input w-auto" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
            <VehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />
          </>
        }
      />
      {!entries ? (
        <Loading />
      ) : !entries.length ? (
        <Empty icon={NotebookPen} title="No entries yet">
          Start recording today&apos;s collection and expenses.
          <div className="mt-4">
            <Link href="/entries/new" className="btn-primary">
              + New entry
            </Link>
          </div>
        </Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="th">Date</th>
                <th className="th">Vehicle</th>
                <th className="th text-right">Collection</th>
                <th className="th text-right">Expenses</th>
                <th className="th text-right">Net</th>
                <th className="th text-right">Parcels</th>
                <th className="th">Recorded by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/entries/${e.id}`)}>
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 leading-none">
                        <span className="text-base font-bold text-brand-600">{Number(e.entryDate.slice(8))}</span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase text-brand-600">{MONTHS[Number(e.entryDate.slice(5, 7)) - 1].slice(0, 3)}</span>
                      </span>
                      <span className="text-xs text-slate-500">{weekday(e.entryDate)}</span>
                    </div>
                  </td>
                  <td className="td font-medium">{e.vehicleRegistration}</td>
                  <td className="td text-right tabular-nums">{num(e.income)}</td>
                  <td className="td text-right tabular-nums" title={e.expenses.map((x) => `${x.categoryName}: ${num(x.amount)}`).join('\n')}>
                    {num(e.totalExpenses)}
                  </td>
                  <td className={`td text-right font-semibold tabular-nums ${netClass(e.net)}`}>{num(e.net)}</td>
                  <td className="td text-right tabular-nums">{num(e.parcels)}</td>
                  <td className="td text-slate-500">{e.recordedByName ?? '—'}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="td" colSpan={2}>
                  Total ({entries.length})
                </td>
                <td className="td text-right tabular-nums">{num(tot('income'))}</td>
                <td className="td text-right tabular-nums">{num(tot('totalExpenses'))}</td>
                <td className={`td text-right tabular-nums ${netClass(tot('net'))}`}>{num(tot('net'))}</td>
                <td className="td text-right tabular-nums">{num(tot('parcels'))}</td>
                <td className="td" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
