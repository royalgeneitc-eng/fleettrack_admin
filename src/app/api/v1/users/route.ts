import { body, route } from '@/lib/api';
import { hashPassword, requireTenant } from '@/lib/auth.server';
import { listUsers, setUserVehicles } from '@/lib/data/users.server';
import { sql } from '@/lib/db';
import { badRequest, conflict } from '@/lib/errors';
import { userSchema } from '@/lib/schemas';

export const GET = route(async () => {
  const ctx = await requireTenant(['owner', 'manager']);
  return listUsers(ctx.orgId);
});

// Owners add team members (managers, drivers/conductors/clerks) with an
// initial password they pass on; there is no email invite flow yet.
export const POST = route(async (req) => {
  const ctx = await requireTenant(['owner']);
  const u = await body(req, userSchema);
  if (!u.password) throw badRequest('Set an initial password (8+ characters)');
  const [taken] = await sql`select 1 from users where lower(email) = ${u.email}`;
  if (taken) throw conflict('An account with that email already exists');
  const hash = await hashPassword(u.password);
  const id = await sql.begin(async (tx) => {
    const [row] = await tx<{ id: string }[]>`
      insert into users (organization_id, email, password_hash, full_name, phone, role, active)
      values (${ctx.orgId}, ${u.email}, ${hash}, ${u.fullName}, ${u.phone}, ${u.role}, ${u.active}) returning id`;
    await setUserVehicles(tx, ctx.orgId, row.id, u.vehicleIds);
    return row.id;
  });
  return { id };
});
