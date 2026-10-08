import { query, route } from '@/lib/api';
import { allowedVehicleIds, requireTenant } from '@/lib/auth.server';
import { loadReport } from '@/lib/data/reports.server';
import { getVehicle, vehicleLabel } from '@/lib/data/vehicles.server';
import { fmtDate, isValidDate, monthEnd, monthStart, monthWeekOf } from '@/lib/dates';
import { badRequest, notFound } from '@/lib/errors';
import { dailyText, monthlyText, parcelsText, weeklyText } from '@/lib/text-report';

// WhatsApp-ready text. GET ?type=daily|weekly|parcels|monthly&date=YYYY-MM-DD[&vehicleId=]
// weekly/parcels use the month-week containing `date`; monthly uses its month.
export const GET = route(async (req) => {
  const ctx = await requireTenant();
  const q = query(req);
  const type = q.get('type') ?? 'daily';
  const date = q.get('date') || fmtDate(new Date());
  if (!isValidDate(date)) throw badRequest('Invalid date');
  const vehicleId = q.get('vehicleId') || undefined;
  let label = 'FLEET';
  if (vehicleId) {
    const v = await getVehicle(ctx.orgId, vehicleId);
    if (!v) throw notFound('Vehicle not found');
    label = vehicleLabel(v);
  }
  const allowed = await allowedVehicleIds(ctx);
  const load = (from: string, to: string) => loadReport({ orgId: ctx.orgId, from, to, vehicleId, allowed });
  const wk = monthWeekOf(date);

  let text: string;
  switch (type) {
    case 'daily':
      text = dailyText(label, await load(date, date));
      break;
    case 'weekly':
      text = weeklyText(label, await load(wk.start, wk.end));
      break;
    case 'parcels': {
      const [week, month] = await Promise.all([load(wk.start, wk.end), load(monthStart(date), monthEnd(date))]);
      text = parcelsText(label, week, month);
      break;
    }
    case 'monthly':
      text = monthlyText(label, await load(monthStart(date), monthEnd(date)), ctx.organization.currency);
      break;
    default:
      throw badRequest('type must be daily, weekly, parcels or monthly');
  }
  return { type, date, text };
});
