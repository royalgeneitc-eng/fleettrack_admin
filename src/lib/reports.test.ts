import { describe, expect, it } from 'vitest';
import { monthWeekOf, weekBuckets } from './dates';
import { computeReport, type ReportExpenseLine } from './reports';
import { dailyText, parcelsText, weeklyText } from './text-report';

// Real figures from the KCX September 2026 WhatsApp reports.
const V = { id: 'v1', registration: 'KCX' };
const cat = (id: string, name: string, sortOrder: number, tag: ReportExpenseLine['tag'] = null) => ({ categoryId: id, categoryName: name, sortOrder, tag });
const C = {
  sacco: cat('c1', 'Sacco', 1),
  fuel: cat('c2', 'Fuel', 2),
  driver: cat('c3', 'Driver', 3, 'driver'),
  gate: cat('c4', 'Gate', 4),
  expw: cat('c5', 'ExpW', 5),
  wash: cat('c6', 'Car wash', 6),
  police: cat('c7', 'Police', 7),
};

describe('dates', () => {
  it('numbers Sept 2026 weeks like the owner does', () => {
    const w = weekBuckets('2026-09-01', '2026-09-30');
    expect(w.map((x) => [x.start, x.end])).toEqual([
      ['2026-09-01', '2026-09-06'],
      ['2026-09-07', '2026-09-13'],
      ['2026-09-14', '2026-09-20'],
      ['2026-09-21', '2026-09-27'],
      ['2026-09-28', '2026-09-30'],
    ]);
    expect(monthWeekOf('2026-09-15').index).toBe(3);
    expect(monthWeekOf('2026-09-21').index).toBe(4);
  });
});

describe('daily report (Tue 15/9/2026)', () => {
  const entries = [{ id: 'e1', vehicleId: 'v1', date: '2026-09-15', income: 9230, parcels: 0 }];
  const lines = [
    { entryId: 'e1', ...C.sacco, amount: 810 },
    { entryId: 'e1', ...C.fuel, amount: 2817 },
    { entryId: 'e1', ...C.driver, amount: 500 },
    { entryId: 'e1', ...C.expw, amount: 620 },
    { entryId: 'e1', ...C.gate, amount: 250 },
    { entryId: 'e1', ...C.police, amount: 50 },
    { entryId: 'e1', ...C.wash, amount: 250 },
  ];
  const r = computeReport({ from: '2026-09-15', to: '2026-09-15', vehicles: [V], entries, expenseLines: lines, fixedLines: [] });

  it('matches the hand calculation', () => {
    expect(r.totals.dailyExpenses).toBe(5297);
    expect(r.totals.operatingNet).toBe(3933);
    expect(r.totals.driverPayments).toBe(500);
  });

  it('renders the WhatsApp text', () => {
    const t = dailyText('KCX', r);
    expect(t).toContain('3RD wk of SEPTEMBER');
    expect(t).toContain('Tuesday 15/9/2026 KCX Report');
    expect(t).toContain('Expense = 5,297');
    expect(t).toContain('Net = 3,933 (9,230-5,297)');
  });
});

describe('weekly report (4th week 21st–26th Sept)', () => {
  const days: [string, number, number][] = [
    ['2026-09-21', 17020, 950],
    ['2026-09-22', 14760, 1480],
    ['2026-09-23', 14230, 300],
    ['2026-09-24', 13960, 250],
    ['2026-09-25', 17110, 900],
    ['2026-09-26', 7780, 0],
  ];
  const entries = days.map(([date, income, parcels], i) => ({ id: `e${i}`, vehicleId: 'v1', date, income, parcels }));
  // Week totals per category from the report, booked on Monday's entry.
  const lines = [
    { entryId: 'e0', ...C.sacco, amount: 8190 },
    { entryId: 'e0', ...C.fuel, amount: 25293 },
    { entryId: 'e0', ...C.driver, amount: 5400 },
    { entryId: 'e0', ...C.gate, amount: 1600 },
    { entryId: 'e0', ...C.expw, amount: 6820 },
    { entryId: 'e0', ...C.wash, amount: 500 },
    { entryId: 'e0', ...C.police, amount: 350 },
  ];
  const r = computeReport({ from: '2026-09-21', to: '2026-09-27', vehicles: [V], entries, expenseLines: lines, fixedLines: [] });

  it('matches the hand calculation', () => {
    expect(r.totals.income).toBe(84860);
    expect(r.totals.parcels).toBe(3880);
    expect(r.totals.dailyExpenses).toBe(48153);
    expect(r.totals.operatingNet).toBe(36707);
  });

  it('renders the WhatsApp text', () => {
    const t = weeklyText('KCX', r);
    expect(t).toContain('KCX SEPTEMBER REPORT');
    expect(t).toContain('4TH WEEK 21st-26th');
    expect(t).toContain('Saturday - 7,780');
    expect(t).toContain('Total Income = 84,860');
    expect(t).toContain('KCX NET = 36,707 (84,860-48,153)');
  });

  it('renders the parcels text with month-to-date weeks', () => {
    const month = computeReport({
      from: '2026-09-01',
      to: '2026-09-30',
      vehicles: [V],
      entries: [
        { id: 'a', vehicleId: 'v1', date: '2026-09-02', income: 0, parcels: 7230 },
        { id: 'b', vehicleId: 'v1', date: '2026-09-08', income: 0, parcels: 10200 },
        { id: 'c', vehicleId: 'v1', date: '2026-09-15', income: 0, parcels: 5420 },
        ...entries,
      ],
      expenseLines: [],
      fixedLines: [],
    });
    const t = parcelsText('KCX', r, month, 'To be Deposited in Equity Account');
    expect(t).toContain('4TH WK 21st - 26th SEPTEMBER');
    expect(t).toContain('Total = 3,880');
    expect(t).toContain('4th wk - 3,880');
    expect(t).toContain('Total       26,730');
  });
});

describe('monthly (June 2026 closing report)', () => {
  it('net business income = gross − daily − fixed', () => {
    const r = computeReport({
      from: '2026-06-01',
      to: '2026-06-30',
      vehicles: [V],
      entries: [{ id: 'e', vehicleId: 'v1', date: '2026-06-03', income: 313970, parcels: 17220 }],
      expenseLines: [{ entryId: 'e', ...C.fuel, amount: 168286 }],
      fixedLines: [{ vehicleId: 'v1', ...cat('f1', 'Insurance', 1), amount: 64626 }],
    });
    expect(r.totals.operatingNet).toBe(145684);
    expect(r.totals.netIncome).toBe(81058);
    expect(r.vehicles[0].netIncome).toBe(81058);
  });
});
