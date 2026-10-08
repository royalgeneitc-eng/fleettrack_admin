import { z } from 'zod';
import { body, route } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/auth.server';
import { sql } from '@/lib/db';
import { notFound } from '@/lib/errors';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireSuperAdmin();
  const { id } = await params;
  const { status } = await body(req, z.object({ status: z.enum(['active', 'suspended']) }));
  const r = await sql`update organizations set status = ${status}, updated_at = now() where id = ${id}`;
  if (!r.count) throw notFound('Organization not found');
  return { ok: true };
});
