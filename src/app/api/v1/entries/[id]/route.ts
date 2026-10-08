import { body, route } from '@/lib/api';
import { allowedVehicleIds, assertVehicleAccess, canManage, requireTenant } from '@/lib/auth.server';
import { getEntry, saveEntry } from '@/lib/data/entries.server';
import { sql } from '@/lib/db';
import { forbidden, notFound } from '@/lib/errors';
import { entrySchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const ctx = await requireTenant();
  const { id } = await params;
  const e = await getEntry(ctx.orgId, id, await allowedVehicleIds(ctx));
  if (!e) throw notFound('Entry not found');
  return e;
});

export const PUT = route<Ctx>(async (req, { params }) => {
  const ctx = await requireTenant();
  const { id } = await params;
  const existing = await getEntry(ctx.orgId, id, await allowedVehicleIds(ctx));
  if (!existing) throw notFound('Entry not found');
  if (!canManage(ctx.user.role) && existing.recordedBy !== ctx.user.id) throw forbidden('You can only edit entries you recorded');
  const input = await body(req, entrySchema);
  await assertVehicleAccess(ctx, input.vehicleId);
  await saveEntry(ctx.orgId, ctx.user.id, { ...input, id });
  return getEntry(ctx.orgId, id, null);
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const { id } = await params;
  const r = await sql`update daily_entries set deleted_at = now(), updated_at = now() where id = ${id} and organization_id = ${ctx.orgId} and deleted_at is null`;
  if (!r.count) throw notFound('Entry not found');
  return { ok: true };
});
