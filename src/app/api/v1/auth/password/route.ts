import { body, route } from '@/lib/api';
import { checkPassword, hashPassword, requireUser } from '@/lib/auth.server';
import { sql } from '@/lib/db';
import { badRequest } from '@/lib/errors';
import { passwordSchema } from '@/lib/schemas';

export const PUT = route(async (req) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = await body(req, passwordSchema);
  const [row] = await sql<{ password_hash: string }[]>`select password_hash from users where id = ${user.id}`;
  if (!(await checkPassword(currentPassword, row.password_hash))) throw badRequest('Current password is incorrect');
  await sql`update users set password_hash = ${await hashPassword(newPassword)}, updated_at = now() where id = ${user.id}`;
  return { ok: true };
});
