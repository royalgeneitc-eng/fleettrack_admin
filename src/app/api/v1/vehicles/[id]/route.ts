import { body, route } from '@/lib/api';
import { assertVehicleAccess, requireTenant } from '@/lib/auth.server';
import { getVehicle } from '@/lib/data/vehicles.server';
import { sql } from '@/lib/db';
import { notFound } from '@/lib/errors';
import { vehicleSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const ctx = await requireTenant();
  const { id } = await params;
  await assertVehicleAccess(ctx, id);
  return getVehicle(ctx.orgId, id);
});

export const PUT = route<Ctx>(async (req, { params }) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const { id } = await params;
  const v = await body(req, vehicleSchema);
  const r = await sql`
    update vehicles set registration = ${v.registration}, nickname = ${v.nickname}, make_model = ${v.makeModel},
           capacity = ${v.capacity ?? null}, sacco = ${v.sacco}, route = ${v.route}, status = ${v.status}, notes = ${v.notes}, updated_at = now()
    where id = ${id} and organization_id = ${ctx.orgId} and deleted_at is null`;
  if (!r.count) throw notFound('Vehicle not found');
  return getVehicle(ctx.orgId, id);
});

// Soft delete: the vehicle's history stays in reports.
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const ctx = await requireTenant(['owner']);
  const { id } = await params;
  const r = await sql`update vehicles set deleted_at = now() where id = ${id} and organization_id = ${ctx.orgId} and deleted_at is null`;
  if (!r.count) throw notFound('Vehicle not found');
  return { ok: true };
});
