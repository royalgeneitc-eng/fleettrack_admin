import { body, route } from '@/lib/api';
import { hashPassword, requireTenant } from '@/lib/auth.server';
import { setUserVehicles } from '@/lib/data/users.server';
import { sql } from '@/lib/db';
import { badRequest, notFound } from '@/lib/errors';
import { userSchema } from '@/lib/schemas';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route<Ctx>(async (req, { params }) => {
  const ctx = await requireTenant(['owner']);
  const { id } = await params;
  const u = await body(req, userSchema);
  if (id === ctx.user.id && (u.role !== 'owner' || !u.active)) throw badRequest('You cannot demote or deactivate yourself');
  const hash = u.password ? await hashPassword(u.password) : null;
  await sql.begin(async (tx) => {
    const r = await tx`
      update users set full_name = ${u.fullName}, email = ${u.email}, phone = ${u.phone}, role = ${u.role}, active = ${u.active},
             password_hash = coalesce(${hash}, password_hash), updated_at = now()
      where id = ${id} and organization_id = ${ctx.orgId}`;
    if (!r.count) throw notFound('User not found');
    await setUserVehicles(tx, ctx.orgId, id, u.vehicleIds);
  });
  return { ok: true };
});
