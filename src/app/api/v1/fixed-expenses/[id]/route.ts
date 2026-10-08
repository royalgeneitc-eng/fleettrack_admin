import { body, route } from '@/lib/api';
import { requireTenant } from '@/lib/auth.server';
import { validateRefs } from '@/lib/data/fixed.server';
import { sql } from '@/lib/db';
import { notFound } from '@/lib/errors';
import { fixedExpenseSchema } from '@/lib/schemas';


type Ctx = { params: Promise<{ id: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const { id } = await params;
  const f = await body(req, fixedExpenseSchema);
  await validateRefs(ctx.orgId, f.categoryId, f.vehicleId);
  const r = await sql`
    update fixed_expenses set vehicle_id = ${f.vehicleId}, category_id = ${f.categoryId}, month = ${f.month},
           amount = ${f.amount}, description = ${f.description}
    where id = ${id} and organization_id = ${ctx.orgId} and deleted_at is null`;
  if (!r.count) throw notFound('Expense not found');
  return { ok: true };
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const { id } = await params;
  const r = await sql`update fixed_expenses set deleted_at = now() where id = ${id} and organization_id = ${ctx.orgId} and deleted_at is null`;
  if (!r.count) throw notFound('Expense not found');
  return { ok: true };
});
