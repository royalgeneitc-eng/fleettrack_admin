import { body, route } from '@/lib/api';
import { checkPassword, loadUser } from '@/lib/auth.server';
import { sessionResponse } from '@/lib/auth-response.server';
import { sql } from '@/lib/db';
import { forbidden, unauthorized } from '@/lib/errors';
import { loginSchema } from '@/lib/schemas';

export const POST = route(async (req) => {
  const { email, password } = await body(req, loginSchema);
  const [row] = await sql<{ id: string; password_hash: string; active: boolean }[]>`
    select id, password_hash, active from users where lower(email) = ${email}`;
  // Same message for unknown email and wrong password.
  if (!row || !(await checkPassword(password, row.password_hash))) throw unauthorized('Incorrect email or password');
  if (!row.active) throw forbidden('This account has been deactivated');
  const user = (await loadUser(row.id))!;
  if (!user.isSuperAdmin && user.organization?.status !== 'active') throw forbidden('This workspace is suspended. Contact support.');
  await sql`update users set last_login_at = now() where id = ${row.id}`;
  const { active: _a, ...sessionUser } = user;
  return sessionResponse(sessionUser);
});
