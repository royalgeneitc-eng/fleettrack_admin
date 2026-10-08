import { route } from '@/lib/api';
import { requireUser } from '@/lib/auth.server';

export const GET = route(async () => ({ user: await requireUser() }));
