import 'server-only';
import { type GithubRelease, pickLatest } from './app-release';
import { HttpError } from './errors';

// GITHUB_RELEASES_REPO: "owner/repo" holding the APK releases (private is fine).
// GITHUB_RELEASES_TOKEN: fine-grained token with read-only Contents access to that repo.
// GITHUB_RELEASES_PRERELEASE=true also offers prereleases (for testing builds).
const repo = () => process.env.GITHUB_RELEASES_REPO;
const token = () => process.env.GITHUB_RELEASES_TOKEN;

export const releasesConfigured = () => Boolean(repo() && token());

const gh = (path: string, init?: RequestInit) =>
  fetch(`https://api.github.com/repos/${repo()}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token()}`, 'x-github-api-version': '2022-11-28', accept: 'application/vnd.github+json', ...init?.headers },
    cache: 'no-store',
  });

// Phones check on every launch; cache GitHub's answer briefly to stay far below its rate limit.
let cached: { at: number; value: ReturnType<typeof pickLatest> } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function latestRelease() {
  if (!releasesConfigured()) return null;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const res = await gh('/releases?per_page=20');
  if (!res.ok) throw new HttpError(502, `Release server error (${res.status})`);
  const value = pickLatest((await res.json()) as GithubRelease[], process.env.GITHUB_RELEASES_PRERELEASE === 'true');
  cached = { at: Date.now(), value };
  return value;
}

/** Short-lived, token-free download URL for a release asset (GitHub redirects to signed storage). */
export async function assetDownloadUrl(assetId: number): Promise<string> {
  const res = await gh(`/releases/assets/${assetId}`, { headers: { accept: 'application/octet-stream' }, redirect: 'manual' });
  const location = res.headers.get('location');
  if (res.status >= 300 && res.status < 400 && location) return location;
  throw new HttpError(502, `Could not get the download link (${res.status})`);
}
