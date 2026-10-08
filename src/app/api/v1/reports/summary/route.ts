import { query, route } from '@/lib/api';
import { allowedVehicleIds, requireTenant } from '@/lib/auth.server';
import { loadReport } from '@/lib/data/reports.server';
import { fmtDate, isValidDate, monthEnd, monthStart } from '@/lib/dates';
import { badRequest } from '@/lib/errors';

// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD[&vehicleId=] — defaults to this month.
export const GET = route(async (req) => {
  const ctx = await requireTenant();
  const q = query(req);
  const today = fmtDate(new Date());
  const from = q.get('from') || monthStart(today);
  const to = q.get('to') || monthEnd(today);
  if (!isValidDate(from) || !isValidDate(to) || from > to) throw badRequest('Invalid date range');
  return loadReport({ orgId: ctx.orgId, from, to, vehicleId: q.get('vehicleId') || undefined, allowed: await allowedVehicleIds(ctx) });
});
