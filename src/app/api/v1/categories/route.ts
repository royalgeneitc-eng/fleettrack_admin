import { body, query, route } from '@/lib/api';
import { requireTenant } from '@/lib/auth.server';
import { listCategories } from '@/lib/data/categories.server';
import { sql } from '@/lib/db';
import { categorySchema } from '@/lib/schemas';

export const GET = route(async (req) => {
  const ctx = await requireTenant();
  return listCategories(ctx.orgId, query(req).get('all') === '1');
});

export const POST = route(async (req) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const c = await body(req, categorySchema);
  const [row] = await sql<{ id: string }[]>`
    insert into expense_categories (organization_id, name, kind, tag, sort_order, active)
    values (${ctx.orgId}, ${c.name}, ${c.kind}, ${c.tag}, ${c.sortOrder}, ${c.active}) returning id`;
  return { id: row.id };
});
