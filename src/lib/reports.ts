import { type WeekBucket, addDays, weekBuckets } from './dates';
import type { CategoryTag } from './types';

// Pure report maths — no DB. reports.server.ts feeds it rows.
//
// Definitions (matching the owner's monthly closing reports):
//   income            = daily collections (fares). Parcels are tracked
//                       separately and are NOT part of income/net — they are
//                       deposited to a separate account.
//   dailyExpenses     = sum of expense lines on daily entries
//   operatingNet      = income − dailyExpenses          ("Operating KCX")
//   fixedExpenses     = monthly fixed costs (insurance, service, wages…)
//                       for calendar months fully inside the range
//   netIncome         = operatingNet − fixedExpenses    ("Net business income")

export interface ReportEntry {
  id: string;
  vehicleId: string;
  date: string;
  income: number;
  parcels: number;
}

export interface ReportExpenseLine {
  entryId: string;
  categoryId: string;
  categoryName: string;
  tag: CategoryTag;
  sortOrder: number;
  amount: number;
}

export interface ReportFixedLine {
  vehicleId: string | null;
  categoryId: string;
  categoryName: string;
  tag: CategoryTag;
  sortOrder: number;
  amount: number;
}

export interface ReportInput {
  from: string;
  to: string;
  vehicles: { id: string; registration: string }[];
  entries: ReportEntry[];
  expenseLines: ReportExpenseLine[];
  fixedLines: ReportFixedLine[];
}

export interface Totals {
  income: number;
  parcels: number;
  dailyExpenses: number;
  operatingNet: number;
  fixedExpenses: number;
  netIncome: number;
  driverPayments: number;
  wages: number;
  tithe: number;
  entryCount: number;
}

export interface CategoryAmount {
  categoryId: string;
  name: string;
  tag: CategoryTag;
  amount: number;
  /** Position in the workspace's category list — lets charts keep a stable colour per category. */
  sortOrder: number;
}

export interface Report {
  from: string;
  to: string;
  totals: Totals;
  weeks: (WeekBucket & { income: number; parcels: number; dailyExpenses: number; operatingNet: number; driverPayments: number })[];
  days: { date: string; income: number; parcels: number; dailyExpenses: number; operatingNet: number; entries: number }[];
  dailyByCategory: CategoryAmount[];
  fixedByCategory: CategoryAmount[];
  vehicles: { vehicleId: string; registration: string; income: number; parcels: number; dailyExpenses: number; operatingNet: number; fixedExpenses: number; netIncome: number; entries: number }[];
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round = (n: number) => Math.round(n * 100) / 100;

function byCategory(lines: { categoryId: string; categoryName: string; tag: CategoryTag; sortOrder: number; amount: number }[]): CategoryAmount[] {
  const map = new Map<string, CategoryAmount>();
  for (const l of lines) {
    const cur = map.get(l.categoryId) ?? { categoryId: l.categoryId, name: l.categoryName, tag: l.tag, amount: 0, sortOrder: l.sortOrder };
    cur.amount += l.amount;
    map.set(l.categoryId, cur);
  }
  return [...map.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((c) => ({ ...c, amount: round(c.amount) }));
}

export function computeReport(input: ReportInput): Report {
  const { from, to } = input;
  const entries = input.entries.filter((e) => e.date >= from && e.date <= to);
  const entryIds = new Set(entries.map((e) => e.id));
  const lines = input.expenseLines.filter((l) => entryIds.has(l.entryId));
  const expByEntry = new Map<string, number>();
  const driverByEntry = new Map<string, number>();
  for (const l of lines) {
    expByEntry.set(l.entryId, (expByEntry.get(l.entryId) ?? 0) + l.amount);
    if (l.tag === 'driver') driverByEntry.set(l.entryId, (driverByEntry.get(l.entryId) ?? 0) + l.amount);
  }
  const exp = (id: string) => expByEntry.get(id) ?? 0;

  const income = sum(entries.map((e) => e.income));
  const parcels = sum(entries.map((e) => e.parcels));
  const dailyExpenses = sum(lines.map((l) => l.amount));
  const fixedExpenses = sum(input.fixedLines.map((l) => l.amount));
  const tagged = (tag: CategoryTag) =>
    sum(lines.filter((l) => l.tag === tag).map((l) => l.amount)) + sum(input.fixedLines.filter((l) => l.tag === tag).map((l) => l.amount));

  const totals: Totals = {
    income: round(income),
    parcels: round(parcels),
    dailyExpenses: round(dailyExpenses),
    operatingNet: round(income - dailyExpenses),
    fixedExpenses: round(fixedExpenses),
    netIncome: round(income - dailyExpenses - fixedExpenses),
    driverPayments: round(tagged('driver')),
    wages: round(tagged('wages')),
    tithe: round(tagged('tithe')),
    entryCount: entries.length,
  };

  const weeks = weekBuckets(from, to).map((w) => {
    const es = entries.filter((e) => e.date >= w.start && e.date <= w.end);
    const inc = sum(es.map((e) => e.income));
    const de = sum(es.map((e) => exp(e.id)));
    return {
      ...w,
      income: round(inc),
      parcels: round(sum(es.map((e) => e.parcels))),
      dailyExpenses: round(de),
      operatingNet: round(inc - de),
      driverPayments: round(sum(es.map((e) => driverByEntry.get(e.id) ?? 0))),
    };
  });

  const days: Report['days'] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const es = entries.filter((e) => e.date === d);
    const inc = sum(es.map((e) => e.income));
    const de = sum(es.map((e) => exp(e.id)));
    days.push({ date: d, income: round(inc), parcels: round(sum(es.map((e) => e.parcels))), dailyExpenses: round(de), operatingNet: round(inc - de), entries: es.length });
    if (days.length > 400) break; // guard against absurd ranges
  }

  const vehicles = input.vehicles
    .map((v) => {
      const es = entries.filter((e) => e.vehicleId === v.id);
      const inc = sum(es.map((e) => e.income));
      const de = sum(es.map((e) => exp(e.id)));
      const fx = sum(input.fixedLines.filter((l) => l.vehicleId === v.id).map((l) => l.amount));
      return {
        vehicleId: v.id,
        registration: v.registration,
        income: round(inc),
        parcels: round(sum(es.map((e) => e.parcels))),
        dailyExpenses: round(de),
        operatingNet: round(inc - de),
        fixedExpenses: round(fx),
        netIncome: round(inc - de - fx),
        entries: es.length,
      };
    })
    .filter((v) => v.entries > 0 || v.fixedExpenses > 0)
    .sort((a, b) => b.income - a.income);

  return {
    from,
    to,
    totals,
    weeks,
    days,
    dailyByCategory: byCategory(lines),
    fixedByCategory: byCategory(input.fixedLines),
    vehicles,
  };
}
