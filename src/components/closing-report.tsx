'use client';

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LIGHT_CHART } from '@/lib/chart-colors';

// A printable document: always light (`.paper`), whatever the screen theme.
const SERIES = LIGHT_CHART;
const GRID = LIGHT_CHART.grid;
const AXIS = LIGHT_CHART.axis;
import { MONTHS } from '@/lib/dates';
import { num } from '@/lib/format';
import type { Report } from '@/lib/reports';
import type { Organization } from '@/lib/types';

const short = (n: number) => (Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

/** Printable monthly closing report, modelled on the owner's existing PDF reports. */
export function ClosingReport({ report, org, label, month }: { report: Report; org: Organization; label: string; month: string }) {
  const t = report.totals;
  // Weeks that haven't started yet would plot as misleading zeros.
  const todayStr = new Date().toISOString().slice(0, 10);
  const pastWeeks = report.weeks.filter((w) => w.start <= todayStr);
  const cur = org.currency === 'KES' ? 'KSh' : org.currency;
  const m = (n: number) => `${cur} ${num(n)}`;
  const monthTitle = `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
  const best = [...report.weeks].sort((a, b) => b.income - a.income)[0];
  const pct = (n: number) => (t.income ? `${((n / t.income) * 100).toFixed(1)}%` : '—');
  const tooltip = { formatter: (v: number) => m(v), contentStyle: { borderRadius: 8, fontSize: 12 } };

  return (
    <div className="paper w-full rounded-2xl bg-surface p-4 text-slate-900 shadow-sm print:rounded-none print:p-0 print:shadow-none sm:p-6">
      <header className="flex flex-col gap-4 border-b-4 border-brand-900 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {org.logoUrl && <img src={org.logoUrl} alt="" className="h-16 w-16 object-contain" />}
          <div>
            <div className="text-2xl font-extrabold text-brand-900">
              {label.toUpperCase()} {monthTitle.toUpperCase()}
            </div>
            <div className="text-xl font-bold text-brand-500">MONTHLY CLOSING REPORT</div>
            <div className="mt-1 text-xs text-slate-500">Income, expenses and key operational performance for {monthTitle}.</div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-600">
          <div className="text-sm font-semibold text-slate-900">{org.name}</div>
          {org.tagline && <div>{org.tagline}</div>}
          {org.phone && <div>{org.phone}</div>}
          {org.email && <div>{org.email}</div>}
        </div>
      </header>

      <h2 className="mt-6 text-center text-sm font-bold tracking-widest text-brand-900">EXECUTIVE SUMMARY</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['Gross income', t.income],
          ['Daily operating expenses', t.dailyExpenses],
          [`Operating ${label}`, t.operatingNet],
          ['Monthly fixed expenses', t.fixedExpenses],
          ['Net business income', t.netIncome],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg border border-slate-200 p-3 text-center">
            <div className="text-[10px] font-semibold uppercase text-slate-500">{k}</div>
            <div className={`mt-1 text-base font-bold ${(v as number) < 0 ? 'text-red-600' : 'text-brand-900'}`}>{m(v as number)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 sm:col-span-3">
          <div className="bg-brand-900 px-3 py-2 text-xs font-bold text-white">WEEKLY INCOME &amp; PERFORMANCE</div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-1.5 text-left">Week</th>
                <th className="px-2 py-1.5 text-left">Period</th>
                <th className="px-2 py-1.5 text-right">Income</th>
                <th className="px-2 py-1.5 text-right">Daily exp.</th>
                <th className="px-2 py-1.5 text-right">Operating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.weeks.map((w) => (
                <tr key={w.index}>
                  <td className="px-2 py-1.5">Week {w.index}</td>
                  <td className="px-2 py-1.5 text-slate-500">{w.label}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{num(w.income)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{num(w.dailyExpenses)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{num(w.operatingNet)}</td>
                </tr>
              ))}
              <tr className="bg-brand-900 font-bold text-white">
                <td className="px-2 py-1.5" colSpan={2}>
                  TOTAL
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">{num(t.income)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{num(t.dailyExpenses)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{num(t.operatingNet)}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className="overflow-hidden rounded-lg border border-slate-200 sm:col-span-2">
          <div className="bg-brand-900 px-3 py-2 text-xs font-bold text-white">MONTHLY SUMMARY</div>
          <dl className="divide-y divide-slate-100 text-xs">
            {[
              ['Gross income', t.income, ''],
              ['Daily operating expenses', t.dailyExpenses, 'text-red-600'],
              [`Operating ${label}`, t.operatingNet, 'font-semibold'],
              ['Monthly fixed expenses', t.fixedExpenses, 'text-red-600'],
              ['NET BUSINESS INCOME', t.netIncome, 'font-bold text-brand-900 bg-blue-50'],
              ['Parcel collections', t.parcels, ''],
              ['Driver payments', t.driverPayments, ''],
              ...(t.wages ? [['Wages to other employees', t.wages, '']] : []),
              ...(t.tithe ? [['Tithe', t.tithe, '']] : []),
            ].map(([k, v, cls]) => (
              <div key={k as string} className={`flex justify-between px-3 py-1.5 ${cls}`}>
                <dt>{k}</dt>
                <dd className="tabular-nums">{m(v as number)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 text-xs font-bold text-brand-900">INCOME vs DAILY EXPENSES</div>
          <div className="mb-1 flex gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES.income }} /> Income
            </span>
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-full" style={{ background: SERIES.expenses }} /> Daily expenses
            </span>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={pastWeeks.map((w) => ({ name: `W${w.index}`, Income: w.income, Expenses: w.dailyExpenses }))} barGap={2}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={short} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip {...tooltip} cursor={{ fill: LIGHT_CHART.cursor }} />
              <Bar dataKey="Income" fill={SERIES.income} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              <Bar dataKey="Expenses" fill={SERIES.expenses} radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 text-xs font-bold text-brand-900">OPERATING {label.toUpperCase()} TREND</div>
          <div className="mb-1 h-[15px]" />
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={pastWeeks.map((w) => ({ name: `W${w.index}`, Operating: w.operatingNet }))}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={short} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip {...tooltip} />
              <Line dataKey="Operating" stroke={SERIES.net} strokeWidth={2} dot={{ r: 4, fill: SERIES.net }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <WeekTable title="PARCEL COLLECTIONS" rows={report.weeks.map((w) => [w.index, w.label, w.parcels])} total={t.parcels} />
        <WeekTable title="DRIVER PAYMENTS" rows={report.weeks.map((w) => [w.index, w.label, w.driverPayments])} total={report.weeks.reduce((a, w) => a + w.driverPayments, 0)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Breakdown title={`DAILY OPERATING EXPENSES (${m(t.dailyExpenses)})`} items={report.dailyByCategory} />
        <Breakdown title={`MONTHLY FIXED EXPENSES (${m(t.fixedExpenses)})`} items={report.fixedByCategory} />
      </div>

      <section className="mt-4 rounded-lg border border-slate-200 p-4 text-xs text-slate-700">
        <div className="mb-2 font-bold text-brand-900">KEY INSIGHTS</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Gross income for {monthTitle} was {m(t.income)} across {t.entryCount} recorded day(s).</li>
          <li>
            After daily operating expenses of {m(t.dailyExpenses)} ({pct(t.dailyExpenses)} of income), operating {label} stood at {m(t.operatingNet)}.
          </li>
          <li>
            After monthly fixed expenses of {m(t.fixedExpenses)}, net business income is {m(t.netIncome)} ({pct(t.netIncome)} of income).
          </li>
          {best && best.income > 0 && (
            <li>
              Best week: Week {best.index} ({best.label}) with {m(best.income)} income.
            </li>
          )}
          <li>
            Parcel collections totalled {m(t.parcels)}; driver payments totalled {m(t.driverPayments)}.
          </li>
        </ul>
      </section>
      <footer className="mt-6 bg-brand-900 py-2 text-center text-xs font-semibold text-white">{org.name.toUpperCase()}</footer>
    </div>
  );
}

function WeekTable({ title, rows, total }: { title: string; rows: [number, string, number][]; total: number }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200">
      <div className="bg-violet-800 px-3 py-2 text-xs font-bold text-white">{title}</div>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-100">
          {rows.map(([i, label, v]) => (
            <tr key={i}>
              <td className="px-2 py-1.5">Week {i}</td>
              <td className="px-2 py-1.5 text-slate-500">{label}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{num(v)}</td>
            </tr>
          ))}
          <tr className="bg-violet-50 font-bold">
            <td className="px-2 py-1.5" colSpan={2}>
              TOTAL
            </td>
            <td className="px-2 py-1.5 text-right tabular-nums">{num(total)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

function Breakdown({ title, items }: { title: string; items: { categoryId: string; name: string; amount: number }[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200">
      <div className="bg-red-800 px-3 py-2 text-xs font-bold text-white">{title}</div>
      {items.length ? (
        <dl className="divide-y divide-slate-100 text-xs">
          {items.map((i) => (
            <div key={i.categoryId} className="flex justify-between px-3 py-1.5">
              <dt>{i.name}</dt>
              <dd className="tabular-nums">{num(i.amount)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="p-3 text-xs text-slate-500">None recorded.</p>
      )}
    </section>
  );
}
