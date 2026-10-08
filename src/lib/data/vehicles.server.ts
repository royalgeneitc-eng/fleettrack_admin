import 'server-only';
import { sql } from '../db';
import type { Vehicle } from '../types';

type Row = {
  id: string; registration: string; nickname: string | null; make_model: string | null; capacity: number | null;
  sacco: string | null; route: string | null; status: 'active' | 'inactive'; notes: string | null;
};

export const mapVehicle = (r: Row): Vehicle => ({
  id: r.id,
  registration: r.registration,
  nickname: r.nickname,
  makeModel: r.make_model,
  capacity: r.capacity,
  sacco: r.sacco,
  route: r.route,
  status: r.status,
  notes: r.notes,
});

/** allowed = null means every vehicle in the org. */
export async function listVehicles(orgId: string, allowed: string[] | null): Promise<Vehicle[]> {
  if (allowed && allowed.length === 0) return [];
  const rows = await sql<Row[]>`
    select id, registration, nickname, make_model, capacity, sacco, route, status, notes from vehicles
    where organization_id = ${orgId} and deleted_at is null
      ${allowed ? sql`and id = any(${allowed}::uuid[])` : sql``}
    order by status, registration`;
  return rows.map(mapVehicle);
}

export async function getVehicle(orgId: string, id: string): Promise<Vehicle | null> {
  const [r] = await sql<Row[]>`
    select id, registration, nickname, make_model, capacity, sacco, route, status, notes from vehicles
    where organization_id = ${orgId} and id = ${id} and deleted_at is null`;
  return r ? mapVehicle(r) : null;
}

export const vehicleLabel = (v: Pick<Vehicle, 'registration' | 'nickname'>) => v.nickname || v.registration;
