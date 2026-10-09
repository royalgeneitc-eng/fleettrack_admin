import { route } from '@/lib/api';
import { latestRelease } from '@/lib/app-release.server';
import { requireUser } from '@/lib/auth.server';

/** Newest Android release, or { release: null } when none is published / updates aren't configured. */
export const GET = route(async () => {
  await requireUser();
  const r = await latestRelease();
  if (!r) return { release: null };
  const { assetId: _a, ...release } = r;
  return { release };
});
