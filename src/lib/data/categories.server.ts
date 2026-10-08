import 'server-only';
import type postgres from 'postgres';
import { sql } from '../db';
import type { CategoryKind, CategoryTag, ExpenseCategory } from '../types';

export const DEFAULT_CATEGORIES: { name: string; kind: CategoryKind; tag?: CategoryTag }[] = [
  { name: 'Sacco', kind: 'daily' },
  { name: 'Fuel', kind: 'daily' },
  { name: 'Driver', kind: 'daily', tag: 'driver' },
  { name: 'Gate', kind: 'daily' },
  { name: 'ExpW', kind: 'daily' },
  { name: 'Car wash', kind: 'daily' },
  { name: 'Police', kind: 'daily' },
  { name: 'Stage fees', kind: 'daily' },
  { name: 'Other', kind: 'daily' },
  { name: 'Insurance', kind: 'fixed' },
  { name: 'County seasonal parking', kind: 'fixed' },
  { name: 'Repairs & maintenance', kind: 'fixed' },
  { name: 'Vehicle service', kind: 'fixed' },
  { name: 'Wages - other employees', kind: 'fixed', tag: 'wages' },
  { name: 'Tithe', kind: 'fixed', tag: 'tithe' },
  { name: 'Other recurring', kind: 'fixed' },
];

export async function seedDefaultCategories(tx: postgres.TransactionSql, orgId: string) {
  for (const [i, c] of DEFAULT_CATEGORIES.entries()) {
    await tx`insert into expense_categories (organization_id, name, kind, tag, sort_order)
             values (${orgId}, ${c.name}, ${c.kind}, ${c.tag ?? null}, ${i})`;
  }
}

type Row = { id: string; name: string; kind: CategoryKind; tag: CategoryTag; sort_order: number; active: boolean };
const map = (r: Row): ExpenseCategory => ({ id: r.id, name: r.name, kind: r.kind, tag: r.tag, sortOrder: r.sort_order, active: r.active });

export async function listCategories(orgId: string, includeInactive = false): Promise<ExpenseCategory[]> {
  const rows = await sql<Row[]>`
    select id, name, kind, tag, sort_order, active from expense_categories
    where organization_id = ${orgId} ${includeInactive ? sql`` : sql`and active`}
    order by kind, sort_order, name`;
  return rows.map(map);
}
