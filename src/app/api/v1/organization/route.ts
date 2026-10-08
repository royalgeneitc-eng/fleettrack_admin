import { body, route } from '@/lib/api';
import { requireTenant } from '@/lib/auth.server';
import { sql } from '@/lib/db';
import { orgSchema } from '@/lib/schemas';

export const GET = route(async () => (await requireTenant()).organization);

export const PUT = route(async (req) => {
  const ctx = await requireTenant(['owner']);
  const o = await body(req, orgSchema);
  await sql`update organizations set name = ${o.name}, currency = ${o.currency}, phone = ${o.phone}, email = ${o.email},
              logo_url = ${o.logoUrl}, tagline = ${o.tagline}, updated_at = now()
            where id = ${ctx.orgId}`;
  return { ok: true };
});
