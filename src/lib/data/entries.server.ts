import 'server-only';
import { sql } from '../db';
import { conflict, notFound } from '../errors';
import type { DailyEntry } from '../types';

type Row = {
  id: string; vehicle_id: string; registration: string; entry_date: string; income: number; parcels: number;
  notes: string | null; recorded_by: string | null; recorded_by_name: string | null; updated_at: Date;
  expenses: { categoryId: string; categoryName: string; amount: number; sortOrder: number }[] | null;
};

const map = (r: Row): DailyEntry => {
  const expenses = (r.expenses ?? [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((e) => ({ categoryId: e.categoryId, categoryName: e.categoryName, amount: Number(e.amount) }));
  const total = expenses.reduce((a, e) => a + e.amount, 0);
  return {
    id: r.id,
    vehicleId: r.vehicle_id,
    vehicleRegistration: r.registration,
    entryDate: r.entry_date,
    income: r.income,
    parcels: r.parcels,
    notes: r.notes,
    expenses,
    totalExpenses: Math.round(total * 100) / 100,
    net: Math.round((r.income - total) * 100) / 100,
    recordedBy: r.recorded_by,
    recordedByName: r.recorded_by_name,
    updatedAt: r.updated_at.toISOString(),
  };
};

export interface EntryFilter {
  from?: string;
  to?: string;
  vehicleId?: string;
  allowed: string[] | null;
  id?: string;
  limit?: number;
}

export async function listEntries(orgId: string, f: EntryFilter): Promise<DailyEntry[]> {
  if (f.allowed && f.allowed.length === 0) return [];
  const rows = await sql<Row[]>`
    select e.id, e.vehicle_id, v.registration, to_char(e.entry_date, 'YYYY-MM-DD') as entry_date, e.income, e.parcels,
           e.notes, e.recorded_by, u.full_name as recorded_by_name, e.updated_at,
           (select json_agg(json_build_object('categoryId', c.id, 'categoryName', c.name, 'amount', x.amount, 'sortOrder', c.sort_order))
              from daily_entry_expenses x join expense_categories c on c.id = x.category_id
             where x.entry_id = e.id) as expenses
    from daily_entries e
    join vehicles v on v.id = e.vehicle_id
    left join users u on u.id = e.recorded_by
    where e.organization_id = ${orgId} and e.deleted_at is null
      ${f.id ? sql`and e.id = ${f.id}` : sql``}
      ${f.from ? sql`and e.entry_date >= ${f.from}` : sql``}
      ${f.to ? sql`and e.entry_date <= ${f.to}` : sql``}
      ${f.vehicleId ? sql`and e.vehicle_id = ${f.vehicleId}` : sql``}
      ${f.allowed ? sql`and e.vehicle_id = any(${f.allowed}::uuid[])` : sql``}
    order by e.entry_date desc, v.registration
    limit ${f.limit ?? 1000}`;
  return rows.map(map);
}

export async function getEntry(orgId: string, id: string, allowed: string[] | null) {
  const [e] = await listEntries(orgId, { id, allowed });
  return e ?? null;
}

export interface EntryInput {
  id?: string;
  vehicleId: string;
  entryDate: string;
  income: number;
  parcels: number;
  notes?: string | null;
  expenses: { categoryId: string; amount: number }[];
}

/**
 * Create-or-update by id (idempotent for offline clients that retry).
 * One entry per vehicle per day: a second entry for the same day is a 409.
 */
export async function saveEntry(orgId: string, userId: string, input: EntryInput): Promise<string> {
  return sql.begin(async (tx) => {
    // Only this org's active daily categories may be used.
    const catIds = [...new Set(input.expenses.map((e) => e.categoryId))];
    if (catIds.length) {
      const ok = await tx`select id from expense_categories where organization_id = ${orgId} and kind = 'daily' and id = any(${catIds}::uuid[])`;
      if (ok.length !== catIds.length) throw conflict('One or more expense categories are not valid daily categories');
    }

    const [clash] = await tx<{ id: string }[]>`
      select id from daily_entries
      where vehicle_id = ${input.vehicleId} and entry_date = ${input.entryDate} and deleted_at is null
        ${input.id ? tx`and id <> ${input.id}` : tx``}`;
    if (clash) throw conflict('An entry for this vehicle on this date already exists — edit that one instead');

    let id = input.id;
    const existing = input.id
      ? await tx<{ organization_id: string; deleted_at: Date | null }[]>`select organization_id, deleted_at from daily_entries where id = ${input.id}`
      : [];
    if (id && existing.length) {
      if (existing[0].organization_id !== orgId) throw notFound('Entry not found');
      if (existing[0].deleted_at) throw conflict('This entry was deleted by a manager');
      await tx`
        update daily_entries set vehicle_id = ${input.vehicleId}, entry_date = ${input.entryDate}, income = ${input.income},
               parcels = ${input.parcels}, notes = ${input.notes ?? null}, updated_at = now()
        where id = ${id}`;
      await tx`delete from daily_entry_expenses where entry_id = ${id}`;
    } else {
      const [row] = await tx<{ id: string }[]>`
        insert into daily_entries (id, organization_id, vehicle_id, entry_date, income, parcels, notes, recorded_by)
        values (${id ?? crypto.randomUUID()}, ${orgId}, ${input.vehicleId}, ${input.entryDate}, ${input.income},
                ${input.parcels}, ${input.notes ?? null}, ${userId})
        returning id`;
      id = row.id;
    }
    // Merge duplicate category lines, drop zeros.
    const merged = new Map<string, number>();
    for (const e of input.expenses) merged.set(e.categoryId, (merged.get(e.categoryId) ?? 0) + e.amount);
    for (const [categoryId, amount] of merged) {
      if (amount > 0) await tx`insert into daily_entry_expenses (entry_id, category_id, amount) values (${id!}, ${categoryId}, ${amount})`;
    }
    return id!;
  });
}
