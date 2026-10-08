'use client';

import { CalendarX, Coins, HeartHandshake, Package, ReceiptText, TrendingUp, User, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { VehicleSelect, currentMonth, monthRange, useVehicles } from '@/components/filters';
import { useCurrency, useSession } from '@/components/session-context';
import { Empty, IconBadge, KpiCard, Loading, PageHeader, netClass } from '@/components/ui';
import { type ChartPalette, useChartColors } from '@/lib/chart-colors';
import { api, errMsg } from '@/lib/client';
import { num } from '@/lib/format';
import type { Report } from '@/lib/reports';

const short = (n: number) => (Math.abs(n) >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

/** % change vs last month; null when last month has nothing to compare against. */
const delta = (cur: number, prev?: number) => (prev === undefined || prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);

function prevMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return d.toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const user = useSession();
  const cur = useCurrency();
  const c = useChartColors();
  const vehicles = useVehicles();
  const [month, setMonth] = useState(currentMonth());
  const [vehicleId, setVehicleId] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [prev, setPrev] = useState<Report['totals'] | null>(null);
  const [error, setError] = useState('');
  // When the selected month is empty, point at the latest month that has entries.
  const [latestMonth, setLatestMonth] = useState<string | null>(null);

  useEffect(() => {
    const { from, to } = monthRange(month);
    const p = monthRange(prevMonth(month));
    const v = vehicleId ? `&vehicleId=${vehicleId}` : '';
    setReport(null);
    setPrev(null);
    api<Report>(`/reports/summary?from=${from}&to=${to}${v}`)
      .then(setReport)
      .catch((e) => setError(errMsg(e)));
    api<Report>(`/reports/summary?from=${p.from}&to=${p.to}${v}`)
      .then((r) => setPrev(r.totals.entryCount > 0 ? r.totals : null))
      .catch(() => setPrev(null));
  }, [month, vehicleId]);

  const monthEmpty = report?.totals.entryCount === 0 && report.totals.fixedExpenses === 0;
  useEffect(() => {
    if (!monthEmpty) return setLatestMonth(null);
    api<{ entryDate: string }[]>(`/entries?limit=1${vehicleId ? `&vehicleId=${vehicleId}` : ''}`)
      .then((r) => setLatestMonth(r[0] && r[0].entryDate.slice(0, 7) !== month ? r[0].entryDate.slice(0, 7) : null))
      .catch(() => setLatestMonth(null));
  }, [monthEmpty, month, vehicleId]);

  /** "KSh 40,060"; losses as "-KSh 40,373". */
  const money = (n: number) => (Math.round(n) < 0 ? `-${cur} ${num(-n)}` : `${cur} ${num(n)}`);
  const t = report?.totals;
  // Weeks that haven't started yet would plot as misleading zeros.
  const todayStr = new Date().toISOString().slice(0, 10);
  const pastWeeks = (report?.weeks ?? []).filter((w) => w.start <= todayStr);
  const pastDays = (report?.days ?? []).filter((d) => d.date <= todayStr);
  const tooltip = {
    formatter: (v: number) => money(v),
    contentStyle: { borderRadius: 12, fontSize: 12, background: c.surface, border: `1px solid ${c.grid}`, color: c.text },
    labelStyle: { color: c.text, fontWeight: 600 },
  };
  const axis = { tick: { fill: c.axis, fontSize: 12 }, axisLine: false, tickLine: false };
  const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return (
    <div>
      <PageHeader
        title={`Hi ${user.fullName.split(' ')[0]}`}
        subtitle="Fleet performance for the selected month"
        actions={
          <>
            <input type="month" className="input w-auto" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
            <VehicleSelect vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />
          </>
        }
      />
      {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {!report || !t ? (
        <Loading />
      ) : monthEmpty ? (
        <Empty icon={CalendarX} title={`No entries for ${monthName(month)}`}>
          Start recording today&apos;s collection and expenses.
          <div className="mt-4 flex flex-col items-center gap-2">
            <Link href="/entries/new" className="btn-primary">
              + New entry
            </Link>
            {latestMonth && (
              <button type="button" onClick={() => setMonth(latestMonth)} className="text-sm font-medium text-brand-600">
                View {monthName(latestMonth)} →
              </button>
            )}
          </div>
        </Empty>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Total income" value={money(t.income)} icon={Wallet} color={c.income} delta={delta(t.income, prev?.income)} />
            <KpiCard label="Total expenses" value={money(t.dailyExpenses)} icon={ReceiptText} color={c.expenses} delta={delta(t.dailyExpenses, prev?.dailyExpenses)} upIsGood={false} />
            <KpiCard label="Operating net" value={money(t.operatingNet)} icon={TrendingUp} color={c.net} delta={delta(t.operatingNet, prev?.operatingNet)} valueClass={netClass(t.operatingNet)} />
            <KpiCard label="Net business" value={money(t.netIncome)} icon={Coins} color={c.parcels} delta={delta(t.netIncome, prev?.netIncome)} valueClass={netClass(t.netIncome)} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <MiniStat label="Parcels" value={num(t.parcels)} icon={Package} color={c.parcels} />
            <MiniStat label="Driver pay" value={num(t.driverPayments)} icon={User} color={c.income} />
            <MiniStat label="Fixed costs" value={num(t.fixedExpenses)} icon={ReceiptText} color="#d97706" />
            <MiniStat label="Wages (others)" value={num(t.wages)} icon={Users} color={c.parcels} />
            <MiniStat label="Tithe" value={num(t.tithe)} icon={HeartHandshake} color={c.net} />
          </div>

          <h2 className="text-base font-semibold">Analytics</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Weekly income vs daily expenses">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pastWeeks.map((w) => ({ name: `W${w.index}`, label: w.label, Income: w.income, Expenses: w.dailyExpenses }))} barGap={2}>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="name" {...axis} />
                  <YAxis tickFormatter={short} {...axis} width={40} />
                  <Tooltip {...tooltip} labelFormatter={(_l, p) => p?.[0]?.payload?.label ?? ''} cursor={{ fill: c.cursor }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: c.axis }} />
                  <Bar dataKey="Income" fill={c.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Expenses" fill={c.expenses} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Operating net trend" caption="Income − daily expenses, per week">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={pastWeeks.map((w) => ({ name: `W${w.index}`, label: w.label, Net: w.operatingNet }))}>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="name" {...axis} padding={{ left: 12, right: 12 }} />
                  <YAxis tickFormatter={short} {...axis} width={40} />
                  <Tooltip {...tooltip} labelFormatter={(_l, p) => p?.[0]?.payload?.label ?? ''} />
                  <Line
                    dataKey="Net"
                    stroke={c.net}
                    strokeWidth={2}
                    dot={(p: { cx?: number; cy?: number; value?: number; index?: number }) => (
                      <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill={(p.value ?? 0) < 0 ? c.negative : c.net} stroke={c.surface} strokeWidth={2} />
                    )}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <ChartCard title="Collection trend" caption="Daily total collection" className="lg:col-span-3">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={pastDays.map((d) => ({ name: String(Number(d.date.slice(8))), date: d.date, Collection: d.income }))}>
                  <defs>
                    <linearGradient id="collectionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.income} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={c.income} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={c.grid} />
                  <XAxis dataKey="name" {...axis} tick={{ fill: c.axis, fontSize: 11 }} interval={4} />
                  <YAxis tickFormatter={short} {...axis} width={40} />
                  <Tooltip {...tooltip} labelFormatter={(_l, p) => p?.[0]?.payload?.date ?? ''} />
                  <Area dataKey="Collection" stroke={c.income} strokeWidth={2} fill="url(#collectionFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Expense breakdown" caption="Daily expenses by category" className="lg:col-span-2">
              <ExpenseDonut report={report} money={money} c={c} />
            </ChartCard>
          </div>

          <div className="card overflow-x-auto">
            <h2 className="px-4 pt-4 text-sm font-semibold">Weekly performance</h2>
            <table className="mt-2 w-full min-w-[520px]">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="th">Week</th>
                  <th className="th">Period</th>
                  <th className="th text-right">Income</th>
                  <th className="th text-right">Expenses</th>
                  <th className="th text-right">Operating net</th>
                  <th className="th text-right">Parcels</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.weeks.map((w) => (
                  <tr key={w.index}>
                    <td className="td font-medium">Week {w.index}</td>
                    <td className="td text-slate-500">{w.label}</td>
                    <td className="td text-right tabular-nums">{num(w.income)}</td>
                    <td className="td text-right tabular-nums">{num(w.dailyExpenses)}</td>
                    <td className={`td text-right font-semibold tabular-nums ${netClass(w.operatingNet)}`}>{num(w.operatingNet)}</td>
                    <td className="td text-right tabular-nums">{num(w.parcels)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="td" colSpan={2}>
                    Total
                  </td>
                  <td className="td text-right tabular-nums">{num(t.income)}</td>
                  <td className="td text-right tabular-nums">{num(t.dailyExpenses)}</td>
                  <td className={`td text-right tabular-nums ${netClass(t.operatingNet)}`}>{num(t.operatingNet)}</td>
                  <td className="td text-right tabular-nums">{num(t.parcels)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {!vehicleId && report.vehicles.length > 1 && (
            <div className="card overflow-x-auto">
              <h2 className="px-4 pt-4 text-sm font-semibold">By vehicle</h2>
              <table className="mt-2 w-full min-w-[600px]">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="th">Vehicle</th>
                    <th className="th text-right">Days</th>
                    <th className="th text-right">Income</th>
                    <th className="th text-right">Daily exp.</th>
                    <th className="th text-right">Operating net</th>
                    <th className="th text-right">Fixed</th>
                    <th className="th text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.vehicles.map((v) => (
                    <tr key={v.vehicleId} className="cursor-pointer hover:bg-slate-50" onClick={() => setVehicleId(v.vehicleId)}>
                      <td className="td font-medium">{v.registration}</td>
                      <td className="td text-right">{v.entries}</td>
                      <td className="td text-right tabular-nums">{num(v.income)}</td>
                      <td className="td text-right tabular-nums">{num(v.dailyExpenses)}</td>
                      <td className="td text-right tabular-nums">{num(v.operatingNet)}</td>
                      <td className="td text-right tabular-nums">{num(v.fixedExpenses)}</td>
                      <td className={`td text-right font-semibold tabular-nums ${netClass(v.netIncome)}`}>{num(v.netIncome)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, caption, className, children }: { title: string; caption?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`card p-4 ${className ?? ''}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {caption && <p className="text-xs text-slate-500">{caption}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: typeof Wallet; color: string }) {
  return (
    <div className="card flex items-center gap-3 px-3 py-2.5">
      <IconBadge icon={icon} color={color} size={30} />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-xs text-slate-500">{label}</div>
        <div className="truncate text-sm font-bold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

/** Part-to-whole: top 5 categories + neutral "Other"; colour follows the category, not its rank. */
function ExpenseDonut({ report, money, c }: { report: Report; money: (n: number) => string; c: ChartPalette }) {
  const items = report.dailyByCategory.filter((i) => i.amount > 0).sort((a, b) => b.amount - a.amount);
  if (!items.length) return <p className="text-sm text-slate-500">No expenses recorded.</p>;
  // Colour slot follows the category's position in the workspace list, not its rank this month.
  const top = items.length > 6 ? items.slice(0, 5) : items;
  const rest = items.length > 6 ? items.slice(5).reduce((a, i) => a + i.amount, 0) : 0;
  const slices = [
    ...top.map((i) => ({ name: i.name, value: i.amount, color: c.categorical[i.sortOrder ?? 99] ?? c.other })),
    ...(rest ? [{ name: 'Other', value: rest, color: c.other }] : []),
  ];
  const total = slices.reduce((a, s) => a + s.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="100%" paddingAngle={1.5} stroke={c.surface} strokeWidth={2} isAnimationActive={false}>
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => money(v)} contentStyle={{ borderRadius: 12, fontSize: 12, background: c.surface, border: `1px solid ${c.grid}`, color: c.text }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Total</span>
          <span className="text-base font-bold tabular-nums">{short(total)}</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-sm">
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 truncate">{s.name}</span>
            <span className="tabular-nums text-slate-500">{money(s.value)}</span>
            <span className="w-10 text-right font-semibold tabular-nums">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
