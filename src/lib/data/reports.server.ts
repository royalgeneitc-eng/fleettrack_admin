import 'server-only';
import { sql } from '../db';
import { fullMonthsIn } from '../dates';
import { type Report, computeReport, type ReportExpenseLine, type ReportFixedLine } from '../reports';
import type { CategoryTag } from '../types';

export interface ReportScope {
  orgId: string;
  from: string;
  to: string;
  vehicleId?: string;
  allowed: string[] | null; // recorder scope
}

export async function loadReport(s: ReportScope): Promise<Report> {
  let vehicleIds: string[] | null = s.allowed;
  if (s.vehicleId) vehicleIds = s.allowed && !s.allowed.includes(s.vehicleId) ? [] : [s.vehicleId];
  const filter = vehicleIds ? sql`and v.id = any(${vehicleIds}::uuid[])` : sql``;

  const vehicles = await sql<{ id: string; registration: string }[]>`
    select v.id, v.registration from vehicles v where v.organization_id = ${s.orgId} ${filter}`;

  const entries = await sql<{ id: string; vehicleId: string; date: string; income: number; parcels: number }[]>`
    select e.id, e.vehicle_id as "vehicleId", to_char(e.entry_date, 'YYYY-MM-DD') as date, e.income, e.parcels
    from daily_entries e join vehicles v on v.id = e.vehicle_id
    where e.organization_id = ${s.orgId} and e.deleted_at is null and e.entry_date between ${s.from} and ${s.to} ${filter}`;

  const expenseLines = await sql<ReportExpenseLine[]>`
    select x.entry_id as "entryId", c.id as "categoryId", c.name as "categoryName", c.tag, c.sort_order as "sortOrder", x.amount
    from daily_entry_expenses x
    join daily_entries e on e.id = x.entry_id
    join vehicles v on v.id = e.vehicle_id
    join expense_categories c on c.id = x.category_id
    where e.organization_id = ${s.orgId} and e.deleted_at is null and e.entry_date between ${s.from} and ${s.to} ${filter}`;

  // Fixed (monthly) costs only count for months fully inside the range.
  // Fleet-wide fixed costs (vehicle_id null) only apply to unfiltered,
  // whole-fleet reports.
  const months = fullMonthsIn(s.from, s.to);
  const fleetWide = !vehicleIds;
  const fixedLines = months.length
    ? await sql<(ReportFixedLine & { tag: CategoryTag })[]>`
        select f.vehicle_id as "vehicleId", c.id as "categoryId", c.name as "categoryName", c.tag, c.sort_order as "sortOrder", f.amount
        from fixed_expenses f join expense_categories c on c.id = f.category_id
        where f.organization_id = ${s.orgId} and f.deleted_at is null
          and f.month = any(${months}::date[])
          and ${vehicleIds ? sql`f.vehicle_id = any(${vehicleIds}::uuid[])` : fleetWide ? sql`true` : sql`false`}`
    : [];

  return computeReport({ from: s.from, to: s.to, vehicles, entries, expenseLines, fixedLines });
}
