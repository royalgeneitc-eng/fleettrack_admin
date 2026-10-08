import { body, route } from '@/lib/api';
import { hashPassword, loadUser } from '@/lib/auth.server';
import { sessionResponse } from '@/lib/auth-response.server';
import { seedDefaultCategories } from '@/lib/data/categories.server';
import { sql } from '@/lib/db';
import { conflict, forbidden } from '@/lib/errors';
import { signupSchema } from '@/lib/schemas';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'fleet';
}

// Self-service: creates a new fleet workspace with the caller as owner.
export const POST = route(async (req) => {
  if (process.env.ALLOW_SIGNUP === 'false') throw forbidden('Sign-up is currently closed');
  const input = await body(req, signupSchema);
  const [taken] = await sql`select 1 from users where lower(email) = ${input.email}`;
  if (taken) throw conflict('An account with that email already exists');
  const passwordHash = await hashPassword(input.password);

  const userId = await sql.begin(async (tx) => {
    let slug = slugify(input.organizationName);
    const [clash] = await tx`select 1 from organizations where slug = ${slug}`;
    if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const [org] = await tx<{ id: string }[]>`
      insert into organizations (name, slug, phone, email) values (${input.organizationName}, ${slug}, ${input.phone}, ${input.email})
      returning id`;
    await seedDefaultCategories(tx, org.id);
    const [u] = await tx<{ id: string }[]>`
      insert into users (organization_id, email, password_hash, full_name, phone, role)
      values (${org.id}, ${input.email}, ${passwordHash}, ${input.fullName}, ${input.phone}, 'owner')
      returning id`;
    return u.id;
  });

  const user = (await loadUser(userId))!;
  return sessionResponse(user);
});
