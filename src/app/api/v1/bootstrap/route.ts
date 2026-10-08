import { route } from '@/lib/api';
import { allowedVehicleIds, requireTenant } from '@/lib/auth.server';
import { listCategories } from '@/lib/data/categories.server';
import { listVehicles } from '@/lib/data/vehicles.server';

// One call for the Android app on start-up / refresh: who am I, which
// vehicles can I record for, and which expense categories exist.
export const GET = route(async () => {
  const ctx = await requireTenant();
  const [vehicles, categories] = await Promise.all([
    listVehicles(ctx.orgId, await allowedVehicleIds(ctx)),
    listCategories(ctx.orgId),
  ]);
  return { user: ctx.user, organization: ctx.organization, vehicles, categories };
});
