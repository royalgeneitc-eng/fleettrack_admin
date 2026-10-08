import { route } from '@/lib/api';
import { requireSuperAdmin } from '@/lib/auth.server';
import { sql } from '@/lib/db';

export const GET = route(async () => {
  await requireSuperAdmin();
  return sql`
    select o.id, o.name, o.slug, o.status, o.currency, o.created_at as "createdAt",
           (select count(*)::int from users u where u.organization_id = o.id) as "userCount",
           (select count(*)::int from vehicles v where v.organization_id = o.id and v.deleted_at is null) as "vehicleCount",
           (select count(*)::int from daily_entries e where e.organization_id = o.id and e.deleted_at is null) as "entryCount",
           (select max(e.entry_date) from daily_entries e where e.organization_id = o.id and e.deleted_at is null) as "lastEntryDate",
           (select u.email from users u where u.organization_id = o.id and u.role = 'owner' order by u.created_at limit 1) as "ownerEmail"
    from organizations o order by o.created_at desc`;
});
