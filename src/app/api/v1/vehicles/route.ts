import { body, route } from '@/lib/api';
import { allowedVehicleIds, requireTenant } from '@/lib/auth.server';
import { getVehicle, listVehicles } from '@/lib/data/vehicles.server';
import { sql } from '@/lib/db';
import { vehicleSchema } from '@/lib/schemas';

export const GET = route(async () => {
  const ctx = await requireTenant();
  return listVehicles(ctx.orgId, await allowedVehicleIds(ctx));
});

export const POST = route(async (req) => {
  const ctx = await requireTenant(['owner', 'manager']);
  const v = await body(req, vehicleSchema);
  const [row] = await sql<{ id: string }[]>`
    insert into vehicles (organization_id, registration, nickname, make_model, capacity, sacco, route, status, notes)
    values (${ctx.orgId}, ${v.registration}, ${v.nickname}, ${v.makeModel}, ${v.capacity ?? null}, ${v.sacco}, ${v.route}, ${v.status}, ${v.notes})
    returning id`;
  return getVehicle(ctx.orgId, row.id);
});
