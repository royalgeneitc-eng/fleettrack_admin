import { body, query, route } from '@/lib/api';
import { allowedVehicleIds, assertVehicleAccess, canManage, requireTenant } from '@/lib/auth.server';
import { getEntry, listEntries, saveEntry } from '@/lib/data/entries.server';
import { sql } from '@/lib/db';
import { isValidDate } from '@/lib/dates';
import { forbidden } from '@/lib/errors';
import { entrySchema } from '@/lib/schemas';

export const GET = route(async (req) => {
  const ctx = await requireTenant();
  const q = query(req);
  const from = q.get('from');
  const to = q.get('to');
  return listEntries(ctx.orgId, {
    from: from && isValidDate(from) ? from : undefined,
    to: to && isValidDate(to) ? to : undefined,
    vehicleId: q.get('vehicleId') || undefined,
    allowed: await allowedVehicleIds(ctx),
    limit: Math.min(Number(q.get('limit')) || 500, 2000),
  });
});

// Create, or update when `id` is an existing entry (idempotent retries from the app).
export const POST = route(async (req) => {
  const ctx = await requireTenant();
  const input = await body(req, entrySchema);
  await assertVehicleAccess(ctx, input.vehicleId);
  if (input.id && !canManage(ctx.user.role)) {
    const [existing] = await sql<{ recorded_by: string | null }[]>`select recorded_by from daily_entries where id = ${input.id}`;
    if (existing && existing.recorded_by !== ctx.user.id) throw forbidden('You can only edit entries you recorded');
  }
  const id = await saveEntry(ctx.orgId, ctx.user.id, input);
  return getEntry(ctx.orgId, id, null);
});
