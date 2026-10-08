'use client';

import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { currentMonth, useVehicles } from '@/components/filters';
import { useCurrency } from '@/components/session-context';
import { Empty, Field, IconBadge, Loading, Modal, PageHeader } from '@/components/ui';
import { categoryVisual } from '@/lib/category-icons';
import { api, errMsg } from '@/lib/client';
import { num } from '@/lib/format';
import type { ExpenseCategory, FixedExpense } from '@/lib/types';

type Form = { id?: string; vehicleId: string; categoryId: string; month: string; amount: string; description: string };

export default function FixedExpensesPage() {
  const cur = useCurrency();
  const vehicles = useVehicles();
  const [month, setMonth] = useState(currentMonth());
  const [items, setItems] = useState<FixedExpense[] | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [form, setForm] = useState<Form | null>(null);

  const load = useCallback(() => {
    setItems(null);
    api<FixedExpense[]>(`/fixed-expenses?month=${month}`).then(setItems);
  }, [month]);
  useEffect(load, [load]);
  useEffect(() => {
    api<ExpenseCategory[]>('/categories').then((c) => setCategories(c.filter((x) => x.kind === 'fixed')));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const body = { vehicleId: form.vehicleId || null, categoryId: form.categoryId, month: form.month, amount: Number(form.amount), description: form.description || null };
    try {
      if (form.id) await api(`/fixed-expenses/${form.id}`, { method: 'PUT', body });
      else await api('/fixed-expenses', { method: 'POST', body });
      toast.success('Saved');
      setForm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this expense?')) return;
    await api(`/fixed-expenses/${id}`, { method: 'DELETE' });
    setForm(null);
    load();
  }

  const total = (items ?? []).reduce((a, i) => a + i.amount, 0);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => form && setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <PageHeader
        title="Monthly expenses"
        subtitle="Recurring costs recorded once a month — insurance, service, wages to other employees, tithe…"
        actions={
          <>
            <input type="month" className="input w-auto" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
            <button type="button" className="btn-primary" onClick={() => setForm({ vehicleId: '', categoryId: categories[0]?.id ?? '', month, amount: '', description: '' })}>
              <Plus size={16} /> Add expense
            </button>
          </>
        }
      />
      {!items ? (
        <Loading />
      ) : !items.length ? (
        <Empty>No monthly expenses recorded for this month.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="th">Category</th>
                <th className="th">Vehicle</th>
                <th className="th">Description</th>
                <th className="th text-right">Amount ({cur})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr
                  key={i.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setForm({ id: i.id, vehicleId: i.vehicleId ?? '', categoryId: i.categoryId, month: i.month.slice(0, 7), amount: String(i.amount), description: i.description ?? '' })}
                >
                  <td className="td font-medium">
                    <span className="flex items-center gap-2.5">
                      <IconBadge icon={categoryVisual(i.categoryName).icon} color={categoryVisual(i.categoryName).color} size={30} />
                      {i.categoryName}
                    </span>
                  </td>
                  <td className="td">{i.vehicleRegistration ?? <span className="text-slate-400">Whole fleet</span>}</td>
                  <td className="td text-slate-500">{i.description}</td>
                  <td className="td text-right tabular-nums">{num(i.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td className="td" colSpan={3}>
                  Total
                </td>
                <td className="td text-right tabular-nums">{num(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {form && (
        <Modal title={form.id ? 'Edit monthly expense' : 'Add monthly expense'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Category">
              <select className="input" required value={form.categoryId} onChange={set('categoryId')}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle">
              <select className="input" value={form.vehicleId} onChange={set('vehicleId')}>
                <option value="">Whole fleet (shared cost)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Month">
                <input type="month" className="input" required value={form.month} onChange={set('month')} />
              </Field>
              <Field label={`Amount (${cur})`}>
                <input type="number" min={0} step="any" className="input" required value={form.amount} onChange={set('amount')} />
              </Field>
            </div>
            <Field label="Description">
              <input className="input" value={form.description} onChange={set('description')} />
            </Field>
            <div className="flex justify-between">
              {form.id ? (
                <button type="button" className="btn-ghost text-red-600" onClick={() => remove(form.id!)}>
                  Delete
                </button>
              ) : (
                <span />
              )}
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
