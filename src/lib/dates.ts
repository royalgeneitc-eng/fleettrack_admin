import { ordinal } from './format';

// All dates are calendar dates handled as 'YYYY-MM-DD' strings / UTC Date
// objects, so server timezone never shifts a day.

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmtDate(d);
}

export function isValidDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fmtDate(parseDate(s)) === s;
}

export function monthStart(s: string) {
  return `${s.slice(0, 7)}-01`;
}

export function monthEnd(s: string) {
  const d = parseDate(monthStart(s));
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return fmtDate(d);
}

export function weekday(s: string) {
  return WEEKDAYS[parseDate(s).getUTCDay()];
}

export function monthName(s: string) {
  return MONTHS[parseDate(s).getUTCMonth()];
}

/** Monday on or before the date. */
export function mondayOf(s: string) {
  const dow = parseDate(s).getUTCDay(); // 0 = Sunday
  return addDays(s, dow === 0 ? -6 : 1 - dow);
}

export interface WeekBucket {
  index: number; // 1-based within the month (or within the range)
  start: string;
  end: string;
  label: string; // "1st – 6th Jul"
}

/**
 * Monday-start weeks covering [from, to], each clipped to the range. Week 1
 * is whatever partial week the range starts with — this matches how the
 * monthly closing reports number weeks (e.g. Sept 2026: wk1 1st–6th,
 * wk4 21st–27th).
 */
export function weekBuckets(from: string, to: string): WeekBucket[] {
  const out: WeekBucket[] = [];
  let start = from;
  let i = 1;
  while (start <= to) {
    const sunday = addDays(mondayOf(start), 6);
    const end = sunday < to ? sunday : to;
    out.push({ index: i++, start, end, label: rangeLabel(start, end) });
    start = addDays(end, 1);
  }
  return out;
}

/** The month-week (as numbered by weekBuckets over the month) containing a date. */
export function monthWeekOf(s: string): WeekBucket {
  return weekBuckets(monthStart(s), monthEnd(s)).find((w) => s >= w.start && s <= w.end)!;
}

export function rangeLabel(start: string, end: string) {
  const a = parseDate(start);
  const b = parseDate(end);
  const mon = (d: Date) => MONTHS[d.getUTCMonth()].slice(0, 3);
  if (start === end) return `${ordinal(a.getUTCDate())} ${mon(a)}`;
  if (a.getUTCMonth() === b.getUTCMonth()) return `${ordinal(a.getUTCDate())} – ${ordinal(b.getUTCDate())} ${mon(b)}`;
  return `${ordinal(a.getUTCDate())} ${mon(a)} – ${ordinal(b.getUTCDate())} ${mon(b)}`;
}

export function shortDate(s: string) {
  const d = parseDate(s);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

/** Months (YYYY-MM-01) that lie entirely inside [from, to]. */
export function fullMonthsIn(from: string, to: string): string[] {
  const out: string[] = [];
  let m = monthStart(from);
  while (m <= to) {
    if (m >= from && monthEnd(m) <= to) out.push(m);
    const d = parseDate(m);
    d.setUTCMonth(d.getUTCMonth() + 1);
    m = fmtDate(d);
  }
  return out;
}
