import 'server-only';
import type postgres from 'postgres';
import { sql } from '../db';
import type { Role } from '../types';

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  vehicleIds: string[];
}

export async function listUsers(orgId: string): Promise<TeamMember[]> {
  const rows = await sql<{ id: string; full_name: string; email: string; phone: string | null; role: Role; active: boolean; last_login_at: Date | null; vehicle_ids: string[] }[]>`
    select u.id, u.full_name, u.email, u.phone, u.role, u.active, u.last_login_at,
           coalesce(array_agg(uv.vehicle_id) filter (where uv.vehicle_id is not null), '{}') as vehicle_ids
    from users u left join user_vehicles uv on uv.user_id = u.id
    where u.organization_id = ${orgId}
    group by u.id order by u.active desc, u.role, u.full_name`;
  return rows.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    active: r.active,
    lastLoginAt: r.last_login_at?.toISOString() ?? null,
    vehicleIds: r.vehicle_ids,
  }));
}

export async function setUserVehicles(tx: postgres.TransactionSql, orgId: string, userId: string, vehicleIds: string[]) {
  await tx`delete from user_vehicles where user_id = ${userId}`;
  if (!vehicleIds.length) return;
  await tx`
    insert into user_vehicles (user_id, vehicle_id)
    select ${userId}, id from vehicles where organization_id = ${orgId} and id = any(${vehicleIds}::uuid[])`;
}
