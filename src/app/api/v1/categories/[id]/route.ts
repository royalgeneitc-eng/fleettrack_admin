import { body, route } from '@/lib/api';
import { requireTenant } from '@/lib/auth.server';
import { sql } from '@/lib/db';
import { notFound } from '@/lib/errors';
import { categorySchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

// Kind is fixed after creation — switching would orphan recorded amounts.
export const PUT = route<Ctx>(async (req, { params }) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const { id } = await params;
  const c = await body(req, categorySchema);
  const r = await sql`
    update expense_categories set name = ${c.name}, tag = ${c.tag}, sort_order = ${c.sortOrder}, active = ${c.active}
    where id = ${id} and organization_id = ${ctx.orgId}`;
  if (!r.count) throw notFound('Category not found');
  return { ok: true };
});

// Categories with history are deactivated (kept for old reports); unused ones are removed.
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const { id } = await params;
  const [used] = await sql`
    select 1 from daily_entry_expenses where category_id = ${id}
    union all select 1 from fixed_expenses where category_id = ${id} limit 1`;
  const r = used
    ? await sql`update expense_categories set active = false where id = ${id} and organization_id = ${ctx.orgId}`
    : await sql`delete from expense_categories where id = ${id} and organization_id = ${ctx.orgId}`;
  if (!r.count) throw notFound('Category not found');
  return { ok: true, deactivated: Boolean(used) };
});
