import { NextResponse } from 'next/server';
import { query, route } from '@/lib/api';
import { assetDownloadUrl, latestRelease } from '@/lib/app-release.server';
import { requireUser } from '@/lib/auth.server';
import { notFound } from '@/lib/errors';

/**
 * Download link for the latest APK (signed users only). The app gets JSON and
 * fetches the URL itself; `?redirect=1` (portal button) redirects the browser.
 */
export const GET = route(async (req) => {
  await requireUser();
  const r = await latestRelease();
  if (!r) throw notFound('No app release has been published yet');
  const url = await assetDownloadUrl(r.assetId);
  if (query(req).get('redirect') === '1') return NextResponse.redirect(url, 302);
  return { url, versionCode: r.versionCode, versionName: r.versionName, sha256: r.sha256, size: r.size };
});
