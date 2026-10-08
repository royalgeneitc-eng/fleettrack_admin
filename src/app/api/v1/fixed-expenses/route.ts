import { body, query, route } from '@/lib/api';
import { requireTenant } from '@/lib/auth.server';
import { listFixedExpenses, validateRefs } from '@/lib/data/fixed.server';
import { sql } from '@/lib/db';
import { fixedExpenseSchema } from '@/lib/schemas';

export const GET = route(async (req) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const q = query(req);
  const month = q.get('month'); // YYYY-MM
  const m = month && /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : undefined;
  return listFixedExpenses(ctx.orgId, m, m);
});

export const POST = route(async (req) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const f = await body(req, fixedExpenseSchema);
  await validateRefs(ctx.orgId, f.categoryId, f.vehicleId);
  const [row] = await sql<{ id: string }[]>`
    insert into fixed_expenses (organization_id, vehicle_id, category_id, month, amount, description, created_by)
    values (${ctx.orgId}, ${f.vehicleId}, ${f.categoryId}, ${f.month}, ${f.amount}, ${f.description}, ${ctx.user.id})
    returning id`;
  return { id: row.id };
});
