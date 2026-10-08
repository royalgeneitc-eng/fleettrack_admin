import 'server-only';
import { sql } from '../db';
import { badRequest } from '../errors';
import type { FixedExpense } from '../types';

type Row = {
  id: string; vehicle_id: string | null; registration: string | null; category_id: string; category_name: string;
  month: string; amount: number; description: string | null;
};

export async function listFixedExpenses(orgId: string, from?: string, to?: string): Promise<FixedExpense[]> {
  const rows = await sql<Row[]>`
    select f.id, f.vehicle_id, v.registration, f.category_id, c.name as category_name,
           to_char(f.month, 'YYYY-MM-DD') as month, f.amount, f.description
    from fixed_expenses f
    join expense_categories c on c.id = f.category_id
    left join vehicles v on v.id = f.vehicle_id
    where f.organization_id = ${orgId} and f.deleted_at is null
      ${from ? sql`and f.month >= ${from}` : sql``}
      ${to ? sql`and f.month <= ${to}` : sql``}
    order by f.month desc, c.sort_order`;
  return rows.map((r) => ({
    id: r.id,
    vehicleId: r.vehicle_id,
    vehicleRegistration: r.registration,
    categoryId: r.category_id,
    categoryName: r.category_name,
    month: r.month,
    amount: r.amount,
    description: r.description,
  }));
}

export async function validateRefs(orgId: string, categoryId: string, vehicleId: string | null) {
  const [c] = await sql`select 1 from expense_categories where id = ${categoryId} and organization_id = ${orgId} and kind = 'fixed'`;
  if (!c) throw badRequest('Pick a monthly (fixed) expense category');
  if (vehicleId) {
    const [v] = await sql`select 1 from vehicles where id = ${vehicleId} and organization_id = ${orgId} and deleted_at is null`;
    if (!v) throw badRequest('Unknown vehicle');
  }
}
