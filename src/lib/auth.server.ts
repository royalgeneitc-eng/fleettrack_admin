import 'server-only';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { sql } from './db';
import { forbidden, unauthorized } from './errors';
import { SESSION_COOKIE, verifySession } from './session';
import type { Organization, Role, SessionUser } from './types';

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const checkPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_super_admin: boolean;
  active: boolean;
  organization_id: string | null;
  org_name: string | null;
  org_slug: string | null;
  org_currency: string | null;
  org_status: 'active' | 'suspended' | null;
  org_phone: string | null;
  org_email: string | null;
  org_logo_url: string | null;
  org_tagline: string | null;
};

export async function loadUser(userId: string): Promise<(SessionUser & { active: boolean }) | null> {
  const [row] = await sql<UserRow[]>`
    select u.id, u.email, u.full_name, u.phone, u.role, u.is_super_admin, u.active, u.organization_id,
           o.name as org_name, o.slug as org_slug, o.currency as org_currency, o.status as org_status,
           o.phone as org_phone, o.email as org_email, o.logo_url as org_logo_url, o.tagline as org_tagline
    from users u left join organizations o on o.id = u.organization_id
    where u.id = ${userId}`;
  if (!row) return null;
  const organization: Organization | null = row.organization_id
    ? {
        id: row.organization_id,
        name: row.org_name!,
        slug: row.org_slug!,
        currency: row.org_currency!,
        status: row.org_status!,
        phone: row.org_phone,
        email: row.org_email,
        logoUrl: row.org_logo_url,
        tagline: row.org_tagline,
      }
    : null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    isSuperAdmin: row.is_super_admin,
    organizationId: row.organization_id,
    organization,
    active: row.active,
  };
}

/** Token from `Authorization: Bearer` (Android) or the session cookie (web). */
async function readToken(): Promise<string | null> {
  const h = await headers();
  const auth = h.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const c = await cookies();
  return c.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readToken();
  if (!token) return null;
  const userId = await verifySession(token);
  if (!userId) return null;
  const user = await loadUser(userId);
  if (!user || !user.active) return null;
  const { active: _active, ...rest } = user;
  return rest;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

export interface TenantContext {
  user: SessionUser;
  orgId: string;
  organization: Organization;
}

/**
 * A signed-in member of an active workspace. Platform super admins without a
 * workspace are rejected — they manage tenants, not tenant data.
 */
export async function requireTenant(roles?: Role[]): Promise<TenantContext> {
  const user = await requireUser();
  if (!user.organizationId || !user.organization) throw forbidden('This account is not part of a fleet workspace');
  if (user.organization.status !== 'active') throw forbidden('This workspace is suspended. Contact support.');
  if (roles && !roles.includes(user.role)) throw forbidden();
  return { user, orgId: user.organizationId, organization: user.organization };
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isSuperAdmin) throw forbidden();
  return user;
}

export const canManage = (role: Role) => role === 'owner' || role === 'manager';

/**
 * Vehicle ids a recorder may touch, or null for "all vehicles in the org"
 * (owners and managers).
 */
export async function allowedVehicleIds(ctx: TenantContext): Promise<string[] | null> {
  if (canManage(ctx.user.role)) return null;
  const rows = await sql<{ vehicle_id: string }[]>`
    select uv.vehicle_id from user_vehicles uv
    join vehicles v on v.id = uv.vehicle_id
    where uv.user_id = ${ctx.user.id} and v.organization_id = ${ctx.orgId} and v.deleted_at is null`;
  return rows.map((r) => r.vehicle_id);
}

export async function assertVehicleAccess(ctx: TenantContext, vehicleId: string) {
  const [v] = await sql`select id from vehicles where id = ${vehicleId} and organization_id = ${ctx.orgId} and deleted_at is null`;
  if (!v) throw forbidden('Unknown vehicle');
  const allowed = await allowedVehicleIds(ctx);
  if (allowed && !allowed.includes(vehicleId)) throw forbidden('You are not assigned to this vehicle');
}
