// Parsing for self-hosted Android releases (GitHub Releases on the mobile repo).
// The release script writes machine-readable lines into the release notes:
//
//   version-code: 3
//   sha256: <64 hex chars of the APK>
//   min-version-code: 2        (optional: older installs must update)
//
// Everything else in the notes is shown to users as "What's new".

export interface AppRelease {
  versionName: string;
  versionCode: number;
  /** Installs below this code must update before continuing. */
  minVersionCode: number;
  notes: string;
  sha256: string;
  size: number;
  publishedAt: string;
}

export interface GithubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  assets: { id: number; name: string; size: number }[];
}

const META = /^\s*(version-code|sha256|min-version-code)\s*:\s*(\S+)\s*$/i;

/** Turns a GitHub release into an AppRelease, or null if it isn't a valid app release. */
export function parseRelease(r: GithubRelease): (AppRelease & { assetId: number }) | null {
  const apk = r.assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
  if (!apk || r.draft) return null;
  const meta: Record<string, string> = {};
  const notes: string[] = [];
  for (const line of (r.body ?? '').split(/\r?\n/)) {
    const m = META.exec(line);
    if (m) meta[m[1].toLowerCase()] = m[2];
    else notes.push(line);
  }
  const versionCode = Number(meta['version-code']);
  const sha256 = (meta.sha256 ?? '').toLowerCase();
  if (!Number.isInteger(versionCode) || versionCode < 1 || !/^[0-9a-f]{64}$/.test(sha256)) return null;
  const min = Number(meta['min-version-code']);
  return {
    versionName: r.tag_name.replace(/^v/i, ''),
    versionCode,
    minVersionCode: Number.isInteger(min) && min > 0 ? min : 0,
    notes: notes.join('\n').trim(),
    sha256,
    size: apk.size,
    publishedAt: r.published_at ?? '',
    assetId: apk.id,
  };
}

/** Highest-versionCode valid release (prereleases only when allowed). */
export function pickLatest(list: GithubRelease[], includePrerelease = false) {
  return list
    .filter((r) => includePrerelease || !r.prerelease)
    .map(parseRelease)
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.versionCode - a.versionCode)[0] ?? null;
}
