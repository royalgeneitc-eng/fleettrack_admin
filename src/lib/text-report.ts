import { monthName, monthWeekOf, shortDate, weekday } from './dates';
import { num, ordinal } from './format';
import type { Report } from './reports';

// Plain-text reports in the format the team already shares on WhatsApp.

const line = (label: string, n: number) => `${label} - ${num(n)}`;
const upper = (s: string) => s.toUpperCase();
const dayOf = (d: string) => ordinal(Number(d.slice(8)));

/** "21st-26th": the week's first day to its last day with an entry. */
function weekSpan(r: Report, sep: string) {
  const recorded = r.days.filter((d) => d.entries > 0);
  const end = recorded.length ? recorded[recorded.length - 1].date : r.to;
  return `${dayOf(r.from)}${sep}${dayOf(end)}`;
}

function expenseBlock(r: Report) {
  return r.dailyByCategory.filter((c) => c.amount > 0).map((c) => line(c.name, c.amount));
}

export function dailyText(label: string, r: Report): string {
  const date = r.from;
  const t = r.totals;
  const wk = monthWeekOf(date);
  return [
    `${upper(ordinal(wk.index))} wk of ${upper(monthName(date))}`,
    `${weekday(date)} ${shortDate(date)} ${label} Report`,
    line('Total collection', t.income),
    line('Parcels', t.parcels),
    line(label, t.operatingNet),
    '',
    ...expenseBlock(r),
    '',
    `Expense = ${num(t.dailyExpenses)}`,
    '',
    `Net = ${num(t.operatingNet)} (${num(t.income)}-${num(t.dailyExpenses)})`,
  ].join('\n');
}

export function weeklyText(label: string, r: Report): string {
  const t = r.totals;
  const wk = monthWeekOf(r.from);
  const days = r.days.filter((d) => d.entries > 0);
  return [
    `${upper(label)} ${upper(monthName(r.from))} REPORT`,
    `${upper(ordinal(wk.index))} WEEK ${weekSpan(r, '-')}`,
    ...days.map((d) => line(weekday(d.date), d.income)),
    '',
    `Total Income = ${num(t.income)}`,
    '',
    line('Parcels', t.parcels),
    '',
    'EXPENSES',
    ...expenseBlock(r),
    `Total Expense = ${num(t.dailyExpenses)}`,
    '',
    `${upper(label)} NET = ${num(t.operatingNet)} (${num(t.income)}-${num(t.dailyExpenses)})`,
  ].join('\n');
}

/** Parcels for one week, plus week-by-week parcels for the month so far. */
export function parcelsText(label: string, week: Report, month: Report, depositNote?: string | null): string {
  const wk = monthWeekOf(week.from);
  const weeks = month.weeks.filter((w) => w.start <= week.to);
  const total = weeks.reduce((a, w) => a + w.parcels, 0);
  return [
    `${upper(label)} PARCELS REPORT`,
    `${upper(ordinal(wk.index))} WK ${weekSpan(week, ' - ')} ${upper(monthName(week.from))}`,
    '',
    ...week.days.filter((d) => d.entries > 0).map((d) => line(weekday(d.date), d.parcels)),
    '',
    `Total = ${num(week.totals.parcels)}`,
    '',
    ...weeks.map((w) => line(`${ordinal(w.index)} wk`, w.parcels)),
    '',
    `Total       ${num(total)}`,
    ...(depositNote ? ['', depositNote] : []),
  ].join('\n');
}

export function monthlyText(label: string, r: Report, currency: string): string {
  const t = r.totals;
  const cur = currency === 'KES' ? 'KSh' : currency;
  return [
    `${upper(label)} ${upper(monthName(r.from))} ${r.from.slice(0, 4)} MONTHLY CLOSING REPORT`,
    '',
    ...r.weeks.map((w) => `Week ${w.index} (${w.label}) - Income ${num(w.income)}, Exp ${num(w.dailyExpenses)}, Net ${num(w.operatingNet)}`),
    '',
    `Gross Income = ${cur} ${num(t.income)}`,
    `Daily Operating Expenses = ${cur} ${num(t.dailyExpenses)}`,
    `Operating ${label} = ${cur} ${num(t.operatingNet)}`,
    `Monthly Fixed Expenses = ${cur} ${num(t.fixedExpenses)}`,
    `NET BUSINESS INCOME = ${cur} ${num(t.netIncome)}`,
    '',
    `Parcels = ${cur} ${num(t.parcels)}`,
    `Driver Payments = ${cur} ${num(t.driverPayments)}`,
    ...(t.wages ? [`Wages (other employees) = ${cur} ${num(t.wages)}`] : []),
    ...(t.tithe ? [`Tithe = ${cur} ${num(t.tithe)}`] : []),
  ].join('\n');
}
